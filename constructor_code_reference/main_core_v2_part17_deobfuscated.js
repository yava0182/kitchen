 this['rigth_wall_size']['position']['set'](this['right_wall']['position']['x'], this['params']['height'] / units, this[
     'right_wall']['position']['z']),
   this['rigth_wall_size']['rotation']['y'] = -Math['PI'] / 2,
   this['front_wall_size'] = new Sizes_obj({
     'width': this['params']['width'] / units,
     'text': this['params']['width'],
     'length': 230 / units,
     'middle_line_position': 215 / units
   }),
   this['front_wall_size']['position']['set'](this['front_wall']['position']['x'], this['params']['height'] / units,
     this['front_wall']['position']['z']),
   this['back_wall_size'] = new Sizes_obj({
     'width': this['params']['width'] / units,
     'text': this['params']['width'],
     'length': 230 / units,
     'middle_line_position': 215 / units
   }),
   this['back_wall_size']['position']['set'](this['back_wall']['position']['x'], this['params']['height'] / units, this[
     'back_wall']['position']['z']),
   this['back_wall_size']['rotation']['y'] = Math['PI'],
   this['sizes']['add'](this['left_wall_size']),
   this['sizes']['add'](this['rigth_wall_size']),
   this['sizes']['add'](this['front_wall_size']),
   this['sizes']['add'](this['back_wall_size']),
   this['height_size1'] = new Sizes_obj({
     'width': this['params']['height'] / units,
     'text': this['params']['height'],
     'length': 230 / units,
     'middle_line_position': 215 / units
   }),
   this['height_size1']['rotation']['z'] = Math['PI'] / 2,
   this['height_size1']['position']['set'](0, this['params']['height'] / units / 2, 0),
   this['height_size2'] = new Sizes_obj({
     'width': this['params']['height'] / units,
     'text': this['params']['height'],
     'length': 230 / units,
     'middle_line_position': 215 / units
   }),
   this['height_size2']['rotation']['z'] = Math['PI'] / 2,
   this['height_size2']['rotation']['y'] = -Math['PI'] / 2,
   this['height_size2']['position']['set'](this['params']['width'] / units, this['params']['height'] / units / 2,
   0),
   this['height_size3'] = new Sizes_obj({
     'width': this['params']['height'] / units,
     'text': this['params']['height'],
     'length': 230 / units,
     'middle_line_position': 215 / units
   }),
   this['height_size3']['rotation']['z'] = Math['PI'] / 2,
   this['height_size3']['rotation']['y'] = -Math['PI'],
   this['height_size3']['position']['set'](this['params']['width'] / units, this['params']['height'] / units / 2,
     this['params']['depth'] / units),
   this['height_size4'] = new Sizes_obj({
     'width': this['params']['height'] / units,
     'text': this['params']['height'],
     'length': 230 / units,
     'middle_line_position': 215 / units
   }),
   this['height_size4']['rotation']['z'] = Math['PI'] / 2,
   this['height_size4']['rotation']['y'] = Math['PI'] / 2,
   this['height_size4']['position']['set'](0, this['params']['height'] / units / 2, this['params']['depth'] /
   units),
   this['sizes']['add'](this['height_size1']),
   this['sizes']['add'](this['height_size2']),
   this['sizes']['add'](this['height_size3']),
   this['sizes']['add'](this['height_size4']));
 }
 async ['set_size'](f, g, j) {
     var k;
     'function' == typeof pp['events']['global']['before_room_set_size'] && (f = (k = await pp['events']['global'][
           'before_room_set_size'
         ]({
           'x': f,
           'y': g,
           'z': j
         }))['x'],
         g = k['y'],
         j = k['z']),
       this['params']['width'] = f,
       this['params']['height'] = g,
       this['params']['depth'] = j,
       this['build']();
     let m = new THREE['Box3']();
     for (var n = this['walls']['children']['length'] - 1; 1 < n; n--)
       m['expandByObject'](this['walls']['children'][n]);
     m['expandByScalar'](0.1);
     var o = this;
     if (global_options['env'] && (global_options['env']['offset_x'] = this['params']['width'] / units / 3 * 2,
         global_options['env']['offset_z'] = this['params']['depth'] / units / 3 * 2),
       !constructor_settings['allow_modules_outside_room'] && 1 != custom_settings['floor_only']) {
       if (this['to_del'] = [],
         1 < interface_version)
         setTimeout(() => {
           for (let p = this['active_objects']['length'] - 1; 0 <= p; p--)
             'wall' == this['active_objects'][p]['object_type'] || ('function' == typeof this['active_objects'][p][
                 'box'
               ]['update'] && this['active_objects'][p]['box']['update'](),
               m['containsBox'](this['active_objects'][p]['box'])) || this['to_del']['push'](this['active_objects'][
               p]);
           this['to_del']['length'] && pp['interface']['root']['$emit']('yn_modal_show', {
             'heading': 'Модули\x20за\x20пределами\x20комнаты',
             'body': 'Удалить\x20модули\x20за\x20пределами\x20комнаты?',
             'cb': 'remove_outside',
             'hide_on_click': 0
           });
         }, 2000);
       else {
         for (let p = this['active_objects']['length'] - 1; 0 <= p; p--)
           'function' == typeof this['active_objects'][p]['box']['update'] && this['active_objects'][p]['box']['update']
           (),
           m['containsBox'](this['active_objects'][p]['box']) || interface_version < 2 && this['active_objects'][p][
             'delete'
           ]();
       }
     }
     'function' == typeof pp['events']['global']['after_room_set_size'] && pp['events']['global']['after_room_set_size']
       (),
       build_sizes_all(),
       this['dispatchEvent']({
         'type': 'change'
       }),
       pp['config']['on_demand_render'] && pp['render']();
   }
   ['remove_outside']() {
     for (let e = 0; e < this['to_del']['length']; e++)
       this['to_del'][e]['delete']();
     this['to_del'] = [];
   }
   ['set_material_walls'](e) {
     this['params']['wall_material'] = e,
       this['params']['lw_material'] = e,
       this['params']['rw_material'] = e,
       this['params']['fw_material'] = e,
       this['params']['bw_material'] = e,
       project_settings['selected_materials']['walls'] = e,
       project_settings['selected_materials']['lw_material'] = e,
       project_settings['selected_materials']['rw_material'] = e,
       project_settings['selected_materials']['bw_material'] = e,
       project_settings['selected_materials']['fw_material'] = e;
     var e = materials_lib['get_item'](this['params']['wall_material']),
       f = (e['add_params'] || (e['add_params'] = {}),
         1 != custom_settings['no_walls_bump_old'] && (e['params']['bumpMap'] =
           '/common_assets/images/normals/522.jpg'),
         e['add_params']['model_width'] = this['params']['width'],
         e['add_params']['model_height'] = this['params']['height'],
         materials_lib['get_item'](this['params']['wall_material']));
     f['add_params'] || (f['add_params'] = {}),
       1 != custom_settings['no_walls_bump_old'] && (f['params']['bumpMap'] =
       '/common_assets/images/normals/522.jpg'),
       f['add_params']['model_width'] = this['params']['depth'],
       f['add_params']['model_height'] = this['params']['height'],
       this['front_wall']['material'] = create_material(e),
       this['back_wall']['material'] = create_material(e),
       this['left_wall']['material'] = create_material(f),
       this['right_wall']['material'] = create_material(f);
   }
   ['set_material_floor'](e, f) {
     f || add_undo_action({
         'type': 'set_material_floor',
         'from': this['params']['floor_material'],
         'to': e
       }),
       this['params']['floor_material'] = e,
       project_settings['selected_materials']['floor'] = e;
     var f = materials_lib['get_item'](this['params']['floor_material']);
     f['add_params']['model_width'] = this['params']['width'],
       f['add_params']['model_height'] = this['params']['depth'],
       this['floor']['material'] = create_material(f);
   }
   ['set_material_ceiling'](e) {
     this['params']['ceiling_material'] = e,
       project_settings['selected_materials']['walls'] = e;
     var e = materials_lib['get_item'](this['params']['ceiling_material']);
     e['add_params']['model_width'] = this['params']['width'],
       e['add_params']['model_height'] = this['params']['depth'],
       this['ceiling']['material'] = create_material(e);
   }
   ['change_wall_material'](e, f) {
     var g = materials_lib['get_item'](f);
     g['add_params'] || (g['add_params'] = {}),
       1 != custom_settings['no_walls_bump_old'] && (g['params']['bumpMap'] =
       '/common_assets/images/normals/522.jpg'),
       'right' == e && (g['add_params']['model_width'] = this['params']['depth'],
         g['add_params']['model_height'] = this['params']['height'],
         this['right_wall']['material'] = create_material(g),
         this['params']['rw_material'] = f,
         project_settings['selected_materials']['rw_material'] = f),
       'left' == e && (g['add_params']['model_width'] = this['params']['depth'],
         g['add_params']['model_height'] = this['params']['height'],
         this['left_wall']['material'] = create_material(g),
         this['params']['lw_material'] = f,
         project_settings['selected_materials']['lw_material'] = f),
       'front' == e && (g['add_params']['model_width'] = this['params']['width'],
         g['add_params']['model_height'] = this['params']['height'],
         this['front_wall']['material'] = create_material(g),
         this['params']['fw_material'] = f,
         project_settings['selected_materials']['fw_material'] = f),
       'back' == e && (g['add_params']['model_width'] = this['params']['width'],
         g['add_params']['model_height'] = this['params']['height'],
         this['back_wall']['material'] = create_material(g),
         this['params']['bw_material'] = f,
         project_settings['selected_materials']['bw_material'] = f);
   }
   ['reset_walls']() {
     var e;
     if ((_['remove'](this['walls_objects'], function(g) {
           return 'Shaft' !== g['type'];
         }),
         this['walls_only'] = [],
         1 != custom_settings['new_drag']) && !custom_settings['floor_only']) {
       for (var f = this['walls']['children']['length'] - 1; 1 < f; f--)
         this['active_objects']['splice'](this['active_objects']['indexOf'](this['walls']['children'][f]), 1);
     }
     reset_group(this['walls']);
   }
   ['reset_lights']() {
     for (var e = this, f = this['lights']['children']['length'] - 1; - 1 < f; f--) {
       var g = this['lights']['children'][f];
       'Group' !== g['type'] && g['shadow'] && g['shadow']['map'] && g['shadow']['map']['dispose'](),
         this['lights']['remove'](g);
     }
   }
   ['reset_sizes']() {
     for (var e = this['sizes']['children']['length'] - 1; - 1 < e; e--)
       this['sizes']['children'][e]['full_dispose']();
   }
   ['reset_plints']() {
     for (var e = this, f = this['plints']['children']['length'] - 1; - 1 < f; f--)
       this['plints']['remove'](this['plints']['children'][f]);
   }
   ['hide']() {
     this['walls']['visible'] = false,
       this['edges'] && (this['edges']['visible'] = false),
       this['sizes']['visible'] = false;
   }
   ['show']() {
     this['walls']['visible'] = true,
       this['sizes']['visible'] = true;
   }
   ['change_mode']() {
     'edges' === global_options['mode'] && this['edges_mode'](),
       'design' === global_options['mode'] && this['design_mode']();
   }
   ['edges_mode']() {
     var e = this;
     e['edges'] = new THREE['Group'](),
       e['add'](e['edges']),
       e['floor']['material']['visible'] = false,
       e['ceiling']['material']['visible'] = false,
       e['front_wall']['material']['visible'] = false,
       e['back_wall']['material']['visible'] = false,
       e['right_wall']['material']['visible'] = false,
       e['left_wall']['material']['visible'] = false,
       e['floor_edge'] = build_edges(e['floor']['geometry']),
       e['floor_edge']['position']['copy'](e['floor']['position']),
       e['floor_edge']['rotation']['copy'](e['floor']['rotation']),
       e['edges']['add'](e['floor_edge']),
       e['front_wall_edge'] = build_edges(e['front_wall']['geometry']),
       e['front_wall_edge']['position']['copy'](e['front_wall']['position']),
       e['front_wall_edge']['rotation']['copy'](e['front_wall']['rotation']),
       e['edges']['add'](e['front_wall_edge']),
       e['back_wall_edge'] = build_edges(e['back_wall']['geometry']),
       e['back_wall_edge']['position']['copy'](e['back_wall']['position']),
       e['back_wall_edge']['rotation']['copy'](e['back_wall']['rotation']),
       e['edges']['add'](e['back_wall_edge']),
       e['right_wall_edge'] = build_edges(e['right_wall']['geometry']),
       e['right_wall_edge']['position']['copy'](e['right_wall']['position']),
       e['right_wall_edge']['rotation']['copy'](e['right_wall']['rotation']),
       e['edges']['add'](e['right_wall_edge']),
       e['left_wall_edge'] = build_edges(e['left_wall']['geometry']),
       e['left_wall_edge']['position']['copy'](e['left_wall']['position']),
       e['left_wall_edge']['rotation']['copy'](e['left_wall']['rotation']),
       e['edges']['add'](e['left_wall_edge']),
       e['edges']['visible'] = true,
       e['lights']['visible'] = false;
     for (var f = 0, g; f < e['children']['length']; f++)
       'function' == typeof e['children'][f]['edges_mode'] && e['children'][f]['edges_mode']();
     for (g of pp['info']['tabletop']['bort_items'])
       'function' == typeof g['edges_mode'] && g['edges_mode']();
   }
   ['design_mode']() {
     var e = this;
     global_options['no_recalc'] = 1,
       e['floor']['material']['visible'] = true,
       e['ceiling']['material']['visible'] = true,
       e['front_wall']['material']['visible'] = true,
       e['back_wall']['material']['visible'] = true,
       e['right_wall']['material']['visible'] = true,
       e['left_wall']['material']['visible'] = true,
       e['edges'] && (reset_model(e['edges']),
         e['edges']['visible'] = false),
       e['lights']['visible'] = true;
     for (var f = 0, g; f < e['children']['length']; f++)
       'function' == typeof e['children'][f]['design_mode'] && e['children'][f]['design_mode']();
     for (g of pp['info']['tabletop']['bort_items'])
       'function' == typeof g['design_mode'] && g['design_mode']();
     global_options['no_recalc'] = 0,
       setTimeout(function() {
         1 != constructor_settings['tabletop_v2'] && !constructor_settings['core_v2'] || (sc['build_tabletop'](),
             setTimeout(() => {
               sc['get_price']();
             }, 100)),
           sc['get_price']();
       }, 100);
   }
   ['build_plints']() {}
 }

 function get_save_data_new(f = false) {
   var g = copy_object(project_settings),
     h = (g['project_id'] || (g['project_id'] = new Date()['getTime']()),
       pp['info']['project'] || {}),
     i = (h['account_updated'] = window['location']['href'],
       h['date_updated'] = new Date()['toLocaleString']('ru', {
         'timeZone': 'Europe/Moscow'
       }), {
         'account_created': h['account_created'] || '',
         'date_created': h['date_created'] || '',
         'account_updated': h['account_updated'] || '',
         'date_updated': h['date_updated'] || '',
         'version': version,
         'project_settings': g,
         'camera': {},
         'objects': [],
         'room': room['params'],
         'accessories': copy_object(cart['accessories']),
         'custom_items': copy_object(cart['custom_items']),
         'custom_userdata': {},
         'p_interface_options': {},
         'variables': null
       });
   pp['interface']['root'] && (i['p_interface_options'] = pp['interface']['root']['get_custom_options']()),
     i['camera']['position'] = camera['position'],
     i['camera']['target'] = controls['target'],
     constructor_settings['core_v2'] && (i['tabletops'] = sc['save_tabletops_data']()),
     constructor_settings['core_v2'] && pp['variables'] && (i['variables'] = copy_object(pp['variables']));
   for (let m = 0; m < room['active_objects']['length']; m++) {
     var j = room['active_objects'][m];
     'wall' === j['object_type'] || 'Wall_panel' === j['type'] && 1 != j['params']['draggable'] || (j['params'] || (j[
         'params'] = {}),
       j['userData']['class'] ? (j['userData']['params']['tabletop'] && (j['userData']['params']['tabletop'][
           'holes'] = void 0),
         j['userData']['params']['position'] = j['getWorldPosition'](new THREE['Vector3']()),
         j['userData']['params']['rotation'] = new THREE['Euler']()['setFromQuaternion'](j['getWorldQuaternion'](
           new THREE['Quaternion']())['clone']()),
         i['objects']['push'](j['userData']['params'])) : (j['params']['position'] = j['position'],
         j['params']['rotation'] = j['rotation'],
         1 == custom_settings['new_drag'] ? (j['params']['position'] = j['getWorldPosition'](new THREE['Vector3']
         ()),
           j['params']['rotation'] = new THREE['Euler']()['setFromQuaternion'](j['getWorldQuaternion'](new THREE[
             'Quaternion']())['clone']())) : (j['params']['position'] = j['position'],
           j['params']['rotation'] = j['rotation']),
         j['params']['type'] = j['type'],
         j['params']['tabletop'] && (j['params']['tabletop']['holes'] = void 0),
         i['objects']['push'](j['params'])));
   }
   if (custom_settings['cropper'] && !f) {
     var k = {},
       l = document['getElementsByClassName']('crp_img');
     for (let n = 0; n < l.length; n++)
       k[l[n]['id']] = l[n]['src'];
     i['image_maps'] = k;
   }
   return 'function' == typeof save_data_callback && save_data_callback(i),
     i;
 }
 async function save_scene_new(f = false, g = true, h = false) {
   var j = JSON['stringify'](get_save_data_new()),
     k, f = (f && (k = get_images()),
       new JSZip()),
     m;
   if ((f['file']('project.json', j),
       f['folder']('textures'),
       k && k['common_view']) && (m = k['common_view'])['startsWith']('data:image/')) {
     var q = m.replace(/^data:image\/[a-zA-Z]+;base64,/, ''),
       u = atob(q),
       v = new Uint8Array(u.length);
     for (let A = 0; A < u.length; A++)
       v[A] = u['charCodeAt'](A);
     f['file']('preview.jpeg', v, {
       'binary': true
     });
   }
   var w = f['folder']('textures'),
     m;
   if (global_options['custom_textures'])
     for (var x in global_options['custom_textures']) {
       if (global_options['custom_textures'][x]?.['texture']) {
         if ((m = global_options['custom_textures'][x]['texture'])['startsWith']('data:image/')) {
           var y, z = m['match'](/data:(image\/[a-zA-Z]+);base64,/)[1]['split']('/')[1],
             q = m.replace(/^data:image\/[a-zA-Z]+;base64,/, ''),
             u = atob(q),
             v = new Uint8Array(u.length);
           for (let B = 0; B < u.length; B++)
             v[B] = u['charCodeAt'](B);
           w['file'](x + '.' + z, v, {
             'binary': true
           });
         }
       }
     }
   var j = await f['generateAsync']({
     'type': 'blob',
     'compression': 'DEFLATE',
     'compressionOptions': {
       'level': 9
     }
   });
   if (h)
     return j;
   var k = URL['createObjectURL'](j),
     f = $('<a\x20id=\x22a_link\x22></a>'),
     h = new Date(),
     j = h['getDate']() + '.' + (h['getMonth']() + 1) + '.' + h['getFullYear']() + '_' + h['getHours']() + ':' + h[
       'getMinutes']();
   f['attr']('download', 'project_' + j + global_options['save_file_zip']),
     f['attr']('href', k),
     $('body')['append'](f),
     document['getElementById']('a_link')['click'](),
     f['remove']();
 }
 async function load_scene_new(k) {
   $('.project_select_wrapper')['hide'](),
     global_options['no_recalc'] = true;
   let q = 0;
   interface_version && (q = interface_version),
     undo_list = [],
     redo_list = [],
     $('#redo_action')['addClass']('inactive'),
     $('#undo_action')['addClass']('inactive');
   for (let T = room['active_objects']['length'] - 1; 0 <= T; T--)
     'wall' != room['active_objects'][T]['object_type'] && room['active_objects'][T]['delete'](true);
   let x = k;
   'string' == typeof x && (x = JSON['parse'](k)),
     'function' == typeof before_scene_load && before_scene_load(x);
   var k = pp['info']['project'] || {};
   if (k['account_created'] = x['account_created'] || '',
     k['date_created'] = x['date_created'] || '',
     k['account_updated'] = x['account_updated'] || x['account'] || '',
     k['date_updated'] = x['date_updated'] || x['date'] || '',
     pp['interface']['root']) {
     if (pp['interface']['root']['clear_cart'](),
       cart2) {
       for (let U = 0; U < cart2['accessories']['length']; U++)
         cart2['accessories']['splice'](U, 1);
     }
     x['p_interface_options'] && pp['interface']['root']['set_custom_options'](x['p_interface_options']);
   }
   active_el = active_el && null,
     !x['project_settings']['materials']['glass'] && project_settings['materials']['glass'] && (x['project_settings'][
         'materials'
       ]['glass'] = project_settings['materials']['glass'],
       x['project_settings']['selected_materials']['glass'] = project_settings['selected_materials']['glass']);
   var k = x['variables'];
   if (k) {
     pp['variables']['selected_index'] = k['selected_index'];
     for (let W of k['global_vars']) {
       var z = _['find'](pp['variables']['global_vars'], Z => Z['key'] === W['key']);
       if (z)
         for (let Z of W['vars']) {
           var A = _['find'](z['vars'], a0 => a0['key'] === Z['key']);
           A ? A['value'] = Z['value'] : z['vars']['push'](Z);
         }
       else
         pp['variables']['global_vars']['push'](W);
     }
   }
   (project_settings = copy_object(x['project_settings']))['selected_cornice_model'] || (project_settings[
     'selected_cornice_model'] = 0);
   var B = 0;

   function C(a0) {
     var a1 = copy_object(a0),
       a0 = (a1['categories'] = [],
         a1['items'] = [],
         a0['categories'] || []);
     let a2 = [a1];
     return 0 < a0.length && a0.forEach(a3 => {
         a2.push(...C(a3));
       }),
       a2;
   }
   if (project_settings['defaults'] || (project_settings['defaults'] = {}),
     1 == constructor_settings['tabletop_v2'] && tabletop_lib && tabletop_lib['first_item'] && ('function' ==
       typeof set_default_tabletop ? set_default_tabletop() : 0 != project_settings['defaults']['tabletop'] &&
       void 0 !== project_settings['defaults']['tabletop'] || (project_settings['defaults']['tabletop'] =
         tabletop_lib['first_item']['id'])),
     void 0 !== accsessories_data['types'] && (project_settings['selected_furniture'] ? Object['keys'](
         project_settings['selected_furniture'])['forEach'](function(a0) {
         accsessories_data['items'][project_settings['selected_furniture'][a0]] || (project_settings[
           'selected_furniture'][a0] = accsessories_data['default'][a0]);
       }) : project_settings['selected_furniture'] = accsessories_data['default'],
       0 < project_settings['accessories']['length']) && project_settings['accessories']['forEach']((a0, a1) => {
       void 0 !== accsessories_data['items'][a0['id']] && (project_settings['accessories'][a1]['price'] =
         accsessories_data['items'][a0['id']]['price'],
         project_settings['accessories'][a1]['total'] = project_settings['accessories'][a1]['price'] *
         project_settings['accessories'][a1]['count']);
     }),
     project_settings['handle']['model'] || (project_settings['handle']['model'] = handles_catalog['items'][
       handles_catalog['items']['length'] - 1
     ]),
     project_settings['handle']['model']['is_gola'] || (project_settings['handle']['model']['is_gola'] = false),
     false === project_settings['handle']['bottom_as_top'] && q < 2 && $('.handles_bottom')['addClass']('opened'),
     project_settings['handle']['top'] || (project_settings['handle']['top'] = copy_object(project_settings[
       'handle'])),
     project_settings['handle']['bottom'] || (project_settings['handle']['bottom'] = copy_object(project_settings[
       'handle']['top'])),
     1 == project_settings['handle']['no_handle'] && (project_settings['handle']['top']['no_handle'] = 1,
       project_settings['handle']['bottom']['no_handle'] = 1),
     1 != project_settings['handle']['no_handle'] && (find_obj_by_id(handles_catalog['items'], project_settings[
         'handle']['top']['model']['id']) && change_handle_model(project_settings['handle']['top']['model']['id'],
         project_settings['handle']['top']['preferable_size'], 'top', true),
       find_obj_by_id(handles_catalog['items'], project_settings['handle']['bottom']['model']['id'])) &&
     change_handle_model(project_settings['handle']['bottom']['model']['id'], project_settings['handle']['bottom'][
       'preferable_size'
     ], 'bottom', true),
     constructor_settings['core_v2'] && libs['cokol']['items_arr']['length'] && (project_settings[
       'selected_cokol_model'] = project_settings['selected_materials']['cokol']),
     constructor_settings['core_v2'] && !libs['cokol']['items_arr']['length']) {
     var D = {
         'name': '',
         'code': '',
         'icon': '',
         'category': [],
         'active': 1,
         'order': 10000,
         'params': {
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
           'material': 0,
           'height': 0,
           'thickness': 0,
           'width': 0
         }
       },
       E = [],
       F = [],
       G = project_settings['materials']['cokol'];
     for (let a0 = 0; a0 < G.length; a0++) {
       var H = materials_lib['categories'][G[a0]];
       E.push(...C(H));
     }
     for (let a1 = 0; a1 < E.length; a1++) {
       var I = materials_lib['categories'][E[a1]['id']]['items'];
       for (let a2 = 0; a2 < I.length; a2++) {
         var J = I[a2],
           K = copy_object(D);
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
           F.push(K);
       }
     }
     project_settings['selected_cokol_model'] = project_settings['selected_materials']['cokol'];
     var k = {
       'categories': E,
       'items': F
     };
     cokol_lib = new lib(copy_object(D), category_0),
       convert_lib_multi_cat(cokol_lib, k),
       libs['cokol'] = cokol_lib;
   }
   if (project_settings['selected_materials']['top']['facades_rotated'] || (project_settings['selected_materials'][
       'top'
     ]['facades_rotated'] = false),
     project_settings['selected_materials']['bottom']['facades_rotated'] || (project_settings['selected_materials'][
       'bottom'
     ]['facades_rotated'] = false),
     project_settings['accessories']) {
     for (let a3 = 0; a3 < project_settings['accessories']['length']; a3++)
       cart['accessories']['push'](project_settings['accessories'][a3]);
     if (x['custom_items'] && x['custom_items']['length']) {
       for (let a4 = 0; a4 < x['custom_items']['length']; a4++)
         cart['custom_items']['push'](x['custom_items'][a4]);
     }
     pp['interface']['root'] && setTimeout(() => {
       pp['interface']['root']['set_cart'](),
         pp['interface']['root']['$emit']('update_services_count');
     }, 500);
   }
   project_settings['accessories'] = cart['accessories'],
     'center' === project_settings['handle']['lockers_position'] && (project_settings['handle']['lockers_position'] =
       'middle'),
     void 0 === project_settings['is_cokol_active'] && (project_settings['is_cokol_active'] = true),
     void 0 === project_settings['handle']['no_handle'] && (project_settings['handle']['no_handle'] = false),
     void 0 === project_settings['cornice_active'] && (project_settings['cornice_active'] = false),
     void 0 === project_settings['cornice_available'] && (project_settings['cornice_available'] =
       constructor_settings['cornice_available']),
     room['params'] = x['room'],
     room['build'](),
     camera['position']['set'](x['camera']['position']['x'], x['camera']['position']['y'], x['camera']['position'][
       'z']),
     controls['target']['set'](x['camera']['target']['x'], x['camera']['target']['y'], x['camera']['target']['z']),
     controls['update']();
   for (var L = [], N = 0; N < x['objects']['length']; N++) {
     var O = x['objects'][N],
       P, Q, R, P;
     if ('Cabinet' === O['type']) {
       if (parseFloat(x['version']) < 3.6 && O['cornice'] && O['cornice']['visible'] && 1 != project_settings[
           'cornice_active'] && (O['cornice']['visible']['front'] = false),
         parseInt(x['version']) < 4) {
         if (O['doors']) {
           for (let a5 = 0; a5 < O['doors']['length']; a5++)
             O['doors'][a5]['facade'] = project_settings['defaults']['facades'][O['doors']['facade_group']],
             project_settings['defaults']['facades']['top'] != project_settings['defaults']['facades']['bottom'] && (
               O['doors'][a5]['facade'] = project_settings['defaults']['facades'][O['doors'][a5]['group']]);
         }
         if (O['lockers']) {
           for (let a6 = 0; a6 < O['lockers']['length']; a6++)
             O['lockers'][a6]['facade'] = project_settings['defaults']['facades'][O['lockers']['facade_group']],
             project_settings['defaults']['facades']['top'] != project_settings['defaults']['facades']['bottom'] && (
               O['lockers'][a6]['facade'] = project_settings['defaults']['facades'][O['lockers'][a6]['group']]);
         }
       }
       P = sc['add_object']('cabinet', O, false);
     }
     if (O['object_type'] && 'cabinet_cn' == O['object_type'] && (P = sc['add_object']('cabinet_cn', O, false)),
       'module' == O['type'] && '__tabletop' === (P = sc['add_object']('module', O, false))['userData']['params'][
         'spec'
       ]['element_type'] && (Q = pp['state']['scene_layers']['tabletop'],
         (R = P['userData']['parts']['tabletop'][0])['visible'] = Q,
         R['userData']['params']['visible'] = Q,
         P['change_param_by_path'](R['userData']['path'], 'visible', Q, false),
         P['visible'] = Q,
         P['userData']['params']['visible'] = Q),
       O['object_type'] && 'drag_group' == O['object_type']) {
       continue;
       P = sc['add_object']('drag_group', O, false),
         L.push(P);
     }
     'Model' === O['type'] && (O['is_new'] = 0,
         P = sc['add_object']('model', O, false)),
       'Shaft' === O['type'] && (P = sc['add_object']('shaft', O, false)),
       'Wall_panel' === O['type'] && (P = sc['add_object']('Wall_panel', O, false)),
       'Washer' === O['type'] && 'not_loaded' === (P = sc['add_object']('washer', O, false))['model_loaded'] && P[
         'load_model'](),
       P && (P['rotation']['set'](O['rotation']['_x'], O['rotation']['_y'], O['rotation']['_z']),
         P['position']['set'](O['position']['x'], O['position']['y'], O['position']['z'])),
       setTimeout(function() {
         null != P && ('function' == typeof P['calculate_distances'] && P['calculate_distances'](),
           'function' == typeof P['build_from_wall_sizes']) && P['build_from_wall_sizes']();
       }, 500);
   }
   void 0 === project_settings['selected_materials']['cornice'] && (project_settings['selected_materials'][
       'cornice'] = project_settings['selected_materials']['top']['facades']),
     void 0 === project_settings['cornice_change_with_facade'] && (project_settings['cornice_change_with_facade'] =
       1),
     'function' == typeof load_scene_callback && (x['custom_userdata'] && 0 < Object['keys'](x['custom_userdata'])[
         'length'] && (project_settings['custom_userdata'] = copy_object(x['custom_userdata'])),
       load_scene_callback()),
     void 0 === (pp['project_settings'] = project_settings)['bort_active'] && (project_settings['bort_active'] = !
       1),
     await pp['run_event']('global', 'after_scene_load');
   let S = x['tabletops'];
   setTimeout(() => {
       constructor_settings['core_v2'] ? (sc['build_tabletop_v3'](),
           setTimeout(() => {
             sc['load_tabletops_data'](S),
               autosave(),
               sc['get_price']();
           }, 200)) : 1 == constructor_settings['tabletop_v2'] && (sc['build_tabletop'](),
           setTimeout(() => {
             sc['get_price']();
           }, 200)),
         sc['update_from_wall_sizes'](),
         sc['load_rulers']();
     }, 2000),
     setTimeout(function() {
       if (custom_settings['cropper']) {
         let a9 = document['getElementById']('cropped_images');
         if (a9['innerHTML'] = '',
           x['image_maps']) {
           let aa = {};
           Object['keys'](x['image_maps'])['forEach'](function(ab) {
             var ac = ab,
               ad = ac.split(':'),
               ae = ad['shift']();
             aa[ae] || (aa[ae] = []);
             for (let ag = 0; ag < ad.length; ag++)
               aa[ae]['push']({
                 'key': ad[ag],
                 'img': x['image_maps'][ab]
               });
             var af = document['createElement']('IMG');
             af['src'] = x['image_maps'][ab],
               af['id'] = ac,
               af['classList']['add']('crp_img'),
               af['dataset']['key'] = ac,
               a9['appendChild'](af);
           });
           for (let ab = 0; ab < room['active_objects']['length']; ab++)
             if ('Model' === room['active_objects'][ab]['params']['type'] && 'Other' === room['active_objects'][ab][
                 'params'
               ]['catalog']) {
               var a7 = room['active_objects'][ab];
               if (aa[a7['params']['obj_id']])
                 for (let ac = 0; ac < aa[a7['params']['obj_id']]['length']; ac++) {
                   var a8 = aa[a7['params']['obj_id']][ac];
                   a7['set_image_map_by_key'](a8['key'], a8['img']);
                 }
             }
         }
       }
       project_settings['disable_demo'] && (disable_demo = 0),
         check_overlap(),
         check_furni(),
         global_options['no_recalc'] = false,
         pp['interface']['root'] && (pp['interface']['root']['$emit']('project_loaded'),
           pp['interface']['root']['$emit']('project_select_mode')),
         get_total_price_test(),
         get_total_specs(),
         1 === global_options['export_to_obj'] && export_to_obj(),
         build_sizes_all(),
         update_materials_panel(),
         autosave();
     }, 1000);
 }

 function check_furni() {
   var f = {};
   for (let h = 0; h < room['active_objects']['length']; h++)
     if (room['active_objects'][h]['params'] && room['active_objects'][h]['params']['object_type'] && 'cabinet' == room[
         'active_objects'][h]['params']['object_type']) {
       var g = room['active_objects'][h];
       if (g['params']['accessories_list']['length']) {
         for (let i = 0; i < g['params']['accessories_list']['length']; i++)
           f[g['params']['accessories_list'][i]['id']] ? f[g['params']['accessories_list'][i]['id']] += g['params'][
             'accessories_list'
           ][i]['count'] : f[g['params']['accessories_list'][i]['id']] = g['params']['accessories_list'][i]['count'];
       }
     }
 }

 function show_autosave_modal() {
   let f = setInterval(function() {
     null != pp['interface']['root'] && (clearInterval(f),
       pp['interface']['root']['$emit']('yn_modal_show', {
         'heading': '',
         'body': lang['autosave_found_load'],
         'cb': 'autosave',
         'no_callback': async function() {
           await pp['run_event']('interaction', 'autosave_load_cancel'),
             pp['interface']['root']['$emit']('autosave_cancel');
         }
       }));
   }, 100);
 }
 async function load_from_params() {
   global_options['url_params']['lang'] && (selected_lang = objectFindByKey(languages, 'code', getUrlParameter(
       'lang')),
     lang = selected_lang['data']);
   var f = '',
     g = 0,
     h, i;
   if (custom_settings['no_autosave'] && (no_autosave = 1),
     global_options['url_params']['no_autosave'] && (no_autosave = 1),
     global_options['url_params']['project'] && (f = 'templates/' + global_options['url_params']['project'] +
       '.dbs?' + +new Date()['getTime']()),
     global_options['url_params']['s_project'] && (f = 'saved_projects/' + global_options['url_params']['s_project'] +
       '/project.dbs'),
     global_options['url_params']['co'] && (f = 'clients_orders/' + global_options['url_params']['co']['replace'](
       '_\x20', '_+')),
     global_options['url_params']['file_url'] && (f = global_options['url_params']['file_url'],
       g = 1),
     global_options['url_params']['save_to_obj'] && (global_options['export_to_obj'] = 1),
     'function' == typeof load_from_params_callback && (h = load_from_params_callback()) && (f = h['url'],
       g = h['external']),
     '' !== f)
     $('.project_select_wrapper')['hide'](),
     0 === g ? $['ajax']({
       'type': 'GET',
       'url': f,
       'success': function(j) {
         load_scene_new(j);
       },
       'error': function() {}
     }) : $['ajax']({
       'type': 'POST',
       'url': '/common_assets/php/ajax.php',
       'data': {
         'get_file_by_url': f,
         'sc': 'BnJSWooAwTEM'
       },
       'success': function(j) {
         load_scene_new(j);
       },
       'error': function() {}
     });
   else {
     let j = 0;
     try {
       await pp['storage']['getJsonFromZip']('autosave') && (j = 1,
         show_autosave_modal());
     } catch (k) {}
     await pp['run_event']('global', 'after_autosave_modal_show', j);
   }
 }
 class Shaft extends PPObject {
   constructor(e) {
       super(e);
       var f = this;
       this['type'] = 'Shaft',
         this['temp_type'] = 'Shaft',
         this['params'] = {
           'name': (e = e || {})['name'] || lang['shaft'],
           'width': e['width'] || 100,
           'height': e['height'] || 300,
           'depth': e['depth'] || 300,
           'material': e['material'] || project_settings['selected_materials']['walls'],
           'cabinet_type': e['cabinet_type'] || 'top',
           'orientation': void 0 !== e['orientation'] ? e['orientation'] : 'vertical',
           'mode': void 0 !== e['mode'] ? e['mode'] : 'stretch'
         },
         this['params']['top_mat'] = void 0 !== e['top_mat'] ? e['top_mat'] : this['params']['material'],
         this['params']['bottom_mat'] = void 0 !== e['bottom_mat'] ? e['bottom_mat'] : this['params']['material'],
         this['params']['front_mat'] = void 0 !== e['front_mat'] ? e['front_mat'] : this['params']['material'],
         this['params']['back_mat'] = void 0 !== e['back_mat'] ? e['back_mat'] : this['params']['material'],
         this['params']['left_mat'] = void 0 !== e['left_mat'] ? e['left_mat'] : this['params']['material'],
         this['params']['right_mat'] = void 0 !== e['right_mat'] ? e['right_mat'] : this['params']['material'],
         this['box'] = new THREE['Box3'](),
         this['box']['update'] = function() {
           f['box']['setFromObject'](f['size_box']);
         },
         this['type'] = 'Shaft',
         this['object_type'] = 'cabinet',
         this['cabinet_type'] = f['params']['cabinet_type'],
         this['name'] = lang['shaft'],
         this['sizes'] = new THREE['Group'](),
         this['sizes']['name'] = 'Sizes',
         this['add'](this['sizes']),
         this['model2'] = new THREE['Group'](),
         this['model2']['name'] = 'Model',
         this['add'](this['model2']),
         this['build']();
     }
     ['build']() {
       var f = this,
         g = (f['reset_model'](),
           f['size_box'] = new SizeBox({
             'width': f['params']['width'] / units,
             'height': f['params']['height'] / units,
             'depth': f['params']['depth'] / units
           }),
           f['add'](f['size_box']),
           f['size_box']['visible'] = false,
           f['params']['width'] / units),
         h = f['params']['height'] / units,
         j = f['params']['depth'] / units;
       f['size_box']['position']['y'] = h / 2;
       let k = materials_lib['get_item'](this['params']['front_mat']);
       k['params']['bumpMap'] = '/common_assets/images/normals/522.jpg',
         k['add_params']['model_width'] = this['params']['width'],
         k['add_params']['model_height'] = this['params']['height'],
         this['userData']['planes'] = {},
         this['userData']['planes']['front'] = new THREE['Mesh'](new THREE['PlaneGeometry'](g, h), create_material(k)),
         this['userData']['planes']['front']['name'] = 'Shaft_wall',
         this['userData']['planes']['front']['position']['set'](0, h / 2, j / 2),
         this['model2']['add'](this['userData']['planes']['front']),
         (k = materials_lib['get_item'](this['params']['back_mat']))['params']['bumpMap'] =
         '/common_assets/images/normals/522.jpg',
         k['add_params']['model_width'] = this['params']['width'],
         k['add_params']['model_height'] = this['params']['height'],
         this['userData']['planes']['back'] = new THREE['Mesh'](new THREE['PlaneGeometry'](g, h), create_material(k)),
         this['userData']['planes']['back']['name'] = 'Shaft_wall',
         this['userData']['planes']['back']['geometry']['rotateY'](Math['PI']),
         this['userData']['planes']['back']['position']['set'](0, h / 2, -j / 2),
         this['model2']['add'](this['userData']['planes']['back']),
         (k = materials_lib['get_item'](this['params']['left_mat']))['params']['bumpMap'] =
         '/common_assets/images/normals/522.jpg',
         k['add_params']['model_width'] = this['params']['depth'],
         k['add_params']['model_height'] = this['params']['height'],
         this['userData']['planes']['left'] = new THREE['Mesh'](new THREE['PlaneGeometry'](j, h), create_material(k)),
         this['userData']['planes']['left']['name'] = 'Shaft_wall',
         this['userData']['planes']['left']['geometry']['rotateY'](-Math['PI'] / 2),
         this['userData']['planes']['left']['position']['set'](-g / 2, h / 2, 0),
         this['model2']['add'](this['userData']['planes']['left']),
         (k = materials_lib['get_item'](this['params']['right_mat']))['params']['bumpMap'] =
         '/common_assets/images/normals/522.jpg',
         k['add_params']['model_width'] = this['params']['depth'],
         k['add_params']['model_height'] = this['params']['height'],
         this['userData']['planes']['right'] = new THREE['Mesh'](new THREE['PlaneGeometry'](j, h), create_material(k)),
         this['userData']['planes']['right']['name'] = 'Shaft_wall',
         this['userData']['planes']['right']['geometry']['rotateY'](Math['PI'] / 2),
         this['userData']['planes']['right']['position']['set'](g / 2, h / 2, 0),
         this['model2']['add'](this['userData']['planes']['right']),
         (k = materials_lib['get_item'](this['params']['top_mat']))['params']['bumpMap'] =
         '/common_assets/images/normals/522.jpg',
         k['add_params']['model_width'] = this['params']['width'],
         k['add_params']['model_height'] = this['params']['depth'],
         this['userData']['planes']['top'] = new THREE['Mesh'](new THREE['PlaneGeometry'](g, j), create_material(k)),
         this['userData']['planes']['top']['name'] = 'Shaft_wall',
         this['userData']['planes']['top']['geometry']['rotateX'](-Math['PI'] / 2),
         this['userData']['planes']['top']['position']['set'](0, h, 0),
         this['model2']['add'](this['userData']['planes']['top']),
         (k = materials_lib['get_item'](this['params']['bottom_mat']))['params']['bumpMap'] =
         '/common_assets/images/normals/522.jpg',
         k['add_params']['model_width'] = this['params']['width'],
         k['add_params']['model_height'] = this['params']['depth'],
         this['userData']['planes']['bottom'] = new THREE['Mesh'](new THREE['PlaneGeometry'](g, j), create_material(k)),
         this['userData']['planes']['bottom']['name'] = 'Shaft_wall',
         this['userData']['planes']['bottom']['geometry']['rotateX'](Math['PI'] / 2),
         this['userData']['planes']['bottom']['position']['set'](0, 0, 0),
         this['model2']['add'](this['userData']['planes']['bottom']),
         Object['keys'](this['userData']['planes'])['forEach'](l => {
           this['userData']['planes'][l]['receiveShadow'] = true,
             this['userData']['planes'][l]['castShadow'] = true,
             (this['userData']['planes'][l]['userData']['root'] = this)['userData']['planes'][l]['userData']['tag'] =
             l;
         }),
         this['model'] = this['model2'],
         f['build_sizes'](),
         f['box']['update'](),
         'edges' === global_options['mode'] && f['edges_mode'](),
         this['calculate_distances'](),
         this['build_from_wall_sizes']();
     }
     ['mouse_move'](e) {
       var f, g;
       'stretch' === this['params']['mode'] && ('horizontal' === (f = this)['params']['orientation'] ? (this['rotation']
           ['y'] === Math['PI'] || 0 === this['rotation']['y'] ? this['params']['width'] != room['params'][
           'width'] && (g = room['params']['width'] / units,
             this['params']['width'] = room['params']['width'],
             f['position']['x'] = g / 2,
             f['set_width_by_min_max'](-g / 2, g / 2)) : this['params']['width'] != room['params']['depth'] && (
             this['params']['width'] = room['params']['depth'],
             g = room['params']['depth'] / units,
             f['position']['z'] = g / 2,
             f['set_width_by_min_max'](-g / 2, g / 2)),
           this['size_box']['set_size'](f['params']['width'] / units, f['params']['height'] / units, f['params'][
             'depth'
           ] / units),
           f['size_box']['position']['y'] = f['params']['height'] / units / 2) : (f['position']['y'] = 0,
           this['params']['height'] != room['params']['height'] && (this['params']['height'] = room['params'][
               'height'],
             g = room['params']['height'] / units,
             this['size_box']['set_size'](f['params']['width'] / units, f['params']['height'] / units, f['params'][
               'depth'
             ] / units),
             f['size_box']['position']['y'] = f['params']['height'] / units / 2,
             f['set_height_by_min_max'](-g / 2, g / 2))),
         this['box']['update']());
     }
     ['build_sizes']() {
       this['reset_model'](this['sizes']),
         this['size_width'] = new Sizes_obj({
           'width': this['params']['width'] / units,
           'text': this['params']['width'],
           'font_size': 50
         }),
         this['size_width']['position']['set'](0, this['params']['height'] / units, -this['params']['depth'] / units /
           2 + 0.04),
         this['sizes']['add'](this['size_width']),
         this['size_height'] = new Sizes_obj({
           'width': this['params']['height'] / units,
           'text': this['params']['height'],
           'font_size': 50
         }),
         this['size_height']['position']['set'](-this['params']['width'] / units / 2, this['params']['height'] /
           units / 2, -this['params']['depth'] / units / 2 + 0.04),
         'vertical' === this['params']['orientation'] && 'stretch' === this['params']['mode'] && (this['size_height'][
             'visible'
           ] = false,
           this['size_width']['position']['y'] = this['params']['height'] / units),
         'horizontal' === this['params']['orientation'] && 'stretch' === this['params']['mode'] && (this['size_width'][
           'visible'
         ] = false),
         this['size_height']['rotation']['z'] = Math['PI'] / 2,
         this['sizes']['add'](this['size_height']),
         this['sizes']['visible'] = global_options['sizes_visible'];
     }
     ['set_width_by_min_max'](f, g) {
       this['userData']['planes']['right']['position']['x'] = g,
         this['userData']['planes']['left']['position']['x'] = f;
       for (let v = this['model2']['children']['length']; v--;)
         if ('Shaft_wall' == this['model2']['children'][v]['name'] && this['model2']['children'][v]['uuid'] != this[
             'userData']['planes']['right']['uuid'] && this['model2']['children'][v]['uuid'] != this['userData'][
             'planes'
           ]['left']['uuid']) {
           var j = this['model2']['children'][v]['geometry']['attributes']['position'];
           for (let w = 0; w < j['count']; w++) {
             var k = j['getX'](w),
               l = j['getY'](w),
               n = j['getZ'](w),
               q, u;
             let x = k;
             x = k < 0 ? f : g,
               j['setXYZ'](w, x, l, n);
           }
           this['model2']['children'][v]['geometry']['attributes']['position']['needsUpdate'] = true,
             this['model2']['children'][v]['geometry']['computeBoundingBox'](),
             this['model2']['children'][v]['geometry']['computeBoundingSphere'](),
             this['update_plane_material'](this['model2']['children'][v]);
         }
       this['build_sizes']();
     }
     ['set_height_by_min_max'](f, g) {
       this['userData']['planes']['top']['position']['y'] = 2 * g;
       for (let v = this['model2']['children']['length']; v--;)
         if ('Shaft_wall' == this['model2']['children'][v]['name'] && this['model2']['children'][v]['uuid'] != this[
             'userData']['planes']['top']['uuid'] && this['model2']['children'][v]['uuid'] != this['userData']['planes']
           ['bottom']['uuid']) {
           var j = this['model2']['children'][v]['geometry']['attributes']['position'];
           for (let w = 0; w < j['count']; w++) {
             var k = j['getX'](w),
               l = j['getY'](w),
               n = j['getZ'](w),
               q, u;
             let x = l;
             x = l < 0 ? -(g - f) / 2 : (g - f) / 2,
               j['setXYZ'](w, k, x, n);
           }
           this['model2']['children'][v]['geometry']['attributes']['position']['needsUpdate'] = true,
             this['model2']['children'][v]['geometry']['computeBoundingBox'](),
             this['model2']['children'][v]['geometry']['computeBoundingSphere'](),
             this['model2']['children'][v]['position']['y'] = (g - f) / 2,
             this['update_plane_material'](this['model2']['children'][v]);
         }
       this['build_sizes']();
     }
     ['set_size'](f, g, j, k) {
       let l = this,
         m;
       false !== k && (m = {
           'type': 'set_shaft_size',
           'from': {
             'width': l['params']['width'],
             'height': l['params']['height'],
             'depth': l['params']['depth']
           },
           'object': l
         }),
         this['params']['width'] = f,
         this['params']['height'] = g,
         this['params']['depth'] = j,
         'stretch' !== this['params']['mode'] ? (this['params']['width'] = f,
           this['params']['height'] = g,
           this['params']['depth'] = j) : ('horizontal' === this['params']['orientation'] ? this['params']['height'] =
           g : this['params']['width'] = f,
           this['params']['depth'] = j,
           l['mouse_move']()),
         false !== k && (m['to'] = {
             'width': l['params']['width'],
             'height': l['params']['height'],
             'depth': l['params']['depth']
           },
           add_undo_action(m)),
         this['build']();
       try {
         dControls['s_helper']['make'](this);
       } catch (n) {}
     }
     ['set_size_by_number'](e, f, g) {
       this['set_size'](e, f, g, true);
     }
     ['change_material'](e) {
       var f = this;
       void 0 === e && (e = 0),
         this['params']['material'] = e,
         Object['keys'](this['userData']['planes'])['forEach'](g => {
           this['change_plane_material'](g, e);
         });
     }
     ['change_plane_material'](e, f) {
       this['userData']['planes'][e]['material'] && dispose_material(this['userData']['planes'][e]['material']);
       var g, f = (this['params'][e + '_mat'] = f,
         materials_lib['get_item'](f));
       f['params']['bumpMap'] = '/common_assets/images/normals/522.jpg',
         'front' == e || 'back' == e ? (f['add_params']['model_width'] = this['params']['width'],
           f['add_params']['model_height'] = this['params']['height']) : 'left' == e || 'right' == e ? (f['add_params'][
             'model_width'
           ] = this['params']['depth'],
           f['add_params']['model_height'] = this['params']['height']) : (f['add_params']['model_width'] = this[
             'params']['width'],
           f['add_params']['model_height'] = this['params']['depth']),
         this['userData']['planes'][e]['material'] = create_material(f);
     }
     ['update_plane_material'](e) {
       var f = e['userData']['tag'] + '_mat',
         f = this['params'][f];
       this['change_plane_material'](e['userData']['tag'], f);
     }
     ['show_radial_menu'](f, g) {
       var h = this,
         i = {
           'material': false,
           'material_corpus': false,
           'copy_button': true,
           'rotate_buttons': true,
           'sizes': true
         };
       pp['interface']['root']['radial']({
         'obj_type': this['type'],
         'obj': i,
         'left': f,
         'top': g
       });
     }
     ['delete']() {
       for (let e = room['walls_objects']['length']; e--;)
         this['uuid'] == room['walls_objects'][e]['uuid'] && room['walls_objects']['splice'](e, 1);
       super['delete']();
     }
     ['copypaste']() {
       var e = new Shaft(JSON['parse'](JSON['stringify'](this['params'])));
       room['add'](e),
         room['active_objects']['push'](e),
         d_objects.push(e),
         e['position']['copy'](this['position']),
         e['rotation']['copy'](this['rotation']),
         'vertical' === e['params']['orientation'] ? (0 === e['rotation']['y'] && (e['position']['x'] += e['params'][
             'width'
           ] / units),
           e['rotation']['y'] === Math['PI'] && (e['position']['x'] -= e['params']['width'] / units),
           e['rotation']['y'] === Math['PI'] / 2 && (e['position']['z'] -= e['params']['width'] / units),
           e['rotation']['y'] === -Math['PI'] / 2 && (e['position']['z'] += e['params']['width'] / units)) : this[
           'position']['y'] - this['params']['height'] / units < 0 ? e['position']['y'] += e['params']['height'] /
         units : e['position']['y'] -= e['params']['height'] / units,
         add_undo_action({
           'type': 'copy',
           'object': e
         }),
         setTimeout(function() {
           'bottom' === e['params']['cabinet_group'] && get_wall_panel(),
             get_total_price_test();
         }, 200);
     }
 }
 class Shelve_new extends PPObject {
   constructor(f) {
       super(f);
       var g = this;
       this['type'] = 'Shelve',
         this['temp_type'] = 'Shelve',
         this['object_type'] = 'cabinet',
         this['cabinet_type'] = 'top',
         (f = f || [])['variants'] || (f['variants'] = []),
         f['cornice'] || (f['cornice'] = {}),
         this['params'] = {
           'width': void 0 !== f['width'] ? f['width'] : 600,
           'height': void 0 !== f['height'] ? f['height'] : 300,
           'thickness': void 0 !== f['thickness'] ? f['thickness'] : project_settings['corpus_thickness'],
           'class': void 0 !== f['class'] ? f['class'] : 'common',
           'orientation': void 0 !== f['orientation'] ? f['orientation'] : 'right',
           'vertical_orientation': void 0 !== f['vertical_orientation'] ? f['vertical_orientation'] : 'horizontal',
           'angle': void 0 !== f['angle'] ? f['angle'] : 45,
           'radius': void 0 !== f['radius'] ? f['radius'] : void 0,
           'material': void 0 !== f['material'] ? f['material'] : project_settings['selected_materials']['top'][
             'corpus'
           ],
           'rX': void 0 !== f['rX'] ? f['rX'] : 0,
           'rY': void 0 !== f['rY'] ? f['rY'] : 0,
           'rZ': void 0 !== f['rZ'] ? f['rZ'] : 0,
           'pX': void 0 !== f['pX'] ? f['pX'] : 0,
           'pY': void 0 !== f['pY'] ? f['pY'] : 0,
           'pZ': void 0 !== f['pZ'] ? f['pZ'] : 0,
           'name': void 0 !== f['name'] ? f['name'] : 'shelve'
         },
         this['params']['cornice'] = {
           'active': void 0 === f['cornice']['active'] || f['cornice']['active'],
           'available': void 0 !== f['cornice']['available'] ? f['cornice']['available'] : void 0,
           'force': void 0 !== f['cornice']['force'] && f['cornice']['force'],
           'model': void 0 !== f['cornice']['model'] ? f['cornice']['model'] : '/common_assets/models/cornice.fbx',
           'corner_model': void 0 !== f['cornice']['corner_model'] ? f['cornice']['corner_model'] :
             '/common_assets/models/cornice_corner.fbx',
           'corner_model_45': void 0 !== f['cornice']['corner_model_45'] ? f['cornice']['corner_model_45'] :
             '/common_assets/models/cornice_corner_45.fbx',
           'radius_model': void 0 !== f['cornice']['radius_model'] ? f['cornice']['radius_model'] :
             '/common_assets/models/cornice_radius.fbx',
           'visible': void 0 !== f['cornice']['visible'] ? f['cornice']['visible'] : {
             'left': false,
             'right': false,
             'back': false,
             'front': false,
             'front_corner_left': false,
             'front_corner_right': false,
             'back_corner_left': false,
             'back_corner_right': false
           },
           'material': void 0 !== f['cornice']['material'] ? f['cornice']['material'] : project_settings[
             'selected_materials']['top']['corpus'],
           'offset_front': void 0 !== f['cornice']['offset_front'] ? f['cornice']['offset_front'] : 0,
           'offset_back': void 0 !== f['cornice']['offset_back'] ? f['cornice']['offset_back'] : 0,
           'offset_left': void 0 !== f['cornice']['offset_left'] ? f['cornice']['offset_left'] : 0,
           'offset_right': void 0 !== f['cornice']['offset_right'] ? f['cornice']['offset_right'] : 0
         },
         project_settings['custom_cornice'] && (this['params']['cornice']['model'] = project_settings['custom_cornice'][
             'model'
           ],
           this['params']['cornice']['corner_model'] = project_settings['custom_cornice']['corner_model'],
           this['params']['cornice']['corner_model_45'] = project_settings['custom_cornice']['corner_model_45'],
           this['params']['cornice']['radius_model'] = project_settings['custom_cornice']['radius_model']),
         void 0 === this['params']['radius'] && (this['params']['radius'] = this['params']['height']),
         this['box'] = new THREE['Box3'](),
         this['box']['update'] = function() {
           g['box']['setFromObject'](g['model']);
         };
       let h = g['params']['width'] / units,
         j = g['params']['thickness'] / units,
         k = g['params']['height'] / units;
       'vertical' == g['params']['vertical_orientation'] && (h = g['params']['thickness'] / units,
           j = g['params']['width'] / units,
           k = g['params']['height'] / units),
         g['size_box'] = new SizeBox({
           'width': h,
           'height': j,
           'depth': k
         }),
         'vertical' == g['params']['vertical_orientation'] ? g['size_box']['position']['y'] = g['params']['width'] /
         units / 2 : g['size_box']['position']['y'] = g['params']['thickness'] / units / 2,
         g['add'](g['size_box']),
         g['size_box']['visible'] = false,
         this['model'] = new THREE['Group'](),
         this['model']['name'] = 'Shelve',
         this['add'](this['model']),
         this['cornice'] = new THREE['Group'](),
         this['cornice']['name'] = 'Cornice',
         this['add'](this['cornice']),
         this['sizes'] = new THREE['Group'](),
         this['sizes']['name'] = 'Sizes',
         this['add'](this['sizes']),
         this['build']();
     }
     ['delete'](e) {
       this['reset_model'](),
         super['del_spl']();
     }
 }
 Shelve_new['prototype']['build'] = function() {
     this['reset_model']();
     var e = this,
       f = new THREE['Shape'](),
       f = ('common' === this['params']['class'] && (f = build_shape['square'](e['params']['width'] / units, e['params']
           ['height'] / units)),
         'corner' === this['params']['class'] && (f = build_shape['corner_angle'](e['params']['width'] / units, e[
           'params']['height'] / units, e['params']['orientation'], e['params']['angle'])),
         'half_rounded' === this['params']['class'] && (f = build_shape['half_rounded'](e['params']['width'] / units, e[
           'params']['height'] / units, e['params']['orientation'], e['params']['radius'] / units)),
         'half_rounded_double' === this['params']['class'] && (f = build_shape['half_rounded_double'](e['params'][
           'width'
         ] / units, e['params']['height'] / units, e['params']['radius'] / units)),
         'corner_double' === this['params']['class'] && (f = build_shape['corner_angle_double'](e['params']['width'] /
           units, e['params']['height'] / units, e['params']['angle'])),
         this['model']['shelve'] = new Object_wall({
           'thickness': this['params']['thickness'] / units,
           'rX': Math['PI'] / 2,
           'pY': this['params']['thickness'] / units,
           'name': 'shelve',
           'material': e['params']['material'],
           'shape': f
         }),
         'vertical' === this['params']['vertical_orientation'] && (this['model']['rotation']['z'] = Math['PI'] / 2,
           this['model']['position']['y'] = this['params']['width'] / units / 2,
           this['model']['shelve']['position']['y'] = this['params']['thickness'] / units / 2),
         this['model']['add'](this['model']['shelve']),
         this['build_cornice'](),
         this['build_sizes'](),
         'edges' === global_options['mode'] && e['edges_mode'](),
         global_update(),
         this['calculate_distances'](),
         this['build_from_wall_sizes'](),
         get_material_data(this['params']['material'], materials_catalog)),
       e = {
         'thickness': '',
         'parent_category_name': '',
         'category_name': '',
         'name': '',
         'code': '',
         'pm': '',
         'm2': ''
       },
       f = (e['thickness'] = ',\x20' + this['params']['thickness'] + lang['mm'] + '\x20',
         f && (f['parent_category_name'] && (e['parent_category_name'] = f['parent_category_name'] += '\x20'),
           f['category_name'] && (e['category_name'] = f['category_name'] += '\x20'),
           f['name'] && (e['name'] = f['name'] += '\x20'),
           f['code']) && (e['code'] = f['code']),
         e['parent_category_name'] + e['category_name'] + e['name'] + e['code'] + e['thickness']);
     this['params']['name'] = lang['shelve'] + '\x20' + f,
       this['params']['code'] = lang['shelve'] + '-' + e['code'] + '-' + this['params']['thickness'],
       sc['get_price']();
   },
   Shelve_new['prototype']['build_cornice'] = function() {
     var f, g, h, j, j, j;
     this['reset_model'](this['cornice']),
       0 != constructor_settings['cornice_available'] && 0 != project_settings['cornice_available'] && (void 0 ===
         this['params']['cornice']['available'] && (this['params']['cornice']['available'] = true),
         'horizontal' === this['params']['vertical_orientation']) && (g = (f = this)['cornice'],
         h = f['params']['cornice'],
         'common' === this['params']['class'] && (g['front'] = new Cornice({
             'model': h['model'],
             'width': f['params']['width']
           }),
           g['front']['position']['set'](0, f['params']['thickness'] / units, f['params']['height'] / units / 2 + h[
             'offset_front'] / units),
           g['right'] = new Cornice({
             'model': h['model'],
             'width': f['params']['height'] + h['offset_front']
           }),
           g['right']['rotation']['y'] = Math['PI'] / 2,
           g['right']['position']['set'](f['params']['width'] / 2 / units, f['params']['thickness'] / units, h[
             'offset_front'] / units / 2),
           g['left'] = new Cornice({
             'model': h['model'],
             'width': f['params']['height'] + h['offset_front']
           }),
           g['left']['rotation']['y'] = -Math['PI'] / 2,
           g['left']['position']['set'](-f['params']['width'] / 2 / units, f['params']['thickness'] / units, h[
             'offset_front'] / units / 2),
           g['front_corner_right'] = new Cornice({
             'model': h['corner_model']
           }),
           g['front_corner_right']['position']['set'](f['params']['width'] / 2 / units, f['params']['thickness'] /
             units, f['params']['height'] / units / 2 + h['offset_front'] / units),
           g['front_corner_left'] = new Cornice({
             'model': h['corner_model']
           }),
           g['front_corner_left']['rotation']['y'] = -Math['PI'] / 2,
           g['front_corner_left']['position']['set'](-f['params']['width'] / 2 / units, f['params']['thickness'] /
             units, f['params']['height'] / units / 2 + h['offset_front'] / units),
           g['front']['visible'] = h['visible']['front'],
           g['left']['visible'] = h['visible']['left'],
           g['front_corner_left']['visible'] = h['visible']['left'],
           g['right']['visible'] = h['visible']['right'],
           g['front_corner_right']['visible'] = h['visible']['right'],
           g['add'](g['front']),
           g['add'](g['right']),
           g['add'](g['left']),
           g['add'](g['front_corner_right']),
           g['add'](g['front_corner_left'])),
         'corner' === this['params']['class'] && ('left' === f['params']['orientation'] ? (g['front'] = new Cornice({
               'model': h['model'],
               'width': f['params']['width'] - (f['params']['height'] - f['params']['thickness'])
             }),
             g['front']['position']['set'](f['params']['width'] / units / 2 - g['front']['params']['width'] / units /
               2, f['params']['thickness'] / units, f['params']['height'] / units / 2),
             j = Math['sqrt'](Math['pow'](f['params']['height'], 2) + Math['pow'](f['params']['height'], 2)),
             g['left'] = new Cornice({
               'model': h['model'],
               'width': j
             }),
             g['left']['rotation']['y'] = -Math['PI'] / 4,
             g['left']['position']['set'](-1 * (f['params']['width'] - (f['params']['height'] - f['params'][
               'thickness'
             ])) / units / 2, f['params']['thickness'] / units, (f['params']['height'] - (f['params']['height'] - f[
               'params']['thickness'])) / units / 2),
             g['front_corner_left'] = new Cornice({
               'model': h['corner_model_45']
             }),
             g['front_corner_left']['rotation']['y'] = -Math['PI'] / 4,
             g['front_corner_left']['position']['set'](f['params']['width'] / units / 2 - g['front']['params'][
               'width'] / units, f['params']['thickness'] / units, f['params']['height'] / units / 2),
             g['right'] = new Cornice({
               'model': h['model'],
               'width': f['params']['height']
             }),
             g['right']['rotation']['y'] = Math['PI'] / 2,
             g['right']['position']['set'](f['params']['width'] / 2 / units, f['params']['thickness'] / units, 0),
             g['front_corner_right'] = new Cornice({
               'model': h['corner_model']
             }),
             g['front_corner_right']['rotation']['y'] = 0,
             g['front_corner_right']['position']['set'](f['params']['width'] / 2 / units, f['params']['thickness'] /
               units, f['params']['height'] / units / 2),
             g['front']['visible'] = h['visible']['front'],
             g['left']['visible'] = h['visible']['left'],
             g['front_corner_left']['visible'] = h['visible']['left'],
             g['right']['visible'] = h['visible']['right'],
             g['front_corner_right']['visible'] = h['visible']['right']) : (g['front'] = new Cornice({
               'model': h['model'],
               'width': f['params']['width'] - (f['params']['height'] - f['params']['thickness'])
             }),
             'right' === f['params']['orientation'] ? g['front']['position']['set'](-f['params']['width'] / units /
               2 + g['front']['params']['width'] / units / 2, f['params']['thickness'] / units, g['front'][
                 'position'
               ]['z'] = f['params']['height'] / units / 2) : g['front']['position']['set'](f['params']['width'] /
               units / 2 - g['front']['params']['width'] / units / 2, f['params']['thickness'] / units, g['front'][
                 'position'
               ]['z'] = f['params']['height'] / units / 2),
             j = Math['sqrt'](Math['pow'](f['params']['height'], 2) + Math['pow'](f['params']['height'], 2)),
             g['right'] = new Cornice({
               'model': h['model'],
               'width': j
             }),
             g['right']['rotation']['y'] = Math['PI'] / 4,
             g['right']['position']['set']((f['params']['width'] - (f['params']['height'] - f['params']['thickness'])) /
               units / 2, f['params']['thickness'] / units, (f['params']['height'] - (f['params']['height'] - f[
                 'params']['thickness'])) / units / 2),
             g['front_corner_right'] = new Cornice({
               'model': h['corner_model_45']
             }),
             g['front_corner_right']['rotation']['y'] = 0,
             g['front_corner_right']['position']['set'](-f['params']['width'] / units / 2 + g['front']['params'][
               'width'
             ] / units, f['params']['thickness'] / units, f['params']['height'] / units / 2),
             g['left'] = new Cornice({
               'model': h['model'],
               'width': f['params']['height']
             }),
             g['left']['rotation']['y'] = -Math['PI'] / 2,
             g['left']['position']['set'](-f['params']['width'] / 2 / units, f['params']['thickness'] / units, 0),
             g['front_corner_left'] = new Cornice({
               'model': h['corner_model']
             }),
             g['front_corner_left']['rotation']['y'] = -Math['PI'] / 2,
             g['front_corner_left']['position']['set'](-f['params']['width'] / 2 / units, f['params']['thickness'] /
               units, f['params']['height'] / units / 2),
             g['front']['visible'] = h['visible']['front'],
             g['right']['visible'] = h['visible']['right'],
             g['front_corner_right']['visible'] = h['visible']['right'],
             g['left']['visible'] = h['visible']['left'],
             g['front_corner_left']['visible'] = h['visible']['left']),
           g['add'](g['front']),
           g['add'](g['right']),
           g['add'](g['left']),
           g['add'](g['front_corner_right']),
           g['add'](g['front_corner_left'])),
         'half_rounded' === this['params']['class'] && ('left' === f['params']['orientation'] ? (g['front'] =
           new Cornice({
             'model': h['model'],
             'width': f['params']['width'] - 300
           }),
           g['front']['position']['set'](300 / units / 2, f['params']['thickness'] / units, f['params'][
             'height'] / units / 2 + h['offset_front'] / units),
           g['front_corner_left'] = new Cornice({
             'model': h['radius_model']
           }),
           g['front_corner_left']['position']['set'](-f['params']['width'] / units / 2, f['params']['thickness'] /
             units, f['params']['height'] / units / 2 - 0.1),
           g['front_corner_left']['rotation']['y'] = -Math['PI'] / 2,
           g['front_corner_right'] = new Cornice({
             'model': h['corner_model']
           }),
           g['front_corner_right']['position']['set'](f['params']['width'] / 2 / units, f['params']['thickness'] /
             units, f['params']['height'] / units / 2 + h['offset_front'] / units),
           g['right'] = new Cornice({
             'model': h['model'],
             'width': f['params']['height'] + h['offset_front']
           }),
           g['right']['rotation']['y'] = Math['PI'] / 2,
           g['right']['position']['set'](f['params']['width'] / 2 / units, f['params']['thickness'] / units, h[
             'offset_front'] / units / 2),
           g['left'] = new Cornice({
             'model': h['model'],
             'width': f['params']['height'] - 300
           }),
           g['left']['rotation']['y'] = -Math['PI'] / 2,
           g['left']['position']['set'](-f['params']['width'] / 2 / units, f['params']['thickness'] / units, h[
             'offset_front'] / units / 2 - 300 / units / 2),
           g['front']['visible'] = h['visible']['front'],
           g['front_corner_left']['visible'] = h['visible']['front'],
           g['right']['visible'] = h['visible']['right'],
           g['left']['visible'] = h['visible']['left'],
           g['front_corner_right']['visible'] = h['visible']['right'],
           g['add'](g['front']),
           g['add'](g['right']),
           g['add'](g['front_corner_left']),
           g['add'](g['left']),
           g['add'](g['front_corner_right']),
           g['add'](g['back_corner_right'])) : (g['front'] = new Cornice({
             'model': h['model'],
             'width': f['params']['width'] - 300
           }),
           g['front']['position']['set'](0 - 300 / units / 2, f['params']['thickness'] / units, f['params'][
             'height'
           ] / units / 2 + h['offset_front'] / units),
           g['front_corner_right'] = new Cornice({
             'model': h['radius_model']
           }),
           g['front_corner_right']['position']['set'](f['params']['width'] / units / 2, f['params']['thickness'] /
             units, f['params']['height'] / units / 2 - 0.1),
           g['front_corner_left'] = new Cornice({
             'model': h['corner_model']
           }),
           g['front_corner_left']['rotation']['y'] = -Math['PI'] / 2,
           g['front_corner_left']['position']['set'](-f['params']['width'] / 2 / units, f['params']['thickness'] /
             units, f['params']['height'] / units / 2 + h['offset_front'] / units),
           g['left'] = new Cornice({
             'model': h['model'],
             'width': f['params']['height'] + h['offset_front']
           }),
           g['left']['rotation']['y'] = -Math['PI'] / 2,
           g['left']['position']['set'](-f['params']['width'] / 2 / units, f['params']['thickness'] / units, h[
             'offset_front'] / units / 2),
           g['right'] = new Cornice({
             'model': h['model'],
             'width': f['params']['height'] - 300
           }),
           g['right']['rotation']['y'] = Math['PI'] / 2,
           g['right']['position']['set'](f['params']['width'] / 2 / units, f['params']['thickness'] / units, h[
             'offset_front'] / units / 2 - 300 / units / 2),
           g['front']['visible'] = h['visible']['front'],
           g['left']['visible'] = h['visible']['left'],
           g['front_corner_left']['visible'] = h['visible']['left'],
           g['front_corner_right']['visible'] = h['visible']['front'],
           g['right']['visible'] = h['visible']['right'],
           g['add'](g['front']),
           g['add'](g['front_corner_right']),
           g['add'](g['left']),
           g['add'](g['right']),
           g['add'](g['front_corner_left']))),
         'half_rounded_double' === this['params']['class'] && (g['front'] = new Cornice({
             'model': h['model'],
             'width': f['params']['width'] - 600
           }),
           g['front']['position']['set'](0, f['params']['thickness'] / units, f['params']['height'] / units / 2 + h[
             'offset_front'] / units),
           g['front_corner_left'] = new Cornice({
             'model': h['radius_model']
           }),
           g['front_corner_left']['position']['set'](-f['params']['width'] / units / 2, f['params']['thickness'] /
             units, f['params']['height'] / units / 2 - 0.1),
           g['front_corner_left']['rotation']['y'] = -Math['PI'] / 2,
           g['front_corner_right'] = new Cornice({
             'model': h['radius_model']
           }),
           g['front_corner_right']['position']['set'](f['params']['width'] / units / 2, f['params']['thickness'] /
             units, f['params']['height'] / units / 2 - 0.1),
           g['left'] = new Cornice({
             'model': h['model'],
             'width': f['params']['height'] - 300
           }),
           g['left']['rotation']['y'] = -Math['PI'] / 2,
           g['left']['position']['set'](-f['params']['width'] / 2 / units, f['params']['thickness'] / units, h[
             'offset_front'] / units / 2 - 300 / units / 2),
           g['right'] = new Cornice({
             'model': h['model'],
             'width': f['params']['height'] - 300
           }),
           g['right']['rotation']['y'] = Math['PI'] / 2,
           g['right']['position']['set'](f['params']['width'] / 2 / units, f['params']['thickness'] / units, h[
             'offset_front'] / units / 2 - 300 / units / 2),
           g['front']['visible'] = h['visible']['front'],
           g['front_corner_left']['visible'] = h['visible']['front'],
           g['front_corner_right']['visible'] = h['visible']['front'],
           g['left']['visible'] = h['visible']['left'],
           g['right']['visible'] = h['visible']['right'],
           g['add'](g['front']),
           g['add'](g['front_corner_right']),
           g['add'](g['front_corner_left']),
           g['add'](g['left']),
           g['add'](g['right'])),
         'corner_double' === this['params']['class']) && (g['front'] = new Cornice({
           'model': h['model'],
           'width': f['params']['width'] - 2 * (f['params']['height'] - f['params']['thickness'])
         }),
         g['front']['position']['set'](0, f['params']['thickness'] / units, f['params']['height'] / units / 2),
         j = Math['sqrt'](Math['pow'](f['params']['height'], 2) + Math['pow'](f['params']['height'], 2)),
         g['left'] = new Cornice({
           'model': h['model'],
           'width': j
         }),
         g['left']['rotation']['y'] = -Math['PI'] / 4,
         g['left']['position']['set'](-1 * (f['params']['width'] - (f['params']['height'] - f['params'][
           'thickness'])) / units / 2, f['params']['thickness'] / units, (f['params']['height'] - (f['params'][
             'height'
           ] - f['params']['thickness'])) / units / 2),
         g['front_corner_left'] = new Cornice({
           'model': h['corner_model_45']
         }),
         g['front_corner_left']['rotation']['y'] = -Math['PI'] / 4,
         g['front_corner_left']['position']['set'](-f['params']['width'] / units / 2 + (f['params']['height'] - f[
           'params']['thickness']) / units, f['params']['thickness'] / units, f['params']['height'] / units / 2),
         g['right'] = new Cornice({
           'model': h['model'],
           'width': j
         }),
         g['right']['rotation']['y'] = Math['PI'] / 4,
         g['right']['position']['set']((f['params']['width'] - (f['params']['height'] - f['params']['thickness'])) /
           units / 2, f['params']['thickness'] / units, (f['params']['height'] - (f['params']['height'] - f['params'][
             'thickness'
           ])) / units / 2),
         g['front_corner_right'] = new Cornice({
           'model': h['corner_model_45']
         }),
         g['front_corner_right']['rotation']['y'] = 0,
         g['front_corner_right']['position']['set'](f['params']['width'] / units / 2 - (f['params']['height'] - f[
           'params']['thickness']) / units, f['params']['thickness'] / units, f['params']['height'] / units / 2),
         g['front']['visible'] = h['visible']['front'],
         g['left']['visible'] = h['visible']['left'],
         g['front_corner_left']['visible'] = h['visible']['left'],
         g['right']['visible'] = h['visible']['right'],
         g['front_corner_right']['visible'] = h['visible']['right'],
         g['add'](g['front']),
         g['add'](g['right']),
         g['add'](g['left']),
         g['add'](g['front_corner_right']),
         g['add'](g['front_corner_left']));
   },
   Shelve_new['prototype']['build_sizes'] = function() {
     this['reset_model'](this['sizes']),
       this['size_width'] = new Sizes_obj({
         'width': this['params']['width'] / units,
         'text': this['params']['width'],
         'font_size': 50
       }),
       'vertical' === this['params']['vertical_orientation'] ? (this['size_width']['rotation']['z'] = Math['PI'] / 2,
         this['size_width']['position']['set'](0, this['params']['width'] / units / 2, -this['params']['height'] /
           units / 2 + 0.4)) : this['size_width']['position']['set'](0, this['params']['thickness'] / units, -this[
         'params']['height'] / units / 2 + 0.4),
       this['sizes']['add'](this['size_width']),
       this['sizes']['visible'] = global_options['sizes_visible'];
   },
   Shelve_new['prototype']['set_size_by_number'] = function(f, g, h) {
     var j = {
       'type': 'build',
       'from': copy_object(this['params']),
       'object': this
     };
     this['params']['width'] = f,
       this['params']['height'] = g,
       this['params']['thickness'] = h,
       j['to'] = copy_object(this['params']),
       add_undo_action(j),
       this['build']();
   },
   Shelve_new['prototype']['change_corpus_material'] = function(e) {
     this['params']['material'] = e,
       this['model']['shelve']['change_material'](e),
       global_update(),
       sc['get_price']();
   },
   Shelve_new['prototype']['change_cornice_material'] = function(e) {
     if ('bottom' !== e['group']) {
       var f = e['id'];
       for (let g = 0; g < this['cornice']['children']['length']; g++)
         this['cornice']['children'][g]['change_material'](f),
         this['params']['cornice']['material'] = f;
     }
   },
   Shelve_new['prototype']['show_radial_menu'] = function(f, g) {
     var h = this,
       j = {
         'sizes': true,
         'rotate_buttons': true,
         'copy_button': true,
         'material': true,
         'material_facade': false,
         'material_corpus': false
       };
     project_settings['available_selection'] && 0 == project_settings['available_selection'][
         'allow_corpus_materials_select'
       ] && (j['material'] = false),
       pp['interface']['root']['radial']({
         'obj_type': this['type'],
         'obj': j,
         'left': f,
         'top': g
       });
   },
   Shelve_new['prototype']['set_cornice_active'] = function(f) {
     let g = this;
     var h = {
       'front': this['params']['cornice']['visible']['front'],
       'left': this['params']['cornice']['visible']['left'],
       'right': this['params']['cornice']['visible']['right']
     };
     Object['keys'](f)['forEach'](function(j) {
         g['params']['cornice']['visible'][j] = f[j];
       }),
       this['build_cornice'](),
       add_undo_action({
         'type': 'cornice_active',
         'object': this,
         'from': h,
         'to': f
       }),
       get_total_price_test(),
       global_update();
   },
   Shelve_new['prototype']['get_price'] = function() {
     return 1 == constructor_settings['shop_mode'] ? 0 : (this['params']['price'] = this['get_price_specs'](),
       this['params']['price']);
   },
   Shelve_new['prototype']['copypaste'] = function() {
     var e = new Shelve_new(JSON['parse'](JSON['stringify'](this['params'])));
     room['add'](e),
       room['active_objects']['push'](e),
       d_objects.push(e),
       e['position']['copy'](this['position']),
       e['rotation']['copy'](this['rotation']),
       0 === e['rotation']['y'] && (e['position']['x'] += e['params']['width'] / units),
       e['rotation']['y'] === Math['PI'] && (e['position']['x'] -= e['params']['width'] / units),
       e['rotation']['y'] === Math['PI'] / 2 && (e['position']['z'] -= e['params']['width'] / units),
       e['rotation']['y'] === -Math['PI'] / 2 && (e['position']['z'] += e['params']['width'] / units),
       add_undo_action({
         'type': 'copy',
         'object': e
       }),
       setTimeout(function() {
         get_total_price_test();
       }, 200);
   },
   Shelve_new['prototype']['get_specs'] = function(f) {
     var g = copy_object(specs_result),
       h = {
         'id': 0,
         'm2': 0,
         'pm': 0
       };
     return h['m2'] = parseFloat((this['params']['width'] / 1000 * this['params']['height'] / 1000)['toFixed'](2)),
       h['pm'] = this['params']['width'] / 1000,
       h['id'] = this['params']['material'],
       h['width'] = this['params']['width'],
       h['height'] = this['params']['height'],
       h['thickness'] = this['params']['thickness'],
       g['shelves']['push'](h),
       f ? convert_specs(g) : g;
   },
   Shelve_new['prototype']['get_price_specs'] = function() {
     let e = this,
       f = this['get_specs'](true),
       g = 0,
       i = {};
     return Object['keys'](f['shelves'])['length'] && (i['corpus'] = [],
         Object['keys'](f['shelves'][e['params']['thickness']])['forEach'](function(j) {
           let k = get_material_by_id(j);
           k = k || get_material_by_id(0);
           let l, m = false;
           if (l = prices['v2'] ? (m = true,
               prices['corpus'][parseInt(e['params']['thickness'])]) : prices['corpus']) {
             var p = objectFindByKey(l, 'id', k['category']);
             if (p) {
               let q;
               var p = (q = (1 != m && 0 != p['get_from_parent'] && null != p['get_from_parent'] ?
                 objectFindByKey(l, 'id', p['parent']) : p)['price']) * f['shelves'][e['params']['thickness']][j][
                 'm2'
               ];
               i['corpus']['push'](get_desc_arr(f['shelves'][e['params']['thickness']][j], p, q, e['params'][
                   'thickness'
                 ])),
                 g += p;
             }
           }
         })),
       this['price_description'] = i,
       g *= constructor_settings['price_modificator'];
   };
 class Sizes_obj extends THREE['Group'] {
   constructor(f) {
     super(f);
     var g = this;
     this['type'] = 'Sizes_obj',
       g['params'] = {
         'width': void 0 !== (f = f || {})['width'] ? f['width'] : 100,
         'length': void 0 !== f.length ? f.length : 115 / units,
         'middle_line_position': void 0 !== f['middle_line_position'] ? f['middle_line_position'] : 100 / units,
         'line_thickness': void 0 !== f['line_thickness'] ? f['line_thickness'] : 1 / units,
         'arrows': void 0 !== f['arrows'] ? f['arrows'] : 1,
         'arrow_width': void 0 !== f['arrow_width'] ? f['arrow_width'] : 60 / units,
         'arrow_height': void 0 !== f['arrow_height'] ? f['arrow_height'] : 20 / units,
         'text': void 0 !== f['text'] ? f['text'] : '100',
         'wrong': void 0 !== f['wrong'] ? f['wrong'] : 0,
         'use_css2d': void 0 !== f['use_css2d'] ? f['use_css2d'] : 0,
         'text_scale': void 0 !== f['text_scale'] ? f['text_scale'] : 1,
         'css_mode': void 0 !== f['css_mode'] ? f['css_mode'] : 0,
         'arrow_scale': void 0 !== f['arrow_scale'] ? f['arrow_scale'] : 1,
         'axis': void 0 !== f['axis'] ? f['axis'] : 'x'
       },
       this['userData']['childrenRenderable'] = false,
       g['build']();
   }
   async ['build']() {
       null == pp['assets']['sizes']['num_font'] && await preload_font();
       var f = this;
       if (f['reset'](),
         0 != f['params']['width'] && 0 != f['params']['height']) {
         let x = black_material;
         f['params']['wrong'] && (x = red_mat),
           f['left_line'] = new THREE['Mesh'](new THREE['PlaneBufferGeometry'](f['params']['line_thickness'], f[
             'params']['length']), x),
           f['left_line']['userData']['mouse_events'] = false,
           f['right_line'] = f['left_line']['clone'](),
           f['right_line']['userData']['mouse_events'] = false;
         var g = f['params']['arrow_width'] / 2;
         f['params']['arrows'],
           f['middle_line'] = new THREE['Mesh'](new THREE['PlaneBufferGeometry'](f['params']['width'] - f['params'][
             'line_thickness'
           ], f['params']['line_thickness']), x),
           f['middle_line']['userData']['mouse_events'] = false,
           f['left_line']['position']['set'](-f['params']['width'] / 2 + f['params']['line_thickness'] / 2, f[
             'params']['length'] / 2, 0),
           f['right_line']['position']['set'](f['params']['width'] / 2 - f['params']['line_thickness'] / 2, f[
             'params']['length'] / 2, 0),
           f['middle_line']['position']['set'](0, f['params']['middle_line_position'], 0),
           !f['params']['use_css2d'] && isNaN(f['params']['text']) && (f['params']['text'] = ''),
           f['params']['arrows'] && !f['params']['use_css2d'] && (f['left_arrow'] = make_arr(pp['assets']['sizes'][
               'left_arrow'
             ], x),
             f['left_arrow']['userData']['mouse_events'] = false,
             f['left_arrow']['position']['set'](-f['params']['width'] / 2 + f['params']['arrow_width'] / 2 * f[
               'params']['arrow_scale'], f['params']['middle_line_position'], 0),
             f['right_arrow'] = make_arr(pp['assets']['sizes']['right_arrow'], x),
             f['right_arrow']['userData']['mouse_events'] = false,
             f['right_arrow']['position']['set'](f['params']['width'] / 2 - f['params']['arrow_width'] / 2 * f[
               'params']['arrow_scale'], f['params']['middle_line_position'], 0),
             f['left_arrow']['scale']['set'](f['params']['arrow_scale'], f['params']['arrow_scale'], 1),
             f['right_arrow']['scale']['set'](f['params']['arrow_scale'], f['params']['arrow_scale'], 1),
             f['add'](f['left_arrow']),
             f['add'](f['right_arrow']));
         try {
           if (f['params']['use_css2d'] && !f['params']['css_mode']) {
             var h = make_css2d_dimension(f['params'], f['params']['axis'] || 'x'),
               j = new THREE['CSS2DObject'](h);
             j['position']['y'] = f['params']['middle_line_position'] + 30 / units,
               f['label'] = j,
               f['add'](j);
           } else {
             if (f['params']['use_css2d'] && 1 == f['params']['css_mode']) {
               var k = make_css2d_dimension_sizes(f['params'], f['params']['axis'] || 'x'),
                 m = new THREE['CSS2DObject'](k);
               'x' === f['params']['axis'] ? m['position']['y'] = f['params']['middle_line_position'] + (f['params'][
                   'length'
                 ] || 50) / 2 / units : 'y' === f['params']['axis'] && (m['position']['x'] = f['params'][
                   'width'] / 2 / units,
                   m['position']['y'] = f['params']['middle_line_position'] / 2),
                 m['element']['style']['transform'] = 'translate(-50%,\x20-50%)',
                 f['label'] = m,
                 f['add'](m);
             } else {
               var q = '' + f['params']['text'],
                 u = 40 * f['params']['text_scale'] / units,
                 v = u * (q.length + 1);
               let y = text_material;
               f['params']['wrong'] && (y = text_material_red);
               for (let z = 0; z < q.length; z++) {
                 var w = new THREE['Mesh'](global_font[parseInt(q[z])], y);
                 w['userData']['mouse_events'] = false,
                   w['scale']['set'](f['params']['text_scale'], f['params']['text_scale'], 0.0001),
                   f['add'](w),
                   w['position']['x'] = -v / 2 + u / 2 + z * u,
                   w['position']['y'] = f['params']['middle_line_position'] + 15 / units;
               }
               f['add'](f['left_line']),
                 f['add'](f['right_line']),
                 f['add'](f['middle_line']);
             }
           }
         } catch (A) {}
       }
     }
     ['reset']() {
       for (var f = this, g = f['children']['length'] - 1; 0 <= g; g--)
         f['remove'](f['children'][g]);
     }
     ['full_dispose']() {
       for (var f = this, g = f['children']['length'] - 1; 0 <= g; g--)
         f['children'][g]['geometry'] && f['children'][g]['geometry']['dispose'](),
         f['remove'](f['children'][g]);
       f['parent'] && f['parent']['remove'](f);
     }
 }
 let text_font;
 class Text_obj extends THREE['Group'] {
   constructor(f) {
     super(f);
     var g = this;
     this['type'] = 'Sizes_obj',
       g['params'] = {
         'width': void 0 !== (f = f || {})['width'] ? f['width'] : 55,
         'length': void 0 !== f.length ? f.length : 115 / units,
         'middle_line_position': void 0 !== f['middle_line_position'] ? f['middle_line_position'] : 100 / units,
         'line_thickness': void 0 !== f['line_thickness'] ? f['line_thickness'] : 1 / units,
         'arrow_width': void 0 !== f['arrow_width'] ? f['arrow_width'] : 60 / units,
         'arrow_height': void 0 !== f['arrow_height'] ? f['arrow_height'] : 20 / units,
         'text': void 0 !== f['text'] ? f['text'] : 'ASD',
         'font_size': void 0 !== f['font_size'] ? f['font_size'] : 50,
         'wrong': void 0 !== f['wrong'] ? f['wrong'] : 0
       },
       this['userData']['childrenRenderable'] = false,
       g['build']();
   }
   async ['build']() {
       null == text_font && (text_font = await load_text_font());
       var f = this;
       if (f['reset'](),
         0 != f['params']['width'] && 0 != f['params']['height']) {
         let l = black_material;
         f['params']['wrong'] && (l = red_mat),
           f['left_line'] = new THREE['Mesh'](new THREE['PlaneBufferGeometry'](f['params']['line_thickness'], f[
             'params']['length']), l),
           f['right_line'] = f['left_line']['clone'](),
           f['middle_line'] = new THREE['Mesh'](new THREE['PlaneBufferGeometry'](f['params']['width'] - f['params'][
             'line_thickness'
           ] - f['params']['arrow_width'] / 2, f['params']['line_thickness']), l),
           f['left_line']['position']['set'](-f['params']['width'] / 2 + f['params']['line_thickness'] / 2, f[
             'params']['length'] / 2, 0),
           f['right_line']['position']['set'](f['params']['width'] / 2 - f['params']['line_thickness'] / 2, f[
             'params']['length'] / 2, 0),
           f['middle_line']['position']['set'](0, f['params']['middle_line_position'], 0),
           f['left_arrow'] = make_arr(pp['assets']['sizes']['left_arrow'], l),
           f['left_arrow']['position']['set'](-f['params']['width'] / 2 + f['params']['arrow_width'] / 2, f[
             'params']['middle_line_position'], 0),
           f['right_arrow'] = make_arr(pp['assets']['sizes']['right_arrow'], l),
           f['right_arrow']['position']['set'](f['params']['width'] / 2 - f['params']['arrow_width'] / 2, f[
             'params']['middle_line_position'], 0);
         try {
           var g = new THREE['TextGeometry']('' + f['params']['text'], {
             'font': text_font,
             'size': f['params']['font_size'] / units,
             'weight': 'bold',
             'height': 0,
             'curveSegments': 1
           });
           if (THREE['REVISION'] < 125) {
             for (var h in g['faces'])
               g['faces'][h]['normal'] && 0 < g['faces'][h]['normal']['z'] && (g['faces'][h]['materialIndex'] =
               1);
             let m = text_material;
             this['params']['wrong'] && (m = text_material_red),
               f['text'] = new THREE['Mesh'](new THREE['BufferGeometry']()['fromGeometry'](g), m);
           } else {
             var j = copy_object(g['groups']);
             g['clearGroups']();
             for (let o = 0; o < j.length; o++)
               0 == j[o]['materialIndex'] && g['addGroup'](j[o]['start'] + j[o]['count'] / 2, j[o]['count'] / 2,
                 1);
             let n = text_material;
             this['params']['wrong'] && (n = text_material_red),
               f['text'] = new THREE['Mesh'](g, n);
           }
           f['text']['name'] = 'text';
           var k = new THREE['Box3']()['setFromObject'](f['text']);
           f['text']['position']['set'](-k['getSize'](new THREE['Vector3']())['x'] / 2, f['params'][
               'middle_line_position'
             ] + 15 / units, 0),
             f['add'](f['text']);
         } catch (p) {}
         f['add'](f['left_line']),
           f['add'](f['right_line']),
           f['add'](f['middle_line']),
           f['add'](f['left_arrow']),
           f['add'](f['right_arrow']);
       }
     }
     ['reset']() {
       for (var f = this, g = f['children']['length'] - 1; 0 <= g; g--)
         f['remove'](f['children'][g]);
     }
     ['full_dispose']() {
       for (var f = this, g = f['children']['length'] - 1; 0 <= g; g--)
         f['children'][g]['geometry']['dispose'](),
         f['remove'](f['children'][g]);
       f['parent'] && f['parent']['remove'](f);
     }
 }
 var black_material = new THREE['MeshBasicMaterial']({
     'color': '#000000'
   }),
   black_line_material = new THREE['LineBasicMaterial']({
     'color': '#000000'
   }),
   red_line_material = new THREE['LineBasicMaterial']({
     'color': '#ff0000'
   }),
   text_material = [new THREE['MeshBasicMaterial']({
     'color': '#000000',
     'side': THREE['BackSide']
   }), black_material],
   text_material_red = [new THREE['MeshBasicMaterial']({
     'color': '#880000',
     'side': THREE['BackSide']
   }), red_mat];

 function make_arr(f, g) {
   return new THREE['Mesh'](f, g);
 }

 function make_arrow(f, g, h) {
   var j = new THREE['BufferGeometry']();
   let k;
   var l = f / 2,
     m = g / 2;
   switch (h = h || 'left') {
     case 'left':
       k = new Float32Array([-l, 0, 0, l, -m, 0, l, m, 0]);
       break;
     case 'right':
       k = new Float32Array([-l, -m, 0, l, 0, 0, -l, m, 0]);
       break;
     case 'top':
       k = new Float32Array([-l, -m, 0, l, 0, 0, -l, m, 0]);
       break;
     case 'bottom':
       k = new Float32Array([-l, 0, 0, l, -m, 0, l, m, 0]);
       break;
   }
   return j['setAttribute']('position', new THREE['BufferAttribute'](k, 3)),
     j;
 }

 function preload_arrows() {
   return pp['assets']['sizes']['left_arrow'] = make_arrow(60 / units, 20 / units, 'left'),
     pp['assets']['sizes']['right_arrow'] = make_arrow(60 / units, 20 / units, 'right'),
     pp['assets']['sizes']['left_arrow_w'] = make_arrow(60 / units, 20 / units, 'left', red_mat),
     pp['assets']['sizes']['right_arrow_w'] = make_arrow(60 / units, 20 / units, 'right', red_mat),
     true;
 }
 async function preload_font() {
   null == pp['assets']['sizes']['num_font'] && (pp['assets']['sizes']['num_font'] = await load_sizes_font());
   for (let h = 0; h < 10; h++) {
     let i = new THREE['TextGeometry']('' + h, {
       'font': pp['assets']['sizes']['num_font'],
       'size': global_options['font_size'] / units,
       'weight': 'bold',
       'height': 0,
       'curveSegments': 1
     });
     if (THREE['REVISION'] < 125) {
       for (var f in i['faces'])
         i['faces'][f]['normal'] && 0 < i['faces'][f]['normal']['z'] && (i['faces'][f]['materialIndex'] = 1);
       i = new THREE['BufferGeometry']()['fromGeometry'](i);
     } else {
       var g = copy_object(i['groups']);
       i['clearGroups']();
       for (let j = 0; j < g.length; j++)
         0 == g[j]['materialIndex'] && i['addGroup'](g[j]['start'] + g[j]['count'] / 2, g[j]['count'] / 2, 1);
     }
     global_font.push(i);
   }
 }
 async function load_sizes_font() {
   return new Promise(function(f, g) {
     new THREE['FontLoader']()['load']('/common_assets/fonts/droid_sans_regular.json', function(h) {
       f(h);
     });
   });
 }
 async function load_text_font() {
   return new Promise(function(f, g) {
     new THREE['FontLoader']()['load']('/common_assets/fonts/roboto_i.json', function(h) {
       f(h);
     });
   });
 }
 class Ruler_obj extends THREE['Group'] {
   constructor(f) {
       super(f),
         this['type'] = 'Ruler_obj',
         this['temp_type'] = 'Ruler_obj',
         f = f || {},
         this['userData']['model'] = new THREE['Group'](),
         this['userData']['model']['name'] = 'model',
         this['add'](this['userData']['model']),
         this['userData']['computed'] = {},
         this['params'] = {
           'points': f['points'],
           'depth': void 0 === f['depth'] || f['depth']
         },
         this['userData']['params'] = this['params'],
         this['userData']['childrenRenderable'] = false,
         this['userData']['computed']['points'] = {
           'p1': f['p1'],
           'p2': f['p2']
         },
         this['compute'](),
         this['build']();
     }
     ['compute']() {
       var f = this['userData']['computed']['points']['p1'],
         g = this['userData']['computed']['points']['p2'];
       this['userData']['computed']['vectors'] = {
           'v1': f,
           'v2': g
         },
         this['params']['text'] = Math['round'](f['distanceTo'](g) * units) + '\x20' + lang['mm'],
         this['userData']['center'] = g['clone']()['add'](f)['divideScalar'](2);
     }
     ['build']() {
       if (this['reset'](),
         0 != this['params']['width'] && 0 != this['params']['height']) {
         let g = misc_mats['ruler_line'];
         0 == this['params']['depth'] && (g = misc_mats['depth_line']);
         var f = new THREE['Line'](new THREE['BufferGeometry']()['setFromPoints']([this['userData']['computed'][
             'vectors'
           ]['v1'], this['userData']['computed']['vectors']['v2']]), g),
           f = ((f['userData']['parent'] = this)['userData']['model']['add'](f),
             document['createElement']('div')),
           f = (f['className'] = 'label',
             f['textContent'] = this['params']['text'],
             f['style']['backgroundColor'] = '#ffffff',
             f['style']['padding'] = '3px',
             new THREE['CSS2DObject'](f));
         f['position']['copy'](this['userData']['center']),
           this['userData']['model']['add'](f),
           f['visible'] = 1 == project_settings['rulers_visible'],
           this['userData']['label'] = f;
       }
     }
     ['rebuild'](f) {
       this['userData']['computed']['points'] = {
           'p1': f['p1'],
           'p2': f['p2']
         },
         this['compute'](),
         this['build']();
     }
     ['hide']() {
       this['visible'] = false,
         this['userData']['label']['visible'] = false;
     }
     ['show']() {
       this['visible'] = true,
         this['userData']['label']['visible'] = true;
     }
     ['reset']() {
       for (let f = this['userData']['model']['children']['length']; f--;)
         this['userData']['model']['children'][f]['geometry'] && this['userData']['model']['children'][f]['geometry'][
           'dispose'
         ](),
         this['userData']['model']['remove'](this['userData']['model']['children'][f]);
     }
     ['full_dispose']() {
       for (var f = this, g = f['userData']['model']['children']['length'] - 1; 0 <= g; g--)
         f['userData']['model']['children'][g]['geometry'] && f['userData']['model']['children'][g]['geometry'][
           'dispose'
         ](),
         f['userData']['model']['remove'](f['userData']['model']['children'][g]);
       f['parent'] && f['parent']['remove'](f);
     }
 }

 function make_css2d_dimension(f, g) {
   var h = document['createElement']('div'),
     j = (h['className'] = 'dimension-label',
       h['style']['position'] = 'relative',
       document['createElement']('div')),
     k, l, m, l, m, l, m, k, l, g, m;
   return j['textContent'] = f['text'],
     j['style']['margin'] = '0\x204px',
     'x' === g && ((k = document['createElement']('div'))['style']['display'] = 'flex',
       k['style']['flexDirection'] = 'row',
       k['style']['alignItems'] = 'center',
       k['style']['justifyContent'] = 'center',
       (l = document['createElement']('div'))['style']['width'] = '0',
       l['style']['height'] = '0',
       l['style']['borderTop'] = '6px\x20solid\x20transparent',
       l['style']['borderBottom'] = '6px\x20solid\x20transparent',
       l['style']['borderRight'] = '10px\x20solid\x20black',
       l['style']['marginRight'] = '10px',
       (m = document['createElement']('div'))['style']['width'] = '0',
       m['style']['height'] = '0',
       m['style']['borderTop'] = '6px\x20solid\x20transparent',
       m['style']['borderBottom'] = '6px\x20solid\x20transparent',
       m['style']['borderLeft'] = '10px\x20solid\x20black',
       m['style']['marginLeft'] = '10px',
       k['appendChild'](l),
       k['appendChild'](j),
       k['appendChild'](m),
       m = (l = n => {
         var p = document['createElement']('div');
         return p['style']['position'] = 'absolute',
           p['style']['height'] = (f.length || 50) + 'px',
           p['style']['width'] = (f['line_thickness'] || 2) + 'px',
           p['style']['background'] = 'black',
           'left' === n ? (p['style']['top'] = '3px',
             p['style']['left'] = '0') : (p['style']['top'] = f.length / 2 - 3 + 'px',
             p['style']['right'] = '0'),
           p;
       })('left'),
       l = l('right'),
       h['appendChild'](m),
       h['appendChild'](k),
       h['appendChild'](l)),
     'y' === g && (h['style']['display'] = 'flex',
       h['style']['flexDirection'] = 'column',
       h['style']['alignItems'] = 'center',
       j['style']['marginLeft'] = '-7px',
       k = (m = () => {
         var n = document['createElement']('div');
         return n['style']['height'] = (f['line_thickness'] || 2) + 'px',
           n['style']['width'] = (f.length || 50) + 'px',
           n['style']['background'] = 'black',
           n;
       })(),
       l = m(),
       (g = document['createElement']('div'))['style']['width'] = '0',
       g['style']['height'] = '0',
       g['style']['borderLeft'] = '6px\x20solid\x20transparent',
       g['style']['borderRight'] = '6px\x20solid\x20transparent',
       g['style']['borderBottom'] = '10px\x20solid\x20black',
       g['style']['marginBottom'] = '10px',
       (m = document['createElement']('div'))['style']['width'] = '0',
       m['style']['height'] = '0',
       m['style']['borderLeft'] = '6px\x20solid\x20transparent',
       m['style']['borderRight'] = '6px\x20solid\x20transparent',
       m['style']['borderTop'] = '10px\x20solid\x20black',
       m['style']['marginTop'] = '10px',
       h['appendChild'](k),
       h['appendChild'](g),
       h['appendChild'](j),
       h['appendChild'](m),
       h['appendChild'](l)),
     h;
 }
 let redo_list = [],
   undo_list = [],
   tmp_wp_kost = true,
   tmp_facmat_kost = true,
   tmp_edges_kost = true,
   tmp_trans_edges_kost = true;

 function undo_action() {
   if (undo_list.length) {
     var f = undo_list[0];
     if ('edges_mode' === f['type'] && (tmp_edges_kost = false,
         $('#mode_button')['click'](),
         tmp_edges_kost = true),
       'transparent_edges' === f['type'] && (tmp_trans_edges_kost = false,
         $('#transparent_edges_mode')['click'](),
         tmp_trans_edges_kost = true),
       'change_walls_material' === f['type'] && ($('.walls_material_select\x20.mat_wrapper.selected')['removeClass'](
           'selected'),
         change_walls_material(f['from'], true),
         $('.walls_material_select\x20.mat_wrapper[data-id=\x22' + f['from'] + '\x22]')['addClass']('selected')),
       'set_material_floor' === f['type'] && ($('.floor_material_select\x20.mat_wrapper.selected')['removeClass'](
           'selected'),
         room['set_material_floor'](f['from'], true),
         $('.floor_material_select\x20.mat_wrapper[data-id=\x22' + f['from'] + '\x22]')['addClass']('selected')),
       'room_size' === f['type'] && (room['set_size'](f['from']['width'], f['from']['height'], f['from']['depth']),
         $('#room_width')['val'](f['from']['width']),
         $('#room_height')['val'](f['from']['height']),
         $('#room_depth')['val'](f['from']['depth'])),
       'cornice_all' === f['type'] && (change_cornice_active(f['from'], true),
         $('#cornice_active')['prop']('checked', f['from'])),
       'cokol_top_all' === f['type'] && sc['set_cokol_top_all'](f['from'], true),
       'cokol_active' === f['type'] && ($('#is_cokol_active')['prop']('checked', !f['from']),
         change_cokol_active(f['from'])),
       'project_settings' === f['type']) {
       change_wall_panel_height(f['from']['wall_panel_height']),
         $('#settings_wall_panel_height')['val'](f['from']['wall_panel_height']),
         project_settings['is_facades_system'] || (change_cokol_height(f['from']['cokol_height']),
           $('#settings_cokol_height')['val'](f['from']['cokol_height'])),
         change_tabletop_thickness(f['from']['tabletop_thickness']),
         $('#settings_tabletop_thickness')['val'](f['from']['tabletop_thickness']);
       for (var g = room['active_objects']['length'] - 1; 0 <= g; g--)
         'Bardesk' === room['active_objects'][g]['type'] && room['active_objects'][g]['check_wall_panel']();
     }
     if ('move' === f['type'] && (f['object']['position']['copy'](f['from']),
         f['object']['rotation']['copy'](f['rotation_from']),
         'function' == typeof f['object']['calculate_distances']() && f['object']['calculate_distances'](),
         'function' == typeof f['object']['build_from_wall_sizes']) && f['object']['build_from_wall_sizes'](),
       'rotation' === f['type'] && f['object']['rotation']['copy'](f['from']),
       'move_and_create' === f['type'] && f['object']['delete'](),
       'copy' === f['type'] && f['object']['delete'](),
       'build' === f['type'] && (f['object']['params'] = f['from'],
         f['object']['build'](),
         'function' == typeof f['object']['load_model']) && f['object']['load_model'](),
       'comments' === f['type'] && (f['object']['params']['comments'] = f['from'],
         f['object']['build_comments']()),
       'change_facade_material' === f['type'] && f['object']['change_facade_material'](f['from']),
       'change_corpus_material' === f['type'] && f['object']['change_corpus_material'](f['from']),
       'change_glass_material' === f['type'] && f['object']['change_glass_material'](f['from']),
       'change_tabletop_material' === f['type'] && f['object']['change_tabletop_material'](f['from']),
       'change_opens' === f['type'] && (f['object']['params']['doors'] = f['from'],
         f['object']['build_doors']()),
       'change_facades_style' === f['type'] && (f['object']['params']['doors'] = f['from'],
         f['object']['build_doors']()),
       'hob' === f['type'] && (f['object']['params']['hob']['active'] = f['params'],
         f['object']['build_hob']()),
       'sink' === f['type'] && (f['object']['params']['sink']['active'] = f['params'],
         f['object']['build_washer']()),
       'cornice_active' === f['type'] && (f['object']['params']['cornice']['visible']['front'] = f['from']['front'],
         f['object']['params']['cornice']['visible']['left'] = f['from']['left'],
         f['object']['params']['cornice']['visible']['right'] = f['from']['right'],
         f['object']['build_cornice']()),
       'cokol_top_active' === f['type'] && (f['object']['params']['cokol_top']['front'] = f['from']['front'],
         f['object']['params']['cokol_top']['left'] = f['from']['left'],
         f['object']['params']['cokol_top']['right'] = f['from']['right'],
         f['object']['build_cokol_top']()),
       'model_resize' === f['type'] && (f['object']['params']['width'] = f['from']['width'],
         f['object']['params']['height'] = f['from']['height'],
         f['object']['params']['depth'] = f['from']['depth'],
         f['object']['set_size']()),
       'set_shaft_size' === f['type'] && f['object']['set_size'](f['from']['width'], f['from']['height'], f['from'][
         'depth'
       ], false),
       'change_facades_style_all' === f['type'] && (change_facade_style(f['to'], f['top'], f['bottom'], true),
         f['top'] && ($('.change_top_facade_style.selected')['removeClass']('selected'),
           $('.change_top_facade_style[data-id=\x22' + f['to'] + '\x22]')['addClass']('selected'),
           project_settings['selected_materials']['top']['facades'] !== f['material_top']) &&
         change_facade_material_top(f['material_top'], true),
         f['bottom']) && ($('.change_bottom_facade_style.selected')['removeClass']('selected'),
         $('.change_bottom_facade_style[data-id=\x22' + f['to'] + '\x22]')['addClass']('selected'),
         project_settings['selected_materials']['bottom']['facades'] !== f['material_bottom']) &&
       change_facade_material_bottom(f['material_bottom'], true),
       'different_facades_material' === f['type'] && (tmp_facmat_kost = false,
         $('.set_different_facade_materials')['click'](),
         tmp_facmat_kost = true),
       'change_facade_material_all' === f['type'] && ($('.change_top_facade_material\x20.mat_wrapper.selected')[
           'removeClass']('selected'),
         change_facade_material_all(f['from'], true),
         $('.change_top_facade_material\x20.mat_wrapper[data-id=\x22' + f['from'] + '\x22]')['addClass']('selected')),
       'change_facade_material_top' === f['type'] && ($('.change_top_facade_material\x20.mat_wrapper.selected')[
           'removeClass']('selected'),
         change_facade_material_top(f['from'], true),
         $('.change_top_facade_material\x20.mat_wrapper[data-id=\x22' + f['from'] + '\x22]')['addClass']('selected')),
       'change_facade_material_bottom' === f['type'] && ($('.change_bottom_facade_material\x20.mat_wrapper.selected')[
           'removeClass']('selected'),
         change_facade_material_bottom(f['from'], true),
         $('.change_bottom_facade_material\x20.mat_wrapper[data-id=\x22' + f['from'] + '\x22]')['addClass']('selected')
         ),
       'change_tabletop_material_all' === f['type'] && ($('.tabletop_material_select\x20.mat_wrapper.selected')[
           'removeClass']('selected'),
         change_tabletop_material(f['from'], true),
         $('.tabletop_material_select\x20.mat_wrapper[data-id=\x22' + f['from'] + '\x22]')['addClass']('selected')),
       'change_corpus_material_all' === f['type'] && ($('.change_corpus_material_top\x20.mat_wrapper.selected')[
           'removeClass']('selected'),
         change_corpus_material_all(f['from'], true),
         $('.change_corpus_material_top\x20.mat_wrapper[data-id=\x22' + f['from'] + '\x22]')['addClass']('selected')),
       'change_corpus_material_top' === f['type'] && ($('.change_corpus_material_top\x20.mat_wrapper.selected')[
           'removeClass']('selected'),
         change_corpus_material_top(f['from'], true),
         $('.change_corpus_material_top\x20.mat_wrapper[data-id=\x22' + f['from'] + '\x22]')['addClass']('selected')),
       'change_corpus_material_bottom' === f['type'] && ($('.change_corpus_material_bottom\x20.mat_wrapper.selected')[
           'removeClass']('selected'),
         change_corpus_material_bottom(f['from'], true),
         $('.change_corpus_material_bottom\x20.mat_wrapper[data-id=\x22' + f['from'] + '\x22]')['addClass']('selected')
         ),
       'change_glass_material_all' === f['type'] && ($('.glass_material_select\x20.mat_wrapper.selected')['removeClass']
         ('selected'),
         change_glass_material_all(f['from'], true),
         $('.glass_material_select\x20.mat_wrapper[data-id=\x22' + f['from'] + '\x22]')['addClass']('selected')),
       'wallpanel_active' === f['type'] && (tmp_wp_kost = false,
         $('#wp_active')['click'](),
         tmp_wp_kost = true),
       'change_handle_model' === f['type'] && change_handle_model(f['from']['id'], f['from']['size'], f['from'][
         'group'], true),
       'change_handles_orientation' === f['type'] && (change_handles_orientation(f['from'], true),
         $('#handle_orientation')['val'](f['from'])),
       'change_lockers_handles_position' === f['type'] && (change_lockers_handles_position(f['from'], true),
         $('#locker_handle_position')['val'](f['from'])),
       'change_no_handle' === f['type'] && (change_no_handle(f['from'], true),
         $('#no_handles')['prop']('checked', f['from'])),
       'delete' === f['type']) {
       var h = sc['add_object'](f['obj_type'], f['params'], false);
       for (let i = undo_list.length - 1; 0 <= i; i--)
         undo_list[i]['object'] && undo_list[i]['object']['uuid'] === f['object']['uuid'] && (undo_list[i]['object'] =
           h);
       'molded' === f['obj_type'] && h['load_model'](),
         h['position']['copy'](f['position']),
         h['rotation']['copy'](f['rotation']);
     }
     setTimeout(function() {
         get_total_price_test(),
           get_wall_panel(),
           global_update();
       }, 200),
       add_redo_action(f),
       undo_list['shift'](),
       0 === undo_list.length && $('#undo_action')['addClass']('inactive');
   }
 }

 function add_undo_action(f, g) {
   undo_list['unshift'](f),
     0 < (undo_list = 10 < undo_list.length ? undo_list['slice'](0, -1) : undo_list)['length'] && $(
       '#undo_action')['removeClass']('inactive'),
     g || (redo_list = [],
       $('#redo_action')['addClass']('inactive')),
     pp['interface']['root'] && pp['interface']['root']['$emit']('undo_changed');
 }

 function redo_action() {
   if (redo_list.length) {
     var f = redo_list[0];
     if ('edges_mode' === f['type'] && $('#mode_button')['click'](),
       'transparent_edges' === f['type'] && $('#transparent_edges_mode')['click'](),
       'change_walls_material' === f['type'] && ($('.walls_material_select\x20.mat_wrapper.selected')['removeClass'](
           'selected'),
         change_walls_material(f['to'], true),
         add_undo_action(f, true),
         $('.walls_material_select\x20.mat_wrapper[data-id=\x22' + f['to'] + '\x22]')['addClass']('selected')),
       'set_material_floor' === f['type'] && ($('.floor_material_select\x20.mat_wrapper.selected')['removeClass'](
           'selected'),
         room['set_material_floor'](f['to'], true),
         add_undo_action(f, true),
         $('.floor_material_select\x20.mat_wrapper[data-id=\x22' + f['from'] + '\x22]')['addClass']('selected')),
       'room_size' === f['type'] && (room['set_size'](f['to']['width'], f['to']['height'], f['to']['depth']),
         $('#room_width')['val'](f['to']['width']),
         $('#room_height')['val'](f['to']['height']),
         $('#room_depth')['val'](f['to']['depth']),
         add_undo_action(f, true)),
       'cornice_all' === f['type'] && (change_cornice_active(f['to'], true),
         $('#cornice_active')['prop']('checked', f['to']),
         add_undo_action(f, true)),
       'cokol_top_all' === f['type'] && (sc['set_cokol_top_all'](f['to'], true),
         add_undo_action(f, true)),
       'cornice_level' === f['type'] && (change_cornice_active(f['to'], true),
         add_undo_action(f, true)),
       'cokol_active' === f['type'] && ($('#is_cokol_active')['prop']('checked', !f['to']),
         change_cokol_active(f['to']),
         add_undo_action(f, true)),
       'project_settings' === f['type']) {
       change_wall_panel_height(f['to']['wall_panel_height']),
         $('#settings_wall_panel_height')['val'](f['to']['wall_panel_height']),
         project_settings['is_facades_system'] || (change_cokol_height(f['to']['cokol_height']),
           $('#settings_cokol_height')['val'](f['to']['cokol_height'])),
         change_tabletop_thickness(f['to']['tabletop_thickness']),
         $('#settings_tabletop_thickness')['val'](f['to']['tabletop_thickness']);
       for (var g = room['active_objects']['length'] - 1; 0 <= g; g--)
         'Bardesk' === room['active_objects'][g]['type'] && room['active_objects'][g]['check_wall_panel']();
       add_undo_action(f, true);
     }
     if ('move' === f['type'] && (f['object']['position']['copy'](f['to']),
         f['object']['rotation']['copy'](f['rotation_to']),
         'function' == typeof f['object']['calculate_distances']() && f['object']['calculate_distances'](),
         'function' == typeof f['object']['build_from_wall_sizes'] && f['object']['build_from_wall_sizes'](),
         add_undo_action(f, true)),
       'rotation' === f['type'] && (f['object']['rotation']['setFromVector3'](f['to']),
         add_undo_action(f, true)),
       'move_and_create' === f['type']) {
       var h = sc['add_object'](f['object']['params']['object_type'], f['object']['params'], false);
       h['position']['copy'](f['to']),
         h['rotation']['copy'](f['rotation_to']),
         'molded' === f['object']['params']['object_type'] && h['load_model']();
       for (let j = redo_list.length - 1; 0 <= j; j--)
         redo_list[j]['object'] && redo_list[j]['object']['uuid'] === f['object']['uuid'] && (redo_list[j]['object'] =
           h);
       add_undo_action(f, true);
     }
     if ('copy' === f['type']) {
       var i = sc['add_object'](f['object']['params']['object_type'], f['object']['params'], false);
       i['position']['copy'](f['object']['position']),
         i['rotation']['copy'](f['object']['rotation']);
       for (let k = redo_list.length - 1; 0 <= k; k--)
         redo_list[k]['object'] && redo_list[k]['object']['uuid'] === f['object']['uuid'] && (redo_list[k]['object'] =
           i);
       add_undo_action(f, true);
     }
     'build' === f['type'] && (f['object']['params'] = f['to'],
         f['object']['build'](),
         'function' == typeof f['object']['load_model'] && f['object']['load_model'](),
         add_undo_action(f, true)),
       'comments' === f['type'] && (f['object']['params']['comments'] = f['to'],
         add_undo_action(f, true),
         f['object']['build_comments']()),
       'change_facade_material' === f['type'] && (f['object']['change_facade_material'](f['to']),
         add_undo_action(f, true)),
       'change_corpus_material' === f['type'] && (f['object']['change_corpus_material'](f['to']),
         add_undo_action(f, true)),
       'change_glass_material' === f['type'] && (f['object']['change_glass_material'](f['to']),
         add_undo_action(f, true)),
       'change_tabletop_material' === f['type'] && (f['object']['change_tabletop_material'](f['to']),
         add_undo_action(f, true)),
       'change_opens' === f['type'] && (f['object']['params']['doors'] = f['to'],
         add_undo_action(f, true),
         f['object']['build_doors']()),
       'change_facades_style' === f['type'] && (f['object']['params']['doors'] = f['to'],
         add_undo_action(f, true),
         f['object']['build_doors']()),
       'hob' === f['type'] && (f['object']['params']['hob']['active'] = !f['params'],
         add_undo_action(f, true),
         f['object']['build_hob']()),
       'sink' === f['type'] && (f['object']['params']['sink']['active'] = !f['params'],
         add_undo_action(f, true),
         f['object']['build_washer']()),
       'cornice_active' === f['type'] && (f['object']['params']['cornice']['visible']['front'] = f['to']['front'],
         f['object']['params']['cornice']['visible']['left'] = f['to']['left'],
         f['object']['params']['cornice']['visible']['right'] = f['to']['right'],
         add_undo_action(f, true),
         f['object']['build_cornice']()),
       'cokol_top_active' === f['type'] && (f['object']['params']['cokol_top']['front'] = f['to']['front'],
         f['object']['params']['cokol_top']['left'] = f['to']['left'],
         f['object']['params']['cokol_top']['right'] = f['to']['right'],
         add_undo_action(f, true),
         f['object']['build_cokol_top']()),
       'model_resize' === f['type'] && (f['object']['params']['width'] = f['to']['width'],
         f['object']['params']['height'] = f['to']['height'],
         f['object']['params']['depth'] = f['to']['depth'],
         f['object']['set_size'](),
         add_undo_action(f, true)),
       'set_shaft_size' === f['type'] && (f['object']['set_size'](f['to']['width'], f['to']['height'], f['to']['depth'],
           false),
         add_undo_action(f, true)),
       'change_facades_style_all' === f['type'] && (change_facade_style(f['from'], f['top'], f['bottom'], true),
         f['top'] && ($('.change_top_facade_style.selected')['removeClass']('selected'),
           $('.change_top_facade_style[data-id=\x22' + f['from'] + '\x22]')['addClass']('selected')),
         f['bottom'] && ($('.change_bottom_facade_style.selected')['removeClass']('selected'),
           $('.change_bottom_facade_style[data-id=\x22' + f['from'] + '\x22]')['addClass']('selected')),
         add_undo_action(f, true)),
       'different_facades_material' === f['type'] && (tmp_facmat_kost = false,
         $('.set_different_facade_materials')['click'](),
         add_undo_action(f, tmp_facmat_kost = true)),
       'change_facade_material_all' === f['type'] && ($('.change_top_facade_material\x20.mat_wrapper.selected')[
           'removeClass']('selected'),
         change_facade_material_all(f['to'], true),
         $('.change_top_facade_material\x20.mat_wrapper[data-id=\x22' + f['to'] + '\x22]')['addClass']('selected'),
         add_undo_action(f, true)),
       'change_facade_material_top' === f['type'] && ($('.change_top_facade_material\x20.mat_wrapper.selected')[
           'removeClass']('selected'),
         change_facade_material_top(f['to'], true),
         $('.change_top_facade_material\x20.mat_wrapper[data-id=\x22' + f['to'] + '\x22]')['addClass']('selected'),
         add_undo_action(f, true)),
       'change_facade_material_bottom' === f['type'] && ($('.change_bottom_facade_material\x20.mat_wrapper.selected')[
           'removeClass']('selected'),
         change_facade_material_bottom(f['to'], true),
         $('.change_bottom_facade_material\x20.mat_wrapper[data-id=\x22' + f['to'] + '\x22]')['addClass']('selected'),
         add_undo_action(f, true)),
       'change_tabletop_material_all' === f['type'] && ($('.tabletop_material_select\x20.mat_wrapper.selected')[
           'removeClass']('selected'),
         change_tabletop_material(f['to'], true),
         $('.tabletop_material_select\x20.mat_wrapper[data-id=\x22' + f['to'] + '\x22]')['addClass']('selected'),
         add_undo_action(f, true)),
       'change_corpus_material_all' === f['type'] && ($('.change_corpus_material_top\x20.mat_wrapper.selected')[
           'removeClass']('selected'),
         change_corpus_material_all(f['to'], true),
         $('.change_corpus_material_top\x20.mat_wrapper[data-id=\x22' + f['to'] + '\x22]')['addClass']('selected'),
         add_undo_action(f, true)),
       'change_corpus_material_top' === f['type'] && ($('.change_corpus_material_top\x20.mat_wrapper.selected')[
           'removeClass']('selected'),
         change_corpus_material_top(f['to'], true),
         $('.change_corpus_material_top\x20.mat_wrapper[data-id=\x22' + f['to'] + '\x22]')['addClass']('selected'),
         add_undo_action(f, true)),
       'change_corpus_material_bottom' === f['type'] && ($('.change_corpus_material_bottom\x20.mat_wrapper.selected')[
           'removeClass']('selected'),
         change_corpus_material_bottom(f['to'], true),
         $('.change_corpus_material_bottom\x20.mat_wrapper[data-id=\x22' + f['to'] + '\x22]')['addClass']('selected'),
         add_undo_action(f, true)),
       'change_glass_material_all' === f['type'] && ($('.glass_material_select\x20.mat_wrapper.selected')['removeClass']
         ('selected'),
         change_glass_material_all(f['to'], true),
         $('.glass_material_select\x20.mat_wrapper[data-id=\x22' + f['to'] + '\x22]')['addClass']('selected'),
         add_undo_action(f, true)),
       'wallpanel_active' === f['type'] && (tmp_wp_kost = false,
         $('#wp_active')['click'](),
         add_undo_action(f, tmp_wp_kost = true)),
       'change_handle_model' === f['type'] && (change_handle_model(f['to']['id'], f['to']['size'], true),
         add_undo_action(f, true)),
       'change_handles_orientation' === f['type'] && (change_handles_orientation(f['to'], true),
         $('#handle_orientation')['val'](f['to']),
         add_undo_action(f, true)),
       'change_lockers_handles_position' === f['type'] && (change_lockers_handles_position(f['to'], true),
         $('#locker_handle_position')['val'](f['to']),
         add_undo_action(f, true)),
       'change_no_handle' === f['type'] && (change_no_handle(f['to'], true),
         $('#no_handles')['prop']('checked', f['to']),
         add_undo_action(f, true)),
       'delete' === f['type'] && (f['object']['delete'](),
         add_undo_action(f, true)),
       setTimeout(function() {
         get_total_price_test(),
           get_wall_panel(),
           global_update();
       }, 500),
       redo_list['shift'](),
       0 === redo_list.length && $('#redo_action')['addClass']('inactive');
   }
 }

 function add_redo_action(f) {
   redo_list['unshift'](f),
     0 < redo_list.length && $('#redo_action')['removeClass']('inactive'),
     pp['interface']['root'] && pp['interface']['root']['$emit']('redo_changed');
 }
 let wallpanel_params = {
   'width': 600,
   'height': 550,
   'thickness': 3,
   'material': 0,
   'draggable': true,
   'pX': 0,
   'pY': 0,
   'pZ': 0,
   'rY': 0,
   'sizes_limit': {
     'min_width': 0,
     'max_width': 0,
     'min_height': 0,
     'max_height': 0,
     'min_depth': 0,
     'max_depth': 0
   },
   'name': 'wall_panel',
   'code': '',
   'object_type': 'Wall_panel',
   'custom_data': {}
 };
 class Wall_panel extends PPObject {
   constructor(e) {
       super(e);
       let f = this;
       this['type'] = 'Wall_panel',
         this['userData']['type'] = 'Wall_panel',
         this['temp_type'] = 'Wall_panel',
         e = e || {},
         this['params'] = $['extend'](true, {}, wallpanel_params, e),
         'object' == typeof this['params']['material'] && (this['params']['material'] = this['params']['material'][
           'id']),
         this['box'] = new THREE['Box3'](),
         this['box']['update'] = function() {
           f['box']['setFromObject'](f['model']);
         },
         f['object_type'] = 'cabinet',
         this['model'] = new THREE['Group'](),
         this['add'](this['model']),
         this['sizes'] = new THREE['Group'](),
         this['add'](this['sizes']),
         f['size_box'] = new SizeBox({
           'width': f['params']['width'] / units,
           'height': f['params']['height'] / units,
           'depth': f['params']['thickness'] / units
         }),
         f['size_box']['position']['y'] = f['params']['height'] / units / 2,
         f['add'](f['size_box']),
         f['size_box']['visible'] = false,
         this['before_build'](),
         this['build']();
     }
     ['before_build']() {}
     ['build']() {
       this['reset_model'](),
         this['name'] = this['params']['name'],
         this['wall_panel'] = Object_wall({
           'width': this['params']['width'] / units,
           'height': this['params']['height'] / units,
           'thickness': this['params']['thickness'] / units,
           'material': this['params']['material'],
           'name': this['params']['name']
         }),
         this['wall_panel']['geometry']['name'] = 'test',
         this['position']['set'](this['params']['pX'], this['params']['pY'], this['params']['pZ']),
         this['rotation']['y'] = this['params']['rY'],
         this['model']['add'](this['wall_panel']),
         this['params']['draggable'] && (this['model']['position']['y'] = this['params']['height'] / units / 2),
         this['build_sizes'](),
         'edges' === global_options['mode'] && this['edges_mode'](),
         this['resizable'] && this['resizable']['updateControls'](),
         this['set_name'](),
         this['set_code']();
     }
     ['build_sizes']() {
       this['reset_model'](this['sizes']),
         this['size_width'] = new Sizes_obj({
           'width': this['params']['width'] / units,
           'text': this['params']['width'],
           'font_size': 50
         }),
         this['size_width']['position']['set'](0, this['params']['height'] / units, -this['params']['thickness'] /
           units / 2 + 0.4),
         this['sizes']['add'](this['size_width']),
         this['size_height'] = new Sizes_obj({
           'width': this['params']['height'] / units,
           'text': this['params']['height'],
           'font_size': 50
         }),
         this['size_height']['position']['set'](-this['params']['width'] / units / 2, this['params']['height'] /
           units / 2, -this['params']['thickness'] / units / 2 + 0.4),
         this['size_height']['rotation']['z'] = Math['PI'] / 2,
         this['sizes']['add'](this['size_height']),
         this['sizes']['visible'] = global_options['sizes_visible'];
     }
     ['build_controls']() {
       var e = make_cube(10, 10, 10),
         e = (e['is_control'] = true,
           e['name'] = 'left_control',
           this['controls']['add'](e),
           e['userData']['obj'] = this,
           e['position']['x'] = -this['params']['width'] / units / 2,
           make_cube(10, 10, 10));
       e['is_control'] = true,
         e['name'] = 'right_control',
         this['controls']['add'](e),
         e['userData']['obj'] = this,
         e['position']['x'] = this['params']['width'] / units / 2;
     }
     ['do_control_action'](e, f) {
       var g = f['diff'];
       switch (this['box']['update'](),
         e['name']) {
         case 'left_control':
           g['x'] - this['box']['min']['x'] < -10 && (this['set_size_by_number'](this['params']['width'] + 100, this[
                 'params']['height']),
               this['position']['x'] -= 5),
             100 < this['params']['width'] && 10 < g['x'] - this['box']['min']['x'] && (this['set_size_by_number'](
                 this['params']['width'] - 100, this['params']['height']),
               this['position']['x'] += 5);
           break;
         case 'right_control':
           10 < g['x'] - this['box']['max']['x'] && (this['set_size_by_number'](this['params']['width'] + 100, this[
                 'params']['height']),
               this['position']['x'] += 5),
             100 < this['params']['width'] && g['x'] - this['box']['max']['x'] < -10 && (this['set_size_by_number'](
                 this['params']['width'] - 100, this['params']['height']),
               this['position']['x'] -= 5),
             g['z'] - this['box']['min']['z'] < -10 && (this['set_size_by_number'](this['params']['width'] + 100,
                 this['params']['height']),
               this['position']['z'] -= 5),
             100 < this['params']['width'] && 10 < g['z'] - this['box']['min']['z'] && (this['set_size_by_number'](
                 this['params']['width'] - 100, this['params']['height']),
               this['position']['z'] += 5);
           break;
       }
     }
     ['change_material'](e) {
       this['params']['material'] = e,
         this['set_name'](),
         this['set_code'](),
         this['wall_panel']['change_material'](e);
     }
     ['set_name']() {
       'wall_panel' == this['params']['name'] && (this['params']['name'] = lang['wallpanel'] + '\x20' + materials_lib[
         'items'][this['params']['material']]['name'] + '\x20' + this['params']['width'] + 'x' + this['params'][
         'height'
       ]);
     }
     ['set_code']() {
       '' == this['params']['code'] && (this['params']['code'] = materials_lib['items'][this['params']['material']][
         'code'
       ]);
     }
     ['set_size_by_number'](e, f) {
       this['params']['width'] = e,
         this['params']['height'] = f,
         this['params']['pX'] = this['position']['x'],
         this['params']['pY'] = this['position']['y'],
         this['params']['pZ'] = this['position']['z'],
         this['params']['rY'] = this['rotation']['y'],
         this['build']();
     }
     ['design_mode']() {
       this['params']['pX'] = this['position']['x'],
         this['params']['pY'] = this['position']['y'],
         this['params']['pZ'] = this['position']['z'],
         this['params']['rY'] = this['rotation']['y'],
         this['build']();
     }
     ['show_radial_menu'](e, f) {
       var g = this,
         h = {
           'sizes': true,
           'copy_button': true,
           'rotate_buttons': false,
           'material': true,
           'material_facade': false,
           'material_corpus': false
         };
       pp['interface']['root']['radial']({
         'obj_type': this['type'],
         'obj': h,
         'left': e,
         'top': f
       });
     }
     ['copypaste']() {
       return void this['toggleResizeMode'](null, 'z');
       var e = new Wall_panel(copy_object(this['params']));
       room['add'](e),
         room['active_objects']['push'](e),
         d_objects.push(e),
         e['position']['copy'](this['position']),
         e['rotation']['copy'](this['rotation']),
         0 === e['rotation']['y'] && (e['position']['x'] += e['params']['width'] / units),
         e['rotation']['y'] === Math['PI'] && (e['position']['x'] -= e['params']['width'] / units),
         e['rotation']['y'] === Math['PI'] / 2 && (e['position']['z'] -= e['params']['width'] / units),
         e['rotation']['y'] === -Math['PI'] / 2 && (e['position']['z'] += e['params']['width'] / units),
         add_undo_action({
           'type': 'copy',
           'object': e
         });
     }
     ['get_price']() {
       return this['get_price_specs']();
     }
     ['get_price_specs']() {
       if (1 != constructor_settings['price_enabled'])
         return 0;
       let f = this['get_specs'](true),
         g = 0;
       return Object['keys'](f['wallpanel'])['length'] && Object['keys'](f['wallpanel'])['forEach'](function(h) {
           let j = get_material_by_id(h);
           j = j || get_material_by_id(0);
           var k = objectFindByKey(prices['wallpanel'], 'id', j['category']);
           if (k) {
             let l;
             l = (0 != k['get_from_parent'] && null != k['get_from_parent'] ? objectFindByKey(prices['wallpanel'],
                 'id', k['parent']) : k)['price'],
               g += l * f['wallpanel'][h]['m2'];
           }
         }),
         g *= constructor_settings['price_modificator'],
         this['params']['price'] = g;
     }
     ['get_specs'](e) {
       var f = copy_object(specs_result),
         g = {
           'id': 0,
           'm2': 0,
           'pm': 0
         };
       return g['m2'] = parseFloat((this['params']['width'] / 1000 * this['params']['height'] / 1000)['toFixed'](
         2)),
         g['pm'] = this['params']['width'] / 1000,
         'object' == typeof this['params']['material'] ? g['id'] = this['params']['material']['id'] : g['id'] = this[
           'params']['material'],
         f['wallpanel']['push'](g),
         this['specs'] = f,
         e ? convert_specs(f) : f;
     }
 }
 class Washer extends PPObject {
   constructor(f) {
     super(f);
     let g = this;
     var f;
     f = f || {},
       this['type'] = 'Washer',
       this['temp_type'] = 'Washer',
       this['object_type'] = 'washer',
       null != f['params'] && (f['v'] = 2),
       this['params'] = {
         'id': void 0 !== f['id'] ? f['id'] : 0,
         'model': void 0 !== f['model'] ? f['model'] : 0,
         'material': void 0 !== f['material'] ? f['material'] : void 0,
         'width': void 0 !== f['width'] ? f['width'] : 175,
         'height': void 0 !== f['height'] ? f['height'] : 35,
         'depth': void 0 !== f['depth'] ? f['depth'] : 14,
         'params': void 0 !== f['params'] ? f['params'] : {},
         'offset_x': void 0 !== f['offset_x'] ? f['offset_x'] : 0,
         'offset_z': void 0 !== f['offset_z'] ? f['offset_z'] : 0,
         'rotation': void 0 !== f['rotation'] ? f['rotation'] : 0,
         'name': void 0 !== f['name'] ? f['name'] : 'Model',
         'code': void 0 !== f['code'] ? f['code'] : '',
         'smes': void 0 !== f['smes'] ? f['smes'] : void 0,
         'smes_rotation': void 0 !== f['smes_rotation'] ? f['smes_rotation'] : 0,
         'smes_positions': '',
         'flippable': void 0 === f['flippable'] || f['flippable'],
         'flipped': void 0 !== f['flipped'] && f['flipped'],
         'v': void 0 !== f['v'] ? f['v'] : 1
       },
       1 < this['params']['v'] ? (this['params']['width'] = void 0 !== f['params']['width'] ? f['params'][
         'width'] : 175,
         this['params']['height'] = void 0 !== f['params']['height'] ? f['params']['height'] : 35,
         this['params']['depth'] = void 0 !== f['params']['depth'] ? f['params']['depth'] : 35,
         this['params']['smes_rotation'] = void 0 !== f['params']['smes_rotation'] ? f['params']['smes_rotation'] :
         0,
         this['params']['material'] || (0 != (f = libs['washes']['get_item'](this['params']['id']))['materials'][
           'length'
         ] ? this['params']['material'] = f['materials'][0] : 0 != f['mat_categories']['length'] ? this[
           'params']['material'] = materials_lib['get_first_item'](f['mat_categories'][0])['id'] : this['params'][
           'material'
         ] = 'w_mat_0')) : (this['params']['material'] || (this['params']['material'] = washes_catalog[this['params'][
           'id'
         ]]['variants'][0]['material']),
         this['params']['params'] = void 0),
       this['params']['active'] = true,
       this['model_loaded'] = 'not_loaded',
       this['model'] = new THREE['Group'](),
       this['model']['name'] = this['params']['name'],
       this['smes_model'] = new THREE['Group'](),
       this['smes_model']['name'] = 'smes_model',
       this['smes'] = {
         'model_loaded': 'not_loaded'
       },
       this['add'](this['model']),
       this['add'](this['smes_model']),
       this['box'] = new THREE['Box3'](),
       this['box']['update'] = function() {
         g['box']['setFromObject'](g['size_box']);
       },
       this['size_box'] = new SizeBox({
         'width': g['params']['width'] / units,
         'height': g['params']['height'] / units,
         'depth': g['params']['depth'] / units
       }),
       this['size_box']['visible'] = false,
       this['size_box']['position']['y'] = g['params']['height'] / units / 2,
       this['add'](this['size_box']),
       this['build']();
   }
 }

 function handleInvertedGeometry(f) {
   let g = 0,
     h = 0,
     j = 0;
   var k = f['attributes']['normal']['array'];
   for (let p = 0, q = k.length / 9; p < q; p++)
     g = k[9 * p],
     h = k[9 * p + 1],
     j = k[9 * p + 2],
     k[9 * p] = k[9 * p + 6],
     k[9 * p + 1] = k[9 * p + 7],
     k[9 * p + 2] = k[9 * p + 8],
     k[9 * p + 6] = g,
     k[9 * p + 7] = h,
     k[9 * p + 8] = j;
   var l = f['attributes']['position']['array'];
   for (let u = 0, v = l.length / 9; u < v; u++)
     g = l[9 * u],
     h = l[9 * u + 1],
     j = l[9 * u + 2],
     l[9 * u] = l[9 * u + 6],
     l[9 * u + 1] = l[9 * u + 7],
     l[9 * u + 2] = l[9 * u + 8],
     l[9 * u + 6] = g,
     l[9 * u + 7] = h,
     l[9 * u + 8] = j;
   var n = f['attributes']['uv']['array'];
   for (let w = 0, x = n.length / 6; w < x; w++)
     g = n[6 * w],
     h = n[6 * w + 1],
     n[6 * w] = n[6 * w + 4],
     n[6 * w + 1] = n[6 * w + 5],
     n[6 * w + 4] = g,
     n[6 * w + 5] = h;
   f['attributes']['normal']['needsUpdate'] = true,
     f['attributes']['position']['needsUpdate'] = true,
     f['attributes']['uv']['needsUpdate'] = true;
 }
 Washer['prototype']['build_from_wall_sizes'] = function() {},
   Washer['prototype']['build'] = function() {
     var f = this,
       g;
     this['model_loaded'] = 'not_loaded',
       void 0 !== Model_utils['get_model_from_cache'](f['params']['model']) ? f['load_model']() : ((g = make_edges(f[
           'params']['width'] / units, f['params']['height'] / units, f['params']['depth'] / units))['position']['y'] =
         f['params']['height'] / 2 / units,
         f['model']['add'](g)),
       this['size_box']['set_size'](f['params']['width'] / units, f['params']['height'] / units, f['params']['depth'] /
         units);
   },
   Washer['prototype']['load_model'] = async function() {
       if ('loaded' != this['model_loaded']) {
         var f = this,
           g = (f['reset_model'](this['model']),
             pp['info']['tabletop']['needUpdateAfterModelsLoad'] = true,
             await load_model({
               'model': f['params']['model'],
               'buffer': false
             })),
           h, j;
         for (let m = 0; m < g.length; m++) {
           var k = g[m]['clone'](),
             l;
           let n, p = 0; -
           1 < k['name']['indexOf']('metall') && (n = metall_mat,
               p = 1),
             (-1 < k['name']['indexOf']('cut') || -1 < k['name']['indexOf']('smes')) && (n = transparent_material,
               p = 1),
             0 != f['params']['flipped'] && (k['scale'](-1, 1, 1),
               handleInvertedGeometry(k)),
             0 === p && (n = 1 < f['params']['v'] ? ((l = materials_lib['get_item'](f['params']['material']))[
                 'add_params']['model_width'] = f['params']['width'],
               l['add_params']['model_height'] = f['params']['height'],
               create_material(l)) : (f['params']['material']['add_params']['model_width'] || (f['params']['material']
                 ['add_params']['model_width'] = f['params']['width']),
               f['params']['material']['add_params']['model_height'] || (f['params']['material']['add_params'][
                 'model_height'
               ] = f['params']['height']),
               create_material(f['params']['material'])));
           var l = new THREE['Mesh'](k, n);
           l['name'] = k['name'],
             (-1 < k['name']['indexOf']('cut') || -1 < k['name']['indexOf']('smes')) && (l['no_edges'] = true),
             l['castShadow'] = true,
             f['model']['add'](l);
         }
         'edges' === global_options['mode'] && f['edges_mode'](),
           f['box']['update'](),
           f['model_loaded'] = 'loaded';
         for (let q = 0; q < f['model']['children']['length']; q++) {
           -1 < f['model']['children'][q]['name']['indexOf']('smes') && (h = box3['setFromObject'](f['model'][
               'children'
             ][q])['getCenter'](new THREE['Vector3']())['clone'](),
             j = f['box']['getCenter'](new THREE['Vector3']())['clone'](),
             f['params']['smes_positions'] = {
               'x': h['x'] - j['x'],
               'z': h['z'] - j['z']
             },
             f['build_smes']());
         }
       }
     },
     Washer['prototype']['after_load'] = function() {},
     Washer['prototype']['change_orientation'] = function() {
       this['flip_model']();
     },
     Washer['prototype']['flip_model'] = function() {
       let e = this,
         f = (this['params']['flipped'] = !this['params']['flipped'],
           e['rotation']['clone']());
       e['lookAt'](e['getWorldPosition'](new THREE['Vector3']())['x'], e['getWorldPosition'](new THREE['Vector3']())[
           'y'], e['getWorldPosition'](new THREE['Vector3']())['z'] + 100),
         e['visible'] = false,
         setTimeout(function() {
           for (let k = e['model']['children']['length'] - 1; 0 <= k; k--) {
             var g = e['model']['children'][k],
               g, h;
             g['geometry']['scale'](-1, 1, 1),
               handleInvertedGeometry(g['geometry']),
               -1 < e['model']['children'][k]['name']['indexOf']('smes') && (g = box3['setFromObject'](e['model'][
                   'children'
                 ][k])['getCenter'](new THREE['Vector3']())['clone'](),
                 h = e['box']['getCenter'](new THREE['Vector3']())['clone'](),
                 e['params']['smes_positions'] = {
                   'x': g['x'] - h['x'],
                   'z': g['z'] - h['z']
                 },
                 e['build_smes']());
           }
           e['rotation']['copy'](f),
             e['visible'] = true;
           var i = box3['setFromObject'](e['model']),
             j = (i['expandByObject'](e['smes_model']),
               i['getSize'](vec3)['clone']());
           e['size_box']['set_size'](j['x'], j['y'], j['z']),
             e['parent']['uuid'] === room['uuid'] ? (e['box']['update'](),
               sc['build_tabletop']()) : (e['size_box']['position']['y'] = i['max']['y'] - e['parent']['parent'][
                 'box']['max']['y'] - j['y'] / 2,
               e['box']['update'](),
               e['parent']['parent']['build_tabletop'](),
               e['parent']['parent']['build_washer_new']());
         }, 100);
     },
     Washer['prototype']['set_size'] = function() {
       var f = this['model']['rotation']['clone'](),
         g = new THREE['Euler']()['setFromQuaternion'](this['model']['getWorldQuaternion'](new THREE['Quaternion']())[
           'clone']());
       this['model']['rotation']['set'](-1 * g['x'], -1 * g['y'], -1 * g['z']);
       let j = this,
         k, p, q, u, v = new THREE['Vector3'](j['params']['width'] / units, j['params']['height'] / units, j['params'][
           'depth'
         ] / units),
         w = new THREE['Box3']()['setFromObject'](j['model'])['getSize'](new THREE['Vector3']())['clone']();
       if (0 != (u = v['clone']()['sub'](w)['divideScalar'](2))['x'] || 0 != u['y'] || 0 != u['z']) {
         for (k = 0; k < j['model']['children']['length']; k++)
           if (j['model']['children'][k]['geometry']) {
             if (-1 < j['model']['children'][k]['name']['indexOf']('v(2)')) {
               var x = j['model']['children'][k]['name']['match'](/_s\((.*?)\)/),
                 y = j['model']['children'][k]['name']['match'](/_t\((.*?)\)/),
                 z;
               if (null !== x && (z = box3['setFromObject'](j['model'])['getSize'](new THREE['Vector3']())['clone'](),
                   -1 < x[1]['indexOf']('x') && (j['model']['children'][k]['scale']['x'] = j['params']['width'] /
                     units / w['x']),
                   -1 < x[1]['indexOf']('y') && (j['model']['children'][k]['scale']['y'] = j['params']['height'] /
                     units / w['y']),
                   -1 < x[1]['indexOf']('y')) && (j['model']['children'][k]['scale']['z'] = j['params'][
                   'thickness'] / units / w['z']),
                 null !== y) {
                 for (p = 0; p < j['model']['children'][k]['geometry']['vertices']['length']; p++)
                   q = j['model']['children'][k]['geometry']['vertices'][p],
                   -1 < y[1]['indexOf']('x') && (q['x'] < 0 ? q['x'] -= u['x'] : q['x'] += u['x']),
                   -1 < y[1]['indexOf']('y') && (q['y'] < 0 ? q['y'] -= u['y'] : q['y'] += u['y']),
                   -1 < y[1]['indexOf']('z') && (q['z'] < 0 ? q['z'] -= u['z'] : q['z'] += u['z']);
               }
             } else {
               if ('edges' === global_options['mode'] && 'edges' === j['model']['children'][k]['name'])
                 j['model']['children'][k]['parent']['remove'](j['model']['children'][k]);
               else {
                 for (p = 0; p < j['model']['children'][k]['geometry']['vertices']['length']; p++)
                   'cut' === j['model']['children'][k]['name'] && (j['model']['children'][k]['name'] = 'cut_xyz'),
                   q = j['model']['children'][k]['geometry']['vertices'][p],
                   -1 < j['model']['children'][k]['name']['indexOf']('x') && (q['x'] < 0 ? q['x'] -= u['x'] : q[
                     'x'] += u['x']),
                   -1 < j['model']['children'][k]['name']['indexOf']('y') && (q['y'] < 0 ? q['y'] -= u['y'] : q[
                     'y'] += u['y']),
                   -1 < j['model']['children'][k]['name']['indexOf']('z') && (q['z'] < 0 ? q['z'] -= u['z'] : q[
                     'z'] += u['z']);
                 j['model']['children'][k]['geometry']['verticesNeedUpdate'] = true;
               }
             }
           }
         this['model']['rotation']['copy'](f),
           this['box']['update'](),
           'edges' === global_options['mode'] && j['edges_mode']();
       }
     },
     Washer['prototype']['set_size_by_number'] = function(f, g, h) {
       var i = this,
         j = {
           'type': 'model_resize',
           'from': {
             'width': copy_object(i['params']['width']),
             'height': copy_object(i['params']['height']),
             'depth': copy_object(i['params']['depth'])
           },
           'object': i
         };
       f && (this['params']['width'] = f),
         g && (this['params']['height'] = g),
         h && (this['params']['depth'] = h),
         j['to'] = {
           'width': i['params']['width'],
           'height': i['params']['height'],
           'depth': i['params']['depth']
         },
         add_undo_action(j),
         i['load_model'](),
         false !== this['params']['draggable'] && this['size_box']['set_size'](this['params']['width'] / units, this[
           'params']['height'] / units, this['params']['depth'] / units);
     },
     Washer['prototype']['show_radial_menu'] = function(f, g) {
       var h = this,
         i = {
           'rotate_buttons': true,
           'copy_button': false,
           'sizes': true,
           'material': true
         };
       i['tech'] = this['params']['flippable'],
         i['flip_button'] = true,
         pp['interface']['root']['radial']({
           'obj_type': this['type'],
           'obj': i,
           'left': f,
           'top': g
         });
     },
     Washer['prototype']['build_smes'] = function() {
       let f = this;
       this['reset_model'](this['smes_model']);
       let g, h = (void 0 !== this['params']['smes'] && smes_catalog[this['params']['smes']] ? g = smes_catalog[this[
           'params']['smes']] : (g = smes_catalog[Object['keys'](smes_catalog)[1]],
           this['params']['smes'] = Object['keys'](smes_catalog)[1]),
         null == g && (g = smes_catalog[0]),
         1 < f['params']['v'] || (f['params']['material']['add_params']['model_width'] || (f['params']['material'][
             'add_params'
           ]['model_width'] = f['params']['width']),
           f['params']['material']['add_params']['model_height']) || (f['params']['material']['add_params'][
           'model_height'
         ] = f['params']['height']),
         g['material'] = f['params']['material'],
         new Simple_model(g));
       this['smes_model']['add'](h),
         this['smes'] = h;
       for (let q = 0; q < f['model']['children']['length']; q++) {
         var j, k; -
         1 < f['model']['children'][q]['name']['indexOf']('smes') && (j = box3['setFromObject'](f['model']['children']
             [q])['getCenter'](new THREE['Vector3']())['clone'](),
           k = f['box']['getCenter'](new THREE['Vector3']())['clone'](),
           f['params']['smes_positions'] = {
             'x': j['x'] - k['x'],
             'z': j['z'] - k['z']
           });
       }
       var l = new THREE['Matrix4'](),
         n = (f['parent'] && f['parent']['uuid'] === room['uuid'] ? l['makeRotationY'](-f['rotation']['y']) : f[
             'parent'] && f['parent']['parent'] && l['makeRotationY'](-f['parent']['parent']['rotation']['y']),
           new THREE['Vector3'](this['params']['smes_positions']['x'], 0, this['params']['smes_positions']['z']));
       n['applyMatrix4'](l),
         h['position']['x'] = n['x'],
         h['position']['z'] = n['z'],
         h['rotation']['y'] = this['params']['smes_rotation'] * Math['PI'] / 180,
         this['params']['flipped'] && (h['rotation']['y'] *= -1);
       let p = setInterval(function() {
         var u, u;
         'loaded' == h['model_loaded'] && (clearInterval(p),
           (u = box3['setFromObject'](f['model']))['expandByObject'](f['smes_model']),
           u = u['getSize'](vec3)['clone'](),
           f['size_box']['set_size'](u['x'], u['y'], u['z']),
           f['box']['update'](),
           f['after_load']());
       }, 100);
     },
     Washer['prototype']['change_material'] = function(f) {
       if ('edges' === global_options['mode'])
         show_edges_modal();
       else {
         var g = this,
           h = _['get'](this, 'parent.parent.params.washer') || this['params'];
         if (1 < this['params']['v']) {
           this['params']['material'] = f['id'],
             h['material'] = this['params']['material'];
           var i = materials_lib['get_item'](g['params']['material']);
           i['add_params']['model_width'] = g['params']['width'],
             i['add_params']['model_height'] = g['params']['height'];
           for (let j = 0; j < g['model']['children']['length']; j++)
             -
             1 < g['model']['children'][j]['name']['indexOf']('gen') && (g['model']['children'][j]['material'] =
               create_material(i));
           for (let k = 0; k < g['smes_model']['children'][0]['model']['children']['length']; k++)
             -
             1 < g['smes_model']['children'][0]['model']['children'][k]['name']['indexOf']('gen') && (g[
               'smes_model']['children'][0]['model']['children'][k]['material'] = create_material(i));
         } else {
           this['params']['material'] = copy_object(f),
             h['material'] = this['params']['material'];
           for (let l = 0; l < g['model']['children']['length']; l++)
             -
             1 < g['model']['children'][l]['name']['indexOf']('gen') && (g['params']['material']['add_params'][
                 'model_width'
               ] || (g['params']['material']['add_params']['model_width'] = g['params']['width']),
               g['params']['material']['add_params']['model_height'] || (g['params']['material']['add_params'][
                 'model_height'
               ] = g['params']['height']),
               g['model']['children'][l]['material'] = create_material(g['params']['material']));
           for (let m = 0; m < g['smes_model']['children'][0]['model']['children']['length']; m++)
             -
             1 < g['smes_model']['children'][0]['model']['children'][m]['name']['indexOf']('gen') && (g['params'][
                 'material'
               ]['add_params']['model_width'] || (g['params']['material']['add_params']['model_width'] = g['params'][
                 'width'
               ]),
               g['params']['material']['add_params']['model_height'] || (g['params']['material']['add_params'][
                 'model_height'
               ] = g['params']['height']),
               g['smes_model']['children'][0]['model']['children'][m]['material'] = create_material(g['params'][
                 'material'
               ]));
         }
         sc['get_price']();
       }
     },
     Washer['prototype']['rotate_left'] = function(f) {
       let g = this;
       clearTimeout(this['rot_timeout']),
         add_undo_action({
           'type': 'rotation',
           'object': g,
           'from': g['rotation']['clone'](),
           'to': new THREE['Vector3'](g['rotation']['x'], g['rotation']['y'] - Math['PI'] / 4, g['rotation']['z'])[
             'clone']()
         }),
         g['rotation']['y'] -= Math['PI'] / 4,
         g['box']['update'](),
         this['rot_timeout'] = setTimeout(function() {
           g['params']['rotation'] = g['rotation']['y'];
           var h = box3['setFromObject'](g['model']),
             i = (h['expandByObject'](g['smes_model']),
               h['getSize'](vec3)['clone']());
           g['size_box']['set_size'](i['x'], i['y'], i['z']),
             g['parent']['uuid'] === room['uuid'] ? (g['box']['update'](),
               constructor_settings['core_v2'] ? sc['build_tabletop_v3']() : (sc[
                   'washer_related_tabletops_mark_rebuild'](g),
                 sc['build_tabletop']())) : (g['size_box']['position']['y'] = h['max']['y'] - g['parent']['parent'][
                 'box'
               ]['max']['y'] - i['y'] / 2,
               g['box']['update'](),
               g['parent']['parent']['build_tabletop'](),
               g['parent']['parent']['build_washer_new']());
         }, 500);
     },
     Washer['prototype']['rotate_right'] = function(f) {
       let g = this;
       clearTimeout(this['rot_timeout']),
         add_undo_action({
           'type': 'rotation',
           'object': g,
           'from': g['rotation']['clone'](),
           'to': new THREE['Vector3'](g['rotation']['x'], g['rotation']['y'] + Math['PI'] / 4, g['rotation']['z'])[
             'clone']()
         }),
         g['rotation']['y'] += Math['PI'] / 4,
         g['box']['update'](),
         this['rot_timeout'] = setTimeout(function() {
           g['params']['rotation'] = g['rotation']['y'];
           var h = box3['setFromObject'](g['model']),
             i = (h['expandByObject'](g['smes_model']),
               h['getSize'](vec3)['clone']());
           g['size_box']['set_size'](i['x'], i['y'], i['z']),
             g['parent']['uuid'] === room['uuid'] ? (g['box']['update'](),
               constructor_settings['core_v2'] ? sc['build_tabletop_v3']() : (sc[
                   'washer_related_tabletops_mark_rebuild'](g),
                 sc['build_tabletop']())) : (g['size_box']['position']['y'] = h['max']['y'] - g['parent']['parent'][
                 'box'
               ]['max']['y'] - i['y'] / 2,
               g['box']['update'](),
               g['parent']['parent']['build_tabletop'](),
               g['parent']['parent']['build_washer_new']());
         }, 500);
     },
     Washer['prototype']['delete'] = function(f) {
       var g;
       if (!constructor_settings['core_v2'] && (sc['washer_related_tabletops_mark_rebuild'](this),
           sc['build_tabletop_debounced']()),
         this['parent']['uuid'] === room['uuid'])
         PPObject['prototype']['delete']['call'](this);
       else {
         this['reset_model']();
         for (let h = this['children']['length'] - 1; 0 <= h; h--)
           this['remove'](this['children'][h]);
         this['parent'] && this['parent']['parent'] && 'function' == typeof this['parent']['parent'][
           'remove_wahser_new'] && this['parent']['parent']['remove_wahser_new']();
       }
     },
     Washer['prototype']['design_mode'] = function() {
       this['load_model']();
     },
     Washer['prototype']['check_cabinets_around'] = function() {
       var f = new THREE['Box3'](),
         g, h;
       f['setFromObject'](this['model']);
       for (g of d_objects) {
         'Cabinet' === g['type'] && 'bottom' === g['cabinet_type'] && 'function' == typeof g['on_washer_drag_end'] && g[
           'box'] && (g['box']['update'] && g['box']['update'](),
           f['intersectsBox'](g['box'])) && g['on_washer_drag_end'](this);
       }
     },
     Washer['prototype']['find_related_tabletop_parts'] = function() {
       var f = !constructor_settings['core_v2'];
       let g = this;
       var f = f ? [...global_data['tabletop']['items'], ...global_data['tabletop']['items_bardesk']] : pp['info'][
         'tabletop'
       ]['items_parts'];
       return _.filter(f, h => _['some'](h['userData']['washers'], i => i['obj'] === g));
     },
     Washer['prototype']['reset_related_tabletop_parts'] = function() {
       var f = !constructor_settings['core_v2'],
         g, h;
       for (h of this['find_related_tabletop_parts']()) {
         var i = h['userData'];
         i['washers'] && i['washers']['length'] && (i['washers'] = [],
           f ? h['userData']['tabletop_need_rebuild'] = 1 : h['_rebuild']());
       }
     },
     Washer['prototype']['rotate_across_point'] = function(f, g) {
       var h;
       Math['abs'](g % (2 * Math['PI'])) < 0.05 || ((h = this['position']['clone']()['sub'](f))['y'] = 0,
         h['applyAxisAngle'](new THREE['Vector3'](0, 1, 0), g),
         h['add'](f),
         this['position']['set'](h['x'], this['position']['y'], h['z']),
         this['rotation']['y'] += g,
         this['params']['rotation'] = this['rotation']['y']);
     };
 class Simple_model extends THREE['Group'] {
   constructor(f) {
     super(f),
       this['type'] = 'Simple_model',
       this['params'] = {
         'id': void 0 !== f['id'] ? f['id'] : 0,
         'model': void 0 !== f['model'] ? f['model'] : void 0,
         'material': void 0 !== f['material'] ? f['material'] : void 0,
         'width': void 0 !== f['width'] ? f['width'] : void 0,
         'height': void 0 !== f['height'] ? f['height'] : void 0,
         'depth': void 0 !== f['depth'] ? f['depth'] : void 0,
         'name': void 0 !== f['name'] ? f['name'] : 'Model',
         'code': void 0 !== f['code'] ? f['code'] : '',
         'instant_loading': void 0 === f['instant_loading'] || f['instant_loading']
       },
       this['model'] = new THREE['Group'](),
       this['add'](this['model']),
       this['build']();
   }
 }

 function build_washes_materials_tree(f) {
   let g = f['categories'],
     h = f['items'];
   g[0] = {
       'name': 'Без\x20категории',
       'id': 0,
       'categories': [],
       'items': []
     },
     Object['keys'](g)['forEach'](function(i) {
       var j = g[i];
       j['items'] = [],
         j['children'] || (j['categories'] = []),
         j['parent'] && 0 != j['parent'] && (g[j['parent']]['categories'] || (g[j['parent']]['categories'] = []),
           g[j['parent']]['categories']['push'](i));
     }),
     Object['keys'](h)['forEach'](function(i) {
       var j = h[i];
       j['category'] || (j['category'] = 0),
         g[j['category']]['items']['push'](i);
     });
 }
 Simple_model['prototype']['build'] = function() {
     var f = this;
     this['model_loaded'] = 'not_loaded',
       f['load_model']();
   },
   Simple_model['prototype']['load_model'] = async function() {
       var f = this,
         g = (f['reset_model'](this['model']),
           await load_model({
             'model': f['params']['model'],
             'buffer': false
           }));
       for (let j = 0; j < g.length; j++) {
         var h = g[j]['clone'](),
           i;
         let k;
         k = 'object' == typeof f['params']['material'] ? create_material(f['params']['material']) : ((i =
             materials_lib['get_item'](f['params']['material']))['add_params']['model_width'] = f['params']['width'],
           i['add_params']['model_height'] = f['params']['height'],
           create_material(i));
         var i = new THREE['Mesh'](h, k);
         i['name'] = h['name'],
           -1 < i['name']['indexOf']('metall') && (i['material'] = metall_mat),
           i['castShadow'] = true,
           f['model']['add'](i);
       }
       f['set_size'](),
         'edges' === global_options['mode'] && f['edges_mode'](),
         f['model_loaded'] = 'loaded';
     },
     Simple_model['prototype']['set_size'] = function() {
       var f = this['model']['rotation']['clone'](),
         g = new THREE['Euler']()['setFromQuaternion'](this['model']['getWorldQuaternion'](new THREE['Quaternion']())[
           'clone']()),
         h = (this['model']['rotation']['set'](-1 * g['x'], -1 * g['y'], -1 * g['z']),
           this),
         g = box3['setFromObject'](h['model'])['getSize'](new THREE['Vector3']())['clone'](),
         i = {
           'box': g,
           'diff': new THREE['Vector3'](h['params']['width'] / units, h['params']['height'] / units, h['params'][
             'depth'] / units)['sub'](g)['divideScalar'](2),
           'width': h['params']['width'] / units,
           'height': h['params']['height'] / units,
           'depth': h['params']['depth'] / units
         };
       if (0 != i['diff']['x'] || 0 != i['diff']['y'] || 0 != i['diff']['z']) {
         for (let j = 0; j < h['model']['children']['length']; j++)
           set_size_buff(h['model']['children'][j], h['model']['children'][j]['name'], i),
           correct_uv_buff(Model_utils['get_model_from_cache'](h['params']['model'])['geometry'][j], h['model'][
             'children'
           ][j]['geometry']),
           h['model']['children'][j]['geometry']['attributes']['position']['needsUpdate'] = true,
           h['model']['children'][j]['geometry']['attributes']['uv']['needsUpdate'] = true;
         this['model']['rotation']['copy'](f);
       }
     },
     Simple_model['prototype']['reset_model'] = function(f) {
       var g = f,
         h, i = [];
       if ((g = f ? f : this)['traverse'](function(j) {
           g === j || 'Group' === j['type'] || j['no_reset'] || i.push(j);
         }),
         i.length) {
         for (h = i.length - 1; - 1 < h; h--)
           i[h]['parent']['remove'](i[h]),
           i[h]['geometry'] && i[h]['geometry']['dispose'](),
           i[h]['material'] && !isArray(i[h]['material']) && i[h]['material']['map'] && i[h]['material']['map'][
             'dispose'
           ](),
           i['splice'](i['indexOf'](i[h]), 1);
       }
     },
     Simple_model['prototype']['edges_mode'] = PPObject['prototype']['edges_mode'],
     Simple_model['prototype']['edges_mode_traverse'] = PPObject['prototype']['edges_mode_traverse'],
     Simple_model['prototype']['design_mode'] = function() {
       this['load_model']();
     },
     washes_catalog = {
       1: {
         'id': 1,
         'name': 'Мойка\x201',
         'price': 0,
         'model': '/common_assets/models/washes/m1.fbx',
         'icon': '/common_assets/models/washes/m1icon.jpg',
         'width': 496,
         'height': 205,
         'depth': 480,
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
               'color': '#757873',
               'roughness': '0.8',
               'metalness': '0.2'
             },
             'type': 'Standart'
           },
           'name': 'Металл\x20Черный',
           'price': '1000'
         }]
       },
       2: {
         'id': 2,
         'name': 'Мойка\x202',
         'code': '',
         'price': 0,
         'model': '/common_assets/models/washes/m2.fbx',
         'icon': '/common_assets/models/washes/m2icon.jpg',
         'width': 488,
         'height': 202,
         'depth': 396,
         'smes_rotation': 45,
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
               'color': '#757873',
               'roughness': '0.8',
               'metalness': '0.2'
             },
             'type': 'Standart'
           },
           'name': 'Металл\x20Черный',
           'price': '1000'
         }]
       },
       3: {
         'id': 3,
         'name': 'Мойка\x203',
         'price': 0,
         'model': '/common_assets/models/washes/m3.fbx',
         'icon': '/common_assets/models/washes/m3icon.jpg',
         'width': 591,
         'height': 192,
         'depth': 398,
         'smes_rotation': 45,
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
               'color': '#757873',
               'roughness': '0.8',
               'metalness': '0.2'
             },
             'type': 'Standart'
           },
           'name': 'Металл\x20Черный',
           'price': '1000'
         }]
       },
       4: {
         'id': 4,
         'name': 'Мойка\x204',
         'price': 0,
         'model': '/common_assets/models/washes/m4.fbx',
         'icon': '/common_assets/models/washes/m4icon.jpg',
         'width': 493,
         'height': 180,
         'depth': 412,
         'smes_rotation': 90,
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
               'color': '#757873',
               'roughness': '0.8',
               'metalness': '0.2'
             },
             'type': 'Standart'
           },
           'name': 'Металл\x20Черный',
           'price': '1000'
         }]
       },
       5: {
         'id': 5,
         'name': 'Мойка\x205',
         'price': 0,
         'model': '/common_assets/models/washes/m5.fbx',
         'icon': '/common_assets/models/washes/m5icon.jpg',
         'width': 585,
         'height': 194,
         'depth': 475,
         'smes_rotation': 45,
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
               'color': '#757873',
               'roughness': '0.8',
               'metalness': '0.2'
             },
             'type': 'Standart'
           },
           'name': 'Металл\x20Черный',
           'price': '1000'
         }]
       },
       6: {
         'id': 6,
         'name': 'Мойка\x206',
         'price': 0,
         'model': '/common_assets/models/washes/m6.fbx',
         'icon': '/common_assets/models/washes/m6icon.jpg',
         'width': 750,
         'height': 210,
         'depth': 490,
         'smes_rotation': 45,
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
               'color': '#757873',
               'roughness': '0.8',
               'metalness': '0.2'
             },
             'type': 'Standart'
           },
           'name': 'Металл\x20Черный',
           'price': '1000'
         }]
       },
       0: {
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
       }
     },
     smes_catalog = {
       1: {
         'id': 1,
         'model': '/common_assets/models/washes/smes1.fbx',
         'icon': '/common_assets/models/washes/sm1icon.jpg',
         'name': 'Смеситель\x201',
         'width': 90,
         'height': 301,
         'depth': 216,
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
         }
       },
       2: {
         'id': 2,
         'model': '/common_assets/models/washes/smes2.fbx',
         'icon': '/common_assets/models/washes/sm2icon.jpg',
         'width': 57,
         'height': 153,
         'depth': 203,
         'name': 'Смеситель\x202',
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
         }
       },
       3: {
         'id': 3,
         'model': '/common_assets/models/washes/smes3.fbx',
         'icon': '/common_assets/models/washes/sm3icon.jpg',
         'width': 39,
         'height': 225,
         'depth': 161,
         'name': 'Смеситель\x203',
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
         }
       },
       4: {
         'id': 4,
         'model': '/common_assets/models/washes/smes4.fbx',
         'icon': '/common_assets/models/washes/sm4icon.jpg',
         'width': 57,
         'height': 121,
         'depth': 268,
         'name': 'Смеситель\x204'
       },
       5: {
         'id': 5,
         'model': '/common_assets/models/washes/smes5.fbx',
         'icon': '/common_assets/models/washes/sm5icon.jpg',
         'width': 116,
         'height': 194,
         'depth': 134,
         'name': 'Смеситель\x205'
       },
       6: {
         'id': 6,
         'model': '/common_assets/models/washes/smes6.fbx',
         'icon': '/common_assets/models/washes/sm6icon.jpg',
         'width': 60,
         'height': 250,
         'depth': 185,
         'name': 'Смеситель\x206'
       },
       7: {
         'id': 7,
         'model': '/common_assets/models/washes/smes7.fbx',
         'icon': '/common_assets/models/washes/sm7icon.jpg',
         'width': 100,
         'height': 315,
         'depth': 202,
         'name': 'Смеситель\x207'
       },
       8: {
         'id': 8,
         'model': '/common_assets/models/washes/smes8.fbx',
         'icon': '/common_assets/models/washes/sm8icon.jpg',
         'width': 67,
         'height': 285,
         'depth': 161,
         'name': 'Смеситель\x208'
       },
       0: {
         'id': 0,
         'model': '/common_assets/models/washes/smes1.fbx',
         'icon': '/common_assets/models/washes/sm1icon.jpg',
         'width': 90,
         'height': 301,
         'depth': 216
       }
     },
     (smes_lib = new lib({
       'id': 0,
       'model': '/common_assets/models/washes/smes1.fbx',
       'icon': '/common_assets/models/washes/sm1icon.jpg',
       'width': 90,
       'height': 301,
       'depth': 216
     }, category_0))['add_category'](1, {
       1: {
         'id': 1,
         'active': 1,
         'name': 'Смесители'
       }
     }),
     Object['keys'](smes_catalog)['forEach'](function(f) {
       smes_catalog[f]['active'] = 1,
         smes_catalog[f]['category'] = 1,
         smes_lib['add_item'](f, copy_object(smes_catalog[f]));
     }),
     washes_materials_catalog = {
       'categories': {
         1: {
           'id': 1,
           'name': 'Нержавеющая\x20сталь'
         },
         2: {
           'id': 2,
           'name': 'Камень'
         }
       },
       'items': {
         1: {
           'id': 1,
           'add_params': {
             'real_width': '1024',
             'real_height': '1024',
             'stretch_width': '1',
             'stretch_height': '1',
             'wrapping': 'mirror'
           },
           'params': {
             'color': '#ffffff',
             'roughness': '0.2',
             'metalness': '0.2',
             'side': 'double'
           },
           'type': 'Standart',
           'name': 'Белый',
           'category': 1
         },
         2: {
           'id': 2,
           'add_params': {
             'real_width': '1024',
             'real_height': '1024',
             'stretch_width': '1',
             'stretch_height': '1',
             'wrapping': 'mirror'
           },
           'params': {
             'color': '#757873',
             'roughness': '0.2',
             'metalness': '0.2',
             'side': 'double'
           },
           'type': 'Standart',
           'name': 'Черный',
           'category': 1
         },
         3: {
           'id': 3,
           'add_params': {
             'real_width': '1024',
             'real_height': '1024',
             'stretch_width': '1',
             'stretch_height': '1',
             'wrapping': 'mirror'
           },
           'params': {
             'color': '#ac8900',
             'roughness': '0.2',
             'metalness': '0.2',
             'side': 'double'
           },
           'type': 'Standart',
           'name': 'Бронза',
           'category': 1
         },
         4: {
           'id': 4,
           'add_params': {
             'real_width': 16,
             'real_height': 16,
             'stretch_width': false,
             'stretch_height': false,
             'wrapping': 'mirror'
           },
           'params': {
             'color': '#ffffff',
             'map': '/common_assets/images/washes/bezh.jpg',
             'roughness': '0.6',
             'metalness': '0',
             'side': 'double'
           },
           'type': 'Standart',
           'name': 'Бежевый',
           'category': 2
         },
         5: {
           'id': 5,
           'add_params': {
             'real_width': 16,
             'real_height': 16,
             'stretch_width': false,
             'stretch_height': false,
             'wrapping': 'mirror'
           },
           'params': {
             'color': '#ffffff',
             'map': '/common_assets/images/washes/black.jpg',
             'roughness': '0.6',
             'metalness': '0',
             'side': 'double'
           },
           'type': 'Standart',
           'name': 'Черный',
           'category': 2
         },
         6: {
           'id': 6,
           'add_params': {
             'real_width': 16,
             'real_height': 16,
             'stretch_width': false,
             'stretch_height': false,
             'wrapping': 'mirror'
           },
           'params': {
             'color': '#ffffff',
             'map': '/common_assets/images/washes/chokolate.jpg',
             'roughness': '0.6',
             'metalness': '0',
             'side': 'double'
           },
           'type': 'Standart',
           'name': 'Шоколад',
           'category': 2
         },
         7: {
           'id': 7,
           'add_params': {
             'real_width': 16,
             'real_height': 16,
             'stretch_width': false,
             'stretch_height': false,
             'wrapping': 'mirror'
           },
           'params': {
             'color': '#ffffff',
             'map': '/common_assets/images/washes/granat.jpg',
             'roughness': '0.6',
             'metalness': '0'
           },
           'type': 'Standart',
           'name': 'Гранат',
           'category': 2
         },
         8: {
           'id': 8,
           'add_params': {
             'real_width': 16,
             'real_height': 16,
             'stretch_width': false,
             'stretch_height': false,
             'wrapping': 'mirror'
           },
           'params': {
             'color': '#ffffff',
             'map': '/common_assets/images/washes/gray.jpg',
             'roughness': '0.6',
             'metalness': '0'
           },
           'type': 'Standart',
           'name': 'Серый',
           'category': 2
         },
         9: {
           'id': 9,
           'add_params': {
             'real_width': 16,
             'real_height': 16,
             'stretch_width': false,
             'stretch_height': false,
             'wrapping': 'mirror'
           },
           'params': {
             'color': '#ffffff',
             'map': '/common_assets/images/washes/inei.jpg',
             'roughness': '0.6',
             'metalness': '0'
           },
           'type': 'Standart',
           'name': 'Иней',
           'category': 2
         },
         10: {
           'id': 10,
           'add_params': {
             'real_width': 16,
             'real_height': 16,
             'stretch_width': false,
             'stretch_height': false,
             'wrapping': 'mirror'
           },
           'params': {
             'color': '#ffffff',
             'map': '/common_assets/images/washes/sand.jpg',
             'roughness': '0.6',
             'metalness': '0'
           },
           'type': 'Standart',
           'name': 'Песок',
           'category': 2
         },
         11: {
           'id': 11,
           'add_params': {
             'real_width': 16,
             'real_height': 16,
             'stretch_width': false,
             'stretch_height': false,
             'wrapping': 'mirror'
           },
           'params': {
             'color': '#ffffff',
             'map': '/common_assets/images/washes/terrakot.jpg',
             'roughness': '0.6',
             'metalness': '0'
           },
           'type': 'Standart',
           'name': 'Терракот',
           'category': 2
         },
         12: {
           'id': 12,
           'add_params': {
             'real_width': 16,
             'real_height': 16,
             'stretch_width': false,
             'stretch_height': false,
             'wrapping': 'mirror'
           },
           'params': {
             'color': '#ffffff',
             'map': '/common_assets/images/washes/vanilla.jpg',
             'roughness': '0.6',
             'metalness': '0'
           },
           'type': 'Standart',
           'name': 'Ваниль',
           'category': 2
         }
       }
     },
     wmc_copy = copy_object(washes_materials_catalog),
     washes_materials_lib = new lib(material_0, category_0),
     pp['libs']['washes_materials_lib'] = washes_materials_lib,
     Object['keys'](wmc_copy['categories'])['forEach'](function(f) {
       washes_materials_catalog['categories'][f]['active'] = 1,
         washes_materials_lib['add_category'](f, copy_object(washes_materials_catalog['categories'][f]));
     }),
     Object['keys'](wmc_copy['items'])['forEach'](function(f) {
       washes_materials_catalog['items'][f]['active'] = 1,
         washes_materials_lib['add_item'](f, copy_object(washes_materials_catalog['items'][f]));
     }),
     setTimeout(function() {
       build_washes_materials_tree(washes_materials_catalog);
     }, 100);
 class IDBStorage {
   constructor(f) {
       this['clientId'] = this['normalizeClientId'](f),
         this['dbName'] = 'PlanPlace_Storage_Client_' + this['clientId'],
         this['storeName'] = 'PlanPlace_data',
         this['db'] = null;
     }
     ['normalizeClientId'](f) {
       return f.replace(/[^a-z0-9_\-]/gi, '_');
     }
   async ['openDatabase']() {
     return new Promise((f, g) => {
       var h;
       this['db'] ? f(this['db']) : ((h = indexedDB['open'](this['dbName'], 1))['onupgradeneeded'] = i => {
           var i = i['target']['result'];
           i['objectStoreNames']['contains'](this['storeName']) || i['createObjectStore'](this['storeName'], {
             'keyPath': 'id'
           });
         },
         h['onsuccess'] = i => {
           this['db'] = i['target']['result'],
             this['db']['onclose'] = () => {
               this['db'] = null;
             },
             f(this['db']);
         },
         h['onerror'] = i => {
           g('IndexedDB\x20error:\x20' + i['target']['error']);
         }
       );
     });
   }
   async ['saveZipFile'](e, f) {
     let g = await this['openDatabase']();
     return new Promise((h, j) => {
       var k, l, m = g['transaction'](this['storeName'], 'readwrite')['objectStore'](this['storeName'])['put']({
         'id': e,
         'file': f,
         'timestamp': Date['now']()
       });
       m['onsuccess'] = () => h(),
         m['onerror'] = p => j('Save\x20error:\x20' + p['target']['error']);
     });
   }
   async ['getZipFile'](e) {
     let f = await this['openDatabase']();
     return new Promise((g, h) => {
       var j, k, l = f['transaction'](this['storeName'], 'readonly')['objectStore'](this['storeName'])['get'](e);
       l['onsuccess'] = m => {
           var m = m['target']['result'];
           m && m['file'] ? g(m['file']) : h(new Error('File\x20not\x20found'));
         },
         l['onerror'] = m => h('Get\x20error:\x20' + m['target']['error']);
     });
   }
   async ['deleteZipFile'](e) {
     let f = await this['openDatabase']();
     return new Promise((g, h) => {
       var j, k, l = f['transaction'](this['storeName'], 'readwrite')['objectStore'](this['storeName'])['delete'](
         e);
       l['onsuccess'] = () => g(),
         l['onerror'] = m => h('Delete\x20error:\x20' + m['target']['error']);
     });
   }
   async ['listZipFiles']() {
     let e = await this['openDatabase']();
     return new Promise((f, g) => {
       var h, j, k = e['transaction'](this['storeName'], 'readonly')['objectStore'](this['storeName'])['getAll']
     ();
       k['onsuccess'] = l => {
           var l = l['target']['result']['map'](m => ({
             'id': m['id'],
             'timestamp': m['timestamp']
           }));
           f(l);
         },
         k['onerror'] = l => g('List\x20error:\x20' + l['target']['error']);
     });
   }
   async ['getStorageInfo']() {
     var f = await this['openDatabase']();
     return {
       'name': f['name'],
       'version': f['version'],
       'clientId': this['clientId'],
       'objectStoreNames': f['objectStoreNames'],
       'estimatedSize': await this['estimateDatabaseSize']()
     };
   }
   async ['estimateDatabaseSize']() {
     return new Promise(e => {
       navigator['storage'] && navigator['storage']['estimate'] ? navigator['storage']['estimate']()['then'](
       f => {
         e(f['usage'] || 0);
       })['catch'](() => e(0)) : e(0);
     });
   }
   async ['getJsonFromZip'](f, g = 'project.json') {
     try {
       var h = await this['getZipFile'](f),
         j, k, l = (await new JSZip()['loadAsync'](h))['file'](g),
         m;
       if (l)
         return m = await l['async']('text'),
           JSON['parse'](m);
       throw new Error('Файл\x20' + g + '\x20не\x20найден\x20в\x20архиве');
     } catch (n) {
       return null;
     }
   }
 }

 function getClientIdFromUrl() {
   var f, g = window['location']['pathname']['match'](/\/clients\/([^\/]+)/);
   return g ? g[1] : 'default';
 }
 sc['find_groups'] = function(j, k, q, w, A, B) {
     q = q || S,
       w = w || T,
       A = A || U;
     let C = k ? j.filter(k) : j['slice']();
     C = C.filter(Q);
     var D = new THREE['Box3'](),
       E = new THREE['Box3']();
     for (let W = 0; W < C.length - 1; W++) {
       var F = C[W];
       q(F, D),
         D['expandByScalar'](0.05);
       for (let Z = W + 1; Z < C.length; Z++) {
         var G = C[Z];
         q(G, E),
           w(F, G, D, E) && (R(F, G),
             R(G, F));
       }
     }
     var H = [],
       I = new Set(),
       J;
     for (J of C)
       if (!I['has'](J)) {
         I['add'](J);
         var K = [J];
         let a0 = 0;
         for (; a0 < K.length;) {
           var L = K[a0]['userData']['near'];
           if (L && L.length) {
             for (var N of L)
               I['has'](N) || (I['add'](N),
                 K.push(N));
           }
           a0 += 1;
         }
         D['makeEmpty']();
         var O = A(K, D, E),
           P = {
             'box': D['clone'](),
             'items': K
           };
         if (O && (P['info'] = O,
             B) && O['axis']) {
           let a1 = 'x' === O['axis']['slice'](-1) ? 'z' : 'x';
           K['sort']((a2, a3) => a2['box']['min'][a1] - a3['box']['min'][a1]),
             P['start'] = K[0],
             P['end'] = K[K.length - 1];
         }
         H.push(P);
       }
     return H;

     function Q(a2) {
       a2['box']['update'] && a2['box']['update']();
       var a3 = a2['userData']['near'],
         a3, a2;
       return a3 && a3.length && a3['splice'](0, a3.length),
         !a2['get_forward'] || (a3 = 0.05,
           a2 = a2['get_forward'](),
           Math['abs'](Math['abs'](a2['x']) - 1) < a3) || Math['abs'](Math['abs'](a2['z']) - 1) < a3;
     }

     function R(a2, a3) {
       a2['userData']['near'] || (a2['userData']['near'] = []),
         a2['userData']['near']['push'](a3);
     }

     function S(a2, a3) {
       a3['copy'](a2['box']),
         a2['cornice'] && a2['cornice']['children']['length'] && a3['expandByObject'](a2['cornice']),
         a2['cokol_top'] && a2['cokol_top']['children']['length'] && a3['expandByObject'](a2['cokol_top']);
     }

     function T(a2, a3, a4, a5) {
       return a4['intersectsBox'](a5);
     }

     function U(a2, a3, a4) {
       q(a2[0], a4),
         a3['copy'](a4);
       for (let a5 = 1; a5 < a2.length; a5++)
         q(a2[a5], a4),
         a3['union'](a4);
     }
   },
   sc['find_cokol_groups'] = function(f) {
     if (!constructor_settings['core_v2'])
       return sc['find_cokol_groups_legacy'](f);
     var g = 0.05,
       h = [],
       j = new THREE['Box3'](),
       k, p, q, u;
     for (k of d_objects) {
       var v = k['userData']['params'] && 'module' === k['userData']['params']['type'];
       if (v || 'Cabinet' === k['params']['type']) {
         let B;
         if ((B = v ? {
             'enabled': 1,
             'material': 1
           } : f ? k['params']['cokol_top'] : k['params']['cokol']) && B['enabled'] && !B['disabled'] && 0 !== B[
             'height']) {
           var v = k['userData']['parts'];
           if (v) {
             var v = f ? v['cokol_top'] : v['cokol'];
             if (v && v.length) {
               for (var w of v)
                 if (w['visible']) {
                   j['setFromObject'](w['userData']['own_object']);
                   var y = w['_get_forward'](),
                     z = Math['abs'](Math['abs'](y['x']) - 1) < g || Math['abs'](Math['abs'](y['z']) - 1) < g,
                     A, y;
                   let C = '',
                     D = (z && (A = Math['abs'](Math['abs'](y['z']) - 1) < g ? 'z' : 'x',
                         y = Math['sign'](y[A]),
                         C = (y < 0 ? '-' : '') + A),
                       null);
                   w['userData'] && 0 !== (D = w['userData']['item_id']) && !D && w['userData']['params'] && w[
                     'userData']['params']['spec'] && 0 !== (D = w['userData']['params']['spec']['id']) && (D = D ||
                     null);
                   var y = {
                     'type': 'fake_obj',
                     'userData': {},
                     'box': j['clone'](),
                     'axis': C,
                     'itemId': D,
                     'materialId': B['material'],
                     'cokolType': w['userData']?.['params']?.['spec']?.['type'],
                     'cokol': w,
                     'sourceObject': k
                   };
                   z || (y['width'] = w['userData']['computed']['size']['x']),
                     h.push(y);
                 }
             }
           }
         }
       }
     }
     return sc['find_groups'](h, null, (E, F) => {}, (E, F, G, H) => {
       var I, J, F, K, L, N, K;
       return !(!E['axis'] || E['axis'] !== F['axis'] || E['materialId'] !== F['materialId'] || E['cokolType'] !==
         F['cokolType'] || (I = 0.05,
           K = (J = E['box'])['max']['y'] - J['min']['y'],
           L = (F = F['box'])['max']['y'] - F['min']['y'],
           Math['abs'](K - L) > I) || Math['abs'](J['min']['y'] - F['min']['y']) > I || (N = E['axis']['slice'](-
             1),
           J['max'][K = 'x' === N ? 'z' : 'x'] + I < F['min'][K]) || J['min'][K] - I > F['max'][K] || !(Math[
           'abs'](J['min'][N] - F['min'][N]) < I)) && Math['abs'](J['max'][N] - F['max'][N]) < I;
     }, (E, F, G) => {
       F['copy'](E[0]['box']);
       for (let J = 1; J < E.length; J++)
         F['union'](E[J]['box']);
       let H;
       var I;
       return {
         'width': H = E[0]['axis'] ? (I = 'x' === E[0]['axis']['slice'](-1) ? 'z' : 'x',
           H = F['max'][I] - F['min'][I],
           (!Number['isFinite'](H) || H < 0) && (H = 0),
           c_round(H * units)) : (H = E[0]['width'],
           (!Number['isFinite'](H) || H < 0) && (H = 0),
           c_round(H)),
         'axis': E[0]['axis'],
         'itemId': E[0]['itemId'],
         'cokolType': E[0]['cokolType']
       };
     });
   },
   sc['find_cokol_groups_legacy'] = function(f) {
     if (f)
       return [];
     var g = 0.05,
       h = [],
       j = new THREE['Box3'](),
       k, p, q, u;
     for (k of d_objects)
       if ('Cabinet' === k['params']['type']) {
         var v = k['params']['cokol'];
         if (v && v['enabled'] && !v['disabled'] && 0 !== v['height']) {
           var w = k['cokol'],
             w;
           if ((w = _.filter(w && w['children'], B => 'CabinetCokol' === B['temp_type'])) && w.length) {
             for (var y of w)
               if (y['visible']) {
                 j['setFromObject'](y);
                 var y = y['get_forward'](),
                   z, A, y;
                 let B = '';
                 (Math['abs'](Math['abs'](y['x']) - 1) < g || Math['abs'](Math['abs'](y['z']) - 1) < g) && (A =
                   Math['abs'](Math['abs'](y['z']) - 1) < g ? 'z' : 'x',
                   y = Math['sign'](y[A]),
                   B = (y < 0 ? '-' : '') + A,
                   width = 'z' == A ? j['max']['z'] - j['min']['z'] : j['max']['x'] - j['min']['x']);
                 var y = {
                   'type': 'fake_obj',
                   'userData': {},
                   'box': j['clone'](),
                   'axis': B,
                   'materialId': v['material'],
                   'sourceObject': k
                 };
                 h.push(y);
               }
           }
         }
       }
     return sc['find_groups'](h, null, (C, D) => {}, (C, D, E, F) => {
       var G, H, D, I, J, K, I;
       return !(!C['axis'] || C['axis'] !== D['axis'] || C['materialId'] !== D['materialId'] || (G = 0.05,
         I = (H = C['box'])['max']['y'] - H['min']['y'],
         J = (D = D['box'])['max']['y'] - D['min']['y'],
         Math['abs'](I - J) > G) || Math['abs'](H['min']['y'] - D['min']['y']) > G || (K = C['axis']['slice'](-
           1),
         H['max'][I = 'x' === K ? 'z' : 'x'] + G < D['min'][I]) || H['min'][I] - G > D['max'][I] || !(Math[
         'abs'](H['min'][K] - D['min'][K]) < G)) && Math['abs'](H['max'][K] - D['max'][K]) < G;
     }, (C, D, E) => {
       D['copy'](C[0]['box']);
       for (let H = 1; H < C.length; H++)
         D['union'](C[H]['box']);
       let F;
       var G;
       return {
         'width': F = C[0]['axis'] ? (G = 'x' === C[0]['axis']['slice'](-1) ? 'z' : 'x',
           F = D['max'][G] - D['min'][G],
           (!Number['isFinite'](F) || F < 0) && (F = 0),
           c_round(F * units)) : (F = C[0]['width'],
           (!Number['isFinite'](F) || F < 0) && (F = 0),
           c_round(F)),
         'axis': C[0]['axis'],
         'materialId': C[0]['materialId']
       };
     });
   },
   sc['count_cokol_groups_corners'] = function(f) {
     if (!f || !f.length)
       return 0;
     let g = 0;
     var h = new THREE['Box3']();
     for (let p = 0; p < f.length; p++)
       if (f[p]['items']['length']) {
         var j = f[p];
         if (j['info']['axis']) {
           var k = j['info']['axis']['slice'](-1),
             l, m;
           h['copy'](j['box']),
             h['expandByScalar'](0.05);
           for (let q = p + 1; q < f.length; q++) {
             f[q]['items']['length'] && (l = f[q])['info']['axis'] && k !== l['info']['axis']['slice'](-1) && h[
               'intersectsBox'](l['box']) && (g += 1);
           }
         } else
           g += 2;
       }
     return g;
   },
   sc['find_tabletop_groups'] = function(h, j, k) {
     if (!constructor_settings['core_v2'])
       return sc['find_tabletop_groups_legacy'](h, j, k);
     let q = 0.05;
     var v = [],
       w = new THREE['Box3'](),
       y, z, A;
     for (z of k || d_objects) {
       if (z['userData']['params'] && 'module' === z['userData']['params']['type'] || z['params']['tabletop'] && z[
           'params']['tabletop']['autogen']) {
         var B = z['userData']['parts'];
         if (B && B['tabletop'] && B['tabletop']['length'])
           for (var C of B['tabletop']) {
             w['setFromObject'](C['userData']['own_object']);
             var D = C['_get_forward'](),
               E = Math['abs'](Math['abs'](D['z']) - 1) < q ? 'z' : 'x',
               D = Math['sign'](D[E]),
               D = {
                 'type': 'fake_obj',
                 'userData': {},
                 'box': w['clone'](),
                 'axis': (D < 0 ? '-' : '') + E,
                 'tabletop': C,
                 'sourceObject': z
               };
             v.push(D);
           }
       }
     }
     var F, G, H, k = J => {
         var K = new THREE['Vector3'](),
           L = new THREE['Box3'](),
           N = new THREE['Box3']();
         for (let a4 of J) {
           L['copy'](a4['box']),
             round_vec(L);
           var O = L,
             P = 2 === a4['info']['axis']['length'] ? -1 : 1,
             Q = a4['info']['axis']['slice'](-1),
             R = (K['set']('x' === Q ? P : 0, 0, 'z' === Q ? P : 0), {
               'front': [],
               'back': [],
               'left': [],
               'right': []
             }),
             S = (a4['info']['edges'] = R,
               PPObject['prototype']['find_around']['call'](a4, false, O, K, J, 0.4)),
             T;
           for (T in R) {
             var U = R[T],
               W;
             let a5 = ('front' === T || 'back' === T) ^ 'z' === Q ? 'x' : 'z',
               a6 = 'z' == a5 ? 'x' : 'z',
               a7 = 'front' === T || T === ('z' === Q ? 'left' : 'right') ? P : -P;
             var Z = O['max'][a6] - O['min'][a6],
               a0 = S[T]['filter'](a8 => !(a7 < 0 && Math['abs'](a4['box']['min'][a5] - a8['box']['max'][a5]) > q ||
                 0 < a7 && Math['abs'](a4['box']['max'][a5] - a8['box']['min'][a5]) > q));
             if (a0['sort']((a8, a9) => a8['box']['min'][a6] - a9['box']['min'][a6]),
               a0.length) {
               let a8 = O['min'][a6],
                 a9 = 0;
               for (let aa = 0; aa < a0.length; aa++) {
                 N['copy'](a0[aa]['box']),
                   round_vec(N);
                 var a1 = N,
                   a2 = a0[aa + 1];
                 if (a1['min'][a6] <= O['min'][a6] && a1['max'][a6] >= O['max'][a6])
                   U.push({
                     'type': 1,
                     'start': 0,
                     'end': Z,
                     'len': Z
                   });
                 else {
                   var a3 = Math['min'](a1['max'][a6], O['max'][a6]);
                   let ab = 0;
                   1 < a1['min'][a6] - a8 && 0 == a9 && (1 <= (ab = a1['min'][a6] - a8) && U.push({
                         'type': 0,
                         'start': a8 - O['min'][a6],
                         'end': a1['min'][a6] - O['min'][a6],
                         'len': ab
                       }),
                       a8 = a1['min'][a6]),
                     a2 ? c_round(a2['box']['min'][a6]) - a3 < 1 ? a9 = 1 : (1 <= (ab = a3 - a8) && U.push({
                         'type': 1,
                         'start': a8 - O['min'][a6],
                         'end': a3 - O['min'][a6],
                         'len': ab
                       }),
                       a9 = 0,
                       a8 = a3) : (1 < a1['max'][a6] - a8 && 1 <= (ab = a3 - a8) && U.push({
                         'type': 1,
                         'start': a8 - O['min'][a6],
                         'end': a3 - O['min'][a6],
                         'len': ab
                       }),
                       a8 = a3,
                       1 < O['max'][a6] - a8 && 1 <= (ab = O['max'][a6] - a8) && U.push({
                         'type': 0,
                         'start': a8 - O['min'][a6],
                         'end': Z,
                         'len': ab
                       }));
                 }
               }
             } else
               U.push({
                 'type': 0,
                 'start': 0,
                 'end': Z,
                 'len': Z
               });
           }
         }
       },
       I = sc['find_groups'](v, null, (J, K) => {}, (J, K, L, N) => {
         if (J['axis']['slice'](-1) !== K['axis']['slice'](-1))
           return false;
         var O = J['tabletop']['userData']['params']['spec'],
           P = K['tabletop']['userData']['params']['spec'],
           Q = O['material']['id'],
           R = P['material']['id'],
           S = O['material']['variant_id'],
           T = P['material']['variant_id'];
         if (!O['can_group'] || !P['can_group'])
           return false;
         if (Q !== R)
           return false;
         var O = project_settings['defaults']['tabletop_variant'] || 0,
           P = _['get'](tabletop_lib['get_item'](project_settings['defaults']['tabletop']), 'params.variants[' + O +
             '].thickness', project_settings['tabletop_thickness']),
           U, W;
         if (_['get'](tabletop_lib['get_item'](Q), 'params.variants[' + S + '].thickness', P) !== _['get'](
             tabletop_lib['get_item'](R), 'params.variants[' + T + '].thickness', P))
           return false;
         let Z = 0.05;
         var O = J['box'],
           Q = K['box'],
           S, R;
         return !(Math['abs'](O['min']['y'] - Q['min']['y']) > Z) && (S = J['axis']['slice'](-1),
             !(O['max'][R = 'x' === S ? 'z' : 'x'] + Z < Q['min'][R] || O['min'][R] - Z > Q['max'][R])) && Math['abs']
           (O['min'][S] - Q['min'][S]) < Z && Math['abs'](O['max'][S] - Q['max'][S]) < Z && a0(J, K);

         function a0(a1, a2) {
           var a3 = a1['tabletop']['userData']['bortOffsets'],
             a4 = a2['tabletop']['userData']['bortOffsets'],
             a5, a6 = 'x' === a1['axis']['slice'](-1) ? 'z' : 'x',
             a1;
           if (!a3 && !a4)
             return !h || Math['abs'](a1['box']['max'][a6] - a2['box']['min'][a6]) < Z;
           let a7 = {
               'obj': a1,
               'box': a1['box'],
               'axis': a1['axis'],
               'offsets': a3 || {
                 'c1': 0,
                 'c2': 0,
                 'c3': 0,
                 'c4': 0
               }
             },
             a8 = {
               'obj': a2,
               'box': a2['box'],
               'axis': a2['axis'],
               'offsets': a4 || {
                 'c1': 0,
                 'c2': 0,
                 'c3': 0,
                 'c4': 0
               }
             };
           a7['box']['min'][a6] > a8['box']['min'][a6] && (a1 = a7,
             a7 = a8,
             a8 = a1);
           var a3 = Math['max'](a7['offsets']['c1'], a7['offsets']['c2']),
             a2 = Math['max'](a7['offsets']['c3'], a7['offsets']['c4']),
             a4 = Math['max'](a8['offsets']['c1'], a8['offsets']['c2']),
             a1 = Math['max'](a8['offsets']['c3'], a8['offsets']['c4']),
             a9 = 'z' === a7['axis'] || '-x' === a7['axis'],
             aa = 'z' === a8['axis'] || '-x' === a8['axis'],
             ab = a9 ? a2 : a3,
             ac = aa ? a4 : a1,
             a9 = a9 ? a3 : a2,
             a3 = aa ? a1 : a4;
           return (!j || 0 === ab && 0 === ac) && (h ? Math['abs'](a7['box']['max'][a6] - a8['box']['min'][a6]) <
             Z : !(a7['box']['min'][a6] + a9 > a8['box']['min'][a6] || a7['box']['max'][a6] > a8['box']['max'][a6] -
               a3 || a8['box']['min'][a6] + ac > a7['box']['max'][a6] - ab + Z));
         }
       }, (J, K, L) => {
         K['copy'](J[0]['box']);
         for (let ak = 1; ak < J.length; ak++)
           K['union'](J[ak]['box']);
         var N = J[0]['axis']['slice'](-1),
           P = 'x' === N ? 'z' : 'x',
           N = new THREE['Vector3'](aj(K, P), aj(K, 'y'), aj(K, N)),
           Q = 0.05,
           R = J[0]['tabletop']['userData']['params']['spec']['type_params'],
           S = J[0]['tabletop']['userData']['bortOffsets'] || {
             'c1': 0,
             'c2': 0,
             'c3': 0,
             'c4': 0
           },
           T = {
             'corners_equal': 0,
             'c1': {
               'type': R['c1']['type'],
               'val': S['c1'] * units
             },
             'c2': {
               'type': R['c2']['type'],
               'val': S['c2'] * units
             },
             'c3': {
               'type': R['c3']['type'],
               'val': S['c3'] * units
             },
             'c4': {
               'type': R['c4']['type'],
               'val': S['c4'] * units
             }
           };
         let U = J[0]['box']['min'][P],
           W = J[0]['box']['max'][P];
         var Z = {
             'c1': S['c1'],
             'c2': S['c2'],
             'c3': S['c3'],
             'c4': S['c4']
           },
           a0 = 'z' === J[0]['axis'] || '-x' === J[0]['axis'],
           R = J[0]['tabletop']['userData']['params']['spec']['can_euro'],
           a1 = {
             'c1': R,
             'c2': R,
             'c3': R,
             'c4': R
           };
         for (let al = 1; al < J.length; al++) {
           var a2 = J[al],
             a3 = a2['tabletop']['userData']['params']['spec']['type_params'],
             a4 = a2['tabletop']['userData']['params']['spec']['can_euro'],
             a5 = a2['tabletop']['userData']['bortOffsets'] || {
               'c1': 0,
               'c2': 0,
               'c3': 0,
               'c4': 0
             },
             a6 = a2['box'],
             a7 = Math['max'](Z['c1'], Z['c2']),
             a8 = Math['max'](Z['c3'], Z['c4']),
             a2 = 'z' === a2['axis'] || '-x' === a2['axis'],
             a9 = Math['max'](a5['c1'], a5['c2']),
             aa = Math['max'](a5['c3'], a5['c4']),
             ab, ac, ad, ae, af, ag, ah, ai, ad, af, ae, ag;
           let am = false,
             an = (Math['abs'](a6['min'][P] - U) < Q ? (a2 ? a9 : aa) < (a0 ? a7 : a8) && (am = true) : a6['min'][P] <
               U && (am = true),
               am && (a6['min'][P] < U && (U = a6['min'][P]),
                 ae = a0 ? 'c2' : 'c4',
                 ag = a2 ? 'c2' : 'c4',
                 Z[ad = a0 ? 'c1' : 'c3'] = a5[af = a2 ? 'c1' : 'c3'],
                 Z[ae] = a5[ag],
                 T[ad] = {
                   'type': a3[af]['type'],
                   'val': a5[af] * units
                 },
                 T[ae] = {
                   'type': a3[ag]['type'],
                   'val': a5[ag] * units
                 },
                 a1[ad] = a4,
                 a1[ae] = a4),
               false);
           Math['abs'](a6['max'][P] - W) < Q ? (a2 ? aa : a9) < (a0 ? a8 : a7) && (an = true) : a6['max'][P] > W && (
               an = true),
             an && (a6['max'][P] > W && (W = a6['max'][P]),
               af = a0 ? 'c4' : 'c2',
               ag = a2 ? 'c4' : 'c2',
               Z[ad = a0 ? 'c3' : 'c1'] = a5[ae = a2 ? 'c3' : 'c1'],
               Z[af] = a5[ag],
               T[ad] = {
                 'type': a3[ae]['type'],
                 'val': a5[ae] * units
               },
               T[af] = {
                 'type': a3[ag]['type'],
                 'val': a5[ag] * units
               },
               a1[ad] = a4,
               a1[af] = a4);
         }
         return 0 === T['c1']['val'] && 0 === T['c2']['val'] && 0 === T['c3']['val'] && 0 === T['c4'][
           'val'] && (T['corners_equal'] = 1), {
             'size': N,
             'axis': J[0]['axis'],
             'materialId': J[0]['tabletop']['userData']['params']['spec']['material']['id'],
             'variantId': J[0]['tabletop']['userData']['params']['spec']['material']['variant_id'],
             'typeParams': T,
             'canEuro': a1,
             'groupObject': null,
             'edges': null
           };

         function aj(ao, ap) {
           let aq = ao['max'][ap] - ao['min'][ap];
           return (!Number['isFinite'](aq) || aq < 0) && (aq = 0),
             c_round(aq * units);
         }
       }, true);
     return k(I),
       I;
   },
   sc['find_tabletop_euro_joints'] = function(k) {
     if (!constructor_settings['core_v2'])
       return sc['find_tabletop_euro_joints_legacy'](k);
     if (!k || !k.length)
       return [];
     var q = [],
       w = 0.05,
       A = new THREE['Box3']();
     for (let P = 0; P < k.length - 1; P++)
       if (k[P]['items']['length']) {
         let Q = k[P];
         var B = Q['info']['axis']['slice'](-1);
         A['copy'](Q['box']),
           A['expandByScalar'](0.05);
         for (let R = P + 1; R < k.length; R++)
           if (k[R]['items']['length']) {
             let S = k[R];
             var C = S['info']['axis']['slice'](-1);
             if (B !== C && A['intersectsBox'](S['box'])) {
               var C = Q['box'],
                 D = S['box'];
               let T = null,
                 U = null,
                 W = null,
                 Z = null;
               if (Math['abs'](C['max']['x'] - D['min']['x']) < w ? (T = 'x',
                   U = '-x',
                   W = [3, 4],
                   Z = [2, 1]) : Math['abs'](C['min']['x'] - D['max']['x']) < w ? (T = '-x',
                   U = 'x',
                   W = [2, 1],
                   Z = [3, 4]) : Math['abs'](C['max']['z'] - D['min']['z']) < w ? (T = 'z',
                   U = '-z',
                   W = [1, 4],
                   Z = [2, 3]) : Math['abs'](C['min']['z'] - D['max']['z']) < w && (T = '-z',
                   U = 'z',
                   W = [2, 3],
                   Z = [1, 4]),
                 T) {
                 var E = 'z' === T['slice'](-1) ? 'x' : 'z',
                   F = B === T['slice'](-1),
                   G = F ? S : Q,
                   H = F ? Q : S,
                   I = ['z', 'x', '-z', '-x'],
                   J = I.findIndex(a4 => a4 === Q['info']['axis']),
                   K = I.findIndex(a4 => a4 === S['info']['axis']);
                 if (W[0] = 'c' + O(W[0], J),
                   W[1] = 'c' + O(W[1], J),
                   Z[0] = 'c' + O(Z[0], K),
                   Z[1] = 'c' + O(Z[1], K),
                   F) {
                   if (0 !== S['info']['typeParams'][Z[0]]['val'] || 0 !== S['info']['typeParams'][Z[1]][
                     'val'] || !S['info']['canEuro'][Z[0]] || !S['info']['canEuro'][Z[1]])
                     continue;
                 } else {
                   if (0 !== Q['info']['typeParams'][W[0]]['val'] || 0 !== Q['info']['typeParams'][W[1]][
                     'val'] || !Q['info']['canEuro'][W[0]] || !Q['info']['canEuro'][W[1]])
                     continue;
                 }
                 var L = [C['min'][E] + Q['info']['typeParams'][W[0]]['val'] / units, C['max'][E] - Q['info'][
                     'typeParams'
                   ][W[1]]['val'] / units],
                   N = [D['min'][E] + S['info']['typeParams'][Z[0]]['val'] / units, D['max'][E] - S['info'][
                     'typeParams'
                   ][Z[1]]['val'] / units],
                   L, N, C, D;
                 let a0;
                 if (F) {
                   if (!(L[0] - w <= N[0] && N[0] <= L[1] + w && L[0] - w <= N[1] && N[1] <= L[1] + w))
                     continue;
                   a0 = [D['min'][E] - C['min'][E], D['max'][E] - C['min'][E]];
                 } else {
                   if (!(N[0] - w <= L[0] && L[0] <= N[1] + w && N[0] - w <= L[1] && L[1] <= N[1] + w))
                     continue;
                   a0 = [C['min'][E] - D['min'][E], C['max'][E] - D['min'][E]];
                 }
                 let a1, a2, a3;
                 a3 = F ? (a1 = U,
                   L = I.findIndex(a4 => a4 === U),
                   N = I.findIndex(a4 => a4 === T),
                   a2 = I[O(L + 1, K) - 1],
                   I[O(N + 1, J) - 1]) : (a1 = T,
                   C = I.findIndex(a4 => a4 === T),
                   D = I.findIndex(a4 => a4 === U),
                   a2 = I[O(C + 1, -J) - 1],
                   I[O(D + 1, -K) - 1]);
                 var E = {
                   'fromGroup': G,
                   'toGroup': H,
                   'fromSideLocal': a2,
                   'toSideLocal': a3,
                   'directionGlobal': a1,
                   'jointCoordsGlobal': a0
                 };
                 q.push(E);
               }
             }
           }
       }
     return q;

     function O(a4, a5) {
       return (a4 - 1 + 8 + a5) % 4 + 1;
     }
   },
   sc['find_tabletop_groups_legacy'] = function(j, k, q) {
     let v = 0.05;
     var w = [],
       y, z, A, B, C, B, B;
     let D = new THREE['Box3']();
     for (z of q || d_objects) {
       if ('Bardesk' === z['params']['type'])
         z['model'] && z['model']['tabletop'] && (A = z['model']['tabletop'],
           D = A['get_box'](),
           B = A['get_forward'](),
           C = Math['abs'](Math['abs'](B['z']) - 1) < v ? 'z' : 'x',
           B = Math['sign'](B[C]),
           B = {
             'type': 'fake_obj',
             'userData': {},
             'box': D,
             'axis': (B < 0 ? '-' : '') + C,
             'tabletop': A,
             'sourceObject': z
           },
           w.push(B));
       else {
         if (z['params']['tabletop'] && z['params']['tabletop']['autogen']) {
           var C = z['tabletop'],
             E, F, E, E;
           if (C && C['children'] && C['children']['length'])
             for (var G of C['children']) {
               'function' == typeof G['get_box'] && (D = G['get_box'](),
                 E = G['get_forward'](),
                 F = Math['abs'](Math['abs'](E['z']) - 1) < v ? 'z' : 'x',
                 E = Math['sign'](E[F]),
                 E = {
                   'type': 'fake_obj',
                   'userData': {},
                   'box': D,
                   'axis': (E < 0 ? '-' : '') + F,
                   'tabletop': G,
                   'sourceObject': z
                 },
                 w.push(E));
             }
         }
       }
     }
     var H, I, J, q = L => {
         var N = new THREE['Vector3'](),
           O = new THREE['Box3'](),
           P = new THREE['Box3']();
         for (let a6 of L) {
           O['copy'](a6['box']),
             round_vec(O);
           var Q = O,
             R = 2 === a6['info']['axis']['length'] ? -1 : 1,
             S = a6['info']['axis']['slice'](-1),
             T = (N['set']('x' === S ? R : 0, 0, 'z' === S ? R : 0), {
               'front': [],
               'back': [],
               'left': [],
               'right': []
             }),
             U = (a6['info']['edges'] = T,
               PPObject['prototype']['find_around']['call'](a6, false, Q, N, L, 0.4)),
             W;
           for (W in T) {
             var Z = T[W],
               a0;
             let a7 = ('front' === W || 'back' === W) ^ 'z' === S ? 'x' : 'z',
               a8 = 'z' == a7 ? 'x' : 'z',
               a9 = 'front' === W || W === ('z' === S ? 'left' : 'right') ? R : -R;
             var a1 = Q['max'][a8] - Q['min'][a8],
               a2 = U[W]['filter'](aa => !(a9 < 0 && Math['abs'](a6['box']['min'][a7] - aa['box']['max'][a7]) > v ||
                 0 < a9 && Math['abs'](a6['box']['max'][a7] - aa['box']['min'][a7]) > v));
             if (a2['sort']((aa, ab) => aa['box']['min'][a8] - ab['box']['min'][a8]),
               a2.length) {
               let aa = Q['min'][a8],
                 ab = 0;
               for (let ac = 0; ac < a2.length; ac++) {
                 P['copy'](a2[ac]['box']),
                   round_vec(P);
                 var a3 = P,
                   a4 = a2[ac + 1];
                 if (a3['min'][a8] <= Q['min'][a8] && a3['max'][a8] >= Q['max'][a8])
                   Z.push({
                     'type': 1,
                     'start': 0,
                     'end': a1,
                     'len': a1
                   });
                 else {
                   var a5 = Math['min'](a3['max'][a8], Q['max'][a8]);
                   let ad = 0;
                   1 < a3['min'][a8] - aa && 0 == ab && (1 <= (ad = a3['min'][a8] - aa) && Z.push({
                         'type': 0,
                         'start': aa - Q['min'][a8],
                         'end': a3['min'][a8] - Q['min'][a8],
                         'len': ad
                       }),
                       aa = a3['min'][a8]),
                     a4 ? c_round(a4['box']['min'][a8]) - a5 < 1 ? ab = 1 : (1 <= (ad = a5 - aa) && Z.push({
                         'type': 1,
                         'start': aa - Q['min'][a8],
                         'end': a5 - Q['min'][a8],
                         'len': ad
                       }),
                       ab = 0,
                       aa = a5) : (1 < a3['max'][a8] - aa && 1 <= (ad = a5 - aa) && Z.push({
                         'type': 1,
                         'start': aa - Q['min'][a8],
                         'end': a5 - Q['min'][a8],
                         'len': ad
                       }),
                       aa = a5,
                       1 < Q['max'][a8] - aa && 1 <= (ad = Q['max'][a8] - aa) && Z.push({
                         'type': 0,
                         'start': aa - Q['min'][a8],
                         'end': a1,
                         'len': ad
                       }));
                 }
               }
             } else
               Z.push({
                 'type': 0,
                 'start': 0,
                 'end': a1,
                 'len': a1
               });
           }
         }
       },
       K = sc['find_groups'](w, null, (L, N) => {}, (L, N, O, P) => {
         var Q, R, Q, R, N, L, S;
         return 'Bardesk' !== L['sourceObject']['params']['type'] && 'Bardesk' !== N['sourceObject']['params'][
           'type'] && L['axis']['slice'](-1) === N['axis']['slice'](-1) && (Q = L['sourceObject']['params'][
               'tabletop'
             ],
             R = N['sourceObject']['params']['tabletop'],
             '' + Q['tabletop_id'] == '' + R['tabletop_id']) && '' + Q['height'] == '' + R['height'] && (Q = 0.05,
             R = L['box'],
             N = N['box'],
             !(Math['abs'](R['min']['y'] - N['min']['y']) > Q)) && (L = L['axis']['slice'](-1),
             !(R['max'][S = 'x' === L ? 'z' : 'x'] + Q < N['min'][S] || R['min'][S] - Q > N['max'][S])) && Math['abs']
           (R['min'][L] - N['min'][L]) < Q && Math['abs'](R['max'][L] - N['max'][L]) < Q;
       }, (L, N, O) => {
         N['copy'](L[0]['box']);
         for (let S = 1; S < L.length; S++)
           N['union'](L[S]['box']);
         var P = L[0]['axis']['slice'](-1),
           Q, P = new THREE['Vector3'](R(N, 'x' === P ? 'z' : 'x'), R(N, 'y'), R(N, P));
         return 'Bardesk' === L[0]['sourceObject']['params']['type'] ? {
           'size': P,
           'axis': L[0]['axis'],
           'materialId': L[0]['sourceObject']['params']['tabletop_id'],
           'height': L[0]['tabletop']['params']['height'],
           'width': P['x'],
           'groupObject': null,
           'edges': null
         } : {
           'size': P,
           'axis': L[0]['axis'],
           'materialId': L[0]['sourceObject']['params']['tabletop']['tabletop_id'],
           'height': L[0]['sourceObject']['params']['tabletop']['height'],
           'width': P['x'],
           'groupObject': null,
           'edges': null
         };

         function R(T, U) {
           let W = T['max'][U] - T['min'][U];
           return (!Number['isFinite'](W) || W < 0) && (W = 0),
             c_round(W * units);
         }
       }, true);
     return q(K),
       K;
   },
   sc['find_tabletop_euro_joints_legacy'] = function(j) {
     if (!j || !j.length)
       return [];
     var k = [],
       q = 0.05,
       w = new THREE['Box3']();
     for (let O = 0; O < j.length - 1; O++) {
       let P = j[O];
       var A = P['info']['axis']['slice'](-1);
       w['copy'](P['box']),
         w['expandByScalar'](0.05);
       for (let Q = O + 1; Q < j.length; Q++) {
         let R = j[Q];
         var B = R['info']['axis']['slice'](-1);
         if (A !== B && w['intersectsBox'](R['box'])) {
           var B = P['box'],
             C = R['box'];
           let S = null,
             T = null;
           if (Math['abs'](B['max']['x'] - C['min']['x']) < q ? (S = 'x',
               T = '-x') : Math['abs'](B['min']['x'] - C['max']['x']) < q ? (S = '-x',
               T = 'x') : Math['abs'](B['max']['z'] - C['min']['z']) < q ? (S = 'z',
               T = '-z') : Math['abs'](B['min']['z'] - C['max']['z']) < q && (S = '-z',
               T = 'z'),
             S) {
             var D = 'z' === S['slice'](-1) ? 'x' : 'z',
               E = A === S['slice'](-1),
               F = E ? R : P,
               G = E ? P : R,
               H = ['z', 'x', '-z', '-x'],
               I = H.findIndex(a1 => a1 === P['info']['axis']),
               J = H.findIndex(a1 => a1 === R['info']['axis']),
               K = [B['min'][D], B['max'][D]],
               L = [C['min'][D], C['max'][D]],
               K, L, B, C;
             let U;
             if (E) {
               if (!(K[0] - q <= L[0] && L[0] <= K[1] + q && K[0] - q <= L[1] && L[1] <= K[1] + q))
                 continue;
               U = [C['min'][D] - B['min'][D], C['max'][D] - B['min'][D]];
             } else {
               if (!(L[0] - q <= K[0] && K[0] <= L[1] + q && L[0] - q <= K[1] && K[1] <= L[1] + q))
                 continue;
               U = [B['min'][D] - C['min'][D], B['max'][D] - C['min'][D]];
             }
             let W, Z, a0;
             a0 = E ? (W = T,
               K = H.findIndex(a1 => a1 === T),
               L = H.findIndex(a1 => a1 === S),
               Z = H[N(K + 1, J) - 1],
               H[N(L + 1, I) - 1]) : (W = S,
               B = H.findIndex(a1 => a1 === S),
               C = H.findIndex(a1 => a1 === T),
               Z = H[N(B + 1, -I) - 1],
               H[N(C + 1, -J) - 1]);
             var D = {
               'fromGroup': F,
               'toGroup': G,
               'fromSideLocal': Z,
               'toSideLocal': a0,
               'directionGlobal': W,
               'jointCoordsGlobal': U
             };
             k.push(D);
           }
         }
       }
     }
     return k;

     function N(a1, a2) {
       return (a1 - 1 + 8 + a2) % 4 + 1;
     }
   },
   sc['find_bort_groups'] = function(q, A) {
     var G = !constructor_settings['core_v2'];
     if (G && !project_settings['bort_active'])
       return [];
     var J = [],
       K = new THREE['Box3'](),
       N = new THREE['Vector3'](),
       Q = 0.05,
       U, W, Z, a0, a1;
     let a2 = {
         'bortHeight': 15 / units,
         'bortDepth': 15 / units
       },
       a3 = 0;
     void 0 !== project_settings['defaults']['tabletop_plint'] && (a2 = at(project_settings['defaults'][
         'tabletop_plint'
       ], a2),
       a3 = project_settings['defaults']['tabletop_plint']);
     for (W of q || pp['info']['tabletop']['desc'])
       for (var a4 of W['items']) {
         var a5 = a4['sourceObject']['userData']['params'] && 'module' === a4['sourceObject']['userData']['params'][
             'type'
           ],
           a6 = a4['tabletop']['userData']['bortOffsets'],
           a7 = 2 === a4['axis']['length'] ? -1 : 1,
           a8 = a4['axis']['slice'](-1),
           a5, a5, a5, a5;
         N['set']('x' === a8 ? a7 : 0, 0, 'z' === a8 ? a7 : 0);
         let au, av, aw;
         a5 ? (a5 = a4['tabletop']['userData']['params']['spec']['plints'],
             au = a5 ? copy_object(a5) : {},
             aw = void 0 !== au['material'] ? au['material'] : a3,
             av = 0,
             (a5 = a4['tabletop']['userData']['computed']?.['variables']?.[pp['const']['vars']['plint_enabled']]) ?
             av = !is_empty_id(a5['value']) : void 0 !== (a5 = check_global_vars_flag(pp['const']['vars'][
               'plint_enabled'
             ])) && (av = to_int(a5)),
             !av || void 0 === au['enabled'] || is_empty_value(au['enabled']) || to_int(au['enabled']) || (av = 0)
             ) : (a5 = a4['sourceObject']['params']['tabletop'] || {},
             au = a5['plints'] || {},
             av = void 0 !== a5['plints_enabled'] ? a5['plints_enabled'] : 1,
             aw = void 0 !== a5['plints_material'] ? a5['plints_material'] : a3);
         var a9 = aw === a3 ? a2 : at(aw, a2);
         if (G || av && (au['back'] || au['right'] || au['left'])) {
           var aa = PPObject['prototype']['find_around']['call'](null, false, a4['box'], N),
             ab, ac;
           let ax;
           if ('z' === a8 && 0 < N['z'] ? ax = ['front', 'left', 'back', 'right'] : 'x' === a8 && 0 < N['x'] ?
             ax = ['right', 'front', 'left', 'back'] : 'z' === a8 && N['z'] < 0 ? ax = ['back', 'right', 'front',
               'left'
             ] : 'x' === a8 && N['x'] < 0 && (ax = ['left', 'back', 'right', 'front']),
             ax)
             for (ac of [
                 [ax[0], 'z', 1],
                 [ax[1], 'x', 1],
                 [ax[2], 'z', -1],
                 [ax[3], 'x', -1]
               ]) {
               var ad = ac[0];
               if ('front' !== ad && (G || !('back' === ad && !au['back'] || 'left' === ad && !au['right'] ||
                   'right' === ad && !au['left']))) {
                 var ae = aa[ad];
                 if (ae.length) {
                   var af = aa['at_wall'] && ae['find'](ay => ay['is_wall'] && 'floor' !== ay['name'] && 'ceiling' !==
                       ay['name']),
                     ag = ac[2],
                     ad = ad[0],
                     ah = 'f' === ad || 'b' === ad,
                     ai = ac[1],
                     aj = 'z' === ai ? 'x' : 'z',
                     ad = as(ad, a6),
                     ak = a4['box'],
                     al = ak['max'][aj] - ak['min'][aj],
                     am = ak['min'][aj] + al / 2,
                     an, af;
                   if (!((al -= ad[0]) < 1)) {
                     if (am += ad[1] * (ah && 'x' === ai ? -a7 : a7),
                       af) {
                       K['min'][aj] = am - al / 2,
                         K['min']['y'] = ak['max']['y'],
                         K['min'][ai] = ag < 0 ? ak['min'][ai] : ak['max'][ai] - a9['bortDepth'],
                         K['max'][aj] = am + al / 2,
                         K['max']['y'] = ak['max']['y'] + a9['bortHeight'],
                         K['max'][ai] = K['min'][ai] + a9['bortDepth'];
                       var ad = {
                         'type': 'fake_bort',
                         'userData': {},
                         'box': K['clone'](),
                         'axis': (ag < 0 ? '' : '-') + ai,
                         'materialId': aw,
                         'sourceObject': a4['sourceObject']
                       };
                       J.push(ad);
                     } else {
                       let ay = false;
                       for (var ao of ae)
                         if (!ao['is_wall']) {
                           if (G) {
                             if ('Cabinet' !== ao['userData']['type'] && 'Bardesk' !== ao['userData']['type'])
                               continue;
                           } else {
                             if ('module' !== ao['userData']['params']?.['type'] && 'Cabinet' !== ao['userData'][
                               'type'])
                               continue;
                           }
                           var ao = ao['box'];
                           if (!(ao['max']['y'] < ak['max']['y'] + 0.1 || ag < 0 && Math['abs'](ak['min'][ai] - ao[
                               'max'][ai]) > Q || 0 < ag && Math['abs'](ak['max'][ai] - ao['min'][ai]) > Q)) {
                             var ap = am - al / 2,
                               aq = am + al / 2,
                               ar = _['clamp'](ao['min'][aj], ap, aq),
                               ao = _['clamp'](ao['max'][aj], ap, aq);
                             if (!(ao - ar < 1)) {
                               if (K['min'][aj] = ar,
                                 K['min']['y'] = ak['max']['y'],
                                 K['min'][ai] = ag < 0 ? ak['min'][ai] : ak['max'][ai] - a9['bortDepth'],
                                 K['max'][aj] = ao,
                                 K['max']['y'] = ak['max']['y'] + a9['bortHeight'],
                                 K['max'][ai] = K['min'][ai] + a9['bortDepth'],
                                 A && !ah) {
                                 ay = true;
                                 break;
                               }
                               var ap = {
                                 'type': 'fake_bort',
                                 'userData': {},
                                 'box': K['clone'](),
                                 'axis': (ag < 0 ? '' : '-') + ai,
                                 'materialId': aw,
                                 'sourceObject': a4['sourceObject']
                               };
                               J.push(ap);
                             }
                           }
                         }
                       ay && (K['min'][aj] = am - al / 2,
                         K['min']['y'] = ak['max']['y'],
                         K['min'][ai] = ag < 0 ? ak['min'][ai] : ak['max'][ai] - a9['bortDepth'],
                         K['max'][aj] = am + al / 2,
                         K['max']['y'] = ak['max']['y'] + a9['bortHeight'],
                         K['max'][ai] = K['min'][ai] + a9['bortDepth'],
                         af = {
                           'type': 'fake_bort',
                           'userData': {},
                           'box': K['clone'](),
                           'axis': (ag < 0 ? '' : '-') + ai,
                           'materialId': aw,
                           'sourceObject': a4['sourceObject']
                         },
                         J.push(af));
                     }
                   }
                 }
               }
             }
         }
       }
