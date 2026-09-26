 ['embed_in_section'](q, A, B) {
   if (!this['userData']['params']['spec']['is_fill'])
     return null;
   let C = true;
   if (this['_fill_helpers'] && this['_excluded_objects'])
     for (let ab = 0; ab < this['userData']['connected']['length']; ab++) {
       let ac = this['userData']['connected'][ab];
       var F;
       this['_excluded_objects']['includes'](ac) || (F = A['userData']['parts_by_path']['module'][ac]) && (F['userData']
         ['own_object']['visible'] = true);
     }
   var G, H;
   if (this['_excluded_objects'] && delete this['_excluded_objects'],
     this['_snap_points'] && delete this['_snap_points'],
     this['_snap_label'] && (scene['remove'](this['_snap_label']),
       delete this['_snap_label']),
     this['_size_objects'] && 0 < this['_size_objects']['length'] && this['_size_objects']['forEach'](ad => {
       ad['parent'] && (ad['full_dispose'](),
         ad['parent']['remove'](ad),
         this['_size_objects'] = null);
     }),
     this['object_path'] && this['section_uuid'] && (H = scene['getObjectByProperty']('uuid', this['section_uuid'])[
         'userData']['root']['get_child_params_by_path'](this['object_path']),
       this['old_pos'] && (H['pos'] = this['old_pos']),
       H?.['spec']?.['safe_size']) && (H['size'] = H['spec']['safe_size'],
       delete H['spec']['safe_size']),
     true !== (C = pp['events']['module']['before_embed_in_section'] ? pp['events']['module']['before_embed_in_section']
       (this, q) : C))
     return {
       'root': A,
       'enabled': false
     };
   if (!this['check_embed_in_section'](q, true))
     return A['_build_sizes'](),
       0 < q['userData']['children']['length'] && (q['userData']['children']['forEach'](ad => {
           ad['snap_points_group'] && (ad['remove'](ad['snap_points_group']),
             ad['snap_points_group'] = null);
         }),
         q['snap_points_group']) && (q['remove'](item['snap_points_group']),
         q['snap_points_group'] = null), {
         'root': A,
         'enabled': false
       };
   q['userData']['dragCache'] && delete q['userData']['dragCache'];
   let I = q['userData']['path'];
   var H = new THREE['Vector3'](0, 0, 1),
     J = new THREE['Quaternion'](),
     H = (q['getWorldQuaternion'](J),
       H['clone']()['applyQuaternion'](J)),
     J = 0.99 < Math['abs'](H['x']) && 0 === this['userData']['params']['interaction']['auto_rotation'],
     K = {
       'x': this['userData']['params']['spec']['fill_size_x'] || 0,
       'y': this['userData']['params']['spec']['fill_size_y'] || 0,
       'z': this['userData']['params']['spec']['fill_size_z'] || 0
     };
   let L, N = [];
   '0' != I ? (L = A['get_child_params_by_path'](I),
     A['walk_params_tree'](ad => {
       'fill_section' == ad['type'] && ad['section_key'] && ad['section_key'] === L['section_key'] && N.push(ad);
     }, A['userData']['params'], 2),
     0 == N.length && N.push(L)) : L = A['userData']['params'];
   var H = {
       'x': 0,
       'y': 0,
       'z': 0
     },
     O = {
       'x': q['userData']['computed']['size']['x'] - this['userData']['params']['size']['x'],
       'y': q['userData']['computed']['size']['y'] - this['userData']['params']['size']['y'],
       'z': q['userData']['computed']['size']['z'] - this['userData']['params']['size']['z']
     },
     P;
   let Q = {
     'x': 's:x' + (0 === Math['round'](O['x']) ? '' : '\x20-\x20' + Math['round'](O['x'])),
     'y': 's:y' + (0 === Math['round'](O['y']) ? '' : '\x20-\x20' + Math['round'](O['y'])),
     'z': 's:z' + (0 === Math['round'](O['z']) ? '' : '\x20-\x20' + Math['round'](O['z']))
   };
   for (P in Q)
     0 === K[P] && (Q[P] = this['userData']['computed']['size'][P]);
   let S = {
     'x': this['local_pos']['x'] * units + q['userData']['computed']['size']['x'] / 2 - this['userData']['params'][
       'size'
     ]['x'] / 2,
     'y': this['local_pos']['y'] * units + q['userData']['computed']['size']['y'] / 2,
     'z': this['local_pos']['z'] * units + q['userData']['computed']['size']['z'] / 2 - this['userData']['params'][
       'size'
     ]['z'] / 2
   };
   if (J) {
     for (var U in (O = {
           'x': q['userData']['computed']['size']['x'] - this['userData']['params']['size']['z'],
           'y': q['userData']['computed']['size']['y'] - this['userData']['params']['size']['y'],
           'z': q['userData']['computed']['size']['z'] - this['userData']['params']['size']['x']
         },
         Q = {
           'x': 's:x' + (0 === Math['round'](O['x']) ? '' : '\x20-\x20' + Math['round'](O['x'])),
           'y': 's:y' + (0 === Math['round'](O['y']) ? '' : '\x20-\x20' + Math['round'](O['y'])),
           'z': 's:z' + (0 === Math['round'](O['z']) ? '' : '\x20-\x20' + Math['round'](O['z']))
         }))
       0 === K[U] && (Q[U] = this['userData']['computed']['size'][U]);
     K['x'] = this['userData']['params']['spec']['fill_size_z'] || 0,
       K['z'] = this['userData']['params']['spec']['fill_size_x'] || 0,
       this['userData']['params']['spec']['fill_size_x'] = K['x'],
       this['userData']['params']['spec']['fill_size_z'] = K['z'],
       S = {
         'x': this['local_pos']['x'] * units + q['userData']['computed']['size']['x'] / 2 - this['userData']['params']
           ['size']['z'] / 2,
         'y': this['local_pos']['y'] * units + q['userData']['computed']['size']['y'] / 2,
         'z': this['local_pos']['z'] * units + q['userData']['computed']['size']['z'] / 2 - this['userData']['params']
           ['size']['x'] / 2
       };
   }
   var O = this['userData']['params']['spec']['templates'],
     W = this['userData']['params']['spec']['variants'],
     Z = this['userData']['params']['variables'];
   if (J)
     for (var a0 of O) {
       var a0 = a0['template'],
         a0;
       1 === a0?.['tree']?.['length'] && 'wall' === (a0 = a0['tree'][0])['type'] && a0['spec'] && ('v' === a0[
         'spec']['orientation'] ? a0['spec']['orientation'] = 'f' : 'f' === a0['spec']['orientation'] && (a0['spec']
         ['orientation'] = 'v'));
     }
   var J = this['userData']['params']['spec']['fill_fix_mats'],
     a1 = this['userData']['params']['spec']['mat_groups'] || [],
     a2 = (J || module_utils['walk_params_tree'](this, ad => {
         'module' === ad['type'] && module_utils['reset_mat_groups_materials'](ad);
       }),
       new THREE['Vector3']()),
     a3 = new THREE['Vector3'](-1, -1, -1),
     a4 = new THREE['Vector3'](1, 1, 1);
   const a5 = 0,
     a6 = 1 === q['userData']['params']?.['spec']?.['invert']?.['x'],
     a7 = 1 === q['userData']['params']?.['spec']?.['invert']?.['y'],
     a8 = 1 === q['userData']['params']?.['spec']?.['invert']?.['z'];
   a6 && K['x'] && (a4['x'] = -1),
     a7 && K['y'] && (a4['y'] = -1),
     a8 && K['z'] && (a4['z'] = -1);
   let a9 = {
     'type': 'module',
     'id': this['userData']['params']['id'],
     'lib': this['userData']['params']['lib'],
     'active': 1,
     'name': this['userData']['params']['name'],
     'pos': {
       'x': Math['round'](S['x']),
       'y': Math['round'](S['y']),
       'z': Math['round'](S['z'])
     },
     'c_rot': H,
     'pivot': a3,
     'rot': a2,
     'size': Q,
     'scale': a4,
     'variables': {
       ...Z
     },
     'events': this['userData']['params']['events'],
     'spec': {
       'variants': {
         ...W
       },
       'selected_variant': this['userData']['params']['spec']['selected_variant'],
       'mat_groups': a1,
       'element_type': this['userData']['params']['spec']['element_type'],
       'not_load_default': this['userData']['params']['spec']['not_load_default'],
       'id': this['userData']['params']['spec']['id'],
       'params_item': this['userData']['params']['spec']['params_item'],
       'is_fill': 1,
       'fill_fix_mats': J,
       'fill_size_x': this['userData']['params']['spec']['fill_size_x'] || 0,
       'fill_size_y': this['userData']['params']['spec']['fill_size_y'] || 0,
       'fill_size_z': this['userData']['params']['spec']['fill_size_z'] || 0,
       'fill_pivot': this['userData']['params']['spec']['fill_pivot'] || {
         'x': 0,
         'y': 0,
         'z': 0
       },
       'nested_elements': this['userData']['params']['spec']['nested_elements'] || 0,
       'templates': O,
       'version': 1
     }
   };
   if ('0' != I ? 0 < N.length && N.forEach(ad => {
       ad['children']['push'](a9);
     }) : A['userData']['params']['spec']['template']['tree']['push'](a9),
     this['object_path'] && this['parent_uuid'] && this['section_uuid']) {
     let ad = scene['getObjectByProperty']('uuid', this['section_uuid']);
     var H = ad['userData']['root'];
     let ae = [],
       af = Number(this['object_path']['split'](',')['pop']());
     H['walk_params_tree'](ag => {
         'fill_section' == ag['type'] && ag['section_key'] && ag['section_key'] === ad['userData']['params'][
           'section_key'
         ] && ae.push(ag);
       }, H['userData']['params'], 2),
       this['update_connected_sizes'](ad, a9),
       0 < ae.length ? ae.forEach(ag => {
         ag['children']['splice'](af, 1);
       }) : L['children']['splice'](af, 1),
       this['section_uuid'] !== q['uuid'] && H['_rebuild']();
   }
   this['userData']['connected'] = [],
     this['delete'](),
     A['_rebuild']();
   var aa, a3 = A['get_child_by_path'](q['userData']['path'])['userData']['children']['filter'](ag =>
     ag instanceof Module)['pop']();
   return a3['calculate_distances'](), {
     'root': A,
     'enabled': true,
     'new_obj': a3
   };
 }
 ['update_connected_sizes'](f, g) {
   if (0 !== this['userData']['connected']['length']) {
     let A = f['userData']['root'];
     var j = 1,
       k = this['userData']['connected'],
       q = g['pos'],
       v = g['size'],
       w = this['old_pos'] || g['pos'],
       x = this['new_size'] || g['size'];
     let B = f['userData']['root']['userData']['parts_by_path']['module'][this['object_path']]?.['userData'][
       'computed'] || f['userData']['root']['userData']['parts_by_path']['module'][this['userData']['path']]?.[
         'userData'
       ]['computed'];
     var y = this['userData']['computed']['c_object'];
     let C = [],
       D = (A['walk_params_tree'](G => {
           'fill_section' == G['type'] && G['section_key'] && G['section_key'] === f['userData']['params'][
             'section_key'
           ] && C.push(G);
         }, A['userData']['params'], 2),
         0 == C.length && C.push(A['get_child_params_by_path'](f['userData']['path'])),
         v = {
           'x': comp2(v['x'], y),
           'y': comp2(v['y'], y),
           'z': comp2(v['z'], y)
         },
         q = {
           'x': comp2(q['x'], y),
           'y': comp2(q['y'], y),
           'z': comp2(q['z'], y)
         },
         w = {
           'x': comp2(w['x'], y),
           'y': comp2(w['y'], y),
           'z': comp2(w['z'], y)
         }, {
           'x': 0 != Math['round'](q['x'] - w['x']) ? 1 : 0,
           'y': 0 != Math['round'](q['y'] - w['y']) ? 1 : 0,
           'z': 0 != Math['round'](q['z'] - w['z']) ? 1 : 0
         }),
       E = {
         'x': 0 != D['x'] ? Math['round'](q['x'] - w['x']) : Math['round'](x['x'] - v['x']),
         'y': 0 != D['y'] ? Math['round'](q['y'] - w['y']) : Math['round'](x['y'] - v['y']),
         'z': 0 != D['z'] ? Math['round'](q['z'] - w['z']) : Math['round'](x['z'] - v['z'])
       },
       F = {
         'x': f['userData']['computed']['size']['x'],
         'y': f['userData']['computed']['size']['y'],
         'z': f['userData']['computed']['size']['z']
       };
     var z = get_excluded_objects(f, this);
     for (let G of k)
       z['includes'](G) || 0 < C.length && C.forEach(H => {
         var I = Number(G.split(',')['pop']()),
           H = H['children'][I];
         let J = A['userData']['parts_by_path']['module'][G]?.['userData']['computed'];
         if (H && J) {
           var I = H['spec'],
             K;
           let L = H['size'],
             N = H['pos'],
             O = {
               'x': g['spec']['fill_size_x'],
               'y': g['spec']['fill_size_y'],
               'z': g['spec']['fill_size_z']
             },
             P = {
               'x': I['fill_size_x'],
               'y': I['fill_size_y'],
               'z': I['fill_size_z']
             },
             Q = {};
           ['x', 'y', 'z']['forEach'](R => {
             var S, T;
             0 !== E[R] && (S = 1,
               0 < E[R] ? Q[R] = '+\x20' + E[R] : E[R] < 0 ? Q[R] = '-\x20' + Math['abs'](E[R]) : Q[R] = '',
               T = Math['abs'](J['pos'][R] - B['pos'][R] - B['size'][R]) < 1,
               1 === P[R] && 0 == O[R] && 0 !== D[R] && (L[R] = (L[R] + '\x20' + Q[R])['trim']()),
               T && 1 === P[R] && 0 == O[R] && 0 !== D[R] && (0 < E[R] ? Q[R] = '-\x20' + E[R] +
                 '\x20-\x20' + E[R] : E[R] < 0 ? Q[R] = '+\x20' + Math['abs'](E[R]) + '\x20+\x20' + Math['abs'](
                   E[R]) : Q[R] = '',
                 L[R] = (L[R] + '\x20' + Q[R])['trim'](),
                 N[R] = N[R] + E[R]),
               T && 1 === P[R] && 0 == O[R] && 0 == D[R] && (0 < E[R] ? Q[R] = '-\x20' + E[R] : E[R] <
                 0 ? Q[R] = '+\x20' + Math['abs'](E[R]) : Q[R] = '',
                 L[R] = (L[R] + '\x20' + Q[R])['trim'](),
                 N[R] = N[R] + E[R]),
               L[R] = this['simplify_size'](L[R], R, F[R]));
           });
         }
       });
   }
 }
 ['update_connected_helpers_size'](g) {
   if (this['old_pos'] && this['_fill_helpers']['helpers'] && 0 !== this['_fill_helpers']['helpers']['length'] && g[
       'uuid'] === this['_fill_helpers']['uuid']) {
     var j = g['userData']['root'],
       k = this['userData']['computed']['c_object'],
       q = ['x', 'y', 'z'];
     const z = 0,
       A = this['local_pos']['x'] * units + g['userData']['computed']['size']['x'] / 2 - this['userData']['params'][
         'size'
       ]['x'] / 2,
       B = this['local_pos']['y'] * units + g['userData']['computed']['size']['y'] / 2,
       C = this['local_pos']['z'] * units + g['userData']['computed']['size']['z'] / 2 - this['userData']['params'][
         'size'
       ]['z'] / 2;
     var v = j['userData']['parts_by_path']['module'][this['object_path']]?.['userData']['params'],
       w;
     let D = j['userData']['parts_by_path']['module'][this['object_path']]?.['userData']['computed'],
       E = 1,
       F, G = comp2(v['pos']['x'], k),
       H = comp2(v['pos']['y'], k),
       I = comp2(v['pos']['z'], k),
       J = {
         'x': Math['round'](A - G),
         'y': Math['round'](B - H),
         'z': Math['round'](C - I)
       };
     for (w of this['_fill_helpers']['helpers']) {
       let K = w['userData']['parent'];
       if (K) {
         let L = K['userData']['computed']['size']['clone']()['divideScalar'](units),
           N = L['clone'](),
           O = {
             'x': K['userData']['params']['spec']['fill_size_x'],
             'y': K['userData']['params']['spec']['fill_size_y'],
             'z': K['userData']['params']['spec']['fill_size_z']
           },
           P = {
             'x': v['spec']['fill_size_x'],
             'y': v['spec']['fill_size_y'],
             'z': v['spec']['fill_size_z']
           },
           Q = K['getWorldQuaternion'](new THREE['Quaternion']()),
           R = K['getWorldPosition'](new THREE['Vector3']());
         q.forEach(S => {
           var T = Math['abs'](K['userData']['computed']['pos'][S] - D['pos'][S] - D['size'][S]) < 1,
             U, U, T;
           0 === P[S] && 0 !== J[S] && (U = J[S] / units,
               N[S] = L[S] + U),
             T && 1 === O[S] && 0 == P[S] && (U = 2 * J[S] / units,
               N[S] = L[S] - U / 2,
               (T = new THREE['Vector3']())[S] = U / 2,
               T['applyQuaternion'](Q),
               R['add'](T));
         });
         var x = {
           'x': 1 === g['userData']['params']?.['spec']?.['invert']?.['x'],
           'y': 1 === g['userData']['params']?.['spec']?.['invert']?.['y'],
           'z': 1 === g['userData']['params']?.['spec']?.['invert']?.['z']
         };
         (x['x'] || x['y'] || x['z']) && (w['visible'] = false),
         w['position']['copy'](R),
           w['quaternion']['copy'](Q),
           w['update_size'](N);
       }
     }
   }
 }
 ['update_sizes_obj'](f, g) {
   let h = new THREE['Vector3']();
   var j = this['userData']['computed'],
     k = (h['copy'](this['position']),
       ['x', 'y']);
   let l = g['userData']['computed']['world'] || CabinetAnalyzer['get_root_params'](g),
     m = {
       'x': this['userData']['params']['spec']['fill_size_x'] || 0,
       'y': this['userData']['params']['spec']['fill_size_y'] || 0,
       'z': this['userData']['params']['spec']['fill_size_z'] || 0
     };
   if (f && 0 < f.length && (3 == global_options['additional_sizes_mode'] || 4 == global_options[
       'additional_sizes_mode']))
     f.forEach(q => {
       q['_update_text_size'](h, this, g);
     });
   else {
     if (f && 0 < f.length)
       for (let q = 0; q < f.length; q++) {
         let u = f[q],
           w = u['userData']['params'];
         var n = u['userData']['root'],
           p = g['userData']['computed']['world'] || CabinetAnalyzer['get_root_params'](g);
         let A = new THREE['Vector3'](p['pos']['x'] / units, p['pos']['y'] / units, p['pos']['z'] / units),
           B = {
             'x': this['userData']['params']['spec']['fill_size_x'] || 0,
             'y': this['userData']['params']['spec']['fill_size_y'] || 0,
             'z': this['userData']['params']['spec']['fill_size_z'] || 0
           };
         k.forEach(C => {
             if (0 === B[C]) {
               var E, F, G = g['userData']['children']['filter'](W => W instanceof Module && W['userData']['path'] !==
                 this['object_path'] && 0 === W['userData']['params']['spec']['fill_size_' + C]);
               let O = [];
               0 < G.length && G.forEach(W => {
                   O.push(...W['userData']['computed']['additional_sizes']);
                 }),
                 O = O.filter(W => W instanceof CabinetSize && W['userData']['params']?.['spec']?.['axis'] === u[
                   'userData']['params']?.['spec']?.['axis']);
               var F = this['userData']['computed']['size'][C] / units;
               let P = this['local_pos'][C],
                 Q = this['local_pos'][C] + F;
               'x' == C && (P = this['local_pos'][C] - F / 2,
                 Q = this['local_pos'][C] + F / 2);
               var F = g['userData']['computed']['size'][C] / units,
                 E = -F / 2,
                 F = F / 2,
                 H = ['x', 'y', 'z']['filter'](W => W !== C),
                 I, J, K, L, L, N;
               let R = E,
                 S = null,
                 T = F,
                 U = null;
               for (let W of G.filter(Z => Z['userData']['path'] !== this['object_path'])['map'](Z => {
                   var a0 = Z['userData']['computed']['size'][C] / units;
                   let a1 = Z['position'][C],
                     a2 = Z['position'][C] + a0;
                   return 'x' == C && (a1 = Z['position'][C] - a0 / 2,
                     a2 = Z['position'][C] + a0 / 2), {
                     'obj': Z,
                     'min': a1,
                     'max': a2,
                     'pos': Z['position'],
                     'size': Z['userData']['computed']['size']
                   };
                 })) {
                 H['every'](Z => {
                   if (!W['pos'] || !W['size'])
                     return false;
                   let a0 = this['local_pos'][Z];
                   var a1 = this['userData']['computed']['size'][Z] / 2 / units,
                     a1 = (a0 = 'y' == Z ? this['local_pos'][Z] + a1 : this['local_pos'][Z],
                       W['size'][Z] / units),
                     a2 = W['pos'][Z],
                     Z = W['pos'][Z] + a1;
                   return a0 > a2 && a0 < Z;
                 }) && (W['max'] <= P && W['max'] > R && (R = W['max'],
                     S = W),
                   W['min'] >= Q) && W['min'] < T && (T = W['min'],
                   U = W);
               }
               E = Math['max'](0, (P - R) * units)['toFixed'](0),
                 F = Math['max'](0, (T - Q) * units)['toFixed'](0);
               for (let Z = 0; Z < O.length; Z++) {
                 O[Z]['visible'] = true,
                   U && !S && 1 < (L = U['obj']['userData']['computed']['additional_sizes'])['length'] && (L[0][
                     'visible'
                   ] = false),
                   S && !U && 0 < (L = S['obj']['userData']['computed']['additional_sizes'])['length'] && (L[L[
                     'length'] - 1]['visible'] = false),
                   S && U && 0 < (N = S['obj']['userData']['computed']['additional_sizes'])['length'] && (N[N[
                     'length'] - 1]['visible'] = false);
               }
               0 == q && (w['size']['x'] = E || ((h[C] - A[C]) * units)['toFixed'](0)),
                 1 == q && (w['size']['x'] = F || ((A[C] + g['userData']['computed']['size'][C] / units - h[C] -
                   this['userData']['computed']['size'][C] / units) * units)['toFixed'](0)),
                 w['size']['x'] = parseFloat(w['size']['x']);
             }
           }),
           u['_update_size'](),
           k.forEach(C => {
             0 === B[C] && (0 === q && (u['position'][C] = -this['userData']['computed']['size'][C] / 2 /
                 units - u['userData']['computed']['size'][C] / 2 / units),
               1 === q) && (u['position'][C] = this['userData']['computed']['size'][C] / 2 / units + u[
               'userData']['computed']['size'][C] / 2 / units);
           });
       }
     else
       this['_size_objects'] = [],
       k.forEach(C => {
         if (1 !== m[C]) {
           let H;
           var E = copy_object(pp['engine']['item_def_params']['size']),
             F, G, G, F, G;
           3 !== global_options['additional_sizes_mode'] && 4 !== global_options['additional_sizes_mode'] ? (E[
               'spec']['arrow_scale'] = 50,
             E['spec']['text_scale'] = 50,
             E['spec']['length'] = 0,
             E['spec']['axis'] = C + '1',
             'y' == C && (E['pos']['x'] = this['userData']['computed']['size']['x'] / 2 + 75),
             'x' == C && (E['pos']['y'] = this['userData']['computed']['size']['y'] / 2),
             E['size']['x'] = 0,
             F = new THREE['Vector3'](1, 1, 1),
             (G = {
               'x': 1 === g['userData']['params']?.['spec']?.['invert']?.['x'],
               'y': 1 === g['userData']['params']?.['spec']?.['invert']?.['y'],
               'z': 1 === g['userData']['params']?.['spec']?.['invert']?.['z']
             })['x'] && m['x'] && 'y' == C && (E['pos']['x'] -= 75),
             G['z'] && m['z'] && (E['pos']['z'] += this['userData']['computed']['size']['z'] - 2),
             G['y'] && m['x'] && 'x' == C && (E['pos']['y'] -= this['userData']['computed']['size']['y'] / 4),
             G['x'] && m['x'] && (F['x'] = -1),
             G['y'] && m['y'] && (F['y'] = -1),
             G['z'] && m['z'] && (F['z'] = -1),
             E['scale'] = F,
             H = new CabinetSize(E, {
               'parent': this,
               'root': this,
               'local_parent': this
             }),
             G = new CabinetSize(E, {
               'parent': this,
               'root': this,
               'local_parent': this
             }),
             this['_size_objects']['push'](H),
             this['_size_objects']['push'](G),
             this['userData']['own_object']['add'](H),
             this['userData']['own_object']['add'](G)) : (E['spec']['length'] = 70,
             E['spec']['axis'] = C + '1',
             E['spec']['text_size'] = 1,
             E['spec']['section_pos'] = l['pos'],
             E['spec']['section_size'] = g['userData']['computed']['size'],
             E['size']['x'] = 0,
             F = new THREE['Vector3'](1, 1, 1),
             G = {
               'x': 1 === g['userData']['params']?.['spec']?.['invert']?.['x'],
               'y': 1 === g['userData']['params']?.['spec']?.['invert']?.['y'],
               'z': 1 === g['userData']['params']?.['spec']?.['invert']?.['z']
             },
             'y' == C && (E['pos']['x'] = 100,
               E['pos']['y'] = this['userData']['computed']['size']['y'] / 2,
               E['pos']['z'] = this['userData']['computed']['size']['z'] / 2),
             'x' == C && (E['pos']['x'] = this['userData']['computed']['size']['x'] / 2,
               E['pos']['y'] = (E['spec']['length'] + 60) / 2,
               E['pos']['z'] = this['userData']['computed']['size']['z'] / 2),
             G['x'] && m['x'] && (F['x'] = -1),
             G['y'] && m['y'] && (F['y'] = -1),
             G['z'] && m['z'] && (F['z'] = -1),
             E['scale'] = F,
             H = new CabinetSize(E, {
               'parent': this,
               'root': this,
               'local_parent': this
             }),
             this['_size_objects']['push'](H),
             this['userData']['own_object']['add'](H));
         }
       });
   }
 }
 ['simplify_size'](f, g, h) {
   if ('number' == typeof f)
     return Math['min'](f, h);
   let i = new RegExp('s:' + g, 'g'),
     j = f.replace(i, 'BASE'),
     k = j.split(/BASE/i),
     l = 0;
   if (k[1])
     try {
       l = eval(k[1]);
     } catch (o) {
       l = 0;
     }
   let m = l < 0 ? 's:' + g + '\x20' + l : 's:' + g,
     n = h + l;
   return n >= h ? 's:' + g : m;
 }
 ['get_connected']() {
   var f = this['userData']['parent'],
     g = [],
     j = (this['updateMatrixWorld'](true),
       this['_get_size'] ? this['_get_size']() : new THREE['Vector3'](0, 0, 0)),
     k = this['getWorldPosition'](new THREE['Vector3']()),
     m = this['getWorldQuaternion'](new THREE['Quaternion']()),
     m = new THREE['Vector3'](j['x'] / 2, j['y'] / 2, j['z'] / 2)['applyQuaternion'](m),
     k = k['clone']()['add'](m),
     q = new THREE['Box3']()['setFromCenterAndSize'](k, j)['expandByScalar'](0.1),
     m = this['userData']['params']['spec'],
     v = 0 === m['fill_size_x'],
     w = 0 === m['fill_size_y'],
     x = 0 === m['fill_size_z'],
     y, z, A, B, B, A, B, A, z, C, A;
   for (y of f['userData']['children']) {
     y['uuid'] !== this['uuid'] && 'Module' === y['userData']['class'] && (y['updateMatrixWorld'](true),
       z = y['_get_size'] ? y['_get_size']() : new THREE['Vector3'](0, 0, 0),
       A = y['getWorldPosition'](new THREE['Vector3']()),
       B = y['getWorldQuaternion'](new THREE['Quaternion']()),
       B = new THREE['Vector3'](z['x'] / 2, z['y'] / 2, z['z'] / 2)['applyQuaternion'](B),
       A = A['clone']()['add'](B),
       B = new THREE['Box3']()['setFromCenterAndSize'](A, z),
       z = 0 === (A = y['userData']['params']['spec'])['fill_size_x'],
       C = 0 === A['fill_size_y'],
       A = 0 === A['fill_size_z'],
       w && z || v && C || x && z || v && A || w && A || x && C) && q['intersectsBox'](B) && g.push(y['userData'][
       'path'
     ]);
   }
   return g;
 }
 ['add_snap_points_group'](j = {}, k, q) {
   if (this['_last_snap_root'] && this['_last_snap_root'] !== k['userData']['root'])
     for (var w in this['_last_snap_root']['userData']['parts_by_path']) {
       var A = this['_last_snap_root']['userData']['parts_by_path'][w],
         B;
       for (B in A) {
         var C = A[B];
         C['snap_points_group'] && (C['remove'](C['snap_points_group']),
           C['snap_points_group'] = null);
       }
     }
   this['_last_snap_root'] = k['userData']['root'];
   var q = k['userData']['own_object']['worldToLocal'](q['clone']()),
     E = 4,
     F = this['userData']['params']['size'];
   const G = 0,
     H = F['x'] / (2 * units),
     I = F['y'] / (2 * units),
     J = F['z'] / (2 * units),
     K = 0,
     L = k['userData']['computed']['size']['x'] / (2 * units),
     N = k['userData']['computed']['size']['y'] / (2 * units),
     O = k['userData']['computed']['size']['z'] / (2 * units);
   var P = [new THREE['Vector3'](q['x'] + L - H, q['y'] + N, q['z'] + O - J), new THREE['Vector3'](q['x'] + L + H, q[
       'y'] + N, q['z'] + O - J), new THREE['Vector3'](q['x'] + L + H, q['y'] + N, q['z'] + O + J), new THREE[
       'Vector3'](q['x'] + L - H, q['y'] + N, q['z'] + O + J), new THREE['Vector3'](q['x'] + L - H, q['y'] + N + 2 *
       I, q['z'] + O - J), new THREE['Vector3'](q['x'] + L + H, q['y'] + N + 2 * I, q['z'] + O - J), new THREE[
       'Vector3'](q['x'] + L + H, q['y'] + N + 2 * I, q['z'] + O + J), new THREE['Vector3'](q['x'] + L - H, q['y'] +
       N + 2 * I, q['z'] + O + J)],
     Q;
   for (Q in j) {
     let Z;
     if (k['userData']['root']['userData']['parts_by_path']['module'][Q] ? Z = k['userData']['root']['userData'][
         'parts_by_path'
       ]['module'][Q] : k['userData']['root']['userData']['parts_by_path']['fill_section'][Q] && (Z = k['userData'][
         'root'
       ]['userData']['parts_by_path']['fill_section'][Q]),
       Z) {
       var R = Z['userData']['computed']['pos']['clone']()['divideScalar'](units),
         S = Z['userData']['computed']['size']['clone']()['divideScalar'](units);
       let a0 = [new THREE['Vector3'](R['x'], R['y'], R['z']), new THREE['Vector3'](R['x'] + S['x'], R['y'], R['z']),
         new THREE['Vector3'](R['x'] + S['x'], R['y'], R['z'] + S['z']), new THREE['Vector3'](R['x'], R['y'], R['z'] +
           S['z']), new THREE['Vector3'](R['x'], R['y'] + S['y'], R['z']), new THREE['Vector3'](R['x'] + S['x'], R[
           'y'] + S['y'], R['z']), new THREE['Vector3'](R['x'] + S['x'], R['y'] + S['y'], R['z'] + S['z']), new THREE[
           'Vector3'](R['x'], R['y'] + S['y'], R['z'] + S['z'])
       ];
       Z instanceof CabinetFillSection && (a0 = [new THREE['Vector3'](0, 0, 0), new THREE['Vector3'](0, S['y'],
         0), new THREE['Vector3'](S['x'], 0, 0), new THREE['Vector3'](S['x'], S['y'], 0), new THREE[
         'Vector3'](S['x'], 0, S['z']), new THREE['Vector3'](S['x'], S['y'], S['z']), new THREE['Vector3'](0,
         0, S['z']), new THREE['Vector3'](0, S['y'], S['z'])]);
       var R = j[Q],
         T, U, S;
       let a1 = false;
       for (T of P) {
         for (var W of a0) {
           if (T['distanceTo'](W) <= 4) {
             a1 = true;
             break;
           }
         }
         if (a1)
           break;
       }!a1 && Z['snap_points_group'] ? (Z['remove'](Z['snap_points_group']),
         Z['snap_points_group'] = null) : a1 && (Z['snap_points_group'] && (Z['remove'](Z['snap_points_group']),
           Z['snap_points_group'] = null),
         S = new SnapPoints({
           'points': R,
           'size': {
             'x': 20,
             'y': 20,
             'z': 20
           },
           'parent': Z
         }),
         Z['snap_points_group'] = S,
         Z['add'](S));
     }
   }
 }
 ['try_snap_to_nearby_point'](K, a0, a1, a2 = 1.5) {
   var a3 = K['userData']['root'],
     a4 = a3['userData']['parts_by_path']['module'] || {};
   this['_snap_label'] && (scene['remove'](this['_snap_label']),
     this['_snap_label']['element']['remove'](),
     this['_snap_label'] = null);
   let a5 = ['x', 'y', 'z'],
     a6 = (a3['updateMatrixWorld'](true),
       this['updateMatrixWorld'](true),
       new THREE['Vector3']()),
     a7 = (this['getWorldPosition'](a6),
       this['userData']['computed']['size']),
     a8 = {
       'x': a7['x'] / (2 * units),
       'y': a7['y'] / (2 * units),
       'z': a7['z'] / (2 * units)
     },
     a9 = this['getWorldQuaternion'](new THREE['Quaternion']());
   var aa, ab = [new THREE['Vector3'](-a8['x'], 0, -a8['z']), new THREE['Vector3'](a8['x'], 0, -a8['z']), new THREE[
       'Vector3'](a8['x'], 0, a8['z']), new THREE['Vector3'](-a8['x'], 0, a8['z']), new THREE['Vector3'](-a8['x'],
       2 * a8['y'], -a8['z']), new THREE['Vector3'](a8['x'], 2 * a8['y'], -a8['z']), new THREE['Vector3'](a8['x'],
       2 * a8['y'], a8['z']), new THREE['Vector3'](-a8['x'], 2 * a8['y'], a8['z'])]['map'](aQ => a6['clone']()[
       'add'](aQ['clone']()['applyQuaternion'](a9))),
     ac = [],
     ad = this['userData']['params']['spec'],
     ae, af, ag;
   let ah = 0 === a0['x'],
     ai = 0 === a0['y'],
     aj = 0 === a0['z'],
     ak = {
       'x': [],
       'y': [],
       'z': []
     };
   for (af in (traverse_parts(K['userData']['root'], (aQ, aR, aS) => {
         if ('fill_section' === aR && 0 < aQ['userData']['children']['length'])
           for (let aW = 0; aW < aQ['userData']['children']['length']; aW++) {
             var aT = aQ['userData']['children'][aW],
               aU, aV, aV;
             !aT || aT?.['userData']?.['path'] === this['object_path'] && K['uuid'] === this['section_uuid'] ||
               aT instanceof CabinetSection && (aU = new THREE['Vector3'](),
                 aT['getWorldPosition'](aU),
                 aV = {
                   'x': (aV = aT['userData']['computed']['size'])['x'] / (2 * units),
                   'y': aV['y'] / (2 * units),
                   'z': aV['z'] / (2 * units)
                 },
                 ah && (ak['x']['push']({
                     'pos': aU['x'] - aV['x'],
                     'type': 'min',
                     'path': aT['userData']['path'],
                     'pivot': aT['userData']['params']['spec']['fill_pivot']
                   }),
                   ak['x']['push']({
                     'pos': aU['x'],
                     'type': 'center',
                     'path': aT['userData']['path'],
                     'pivot': aT['userData']['params']['spec']['fill_pivot']
                   }),
                   ak['x']['push']({
                     'pos': aU['x'] + aV['x'],
                     'type': 'max',
                     'path': aT['userData']['path'],
                     'pivot': aT['userData']['params']['spec']['fill_pivot']
                   })),
                 ai && (ak['y']['push']({
                     'pos': aU['y'],
                     'type': 'min',
                     'path': aT['userData']['path'],
                     'pivot': aT['userData']['params']['spec']['fill_pivot']
                   }),
                   ak['y']['push']({
                     'pos': aU['y'] + aV['y'],
                     'type': 'center',
                     'path': aT['userData']['path'],
                     'pivot': aT['userData']['params']['spec']['fill_pivot']
                   }),
                   ak['y']['push']({
                     'pos': aU['y'] + 2 * aV['y'],
                     'type': 'max',
                     'path': aT['userData']['path'],
                     'pivot': aT['userData']['params']['spec']['fill_pivot']
                   })),
                 aj) && (ak['z']['push']({
                   'pos': aU['z'] - aV['z'],
                   'path': aT['userData']['path'],
                   'pivot': aT['userData']['params']['spec']['fill_pivot']
                 }),
                 ak['z']['push']({
                   'pos': aU['z'],
                   'path': aT['userData']['path'],
                   'pivot': aT['userData']['params']['spec']['fill_pivot']
                 }),
                 ak['z']['push']({
                   'pos': aU['z'] + aV['z'],
                   'path': aT['userData']['path'],
                   'pivot': aT['userData']['params']['spec']['fill_pivot']
                 }));
           }
       }),
       K instanceof CabinetFillSection && (ae = new THREE['Vector3'](),
         K['getWorldPosition'](ae),
         ah && ak['x']['push']({
           'pos': ae['x'],
           'path': K['userData']['path']
         }),
         ai && ak['y']['push']({
           'pos': ae['y'],
           'path': K['userData']['path']
         }),
         aj) && ak['z']['push']({
         'pos': ae['z'],
         'path': K['userData']['path']
       }),
       a4)) {
     var al = a4[af];
     if (al && al['userData']['path'] !== this['object_path'] && al['snap_points_group']) {
       for (var am of al['snap_points_group']['snap_meshes']) {
         var an = new THREE['Vector3'](),
           ao;
         am['getWorldPosition'](an);
         for (ao of ab) {
           var ap = ao['distanceTo'](an);
           if (ap < a2 && (ac.push({
                 'from': ao,
                 'to': an['clone'](),
                 'mode': 'full'
               }),
               3 <= ac.length))
             break;
         }
         if (3 <= ac.length)
           break;
       }
       if (3 <= ac.length)
         break;
     }
   }
   if (K['snap_points_group'])
     for (var aq of K['snap_points_group']['snap_meshes']) {
       var ar = new THREE['Vector3'](),
         as;
       aq['getWorldPosition'](ar);
       for (as of ab) {
         var at = as['distanceTo'](ar);
         if (at < a2 && (ac.push({
               'from': as,
               'to': ar['clone'](),
               'mode': 'full'
             }),
             3 <= ac.length))
           break;
       }
       if (3 <= ac.length)
         break;
     }
   if (0 === ac.length) {
     let aQ = ['x', 'y', 'z'];
     for (var au of aQ) {
       for (let aR = 0; aR < ak[au]['length']; aR++) {
         for (var av of ab) {
           var aw = ak[au][aR]['pos'],
             ax = ak[au][aR]['path'],
             ay = ak[au][aR]['pivot'] || null,
             az;
           if (Math['abs'](av[au] - aw) <= a2) {
             ac.push({
               'from': av,
               'axis': au,
               'value': aw,
               'path': ax,
               'pivot': ay
             });
             break;
           }
           if (3 <= ac.length)
             break;
         }
         if (3 <= ac.length)
           break;
       }
       if (3 <= ac.length)
         break;
     }
   }
   if (0 < ac.length) {
     if ('full' === ac[0]['mode']) {
       let aS = new THREE['Vector3']()['subVectors'](ac[0]['to'], ac[0]['from']),
         aT = new THREE['Vector3']();
       return aT['copy'](this['position']),
         a5.forEach(aU => {
           if (a0[aU] && (aS[aU] = 0),
             !a0[aU]) {
             aT['add'](aS);
             let aW = a1[aU][0],
               aX = Math['abs'](aT[aU] - aW);
             for (let aY = 1; aY < a1[aU]['length']; aY++) {
               var aV = Math['abs'](aT[aU] - a1[aU][aY]);
               aV < aX && (aX = aV,
                 aW = a1[aU][aY]);
             }
             aT[aU] = aW;
           }
         }),
         this['position']['copy'](aT),
         K['userData']['own_object']['worldToLocal'](this['position']['clone']());
     } {
       var ae = ac[0]['axis'],
         aA = ac[0]['value'],
         aB = ac[0]['from'];
       let aU = this['userData']['computed']['size'],
         aV = {
           'x': aU['x'] / 2 / units,
           'y': aU['y'] / 2 / units,
           'z': aU['z'] / 2 / units
         };
       var aB = {
         'min': aB[ae] - aV[ae],
         'center': aB[ae],
         'max': aB[ae] + aV[ae]
       };
       let aW = null,
         aX = 1 / 0;
       var aC = null,
         aD, aE, aF;
       for ([aD, aE] of Object['entries'](aB)) {
         var aG = Math['abs'](aE - aA);
         aG < a2 && aG < aX && (aX = aG,
           aW = aA - aE,
           aC = aD);
       }
       if (ac[0]['axis'] && 0 === a0[ac[0]['axis']]) {
         var aB = this['position']['clone'](),
           aH = this['position']['clone']();
         let b0, b1;
         var aI = new THREE['Vector3']();
         let b2;
         var aJ = (b2 = 'x' === ae ? new THREE['Vector3'](1, 0, 0) : 'y' === ae ? new THREE['Vector3'](0, 1,
             0) : new THREE['Vector3'](0, 0, 1))['clone']()['applyQuaternion'](a9),
           aK = Math['abs'](aJ['x']),
           aL = Math['abs'](aJ['y']),
           aM = Math['abs'](aJ['z']);
         let b3;
         b3 = aL < aK && aM < aK ? 'x' : aK < aM && aL < aM ? 'z' : 'y',
           b1 = 'y' === b3 ? (b0 = new THREE['Vector3'](-a3['userData']['computed']['size']['x'] / 2 / units, 0, -
               a3['userData']['computed']['size']['z'] / 2 / units),
             new THREE['Vector3'](a3['userData']['computed']['size']['x'] / 2 / units, 0, -a3['userData'][
               'computed']['size']['z'] / 2 / units)) : (b3,
             b0 = new THREE['Vector3'](a3['userData']['computed']['size']['x'] / 2 / units, 0, a3['userData'][
               'computed'
             ]['size']['z'] / 2 / units),
             new THREE['Vector3'](a3['userData']['computed']['size']['x'] / 2 / units, a3['userData']['computed'][
               'size'
             ]['y'] / units, a3['userData']['computed']['size']['z'] / 2 / units)),
           b0['applyQuaternion'](a9),
           b1['applyQuaternion'](a9),
           aB['add'](b0),
           aH['add'](b1),
           aB[ae] = ac[0]['value'],
           aH[ae] = ac[0]['value'];
         var aK = aB['distanceTo'](aH),
           aL = document['createElement']('div'),
           aM = (aL['style']['position'] = 'absolute',
             aL['style']['pointerEvents'] = 'none',
             document['createElement']('div')),
           aN, aO;
         aM['style']['borderTop'] = '1px\x20dashed\x20#000',
           aM['style']['height'] = '0px',
           aM['style']['transformOrigin'] = 'center';
         let b4 = 0;
         'x' === b3 ? (aN = Math['atan2'](aJ['y'], aJ['x']),
             b4 = 90,
             aM['style']['width'] = 5 * aK + 'px') : 'z' === b3 ? (aO = Math['atan2'](aJ['x'], aJ['zy']),
             b4 = 90,
             aM['style']['width'] = 5 * aK + 'px') : aM['style']['width'] = 10 * aK + 'px',
           aM['style']['transform'] = 'rotate(' + b4 + 'deg)',
           aL['appendChild'](aM);
         var a3 = aB['clone']()['add'](aH)['multiplyScalar'](0.5),
           aP;
         new THREE['CSS2DObject'](aL)['position']['copy'](a3);
       }
       let aY = new THREE['Vector3'](),
         aZ = (aY[ae] = aW,
           new THREE['Vector3']());
       return aZ['copy'](this['position']),
         a5.forEach(b5 => {
           if (a0[b5] && (aY[b5] = 0),
             !a0[b5]) {
             aZ['add'](aY);
             let b7 = a1[b5][0],
               b8 = Math['abs'](aZ[b5] - b7);
             for (let b9 = 1; b9 < a1[b5]['length']; b9++) {
               var b6 = Math['abs'](aZ[b5] - a1[b5][b9]);
               b6 < b8 && (b8 = b6,
                 b7 = a1[b5][b9]);
             }
             aZ[b5] = b7;
           }
         }),
         this['position']['copy'](aZ),
         K['userData']['own_object']['worldToLocal'](this['position']['clone']());
     }
   }
 }
 ['_build_spec']() {
   var f, g;
   this['userData']['is_root'] || this['userData']['params']['spec']['is_fill'] || (g = check_is_fill(this['userData'][
       'parent'
     ]),
     this['userData']['params']['spec']['raycast_ignore'] = g);
 }
 ['_get_size']() {
   return new THREE['Vector3'](parseFloat(this['userData']['computed']['size']['x']) / units, parseFloat(this[
     'userData']['computed']['size']['y']) / units, parseFloat(this['userData']['computed']['size']['z']) / units);
 }
 ['_optimize']() {
   var f = ['wall', 'furniture', 'facade', 'model', 'hole'];
   for (let i = 0; i < f.length; i++) {
     var g = f[i];
     for (let j = this['userData']['parts'][g]['length']; j--;) {
       var h = this['userData']['parts'][g][j];
       for (let k = 0; k < h['userData']['own_object']['children']['length']; k++)
         this['attach'](h['userData']['own_object']['children'][k]);
       if ('facade' == g && h['userData']['handle']) {
         for (let l = 0; l < h['userData']['handle']['userData']['own_object']['children']['length']; l++)
           this['attach'](h['userData']['handle']['userData']['own_object']['children'][l]);
       }
       this['userData']['parts'][g]['splice'](j, 1),
         h['parent']['remove'](h);
     }
   }
 }
 ['change_glass_material'](f) {
   this['userData']['params']['spec']['defaults']['facade']['materials']['glass'] = f;
   var g = this['userData']['parts']['facade'];
   for (let h = 0; h < g.length; h++)
     g[h]['_change_glass_material'](f);
 }
 ['_get_specs'](g) {
   var j = pp['events']?.['cabinet']?.['before_create_spec_item'],
     k = pp['events']?.['cabinet']?.['after_create_spec_item'],
     q = this['userData']['params'],
     v = this['userData']['computed'],
     w = this['userData']['c_object'],
     x;
   if (g = g || {
       'all': {},
       'sum': {},
       'sum_arr': [],
       'aggr_funcs': {}
     },
     view_mode)
     return g;
   if ((module_utils['init_spec_ctx_aggr'](g),
       j) && false === j('module', this, g))
     return g;
   var j = module_utils['check_spec_param'](this, 'show_in_spec', 1),
     z = module_utils['check_spec_param'](this, 'nested_in_spec', 1);
   if (!j)
     return g;
   var j = this['userData']['is_root'],
     A = q['id'] || q['spec']['id'] || '',
     B = pp['libs']['catalogs'][q['spec']['element_type']]?.['find_item'](q['spec']['id']),
     C = B?.['params']?.['name'] || q['name'] || '',
     E = module_utils['get_price_mod']('module', q['spec']['element_type']),
     F = q['spec']['size'],
     G = q['spec']['variants'][q['spec']['selected_variant']]?.['size'];
   let H = 0;
   G && F && parse_num(F['x']) === comp2(G['x'], w) && parse_num(F['y']) === comp2(G['y'], w) && parse_num(F['z']) ===
     comp2(G['z'], w) && (H = 1);
   var F = {
       'type': 'module',
       'id': A,
       'element_type': q['spec']['element_type'],
       'name': C || '',
       'code': v['code'] || '',
       'icon': B?.['params']?.['icon'] || B?.['icon'] || '',
       'price': parse_num(v['price']) * E,
       'show_price': 1,
       'is_root': j,
       'is_variant': H,
       'selected_variant': q['spec']['selected_variant'],
       'params_item': q['spec']?.['params_item'] || ''
     },
     I;
   if ((F['sum_key'] = F['id'] + ('_' + F['element_type'] + '_') + F['code'],
       k) && false === k('module', this, g, F))
     return g;
   if (j) {
     var G = {
         'all': {},
         'sum': {},
         'sum_arr': [],
         'aggr_funcs': {}
       },
       J = (g['custom'] && (G['custom'] = g['custom']),
         super['_get_specs'](G, !z)),
       K, L;
     let N = null;
     for (L of ['wall', 'butts', 'facade'])
       if (J['sum'][L] && (N = _['find'](Object['values'](J['sum'][L]), O => 'p' === O['price_type'] || 'hl' === O[
           'price_type'])))
         break;
     return N && (F['show_price'] = 0),
       module_utils['add_spec_to_context'](g, F),
       F['ctx'] = J,
       module_utils['merge_specs'](g, J, true, true),
       g;
   }
   return module_utils['add_spec_to_context'](g, F),
     super['_get_specs'](g, !z);
 }
 ['_on_drag_end'](f) {
   this['userData']['params']['events'] && this['userData']['params']['events']['on_drag_end'] && 'function' ==
     typeof pp['events']['custom'][this['userData']['params']['events']['on_drag_end']] && pp['events']['custom'][this[
       'userData']['params']['events']['on_drag_end']](f, this);
 }
 ['CSG_Operation'](f = false, g = 'SUBTRACTION') {
   if (this['userData']['is_root']) {
     let k = [],
       l = [];
     for (var h in this['userData']['parts']) {
       var h = this['userData']['parts'][h];
       if (Array.isArray(h)) {
         for (var j of h)
           j?.['userData']?.['params']?.['is_target'] && (0 < j['userData']['children']['length'] && j['userData'][
               'children'
             ]['forEach'](m => {
               !(m instanceof THREE['Mesh'] || m instanceof THREE['CSG']['Brush']) || m['exclude_cut'] || k.push(
               m);
             }),
             j['userData']?.['butt_objects']) && 0 < j['userData']['butt_objects']['length'] && j['userData'][
             'butt_objects'
           ]['forEach'](m => {
             for (var n of m['userData']['children'])
               !(n instanceof THREE['Mesh'] || n instanceof THREE['CSG']['Brush']) || n['exclude_cut'] || k.push(
               n);
           }),
           j instanceof CabinetCut && 0 < j['userData']['children']['length'] && j['userData']['children']['forEach'](
             m => {
               !(m instanceof THREE['Mesh'] || m instanceof THREE['CSG']['Brush']) || m['exclude_cut'] || l.push(m);
             }
           );
         module_utils['CSG_Operation'](k, l, f, g);
       }
     }
   }
 }
 ['build_comments']() {
   var f = this['userData']['params'],
     g = f['comments'],
     h = this['userData']['obj_links'],
     h = (h['comments'] || (h['comments'] = {
         'sprite': null,
         'line': null
       }),
       h['comments']),
     g;
   h['sprite'] && this['remove'](h['sprite']),
     h['line'] && this['remove'](h['line']),
     h['sprite'] = null,
     h['line'] = null,
     '' !== g && (h['sprite'] = makeTextSprite(g, 0, parseInt(f['size']['y']) / units + 50, 0, {
         'fontsize': 54,
         'fontface': 'Georgia',
         'borderColor': {
           'r': 0,
           'g': 0,
           'b': 0,
           'a': 1
         },
         'borderThickness': 2,
         'fillColor': {
           'r': 255,
           'g': 255,
           'b': 255,
           'a': 0
         },
         'radius': 15,
         'vAlign': 'bottom',
         'hAlign': 'center'
       }),
       this['add'](h['sprite']),
       g = new THREE['BufferGeometry']()['setFromPoints']([new THREE['Vector3'](0, parseInt(f['size']['y']) / units,
         0), new THREE['Vector3'](0, h['sprite']['position']['y'] - 1, 0)]),
       h['line'] = new THREE['Line'](g, pp['engine']['materials']['black_line_no_depth']),
       this['add'](h['line']),
       this['set_comments_visible'](pp['state']['scene_layers']['comments']));
 }
 ['set_comments_visible'](f) {
   var g = this['userData']['obj_links']['comments'];
   g['sprite'] && (g['sprite']['visible'] = f,
     g['line']['visible'] = f);
 }
 ['show_comments']() {
   this['set_comments_visible'](true);
 }
 ['hide_comments']() {
   this['set_comments_visible'](false);
 }
 ['add_number'](f) {
   var g = this['userData']['obj_links'];
   g['number'] && this['remove'](g['number']),
     g['number'] = generate_sprite_number(f, this),
     g['number']['visible'] = pp['state']['scene_layers']['numbers'],
     this['add'](g['number']);
 }
 ['set_number_visible'](f) {
   var g = this['userData']['obj_links'];
   g['number'] && (g['number']['visible'] = f);
 }
 }

 function get_excluded_objects(g, j, k) {
   let q = [];
   var v = 1;
   if (j['section_uuid'] !== g['uuid'])
     return j['userData']['connected'] = [],
       [];
   if (0 < j['userData']['connected']['length']) {
     var w = [],
       x = [];
     for (let K = 0; K < j['userData']['connected']['length']; K++) {
       var z = j['userData']['connected'][K],
         A = g['userData']['root']['get_child_params_by_path'](z),
         B = g['userData']['root']['userData']['parts_by_path']['module'][z],
         C = j['userData']['params']['spec'],
         C, B;
       k = k || {
           'x': C['fill_size_x'],
           'y': C['fill_size_y'],
           'z': C['fill_size_z']
         },
         B && (C = B['userData']['computed']['size'],
           B = B['userData']['computed']['pos'],
           1 == k['x'] && 1 == A['spec']['fill_size_y'] && k['z'] == A['spec']['fill_size_z'] || 1 == k['y'] &&
           1 == A['spec']['fill_size_x'] && k['z'] == A['spec']['fill_size_z'] || 1 == k['z'] && 1 == A['spec'][
             'fill_size_y'
           ] && k['x'] == A['spec']['fill_size_x'] || 1 == k['y'] && 1 == A['spec']['fill_size_z'] && k['x'] == A[
             'spec']['fill_size_x'] || 1 == k['x'] && 1 == A['spec']['fill_size_z'] && k['y'] == A['spec'][
             'fill_size_y'
           ] || 1 == k['z'] && 1 == A['spec']['fill_size_x'] && k['y'] == A['spec']['fill_size_y']) && w.push({
           'path': z,
           'size': C,
           'pos': B
         });
     }
     var D = g['userData']['root']['userData']['parts_by_path']['module'][j['object_path']]?.['userData']['computed'] ||
       g['userData']['root']['userData']['parts_by_path']['module'][j['userData']['path']]?.['userData']['computed'],
       E = {
         'x': [],
         'y': [],
         'z': []
       },
       F;
     for (let L of w) {
       var G = g['userData']['root']['get_child_params_by_path'](L['path'])['spec'];
       0 === G['fill_size_x'] && E['x']['push'](L),
         0 === G['fill_size_y'] && E['y']['push'](L),
         0 === G['fill_size_z'] && E['z']['push'](L);
     }
     for (F of ['x', 'y', 'z']) {
       var H = E[F];
       if (0 < H.length)
         for (let N = 0; N < H.length; N++) {
           var I = Math['abs'](H[N]['pos'][F] - D['pos'][F] - D['size'][F]) < 1,
             J = Math['abs'](H[N]['pos'][F] + H[N]['size'][F] - D['pos'][F]) < 1;
           !I && !J || x['includes'](H[N]['path']) || x.push(H[N]['path']);
         }
     }
     q = [...x];
   }
   return q;
 }

 function get_parent_module(f) {
   return f instanceof Module ? f : f['parent'] ? get_parent_module(f['parent']) : null;
 }

 function create_multi() {
   var f = pp['libs']['catalogs']['korpusnaya_mebel']['get_item'](1)['params'];
   f['id'] = 1,
     f['lib'] = 'module',
     f['size'] && delete f['size'];
   let g = 0,
     h = 80;
   for (let l = 0; l < 10; l++) {
     var j = sc['add_object']('module', f, false);
     0 < l % 2 || (g += 80),
       j['position']['z'] = h,
       j['position']['x'] = g;
   }
   g = 0,
     h = 160;
   for (let m = 0; m < 10; m++) {
     var k = sc['add_object']('module', f, false);
     k['position']['z'] = h,
       0 < m % 2 || (g += 80),
       k['position']['z'] = h,
       k['position']['x'] = g;
   }
 }

 function optimize() {
   for (let f = 0; f < d_objects.length; f++)
     d_objects[f]['_optimize']();
 }

 function check_is_fill(f) {
   let g = [];

   function h(i) {
     i?.['userData']?.['is_root'] || (i instanceof Module && g.push(i),
       i?.['userData']['parent'] && h(i['userData']['parent']));
   }
   return h(f),
     g['some'](i => 1 === i['userData']['params']['spec']['is_fill']);
 }

 function test_sections() {
   var f = new THREE['Group']();
   for (let g = 0; g < 30000; g++)
     b = new THREE['Group'](),
     scene['add'](b);
   return f;
 }

 function count_scene() {
   let e = 0;
   return scene['traverse'](f => {
       e++;
     }),
     e;
 }

 function count_obj(f) {
   let g = 0;
   return f['traverse'](h => {
       g++;
     }),
     g;
 }

 function count_parts(f) {
   let g = {};
   return Object['keys'](f['userData']['parts'])['forEach'](h => {
       var i = f['userData']['parts'][h];
       g[h] = {
         'parts': 0,
         'objs': 0
       };
       for (let j = 0; j < i.length; j++)
         g[h]['parts']++,
         i[j]['traverse'](k => {
           g[h]['objs']++;
         });
     }),
     g;
 }

 function ray_matrix_box_intersections(f, g, h, i, j) {
   let k = [];
   return i.forEach(m => {
       var n = get_parent_module(m),
         n, n, q, v, w, q, n, v;
       m['visible'] && n['userData']['path'] != f['object_path'] && (n = n['userData']?.['path']) && !f['userData'][
         'connected'
       ]['includes'](n) && (m['updateWorldMatrix'](true, false),
         g['updateWorldMatrix'](true, false),
         n = {
           'x': m['userData']['computed']['size']['x'] / units,
           'y': m['userData']['computed']['size']['y'] / units,
           'z': m['userData']['computed']['size']['z'] / units
         },
         q = new THREE['Vector3'](n['x'] / 2, n['y'] / 2, n['z'] / 2),
         (v = new THREE['Matrix4']())['copy'](m['matrixWorld']),
         (w = new THREE['Box3']())['setFromCenterAndSize'](q, new THREE['Vector3'](n['x'], n['y'], n['z'])),
         w['applyMatrix4'](v),
         q = new THREE['Ray'](h['ray']['origin'], j),
         n = new THREE['Vector3'](),
         q['intersectBox'](w, n)) && (v = h['ray']['origin']['distanceTo'](n),
         k.push({
           'distance': v,
           'object': m,
           'point': n['clone']()
         }));
     }),
     k['sort']((m, n) => m['distance'] - n['distance']);
 }
 class SnapPoints extends THREE['Group'] {
   constructor(f = {}) {
       super();
       var g = f['points'] || [],
         j = f['size'] || {
           'x': 10,
           'y': 10,
           'z': 10
         },
         k = f['parent'] || null,
         l = new THREE['BoxGeometry'](j['x'] / units, j['y'] / units, j['z'] / units),
         q = pp['three']['materials']['snap_points'];
       this['snap_meshes'] = [],
         this['group'] = 'snap_group';
       for (let E = 0; E < g.length; E++) {
         var v = g[E],
           w = new THREE['Mesh'](l, q),
           x = (this['snap_meshes']['push'](w),
             this['add'](w),
             k['userData']['computed']['c_object']),
           y = k['userData']['computed']['size'],
           y = (x['parent_size'] = y,
             comp2(v['pos']['x'], x)),
           A = comp2(v['pos']['y'], x),
           v = comp2(v['pos']['z'], x),
           x = (w['group'] = 'snap_point',
             w['layers']['set'](1),
             k['userData']['computed']),
           B = k['userData']['params']['pivot'],
           C = 0 === B['x'] ? x['size']['x'] / 2 : 1 === B['x'] ? x['size']['x'] : 0,
           D = 0 === B['y'] ? x['size']['y'] / 2 : 1 === B['y'] ? x['size']['y'] : 0,
           B = 0 === B['z'] ? x['size']['z'] / 2 : 1 === B['z'] ? x['size']['z'] : 0;
         w['position']['set']((y - C) / units, (A - D) / units, (v - B) / units);
       }
     }
     ['show']() {
       this['visible'] = true;
     }
     ['hide']() {
       this['visible'] = false;
     }
 }
 THREE['Mesh']['prototype']['pp_is_visible'] = function() {
   let e = f => !f || (f['parent'] ? false !== f['visible'] && false !== f['parent']['visible'] && e(f['parent']) : !
     1 !== f['visible']);
   return e(this);
 };
 let module_utils = {
   'add_child_by_path'(f, g, h, j, k = true) {
     var m = f['userData'];
     let n;
     if (n = g && '0' !== g ? this['get_child_params_by_path'](f, g) : this['create_template_children_proxy'](f)) {
       n['children'] || (n['children'] = []);
       var h = h;
       let o = j;
       return void 0 === j || j < 0 || j > n['children']['length'] ? (n['children']['push'](h),
           o = n['children']['length'] - 1) : n['children']['splice'](j, 0, h),
         m && k && f['_rebuild'](),
         g + ',' + o;
     }
   },
   'remove_child_by_path'(f, g, h = true) {
     var j = f['userData'],
       g = this['get_parent_and_child_by_path'](f, g),
       k, g;
     g['parent'] && g['child'] && ((k = g['childIndex']) < 0 || (g = g['parent']) && g['children'] && (k >= g[
       'children']['length'] || (g['children']['splice'](k, 1),
       j && h && f['_rebuild']())));
   },
   'clone_child_by_path'(f, g, h = true) {
     var j = f['userData'],
       g = this['get_parent_and_child_by_path'](f, g),
       k, l, g;
     g['parent'] && g['child'] && ((k = g['childIndex']) < 0 || (l = g['parent']) && l['children'] && (k >= l[
       'children']['length'] || ((g = copy_object(g['child']))['name'] && (g['name'] += '\x20(Копия)'),
       l['children']['splice'](k + 1, 0, g),
       j && h && f['_rebuild']())));
   },
   'move_child_by_path'(f, g, h, j = true) {
     var k = f['userData'];
     if (g && h) {
       var g = this['get_parent_and_child_by_path'](f, g),
         m = g['parent'],
         n = g['childIndex'];
       if (!(n < 0) && g['parent'] && g['child']) {
         m['children']['splice'](n, 1);
         var m = this['get_parent_and_child_by_path'](f, h),
           n = m['parent'];
         let o = m['childIndex'];
         n && (n['children'] || (n['children'] = [],
             o = 0),
           o < 0 || (o >= n['children']['length'] ? n['children']['push'](g['child']) : n['children']['splice'](o,
               0, g['child']),
             k && j && f['_rebuild']()));
       }
     }
   },
   'change_param_by_path'(f, g, h, j, k = true) {
     var m = f['userData'],
       n = this['get_parent_and_child_by_path'](f, g);
     if (n['parent'] && n['child']) {
       var p = n['childIndex'];
       if (!(p < 0)) {
         var q = n['parent'],
           p;
         if (q && q['children'] && !(p >= q['children']['length']) && (utils['nested_object']['set'](n['child'], h,
             j),
             m) && k) {
           if ('active' === h)
             return '0' === n['parentPath'] ? void f['userData']['root']['_rebuild']() : void((p = this[
               'get_child_by_path'](f, n['parentPath'])) && p['_rebuild'] && p['_rebuild']());
           var q = this['get_child_by_path'](f, g);
           q && q['_rebuild']();
         }
       }
     }
   },
   'rebuild_child_by_path'(f, g) {
     var f = this['get_child_by_path'](f, g);
     f && f['_rebuild']();
   },
   'get_parent_and_child_by_path'(f, g) {
     var h = g.split(','),
       j = {
         'parent': null,
         'parentPath': '',
         'child': null,
         'childPath': '',
         'childIndex': -1
       };
     if (h.length < 1)
       return j;
     if (1 === h.length) {
       let o, p = (o = g && '0' !== g ? this['get_child_params_by_path'](f, g) || null : this[
           'create_template_children_proxy'](f),
         j['child'] = o,
         j['childPath'] = g,
         parseInt(h[0]));
       return Number['isInteger'](p) && 0 <= p && (j['childIndex'] = p),
         j;
     }
     var k = h['slice'](0, -1)['join'](','),
       k;
     if (!k)
       return j;
     let m, n = (k && '0' !== k ? 'module' === (m = this['get_child_params_by_path'](f, k))['type'] && (m = this[
         'create_template_children_proxy'](m, false)) : m = this['create_template_children_proxy'](f),
       m && (j['parent'] = m),
       j['parentPath'] = k,
       j['childPath'] = g,
       parseInt(h[h.length - 1]));
     return !Number['isInteger'](n) || n < 0 || (j['childIndex'] = n,
         !m['children']) || n >= m['children']['length'] ? j : (k = this['get_child_params_by_path'](f, g) || null) ?
       (j['child'] = k,
         j) : void 0;
   },
   'get_child_params_by_path'(f, g) {
     var h = f['userData'];
     if (!g)
       return null;
     var j = g['slice'](2)['split'](',');
     if (!j.length)
       return null;
     var g = h ? f['userData']['root']?.['userData']['params'] : f;
     let k = _['get'](g, 'spec.template.tree'),
       m = null;
     for (let v = 0; v < j.length; v++) {
       var n = j[v];
       if (!k || !k.length)
         return null;
       if (!(m = k[n]))
         return null;
       if ('module' === m['type'] && !m['spec']?.['templates']?.['length']) {
         var q = j[v + 1];
         if (void 0 !== q && m['spec']?.['fill_content'] && !m['spec']['fill_content_expanded']) {
           let w = null;
           for (var u of Object['values'](m['spec']['fill_content'] || {}))
             if ('' + u['temp_index'] == '' + q) {
               w = u;
               break;
             }
           m = w,
             k = w?.['children'],
             v += 1;
           continue;
         }
       }
       k = 'module' === m['type'] ? _['get'](m, 'spec.template.tree') : m['children'];
     }
     return m;
   },
   'get_child_by_path'(f, g) {
     if (g) {
       var h = f['userData']['root']?.['userData']['parts_by_path'];
       if (h)
         for (var j in h) {
           var j = h[j];
           if (j && j['hasOwnProperty'](g))
             return j[g];
         }
     }
     return null;
   },
   'get_variables'(f, g) {
     var h = f['userData'],
       h;
     let j = f;
     return (j = h ? f['userData']['is_root'] ? f['userData']['params'] : this['get_child_params_by_path'](f, f[
         'userData']['path']) : j) ? g && 'main' !== g ? 'template' === g ? _['get'](j, 'spec.template.variables') :
       'variant' === g ? (h = j['spec'] || {},
         _['get'](h, 'variants[' + h['selected_variant'] + '].variables')) : 'global' === g ? j['variables']?.[
         'global'
       ] : null : j['variables']?.['main'] : null;
   },
   'change_variables'(g, h, j) {
     if (g && h && (h = Array.isArray(h) ? h : [h])['length']) {
       let A = g;
       if ('scene' === g) {
         A = [];
         for (var k of d_objects)
           'module' === k['userData']['params']?.['type'] && A.push(k);
       } else
         Array.isArray(g) || (A = [g]);
       if (A.length) {
         let B = fill_defaults(j ? copy_object(j) : {}, {
             'triggerBuild': true,
             'raiseEvent': true,
             'action': 'add-or-update'
           }),
           C = (B['isMain'] || B['isTemplate'] || B['isVariant'] || B['isGlobal'] || (B['isMain'] = true), {
             'addOrUpdate': 'add-or-update' === B['action'],
             'add': 'add' === B['action'],
             'update': 'update' === B['action'],
             'remove': 'remove' === B['action']
           });
         for (var q of A) {
           var v = q['userData'],
             w = D(q, B),
             x, x, z, z;
           w && (B['isMain'] && E(w[x = 'main'], q, x),
             B['isTemplate'] && E(w[x = 'template'], q, x),
             B['isVariant'] && E(w[z = 'variant'], q, z),
             B['isGlobal'] && F(w[z = 'global'], q, z),
             v) && B['triggerBuild'] && (this['rebuild_variables'](q),
             'rebuild' === B['triggerBuild'] ? q['_rebuild']() : (q['_build'](),
               q['userData']['is_root'] && q['_after_build']()));
         }

         function D(H, I) {
           var J = H['userData'];
           let K = H;
           if (!(K = J ? H['userData']['is_root'] ? H['userData']['params'] : H['get_child_params_by_path'](H[
               'userData']['path']) : K))
             return null;
           let L = null;
           if (I['isMain']) {
             L = L || {},
               K['variables'] || (K['variables'] = {
                 'main': {}
               });
             let N = K['variables']['main'];
             is_object(N) || (N = Array.isArray(N) ? fix_json_empty_object(N) : {},
                 K['variables']['main'] = N),
               L['main'] = N;
           }
           if (I['isTemplate']) {
             L = L || {};
             var J = K['spec']?.['template'];
             if (J) {
               let O = J['variables'];
               is_object(O) || (O = Array.isArray(O) ? fix_json_empty_object(O) : {},
                   J['variables'] = O),
                 L['template'] = O;
             }
           }
           if (I['isVariant']) {
             L = L || {};
             var H = K['spec'] || {},
               J = _['get'](H, 'variants[' + H['selected_variant'] + ']');
             if (J) {
               let P = J['variables'];
               is_object(P) || (P = Array.isArray(P) ? fix_json_empty_object(P) : {},
                   J['variables'] = P),
                 L['variant'] = P;
             }
           }
           if (I['isGlobal']) {
             L = L || {},
               K['variables'] || (K['variables'] = {
                 'main': {}
               });
             let Q = K['variables']['global'];
             Array.isArray(Q) || (Q = [],
                 K['variables']['global'] = Q),
               L['global'] = Q;
           }
           return L;
         }

         function E(H, I, J) {
           if (H) {
             for (let K of h)
               if (K['key']) {
                 if (C['remove']) {
                   let L = false;
                   if (K['key'] in H) {
                     if (B['checkFixed'] && H[K['key']]['fixed'])
                       continue;
                     delete H[K['key']],
                       L = true;
                   }
                   L && G(K, 'remove', I, J);
                 } else
                   H[K['key']] ? !C['addOrUpdate'] && !C['update'] || B['checkFixed'] && H[K['key']]['fixed'] || _[
                     'find'](H[K['key']]['disabled_values'], N => '' + N == '' + K['value']) || (H[K['key']] = merge(
                       H[K['key']], copy_object(K)),
                     null === K['value'] && (H[K['key']]['value'] = null),
                     G(H[K['key']], 'update', I, J)) : (C['addOrUpdate'] || C['add']) && (H[K['key']] = copy_object(
                     K),
                     G(H[K['key']], 'add', I, J));
               }
           }
         }

         function F(H, I, J) {
           if (H) {
             for (let L of h)
               if (L['key']) {
                 if (C['remove']) {
                   let N = false;
                   for (let O = H.length - 1; 0 <= O; O--)
                     H[O]['key'] !== L['key'] || B['checkFixed'] && H[O]['fixed'] || (H['splice'](O, 1),
                       N = true);
                   N && G(L, 'remove', I, J);
                 } else {
                   let P = false;
                   for (let Q = 0; Q < H.length; Q++)
                     if (H[Q]['key'] === L['key']) {
                       if (C['addOrUpdate'] || C['update']) {
                         if (B['checkFixed'] && H[Q]['fixed'])
                           continue;
                         if (_['find'](H[Q]['disabled_values'], R => '' + R == '' + L['value']))
                           continue;
                         merge(H[Q], copy_object(L)),
                           null === L['value'] && (H[Q]['value'] = null),
                           G(H[Q], 'update', I, J);
                       }
                       P = true;
                     }
                   var K;
                   P || !C['addOrUpdate'] && !C['add'] || (K = copy_object(L),
                     H.push(K),
                     G(K, 'add', I, J));
                 }
               }
           }
         }

         function G(H, I, J, K) {
           var L = J['userData'],
             N = H['key'];
           if (L && B['raiseEvent'] && pp['variables_events'][N]) {
             var O, P = {
                 'target': J,
                 'variable': H,
                 'type': I,
                 'from': K
               },
               Q;
             for (Q of pp['variables_events'][N]['handlers'] || [])
               if ('string' == typeof Q && sc[Q])
                 try {
                   sc[Q](P);
                 } catch (R) {}
             else {
               if ('function' == typeof Q)
                 try {
                   Q(P);
                 } catch (S) {}
             }
           }
         }
       }
     }
   },
   'remove_variable'(f, g, h = true, j = false) {
     var k = f['userData'],
       j;
     g && (g in (j = this['get_variables'](f, j ? 'template' : 'main')) && delete j[g],
       k) && h && (this['rebuild_variables'](f),
       f['_build'](),
       f['userData']['is_root']) && f['_after_build']();
   },
   'rebuild_variables'(f) {
     var g;
     f['userData'] && (f['_before_variables'](),
       f['_build_variables'](),
       f['_build_comp_obj']());
   },
   'create_template_children_proxy'(f, g) {
     var h;
     let j = (void 0 !== g ? g : f['userData']) ? f['userData']['params'] : f;
     return {
       get 'children'() {
         return j['spec']['template']['tree'];
       },
       set 'children'(k) {
         j['spec']['template']['tree'] = k;
       }
     };
   },
   'remove_nested_modules'(f) {
     if (f) {
       Array.isArray(f) || (f = [f]);
       for (let q = 0; q < f.length; q++) {
         var g = f[q];
         if (g) {
           if ('module' === g['type']) {
             if (f[q] = {
                 'id': g['id'],
                 'spec': {
                   'id': g['spec']['id'],
                   'element_type': g['spec']['element_type'],
                   'fill_content': g['spec']['fill_content'],
                   'can_change': g['spec']['can_change'],
                   'movement_locked': g['spec']['movement_locked'],
                   'not_load_default': g['spec']['not_load_default']
                 },
                 'type': g['type'],
                 'condition': g['condition'],
                 'visible': g['visible'],
                 'active': g['active'],
                 'size': g['size'],
                 'pos': g['pos'],
                 'pivot': g['pivot'],
                 'rot': g['rot'],
                 'c_rot': g['c_rot'],
                 'comments': g['comments'],
                 'events': g['events']
               },
               g['name'] && (f[q]['name'] = g['name']),
               g['toggle'] && (f[q]['toggle'] = g['toggle']),
               Object['keys'](g['variables']?.['override'] || {})['length'] && (f[q]['variables'] || (f[q][
                   'variables'] = {}),
                 f[q]['variables']['override'] = g['variables']['override']),
               Object['keys'](g['variables']?.['apply'] || {})['length'] && (f[q]['variables'] || (f[q][
                 'variables'] = {}),
                 f[q]['variables']['apply'] = g['variables']['apply']),
               Object['keys'](g['spec']['params_apply'] || {})['length'] && (f[q]['spec']['params_apply'] || (f[q][
                   'spec'
                 ]['params_apply'] = {}),
                 f[q]['spec']['params_apply'] = g['spec']['params_apply']),
               f[q]['spec']['fill_content']) {
               var h = f[q]['spec']['fill_content'],
                 j;
               for (j of Object['keys'](h))
                 h[j]['children']?.['length'] ? (delete h[j]['temp_index'],
                   this['remove_nested_modules'](h[j]['children'])) : delete h[j];
             }
             if (f[q]['spec']['params_apply']) {
               var k = f[q]['spec']['params_apply'],
                 m;
               for (m of Object['keys'](k)) {
                 for (var n of Object['keys'](k[m] || {})) {
                   var p = k[m][n];
                   null == p && delete k[m][n];
                 }
                 Object['keys'](k[m] || {})['length'] || delete k[m];
               }
               Object['keys'](k)['length'] || delete f[q]['spec']['params_apply'];
             }
           } else
             'furniture' === g['type'] ? (f[q] = {
                 'spec': {
                   'id': g['spec']['id']
                 },
                 'type': g['type'],
                 'condition': g['condition'],
                 'visible': g['visible'],
                 'active': g['active'],
                 'pos': g['pos'],
                 'pivot': g['pivot'],
                 'rot': g['rot'],
                 'c_rot': g['c_rot'],
                 'comments': g['comments']
               },
               g['name'] && (f[q]['name'] = g['name']),
               g['toggle'] && (f[q]['toggle'] = g['toggle'])) : this['remove_nested_modules'](g['children']);
         }
       }
     }
   },
   'init_empty_values_recursive_by_path'(f, g) {
     var h;
     if (f['userData'] && g) {
       let p = f['userData']['params'],
         q = null;
       if ('0' !== g) {
         var {
           parentPath: j,
           child: k,
           childIndex: m
         } = module_utils['get_parent_and_child_by_path'](f, g);
         if (!k || m < 0)
           return false;
         p = k;
         let u = null;
         for (u = j && '0' !== j ? module_utils['get_child_by_path'](f, j) : f['userData']['is_root'] ? f : f[
             'userData']['root']; u;) {
           if (u['userData']['computed']['defaults']) {
             var n = module_utils['get_child_params_by_path'](f, u['userData']['path']);
             q = n?.['spec']?.['defaults'] || u['userData']['computed']['defaults'];
             break;
           }
           u = u['userData']['parent'];
         }
         q = q && copy_object(q);
       }
       var m = p['spec']['defaults'] ? copy_object(p['spec']['defaults']) : {},
         k = module_utils['get_global_defaults'](p),
         j = module_utils['create_defaults'](m, q, k);
       module_utils['init_empty_values_recursive'](p, j, '0' === g);
     }
   },
   'init_empty_values_recursive'(f, g, h) {
     if (f && g) {
       if (this['init_empty_values'](f, g),
         'module' === f['type'] || h) {
         var j = f['spec'] && f['spec']['templates'] || [],
           k;
         g = merge_copies(g, f['spec']['defaults'] || {}),
           h && this['init_empty_defaults'](f, g);
         for (k of j) {
           var m = k && k['template'] && k['template']['tree'],
             n;
           if (!m)
             return;
           for (n of m)
             this['init_empty_values_recursive'](n, g);
         }
       } else {
         var h = f['children'];
         if (h) {
           for (var o of h)
             this['init_empty_values_recursive'](o, g);
         }
       }
     }
   },
   'init_empty_values'(f, g) {
     var h = f['type'];
     if ('section' !== h && 'module' !== h) {
       if ('wall' === h) {
         f['spec'] || (f['spec'] = {});
         for (var j of f['spec']['butts']) {
           let w = j['id'],
             x = j['variant_id'];
           is_empty_id(w) && (w = g['butt']['id'],
               is_empty_id(w) && (w = 0),
               x = null),
             is_empty_value(x) && (x = g['butt']['variant_id'],
               is_empty_value(x)) && (x = 0),
             j['id'] = w,
             j['variant_id'] = x;
         }
       } else {
         if ('cokol' === h || 'cokol_top' === h) {
           f['spec'] || (f['spec'] = {});
           let y = f['spec']['id'];
           is_empty_id(y) && (y = g[h]['id'],
               is_empty_id(y)) && (y = 0),
             void(f['spec']['id'] = y);
         } else {
           if ('tabletop' === h) {
             f['spec'] || (f['spec'] = {}),
               f['spec']['material'] || (f['spec']['material'] = {});
             let z = f['spec']['material']['id'],
               A = f['spec']['material']['variant_id'];
             is_empty_id(z) && (z = g[h]['id'],
                 is_empty_id(z)) && (z = 0),
               is_empty_value(A) && (A = g[h]['variant_id'],
                 is_empty_value(A)) && (A = 0),
               f['spec']['material']['id'] = z,
               f['spec']['material']['variant_id'] = A;
             var k = f['spec']['plints'],
               m = g[h]['plints'],
               n;
             for (n of Object['keys'](m)) {
               let B = k[n];
               is_empty_value(B) && (B = m[n],
                   is_empty_value(B)) && (B = 0),
                 k[n] = B;
             }
             is_empty_value(k['enabled']) && (k['enabled'] = 1),
               void(is_empty_id(k['material']) && (k['material'] = g[h]['plints']['material'],
                 is_empty_id(k['material'])) && (k['material'] = '1'));
           } else {
             if ('bort' === h) {
               f['spec'] || (f['spec'] = {}),
                 f['spec']['material'] || (f['spec']['material'] = {});
               let C = f['spec']['material']['id'];
               is_empty_id(C) && (C = g['tabletop']['plints']['material'],
                   is_empty_id(C)) && (C = '1'),
                 void(f['spec']['material']['id'] = C);
             } else {
               if ('cornice_placer' === h) {
                 f['spec'] || (f['spec'] = {});
                 let D = f['spec']['id'];
                 is_empty_id(D) && (D = g['cornice']['id'],
                     is_empty_id(D)) && (D = 0),
                   void(f['spec']['id'] = D);
               } else {
                 if ('facade' === h) {
                   f['spec'] || (f['spec'] = {}),
                     f['spec']['materials'] || (f['spec']['materials'] = {
                       'gen': 0,
                       'glass': 0
                     });
                   let E = f['spec']['id'],
                     F = (is_empty_id(E) && (E = g[h]['id'],
                         is_empty_id(E)) && (E = 0),
                       f['spec']['id'] = E,
                       f['spec']['type']);
                   is_empty_value(F) && (F = g[h]['type'],
                       is_empty_value(F)) && (F = 'full'),
                     f['spec']['type'] = F;
                   var q = f['spec']['materials'],
                     u = g[h]['materials'],
                     v;
                   for (v of Object['keys'](u)) {
                     let H = q[v];
                     is_empty_id(H) && (H = u[v],
                         is_empty_id(H)) && (H = 0),
                       q[v] = H;
                   }
                   f['spec']['handle'] || (f['spec']['handle'] = {});
                   let G = f['spec']['handle']['id'];
                   if (is_empty_id(G)) {
                     G = g['handle']['id'],
                       is_empty_id(G) && (G = 0);
                     let I = g['handle']['size'];
                     is_empty_value(I) && (I = 0),
                       f['spec']['handle']['p_size'] = I;
                   }
                   f['spec']['handle']['p_size'] || (f['spec']['handle']['p_size'] = 0),
                     f['spec']['handle']['id'] = G;
                 }
               }
             }
           }
         }
       }
     }
   },
   'init_empty_defaults'(f, g) {
     f['spec']['defaults'] = this['create_defaults'](f['spec']['defaults']);
     var f = f['spec']['defaults'];
     is_empty_id(f['tabletop']['id']) && !is_empty_id(g['tabletop']['id']) && (f['tabletop']['id'] = g['tabletop'][
           'id'
         ],
         f['tabletop']['variant_id'] = g['tabletop']['variant_id']),
       is_empty_id(f['tabletop']['plints']['material']) && !is_empty_id(g['tabletop']['plints']['material']) && (f[
         'tabletop']['plints']['material'] = g['tabletop']['plints']['material']),
       is_empty_id(f['facade']['id']) && !is_empty_id(g['facade']['id']) && (f['facade']['id'] = g['facade']['id'],
         f['facade']['materials'] = g['facade']['materials']),
       is_empty_value(f['facade']['type']) && !is_empty_value(g['facade']['type']) && (f['facade']['type'] = g[
         'facade']['type']),
       is_empty_value(f['facade']['type_radius']) && !is_empty_value(g['facade']['type_radius']) && (f['facade'][
         'type_radius'
       ] = g['facade']['type_radius']),
       is_empty_value(f['facade']['type_side']) && !is_empty_value(g['facade']['type_side']) && (f['facade'][
         'type_side'
       ] = g['facade']['type_side']),
       is_empty_value(f['handle']['id']) && !is_empty_value(g['handle']['id']) && (f['handle']['id'] = g['handle'][
         'id'
       ]),
       is_empty_value(f['handle']['size']) && !is_empty_value(g['handle']['size']) && (f['handle']['size'] = g[
         'handle']['size']),
       is_empty_id(f['cokol']['id']) && !is_empty_id(g['cokol']['id']) && (f['cokol']['id'] = g['cokol']['id']),
       is_empty_id(f['cokol_top']['id']) && !is_empty_id(g['cokol_top']['id']) && (f['cokol_top']['id'] = g[
         'cokol_top']['id']),
       is_empty_id(f['cornice']['id']) && !is_empty_id(g['cornice']['id']) && (f['cornice']['id'] = g['cornice'][
         'id']),
       is_empty_id(f['butt']['id']) && !is_empty_id(g['butt']['id']) && (f['butt']['id'] = g['butt']['id'],
         f['butt']['variant_id'] = g['butt']['variant_id']);
   },
   'create_defaults'(f, g, h) {
     var j;
     return 0 === g?.['handle']?.['id'] && delete g['handle']['id'],
       0 === g?.['facade']?.['id'] && (g['facade']['id'] = pp['const']['not_set_value']),
       0 === f?.['facade']?.['id'] && (f['facade']['id'] = pp['const']['not_set_value']),
       merge({
         'tabletop': {
           'id': 0,
           'variant_id': 0,
           'plints': {
             'material': 0,
             'back': 1,
             'right': 0,
             'left': 0
           }
         },
         'facade': {
           'id': 0,
           'type': 0,
           'type_radius': 0,
           'type_side': 0,
           'materials': {
             'gen': 0
           }
         },
         'handle': {
           'id': 0,
           'size': 0
         },
         'cokol': {
           'id': 0
         },
         'cokol_top': {
           'id': 0
         },
         'cornice': {
           'id': 0
         },
         'butt': {
           'id': 0,
           'variant_id': 0
         }
       }, h || {}, g || {}, f || {});
   },
   'get_global_defaults'(f) {
     var g = project_settings['kitchen']?.['defaults'];
     if (!g || !Object['keys'](g)['length'])
       return {};
     var h = pp['const']['not_set_value'],
       j, k;
     let m = g['facades'][f?.['spec']?.['cabinet_tag']]?.['materials'],
       n = (m = m ? copy_object(m) : {
           'gen': 0
         },
         h),
       o = h;
     return project_settings['handle'] && (j = project_settings['handle'][f?.['spec']?.['cabinet_group']] ||
       project_settings['handle']['model'],
       n = j?.['selected_model'] || j?.['id'],
       o = j?.['size_index'],
       is_empty_id(n) && (n = h),
       is_empty_value(o)) && (o = h), {
       'tabletop': {
         'id': g['tabletop']?.['id'] || h,
         'variant_id': g['tabletop']?.['variant_id'] || h,
         'plints': {
           'material': g['tabletop']?.['bort_id'] || h
         }
       },
       'facade': {
         'id': g['facades'][f?.['spec']?.['cabinet_tag']]?.['id'] || h,
         'materials': m
       },
       'handle': {
         'id': n,
         'size': o
       },
       'cokol': {
         'id': g['cokol']?.['id'] || h
       },
       'cokol_top': {
         'id': g['cokol_top']?.['id'] || h
       },
       'cornice': {
         'id': g['cornice']?.['id'] || h
       }
     };
   },
   'init_mat_group_material'(g, h, j, k, q, v) {
     var w, g = (g['userData'] ? g['userData']['params'] : g)['spec']['mat_groups_state'] || [],
       x = project_settings['kitchen']?.['mat_groups'] || {};
     if (h['material'] || (h['material'] = {
         'av_index': 0,
         'id': 0,
         'key': 'ldsp',
         'variant_id': 0
       }),
       h['available'] || (h['available'] = x[h['key']]?.['available'] ? copy_object(x[h['key']]?.['available']) : [{
         'key': 'ldsp',
         'thickness': [],
         'categories': []
       }]),
       v || is_empty_id(h?.['material']?.['id'])) {
       var g = _['find'](g, H => H['key'] === h['key']),
         v, g;
       if (v && g ? (merge(h['material'], copy_object(g['material'])),
           void 0 !== g['fixed'] && (h['fixed'] = g['fixed'])) : is_empty_id(h['material']['id']) && !is_empty_id(k
           ?.['userData']['computed']['materials']?.[h['key']]?.['material']?.['id']) ? (v = k['userData']['computed']
           ['materials'][h['key']],
           h['available'] = copy_object(v['available']),
           h['key'] = v['key'],
           h['name'] = v['name'],
           h['material'] = copy_object(v['material'])) : is_empty_id(h['material']['id']) && !is_empty_id(x[h['key']]
           ?.['selected'][q]?.['id']) && (g = x[h['key']],
           h['available'] = copy_object(g['available']),
           h['key'] = g['key'],
           h['name'] = g['name'],
           h['material'] = copy_object(g['selected'][q])),
         is_empty_id(h['material']['id']))
         F(h);
       else {
         if (j?.['available']) {
           var z = [],
             A = new Map(),
             B, C;
           for (B of h['available']) {
             var D = A['get'](B['key']);
             D ? G(D, B) : (A['set'](B['key'], B),
               z.push(B));
           }
           for (C of j['available']) {
             var E = A['get'](C['key']),
               E;
             E ? G(E, C) : (E = copy_object(C),
               A['set'](E['key'], E),
               z.push(E));
           }
           h['available'] = z;
         }
       }
     }

     function F(H) {
       if (!H?.['material']?.['id']) {
         H['material'] || (H['material'] = {
             'av_index': 0,
             'id': 0,
             'key': 'ldsp',
             'variant_id': 0
           }),
           H['material']['id'] = 0;
         var I = H['available']?.[H['material']['av_index']] || {},
           J = pp?.['libs']?.['materials']?.[I['key']];
         if (J) {
           if (I['categories']?.['length'] || I['thickness']?.['length']) {
             let K = null;
             if ((K = I['categories']?.['length'] ? J['find_available_categories'](I['categories']) : K)?.['length'])
               return I['thickness']?.['length'] ? void I['thickness']?.['length'] : K[0]['items'][0] ? void(H[
                 'material']['id'] = K[0]['items'][0]['id']) : void 0;
           } else
             H['material']['id'] = J['first_item']['id'];
         }
       }
     }

     function G(H, I) {
       if (H['categories']['length']) {
         if (I['categories']['length']) {
           for (var J of I['categories'])
             H['categories']['includes'](J) || H['categories']['push'](J);
         } else
           H['categories'] = [];
       }
       if (H['thickness']['length']) {
         if (I['thickness']['length']) {
           for (var K of I['thickness'])
             H['thickness']['includes'](K) || H['thickness']['push'](K);
         } else
           H['thickness'] = [];
       }
     }
   },
   'reset_mat_groups_materials'(f) {
     var f = f['userData'] ? f['userData']['params'] : f,
       f = (f['spec']['mat_groups_state'] && delete f['spec']['mat_groups_state'],
         f['spec']['mat_groups']);
     if (f?.['length']) {
       for (var g of f)
         g['material'] && (g['material'] = {
           'av_index': 0,
           'id': 0,
           'key': g['material']['key'] || 'ldsp',
           'variant_id': 0
         });
     }
     return f;
   },
   'find_material_variant_to_change'(f, g) {
     if (!is_empty_value(f['key_lock']) && f['key_lock'] !== g['key'])
       return null;
     if (!is_empty_id(f['id']) && f['fixed'])
       return null;
     var h = pp['libs']['materials'][g['key']]?.['find_item'](g['id']);
     if (!h?.['params']?.['variants']?.['length'])
       return null;
     let j = g['variant_id'] || 0;
     return is_empty_id(f['thickness_lock']) || (j = _.findIndex(h['params']['variants'], k => '' + k[
         'thickness'] == '' + f['thickness_lock'])) < 0 && (j = null),
       j;
   },
   'get_facade_type'(f, g) {
     if (is_empty_value(g))
       return null;
     var f = pp['libs']['facades']['items'][f],
       h, h;
     if (!f)
       return null;
     let j = null;
     return j = isNaN(parseInt(g)) ? void 0 !== f['compatibility_types'][g] ? (h = f['compatibility_types'][g],
       f['types'][h]) : (h = Object['keys'](f['types'])[0],
       f['types'][h]) : f['types'][g];
   },
   'can_change_facade_material'(f, g) {
     var f = pp['libs']['facades']['get_item'](f),
       g = pp['libs']['decors']['get_item'](g),
       h = f['materials'] || f['additional_materials']?.['materials'];
     if (null == h)
       return false;
     let j = false;
     var f = '' + g['category'],
       g = pp['libs']['decors']['get_category'](f),
       k, m;
     for (m of _.map(g['path'], o => '' + o['id'])) {
       if (j)
         break;
       for (var n of h)
         if ('' + n === m) {
           j = true;
           break;
         }
     }
     return j;
   },
   'change_facade_material'(f, g, h, j) {
     let k = false;
     if (f['walk_params_tree'](p => {
         'facade' === p['type'] && p['spec']['can_change']?.['material'] && this['can_change_facade_material'](p[
           'spec']['id'], j) && (utils['nested_object']['set'](p['spec'], 'materials.' + h, j),
           k = true);
       }),
       !k)
       return false;
     for (var m of f['userData']['parts']['facade']) {
       var n = m['userData']['params'],
         o;
       n['spec']['can_change']?.['material'] && (o = module_utils['get_child_params_by_path'](f, m['userData'][
           'path']),
         this['can_change_facade_material'](o['spec']['id'], j)) && (utils['nested_object']['set'](n,
           'spec.materials.' + h, j),
         utils['nested_object']['set'](o, 'spec.materials.' + h, j),
         m['_build_computed_materials'](),
         m['_apply_materials']());
     }
     return true;
   },
   'change_model_material'(f, g) {
     let h = false;
     if (!g?.['key'])
       return false;
     if ('' + g['mode'] == '2' || '' + g['mode'] == '3') {
       var j = f['userData']['is_root'] ? f['userData']['params'] : this['get_child_params_by_path'](f, f['userData'][
         'path'
       ]);
       if (!j)
         return false;
       var k = get_mat_lib_hash_ids();
       if (!k['size'])
         return false;
       var j = j['spec'],
         m = (j['model_mats'] || (j['model_mats'] = {}),
           j['model_mats'][g['key']] || (j['model_mats'][g['key']] = {}),
           j['model_mats'][g['key']]),
         j = (m['mode'] = '' + g['mode'],
           m['key'] = g['key'] || '',
           m['mat_id'] = g['mat_id'] || 0,
           m['mat_key'] = g['mat_key'] || '',
           m['mat_variant_id'] = g['mat_variant_id'] || 0,
           f['userData']['is_root'] || 'model' !== f['userData']['params']?.['type'] ? f['userData']['parts'][
           'model'] : [f]),
         n;
       for (n of j) {
         var q = n['userData']['computed']['model_item']?.['params']?.['meshes'];
         if (q) {
           let w = null;
           var u = null,
             v, q;
           for (v of Object['values'](q))
             if ((u = k['get']('' + v['selected']))?.['key'] === g['key']) {
               w = v;
               break;
             }
           w && !w['fixed'] && (q = this['get_child_params_by_path'](n, n['userData']['path']),
             _['set'](q, 'spec.model_mats.' + g['key'], copy_object(m)),
             _['set'](n['userData']['params'], 'spec.model_mats.' + g['key'], copy_object(m)),
             n['_apply_materials'](),
             h = true);
         }
       }
       return h;
     }
   },
   'set_defaults_param'(f, g, h, j) {
     var k = f['userData'];
     let l = f;
     k && (l = f['userData']['is_root'] ? f['userData']['params'] : this['get_child_params_by_path'](f, f['userData'][
       'path'
     ]));
     var k = k && !f['userData']['is_root'] ? f['userData']['params'] : null,
       f, j;
     h !== pp['const']['not_set_value'] && ('number' === j ? h = parseInt(h, 10) : 'bool' === j && (h = to_int(h))),
       l && ((f = l['spec'])['defaults'] || (f['defaults'] = {}),
         Array.isArray(f['defaults']) && (f['defaults'] = {}),
         utils['nested_object']['set'](f['defaults'], g, h)),
       k && (j = k['spec'],
         Array.isArray(j['defaults']) && (j['defaults'] = {}),
         utils['nested_object']['set'](j['defaults'], g, h));
   },
   'get_defaults_param'(f, g) {
     var h;
     let j = f;
     return f['userData'] && (j = f['userData']['is_root'] ? f['userData']['params'] : this[
         'get_child_params_by_path'](f, f['userData']['path'])),
       _['get'](j?.['spec']?.['defaults'], g);
   },
   'find_nested_module_types'(f) {
     let g = new Set();
     var h = _.map(pp['libs']['catalogs_info']['keys'], k => ({
         'name': k['name'],
         'key': k['key']
       })),
       j = (k, l) => {
         var l;
         'module' !== k['type'] || l || !(l = k['spec']?.['element_type']) || g['has'](l) || g['add'](l);
       };
     return module_utils['walk_params_tree'](f, j),
       _.filter(h, k => g['has'](k['key']));
   },
   'walk_params_tree'(f, g, h) {
     if (f && 'function' == typeof g) {
       var j;
       let k = true,
         l = f;

       function m(n, q, u, v, w) {
         if (n) {
           if (q(n, u, w = 2 === v ? w || [] : w),
             1 === v && 'module' === n['type']) {
             if (u) {
               var x = n['spec']?.['template']?.['tree'],
                 y;
               if (x) {
                 for (y of x)
                   m(y, q, false, v);
               }
             }
           } else {
             if (1 === v || 'module' !== n['type'] && !u) {
               var x = n['children'];
               if (x) {
                 2 === v && (w = [...w, n]);
                 for (var z of x)
                   m(z, q, false, v, w);
               }
             } else {
               var u = n['spec'] && n['spec']['templates'] || [],
                 A;
               2 === v && (w = [...w, n]);
               for (A of u) {
                 var B = A && A['template'] && A['template']['tree'],
                   C;
                 if (!B)
                   return;
                 for (C of B)
                   m(C, q, false, v, w);
               }
             }
           }
         }
       }
       f['userData'] && (k = f['userData']['is_root'],
           l = k ? f['userData']['params'] : module_utils['get_child_params_by_path'](f, f['userData']['path'])),
         m(l, g, k, h);
     }
   },
   'clean_specs_empty_keys'(f) {
     for (var g of Object['keys'](f['all']))
       f['all'][g]['length'] || delete f['all'][g];
     for (var h of Object['keys'](f['sum']))
       Object['keys'](f['sum'][h])['length'] || delete f['sum'][h];
     if (f['all']['module']) {
       for (var j of f['all']['module'])
         if (j['is_root'] && j['ctx']) {
           let m = j['ctx'];
           for (var k of Object['keys'](m['all']))
             m['all'][k]['length'] || delete m['all'][k];
           for (var l of Object['keys'](m['sum']))
             Object['keys'](m['sum'][l])['length'] || delete m['sum'][l];
         }
     }
     f['cart_ctx'] && this['clean_specs_empty_keys'](f['cart_ctx']);
   },
   'apply_specs_aggr'(f, g) {
     g = g || 'all';
     let h = 0;
     for (var j of f['all']['module'] || [])
       j['is_root'] && j['ctx'] ? (this['apply_specs_aggr'](j['ctx'], 'all'),
         j['price'] && (h += j['price']),
         !j['price'] && j['show_price'] && (j['price'] = parse_num(j['ctx']['total_price']))) : j['price'] && (h += j[
         'price']);
     for (var k of Object['keys'](f['aggr_funcs'])) {
       var m = f['aggr_funcs'][k];
       if ('function' == typeof m && f['all'][k]) {
         for (var n of f['all'][k])
           m(f, n);
       }
     }
     for (var p of g = 'all' === g ? Object['keys'](f['sum']) : g)
       if (f['sum'][p] && 'module' !== p) {
         for (var q of Object['values'](f['sum'][p]))
           h += parse_num(q['total_price']);
       }
     return f['cart_ctx'] && this['apply_specs_aggr'](f['cart_ctx'], 'all'),
       f['total_price'] = h || 0,
       f;
   },
   'init_spec_ctx_aggr'(f) {
     f['aggr_funcs']['item'] || (f['aggr_funcs']['item'] = this['spec_counters']['price_counter']),
       f['aggr_funcs']['facade'] || (f['aggr_funcs']['facade'] = this['spec_counters']['price_counter']),
       f['aggr_funcs']['wall'] || (f['aggr_funcs']['wall'] = this['spec_counters']['price_counter']),
       f['aggr_funcs']['module'] || (f['aggr_funcs']['module'] = this['spec_counters']['simple_price_counter']),
       f['aggr_funcs']['butts'] || (f['aggr_funcs']['butts'] = this['spec_counters']['price_counter']),
       f['aggr_funcs']['butts_facade'] || (f['aggr_funcs']['butts_facade'] = this['spec_counters']['price_counter']);
   },
   'add_spec_to_context'(f, g) {
     var h, j, h, f, j;
     !g || !(h = g['type']) || (f['all'][h] || (f['all'][h] = []),
       f['sum'][h] || (f['sum'][h] = {}),
       j = f['all'][h],
       h = f['sum'][h],
       f = f['sum_arr'],
       j.push(g),
       j = h[g['sum_key']]) || (j = copy_object(g),
       h[g['sum_key']] = j,
       f.push(j));
   },
   'merge_specs'(f, g, h = false, j = false) {
     if (f['all'] && f['sum'] && f['sum_arr'] && g['all'] && g['sum']) {
       for (var k of Object['keys'](g['all'])) {
         f['all'][k] || (f['all'][k] = []);
         for (var m of g['all'][k])
           m['skip_merge'] || f['all'][k]['push'](m);
       }
       for (var n of Object['keys'](g['sum'])) {
         f['sum'][n] || (f['sum'][n] = {});
         for (var q of Object['keys'](g['sum'][n])) {
           var u;
           f['sum'][n] || (f['sum'][n] = {}),
             f['sum'][n][q] || g['sum'][n][q]['skip_merge'] || (u = j ? copy_object(g['sum'][n][q]) : g['sum'][n][q],
               f['sum'][n][q] = u,
               f['sum_arr']['push'](u));
         }
       }
       if (h) {
         f['aggr_funcs'] || (f['aggr_funcs'] = {});
         for (var v of Object['keys'](g['aggr_funcs']))
           !f['aggr_funcs'][v] && g['aggr_funcs'][v] && (f['aggr_funcs'][v] = g['aggr_funcs'][v]);
       }
     }
   },
   'check_spec_param'(f, g, h = 0) {
     var f = f['userData']['params'],
       j = pp['libs']['catalogs'][f['spec']['element_type']]?.['find_item'](f['spec']['id']);
     let k;
     return k = j?.['params'] ? void 0 !== j['params'][g] ? j['params'][g] : h : void 0 !== f[g] ? f[g] : h;
   },
   'get_price_mod'(f, g, h) {
     var j = pp['spec_settings']['settings']['price_modificator_dealer'],
       k = pp['spec_settings']['settings']['price_modificator_seller'],
       m, m = (m = pp['spec_settings']['settings']['price_modificator']) * j * k,
       j;
     if (!f)
       return m;
     g = g || '__all',
       h = h || '';
     let n = pp['spec_settings']['price_mod']['by_mod_type'][f]?.[g];
     return n?.['length'] || (n = '__all' !== g ? pp['spec_settings']['price_mod']['by_mod_type'][f]?.['__all'] : n)
       ?.['length'] ? '__all' === g ? n[0]['fixed'] ? n[0]['price_mod'] : n[0]['price_mod'] * m : (j = _['find']
         (n, o => '' + o['category'] == '' + h)) ? j['fixed'] ? j['price_mod'] : j['price_mod'] * m : m : m;
   },
   'spec_counters': {
     'simple_counter'(f, g) {
       var f = f['sum'][g['type']][g['sum_key']];
       void 0 === f['total_count'] && (f['total_count'] = 0),
         f['total_count'] += void 0 !== g['count'] ? g['count'] : 1;
     },
     'simple_price_counter'(f, g) {
       var f = f['sum'][g['type']][g['sum_key']],
         h = (void 0 === f['total_count'] && (f['total_count'] = 0),
           void 0 === f['total_price'] && (f['total_price'] = 0),
           void 0 !== g['count'] ? g['count'] : 1),
         g = void 0 !== g['price'] ? g['price'] : 0;
       f['total_count'] += h,
         f['total_price'] += g * h;
     },
     'simple_price_width_counter'(f, g) {
       var f = f['sum'][g['type']][g['sum_key']];
       void 0 === f['total_width'] && (f['total_width'] = 0),
         void 0 === f['total_count'] && (f['total_count'] = 0),
         void 0 === f['total_price'] && (f['total_price'] = 0),
         f['total_width'] += g['size_x'] / 1000,
         f['total_count'] = Math['ceil'](f['total_width'] / (f['width'] / 1000)),
         f['total_price'] = (void 0 !== g['price'] ? g['price'] : 0) * f['total_count'];
     },
     'price_counter'(f, g) {
       var f = f['sum'][g['type']][g['sum_key']],
         h, j, j, j, j, j, j, h;
       if (void 0 === f['total_width'] && (f['total_width'] = 0),
         void 0 === f['total_width_m'] && (f['total_width_m'] = 0),
         void 0 === f['total_count'] && (f['total_count'] = 0),
         void 0 === f['total_price'] && (f['total_price'] = 0),
         'item' !== f['type'] || void 0 !== g['size_x'] && void 0 !== g['size_y'] && void 0 !== g['size_z']) {
         if ('m' === f['price_type'])
           j = g['size_' + (g['hl_axis'] || 'x')] / 1000,
           f['total_width'] += j,
           f['total_count'] = f['total_width'],
           f['total_price'] = f['price'] * f['total_count'];
         else {
           if ('hl' === f['price_type'])
             return f['width'] ? (j = g['size_' + (g['hl_axis'] || 'x')] / 1000,
               f['total_width'] += j,
               f['total_count'] = Math['ceil'](f['total_width'] / (f['width'] / 1000)),
               void(f['total_price'] = f['price'] * f['total_count'])) : (f['total_count'] = 0,
               void(f['total_price'] = 0));
           'm2' === f['price_type'] ? (j = g['size_x'] * g['size_z'] / 1000 / 1000,
             f['total_width'] += j,
             f['total_count'] = f['total_width'],
             f['total_price'] = f['price'] * f['total_count']) : 'm3' === f['price_type'] ? (j = g['size_x'] * g[
               'size_y'] * g['size_z'] / 1000 / 1000 / 1000,
             f['total_width'] += j,
             f['total_count'] = f['total_width'],
             f['total_price'] = f['price'] * f['total_count']) : (f['total_width'] += g['size_x'] * g['size_z'] /
             1000 / 1000,
             f['total_width_m'] += g['size_x'] / 1000,
             'item' === f['type'] ? (j = void 0 !== g['count'] ? g['count'] : 1,
               h = void 0 !== g['price'] ? g['price'] : 0,
               f['total_count'] += j,
               f['total_price'] += h * j) : f['width'] && f['height'] ? (f['total_count'] = Math['ceil'](f[
                 'total_width'] / (f['width'] * f['height'] / 1000 / 1000)),
               f['total_price'] = f['price'] * f['total_count']) : (f['total_count'] = 0,
               f['total_price'] = 0));
         }
       } else
         h = void 0 !== g['count'] ? g['count'] : 1,
         j = void 0 !== g['price'] ? g['price'] : 0,
         f['total_count'] += h,
         f['total_price'] += j * h;
     }
   },
   'find_fill_sections'(f, g) {
     if (!f)
       return [];
     let h = new Set(),
       j = [];
     return this['walk_params_tree'](f, k => {
         !k['section_key'] || h['has'](k['section_key']) || 'section' !== k['type'] && 'fill_section' !== k[
           'type'] || (h['add'](k['section_key']),
             j.push(k));
       }, g),
       j;
   },
   'find_params_sections'(f) {
     if (!f)
       return [];
     let g = new Set(),
       h = [];
     return this['walk_params_tree'](f, j => {
         var k;
         j['params_key'] && j['type'] && (k = j['params_key'] + ':' + j['type'],
           g['has'](k) || (g['add'](k),
             h.push(j)));
       }),
       h;
   },
   async 'CSG_Operation'(f, g, h = false, j = 'SUBTRACTION') {
     if (0 !== g.length) {
       for (let v = scene['children']['length'] - 1; 0 <= v; v--) {
         var k = scene['children'][v];
         '__debug_cutter_global' === k['name'] && (scene['remove'](k),
           k['geometry']?.['dispose'](),
           k['material']?.['dispose']());
       }
       let o = g.map(w => {
         w['updateMatrixWorld'](true);
         var x = w['geometry'],
           y = x['attributes']['position'],
           z = w['matrixWorld']['clone'](),
           A = new Float32Array(3 * y['count']),
           B = new THREE['Vector3']();
         for (let C = 0; C < y['count']; C++)
           B['fromBufferAttribute'](y, C)['applyMatrix4'](z),
           A[3 * C] = B['x'],
           A[3 * C + 1] = B['y'],
           A[3 * C + 2] = B['z'];
         return {
           'positions': A,
           'indices': x['index'] ? x['index']['array']['slice'](0) : null,
           'uvs': x['attributes']['uv'] ? x['attributes']['uv']['array']['slice'](0) : null
         };
       });
       var g = f.map(w => ({
           'ref': w,
           'matrixWorld': w['matrixWorld']['clone'](),
           'geometry': w['geometry']['clone']()
         })),
         m, f, h, n;
       let q = await ((() => new Promise((w, x) => {
           let y = new Worker('/common_assets/workers/CSG_cutter.js', {
             'type': 'module'
           });
           y['onmessage'] = z => {
               var z = z['data'];
               z['error'] ? (x(z['error']),
                 y['terminate']()) : 'done' === z['status'] && (w(z),
                 y['terminate']());
             },
             y['onerror'] = z => {
               x(z);
             },
             y['postMessage']({
               'cutters': o
             });
         }))()),
         u = (h && ((f = new THREE['BufferGeometry']())['setAttribute']('position', new THREE[
               'Float32BufferAttribute'](q['positions'], 3)),
             q['indices'] && f['setIndex'](q['indices']),
             q['uvs'] && f['setAttribute']('uv', new THREE['Float32BufferAttribute'](q['uvs'], 2)),
             q['normals'] ? f['setAttribute']('normal', new THREE['Float32BufferAttribute'](q['normals'], 3)) : f[
               'computeVertexNormals'](),
             f['computeBoundingBox'](),
             f['computeBoundingSphere'](),
             (h = new THREE['Mesh'](f, new THREE['MeshNormalMaterial']({
               'wireframe': true
             })))['name'] = '__debug_cutter_global',
             h['matrixAutoUpdate'] = false,
             h['matrix']['identity'](),
             scene['add'](h)),
           w => new Promise((x, y) => {
             let {
               ref: z,
               geometry: A,
               matrixWorld: B
             } = w;
             var C = A['clone'](),
               C = (C['applyMatrix4'](B), {
                 'positions': C['attributes']['position']['array'],
                 'indices': C['index'] ? C['index']['array'] : null,
                 'uvs': C['attributes']['uv'] ? C['attributes']['uv']['array'] : null
               }),
               D = {
                 'positions': q['positions']['slice'](0),
                 'indices': q['indices'] ? q['indices']['slice'](0) : null,
                 'uvs': q['uvs'] ? q['uvs']['slice'](0) : null
               };
             let E = new Worker('/common_assets/workers/CSG_target.js', {
               'type': 'module'
             });
             E['onmessage'] = F => {
                 var F = F['data'],
                   G, F;
                 'started' !== F['status'] && (F['error'] ? (y(F['error']),
                   E['terminate']()) : 'done' === F['status'] && ((G = new THREE['BufferGeometry']())[
                     'setAttribute']('position', new THREE['Float32BufferAttribute'](F['positions'], 3)),
                   F['indices'] && G['setIndex'](F['indices']),
                   F['uvs'] && G['setAttribute']('uv', new THREE['Float32BufferAttribute'](F['uvs'], 2)),
                   F['normals'] ? G['setAttribute']('normal', new THREE['Float32BufferAttribute'](F[
                     'normals'], 3)) : G['computeVertexNormals'](),
                   G['computeBoundingBox'](),
                   G['computeBoundingSphere'](),
                   F = new THREE['Matrix4']()['copy'](B)['invert'](),
                   G['applyMatrix4'](F),
                   z['geometry']['dispose'](),
                   z['geometry'] = G,
                   z['material']['needsUpdate'] = true,
                   x(z['geometry']),
                   E['terminate']()));
               },
               E['onerror'] = F => {
                 y(F);
               },
               E['postMessage']({
                 'targetData': C,
                 'cutterData': D,
                 'operation': j
               }, [C['positions']['buffer'], C['uvs']?.['buffer'], C['indices']?.['buffer'], D['positions'][
                 'buffer'
               ], D['uvs']?.['buffer'], D['indices']?.['buffer']]['filter'](Boolean));
           }));
       return await Promise['all'](g.map(w => u(w)));
     }
   },
   'compare_path_children'(f, g) {
     if (!f || !g)
       return false;
     var h = f.split(','),
       j = g.split(',');
     if (j.length < h.length)
       return false;
     for (let k = 0; k < h.length; k++)
       if (h[k] !== j[k])
         return false;
     return j.length > h.length;
   }
 };
 pp['engine'] = {},
   pp['engine']['item_types'] = {
     'section': CabinetSection,
     'wall': CabinetWall,
     'cokol': CabinetCokolN,
     'cokol_top': CabinetCokolTopN,
     'leg': CabinetLegN,
     'model': CabinetModel,
     'facade': CabinetFacade,
     'animator': CabinetAnimator,
     'tabletop': CabinetTabletop,
     'bort': CabinetBort,
     'cornice_placer': CabinetCornicePlacer,
     'hole': CabinetHole,
     'path': CabinetPath,
     'butts': CabinetButts,
     'furniture': CabinetFurniture,
     'module': Module,
     'fill_section': CabinetFillSection,
     'size': CabinetSize,
     'mouse_target': CabinetMouseTarget,
     'cut': CabinetCut,
     'info_section': CabinetInfoSection
   },
   pp['engine']['item_def_params'] = {
     'section': def_cabinet_section,
     'wall': def_cabinet_wall,
     'cokol': def_cabinet_cokol,
     'cokol_top': def_cabinet_cokol_top,
     'leg': def_cabinet_leg,
     'model': def_cabinet_model,
     'handle': def_cabinet_handle,
     'facade': def_cabinet_facade,
     'animator': def_cabinet_animator,
     'tabletop': def_cabinet_tabletop,
     'bort': def_cabinet_bort,
     'cornice_placer': def_cabinet_cornice_placer,
     'module': def_module,
     'hole': def_cabinet_hole,
     'path': def_cabinet_path,
     'furniture': def_cabinet_furniture,
     'butts': def_cabinet_butts,
     'fill_section': def_cabinet_fill_section,
     'size': def_cabinet_size,
     'mouse_target': def_cabinet_mouse_target,
     'cut': def_cabinet_cut,
     'info_section': def_cabinet_info_section
   },
   pp['engine']['functions'] = {},
   pp['params'] = {},
   pp['params']['reserved_symbols'] = {
     '$': 'fixed',
     '@': 'function'
   },
   pp['engine']['functions']['door_ltr_handle'] = f => {
     var g = f['userData']['computed'];
     return 'facade_profile' == g['handle_type'] ? 'l' == f['userData']['params']['spec']['handle']['dir'] || 'r' == f[
       'userData']['params']['spec']['handle']['dir'] ? 'l' : 'c' : 'common' == g['handle_type'] ? 'h' == f[
       'userData']['params']['spec']['handle']['orient'] ? 'c' : 'l' : void 0;
   },
   pp['engine']['functions']['door_rtl_handle'] = f => {
     var g = f['userData']['computed'];
     return 'facade_profile' == g['handle_type'] ? 'l' == f['userData']['params']['spec']['handle']['dir'] || 'r' == f[
       'userData']['params']['spec']['handle']['dir'] ? 'r' : 'c' : 'common' == g['handle_type'] ? 'h' == f[
       'userData']['params']['spec']['handle']['orient'] ? 'c' : 'r' : void 0;
   },
   pp['engine']['animations'] = {},
   pp['engine']['animations']['slide'] = function(f, g, h) {
     null == g['ext_percent'] && (g['ext_percent'] = 70),
       null == g['direction'] && (g['direction'] = 'f');
     let j = f['userData']['state'];
     j['is_moving'] = true;
     var k = f['userData']['state']['initial_pos'],
       m = f['userData']['computed']['size'],
       q, u, v = {
         'l': 'x',
         'r': 'x',
         'f': 'z',
         't': 'y',
         'b': 'y'
       } [g['direction']],
       w = {
         'l': -1,
         'r': 1,
         'f': 1,
         't': 1,
         'b': -1
       } [g['direction']],
       x = {};
     x[v] = k[v] + 5 * w;
     let y = {};
     y[v] = k[v];
     var z = {};
     z[v] = copy_object(k[v]) + m[v] / units * parseFloat(g['ext_percent']) / 100 * w,
       (j['is_open'] ? new TWEEN['Tween'](f['userData']['own_object']['position'])['to'](x, 400)['onUpdate'](
       function() {
         pp['config']['on_demand_render'] && pp['render']();
       })['onComplete'](() => {
         new TWEEN['Tween'](f['userData']['own_object']['position'])['to'](y, 600)['onComplete'](() => {
           j['is_moving'] = false,
             j['is_open'] = false;
         })['start']();
       }) : new TWEEN['Tween'](f['userData']['own_object']['position'])['to'](z, 600)['onUpdate'](function() {
         pp['config']['on_demand_render'] && pp['render']();
       })['onComplete'](() => {
         j['is_moving'] = false,
           j['is_open'] = true;
       }))['start']();
   },
   pp['engine']['animations']['rotate'] = function(f, g, h) {
     null == g['deg'] && (g['deg'] = 90),
       null == g['duration'] && (g['duration'] = 400),
       null == g['direction'] && (g['direction'] = 'ly'),
       null == g['dovod'] && (g['dovod'] = 0),
       null == g['dovod_deg'] && (g['dovod_deg'] = 15),
       null == g['dovod_duration'] && (g['dovod_duration'] = 600);
     let j = f['userData']['state'];
     j['is_moving'] = true;
     var k = f['userData']['state']['initial_rot'],
       q = f['userData']['computed']['size'],
       v, w, x = {
         'rx': 'x',
         'lx': 'x',
         'rz': 'z',
         'lz': 'z',
         'ry': 'y',
         'ly': 'y'
       } [g['direction']],
       y = {
         'rx': 1,
         'rz': 1,
         'ry': 1,
         'lx': -1,
         'lz': -1,
         'ly': -1
       } [g['direction']],
       z = THREE['MathUtils']['degToRad'](g['deg']),
       A = {};
     A[x] = (k[x] + z) * y;
     let B = {};
     B[x] = k[x];
     var C = f['userData']['animator_object']['position']['z'],
       z, D;
     (j['is_open'] ? 1 == g['dovod'] ? (z = THREE['MathUtils']['degToRad'](g['dovod_deg']),
       (D = {})[x] = (k[x] + z) * y,
       new TWEEN['Tween'](f['userData']['animator_object']['rotation'])['to'](D, g['duration'])['onUpdate'](
     function() {
         pp['config']['on_demand_render'] && pp['render']();
       })['onComplete'](function() {
         new TWEEN['Tween'](f['userData']['animator_object']['rotation'])['to'](B, g['dovod_duration'])['onUpdate'](
           function() {
             pp['config']['on_demand_render'] && pp['render']();
           })['onComplete'](function() {
           j['is_moving'] = false,
             j['is_open'] = false;
         })['start']();
       })) : new TWEEN['Tween'](f['userData']['animator_object']['rotation'])['to'](B, g['duration'])['onUpdate'](
       function() {
         pp['config']['on_demand_render'] && pp['render']();
       })['onComplete'](() => {
       j['is_moving'] = false,
         j['is_open'] = false;
     }) : new TWEEN['Tween'](f['userData']['animator_object']['rotation'])['to'](A, g['duration'])['onUpdate'](
       function() {
         pp['config']['on_demand_render'] && pp['render']();
       })['onComplete'](() => {
       j['is_moving'] = false,
         j['is_open'] = true;
     }))['start']();
   },
   pp['engine']['animations']['rotate_test'] = function(f, g, h) {
     null == g['deg'] && (g['deg'] = 90),
       null == g['direction'] && (g['direction'] = 'ly');
     let j = f['userData']['state'];
     j['is_moving'] = true;
     var k = f['userData']['state']['initial_rot'],
       m = f['userData']['computed']['size'],
       p, q, u = {
         'rx': 'x',
         'lx': 'x',
         'rz': 'z',
         'lz': 'z',
         'ry': 'y',
         'ly': 'y'
       } [g['direction']],
       v = {
         'rx': 1,
         'rz': 1,
         'ry': 1,
         'lx': -1,
         'lz': -1,
         'ly': -1
       } [g['direction']],
       g = THREE['MathUtils']['degToRad'](g['deg']),
       w = {},
       g = (w[u] = (k[u] + g) * v, {});
     g[u] = k[u],
       (j['is_open'] ? new TWEEN['Tween'](f['userData']['own_object']['rotation'])['to'](g, 400)['onComplete'](() => {
         j['is_moving'] = false,
           j['is_open'] = false;
       }) : new TWEEN['Tween'](f['userData']['own_object']['rotation'])['to'](w, 400)['onComplete'](() => {
         j['is_moving'] = false,
           j['is_open'] = true;
       }))['start']();
   },
   pp['engine']['animations']['rotate_with_offset'] = function(f, g, h) {
     null == g['deg'] && (g['deg'] = 90),
       null == g['direction'] && (g['direction'] = 'ly'),
       null == g['offset'] && (g['offset'] = {
         'x': 0,
         'y': 0,
         'z': 0
       });
     let j = f['userData']['state'];
     j['is_moving'] = true;
     var k = f['userData']['state']['initial_rot'],
       m = f['userData']['computed']['size'],
       p, q, u = {
         'rx': 'x',
         'lx': 'x',
         'rz': 'z',
         'lz': 'z',
         'ry': 'y',
         'ly': 'y'
       } [g['direction']],
       v = {
         'rx': 1,
         'rz': 1,
         'ry': 1,
         'lx': -1,
         'lz': -1,
         'ly': -1
       } [g['direction']],
       g = THREE['MathUtils']['degToRad'](g['deg']),
       w = {},
       g = (w[u] = (k[u] + g) * v, {});
     g[u] = k[u],
       (j['is_open'] ? new TWEEN['Tween'](f['userData']['own_object']['rotation'])['to'](g, 400)['onComplete'](() => {
         j['is_moving'] = false,
           j['is_open'] = false;
       }) : new TWEEN['Tween'](f['userData']['own_object']['rotation'])['to'](w, 400)['onComplete'](() => {
         j['is_moving'] = false,
           j['is_open'] = true;
       }))['start']();
   },
   pp['engine']['animator_state'] = {},
   pp['engine']['animator_state']['rotate'] = function(f, g, h) {
     null == g['deg'] && (g['deg'] = 90),
       null == g['duration'] && (g['duration'] = 400),
       null == g['direction'] && (g['direction'] = 'ly'),
       null == g['dovod'] && (g['dovod'] = 0),
       null == g['dovod_deg'] && (g['dovod_deg'] = 15),
       null == g['dovod_duration'] && (g['dovod_duration'] = 600);
     var j = f['userData']['state']['initial_rot'],
       k = f['userData']['computed']['size'],
       m, p, q = {
         'rx': 'x',
         'lx': 'x',
         'rz': 'z',
         'lz': 'z',
         'ry': 'y',
         'ly': 'y'
       } [g['direction']],
       u = {
         'rx': 1,
         'rz': 1,
         'ry': 1,
         'lx': -1,
         'lz': -1,
         'ly': -1
       } [g['direction']],
       g = THREE['MathUtils']['degToRad'](g['deg']),
       v;
     let w = {};
     w[q] = (j[q] + g) * u,
       j[q],
       Object['keys'](w)['forEach'](x => {
         f['userData']['animator_object']['rotation'][x] = w[x];
       });
   },
   pp['engine']['animator_state']['slide'] = function(f, g, h) {
     null == g['ext_percent'] && (g['ext_percent'] = 70),
       null == g['direction'] && (g['direction'] = 'f');
     var j = f['userData']['state']['initial_pos'],
       k = f['userData']['computed']['size'],
       m, p, q = {
         'l': 'x',
         'r': 'x',
         'f': 'z',
         't': 'y',
         'b': 'y'
       } [g['direction']],
       u = {
         'l': -1,
         'r': 1,
         'f': 1,
         't': 1,
         'b': -1
       } [g['direction']],
       v, w;
     j[q];
     let x = {};
     x[q] = copy_object(j[q]) + k[q] / units * parseFloat(g['ext_percent']) / 100 * u,
       Object['keys'](x)['forEach'](y => {
         f['userData']['own_object']['position'][y] = x[y];
       });
   },
   pp['engine']['materials'] = {},
   pp['engine']['materials']['incorrect_mat'] = new THREE['MeshBasicMaterial']({
     'color': '#ff9f9f',
     'transparent': true,
     'opacity': 0.5
   }),
   pp['engine']['materials']['black_line_no_depth'] = new THREE['LineBasicMaterial']({
     'color': 0
   });
 let global_variables = {},
   gvbt = {
     'all': []
   };

 function check_condition(f = '', g = {}) {
   var h = 0,
     i = f['replaceAll']('\x20', '')['split']('=');
   let j;
   switch (f[0]) {
     case 'c':
       j = utils['nested_object']['get'](g['computed'], i[0]['substring'](2));
       break;
     case 'v':
       f['indexOf']('nalichie_fasadov');
       var k = utils['nested_object']['get'](g['variables'], i[0]['substring'](2));
       if (k) {
         let l = k['value'];
         g['local_parent'] && void 0 !== g['local_parent']['userData']['params']['spec']['variables'][k['key']] && (-
             1 < f['indexOf']('nalichie_fasadov') && (ce('nalichie_fasadov'),
               ce(g['local_parent']['userData']['params']['spec']['variables'][k['key']])),
             l = g['local_parent']['userData']['params']['spec']['variables'][k['key']]),
           j = l;
       } else
         j = 0;
       break;
     default:
       j = i[0];
   }
   return h = j == i[1];
 }
 Object['keys'](global_variables)['forEach'](function(f) {
   var g = global_variables[f];
   if ('all' == g['objects'][0])
     gvbt['all']['push'](g['key']);
   else {
     for (let h = g['objects']['length']; h--;)
       gvbt[g['objects'][h]] || (gvbt[g['objects'][h]] = []),
       gvbt[g['objects'][h]]['push'](g['key']);
   }
 });
 let p_shapes = {
   'trapeze': function() {},
   'cut_corners': function(f, g, h = 0, j = 0, k = 0, l = 0) {
     var m = new THREE['Shape']();
     return m['moveTo'](-f / 2 + h, -g / 2),
       m['lineTo'](-f / 2, -g / 2 + h),
       m['lineTo'](-f / 2, g / 2 - j),
       m['lineTo'](-f / 2 + j, g / 2),
       m['lineTo'](f / 2 - k, g / 2),
       m['lineTo'](f / 2, g / 2 - k),
       m['lineTo'](f / 2, -g / 2 + l),
       m['lineTo'](f / 2, -g / 2 + l),
       m['lineTo'](f / 2 - l, -g / 2),
       m['lineTo'](-f / 2 + h, -g / 2),
       m;
   },
   'triangle': function(f, g, h) {
     var i = new THREE['Shape']();
     switch (h) {
       case 'tr':
         i['moveTo'](-f / 2, -g / 2),
           i['lineTo'](-f / 2, g / 2),
           i['lineTo'](f / 2, -g / 2),
           i['lineTo'](-f / 2, -g / 2);
         break;
       case 'tl':
         i['moveTo'](-f / 2, -g / 2),
           i['lineTo'](f / 2, g / 2),
           i['lineTo'](f / 2, -g / 2),
           i['lineTo'](-f / 2, -g / 2);
         break;
       case 'br':
         i['moveTo'](-f / 2, -g / 2),
           i['lineTo'](-f / 2, g / 2),
           i['lineTo'](f / 2, g / 2),
           i['lineTo'](-f / 2, -g / 2);
         break;
       case 'bl':
         i['moveTo'](f / 2, -g / 2),
           i['lineTo'](-f / 2, g / 2),
           i['lineTo'](f / 2, g / 2),
           i['lineTo'](f / 2, -g / 2);
         break;
     }
     return i;
   },
   'rounded_corners': function(f, g, h = 0, j = 0, k = 0, l = 0) {
     var m = new THREE['Shape']();
     return 0 == h ? (m['moveTo'](-f / 2, -g / 2),
         m['lineTo'](-f / 2, -g / 2)) : (m['moveTo'](f / 2 - l, -g / 2),
         m['lineTo'](-f / 2 + h, -g / 2),
         m['absarc'](-f / 2 + h, -g / 2 + h, h, 3 * Math['PI'] / 2, Math['PI'], true)),
       0 == j ? m['lineTo'](-f / 2, g / 2) : (m['lineTo'](-f / 2, g / 2 - j),
         m['absarc'](-f / 2 + j, g / 2 - j, j, Math['PI'], Math['PI'] / 2, true)),
       0 == k ? m['lineTo'](f / 2, g / 2) : (m['lineTo'](f / 2 - k, g / 2),
         m['absarc'](f / 2 - k, g / 2 - k, k, Math['PI'] / 2, 0, true)),
       0 == l ? m['lineTo'](f / 2, -g / 2) : (m['lineTo'](f / 2, -g / 2 + l),
         m['absarc'](f / 2 - l, -g / 2 + l, l, 0, 3 * Math['PI'] / 2, true)),
       m;
   },
   'rounded': function(f, g, h) {
     var i = new THREE['Shape'](),
       j = g - h,
       k = f - h;
     return i['moveTo'](-f / 2, -g / 2),
       i['lineTo'](-f / 2, g / 2),
       i['absarc'](-f / 2 + k, -g / 2 + j, h, Math['PI'] / 2, 0, true),
       i['lineTo'](f / 2, -g / 2),
       i['lineTo'](-f / 2, -g / 2),
       i;
   },
   'skewed_by_angle': function(f, g, h, i) {
     h = h || 45,
       i = i || h;
     var h = THREE['MathUtils']['degToRad'](h),
       i = THREE['MathUtils']['degToRad'](i),
       h = g / Math['sin'](h),
       i = g / Math['sin'](i),
       h = Math['sqrt'](h * h - g * g),
       i = Math['sqrt'](i * i - g * g),
       j = new THREE['Shape']();
     return j['moveTo'](-f / 2, g / 2),
       j['lineTo'](-f / 2 + h, -g / 2),
       j['lineTo'](f / 2 - i, -g / 2),
       j['lineTo'](f / 2, g / 2),
       j['lineTo'](-f / 2, g / 2),
       j;
   },
   'trapeze_cut_by_offset': function(f, g, h, j, k = 0, l = 0) {
     var m = new THREE['Shape']();
     return m['moveTo'](-f / 2, -g / 2 + j),
       m['lineTo'](-f / 2, g / 2),
       m['lineTo'](f / 2 - k, g / 2),
       m['lineTo'](f / 2, g / 2 - l),
       m['lineTo'](f / 2, -g / 2),
       m['lineTo'](-f / 2 + h, -g / 2),
       m;
   },
   'half_rounded': function(f, g, h, j) {
     var k = new THREE['Shape'](),
       l = (j = j || g,
         -f / 2),
       m = -g / 2;
     return 'left' === (h = h || 'right') ? (k['moveTo'](l, m),
         k['lineTo'](l, m + g - j),
         k['quadraticCurveTo'](l, m + g, l + j, m + g),
         k['lineTo'](l + f, m + g)) : (k['moveTo'](l, m),
         k['lineTo'](l, m + g),
         k['lineTo'](l + Math['max'](0, f - j), m + g),
         k['quadraticCurveTo'](l + f, m + g, l + f, m + g - j)),
       k['lineTo'](l + f, m),
       k['lineTo'](l, m),
       k;
   },
   'free': function(f) {
     var g = f['width'],
       h = f['height'],
       i = f['points'],
       j = new THREE['Shape']();
     j['moveTo'](-g / 2, h / 2);
     for (let k = 0; k < i.length; k++)
       j['lineTo'](i[k]['x'] - g / 2, h / 2 - i[k]['y']);
     return j;
   },
   'round_or_cut': function(f, g, h = {
     'c': 0,
     'r': 0
   }, i = {
     'c': 0,
     'r': 0
   }, j = {
     'c': 0,
     'r': 0
   }, k = {
     'c': 0,
     'r': 0
   }) {},
   'common'(f) {
     let g = new THREE['Shape']();
     if (!f)
       return g;
     var h = 1 === f.length && f[0]['center'] && f[0]['radius'];
     if (h) {
       var {
         center: j,
         radius: k
       } = f[0];
       let w = new THREE['Shape']();
       return w['absarc'](j['x'] / units, j['y'] / units, k / units, 0, 2 * Math['PI'], false),
         w;
     }
     if (h || !(f.length < 2)) {
       var j = f.map(y => ({
           'x': void 0 !== y['x'] ? y['x'] / units : y['center']['x'] / units,
           'y': void 0 !== y['y'] ? y['y'] / units : y['center']['y'] / units,
           'radius': y['radius'] / units || 0,
           'center': y['center'] ? {
             'x': y['center']['x'] / units,
             'y': y['center']['y'] / units
           } : null,
           'dir': y['dir'] || false
         })),
         m = {};
       let x = null;
       var p = j.filter(y => !y['center']),
         k = j.filter(y => y['center']);
       if (0 < p.length) {
         x = 0 < p[0]['radius'] ? (m[0] = add_rounded_corner(g, p[p.length - 1], p[0], p[1]),
           m[0]['p2']) : (g['moveTo'](p[0]['x'], p[0]['y']),
           p[0]);
         for (let y = 1; y < p.length; y++) {
           var q = p[y - 1],
             u = p[y],
             v = p[(y + 1) % p.length];
           x = 0 < u['radius'] ? (m[y] = add_rounded_corner(g, q, u, v, x),
             m[y]['p2']) : (g['lineTo'](u['x'], u['y']),
             u);
         }
         0 < p[0]['radius'] ? g['lineTo'](m[0]['p1']['x'], m[0]['p1']['y']) : g['lineTo'](p[0]['x'], p[0][
           'y'
         ]);
       }
       return 0 < k.length && k.forEach(z => {
           var A = new THREE['Path']();
           A['absarc'](z['center']['x'], z['center']['y'], z['radius'], 0, 2 * Math['PI'], false),
             g['holes']['push'](A);
         }),
         g;
     }
   }
 };

 function add_rounded_corner(g, j, k, m, q = null) {
   var w = k['radius'],
     z = k['dir'],
     A = j['x'] - k['x'],
     j = j['y'] - k['y'],
     B = m['x'] - k['x'],
     m = m['y'] - k['y'],
     C = Math['sqrt'](A * A + j * j) || 1,
     D = Math['sqrt'](B * B + m * m) || 1,
     F = k['x'] + A / C * w,
     C = k['y'] + j / C * w,
     G = k['x'] + B / D * w,
     k = k['y'] + m / D * w,
     D = (F + G) / 2,
     H = (C + k) / 2,
     I = Math['sqrt']((G - F) ** 2 + (k - C) ** 2),
     J = I ? Math['sqrt'](Math['max'](w * w - Math['pow'](I / 2, 2), 0)) : 0,
     K = (k - C) / Math['max'](I, 0.0001),
     I = -(G - F) / Math['max'](I, 0.0001),
     L, A = 0 < A * m - j * B;
   let N;
   N = void 0 !== z ? z : A;
   let O, P;
   P = !A && N ? (O = D - K * J,
     H - I * J) : (O = D + K * J,
     H + I * J);
   var m = Math['atan2'](C - P, F - O);
   let Q = Math['atan2'](k - P, G - O);
   return N ? Q > m && (Q -= 2 * Math['PI']) : Q < m && (Q += 2 * Math['PI']),
     q ? g['lineTo'](F, C) : g['moveTo'](F, C),
     g['absarc'](O, P, w, m, Q, !N), {
       'p1': {
         'x': F,
         'y': C
       },
       'p2': {
         'x': G,
         'y': k
       },
       'center': {
         'x': O,
         'y': P
       }
     };
 }
 let shapes_points = {
   'triangle': function(f, g, h) {
     var i = [];
     switch (h) {
       case 'tr':
         i.push({
           'x': 0,
           'y': 0
         }, {
           'x': f,
           'y': 0
         }, {
           'x': 0,
           'y': g
         });
         break;
       case 'tl':
         i.push({
           'x': 0,
           'y': 0
         }, {
           'x': f,
           'y': 0
         }, {
           'x': f,
           'y': g
         });
         break;
       case 'br':
         i.push({
           'x': 0,
           'y': 0
         }, {
           'x': f,
           'y': g
         }, {
           'x': 0,
           'y': g
         });
         break;
       case 'bl':
         i.push({
           'x': f,
           'y': 0
         }, {
           'x': f,
           'y': g
         }, {
           'x': 0,
           'y': g
         });
         break;
     }
     return i;
   }
 };

 function parse_animation(f, g, h = 'f') {
   var j, k = f[h]['split'](';');
   let m;
   for (let v = 0; v < k.length; v++)
     if ('' != k[v]) {
       var p = k[v]['split'](':'),
         q = p[0],
         p = p[1]['split'](','),
         u = p[0];
       let w = p[1];
       var p = p[2];
       switch (q) {
         case 'r':
           m = new TWEEN['Tween'](g['rotation']),
             w = -THREE['MathUtils']['degToRad'](w);
           break;
         case 'p':
           break;
       }
       var q = {};
       q[u] = w,
         m['to'](q, p);
     }
   m['start']();
 }
 let p_animations = {
   'rtl_d': {
     'f': 'r:y,48,2000;',
     'b': 'r:y,0,400;'
   },
   'ltr_d': {
     'f': 'r:y,48,2000;',
     'b': 'r:y,0,400;'
   }
 };
