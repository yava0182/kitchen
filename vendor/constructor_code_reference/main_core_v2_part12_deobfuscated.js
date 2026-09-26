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
      let f = [],
        g = this;
      return '' == this['search'] ? this['no_results'] = true : (0 == this['category'] ? h(this['$options'][
          'tree']) : h(this['$options']['lib']['categories'][this['category']]),
          this['no_results'] = 0 === f.length),
        f;

      function h(j) {
        var k = g['search']['toLowerCase']();
        if (j['categories']) {
          for (let m = 0; m < j['categories']['length']; m++)
            h(j['categories'][m], j['categories'][m]['id']);
        }
        if (j['items']) {
          var l = {
            'group': j['name'],
            'category': j['id'],
            'items': []
          };
          for (let n = 0; n < j['items']['length']; n++) {
            let p = 0;
            'decors' != g['l_lib'] && 'glass' != g['l_lib'] || (j['items'][n]['name'] && -1 < j['items'][n]['name'][
                  'toLowerCase'
                ]()['indexOf'](k) && (p = 1),
                j['items'][n]['code'] && -1 < j['items'][n]['code']['toLowerCase']()['indexOf'](k) && (p = 1)),
              1 == p && l['items']['push'](j['items'][n]);
          }
          0 < l['items']['length'] && f.push(l);
        }
      }
    },
    'current_selected'() {
      let e = {},
        f = this['selected_data']['key'],
        g = this['selected_data']['facade_id'];
      return Object['keys'](this['selected'])['forEach'](h => {
          this['selected'][h]['selected']['id'] == g && (e[this['selected'][h]['selected']['materials'][f]] || (e[
              this['selected'][h]['selected']['materials'][f]] = []),
            e[this['selected'][h]['selected']['materials'][f]]['push'](this['l_selected'][h]['name']));
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
          this['path'] = [0],
          this['l_lib'] = 'decors',
          pp['libs']['decors']);
      if (!this['categories'] || isArray(this['categories']) && 0 === this['categories']['length']) {
        this['cats'] = [];
        for (let j = 0; j < g['tree']['length']; j++)
          this['cats']['push'](g['tree'][j]['id']);
      } else
        this['cats'] = this['categories'];
      this['multi'] = this['multiple'],
        this['l_mode'] = this['mode'];
      var h = {
        'id': 0,
        'name': 'Каталог',
        'active': 1,
        'categories': [],
        'items': []
      };
      if (this['items'] && this['items']['length']) {
        this['items_mode'] = true;
        for (let k = 0; k < this['items']['length']; k++)
          g['items'][this['items'][k]] && h['items']['push'](g['items'][this['items'][k]]);
      } else
        this['items_mode'] = false,
        (traverse_tree = (l, m) => {
          for (var n of l)
            this['cats']['includes'](n['id']) && m['categories']['push'](n),
            n['categories'] && traverse_tree['call'](this, n['categories'], m);
        })['call'](this, g['tree'], h);
      this['$options']['tree'] = h,
        this['$options']['lib'] = g,
        1 === this['cats']['length'] && Vue['nextTick'](() => {
          this['select_category'](this['cats'][0]);
        }),
        this['params_data'] = this['params'] ? copy_object(this['params']) : [];
    },
    'build_path': function(f, g) {
      let h = [];

      function i(k, l) {
        if (String(k['id']) === String(f))
          return h = [...l, String(k['id'])];
        var m, n;
        for (n of k['categories'] || k['children'] || [])
          if (i(n, [...l, String(k['id'])]))
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
        this['picker_item'] && f['id'] == this['picker_item']['id'] ? (global_options['mouse_mode']['mode'] = 'drag',
          global_options['mouse_mode']['target'] = null,
          global_options['mouse_mode']['item_id'] = null,
          global_options['mouse_mode']['el'] = null,
          this['picker_item'] = null,
          this['$root']['unset_colorpicker_mode'](this['picker_target']),
          this['picker_mode'] = false) : (global_options['mouse_mode']['mode'] = 'picker',
          global_options['mouse_mode']['target'] = constructor_settings['core_v2'] ? 'facade_materials' : this[
            'picker_target'],
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
      this['picker_item'] && f['id'] == this['picker_item']['id'] ? (global_options['mouse_mode']['mode'] = 'drag',
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
    'set_available_module_groups'(f) {
      var g = pp['libs']['modules_groups'] || [],
        h = (this['$options']['dd_options'] = [],
          f.length == g.length && this['$options']['dd_options']['push']({
            'group': 'all',
            'text': this['lang']('apply_to_all')
          }),
          []);
      for (let k = 0; k < f.length; k++) {
        var j = f[k];
        h.push(f[k]['key']),
          this['$options']['dd_options']['push']({
            'group': j['key'],
            'text': this['lang']('apply') + ':\x20' + j['name']
          });
      }
      Vue['set'](this, 'available_groups', h);
    },
    'set_data'(f) {
      Vue['set'](this, 'selected_data', f);
    },
    'lang': function(f) {
      return this['$root']['lang'](f);
    },
    'select_category': function(f, g = false) {
      0 == (this['category'] = f) ? this['path'] = [0] : false !== g ? this['path']['length'] = g + 1 : this[
        'path']['includes'](f) || this['path']['push'](f);
    },
    'select_item_v2': function(f) {
      var f = f['group'],
        g = (this['selected_data']['id'] = this['dd_menu']['id'],
          pp['libs']['modules_groups'] || []),
        h = [];
      if ('all' == f) {
        for (let j = 0; j < g.length; j++)
          h.push(g[j]['key']);
      } else
        h.push(f);
      this['$emit']('select_item', this['selected_data'], h),
        this['dd_menu']['show'] = false;
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
    'double_click': function(f) {
      this['$emit']('double_click', f);
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
        'top': 'auto' == this['dd_menu_picker']['pos']['top'] ? 'auto' : this['dd_menu_picker']['pos']['top'] + 'px',
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
      Vue['component']('facades_picker_v2', {
        'template': '#facades_picker_v2_template',
        'props': {
          'method': {
            'type': String,
            'default': 'global'
          },
          'mode': {
            'type': String,
            'default': 'p'
          },
          'module_groups': {
            'type': Array,
            'default': function() {
              return Object['values'](copy_object(project_settings['kitchen']['cabinet_tags']));
            }
          },
          'cid': {
            'type': String,
            'default': ''
          },
          'can_facade': {
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
            'l_mode': 'p',
            'l_module_groups': [],
            'l_categories': [],
            'l_items': [],
            'l_decor_items': [],
            'l_decor_categories': [],
            'current_facade_id': 0
          };
        },
        'watch': {},
        'created': function() {
          this['init']();
        },
        'computed': {
          'groups_with_current_facade_id'() {
            let e = [];
            return Object['values'](this['l_module_groups'])['forEach'](f => {
                f['selected']['id'] == this['current_facade_id'] && e.push(copy_object(f));
              }),
              e;
          }
        },
        'methods': {
          'init'() {
            if (this['l_mode'] = this['mode'],
              'global' == this['method']) {
              var f = project_settings['kitchen']['defaults']['facades'],
                g = {};
              for (let i = 0; i < this['module_groups']['length']; i++) {
                var h = this['module_groups'][i];
                g[h['key']] = h,
                  g[h['key']]['selected'] = copy_object(f[h['key']]);
              }
              Vue['set'](this, 'l_module_groups', copy_object(g));
            }
            this['method'];
          },
          'select_item'(f, g = []) {
            if ('global' == this['method']) {
              for (let h = 0; h < g.length; h++)
                this['l_module_groups'][g[h]]['selected']['id'] = f['id'];
              sc['change_facade_v2'](f['id'], g);
            } else
              this['method'];
          },
          'select_decor'(f, g = []) {
            if ('global' == this['method']) {
              for (let h = 0; h < g.length; h++)
                this['l_module_groups'][g[h]]['selected']['materials'][f['key']] = f['id'];
              sc['change_facade_material_v2'](f['facade_id'], f['key'], f['id'], g);
            }
          },
          'click_selected_item'(f) {
            this['l_mode'] = 'c';
          },
          'click_selected_category'(f) {},
          'click_selected_material'(f) {
            this['l_mode'] = 'd',
              this['l_decor_categories'] = f['categories'],
              this['current_facade_id'] = f['facade_id'],
              this['$refs']['catalog_decors']['set_available_module_groups'](this[
                'groups_with_current_facade_id']),
              this['$refs']['catalog_decors']['set_data']({
                'key': f['key'],
                'facade_id': f['facade_id']
              });
          },
          'click_selected_material_category'(f) {}
        }
      });
    }),
    interface_components_init.push(function() {
      Vue['component']('selected_facade_material_v2', {
        'template': '#selected_facade_material_v2_template',
        'props': {
          'selected': {
            'type': [String, Number],
            'default': 0
          },
          'categories': {
            'type': Array,
            'default': () => []
          },
          'facade_id': {
            'type': [String, Number],
            'default': 0
          },
          'name': {
            'type': String,
            'default': ''
          },
          'mat_key': {
            'type': String,
            'default': 'gen'
          },
          'group': {
            'type': String,
            'default': ''
          }
        },
        'mixins': [mixin],
        'data': function() {
          return {
            'l_lib': ''
          };
        },
        'watch': {},
        'computed': {
          'path'() {
            let f = this['$options']['lib'];
            var g = this['item'];
            let h = [],
              j = g['category'];

            function k(l) {
              var m = f['categories'][l] || f['get_category'](l);
              m['parent'] && 0 != m['parent'] ? (h['unshift']({
                  'id': l,
                  'name': m['name']
                }),
                k(m['parent'])) : h['unshift']({
                'id': l,
                'name': m['name']
              });
            }
            return k(j = (j = Array.isArray(j) ? j[0] : j) && (!Array.isArray(j) || j.length) ? j :
                0),
              h['unshift']({
                'id': 0,
                'name': lang['catalog']
              }),
              h;
          },
          'item'() {
            return this['$options']['lib']['find_item'](this['selected']);
          }
        },
        'created': function() {
          this['init']();
        },
        'methods': {
          'get_item_style': function() {
            return this['item_style'](this['item']);
          },
          'init'() {
            this['$options']['lib'] = pp['libs']['decors'];
          },
          'click_item'() {
            this['$emit']('click_item', {
              'id': this['item']['id'],
              'key': this['mat_key'],
              'categories': this['categories'],
              'facade_id': this['facade_id']
            });
          },
          'click_category'(e) {
            this['$emit']('click_category', {
              'id': e['id'],
              'key': this['mat_key']
            });
          }
        }
      });
    }),
    interface_components_init.push(function() {
      Vue['component']('selected_facade_v2', {
        'template': '#selected_facade_v2_template',
        'props': {
          'group': {
            'type': Object,
            'default': () => ({
              'id': 0,
              'key': 'all',
              'name': '',
              'selected': {
                'id': 0,
                'materials': {
                  'gen': 0
                }
              }
            })
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
            'item_id': 0,
            'l_facade_style': 'full',
            'l_lib': '',
            'selected': {}
          };
        },
        'watch': {},
        'computed': {
          'path'() {
            let f = this['$options']['lib'];
            var g = this['item'];
            let h = [],
              j = g['category'];

            function k(m) {
              var n = f['categories'][m] || f['get_category'](m);
              n['parent'] && 0 != n['parent'] ? (h['unshift']({
                  'id': m,
                  'name': n['name']
                }),
                k(n['parent'])) : h['unshift']({
                'id': m,
                'name': n['name']
              });
            }
            return k(j = (j = Array.isArray(j) ? j[0] : j) && (!Array.isArray(j) || j.length) ? j :
                0),
              h['unshift']({
                'id': 0,
                'name': lang['catalog']
              }),
              h;
          },
          'item'() {
            return this['$options']['lib']['find_item'](this['group']['selected']['id']);
          },
          'materials'() {
            let e = [];
            return Object['keys'](this['group']['selected']['materials'])['forEach'](f => {
                var g = {};
                switch (f) {
                  case 'gen':
                    g['name'] = lang['facades_gen'],
                      g['key'] = f,
                      g['selected'] = this['group']['selected']['materials'][f],
                      e.push(g);
                    break;
                  case 'glass':
                    g['name'] = lang['glass_materials'],
                      g['key'] = f,
                      g['selected'] = this['group']['selected']['materials'][f];
                    break;
                  default:
                    var h = this['item']['additional_materials'][f];
                    h && 1 != h['fixed'] && (g['name'] = h['name'],
                      g['key'] = f,
                      g['selected'] = this['group']['selected']['materials'][f],
                      e.push(g));
                }
              }),
              e;
          }
        },
        'created': function() {
          this['init']();
        },
        'methods': {
          'get_item_style': function() {
            return this['item_style'](this['item']);
          },
          'init'() {
            this['$options']['lib'] = facades_lib;
          },
          'click_item'() {
            this['$emit']('click_item', {
              'id': this['group']['selected']['id']
            });
          },
          'click_category'(f) {
            this['$emit']('click_category', f);
          },
          'click_material'(f) {
            this['$emit']('click_material', f);
          },
          'click_material_category'(f) {
            this['$emit']('click_material_category', f);
          }
        }
      });
    });
  class Analyzer {
    ['Vector3'](f = 0, g = 0, h = 0) {
      return {
        'x': f,
        'y': g,
        'z': h
      };
    }
    ['add'](f, g) {
      return {
        'x': f['x'] + g['x'],
        'y': f['y'] + g['y'],
        'z': f['z'] + g['z']
      };
    }
    ['subtract_vectors'](f, g) {
      return {
        'x': f['x'] - g['x'],
        'y': f['y'] - g['y'],
        'z': f['z'] - g['z']
      };
    }
    ['dot_product'](f, g) {
      return f['x'] * g['x'] + f['y'] * g['y'] + f['z'] * g['z'];
    }
    ['cross_product'](f, g) {
      return {
        'x': f['y'] * g['z'] - f['z'] * g['y'],
        'y': f['z'] * g['x'] - f['x'] * g['z'],
        'z': f['x'] * g['y'] - f['y'] * g['x']
      };
    }
    ['multiply'](f, g) {
      return {
        'x': f['x'] * g,
        'y': f['y'] * g,
        'z': f['z'] * g
      };
    }
    ['length'](e) {
      return Math['sqrt'](this['dot_product'](e, e));
    }
    ['normalize'](f) {
      var g = this.length(f) || 1;
      return {
        'x': f['x'] / g,
        'y': f['y'] / g,
        'z': f['z'] / g
      };
    }
    ['rotate_vector_XYZ'](f, g) {
      var j = deg2rad(g['x'] || 0),
        k = deg2rad(g['y'] || 0),
        g = deg2rad(g['z'] || 0),
        m = f['x'],
        p = f['y'],
        f = f['z'],
        q = Math['cos'](j),
        j = Math['sin'](j),
        u, v = p * j + f * q,
        p = p * q - f * j,
        f = v,
        q = Math['cos'](k),
        j, w, v = -m * (j = Math['sin'](k)) + f * q,
        m = m * q + f * j;
      f = v,
        q = Math['cos'](g);
      var x, k = m * (j = Math['sin'](g)) + p * q;
      return {
        'x': m = m * q - p * j,
        'y': p = k,
        'z': f
      };
    }
    ['transform_pivot'](f, g, h, j) {
      let k = f['x'],
        m = f['y'],
        p = f['z'];
      var f = g['x'],
        q = g['y'],
        g = g['z'],
        u = h['x'],
        v = h['y'],
        h = h['z'];
      return 0 === f ? k -= u / 2 : 1 === f && (k -= u),
        0 === q ? m -= v / 2 : 1 === q && (m -= v),
        0 === g ? p -= h / 2 : 1 === g && (p -= h), {
          'x': k,
          'y': m,
          'z': p
        };
    }
    ['get_pivot_offset'](f, g) {
      var h, j, k;
      return {
        'x': -g['x'] / 2 * (1 + f['x']),
        'y': -g['y'] / 2 * (1 + f['y']),
        'z': -g['z'] / 2 * (1 + f['z'])
      };
    }
    ['create_rotation_matrix_X'](f) {
      var g = Math['cos'](f),
        f = Math['sin'](f);
      return [
        [1, 0, 0, 0],
        [0, g, -f, 0],
        [0, f, g, 0],
        [0, 0, 0, 1]
      ];
    }
    ['create_rotation_matrix_Y'](f) {
      var g = Math['cos'](f),
        f = Math['sin'](f);
      return [
        [g, 0, f, 0],
        [0, 1, 0, 0],
        [-f, 0, g, 0],
        [0, 0, 0, 1]
      ];
    }
    ['create_rotation_matrix_Z'](f) {
      var g = Math['cos'](f),
        f = Math['sin'](f);
      return [
        [g, -f, 0, 0],
        [f, g, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
      ];
    }
    ['create_rotation_matrix'](f) {
      var g = -deg2rad(f['x'] || 0),
        h = -deg2rad(f['y'] || 0),
        f = -deg2rad(f['z'] || 0),
        g = this['create_rotation_matrix_X'](g),
        h = this['create_rotation_matrix_Y'](h),
        f = this['create_rotation_matrix_Z'](f);
      return this['multiply_matrices'](this['multiply_matrices'](g, h), f);
    }
    ['multiply_matrices'](f, g) {
      var h = Array(4)['fill']()['map'](() => Array(4)['fill'](0));
      for (let j = 0; j < 4; j++)
        for (let k = 0; k < 4; k++)
          for (let l = 0; l < 4; l++)
            h[j][k] += f[j][l] * g[l][k];
      return h;
    }
    ['transform_vector'](f, g) {
      var h = [g['x'], g['y'], g['z'], 1],
        j = [0, 0, 0, 0];
      for (let k = 0; k < 4; k++)
        for (let l = 0; l < 4; l++)
          j[k] += f[k][l] * h[l];
      return {
        'x': j[0],
        'y': j[1],
        'z': j[2]
      };
    }
    ['translation_matrix'](e) {
      return [
        [1, 0, 0, e['x']],
        [0, 1, 0, e['y']],
        [0, 0, 1, e['z']],
        [0, 0, 0, 1]
      ];
    }
    ['euler_from_matrix'](f) {
      var f = f,
        g = Math['sqrt'](f[0][0] * f[0][0] + f[1][0] * f[1][0]),
        h, j, k, j, k, g;
      return g < 0.000001 ? (j = Math['atan2'](-f[1][2], f[1][1]),
        k = Math['atan2'](-f[2][0], g), {
          'x': rad2deg(j),
          'y': rad2deg(k),
          'z': 0
        }) : (j = Math['atan2'](f[2][1], f[2][2]),
        k = Math['atan2'](-f[2][0], g),
        g = Math['atan2'](f[1][0], f[0][0]), {
          'x': rad2deg(j),
          'y': rad2deg(k),
          'z': rad2deg(g)
        });
    }
    ['normalize_angle'](e) {
      return e %= 2 * Math['PI'],
        Math['PI'] < e && (e -= 2 * Math['PI']),
        e < -Math['PI'] && (e += 2 * Math['PI']),
        e;
    }
    ['normalize_deg'](e) {
      return 180 < (e %= 360) && (e -= 360),
        e < -180 && (e += 360),
        e;
    }
    ['flatten_matrix'](f) {
      var g = [];
      for (let h = 0; h < 4; h++)
        for (let i = 0; i < 4; i++)
          g.push(f[i][h]);
      return g;
    }
    ['to_rounded'](f, g = 1) {
      var g = Math['pow'](10, g);
      return Math['round'](f * g) / g;
    }
    ['get_float_vector'](e) {
      return Object['entries'](e)['reduce']((f, [g, h]) => {
        var h = parseFloat(h);
        return f[g] = isNaN(h) ? 0 : h,
          f;
      }, {});
    }
    ['get_root_params'](f) {
      let g = {
        ...f['userData']['computed']['pos']
      };
      var j = {
          ...f['userData']['computed']['size']
        },
        k = this['get_float_vector']({
          ...f['userData']['params']['pivot']
        }),
        k = this['get_pivot_offset'](k, j),
        m = (f instanceof CabinetHole && (g = {
            ...f['userData']['computed']['real_pos']
          }),
          this['create_rotation_matrix'](f['userData']['computed']['rot'])),
        k = this['transform_vector'](m, k);
      let p = this['add'](g, k),
        q = m,
        u = f['userData']['parent'];
      for (; u;) {
        var v = u['userData']['computed'],
          w = this['create_rotation_matrix'](v['rot']),
          x = this['get_float_vector'](u['userData']['params']['pivot']),
          x = this['get_pivot_offset'](x, v['size']),
          x = this['transform_vector'](w, x),
          v = this['add'](v['pos'], x),
          x = this['translation_matrix'](v),
          v = this['multiply_matrices'](x, w);
        p = this['transform_vector'](v, p),
          q = this['multiply_matrices'](w, q),
          u = u['userData']['parent'];
      }
      var k = this['euler_from_matrix'](q),
        k = {
          'x': this['normalize_deg'](k['x']),
          'y': this['normalize_deg'](k['y']),
          'z': this['normalize_deg'](k['z'])
        },
        m = this['translation_matrix'](p),
        m = this['flatten_matrix'](this['multiply_matrices'](m, q));
      return f['userData']['computed']['world'] = {
        'pos': p,
        'rot': k,
        'size': j,
        'matrix_root': m
      }, {
        'pos': p,
        'rot': k,
        'size': j,
        'matrix_root': m
      };
    }
    ['build_OBB'](f) {
      var {
        pos: f,
        rot: g,
        size: h
      } = f['userData']['computed']['world'] || this['get_root_params'](f), j = this['normalize'](this[
        'rotate_vector_XYZ']({
        'x': 1,
        'y': 0,
        'z': 0
      }, g)), k = this['normalize'](this['rotate_vector_XYZ']({
        'x': 0,
        'y': 1,
        'z': 0
      }, g)), g = this['normalize'](this['rotate_vector_XYZ']({
        'x': 0,
        'y': 0,
        'z': 1
      }, g)), f = f, l = this['add'](this['add'](this['multiply'](j, h['x'] / 2), this['multiply'](k, h['y'] /
        2)), this['multiply'](g, h['z'] / 2)), m;
      return {
        'center': this['add'](f, l),
        'axis': [j, k, g],
        'half': [h['x'] / 2, h['y'] / 2, h['z'] / 2]
      };
    }
    ['obb_intersect'](j, k, q = false, w = 0.0001) {
      var A = this['build_OBB'](j),
        B = this['build_OBB'](k),
        C = Array(3)['fill'](0)['map'](() => Array(3)['fill'](0)),
        E = Array(3)['fill'](0)['map'](() => Array(3)['fill'](0));
      for (let a0 = 0; a0 < 3; a0++)
        for (let a1 = 0; a1 < 3; a1++)
          C[a0][a1] = this['dot_product'](A['axis'][a0], B['axis'][a1]);
      var F = this['subtract_vectors'](B['center'], A['center']),
        G = [this['dot_product'](F, A['axis'][0]), this['dot_product'](F, A['axis'][1]), this['dot_product'](F, A[
          'axis'][2])];
      for (let a2 = 0; a2 < 3; a2++)
        for (let a3 = 0; a3 < 3; a3++)
          E[a2][a3] = Math['abs'](C[a2][a3]) + 0.000001;
      let H = 1 / 0,
        I = null;
      for (let a4 = 0; a4 < 3; a4++) {
        var J, K, L = A['half'][a4] + (B['half'][0] * E[a4][0] + B['half'][1] * E[a4][1] + B['half'][2] * E[
          a4][2]) - Math['abs'](G[a4]);
        if (L <= 0)
          return false;
        L < H && (H = L,
          I = A['axis'][a4]);
      }
      for (let a5 = 0; a5 < 3; a5++) {
        var N = A['half'][0] * E[0][a5] + A['half'][1] * E[1][a5] + A['half'][2] * E[2][a5],
          O = B['half'][a5],
          P = G[0] * C[0][a5] + G[1] * C[1][a5] + G[2] * C[2][a5],
          N = N + O - Math['abs'](P);
        if (N <= 0)
          return false;
        N < H && (H = N,
          I = B['axis'][a5]);
      }
      var Q = [];
      for (let a6 = 0; a6 < 3; a6++)
        for (let a7 = 0; a7 < 3; a7++) {
          var R, S, T, U = A['half'][(a6 + 1) % 3] * E[(a6 + 2) % 3][a7] + A['half'][(a6 + 2) % 3] * E[(a6 +
            1) % 3][a7] + (B['half'][(a7 + 1) % 3] * E[a6][(a7 + 2) % 3] + B['half'][(a7 + 2) % 3] *
            E[a6][(a7 + 1) % 3]) - Math['abs'](G[(a6 + 2) % 3] * C[(a6 + 1) % 3][a7] - G[(a6 + 1) %
            3] * C[(a6 + 2) % 3][a7]);
          if (U <= 0)
            return false;
          var W = this['cross_product'](A['axis'][a6], B['axis'][a7]),
            Z, U;
          this.length(W) < 0.000001 || (Q.push({
              'overlap': U,
              'axis': this['normalize'](W)
            }),
            U < H && (H = U,
              U = this['normalize'](W),
              I = U));
        }
      return !(H < w) && (q && (this['visualize_OBB'](j, 16711680, H),
        this['visualize_OBB'](k, 4251856, H)), {
        'intersect': true,
        'min_overlap': {
          'min_overlap': H,
          'best_axis': I
        },
        'overlap': Q,
        'A': A,
        'B': B
      });
    }
    ['compute_precise_penetration'](f, g, h) {
      var j, j, f, h, k;
      if (h || f || g)
        return j = this['subtract_vectors'](g['center'], f['center']),
          j = Math['abs'](this['dot_product'](j, h)),
          f = Math['abs'](this['dot_product'](f['axis'][0], h)) * f['half'][0] + Math['abs'](this['dot_product'](f[
            'axis'][1], h)) * f['half'][1] + Math['abs'](this['dot_product'](f['axis'][2], h)) * f['half'][2],
          h = Math['abs'](this['dot_product'](g['axis'][0], h)) * g['half'][0] + Math['abs'](this['dot_product'](g[
            'axis'][1], h)) * g['half'][1] + Math['abs'](this['dot_product'](g['axis'][2], h)) * g['half'][2],
          Math['max'](f + h - j, 0);
    }
    ['direction_to_world_axis'](f) {
      var g = f['userData']['params']?.['spec']?.['direction'];
      if (g) {
        let m;
        switch (g) {
          case 'x':
            m = {
              'x': 1,
              'y': 0,
              'z': 0
            };
            break;
          case '-x':
            m = {
              'x': -1,
              'y': 0,
              'z': 0
            };
            break;
          case 'y':
            m = {
              'x': 0,
              'y': 1,
              'z': 0
            };
            break;
          case '-y':
            m = {
              'x': 0,
              'y': -1,
              'z': 0
            };
            break;
          case 'z':
            m = {
              'x': 0,
              'y': 0,
              'z': 1
            };
            break;
          case '-z':
            m = {
              'x': 0,
              'y': 0,
              'z': -1
            };
            break;
          default:
            m = {
              'x': 0,
              'y': 0,
              'z': 1
            };
        }
        var {
          pos: h,
          rot: g,
          size: j
        } = f['userData']['computed']['world'] || this['get_root_params'](f), f = this['rotate_vector_XYZ'](m, g), g =
          this['normalize'](f), f = Math['abs'](g['x']), k = Math['abs'](g['y']), l = Math['abs'](g['z']);
        return k < f && l < f ? {
          'axis': 0 < g['x'] ? 'x' : '-x',
          'dir': g
        } : f < k && l < k ? {
          'axis': 0 < g['y'] ? 'y' : '-y',
          'dir': g
        } : {
          'axis': 0 < g['z'] ? 'z' : '-z',
          'dir': g
        };
      }
    }
    ['orientation_to_world_rot_axis'](f) {
      var g = f['userData']['computed']['world']['rot'],
        h;
      let i = {
        'x': 0,
        'y': 0,
        'z': 0
      };
      switch (f['userData']['params']['spec']['orientation'] || 'f') {
        case 'v':
          i = {
            'x': 0,
            'y': -90,
            'z': 0
          };
          break;
        case 'h':
          i = {
            'x': 90,
            'y': 0,
            'z': 0
          };
          break;
        default:
          i = {
            'x': 0,
            'y': 0,
            'z': 0
          };
      }
      return {
        'x': g['x'] + i['x'],
        'y': g['y'] + i['y'],
        'z': g['z'] + i['z']
      };
    }
    ['visualize_OBB'](f, g = 65280) {
      var h = this['build_OBB'](f),
        j = new THREE['BoxGeometry'](2 * h['half'][0], 2 * h['half'][1], 2 * h['half'][2]),
        j = new THREE['EdgesGeometry'](j),
        g = new THREE['LineBasicMaterial']({
          'color': g,
          'linewidth': 2
        }),
        j = new THREE['LineSegments'](j, g),
        g = new THREE['Matrix4'](),
        k = (g['makeBasis'](new THREE['Vector3'](h['axis'][0]['x'], h['axis'][0]['y'], h['axis'][0]['z']),
            new THREE['Vector3'](h['axis'][1]['x'], h['axis'][1]['y'], h['axis'][1]['z']), new THREE['Vector3'](h[
              'axis'][2]['x'], h['axis'][2]['y'], h['axis'][2]['z'])),
          new THREE['Matrix4']());
      return k['compose'](new THREE['Vector3'](h['center']['x'], h['center']['y'], h['center']['z']), new THREE[
          'Quaternion']()['setFromRotationMatrix'](g), new THREE['Vector3'](1, 1, 1)),
        j['applyMatrix4'](k),
        scene && scene['add'](j),
        f['userData']['obbHelper'] = j;
    }
    ['compute_root_recursive'](f) {
      for (var g = [f]; 0 < g.length;) {
        var h = g['pop'](),
          j = this['get_root_params'](h);
        if (h['userData']['computed']['world'] = j,
          h['userData']['children'] && h['userData']['children']['length']) {
          for (var k of h['userData']['children'])
            g.push(k);
        }
      }
    }
    ['check_countour_intersec'](f, g, j = null, k = null) {
      j = j || this['build_OBB'](f),
        k = k || this['build_OBB'](g);
      var q = 0.0005;
      let w = '',
        A = '';
      var {
        pos: B,
        rot: C,
        size: D
      } = f['userData']['computed']['world'] || this['get_root_params'](f), E = f['userData']['computed'][
        'original_points'
      ] || f['userData']['computed']['points'];
      if (E) {
        var F = this['direction_to_world_axis'](g)['dir'],
          G = g['userData']['computed']?.['real_size']?.['z'] || g['userData']['computed']?.['size']?.['z'];
        let P = this['compute_precise_penetration'](j, k, F);
        var H = f['userData']['computed']?.['real_size']?.['z'] || f['userData']['computed']['size']['z'] || 16,
          j = G / 2,
          I = {
            'x': this['to_rounded'](k['center']['x'] + F['x'] * j),
            'y': this['to_rounded'](k['center']['y'] + F['y'] * j),
            'z': this['to_rounded'](k['center']['z'] + F['z'] * j)
          },
          k = {
            'x': this['to_rounded'](k['center']['x'] - F['x'] * j),
            'y': this['to_rounded'](k['center']['y'] - F['y'] * j),
            'z': this['to_rounded'](k['center']['z'] - F['z'] * j)
          },
          F = this['project_point_to_contour_plane'](f, k),
          j = this['project_point_to_contour_plane'](f, I),
          k = this['point_in_shape_with_arcs'](j, F, E, 24),
          I = {
            'x': 0,
            'y': 0
          },
          E = {
            'x': 0,
            'y': 0,
            'z': 0
          };
        let Q = '';
        k['dist'] && (P = parseFloat(k['dist']['toFixed'](2)));
        var J = j['x'] - F['x'],
          K = j['y'] - F['y'],
          L = j['z'] - F['z'],
          N = Math['sqrt'](J * J + K * K + L * L),
          O, K = K / N,
          L = L / N,
          J = rad2deg(Math['acos'](J / N)),
          N = rad2deg(Math['acos'](K)),
          K = rad2deg(Math['acos'](L)),
          L = {
            'x': J,
            'y': N,
            'z': K
          },
          G;
        return G + q - P < 0 && (w += 'Local\x20angle\x20is\x20incorrect\x20x:' + J + ',\x20y:' + N + ',\x20z:' + K +
            '\x20'),
          this['is_deg_multiple'](J, 90) || (A +=
            'The\x20local\x20angle\x20X\x20is\x20not\x20a\x20multiple\x20of\x2090\x20degrees:\x20' + J),
          this['is_deg_multiple'](N, 90) || (A +=
            'The\x20local\x20angle\x20Y\x20is\x20not\x20a\x20multiple\x20of\x2090\x20degrees:\x20' + N),
          this['is_deg_multiple'](K, 90) || (A +=
            'The\x20local\x20angle\x20Z\x20is\x20not\x20a\x20multiple\x20of\x2090\x20degrees:\x20' + K + '\x20'),
          k['perpendicular'] && (0 < (G = j['z'] - F['z']) && (Q = 'z'),
            G < 0 && (Q = '-z'),
            I['x'] = F['x'],
            I['y'] = F['y'],
            E['x'] = F['x'],
            E['y'] = F['y'],
            E['z'] = Math['abs'](j['z'])),
          !k['perpendicular'] && k['intersect'] && (k['intersect']['x'] - q < 0 && 0 < k['intersect']['x'] + q && (
              Q = 'x',
              I['x'] = Math['abs'](j['z']),
              I['y'] = k['intersect']['y']),
            k['intersect']['y'] - q < 0 && 0 < k['intersect']['y'] + q && (Q = 'y',
              I['x'] = k['intersect']['x'],
              I['y'] = Math['abs'](j['z'])),
            k['intersect']['x'] - q < k['max']['x'] && k['intersect']['x'] + q > k['max']['x'] && (Q = '-x',
              I['x'] = Math['abs'](j['z']),
              I['y'] = k['intersect']['y']),
            k['intersect']['y'] - q < k['max']['y'] && k['intersect']['y'] + q > k['max']['y'] && (Q = '-y',
              I['x'] = k['intersect']['x'],
              I['y'] = Math['abs'](j['z'])),
            E['x'] = k['intersect']['x'],
            E['y'] = k['intersect']['y'],
            E['z'] = Math['abs'](j['z'])),
          0 == w.length && f['userData']['params']['spec']['holes']['push']({
            'dir': Q,
            'diameter': g['userData']['computed']['real_size']['x'],
            'axes_2d': I,
            'depth': P,
            'axes': E,
            'angle': L
          }), {
            'inside': k,
            'local_start': F,
            'local_pos_out': j,
            'axes_2d': I,
            'local_angle': L,
            'direction_str': Q,
            'depth': P,
            'info': A,
            'error': w
          };
      }
    }
    ['depth_hole_in_wall'](f, g, h, j, k) {
      var {
        ex: m,
        ey: p,
        ez: q
      } = this['orientation_local_basis'](h), q = this['normalize'](q), u, h = (h['userData']['computed']['real_size']
          ?.['z'] || h['userData']['computed']['size']['z']) / 2, f = this['dot_product'](f['center'], q), g = this[
          'dot_product'](g['center'], q), v = j['userData']['computed']['real_size']?.['z'] || j['userData']['computed']
        ['size']['z'], j = this['direction_to_world_axis'](j)['dir'], j = Math['abs'](this['dot_product'](j, q)) * (v /
          2), q = Math['max'](f - h, g - j), v = Math['min'](f + h, g + j);
      return Math['max'](0, v - q);
    }
    ['project_point_to_contour_plane'](f, g) {
      var h, j = (f['userData']['computed']['world'] || this['get_root_params'](f))['pos'],
        {
          ex: f,
          ey: k,
          ez: l
        } = this['orientation_local_basis'](f),
        g = this['subtract_vectors'](g, j);
      return {
        'x': this['dot_product'](g, f),
        'y': this['dot_product'](g, k),
        'z': this['dot_product'](g, l)
      };
    }
    ['orientation_local_basis'](f) {
      var g = f['userData']['params']['spec']['orientation'];
      let h = {
          'x': 1,
          'y': 0,
          'z': 0
        },
        j = {
          'x': 0,
          'y': 1,
          'z': 0
        },
        k = {
          'x': 0,
          'y': 0,
          'z': 1
        };
      'f' !== g && ('v' === g ? (h = {
          'x': 0,
          'y': 0,
          'z': 1
        },
        j = {
          'x': 0,
          'y': 1,
          'z': 0
        },
        k = {
          'x': 1,
          'y': 0,
          'z': 0
        }) : 'h' === g && (h = {
          'x': 1,
          'y': 0,
          'z': 0
        },
        j = {
          'x': 0,
          'y': 0,
          'z': 1
        },
        k = {
          'x': 0,
          'y': -1,
          'z': 0
        }));
      var g = f['userData']['computed']['world']['rot'];
      return h = this['rotate_vector_XYZ'](h, g),
        j = this['rotate_vector_XYZ'](j, g),
        k = this['rotate_vector_XYZ'](k, g), {
          'ex': h,
          'ey': j,
          'ez': k
        };
    }
    ['build_shape_polygons_from_points'](f, g = 16) {
      if (!f || !f.length)
        return {
          'outer': [],
          'holes': []
        };
      var j = 1 === f.length && f[0]['center'] && f[0]['radius'],
        k, m;
      if (j)
        return k = f[0], {
          'outer': build_circle_polygon({
            'x': k['center']['x'],
            'y': k['center']['y']
          }, k['radius'], g),
          'holes': []
        };
      if (!j && f.length < 2)
        return {
          'outer': [],
          'holes': []
        };
      var k = f.map(C => ({
          'x': (void 0 !== C['x'] ? C : C['center'])['x'],
          'y': (void 0 !== C['y'] ? C : C['center'])['y'],
          'radius': C['radius'] || 0,
          'center': C['center'] ? {
            'x': C['center']['x'],
            'y': C['center']['y']
          } : null,
          'dir': C['dir']
        })),
        p = k.filter(C => !C['center']),
        j = k.filter(C => C['center']),
        q = [];
      let v = [];
      var w = {};
      let y = null;
      if (0 < p.length) {
        y = 0 < p[0]['radius'] ? (w[0] = this['add_rounded_corner_to_poly'](q, p[p.length - 1], p[0], p[
            1], g, y),
          w[0]['p2']) : (q.push({
            'x': p[0]['x'],
            'y': p[0]['y']
          }),
          p[0]);
        for (let C = 1; C < p.length; C++) {
          var z = p[C - 1],
            A = p[C],
            B = p[(C + 1) % p.length];
          y = 0 < A['radius'] ? (w[C] = this['add_rounded_corner_to_poly'](q, z, A, B, g, y),
            w[C]['p2']) : (q.push({
              'x': A['x'],
              'y': A['y']
            }),
            A);
        }
        0 < p[0]['radius'] ? q.push({
          'x': w[0]['p1']['x'],
          'y': w[0]['p1']['y']
        }) : q.push({
          'x': p[0]['x'],
          'y': p[0]['y']
        });
      }
      return 0 < j.length && j.forEach(D => {
        var D = build_circle_polygon({
          'x': D['center']['x'],
          'y': D['center']['y']
        }, D['radius'], g);
        v.push(D);
      }), {
        'outer': q,
        'holes': v
      };
    }
    ['add_rounded_corner_to_poly'](f, g, j, k, m = 16) {
      var {
        p1: g,
        p2: k,
        center: p,
        bulge: q
      } = this['get_rounded_point'](g, j, k), u = j['radius'], j = (f.push(g),
        4 * Math['atan'](q)), v = Math['atan2'](g['y'] - p['y'], g['x'] - p['x']), w = j / m;
      for (let y = 1; y < m; y++) {
        var x = v + w * y;
        f.push({
          'x': p['x'] + Math['cos'](x) * u,
          'y': p['y'] + Math['sin'](x) * u
        });
      }
      return f.push(k), {
        'p1': g,
        'p2': k,
        'center': p,
        'bulge': q
      };
    }
    ['get_rounded_point'](g, j, k, q = null) {
      var w = j['radius'],
        A = j['dir'],
        B = g['x'] - j['x'],
        g = g['y'] - j['y'],
        C = k['x'] - j['x'],
        k = k['y'] - j['y'],
        D = Math['sqrt'](B * B + g * g) || 1,
        E = Math['sqrt'](C * C + k * k) || 1,
        F = j['x'] + B / D * w,
        D = j['y'] + g / D * w,
        G = j['x'] + C / E * w,
        j = j['y'] + k / E * w,
        E = (F + G) / 2,
        H = (D + j) / 2,
        I = Math['sqrt']((G - F) ** 2 + (j - D) ** 2),
        w = I ? Math['sqrt'](Math['max'](w * w - Math['pow'](I / 2, 2), 0)) : 0,
        J = (j - D) / Math['max'](I, 0.0001),
        I = -(G - F) / Math['max'](I, 0.0001),
        K, B = 0 < B * k - g * C;
      let L;
      L = void 0 !== A ? A : B;
      let N, O;
      O = !B && L ? (N = E - J * w,
        H - I * w) : (N = E + J * w,
        H + I * w);
      var k = Math['atan2'](D - O, F - N);
      let P = Math['atan2'](j - O, G - N),
        Q = (L ? P > k && (P -= 2 * Math['PI']) : P < k && (P += 2 * Math['PI']),
          P - k);
      Q > Math['PI'] && (Q -= 2 * Math['PI']),
        Q < -Math['PI'] && (Q += 2 * Math['PI']);
      var g = Math['tan'](Q / 4);
      return {
        'p1': {
          'x': F,
          'y': D
        },
        'p2': {
          'x': G,
          'y': j
        },
        'center': {
          'x': N,
          'y': O
        },
        'dir': L,
        'bulge': g
      };
    }
    ['point_in_polygon_2d'](f, g) {
      let j = false;
      var k = f['x'],
        m = f['y'];
      for (let x = 0, y = g.length - 1; x < g.length; y = x++) {
        var p = g[x]['x'],
          q = g[x]['y'],
          u = g[y]['x'],
          v = g[y]['y'],
          w;
        m < q != m < v && k < (u - p) * (m - q) / (v - q || 1e-9) + p && (j = !j);
      }
      return j;
    }
    ['point_in_shape_with_arcs'](f, g, h, j = 16) {
      var h = this['build_shape_polygons_from_points'](h, j),
        j = h['outer'],
        h = h['holes'];
      let k = -1 / 0,
        m = -1 / 0;
      var g = {
          'x': g['x'] - f['x'],
          'y': g['y'] - f['y']
        },
        p = Math['hypot'](g['x'], g['y']) || 1,
        p = (g['x'] /= p,
          g['y'] /= p,
          this['point_in_polygon_2d'](f, j)),
        q;
      if (!p)
        return {
          'inside': false
        };
      for (q of h)
        if (this['point_in_polygon_2d'](f, q))
          return {
            'inside': false
          };
      var p = this['get_ray_intersection_with_contour'](f, g, j),
        u;
      for (u of j)
        u['x'] > k && (k = u['x']),
        u['y'] > m && (m = u['y']);
      return p?.['hit'] ? {
        'inside': true,
        'intersect': {
          'x': p['hit']['x'],
          'y': p['hit']['y']
        },
        'perpendicular': p['perpendicular'],
        'local_dir': g,
        'dist': p['hit']['dist'],
        'max': {
          'x': k,
          'y': m
        }
      } : {
        'inside': true,
        'perpendicular': true
      };
    }
    ['ray_segment_intersect'](f, g, j, k) {
      var m = 1e-9,
        p = k['x'] - j['x'],
        k = k['y'] - j['y'],
        q = f['x'],
        f = f['y'],
        u = g['x'],
        g = g['y'],
        v = j['x'],
        j = j['y'],
        w = -u * k + g * p,
        y = {
          'hit': null,
          'perpendicular': false
        },
        z, k, m;
      return Math['abs'](w) < m ? Math['abs'](u * p + g * k) < m && (y['perpendicular'] = true) : (m = (u * (j - f) -
            g * (v - q)) / w,
          0 <= (k = (-k * (v - q) + p * (j - f)) / w) && 0 <= m && m <= 1 && (y['perpendicular'] = false,
            y['hit'] = {
              'x': q + k * u,
              'y': f + k * g,
              'dist': k
            })),
        y;
    }
    ['get_ray_intersection_with_contour'](f, g, h) {
      let j = null,
        k = 1 / 0,
        m = true;
      for (let u = 0; u < h.length; u++) {
        var p = h[u],
          q = h[(u + 1) % h.length],
          p = this['ray_segment_intersect'](f, g, p, q);
        p['hit'] && p['hit']['dist'] < k && (j = p['hit'],
          k = p['hit']['dist'],
          m = p['perpendicular']);
      }
      return {
        'hit': j,
        'perpendicular': m
      };
    }
    ['is_deg_multiple'](f, g = 90, h = 0.0001) {
      return this['is_multiple'](f, g, h);
    }
    ['is_rad_multiple'](f, g = Math['PI'] / 2, h = 0.000001) {
      return this['is_multiple'](f, g, h);
    }
    ['is_multiple'](f, g, h = 0.000001) {
      var f = f / g;
      return Math['abs'](f - Math['round'](f)) < h;
    }
    ['is_clockwise'](f) {
      let g = 0;
      for (let k = 0; k < f.length; k++) {
        var h = f[k],
          j = f[(k + 1) % f.length];
        g += (j['x'] - h['x']) * (j['y'] + h['y']);
      }
      return 0 < g;
    }
    ['get_sizes_all_fill'](f, g = 0) {
      if (!f['userData']['is_root'])
        return false;
      let h = f['userData']['computed']['size'],
        i = ['x', 'y'],
        j = {
          'x': [],
          'y': []
        },
        k = [];
      var f = f['userData']['parts']['fill_section'];
      return 0 !== g && (0 < f.length && f.forEach(m => {
            var p = m['userData']['children'];
            if (!(p instanceof CabinetSection) && (5 != g || m['userData']['params']['spec']['show_sizes']))
              for (let x = 0; x < p.length; x++) {
                var q = p[x],
                  v, w;
                q instanceof Module && (q['_drag_element'] || (v = m['userData']['computed']['world'] || this[
                    'get_root_params'](m),
                  w = q['userData']['computed']['world'] || this['get_root_params'](q),
                  k.push({
                    'size': w['size'],
                    'pos': w['pos'],
                    'rot': w['rot'],
                    'section_pos': v['pos'],
                    'section_size': v['size'],
                    'fill_size': {
                      'x': q['userData']['params']['spec']['fill_size_x'] || 0,
                      'y': q['userData']['params']['spec']['fill_size_y'] || 0,
                      'z': q['userData']['params']['spec']['fill_size_z'] || 0
                    },
                    'path': q['userData']['path'],
                    'section_path': m?.['userData']?.['path']
                  })));
              }
          }),
          k.forEach(m => {
            i.forEach(p => {
              var q, s;
              0 === m['fill_size'][p] && (q = m['pos'][p],
                s = m['pos'][p] + m['size'][p],
                j[p]['push']({
                  'path': m['path'],
                  'axis': p,
                  'axes_pos': m['pos'][p],
                  'axes_size': m['size'][p],
                  'pos': m['pos'],
                  'rot': m['rot'],
                  'size': m['size'],
                  'min': q,
                  'max': s,
                  'prev': null,
                  'next': null,
                  'from': null,
                  'interval_min': null,
                  'interval_max': null,
                  'level': null,
                  'is_root': false,
                  'section_pos': m['section_pos'],
                  'section_size': m['section_size'],
                  'section_path': m['section_path']
                }));
            });
          })),
        i.forEach(m => {
          j[m]['push']({
            'path': 'root',
            'axis': m,
            'axes_pos': 0,
            'axes_size': h[m],
            'min': 0,
            'max': h[m],
            'prev': 0,
            'next': 0,
            'from': 'bottom',
            'interval_min': 0,
            'interval_max': h[m],
            'level': null,
            'is_root': true,
            'section_path': 0
          });
        }),
        1 === g && i.forEach(m => {
          var p = j[m]['sort']((v, w) => v['min'] - w['min']);
          for (let v = 1; v < p.length; v++) {
            var q = p[v],
              s;
            1 === v && (q['prev'] = q['min']),
              v === p.length - 1 ? q['next'] = h[m] - q['max'] + q['axes_size'] : (s = p[v + 1])['min'] >= q[
                'max'] ? q['next'] = s['min'] - q['max'] + q['axes_size'] : q['next'] = 0,
              q['is_root'] ? (q['from'] = 'bottom',
                q['interval_min'] = 0,
                q['interval_max'] = h[m]) : 1 === v ? (q['from'] = 'bottom',
                q['interval_min'] = 0,
                q['interval_max'] = q['prev'] + q['next']) : (q['from'] = 'bottom',
                q['interval_min'] = q['max'],
                q['interval_max'] = q['max'] + q['axes_size']);
          }
          j[m] = p;
        }),
        2 === g && i.forEach(m => {
          var p = j[m]['sort']((x, y) => x['min'] - y['min']);
          for (let x = 0; x < p.length; x++) {
            var q = p[x],
              v, w;
            q['prev'] = q['min'],
              q['next'] = h[m] - q['max'],
              q['is_root'] ? (q['from'] = 'bottom',
                q['interval_min'] = 0,
                q['interval_max'] = h[m]) : q['prev'] <= q['next'] ? (q['from'] = 'bottom',
                q['interval_min'] = 0,
                q['interval_max'] = q['prev']) : (q['from'] = 'top',
                q['next'] += q['axes_size'],
                q['interval_min'] = q['max'],
                q['interval_max'] = h[m]);
          }
          j[m] = p;
        }),
        1 !== g && 2 !== g || i.forEach(m => {
          var p = j[m],
            q = [],
            v = p.filter(B => 'bottom' === B['from']),
            p = p.filter(B => 'top' === B['from']),
            v = (v['sort']((B, C) => B['min'] - C['min']),
              p['sort']((B, C) => C['max'] - B['max']),
              [...v, ...p]);
          let w = new Map();
          var p = v.filter(B => {
              var C = B['axis'] + ('_' + B['min'] + '_') + B['interval_max'];
              return !w['has'](C) && !(B['next'] === B['axes_size'] && !B['is_root'] || 0 === B['next'] && !B[
                'is_root'] || (w['set'](C, true),
                0));
            }),
            x, y, z;
          for (x of p) {
            let B = false;
            if (!x['is_root']) {
              for (let C = 0; C < q.length; C++) {
                let D = false;
                for (z of q[C])
                  if (!(x['interval_max'] <= z['interval_min'] || x['interval_min'] >= z['interval_max'])) {
                    D = true;
                    break;
                  }
                if (!D) {
                  q[C]['push'](x),
                    x['level'] = C,
                    B = true;
                  break;
                }
              }
              B || (q.push([x]),
                x['level'] = q.length - 1);
            }
          }
          var v = Math['max'](...v.map(E => E['level'])),
            A = p['find'](E => E['is_root']);
          A && 1 < p.length ? A['level'] = v < 0 ? 0 : v + 1 : A['level'] = 0,
            j[m] = p;
        }),
        3 !== g && 4 !== g || i.forEach(m => {
          var p = j[m]['sort']((s, v) => s['min'] - v['min']);
          for (let s = 0; s < p.length; s++) {
            var q = p[s];
            q['prev'] = q['min'],
              q['next'] = h[m] - q['max'],
              q['is_root'] ? (q['from'] = 'bottom',
                q['interval_min'] = 0,
                q['interval_max'] = h[m]) : (q['from'] = 'bottom',
                q['interval_min'] = 0,
                q['interval_max'] = q['prev']);
          }
          j[m] = p;
        }),
        5 === g && i.forEach(m => {
          var p = new Map(),
            q = ['x', 'y', 'z']['filter'](F => F !== m),
            v = j[m]['sort']((F, G) => F['min'] - G['min']);
          for (let F = 0; F < v.length; F++) {
            var w = v[F],
              y = w['section_path'] || '0';
            p['has'](y) || p['set'](y, []),
              p['get'](y)['push'](w);
          }
          var z = [],
            A, B;
          for ([A, B] of p) {
            var C = B['sort']((G, H) => G['min'] - H['min']),
              D, E;
            for (let G = 0; G < C.length; G++) {
              let H = C[G];
              if (!H['is_root']) {
                if (0 === G)
                  H['prev'] = H['min'] - H['section_pos'][m];
                else {
                  let I = false;
                  for (let J = G - 1; 0 <= J; J--) {
                    let K = C[J];
                    if (q['every'](L => {
                        var N, O, L;
                        return !!(H['pos'] && H['size'] && K['pos'] && K['size']) && (N = H['pos'][L] + H['size'][
                          L] / 2,
                          O = K['pos'][L],
                          L = K['pos'][L] + K['size'][L],
                          O < N) && N < L;
                      })) {
                      H['min'] >= K['max'] && (H['prev'] = 0),
                        I = true;
                      break;
                    }
                  }
                  I || (H['prev'] = H['min'] - H['section_pos'][m]);
                }
                if (G === C.length - 1)
                  H['next'] = H['section_size'][m] + H['section_pos'][m] - H['max'];
                else {
                  let L = false;
                  for (let N = G + 1; N < C.length; N++) {
                    let O = C[N];
                    if (q['every'](P => {
                        var Q, R, P;
                        return !!(H['pos'] && H['size'] && O['pos'] && O['size']) && (Q = H['pos'][P] + H['size'][
                          P] / 2,
                          R = O['pos'][P],
                          P = O['pos'][P] + O['size'][P],
                          R < Q) && Q < P;
                      })) {
                      O['min'] >= H['max'] ? H['next'] = O['min'] - H['max'] : H['next'] = 0,
                        L = true;
                      break;
                    }
                  }
                  L || (H['next'] = H['section_size'][m] + H['section_pos'][m] - H['max']);
                }
              }
            }
            z.push(...C);
          }
          j[m] = z['sort']((P, Q) => P['min'] - Q['min']);
        }),
        j;
    }
  }

  function makeTextSprite(j, k, q, x, y) {
    var z = (y = void 0 === y ? {} : y)['hasOwnProperty']('fontface') ? y['fontface'] : 'Arial',
      A = y['hasOwnProperty']('fontsize') ? y['fontsize'] : 18,
      B = y['hasOwnProperty']('borderThickness') ? y['borderThickness'] : 4,
      D = y['hasOwnProperty']('borderColor') ? y['borderColor'] : {
        'r': 0,
        'g': 0,
        'b': 0,
        'a': 1
      },
      E = y['hasOwnProperty']('fillColor') ? y['fillColor'] : void 0,
      F = y['hasOwnProperty']('textColor') ? y['textColor'] : {
        'r': 0,
        'g': 0,
        'b': 0,
        'a': 1
      },
      G = y['hasOwnProperty']('radius') ? y['radius'] : 6,
      H = y['hasOwnProperty']('vAlign') ? y['vAlign'] : 'center',
      y = y['hasOwnProperty']('hAlign') ? y['hAlign'] : 'center',
      I = document['createElement']('canvas'),
      J = I['getContext']('2d');
    I['width'] = 2048,
      I['height'] = 1024,
      J['font'] = A + 'px\x20' + z,
      J['textBaseline'] = 'alphabetic',
      J['textAlign'] = 'left';
    var K, z = J['measureText'](j)['width'],
      L = I['width'] / 2,
      N = I['height'] / 2,
      O = z / 2,
      P = A / 2;

    function Q(R, S, U, W, Z, a0) {
      for (var a1 = S.split('\x0a'), a2 = a0, a3 = '', a4 = [], a5 = [], a6 = 0; a6 < a1.length; a6++)
        if (R['measureText'](a1[a6])['width'] <= Z)
          a5.push(a1[a6]),
          a2 += a0;
        else
          for (var a7 = a1[a6]['split']('\x20'), a8 = 0; a8 < a7.length; a8++) {
            var a9 = a3 + a7[a8] + '\x20',
              aa, ab;
            Z < R['measureText'](a9)['width'] && 0 < a8 ? (a4.push(R['measureText'](a3)['width']),
              a5.push(a3),
              a3 = a7[a8] + '\x20',
              a2 += a0) : a3 = a9;
          }
      for (var ac = W - a2 + a0, ad = 0; ad < a5.length; ad++)
        R['fillText'](a5[ad], I['width'] / 2 - Z / 2, ac),
        ac += a0;
      return R['fillText'](a3, I['width'] / 2 - Z / 2, ac),
        a2;
    }
    'bottom' === H ? P = 0 : 'top' === H && (P = A),
      'left' === y ? O = 0 : 'right' === y && (O = z),
      J['fillStyle'] = getCanvasColor(F);
    var H = Q(J, j, L - O, N + P, 600, 60),
      y = (roundRect(J, I['width'] / 2 - 300 - 20, N + P + 0.28 * A, 620, H, G, B, D, E),
        new THREE['Texture'](I)),
      z = (y['needsUpdate'] = true,
        new THREE['SpriteMaterial']({
          'map': y
        })),
      F = (z['depthWrite'] = false,
        z['depthTest'] = false,
        new THREE['Sprite'](z));
    return F['scale']['set'](200, 100, 1),
      F['position']['set'](k, q, x),
      F['userData']['mouse_events'] = false,
      F;
  }

  function roundRect(f, g, h, j, k, m, p, q, u) {
    void 0 === u && void 0 === q || (g -= p + m,
      h += p + m,
      j += 2 * p + 2 * m,
      k += 2 * p + 2 * m,
      f['beginPath'](),
      f['moveTo'](g + m, h),
      f['lineTo'](g + j - m, h),
      f['quadraticCurveTo'](g + j, h, g + j, h - m),
      f['lineTo'](g + j, h - k + m),
      f['quadraticCurveTo'](g + j, h - k, g + j - m, h - k),
      f['lineTo'](g + m, h - k),
      f['quadraticCurveTo'](g, h - k, g, h - k + m),
      f['lineTo'](g, h - m),
      f['quadraticCurveTo'](g, h, g + m, h),
      f['closePath'](),
      f['lineWidth'] = p,
      void 0 !== u && (f['fillStyle'] = getCanvasColor(u),
        f['fill']()),
      0 < p && void 0 !== q && (f['strokeStyle'] = getCanvasColor(q),
        f['stroke']()));
  }

  function getCanvasColor(f) {
    return 'rgba(' + f['r'] + ',' + f['g'] + ',' + f['b'] + ',' + f['a'] + ')';
  }

  function hide_comments() {
    _.forEach(room['active_objects'], function(f) {
      'function' == typeof f['hide_comments'] && f['hide_comments']();
    });
  }

  function show_comments() {
    _.forEach(room['active_objects'], function(f) {
      'function' == typeof f['show_comments'] && f['show_comments']();
    });
  }

  function set_custom_userdata(e) {
    project_settings['custom_userdata'] = e;
  }

  function get_custom_userdata() {
    return project_settings['custom_userdata'];
  }

  function get_price_total() {
    get_total_price_test();
  }
  ((() => {
    class e {
      constructor(f, g) {
          this['element'] = document['createElement']('div'),
            this['element']['classList']['add'](g),
            this['element']['style']['pointerEvents'] = 'none',
            this['renderer'] = f,
            this['startPoint'] = new THREE['Vector2'](),
            this['pointTopLeft'] = new THREE['Vector2'](),
            this['pointBottomRight'] = new THREE['Vector2'](),
            this['isDown'] = false,
            this['onPointerDown'] = function(h) {
              'drag' == global_options['mouse_mode']['mode'] && h['shiftKey'] && 1 == custom_settings[
                'group_enabled'] && 1 != dControls['has_selected'] && (this['isDown'] = true,
                this['onSelectStart'](h));
            }
            ['bind'](this),
            this['onPointerMove'] = function(h) {
              h['shiftKey'] && 1 == custom_settings['group_enabled'] && 1 != dControls['has_selected'] && this[
                'isDown'] && this['onSelectMove'](h);
            }
            ['bind'](this),
            this['onPointerUp'] = function() {
              this['isDown'] && (setTimeout(() => {
                  this['isDown'] = false;
                }, 100),
                this['onSelectOver']());
            }
            ['bind'](this),
            this['renderer']['domElement']['addEventListener']('pointerdown', this['onPointerDown']),
            this['renderer']['domElement']['addEventListener']('pointermove', this['onPointerMove']),
            this['renderer']['domElement']['addEventListener']('pointerup', this['onPointerUp']);
        }
        ['dispose']() {
          this['renderer']['domElement']['removeEventListener']('pointerdown', this['onPointerDown']),
            this['renderer']['domElement']['removeEventListener']('pointermove', this['onPointerMove']),
            this['renderer']['domElement']['removeEventListener']('pointerup', this['onPointerUp']);
        }
        ['onSelectStart'](f) {
          this['element']['style']['display'] = 'none',
            this['renderer']['domElement']['parentElement']['appendChild'](this['element']),
            this['element']['style']['left'] = f['clientX'] + 'px',
            this['element']['style']['top'] = f['clientY'] + 'px',
            this['element']['style']['width'] = '0px',
            this['element']['style']['height'] = '0px',
            this['startPoint']['x'] = f['clientX'],
            this['startPoint']['y'] = f['clientY'];
        }
        ['onSelectMove'](f) {
          this['element']['style']['display'] = 'block',
            this['pointBottomRight']['x'] = Math['max'](this['startPoint']['x'], f['clientX']),
            this['pointBottomRight']['y'] = Math['max'](this['startPoint']['y'], f['clientY']),
            this['pointTopLeft']['x'] = Math['min'](this['startPoint']['x'], f['clientX']),
            this['pointTopLeft']['y'] = Math['min'](this['startPoint']['y'], f['clientY']),
            this['element']['style']['left'] = this['pointTopLeft']['x'] + 'px',
            this['element']['style']['top'] = this['pointTopLeft']['y'] + 'px',
            this['element']['style']['width'] = this['pointBottomRight']['x'] - this['pointTopLeft']['x'] + 'px',
            this['element']['style']['height'] = this['pointBottomRight']['y'] - this['pointTopLeft']['y'] + 'px';
        }
        ['onSelectOver']() {
          this['element']['parentElement']['removeChild'](this['element']);
        }
    }
    THREE['SelectionHelper'] = e;
  })()),
  ((() => {
    let f = new THREE['Frustum'](),
      g = new THREE['Vector3'](),
      k = new THREE['Vector3'](),
      q = new THREE['Vector3'](),
      v = new THREE['Vector3'](),
      w = new THREE['Vector3'](),
      x = new THREE['Vector3'](),
      y = new THREE['Vector3'](),
      z = new THREE['Vector3'](),
      A = new THREE['Vector3'](),
      B = new THREE['Vector3'](),
      C = new THREE['Vector3'](),
      D = new THREE['Vector3'](),
      F = new THREE['Vector3'](),
      G = new THREE['Vector3']();
    var H = new THREE['Matrix4'](),
      I = new THREE['Quaternion'](),
      J = new THREE['Vector3']();
    class K {
      constructor(L, N, O = Number['MAX_VALUE']) {
          this['camera'] = L,
            this['scene'] = N,
            this['startPoint'] = new THREE['Vector3'](),
            this['endPoint'] = new THREE['Vector3'](),
            this['collection'] = [],
            this['instances'] = {},
            this['deep'] = O;
        }
        ['select'](L, N) {
          return this['startPoint'] = L || this['startPoint'],
            this['endPoint'] = N || this['endPoint'],
            this['collection'] = [],
            this['updateFrustum'](this['startPoint'], this['endPoint']),
            this['searchChildInFrustum'](f, this['scene']),
            this['collection'];
        }
        ['updateFrustum'](L, N) {
          var O, O, P, Q, L, N;
          L = L || this['startPoint'],
            N = N || this['endPoint'],
            L['x'] === N['x'] && (N['x'] += Number['EPSILON']),
            L['y'] === N['y'] && (N['y'] += Number['EPSILON']),
            this['camera']['updateProjectionMatrix'](),
            this['camera']['updateMatrixWorld'](),
            this['camera']['isPerspectiveCamera'] ? (k['copy'](L),
              k['x'] = Math['min'](L['x'], N['x']),
              k['y'] = Math['max'](L['y'], N['y']),
              N['x'] = Math['max'](L['x'], N['x']),
              N['y'] = Math['min'](L['y'], N['y']),
              q['setFromMatrixPosition'](this['camera']['matrixWorld']),
              v['copy'](k),
              w['set'](N['x'], k['y'], 0),
              x['copy'](N),
              y['set'](k['x'], N['y'], 0),
              v['unproject'](this['camera']),
              w['unproject'](this['camera']),
              x['unproject'](this['camera']),
              y['unproject'](this['camera']),
              D['copy'](v)['sub'](q),
              F['copy'](w)['sub'](q),
              G['copy'](x)['sub'](q),
              D['normalize'](),
              F['normalize'](),
              G['normalize'](),
              D['multiplyScalar'](this['deep']),
              F['multiplyScalar'](this['deep']),
              G['multiplyScalar'](this['deep']),
              D['add'](q),
              F['add'](q),
              G['add'](q),
              (O = f['planes'])[0]['setFromCoplanarPoints'](q, v, w),
              O[1]['setFromCoplanarPoints'](q, w, x),
              O[2]['setFromCoplanarPoints'](x, y, q),
              O[3]['setFromCoplanarPoints'](y, v, q),
              O[4]['setFromCoplanarPoints'](w, x, y),
              O[5]['setFromCoplanarPoints'](G, F, D),
              O[5]['normal']['multiplyScalar'](-1)) : this['camera']['isOrthographicCamera'] && (O = Math['min']
              (L['x'], N['x']),
              P = Math['max'](L['y'], N['y']),
              Q = Math['max'](L['x'], N['x']),
              L = Math['min'](L['y'], N['y']),
              v['set'](O, P, -1),
              w['set'](Q, P, -1),
              x['set'](Q, L, -1),
              y['set'](O, L, -1),
              z['set'](O, P, 1),
              A['set'](Q, P, 1),
              B['set'](Q, L, 1),
              C['set'](O, L, 1),
              v['unproject'](this['camera']),
              w['unproject'](this['camera']),
              x['unproject'](this['camera']),
              y['unproject'](this['camera']),
              z['unproject'](this['camera']),
              A['unproject'](this['camera']),
              B['unproject'](this['camera']),
              C['unproject'](this['camera']),
              (N = f['planes'])[0]['setFromCoplanarPoints'](v, z, A),
              N[1]['setFromCoplanarPoints'](w, A, B),
              N[2]['setFromCoplanarPoints'](B, C, y),
              N[3]['setFromCoplanarPoints'](C, z, v),
              N[4]['setFromCoplanarPoints'](w, x, y),
              N[5]['setFromCoplanarPoints'](B, A, z),
              N[5]['normal']['multiplyScalar'](-1));
        }
        ['searchChildInFrustum'](L, N) {
          for (let P = 0; P < d_objects.length; P++) {
            var O = d_objects[P]['size_box'];
            null === O['geometry']['boundingSphere'] && O['geometry']['computeBoundingSphere'](),
              g['copy'](O['geometry']['boundingSphere']['center']),
              g['applyMatrix4'](O['matrixWorld']),
              L['containsPoint'](g) && this['collection']['push'](d_objects[P]);
          }
        }
    }
    THREE['SelectionBox'] = K;
  })()),
  ((() => {
    let f = {
        'c': null,
        'u': [new THREE['Vector3'](), new THREE['Vector3'](), new THREE['Vector3']()],
        'e': []
      },
      g = {
        'c': null,
        'u': [new THREE['Vector3'](), new THREE['Vector3'](), new THREE['Vector3']()],
        'e': []
      },
      j = [
        [],
        [],
        []
      ],
      k = [
        [],
        [],
        []
      ],
      q = [],
      v = new THREE['Vector3'](),
      w = new THREE['Vector3'](),
      x = new THREE['Vector3'](),
      y = new THREE['Vector3'](),
      z = new THREE['Vector3'](),
      A = new THREE['Vector3'](),
      B = new THREE['Matrix3'](),
      C = new THREE['Box3'](),
      D = new THREE['Matrix4'](),
      F = new THREE['Matrix4'](),
      G = new THREE['Ray']();
    class H {
      constructor(J = new THREE['Vector3'](), K = new THREE['Vector3'](), L = new THREE['Matrix3']()) {
          this['center'] = J,
            this['halfSize'] = K,
            this['rotation'] = L;
        }
        ['set'](J, K, L) {
          return this['center'] = J,
            this['halfSize'] = K,
            this['rotation'] = L,
            this;
        }
        ['copy'](J) {
          return this['center']['copy'](J['center']),
            this['halfSize']['copy'](J['halfSize']),
            this['rotation']['copy'](J['rotation']),
            this;
        }
        ['clone']() {
          return new this.constructor()['copy'](this);
        }
        ['getSize'](J) {
          return J['copy'](this['halfSize'])['multiplyScalar'](2);
        }
        ['clampPoint'](J, K) {
          var L = this['halfSize'],
            J = (y['subVectors'](J, this['center']),
              this['rotation']['extractBasis'](v, w, x),
              K['copy'](this['center']),
              THREE['MathUtils']['clamp'](y['dot'](v), -L['x'], L['x'])),
            J = (K['add'](v['multiplyScalar'](J)),
              THREE['MathUtils']['clamp'](y['dot'](w), -L['y'], L['y'])),
            J = (K['add'](w['multiplyScalar'](J)),
              THREE['MathUtils']['clamp'](y['dot'](x), -L['z'], L['z']));
          return K['add'](x['multiplyScalar'](J)),
            K;
        }
        ['containsPoint'](J) {
          return y['subVectors'](J, this['center']),
            this['rotation']['extractBasis'](v, w, x),
            Math['abs'](y['dot'](v)) <= this['halfSize']['x'] && Math['abs'](y['dot'](w)) <= this['halfSize'][
            'y'] && Math['abs'](y['dot'](x)) <= this['halfSize']['z'];
        }
        ['intersectsBox3'](J) {
          return this['intersectsOBB'](I['fromBox3'](J));
        }
        ['intersectsSphere'](J) {
          return this['clampPoint'](J['center'], A),
            A['distanceToSquared'](J['center']) <= J['radius'] * J['radius'];
        }
        ['intersectsOBB'](J, K = Number['EPSILON']) {
          f['c'] = this['center'],
            f['e'][0] = this['halfSize']['x'],
            f['e'][1] = this['halfSize']['y'],
            f['e'][2] = this['halfSize']['z'],
            this['rotation']['extractBasis'](f['u'][0], f['u'][1], f['u'][2]),
            g['c'] = J['center'],
            g['e'][0] = J['halfSize']['x'],
            g['e'][1] = J['halfSize']['y'],
            g['e'][2] = J['halfSize']['z'],
            J['rotation']['extractBasis'](g['u'][0], g['u'][1], g['u'][2]);
          for (let O = 0; O < 3; O++)
            for (let P = 0; P < 3; P++)
              j[O][P] = f['u'][O]['dot'](g['u'][P]);
          y['subVectors'](g['c'], f['c']),
            q[0] = y['dot'](f['u'][0]),
            q[1] = y['dot'](f['u'][1]),
            q[2] = y['dot'](f['u'][2]);
          for (let Q = 0; Q < 3; Q++)
            for (let R = 0; R < 3; R++)
              k[Q][R] = Math['abs'](j[Q][R]) + K;
          let L, N;
          for (let S = 0; S < 3; S++)
            if (L = f['e'][S],
              N = g['e'][0] * k[S][0] + g['e'][1] * k[S][1] + g['e'][2] * k[S][2],
              Math['abs'](q[S]) > L + N)
              return false;
          for (let T = 0; T < 3; T++)
            if (L = f['e'][0] * k[0][T] + f['e'][1] * k[1][T] + f['e'][2] * k[2][T],
              N = g['e'][T],
              Math['abs'](q[0] * j[0][T] + q[1] * j[1][T] + q[2] * j[2][T]) > L + N)
              return false;
          return L = f['e'][1] * k[2][0] + f['e'][2] * k[1][0],
            N = g['e'][1] * k[0][2] + g['e'][2] * k[0][1],
            !(Math['abs'](q[2] * j[1][0] - q[1] * j[2][0]) > L + N || (L = f['e'][1] * k[2][1] +
              f['e'][2] * k[1][1],
              N = g['e'][0] * k[0][2] + g['e'][2] * k[0][0],
              Math['abs'](q[2] * j[1][1] - q[1] * j[2][1]) > L + N) || (L = f['e'][1] * k[2][
              2] + f['e'][2] * k[1][2],
              N = g['e'][0] * k[0][1] + g['e'][1] * k[0][0],
              Math['abs'](q[2] * j[1][2] - q[1] * j[2][2]) > L + N) || (L = f['e'][0] * k[2][
              0] + f['e'][2] * k[0][0],
              N = g['e'][1] * k[1][2] + g['e'][2] * k[1][1],
              Math['abs'](q[0] * j[2][0] - q[2] * j[0][0]) > L + N) || (L = f['e'][0] * k[2][
              1] + f['e'][2] * k[0][1],
              N = g['e'][0] * k[1][2] + g['e'][2] * k[1][0],
              Math['abs'](q[0] * j[2][1] - q[2] * j[0][1]) > L + N) || (L = f['e'][0] * k[2][
              2] + f['e'][2] * k[0][2],
              N = g['e'][0] * k[1][1] + g['e'][1] * k[1][0],
              Math['abs'](q[0] * j[2][2] - q[2] * j[0][2]) > L + N) || (L = f['e'][0] * k[1][
              0] + f['e'][1] * k[0][0],
              N = g['e'][1] * k[2][2] + g['e'][2] * k[2][1],
              Math['abs'](q[1] * j[0][0] - q[0] * j[1][0]) > L + N) || (L = f['e'][0] * k[1][
              1] + f['e'][1] * k[0][1],
              N = g['e'][0] * k[2][2] + g['e'][2] * k[2][0],
              Math['abs'](q[1] * j[0][1] - q[0] * j[1][1]) > L + N) || (L = f['e'][0] * k[1][
              2] + f['e'][1] * k[0][2],
              N = g['e'][0] * k[2][1] + g['e'][1] * k[2][0],
              Math['abs'](q[1] * j[0][2] - q[0] * j[1][2]) > L + N));
        }
        ['intersectsPlane'](J) {
          this['rotation']['extractBasis'](v, w, x);
          var K = this['halfSize']['x'] * Math['abs'](J['normal']['dot'](v)) + this['halfSize']['y'] * Math['abs'](
              J['normal']['dot'](w)) + this['halfSize']['z'] * Math['abs'](J['normal']['dot'](x)),
            J = J['normal']['dot'](this['center']) - J['constant'];
          return Math['abs'](J) <= K;
        }
        ['intersectRay'](J, K) {
          return this['getSize'](z),
            C['setFromCenterAndSize'](y['set'](0, 0, 0), z),
            D['setFromMatrix3'](this['rotation']),
            D['setPosition'](this['center']),
            F['copy'](D)['invert'](),
            G['copy'](J)['applyMatrix4'](F),
            G['intersectBox'](C, K) ? K['applyMatrix4'](D) : null;
        }
        ['intersectsRay'](J) {
          return null !== this['intersectRay'](J, y);
        }
        ['fromBox3'](J) {
          return J['getCenter'](this['center']),
            J['getSize'](this['halfSize'])['multiplyScalar'](0.5),
            this['rotation']['identity'](),
            this;
        }
        ['equals'](J) {
          return J['center']['equals'](this['center']) && J['halfSize']['equals'](this['halfSize']) && J['rotation']
            ['equals'](this['rotation']);
        }
        ['applyMatrix4'](J) {
          var K = J['elements'];
          let L = y['set'](K[0], K[1], K[2])['length']();
          var N = y['set'](K[4], K[5], K[6])['length'](),
            K = y['set'](K[8], K[9], K[10])['length'](),
            O, P = (J['determinant']() < 0 && (L = -L),
              B['setFromMatrix4'](J),
              1 / L),
            Q = 1 / N,
            R = 1 / K;
          return B['elements'][0] *= P,
            B['elements'][1] *= P,
            B['elements'][2] *= P,
            B['elements'][3] *= Q,
            B['elements'][4] *= Q,
            B['elements'][5] *= Q,
            B['elements'][6] *= R,
            B['elements'][7] *= R,
            B['elements'][8] *= R,
            this['rotation']['multiply'](B),
            this['halfSize']['x'] *= L,
            this['halfSize']['y'] *= N,
            this['halfSize']['z'] *= K,
            y['setFromMatrixPosition'](J),
            this['center']['add'](y),
            this;
        }
    }
    let I = new H();
    THREE['OBB'] = H;
  })());
  class DragGroup extends PPObject {
    constructor(e) {
        super(e),
          this['params'] = {
            'obj_id': void 0 !== e['obj_id'] ? e['obj_id'] : void 0,
            'children': void 0 !== e['children'] ? e['children'] : [],
            'width': void 0 !== e['width'] ? e['width'] : 100,
            'height': void 0 !== e['height'] ? e['height'] : 100,
            'depth': void 0 !== e['depth'] ? e['depth'] : 100
          },
          this['params']['cabinet_group'] = 'bottom',
          this['size_box'] = new SizeBox({
            'width': this['params']['width'],
            'height': this['params']['height'],
            'depth': this['params']['depth']
          }),
          this['g_objects'] = new THREE['Group'](),
          this['g_objects']['name'] = 'g_objects',
          this['add'](this['g_objects']),
          this['add'](this['size_box']),
          this['size_box']['position']['y'] = this['params']['height'] / 2,
          this['size_box']['visible'] = false,
          this['box'] = new THREE['Box3'](),
          this['box']['update'] = () => {
            this['box']['setFromObject'](this['size_box']);
          },
          this['obj_list'] = [],
          this['object_type'] = 'drag_group';
      }
      ['copypaste']() {
        var f = h(this);
        ce(),
          ce();
        for (let i = f.length; i--;)
          f[i]['write_points']();
        var g = sc['add_object']('drag_group', {}, true);

        function h(j) {
          let k = [];
          for (let p = 0; p < j['params']['children']['length']; p++) {
            var l = j['params']['children'][p],
              l = sc['get_object_by_obj_id'](l),
              m, n, m, n;
            'drag_group' == l['params']['object_type'] ? k = k['concat'](h(l)) : (m = l['userData']['params'],
              m = ((n = copy_object(m))['obj_id'] = sc['generate_obj_id'](),
                sc['add_object'](m['object_type'], n, false)),
              n = l['getWorldPosition'](),
              m['position']['set'](n['x'], n['y'], n['z']),
              m['setRotationFromQuaternion'](l['getWorldQuaternion'](new THREE['Quaternion']())['clone']()),
              k.push(m));
          }
          return k;
        }
        return g['add_objects'](f),
          dControls['select_object'](g),
          g;
      }
      ['add_object'](f, g = true) {
        for (let i = this['obj_list']['length']; i--;)
          scene['attach'](this['obj_list'][i]);
        this['obj_list']['push'](f),
          f['userData']['grouped'] = 1,
          g && this['params']['children']['push'](f['params']['obj_id']),
          this['set_drag_group']();
        var h = {};
        for (let j = this['obj_list']['length']; j--;)
          h[this['obj_list'][j]['uuid']] = 1,
          this['g_objects']['attach'](this['obj_list'][j]);
        for (let k = d_objects.length; k--;)
          h[d_objects[k]['uuid']] && d_objects['splice'](k, 1);
      }
      ['add_objects'](f, g = true) {
        for (let n = this['obj_list']['length']; n--;)
          scene['attach'](this['obj_list'][n]);
        var h = new THREE['Vector3'](1 / 0, 1 / 0, 1 / 0),
          j = new THREE['Vector3'](-1 / 0, -1 / 0, -1 / 0);
        for (let p = f.length; p--;) {
          var k = f[p]['userData']['points'];
          for (let q = k.length; q--;)
            h['x'] = Math['min'](h['x'], k[q]['pos']['x']),
            h['y'] = Math['min'](h['y'], k[q]['pos']['y']),
            h['z'] = Math['min'](h['z'], k[q]['pos']['z']),
            j['x'] = Math['max'](j['x'], k[q]['pos']['x']),
            j['y'] = Math['max'](j['y'], k[q]['pos']['y']),
            j['z'] = Math['max'](j['z'], k[q]['pos']['z']);
          this['obj_list']['push'](f[p]),
            g && this['params']['children']['push'](f[p]['params']['obj_id']),
            f[p]['userData']['grouped'] = 1;
        }
        var l = j['add'](h)['multiplyScalar'](0.5),
          m = (l['y'] = 0,
            this['position']['copy'](l),
            this['set_drag_group'](), {});
        for (let u = this['obj_list']['length']; u--;)
          m[this['obj_list'][u]['uuid']] = 1,
          this['g_objects']['attach'](this['obj_list'][u]);
        for (let v = d_objects.length; v--;)
          m[d_objects[v]['uuid']] && d_objects['splice'](v, 1);
        this['set_snap_points']();
      }
      ['calc_rotation']() {
        var f = this['obj_list'][0]['rotation']['y'],
          g = this['obj_list'][0]['rotation']['y'];
        let h = 0;
        for (let i = this['obj_list']['length']; i--;)
          this['obj_list'][i]['rotation']['y'] != f && (h = 1);
        1 == h ? this['userData']['interaction']['rotation_locked'] = 1 : (this['userData']['interaction'][
            'rotation_locked'
          ] = 0,
          this['rotation']['y'] = g,
          this['g_objects']['rotation']['y'] = -g,
          this['size_box']['rotation']['y'] = -g);
      }
      ['restore']() {
        for (let f = d_objects.length; f--;)
          for (let g = this['params']['children']['length']; g--;)
            d_objects[f]['params'] && d_objects[f]['params']['obj_id'] && this['params']['children'][g] == d_objects[f][
              'params'
            ]['obj_id'] && (d_objects[f]['userData']['grouped'] = 1,
              this['g_objects']['attach'](d_objects[f]),
              this['obj_list']['push'](d_objects[f]),
              d_objects['splice'](f, 1));
        this['set_drag_group'](),
          this['calc_rotation']();
      }
      ['set_drag_group']() {
        var f = {};
        for (let g = this['obj_list']['length']; g--;)
          this['obj_list'][g]['params']['cabinet_group'] ? f[this['obj_list'][g]['params']['cabinet_group']] = 1 :
          this['obj_list'][g]['params']['spec'] && this['obj_list'][g]['params']['spec']['group'] && (f[this['obj_list']
            [g]['params']['spec']['group']] = 1);
        f['top'] && f['bottom'] && (this['params']['cabinet_group'] = 'bottom'),
          f['top'] && (this['params']['cabinet_group'] = 'top'),
          f['bottom'] && (this['params']['cabinet_group'] = 'bottom'),
          this['cabinet_type'] = this['params']['cabinet_group'];
      }
      ['calc_size']() {
        var f = new THREE['Box3'](),
          g = (this['remove'](this['size_box']),
            this['obj_list'][0]['rotation']['y']),
          h = 0;
        for (let l = this['obj_list']['length']; l--;)
          this['obj_list'][l]['rotation']['y'],
          f['expandByObject'](this['obj_list'][l]['size_box']);
        var j = f['getSize'](new THREE['Vector3']()),
          k = (this['size_box'] = new SizeBox({
              'width': j['x'],
              'height': j['y'],
              'depth': j['z']
            }),
            this['params']['width'] = j['x'],
            this['params']['height'] = j['y'],
            this['params']['depth'] = j['z'],
            f['getCenter'](new THREE['Vector3']()));
        this['position']['x'] = k['x'],
          this['position']['z'] = k['z'],
          this['position']['y'] = k['y'] - j['y'] / 2,
          this['add'](this['size_box']),
          this['size_box']['position']['y'] = j['y'] / 2,
          this['size_box']['visible'] = false,
          this['box']['update']();
      }
      ['ungroup']() {
        this['size_box']['visible'] = false;
        for (let e = this['obj_list']['length']; e--;)
          d_objects.push(this['obj_list'][e]),
          this['obj_list'][e]['updateMatrixWorld'](),
          room['attach'](this['obj_list'][e]),
          this['obj_list'][e]['userData']['grouped'] = 0,
          this['obj_list'][e]['size_box']['visible'] = false,
          this['obj_list'][e]['updateMatrixWorld'](),
          setTimeout(() => {
            this['obj_list'][e]['write_points']();
          }, 10);
        for (let f = d_objects.length; f--;)
          this['uuid'] === d_objects[f]['uuid'] && d_objects['splice'](f, 1);
        this['delete'](true);
      }
      ['show_radial_menu'](f, g) {
        pp['interface']['root'] && pp['interface']['root']['radial']({
          'obj_type': this['type'],
          'obj': {
            'open_doors': false,
            'settings': false,
            'ungroup': true,
            'erase': false
          },
          'left': f,
          'top': g
        });
      }
      ['get_params']() {
        this['params']['children'] = [];
        for (let e = this['g_objects']['children']['length']; e--;)
          'drag_group' == this['g_objects']['children'][e]['params']['object_type'] && this['g_objects']['children'][e][
            'get_params'
          ](),
          this['params']['children']['push'](this['g_objects']['children'][e]['params']['obj_id']);
      }
      ['delete'](e = false) {
        if (!e) {
          for (let f = this['obj_list']['length']; f--;)
            this['obj_list'][f]['delete']();
        }
        super['delete']();
      }
      ['set_snap_points']() {
        this['userData']['points_list'] = [];
        for (let g = this['obj_list']['length']; g--;) {
          var f = this['obj_list'][g]['userData']['points_list'];
          this['userData']['points_list'] = this['userData']['points_list']['concat'](f);
        }
      }
      ['write_points'](e = false) {
        super['write_points'](e);
      }
      ['select']() {
        for (let e = this['obj_list']['length']; e--;)
          this['obj_list'][e]['select']();
      }
      ['unselect']() {
        for (let e = this['obj_list']['length']; e--;)
          this['obj_list'][e]['unselect']();
      }
      ['update_rulers']() {
        var f = [];
        for (let g = this['obj_list']['length']; g--;)
          f.push(this['obj_list'][g]['params']['obj_id']);
        sc['update_rulers_group'](f);
      }
  }
  class CFRN {
    ['disable_remote_flag'] = 1;
    async ['importFile'](f) {
      if (!f)
        throw new Error('Can\x27t\x20load\x20cfrn\x20file!');
      var f = await JSZip['loadAsync'](f);
      let g;
      try {
        var h = await f['file']('file.json')['async']('string');
        g = JSON['parse'](h);
      } catch (O) {
        throw new Error('Can\x27t\x20load\x20cfrn\x20file!\x20Can\x27t\x20read\x20file.json!');
      }
      if (!g || !g['model'] || !g['table'])
        throw new Error('Can\x27t\x20load\x20cfrn\x20file!\x20Wrong\x20file.json!');
      var f = g['model'] || {},
        m = g['modelParams'] || {},
        h = g['table']['objects'] || [],
        p = g['table']['holes'] || [],
        q = g['table']['materials'] || {};
      let u = new THREE['Matrix4'](),
        v = new THREE['Vector3'](),
        w = new THREE['Quaternion'](),
        x = new THREE['Vector3'](),
        y = new THREE['Euler'](),
        z = [];
      var B = {
          'size': {
            'x': 1,
            'y': 1,
            'z': 1
          },
          'type': 'module',
          'spec': {
            'variants': [{
              'size': {
                'x': 0,
                'y': 0,
                'z': 0
              }
            }],
            'templates': [{
              'min': {
                'x': 0,
                'y': 0,
                'z': 0
              },
              'max': {
                'x': 0,
                'y': 0,
                'z': 0
              },
              'template': {
                'tree': []
              }
            }],
            'mat_groups': [{
              'key': 'g0',
              'material': {
                'av_index': 0,
                'id': 183,
                'key': 'ldsp',
                'variant_id': 0
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
                'av_index': 0,
                'key': 'hdf',
                'variant_id': 0
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
                'av_index': 0,
                'key': 'glass',
                'variant_id': 0
              },
              'name': 'Стекло',
              'available': [{
                'key': 'glass',
                'thickness': [],
                'categories': []
              }]
            }]
          }
        },
        f, h, p, f, E;
      return f ? (K(f = G(f, h, p)),
        B['spec']['templates'][0]['template']['tree']['push'](f),
        h = Math['max'](...z.map(Q => Q['x'] || 1)),
        p = Math['max'](...z.map(Q => Q['y'] || 1)),
        f = Math['max'](...z.map(Q => Q['z'] || 1)),
        B['size'] = {
          'x': h,
          'y': p,
          'z': f
        },
        E = sc['add_object']('module', B, false)) : sc['add_object']('module', B, false);

      function G(Q, S, U, W = '', Z = 0) {
        let a0 = W ? W + ',' + Z : '' + Z;
        var W = _['get'](S, Q['tableIndex']) || {};
        let a1 = {
            'type': 'section',
            'active': 1,
            'name': W['name'] || '',
            'size': {
              'x': 's:x',
              'y': 's:y',
              'z': 's:z'
            },
            'pivot': {
              'x': -1,
              'y': -1,
              'z': -1
            }
          },
          a2, a3 = new THREE['Matrix4']();
        var a4 = [],
          Z = -1 / 0,
          a5 = -1 / 0;
        if ((2 === W['objType'] && !W['contour']['elemType'] || 2 === W['objType'] && W['contour']['elemType']) &&
          (a1['type'] = 'wall',
            a1['size'] = {
              'x': 's:x',
              'y': 's:y',
              'z': W['thickness'] || '40'
            },
            a1['spec'] = {
              'orientation': 'f'
            },
            a1['spec']['material'] = {
              'group': 'g0',
              'id': 183
            }),
          Q['matrix'] && 16 === Q['matrix']['length'] && (u['fromArray'](Q['matrix']),
            u['decompose'](v, w, x),
            0.001 < v['lengthSq']() && (a1['pos'] = {
              'x': v['x'],
              'y': v['y'],
              'z': v['z']
            }),
            y['setFromQuaternion'](w),
            0.001 < Math['abs'](y['x']) + Math['abs'](y['y']) + Math['abs'](y['z']) && (a1['rot'] = {
              'x': -1 * N(y['x']),
              'y': -1 * N(y['y']),
              'z': -1 * N(y['z'])
            }),
            a3['makeRotationFromQuaternion'](w)),
          W['contour'] && 2 === W['objType'] && (W['contour']['size'] && ((a2 = [])['push']({
                'x': 0,
                'y': 0
              }, {
                'x': W['contour']['size']['x'],
                'y': 0
              }, {
                'x': W['contour']['size']['x'],
                'y': W['contour']['size']['y']
              }, {
                'x': 0,
                'y': W['contour']['size']['y']
              }),
              a2.forEach(al => {
                var al = J(al, a1['pos'] || {
                  'x': 0,
                  'y': 0,
                  'z': 0
                }, a3);
                z.push(al);
              }),
              a1['size'] = {
                'x': W['contour']['size']['x'] || 's:x',
                'y': W['contour']['size']['y'] || 's:y',
                'z': W['thickness']
              },
              a1['spec']['points'] = a2.filter((al, am, an) => am === an.findIndex(ao => ao['x'] === al['x'] &&
                ao['y'] === al['y']))),
            W['contour'] && W['contour']['pos'] && (a1['pos'] = a1['pos'] || {
                'x': 0,
                'y': 0,
                'z': 0
              },
              a1['pivot']['x'] = '-1::' + W['contour']['pos']['x'],
              a1['pivot']['y'] = '-1::' + W['contour']['pos']['y']),
            W['contour']['list']) && !W['contour']['list']['some'](al => al['center']) && (a2 = [],
            W['contour']['list'] = L(W['contour']['list']),
            W['contour']['list']['forEach'](al => {
              1 == al['elemType'] && (a2.push({
                  'x': al['pos1']['x'],
                  'y': al['pos1']['y']
                }),
                a2.push({
                  'x': al['pos2']['x'],
                  'y': al['pos2']['y']
                }));
            }),
            a1['spec']['points'] = a2.filter((al, am, an) => am === an.findIndex(ao => ao['x'] === al['x'] &&
              ao['y'] === al['y'])),
            a2.forEach(al => {
              var al = J(al, a1['pos'] || {
                'x': 0,
                'y': 0,
                'z': 0
              }, a3);
              z.push(al);
            }),
            Z = a2['reduce']((al, am) => Math['max'](al, am['x']), -1 / 0),
            a5 = a2['reduce']((al, am) => Math['max'](al, am['y']), -1 / 0),
            a1['size'] = {
              'x': Z || 's:x',
              'y': a5 || 's:y',
              'z': W['thickness']
            },
            a1['pos'] = a1['pos'] || {
              'x': 0,
              'y': 0,
              'z': 0
            }),
          W['butts'] && W['butts']['length'] && 2 === W['objType']) {
          a1['children'] = a1['children'] || [],
            a1['spec']['butts'] = [];
          for (var a6 of W['butts']) {
            var a6 = a6['elemIndex'];
            a1['spec']['butts']['push']({
              'id': 183,
              'face_index': a6
            });
          }
        }
        if (W['grooves'] && W['grooves']['length'] && 2 === W['objType']) {
          a1['children'] = a1['children'] || [];
          var a7 = W['contour']['size']?.['x'] || 0,
            a8 = W['contour']['size']?.['y'] || 0,
            a9;
          let al = W['contour']?.['pos']?.['x'] || 0,
            am = W['contour']?.['pos']?.['y'] || 0;
          for (a9 of W['grooves'])
            if (a9['contour']?.['size']?.['x'] && a9['contour']?.['size']?.['y'] && a9['trajectory']?.['list']) {
              var aa = 'z',
                ab = a9['trajectory']['list']['map'](as => ({
                  'x': as['pos1']['x'] - al,
                  'y': as['pos1']['y'] - am
                })),
                ac = a9['trajectory']['list'][a9['trajectory']['list']['length'] - 1];
              ab.push({
                'x': ac['pos2']['x'] - al,
                'y': ac['pos2']['y'] - am
              });
              let an = 0,
                ao = 0;
              for (let as = 0; as < ab.length - 1; as++) {
                var ad = ab[as],
                  ae = ab[as + 1],
                  af = Math['abs'](ae['x'] - ad['x']),
                  ae = Math['abs'](ae['y'] - ad['y']);
                af > an && (an = af),
                  ae > ao && (ao = ae);
              }
              var ac = Math['max'](an, ao);
              let ap, aq, ar;
              ar = (aq = al < 0 || am < 0 ? (ap = -a9['contour']['pos']['x'] - a9['contour']['size']['x'] / 2,
                    0) : ao > an ? (ap = 0,
                    a9['contour']['pos']['x'] + a9['contour']['size']['x'] / 2) : (ap = a9['contour']['pos']['x'] +
                    a9['contour']['size']['x'] / 2,
                    0),
                  a9['contour']['pos']['y'] + a9['contour']['size']['y'] / 2),
                0 == al && 0 == am && (ar = (aq = ao > an ? (ap = 0,
                    a9['contour']['pos']['x'] + a9['contour']['size']['x'] / 2) : (ap = a9['contour']['pos'][
                    'x'] + a9['contour']['size']['x'] / 2,
                    0),
                  a9['contour']['pos']['y'] + a9['contour']['size']['y'] / 2)),
                a1['children']['push']({
                  'type': 'path',
                  'name': 'path',
                  'active': 1,
                  'size': {
                    'x': a9['contour']['size']['y'],
                    'y': a9['contour']['size']['x'],
                    'z': ac
                  },
                  'pos': {
                    'x': aq,
                    'y': ap,
                    'z': ar
                  },
                  'spec': {
                    'direction': aa,
                    'shape': 'rectangle',
                    'trajectory': ab
                  }
                });
            }
        }
        if (5 === W['objType'] && Q['matrix']) {
          Q['matrix'] && 16 === Q['matrix']['length'] && (u['fromArray'](Q['matrix']),
              u['decompose'](v, w, x),
              y['setFromQuaternion'](w)),
            a1 = {
              'type': 'furniture',
              'active': 1,
              'name': W['designation'] || W['name'] || 'objType5',
              'size': {
                'x': 0,
                'y': 0,
                'z': 0
              },
              'pos': {
                'x': v['x'] || 0,
                'y': v['y'] || 0,
                'z': v['z'] || 0
              },
              'children': []
            },
            0.001 < Math['abs'](y['x']) + Math['abs'](y['y']) + Math['abs'](y['z']) && (a1['rot'] = {
              'x': -1 * N(y['x']),
              'y': -1 * N(y['y']),
              'z': -1 * N(y['z'])
            }),
            a1['size'] = {
              'x': 0,
              'y': 0,
              'z': 0
            };
          var ag = {
              '1,0,0': 'x',
              '-1,0,0': '-x',
              '0,1,0': 'y',
              '0,-1,0': '-y',
              '0,0,1': 'z',
              '0,0,-1': '-z'
            },
            ah;
          for (ah of W['holes'] || []) {
            var ai = U[ah['infoIndex']],
              aj, ak;
            ai && ('z' != (ak = ag[ah['dir']['x'] + ',' + ah['dir']['y'] + ',' + ah['dir']['z']] || 'z') && '-z' !=
              ak || a1['children']['push']({
                'type': 'hole',
                'active': 1,
                'spec': {
                  'direction': ak
                },
                'size': {
                  'x': ai['diameter'],
                  'z': ai['depth']
                },
                'pos': {
                  'x': ah['pos']['x'],
                  'y': ah['pos']['y'],
                  'z': ah['pos']['z']
                }
              }),
              'x' != ak && '-x' != ak || a1['children']['push']({
                'type': 'hole',
                'active': 1,
                'spec': {
                  'direction': ak
                },
                'size': {
                  'x': ai['diameter'],
                  'z': ai['depth']
                },
                'pos': {
                  'z': ah['pos']['x'],
                  'y': ah['pos']['y'],
                  'x': ah['pos']['z']
                }
              }),
              'y' != ak && '-y' != ak || a1['children']['push']({
                'type': 'hole',
                'active': 1,
                'spec': {
                  'direction': ak
                },
                'size': {
                  'x': ai['diameter'],
                  'z': ai['depth']
                },
                'pos': {
                  'x': ah['pos']['x'],
                  'z': ah['pos']['y'],
                  'y': ah['pos']['z']
                }
              }));
          }
        } else
          Q['objs'] && Q['objs']['length'] && (a1['children'] = a1['children'] || [],
            Q['objs']['forEach']((at, au) => {
              a1['children']['push'](G(at, S, U, a0, au));
            }));
        return a1;
      }

      function J(Q, S = {
        'x': 0,
        'y': 0,
        'z': 0
      }, T) {
        var Q = new THREE['Vector3'](Q['x'], Q['y'], Q['z'] || 0);
        return Q['applyMatrix4'](T), {
          'x': Math['round'](Q['x'] + S['x']),
          'y': Math['round'](Q['y'] + S['y']),
          'z': Math['round'](Q['z'] + S['z'])
        };
      }

      function K(Q) {
        if (Array.isArray(Q))
          Q.forEach(K);
        else {
          if (Q && 'section' === Q['type'] && Q['children'] && Q['children']['length']) {
            let W = [];
            var S, T, U;
            Q['children']['forEach'](Z => {
                if ('wall' == Z['type'] && Z['size']) {
                  var a0 = Z['spec']['points'],
                    a1;
                  let a2 = new THREE['Matrix4']();
                  Z['rot'] && (a1 = new THREE['Euler'](THREE['Math']['degToRad'](Z['rot']['x'] || 0), THREE[
                          'Math']['degToRad'](Z['rot']['y'] || 0), THREE['Math']['degToRad'](Z['rot']['z'] ||
                        0), 'XYZ'),
                      a2['makeRotationFromEuler'](a1)),
                    a0.forEach(a3 => {
                      var a3 = J(a3, Z['pos'] || {
                        'x': 0,
                        'y': 0,
                        'z': 0
                      }, a2);
                      W.push(a3);
                    });
                }
              }),
              W.length && (S = Math['max'](...W.map(Z => Z['x'])),
                T = Math['max'](...W.map(Z => Z['y'])),
                U = Math['max'](...W.map(Z => Z['z'])),
                Q['size'] = {
                  'x': S,
                  'y': T,
                  'z': U
                });
          }
          Q['children'] && Q['children']['length'] && Q['children']['forEach'](K);
        }
      }

      function L(Q) {
        if (!Q || Q.length <= 1)
          return Q;
        let S = new Map();

        function T(a1, a2, a3) {
          var a4 = a1['x'] + ',' + a1['y'],
            a1 = S['get'](a4);
          if (a1) {
            for (var a5 of a1)
              if (!a3['has'](a5) && a5 !== a2) {
                var a6 = Q[a5],
                  a7 = a6['pos1']['x'] + ',' + a6['pos1']['y'],
                  a8 = a6['pos2']['x'] + ',' + a6['pos2']['y'];
                if (a7 == a4)
                  return {
                    'lineIndex': a5,
                    'nextPoint': a6['pos2'],
                    'line': a6
                  };
                if (a8 == a4)
                  return {
                    'lineIndex': a5,
                    'nextPoint': a6['pos1'],
                    'line': a6
                  };
              }
          }
          return null;
        }
        Q.forEach((a1, a2) => {
          var a3 = a1['pos1']['x'] + ',' + a1['pos1']['y'],
            a1 = a1['pos2']['x'] + ',' + a1['pos2']['y'];
          S['has'](a3) || S['set'](a3, new Set()),
            S['has'](a1) || S['set'](a1, new Set()),
            S['get'](a3)['add'](a2),
            S['get'](a1)['add'](a2);
        });
        var U = [],
          W;
        let Z = new Set();

        function a0(a1) {
          var a2 = [],
            a3 = Q[a1];
          let a4 = a3['pos2'];
          for (a2.push(a3),
            Z['add'](a1);;) {
            var a5 = T(a4, -1, Z);
            if (!a5)
              break;
            if (Z['has'](a5['lineIndex']))
              break;
            Z['add'](a5['lineIndex']),
              a2.push(a5['line']),
              a3 = a5['line'],
              a4 = a5['nextPoint'];
            var a5 = a2[0],
              a5 = a5['pos1']['x'] + ',' + a5['pos1']['y'];
            if (a4['x'] + ',' + a4['y'] == a5)
              break;
          }
          return a2;
        }
        for (let a1 = 0; a1 < Q.length; a1++) {
          Z['has'](a1) || (W = a0(a1),
            U.push(...W));
        }
        return U;
      }

      function N(Q) {
        return Q / Math['PI'] * 180;
      }
    }
    async ['importJSON'](f = '/cfrn/file.json') {
      var f = await promise_request(f),
        g = f['model'] || {},
        h = f['modelParams'] || {},
        l = f['table']['objects'] || [],
        m = f['table']['holes'] || [],
        p = f['table']['materials'] || {};
      let q = new THREE['Matrix4'](),
        u = new THREE['Vector3'](),
        v = new THREE['Quaternion'](),
        w = new THREE['Vector3'](),
        x = new THREE['Euler'](),
        y = [];
      var f = {
          'size': {
            'x': 1,
            'y': 1,
            'z': 1
          },
          'type': 'module',
          'active': 1,
          'spec': {
            'variants': [{
              'size': {
                'x': 0,
                'y': 0,
                'z': 0
              }
            }],
            'templates': [{
              'min': {
                'x': 0,
                'y': 0,
                'z': 0
              },
              'max': {
                'x': 0,
                'y': 0,
                'z': 0
              },
              'template': {
                'tree': []
              }
            }]
          }
        },
        g, l, m, g, m;
      return g ? (G(g = z(g, l, m)),
        f['spec']['templates'][0]['template']['tree']['push'](g),
        l = Math['max'](...y.map(L => L['x'] || 1)),
        m = Math['max'](...y.map(L => L['y'] || 1)),
        g = Math['max'](...y.map(L => L['z'] || 1)),
        f['size'] = {
          'x': l,
          'y': m,
          'z': g
        },
        (m = sc['add_object']('module', f, false))['position']['x'] = l / 2 / units,
        m['position']['z'] = g / 2 / units,
        m) : sc['add_object']('module', f, false);

      function z(L, N, O, P = '', Q = 0) {
        let S = P ? P + ',' + Q : '' + Q;
        var P = _['get'](N, L['tableIndex']) || {};
        let U = {
          'type': 'section',
          'active': 1,
          'name': P['name'] || '',
          'size': {
            'x': 's:x',
            'y': 's:y',
            'z': 's:z'
          },
          'pivot': {
            'x': -1,
            'y': -1,
            'z': -1
          }
        };
        U['path'] = S;
        let W, Z = new THREE['Matrix4']();
        var Q = -1 / 0,
          a0 = -1 / 0;
        if ((2 === P['objType'] && !P['contour']['elemType'] || 2 === P['objType'] && P['contour']['elemType']) &&
          (U['type'] = 'wall',
            U['size'] = {
              'x': 's:x',
              'y': 's:y',
              'z': P['thickness'] || '40'
            },
            U['spec'] = {
              'orientation': 'f'
            },
            U['spec']['material'] = {
              'group': 'g0',
              'id': 183
            }),
          L['matrix'] && 16 === L['matrix']['length'] && (q['fromArray'](L['matrix']),
            q['decompose'](u, v, w),
            0.001 < u['lengthSq']() && (U['pos'] = {
              'x': u['x'],
              'y': u['y'],
              'z': u['z']
            }),
            x['setFromQuaternion'](v),
            0.001 < Math['abs'](x['x']) + Math['abs'](x['y']) + Math['abs'](x['z']) && (U['rot'] = {
              'x': -1 * K(x['x']),
              'y': -1 * K(x['y']),
              'z': -1 * K(x['z'])
            }),
            Z['makeRotationFromQuaternion'](v)),
          P['contour'] && 2 === P['objType'] && (P['contour']['size'] && ((W = [])['push']({
                'x': 0,
                'y': 0
              }, {
                'x': P['contour']['size']['x'],
                'y': 0
              }, {
                'x': P['contour']['size']['x'],
                'y': P['contour']['size']['y']
              }, {
                'x': 0,
                'y': P['contour']['size']['y']
              }),
              W.forEach(ag => {
                var ag = E(ag, U['pos'] || {
                  'x': 0,
                  'y': 0,
                  'z': 0
                }, Z);
                y.push(ag);
              }),
              U['size'] = {
                'x': P['contour']['size']['x'] || 's:x',
                'y': P['contour']['size']['y'] || 's:y',
                'z': P['thickness']
              },
              U['spec']['points'] = W.filter((ag, ah, ai) => ah === ai.findIndex(aj => aj['x'] === ag['x'] &&
                aj['y'] === ag['y']))),
            P['contour'] && P['contour']['pos'] && (U['pos'] = U['pos'] || {
                'x': 0,
                'y': 0,
                'z': 0
              },
              U['pivot']['x'] = '-1::' + P['contour']['pos']['x'],
              U['pivot']['y'] = '-1::' + P['contour']['pos']['y']),
            P['contour']['list']) && !P['contour']['list']['some'](ag => ag['center']) && (W = [],
            P['contour']['list'] = B(P['contour']['list']),
            P['contour']['list']['forEach'](ag => {
              1 == ag['elemType'] && (W.push({
                  'x': ag['pos1']['x'],
                  'y': ag['pos1']['y']
                }),
                W.push({
                  'x': ag['pos2']['x'],
                  'y': ag['pos2']['y']
                }));
            }),
            U['spec']['points'] = W.filter((ag, ah, ai) => ah === ai.findIndex(aj => aj['x'] === ag['x'] && aj[
              'y'] === ag['y'])),
            W.forEach(ag => {
              var ag = E(ag, U['pos'] || {
                'x': 0,
                'y': 0,
                'z': 0
              }, Z);
              y.push(ag);
            }),
            Q = W['reduce']((ag, ah) => Math['max'](ag, ah['x']), -1 / 0),
            a0 = W['reduce']((ag, ah) => Math['max'](ag, ah['y']), -1 / 0),
            U['size'] = {
              'x': Q || 's:x',
              'y': a0 || 's:y',
              'z': P['thickness']
            },
            U['pos'] = U['pos'] || {
              'x': 0,
              'y': 0,
              'z': 0
            }),
          P['butts'] && P['butts']['length'] && 2 === P['objType']) {
          U['children'] = U['children'] || [],
            U['spec']['butts'] = [];
          for (var a1 of P['butts']) {
            var a1 = a1['elemIndex'];
            U['spec']['butts']['push']({
              'id': 183,
              'face_index': a1
            });
          }
        }
        if (P['grooves'] && P['grooves']['length'] && 2 === P['objType']) {
          U['children'] = U['children'] || [];
          var a2 = P['contour']['size']?.['x'] || 0,
            a3 = P['contour']['size']?.['y'] || 0,
            a4;
          let ag = P['contour']?.['pos']?.['x'] || 0,
            ah = P['contour']?.['pos']?.['y'] || 0;
          for (a4 of P['grooves'])
            if (a4['contour']?.['size']?.['x'] && a4['contour']?.['size']?.['y'] && a4['trajectory']?.['list']) {
              var a5 = 'z',
                a6 = a4['trajectory']['list']['map'](an => ({
                  'x': an['pos1']['x'] - ag,
                  'y': an['pos1']['y'] - ah
                })),
                a7 = a4['trajectory']['list'][a4['trajectory']['list']['length'] - 1];
              a6.push({
                'x': a7['pos2']['x'] - ag,
                'y': a7['pos2']['y'] - ah
              });
              let ai = 0,
                aj = 0;
              for (let an = 0; an < a6.length - 1; an++) {
                var a8 = a6[an],
                  a9 = a6[an + 1],
                  aa = Math['abs'](a9['x'] - a8['x']),
                  a9 = Math['abs'](a9['y'] - a8['y']);
                aa > ai && (ai = aa),
                  a9 > aj && (aj = a9);
              }
              var a7 = Math['max'](ai, aj);
              let ak, al, am;
              am = (al = ag < 0 || ah < 0 ? (ak = -a4['contour']['pos']['x'] - a4['contour']['size']['x'] / 2,
                    0) : aj > ai ? (ak = 0,
                    a4['contour']['pos']['x'] + a4['contour']['size']['x'] / 2) : (ak = a4['contour']['pos']['x'] +
                    a4['contour']['size']['x'] / 2,
                    0),
                  a4['contour']['pos']['y'] + a4['contour']['size']['y'] / 2),
                0 == ag && 0 == ah && (am = (al = aj > ai ? (ak = 0,
                    a4['contour']['pos']['x'] + a4['contour']['size']['x'] / 2) : (ak = a4['contour']['pos'][
                    'x'] + a4['contour']['size']['x'] / 2,
                    0),
                  a4['contour']['pos']['y'] + a4['contour']['size']['y'] / 2)),
                U['children']['push']({
                  'type': 'path',
                  'name': 'path',
                  'active': 1,
                  'size': {
                    'x': a4['contour']['size']['y'],
                    'y': a4['contour']['size']['x'],
                    'z': a7
                  },
                  'pos': {
                    'x': al,
                    'y': ak,
                    'z': am
                  },
                  'spec': {
                    'direction': a5,
                    'shape': 'rectangle',
                    'trajectory': a6
                  }
                });
            }
        }
        if (5 === P['objType'] && L['matrix']) {
          L['matrix'] && 16 === L['matrix']['length'] && (q['fromArray'](L['matrix']),
              q['decompose'](u, v, w),
              x['setFromQuaternion'](v)),
            U = {
              'type': 'furniture',
              'active': 1,
              'name': P['designation'] || P['name'] || 'objType5',
              'size': {
                'x': 0,
                'y': 0,
                'z': 0
              },
              'pos': {
                'x': u['x'] || 0,
                'y': u['y'] || 0,
                'z': u['z'] || 0
              },
              'children': []
            },
            0.001 < Math['abs'](x['x']) + Math['abs'](x['y']) + Math['abs'](x['z']) && (U['rot'] = {
              'x': -1 * K(x['x']),
              'y': -1 * K(x['y']),
              'z': -1 * K(x['z'])
            }),
            U['size'] = {
              'x': 0,
              'y': 0,
              'z': 0
            };
          var ab = {
              '1,0,0': 'x',
              '-1,0,0': '-x',
              '0,1,0': 'y',
              '0,-1,0': '-y',
              '0,0,1': 'z',
              '0,0,-1': '-z'
            },
            ac;
          for (ac of P['holes'] || []) {
            var ad = O[ac['infoIndex']],
              ae, af;
            ad && ('z' != (af = ab[ac['dir']['x'] + ',' + ac['dir']['y'] + ',' + ac['dir']['z']] || 'z') && '-z' !=
              af || U['children']['push']({
                'type': 'hole',
                'active': 1,
                'spec': {
                  'direction': af
                },
                'size': {
                  'x': ad['diameter'],
                  'z': ad['depth']
                },
                'pos': {
                  'x': ac['pos']['x'],
                  'y': ac['pos']['y'],
                  'z': ac['pos']['z']
                }
              }),
              'x' != af && '-x' != af || U['children']['push']({
                'type': 'hole',
                'active': 1,
                'spec': {
                  'direction': af
                },
                'size': {
                  'x': ad['diameter'],
                  'z': ad['depth']
                },
                'pos': {
                  'z': ac['pos']['x'],
                  'y': ac['pos']['y'],
                  'x': ac['pos']['z']
                }
              }),
              'y' != af && '-y' != af || U['children']['push']({
                'type': 'hole',
                'active': 1,
                'spec': {
                  'direction': af
                },
                'size': {
                  'x': ad['diameter'],
                  'z': ad['depth']
                },
                'pos': {
                  'x': ac['pos']['x'],
                  'z': ac['pos']['y'],
                  'y': ac['pos']['z']
                }
              }));
          }
        } else
          L['objs'] && L['objs']['length'] && (U['children'] = U['children'] || [],
            L['objs']['forEach']((ao, ap) => {
              U['children']['push'](z(ao, N, O, S, ap));
            }));
        return U;
      }

      function B(L) {
        if (!L || L.length <= 1)
          return L;
        let N = new Map();

        function O(U, W, Z) {
          var a0 = U['x'] + ',' + U['y'],
            U = N['get'](a0);
          if (U) {
            for (var a1 of U)
              if (!Z['has'](a1) && a1 !== W) {
                var a2 = L[a1],
                  a3 = a2['pos1']['x'] + ',' + a2['pos1']['y'],
                  a4 = a2['pos2']['x'] + ',' + a2['pos2']['y'];
                if (a3 == a0)
                  return {
                    'lineIndex': a1,
                    'nextPoint': a2['pos2'],
                    'line': a2
                  };
                if (a4 == a0)
                  return {
                    'lineIndex': a1,
                    'nextPoint': a2['pos1'],
                    'line': a2
                  };
              }
          }
          return null;
        }
        L.forEach((U, W) => {
          var Z = U['pos1']['x'] + ',' + U['pos1']['y'],
            U = U['pos2']['x'] + ',' + U['pos2']['y'];
          N['has'](Z) || N['set'](Z, new Set()),
            N['has'](U) || N['set'](U, new Set()),
            N['get'](Z)['add'](W),
            N['get'](U)['add'](W);
        });
        var P = [],
          Q;
        let S = new Set();

        function T(U) {
          var W = [],
            Z = L[U];
          let a0 = Z['pos2'];
          for (W.push(Z),
            S['add'](U);;) {
            var a1 = O(a0, -1, S);
            if (!a1)
              break;
            if (S['has'](a1['lineIndex']))
              break;
            S['add'](a1['lineIndex']),
              W.push(a1['line']),
              Z = a1['line'],
              a0 = a1['nextPoint'];
            var a1 = W[0],
              a1 = a1['pos1']['x'] + ',' + a1['pos1']['y'];
            if (a0['x'] + ',' + a0['y'] == a1)
              break;
          }
          return W;
        }
        for (let U = 0; U < L.length; U++) {
          S['has'](U) || (Q = T(U),
            P.push(...Q));
        }
        return P;
      }

      function E(L, N = {
        'x': 0,
        'y': 0,
        'z': 0
      }, O) {
        var L = new THREE['Vector3'](L['x'], L['y'], L['z'] || 0);
        return L['applyMatrix4'](O), {
          'x': Math['round'](L['x'] + N['x']),
          'y': Math['round'](L['y'] + N['y']),
          'z': Math['round'](L['z'] + N['z'])
        };
      }

      function G(L) {
        if (Array.isArray(L))
          L.forEach(G);
        else {
          if (L && 'section' === L['type'] && L['children'] && L['children']['length']) {
            let Q = [];
            var N, O, P;
            L['children']['forEach'](S => {
                if ('wall' == S['type'] && S['size']) {
                  var T = S['spec']['points'],
                    U;
                  let W = new THREE['Matrix4']();
                  S['rot'] && (U = new THREE['Euler'](THREE['Math']['degToRad'](S['rot']['x'] || 0), THREE['Math']
                        ['degToRad'](S['rot']['y'] || 0), THREE['Math']['degToRad'](S['rot']['z'] || 0), 'XYZ'),
                      W['makeRotationFromEuler'](U)),
                    T.forEach(Z => {
                      var Z = E(Z, S['pos'] || {
                        'x': 0,
                        'y': 0,
                        'z': 0
                      }, W);
                      Q.push(Z);
                    });
                }
              }),
              Q.length && (N = Math['max'](...Q.map(S => S['x'])),
                O = Math['max'](...Q.map(S => S['y'])),
                P = Math['max'](...Q.map(S => S['z'])),
                L['size'] = {
                  'x': N,
                  'y': O,
                  'z': P
                });
          }
          L['children'] && L['children']['length'] && L['children']['forEach'](G);
        }
      }

      function J(L, N) {
        var L = JSON['stringify'](L, null, 2),
          L = new Blob([L], {
            'type': 'application/json'
          }),
          L = URL['createObjectURL'](L),
          O = document['createElement']('a');
        O['href'] = L,
          O['download'] = N,
          document['body']['appendChild'](O),
          O['click'](),
          document['body']['removeChild'](O),
          URL['revokeObjectURL'](L);
      }

      function K(L) {
        return L / Math['PI'] * 180;
      }
    }
    async ['importFromCFRNLocal'](f) {
      if (f)
        try {
          var g = new FileReader();
          g['onload'] = async function(h) {
              var h = h['target']['result'];
              new CFRN()['importFile'](h);
            },
            g['readAsArrayBuffer'](f);
        } catch (h) {}
    }
    async ['exportToCFRNLocal'](f = 'export.cfrn') {
      room['updateMatrix'](true);
      let g = {
          'model': {},
          'table': {
            'objects': [],
            'holes': [],
            'materials': [],
            'triangles': []
          },
          'modelParams': {
            'name': 'Exported\x20Model',
            'art': 'EXP-' + Date['now'](),
            'orderName': new Date()['toISOString']()['split']('T')[0]
          }
        },
        h = new Map(),
        j = 0,
        k = new Map(),
        m = new Map(),
        u = new Map(),
        v = 0;

      function w(P, Q) {
        let R = g['table']['holes']['findIndex'](S => S['depth'] === P && S['diameter'] === Q);
        return -1 === R && (R = g['table']['holes']['length'],
            g['table']['holes']['push']({
              'depth': P,
              'diameter': Q
            })),
          R;
      }

      function x(a0, a1 = new THREE['Matrix4'](), a2 = 0, a3 = void 0) {
        let a4 = new THREE['Matrix4']();
        var a5 = new THREE['Vector3'](),
          a6 = new THREE['Quaternion'](),
          a7 = new THREE['Vector3'](),
          a8 = new THREE['Euler']();
        let a9 = a0['userData']?.['computed'];
        var aa = a0['userData']['own_object'];
        let ab = a0['userData']['params'];
        var ac = a0['userData']['parent'],
          ad = a0['userData'] || {},
          ae = 'Module' === a0['temp_type'],
          af = 'CabinetSection' === a0['temp_type'],
          ag = 'CabinetWall' === a0['temp_type'],
          ah = 'CabinetCokolN' === a0['temp_type'],
          ai = 'CabinetTabletop' === a0['temp_type'],
          aj = 'CabinetFacade' === a0['temp_type'],
          ak = 'CabinetFurniture' === a0['temp_type'],
          al = 'CabinetModel' === a0['temp_type'],
          am = 'CabinetAnimator' === a0['temp_type'],
          an = ad['children'] || [];
        let ao, ap;
        a9 ? (a5['copy'](a9['pos']),
            a8['x'] = a0['userData']['own_object']['rotation']['_x'],
            a8['y'] = a0['userData']['own_object']['rotation']['_y'],
            a8['z'] = a0['userData']['own_object']['rotation']['_z'],
            a7['copy'](aa['scale'])) : (a5['set'](0, 0, 0),
            a8['set'](0, 0, 0),
            a7['set'](1, 1, 1)),
          a6['setFromEuler'](a8);
        var aa = ab?.['pivot'],
          a8, aq, ar, a8, aq, ar, a8, aq, aq, ar, a8, ar, a8, aq, aq, as = (aa && (a8 = 'string' == typeof aa['x'] ?
              parseFloat(aa['x']['split']('::')[0]) : aa['x'],
              aq = 'string' == typeof aa['y'] ? parseFloat(aa['y']['split']('::')[0]) : aa['y'],
              ar = 'string' == typeof aa['z'] ? parseFloat(aa['z']['split']('::')[0]) : aa['z'],
              (a8 = new THREE['Vector3']((a8 + 1) * a9['size']['x'] / 2, (aq + 1) * a9['size']['y'] / 2, (ar +
                1) * a9['size']['z'] / 2))['applyQuaternion'](a6),
              a5['sub'](a8)),
            a4['compose'](a5, a6, a7),
            0 == a2 && (aq = a0['userData']['own_object']['matrixWorld']['clone'](),
              ar = new THREE['Vector3'](),
              a8 = a0['userData']['own_object']['getWorldQuaternion'](new THREE['Quaternion']()),
              ar['setFromMatrixPosition'](aq),
              (aq = new THREE['Vector3'](a0['userData']['computed']['size']['x'] / 2 / units, a0['userData'][
                'computed'
              ]['size']['y'] / 2 / units, a0['userData']['computed']['size']['z'] / 2 / units))['applyQuaternion']
              (a8),
              ar['sub'](aq),
              ar['multiplyScalar'](10),
              a4['compose'](ar, a8, a7)),
            ab?.['c_rot'] && (aq = new THREE['Vector3'](a9['size']['x'] / 2, a9['size']['y'] / 2, a9['size'][
                'z'] / 2),
              ar = a9['c_object'],
              a8 = {
                'x': comp2(ab['c_rot']['x'], ar) * Math['PI'] / 180 * -1,
                'y': comp2(ab['c_rot']['y'], ar) * Math['PI'] / 180 * -1,
                'z': comp2(ab['c_rot']['z'], ar) * Math['PI'] / 180 * -1
              },
              ar = new THREE['Matrix4']()['makeRotationFromEuler'](new THREE['Euler'](a8['x'], a8['y'], a8['z'],
                'XYZ')),
              a8 = new THREE['Matrix4']()['makeTranslation'](-aq['x'], -aq['y'], -aq['z']),
              aq = new THREE['Matrix4']()['makeTranslation'](aq['x'], aq['y'], aq['z']),
              aq = new THREE['Matrix4']()['multiply'](aq)['multiply'](ar)['multiply'](a8),
              a4['multiply'](aq)),
            a4['elements']),
          ar = a0['userData']['parent'] instanceof CabinetWall || a0['userData']['parent'] instanceof CabinetFacade,
          a8, aq, af, ar, at, au, av, aq, aq, ar, aw, ax, at, aw, ax, av, aq, ay, az, aA;
        if ((ak || af || ae) && ar && (a8 = new THREE['Matrix4'](),
            af = (aq = a0['userData']['parent'])['userData']?.['computed'],
            ar = aq['userData']?.['own_object'],
            au = (at = aq['userData']?.['params'])['spec']['orientation'],
            av = af ? af['pos']['clone']() : new THREE['Vector3'](0, 0, 0),
            aq = new THREE['Euler'](aq['userData']?.['own_object']?.['rotation']?.['_x'] || 0, aq['userData']?.[
              'own_object'
            ]?.['rotation']?.['_y'] || 0, aq['userData']?.['own_object']?.['rotation']?.['_z'] || 0, 'XYZ'),
            aq = new THREE['Quaternion']()['setFromEuler'](aq),
            ar = ar ? ar['scale'] : new THREE['Vector3'](1, 1, 1),
            at?.['pivot'] && (aw = 'string' == typeof at['pivot']['x'] ? parseFloat(at['pivot']['x']['split']('::')[
                0]) : at['pivot']['x'],
              ax = 'string' == typeof at['pivot']['y'] ? parseFloat(at['pivot']['y']['split']('::')[0]) : at[
                'pivot']['y'],
              at = 'string' == typeof at['pivot']['z'] ? parseFloat(at['pivot']['z']['split']('::')[0]) : at[
                'pivot']['z'],
              (aw = new THREE['Vector3']((aw + 1) * (af?.['size']['x'] || 0) / 2, (ax + 1) * (af?.['size'][
                'y'] || 0) / 2, (at + 1) * (af?.['size']['z'] || 0) / 2))['applyQuaternion'](aq),
              av['sub'](aw)),
            a8['compose'](av, aq, ar),
            ax = new THREE['Matrix4']()['multiplyMatrices'](a8, a4),
            a4['copy'](ax)),
          ag || aj || ai || ah) {
          let aJ = '',
            aK, aL = (ag ? aJ = 'Стенка' : aj ? aJ = 'Фасад' : ai ? aJ = 'Столешница' : ah && (aJ = 'Цоколь'),
              '');
          var at, af, aw, av, aq, ar, a8, ax, aw = (ag ? (at = a9['material']?.['mat_item'],
                a9['material']['id'] && (af = parseFloat(a9['material']['id']),
                  aw = a9['material']['key'],
                  av = a9['material']['variant_id'],
                  aq = pp['libs']['materials'][aw]['find_item'](af),
                  aK = aq['params']['variants'][av]),
                at && (aL = at['name'])) : aj ? (ar = a9['item'],
                a9['materials'] && (a8 = a9['materials']['gen']['selected'],
                  aK = pp['libs']['decors']['find_item'](a8)),
                ar && (aL = ar['name'])) : ai && a9['material'] && (ax = parseFloat(ab['spec']['material'][
                  'variant_id'
                ]),
                aK = a9['material']['params']['variants'][ax]),
              a0['userData']['computed']?.['material']?.['id'] || a0['userData']['computed']?.['item']?.['id'] ||
              '\x20'),
            af = aK?.['code'] || a0['userData']['computed']?.['material']?.['mat_item']?.['code'] || a0['userData'][
              'computed'
            ]?.['material']?.['code'] || a0['userData']['computed']?.['item']?.['code'],
            aq = af || 'MAT_' + aw,
            av = aK?.['name'] || a0['userData']['computed']?.['material']?.['mat_item']?.['name'] || a0['userData'][
              'computed'
            ]?.['material']?.['name'] || a0['userData']['computed']?.['item']?.['name'] ||
            'Неизвестное\x20имя\x20материала';
          u['set'](aq, {
              'art': aq,
              'name': av
            }),
            ao = {
              'objType': 2,
              'name': a0['name'] || aJ,
              'position': '' + (a2 + 1),
              'materialArt': aq,
              'materialWidth': 0,
              'thickness': 16,
              'textureOrientation': ab['spec']['material']?.['rotated'] ? 1 : 2,
              'frontFace': 2
            },
            '' != aL && bazis_settings['text_mat'] && (ao['name'] += '\x20' + aL);
        } else {
          if (ak) {
            let aM = {
              'x': {
                'x': 1,
                'y': 0,
                'z': 0
              },
              '-x': {
                'x': -1,
                'y': 0,
                'z': 0
              },
              'y': {
                'x': 0,
                'y': 1,
                'z': 0
              },
              '-y': {
                'x': 0,
                'y': -1,
                'z': 0
              },
              'z': {
                'x': 0,
                'y': 0,
                'z': 1
              },
              '-z': {
                'x': 0,
                'y': 0,
                'z': -1
              }
            };
            var aB, at = an.filter(aN => 'CabinetHole' === aN['temp_type'])['map'](aN => {
                var aO = aN['userData']?.['computed']?.['real_size']?.['z'] || 10,
                  aP = aN['userData']?.['computed']?.['real_size']?.['x'] || 5,
                  aQ = aN['userData']?.['params']?.['spec']?.['direction'] || 'z',
                  aR = aM[aQ],
                  aO = w(aO, aP),
                  aS = aN['userData']?.['computed']?.['pos'] || {
                    'x': 0,
                    'y': 0,
                    'z': 0
                  },
                  aT = a0['userData']['computed']['size'];
                let aU = {
                  'x': aS['x'],
                  'y': aS['y'],
                  'z': aS['z']
                };
                switch (aQ) {
                  case 'x':
                    aU = {
                      'x': aS['z'],
                      'y': aS['y'],
                      'z': aS['x']
                    };
                    break;
                  case '-x':
                    aU = {
                      'x': aS['z'],
                      'y': aS['y'],
                      'z': aS['x']
                    };
                    break;
                  case 'y':
                    aU = {
                      'x': aS['x'],
                      'y': aS['z'],
                      'z': aS['y']
                    };
                    break;
                  case '-y':
                    aU = {
                      'x': aS['x'],
                      'y': aS['z'],
                      'z': aS['y']
                    };
                    break;
                  case 'z':
                    aU = {
                      'x': aS['x'],
                      'y': aS['y'],
                      'z': aS['z']
                    };
                    break;
                  case '-z':
                    aU = {
                      'x': aS['x'],
                      'y': aS['y'],
                      'z': aS['z']
                    };
                    break;
                }
                return {
                  'pos': aU,
                  'dir': aR,
                  'infoIndex': aO
                };
              }),
              a8 = a0['userData']['computed']?.['item']?.['id'] || 'UNDEFINED',
              ar = a0['userData']['computed']?.['item']?.['code'],
              ax = ar || 'MAT_' + a8,
              af = a0['userData']['computed']?.['item']?.['name'] || 'Неизвестная\x20фурнитура';
            u['set'](ax, {
                'art': ax,
                'name': af
              }),
              ao = {
                'objType': 5,
                'holes': at,
                'materialArt': ax
              };
          } else {
            if (al) {
              var aw, av, aq, ak, ar = (a5['copy'](a9['pos']),
                aa && (aw = 'string' == typeof aa['x'] ? parseFloat(aa['x']['split']('::')[0]) : aa['x'],
                  av = 'string' == typeof aa['y'] ? parseFloat(aa['y']['split']('::')[0]) : aa['y'],
                  aq = 'string' == typeof aa['z'] ? parseFloat(aa['z']['split']('::')[0]) : aa['z'],
                  (ak = new THREE['Vector3'](aw * a9['size']['x'] / 2, av * a9['size']['y'] / 2, aq * a9['size']
                    ['z'] / 2))['applyQuaternion'](a6),
                  a5['sub'](ak)),
                a4['compose'](a5, a6, a7),
                a0['_get_model']());
              let aN = h['get'](ar['model'] + '-' + a9['size']['x'] + '-' + a9['size']['y'] + '-' + a9['size']['z']);
              aN || (aN = {
                  'name': ar['name'],
                  'model': ar['model'],
                  'size': a9['size'],
                  'index': j,
                  'obj': a0
                },
                h['set'](ar['model'] + '-' + a9['size']['x'] + '-' + a9['size']['y'] + '-' + a9['size']['z'], aN),
                j += 1);
              var a8 = a9['model_item']?.['code'] || j + '-' + a9['size']['x'] + '-' + a9['size']['y'] + '-' + a9[
                  'size']['z'],
                af = a9['model_item']?.['name'] || a9['item']?.['name'] || 'Model';
              u['set'](a8, {
                  'art': a8,
                  'name': af
                }),
                ao = {
                  'objType': 5,
                  'materialArt': a8,
                  'triangleData': aN['index']
                };
            } else
              ao = {
                'objType': 7,
                'name': a0['name'] || 'Объект\x20' + v,
                'isAssemblyUnit': false
              };
          }
        }
        if (ag) {
          var at = ab['spec']['orientation'],
            ax = ab['_pivot_offset'],
            al, aa, aw;
          let aO = null,
            aP = 0;
          switch (at) {
            case 'h':
              ao['thickness'] = a9['size']['y'],
                a6['multiply'](new THREE['Quaternion']()['setFromAxisAngle'](new THREE['Vector3'](1, 0, 0),
                  Math['PI'] / 2)),
                aP = ao['thickness'],
                aO = new THREE['Vector3'](0, 0, 1);
              break;
            case 'v':
              ao['thickness'] = a9['size']['x'],
                a6['multiply'](new THREE['Quaternion']()['setFromAxisAngle'](new THREE['Vector3'](0, 1, 0), -
                  Math['PI'] / 2)),
                aP = ao['thickness'],
                aO = new THREE['Vector3'](0, 0, 1);
              break;
            case 'f':
              ao['thickness'] = a9['size']['z'];
              break;
          }
          aO && (aO['applyQuaternion'](a6),
              aO['multiplyScalar'](-aP),
              a5['add'](aO)),
            a4['compose'](a5, a6, a7),
            ax && (al = new THREE['Vector3']()['setFromMatrixColumn'](a4, 1),
              aa = new THREE['Vector3']()['setFromMatrixColumn'](a4, 0),
              aw = new THREE['Vector3']()['add'](al['clone']()['multiplyScalar'](ax['y']))['add'](aa['clone']()[
                'multiplyScalar'](ax['x'])),
              a5['add'](aw),
              a4['compose'](a5, a6, a7));
        }
        if (ah && (ao['thickness'] = a9['size']['z']),
          ai && (av = null,
            aq = 0,
            ao['thickness'] = a9['size']['y'],
            a6['multiply'](new THREE['Quaternion']()['setFromAxisAngle'](new THREE['Vector3'](1, 0, 0), Math[
              'PI'] / 2)),
            aq = ao['thickness'],
            (av = new THREE['Vector3'](0, 0, 1)) && (av['applyQuaternion'](a6),
              av['multiplyScalar'](-aq),
              a5['add'](av)),
            a4['compose'](a5, a6, a7)),
          aj && (ao['thickness'] = a9['size']['z']),
          ag || ah || aj) {
          let aQ = ad['computed'] || {
              'x': 100,
              'y': 100
            },
            aR = ad['params'] || {},
            aS = aQ['original_points'] || [];
          if ((aS = aS.length ? aS : [{
              'x': 0,
              'y': 0
            }, {
              'x': aQ['size']['x'],
              'y': 0
            }, {
              'x': aQ['size']['x'],
              'y': aQ['size']['y']
            }, {
              'x': 0,
              'y': aQ['size']['y']
            }])['length']) {
            if (ao['contour'] = {
                'elemType': 4,
                'list': []
              },
              ao['contour'] = {
                'elemType': 4,
                'list': []
              },
              !aS || aS.length < 1)
              return ao;
            var ak = aS.map(aU => ({
                'x': void 0 !== aU['x'] ? aU['x'] : 0,
                'y': void 0 !== aU['y'] ? aU['y'] : 0,
                'radius': aU['radius'] || 0,
                'center': aU['center'] ? {
                  'x': aU['center']['x'],
                  'y': aU['center']['y']
                } : null,
                'dir': aU['dir'] || false
              })),
              aC = ak.filter(aU => !aU['center']),
              aD = ak.filter(aU => aU['center']),
              aE = {};
            let aT = null;
            if (aC.length) {
              aT = 0 < aC[0]['radius'] ? (aE[0] = O(aC[aC.length - 1], aC[0], aC[1]),
                ao['contour']['list']['push']({
                  'elemType': 2,
                  'pos1': aE[0]['p1'],
                  'pos2': aE[0]['p2'],
                  'center': aE[0]['center'],
                  'dir': aE[0]['dir']
                }),
                aE[0]['p2']) : aC[0];
              for (let aU = 1; aU < aC.length; aU++) {
                var aF = aC[aU - 1],
                  aG = aC[aU],
                  aH = aC[(aU + 1) % aC.length];
                aT = 0 < aG['radius'] ? (aE[aU] = O(aF, aG, aH),
                  ao['contour']['list']['push']({
                    'elemType': 1,
                    'pos1': {
                      'x': aT['x'],
                      'y': aT['y']
                    },
                    'pos2': aE[aU]['p1']
                  }),
                  ao['contour']['list']['push']({
                    'elemType': 2,
                    'pos1': aE[aU]['p1'],
                    'pos2': aE[aU]['p2'],
                    'center': aE[aU]['center'],
                    'dir': aE[aU]['dir']
                  }),
                  aE[aU]['p2']) : (ao['contour']['list']['push']({
                    'elemType': 1,
                    'pos1': {
                      'x': aT['x'],
                      'y': aT['y']
                    },
                    'pos2': aG
                  }),
                  aG);
              }
              0 < aC[0]['radius'] ? ao['contour']['list']['push']({
                'elemType': 1,
                'pos1': {
                  'x': aT['x'],
                  'y': aT['y']
                },
                'pos2': aE[0]['p1']
              }) : ao['contour']['list']['push']({
                'elemType': 1,
                'pos1': {
                  'x': aT['x'],
                  'y': aT['y']
                },
                'pos2': aC[0]
              });
            }
            if (0 < aD.length)
              for (let aV = 0; aV < aD.length; aV++) {
                var aI = aD[aV];
                ao['contour']['list']['push']({
                  'elemType': 3,
                  'center': {
                    'x': aI['center']['x'],
                    'y': aI['center']['y']
                  },
                  'radius': aI['radius'],
                  'dir': aI['dir'] || false
                });
              }
          }
          var ar = an.filter(aW => 'CabinetPath' === aW['temp_type']);
          ar.length && (ao['grooves'] = ar.map(aW => {
              var aX = aW['userData']['computed'],
                aY = aW['userData']['params'],
                aZ = aX['relative_points'] || [],
                b0 = aX['trajectory'] || [],
                b1, b2 = aW['userData']['parent']['userData']['params']['spec']['orientation'];
              let b3 = 0,
                b4 = 0;
              for (let bh = 0; bh < b0.length - 1; bh++) {
                var b5 = b0[bh],
                  b6 = b0[bh + 1],
                  b7 = Math['abs'](b6['x'] - b5['x']),
                  b6 = Math['abs'](b6['y'] - b5['y']);
                b7 > b3 && (b3 = b7),
                  b6 > b4 && (b4 = b6);
              }
              var b8 = false,
                b9 = {
                  'elemType': 4,
                  'list': []
                };
              if (aZ && 1 <= aZ.length) {
                let bi = aZ.map(bk => ({
                  'x': void 0 !== bk['x'] ? bk['y'] : 0,
                  'y': void 0 !== bk['y'] ? bk['x'] : 0,
                  'radius': bk['radius'] || 0,
                  'center': bk['center'] ? {
                    'x': bk['center']['y'],
                    'y': bk['center']['x']
                  } : null,
                  'dir': bk['dir'] || false
                }));
                var ba = {};
                let bj = null;
                var bb = (bi = b4 > b3 ? aZ.map(bk => ({
                    'x': void 0 !== bk['x'] ? -bk['y'] : 0,
                    'y': void 0 !== bk['y'] ? bk['x'] : 0,
                    'radius': bk['radius'] || 0,
                    'center': bk['center'] ? {
                      'x': -bk['center']['y'],
                      'y': bk['center']['x']
                    } : null,
                    'dir': bk['dir'] || false
                  })) : bi)['filter'](bk => !bk['center']),
                  bc = bi.filter(bk => bk['center']);
                if (0 < bb.length) {
                  bj = 0 < bb[0]['radius'] ? (ba[0] = O(bb[bb.length - 1], bb[0], bb[1]),
                    b9['list']['push']({
                      'elemType': 2,
                      'pos1': ba[0]['p1'],
                      'pos2': ba[0]['p2'],
                      'center': ba[0]['center'],
                      'dir': ba[0]['dir']
                    }),
                    ba[0]['p2']) : bb[0];
                  for (let bk = 1; bk < bb.length; bk++) {
                    var bd = bb[bk - 1],
                      be = bb[bk],
                      bf = bb[(bk + 1) % bb.length];
                    bj = 0 < be['radius'] ? (ba[bk] = O(bd, be, bf),
                      b9['list']['push']({
                        'elemType': 1,
                        'pos1': {
                          'x': bj['x'],
                          'y': bj['y']
                        },
                        'pos2': ba[bk]['p1']
                      }),
                      b9['list']['push']({
                        'elemType': 2,
                        'pos1': ba[bk]['p1'],
                        'pos2': ba[bk]['p2'],
                        'center': ba[bk]['center'],
                        'dir': ba[bk]['dir']
                      }),
                      ba[bk]['p2']) : (b9['list']['push']({
                        'elemType': 1,
                        'pos1': {
                          'x': bj['x'],
                          'y': bj['y']
                        },
                        'pos2': be
                      }),
                      be);
                  }
                  0 < bb[0]['radius'] ? b9['list']['push']({
                    'elemType': 1,
                    'pos1': {
                      'x': bj['x'],
                      'y': bj['y']
                    },
                    'pos2': ba[0]['p1']
                  }) : b9['list']['push']({
                    'elemType': 1,
                    'pos1': {
                      'x': bj['x'],
                      'y': bj['y']
                    },
                    'pos2': bb[0]
                  });
                }
                if (0 < bc.length)
                  for (let bl = 0; bl < bc.length; bl++) {
                    var bg = bc[bl];
                    b9['list']['push']({
                      'elemType': 3,
                      'center': {
                        'x': bg['center']['x'],
                        'y': bg['center']['y']
                      },
                      'radius': bg['radius'],
                      'dir': bg['dir'] || false
                    });
                  }
              }
              return {
                'name': aY?.['name'] || 'Паз',
                'sign': 'Паз',
                'frontSide': false,
                'contour': b9,
                'trajectory': {
                  'elemType': 4,
                  'list': 1 < b0.length ? [{
                    'elemType': 1,
                    'pos1': b0[0],
                    'pos2': b0[1]
                  }] : []
                }
              };
            })),
            ad['butt_objects']?.['length'] && (ao['butts'] = ad['butt_objects']['map'](aW => {
              var aX = parseFloat(aW['userData']['params']['spec']['variant_id']),
                aY = aW['userData']['computed']?.['material']?.['params']?.['variants'][aX]?.['code'] ||
                'MAT_butts',
                aZ = aW['userData']['computed']?.['material']?.['params']?.['variants'][aX]?.['name'] ||
                'Неизвестная\x20кромка',
                aX = aW['userData']['computed']?.['material']?.['params']?.['variants'][aX]?.['height'] || 0,
                b0 = parseFloat(aW['userData']['params']?.['spec']['thickness']) || 0.5,
                b1 = b0 + ('/' + aX + '\x20') + aY;
              return u['set'](aY, {
                'art': aY,
                'name': aZ,
                'sign': b1
              }), {
                'elemIndex': aW['userData']['params']?.['spec']['face_index'],
                'thickness': b0,
                'width': aX,
                'buttType': 0,
                'overhang': 0,
                'allowance': bazis_settings['use_allowance'] ? b0 : 0,
                'cutIndex': -1,
                'clip': !!bazis_settings['use_clip'],
                'materialArt': aY
              };
            }));
        }
        if (ai) {
          let aW = ad['computed'] || {
              'x': 100,
              'y': 100
            },
            aX = (ao['thickness'] = aW['size']['y'],
              ad['params'] || {}),
            aY = aW['points'] || [];
          (aY = aY.length ? aY : [{
            'x': 0,
            'y': 0
          }, {
            'x': aW['size']['x'],
            'y': 0
          }, {
            'x': aW['size']['x'],
            'y': aW['size']['z']
          }, {
            'x': 0,
            'y': aW['size']['z']
          }])['length'] && (ay = aY['reduce']((aZ, b0) => Math['max'](aZ, b0['x']), -1 / 0),
            az = aY['reduce']((aZ, b0) => Math['max'](aZ, b0['y']), -1 / 0),
            aA = ao['thickness'] / 2,
            ao['contour'] = {
              'elemType': 4,
              'list': aY.map((aZ, b0) => {
                var b0 = (b0 + 1) % aY.length;
                return {
                  'elemType': 1,
                  'pos1': {
                    'x': aZ['x'],
                    'y': aZ['y']
                  },
                  'pos2': {
                    'x': aY[b0]['x'],
                    'y': aY[b0]['y']
                  }
                };
              })
            });
        }
        var af = JSON['stringify'](ao),
          at;
        for (let aZ = 0; aZ < as.length; aZ++)
          Math['abs'](as[aZ]) < 1e-10 && (as[aZ] = 0);
        if (k['has'](af) ? ap = {
            'tableIndex': k['get'](af),
            'matrix': as
          } : (ap = {
              'tableIndex': v++,
              'matrix': as
            },
            ag && m['set'](a0, ap),
            k['set'](af, ap['tableIndex']),
            g['table']['objects']['push'](ao)),
          ae && bazis_settings['template_accsessories']) {
          let b0 = [];
          var a8 = parseFloat(ab['spec']['selected_variant']);
          Array.isArray(ab?.['spec']?.['template']?.['accessories']) && 0 < ab?.['spec']?.['template']?.[
              'accessories'
            ]?.['length'] && (b0 = b0['concat'](ab?.['spec']?.['template']?.['accessories'])),
            Array.isArray(ab?.['spec']?.['variants'][a8]?.['accessories']) && 0 < ab?.['spec']?.['variants'][a8]
            ?.['accessories']?.['length'] && (b0 = b0['concat'](ab['spec']['variants'][a8]['accessories'])),
            Array.isArray(b0) && 0 < b0.length && (ap['objs'] = ap['objs'] || [],
              b0.forEach(b1 => {
                var b2 = accsessories_data['find_item'](b1['id']),
                  b3 = parseFloat(b1['count']);
                if (b2) {
                  var b1 = b2['code'] || 'ACC_' + b1['id'],
                    b2 = b2['name'] || 'Accessory',
                    b2 = (u['set'](b1, {
                      'art': b1,
                      'name': b2
                    }), {
                      'objType': 5,
                      'materialArt': b1
                    }),
                    b4 = JSON['stringify'](b2);
                  if (k['has'](b4)) {
                    for (let b6 = 0; b6 < b3; b6++)
                      ap['objs']['push']({
                        'tableIndex': k['get'](b4),
                        'matrix': a4['elements']['slice']()
                      });
                  } else {
                    var b5 = v++;
                    for (let b7 = 0; b7 < b3; b7++)
                      ap['objs']['push']({
                        'tableIndex': b5,
                        'matrix': a4['elements']['slice']()
                      });
                    k['set'](b4, b5),
                      g['table']['objects']['push'](b2);
                  }
                }
              }));
        }
        return an.length && (at = an.filter(b1 => 'CabinetHole' !== b1['temp_type'] && 'CabinetPath' !== b1[
              'temp_type'] && 'CabinetButts' !== b1['temp_type'] && false !== b1['visible'] && 0 !== b1['userData']
            ['active']))['length'] && (ap['objs'] = ap['objs'] || [],
            at.forEach(b1 => {
              var b2 = x(b1, a4, a2 + 1, ap);
              (!('CabinetFurniture' !== b1['temp_type'] && 'CabinetSection' !== b1['temp_type'] && 'Module' !== b1[
                  'temp_type'] || 'CabinetWall' !== a0['temp_type'] && 'CabinetFacade' !== a0['temp_type']) && a3 ?
                (a3['objs'] = a3['objs'] || [],
                  a3) : ap)['objs']['push'](b2);
            })),
          ap;
      }

      function y(P) {
        Math['PI'];
      }
      var z = room['active_objects']['filter'](P => P instanceof Module),
        A = pp['info']['tabletop']['items']['filter'](P => P instanceof Module),
        C, D;
      0 < z.length && (g['model']['objs'] = g['model']['objs'] || [],
          z.forEach(P => {
            g['model']['objs']['push'](x(P));
          })),
        0 < A.length && (g['model']['objs'] = g['model']['objs'] || [],
          A.forEach(P => {
            g['model']['objs']['push'](x(P));
          })),
        g['table']['materials'] = [],
        u.forEach(P => {
          g['table']['materials']['push'](P);
        });
      for (let P of g['table']['objects']) {
        P['materialArt'] && (C = g['table']['materials']['findIndex'](Q => Q['art'] === P['materialArt']),
          P['materialIndex'] = C,
          delete P['materialArt']);
      }
      let E = new JSZip(),
        F = (E['folder']('models'),
          Array.from(h['entries']())['map'](([Q, R]) => {
            let S = {
              'id': THREE['MathUtils']['generateUUID'](),
              'meshes': []
            };
            return R['obj']['traverse'](T => {
              var U, W, U;
              T['isMesh'] && (W = (U = T['geometry'])['attributes']['position']?.['array'] ? Array.from(U[
                  'attributes']['position']['array']) : [],
                U = U['index']?.['array'] ? Array.from(U['index']['array']) : [],
                S['meshes']['push']({
                  'name': T['name'],
                  'geometry': {
                    'positions': W,
                    'indices': U
                  },
                  'material': T['material']?.['name'] || 'default'
                }));
            }), {
              'key': Q,
              'index': R['index'],
              'model': R['model'],
              'name': R['name'],
              'size': R['size'],
              'obj': S
            };
          })),
        H = new Worker('/common_assets/workers/export_workers.js', {
          'type': 'module'
        });
      try {
        (await new Promise((Q, R) => {
          let S = setTimeout(() => {
            H['terminate'](),
              R(new Error('Worker\x20timeout'));
          }, 2000000);
          H['onmessage'] = T => {
              clearTimeout(S),
                Q(T['data']);
            },
            H['onerror'] = T => {
              clearTimeout(S),
                R(T);
            },
            H['postMessage']({
              'trianglesMap': F,
              'units': units
            });
        }))['forEach'](Q => {
          Q['error'] || (E['file']('models/' + Q['filename'], Q['data']),
            g['table']['triangles'][Q['index']] = Q['filename']);
        });
      } catch (Q) {} finally {
        H['terminate']();
      }
      E['file']('file.json', JSON['stringify'](g, null, 2));
      var z = await E['generateAsync']({
          'type': 'uint8array'
        }),
        I;

      function N(R, S) {
        let T = window['URL']['createObjectURL'](R);
        var R = document['createElement']('a');
        R['style'] = 'display:\x20none',
          R['href'] = T,
          R['download'] = S,
          document['body']['appendChild'](R),
          R['click'](),
          document['body']['removeChild'](R),
          setTimeout(function() {
            window['URL']['revokeObjectURL'](T);
          }, 1000);
      }

      function O(R, S, T, U = null) {
        var W = S['radius'],
          a0 = S['dir'],
          a1 = R['x'] - S['x'],
          R = R['y'] - S['y'],
          a2 = T['x'] - S['x'],
          T = T['y'] - S['y'],
          a3 = Math['sqrt'](a1 * a1 + R * R) || 1,
          a4 = Math['sqrt'](a2 * a2 + T * T) || 1,
          a5 = S['x'] + a1 / a3 * W,
          a3 = S['y'] + R / a3 * W,
          a6 = S['x'] + a2 / a4 * W,
          S = S['y'] + T / a4 * W,
          a4 = (a5 + a6) / 2,
          a7 = (a3 + S) / 2,
          a8 = Math['sqrt']((a6 - a5) ** 2 + (S - a3) ** 2),
          W = a8 ? Math['sqrt'](Math['max'](W * W - Math['pow'](a8 / 2, 2), 0)) : 0,
          a9 = (S - a3) / Math['max'](a8, 0.0001),
          a8 = -(a6 - a5) / Math['max'](a8, 0.0001),
          aa, a1 = 0 < a1 * T - R * a2;
        let ab;
        ab = void 0 !== a0 ? a0 : a1;
        let ac, ad;
        ad = !a1 && ab ? (ac = a4 - a9 * W,
          a7 - a8 * W) : (ac = a4 + a9 * W,
          a7 + a8 * W);
        var T = Math['atan2'](a3 - ad, a5 - ac);
        let ae = Math['atan2'](S - ad, a6 - ac);
        return ab ? ae > T && (ae -= 2 * Math['PI']) : ae < T && (ae += 2 * Math['PI']), {
          'p1': {
            'x': a5,
            'y': a3
          },
          'p2': {
            'x': a6,
            'y': S
          },
          'center': {
            'x': ac,
            'y': ad
          },
          'dir': ab
        };
      }
      N(new Blob([z['buffer']], {
        'type': 'application/zip'
      }), f);
    }
    async ['exportToCFRN'](f = 'export.cfrn') {
        room['updateMatrixWorld'](true);
        let g = {
            'model': {},
            'table': {
              'objects': [],
              'holes': [],
              'materials': [],
              'triangles': []
            },
            'modelParams': {
              'name': 'Exported\x20Model',
              'art': 'EXP-' + Date['now'](),
              'orderName': new Date()['toISOString']()['split']('T')[0]
            }
          },
          h = new Map(),
          j = new Map(),
          k = new Map(),
          m = (k['set']('MAT0', {
              'art': 'MAT0',
              'name': 'Основной\x20материал'
            }),
            k['set']('MAT1', {
              'art': 'MAT1',
              'name': 'Кромка\x202мм'
            }),
            k['set']('MAT2', {
              'art': 'MAT2',
              'name': 'Кромка\x200.5мм'
            }),
            k['set']('MAT3', {
              'art': 'MAT3',
              'name': 'Тонкий\x20материал'
            }),
            0),
          u = new Map(),
          v = 0;

        function w(P, Q) {
          let R = g['table']['holes']['findIndex'](S => S['depth'] === P && S['diameter'] === Q);
          return -1 === R && (R = g['table']['holes']['length'],
              g['table']['holes']['push']({
                'depth': P,
                'diameter': Q
              })),
            R;
        }

        function x(a0, a1 = new THREE['Matrix4'](), a2 = 0, a3 = void 0) {
          let a4 = new THREE['Matrix4']();
          var a5 = new THREE['Vector3'](),
            a6 = new THREE['Quaternion'](),
            a7 = new THREE['Vector3'](),
            a8 = new THREE['Euler']();
          let a9 = a0['userData']?.['computed'];
          var aa = a0['userData']['own_object'];
          let ab = a0['userData']['params'];
          var ac = a0['userData']['parent'],
            ad = a0['userData'] || {},
            ae = 'Module' === a0['temp_type'],
            af = 'CabinetSection' === a0['temp_type'],
            ag = 'CabinetWall' === a0['temp_type'],
            ah = 'CabinetCokolN' === a0['temp_type'],
            ai = 'CabinetTabletop' === a0['temp_type'],
            aj = 'CabinetFacade' === a0['temp_type'],
            ak = 'CabinetFurniture' === a0['temp_type'],
            al = 'CabinetModel' === a0['temp_type'],
            am = 'CabinetAnimator' === a0['temp_type'],
            an = ad['children'] || [];
          let ao, ap;
          a9 ? (a5['copy'](a9['pos']),
              a8['x'] = a0['userData']['own_object']['rotation']['_x'],
              a8['y'] = a0['userData']['own_object']['rotation']['_y'],
              a8['z'] = a0['userData']['own_object']['rotation']['_z'],
              a7['copy'](aa['scale'])) : (a5['set'](0, 0, 0),
              a8['set'](0, 0, 0),
              a7['set'](1, 1, 1)),
            a6['setFromEuler'](a8);
          var aa = ab?.['pivot'],
            a8, aq, ar, a8, aq, ar, a8, aq, aq, ar, a8, ar, a8, aq, aq, as = (aa && (a8 = 'string' == typeof aa['x'] ?
                parseFloat(aa['x']['split']('::')[0]) : aa['x'],
                aq = 'string' == typeof aa['y'] ? parseFloat(aa['y']['split']('::')[0]) : aa['y'],
                ar = 'string' == typeof aa['z'] ? parseFloat(aa['z']['split']('::')[0]) : aa['z'],
                (a8 = new THREE['Vector3']((a8 + 1) * a9['size']['x'] / 2, (aq + 1) * a9['size']['y'] / 2, (ar +
                  1) * a9['size']['z'] / 2))['applyQuaternion'](a6),
                a5['sub'](a8)),
              a4['compose'](a5, a6, a7),
              0 == a2 && (aq = a0['userData']['own_object']['matrixWorld']['clone'](),
                ar = new THREE['Vector3'](),
                a8 = a0['userData']['own_object']['getWorldQuaternion'](new THREE['Quaternion']()),
                ar['setFromMatrixPosition'](aq),
                (aq = new THREE['Vector3'](a0['userData']['computed']['size']['x'] / 2 / units, a0['userData'][
                  'computed'
                ]['size']['y'] / 2 / units, a0['userData']['computed']['size']['z'] / 2 / units))['applyQuaternion']
                (a8),
                ar['sub'](aq),
                ar['multiplyScalar'](10),
                a4['compose'](ar, a8, a7)),
              ab?.['c_rot'] && (aq = new THREE['Vector3'](a9['size']['x'] / 2, a9['size']['y'] / 2, a9['size'][
                  'z'] / 2),
                ar = a9['c_object'],
                a8 = {
                  'x': comp2(ab['c_rot']['x'], ar) * Math['PI'] / 180 * -1,
                  'y': comp2(ab['c_rot']['y'], ar) * Math['PI'] / 180 * -1,
                  'z': comp2(ab['c_rot']['z'], ar) * Math['PI'] / 180 * -1
                },
                ar = new THREE['Matrix4']()['makeRotationFromEuler'](new THREE['Euler'](a8['x'], a8['y'], a8['z'],
                  'XYZ')),
                a8 = new THREE['Matrix4']()['makeTranslation'](-aq['x'], -aq['y'], -aq['z']),
                aq = new THREE['Matrix4']()['makeTranslation'](aq['x'], aq['y'], aq['z']),
                aq = new THREE['Matrix4']()['multiply'](aq)['multiply'](ar)['multiply'](a8),
                a4['multiply'](aq)),
              a4['elements']),
            ar = a0['userData']['parent'] instanceof CabinetWall || a0['userData']['parent'] instanceof CabinetFacade,
            a8, aq, af, ar, at, au, av, aq, aq, ar, aw, ax, at, aw, ax, av, aq, ay, az, aA;
          if ((ak || af || ae) && ar && (a8 = new THREE['Matrix4'](),
              af = (aq = a0['userData']['parent'])['userData']?.['computed'],
              ar = aq['userData']?.['own_object'],
              au = (at = aq['userData']?.['params'])['spec']['orientation'],
              av = af ? af['pos']['clone']() : new THREE['Vector3'](0, 0, 0),
              aq = new THREE['Euler'](aq['userData']?.['own_object']?.['rotation']?.['_x'] || 0, aq['userData']?.[
                'own_object'
              ]?.['rotation']?.['_y'] || 0, aq['userData']?.['own_object']?.['rotation']?.['_z'] || 0, 'XYZ'),
              aq = new THREE['Quaternion']()['setFromEuler'](aq),
              ar = ar ? ar['scale'] : new THREE['Vector3'](1, 1, 1),
              at?.['pivot'] && (aw = 'string' == typeof at['pivot']['x'] ? parseFloat(at['pivot']['x']['split']('::')[
                  0]) : at['pivot']['x'],
                ax = 'string' == typeof at['pivot']['y'] ? parseFloat(at['pivot']['y']['split']('::')[0]) : at[
                  'pivot']['y'],
                at = 'string' == typeof at['pivot']['z'] ? parseFloat(at['pivot']['z']['split']('::')[0]) : at[
                  'pivot']['z'],
                (aw = new THREE['Vector3']((aw + 1) * (af?.['size']['x'] || 0) / 2, (ax + 1) * (af?.['size'][
                  'y'] || 0) / 2, (at + 1) * (af?.['size']['z'] || 0) / 2))['applyQuaternion'](aq),
                av['sub'](aw)),
              a8['compose'](av, aq, ar),
              ax = new THREE['Matrix4']()['multiplyMatrices'](a8, a4),
              a4['copy'](ax)),
            ag || aj || ai || ah) {
            let aJ = '',
              aK, aL = (ag ? aJ = 'Стенка' : aj ? aJ = 'Фасад' : ai ? aJ = 'Столешница' : ah && (aJ = 'Цоколь'),
                '');
            var at, af, aw, av, aq, ar, a8, ax, aw = (ag ? (at = a9['material']?.['mat_item'],
                  a9['material']['id'] && (af = parseFloat(a9['material']['id']),
                    aw = a9['material']['key'],
                    av = a9['material']['variant_id'],
                    aq = pp['libs']['materials'][aw]['find_item'](af),
                    aK = aq['params']['variants'][av]),
                  at && (aL = at['name'])) : aj ? (ar = a9['item'],
                  a9['materials'] && (a8 = a9['materials']['gen']['selected'],
                    aK = pp['libs']['decors']['find_item'](a8)),
                  ar && (aL = ar['name'])) : ai && a9['material'] && (ax = parseFloat(ab['spec']['material'][
                    'variant_id'
                  ]),
                  aK = a9['material']['params']['variants'][ax]),
                a0['userData']['computed']?.['material']?.['id'] || a0['userData']['computed']?.['item']?.['id'] ||
                '\x20'),
              af = aK?.['code'] || a0['userData']['computed']?.['material']?.['mat_item']?.['code'] || a0['userData'][
                'computed'
              ]?.['material']?.['code'] || a0['userData']['computed']?.['item']?.['code'],
              aq = af || 'MAT_' + aw,
              av = aK?.['name'] || a0['userData']['computed']?.['material']?.['mat_item']?.['name'] || a0['userData'][
                'computed'
              ]?.['material']?.['name'] || a0['userData']['computed']?.['item']?.['name'] ||
              'Неизвестное\x20имя\x20материала';
            k['set'](aq, {
                'art': aq,
                'name': av
              }),
              ao = {
                'objType': 2,
                'name': a0['name'] || aJ,
                'position': '' + (a2 + 1),
                'materialArt': aq,
                'materialWidth': 0,
                'thickness': 16,
                'textureOrientation': ab['spec']['material']?.['rotated'] ? 1 : 2,
                'frontFace': 2
              },
              '' != aL && bazis_settings['text_mat'] && (ao['name'] += '\x20' + aL);
          } else {
            if (ak) {
              let aM = {
                'x': {
                  'x': 1,
                  'y': 0,
                  'z': 0
                },
                '-x': {
                  'x': -1,
                  'y': 0,
                  'z': 0
                },
                'y': {
                  'x': 0,
                  'y': 1,
                  'z': 0
                },
                '-y': {
                  'x': 0,
                  'y': -1,
                  'z': 0
                },
                'z': {
                  'x': 0,
                  'y': 0,
                  'z': 1
                },
                '-z': {
                  'x': 0,
                  'y': 0,
                  'z': -1
                }
              };
              var aB, at = an.filter(aN => 'CabinetHole' === aN['temp_type'])['map'](aN => {
                  var aO = aN['userData']?.['computed']?.['real_size']?.['z'] || 10,
                    aP = aN['userData']?.['computed']?.['real_size']?.['x'] || 5,
                    aQ = aN['userData']?.['params']?.['spec']?.['direction'] || 'z',
                    aR = aM[aQ],
                    aO = w(aO, aP),
                    aS = aN['userData']?.['computed']?.['pos'] || {
                      'x': 0,
                      'y': 0,
                      'z': 0
                    },
                    aT = a0['userData']['computed']['size'];
                  let aU = {
                    'x': aS['x'],
                    'y': aS['y'],
                    'z': aS['z']
                  };
                  switch (aQ) {
                    case 'x':
                      aU = {
                        'x': aS['z'],
                        'y': aS['y'],
                        'z': aS['x']
                      };
                      break;
                    case '-x':
                      aU = {
                        'x': aS['z'],
                        'y': aS['y'],
                        'z': aS['x']
                      };
                      break;
                    case 'y':
                      aU = {
                        'x': aS['x'],
                        'y': aS['z'],
                        'z': aS['y']
                      };
                      break;
                    case '-y':
                      aU = {
                        'x': aS['x'],
                        'y': aS['z'],
                        'z': aS['y']
                      };
                      break;
                    case 'z':
                      aU = {
                        'x': aS['x'],
                        'y': aS['y'],
                        'z': aS['z']
                      };
                      break;
                    case '-z':
                      aU = {
                        'x': aS['x'],
                        'y': aS['y'],
                        'z': aS['z']
                      };
                      break;
                  }
                  return {
                    'pos': aU,
                    'dir': aR,
                    'infoIndex': aO
                  };
                }),
                a8 = a0['userData']['computed']?.['item']?.['id'] || 'UNDEFINED',
                ar = a0['userData']['computed']?.['item']?.['code'],
                ax = ar || 'MAT_' + a8,
                af = a0['userData']['computed']?.['item']?.['name'] || 'Неизвестная\x20фурнитура';
              k['set'](ax, {
                  'art': ax,
                  'name': af
                }),
                ao = {
                  'objType': 5,
                  'holes': at,
                  'materialArt': ax
                };
            } else {
              if (al) {
                var aw, av, aq, ak, ar = (a5['copy'](a9['pos']),
                  aa && (aw = 'string' == typeof aa['x'] ? parseFloat(aa['x']['split']('::')[0]) : aa['x'],
                    av = 'string' == typeof aa['y'] ? parseFloat(aa['y']['split']('::')[0]) : aa['y'],
                    aq = 'string' == typeof aa['z'] ? parseFloat(aa['z']['split']('::')[0]) : aa['z'],
                    (ak = new THREE['Vector3'](aw * a9['size']['x'] / 2, av * a9['size']['y'] / 2, aq * a9['size']
                      ['z'] / 2))['applyQuaternion'](a6),
                    a5['sub'](ak)),
                  a4['compose'](a5, a6, a7),
                  a0['_get_model']());
                let aN = h['get'](ar['model'] + '-' + a9['size']['x'] + '-' + a9['size']['y'] + '-' + a9['size']['z']);
                aN || (aN = {
                    'name': ar['name'],
                    'model': ar['model'],
                    'size': a9['size'],
                    'index': m,
                    'obj': a0
                  },
                  h['set'](ar['model'] + '-' + a9['size']['x'] + '-' + a9['size']['y'] + '-' + a9['size']['z'], aN),
                  m += 1);
                var a8 = a9['model_item']?.['code'] || m + '-' + a9['size']['x'] + '-' + a9['size']['y'] + '-' + a9[
                    'size']['z'],
                  af = a9['model_item']?.['name'] || a9['item']?.['name'] || 'Model';
                k['set'](a8, {
                    'art': a8,
                    'name': af
                  }),
                  ao = {
                    'objType': 5,
                    'materialArt': a8,
                    'triangleData': aN['index']
                  };
              } else
                ao = {
                  'objType': 7,
                  'name': a0['name'] || 'Объект\x20' + v,
                  'isAssemblyUnit': false
                };
            }
          }
          if (ag) {
            var at = ab['spec']['orientation'],
              ax = ab['_pivot_offset'],
              al, aa, aw;
            let aO = null,
              aP = 0;
            switch (at) {
              case 'h':
                ao['thickness'] = a9['size']['y'],
                  a6['multiply'](new THREE['Quaternion']()['setFromAxisAngle'](new THREE['Vector3'](1, 0, 0),
                    Math['PI'] / 2)),
                  aP = ao['thickness'],
                  aO = new THREE['Vector3'](0, 0, 1);
                break;
              case 'v':
                ao['thickness'] = a9['size']['x'],
                  a6['multiply'](new THREE['Quaternion']()['setFromAxisAngle'](new THREE['Vector3'](0, 1, 0), -
                    Math['PI'] / 2)),
                  aP = ao['thickness'],
                  aO = new THREE['Vector3'](0, 0, 1);
                break;
              case 'f':
                ao['thickness'] = a9['size']['z'];
                break;
            }
            aO && (aO['applyQuaternion'](a6),
                aO['multiplyScalar'](-aP),
                a5['add'](aO)),
              a4['compose'](a5, a6, a7),
              ax && (al = new THREE['Vector3']()['setFromMatrixColumn'](a4, 1),
                aa = new THREE['Vector3']()['setFromMatrixColumn'](a4, 0),
                aw = new THREE['Vector3']()['add'](al['clone']()['multiplyScalar'](ax['y']))['add'](aa['clone']()[
                  'multiplyScalar'](ax['x'])),
                a5['add'](aw),
                a4['compose'](a5, a6, a7));
          }
          if (ah && (ao['thickness'] = a9['size']['z']),
            ai && (av = null,
              aq = 0,
              ao['thickness'] = a9['size']['y'],
              a6['multiply'](new THREE['Quaternion']()['setFromAxisAngle'](new THREE['Vector3'](1, 0, 0), Math[
                'PI'] / 2)),
              aq = ao['thickness'],
              (av = new THREE['Vector3'](0, 0, 1)) && (av['applyQuaternion'](a6),
                av['multiplyScalar'](-aq),
                a5['add'](av)),
              a4['compose'](a5, a6, a7)),
            aj && (ao['thickness'] = a9['size']['z']),
            ag || ah || aj) {
            let aQ = ad['computed'] || {
                'x': 100,
                'y': 100
              },
              aR = ad['params'] || {},
              aS = aQ['original_points'] || [];
            if ((aS = aS.length ? aS : [{
                'x': 0,
                'y': 0
              }, {
                'x': aQ['size']['x'],
                'y': 0
              }, {
                'x': aQ['size']['x'],
                'y': aQ['size']['y']
              }, {
                'x': 0,
                'y': aQ['size']['y']
              }])['length']) {
              if (ao['contour'] = {
                  'elemType': 4,
                  'list': []
                },
                ao['contour'] = {
                  'elemType': 4,
                  'list': []
                },
                !aS || aS.length < 1)
                return ao;
              var ak = aS.map(aU => ({
                  'x': void 0 !== aU['x'] ? aU['x'] : 0,
                  'y': void 0 !== aU['y'] ? aU['y'] : 0,
                  'radius': aU['radius'] || 0,
                  'center': aU['center'] ? {
                    'x': aU['center']['x'],
                    'y': aU['center']['y']
                  } : null,
                  'dir': aU['dir'] || false
                })),
                aC = ak.filter(aU => !aU['center']),
                aD = ak.filter(aU => aU['center']),
                aE = {};
              let aT = null;
              if (aC.length) {
                aT = 0 < aC[0]['radius'] ? (aE[0] = O(aC[aC.length - 1], aC[0], aC[1]),
                  ao['contour']['list']['push']({
                    'elemType': 2,
                    'pos1': aE[0]['p1'],
                    'pos2': aE[0]['p2'],
                    'center': aE[0]['center'],
                    'dir': aE[0]['dir']
                  }),
                  aE[0]['p2']) : aC[0];
                for (let aU = 1; aU < aC.length; aU++) {
                  var aF = aC[aU - 1],
                    aG = aC[aU],
                    aH = aC[(aU + 1) % aC.length];
                  aT = 0 < aG['radius'] ? (aE[aU] = O(aF, aG, aH),
                    ao['contour']['list']['push']({
                      'elemType': 1,
                      'pos1': {
                        'x': aT['x'],
                        'y': aT['y']
                      },
                      'pos2': aE[aU]['p1']
                    }),
                    ao['contour']['list']['push']({
                      'elemType': 2,
                      'pos1': aE[aU]['p1'],
                      'pos2': aE[aU]['p2'],
                      'center': aE[aU]['center'],
                      'dir': aE[aU]['dir']
                    }),
                    aE[aU]['p2']) : (ao['contour']['list']['push']({
                      'elemType': 1,
                      'pos1': {
                        'x': aT['x'],
                        'y': aT['y']
                      },
                      'pos2': aG
                    }),
                    aG);
                }
                0 < aC[0]['radius'] ? ao['contour']['list']['push']({
                  'elemType': 1,
                  'pos1': {
                    'x': aT['x'],
                    'y': aT['y']
                  },
                  'pos2': aE[0]['p1']
                }) : ao['contour']['list']['push']({
                  'elemType': 1,
                  'pos1': {
                    'x': aT['x'],
                    'y': aT['y']
                  },
                  'pos2': aC[0]
                });
              }
              if (0 < aD.length)
                for (let aV = 0; aV < aD.length; aV++) {
                  var aI = aD[aV];
                  ao['contour']['list']['push']({
                    'elemType': 3,
                    'center': {
                      'x': aI['center']['x'],
                      'y': aI['center']['y']
                    },
                    'radius': aI['radius'],
                    'dir': aI['dir'] || false
                  });
                }
            }
            var ar = an.filter(aW => 'CabinetPath' === aW['temp_type']);
            ar.length && (ao['grooves'] = ar.map(aW => {
                var aX = aW['userData']['computed'],
                  aY = aW['userData']['params'],
                  aZ = aX['relative_points'] || [],
                  b0 = aX['trajectory'] || [],
                  b1, b2 = aW['userData']['parent']['userData']['params']['spec']['orientation'];
                let b3 = 0,
                  b4 = 0;
                for (let bh = 0; bh < b0.length - 1; bh++) {
                  var b5 = b0[bh],
                    b6 = b0[bh + 1],
                    b7 = Math['abs'](b6['x'] - b5['x']),
                    b6 = Math['abs'](b6['y'] - b5['y']);
                  b7 > b3 && (b3 = b7),
                    b6 > b4 && (b4 = b6);
                }
                var b8 = false,
                  b9 = {
                    'elemType': 4,
                    'list': []
                  };
                if (aZ && 1 <= aZ.length) {
                  let bi = aZ.map(bk => ({
                    'x': void 0 !== bk['x'] ? bk['y'] : 0,
                    'y': void 0 !== bk['y'] ? bk['x'] : 0,
                    'radius': bk['radius'] || 0,
                    'center': bk['center'] ? {
                      'x': bk['center']['y'],
                      'y': bk['center']['x']
                    } : null,
                    'dir': bk['dir'] || false
                  }));
                  var ba = {};
                  let bj = null;
                  var bb = (bi = b4 > b3 ? aZ.map(bk => ({
                      'x': void 0 !== bk['x'] ? -bk['y'] : 0,
                      'y': void 0 !== bk['y'] ? bk['x'] : 0,
                      'radius': bk['radius'] || 0,
                      'center': bk['center'] ? {
                        'x': -bk['center']['y'],
                        'y': bk['center']['x']
                      } : null,
                      'dir': bk['dir'] || false
                    })) : bi)['filter'](bk => !bk['center']),
                    bc = bi.filter(bk => bk['center']);
                  if (0 < bb.length) {
                    bj = 0 < bb[0]['radius'] ? (ba[0] = O(bb[bb.length - 1], bb[0], bb[1]),
                      b9['list']['push']({
                        'elemType': 2,
                        'pos1': ba[0]['p1'],
                        'pos2': ba[0]['p2'],
                        'center': ba[0]['center'],
                        'dir': ba[0]['dir']
                      }),
                      ba[0]['p2']) : bb[0];
                    for (let bk = 1; bk < bb.length; bk++) {
                      var bd = bb[bk - 1],
                        be = bb[bk],
                        bf = bb[(bk + 1) % bb.length];
                      bj = 0 < be['radius'] ? (ba[bk] = O(bd, be, bf),
                        b9['list']['push']({
                          'elemType': 1,
                          'pos1': {
                            'x': bj['x'],
                            'y': bj['y']
                          },
                          'pos2': ba[bk]['p1']
                        }),
                        b9['list']['push']({
                          'elemType': 2,
                          'pos1': ba[bk]['p1'],
                          'pos2': ba[bk]['p2'],
                          'center': ba[bk]['center'],
                          'dir': ba[bk]['dir']
                        }),
                        ba[bk]['p2']) : (b9['list']['push']({
                          'elemType': 1,
                          'pos1': {
                            'x': bj['x'],
                            'y': bj['y']
                          },
                          'pos2': be
                        }),
                        be);
                    }
                    0 < bb[0]['radius'] ? b9['list']['push']({
                      'elemType': 1,
                      'pos1': {
                        'x': bj['x'],
                        'y': bj['y']
                      },
                      'pos2': ba[0]['p1']
                    }) : b9['list']['push']({
                      'elemType': 1,
                      'pos1': {
                        'x': bj['x'],
                        'y': bj['y']
                      },
                      'pos2': bb[0]
                    });
                  }
                  if (0 < bc.length)
                    for (let bl = 0; bl < bc.length; bl++) {
                      var bg = bc[bl];
                      b9['list']['push']({
                        'elemType': 3,
                        'center': {
                          'x': bg['center']['x'],
                          'y': bg['center']['y']
                        },
                        'radius': bg['radius'],
                        'dir': bg['dir'] || false
                      });
                    }
                }
                return {
                  'name': aY?.['name'] || 'Паз',
                  'sign': 'Паз',
                  'frontSide': false,
                  'contour': b9,
                  'trajectory': {
                    'elemType': 4,
                    'list': 1 < b0.length ? [{
                      'elemType': 1,
                      'pos1': b0[0],
                      'pos2': b0[1]
                    }] : []
                  }
                };
              })),
              ad['butt_objects']?.['length'] && (ao['butts'] = ad['butt_objects']['map'](aW => {
                var aX = parseFloat(aW['userData']['params']['spec']['variant_id']),
                  aY = aW['userData']['computed']?.['material']?.['params']?.['variants'][aX]?.['code'] ||
                  'MAT_butts',
                  aZ = aW['userData']['computed']?.['material']?.['params']?.['variants'][aX]?.['name'] ||
                  'Неизвестная\x20кромка',
                  aX = aW['userData']['computed']?.['material']?.['params']?.['variants'][aX]?.['height'] || 0,
                  b0 = parseFloat(aW['userData']['params']?.['spec']['thickness']) || 0.5,
                  b1 = b0 + ('/' + aX + '\x20') + aY;
                return k['set'](aY, {
                  'art': aY,
                  'name': aZ,
                  'sign': b1
                }), {
                  'elemIndex': aW['userData']['params']?.['spec']['face_index'],
                  'thickness': b0,
                  'width': aX,
                  'buttType': 0,
                  'overhang': 0,
                  'allowance': bazis_settings['use_allowance'] ? b0 : 0,
                  'cutIndex': -1,
                  'clip': !!bazis_settings['use_clip'],
                  'materialArt': aY
                };
              }));
          }
          if (ai) {
            let aW = ad['computed'] || {
                'x': 100,
                'y': 100
              },
              aX = (ao['thickness'] = aW['size']['y'],
                ad['params'] || {}),
              aY = aW['points'] || [];
            (aY = aY.length ? aY : [{
              'x': 0,
              'y': 0
            }, {
              'x': aW['size']['x'],
              'y': 0
            }, {
              'x': aW['size']['x'],
              'y': aW['size']['z']
            }, {
              'x': 0,
              'y': aW['size']['z']
            }])['length'] && (ay = aY['reduce']((aZ, b0) => Math['max'](aZ, b0['x']), -1 / 0),
              az = aY['reduce']((aZ, b0) => Math['max'](aZ, b0['y']), -1 / 0),
              aA = ao['thickness'] / 2,
              ao['contour'] = {
                'elemType': 4,
                'list': aY.map((aZ, b0) => {
                  var b0 = (b0 + 1) % aY.length;
                  return {
                    'elemType': 1,
                    'pos1': {
                      'x': aZ['x'],
                      'y': aZ['y']
                    },
                    'pos2': {
                      'x': aY[b0]['x'],
                      'y': aY[b0]['y']
                    }
                  };
                })
              });
          }
          var af = JSON['stringify'](ao),
            at;
          for (let aZ = 0; aZ < as.length; aZ++)
            Math['abs'](as[aZ]) < 1e-10 && (as[aZ] = 0);
          if (u['has'](af) ? ap = {
              'tableIndex': u['get'](af),
              'matrix': as
            } : (ap = {
                'tableIndex': v++,
                'matrix': as
              },
              ag && j['set'](a0, ap),
              u['set'](af, ap['tableIndex']),
              g['table']['objects']['push'](ao)),
            ae && bazis_settings['template_accsessories']) {
            let b0 = [];
            var a8 = parseFloat(ab['spec']['selected_variant']);
            Array.isArray(ab?.['spec']?.['template']?.['accessories']) && 0 < ab?.['spec']?.['template']?.[
                'accessories'
              ]?.['length'] && (b0 = b0['concat'](ab?.['spec']?.['template']?.['accessories'])),
              Array.isArray(ab?.['spec']?.['variants'][a8]?.['accessories']) && 0 < ab?.['spec']?.['variants'][a8]
              ?.['accessories']?.['length'] && (b0 = b0['concat'](ab['spec']['variants'][a8]['accessories'])),
              Array.isArray(b0) && 0 < b0.length && (ap['objs'] = ap['objs'] || [],
                b0.forEach(b1 => {
                  var b2 = accsessories_data['find_item'](b1['id']),
                    b3 = parseFloat(b1['count']);
                  if (b2) {
                    var b1 = b2['code'] || 'ACC_' + b1['id'],
                      b2 = b2['name'] || 'Accessory',
                      b2 = (k['set'](b1, {
                        'art': b1,
                        'name': b2
                      }), {
                        'objType': 5,
                        'materialArt': b1
                      }),
                      b4 = JSON['stringify'](b2);
                    if (u['has'](b4)) {
                      for (let b6 = 0; b6 < b3; b6++)
                        ap['objs']['push']({
                          'tableIndex': u['get'](b4),
                          'matrix': a4['elements']['slice']()
                        });
                    } else {
                      var b5 = v++;
                      for (let b7 = 0; b7 < b3; b7++)
                        ap['objs']['push']({
                          'tableIndex': b5,
                          'matrix': a4['elements']['slice']()
                        });
                      u['set'](b4, b5),
                        g['table']['objects']['push'](b2);
                    }
                  }
                }));
          }
          return an.length && (at = an.filter(b1 => 'CabinetHole' !== b1['temp_type'] && 'CabinetPath' !== b1[
                'temp_type'] && 'CabinetButts' !== b1['temp_type'] && false !== b1['visible'] && 0 !== b1['userData']
              ['active']))['length'] && (ap['objs'] = ap['objs'] || [],
              at.forEach(b1 => {
                var b2 = x(b1, a4, a2 + 1, ap);
                (!('CabinetFurniture' !== b1['temp_type'] && 'CabinetSection' !== b1['temp_type'] && 'Module' !== b1[
                    'temp_type'] || 'CabinetWall' !== a0['temp_type'] && 'CabinetFacade' !== a0['temp_type']) && a3 ?
                  (a3['objs'] = a3['objs'] || [],
                    a3) : ap)['objs']['push'](b2);
              })),
            ap;
        }

        function y(P) {
          Math['PI'];
        }
