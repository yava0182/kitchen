        this['userData']['computed']['size'] = {},
          this['userData']['computed']['size']['x'] = comp2(this['userData']['params']['size']['x'], e),
          this['userData']['computed']['size']['y'] = comp2(this['userData']['params']['size']['y'], e),
          this['userData']['computed']['size']['z'] = comp2(this['userData']['params']['size']['z'], e),
          this['userData']['size'] = copy_object(this['userData']['computed']['size']);
        }
        ['b_pos']() {
          var f = {
              'parent_size': this['userData']['parent']['userData']['computed']['size'],
              'computed': this['userData']['root']['userData']['computed']['computed'],
              'variables': this['userData']['computed']['variables'],
              'materials': this['userData']['root']['userData']['computed']['materials']
            },
            g = comp2(this['userData']['params']['pos']['x'], f),
            h = comp2(this['userData']['params']['pos']['y'], f),
            i = comp2(this['userData']['params']['pos']['z'], f);
          this['userData']['computed']['pos'] = {},
            this['userData']['computed']['pos']['x'] = g,
            this['userData']['computed']['pos']['y'] = h,
            this['userData']['computed']['pos']['z'] = i,
            this['position']['set']((-f['parent_size']['x'] / 2 + g) / units, (-f['parent_size']['y'] / 2 + h) /
              units, (-f['parent_size']['z'] / 2 + i) / units);
        }
        ['b_rotate']() {
          var e = {
            'parent_size': this['userData']['parent']['userData']['computed']['size'],
            'computed': this['userData']['root']['userData']['computed']['computed'],
            'variables': this['userData']['computed']['variables'],
            'materials': this['userData']['root']['userData']['computed']['materials']
          };
          this['userData']['object']['rotation']['set'](0, 0, 0),
            this['userData']['object']['rotateX'](-deg2rad(conv2num(this['userData']['params']['rot']['x'], e))),
            this['userData']['object']['rotateY'](-deg2rad(conv2num(this['userData']['params']['rot']['y'], e))),
            this['userData']['object']['rotateZ'](-deg2rad(conv2num(this['userData']['params']['rot']['z'], e)));
        }
        ['b_rotate2']() {
          var e = {
            'parent_size': this['userData']['parent']['userData']['computed']['size'],
            'computed': this['userData']['root']['userData']['computed']['computed'],
            'variables': this['userData']['computed']['variables'],
            'materials': this['userData']['root']['userData']['computed']['materials']
          };
          this['userData']['object']['rotateX'](-deg2rad(conv2num(this['userData']['params']['rot2']['x'], e))),
            this['userData']['object']['rotateY'](-deg2rad(conv2num(this['userData']['params']['rot2']['y'], e))),
            this['userData']['object']['rotateZ'](-deg2rad(conv2num(this['userData']['params']['rot2']['z'], e)));
        }
        ['b_pivot']() {
          var f = conv_pivot(this['userData']['params']['pivot']['x'], this['userData']['computed']['size']['x']),
            g = conv_pivot(this['userData']['params']['pivot']['y'], this['userData']['computed']['size']['y']),
            h = conv_pivot(this['userData']['params']['pivot']['z'], this['userData']['computed']['size']['z']);
          this['userData']['object']['translateX'](f / units),
            this['userData']['object']['translateY'](g / units),
            this['userData']['object']['translateZ'](h / units);
        }
        ['get_pivot']() {
          return {
            'x': conv_pivot(this['userData']['params']['pivot']['x'], this['userData']['computed']['size']['x']),
            'y': conv_pivot(this['userData']['params']['pivot']['y'], this['userData']['computed']['size']['y']),
            'z': conv_pivot(this['userData']['params']['pivot']['z'], this['userData']['computed']['size']['z'])
          };
        }
        ['b_spec']() {}
        ['add_child'](f, g) {
          let h = 1;
          var g = this['userData']['path2'] + ',' + g,
            i;
          try {
            if (f['condition'] && (h = check_condition(f['condition'], {
                'computed': this['userData']['root']['userData']['computed']['computed'],
                'local_parent': void 0 !== this['userData']['parent_params']['local_parent'] ? this['userData'][
                  'parent_params'
                ]['local_parent'] : null,
                'variables': this['userData']['computed']['variables']
              })),
              f['visible'] = h,
              'function' == typeof pp['events']['parts']['sec_condition_check'] && pp['events']['parts'][
                'sec_condition_check'
              ](f, this),
              f['visible'])
              return i = void 0 !== this['userData']['parent_params']['local_parent'] ? this['userData'][
                  'parent_params'
                ]['local_parent'] : null,
                this['add_object'](new item_types[f['type']](f, {
                  'parent': this,
                  'root': this['userData']['root'],
                  'path': g,
                  'local_parent': i,
                  'is_draggable_child': void 0 !== this['userData']['parent_params']['is_draggable_child'] ? this[
                    'userData']['parent_params']['is_draggable_child'] : null
                })),
                this['build_drag_sizes'](),
                g;
          } catch (j) {}
        }
        ['add_object'](e) {
          this['userData']['object']['add'](e);
        }
        ['add_own_object'](e) {
          this['userData']['own_object']['add'](e);
        }
        ['remove_object'](e) {
          this['userData']['object']['remove'](e);
        }
        ['remove_own_object'](e) {
          this['userData']['own_object']['remove'](e);
        }
        ['remove_child_by_index'](e) {
          this['userData']['object']['remove'](this['userData']['object']['children'][e]),
            this['userData']['params']['children']['splice'](e, 1);
          for (let f = 0; f < this['userData']['children']['length']; f++)
            this['userData']['children'][f]['userData']['path'] = this['userData']['path2'] + ',' + f,
            this['userData']['children'][f]['userData']['path2'] = this['userData']['path2'] + ',' + f;
        }
        ['reset'](e = this['userData']['object']) {
          if (e['rotation']['set'](0, 0, 0),
            e['position']['set'](0, 0, 0),
            e['children']['length']) {
            for (let f = e['children']['length']; f--;)
              this['reset'](e['children'][f]);
          }
          e['uuid'] != this['userData']['object']['uuid'] && e['uuid'] != this['userData']['own_object']['uuid'] && e[
            'uuid'] != this['userData']['sizes_object']['uuid'] && ('Mesh' === e['type'] && (e['geometry']['dispose']
              (),
              dispose_material(e['material'])),
            e['parent']) && e['parent']['remove'](e);
        }
        ['delete']() {
          this['on_delete'](),
            this['reset'](),
            this['parent']['remove'](this);
        }
        ['on_delete']() {
          var e = this['userData']['children'];
          if (e) {
            for (let f = 0; f < e.length; f++)
              try {
                e[f]['on_delete']();
              } catch (g) {}
          }
        }
        ['build_helpers']() {
          var e = this['userData']['helpers'];
          for (let g = e['children']['length']; g--;)
            e['remove'](e['children'][g]);
          var f = make_cube(this['userData']['computed']['size']['x'] / units, this['userData']['computed']['size'][
              'y'] / units, this['userData']['computed']['size']['z'] / units, new THREE['MeshBasicMaterial']({
                'color': '#96c296',
                'transparent': true,
                'opacity': 0,
                'depthWrite': false,
                'depthTest': false
              })),
            f = (f['userData']['no_edges'] = 1,
              f['renderOrder'] = 10,
              this['userData']['size_helper'] = f,
              e['add'](f),
              make_edges(this['userData']['computed']['size']['x'] / units, this['userData']['computed']['size']['y'] /
                units, this['userData']['computed']['size']['z'] / units, new THREE['LineBasicMaterial']({
                  'color': '#000000',
                  'depthTest': false
                })));
          f['renderOrder'] = 11,
            e['add'](f),
            f['userData']['no_edges'] = 1;
        }
        ['show_helpers']() {
          this['userData']['helpers']['visible'] = true;
        }
        ['hide_helpers']() {
          this['userData']['helpers']['visible'] = false;
        }
        ['build_drag_area']() {
          this['userData']['params']['spec']['drag_enabled'] && (this['userData']['drag_area'] && (this['userData'][
                'drag_area'
              ]['_dispose'](),
              this['remove'](this['userData']['drag_area'])),
            this['userData']['drag_area'] = new Drag_area({
              'x': this['userData']['computed']['size']['x'],
              'y': this['userData']['computed']['size']['y'],
              'z': this['userData']['computed']['size']['z']
            }),
            this['userData']['drag_area']['position']['copy'](this['userData']['object']['position']),
            this['userData']['drag_area']['rotation']['copy'](this['userData']['object']['rotation']),
            this['add'](this['userData']['drag_area']),
            this['userData']['drag_area']['visible'] = false);
        }
        ['get_drag_area']() {
          return this['userData']['drag_area']['get_area']();
        }
        ['show_drag_area']() {
          this['userData']['drag_area']['visible'] = true;
        }
        ['hide_drag_area']() {
          this['userData']['drag_area']['visible'] = false;
        }
        ['get_params']() {
          return copy_object(this['userData']['params']);
        }
        ['gp']() {
          var f = copy_object(this['userData']['params']),
            g = (f['children'] = [],
              this['userData']['children']);
          for (let h = 0; h < g.length; h++)
            'function' == typeof g[h]['gp'] && f['children']['push'](g[h]['gp']());
          return f;
        }
        ['change_material'](f, g, h) {
          for (let i = 0; i < this['userData']['children']['length']; i++)
            'function' == typeof this['userData']['children'][i]['change_material'] && this['userData']['children'][i][
              'change_material'
            ](f, g, h);
        }
        ['change_corpus_material'](f, g) {
          for (let h = 0; h < this['userData']['children']['length']; h++)
            'function' == typeof this['userData']['children'][h]['change_corpus_material'] && this['userData'][
              'children'
            ][h]['change_corpus_material'](f, g);
        }
        ['change_facade_material'](f, g) {
          for (let h = 0; h < this['userData']['children']['length']; h++)
            'function' == typeof this['userData']['children'][h]['change_facade_material'] && this['userData'][
              'children'
            ][h]['change_facade_material'](f, g);
        }
        ['set_facade_style'](e) {
          for (let f = 0; f < this['userData']['children']['length']; f++)
            'function' == typeof this['userData']['children'][f]['set_facade_style'] && this['userData']['children'][f][
              'set_facade_style'
            ](e);
        }
        ['build_drag_sizes'](f = {
          'x': [],
          'y': [],
          'z': []
        }) {
          if (this['userData']['params']['spec']['drag_enabled']) {
            this['reset'](this['userData']['sizes_object']),
              this['userData']['sizes_object']['position']['copy'](this['userData']['object']['position']),
              this['userData']['sizes_object']['rotation']['copy'](this['userData']['object']['rotation']);
            var g = this['userData']['children'],
              j = {
                'x': [],
                'y': [],
                'z': []
              },
              k = 'xyz',
              m, q, m, q, v;
            for (let D = 0; D < k.length; D++) {
              var w = k[D];
              j[w]['push'](0),
                j[w]['push'](this['userData']['computed']['size'][w]);
              for (let E = 0; E < f[w]['length']; E++)
                j[w]['push'](this['userData']['computed']['size'][w] / 2 + f[w][E]);
            }
            for (let F = 0; F < g.length; F++) {
              g[F] instanceof Draggable && (0 == g[F]['userData']['params']['spec']['fill']['size']['x'] && ({
                    pos: m,
                    size: q
                  } = g[F]['userData']['computed'],
                  j['y']['push'](m['y'] - q['y'] / 2),
                  j['y']['push'](m['y'] + q['y'] / 2)),
                0 == g[F]['userData']['params']['spec']['fill']['size']['y']) && ({
                  pos: m,
                  size: q
                } = g[F]['userData']['computed'],
                j['x']['push'](m['x'] - q['x'] / 2),
                j['x']['push'](m['x'] + q['x'] / 2));
            }
            for (let G = 0; G < k.length; G++) {
              j[k[G]]['sort']((H, I) => H - I);
            }
            this['userData']['computed']['sizes'] = j;
            var x = {
                'x': -this['userData']['computed']['size']['x'] / units / 2,
                'y': -this['userData']['computed']['size']['y'] / units / 2,
                'z': -this['userData']['computed']['size']['z'] / units / 2
              },
              y = {
                'x': this['userData']['computed']['size']['x'] / units / 2,
                'y': this['userData']['computed']['size']['y'] / units / 2,
                'z': -this['userData']['computed']['size']['z'] / units / 2 + 0.2
              };
            for (let H = 0; H < k.length; H++) {
              var z = k[H];
              if (j[z]['sort']((I, J) => I - J),
                2 < j[z]['length'])
                for (let I = 0; I < j[z]['length'] - 1; I++) {
                  var A = j[z][I],
                    B, A = j[z][I + 1] - A,
                    C = new Sizes_obj({
                      'arrows': 0,
                      'width': A / units,
                      'text': c_round(A),
                      'length': 70 / units,
                      'middle_line_position': 60 / units,
                      'scale': 0.6
                    });
                  x[z] = x[z] + A / units / 2,
                    'x' == z && (C['position']['set'](x[z], y['y'], y['z']),
                      C['rotation']['z'] = 0),
                    'y' == z && (C['position']['set'](y['x'], x[z], y['z']),
                      C['rotation']['z'] = -Math['PI'] / 2),
                    'z' == z && C['position']['set'](y['x'], y['y'], x[z]),
                    x[z] = x[z] + A / units / 2,
                    this['userData']['sizes_object']['add'](C);
                }
            }
          }
        }
        ['edges_mode']() {
          PPObject['prototype']['edges_mode_traverse']['call'](this, this['userData']['own_object'], true);
          for (let e = 0; e < this['userData']['children']['length']; e++)
            'function' == typeof this['userData']['children'][e]['edges_mode'] && this['userData']['children'][e][
              'edges_mode'
            ]();
        }
        ['get_children_by_instance'](f) {
          var g = [];
          for (let h = this['userData']['children']['length']; h--;)
            this['userData']['children'][h] instanceof f && g.push(this['userData']['children'][h]);
          return g;
        }
        ['get_children_by_class'](f, g = false, h) {
          var h = (h = h || this)['userData']['children'] || [];
          let i = h.filter(j => j['userData']['class'] === f);
          return g && 0 < h.length && h.forEach(j => {
              i.push(...this['get_children_by_class'](f, g, j));
            }),
            i;
        }
        ['get_children_by_name'](f, g = false, h) {
          var h = (h = h || this)['userData']['children'] || [];
          let i = h.filter(j => j['name'] === f);
          return g && 0 < h.length && h.forEach(j => {
              i.push(...this['get_children_by_name'](f, g, j));
            }),
            i;
        }
        ['get_parent_by_name'](e, f) {
          return (f = f || this)['userData']['parent'] && 'CabinetN' != f['userData']['parent']['userData']['class'] ?
            f['userData']['parent']['name'] == e ? f['userData']['parent'] : f['userData']['parent'][
              'get_parent_by_name'
            ](e) : null;
        }
        ['get_children_by_tag'](f, g = false) {
          let h = [];
          for (let j = this['userData']['children']['length']; j--;) {
            var i = this['userData']['children'][j];
            i['userData']['computed']['tags'][f] && h.push(i),
              g && 'function' == typeof i['get_children_by_tag'] && (h = h['concat'](i['get_children_by_tag'](f, !
              0)));
          }
          return h;
        }
        ['get_child_by_id'](f) {
          for (let h = 0; h < this['userData']['children']['length']; h++)
            if (this['userData']['children'][h]['userData']['params']['id'] === f)
              return this['userData']['children'][h];
          for (let i = 0; i < this['userData']['children']['length']; i++)
            if ('function' == typeof this['userData']['children'][i]['get_child_by_id']) {
              var g = this['userData']['children'][i]['get_child_by_id'](f);
              if (g)
                return g;
            }
          return null;
        }
        ['animate']() {
          for (let e = 0; e < this['userData']['children']['length']; e++)
            'function' == typeof this['userData']['children'][e]['edges_mode'] && this['userData']['children'][e][
              'animate'
            ]();
        }
        ['get_world_position']() {
          return this['getWorldPosition'](new THREE['Vector3']());
        }
        ['get_size_vec3']() {
          return new THREE['Vector3'](this['userData']['computed']['size']['x'] / units, this['userData']['computed'][
            'size'
          ]['y'] / units, this['userData']['computed']['size']['z'] / units);
        }
        ['set_size_by_number'](f, g, h) {
          this['userData']['params']['size']['x'] = f,
            this['userData']['params']['size']['y'] = g,
            this['userData']['params']['size']['z'] = h,
            this['rebuild'](this['userData']['params']);
        }
        ['get_world_center']() {
          var e = this['getWorldPosition'](new THREE['Vector3']());
          return -1 == this['userData']['params']['pivot']['x'] && (e['x'] += this['userData']['computed']['size'][
              'x'] / units / 2),
            1 == this['userData']['params']['pivot']['x'] && (e['x'] -= this['userData']['computed']['size']['x'] /
              units / 2),
            1 == this['userData']['params']['pivot']['y'] && (e['y'] -= this['userData']['computed']['size']['y'] /
              units / 2),
            -1 == this['userData']['params']['pivot']['y'] && (e['y'] += this['userData']['computed']['size']['y'] /
              units / 2),
            1 == this['userData']['params']['pivot']['z'] && (e['z'] -= this['userData']['computed']['size']['z'] /
              units / 2),
            -1 == this['userData']['params']['pivot']['z'] && (e['z'] += this['userData']['computed']['size']['z'] /
              units / 2),
            e;
        }
        ['get_box']() {
          return new THREE['Box3']()['setFromObject'](this['userData']['size_helper']);
        }
        ['get_connected']() {
          var f = this['userData']['parent'],
            g = [],
            h = new THREE['Box3']()['setFromObject'](this)['expandByScalar'](0.1);
          for (let l = f['userData']['children']['length']; l--;) {
            var j = f['userData']['children'][l],
              k;
            j['uuid'] != this['uuid'] && 'Draggable' == j['userData']['class'] && (k = new THREE['Box3']()[
                'setFromObject'](j),
              0 == this['userData']['params']['spec']['fill']['size']['y'] && 0 == j['userData']['params']['spec']
              ['fill']['size']['x'] && h['intersectsBox'](k) && g.push(j),
              0 == this['userData']['params']['spec']['fill']['size']['x']) && 0 == j['userData']['params'][
              'spec']['fill']['size']['y'] && h['intersectsBox'](k) && g.push(j);
          }
          return this['userData']['connected'] = g;
        }
        ['get_accessories']() {
          var f = this['get_children_by_class']('Draggable', true, this),
            g = [];
          for (let h = f.length; h--;)
            g.push(...f[h]['userData']['params']['spec']['accessories'] || []);
          return g;
        }
        ['get_center']() {
          var e = this['position']['clone']();
          return -1 == this['userData']['params']['pivot']['x'] && (e['x'] += this['userData']['computed']['size'][
              'x'] / units / 2),
            1 == this['userData']['params']['pivot']['x'] && (e['x'] -= this['userData']['computed']['size']['x'] /
              units / 2),
            1 == this['userData']['params']['pivot']['y'] && (e['y'] -= this['userData']['computed']['size']['y'] /
              units / 2),
            -1 == this['userData']['params']['pivot']['y'] && (e['y'] += this['userData']['computed']['size']['y'] /
              units / 2),
            1 == this['userData']['params']['pivot']['z'] && (e['z'] -= this['userData']['computed']['size']['z'] /
              units / 2),
            -1 == this['userData']['params']['pivot']['z'] && (e['z'] += this['userData']['computed']['size']['z'] /
              units / 2),
            e;
        }
        ['get_local_box']() {
          return new THREE['Box3']()['setFromCenterAndSize'](this['get_center'](), this['get_size_vec3']());
        }
        }
        class WallCN extends Section {
          constructor(f = {}, g = {
              'parent': null,
              'root': null,
              'path': null
            }) {
              super(f, g);
            }
            ['b_size']() {
              this['userData']['params']['material']['key'] || (this['userData']['params']['material']['key'] = 'ldsp');
              var f = 0,
                g = ('default' == this['userData']['params']['material']['key'] && (this['userData']['params'][
                      'material'
                    ]['key'] = this['userData']['root']['userData']['params']['default_material']['split']('::')[0],
                    this['userData']['params']['material']['group'] = this['userData']['root']['userData']['params'][
                      'default_material'
                    ]['split']('::')[1]),
                  this['userData']['params']),
                h = (g['material']['group'] || (g['material']['group'] = 0),
                  this['userData']['root']['userData']['params']),
                j = g['material']['key'] + '::' + g['material']['group'],
                k = (h['materials'][j] || (set_obj['materials'][g['material']['key']] || (g['material']['key'] =
                      '__no_mat',
                      g['material']['variant'] = 'current',
                      this['userData']['root']['set_deleted_material'](this['userData']['path2'])),
                    this['userData']['root']['add_material_key'](g['material']['key'], g['material']['group'])),
                  this['userData']['root']['userData']['computed']['used_materials'][g['material']['key'] + '::' + g[
                    'material']['group']] || (this['userData']['root']['userData']['computed']['used_materials'][g[
                    'material']['key'] + '::' + g['material']['group']] = 1),
                  !this['userData']['local_parent'] || this['userData']['local_parent']['userData']['materials'][g[
                    'material']['key'] + '::' + g['material']['group']] || this['userData']['local_parent'][
                    'add_material_key'
                  ](g['material']['key'], g['material']['group']), {
                    'parent_size': this['userData']['parent']['userData']['computed']['size'],
                    'computed': this['userData']['root']['userData']['computed']['computed'],
                    'variables': this['userData']['root']['userData']['computed']['variables'],
                    'materials': this['userData']['root']['userData']['computed']['materials']
                  });
              if (this['userData']['params']['material']['key'] && set_obj['materials'][this['userData']['params'][
                  'material'
                ]['key']]) {
                this['userData']['computed']['size'] = {};
                var l = this['userData']['params']['material'],
                  m = l['key'] + '::' + l['group'];
                switch (set_obj['materials'][this['userData']['params']['material']['key']]['type']) {
                  case 'm2':
                    this['userData']['params']['size']['x']['indexOf']('default') && (this['userData']['params']['size']
                        ['x'] = this['userData']['params']['size']['x']['replaceAll']('default', m)),
                      this['userData']['params']['size']['y']['indexOf']('default') && (this['userData']['params'][
                        'size'
                      ]['y'] = this['userData']['params']['size']['y']['replaceAll']('default', m)),
                      this['userData']['computed']['size']['x'] = comp2(this['userData']['params']['size']['x'], k),
                      this['userData']['computed']['size']['y'] = comp2(this['userData']['params']['size']['y'], k),
                      'current' == l['variant'] ? this['userData']['computed']['size']['z'] = comp2('m:' + m +
                        '.size.z', k) : this['userData']['computed']['size']['z'] = comp2('m:' + m + '.' + l[
                        'variant'] + '.size.z', k);
                    break;
                  case 'm':
                    break;
                }
                this['userData']['size'] = copy_object(this['userData']['computed']['size']);
              } else
                super['b_size']();
            }
          async ['b_spec']() {
            let f = this['userData']['params'];
            var g = this['userData']['computed'];
            let h, j, k = {
              'parent_size': this['userData']['parent']['userData']['computed']['size'],
              'computed': this['userData']['root']['userData']['computed']['computed'],
              'variables': this['userData']['root']['userData']['computed']['variables'],
              'materials': this['userData']['root']['userData']['computed']['materials']
            };
            switch (f['spec']['type']) {
              case 'model':
                return void this['load_model']();
              case 'cut_corners':
                j = p_shapes[f['spec']['type']](g['size']['x'] / units, g['size']['y'] / units, comp2(f['spec'][
                    'type_params'
                  ]['cbl'], k) / units, comp2(f['spec']['type_params']['ctl'], k) / units, comp2(f['spec'][
                    'type_params'
                  ]['ctr'], k) / units, comp2(f['spec']['type_params']['cbr'], k) / units),
                  (h = new THREE['ExtrudeBufferGeometry'](j, {
                    'steps': 1,
                    'depth': g['size']['z'] / units,
                    'bevelEnabled': false
                  }))['translate'](0, 0, -g['size']['z'] / units / 2),
                  correct_buffer_uv_simple(h, g['size']['x'] / units, g['size']['y'] / units);
                break;
              case 'triangle':
                j = p_shapes[f['spec']['type']](g['size']['x'] / units, g['size']['y'] / units, f['spec'][
                    'type_params'
                  ]['corner']),
                  (h = new THREE['ExtrudeBufferGeometry'](j, {
                    'steps': 1,
                    'depth': g['size']['z'] / units,
                    'bevelEnabled': false
                  }))['translate'](0, 0, -g['size']['z'] / units / 2),
                  correct_buffer_uv_simple(h, g['size']['x'] / units, g['size']['y'] / units);
                break;
              case 'rounded_corners':
                j = p_shapes[f['spec']['type']](g['size']['x'] / units, g['size']['y'] / units, comp2(f['spec'][
                    'type_params'
                  ]['cbl'], k) / units, comp2(f['spec']['type_params']['ctl'], k) / units, comp2(f['spec'][
                    'type_params'
                  ]['ctr'], k) / units, comp2(f['spec']['type_params']['cbr'], k) / units),
                  (h = new THREE['ExtrudeBufferGeometry'](j, {
                    'steps': 1,
                    'depth': g['size']['z'] / units,
                    'bevelEnabled': false
                  }))['translate'](0, 0, -g['size']['z'] / units / 2),
                  correct_buffer_uv_simple(h, g['size']['x'] / units, g['size']['y'] / units);
                break;
              case 'skewed_by_angle':
                f['spec']['type_params']['type'] || (f['spec']['type_params']['type'] = 'x'),
                  'x' == f['spec']['type_params']['type'] ? (j = p_shapes[f['spec']['type']](g['size']['x'] / units,
                      g['size']['z'] / units, f['spec']['type_params']['a1'], f['spec']['type_params']['a2']),
                    (h = new THREE['ExtrudeBufferGeometry'](j, {
                      'steps': 1,
                      'depth': g['size']['y'] / units,
                      'bevelEnabled': false
                    }))['rotateX'](-Math['PI'] / 2)['translate'](0, -g['size']['y'] / units / 2, 0),
                    correct_buffer_uv_simple(h, g['size']['x'] / units, g['size']['y'] / units)) : (j = p_shapes[f[
                      'spec']['type']](g['size']['y'] / units, g['size']['z'] / units, f['spec']['type_params']['a1'],
                      f['spec']['type_params']['a2']),
                    (h = new THREE['ExtrudeBufferGeometry'](j, {
                      'steps': 1,
                      'depth': g['size']['x'] / units,
                      'bevelEnabled': false
                    }))['rotateY'](-Math['PI'] / 2)['rotateX'](-Math['PI'] / 2)['translate'](g['size']['x'] /
                      units / 2, 0, 0),
                    correct_buffer_uv_simple(h, g['size']['y'] / units, g['size']['x'] / units));
                break;
              case 'trapeze_cut_by_offset':
                j = p_shapes[f['spec']['type']](g['size']['x'] / units, g['size']['y'] / units, comp2(f['spec'][
                    'type_params'
                  ]['w1'], k) / units, comp2(f['spec']['type_params']['h1'], k) / units, comp2(f['spec'][
                    'type_params'
                  ]['w2'], k) / units, comp2(f['spec']['type_params']['h2'], k) / units),
                  (h = new THREE['ExtrudeBufferGeometry'](j, {
                    'steps': 1,
                    'depth': g['size']['z'] / units,
                    'bevelEnabled': false
                  }))['translate'](0, 0, -g['size']['z'] / units / 2),
                  correct_buffer_uv_simple(h, g['size']['x'] / units, g['size']['y'] / units);
                break;
              case 'half_rounded':
                j = p_shapes[f['spec']['type']](g['size']['x'] / units, g['size']['y'] / units, f['spec'][
                    'type_params'
                  ]['orientation'], comp2(f['spec']['type_params']['radius'], k) / units),
                  (h = new THREE['ExtrudeBufferGeometry'](j, {
                    'steps': 1,
                    'depth': g['size']['z'] / units,
                    'bevelEnabled': false
                  }))['rotateX'](-Math['PI'])['translate'](0, 0, g['size']['z'] / units / 2),
                  correct_buffer_uv_simple(h, g['size']['x'] / units, g['size']['y'] / units);
                break;
              default:
                if ('common' != f['spec']['type']) {
                  let m = {
                    'width': g['size']['x'] / units,
                    'height': g['size']['y'] / units
                  };
                  Object['keys'](f['spec']['type_params'])['forEach'](n => {
                      if (isArray(f['spec']['type_params'][n])) {
                        var o = [];
                        for (let q = 0; q < f['spec']['type_params'][n]['length']; q++)
                          if ('object' == typeof f['spec']['type_params'][n][q]) {
                            let u = {};
                            Object['keys'](f['spec']['type_params'][n][q])['forEach'](v => {
                                var w = f['spec']['type_params'][n][q][v];
                                u[v] = comp2(w, k) / units;
                              }),
                              o.push(u);
                          } else
                            o.push(comp2(f['spec']['type_params'][n][q], k) / units);
                        m[n] = o;
                      } else
                        m[n] = comp2(f['spec']['type_params'][n], k) / units;
                    }),
                    this['userData']['computed']['type_params'] = m,
                    j = p_shapes[f['spec']['type']](m),
                    (h = new THREE['ExtrudeBufferGeometry'](j, {
                      'steps': 1,
                      'depth': g['size']['z'] / units,
                      'bevelEnabled': false
                    }))['translate'](0, 0, -g['size']['z'] / units / 2),
                    correct_buffer_uv_simple(h, g['size']['x'] / units, g['size']['y'] / units);
                } else
                  f['shape'] ? (h = new THREE['ExtrudeBufferGeometry'](f['shape'], {
                      'steps': 1,
                      'depth': g['size']['z'] / units,
                      'bevelEnabled': false
                    }),
                    correct_buffer_uv_simple(h, g['size']['x'] / units, g['size']['y'] / units)) : h = new THREE[
                    'BoxBufferGeometry'](g['size']['x'] / units, g['size']['y'] / units, g['size']['z'] / units);
            }
            'h' == f['spec']['orientation'][0] && h['rotateX'](-Math['PI'] / 2),
              'v' == f['spec']['orientation'][0] && h['rotateY'](Math['PI'] / 2);
            var l = new THREE['Mesh'](h);
            l['castShadow'] = true,
              l['receiveShadow'] = true,
              l['userData']['edgesModeType'] = ObjectType['Wall'],
              this['add_own_object'](l),
              this['apply_material']();
          }
          async ['load_model']() {
              var f = await load_model({
                'model': this['userData']['params']['spec']['type_params']['model'],
                'buffer': true,
                'no_cache': -1 < this['userData']['params']['spec']['type_params']['model']['indexOf'](
                  'data:application')
              });
              for (let i = 0; i < f.length; i++) {
                var g = f[i]['clone'](),
                  h = ('f' == this['userData']['params']['spec']['orientation'][0] && g['rotateX'](Math['PI'] / 2),
                    'v' == this['userData']['params']['spec']['orientation'][0] && (g['rotateX'](Math['PI'] / 2),
                      g['rotateY'](Math['PI'] / 2)),
                    new THREE['Mesh'](g, red_mat));
                h['name'] = g['name'],
                  h['castShadow'] = true,
                  h['receiveShadow'] = true,
                  h['userData']['edgesModeType'] = ObjectType['Wall'],
                  this['add_own_object'](h);
              }
              for (let j = 0; j < f.length; j++)
              ;
              this['apply_material'](),
                this['set_size']();
            }
            ['set_size']() {
              var f = this['userData']['object'];
              let g, h, j;
              switch (this['userData']['params']['spec']['orientation'][0]) {
                case 'f':
                  g = this['userData']['size']['x'],
                    h = this['userData']['size']['y'],
                    j = this['userData']['size']['z'];
                  break;
                case 'h':
                  g = this['userData']['size']['x'],
                    h = this['userData']['size']['z'],
                    j = this['userData']['size']['y'];
                  break;
                case 'v':
                  g = this['userData']['size']['z'],
                    h = this['userData']['size']['y'],
                    j = this['userData']['size']['x'];
                  break;
              }
              var k = {
                  'x': g / units,
                  'y': h / units,
                  'z': j / units
                },
                l = f['rotation']['clone'](),
                m = new THREE['Euler']()['setFromQuaternion'](f['getWorldQuaternion'](new THREE['Quaternion']())[
                  'clone']()),
                m = (f['rotation']['set'](-1 * m['x'], -1 * m['y'], -1 * m['z']),
                  box3['setFromObject'](f)['getSize'](new THREE['Vector3']())['clone']()),
                m = new THREE['Vector3'](g / units, h / units, j / units)['sub'](m)['divideScalar'](2),
                n = {
                  'box': box3['setFromObject'](f)['getSize'](new THREE['Vector3']())['clone'](),
                  'diff': m,
                  'size': k
                };
              for (let o = 0; o < f['children']['length']; o++)
                set_size_buff(f['children'][o], f['children'][o]['name'], n);
              f['rotation']['copy'](l);
            }
            ['b_pivot']() {
              var f = this['userData']['params'],
                g = this['userData']['computed'];
              let h, i, j;
              switch (f['spec']['orientation'][0]) {
                case 'h':
                  h = conv_pivot(f['pivot']['x'], g['size']['x']),
                    i = conv_pivot(f['pivot']['y'], g['size']['z']),
                    j = conv_pivot(f['pivot']['z'], g['size']['y']);
                  break;
                case 'v':
                  h = conv_pivot(f['pivot']['x'], g['size']['z']),
                    i = conv_pivot(f['pivot']['y'], g['size']['y']),
                    j = conv_pivot(f['pivot']['z'], g['size']['x']);
                  break;
                case 'f':
                  h = conv_pivot(f['pivot']['x'], g['size']['x']),
                    i = conv_pivot(f['pivot']['y'], g['size']['y']),
                    j = conv_pivot(f['pivot']['z'], g['size']['z']);
                  break;
              }
              this['userData']['object']['translateX'](h / units),
                this['userData']['object']['translateY'](i / units),
                this['userData']['object']['translateZ'](j / units);
            }
            ['change_material'](f, g, h) {
              super['change_material'](f, g, h),
                this['userData']['params']['material']['fixed'] || this['userData']['params']['material']['id'] != h &&
                this['userData']['params']['material']['key'] === f && this['userData']['params']['material'][
                'group'] == g && (this['userData']['params']['material']['id'] = h,
                  this['apply_material']());
            }
            ['change_corpus_material'](f, g) {
              super['change_corpus_material'](f, g),
                this['userData']['params']['material']['fixed'] || this['userData']['params']['material']['id'] != g &&
                this['userData']['params']['material']['key'] === f && (this['userData']['params']['material']['id'] =
                  g,
                  this['apply_material']());
            }
            ['get_specs']() {
              var f = {},
                g = (f['val'] = this['userData']['computed']['size']['x'] * this['userData']['computed']['size']['y'] /
                  1000 / 1000,
                  f['m2'] = f['val'],
                  f['thickness'] = this['userData']['computed']['size']['z'],
                  this['userData']['params']['material']);
              let h;
              h = ('current' == g['variant'] ? this['userData']['root']['userData']['params']['materials'][g['key'] +
                  '::' + g['group']
                ] : g)['variant'],
                f['id'] = g['key'] + '::' + h + '::' + g['id'],
                f['size'] = this['userData']['computed']['size'],
                f['name'] = this['userData']['params']['name'];
              var j = set_obj['materials'][g['key']],
                k = j['variants'][h],
                g = (f['type'] = j['type'],
                  materials_lib['get_item'](g['id'])),
                l = materials_lib['get_category'](g['category']),
                m = {
                  'name': ''
                },
                n;
              return l['parent'] && (n = materials_lib['get_category'](l['parent']),
                  m['name'] = n['name']),
                f['material'] = {
                  'key': j['key'],
                  'key_v': k['key'],
                  'name_m': j['name'],
                  'name_v': k['name'],
                  'name_f': (j['name'] + ',\x20' + k['name'])['trim']()
                },
                f['decor'] = {
                  'id': g['id'],
                  'category': g['category'],
                  'name': g['name'],
                  'code': g['code'],
                  'name_c': l['name'],
                  'name_p': m['name'],
                  'name_f': (m['name'] + '\x20' + l['name'] + '\x20' + g['name'] + '\x20' + g['code'])['trim']()
                },
                this['userData']['specs'] = f;
            }
            ['apply_material']() {
              var f = this['userData']['params'],
                g = this['userData']['computed'],
                h = this['userData']['root']['userData']['params'],
                j, k = (this['userData']['local_parent'] ? f['material']['id'] = this['userData']['params']['material'][
                    'id'
                  ] : f['material']['id'] = h['materials'][f['material']['key'] + '::' + f['material']['group']]['id'],
                  f['material']['id'] || this['userData']['local_parent'] && this['userData']['local_parent'][
                    'userData']['params']['spec']['materials'] && (j = this['userData']['local_parent']['userData'][
                    'params'
                  ]['spec']['materials'])[f['material']['key'] + '::' + f['material']['group']] && (f['material'][
                    'id'] = j[f['material']['key'] + '::' + f['material']['group']]),
                  f['material']['id'] || (f['material']['id'] = h['materials'][f['material']['key'] + '::' + f[
                    'material']['group']]['id']),
                  'function' == typeof pp['events']['parts']['wall_before_apply_material'] && pp['events']['parts'][
                    'wall_before_apply_material'
                  ](this, f),
                  materials_lib['get_item'](f['material']['id']));
              f['material']['rotated'] && (k['add_params']['rotation'] = 'rotated'),
                k['add_params']['model_width'] = g['size']['x'],
                k['add_params']['model_height'] = g['size']['y'];
              for (let n = 0; n < this['userData']['own_object']['children']['length']; n++) {
                dispose_material(this['userData']['own_object']['children'][n]['material']);
                var l = create_material(k),
                  m;
                0 != this['userData']['params']['material']['back_mat'] ? ((m = materials_lib['get_item'](f[
                      'material']['back_mat']))['add_params']['model_width'] = g['size']['x'],
                    m['add_params']['model_height'] = g['size']['y'],
                    this['userData']['own_object']['children'][n]['material'] = [l, l, l, l, l, create_material(m)]) :
                  this['userData']['own_object']['children'][n]['material'] = l;
              }
            }
            ['build_helpers']() {
              super['build_helpers'](),
                'h' == this['userData']['params']['spec']['orientation'][0] && this['userData']['helpers']['children']
                [0]['geometry']['rotateX'](-Math['PI'] / 2),
                'h' == this['userData']['params']['spec']['orientation'][0] && this['userData']['helpers']['children']
                [1]['geometry']['rotateX'](-Math['PI'] / 2),
                'v' == this['userData']['params']['spec']['orientation'][0] && this['userData']['helpers']['children']
                [0]['geometry']['rotateY'](Math['PI'] / 2),
                'v' == this['userData']['params']['spec']['orientation'][0] && this['userData']['helpers']['children']
                [1]['geometry']['rotateY'](Math['PI'] / 2);
            }
            ['get_size_vec3']() {
              switch (this['userData']['params']['spec']['orientation'][0]) {
                case 'f':
                  return new THREE['Vector3'](this['userData']['computed']['size']['x'] / units, this['userData'][
                    'computed'
                  ]['size']['y'] / units, this['userData']['computed']['size']['z'] / units);
                case 'h':
                  return new THREE['Vector3'](this['userData']['computed']['size']['x'] / units, this['userData'][
                    'computed'
                  ]['size']['z'] / units, this['userData']['computed']['size']['y'] / units);
                case 'v':
                  return new THREE['Vector3'](this['userData']['computed']['size']['z'] / units, this['userData'][
                    'computed'
                  ]['size']['y'] / units, this['userData']['computed']['size']['x'] / units);
              }
            }
        }
        class Blocker extends Section {
          constructor(e = {}, f = {
            'parent': null,
            'root': null,
            'path': null
          }) {
            super(e, f),
              this['userData']['is_blocker'] = true;
          }
        }
        let c_params_n = {
          'spec': {
            'id': 0,
            'name': '',
            'rest': {
              'size': {
                'min_x': 0,
                'max_x': 0,
                'min_y': 0,
                'max_y': 0,
                'min_z': 0,
                'max_z': 0
              },
              'free_size': 1,
              'change_facade_types': 1,
              'change_handle': 1,
              'facades': null,
              'handles': null
            },
            'facades': {
              'glass': null,
              'model': null,
              'style': 'full',
              'materials': null,
              'items': {}
            },
            'handles': {
              'id': null,
              'size': 0,
              'enabled': 1,
              'active': 1,
              'hg_params': {
                0: {
                  'orient': 'v',
                  'pos': {
                    'x': 'c',
                    'y': 't'
                  }
                },
                1: {
                  'orient': 'h',
                  'pos': {
                    'x': 'c',
                    'y': 't'
                  }
                }
              },
              'items': {}
            },
            'overrides': {
              'models': {}
            },
            'comments': '',
            'materials': [],
            'variant': 0,
            'variants': [{
              'name': '',
              'code': '',
              'price': '',
              'size': {
                'x': 600,
                'y': 720,
                'z': 600
              },
              'variables': {}
            }],
            'mirror_x': 1,
            'group': 'top',
            'drag_mode': 'common',
            'drag_type': 'top',
            'type': null,
            'is_fill': false,
            'is_divider': false,
            'divider': {
              'orient': 'h'
            },
            'fill': {
              'size': {
                'x': 0,
                'y': 0,
                'z': 0
              }
            },
            'fill_locked': 0,
            'types': [],
            'template': '',
            'custom_data': {}
          },
          'path_params': {},
          'is_default': true,
          'children': [],
          'computed': {},
          'interaction': {
            'auto_rotation': 1
          },
          'resizable': {},
          'events': {
            'on_before_set_params': '',
            'on_change_facade': '',
            'on_change_facade_material': '',
            'on_before_build': '',
            'on_after_build': '',
            'on_after_handle_change': '',
            'on_before_drag': '',
            'on_after_drag': '',
            'on_drag_delete': '',
            'on_after_material_change': ''
          },
          'variables': {},
          'materials': {},
          'auto_rotation': 1
        };
        helper1 = null;
        class CabinetN extends PPObject {
          constructor(f) {
              super(f);
              let g = this;

              function h(i) {
                if (i['children'])
                  for (let k = i['children']['length']; k--;) {
                    if ('link' == i['children'][k]['type']) {
                      var j = catalog_lib['get_item'](i['children'][k]['spec']['id']);
                      i['children']['splice'](k, 1);
                      for (let l = 0; l < j['params']['children']['length']; l++)
                        i['children']['push'](j['params']['children'][l]);
                      return void h(f);
                    }
                    h(i['children'][k]);
                  }
              }
              this['temp_type'] = 'CabinetN',
                this['object_type'] = 'cabinet',
                this['box'] = new THREE['Box3'](),
                this['box']['update'] = function() {
                  g['box']['setFromObject'](g['size_box']);
                },
                this['userData']['class'] = this.constructor['name'],
                this['userData']['connected'] = [],
                1 == constructor_settings['test_link'] && (h(f),
                  ce(),
                  ce(),
                  ce()),
                this['set_params'](f),
                this['build'](false);
            }
            ['before_set_params'](f) {}
            ['set_params'](f) {
              f['events'] && 'function' == typeof cabinet_events[f['events']['on_before_set_params']] && cabinet_events[
                  f['events']['on_before_set_params']](f, this),
                this['before_set_params'](f),
                Array.isArray(f['variables']) && (f['variables'] = {}),
                this['userData']['params'] = _['merge'](copy_object(c_params_n), f);
              let g = this['userData']['params'];
              this['userData']['params']['spec']['id'] = g['id'],
                this['cabinet_type'] = this['userData']['params']['spec']['group'],
                Array.isArray(this['userData']['params']['path_params']) && (this['userData']['params'][
                  'path_params'] = {}),
                null != this['userData']['params']['spec']['type'] && Object['keys'](cabinet_templates[g['spec'][
                  'template'
                ]]['variables'])['forEach'](function(k) {
                  g['variables'][k] || (g['variables'][k] = copy_object(cabinet_templates[g['spec']['template']][
                    'variables'
                  ][k]));
                });
              for (let k = gvbt['all']['length']; k--;)
                g['variables'][gvbt['all'][k]] || (g['variables'][gvbt['all'][k]] = copy_object(global_variables[gvbt[
                  'all'][k]]));
              for (let l = g['spec']['types']['length']; l--;) {
                var h = g['spec']['types'][l];
                if (gvbt[h]) {
                  for (let m = gvbt[h]['length']; m--;)
                    g['variables'][gvbt[h][m]] || (g['variables'][gvbt[h][m]] = copy_object(global_variables[gvbt[h][
                      m]]));
                }
              }
              if (this['userData']['params']['children'] || (this['userData']['params']['children'] = []),
                this['userData']['params']['computed'] || (this['userData']['params']['computed'] = []),
                this['_set_materials'](),
                1 == g['is_default'] && (g['is_default'] = false),
                null == g['spec']['facades']['model']) {
                if (null == g['spec']['rest']['facades'] || view_mode) {
                  g['spec']['facades']['model'] = project_settings['defaults']['facades'][g['spec']['group']];
                  let n = project_settings['selected_materials']['facades'][g['spec']['facades']['model']];
                  g['spec']['facades']['materials'] = {},
                    Object['keys'](n)['forEach'](function(o) {
                      g['spec']['facades']['materials'][o] = parseInt(n[o][g['spec']['group']]);
                    });
                } else {
                  if (!g['spec']['rest']['facades']['default'])
                    switch (g['spec']['rest']['facades']['mode']) {
                      case 'i':
                        g['spec']['rest']['facades']['default'] = g['spec']['rest']['facades']['items'][0];
                        break;
                      case 'c':
                        g['spec']['rest']['facades']['default'] = facades_lib['categories'][g['spec']['rest']['facades']
                          ['items'][0]
                        ]['items'][0]['id'];
                        break;
                    }
                  g['spec']['facades']['model'] = g['spec']['rest']['facades']['default'];
                  let o = facades_lib['get_item'](g['spec']['facades']['model']);
                  g['spec']['facades']['materials'] = {
                      'gen': materials_lib['get_first_item'](o['materials'][0])['id']
                    },
                    Object['keys'](o['additional_materials'])['forEach'](function(p) {
                      g['spec']['facades']['materials'][p] = parseInt(o['additional_materials'][p]['selected']);
                    });
                }
                g['spec']['facades']['glass'] = project_settings['selected_materials']['glass'];
              }
              null != g['spec']['handles']['id'] && 0 != g['spec']['handles']['id'] || (null == g['spec']['rest'][
                  'handles'
                ] || view_mode ? g['spec']['handles']['id'] = 0 : g['spec']['handles']['id'] = g['spec']['rest'][
                  'handles'
                ]['default']),
                this['params'] = this['userData']['params'],
                this['drag_mode'] = this['userData']['params']['spec']['drag_mode'];
              let i = this['userData']['params']['computed'],
                j = {};
              Object['keys'](i)['forEach'](function(p) {
                  if (i[p]['depends']) {
                    for (let q = i[p]['depends']['length']; q--;)
                      j[i[p]['depends'][q]] || (j[i[p]['depends'][q]] = comp2(i[i[p]['depends'][q]], i));
                  }
                  j[p] = comp2(i[p], i);
                }),
                this['userData']['computed'] = {
                  'parent_size': g['size'],
                  'computed': j,
                  'variables': copy_object(g['variables']),
                  'materials': g['materials'],
                  'variant_accessories': [],
                  'accessories': []
                },
                this['userData']['computed']['size'] = g['size'],
                this['userData']['params']['size'] ? this['userData']['params']['spec']['variants'][this['userData'][
                  'params'
                ]['spec']['variant']]['accessories'] && (this['userData']['computed']['variant_accessories'] = this[
                  'userData']['params']['spec']['variants'][this['userData']['params']['spec']['variant']][
                  'accessories'
                ]) : this['select_variant'](g['spec']['variant']),
                this['userData']['computed']['used_materials'] = {},
                this['userData']['params']['spec']['is_divider'] && (this['userData']['params']['spec']['fill'][
                  'size'] = {
                    'x': 0,
                    'y': 0,
                    'z': 0
                  },
                  'h' == this['userData']['params']['spec']['divider']['orient'] && (this['userData']['params']['spec'][
                    'fill'
                  ]['size']['y'] = 1),
                  'v' == this['userData']['params']['spec']['divider']['orient']) && (this['userData']['params']['spec']
                  ['fill']['size']['x'] = 1),
                this['userData']['interaction']['is_fill'] = 0,
                1 == this['userData']['params']['spec']['is_fill'] && (this['userData']['interaction']['is_fill'] =
                  1),
                Object['keys'](this['userData']['params']['spec']['rest']['size'])['forEach'](p => {
                  this['userData']['params']['spec']['rest']['size'][p] = parseFloat(this['userData']['params'][
                    'spec']['rest']['size'][p]);
                }),
                this['_rebuild_params'](true);
            }
            ['_set_materials']() {
              var f = this['userData']['params'],
                g;
              for (let i = f['spec']['materials']['length']; i--;)
                if (null !== f['spec']['materials'][i] && null != f['spec']['materials'][i] || f['spec']['materials'][
                    'splice'
                  ](i, 1),
                  f['spec']['materials'][i]['custom'] || set_obj['materials'][f['spec']['materials'][i]['key']]) {
                  f['spec']['materials'][i]['group'] || (f['spec']['materials'][i]['group'] = 0);
                  var h = f['spec']['materials'][i]['key'] + '::' + f['spec']['materials'][i]['group'];
                  if (!f['materials'][h]) {
                    if (f['spec']['materials'][i]['custom'])
                      ce(h),
                      f['spec']['materials'][i]['id'] && (f['materials'][h] = copy_object(f['spec']['materials'][i]),
                        f['spec']['materials'][i]['id'] = f['materials'][h]['id'],
                        1 == f['spec']['materials'][i]['default']) && (f['default_material'] = h);
                    else {
                      let j = void 0 !== f['spec']['materials'][i]['variant'] ? f['spec']['materials'][i]['variant'] :
                        set_obj['materials'][f['spec']['materials'][i]['key']]['default'];
                      set_obj['materials'][f['spec']['materials'][i]['key']]['variants'][j] || (j = set_obj['materials']
                          [f['spec']['materials'][i]['key']]['default']),
                        f['materials'][h] = {
                          'key': f['spec']['materials'][i]['key'],
                          'no_delete': void 0 !== f['spec']['materials'][i]['no_delete'] ? f['spec']['materials'][i][
                            'no_delete'
                          ] : 0,
                          'fixed': void 0 !== f['spec']['materials'][i]['fixed'] ? f['spec']['materials'][i][
                            'fixed'] : 0,
                          'default': void 0 !== f['spec']['materials'][i]['default'] ? f['spec']['materials'][i][
                            'default'
                          ] : 0,
                          'label': void 0 !== f['spec']['materials'][i]['label'] ? f['spec']['materials'][i][
                            'label'] : set_obj['materials'][f['spec']['materials'][i]['key']]['name'],
                          'type': (void 0 !== f['spec']['materials'][i]['type'] ? f['spec']['materials'][i] : set_obj[
                            'materials'][f['spec']['materials'][i]['key']])['type'],
                          'id': (void 0 !== f['spec']['materials'][i]['id'] ? f['spec']['materials'][i] : set_obj[
                            'materials'][f['spec']['materials'][i]['key']]['variants'][j])['id'],
                          'size': (void 0 !== f['spec']['materials'][i]['size'] ? f['spec']['materials'][i] : set_obj[
                            'materials'][f['spec']['materials'][i]['key']]['variants'][j])['size'],
                          'order': f['spec']['materials'][i]['order'] ? parseInt(f['spec']['materials'][i]['order']) :
                            i,
                          'group': f['spec']['materials'][i]['group'] || 0,
                          'variant': j
                        },
                        f['spec']['materials'][i]['variant'] = j,
                        0 == f['materials'][h]['id'] && (f['materials'][h]['id'] = set_obj['materials'][f['spec'][
                          'materials'
                        ][i]['key']]['variants'][j]['id']),
                        materials_lib['items'][f['materials'][h]['id']] || (f['materials'][h]['id'] = set_obj[
                          'materials'][f['spec']['materials'][i]['key']]['variants'][j]['id']),
                        1 == f['spec']['materials'][i]['default'] && (f['default_material'] = h);
                    }
                  }
                }
              f['default_material'] || (g = Object['keys'](f['materials']),
                f['materials']['ldsp::0'] ? f['default_material'] = 'ldsp::0' : f['default_material'] = g[0]);
            }
            ['_remove_unused_materials']() {
              if (1 != this['userData']['params']['spec']['no_unused_remove']) {
                Object['keys'](this['userData']['params']['materials'])['forEach'](h => {
                  this['userData']['computed']['used_materials'][h] || 1 == this['userData']['params'][
                    'materials'][h]['no_delete'] || delete this['userData']['params']['materials'][h];
                });
                var f = this['userData']['params']['spec']['materials'];
                for (let h = f.length; h--;) {
                  var g = f[h]['key'] + '::' + f[h]['group'];
                  this['userData']['computed']['used_materials'][g] || f['splice'](h, 1);
                }
              }
            }
            ['_rebuild_params'](f = false) {
              return;
              this['userData']['test'] = this['_get_map_params'](this['params'], f),
                Object['keys'](this['userData']['test'])['forEach'](g => {
                  this['userData']['test'][g]['path'] = g;
                  var g = this['userData']['test'][g];
                  let h = 1;
                  g['condition'] && (h = check_condition(g['condition'], {
                      'computed': this['userData']['computed']['computed'],
                      'variables': this['userData']['computed']['variables']
                    })),
                    g['visible'] = h;
                });
            }
            ['_get_map_params'](g = this['params'], h = false) {
              return;
              var i = {};
              let j = this;
              g['type'] = 'section';
              var g = _['merge'](dp['get']('section'), g);
              return g['pivot']['y'] = 0,
                g['pos']['y'] = 's:y',
                k(g, [0]),
                i;

              function k(q, v) {
                if (h && 'model' == q['type'] && q['spec']['id'] && models3d_lib['items'][q['spec']['id']] && (q[
                    'spec'] = _['merge'](models3d_lib['get_item'](q['spec']['id'])['params'], copy_object(q['spec']))),
                  'link' == q['type'] && catalog_lib && catalog_lib['items'][q['spec']['id']]) {
                  var w = catalog_lib['get_item'](q['spec']['id']),
                    x = (q['children'] = w['params']['children'],
                      j['userData']['params']),
                    y = w['params']['spec']['materials'],
                    z;
                  for (let K = y.length; K--;) {
                    x['materials'][y[K]['key']] || set_obj['materials'][y[K]['key']] && (z = void 0 !== y[K][
                        'variant'] ? y[K]['variant'] : set_obj['materials'][y[K]['key']]['default'],
                      x['materials'][y[K]['key']] = {
                        'key': y[K]['key'],
                        'fixed': void 0 !== y[K]['fixed'] ? y[K]['fixed'] : 0,
                        'label': void 0 !== y[K]['label'] ? y[K]['label'] : set_obj['materials'][y[K]['key']][
                          'name'],
                        'type': (void 0 !== y[K]['type'] ? y[K] : set_obj['materials'][y[K]['key']])['type'],
                        'id': (void 0 !== y[K]['id'] ? y[K] : set_obj['materials'][y[K]['key']]['variants'][z])[
                          'id'],
                        'size': (void 0 !== y[K]['size'] ? y[K] : set_obj['materials'][y[K]['key']]['variants'][z])[
                          'size'],
                        'variant': z
                      },
                      1 == x['is_default'] && (x['materials'][y[K]['key']]['id'] = set_obj['materials'][y[K]['key']]
                        ['variants'][z]['id']),
                      y[K]['id'] = x['materials'][y[K]['key']]['id'],
                      y[K]['variant'] = z);
                  }
                  let J = w['params']['variables'];
                  Object['keys'](J)['forEach'](L => {
                    j['userData']['computed']['variables'][L] || (j['userData']['computed']['variables'][L] = J[L]);
                  });
                }
                var w = v['join'](',');
                i[w] = q;
                let A = j['userData']['size'];
                var w = {},
                  B = (w = {
                      'parent_size': A = 1 != v.length && i[v['join'](',')['slice'](0, -2)] ? i[v['join'](',')[
                        'slice'](0, -2)]['_comp']['size'] : A,
                      'computed': j['userData']['computed']['computed'],
                      'variables': j['userData']['computed']['variables'],
                      'materials': j['userData']['computed']['materials']
                    },
                    q['size'] || (q['size'] = {
                      'x': 's:x',
                      'y': 's:y',
                      'z': 's:z'
                    }),
                    ['x', 'y', 'z']),
                  C, E;
                for (let L = 0; L < B.length; L++) {
                  'string' == typeof q['size'][B[L]] && (-1 < (C = q['size'][B[L]])['indexOf']('m:') && -1 < C[
                    'indexOf']('current') && null != (E = C['match'](/m:(.*).current/))) && (E = E[1],
                    j['userData']['params']['materials'][E] || j['add_material_key'](E));
                }
                if (q['_comp'] = {
                    'size': {
                      'x': comp2(q['size']['x'], w),
                      'y': comp2(q['size']['y'], w),
                      'z': comp2(q['size']['z'], w)
                    }
                  },
                  'locker2' == q['type'] && lockers_lib && lockers_lib['items'][q['spec']['id']]) {
                  var w = Locker['get_locker_model'](q['spec']['id'], A),
                    F = (q['children'] = w['params']['children'],
                      ce(),
                      ce(),
                      ce(),
                      j['userData']['params']),
                    G = w['params']['materials'],
                    H;
                  for (let N = G.length; N--;) {
                    F['materials'][G[N]['key']] || set_obj['materials'][G[N]['key']] && (H = void 0 !== G[N][
                        'variant'] ? G[N]['variant'] : set_obj['materials'][G[N]['key']]['default'],
                      F['materials'][G[N]['key']] = {
                        'key': G[N]['key'],
                        'fixed': void 0 !== G[N]['fixed'] ? G[N]['fixed'] : 0,
                        'label': void 0 !== G[N]['label'] ? G[N]['label'] : set_obj['materials'][G[N]['key']][
                          'name'],
                        'type': (void 0 !== G[N]['type'] ? G[N] : set_obj['materials'][G[N]['key']])['type'],
                        'id': (void 0 !== G[N]['id'] ? G[N] : set_obj['materials'][G[N]['key']]['variants'][H])[
                          'id'],
                        'size': (void 0 !== G[N]['size'] ? G[N] : set_obj['materials'][G[N]['key']]['variants'][H])[
                          'size'],
                        'variant': H
                      },
                      1 == F['is_default'] && (F['materials'][G[N]['key']]['id'] = set_obj['materials'][G[N]['key']]
                        ['variants'][H]['id']),
                      G[N]['id'] = F['materials'][G[N]['key']]['id'],
                      G[N]['variant'] = H);
                  }
                }
                var I = q['children'];
                if (I && I.length) {
                  for (let O = 0; O < I.length; O++)
                    k(I[O], v['concat'](O));
                }
              }
            }
            ['_add_params'](f, g) {
              this['userData']['test'][f] = g;
            }
            ['build'](f = true) {
              'function' == typeof cabinet_events[this['userData']['params']['events']['on_before_build']] &&
                cabinet_events[this['userData']['params']['events']['on_before_build']](this),
                'function' == typeof pp['events']['cabinet']['before_build'] && pp['events']['cabinet']['before_build'](
                  this),
                this['userData']['computed']['used_materials'] = {},
                this['userData']['obj_ids'] = {},
                this['userData']['paths'] = {},
                f && this['userData']['object']['delete'](),
                this['size_box'] && this['remove'](this['size_box']),
                this['size_box'] = new SizeBox({
                  'width': this['userData']['params']['size']['x'] / units,
                  'height': this['userData']['params']['size']['y'] / units,
                  'depth': this['userData']['params']['size']['z'] / units
                }),
                this['size_box']['position']['y'] = this['userData']['params']['size']['y'] / units / 2,
                this['size_box']['visible'] = false,
                this['add'](this['size_box']),
                this['userData']['object'] = new Section({
                  'type': 'section',
                  'name': 'cabinet',
                  'children': this['userData']['params']['children'],
                  'pivot': {
                    'y': 0
                  },
                  'pos': {
                    'y': 's:y'
                  }
                }, {
                  'parent': this,
                  'root': this,
                  'path': '0'
                }),
                this['userData']['sizes_object'] && this['remove'](this['userData']['sizes_object']),
                this['userData']['sizes_object'] = new THREE['Group'](),
                this['userData']['sizes_object']['name'] = 'sizes',
                this['add'](this['userData']['sizes_object']),
                this['userData']['comments_object'] && this['remove'](this['userData']['comments_object']),
                this['userData']['comments_object'] = new THREE['Group'](),
                this['userData']['comments_object']['name'] = 'sizes',
                this['add'](this['userData']['comments_object']),
                this['_reindex'](),
                'function' == typeof cabinet_events[this['userData']['params']['events']['on_after_build']] &&
                cabinet_events[this['userData']['params']['events']['on_after_build']](this),
                'function' == typeof this['after_build'] && this['after_build'](),
                this['add'](this['userData']['object']),
                this['build_sizes'](),
                this['build_comments'](),
                this['set_snap_points'](),
                this['write_points'](),
                this['build_ruler_point']();
              let g = [],
                h = (Object['keys'](this['userData']['parts']['draggable'])['forEach'](i => {
                    var j, k = this['userData']['parts']['draggable'][i]['userData']['parent']['userData'][
                      'drag_area'];
                  }),
                  this);
              0 < g.length && pp['interface']['root']['$emit']('yn_modal_show', {
                'body': 'Существуют\x20элементы,\x20которые\x20располагаются\x20выше\x20выбранной\x20высоты,\x20Удалить?',
                'heading': 'Требуется\x20подтверждение',
                'callback': function() {
                  for (let i = 0; i < g.length; i++)
                    h['remove_by_path'](g[i]['userData']['path2']);
                }
              });
            }
            ['lock_fill'](f) {
              this['userData']['params']['spec']['fill_locked'] = f;
            }
            ['check_fill_enabled']() {
              return true;
            }
            ['get_fill_locked']() {
              return this['userData']['params']['spec']['fill_locked'];
            }
            ['select_variant'](f = 0, g = false) {
              var h = this['userData']['params'];
              let i = h['spec']['variants'][f],
                j = (i || (i = h['spec']['variants'][0],
                    h['spec']['variant'] = 0),
                  h['size'] = i['size'],
                  h['name'] = i['name'],
                  h['code'] = i['code'],
                  0);
              if (this['userData']['computed'] && (j = this['userData']['computed']['size'],
                  this['userData']['computed']['size'] = i['size'],
                  this['userData']['computed']['variant_accessories'] = i['accessories']),
                i['variables']) {
                let k = this;
                this['userData']['computed'] && Object['keys'](i['variables'])['forEach'](function(l) {
                  k['userData']['computed']['variables'][l]['value'] = i['variables'][l]['value'];
                });
              }
              g && (this['adjust_position'](j),
                this['_rebuild_params'](),
                this['build'](true));
            }
            ['set_size'](f) {
              let g = 0;
              this['userData']['params']['size'] = copy_object(f),
                this['userData']['computed'] && (g = copy_object(this['userData']['computed']['size']),
                  this['userData']['computed']['size'] = copy_object(f)),
                this['adjust_position'](g),
                this['_rebuild_params'](),
                this['build'](true);
            }
            ['adjust_position'](f) {
              try {
                this['find_around']();
              } catch (h) {}
              var g = this['get_forward']();
              this['userData']['around']['left'] && (0 != g['x'] && (this['userData']['around']['left']['length'] &&
                  this['userData']['around']['right']['length'] || (this['userData']['around']['left']['length'] ?
                    this['position']['z'] += g['x'] * (parseInt(this['userData']['computed']['size']['x']) - parseInt(
                      f['x'])) / units / 2 : this['position']['z'] -= g['x'] * (parseInt(this['userData'][
                      'computed']['size']['x']) - parseInt(f['x'])) / units / 2),
                  this['position']['x'] += g['x'] * (parseInt(this['userData']['computed']['size']['z']) - parseInt(f[
                    'z'])) / units / 2),
                0 != g['z']) && (this['userData']['around']['left']['length'] && this['userData']['around']['right']
                ['length'] || (this['userData']['around']['left']['length'] ? this['position']['x'] -= g['z'] * (
                  parseInt(this['userData']['computed']['size']['x']) - parseInt(f['x'])) / units / 2 : this[
                  'position']['x'] += g['z'] * (parseInt(this['userData']['computed']['size']['x']) - parseInt(f[
                  'x'])) / units / 2),
                this['position']['z'] += g['z'] * (parseInt(this['userData']['computed']['size']['z']) - parseInt(f[
                  'z'])) / units / 2);
            }
            ['set_size_by_index'](f) {
              this['userData']['params']['spec']['variant'] = f,
                this['select_variant'](f, true);
            }
            ['set_size_by_number'](f, g, h) {
              let i = 0;
              this['userData']['params']['size'] = {
                  'x': f,
                  'y': g,
                  'z': h
                },
                this['userData']['computed'] && (i = copy_object(this['userData']['computed']['size']),
                  this['userData']['computed']['size'] = {
                    'x': f,
                    'y': g,
                    'z': h
                  }),
                this['adjust_position'](i),
                this['_rebuild_params'](),
                this['build']();
            }
            ['get_params']() {
              return copy_object(this['userData']['params']);
            }
            ['get_computed']() {
              return copy_object(this['userData']['computed']);
            }
            ['_reindex']() {
              function f(h) {
                function j(l, m) {
                  var n = l['userData']['children'];
                  if (n.length) {
                    for (let p = 0; p < n.length; p++)
                      j(n[p], m['concat'](p));
                  }
                  var o = l['userData']['path2'];
                  (k[o] = l)['userData']['path'] = o;
                }
                var k = {};
                return j(h, [0]),
                  k;
              }

              function g(h) {
                function j(l, m) {
                  var n = l['children'];
                  if (n && n.length) {
                    for (let p = 0; p < n.length; p++)
                      j(n[p], m['concat'](p));
                  }
                  var o = m['join'](',');
                  k[o] = l;
                }
                var k = {};
                return j(h, [0]),
                  k;
              }
              this['userData']['paths'] = f(this['userData']['object']),
                this['userData']['params_paths'] = g(copy_object(this['userData']['params'])),
                this['get_parts'](),
                this['_set_materials'](),
                this['_remove_unused_materials']();
            }
            ['get_parts']() {
              this['userData']['parts'] = {},
                this['userData']['has_draggable'] = 0,
                Object['keys'](item_types)['forEach'](f => this['userData']['parts'][f] = {}),
                Object['keys'](this['userData']['paths'])['forEach'](f => {
                  var f = this['userData']['paths'][f];
                  f instanceof Draggable && (this['userData']['has_draggable'] = 1),
                    this['userData']['parts'][f['userData']['params']['type']][f['userData']['path']] = f;
                }),
                this['userData']['parts']['has_doors'] = Object['keys'](this['userData']['parts']['door'])['length'],
                this['userData']['parts']['has_lockers'] = Object['keys'](this['userData']['parts']['locker'])[
                'length'],
                this['userData']['parts']['has_facades'] = this['userData']['parts']['has_doors'] + Object['keys'](this[
                  'userData']['parts']['facade'])['length'] + Object['keys'](this['userData']['parts']['locker'])[
                  'length'],
                this['userData']['parts']['has_handles'] = Object['keys'](this['userData']['parts']['handle'])[
                'length'];
            }
            ['remove_by_path'](f, g = true) {
              return !(f.length < 2 || (this['userData']['paths'][f] && ('Draggable' == this['userData']['paths'][
                  f]['userData']['class'] || this['userData']['paths'][f]) && this['userData']['paths'][f]['delete']
                (),
                this['remove_param'](f),
                g && (this['_reindex'](),
                  this['_rebuild_params'](),
                  this['build']()),
                0));
            }
            ['remove_param'](f) {
              if (f.length < 2)
                return false;
              var g = f.split(','),
                f = (g['shift'](),
                  g['pop']());
              let h = this['userData']['params'];
              for (let i = 0; i < g.length; i++)
                h = h['children'][g[i]];
              h['children']['splice'](f, 1);
            }
            ['get_param'](f) {
              if (f.length < 2)
                return false;
            }
            ['change_param'](f, g, h, j = false) {
              this['_reindex']();
              var k = this['userData']['params']['children'],
                m = f['slice'](2)['split'](','),
                q, u, v;
              let w = this['userData']['params'];
              for (let y = 0; y < m.length; y++) {
                if ('locker2' == w['type'])
                  return q = m['slice'](0, y + 1),
                    u = m['slice'](y),
                    w['spec']['override'] || (w['spec']['override'] = {}),
                    v = {},
                    utils['nested_object']['set'](v, g, h),
                    w['spec']['override'][u['join'](',')['trim'](',')] = v,
                    this['userData']['params_paths'][q['join'](',')['trim'](',')]['spec']['override'] || (this[
                      'userData']['params_paths'][q['join'](',')['trim'](',')]['spec']['override'] = {}),
                    void(this['userData']['params_paths'][q['join'](',')['trim'](',')]['spec']['override'][u['join'](
                      ',')['trim'](',')] = v);
                w = w['children'][m[y]];
              }
              utils['nested_object']['set'](w, g, h);
              var x = this['userData']['params_paths'][f],
                f = (utils['nested_object']['set'](x, g, h),
                  this['userData']['paths'][f]);
              f && utils['nested_object']['set'](f['userData']['params'], g, h),
                this['_rebuild_params'](),
                j && f && (f['build_params'](copy_object(x)),
                  f['build'](true),
                  this['_reindex']());
            }
            ['set_deleted_material'](f) {
              var g = this['userData']['params']['children'],
                h = f['slice'](2)['split'](',');
              let i = this['userData']['params'];
              for (let j = 0; j < h.length; j++)
                i = i['children'][h[j]];
              utils['nested_object']['set'](i, 'material', {
                'key': '__no_mat',
                'variant': 'current',
                'id': 0,
                'rotated': 0,
                'fixed': 0
              });
            }
            ['remove_draggable'](f) {
              this['remove_by_path'](f['userData']['path'], false),
                this['show_draggables'](),
                'function' == typeof cabinet_events[this['userData']['params']['events']['on_drag_delete']] &&
                cabinet_events[this['userData']['params']['events']['on_drag_delete']](this, f),
                sc['get_price']();
            }
            ['add_drag_child_2'](f, g, h, j = false, k = false) {
              let m = 0;
              var q, u;
              if ('function' == typeof cabinet_events[this['userData']['params']['events']['on_before_drag']] && !
                cabinet_events[this['userData']['params']['events']['on_before_drag']](this, {
                  'id': f,
                  'section': g,
                  'params': h,
                  'position': j
                }))
                return;
              let v = dp['get']('draggable');
              for (let z = 0; z < h['children']['length']; z++)
                v['children']['push'](h['children'][z]);
              h['spec']['variants'][0]['accessories'] && (v['spec']['accessories'] = h['spec']['variants'][0][
                  'accessories'
                ]),
                h['variables'] && (v['variables'] || (v['variables'] = {}),
                  Object['keys'](h['variables'])['forEach'](A => {
                    v['variables'][A] = h['variables'][A];
                  }));
              for (let A = h['spec']['materials']['length']; A--;) {
                1 == h['spec']['materials'][A]['custom'] ? this['add_custom_material_key'](h['spec']['materials'][
                  A]) : (this['add_material_key_w_label']({
                      'group': h['spec']['materials'][A]['group'],
                      'id': h['spec']['materials'][A]['id'],
                      'fixed': h['spec']['materials'][A]['fixed'],
                      'key': h['spec']['materials'][A]['key'],
                      'label': h['spec']['materials'][A]['label']
                    }),
                    0 == h['spec']['materials'][A]['id'] && (u = h['spec']['materials'][A]['key'] + '::' + h['spec'][
                        'materials'
                      ][A]['group'],
                      this['userData']['computed']['materials'][u]) && (h['spec']['materials'][A]['id'] = this[
                      'userData']['computed']['materials'][u]['id']));
              }
              let w = h['variables'],
                x = (Object['keys'](w)['forEach'](B => {
                    1 != w[B]['local'] && this['add_variable'](w[B]);
                  }),
                  v['pivot']['x'] = 0,
                  v['pivot']['y'] = 0,
                  v['name'] = h['name'],
                  v['spec']['name'] = h['spec']['name'],
                  v['spec']['id'] = h['id'],
                  h['spec']['fill'] || (h['spec']['fill'] = {}),
                  h['spec']['fill']['size'] || (h['spec']['fill']['size'] = {
                    'x': 0,
                    'y': 0,
                    'z': 0
                  }),
                  v['spec']['is_fill'] = true,
                  v['spec']['fill'] = {},
                  v['spec']['fill']['size'] = h['spec']['fill']['size'],
                  j && (1 == h['spec']['fill']['size']['y'] ? v['size']['y'] = parseInt(h['size']['y']) : g[
                      'userData']['size']['y'] - k['y'] == 0 ? v['size']['y'] = 's:y' : v['size']['y'] = k['y'],
                    1 == h['spec']['fill']['size']['x'] ? v['size']['x'] = parseInt(h['size']['x']) : g['userData'][
                      'size'
                    ]['x'] - k['x'] == 0 ? v['size']['x'] = 's:x' : v['size']['x'] = k['x'],
                    1 == h['spec']['fill']['size']['z'] ? v['size']['z'] = parseInt(h['size']['z']) : v['size']['z'] =
                    's:z'),
                  h['spec']['fill'] && h['spec']['fill']['size'] && (1 == h['spec']['fill']['size']['x'] && 1 == h[
                    'spec']['fill']['size']['y'] && 1 == h['spec']['fill']['size']['z'] ? (v['pos']['x'] = j['x'],
                    v['pos']['y'] = j['y'] + h['size']['y'] / 2) : (h['spec']['fill']['size']['x'],
                    v['pos']['x'] = j['x'],
                    0 == h['spec']['fill']['size']['y'] ? v['pos']['y'] = j['y'] : v['pos']['y'] = j['y'] + h[
                      'size']['y'] / 2)),
                  null);
              if (m = !g['userData']['params']['spec']['drag_items'] || !g['userData']['params']['spec']['drag_items'][
                  'length'
                ] || g['userData']['params']['spec']['drag_items']['includes'](f) ? 1 : m) {
                if (1 == to_int(g['userData']['params']['spec']['drag_single'])) {
                  var y = this['userData']['paths'][g['userData']['path']];
                  for (let B = y['userData']['children']['length']; B--;)
                    y['userData']['children'][B] instanceof Draggable && this['remove_by_path_2'](y['userData'][
                      'children'
                    ][B]);
                }
                'function' == typeof pp['events']['cabinet']['before_add_drag_child'] && pp['events']['cabinet'][
                    'before_add_drag_child'
                  ](v),
                  x = g['userData']['path'] + ',' + g['userData']['children']['length'],
                  this['add_child_by_path_2'](g['userData']['path'], v),
                  'function' == typeof cabinet_events[this['userData']['params']['events']['on_after_drag']] &&
                  cabinet_events[this['userData']['params']['events']['on_after_drag']](this, g, h);
              }
              return sc['get_price'](),
                x;
            }
            ['add_child_by_path_2'](f, g, h = false) {
              this['add_child_by_path_nb_2'](f, g, h);
            }
            ['add_child_by_path_nb_2'](f, g, h = false) {
              g = _['merge'](dp['get'](g['type']), copy_object(g));
              let j = this['userData']['params'],
                k = this['userData']['object'];
              if (0 != f) {
                var l = f['slice'](2)['split'](',');
                for (let n = 0; n < l.length; n++) {
                  if ('locker2' == j['type'])
                    return;
                  j = j['children'][l[n]],
                    k = k['userData']['children'][l[n]] || k['userData']['children'][0];
                }
              }
              var f, m;
              'locker2' == g['type'] && delete g['children'],
                'link' == g['type'] && delete g['children'],
                false === h ? (j['children']['push'](g),
                  f = k['userData']['params']['children']['push'](g),
                  m = k['add_child'](g, f - 1)) : j['children']['splice'](h, 0, g);
            }
            ['remove_draggable_2'](f) {
              this['remove_by_path_2'](f, false),
                'function' == typeof cabinet_events[this['userData']['params']['events']['on_drag_delete']] &&
                cabinet_events[this['userData']['params']['events']['on_drag_delete']](this, f),
                sc['get_price']();
            }
            ['remove_by_path_2'](f, g = true) {
              var h = f['userData']['path2'];
              if (h.length < 2)
                return false;
              let j = this['userData']['params'],
                k = this['userData']['object'];
              var l = copy_object(h)['slice'](2)['split'](','),
                m = l['pop']();
              if (0 != h)
                for (let n = 0; n < l.length; n++) {
                  if ('locker2' == j['type'])
                    return;
                  j = j['children'][l[n]],
                    k = k['userData']['children'][l[n]] || k['userData']['children'][0];
                }
              return 'draggable' == f['userData']['params']['type'] && this['userData']['parts'][f['userData']['params']
                  ['type']
                ][h] && delete this['userData']['parts'][f['userData']['params']['type']][h],
                k['remove_child_by_index'](m),
                this['remove_param'](h),
                g && (this['_reindex'](),
                  this['_rebuild_params'](),
                  this['build']()),
                true;
            }
            ['build_by_path'](f) {
              var g = this['userData']['params_paths'][f],
                f = this['userData']['paths'][f];
              f && (f['build_params'](copy_object(g)),
                f['build']());
            }
            ['get_child_by_path'](f) {
              return {
                'params': copy_object(this['userData']['params_paths'][f]),
                'obj': this['userData']['paths'][f]
              };
            }
            ['_get_any_child_by_instance'](f, g) {
              let h = null;
              return f instanceof g ? f : (f['userData']['children'] && f['userData']['children']['length'] && f[
                  'userData']['children']['some'](i => h = this['_get_any_child_by_instance'](i, g)),
                h);
            }
            ['apply_changes']() {
              this['_rebuild_params'](),
                this['build'](),
                this['_reindex']();
            }
            ['add_child_by_path'](f, g, h = false) {
              this['add_child_by_path_nb'](f, g, h),
                this['apply_changes']();
            }
            ['add_child_by_path_nb'](f, g, h = false) {
              g = _['merge'](dp['get'](g['type']), copy_object(g));
              let i = this['userData']['params'];
              if (0 != f) {
                var j = f['slice'](2)['split'](',');
                for (let k = 0; k < j.length; k++) {
                  if ('locker2' == i['type'])
                    return;
                  i = i['children'][j[k]];
                }
              }
              'locker2' == g['type'] && delete g['children'],
                'link' == g['type'] && delete g['children'],
                false === h ? i['children']['push'](g) : i['children']['splice'](h, 0, g);
            }
            ['copy_child_by_path'](f, g = false) {
              var h = f.split(','),
                h = (h['pop'](),
                  h['join']()),
                f = copy_object(this['userData']['params_paths'][f]);
              return f['name'] += '(Копия)',
                this['add_child_by_path'](h, f, g),
                copy_object(f);
            }
            ['set_own_material'](f, g, h) {
              this['userData']['params']['path_params'][f] || (this['userData']['params']['path_params'][f] = {}),
                utils['nested_object']['set'](this['userData']['params']['path_params'][f], g, h);
            }
            ['change_single_facade_material'](f, g, h) {
              var g = g['parent']['parent'];
              g['change_facade_material']('gen', f, true),
                this['set_own_material'](g['userData']['path2'], 'materials.gen', f);
            }
            ['change_opens']() {
              var f = Object['keys'](this['userData']['parts']['door']);
              f.length && f.forEach(g => {
                ce(this['userData']['parts']['door'][g]['userData']['params']['spec']['type']),
                  'ltr' == this['userData']['parts']['door'][g]['userData']['params']['spec']['type'] ? (this[
                      'userData']['parts']['door'][g]['userData']['params']['spec']['type'] = 'rtl',
                    this['change_param'](this['userData']['parts']['door'][g]['userData']['path2'], 'spec.type',
                      'rtl', false),
                    this['userData']['parts']['door'][g]['build']()) : 'rtl' == this['userData']['parts']['door'][g]
                  ['userData']['params']['spec']['type'] && (this['userData']['parts']['door'][g]['userData'][
                      'params'
                    ]['spec']['type'] = 'ltr',
                    this['change_param'](this['userData']['parts']['door'][g]['userData']['path2'], 'spec.type',
                      'ltr', false),
                    this['userData']['parts']['door'][g]['build']());
              });
            }
            ['show_radial_menu'](f, g) {
              let h = false;
              var i = Object['keys'](this['userData']['parts']['door']);
              i.length && i.forEach(j => {
                  'ltr' != this['userData']['parts']['door'][j]['userData']['params']['spec']['type'] && 'rtl' !=
                    this['userData']['parts']['door'][j]['userData']['params']['spec']['type'] || (h = true);
                }),
                pp['interface']['root'] && pp['interface']['root']['radial']({
                  'obj_type': this['type'],
                  'obj': {
                    'open_type': h,
                    'open_doors': true,
                    'erase': this['userData']['has_draggable']
                  },
                  'left': f,
                  'top': g
                });
            }
            ['open_all']() {
              Object['keys'](this['userData']['parts']['door'])['forEach'](f => {
                this['userData']['parts']['door'][f]['userData']['own_object']['children'][0]['click']();
              });
              let e = 0;
              Object['keys'](this['userData']['parts']['slider'])['forEach'](f => {
                  setTimeout(() => {
                      this['userData']['parts']['slider'][f]['animate']();
                    }, e),
                    e += 100;
                }),
                Object['keys'](this['userData']['parts']['rotator'])['forEach'](f => {
                  setTimeout(() => {
                      this['userData']['parts']['rotator'][f]['animate']();
                    }, e),
                    e += 100;
                });
            }
            ['add_variable'](f, g = false) {
              this['userData']['computed']['variables'][f['key']] || (this['userData']['computed']['variables'][f[
                  'key']] = f),
                g && !this['userData']['params']['variables'][f['key']] && (this['userData']['params']['variables'][f[
                  'key']] = f);
            }
            ['add_material_key'](f, g, h = 0, j = 0) {
              var k = f + '::' + (g = g || 0),
                l = this['userData']['params'];
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
                'function' == typeof pp['events']['cabinet']['after_add_material_key'] && pp['events']['cabinet'][
                  'after_add_material_key'
                ](this, f, g, h, j);
            }
            ['add_material_key_w_label'](f = {
              'group': 0,
              'id': 0,
              'fixed': 0,
              'key': null,
              'label': null,
              'order': null
            }) {
              var g = f['group'],
                h = f['key'];
              let j = f['id'];
              var k = f['fixed'];
              let m = f['label'],
                n = f['order'];
              var o = this['userData']['params'],
                q = (j = j || set_obj['materials'][h]['variants'][set_obj['materials'][h]['default']]['id'],
                  m = m || set_obj['materials'][h]['name'],
                  n = n || o['spec']['materials']['length'],
                  h + '::' + g);
              o['materials'][q] || (o['spec']['materials']['push']({
                    'key': h,
                    'group': g,
                    'fixed': k,
                    'label': m,
                    'order': n,
                    'variant': set_obj['materials'][h]['default'],
                    'id': j
                  }),
                  o['materials'][q] = {
                    'key': h,
                    'group': g,
                    'fixed': k,
                    'label': m,
                    'order': n,
                    'type': set_obj['materials'][h]['type'],
                    'id': j,
                    'size': set_obj['materials'][h]['variants'][set_obj['materials'][h]['default']]['size'],
                    'variant': set_obj['materials'][h]['default']
                  }),
                'function' == typeof pp['events']['cabinet']['after_add_material_key_w_label'] && pp['events'][
                  'cabinet']['after_add_material_key_w_label'](this, f);
            }
            ['add_custom_material_key'](f) {
              f['group'] || (f['group'] = 0);
              var g, h = this['userData']['params'],
                f;
              h['materials']['_' + f['key'] + '::' + f['group']] || (f = {
                  'custom': 1,
                  'key': '_' + f['key'],
                  'group': f['group'],
                  'order': void 0 !== f['order'] ? f['order'] : h['spec']['materials']['length'],
                  'categories': f['categories'],
                  'fixed': f['fixed'],
                  'label': f['name'],
                  'name': f['name'],
                  'id': f['selected']
                },
                h['spec']['materials']['push'](f));
            }
            ['get_facades_by_position']() {
              let e = this,
                f = [];
              return Object['keys'](this['userData']['parts']['door'])['forEach'](h => {
                  f.push(g(this['userData']['parts']['door'][h], 'd', h));
                }),
                Object['keys'](this['userData']['parts']['locker'])['forEach'](h => {
                  f.push(g(this['userData']['parts']['locker'][h], 'l', h));
                }),
                f['sort'](function(h, i) {
                  return i['pos'] - h['pos'];
                }),
                copy_object(f);

              function g(h, i, j) {
                let k;
                return 'd' == i && (k = h['userData']['own_object']['children'][0]),
                  (k = 'l' == i ? h['userData']['own_object']['children'][0] || h['userData']['object']['children'][
                    0
                  ] : k)['params'] ? {
                    'type': i,
                    'path': j,
                    'pos': k['getWorldPosition'](new THREE['Vector3']())['y'],
                    'params': {
                      'params_locked': k['params']['params_locked'],
                      'type': k['params']['type'],
                      'group': k['params']['group'],
                      'facade': k['params']['facade'],
                      'style': k['params']['style'],
                      'material': k['params']['material'],
                      'additional_materials': k['params']['additional_materials'],
                      'glass_material': k['params']['glass_material'],
                      'handle_active': k['params']['handle_active'],
                      'handle_orientation': k['params']['handle_orientation'],
                      'handle_position': k['params']['handle_position'],
                      'no_handle_forced': k['params']['no_handle_forced'],
                      'width': Math['ceil'](k['params']['width']),
                      'height': Math['ceil'](k['params']['height']),
                      'thickness': k['params']['thickness'],
                      'radius': k['params']['radius']
                    }
                  } : (k['userData']['parent']['userData']['params']['spec'] && 0 == k['userData']['parent'][
                      'userData'
                    ]['params']['spec']['id'] && (k = e['_get_any_child_by_instance'](k, Facade)),
                    ce(),
                    ce(),
                    ce(), {
                      'type': i,
                      'path': j,
                      'pos': k['getWorldPosition'](new THREE['Vector3']())['y'],
                      'params': {
                        'params_locked': false,
                        'type': 'l_old',
                        'group': k['userData']['params']['spec']['group'],
                        'facade': k['userData']['params']['spec']['id'],
                        'style': k['userData']['params']['spec']['style'],
                        'material': k['userData']['params']['spec']['materials']['gen'],
                        'additional_materials': {},
                        'glass_material': 0,
                        'handle_active': false,
                        'handle_orientation': '',
                        'handle_position': '',
                        'no_handle_forced': false,
                        'width': Math['ceil'](k['userData']['computed']['size']['x']),
                        'height': Math['ceil'](k['userData']['computed']['size']['y']),
                        'thickness': Math['ceil'](k['userData']['computed']['size']['z']),
                        'radius': false
                      }
                    });
              }
            }
            ['get_variables']() {
              let e = [];
              return Object['keys'](this['userData']['computed']['variables'])['forEach'](f => {
                  1 == this['userData']['computed']['variables'][f]['editable'] && e.push(this['userData'][
                    'computed'
                  ]['variables'][f]);
                }),
                copy_object(e);
            }
            ['get_materials']() {
              this['_reindex']();
              var f = {};
              let g = [];
              return Object['keys'](this['params']['materials'])['forEach'](h => {
                  g.push(this['params']['materials'][h]);
                }),
                g['sort'](function(h, i) {
                  return parseInt(h['order']) - parseInt(i['order']);
                }), {
                  'cabinet': copy_object(g),
                  'models': f
                };
            }
            ['get_children_params_by_param'](e, f) {
              let g = [];
              return Object['keys'](this['userData']['params_paths'])['forEach'](h => {
                  var j = this['userData']['params_paths'][h],
                    k = utils['nested_object']['get'](j, e);
                  k && -1 < k['indexOf'](f) && g.push({
                    'path': h,
                    'obj': j
                  });
                }),
                g;
            }
            ['get_children_by_param'](e, f) {
              let g = [];
              return Object['keys'](this['userData']['params_paths'])['forEach'](h => {
                  var i = this['userData']['params_paths'][h],
                    i = utils['nested_object']['get'](i, e);
                  i && -1 < i['indexOf'](f) && this['userData']['paths'][h] && g.push(this['userData']['paths'][
                    h]);
                }),
                g;
            }
            ['get_children_by_tag'](e) {
              let f = [];
              return Object['keys'](this['userData']['paths'])['forEach'](g => {
                  0 != g && this['userData']['paths'][g]['userData']['computed']['tags'] && this['userData'][
                    'paths'][g]['userData']['computed']['tags'][e] && f.push(this['userData']['paths'][g]);
                }),
                f;
            }
            ['change_variable'](f, g, h = true) {
              this['userData']['params']['variables'][f] || (this['userData']['params']['variables'][f] = copy_object(
                  this['userData']['computed']['variables'][f])),
                this['userData']['params']['variables'][f]['value'] = g,
                this['userData']['computed']['variables'][f]['value'] = g,
                'function' == typeof cabinet_events[this['userData']['params']['events']['on_change_variable']] &&
                cabinet_events[this['userData']['params']['events']['on_change_variable']](this, f, g),
                h && (this['_rebuild_params'](),
                  this['build'](true),
                  this['_set_materials'](),
                  pp['interface']['root']) && pp['interface']['root']['set_selected'](active_el),
                sc['get_price']();
            }
            ['change_variables'](f, g = true) {
              for (let h = 0; h < f.length; h++)
                this['change_variable'](f[h]['key'], f[h]['value'], false);
              g && (this['_rebuild_params'](),
                  this['build'](true),
                  this['_set_materials'](),
                  pp['interface']['root']) && pp['interface']['root']['set_selected'](active_el),
                sc['get_price']();
            }
            ['change_local_variable_by_path'](f, g, h) {
              this['userData']['params']['children'];
              var i = f['slice'](2)['split'](',');
              let j = this['userData']['params'];
              for (let k = 0; k < i.length; k++)
                j = j['children'][i[k]];
              j['spec']['variables'] || (j['spec']['variables'] = {}),
                j['spec']['variables'][g] = h,
                this['userData']['params_paths'][f]['spec']['variables'] || (this['userData']['params_paths'][f]['spec']
                  ['variables'] = {}),
                this['userData']['params_paths'][f]['spec']['variables'][g] = h;
            }
            ['change_local_material_by_path'](f, g, h, j) {
              var k = f['slice'](2)['split'](',');
              let l = this['userData']['params'];
              for (let m = 0; m < k.length; m++)
                l = l['children'] && l['children'][k[m]] ? l['children'][k[m]] : null;
              l && (l['spec']['materials'] || (l['spec']['materials'] = {}),
                l['spec']['materials'][g + '::' + h] = j,
                this['userData']['params_paths'][f]['spec']['materials'] || (this['userData']['params_paths'][f][
                  'spec'
                ]['materials'] = {}),
                this['userData']['params_paths'][f]['spec']['materials'][g + '::' + h] = j);
            }
            ['change_child_position'](f, g, h) {
              if ('inside' == h) {
                let l = this['userData']['params'];
                for (let o = 0; o < f.length; o++)
                  l = l['children'][f[o]];
                var j = f['pop']();
                let m = this['userData']['params'];
                for (let q = 0; q < f.length; q++)
                  m = m['children'][f[q]];
                let n = this['userData']['params'];
                for (let u = 0; u < g.length; u++)
                  n = n['children'][g[u]];
                f.length > g.length ? (m['children']['splice'](j, 1),
                  n['children']['unshift'](l)) : (n['children']['unshift'](l),
                  m['children']['splice'](j, 1));
              } else {
                var j = f['pop']();
                let v = g['pop']();
                if (JSON['stringify'](f) == JSON['stringify'](g)) {
                  let w = this['userData']['params'];
                  for (let y = 0; y < f.length; y++)
                    w = w['children'][f[y]];

                  function x(z, A, B) {
                    if (B >= z.length) {
                      for (var C = B - z.length + 1; C--;)
                        z.push(void 0);
                    }
                    z['splice'](B, 0, z['splice'](A, 1)[0]);
                  }
                  x(w['children'], j, v);
                } else {
                  let z = this['userData']['params'];
                  for (let B = 0; B < f.length; B++)
                    z = z['children'][f[B]];
                  var k = z['children'][j];
                  let A = this['userData']['params'];
                  for (let C = 0; C < g.length; C++)
                    A = A['children'][g[C]];
                  'after' == h && A['children']['splice'](v + 1, 0, k),
                    'before' == h && (0 < v && --v,
                      A['children']['splice'](v, 0, k)),
                    z['children']['splice'](j, 1);
                }
              }
              this['_rebuild_params'](),
                this['build'](true);
            }
            ['change_facades'](f) {
              this['userData']['params']['spec']['facades']['model'] = f;
              let g = this['userData']['params']['spec']['facades']['materials'];
              var h = materials_lib['get_top_category_by_material'](g['gen']);
              let j = 0,
                k = facades_lib['items'][f];
              for (let l = 0; l < k['materials']['length']; l++)
                h['id'] == k['materials'][l] && (j = 1);
              0 === j && (g['gen'] = materials_lib['get_first_item'](k['materials'][0])['id']),
                Object['keys'](g)['forEach'](function(m) {
                  'gen' == m || k['additional_materials'][m] || delete g[m];
                }),
                k['additional_materials'] && Object['keys'](k['additional_materials'])['forEach'](function(m) {
                  g[m] || (g[m] = copy_object(k['additional_materials'][m]['selected']));
                }),
                'function' == typeof cabinet_events[this['userData']['params']['events']['on_change_facade']] &&
                cabinet_events[this['userData']['params']['events']['on_change_facade']](this, f),
                Object['keys'](this['userData']['parts']['facade'])['forEach'](m => {
                  this['userData']['params']['spec']['facades']['items'][m]['id'] = f,
                    this['userData']['params']['spec']['facades']['items'][m]['materials'] = g,
                    this['userData']['parts']['facade'][m]['rebuild'](this['userData']['parts']['facade'][m][
                      'userData'
                    ]['params']);
                }),
                Object['keys'](this['userData']['parts']['door'])['forEach'](m => {
                  this['userData']['params_paths'][m]['spec']['params_locked'] || (this['userData']['params_paths'][m]
                    ['spec']['material'] = g['gen'],
                    this['userData']['parts']['door'][m]['build']());
                }),
                Object['keys'](this['userData']['parts']['locker'])['forEach'](m => {
                  this['userData']['params_paths'][m]['spec']['params_locked'] || (this['userData']['params_paths'][m]
                    ['spec']['material'] = g['gen'],
                    this['userData']['parts']['locker'][m]['build_params'](this['userData']['params_paths'][m]),
                    this['userData']['parts']['locker'][m]['build']());
                });
            }
            ['change_facades_material'](f, g, h, i) {
              Object['keys'](this['userData']['parts']['door'])['forEach'](j => {
                  this['userData']['parts']['door'][j]['change_facade_material'](g, h);
                }),
                Object['keys'](this['userData']['parts']['locker'])['forEach'](j => {
                  this['userData']['parts']['locker'][j]['change_facade_material'](g, h);
                }),
                Object['keys'](this['userData']['parts']['locker2'])['forEach'](j => {
                  this['userData']['parts']['locker2'][j]['change_facade_material'](g, h);
                }),
                Object['keys'](this['userData']['parts']['facade'])['forEach'](j => {
                  this['userData']['parts']['facade'][j]['change_facade_material'](g, h);
                }),
                this['userData']['params']['spec']['facades']['materials'][g] = h,
                'function' == typeof cabinet_events[this['userData']['params']['events'][
                'on_change_facade_material']] && cabinet_events[this['userData']['params']['events'][
                  'on_change_facade_material'
                ]](this, f, g, h);
            }
            ['change_facades_style'](e) {
              Object['keys'](this['userData']['parts']['door'])['forEach'](f => {
                  this['userData']['params_paths'][f]['spec']['params_locked'] || (this['userData']['params_paths'][f]
                    ['spec']['style'] = e,
                    this['userData']['parts']['door'][f]['set_facade_style'](e));
                }),
                Object['keys'](this['userData']['parts']['locker'])['forEach'](f => {
                  this['userData']['params_paths'][f]['spec']['params_locked'] || (this['userData']['params_paths'][f]
                    ['spec']['style'] = e,
                    this['userData']['parts']['locker'][f]['set_facade_style'](e));
                });
            }
            ['change_facade_single'](f, g) {
              var h = {};
              let j = this['get_child_by_path'](g),
                k = (j['params']['spec']['facade'] = f,
                  j['obj']['userData']['params']['spec']['facade'] = f,
                  facades_lib['items'][f]);
              j['obj']['userData']['params']['spec']['material'] || (j['obj']['userData']['params']['spec'][
                  'material'] = j['obj']['userData']['mesh']['params']['material']),
                j['obj']['userData']['params']['spec']['additional_materials'] || (j['obj']['userData']['params'][
                  'spec']['additional_materials'] = j['obj']['userData']['mesh']['params']['additional_materials']),
                j['params']['spec']['additional_materials'] || (j['params']['spec']['additional_materials'] = j['obj'][
                  'userData'
                ]['mesh']['params']['additional_materials']),
                Array.isArray(j['obj']['userData']['params']['spec']['material']) && (j['obj']['userData']['params'][
                  'spec'
                ]['material'] = j['obj']['userData']['params']['spec']['material'][0]);
              var l = materials_lib['get_top_category_by_material'](j['obj']['userData']['params']['spec']['material']);
              let m = 0;
              for (let n = 0; n < k['materials']['length']; n++)
                l['id'] == k['materials'][n] && (m = 1);
              0 === m && (j['params']['spec']['material'] = materials_lib['get_first_item'](k['materials'][0])[
                  'id'],
                  j['obj']['userData']['params']['spec']['material'] = materials_lib['get_first_item'](k['materials'][
                    0
                  ])['id']),
                Object['keys'](j['params']['spec']['additional_materials'])['forEach'](function(o) {
                  j['params']['spec']['additional_materials'][o] && (delete j['params']['spec'][
                      'additional_materials'][o],
                    delete j['obj']['userData']['params']['spec']['additional_materials'][o]);
                }),
                k['additional_materials'] && Object['keys'](k['additional_materials'])['forEach'](function(o) {
                  j['params']['spec']['additional_materials'][o] || (j['params']['spec']['additional_materials'][o] =
                    parseInt(copy_object(k['additional_materials'][o]['selected'])),
                    j['obj']['userData']['params']['spec']['additional_materials'][o] = parseInt(copy_object(k[
                      'additional_materials'][o]['selected'])));
                }),
                j['obj']['build']();
              var f = this['userData']['params_paths'][g];
              return f['spec']['facade'] = j['params']['spec']['facade'],
                f['spec']['material'] = j['params']['spec']['material'],
                f['spec']['additional_materials'] = j['params']['spec']['additional_materials'],
                h['material'] = j['params']['spec']['material'],
                h['additional_materials'] = j['params']['spec']['additional_materials'],
                h;
            }
            ['change_facade_material_single'](f, g) {
              f['key'] || (f['key'] = 'gen'),
                f['id'] || (f['id'] = 0);
              var h = f['key'],
                i = f['id'],
                j = this['get_child_by_path'](g);
              this['userData']['params_paths'][g]['spec']['material'] = f['id'],
                j['obj']['change_facade_material'](h, i);
            }
            ['change_facade_type_single'](f, g, h) {
              var i = this['get_child_by_path'](h),
                j;
              this['userData']['params_paths'][h]['spec']['style'] = f,
                'd' == g && (i['params']['spec']['style'] = f,
                  i['obj']['userData']['params']['spec']['style'] = [f, f]),
                'l' == g && (i['params']['spec']['style'] = f,
                  i['obj']['userData']['params']['spec']['style'] = f),
                i['obj']['build']();
            }
            ['change_material'](f, g, h) {
              var i = this['userData']['params']['spec']['materials'];
              for (let j = i.length; j--;)
                if (i[j]['key'] == f && i[j]['group'] == g) {
                  i[j]['id'] = h;
                  break;
                }
              0 == h && (h = set_obj['materials'][f]['variants'][set_obj['materials'][f]['default']]['id']),
                this['userData']['params']['materials'][f + '::' + g]['id'] = h,
                this['userData']['object']['change_material'](f, g, h),
                this['get_price']();
            }
            ['change_material_by_path'](f, g, h) {
              this['userData']['paths'][f]['change_material'](g, h),
                this['_reindex']();
            }
            ['change_corpus_material'](f) {
              this['change_material']('ldsp', 0, f);
            }
            ['change_tabletop_material'](f) {
              this['change_material']('__tabletop', 0, f);
            }
            ['gp']() {
              return copy_object(this['userData']['params']);
            }
            ['change_handle'](e, f) {
              this['userData']['params']['spec']['handles']['id'] = e,
                this['userData']['params']['spec']['handles']['size'] = f,
                this['userData']['params']['spec']['handles']['items'] = [],
                Object['keys'](this['userData']['parts']['handle'])['forEach'](g => {
                  this['userData']['parts']['handle'][g]['change_model'](e, f);
                }),
                'function' == typeof cabinet_events[this['userData']['params']['events']['on_after_handle_change']] &&
                cabinet_events[this['userData']['params']['events']['on_after_handle_change']](this, e, f),
                this['get_price']();
            }
            ['build_sizes']() {
              var f, g, g;
              this['userData']['params']['spec']['is_fill'] || (f = -this['userData']['computed']['size']['z'] / units /
                2 + 0.4,
                (g = new Sizes_obj({
                  'width': this['userData']['computed']['size']['x'] / units,
                  'text': this['userData']['computed']['size']['x'],
                  'font_size': 50
                }))['position']['set'](0, this['userData']['computed']['size']['y'] / units, f),
                this['userData']['sizes_object']['add'](g),
                (g = new Sizes_obj({
                  'width': this['userData']['computed']['size']['y'] / units,
                  'text': this['userData']['computed']['size']['y'],
                  'font_size': 50
                }))['position']['set'](-this['userData']['computed']['size']['x'] / units / 2, this['userData'][
                  'computed'
                ]['size']['y'] / units / 2, f),
                g['rotation']['z'] = Math['PI'] / 2,
                this['userData']['sizes_object']['add'](g),
                this['userData']['sizes_object']['visible'] = global_options['sizes_visible']);
            }
            ['hide_sizes']() {
              this['userData']['sizes_object']['visible'] = false,
                this['from_wall_sizes'] && (this['from_wall_sizes']['visible'] = false);
            }
            ['show_sizes']() {
              this['userData']['sizes_object']['visible'] = true,
                this['from_wall_sizes'] && (this['from_wall_sizes']['visible'] = true);
            }
            ['build_from_wall_sizes'](f) {}
            ['get_specs'](f) {
              let g = copy_object(specs_result),
                h = copy_object(specs_result),
                j = 0,
                k = {},
                l = {};

              function m(o, q, u) {
                let v = 0;
                return v = set_obj['materials'][o] && set_obj['materials'][o]['variants'][q] && set_obj['materials'][o][
                  'variants'
                ][q]['prices'] && set_obj['materials'][o]['variants'][q]['prices'][u] ? parseFloat(set_obj[
                  'materials'][o]['variants'][q]['prices'][u]['price']) : v;
              }

              function n(o, q) {
                let u = 0;
                var q = materials_lib['get_item'](q),
                  q = objectFindByKey(o, 'id', q['category']);
                return q ? (u = (0 != q['get_from_parent'] && null != q['get_from_parent'] ? objectFindByKey(o, 'id',
                    q['parent']) : q)['price'],
                  parseFloat(u)) : u;
              }
              return Object['keys'](this['userData']['parts']['tabletop'])['forEach'](o => {
                  var o = this['userData']['parts']['tabletop'][o]['get_specs']();
                  l[o['id']] || (l[o['id']] = n(prices['tabletop'], o['id'])),
                    o['price_per_piece'] = l[o['id']] * constructor_settings['price_modificator'],
                    o['price'] = o['m2'] * o['price_per_piece'],
                    k[o['id']] ? (k[o['id']]['pm'] += o['pm'],
                      k[o['id']]['m2'] += o['m2']) : k[o['id']] = copy_object(o),
                    g['tabletop']['push'](o);
                }),
                Object['keys'](k)['forEach'](function(o) {
                  k[o]['price'] = k[o]['m2'] * k[o]['price_per_piece'],
                    h['tabletop']['push'](k[o]);
                }),
                Object['keys'](this['userData']['parts']['locker2'])['forEach'](o => {
                  var q = this['userData']['parts']['locker2'][o]['get_specs']();
                  for (let u = 0; u < q.length; u++)
                    g['items']['push'](q[u]);
                }),
                k = {},
                Object['keys'](this['userData']['parts']['model'])['forEach'](o => {
                  var o = this['userData']['parts']['model'][o]['get_specs']();
                  g['items']['push'](o);
                }),
                k = {},
                l = {},
                Object['keys'](this['userData']['parts']['wall'])['forEach'](o => {
                  var o = this['userData']['parts']['wall'][o]['get_specs']();
                  l[o['id']] || (l[o['id']] = m(o['material']['key'], o['material']['key_v'], o['decor'][
                    'category'])),
                    o['price_per_piece'] = l[o['id']],
                    o['price'] = o['val'] * o['price_per_piece'],
                    j += o['price'],
                    k[o['id']] ? k[o['id']]['val'] += o['val'] : k[o['id']] = copy_object(o),
                    g['materials']['push'](o);
                }),
                Object['keys'](k)['forEach'](function(o) {
                  k[o]['m2'] = k[o]['val'],
                    k[o]['price'] = k[o]['val'] * k[o]['price_per_piece'],
                    delete k[o]['size'],
                    delete k[o]['name'],
                    h['materials']['push'](k[o]);
                }),
                k = {},
                l = {},
                Object['keys'](this['userData']['parts']['facade'])['forEach'](o => {
                  var q = this['userData']['parts']['facade'][o]['get_specs'](),
                    q;
                  q['is_fix'] ? g['facades_fixed']['push'](q['data']) : (g['facades'][q['type_key']][q['style']] || (
                      g['facades'][q['type_key']][q['style']] = []),
                    g['facades'][q['type_key']][q['style']]['push'](q['data']),
                    null != (q = this['userData']['parts']['facade'][o]['get_glass_specs']()) && g['glass']['push'](
                      q));
                }),
                Object['keys'](this['userData']['parts']['door'])['forEach'](o => {
                  var q = this['userData']['parts']['door'][o]['get_specs'](),
                    q, q = (q['is_fix'] ? g['facades_fixed']['push'](q['data']) : (g['facades'][q['type_key']][q[
                          'style']] || (g['facades'][q['type_key']][q['style']] = []),
                        g['facades'][q['type_key']][q['style']]['push'](q['data']),
                        null != (q = this['userData']['parts']['door'][o]['get_glass_specs']()) && g['glass']['push'](
                          q)),
                      this['userData']['parts']['door'][o]['get_handles_specs']());
                  q && g['handles']['push'](q);
                }),
                Object['keys'](this['userData']['parts']['handle'])['forEach'](o => {
                  g['handles']['push'](this['userData']['parts']['handle'][o]['get_specs']());
                }),
                this['userData']['specs'] = {
                  'detailed': g,
                  'total': h
                },
                f ? convert_specs(g) : g;
            }
            ['convert_specs']() {}
            ['gps'](f) {}
            ['get_price_specs']() {
              let f = {
                  'corpus': 0,
                  'edge': 0,
                  'cokol': 0,
                  'tabletop': 0,
                  'tabletop_plints': 0,
                  'facades': 0,
                  'facades_edge': 0,
                  'handles': 0,
                  'glass': 0,
                  'back_wall': 0
                },
                g = 0,
                j = this['get_specs'](true),
                k = {};
              if (Object['keys'](j['tabletop'])['length'] && (k['tabletop'] = [],
                  Object['keys'](j['tabletop'])['forEach'](function(G) {
                    let H = get_material_by_id(G);
                    H = H || get_material_by_id(0);
                    var I = objectFindByKey(prices['tabletop'], 'id', H['category']);
                    if (I) {
                      let J;
                      var I = (J = (0 != I['get_from_parent'] && null != I['get_from_parent'] ? objectFindByKey(
                        prices['tabletop'], 'id', I['parent']) : I)['price']) * j['tabletop'][G]['m2'];
                      k['tabletop']['push'](get_desc_arr(j['tabletop'][G], I, J)),
                        f['tabletop'] += I,
                        g += I;
                    }
                  })),
                Object['keys'](j['items'])['length'] && (k['items'] = [],
                  Object['keys'](j['items'])['forEach'](function(G) {
                    var H = j['items'][G]['price'] * j['items'][G]['count'];
                    k['items']['push'](get_desc_item(j['items'][G], H, j['items'][G]['price'])),
                      f['items'] += H,
                      g += H;
                  })),
                this['userData']['specs']['total']['materials']['length']) {
                k['materials'] = [];
                for (let G = 0; G < this['userData']['specs']['total']['materials']['length']; G++) {
                  var q = this['userData']['specs']['total']['materials'][G],
                    v = {};
                  v['name'] = q['material']['name_f'] + '\x20' + q['decor']['name_f'],
                    v['name_only'] = '',
                    v['code'] = '',
                    v['count'] = q['val'],
                    v['units'] = q['type'],
                    v['price'] = g,
                    v['type'] = q['type'],
                    v['price_per_piece'] = q['price_per_piece'],
                    q['name'] = q['material']['name_f'] + '\x20' + q['decor']['name_f'],
                    k['materials']['push'](q),
                    f['materials'] += q['price'],
                    g += q['price'];
                }
              }
              if (Object['keys'](j['facades'])['length'] && (k['facades'] = [],
                  Object['keys'](j['facades'])['forEach'](function(H) {
                    let I = j['facades'][H];
                    Object['keys'](I)['forEach'](function(J) {
                      var K = I[J];
                      Object['keys'](K)['forEach'](function(L) {
                        var N = L.split('_'),
                          O = N[0],
                          N = N[1];
                        let P = facades_lib['items'][O];
                        if ((P = P || objectFindByKey(facades_sets, 'id', facades_sets[facades_sets[
                            'length'] - 1]['id']))['prices']) {
                          var O = materials_lib['get_item'](N),
                            N = O['code'],
                            O = O['category'];
                          let Q = 0,
                            R = 0;
                          P['prices_decor'] && P['prices_decor'][N] && P['prices_decor'][N]['price'][J] && (
                              Q = 1,
                              R = parseFloat(P['prices_decor'][N]['price'][J])),
                            0 == Q && P['prices'][J] && P['prices'][J][O] && (P['prices'][J][O]['price'] ?
                              R = parseFloat(('' + P['prices'][J][O]['price'])['replace'](',', '.')) : 0 !=
                              P['prices'][J][O]['parent'] && 0 == parseFloat(('' + P['prices'][J][O][
                                'price'])['replace'](',', '.')) && (R = parseFloat(('' + P['prices'][J][P[
                                'prices'][J][O]['parent']]['price'])['replace'](',', '.'))));
                          var N = R * j['facades'][H][J][L]['m2'];
                          if (k['facades']['push'](get_desc_facade(j['facades'][H][J][L], N, R)),
                            f['facades'] += N,
                            g += N,
                            P['prices_edge']) {
                            k['facades_edge'] = [];
                            let S = 0;
                            P['prices_edge'][J] && P['prices_edge'][J][O] && (P['prices_edge'][J][O][
                              'price'] ? S = parseFloat(('' + P['prices_edge'][J][O]['price'])['replace'](
                                ',', '.')) : 0 != P['prices_edge'][J][O]['parent'] && 0 == parseFloat((
                                '' + P['prices_edge'][J][O]['price'])['replace'](',', '.')) && P[
                                'prices_edge'][J][P['prices_edge'][J][O]['parent']] && P['prices_edge'][J][
                                P['prices_edge'][J][O]['parent']
                              ]['price'] && (S = parseFloat(('' + P['prices_edge'][J][P['prices_edge'][J][O]
                                ['parent']
                              ]['price'])['replace'](',', '.'))));
                            var N = S * j['facades'][H][J][L]['per'] / 1000;
                            k['facades_edge']['push'](get_desc_arr(j['facades'][H][J][L], N, S)),
                              f['facades_edge'] += N,
                              g += N;
                          }
                        }
                      });
                    });
                  })),
                Object['keys'](j['facades_fixed'])['length'] && (k['facades_fixed'] = [],
                  Object['keys'](j['facades_fixed'])['forEach'](function(H) {
                    var H = j['facades_fixed'][H],
                      I = parseFloat(H['price']),
                      J = I * H['count'],
                      K = (f['facades_fixed'] += J,
                        g += J, {});
                    K['name'] = H['name'],
                      K['code'] = H['code'],
                      K['count'] = H['count'],
                      K['price'] = J,
                      K['price_per_piece'] = I,
                      k['facades_fixed']['push'](K);
                  })),
                Object['keys'](j['handles'])['length'] && (k['handles'] = [],
                  Object['keys'](j['handles'])['forEach'](function(H) {
                    let I = 0;
                    var J, K, L, J, K, L;
                    'common' == j['handles'][H]['type'] && (J = objectFindByKey(handles_catalog['items'], 'id', j[
                          'handles'][H]['id']),
                        K = objectFindByKey(J['sizes'], 'width', j['handles'][H]['width']),
                        I = parseFloat(('' + K['price'])['replace'](',', '.')),
                        -1 < (I = isNaN(I) ? 0 : I)) && (L = I * j['handles'][H]['count'],
                        k['handles']['push'](get_desc_handle({
                          'obj': J,
                          'size': K,
                          'specs': j['handles'][H]
                        }, L, I)),
                        g += L),
                      'facade_profile' != j['handles'][H]['type'] && 'overhead_profile' != j['handles'][H]['type'] ||
                      (K = (J = objectFindByKey(handles_catalog['items'], 'id', j['handles'][H]['id']))['sizes'][0],
                        I = parseFloat(('' + K['price'])['replace'](',', '.')),
                        -1 < (I = isNaN(I) ? 0 : I) && (L = I * j['handles'][H]['count'] * parseInt(j['handles'][
                            H]['width']) / 1000,
                          k['handles']['push'](get_desc_handle({
                            'obj': J,
                            'size': K,
                            'specs': j['handles'][H]
                          }, L, I)),
                          g += L));
                  })),
                k['accessories'] = [],
                this['userData']['computed']['variant_accessories'])
                for (let H = 0; H < this['userData']['computed']['variant_accessories']['length']; H++) {
                  var w = this['userData']['computed']['variant_accessories'][H]['id'],
                    x = this['userData']['computed']['variant_accessories'][H]['count'],
                    y = parseFloat(accsessories_data['items'][w]['price']),
                    z = x * y;
                  accsessories_data['items'][w] && (k['accessories']['push']({
                      'id': w,
                      'name': accsessories_data['items'][w]['code'] + '\x20' + accsessories_data['items'][w][
                        'name'],
                      'category': accsessories_data['items'][w]['category'],
                      'name_only': accsessories_data['items'][w]['name'],
                      'code': accsessories_data['items'][w]['code'],
                      'count': x,
                      'price_per_piece': y,
                      'price': z
                    }),
                    g += z / constructor_settings['price_modificator']);
                }
              var A = this['userData']['object']['get_accessories']();
              if (A)
                for (let I = 0; I < A.length; I++) {
                  var B = A[I]['id'],
                    C = A[I]['count'],
                    D = parseFloat(accsessories_data['items'][B]['price']),
                    E = C * D;
                  accsessories_data['items'][B] && (k['accessories']['push']({
                      'id': B,
                      'name': accsessories_data['items'][B]['code'] + '\x20' + accsessories_data['items'][B][
                        'name'],
                      'category': accsessories_data['items'][B]['category'],
                      'name_only': accsessories_data['items'][B]['name'],
                      'code': accsessories_data['items'][B]['code'],
                      'count': C,
                      'price_per_piece': D,
                      'price': E
                    }),
                    g += E / constructor_settings['price_modificator']);
                }
              var F = {};
              for (let J = 0; J < k['accessories']['length']; J++)
                F[k['accessories'][J]['code']] ? F[k['accessories'][J]['code']]['count'] += k['accessories'][J][
                'count'] : F[k['accessories'][J]['code']] = k['accessories'][J];
              return k['accessories'] = Object['values'](F),
                g *= constructor_settings['price_modificator'],
                this['userData']['params']['price'] = g,
                this['price_description'] = k,
                g;
            }
            ['get_price']() {
              var f = this['userData']['params'],
                f = f['spec']['variants'][f['spec']['variant']],
                f;
              return f['price'] ? (f = parseFloat(f['price']),
                this['userData']['params']['price'] = f) : this['get_price_specs']();
            }
            ['change_facade_style'](f) {
              this['change_facades'](f);
            }
            ['change_facade_material_new'](f, g, h, i) {
              this['change_facades_material'](f, g, h, i);
            }
            ['edges_mode']() {
              this['userData']['object']['edges_mode']();
            }
            ['copypaste']() {
              let f = room['box']['clone']();
              f['expandByScalar'](0.1);
              var g = this['userData']['params'],
                h = parseInt(g['size']['x']),
                j = copy_object(g);
              j['obj_id'] = sc['generate_obj_id']();
              let k = sc['add_object'](g['object_type'], copy_object(j)),
                l = (k['position']['copy'](this['position']),
                  k['rotation']['copy'](this['rotation']),
                  0 === k['rotation']['y'] && (k['position']['x'] += h / units),
                  k['rotation']['y'] === Math['PI'] && (k['position']['x'] -= h / units),
                  k['rotation']['y'] === Math['PI'] / 2 && (k['position']['z'] -= h / units),
                  k['rotation']['y'] === -Math['PI'] / 2 && (k['position']['z'] += h / units),
                  0);
              setTimeout(function() {
                  k['box']['update'](),
                    f['containsBox'](k['box']) || (k['delete'](),
                      l = 1);
                }, 100),
                setTimeout(function() {
                  0 == l && (add_undo_action({
                      'type': 'copy',
                      'object': k
                    }),
                    get_total_price_test());
                }, 200),
                dControls['select_object'](k),
                dControls['clear_selected']();
            }
            ['get_params_paths']() {
              return copy_object(this['userData']['test']);
            }
            ['add_drag_child'](f, g, h, j = false) {
              let k = 0;
              var m;
              if ('function' == typeof cabinet_events[this['userData']['params']['events']['on_before_drag']] && !
                cabinet_events[this['userData']['params']['events']['on_before_drag']](this, {
                  'id': f,
                  'section': g,
                  'params': h,
                  'position': j
                }))
                return;
              let n = dp['get']('draggable');
              for (let u = 0; u < h['children']['length']; u++)
                n['children']['push'](h['children'][u]);
              n['pivot']['x'] = 0,
                h['variables'] && (n['variables'] || (n['variables'] = {}),
                  Object['keys'](h['variables'])['forEach'](v => {
                    n['variables'][v] = h['variables'][v];
                  })),
                n['spec']['id'] = h['id'],
                h['spec']['fill'] || (h['spec']['fill'] = {}),
                h['spec']['fill']['size'] || (h['spec']['fill']['size'] = {
                  'x': 0,
                  'y': 0,
                  'z': 0
                }),
                j && (1 == h['spec']['fill']['size']['y'] && (n['size']['y'] = parseInt(h['size']['y'])),
                  1 == h['spec']['fill']['size']['x'] && (n['size']['x'] = parseInt(h['size']['x'])),
                  1 == h['spec']['fill']['size']['z']) && (n['size']['z'] = parseInt(h['size']['z'])),
                0 != (j = h['spec']['fill'] && h['spec']['fill']['size'] && 0 == h['spec']['fill']['size']['x'] &&
                  0 == h['spec']['fill']['size']['y'] && 0 == h['spec']['fill']['size']['z'] ? false : j) && (h[
                    'spec']['fill']['size']['x'],
                  n['pos']['x'] = j['x'],
                  1 == h['spec']['fill']['size']['y'] && (n['pos']['y'] = j['y']),
                  1 == h['spec']['fill']['size']['z']) && (n['pos']['z'] = j['z']);
              for (let v = h['spec']['materials']['length']; v--;)
                1 == h['spec']['materials'][v]['custom'] ? this['add_custom_material_key'](h['spec']['materials'][
                v]) : this['add_material_key_w_label']({
                  'group': h['spec']['materials'][v]['group'],
                  'id': h['spec']['materials'][v]['id'],
                  'fixed': h['spec']['materials'][v]['fixed'],
                  'key': h['spec']['materials'][v]['key'],
                  'label': h['spec']['materials'][v]['label']
                });
              let o = h['variables'];
              if (Object['keys'](o)['forEach'](w => {
                  this['add_variable'](o[w]);
                }),
                k = !g['userData']['params']['spec']['drag_items'] || !g['userData']['params']['spec']['drag_items'][
                  'length'
                ] || g['userData']['params']['spec']['drag_items']['includes'](f) ? 1 : k) {
                if (1 == to_int(g['userData']['params']['spec']['drag_single'])) {
                  var q = this['userData']['paths'][g['userData']['path']];
                  for (let w = q['userData']['children']['length']; w--;)
                    q['userData']['children'][w] instanceof Draggable && this['remove_by_path'](q['userData'][
                      'children'][w]['userData']['path']);
                }
                this['add_child_by_path'](g['userData']['path'], n),
                  'function' == typeof cabinet_events[this['userData']['params']['events']['on_after_drag']] &&
                  cabinet_events[this['userData']['params']['events']['on_after_drag']](this, g, h);
              }
              sc['get_price']();
            }
            ['check_drag_size'](f) {
              var g = this['userData']['params']['spec'],
                h = {
                  'x': this['userData']['params']['size']['x'],
                  'y': this['userData']['params']['size']['y'],
                  'z': this['userData']['params']['size']['z']
                };
              0 == g['fill']['size']['x'] && (h['x'] = f['userData']['size']['x']),
                0 == g['fill']['size']['y'] && (h['y'] = f['userData']['size']['y']),
                0 == g['fill']['size']['z'] && (h['z'] = f['userData']['size']['z']),
                this['userData']['params']['size']['x'] == h['x'] && this['userData']['params']['size']['y'] == h[
                'y'] && this['userData']['params']['size']['z'] == h['z'] || this['set_size'](h);
            }
            ['check_fill_intersection'](f, g, h) {
              if (1 == h['userData']['params']['spec']['drag_single'])
                return false;
              let j = false;
              var f = f['clone'](),
                f = h['userData']['own_object']['localToWorld'](f),
                k = new THREE['Box3'](),
                m = new THREE['Vector3'](g['userData']['params']['size']['x'] / units, g['userData']['params']['size'][
                  'y'
                ] / units, g['userData']['params']['size']['z'] / units);
              f['y'] += g['userData']['params']['size']['y'] / units / 2,
                k['setFromCenterAndSize'](f, m);
              for (let u = h['userData']['children']['length']; u--;)
                if (h['userData']['children'][u] instanceof Draggable || h['userData']['children'][
                  u] instanceof Blocker) {
                  var n = h['userData']['children'][u],
                    o = n['position']['clone'](),
                    o = h['userData']['own_object']['localToWorld'](o),
                    q = h['userData']['children'][u]['get_pivot'](),
                    q = (o['x'] += q['x'] / units,
                      o['y'] += q['y'] / units,
                      o['z'] += q['z'] / units,
                      new THREE['Box3']());
                  if (q['setFromCenterAndSize'](o, new THREE['Vector3'](n['userData']['computed']['size']['x'] / units,
                      n['userData']['computed']['size']['y'] / units, n['userData']['computed']['size']['z'] / units)),
                    k['intersectsBox'](q)) {
                    j = true;
                    break;
                  }
                }
              return j;
            }
            ['draw_boxes']() {
              var f = this['get_child_by_path']('0,0,2')['obj'];
              for (let i = f['userData']['children']['length']; i--;) {
                var g = f['userData']['children'][i],
                  h, g = (new THREE['Box3']()['setFromCenterAndSize'](g['position'], new THREE['Vector3'](g['userData'][
                      'computed'
                    ]['size']['x'] / units, g['userData']['computed']['size']['y'] / units, g['userData'][
                      'computed']['size']['z'] / units)),
                    new THREE['BoxHelper'](g, 16776960));
                scene['add'](g);
              }
            }
            ['get_drag_areas'](e) {
              let f = [];
              return Object['keys'](this['userData']['parts']['section'])['forEach'](g => {
                  !this['userData']['parts']['section'][g]['userData']['params']['spec']['drag_enabled'] || this[
                      'userData']['parts']['section'][g]['userData']['params']['spec']['drag_items']['length'] && !
                    this['userData']['parts']['section'][g]['userData']['params']['spec']['drag_items']['includes'](
                    e) || f.push(this['userData']['parts']['section'][g]['get_drag_area']());
                }),
                f;
            }
            ['show_drag_areas'](e) {
              Object['keys'](this['userData']['parts']['section'])['forEach'](f => {
                !this['userData']['parts']['section'][f]['userData']['params']['spec']['drag_enabled'] || this[
                    'userData']['parts']['section'][f]['userData']['params']['spec']['drag_items']['length'] && !
                  this['userData']['parts']['section'][f]['userData']['params']['spec']['drag_items']['includes'](
                  e) || this['userData']['paths'][f]['show_drag_area']();
              });
            }
            ['get_parts_by_tags'](f) {}
            ['hide_doors']() {}
            ['hide_drag_areas']() {
              Object['keys'](this['userData']['parts']['section'])['forEach'](f => {
                this['userData']['parts']['section'][f]['userData']['params']['spec']['drag_enabled'] && this[
                  'userData']['paths'][f]['hide_drag_area']();
              });
            }
            ['clear_draggables']() {
              Object['keys'](this['userData']['parts']['draggable'])['forEach'](f => {
                  this['remove_by_path'](f);
                }),
                sc['get_price']();
            }
            ['get_draggables'](f = false) {
              let g = [];
              return Object['keys'](this['userData']['parts']['draggable'])['forEach'](h => {
                  g.push(this['userData']['parts']['draggable'][h]);
                }),
                g;
            }
            ['show_draggables']() {
              Object['keys'](this['userData']['parts']['draggable'])['forEach'](f => {
                this['userData']['parts']['draggable'][f]['show_helpers']();
              });
            }
            ['hide_draggables']() {
              Object['keys'](this['userData']['parts']['draggable'])['forEach'](f => {
                this['userData']['parts']['draggable'][f]['hide_helpers']();
              });
            }
            ['set_snap_points']() {
              this['userData']['points_list'] = [],
                Object['keys'](this['userData']['parts']['point'])['length'] ? Object['keys'](this['userData']['parts'][
                  'point'
                ])['forEach'](f => {
                  this['userData']['points_list']['push'](this['userData']['parts']['point'][f]);
                }) : super['set_snap_points']();
            }
            ['show_snap_points']() {
              Object['keys'](this['userData']['parts']['point'])['length'] && Object['keys'](this['userData']['parts'][
                  'point'
                ])['forEach'](f => {
                  this['userData']['parts']['point'][f]['hide_helpers']();
                }),
                this['snap_points']['visible'] = false;
            }
            ['hide_snap_points']() {
              Object['keys'](this['userData']['parts']['point'])['length'] && Object['keys'](this['userData']['parts'][
                  'point'
                ])['forEach'](f => {
                  this['userData']['parts']['point'][f]['hide_helpers']();
                }),
                this['snap_points']['visible'] = false;
            }
            ['set_comments'](f) {
              this['userData']['params']['spec']['comments'] = f,
                this['build_comments']();
            }
            ['build_comments']() {
              this['reset_model'](this['userData']['comments_object']);
              var f = this['userData']['params']['spec'],
                g = (f['accessories_comments_string'] || (f['accessories_comments_string'] = ''),
                  this);
              if (f['accessories_comments'] && f['accessories_comments']['length'])
                for (let k = 0; k < g['params']['accessories_comments']['length']; k++) {
                  var h = g['params']['accessories_comments'][k];
                  h in accsessories_data['items'] && g['params']['accessories_comments_string']['indexOf'](
                    '\x20\x0a\x20' + accsessories_data['items'][h]['name']) < 0 && (g['params'][
                    'accessories_comments_string'
                  ] += '\x20\x0a\x20' + accsessories_data['items'][h]['name']);
                }
              var f = f['comments'] + f['accessories_comments_string'],
                f, i, j, f, j;
              '' !== f && (f = makeTextSprite(f, 0, parseInt(g['params']['size']['y']) / units + 50, 0, {
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
                this['userData']['comments_object']['add'](f),
                (i = new THREE['LineBasicMaterial']({
                  'color': 0
                }))['depthWrite'] = false,
                i['depthTest'] = false,
                (j = [])['push'](new THREE['Vector3'](0, parseInt(g['params']['size']['y']) / units, 0)),
                j.push(new THREE['Vector3'](0, f['position']['y'] - 1, 0)),
                f = new THREE['BufferGeometry']()['setFromPoints'](j),
                j = new THREE['Line'](f, i),
                this['userData']['comments_object']['add'](j));
            }
            ['build_ruler_point']() {
              this['userData']['ruler_points'] || (this['userData']['ruler_points'] = new THREE['Group'](),
                this['userData']['ruler_points']['name'] = 'ruler_points',
                this['userData']['ruler_points']['visible'] = false,
                this['add'](this['userData']['ruler_points']),
                this['userData']['ruler_points']['userData']['by_code'] = {});
              var f = () => {
                  let l;
                  return (l = 'function' == typeof THREE['SphereBufferGeometry'] ? new THREE['Mesh'](new THREE[
                      'SphereBufferGeometry'](5, 6, 6), misc_mats['ruler_point']) : new THREE['Mesh'](new THREE[
                      'SphereGeometry'](5, 6, 6), misc_mats['ruler_point']))['userData']['no_edges'] = 1,
                    l['userData']['parent_id'] = this['userData']['params']['obj_id'],
                    l['userData']['get_parent'] = () => this,
                    l['name'] = 'ruler_point',
                    l;
                },
                g = this['userData']['computed']['size'],
                h = parseInt(g['x']) / units,
                j = parseInt(g['y']) / units,
                k = parseInt(g['z']) / units;
              for (let l = 0; l < 2; l++) {
                let m = 0,
                  n = (1 == l && (m = j),
                    f());
                n['userData']['code'] = 'r1' + l,
                  this['userData']['ruler_points']['userData']['by_code'][n['userData']['code']] = n,
                  this['userData']['ruler_points']['add'](n),
                  n['position']['set'](-h / 2, m, -k / 2),
                  (n = f())['userData']['code'] = 'r2' + l,
                  this['userData']['ruler_points']['userData']['by_code'][n['userData']['code']] = n,
                  this['userData']['ruler_points']['add'](n),
                  n['position']['set'](0, m, -k / 2),
                  (n = f())['userData']['code'] = 'r3' + l,
                  this['userData']['ruler_points']['userData']['by_code'][n['userData']['code']] = n,
                  this['userData']['ruler_points']['add'](n),
                  n['position']['set'](h / 2, m, -k / 2),
                  (n = f())['userData']['code'] = 'r4' + l,
                  this['userData']['ruler_points']['userData']['by_code'][n['userData']['code']] = n,
                  this['userData']['ruler_points']['add'](n),
                  n['position']['set'](h / 2, m, 0),
                  (n = f())['userData']['code'] = 'r5' + l,
                  this['userData']['ruler_points']['userData']['by_code'][n['userData']['code']] = n,
                  this['userData']['ruler_points']['add'](n),
                  n['position']['set'](h / 2, m, k / 2),
                  (n = f())['userData']['code'] = 'r6' + l,
                  this['userData']['ruler_points']['userData']['by_code'][n['userData']['code']] = n,
                  this['userData']['ruler_points']['add'](n),
                  n['position']['set'](0, m, k / 2),
                  (n = f())['userData']['code'] = 'r7' + l,
                  this['userData']['ruler_points']['userData']['by_code'][n['userData']['code']] = n,
                  this['userData']['ruler_points']['add'](n),
                  n['position']['set'](-h / 2, m, k / 2),
                  (n = f())['userData']['code'] = 'r8' + l,
                  this['userData']['ruler_points']['userData']['by_code'][n['userData']['code']] = n,
                  this['userData']['ruler_points']['add'](n),
                  n['position']['set'](-h / 2, m, 0);
              }
            }
            ['get_ruler_point'](f) {
              return this['userData']['ruler_points']['userData']['by_code'][f];
            }
            ['show_ruler_points']() {
              this['userData']['ruler_points']['visible'] = true;
            }
            ['get_ruler_points']() {
              return this['userData']['ruler_points']['children'];
            }
            ['hide_ruler_points']() {
              this['userData']['ruler_points']['visible'] = false;
            }
            ['set_facades_visible'](e) {
              this['userData']['facades_visible'] = e,
                Object['keys'](this['userData']['parts']['door'])['forEach'](f => {
                  this['userData']['parts']['door'][f]['visible'] = e;
                }),
                Object['keys'](this['userData']['parts']['facade'])['forEach'](f => {
                  this['userData']['parts']['facade'][f]['visible'] = e;
                });
            }
            ['drag_move'](q, A, B) {
              var C = this,
                F = (A['userData']['own_object']['add'](C),
                  A['userData']['own_object']),
                G = C['userData']['params']['spec']['fill']['size'],
                H = {
                  'x': C['userData']['computed']['size']['x'],
                  'y': C['userData']['computed']['size']['y'],
                  'z': C['userData']['computed']['size']['z']
                };
              let J = 0;
              0 == G['x'] && H['x'] != A['userData']['computed']['size']['x'] && (H['x'] = A['userData']['computed'][
                    'size'
                  ]['x'],
                  J = 1),
                0 == G['y'] && H['y'] != A['userData']['computed']['size']['y'] && (H['y'] = A['userData']['computed']
                  ['size']['y'],
                  J = 1),
                0 == G['z'] && H['z'] != A['userData']['computed']['size']['z'] && (H['z'] = A['userData']['computed']
                  ['size']['z'],
                  J = 1),
                1 == J && C['set_size_by_number'](H['x'], H['y'], H['z']);
              var H = F['worldToLocal'](q['clone']()),
                K = 'xyz',
                L = {
                  'x': parseInt(C['userData']['params']['size']['x']) / units / 2,
                  'y': parseInt(C['userData']['params']['size']['y']) / units / 2,
                  'z': parseInt(C['userData']['params']['size']['z']) / units / 2
                };
              let N, P = parseInt(A['userData']['params']['spec']['ds_x']) / units,
                Q = parseInt(A['userData']['params']['spec']['ds_y']) / units,
                R = parseInt(A['userData']['params']['spec']['ds_z']) / units;
              H['x'] = clamp(H['x'], -A['userData']['size']['x'] / units / 2 + L['x'], A['userData']['size']['x'] /
                  units / 2 - L['x']),
                H['y'] = clamp(H['y'], -A['userData']['size']['y'] / units / 2 + L['y'], A['userData']['size']['y'] /
                  units / 2 - L['y']),
                H['z'] = clamp(H['z'], -A['userData']['size']['z'] / units / 2 + L['z'], A['userData']['size']['z'] /
                  units / 2 - L['z']),
                H['x'] = Math['round'](H['x'] / P) * P,
                H['y'] = Math['round'](H['y'] / Q) * Q,
                H['z'] = Math['round'](H['z'] / R) * R;
              var S = H['clone']();
              let T = '';
              1 == G['x'] && (T += 'x'),
                1 == G['y'] && (T += 'y'),
                1 == G['z'] && (T += 'z');
              var U = {
                  'x': [],
                  'y': [],
                  'z': []
                },
                W = {
                  'x': [],
                  'y': [],
                  'z': []
                },
                Z = {
                  'x': [],
                  'y': [],
                  'z': []
                };
              for (let aa = 0; aa < T.length; aa++) {
                var a0 = T[aa];
                Z[a0]['push']({
                  'point': S[a0],
                  'type': 'center'
                }, {
                  'point': S[a0] - L[a0],
                  'type': 'max'
                }, {
                  'point': S[a0] + L[a0],
                  'type': 'min'
                });
                for (let ab = 0; ab < A['userData']['children']['length']; ab++) {
                  var a1 = A['userData']['children'][ab];
                  U[a0]['push']({
                    'point': a1['position'][a0],
                    'type': 'center'
                  }, {
                    'point': a1['position'][a0] - a1['userData']['size'][a0] / units / 2,
                    'type': 'min'
                  }, {
                    'point': a1['position'][a0] + a1['userData']['size'][a0] / units / 2,
                    'type': 'max'
                  });
                }
                for (let ac = 0; ac < U[a0]['length']; ac++) {
                  var a2 = U[a0][ac];
                  for (let ad = 0; ad < Z[a0]['length']; ad++) {
                    var a3 = Z[a0][ad];
                    a3['type'] == a2['type'] && get_distance(a3['point'], a2['point']) <
                      corpus_draggable_snap_distance && W[a0]['push'](a2);
                  }
                }
                W[a0]['length'] && (W[a0]['sort']((ae, af) => ae['point'] - af['point']),
                  'center' == W[a0][0]['type'] && (S[a0] = W[a0][0]['point']),
                  'max' == W[a0][0]['type'] && (S[a0] = W[a0][0]['point'] + parseInt(C['userData']['params'][
                    'size'
                  ][a0]) / units / 2),
                  'min' == W[a0][0]['type']) && (S[a0] = W[a0][0]['point'] - parseInt(C['userData']['params'][
                  'size'
                ][a0]) / units / 2);
              }
              if (1 != G['x'] || 1 != G['y'] || 1 != G['z']) {
                var F = S['clone'](),
                  a4 = A['userData']['size'];
                let ae = -A['userData']['size']['x'] / units / 2,
                  af = A['userData']['size']['x'] / units / 2,
                  ag = -A['userData']['size']['y'] / units / 2,
                  ah = A['userData']['size']['y'] / units / 2,
                  ai = -A['userData']['size']['z'] / units / 2,
                  aj = A['userData']['size']['z'] / units / 2,
                  ak = (1 == G['x'] && (ae = F['x'] - L['x'],
                      af = F['x'] + L['x']),
                    1 == G['y'] && (ag = F['y'] - L['y'],
                      ah = F['y'] + L['y']),
                    1 == G['z'] && (ai = F['z'] - L['z'],
                      aj = F['z'] + L['z']),
                    1),
                  al = 1,
                  am = 1;
                0 == G['x'] && (ak = 2),
                  0 == G['y'] && (al = 2),
                  0 == G['z'] && (am = 2);
                var a5 = new THREE['Box3']()['setFromCenterAndSize'](S, new THREE['Vector3']((af - ae) * ak, (ah - ag) *
                    al, (aj - ai) * am))['clone'](),
                  a6 = [];
                let an = [],
                  ao = [];
                for (let ar = A['userData']['children']['length']; ar--;) {
                  var a7 = A['userData']['children'][ar];
                  let as = 0;
                  for (let at = C['userData']['connected']['length']; at--;)
                    a7['uuid'] == C['userData']['connected'][at]['uuid'] && (as = 1);
                  1 != as && a6.push(a7['get_local_box']());
                }
                0 == G['x'] && (an.push(-A['userData']['size']['x'] / units / 2),
                    an.push(A['userData']['size']['x'] / units / 2)),
                  0 == G['y'] && (ao.push(-A['userData']['size']['y'] / units / 2),
                    ao.push(A['userData']['size']['y'] / units / 2));
                for (let au = 0; au < a6.length; au++)
                  a5['intersectsBox'](a6[au]) && (a6[au]['center'] = a6[au]['getCenter'](),
                    0 == G['x'] && (an.push(a6[au]['min']['x']),
                      an.push(a6[au]['max']['x'])),
                    0 == G['y']) && (ao.push(a6[au]['min']['y']),
                    ao.push(a6[au]['max']['y']));
                let ap = null,
                  aq = null;
                0 == G['x'] && (an.push(F['x']),
                    an = _['sortBy'](an),
                    ap = get_min_max(F['x'], an)),
                  0 == G['y'] && (ao.push(F['y']),
                    ao = _['sortBy'](ao),
                    aq = get_min_max(F['y'], ao)),
                  B['show'](),
                  A['userData']['own_object']['add'](B),
                  B['set_size'](S, {
                    'min': {
                      'x': null == ap ? ae : ap['min'],
                      'y': null == aq ? ag : aq['min'],
                      'z': ai
                    },
                    'max': {
                      'x': null == ap ? af : ap['max'],
                      'y': null == aq ? ah : aq['max'],
                      'z': aj
                    }
                  });
                var q = {
                  'x': [],
                  'y': [],
                  'z': []
                };
                if (0 == G['x'] && (q['y'] = [Math['round'](ag * units), Math['round'](ah * units)]),
                  0 == G['y'] && (q['x'] = [Math['round'](ae * units), Math['round'](af * units)]),
                  B['position']['copy'](S),
                  event['altKey']) {
                  scene['add'](new Box_helper(a5, new THREE['LineBasicMaterial']({
                    'color': '#2b7537'
                  })));
                  for (let av = a6.length; av--;) {
                    var a8 = new Box_helper(a6[av]);
                    scene['add'](a8);
                  }
                }
                A['build_drag_sizes'](q);
              }
              this['position']['x'] = S['x'],
                this['position']['y'] = S['y'] - L['y'],
                this['position']['z'] = S['z'];
              var a9 = 0;
              if (this['userData']['connected']['length']) {
                for (let aw = this['userData']['connected']['length']; aw--;)
                ;
              }
            }
            ['mouse_move']() {
              this['userData']['parts']['projection'] && Object['keys'](this['userData']['parts']['projection'])[
                'forEach'](f => {
                var g;
                this['userData']['parts']['projection'][f]['mouse_move']();
              });
            }
            ['mouse_up']() {
              this['userData']['parts']['projection'] && Object['keys'](this['userData']['parts']['projection'])[
                'forEach'](f => {
                var g;
                this['userData']['parts']['projection'][f]['mouse_up']();
              });
            }
            ['_get_size']() {
              return new THREE['Vector3'](parseFloat(this['userData']['computed']['size']['x']) / units, parseFloat(
                this['userData']['computed']['size']['y']) / units, parseFloat(this['userData']['computed']['size'][
                'z'
              ]) / units);
            }
            ['show_comments']() {
              this['userData']['comments_object']['visible'] = true;
            }
            ['hide_comments']() {
              this['userData']['comments_object']['visible'] = false;
            }
        }
        class Connector extends Section {
          constructor(f = {}, g = {
              'parent': null,
              'root': null,
              'path': null
            }) {
              super(f, g),
                this['userData']['mouse_events'] = false;
            }
            ['b_spec']() {}
            ['gp']() {
              var f = copy_object(this['userData']['params']);
              return f['children'] = [],
                f;
            }
            ['mouse_move']() {}
            ['mouse_up']() {}
            ['build_helpers']() {
              var f = this['userData']['helpers'];
              for (let h = f['children']['length']; h--;)
                f['remove'](f['children'][h]);
              var g = make_cube(this['userData']['computed']['size']['x'] / units, this['userData']['computed']['size'][
                  'y'
                ] / units, this['userData']['computed']['size']['z'] / units, new THREE['MeshBasicMaterial']({
                  'color': '#96c296',
                  'transparent': true,
                  'opacity': 0.1,
                  'depthWrite': false,
                  'depthTest': false
                })),
                g = (g['userData']['is_cube'] = 1,
                  g['renderOrder'] = 10,
                  f['add'](g),
                  make_edges(this['userData']['computed']['size']['x'] / units, this['userData']['computed']['size'][
                    'y'] / units, this['userData']['computed']['size']['z'] / units, new THREE['LineBasicMaterial']({
                    'color': '#000000',
                    'depthTest': false
                  })));
              g['renderOrder'] = 11,
                f['add'](g);
            }
            ['helper_success']() {
              var f = this['userData']['helpers'];
              for (let g = f['children']['length']; g--;)
                f['children'][g]['userData']['is_cube'] && (f['children'][g]['material']['color']['setHex'](16711680),
                  f['children'][g]['material']['opacity'] = 0.5);
            }
            ['helper_normal']() {
              var f = this['userData']['helpers'];
              for (let g = f['children']['length']; g--;)
                f['children'][g]['userData']['is_cube'] && (f['children'][g]['material']['color']['setHex'](9880214),
                  f['children'][g]['material']['opacity'] = 0.1);
            }
            ['helper_error']() {}
        }
        let default_params = function() {
            let e = this,
              f = {
                'size': {
                  'x': 's.x',
                  'y': 's.y',
                  'z': 's.z'
                },
                'pos': {
                  'x': 0,
                  'y': 0,
                  'z': 0
                },
                'pivot': {
                  'x': -1,
                  'y': -1,
                  'z': -1
                },
                'rot': {
                  'x': 0,
                  'y': 0,
                  'z': 0
                },
                'rot2': {
                  'x': 0,
                  'y': 0,
                  'z': 0
                },
                'material': {
                  'id': 0,
                  'rotated': 0,
                  'fixed': 0
                },
                'children': [],
                'events': {
                  'on_before_build': '',
                  'on_after_build': ''
                },
                'condition': null,
                'visible': true
              };

            function g(h) {
              let i = {};
              return Object['keys'](h)['forEach'](function(j) {
                  i[h[j]] = j;
                }),
                i;
            }
            this['items'] = {
                'wall': {
                  'type': 'wall',
                  'name': 'wall',
                  'condition': null,
                  'spec': {
                    'orientation': 'f',
                    'type': 'common',
                    'type_params': {},
                    'shape': null,
                    'v': 1
                  },
                  'size': {
                    'x': 's.x',
                    'y': 's.y',
                    'z': 's.z'
                  },
                  'pos': {
                    'x': 0,
                    'y': 0,
                    'z': 0
                  },
                  'pivot': {
                    'x': -1,
                    'y': -1,
                    'z': -1
                  },
                  'rot': {
                    'x': 0,
                    'y': 0,
                    'z': 0
                  },
                  'material': {
                    'key': 'ldsp',
                    'variant': 'current',
                    'id': 0,
                    'rotated': 0,
                    'fixed': 0,
                    'back_mat': 0
                  },
                  'visible': true
                },
                'tabletop': {
                  'type': 'tabletop',
                  'name': 'tabletop',
                  'condition': null,
                  'spec': {
                    'orientation': 'f',
                    'type': 'common',
                    'type_params': {},
                    'shape': null,
                    'v': 1
                  },
                  'size': {
                    'x': 's.x',
                    'y': 's.y',
                    'z': 's.z'
                  },
                  'pos': {
                    'x': 0,
                    'y': 0,
                    'z': 0
                  },
                  'pivot': {
                    'x': -1,
                    'y': -1,
                    'z': -1
                  },
                  'rot': {
                    'x': 0,
                    'y': 0,
                    'z': 0
                  },
                  'material': {
                    'key': '__tabletop',
                    'variant': 'current',
                    'id': 0,
                    'rotated': 0,
                    'fixed': 0
                  },
                  'visible': true
                },
                'section': {
                  'type': 'section',
                  'name': 'section',
                  'spec': {
                    'tags': '',
                    'drag_enabled': false,
                    'div_enabled': false,
                    'drag_type': 0,
                    'ds_x': 1,
                    'ds_y': 1,
                    'ds_z': 1,
                    'drag_single': false,
                    'drag_items': [],
                    'drag_hide': []
                  }
                },
                'draggable': {
                  'type': 'draggable',
                  'name': 'draggable',
                  'spec': {
                    'id': 0,
                    'is_divider': false
                  }
                },
                'door': {
                  'type': 'door',
                  'name': 'door',
                  'spec': {
                    'type': 'rtl',
                    'handle_position': 'top'
                  }
                },
                'locker': {
                  'type': 'locker',
                  'name': 'locker',
                  'spec': {
                    'inner': false
                  }
                },
                'locker2': {
                  'type': 'locker',
                  'name': 'locker',
                  'spec': {
                    'id': 0,
                    'interactive': 0,
                    'override': {},
                    'variables': {}
                  }
                },
                'facade': {
                  'type': 'facade',
                  'name': 'facade',
                  'spec': {
                    'materials': {
                      'gen': 0
                    },
                    'handle': {
                      'id': 0,
                      'active': 0,
                      'fixed': 0,
                      'h_group': 0,
                      'orient': 'a',
                      'pos': {
                        'x': 'a',
                        'y': 'a'
                      },
                      'c_size': 0,
                      'p_size': 0,
                      'double': 0,
                      'offset_mode': 'p',
                      'offset': 25
                    },
                    'group': 'auto',
                    'style': 'full',
                    'radius': 0,
                    'id': 0,
                    'role': 'cab'
                  }
                },
                'model': {
                  'type': 'model',
                  'name': 'model',
                  'spec': {
                    'id': 0,
                    'version': 2,
                    'selected_materials': {}
                  }
                },
                'link': {
                  'type': 'link',
                  'name': 'link',
                  'spec': {
                    'id': 0
                  }
                },
                'point': {
                  'type': 'point',
                  'name': 'point',
                  'spec': {
                    'group': 0
                  },
                  'size': {
                    'x': '10',
                    'y': '10',
                    'z': '10'
                  }
                },
                'point_light': {
                  'type': 'point_light',
                  'name': 'point_light',
                  'spec': {
                    'color': 16777215,
                    'castShadow': false,
                    'decay': 2,
                    'distance': 0,
                    'intensity': 1
                  },
                  'size': {
                    'x': '1',
                    'y': '1',
                    'z': '1'
                  }
                },
                'slider': {
                  'type': 'slider',
                  'name': 'slider',
                  'spec': {
                    'ext_percent': 0.7,
                    'direction': 'f'
                  }
                },
                'rotator': {
                  'type': 'rotator',
                  'name': 'rotator',
                  'spec': {
                    'deg': 90,
                    'direction': 'ly'
                  }
                },
                'handle': {
                  'type': 'handle',
                  'name': 'handle',
                  'spec': {
                    'id': 0,
                    'size_index': 0,
                    'orient': 'h',
                    'dir': 'l',
                    'own': 1,
                    'models': [],
                    'categories': []
                  }
                },
                'blocker': {
                  'type': 'blocker',
                  'name': 'blocker',
                  'spec': {
                    'tags': ''
                  }
                },
                'mouse_target': {
                  'type': 'mouse_target',
                  'name': 'mouse_target',
                  'spec': {
                    'interactive': 0,
                    'tags': ''
                  },
                  'events': {
                    'on_mouseover': '',
                    'on_mouseout': ''
                  }
                },
                'projection': {
                  'type': 'projection',
                  'name': 'projection',
                  'spec': {
                    'type': 'w',
                    'active': 1,
                    'radius': 10,
                    'tolerance_x': 100,
                    'tolerance_y': 100,
                    'radius_color': '#ff0000',
                    'radius_opacity': 0.5,
                    'tolerance_color': '#32705b',
                    'tolerance_opacity': 0.5
                  }
                },
                'connector': {
                  'type': 'connector',
                  'name': 'connector',
                  'spec': {
                    'group': ''
                  }
                },
                'shelve': {
                  'spec': {
                    'orientation': 'horizontal',
                    'type': 'common',
                    'type_params': {},
                    'shape': null,
                    'v': 1
                  },
                  'size': {
                    'x': '100%',
                    'y': '100%',
                    'z': 16
                  },
                  'pos': {
                    'x': '50%',
                    'y': 0,
                    'z': 0
                  },
                  'pivot': {
                    'x': 0,
                    'y': 0,
                    'z': 1
                  },
                  'rot': {
                    'x': 0,
                    'y': 0,
                    'z': 0
                  },
                  'offset': {
                    'x': [0, 0],
                    'y': [0, 0],
                    'z': [0, 0]
                  },
                  'material': {
                    'key': '',
                    'variant': '',
                    'id': 0,
                    'rotated': 0,
                    'fixed': 0
                  },
                  'visible': true
                }
              },
              this['items']['slider_side'] = this['items']['slider'],
              this['convert_table'] = {
                'shelves': {
                  'width': 'size.x',
                  'depth': 'size.y',
                  'thickness': 'size.z',
                  'front_offset': 'offset.z.1',
                  'orientation': 'spec.orientation',
                  'starting_point_x': 'pos.x',
                  'starting_point_y': 'pos.y',
                  'position_offset_top': 'offset.y.1',
                  'position_offset_bottom': 'offset.y.0',
                  'direction_x': 'pivot.x',
                  'direction_y': 'pivot.y',
                  'material': 'material.id'
                }
              },
              this['convert'] = {
                'shelves': function(h, j = false) {
                  let k = g(e['convert_table']['shelves']),
                    l = e['get']('shelves');
                  return Object['keys'](h)['forEach'](function(m) {
                      utils['nested_object']['set'](l, k[m], utils['nested_object']['get'](h, m));
                    }),
                    l;
                }
              },
              this['get'] = function(h) {
                return _['merge'](copy_object(f), copy_object(this['items'][h]));
              };
          },
          dp = new default_params();
        class Divider extends Section {
          constructor(e = {}, f = {
            'parent': null,
            'root': null,
            'path': null
          }) {
            super(e, f);
          }
        }
        class Section_div extends Section {
          constructor(e = {}, f = {
            'parent': null,
            'root': null,
            'path': null
          }) {
            super(e, f);
          }
        }
        class DoorCN extends Section {
          constructor(f = {}, g = {
              'parent': null,
              'root': null,
              'path': null
            }) {
              super(f, g);
            }
            ['b_spec']() {
              var f = this['userData']['params'],
                g = this['userData']['computed'],
                h = this['userData']['params']['spec'],
                j = this['userData']['root']['userData']['params'],
                k = this['userData']['root']['userData']['params']['spec']['facades'],
                m, n = this['userData']['root']['userData']['params']['path_params'];
              let p, q = (n[this['userData']['path2']] && n[this['userData']['path2']]['materials'] && n[this[
                'userData']['path2']]['materials']['gen'] && (p = n[this['userData']['path2']]['materials'][
              'gen']), {
                'active': void 0 === h['active'] || h['active'],
                'width': g['size']['x'],
                'height': g['size']['y'],
                'thickness': g['size']['z'],
                'version': 2,
                'type': void 0 !== h['type'] ? h['type'] : 'rtl',
                'style': (void 0 !== h['style'] ? h : k)['style'],
                'fixed_facade_model': void 0 !== h['fixed_facade_model'] ? h['fixed_facade_model'] : void 0,
                'facade': void 0 !== h['facade'] ? h['facade'] : void 0,
                'handle_model': void 0 !== h['handle_model'] ? h['handle_model'] : project_settings['handle'][j[
                  'spec']['group']]['model'],
                'handle_size_index': void 0 !== h['handle_size_index'] ? h['handle_size_index'] :
                  project_settings['handle'][j['spec']['group']]['preferable_size'],
                'handle_orientation': void 0 !== h['handle_orientation'] ? h['handle_orientation'] :
                  project_settings['handle'][j['spec']['group']]['orientation'],
                'handle_position': void 0 !== h['handle_position'] ? h['handle_position'] : 'top',
                'no_handle_forced': void 0 !== h['no_handle_forced'] && h['no_handle_forced'],
                'additional_materials': void 0 !== h['additional_materials'] ? h['additional_materials'] : {},
                'available_opens': void 0 !== h['available_opens'] ? h['available_opens'] : [],
                'material_fixed': void 0 !== h['material_fixed'] && h['material_fixed'],
                'material': void 0 !== p ? p : h['material'],
                'material_rotated': void 0 !== h['material_rotated'] ? h['material_rotated'] : project_settings[
                  'selected_materials'][j['spec']['group']]['facades_rotated'],
                'group': (void 0 !== h['group'] ? h : j['spec'])['group'],
                'facade_group': void 0 !== h['facade_group'] ? h['facade_group'] : j['spec']['group'],
                'no_handle_group': void 0 !== h['no_handle_group'] && h['no_handle_group'],
                'can_be_opened': void 0 === h['can_be_opened'] || h['can_be_opened'],
                'furniture_visible': false,
                'radius': false,
                'params_locked': void 0 !== h['params_locked'] && h['params_locked'],
                'flip': void 0 !== h['flip'] && h['flip'],
                'is_double': void 0 !== h['is_double'] ? h['is_double'] : 0,
                'is_triple': void 0 !== h['is_triple'] ? h['is_triple'] : 0
              });
              void 0 === q['style'] && (q['style'] = k['style']),
                void 0 === q['facade'] && (q['facade'] = k['model']),
                void 0 === q['glass_material'] && (q['glass_material'] = k['glass_material']),
                void 0 === q['material'] && (q['material'] = k['materials']['gen']),
                void 0 === q['style'] && (q['style'] = k['style']);
              var n = facades_lib['items'][q['facade']];
              if (n['thickness'] ? q['thickness'] = n['thickness'] : q['thickness'] = 18,
                !isNaN(parseInt(q['style'])) && facades_lib['items'][q['facade']]['compatibility_types']) {
                let u = facades_lib['items'][q['facade']]['compatibility_types'];
                Object['keys'](u)['forEach'](function(v) {
                  u[v] == q['style'] && (q['style'] = v);
                });
              }
              this['userData']['mesh'] = new Door_new(q),
                this['add_own_object'](this['userData']['mesh']),
                this['userData']['mesh']['position']['x'] = -g['size']['x'] / 2 / units,
                this['userData']['mesh']['position']['y'] = -g['size']['y'] / 2 / units,
                this['userData']['mesh']['position']['z'] = -g['size']['z'] / 2 / units,
                'simple_bottom' === q['type'] && (this['userData']['mesh']['position']['y'] = 3 * -g['size']['y'] /
                  2 / units),
                setTimeout(() => {
                  this['visible'] = this['userData']['root']['userData']['facades_visible'];
                }, 10);
            }
            ['set_facade_style'](e) {
              this['userData']['params']['spec']['style'] = e,
                this['userData']['mesh']['params']['style'] = e,
                this['userData']['mesh']['change_facade_style'](e);
              var e = this['userData']['computed'];
              this['userData']['mesh']['position']['x'] = -e['size']['x'] / 2 / units,
                this['userData']['mesh']['position']['y'] = -e['size']['y'] / 2 / units,
                this['userData']['mesh']['position']['z'] = -e['size']['z'] / 2 / units;
            }
            ['change_facade_material'](f, g, h = false) {
              var g;
              super['change_facade_material'](f, g),
                this['userData']['params']['material']['fixed'] || this['userData']['params']['material']['id'] == g ||
                (this['userData']['params']['spec']['material'] = g,
                  this['userData']['mesh']['change_material']({
                    'id': g
                  }),
                  g = this['userData']['root']['userData']['params']['path_params'],
                  h) || g[this['userData']['path2']] && g[this['userData']['path2']]['materials'] && g[this['userData'][
                  'path2'
                ]]['materials'][f] && delete g[this['userData']['path2']]['materials'][f];
            }
            ['get_specs']() {
              return this['userData']['mesh']['facade']['get_specs']();
            }
            ['get_glass_specs']() {
              return this['userData']['mesh']['facade']['get_glass_specs']();
            }
            ['get_handles_specs']() {
              if (this['userData']['mesh']['handle'] && !this['userData']['mesh']['params']['no_handle_forced'])
                return this['userData']['mesh']['handle']['get_specs']();
            }
            ['apply_material']() {}
            ['animate']() {
              super['animate'](),
                parse_animation(p_animations[this['userData']['params']['spec']['type']], this['userData']['mesh'],
                'f');
            }
        }
        ((() => {
          let f = new THREE['Plane'](new THREE['Vector3'](0, 1, 0)),
            g = new THREE['Raycaster'](),
            h = new THREE['Vector2'](),
            i = new THREE['Vector3'](),
            j = new THREE['Vector3'](),
            k = new THREE['Vector3'](),
            l = new THREE['Matrix4'](),
            m = null,
            n = 0;
          class o extends THREE['EventDispatcher'] {
            constructor(q, A, B) {
                super(),
                  B['style']['touchAction'] = 'none';
                let G = null,
                  J = null,
                  Q = [],
                  S = [null, null],
                  U = null,
                  Z = null,
                  a0 = (this['mode'] = 'd',
                    this['r_el'] = null,
                    this['rot'] = {
                      'par': null,
                      'radius': 100,
                      'rY': 0,
                      'cX': 0,
                      'cy': 0
                    },
                    this['rotation_snap_tolerance'] = Math['PI'] / 36,
                    this['translate_snap_tolerance'] = 10,
                    this['translate_grid'] = 0.1,
                    this['s_helper'] = {},
                    this['s_helper']['hide'] = function() {},
                    this['s_helper']['make'] = function(ap) {
                      ap = ap || G,
                        a0['s_helper']['show'](),
                        ap['box'] ? a0['s_helper']['set_size'](ap['box']) : a0['s_helper']['set_size'](box3[
                          'setFromObject'](ap)),
                        a0['s_helper']['position']['copy'](ap['getWorldPosition']()),
                        a0['s_helper']['position']['y'] = ap['position']['y'] + a0['s_helper']['size']['y'] / 2,
                        a0['update_selection'](ap);
                    },
                    this['has_selected'] = false,
                    this['clear_hovered'] = function() {
                      J = null;
                    },
                    this['set_camera'] = function(ap) {
                      A = ap;
                    },
                    this['set_cursor'] = function(ap = 'auto') {
                      B['style']['cursor'] = ap;
                    },
                    this);

                function a1() {
                  B['addEventListener']('pointermove', a7),
                    B['addEventListener']('pointerdown', a6),
                    B['addEventListener']('pointerup', a8);
                }

                function a2() {
                  B['removeEventListener']('pointermove', a7),
                    B['removeEventListener']('pointerdown', a6),
                    B['removeEventListener']('pointerup', a8),
                    B['style']['cursor'] = '';
                }

                function a3() {
                  a2();
                }

                function a4() {
                  return q;
                }

                function a5() {
                  return g;
                }

                function a6(ap) {
                  if (false !== a0['enabled']) {
                    if (1 < interface_version && pp['interface']['root']['radial_hide'](),
                      aa(ap),
                      'picker' == global_options['mouse_mode']['mode']) {
                      var aq, aq, aq, ar, as, ar, at;
                      if ('walls' == global_options['mouse_mode']['target'])
                        return void(1 == ap['which'] && J && ('Shaft_wall' == J['name'] ? J['userData']['root'][
                          'change_plane_material'
                        ](J['userData']['tag'], global_options['mouse_mode']['item_id']) : (aq = J['name'][
                            'replace'
                          ]('_wall', ''),
                          room['change_wall_material'](aq, global_options['mouse_mode']['item_id']))));
                      if ('facade_materials' == global_options['mouse_mode']['target'])
                        return void(1 == ap['which'] && J && null !== (aq = ak(J)) && (aq instanceof Facade ?
                          aq['change_own_material'](global_options['mouse_mode']['item_id'], global_options[
                            'cpk_key']) : al(aq)['change_single_facade_material'](global_options['mouse_mode']
                            ['item_id'], aq, global_options['cpk_key']),
                          sc['get_price']()));
                      if ('facades' == global_options['mouse_mode']['target'] && 1 == ap['which'] && J) {
                        let aB = ak(J);
                        1 == global_options['mouse_mode']['radius'] ? aB['cabinet']['params']['cabinet']['type']
                          ['indexOf']('radius') < 0 && (aB = null) : -1 < aB['cabinet']['params']['cabinet'][
                            'type'
                          ]['indexOf']('radius') && (aB = null),
                          null !== aB && ('function' == typeof sc['add_facade'] && sc['add_facade'](aB),
                            sc['get_price']());
                      }
                      return 'fill' == global_options['mouse_mode']['target'] ? void(1 == ap['which'] && J && (
                          aq = J['parent']['parent']['userData']['root'],
                          ar = J['parent']['parent'],
                          as = copy_object(catalog_lib['items'][global_options['mouse_mode']['item_id']][
                            'params'
                          ]),
                          aq['add_drag_child'](global_options['mouse_mode']['item_id'] + '', ar, as),
                          aq['show_drag_areas'](global_options['mouse_mode']['item_id'] + ''))) : 'erase' ==
                        global_options['mouse_mode']['target'] ? void(1 == ap['which'] && J && null !== (ar =
                          ah(J)) && ar['userData']['root']['remove_draggable'](ar)) : void 0;
                    }
                    if ('ruler' == global_options['mouse_mode']['mode']) {
                      if (1 == ap['which'] && J) {
                        if (1 == global_options['mouse_mode']['target']) {
                          var as = J['userData']['parent_id'] + '_' + J['userData']['code'];
                          if (!S[0])
                            return S[0] = {
                                'id': as,
                                'point_id': J['userData']['code'],
                                'parent_id': J['userData']['parent_id'],
                                'obj': J,
                                'point': J['getWorldPosition'](),
                                'parent': J['userData']['get_parent']()
                              },
                              J['material'] = misc_mats['ruler_point_hovered'],
                              void(U = J);
                          if (S[0]['id'] != as)
                            return S[1] = {
                                'id': as,
                                'point_id': J['userData']['code'],
                                'parent_id': J['userData']['parent_id'],
                                'obj': J,
                                'point': J['getWorldPosition'](),
                                'parent': J['userData']['get_parent']()
                              },
                              S[0]['obj']['material'] = misc_mats['ruler_point'],
                              J['material'] = misc_mats['ruler_point'],
                              sc['add_ruler'](S),
                              S = [null, null],
                              void(U = null);
                          S[0] = null,
                            U = null;
                        } else
                          sc['remove_ruler'](J['userData']['parent']['params']['points']);
                      }
                    } else {
                      if ('guides' == global_options['mouse_mode']['mode']) {
                        if (3 == global_options['mouse_mode']['target'])
                          sc['remove_guide'](J);
                        else {
                          if (1 == ap['which']) {
                            var au = new THREE['Vector3'](),
                              av = new THREE['Vector3']();
                            let aC = 'x';
                            switch (J['name']) {
                              case 'floor':
                                1 == global_options['mouse_mode']['target'] ? (au['z'] = 0,
                                    av['z'] = room['params']['depth'] / units) : 2 == global_options[
                                    'mouse_mode']['target'] && (au['x'] = 0,
                                    av['x'] = room['params']['width'] / units,
                                    aC = 'z'),
                                  au['y'] += 0.2,
                                  av['y'] += 0.2;
                                break;
                              case 'left_wall':
                                1 == global_options['mouse_mode']['target'] && (aC = 'z',
                                    au['y'] = 0,
                                    av['y'] = room['params']['height'] / units),
                                  2 == global_options['mouse_mode']['target'] && (aC = 'y',
                                    au['z'] = 0,
                                    av['z'] = room['params']['depth'] / units),
                                  au['x'] += 0.2,
                                  av['x'] += 0.2;
                                break;
                              case 'right_wall':
                                1 == global_options['mouse_mode']['target'] && (aC = 'z',
                                    au['y'] = 0,
                                    av['y'] = room['params']['height'] / units),
                                  2 == global_options['mouse_mode']['target'] && (aC = 'y',
                                    au['z'] = 0,
                                    av['z'] = room['params']['depth'] / units),
                                  au['x'] -= 0.2,
                                  av['x'] -= 0.2;
                                break;
                              case 'front_wall':
                                1 == global_options['mouse_mode']['target'] ? (au['y'] = 0,
                                    av['y'] = room['params']['height'] / units) : 2 == global_options[
                                    'mouse_mode']['target'] && (au['x'] = 0,
                                    av['x'] = room['params']['width'] / units,
                                    aC = 'y'),
                                  au['z'] += 0.2,
                                  av['z'] += 0.2;
                                break;
                              case 'back_wall':
                                1 == global_options['mouse_mode']['target'] ? (au['y'] = 0,
                                    av['y'] = room['params']['height'] / units) : 2 == global_options[
                                    'mouse_mode']['target'] && (au['x'] = 0,
                                    av['x'] = room['params']['width'] / units,
                                    aC = 'y'),
                                  au['z'] -= 0.2,
                                  av['z'] -= 0.2;
                                break;
                            }
                            sc['add_guide'](aC, au, av, scene['userData']['temp_line']['position']['clone'](), J[
                              'name'], global_options['mouse_mode']['target']);
                          }
                        }
                      } else {
                        for (Q.length = 0,
                          g['setFromCamera'](h, A),
                          g['intersectObjects'](q, true, Q); Q[0] && Q[0]['object'] && 'Sprite' === Q[0][
                            'object'
                          ]['type'];)
                          Q['shift']();
                        if (0 < Q.length) {
                          var aw = Q[0]['object'],
                            ax, ay, ax;
                          switch (a0['mode'] = 'd',
                            ap['which']) {
                            case 1:
                              if (global_options['colorpicker_mode'])
                                return Q[0]['object']['no_click_event'] && Q['shift'](),
                                  null !== (ax = ak(Q[0]['object'])) && (ax instanceof Facade ? ax[
                                    'change_own_material'](global_options['selected_mat'], global_options[
                                    'cpk_key']) : al(ax)['change_single_facade_material'](global_options[
                                    'selected_mat'], ax, global_options['cpk_key'])),
                                  void sc['get_price']();
                              if (global_options['fill_mode']) {
                                let aD = [];
                                for (let aE = 0; aE < room['active_objects']['length']; aE++)
                                  'CabinetN' === room['active_objects'][aE]['temp_type'] && 1 != room[
                                    'active_objects'][aE]['userData']['params']['spec']['is_fill'] && (aD = aD[
                                    'concat'](room['active_objects'][aE]['get_drag_areas'](global_options[
                                    'selected_fill'])));
                                var ax = g['intersectObjects'](aD, true),
                                  ay, ax, az;
                                return ax.length && ax[0]['object'] && (ay = ax[0]['object']['parent'][
                                      'parent'
                                    ]['userData']['root'],
                                    ax = ax[0]['object']['parent']['parent'],
                                    az = copy_object(catalog_lib['items'][global_options['selected_fill']][
                                      'params'
                                    ]),
                                    ay['add_drag_child'](global_options['selected_fill'], ax, az),
                                    ay['show_drag_areas'](global_options['selected_fill'])),
                                  void autosave();
                              }
                              if (global_options['erase_mode']) {
                                if (1 == ap['which']) {
                                  let aF = [];
                                  for (let aG = 0; aG < room['active_objects']['length']; aG++)
                                    'CabinetN' === room['active_objects'][aG]['temp_type'] && 1 != room[
                                      'active_objects'][aG]['userData']['params']['spec']['is_fill'] && (aF = aF[
                                      'concat'](room['active_objects'][aG]['get_draggables']()));
                                  var ax = g['intersectObjects'](aF, true),
                                    az, aA;
                                  ax.length && null !== (az = ah(ax[0]['object'])) && az['userData']['root'][
                                    'remove_draggable'
                                  ](az);
                                }
                                return;
                              }
                              if (ap['altKey'] && ap['shiftKey'] && (Q[0]['object']['no_click_event'] && Q[0][
                                    'shift'
                                  ](),
                                  ay = ag(Q[0]['object'], ap),
                                  (ax = make_cube(5, 5, 5))['position']['copy'](Q[0]['point']),
                                  ay['attach'](ax),
                                  ay['userData']['points_list']['push'](ax)),
                                ap['altKey'])
                                return Q[0]['object']['no_click_event'] && Q[0]['shift'](),
                                  void a9(Q);
                              G = ag(Q[0]['object'], ap),
                                this['has_selected'] = true,
                                active_el && active_el['uuid'] != G['uuid'] && active_el && active_el['unselect']
                                (),
                                a0['select_object'](G);
                              var az = g['intersectObjects'](ad(ap), true);
                              az.length && ('110' == THREE['REVISION'] ? l = new THREE['Matrix4']()[
                                    'getInverse'](G['parent']['matrixWorld']['clone']()) : l['copy'](G['parent'][
                                    'matrixWorld'
                                  ])['invert'](),
                                  i['copy'](az[0]['point'])['sub'](k['setFromMatrixPosition'](G['matrixWorld']))
                                  ),
                                G && 'function' == typeof G['build_from_wall_sizes'] && G['build_from_wall_sizes']
                                (true),
                                B['style']['cursor'] = 'move',
                                a0['dispatchEvent']({
                                  'type': 'dragstart',
                                  'object': G
                                });
                              break;
                            case 2:
                              a9(Q);
                              break;
                            case 3:
                          }
                        } else
                          active_el && active_el['unselect']();
                        helper['isDown'] && selectionBox['startPoint']['set'](ap['clientX'] / window[
                          'innerWidth'] * 2 - 1, -ap['clientY'] / window['innerHeight'] * 2 + 1, 0.5);
                      }
                    }
                  }
                }

                function a7(ap) {
                  if (false !== a0['enabled']) {
                    if ('r' == a0['mode']) {
                      var aq = a0['r_el'],
                        ar = Math['atan2'](ap['clientY'] - a0['rot']['cY'], ap['clientX'] - a0['rot']['cX']);
                      let aE = ar - a0['rot']['rY'];
                      aq['style']['left'] = a0['rot']['radius'] * Math['cos'](ar) + 'px',
                        aq['style']['top'] = a0['rot']['radius'] * Math['sin'](ar) + 'px',
                        void(ap['ctrlKey'] ? (0 != Math['round'](G['rotation']['x']) && (aE *= -1),
                          G['rotation']['y'] = -aE) : (0 != Math['round'](G['rotation']['x']) && (aE *= -1),
                          G['rotation']['y'] = af(-aE)));
                    } else {
                      if (aa(ap),
                        g['setFromCamera'](h, A),
                        'picker' == global_options['mouse_mode']['mode']) {
                        var as;
                        if ('walls' == global_options['mouse_mode']['target'])
                          return void(0 < (as = g['intersectObjects'](ab(), true))['length'] ? (J && (J[
                              'material']['emissiveIntensity'] = 0),
                            (J = as[0]['object'])['material']['emissive']['set']('#9bff96'),
                            J['material']['emissiveIntensity'] = 0.05,
                            global_options['mouse_mode']['obj'] = J,
                            B['style']['cursor'] = global_options['color_picker_cursor']) : (J && (J[
                              'material']['emissiveIntensity'] = 0),
                            J = null,
                            global_options['mouse_mode']['obj'] = null,
                            B['style']['cursor'] = 'auto'));
                        if ('facade_materials' == global_options['mouse_mode']['target']) {
                          var aq = g['intersectObjects'](ac(ap), true),
                            at;
                          if (0 < aq.length && 'wall' !== al(aq[0]['object'])['object_type']) {
                            if ('wall_panel' == aq[0]['object']['name'] && 1 != al(aq[0]['object'])[
                                'params']['draggable'])
                              return;
                            aq[0]['object']['no_click_event'] && aq['shift'](),
                              J && (J['material']['emissiveIntensity'] = 0),
                              null !== ak(J = aq[0]['object']) && (J['material']['emissive']['set']('#9bff96'),
                                J['material']['emissiveIntensity'] = 0.05,
                                global_options['mouse_mode']['obj'] = J,
                                B['style']['cursor'] = global_options['color_picker_cursor']);
                          } else
                            J && (J['material']['emissiveIntensity'] = 0),
                            J = null,
                            global_options['mouse_mode']['obj'] = null,
                            B['style']['cursor'] = 'auto';
                          return;
                        }
                        if ('facades' == global_options['mouse_mode']['target']) {
                          var ar = g['intersectObjects'](ac(ap), true);
                          if (0 < ar.length && 'wall' !== al(ar[0]['object'])['object_type']) {
                            if ('wall_panel' == ar[0]['object']['name'] && 1 != al(ar[0]['object'])[
                                'params']['draggable'])
                              return;
                            ar[0]['object']['no_click_event'] && ar['shift'](),
                              J && (J['material']['emissiveIntensity'] = 0);
                            let aF = ak(J = ar[0]['object']);
                            if ('Tabletop' == aF['parent']['name'])
                              return;
                            null !== aF && aF['userData']['cabinet'] && (1 == global_options['mouse_mode'][
                                  'radius'
                                ] ? aF['cabinet']['params']['cabinet']['type']['indexOf']('radius') < 0 && (aF =
                                  null) : -1 < aF['cabinet']['params']['cabinet']['type']['indexOf'](
                                'radius') && (aF = null)),
                              null !== aF && (J['material']['emissive']['set']('#9bff96'),
                                J['material']['emissiveIntensity'] = 0.05,
                                global_options['mouse_mode']['obj'] = J,
                                B['style']['cursor'] = global_options['color_picker_cursor']);
                          } else
                            J && (J['material']['emissiveIntensity'] = 0),
                            J = null,
                            global_options['mouse_mode']['obj'] = null,
                            B['style']['cursor'] = 'auto';
                          return;
                        }
                        if ('fill' == global_options['mouse_mode']['target']) {
                          let aG = [];
                          for (let aH = 0; aH < room['active_objects']['length']; aH++)
                            'CabinetN' === room['active_objects'][aH]['temp_type'] && 1 != room[
                              'active_objects'][aH]['userData']['params']['spec']['is_fill'] && (aG = aG['concat']
                              (room['active_objects'][aH]['get_drag_areas'](global_options['mouse_mode'][
                                'item_id'] + '')));
                          var aq = g['intersectObjects'](aG, true);
                          return void(0 < aq.length ? (J && J['material']['color']['setHex'](9880214),
                            (J = aq[0]['object'])['material']['color']['setHex'](8504449),
                            global_options['mouse_mode']['obj'] = J,
                            B['style']['cursor'] = global_options['color_picker_cursor']) : (J && J[
                              'material']['color']['setHex'](9880214),
                            J = null,
                            global_options['mouse_mode']['obj'] = null,
                            B['style']['cursor'] = 'auto'));
                        }
                        if ('erase' == global_options['mouse_mode']['target']) {
                          let aI = [];
                          for (let aJ = 0; aJ < room['active_objects']['length']; aJ++)
                            'CabinetN' === room['active_objects'][aJ]['temp_type'] && 1 != room[
                              'active_objects'][aJ]['userData']['params']['spec']['is_fill'] && (aI = aI['concat']
                              (room['active_objects'][aJ]['get_draggables']()));
                          var ar = g['intersectObjects'](aI, true),
                            aq;
                          return void(0 < ar.length ? (aq = ah(ar[0]['object']),
                            J && 'CabinetN' !== J['temp_type'] && J['material']['color']['setHex'](9880214),
                            (J = aq['userData']['helpers']['children'][0])['material']['color']['setHex'](
                              16711680),
                            global_options['mouse_mode']['obj'] = J,
                            B['style']['cursor'] = global_options['color_picker_cursor']) : (J && J[
                              'material']['color']['setHex'](9880214),
                            J = null,
                            global_options['mouse_mode']['obj'] = null,
                            B['style']['cursor'] = 'auto'));
                        }
                      }
                      var ar, aq, aq, au;
                      if ('ruler' == global_options['mouse_mode']['mode'])
                        1 == global_options['mouse_mode']['target'] ? 0 < (ar = g['intersectObjects'](am(ap),
                          true))['length'] ? (J && (J['material'] = misc_mats['ruler_point']),
                          (J = ar[0]['object'])['material'] = misc_mats['ruler_point_hovered'],
                          global_options['mouse_mode']['obj'] = J,
                          B['style']['cursor'] = 'pointer') : (!J || null != U && U['uuid'] == J['uuid'] || (J[
                            'material'] = misc_mats['ruler_point']),
                          J = null,
                          global_options['mouse_mode']['obj'] = null,
                          B['style']['cursor'] = 'auto') : 0 < (aq = g['intersectObjects'](an(ap), true))[
                          'length'] ? (J && (J['material'] = misc_mats['ruler_line']),
                          (J = aq[0]['object'])['material'] = misc_mats['ruler_line_hovered'],
                          global_options['mouse_mode']['obj'] = J,
                          B['style']['cursor'] = 'pointer') : (J && (J['material'] = misc_mats['ruler_line']),
                          J = null,
                          global_options['mouse_mode']['obj'] = null,
                          B['style']['cursor'] = 'auto');
                      else {
                        if ('guides' == global_options['mouse_mode']['mode']) {
                          if (3 == global_options['mouse_mode']['target'])
                            0 < (as = g['intersectObjects'](scene['userData']['guides']['children'], true))[
                              'length'] ? (J && (J['material'] = misc_mats['grid_line']),
                              (J = as[0]['object'])['material'] = misc_mats['ruler_line_hovered'],
                              global_options['mouse_mode']['obj'] = J,
                              B['style']['cursor'] = 'pointer') : (J && (J['material'] = misc_mats['grid_line']),
                              J = null,
                              global_options['mouse_mode']['obj'] = null,
                              B['style']['cursor'] = 'auto');
                          else {
                            if ((as = g['intersectObjects'](room['walls_objects'], true))['length']) {
                              J = as[0]['object'],
                                scene['userData']['temp_line'] && (scene['userData']['temp_line']['geometry'][
                                    'dispose'
                                  ](),
                                  scene['userData']['temp']['remove'](scene['userData']['temp_line']));
                              var ar = new THREE['Vector3'](0, 0, 0),
                                av = new THREE['Vector3'](0, 0, 0),
                                aw = new THREE['Vector3'](0, 0, 0),
                                ax = new THREE['Vector3'](0, 0, 0),
                                ay = new THREE['Vector3'](0, 0, 0);
                              switch (as[0]['object']['name']) {
                                case 'floor':
                                  1 == global_options['mouse_mode']['target'] ? (av['z'] = room['params'][
                                      'depth'
                                    ] / units,
                                    aw['x'] = as[0]['point']['x']) : (av['x'] = room['params']['width'] /
                                    units,
                                    aw['z'] = as[0]['point']['z']);
                                  break;
                                case 'left_wall':
                                  1 == global_options['mouse_mode']['target'] ? (av['y'] = room['params'][
                                      'height'
                                    ] / units,
                                    aw['z'] = as[0]['point']['z']) : (av['z'] = room['params']['depth'] /
                                    units,
                                    aw['y'] = as[0]['point']['y']);
                                  break;
                                case 'right_wall':
                                  1 == global_options['mouse_mode']['target'] ? (av['y'] = room['params'][
                                        'height'
                                      ] / units,
                                      aw['z'] = as[0]['point']['z']) : (av['z'] = room['params']['depth'] /
                                      units,
                                      aw['y'] = as[0]['point']['y']),
                                    aw['x'] = room['right_wall']['position']['x'];
                                  break;
                                case 'front_wall':
                                  1 == global_options['mouse_mode']['target'] ? (av['y'] = room['params'][
                                      'height'
                                    ] / units,
                                    aw['x'] = as[0]['point']['x']) : (av['x'] = room['params']['width'] /
                                    units,
                                    aw['y'] = as[0]['point']['y']);
                                  break;
                                case 'back_wall':
                                  1 == global_options['mouse_mode']['target'] ? (av['y'] = room['params'][
                                        'height'
                                      ] / units,
                                      aw['x'] = as[0]['point']['x']) : (av['x'] = room['params']['width'] /
                                      units,
                                      aw['y'] = as[0]['point']['y']),
                                    aw['z'] = room['back_wall']['position']['z'];
                                  break;
                              }
                              switch (scene['userData']['temp_line'] = draw_line(ar, av, misc_mats['depth_line']),
                                scene['userData']['temp']['add'](scene['userData']['temp_line']),
                                ap['ctrlKey'] ? ap['shiftKey'] || (aw['x'] = Math['round'](aw['x']),
                                  aw['y'] = Math['round'](aw['y']),
                                  aw['z'] = Math['round'](aw['z'])) : (aw['x'] = 5 * Math['round'](aw['x'] /
                                    5),
                                  aw['y'] = 5 * Math['round'](aw['y'] / 5),
                                  aw['z'] = 5 * Math['round'](aw['z'] / 5)),
                                scene['userData']['temp_line']['position']['copy'](aw),
                                as[0]['object']['name']) {
                                case 'floor':
                                  1 == global_options['mouse_mode']['target'] ? (ax['z'] = room['params'][
                                      'depth'
                                    ] / units / 2,
                                    ay['z'] = ax['z'],
                                    ay['x'] = aw['x']) : (ax['x'] = room['params']['width'] / units / 2,
                                    ay['x'] = ax['x'],
                                    ay['z'] = aw['z']);
                                  break;
                                case 'left_wall':
                                  1 == global_options['mouse_mode']['target'] ? (ax['y'] = ay['y'] = room[
                                      'params']['height'] / units / 2,
                                    ax['z'] = room['params']['depth'] / units,
                                    ay['z'] = aw['z']) : (ax['z'] = ay['z'] = room['params']['depth'] / units /
                                    2,
                                    ay['y'] = aw['y']);
                                  break;
                                case 'right_wall':
                                  1 == global_options['mouse_mode']['target'] ? (ax['y'] = ay['y'] = room[
                                      'params']['height'] / units / 2,
                                    ax['x'] = ay['x'] = room['params']['width'] / units,
                                    ay['z'] = aw['z']) : (ax['x'] = ay['x'] = room['params']['width'] / units,
                                    ax['z'] = ay['z'] = room['params']['depth'] / units / 2,
                                    ay['y'] = aw['y']);
                                  break;
                                case 'front_wall':
                                  1 == global_options['mouse_mode']['target'] ? (ax['y'] = ay['y'] = room[
                                      'params']['height'] / units / 2,
                                    ay['x'] = aw['x']) : (ax['x'] = ay['x'] = room['params']['width'] / units /
                                    2,
                                    ay['y'] = aw['y']);
                                  break;
                                case 'back_wall':
                                  1 == global_options['mouse_mode']['target'] ? (ax['x'] = room['params'][
                                        'width'
                                      ] / units,
                                      ax['y'] = ay['y'] = room['params']['height'] / units / 2,
                                      ay['x'] = aw['x']) : (ax['x'] = ay['x'] = room['params']['width'] / units /
                                      2,
                                      ay['y'] = aw['y']),
                                    ax['z'] = ay['z'] = room['params']['depth'] / units;
                                  break;
                              }
                              scene['userData']['ruler']['show'](),
                                scene['userData']['ruler']['rebuild']({
                                  'p1': ax,
                                  'p2': ay
                                });
                            } else
                              J = null;
                          }
                        } else {
                          if (G) {
                            for (let aK = 0; aK < q.length; aK++)
                              q[aK]['hide_snap_points']();
                            if ('r' == a0['mode'] && (g['ray']['intersectPlane'](f, j),
                                aq = ae(new THREE['Vector2'](0, 1), new THREE['Vector2'](j['x'] - G[
                                  'position']['x'], j['z'] - G['position']['z'])),
                                ap['ctrlKey'] ? G['rotation']['y'] = aq : G['rotation']['y'] = af(aq)),
                              'd' == a0['mode']) {
                              var ar = g['intersectObjects'](ad(ap), true);
                              if (ar.length) {
                                var aq = new THREE['Matrix3']()['getNormalMatrix'](ar[0]['object'][
                                    'matrixWorld']),
                                  aq = ar[0]['face']['normal']['applyMatrix3'](aq)['normalize']();

                                function aL(aM) {
                                  return -0.0001 < aM && aM < 0.0001;
                                }
                                i['x'] = aL(aq['x']) ? i['x'] : 0,
                                  i['y'] = aL(aq['y']) ? i['y'] : 0,
                                  i['z'] = aL(aq['z']) ? i['z'] : 0;
                                var aq = ar[0]['point']['sub'](i)['applyMatrix4'](l);
                                if (pp_keyboard['c'] && 1 !== G['copied'] && 1 !== n) {
                                  if ('drag_group' == G['object_type']) {
                                    G['unselect']();
                                    var az = G['copypaste']();
                                    az['params']['is_new'] = 0,
                                      az['copied'] = 1;
                                  } else {
                                    var az = copy_object(G['params']);
                                    az['obj_id'] = void 0,
                                      az['is_new'] = 0;
                                    let aM = [];
                                    'Cabinet' == az['type'] && (aM = copy_object(az['accessories_list']),
                                      az['accessories_list'] = []);
                                    var au = G['rotation']['y'],
                                      aA = sc['add_object'](G['params']['object_type'], az);
                                    aA['rotation']['y'] = au;
                                    for (let aN = 0; aN < aM.length; aN++) {
                                      var aB = aM[aN],
                                        aC = copy_object(accsessories_data['items'][aB['id']]);
                                      pp['interface']['root']['$emit']('add_cart_item', aC, aB['count'], aA[
                                        'params']['obj_id']);
                                    }
                                    aA['copied'] = 1,
                                      G['unselect']();
                                  }
                                }
                                ap['ctrlKey'] || 'floor' == ar[0]['object']['name'] || 'ceiling' == ar[0][
                                    'object'
                                  ]['name'] || 'drag_group' == G['temp_type'] || G['userData']['interaction'][
                                    'movement_locked'
                                  ] || (G['rotation']['y'] = ar[0]['object']['rotation']['y']),
                                  G['move2'](aq, ap),
                                  autosave();
                              }
                              if (G['temp_type'] && 'CabinetN' == G['temp_type'] && 1 == G['userData']['params']
                                ['spec']['is_fill']) {
                                G['drag_mode'] = 'surface';
                                let aO = [];
                                for (let aP = 0; aP < room['active_objects']['length']; aP++)
                                  'CabinetN' === room['active_objects'][aP]['temp_type'] && 1 != room[
                                    'active_objects'][aP]['userData']['params']['spec']['is_fill'] && (aO = aO[
                                    'concat'](room['active_objects'][aP]['get_drag_areas'](G['userData'][
                                    'params'
                                  ]['id'])));
                                var az = g['intersectObjects'](aO, true);
                                az.length && az[0]['object'] ? (m && m['material']['color']['setHex'](
                                    9880214),
                                  (m = az[0]['object'])['material']['color']['setHex'](2719444)) : (m && m[
                                    'material']['color']['setHex'](9880214),
                                  m = null);
                              }
                            }
                            a0['dispatchEvent']({
                              'type': 'drag',
                              'object': G
                            });
                          } else {
                            if ('mouse' === ap['pointerType'] || 'pen' === ap['pointerType']) {
                              for (Q.length = 0,
                                g['setFromCamera'](h, A),
                                g['intersectObjects'](q, true, Q); Q[0] && Q[0]['object'] && 'Sprite' === Q[
                                  0]['object']['type'];)
                                Q['shift']();
                              0 < Q.length ? (au = Q[0]['object'],
                                J !== au && null !== J && (a0['dispatchEvent']({
                                    'type': 'hoveroff',
                                    'object': J
                                  }),
                                  B['style']['cursor'] = 'auto',
                                  J = null),
                                J !== au && (a0['dispatchEvent']({
                                    'type': 'hoveron',
                                    'object': au
                                  }),
                                  B['style']['cursor'] = 'pointer',
                                  J = au)) : null !== J && (a0['dispatchEvent']({
                                  'type': 'hoveroff',
                                  'object': J
                                }),
                                B['style']['cursor'] = 'auto',
                                J = null);
                            }
                            if (helper['isDown']) {
                              for (let aQ = 0; aQ < selectionBox['collection']['length']; aQ++)
                                selectionBox['collection'][aQ]['unselect']();
                              selectionBox['endPoint']['set'](ap['clientX'] / window['innerWidth'] * 2 - 1, -
                                ap['clientY'] / window['innerHeight'] * 2 + 1, 0.5);
                              var aD = selectionBox['select']();
                              for (let aR = 0; aR < aD.length; aR++)
                                selectionBox['collection'][aR]['select']();
                            }
                          }
                        }
                      }
                    }
                  }
                }

                function a8(ap) {
                  if (false !== a0['enabled']) {
                    if (1 < interface_version && 'r' != a0['mode'] && pp['interface']['root']['radial_hide'](),
                      G) {
                      if (0 == G['position']['x'] && 0 == G['position']['z'])
                        return G['delete'](),
                          void(pp['interface']['root'] && pp['interface']['root']['tmp_dis']());
                      'not_loaded' === G['model_loaded'] && G['load_model'](),
                        a0['dispatchEvent']({
                          'type': 'dragend',
                          'object': G
                        }),
                        G['write_points'](),
                        G['hide_snap_points']();
                      for (let au = 0; au < q.length; au++)
                        q[au]['hide_snap_points']();
                      if (G['temp_type'] && 'CabinetN' == G['temp_type'] && 1 == G['userData']['params']['spec']
                        ['is_fill']) {
                        for (let av = room['active_objects']['length']; av--;) {
                          var aq = room['active_objects'][av];
                          'CabinetN' == aq['temp_type'] && aq['hide_drag_areas']();
                        }
                        var ar, as;
                        m && (ar = m['parent']['parent']['userData']['root'],
                            as = m['parent']['parent'],
                            ar['add_drag_child'](G['userData']['params']['id'], as, G['userData']['params']),
                            m && m['material']['color']['setHex'](9880214),
                            m = null),
                          G['delete'](),
                          G = null,
                          a0['s_helper']['hide'](),
                          pp['interface']['root'] && pp['interface']['root']['tmp_dis'](),
                          autosave();
                      }
                      if (ap['type']['indexOf']('touch') < 0)
                        switch (ap['which']) {
                          case 1:
                            ap['altKey'] || 'r' == a0['mode'] || custom_settings['radial_rmb'] || 'function' ==
                              typeof G['show_radial_menu'] && G['show_radial_menu'](ap['clientX'], ap['clientY']),
                              G && 'function' == typeof G['build_from_wall_sizes'] && G['build_from_wall_sizes'](!
                                0);
                            break;
                          case 2:
                            break;
                          case 3:
                            ap['preventDefault'](),
                              custom_settings['radial_rmb'] && 'function' == typeof G['show_radial_menu'] && G[
                                'show_radial_menu'](ap['clientX'], ap['clientY']);
                        }
                      else
                        'function' == typeof G['show_radial_menu'] && G['show_radial_menu'](ap['clientX'], ap[
                          'clientY']);
                      G['copied'] = 0,
                        1 == custom_settings['show_panel_on_new_module'] && (pp['interface']['root']['$emit'](
                            'show_object_panel'),
                          sc['select_object'](G)),
                        G = null,
                        this['has_selected'] = false,
                        Z = null,
                        i['set'](0, 0, 0);
                    }
                    var ar, at;
                    'r' == a0['mode'] && a0['r_el'] && (a0['r_el']['style']['pointerEvents'] = 'auto',
                        a0['r_el']['style']['left'] = '-15px',
                        a0['r_el']['style']['top'] = '-50px',
                        pp['interface']['root']) && (pp['interface']['root']['$refs']['radial_menu'][
                        'rotating'] = false),
                      pp['interface']['root'] && pp['interface']['root']['tmp_dis'](),
                      a0['mode'] = 'd',
                      B['style']['cursor'] = J ? 'pointer' : 'auto',
                      helper['isDown'] && (selectionBox['endPoint']['set'](ap['clientX'] / window['innerWidth'] *
                          2 - 1, -ap['clientY'] / window['innerHeight'] * 2 + 1, 0.5),
                        (ar = selectionBox['select']())['length'] && 1 < ar.length && sc['add_object'](
                          'drag_group', {}, false)['add_objects'](ar),
                        a0['dispatchEvent']({
                          'type': 'dragend',
                          'object': G
                        })),
                      n = 0,
                      a0['dispatchEvent']({
                        'type': 'dragend',
                        'object': G
                      });
                  }
                }

                function a9(ap) {
                  if (ap[0]['object']['no_click_event'] && ap['shift'](),
                    'function' == typeof Slider) {
                    var aq = aj(ap[0]['object']);
                    if (aq)
                      return void aq['animate']();
                  } -
                  1 < ap[0]['object']['name']['indexOf']('door_rtl') && ap[0]['object']['click'](),
                    -1 < ap[0]['object']['name']['indexOf']('door_ltr') && ap[0]['object']['click'](),
                    -1 < ap[0]['object']['name']['indexOf']('door_simple_top') && ap[0]['object']['click']
                  (),
                    -1 < ap[0]['object']['name']['indexOf']('door_simple_bottom') && ap[0]['object'][
                      'click'](),
                    ap[0]['object']['parent']['o_type'] && 'Locker' === ap[0]['object']['parent']['o_type'] &&
                    ap[0]['object']['parent']['click'](),
                    ap[0]['object']['parent']['parent']['o_type'] && 'Locker' === ap[0]['object']['parent'][
                      'parent'
                    ]['o_type'] ? ap[0]['object']['parent']['parent']['click']() : ap[0]['object']['parent'][
                      'parent'
                    ]['parent']['o_type'] && 'Locker' === ap[0]['object']['parent']['parent']['parent'][
                      'o_type'] ? ap[0]['object']['parent']['parent']['parent']['click']() : ap[0]['object'][
                      'parent'
                    ]['parent']['parent']['parent']['o_type'] && 'Locker' === ap[0]['object']['parent'][
                      'parent']['parent']['parent']['o_type'] && ap[0]['object']['parent']['parent']['parent'][
                      'parent'
                    ]['click']();
                }

                function aa(ap) {
                  var aq = B['getBoundingClientRect']();
                  h['x'] = (ap['clientX'] - aq['left']) / aq['width'] * 2 - 1,
                    h['y'] = -(ap['clientY'] - aq['top']) / aq['height'] * 2 + 1;
                }

                function ab() {
                  var ap = [];
                  ap.push(room['left_wall']),
                    ap.push(room['right_wall']),
                    ap.push(room['front_wall']),
                    ap.push(room['back_wall']);
                  for (let aq = q.length; aq--;)
                    'Shaft' == q[aq]['temp_type'] && ap.push(q[aq]);
                  return ap;
                }

                function ac(ap) {
                  var aq = [];
                  for (let as = q.length; as--;) {
                    if ('CabinetN' == q[as]['temp_type']) {
                      var ar = q[as]['get_draggables']();
                      for (let at = ar.length; at--;)
                        aq.push(ar[at]);
                    }
                    aq.push(q[as]);
                  }
                  return aq;
                }

                function ad(ap) {
                  var aq = [];
                  let ar = 0;
                  G && 'Shaft' == G['type'] && (ar = 1);
                  for (let as = room['walls_objects']['length']; as--;)
                    1 == ar && room['walls_objects'][as]['uuid'] == G['uuid'] || aq.push(room[
                      'walls_objects'][as]);
                  if (ap['ctrlKey'] || 'surface' == G['drag_mode']) {
                    for (let at = q.length; at--;)
                      G['uuid'] != q[at]['uuid'] && aq.push(q[at]);
                  }
                  return aq;
                }

                function ae(ap, aq) {
                  var ar = ap['x'] * aq['x'] + ap['y'] * aq['y'],
                    as, at;
                  return -Math['atan2'](ap['x'] * aq['y'] - ap['y'] * aq['x'], ar);
                }

                function af(ap) {
                  for (var aq = -12; aq <= 12; aq++)
                    if (Math['abs'](ap - aq * (Math['PI'] / 12)) < a0['rotation_snap_tolerance']) {
                      ap = aq * (Math['PI'] / 12);
                      break;
                    }
                  return ap;
                }

                function ag(ap, aq) {
                  var ar;
                  let as = 0;
                  return ap['userData'] && 1 == ap['userData']['grouped'] && (as = 1),
                    pp_keyboard['r'] && (as = 0),
                    !{
                      'cabinet': 1,
                      'drag_group': 1,
                      'washer': 1,
                      'wall': 1
                    } [ap['object_type']] || ap['userData'] && as ? ag(ap['parent'], aq) : ap;
                }

                function ah(ap) {
                  return ap instanceof Draggable ? ap : ap['parent'] ? ah(ap['parent']) : null;
                }

                function ai(ap) {
                  ap instanceof Door_new || ap instanceof Locker_new || ap instanceof Decoration ||
                    ap instanceof Facade || ap['parent'] && ak(ap['parent']);
                }

                function aj(ap) {
                  return ap instanceof Slider || ap instanceof Rotator ? ap : ap['parent'] ? aj(ap['parent']) :
                    null;
                }

                function ak(ap) {
                  return ap instanceof Door_new || ap instanceof Locker_new || ap instanceof Decoration ||
                    ap instanceof Facade ? ap : ap['parent'] ? ak(ap['parent']) : null;
                }

                function al(ap) {
                  return 'cabinet' === ap['object_type'] || 'wall' === ap['object_type'] || 'washer' === ap[
                    'object_type'] ? ap : al(ap['parent']);
                }

                function am() {
                  let ap = [];
                  for (let aq = room['active_objects']['length']; aq--;)
                    'function' == typeof room['active_objects'][aq]['get_ruler_points'] && (ap = ap['concat'](
                      room['active_objects'][aq]['get_ruler_points']()));
                  return ap;
                }

                function an() {
                  return scene['userData']['rulers']['children'];
                }

                function ao(ap) {
                  G = ap,
                    n = 1,
                    '110' == THREE['REVISION'] ? l = new THREE['Matrix4']()['getInverse'](G['parent'][
                      'matrixWorld'
                    ]['clone']()) : l['copy'](G['parent']['matrixWorld'])['invert'](),
                    i['copy'](new THREE['Vector3']())['sub'](k['setFromMatrixPosition'](G['matrixWorld']));
                }
                this['set_sel'] = function(ap) {
                    G = ap;
                  },
                  a1(),
                  this['enabled'] = true,
                  this['transformGroup'] = false,
                  this['activate'] = a1,
                  this['deactivate'] = a2,
                  this['dispose'] = a3,
                  this['getObjects'] = a4,
                  this['getRaycaster'] = a5,
                  this['set_selected'] = ao;
              }
              ['select_object'](p) {
                sc['select_object'](p),
                  this['set_sel'](p),
                  'function' == typeof p['select'] && p['select']();
              }
              ['clear_selected']() {
                active_el && 'function' == typeof active_el['unselect'] && active_el['unselect']();
              }
              ['hide_helper']() {}
          }
          THREE['DragControls2'] = o;
        })());
        class Draggable extends Section {
          constructor(f = {}, g = {
              'parent': null,
              'root': null,
              'path': null
            }) {
              super(f, g),
                this['userData']['is_draggable'] = true,
                this['object_type'] = 'draggable',
                this['userData']['interaction']['is_fill'] = 1,
                this['temp_type'] = 'Draggable';
            }
            ['build']() {
              super['build'](),
                this['build_selector']();
            }
            ['change_size'](f = null) {
              var g = this['userData']['parent'],
                j = this['userData']['params']['spec']['fill']['size'],
                k = this['position'],
                q = this['userData']['computed']['size'];
              let w = -g['userData']['size']['x'] / units / 2,
                A = g['userData']['size']['x'] / units / 2,
                B = -g['userData']['size']['y'] / units / 2,
                C = g['userData']['size']['y'] / units / 2,
                E = -g['userData']['size']['z'] / units / 2,
                F = g['userData']['size']['z'] / units / 2,
                G = (1 == j['x'] && (w = k['x'] - q['x'] / units / 2,
                    A = k['x'] + q['x'] / units / 2),
                  1 == j['y'] && (B = k['y'] - q['y'] / units / 2,
                    C = k['y'] + q['y'] / units / 2),
                  1 == j['z'] && (E = k['z'] - q['z'] / units / 2,
                    F = k['z'] + q['z'] / units / 2),
                  1),
                H = 1,
                I = 1;
              0 == j['x'] && (G = 2),
                0 == j['y'] && (H = 2),
                0 == j['z'] && (I = 2);
              var J = new THREE['Box3']()['setFromCenterAndSize'](this['position']['clone'](), new THREE['Vector3']((A -
                  w) * G, (C - B) * H, (F - E) * I))['clone'](),
                K = [];
              let L = [],
                N = [];
              for (let R = g['userData']['children']['length']; R--;) {
                var O = g['userData']['children'][R];
                O['uuid'] != this['uuid'] && K.push(O['get_local_box']());
              }
              0 == j['x'] && (L.push(-g['userData']['size']['x'] / units / 2),
                  L.push(g['userData']['size']['x'] / units / 2)),
                0 == j['y'] && (N.push(-g['userData']['size']['y'] / units / 2),
                  N.push(g['userData']['size']['y'] / units / 2));
              for (let S = 0; S < K.length; S++)
                J['intersectsBox'](K[S]) && (K[S]['center'] = K[S]['getCenter'](),
                  0 == j['x'] && (L.push(K[S]['min']['x']),
                    L.push(K[S]['max']['x'])),
                  0 == j['y']) && (N.push(K[S]['min']['y']),
                  N.push(K[S]['max']['y']));
              let P = null,
                Q = null;
              0 == j['x'] && (L.push(k['x']),
                  L = _['sortBy'](L),
                  P = get_min_max(k['x'], L)),
                0 == j['y'] && (N.push(k['y']),
                  N = _['sortBy'](N),
                  Q = get_min_max(k['y'], N));
              var q = {
                  'min': {
                    'x': null == P ? w : P['min'],
                    'y': null == Q ? B : Q['min'],
                    'z': E
                  },
                  'max': {
                    'x': null == P ? A : P['max'],
                    'y': null == Q ? C : Q['max'],
                    'z': F
                  }
                },
                k = (q['center'] = {
                    'x': (q['max']['x'] + q['min']['x']) / 2,
                    'y': (q['max']['y'] + q['min']['y']) / 2,
                    'z': (q['max']['z'] + q['min']['z']) / 2
                  },
                  q['size'] = {
                    'x': q['max']['x'] - q['min']['x'],
                    'y': q['max']['y'] - q['min']['y'],
                    'z': q['max']['z'] - q['min']['z']
                  },
                  new THREE['Box3']()['setFromCenterAndSize'](new THREE['Vector3'](q['center']['x'], q['center']['z'],
                    q['center']['z']), new THREE['Vector3'](q['size']['x'], q['size']['y'], q['size']['z'])));
              scene['add'](new Box_helper(k, new THREE['LineBasicMaterial']({
                'color': '#2b7537'
              })));
            }
            ['add_child'](f, g) {
              let h = 1;
              var g = this['userData']['path2'] + ',' + g,
                i;
              try {
                return f['condition'] && (h = check_condition(f['condition'], {
                    'computed': this['userData']['root']['userData']['computed']['computed'],
                    'variables': this['userData']['computed']['variables']
                  })),
                  f['visible'] = h,
                  f['visible'] && (i = void 0 !== this['userData']['parent_params']['local_parent'] ? this['userData']
                    ['parent_params']['local_parent'] : null,
                    this['add_object'](new item_types[f['type']](f, {
                      'parent': this,
                      'root': this['userData']['root'],
                      'path': g,
                      'local_parent': this,
                      'is_draggable_child': 1
                    }))),
                  g;
              } catch (j) {}
            }
            ['set_size'](f, g, h) {
              this['userData']['computed']['size']['x'] = f,
                this['userData']['computed']['size']['y'] = g,
                this['userData']['computed']['size']['z'] = h,
                this['userData']['size'] = copy_object(this['userData']['computed']['size']);
              var i = this['userData']['params'];
              i['size'] = {
                  'x': f,
                  'y': g,
                  'z': h
                },
                this['rebuild'](i);
            }
            ['set_temp_size'](f, g, h) {
              this['userData']['real_size'] = copy_object(this['userData']['params']['size']),
                this['userData']['params']['size'] = {
                  'x': f,
                  'y': g,
                  'z': h
                },
                this['rebuild'](this['userData']['params']);
            }
            ['set_real_size']() {
              this['userData']['params']['size'] = this['userData']['real_size'],
                this['rebuild'](this['userData']['params']);
            }
            ['show_radial_menu'](f, g) {
              pp['interface']['root'] && pp['interface']['root']['radial']({
                'obj_type': this['type'],
                'obj': {
                  'open_doors': false,
                  'erase': false,
                  'rotate': false,
                  'copypaste': false,
                  'move_lock': false
                },
                'left': f,
                'top': g
              });
            }
            ['check_box']() {}
            ['delete']() {
              this['userData']['root']['remove_draggable_2'](this),
                'function' == typeof this['userData']['parent']['build_drag_sizes'] && this['userData']['parent'][
                  'build_drag_sizes'
                ]();
            }
            ['check_fill_enabled']() {
              return false;
            }
            ['get_variables']() {
              let e = [];
              return Object['keys'](this['userData']['computed']['variables'])['forEach'](f => {
                  1 == this['userData']['computed']['variables'][f]['local'] && 1 == this['userData']['computed'][
                    'variables'
                  ][f]['editable'] && e.push(this['userData']['computed']['variables'][f]);
                }),
                copy_object(e);
            }
            ['get_local_variables_array']() {
              return this['get_variables']();
            }
            ['change_variable'](f, g) {
              var h;
              this['userData']['params']['variables'][f] || (this['userData']['params']['variables'][f] = copy_object(
                  this['userData']['computed']['variables'][f])),
                this['userData']['params']['variables'][f]['value'] = g,
                this['userData']['computed']['variables'][f]['value'] = g,
                this['userData']['root']['change_param'](this['userData']['path2'], 'variables.' + f + '.value', g, !
                  1),
                this['build'](true),
                pp['interface']['root'] && pp['interface']['root']['set_selected'](active_el);
            }
            ['change_pos'](f, g) {
              var g = g + this['userData']['computed']['size'][f] / 2,
                h, i = (this['userData']['root']['change_param'](this['userData']['path2'], 'pos.' + f, g, false),
                  (-this['userData']['parent']['userData']['computed']['size'][f] / 2 + g) / units);
              this['position'][f] = i,
                this['userData']['params']['pos'][f] = g,
                this['userData']['computed']['pos'][f] = g,
                setTimeout(j => {
                  this['userData']['parent']['build_drag_sizes']();
                }, 100);
            }
            ['build_selector']() {
              this['userData']['selector'] && this['remove'](this['userData']['selector']),
                this['userData']['selector'] = make_cube(this['userData']['computed']['size']['x'] / units, this[
                    'userData']['computed']['size']['y'] / units, this['userData']['computed']['size']['z'] / units,
                  transparent_material),
                this['userData']['selector']['userData']['mouse_events'] = false,
                this['userData']['selector']['position']['copy'](this['userData']['object']['position']),
                this['userData']['selector']['rotation']['copy'](this['userData']['object']['rotation']),
                this['add'](this['userData']['selector']);
            }
            ['hover_on']() {
              this['userData']['selector']['material'] = misc_mats['mouse_target_hovered'];
            }
            ['hover_off']() {
              this['userData']['selector']['material'] = misc_mats['mouse_target']();
            }
        }
        class Facade extends Section {
          constructor(e = {}, f = {
              'parent': null,
              'root': null,
              'path': null
            }) {
              super(e, f);
            }
            ['build_computed']() {
              super['build_computed'](),
                this['userData']['computed']['thickness'] = 18;
            }
            ['b_size']() {
              this['userData']['params']['size']['z'] = this['userData']['computed']['thickness'],
                super['b_size']();
            }
            ['build_params'](f = {}) {
              super['build_params'](f),
                0 == this['userData']['params']['spec']['id'] && (this['userData']['params']['spec']['id'] = this[
                  'userData']['root']['userData']['params']['spec']['facades']['model']);
              let g = facades_lib['get_item'](this['userData']['params']['spec']['id']);
              g['thickness'] && (this['userData']['computed']['thickness'] = parseInt(g['thickness'])),
                g['additional_materials'] && Object['keys'](g['additional_materials'])['forEach'](i => {
                  this['userData']['params']['spec']['materials'][i] = parseInt(g['additional_materials'][i][
                    'selected'
                  ]);
                });
              var f = this['userData']['root']['userData']['params']['path_params'];
              let h;
              f[this['userData']['path2']] && f[this['userData']['path2']]['materials'] && f[this['userData']['path2']][
                  'materials'
                ]['gen'] && (h = f[this['userData']['path2']]['materials']['gen']),
                this['userData']['params']['spec']['materials']['gen'] = void 0 !== h ? h : this['userData']['root'][
                  'userData'
                ]['params']['spec']['facades']['materials']['gen'],
                'auto' == this['userData']['params']['spec']['group'] && (this['userData']['params']['spec']['group'] =
                  this['userData']['root']['userData']['params']['spec']['group']),
                this['userData']['root']['params']['spec']['facades']['items'][this['userData']['path2']] && (this[
                    'userData']['params']['spec']['id'] = this['userData']['root']['params']['spec']['facades']['items']
                  [this['userData']['path2']]['id'],
                  this['userData']['params']['spec']['materials'] = this['userData']['root']['params']['spec'][
                    'facades']['items'][this['userData']['path2']]['materials'],
                  this['userData']['params']['spec']['style'] = this['userData']['root']['params']['spec']['facades'][
                    'items'
                  ][this['userData']['path2']]['style'],
                  this['userData']['params']['spec']['group'] = this['userData']['root']['params']['spec']['facades'][
                    'items'
                  ][this['userData']['path2']]['group'],
                  this['userData']['params']['spec']['handle'] = this['userData']['root']['params']['spec']['facades'][
                    'items'
                  ][this['userData']['path2']]['handle']),
                'a' == this['userData']['params']['spec']['handle']['orient'] && this['userData']['root']['params'][
                  'spec'
                ]['handles']['hg_params'][this['userData']['params']['spec']['handle']['h_group']]['orient'] && (this[
                  'userData']['params']['spec']['handle']['orient'] = this['userData']['root']['params']['spec'][
                  'handles'
                ]['hg_params'][this['userData']['params']['spec']['handle']['h_group']]['orient']),
                'a' == this['userData']['params']['spec']['handle']['pos']['x'] && this['userData']['root']['params'][
                  'spec'
                ]['handles']['hg_params'][this['userData']['params']['spec']['handle']['h_group']]['pos'] && (this[
                  'userData']['params']['spec']['handle']['pos']['x'] = this['userData']['root']['params']['spec'][
                  'handles'
                ]['hg_params'][this['userData']['params']['spec']['handle']['h_group']]['pos']['x']),
                'a' == this['userData']['params']['spec']['handle']['pos']['y'] && this['userData']['root']['params'][
                  'spec'
                ]['handles']['hg_params'][this['userData']['params']['spec']['handle']['h_group']]['pos'] && (this[
                  'userData']['params']['spec']['handle']['pos']['y'] = this['userData']['root']['params']['spec'][
                  'handles'
                ]['hg_params'][this['userData']['params']['spec']['handle']['h_group']]['pos']['y']),
                0 == this['userData']['params']['spec']['handle']['id'] && (this['userData']['params']['spec'][
                    'handle'
                  ]['id'] = this['userData']['root']['userData']['params']['spec']['handles']['id'],
                  this['userData']['params']['spec']['handle']['p_size'] = this['userData']['root']['userData'][
                    'params']['spec']['handles']['size']),
                null != g['handle_offset'] && (this['userData']['params']['spec']['handle']['offset'] = g[
                  'handle_offset']),
                this['userData']['handle_model'] = handles_lib['get_item'](this['userData']['params']['spec']['handle'][
                  'id'
                ]),
                this['set_root_params']();
            }
          async ['b_spec']() {
              this['get_model'](),
                await this['load_model'](),
                this['get_handle_model'](),
                this['compute_size'](),
                this['set_size'](),
                this['apply_materials'](),
                this['build_handle'](),
                setTimeout(() => {
                  this['visible'] = this['userData']['root']['userData']['facades_visible'];
                }, 10);
            }
            ['compute_size']() {
              var e, e, e, f;
              this['userData']['params']['spec']['handle']['active'] && 'facade_profile' == (e = this['userData'][
                'handle_model'
              ])['type'] && (e = e['sizes'][this['userData']['params']['spec']['handle']['c_size']],
                f = (e = parseFloat(e['height']) - parseFloat(e['offset_y'])) / units / 2,
                'h' == this['userData']['params']['spec']['handle']['orient'] ? (this['userData']['size']['y'] -= e,
                  'b' == this['userData']['params']['spec']['handle']['pos']['y'] ? this['userData']['own_object'][
                    'position'
                  ]['y'] += f : this['userData']['own_object']['position']['y'] -= f) : (this['userData']['size'][
                  'x'] -= e,
                  'l' == this['userData']['params']['spec']['handle']['pos']['x'] ? this['userData']['own_object'][
                    'position'
                  ]['x'] += f : this['userData']['own_object']['position']['x'] -= f));
            }
            ['build_handle']() {
              this['userData']['handle_params'] && (this['userData']['handle'] = new HandleCN(this['userData'][
                  'handle_params'
                ], this, this['userData']['root'], this['userData']['path'] + ',0'),
                this['add_object'](this['userData']['handle']));
            }
            ['get_model']() {
              var f = this['userData']['params'],
                g = facades_lib['get_item'](f['spec']['id']);
              let j = f['spec']['style'];
              var k = f['spec']['group'],
                m = this['userData']['size']['y'],
                n = this['userData']['size']['x'],
                q = (isNaN(parseInt(j)) && (j = g['compatibility_types'][j] || Object['keys'](g['types'])[0]),
                  []);
              let u = 'no_model';
              var v = g['types'][j]['items'];
              for (let y = 0; y < v.length; y++)
                if (v[y]['group'] || (v[y]['group'] = 'all'),
                  'all' != v[y]['group'] && v[y]['group'] != k || (v[y]['min_height'] = parseInt(v[y]['min_height']),
                    0 === v[y]['min_height'] && q.push(v[y]),
                    m >= v[y]['min_height'] && q.push(v[y])),
                  q.length)
                  for (let z = 0; z < q.length; z++) {
                    var w = q[z],
                      x = q[z + 1];
                    w['min_width'] = parseInt(w['min_width']),
                      n >= w['min_width'] && (!x || (x['min_width'] = parseInt(x['min_width']),
                        n <= x['min_width'])) && (u = w['model']);
                  }
              this['userData']['computed']['model'] = u;
            }
            ['get_handle_model']() {
              var f, g, h, i, h;
              this['userData']['handle_params'] = false,
                this['userData']['params']['spec']['handle']['active'] && (f = this['userData']['handle_model'],
                  (g = dp['get']('handle'))['spec']['own'] = 0,
                  g['spec']['id'] = this['userData']['params']['spec']['handle']['id'],
                  this['get_handle_size'](),
                  g['spec']['size_index'] = this['userData']['params']['spec']['handle']['c_size'],
                  g['spec']['orient'] = this['userData']['params']['spec']['handle']['orient'],
                  h = this['userData']['params']['spec']['handle']['offset'],
                  i = f['sizes'][this['userData']['params']['spec']['handle']['c_size']],
                  h = {
                    'common': {
                      'x': {
                        'l': {
                          'pivot': {
                            'x': -1
                          },
                          'pos': {
                            'x': h
                          }
                        },
                        'c': {
                          'pivot': {
                            'x': 0
                          },
                          'pos': {
                            'x': 's:x\x20/\x202'
                          }
                        },
                        'r': {
                          'pivot': {
                            'x': 1
                          },
                          'pos': {
                            'x': 's:x\x20-\x20' + h
                          }
                        }
                      },
                      'y': {
                        'b': {
                          'pivot': {
                            'y': -1
                          },
                          'pos': {
                            'y': h
                          }
                        },
                        'c': {
                          'pivot': {
                            'y': 0
                          },
                          'pos': {
                            'y': 's:y\x20/\x202'
                          }
                        },
                        't': {
                          'pivot': {
                            'y': 1
                          },
                          'pos': {
                            'y': 's:y\x20\x20-\x20' + h
                          }
                        }
                      }
                    },
                    'facade_profile': {
                      'x': {
                        'l': {
                          'pivot': {
                            'x': -1
                          },
                          'pos': {
                            'x': parseFloat(i['height']) / 2
                          }
                        },
                        'c': {
                          'pivot': {
                            'x': 0
                          },
                          'pos': {
                            'x': 's:x\x20/\x202'
                          }
                        },
                        'r': {
                          'pivot': {
                            'x': 1
                          },
                          'pos': {
                            'x': 's:x\x20-\x20' + parseFloat(i['height']) / 2
                          }
                        }
                      },
                      'y': {
                        'b': {
                          'pivot': {
                            'y': -1
                          },
                          'pos': {
                            'y': parseFloat(i['height']) / 2
                          }
                        },
                        'c': {
                          'pivot': {
                            'y': 0
                          },
                          'pos': {
                            'y': 's:y\x20/\x202'
                          }
                        },
                        't': {
                          'pivot': {
                            'y': 1
                          },
                          'pos': {
                            'y': 's:y\x20-\x20' + parseFloat(i['height']) / 2
                          }
                        }
                      }
                    }
                  },
                  g['pos']['x'] = h[f['type']]['x'][this['userData']['params']['spec']['handle']['pos']['x']]['pos'][
                    'x'],
                  g['pivot']['x'] = h[f['type']]['x'][this['userData']['params']['spec']['handle']['pos']['x']]['pivot']
                  ['x'],
                  g['pos']['y'] = h[f['type']]['y'][this['userData']['params']['spec']['handle']['pos']['y']]['pos'][
                    'y'],
                  g['pivot']['y'] = h[f['type']]['y'][this['userData']['params']['spec']['handle']['pos']['y']]['pivot']
                  ['y'],
                  'common' == f['type'] && (g['pos']['z'] = 's:z'),
                  'facade_profile' == f['type'] && ('h' == this['userData']['params']['spec']['handle']['orient'] ? g[
                      'spec']['dir'] = this['userData']['params']['spec']['handle']['pos']['y'] : g['spec']['dir'] =
                    this['userData']['params']['spec']['handle']['pos']['x']),
                  this['userData']['handle_params'] = g);
            }
            ['get_handle_size']() {
              let f = this['userData']['params']['spec']['handle']['p_size'];
              var g = this['userData']['handle_model'],
                h = (f > g['sizes']['length'] - 1 && (f = g['sizes']['length'] - 1),
                  parseInt(g['sizes'][f]['width'])),
                i = 'h' == this['userData']['params']['spec']['handle']['orient'] ? this['userData']['computed']['size']
                ['x'] : this['userData']['computed']['size']['y'];
              if (i < h) {
                for (let j = f; j--;)
                  if (parseInt(g['sizes'][j]['width']) <= i) {
                    f = j;
                    break;
                  }
              }
              return this['userData']['params']['spec']['handle']['c_size'] = f;
            }
          async ['load_model']() {
              var f = await load_model({
                'model': this['userData']['computed']['model'],
                'buffer': true,
                'no_cache': -1 < this['userData']['computed']['model']['indexOf']('data:application')
              });
              for (let h = 0; h < f.length; h++) {
                var g = new THREE['Mesh'](f[h]['clone'](), red_mat);
                g['name'] = f[h]['name'],
                  g['castShadow'] = true,
                  g['receiveShadow'] = true,
                  g['userData']['edgesModeType'] = ObjectType['Facade'],
                  this['add_own_object'](g);
              }
              'function' == typeof pp['events']['parts']['facade_after_load_model'] && pp['events']['parts'][
                'facade_after_load_model'
              ](this);
            }
            ['set_size']() {
              var f = this['userData']['own_object'],
                g = {
                  'x': this['userData']['size']['x'] / units,
                  'y': this['userData']['size']['y'] / units,
                  'z': this['userData']['computed']['thickness'] / units
                },
                h = f['rotation']['clone'](),
                j = (f['rotation']['set'](0, 0, 0),
                  new THREE['Euler']()['setFromQuaternion'](f['getWorldQuaternion'](new THREE['Quaternion']())['clone']
                  ())),
                j = (f['rotation']['set'](-1 * j['x'], -1 * j['y'], -1 * j['z']),
                  box3['setFromObject'](f)['getSize'](new THREE['Vector3']())['clone']()),
                k = {
                  'box': box3['setFromObject'](f)['getSize'](new THREE['Vector3']())['clone'](),
                  'diff': new THREE['Vector3'](g['x'], g['y'], g['z'])['sub'](j)['divideScalar'](2),
                  'size': g
                };
              for (let l = 0; l < f['children']['length']; l++)
                set_size_buff(f['children'][l], f['children'][l]['name'], k),
                correct_uv_buff(Model_utils['get_model_from_cache'](this['userData']['computed']['model'])['geometry'][
                  l], f['children'][l]['geometry']);
              f['rotation']['copy'](h);
            }
            ['apply_materials']() {
              var f = this['userData']['params']['spec']['materials'];
              for (let l = this['userData']['own_object']['children']['length']; l--;) {
                var g = this['userData']['own_object']['children'][l],
                  j;
                let m;
                if (-1 < g['name']['indexOf']('v(2)') || -1 < g['name']['indexOf']('v(3)')) {
                  var j = g['name']['match'](/m\((.*?)\)/);
                  let n = 'gen',
                    o = (null != j && (n = j[1]),
                      0);
                  var k = 0,
                    j = g['name']['match'](/ro\((.*?)\)/),
                    j, j, j;
                  null != j && (k = parseInt(j[1]));
                  let q = g['name']['match'](/r\((.*?)\)/);
                  null != q && (q = q[1]),
                    'gen' == n && (j = materials_lib['get_item'](f['gen']),
                      90 == q && (j['add_params']['rotation'] = 'rotated'),
                      j['add_params']['model_width'] = this['userData']['size']['x'],
                      j['add_params']['model_height'] = this['userData']['size']['y'],
                      true === f['material_rotated'] && (j['add_params']['rotation'] = 'rotated'),
                      m = create_material(j),
                      o = 1),
                    materials_global[n] && ((j = materials_lib['get_item'](materials_global[n]['selected']))[
                        'add_params']['model_width'] = this['userData']['size']['x'],
                      j['add_params']['model_height'] = this['userData']['size']['y'],
                      true === f['material_rotated'] && (j['add_params']['rotation'] = 'rotated'),
                      m = create_material(j),
                      o = 1),
                    'glass' == n && (m = glass_mat,
                      o = 1),
                    'mirror' == n && (m = mirror_material,
                      o = 1),
                    'back' == n && (m = w_mat,
                      o = 1),
                    'al' == n && (m = aluminium_material,
                      o = 1),
                    1 != o && ((j = materials_lib['get_item'](f[n]))['add_params']['model_width'] = this['userData'][
                        'size'
                      ]['x'],
                      j['add_params']['model_height'] = this['userData']['size']['y'],
                      true === f['material_rotated'] && (j['add_params']['rotation'] = 'rotated'),
                      m = create_material(j));
                } else
                  -
                  1 < g['name']['indexOf']('al') && (m = aluminium_material),
                  -1 < g['name']['indexOf']('back') && (m = w_mat),
                  -1 < g['name']['indexOf']('glass') && (m = glass_mat),
                  -1 < g['name']['indexOf']('gen') && ((j = materials_lib['get_item'](f['gen']))['add_params'][
                      'model_width'
                    ] = this['userData']['size']['x'],
                    j['add_params']['model_height'] = this['userData']['size']['y'],
                    true === f['material_rotated'] && (j['add_params']['rotation'] = 'rotated'),
                    m = create_material(j));
                g['material'] = m;
              }
            }
            ['change_facade_material'](e, f) {
              this['userData']['params']['spec']['materials'][e] = f;
              var f = this['userData']['root']['userData']['params']['path_params'];
              f[this['userData']['path2']] && f[this['userData']['path2']]['materials'] && f[this['userData']['path2']][
                  'materials'
                ][e] && delete f[this['userData']['path2']]['materials'][e],
                this['apply_materials']();
            }
            ['change_own_material'](e) {
              this['userData']['root']['set_own_material'](this['userData']['path'], 'materials.gen', e),
                this['userData']['params']['spec']['materials']['gen'] = parseInt(e),
                this['apply_materials']();
            }
            ['set_root_params']() {
              !this['userData']['root'] || this['userData']['root']['params']['spec']['facades']['items'][this[
                'userData']['path2']] || (this['userData']['root']['params']['spec']['facades']['items'][this[
                'userData']['path2']] = {
                'id': this['userData']['params']['spec']['id'],
                'materials': this['userData']['params']['spec']['materials'],
                'group': this['userData']['params']['spec']['group'],
                'style': this['userData']['params']['spec']['style'],
                'handle': this['userData']['params']['spec']['handle']
              });
            }
            ['on_delete']() {
              super['on_delete'](),
                this['userData']['root'] && this['userData']['root']['params']['spec']['facades']['items'][this[
                  'userData']['path2']] && delete this['userData']['root']['params']['spec']['facades']['items'][this[
                  'userData']['path2']];
            }
            ['get_specs']() {
              let f = {};
              var g = this,
                j = {
                  'style': this['userData']['params']['spec']['style'],
                  'group': this['userData']['params']['spec']['group'],
                  'width': this['userData']['size']['x'],
                  'height': this['userData']['size']['y'],
                  'thickness': this['userData']['size']['z'],
                  'material': this['userData']['params']['spec']['materials']['gen'],
                  'is_radius': this['userData']['params']['spec']['radius'],
                  'is_radius_inner': 0,
                  'is_double': 0,
                  'is_triple': 0,
                  'flip': 0,
                  'facade': this['userData']['params']['spec']['id']
                },
                k = facades_lib['get_item'](this['userData']['params']['spec']['id']);
              isNaN(parseInt(j['style'])) && (j['is_radius'] ? 'full' == j['style'] ? (j['style'] = k[
                  'compatibility_types']['radius'],
                j['style'] || (j['style'] = k['compatibility_types']['radius_full'])) : j['style'] = k[
                'compatibility_types']['radius_window'] : j['style'] = k['compatibility_types'][j['style']]);
              let l = 'common',
                m = '';
              if (j['is_radius'] && (l = 'radius'),
                j['is_radius_inner'] && (l = 'radius_inner'),
                j['is_double'] && (l = 'double'),
                'radius_inner' == (l = j['is_triple'] ? 'triple' : l) && (m = 'Внутренний\x20радиус'),
                'radius' == l || 'common' == l)
                try {
                  m = k['types'][j['style']]['name'];
                } catch (q) {
                  m = m || 'asdfd';
                }
              'double' == l && (m = k['types_double'][j['style']]['name']),
                'triple' == l && (m = k['types_triple'][j['style']]['name']);
              let n = 0;
              if (n = 'radius' == l || 'radius_inner' == l ? 2 * Math['PI'] * j['width'] / 1000 * j['height'] /
                1000 / 4 : j['width'] / 1000 * j['height'] / 1000,
                k['prices_fixed']) {
                var o = materials_lib['get_item'](j['material'])['code'],
                  k;
                if (k['prices_fixed']['mat_codes'][o] && k['prices_fixed']['mat_codes'][o][j['style']] && k[
                    'prices_fixed']['mat_codes'][o][j['style']][j['width'] + '_' + j['height']])
                  return (k = k['prices_fixed']['mat_codes'][o][j['style']][j['width'] + '_' + j['height']])['facade'] =
                    j['facade'],
                    f = {
                      'is_fix': true,
                      'data': k
                    };
              }
              return f = {
                  'type_key': l,
                  'style': j['style'],
                  'data': {
                    'facade_set_id': j['facade'],
                    'name': m,
                    'width': j['width'],
                    'height': j['height'],
                    'thickness': j['thickness'],
                    'id': j['material'],
                    'm2': n,
                    'pm': 0,
                    'per': 2 * (j['width'] + j['height']),
                    'group': j['group'],
                    'flip': j['flip']
                  }
                },
                this['userData']['specs'] = f;
            }
            ['get_glass_specs']() {
              return null;
            }
        }
        class HandleCN extends Section {
          constructor(e = {}, f = {
              'parent': null,
              'root': null,
              'path': null
            }) {
              super(e, f);
            }
            ['build']() {
              super['build']();
            }
            ['build_params'](e) {
              super['build_params'](e),
                1 == this['userData']['params']['spec']['own'] && (0 != this['userData']['root']['params']['spec'][
                    'handles'
                  ]['id'] && (this['userData']['params']['spec']['id'] = this['userData']['root']['userData']['params'][
                      'spec'
                    ]['handles']['id'],
                    this['userData']['params']['spec']['size_index'] = this['userData']['root']['userData']['params'][
                      'spec'
                    ]['handles']['size']),
                  this['userData']['root']['params']['spec']['handles']['items'][this['userData']['path2']]) && (this[
                    'userData']['params']['spec']['id'] = this['userData']['root']['params']['spec']['handles']['items']
                  [this['userData']['path2']]['id'],
                  this['userData']['params']['spec']['size_index'] = this['userData']['root']['params']['spec'][
                    'handles'
                  ]['items'][this['userData']['path2']]['size']),
                this['userData']['model_params'] = handles_lib['get_item'](this['userData']['params']['spec']['id']),
                'v' == this['userData']['params']['spec']['orient'] && (this['userData']['params']['rot2']['z'] = 90),
                'facade_profile' == this['userData']['model_params']['type'] && ('l' == this['userData']['params'][
                    'spec'
                  ]['dir'] && (this['userData']['params']['rot2']['z'] = -90),
                  'b' == this['userData']['params']['spec']['dir']) && (this['userData']['params']['rot2']['z'] = 180),
                this['set_root_params']();
            }
          async ['b_spec']() {
              this['userData']['computed']['model'] = this['get_model'](),
                await this['load_model']();
            }
            ['b_size']() {
              'common' == this['userData']['model_params']['type'] && ('h' == this['userData']['params']['spec'][
                    'orient'
                  ] ? (this['userData']['params']['size']['x'] = this['userData']['model_params']['sizes'][this[
                      'userData']['params']['spec']['size_index']]['width'],
                    this['userData']['params']['size']['y'] = this['userData']['model_params']['sizes'][this['userData']
                      ['params']['spec']['size_index']
                    ]['height']) : (this['userData']['params']['size']['x'] = this['userData']['model_params']['sizes'][
                      this['userData']['params']['spec']['size_index']
                    ]['height'],
                    this['userData']['params']['size']['y'] = this['userData']['model_params']['sizes'][this['userData']
                      ['params']['spec']['size_index']
                    ]['width']),
                  this['userData']['params']['size']['z'] = this['userData']['model_params']['sizes'][this['userData'][
                    'params'
                  ]['spec']['size_index']]['depth']),
                'facade_profile' == this['userData']['model_params']['type'] && ('h' == this['userData']['params'][
                    'spec'
                  ]['orient'] ? (this['userData']['params']['size']['x'] = 's:x',
                    this['userData']['params']['size']['y'] = this['userData']['model_params']['sizes'][this['userData']
                      ['params']['spec']['size_index']
                    ]['height']) : (this['userData']['params']['size']['x'] = this['userData']['model_params']['sizes'][
                      this['userData']['params']['spec']['size_index']
                    ]['height'],
                    this['userData']['params']['size']['y'] = 's:y'),
                  this['userData']['params']['size']['z'] = this['userData']['model_params']['sizes'][this['userData'][
                    'params'
                  ]['spec']['size_index']]['depth']),
                super['b_size']();
            }
            ['set_root_params']() {
              1 != this['userData']['params']['spec']['own'] || this['userData']['root'] && !this['userData']['root'][
                'params'
              ]['spec']['handles']['items'][this['userData']['path2']] && (this['userData']['root']['params']['spec'][
                'handles'
              ]['items'][this['userData']['path2']] = {
                'id': this['userData']['params']['spec']['id'],
                'size': this['userData']['params']['spec']['size_index']
              });
            }
            ['on_delete']() {
              super['on_delete'](),
                this['userData']['root'] && this['userData']['root']['params']['spec']['handles']['items'][this[
                  'userData']['path2']] && delete this['userData']['root']['params']['spec']['handles']['items'][this[
                  'userData']['path2']];
            }
          async ['load_model']() {
              this['userData']['computed']['model_loaded'] = false,
                this['userData']['computed']['meshes_list'] = [];
              var f = await load_model({
                'model': this['userData']['computed']['model'],
                'buffer': false
              });
              for (let i = 0; i < f.length; i++) {
                var g = f[i]['clone'](),
                  h = new THREE['Mesh'](g, red_mat);
                h['name'] = g['name'],
                  h['castShadow'] = true,
                  h['userData']['edgesModeType'] = ObjectType['Handle'],
                  this['userData']['computed']['meshes_list']['push'](h),
                  this['add_own_object'](h);
              }
              this['apply_materials'](),
                this['userData']['computed']['model_loaded'] = true,
                this['set_size']();
            }
            ['get_model']() {
              return this['userData']['model_params']['model'];
            }
            ['set_variant'](e) {
              this['userData']['params']['spec']['size_index'] = e,
                this['userData']['root']['change_param'](this['userData']['path'], 'spec.size_index', e, true);
            }
            ['change_model'](e, f) {
              this['userData']['params']['spec']['id'] = e,
                this['userData']['params']['spec']['size_index'] = f,
                this['build_params'](this['userData']['params']),
                this['build']();
            }
            ['apply_materials']() {
              var e = this['userData']['model_params']['material'],
                f;
              for (let g = 0; g < this['userData']['computed']['meshes_list']['length']; g++) {
                this['userData']['computed']['meshes_list'][g]['material'] = create_material(e);
              }
            }
