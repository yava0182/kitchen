 'kitchen_templates': function(B) {
   if (Array.isArray(B)) {
     var C = {
       'categories': [],
       'items': B
     };
     for (let D = 0; D < B.length; D++)
       B[D]['category'] = 0;
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
   for (let C = 0; C < kitchen_styles.length; C++)
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
     document['getElementById']('pp_core_v2') && (constructor_settings['core_v2'] = 1),
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
     void 0 === constructor_settings['pdf_password'] && (constructor_settings['pdf_use_password'] = 0),
     void 0 === constructor_settings['pdf_password'] && (constructor_settings['pdf_password'] = ''),
     constructor_settings['pdf_settings'] && (Object['keys'](constructor_settings['pdf_settings'])['forEach'](function(
         C) {
         pdf_settings[C] = constructor_settings['pdf_settings'][C],
           'report_additional_text' != C && (pdf_settings[C] = '1' === pdf_settings[C]);
       }),
       null == pdf_settings['lm'] && (pdf_settings['lm'] = 85),
       null == pdf_settings['tm'] && (pdf_settings['tm'] = 56),
       null == pdf_settings['rm'] && (pdf_settings['rm'] = 42),
       null == pdf_settings['bm']) && (pdf_settings['bm'] = 56),
     null == pdf_settings['report_modules_sizes_column'] && (pdf_settings['report_modules_sizes_column'] = true),
     null == pdf_settings['report_modules_details'] && (pdf_settings['report_modules_details'] = true),
     null == pdf_settings['report_custom_cart_items'] && (pdf_settings['report_custom_cart_items'] = true),
     void 0 === constructor_settings['multiple_facades_mode'] && (constructor_settings['multiple_facades_mode'] =
     0),
     void 0 === constructor_settings['cornice_available'] && (constructor_settings['cornice_available'] = 1),
     void 0 === constructor_settings['custom_form'] && (constructor_settings['custom_form'] = 0),
     void 0 === constructor_settings['custom_order_url'] && (constructor_settings['custom_order_url'] = ''),
     void 0 === constructor_settings['custom_sizes_available'] && (constructor_settings['custom_sizes_available'] =
       'true'),
     void 0 !== constructor_settings['default_language'] && '' != constructor_settings['default_language'] || (
       constructor_settings['default_language'] = 'ru'),
     void 0 === constructor_settings['price_modificator'] ? constructor_settings['price_modificator'] = 1 :
     constructor_settings['price_modificator'] = parseFloat(constructor_settings['price_modificator']),
     void 0 === constructor_settings['price_modificator_dealer'] ? constructor_settings['price_modificator_dealer'] =
     1 : constructor_settings['price_modificator_dealer'] = parseFloat(constructor_settings[
       'price_modificator_dealer']),
     void 0 === constructor_settings['price_modificator_seller'] ? constructor_settings['price_modificator_seller'] =
     1 : constructor_settings['price_modificator_seller'] = parseFloat(constructor_settings[
       'price_modificator_seller']),
     void 0 === constructor_settings['facade_style_change_availabale'] ? constructor_settings[
       'facade_style_change_availabale'] = 1 : constructor_settings['facade_style_change_availabale'] = parseInt(
       constructor_settings['facade_style_change_availabale']),
     void 0 === constructor_settings['show_specs'] ? constructor_settings['show_specs'] = 1 : constructor_settings[
       'show_specs'] = parseInt(constructor_settings['show_specs']),
     void 0 === constructor_settings['allow_top_modules_mass_depth_change'] && (constructor_settings[
       'allow_top_modules_mass_depth_change'] = 0),
     constructor_settings['decorations_enabled'] || (constructor_settings['decorations_enabled'] = 0),
     constructor_settings['allow_common_mode'] || (constructor_settings['allow_common_mode'] = 0),
     constructor_settings['frontend_configurator_available'] ? constructor_settings['frontend_configurator_available'] =
     parseInt(constructor_settings['frontend_configurator_available']) : constructor_settings[
       'frontend_configurator_available'] = 0,
     constructor_settings['furniture_available'] = 1,
     constructor_settings['show_modules_names_in_sizes_select'] || (constructor_settings[
       'show_modules_names_in_sizes_select'] = 0),
     constructor_settings['furniture_available'] || (constructor_settings['furniture_available'] = 0),
     constructor_settings['icons_type'] || (constructor_settings['icons_type'] = 0),
     global_options['forced_common'] = 0,
     constructor_settings['email'] || (constructor_settings['email'] = {
       'use_custom_form': 0,
       'custom_form_data': []
     }),
     1 == constructor_settings['custom_lockers'] && (custom_lockers = true),
     null == constructor_settings['use_multiplier_in_furnitypes'] && (constructor_settings[
       'use_multiplier_in_furnitypes'] = 1),
     null == constructor_settings['use_corpus_direct_price'] && (constructor_settings['use_corpus_direct_price'] = 0),
     constructor_settings['sizes_limit'] ? 'object' != typeof constructor_settings['sizes_limit'] && (
       constructor_settings['sizes_limit'] = JSON['parse'](constructor_settings['sizes_limit'])) : constructor_settings[
       'sizes_limit'] = {
       'min_width': 0,
       'max_width': 0,
       'min_height': 0,
       'max_height': 0,
       'min_depth': 0,
       'max_depth': 0
     },
     void 0 === constructor_settings['cokol_top_available'] && (constructor_settings['cokol_top_available'] = 1),
     void 0 === constructor_settings['tabletop_plints_available'] && (constructor_settings[
       'tabletop_plints_available'] = 1),
     constructor_settings['tabletop_plints_default'],
     void 0 === constructor_settings['russta'] && (constructor_settings['russta'] = 0),
     void 0 === constructor_settings['check_intersection_default'] && (constructor_settings[
       'check_intersection_default'] = 0),
     global_options['check_intersections'] = 1 == constructor_settings['check_intersection_default'],
     null == constructor_settings['show_shelves_panel'] && (constructor_settings['show_shelves_panel'] = 1),
     null == constructor_settings['use_module_base_price_mf'] && (constructor_settings['use_module_base_price_mf'] =
       0),
     null == constructor_settings['allow_facade_group_change'] && (constructor_settings['allow_facade_group_change'] =
       0),
     constructor_settings['display_sizes'] || (constructor_settings['display_sizes'] = 'xyz'),
     constructor_settings['price_modificator_acc'] && (constructor_settings['price_modificator_acc'] = parseFloat(
       constructor_settings['price_modificator_acc'])),
     constructor_settings['price_modificator_furni'] && (constructor_settings['price_modificator_furni'] = parseFloat(
       constructor_settings['price_modificator_furni'])),
     isNaN(constructor_settings['price_modificator_acc']) && (constructor_settings['price_modificator_acc'] =
       constructor_settings['price_modificator']),
     isNaN(constructor_settings['price_modificator_furni']) && (constructor_settings['price_modificator_furni'] =
       constructor_settings['price_modificator']),
     constructor_settings['tabletop_v2'] = 1,
     constructor_settings['tmp_convert_details'] = 1,
     constructor_settings['module_sides_version'] = 1;
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
     },
     accsessories_data['find_item'] = function(C) {
       return this['items'][C] || false;
     },
     Object['keys'](accsessories_data['items'])['forEach'](C => {
       accsessories_data['items'][C]['tags'] || (accsessories_data['items'][C]['tags'] = ''),
         accsessories_data['items'][C]['code'] && (accsessories_data['by_code'][accsessories_data['items'][C][
           'code']] = accsessories_data['items'][C]);
     }),
     accsessories_data['find_item_by_code'] = function(C) {
       return this['by_code'][C] || false;
     },
     accsessories_data['get_item_by_code'] = function(C) {
       return !!this['by_code'][C] && {
         'id': this['by_code'][C]['id'],
         'name': this['by_code'][C]['name'],
         'code': this['by_code'][C]['code'],
         'label': this['by_code'][C]['code'] + '\x20' + this['by_code'][C]['name'],
         'category': this['by_code'][C]['category'],
         'price_per_piece': parseFloat(this['by_code'][C]['price'])
       };
     },
     accsessories_data['original_items'] = copy_object(accsessories_data['items']),
     accsessories_data['tree'] && (Object['keys'](accsessories_data['tree'])['forEach'](C => {
         var D = accsessories_data['tree'][C];
         D['tags'] = [];
         for (let E = D['items']['length']; E--;)
           0 != accsessories_data['items'][D['items'][E]]['active'] && '' != accsessories_data['items'][D['items'][
             E]]['tags'] && (D['tags'] = D['tags']['concat'](accsessories_data['items'][D['items'][E]]['tags'][
             'split'](',')));
         for (let F = D['tags']['length']; F--;)
           D['tags'][F] = D['tags'][F]['trim']();
         D['tags'] = _['uniq'](D['tags']);
       }),
       accsessories_data['tags_by_types'] = {},
       Object['keys'](accsessories_data['types'])['forEach'](C => {
         var D = Object['keys'](accsessories_data['types'][C]);
         accsessories_data['tags_by_types'][C] = [];
         for (let F = 0; F < D.length; F++) {
           var E = accsessories_data['items'][D[F]];
           E['active'] && '' != E['tags'] && (accsessories_data['tags_by_types'][C] = accsessories_data[
             'tags_by_types'][C]['concat'](E['tags']['split'](',')));
           for (let G = accsessories_data['tags_by_types'][C]['length']; G--;)
             accsessories_data['tags_by_types'][C][G] = accsessories_data['tags_by_types'][C][G]['trim']();
           accsessories_data['tags_by_types'][C] = _['uniq'](accsessories_data['tags_by_types'][C]);
         }
       })),
     accsessories_data['tags'] && (accsessories_data['tags']['sort'](),
       accsessories_data['tags']['sort'](function(C, D) {
         return parseInt(C) - parseInt(D);
       }));
 },
 'facade_sets': function(B) {
   facades_sets = B,
     convert_facades(),
     (facades_lib = new lib(material_0, category_0))['get_item'] = function(C) {
       var C;
       return this['items'][C] ? ((C = copy_object(this['items'][C]))['additional_materials'] || (C[
           'additional_materials'] = {}),
         C) : copy_object({
         'id': 0,
         'active': '0',
         'order': 100000,
         'name': 'Default',
         'compatibility_types': {
           'full': 0
         },
         'category': 0,
         'materials': [0],
         'prices': [],
         'icon': '',
         'handle': 1,
         'handle_offset': 30,
         'thickness': 18,
         'types': [{
           'name': 'Глухой',
           'icon': '',
           'items': [{
             'min_width': 0,
             'min_height': 0,
             'model': '/common_assets/models/facades/7/plastic_full.fbx',
             'group': 'all'
           }],
           'thickness': 18,
           'icon_file': ''
         }],
         'types_radius': [],
         'types_double': [],
         'types_triple': [],
         'double_offset': 0,
         'triple_decor_model': {
           'model': '',
           'model_file': '',
           'current_model': '',
           'thickness': 0,
           'height': 0,
           'offset': 0
         },
         'additional_materials': []
       });
     },
     facades_lib['get_data'] = function(C) {
       var D = {
         'mat': '',
         'cat': '',
         'par_cat': '',
         'str': ''
       };
       return D['mat'] = this['get_item'](C),
         D['cat'] = this['get_category'](D['mat']['category']),
         0 != D['cat']['parent'] && (D['par_cat'] = this['get_category'](D['cat']['parent'])),
         D['str'] = '',
         0 != D['cat']['parent'] && (D['str'] += D['par_cat']['name']),
         D['str'] += '\x20' + D['cat']['name'],
         D['str'] += '\x20' + D['mat']['name'],
         D;
     },
     facades_lib['get_defaults'] = function(C) {
       return C = C || 'top',
         this['get_item'](project_settings['defaults']['facades'][C]);
     },
     convert_lib(facades_lib, {
       'items': facades_sets,
       'categories': facades_categories
     }),
     facades_lib['side_items'] = [];
   for (let C = 0; C < facades_sets.length; C++)
     0 != facades_sets[C]['active'] && 1 == facades_sets[C]['has_side'] && facades_lib['side_items']['push'](
       facades_sets[C]);
   libs['facades'] = facades_lib,
     pp['libs']['facades'] = facades_lib;
 },
 'project_settings': function(B) {
   var B, B, B;
   if ((project_settings = B)['rulers_visible'] = void 0 === project_settings['rulers_visible'] ? 1 :
     project_settings['rulers_visible'],
     project_settings['selected_furniture'] = accsessories_data['default'],
     void 0 === project_settings['bottom_as_top_corpus_materials'] && (project_settings[
       'bottom_as_top_corpus_materials'] = true),
     void 0 === project_settings['bottom_as_top_facade_materials'] && (project_settings[
       'bottom_as_top_facade_materials'] = true),
     void 0 === project_settings['bottom_as_top_facade_models'] && (project_settings[
       'bottom_as_top_facade_models'] = true),
     void 0 === project_settings['bottom_modules_height'] && (project_settings['bottom_modules_height'] = 720),
     void 0 === project_settings['cokol_as_corpus'] && (project_settings['cokol_as_corpus'] = true),
     void 0 === project_settings['cokol_height'] && (project_settings['cokol_height'] = 120),
     void 0 === project_settings['cornice_active'] && (project_settings['cornice_active'] = false),
     void 0 === project_settings['cornice_available'] && (project_settings['cornice_available'] =
       constructor_settings['cornice_available']),
     void 0 === project_settings['corpus_thickness'] && (project_settings['corpus_thickness'] = 16),
     void 0 === project_settings['door_offset'] && (project_settings['door_offset'] = 2),
     void 0 === project_settings['is_cokol_active'] && (project_settings['is_cokol_active'] = true),
     void 0 === project_settings['cokol_top_active'] && (project_settings['cokol_top_active'] = false),
     project_settings['available_corpus_thickness'] || (project_settings['available_corpus_thickness'] = [16]),
     project_settings['default_corpus_thickness'] && (project_settings['corpus_thickness'] = project_settings[
       'default_corpus_thickness']),
     void 0 === project_settings['shelves_thickness'] && (project_settings['shelves_thickness'] = 16),
     project_settings['available_shelves_thickness'] || (project_settings['available_shelves_thickness'] = [16]),
     project_settings['default_shelves_thickness'] && (project_settings['shelves_thickness'] = project_settings[
       'default_shelves_thickness']),
     void 0 === project_settings['selected_materials']['pat'] && (project_settings['selected_materials']['pat'] =
       731),
     void 0 === project_settings['materials']['pat'] && (project_settings['materials']['pat'] = project_settings[
       'materials']['top']['facades']),
     project_settings['accessories'] = cart['accessories'],
     void 0 === project_settings['decorations'] && 1 != constructor_settings['shop_mode'] && 1 ==
     constructor_settings['decorations_enabled'] && (project_settings['decorations'] = decorations),
     void 0 === project_settings['models']['top'] && (project_settings['models']['top'] = facades_sets[0]['id']),
     void 0 === project_settings['models']['bottom'] && (project_settings['models']['bottom'] = facades_sets[0][
       'id']),
     project_settings['handle']['model'] || (project_settings['handle']['model'] = handles_catalog['items'][
       handles_catalog['items']['length'] - 1
     ]),
     void 0 === project_settings['handle']['bottom_as_top'] && (project_settings['handle']['bottom_as_top'] = true),
     void 0 === project_settings['handle']['no_handle'] && (project_settings['handle']['no_handle'] = false),
     'center' === project_settings['handle']['lockers_position'] && (project_settings['handle']['lockers_position'] =
       'middle'),
     project_settings['handle']['model']['is_gola'] || (project_settings['handle']['model']['is_gola'] = false),
     'gola' == project_settings['handle']['model']['type'] && (project_settings['handle']['model']['is_gola'] = true,
       (B = handles_lib['get_item'](project_settings['handle']['model']['id']))['is_gola'] = true,
       B['model_top_module'] = '/common_assets/models/handles/18/gola_top_module.fbx',
       B['model_top_module_ch'] = '/common_assets/models/handles/18/gola_top_module_ch.fbx',
       B['model_tabletop'] = '/common_assets/models/handles/18/gola_under_tabletop.fbx',
       B['model_tabletop_ch'] = '/common_assets/models/handles/18/gola_under_tabletop_ch.fbx',
       B['model_ch'] = '/common_assets/models/handles/18/gola_common_ch.fbx',
       B['sizes_top_module'] = {
         'width': 4,
         'height': 17,
         'depth': 27
       },
       B['sizes_tabletop'] = {
         'width': 17,
         'height': 57,
         'depth': 27
       },
       load_gola(B),
       project_settings['handle']['model'] = B),
     project_settings['handle']['top'] || (project_settings['handle']['top'] = copy_object(project_settings['handle'])),
     project_settings['handle']['bottom'] || (project_settings['handle']['bottom'] = copy_object(project_settings[
       'handle']['top'])),
     project_settings['selected_materials']['top']['facades_rotated'] || (project_settings['selected_materials']['top'][
       'facades_rotated'
     ] = false),
     project_settings['selected_materials']['bottom']['facades_rotated'] || (project_settings['selected_materials'][
       'bottom'
     ]['facades_rotated'] = false),
     void 0 === project_settings['selected_materials']['cornice'] && (project_settings['selected_materials'][
       'cornice'] = project_settings['selected_materials']['top']['facades']),
     void 0 === project_settings['cornice_change_with_facade'] && (project_settings['cornice_change_with_facade'] =
       1),
     true === custom_lockers && (project_settings['lo_type'] = 'custom'),
     project_settings['tabletop_plints_default'] = 0 != constructor_settings['tabletop_plints_default'],
     project_settings['shelve_offset'] = 15,
     project_settings['selected_cornice_model'] || (project_settings['selected_cornice_model'] = 0),
     project_settings['selected_cokol_model'] || (project_settings['selected_cokol_model'] = 0),
     project_settings['cornice_level'] || (project_settings['cornice_level'] = 1),
     project_settings['tabletop_mode'] || (project_settings['tabletop_mode'] = 0),
     'string' == typeof project_settings['materials']['tabletop']) {
     project_settings['materials']['tabletop'] = JSON['parse'](project_settings['materials']['tabletop']),
       project_settings['materials']['cokol'] = JSON['parse'](project_settings['materials']['cokol']),
       project_settings['materials']['floor'] = JSON['parse'](project_settings['materials']['floor']),
       project_settings['materials']['glass'] = JSON['parse'](project_settings['materials']['glass']),
       project_settings['materials']['wall_panel'] = JSON['parse'](project_settings['materials']['wall_panel']),
       project_settings['materials']['walls'] = JSON['parse'](project_settings['materials']['walls']);
     try {
       project_settings['materials']['top']['back_wall_material'] = JSON['parse'](project_settings['materials']['top'][
           'back_wall_material'
         ]),
         project_settings['materials']['bottom']['back_wall_material'] = JSON['parse'](project_settings['materials'][
           'bottom'
         ]['back_wall_material']);
     } catch (C) {}
     project_settings['materials']['top']['corpus'] = JSON['parse'](project_settings['materials']['top']['corpus']),
       project_settings['materials']['bottom']['corpus'] = JSON['parse'](project_settings['materials']['bottom'][
         'corpus'
       ]);
   }
   project_settings['materials']['top']['back_wall_material'] || (project_settings['materials']['top'][
         'back_wall_material'
       ] = '',
       project_settings['materials']['bottom']['back_wall_material'] = copy_object(project_settings['materials']['top'][
         'back_wall_material'
       ])),
     'object' == typeof project_settings['materials']['top']['back_wall_material'] && Object['keys'](project_settings[
       'materials']['top']['back_wall_material'])['length'] < 1 && (project_settings['materials']['top'][
       'back_wall_material'
     ] = ''),
     'object' == typeof project_settings['materials']['top']['back_wall_material'] && (Object['keys'](project_settings[
         'materials']['top']['back_wall_material'])['forEach'](function(D) {
         'facade' == project_settings['materials']['top']['back_wall_material'][D]['mode'] && (project_settings[
               'materials']['top']['back_wall_material'][D]['materials'] = copy_object(project_settings['materials'][
               'top'
             ]['facades']),
             project_settings['materials']['bottom']['back_wall_material'][D]['materials'] = copy_object(
               project_settings['materials']['bottom']['facades'])),
           'custom_as_corpus' != project_settings['materials']['top']['back_wall_material'][D]['mode'] && 'corpus' !=
           project_settings['materials']['top']['back_wall_material'][D]['mode'] || (project_settings['materials'][
               'top'
             ]['back_wall_material'][D]['default'] = project_settings['selected_materials']['top']['corpus'],
             project_settings['materials']['top']['back_wall_material'][D]['materials'] = copy_object(
               project_settings['materials']['top']['corpus']),
             project_settings['materials']['bottom']['back_wall_material'][D]['default'] = project_settings[
               'selected_materials']['bottom']['corpus'],
             project_settings['materials']['bottom']['back_wall_material'][D]['materials'] = copy_object(
               project_settings['materials']['bottom']['corpus']));
       }),
       (B = Object['keys'](project_settings['materials']['top']['back_wall_material']))['forEach'](function(D) {
         project_settings['materials']['top']['back_wall_material'][D]['key'] = D;
       }),
       void 0 === project_settings['selected_materials']['top']['back_wall_material'] && (project_settings[
         'selected_materials']['top']['back_wall_material'] = {
         'key': project_settings['materials']['top']['back_wall_material'][B[0]]['key'],
         'default': project_settings['materials']['top']['back_wall_material'][B[0]]['default']
       }),
       void 0 === project_settings['selected_materials']['bottom']['back_wall_material'] && (project_settings[
         'selected_materials']['bottom']['back_wall_material'] = project_settings['selected_materials']['top'][
         'back_wall_material'
       ]),
       (B = Object['keys'](project_settings['materials']['glass_shelves']))['forEach'](function(D) {
         project_settings['materials']['glass_shelves'][D]['key'] = D;
       }),
       B.length) && void 0 === project_settings['selected_materials']['glass_shelves'] && (project_settings[
       'selected_materials']['glass_shelves'] = {
       'key': project_settings['materials']['glass_shelves'][B[0]]['key'],
       'default': project_settings['materials']['glass_shelves'][B[0]]['default']
     }),
     project_settings['bottom_as_top_back_wall_material'] = true,
     project_settings['comments'] || (project_settings['comments'] = []),
     void 0 === project_settings['facades_active'] && (project_settings['facades_active'] = true),
     void 0 === project_settings['bort_active'] && (project_settings['bort_active'] = false),
     void 0 === project_settings['services'] && (project_settings['services'] = []),
     void 0 === project_settings['discount'] && (project_settings['discount'] = 0),
     project_settings['hinges'] = {
       'id': 0,
       'name': 'С\x20доводчиком',
       'icon': '/common_assets/images/with_dovod.jpg',
       'door_hinges_price': 1000,
       'locker_hinges_price': 1000,
       'dovodchik': true
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
     constructor_settings['catalog_available'] = 1,
     convert_lib_multi_cat(catalog_lib, B),
     pp['libs']['catalog'] = catalog_lib;
 },
 'bardesks': function(B) {
   bardesks_data = B,
     constructor_settings['bardesks_available'] = 1,
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
       B[C]['default'] = Object['keys'](B[C]['variants'])[0];
     }),
     mat_types = B;
 },
 'params_blocks': function(B) {
   var C = {};
   for (let D = 0; D < B.length; D++)
     C[B[D]['id']] = B[D];
   global_options['params_blocks'] = C;
 },
 'backgrounds': function(B) {
   for (let C = 0; C < B.length; C++)
     B[C]['category'] || (B[C]['category'] = 1);
   convert_lib(libs['background'], {
     'categories': [{
       'id': 1,
       'parent': 0,
       'code': '',
       'name': '',
       'active': 1,
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
     };
     for (let G = 0; G < B['items']['length']; G++) {
       var D = _['merge'](copy_object(C), copy_object(B['items'][G]));
       D['materials'] && (D['params']['models']['common']['code'] = B['items'][G]['code'],
           'i' == D['params']['materials_mode'] && (D['params']['mat_mode'] = 1,
             D['params']['material'] = B['items'][G]['materials'][0]),
           delete D['materials']),
         delete D['models'],
         delete D['items'],
         B['items'][G] = D;
     }
     C['params']['models']['common']['model'] = '/common_assets/models/cornice_new.fbx',
       C['params']['models']['radius']['model'] = '/common_assets/models/cornice_radius_new.fbx',
       cornice_lib = new lib(C, category_0),
       convert_lib_multi_cat(cornice_lib, B),
       libs['cornice'] = cornice_lib;
   } else {
     for (let H = 0; H < B['items']['length']; H++)
       B['items'][H]['category'] || (B['items'][H]['category'] = 0);
     var E = {
       'id': 0,
       'name': '',
       'code': '',
       'icon': '',
       'category': 0,
       'active': 1,
       'order': 10000,
       'models': {
         'common': '/common_assets/models/cornice_new.fbx',
         'radius': '/common_assets/models/cornice_radius_new.fbx',
         'radius_i': ''
       },
       'params': {
         'height': 100,
         'depth': 102.79,
         'front_offset': 20,
         'item_width': 3000,
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
           'common': 0,
           'radius': 0,
           'radius_i': 0
         }
       }]
     };
     0 < B['items']['length'] && (E['active'] = 0),
       prices['cornice'] && (E['params']['item_width'] = parseFloat(prices['cornice']['width']),
         E['items'][0]['price']['common'] = parseFloat(prices['cornice']['common']),
         E['items'][0]['price']['radius'] = parseFloat(prices['cornice']['radius']),
         E['items'][0]['price']['radius_i'] = parseFloat(prices['cornice']['radius_i'])),
       B['items']['push'](E);
     for (let I = B['items']['length']; I--;) {
       var F = B['items'][I];
       F['params']['item_width'] = parseInt(F['params']['item_width']),
         F['price_hash'] = {},
         F['cat_price_hash'] = {};
       for (let J = F['items']['length']; J--;)
         F['items'][J]['price']['common'] = parseFloat(F['items'][J]['price']['common']),
         F['items'][J]['price']['radius'] = parseFloat(F['items'][J]['price']['radius']),
         F['items'][J]['price']['radius_i'] = parseFloat(F['items'][J]['price']['radius_i']),
         0 != F['items'][J]['mat_category'] && (F['cat_price_hash'][F['items'][J]['mat_category']] = F['items'][J]),
         F['price_hash'][F['items'][J]['mat_code']] = F['items'][J];
     }
     convert_lib(cornice_lib, B);
   }
   pp['libs']['cornice'] = cornice_lib;
 },
 'tabletop': function(B) {
   if (B['items']['length']) {
     var C = {
       'id': 0,
       'name': '',
       'code': '',
       'has_trap': 0,
       'icon': '',
       'category': [],
       'active': 1,
       'order': 10000,
       'params': {
         'mat_mode': 0,
         'material': 0,
         'mat_params': {},
         'variants': [{
           'name': '',
           'code': '',
           'width': 0,
           'height': 0,
           'thickness': 0,
           'price': 0,
           'price_mode': 'c',
           'price_type': 'm2',
           'price_acc_id': 0,
           'params': {}
         }],
         'trap_variants': []
       },
       'prices': {
         'common': 0,
         'trap': 0
       },
       'accessories': {
         'conn': 0,
         'end': 0
       }
     };
     for (let E = 0; E < B['items']['length']; E++) {
       var D = B['items'][E],
         D = _['merge'](copy_object(C), copy_object(D));
       D['params']['materials_mode'] && (D['params']['variants']['splice'](0, 1),
           D['params']['mat_mode'] = 1,
           D['params']['variants']['push']({
             'name': D['name'],
             'code': D['code'],
             'width': D['params']['width'],
             'height': D['params']['depth'],
             'thickness': D['params']['height'],
             'price': D['prices']['common'],
             'price_mode': 'm',
             'price_type': 'p',
             'price_acc_id': 0,
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
       'id': 0,
       'name': 'Столешница',
       'code': '',
       'has_trap': 0,
       'icon': '',
       'category': ['0'],
       'active': 1,
       'order': 10000,
       'params': {
         'mat_mode': 0,
         'material': 0,
         'mat_params': {},
         'variants': [{
           'name': '',
           'code': '',
           'width': 3000,
           'height': 600,
           'thickness': 40,
           'price': 0,
           'price_mode': 'm',
           'price_type': 'p',
           'price_acc_id': 0,
           'params': {}
         }],
         'trap_variants': []
       },
       'prices': {
         'common': 0,
         'trap': 0
       },
       'accessories': {
         'conn': 0,
         'end': 0
       }
     });
   convert_lib(tabletop_lib, B),
     pp['libs']['tabletop'] = tabletop_lib;
 },
 'washes': function(B) {
   var C = {
     'id': 0,
     'name': 'Мойка',
     'price': 0,
     'model': '/common_assets/models/washes/m1.fbx',
     'icon': '/common_assets/models/washes/m1icon.jpg',
     'width': 460,
     'height': 196,
     'depth': 460,
     'smes_rotation': 0,
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
   let D = 0;
   D = 0 < B['items']['length'] ? (C['active'] = 0,
       1) : 0,
     B['items']['push'](C),
     0 == D && Object['keys'](washes_catalog)['forEach'](function(E) {
       (washes_catalog[E]['category'] = 0) != E && B['items']['push'](washes_catalog[E]);
     }),
     convert_lib(washes_lib, B);
 },
 'cokol': function(B) {
   var C = {
     'name': '',
     'code': '',
     'icon': '',
     'category': [],
     'active': 1,
     'order': 10000,
     'params': {
       'mat_mode': 0,
       'material': 0,
       'mat_params': {},
       'models': {
         'common': {
           'enabled': 1,
           'model': '',
           'code': '',
           'price_mode': 'm',
           'price': 0,
           'acc_id': 0
         },
         'radius': {
           'enabled': 1,
           'model': '',
           'code': '',
           'price_mode': 'm',
           'price': 0,
           'acc_id': 0
         },
         'radius_i': {
           'enabled': 1,
           'model': '',
           'code': '',
           'price_mode': 'm',
           'price': 0,
           'acc_id': 0
         }
       },
       'accs': [],
       'conns': {
         'a0': {
           'enabled': 1,
           'model': '',
           'code': '',
           'price_mode': 'm',
           'price': 0,
           'acc_id': 0
         },
         'a180': {
           'enabled': 1,
           'model': '',
           'code': '',
           'price_mode': 'm',
           'price': 0,
           'acc_id': 0
         },
         'a90': {
           'enabled': 1,
           'model': '',
           'code': '',
           'price_mode': 'm',
           'price': 0,
           'acc_id': 0
         },
         'a135': {
           'enabled': 1,
           'model': '',
           'code': '',
           'price_mode': 'm',
           'price': 0,
           'acc_id': 0
         }
       },
       'height': 0,
       'thickness': 0,
       'width': 0
     }
   };
   for (let E = 0; E < B['items']['length']; E++) {
     var D = _['merge'](copy_object(C), copy_object(B['items'][E]));
     D['materials'] && (D['params']['models']['common']['code'] = B['items'][E]['code'],
         'i' == D['params']['materials_mode'] && (D['params']['mat_mode'] = 1,
           D['params']['material'] = B['items'][E]['materials'][0]),
         delete D['materials']),
       delete D['models'],
       delete D['items'],
       B['items'][E] = D;
   }
   cokol_lib = new lib(C, category_0),
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
       'active': 1,
       'order': 10000,
       'params': {
         'mat_mode': 0,
         'material': 0,
         'mat_params': {},
         'models': {
           'common': {
             'enabled': 1,
             'model': '',
             'code': '',
             'price_mode': 'm',
             'price': 0,
             'acc_id': 0
           },
           'radius': {
             'enabled': 1,
             'model': '',
             'code': '',
             'price_mode': 'm',
             'price': 0,
             'acc_id': 0
           },
           'radius_i': {
             'enabled': 1,
             'model': '',
             'code': '',
             'price_mode': 'm',
             'price': 0,
             'acc_id': 0
           }
         },
         'accs': [],
         'conns': {
           'a0': {
             'enabled': 1,
             'model': '',
             'code': '',
             'price_mode': 'm',
             'price': 0,
             'acc_id': 0
           },
           'a180': {
             'enabled': 1,
             'model': '',
             'code': '',
             'price_mode': 'm',
             'price': 0,
             'acc_id': 0
           },
           'a90': {
             'enabled': 1,
             'model': '',
             'code': '',
             'price_mode': 'm',
             'price': 0,
             'acc_id': 0
           },
           'a135': {
             'enabled': 1,
             'model': '',
             'code': '',
             'price_mode': 'm',
             'price': 0,
             'acc_id': 0
           }
         },
         'height': 0,
         'thickness': 0,
         'width': 0
       }
     }, category_0),
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
     'active': 1,
     'order': 10000,
     'params': {
       'type': 'hole',
       'spec': {
         'name': '',
         'code': '',
         'orientation': 'f',
         'key': '',
         'global': 1,
         'direction': ''
       },
       'size': {
         'x': 100,
         'y': 0,
         'z': 15
       }
     }
   }, category_0);
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
     'active': 1,
     'order': 10000,
     'params': {
       'spec': {
         'name': '',
         'code': ''
       }
     }
   }, category_0);
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
           'id': 0,
           'name': '',
           'code': '',
           'icon': '',
           'category': [],
           'cabinet_tag': '',
           'element_type': F,
           'catalog_type': '',
           'active': 1,
           'order': 10000
         },
         D;
       for (D of B[F]?.['items'] || [])
         D?.['params']?.['spec']?.['defaults']?.['facade'] && delete D['params']['spec']['defaults']['facade'];
       var C = new lib(C, category_0),
         E = (convert_lib_multi_cat(C, B[F]),
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
     var C = ['hdf', 'glass', 'm4'],
       D;
     for (D of materials_keys)
       void 0 === (materials_keys_hash[D['key']] = D)['butts'] && (C['includes'](D['key']) ? (D['butts'] = '',
         D['butt_visible'] = 0) : (D['butts'] = 'butts',
         D['butt_visible'] = 1));
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
           'id': 0,
           'name': 'Материал\x20в\x20базе\x20не\x20найден',
           'code': '',
           'key': '',
           'icon': '',
           'category': [],
           'active': 1,
           'order': 10000,
           'material': 0,
           'params': {
             'butts': {
               'id': 0,
               'key': 'butts'
             },
             'mat_mode': 1,
             'material': 0,
             'mat_params': {},
             'variants': [{
               'name': 'Материал\x20в\x20базе\x20не\x20найден',
               'code': '',
               'width': 0,
               'height': 0,
               'thickness': 0,
               'price': 0,
               'price_mode': 'c',
               'price_type': 'm2',
               'price_acc_id': 0,
               'params': {}
             }]
           }
         }, category_0),
         E = (convert_lib_multi_cat(D, B[F]),
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
           'id': 0,
           'name': 'Материал\x20в\x20базе\x20не\x20найден',
           'code': '',
           'key': '',
           'icon': '',
           'category': [],
           'active': 1,
           'order': 10000,
           'params': {
             'mat_mode': 1,
             'material': 0,
             'mat_params': {},
             'variants': [{
               'name': 'Материал\x20в\x20базе\x20не\x20найден',
               'code': '',
               'width': 0,
               'height': 0,
               'thickness': 0,
               'price': 0,
               'price_mode': 'c',
               'price_type': 'm2',
               'price_acc_id': 0,
               'params': {}
             }]
           }
         }, category_0),
         E = (convert_lib_multi_cat(D, B[F]),
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
     for (var C of H = Array.isArray(H) ? H : [])
       Array.isArray(C['vars']) || (C['vars'] = []);
     H.length || (H = [{
         'name': '',
         'key': '__default_vars',
         'active': 1,
         'default': 1,
         'vars': []
       }]),
       pp['variables']['global_vars'] = copy_object(H),
       pp['variables']['selected_index'] = H.findIndex(I => I['default']);
     for (var D of pp['variables']['global_vars'])
       D['vars_hash'] = _['keyBy'](D['vars'], 'key');
   }
   if (pp['libs']['key_value']['__bazis_settings'] && (bazis_settings = JSON['parse'](pp['libs']['key_value'][
       '__bazis_settings'
     ]['value'])),
     pp['libs']['key_value']['__spec_settings']?.['value']) {
     merge(pp['spec_settings'], copy_object(pp['libs']['key_value']['__spec_settings']['value'])),
       pp['spec_settings']['settings']['price_enabled'] = parse_int(pp['spec_settings']['settings']['price_enabled']),
       pp['spec_settings']['settings']['price_modificator'] = parse_num(pp['spec_settings']['settings'][
         'price_modificator'
       ], 1),
       pp['spec_settings']['settings']['price_modificator_dealer'] = parse_num(pp['spec_settings']['settings'][
         'price_modificator_dealer'
       ], 1),
       pp['spec_settings']['settings']['price_modificator_seller'] = parse_num(pp['spec_settings']['settings'][
         'price_modificator_seller'
       ], 1);
     for (var E of Object['values'](pp['spec_settings']['price_mod']['by_mod_type']))
       for (var F of Object['values'](E))
         for (var G of F)
           G['price_mod'] = parse_num(G['price_mod'], 1);
   }
 },
 'modules_groups': function(B) {
   pp['libs']['modules_groups'] = Array.isArray(B) ? B : [];
 },
 'defaults': function(B) {
   _def_data = B['items'][0];
 },
 'models': function(B) {
   var C;
   pp['libs']['models'] = new lib({
       'name': '',
       'code': '',
       'icon': '',
       'category': [],
       'active': 1,
       'order': 10000,
       'params': {
         'mat_mode': 0,
         'material': 0,
         'mat_params': {},
         'models': {
           'common': {
             'enabled': 1,
             'model': '',
             'code': '',
             'price_mode': 'm',
             'price': 0,
             'acc_id': 0
           },
           'radius': {
             'enabled': 1,
             'model': '',
             'code': '',
             'price_mode': 'm',
             'price': 0,
             'acc_id': 0
           },
           'radius_i': {
             'enabled': 1,
             'model': '',
             'code': '',
             'price_mode': 'm',
             'price': 0,
             'acc_id': 0
           }
         },
         'accs': [],
         'conns': {
           'a0': {
             'enabled': 1,
             'model': '',
             'code': '',
             'price_mode': 'm',
             'price': 0,
             'acc_id': 0
           },
           'a180': {
             'enabled': 1,
             'model': '',
             'code': '',
             'price_mode': 'm',
             'price': 0,
             'acc_id': 0
           },
           'a90': {
             'enabled': 1,
             'model': '',
             'code': '',
             'price_mode': 'm',
             'price': 0,
             'acc_id': 0
           },
           'a135': {
             'enabled': 1,
             'model': '',
             'code': '',
             'price_mode': 'm',
             'price': 0,
             'acc_id': 0
           }
         },
         'height': 0,
         'thickness': 0,
         'width': 0
       }
     }, category_0),
     convert_lib_multi_cat(pp['libs']['models'], B);
 },
 'model_materials': function(B) {
   convert_lib_multi_cat(pp['libs']['model_materials'], B);
 }
 };
 let g = {};
 Object['keys'](urls)['forEach'](B => {
   g[B] = urls[B]['replace'](/\?\d+$/, '');
 });
 var h = global_options['acc_url'] + 'config/index.php/api/available_data_files';
 let j = await fetch(h, {
   'method': 'POST',
   'headers': {
     'Content-Type': 'application/json'
   },
   'body': JSON['stringify']({
     'urls': g
   })
 })['then'](B => B['json']())['catch'](() => ({}));
 var h = true === j['language'] || false,
   k = true === j['washes'] || false,
   q = void 0 !== getUrlParameter('forced_common');
 let u = urls['project_settings'];
 q && (u = urls['project_settings_common']),
   mat_types = null;
 var v = '/common_assets/config/lng_front.php',
   w = ('custom' === constructor_settings['default_language'] && (v = urls['language']),
     1 == constructor_settings['use_common_modules'] && (urls['modules'] = '/common_assets/data/modules_common.json'),
     await promise_request(urls['constructor_settings']));
 f['constructor_settings'](w),
   q && (constructor_settings['custom_sizes_available'] = 1);
 let x = [],
   y = [];
 y.push(promise_request(urls['materials'])),
   y.push(promise_request(urls['glass_materials'])),
   y.push(promise_request(urls['facade_categories'])),
   y.push(promise_request(urls['facade_sets'])),
   y.push(promise_request(urls['kitchen_templates'])),
   y.push(promise_request(urls['tech_catalog'])),
   y.push(promise_request(urls['comms_catalog'])),
   y.push(promise_request(urls['interior_catalog'])),
   y.push(promise_request(urls['kitchen_models'])),
   y.push(promise_request(urls['handles'])),
   y.push(promise_request(urls['prices'])),
   y.push(promise_request(urls['sections'])),
   y.push(promise_request(urls['built_in_models_common'])),
   x.push('materials'),
   x.push('glass_materials'),
   x.push('facade_categories'),
   x.push('facade_sets'),
   x.push('kitchen_templates'),
   x.push('tech_catalog'),
   x.push('comms_catalog'),
   x.push('interior_catalog'),
   x.push('kitchen_models'),
   x.push('handles'),
   x.push('prices'),
   x.push('sections'),
   x.push('built_in_models_common');
 var z, w = (['accessories', 'catalog', 'bardesks', 'tabletop', 'models3d', 'lockers', 'tabletop_plints', 'mat_types',
       'params_blocks', 'backgrounds', 'cornice', 'cokol', 'cokol_top', 'legs', 'hole', 'furniture', 'catalogs_info',
       'catalogs_by_key', 'materials_info', 'materials_by_key', 'butts_info', 'butts_by_key', 'key_value',
       'modules_groups', 'defaults', 'models', 'model_materials', 'smes'
     ]['forEach'](B => {
       j['hasOwnProperty'](B) && true === j[B] && (y.push(promise_request(urls[B])),
         x.push(B));
     }),
     interface_version < 2 && (y.push(promise_request(urls['facade_systems'])),
       x.push('facade_systems')),
     true === j['washes'] ? (y.push(promise_request(urls['washes'])),
       x.push('washes')) : washes_lib['items'] = washes_catalog,
     new FormData()),
   A;
 w['append']('get_lang', 1),
   y.push(promise_post('/common_assets/config/lng_front.php', w)),
   x.push('language'),
   h && 'custom' === constructor_settings['default_language'] && (y.push(promise_request(urls['language'])),
     x.push('language_custom')),
   y.push(promise_request(u)),
   x.push('project_settings'),
   q && (constructor_settings['shop_mode'] = 0,
     constructor_settings['decorations_enabled'] = 1,
     constructor_settings['facade_style_change_availabale'] = 1,
     constructor_settings['facades_system_available'] = 1,
     constructor_settings['frontend_configurator_available'] = 1,
     constructor_settings['multiple_facades_mode'] = 0,
     global_options['forced_common'] = 1),
   fbx_loader['load']('/common_assets/models/furni/hinge_door_2.fbx', function(B) {
     furniture_models['hinge_door'] = B['children'][0]['geometry'],
       furniture_models['hinge_door']['sizes'] = box3['setFromObject'](B)['getSize'](vec3)['clone']()['divideScalar'](
         100);
   }),
   fbx_loader['load']('/common_assets/models/furni/hinge_facade.fbx', function(B) {
     furniture_models['hinge_facade'] = B['children'][0]['geometry'],
       furniture_models['hinge_facade']['sizes'] = box3['setFromObject'](B)['getSize'](vec3)['clone']()[
         'divideScalar'](100);
   }),
   fbx_loader['load']('/common_assets/models/furni/napr_corp.fbx', function(B) {
     furniture_models['napr_corp'] = B['children'][0]['geometry'],
       furniture_models['napr_corp']['sizes'] = box3['setFromObject'](B)['getSize'](vec3)['clone']()['divideScalar'](
         100);
   }),
   fbx_loader['load']('/common_assets/models/furni/napr_locker.fbx', function(B) {
     furniture_models['napr_locker'] = B['children'][0]['geometry'],
       furniture_models['napr_locker']['sizes'] = box3['setFromObject'](B)['getSize'](vec3)['clone']()['divideScalar']
       (100);
   }),
   fbx_loader['load']('/common_assets/models/pb2.fbx', function(B) {
     inner_models['pb'] = B['children'][0]['geometry'],
       inner_models['pb']['sizes'] = box3['setFromObject'](B)['getSize'](vec3)['clone']();
   }),
   fbx_loader['load']('/common_assets/models/pt2.fbx', function(B) {
     inner_models['pt'] = B['children'][0]['geometry'],
       inner_models['pt']['sizes'] = box3['setFromObject'](B)['getSize'](vec3)['clone']();
   }),
   A = await Promise['allSettled'](y);
 for (let B = 0; B < A.length; B++)
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
             'z': 16
           },
           'id': project_settings['selected_materials']['top']['corpus'],
           'categories': project_settings['materials']['top']['corpus']
         },
         'v_18': {
           'name': '',
           'size': {
             'z': 18
           },
           'id': project_settings['selected_materials']['top']['corpus'],
           'categories': project_settings['materials']['top']['corpus']
         },
         'v_22': {
           'name': '',
           'size': {
             'z': 22
           },
           'id': project_settings['selected_materials']['top']['corpus'],
           'categories': project_settings['materials']['top']['corpus']
         },
         'v_32': {
           'name': '',
           'size': {
             'z': 32
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
             'z': 3
           },
           'id': 651,
           'categories': [18, 46]
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
             'z': 3
           },
           'id': 726,
           'categories': [1, 43]
         },
         'v_32': {
           'name': '',
           'size': {
             'z': 32
           },
           'id': 726,
           'categories': [1, 43]
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
           'x': 0,
           'y': 0,
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
         'id': 0,
         'size': {
           'x': 0,
           'y': 0,
           'z': 16
         },
         'categories': []
       }
     },
     'id': '99998'
   },
   set_obj = {
     'materials': mat_types
   },
   env_urls = ['/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg',
     '/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg',
     '/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg'
   ],
   1 == constructor_settings['use_custom_reflection'] && constructor_settings['custom_reflection_image'] && (-1 <
     constructor_settings['custom_reflection_image']['indexOf']('broskokitchenplanner.com') && (constructor_settings[
       'custom_reflection_image'] = constructor_settings['custom_reflection_image']['replace'](
       'https://broskokitchenplanner.com', 'https://planplace.ru')),
     env_urls = [constructor_settings['custom_reflection_image'], constructor_settings['custom_reflection_image'],
       constructor_settings['custom_reflection_image'], constructor_settings['custom_reflection_image'],
       constructor_settings['custom_reflection_image'], constructor_settings['custom_reflection_image']
     ]),
   (textureCube2 = new THREE['CubeTextureLoader']()['load'](env_urls))['format'] = THREE['RGBAFormat'],
   textureCube2['mapping'] = THREE['CubeReflectionMapping'],
   mirror_material = new THREE['MeshStandardMaterial']({
     'roughness': 0,
     'metalness': 1,
     'envMap': textureCube2
   });
 }

 function init() {
   function q(ag) {
     var ah = copy_object(ag),
       ag = (ah['categories'] = [],
         ah['items'] = [],
         ag['categories'] || []);
     let ai = [ah];
     return 0 < ag.length && ag.forEach(aj => {
         ai.push(...q(aj));
       }),
       ai;
   }
   if (constructor_settings['core_v2'] && libs['cokol']['items_arr']?.['length'] && (project_settings[
       'selected_cokol_model'] = project_settings['selected_materials']['cokol']),
     constructor_settings['core_v2'] && !libs['cokol']['items_arr']?.['length']) {
     var A = {
         'name': '',
         'code': '',
         'icon': '',
         'category': [],
         'active': 1,
         'order': 10000,
         'params': {
           'mat_mode': 0,
           'material': 0,
           'mat_params': {},
           'models': {
             'common': {
               'enabled': 1,
               'model': '',
               'code': '',
               'price_mode': 'm',
               'price': 0,
               'price_type': 'v'
             },
             'radius': {
               'enabled': 1,
               'model': '',
               'code': '',
               'price_mode': 'm',
               'price': 0,
               'price_type': 'v'
             },
             'radius_i': {
               'enabled': 1,
               'model': '',
               'code': '',
               'price_mode': 'm',
               'price': 0,
               'price_type': 'v'
             }
           },
           'accs': [],
           'conns': {
             'a0': {
               'enabled': 1,
               'model': '',
               'code': '',
               'price_mode': 'm',
               'price': 0,
               'price_type': 'v'
             },
             'a180': {
               'enabled': 1,
               'model': '',
               'code': '',
               'price_mode': 'm',
               'price': 0,
               'price_type': 'v'
             },
             'a90': {
               'enabled': 1,
               'model': '',
               'code': '',
               'price_mode': 'm',
               'price': 0,
               'price_type': 'v'
             },
             'a135': {
               'enabled': 1,
               'model': '',
               'code': '',
               'price_mode': 'm',
               'price': 0,
               'price_type': 'v'
             }
           },
           'height': 0,
           'thickness': 0,
           'width': 0
         }
       },
       C = [],
       D = [],
       F = project_settings['materials']['cokol'];
     for (let ag = 0; ag < F.length; ag++) {
       var G = materials_lib['categories'][F[ag]];
       C.push(...q(G));
     }
     for (let ah = 0; ah < C.length; ah++) {
       var I = materials_lib['categories'][C[ah]['id']]['items'];
       for (let ai = 0; ai < I.length; ai++) {
         var J = I[ai],
           K = copy_object(A);
         K['id'] = J['id'],
           K['icon'] = J['icon'] || '',
           K['name'] = J['name'] || '',
           K['active'] = void 0 !== J['active'] ? J['active'] : 1,
           K['category'] = isArray(J['category']) ? J['category'] : [J['category']],
           K['params']['material'] = J['id'],
           K['params']['height'] = project_settings['cokol_height'],
           K['params']['thickness'] = 16,
           K['params']['width'] = 4000,
           K['params']['models']['common']['code'] = J['code'] || '',
           K['params']['models']['radius']['code'] = J['code'] || '',
           K['params']['models']['radius_i']['code'] = J['code'] || '',
           K['params']['models']['common']['price_mode'] = 'm2',
           K['params']['models']['radius']['price_mode'] = 'm2',
           K['params']['models']['radius_i']['price_mode'] = 'm2',
           D.push(K);
       }
     }
     project_settings['selected_cokol_model'] = project_settings['selected_materials']['cokol'];
     var L = {
       'categories': C,
       'items': D
     };
     cokol_lib = new lib(copy_object(A), category_0),
       convert_lib_multi_cat(cokol_lib, L),
       libs['cokol'] = cokol_lib;
   }
   if (constructor_settings['core_v2']) {
     project_settings['kitchen'] || (project_settings['kitchen'] = {}),
       project_settings['kitchen']['defaults'] = _def_data;
     var L = project_settings['kitchen']['defaults']?.['handle'],
       L, N, L, P, Q, U, L;
     if (project_settings['handle'] && !is_empty_id(L?.['id']) && pp?.['libs']?.['handles']?.['items']?.[L['id']] && (
         project_settings['handle'] = pp['libs']['handles']['get_item'](L['id']),
         project_settings['handle']['selected_model'] = L['id'],
         is_empty_value(L['size']) || (project_settings['handle']['size_index'] = L['size'],
           project_settings['handle']['preferable_size'] = L['size']),
         void 0 === project_settings['handle']['bottom_as_top'] && (project_settings['handle']['bottom_as_top'] = !
           0),
         void 0 === project_settings['handle']['no_handle'] && (project_settings['handle']['no_handle'] = false),
         'center' === project_settings['handle']['lockers_position'] && (project_settings['handle'][
           'lockers_position'] = 'middle'),
         project_settings['handle']['orientation'] || (project_settings['handle']['orientation'] = 'vertical'),
         project_settings['handle']['is_gola'] || (project_settings['handle']['is_gola'] = false),
         'gola' == project_settings['handle']['type'] && (project_settings['handle']['is_gola'] = true,
           (L = handles_lib['get_item'](project_settings['handle']['model']['id']))['is_gola'] = true,
           L['model_top_module'] = '/common_assets/models/handles/18/gola_top_module.fbx',
           L['model_top_module_ch'] = '/common_assets/models/handles/18/gola_top_module_ch.fbx',
           L['model_tabletop'] = '/common_assets/models/handles/18/gola_under_tabletop.fbx',
           L['model_tabletop_ch'] = '/common_assets/models/handles/18/gola_under_tabletop_ch.fbx',
           L['model_ch'] = '/common_assets/models/handles/18/gola_common_ch.fbx',
           L['sizes_top_module'] = {
             'width': 4,
             'height': 17,
             'depth': 27
           },
           L['sizes_tabletop'] = {
             'width': 17,
             'height': 57,
             'depth': 27
           },
           load_gola(L),
           project_settings['handle']['model'] = L),
         project_settings['handle']['model'] = copy_object(project_settings['handle']),
         project_settings['handle']['top'] = copy_object(project_settings['handle']),
         project_settings['handle']['bottom'] = copy_object(project_settings['handle']['top'])),
       view_mode || (L = (aj => {
           var ak;
           return pp['libs']['cokol']['items'][aj]?.['params']['height'] || 0;
         })(project_settings['kitchen']['defaults']?.['cokol']?.['id']),
         sc['change_global_var'](pp['const']['vars']['cokol_height'], L, false),
         L = (P = (aj, ak) => {
           var al = pp['libs']['tabletop'];
           return get_variant_thickness(aj, ak || 0, al, 0);
         })(project_settings['kitchen']['defaults']?.['tabletop']?.['id'], project_settings['kitchen']['defaults']?.[
           'tabletop'
         ]?.['variant_id']),
         sc['change_global_var'](pp['const']['vars']['tabletop_height'], L, false)),
       project_settings['bort_active'] = false === check_global_vars_flag(pp['const']['vars']['plint_enabled']) ? 0 :
       1,
       !view_mode) {
       var W = {},
         Z = {},
         a0, a1;
       for (a0 of pp['libs']['modules_groups'])
         W[a0['key']] = copy_object(a0);
       for (a1 of pp['libs']['materials_info']['groups'])
         Z[a1['key']] = copy_object(a1);
       var a2 = Object['keys'](W),
         a3;
       if (project_settings['kitchen']['defaults']['facades'] && void 0 !== project_settings['kitchen']['defaults'][
           'facades'
         ]['id']) {
         var a4 = {};
         let aj = {
             'id': project_settings['kitchen']['defaults']['facades']['id'],
             'materials': {
               'gen': parseInt(project_settings['kitchen']['defaults']['facades']['material']),
               'glass': project_settings['selected_materials']['glass']
             }
           },
           ak = pp['libs']['facades']['find_item'](project_settings['kitchen']['defaults']['facades']['id']);
         Object['keys'](ak['additional_materials'] || {})['forEach'](al => {
           aj['materials'][al] = ak['additional_materials'][al]['selected'];
         });
         for (let al = 0; al < a2.length; al++)
           a4[a2[al]] = copy_object(aj);
         project_settings['kitchen']['defaults']['facades'] = a4;
       }
       for (a3 of Object['values'](Z)) {
         a3['available'] || (a3['available'] = []);
         for (var a5 of a3['available'])
           void 0 === a5['key'] && (a5['key'] = 'ldsp'),
           void 0 === a5['thickness'] && (a5['thickness'] = []),
           void 0 === a5['categories'] && (a5['categories'] = []);
         var a6, a6, a7 = (a3['selected'] = {},
           a3['selected_butt'] = {},
           a3['material'] || (a3['material'] = {
             'av_index': 0,
             'id': 0,
             'key': '',
             'variant_id': 0
           }),
           (!a3['material']['key'] || is_empty_id(a3['material']['id'])) && (a6 = a3['available'][0],
             a6 = pp['libs']['materials'][a6?.['key']]?.['first_item']) && (a3['material']['av_index'] = 0,
             a3['material']['id'] = a6['id'],
             a3['material']['key'] = a6['key'],
             a3['material']['variant_id'] = 0),
           a3['material']);
         let am = a7?.['key'] || a3['available']?.[0]?.['key'];
         var a8 = pp['libs']['materials_info']['keys'],
           a9;
         for (a9 of a2) {
           a7 && (a3['selected'][a9] = copy_object(a7));
           var aa, ab = _['find'](a8, an => an['key'] === am)?.['butts'] || '';
           a3['selected_butt'][a9] = {
             'key': ab,
             'id': 0
           };
         }
       }
       project_settings['kitchen']['cabinet_tags'] = W,
         project_settings['kitchen']['mat_groups'] = Z;
       var ac = {},
         ad, ae;
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
     view_mode || pp['libs']['key_value']['__spec_settings']?.['value'] || (pp['spec_settings']['settings'][
           'price_enabled'
         ] = parse_int(constructor_settings['price_enabled']),
         pp['spec_settings']['settings']['price_modificator'] = parse_num(constructor_settings['price_modificator'],
           1),
         pp['spec_settings']['settings']['price_modificator_dealer'] = parse_num(constructor_settings[
           'price_modificator_dealer'], 1),
         pp['spec_settings']['settings']['price_modificator_seller'] = parse_num(constructor_settings[
           'price_modificator_seller'], 1)),
       constructor_settings['price_enabled'] = pp['spec_settings']['settings']['price_enabled'],
       constructor_settings['price_modificator'] = pp['spec_settings']['settings']['price_modificator'],
       constructor_settings['price_modificator_dealer'] = pp['spec_settings']['settings']['price_modificator_dealer'],
       constructor_settings['price_modificator_seller'] = pp['spec_settings']['settings']['price_modificator_seller'];
   }
   if (built_in_models_common) {
     (bim_models = built_in_models_common)['by_types'] = {};
     for (let an = 0; an < bim_models['types']['length']; an++)
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
       'tabletop': 0,
       'tabletop_variant': 0,
       'cokol': {
         'material': 1
       },
       'cokol_top': {
         'material': 1
       },
       'leg': {
         'material': 1
       },
       'cornice': 0
     }),
     constructor_settings['core_v2'] && (L = project_settings['kitchen']['defaults'],
       project_settings['materials']['floor'] = L?.['floor']?.['available'],
       project_settings['materials']['walls'] = L?.['walls']?.['available'],
       project_settings['selected_materials']['floor'] = L?.['floor']?.['id'],
       project_settings['selected_materials']['walls'] = L?.['walls']?.['id']),
     project_settings['selected_materials']['facades'] = {},
     project_settings['defaults']['glass'] || (project_settings['defaults']['glass'] = project_settings[
       'selected_materials']['glass']),
     tabletop_lib && tabletop_lib['first_item'] && 0 != tabletop_lib['first_item']['id'] && ('function' ==
       typeof set_default_tabletop ? set_default_tabletop() : (0 != project_settings['defaults']['tabletop'] &&
         void 0 !== project_settings['defaults']['tabletop'] || (project_settings['defaults']['tabletop'] =
           tabletop_lib['first_item']['id']),
         void 0 === project_settings['defaults']['tabletop_variant'] && (project_settings['defaults'][
           'tabletop_variant'
         ] = 0))),
     pp['libs']['cornice'] && pp['libs']['cornice']['first_item']) {
     'function' == typeof set_default_cornice ? set_default_cornice() : 0 != project_settings['defaults'][
       'cornice'] && void 0 !== project_settings['defaults']['cornice'] || (project_settings['defaults']['cornice'] =
         pp['libs']['cornice']['first_item']['id']),
       project_settings['selected_cornice_model'] = project_settings['defaults']['cornice'];
     var af = pp['libs']['cornice']['find_item'](project_settings['selected_cornice_model']);
     project_settings['cornice_can_change_with_facade'] = 'f' == af['params']['materials_mode'],
       project_settings['cornice_change_with_facade'] = 1 == project_settings['cornice_can_change_with_facade'];
     let ao = 0;
     if (af['params']['default_material'])
       ao = af['params']['default_material'];
     else
       switch (af['params']['materials_mode']) {
         case 'i':
           ao = parseInt(af['materials'][0]);
           break;
         case 'c':
           ao = parseInt(pp['libs']['decors']['get_first_item'](af['mat_categories'][0])['id']);
           break;
         default:
           ao = parseInt(project_settings['selected_materials']['top']['facades']);
       }
     project_settings['selected_materials']['cornice'] = ao;
   }
   libs['tabletop_plints'] && libs['tabletop_plints']['first_item'] && (0 != project_settings['defaults'][
       'tabletop_plint'
     ] && void 0 !== project_settings['defaults']['tabletop_plint'] || (project_settings['defaults'][
       'tabletop_plint'
     ] = libs['tabletop_plints']['first_item']['id'])),
     constructor_settings['core_v2'] && pp['libs']['bort']?.['first_item'] && (L = project_settings['kitchen']?.[
         'defaults'
       ] || {},
       is_empty_id(L['tabletop']?.['bort_id'])) && (L['tabletop'] || (L['tabletop'] = {}),
       L['tabletop']['bort_id'] = pp['libs']['bort']['first_item']['id']),
     constructor_settings['core_v2'] ? view_mode || (L = project_settings['kitchen']['defaults']['facades']?.[pp['libs']
       ['modules_groups'][0]['key']
     ]?.['id']) && !project_settings['selected_materials']['facades'][L] && (project_settings['selected_materials'][
       'facades'
     ][L] = {
       'gen': {
         'top': project_settings['kitchen']['defaults']['facades'][pp['libs']['modules_groups'][0]['key']][
           'materials'
         ]['gen'],
         'bottom': project_settings['kitchen']['defaults']['facades'][pp['libs']['modules_groups'][0]['key']][
           'materials'
         ]['gen']
       }
     }) : Object['keys'](project_settings['defaults']['facades'])['forEach'](function(ap) {
       let aq = project_settings['defaults']['facades'][ap];
       var ar = 0;
       if (!project_settings['selected_materials']['facades'][aq]) {
         project_settings['selected_materials']['facades'][aq] = {};
         let as = facades_lib['items'][aq],
           at;
         for (let au = 0; au < as['materials']; au++)
           if (materials_lib['get_first_item'](as['materials'][au])['id']) {
             at = materials_lib['get_first_item'](as['materials'][au])['id'];
             break;
           }
         project_settings['selected_materials']['facades'][aq]['gen'] = {},
           project_settings['selected_materials']['facades'][aq]['gen']['top'] = project_settings[
             'selected_materials']['top']['facades'],
           project_settings['selected_materials']['facades'][aq]['gen']['bottom'] = project_settings[
             'selected_materials']['bottom']['facades'],
           ar = at,
           as['additional_materials'] || (as['additional_materials'] = {}),
           Object['keys'](as['additional_materials'])['forEach'](function(av) {
             0 == as['additional_materials'][av]['fixed'] && (project_settings['selected_materials']['facades'][
                 aq][av] = {},
               project_settings['selected_materials']['facades'][aq][av]['top'] = copy_object(as[
                 'additional_materials'][av]['selected']),
               project_settings['selected_materials']['facades'][aq][av]['bottom'] = copy_object(as[
                 'additional_materials'][av]['selected']));
           });
       }
     }),
     project_settings['project_id'] || (project_settings['project_id'] = new Date()['getTime']()),
     wallpanel_params['height'] = project_settings['wall_panel']['height'],
     project_settings['facades_data'] && delete project_settings['facades_data'],
     THREE['Cache']['enabled'] = true,
     constructor_settings['core_v2'] ? cornice_lib['items'][0]['name'] = lang['cornice'] + '\x20' + lang[
       'cornice_common'] : (cornice_lib['items'][0]['name'] = lang['cornice'] + '\x20' + lang['cornice_common'],
       cornice_lib['items'][0]['items'][0]['name'] = lang['cornice'] + '\x20' + lang['cornice_common'],
       cornice_lib['items'][0]['items'][0]['name_radius'] = lang['cornice'] + '\x20' + lang['cornice_radius'],
       cornice_lib['items'][0]['items'][0]['name_radius_i'] = lang['cornice'] + '\x20' + lang['cornice_radius_i']),
     view_mode || (0 < $('#pre_scene')['length'] ? pre_scene : load_from_params)(),
     room_models_catalog = {
       'categories': [{
         'id': 1,
         'active': 1,
         'name': lang['windows']
       }, {
         'id': 2,
         'active': 1,
         'name': lang['doors']
       }],
       'items': [{
         'id': 10,
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
         'category': 1,
         'variants': [{
           'width': 1180,
           'height': 1110,
           'depth': 148
         }],
         'obj_type': 'window',
         'draggable': true
       }, {
         'id': 11,
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
         'category': 1,
         'variants': [{
           'width': 1180,
           'height': 1110,
           'depth': 30
         }],
         'obj_type': 'window',
         'draggable': true
       }, {
         'id': 1,
         'category': 2,
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
           'width': 900,
           'height': 2270,
           'depth': 65
         }],
         'draggable': true,
         'obj_type': 'door',
         'cabinet_group': 'bottom'
       }, {
         'id': 2,
         'category': 2,
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
           'width': 860,
           'height': 1960,
           'depth': 87
         }],
         'draggable': true,
         'obj_type': 'door',
         'cabinet_group': 'bottom'
       }, {
         'id': 3,
         'category': 2,
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
           'width': 860,
           'height': 1960,
           'depth': 87
         }],
         'draggable': true,
         'obj_type': 'door',
         'cabinet_group': 'bottom'
       }, {
         'id': 4,
         'category': 2,
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
           'width': 860,
           'height': 1960,
           'depth': 87
         }],
         'draggable': true,
         'obj_type': 'door',
         'cabinet_group': 'bottom'
       }]
     };
   var L = copy_object(room_models_catalog),
     L = (L['categories']['push']({
         'id': 3,
         'active': 1,
         'name': lang['shafts_columns']
       }),
       L['items']['push']({
         'category': '3',
         'icon': '/common_assets/images/module_icons/shaft1.jpg',
         'depth': 300,
         'height': 300,
         'orientation': 'horizontal',
         'mode': 'stretch'
       }, {
         'category': '3',
         'icon': '/common_assets/images/module_icons/shaft2.jpg',
         'width': 300,
         'depth': 300,
         'orientation': 'vertical',
         'mode': 'stretch'
       }, {
         'category': '3',
         'icon': '/common_assets/images/module_icons/shaft3.jpg',
         'width': 100,
         'depth': 1000,
         'orientation': 'vertical',
         'mode': 'stretch'
       }, {
         'category': '3',
         'icon': '/common_assets/images/module_icons/shaft4.jpg',
         'width': 1000,
         'height': 1000,
         'depth': 1000,
         'mode': 'normal'
       }),
       convert_lib(constructions_lib, L),
       pat_material = create_material_by_id(project_settings['selected_materials']['pat']),
       scene = new THREE['Scene'](),
       constructor_settings['enabled_360'] && (hdr_loader = new THREE['RGBELoader'](),
         project_settings['background'] || (project_settings['background'] = {
           'active': 0,
           'id': 0,
           'scale': 5000,
           'radius': 5000,
           'height': 750
         })),
       view_mode && (pp['helpers']['axes_helper'] = new PPAxes(),
         pp['helpers']['axes_helper']['visible'] = false,
         scene['add'](pp['helpers']['axes_helper'])),
       scene['add'](numbers),
       numbers['userData']['childrenRenderable'] = false,
       (sel_box = new Selection_box())['hide'](),
       scene['add'](sel_box),
       (selection_box = new THREE['BoxHelper']())['material']['depthTest'] = false,
       selection_box['material']['transparent'] = true,
       selection_box['visible'] = true,
       scene['add'](selection_box),
       (wrong_place_box = new THREE['Mesh'](new THREE['BoxBufferGeometry'](10, 10, 10), red_mat_opac))[
         'set_new_size'] = function(ap, aq, ar) {
         this['geometry']['dispose'](),
           this['geometry'] = new THREE['BoxBufferGeometry'](ap, aq, ar);
       },
       wrong_place_box['visible'] = false,
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
         for (let ap = this['children']['length']; ap--;)
           this['children'][ap]['geometry'] && this['children'][ap]['geometry']['dispose'](),
           this['remove'](this['children'][ap]);
         this['userData']['by_axis'] = {
           'x': [],
           'y': [],
           'z': []
         };
       },
       scene['add'](scene['userData']['grid']),
       scene['userData']['temp'] = new THREE['Group'](),
       scene['userData']['temp']['name'] = 'temp',
       scene['add'](scene['userData']['temp']),
       scene['userData']['ruler'] = new Ruler_obj({
         'p1': new THREE['Vector3'](),
         'p2': new THREE['Vector3'](),
         'depth': false
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
         for (let ap = this['children']['length']; ap--;)
           this['children'][ap]['geometry'] && this['children'][ap]['geometry']['dispose'](),
           this['remove'](this['children'][ap]);
         this['userData']['by_axis'] = {
           'x': [],
           'y': [],
           'z': []
         };
       },
       scene['add'](scene['userData']['guides']),
       pp['project_settings'] = project_settings,
       pp['three']['mount'] = mount,
       view_mode || mount(), {
         'width': room_width,
         'height': room_height,
         'depth': room_depth
       });
   custom_settings['room_sizes'] && (L['width'] = custom_settings['room_sizes']['width'],
       L['height'] = custom_settings['room_sizes']['height'],
       L['depth'] = custom_settings['room_sizes']['depth']),
     custom_settings['floor_only'] && (L['floor_only'] = true),
     (room = new Room(L))['addEventListener']('change', function() {
       1 == global_options['grid']['active'] && sc['draw_grid']();
     }),
     scene['add'](room),
     1 == custom_constructor_settings['default_edges_mode'] && (global_options['mode'] = 'edges',
       room['change_mode']()),
     pp['three']['room'] = room;
 }

 function mount() {
   var f = document['getElementById']('viewport');
   init_renderer(),
     selectionBox = new THREE['SelectionBox'](camera, scene),
     helper = new THREE['SelectionHelper'](renderer, 'selectBox'),
     controls = new THREE['OrbitControls'](camera, renderer['domElement']),
     110 < THREE['REVISION'] && (controls['rotateRight_90'] = function() {
       this['_rotateLeft'](-Math['PI'] / 2),
         this['update']();
     }),
     controls['target']['set'](238, 64, 17),
     controls['update'](),
     controls['addEventListener']('change', function(g) {
       pp['config']['on_demand_render'] && pp['render']();
     }),
     void 0 === THREE['Math'] && (THREE['Math'] = THREE['MathUtils']),
     1 == custom_settings['new_drag'] ? ((dControls = new THREE['DragControls2'](d_objects, camera, f))[
         'addEventListener']('dragstart', function(g) {
         controls['enabled'] = false;
       }),
       dControls['addEventListener']('dragend', function(g) {
         controls['enabled'] = true;
       })) : ((dControls = new THREE['DragControls'](d_objects, camera, f))['addEventListener']('dragstart', function(
       g) {
         global_options['mouse_mode']['enabled_base_drag'] ? controls['enabled'] = false : controls['enabled'] = true,
           pp['config']['on_demand_render'] && pp['render']();
       }),
       dControls['addEventListener']('drag', function(g) {
         pp['config']['on_demand_render'] && pp['render']();
       }),
       dControls['addEventListener']('dragend', function(g) {
         controls['enabled'] = true,
           pp['config']['on_demand_render'] && pp['render']();
       }),
       dControls['addEventListener']('hoveron', function(g) {
         'function' == typeof g['object']['hover_on'] && g['object']['hover_on']();
       }),
       dControls['addEventListener']('hoveroff', function(g) {
         'function' == typeof g['object']['hover_off'] && g['object']['hover_off']();
       })),
     window['addEventListener']('resize', onWindowResize, false),
     'function' == typeof pp['events']['global']['after_init'] && pp['events']['global']['after_init'](),
     onWindowResize(),
     render(),
     pp['config']['on_demand_render'] && pp['render']();
 }
 async function cornice_preload() {
   var f = cornice_lib['get_item'](project_settings['selected_cornice_model']),
     g = f['params']?.['models']?.['common']?.['model'] || f['models']?.['common'],
     f = f['params']?.['models']?.['radius']?.['model'] || f['models']?.['radius'],
     h = [],
     [j, k] = (g && h.push(load_model({
         'model': g
       })),
       f && h.push(load_model({
         'model': f
       })),
       await Promise['all'](h)),
     l = [],
     m = [];
   if (g) {
     for (let n = 0; n < j.length; n++)
       l.push(new THREE['Mesh'](j[n], red_mat));
   }
   if (f) {
     for (let p = 0; p < k.length; p++)
       m.push(new THREE['Mesh'](k[p], red_mat));
   }
   global_options['cornice_data'] = {
     'model': l,
     'radius_model': m
   };
 }

 function onWindowResize() {
   var f = document['getElementById']('viewport'),
     g = f['clientWidth'],
     f = f['clientHeight'];
   camera['aspect'] = g / f,
     renderer['getPixelRatio'](),
     camera['aspect'] = g / f,
     camera['updateProjectionMatrix'](),
     renderer['setSize'](g, f),
     label_renderer['setSize'](g, f),
     camera_ortho['left'] = g / -2,
     camera_ortho['right'] = g / 2,
     camera_ortho['top'] = f / 2,
     camera_ortho['bottom'] = f / -2,
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
   !document['getElementById']('left_panel') || 40 < document['getElementById']('left_panel')['width'] || (f = $(
       '#camera_move_left'),
     g = $('#camera_move_right'),
     h = $('#camera_move_up'),
     j = $('#camera_move_down'),
     k = 0,
     l = 23,
     m = null,
     $('.left_subpanel')['each'](function() {
       0 < $(this)['offset']()['left'] && (m = $(this),
         k = 1);
     }),
     l = 1 === k ? m['width']() + m['offset']()['left'] + 5 : 23,
     g['css']({
       'right': -15,
       'top': window['innerHeight'] / 2 - 20
     }),
     f['css']({
       'left': l,
       'top': window['innerHeight'] / 2 - 20
     }),
     h['css']({
       'left': window['innerWidth'] / 2 - 20,
       'top': 25
     }),
     j['css']({
       'left': window['innerWidth'] / 2 - 20,
       'bottom': -10
     }));
 }

 function setBackground(f, g, h) {
   var i, g, h;
   f['background'] && (h = g / h / ((g = function(j) {
       var k = 0,
         l = 0,
         l = void 0 !== window['innerWidth'] ? (k = window['innerWidth'],
           window['innerHeight']) : (0 == document['documentElement']['clientWidth'] ? (k = document['body'][
             'clientWidth'
           ],
           document['body']) : (k = document['documentElement']['clientWidth'],
           document['documentElement']))['clientHeight'];
       return {
         'width': k - (j ? k - document['body']['offsetWidth'] + 1 : 0),
         'height': l
       };
     }(true))['width'] / g['height']),
     f['background']['offset']['x'] = 1 < h ? (1 - 1 / h) / 2 : 0,
     f['background']['offset']['y'] = 1 < h ? 0 : (1 - h) / 2,
     f['background']['repeat']['x'] = 1 < h ? 1 / h : 1,
     f['background']['repeat']['y'] = 1 < h ? 1 : h);
 }
 mixers = [],
   clock = new THREE['Clock'](),
   _def_data = {},
   document['addEventListener']('DOMContentLoaded', async function() {
     if (-1 < location['href']['indexOf']('/config') && (pp['is_config_page'] = true),
       !pp['is_config_page'] && -1 < location['href']['indexOf']('catalogs') && (pp['catalog'] = location[
         'pathname']['replace'](/\/+$/, '')['split']('/')['pop']()),
       WEBGL['isWebGLAvailable']()) {
       try {
         var f = JSON['parse'](document['getElementById']('ini_settings')['innerText']);
         f['tariff'] && f['tariff']['parent'] && (global_options['is_sub'] = true,
           global_options['parent_name'] = f['tariff']['parent']);
       } catch (j) {}
       if (interface_version = document['getElementById']('interface_version') ? parseInt(document['getElementById']
           ('interface_version')['value']) : 2,
         document['getElementById']('t_rnv_pp') && 1 == parseInt(document['getElementById']('t_rnv_pp')[
         'value']) && !pp['is_config_page'])
         try {
           vkBridge['send']('VKWebAppInit')['then'](async k => {})['catch'](k => {});
         } catch (k) {}
       1 == (view_mode = document['getElementById']('viewport')['dataset']['preview'] ? true : view_mode) &&
         Object['keys'](urls)['forEach'](function(l) {
           urls[l] = '/common_assets/data/preview_' + urls[l];
         });
       for (let l = 0; l < pp['custom']['item_types']['length']; l++)
         pp['engine']['item_types'][pp['custom']['item_types'][l]['key']] = pp['custom']['item_types'][l]['item'],
         pp['engine']['item_def_params'][pp['custom']['item_types'][l]['key']] = pp['custom']['item_types'][l][
           'def_params'
         ];
       preload_arrows(),
         get_url_params();
       for (let m = 0; m < pp['events']['global']['before_load_params']['length']; m++) {
         var g = pp['events']['global']['before_load_params'][m];
         'AsyncFunction' === g.constructor['name'] ? await g() : g();
       }
       if (await load_params(),
         'function' == typeof before_interface_callback && (pp['events']['global']['before_interface'] =
           before_interface_callback),
         'function' == typeof pp['events']['global']['before_interface'] && ('AsyncFunction' === pp['events'][
           'global'
         ]['before_interface']['constructor']['name'] ? await pp['events']['global']['before_interface']() : pp[
           'events']['global']['before_interface']()),
         accsessories_data && void 0 !== accsessories_data['types']) {
         Object['keys'](accsessories_data['default'])['forEach'](function(n) {
           null === accsessories_data['default'][n] || accsessories_data['items'][accsessories_data['default'][
               n]] || accsessories_data['types'][n] && (accsessories_data['default'][n] = Object['keys'](
               accsessories_data['types'][n])[0]),
             null !== accsessories_data['default'][n] && '' != accsessories_data['default'][n] && (
               accsessories_data['is_auto'] = true);
         });
         for (var h = 0; h < accsessories_data['tree']['length']; h++)
           for (let n = 0; n < accsessories_data['tree'][h]['items']['length']; n++) {
             var i = accsessories_data['items'][accsessories_data['tree'][h]['items'][n]];
             i && i['images'] && (i['images'] = i['images']['replaceAll']('https://broskokitchenplanner.com',
                 'https://planplace.ru')),
               void 0 === i['active'] && (i['active'] = 1);
           }
       }
       if (await cornice_preload(),
         check_interface_components(),
         pp['defaults']['order_form_fields'] = [{
           'id': 'name',
           'label': lang['name'],
           'required': 1,
           'required_check_type': 'non_empty',
           'type': 'text',
           'error': false,
           'val': '',
           'placeholder': ''
         }, {
           'id': 'email',
           'label': lang['email'],
           'required': 1,
           'required_check_type': 'email',
           'type': 'text',
           'error': false,
           'val': '',
           'placeholder': ''
         }, {
           'id': 'phone',
           'label': lang['phone'],
           'required': 1,
           'required_check_type': 'phone',
           'type': 'text',
           'val': '',
           'error': false,
           'placeholder': '',
           'mask_enabled': false,
           'mask_template': '+7\x20(999)\x20999-99-99'
         }, {
           'id': 'comments',
           'label': lang['comments'],
           'required': 0,
           'rows': 5,
           'required_check_type': '',
           'type': 'textarea',
           'val': '',
           'error': false,
           'placeholder': ''
         }],
         'function' == typeof before_init && ('AsyncFunction' === before_init.constructor['name'] ?
           await before_init() : before_init()),
         await pp['run_event']('global', 'before_init'),
         pp['storage'] = new IDBStorage(getClientIdFromUrl()),
         -1 < window['location']['href']['indexOf']('3dkitchen.project'))
         try {
           pp['is_local'] = true,
             init(),
             view_mode || interface_init();
         } catch (o) {}
       else
         try {
           init(),
             view_mode || interface_init();
         } catch (p) {
           $('body')['html']('')['append'](
             '<p\x20style=\x22text-align:\x20center;\x20padding-top:\x20190px;\x20font-size:\x2020px;\x22>' +
             lang['error_constructor_init'] +
             '\x20support@planplace.ru</p><p\x20style=\x22text-align:\x20center\x22>' + lang[
               'error_constructor_screen'] + ':\x20<br>' + p + '</p>');
         }
       1 == project_settings['is_kitchen_model'] && location['search']['indexOf']('?co=') < 0 && (
           global_options['url_params']['file_url'] || change_kitchen_style(project_settings['id'], true, false)),
         document['dispatchEvent'](new CustomEvent('PP_ready', {
           'detail': {
             'pp': pp
           }
         }));
     } else
       document['body']['innerHTML'] = WEBGL['getWebGLErrorMessage']();
   }),
   Array['prototype']['unique'] = function() {
     for (var f = [], g = 0; g < this.length; g++) {
       var h = this[g];
       f['indexOf'](h) < 0 && f.push(h);
     }
     return f;
   },
   (f => {
     var g = f['Uint8Array'],
       f, h = (f = f['HTMLCanvasElement']) && f['prototype'],
       i = /\s*;\s*base64\s*(?:;|$)/i,
       j = 'toDataURL',
       k, l = function(p) {
         for (var q = p.length, u = new g(q / 4 * 3 | 0), v = 0, w = 0, x = [0, 0], y = 0, z = 0,
             A, B, C; q--;)
           B = p['charCodeAt'](v++),
           255 !== (A = k[B - 43]) && A !== C && (x[1] = x[0],
             x[0] = B,
             z = z << 6 | A,
             4 === ++y) && (u[w++] = z >>> 16,
             61 !== x[1] && (u[w++] = z >>> 8),
             61 !== x[0] && (u[w++] = z),
             y = 0);
         return u;
       };
     g && (k = new g([62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1,
         -1, -1, 0, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
         14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1,
         26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42,
         43, 44, 45, 46, 47, 48, 49, 50, 51
       ])),
       !f || h['toBlob'] && h['toBlobHD'] || (h['toBlob'] || (h['toBlob'] = function(p, q) {
           var u, u, v, w, u, x;
           q = q || 'image/png',
             this['mozGetAsFile'] ? p(this['mozGetAsFile']('canvas', q)) : this['msToBlob'] &&
             /^\s*image\/png\s*(?:$|;)/i ['test'](q) ? p(this['msToBlob']()) : (u = Array['prototype']['slice'][
                 'call'
               ](arguments, 1),
               v = (u = this[j]['apply'](this, u))['indexOf'](','),
               w = u['substring'](v + 1),
               u = i['test'](u['substring'](0, v)),
               Blob['fake'] ? ((x = new Blob())['encoding'] = u ? 'base64' : 'URI',
                 x['data'] = w,
                 x['size'] = w.length) : g && (x = u ? new Blob([l(w)], {
                 'type': q
               }) : new Blob([decodeURIComponent(w)], {
                 'type': q
               })),
               p(x));
         }),
         !h['toBlobHD'] && h['toDataURLHD'] ? h['toBlobHD'] = function() {
           j = 'toDataURLHD';
           var o = this['toBlob']();
           return j = 'toDataURL',
             o;
         } :
         h['toBlobHD'] = h['toBlob']);
   })('undefined' != typeof self && self || 'undefined' != typeof window && window || this['content'] || this);
 let materials_cache = {};

 function create_material(f, j = null) {
   (f = f || {})['add_params'] || (f['add_params'] = {});
   let k;
   try {
     k = texture_loader;
   } catch (I) {
     k = new THREE['TextureLoader']();
   }
   if (j) {
     var q, v, w, x = (void 0 !== f['add_params']['model_width'] ? f['add_params']['model_width'] : 256) + '_' + (
       void 0 !== f['add_params']['model_width'] ? f['add_params']['model_height'] : 256) + '_' + (void 0 !== f[
       'add_params']['rotation'] ? f['add_params']['rotation'] : 'normal') + '_' + j;
     if (materials_cache[x])
       return materials_cache[x];
   }
   let y, z, A, B = 0;
   var C = {
       'type': void 0 !== f['type'] ? f['type'] : 'Phong',
       'params': void 0 !== f['params'] ? JSON['parse'](JSON['stringify'](f['params'])) : {},
       'add_params': {
         'texture_width': void 0 !== f['add_params']['texture_width'] ? f['add_params']['texture_width'] : 256,
         'texture_height': void 0 !== f['add_params']['texture_height'] ? f['add_params']['texture_height'] : 256,
         'normal_map_width': void 0 !== f['add_params']['normal_map_width'] ? f['add_params']['normal_map_width'] :
           256,
         'normal_map_height': void 0 !== f['add_params']['normal_map_height'] ? f['add_params']['normal_map_height'] :
           256,
         'normal_stretch_width': void 0 !== f['add_params']['normal_stretch_width'] && f['add_params'][
           'normal_stretch_width'
         ],
         'normal_stretch_height': void 0 !== f['add_params']['normal_stretch_height'] && f['add_params'][
           'normal_stretch_height'
         ],
         'real_width': void 0 !== f['add_params']['real_width'] ? f['add_params']['real_width'] : 256,
         'real_height': void 0 !== f['add_params']['real_height'] ? f['add_params']['real_height'] : 256,
         'model_width': void 0 !== f['add_params']['model_width'] ? f['add_params']['model_width'] : 256,
         'model_height': void 0 !== f['add_params']['model_height'] ? f['add_params']['model_height'] : 256,
         'rotation': void 0 !== f['add_params']['rotation'] ? f['add_params']['rotation'] : 'normal',
         'stretch_width': void 0 !== f['add_params']['stretch_width'] && f['add_params']['stretch_width'],
         'stretch_height': void 0 !== f['add_params']['stretch_height'] && f['add_params']['stretch_height'],
         'normal_scale': void 0 !== f['add_params']['normal_scale'] && f['add_params']['normal_scale'],
         'wrapping': void 0 !== f['add_params']['wrapping'] ? f['add_params']['wrapping'] : 'mirror',
         'normal_wrapping': void 0 !== f['add_params']['normal_wrapping'] ? f['add_params']['normal_wrapping'] :
           'mirror',
         'roughness_wrapping': void 0 !== f['add_params']['roughness_wrapping'] ? f['add_params'][
           'roughness_wrapping'] : 'mirror',
         'debug': void 0 !== f['add_params']['debug'] && f['add_params']['debug']
       }
     },
     x, f, x, f, x, f, x, f, D, E, F, G;
   if (delete C['params']['icon'],
     'Standart' == C['type'] && (C['type'] = 'Standard'),
     C['params']['side'] && 'double' == C['params']['side'] && (C['params']['side'] = THREE['DoubleSide']),
     C['params']['metalness'] && (C['params']['metalness'] = parseFloat(C['params']['metalness'])),
     C['params']['roughness'] && (C['params']['roughness'] = parseFloat(C['params']['roughness'])),
     C['params']['opacity'] && (C['params']['opacity'] = parseFloat(C['params']['opacity'])),
     C['params']['transparent'] && (C['params']['transparent'] = 1 === to_int(C['params']['transparent'])),
     C['add_params']['normal_scale'] && (C['params']['normalScale'] = new THREE['Vector2'](C['add_params'][
         'normal_scale'
       ], C['add_params']['normal_scale']),
       delete C['add_params']['normal_scale']),
     C['params']['alphaMap'] && (x = k['load'](correct_url(C['params']['alphaMap'])),
       'repeat' === C['add_params']['wrapping'] ? x['wrapS'] = x['wrapT'] = THREE['RepeatWrapping'] : x['wrapS'] = x[
         'wrapT'] = THREE['MirroredRepeatWrapping'],
       z = 1 == C['add_params']['stretch_width'] ? 1 : C['add_params']['model_width'] / C['add_params'][
         'real_width'],
       A = 1 == C['add_params']['stretch_height'] ? 1 : C['add_params']['model_height'] / C['add_params'][
         'real_height'
       ],
       x['repeat']['set'](z, A),
       C['params']['alphaMap'] = x),
     C['params']['map'] && (f = k['load'](correct_url(C['params']['map'])),
       'repeat' === C['add_params']['wrapping'] ? f['wrapS'] = f['wrapT'] = THREE['RepeatWrapping'] : f['wrapS'] = f[
         'wrapT'] = THREE['MirroredRepeatWrapping'],
       0 === B && (A = 'normal' === C['add_params']['rotation'] ? (f['center']['set'](Math['random'](), Math['random']
             ()),
           z = 1 == C['add_params']['stretch_width'] ? 1 : C['add_params']['model_width'] / C['add_params'][
             'real_width'
           ],
           1 == C['add_params']['stretch_height'] ? 1 : C['add_params']['model_height'] / C['add_params'][
             'real_height'
           ]) : (f['center']['set'](0.5, 0.5),
           f['rotation'] = Math['PI'] / 2,
           f['center']['set'](Math['random'](), Math['random']()),
           z = 1 == C['add_params']['stretch_width'] ? 1 : C['add_params']['model_height'] / C['add_params'][
             'real_height'
           ],
           C['add_params']['stretch_height'] ? 1 : C['add_params']['model_width'] / C['add_params']['real_width']),
         f['repeat']['set'](z, A),
         B = 1),
       C['params']['map'] = f),
     C['params']['normalMap'] && ((x = k['load'](correct_url(C['params']['normalMap'])))['wrapS'] = x['wrapT'] = THREE[
         'RepeatWrapping'],
       'repeat' === C['add_params']['normal_wrapping'] ? x['wrapS'] = x['wrapT'] = THREE['RepeatWrapping'] : x[
       'wrapS'] = x['wrapT'] = THREE['MirroredRepeatWrapping'],
       z = 1 == C['add_params']['normal_stretch_width'] ? 1 : C['add_params']['model_width'] / C['add_params'][
         'normal_map_width'
       ],
       A = C['add_params']['normal_stretch_height'] ? 1 : C['add_params']['model_height'] / C['add_params'][
         'normal_map_height'
       ],
       x['repeat']['set'](z, A),
       C['params']['normalMap'] = x),
     C['params']['metalnessMap'] && (f = k['load'](correct_url(C['params']['metalnessMap'])),
       C['params']['metalnessMap'] = f),
     C['params']['roughnessMap'] && (x = k['load'](correct_url(C['params']['roughnessMap'])),
       'repeat' === C['add_params']['roughness_wrapping'] ? x['wrapS'] = x['wrapT'] = THREE['RepeatWrapping'] : x[
         'wrapS'] = x['wrapT'] = THREE['MirroredRepeatWrapping'],
       0 === B && (z = 1 == C['add_params']['stretch_width'] ? 1 : C['add_params']['model_width'] / C[
           'add_params']['real_width'],
         A = C['add_params']['stretch_height'] ? 1 : C['add_params']['model_height'] / C['add_params']['real_height'],
         B = 1),
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
       0 === B && (z = C['add_params']['model_width'] / C['add_params']['real_width'],
         A = C['add_params']['model_height'] / C['add_params']['real_height']),
       x['repeat']['set'](z, A),
       C['params']['bumpMap'] = x;
     let J = 1;
     THREE['REVISION'] < 170 && (J = 0.2),
       C['params']['bumpScale'] = J;
   }
   let H = 0;
   switch ((THREE['REVISION'] < 120 || 1 == C['params']['metalness']) && (H = 1),
     C['type']) {
     case 'Basic':
       y = new THREE['MeshBasicMaterial'](C['params']);
       break;
     default:
       try {
         C['params']['envMap'] = textureCube2,
           C['params']['envMapIntensity'] = H;
       } catch (K) {}
       0 != (y = new THREE['MeshStandardMaterial'](C['params']))['transparent'] && 1 != y['opacity'] && (y[
           'depthWrite'] = false),
         j && (G = C['add_params']['model_width'] + '_' + C['add_params']['model_height'] + '_' + C['add_params'][
             'rotation'
           ] + '_' + j,
           materials_cache[G] || (materials_cache[G] = y));
       break;
   }
   return y;
 }

 function correct_url(e) {
   let f = e;
   return f['indexOf']('common_assets') < 0 && f['indexOf']('http') < 0 && f['indexOf']('base64') < 0 ? (f =
       global_options['acc_url'] + '/' + e,
       global_options['is_sub'] && (f = f.replace(global_options['account_name'], global_options['parent_name']))) :
     'undefined' != typeof constructor_settings && 1 == constructor_settings['icons_type'] && -1 < f['indexOf'](
       'modules_templates') && (f = f.replace('v3', 'v4')),
     f;
 }

 function dispose_material(e) {
   if (isArray(e)) {
     for (let f = 0; f < e.length; f++)
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
   return (f = f || materials_catalog) == materials_catalog ? materials_lib['get_item'](e) : (f = find_obj_by_id(f[
     'items'], e)) ? copy_object(f) : null;
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
       'id': 0,
       'name': 'НЕТ\x20КАТЕГОРИИ'
     },
     g == glass_materials_catalog && (h['name'] = 'Стекло')), {
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
   return e ? get_top_material_category(e['category']) : 0;
 }

 function get_top_material_category(e) {
   var e = find_obj_by_id(materials_catalog['categories'], e);
   return e['parent'] && 0 !== e['parent'] ? get_top_material_category(e['parent']) : e;
 }

 function check_material_in_category(f, g) {
   if (f && g) {
     var h = get_top_material_category_by_material_id(g);
     if (h) {
       for (let i = 0; i < f.length; i++)
         if (f[i] == h['id'])
           return true;
     }
   }
   return false;
 }

 function get_first_material_from_category(e) {
   var f = get_material_category_by_id(e);
   if (f['items'])
     return f['items'][0];
   for (let g = 0; g < f['categories']['length']; g++)
     if (f['categories'][g]['items'] && f['categories'][g]['items'][0])
       return f['categories'][g]['items'][0];
 }

 function get_material_data(f, g) {
   var h = {};
   let i = get_material_by_id(f, g = g || materials_catalog);
   i = i || {
       'id': 0,
       'name': 'Материал\x20не\x20существует',
       'code': ''
     },
     h['id'] = i['id'],
     h['name'] = i['name'],
     h['code'] = i['code'],
     h['color'] = void 0,
     h['map'] = void 0,
     i['params'] && (h['color'] = i['params']['color'],
       i['params']['map']) && (h['map'] = i['params']['map']);
   var f = get_material_category_by_id_no_items(i['category'], g),
     f;
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
     void 0 === this['get_model_from_cache'](f) && (this['cache'][f] = {
       'model': f,
       'geometry': g
     });
   }
   static['load_model'](e) {
     if ('' != e['model']) {
       e['center_g'] || (e['center_g'] = 1);
       let f = e['model']['split']('.')['pop']()['toLowerCase']();
       if (void 0 === e['process'] && (e['process'] = 1),
         !e['no_cache'] && 1 == e['process'] && this['get_model_from_cache'](e['model']))
         return this['get_model_from_cache'](e['model'])['geometry'];
       e['rot'] || (e['rot'] = {
           'x': 0,
           'y': 0,
           'z': 0
         }),
         e['scale'] || (e['scale'] = {
           'x': 0,
           'y': 0,
           'z': 0
         });
       let g = e['model'];
       return -1 < g['indexOf']('broskokitchenplanner.com') && g.replace('https://broskokitchenplanner.com',
           'https://planplace.ru'),
         g['indexOf']('common_assets') < 0 && g['indexOf']('http') < 0 && (g = global_options['acc_url'] + e[
             'model'],
           global_options['is_sub']) && (g = g.replace(global_options['account_name'], global_options[
           'parent_name'])),
         pp['is_local'] && -1 < g['indexOf']('https://planplace.ru') && g.replace('https://planplace.ru',
           'http://3dkitchen.project'),
         e['buffer'] = true,
         loadingModels['add'](g),
         1 == e['process'] ? new Promise((h, i) => {
           this['loaders'][f]['load'](g, j => {
             loadingModels['remove'](g),
               (j = j['scene'] ? j['scene'] : j)['updateMatrixWorld'](true);
             let k = [];
             j['traverse'](l => {
                 var m;
                 'Mesh' != l['type'] && 'LineSegments' != l['type'] || ((m = l['geometry']['clone']())[
                     'scale'](l['scale']['x'], l['scale']['y'], l['scale']['z']),
                   m['name'] = l['name'],
                   k.push(m));
               }),
               e['no_cache'] ? h(k) : (this['add_geometry_to_cache'](e['model'], k),
                 h(this['get_model_from_cache'](e['model'])['geometry']));
           });
         }) : new Promise((h, i) => {
           this['loaders'][f]['load'](g, function(j) {
             loadingModels['remove'](g),
               (j = j['scene'] ? j['scene'] : j)['updateMatrixWorld'](true),
               h(j);
           });
         });
     }
   }
   static['get_meshes'](f) {
     let g = [];
     return f['traverse'](h => {
         'Mesh' != h['type'] && 'LineSegments' != h['type'] || g.push(h);
       }),
       g;
   }
   static['get_model_meshes'](e) {
     loadingModels['add'](e);
     let f = e.split('.')['pop']()['toLowerCase'](),
       g = [];
     return new Promise((h, i) => {
       this['loaders'][f]['load'](e, function(j) {
         loadingModels['remove'](e),
           (j = j['scene'] ? j['scene'] : j)['traverse'](k => {
             'Mesh' != k['type'] && 'LineSegments' != k['type'] || g.push(k['name']);
           }),
           h(g);
       });
     });
   }
   static async ['try_get_model_meshes'](f) {
     loadingModels['add'](f);
     let g = f.split('.')['pop']()['toLowerCase'](),
       h = [];
     try {
       var i;
       return await new Promise((j, k) => {
         this['loaders'][g] ? this['loaders'][g]['load'](f, function(l) {
           try {
             loadingModels['remove'](f),
               (l = l['scene'] ? l['scene'] : l)['traverse'](m => {
                 'Mesh' != m['type'] && 'LineSegments' != m['type'] || h.push(m['name']);
               }),
               j(h);
           } catch (m) {
             k(m);
           }
         }, function(l) {}, function(l) {
           loadingModels['remove'](f),
             k(new Error('Failed\x20to\x20load\x20model\x20from\x20' + f + ':\x20' + (l['message'] || l)));
         }) : k(new Error('No\x20loader\x20found\x20for\x20extension:\x20' + g));
       });
     } catch (j) {
       return loadingModels['remove'](f),
         [];
     }
   }
   static['parse_mesh_name'](f) {
     var g = {
         'v': 1,
         'm': '',
         't': '',
         's': ''
       },
       h, j, k;
     if (/v\([^)]*\)/ ['test'](f) || f['includes']('('))
       for (k of f.split('_')) {
         var p = k['match'](/([a-zA-Z]+)\(([^)]*)\)/),
           p, q, u;
         p && ([, p, q] = p,
           u = Number(q),
           g[p] = isNaN(u) || '' === q ? q : u);
       }
     else {
       var f = f.split('_'),
         v = ['gen', 'glass', 'mirror', 'back', 'black', 'al'],
         w = /^[xyz]+$/,
         y, f;
       for (y of f)
         v['includes'](y) ? g['m'] = y : w['test'](y) && !g['t'] && (g['t'] = y);
       0 === Object['keys'](g)['length'] && 2 <= f.length && 2 <= (f = f.filter(B => '' !== B['trim']()))[
         'length'] && (g['m'] = f[0],
         g['t'] = f[1]);
     }
     var z = {
       'x': 0,
       'y': 0,
       'z': 0
     };
     for (let B = 0; B < g['t']['length']; B++)
       z[g['t'][B]] = 1;
     g['t'] = z;
     var A = {
       'x': 0,
       'y': 0,
       'z': 0
     };
     for (let C = 0; C < g['s']['length']; C++)
       A[g['s'][C]] = 1;
     return g['s'] = A,
       g['tax'] = {
         'x': 'x',
         'y': 'y'
       },
       g;
   }
   static['set_size'](f, g, h) {
     var j = f['geometry']['attributes']['position'];
     let k = new THREE['Vector3'](h['size']['x'], h['size']['y'], h['size']['z'])['sub'](h['box'])['divideScalar'](
       2);
     var l = ['x', 'y', 'z'];
     let m = {
         'x': 1,
         'y': 1,
         'z': 1
       },
       p = {
         'x': [0, 0],
         'y': [0, 0],
         'z': [0, 0]
       };
     for (let q = 0; q < j['count']; q++) {
       let u = {
         'x': j['getX'](q),
         'y': j['getY'](q),
         'z': j['getZ'](q)
       };
       l.forEach(v => {
           0 != h['t'][v] && (u[v] < p[v][0] && (u[v] = u[v] - k[v] / m[v]),
               u[v] > p[v][1]) && (u[v] = u[v] + k[v] / m[v]),
             0 != h['s'][v] && (u[v] *= h['size'][v] / h['box'][v]);
         }),
         j['setXYZ'](q, u['x'], u['y'], u['z']);
     }
   }
   static['set_scale'](f, g) {
     var h = f['geometry']['attributes']['position'],
       i = ['x', 'y', 'z'];
     for (let j = 0; j < h['count']; j++) {
       let k = {
         'x': h['getX'](j),
         'y': h['getY'](j),
         'z': h['getZ'](j)
       };
       i.forEach(l => {
           k[l] *= g[l];
         }),
         h['setXYZ'](j, k['x'], k['y'], k['z']);
     }
   }
 }

 function load_model(f) {
   return Model_utils['load_model'](f);
 }

 function load_envmap(e = {}) {
   return e['urls'] || (e['urls'] = ['/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg',
       '/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg',
       '/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg'
     ]),
     new Promise(function(f, g) {
       new THREE['CubeTextureLoader']()['load'](e['urls'], function(h) {
         f(h);
       });
     });
 }

 function correct_uv(f, g) {
   f['computeBoundingBox'](),
     g['computeBoundingBox']();
   var h = (g['boundingBox']['max']['x'] - g['boundingBox']['min']['x']) / (f['boundingBox']['max']['x'] - f[
       'boundingBox']['min']['x']),
     j = (g['boundingBox']['max']['y'] - g['boundingBox']['min']['y']) / (f['boundingBox']['max']['y'] - f[
       'boundingBox']['min']['y']);
   for (let k = 0; k < g['faceVertexUvs']['length']; k++)
     for (let m = 0; m < g['faceVertexUvs'][k]['length']; m++)
       for (let p = 0; p < g['faceVertexUvs'][k][m]['length']; p++) {
         let q = g['faceVertexUvs'][k][m][p],
           u = q['x'],
           v = q['y'];
         0 < u && u < 1 && (u < 0.5 ? u /= h : 0.5 < u && (u = 1 - (1 - u) / h)),
           0 < v && v < 1 && (v < 0.5 ? v /= j : 0.5 < v && (v = 1 - (1 - v) / j)),
           q['set'](u, v);
       }
 }

 function correct_uv_buff(f, g) {
   if (f && g) {
     f['computeBoundingBox'](),
       g['computeBoundingBox']();
     var h = g['attributes']['uv'];
     if (h) {
       var i = (g['boundingBox']['max']['x'] - g['boundingBox']['min']['x']) / (f['boundingBox']['max']['x'] - f[
           'boundingBox']['min']['x']),
         j = (g['boundingBox']['max']['y'] - g['boundingBox']['min']['y']) / (f['boundingBox']['max']['y'] - f[
           'boundingBox']['min']['y']);
       g['name']['indexOf']('steklo2');
       for (let k = 0; k < h['count']; k++) {
         let l = h['getX'](k),
           m = h['getY'](k);
         0 < l && l < 1 && (l < 0.5 ? l /= i : 0.5 < l && (l = 1 - (1 - l) / i)),
           0 < m && m < 1 && (m < 0.5 ? m /= j : 0.5 < m && (m = 1 - (1 - m) / j)),
           h['setXY'](k, l, m);
       }
       g['attributes']['uv']['needsUpdate'] = true;
     }
   }
 }

 function set_size_buff(h, j, k) {
   var q = h['geometry']['attributes']['position'],
     v = (k['size'] || (k['size'] = {},
         k['size']['x'] = k['width'],
         k['size']['y'] = k['height'],
         k['size']['z'] = k['depth']),
       new THREE['Vector3'](k['size']['x'], k['size']['y'], k['size']['z'])['sub'](k['box'])['divideScalar'](2));
   if (-1 < j['indexOf']('v(2)') || -1 < j['indexOf']('v(3)')) {
     var w = j['match'](/_s\((.*?)\)/),
       y = j['match'](/_t\((.*?)\)/);
     if (null !== w && (-1 < w[1]['indexOf']('x') && (h['scale']['x'] = k['size']['x'] / k['box']['x']),
         -1 < w[1]['indexOf']('y') && (h['scale']['y'] = k['size']['y'] / k['box']['y']),
         -1 < w[1]['indexOf']('z')) && (h['scale']['z'] = k['size']['z'] / k['box']['z']),
       null !== y) {
       let G = [1, 1, 1];
       var w = j['match'](/_tdiv\((.*?)\)/),
         h = (null != w && (G = w[1]['split'](',')),
           j['match'](/_tpx\((.*?)\)/)),
         w = j['match'](/_tpy\((.*?)\)/),
         z = j['match'](/_tpz\((.*?)\)/);
       let H = [0, 0],
         I = [0, 0],
         J = [0, 0],
         K = 0,
         L = 0,
         N = 0;
       null != h && ((H = h[1]['split'](','))[0] = parseInt(H[0]) / units,
           H[1] = parseInt(H[1]) / units,
           K = 1),
         null != w && ((I = w[1]['split'](','))[0] = parseInt(I[0]) / units,
           I[1] = parseInt(I[1]) / units,
           L = 1),
         null != z && ((J = z[1]['split'](','))[0] = parseInt(J[0]) / units,
           J[1] = parseInt(J[1]) / units,
           N = 1);
       for (let O = 0; O < q['count']; O++) {
         var A = q['getX'](O),
           B = q['getY'](O),
           C = q['getZ'](O);
         let P = A,
           Q = B,
           R = C; -
         1 < y[1]['indexOf']('x') && (0 == K ? A < 0 ? P -= v['x'] / G[0] : P += v['x'] / G[0] : (A < H[
             0] && (P -= v['x'] / G[0]),
             A > H[1] && (P += v['x'] / G[0]))),
           -1 < y[1]['indexOf']('y') && (0 == L ? B < 0 ? Q -= v['y'] / G[0] : Q += v['y'] / G[0] : (B < I[
               0] && (Q -= v['y'] / G[0]),
             B > I[1] && (Q += v['y'] / G[0]))),
           -1 < y[1]['indexOf']('z') && (0 == N ? C < 0 ? R -= v['z'] / G[0] : R += v['z'] / G[0] : (B < J[
               0] && (R -= v['z'] / G[0]),
             B > J[1] && (R += v['z'] / G[0]))),
           q['setXYZ'](O, P, Q, R);
       }
     }
   } else {
     let S = -1 < j['indexOf']('x'),
       T = -1 < j['indexOf']('y'),
       U = -1 < j['indexOf']('z');
     1 == k['is_handle'] && (S = 1,
       T = 0,
       U = 0);
     for (let W = 0; W < q['count']; W++) {
       var D = q['getX'](W),
         E = q['getY'](W),
         F = q['getZ'](W);
       let Z = D,
         a0 = E,
         a1 = F;
       S && (D < 0 ? Z -= v['x'] : Z += v['x']),
         T && (E < 0 ? a0 -= v['y'] : a0 += v['y']),
         U && (F < 0 ? a1 -= v['z'] : a1 += v['z']),
         q['setXYZ'](W, Z, a0, a1);
     }
   }
 }
 let t_s1, t_s2;

 function get_drag_areas(f, g) {
   var h = [];
   for (let i = f.length; i--;)
     'Module' === f[i]['userData']['class'] && f[i]['uuid'] != g['uuid'] && 1 !== f[i]['userData']['params']['spec'][
       'is_fill'
     ] && h.push(...f[i]['get_drag_areas'](g['userData']['params']['id'] + ''));
   return h;
 }

 function get_drag_areas_embed(f, g) {
   let h = [];
   for (let i = f.length; i--;)
     'Module' === f[i]['userData']['class'] && f[i]['uuid'] !== g['uuid'] && true !== f[i]['userData']['params']['spec']
     ['is_fill'] && f[i]['userData']['parts']?.['fill_section'] && Object['values'](f[i]['userData']['parts'][
       'fill_section'
     ])['forEach'](j => {
       j['drag_area'] && j['drag_area']['visible'] && h.push(j['drag_area']);
     });
   return h;
 }

 function get_snap_points(f) {
   var g = {},
     h, j;
   let k = f['userData']['children'];
   f['userData']['params']['spec']['replace'] && 0 < k.length && 0 < k.map((w, x) => 'Module' === w[
     'temp_type'] ? x : -1)['filter'](w => -1 !== w)['length'] && (k = k.filter(w => 'Module' !== w[
     'temp_type']));
   for (let w = 0; w < k.length; w++)
     if (k[w]['userData']['params']) {
       var m = k[w],
         p = m['userData']['path'],
         q = [],
         u = [{
           'x': 0,
           'y': 0,
           'z': 0
         }, {
           'x': 's:x',
           'y': 0,
           'z': 0
         }, {
           'x': 's:x',
           'y': 's:y',
           'z': 0
         }, {
           'x': 0,
           'y': 's:y',
           'z': 0
         }, {
           'x': 0,
           'y': 0,
           'z': 's:z'
         }, {
           'x': 's:x',
           'y': 0,
           'z': 's:z'
         }, {
           'x': 's:x',
           'y': 's:y',
           'z': 's:z'
         }, {
           'x': 0,
           'y': 's:y',
           'z': 's:z'
         }];
       for (let x = 0; x < u.length; x++) {
         q.push({
           'pos': u[x]
         });
         var v = m['userData']['params']['spec']['snap_points']?.[x];
         v && q.push({
           'pos': v
         });
       }
       g[p] = q;
     }
   return f['userData']['path'] && (g[f['userData']['path']] = (j = [{
       'x': 0,
       'y': 0,
       'z': 0
     }, {
       'x': 's:x',
       'y': 0,
       'z': 0
     }, {
       'x': 's:x',
       'y': 's:y',
       'z': 0
     }, {
       'x': 0,
       'y': 's:y',
       'z': 0
     }, {
       'x': 0,
       'y': 0,
       'z': 's:z'
     }, {
       'x': 's:x',
       'y': 0,
       'z': 's:z'
     }, {
       'x': 's:x',
       'y': 's:y',
       'z': 's:z'
     }, {
       'x': 0,
       'y': 's:y',
       'z': 's:z'
     }])['map'](y => ({
       'pos': y
     }))),
     g;
 }

 function get_section_intersection(f, g, h) {
   var h = get_drag_areas(d_objects, h),
     g = g['intersectObjects'](h, true),
     h = {
       'obj': null,
       'point': null
     };
   return g.length && g[0]['object'] ? (f && (f['get_area']()['set_material'](drag_area_materials['area']),
         f['get_parent']()['build_drag_sizes']()),
       f = g[0]['object'],
       h['point'] = g[0]['point'],
       f['get_area']()['set_material'](drag_area_materials['area_hover'])) : (f && (f['get_area']()['set_material'](
           drag_area_materials['area']),
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
   if (g['layers']['set'](1),
     f) {
     var j = g['intersectObject'](f, true);
     if (0 < j.length)
       return f['highlight'](),
         g['layers']['mask'] = i, {
           'obj': f,
           'point': j[0]['point']
         };
     f['unhighlight']();
     var j = f['userData']['parent'];
     j instanceof CabinetFillSection && (0 < j['userData']['children']['length'] && (j['userData']['children'][
           'forEach'
         ](k => {
           k['snap_points_group'] && (k['remove'](k['snap_points_group']),
             k['snap_points_group'] = null);
         }),
         j['snap_points_group']) && (j['remove'](j['snap_points_group']),
         j['snap_points_group'] = null),
       j['userData']['dragCache'] = null);
   }
   var j = get_drag_areas_embed(d_objects, h),
     h = g['intersectObjects'](j, true),
     g, i, j;
   return g['layers']['mask'] = i,
     j.forEach(k => {
       var k, k;
       k !== f && (k['unhighlight'](),
         (k = k['userData']['parent']) instanceof CabinetFillSection && k['userData']['params']['spec'][
           'show_sizes'] && !k['userData']['params']['spec']['show_sizes_hover'] && k['userData']['own_object'][
           'children'
         ]['forEach'](l => {
           l instanceof CabinetSize && global_options['sizes_visible'] && (l['visible'] = true);
         }),
         k instanceof CabinetFillSection) && k['userData']['params']['spec']['replace'] && 0 < (k = k['userData'][
         'children'
       ] || [])['length'] && k.forEach(l => {
         'Module' === l['temp_type'] && (l['visible'] = true);
       });
     }),
     0 < h.length ? ((g = h[0]['object']['parent'])['highlight'](),
       (i = h[0]['object']['parent']['userData']['parent']) instanceof CabinetFillSection && i['userData']['params'][
         'spec'
       ]['replace'] && 0 < (j = i['userData']['children'] || [])['length'] && j.forEach(k => {
         'Module' === k['temp_type'] && (k['visible'] = false);
       }), {
         'obj': g,
         'point': h[0]['point']
       }) : {
       'obj': null,
       'point': null
     };
 }

 function removeElementFromArray(f, g) {
   var h = [];
   for (let i = 0; i < f.length; i++)
     f[i] !== g && h.push(f[i]);
   return h.push(room['floor']),
     h;
 }

 function gp_t(f) {
   return f ? f['parent'] instanceof Tabletop || f['parent'] instanceof CabinetTabletop ? f['parent'] : gp_t(f[
     'parent']) : null;
 }

 function connect_coupe() {
   var f = copy_object(c_params_n),
     g = (f['spec']['group'] = 'bottom',
       f['spec']['variants'][0]['size']['x'] = parseInt(t_s1['params']['size']['x']) + parseInt(t_s2['params']['size']
         ['x']),
       f['spec']['variants'][0]['size']['y'] = parseInt(t_s1['params']['size']['y']),
       f['spec']['variants'][0]['size']['z'] = parseInt(t_s1['params']['size']['z']),
       f['spec']['variants'][0]['code'] = t_s1['params']['code'] + ',' + t_s2['params']['code'],
       f['spec']['rest'] = t_s1['params']['spec']['rest'],
       f['events'] = copy_object(t_s1['params']['events']),
       f['spec']['rest']['free_size'] = 0,
       f['variables'] = copy_object(t_s1['params']['variables']),
       f['materials'] = copy_object(t_s1['params']['materials']),
       []),
     h = [],
     j = copy_object(t_s1['params']['children'][0]),
     k = copy_object(t_s2['params']['children'][0]),
     l = dp['get']('section');
   l['children']['push'](j),
     l['children']['push'](k);
   let m;
   for (let q = j['children']['length']; q--;)
     'Секция\x20под\x20двери\x20купе' == j['children'][q]['name'] && (m = copy_object(j['children'][q]),
       j['children']['splice'](q, 1));
   for (let u = k['children']['length']; u--;)
     'Секция\x20под\x20двери\x20купе' == k['children'][u]['name'] && k['children']['splice'](u, 1);
   var p = 0,
     l = (0 == t_s1['rotation']['y'] ? t_s1['position']['x'] > t_s2['position']['x'] ? (j['size']['x'] = t_s1[
           'params']['size']['x'],
         k['size']['x'] = t_s2['params']['size']['x'],
         j['pos']['x'] = k['size']['x']) : (j['size']['x'] = t_s1['params']['size']['x'],
         k['size']['x'] = t_s2['params']['size']['x'],
         k['pos']['x'] = j['size']['x']) : t_s1['rotation']['y'] == Math['PI'] ? t_s1['position']['x'] > t_s2[
         'position']['x'] ? (j['size']['x'] = t_s1['params']['size']['x'],
         k['size']['x'] = t_s2['params']['size']['x'],
         k['pos']['x'] = j['size']['x']) : (j['size']['x'] = t_s1['params']['size']['x'],
         k['size']['x'] = t_s2['params']['size']['x'],
         j['pos']['x'] = k['size']['x']) : t_s1['position']['z'] > t_s2['position']['z'] ? (j['size']['x'] = t_s1[
           'params']['size']['x'],
         k['size']['x'] = t_s2['params']['size']['x'],
         k['pos']['x'] = j['size']['x']) : (j['size']['x'] = t_s1['params']['size']['x'],
         k['size']['x'] = t_s2['params']['size']['x'],
         j['pos']['x'] = k['size']['x']),
       l['children']['push'](m),
       f['children']['push'](l),
       sc['add_object']('cabinet_cn', f, false));
   l['position']['copy'](t_s1['position']),
     0 == t_s1['rotation']['y'] ? t_s1['position']['x'] > t_s2['position']['x'] ? (j['size']['x'] = t_s1['params'][
         'size'
       ]['x'],
       k['size']['x'] = t_s2['params']['size']['x'],
       j['pos']['x'] = k['size']['x'],
       t_s2['box']['update'](),
       l['position']['copy'](t_s1['position']),
       l['position']['x'] = t_s2['box']['min']['x'] + f['spec']['variants'][0]['size']['x'] / units / 2) : (j[
         'size']['x'] = t_s1['params']['size']['x'],
       k['size']['x'] = t_s2['params']['size']['x'],
       k['pos']['x'] = j['size']['x'],
       t_s1['box']['update'](),
       l['position']['copy'](t_s1['position']),
       l['position']['x'] = t_s1['box']['min']['x'] + f['spec']['variants'][0]['size']['x'] / units / 2) : t_s1[
       'rotation']['y'] == Math['PI'] ? t_s1['position']['x'] > t_s2['position']['x'] ? (j['size']['x'] = t_s1['params']
       ['size']['x'],
       k['size']['x'] = t_s2['params']['size']['x'],
       k['pos']['x'] = j['size']['x'],
       t_s1['box']['update'](),
       l['position']['copy'](t_s1['position']),
       l['position']['x'] = t_s1['box']['min']['x'] + f['spec']['variants'][0]['size']['x'] / units / 2) : (j[
         'size']['x'] = t_s1['params']['size']['x'],
       k['size']['x'] = t_s2['params']['size']['x'],
       j['pos']['x'] = k['size']['x'],
       t_s2['box']['update'](),
       l['position']['copy'](t_s1['position']),
       l['position']['x'] = t_s2['box']['min']['x'] + f['spec']['variants'][0]['size']['x'] / units / 2) : t_s1[
       'position']['z'] > t_s2['position']['z'] ? (j['size']['x'] = t_s1['params']['size']['x'],
       k['size']['x'] = t_s2['params']['size']['x'],
       k['pos']['x'] = j['size']['x']) : (j['size']['x'] = t_s1['params']['size']['x'],
       k['size']['x'] = t_s2['params']['size']['x'],
       j['pos']['x'] = k['size']['x']),
     t_s1['delete'](),
     t_s2['delete']();
 }

 function rotate_by_normal(f, g) {
   var g = new THREE['Vector3'](g['x'], g['y'], g['z'])['normalize'](),
     h = new THREE['Vector3'](0, 0, 1),
     h = new THREE['Quaternion']()['setFromUnitVectors'](h, g);
   f['quaternion']['copy'](h);
 }

 function get_objects_for_inter() {
   let f = [];
   return f = constructor_settings['tabletop_v2'] ? f['concat'](room['active_objects'], global_data['tabletop'][
     'items']) : room['active_objects'];
 }

 function debounce(f, g) {
   let h;
   return function j(...k) {
     var l = () => {
       clearTimeout(h),
         f(...k);
     };
     clearTimeout(h),
       h = setTimeout(l, g);
   };
 }
 THREE['DragControls'] = function(N, a0, a1) {
     this['params'] = {};
     let a2 = bb(),
       a3 = (this['params']['grid'] = 1 / units,
         this['params']['snap_distance'] = 10,
         this['top_cabinets_helper'] = null,
         this['wallpanel_helper'] = null,
         this['block_move'] = 0,
         this['view_mode'] = 0),
       a4 = {
         'x': 0,
         'y': 0
       },
       a5 = 300,
       a6 = 5,
       a7 = null;
     var a8, a9;
     let aa = new THREE['Vector3'](),
       ab = new THREE['Vector3'](),
       ac, ad;
     var af = false,
       ag = 0,
       ah = 0,
       ai = 0,
       aj = new THREE['Plane'](),
       ak = new THREE['Vector3']();
     let al = {
       'x': 0,
       'y': 0
     };
     var am = null;
     let an = null,
       ao = {
         'x': 0,
         'y': 0,
         'both': 0,
         'tabletop_rebuilt': 0
       },
       ap = null;
     var aq = 0,
       ar, as;
     this['set_camera'] = function(bi) {
       a0 = bi;
     };
     let at = '',
       au = 150;
     var av = 0,
       aw = 1,
       ax = new THREE['Raycaster'](),
       ay = new THREE['Vector2'](),
       az = new THREE['Vector3'](),
       aA = null,
       aB = null,
       aC = null,
       aD = this;
     let aE = null;
     var aF = null;
     let aG = null,
       aH = false,
       aI = true,
       aJ = null,
       aK = {};
     var aL = null,
       aM = null,
       aN = null,
       aO = null,
       aP = null,
       aQ = (this['get_selected'] = function() {
           return aA;
         },
         this['set_selected'] = function(bi) {
           av = 1,
             aw = 0,
             (aA = bi)['box']['update'](),
             aa['copy'](aA['position']['clone']()),
             aD['s_helper']['set_size'](aA['box']),
             aD['s_helper']['position']['copy'](aA['position']),
             aD['s_helper']['position']['y'] = aA['position']['y'] + aD['s_helper']['size']['y'] / 2,
             aD['s_helper']['show']();
         },
         this['update_selection'] = function(bi) {},
         this['clear_selected'] = function() {
           aA = null,
             this['s_helper']['hide']();
         },
         this['hide_helper'] = function() {
           this['s_helper']['hide']();
         },
         this['set_selection_position'] = function(bi) {
           this['s_helper']['position']['set'](bi);
         },
         this['set_cursor'] = function(bi = 'auto') {
           a1['style']['cursor'] = bi;
         },
         new THREE['Matrix4']()),
       aR = (this['s_helper'] = make_s_helper(1, 1, 1),
         this['s_helper']['userData']['renderable'] = false,
         this['s_helper']['renderOrder'] = 1,
         this['s_helper']['size'] = new THREE['Vector3'](1, 1, 1),
         this['s_helper']['set_size'] = function(bi) {
           aD['s_helper']['scale']['set'](1, 1, 1);
           var bj = common_box['setFromObject'](aD['s_helper'])['getSize'](new THREE['Vector3']())['clone'](),
             bi = bi['getSize'](new THREE['Vector3']())['clone']();
           aD['s_helper']['size'] = bi,
             aD['s_helper']['scale']['set']((bi['x'] + 0.1) / bj['x'], (bi['y'] + 0.1) / bj['y'], (bi['z'] + 0.1) / bj[
               'z']);
         },
         this['s_helper']['make'] = function(bi) {
           var bj, bk, bk;
           1 == (bi = bi || aA)['userData']['is_interactive'] || 'draggable' == bi['object_type'] ? (bk = box3[
                 'setFromObject'](bi)['clone']()['getCenter'](new THREE['Vector3']()),
               aD['s_helper']['set_size'](box3['setFromObject'](bi)),
               aD['s_helper']['position']['copy'](bk),
               ce(bi)) : (bi['box'] ? aD['s_helper']['set_size'](bi['box']) : aD['s_helper']['set_size'](box3[
                 'setFromObject'](bi)),
               bk = bi['getWorldPosition'](new THREE['Vector3']()),
               aD['s_helper']['position']['copy'](bk),
               aD['s_helper']['position']['y'] = bk['y'] + aD['s_helper']['size']['y'] / 2),
             aD['s_helper']['show'](),
             aD['update_selection'](bi);
         },
         this['clear_hovered'] = function() {
           aB = null;
         },
         this['s_helper']['make_w_box'] = function(bi, bj) {
           aD['s_helper']['show']();
           var bk = box3['setFromObject'](aA['model']);
           bk['expandByObject'](aA['smes_model']),
             aD['s_helper']['set_size'](bk),
             aD['s_helper']['position']['copy'](bk['getCenter'](vec3));
         },
         this['s_helper']['make_box'] = function(bi) {
           bi = bi || aA,
             aD['s_helper']['show'](),
             aD['s_helper']['set_size'](box3['setFromObject'](bi)),
             aD['s_helper']['position']['copy'](bi['getWorldPosition'](new THREE['Vector3']())),
             aD['s_helper']['position']['z'] = bi['getWorldPosition'](new THREE['Vector3']())['z'] + aD['s_helper'][
               'size'
             ]['z'] / 2,
             aD['update_selection'](bi);
         },
         new THREE['Vector3']()),
       aS = (this['s_helper']['make_from_center_and_size'] = function(bi) {
           aD['s_helper']['scale']['set'](1, 1, 1);
           var bj = common_box['setFromObject'](aD['s_helper'])['getSize'](new THREE['Vector3']())['clone'](),
             bk = bi['getSize'](new THREE['Vector3']())['clone']();
           aD['s_helper']['size'] = bk,
             aD['s_helper']['scale']['set']((bk['x'] + 0.1) / bj['x'], (bk['y'] + 0.1) / bj['y'], (bk['z'] + 0.1) / bj[
               'z']),
             aD['position']['x'] = bi['getCenter'](new THREE['Vector3']())['x'],
             aD['position']['z'] = bi['getCenter'](new THREE['Vector3']())['z'],
             aD['position']['y'] = bi['getCenter'](new THREE['Vector3']())['y'];
         },
         this['s_helper']['show'] = function() {
           this['visible'] = true;
         },
         this['s_helper']['hide'] = function() {
           this['visible'] = false;
         },
         this['s_helper']['position']['set'](10000000, 1000000, 1000000),
         scene['add'](this['s_helper']),
         this['cut_helper'] = new THREE['Mesh'](new THREE['BoxBufferGeometry'](1, 4, 60), new THREE[
           'MeshPhongMaterial']({
           'color': '#880000',
           'depthTest': true,
           'depthWrite': false,
           'side': THREE['DoubleSide'],
           'transparent': true,
           'opacity': 1
         })),
         this['cut_helper']['params'] = {},
         this['cut_helper']['params']['height'] = 4,
         this['cut_helper']['params']['depth'] = 60,
         this['cut_helper']['visible'] = false,
         this['cut_helper']['set_size'] = function(bi, bj) {},
         []),
       aT = (1 != constructor_settings['tabletop_v2'] && 1 != constructor_settings['core_v2'] || scene['add'](this[
           'cut_helper']),
         null);
     let aU = 0;

     function aV(bi) {
       if (!global_options['size_edit_mode']?.['active'] && (bi['type']['indexOf']('touch') < 0 ? bi['preventDefault']
           () : bi = bi['changedTouches'][0],
           1 != aU) && 1 !== aD['block_move']) {
         var bj = a1['getBoundingClientRect'](),
           bk, bl, bj, bm, bn, bo, bp, bj, bo, bq, br;
         ay['x'] = (bi['clientX'] - bj['left']) / bj['width'] * 2 - 1,
           ay['y'] = -(bi['clientY'] - bj['top']) / bj['height'] * 2 + 1,
           ax['setFromCamera'](ay, a0);
         let c5;
         if ('picker' == global_options['mouse_mode']['mode']) {
           if ('walls' == global_options['mouse_mode']['target'])
             return void(0 < (c5 = ax['intersectObjects'](b7(), true))['length'] ? (aB && (aB['material'][
                 'emissiveIntensity'
               ] = 0),
               (aB = c5[0]['object'])['material']['emissive']['set']('#9bff96'),
               aB['material']['emissiveIntensity'] = 0.05,
               global_options['mouse_mode']['obj'] = aB,
               a1['style']['cursor'] = global_options['color_picker_cursor']) : (aB && (aB['material'][
                 'emissiveIntensity'
               ] = 0),
               aB = null,
               global_options['mouse_mode']['obj'] = null,
               a1['style']['cursor'] = 'auto'));
           if ('facade_materials' == global_options['mouse_mode']['target']) {
             var bj = ax['intersectObjects'](b8(), true),
               bs;
             if (0 < bj.length && 'wall' !== b2(bj[0]['object'])['object_type']) {
               if ('wall_panel' == bj[0]['object']['name'] && 1 != b2(bj[0]['object'])['params']['draggable'])
                 return;
               bj[0]['object']['no_click_event'] && bj['shift'](),
                 aB && (aB['material']['emissiveIntensity'] = 0),
                 aB = bj[0]?.['object'],
                 bi['ctrlKey'],
                 null !== (aB ? b3(aB) : null) && (aB['material']['emissive']['set']('#9bff96'),
                   aB['material']['emissiveIntensity'] = 0.05,
                   global_options['mouse_mode']['obj'] = aB,
                   a1['style']['cursor'] = global_options['color_picker_cursor']);
             } else
               aB && (aB['material']['emissiveIntensity'] = 0),
               aB = null,
               global_options['mouse_mode']['obj'] = null,
               a1['style']['cursor'] = 'auto';
             return;
           }
           if ('facades' == global_options['mouse_mode']['target']) {
             var bj = ax['intersectObjects'](b8(), true);
             if (0 < bj.length && 'wall' !== b2(bj[0]['object'])['object_type']) {
               if ('wall_panel' == bj[0]['object']['name'] && 1 != b2(bj[0]['object'])['params']['draggable'])
                 return;
               bj[0]['object']['no_click_event'] && bj['shift'](),
                 aB && (aB['material']['emissiveIntensity'] = 0);
               let c6 = b3(aB = bj[0]?.['object']);
               if ('Tabletop' == c6?.['parent']['name'])
                 return;
               null !== c6 && c6['userData']['cabinet'] && (1 == global_options['mouse_mode']['radius'] ? c6[
                   'cabinet']['params']['cabinet']['type']['indexOf']('radius') < 0 && (c6 = null) : -1 < c6[
                   'cabinet']['params']['cabinet']['type']['indexOf']('radius') && (c6 = null)),
                 null !== c6 && (aB['material']['emissive']['set']('#9bff96'),
                   aB['material']['emissiveIntensity'] = 0.05,
                   global_options['mouse_mode']['obj'] = aB,
                   a1['style']['cursor'] = global_options['color_picker_cursor']);
             } else
               aB && (aB['material']['emissiveIntensity'] = 0),
               aB = null,
               global_options['mouse_mode']['obj'] = null,
               a1['style']['cursor'] = 'auto';
             return;
           }
           if ('fill' == global_options['mouse_mode']['target']) {
             let c7 = [];
             for (let c8 = 0; c8 < room['active_objects']['length']; c8++)
               'Module' === room['active_objects'][c8]['temp_type'] && 1 != room['active_objects'][c8]['userData'][
                 'params'
               ]['spec']['is_fill'] && (c7 = c7['concat'](room['active_objects'][c8]['get_drag_areas'](global_options[
                 'mouse_mode']['item_id'] + '')));
             var bj = ax['intersectObjects'](c7, true);
             return void(0 < bj.length ? (aB && aB['material']['color']['setHex'](9880214),
               (aB = bj[0]['object'])['material']['color']['setHex'](8504449),
               global_options['mouse_mode']['obj'] = aB,
               a1['style']['cursor'] = global_options['color_picker_cursor']) : (aB && aB['material']['color'][
                 'setHex'
               ](9880214),
               aB = null,
               global_options['mouse_mode']['obj'] = null,
               a1['style']['cursor'] = 'auto'));
           }
           if ('erase' == global_options['mouse_mode']['target']) {
             let c9 = [];
             for (let ca = 0; ca < room['active_objects']['length']; ca++)
               'Module' === room['active_objects'][ca]['temp_type'] && 1 != room['active_objects'][ca]['userData'][
                 'params'
               ]['spec']['is_fill'] && (c9 = c9['concat'](room['active_objects'][ca]['get_draggables']()));
             var bj = ax['intersectObjects'](c9, true),
               bj;
             return void(0 < bj.length ? (bj = b4(bj[0]['object']),
               aB && 'Module' !== aB['temp_type'] && aB['material']['color']['setHex'](9880214),
               (aB = bj['userData']['helpers']['children'][0])['material']['color']['setHex'](16711680),
               global_options['mouse_mode']['obj'] = aB,
               a1['style']['cursor'] = global_options['color_picker_cursor']) : (aB && aB['material']['color'][
                 'setHex'
               ](9880214),
               aB = null,
               global_options['mouse_mode']['obj'] = null,
               a1['style']['cursor'] = 'auto'));
           }
           if ('tabletop_cut' == global_options['mouse_mode']['target'])
             switch (global_options['mouse_mode']['item_id']) {
               case 1:
                 return aA ? (bl = gp_t(aA),
                   void((c5 = ax['intersectObject'](bl, true)) && c5[0]['object'] && (aA['position']['x'] = Math[
                       'round'](bl['worldToLocal'](c5[0]['point'])['x'] / aD['params']['grid']) * aD['params'][
                       'grid'
                     ],
                     bl['build_conn_sizes']()))) : void((c5 = ax['intersectObjects'](global_data['tabletop'][
                   'needs_cut'
                 ], true))['length'] ? (aB = gp_t(c5[0]['object']),
                   (c5 = ax['intersectObjects'](aB['connects']['children'], true))['length'] ? (aB = c5[0][
                       'object'
                     ],
                     a1['style']['cursor'] = 'pointer') : a1['style']['cursor'] = 'auto') : (aB = null,
                   scene['add'](aD['cut_helper']),
                   aD['cut_helper']['visible'] = false,
                   a1['style']['cursor'] = 'auto'));
               case 2:
                 return void((c5 = ax['intersectObjects'](global_data['tabletop']['needs_cut'], true))['length'] ? (aB =
                   gp_t(c5[0]['object']),
                   aD['cut_helper']['visible'] = true,
                   aB['add'](aD['cut_helper']),
                   aD['cut_helper']['position']['x'] = aB['worldToLocal'](c5[0]['point'])['x']) : (aB = null,
                   scene['add'](aD['cut_helper']),
                   aD['cut_helper']['visible'] = false,
                   a1['style']['cursor'] = 'auto'));
               case 3:
                 return void((c5 = ax['intersectObjects'](global_data['tabletop']['needs_cut'], true))['length'] ? (aB =
                   gp_t(c5[0]['object']),
                   (c5 = ax['intersectObjects'](aB['connects']['children'], true))['length'] ? (aB = c5[0][
                       'object'
                     ],
                     a1['style']['cursor'] = 'pointer') : a1['style']['cursor'] = 'auto') : (aB = null,
                   scene['add'](aD['cut_helper']),
                   aD['cut_helper']['visible'] = false,
                   a1['style']['cursor'] = 'auto'));
             }
           if ('tabletop_cut_v2' == global_options['mouse_mode']['target'])
             switch (global_options['mouse_mode']['item_id']) {
               case 1:
                 if (aA) {
                   var bt = gp_t(aA);
                   if ((c5 = bt ? ax['intersectObject'](bt, true) : null) && c5[0] && c5[0]['object'] && c5[0][
                       'object'
                     ] !== aA) {
                     let cb = bt['worldToLocal'](c5[0]['point'])['x'];
                     cb = bi['shiftKey'] ? Math['round'](cb * units) / units : 10 * Math['round'](cb * units / 10) /
                       units;
                     var bu = bt?.['userData']['computed']['u_size']['x'] / 2;
                     bu && !bi['shiftKey'] && Math['abs'](bu - Math['abs'](cb)) < 0.8 && (cb = Math['sign'](cb) * bu),
                       aA['position']['x'] = cb,
                       bt['build_conn_sizes']();
                   }
                   return;
                 }
                 return void((c5 = ax['intersectObjects'](pp['info']['tabletop']['items_parts'], true))['length'] ? (
                   aB = gp_t(c5[0]['object']),
                   (c5 = ax['intersectObjects'](aB['userData']['cuts']['connects']['children'], true))['length'] ? (
                     aB = c5[0]['object'],
                     a1['style']['cursor'] = 'pointer') : a1['style']['cursor'] = 'auto') : (aB = null,
                   scene['add'](aD['cut_helper']),
                   aD['cut_helper']['visible'] = false,
                   a1['style']['cursor'] = 'auto'));
               case 2:
                 if ((c5 = ax['intersectObjects'](pp['info']['tabletop']['items_parts'], true))['length']) {
                   if (aB = gp_t(c5[0]['object']),
                     aD['cut_helper']['visible'] = true,
                     c5[0]['object'] !== aD['cut_helper']) {
                     aB['add'](aD['cut_helper']);
                     let cc = aB['worldToLocal'](c5[0]['point'])['x'];
                     cc = bi['shiftKey'] ? Math['round'](cc * units) / units : 10 * Math['round'](cc * units / 10) /
                       units,
                       constructor_settings['core_v2'] ? aD['cut_helper']['position']['set'](cc, aB['userData'][
                         'computed'
                       ]['u_size']['y'] / 2, aB['userData']['cuts']['position']['z']) : aD['cut_helper']['position'][
                         'set'
                       ](cc, aB['userData']['cuts']['position']['y'] + aB['userData']['computed']['u_size']['z'] / 2,
                         aB['userData']['cuts']['position']['z']);
                   }
                 } else
                   aB = null,
                   scene['add'](aD['cut_helper']),
                   aD['cut_helper']['visible'] = false,
                   a1['style']['cursor'] = 'auto';
                 return;
               case 3:
                 return void((c5 = ax['intersectObjects'](pp['info']['tabletop']['items_parts'], true))['length'] ? (
                   aB = gp_t(c5[0]['object']),
                   (c5 = ax['intersectObjects'](aB['userData']['cuts']['connects']['children'], true))['length'] ? (
                     aB = c5[0]['object'],
                     a1['style']['cursor'] = 'pointer') : a1['style']['cursor'] = 'auto') : (aB = null,
                   scene['add'](aD['cut_helper']),
                   aD['cut_helper']['visible'] = false,
                   a1['style']['cursor'] = 'auto'));
             }
         }
         if ('embed' === global_options['mouse_mode']['mode'])
           return bj = global_options['mouse_mode']['planeInfo'],
             bm = global_options['mouse_mode']['embed_obj'],
             bj && bm && !global_options['mouse_mode']['_embed_locked'] && (bn = computeUVOnPlane(bj, ax, aD, units,
               bi)) ? (bo = uvToWorld(bj, bn['u'], bn['v']),
               bm['position']['copy'](bo),
               bj['crossHelper'] && bj['crossHelper']['position']['set'](bn['u'], bn['v'], 0),
               void(global_options['mouse_mode']['_embed_last_uv'] = {
                 'u': bn['u'],
                 'v': bn['v'],
                 'halfU': bj['halfU'],
                 'halfV': bj['halfV']
               })) : void 0;
         if (aK['current_obj'] && !aK['trigger_start']) {
           var bm = bi['clientX'] - aK['mouse_pos']['x'],
             bo = bi['clientY'] - aK['mouse_pos']['y'];
           if (controls['enabled'] = false,
             5 < Math['sqrt'](bm * bm + bo * bo)) {
             aK['trigger_start'] = true;
             var bn = aK['current_obj'];
             if (bn?.['_grab_point']?.['_is_grab_point']) {
               fill_edit_mode(bn);
               var bj = bn['userData']['root']['get_child_params_by_path'](bn['userData']['path']),
                 bm = bn['userData']['root']['uuid'],
                 bo = bn['userData']['parent'],
                 bv = bo['uuid'],
                 bq = bn['get_connected'](),
                 bw = new THREE['Quaternion'](),
                 bo = (bo['getWorldQuaternion'](bw),
                   bn['_get_size'] ? bn['_get_size']() : new THREE['Vector3'](0, 0, 0)),
                 bx = new THREE['Vector3']();
               bn['getWorldPosition'](bx);
               var by, bz = new THREE['Vector3'](bo['x'] / 2, 0, bo['z'] / 2)['clone']()['applyQuaternion'](bw),
                 bz = bx['clone']()['add'](bz),
                 bj = (bj['pos'] = new THREE['Vector3'](),
                   bj['scale'] = new THREE['Vector3'](1, 1, 1),
                   bj['spec']['cabinet_group'] = '',
                   bj['interaction'] ? bj['interaction']['check_intersection'] = 1 : bj['interaction'] = {
                     'check_intersection': 1
                   },
                   bj['spec']['safe_size'] = bj['size'],
                   bj['size'] && delete bj['size'],
                   scene['remove'](bn['_grab_point']),
                   sc['add_object']('module', bj, false));
               bn['visible'] = false,
                 bj['position']['copy'](bz),
                 bj['quaternion']['copy'](bw),
                 bj['userData']['connected'] = bq,
                 bj['section_uuid'] = bv,
                 bj['parent_uuid'] = bm,
                 bj['old_pos'] = aK['old_pos'],
                 bj['object_path'] = bn['userData']['path'],
                 bj['_size_objects'] = bn['userData']['computed']['additional_sizes'],
                 0 < bn['userData']['computed']['additional_sizes']['length'] && bn['userData']['computed'][
                   'additional_sizes'
                 ]['forEach'](cd => {
                   cd['full_dispose']();
                 }),
                 (aA = bj)['userData']['own_object']['visible'] = false,
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
                 for (let cd = 0; cd < aA['userData']['sizes_items']['length']; cd++)
                   aA['userData']['sizes_items'][cd]['visible'] = false;
               } catch (cf) {}
               aI = true;
             }
             aK['current_obj'] = null,
               global_options['mouse_mode']?.['root'] || (global_options['mouse_mode']['root'] = aA),
               fill_edit_mode(aA);
           }
         } else {
           if (aA && 'camera' == global_options['mouse_mode']['mode'] && 0 == aI) {
             let cg = {
                 'x': bi['clientX'],
                 'y': bi['clientY']
               },
               ch = debounce(ci => {
                 var cj = ci['clientX'] - cg['x'],
                   ci = ci['clientY'] - cg['y'],
                   ck;
                 0.0001 < Math['sqrt'](cj * cj + ci * ci) && (active_el = null,
                   aA = null,
                   sc['select_object'](null),
                   aD['s_helper']['hide'](),
                   aI,
                   document['removeEventListener']('mousemove', ch));
               }, 10);
             if (!(aA && aB && active_el && aA['uuid'] === aB['uuid'] && active_el['uuid'] === aA['uuid'] && aB[
                 'uuid'] === active_el['uuid'])) {
               document['addEventListener']('mousemove', ch);
               let ci = () => {
                 document['removeEventListener']('mousemove', ch),
                   document['removeEventListener']('mouseup', ci);
               };
               document['addEventListener']('mouseup', ci);
             }
           }
           if ('drag' == global_options['mouse_mode']['mode'] && (global_options['mouse_mode']['enabled_base_drag'] = !
               0),
             aA?.['fill_helper'] && aA) {
             aA['updateMatrixWorld'](true);
             var bz = new THREE['Vector3'](aA['userData']['params']['size']['x'] / units, aA['userData']['params'][
                 'size'
               ]['y'] / units, aA['userData']['params']['size']['z'] / units),
               bq = aA['getWorldPosition'](new THREE['Vector3']()),
               bv = aA['getWorldQuaternion'](new THREE['Quaternion']()),
               bm = bz['clone']()['multiplyScalar'](0.5);
             bm['y'] = 0,
               bm['applyQuaternion'](bv),
               aA['fill_helper']['position']['copy'](bq)['sub'](bm),
               aA['fill_helper']['quaternion']['copy'](bv),
               aA['fill_helper']['update_size'](bz);
             try {
               for (let cj = 0; cj < aA['userData']['sizes_items']['length']; cj++)
                 aA['userData']['sizes_items'][cj]['visible'] = false;
             } catch (ck) {}
             try {
               aD['s_helper']['hide']();
             } catch (cm) {}
           }
           if (aA && global_options['mouse_mode']['enabled_base_drag'] && 1 == aI) {
             if (!global_options['single_preview'] && 1 != aA['userData']['is_interactive']) {
               if (aA['is_control'])
                 aA['userData']['obj']['resizable'] && aA['userData']['obj']['resizable']['handleDragMove'](aA, bi, a0);
               else {
                 if (!aA['userData'] || !aA['userData']['interaction'] && !aA['userData']['params']['interaction'] || !
                   aA['userData']?.['interaction']?.['movement_locked']) {
                   if ((bi['shiftKey'] || pp_keyboard['c']) && 1 !== aA['copied'] && 1 !== av) {
                     var bn = copy_object(aA['params']);
                     bn['obj_id'] = void 0;
                     let cn = [];
                     'Cabinet' == bn['type'] && (cn = copy_object(bn['accessories_list']),
                       bn['accessories_list'] = []);
                     var bA = sc['add_object'](aA['params']['object_type'], bn);
                     for (let co = 0; co < cn.length; co++) {
                       var bB = cn[co],
                         bC = copy_object(accsessories_data['items'][bB['id']]);
                       pp['interface']['root']['$emit']('add_cart_item', bC, bB['count'], bA['params']['obj_id']);
                     }
                     bA['copied'] = 1;
                   }
                   if ('washer' === aA['object_type'] && (aA['box']['update'](),
                       bj = (constructor_settings['core_v2'] ? pp['info']['tabletop']['items_parts'] : global_data[
                         'tabletop']['items']) || [],
                       (bo = ax['intersectObjects'](bj, true))['length'] ? (null != aE && aE['object']['uuid'] != bo[
                           0]['object']['uuid'] && (aE['object']['material']['transparent'] = false,
                           aE['object']['material']['opacity'] = 1,
                           aE['object']['material']['needsUpdate'] = true,
                           aD['s_helper']['material']['color']['setHex'](1749908)),
                         aE = bo[0]) : null != aE && (room['add'](aA),
                         aE = null),
                       c5 = ax['intersectObjects'](room['walls_objects'], true)),
                     'Module' == aA['userData']['class'] && 1 == aA['userData']['params']['spec']['is_fill'] && 0 ==
                     aH) {
                     for (let cp = room['active_objects']['length']; cp--;) {
                       var bD = room['active_objects'][cp];
                       'Module' == bD['userData']['class'] && bD['show_drag_areas'](aA['userData']['params']['spec'][
                         'id'
                       ], aA['userData']['params']['spec']['element_type']);
                     }
                     aH = true;
                   }
                   if (1 == aA['userData']['params']?.['spec']?.['is_fill']) {
                     for (let cq = 0; cq < room['active_objects']['length']; cq++) {
                       var bE = room['active_objects'][cq];
                       'Module' == bE['userData']['class'] && traverse_parts(bE, (cr, cs, ct) => {
                         cr['userData']['params']['hide_on_drag'] && (cr['visible'] = false);
                       });
                     }
                     var bx = get_section_intersection_embed(aG, ax, aA),
                       bw;
                     if (bx['obj'])
                       return bw = bx['obj']['userData']['parent'],
                         ap = ap || bw,
                         aA['_size_objects'] && 0 < aA['_size_objects']['length'] && ap['uuid'] !== bw['uuid'] && (aA[
                             '_size_objects']['forEach'](cr => {
                             cr['parent'] && (cr['full_dispose'](),
                               cr['parent']['remove'](cr),
                               aA['_size_objects'] = null);
                           }),
                           ap = bw),
                         aA['_snap_points'] = get_snap_points(bw, aA),
                         aA['drag_move'](bx['point'], bw, bx['obj']),
                         aG = bx['obj'],
                         aD['s_helper']['hide'](),
                         void(a2['visible'] = false);
                     aA['_size_objects'] && 0 < aA['_size_objects']['length'] && aA['_size_objects']['forEach'](
                       cr => {
                         cr['parent'] && (cr['full_dispose'](),
                           cr['parent']['remove'](cr),
                           aA['_size_objects'] = null);
                       }),
                       aG = null;
                   }
                   if ('Shaft' === aA['type'] ? c5 = ax['intersectObjects'](room['walls']['children']) : 'washer' !==
                     aA['object_type'] && (c5 = bi['ctrlKey'] || 'surface' === aA['drag_mode'] ? ax['intersectObjects'](
                       removeElementFromArray(get_objects_for_inter(), aA), true) : (bq = room['walls_objects'],
                       ax['intersectObjects'](bq, true))),
                     c5.length) {
                     if ('washer' === aA['object_type']) {
                       let cs = 0,
                         ct = 0;
                       var bm = b1(aA);
                       if ('Cabinet' == bm['type'] && null == aE && (aA['parent']['parent']['rebuild_washer_tabletop']
                         (),
                           room['attach'](aA)),
                         0 == ao['tabletop_rebuilt'] && (ao['x'] != bi['clientY'] || ao['y'] != bi['clientY']) && aA[
                           'parent']['uuid'] != room['uuid'] && 'function' == typeof aA['parent']['parent'][
                           'rebuild_washer_tabletop'
                         ])
                         return aA['parent']['parent']['rebuild_washer_tabletop'](),
                           void(ao['tabletop_rebuilt'] = 1);
                       if (null != aE ? (br = aE['point']['clone'](),
                           0 == aA['parent']['parent']['rotation']['y'] && (cs = Math['round']((-aA['parent'][
                               'parent']['position']['x'] + br['x']) / aD['params']['grid']) * aD['params']['grid'],
                             ct = Math['round']((-aA['parent']['parent']['position']['z'] + br['z']) / aD['params'][
                               'grid'
                             ]) * aD['params']['grid']),
                           aA['parent']['parent']['rotation']['y'] == Math['PI'] && (cs = Math['round']((aA['parent'][
                               'parent'
                             ]['position']['x'] - br['x']) / aD['params']['grid']) * aD['params']['grid'],
                             ct = Math['round']((aA['parent']['parent']['position']['z'] - br['z']) / aD['params'][
                               'grid'
                             ]) * aD['params']['grid']),
                           aA['parent']['parent']['rotation']['y'] == -Math['PI'] / 2 && (cs = Math['round']((-aA[
                               'parent']['parent']['position']['z'] + br['z']) / aD['params']['grid']) * aD['params'][
                               'grid'
                             ],
                             ct = Math['round']((aA['parent']['parent']['position']['x'] - br['x']) / aD['params'][
                               'grid'
                             ]) * aD['params']['grid']),
                           aA['parent']['parent']['rotation']['y'] == Math['PI'] / 2 && (cs = Math['round']((aA[
                               'parent']['parent']['position']['z'] - br['z']) / aD['params']['grid']) * aD['params'][
                               'grid'
                             ],
                             ct = Math['round']((-aA['parent']['parent']['position']['x'] + br['x']) / aD['params'][
                               'grid'
                             ]) * aD['params']['grid'])) : (br = c5[0]['point']['clone'](),
                           cs = br['x'] / aD['params']['grid'] * aD['params']['grid'],
                           bL = br['y'] / aD['params']['grid'] * aD['params']['grid'],
                           ct = br['z'] / aD['params']['grid'] * aD['params']['grid']),
                         null != aE)
                         aA['position']['y'] = box3['setFromObject'](aE['object'])['max']['y'];
                       else {
                         if (aA['parent']['uuid'] === room['uuid']) {
                           let cu = 0;
                           try {
                             cu = parseFloat(aA['params']['height']) / units;
                           } catch (cv) {}
                           cu = cu || (aA['box']['max']['y'] - aA['box']['min']['y']) / 2,
                             'floor' === c5[0]['object']['name'] && (bL = cu),
                             bL = Math['max'](bL, cu);
                         }
                         aA['position']['y'] = bL;
                       }
                       return aA['position']['x'] = cs,
                         aA['position']['z'] = ct,
                         aD['s_helper']['make_w_box'](),
                         void(al = {
                           'x': bi['clientX'],
                           'y': bi['clientY']
                         });
                     }
                     var bv = new THREE['Matrix3']()['getNormalMatrix'](c5[0]['object']['matrixWorld']),
                       bz = c5[0]['face']['normal']['clone']()['applyMatrix3'](bv)['normalize'](),
                       br = (1 !== bz['x'] && -1 !== bz['x'] && (bz['x'] = 0),
                         1 !== bz['y'] && -1 !== bz['y'] && (bz['y'] = 0),
                         1 !== bz['z'] && -1 !== bz['z'] && (bz['z'] = 0),
                         c5[0]['normal_vector'] = bz,
                         c5[0]['point']['clone']()),
                       bn = (1 !== bz['x'] && -1 !== bz['x'] || (az['x'] = 0),
                         1 !== bz['y'] && -1 !== bz['y'] || (az['y'] = 0),
                         1 !== bz['z'] && -1 !== bz['z'] || (az['z'] = 0),
                         aA['box']),
                       bj = (bn = aA['box'] ? bn : new THREE['Box3']()['setFromObject'](aA))['getSize'](new THREE[
                         'Vector3']()),
                       bo = (bi['ctrlKey'] || 'surface' === aA['drag_mode'] || br['sub'](az), {
                         'x': false,
                         'y': false,
                         'z': false
                       }),
                       bw = new THREE['Box3'](),
                       bx = new THREE['Box3'](),
                       bq = new THREE['Box3'](),
                       bm = new THREE['Vector3'](aA['position']['x'], aA['position']['y'] + bj['y'] / 2, aA[
                         'position']['z']),
                       bF = (bw['setFromCenterAndSize'](bm, new THREE['Vector3'](room['params']['width'] / units * 2,
                           bj['y'] + 1, bj['z'] + 1)),
                         bx['setFromCenterAndSize'](bm, new THREE['Vector3'](bj['x'] + 1, room['params']['height'] /
                           units * 2, bj['z'] + 1)),
                         bq['setFromCenterAndSize'](bm, new THREE['Vector3'](bj['x'] + 1, bj['y'] + 1, room[
                           'params']['depth'] / units * 2)),
                         check_intersection_all(bw, aA)),
                       bG = check_intersection_all(bx, aA),
                       bH = check_intersection_all(bq, aA),
                       bI = new THREE['Box3']()['setFromCenterAndSize'](br, bj),
                       bv = (custom_settings['floor_only'] || aA['params'] && aA['params']['hasOwnProperty'](
                           'auto_rotation') && !aA['params']['auto_rotation'] || aA['userData'] && aA['userData'][
                           'interaction'
                         ]['hasOwnProperty']('auto_rotation') && !aA['userData']['interaction']['auto_rotation'] ||
                         0 === c5[0]['object']['rotation']['x'] && Math['abs'](bz['y']) < 0.01 && rotate_by_normal(
                           aA, bz),
                         aA['box'] && !aA['userData']?.['params']?.['spec']?.['is_fill'] && aA['box']['update'](),
                         aA['position']['clone']()),
                       bn, bJ, bK, bm = ('floor' != c5[0]['object']['name'] || 'at_wall' !== aA['userData'][
                           'cabinet_group'
                         ] && 'at_wall_bottom' !== aA['userData']['cabinet_group'] || ((bn = aA['getWorldDirection'](
                             new THREE['Vector3']()))['y'] = 0,
                           bn['normalize'](),
                           (bJ = Math['abs'](bn['x'])) < Math['abs'](bn['z']) ? br['z'] = bv['z'] : br['x'] = bv['x']),
                         Math['round'](br['x'] / aD['params']['grid']) * aD['params']['grid']),
                       bL = Math['round'](br['y'] / aD['params']['grid']) * aD['params']['grid'],
                       bw = Math['round'](br['z'] / aD['params']['grid']) * aD['params']['grid'],
                       bM = [],
                       bN = [],
                       bO = [],
                       bP, bP;
                     let cr = [];
                     if ('function' == typeof check_add_boxes_mouse_move && (cr = check_add_boxes_mouse_move(aA)),
                       bF = bF['concat'](cr),
                       bG = bG['concat'](cr),
                       bH = bH['concat'](cr),
                       'top' === aA['cabinet_type'] && 'Cabinet' === aA['type'] && (bP = {
                           'object_type': 'wall',
                           'box': {
                             'max': {
                               'y': (project_settings['cokol_height'] + project_settings['bottom_modules_height'] +
                                   project_settings['tabletop_thickness'] + project_settings['wall_panel']['height']) /
                                 units
                             },
                             'min': {
                               'y': 0
                             }
                           }
                         },
                         bG.push(bP),
                         null === aD['top_cabinets_helper']) && (aD['top_cabinets_helper'] = make_edges_dashed(room[
                           'params']['width'] / units, 1 / units, room['params']['depth'] / units),
                         aD['top_cabinets_helper']['position']['set'](room['params']['width'] / units / 2, bP['box'][
                           'max'
                         ]['y'], room['params']['depth'] / units / 2),
                         room['add'](aD['top_cabinets_helper'])),
                       'Wall_panel' === aA['type'] && (bP = {
                           'object_type': 'wall',
                           'box': {
                             'max': {
                               'y': (project_settings['cokol_height'] + project_settings['bottom_modules_height'] +
                                 project_settings['tabletop_thickness']) / units
                             },
                             'min': {
                               'y': 0
                             }
                           }
                         },
                         bG.push(bP),
                         null === aD['wallpanel_helper']) && (aD['wallpanel_helper'] = make_edges_dashed(room['params'][
                           'width'
                         ] / units, 1 / units, room['params']['depth'] / units),
                         aD['wallpanel_helper']['position']['set'](room['params']['width'] / units / 2, bP['box'][
                           'max'
                         ]['y'], room['params']['depth'] / units / 2),
                         room['add'](aD['wallpanel_helper'])),
                       'function' == typeof int_y_mouse && int_y_mouse(bG),
                       !bi['ctrlKey'] && 'surface' !== aA['drag_mode']) {
                       for (as = 0; as < bF.length; as++) {
                         'wall' !== bF[as]['object_type'] && bF[as]['box']['update']();
                         var bQ = bF[as]['userData']?.['params']?.['interaction']?.['check_intersection'] || 0;
                         Math['abs'](bI['max']['x'] - bF[as]['box']['min']['x']) < aD['params']['snap_distance'] && bM[
                             'push']({
                             'pos': bF[as]['box']['min']['x'] - bI['getSize'](new THREE['Vector3']())['x'] / 2,
                             'dist': Math['abs'](bI['max']['x'] - bF[as]['box']['min']['x']),
                             'check_intersection': bQ
                           }),
                           Math['abs'](bI['max']['x'] - bF[as]['box']['max']['x']) < aD['params']['snap_distance'] &&
                           bM.push({
                             'pos': bF[as]['box']['max']['x'] - bI['getSize'](new THREE['Vector3']())['x'] / 2,
                             'dist': Math['abs'](bI['max']['x'] - bF[as]['box']['max']['x']),
                             'check_intersection': bQ
                           }),
                           Math['abs'](bI['min']['x'] - bF[as]['box']['max']['x']) < aD['params']['snap_distance'] &&
                           bM.push({
                             'pos': bF[as]['box']['max']['x'] + bI['getSize'](new THREE['Vector3']())['x'] / 2,
                             'dist': Math['abs'](bI['min']['x'] - bF[as]['box']['max']['x']),
                             'check_intersection': bQ
                           }),
                           Math['abs'](bI['min']['x'] - bF[as]['box']['min']['x']) < aD['params']['snap_distance'] &&
                           bM.push({
                             'pos': bF[as]['box']['min']['x'] + bI['getSize'](new THREE['Vector3']())['x'] / 2,
                             'dist': Math['abs'](bI['min']['x'] - bF[as]['box']['min']['x']),
                             'check_intersection': bQ
                           }),
                           bi['altKey'] && Math['abs'](bI['center']()['x'] - bF[as]['box']['center']()['x']) < aD[
                             'params']['snap_distance'] && bM.push({
                             'pos': bF[as]['box']['center']()['x'],
                             'dist': Math['abs'](bI['center']()['x'] - bF[as]['box']['center']()['x']),
                             'check_intersection': bQ
                           });
                       }
                       for (as = 0; as < bH.length; as++) {
                         'wall' !== bH[as]['object_type'] && bH[as]['box']['update']();
                         var bR = bH[as]['userData']?.['params']?.['interaction']?.['check_intersection'] || 0;
                         Math['abs'](bI['max']['z'] - bH[as]['box']['min']['z']) < aD['params']['snap_distance'] && bO[
                             'push']({
                             'pos': bH[as]['box']['min']['z'] - bI['getSize'](new THREE['Vector3']())['z'] / 2,
                             'dist': Math['abs'](bI['max']['z'] - bH[as]['box']['min']['z']),
                             'check_intersection': bR
                           }),
                           Math['abs'](bI['max']['z'] - bH[as]['box']['max']['z']) < aD['params']['snap_distance'] &&
                           bO.push({
                             'pos': bH[as]['box']['max']['z'] - bI['getSize'](new THREE['Vector3']())['z'] / 2,
                             'dist': Math['abs'](bI['max']['z'] - bH[as]['box']['max']['z']),
                             'check_intersection': bR
                           }),
                           Math['abs'](bI['min']['z'] - bH[as]['box']['max']['z']) < aD['params']['snap_distance'] &&
                           bO.push({
                             'pos': bH[as]['box']['max']['z'] + bI['getSize'](new THREE['Vector3']())['z'] / 2,
                             'dist': Math['abs'](bI['min']['z'] - bH[as]['box']['max']['z']),
                             'check_intersection': bR
                           }),
                           Math['abs'](bI['min']['z'] - bH[as]['box']['min']['z']) < aD['params']['snap_distance'] &&
                           bO.push({
                             'pos': bH[as]['box']['min']['z'] + bI['getSize'](new THREE['Vector3']())['z'] / 2,
                             'dist': Math['abs'](bI['min']['z'] - bH[as]['box']['min']['z']),
                             'check_intersection': bR
                           }),
                           bi['altKey'] && Math['abs'](bI['center']()['z'] - bH[as]['box']['center']()['z']) < aD[
                             'params']['snap_distance'] && bO.push({
                             'pos': bH[as]['box']['center']()['z'],
                             'dist': Math['abs'](bI['center']()['z'] - bH[as]['box']['center']()['z']),
                             'check_intersection': bR
                           });
                       }
                       for (as = 0; as < bG.length; as++) {
                         'wall' !== bG[as]['object_type'] && bG[as]['box']['update']();
                         var bS = bG[as]['userData']?.['params']?.['interaction']?.['check_intersection'] || 0;
                         Math['abs'](bI['max']['y'] + bI['getSize'](new THREE['Vector3']())['y'] / 2 - bG[as]['box'][
                             'min'
                           ]['y']) < aD['params']['snap_distance'] && bN.push({
                             'pos': bG[as]['box']['min']['y'] - bI['getSize'](new THREE['Vector3']())['y'],
                             'dist': Math['abs'](bI['max']['y'] + bI['getSize'](new THREE['Vector3']())['y'] / 2 -
                               bG[as]['box']['min']['y']),
                             'check_intersection': bS
                           }),
                           Math['abs'](bI['max']['y'] + bI['getSize'](new THREE['Vector3']())['y'] / 2 - bG[as]['box']
                             ['max']['y']) < aD['params']['snap_distance'] && bN.push({
                             'pos': bG[as]['box']['max']['y'] - bI['getSize'](new THREE['Vector3']())['y'],
                             'dist': Math['abs'](bI['max']['y'] + bI['getSize'](new THREE['Vector3']())['y'] / 2 -
                               bG[as]['box']['max']['y']),
                             'check_intersection': bS
                           }),
                           Math['abs'](br['y'] - bG[as]['box']['max']['y']) < aD['params']['snap_distance'] && bN[
                             'push']({
                             'pos': bG[as]['box']['max']['y'],
                             'dist': Math['abs'](br['y'] - bG[as]['box']['max']['y']),
                             'check_intersection': bS
                           }),
                           Math['abs'](br['y'] - bG[as]['box']['min']['y']) < aD['params']['snap_distance'] && bN[
                             'push']({
                             'pos': bG[as]['box']['min']['y'],
                             'dist': Math['abs'](br['y'] - bG[as]['box']['min']['y']),
                             'check_intersection': bS
                           });
                       }
                     }
                     var bx = _['minBy'](bM, 'dist'),
                       bq = (bM.length && (bm = bx['pos']),
                         _['minBy'](bO, 'dist')),
                       bj = (bO.length && (bw = bq['pos']),
                         _['minBy'](bN, 'dist')),
                       bn = (bN.length && (bL = bj['pos']),
                         c5[0]['object']),
                       bv = new THREE['Box3'](),
                       bT, bU, bV, bW, bX, bY, bZ, bP, bx;
                     1 === bz['x'] && (bT = bv['setFromObject'](bn)['max']['x'] + bI['getSize'](new THREE['Vector3']
                       ())['x'] / 2),
                       -1 === bz['x'] && (bT = bI['getSize'](new THREE['Vector3']())['x'] / 2),
                       0 === bz['x'] && (bT = bI['getSize'](new THREE['Vector3']())['x'] / 2),
                       1 === bz['z'] && (bV = bv['setFromObject'](bn)['max']['z'] + bI['getSize'](new THREE['Vector3']
                         ())['z'] / 2),
                       -1 === bz['z'] && (bV = bI['getSize'](new THREE['Vector3']())['z'] / 2),
                       0 === bz['z'] && (bV = bI['getSize'](new THREE['Vector3']())['z'] / 2),
                       -1 === bz['x'] && (bW = bv['setFromObject'](bn)['min']['x'] - bI['getSize'](new THREE[
                         'Vector3']())['x'] / 2),
                       1 === bz['x'] && (bW = room['params']['width'] / units - bI['getSize'](new THREE['Vector3']())[
                         'x'] / 2),
                       0 === bz['x'] && (bW = room['params']['width'] / units - bI['getSize'](new THREE['Vector3']())[
                         'x'] / 2),
                       -1 === bz['z'] && (bY = bv['setFromObject'](bn)['min']['z'] - bI['getSize'](new THREE[
                         'Vector3']())['z'] / 2),
                       1 === bz['z'] && (bY = room['params']['depth'] / units - bI['getSize'](new THREE['Vector3']())[
                         'z'] / 2),
                       0 === bz['z'] && (bY = room['params']['depth'] / units - bI['getSize'](new THREE['Vector3']())[
                         'z'] / 2),
                       bm = clamp(Math['round'](bm / aD['params']['grid']) * aD['params']['grid'], bT, bW),
                       bw = clamp(Math['round'](bw / aD['params']['grid']) * aD['params']['grid'], bV, bY),
                       bL = clamp(Math['round'](bL / aD['params']['grid']) * aD['params']['grid'], 0, room['params'][
                         'height'
                       ] / units - bI['getSize'](new THREE['Vector3']())['y']),
                       'top' === global_options['projection_mode'] && (bo['y'] = true),
                       'front' !== global_options['projection_mode'] && 'back' !== global_options['projection_mode'] ||
                       (bo['z'] = true),
                       'left' !== global_options['projection_mode'] && 'right' !== global_options['projection_mode'] ||
                       (bo['x'] = true),
                       'bottom' === aA['cabinet_type'] && (bo['y'] = true),
                       'bottom' !== aA['userData']['cabinet_group'] && 'at_wall_bottom' !== aA['userData'][
                         'cabinet_group'
                       ] || (bo['y'] = true),
                       'Module' == aA['temp_type'] ? (bP = aA['position']['clone']()['clone'](),
                         false === bo['x'] && (bP['x'] = bm),
                         false === bo['y'] && (bP['y'] = bL),
                         false === bo['z'] && (bP['z'] = bw),
                         (bx = bg(aA, d_objects, bP, bM, bN, bO, cr))?.['hasCollision'] || (bx?.['snapInfo']?.[
                           'isNearSnap'
                         ] && bx?.['snapInfo']?.['snapPosition'] ? aA['position']['copy'](bx['snapInfo'][
                           'snapPosition'
                         ]) : aA['position']['copy'](bP))) : ((a2['visible'] = false) === bo['x'] && (aA['position'][
                           'x'] = bm),
                         false === bo['y'] && (aA['position']['y'] = bL),
                         false === bo['z'] && (aA['position']['z'] = bw)),
                       aA['box'] && !aA['userData']?.['params']?.['spec']?.['is_fill'] && aA['box']['update'](),
                       aD['s_helper']['make'](),
                       'function' == typeof aA['mouse_move'] && aA['mouse_move'](c5[0]),
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
               0 < grab_points_list.length)
               for (let cw = 0; cw < grab_points_list.length; cw++) {
                 var c0 = grab_points_list[cw];
                 scene['remove'](c0);
               }
             if (!pp['events']['mouse']['find_hit'] && active_el instanceof Module) {
               let cx = active_el;
               if (!(cx = global_options['mouse_mode']['root'] ? global_options['mouse_mode']['root'] : cx)?.[
                   'userData']?.['parts_by_path']?.['module'])
                 return;
               var bq = Object['keys'](cx['userData']['parts_by_path']['module']),
                 bj = find_hit_box_fill_section(cx, ax),
                 bv, c1;
               bj && ((bv = bj) && bv['userData']['params']['spec']['is_fill'] && bq['includes'](bv['userData'][
                 'path']) ? (bq.forEach(cy => {
                     var cy = cx['userData']['parts_by_path']['module'][cy];
                     cy['_hide_helpers'](),
                       change_grap_point(cy, 'delete', ax),
                       cy['_grab_point'] = null;
                   }),
                   bv['_show_helpers'](),
                   bv['userData']['parent'] instanceof CabinetFillSection && (c1 = bv['userData']['parent']),
                   a1['style']['cursor'] = 'pointer',
                   aJ = bv,
                   global_options['mouse_mode']['target'] = bv,
                   change_grap_point(aJ, 'add', ax),
                   check_grap_point_intersection(aJ, ax)) : bq.forEach(cy => {
                   var cy = cx['userData']['parts_by_path']['module'][cy],
                     cz;
                   cy['_hide_helpers'](),
                     cy['userData']['parent'] instanceof CabinetFillSection && (cz = cy['userData']['parent']),
                     change_grap_point(cy, 'delete', ax),
                     cy['_grab_point'] = null;
                 }));
             }
             if (global_options['mouse_mode']['fill_edit_mode'] && pp['interface']['root'] && pp['interface']['root'][
                 '$selected_object'
               ]['_show_helpers'](),
               0 < (c5 = ax['intersectObjects'](b8(), true))['length']) {
               for (; c5[0] && c5[0]['object'] && false === c5[0]['object']['userData']['mouse_events'];)
                 c5['shift']();
             }
             if (0 < c5.length) {
               let cy = null;
               var c2 = [],
                 c3 = [],
                 bn;
               for (let cA = 0; cA < c5.length; cA++)
                 c5[cA]['object']['userData']['is_mouse_target'] && c2.push(c5[cA]),
                 c5[cA]['object']['userData']['is_draggable_child'] && c3.push(c5[cA]);
               let cz = c5[0]['object'];
               c3.length ? (cy = b9(c3[0]['object']),
                   cz = c3[0]['object']) : c2.length && (cy = c2[0]['object'],
                   cz = c2[0]['object']),
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
               helper['isDown'] && 1 == custom_settings['group_enabled']) {
               for (let cB = 0; cB < selectionBox['collection']['length']; cB++)
                 selectionBox['collection'][cB]['size_box']['visible'] = false;
               selectionBox['endPoint']['set'](bi['clientX'] / window['innerWidth'] * 2 - 1, -bi['clientY'] /
                 window['innerHeight'] * 2 + 1, 0.5);
               var c4 = selectionBox['select']();
               for (let cC = 0; cC < c4.length; cC++)
                 selectionBox['collection'][cC]['size_box']['visible'] = true;
             }
           }
         }
       }
     }

     function aW(bi) {
       var bj, bj, bk, bl, bk, bl, bj, bl, bj, bm;
       if (aD['enabled'] && (!global_options['size_edit_mode']?.['active'] && (bi['type']['indexOf']('touch') < 0 ? (
             bi['preventDefault'](),
             bi['stopPropagation']()) : bi = bi['changedTouches'][0],
           !view_mode || 2 == bi['which']) && (at = new Date()['getTime'](),
           view_mode || pp['interface']['root']['radial_hide'](),
           bi['altKey'] || 2 == bi['which'] || !global_options['view_only_mode']))) {
         if ('picker' == global_options['mouse_mode']['mode'] && 1 == bi['which']) {
           if ('walls' == global_options['mouse_mode']['target'])
             aB && ('Shaft_wall' == aB['name'] ? aB['userData']['root']['change_plane_material'](aB['userData']['tag'],
               global_options['mouse_mode']['item_id']) : (bj = aB['name']['replace']('_wall', ''),
               room['change_wall_material'](bj, global_options['mouse_mode']['item_id'])));
           else {
             if ('facade_materials' == global_options['mouse_mode']['target'])
               aB && null !== (bj = aB ? b3(aB) : null) && (bj instanceof CabinetFacade && (constructor_settings[
                   'core_v2'] ? (bk = bj['userData']['computed']['item']['id'],
                   bl = global_options['mouse_mode']['item_id'],
                   module_utils['can_change_facade_material'](bk, bl) && bj['_change_material'](global_options[
                     'cpk_key'], bl)) : bj['_change_material'](global_options['cpk_key'], global_options['mouse_mode']
                   ['item_id'])),
                 sc['get_price']());
             else {
               if ('facades' == global_options['mouse_mode']['target'] && aB) {
                 let bv = b3(aB);
                 1 == global_options['mouse_mode']['radius'] ? bv['cabinet'] && bv['cabinet']['params']['cabinet'][
                     'type'
                   ]['indexOf']('radius') < 0 && (bv = null) : bv['cabinet'] && -1 < bv['cabinet']['params'][
                     'cabinet'
                   ]['type']['indexOf']('radius') && (bv = null),
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
                     bpi) && 1 == bpi['$refs']['module_menu']['show'] && (bpi['$refs']['module_menu']['price'] =
                     format_price(bj['get_price']()));
                 else {
                   if ('tabletop_cut' == global_options['mouse_mode']['target'] || 'tabletop_cut_v2' == global_options[
                       'mouse_mode']['target'])
                     switch (global_options['mouse_mode']['item_id']) {
                       case 1:
                         return void(aA = aB ? (controls['enabled'] = false,
                           aB) : null);
                       case 2:
                         return void(aB && (controls['enabled'] = false,
                           aB['add_connection'](aD['cut_helper']['position'])));
                       case 3:
                         return void(aB && (controls['enabled'] = false,
                           bm = gp_t(aB)) && bm['remove_connection'](aB));
                     }
                 }
               }
             }
           }
         } else {
           if (aB && aB['is_control'])
             aB ? (controls['enabled'] = false,
               (aA = aB)['userData']['obj']['resizable'] && aA['userData']['obj']['resizable']['handleDragStart'](aA,
                 bi, a0)) : aA = null;
           else {
             aJ?.['_grab_point'] && scene['remove'](aJ['_grab_point']),
               ax['setFromCamera'](ay, a0);
             var bn = ax['intersectObjects'](b8(), true),
               bo, bp, bq, bp;
             if (0 < bn.length) {
               for (; bn[0] && bn[0]['object'] && false === bn[0]['object']['userData']['mouse_events'];)
                 bn['shift']();
             }
             let bw = 'short';
             switch (bw = new Date()['getTime']() >= at + au ? 'long' : 'short',
               bi['which']) {
               case 1:
                 if (0 < bn.length) {
                   var bq = Date['now'](),
                     bp = Math['abs'](bi['clientX'] - a4['x']),
                     bo = Math['abs'](bi['clientY'] - a4['y']),
                     bp = bq - a3 < a5 && bp < a6 && bo < a6;
                   if (a3 = bq,
                     a4 = {
                       'x': bi['clientX'],
                       'y': bi['clientY']
                     },
                     bp)
                     return aI = false,
                       aK['current_obj'] = null,
                       void(pp['interface']['root'] && (pp['events']['mouse']['dblclick'] ? pp['events']['mouse'][
                         'dblclick'
                       ](bi, bn) : pp['interface']['root']['$emit']('show_object_panel', 'settings')));
                   var br = [],
                     bs = [];
                   for (let bz = 0; bz < bn.length; bz++)
                     bn[bz]['object']['userData']['is_mouse_target'] && br.push(bn[bz]),
                     bn[bz]['object']['userData']['params']?.['spec']?.['is_fill'] && bs.push(bn[bz]);
                   let bx = bn;
                   if (bs.length ? bx = bs : br.length && (bx = br),
                     aA = b9(bx[0]['object']),
                     void 0 !== global_options['mouse_mode']?.['fill_edit_mode'] && false !== global_options[
                       'mouse_mode']?.['fill_edit_mode'] && aA?.['userData']?.['root']['uuid'] !== global_options[
                       'mouse_mode']['root']['uuid'] && (fill_edit_mode(),
                       aJ = null,
                       global_options['mouse_mode']['enabled_base_drag'] = true,
                       aI = true),
                     aA && (controls['enabled'] = false,
                       'function' == typeof aA['build_from_wall_sizes']) && aA['build_from_wall_sizes'](true),
                     bi['altKey'] && bi['shiftKey']) {
                     bn[0]['object']['no_click_event'] && bn[0]['shift']();
                     let bA = b2(bn[0]['object'], bi),
                       bB = make_cube(5, 5, 5);
                     bB['position']['copy'](bn[0]['point']),
                       bA['attach'](bB),
                       setTimeout(() => {
                         app && app['$emit']('add_point_mouse', {
                             'pos': bB['position']
                           }),
                           bA['remove'](bB);
                       }, 100);
                   }
                   if (bi['altKey'])
                     return void(bn.length && (bn[0]['object']['no_click_event'] && bn['shift'](),
                       ba(bn[0]['object'])));
                   let by = room['walls_objects'];
                   aA instanceof Shaft && (by = room['walls_objects']['filter'](bC => 'Mesh' == bC['type']));
                   var bo = ax['intersectObjects'](by),
                     bo, bq, bp, bq, bo, bp, bq, bp;
                   if (bo.length && az['copy'](bo[0]['point'])['sub'](aA['position']),
                     'washer' === aA['object_type'] && (ao['x'] = bi['clientX'],
                       ao['y'] = bi['clientY'],
                       ao['tabletop_rebuilt'] = 0,
                       aU = 1,
                       setTimeout(function() {
                         aU = 0;
                       }, 150),
                       !constructor_settings['core_v2'] && constructor_settings['tabletop_v2'] && sc[
                         'washer_drag_start_legacy'](aA),
                       1)) {
                     var bq, bp = (aA['parent']['uuid'] !== room['uuid'] && aA['parent']['parent']['uuid'] !== room[
                           'uuid'] && ((bq = aA['parent']['parent'])['washer'] = {
                             'children': []
                           },
                           bq['params']['washer'] = {},
                           bq['params']['sink'] && (bq['params']['sink']['active'] = false),
                           room['active_objects']['push'](aA),
                           d_objects.push(aA),
                           room['add'](aA)),
                         aA['find_related_tabletop_parts']()),
                       bt;
                     for (bt of bp)
                       bt['userData']['washers'] = [],
                       bt['_rebuild']?.();
                   }
                   if (aJ && (global_options['mouse_mode']['fill_edit_mode'] && pp['interface']['root'] && pp[
                         'interface']['root']['$selected_object']['_hide_helpers'](),
                       bo = Object['keys'](aJ['userData']['root']['userData']['parts_by_path']['module']),
                       (bq = find_hit_box_fill_section(aJ['userData']['root'], ax)) && (bp = bq)['uuid'] == aJ[
                       'uuid'] && bo['includes'](bp['userData']['path']) && (bq = {
                           'x': comp2(bp['userData']['params']['pos']['x'], bp['userData']['computed']['c_object']),
                           'y': comp2(bp['userData']['params']['pos']['y'], bp['userData']['computed']['c_object']),
                           'z': comp2(bp['userData']['params']['pos']['z'], bp['userData']['computed']['c_object'])
                         },
                         aK['mouse_pos'] = {
                           'x': bi['clientX'],
                           'y': bi['clientY']
                         },
                         aK['trigger_start'] = false,
                         aK['current_obj'] = aJ,
                         aK['old_pos'] = bq),
                       aJ = null),
                     !pp['events']['mouse']['down_fill_hit'] && aA instanceof Module && aB?.['uuid'] === aA['uuid'] &&
                     active_el?.['uuid'] === aB?.['uuid'] && !aA?.['userData']['params']['spec']['is_fill'] && (bo =
                       Object['keys'](aA['userData']['parts_by_path']['module']),
                       bp = find_hit_box_fill_section(aA, ax)) && ((bq = bp) && bq['userData']['params']['spec'][
                       'is_fill'
                     ] && bo['includes'](bq['userData']['path']) ? (void 0 !== global_options['mouse_mode'][
                         'fill_edit_mode'
                       ] && false !== global_options['mouse_mode']['fill_edit_mode'] && (aA = bq,
                         aJ = bq),
                       fill_edit_mode(bq),
                       aA['_grab_point'] && scene['remove'](aA['_grab_point'])) : bo.forEach(bC => {
                       var bD;
                       aA['userData']['parts_by_path']['module'][bC]['_hide_helpers']();
                     })),
                     pp['events']['mouse']['down_fill_hit'] && pp['events']['mouse']['down_fill_hit'](ax, a1, aA),
                     aA instanceof Module && !aJ && 1 == aA['userData']['params']['spec']['is_fill'] && 0 == aH) {
                     for (let bC = room['active_objects']['length']; bC--;) {
                       var bu = room['active_objects'][bC];
                       'Module' == bu['userData']['class'] && bu['show_drag_areas'](aA['userData']['params']['spec'][
                         'id'
                       ], aA['userData']['params']['spec']['element_type']);
                     }
                     aH = true;
                   }
                   'function' == typeof aA['find_washers'] && (bp = aA['find_washers']())['length'] && (aA['userData'][
                       'tempDragWashers'
                     ] = bp),
                     aA['box'] && aA['box']['update'](),
                     aa['copy'](aA['position']['clone']()),
                     ac = aA['rotation']['clone']();
                   var bq = active_el;
                   sc['select_object'](aA),
                     'function' == typeof aA['calculate_distances'] && aA['calculate_distances'](),
                     'Draggable' == aA['userData']['class'] ? aD['s_helper']['make_box'](aA) : 'washer' === aA[
                       'object_type'] ? aD['s_helper']['make_w_box']() : aD['s_helper']['make'](),
                     'function' == typeof on_mouse_select && on_mouse_select(aA, bi),
                     global_options['mouse_mode']['enabled_base_drag'] = true,
                     bq?.['uuid'] == aA['uuid'] && 'camera' == global_options['mouse_mode']['mode'] || !aJ && aA[
                       'userData']['params']?.['spec']?.['is_fill'] && 'camera' == global_options['mouse_mode'][
                     'mode'] ? (global_options['mouse_mode']['enabled_base_drag'] = true,
                       aI = true) : 'camera' == global_options['mouse_mode']['mode'] ? (global_options['mouse_mode'][
                         'enabled_base_drag'
                       ] = false,
                       aI = false) : aJ || void 0 !== global_options['mouse_mode']['fill_edit_mode'] && false !==
                     global_options['mouse_mode']['fill_edit_mode'] ? (aJ ? (global_options['mouse_mode'][
                           'enabled_base_drag'
                         ] = true,
                         aI = false,
                         aH = false) : (aJ = global_options['mouse_mode']['target'],
                         global_options['mouse_mode']['enabled_base_drag'] = true,
                         aI = true,
                         aH = false,
                         sc['select_object'](aJ)),
                       'function' == typeof aA['calculate_distances'] && aJ['calculate_distances'](),
                       aD['s_helper']['make'](aJ['userData']['root'])) : (global_options['mouse_mode'][
                         'enabled_base_drag'
                       ] = true,
                       aI = true),
                     aD['dispatchEvent']({
                       'type': 'dragstart',
                       'object': aA
                     });
                 } else
                   active_el && (2 == custom_settings['no_active_null_on_click'] && sc['select_object'](null),
                     pp['interface']['root']['$emit']('hide_interactive_menu', 1),
                     aD['s_helper']['hide']());
                 aJ && (global_options['mouse_mode']['fill_edit_mode'] && pp['interface']['root'] && pp['interface'][
                       'root'
                     ]['$selected_object']['_hide_helpers'](),
                     bo = Object['keys'](aJ['userData']['root']['userData']['parts_by_path']['module']),
                     bp = find_hit_box_fill_section(aJ['userData']['root'], ax)) && (bq = bp)['uuid'] == aJ['uuid'] &&
                   bo['includes'](bq['userData']['path']) && (bp = {
                       'x': comp2(bq['userData']['params']['pos']['x'], bq['userData']['computed']['c_object']),
                       'y': comp2(bq['userData']['params']['pos']['y'], bq['userData']['computed']['c_object']),
                       'z': comp2(bq['userData']['params']['pos']['z'], bq['userData']['computed']['c_object'])
                     },
                     aK['mouse_pos'] = {
                       'x': bi['clientX'],
                       'y': bi['clientY']
                     },
                     aK['trigger_start'] = false,
                     aK['current_obj'] = aJ,
                     aK['old_pos'] = bp),
                   aJ = null,
                   global_options['mouse_mode']['fill_edit_mode'] && pp['interface']['root'] && pp['interface']['root'][
                     '$selected_object'
                   ]['_show_helpers'](),
                   helper['isDown'] && 1 == custom_settings['group_enabled'] && selectionBox['startPoint']['set'](bi[
                       'clientX'] / window['innerWidth'] * 2 - 1, -bi['clientY'] / window['innerHeight'] * 2 +
                     1, 0.5);
                 break;
               case 2:
                 if (bn.length) {
                   for (; bn[0] && bn[0]['object'] && bn[0]['object']['no_click_event'];)
                     bn['shift']();
                   ba(bn[0]['object']);
                 }
                 aA = null;
                 break;
               case 3:
                 0 < bn.length && 'function' == typeof pp['events']['mouse']['on_mouse_down_3_get_selected'] && (
                     aA = pp['events']['mouse']['on_mouse_down_3_get_selected'](bi, bn)),
                   aD['block_move'] = 1,
                   aA && (1 == aA['userData']['is_interactive'] ? aD['s_helper']['make']() : (sc['select_object'](aA),
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
           bi['type']['indexOf']('touch') < 0 ? bi['preventDefault']() : bi = bi['changedTouches'][0],
           rotation_mode = false;
         let bt = 'short';
         if (bt = new Date()['getTime']() >= at + au ? 'long' : 'short',
           controls['enabled'] = true,
           'embed' !== global_options['mouse_mode']['mode'] || global_options['mouse_mode']['_embed_fixed_active']) {
           for (let bu = scene['children']['length'] - 1; 0 <= bu; bu--) {
             var bj = scene['children'][bu];
             bj instanceof CabinetSize && (bj['userData']['children']['forEach'](bv => {
                 bv instanceof Sizes_obj && bv['full_dispose']();
               }),
               scene['remove'](bj));
           }
           if (aA) {
             var bk, bk, bk, bl, bk, bm;
             if (sc['update_kitchen_sizes'](true),
               aA['userData']?.['params']?.['spec']?.['is_fill'] || (aJ = null),
               aD['block_move'] = 0,
               sc['mouseup_selected'](aA),
               'washer' === aA['object_type'])
               return 'not_loaded' === aA['model_loaded'] && aA['load_model'](),
                 !constructor_settings['core_v2'] && constructor_settings['tabletop_v2'] && sc['washer_drag_end_legacy']
                 (aA),
                 bk = aA,
                 controls['enabled'] = true,
                 aA = null,
                 av = 0,
                 aw = 1,
                 aD['block_move'] = 0,
                 aD['s_helper']['hide'](),
                 true === global_options['colorpicker_mode'] || global_options['facade_mode'] ? a1['style']['cursor'] =
                 global_options['color_picker_cursor'] : a1['style']['cursor'] = aB ? 'pointer' : 'auto',
                 aE = null,
                 aD['s_helper']['material']['color']['setHex'](1749908),
                 sc['build_tabletop'](),
                 bk['check_cabinets_around'](),
                 void bk['show_radial_menu'](bi['clientX'], bi['clientY']);
             if ('Draggable' == aA['userData']['class'])
               return aA['userData']['root']['hide_drag_areas'](),
                 bk = aA['userData']['parent'],
                 1 == bi['which'] && (bk = {
                     'x': aA['position']['x'] * units + parseInt(bk['userData']['size']['x']) / 2,
                     'y': aA['position']['y'] * units + parseInt(bk['userData']['size']['y']) / 2,
                     'z': 0
                   },
                   aA['userData']['root']['change_param'](aA['userData']['path'], 'pos', bk, false)),
                 pp['events']['mouse']['on_mouse_cancel_draggable'] ? pp['events']['mouse']['on_mouse_cancel_draggable']
                 (bi, aA) : aA['show_radial_menu'](bi['clientX'], bi['clientY']),
                 void(aA = null);
             for (let bv = room['active_objects']['length']; bv--;) {
               var bn = room['active_objects'][bv];
               'Module' == bn['userData']['class'] && bn['hide_drag_areas']();
             }
             if (aA instanceof Module) {
               if (1 == aA['userData']['params']['spec']['is_fill']) {
                 if (aA['_fill_helpers'] && 0 < aA['_fill_helpers']['helpers']['length'] && aA['_fill_helpers'][
                     'helpers'
                   ]['forEach'](bw => {
                     scene['remove'](bw);
                   }),
                   aA['fill_helper'] && scene['remove'](aA['fill_helper']),
                   aG) {
                   var bk = aG['userData']['parent'],
                     bm = bk['userData']['root'],
                     bk;
                   aA['local_pos'] && ((bk = aA['embed_in_section'](bk, bm, aG))['enabled'] ? (aA = bk['root'],
                     aK['current_obj'] = bk['new_obj']) : (aA['delete'](),
                     aA = bk['root'],
                     sc['select_object'](bk['root'])));
                 } else {
                   if (aA['section_uuid']) {
                     let bw = scene['getObjectByProperty']('uuid', aA['section_uuid']);
                     var bm = bw['userData']['root'];
                     let bx = Number(aA['object_path']['split'](',')['pop']()),
                       by = [];
                     bm['walk_params_tree'](bz => {
                         'fill_section' == bz['type'] && bz['section_key'] && bz['section_key'] === bw['userData'][
                           'params'
                         ]['section_key'] && by.push(bz);
                       }, bm['userData']['params'], 2),
                       0 < by.length ? (by.forEach(bz => {
                           bz['children']['splice'](bx, 1);
                         }),
                         bm['_rebuild']()) : bm['remove_child_by_path'](aA['object_path']),
                       aA['userData']['params']['pos'] = new THREE['Vector3'](0, 0, 0),
                       aA['_rebuild']();
                   }
                 }
                 for (let bz = room['active_objects']['length']; bz--;) {
                   var bo = room['active_objects'][bz];
                   'Module' == bo['userData']['class'] && bo['hide_drag_areas'](),
                     bo['_snap_label'] && (scene['remove'](bo['_snap_label']),
                       bo['_snap_label']['element']['remove'](),
                       bo['_snap_label'] = null);
                 }
                 aA['userData']['connected'] = [],
                   aH = false,
                   aA['section_uuid'] = null,
                   aA['parent_uuid'] = null,
                   aA['old_pos'] = null,
                   aA['_fill_helpers'] = null,
                   aA['object_path'] && (aA['object_path'] = null,
                     aA['userData']['own_object']['visible'] = true);
               } else {
                 if (-1 < location['href']['indexOf']('12414613') && 3 == aA['userData']['params']['id'] && (ab[
                       'copy'](aA['position']['clone']()),
                     !ab['equals'](aa)))
                   for (let bA = 0; bA < room['active_objects']['length']; bA++) {
                     'Module' === room['active_objects'][bA]['temp_type'] && 1 != room['active_objects'][bA][
                         'userData'
                       ]['params']['spec']['is_fill'] && room['active_objects'][bA]['uuid'] != aA['uuid'] && (aA['box'][
                           'update'
                         ](),
                         room['active_objects'][bA]['box']['update'](),
                         bl = room['active_objects'][bA]['box']['clone']()['expandByScalar'](0.1),
                         aA['box']['intersectsBox'](bl)) && aA['userData']['params']['size']['z'] == room[
                         'active_objects'][bA]['userData']['params']['size']['z'] && aA['userData']['params']['size'][
                         'y'
                       ] == room['active_objects'][bA]['userData']['params']['size']['y'] && parseInt(aA['userData'][
                         'params'
                       ]['size']['x']) + parseInt(room['active_objects'][bA]['userData']['params']['size']['x']) <=
                       2000 && (t_s1 = aA,
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
               if (!constructor_settings['tabletop_v2'] && 'bottom' == aA['params']['cabinet_group'] && aA['params'][
                   'tabletop'
                 ]['active']) {
                 if (check_at_wall(aA)) {
                   if (aA['temp']['tabletop_plints']) {
                     let bB = 0;
                     Object['keys'](aA['params']['tabletop']['plints'])['forEach'](function(bC) {
                         aA['params']['tabletop']['plints'][bC] != aA['temp']['tabletop_plints'][bC] && (bB = 1);
                       }),
                       1 == bB && (aA['params']['tabletop']['plints'] = copy_object(aA['temp']['tabletop_plints']),
                         'function' == typeof aA['build_tabletop']) && aA['build_tabletop']();
                   }
                 } else {
                   aA['temp']['tabletop_plints'] = copy_object(aA['params']['tabletop']['plints']);
                   let bC = 0;
                   Object['keys'](aA['params']['tabletop']['plints'])['forEach'](function(bD) {
                       0 != aA['params']['tabletop']['plints'][bD] && (aA['params']['tabletop']['plints'][bD] = !
                         1,
                         bC = 1);
                     }),
                     1 == bC && 'function' == typeof aA['build_tabletop'] && aA['build_tabletop']();
                 }
               }
               'bottom' == aA['params']['cabinet_group'] && (!aA['params']['tabletop'] || !aA['params']['tabletop'][
                 'active'
               ]) && aA['params']['cabinet'] && 721 < aA['params']['cabinet']['height'] && sc['build_bort']();
             }
             if (aA && aA['is_control'] && aA['userData']['obj']['resizable'] && aA['userData']['obj']['resizable'][
                 'handleDragEnd'
               ](aA, bi, a0),
               aD['s_helper']['material']['color']['setHex'](1749908),
               aA && (ab['copy'](aA['position']['clone']()),
                 ad = aA['rotation']['clone'](),
                 ab['equals'](aa) || (add_undo_action({
                     'type': 1 === av ? 'move_and_create' : 'move',
                     'from': aa['clone'](),
                     'to': ab['clone'](),
                     'rotation_from': ac,
                     'rotation_to': ad,
                     'object': aA
                   }),
                   1 == bi['which'] && (aA['userData']['tempDragWashers'] && (aA['update_washers_on_move'](aa, ab, ad[
                         'y'] - ac['y'], aA['userData']['tempDragWashers']),
                       delete aA['userData']['tempDragWashers']),
                     1 != constructor_settings['tabletop_v2'] && !constructor_settings['core_v2'] || (bk = aA[
                         'userData']['params'] && 'module' === aA['userData']['params']['type'],
                       ('Cabinet' == aA['temp_type'] || bk) && aA['check_tabletop_rebuild']() && (constructor_settings[
                           'core_v2'] && aA['is_detached_tabletop']() && (bm = aA['userData']['parts']['tabletop'][0],
                           _['get'](bm, 'userData.washers.length')) && bm['_rebuild'](),
                         sc['build_tabletop']()),
                       'Bardesk' != aA['temp_type']) || sc['build_tabletop'](),
                     'function' == typeof aA['find_around'] && aA['find_around'](),
                     'function' == typeof aA['after_move']) && aA['after_move']())),
               check_overlap(),
               1 == av && 'Cabinet' === aA['type'] && 'corner_straight' === aA['params']['cabinet']['type'] &&
               'function' == typeof corner_mouse_up && corner_mouse_up(),
               pp['events']['mouse']['on_mouse_cancel'])
               pp['events']['mouse']['on_mouse_cancel'](bi, aA);
             else {
               if (bi['type'] && bi['type']['indexOf']('touch') < 0)
                 switch (bi['which']) {
                   case 1:
                     bi['altKey'] || custom_settings['radial_rmb'] || 'function' == typeof aA['show_radial_menu'] && aA[
                       'show_radial_menu'](bi['clientX'], bi['clientY']);
                     break;
                   case 2:
                     break;
                   case 3:
                     bi['preventDefault'](),
                       1 == aA['userData']['is_interactive'] ? 'function' == typeof aA['show_radial_menu'] ? aA[
                         'show_radial_menu']() : (pp['interface']['root']['set_item'](null),
                         pp['interface']['root']['set_interactive'](aA),
                         pp['interface']['root']['$emit']('show_interactive_menu', '')) : custom_settings[
                       'radial_rmb'] && 'function' == typeof aA['show_radial_menu'] && aA['show_radial_menu'](bi[
                         'clientX'], bi['clientY']);
                 }
               else
                 'function' == typeof aA['show_radial_menu'] && aA['show_radial_menu'](bi['clientX'], bi['clientY']);
             }
             if ('not_loaded' === aA['model_loaded'] && aA['load_model'](),
               ab['equals'](aa) || (!project_settings['wall_panel']['active'] && 1 != av || (update_materials_panel(),
                   get_total_price_test()),
                 build_sizes_all(),
                 autosave()),
               1 === aA['copied'] && (aA['copied'] = 0,
                 av = 0),
               'function' == typeof aA['build_from_wall_sizes']) {
               let bD = false;
               aA['params'] && 'surface' == aA['params']['drag_mode'] && (bD = true),
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
               'washer' == aA['object_type'] || global_options['single_preview'] || 0 === aA['position']['x'] &&
               0 === aA['position']['z'] && 'function' == typeof aA['delete'] && (aA['delete'](),
                 aD['s_helper']['hide']()),
               'function' == typeof on_mouse_up && on_mouse_up(aA),
               'function' == typeof aA['_on_drag_end'] && aA['_on_drag_end'](bi),
               a2['material'] !== bd['collision'] || aG || 1 != aA['userData']['params']?.['spec']?.['is_fill'] || (
                 aA['delete'](),
                 aA = null,
                 aD['s_helper']['hide'](),
                 fill_edit_mode(),
                 pp['interface']['root'] && pp['interface']['root']['radial_hide'](),
                 bf('snap'),
                 a2['visible'] = false),
               a7 = null;
           }
           if (helper['isDown'] && 1 == custom_settings['group_enabled']) {
             selectionBox['endPoint']['set'](bi['clientX'] / window['innerWidth'] * 2 - 1, -bi['clientY'] / window[
               'innerHeight'] * 2 + 1, 0.5);
             let bE = selectionBox['select']();
             setTimeout(() => {
               if (bE.length) {
                 if (1 < bE.length) {
                   let bF = sc['add_object']('drag_group', {}, false);
                   for (let bG = bE.length; bG--;)
                     bE[bG]['size_box']['visible'] = false,
                     bF['add_object'](bE[bG]);
                   sc['select_object'](bF),
                     setTimeout(() => {
                       aD['s_helper']['make'](bF),
                         aD['s_helper']['show']();
                     }, 100);
                 } else
                   bE[0]['size_box']['visible'] = false;
               }
             }, 100);
           }
           for (let bF = 0; bF < room['active_objects']['length']; bF++) {
             var bp = room['active_objects'][bF];
             'Module' == bp['userData']['class'] && traverse_parts(bp, (bG, bH, bI) => {
               bG['userData']['params']['hide_on_drag'] && (bG['visible'] = true);
             });
           }
           if (0 < grab_points_list.length)
             for (let bG = 0; bG < grab_points_list.length; bG++) {
               var bq = grab_points_list[bG];
               scene['remove'](bq);
             }
           if (bi['type'] && bi['type']['indexOf']('touch') < 0)
             switch (bi['which']) {
               case 1:
                 aB || !global_options['mouse_mode']['fill_edit_mode'] || aK['current_obj'] || aA ? aK['current_obj'] &&
                   ('function' == typeof aK['current_obj']['show_radial_menu'] && aK['current_obj']['show_radial_menu'](
                       bi['clientX'], bi['clientY']),
                     'function' == typeof aK['current_obj']['_on_drag_end'] && aK['current_obj']['_on_drag_end'](bi),
                     sc['select_object'](aK['current_obj']),
                     fill_edit_mode(aK['current_obj'])) : (fill_edit_mode(),
                     global_options['mouse_mode']['enabled_base_drag'] = true,
                     active_el = null),
                   bi['preventDefault']();
                 break;
               case 3:
                 aB || (fill_edit_mode(),
                     aJ = null,
                     global_options['mouse_mode']['enabled_base_drag'] = true,
                     aI = true,
                     active_el = null),
                   bi['preventDefault']();
                 break;
             }
           1 == global_options['check_intersections'] && check_box_intersections(scene),
             aA = null,
             av = 0,
             aw = 1,
             aD['block_move'] = 0,
             a2['visible'] = false,
             aI = true,
             aJ = null,
             red_mat_opac['color']['setHex'](8912896),
             s_helper_red_mat['color']['setHex'](8912896),
             aD['s_helper']['material'] = s_helper_mat,
             aK = {},
             true === global_options['colorpicker_mode'] || global_options['facade_mode'] ? a1['style']['cursor'] =
             global_options['color_picker_cursor'] : a1['style']['cursor'] = aB ? 'pointer' : 'auto',
             pp['interface']['root'] && pp['interface']['root']['tmp_dis']();
         } else {
           if (1 == bi['which']) {
             var bk = global_options['mouse_mode']['planeInfo'],
               bm = global_options['mouse_mode']['embed_obj'];
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
               bk['crossHelper'] && bk['crossHelper']['position']['set'](br['u'], br['v'], 0),
               global_options['mouse_mode']['_embed_locked'] = true,
               global_options['mouse_mode']['_embed_fixed_active'] = true,
               app?.['$root'] && app['$root']['$emit']('embed_fixed_changed', global_options['mouse_mode'][
                 '_embed_fixed_active'
               ]);
           }
         }
       }
     }

     function aY() {
       a1['addEventListener']('mousemove', aV, false),
         a1['addEventListener']('mousedown', aW, false),
         a1['addEventListener']('mouseup', aX, false),
         a1['addEventListener']('touchmove', aV, false),
         a1['addEventListener']('touchstart', aW, false),
         a1['addEventListener']('touchend', aX, false);
     }

     function aZ() {
       a1['removeEventListener']('mousemove', aV, false),
         a1['removeEventListener']('mousedown', aW, false),
         a1['removeEventListener']('mouseup', aX, false),
         a1['removeEventListener']('touchmove', aV, false),
         a1['removeEventListener']('touchstart', aW, false),
         a1['removeEventListener']('touchend', aX, false);
     }

     function b0() {
       aZ();
     }

     function b1(bi) {
       return 'cabinet' === bi['object_type'] || 'Room' === bi['name'] ? bi : b1(bi['parent']);
     }

     function b2(bi) {
       var bj;
       let bk = 0,
         bl = bi['object_type'];
       return bl = bl || bi['userData']['object_type'],
         bi['userData'] && 1 == bi['userData']['grouped'] && (bk = 1),
         pp_keyboard['r'] && (bk = 0),
         !{
           'cabinet': 1,
           'drag_group': 1,
           'washer': 1,
           'tabletop': 1,
           'wall': 1
         } [bl] || bi['userData'] && bk ? b2(bi['parent'], event) : bi;
     }

     function b3(bi) {
       return bi instanceof CabinetFacade ? bi : bi['parent'] ? b3(bi['parent']) : null;
     }

     function b4(bi) {
       return bi instanceof Draggable ? bi : bi['parent'] ? b4(bi['parent']) : null;
     }

     function b5(bi) {
       return bi instanceof Module && true !== bi['userData']['params']['spec']['raycast_ignore'] ? bi : bi['parent'] ?
         b5(bi['parent']) : null;
     }

     function b6(bi) {
       return bi instanceof Slider || bi instanceof Rotator || bi instanceof CabinetAnimator ? bi : bi['parent'] ? b6(
         bi['parent']) : null;
     }

     function b7() {
       var bi = [];
       bi.push(room['left_wall']),
         bi.push(room['right_wall']),
         bi.push(room['front_wall']),
         bi.push(room['back_wall']);
       for (let bj = N.length; bj--;)
         'Shaft' == N[bj]['temp_type'] && bi.push(N[bj]);
       return bi;
     }

     function b8(bi) {
       var bj = [];
       for (let bl = N.length; bl--;) {
         if ('Module' == N[bl]['temp_type'] && 1 != N[bl]['userData']['params']['spec']['fill_locked']) {
           var bk = N[bl]['get_draggables']();
           for (let bm = bk.length; bm--;)
             bj.push(bk[bm]);
         }
         bj.push(N[bl]);
       }
       return bj;
     }

     function b9(bi, bj = false) {
       var bk = {
           'cabinet': 1,
           'module': 1,
           'drag_group': 1,
           'washer': 1,
           'tabletop': 1,
           'wall': 1,
           'draggable': 1
         },
         bl;
       let bm = bi['object_type'];
       return bm = bm || bi['userData']['object_type'],
         bi['userData']['params'] && 'module' === bi['userData']['params']['type'] ? bi['userData']['root'] : bj && bi[
           'userData']['is_interactive'] || bi['is_control'] ? bi : 'draggable' == bm && 1 == bi['userData']['root'][
           'userData'
         ]['params']['spec']['fill_locked'] ? b9(bi['parent'], bj) : bk[bm] ? bi : bi['parent'] ? b9(bi['parent'], bj) :
         null;
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
       } -
       1 < bi['name']['indexOf']('door_rtl') && bi['click'](),
         -1 < bi['name']['indexOf']('door_ltr') && bi['click'](),
         -1 < bi['name']['indexOf']('door_simple_top') && bi['click'](),
         -1 < bi['name']['indexOf']('door_simple_bottom') && bi['click'](),
         -1 < bi['name']['indexOf']('locker') && bi['click'](),
         -1 < bi['name']['indexOf']('door_slide_left') && bi['click'](),
         -1 < bi['name']['indexOf']('door_slide_right') && bi['click'](),
         aD['block_move'] = 1,
         bi['parent']['o_type'] && 'Locker' === bi['parent']['o_type'] && bi['parent']['click'](),
         bi['parent']['parent']['o_type'] && 'Locker' === bi['parent']['parent']['o_type'] ? bi['parent']['parent'][
           'click'
         ]() : bi['parent']['parent']['parent']['o_type'] && 'Locker' === bi['parent']['parent']['parent']['o_type'] ?
         bi['parent']['parent']['parent']['click']() : bi['parent']['parent']['parent']['parent']['o_type'] &&
         'Locker' === bi['parent']['parent']['parent']['parent']['o_type'] && bi['parent']['parent']['parent']['parent']
         ['click']();
     }

     function bb() {
       var bi = new THREE['BoxGeometry'](1, 1, 1),
         bj = new THREE['MeshBasicMaterial']({
           'color': 16711680,
           'transparent': true,
           'opacity': 0.5,
           'depthTest': false
         }),
         bi = new THREE['Mesh'](bi, bj);
       return bi['visible'] = false,
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
       this['hover_helper']['visible'] = false,
       this['drag_helper'] = new Drag_helper({}),
       scene['add'](this['drag_helper']),
       this['drag_helper']['visible'] = false,
       aY(),
       this['enabled'] = true,
       this['activate'] = aY,
       this['deactivate'] = aZ,
       this['dispose'] = b0,
       this['go'] = function() {
         return b8();
       },
       this['setObjects'] = function() {},
       this['on'] = function(bi, bj) {
         aD['addEventListener'](bi, bj);
       },
       this['off'] = function(bi, bj) {
         aD['removeEventListener'](bi, bj);
       },
       this['notify'] = function(bi) {
         aD['dispatchEvent']({
           'type': bi
         });
       };
     let bd = {
       'collision': new THREE['MeshBasicMaterial']({
         'color': 16711680,
         'transparent': true,
         'opacity': 0.5,
         'depthTest': false
       }),
       'warning': new THREE['MeshBasicMaterial']({
         'color': 16755200,
         'transparent': true,
         'opacity': 0.3,
         'depthTest': false
       }),
       'snap': new THREE['MeshBasicMaterial']({
         'color': 65280,
         'transparent': true,
         'opacity': 0.3,
         'depthTest': false
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

     function bg(bi, bj, bk, bl, bm, bn, bo = []) {
       if (!bi['userData']['params']['interaction']['check_intersection']) {
         var bp = 'bottom' === bi['cabinet_type'] || 'bottom' === bi['userData']['cabinet_group'] ||
           'at_wall_bottom' === bi['userData']['cabinet_group'],
           bk = bk['clone'](),
           bl = (bp && (bk['y'] = bi['position']['y']),
             bh(bk, bl, bm, bn, aD['params']['snap_distance'] || 0.1, bi)),
           bm = bi['box']['clone'](),
           bn = bk['clone'](),
           bk = (bl['isNearSnap'] && bl['snapPosition'] && bn['copy'](bl['snapPosition']),
             bp && (bn['y'] = bi['position']['y']),
             bn['clone']()['sub'](bi['position'])),
           bq = (bm['translate'](bk),
             0.01),
           br = bm['clone']()['expandByScalar'](-bq),
           bp;
         let bu = false;
         a2['visible'] = false;
         for (let bv = 0; bv < bj.length; bv++) {
           var bs = bj[bv];
           if (bs !== bi && bs['visible'] && bs['box'] && !bs['userData']?.['params']?.['interaction']?.[
               'check_intersection'
             ]) {
             bs['box']['update']();
             var bs = bs['box']['clone']()['expandByScalar'](-bq);
             if (br['intersectsBox'](bs)) {
               bu = true;
               break;
             }
           }
         }
         for (let bw = 0; bw < bo.length; bw++) {
           var bt = bo[bw]['box']['expandByScalar'](-bq);
           if (br['intersectsBox'](bt)) {
             bu = true;
             break;
           }
         }
         return bu ? (a2['visible'] = true,
           bc(a2, bm),
           bf('collision')) : bl['isNearSnap'] ? (a2['visible'] = true,
           (bp = bi['box']['clone']())['translate'](bn['clone']()['sub'](bi['position'])),
           bc(a2, bp),
           bf('snap')) : a2['visible'] = false, {
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
           'distance': 1 / 0,
           'position': null
         },
         bp = 'bottom' === bn['cabinet_type'] || 'bottom' === bn['userData']['cabinet_group'],
         bq = new THREE['Vector3'](),
         bi = (bn['box']['getSize'](bq),
           bi['clone']()),
         bn, br, bs, bs, bn, br, bp, bk, br;
       return bp && (bi['y'] = bn['position']['y']),
         bj.length && !bj['check_intersection'] && (bn = _['minBy'](bj, 'dist'),
           (br = bi['clone']())['x'] = bn['pos'],
           (bs = {
             'x': br['x'] >= bq['x'] / 2 && br['x'] <= room['params']['width'] / units - bq['x'] / 2,
             'y': true,
             'z': br['z'] >= bq['z'] / 2 && br['z'] <= room['params']['depth'] / units - bq['z'] / 2
           })['x']) && bs['z'] && bn['dist'] < bo['distance'] && (bo['distance'] = bn['dist'],
           bo['position'] = br),
         !bk.length || bp || bj['check_intersection'] || (bs = _['minBy'](bk, 'dist'),
           (bn = bi['clone']())['y'] = bs['pos'],
           (br = {
             'x': bn['x'] >= bq['x'] / 2 && bn['x'] <= room['params']['width'] / units - bq['x'] / 2,
             'y': 0 <= bn['y'] && bn['y'] <= room['params']['height'] / units - bq['y'],
             'z': bn['z'] >= bq['z'] / 2 && bn['z'] <= room['params']['depth'] / units - bq['z'] / 2
           })['x'] && br['y'] && br['z'] && bs['dist'] < bo['distance'] && (bo['distance'] = bs['dist'],
             bo['position'] = bn)),
         bl.length && !bj['check_intersection'] && (bp = _['minBy'](bl, 'dist'),
           (bk = bi['clone']())['z'] = bp['pos'],
           (br = {
             'x': bk['x'] >= bq['x'] / 2 && bk['x'] <= room['params']['width'] / units - bq['x'] / 2,
             'y': true,
             'z': bk['z'] >= bq['z'] / 2 && bk['z'] <= room['params']['depth'] / units - bq['z'] / 2
           })['x']) && br['z'] && bp['dist'] < bo['distance'] && (bo['distance'] = bp['dist'],
           bo['position'] = bk), {
           'isNearSnap': bo['distance'] < bm,
           'snapPosition': bo['position'],
           'snapDistance': bo['distance']
         };
     }
   },
   THREE['DragControls']['prototype'] = Object['create'](THREE['EventDispatcher']['prototype']),
   THREE['DragControls']['prototype']['constructor'] = THREE['DragControls'];
 let grab_points_list = [];

 function createCircularSprite(f) {
   var g = 64,
     h = document['createElement']('canvas'),
     i = (h['width'] = h['height'] = 64,
       h['getContext']('2d')),
     f = (i['beginPath'](),
       i['arc'](32, 32, 32, 0, 2 * Math['PI']),
       i['fillStyle'] = f,
       i['fill'](),
       new THREE['CanvasTexture'](h));
   return new THREE['Sprite'](new THREE['SpriteMaterial']({
     'map': f,
     'depthTest': false
   }));
 }

 function check_grap_point_intersection(f, g) {
   var h, g;
   return !!f['_grab_point'] && (g = 0 < g['intersectObject'](f['_grab_point'])['length'],
     f['_grab_point']['_is_grab_point'] = g,
     f['_grab_point']['scale']['set'](g ? 5 : 3, g ? 5 : 3, 1),
     document['body']['style']['cursor'] = g ? 'pointer' : 'default',
     g);
 }

 function change_grap_point(f, g, h) {
   var j, k, m, p, p, q, u, v, q, u, v;
   'add' !== g || !f || f['_grab_point'] || f['userData']?.['interaction']?.['movement_locked'] || f['userData']?.[
       'params'
     ]['spec']?.['movement_locked'] || ((k = createCircularSprite('#ffff00'))['name'] = 'grab_point',
       m = f['getWorldPosition'](new THREE['Vector3']()),
       p = f['userData']['computed']['size'],
       p = new THREE['Vector3'](p['x'] / 2 / units, p['y'] / 2 / units, p['z'] / 2 / units),
       (q = f['userData']['params']['pivot']) && (u = 'string' == typeof q['x'] ? parseFloat(q['x']['split']('::')[
         0]) : q['x'],
         v = 'string' == typeof q['y'] ? parseFloat(q['y']['split']('::')[0]) : q['y'],
         q = 'string' == typeof q['z'] ? parseFloat(q['z']['split']('::')[0]) : q['z'],
         u = new THREE['Vector3']((u + 1) * f['userData']['computed']['size']['x'] / 2 / units, (v + 1) * f[
             'userData']['computed']['size']['y'] / 2 / units, (q + 1) * f['userData']['computed']['size']['z'] /
           2 / units),
         p['sub'](u)),
       p['applyQuaternion'](f['getWorldQuaternion'](new THREE['Quaternion']())),
       k['position']['copy'](m)['add'](p),
       k['scale']['set'](5, 5, 1),
       k['renderOrder'] = 9999,
       k['lookAt'](camera['position']),
       f['_grab_point'] = k,
       scene['add'](k),
       grab_points_list.push(k)),
     'delete' === g && f && f['_grab_point'] && (scene['remove'](f['_grab_point']),
       -1 !== (v = grab_points_list['indexOf'](f['_grab_point'])) && grab_points_list['splice'](v, 1),
       f['_grab_point'] = null,
       document['body']['style']['cursor'] = 'default');
 }

 function traverse_parts(f, g) {
   if (f && f['userData'] && f['userData']['parts']) {
     var h = f['userData']['parts'],
       j;
     for (j in h)
       if (h['hasOwnProperty'](j)) {
         var k = h[j];
         if (Array.isArray(k)) {
           for (var l of k)
             l && (g(l, j, f),
               traverse_parts(l, g));
         }
       }
   }
 }
