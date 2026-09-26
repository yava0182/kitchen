function u(y, z) {
  for (let B = y.length; B--;) {
    var A = y[B];
    if (constructor_settings['core_v2']) {
      if (A['component'] && 'backwall_material_picker' === A['component']['id']) {
        y['splice'](B, 1);
        continue;
      }
      v(y, B),
        w(y, B);
    }
    A['list_view'] && x(y, B),
      z(A),
      A['children'] && u(A['children'], z);
  }
}

function v(y, z) {
  let A = y[z];
  var B, B, B;
  A['component'] && 'corpus_material_picker' === A['component']['id'] && (B = pp['libs']['materials_info']['groups'],
    B = _.filter(B, C => 0 !== C['active'] && (null == A['component']['groups'] || A['component']['groups'][
      'includes'
    ](C['id']))),
    B = _.map(B, C => ({
      'label': void 0 !== C['name'] ? C['name'] : C['key'],
      'icon': '',
      'menu_id': 'group_material_picker_' + C['key'],
      'component': {
        'id': 'corpus_material_picker_v2',
        'props': {
          'is_global': true,
          'fn': 'change_group',
          'mat_group_key': C['key'],
          'categories': null
        }
      }
    })),
    y['splice'](z, 1, ...B));
}

function w(y, z) {
  let A = y[z];
  var B, B, B;
  A['component'] && 'model_material_picker' === A['component']['id'] && (B = pp['libs']['model_materials']['items_arr'],
    B = _.filter(B, C => !!(C['mode'] && C['active'] && C['key']) && !('' + C['mode'] != '2' && '' + C['mode'] !=
      '3' || null != A['component']['groups'] && !_['find'](A['component']['groups'], D => D && '' + D == '' + C[
        'id']))),
    B = _.map(B, C => ({
      'label': void 0 !== C['name'] ? C['name'] : C['key'],
      'icon': '',
      'menu_id': 'model_material_picker_' + C['key'],
      'component': {
        'id': 'model_material_picker',
        'props': {
          'fn': A['component']['fn'],
          'model_material_key': C['key'],
          'categories': null
        }
      }
    })),
    y['splice'](z, 1, ...B));
}

function x(y, z) {
  let A = y[z],
    B = [],
    C = [];
  switch (A['component']['id']) {
    case 'module_picker':
      B = pp['libs']['modules']?.['tree'] || [];
      break;
    case 'project_picker':
      B = pp['libs']['templates']?.['tree'] || [];
      break;
    case 'washes_picker':
      B = pp['libs']['washes']?.['tree'] || [];
      break;
    case 'catalog_picker':
      B = pp['libs']['catalog']?.['tree'] || [];
      break;
    case 'module_picker_v2':
      C = Array.isArray(A['component']['props']['categories']) && 0 < A['component']['props']['categories'][
        'length'
      ] ? Array.from(new Set(A['component']['props']['categories']['map'](I => String(I)))) : Object['keys'](pp[
        'libs']['catalogs'] || {});
      let G = null,
        H = new Set();
      B = C.map(I => {
        let J = I.replace(/_(?:\{\d+\}|\d+)$/, '');
        G !== J && (H['clear'](),
          G = J);
        var K = pp['libs']['catalogs'][J],
          L = new Set((A['component']['props']['categories'] || [])['filter'](N => {
            var O;
            return String(N)['startsWith'](J + '_');
          })['map'](N => {
            var O;
            return String(N)['substring'](J.length + 1);
          })),
          L = 0 < L['size'] ? E(K?.['tree'] || [], L, H) : K?.['tree'] || [];
        return {
          'id': I,
          'name': K?.['name'] || I,
          'active': 1,
          'categories': L
        };
      })['filter'](I => 0 < I['categories']['length']);
      break;
    default:
      B = materials_lib['tree'] || [];
      break;
  }
  if (A['component']['props']['catalog'] && C.length < 1) {
    var D = copy_object(utils['nested_object']['get'](pp['libs'], A['component']['props']['catalog'])),
      D;
    B = D['tree'],
      Array.isArray(A['component']['props']['categories']) && 0 < A['component']['props']['categories'][
      'length'] && (D = new Set(A['component']['props']['categories']['map'](String)),
        B = E(B, D));
  } else {
    if (A['component']['props']['categories'] && !A['component']['props']['catalog']) {
      let I = copy_object(utils['nested_object']['get'](project_settings, A['component']['props']['categories']));
      B = B.filter(J => I['includes'](String(J['id'])));
    }
  }

  function E(J, K, L = new Set()) {
    return J.map(N => {
      var O = String(N['id']),
        P, Q, R, S;
      return !L['has'](O) && (Q = E(N['children'] || N['categories'] || [], K, L),
        R = K['has'](O),
        S = 0 < Q.length,
        R || S) ? (L['add'](O), {
        ...N,
        'categories': Q
      }) : null;
    })['filter'](Boolean);
  }

  function F(J, K = 1, L = A['list_view_depth'] || 1 / 0, N = null) {
    return J.filter(O => 1 == O['active'] || '1' == O['active'])['map'](O => {
      var P = (O['categories'] || [])['filter'](R => 1 == R['active'] || '1' == R['active']),
        P = 0 < P.length && K < L ? F(P, K + 1, L, N || O['id']) : [],
        Q = {
          'label': O['name'] || O['id'],
          'icon': '',
          'menu_id': (0 === K ? 'group_' : '') + A['component']['id'] + '_' + O['id']
        };
      return 0 === P.length || L <= K ? (Q['component'] = {
            'id': A['component']['id'],
            'props': {
              ...A['component']['props']['categories'] ? {
                'categories': String(A['component']['props']['categories'])
              } : {},
              ...A['component']['props']['catalog'] ? {
                'catalog': String(A['component']['props']['catalog'])
              } : {},
              ...A['component']['props']['fn'] ? {
                'fn': String(A['component']['props']['fn'])
              } : {},
              ...A['component']['props']['heading'] ? {
                'heading': String(A['component']['props']['heading'])
              } : {},
              ...A['component']['props']['mat_group_key'] ? {
                'mat_group_key': String(A['component']['props']['mat_group_key'])
              } : {},
              ...A['component']['props']['materials'] ? {
                'materials': String(A['component']['props']['materials'])
              } : {},
              ...A['component']['props']['selected'] ? {
                'selected': String(A['component']['props']['selected'])
              } : {},
              ...A['component']['props']['mode'] ? {
                'mode': String(A['component']['props']['mode'])
              } : {},
              ...A['component']['props']['lib'] ? {
                'lib': String(A['component']['props']['lib'])
              } : {},
              ...!!A['component']['props']['hide_variants'] && {
                'hide_variants': Boolean(A['component']['props']['hide_variants'])
              },
              ...O['id'] ? {
                'cid': String(O['id'])
              } : {}
            }
          },
          'module_picker_v2' === A['component']['id'] && N && (Q['lib_key'] = N,
            Q['list_view'] = A['list_view']),
          A['fn'] && (Q['fn'] = A['fn'])) : Q['children'] = P,
        Q;
    });
  }
  var D = F(B),
    D = {
      ...A,
      'component': void 0,
      'children': D
    };
  y['splice'](z, 1, D);
}
q(h),
  Vue['set'](this, 'items', h);
},
'handle_click': function(h, j, k = false) {
  var l = this,
    m;
  if (this['panel_showed'] = 0,
    this['selected'] == h['id'] && 0 == k)
    'function' == typeof pp['events']['interface']['main_menu_unselect_item'] && pp['events']['interface'][
      'main_menu_unselect_item'
    ](this['current_props']),
    this['selected'] = 0,
    this['current_item'] = null,
    this['$root']['$emit']('main_menu_component_unmount', 1);
  else {
    if (h['component'] && h['component']['id'] && this['current_item'] == h['component']['id'])
      this['current_item'] = null,
      Vue['nextTick'](() => {
        this['handle_click'](h, j, k);
      });
    else {
      if (h['fn'])
        return 'function' == typeof this['$root'][h['fn']['name']] && this['$root'][h['fn']['name']](h['fn']['params']),
          false;
      if (null == h['component'] && h['children']['length'])
        return this['opened'] == j ? this['opened'] = null : this['opened'] = j,
          this['selected'] = 0,
          false;
      if (h['component'] && 'handles_picker' == h['component']['id'] && ('string' == typeof h['component']['props'][
          'categories'
        ] || null == h['component']['props']['categories'])) {
        var q = [];
        for (let s = 0; s < handles_lib['tree']['length']; s++)
          q.push(handles_lib['tree'][s]['id']);
        h['component']['props']['categories'] = q;
      }
      if (this['selected'] = h['id'],
        'facades_picker' == h['component']?.['id'] && (Vue['set'](h['component']['props'], 'can_facade',
            constructor_settings['components']['can_facade']),
          Vue['set'](h['component']['props'], 'can_color', constructor_settings['components']['can_color']),
          Vue['set'](h['component']['props'], 'color_picker', constructor_settings['components']['color_picker'])),
        'cornice_picker' == h['component']?.['id'] && Vue['set'](h['component']['props'], 'selected', parseInt(
          project_settings['selected_cornice_model'])),
        'cokol_material_picker_v2' == h['component']?.['id']) {
        let u;
        u = constructor_settings['core_v2'] ? (m = project_settings['kitchen']?.['defaults'] || {},
            ('cokol_top' === h['component']['props']['lib'] ? m['cokol_top'] : 'legs' === h['component']['props'][
              'lib'] ? m['leg'] : m['cokol'])?.['id']) : 'cokol_top' === h['component']['props']['lib'] ?
          project_settings['defaults']['cokol_top']?.['material'] : 'legs' === h['component']['props']['lib'] ?
          project_settings['defaults']['leg']?.['material'] : project_settings['selected_cokol_model'],
          Vue['set'](h['component']['props'], 'selected', parseInt(u));
      }
      'module_picker_v2' === h['component']?.['id'] && h['lib_key'] && h['list_view'] && (/_\d+$/ ['test'](h[
          'lib_key']) && (h['lib_key'] = h['lib_key']['replace'](/_(?:\{\d+\}|\d+)$/, '')),
          Vue['set'](h['component']['props'], 'lib_key', 'catalogs.' + h['lib_key'])),
        this['current_props'] = h['component']['props'],
        this['current_props']['is_group'] = 0,
        this['current_props']['menu_id'] = h['menu_id'],
        this['current_item'] = h['component']['id'],
        'function' == typeof pp['events']['interface']['main_menu_select_item'] && pp['events']['interface'][
          'main_menu_select_item'
        ](this['current_props']),
        0 != this['selected'] && (this['panel_showed'] = 1);
    }
  }

  function r(v) {
    for (var w of Object['keys'](pp['libs']['catalogs'])) {
      var x = pp['libs']['catalogs'][w];
      if (x['categories'] && x['categories'][v])
        return w;
    }
  }
},
'get_icon': function(h) {
  var i = {};
  return i[h['icon']] = true,
    i;
},
'check_enabled': function(h) {
  return !h['component'] || void 0 === constructor_settings['components'][h['component']['id']] || 0 !=
    constructor_settings['components'][h['component']['id']];
},
'change_heading': function(h) {
  this['heading'] = h;
},
'menu_heading_click'() {
  this['$root']['$emit']('main_menu_heading_click');
},
'lang': function(h) {
  return this['$root']['lang'](h);
}
}
}),
Vue['component']('menu_item', {
'props': ['item', 'level', 'selected', 'handle_click', 'get_icon', 'check_enabled', 'icons'],
'data'() {
  return {
    'opened': false
  };
},
'created'() {
  this['icon_map'] = g();
},
'methods': {
  'onClick'() {
    this['item']['children'] && this['item']['children']['length'] && !this['item']['component'] ? this[
      'opened'] = !this['opened'] : this['handle_click'](this['item']);
  },
  'get_svg_icon'(h) {
    return this['icon_map'] && Array.isArray(this['icon_map']) && this['icon_map']['includes'](h) ? h : null;
  },
  'lang': function(h) {
    return this['$root']['lang'](h);
  }
},
'template': '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li\x20:class=\x22[\x27main_menu_\x27\x20+\x20item.id,\x20\x27main_menu_\x27\x20+\x20item.menu_id,\x20{t_color_selected:\x20selected\x20==\x20item.id},\x20{t_bck_color2:\x20selected\x20==\x20item.id}]\x22\x20v-if=\x22check_enabled(item)\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20@click=\x22onClick\x22\x20:class=\x22{t_color_hover:\x20!item.divider,\x20div_h:\x20item.divider,\x20t_div_color:\x20item.divider}\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20v-if=\x22get_svg_icon(item.icon)\x22><icon\x20\x20width=\x2232\x22\x20height=\x2232\x22\x20:name=\x22\x27icon-\x27\x20+\x20get_svg_icon(item.icon)\x22></icon></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<i\x20v-else-if=\x22item.icon\x22\x20class=\x22p_icon\x20icon\x22\x20:class=\x22get_icon(item)\x22></i>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20v-if=\x22item.label\x22>{{item.label}}</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20v-else>{{lang(item.text)}}</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<ul\x20v-show=\x22opened\x22\x20class=\x22main_submenu\x22\x20v-if=\x22item.children\x20&&\x20item.children.length\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<menu_item\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20v-for=\x22child\x20in\x20item.children\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20:key=\x22child.id\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20:item=\x22child\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20:level=\x22level\x20+\x201\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20:selected=\x22selected\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20:handle_click=\x22handle_click\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20:get_icon=\x22get_icon\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20:check_enabled=\x22check_enabled\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20:icons=\x22icons\x22\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20></menu_item>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</ul>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20'
});
}),
interface_components_init.push(function() {
    Vue['component']('material_picker', {
        'template': '#material_picker_template',
        'props': {
          'heading': {
            'type': String,
            'default': ''
          },
          'categories': {
            'type': [String, Array],
            'default': []
          },
          'items': {
            'type': [String, Array],
            'default': function() {
              return [];
            }
          },
          'selected': {
            'type': [String, Number],
            'default': 0
          },
          'lib': {
            'type': String,
            'default': 'materials'
          },
          'mode': {
            'type': String,
            'default': 'p'
          },
          'fn': {
            'type': String,
            'default': ''
          },
          'callback': {
            'type': Function,
            'default': null
          },
          'emit': {
            'type': Boolean,
            'default': false
          },
          'is_group': {
            'type': [Boolean, Number],
            'default': 0
          },
          'icon_dd_menu': {
            'type': [Boolean, Number],
            'default': 0
          }
        },
        'mixins': [mixin],
        'data': function() {
          return {
            'expanded': false,
            'l_mode': '',
            'l_selected': 0
          };
        },
        'watch': {
          'selected': function(f, g) {
            this['l_selected'] = this['selected'];
          }
        },
        'created': function() {
          this['l_selected'] = this['selected'],
            this['l_mode'] = this['mode'];
        },
        'methods': {
          'select_item': function(f) {
            var g = f['id'];
            this['l_selected'] = parseInt(g),
              'function' == typeof this['callback'] ? this['callback'](f) : this['emit'] ? this['emit_select'](
              f) : sc[this['fn']]({
                'id': g
              });
          },
          'emit_select': function(e) {
            this['$emit']('change_material', e);
          },
          'select_item_group': function(f) {
            var g;
            this['emit'] && (g = f['id'],
              this['l_selected'] = parseInt(g),
              this['$emit']('change_material_group', f));
          },
          'find_item': function(e) {
            this['$refs']['catalog']['check_scroll'](),
              this['l_mode'] = 'c';
          }
        }
      }),
      Vue['component']('walls_material_picker', {
        'template': '#material_picker_load_own_template',
        'props': {
          'heading': {
            'type': String,
            'default': ''
          },
          'categories': {
            'type': [String, Array],
            'default': []
          },
          'items': {
            'type': [String, Array],
            'default': function() {
              return [];
            }
          },
          'selected': {
            'type': [String, Number],
            'default': 0
          },
          'lib': {
            'type': String,
            'default': 'materials'
          },
          'mode': {
            'type': String,
            'default': 'p'
          },
          'fn': {
            'type': String,
            'default': ''
          }
        },
        'mixins': [mixin],
        'data': function() {
          return {
            'expanded': false,
            'l_mode': '',
            'l_selected': 0,
            'custom_tex': 0
          };
        },
        'watch': {
          'selected': function(f, g) {
            this['l_selected'] = this['selected'];
          }
        },
        'created': function() {
          this['l_selected'] = this['selected'],
            this['l_mode'] = this['mode'],
            null != global_options['custom_textures']['lr_wall'] && (this['custom_tex'] = 1),
            Vue['nextTick'](() => {
              this['custom_tex'] && (this['$refs']['tex_width']['value'] = global_options[
                  'custom_textures_params']['lr_wall']['width'],
                this['$refs']['tex_height']['value'] = global_options['custom_textures_params']['lr_wall'][
                  'height'
                ],
                this['$refs']['tex_str_x']['checked'] = global_options['custom_textures_params']['lr_wall'][
                  'str_x'
                ],
                this['$refs']['tex_str_y']['checked'] = global_options['custom_textures_params']['lr_wall'][
                  'str_y'
                ],
                this['$refs']['tex_repeat']['value'] = global_options['custom_textures_params']['lr_wall'][
                  'repeat'
                ]);
            }),
            this['$root']['$on']('set_custom_material_params_walls', e => {
              Vue['nextTick'](() => {
                this['$refs']['tex_width']['value'] = e['width'],
                  this['$refs']['tex_height']['value'] = e['height'],
                  this['$refs']['tex_str_x']['checked'] = e['str_x'],
                  this['$refs']['tex_str_y']['checked'] = e['str_y'],
                  this['$refs']['tex_repeat']['value'] = e['repeat'];
              });
            });
        },
        'methods': {
          'change_param': function() {},
          'change_tex': function(f, g) {
            var h = [global_options['custom_textures']['lr_wall'], global_options['custom_textures']['fb_wall']];
            switch (f) {
              case 'tex_width':
                this['$refs']['tex_str_x']['checked'] || (global_options['custom_textures']['lr_wall']['map'][
                    'repeat'
                  ]['x'] = room['params']['depth'] / parseInt(g['target']['value']),
                  global_options['custom_textures']['lr_wall']['map']['needsUpdate'] = true,
                  global_options['custom_textures_params']['lr_wall']['width'] = parseInt(g['target']['value']),
                  global_options['custom_textures']['fb_wall']['map']['repeat']['x'] = room['params']['width'] /
                  parseInt(g['target']['value']),
                  global_options['custom_textures']['fb_wall']['map']['needsUpdate'] = true,
                  global_options['custom_textures_params']['fb_wall']['width'] = parseInt(g['target']['value']));
                break;
              case 'tex_height':
                this['$refs']['tex_str_y']['checked'] || (global_options['custom_textures']['lr_wall']['map'][
                    'repeat'
                  ]['y'] = room['params']['height'] / parseInt(g['target']['value']),
                  global_options['custom_textures']['lr_wall']['map']['needsUpdate'] = true,
                  global_options['custom_textures_params']['lr_wall']['height'] = parseInt(g['target'][
                  'value']),
                  global_options['custom_textures']['fb_wall']['map']['repeat']['y'] = room['params'][
                  'height'] / parseInt(g['target']['value']),
                  global_options['custom_textures']['fb_wall']['map']['needsUpdate'] = true,
                  global_options['custom_textures_params']['fb_wall']['height'] = parseInt(g['target']['value'])
                  );
                break;
              case 'tex_str_x':
                global_options['custom_textures']['lr_wall']['map']['repeat']['x'] = g['target']['checked'] ?
                  1 : room['params']['depth'] / parseInt(this['$refs']['tex_width']['value']),
                  global_options['custom_textures']['lr_wall']['map']['needsUpdate'] = true,
                  global_options['custom_textures_params']['lr_wall']['str_x'] = to_int(g['target']['checked']),
                  global_options['custom_textures']['fb_wall']['map']['repeat']['x'] = g['target']['checked'] ?
                  1 : room['params']['width'] / parseInt(this['$refs']['tex_width']['value']),
                  global_options['custom_textures']['fb_wall']['map']['needsUpdate'] = true,
                  global_options['custom_textures_params']['fb_wall']['str_x'] = to_int(g['target']['checked']);
                break;
              case 'tex_str_y':
                global_options['custom_textures']['lr_wall']['map']['repeat']['y'] = g['target']['checked'] ?
                  1 : room['params']['height'] / parseInt(this['$refs']['tex_height']['value']),
                  global_options['custom_textures']['lr_wall']['map']['needsUpdate'] = true,
                  global_options['custom_textures_params']['lr_wall']['str_y'] = to_int(g['target']['checked']),
                  global_options['custom_textures']['fb_wall']['map']['repeat']['y'] = g['target']['checked'] ?
                  1 : room['params']['height'] / parseInt(this['$refs']['tex_height']['value']),
                  global_options['custom_textures']['fb_wall']['map']['needsUpdate'] = true,
                  global_options['custom_textures_params']['fb_wall']['str_y'] = to_int(g['target']['checked']);
                break;
              case 'tex_repeat':
                let i = THREE['RepeatWrapping'];
                'mirror' == g['target']['value'] && (i = THREE['MirroredRepeatWrapping']),
                  global_options['custom_textures_params']['lr_wall']['repeat'] = g['target']['value'],
                  global_options['custom_textures_params']['fb_wall']['repeat'] = g['target']['value'];
                for (let j = h.length; j--;)
                  h[j]['map']['wrapS'] = h[j]['map']['wrapT'] = i,
                  h[j]['map']['wrapS'] = h[j]['map']['wrapT'] = i,
                  h[j]['map']['needsUpdate'] = true;
                break;
            }
          },
          'choose_img'() {
            this['$refs']['img_input']['click']();
          },
          'reset_img'() {
            this['$refs']['img_input']['value'] = '',
              'set_walls_material' == this['fn'] && (sc[this['fn']]({
                  'id': project_settings['selected_materials']['walls']
                }),
                global_options['custom_textures']['lr_wall'] = null,
                global_options['custom_textures']['fb_wall'] = null,
                this['custom_tex'] = 0),
              'set_floor_material' == this['fn'] && (sc[this['fn']]({
                  'id': project_settings['selected_materials']['floor']
                }),
                global_options['custom_textures']['floor'] = null,
                this['custom_tex'] = 0);
          },
          'load_tex'(f) {
            let g = new FileReader();
            var h = this['$refs']['img_input']['files'][0];
            h && g['readAsDataURL'](h),
              g['onload'] = () => {
                let i = new Image();
                i['onload'] = () => {
                    'set_walls_material' == this['fn'] && (sc['set_walls_custom_material'](i),
                        global_options['custom_textures']['lr_wall']['texture'] = i['src'],
                        global_options['custom_textures']['fb_wall']['texture'] = i['src']),
                      'set_floor_material' == this['fn'] && (sc['set_floor_custom_material'](i),
                        global_options['custom_textures']['floor']['texture'] = i['src']),
                      this['custom_tex'] = 1;
                  },
                  i['src'] = g['result'];
              };
          },
          'load_own': function() {},
          'select_item': function(e) {
            var e = e['id'];
            this['l_selected'] = parseInt(e),
              sc[this['fn']]({
                'id': e
              });
          },
          'find_item': function(e) {
            this['$refs']['catalog']['check_scroll'](),
              this['l_mode'] = 'c';
          }
        }
      }),
      Vue['component']('floor_material_picker', {
        'template': '#material_picker_load_own_template',
        'props': {
          'heading': {
            'type': String,
            'default': ''
          },
          'categories': {
            'type': [String, Array],
            'default': []
          },
          'items': {
            'type': [String, Array],
            'default': function() {
              return [];
            }
          },
          'selected': {
            'type': [String, Number],
            'default': 0
          },
          'lib': {
            'type': String,
            'default': 'materials'
          },
          'mode': {
            'type': String,
            'default': 'p'
          },
          'fn': {
            'type': String,
            'default': ''
          }
        },
        'mixins': [mixin],
        'data': function() {
          return {
            'expanded': false,
            'l_mode': '',
            'l_selected': 0,
            'custom_tex': 0
          };
        },
        'watch': {
          'selected': function(f, g) {
            this['l_selected'] = this['selected'];
          }
        },
        'created': function() {
          this['l_selected'] = this['selected'],
            this['l_mode'] = this['mode'],
            null != global_options['custom_textures']['floor'] && (this['custom_tex'] = 1),
            Vue['nextTick'](() => {
              this['custom_tex'] && (this['$refs']['tex_width']['value'] = global_options[
                  'custom_textures_params']['floor']['width'],
                this['$refs']['tex_height']['value'] = global_options['custom_textures_params']['floor'][
                  'height'
                ],
                this['$refs']['tex_str_x']['checked'] = global_options['custom_textures_params']['floor'][
                  'str_x'
                ],
                this['$refs']['tex_str_y']['checked'] = global_options['custom_textures_params']['floor'][
                  'str_y'
                ],
                this['$refs']['tex_repeat']['value'] = global_options['custom_textures_params']['floor'][
                  'repeat'
                ]);
            }),
            this['$root']['$on']('set_custom_material_params_floor', e => {
              Vue['nextTick'](() => {
                this['$refs']['tex_width']['value'] = e['width'],
                  this['$refs']['tex_height']['value'] = e['height'],
                  this['$refs']['tex_str_x']['checked'] = e['str_x'],
                  this['$refs']['tex_str_y']['checked'] = e['str_y'],
                  this['$refs']['tex_repeat']['value'] = e['repeat'];
              });
            });
        },
        'methods': {
          'change_tex': function(f, g) {
            switch (f) {
              case 'tex_width':
                this['$refs']['tex_str_x']['checked'] || (global_options['custom_textures']['floor']['map'][
                    'repeat'
                  ]['x'] = room['params']['width'] / parseInt(g['target']['value']),
                  global_options['custom_textures']['floor']['map']['needsUpdate'] = true,
                  global_options['custom_textures_params']['floor']['width'] = parseInt(g['target']['value']));
                break;
              case 'tex_height':
                this['$refs']['tex_str_y']['checked'] || (global_options['custom_textures']['floor']['map'][
                    'repeat'
                  ]['y'] = room['params']['depth'] / parseInt(g['target']['value']),
                  global_options['custom_textures']['floor']['map']['needsUpdate'] = true,
                  global_options['custom_textures_params']['floor']['height'] = parseInt(g['target']['value']));
                break;
              case 'tex_str_x':
                global_options['custom_textures']['floor']['map']['repeat']['x'] = to_int(g['target'][
                  'checked']) ? 1 : room['params']['width'] / parseInt(this['$refs']['tex_width']['value']),
                  global_options['custom_textures']['floor']['map']['needsUpdate'] = true,
                  global_options['custom_textures_params']['floor']['str_x'] = to_int(g['target']['checked']);
                break;
              case 'tex_str_y':
                global_options['custom_textures']['floor']['map']['repeat']['y'] = to_int(g['target'][
                  'checked']) ? 1 : room['params']['depth'] / parseInt(this['$refs']['tex_height']['value']),
                  global_options['custom_textures']['floor']['map']['needsUpdate'] = true,
                  global_options['custom_textures_params']['floor']['str_y'] = to_int(g['target']['checked']);
                break;
              case 'tex_repeat':
                let h = THREE['RepeatWrapping'];
                'mirror' == g['target']['value'] && (h = THREE['MirroredRepeatWrapping']),
                  global_options['custom_textures']['floor']['map']['wrapS'] = global_options['custom_textures'][
                    'floor'
                  ]['map']['wrapT'] = h,
                  global_options['custom_textures']['floor']['map']['needsUpdate'] = true,
                  global_options['custom_textures_params']['floor']['repeat'] = g['target']['value'];
                break;
            }
          },
          'choose_img'() {
            this['$refs']['img_input']['click']();
          },
          'reset_img'() {
            this['$refs']['img_input']['value'] = '',
              'set_walls_material' == this['fn'] && (sc[this['fn']]({
                  'id': project_settings['selected_materials']['walls']
                }),
                global_options['custom_textures']['lr_wall'] = null,
                global_options['custom_textures']['fb_wall'] = null,
                this['custom_tex'] = 0),
              'set_floor_material' == this['fn'] && (sc[this['fn']]({
                  'id': project_settings['selected_materials']['floor']
                }),
                global_options['custom_textures']['floor'] = null,
                this['custom_tex'] = 0);
          },
          'load_tex'(f) {
            let g = new FileReader();
            var h = this['$refs']['img_input']['files'][0];
            h && g['readAsDataURL'](h),
              g['onload'] = () => {
                let i = new Image();
                i['onload'] = () => {
                    'set_walls_material' == this['fn'] && (sc['set_walls_custom_material'](i),
                        global_options['custom_textures']['lr_wall']['texture'] = i['src'],
                        global_options['custom_textures']['fb_wall']['texture'] = i['src']),
                      'set_floor_material' == this['fn'] && (sc['set_floor_custom_material'](i),
                        global_options['custom_textures']['floor']['texture'] = i['src']),
                      this['custom_tex'] = 1;
                  },
                  i['src'] = g['result'];
              };
          },
          'select_item': function(e) {
            var e = e['id'];
            this['l_selected'] = parseInt(e),
              sc[this['fn']]({
                'id': e
              });
          },
          'find_item': function(e) {
            this['$refs']['catalog']['check_scroll'](),
              this['l_mode'] = 'c';
          }
        }
      }),
      Vue['component']('glass_material_picker', {
        'template': '#material_picker_template',
        'props': {
          'heading': {
            'type': String,
            'default': ''
          },
          'categories': {
            'type': [String, Array],
            'default': []
          },
          'items': {
            'type': [String, Array],
            'default': function() {
              return [];
            }
          },
          'selected': {
            'type': [String, Number],
            'default': 0
          },
          'lib': {
            'type': String,
            'default': 'materials'
          },
          'mode': {
            'type': String,
            'default': 'p'
          },
          'fn': {
            'type': String,
            'default': ''
          },
          'method': {
            'type': String,
            'default': 'project'
          },
          'is_group': {
            'type': [Boolean, Number],
            'default': 0
          },
          'icon_dd_menu': {
            'type': [Boolean, Number],
            'default': 0
          }
        },
        'mixins': [mixin],
        'data': function() {
          return {
            'expanded': false,
            'l_mode': '',
            'l_selected': 0
          };
        },
        'watch': {
          'selected': function(f, g) {
            this['l_selected'] = this['selected'];
          }
        },
        'created': function() {
          this['l_selected'] = this['selected'],
            this['l_mode'] = this['mode'];
        },
        'methods': {
          'select_item': function(e) {
            var e;
            'project' != this['method'] ? (this['$emit']('change_material', e),
              this['l_selected'] = parseInt(e['id'])) : (e = e['id'],
              this['l_selected'] = parseInt(e),
              sc[this['fn']]({
                'id': e
              }));
          },
          'find_item': function(e) {
            this['$refs']['catalog']['check_scroll'](),
              this['l_mode'] = 'c';
          },
          'select_item_group': function(e) {}
        }
      }),
      Vue['component']('wallpanel_materials_picker', {
        'template': '#wallpanel_picker_template',
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
          'lib': {
            'type': String,
            'default': 'materials'
          },
          'mode': {
            'type': String,
            'default': 'p'
          },
          'fn': {
            'type': String,
            'default': ''
          },
          'cid': {
            'type': String,
            'default': ''
          }
        },
        'mixins': [mixin],
        'data': function() {
          return {
            'expanded': false,
            'wallpanel_height': 0,
            'l_mode': 'c'
          };
        },
        'created': function() {
          this['wallpanel_height'] = project_settings['wall_panel']['height'],
            this['l_mode'] = this['mode'];
        },
        'mounted': function() {},
        'methods': {
          'expand_panel': function() {
            this['expanded'] = !this['expanded'],
              this['$root']['$emit']('expand_panel', this['expanded']);
          },
          'mouse_down': function(e) {
            sc['unset_mouse_mode']();
            var e = {
              'material': materials_lib['get_item'](e['id']),
              'draggable': true,
              'height': this['wallpanel_height']
            };
            sc['add_object']('Wall_panel', e);
          },
          'reset': function() {}
        }
      }),
      Vue['component']('tabletop_materials_picker', {
        'template': '#tabletop_picker_template',
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
          'lib': {
            'type': String,
            'default': 'materials'
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
          }
        },
        'mixins': [mixin],
        'data': function() {
          return {
            'expanded': false,
            'tabletop_thickness': 0,
            'l_custom_props': [],
            'l_selected': 0,
            'l_mode': '',
            'debounce': null
          };
        },
        'watch': {
          'selected': function(f, g) {
            this['l_selected'] = this['selected'];
          }
        },
        'created': function() {
          if (this['l_selected'] = this['selected'],
            this['l_mode'] = this['mode'],
            this['l_custom_props'] = [],
            this['$root']['$custom_options']['tabletop']) {
            var f = this['$root']['$custom_options']['tabletop'];
            for (let g = 0; g < f.length; g++)
              this['l_custom_props']['push'](f[g]);
          }
          null == this['thickness_val'] ? this['tabletop_thickness'] = project_settings['tabletop_thickness'] :
            this['tabletop_thickness'] = this['thickness_val'];
        },
        'methods': {
          'change_custom_prop': function(e) {
            this['$root']['$custom_functions'][this['l_custom_props'][e]['function']]();
          },
          'expand_panel': function() {
            this['expanded'] = !this['expanded'],
              this['$root']['$emit']('expand_panel', this['expanded']);
          },
          'change_tabletop_thickness': function(f) {
            clearTimeout(this['debounce']);
            let g = this;
            this['debounce'] = setTimeout(function() {
              'project' != g['method'] ? g['$emit']('change_thickness', g['tabletop_thickness']) :
                change_tabletop_thickness(g['tabletop_thickness']);
            }, this['delay']);
          },
          'select_item': function(e) {
            var e;
            'project' != this['method'] ? (this['$emit']('change_material', e),
              this['l_selected'] = parseInt(e['id'])) : (e = e['id'],
              this['l_selected'] = parseInt(e),
              sc[this['fn']]({
                'id': e
              }));
          },
          'find_item': function(e) {
            this['$refs']['catalog']['check_scroll'](),
              this['l_mode'] = 'c';
          }
        }
      }),
      Vue['component']('corpus_material_picker', {
        'template': '#corpus_picker_template',
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
          'selected2': {
            'type': [String, Number],
            'default': 0
          },
          'lib': {
            'type': String,
            'default': 'materials'
          },
          'mode': {
            'type': String,
            'default': 'p'
          },
          'fn': {
            'type': String,
            'default': ''
          },
          'method': {
            'type': String,
            'default': 'act'
          },
          'multiple': {
            'type': Number,
            'default': 1
          },
          'thickness_val': {
            'type': Number,
            'default': null
          }
        },
        'mixins': [mixin],
        'data': function() {
          return {
            'expanded': false,
            'l_selected': 0,
            'l_selected2': 0,
            'is_equal': false,
            'dsp_thickness': 16,
            'dsp_variants': copy_object(project_settings['available_corpus_thickness']),
            'l_mode': 'p'
          };
        },
        'watch': {
          'selected': function(f, g) {
            this['l_selected'] = this['selected'];
          },
          'selected2': function(f, g) {
            this['l_selected2'] = this['selected2'];
          },
          'thickness_val': function(f, g) {
            this['dsp_thickness'] = this['thickness_val'];
          }
        },
        'created': function() {
          null == this['thickness_val'] ? this['dsp_thickness'] = parseInt(project_settings['corpus_thickness']) :
            this['dsp_thickness'] = this['thickness_val'],
            this['l_mode'] = this['mode'],
            this['l_selected'] = this['selected'],
            this['l_selected2'] = this['selected2'],
            this['check_equal']();
        },
        'computed': {},
        'methods': {
          'change_dsp_thickness': function() {
            'act' != this['method'] ? this['$emit']('change_thickness', this['dsp_thickness']) : sc[
              'change_dsp_thickness'](this['dsp_thickness']);
          },
          'check_equal': function() {
            if (this['l_selected'] == this['l_selected2'])
              this['is_equal'] = true;
            else {
              let f = this['l_selected'],
                g = this['l_selected2'];
              'string' == typeof this['l_selected'] && (f = utils['nested_object']['get'](project_settings, this[
                  'l_selected'])),
                'string' == typeof this['l_selected2'] && (g = utils['nested_object']['get'](project_settings,
                  this['l_selected2'])),
                this['is_equal'] = f == g;
            }
          },
          'select_item': function(e) {
            var e;
            'act' != this['method'] ? (this['l_selected'] = parseInt(e['id']),
              this['$emit']('change_material', e)) : (e = e['id'],
              this['l_selected'] = parseInt(e),
              this['l_selected2'] = parseInt(e),
              sc[this['fn']]({
                'id': e
              }),
              this['check_equal']());
          },
          'select_item_top': function(e) {
            var e = e['id'];
            this['l_selected'] = parseInt(e),
              sc[this['fn']]({
                'group': 'top',
                'id': e
              }),
              this['check_equal']();
          },
          'select_item_bottom': function(e) {
            var e = e['id'];
            this['l_selected2'] = parseInt(e),
              sc[this['fn']]({
                'group': 'bottom',
                'id': e
              }),
              this['check_equal']();
          },
          'find_item': function(e) {
            this['$refs']['catalog']['check_scroll'](),
              this['l_mode'] = 'c';
          }
        }
      }),
      Vue['component']('cokol_material_picker', {
        'template': '#cokol_picker_template',
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
          'lib': {
            'type': String,
            'default': 'materials'
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
          'multiple': {
            'type': Number,
            'default': 0
          },
          'height_val': {
            'type': Number,
            'default': null
          },
          'cokol_as_corpus_val': {
            'type': Boolean,
            'default': null
          }
        },
        'mixins': [mixin],
        'data': function() {
          return {
            'expanded': false,
            'l_selected': 0,
            'cokol_height': 0,
            'cokol_float': false,
            'l_custom_props': [],
            'cokol_as_corpus': false,
            'debounce': null,
            'l_mode': 'p'
          };
        },
        'watch': {
          'selected': function(f, g) {
            this['l_selected'] = this['selected'];
          },
          'height_val': function(f, g) {
            this['cokol_height'] = this['height_val'];
          }
        },
        'created': function() {
          if (this['l_selected'] = this['selected'],
            null == this['height_val'] ? this['cokol_height'] = project_settings['cokol_height'] : this[
              'cokol_height'] = this['height_val'],
            null == this['cokol_as_corpus_val'] ? this['cokol_as_corpus'] = project_settings['cokol_as_corpus'] :
            this['cokol_as_corpus'] = this['cokol_as_corpus_val'],
            null == project_settings['cokol_disabled'] && (project_settings['cokol_disabled'] = false),
            this['cokol_float'] = project_settings['cokol_disabled'],
            this['l_custom_props'] = [],
            this['$root']['$custom_options']['cokol']) {
            var f = this['$root']['$custom_options']['cokol'];
            for (let g = 0; g < f.length; g++)
              this['l_custom_props']['push'](f[g]);
          }
        },
        'methods': {
          'change_custom_prop': function(f, g) {
            this['$root']['$custom_functions'][this['l_custom_props'][g]['function']](f);
          },
          'change_cokol_height': function() {
            clearTimeout(this['debounce']);
            let e = this;
            this['debounce'] = setTimeout(function() {
              'project' != e['method'] ? e['$emit']('change_height', e['cokol_height']) : change_cokol_height(
                e['cokol_height']);
            }, this['delay']);
          },
          'change_cokol_float': function() {
            'project' != this['method'] ? this['$emit']('change_cokol_float', this['cokol_float']) : sc[
              'set_cokol_disable_all'](this['cokol_float']);
          },
          'change_cokol_as_corpus': function(e) {
            'project' != this['method'] ? this['$emit']('change_material_as_corpus', 1) : project_settings[
              'selected_materials']['bottom']['corpus'] !== project_settings['selected_materials']['cokol'] && (
              change_cokol_material(project_settings['selected_materials']['bottom']['corpus']),
              this['l_selected'] = parseInt(project_settings['selected_materials']['bottom']['corpus']));
          },
          'select_item': function(e) {
            var e;
            'project' != this['method'] ? (this['$emit']('change_material', e),
              this['l_selected'] = parseInt(e['id'])) : (project_settings['selected_materials']['bottom'][
                'corpus'
              ] !== e['id'] && (this['cokol_as_corpus'] = false),
              e = e['id'],
              this['l_selected'] = parseInt(e),
              sc[this['fn']]({
                'id': e
              }));
          },
          'find_item': function(e) {
            this['$refs']['catalog']['check_scroll'](),
              this['l_mode'] = 'c';
          }
        }
      }),
      Vue['component']('backwall_material_picker', {
        'template': '#backwall_picker_template',
        'props': {
          'heading': {
            'type': String,
            'default': ''
          },
          'categories': {
            'type': [Object, String, Array],
            'default': []
          },
          'selected': {
            'type': [String, Object],
            'default': {
              'default': 0,
              'key': 'type_0'
            }
          },
          'selected2': {
            'type': [String, Object],
            'default': {
              'default': 0,
              'key': 'type_0'
            }
          },
          'lib': {
            'type': String,
            'default': 'materials'
          },
          'mode': {
            'type': String,
            'default': 'p'
          },
          'fn': {
            'type': String,
            'default': ''
          },
          'multiple': {
            'type': Number,
            'default': 1
          },
          'method': {
            'type': String,
            'default': 'project'
          }
        },
        'mixins': [mixin],
        'data': function() {
          return {
            'expanded': false,
            'l_selected': {
              'id': 0,
              'key': 'type_0'
            },
            'l_selected2': {
              'id': 0,
              'key': 'type_0'
            },
            'l_mode': '',
            'is_equal': false
          };
        },
        'watch': {
          'selected': function(f, g) {
            this['l_selected'] = copy_object(this['selected']);
          },
          'selected2': function(f, g) {
            this['l_selected2'] = copy_object(this['selected2']);
          }
        },
        'created': function() {
          this['l_selected'] = copy_object(this['selected']),
            this['l_selected2'] = copy_object(this['selected2']),
            this['l_mode'] = this['mode'],
            this['check_equal']();
        },
        'computed': {},
        'methods': {
          'check_equal': function() {
            let f = this['l_selected'],
              g = this['l_selected2'],
              h = ('string' == typeof this['l_selected'] && (f = utils['nested_object']['get'](project_settings,
                  this['l_selected'])),
                'string' == typeof this['l_selected2'] && (g = utils['nested_object']['get'](project_settings,
                  this['l_selected2'])),
                false);
            f['id'] == g['id'] && f['key'] == g['key'] && (h = true),
              this['is_equal'] = h;
          },
          'select_item': function(e) {
            'project' != this['method'] ? (this['l_selected'] = {
                'id': parseInt(e['item']['id']),
                'key': e['key']
              },
              this['l_selected2'] = {
                'id': parseInt(e['item']['id']),
                'key': e['key']
              },
              this['$emit']('change_material', e)) : (this['l_selected'] = {
                'id': parseInt(e['item']['id']),
                'key': e['key']
              },
              this['l_selected2'] = {
                'id': parseInt(e['item']['id']),
                'key': e['key']
              },
              sc[this['fn']](e['key'], e['item']['id'], 'all'),
              this['check_equal']());
          },
          'select_item_top': function(e) {
            this['l_selected'] = {
                'id': parseInt(e['item']['id']),
                'key': e['key']
              },
              sc[this['fn']](e['key'], e['item']['id'], 'top'),
              this['check_equal']();
          },
          'select_item_bottom': function(e) {
            this['l_selected2'] = {
                'id': parseInt(e['item']['id']),
                'key': e['key']
              },
              sc[this['fn']](e['key'], e['item']['id'], 'bottom'),
              this['check_equal']();
          },
          'find_item': function(e) {
            this['l_mode'] = 'c';
          }
        }
      }),
      Vue['component']('cokol_material_picker_v2', {
        'template': '#cokol_picker_template_v2',
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
          'lib': {
            'type': String,
            'default': 'cokol'
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
          'multiple': {
            'type': Number,
            'default': 0
          },
          'height_val': {
            'type': Number,
            'default': null
          },
          'cokol_as_corpus_val': {
            'type': Boolean,
            'default': null
          },
          'is_nested_picker': {
            'type': [Boolean, Number],
            'default': false
          }
        },
        'mixins': [mixin],
        'data': function() {
          return {
            'expanded': false,
            'l_selected': 0,
            'cokol_height': 0,
            'cokol_float': false,
            'l_custom_props': [],
            'cokol_as_corpus': false,
            'debounce': null,
            'l_mode': 'p'
          };
        },
        'watch': {
          'selected': function(f, g) {
            this['l_selected'] = this['selected'];
          },
          'height_val': function(f, g) {
            this['cokol_height'] = this['height_val'];
          }
        },
        'created': function() {
          if (this['l_selected'] = this['selected'],
            ce(),
            ce(),
            ce(),
            null == this['height_val'] ? this['cokol_height'] = project_settings['cokol_height'] : this[
              'cokol_height'] = this['height_val'],
            null == this['cokol_as_corpus_val'] ? this['cokol_as_corpus'] = project_settings['cokol_as_corpus'] :
            this['cokol_as_corpus'] = this['cokol_as_corpus_val'],
            null == project_settings['cokol_disabled'] && (project_settings['cokol_disabled'] = false),
            this['cokol_float'] = project_settings['cokol_disabled'],
            this['l_custom_props'] = [],
            this['l_mode'] = this['mode'] || 'p',
            'cokol_top' !== this['lib'] && this['$root']['$custom_options']['cokol']) {
            var f = this['$root']['$custom_options']['cokol'];
            for (let g = 0; g < f.length; g++)
              this['l_custom_props']['push'](f[g]);
          }
        },
        'methods': {
          'change_custom_prop': function(f, g) {
            this['$root']['$custom_functions'][this['l_custom_props'][g]['function']](f);
          },
          'change_cokol_height': function() {
            clearTimeout(this['debounce']);
            let e = this;
            this['debounce'] = setTimeout(function() {
              'project' != e['method'] ? e['$emit']('change_height', e['cokol_height']) : change_cokol_height(
                e['cokol_height']);
            }, this['delay']);
          },
          'change_cokol_float': function() {
            'project' != this['method'] ? this['$emit']('change_cokol_float', this['cokol_float']) : sc[
              'set_cokol_disable_all'](this['cokol_float']);
          },
          'change_cokol_as_corpus': function(e) {
            'project' != this['method'] ? this['$emit']('change_material_as_corpus', 1) : project_settings[
              'selected_materials']['bottom']['corpus'] !== project_settings['selected_materials']['cokol'] && (
              change_cokol_material(project_settings['selected_materials']['bottom']['corpus']),
              this['l_selected'] = parseInt(project_settings['selected_materials']['bottom']['corpus']));
          },
          'select_item': function(e) {
            var e;
            'project' != this['method'] ? (this['$emit']('change_material', e),
              this['l_selected'] = parseInt(e['id'])) : (project_settings['selected_materials']['bottom'][
                'corpus'
              ] !== e['id'] && (this['cokol_as_corpus'] = false),
              e = e['id'],
              this['l_selected'] = parseInt(e),
              sc[this['fn']]({
                'id': e
              }));
          },
          'find_item': function(e) {
            this['$refs']['catalog']['check_scroll'](),
              this['l_mode'] = 'c';
          }
        }
      }),
      Vue['component']('butt_material_picker', {
        'template': '#butt_picker_template',
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
          'lib': {
            'type': String,
            'default': 'materials'
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
          }
        },
        'mixins': [mixin],
        'data': function() {
          return {
            'expanded': false,
            'l_selected': 0,
            'l_mode': '',
            'debounce': null
          };
        },
        'watch': {
          'selected': function(f, g) {
            this['l_selected'] = this['selected'];
          }
        },
        'created': function() {
          this['l_selected'] = this['selected'],
            this['l_mode'] = this['mode'];
        },
        'methods': {
          'expand_panel': function() {
            this['expanded'] = !this['expanded'],
              this['$root']['$emit']('expand_panel', this['expanded']);
          },
          'select_item': function(e) {
            var e;
            'project' != this['method'] ? (this['$emit']('change_material', e),
              this['l_selected'] = parseInt(e['id'])) : (e = e['id'],
              this['l_selected'] = parseInt(e),
              sc[this['fn']]({
                'id': e
              }));
          },
          'find_item': function(e) {
            this['$refs']['catalog']['check_scroll'](),
              this['l_mode'] = 'c';
          }
        }
      });
  }),
  interface_components_init.push(function() {
    function e() {
      let f = [];
      var g = document['querySelector']('svg[style*=\x22display:none\x22]'),
        h;
      return g ? (g['querySelectorAll']('symbol')['forEach'](i => {
          var i = i['id'],
            i;
          i && i['startsWith']('icon-') && (i = i.replace('icon-', ''),
            f.push(i));
        }),
        f) : [];
    }
    Vue['component']('order_modal', {
        'template': '#order_modal_template',
        'props': [],
        'data': function() {
          return {
            'heading': '',
            'mask_init': false,
            'fields': pp['defaults']['order_form_fields'],
            'mode': 'inputs',
            'error_text': '',
            'cb': null,
            'show': 0
          };
        },
        'created': function() {
          let f = this;
          if (f['heading'] = f['lang']('send_order'),
            1 == constructor_settings['email']['use_custom_form'] && constructor_settings['email'][
              'custom_form_data'
            ]['length']) {
            for (let i = constructor_settings['email']['custom_form_data']['length']; i--;)
              constructor_settings['email']['custom_form_data'][i]['error'] = false,
              'select' == constructor_settings['email']['custom_form_data'][i]['type'] ? constructor_settings[
                'email']['custom_form_data'][i]['val'] = constructor_settings['email']['custom_form_data'][i][
                'values'
              ][0]['text'] : constructor_settings['email']['custom_form_data'][i]['val'] = '';
            Vue['set'](this, 'fields', copy_object(constructor_settings['email']['custom_form_data']));
          }
          let g = lang['i_agreement'],
            h = 'https://planplace.online/ru/policy';
          location['href']['indexOf']('planplace.ru') < 0 && (h = '',
              g = lang['i_accept']),
            this['fields']['push']({
              'id': 'accept',
              'label': g,
              'required': 1,
              'required_check_type': 'non_empty',
              'type': 'checkbox',
              'error': false,
              'val': false,
              'link': h
            }),
            this['$root']['$on']('order_modal_show', function(j) {
              f['show_modal']();
            }),
            this['$root']['$on']('order_modal_set_fields', j => {
              for (let k = 0; k < j.length; k++)
                for (let l = 0; l < this['fields']['length']; l++)
                  j[k]['id'] === this['fields'][l]['id'] && (this['fields'][l]['val'] = j[k]['val']);
            });
        },
        'methods': {
          'lang': function(f) {
            return this['$root']['lang'](f);
          },
          'show_modal': function() {
            this['show'] = 1;
            let f = this;
            if (!this['mask_init']) {
              ce('flds');
              for (let i = 0; i < this['fields']['length']; i++)
                if (this['fields'][i]['mask_enabled'] && 0 != this['fields'][i]['mask_enabled']) {
                  var g = this['fields'][i];
                  for (let j = 0; j < this['$refs']['mask']['length']; j++) {
                    var h = this['$refs']['mask'][j];
                    g['id'] == h['dataset']['fid'] && new Inputmask(g['mask_template'])['mask'](h);
                  }
                }
              this['mask_init'] = true;
            }
            Vue['nextTick'](function() {
              f['get_hidden_inputs']();
            });
          },
          'get_hidden_inputs': function() {
            constructor_settings['no_email_image'] || (this['$refs']['screen']['value'] = get_screen(0.9),
                this['$refs']['save_data']['value'] = JSON['stringify'](get_save_data_new()),
                this['$refs']['modules_list']['value'] = JSON['stringify'](get_modules_send_data()),
                sc['get_price'](),
                constructor_settings['price_enabled'] && (this['$refs']['price']['value'] = document[
                  'getElementById']('price_val')['innerText'])),
              'function' == typeof order_form_init_callback && order_form_init_callback();
          },
          'check_fields': function() {
            let f = this,
              g = true;
            var h = {
              'non_empty': function(i) {
                switch (i['type']) {
                  case 'checkbox':
                    return 1 == i['val'];
                  case 'accept':
                    return 1 == i['val'];
                  case 'select':
                    return i['val'] != i['select_check_val'];
                  default:
                    return '' != i['val']['trim']();
                }
              },
              'email': function(i) {
                var j;
                return /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9-]{2,}\.[a-zA-Z]{2,}$/ [
                  'test'
                ](String(i['val'])['toLowerCase']());
              },
              'phone': function(i) {
                var j;
                return /((8|\+7)[\- ]?)?(\(?\d{3,4}\)?[\- ]?)?[\d\- ]{5,10}/ ['test'](i['val']);
              },
              'files': function() {
                var j = f['$refs']['form_file'][0]['files'],
                  k;
                if (!j.length)
                  return true;
                let l = true,
                  m = 0;
                for (k of j)
                  m += k['size'],
                  'image' !== k['type']['split']('/')[0] && (l = false);
                return m = (m / 1048576)['toFixed'](2),
                  l = 5 < m ? false : l;
              },
              'text': function(i) {
                switch (i['type']) {
                  case 'checkbox':
                    return 1 == i['val'];
                  case 'accept':
                    return 1 == i['val'];
                  case 'select':
                    return i['val'] != i['select_check_val'];
                  default:
                    return '' != i['val']['trim']();
                }
              }
            };
            for (let i = 0; i < this['fields']['length']; i++)
              'file' != this['fields'][i]['type'] || h['files']() || (this['fields'][i]['error'] = true,
                g = false),
              0 == this['fields'][i]['required'] || h[this['fields'][i]['required_check_type']](this['fields'][
                i]) || (this['fields'][i]['error'] = true,
                g = false);
            return g;
          },
          'clear_error': function(f) {
            f['error'] = false;
          },
          'send': async function() {
            if (this['check_fields']()) {
              if (this['mode'] = 'sending',
                -1 < location['href']['indexOf']('new_dev'))
                setTimeout(() => {
                  this['mode'] = 'success';
                }, 2000);
              else {
                var f = new FormData(this['$refs']['order_form']),
                  g;
                if (!constructor_settings['no_email_pdf'])
                  try {
                    var h = get_images(),
                      g, j, k = (custom_settings['no_xl'] || (g = await create_xl(true, h),
                          j = new Blob([g], {
                            'type': 'application/xlsx'
                          }),
                          f['append']('xlsx_file', j)),
                        await generate_pdf(h, 'blob')),
                      m, p;
                    f['append']('pdf_file_blob', k),
                      create_csv && 'function' == typeof create_csv && (m = await create_csv(),
                        p = new Blob([m], {
                          'type': 'application/csv'
                        }),
                        f['append']('csv_file_order', p));
                  } catch (w) {}
                let q, u = location['origin'] + location['pathname'];
                q = -1 < u['indexOf']('.php') ? ((g = u.split('/'))['length'] = g.length - 1,
                    (u = g['join']('/')) + '/config/index.php/clients_orders/sendkm') : u +
                  'config/index.php/clients_orders/sendkm',
                  'function' == typeof c_before_send_callback && c_before_send_callback(f);
                let v;
                if (200 == (v = 'function' == typeof c_custom_send ? await c_custom_send(f) :
                    await promise_post_raw(q, f))['status'])
                  this['mode'] = 'success',
                  'function' == typeof send_order_callback && send_order_callback(f);
                else {
                  switch (v['status']) {
                    case 500:
                      this['error_text'] = lang['send_error_500_body'];
                      break;
                    default:
                      this['error_text'] = lang['send_error_400_body_p1'] + '</br>' + lang[
                        'send_error_400_body_p2'];
                  }
                  this['mode'] = 'error';
                }
              }
            }
          },
          'ok': function() {
            for (let f = 0; f < this['fields']['length']; f++)
              switch (this['fields'][f]['type']) {
                case 'checkbox':
                  this['fields'][f]['val'] = false;
                  break;
                case 'select':
                  this['fields'][f]['val'] = this['fields'][f]['values'][0]['text'];
                  break;
                default:
                  this['fields'][f]['val'] = '';
              }
            this['show'] = 0,
              this['mode'] = 'inputs';
          },
          'submit': function(f) {
            f['preventDefault']();
          }
        }
      }),
      Vue['component']('info_modal', {
        'template': '#info_modal_template',
        'props': {
          'colspan': {
            'type': Number,
            'default': null == custom_settings['info_colspan'] ? 4 : custom_settings['info_colspan']
          },
          'show_price': {
            'type': [Boolean, Number],
            'default': null == custom_settings['info_show_price'] ? null == constructor_settings['price_enabled'] ||
              Boolean(constructor_settings['price_enabled']) : custom_settings['info_show_price']
          },
          'show_count': {
            'type': Boolean,
            'default': null == custom_settings['info_show_count'] || custom_settings['info_show_count']
          },
          'show_icons': {
            'type': [Boolean, Number],
            'default': null == constructor_settings['specs_icons'] || constructor_settings['specs_icons']
          }
        },
        'data': function() {
          return {
            'heading': '',
            'd': null,
            'molded': null,
            'show': 0,
            'v2': 0
          };
        },
        'created': function() {
          let f = this;
          f['heading'] = '',
            this['$root']['$on']('info_modal_show', function(g) {
              1 == g['v2'] && Vue['set'](f, 'v2', 1),
                2 == g['v2'] && Vue['set'](f, 'v2', 2),
                f['heading'] = g['heading'],
                Vue['set'](f, 'd', g['data']),
                f['show'] = 1;
            }),
            this['$options']['lang_obj'] = {
              'corpus': lang['corpus'],
              'cokol': lang['cokol'],
              'tabletop': lang['tabletop'],
              'tabletop_plints': lang['tabletop_plints'],
              'facades': lang['facades'],
              'facades_edge': lang['facades_edge'],
              'handles': lang['handles'],
              'glass': lang['glass_materials'],
              'furniture': lang['furniture'],
              'accessories': lang['accessories'],
              'back_wall': lang['back_wall_cabinet'],
              'facades_fixed': lang['facades'],
              'edge': lang['edge']
            };
        },
        'methods': {
          'check': function() {
            return this['show_price'];
          },
          'lang': function(f) {
            return this['$root']['lang'](f);
          },
          'get_label'(f) {
            return this['$options']['lang_obj'][f];
          },
          'get_rows'(f) {
            return f.length;
          },
          'get_price_pp'(f, g) {
            return 'furniture' == g || 'accessories' == g ? to_fix2(f['price_per_piece']) + '\x20' + lang[
                'currency'] : to_fix2(f['price_per_piece'] * constructor_settings['price_modificator']) + '\x20' +
              lang['currency'];
          },
          'get_price'(f, g) {
            return 'furniture' == g || 'accessories' == g ? to_fix2(f['price']) + '\x20' + lang['currency'] :
              to_fix2(f['price'] * constructor_settings['price_modificator']) + '\x20' + lang['currency'];
          },
          'get_count'(f, g) {
            let h = 0;
            var j;
            return 'items' === g ? f['count'] + '\x20' + lang[f['units']] : 'tabletop' === g ? (j = void 0 !== f[
                'units'] ? f['units'] : 'units_flat',
              f['count'] + '\x20' + lang[j]) : (h = f['count'] ? 'handles' == g && ('overhead_profile' == f[
                'type'] || 'facade_profile' == f['type'] || 'gola' == f['type']) ? f['count'] * parseInt(f[
                'width']) / 1000 : f['count'] : 'tabletop_plints' == g || 'edge' == g ? f['pm'] :
              'facades_edge' == g ? f['per'] : f['m2'],
              f['count'] ? 'handles' == g && ('overhead_profile' == f['type'] || 'facade_profile' == f['type'] ||
                'gola' == f['type']) ? h = to_fix2(h) + '\x20' + lang['units_pogon'] : h += '\x20' + lang[
                'units_pcs'] : h = 'tabletop_plints' == g || 'edge' == g ? to_fix2(h) + '\x20' + lang[
                'units_pogon'] : 'facades_edge' == g ? h + '\x20' + lang['units_flat'] : to_fix2(h) + '\x20' +
              lang['units_square'],
              h);
          },
          'get_total'(f) {
            return to_fix2(f['total']) + '\x20' + this['lang']('currency');
          }
        }
      }),
      Vue['component']('info_item_modal', {
        'template': '#info_item_modal_template',
        'props': {
          'key_prop': {
            'type': String,
            'default': ''
          },
          'item_prop': {
            'type': Object,
            'default': () => ({})
          },
          'mode_prop': {
            'type': String,
            'default': 'project'
          },
          'show_price': {
            'type': [Boolean, Number],
            'default': null == custom_settings['info_show_price'] || custom_settings['info_show_price']
          }
        },
        'watch': {
          'key_prop': function() {
            this['key'] = this['key_prop'];
          },
          'item_prop': function() {
            this['item'] = this['item_prop'];
          },
          'mode_prop': function() {
            this['mode'] = this['mode_prop'];
          }
        },
        'data': function() {
          return {
            'key': '',
            'item': {},
            'mode': ''
          };
        },
        'created': function() {
          this['$options']['lang_obj'] = {
              'corpus': lang['corpus'],
              'cokol': lang['cokol'],
              'tabletop': lang['tabletop'],
              'tabletop_plints': lang['tabletop_plints'],
              'facades': lang['facades'],
              'facades_edge': lang['facades_edge'],
              'handles': lang['handles'],
              'glass': lang['glass_materials'],
              'furniture': lang['furniture'],
              'accessories': lang['accessories'],
              'back_wall': lang['back_wall_cabinet'],
              'facades_fixed': lang['facades'],
              'edge': lang['edge']
            },
            this['key'] = this['key_prop'],
            this['item'] = this['item_prop'],
            this['mode'] = this['mode_prop'];
        },
        'methods': {
          'lang': function(f) {
            return this['$root']['lang'](f);
          }
        }
      }),
      Vue['component']('cropper_modal', {
        'template': '#cropper_modal_template',
        'props': [],
        'mixins': [mixin],
        'data': function() {
          return {
            'heading': '',
            'd': null,
            'show': 0,
            'key': null,
            'img': null,
            'image': {
              'src': null,
              'type': null
            }
          };
        },
        'created': async function() {
          let f = this;
          f['heading'] = f['lang']('send_order'),
            this['$root']['$on']('cropper_modal_show', async function(g = {
              'heading': ''
            }) {
              f['heading'] = g['heading'],
                f['key'] = g['key'],
                await load_script('/common_assets/libs/vue/cropper/cropper.min.js'),
                Vue['set'](f, 'd', g['data']),
                f['show'] = 1;
            });
        },
        'methods': {
          'flip'(f, g) {
            this['$refs']['cropper']['flip'](f, g);
          },
          'rotate'(f) {
            this['$refs']['cropper']['rotate'](f);
          },
          'destroyed'() {
            this['image']['src'] && URL['revokeObjectURL'](this['image']['src']);
          },
          'maximize'() {
            var {
              cropper: f
            } = this['$refs'];
            let g = {
              'left': f['coordinates']['left'] + f['coordinates']['width'] / 2,
              'top': f['coordinates']['top'] + f['coordinates']['height'] / 2
            };
            f['setCoordinates']([({
              coordinates: h,
              imageSize: i
            }) => ({
              'width': i['width'],
              'height': i['height']
            }), ({
              coordinates: h,
              imageSize: i
            }) => ({
              'left': g['left'] - h['width'] / 2,
              'top': g['top'] - h['height'] / 2
            })]);
          },
          'defaultSize'({
            imageSize: f,
            visibleArea: g
          }) {
            return {
              'width': (g || f)['width'],
              'height': (g || f)['height']
            };
          },
          'change'({
            coordinates: f,
            canvas: g
          }) {},
          'crop'() {
            var {
              coordinates: f,
              canvas: g
            } = this['$refs']['cropper']['getResult'](), f = (this['coordinates'] = f,
              this['$root']['$selected_object']), h, g, j, k, k;
            f && (h = document['getElementById']('cropped_images'),
              g = g['toDataURL'](),
              j = f['params']['obj_id'] + ':' + this['key'],
              (k = document['getElementById'](j)) ? k['src'] = g : ((k = document['createElement']('IMG'))[
                'src'] = g,
                k['id'] = j,
                k['classList']['add']('crp_img'),
                k['dataset']['key'] = j,
                h['appendChild'](k)),
              f['set_image_map_by_key'](this['key'], g),
              sc['select_object'](f));
          },
          'loadImage'(f) {
            function g(j, k = null) {
              var l = new Uint8Array(j)['subarray'](0, 4);
              let m = '';
              for (let n = 0; n < l.length; n++)
                m += l[n]['toString'](16);
              switch (m) {
                case '89504e47':
                  return 'image/png';
                case '47494638':
                  return 'image/gif';
                case 'ffd8ffe0':
                case 'ffd8ffe1':
                case 'ffd8ffe2':
                case 'ffd8ffe3':
                case 'ffd8ffe8':
                  return 'image/jpeg';
                default:
                  return k;
              }
            }
            let {
              files: h
            } = f['target'];
            if (h && h[0]) {
              this['image']['src'] && URL['revokeObjectURL'](this['image']['src']);
              let j = URL['createObjectURL'](h[0]);
              var f = new FileReader();
              f['onload'] = k => {
                  this['image'] = {
                    'src': j,
                    'type': g(k['target']['result'], h[0]['type'])
                  };
                },
                f['readAsArrayBuffer'](h[0]);
            }
          }
        }
      }),
      Vue['component']('yn_modal', {
        'template': '#yn_modal_template',
        'props': [],
        'data': function() {
          return {
            'yes_text': lang['yes'],
            'no_text': lang['no'],
            'heading': '',
            'body': '',
            'show_close': 1,
            'css_class': '',
            'cb': null,
            'callback': null,
            'no_callback': null,
            'show': 0,
            'hide_on_click': 1
          };
        },
        'created': function() {
          let f = this;
          this['$root']['$on']('yn_modal_show', function(g) {
            void 0 !== g['yes_text'] ? f['yes_text'] = g['yes_text'] : f['yes_text'] = lang['yes'],
              f['no_text'] = void 0 !== g['no_text'] ? g['no_text'] : lang['no'],
              void 0 === g['show_close'] && (g['show_close'] = 1),
              void 0 !== g['css_class'] && (f['css_class'] = g['css_class']),
              f['heading'] = g['heading'],
              f['body'] = g['body'],
              f['cb'] = g['cb'],
              f['show_close'] = g['show_close'],
              f['callback'] = g['callback'],
              f['no_callback'] = g['no_callback'],
              void 0 !== g['hide_on_click'] && (f['hide_on_click'] = g['hide_on_click']),
              f['show'] = 1;
          });
        },
        'methods': {
          'click_outside': function(f) {
            f['target'] == this['$refs']['wrapper'] && (this['hide_on_click'] && (this['show'] = 0),
              'function' == typeof this['no_callback']) && (this['no_callback'](),
              this['no_callback'] = null,
              this['show'] = 0);
          },
          'lang': function(f) {
            return this['$root']['lang'](f);
          },
          'yes': function() {
            'function' == typeof this['callback'] ? (this['callback'](),
                this['callback'] = null) : this['$root']['$emit']('yn_modal_' + this['cb'], true),
              this['show'] = 0;
          },
          'no': function() {
            'function' == typeof this['no_callback'] && (this['no_callback'](),
                this['no_callback'] = null),
              this['show'] = 0;
          }
        }
      }),
      Vue['component']('custom_modal', {
        'template': '#custom_modal_template',
        'props': {},
        'data': function() {
          return {
            'heading': '',
            'css_class': 'p_modal_xl',
            'body': '',
            'show': 0,
            'fn_name': '',
            'callback': null
          };
        },
        'created': function() {
          this['$root']['$on']('show_custom_modal', f => {
            this['css_class'] = f['css_class'],
              this['heading'] = f['heading'],
              this['body'] = f['body'],
              this['fn_name'] = f['fn_name'],
              this['callback'] = f['callback'],
              this['show'] = 1;
          });
        },
        'methods': {
          'lang': function(f) {
            return this['$root']['lang'](f);
          },
          'close_modal': function() {
            if ('function' == typeof this['callback'])
              return false === this['callback'](this) ? void 0 : void(this['show'] = 0);
            this['fn_name'] && global_options['custom_functions'][this['fn_name']] && global_options[
                'custom_functions'][this['fn_name']](),
              this['show'] = 0;
          }
        }
      }),
      Vue['component']('password_modal', {
        'template': '#password_modal_template',
        'props': [],
        'data': function() {
          return {
            'heading': '',
            'body': '',
            'password': '',
            'cb': null,
            'show': 0,
            'wrong': false
          };
        },
        'created': function() {
          let f = this;
          this['$root']['$on']('password_modal_show', function(g) {
            f['cb'] = g['cb'],
              f['show'] = 1;
          });
        },
        'methods': {
          'click_outside': function(f) {
            f['target'] == this['$refs']['wrapper'] && (this['show'] = 0);
          },
          'lang': function(f) {
            return this['$root']['lang'](f);
          },
          'yes': function() {
            MD5(MD5(this['password'])) == constructor_settings['pdf_password'] ? (this['wrong'] = false,
              'function' == typeof ic[this['cb']] && ic[this['cb']](),
              this['show'] = 0) : this['wrong'] = true;
          }
        }
      }),
      Vue['component']('comments_modal', {
        'template': '#comments_modal_template',
        'props': [],
        'data': function() {
          return {
            'heading': '',
            'body': '',
            'edit_mode': false,
            'edit_index': null,
            'show': 0,
            'items': []
          };
        },
        'created': function() {
          this['$root']['$on']('show_comments_modal', () => {
            this['show'] = 1,
              Vue['set'](this, 'items', this['get_comments']());
          });
        },
        'mounted': function() {},
        'methods': {
          'lang': function(f) {
            return this['$root']['lang'](f);
          },
          'get_comments': function() {
            return project_settings['comments'] || (project_settings['comments'] = []),
              copy_object(project_settings['comments']);
          },
          'add_comment': function() {
            '' != this['$refs']['input']['value'] && (this['edit_mode'] ? (this['items'][this['edit_index']][
                  'text'
                ] = this['$refs']['input']['value'],
                project_settings['comments'][this['edit_index']]['text'] = this['$refs']['input']['value'],
                this['edit_mode'] = false,
                this['edit_index'] = null) : (this['items']['push']({
                  'text': this['$refs']['input']['value']
                }),
                sc['add_comment']({
                  'text': this['$refs']['input']['value']
                })),
              this['$refs']['input']['value'] = '',
              this['text_input']());
          },
          'remove_comment': function(f) {
            this['items']['splice'](f, 1),
              project_settings['comments']['splice'](f, 1);
          },
          'text_input': function() {
            this['$refs']['input']['style']['height'] = 0,
              this['$refs']['input']['style']['height'] = this['$refs']['input']['scrollHeight'] + 2 + 'px';
          },
          'edit_comment': function(f) {
            this['edit_mode'] = true,
              this['edit_index'] = f,
              this['$refs']['input']['value'] = this['items'][f]['text'],
              this['text_input']();
          }
        }
      }),
      Vue['component']('custom_screenshot_modal', {
        'template': '#custom_screenshot_modal_template',
        'props': [],
        'data': function() {
          return {
            'heading': '',
            'body': '',
            'password': '',
            'width': 4096,
            'height': 4096,
            'cb': null,
            'show': 0,
            'wrong': false
          };
        },
        'created': function() {
          let f = this;
          this['$root']['$on']('custom_screenshot_modal_show', function(g) {
            f['show'] = 1;
          });
        },
        'methods': {
          'click_outside': function(f) {
            f['target'] == this['$refs']['wrapper'] && (this['show'] = 0);
          },
          'lang': function(f) {
            return this['$root']['lang'](f);
          },
          'yes': function() {
            save_screen(parseInt(this['width']), parseInt(this['height'])),
              this['show'] = 0;
          }
        }
      }),
      Vue['component']('services_modal', {
        'template': '#services_modal_template',
        'props': [],
        'data': function() {
          return {
            'show': 0,
            'items': [],
            'debounce': null,
            'delay': 'undefined' == typeof input_delay ? 500 : input_delay
          };
        },
        'created': function() {
          this['$root']['$on']('services_modal_show', f => {
            this['init']();
          });
        },
        'methods': {
          'add'() {
            this['items']['push']({
                'name': '',
                'price': 0
              }),
              project_settings['services']['push']({
                'name': '',
                'price': 0
              }),
              this['$root']['$emit']('update_services_count'),
              sc['get_price']();
          },
          'change'(f, g, h) {
            clearTimeout(this['debounce']),
              this['debounce'] = setTimeout(() => {
                this['items'][f][g] = h['target']['value'],
                  project_settings['services'][f][g] = h['target']['value'];
              }, this['delay']);
          },
          'remove'(f) {
            this['items']['splice'](f, 1),
              project_settings['services']['splice'](f, 1),
              this['$root']['$emit']('update_services_count'),
              sc['get_price']();
          },
          'init'() {
            this['show'] = 1,
              Vue['set'](this, 'items', copy_object(project_settings['services']));
          },
          'close_modal'() {
            this['show'] = 0,
              this['$root']['$emit']('update_services_count'),
              sc['get_price']();
          },
          'click_outside': function(f) {
            f['target'] == this['$refs']['wrapper'] && this['close_modal']();
          },
          'lang': function(f) {
            return this['$root']['lang'](f);
          }
        }
      }),
      Vue['component']('auth_modal', {
        'template': '#auth_modal_template',
        'props': [],
        'data': function() {
          return {
            'show': 0,
            'heading': '',
            'login': '',
            'password': '',
            'success': null,
            'info_text': '',
            'button': true,
            'debounce': null,
            'delay': 'undefined' == typeof input_delay ? 500 : input_delay,
            'show_password': false
          };
        },
        'created': function() {
          this['$root']['$on']('show_auth_modal', f => {
              this['heading'] = f['heading'],
                this['init']();
            }),
            this['icon_map'] = e();
        },
        'methods': {
          'init'() {
            this['show'] = 1;
          },
          'click_outside': function(f) {
            f['target'] == this['$refs']['wrapper'] && 'function' == typeof this['no_callback'] && (this[
                'no_callback'](),
              this['no_callback'] = null,
              this['show'] = 0);
          },
          'toggle_password'() {
            this['show_password'] = !this['show_password'];
          },
          'get_svg_icon'(f) {
            return this['icon_map'] && Array.isArray(this['icon_map']) && this['icon_map']['includes'](f) ? f :
              null;
          },
          'close_modal'() {
            this['show'] = 0;
          },
          async 'submit'() {
            var f, f;
            this['login'] && this['password'] ? (this['button'] = false,
              (f = {})['login'] = this['login'],
              f['password'] = this['password'],
              f = await this['$root']['$up']['login'](f),
              this['button'] = true,
              this['success'] = f['success'],
              this['info_text'] = f['message'],
              this['success'] && setTimeout(() => {
                this['show'] = 0,
                  project_settings['project_select'] && this['$root']['$emit']('project_select_mode');
              }, 500)) : this['wrong'] = true;
          },
          'lang': function(f) {
            return this['$root']['lang'](f);
          }
        }
      }),
      Vue['component']('project_list_modal', {
        'template': '#project_list_modal_template',
        'props': [],
        'data': function() {
          return {
            'show': 0,
            'heading': '',
            'success': null,
            'info_text': '',
            'data': {},
            'selected_project': {},
            'button': true,
            'debounce': null,
            'delay': 'undefined' == typeof input_delay ? 500 : input_delay
          };
        },
        'created': function() {
          this['$root']['$on']('show_project_list_modal', f => {
              this['heading'] = f['heading'],
                this['init']();
            }),
            this['$root']['$on']('select_project_data', f => {
              this['get_select_project'](f);
            });
        },
        'methods': {
          async 'init'() {
            this['show'] = 1;
            var f = this['$root']['$up']['user_info']['user_email'];
            await this['get_data']({
              'additional_field': 'user',
              'additional_value': f
            });
          },
          'click_outside': function(f) {
            f['target'] == this['$refs']['wrapper'] && 'function' == typeof this['no_callback'] && (this[
                'no_callback'](),
              this['no_callback'] = null,
              this['show'] = 0);
          },
          async 'select_project'(f, g) {
            try {
              var h = await fetch(g);
              if (!h['ok'])
                throw new Error('Ошибка\x20загрузки\x20файла:\x20' + h['statusText']);
              var j = await h['blob'](),
                k = new FileReader();
              k['onload'] = function(l) {
                  load_scene_new(l['target']['result']),
                    f && (project_settings['project_select'] = Number(f));
                },
                k['readAsText'](j),
                this['$root']['$emit']('project_select_mode');
            } catch (l) {}
          },
          async 'get_select_project'(f) {
            try {
              var g = await this['$root']['$axios']['get']('config/index.php/api/projects/get?id=' + f);
              200 === g['status'] && 'success' === g['data']['status'] && (Vue['set'](this, 'selected_project',
                  g['data']['response']),
                this['$root']['$emit']('project_selected', this['selected_project']),
                this['show'] = 0);
            } catch (h) {}
          },
          'close_modal'() {
            this['show'] = 0;
          },
          async 'get_data'({
            type: f = null,
            search: g = null,
            additional_field: h = null,
            additional_value: j = null
          } = {}) {
            try {
              var k = new URLSearchParams({
                  'start': 0,
                  'order': 'DESC',
                  'order_by': 'created'
                }),
                l = ('search' === f && g && k['append']('search', g),
                  h && j && k['append'](h, j),
                  await this['$root']['$axios']['get']('config/index.php/api/projects/list?' + k.toString()));
              200 === l['status'] && 'success' === l['data']['status'] && Vue['set'](this, 'data', l['data'][
                'response'
              ]);
            } catch (m) {}
          },
          async 'filter_user'(f) {
            var g = this['$root']['$up']['user_info']['user_email'];
            f ? await this['get_data']({
              'additional_field': 'user',
              'additional_value': g
            }) : await this['get_data']();
          },
          'lang': function(f) {
            return this['$root']['lang'](f);
          }
        }
      }),
      Vue['component']('loader_modal', {
        'template': '#loader_modal_template',
        'props': {
          'error': {
            'type': String,
            'default': ''
          }
        },
        'data'() {
          return {
            'heading': '',
            'show': 0,
            'mode': 'loader',
            'success': null,
            'text': '',
            'additional_info': {
              'link': '',
              'text': ''
            }
          };
        },
        'computed': {
          'truncated_link'() {
            var f = this['additional_info']?.['link'] || '';
            return 40 < f.length ? f['slice'](0, 40) + '...' : f;
          }
        },
        'created': function() {
          this['$root']['$on']('show_loader_modal', f => {
              this['heading'] = f['heading'],
                this['mode'] = f['mode'] || 'loader',
                this['text'] = this['lang'](f['text']) || f['text'],
                this['additional_info'] = f['additional_info'] || null,
                this['additional_info'] && this['additional_info']?.['text'] && (this['additional_info'][
                  'text'] = this['lang'](this['additional_info']['text']) || this['additional_info']['text']),
                this['init']();
            }),
            this['$root']['$on']('change_loader_info', f => {
              this['mode'] = f['mode'] || 'loader',
                this['text'] = this['lang'](f['text']) || f['text'],
                this['additional_info'] = f['additional_info'],
                this['additional_info']?.['text'] && (this['additional_info']['text'] = this['lang'](this[
                  'additional_info']['text']) || this['additional_info']['text']),
                this['show'] = f['show'] || 1;
            });
        },
        'methods': {
          'init'() {
            this['show'] = 1;
          },
          'close_modal'() {
            this['show'] = 0;
          },
          'click_outside': function(f) {
            f['target'] == this['$refs']['wrapper'] && 'function' == typeof this['no_callback'] && (this[
                'no_callback'](),
              this['no_callback'] = null,
              this['show'] = 0);
          },
          'lang': function(f) {
            return this['$root']['lang'](f);
          }
        }
      });
  }),
  interface_components_init.push(function() {
    Vue['component']('model_material_picker', {
      'template': '#model_material_picker_template',
      'props': {
        'method': {
          'type': String,
          'default': 'global'
        },
        'mode': {
          'type': String,
          'default': 'c'
        },
        'model_material_key': {
          'type': String,
          'default': ''
        }
      },
      'mixins': [mixin],
      'data': function() {
        return {
          'expanded': false,
          'l_mode': 'c',
          'l_model_mode': '',
          'l_props': {},
          'selected': {},
          'materials': [],
          'material': {}
        };
      },
      'watch': {
        'model_material_key': function() {
          this['init']();
        }
      },
      'created': function() {
        this['init']();
      },
      'computed': {},
      'methods': {
        'init'() {
          this['l_mode'] = 'c';
          var f = project_settings['kitchen']['model_materials'],
            g, h, f, j, k, j;
          let l = {};
          'global' == this['method'] && (h = (g = _['find'](pp['libs']['model_materials']['items_arr'], n => n[
                'key'] === this['model_material_key']))?.['mode'],
              f = f?.[g['key']]?.['material'] || {},
              '' + h == '2' && (j = {
                  'categories': g['categories'] || [],
                  'selected': f['id'] || 0,
                  'method': 'single',
                  'height_val': 0,
                  'cokol_as_corpus_val': false,
                  'lib': 'materials',
                  'mode': 'c',
                  'is_nested_picker': true,
                  'is_empty': true
                },
                l = {
                  'name': g['name'] || g['key'] || '',
                  'key': g['key'] || '',
                  'mat_id': parse_int(f['id']),
                  'mat_key': f['key'] || '',
                  'mode': '' + h,
                  'props': j
                }),
              '' + h == '3' && (j = {
                  'method': 'single',
                  'mode': 'c',
                  'show_butt': 0,
                  'show_fixed': 0,
                  'material_group': {
                    'available': [{
                      'key': f['key'] || '',
                      'name': pp['libs']['materials'][f['key']]?.['get_name']() || '',
                      'categories': [],
                      'thickness': []
                    }],
                    'material': {
                      'av_index': 0,
                      'key': f['key'] || '',
                      'id': parse_int(f['id']),
                      'variant_id': 0
                    },
                    'butt': {}
                  },
                  'mat_group_key': 'model_material',
                  'is_nested_picker': true
                },
                l = {
                  'name': g['name'] || g['key'] || '',
                  'key': g['key'] || '',
                  'mat_id': parse_int(f['id']),
                  'mat_key': f['key'] || '',
                  'mode': '' + h,
                  'props': j
                }),
              this['l_model_mode'] = l['mode'] || '',
              Vue['set'](this, 'material', l),
              Vue['set'](this, 'l_props', copy_object(l['props'] || {}))),
            'single' == this['method'] && (this['l_mode'] = this['mode'] || 'c');
        },
        'click_selected_item'(f) {
          Vue['set'](this, 'l_props', copy_object(f['props'])),
            this['l_model_mode'] = f['mode'],
            this['l_mode'] = 'c';
        },
        'select_item'(f) {
          var g;
          'global' == this['method'] && ('2' === (g = this['l_model_mode']) && (this['material']['props'][
                  'selected'
                ] = parse_int(f['id']),
                this['l_props']['selected'] = parse_int(f['id'])),
              '3' === g && (this['material']['props']['material_group']['material']['id'] = parse_int(f[
                'mat_id']),
                this['material']['props']['material_group']['material']['key'] = f['mat_key'],
                this['l_props']['material_group']['material']['id'] = parse_int(f['mat_id']),
                this['l_props']['material_group']['material']['key'] = f['mat_key']),
              sc['set_model_material'](f, g, this['material']['key'])),
            'single' == this['method'] && this['$emit']('select_item', params);
        }
      }
    });
  }),
  interface_components_init.push(function() {
    Vue['component']('furniture_details', {
        'template': '#furniture_details_template',
        'props': {
          'furniture_data': {
            'type': Object,
            'default': function() {
              return {};
            }
          }
        },
        'mixins': [mixin],
        'data': function() {
          return {
            'expanded': false,
            'l_mode': '',
            'l_selected': 0,
            'types': {},
            'hovered': null,
            'show': false,
            'hovering': false,
            'delay': 200,
            'offset': {
              'left': 0,
              'top': 'auto',
              'bottom': 'auto'
            }
          };
        },
        'watch': {
          'furniture_data': function(f, g) {
            this['types'] = this['furniture_data'];
          }
        },
        'created': function() {
          this['$options']['ad'] = accsessories_data,
            this['types'] = this['furniture_data'],
            this['$options']['elem'] = document['getElementById']('interface'),
            this['$root']['$on']('force_update_selected_furni', () => {
              this['$forceUpdate']();
            });
        },
        'methods': {
          'set_item_select': function(f, g) {
            this['$root']['$emit']('select_single_furni', {
              'key': g,
              'selected': f
            });
          },
          'select_item': function(f, g) {
            this['$root']['$selected_object']['selected_furniture'][f] != g && (this['$root']['$selected_object'][
                'selected_furniture'
              ][f] = g,
              this['$forceUpdate'](),
              this['$root']['$emit']('obj_price_update'));
          },
          'find_item': function(e) {},
          'get_items': function(f, g) {
            var h = copy_object(this['$options']['ad']['types'][g]);
            if (this['types'][g] && this['types'][g]['excluded'] && this['types'][g]['excluded']['length']) {
              for (let i = 0; i < this['types'][g]['excluded']['length']; i++)
                null != h[this['types'][g]['excluded'][i]] && delete h[this['types'][g]['excluded'][i]];
            }
            return h;
          },
          'get_name': function(f, g) {
            switch (g) {
              case 'door':
                return this['lang']('f_door');
              case 'locker':
                return this['lang']('f_locker');
              case 'simple_top':
                return this['lang']('f_simple_top');
              case 'double_top':
                return this['lang']('f_double_top');
              case 'front_top':
                return this['lang']('f_front_top');
              default:
                return this['$options']['ad']['type_names'][g];
            }
          },
          'get_image': function(f) {
            var g, h, i = {},
              f = this['$options']['ad']['items'][f]['images']['split'](',')[0]['trim']();
            return i['background-image'] = '' == f ? 'url(\x22/common_assets/images/no_image.png\x22)' :
              'url(\x22' + f + '\x22)',
              i;
          },
          'check_selected': function(f, g) {
            return this['$root']['$selected_object']['selected_furniture'][f] == g;
          },
          'get_selected': function(e) {
            return this['$root']['$selected_object']['selected_furniture'][e];
          },
          'check_available'(f, g) {
            return !(f['count'] < 1 || null === project_settings['selected_furniture'][g] || null === this[
              '$root']['$selected_object']['params']['selected_furniture'][g] || !this['$options']['ad'][
              'types'][g]);
          },
          'item_price': function(e) {
            return this['lang']('price_per_piece') + ':\x20' + parseFloat(e)['toFixed'](2) + '\x20' + this[
              'lang']('currency');
          },
          'hover'(f, g) {
            let h = this;
            this['hovering'] = true,
              this['hovered'] = f,
              this['get_coords'](g),
              setTimeout(function() {
                h['show'] = h['hovering'];
              }, this['delay']);
          },
          'unhover'() {
            this['hovered'] = null,
              this['hovering'] = false,
              this['show'] = false;
          },
          'get_image_hovered': function(f) {
            var g, h;
            return this['$options']['ad']['items'][f]['images']['split'](',')[0]['trim']();
          },
          'get_coords': function(f) {
            var f = f['target']['getBoundingClientRect'](),
              g = this['$options']['elem']['clientHeight'] / 2;
            f['y'] > g ? (this['offset']['top'] = 'auto',
                this['offset']['bottom'] = 2 * g - f['y'] - f['height']) : (this['offset']['top'] = f['y'],
                this['offset']['bottom'] = 'auto'),
              this['offset']['left'] = f['x'] - 5 - 200;
          },
          'get_position': function(e) {
            return {
              'top': 'auto' == this['offset']['top'] ? 'auto' : this['offset']['top'] + 'px',
              'bottom': 'auto' == this['offset']['bottom'] ? 'auto' : this['offset']['bottom'] + 'px',
              'left': this['offset']['left'] + 'px'
            };
          }
        }
      }),
      Vue['component']('module_furniture', {
        'template': '#module_furniture_template',
        'props': {
          'accessories_list': {
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
            'l_mode': '',
            'l_selected': 0,
            'items': {},
            'hovered': null,
            'show': false,
            'hovering': false,
            'delay': 800,
            'offset': {
              'left': 0,
              'top': 'auto',
              'bottom': 'auto'
            }
          };
        },
        'computed': {
          'computed_items': function() {
            var f = [];
            for (let h = 0; h < this['items']['length']; h++) {
              var g = this['$options']['ad']['items'][this['items'][h]['id']];
              f.push({
                'id': this['items'][h]['id'],
                'c': this['items'][h]['c'],
                'name': g['name'],
                'count': this['items'][h]['count']
              });
            }
            return f;
          }
        },
        'watch': {
          'accessories_list': function(f, g) {
            this['items'] = this['accessories_list'];
          }
        },
        'created': function() {
          this['$options']['ad'] = accsessories_data,
            this['items'] = this['accessories_list'],
            this['$options']['elem'] = document['getElementById']('interface');
        },
        'methods': {
          'add_acc'() {
            this['$parent']['set_accs_component']();
          },
          'item_price': function(e) {
            return this['lang']('price_per_piece') + ':\x20' + format_price(e);
          },
          'count_up'(f, g) {
            var h = this['$root']['$selected_object'],
              f = copy_object(this['$options']['ad']['items'][f]);
            this['$root']['$emit']('add_cart_item', f, 1, h['userData']['params']['obj_id']),
              this['$root']['$emit']('obj_price_update');
          },
          'count_down'(f, g) {
            var g, f;
            1 !== this['items'][g]['count'] && (g = copy_object(this['$options']['ad']['items'][f]),
              f = this['$root']['$selected_object'],
              this['$root']['$emit']('add_cart_item', g, -1, f['userData']['params']['obj_id']),
              this['$root']['$emit']('obj_price_update'));
          },
          'toggle_comments'(f, g) {
            var h = this['$root']['$selected_object'],
              j;
            0 == this['items'][g]['c'] ? this['items'][g]['c'] = 1 : this['items'][g]['c'] = 0,
              h['params']['accessories_list'][g]['c'] = this['items'][g]['c'];
            let k = 0;
            if (0 < h['params']['accessories_comments']['length']) {
              for (let l = h['params']['accessories_comments']['length'] - 1; - 1 < l; l--) {
                f === h['params']['accessories_comments'][l] && (k = 1,
                  h['params']['accessories_comments']['splice'](l, 1));
              }
              h['params']['accessories_comments_string'] = h['params']['accessories_comments_string']['replace'](
                '\x20\x0a\x20' + accsessories_data['items'][f]['name'], '');
            }
            0 === k && h['params']['accessories_comments']['push'](accsessories_data['items'][f]['id']),
              h['build_comments']();
          },
          'remove_item'(f, g) {
            var h = this['$root']['$selected_object'];
            pp['interface']['root']['remove_accessories']({
                'id': f,
                'name': this['$options']['ad']['items'][f]['name']
              }, h['userData']['params']['obj_id']),
              this['$root']['$emit']('module_panel_set_height');
          },
          'hover'(f, g) {
            let h = this;
            this['hovering'] = true,
              this['hovered'] = f,
              this['get_coords'](g),
              setTimeout(function() {
                h['show'] = h['hovering'];
              }, this['delay']);
          },
          'unhover'() {
            this['hovered'] = null,
              this['hovering'] = false,
              this['show'] = false;
          },
          'get_image_hovered': function(f) {
            var g, h;
            return this['$options']['ad']['items'][f]['images']['split'](',')[0]['trim']();
          },
          'get_coords': function(f) {
            var f = f['target']['getBoundingClientRect'](),
              g = this['$options']['elem']['clientHeight'] / 2;
            f['y'] > g ? (this['offset']['top'] = 'auto',
                this['offset']['bottom'] = 2 * g - f['y'] - f['height']) : (this['offset']['top'] = f['y'],
                this['offset']['bottom'] = 'auto'),
              this['offset']['left'] = f['x'] - 5 - 200;
          },
          'get_position': function(e) {
            return {
              'top': 'auto' == this['offset']['top'] ? 'auto' : this['offset']['top'] + 'px',
              'bottom': 'auto' == this['offset']['bottom'] ? 'auto' : this['offset']['bottom'] + 'px',
              'left': this['offset']['left'] + 'px'
            };
          }
        }
      });
  }),
  interface_components_init.push({
    'id': 'module_menu',
    'fn': function() {
      Vue['component']('module_menu', {
        'template': '#module_menu_template',
        'props': {},
        'mixins': [mixin],
        'data': function() {
          return {
            'item_id': 0,
            'show': false,
            'show_width': true,
            'show_height': true,
            'show_depth': true,
            'panel_showed': 0,
            'selected': null,
            'type': '',
            'icon': '',
            'name': '',
            'code': '',
            'price': '',
            'group': '',
            'comments': '',
            'changed_to_top': false,
            'is_cabinet_new': false,
            'cabinet_materials': {},
            'model_materials': {},
            'selected_variant': 0,
            'variants': [],
            'size': {
              'width': 0,
              'height': 0,
              'depth': 0
            },
            'check_intersections': true,
            'auto_rotation': null,
            'corner_straight': {
              'corner_straight_front_wall_width': 0
            },
            'is_corner_straight': false,
            'corner': {
              'corner_right_wall_width': 0,
              'width2': 0
            },
            'is_corner': false,
            'dsp_thickness_variants': copy_object(project_settings['available_corpus_thickness']),
            'dsp_thickness': 0,
            'has_facades': false,
            'has_lockers': false,
            'has_glass': false,
            'back_wall_active': false,
            'has_furniture': false,
            'price_enabled': true,
            'has_handles': false,
            'has_cornice': false,
            'has_tabletop': false,
            'has_tabletop_v3': false,
            'has_tabletop_plints': false,
            'has_cokol_top': false,
            'has_cokol': false,
            'has_corpus': false,
            'has_sides': false,
            'has_backwall': false,
            'is_draggable': false,
            'pos': {
              'x': false,
              'y': false,
              'z': false
            },
            'has_molded': false,
            'has_shelves_auto': false,
            'glass_shelves': false,
            'has_wallpanel': false,
            'has_washer': false,
            'has_params_blocks': false,
            'params_blocks': [],
            'delay': 'undefined' == typeof input_delay ? 500 : input_delay,
            'debounce': null,
            'current_tab': 'size',
            'core_v2': constructor_settings['core_v2'],
            'current_item': null,
            'current_props': {},
            'shelves_auto_params': {},
            'handles_cn': {},
            'fly_height': 0,
            'acc_props': {
              'mode': 'c',
              'mod_id': null
            },
            'handles_props': {
              'id': 0,
              'size': 0,
              'multiple': 0,
              'mode': 'c',
              'method': 'single',
              'categories': []
            },
            'corpus_props': {
              'categories': [],
              'selected': constructor_settings['core_v2'] ? {
                'key': null,
                'id': null,
                'variant_id': null,
                'mat_lib_id': 0
              } : 0,
              'multiple': 0,
              'method': 'single',
              'lib': 'materials',
              'thickness_val': 0,
              'cabinet_group': '',
              'cabinet_group_data': {}
            },
            'corpus_groups': [],
            'cokol_props': {
              'categories': [],
              'selected': 0,
              'method': 'single',
              'height_val': 0,
              'cokol_as_corpus_val': false
            },
            'tabletop_props': {
              'categories': [],
              'selected': 0,
              'method': 'single',
              'thickness_val': 0,
              'autogen': true,
              'corners_equal': true,
              'mode': 'p',
              'lib': 'tabletop'
            },
            'backwall_props': {
              'categories': [],
              'selected': {
                'id': 0,
                'key': 'type_0'
              },
              'selected2': {
                'id': 0,
                'key': 'type_0'
              },
              'method': 'single',
              'multiple': 0,
              'types_list': []
            },
            'glass_props': {
              'categories': null,
              'selected': 0,
              'lib': 'glass',
              'method': 'single'
            },
            'facade_props': {
              'method': 'object',
              'facades': {
                'top': 0,
                'bottom': 0
              },
              'items': null,
              'categories': [],
              'materials': {},
              'lib': 'facades',
              'multiple': 0,
              'can_facade': 1,
              'can_color': 1,
              'can_style': 1,
              'style': 'full'
            },
            'handle_props_single': {
              'categories': []
            },
            'facade_props_single': {
              'method': 'single',
              'facades': {
                'top': 0,
                'bottom': 0
              },
              'materials': {},
              'lib': 'facades',
              'multiple': 0
            },
            'facade_type_props': {
              'selected': 0,
              'facade': 58,
              'radius': 0,
              'type': 'd',
              'index': 0,
              'sec_index': null
            },
            'furniture_props': {
              'types': {}
            },
            'furni_props': {
              'key': '',
              'selected': '',
              'obj_data': {}
            },
            'lighting_props': {
              'enabled': false,
              'intensity': 0.5
            },
            'side_props': {
              'selected_left': '',
              'selected_right': '',
              'mat_left': 0,
              'mat_right': 0,
              'fac_left': 0,
              'fac_right': 0,
              'is_left': false,
              'is_right': false,
              'style_left': '',
              'style_right': '',
              'facade_id': ''
            },
            'wallpanel_props': {
              'categories': [],
              'selected': 0,
              'multiple': 0,
              'method': 'single',
              'lib': 'materials',
              'emit': true
            },
            'washer_props': {
              'categories': [1, 2],
              'selected': 0,
              'multiple': 0,
              'method': 'single',
              'lib': 'washers',
              'emit': true,
              'selected_smes': 0
            },
            'variables': [],
            'toggles': [],
            'has_toggles': false,
            'cornice_params': {},
            'cokol_top_params': {},
            'tabletop_params': {},
            'tabletop_plints_params': {},
            'cokol_params': {},
            'lockers_extended': false,
            'has_self_materials': false,
            'model_add_materials_props': {},
            'facades_data': [],
            'furniture_data': {},
            'accessories_list': [],
            'show_variants': false,
            'show_size': true,
            'show_distance': true,
            'show_dsp_thickness': false,
            'configurator_params': {},
            'tabs': {
              'size': 1,
              'material': 1,
              'furni': 1,
              'module': 1,
              'lockers': 1,
              'facades': 1,
              'molded': 1,
              'comments': 1,
              'lighting': 1,
              'smes': 0,
              'hierarchy': 0
            },
            'disabled_tabs': {
              'size': 0
            },
            'kitchen_configurator': false,
            'configurator_mode': false,
            'conf_tabs': {
              'common': 1,
              'shelves': 1,
              'doors': 1,
              'lockers': 1
            },
            'conf_tab': 'common'
          };
        },
        'watch': {},
        'created': function() {
          let f = this;
          var g = f['$root']['$selected_object'];
          (this['$root']['$refs']['module_menu'] = this)['$options']['smes_lib'] = smes_lib,
          this['lockers_extended'] = null != default_locker_type,
            0 == constructor_settings['price_enabled'] && (this['price_enabled'] = false),
            this['$options']['comps'] = constructor_settings['components'],
            this['$root']['$on']('accessories_list_update', function() {
              f['check_v2']() || (Vue['set'](f, 'accessories_list', copy_object(f['$root'][
                  '$selected_object'
                ]['params']['accessories_list'])),
                f['set_height']());
            }),
            this['$root']['$on']('module_panel_set_height', function() {
              f['check_v2']() || f['set_height']();
            }),
            this['$root']['$on']('check_glass', function(h) {
              var i;
              f['check_v2']() || (i = f['$root']['$selected_object'],
                f['has_glass'] = i['has_glass'](),
                i['userData']['no_glass'] && (f['has_glass'] = false),
                f['has_glass'] && (f['glass_props']['selected'] = parseInt(i['params']['facade'][
                  'glass'])));
            }),
            this['$root']['$on']('obj_price_update', function(h) {
              f['check_v2']() || (sc['get_price'](),
                f['$root']['$selected_object']['params']['price'] ? f['price'] = format_price(f['$root'][
                  '$selected_object'
                ]['get_price']()) : f['price'] = '-');
            }),
            this['$root']['$on']('module_menu_recalc', function() {
              f['check_v2']() || f['set_height']();
            }),
            this['$root']['$on']('show_object_panel', function(h) {
              f['check_v2']() || (f['show'] = 1,
                'settings' == h && (f['current_tab'] = 'size'),
                'materials' == h && setTimeout(() => {
                  f['current_tab'] = 'material';
                }, 10),
                f['check_tabs']());
            }),
            this['$root']['$on']('set_selected', function(h) {
              if (!f['check_v2']() && (f['set_item'](h),
                  null == h && f['close_all'](),
                  null != f['current_item'])) {
                let i = f['current_item'];
                f['current_item'] = null,
                  Vue['nextTick'](function() {
                    'function' == typeof f['set_' + i + '_component'] && f['set_' + i + '_component']();
                  });
              }
            }),
            this['$root']['$on']('set_item', function(h) {
              f['check_v2']() || f['set_item'](h);
            }),
            this['$root']['$on']('set_module_menu_tab', function(h, i = 0) {
              f['check_v2']() || f['change_tab'](h, i);
            }),
            this['$root']['$on']('select_single_furni', function(h) {
              f['check_v2']() || f['select_single_furni_component'](h['key'], h['selected']);
            }),
            this['$root']['$on']('select_single_facade', function(h) {
              f['check_v2']() || f['set_facades_picker_single_component'](h);
            }),
            this['$root']['$on']('select_single_handle', function(h) {
              f['check_v2']() || f['set_handles_picker_single_component'](h);
            }),
            this['$root']['$on']('select_facade_type', function(h, i = false) {
              f['check_v2']() || f['set_facades_type_picker_component'](h, i);
            }),
            constructor_settings['core_v2'] || this['$root']['$on']('select_cabinet_side', function(h) {
              f['check_v2']() || f['set_side_picker_component'](h);
            });
        },
        'computed': {
          'get_custom_options': function() {
            return this['$root']['$custom_options'];
          },
          'has_tabletop_var': function() {
            var f;
            return !!this['variables'] && !!(f = _['find'](this['variables'], g => '_tbl' === g['key'])) &&
              0 !== f['value'];
          }
        },
        'methods': {
          'check_v2': function() {
            var f = this['$root']['$selected_object'],
              g;
            return f && f['userData']['params'] && 'module' === f['userData']['params']['type'];
          },
          'set_code'(f) {
            this['code'] = f;
          },
          'get_variant_name': function(f) {
            if ('CabinetN' == this['type']) {
              let g;
              switch (constructor_settings['display_sizes']) {
                case 'xyz':
                  g = f['size']['x'] + 'x' + f['size']['y'] + 'x' + f['size']['z'] + '\x20' + this['lang'](
                    'mm');
                  break;
                case 'xzy':
                  g = f['size']['x'] + 'x' + f['size']['z'] + 'x' + f['size']['y'] + '\x20' + this['lang'](
                    'mm');
                  break;
                case 'yxz':
                  g = f['size']['y'] + 'x' + f['size']['x'] + 'x' + f['size']['z'] + '\x20' + this['lang'](
                    'mm');
                  break;
                default:
                  g = f['size']['x'] + 'x' + f['size']['y'] + 'x' + f['size']['z'] + '\x20' + this['lang'](
                    'mm');
              }
              return 1 == constructor_settings['show_modules_names_in_sizes_select'] && (g += '\x20' + f[
                  'name']),
                g;
            } {
              let h = f['width'] + 'x' + f['height'] + 'x' + f['depth'] + '\x20' + this['lang']('mm');
              return 1 == constructor_settings['show_modules_names_in_sizes_select'] && (h += '\x20' + f[
                  'name']),
                h;
            }
          },
          'change_tab': function(f, g = 0) {
            this['current_tab'] = f;
            var h = this['$root']['$selected_object'],
              j, k;
            this['panel_showed'] = g,
              'material' == f && (this['facade_props']['can_facade'] = constructor_settings['components'][
                  'can_facade'
                ],
                this['facade_props']['can_color'] = constructor_settings['components']['can_color']),
              'facade' == f && (j = h['get_facades_by_position'](),
                Vue['set'](this, 'facades_data', h['get_facades_by_position']())),
              'furni' == f && (Vue['set'](this, 'furniture_data', copy_object(h['get_furniture_types_count']
                ())),
                Vue['set'](this, 'accessories_list', copy_object(h['params']['accessories_list']))),
              'molded' == f && this['set_molded'](),
              'module' == f && (k = this)['lockers_extended'],
              this['set_height']();
          },
          'check_tabs': function() {
            var f = this,
              g = (1 != this['disabled_tabs']['size'] && (this['show_variants'] || this['show_size'] ||
                  this['show_distance']) ? this['tabs']['size'] = 1 : this['tabs']['size'] = 0,
                Object['keys'](this['tabs']));
            if (0 == f['tabs'][this['current_tab']]) {
              for (let h = 0; h < g.length; h++)
                if (1 == f['tabs'][g[h]]) {
                  f['change_tab'](g[h]);
                  break;
                }
            } else
              f['change_tab'](this['current_tab']);
          },
          'change_conf_tab': function(f) {
            this['conf_tab'] = f,
              this['set_height']();
          },
          'set_molded': function() {
            var f = this,
              g = this['$root']['$selected_object'],
              h, h, h, h;
            f['has_cornice'] && (h = copy_object(g['params']['cornice']),
                Vue['set'](f, 'cornice_params', {
                  'level': h['level'],
                  'visible': h['visible']
                })),
              f['has_cokol_top'] && (h = copy_object(g['params']['cokol_top']),
                Vue['set'](f, 'cokol_top_params', h)),
              f['has_tabletop_plints'] && (h = copy_object(g['params']['tabletop']['plints']),
                Vue['set'](f, 'tabletop_plints_params', h)),
              f['has_cokol'] && (h = copy_object(g['params']['cokol']),
                Vue['set'](f, 'cokol_params', h));
          },
          'set_height': function() {},
          'find_corpus_item': function(f) {
            constructor_settings['core_v2'] ? this['set_corpus_material_picker_v2_component']() : this[
              'set_corpus_material_picker_component']();
            let g = this;
            Vue['nextTick'](function() {
              g['$refs']['current_comp']['find_item'](g['corpus_props']['selected']);
            });
          },
          'find_corpus_item_in_group': function(f) {
            let g = this,
              h = _['find'](g['corpus_groups'], i => i['group'] === f);
            h && (g['corpus_props']['selected'] = copy_object(h['selected']),
              g['corpus_props']['group'] = h['group'],
              g['corpus_props']['cabinet_group'] = h['cabinet_group'],
              g['corpus_props']['cabinet_group_data'] = copy_object(h['cabinet_group_data']),
              g['set_corpus_material_picker_v2_component'](),
              Vue['nextTick'](function() {
                Vue['nextTick'](function() {
                  g['$refs']['current_comp']['find_item'](h['selected']);
                });
              }));
          },
          'find_wallpanel_item': function(f) {
            this['set_wallpanel_materials_picker_component']();
            let g = this;
            Vue['nextTick'](function() {
              g['$refs']['current_comp']['find_item'](g['wallpanel_props']['selected']);
            });
          },
          'set_wallpanel_materials_picker_component': function() {
            this['panel_showed'] = 1;
            let e = this,
              f = this['$root']['$selected_object'];
            Vue['set'](this, 'current_props', this['wallpanel_props']),
              this['current_item'] = 'material_picker',
              Vue['nextTick'](function() {
                e['$refs']['current_comp'] && (e['$refs']['current_comp']['$off']('change_material'),
                  e['$refs']['current_comp']['$on']('change_material', function(g) {
                    f['change_material'](g['id']),
                      sc['get_price'](),
                      e['wallpanel_props']['selected'] = parseInt(g['id']),
                      e['price'] = format_price(e['$root']['$selected_object']['get_price']());
                  }));
              });
          },
          'show_material_change': function(f, g) {
            this['panel_showed'] = 1;
            let h = this,
              j = this['$root']['$selected_object'];
            var k;
            let l = 0,
              m = 0;
            j['temp_type'] && 'CabinetN' == j['temp_type'] && (l = 1,
                m = 1),
              f['custom'] ? Vue['set'](this, 'current_props', {
                'categories': f['categories'],
                'selected': parseInt(f['id']),
                'multiple': 0,
                'is_group': l,
                'icon_dd_menu': m,
                'method': 'single',
                'lib': 'material',
                'emit': true
              }) : (k = set_obj['materials'][f['key']]['variants'][f['variant']],
                Vue['set'](this, 'current_props', {
                  'categories': k['categories'],
                  'selected': parseInt(f['id']),
                  'multiple': 0,
                  'is_group': l,
                  'icon_dd_menu': m,
                  'method': 'single',
                  'lib': 'material',
                  'emit': true
                })),
              this['current_item'] = 'material_picker',
              Vue['nextTick'](function() {
                h['$refs']['current_comp'] && (h['$refs']['current_comp']['$off']('change_material'),
                  h['$refs']['current_comp']['$on']('change_material', function(n) {
                    h['cabinet_materials'][g]['id'] = parseInt(n['id']),
                      j['change_material'](f['key'], f['group'], n['id']),
                      j['temp_type'] && 'CabinetN' == j['temp_type'] && (sc['get_price'](),
                        h['price'] = format_price(h['$root']['$selected_object']['get_price']()));
                  }),
                  h['$refs']['current_comp']['$off']('change_material_group'),
                  h['$refs']['current_comp']['$on']('change_material_group', function(n) {
                    h['cabinet_materials'][g]['id'] = parseInt(n['id']),
                      j['change_material'](f['key'], f['group'], n['id']);
                    for (let o = d_objects.length; o--;)
                      d_objects[o]['temp_type'] && 'CabinetN' == d_objects[o]['temp_type'] && d_objects[
                        o]['params']['id'] == j['params']['id'] && d_objects[o]['change_material'](f[
                        'key'], f['group'], n['id']);
                    sc['get_price'](),
                      h['price'] = format_price(h['$root']['$selected_object']['get_price']());
                  }));
              });
          },
          'show_model_material_change': function(f, g, h) {
            this['panel_showed'] = 1;
            let j = this,
              k = this['$root']['$selected_object'];
            Vue['set'](this, 'current_props', {
                'categories': h['categories'],
                'selected': parseInt(h['selected']),
                'multiple': 0,
                'method': 'single',
                'lib': 'material',
                'emit': true
              }),
              this['current_item'] = 'material_picker',
              Vue['nextTick'](function() {
                j['$refs']['current_comp'] && (j['$refs']['current_comp']['$off']('change_material'),
                  j['$refs']['current_comp']['$on']('change_material', function(l) {
                    k['change_material_by_path'](f, h['key'], parseInt(l['id'])),
                      sc['get_price'](),
                      j['price'] = format_price(j['$root']['$selected_object']['get_price']());
                  }));
              });
          },
          'get_material_label': function(f) {
            return f['label'] || set_obj['materials'][f['key']]['name'];
          },
          'find_washer_item': function(f) {
            this['set_washer_materials_picker_component']();
            let g = this;
            Vue['nextTick'](function() {
              g['$refs']['current_comp']['l_mode'] = 'c';
            });
          },
          'set_washer_materials_picker_component': function() {
            this['panel_showed'] = 1;
            let e = this,
              f = this['$root']['$selected_object'];
            Vue['set'](this, 'current_props', this['washer_props']),
              this['current_item'] = 'material_picker',
              Vue['nextTick'](function() {
                e['$refs']['current_comp'] && (e['$refs']['current_comp']['$off']('change_material'),
                  e['$refs']['current_comp']['$on']('change_material', function(g) {
                    f['change_material'](g),
                      e['washer_props']['selected'] = parseInt(g['id']);
                  }));
              });
          },
          'find_cokol_item': function(f) {
            this['set_cokol_material_picker_component']();
            let g = this;
            Vue['nextTick'](function() {
              g['$refs']['current_comp']['find_item'](g['cokol_props']['selected']);
            });
          },
          'find_tabletop_item': function(f) {
            this['set_tabletop_picker_component']();
            let g = this;
            Vue['nextTick'](function() {
              g['$refs']['current_comp']['find_item'](g['tabletop_props']['selected']);
            });
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
                      sc['get_price'](),
                      e['tabletop_props']['selected'] = parseInt(g['id']),
                      e['price'] = format_price(e['$root']['$selected_object']['get_price']());
                  }),
                  e['$refs']['current_comp']['$on']('change_thickness', function(g) {
                    f['params']['tabletop']['height'] = parseInt(g),
                      f['build'](),
                      e['price'] = format_price(e['$root']['$selected_object']['get_price']());
                  }));
              });
          },
          'set_tabletop_picker_component': function() {
            if (constructor_settings['tabletop_v2']) {
              let e = this,
                f = this['$root']['$selected_object'];
              this['tabletop_props']['categories'] = null,
                this['tabletop_props']['selected'] = parseInt(e['tabletop_props']['selected']),
                this['tabletop_props']['selected_variant'] = f['params']['tabletop']['tabletop_variant'],
                this['tabletop_props']['lib'] = 'tabletop',
                constructor_settings['core_v2'] && (this['tabletop_props']['selected_plint'] = f['params'][
                    'tabletop'
                  ]['plints_material'],
                  this['tabletop_props']['plint_enabled'] = f['params']['tabletop']['plints_enabled']),
                ce('tprops'),
                Vue['set'](this, 'current_props', this['tabletop_props']),
                this['current_item'] = 'tabletop_picker',
                this['panel_showed'] = 1,
                Vue['nextTick'](function() {
                  e['$refs']['current_comp'] && (e['$refs']['current_comp']['$off']('change_material'),
                    e['$refs']['current_comp']['$off']('change_material_plint'),
                    e['$refs']['current_comp']['$off']('change_material_plint_active'),
                    e['$refs']['current_comp']['$on']('change_material', function(g) {
                      var h;
                      constructor_settings['core_v2'] ? (h = find_selected_variant(g),
                        f['change_tabletop_material_v2'](g['id'], h),
                        sc['get_price'](),
                        e['tabletop_props']['selected'] = parseInt(g['id']),
                        e['price'] = format_price(e['$root']['$selected_object']['get_price']()),
                        f['is_detached_tabletop']() || sc['build_tabletop']()) : (
                        constructor_settings['tabletop_v2'] ? f['change_tabletop_material'](g['id'],
                          find_selected_variant(g)) : (f['change_tabletop_material'](g['id']),
                          sc['get_price']()),
                        e['price'] = format_price(e['$root']['$selected_object']['get_price']()),
                        e['tabletop_props']['selected'] = parseInt(g['id']));
                    }),
                    e['$refs']['current_comp']['$on']('change_material_plint', function(g) {
                      f['change_tabletop_plint_material_v2'](g['id']),
                        e['tabletop_props']['selected_plint'] = parseInt(g['id']),
                        sc['build_bort_v3']();
                    }),
                    e['$refs']['current_comp']['$on']('change_material_plint_active', function(g) {
                      f['set_tabletop_plint_active_v2'](g),
                        e['tabletop_props']['plint_enabled'] = parseInt(g),
                        sc['build_bort_v3']();
                    }));
                });
            } else
              this['set_tabletop_materials_picker_component']();
          },
          'find_material_item': function(f) {
            this['set_materials_picker_component'](f);
            let g = this;
            Vue['nextTick'](function() {
              g['$refs']['current_comp']['find_item'](f['id']);
            });
          },
          'set_materials_picker_component': function(e) {
            this['panel_showed'] = 1;
            let f = this,
              g = this['$root']['$selected_object'];
            Vue['set'](this, 'current_props', {
                'categories': e['data']['materials'],
                'selected': e['id'],
                'method': 'single',
                'emit': true
              }),
              this['current_item'] = 'material_picker',
              Vue['nextTick'](function() {
                f['$refs']['current_comp'] && (f['$refs']['current_comp']['$off']('change_material'),
                  f['$refs']['current_comp']['$on']('change_material', function(h) {
                    g['change_material'](h['id'], e['data']['key']),
                      sc['get_price'](),
                      f['price'] = format_price(f['$root']['$selected_object']['get_price']()),
                      f['model_add_materials_props'][e['data']['key']]['selected'] = h['id'];
                  }));
              });
          },
          'find_glass_item': function(f) {
            this['set_glass_material_picker_component']();
            let g = this;
            Vue['nextTick'](function() {
              g['$refs']['current_comp']['find_item'](g['glass_props']['selected']);
            });
          },
          'find_backwall_item': function(f) {
            this['set_backwall_material_picker_component']();
            let g = this;
            Vue['nextTick'](function() {
              g['$refs']['current_comp']['find_item'](f);
            });
          },
          'find_facade_item': function(f) {
            this['set_facades_picker_component']();
            let g = this;
            Vue['nextTick'](function() {
              g['$refs']['current_comp']['find_item'](f);
            });
          },
          'find_facade_category': function(f) {
            this['set_facades_picker_component']();
            let g = this;
            Vue['nextTick'](function() {
              g['$refs']['current_comp']['find_category'](f);
            });
          },
          'find_facade_material': function(f) {
            this['set_facades_picker_component']();
            let g = this;
            Vue['nextTick'](function() {
              g['$refs']['current_comp']['select_material'](f);
            });
          },
          'get_module_info': function() {
            var f = this['$root']['$selected_object'],
              g;
            'function' == typeof c_module_info ? c_module_info(f) : (g = {
                'name': '',
                'icon': void 0 !== f['params']['icon'] ? f['params']['icon'] : '',
                'code': '',
                'data': copy_object(f['price_description']),
                'total': copy_object(f['params']['price'])
              },
              'Cabinet' === f['type'] && mod_lib['items'][f['params']['id']] && (g['icon'] = mod_lib[
                'items'][f['params']['id']]['icon']),
              'CabinetN' === f['temp_type'] && catalog_lib['items'][f['params']['id']] && (g['icon'] =
                catalog_lib['items'][f['params']['id']]['icon']),
              f['params']['code'] && (g['code'] = f['params']['code']),
              g['name'] = f['params']['name'],
              g['icon'] || (g['icon'] = '/common_assets/images/no_image.png'),
              this['$root']['$emit']('info_modal_show', {
                'heading': this['lang']('module_info'),
                'data': [g]
              }));
          },
          'set_intersection_check': function() {
            var f;
            this['$root']['$selected_object']['set_intersection_check'](this['check_intersections']);
          },
          'set_item': function(f) {
            if (this['is_cabinet_new'] = false,
              this['is_draggable'] = false,
              this['configurator_mode'] = 0,
              null == f)
              this['show'] = false;
            else {
              if (this['check_intersections'] = false,
                'draggable' == f['object_type'] ? f['params'] = f['userData']['params'] : 'function' ==
                typeof f['get_intersection_check'] && (this['check_intersections'] = f[
                  'get_intersection_check']()),
                f['params']) {
                var g = this,
                  j, j, j;
                if (g['item_id'] = f['params']['id'],
                  g['icon'] = '',
                  g['show_dsp_thickness'] = false,
                  g['show_size'] = true,
                  g['show_distance'] = true,
                  g['tabs']['comments'] = 0,
                  g['tabs']['molded'] = 0,
                  g['tabs']['module'] = 0,
                  g['tabs']['furni'] = 0,
                  g['tabs']['material'] = 0,
                  g['tabs']['smes'] = 0,
                  g['tabs']['facade'] = 0,
                  g['tabs']['lockers'] = 0,
                  g['tabs']['lighting'] = 0,
                  g['tabs']['hierarchy'] = 0,
                  g['facade_props']['items'] = null,
                  g['kitchen_configurator'] = 0,
                  1 == custom_settings['lighting'] && (g['lighting_props']['enabled'] = false,
                    g['lighting_props']['intensity'] = 0.5,
                    f['params']['custom_data']) && f['params']['custom_data']['has_light'] && 1 == f[
                    'params']['custom_data']['has_light']['value'] && (g['tabs']['lighting'] = 1),
                  g['has_facades'] = false,
                  g['has_sides'] = false,
                  g['has_corpus'] = false,
                  g['has_tabletop'] = false,
                  g['has_tabletop_v3'] = false,
                  g['has_backwall'] = false,
                  g['has_self_materials'] = false,
                  g['has_handles'] = false,
                  g['has_cornice'] = false,
                  g['has_tabletop_plints'] = false,
                  g['has_cokol_top'] = false,
                  g['has_cokol'] = false,
                  g['has_lockers'] = false,
                  g['has_shelves_auto'] = false,
                  g['glass_shelves'] = false,
                  g['has_params_blocks'] = false,
                  Vue['set'](g, 'variables', []),
                  Vue['set'](g, 'toggles', []),
                  g['has_toggles'] = false,
                  g['has_wallpanel'] = false,
                  g['has_washer'] = false,
                  f) {
                  if (g['type'] = f['temp_type'],
                    g['group'] = f['params']['cabinet_group'],
                    'function' == typeof f['get_price'] && f['get_price'](),
                    f['params']['name'] ? g['name'] = f['params']['name'] : f instanceof DragGroup ? g[
                    'name'] = lang['group'] : g['name'] = 'Модуль',
                    f['params']['params_blocks'] && f['params']['params_blocks']['length'] && (g[
                        'has_params_blocks'] = true,
                      Vue['set'](g, 'params_blocks', copy_object(f['params']['params_blocks_obj']))),
                    f['params']['variants'] ? (g['show_variants'] = true,
                      g['selected_variant'] = f['params']['selected_variant'],
                      g['variants'] = copy_object(f['params']['variants'])) : (g['show_variants'] = false,
                      g['selected_variant'] = 0,
                      g['variants'] = []),
                    f['params']['code'] ? g['code'] = f['params']['code'] : g['code'] = '-',
                    'function' == typeof f['get_code'] && (g['code'] = f['get_code']()),
                    f['params']['comments'] ? this['comments'] = f['params']['comments'] : this['comments'] =
                    '',
                    g['auto_rotation'] = f['params']['hasOwnProperty']('auto_rotation') ? Boolean(f['params'][
                      'auto_rotation'
                    ]) : null,
                    'Draggable' == f['userData']['class'] && (g['is_draggable'] = true,
                      g['show_distance'] = false,
                      f['userData']['params']['spec']['id'] && (catalog_lib['items'][f['userData']['params'][
                        'spec'
                      ]['id']] ? g['icon'] = pp['libs']['catalog']['items'][f['userData']['params']['spec'][
                        'id'
                      ]]['icon'] : g['icon'] = '/common_assets/images/no_image.png'),
                      g['size']['width'] = f['userData']['computed']['size']['x'],
                      g['size']['height'] = f['userData']['computed']['size']['y'],
                      g['size']['depth'] = f['userData']['computed']['size']['z'],
                      g['pos']['x'] = !isNaN(parseInt(f['userData']['params']['size']['x'])),
                      g['pos']['y'] = !isNaN(parseInt(f['userData']['params']['size']['y'])),
                      g['pos']['z'] = !isNaN(parseInt(f['userData']['params']['size']['z'])),
                      Vue['set'](g, 'variables', f['get_variables']())),
                    'CabinetN' === g['type']) {
                    g['is_cabinet_new'] = true,
                      catalog_lib['items'][f['params']['id']] ? g['icon'] = pp['libs']['catalog']['items'][f[
                        'params']['id']]['icon'] : g['icon'] = '/common_assets/images/no_image.png',
                      f['userData']['params']['spec']['comments'] ? this['comments'] = f['userData']['params']
                      ['spec']['comments'] : this['comments'] = '',
                      g['tabs']['comments'] = 1;
                    let B = f['get_materials'](),
                      C = [];
                    Object['keys'](B['cabinet'])['forEach'](E => {
                        C.push(B['cabinet'][E]);
                      }),
                      Object['keys'](B['models'])['forEach'](E => {
                        C.push(B['models'][E]);
                      }),
                      Vue['set'](g, 'cabinet_materials', B['cabinet']),
                      Vue['set'](g, 'model_materials', B['models']),
                      g['has_handles'] = f['userData']['parts']['has_handles'],
                      g['has_handles'] && !f['userData']['params']['spec']['is_fill'] && (j = {
                          'id': f['userData']['params']['spec']['handles']['id'],
                          'size': f['userData']['params']['spec']['handles']['size'],
                          'categories': []
                        },
                        f['userData']['params']['spec']['rest']['handles'] && 'c' == f['userData']['params'][
                          'spec'
                        ]['rest']['handles']['mode'] && (j['categories'] = f['userData']['params']['spec'][
                          'rest'
                        ]['handles']['items']),
                        Vue['set'](g, 'handles_props', j)),
                      0 == constructor_settings['custom_sizes_available'] && (g['show_size'] = 0),
                      f['params']['name'] ? g['name'] = f['params']['name'] : f['params']['spec']['name'] && (
                        g['name'] = f['params']['spec']['name']),
                      f['params']['code'] ? g['code'] = f['params']['code'] : f['params']['spec']['code'] && (
                        g['code'] = f['params']['spec']['code']),
                      'function' == typeof f['get_code'] && (g['code'] = f['get_code']()),
                      f['userData']['parts']['has_facades'] && (g['tabs']['facade'] = 1,
                        g['has_facades'] = 1),
                      g['show_variants'] = true,
                      g['selected_variant'] = f['userData']['params']['spec']['variant'],
                      g['variants'] = copy_object(f['userData']['params']['spec']['variants']),
                      g['show_size'] = f['params']['spec']['rest']['free_size'],
                      g['size']['width'] = f['params']['size']['x'],
                      g['size']['height'] = f['params']['size']['y'],
                      g['size']['depth'] = f['params']['size']['z'],
                      g['tabs']['material'] = 1,
                      g['has_tabletop'] = false,
                      g['has_sides'] = false,
                      g['facade_props']['facades']['top'] = f['userData']['params']['spec']['facades'][
                        'model'],
                      g['facade_props']['facades']['bottom'] = f['userData']['params']['spec']['facades'][
                        'model'
                      ],
                      g['facade_props']['can_style'] = f['userData']['params']['spec']['rest'][
                        'change_facade_types'
                      ],
                      f['userData']['params']['spec']['rest']['facades'] ? g['facade_props']['items'] = f[
                        'userData']['params']['spec']['rest']['facades']['items'] : g['facade_props'][
                      'items'] = null;
                    let D = {};
                    D[f['userData']['params']['spec']['facades']['model']] = {},
                      Object['keys'](f['userData']['params']['spec']['facades']['materials'])['forEach'](
                        function(E) {
                          D[f['userData']['params']['spec']['facades']['model']][E] = {
                            'top': f['userData']['params']['spec']['facades']['materials'][E],
                            'bottom': f['userData']['params']['spec']['facades']['materials'][E]
                          };
                        }),
                      Vue['set'](g['facade_props'], 'materials', D),
                      g['has_corpus'] = 0,
                      Vue['set'](g, 'variables', f['get_variables']());
                  }
                  if ('Cabinet' === g['type']) {
                    g['changed_to_top'] = Boolean(f['params']['changed_to_top']),
                      1 == constructor_settings['components']['kitchen_configurator'] && (g[
                        'kitchen_configurator'] = 1),
                      0 == constructor_settings['custom_sizes_available'] && (g['show_size'] = 0),
                      0 == f['params']['free_size'] && (g['show_size'] = 0),
                      g['tabs']['comments'] = 1,
                      g['tabs']['module'] = 1,
                      g['tabs']['material'] = 1,
                      constructor_settings['core_v2'] && (g['tabs']['hierarchy'] = 1),
                      g['has_corpus'] = true,
                      g['has_backwall'] = 1 == g['$options']['comps']['backwall_material_picker'],
                      g['has_cornice'] = f['userData']['has_cornice'],
                      g['has_tabletop'] = f['userData']['has_tabletop'],
                      g['has_tabletop_plints'] = f['userData']['has_tabletop_plints'],
                      g['has_cokol_top'] = f['userData']['has_cokol_top'],
                      g['has_cokol'] = f['userData']['has_cokol'],
                      g['has_lockers'] = f['userData']['has_lockers'],
                      constructor_settings['core_v2'] && (g['has_cornice'] = g['has_cornice'] && Boolean(_[
                          'get'](f, 'userData.parts.cornice_placer[0]')),
                        g['has_cokol_top'] = false,
                        g['has_cokol'] = false),
                      'common' != f['params']['cabinet']['type'] && 'end_corner_facade' != f['params'][
                        'cabinet'
                      ]['type'] && 'end_radius_facade' != f['params']['cabinet']['type'] || (g[
                        'has_sides'] = true),
                      f['userData']['no_sides'] && (g['has_sides'] = false),
                      constructor_settings['core_v2'] && (g['has_sides'] = false),
                      g['has_sides'] && (g['side_props']['selected_left'] = f['params']['cabinet'][
                          'left_wall'],
                        g['side_props']['selected_right'] = f['params']['cabinet']['right_wall'],
                        g['side_props']['facade_id'] = f['params']['facade']['id'],
                        'common' == f['params']['cabinet']['type'] ? (g['side_props']['is_left'] = true,
                          g['side_props']['is_right'] = true) : 'left' == f['params']['cabinet'][
                          'orientation'] ? (g['side_props']['is_left'] = true,
                          g['side_props']['is_right'] = false) : (g['side_props']['is_left'] = false,
                          g['side_props']['is_right'] = true),
                        1 != f['params']['cabinet']['left_wall'] && (g['side_props']['style_left'] = f[
                            'params']['cabinet']['sides']['left']['style'],
                          g['side_props']['mat_left'] = f['params']['cabinet']['sides']['left']['mat_id'],
                          g['side_props']['fac_left'] = f['params']['cabinet']['sides']['left']['fac_id']),
                        1 != f['params']['cabinet']['right_wall']) && (g['side_props']['style_right'] = f[
                          'params']['cabinet']['sides']['right']['style'],
                        g['side_props']['mat_right'] = f['params']['cabinet']['sides']['right']['mat_id'],
                        g['side_props']['fac_right'] = f['params']['cabinet']['sides']['right']['fac_id']),
                      g['has_lockers'] && (g['tabs']['lockers'] = 1),
                      constructor_settings['furniture_available'] && 0 < Object['keys'](accsessories_data[
                        'types'])['length'] && project_settings['selected_furniture'] && (g['tabs']['furni'] =
                        1,
                        Vue['set'](this, 'furniture_data', copy_object(f['get_furniture_types_count']())),
                        Vue['set'](this, 'accessories_list', copy_object(f['params']['accessories_list'])));
                    var k = {
                        'sections': []
                      },
                      j, q, j, j;
                    if (1 == f['params']['shelves_auto'] && (g['has_shelves_auto'] = true,
                        k['count'] = f['params']['shelves_auto_count']),
                      f['params']['sections']['length'] && 1 != constructor_settings['core_v2'])
                      for (let F = 0; F < f['params']['sections']['length']; F++) {
                        var u = f['params']['sections'][F],
                          v = f['sections']['children'][F]['shelves'];
                        1 == u['shelves_auto'] && (g['has_shelves_auto'] = true,
                          k['sections']['push']({
                            'index': F,
                            'name': u['name'],
                            'count': v['shelves_auto_count']
                          }));
                      }
                    if (1 == f['params']['shelves_glass'] ? g['glass_shelves'] = 1 : g['glass_shelves'] =
                      0,
                      Vue['set'](g, 'shelves_auto_params', k),
                      g['show_dsp_thickness'] = true,
                      f['params']['cabinet'] && (f['params']['cabinet']['width'] ? g['size']['width'] = f[
                          'params']['cabinet']['width'] : g['size']['width'] = 0,
                        f['params']['cabinet']['height'] ? g['size']['height'] = f['params']['cabinet'][
                          'height'
                        ] : g['size']['height'] = 0,
                        f['params']['cabinet']['depth'] ? g['size']['depth'] = f['params']['cabinet'][
                        'depth'] : g['size']['depth'] = 0,
                        f['params']['cabinet']['thickness'] ? g['dsp_thickness'] = f['params']['cabinet'][
                          'thickness'
                        ] : g['dsp_thickness'] = 0,
                        g['is_corner_straight'] = 'corner_straight' == f['params']['cabinet']['type'],
                        g['is_corner_straight'] && (g['corner_straight']['corner_straight_front_wall_width'] =
                          f['params']['cabinet']['corner_straight_front_wall_width']),
                        g['is_corner'] = 'corner' == f['params']['cabinet']['type'] || 'corner_90' == f[
                          'params']['cabinet']['type'],
                        g['is_corner'] && (g['corner']['corner_right_wall_width'] = f['params']['cabinet'][
                            'corner_right_wall_width'
                          ],
                          g['corner']['width2'] = f['params']['cabinet']['width2']),
                        g['back_wall_active'] = f['params']['cabinet']['back_wall']),
                      g['has_facades'] = f['userData']['has_facades'],
                      g['has_facades'] && constructor_settings['components']['can_style'] && (g['tabs'][
                        'facade'
                      ] = 1),
                      g['has_glass'] = f['has_glass'](),
                      f['userData']['no_glass'] && (g['has_glass'] = false),
                      g['has_glass'] && (g['glass_props']['selected'] = parseInt(f['params']['facade'][
                        'glass'])),
                      f['params']['cabinet']['materials'] && f['params']['cabinet']['materials']['length'] ?
                      g['corpus_props']['categories'] = copy_object(f['params']['cabinet']['materials']) : g[
                        'corpus_props']['categories'] = copy_object(project_settings['materials'][g['group']][
                        'corpus'
                      ]),
                      constructor_settings['core_v2']) {
                      var w = [],
                        x, y;
                      for (y of Object['keys'](f['params']['materials'])) {
                        var z = {},
                          A = copy_object(f['params']['materials'][y]);
                        let G = A['id'];
                        'ldsp' === A['key'] && (G = _['get'](pp['libs']['materials'][A['key']]['get_item'](A[
                            'id']), 'params.material', 0)),
                          z['selected'] = {
                            'key': A['key'],
                            'id': A['id'],
                            'variant_id': A['variant_id'],
                            'mat_lib_id': G
                          },
                          z['name'] = _['get'](project_settings['kitchen']['mat_groups'], y + '.name', ''),
                          z['group'] = y,
                          z['cabinet_group'] = f['params']['cabinet_group'],
                          z['cabinet_group_data'] = A,
                          w.push(z);
                      }
                      g['corpus_groups'] = w;
                    } else
                      g['corpus_props']['selected'] = f['params']['cabinet']['material'];
                    g['corpus_props']['thickness_val'] = parseInt(f['params']['cabinet']['thickness']),
                      g['has_cokol'] && (g['cokol_props']['categories'] = copy_object(project_settings[
                          'materials']['cokol']),
                        g['cokol_props']['selected'] = f['params']['cokol']['material'],
                        g['cokol_props']['height_val'] = parseInt(f['params']['cokol']['height'])),
                      g['has_tabletop'] && (constructor_settings['tabletop_v2'] || (g['tabletop_props'][
                          'lib'] = 'materials'),
                        g['tabletop_props']['categories'] = copy_object(project_settings['materials'][
                          'tabletop'
                        ]),
                        g['tabletop_props']['selected'] = constructor_settings['core_v2'] ? parseInt(f[
                          'params']['tabletop']['material']) : parseInt(f['params']['tabletop'][
                          'tabletop_id']),
                        g['tabletop_props']['thickness_val'] = f['params']['tabletop']['height'],
                        g['tabletop_props']['autogen'] = f['params']['tabletop']['autogen'],
                        constructor_settings['core_v2']) && (g['tabletop_props']['selected_plint'] =
                        void 0 !== f['params']['tabletop']['plints_material'] ? parseInt(f['params'][
                          'tabletop'
                        ]['plints_material'], 10) : void 0,
                        g['tabletop_props']['plint_enabled'] = f['params']['tabletop']['plints_enabled'],
                        j = f['userData']['cabinet']) && 1 === j['userData']['children']['length'] &&
                      'CabinetTabletop' === j['userData']['children'][0]['temp_type'] && (j = j['userData'][
                          'children'
                        ][0]['userData']['params']['spec']['type_params'],
                        g['has_tabletop_v3'] = true,
                        g['has_backwall'] = false,
                        g['has_handles'] = false,
                        g['has_corpus'] = false,
                        g['has_sides'] = false,
                        g['show_dsp_thickness'] = false,
                        g['has_cokol'] = false,
                        g['fly_height'] = f['params']['fly_height'],
                        g['tabletop_props']['corners'] = j ? copy_object(j) : void 0,
                        g['tabletop_props']['corners_equal'] = j['corners_equal'],
                        g['tabletop_props']['corners']) && ((j = H => {
                          H['percent'] = false;
                          let I = H['val'];
                          'string' == typeof I && (I['endsWith']('%') ? (I = parseFloat(I['slice'](0, -
                                1)),
                              H['percent'] = true) : I = parseFloat(I)),
                            H['val'] = Number['isFinite'](I) ? I : 0;
                        })(g['tabletop_props']['corners']['c1']),
                        j(g['tabletop_props']['corners']['c2']),
                        j(g['tabletop_props']['corners']['c3']),
                        j(g['tabletop_props']['corners']['c4'])),
                      g['group'],
                      g['has_backwall'] && (g['backwall_props']['categories'] = copy_object(project_settings[
                          'materials'][g['group']]['back_wall_material']),
                        g['backwall_props']['types_list'] = 'materials.' + g['group'] + '.back_wall_material',
                        g['backwall_props']['selected']['id'] = f['params']['cabinet']['back_wall_material'][
                          'id'
                        ],
                        g['backwall_props']['selected']['key'] = f['params']['cabinet']['back_wall_material'][
                          'key'
                        ],
                        g['backwall_props']['selected2']['id'] = f['params']['cabinet']['back_wall_material'][
                          'id'
                        ],
                        g['backwall_props']['selected2']['key'] = f['params']['cabinet']['back_wall_material']
                        ['key']),
                      mod_lib['items'][f['params']['id']] ? g['icon'] = mod_lib['items'][f['params']['id']][
                        'icon'
                      ] : g['icon'] = '/common_assets/images/no_image.png',
                      g['facade_props']['facades']['top'] = f['params']['facade']['id'],
                      g['facade_props']['facades']['bottom'] = f['params']['facade']['id'],
                      g['facade_props']['style'] = f['params']['facade']['type'],
                      g['facade_props']['can_style'] = constructor_settings['components']['can_style'],
                      g['tabs']['molded'] = g['has_cornice'] || g['has_cokol_top'] || g[
                      'has_tabletop_plints'] || g['has_cokol'];
                    let E = {};
                    E[f['params']['facade']['id']] = {},
                      Object['keys'](f['params']['facade']['materials'])['forEach'](function(H) {
                        E[f['params']['facade']['id']][H] = {
                          'top': f['params']['facade']['materials'][H],
                          'bottom': f['params']['facade']['materials'][H]
                        };
                      }),
                      Vue['set'](g['facade_props'], 'materials', E),
                      g['set_molded'](),
                      Vue['set'](g, 'variables', f['get_variables']());
                  }
                  if ('Model' == g['type']) {
                    if (g['icon'] = copy_object(f['params']['icon']),
                      f['userData']['mc']) {
                      g['tabs']['material'] = 1,
                        g['has_self_materials'] = true;
                      let H = {},
                        I = 0;
                      custom_settings['cropper'] && (I = 1),
                        Object['keys'](f['params']['self_additional_materials'])['forEach'](function(J) {
                          1 != f['params']['self_additional_materials'][J]['fixed'] && (H[J] = {
                            'name': f['params']['self_additional_materials'][J]['name'],
                            'key': J,
                            'selected': parseInt(f['params']['self_additional_materials'][J][
                              'selected']),
                            'materials': f['params']['self_additional_materials'][J]['materials'],
                            'method': 'single',
                            'cropper_enabled': I
                          });
                        }),
                        Vue['set'](g, 'model_add_materials_props', H);
                    }
                    f['params']['lighting'] && (g['lighting_props']['enabled'] = f['params']['lighting'][
                          'enabled'
                        ],
                        g['lighting_props']['intensity'] = f['params']['lighting']['intensity']),
                      g['size']['width'] = f['params']['width'],
                      g['size']['height'] = f['params']['height'],
                      g['size']['depth'] = f['params']['depth'];
                  }
                  'Wall_panel' == g['type'] && (g['tabs']['material'] = 1,
                      g['has_wallpanel'] = true,
                      g['wallpanel_props']['categories'] = copy_object(project_settings['materials'][
                        'wall_panel'
                      ]),
                      'object' == typeof f['params']['material'] ? g['wallpanel_props']['selected'] =
                      parseInt(f['params']['material']['id']) : g['wallpanel_props']['selected'] = parseInt(f[
                        'params']['material']),
                      g['size']['width'] = f['params']['width'],
                      g['size']['height'] = f['params']['height'],
                      g['size']['depth'] = f['params']['thickness']),
                    'Washer' == g['type'] && (g['has_washer'] = true,
                      g['tabs']['material'] = 1,
                      (g['tabs']['smes'] = 1) < f['params']['v'] ? (g['washer_props']['selected'] =
                        parseInt(f['params']['material']),
                        g['washer_props']['lib'] = 'materials',
                        0 < (j = libs['washes']['items'][f['params']['id']])['materials']['length'] ? (g[
                            'washer_props']['items'] = copy_object(j['materials']),
                          g['washer_props']['categories'] = []) : (g['washer_props']['items'] = [],
                          g['washer_props']['categories'] = copy_object(j['mat_categories']))) : (g[
                          'washer_props']['lib'] = 'washers',
                        g['washer_props']['categories'] = [1, 2],
                        g['washer_props']['items'] = [],
                        f['params']['material']['id'] ? g['washer_props']['selected'] = f['params'][
                          'material']['id'] : g['washer_props']['selected'] = 1),
                      g['washer_props']['selected_smes'] = f['params']['smes'],
                      g['show_size'] = false,
                      g['show_distance'] = false),
                    'Shaft' == g['type'] && (g['size']['width'] = f['params']['width'],
                      g['size']['height'] = f['params']['height'],
                      g['size']['depth'] = f['params']['depth']),
                    'Shelve' === g['type'] && (g['tabs']['material'] = 1,
                      g['tabs']['molded'] = 1,
                      g['size']['width'] = f['params']['width'],
                      g['size']['height'] = f['params']['height'],
                      g['size']['depth'] = f['params']['thickness'],
                      g['has_corpus'] = true,
                      g['has_cornice'] = true,
                      g['has_tabletop_plints'] = false,
                      g['has_cokol'] = false,
                      g['corpus_props']['categories'] = copy_object(project_settings['materials']['top'][
                        'corpus'
                      ]),
                      g['corpus_props']['selected'] = f['params']['material'],
                      g['corpus_props']['thickness_val'] = parseInt(f['params']['thickness']),
                      g['set_molded']()),
                    'Bardesk' === g['type'] && (g['name'] = 'Столешница',
                      1 == constructor_settings['tabletop_v2'] && (g['name'] = 'bardesk' == f['params'][
                        'name'
                      ] ? 'Столешница' : f['params']['name']),
                      constructor_settings['tabletop_v2'] || (g['tabletop_props']['lib'] = 'materials'),
                      g['tabs']['material'] = 1,
                      g['has_tabletop'] = 1,
                      g['size']['width'] = f['params']['width'],
                      g['size']['height'] = f['params']['height'],
                      g['size']['depth'] = f['params']['depth'],
                      g['show_variants'] = 0,
                      g['has_tabletop']) && (g['tabletop_props']['categories'] = copy_object(project_settings[
                        'materials']['tabletop']),
                      g['tabletop_props']['selected'] = parseInt(f['params']['material']),
                      g['tabletop_props']['thickness_val'] = f['params']['height'],
                      g['fly_height'] = f['params']['fly_height'],
                      g['tabletop_props']['bardesk_type'] = f['params']['bardesk_type'],
                      g['tabletop_props']['corners'] = f['params']['corners'] ? copy_object(f['params'][
                        'corners'
                      ]) : void 0,
                      g['tabletop_props']['corners_equal'] = f['params']['corners_equal'],
                      g['tabletop_props']['corners']) && ((j = J => {
                        J['percent'] = false;
                        let K = J['val'];
                        'string' == typeof K && (K['endsWith']('%') ? (K = parseFloat(K['slice'](0, -
                            1)),
                            J['percent'] = true) : K = parseFloat(K)),
                          J['val'] = Number['isFinite'](K) ? K : 0;
                      })(g['tabletop_props']['corners']['c1']),
                      j(g['tabletop_props']['corners']['c2']),
                      j(g['tabletop_props']['corners']['c3']),
                      j(g['tabletop_props']['corners']['c4'])),
                    f['userData']['toggles'] && f['userData']['toggles']['length'] && (Vue['set'](g,
                        'toggles', copy_object(f['userData']['toggles'])),
                      g['has_toggles'] = true),
                    f['params']['price'] ? g['price'] = format_price(f['get_price']()) : g['price'] = '-',
                    'function' == typeof set_module_menu_item_callback && set_module_menu_item_callback(f, g);
                }
                g['check_tabs'](),
                  g['set_height']();
              }
            }
          },
          'change_toggle'(f) {
            var g = this['$root']['$selected_object'];
            g['change_toggle'](f['_path'], f['value']),
              g['build']();
          },
          'set_draggable_pos'(f, g) {
            clearTimeout(this['debounce']),
              this['debounce'] = setTimeout(() => {
                this['$root']['$selected_object']['change_pos'](f, parseFloat(g['target']['value']));
              }, this['delay']);
          },
          'get_draggable_pos'(f) {
            var g = this['$root']['$selected_object'];
            return g['userData']['computed']['pos'][f] - g['userData']['computed']['size'][f] / 2;
          },
          'change_params_block': function() {
            var f = this['$root']['$selected_object'];
            f['change_params_blocks'](copy_object(this['params_blocks'])),
              sc['get_price'](),
              this['price'] = format_price(f['get_price']());
          },
          'change_shelves_auto': function(f, g = false) {
            var h = this['$root']['$selected_object'],
              i, g;
            false === g ? (h['params']['shelves_auto_count'] = f,
                h['build_shelves']()) : (i = h['params']['sections'][g],
                g = h['sections']['children'][g]['shelves'],
                i['shelves_auto_count'] = f,
                g['shelves_auto_count'] = f,
                h['build_sections']()),
              sc['get_price'](),
              h['params']['price'] ? this['price'] = to_fix2(h['params']['price']) : this['price'] = '-';
          },
          'select_smes': function(f) {
            this['washer_props']['selected_smes'] = f['id'];
            var g = this['$root']['$selected_object'];
            g['params']['smes'] = f['id'],
              g['build_smes']();
          },
          'item_icon': function() {
            var f = {};
            return f['background-image'] = 'url(' + this['icon'] + ')',
              f;
          },
          'change_variant': function() {
            var f = !constructor_settings['core_v2'] && constructor_settings['tabletop_v2'],
              g = this['$root']['$selected_object'],
              h, j;
            let k, l;
            if (f && 'function' == typeof g['find_washers'] && (k = g['params']?.['cabinet']?.['height'],
                l = g['find_washers']()),
              g['set_size_by_index'](this['selected_variant']),
              this['set_item'](g),
              sc['correct_position'](g),
              constructor_settings['core_v2'] && 'Cabinet' === this['type']) {
              var m, j = _['get'](g, 'userData.parts.tabletop');
              if (j && j.length) {
                for (var n of j)
                  n['resize_connects']();
                sc['update_tabletops_connects']();
              }
            }
            f && (Number['isFinite'](k) && l && (j = (g['params']?.['cabinet']?.['height'] - k) / units,
                  Number['isFinite'](j)) && g['translate_washers']({
                  'y': j
                }, l),
                g['check_tabletop_rebuild']) && g['check_tabletop_rebuild']() && sc[
                'build_tabletop_debounced'](),
              'CabinetN' == g['temp_type'] && sc['get_price']();
          },
          'change_size': function() {
            clearTimeout(this['debounce']);
            let e = this;
            this['debounce'] = setTimeout(function() {
              var f = e['$root']['$selected_object'];
              let g;
              switch (e['type']) {
                case 'Cabinet':
                  if (0 < (g = f['params']['sizes_limit'])['min_width'] && e['size']['width'] < g[
                      'min_width'] && (e['size']['width'] = g['min_width']),
                    0 < g['max_width'] && e['size']['width'] > g['max_width'] && (e['size']['width'] =
                      g['max_width']),
                    0 < g['min_height'] && e['size']['height'] < g['min_height'] && (e['size'][
                      'height'] = g['min_height']),
                    0 < g['max_height'] && e['size']['height'] > g['max_height'] && (e['size'][
                      'height'] = g['max_height']),
                    0 < g['min_depth'] && e['size']['depth'] < g['min_depth'] && (e['size']['depth'] =
                      g['min_depth']),
                    0 < g['max_depth'] && e['size']['depth'] > g['max_depth'] && (e['size']['depth'] =
                      g['max_depth']),
                    e['is_corner'] ? (0 < g['min_width'] && e['corner']['width2'] < g['min_width'] && (
                        e['corner']['width2'] = g['min_width']),
                      0 < g['max_width'] && e['corner']['width2'] > g['max_width'] && (e['corner'][
                        'width2'
                      ] = g['max_width']),
                      0 < g['min_depth'] && e['corner']['corner_right_wall_width'] < g['min_depth'] && (
                        e['corner']['corner_right_wall_width'] = g['min_depth']),
                      0 < g['max_depth'] && e['corner']['corner_right_wall_width'] > g['max_depth'] && (
                        e['corner']['corner_right_wall_width'] = g['max_depth']),
                      e['$root']['$selected_object']['set_cabinet_size'](parseInt(e['size']['width']),
                        parseInt(e['size']['height']), parseInt(e['size']['depth']), parseInt(e['corner'][
                          'corner_right_wall_width'
                        ]), parseInt(e['corner']['width2']))) : e['is_corner_straight'] ? e['$root'][
                      '$selected_object'
                    ]['set_cabinet_size'](parseInt(e['size']['width']), parseInt(e['size']['height']),
                      parseInt(e['size']['depth']), parseInt(e['corner_straight'][
                        'corner_straight_front_wall_width'
                      ])) : e['$root']['$selected_object']['set_cabinet_size'](parseInt(e['size'][
                      'width']), parseInt(e['size']['height']), parseInt(e['size']['depth'])),
                    constructor_settings['core_v2']) {
                    var h = e['$root']['$selected_object'],
                      h = _['get'](h, 'userData.parts.tabletop');
                    if (h && h.length) {
                      for (var j of h)
                        j['resize_connects']();
                      sc['update_tabletops_connects']();
                    }
                  }
                  break;
                case 'CabinetN':
                  0 < (g = f['params']['spec']['rest']['size'])['min_x'] && e['size']['width'] < g[
                      'min_x'] && (e['size']['width'] = g['min_x']),
                    0 < g['max_x'] && e['size']['width'] > g['max_x'] && (e['size']['width'] = g[
                      'max_x']),
                    0 < g['min_y'] && e['size']['height'] < g['min_y'] && (e['size']['height'] = g[
                      'min_y']),
                    0 < g['max_y'] && e['size']['height'] > g['max_y'] && (e['size']['height'] = g[
                      'max_y']),
                    0 < g['min_z'] && e['size']['depth'] < g['min_z'] && (e['size']['depth'] = g[
                      'min_z']),
                    0 < g['max_z'] && e['size']['depth'] > g['max_depth'] && (e['size']['depth'] = g[
                      'max_depth']),
                    f['set_size_by_number'](parseInt(e['size']['width']), parseInt(e['size']['height']),
                      parseInt(e['size']['depth']));
                  break;
                case 'Wall_panel':
                  0 < (g = f['params']['sizes_limit'])['min_width'] && e['size']['width'] < g[
                      'min_width'] && (e['size']['width'] = g['min_width']),
                    0 < g['max_width'] && e['size']['width'] > g['max_width'] && (e['size']['width'] =
                      g['max_width']),
                    0 < g['min_height'] && e['size']['height'] < g['min_height'] && (e['size'][
                      'height'] = g['min_height']),
                    0 < g['max_height'] && e['size']['height'] > g['max_height'] && (e['size'][
                      'height'] = g['max_height']),
                    0 < g['min_depth'] && e['size']['depth'] < g['min_depth'] && (e['size']['depth'] =
                      g['min_depth']),
                    0 < g['max_depth'] && e['size']['depth'] > g['max_depth'] && (e['size']['depth'] =
                      g['max_depth']),
                    f['set_size_by_number'](parseInt(e['size']['width']), parseInt(e['size']['height']),
                      parseInt(e['size']['depth']));
                  break;
                case 'Model':
                  f['set_size_by_number'](parseInt(e['size']['width']), parseInt(e['size']['height']),
                    parseInt(e['size']['depth']));
                  break;
                default:
                  f['set_size_by_number'](parseInt(e['size']['width']), parseInt(e['size']['height']),
                    parseInt(e['size']['depth']));
              }
              sc['correct_position'](e['$root']['$selected_object']),
                'CabinetN' == e['$root']['$selected_object']['temp_type'] && sc['get_price'](),
                'function' == typeof e['$root']['$selected_object']['get_price'] && (e['price'] =
                  format_price(e['$root']['$selected_object']['get_price']()));
            }, this['delay']);
          },
          'change_comments': function() {
            let f = this,
              g = this['$root']['$selected_object'];
            this['debounce'] = setTimeout(function() {
              'CabinetN' == g['temp_type'] ? g['set_comments'](f['comments']) : (g['params']['comments'] =
                f['comments'],
                g['build_comments']());
            }, this['delay']);
          },
          'change_dsp_thickness': function() {
            this['$root']['$selected_object']['params']['cabinet']['thickness'] = parseInt(this[
                'dsp_thickness']),
              this['$root']['$selected_object']['build'](),
              sc['get_price'](),
              this['set_item'](this['$root']['$selected_object']);
          },
          'change_glass_shelves': function() {
            this['$root']['$selected_object']['params']['shelves_glass'] = this['glass_shelves'],
              this['$root']['$selected_object']['build_shelves'](),
              sc['get_price'](),
              this['set_item'](this['$root']['$selected_object']);
          },
          'set_side_picker_component': function(f) {
            let g = this;
            this['current_item'] = null,
              1 < f['version'] ? Vue['set'](g, 'current_props', {
                'facade': f['fac_id'],
                'selected_facade': f['fac_id'],
                'selected_mat': f['mat_id'],
                'selected': f['style'],
                'side': f['side']
              }) : Vue['set'](g, 'current_props', {
                'facade': f['facade'],
                'selected': f['style'],
                'side': f['side']
              }),
              this['current_item'] = 'side_type_picker',
              g['panel_showed'] = 1,
              setTimeout(function() {
                g['$refs']['current_comp']['$forceUpdate']();
              }, 100),
              Vue['nextTick'](function() {
                let h = g['$root']['$selected_object'];
                g['$refs']['current_comp'] && (g['$refs']['current_comp']['$off']('change_side'),
                  g['$refs']['current_comp']['$on']('change_side', function(i) {
                    2 == i['version'] ? h['set_side'](i) : ('left' == i['side'] ? (g['side_props'][
                          'selected_left'
                        ] = i['style'],
                        'dsp' == i['style'] ? g['$refs']['selected_side']['l_selected_left'] = true :
                        'simple' == i['style'] ? g['$refs']['selected_side']['l_selected_left'] =
                        'facade_simple' : g['$refs']['selected_side']['l_selected_left'] = 'facade') :
                      (g['side_props']['selected_right'] = i['style'],
                        'dsp' == i['style'] ? (g['$refs']['selected_side']['l_selected_right'] = true,
                          g['$refs']['selected_side']['l_mat_right'] = 0) : 'simple' == i['style'] ?
                        g['$refs']['selected_side']['l_selected_right'] = 'facade_simple' : g['$refs']
                        ['selected_side']['l_selected_right'] = 'facade'),
                      g['$refs']['selected_side']['cr'](),
                      'dsp' == i['style'] ? ('left' == i['side'] ? (h['params']['cabinet'][
                            'left_wall'] = true,
                          g['side_props']['selected_left'] = true) : (h['params']['cabinet'][
                            'right_wall'
                          ] = true,
                          g['side_props']['selected_right'] = true),
                        h['build']()) : 'simple' == i['style'] ? ('left' == i['side'] ? (h['params'][
                            'cabinet'
                          ]['left_wall'] = 'facade_simple',
                          g['side_props']['selected_left'] = 'facade_simple') : (h['params'][
                            'cabinet']['right_wall'] = 'facade_simple',
                          g['side_props']['selected_right'] = 'facade_simple'),
                        h['build']()) : 'left' == i['side'] ? (g['side_props']['selected_left'] =
                        'facade',
                        g['side_props']['style_left'] = i['style'],
                        1 != h['params']['cabinet']['left_wall'] && 'facade_simple' != h['params'][
                          'cabinet'
                        ]['left_wall'] || (h['params']['cabinet']['left_wall'] = 'facade',
                          h['build']()),
                        h['change_facades_style'](i['style'], 'left_wall')) : (g['side_props'][
                          'selected_right'
                        ] = 'facade',
                        g['side_props']['style_right'] = i['style'],
                        1 != h['params']['cabinet']['right_wall'] && 'facade_simple' != h['params'][
                          'cabinet'
                        ]['right_wall'] || (h['params']['cabinet']['right_wall'] = 'facade',
                          h['build']()),
                        h['change_facades_style'](i['style'], 'right_wall')),
                      setTimeout(() => {
                        this['$root']['$emit']('check_glass'),
                          this['$root']['$emit']('obj_price_update');
                      }, 200));
                  }));
              });
          },
          'set_corpus_material_picker_component': function() {
            this['panel_showed'] = 1;
            let e = this;
            Vue['set'](this, 'current_props', this['corpus_props']),
              this['current_item'] = 'corpus_material_picker',
              Vue['nextTick'](function() {
                e['$refs']['current_comp'] && (e['$refs']['current_comp']['$off']('change_material'),
                  e['$refs']['current_comp']['$off']('change_thickness'),
                  e['$refs']['current_comp']['$on']('change_material', function(f) {
                    e['$root']['$selected_object']['change_corpus_material'](f['id']),
                      e['corpus_props']['selected'] = parseInt(f['id']),
                      e['price'] = format_price(e['$root']['$selected_object']['get_price']()),
                      e['$refs']['selected_side'] && e['$refs']['selected_side']['cr']();
                  }),
                  e['$refs']['current_comp']['$on']('change_thickness', function(f) {
                    e['$root']['$selected_object']['params']['cabinet']['thickness'] = parseInt(f),
                      e['$root']['$selected_object']['build'](),
                      e['price'] = format_price(e['$root']['$selected_object']['get_price']());
                  }));
              });
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
                        var g = _['get'](pp['libs']['materials'][f['mat_key']]['get_item'](f[
                            'mat_id']), 'params.material', 0),
                          h = _['find'](e['corpus_groups'], i => i['group'] === f['group_key']);
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
                          e['price'] = format_price(e['$root']['$selected_object']['get_price']());
                      }));
                  });
              });
          },
          'set_cokol_material_picker_component': function() {
            this['panel_showed'] = 1;
            let e = this,
              f = this['$root']['$selected_object'];
            Vue['set'](this, 'current_props', this['cokol_props']),
              constructor_settings['core_v2'] ? this['current_item'] = 'cokol_material_picker_v2' : this[
                'current_item'] = 'cokol_material_picker',
              Vue['nextTick'](function() {
                e['$refs']['current_comp'] && (e['$refs']['current_comp']['$off']('change_height'),
                  e['$refs']['current_comp']['$off']('change_cokol_float'),
                  e['$refs']['current_comp']['$off']('change_material_as_corpus'),
                  e['$refs']['current_comp']['$off']('change_material'),
                  e['$refs']['current_comp']['$on']('change_height', function(g) {
                    f['params']['cokol']['height'] = parseInt(g),
                      f['build'](),
                      e['price'] = format_price(e['$root']['$selected_object']['get_price']());
                  }),
                  e['$refs']['current_comp']['$on']('change_cokol_float', function(g) {
                    f['params']['cokol']['disabled'] = g,
                      f['build_cokol'](),
                      get_total_price_test(),
                      e['price'] = format_price(e['$root']['$selected_object']['get_price']());
                  }),
                  e['$refs']['current_comp']['$on']('change_material', function(g) {
                    constructor_settings['core_v2'] ? f['change_cokol_material_v2'](g) : f[
                        'change_cokol_material'](g['id']),
                      e['cokol_props']['selected'] = parseInt(g['id']),
                      get_total_price_test(),
                      e['price'] = format_price(e['$root']['$selected_object']['get_price']());
                  }),
                  e['$refs']['current_comp']['$on']('change_material_as_corpus', function(g) {
                    f['params']['cabinet']['material'] != f['params']['cokol']['material'] && (f[
                        'change_cokol_material'](f['params']['cabinet']['material']),
                      get_total_price_test(),
                      e['price'] = format_price(e['$root']['$selected_object']['get_price']()));
                  }));
              });
          },
          'set_backwall_material_picker_component': function() {
            this['panel_showed'] = 1;
            let e = this;
            Vue['set'](this, 'current_props', this['backwall_props']),
              this['current_item'] = 'backwall_material_picker',
              Vue['nextTick'](function() {
                e['$refs']['current_comp'] && (e['$refs']['current_comp']['$off']('change_material'),
                  e['$refs']['current_comp']['$on']('change_material', function(f) {
                    e['backwall_props']['selected'] = {
                        'id': f['item']['id'],
                        'key': f['key']
                      },
                      e['$root']['$selected_object']['change_back_wall_material']({
                        'id': f['item']['id'],
                        'key': f['key']
                      }),
                      e['price'] = format_price(e['$root']['$selected_object']['get_price']());
                  }));
              });
          },
          'set_glass_material_picker_component': function() {
            this['panel_showed'] = 1;
            let e = this,
              f = this['$root']['$selected_object'];
            Vue['set'](this, 'current_props', this['glass_props']),
              this['current_item'] = 'glass_material_picker',
              Vue['nextTick'](function() {
                e['$refs']['current_comp'] && (e['$refs']['current_comp']['$off']('change_material'),
                  e['$refs']['current_comp']['$on']('change_material', function(g) {
                    e['glass_props']['selected'] = parseInt(g['id']),
                      f['change_glass_material'](g['id']),
                      e['price'] = format_price(e['$root']['$selected_object']['get_price']());
                  }));
              });
          },
          'select_single_furni_component': function(f, g) {
            this['panel_showed'] = 1;
            let h = this;
            h['furni_props']['c_key'] = f,
              h['furni_props']['selected'] = g;
            var g = h['$root']['$selected_object'];
            g['params']['accessories_types'] && g['params']['accessories_types'][f] && (h['furni_props'][
                'obj_data'
              ] = copy_object(g['params']['accessories_types'][f])),
              Vue['set'](this, 'current_props', this['furni_props']),
              this['current_item'] = 'furniture_picker_single',
              Vue['nextTick'](function() {
                h['$refs']['current_comp']['set_panel_height']();
                let i = h['$root']['$selected_object'];
                h['$refs']['current_comp']['$off']('select_furni_single'),
                  h['$refs']['current_comp']['$on']('select_furni_single', function(j) {
                    i['selected_furniture'][j['key']] != j['id'] && (i['selected_furniture'][j['key']] =
                      j['id'],
                      this['$root']['$emit']('obj_price_update'),
                      this['$root']['$emit']('force_update_selected_furni'));
                  });
              });
          },
          'set_facades_picker_component': function() {
            this['panel_showed'] = 1;
            let e = this;
            e['facade_props']['can_facade'] = constructor_settings['components']['can_facade'],
              e['facade_props']['can_color'] = constructor_settings['components']['can_color'],
              e['facade_props']['can_style'] = constructor_settings['components']['can_style'],
              Vue['set'](this, 'current_props', this['facade_props']),
              this['current_item'] = 'facades_picker',
              Vue['nextTick'](function() {
                let f = e['$root']['$selected_object'];
                e['$refs']['current_comp'] && (e['$refs']['current_comp']['$off']('change_facade'),
                  e['$refs']['current_comp']['$off']('change_material'),
                  e['$refs']['current_comp']['$on']('change_facade', function(g) {
                    f['change_facade_style'](g['id']),
                      e['facade_props']['facades']['top'] = parseInt(g['id']),
                      e['facade_props']['facades']['bottom'] = parseInt(g['id']);
                    let h = {};
                    h[g['id']] = {},
                      'CabinetN' === e['type'] ? Object['keys'](f['userData']['params']['spec'][
                        'facades'
                      ]['materials'])['forEach'](function(j) {
                        h[g['id']][j] = {
                          'top': f['userData']['params']['spec']['facades']['materials'][j],
                          'bottom': f['userData']['params']['spec']['facades']['materials'][j]
                        };
                      }) : Object['keys'](f['params']['facade']['materials'])['forEach'](function(j) {
                        h[g['id']][j] = {
                          'top': f['params']['facade']['materials'][j],
                          'bottom': f['params']['facade']['materials'][j]
                        };
                      }),
                      Vue['set'](e['facade_props'], 'materials', h),
                      sc['get_price'](),
                      e['price'] = format_price(e['$root']['$selected_object']['get_price']());
                  }),
                  e['$refs']['current_comp']['$on']('change_material', function(g) {
                    f['change_facade_material_new'](g['id'], g['key'], g['mat_id'], e['group']),
                      Vue['set'](e['facade_props']['materials'][g['id']], g['key'], {
                        'top': g['mat_id'],
                        'bottom': g['mat_id']
                      }),
                      e['price'] = format_price(e['$root']['$selected_object']['get_price']());
                  }));
              });
          },
          'set_facades_picker_single_component': async function(e) {
            let f = this['$root']['$selected_object'],
              g = this,
              h = (this['current_item'] = null,
                await Vue['nextTick'](),
                g['facade_props_single']['facades']['mode'] = 'p',
                g['facade_props_single']['facades']['top'] = parseInt(e['params']['facade']),
                g['facade_props_single']['facades']['bottom'] = parseInt(e['params']['facade']),
                g['facade_props_single']['can_facade'] = constructor_settings['components']['can_facade'],
                g['facade_props_single']['can_color'] = constructor_settings['components']['can_color'], {});
            h[e['params']['facade']] = {
                'gen': {
                  'top': parseInt(e['params']['material']),
                  'bottom': parseInt(e['params']['material'])
                }
              },
              'cabinet_cn' == f['params']['object_type'] && (f['userData']['params']['spec']['rest'][
                'facades'] ? g['facade_props_single']['items'] = f['userData']['params']['spec']['rest'][
                'facades'
              ]['items'] : g['facade_props_single']['items'] = null),
              Object['keys'](e['params']['additional_materials'])['forEach'](function(j) {
                h[e['params']['facade']][j] = {
                  'top': e['params']['additional_materials'][j],
                  'bottom': e['params']['additional_materials'][j]
                };
              }),
              Vue['set'](g['facade_props_single'], 'materials', h),
              g['panel_showed'] = 1,
              Vue['set'](g, 'current_props', g['facade_props_single']),
              g['current_item'] = 'facades_picker',
              await Vue['nextTick'](),
              g['$refs']['current_comp'] && (g['$refs']['current_comp']['$off']('change_facade_single'),
                g['$refs']['current_comp']['$off']('change_material_single'),
                g['$refs']['current_comp']['$on']('change_facade_single', function(j) {
                  let k, l = (k = e['path'] ? f['change_facade_single'](j['id'], e['path']) : f[
                      'change_facade_style_single'](j['id'], e['type'], e['index'], e['sec_index']),
                    g['facade_props_single']['facades']['top'] = parseInt(j['id']),
                    g['facade_props_single']['facades']['bottom'] = parseInt(j['id']),
                    e['params']['facade'] = parseInt(j['id']),
                    e['params']['material'] = k['material'],
                    e['params']['additional_materials'] = k['additional_materials'], {});
                  l[j['id']] = {
                      'gen': {
                        'top': parseInt(k['material']),
                        'bottom': parseInt(k['material'])
                      }
                    },
                    Object['keys'](k['additional_materials'])['forEach'](function(m) {
                      l[j['id']][m] = {
                        'top': parseInt(k['additional_materials'][m]),
                        'bottom': parseInt(k['additional_materials'][m])
                      };
                    }),
                    Vue['set'](g['facade_props_single'], 'materials', l),
                    g['price'] = format_price(g['$root']['$selected_object']['get_price']());
                }),
                g['$refs']['current_comp']['$on']('change_material_single', function(j) {
                  e['path'] ? f['change_facade_material_single']({
                      'key': j['key'],
                      'id': j['mat_id']
                    }, e['path']) : f['change_facade_material_single_new']({
                      'key': j['key'],
                      'id': j['mat_id']
                    }, e['type'], e['index'], e['sec_index']),
                    g['facade_props_single']['materials'][j['id']][j['key']]['top'] = parseInt(j['mat_id']),
                    g['facade_props_single']['materials'][j['id']][j['key']]['bottom'] = parseInt(j[
                      'mat_id']),
                    'gen' == j['key'] ? e['params']['material'] = parseInt(j['mat_id']) : e['params'][
                      'additional_materials'
                    ][j['key']] = parseInt(j['mat_id']),
                    g['price'] = format_price(g['$root']['$selected_object']['get_price']());
                }));
          },
          'set_handles_picker_single_component': async function(f) {
            let g = this['$root']['$selected_object'],
              h = this;
            this['current_item'] = null,
              await Vue['nextTick']();
            var j = [];
            for (let k = 0; k < handles_lib['tree']['length']; k++)
              j.push(handles_lib['tree'][k]['id']);
            h['handle_props_single']['categories'] = j,
              h['handle_props_single']['mode'] = 'c',
              h['handle_props_single']['multiple'] = 0,
              h['handle_props_single']['method'] = 'single',
              h['panel_showed'] = 1,
              Vue['set'](h, 'current_props', h['handle_props_single']),
              h['current_item'] = 'handles_picker',
              await Vue['nextTick'](),
              h['$refs']['current_comp'] && (h['$refs']['current_comp']['$off']('change_handle_single'),
                h['$refs']['current_comp']['$on']('change_handle_single', function(l) {
                  var l = {
                    'id': l['id'],
                    'size': l['size']
                  };
                  g['change_handle_model_single'](l, f['type'], f['index'], f['sec_index']),
                    Vue['set'](h, 'facades_data', g['get_facades_by_position']());
                }));
          },
          'set_handles_picker_single_component_cn': async function(f, g) {
            let h = this['$root']['$selected_object'];
            var j = this,
              k = (this['current_item'] = null,
                await Vue['nextTick'](),
                []);
            for (let l = 0; l < handles_lib['tree']['length']; l++)
              k.push(handles_lib['tree'][l]['id']);
            j['handle_props_single']['categories'] = k,
              j['handle_props_single']['mode'] = 'c',
              j['handle_props_single']['multiple'] = 0,
              j['handle_props_single']['method'] = 'single',
              j['panel_showed'] = 1,
              Vue['set'](j, 'current_props', j['handle_props_single']),
              j['current_item'] = 'handles_picker',
              await Vue['nextTick'](),
              j['$refs']['current_comp'] && (j['$refs']['current_comp']['$off']('change_handle_single'),
                j['$refs']['current_comp']['$on']('change_handle_single', function(m) {
                  h['userData']['parts']['handle'][g]['userData']['params']['spec']['id'] = m['id'],
                    h['userData']['parts']['handle'][g]['userData']['params']['spec']['size_index'] = m[
                      'size'],
                    h['userData']['parts']['handle'][g]['build_params'](h['userData']['parts']['handle'][g][
                      'userData'
                    ]['params']),
                    h['userData']['parts']['handle'][g]['build'](),
                    h['change_param'](g, 'spec.id', m['id'], false);
                }));
          },
          'set_handles_picker_component_cn': async function(f) {
            let g = this['$root']['$selected_object'],
              h = this;
            this['current_item'] = null,
              await Vue['nextTick'](),
              h['handles_props']['mode'] = 'c',
              h['handles_props']['multiple'] = 0,
              h['handles_props']['method'] = 'single',
              h['panel_showed'] = 1,
              Vue['set'](h, 'current_props', h['handles_props']),
              h['current_item'] = 'handles_picker',
              await Vue['nextTick'](),
              h['$refs']['current_comp'] && (h['$refs']['current_comp']['$off']('change_handle_single'),
                h['$refs']['current_comp']['$on']('change_handle_single', function(i) {
                  g['change_handle'](i['id'], 0),
                    sc['get_price'](),
                    h['price'] = format_price(h['$root']['$selected_object']['get_price']());
                }));
          },
          'set_facades_type_picker_component': function(f, g = false) {
            var h = this;
            this['current_item'] = null,
              g ? (this['facade_type_props']['facade'] = f['id'],
                this['facade_type_props']['radius'] = f['radius'],
                this['facade_type_props']['selected'] = f['style'],
                this['facade_type_props']['item'] = {},
                this['facade_type_props']['all'] = 1) : (this['facade_type_props']['all'] = 0,
                this['facade_type_props']['facade'] = f['params']['facade'],
                this['facade_type_props']['radius'] = f['params']['radius'],
                this['facade_type_props']['selected'] = f['params']['style'],
                this['facade_type_props']['item'] = f,
                this['facade_type_props']['type'] = f['type'],
                this['facade_type_props']['index'] = f['index'],
                this['facade_type_props']['sec_index'] = f['sec_index']),
              Vue['set'](h, 'current_props', this['facade_type_props']),
              this['current_item'] = 'facade_type_picker',
              h['panel_showed'] = 1;
          },
          'set_accs_component': function() {
            var f = this;
            this['current_item'] = null,
              Vue['set'](f, 'current_props', {
                'mode': 'p',
                'mod_id': this['$root']['$selected_object']['params']['obj_id']
              }),
              this['current_item'] = 'cart',
              f['panel_showed'] = 1;
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
          'change_back_wall_active': function() {
            var f = this['$root']['$selected_object'],
              f = (f['params']['cabinet']['back_wall'] = this['back_wall_active'],
                f['change_variables']({
                  'key': '_bw',
                  'value': to_int(this['back_wall_active'])
                }, false),
                f['build'](),
                this);
            f['price'] = format_price(f['$root']['$selected_object']['get_price']());
          },
          'change_cornice': function() {
            var f = this['$root']['$selected_object'],
              g = {
                'front': this['cornice_params']['visible']['front'],
                'left': this['cornice_params']['visible']['left'],
                'right': this['cornice_params']['visible']['right']
              };
            f['set_cornice_active'](g);
          },
          'set_cornice_all': function() {
            change_cornice_active(this['cornice_params']['visible']['front']);
          },
          'change_cokol_top': function() {
            var f = this['$root']['$selected_object'],
              g = {
                'front': this['cokol_top_params']['front'],
                'left': this['cokol_top_params']['left'],
                'right': this['cokol_top_params']['right']
              };
            f['set_cokol_top_active'](g);
          },
          'set_cokol_top_all': function() {
            sc['set_cokol_top_all'](this['cokol_top_params']['front']);
          },
          'change_tabletop_plints': function() {
            var f = this['$root']['$selected_object'],
              g = {
                'back': this['tabletop_plints_params']['back'],
                'left': this['tabletop_plints_params']['left'],
                'right': this['tabletop_plints_params']['right']
              };
            f['set_tabletop_plints_active'](g),
              constructor_settings['core_v2'] && sc['build_tabletop']();
          },
          'set_tabletop_plints_all': function() {
            sc['set_tabletop_plints_all'](this['tabletop_plints_params']['back']),
              constructor_settings['core_v2'] && sc['build_tabletop']();
          },
          'set_tabletop_autogen': function() {
            var f;
            this['$root']['$selected_object']['set_tabletop_autogen'](this['tabletop_props']['autogen']),
              sc['build_tabletop']();
          },
          'change_bardesk_corner': function(e, f, g, h) {
            clearTimeout(this['debounce']);
            let j = this;
            this['debounce'] = setTimeout(function() {
              var k = j['$root']['$selected_object'],
                l = j['tabletop_props']['corners'][e],
                l, m, m, m;
              null === f && (f = l['type']),
                null === g && (g = l['val']),
                null === h && (h = l['percent']),
                constructor_settings['core_v2'] && 'Cabinet' === k['type'] ? ((m = (l = k['userData'][
                    'parts'
                  ]['tabletop'][0])['userData']['params']['spec']['type_params'])[e]['type'] = f,
                  m[e]['val'] = h ? g + '%' : g,
                  (m = k['get_child_by_path'](l['userData']['path'], true)) && ((m = m['spec'][
                      'type_params'
                    ])[e]['type'] = f,
                    m[e]['val'] = h ? g + '%' : g),
                  l['_rebuild'](),
                  sc['build_tabletop']()) : k['change_bardesk_corner'](e, f, h ? g + '%' : g);
            }, this['delay']);
          },
          'set_bardesk_corners_equal': function() {
            var f = this['$root']['$selected_object'],
              g, h;
            constructor_settings['core_v2'] && 'Cabinet' === f['type'] ? ((g = f['userData']['parts'][
                'tabletop'
              ][0])['userData']['params']['spec']['type_params']['corners_equal'] = this['tabletop_props']
              ['corners_equal'],
              (h = f['get_child_by_path'](g['userData']['path'], true)) && (h['spec']['type_params'][
                'corners_equal'
              ] = this['tabletop_props']['corners_equal']),
              g['_rebuild'](),
              sc['build_tabletop']()) : f['set_bardesk_corners_equal'](this['tabletop_props'][
              'corners_equal'
            ]);
          },
          'set_fly_height': function() {
            let e = this,
              f = this['$root']['$selected_object'];
            clearTimeout(this['debounce']),
              this['debounce'] = setTimeout(() => {
                var g = parseInt(e['fly_height']);
                Number['isFinite'](g) && (f['set_fly_height'](g),
                  constructor_settings['core_v2']) && 'Cabinet' === f['type'] && sc['build_tabletop']();
              }, this['delay']);
          },
          'detach_tabletop': function() {
            this['tabletop_props']['autogen'] = false;
            let f = this['$root']['$selected_object'];
            setTimeout(() => {
              ce('dtp'),
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
            var f = this['$root']['$selected_object'];
            f['params'] && f['params']['hasOwnProperty']('auto_rotation') && (f['params']['auto_rotation'] =
              this['auto_rotation'] ? 1 : 0);
          },
          'change_cokol': function(f) {
            var g = this['$root']['$selected_object'],
              f = (pp['interface']['root']['$emit']('change_cabinet_cokol', {
                'obj': g,
                'side': f
              }), {
                'front': this['cokol_params']['visible']['front'],
                'left': this['cokol_params']['visible']['left'],
                'right': this['cokol_params']['visible']['right'],
                'back': this['cokol_params']['visible']['back']
              });
            g['set_cokol_active'](f);
          },
          'set_cokol_all': function() {
            sc['set_cokol_all'](this['cokol_params']['visible']['front']);
          },
          'change_cokol_legs': function() {
            var f = this['$root']['$selected_object'];
            this['cokol_params']['is_cokol_active'] = !this['cokol_params']['is_cokol_active'],
              f['change_cokol_legs'](this['cokol_params']['is_cokol_active']);
          },
          'set_cokol_legs_all': function() {
            sc['set_cokol_legs_all'](this['cokol_params']['is_cokol_active']);
          },
          'change_cokol_disabled': function() {
            var f;
            this['$root']['$selected_object']['change_cokol_disabled'](this['cokol_params']['disabled']);
          },
          'set_cokol_disable_all': function() {
            sc['set_cokol_disable_all'](this['cokol_params']['disabled']);
          },
          'hierarchy_selected': function(f) {
            var g, h;
            this['$refs']['hierarchy_tree_ref'] && (h = (g = this['$refs']['hierarchy_tree_ref']['api'])[
              'getNode'](g['findIndexById'](f)));
          },
          'hierarchy_updated': function(f) {},
          'hierarchy_button_click': function(f) {
            var g, f, h;
            f && f['target'] && this['$refs']['hierarchy_tree_ref'] && (f = (g = this['$refs'][
              'hierarchy_tree_ref'
            ]['api'])['getDataIdAttribute'](f['target'])) && (h = g['getNode'](g['findIndexById'](f)));
          },
          'close_panel': function() {
            this['panel_showed'] = 0,
              this['selected'] = null,
              this['current_item'] = null;
          },
          'close_all': function() {
            this['show'] = false,
              this['close_panel']();
          }
        }
      });
    }
  }),
  interface_components_init.push({
      'id': 'module_menu_v2',
      'fn': function() {
          Vue['component']('module_menu_v2', {
                'template': '#module_menu_v2_template',
                'props': {},
                'mixins': [mixin],
                'data': function() {
                  return {
                    'show': false,
                    'show_variants': false,
                    'resizable_enabled': false,
                    'size_locks': {
                      'x': false,
                      'y': false,
                      'z': false
                    },
                    'is_children': false,
                    'panel_showed': 0,
                    'selected': null,
                    'is_root': true,
                    'minmax': {},
                    'element_type': '',
                    'element_id': '',
                    'icon': '',
                    'name': '',
                    'code': '',
                    'price': '',
                    'group': '',
                    'comments': '',
                    'accessories_list': [],
                    'price_enabled': true,
                    'changed_to_top': false,
                    'cabinet_materials': {},
                    'selected_variant': 0,
                    'variants': [],
                    'variables': [],
                    'toggles': [],
                    'modules': [],
                    'has_toggles': false,
                    'size': {
                      'width': 0,
                      'height': 0,
                      'depth': 0
                    },
                    'pos': {
                      'x': false,
                      'y': false,
                      'z': false
                    },
                    'offset_y': 0,
                    'handles_data': [],
                    'check_intersections': true,
                    'auto_rotation': null,
                    'can_change_tabletop': false,
                    'has_tabletop': false,
                    'has_tabletop_v3': false,
                    'has_tabletop_plints': false,
                    'has_cokol': false,
                    'has_cokol_top': false,
                    'has_cornice': false,
                    'has_facade': false,
                    'has_facade_type': false,
                    'has_facade_type_radius': false,
                    'has_facade_type_side': false,
                    'current_item': null,
                    'current_props': {},
                    'cokol_props': {
                      'categories': [],
                      'selected': 0,
                      'method': 'single',
                      'height_val': 0,
                      'cokol_as_corpus_val': false,
                      'lib': 'cokol',
                      'is_empty': true
                    },
                    'cokol_top_props': {
                      'categories': [],
                      'selected': 0,
                      'method': 'single',
                      'height_val': 0,
                      'cokol_as_corpus_val': false,
                      'lib': 'cokol_top',
                      'is_empty': true
                    },
                    'cornice_props': {
                      'categories': [],
                      'selected': 0,
                      'method': 'single',
                      'height_val': 0,
                      'cokol_as_corpus_val': false,
                      'lib': 'cornice',
                      'is_empty': true
                    },
                    'facade_materials': {},
                    'facade_props': {
                      'categories': [],
                      'selected': 0,
                      'method': 'single',
                      'height_val': 0,
                      'cokol_as_corpus_val': false,
                      'lib': 'facades',
                      'is_empty': true
                    },
                    'facade_material_props': {
                      'categories': [],
                      'selected': 0,
                      'method': 'single',
                      'height_val': 0,
                      'cokol_as_corpus_val': false,
                      'lib': 'materials',
                      'is_empty': true
                    },
                    'facade_type_props': {
                      'selected': 0,
                      'facade': 0,
                      'radius': 0,
                      'type': 'd',
                      'index': 0,
                      'sec_index': null,
                      'all': 0,
                      'item': {},
                      'name': ''
                    },
                    'facade_type_radius_props': {
                      'selected': 0,
                      'facade': 0,
                      'radius': 1,
                      'type': 'd',
                      'index': 0,
                      'sec_index': null,
                      'all': 0,
                      'item': {},
                      'name': ''
                    },
                    'facade_type_side_props': {
                      'selected': 0,
                      'facade': 0,
                      'radius': 0,
                      'filter': null,
                      'type': 'd',
                      'index': 0,
                      'sec_index': null,
                      'all': 0,
                      'item': {},
                      'name': ''
                    },
                    'handles_props': {
                      'id': 0,
                      'size': 0,
                      'multiple': 0,
                      'mode': 'c',
                      'method': 'single',
                      'categories': []
                    },
                    'corpus_props': {
                      'categories': [],
                      'selected': {
                        'key': null,
                        'id': null,
                        'variant_id': null,
                        'mat_lib_id': 0
                      },
                      'multiple': 0,
                      'method': 'single',
                      'lib': 'materials',
                      'thickness_val': 0,
                      'cabinet_group': '',
                      'cabinet_group_data': {}
                    },
                    'corpus_groups_props': {},
                    'corpus_groups': [],
                    'model_materials': [],
                    'butt_props': {
                      'categories': [],
                      'selected': 0,
                      'method': 'single',
                      'mode': 'p',
                      'lib': 'butts.butts'
                    },
                    'tabletop_props': {
                      'categories': null,
                      'selected': 0,
                      'method': 'single',
                      'thickness_val': 0,
                      'autogen': true,
                      'corners_equal': true,
                      'mode': 'p',
                      'lib': 'tabletop'
                    },
                    'tabletop_params': {},
                    'tabletop_plints_params': {},
                    'configurator_params': {},
                    'config_item': null,
                    'current_tab': 'size',
                    'tabs': {
                      'size': 1,
                      'material': 1,
                      'modules': 1,
                      'hierarchy': 1,
                      'comments': 1
                    },
                    'disabled_tabs': {
                      'size': 0
                    },
                    'selected_module_index': null,
                    'delay': 'undefined' == typeof input_delay ? 1000 : input_delay,
                    'debounce': null,
                    'componentKey': 0,
                    'custom_size_items': [],
                    'custom_size_tab_components': []
                  };
                },
                'created': function() {
                  let e = this;
                  this['$root']['$refs']['module_menu_v2'] = this,
                    0 == constructor_settings['price_enabled'] && (this['price_enabled'] = false),
                    constructor_settings['core_v2'] && (this['$root']['$on']('obj_price_update', f => {
                        this['check_v2']() && this['update_price']();
                      }),
                      this['$root']['$on']('show_object_panel', function(f) {
                        e['check_v2']() && (e['show'] = 1,
                          'settings' == f && (e['current_tab'] = 'size'),
                          'materials' == f && setTimeout(() => {
                            e['current_tab'] = 'material';
                          }, 10),
                          e['check_tabs']());
                      }),
                      this['$root']['$on']('set_selected', function(f) {
                        if (e['check_v2']() && (e['close_panel'](),
                            e['set_item'](f),
                            null == f && e['close_all'](),
                            null != e['current_item'])) {
                          let g = e['current_item'];
                          e['current_item'] = null,
                            Vue['nextTick'](function() {
                              'function' == typeof e['set_' + g + '_component'] && e['set_' + g + '_component']();
                            });
                        }
                      }),
                      this['$root']['$on']('set_item', function(f) {
                        e['check_v2']() && e['set_item'](f);
                      }),
                      this['$root']['$on']('set_module_menu_tab', function(f, g = 0) {
                        e['check_v2']() && e['change_tab'](f, g);
                      }),
                      this['$root']['$on']('select_single_handle', function(f) {
                        e['check_v2']() || e['set_handles_picker_single_component'](f);
                      }));
                },
                'computed': {
                  'has_tabletop_var': function() {
                    if (!this['variables'])
                      return false;
                    let f = null;
                    for (var g of this['variables'])
                      if (g['vars'] && (f = _['find'](g['vars'], h => '_tbl' === h['key'])))
                        break;
                    return !!f && 0 !== f['value'];
                  }
                },
