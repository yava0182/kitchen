'template_down': function(a3) {
  var a4 = this['$root']['$selected_object'],
    a5 = -1 === this['item']['spec']['selected_template'];
  a4['userData']['selected_template'] === a3 ? (a4['userData']['selected_template'] = a3 + 1,
      a5 || (this['item']['spec']['selected_template'] = a3 + 1,
        a4['userData']['params']['spec']['selected_template'] = a3 + 1)) : a4['userData']['selected_template'] ===
    a3 + 1 && (a4['userData']['selected_template'] = a3,
      a5 || (this['item']['spec']['selected_template'] = a3,
        a4['userData']['params']['spec']['selected_template'] = a3)),
    this['swap_arr_elements'](this['item']['spec']['templates'], a3, a3 + 1),
    this['swap_arr_elements'](a4['userData']['params']['spec']['templates'], a3, a3 + 1);
},
'edit_template_tree': function(a3) {
  var a4 = this['$root']['$selected_object']; -
  1 !== this['item']['spec']['selected_template'] && a3 == a4['userData']['selected_template'] || (this['item'][
        'spec']['selected_template'] = a3,
      a4['set_template_active'](a3),
      this['reset_tree']()),
    this['change_tab']('tree');
},
'change_def_variant': function() {
  var a3 = this['$root']['$selected_object'],
    a4 = (a3['set_variant_active'](this['item']['spec']['selected_variant'], false),
      a3['userData']['params']['spec']),
    a4 = (this['item']['spec']['selected_variant'] = a4['selected_variant'],
      a3['userData']['params']['size']),
    a3 = this['item']['size'];
  a4 && (a3['x'] = a4['x'],
      a3['y'] = a4['y'],
      a3['z'] = a4['z']),
    this['reset_tree']();
},
'add_variant': function() {
  var a3 = this['$root']['$selected_object'];
  let a4 = {
    'name': '',
    'code': '',
    'price': 0,
    'variables': {},
    'active': 1,
    'accessories': []
  };
  if (0 < this['item']['spec']['variants']['length']) {
    let a5 = this['item']['spec']['variants'][this['item']['spec']['variants']['length'] - 1];
    a4['size'] = {
        'x': a5['size']['x'],
        'y': a5['size']['y'],
        'z': a5['size']['z']
      },
      a4['width'] = a5['size']['x'],
      a4['height'] = a5['size']['y'],
      a4['depth'] = a5['size']['z'],
      a5['variables'] && Object['keys'](a5['variables'])['forEach'](function(a6) {
        a4['variables'][a6] = {
          'value': a5['variables'][a6]['value']
        };
      });
  } else
    a4['size'] = {
      'x': 0,
      'y': 0,
      'z': 0
    },
    a4['width'] = 0,
    a4['height'] = 0,
    a4['depth'] = 0;
  a4['params_item'] = JSON['parse'](JSON['stringify']({})),
    Object['values'](this['$options']['params_hash'])['forEach'](a6 => {
      var a7;
      1 == a6['site'] && (a7 = a4['params_item'],
        'list' == a6['params']['type'] ? a7['p' + a6['id']] = {
          'name': a6['name'],
          'data': a6['params']['options']
        } : a7['p' + a6['id']] = {
          'name': a6['name'],
          'data': a6['params']['default']
        });
    }),
    this['item']['variables']['main'] && Object['keys'](this['item']['variables']['main'])['forEach'](a6 => {
      1 != this['item']['variables']['main'][a6]['variants'] || a4['variables'][a6] || (a4['variables'][a6] = {
        'value': this['item']['variables']['main'][a6]['value']
      });
    }),
    a3['userData']['params']['spec']['variants'] || (a3['userData']['params']['spec']['variants'] = []),
    a3['userData']['params']['spec']['variants']['push'](copy_object(a4)),
    this['item']['spec']['variants']['push'](a4);
},
'get_size_value': function(a3) {
  var a4;
  return void 0 === a3 ? '' : void 0 !== (a4 = pp['temp']['catalog_size_hash'][a3]) ? a4 : a3;
},
'update_size_hash'(a3) {
  let a4 = pp['temp']['catalog_size_hash'],
    a5 = {
      'parent_size': new THREE['Vector3'](),
      'computed': {},
      'variables': pp['variables']['current_hash'] || {},
      'props': {},
      'materials': {},
      'local_parent': {}
    };

  function a6(a7) {
    void 0 !== a7 && isNaN(Number(a7)) && void 0 === a4[a7] && (a4[a7] = comp2(a7, a5));
  }
  a6(a3['x']),
    a6(a3['y']),
    a6(a3['z']);
},
'change_variant': function(a3) {
  let a4 = this;
  clearTimeout(this['debounce']),
    this['debounce'] = setTimeout(function() {
      var a5 = a4['$root']['$selected_object'],
        a6 = copy_object(a4['item']['spec']['variants'][a3]),
        a6, a5;
      a6['width'] = a6['size']['x'],
        a6['height'] = a6['size']['y'],
        a6['depth'] = a6['size']['z'],
        a6['variables'] = fix_json_empty_object(a6['variables']),
        a5['userData']['params']['spec']['variants'][a3] = a6,
        a3 == a4['item']['spec']['selected_variant'] && (a5['set_variant_active'](a4['item']['spec'][
            'selected_variant'
          ], false),
          a4['update_tree_title'](),
          a6 = a5['userData']['params']['size'],
          a5 = a4['item']['size'],
          '' + a6['x'] == '' + a5['x'] && '' + a6['y'] == '' + a5['y'] && '' + a6['z'] == '' + a5['z'] || (a5['x'] =
            a6['x'],
            a5['y'] = a6['y'],
            a5['z'] = a6['z']));
    }, this['delay']);
},
'change_variant_size': function(a3, a4, a5) {
  var a6 = this['item']['spec']['variants'][a3];
  a6 && (a6['size'][a4] = a5,
    this['update_size_hash'](a6['size']),
    this['change_variant'](a3));
},
'change_variant_accessories': function(a3, a4) {
  var a5 = this['$root']['$selected_object'];
  this['item']['spec']['variants'][a3]['accessories'] = a4,
    a5['userData']['params']['spec']['variants'][a3]['accessories'] = copy_object(a4);
},
'change_template_accessories': function(a3, a4) {
  var a5 = this['$root']['$selected_object'];
  this['item']['spec']['templates'][a3]['template']['accessories'] = a4,
    a5['userData']['params']['spec']['templates'][a3]['template']['accessories'] = copy_object(a4);
},
'change_module_accessories': function(a3) {
  var a4;
  this['item']['accessories_default'] = a3,
    this['$root']['$selected_object']['userData']['params']['accessories_default'] = copy_object(a3);
},
'remove_variant': function(a3) {
  var a4 = this['$root']['$selected_object'],
    a3, a4;
  this['item']['spec']['variants']['splice'](a3, 1),
    a4['userData']['params']['spec']['variants']['splice'](a3, 1),
    this['item']['spec']['variants'][this['item']['spec']['selected_variant']] || (this['item']['spec'][
        'selected_variant'
      ] = 0,
      a4['set_variant_active'](this['item']['spec']['selected_variant'], false),
      a3 = a4['userData']['params']['size'],
      a4 = this['item']['size'],
      '' + a3['x'] == '' + a4['x'] && '' + a3['y'] == '' + a4['y'] && '' + a3['z'] == '' + a4['z']) || (a4['x'] = a3[
        'x'],
      a4['y'] = a3['y'],
      a4['z'] = a3['z']),
    this['update_tree_title']();
},
'variant_up': function(a3) {
  var a4 = this['$root']['$selected_object'];
  this['item']['spec']['selected_variant'] === a3 ? (this['item']['spec']['selected_variant'] = a3 - 1,
      a4['userData']['params']['spec']['selected_variant'] = a3 - 1) : this['item']['spec']['selected_variant'] ===
    a3 - 1 && (this['item']['spec']['selected_variant'] = a3,
      a4['userData']['params']['spec']['selected_variant'] = a3),
    this['swap_arr_elements'](this['item']['spec']['variants'], a3, a3 - 1),
    this['swap_arr_elements'](a4['userData']['params']['spec']['variants'], a3, a3 - 1);
},
'variant_down': function(a3) {
  var a4 = this['$root']['$selected_object'];
  this['item']['spec']['selected_variant'] === a3 ? (this['item']['spec']['selected_variant'] = a3 + 1,
      a4['userData']['params']['spec']['selected_variant'] = a3 + 1) : this['item']['spec']['selected_variant'] ===
    a3 + 1 && (this['item']['spec']['selected_variant'] = a3,
      a4['userData']['params']['spec']['selected_variant'] = a3),
    this['swap_arr_elements'](this['item']['spec']['variants'], a3, a3 + 1),
    this['swap_arr_elements'](a4['userData']['params']['spec']['variants'], a3, a3 + 1);
},
'check_codes': async function() {
    var a3 = {};
    for (let a9 = 0; a9 < this['item']['spec']['variants']['length']; a9++) {
      var a4 = this['item']['spec']['variants'][a9];
      if ('' !== a4['code']) {
        if (a3[a4['code']])
          return void alert('Найден\x20дубль\x20артикула\x20в\x20текущем\x20модуле');
        a3[a4['code']] = a4['code'];
      }
    }
    if (0 === Object['keys'](a3)['length'])
      alert('Нет\x20ни\x20одного\x20артикула\x20в\x20текущем\x20модуле');
    else {
      var a5 = [],
        a6;
      for (a6 of Object['keys'](catalogs_by_key)) {
        var a7 = catalogs_by_key[a6]['items'];
        for (let aa = 0; aa < a7.length; aa++)
          if ((!item_id || a7[aa]['id'] != item_id) && a7[aa]['params']) {
            var a8 = a7[aa]['params'];
            if (a8 && a8['spec']['variants']) {
              for (let ab = 0; ab < a8['spec']['variants']['length']; ab++)
                a3[a8['spec']['variants'][ab]['code']] && a5.push({
                  'module': a7[aa],
                  'code': a8['spec']['variants'][ab]['code']
                });
            }
          }
      }
      if (a5.length) {
        let ac = 'Артикул\x20существует:\x0a';
        for (let ad = 0; ad < a5.length; ad++)
          ac += 'ID\x20модуля:\x20' + a5[ad]['module']['id'] + '\x20Артикул:\x20' + a5[ad]['code'] + '\x0a';
        alert(ac);
      } else
        alert('Артикулы\x20уникальны');
    }
  },
  'show_var_add': function(a3, a4) {
    if (a3) {
      var a3 = copy_object(a3);
      if (a3['type'] || (a3['type'] = 'number',
          a3['params'] = copy_object(this['$options']['var_params'][a3['type']])),
        a4 && (a3['templates'] = 1),
        void 0 === a3['value']) {
        let a5 = 0;
        'number' === a3['type'] ? a5 = void 0 !== a3['params']['min'] ? a3['params']['min'] : 0 : 'select' === a3[
            'type'] && (a5 = a3['params']['options'][0] || ''),
          a3['value'] = a5;
      }
      Vue['set'](this, 'variable', a3);
    } else
      this['variable']['templates'] = a4 ? 1 : 0;
    this['var_add_vis'] = 1;
  },
  'hide_var_add': function() {
    this['var_add_vis'] = 0,
      Vue['set'](this, 'variable', {
        'name': '',
        'key': '',
        'type': 'number',
        'value': 1,
        'editable': 0,
        'variants': 0,
        'params': {
          'min': 1,
          'max': '',
          'step': 1
        }
      });
  },
  'var_change_name': function() {
    this['variable']['key'] = this['filter_chars'](translit(this['variable']['name'])['toLowerCase']()['replaceAll'](
      '\x20', '_'));
  },
  'var_change_type': function() {
    Vue['set'](this['variable'], 'params', copy_object(this['$options']['var_params'][this['variable']['type']]));
  },
  'var_change_type_tree': function() {
    var a3 = copy_object(this['$options']['var_params'][this['variable_params']['v_type']]),
      a4 = (this['variable_params']['params'] = a3,
        Vue['set'](this['variable_params'], 'params', a3),
        this['$refs']['var_tree_ref']['api']),
      a5 = a4['getSelectedId'](),
      a5 = a4['findIndexById'](a5);
    a4['updateTree'](),
      a4['updateNode'](a5, {
        'v_type': this['variable_params']['v_type'],
        'params': a3
      }),
      this['update_vartree_data']();
  },
  'var_remove_option': function(a3) {
    this['variable']['params']['options']['splice'](a3, 1);
  },
  'var_remove_option_tree': function(a3) {
    this['variable_params']['params']['options']['splice'](a3, 1);
    var a3 = this['$refs']['var_tree_ref']['api'],
      a4 = a3['getSelectedId'](),
      a4 = a3['findIndexById'](a4);
    a3['updateTree'](),
      a3['updateNode'](a4, {
        'params': copy_object(this['variable_params']['params'])
      }),
      this['update_vartree_data']();
  },
  'var_add_option': function() {
    this['variable']['params']['options']['push']({
      'name': '',
      'value': ''
    });
  },
  'var_add_option_tree': function() {
    this['variable_params']['params']['options']['push']({
        'name': '',
        'value': ''
      }),
      this['update_vartree_data']();
  },
  'update_vartree_data': function() {
    var a3 = this['$refs']['var_tree_ref']['api'];
    let a4 = a3['getSelectedId']();
    var a3 = a3['findParentByNodeId'](a4),
      a5 = this['nodes_variable']['find'](a9 => a9['id'] == this['variable_params']['id']),
      a6 = copy_object(q),
      a7 = a5['v_type'],
      a5 = this['variable_params']['params'] || a5['params'];
    if (0 == a3['parent']['level']) {
      var a8 = a6[0]['children']['indexOf'](a6[0]['children']['find'](a9 => a9['id'] == a4));
      a6[0]['children'][a8]['v_type'] = a7,
        a6[0]['children'][a8]['params'] = a5;
    } else {
      let a9 = a3['parent']['id'];
      var a8 = a6[0]['children']['find'](aa => aa['id'] == a9)['children'],
        a3 = a8['indexOf'](a8['find'](aa => aa['id'] == a4));
      a6[0]['children']['find'](aa => aa['id'] == a9)['children'][a3]['v_type'] = a7,
        a6[0]['children']['find'](aa => aa['id'] == a9)['children'][a3]['params'] = a5;
    }
    q = copy_object(a6),
      this['$root']['$vartree_object'] = q,
      this['var_tree_save']();
  },
  'add_variable': function() {
    var a3 = this['$root']['$selected_object'],
      a4 = 1 == this['variable']['templates'],
      a5 = (delete this['variable']['templates'],
        copy_object(this['variable']));
    if (module_utils['change_variables']([this['item'], a3], copy_object(this['variable']), {
        'isTemplate': a4,
        'triggerBuild': false,
        'raiseEvent': false
      }),
      !a4) {
      if (1 == a5['variants']) {
        for (let a7 = 0; a7 < this['item']['spec']['variants']['length']; a7++)
          this['item']['spec']['variants'][a7]['variables'] || (this['item']['spec']['variants'][a7]['variables'] = {}),
          this['item']['spec']['variants'][a7]['variables'][a5['key']] || (this['item']['spec']['variants'][a7][
              'variables'
            ][a5['key']] = {
              'value': a5['value']
            },
            a3['userData']['params']['spec']['variants'][a7]['variables'] || (a3['userData']['params']['spec'][
              'variants'
            ][a7]['variables'] = {}),
            a3['userData']['params']['spec']['variants'][a7]['variables'][a5['key']] = {
              'value': a5['value']
            });
      } else {
        for (let a8 = 0; a8 < this['item']['spec']['variants']['length']; a8++)
          this['item']['spec']['variants'][a8]['variables'] && this['item']['spec']['variants'][a8]['variables'][a5[
            'key']] && (delete this['item']['spec']['variants'][a8]['variables'][a5['key']],
            a3['userData']['params']['spec']['variants'][a8]['variables']) && delete a3['userData']['params']['spec'][
            'variants'
          ][a8]['variables'][a5['key']];
      }
    }
    if (a4) {
      var a4 = this['item']['spec']['templates'][a3['userData']['selected_template']]['template'],
        a6 = a3['userData']['params']['spec']['templates'][a3['userData']['selected_template']]['template'];
      let a9 = a4['variables'],
        aa = a6['variables'];
      a9 || (a9 = {},
          a4['variables'] = a9),
        aa || (aa = {},
          a6['variables'] = aa),
        a9[a5['key']] = copy_object(a5),
        aa[a5['key']] = copy_object(a5),
        this['templates_vars_hash'][a5['key']] = copy_object(a5);
    }
    module_utils['rebuild_variables'](a3),
      a3['build'](),
      a3['_after_build'](),
      this['hide_var_add']();
  },
  'remove_variable': function(a3, a4, a5 = true) {
    var a6 = this['$root']['$selected_object'];
    if (!a4 && 1 == a3['variants']) {
      for (let a7 = 0; a7 < this['item']['spec']['variants']['length']; a7++)
        this['item']['spec']['variants'][a7]['variables'] && (delete this['item']['spec']['variants'][a7]['variables'][
            a3['key']
          ],
          a6['userData']['params']['spec']['variants'][a7]['variables']) && delete a6['userData']['params']['spec'][
          'variants'
        ][a7]['variables'][a3['key']];
    }
    a4 && this['templates_vars_hash'] && (delete this['templates_vars_hash'][a3['key']],
        this['templates_vars_hash'] = {
          ...this['templates_vars_hash']
        }),
      this['remove_var_from_conditions'](a3['key']),
      module_utils['remove_variable'](this['item'], a3['key'], a5, a4),
      module_utils['remove_variable'](a6, a3['key'], a5, a4),
      this['item']['variables']['main'] = {
        ...this['item']['variables']['main']
      };
  },
  'change_template_variable': function(a3, a4, a5) {
    var a6 = this['$root']['$selected_object'],
      a7 = a5 == a6['userData']['selected_template'],
      a8 = this['item']['spec']['templates'][a5]['template'],
      a5 = (a8['variables'][a3]['value'] = a4,
        a6['userData']['params']['spec']['templates'][a5]['template']);
    a5['variables'] || (a5['variables'] = {}),
      a5['variables'][a3] ? a5['variables'][a3]['value'] = a4 : a5['variables'][a3] = copy_object(a8['variables'][a3]),
      a7 && (module_utils['rebuild_variables'](a6),
        a6['build'](),
        a6['_after_build']());
  },
  'change_variable': function(a3, a4, a5, a6) {
    var a5;
    'number' == a5 ? (clearTimeout(this['debounce']),
      this['debounce'] = setTimeout(() => {
        a6 && (this['templates_vars_hash'][a3]['value'] = a4);
        var a7 = this['$root']['$selected_object'];
        module_utils['change_variables']([this['item'], a7], {
          'key': a3,
          'value': a4
        }, {
          'isTemplate': a6
        });
      }, this['delay'])) : (a6 && (this['templates_vars_hash'][a3]['value'] = a4),
      a5 = this['$root']['$selected_object'],
      module_utils['change_variables']([this['item'], a5], {
        'key': a3,
        'value': a4
      }, {
        'isTemplate': a6
      }));
  },
  'show_var_add_global': function(a3) {
    var a4 = this['$options']['global_vars_hash'][a3],
      a5, a5, a5;
    !a4 || (a5 = _.findIndex(this['item']['variables']['global'], a6 => a6['key'] === a3)) < 0 || (a5 = this[
        'item']['variables']['global'][a5],
      (a5 = {
        'name': a4['name'],
        'key': a3,
        'type': a4['type'],
        'value': a5['value'],
        'editable': a5['editable'],
        'local': a5['local'],
        'fixed': a5['fixed'],
        'variants': 0,
        'params': a4['params'] ? copy_object(a4['params']) : {}
      })['type'] || (a5['type'] = 'number',
        a5['params'] = copy_object(this['$options']['var_params'][a5['type']])),
      a5['params'] || (a5['params'] = copy_object(this['$options']['var_params'][a5['type']])),
      Vue['set'](this, 'variable', a5),
      this['var_add_vis'] = 2);
  },
  'add_global_variable_vis': function() {
    var a3 = {
      'key': this['variable']['key'],
      'value': this['variable']['value'],
      'editable': this['variable']['editable'],
      'local': this['variable']['local'],
      'fixed': this['variable']['fixed']
    };
    module_utils['change_variables'](this['item'], a3, {
        'isGlobal': true
      }),
      this['sync_global_vars_to_cabinet'](),
      this['hide_var_add']();
  },
  'change_global_variable': function(a3, a4) {
    var a5;
    module_utils['change_variables'](this['item'], {
        'key': a3,
        'value': a4
      }, {
        'isGlobal': true,
        'action': 'update'
      }),
      clearTimeout(this['debounce']),
      this['debounce'] = setTimeout(() => {
        this['sync_global_vars_to_cabinet']();
      }, this['delay']);
  },
  'add_global_variable': function(a3) {
    var a4;
    module_utils['change_variables'](this['item'], {
        'key': a3,
        'value': null,
        'editable': 0,
        'local': 0,
        'fixed': 0
      }, {
        'isGlobal': true,
        'action': 'add'
      }),
      this['sync_global_vars_to_cabinet']();
  },
  'remove_global_variable': function(a3, a4 = true) {
    var a5 = this['$root']['$selected_object'],
      a6 = {
        'key': a3
      };
    module_utils['change_variables'](this['item'], a6, {
        'isGlobal': true,
        'triggerBuild': a4,
        'action': 'remove'
      }),
      module_utils['change_variables'](a5, a6, {
        'isGlobal': true,
        'triggerBuild': a4,
        'action': 'remove'
      }),
      this['item']['variables']['global']['length'] || (this['item']['variables']['global'] = null),
      this['remove_var_from_conditions'](a3),
      a4 && this['sync_global_vars_to_cabinet']();
  },
  'remove_var_from_conditions'(a3) {
    var a4 = this['$root']['$selected_object'];

    function a5(a6) {
      if (a6['condition']?.['length']) {
        for (let a9 = a6['condition']['length'] - 1; 0 <= a9; a9--) {
          var a7 = a6['condition'][a9],
            a8;
          for (let aa = a7.length - 1; 0 <= aa; aa--) {
            a7[aa]['f'] === 'v:' + a3 && a7['splice'](aa, 1);
          }
          a7.length || a6['condition']['splice'](a9, 1);
        }
        a6['condition']['length'] || (a6['condition'] = null);
      }
    }
    module_utils['walk_params_tree'](this['item'], a5),
      module_utils['walk_params_tree'](a4, a5);
  },
  'reset_global_variable': function(a3) {
    this['variable_params']['value'] = null,
      this['change_var_param']('value', null, {
        'target': {
          'value': null
        }
      }, 'input');
  },
  'select_global_vars'() {
    var a3;
    this['$root']['$selected_object']['_rebuild'](),
      this['change_tab'](this['tab']);
  },
  'sync_global_vars_to_cabinet'() {
    var a3 = this['$root']['$selected_object'];
    a3['userData']['params']['variables']['global'] = this['item']['variables']['global'] ? copy_object(this['item'][
        'variables'
      ]['global']) : null,
      module_utils['rebuild_variables'](a3),
      a3['build'](),
      a3['_after_build']();
  },
  'sync_vars_to_cabinet'() {
    var a3 = this['$root']['$selected_object'];
    a3['userData']['params']['variables']['main'] = this['item']['variables']['main'] ? copy_object(this['item'][
        'variables'
      ]['main']) : {},
      a3['userData']['params']['variables']['global'] = this['item']['variables']['global'] ? copy_object(this['item'][
        'variables'
      ]['global']) : null,
      module_utils['rebuild_variables'](a3),
      a3['build'](),
      a3['_after_build']();
  },
  'change_minmax'() {
    let a3 = this['$root']['$selected_object'];
    clearTimeout(this['debounce']),
      this['debounce'] = setTimeout(() => {
        utils['nested_object']['set'](a3['userData']['params'], 'resizable.minmax', copy_object(this['item'][
          'resizable'
        ]['minmax']));
      }, this['delay']);
  },
  'add_var_override': function() {
    if (this['var_override_add_key'] && (this['current_params']['variables']['override'] || (this['current_params'][
          'variables'
        ]['override'] = {}),
        !(this['var_override_add_key'] in this['current_params']['variables']['override']))) {
      this['current_params']['variables']['override'][this['var_override_add_key']] = '',
        this['var_override_add_key'] = '',
        this['current_params']['variables']['override'] = {
          ...this['current_params']['variables']['override']
        };
      let a3 = this['selected_path'];
      module_utils['change_param_by_path'](this['item'], a3, 'variables.override', copy_object(this['current_params'][
          'variables'
        ]['override'])),
        clearTimeout(this['debounce']),
        this['debounce'] = setTimeout(() => {
          this['recreate_child_in_cabinet'](a3);
        }, this['delay']);
    }
  },
  'remove_var_override': function(a3) {
    if (this['current_params']['variables']['override']) {
      delete this['current_params']['variables']['override'][a3],
        this['current_params']['variables']['override'] = {
          ...this['current_params']['variables']['override']
        };
      let a4 = this['selected_path'];
      module_utils['change_param_by_path'](this['item'], a4, 'variables.override', copy_object(this['current_params'][
          'variables'
        ]['override'])),
        clearTimeout(this['debounce']),
        this['debounce'] = setTimeout(() => {
          this['recreate_child_in_cabinet'](a4);
        }, this['delay']);
    }
  },
  'change_var_override_param': function(a3, a4) {
    let a5 = this['selected_path'];
    utils['nested_object']['set'](this['current_params'], a3, a4),
      module_utils['change_param_by_path'](this['item'], a5, a3, a4, false),
      clearTimeout(this['debounce']),
      this['debounce'] = setTimeout(() => {
        this['recreate_child_in_cabinet'](a5);
      }, this['delay']);
  },
  'add_var_override_root': function() {
    if (this['var_override_add_key'] && (this['item']['variables']['override'] || (this['item']['variables'][
          'override'] = {}),
        !(this['var_override_add_key'] in this['item']['variables']['override']))) {
      this['item']['variables']['override'][this['var_override_add_key']] = '',
        this['var_override_add_key'] = '',
        this['item']['variables']['override'] = {
          ...this['item']['variables']['override']
        };
      let a3 = this['$root']['$selected_object'];
      a3['userData']['params']['variables']['override'] = copy_object(this['item']['variables']['override']),
        clearTimeout(this['debounce']),
        this['debounce'] = setTimeout(() => {
          a3['_rebuild']();
        }, this['delay']);
    }
  },
  'remove_var_override_root': function(a3) {
    if (this['item']['variables']['override']) {
      delete this['item']['variables']['override'][a3],
        this['item']['variables']['override'] = {
          ...this['item']['variables']['override']
        };
      let a4 = this['$root']['$selected_object'];
      a4['userData']['params']['variables']['override'] = copy_object(this['item']['variables']['override']),
        clearTimeout(this['debounce']),
        this['debounce'] = setTimeout(() => {
          a4['_rebuild']();
        }, this['delay']);
    }
  },
  'change_var_override_root': function(a3, a4) {
    this['item']['variables']['override'][a3] = a4,
      this['item']['variables']['override'] = {
        ...this['item']['variables']['override']
      };
    let a5 = this['$root']['$selected_object'];
    a5['userData']['params']['variables']['override'] = copy_object(this['item']['variables']['override']),
      clearTimeout(this['debounce']),
      this['debounce'] = setTimeout(() => {
        a5['_rebuild']();
      }, this['delay']);
  },
  'get_variable_apply_value'(a3) {
    var a4 = this['current_params']?.['variables']['apply'],
      a5 = this['current_params']?.['variables']['main'];
    return a4 && a3 in a4 ? a4[a3] : a5[a3]?.['value'];
  },
  'check_variable_apply'(a3) {
    var a4 = this['current_params']?.['variables']['apply'];
    return a4 && a3 in a4;
  },
  'change_variable_apply'(a3, a4) {
    let a5 = this['selected_path'],
      a6 = this['current_params']?.['variables']['apply'];
    a6 || (a6 = {},
        this['current_params']['variables']['apply'] = a6),
      a6[a3['key']] = a4,
      this['current_params']['variables']['apply'] = {
        ...a6
      },
      clearTimeout(this['debounce']),
      this['debounce'] = setTimeout(() => {
        module_utils['change_param_by_path'](this['item'], a5, 'variables.apply', copy_object(a6)),
          this['recreate_child_in_cabinet'](this['selected_path']);
      }, this['delay']);
  },
  'reset_variable_apply'(a3) {
    let a4 = this['selected_path'],
      a5 = this['current_params']?.['variables']['apply'];
    a5 && (delete a5[a3],
      this['current_params']['variables']['apply'] = {
        ...a5
      },
      this['debounce'] = setTimeout(() => {
        module_utils['change_param_by_path'](this['item'], a4, 'variables.apply', copy_object(a5)),
          this['recreate_child_in_cabinet'](this['selected_path']);
      }, this['delay']));
  },
  'recreate_child_in_cabinet': function(a3) {
    var a4 = this['$root']['$selected_object'],
      a5, a5, a3, a6, a7;
    a3 && ((a5 = this['find_root_fill_content_module_path']()) ? (this['reload_module'](a5),
      this['update_cabinet_size_box']()) : ({
        parentPath: a5,
        child: a3,
        childPath: a6,
        childIndex: a7
      } = module_utils['get_parent_and_child_by_path'](this['item'], a3),
      a5 && a6 && a3 && !(a7 < 0) && (module_utils['remove_child_by_path'](a4, a6, false),
        module_utils['add_child_by_path'](a4, a5, copy_object(a3), a7, false),
        a4['userData']['params']['templates_loaded'] = 0,
        a4['_rebuild'](),
        this['selected_path'] === a6) && this['show_helpers'](a6)));
  },
  'get_facade_id': function(a3) {
    return a3 + '_' + this['current_params']['spec']['id'];
  },
  'get_type_facade': function(a3) {
    let a4 = [];
    var a5 = this['current_params']['spec']['id'],
      a6 = this['current_params']['spec']['radius'],
      a7 = pp['libs']['facades']['items'][a5];
    if (!a7 && !a6)
      return [{
        'comp_id': 'full',
        'comp_name': 'full',
        'type_name': 'Глухой'
      }, {
        'comp_id': 'window',
        'comp_name': 'window',
        'type_name': 'Витрина'
      }, {
        'comp_id': 'frame',
        'comp_name': 'frame',
        'type_name': 'Решетка'
      }];
    if (!a7 && a6)
      return [{
        'comp_id': 'radius',
        'comp_name': 'radius',
        'type_name': 'Радиус\x20глухой'
      }, {
        'comp_id': 'radius_window',
        'comp_name': 'radius_window',
        'type_name': 'Радиус\x20витрина'
      }];
    switch (a3) {
      case 'types':
        var a8 = this['current_params']['spec']['type'],
          a9 = a7['compatibility_types'],
          aa = a7[a3],
          ab = null,
          ac;
        for (ac in a9) {
          if (void 0 === aa[a9[ac]['toString']()])
            break;
          0 === a6 ^ (void 0 === aa[a9[ac]['toString']()]['radius'] || 0 === aa[a9[ac]['toString']()][
            'radius']) || a4.push({
              'comp_id': a9[ac],
              'comp_name': ac,
              'type_name': aa[a9[ac]['toString']()]['name']
            });
        }
        break;
      default:
        a4 = [];
    }
    return a4;
  },
  'get_dynamic_params': function(a3) {
    let a4 = [];
    switch (this['current_params']['type']) {
      case 'facade':
        if (1 == this['current_params']['spec']['handle']['fixed']) {
          if (0 == this['current_params']['spec']['id'])
            return [];
          if (0 == this['current_params']['spec']['handle']['id'])
            return [];
          var a5, a6 = handles_lib['items'][this['current_params']['spec']['handle']['id']][a3];
          for (let a9 = 0; a9 < a6.length; a9++)
            a4.push({
              'val': a9,
              'label': '' != a6[a9]['axis_size'] ? a6[a9]['axis_size'] : a6[a9]['width'] + 'x' + a6[a9]['height'] +
                'x' + a6[a9]['depth']
            });
        } else {
          if (0 == this['current_params']['spec']['id'])
            return [];
          if (0 == this['current_params']['spec']['handle']['id'])
            return [];
          var a7, a8 = handles_lib['items'][this['current_params']['spec']['id']][a3];
          for (let aa = 0; aa < a8.length; aa++)
            a4.push({
              'val': aa,
              'label': '' != a8[aa]['axis_size'] ? a8[aa]['axis_size'] : a8[aa]['width'] + 'x' + a8[aa]['height'] +
                'x' + a8[aa]['depth']
            });
        }
        break;
      default:
        a4 = [];
    }
    return a4;
  },
  'check_param_condition': function(a3) {
    if (!a3['conditions'])
      return true;
    let a4 = true;
    var a5 = module_utils['get_child_params_by_path'](this['item'], this['selected_path']);
    let a6 = this['current_params'];
    'module' === a5['type'] && (a6 = merge(pp['libs']['catalogs'][a5['spec']['element_type']]?.['get_item'](a5['spec'][
        'id'
      ])?.['params'], a5)),
      'furniture' === a5['type'] && (a6 = merge(pp['libs']['furniture']?.['get_item'](a5['spec']['id'])?.['params'],
        a5));
    for (let a8 = 0; a8 < a3['conditions']['length']; a8++) {
      let a9 = a6;
      var a7 = a3['conditions'][a8]['key']['split']('.');
      for (let aa = 0; aa < a7.length; aa++)
        a9 = a9[a7[aa]];
      switch (a3['conditions'][a8]['cond']) {
        case '=':
          a9 != a3['conditions'][a8]['val'] && (a4 = false);
          break;
        case '!=':
          a9 == a3['conditions'][a8]['val'] && (a4 = false);
          break;
      }
    }
    return a4;
  },
  'check_view_mode'(a3) {
    return void 0 === a3['view_mode'] || a3['view_mode'] === this['$options']['view_mode'];
  },
  'add_accessory': function(a3) {
    this['item']['accessories_default'] || Vue['set'](this['item'], 'accessories_default', []);
    let a4 = 0;
    var a5 = this['item']['accessories_default'];
    for (let a6 = 0; a6 < a5.length; a6++)
      a5[a6]['id'] === a3 && (a4 = 1,
        a5[a6]['count']++);
    0 === a4 && a5.push({
      'id': a3,
      'count': 1
    });
  },
  'remove_accessory': function(a3) {
    this['item']['accessories_default']['splice'](a3, 1);
  },
  'add_accessory_type': function(a3) {
    this['accessories_types'][a3] || Vue['set'](this['accessories_types'], a3, {
      'count': 0,
      'excluded': []
    });
  },
  'remove_accessory_type': function(a3) {
    Vue['delete'](this['accessories_types'], a3);
  },
  'acc_exclude': function(a3, a4) {
    var a5 = a3['excluded']['indexOf'](a4['id']); -
    1 < a5 ? a3['excluded']['splice'](a5, 1) : a3['excluded']['push'](a4['id']);
  },
  'correct_type_name': function(a3) {
    return 'door' === a3 ? this['lang']('hinges') : 'locker' === a3 ? this['lang']('hinges_lockers') : 'simple_top' ===
      a3 ? this['lang']('hinges_simple_top') : 'double_top' === a3 ? this['lang']('hinges_double_top') : 'front_top' ===
      a3 ? this['lang']('hinges_front_top') : _['find'](this['$options']['accessories_types'], a4 => a4['key'] ===
        a3, {})['name'];
  },
  'get_animator_fixed_value'(a3, a4) {
    return (a3['spec']['source']['fixed'] || [])['includes'](a4) ? 1 : 0;
  },
  'change_animator_fixed'(a3, a4) {
    let a5 = this['selected_path'],
      a6 = this['$root']['$selected_object'],
      a7 = a3['spec']['source']['fixed'],
      a8 = (a7 || (a7 = [],
          a3['spec']['source']['fixed'] = a7),
        _['remove'](a7, a9 => a9 === a4)['length'] || a7.push(a4),
        this['find_root_fill_content_module_path']());
    module_utils['change_param_by_path'](this['item'], a5, 'spec.source.fixed', copy_object(a7)),
      a8 || module_utils['change_param_by_path'](a6, a5, 'spec.source.fixed', copy_object(a7), false),
      this['debounce'] = setTimeout(() => {
        a8 ? (this['reload_module'](a8),
          this['update_cabinet_size_box']()) : module_utils['rebuild_child_by_path'](a6, a5);
      }, this['delay']);
  },
  'convert_item_path_to_module'(a3) {
    if (!a3 || '0' === a3)
      return '';
    var a4 = this['$root']['$selected_object'],
      a5 = a3.split(',')['slice'](1);
    let a6 = '0',
      a7 = {
        'type': 'root',
        'children': this['item']['spec']['template']['tree']
      },
      a8 = false;
    for (let ac = 0; ac < a5.length; ac++) {
      let ad = a5[ac];
      if ('module' !== a7['type']) {
        if (!(a7 = a7['children']?.[ad])) {
          a8 = true;
          break;
        }
        a6 += ',' + ad;
      } else {
        if (!(a7 = _['find'](Object['values'](a7['spec']?.['fill_content'] || {}), ae => '' + ae['temp_index'] == '' +
            ad))) {
          a8 = true;
          break;
        }
        var a9, aa = ab(module_utils['get_child_params_by_path'](a4, a6), a7['key']);
        if (!aa) {
          a8 = true;
          break;
        }
        a6 += ',' + aa;
      }
    }
    return a8 ? '' : a6;

    function ab(ae, af) {
      return ae && af && ag(ae, '', af, true) || '';

      function ag(ah, ai, aj, ak) {
        if (('section' === ah['type'] || 'fill_section' === ah['type']) && ah['section_key'] === aj)
          return ai;
        if (ak || 'module' !== ah['type']) {
          var al = 'module' === ah['type'] ? ah['spec']?.['template']?.['tree'] : ah['children'];
          if (al?.['length'])
            for (let ao = 0; ao < al.length; ao++) {
              var am, an = ag(al[ao], ai ? ai + ',' + ao : '' + ao, aj);
              if (an)
                return an;
            }
        }
        return null;
      }
    }
  },
  'get_butts_info'(a3) {
    if (!a3 || !a3['spec'] || 'wall' !== a3['type'])
      return [];
    var a4 = this['convert_item_path_to_module'](this['selected_path']),
      a4 = this['$root']['$selected_object']['get_child_by_path'](a4)?.['userData']['computed']['points'];
    let a5 = a3['spec']['butts'],
      a6 = 0;
    return 0 < a4?.['length'] && a4.forEach(a7 => {
        a6++,
        0 < a7['radius'] && a6++;
      }),
      Array.from({
        'length': a6
      }, (a7, a8) => {
        let a9 = _['find'](a5, ab => '' + ab['face_index'] == '' + a8),
          aa = true;
        return a9 || (a9 = {
            'face_index': a8,
            'id': 0,
            'key': 'butts',
            'thickness': 0.4,
            'variant_id': 0
          },
          aa = false), {
          'face_index': a9['face_index'],
          'id': a9['id'] || 0,
          'key': a9['key'] || 'butts',
          'thickness': a9['thickness'] || 0.4,
          'variant_id': a9['variant_id'] || 0,
          'active': aa
        };
      });
  },
  'change_butt'(a3, a4, a5) {
    let a6 = this['selected_path'],
      a7 = this['$root']['$selected_object'],
      a8 = a3['spec']['butts'],
      a9 = this['find_root_fill_content_module_path']();
    var a3 = () => {
      module_utils['change_param_by_path'](this['item'], a6, 'spec.butts', copy_object(a8)),
        a9 || module_utils['change_param_by_path'](a7, a6, 'spec.butts', copy_object(a8), false),
        this['debounce'] = setTimeout(() => {
          a9 ? (this['reload_module'](a9),
            this['update_cabinet_size_box']()) : (module_utils['rebuild_child_by_path'](a7, a6),
            this['hide_helpers'](a6),
            this['show_helpers'](a6));
        }, this['delay']);
    };
    let aa = _['find'](a8, ab => '' + ab['face_index'] == '' + a4['face_index']);
    return 'active' === a5 && a4['active'] ? aa ? void 0 : (aa = {
        'face_index': a4['face_index'],
        'id': a4['id'],
        'key': a4['key'],
        'thickness': a4['thickness'],
        'variant_id': a4['variant_id']
      },
      a8.push(aa),
      void a3()) : 'active' !== a5 || a4['active'] ? (aa || (aa = {
          'face_index': a4['face_index'],
          'id': a4['id'],
          'key': a4['key'],
          'thickness': a4['thickness'],
          'variant_id': a4['variant_id']
        },
        a8.push(aa)),
      'key' === a5 && (a4['id'] = 0,
        aa['id'] = 0),
      aa[a5] = a4[a5],
      void a3()) : aa ? (_['remove'](a8, ab => '' + ab['face_index'] == '' + a4['face_index']),
      void a3()) : void 0;
  },
  'set_defaults_param'(a3, a4, a5) {
    var a6 = this['$root']['$selected_object'];
    a4 !== pp['const']['not_set_value'] && ('number' === a5 ? a4 = parseInt(a4, 10) : 'bool' === a5 && (a4 = to_int(
        a4))),
      utils['nested_object']['set'](this['item'], 'spec.defaults.' + a3, a4),
      utils['nested_object']['set'](this['defaults_params'], a3, a4),
      a6['set_defaults_param'](a3, a4, a5),
      a6['_rebuild']();
  },
  'get_defaults_param'(a3) {
    return _['get'](this['defaults_params'], a3);
  },
  'is_empty_defaults_param'(a3) {
    var a3 = _['get'](this['defaults_params'], a3);
    return is_empty_id(a3);
  },
  'show_modal_add_selected'() {
    var a3 = this['$refs']['hierarchy_tree_ref']['api'],
      a4 = a3['getSelectedId'](),
      a3;
    a4 && (a3 = a3['findNodeById'](a4)) && (this['show_modal_add'](a3),
      this['node_context_visible'] = false);
  },
  'show_modal_var_add_selected'() {
    var a3 = this['$refs']['var_tree_ref']['api'],
      a4 = a3['getSelectedId'](),
      a3;
    a4 && (a3 = a3['findNodeById'](a4)) && (this['show_var_modal_add'](a3),
      this['node_var_context_visible'] = false);
  },
  'show_modal_var_add_group_variable'() {
    var a3 = this['$refs']['var_tree_ref']['api'],
      a4 = a3['getSelectedId'](),
      a3;
    a4 && (a3 = a3['findNodeById'](a4)) && (this['show_var_modal_add_group'](a3),
      this['node_var_context_visible'] = false);
  },
  'show_var_modal_add_group': function(a3, a4) {
    this['var_modal_add_group']['node'] = a3,
      this['var_modal_add_group']['show'] = 1;
  },
  'show_modal_var_global_variable'() {
    var a3 = this['$refs']['var_tree_ref']['api'],
      a4 = a3['getSelectedId'](),
      a3;
    a4 && (a3 = a3['findNodeById'](a4)) && (this['show_var_global_variable'](a3),
      this['node_var_context_visible'] = false);
  },
  'show_var_global_variable': function(a3, a4) {
    this['var_global_variable_modal']['node'] = a3,
      this['var_global_variable_modal']['show'] = 1;
  },
  'show_var_modal_add': function(a3, a4) {
    this['var_modal_add']['node'] = a3,
      this['var_modal_add']['show'] = 1;
  },
  'hide_var_modal_add': function(a3) {
    this[a3]['model_id'] = 0,
      this[a3]['show'] = 0,
      this[a3]['node'] = null,
      this[a3]['type'] = 'group_variable',
      this[a3]['name'] = 'Группа',
      Vue['set'](this, 'variable', {
        'name': '',
        'key': '',
        'type': 'number',
        'value': 1,
        'editable': 0,
        'variants': 0,
        'local': 0,
        'params': {
          'min': 1,
          'max': '',
          'step': 1
        }
      });
  },
  'show_modal_add': function(a3, a4) {
    this['modal_add']['node'] = a3,
      this['modal_add']['show'] = 1;
  },
  'hide_modal_add': function() {
    this['modal_add']['model_id'] = 0,
      this['modal_add']['show'] = 0,
      this['modal_add']['node'] = null,
      this['modal_add']['type'] = 'section',
      this['modal_add']['name'] = 'Секция',
      this['opacity_material'](),
      this['clear_embed_mode']();
  },
  'choose_param_el': function(a3) {
    this['modal_add']['model_id'] = a3,
      '' == this['modal_add']['name'] && (this['modal_add']['name'] = this['$refs']['items_picker']['get_item_data']()[
        'name']);
  },
  'change_add_type': function(a3) {
    var a4 = '' == this['modal_add']['name'] || this['modal_add']['name'] == this['$options']['item_types_names'][this[
      'modal_add']['type']];
    this['modal_add']['type'] = a3['target']['value'],
      1 == a4 && (this['modal_add']['name'] = this['$options']['item_types_names'][this['modal_add']['type']]);
  },
  'add_group': function(a3) {
    var a4 = this['$refs']['var_tree_ref']['api'],
      a5 = this['var_modal_add_group']['node'],
      a6 = this['var_modal_add_group'],
      a5 = a4['findIndexById'](a5['id']),
      a7 = this['calc_var_path_array'](a5),
      a8, a7 = (copy_object(a7)['shift'](), {
        'type': this['var_modal_add_group']['type'],
        'name': this['var_modal_add_group']['name']
      }),
      a7 = {
        'id': this['generate_obj_id'](),
        'title': this['var_modal_add_group']['name'],
        'name': this['var_modal_add_group']['name'],
        'is_group': 1,
        'key': translit(this['var_modal_add_group']['name'])['toLowerCase']()['replaceAll']('\x20', '_'),
        'type': this['var_modal_add_group']['type'],
        'visible': void 0 !== a7['visible'] ? a7['visible'] : 1,
        'active': void 0 !== a7['active'] ? a7['active'] : 1,
        'children': []
      },
      a9 = (q[0]['children']['push'](a7),
        JSON['parse'](JSON['stringify'](q))),
      aa, a5 = a4['add'](a5, a7, true)['index'],
      ab = this['calc_var_path_array'](a5);
    a4['updateTree'](),
      this['hide_var_modal_add']('var_modal_add_group'),
      this['emit_update']();
  },
  'add_child': function(a3) {
    var a4 = this['$refs']['hierarchy_tree_ref']['api'],
      a5 = this['modal_add']['node'],
      a6 = this['$root']['$selected_object'],
      a5 = a4['findIndexById'](a5['id']),
      a7 = this['calc_path_array'](a5),
      a8;
    copy_object(a7)['shift']();
    let a9 = {
      'type': this['modal_add']['type'],
      'name': this['modal_add']['name'],
      'size': {
        'x': 's:x',
        'y': 's:y',
        'z': 's:z'
      }
    };
    if ('path' === a9['type'] && (a9['size'] = {
        'x': 10,
        'y': 4
      }),
      'bort' === a9['type'] && (a9['size'] = {
        'x': 's:x'
      }),
      'hole' === a9['type'] && delete a9['size'],
      'wall' === a9['type'] && a3['wall_type'])
      switch (a9['spec'] = {},
        a9['pos'] = {
          'x': 0,
          'y': 0,
          'z': 0
        },
        a9['pivot'] = {
          'x': -1,
          'y': -1,
          'z': -1
        },
        a9['spec']['orientation'] = 'f',
        a9['spec']['type'] = 'common',
        a9['spec']['key'] = 'left',
        a3['wall_type']) {
        case 1:
          break;
        case 2:
          a9['spec']['orientation'] = 'v';
          break;
        case 3:
          a9['spec']['orientation'] = 'v',
            a9['pos']['x'] = 's:x',
            a9['pivot']['x'] = 1;
          break;
        case 4:
          a9['spec']['orientation'] = 'h',
            a9['pos']['y'] = 's:y',
            a9['pivot']['y'] = 1;
          break;
        case 5:
          a9['spec']['orientation'] = 'h';
          break;
        case 6:
          a9['spec']['orientation'] = 'v',
            a9['pos']['x'] = 's:x\x20/\x202',
            a9['pivot']['x'] = 0;
          break;
        case 7:
          a9['spec']['orientation'] = 'h',
            a9['pos']['y'] = 's:y\x20/\x202',
            a9['pivot']['y'] = 0;
          break;
        case 8:
          a9['spec']['orientation'] = 'f',
            a9['pos']['z'] = 's:z\x20/\x202',
            a9['pivot']['z'] = 0;
          break;
        case 9:
          a9['spec']['orientation'] = 'f',
            a9['pos']['z'] = 's:z';
          break;
      }
    if ('wall' === a9['type']) {
      a9['spec'] || (a9['spec'] = {});
      var a7 = this['item']['spec']['mat_groups'] || [];
      let ae = _.findIndex(a7, 'default');
      var a7 = a7[ae = ae < 0 ? _.findIndex(a7, af => 'g0' === af['key']) : ae],
        aa;
      a7 && a7['available'] && (aa = a7?.['available'][0]?.['key'] || '',
        a9['spec']['material'] = {
          'group': a7['key'],
          'key': aa
        });
    }
    if ('tabletop' === a9['type'] && a3['wall_type'])
      switch (a9['spec'] = {},
        a9['pos'] = {
          'x': 0,
          'y': 0,
          'z': 0
        },
        a9['rot'] = {
          'x': 0,
          'y': 0,
          'z': 0
        },
        a9['pivot'] = {
          'x': -1,
          'y': -1,
          'z': -1
        },
        a3['wall_type']) {
        case 4:
          a9['pos']['y'] = 's:y';
          break;
        case 9:
          a9['pivot']['z'] = 1,
            a9['rot']['x'] = -90,
            a9['pos']['z'] = 's:z',
            a9['size']['z'] = 's:y';
          break;
        case 1:
          a9['rot']['x'] = 90,
            a9['size']['z'] = 's:y';
          break;
        case 2:
          a9['rot']['z'] = -90,
            a9['size']['x'] = 's:y';
          break;
        case 3:
          a9['pivot']['x'] = 1,
            a9['rot']['z'] = 90,
            a9['pos']['x'] = 's:x',
            a9['size']['x'] = 's:y';
          break;
        case 5:
          break;
      }
    if ('path' === a9['type'] && a3['wall_type'])
      switch (a9['spec'] || (a9['spec'] = {}),
        a9['spec']['type_params'] || (a9['spec']['type_params'] = {
          'angle': 45,
          'cbl': 2,
          'cbr': 2,
          'ctl': 2,
          'ctr': 2,
          'w1': 2,
          'w2': 2,
          'h1': 2,
          'h2': 2,
          'r': 10
        }),
        a9['pos'] = {
          'x': 0,
          'y': 0,
          'z': 0
        },
        a9['rot'] = {
          'x': 0,
          'y': 0,
          'z': 0
        },
        a3['wall_type']) {
        case 1:
          a9['spec']['type'] = 'common';
          break;
        case 2:
          a9['spec']['type'] = 'common',
            a9['spec']['direction'] = '-z',
            a9['size'] = {
              'x': 10,
              'y': 20,
              'z': 0
            };
          break;
        case 3:
          a9['spec']['type'] = 'angle';
          break;
        case 4:
          a9['spec']['type'] = 'angle',
            a9['spec']['reverse'] = true;
          break;
        case 5:
          a9['spec']['type'] = 'dx_angle';
          break;
        case 6:
          a9['spec']['type'] = 'dx_angle',
            a9['spec']['reverse'] = true;
          break;
        case 7:
          a9['spec']['type'] = 'radius';
          break;
      }
    if ('link' == this['modal_add']['type']) {
      if (0 == this['modal_add']['model_id'])
        alert('Выберите\x20модель');
      else {
        a9['spec'] = {
          'id': this['modal_add']['model_id']
        };
        var a7 = this['$refs']['items_picker']['get_item_data']();
        if (a7 && a7['data']) {
          a7['data']['name'] || (a7['data']['name'] = a7['name'] || '');
          let af = a7['data'];
          af['size'] || af['type'] && 'section' !== af['type'] || (af['size'] = {
            'x': 's:x',
            'y': 's:y',
            'z': 's:z'
          });
          var aa = copy_object(af),
            a7 = this['prepare_params'](af);
          let ag = [aa];
          this['prepare_template_tree'](ag);
          var aa = ag[0],
            a7 = a4['addNodesWithChildren'](a5, [a7], true, false),
            ab = a7['parentIndex'],
            ab = this['calc_path_array'](ab),
            ac = a4['calcRelativeIndex'](a7['index']);
          a4['collapse'](a7['index'], false),
            module_utils['add_child_by_path'](this['item'], ab['join'](','), copy_object(aa), ac['rIndex']),
            module_utils['add_child_by_path'](a6, ab['join'](','), aa, ac['rIndex']),
            a4['updateTree'](),
            this['hide_modal_add'](),
            this['emit_update'](),
            void this['init_module_types']();
        } else
          alert('Выбранный\x20элемент\x20не\x20может\x20быть\x20добавлен!');
      }
    } else {
      if ('facade' == this['modal_add']['type'] && (a9['spec'] = {
          'id': this['modal_add']['model_id'] || 0
        }),
        'module' == this['modal_add']['type']) {
        if (0 == this['modal_add']['model_id'])
          return void alert('Выберите\x20модель');
        a9['spec'] = {
            'element_type': this['modal_add']['model_type'],
            'id': this['modal_add']['model_id']
          },
          1 != this['modal_add']['model_parent_size'] && delete a9['size'];
      }
      if ('model' == this['modal_add']['type']) {
        if (0 == this['modal_add']['model_id'])
          return void alert('Выберите\x20модель');
        a9['spec'] = {
          'id': this['modal_add']['model_id']
        };
      }
      if ('locker2' == this['modal_add']['type']) {
        if (0 == this['modal_add']['model_id'])
          return void alert('Выберите\x20модель');
        a9['spec'] = {
          'id': this['modal_add']['model_id']
        };
      }
      if ('furniture' == this['modal_add']['type']) {
        if (0 == this['modal_add']['model_id'])
          return void alert('Выберите\x20модель');
        this['modal_add']['params']['pos'] && (a9['pos'] = this['modal_add']['params']['pos']),
          this['modal_add']['params']['rot'] && (a9['rot'] = this['modal_add']['params']['rot']),
          this['modal_add']['params']['c_rot'] && (a9['rot'] = this['modal_add']['params']['c_rot']),
          a9['spec'] = {
            'id': this['modal_add']['model_id']
          },
          delete a9['size'];
      }
      let ah = [a9];
      this['prepare_template_tree'](ah),
        a9 = ah[0];
      var a3 = {
        'id': this['generate_obj_id'](),
        'title': this['modal_add']['name'],
        'type': this['modal_add']['type'],
        'visible': void 0 !== a9['visible'] ? a9['visible'] : 1,
        'active': void 0 !== a9['active'] ? a9['active'] : 1,
        'has_condition': a9['condition']?.[0]?.[0] ? 1 : 0,
        'has_comments': is_empty_id(a9['comments']) ? 0 : 1
      };
      'module' === this['modal_add']['type'] || 'furniture' !== this['modal_add']['type'] && C[this['modal_add'][
          'type']] || (a3['preventChildren'] = true),
        'module' !== this['modal_add']['type'] && 'furniture' !== this['modal_add']['type'] || (a6['userData']['params']
          ['templates_loaded'] = 0);
      let ai, aj;
      if ('module' === this['modal_add']['type']) {
        var a7 = copy_object(a9),
          ab = this['prepare_params'](copy_object(a9));
        let ak = [a7];
        this['prepare_template_tree'](ak);
        var a7 = ak[0],
          aa = a4['addNodesWithChildren'](a5, [ab], true, false),
          ac = aa['parentIndex'],
          ab = this['calc_path_array'](ac),
          ac = a4['calcRelativeIndex'](aa['index']);
        ai = [...ab, ac['rIndex']]['join'](','),
          aj = this['find_root_fill_content_module_path'](),
          a4['collapse'](aa['index'], false),
          module_utils['add_child_by_path'](this['item'], ab['join'](','), copy_object(a7), ac['rIndex']),
          aj || module_utils['add_child_by_path'](a6, ab['join'](','), a7, ac['rIndex']),
          a4['updateTree']();
      } else {
        var ad, aa = a4['add'](a5, a3, true)['index'],
          ab = this['calc_path_array'](aa);
        ai = ab['join'](','),
          aj = this['find_root_fill_content_module_path'](),
          module_utils['add_child_by_path'](this['item'], ab['slice'](0, -1)['join'](','), copy_object(a9), _[
            'last'](ab)),
          aj || module_utils['add_child_by_path'](a6, ab['slice'](0, -1)['join'](','), a9, _['last'](ab), false);
      }
      aj && (this['reload_module'](aj),
          this['update_cabinet_size_box']()),
        '0,0' === ai && 1 === this['nodes']['length'] && Vue['set'](this['nodes'], 1, a4['getFlatTree']()?.[1]),
        'module' !== this['modal_add']['type'] && 'furniture' !== this['modal_add']['type'] || a6['_rebuild'](),
        aj || module_utils['init_empty_values_recursive_by_path'](a6, ai),
        a6['_rebuild'](),
        'module' == this['modal_add']['type'] && this['init_module_types'](),
        this['hide_modal_add'](),
        this['emit_update']();
    }
  },
  'var_add_child': function(a3) {
    var a4 = this['$refs']['var_tree_ref']['api'],
      a5 = this['$root']['$selected_object'],
      a6 = 1 == this['variable']['templates'],
      a7 = (delete this['variable']['templates'],
        this['var_modal_add']['node']),
      a7 = a4['findIndexById'](a7['id']),
      a8 = copy_object(this['variable']),
      a9 = {
        'id': this['generate_obj_id'](),
        'title': a8['name'],
        'type': 'variable',
        'is_global': 0,
        'v_type': a8['type'],
        'visible': 1,
        'active': 1,
        'preventChildren': true,
        'children': []
      },
      a9 = Object['assign'](a8, a9);
    if (module_utils['change_variables']([this['item'], a5], copy_object(this['variable']), {
        'isTemplate': a6,
        'triggerBuild': false,
        'raiseEvent': false
      }),
      !a6) {
      if (1 == a8['variants']) {
        for (let ae = 0; ae < this['item']['spec']['variants']['length']; ae++)
          this['item']['spec']['variants'][ae]['variables'] || (this['item']['spec']['variants'][ae]['variables'] = {}),
          this['item']['spec']['variants'][ae]['variables'][a8['key']] || (this['item']['spec']['variants'][ae][
              'variables'
            ][a8['key']] = {
              'value': a8['value']
            },
            a5['userData']['params']['spec']['variants'][ae]['variables'] || (a5['userData']['params']['spec'][
              'variants'
            ][ae]['variables'] = {}),
            a5['userData']['params']['spec']['variants'][ae]['variables'][a8['key']] = {
              'value': a8['value']
            });
      } else {
        for (let af = 0; af < this['item']['spec']['variants']['length']; af++)
          this['item']['spec']['variants'][af]['variables'] && this['item']['spec']['variants'][af]['variables'][a8[
            'key']] && (delete this['item']['spec']['variants'][af]['variables'][a8['key']],
            a5['userData']['params']['spec']['variants'][af]['variables']) && delete a5['userData']['params']['spec'][
            'variants'
          ][af]['variables'][a8['key']];
      }
    }
    if (a6) {
      var a6 = this['item']['spec']['templates'][a5['userData']['selected_template']]['template'],
        aa = a5['userData']['params']['spec']['templates'][a5['userData']['selected_template']]['template'];
      let ag = a6['variables'],
        ah = aa['variables'];
      ag || (ag = {},
          a6['variables'] = ag),
        ah || (ah = {},
          aa['variables'] = ah),
        ag[a8['key']] = copy_object(a8),
        ah[a8['key']] = copy_object(a8),
        this['templates_vars_hash'][a8['key']] = copy_object(a8);
    }
    var ab, [a6, aa] = this['calc_var_path_array'](a7),
      ac = copy_object(q),
      ad = ((0 == a6 && void 0 === aa ? ac[a6] : ac[a6]['children'][aa])['children']['push'](a9),
        q = copy_object(ac),
        this['$root']['$vartree_object'] = q,
        a4['add'](a7, a9, true));
    a4['updateTree'](),
      module_utils['rebuild_variables'](a5),
      a5['build'](),
      a5['_after_build'](),
      this['hide_var_modal_add']('var_modal_add'),
      this['emit_update']();
  },
  'var_add_global_variable': function(a3) {
    var a4 = this['$refs']['var_tree_ref']['api'],
      a5 = this['var_global_variable_modal']['node'],
      a5 = a4['findIndexById'](a5['id']),
      a6 = {
        'id': this['generate_obj_id'](),
        'title': item['name'] || item['key'],
        'name': item['name'] || item['key'],
        'type': 'global_variable',
        'is_global': 1,
        'key': a3,
        'editable': 0,
        'local': 0,
        'fixed': 0,
        'visible': 1,
        'active': 1,
        'preventChildren': true,
        'children': []
      },
      a7, a8, a6, a9, a8, aa, ab, ac, a8;
    _['find'](this['item']['variables']['global'], ad => ad['key'] === a3) || (module_utils['change_variables'](this[
        'item'], a6, {
        'isGlobal': true,
        'action': 'add'
      }),
      this['sync_global_vars_to_cabinet'](),
      (a8 = copy_object(this['$options']['global_vars_hash'][a3]))['v_type'] = a8['type'],
      a8['title'] = a8['name'],
      delete a8['type'],
      a8['value'] = null,
      a6 = Object['assign'](a6, a8),
      [a8, aa] = this['calc_var_path_array'](a5),
      ab = copy_object(q),
      (0 == a8 && void 0 === aa ? ab[a8] : ab[a8]['children'][aa])['children']['push'](a6),
      q = copy_object(ab),
      this['$root']['$vartree_object'] = q,
      ac = a4['add'](a5, a6, true),
      a4['updateTree'](),
      this['emit_update'](),
      a8 = copy_object(a6),
      is_internal_var(a8['key']) && (a8['is_internal'] = 1),
      Vue['set'](this, 'variable_params', a8));
  },
  'var_tree_save': function() {
    let a3 = [],
      a4 = {};
    var a5 = this['item']['variables'];
    if (q && q.length) {
      a8(q[0]);
      let a7 = copy_object(q);
      var a6 = a7.map(aa => a9(a7, ['name', 'key', 'is_global', 'is_group', 'children']));

      function a8(aa) {
        var ab = {
          'name': aa['name'],
          'key': aa['key'],
          'is_global': aa['is_global'],
          'value': aa['value'],
          'local': aa['local'],
          'editable': aa['editable'],
          'variants': aa['variants'],
          'fixed': aa['fixed'],
          'params': aa['params'],
          'type': aa['v_type']
        };
        'variable' !== aa['type'] && 'global_variable' !== aa['type'] || (aa['is_global'] ? (aa['disabled_values'] && (
              ab['disabled_values'] = aa['disabled_values']),
            a3.push(ab)) : (ab['type'] = aa['v_type'],
            ab['local'] = aa['local'],
            ab['editable'] = aa['editable'],
            ab['variants'] = aa['variants'],
            ab['fixed'] = aa['fixed'],
            ab['params'] = aa['params'] || '',
            a4[ab['key']] = ab)),
          aa['children']['length'] && aa['children']['forEach'](ac => a8(ac));
      }

      function a9(aa, ab) {
        return _['isArray'](aa) ? aa.map(ac => a9(ac, ab)) : _['isObject'](aa) ? (1 !== aa['is_group'] ? delete aa[
            'name'] : delete aa['key'],
          _['isEmpty'](aa['children']) && delete aa['children'],
          _['isEmpty'](aa['disabled_values']) && delete aa['disabled_values'],
          0 === aa['is_global'] && delete aa['is_global'],
          _(aa)['pick'](ab)['mapValues'](ac => a9(ac, ab))['value']()) : aa;
      }
      a5['main'] = a4,
        a5['global'] = a3,
        a5['tree'] = a6[0][0]['children'];
    } else
      a5['main'] = a4,
      a5['global'] = a3,
      a5['tree'] = [];
  },
  'clone_selected': function() {
    var a3 = this['$refs']['hierarchy_tree_ref']['api'],
      a4 = this['$root']['$selected_object'],
      a5 = a3['getSelectedId'](),
      a5 = a3['findIndexById'](a5),
      a6 = a3['getNode'](a5),
      a7 = this['calc_path_array'](a5);
    if (a6) {
      var a8 = module_utils['get_child_params_by_path'](this['item'], a7['join'](','));
      if (a8) {
        let a9 = false;
        !a6['isLeaf'] && a6['expanded'] && (a3['collapse'](a5, false),
          a9 = true);
        var a6 = this['prepare_params'](a8);
        a6['name'] && (a6['name'] += '\x20(Копия)',
            a6['title'] += '\x20(Копия)'),
          a3['addNodesWithChildren'](a5, [a6], false, false),
          a9 && a3['expand'](a5, false),
          module_utils['clone_child_by_path'](this['item'], a7['join'](',')),
          module_utils['clone_child_by_path'](a4, a7['join'](',')),
          a3['updateTree']();
      }
    }
    this['node_context_visible'] = false;
  },
  'var_clone_selected': function() {
    var a3 = this['$refs']['var_tree_ref']['api'],
      a4 = this['$root']['$selected_object'],
      a5 = a3['getSelectedId'](),
      a5 = a3['findIndexById'](a5),
      a6 = a3['getNode'](a5),
      a7 = this['calc_var_path_array'](a5);
    if (a6) {
      var a8 = module_utils['get_child_params_by_path'](this['item'], a7['join'](','));
      if (a8) {
        let a9 = false;
        !a6['isLeaf'] && a6['expanded'] && (a3['collapse'](a5, false),
          a9 = true);
        var a6 = this['prepare_params'](a8);
        a6['name'] && (a6['name'] += '\x20(Копия)',
            a6['title'] += '\x20(Копия)'),
          a3['addNodesWithChildren'](a5, [a6], false, false),
          a9 && a3['expand'](a5, false),
          module_utils['clone_child_by_path'](this['item'], a7['join'](',')),
          module_utils['clone_child_by_path'](a4, a7['join'](',')),
          a3['updateTree']();
      }
    }
    this['node_context_visible'] = false;
  },
  'check_clipboard': async function(a3 = 'clipboard') {
      let a4;
      if (this['$options']['clipboardApi'])
        try {
          ('string' == typeof(a4 = await navigator['clipboard']['readText']()) && '{' === a4[0] && '}' === a4['slice']
            (-1) || ']' === a4['slice'](-1) && '[' === a4[0]) && (a4 = JSON['parse'](a4)) && (a4['type'] || a4[
            0]?.['type']) && ('root' === a4[0]?.['type'] || 'global_variable' === a4['type'] || 'group_variable' ===
            a4['type'] || 'variable' === a4['type'] ? (this['$options']['clipboardVar'] = a4,
              this['$options']['clipboard'] = null) : (this['$options']['clipboardVar'] = null,
              this['$options']['clipboard'] = a4));
        } catch {}
    },
    'copy_to_clipboard': async function() {
        var a3 = this['$refs']['hierarchy_tree_ref']['api'],
          a4 = a3['getSelectedId'](),
          a3 = a3['findIndexById'](a4),
          a4 = this['calc_path_array'](a3),
          a3 = module_utils['get_child_params_by_path'](this['item'], a4['join'](','));
        if (this['$options']['clipboard'] = a3,
          this['$options']['clipboardApi'])
          try {
            await navigator['clipboard']['writeText'](JSON['stringify'](a3));
          } catch {}
        this['node_context_visible'] = false;
      },
      'var_copy_to_clipboard': async function() {
          var a3 = this['$refs']['var_tree_ref']['api'],
            a4 = a3['getSelectedId'](),
            a5 = a3['findNodeById'](a4),
            a3 = a3['findIndexById'](a4),
            a4 = this['calc_var_path_array'](a3);
          let a6;
          'root' == a5['type'] && (a6 = copy_object(q)),
            'group_variable' == a5['type'] && (a6 = copy_object(q[a4[0]]['children'][a4[1]])),
            'variable' != a5['type'] && 'global_variable' != a5['type'] || (a6 = 2 == a4.length ? copy_object(q[a4[
              0]]['children'][a4[1]]) : copy_object(q[a4[0]]['children'][a4[1]]['children'][a4[2]]));
          var a7 = this['$root']['$selected_object'],
            a8 = 1 == this['variable']['templates'],
            a9 = (delete this['variable']['templates'],
              copy_object(this['variable'])),
            a3 = a6;
          if (this['$options']['clipboardVar'] = a3,
            this['$options']['clipboardApi'])
            try {
              await navigator['clipboard']['writeText'](JSON['stringify'](a3));
            } catch {}
          this['node_var_context_visible'] = false;
        },
        'paste_from_clipboard': async function() {
            let a3;
            if (this['$options']['clipboardApi'])
              try {
                a3 = await navigator['clipboard']['readText'](),
                  a3 = JSON['parse'](a3);
              } catch (ab) {
                a3 = copy_object(this['$options']['clipboard']);
              }
            else
              a3 = copy_object(this['$options']['clipboard']);
            if (a3) {
              a3['name'] && (a3['name'] += '\x20(Копия)');
              var a4 = this['$refs']['hierarchy_tree_ref']['api'],
                a5 = this['$root']['$selected_object'],
                a6 = a4['getSelectedId'](),
                a6 = a4['findIndexById'](a6),
                a7 = a4['getNode'](a6),
                a8 = this['calc_path_array'](a6);
              if (a7) {
                let ac = 0;
                var a7 = a8['join'](',');
                let ad;
                var a9 = this['find_root_fill_content_module_path']();
                if (a7 && '0' !== a7)
                  ad = module_utils['get_child_params_by_path'](this['item'], a7);
                else {
                  let ae = this['item'];
                  ad = {
                    get 'children'() {
                      return ae['spec']['template']['tree'];
                    },
                    set 'children'(af) {
                      ae['spec']['template']['tree'] = af;
                    }
                  };
                }
                ad && ad['children'] && (ac = ad['children']['length']);
                var aa = this['prepare_params'](a3);
                module_utils['add_child_by_path'](this['item'], a7, copy_object(a3), ac),
                  a9 || module_utils['add_child_by_path'](a5, a7, a3, ac, false),
                  a9 || 'module' !== a3['type'] && 'furniture' !== a3['type'] || a5['_rebuild'](),
                  a9 ? (this['reload_module'](a9),
                    this['update_cabinet_size_box']()) : (module_utils['init_empty_values_recursive_by_path'](a5, [...
                      a8, ac
                    ]['join'](',')),
                    a5['_rebuild']()),
                  this['init_module_types'](),
                  a4['addNodesWithChildren'](a6, [aa], true),
                  a4['updateTree'](),
                  this['node_context_visible'] = false,
                  this['emit_update']();
              } else
                this['node_context_visible'] = false;
            } else
              this['node_context_visible'] = false;
          },
          'var_paste_from_clipboard': async function() {
              let a3;
              if (this['$options']['clipboardApi'])
                try {
                  a3 = await navigator['clipboard']['readText'](),
                    a3 = JSON['parse'](a3);
                } catch (aj) {
                  a3 = copy_object(this['$options']['clipboardVar']);
                }
              else
                a3 = copy_object(this['$options']['clipboardVar']);
              if (a3) {
                var a4 = this['$refs']['var_tree_ref']['api'],
                  a5 = this['$root']['$selected_object'],
                  a6 = 1 == this['variable']['templates'],
                  a7 = (delete this['variable']['templates'],
                    a4['getSelectedId']()),
                  a8 = a4['findIndexById'](a7),
                  a9 = a4['getNode'](a8),
                  aa = this['calc_var_path_array'](a8),
                  a8 = a4['findNodeById'](a7);
                if (a9) {
                  var ab = copy_object(q);
                  let ak = void 0 !== this['item']['variables']['main'] ? this['item']['variables']['main'] : {},
                    al = void 0 !== this['item']['variables']['global'] ? this['item']['variables']['global'] : {};
                  var ac = copy_object(this['variable']);
                  if ('root' == a8['type']) {
                    if ('group_variable' == a3['type']) {
                      var a7 = a3['children']['filter'](am => void 0 === ak[am['key']] && !al['some'](an => an[
                        'key'] === am['key']));
                      if (0 == a7.length)
                        return void(this['node_var_context_visible'] = false);
                      a3['children'] = a7,
                        a3['id'] = this['generate_obj_id'](),
                        ab[0]['children']['push'](a3),
                        q[0]['children'] = copy_object(ab[0]['children']),
                        a4['updateTree'](),
                        module_utils['rebuild_variables'](a5),
                        a5['build'](),
                        this['node_var_context_visible'] = false,
                        this['emit_update'](),
                        this['var_tree_save'](),
                        this['sync_vars_to_cabinet'](),
                        this['reset_tree_var']();
                    } else {
                      if ('variable' == a3['type'] || 'global_variable' == a3['type']) {
                        let am = 0;
                        for (var ad in (null != ak[a3['key']] && (am = 1),
                            al))
                          al[ad]['key'] == a3['key'] && (am = 1);
                        am || (a3['id'] = this['generate_obj_id'](),
                          ab[0]['children']['push'](a3),
                          q[0]['children'] = copy_object(ab[0]['children']),
                          a4['updateTree'](),
                          module_utils['rebuild_variables'](a5),
                          a5['build'](),
                          this['node_var_context_visible'] = false,
                          this['emit_update'](),
                          this['var_tree_save'](),
                          this['sync_vars_to_cabinet'](),
                          this['reset_tree_var']());
                      } else {
                        var ae = [];
                        for (let an = 0; an < a3[0]['children']['length']; an++)
                          if ('group_variable' == a3[0]['children'][an]['type'] && 0 < a3[0]['children'][an][
                              'children'
                            ]['length']) {
                            var af = a3[0]['children'][an]['children']['filter'](ao => null == ak[ao['key']] &&
                              null == al[a3['key']]);
                            0 == af.length ? ae.push(an) : (a3[0]['children'][an]['children'] = af,
                              a3[0]['children'][an]['id'] = this['generate_obj_id'](),
                              ab[0]['children']['push'](a3[0]['children'][an]));
                          } else {
                            if ('variable' == a3[0]['children'][an]['type'])
                              null == ak[a3[0]['children'][an]['key']] && (a3[0]['children'][an]['id'] = this[
                                  'generate_obj_id'](),
                                ab[0]['children']['push'](a3[0]['children'][an]));
                            else {
                              if ('global_variable' == a3[0]['children'][an]['type']) {
                                let ao = 0;
                                for (var ag in al)
                                  al[ag]['key'] == a3[0]['children'][an]['key'] && (ao = 1);
                                ao || (a3[0]['children'][an]['id'] = this['generate_obj_id'](),
                                  ab[0]['children']['push'](a3[0]['children'][an]));
                              }
                            }
                          }
                        q[0]['children'] = copy_object(ab[0]['children']),
                          a4['updateTree'](),
                          module_utils['rebuild_variables'](a5),
                          a5['build'](),
                          this['node_var_context_visible'] = false,
                          this['emit_update'](),
                          this['var_tree_save'](),
                          this['sync_vars_to_cabinet'](),
                          this['reset_tree_var']();
                      }
                    }
                  }
                  if ('group_variable' == a8['type']) {
                    if ('group_variable' == a3['type']) {
                      var ah = a3['children']['filter'](ap => void 0 === ak[ap['key']] && !al['some'](aq => aq[
                        'key'] === ap['key']));
                      if (0 == ah.length)
                        return void(this['node_var_context_visible'] = false);
                      for (let ap = 0; ap < ah.length; ap++)
                        ah[ap]['id'] = this['generate_obj_id'](),
                        ab[0]['children'][aa[1]]['children']['push'](ah[ap]);
                      q[0]['children'] = copy_object(ab[0]['children']),
                        a4['updateTree'](),
                        module_utils['rebuild_variables'](a5),
                        a5['build'](),
                        this['node_var_context_visible'] = false,
                        this['emit_update'](),
                        this['var_tree_save'](),
                        this['sync_vars_to_cabinet'](),
                        this['reset_tree_var']();
                    } else {
                      if ('variable' == a3['type'] || 'global_variable' == a3['type']) {
                        let aq = 0;
                        for (var ai in (null != ak[a3['key']] && (aq = 1),
                            al))
                          al[ai]['key'] == a3['key'] && (aq = 1);
                        aq || (a3['id'] = this['generate_obj_id'](),
                          ab[0]['children'][aa[1]]['children']['push'](a3),
                          q[0]['children'] = copy_object(ab[0]['children']),
                          a4['updateTree'](),
                          module_utils['rebuild_variables'](a5),
                          a5['build'](),
                          this['node_var_context_visible'] = false,
                          this['emit_update'](),
                          this['var_tree_save'](),
                          this['sync_vars_to_cabinet'](),
                          this['reset_tree_var']());
                      }
                    }
                  }
                }
              }
              this['node_var_context_visible'] = false;
            },
            'cut_to_clipboard': function() {
              this['copy_to_clipboard'](),
                this['remove_selected'](),
                this['node_context_visible'] = false;
            },
            'remove_selected': function() {
              var a3 = this['$refs']['hierarchy_tree_ref']['api'],
                a4 = this['$root']['$selected_object'],
                a5 = a3['getSelectedId'](),
                a5 = a3['findIndexById'](a5),
                a6, a7 = this['calc_path_array'](a5)['join'](','),
                a8 = this['find_root_fill_content_module_path']();
              this['node_context_visible'] = false,
                this['clear_selected'](),
                a3['remove'](a5),
                module_utils['remove_child_by_path'](this['item'], a7),
                a8 || module_utils['remove_child_by_path'](a4, a7),
                a8 && (this['reload_module'](a8),
                  this['update_cabinet_size_box']()),
                this['init_module_types'](),
                a3['updateTree']();
            },
            'var_remove_selected': function() {
              var a3 = this['$refs']['var_tree_ref']['api'],
                a4 = this['$root']['$vartree_object'];
              let a5 = a3['getSelectedId']();
              var a6 = a3['findNodeById'](a5),
                a7 = a3['findIndexById'](a5),
                a8, [a9, aa, ab] = this['calc_var_path_array'](a7),
                ac = copy_object(q),
                ad, ae;
              if ('group_variable' == a6['type']) {
                let af = false,
                  ag = false;
                for (ae of ac[a9]['children'][aa]['children'] || [])
                  'global_variable' == ae['type'] ? (this['remove_global_variable'](ae['key'], false),
                    ag = true) : 'variable' == ae['type'] && (this['remove_variable']({
                      'key': ae['key'],
                      'variants': ae['variants']
                    }, false, false),
                    af = true);
                af ? this['sync_vars_to_cabinet']() : ag && this['sync_global_vars_to_cabinet']();
              } else
                'global_variable' == a6['type'] ? this['remove_global_variable'](a6['key']) : 'variable' == a6[
                'type'] && this['remove_variable']({
                  'key': a6['key'],
                  'variants': a6['variants']
                });
              a3['remove'](a7),
                a3['updateTree'](),
                void 0 === ab ? ac[a9]['children']['splice'](ac[a9]['children']['findIndex'](ah => ah['id'] == a5),
                  1) : ac[a9]['children'][aa]['children']['splice'](ac[a9]['children'][aa]['children']['findIndex'](
                  ah => ah['id'] == a5), 1),
                q = copy_object(ac),
                this['$root']['$vartree_object'] = q,
                this['node_var_context_visible'] = false;
            },
            'var_set_active_all': function(a3) {
              this['clear_var_selected']();
              var a4 = this['item']['variables']['main'],
                a5, a6, a7;
              for (a5 of Object['keys'](a4))
                a4[a5]['editable'] = a3;
              for (a7 of this['item']['variables']['global'])
                a7['editable'] = a3;
              this['reset_tree_var'](),
                this['node_var_context_visible'] = false;
            },
            'var_import_nested': function() {
              var a3 = this['$root']['$selected_object'],
                a4 = (this['clear_var_selected'](),
                  'Из\x20вложенных\x20модулей'),
                a5 = {
                  'id': this['generate_obj_id'](),
                  'title': a4,
                  'name': a4,
                  'is_group': 1,
                  'key': translit(a4)['toLowerCase']()['replaceAll']('\x20', '_'),
                  'type': 'group_variable',
                  'visible': 1,
                  'active': 1,
                  'children': []
                };
              let a6 = {
                'main': {},
                'global': {}
              };
              a3['walk_params_tree'](ag => {
                if (ag['variables']?.['main'] || ag['variables']?.['global']) {
                  for (var ah of Object['keys'](ag['variables']?.['main'] || {}))
                    a6['main'][ah] || (a6['main'][ah] = ag['variables']['main'][ah]);
                  for (var ai of ag['variables']?.['global'] || [])
                    a6['global'][ai['key']] || (a6['global'][ai['key']] = ai);
                }
              });
              var a7 = new Set(),
                a8, a9, aa, ab, ac, ad, ae, af;
              for (a8 of Object['keys'](this['item']['variables']['main'] || {}))
                a7['add'](a8);
              for (a9 of this['item']['variables']['global'] || [])
                a7['add'](a9['key']);
              for (aa of Object['keys'](a6['global'])) {
                a7['has'](aa) || (a7['add'](aa),
                  ab = {
                    'id': this['generate_obj_id'](),
                    'title': '',
                    'name': '',
                    'type': 'global_variable',
                    'v_type': 'number',
                    'is_global': 1,
                    'key': aa,
                    'editable': 0,
                    'local': 0,
                    'fixed': 0,
                    'visible': 1,
                    'active': 1,
                    'preventChildren': true,
                    'children': []
                  },
                  (ac = copy_object(this['find_global_var_or_default'](aa)))['value'] = null,
                  merge(ab, ac, copy_object(a6['global'][aa])),
                  ab['v_type'] = ac['type'],
                  ab['type'] = 'global_variable',
                  a5['children']['push'](ab));
              }
              for (ad of Object['keys'](a6['main'])) {
                a7['has'](ad) || (a7['add'](ad),
                  ae = {
                    'id': this['generate_obj_id'](),
                    'name': '',
                    'key': ad,
                    'v_type': 'number',
                    'value': 0,
                    'local': 0,
                    'editable': 0,
                    'variants': 0,
                    'title': '',
                    'type': 'variable',
                    'is_global': 0,
                    'visible': 1,
                    'active': 1,
                    'fixed': 0,
                    'preventChildren': true,
                    'children': []
                  },
                  merge(ae, copy_object(a6['main'][ad])),
                  ae['v_type'] = a6['main'][ad]['type'],
                  ae['type'] = 'variable',
                  a5['children']['push'](ae));
              }
              for (af of a5['children'])
                af['v_type'] || (af['v_type'] = 'number'),
                af['params'] || (af['params'] = copy_object(this['$options']['var_params'][af['v_type']])),
                af['title'] = af['name'],
                delete af['templates'];
              a5['children']['length'] && (q[0]['children']['push'](a5),
                  this['var_tree_save'](),
                  this['sync_vars_to_cabinet'](),
                  this['reset_tree_var']()),
                this['node_var_context_visible'] = false;
            },
            'check_var_key_duplicate': function(a3) {
              var a3 = a3['key'];
              return !!this['item']['variables']['main'][a3];
            },
            'update_tree_title'() {
              var a3, a4;
              let a5 = (this['item']['spec']['variants']?.[this['item']['spec']['selected_variant']])?.['name'];
              a5 = (a5 = a5 || this['item']['name']) || '(модуль\x20без\x20названия)',
                this['nodes'] && this['nodes'][0] && (this['nodes'][0]['title'] = a5),
                this['$refs']['hierarchy_tree_ref'] && this['$refs']['hierarchy_tree_ref']['api']['updateNode'](0, {
                  'title': a5
                });
            },
            'init_module_types'() {
              var a3 = this['$root']['$selected_object'],
                a4 = this['item']['spec']['module_types'],
                a3 = module_utils['find_nested_module_types'](a3),
                a5;
              for (a5 of a3)
                a5['visible'] = 0 !== a4?.[a5['key']]?.['visible'] ? 1 : 0;
              var a6 = 0 !== a4?.['__all']?.['visible'] ? 1 : 0;
              Vue['set'](this, 'module_types', a3),
                Vue['set'](this, 'module_types_all', a6);
            },
            'change_module_type_visible': function(a3) {
              var a4 = this['item']['spec']['module_types'],
                a5;
              (a3 = '__all' === a3 ? {
                'key': '__all',
                'visible': this['module_types_all']
              } : a3)['visible'] ? a4[a3['key']] && delete a4[a3['key']]: (a4[a3['key']] || (a4[a3['key']] = {
                  'visible': 0
                }),
                a4[a3['key']]['visible'] = 0);
            },
            'size_changed': function() {
              let a3 = this;
              clearTimeout(this['debounce']),
                this['debounce'] = setTimeout(function() {
                  var a4 = a3['$root']['$selected_object'],
                    a5 = a4['userData']['params']['size'],
                    a6 = a3['item']['size'];
                  a6['x'] = parseFloat(a6['x']),
                    a6['y'] = parseFloat(a6['y']),
                    a6['z'] = parseFloat(a6['z']),
                    a5 && (a5['x'] = a6['x'],
                      a5['y'] = a6['y'],
                      a5['z'] = a6['z']),
                    a4['_rebuild']();
                }, this['delay']);
            },
            'change_event': function(a3) {
              clearTimeout(this['debounce']),
                this['debounce'] = setTimeout(() => {
                  var a4;
                  this['$root']['$selected_object']['userData']['params']['events'][a3] = this['item']['events'][a3];
                }, this['delay']);
            },
            'change_tab': function(a3) {
              var a4, a4 = ('materials' === this['tab'] && (this['update_mat_groups_hash'](),
                  a4 = this['$root']['$selected_object'],
                  _['isEqual'](a4['userData']['params']['spec']['mat_groups'], this['item']['spec']['mat_groups']) ||
                  (a4['userData']['params']['spec']['mat_groups'] = copy_object(this['item']['spec']['mat_groups']),
                    a4['_rebuild']())),
                'tree' == this['tab'] && this['clear_selected'](),
                'treevar' == this['tab'] && this['clear_selected'](),
                this['tab'] = a3,
                this['set_' + a3 + '_tab']);
              a4 && 'function' == typeof a4 && a4();
            },
            'set_tree_tab': function() {
              this['var_override_add_key'] = '',
                this['set_templates_vars'](false),
                this['init_module_types'](),
                view_mode && (resize_viewport(),
                  this['check_clipboard']());
            },
            'set_treevar_tab': function() {
              this['var_tree_save'](),
                this['hide_var_modal_add']('var_modal_add'),
                this['hide_var_modal_add']('var_modal_add_group'),
                this['var_global_variable_modal']['show'] = 0,
                this['var_override_add_key'] = '',
                this['reset_tree_var'](),
                this['set_templates_vars'](false),
                this['init_module_types'](),
                view_mode && (resize_viewport(),
                  this['check_clipboard']('clipboardVar'));
            },
            'set_materials_tab': function() {
              Array.isArray(this['item']['spec']['defaults']) && (this['item']['spec']['defaults'] = {});
              var a3 = pp['const']['not_set_value'],
                a3 = merge({
                  'tabletop': {
                    'id': a3,
                    'variant_id': a3,
                    'plints': {
                      'material': a3,
                      'back': a3,
                      'right': a3,
                      'left': a3
                    }
                  },
                  'facade': {
                    'id': a3
                  },
                  'cokol': {
                    'id': a3
                  },
                  'cokol_top': {
                    'id': a3
                  },
                  'cornice': {
                    'id': a3
                  },
                  'butt': {
                    'id': a3,
                    'variant_id': a3
                  }
                }, copy_object(this['item']['spec']['defaults']));
              this['defaults_params'] = a3;
            },
            'set_accessories_tab': function() {
              this['get_default_furniture']();
            },
            'set_json_tab': function() {
              this['set_json']();
            },
            'set_templates_tab': function() {
              this['set_templates_vars'](true);
              for (var a3 of this['item']['spec']['templates'])
                a3['template']['accessories'] || (a3['template']['accessories'] = []);
            },
            'set_variables_tab': function() {
              this['var_override_add_key'] = '',
                this['set_templates_vars'](false);
            },
            'set_templates_vars': function(a3) {
              var a4 = this['$root']['$selected_object'];
              let a5 = {};
              var a3 = a3 ? this['item']['spec']['templates'] : [this['item']['spec']['templates'][a4['userData'][
                'selected_template'
              ]]];
              a3 && a3.forEach(a6 => {
                  a6 && a6['template'] && a6['template']['variables'] && Object['keys'](a6['template']['variables'])[
                    'forEach'](a7 => {
                    var a8 = this['item']['variables']['main'][a7] ? copy_object(this['item']['variables']['main']
                        [a7]) : {
                        'name': '',
                        'key': '',
                        'type': 'number',
                        'value': 0,
                        'editable': 0,
                        'variants': 0,
                        'params': {
                          'min': 1,
                          'max': '',
                          'step': 1
                        }
                      },
                      a9 = copy_object(a6['template']['variables'][a7]);
                    a9['type'] || (a9['type'] = 'number',
                        a9['params'] = copy_object(this['$options']['var_params'][a9['type']])),
                      merge(a8, a9),
                      a5[a7] = a8;
                  });
                }),
                Vue['set'](this, 'templates_vars_hash', a5);
            },
            'get_default_furniture': function() {
              var a3, a4 = this['$root']['$selected_object']['userData']['params'],
                a5 = {
                  'door': {
                    'count': 0,
                    'id': null
                  },
                  'locker': {
                    'count': 0,
                    'id': null
                  },
                  'simple_top': {
                    'count': 0,
                    'id': null
                  },
                  'double_top': {
                    'count': 0,
                    'id': null
                  },
                  'front_top': {
                    'count': 0,
                    'id': null
                  }
                };
              if (a4['cabinet'] && a4['cabinet']['type'] && ('false_facade' === a4['cabinet']['type'] ||
                  'false_facade_facade' === a4['cabinet']['type'] || 'false_facade_tabletop' === a4['cabinet']['type']))
                return a5;
              if (a4['doors'])
                for (let a7 = 0; a7 < a4['doors']['length']; a7++) {
                  var a6 = a4['doors'][a7];
                  'ltr' !== a6['type'] && 'rtl' !== a6['type'] || (a5['door']['count'] += 2),
                    'simple_top' === a6['type'] && (a5['door']['count'] += 2,
                      a5['simple_top']['count'] += 2),
                    'double_top' === a6['type'] && (a5['door']['count'] += 2,
                      a5['double_top']['count'] += 1),
                    'front_top' === a6['type'] && (a5['front_top']['count'] += 1),
                    'corner_90_rtl' !== a6['type'] && 'corner_90_ltr' !== a6['type'] || (a5['door']['count'] += 4);
                }
              a4['lockers'] && (a5['locker']['count'] += a4['lockers']['length']),
                Vue['set'](this, 'default_furniture', a5);
            },
            'set_json': function() {
              var a3 = this['$root']['$selected_object'],
                a3 = copy_object(this['item']['spec']['templates'][a3['userData']['selected_template']]['template'][
                  'tree'
                ]);
              module_utils['remove_nested_modules'](a3),
                U['set'](a3);
            },
            'apply_json': function() {
              var a3 = this['$root']['$selected_object'],
                a4 = U['get'](),
                a5 = a3['userData']['selected_template'],
                a6 = this['item']['spec']['templates'][a5],
                a5 = a3['userData']['params']['spec']['templates'][a5];
              a6 && (a6['template']['tree'] = copy_object(a4 || [])),
                a5 && (a5['template']['tree'] = copy_object(a4 || [])),
                a3['userData']['params']['templates_loaded'] = 0,
                module_utils['init_empty_values_recursive_by_path'](a3, '0'),
                a3['_rebuild'](),
                this['reset_tree'](),
                this['emit_update']();
            },
            'check_json_editor': function() {
              var a3, a4;
              U && U['container'] && U['container']['parentElement'] || (U && U['destroy'](),
                a3 = this['$refs']['jsoneditor_asfjh'],
                a4 = {
                  'search': false,
                  'mode': 'code',
                  'modes': ['tree', 'view', 'form', 'code', 'text', 'preview']
                },
                U = new JSONEditor(a3, a4));
            },
            'edges_mode'() {
              this['edges']['is_on'] = !this['edges']['is_on'],
                this['edges']['is_on'] ? global_options['mode'] = 'edges' : (global_options['mode'] = 'design',
                  this['edges']['transparent'] = false,
                  global_options['edges_transparent'] = false,
                  transparent_edges(global_options['edges_transparent']));
              try {
                room['change_mode']();
              } catch (a3) {}
              room['hide']();
            },
            'edges_transparent'() {
              this['edges']['is_on'] || (this['edges']['is_on'] = true,
                  global_options['mode'] = 'edges',
                  room['change_mode'](),
                  room['hide']()),
                this['edges']['transparent'] = !this['edges']['transparent'],
                global_options['edges_transparent'] = this['edges']['transparent'],
                transparent_edges(global_options['edges_transparent']);
            },
            'reset_camera'() {
              var a3 = this['$root']['$selected_object'];
              single_preview(true, a3);
            },
            'butts_show'() {
              this['is_show_butts'] = !this['is_show_butts'],
                show_butts(this['is_show_butts']);
            },
            'make_icon': async function(a3) {
                if (0 == glob['item_id'])
                  alert(
                    'Для\x20создания\x20иконки\x20необходимо\x20сначала\x20сохранить\x20модуль.\x20Нажмите\x20кнопку\x20сохранить\x20и\x20попробоуйте\x20снова'
                    );
                else {
                  var a4 = this['$root']['$selected_object'];
                  if (a4) {
                    var a5 = this,
                      a6 = camera['position']['clone'](),
                      a7 = controls['target']['clone'](),
                      a8 = a4['position']['clone'](),
                      a9 = (this['reset_camera'](),
                        new THREE['Box3']()['setFromObject'](a4)['getSize'](new THREE['Vector3']())),
                      a9 = (a4['position']['set'](0, -a9['y'] / 2, 0),
                        renderer['domElement']['width']),
                      aa = renderer['domElement']['height'],
                      ab = renderer['domElement']['width'],
                      ac = renderer['domElement']['height'],
                      ad = camera['fov'],
                      ab, ac;
                    renderer['setSize'](ab = 400, ac = 400),
                      camera['aspect'] = 1,
                      camera['fov'] = 20,
                      camera['updateProjectionMatrix']();
                    let ak = Math['PI'] / 6;
                    var ae = null,
                      af = false,
                      ag = (a4['updateWorldMatrix'](true, true),
                        a4['box']['update'](),
                        new THREE['Sphere']()),
                      ah = new THREE['Box3']()['copy'](a4['box']),
                      ah = (ah['getBoundingSphere'](ag),
                        ah['getSize'](new THREE['Vector3']())),
                      ai = camera['fov'] * Math['PI'] / 180,
                      ai = ag['radius'] / Math['sin'](ai / 2),
                      aj, ai = new THREE['Vector3'](Math['sin'](ak), 0, Math['cos'](ak))['multiplyScalar'](ai)['add'](
                        ag['center']);
                    if (controls['target']['copy'](ag['center']),
                      camera['position']['copy'](ai),
                      camera['position']['y'] = camera['position']['y'] + 0.8 * ah['y'],
                      camera['lookAt'](ag['center']),
                      a4['userData']['sizes_items']) {
                      for (let am = 0; am < a4['userData']['sizes_items']['length']; am++)
                        a4['userData']['sizes_items'][am]['visible'] = false;
                    }
                    if (a4['userData']['parts']['size']) {
                      for (let an = 0; an < a4['userData']['parts']['size']['length']; an++)
                        a4['userData']['parts']['size'][an]['visible'] = false;
                    }
                    room['hide'](),
                      controls['update']();
                    var ai = document['createElement']('canvas'),
                      ah = (ai['width'] = 400,
                        ai['height'] = 400,
                        renderer['render'](scene, camera),
                        ai['getContext']('2d')),
                      ag = (renderer['render'](scene, camera),
                        ah['drawImage'](renderer['domElement'], 0, 0, renderer['domElement']['width'], renderer[
                          'domElement']['height'], 0, 0, 400, 400),
                        ai['toDataURL']('image/jpg', 0.8)),
                      ah = (a5['item_meta']['icon'] = '',
                        a5['$options']['icon_file'] = ag,
                        a5['$options']['icon_file_object'] = al(ag, 'make_icon.jpg'),
                        a5['has_icon_file'] = 1,
                        glob['base_url'] + '/catalog/save_icon/' + glob['controller_name'] + '/' + glob['item_id']),
                      ai = new FormData(),
                      ag = (ai['append']('icon', al(ag, 'icon.jpg')),
                        await promise_request_post(ah, ai));
                    if (controls['target']['set'](a7['x'], a7['y'], a7['z']),
                      camera['position']['set'](a6['x'], a6['y'], a6['z']),
                      a4['position']['set'](a8['x'], a8['y'], a8['z']),
                      renderer['setSize'](a9, aa),
                      camera['aspect'] = a9 / aa,
                      camera['fov'] = ad,
                      camera['updateProjectionMatrix'](),
                      room['show'](),
                      controls['update'](),
                      a4['userData']['sizes_items']) {
                      for (let ao = 0; ao < a4['userData']['sizes_items']['length']; ao++)
                        a4['userData']['sizes_items'][ao]['visible'] = true;
                    }
                    if (a4['userData']['parts']['size']) {
                      for (let ap = 0; ap < a4['userData']['parts']['size']['length']; ap++)
                        a4['userData']['parts']['size'][ap]['visible'] = true;
                    }

                    function al(aq, ar) {
                      var aq = aq.split(','),
                        as = aq[0]['match'](/:(.*?);/)[1],
                        at = atob(aq[1]);
                      let au = at.length;
                      for (var av = new Uint8Array(au); au--;)
                        av[au] = at['charCodeAt'](au);
                      return new File([av], ar, {
                        'type': as
                      });
                    }
                    a5['edges']['is_on'] = true,
                      a5['edges_mode'](),
                      Vue['set'](a5['item'], 'icon', 'files/auto_icons/' + glob['controller_name'] + '/' + ag),
                      this['$refs']['icon']['url'] = 'files/auto_icons/' + glob['controller_name'] + '/' + ag;
                  }
                }
              },
              'process_icon_file': function(a3) {
                a3['target']['files']['length'] ? check_filename(a3['target']['files'][0]) ? (this['item_meta'][
                    'icon'] = '',
                  this['$options']['icon_file'] = URL['createObjectURL'](a3['target']['files'][0]),
                  this['$options']['icon_file_object'] = a3['target']['files'][0],
                  this['has_icon_file'] = 1) : (a3['target']['value'] = '',
                  alert(document['getElementById']('lang_incorrect_chars_in_file_name')['innerHTML'])) : (this[
                    '$options']['icon_file'] = null,
                  this['$options']['icon_file_object'] = null,
                  this['has_icon_file'] = 0);
              },
              'get_icon_src': function() {
                var a3;
                return this['item_meta']['icon'] || this['has_icon_file'] ? this['has_icon_file'] ? this['$options'][
                    'icon_file'
                  ] : this['item_meta']['icon'] ? (a3 = this['item_meta']['icon']['toLowerCase']())['startsWith'](
                    'https://') || a3['startsWith']('http://') ? this['item_meta']['icon'] : '' + glob['acc_url'] +
                  this['item_meta']['icon'] : '' : location['origin'] +
                  '/common_assets/images/placeholders/125x125.png';
              },
              'remove_icon': function() {
                this['item_meta']['icon'] = '',
                  this['$options']['icon_file'] = null,
                  this['$options']['icon_file_object'] = null,
                  this['has_icon_file'] = 0,
                  this['$refs']['icon_file']['value'] = '';
              },
              'emit_update': function() {
                var a3 = this['item'] ? copy_object(this['item']) : {};
                this['$root']['$emit']('configurator_update', a3);
              },
              'get_item_data': function() {
                q && this['var_tree_save']();
                var a3 = copy_object(this['item']),
                  a4 = a3['resizable']['minmax'],
                  a5;
                if (a4['min']['x'] = parseFloat(a4['min']['x']),
                  a4['min']['y'] = parseFloat(a4['min']['y']),
                  a4['min']['z'] = parseFloat(a4['min']['z']),
                  a4['max']['x'] = parseFloat(a4['max']['x']),
                  a4['max']['y'] = parseFloat(a4['max']['y']),
                  a4['max']['z'] = parseFloat(a4['max']['z']),
                  a3['spec']['mat_groups']) {
                  for (var a6 of a3['spec']['mat_groups'])
                    if (delete a6['vue_id'],
                      a6['available']) {
                      for (var a7 of a6['available'])
                        if (delete a7['vue_id'],
                          a7['thickness']) {
                          for (let ac = 0; ac < a7['thickness']['length']; ac++)
                            a7['thickness'][ac] = parseFloat(a7['thickness'][ac]);
                        }
                    }
                }
                for (a5 of a3['spec']['templates'])
                  module_utils['remove_nested_modules'](a5['template']['tree']);
                a3['spec']['selected_template'] = -1,
                  delete a3['selected_variant'],
                  a3['spec']['variants'] && !a3['spec']['variants'][a3['spec']['selected_variant']] && (a3['spec'][
                    'selected_variant'
                  ] = 0);
                var a8 = a3['variables']['global'] || [],
                  a9;
                for (let ad = 0; ad < a8.length; ad++) {
                  var aa = a8[ad];
                  a8[ad] = {
                    'key': aa['key'],
                    'value': aa['value'],
                    'editable': aa['editable'],
                    'local': aa['local'],
                    'fixed': aa['fixed'],
                    'disabled_values': aa['disabled_values']
                  };
                }
                for (a9 of Object['keys'](a3['variables']['main'] || {})) {
                  var ab = a3['variables']['main'][a9];
                  delete ab['is_global'],
                    delete ab['title'];
                }
                return Object['keys'](a3['variables']['apply'] || {})['length'] || delete a3['variables']['apply'],
                  Object['keys'](a3['variables']['override'] || {})['length'] || delete a3['variables']['override'],
                  Object['keys'](a3['variables']['global'] || [])['length'] || delete a3['variables']['global'],
                  a3;
              },
              'get_meta_data': function() {
                var a3 = copy_object(this['item_meta']),
                  a4 = (a3['icon_file'] = this['has_icon_file'] ? this['$options']['icon_file_object'] : null,
                    this['item']),
                  a5 = a4['spec']['variants']?.[a4['spec']['selected_variant']];
                return a3['name'] = a4['name'] || a5?.['name'] || '',
                  a3['code'] = a5?.['code'] || '',
                  a3;
              },
              'reset_tree': function() {
                var a3 = this['$root']['$selected_object'],
                  a4 = this['get_object_hierarchy'](a3['userData']['params']),
                  a5 = copy_object(this['item']),
                  a6;
                this['selected_path'] = '',
                  this['selected_path_root_fill'] = '';
                for (a6 of Object['values'](a5['variables']?.['main'] || {}))
                  a6['type'] || (a6['type'] = 'number',
                    a6['params'] = copy_object(this['$options']['var_params'][a6['type']]));
                Vue['set'](this['item'], 'variables', a5['variables']),
                  Vue['set'](this, 'computed', copy_object(a3['userData']['computed'])),
                  Vue['set'](this, 'nodes', [a4]),
                  Vue['nextTick'](() => {
                    this['update_tree_title']();
                  });
              },
              'reset_tree_var': function() {
                this['node_var_selected'](null, null, null);
                var a3 = this['get_object_variables'](this['item']['variables']);
                this['selected_path'] = '',
                  this['selected_path_root_fill'] = '',
                  this['nodes_variable'] = copy_object([a3]);
              },
              'init_variables': function() {
                this['get_object_variables']();
              },
              'get_object_variables'(a3, a4 = true) {
                var a5 = this['var_tree_build'](true),
                  a6 = JSON['parse'](JSON['stringify'](a5));
                return (q = [])['push'](a6),
                  this['$root']['$vartree_object'] = q,
                  a5;
              },
              'find_global_var_or_default'(a3) {
                var a4 = pp['variables']['current'];
                let a5 = _['find'](a4, a6 => a6['key'] == a3);
                return a5 = a5 || {
                  'key': a3,
                  'name': '',
                  'params': copy_object(this['$options']['var_params']['number']),
                  'type': 'number'
                };
              },
              'var_tree_build': function(a3) {
                var a4 = this['item']['variables'] || {},
                  a5 = a4?.['tree'];
                let a6 = a4?.['main'] || {},
                  a7 = a4?.['global'] || [];
                var a8 = pp['variables']['current'],
                  a9;
                let aa = [];
                return _['isEmpty'](a5) || (aa = copy_object(a5))['forEach'](ab => {
                  let ac = {},
                    ad = {
                      'visible': 1,
                      'active': 1
                    };
                  var ae, ae;
                  null == ab['children'] ? 1 == ab['is_global'] ? (ae = {
                      'type': 'global_variable'
                    },
                    ab['id'] = this['generate_obj_id'](),
                    ab['v_type'] = ab['type'],
                    ab['children'] = [],
                    ab['preventChildren'] = true,
                    ac = a7['find'](af => af['key'] == ab['key']),
                    (global_data = copy_object(this['find_global_var_or_default'](ab['key'])))['value'] = null,
                    merge(ab, global_data, ac, ad, ae),
                    ab['title'] = ab['name']) : 1 == ab['is_group'] ? (ab['id'] = this['generate_obj_id'](),
                    ab['type'] = 'group_variable',
                    ab['key'] = translit(ab['name'])['toLowerCase']()['replaceAll']('\x20', '_'),
                    ab['title'] = ab['name'],
                    ab['children'] = [],
                    merge(ab, ad)) : (ae = {
                      'type': 'variable'
                    },
                    ab['id'] = this['generate_obj_id'](),
                    ab['is_global'] = 0,
                    ab['children'] = [],
                    ab['preventChildren'] = true,
                    ac = a6[ab['key']],
                    ab['v_type'] = ac?.['type'],
                    merge(ab, ac, ae, ad)) : (ab['id'] = this['generate_obj_id'](),
                    ab['title'] = ab['name'],
                    ab['type'] = 'group_variable',
                    ab['key'] = translit(ab['name'])['toLowerCase']()['replaceAll']('\x20', '_'),
                    ab['level'] = 1,
                    ab['isLeaf'] = true,
                    ab['expanded'] = true,
                    merge(ab, ad),
                    ab['children']['forEach'](af => {
                      var ag, ag;
                      1 == af['is_global'] ? (ac = a7['find'](ah => ah['key'] == af['key']),
                        ag = {
                          'type': 'global_variable'
                        },
                        af['id'] = this['generate_obj_id'](),
                        af['v_type'] = af['type'],
                        af['children'] = [],
                        af['preventChildren'] = true,
                        (global_data = copy_object(this['find_global_var_or_default'](af['key'])))['value'] =
                        null,
                        merge(af, global_data, ac, ad, ag),
                        af['title'] = af['name']) : (ag = {
                          'type': 'variable',
                          'v_type': (ac = a6[af['key']])?.['type'],
                          'children': [],
                          'preventChildren': true
                        },
                        af['id'] = this['generate_obj_id'](),
                        merge(af, ac, ag, ad));
                    }));
                }), {
                  'id': this['generate_obj_id'](),
                  'title': 'Переменные',
                  'name': '',
                  'type': 'root',
                  'visible': 1,
                  'active': 1,
                  'children': aa
                };
              },
              'init_fill_sections'(a3, a4) {
                if ('module' === a3?.['type']) {
                  a3['spec'] || (a3['spec'] = {}),
                    a3['spec']['fill_content'] || (a3['spec']['fill_content'] = {}),
                    a3['spec']['fill_content'] = fix_json_empty_object(a3['spec']['fill_content']);
                  var a5 = pp['libs']['catalogs'][a3['spec']['element_type']]?.['get_item'](a3['spec']['id'])?.[
                      'params'] || {},
                    a5 = module_utils['find_fill_sections'](a5),
                    a6 = a3['spec']['fill_content'],
                    a7, a8, a9, a9, aa, ab;
                  for (a7 of Object['values'](a6))
                    delete a7['temp_index'];
                  let ac = 0;
                  for (a8 of a5) {
                    a8['section_key'] && (a6[a9 = a8['section_key']] || (a6[a9] = {
                        'name': '',
                        'key': a9,
                        'temp_index': -1,
                        'children': []
                      }),
                      a6[a9]['name'] = a8['name'],
                      a6[a9]['temp_index'] = ac,
                      a4 && (a9 = {
                          'id': this['generate_obj_id'](),
                          'title': (a8['name'] || '(' + a8['type'] + ')') + ('\x20(' + a9 + ')'),
                          'name': a8['name'],
                          'type': 'fake_section',
                          'section_key': a9,
                          'visible': 1,
                          'active': 1,
                          'has_condition': 0,
                          'has_comments': 0,
                          'children': a6[a9]['children'] ? copy_object(a6[a9]['children']) : [],
                          'disableDrag': true
                        },
                        a4.push(a9)),
                      ac++);
                  }
                  for (aa of Object['values'](a6)) {
                    void 0 === aa['temp_index'] && (a4 && (ab = {
                          'id': this['generate_obj_id'](),
                          'title': (aa['name'] || '(fill_section)') + ('\x20(' + aa['key'] + ')'),
                          'name': aa['name'],
                          'type': 'fake_section',
                          'section_key': aa['key'],
                          'visible': 1,
                          'active': 1,
                          'has_condition': 0,
                          'has_comments': 0,
                          'children': aa['children'] ? copy_object(aa['children']) : [],
                          'disableDrag': true
                        },
                        a4.push(ab)),
                      aa['temp_index'] = ac,
                      ac++);
                  }
                }
              },
              'get_object_hierarchy'(a3, a4 = true) {
                if (!a3)
                  return null;
                var a5 = [],
                  a6 = (a4 ? _['get'](a3, 'spec.template.tree') : a3['children']) || [],
                  a7 = a3,
                  a4 = ('module' === a7['type'] || 'furniture' === a7['type']) && !a4;
                if (!a4)
                  for (var a8 of a6) {
                    var a8 = this['get_object_hierarchy'](a8, false);
                    a8 && a5.push(a8);
                  }
                if (a4 && 'module' === a7['type']) {
                  this['init_fill_sections'](a7, a5);
                  for (var a9 of a5)
                    if (a9['children']?.['length']) {
                      var aa = [],
                        ab;
                      for (ab of a9['children']) {
                        var ac = this['get_object_hierarchy'](ab, false);
                        ac && aa.push(ac);
                      }
                      a9['children'] = aa;
                    }
                }
                var a6 = {
                  'id': this['generate_obj_id'](),
                  'title': a3['name'] || a7['name'] || '(' + a7['type'] + ')',
                  'name': a3['name'] || a7['name'],
                  'type': a7['type'],
                  'visible': void 0 !== a7['visible'] ? a7['visible'] : 1,
                  'active': void 0 !== a7['active'] ? a7['active'] : 1,
                  'has_condition': a7['condition']?.[0]?.[0] ? 1 : 0,
                  'has_comments': is_empty_id(a7['comments']) ? 0 : 1,
                  'children': a5
                };
                return a4 && 'module' === a7['type'] && (a6['expanded'] = false),
                  (a4 && 'module' !== a7['type'] || !C[a6['type']]) && (a6['preventChildren'] = true),
                  a6;
              },
              'prepare_params'(a3) {
                if (!a3)
                  return null;
                var a4 = [],
                  a5 = a3['children'] || [],
                  a6 = a3;
                if ('module' === a6['type']) {
                  this['init_fill_sections'](a6, a4);
                  for (var a7 of a4)
                    if (a7['children']?.['length']) {
                      var a8 = [],
                        a9;
                      for (a9 of a7['children']) {
                        var aa = this['prepare_params'](a9);
                        aa && a8.push(aa);
                      }
                      a7['children'] = a8;
                    }
                } else
                  for (var ab of a5) {
                    var ab = this['prepare_params'](ab);
                    ab && a4.push(ab);
                  }
                var a5 = {
                  'id': this['generate_obj_id'](),
                  'title': a3['name'] || a6['name'] || '(' + a6['type'] + ')',
                  'name': a3['name'] || a6['name'],
                  'type': a6['type'],
                  'visible': void 0 !== a6['visible'] ? a6['visible'] : 1,
                  'active': void 0 !== a6['active'] ? a6['active'] : 1,
                  'has_condition': a6['condition']?.[0]?.[0] ? 1 : 0,
                  'has_comments': is_empty_id(a6['comments']) ? 0 : 1,
                  'children': a4
                };
                return 'module' === a5['type'] && (a5['expanded'] = false),
                  'module' === a5['type'] || C[a5['type']] || (a5['preventChildren'] = true),
                  a5;
              },
              'get_default_module_params'(a3) {
                var a4, a5 = {
                    'type': 'module',
                    'size': {
                      'x': 300,
                      'y': 400,
                      'z': 200
                    },
                    'spec': {
                      'cabinet_tag': '',
                      'cabinet_group': 'bottom',
                      'drag_mode': 'common',
                      'element_type': 'module',
                      'catalog_type': '',
                      'mat_groups': [],
                      'selected_variant': 0,
                      'variants': [{
                        'code': '',
                        'name': '',
                        'size': {
                          'x': 0,
                          'y': 0,
                          'z': 0
                        },
                        'price': 0,
                        'default': 1,
                        'active': 1,
                        'accessories': []
                      }],
                      'selected_template': -1,
                      'templates': [{
                        'name': '',
                        'code': '',
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
                          'tree': [],
                          'variables': {},
                          'accessories': []
                        }
                      }],
                      'module_types': {}
                    },
                    'variables': {
                      'visible': 1,
                      'main': {}
                    }
                  },
                  a6;
                a3 && merge(a5, a3);
                for (a6 of (a5 = merge(copy_object(pp['engine']['item_def_params'][a5['type']] || def_cabinet_section),
                    a5))['spec']['templates'])
                  this['prepare_template_tree'](a6['template']['tree']);
                return a5;
              },
              'prepare_template_tree'(a3) {
                if (a3 && a3.length)
                  for (let aa = 0; aa < a3.length; aa++) {
                    var a4 = a3[aa];
                    a4['type'] || (a4['type'] = 'section');
                    let ab = a4;
                    if ('module' === ab['type'] && ab['spec']['id']) {
                      void 0 !== ab['variables'] && void 0 !== ab['variables']['main'] && delete ab['variables'][
                          'main'
                        ],
                        ab['variables'] || (ab['variables'] = {});
                      var a5 = pp['libs']['catalogs'][ab['spec']['element_type']]?.['get_item'](ab['spec']['id'])?.[
                          'params'
                        ] || {},
                        a5 = (ab['variables']['main'] = fix_json_empty_object(copy_object(a5['variables']?.['main'] ||
                            {})),
                          this['init_fill_sections'](ab),
                          ab['spec']?.['fill_content'] || {}),
                        a6;
                      for (a6 of Object['values'](a5))
                        if (a6['children']?.['length']) {
                          var a7 = [],
                            a8;
                          for (a8 of a6['children']) {
                            var a9 = [a8],
                              a9 = (this['prepare_template_tree'](a9),
                                a9[0]);
                            a9 && a7.push(a9);
                          }
                          a6['children'] = a7;
                        }
                    } else
                      ab = merge(copy_object(pp['engine']['item_def_params'][a4['type']] || def_cabinet_section), a4);
                    'fill_section' === ab['type'] && (ab['fill'] || (ab['fill'] = {}),
                        ab['fill'] = fix_json_empty_object(ab['fill'] || {}),
                        ab['spec'] = fix_json_empty_object(ab['spec'] || {})),
                      a3[aa] = ab,
                      this['prepare_template_tree'](ab['children']);
                  }
              },
              'calc_path_array'(a3) {
                var a4 = this['$refs']['hierarchy_tree_ref']['api'],
                  a5;
                if (!a4)
                  return null;
                if (!a4['getNode'](a3))
                  return null;
                var a6 = [],
                  a7 = a3;
                let a8 = a4['calcRelativeIndex'](a3);
                for (a6.push(a8['rIndex']); a8['parent'];)
                  a7 = a8['parentIndex'],
                  a8 = a4['calcRelativeIndex'](a7),
                  a6.push(a8['rIndex']);
                return a6['reverse']();
              },
              'calc_var_path_array'(a3) {
                var a4 = this['$refs']['var_tree_ref']['api'],
                  a5;
                if (!a4)
                  return null;
                if (!a4['getNode'](a3))
                  return null;
                var a6 = [],
                  a7 = a3;
                let a8 = a4['calcRelativeIndex'](a3);
                for (a6.push(a8['rIndex']); a8['parent'];)
                  a7 = a8['parentIndex'],
                  a8 = a4['calcRelativeIndex'](a7),
                  a6.push(a8['rIndex']);
                return a6['reverse']();
              },
              'swap_arr_elements'(a3, a4, a5) {
                a3[a4] = a3['splice'](a5, 1, a3[a4])[0];
              },
              'get_style': function(a3) {
                return 'x' == a3 ? {
                  'color': '#e10000'
                } : 'y' == a3 ? {
                  'color': '#67952c'
                } : 'z' == a3 ? {
                  'color': '#4c95f7'
                } : {};
              },
              'filter_chars': function(a3) {
                return a3.replace(/[^a-zA-Z0-9_]/g, '');
              },
              'get_random_id': function() {
                var a3 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let a4 = '';
                for (let a5 = 0; a5 < 8; a5++)
                  a4 += a3['charAt'](Math['floor'](Math['random']() * a3.length));
                return a4;
              },
              'generate_obj_id': function() {
                return Math['random']()['toString'](36)['substr'](2, 9);
              },
              'lang': function(a3) {
                return glob['lang'][a3];
              },
              'create_plane'(a3, a4) {
                var a5, a6, a5, a7, a8, a9, aa, a7, a8, a5, ab, ac, ad, ae, af, ag, ah, ai, ah, ah, ai, a3, ai, a3, ai,
                  a3;
                a3['userData']['embedPlane'] && (a3['userData']['own_object']['remove'](a3['userData']['embedPlane']),
                    a3['userData']['embedPlane']['geometry']['dispose'](),
                    a3['userData']['embedPlane']['material']['dispose'](),
                    a3['userData']['embedPlane'] = null),
                  a4 && (a5 = {
                    'z': {
                      'pos': [0, 0, -(a5 = a3['userData']['computed']['u_size']['clone']())['z'] / 2],
                      'size': [a5['x'], a5['y']],
                      'normal': [0, 0, 1]
                    },
                    '-z': {
                      'pos': [0, 0, a5['z'] / 2],
                      'size': [a5['x'], a5['y']],
                      'normal': [0, 0, -1]
                    },
                    'x': {
                      'pos': [-a5['x'] / 2, 0, 0],
                      'size': [a5['z'], a5['y']],
                      'normal': [1, 0, 0]
                    },
                    '-x': {
                      'pos': [a5['x'] / 2, 0, 0],
                      'size': [a5['z'], a5['y']],
                      'normal': [-1, 0, 0]
                    },
                    'y': {
                      'pos': [0, -a5['y'] / 2, 0],
                      'size': [a5['x'], a5['z']],
                      'normal': [0, 1, 0]
                    },
                    '-y': {
                      'pos': [0, a5['y'] / 2, 0],
                      'size': [a5['x'], a5['z']],
                      'normal': [0, -1, 0]
                    }
                  } [a4]) && (a7 = new THREE['PlaneGeometry'](a5['size'][0], a5['size'][1]),
                    a8 = new THREE['MeshBasicMaterial']({
                      'color': 16776960,
                      'transparent': true,
                      'opacity': 0.4,
                      'side': THREE['DoubleSide'],
                      'depthTest': false,
                      'depthWrite': false
                    }),
                    [a9, aa] = a5['size'],
                    (a7 = new THREE['Mesh'](a7, a8))['position']['set'](...a5['pos']),
                    a7['lookAt'](a5['pos'][0] + a5['normal'][0], a5['pos'][1] + a5['normal'][1], a5['pos'][
                      2] + a5['normal'][2]),
                    a7['userData']['directionKey'] = a4,
                    a3['_hide_helpers'](),
                    a3['userData']['own_object']['add'](a7),
                    a3['userData']['embedPlane'] = a7,
                    a3['userData']['own_object']['updateWorldMatrix'](true, true),
                    a7['updateWorldMatrix'](true, true),
                    a8 = new THREE['Vector3'](),
                    a5 = new THREE['Quaternion'](),
                    ab = a7['matrixWorld']['clone'](),
                    ac = new THREE['Matrix4']()['copy'](ab)['invert'](),
                    a7['getWorldPosition'](a8),
                    a7['getWorldQuaternion'](a5),
                    ad = new THREE['Vector3'](0, 0, 1)['applyQuaternion'](a5)['normalize'](),
                    ae = new THREE['Vector3'](1, 0, 0)['applyQuaternion'](a5)['normalize'](),
                    af = new THREE['Vector3'](0, 1, 0)['applyQuaternion'](a5)['normalize'](),
                    ag = new THREE['Plane']()['setFromNormalAndCoplanarPoint'](ad, a8),
                    ah = 0.02 * Math['min'](a9, aa),
                    ai = new THREE['LineBasicMaterial']({
                      'color': 0,
                      'linewidth': 1,
                      'depthTest': true,
                      'depthWrite': false
                    }),
                    ah = new THREE['BufferGeometry']()['setFromPoints']([new THREE['Vector3'](-ah, 0, 0), new THREE[
                      'Vector3'](ah, 0, 0), new THREE['Vector3'](0, -ah, 0), new THREE['Vector3'](0, ah,
                      0)]),
                    ah = new THREE['LineSegments'](ah, ai),
                    a7['add'](ah),
                    a3['userData']['crossHelper'] = ah,
                    ai = new THREE['BufferGeometry']()['setFromPoints']([new THREE['Vector3'](-a9 / 2, 0, 0),
                      new THREE['Vector3'](a9 / 2, 0, 0)
                    ]),
                    a3 = new THREE['LineBasicMaterial']({
                      'color': 0,
                      'transparent': true,
                      'opacity': 0.3,
                      'depthTest': true,
                      'depthWrite': false
                    }),
                    ai = new THREE['Line'](ai, a3),
                    a7['add'](ai),
                    a3 = new THREE['BufferGeometry']()['setFromPoints']([new THREE['Vector3'](0, -aa / 2, 0),
                      new THREE['Vector3'](0, aa / 2, 0)
                    ]),
                    ai = new THREE['LineBasicMaterial']({
                      'color': 0,
                      'transparent': true,
                      'opacity': 0.3,
                      'depthTest': true,
                      'depthWrite': false
                    }),
                    a3 = new THREE['Line'](a3, ai),
                    a7['add'](a3),
                    global_options['mouse_mode']['planeInfo'] = {
                      'dir': a4,
                      'plane_pos': a8,
                      'plane_quat': a5,
                      'plane_matrixWorld': ab,
                      'plane_matrixWorldInvert': ac,
                      'halfU': a9 / 2,
                      'halfV': aa / 2,
                      'nWorld': ad,
                      'uAxisWorld': ae,
                      'vAxisWorld': af,
                      'plane_mathPlane': ag,
                      'crossHelper': ah
                    });
              },
              'hover_face'(a3) {
                var a4 = this['$root']['$selected_object'],
                  a4 = module_utils['get_child_by_path'](a4, this['convert_item_path_to_module'](this[
                  'selected_path']));
                (a4 instanceof CabinetWall || a4 instanceof CabinetSection) && this['create_plane'](a4, a3);
              },
              'change_add_plane': function(a3) {
                if ('furniture' === this['modal_add']['type']) {
                  this['clear_embed_mode']();
                  var a4 = this['$root']['$selected_object'],
                    a4 = module_utils['get_child_by_path'](a4, this['convert_item_path_to_module'](this[
                      'selected_path'])),
                    a5, a3 = {
                      'z': {
                        'normal': [0, 0, -1]
                      },
                      '-z': {
                        'normal': [0, 0, 1]
                      },
                      'x': {
                        'normal': [-1, 0, 0]
                      },
                      '-x': {
                        'normal': [1, 0, 0]
                      },
                      'y': {
                        'normal': [0, -1, 0]
                      },
                      '-y': {
                        'normal': [0, 1, 0]
                      }
                    } [this['modal_add']['plane'] = a3];
                  if (a3) {
                    var a3 = new THREE['Vector3'](...a3['normal'])['applyQuaternion'](a4['getWorldQuaternion'](
                        new THREE['Quaternion']()))['normalize'](),
                      a6 = new THREE['Vector3'](),
                      a7 = (new THREE['Box3']()['setFromObject'](a4)['getCenter'](a6),
                        1.15 * a4['userData']['computed']['u_size']['length']()),
                      a3 = a6['clone']()['add'](a3['multiplyScalar'](a7));
                    let a8 = camera['position']['clone'](),
                      a9 = controls['target']['clone'](),
                      aa = a3['clone'](),
                      ab = a6['clone'](),
                      ac = 0,
                      ad = 0.8,
                      ae = () => {
                        1 < (ac += 1 / 60 / ad) && (ac = 1),
                          camera['position']['lerpVectors'](a8, aa, ac),
                          controls['target']['lerpVectors'](a9, ab, ac),
                          controls['update'](),
                          ac < 1 && requestAnimationFrame(ae);
                      };
                    ae(),
                      this['opacity_material'](0.3, a4, ['wall', 'module', 'tabletop', 'model', 'butts', 'cokol',
                        'facade'
                      ]),
                      this['create_plane'](a4, this['modal_add']['plane']);
                  }
                }
              },
              'opacity_material'(a3 = 1, a4 = null, a5 = null) {
                if ('edges' != global_options['mode']) {
                  let a7 = this['$root']['$selected_object'];
                  var a6;
                  a7?.['userData']?.['parts'] && (a5 = a5 || ['wall', 'module', 'tabletop', 'model', 'butts', 'cokol',
                      'facade'
                    ],
                    (a6 = Object['keys'](a7['userData']['parts'])['filter'](a8 => a5['includes'](a8)))['forEach'](
                      a8 => {
                        var a9;
                        a7['userData']['parts'][a8]['forEach'](aa => {
                          aa['userData']['path'] !== a4?.['userData']?.['path'] && aa?.['userData']?.[
                            'own_object']?.['children'] && aa['userData']['own_object']['children']['forEach'](
                            ab => {
                              ab['material'] && (ab['material']['transparent'] = a3 < 1,
                                ab['material']['needsUpdate'] = a3 < 1,
                                ab['material']['opacity'] = a3);
                            }
                          );
                        });
                      }
                    ));
                }
              },
              'embed_mode'() {
                if (this['clear_embed_mode'](),
                  this['modal_add']['plane'] && this['modal_add']['model_id'] && !this['embed']['is_on']) {
                  this['embed']['is_on'] = true;
                  var a3 = this['$root']['$selected_object'],
                    a3 = module_utils['get_child_by_path'](a3, this['convert_item_path_to_module'](this[
                      'selected_path'])),
                    a4 = (global_options['mouse_mode']['mode'] = 'embed',
                      global_options['mouse_mode']['target_embed'] = a3,
                      global_options['mouse_mode']['plane'] = this['modal_add']['plane'],
                      global_options['mouse_mode']['planeInfo'] || this['create_plane'](a3, this['modal_add']['plane']),
                      []),
                    a3, a5, a5, a5, a5;
                  let ag;
                  if ('furniture' != this['modal_add']['type'] && 'module' != this['modal_add']['type'] || (a3 =
                      copy_object(def_cabinet_furniture),
                      'module' == this['modal_add']['type'] && (a5 = pp['libs']['catalogs'][this['modal_add'][
                          'model_type'
                        ]]['get_item'](this['modal_add']['model_id'])['params'],
                        a5 = sc['add_object']('module', a5),
                        ag = a5),
                      'furniture' == this['modal_add']['type'] && (a5 = pp['libs']['furniture']['find_item'](this[
                          'modal_add']['model_id']),
                        a3['spec']['plane'] = this['modal_add']['plane'],
                        a3['children'] = a5['children'],
                        a3['spec']['id'] = a5['id'],
                        (a5 = copy_object(def_module))['size']['x'] = 0,
                        a5['size']['y'] = 0,
                        a5['size']['z'] = 0,
                        a5['spec']['variants'] = [{
                          'size': {
                            'x': 0,
                            'y': 0,
                            'z': 0
                          }
                        }],
                        a5['spec']['templates'] = [{
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
                            'tree': [a3]
                          }
                        }],
                        ag = sc['add_object']('module', a5)),
                      dControls['s_helper']['hide'](),
                      global_options['mouse_mode']['embed_obj'] = ag),
                    0 < ag?.['userData']?.['parts']?.['furniture']?.['length'])
                    for (let ah = 0; ah < ag['userData']['parts']['furniture']['length']; ah++) {
                      var a6 = ag['userData']['parts']['furniture'][ah],
                        a7 = a6?.['userData']?.['params']?.['spec']?.['setup_type'];
                      if (a7) {
                        var a8 = [];
                        for (let ai = 0; ai < a6['userData']['children']['length']; ai++) {
                          var a9, aa = a6['userData']['children'][ai]?.['userData']?.['params']?.['spec']?.[
                            'direction'],
                            ab, ac;
                          if (aa) {
                            for (ac of Array.isArray(aa) ? aa : [aa])
                              a8['includes'](ac) || a8.push(ac);
                          }
                        }
                        a4.push({
                          'index': ah,
                          'setup_type': a7,
                          'dirs': a8
                        });
                      }
                    }
                  if (0 < a4.length && global_options['mouse_mode']['planeInfo']) {
                    global_options['mouse_mode']['planeInfo']['furniture_info'] = a4;
                    var ad = ag['userData']['path'],
                      a3 = a4[0]?.['dirs'] || [];
                    if (0 === a3.length)
                      return new THREE['Vector3'](0, 0, 0);
                    var ae, a5 = dir_to_vector(a3[0]),
                      a3 = dir_to_vector(this['modal_add']['plane']);
                    if (!a5 || !a3)
                      return new THREE['Vector3'](0, 0, 0);
                    a5['normalize'](),
                      a3['normalize']();
                    var a5 = new THREE['Quaternion']()['setFromUnitVectors'](a5, a3),
                      a3 = new THREE['Euler']()['setFromQuaternion'](a5, 'XYZ'),
                      af;
                    if (rot = new THREE['Vector3'](Math['round'](THREE['MathUtils']['radToDeg'](-a3['x'])), Math[
                        'round'](THREE['MathUtils']['radToDeg'](-a3['y'])), Math['round'](THREE['MathUtils'][
                        'radToDeg'
                      ](-a3['z']))),
                      ag['userData']['params']['rot'] = rot,
                      ag['_rebuild'](),
                      0 < ag['userData']['parts']['hole']['length'])
                      for (let aj = 0; aj < ag['userData']['parts']['hole']['length']; aj++) {
                        ag['userData']['parts']['hole'][aj]['_show_helpers']();
                      }
                  }
                }
              },
              'embed_item'() {
                var a3 = global_options['mouse_mode']['target_embed'],
                  a4 = global_options['mouse_mode']['embed_obj'],
                  a5;
                if (a3 && a4 && a3['userData']['own_object']) {
                  var a4 = global_options['mouse_mode']['planeInfo'],
                    a6 = global_options['mouse_mode']['_embed_last_uv'];
                  if (a4 && a6) {
                    let ad = new THREE['Vector3']();
                    if (0 < a4?.['furniture_info']?.['length']) {
                      var a7 = a4?.['furniture_info'][0]?.['dirs'] || [];
                      if (0 === a7.length)
                        return new THREE['Vector3'](0, 0, 0);
                      var a8, a7 = dir_to_vector(a7[0]),
                        a9 = dir_to_vector(a4['dir']);
                      if (!a7 || !a9)
                        return new THREE['Vector3'](0, 0, 0);
                      a7['normalize'](),
                        a9['normalize']();
                      var a7 = new THREE['Quaternion']()['setFromUnitVectors'](a7, a9),
                        a9 = new THREE['Euler']()['setFromQuaternion'](a7, 'XYZ');
                      ad = new THREE['Vector3'](Math['round'](THREE['MathUtils']['radToDeg'](-a9['x'])), Math['round'](
                        THREE['MathUtils']['radToDeg'](-a9['y'])), Math['round'](THREE['MathUtils']['radToDeg'](-a9[
                        'z'])));
                    }
                    var aa = a3['userData']['computed']?.['size'];
                    if (aa) {
                      var ab = a6['u'] * units,
                        ac = a6['v'] * units;
                      let ae = 0,
                        af = 0,
                        ag = 0;
                      switch (a4['dir']) {
                        case 'z':
                          ae = ab + aa['x'] / 2,
                            af = ac + aa['y'] / 2,
                            ag = 0;
                          break;
                        case '-z':
                          ae = -ab + aa['x'] / 2,
                            af = ac + aa['y'] / 2,
                            ag = aa['z'];
                          break;
                        case 'x':
                          ae = 0,
                            x_str = '0',
                            af = ac + aa['y'] / 2,
                            ag = -ab + aa['z'] / 2;
                          break;
                        case '-x':
                          ae = aa['x'],
                            af = ac + aa['y'] / 2,
                            ag = ab + aa['z'] / 2;
                          break;
                        case 'y':
                          ae = ab + aa['x'] / 2,
                            af = 0,
                            ag = -ac + aa['z'] / 2;
                          break;
                        case '-y':
                          ae = ab + aa['x'] / 2,
                            af = aa['y'],
                            ag = ac + aa['z'] / 2;
                          break;
                        default:
                          return;
                      }
                      var a7 = {
                          'x': ae,
                          'y': af,
                          'z': ag
                        },
                        a9 = this['pos_to_param_formula'](a7, aa),
                        a3 = (this['modal_add']['params']['pos'] = a9,
                          this['modal_add']['params']['rot'] = ad,
                          module_utils['get_child_by_path'](global_options['mouse_mode']['embed_obj'], global_options[
                            'mouse_mode']['embed_obj']['userData']['path']));
                      this['opacity_material'](1, a3, ['wall', 'module', 'tabletop', 'model', 'butts', 'cokol',
                          'facade'
                        ]),
                        this['clear_embed_mode']();
                    }
                  }
                }
              },
              'pos_to_param_formula'(a3, a4) {
                let a5 = {};
                return ['x', 'y', 'z']['forEach'](a6 => {
                    var a7 = a3[a6],
                      a8, a9 = a7,
                      a7 = a4[a6] - a7;
                    a5[a6] = 0 === a9 ? '0' : 0 == a7 ? 's:' + a6 : a9 <= a7 ? '' + a9 : 's:' + a6 + '\x20-\x20' +
                      a7;
                  }),
                  a5;
              },
              'clear_embed_mode'() {
                var a3 = this['$root']['$selected_object'],
                  a3 = module_utils['get_child_by_path'](a3, this['convert_item_path_to_module'](this[
                  'selected_path'])),
                  a4 = global_options['mouse_mode']['embed_obj'];
                this['embed']['is_on'] = false,
                  this['embed']['fixed'] = false,
                  a4 && a4['delete'](),
                  a3?.['userData']?.['embedPlane'] && (a3['userData']['own_object']['remove'](a3['userData'][
                      'embedPlane'
                    ]),
                    a3['userData']['embedPlane']['geometry']['dispose'](),
                    a3['userData']['embedPlane']['material']['dispose'](),
                    a3['userData']['embedPlane'] = null),
                  global_options['mouse_mode'] = {
                    'mode': 'drag',
                    'target': null,
                    'style': null,
                    'radius': 0,
                    'active': false,
                    'item_id': null,
                    'notice': '',
                    'el': null,
                    'obj': null
                  };
              },
              'unable_embed_fix'() {
                this['embed']['fixed'] = false,
                  global_options['mouse_mode']['_embed_locked'] = false,
                  global_options['mouse_mode']['_embed_fixed_active'] = false;
              },
              'create_axes_widget'() {
                new THREE['OrbitControlsGizmo'](controls, {
                  'size': 150,
                  'padding': 8
                });
              }
}
}),
Vue['component']('SlickList', window['VueSlicksort']['SlickList']),
  Vue['component']('SlickItem', window['VueSlicksort']['SlickItem']),
  Vue['component']('DragHandle', window['VueSlicksort']['DragHandle']),
  Vue['component']('PpTree', window['PpTree']);
}

function add_module(f, g) {
  let h = {
    'type': 'module',
    'size': {
      'x': 300,
      'y': 500,
      'z': 200
    },
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
          'tree': [{
            'type': 'section',
            'name': 'section\x20A',
            'size': {
              'x': 's:x',
              'y': 's:y',
              'z': 's:z'
            },
            'c_rot': {
              'x': 0,
              'y': 0,
              'z': 0
            },
            'children': [{
              'type': 'animator',
              'spec': {
                'props': {
                  'ext_percent': 0.7,
                  'direction': 'ry'
                },
                'fn': 'rotate'
              },
              'size': {
                'x': 's:x',
                'y': 's:y',
                'z': 's:z'
              },
              'children': [{
                'type': 'wall',
                'name': 'wall',
                'size': {
                  'x': 's:x',
                  'y': 's:y',
                  'z': 's:z'
                }
              }]
            }]
          }, {
            'type': 'module',
            'spec': {
              'element_type': 'module',
              'id': 17,
              'can_change': {
                'id': 1
              }
            },
            'size': {
              'x': 's:x',
              'y': 's:y',
              'z': 's:z'
            }
          }]
        }
      }]
    }
  };
  f && (h = pp['libs']['catalogs'][g || 'module']['get_item'](f)['params']);
  var g = sc['add_object']('module', h, false);
  return g['position']['x'] = 150,
    g['position']['z'] = 150,
    g;
}

function test_module_perf() {
  var f = 1000,
    g = 70,
    h = 250;
  for (let k = 0; k < f; k++) {
    var j = add_module(10, 'module');
    j['position']['x'] = Math['floor'](181 * Math['random']()) + 70,
      j['position']['z'] = Math['floor'](181 * Math['random']()) + 70;
  }
}

function test_mat_group_perf() {
  for (var f of d_objects)
    f['change_material_group']({
      'group_key': 'ggg22',
      'mat_key': 'ldsp',
      'mat_id': 2,
      'mat_variant_id': 0,
      'mat_thickness': null,
      'obj_groups': ['bottom']
    });
}

function dir_to_vector(f) {
  switch (f) {
    case 'x':
      return new THREE['Vector3'](1, 0, 0);
    case '-x':
      return new THREE['Vector3'](-1, 0, 0);
    case 'y':
      return new THREE['Vector3'](0, 1, 0);
    case '-y':
      return new THREE['Vector3'](0, -1, 0);
    case 'z':
      return new THREE['Vector3'](0, 0, 1);
    case '-z':
      return new THREE['Vector3'](0, 0, -1);
    default:
      return null;
  }
}
interface_components_init.push(configurator_v2_init);
class Cornice extends THREE['Group'] {
  constructor(e) {
    super(e),
      this['type'] = 'Cornice',
      this['params'] = {
        'type': void 0 !== (e = e || {})['type'] ? e['type'] : 'straight',
        'model': void 0 !== e['model'] ? e['model'] : project_settings['selected_cornice_model'],
        'width': void 0 !== e['width'] ? e['width'] : void 0,
        'material': void 0 !== e['material'] ? e['material'] : void 0,
        'rotated_material': void 0 !== e['rotated_material'] && e['rotated_material'],
        'inner_angle': void 0 !== e['inner_angle'] && e['inner_angle'],
        'angle_left': void 0 !== e['angle_left'] ? e['angle_left'] : 0,
        'angle_right': void 0 !== e['angle_right'] ? e['angle_right'] : 0,
        'offset_type': void 0 !== e['offset_type'] ? e['offset_type'] : 'front',
        'orientation': void 0 !== e['orientation'] ? e['orientation'] : 'right'
      },
      this['model'] = new THREE['Group'](),
      this['add'](this['model']),
      this['build']();
  }
}
Cornice['prototype']['build'] = function() {
    this['pp_calc'] = {
        'width': this['params']['width'],
        'pos_offset': 0,
        'size_offset': 0,
        'left_offset': 0,
        'right_offset': 0
      },
      this['params']['depth'] || (this['params']['depth'] = cornice_lib['get_item'](this['params']['model'])['params'][
        'depth'
      ]),
      this['params']['height'] || (this['params']['height'] = cornice_lib['get_item'](this['params']['model'])['params']
        ['height']),
      this['params']['front_offset'] || (this['params']['front_offset'] = cornice_lib['get_item'](this['params'][
        'model'])['params']['front_offset']),
      this['pp_calc']['pos_offset'] = this['params']['front_offset'],
      this['pp_calc']['size_offset'] = this['params']['front_offset'];
    var f = this['params']['depth'] - this['pp_calc']['size_offset'],
      g, g;
    0 != this['params']['angle_left'] && (g = f * Math['tan'](Math['abs'](this['params']['angle_left'])),
        this['pp_calc']['width'] += g,
        this['pp_calc']['left_offset'] = g),
      0 != this['params']['angle_right'] && (g = f * Math['tan'](Math['abs'](this['params']['angle_right'])),
        this['pp_calc']['width'] += g,
        this['pp_calc']['right_offset'] = g),
      this['reset_model'](),
      this['load_model'](),
      this['model']['position']['y'] = this['params']['height'] / units / 2,
      this['model']['position']['z'] = this['params']['depth'] / units / 2 - this['pp_calc']['pos_offset'] / units,
      this['model']['position']['x'] = (this['pp_calc']['right_offset'] - this['pp_calc']['left_offset']) / units / 2;
  },
  Cornice['prototype']['load_model'] = async function() {
      this['userData']['model'] = '',
        'straight' == this['params']['type'] && (this['userData']['model'] = cornice_lib['get_item'](this['params'][
          'model'
        ])['models']['common']),
        'radius' == this['params']['type'] && (this['userData']['model'] = cornice_lib['get_item'](this['params'][
          'model'
        ])['models']['radius']);
      var f = await load_model({
        'model': this['userData']['model'],
        'buffer': false
      });
      for (let h = 0; h < f.length; h++) {
        var g = f[h]['clone'](),
          g = new THREE['Mesh'](g, red_mat);
        g['castShadow'] = true,
          g['userData']['edgesModeType'] = ObjectType['Cornice'],
          this['model']['add'](g);
      }
      this['set_size'](this['pp_calc']['width']),
        this['apply_material'](),
        this['make_angle']();
    },
    Cornice['prototype']['make_angle'] = function() {
      var f, g, h, h, h, h;
      0 == this['params']['angle_left'] && 0 == this['params']['angle_right'] || (f = this['model']['children'][
        0],
        g = [],
        0 != this['params']['angle_left'] && ((h = new THREE['BoxBufferGeometry'](12, 20, 20))['translate'](-
            6, 0, -10),
          h['rotateY'](-this['params']['angle_left']),
          h['translate'](-this['pp_calc']['width'] / units / 2, 0, this['params']['depth'] / units / 2),
          (h = new THREE['Mesh'](h, red_mat))['userData']['edgesModeType'] = ObjectType['Cornice'],
          g.push(h)),
        0 != this['params']['angle_right'] && ((h = new THREE['BoxBufferGeometry'](12, 20, 20))['translate'](
            6, 0, -10),
          h['rotateY'](-this['params']['angle_right']),
          h['translate'](this['pp_calc']['width'] / units / 2, 0, this['params']['depth'] / units / 2),
          (h = new THREE['Mesh'](h, red_mat))['userData']['edgesModeType'] = ObjectType['Cornice'],
          g.push(h)),
        f['geometry'] = csggeom(f, g, 'subtract'));
    },
    Cornice['prototype']['apply_material'] = function() {
      var f = this;
      for (let l = 0; l < this['model']['children']['length']; l++) {
        var g = this['model']['children'][l];
        if (-1 < g['name']['indexOf']('v(2)') || -1 < g['name']['indexOf']('v(3)')) {
          let m = 'gen',
            n = f['params']['material'];
          var h = g['name']['match'](/m\((.*?)\)/),
            h = (null != h && (m = h[1]),
              void 0 === (n = 'gen' != m && facades_lib['items'][project_settings['defaults']['facades']['top']][
                  'additional_materials'
                ][h[1]] ? facades_lib['items'][project_settings['defaults']['facades']['top']]['additional_materials']
                [h[1]]['selected'] : n) && (n = project_settings['selected_materials']['cornice']),
              materials_lib['get_item'](n)),
            h = (h['add_params']['model_width'] = f['params']['width'],
              null == f['params']['width'] && (g['geometry']['computeBoundingBox'](),
                h['add_params']['model_width'] = (g['geometry']['boundingBox']['max']['x'] - g['geometry'][
                  'boundingBox']['min']['x']) * units),
              h['add_params']['model_height'] = 100,
              f['params']['rotated_material'] && (h['add_params']['rotation'] = 'rotated'),
              create_material(h)),
            h = new THREE['Mesh'](g, h);
          h['castShadow'] = true,
            h['userData']['edgesModeType'] = ObjectType['Cornice'],
            f['model']['add'](h);
        } else {
          let p = f['params']['material'];
          void 0 === f['params']['material'] && (p = (p = project_settings['selected_materials']['cornice']) ||
            project_settings['selected_materials']['facades'][project_settings['defaults']['facades']['top']]['gen'][
              'top'
            ]);
          var h = materials_lib['get_item'](p);
          h['add_params']['model_width'] = f['params']['width'],
            h['add_params']['model_height'] = 100,
            f['params']['rotated_material'] && (h['add_params']['rotation'] = 'rotated');
          let q = create_material(h);
          void 0 === project_settings['fixed_materials'] && (project_settings['fixed_materials'] = []);
          var j = project_settings['fixed_materials'];
          for (let u = 0; u < j.length; u++) {
            var k = u + 1,
              k; -
            1 < g['name']['indexOf']('mat' + k) && ((k = materials_lib['get_item'](j[u]))['add_params'][
              'model_width'] = f['params']['width'],
              k['add_params']['model_height'] = f['params']['height'],
              q = create_material(k));
          }
          g['material'] = q;
        }
      }
    },
    Cornice['prototype']['change_material'] = function(f, g) {
      this['params']['rotated_material'] = g = g || false;
      var h = materials_lib['get_item'](f);
      h['add_params']['model_width'] = this['params']['width'],
        h['add_params']['model_height'] = 100,
        this['params']['rotated_material'] && (h['add_params']['rotation'] = 'rotated');
      for (let i = 0; i < this['model']['children']['length']; i++)
        this['model']['children'][i]['material'] = create_material(h);
    },
    Cornice['prototype']['reset_model'] = function(f) {
      let g = f,
        h, j = [];
      if ((g = f ? g : this)['traverse'](function(k) {
          g !== k && 'Handle' !== k['type'] && 'Handle' !== k['parent']['type'] && 'Group' !== k['type'] && j.push(
            k);
        }),
        j.length) {
        for (h = j.length - 1; - 1 < h; h--)
          j[h]['parent']['remove'](j[h]),
          j[h]['geometry'] && j[h]['geometry']['dispose'](),
          j[h]['material'] && j[h]['material']['map'] && j[h]['material']['map']['dispose'](),
          j['splice'](j['indexOf'](j[h]), 1);
      }
    },
    Cornice['prototype']['set_size'] = function(f) {
      var g = this['model']['rotation']['clone'](),
        h = new THREE['Euler']()['setFromQuaternion'](this['model']['getWorldQuaternion'](new THREE['Quaternion']())[
          'clone']());
      if (this['model']['rotation']['set'](-1 * h['x'], -1 * h['y'], -1 * h['z']),
        'radius' != this['params']['type']) {
        var h = box3['setFromObject'](this['model'])['getSize'](new THREE['Vector3']())['clone'](),
          j = {
            'box': h,
            'diff': new THREE['Vector3'](f / units, 0, 0)['sub'](h)['divideScalar'](2),
            'width': f / units,
            'height': 0,
            'depth': 0,
            'is_handle': true
          };
        for (let m = 0; m < this['model']['children']['length']; m++)
          set_size_buff(this['model']['children'][m], this['model']['children'][m]['name'], j),
          correct_uv_buff(Model_utils['get_model_from_cache'](this['userData']['model'])['geometry'][m], this['model'][
            'children'
          ][m]['geometry']),
          this['model']['children'][m]['geometry']['attributes']['position']['needsUpdate'] = true,
          this['model']['children'][m]['geometry']['attributes']['uv']['needsUpdate'] = true;
      } else
        for (let n = 0; n < this['model']['children']['length']; n++) {
          var k = this['model']['children'][n]['geometry'],
            l = (k['computeBoundingBox'](),
              k['boundingBox']);
          'right' != this['params']['orientation'] ? (k['rotateY'](-Math['PI'] / 2),
            k['translate'](-Math['abs'](l['min']['x']), 0, -Math['abs'](l['max']['z']) + this['params']['depth'] /
              units / 2)) : k['translate'](Math['abs'](l['min']['x']), 0, -Math['abs'](l['max']['z']) + this[
            'params']['depth'] / units / 2);
        }
      this['model']['rotation']['copy'](g);
    };
class Decoration extends PPObject {
  constructor(e) {
      super(e);
      var f = this,
        e, e;
      this['type'] = 'Facade',
        !(this['params'] = {
          'width': void 0 !== (e = e || {})['width'] ? e['width'] : 600,
          'height': void 0 !== e['height'] ? e['height'] : 720,
          'thickness': void 0 !== e['thickness'] ? e['thickness'] : 180,
          'draggable': void 0 !== e['draggable'] && e['draggable'],
          'wall_distance': void 0 !== e['wall_distance'] ? e['wall_distance'] : 300,
          'model': void 0 !== e['model'] ? e['model'] : project_settings['models']['facade'],
          'material': void 0 !== e['material'] ? e['material'] : void 0,
          'glass_material': void 0 !== e['glass_material'] ? e['glass_material'] : glass_mat,
          'aluminium_material': void 0 !== e['aluminium_material'] ? e['aluminium_material'] : aluminium_material,
          'back_material': void 0 !== e['back_material'] ? e['back_material'] : gray_mat,
          'material_type': void 0 !== e['material_type'] ? e['material_type'] : 'facade',
          'material_own': void 0 !== e['material_own'] ? e['material_own'] : void 0,
          'material_rotated': void 0 !== e['material_rotated'] && e['material_rotated'],
          'fixed_material': void 0 !== e['fixed_material'] && e['fixed_material'],
          'group': void 0 !== e['group'] ? e['group'] : 'top',
          'name': void 0 !== e['name'] ? e['name'] : 'Decoration',
          'rZ': void 0 !== e['rZ'] ? e['rZ'] : 0,
          'rY': void 0 !== e['rY'] ? e['rY'] : 0
        }) !== this['params']['draggable'] && (this['object_type'] = 'cabinet'),
        this['name'] = this['params']['name'],
        this['root'] = e['root'],
        void 0 === this['params']['material'] && ('facade' === this['params']['material_type'] && (this['root'] ?
            this['params']['material'] = this['root']['params']['facade']['materials']['gen'] : 'top' === this['params']
            ['group'] ? void 0 !== project_settings['selected_materials']['top']['facades'] ? this['params'][
              'material'
            ] = project_settings['selected_materials']['top']['facades'] : (e = objectFindByKey(ct, 'id',
              project_settings['materials']['top']['facades'][0]))['items'] ? this['params']['material'] = e['items'][
              0
            ]['id'] : this['params']['material'] = e['categories'][0]['items'][0]['id'] : void 0 !==
            project_settings['selected_materials']['bottom']['facades'] ? this['params']['material'] = project_settings[
              'selected_materials']['bottom']['facades'] : (e = objectFindByKey(ct, 'id', project_settings['materials'][
              'bottom'
            ]['facades'][0]))['items'] ? this['params']['material'] = e['items'][0]['id'] : this['params'][
              'material'
            ] = e['categories'][0]['items'][0]['id']),
          'corpus' === this['params']['material_type'] && (this['params']['material'] = project_settings[
            'selected_materials'][this['params']['group']]['corpus']),
          'tabletop' === this['params']['material_type']) && (this['params']['material'] = project_settings[
          'selected_materials']['tabletop']),
        this['cube'] = make_cube(0.001, 0.001, 0.001, glass_mat),
        this['model_loaded'] = 0,
        this['can_load_model'] = 0,
        this['box'] = new THREE['Box3'](),
        this['box']['update'] = function() {
          f['box']['setFromObject'](f['size_box']);
        },
        this['model'] = new THREE['Group'](),
        this['add'](this['model']),
        this['sizes'] = new THREE['Group'](),
        this['sizes']['name'] = 'Sizes',
        this['add'](this['sizes']),
        !(this['model']['name'] = 'Facade') !== this['params']['draggable'] && (this['size_box'] = new SizeBox({
            'width': f['params']['width'] / units,
            'height': f['params']['height'] / units,
            'depth': false !== f['params']['draggable'] ? f['params']['wall_distance'] / units : f['params'][
              'thickness'
            ] / units
          }),
          this['size_box']['position']['y'] = f['params']['height'] / units / 2,
          this['add'](this['size_box']),
          this['size_box']['visible'] = false),
        f['rotation']['z'] = f['params']['rZ'],
        f['rotation']['y'] = f['params']['rY'],
        this['build']();
    }
    ['delete'](e) {
      this['reset_model'](),
        super['del_spl']();
    }
}
Decoration['prototype']['build'] = function() {
    var e = this;
    this['reset_model'](),
      e['model']['add'](make_edges(e['params']['width'] / units, e['params']['height'] / units, e['params'][
        'thickness'] / units)),
      false !== this['params']['draggable'] && (this['size_box']['set_size'](e['params']['width'] / units, e['params'][
            'height'
          ] / units, false !== e['params']['draggable'] ? e['params']['wall_distance'] / units + e['params'][
          'thickness'] / units : e['params']['thickness'] / units),
        this['calculate_distances'](),
        this['build_from_wall_sizes']()),
      e['load_model'](),
      this['build_sizes']();
  },
  Decoration['prototype']['load_model'] = async function() {
      var f = this,
        j, k, q, v;
      if (f['reset_model'](),
        null !== f['params']['model']) {
        -1 < f['params']['model']['indexOf']('broskokitchenplanner.com') && (f['params']['model'] = f['params'][
          'model'
        ]['replace']('https://broskokitchenplanner.com', 'https://planplace.ru'));
        var w = await load_model({
            'model': f['params']['model'],
            'buffer': false
          }),
          x = (null != project_settings['fixed_materials'] && '' !== project_settings['fixed_materials'] || (
              project_settings['fixed_materials'] = []),
            project_settings['fixed_materials']);
        for (let H = 0; H < w.length; H++) {
          let I, J;
          var y = w[H]['clone'](),
            z, z, A, A, B, C;
          if (-1 < y['name']['indexOf']('v(2)')) {
            var D = y['name']['match'](/m\((.*?)\)/),
              E;
            let K = 'gen',
              L = (null != D && (K = D[1]),
                0);
            if ('gen' == K && ((E = materials_lib['get_item'](f['params']['material']))['add_params'] || (E[
                  'add_params'] = {}),
                E['add_params']['model_width'] = f['params']['width'],
                E['add_params']['model_height'] = f['params']['height'],
                true === f['params']['material_rotated'] && (E['add_params']['rotation'] = 'rotated'),
                I = create_material(E),
                L = 1),
              'glass' == K && (I = glass_mat,
                L = 1),
              'back' == K && (I = f['params']['back_material'],
                L = 1),
              'al' == K && (I = f['params']['aluminium_material'],
                L = 1),
              1 != L) {
              let N;
              for (let O = 0; O < x.length; O++) {
                var F = O + 1;
                D[1] == 'mat' + F && (N = x[O]);
              }
              bim_arr.forEach(function(P) {
                  -1 < K['indexOf'](P) && 'pat' != K && (N = ('function' == typeof bim_keys[P] ? bim_keys[P](f, K, !
                      0) : bim_keys[P])['id'],
                    L = 1);
                }),
                N = (N = null == N ? facades_lib['items'][project_settings['defaults']['facades'][f['params']['group']]]
                  ['additional_materials'][D[1]]['selected'] : N) || f['params']['material'];
              var E = get_material_by_id(N);
              E['add_params'] || (E['add_params'] = {}),
                E['add_params']['model_width'] = f['params']['width'],
                E['add_params']['model_height'] = f['params']['height'],
                I = create_material(E);
            }
            (J = new THREE['Mesh'](y, I))['name'] = y['name'];
          } else {
            -1 < y['name']['indexOf']('al') && (I = f['params']['aluminium_material']);
            let P = 0;
            for (let Q = 0; Q < x.length; Q++) {
              var G = Q + 1,
                G; -
              1 < y['name']['indexOf']('mat' + G) && ((G = materials_lib['get_item'](x[Q]))['add_params'][
                  'model_width'
                ] = f['params']['width'],
                G['add_params']['model_height'] = f['params']['height'],
                true === f['params']['material_rotated'] && (G['add_params']['rotation'] = 'rotated'),
                I = create_material(G),
                P = 1);
            }
            0 === P && (-1 < y['name']['indexOf']('gen') && ((z = materials_lib['get_item'](f['params'][
                    'material']))['add_params']['model_width'] = f['params']['width'],
                  z['add_params']['model_height'] = f['params']['height'],
                  true === f['params']['material_rotated'] && (z['add_params']['rotation'] = 'rotated'),
                  I = create_material(z)),
                -1 < y['name']['indexOf']('botfacmat') && ((z = materials_lib['get_item'](project_settings[
                    'selected_materials']['bottom']['facades']))['add_params']['model_width'] = f['params']['width'],
                  z['add_params']['model_height'] = f['params']['height'],
                  true === f['params']['material_rotated'] && (z['add_params']['rotation'] = 'rotated'),
                  I = create_material(z)),
                -1 < y['name']['indexOf']('topfacmat')) && ((A = materials_lib['get_item'](project_settings[
                  'selected_materials']['top']['facades']))['add_params']['model_width'] = f['params']['width'],
                A['add_params']['model_height'] = f['params']['height'],
                true === f['params']['material_rotated'] && (A['add_params']['rotation'] = 'rotated'),
                I = create_material(A)),
              -1 < y['name']['indexOf']('back') && (I = f['params']['back_material']),
              -1 < y['name']['indexOf']('corpmat') && (I = create_material(materials_lib['get_item'](project_settings[
                'selected_materials'][f['params']['group']]['corpus']))),
              -1 < y['name']['indexOf']('blummat') && (I = blummat),
              '/common_assets/models/custom/bv_40_good.fbx' === f['params']['model'] && -1 < location['href'][
                'indexOf'
              ]('mfleko') && ((A = materials_lib['get_item'](f['params']['material']))['add_params']['model_width'] = f[
                  'params']['width'],
                A['add_params']['model_height'] = f['params']['height'],
                true === f['params']['material_rotated'] && (A['add_params']['rotation'] = 'rotated'),
                I = create_material(A)),
              -1 < y['name']['indexOf']('pat') ? (J = new THREE['Mesh'](y['clone'](), white_mat),
                B = get_material_by_id(project_settings['selected_materials']['pat']),
                C = box3['setFromObject'](J)['getSize'](new THREE['Vector3']()),
                B['add_params'] || (B['add_params'] = {}),
                B['add_params']['model_width'] = f['params']['width'],
                B['add_params']['model_height'] = C['y'] * units,
                J['material'] = create_material(B)) : J = -1 < y['name']['indexOf']('glass') ? new THREE['Mesh'](y,
                glass_mat) : new THREE['Mesh'](y, I),
              J['name'] = y['name'];
          }
          J['castShadow'] = true,
            f['model']['add'](J),
            false !== f['params']['draggable'] && (J['position']['y'] = f['params']['height'] / units / 2,
              J['position']['z'] = f['params']['wall_distance'] / units / 2);
        }
        f['old_rotation'] = f['rotation']['clone'](),
          f['rotation']['set'](0, 0, 0),
          f['set_size'](f['params']['width'], f['params']['height'], f['params']['thickness']),
          false !== f['params']['draggable'] && (f['model']['add'](f['cube']),
            f['cube']['position']['z'] = -f['params']['wall_distance'] / units / 2),
          f['rotation']['copy'](f['old_rotation']),
          f['model_loaded'] = 1;
      }
    },
    Decoration['prototype']['set_size'] = function() {
      var f = this['model']['rotation']['clone'](),
        g = new THREE['Euler']()['setFromQuaternion'](this['model']['getWorldQuaternion'](new THREE['Quaternion']())[
          'clone']());
      this['model']['rotation']['set'](-1 * g['x'], -1 * g['y'], -1 * g['z']);
      let h = this,
        j, k, l = new THREE['Vector3'](h['params']['width'] / units, h['params']['height'] / units, h['params'][
          'thickness'
        ] / units),
        n = box3['setFromObject'](h['model'])['getSize'](new THREE['Vector3']())['clone']();
      false !== h['params']['draggable'] && h['model']['remove'](h['cube']),
        k = l['clone']()['sub'](n)['divideScalar'](2);
      var p = {
          'box': n,
          'diff': new THREE['Vector3'](h['params']['width'] / units, h['params']['height'] / units, h['params'][
            'thickness'
          ] / units)['sub'](n)['divideScalar'](2),
          'width': h['params']['width'] / units,
          'height': h['params']['height'] / units,
          'depth': h['params']['thickness'] / units
        },
        g;
      for (j = 0; j < h['model']['children']['length']; j++)
        set_size_buff(h['model']['children'][j], h['model']['children'][j]['name'], p),
        correct_uv_buff(Model_utils['get_model_from_cache'](h['params']['model'])['geometry'][j], h['model']['children']
          [j]['geometry']),
        h['model']['children'][j]['geometry']['attributes']['position']['needsUpdate'] = true,
        h['model']['children'][j]['geometry']['attributes']['uv'] && (h['model']['children'][j]['geometry'][
          'attributes']['uv']['needsUpdate'] = true);

      function q(u) {
        return 'Cabinet' === u['type'] ? u : q(u['parent']);
      }
      this['model']['rotation']['copy'](f),
        this['params']['radius'] && (n = new THREE['Box3']()['setFromObject'](h['model'])['getSize'](new THREE[
            'Vector3']())['clone'](),
          0 === (g = q(this))['rotation']['y'] || g['rotation']['y'] === Math['PI'] ? (this['model']['scale']['x'] =
            h['params']['width'] / units / n['x'],
            this['model']['scale']['z'] = this['model']['scale']['x'],
            this['model']['rotation']['y'] = -1 * this['parent']['rotation']['y'],
            n = new THREE['Box3']()['setFromObject'](h['model'])['getSize'](new THREE['Vector3']())['clone'](),
            this['model']['position']['z'] = n['z'] / 2,
            'right' === this['params']['orientation'] ? this['model']['position']['x'] = -n['x'] / 2 : this['model'][
              'position'
            ]['x'] = n['x'] / 2) : (this['model']['scale']['z'] = h['params']['width'] / units / n['z'],
            this['model']['scale']['x'] = this['model']['scale']['z'],
            this['model']['rotation']['y'] = -1 * this['parent']['rotation']['y'],
            n = new THREE['Box3']()['setFromObject'](h['model'])['getSize'](new THREE['Vector3']())['clone'](),
            this['model']['position']['z'] = n['x'] / 2,
            'right' === this['params']['orientation'] ? this['model']['position']['x'] = -n['z'] / 2 : this['model'][
              'position'
            ]['x'] = n['z'] / 2),
          this['model']['rotation']['y'] = 0,
          this['parent']['set_handle_position']()),
        false !== h['params']['draggable'] && h['model']['add'](h['cube']),
        this['build_sizes'](),
        'edges' === global_options['mode'] && this['edges_mode']();
    },
    Decoration['prototype']['set_size_by_number'] = function(f, g, h, j) {
      this['params']['width'] = f,
        this['params']['height'] = g,
        this['params']['thickness'] = h,
        this['params']['wall_distance'] = j,
        this['build']();
    },
    Decoration['prototype']['change_material'] = function(f) {
      var g = this;
      if (1 != g['params']['fixed_material']) {
        var h = new THREE['Box3'](),
          j = (f['type'] || (f['type'] = 'gen'),
            f['id'] || (f['id'] = 0),
            f['id']),
          k = f['type'];
        if (f['material_key']) {
          var p = materials_lib['get_item'](j);
          for (let y = 0; y < g['model']['children']['length']; y++) {
            var q = g['model']['children'][y]; -
            1 < q['name']['indexOf'](f['material_key']) && (dispose_material(q['material']),
              p['add_params'] || (p['add_params'] = {}),
              p['add_params']['model_width'] = g['params']['width'],
              p['add_params']['model_height'] = g['params']['height'],
              true === f['rotated'] && (g['params']['material_rotated'] = true,
                p['add_params']['rotation'] = 'rotated'),
              q['material'] = create_material(p));
          }
        } else {
          'gen' === k && (g['params']['material'] = j),
            'corpmat' === k && (g['params']['material'] = j);
          for (var u = materials_lib['get_item'](j), v = 0; v < g['model']['children']['length']; v++) {
            var w = g['model']['children'][v],
              x = h['setFromObject'](w)['getSize'](new THREE['Vector3']()); -
            1 < w['name']['indexOf']('_mat') && 0 < project_settings['fixed_materials']['length'] || (-1 < w[
                'name']['indexOf'](k) && (dispose_material(w['material']),
                u['add_params'] || (u['add_params'] = {}),
                u['add_params']['model_width'] = g['params']['width'],
                u['add_params']['model_height'] = g['params']['height'],
                true === f['rotated'] && (g['params']['material_rotated'] = true,
                  u['add_params']['rotation'] = 'rotated'),
                w['material'] = create_material(u)),
              'corpus' === g['params']['material_type'] && 'corpmat' === k && -1 < w['name']['indexOf']('gen') && (
                dispose_material(w['material']),
                u['add_params'] || (u['add_params'] = {}),
                u['add_params']['model_width'] = g['params']['width'],
                u['add_params']['model_height'] = g['params']['height'],
                true === f['rotated'] && (g['params']['material_rotated'] = true,
                  u['add_params']['rotation'] = 'rotated'),
                w['material'] = create_material(u)));
          }
        }
      }
    },
    Decoration['prototype']['change_facade_material'] = function(e) {
      'bottom' !== e['group'] && this['change_material'](e);
    },
    Decoration['prototype']['change_single_facade_material'] = function(e) {
      this['change_material']({
        'id': e
      });
    },
    Decoration['prototype']['show_radial_menu'] = function(f, g) {
      var h, j;
      false !== this['params']['draggable'] && (h = this,
        j = {
          'sizes': true,
          'rotate_buttons': true,
          'copy_button': true,
          'material': false,
          'material_facade': false,
          'material_corpus': false
        },
        pp['interface']['root']['radial']({
          'obj_type': this['type'],
          'obj': j,
          'left': f,
          'top': g
        }));
    },
    Decoration['prototype']['reset_model'] = function(f) {
      let g = f,
        h = [];
      if ((g = f ? g : this)['traverse'](function(i) {
          g === i || 'Group' === i['type'] || i['no_reset'] || h.push(i);
        }),
        h.length) {
        for (let i = h.length - 1; - 1 < i; i--)
          h[i]['parent']['remove'](h[i]),
          h[i]['geometry'] && h[i]['geometry']['dispose'](),
          h[i]['material'] && dispose_material(h[i]['material']),
          h['pop']();
      }
    },
    Decoration['prototype']['build_sizes'] = function() {
      false !== this['params']['draggable'] && (this['reset_model'](this['sizes']),
        this['size_width'] = new Sizes_obj({
          'width': this['params']['width'] / units,
          'text': this['params']['width'],
          'font_size': 50
        }),
        this['size_width']['position']['set'](0, this['params']['height'] / units, -this['params'][
          'wall_distance'] / units / 2 + 0.04),
        this['sizes']['add'](this['size_width']),
        this['size_height'] = new Sizes_obj({
          'width': this['params']['height'] / units,
          'text': this['params']['height'],
          'font_size': 50
        }),
        this['size_height']['position']['set'](-this['params']['width'] / units / 2, this['params']['height'] /
          units / 2, -this['params']['wall_distance'] / units / 2 + 0.04),
        this['size_height']['rotation']['z'] = Math['PI'] / 2,
        this['sizes']['add'](this['size_height']),
        this['sizes']['visible'] = global_options['sizes_visible']);
    },
    Decoration['prototype']['design_mode'] = function() {
      this['load_model']();
    };
class Facade_new extends THREE['Group'] {
  constructor(f) {
    super(f);
    var g = this;
    this['type'] = 'Facade',
      f = f || {},
      this['userData'] = {},
      this['userData']['units'] = 10,
      'undefined' != typeof units && (this['userData']['units'] = units),
      this['params'] = {
        'width': void 0 !== f['width'] ? f['width'] : 600,
        'height': void 0 !== f['height'] ? f['height'] : 720,
        'thickness': void 0 !== f['thickness'] ? f['thickness'] : 16,
        'facade': void 0 !== f['facade'] ? f['facade'] : void 0,
        'style': void 0 !== f['style'] ? f['style'] : 'full',
        'name': void 0 !== f['name'] ? f['name'] : 'Facade',
        'facade_type': void 0 !== f['facade_type'] ? f['facade_type'] : 'normal',
        'material': void 0 !== f['material'] ? f['material'] : 0,
        'material_rotated': void 0 !== f['material_rotated'] && f['material_rotated'],
        'fixed_model': void 0 !== f['fixed_model'] ? f['fixed_model'] : void 0,
        'glass_material': void 0 !== f['glass_material'] ? f['glass_material'] : glass_mat,
        'group': void 0 !== f['group'] ? f['group'] : 'top',
        'no_handle_group': void 0 !== f['no_handle_group'] && f['no_handle_group'],
        'radius': void 0 !== f['radius'] && f['radius'],
        'inner_radius': void 0 !== f['inner_radius'] && f['inner_radius'],
        'orientation': void 0 !== f['orientation'] ? f['orientation'] : 'right',
        'flip': void 0 !== f['flip'] && f['flip'],
        'open': void 0 !== f['open'] ? f['open'] : 'all',
        'is_double': void 0 !== f['is_double'] && f['is_double'],
        'is_triple': void 0 !== f['is_triple'] && f['is_triple'],
        'pX': f['pX'] || 0,
        'pY': f['pY'] || 0,
        'pZ': f['pZ'] || 0,
        'rX': f['rX'] || 0,
        'rY': f['rY'] || 0,
        'rZ': f['rZ'] || 0,
        'parent': void 0 !== f['parent'] ? f['parent'] : void 0
      },
      this['model_loaded'] = 0,
      this['can_load_model'] = 0,
      this['model'] = new THREE['Group'](),
      this['model']['name'] = 'Facade_model',
      this['additional_materials'] = {},
      this['model_loaded'] = 0,
      this['name'] = 'Facade',
      void(this['update_price'] = 0) === this['params']['facade'] && (this['params']['facade'] = 0),
      this['userData']['gen_model'] = null,
      this['params']['facade_data'] = facades_lib['get_item'](this['params']['facade']),
      this['params']['facade_data']['additional_materials'] && this['params']['parent'] && this['params']['parent'][
        'params'
      ] && this['params']['parent']['params']['additional_materials'] && Object['keys'](this['params']['parent'][
        'params'
      ]['additional_materials'])['forEach'](h => {
        this['params']['facade_data']['additional_materials'][h] && (this['params']['facade_data'][
          'additional_materials'
        ][h]['selected'] = this['params']['parent']['params']['additional_materials'][h]);
      }),
      this['params']['parent'] && this['params']['parent']['params'] && this['params']['parent']['params'][
      'type'] && (this['params']['open'] = this['params']['parent']['params']['type']),
      this['add'](this['model']),
      this['build']();
  }
}
Facade_new['prototype']['reset_model'] = function(f) {
    var g = f,
      h, i = [];
    if ((g = f ? f : this)['traverse'](function(j) {
        g !== j && 'Handle' !== j['type'] && 'Handle' !== j['parent']['type'] && 'Group' !== j['type'] && i.push(
        j);
      }),
      i.length) {
      for (h = i.length - 1; - 1 < h; h--)
        i[h]['parent']['remove'](i[h]),
        i[h]['geometry'] && i[h]['geometry']['dispose'](),
        i[h]['material'] && i[h]['material']['map'] && i[h]['material']['map']['dispose'](),
        i['splice'](i['indexOf'](i[h]), 1);
    }
  },
  Facade_new['prototype']['build'] = function() {
    var e = this;
    e['params']['inner_radius'] ? (e['load_model'](),
      this['model']['rotation']['y'] = Math['PI']) : (this['reset_model'](),
      e['model']['add'](new THREE['LineSegments'](new THREE['EdgesGeometry'](new THREE['BoxBufferGeometry'](e[
        'params']['width'] / this['userData']['units'], e['params']['height'] / this['userData']['units'], e[
        'params']['thickness'] / this['userData']['units'])), new THREE['LineBasicMaterial']({
        'color': 16711680
      }))),
      e['position']['set'](e['params']['pX'], e['params']['pY'], e['params']['pZ']),
      e['rotation']['set'](e['params']['rX'], e['params']['rY'], e['params']['rZ']),
      e['load_model']());
  },
  Facade_new['prototype']['load_model'] = async function() {
      var j = this,
        k = (j['get_suitable_model'](),
          j['reset_model'](),
          -1 < j['params']['model']['indexOf']('broskokitchenplanner.com') && (j['params']['model'] = j['params'][
            'model'
          ]['replace']('https://broskokitchenplanner.com', 'https://planplace.ru')),
          null === j['params']['model'] && j['params']['model'],
          void 0 === j['params']['model'] && j['params']['model'],
          'no_model' == j['params']['model'] && (j['params']['model'] = '/common_assets/models/no_model.fbx'),
          await load_model({
            'model': j['params']['model'],
            'buffer': false
          })),
        q = (null != project_settings['fixed_materials'] && '' !== project_settings['fixed_materials'] || (
            project_settings['fixed_materials'] = []),
          project_settings['fixed_materials']),
        v;
      for (let N = 0; N < k.length; N++) {
        let O, P;
        var w = k[N],
          x, z, A, A, B;
        if (-1 < w['name']['indexOf']('v(2)') || -1 < w['name']['indexOf']('v(3)')) {
          var z = w['name']['match'](/m\((.*?)\)/);
          let Q = 'gen',
            R = (null != z && (Q = z[1]),
              0),
            S = 0;
          var x = w['name']['match'](/ro\((.*?)\)/),
            x, x, z;
          null != x && (S = parseInt(x[1]));
          let T = w['name']['match'](/r\((.*?)\)/),
            U = (null != T && (T = T[1]),
              ''),
            W = (null != (U = w['name']['match'](/no\((.*?)\)/)) && (U = U[1]),
              w['name']['match'](/fm\((.*?)\)/));
          null != W && (W = W[1]);
          for (let Z = 0; Z < q.length; Z++) {
            var C = Z + 1,
              C; -
            1 < w['name']['indexOf']('mat' + C) && ((C = materials_lib['get_item'](q[Z]))['add_params'][
              'model_width'] = j['params']['width'],
              C['add_params']['model_height'] = j['params']['height'],
              true === j['params']['material_rotated'] && (C['add_params']['rotation'] = 'rotated'),
              O = create_material(C),
              R = 1);
          }
          if ('gen' == Q && (x = materials_lib['get_item'](j['params']['material']),
              90 == T && (x['add_params']['rotation'] = 'rotated'),
              x['add_params']['model_width'] = j['params']['width'],
              x['add_params']['model_height'] = j['params']['height'],
              true === j['params']['material_rotated'] && U['indexOf']('r') < 0 && (x['add_params']['rotation'] =
                'rotated'),
              this['params']['facade_data']['nmap'] && (x['params']['normalMap'] = this['params']['facade_data'][
                'nmap']),
              O = create_material(x),
              this['userData']['gen_model'] = w,
              this['userData']['gen_index'] = N,
              R = 1),
            'glass' == Q && (O = glass_mat,
              R = 1),
            'mirror' == Q && (O = mirror_material,
              R = 1),
            'back' == Q && (O = w_mat,
              R = 1),
            'al' == Q && (O = aluminium_material,
              R = 1),
            'corpmat' == Q && (O = create_material(materials_lib['get_item'](project_settings['selected_materials'][j[
                'params']['group']]['corpus'])),
              R = 1),
            materials_global[Q] && ((x = materials_lib['get_item'](materials_global[Q]['selected']))['add_params'][
                'model_width'
              ] = j['params']['width'],
              x['add_params']['model_height'] = j['params']['height'],
              true === j['params']['material_rotated'] && U['indexOf']('r') < 0 && (x['add_params']['rotation'] =
                'rotated'),
              O = create_material(x),
              R = 1),
            1 != R) {
            let a0 = 0;
            bim_arr.forEach(function(a1) {
                -1 < Q['indexOf'](a1) && 'pat' != Q && (R = (a0 = 'function' == typeof bim_keys[a1] ? bim_keys[a1](
                    j, Q, true) : bim_keys[a1],
                  1));
              }),
              1 == R && (O = a0);
          }
          if (1 != R) {
            let a1;
            try {
              project_settings['selected_materials']['facades'][j['params']['facade']][z[1]][j['params']['group']] ?
                a1 = project_settings['selected_materials']['facades'][j['params']['facade']][z[1]][j['params'][
                  'group'
                ]] : j['params']['facade_data']['additional_materials'] && (a1 = j['params']['facade_data'][
                  'additional_materials'
                ][z[1]]['selected']);
            } catch (a2) {
              if (facades_lib)
                try {
                  a1 = copy_object(facades_lib['items'][j['params']['facade']]['additional_materials'][z[1]][
                    'selected'
                  ]);
                } catch (a3) {
                  a1 = 0;
                }
              else
                a1 = 0;
            }!j['params']['parent'] || j['params']['parent']['params']['additional_materials'][Q] || j['params'][
                'parent'
              ]['set_additional_materials'](Q),
              a1 = a1 || 0;
            var x = materials_lib['get_item'](a1);
            x['add_params']['model_width'] = j['params']['width'],
              x['add_params']['model_height'] = j['params']['height'],
              O = create_material(x),
              cl();
          }
          W && ((z = materials_lib['get_item'](W))['add_params']['model_width'] = j['params']['width'],
              z['add_params']['model_height'] = j['params']['height'],
              O = create_material(z),
              R = 1),
            null === O && (O = red_mat),
            (P = new THREE['Mesh'](w['clone'](), O))['name'] = w['name'],
            P['castShadow'] = true,
            P['receiveShadow'] = true,
            P['renderOrder'] = S;
        } else {
          -1 < w['name']['indexOf']('al') && (O = aluminium_material);
          let a4 = 0;
          for (let a5 = 0; a5 < q.length; a5++) {
            var D = a5 + 1,
              D; -
            1 < w['name']['indexOf']('mat' + D) && ((D = materials_lib['get_item'](q[a5]))['add_params'][
                'model_width'] = j['params']['width'],
              D['add_params']['model_height'] = j['params']['height'],
              true === j['params']['material_rotated'] && (D['add_params']['rotation'] = 'rotated'),
              O = create_material(D),
              a4 = 1);
          }
          0 === a4 && (-1 < w['name']['indexOf']('gen') && ((x = materials_lib['get_item'](j['params'][
                'material']))['add_params']['model_width'] = j['params']['width'],
                x['add_params']['model_height'] = j['params']['height'],
                true === j['params']['material_rotated'] && (x['add_params']['rotation'] = 'rotated'),
                O = create_material(x),
                this['userData']['gen_model'] = w,
                this['userData']['gen_index'] = N),
              -1 < w['name']['indexOf']('botfacmat') && ((z = materials_lib['get_item'](project_settings[
                  'selected_materials']['bottom']['facades']))['add_params']['model_width'] = j['params']['width'],
                z['add_params']['model_height'] = j['params']['height'],
                true === j['params']['material_rotated'] && (z['add_params']['rotation'] = 'rotated'),
                O = create_material(z)),
              -1 < w['name']['indexOf']('topfacmat')) && ((A = materials_lib['get_item'](project_settings[
                'selected_materials']['top']['facades']))['add_params']['model_width'] = j['params']['width'],
              A['add_params']['model_height'] = j['params']['height'],
              true === j['params']['material_rotated'] && (A['add_params']['rotation'] = 'rotated'),
              O = create_material(A)),
            -1 < w['name']['indexOf']('back') && (O = w_mat),
            -1 < w['name']['indexOf']('pat') ? (P = new THREE['Mesh'](w['clone'](), white_mat),
              0 != (A = materials_lib['get_item'](project_settings['selected_materials']['pat']))['id'] && (B = box3[
                  'setFromObject'](P)['getSize'](new THREE['Vector3']()),
                A['add_params']['model_width'] = j['params']['width'],
                A['add_params']['model_height'] = B['y'] * this['userData']['units'],
                P['material'] = create_material(A))) : P = -1 < w['name']['indexOf']('glass') ? new THREE['Mesh'](w[
              'clone'](), glass_mat) : new THREE['Mesh'](w['clone'](), O),
            P['name'] = w['name'],
            P['castShadow'] = true,
            P['receiveShadow'] = true;
        }
        P['userData']['edgesModeType'] = ObjectType['Facade'],
          j['model']['add'](P);
      }
      j['old_rotation'] = j['rotation']['clone'](),
        j['rotation']['set'](0, 0, 0),
        j['set_size'](j['params']['width'], j['params']['height'], j['params']['thickness']),
        j['rotation']['copy'](j['old_rotation']);
      for (let a6 = 0; a6 < j['model']['children']['length']; a6++)
        if ('/common_assets/models/no_model.fbx' == j['params']['model'])
          j['model']['children'][a6]['material'] = create_material(materials_lib['get_item'](0));
        else {
          if (-1 < j['model']['children'][a6]['name']['indexOf']('glass')) {
            if (project_settings['vit']) {
              j['model']['children'][a6]['geometry']['computeBoundingBox']();
              var E = j['model']['children'][a6]['geometry']['boundingBox']['getSize'](new THREE['Vector3']()),
                F = [];
              let a7 = Math['floor'](E['x']) * this['userData']['units'];
              var G = Math['floor'](E['y']) * this['userData']['units'],
                E = (j['params']['radius'] && (a7 = 270),
                  j['params']['parent']['cabinet']),
                H = ('end_corner_facade' === E['params']['cabinet']['type'] && (a7 = 270), {
                  'type': 'Standart',
                  'params': {
                    'color': '#ffffff',
                    'transparent': true,
                    'roughness': 0.1,
                    'metalness': 0
                  },
                  'add_params': {
                    'stretch_width': true,
                    'stretch_height': true
                  }
                });
              for (let a8 = 0; a8 < project_settings['vit']['length']; a8++) {
                var I = parseInt(project_settings['vit'][a8]['width']),
                  J = parseInt(project_settings['vit'][a8]['height']);
                J - 40 <= G && G <= J + 40 && I - 40 <= a7 && a7 <= I + 40 && (H['params']['map'] =
                  project_settings['vit'][a8]['texture']);
              }
              H['params']['map'] || (H['params']['opacity'] = 0.8),
                j['model']['children'][a6]['material'] = create_material(H);
            } else {
              if ('object' != typeof j['params']['glass_material']) {
                if (-1 < j['model']['children'][a6]['name']['indexOf']('v(2)') || -1 < j['model']['children'][a6][
                    'name'
                  ]['indexOf']('v(3)')) {
                  j['model']['children'][a6]['geometry']['computeBoundingBox']();
                  var E = j['model']['children'][a6]['geometry']['boundingBox']['getSize'](new THREE['Vector3']());
                  let a9 = j['model']['children'][a6]['name']['match'](/fm\((.*?)\)/);
                  null != a9 && (a9 = a9[1]);
                  var K = get_material_by_id(j['params']['material']);
                  let aa;
                  (aa = (aa = a9 ? glass_lib['get_item'](a9) : glass_lib['get_item'](j['params']['glass_material']))[
                    'id'] ? aa : copy_object(glass_materials_catalog['items'][0]))['add_params'] || (aa[
                    'add_params'] = {}),
                  1 === to_int(aa['add_params']['facade_map']) && (aa['params']['color'] = K['params']['color'],
                      K['params']['map']) && (aa['params']['map'] = K['params']['map']),
                    aa['add_params']['model_width'] = E['x'] * this['userData']['units'],
                    aa['add_params']['model_height'] = E['y'] * this['userData']['units'],
                    j['model']['children'][a6]['material'] = create_material(aa);
                } else {
                  j['model']['children'][a6]['geometry']['computeBoundingBox']();
                  var K = j['model']['children'][a6]['geometry']['boundingBox']['getSize'](new THREE['Vector3']()),
                    L = get_material_by_id(j['params']['material']);
                  let ab = get_material_by_id(j['params']['glass_material'], glass_materials_catalog);
                  (ab = ab['id'] ? ab : copy_object(glass_materials_catalog['items'][0]))['add_params'] || (ab[
                    'add_params'] = {}),
                  1 === to_int(ab['add_params']['facade_map']) && (ab['params']['color'] = L['params']['color'],
                      L['params']['map']) && (ab['params']['map'] = L['params']['map']),
                    ab['add_params']['model_width'] = K['x'] * this['userData']['units'],
                    ab['add_params']['model_height'] = K['y'] * this['userData']['units'],
                    j['model']['children'][a6]['material'] = create_material(ab);
                }
              }
            }
          }
        }
      j['model_loaded'] = 1,
        'edges' === global_options['mode'] && 'function' == typeof(v = j['params']['parent'])['edges_mode'] && v[
          'edges_mode'](),
        j['model_loaded'] = 1,
        j['position']['set'](j['params']['pX'], j['params']['pY'], j['params']['pZ']);
    },
    Facade_new['prototype']['get_weight'] = function() {
      this['params']['facade_data']['types'][this['params']['style']] || (this['params']['style'] = 1);
      let e = parseFloat(this['params']['facade_data']['types'][this['params']['style']]['weight']);
      return (e = isNaN(e) ? 0 : e) * parseInt(this['params']['width']) / 1000 * parseInt(this['params']['height']) /
        1000 * parseInt(this['params']['thickness']) / 1000;
    },
    Facade_new['prototype']['get_weight_square'] = function() {
      let f = this['params']['style'],
        g = (isNaN(parseInt(f)) && (f = this['params']['facade_data']['compatibility_types'][f]),
          parseFloat(this['params']['facade_data']['types'][f]['weight']));
      return (g = isNaN(g) ? 0 : g) * parseInt(this['params']['width']) / 1000 * parseInt(this['params']['height']) /
        1000;
    },
    Facade_new['prototype']['set_size'] = function() {
      var f = this['model']['rotation']['clone'](),
        g = new THREE['Euler']()['setFromQuaternion'](this['model']['getWorldQuaternion'](new THREE['Quaternion']())[
          'clone']());
      this['model']['rotation']['set'](-1 * g['x'], -1 * g['y'], -1 * g['z']);
      let h = this,
        j, k, l = new THREE['Vector3'](h['params']['width'] / this['userData']['units'], h['params']['height'] / this[
          'userData']['units'], h['params']['thickness'] / this['userData']['units']),
        n = box3['setFromObject'](h['model'])['getSize'](new THREE['Vector3']())['clone']();
      k = l['clone']()['sub'](n)['divideScalar'](2);
      var o = {
        'box': n,
        'diff': new THREE['Vector3'](h['params']['width'] / this['userData']['units'], h['params']['height'] / this[
            'userData']['units'], h['params']['thickness'] / this['userData']['units'])['sub'](n)['divideScalar'](
          2),
        'width': h['params']['width'] / this['userData']['units'],
        'height': h['params']['height'] / this['userData']['units'],
        'depth': h['params']['thickness'] / this['userData']['units']
      };
      for (j = 0; j < h['model']['children']['length']; j++)
        set_size_buff(h['model']['children'][j], h['model']['children'][j]['name'], o),
        correct_uv_buff(Model_utils['get_model_from_cache'](h['params']['model'])['geometry'][j], h['model']['children']
          [j]['geometry']),
        h['model']['children'][j]['geometry']['attributes']['position']['needsUpdate'] = true,
        h['model']['children'][j]['geometry']['attributes']['uv'] && (h['model']['children'][j]['geometry'][
          'attributes']['uv']['needsUpdate'] = true);
      if (this['model']['rotation']['copy'](f),
        this['params']['inner_radius'] && setTimeout(function() {
          n = new THREE['Box3']()['setFromObject'](h['model'])['getSize'](new THREE['Vector3']())['clone'](),
            h['model']['scale']['x'] = h['params']['width'] / h['userData']['units'] / n['x'],
            h['model']['scale']['z'] = h['model']['scale']['x'];
        }, 100),
        this['params']['radius']) {
        if ('rn' != this['params']['radius'])
          setTimeout(function() {
            n = new THREE['Box3']()['setFromObject'](h['model'])['getSize'](new THREE['Vector3']())['clone']();
            var p = h['params']['parent']['cabinet'];
            0 === p['rotation']['y'] || p['rotation']['y'] === Math['PI'] ? (h['model']['scale']['x'] = h['params'][
                  'width'
                ] / h['userData']['units'] / n['x'],
                h['model']['scale']['z'] = h['model']['scale']['x'],
                h['parent'] && (h['model']['rotation']['y'] = -1 * h['parent']['rotation']['y']),
                n = new THREE['Box3']()['setFromObject'](h['model'])['getSize'](new THREE['Vector3']())['clone'](),
                h['model']['position']['z'] = n['z'] / 2,
                'right' === h['params']['orientation'] ? h['model']['position']['x'] = -n['x'] / 2 : h['model'][
                  'position'
                ]['x'] = n['x'] / 2) : (h['model']['scale']['z'] = h['params']['width'] / h['userData']['units'] /
                n['z'],
                h['model']['scale']['x'] = h['model']['scale']['z'],
                h['model']['rotation']['y'] = -1 * h['parent']['rotation']['y'],
                n = new THREE['Box3']()['setFromObject'](h['model'])['getSize'](new THREE['Vector3']())['clone'](),
                h['model']['position']['z'] = n['x'] / 2,
                'right' === h['params']['orientation'] ? h['model']['position']['x'] = -n['z'] / 2 : h['model'][
                  'position'
                ]['x'] = n['z'] / 2),
              h['model']['rotation']['y'] = 0,
              h['parent'] && h['parent']['set_handle_position']();
          }, 100);
        else {
          var g = h['parent']['cabinet'],
            f = h['userData']['gen_model'],
            f = (f['computeBoundingBox'](),
              f['boundingBox']);
          let p = Math['abs'](f['min']['x']),
            q = Math['abs'](f['min']['z']),
            u = -0.7799999999999999;
          for ('right' == g['params']['cabinet']['orientation'] && (p = Math['abs'](f['max']['x']),
              q = Math['abs'](f['max']['z']),
              u = 0.7799999999999999),
            j = 0; j < h['model']['children']['length']; j++)
            h['model']['children'][j]['geometry']['translate'](p, 0, q),
            h['model']['children'][j]['geometry']['rotateY'](u);
          n = new THREE['Box3']()['setFromObject'](h['model'])['getSize'](new THREE['Vector3']())['clone']();
          var f = parseInt(h['params']['thickness']);
          h['model']['scale']['x'] = (h['params']['width'] + f) / h['userData']['units'] / n['x'],
            h['model']['scale']['z'] = h['model']['scale']['x'],
            'right' == g['params']['cabinet']['orientation'] ? (h['model']['position']['x'] = -(h['params']['width'] +
                f / 2) / units,
              h['model']['position']['z'] = (h['params']['width'] + f / 2) / units) : h['model']['position']['x'] = -
            f / 4 / units,
            h['parent'] && h['parent']['set_handle_position']();
        }
      }
    },
    Facade_new['prototype']['get_suitable_model'] = function() {
      var f = this,
        j;
      if (void 0 !== this['params']['fixed_model'] && '' !== this['params']['fixed_model'])
        this['params']['model'] = this['params']['fixed_model'];
      else {
        if (this['params']['facade_data']['types'])
          this['get_suitable_model_new']();
        else {
          if (f['params']['inner_radius'])
            f['params']['model'] = '/common_assets/models/facades/mdf_full_radius4.fbx';
          else {
            var k = f['params']['width'],
              q = f['params']['height'],
              u, v, v = this['params']['facade_data'];
            if (v['v']) {
              let F;
              if (f['params']['radius'])
                return void('string' == typeof f['params']['style'] && 'full' === f['params']['style'] && (F = _['find']
                  (v['facades'], function(G) {
                    return 'radius' === G['type'];
                  }),
                  f['params']['model'] = F['models'][0]['model']));
              'string' == typeof f['params']['style'] ? void 0 === (F = _['find'](v['facades'], function(G) {
                return G['type'] === f['params']['style'];
              })) && (F = v['facades'][0]) : F = v['facades'][f['params']['style']];
              var w = [];
              for (let G = 0; G < F['models']['length']; G++) {
                var x = F['models'][G];
                let H = f['params']['group'];
                0 != f['params']['no_handle_group'] && (H = f['params']['no_handle_group']),
                  x['group'] || (x['group'] = 'all'),
                  'all' != x['group'] && x['group'] != H || (0 === x['min_height'] && w.push(x),
                    q >= x['min_height'] && w.push(x));
              }
              if (w.length)
                for (let I = 0; I < w.length; I++) {
                  var y = w[I],
                    z = w[I + 1];
                  if (k >= y['min_width']) {
                    if (!z) {
                      f['params']['model'] = y['model'];
                      break;
                    }
                    if (k <= z['min_width']) {
                      f['params']['model'] = y['model'];
                      break;
                    }
                  }
                }
            } else {
              if (f['params']['radius'])
                'full' === f['params']['style'] ? (u = {})['sizes'] = v['radius'] : 'window' === f['params']['style'] ?
                (u = objectFindByKey(facades_sets, 'id', v['facades']['facade_radius_window']),
                  (u = {})['sizes'] = v['radius_window']) : u = null !== v['facades']['facade_radius_frame'] ?
                objectFindByKey(facades_models, 'id', v['facades']['facade_window_frame']) : objectFindByKey(
                  facades_models, 'id', v['facades']['facade_radius_frame']),
                f['params']['model'] = u['sizes'][0]['model'];
              else {
                for (var A, B = ('full' === f['params']['style'] ? (u = {})['sizes'] = v['full'] : 'window' !== f[
                      'params']['style'] && null !== v['frame'] && 0 !== v['frame']['length'] ? (u = {})['sizes'] =
                    v['frame'] : (u = {})['sizes'] = v['window'],
                    []), C = 0; C < u['sizes']['length']; C++) {
                  var D, E = (0 === (D = u['sizes'][C])['min_height'] && B.push(D),
                    u['sizes'][C + 1]);
                  D['min_height'] <= q && B.push(D);
                }
                if (B.length)
                  for (var C = 0; C < B.length; C++) {
                    var D = B[C],
                      E = B[C + 1];
                    k >= D['min_width'] && (!E || k <= E['min_width']) && (A = D['model']);
                  }
                f['params']['model'] = A;
              }
            }
          }
        }
      }
    },
    Facade_new['prototype']['get_suitable_model_new'] = function() {
      if (this['params']['inner_radius'])
        this['params']['model'] = '/common_assets/models/facades/mdf_full_radius4.fbx';
      else {
        let w = this['params']['facade_data'];
        var f = this,
          g = f['params']['width'],
          h = f['params']['height'];
        let x;
        if (f['params']['radius'] ? isNaN(parseInt(f['params']['style'])) ? ('full' == f['params']['style'] && (w[
                'types'][w['compatibility_types']['radius']] ? x = (x = w['types'][w['compatibility_types'][
              'radius']]) || w['types'][w['compatibility_types']['radius_full']] : Object['keys'](w['types'])['forEach']
              (function(y) {
                if (w['types'][y]['radius'])
                  return x = w['types'][y],
                    false;
              })),
            'window' == f['params']['style'] && (x = w['types'][w['compatibility_types']['radius_window']]),
            'window' != f['params']['style'] && 'full' != f['params']['style'] && (x = w['types'][w[
              'compatibility_types'][f['params']['style']]])) : x = w['types'][f['params']['style']] && w['types'][f[
            'params']['style']]['radius'] ? w['types'][f['params']['style']] : void 0 : x = f['params']['is_double'] ?
          w['types_double'][f['params']['style']] : f['params']['is_triple'] ? w['types_triple'][f['params']['style']] :
          isNaN(parseInt(f['params']['style'])) ? w['compatibility_types'][f['params']['style']] ? w['types'][w[
            'compatibility_types'][f['params']['style']]] : void 0 : !w['types'][f['params']['style']] || w['types'][
            f['params']['style']
          ]['radius'] ? void 0 : w['types'][f['params']['style']],
          void 0 === x)
          f['params']['style'] = Object['keys'](w['types'])[0],
          f['params']['is_double'] && (f['params']['style'] = Object['keys'](w['types_double'])[0]),
          f['params']['is_triple'] && (f['params']['style'] = Object['keys'](w['types_triple'])[0]),
          f['params']['radius'] ? f['params']['do_not_build_handle'] = true : f['get_suitable_model_new']();
        else {
          let y = null;
          var j, k = (f['params']['parent'] && 'Door' == f['params']['parent']['type'] && (y = f['params']['parent'][
              'params'
            ]['type']),
            []);
          if (0 < x['items']['length'] && null != x['items'][0]['height'])
            f['params']['model'] = get_suit_model(x, g, h);
          else {
            for (let z = 0; z < x['items']['length']; z++) {
              var q = x['items'][z];
              let A = f['params']['group'];
              null != y && (q['open'] || (q['open'] = 'all'),
                'all' != q['open']) && q['open'] != y || (0 != f['params']['no_handle_group'] && (A = f['params'][
                  'no_handle_group'
                ]),
                'reversed' == f['params']['facade_type'] && (A = 'reversed'),
                q['group'] || (q['group'] = 'all'),
                'all' != q['group'] && q['group'] != A) || (q['height'] && (q['min_height'] = parseInt(q['height'])),
                q['min_height'] = parseInt(q['min_height']),
                0 === q['min_height'] && k.push(q),
                h >= q['min_height'] && k.push(q));
            }
            if (k.length)
              for (let B = 0; B < k.length; B++) {
                var u = k[B],
                  v = k[B + 1];
                u['width'] && (u['min_width'] = parseInt(u['width'])),
                  u['min_width'] = parseInt(u['min_width']),
                  g >= u['min_width'] && (!v || g <= v['min_width']) && (j = u['model']);
              }
            f['params']['model'] = j = j || 'no_model';
          }
        }
      }
    },
    Facade_new['prototype']['change_material'] = function(f) {
      ce('Fac_change_material');
      var g = this,
        h = new THREE['Box3'](),
        j = (f['type'] || (f['type'] = 'gen'),
          f['id'] || (f['id'] = 0),
          f['id']),
        k = f['type'];
      if (f['material_key'] && 'gen' != f['material_key']) {
        var q = materials_lib['get_item'](j);
        for (let z = 0; z < g['model']['children']['length']; z++) {
          var u = g['model']['children'][z];
          let A = '';
          null != (A = u['name']['match'](/no\((.*?)\)/)) && (A = A[1]),
            -1 < u['name']['indexOf'](f['material_key']) && (dispose_material(u['material']),
              q['add_params']['model_width'] = g['params']['width'],
              q['add_params']['model_height'] = g['params']['height'],
              true === f['rotated'] && A['indexOf']('r') < 0 && (g['params']['material_rotated'] = true,
                q['add_params']['rotation'] = 'rotated'),
              u['material'] = create_material(q));
        }
      } else {
        'gen' === k && (g['params']['material'] = j);
        var v = materials_lib['get_item'](j),
          j;
        let B = glass_mat,
          C = (g['params']['glass_material'] === glass_mat || (B = glass_lib['get_item'](g['params'][
            'glass_material']))['id'] || (0 < glass_materials_catalog['items']['length'] ? B = copy_object(
              glass_materials_catalog['items'][0]) : (B = glass_mat,
              g['params']['glass_material'] = glass_mat)),
            0);
        g['params']['glass_material'] !== glass_mat && 1 === to_int(B['add_params']['facade_map']) && (C = 1);
        for (let D = 0; D < g['model']['children']['length']; D++) {
          var w = g['model']['children'][D],
            x, x, y;
          if (!(-1 < w['name']['indexOf']('_mat'))) {
            if (('all' === f['group'] || this['params']['group'] === f['group']) && -1 < w['name']['indexOf'](k)) {
              dispose_material(w['material']),
                v['add_params'] || (v['add_params'] = {}),
                v['add_params']['model_width'] = g['params']['width'],
                v['add_params']['model_height'] = g['params']['height'];
              let E = '';
              null != (E = w['name']['match'](/no\((.*?)\)/)) && (E = E[1]),
                true === f['rotated'] && E['indexOf']('r') < 0 && (g['params']['material_rotated'] = true,
                  v['add_params']['rotation'] = 'rotated'),
                this['params']['facade_data']['nmap'] && (v['params']['normalMap'] = this['params']['facade_data'][
                  'nmap'
                ]),
                w['material'] = create_material(v);
            } -
            1 < w['name']['indexOf']('botfacmat') && (dispose_material(w['material']),
                (x = materials_lib['get_item'](project_settings['selected_materials']['bottom']['facades']))[
                  'add_params'] || (x['add_params'] = {}),
                x['add_params']['model_width'] = g['params']['width'],
                x['add_params']['model_height'] = g['params']['height'],
                w['material'] = create_material(x)),
              -1 < w['name']['indexOf']('topfacmat') && (dispose_material(w['material']),
                (x = materials_lib['get_item'](project_settings['selected_materials']['top']['facades']))[
                'add_params'] || (x['add_params'] = {}),
                x['add_params']['model_width'] = g['params']['width'],
                x['add_params']['model_height'] = g['params']['height'],
                w['material'] = create_material(x)),
              1 === C && -1 < w['name']['indexOf']('glass') && (w['material'] !== glass_mat && dispose_material(w[
                  'material']),
                B['add_params'] || (B['add_params'] = {}),
                B['params']['color'] = v['params']['color'],
                v['params']['map'] && (B['params']['map'] = v['params']['map']),
                y = box3['setFromObject'](w)['getSize'](new THREE['Vector3']()),
                B['add_params']['model_width'] = Math['max'](y['x'], y['z']) * this['userData']['units'],
                B['add_params']['model_height'] = y['y'] * this['userData']['units'],
                w['material'] = create_material(B));
          }
        }
        'edges' === global_options['mode'] && 'function' == typeof(j = g['params']['parent'])['edges_mode'] && j[
          'edges_mode']();
      }
    },
    Facade_new['prototype']['change_material_new'] = function(f) {
      ce('Fac_change_material_new'),
        ce(f);
      var g = this,
        h = new THREE['Box3']();
      (f = f || {})['id'] || (f['id'] = 1),
      f['type'] || (f['type'] = 'gen');
      let j = f['type'];
      var f = f['id'],
        k = ('gen' === j && (g['params']['material'] = f),
          materials_lib['get_item'](f)),
        f;
      'gen' !== j && (j = '(' + j + ')');
      for (let m = 0; m < g['model']['children']['length']; m++) {
        var l = g['model']['children'][m]; -
        1 < l['name']['indexOf'](j) && (dispose_material(l['material']),
          k['add_params'] || (k['add_params'] = {}),
          k['add_params']['model_width'] = g['params']['width'],
          k['add_params']['model_height'] = g['params']['height'],
          l['material'] = create_material(k));
      }
      'edges' === global_options['mode'] && 'function' == typeof(f = g['params']['parent'])['edges_mode'] && f[
        'edges_mode']();
    },
    Facade_new['prototype']['change_glass_material'] = function(f) {
      var g = this;
      g['params']['glass_material'] = f;
      let h;
      h = project_settings['is_facades_system'] ? get_material_by_id(project_settings['fixed_materials'][0]) :
        get_material_by_id(g['params']['material']);
      for (let o = 0; o < g['model']['children']['length']; o++) {
        var j = g['model']['children'][o],
          k = box3['setFromObject'](j)['getSize'](new THREE['Vector3']()),
          l, n; -
        1 < j['name']['indexOf']('glass') && (j['material'] !== glass_mat && dispose_material(j['material']),
          (l = get_material_by_id(f, glass_materials_catalog))['add_params'] || (l['add_params'] = {}),
          1 === to_int(l['add_params']['facade_map']) && (l['params']['color'] = h['params']['color'],
            h['params']['map']) && (l['params']['map'] = h['params']['map']),
          n = box3['setFromObject'](j)['getSize'](new THREE['Vector3']()),
          l['add_params']['model_width'] = Math['max'](n['x'], n['z']) * this['userData']['units'],
          l['add_params']['model_height'] = n['y'] * this['userData']['units'],
          j['material'] = create_material(l));
      }
    },
    Facade_new['prototype']['change_style'] = function(e) {
      this['params']['style'] !== e && (this['params']['style'] = e,
        this['update_price'] = 1,
        this['build']());
    },
    Facade_new['prototype']['get_specs'] = function() {
      let f = {};
      var g = this,
        h = {
          'style': g['params']['style'],
          'group': g['params']['group'],
          'width': g['params']['width'],
          'height': g['params']['height'],
          'thickness': g['params']['thickness'],
          'material': g['params']['material'],
          'is_radius': g['params']['radius'],
          'is_radius_inner': g['params']['inner_radius'],
          'is_double': g['params']['is_double'],
          'is_triple': g['params']['is_triple'],
          'flip': g['params']['flip'],
          'facade': g['params']['facade']
        };
      isNaN(parseInt(h['style'])) && (h['is_radius'] ? 'full' == h['style'] ? (h['style'] = this['params'][
          'facade_data']['compatibility_types']['radius'],
        h['style'] || (h['style'] = this['params']['facade_data']['compatibility_types']['radius_full'])) : h[
        'style'] = this['params']['facade_data']['compatibility_types']['radius_window'] : h['style'] = this[
        'params']['facade_data']['compatibility_types'][h['style']]);
      let j = 'common',
        k = '';
      if (h['is_radius'] && (j = 'radius'),
        h['is_radius_inner'] && (j = 'radius_inner'),
        h['is_double'] && (j = 'double'),
        'radius_inner' == (j = h['is_triple'] ? 'triple' : j) && (k = 'Внутренний\x20радиус'),
        'radius' == j || 'common' == j)
        try {
          k = this['params']['facade_data']['types'][h['style']]['name'];
        } catch (o) {
          k = k || 'asdfd';
        }
      'double' == j && (k = this['params']['facade_data']['types_double'][h['style']]['name']),
        'triple' == j && (k = this['params']['facade_data']['types_triple'][h['style']]['name']);
      let l = 0;
      if (l = 'radius' == j || 'radius_inner' == j ? 2 * Math['PI'] * h['width'] / 1000 * h['height'] / 1000 / 4 :
        h['width'] / 1000 * h['height'] / 1000,
        this['params']['facade_data']['prices_fixed']) {
        var n = materials_lib['get_item'](h['material'])['code'],
          n;
        if (this['params']['facade_data']['prices_fixed']['mat_codes'][n] && this['params']['facade_data'][
            'prices_fixed'
          ]['mat_codes'][n][h['style']] && this['params']['facade_data']['prices_fixed']['mat_codes'][n][h['style']][h[
            'width'] + '_' + h['height']])
          return (n = this['params']['facade_data']['prices_fixed']['mat_codes'][n][h['style']][h['width'] + '_' + h[
              'height']])['facade'] = g['params']['facade'],
            f = {
              'is_fix': true,
              'data': n
            };
      }
      return f = {
        'type_key': j,
        'style': h['style'],
        'data': {
          'facade_set_id': this['params']['facade'],
          'name': k,
          'width': h['width'],
          'height': h['height'],
          'thickness': h['thickness'],
          'id': h['material'],
          'm2': l,
          'pm': 0,
          'per': 2 * (h['width'] + h['height']),
          'group': h['group'],
          'flip': h['flip']
        }
      };
    },
    Facade_new['prototype']['get_glass_specs'] = function() {
      let f = null,
        g = 0;
      for (let h = 0; h < this['model']['children']['length']; h++)
        -
        1 < this['model']['children'][h]['name']['indexOf']('glass') && (g = 1);
      return f = 1 == g ? this['params']['glass_material'] == glass_mat ? {
        'id': 0,
        'm2': this['params']['width'] / 1000 * this['params']['height'] / 1000,
        'pm': 0
      } : {
        'id': this['params']['glass_material'],
        'm2': this['params']['width'] / 1000 * this['params']['height'] / 1000,
        'pm': 0
      } : f;
    },
    Facade_new['prototype']['has_glass'] = function() {
      let f = 0;
      for (let g = 0; g < this['model']['children']['length']; g++)
        -
        1 < this['model']['children'][g]['name']['indexOf']('glass') && (f = 1);
      return 1 == f;
    },
    Facade_new['prototype']['change_facade'] = function(f) {
      var g = this,
        f;
      f['id'] || (f['id'] = 0),
        f['material'] || (f['material'] = 0),
        this['params']['material'] = f['material'],
        this['params']['facade'] = f['id'],
        setTimeout(h => {
          this['build']();
        }, 10),
        'edges' === global_options['mode'] && 'function' == typeof(f = g['params']['parent'])['edges_mode'] && f[
          'edges_mode']();
    };
class OrbitControlsGizmo {
  constructor(j, q) {
    let A = {
        'x': (q = Object['assign']({
          'size': 90,
          'padding': 8,
          'bubbleSizePrimary': 15,
          'bubbleSizeSecondary': 10,
          'buttonRadius': 30,
          'lineWidth': 2,
          'orto': true,
          'room': false,
          'fontSize': '12px',
          'fontFamily': 'Roboto',
          'fontWeight': 'bold',
          'fontColor': '#FFFFFF',
          'className': 'axes-helper',
          'colors': {
            'x': ['#f73c3c', '#942424'],
            'y': ['#6ccb26', '#417a17'],
            'z': ['#178cf0', '#0e5490']
          },
          'canvas': null
        }, q))['padding'],
        'y': q['padding'],
        'width': q['buttonRadius'],
        'height': q['buttonRadius']
      },
      B = (this['lock'] = false,
        this['lockX'] = false,
        this['lockY'] = false,
        this['update'] = () => {
          if (!this['lock']) {
            D['updateMatrix'](),
              F['extractRotation'](D['matrix'])['invert']();
            for (let ac = 0, ad = O.length; ac < ad; ac++)
              ab(O[ac], F);
            O['sort']((ae, af) => ae['position']['z'] > af['position']['z'] ? 1 : -1),
              aa(true);
          }
        },
        this['dispose'] = () => {
          C['removeEventListener']('change', this['update']),
            C['removeEventListener']('start', () => this['domElement']['classList']['add']('inactive')),
            C['removeEventListener']('end', () => this['domElement']['classList']['remove']('inactive')),
            this['domElement']['removeEventListener']('pointerdown', a2, false),
            this['domElement']['removeEventListener']('pointerenter', a4, false),
            this['domElement']['removeEventListener']('pointermove', a5, false),
            this['domElement']['removeEventListener']('click', a7, false),
            window['removeEventListener']('pointermove', a6, false),
            window['removeEventListener']('pointerup', a3, false),
            this['domElement']['remove']();
        },
        this),
      C = j,
      D = j['object'],
      F = new THREE['Matrix4'](),
      G = new THREE['Vector3'](),
      I = new THREE['Vector2'](),
      J = new THREE['Vector2'](),
      K = new THREE['Vector2'](),
      N = new THREE['Vector3'](q['size'] / 2, q['size'] / 2, 0),
      O = a0(),
      P = null,
      Q = false,
      S = false,
      U, W, Z;

    function a0() {
      var ac = q['colors'],
        ad = q['lineWidth'];
      const ae = 0,
        af = q['bubbleSizePrimary'],
        ag = q['bubbleSizeSecondary'];
      return [{
        'axis': 'x',
        'direction': new THREE['Vector3'](1, 0, 0),
        'size': af,
        'color': ac['x'],
        'line': ad,
        'label': 'X',
        'position': new THREE['Vector3'](0, 0, 0)
      }, {
        'axis': 'y',
        'direction': new THREE['Vector3'](0, 1, 0),
        'size': af,
        'color': ac['y'],
        'line': ad,
        'label': 'Y',
        'position': new THREE['Vector3'](0, 0, 0)
      }, {
        'axis': 'z',
        'direction': new THREE['Vector3'](0, 0, 1),
        'size': af,
        'color': ac['z'],
        'line': ad,
        'label': 'Z',
        'position': new THREE['Vector3'](0, 0, 0)
      }, {
        'axis': '-x',
        'direction': new THREE['Vector3'](-1, 0, 0),
        'size': ag,
        'color': ac['x'],
        'position': new THREE['Vector3'](0, 0, 0)
      }, {
        'axis': '-y',
        'direction': new THREE['Vector3'](0, -1, 0),
        'size': ag,
        'color': ac['y'],
        'position': new THREE['Vector3'](0, 0, 0)
      }, {
        'axis': '-z',
        'direction': new THREE['Vector3'](0, 0, -1),
        'size': ag,
        'color': ac['z'],
        'position': new THREE['Vector3'](0, 0, 0)
      }];
    }

    function a1() {
      var ac = document['createElement']('canvas'),
        ad;
      return ac['width'] = q['size'],
        ac['height'] = q['size'],
        ac['classList']['add'](q['className']),
        ac['addEventListener']('pointerdown', a2, false),
        ac['addEventListener']('pointerenter', a4, false),
        ac['addEventListener']('pointermove', a5, false),
        ac['addEventListener']('click', a7, false),
        ac['style']['position'] = 'absolute',
        ac['style']['right'] = '10px',
        ac['style']['bottom'] = '10px',
        ac['style']['border'] = 'none',
        ac['style']['zIndex'] = '15000',
        ac['style']['pointerEvents'] = 'auto',
        ac['style']['width'] = q['size'] + 'px',
        ac['style']['height'] = q['size'] + 'px',
        ac['style']['transition'] = 'background-color\x200.15s\x20linear',
        U = ac['getContext']('2d'),
        document['getElementById']('viewport')['appendChild'](ac),
        ac;
    }

    function a2(ac) {
      I['set'](ac['clientX'], ac['clientY']),
        Z = C['enabled'],
        C['enabled'] = false,
        window['addEventListener']('pointermove', a6, false),
        window['addEventListener']('pointerup', a3, false);
    }

    function a3() {
      setTimeout(() => S = false, 0),
        B['domElement']['classList']['remove']('dragging'),
        C['enabled'] = Z,
        window['removeEventListener']('pointermove', a6, false),
        window['removeEventListener']('pointerup', a3, false);
    }

    function a4() {
      W = B['domElement']['getBoundingClientRect']();
    }

    function a5(ac) {
      if (!S && !B['lock']) {
        var ad = P,
          ae = Q,
          af, ag, ac, ah, ai, aj;
        P = null,
          Q = false,
          ac && G['set'](ac['clientX'] - W['left'], ac['clientY'] - W['top'], 0);
        for (let ak = 0, al = O.length; ak < al; ak++) {
          G['distanceTo'](O[ak]['position']) < O[ak]['size'] && (P = O[ak]);
        }
        ac && q['orto'] && (ag = ac['clientX'] - W['left'],
            ac = ac['clientY'] - W['top'],
            ah = A['x'] + A['width'] / 2,
            ai = A['y'] + A['height'] / 2,
            aj = Math['min'](A['width'], A['height']) / 2,
            Q = Math['hypot'](ag - ah, ac - ai) <= aj),
          ae !== Q && aa(),
          ad !== P && aa();
      }
    }

    function a6(ac) {
      B['lock'] || (S || B['domElement']['classList']['add']('dragging'),
        S = true,
        P = null,
        Q = false,
        J['set'](ac['clientX'], ac['clientY']),
        K['subVectors'](J, I)['multiplyScalar'](0.5),
        B['lockX'] || C['_rotateLeft'](2 * Math['PI'] * K['x'] / B['domElement']['height']),
        B['lockY'] || C['_rotateUp'](2 * Math['PI'] * K['y'] / B['domElement']['height']),
        I['copy'](J),
        C['update']());
    }

    function a7(ac) {
      var ad = ac['clientX'] - W['left'],
        ac = ac['clientY'] - W['top'];
      if (sc['select_object'](null),
        dControls['s_helper']['hide'](),
        pp['interface']['root']?.['radial_hide'] && pp['interface']['root']['radial_hide'](),
        ad >= A['x'] && ad <= A['x'] + A['width'] && ac >= A['y'] && ac <= A['y'] + A['height'] && q['orto']) {
        if ('3d' === global_options['camera_mode']) {
          var ad = q['room'] ? room : cabinet || active_el || false;
          if (!ad)
            return;
          D = camera_ortho,
            global_materials['edges_mode_materials'] = {},
            global_options['edges_mode'][0]['opacity'] = 0.1,
            'edges' == global_options['mode'] && 0 == q['room'] && ad['edges_mode'](),
            0 == q['room'] && projectionObject(ad, 'front'),
            1 == q['room'] && projection('front');
        } else {
          var ac = q['room'] ? room : cabinet || active_el || false;
          if (!ac)
            return;
          D = camera_persp,
            global_materials['edges_mode_materials'] = {},
            global_options['edges_mode'][0]['opacity'] = 0.7,
            'edges' == global_options['mode'] && 0 == q['room'] && ac['edges_mode'](),
            camera_mode_3d();
        }
        aa();
      }
      if (!S && P) {
        if ('3d' === global_options['camera_mode']) {
          var ad = q['room'] ? room : cabinet || active_el || false;
          if (!ad)
            return;
          var ac = new THREE['Box3']()['setFromObject'](ad);
          let ae = new THREE['Vector3']();
          ac['getCenter'](ae);
          let af;
          var ad = D['position']['distanceTo'](ae),
            ac = {
              'x': new THREE['Vector3'](ad, 0, 0),
              '-x': new THREE['Vector3'](-ad, 0, 0),
              'y': new THREE['Vector3'](0, ad, 0),
              '-y': new THREE['Vector3'](0, -ad, 0),
              'z': new THREE['Vector3'](0, 0, ad),
              '-z': new THREE['Vector3'](0, 0, -ad)
            };
          if (!(af = ac[P['axis']]))
            return;
          af['add'](ae);
          let ag = 400,
            ah = performance['now'](),
            ai = 1;

          function aj() {
            var ak, al = performance['now']() - ah,
              al = Math['min'](al / ag, 1);
            if (D['position']['lerp'](af, al),
              D['lookAt'](ae),
              C['target']['copy'](ae),
              C['update'](),
              1 !== al)
              return requestAnimationFrame(aj);
            a5();
          }
          aj();
        } else {
          var ad = q['room'] ? room : cabinet || active_el || false;
          if (!ad)
            return;
          var ac = {
              'x': 'left',
              '-x': 'right',
              'y': 'top',
              '-y': 'bottom',
              'z': 'front',
              '-z': 'back'
            },
            ac = (D = camera_ortho,
              ac[P['axis']] || 'front');
          0 == q['room'] && projectionObject(ad, ac),
            1 == q['room'] && projection(ac);
          let ak = P['direction']['clone']();
          var ad = D['position']['distanceTo'](C['target']);
          ak['multiplyScalar'](ad);
          let al = 400,
            am = performance['now'](),
            an = 1;

          function ao() {
            var ap, aq = performance['now']() - am,
              aq = Math['min'](aq / al, 1);
            if (D['position']['lerp'](ak, aq),
              C['update'](),
              1 !== aq)
              return requestAnimationFrame(ao);
            a5();
          }
          0 == q['room'] && ao();
        }
        Q = false,
          P = null;
      }
    }

    function a8(ac, ad = 10, ae = '#FF0000') {
      U['beginPath'](),
        U['arc'](ac['x'], ac['y'], ad, 0, 2 * Math['PI'], false),
        U['fillStyle'] = ae,
        U['fill'](),
        U['closePath']();
    }

    function a9(ac, ad, ae = 1, af = '#FF0000') {
      U['beginPath'](),
        U['moveTo'](ac['x'], ac['y']),
        U['lineTo'](ad['x'], ad['y']),
        U['lineWidth'] = ae,
        U['strokeStyle'] = af,
        U['stroke'](),
        U['closePath']();
    }

    function aa(ac) {
      ac && U['clearRect'](0, 0, B['domElement']['width'], B['domElement']['height']);
      for (let ai = 0, aj = O.length; ai < aj; ai++) {
        var ad = O[ai],
          ae = P === ad,
          af = -0.01 <= ad['position']['z'] ? ad['color'][0] : ad['color'][1];
        ad['line'] && a9(N, ad['position'], ad['line'], af),
          a8(ad['position'], ad['size'], ae ? '#4A4A4A' : af),
          ad['label'] && (U['font'] = [q['fontWeight'], q['fontSize'], q['fontFamily']]['join']('\x20'),
            U['fillStyle'] = q['fontColor'],
            U['textBaseline'] = 'middle',
            U['textAlign'] = 'center',
            U['fillText'](ad['label'], ad['position']['x'], ad['position']['y']));
      }
      var ac, ag, ah;
      q['orto'] && (ac = A['x'] + A['width'] / 2,
        ag = A['y'] + A['height'] / 2,
        ah = Math['min'](A['width'], A['height']) / 2,
        U['beginPath'](),
        U['arc'](ac, ag, ah, 0, 2 * Math['PI']),
        U['fillStyle'] = Q ? '#4A4A4A' : '#3399ff',
        U['fill'](),
        U['closePath'](),
        U['font'] = 'bold\x2012px\x20Roboto',
        U['fillStyle'] = '#ffffff',
        U['textAlign'] = 'center',
        U['textBaseline'] = 'middle',
        U['fillText']('2d' === global_options['camera_mode'] ? '2D' : '3D', ac, ag));
    }

    function ab(ac) {
      var ad = ac['direction']['clone']()['applyMatrix4'](F),
        ae = ac['size'];
      ac['position']['set'](ad['x'] * (N['x'] - ae / 2 - q['padding']) + N['x'], N['y'] - ad['y'] * (N['y'] - ae /
        2 - q['padding']), ad['z']);
    }
    C['addEventListener']('change', this['update']),
      C['addEventListener']('start', () => this['domElement']['classList']['add']('inactive')),
      C['addEventListener']('end', () => this['domElement']['classList']['remove']('inactive')),
      this['domElement'] = a1(),
      this['update']();
  }
}
THREE['OrbitControlsGizmo'] = OrbitControlsGizmo,
  (110 < parseInt(THREE['REVISION']) && (THREE['PlaneBufferGeometry'] = THREE['PlaneGeometry'],
      THREE['BoxBufferGeometry'] = THREE['BoxGeometry'],
      THREE['CylinderBufferGeometry'] = THREE['CylinderGeometry'],
      THREE['ExtrudeBufferGeometry'] = THREE['ExtrudeGeometry']),
    view_mode = false,
    -1 < location['href']['indexOf']('on_demand_render') && (pp['config']['on_demand_render'] = true));
let date_time = new Date()['getTime'](),
  date_timestamp = '?' + date_time,
  urls = {
    'accessories': 'data/accessories.json' + date_timestamp,
    'materials': 'data/materials.json' + date_timestamp,
    'glass_materials': 'data/glass_materials.json' + date_timestamp,
    'facade_categories': 'data/facade_categories.json' + date_timestamp,
    'facade_sets': 'data/facade_sets.json' + date_timestamp,
    'kitchen_templates': 'data/kitchen_templates.json' + date_timestamp,
    'tech_catalog': 'data/tech_catalog.json' + date_timestamp,
    'comms_catalog': 'data/comms_catalog.json' + date_timestamp,
    'interior_catalog': 'data/interior_catalog.json' + date_timestamp,
    'kitchen_models': 'data/kitchen_models.json' + date_timestamp,
    'handles': 'data/handles.json' + date_timestamp,
    'prices': 'data/prices.json' + date_timestamp,
    'sections': 'data/sections.json' + date_timestamp,
    'constructor_settings': 'data/constructor_settings.json' + date_timestamp,
    'project_settings': 'data/project_settings.json' + date_timestamp,
    'project_settings_common': 'data/project_settings_common.json' + date_timestamp,
    'language': 'data/language.json' + date_timestamp,
    'tabletop_plints': 'data/tabletop_plints.json' + date_timestamp,
    'facade_systems': '/common_assets/data/fs_makberry.json' + date_timestamp,
    'built_in_models_common': '/common_assets/data/built_in_models_common.json' + date_timestamp,
    'catalog': 'data/catalog.json' + date_timestamp,
    'models3d': 'data/models3d.json' + date_timestamp,
    'mat_types': 'data/mat_types.json' + date_timestamp,
    'params_blocks': 'data/params_blocks.json' + date_timestamp,
    'backgrounds': 'data/backgrounds.json' + date_timestamp,
    'cornice': 'data/cornice.json' + date_timestamp,
    'cokol': 'data/cokol.json' + date_timestamp,
    'cokol_top': 'data/cokol_top.json' + date_timestamp,
    'legs': 'data/legs.json' + date_timestamp,
    'hole': 'data/hole.json' + date_timestamp,
    'furniture': 'data/furniture.json' + date_timestamp,
    'catalogs_info': 'data/catalogs_info.json' + date_timestamp,
    'catalogs_by_key': 'data/catalogs_by_key.json' + date_timestamp,
    'materials_info': 'data/materials_info.json' + date_timestamp,
    'materials_by_key': 'data/materials_by_key.json' + date_timestamp,
    'butts_info': 'data/butts_info.json' + date_timestamp,
    'butts_by_key': 'data/butts_by_key.json' + date_timestamp,
    'key_value': 'data/key_value.json' + date_timestamp,
    'modules_groups': 'data/modules_groups.json' + date_timestamp,
    'washes': 'data/washes.json' + date_timestamp,
    'smes': 'data/smes.json' + date_timestamp,
    'lockers': 'data/lockers.json' + date_timestamp,
    'bardesks': 'data/bardesks.json' + date_timestamp,
    'tabletop': 'data/tabletop.json' + date_timestamp,
    'defaults': 'data/defaults.json' + date_timestamp,
    'models': 'data/models.json' + date_timestamp,
    'model_materials': 'data/model_materials.json' + date_timestamp
  };

function get_url_params() {
  var f;
  return new URLSearchParams(location['search'])['forEach'](function(g, h) {
      global_options['url_params'][h] = g;
    }),
    global_options['url_params'];
}
async function load_params() {
    var f = {
        'materials': function(B) {
          convert_lib(materials_lib, B),
            (materials_catalog = B)['categories']['push']({
              'id': 0,
              'name': 'Без\x20категории'
            }),
            materials_catalog['items']['push']({
              'id': 0,
              'category': 0,
              'name': 'Материал\x20не\x20найден',
              'code': '',
              'params': {
                'color': '#ffffff'
              },
              'add_params': {}
            }),
            pp['libs']['decors'] = materials_lib;
        },
        'glass_materials': function(B) {
          convert_lib(glass_lib, B),
            (glass_materials_catalog = B)['categories']['push']({
              'id': 0,
              'name': 'Без\x20категории'
            }),
            glass_materials_catalog['items']['push']({
              'id': 0,
              'category': 0,
              'name': 'Материал\x20не\x20найден',
              'code': '',
              'params': {
                'color': '#ffffff'
              },
              'add_params': {}
            }),
            glass_materials_catalog['categories']['length'] || (glass_materials_catalog['categories'][0] = {});
        },
        'facade_categories': function(B) {
          facades_categories = B;
        },
