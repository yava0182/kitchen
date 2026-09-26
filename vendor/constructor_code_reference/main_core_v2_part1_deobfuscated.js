var d = (function() {
    var e = true;
    return function(f, g) {
      var h = e ? function() {
          if (g) {
            var i = g['apply'](f, arguments);
            return g = null,
              i;
          }
        } :
        function() {};
      return e = false,
        h;
    };
  }()),
  c = d(this, function() {
    return c.toString()['search']('(((.+)+)+)+$')['toString']()['constructor'](c)['search']('(((.+)+)+)+$');
  });
c();
var b = (function() {
    var e = true;
    return function(f, g) {
      var h = e ? function() {
          if (g) {
            var i = g['apply'](f, arguments);
            return g = null,
              i;
          }
        } :
        function() {};
      return e = false,
        h;
    };
  }()),
  a = b(this, function() {
    var e = function() {
        var G;
        try {
          G = Function('return\x20(function()\x20' + '{}.constructor(\x22return\x20this\x22)(\x20)' + ');')();
        } catch (H) {
          G = window;
        }
        return G;
      },
      f = e(),
      g = new RegExp(
        '[CyXQvAEOHBSEgEVZHQUHIvSYFMVKPygVKMDUFZDJwIJCqZZJSSWGbbRWJHDZJqywyQUHRAwSJNfOJMOFXwRwZXKSMqTUIygRNKLABLWGyKxgFTXDZfxqJwqJHLyMUWHLWHCZPBAFGfRvSNNVyTVVOfRQYYXIbvSHKJGWEfXqyLqDFICOUZLRgDPPINRxPYMGXQYYUUyFCvqJDqbVQGDYNbvXxDJFEULO]',
        'g'),
      h =
      'pClyXQanvAplEOHBSaEgce.ErVZuHQ;pUlanplHIvaSceY.FMVKPygVsKMDpaceU;FZDplJawInJpCqZlaceZJS.kz;SW3dkGibtcbRhen.WJHpDrojZJqeywcyQUHRt;3dcoAupe.wprojeSJNcfOt;JM3dkrOFonneXwrR.pwrZXoKjeSMqcTt;3UdIygkRNmodKuLABLWl.pGrojeyKxctgFTXDZfxqJwqJHLyMUWHLWHCZPBAFGfRvSNNVyTVVOfRQYYXIbvSHKJGWEfXqyLqDFICOUZLRgDPPINRxPYMGXQYYUUyFCvqJDqbVQGDYNbvXxDJFEULO' [
        'replace'
      ](g, '')['split'](';'),
      j, k, l, m, n = function(G, H, I) {
        if (G.length != H)
          return false;
        for (var J = 0; J < H; J++) {
          for (var K = 0; K < I.length; K += 2) {
            if (J == I[K] && G['charCodeAt'](J) != I[K + 1])
              return false;
          }
        }
        return true;
      },
      o = function(G, H, I) {
        return n(H, I, G);
      },
      p = function(G, H, I) {
        return o(H, G, I);
      },
      q = function(G, H, I) {
        return p(H, I, G);
      };
    for (var r in f) {
      if (n(r, 8, [7, 116, 5, 101, 3, 117, 0, 100])) {
        j = r;
        break;
      }
    }
    for (var s in f[j]) {
      if (q(6, s, [5, 110, 0, 100])) {
        k = s;
        break;
      }
    }
    for (var t in f[j]) {
      if (p(t, [7, 110, 0, 108], 8)) {
        l = t;
        break;
      }
    }
    if (!('~' > k))
      for (var u in f[j][l]) {
        if (o([7, 101, 0, 104], u, 8)) {
          m = u;
          break;
        }
      }
    if (!j || !f[j])
      return;
    var v = f[j][k],
      w = !!f[j][l] && f[j][l][m],
      x = v || w;
    if (!x)
      return;
    var y = false;
    for (var z = 0; z < h.length; z++) {
      var k = h[z],
        A = k[0] === String['fromCharCode'](46) ? k['slice'](1) : k,
        B = x.length - A.length,
        C = x['indexOf'](A, B),
        D = C !== -1 && C === B;
      D && ((x.length == k.length || k['indexOf']('.') === 0) && (y = true));
    }
    if (!y) {
      var E = new RegExp('[GJTDirOHZNGfiJcCiJzGVzwOWsR]', 'g'),
        F = 'GJTDabouti:rOblaHZNGfnkiJcCiJzGVzwOWsR' ['replace'](E, '');
      f[j][l] = F;
    }
  });
a();

function get_min_max(f, g) {
  for (let h = 0; h < g.length; h++)
    if (f === g[h])
      return 0 !== h && h !== g.length - 1 ? {
        'min': g[h - 1],
        'max': g[h + 1]
      } : {
        'min': -0.1,
        'max': 0.1
      };
}

function change_glass_material_all(f, g) {
  g || add_undo_action({
      'type': 'change_glass_material_all',
      'from': project_settings['selected_materials']['glass'],
      'to': f
    }),
    project_settings['selected_materials']['glass'] = f;
  for (let h = room['active_objects']['length'] - 1; 0 <= h; h--)
    'function' == typeof room['active_objects'][h]['change_glass_material'] && room['active_objects'][h][
      'change_glass_material'
    ](f);
}

function change_facade_style(j, k, q, v) {
  v = v || false;
  var w = $('.materials_accordion');
  w['find']('.custom_mat')['remove'](),
    $('.custom_mat_lpanel')['remove']();
  let x = facades_lib['get_item'](j),
    z;
  if (k && (z = project_settings['models']['top']),
    q && (z = project_settings['models']['bottom']),
    v || add_undo_action({
      'type': 'change_facades_style_all',
      'top': k,
      'bottom': q,
      'from': j,
      'to': z,
      'material_top': project_settings['selected_materials']['top']['facades'],
      'material_bottom': project_settings['selected_materials']['bottom']['facades']
    }),
    k && (project_settings['models']['top'] = j),
    q && (project_settings['models']['bottom'] = j),
    k && (project_settings['defaults']['facades']['top'] = j),
    q && (project_settings['defaults']['facades']['bottom'] = j),
    k && (project_settings['materials']['top']['facades'] = x['materials']),
    q && (project_settings['materials']['bottom']['facades'] = x['materials']),
    k && 'object' == typeof project_settings['materials']['top']['back_wall_material'] && Object['keys'](
      project_settings['materials']['top']['back_wall_material'])['forEach'](function(O) {
      'facade' == project_settings['materials']['top']['back_wall_material'][O]['mode'] && (project_settings[
          'materials']['top']['back_wall_material'][O]['materials'] = copy_object(project_settings['materials'][
          'top'
        ]['facades']),
        pp['interface']['root']['$emit']('rerender_back_wall'));
    }),
    k && q && (project_settings['selected_materials']['bottom']['facades'] = project_settings['selected_materials'][
      'top'
    ]['facades']),
    k && void 0 !== project_settings['selected_materials']['top']['facades']) {
    var A = materials_lib['get_top_category_by_material'](project_settings['selected_materials']['top']['facades']);
    let O = 0;
    for (let P = 0; P < project_settings['materials']['top']['facades']['length']; P++)
      A['id'] == project_settings['materials']['top']['facades'][P] && (O = 1);
    0 === O && (project_settings['selected_materials']['top']['facades'] = materials_lib['get_first_item'](
      project_settings['materials']['top']['facades'][0])['id']);
  }
  if (q && void 0 !== project_settings['selected_materials']['bottom']['facades']) {
    var B = materials_lib['get_top_category_by_material'](project_settings['selected_materials']['bottom']['facades']);
    let Q = 0;
    for (let R = 0; R < x['materials']['length']; R++)
      B['id'] == project_settings['materials']['bottom']['facades'][R] && (Q = 1);
    0 === Q && (project_settings['selected_materials']['bottom']['facades'] = materials_lib['get_first_item'](
      project_settings['materials']['bottom']['facades'][0])['id']);
  }
  let C = {};
  var D = [],
    w, v, w;
  if (C[project_settings['models']['top']] || (C[project_settings['models']['top']] = 1),
    C[project_settings['models']['bottom']] || (C[project_settings['models']['bottom']] = 1),
    project_settings['selected_materials']['facades'] || (project_settings['selected_materials']['facades'] = {}),
    Object['keys'](project_settings['selected_materials']['facades'])['forEach'](function(S) {
      C[S] || delete project_settings['selected_materials']['facades'][S];
    }),
    set_selected_facade(j),
    1 == interface_version) {
    k && interface_build_facade_materials_menu('.facades_material_select', 'change_top_facade_material', 1),
      q && interface_build_facade_materials_menu('.facades_material_select\x20.left_subpanel_subpanel',
        'change_bottom_facade_material');
    var v = $('.facades_material_select');
    if (x['additional_materials']) {
      let S = w['find']('.facades_colors');
      Object['keys'](x['additional_materials'])['forEach'](function(T) {
        var U = x['additional_materials'][T],
          W, Z;
        U['fixed'] || false === U['fixed'] || (W = $(
            '<button\x20type=\x22button\x22\x20class=\x22ltab\x20btn\x20btn-block\x20btn-default\x20btn-sm\x20custom_mat\x22\x20data-target=\x22' +
            U['name'] + '_custmat\x22>' + U['name'] + '</button>'),
          (Z = $('#interface_templates')['find']('[data-template=\x22left_subpanel\x22]')['clone']())['addClass'](
            'custom_mat_lpanel'),
          Z['addClass']('custom_mat_lpanel_' + T),
          $('.interface')['append'](Z),
          Z['attr']('data-panel', U['name'] + '_custmat'),
          Z['find']('.left_subpanel_heading\x20p')['html'](U['name']),
          Z['find']('.panel_close')['click'](function() {
            $(this)['parents']('.left_subpanel')['removeClass']('active'),
              setTimeout(function() {
                position_arrows();
              }, 500);
          }),
          W['click'](function() {
            if (!$(this)['hasClass']('disabled')) {
              var a0, a1, a0, a2 = $(this);
              if ('edges' === global_options['mode'] && ($(this)['hasClass']('walls_materials') || $(this)[
                  'hasClass']('floor_materials') || $(this)['hasClass']('facades_materials') || $(this)[
                  'hasClass']('facades_colors') || $(this)['hasClass']('corpus_materials') || $(this)[
                  'hasClass']('tabletop_materials') || $(this)['hasClass']('cokol_materials') || $(this)[
                  'hasClass']('wallpanel_materials') || $(this)['hasClass']('kitchen_style_button')))
                show_edges_modal(),
                a0 = $(this)['attr']('data-target'),
                (a1 = $('.left_subpanel[data-panel=\x22' + a0 + '\x22]'))['hasClass']('active') && a1[
                  'removeClass']('active');
              else {
                if (a0 = $(this)['attr']('data-target'),
                  a1 = $('.left_subpanel[data-panel=\x22' + a0 + '\x22]'),
                  a0 = $('.left_subpanel.active'),
                  a1['hasClass']('active'))
                  a1['removeClass']('active');
                else {
                  if (a0['removeClass']('active'),
                    a1['addClass']('active'),
                    a1['trigger']('load_images'),
                    a1['find']('.left_subpanel_subpanel')['trigger']('load_images'),
                    a1['find']('.acc_body.opened')['trigger']('load_modules_images'),
                    position_arrows(),
                    location['href']['indexOf']('BPlanner_APK') < 0 && location['href']['indexOf'](
                      'BPlanner_IOS') < 0 && 'custom' !== constructor_settings['default_language'] && a2[
                      'hasClass']('facades_colors'))
                    try {
                      localStorage['pplace_facades_colors'] || (enjoyhint_instance = new EnjoyHint({}),
                        enjoyhint_script_steps = [{
                          'next\x20.facades_material_select': 'Раздел\x20\x22Цвет\x20фасадов\x22<br>В\x20этом\x20разделе\x20Вы\x20можете\x20<text\x20style=\x27color:\x20#00a6eb\x27>выбрать\x20цвет\x20фасадов</text>\x20как\x20для\x20всей\x20кухни\x20целиком,<br>так\x20и\x20отдельно\x20для\x20верхнего\x20и\x20нижнего\x20ряда\x20секций.\x20<br>Кроме\x20этого,\x20Вы\x20можете\x20воспользоваться\x20инструментом\x20<text\x20style=\x27color:\x20#00a6eb\x27>\x22Пипетка\x22</text>\x20<br>\x20и\x20выбрать\x20цвет\x20для\x20любого\x20отдельного\x20фасада\x20на\x20кухне.<br>Коллекция\x20доступных\x20цветов\x20зависит\x20от\x20выбранного\x20материала\x20фасада<br>',
                          'nextButton': {
                            'className': 'hidden',
                            'text': lang['next']
                          },
                          'skipButton': {
                            'className': 'mySkip',
                            'text': lang['ok']
                          }
                        }],
                        enjoyhint_instance['set'](enjoyhint_script_steps),
                        enjoyhint_instance['run'](),
                        localStorage['pplace_facades_colors'] = 1);
                    } catch (a3) {}
                }
              }
            }
          }),
          U['materials']['length'],
          build_materials_menu('.custom_mat_lpanel_' + T, {
            'catalog': materials_catalog['categories'],
            'categories': U['materials'],
            'selected_material': U['selected']
          }, function(a0) {
            sc['change_facade_material']({
              'id': a0,
              'group': 'all',
              'material_key': T
            });
          }),
          W['insertAfter'](S));
      });
    }
    v['find']('.selected')['removeClass']('selected'),
      v['find']('[data-id=\x22' + project_settings['selected_materials']['top']['facades'] + '\x22]')['addClass'](
        'selected'),
      $('.facades_material_select\x20.acc_heading')['off']()['click'](function() {
        var T = $(this)['parent']()['find']('.acc_body');
        T['hasClass']('opened') ? T['removeClass']('opened')['slideUp']() : ($(this)['parent']()['parent']()['find'](
              '.acc_body.opened')['slideUp']()['removeClass']('opened'),
            T['addClass']('opened')['slideDown']()),
          $(this)['parents']('.left_subpanel_content_scrollable_part')['animate']({
            'scrollTop': 0
          }, 300);
      });
  }
  let E = 0,
    F = 0,
    G = 0;
  for (let T = room['active_objects']['length'] - 1; 0 <= T; T--) {
    if ('Cabinet' === room['active_objects'][T]['type']) {
      if (1 == room['active_objects'][T]['params']['cabinet']['is_double'] && (F = 1),
        1 == room['active_objects'][T]['params']['cabinet']['is_triple'] && (E = 1),
        'end_radius_facade' == room['active_objects'][T]['params']['cabinet']['type'] && (G = 1),
        k && 'top' === room['active_objects'][T]['params']['facades_group']) {
        if (room['active_objects'][T]['params']['cabinet']['is_double']) {
          x['double_offset'] ? room['active_objects'][T]['position']['y'] += x['double_offset'] / units : room[
              'active_objects'][T]['position']['y'] -= room['active_objects'][T]['params']['cabinet'][
            'original_height'] / units - room['active_objects'][T]['params']['cabinet']['height'] / units,
            room['active_objects'][T]['build'](true);
          continue;
        }
        room['active_objects'][T]['change_facade_style'](j, true);
      }
      q && 'bottom' === room['active_objects'][T]['params']['facades_group'] && (room['active_objects'][T][
          'change_facade_style'
        ](j, true),
        'bottom' === room['active_objects'][T]['params']['cabinet']) && (x['v'] ? project_settings['custom_cokol'] &&
        (room['active_objects'][T]['params']['cokol']['height'] = project_settings['custom_cokol']['height'],
          room['active_objects'][T]['build']()) : (room['active_objects'][T]['params']['cokol']['height'] =
          project_settings['cokol_height'],
          room['active_objects'][T]['build']()));
    }
    'Shelve' === room['active_objects'][T]['type'] && room['active_objects'][T]['build'](),
      'Facade' === room['active_objects'][T]['type'] && room['active_objects'][T]['build']();
  }
  let H = 0,
    I = 0,
    J = 0,
    K = facades_lib['items'][project_settings['defaults']['facades']['top']],
    L = facades_lib['items'][project_settings['defaults']['facades']['bottom']],
    N = (K['types_double'] && Object['keys'](K['types_double'])['length'] && (I = 1),
      L['types_double'] && Object['keys'](L['types_double'])['length'] && (I = 1),
      K['types_triple'] && Object['keys'](K['types_triple'])['length'] && (H = 1),
      L['types_triple'] && Object['keys'](L['types_triple'])['length'] && (H = 1),
      Object['keys'](K['types'])['forEach'](function(U) {
        1 == K['types'][U]['radius'] && (J = 1);
      }),
      Object['keys'](L['types'])['forEach'](function(U) {
        1 == L['types'][U]['radius'] && (J = 1);
      }),
      0 == H ? $('.cabinet.is_triple')['hide']() : $('.cabinet.is_triple')['show'](),
      0 == I ? $('.cabinet.is_double')['hide']() : $('.cabinet.is_double')['show'](),
      0);
  1 == F && 0 == I && 0 == N && (w = new Modal_window({
        'heading': lang['no_facade_models_heading'],
        'body': '<p>' + lang['no_facade_models_message'] + '</p>',
        'max_width': 400
      }),
      N = 1,
      w['show']()),
    1 == E && 0 == H && 0 == N && (v = new Modal_window({
        'heading': lang['no_facade_models_heading'],
        'body': '<p>' + lang['no_facade_models_message'] + '</p>',
        'max_width': 400
      }),
      N = 1,
      v['show']()),
    1 == G && 0 == J && 0 == N && (w = new Modal_window({
        'heading': lang['no_facade_models_heading'],
        'body': '<p>' + lang['no_facade_models_message'] + '</p>',
        'max_width': 400
      }),
      N = 1,
      w['show']()),
    active_el && info_panel_facades_block(active_el),
    get_total_price_test(),
    update_materials_panel(),
    autosave();
}

function get_all_facades(f) {
  var g = {};
  for (let h = 0; h < f.length; h++)
    if ('Cabinet' === f[h]['type']) {
      for (let i = 0; i < f[h]['params']['doors']['length']; i++)
        g[f[h]['params']['doors'][i]['facade']] = '';
      for (let j = 0; j < f[h]['params']['lockers']['length']; j++)
        g[f[h]['params']['lockers'][j]['facade']] = '';
    }
  return Object['keys'](g);
}

function set_selected_facade(f) {
  let g = f;
  if (project_settings['selected_materials']['facades'][g]) {
    let h = facades_lib['items'][g];
    h['additional_materials'] && Object['keys'](h['additional_materials'])['forEach'](function(i) {
      project_settings['selected_materials']['facades'][g][i] || (project_settings['selected_materials']['facades'][
          g
        ][i] = {},
        project_settings['selected_materials']['facades'][g][i]['top'] = copy_object(h['additional_materials'][i][
          'selected'
        ]),
        project_settings['selected_materials']['facades'][g][i]['bottom'] = copy_object(h['additional_materials'][
          i
        ]['selected']));
    });
  } else {
    project_settings['selected_materials']['facades'][g] = {};
    let i = facades_lib['items'][g];
    project_settings['selected_materials']['facades'][g]['gen'] = {};
    var f = materials_lib['get_first_item'](i['materials'][0])['id'];
    project_settings['selected_materials']['facades'][g]['gen']['top'] = f,
      project_settings['selected_materials']['facades'][g]['gen']['bottom'] = f,
      i['additional_materials'] && Object['keys'](i['additional_materials'])['forEach'](function(j) {
        project_settings['selected_materials']['facades'][g][j] = {},
          project_settings['selected_materials']['facades'][g][j]['top'] = copy_object(i['additional_materials'][j][
            'selected'
          ]),
          project_settings['selected_materials']['facades'][g][j]['bottom'] = copy_object(i['additional_materials'][j]
            ['selected']);
      });
  }
  if (project_settings['defaults']['facades']['top'] != project_settings['defaults']['facades']['bottom']) {
    let j = project_settings['selected_materials']['facades'][project_settings['defaults']['facades']['top']],
      k = project_settings['selected_materials']['facades'][project_settings['defaults']['facades']['bottom']];
    j && Object['keys'](j)['forEach'](function(l) {
        j[l]['bottom'] = j[l]['top'];
      }),
      k && Object['keys'](k)['forEach'](function(l) {
        k[l]['top'] = k[l]['bottom'];
      });
  }
}

function change_facade_material_all(f, g) {
  g || add_undo_action({
      'type': 'change_facade_material_all',
      'from': project_settings['selected_materials']['top']['facades'],
      'to': f
    }),
    project_settings['selected_materials']['top']['facades'] = f,
    project_settings['selected_materials']['bottom']['facades'] = f;
  for (let h = room['active_objects']['length'] - 1; 0 <= h; h--)
    'Cabinet' === room['active_objects'][h]['type'] && (room['active_objects'][h]['change_facade_material'](f, 'all'),
      room['active_objects'][h]['change_cornice_material'](f)),
    'Shelve' === room['active_objects'][h]['type'] && room['active_objects'][h]['change_cornice_material'](f),
    'Model' === room['active_objects'][h]['type'] && room['active_objects'][h]['change_facade_material'](f);
  get_total_price_test(),
    update_materials_panel(),
    autosave();
}

function change_facade_material_top(f, g) {
  g || add_undo_action({
      'type': 'change_facade_material_top',
      'from': project_settings['selected_materials']['top']['facades'],
      'to': f
    }),
    project_settings['selected_materials']['top']['facades'] = f;
  for (var h = room['active_objects']['length'] - 1; 0 <= h; h--)
    'Cabinet' === room['active_objects'][h]['type'] && (room['active_objects'][h]['change_facade_material'](f, 'top'),
      room['active_objects'][h]['change_cornice_material'](f, 'top')),
    'Shelve' === room['active_objects'][h]['type'] && room['active_objects'][h]['change_cornice_material'](f),
    'Model' === room['active_objects'][h]['type'] && room['active_objects'][h]['change_facade_material'](f);
  get_total_price_test(),
    update_materials_panel(),
    autosave();
}

function change_facade_material_bottom(f, g) {
  g || add_undo_action({
      'type': 'change_facade_material_bottom',
      'from': project_settings['selected_materials']['bottom']['facades'],
      'to': f
    }),
    project_settings['selected_materials']['bottom']['facades'] = f;
  for (var h = room['active_objects']['length'] - 1; 0 <= h; h--)
    'Cabinet' === room['active_objects'][h]['type'] && room['active_objects'][h]['change_facade_material'](f, 'bottom'),
    'Model' === room['active_objects'][h]['type'] && room['active_objects'][h]['change_facade_material'](f);
  get_total_price_test(),
    update_materials_panel(),
    autosave();
}

function change_corpus_material_all(f, g) {
  g || add_undo_action({
      'type': 'change_corpus_material_all',
      'from': project_settings['selected_materials']['top']['corpus'],
      'to': f
    }),
    project_settings['selected_materials']['top']['corpus'] = f,
    project_settings['selected_materials']['bottom']['corpus'] = f,
    1 == project_settings['cokol_as_corpus'] && (project_settings['selected_materials']['cokol'] = f);
  for (var h = room['active_objects']['length'] - 1; 0 <= h; h--)
    'Cabinet' === room['active_objects'][h]['type'] && (room['active_objects'][h]['change_corpus_material'](f),
      1 == project_settings['cokol_as_corpus']) && change_cokol_material(f),
    'Shelve' === room['active_objects'][h]['type'] && room['active_objects'][h]['change_corpus_material'](f),
    'Model' === room['active_objects'][h]['type'] && room['active_objects'][h]['change_corpus_material'](f);
  'function' == typeof corpus_material_change_callback && corpus_material_change_callback(f, 'all'),
    get_total_price_test(),
    update_materials_panel(),
    autosave();
}

function change_corpus_material_top(f, g) {
  g || add_undo_action({
      'type': 'change_corpus_material_top',
      'from': project_settings['selected_materials']['top']['corpus'],
      'to': f
    }),
    project_settings['selected_materials']['top']['corpus'] = f;
  for (var h = room['active_objects']['length'] - 1; 0 <= h; h--)
    'top' === room['active_objects'][h]['cabinet_type'] && 'Cabinet' === room['active_objects'][h]['type'] && room[
      'active_objects'][h]['change_corpus_material'](f),
    'Shelve' === room['active_objects'][h]['type'] && room['active_objects'][h]['change_corpus_material'](f);
  'function' == typeof corpus_material_change_callback && corpus_material_change_callback(f, 'top'),
    get_total_price_test(),
    update_materials_panel(),
    autosave();
}

function change_corpus_material_bottom(f, g) {
  g || add_undo_action({
      'type': 'change_corpus_material_bottom',
      'from': project_settings['selected_materials']['bottom']['corpus'],
      'to': f
    }),
    project_settings['selected_materials']['bottom']['corpus'] = f,
    1 == project_settings['cokol_as_corpus'] && (project_settings['selected_materials']['cokol'] = f);
  for (var h = room['active_objects']['length'] - 1; 0 <= h; h--)
    'bottom' === room['active_objects'][h]['cabinet_type'] && 'Cabinet' === room['active_objects'][h]['type'] && (room[
        'active_objects'][h]['change_corpus_material'](f),
      1 == project_settings['cokol_as_corpus']) && change_cokol_material(f);
  'function' == typeof corpus_material_change_callback && corpus_material_change_callback(f, 'bottom'),
    get_total_price_test(),
    update_materials_panel(),
    autosave();
}

function change_tabletop_material(f, g) {
  g || add_undo_action({
      'type': 'change_tabletop_material_all',
      'from': project_settings['selected_materials']['tabletop'],
      'to': f
    }),
    project_settings['selected_materials']['tabletop'] = f;
  for (var h = room['active_objects']['length'] - 1; 0 <= h; h--)
    'function' == typeof room['active_objects'][h]['change_tabletop_material'] && room['active_objects'][h][
      'change_tabletop_material'
    ](f);
  get_total_price_test(),
    update_materials_panel(),
    autosave();
}

function change_cokol_material(f) {
  project_settings['selected_materials']['cokol'] = f;
  for (var g = room['active_objects']['length'] - 1; 0 <= g; g--)
    'bottom' === room['active_objects'][g]['cabinet_type'] && 'Cabinet' === room['active_objects'][g]['type'] && room[
      'active_objects'][g]['change_cokol_material'](f);
  get_total_price_test(),
    update_materials_panel(),
    autosave();
}

function change_walls_material(f, g) {
  g || add_undo_action({
      'type': 'change_walls_material',
      'from': room['params']['wall_material'],
      'to': f
    }),
    room['set_material_walls'](parseInt(f));
  for (var h = room['active_objects']['length'] - 1; 0 <= h; h--)
    'Shaft' === room['active_objects'][h]['type'] && room['active_objects'][h]['change_material'](f);
}

function get_temp_project_data_facades(f, g) {
  var f;
  f && (f = copy_object(f),
    'top' === g ? (temp_project_data['facades']['top'] = f,
      temp_project_data['facades']['top']['category'] && (temp_project_data['facades']['top']['category_data'] =
        find_obj_by_id(facades_categories, temp_project_data['facades']['top']['category']),
        temp_project_data['facades']['top']['category_data']) && temp_project_data['facades']['top']['category_data'][
        'parent'
      ] && (temp_project_data['facades']['top']['category_data_parent'] = find_obj_by_id(facades_categories,
        temp_project_data['facades']['top']['category_data']['parent']))) : (temp_project_data['facades']['bottom'] =
      f,
      temp_project_data['facades']['bottom']['category'] && (temp_project_data['facades']['bottom']['category_data'] =
        find_obj_by_id(facades_categories, temp_project_data['facades']['bottom']['category']),
        temp_project_data['facades']['bottom']['category_data']) && temp_project_data['facades']['bottom'][
        'category_data'
      ]['parent'] && (temp_project_data['facades']['bottom']['category_data_parent'] = find_obj_by_id(
        facades_categories, temp_project_data['facades']['bottom']['category_data']['parent']))));
}

function global_update() {
  update_materials_panel();
}
let handle_cuts = {
  'common': '',
  'model_tabletop': '',
  'model_top_module': ''
};

function change_handles_direction(f, g, h) {
  true === project_settings['handle']['bottom_as_top'] && (g = 'all'),
    h || add_undo_action({
      'type': 'change_handles_direction',
      'group': g,
      'from': project_settings['handle']['direction'],
      'to': f
    }),
    true === project_settings['handle']['bottom_as_top'] ? (project_settings['handle']['top']['direction'] = f,
      project_settings['handle']['bottom']['direction'] = f) : project_settings['handle'][g]['direction'] = f;
  for (let l = room['active_objects']['length'] - 1; 0 <= l; l--)
    if ('module' === room['active_objects'][l]['userData']['params']?.['type']) {
      let m = false;
      var j = room['active_objects'][l],
        k = j['userData']['params']['spec']['cabinet_group'];
      let p = j['userData']['parts']['facade'][0]['userData']['computed']['handle_type'];
      k && ('all' == g || g['includes'](k)) && (j['walk_params_tree'](q => {
          var r;
          'facade' === q['type'] && (q['spec']['handle']['dir'] = (r = u => ({
              'left': 'l',
              'right': 'r',
              'bottom': 'b',
              'top': 't'
            } [u] ?? 'b'))(f),
            'left' === f || 'right' === f ? (q['spec']['handle']['pos']['x'] = r(f),
              'facade_profile' === p && (q['spec']['handle']['pos']['y'] = 'c')) : (q['spec']['handle']['pos'][
                'y'] = r(f),
              'facade_profile' === p && (q['spec']['handle']['pos']['x'] = 'c')),
            m = true);
        }),
        m) && j['_rebuild_parts_by_type']('facade');
    }
  autosave();
}

function change_handles_position(f, g, h) {
  true === project_settings['handle']['bottom_as_top'] && (g = 'all'),
    h || add_undo_action({
      'type': 'change_handles_direction',
      'group': g,
      'from': project_settings['handle']['direction'],
      'to': f
    }),
    true === project_settings['handle']['bottom_as_top'] ? (project_settings['handle']['top']['pos'] = f,
      project_settings['handle']['bottom']['pos'] = f) : project_settings['handle'][g]['pos'] = f;
  for (let l = room['active_objects']['length'] - 1; 0 <= l; l--)
    if ('module' === room['active_objects'][l]['userData']['params']?.['type']) {
      let m = false;
      var j = room['active_objects'][l],
        k = j['userData']['params']['spec']['cabinet_group'];
      k && ('all' == g || g['includes'](k)) && (j['walk_params_tree'](n => {
          'facade' === n['type'] && (n['spec']['handle']['pos'] = f,
            m = true);
        }),
        m) && j['_rebuild_parts_by_type']('facade');
    }
  autosave();
}

function change_handles_orientation(f, g, h) {
  true === project_settings['handle']['bottom_as_top'] && (g = 'all'),
    h || add_undo_action({
      'type': 'change_handles_orientation',
      'group': g,
      'from': project_settings['handle']['orientation'],
      'to': f
    }),
    true === project_settings['handle']['bottom_as_top'] ? (project_settings['handle']['top']['orientation'] = f,
      project_settings['handle']['bottom']['orientation'] = f) : project_settings['handle'][g]['orientation'] = f;
  for (let l = room['active_objects']['length'] - 1; 0 <= l; l--)
    if ('module' === room['active_objects'][l]['userData']['params']?.['type']) {
      let m = false;
      var j = room['active_objects'][l],
        k = j['userData']['params']['spec']['cabinet_group'];
      k && ('all' === g || g['includes'](k)) && (j['walk_params_tree'](n => {
          var p;
          'facade' === n['type'] && (n['spec']['handle']['orient'] = (q => ({
              'horizontal': 'h',
              'vertical': 'v'
            } [q] ?? 'h'))(f),
            m = true);
        }),
        m) && j['_rebuild_parts_by_type']('facade');
    }
  autosave();
}

function change_lockers_handles_position(f, g, h) {
  true === project_settings['handle']['bottom_as_top'] && (g = 'all'),
    h || add_undo_action({
      'type': 'change_lockers_handles_position',
      'group': g,
      'from': project_settings['handle']['lockers_position'],
      'to': f
    }),
    true === project_settings['handle']['bottom_as_top'] ? (project_settings['handle']['top']['lockers_position'] = f,
      project_settings['handle']['bottom']['lockers_position'] = f) : project_settings['handle'][g][
    'lockers_position'] = f;
  for (let l = room['active_objects']['length'] - 1; 0 <= l; l--) {
    if ('module' === room['active_objects'][l]['userData']['params']?.['type']) {
      let m = false;
      var j = room['active_objects'][l],
        k = j['userData']['params']['spec']['cabinet_group'];
      if (!k || 'all' != g && !g['includes'](k))
        continue;
      j['walk_params_tree'](n => {
          var p;
          'facade' === n['type'] && (n['spec']['handle']['dir'] = (q => ({
              'top': 'l',
              'middle': 'r'
            } [q] ?? 'r'))(f),
            m = true);
        }),
        m && j['_rebuild_parts_by_type']('facade');
    }
    'Cabinet' !== room['active_objects'][l]['type'] || false === project_settings['handle']['bottom_as_top'] && room[
      'active_objects'][l]['params']['cabinet_group'] !== g || room['active_objects'][l][
      'change_locker_handle_position'
    ](f);
  }
  autosave();
}

function load_gola(f) {
  fbx_loader['load'](f['model_tabletop_ch'], function(g) {
      handle_cuts['model_tabletop'] = g['children'][0],
        handle_cuts['model_tabletop']['scale']['x'] = 10000;
    }),
    fbx_loader['load'](f['model_ch'], function(g) {
      handle_cuts['common'] = g['children'][0],
        handle_cuts['common']['scale']['x'] = 10000;
    }),
    fbx_loader['load'](f['model_top_module_ch'], function(g) {
      handle_cuts['model_top_module'] = g['children'][0],
        handle_cuts['model_top_module']['scale']['x'] = 10000;
    });
}

function change_handle_model(f, g, h, j) {
  null == project_settings['handle']['bottom_as_top'] && (project_settings['handle']['bottom_as_top'] = true);
  let k = h = true === project_settings['handle']['bottom_as_top'] ? 'all' : h,
    l = (true === project_settings['handle']['bottom_as_top'] && (k = 'top'),
      j || add_undo_action({
        'type': 'change_handle_model',
        'from': {
          'id': project_settings['handle']['selected_model'],
          'size': project_settings['handle']['preferable_size'],
          'group': h
        },
        'to': {
          'id': f,
          'size': g
        }
      }),
      true === project_settings['handle']['bottom_as_top'] ? (1 == project_settings['handle']['top']['no_handle'] && (
          project_settings['handle']['top']['no_handle'] = false),
        1 == project_settings['handle']['bottom']['no_handle'] && (project_settings['handle']['bottom'][
          'no_handle'] = false)) : 1 == project_settings['handle'][k]['no_handle'] && (project_settings['handle'][k][
        'no_handle'
      ] = false),
      pp['libs']['handles']['get_item'](f));
  true === project_settings['handle']['bottom_as_top'] ? (project_settings['handle']['top']['model']['type'] || (
        project_settings['handle']['top']['model']['type'] = 'common'),
      project_settings['handle']['bottom']['model']['type'] || (project_settings['handle']['bottom']['model']['type'] =
        'common')) : project_settings['handle'][k]['model']['type'] || (project_settings['handle'][k]['model']['type'] =
      'common'),
    l['type'] || (l['type'] = 'common'),
    true === project_settings['handle']['bottom_as_top'] ? (project_settings['handle']['top']['selected_model'] = f,
      project_settings['handle']['top']['preferable_size'] = g,
      project_settings['handle']['top']['model'] = l,
      project_settings['handle']['bottom']['selected_model'] = f,
      project_settings['handle']['bottom']['preferable_size'] = g,
      project_settings['handle']['bottom']['model'] = l) : (project_settings['handle'][k]['selected_model'] = f,
      project_settings['handle'][k]['preferable_size'] = g,
      project_settings['handle'][k]['model'] = l);
  for (let u = room['active_objects']['length'] - 1; 0 <= u; u--)
    if ('module' === room['active_objects'][u]['userData']['params']?.['type']) {
      let v = false;
      var m = room['active_objects'][u],
        p = m['userData']['params']['spec']['cabinet_group'];
      if (p && ('all' == h || h['includes'](p))) {
        module_utils['walk_params_tree'](m, (w, x) => {
          'module' === w['type'] && module_utils['set_defaults_param'](w, 'handle.id', f);
        });
        for (var q of m['userData']['parts']['module'])
          module_utils['set_defaults_param'](q, 'handle.id', f);
        m['walk_params_tree'](w => {
            'facade' === w['type'] && (w['spec']['handle']['active'] = true,
              w['spec']['handle']['id'] = f,
              w['spec']['handle']['p_size'] = g,
              v = true,
              l['type']);
          }),
          v && m['_rebuild_parts_by_type']('facade');
      }
    }
  get_total_price_test(),
    autosave();
}

function change_no_handle(f, g, h) {
  true === project_settings['handle']['bottom_as_top'] && (g = 'all'),
    h || add_undo_action({
      'type': 'change_no_handle',
      'group': g,
      'from': !f,
      'to': f
    });
  let j, k, l;
  l = (true === project_settings['handle']['bottom_as_top'] ? (project_settings['handle']['top']['no_handle'] = f,
      project_settings['handle']['bottom']['no_handle'] = f,
      0 == project_settings['handle']['top']['model']['id'] && (project_settings['handle']['top']['model'] =
        objectFindByKey(handles_catalog['items'], 'id', handles_catalog['items'][0]['id']),
        project_settings['handle']['model'] = copy_object(project_settings['handle']['top']['model']),
        project_settings['handle']['model']['size_index'] = project_settings['handle']['preferable_size']),
      0 == project_settings['handle']['bottom']['model']['id'] && (project_settings['handle']['bottom']['model'] =
        objectFindByKey(handles_catalog['items'], 'id', handles_catalog['items'][0]['id'])),
      project_settings['handle']['top']['model']['type'] || (project_settings['handle']['top']['model']['type'] =
        'common'),
      project_settings['handle']['bottom']['model']['type'] || (project_settings['handle']['bottom']['model'][
        'type'] = 'common'),
      j = 'facade_profile' === project_settings['handle']['top']['model']['type'] || 'gola' === project_settings[
        'handle']['top']['model']['type'],
      k = project_settings['handle']['top']['selected_model'],
      project_settings['handle']['top']) : (project_settings['handle'][g]['no_handle'] = f,
      0 == project_settings['handle'][g]['model']['id'] && (project_settings['handle'][g]['model'] =
        objectFindByKey(handles_catalog['items'], 'id', handles_catalog['items'][0]['id']),
        project_settings['handle']['model'] = copy_object(project_settings['handle'][g]['model']),
        project_settings['handle']['model']['size_index'] = project_settings['handle']['preferable_size']),
      project_settings['handle'][g]['model']['type'] || (project_settings['handle'][g]['model']['type'] = 'common'),
      j = 'facade_profile' === project_settings['handle'][g]['model']['type'] || 'gola' === project_settings['handle']
      [g]['model']['type'],
      k = project_settings['handle'][g]['selected_model'],
      project_settings['handle'][g]))['preferable_size'],
    project_settings['handle']['no_handle'] = f;
  for (let q = room['active_objects']['length'] - 1; 0 <= q; q--) {
    if ('module' === room['active_objects'][q]['userData']['params']?.['type']) {
      let u = false;
      var m = room['active_objects'][q],
        p = m['userData']['params']['spec']['cabinet_group'];
      if (!p || 'all' != g && !g['includes'](p))
        continue;
      m['walk_params_tree'](v => {
          'facade' === v['type'] && (v['spec']['handle']['active'] = !f,
            u = true);
        }),
        u && m['_rebuild_parts_by_type']('facade');
    }
    'Cabinet' !== room['active_objects'][q]['type'] || false === project_settings['handle']['bottom_as_top'] && room[
      'active_objects'][q]['params']['cabinet_group'] !== g || room['active_objects'][q]['change_handles_model'](
      project_settings['handle'][room['active_objects'][q]['params']['cabinet_group']]['model']['id'], l, j);
  }
  get_total_price_test();
}

function hide_sizes() {
  for (var f = room['active_objects']['length'] - 1; 0 <= f; f--)
    'function' == typeof room['active_objects'][f]['hide_sizes'] ? room['active_objects'][f]['hide_sizes']() : (
      void 0 !== room['active_objects'][f]['sizes'] && (room['active_objects'][f]['sizes']['visible'] = false),
      void 0 !== room['active_objects'][f]['from_wall_sizes'] && (room['active_objects'][f]['from_wall_sizes'][
        'visible'
      ] = false),
      void 0 !== room['active_objects'][f]['temp_sizes'] && (room['active_objects'][f]['temp_sizes']['visible'] = !
        1),
      0 < room['active_objects'][f]?.['userData']?.['sizes_items']?.['length'] && room['active_objects'][f][
        'userData']['sizes_items']['forEach'](g => {
        g['visible'] = false;
      }),
      0 < room['active_objects'][f]?.['userData']?.['parts']?.['fill_section']['length'] && room['active_objects'][f][
        'userData'
      ]['parts']['fill_section']['forEach'](g => {
        0 < g['userData']?.['children']?.['length'] && g['userData']['children']['forEach'](h => {
          h instanceof CabinetSize && (h['visible'] = false);
        });
      }),
      0 < room['active_objects'][f]?.['userData']?.['parts']?.['size']['length'] && room['active_objects'][f][
        'userData'
      ]['parts']['size']['forEach'](g => {
        g['visible'] = false;
      }));
  false === global_options['common_sizes_visible'] && (room['common_sizes']['visible'] = false),
    room['sizes']['visible'] = false,
    global_options['sizes_visible'] = false;
}

function show_sizes() {
  for (var f = room['active_objects']['length'] - 1; 0 <= f; f--)
    'function' == typeof room['active_objects'][f]['show_sizes'] ? room['active_objects'][f]['show_sizes']() : (
      void 0 !== room['active_objects'][f]['sizes'] && (room['active_objects'][f]['sizes']['visible'] = true),
      void 0 !== room['active_objects'][f]['from_wall_sizes'] && (room['active_objects'][f]['from_wall_sizes'][
        'visible'
      ] = true),
      void 0 !== room['active_objects'][f]['temp_sizes'] && (room['active_objects'][f]['temp_sizes']['visible'] = !
        0),
      0 < room['active_objects'][f]?.['userData']?.['sizes_items']?.['length'] && room['active_objects'][f][
        'userData']['sizes_items']['forEach'](g => {
        g['visible'] = true;
      }),
      0 < room['active_objects'][f]?.['userData']?.['sizes_items']?.['length'] && room['active_objects'][f][
        'userData']['sizes_items']['forEach'](g => {
        g['visible'] = true;
      }),
      0 < room['active_objects'][f]?.['userData']?.['parts']?.['size']['length'] && room['active_objects'][f][
        'userData'
      ]['parts']['size']['forEach'](g => {
        g['visible'] = true;
      }),
      0 < room['active_objects'][f]?.['userData']?.['parts']?.['fill_section']['length'] && room['active_objects'][f][
        'userData'
      ]['parts']['fill_section']['forEach'](g => {
        0 < g['userData']?.['children']?.['length'] && !g['userData']?.['params']['spec']?.['show_sizes_hover'] &&
          g['userData']['children']['forEach'](h => {
            h instanceof CabinetSize && (h['visible'] = true);
          });
      }));
  true === global_options['common_sizes_visible'] && (room['common_sizes']['visible'] = true),
    room['sizes']['visible'] = true,
    global_options['sizes_visible'] = true;
}

function no_sizes_mode() {
  global_options['sizes_visible'] = false,
    global_options['common_sizes_visible'] = false,
    hide_sizes();
}

function basic_sizes_mode() {
  global_options['sizes_visible'] = true,
    global_options['common_sizes_visible'] = false,
    hide_common_sizes(),
    show_sizes();
}

function all_sizes_mode() {
  global_options['sizes_visible'] = true,
    global_options['common_sizes_visible'] = true,
    show_common_sizes(),
    show_sizes(),
    build_sizes_all();
}

function additional_sizes_mode(f) {
  global_options['additional_sizes_visible'] = !!f,
    global_options['additional_sizes_mode'] = f,
    pp['interface']['root'] && pp['interface']['root']['additional_sizes_mode_changed'](global_options[
      'additional_sizes_mode']);
  for (let h = d_objects.length; h--;) {
    var g = d_objects[h];
    g instanceof Module && g['_build_sizes']();
  }
}

function additional_sizes_only() {
  global_options['sizes_visible'] = false,
    global_options['common_sizes_visible'] = true,
    show_common_sizes(),
    hide_sizes(),
    build_sizes_all();
}

function transparent_edges(f) {
  edges_white_mat['transparent'] = f,
    global_options['edges_transparent'] = f,
    updateEdgesModeMaterials();
}

function show_butts(f) {
  global_options['show_butts'] = f,
    update_butts_transparent();
}

function get_furniture_types_count() {
  var f;
  return {
    'door': 0,
    'locker': 0,
    'simple_top': 0,
    'double_top': 0,
    'front_top': 0,
    'legs': 0
  };
}

function get_furniture_list() {
  let f = {};
  Object['keys'](accsessories_data['types'])['forEach'](function(i) {
    f[i] = {};
  });
  var g = [],
    h;
  for (let i = 0; i < room['active_objects']['length']; i++) {
    'Cabinet' === room['active_objects'][i]['type'] && (h = copy_object(room['active_objects'][i][
        'get_furniture_types_count'
      ]()),
      g.push(h));
  }
  for (let j = 0; j < g.length; j++) {
    let k = g[j];
    Object['keys'](k)['forEach'](function(l) {
      k[l]['id'] && (k[l]['id'] in f[l] ? f[l][k[l]['id']]['count'] += parseInt(k[l]['count']) : (k[l]['count'] =
        parseInt(k[l]['count']),
        f[l][k[l]['id']] = k[l],
        f[l][k[l]['id']]['count'] = parseInt(f[l][k[l]['id']]['count'])));
    });
  }
  return f;
}

function get_furniture_price() {
  let e = get_furniture_types_count(),
    f = 0;
  return Object['keys'](project_settings['selected_furniture'])['forEach'](function(g) {
      null !== project_settings['selected_furniture'][g] && (f += e[g] * parseFloat(accsessories_data['items'][
        project_settings['selected_furniture'][g]
      ]['price']));
    }),
    f;
}

function get_total_price_test() {
  return sc['get_price']();
}

function hide_common_sizes() {
  global_options['common_sizes_visible'] = false,
    room['common_sizes']['visible'] = false;
}

function show_common_sizes() {
  global_options['common_sizes_visible'] = true,
    room['common_sizes']['visible'] = true;
}

function change_tabletop_thickness(f) {
  if (parseInt(f) !== project_settings['tabletop_thickness']) {
    project_settings['tabletop_thickness'] = parseInt(f);
    for (var g = room['active_objects']['length'] - 1; 0 <= g; g--)
      'Cabinet' === room['active_objects'][g]['type'] && 'bottom' === room['active_objects'][g]['params'][
        'cabinet_group'
      ] && false !== room['active_objects'][g]['params']['tabletop']['active'] && (room['active_objects'][g]['params'][
          'tabletop'
        ]['height'] = parseInt(f),
        room['active_objects'][g]['build']());
  }
}

function change_cokol_active(f) {
  project_settings['is_cokol_active'] = f;
  for (var g = room['active_objects']['length'] - 1; 0 <= g; g--)
    'Cabinet' === room['active_objects'][g]['type'] && 'bottom' === room['active_objects'][g]['params'][
    'cabinet_group'] && 'function' == typeof room['active_objects'][g]['build_cokol'] && room['active_objects'][g][
      'build_cokol'
    ]();
  get_total_price_test(),
    global_update();
}

function change_cornice_active(f, g) {
  if (g || add_undo_action({
      'type': 'cornice_all',
      'from': !f,
      'to': f
    }),
    project_settings['cornice_active'] = f,
    constructor_settings['core_v2'])
    sc['change_global_var'](pp['const']['vars']['cornice_enabled'], to_int(f), true);
  else
    for (let i = room['active_objects']['length'] - 1; 0 <= i; i--) {
      var h, h;
      ('Cabinet' === room['active_objects'][i]['type'] && 'top' === room['active_objects'][i]['params'][
        'cabinet_group'] || 'Cabinet' === room['active_objects'][i]['type'] && 'bottom' === room['active_objects'][i][
          'params'
        ]['cabinet_group'] && false === room['active_objects'][i]['params']['tabletop']['active'] || 'Shelve' === room[
          'active_objects'][i]['type']) && 'function' == typeof room['active_objects'][i]['build_cornice'] && (
        'Cabinet' === (h = room['active_objects'][i])['type'] && (h['params']['cornice']['visible']['front'] =
          project_settings['cornice_active'],
          'corner_open' !== h['params']['cabinet']['type'] && 'end_corner_facade' !== h['params']['cabinet'][
          'type'] && 'corner_open_facade' !== h['params']['cabinet']['type'] || ('left' === h['params']['cabinet'][
            'orientation'
          ] ? h['params']['cornice']['visible']['left'] = project_settings['cornice_active'] : h['params'][
            'cornice']['visible']['right'] = project_settings['cornice_active'])),
        room['active_objects'][i]['build_cornice'](),
        constructor_settings['core_v2']) && (h = _['get'](room['active_objects'][i],
        'userData.parts.cornice_placer[0]')) && h['_rebuild']();
    }
  get_total_price_test();
}

function change_cokol_height(f) {
  if (parseInt(f) !== project_settings['cokol_height']) {
    project_settings['cokol_height'] = parseInt(f);
    for (var g = room['active_objects']['length'] - 1; 0 <= g; g--)
      'Cabinet' === room['active_objects'][g]['type'] && 'bottom' === room['active_objects'][g]['params'][
        'cabinet_group'
      ] && 1 != room['active_objects'][g]['params']['cokol']['fixed'] && (room['active_objects'][g]['params']['cokol']
        ['height'] = parseInt(f),
        room['active_objects'][g]['build']());
    (constructor_settings['tabletop_v2'] || constructor_settings['core_v2']) && sc['build_tabletop']();
  }
}

function get_hash(f) {
  return f['reduce'](function(g, h) {
    return g[h['id']] = h,
      g;
  }, {});
}

function build_room_models_tree() {
  for (var f, g = [], h, i = [], f = 0; f < room_models_catalog['items']['length']; f++) {
    var j = room_models_catalog['items'][f],
      h;
    null !== (h = objectFindByKey(room_models_catalog['categories'], 'id', j['category'])) && (void 0 !== h[
      'parent'] ? j['top_category'] = h['parent'] : j['top_category'] = h['id'],
      h['items'] || (h['items'] = []),
      h['items']['push'](j));
  }
  for (f = 0; f < room_models_catalog['categories']['length']; f++)
    void 0 === (h = room_models_catalog['categories'][f])['parent'] ? (g.push(h),
      h['categories'] = []) : i.push(h);
  for (f = 0; f < i.length; f++)
    (h = objectFindByKey(g, 'id', i[f]['parent']))['categories']['push'](i[f]);
  return g;
}

function change_kitchen_style(f, g, h) {
  var g, i;
  !g && project_settings['id'] === f || (false === h ? set_kitchen_style(f, false) : (g = objectFindByKey(kitchen_styles,
      'id', f),
    project_settings['modules_set_id'] || (project_settings['modules_set_id'] = 900),
    project_settings['modules_set_id'] == g['modules_set_id'] ? set_kitchen_style(f, true) : interface_version <
    2 ? ((i = new Modal_window({
        'heading': lang['project_reset_notice'],
        'body': '<p>' + lang['project_reset_notice'] + '</p>',
        'max_width': 400,
        'class': 'yesno'
      }))['show'](),
      i['yes_button']['click'](function() {
        i['close'](),
          set_kitchen_style(f, true);
      }),
      i['no_button']['click'](function() {
        i['close']();
      })) : pp['interface']['root'] && pp['interface']['root']['$emit']('yn_modal_show', {
      'heading': '',
      'body': lang['project_overwrite_notice'],
      'cb': 'kitchen_style'
    })));
}

function clear_project() {
  undo_list = [],
    redo_list = [],
    $('#redo_action')['addClass']('inactive'),
    $('#undo_action')['addClass']('inactive');
  for (let f = room['active_objects']['length'] - 1; 0 <= f; f--)
    'wall' !== room['active_objects'][f]['object_type'] && (room['active_objects'][f]['params']['catalog'] ? 'Comms' !==
      room['active_objects'][f]['params']['catalog'] && room['active_objects'][f]['delete']() : 'Shaft' !== room[
        'active_objects'][f]['type'] && room['active_objects'][f]['delete']());
  pp['interface']['root']['clear_cart'](),
    project_settings['project_id'] = new Date()['getTime']();
}
async function set_kitchen_style(f, g) {
  var h = 0,
    j, j, k = (interface_version && (h = interface_version),
      j = void 0 === project_settings['id'] ? JSON['parse'](JSON['stringify'](project_settings)) : objectFindByKey(
        kitchen_styles, 'id', project_settings['id']),
      copy_object(objectFindByKey(kitchen_styles, 'id', f))),
    l, l, m, p;
  j['modules_set_id'] || (j['modules_set_id'] = 900),
    k['modules_set_id'] || (k['modules_set_id'] = 901),
    j['modules_set_id'] != k['modules_set_id'] && clear_project(),
    k['bottom_as_top_facade_materials'] = false,
    k['cokol_as_corpus'] = j['cokol_as_corpus'],
    void 0 !== accsessories_data['types'] && (j['selected_furniture'] ? k['selected_furniture'] = j[
      'selected_furniture'] : k['selected_furniture'] = accsessories_data['default']),
    'center' === k['handle']['lockers_position'] && (k['handle']['lockers_position'] = 'middle'),
    k['shelves_thickness'] || (k['shelves_thickness'] = 16),
    mod_lib = {
      'tree': '',
      'items': '',
      'categories': '',
      'get_item': function(u) {
        return copy_object(this['items'][u]);
      },
      'get_category': function(u) {
        return copy_object(this['categories'][u]);
      }
    };
  let q;
  if (q = k['available_modules'] || await promise_request('data/module_sets/' + k['modules_set_id'] + '.json' +
      date_timestamp),
    convert_lib(mod_lib, q, true),
    custom_settings['mod_lib_no_height'] || (convert_height({
        'id': 0,
        'name': '',
        'active': 1,
        'categories': mod_lib['tree'],
        'items': []
      }),
      mod_lib['conv'] = true),
    pp['libs']['modules'] = mod_lib,
    project_settings['comments'] && project_settings['comments']['length'] && (k['comments'] = project_settings[
      'comments']),
    (project_settings = k)['selected_cornice_model'] || (project_settings['selected_cornice_model'] = 0),
    void 0 === project_settings['selected_materials']['cornice'] && (project_settings['selected_materials'][
      'cornice'
    ] = project_settings['selected_materials']['top']['facades']),
    void 0 === project_settings['cornice_change_with_facade'] && (project_settings['cornice_change_with_facade'] =
      1),
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
    } catch (u) {}
    project_settings['materials']['top']['corpus'] = JSON['parse'](project_settings['materials']['top']['corpus']),
      project_settings['materials']['bottom']['corpus'] = JSON['parse'](project_settings['materials']['bottom'][
        'corpus'
      ]);
  }
  project_settings['defaults'] || (project_settings['defaults'] = {
      'facades': {
        'top': project_settings['models']['top'],
        'bottom': project_settings['models']['bottom']
      }
    }),
    project_settings['accessories'] = cart['accessories'],
    project_settings['handle']['top'] || (project_settings['handle']['top'] = copy_object(project_settings[
    'handle'])),
    project_settings['handle']['bottom'] || (project_settings['handle']['bottom'] = copy_object(project_settings[
      'handle']['top'])),
    1 != project_settings['handle']['no_handle'] && 'gola' == project_settings['handle']['top']['model']['type'] &&
    (project_settings['handle']['top']['model']['is_gola'] = true,
      (l = objectFindByKey(handles_catalog['items'], 'id', project_settings['handle']['top']['model']['id']))[
        'is_gola'] = true,
      l['model_top_module'] = '/common_assets/models/handles/18/gola_top_module.fbx',
      l['model_top_module_ch'] = '/common_assets/models/handles/18/gola_top_module_ch.fbx',
      l['model_tabletop'] = '/common_assets/models/handles/18/gola_under_tabletop.fbx',
      l['model_tabletop_ch'] = '/common_assets/models/handles/18/gola_under_tabletop_ch.fbx',
      l['model_ch'] = '/common_assets/models/handles/18/gola_common_ch.fbx',
      l['sizes_top_module'] = {
        'width': 4,
        'height': 17,
        'depth': 27
      },
      l['sizes_tabletop'] = {
        'width': 17,
        'height': 57,
        'depth': 27
      },
      load_gola(l),
      project_settings['handle']['top']['model'] = l),
    1 != project_settings['handle']['no_handle'] && 'gola' == project_settings['handle']['bottom']['model'][
    'type'] && (project_settings['handle']['bottom']['model']['is_gola'] = true,
      (l = handles_lib['get_item'](project_settings['handle']['bottom']['model']['id']))['is_gola'] = true,
      l['model_top_module'] = '/common_assets/models/handles/18/gola_top_module.fbx',
      l['model_top_module_ch'] = '/common_assets/models/handles/18/gola_top_module_ch.fbx',
      l['model_tabletop'] = '/common_assets/models/handles/18/gola_under_tabletop.fbx',
      l['model_tabletop_ch'] = '/common_assets/models/handles/18/gola_under_tabletop_ch.fbx',
      l['model_ch'] = '/common_assets/models/handles/18/gola_common_ch.fbx',
      l['sizes_top_module'] = {
        'width': 4,
        'height': 17,
        'depth': 27
      },
      l['sizes_tabletop'] = {
        'width': 17,
        'height': 57,
        'depth': 27
      },
      load_gola(l),
      project_settings['handle']['bottom']['model'] = l),
    void 0 === project_settings['handle']['bottom_as_top'] && (project_settings['handle']['bottom_as_top'] = true),
    pat_material = create_material_by_id(project_settings['selected_materials']['pat']),
    project_settings['available_selection'] && (constructor_settings['components']['can_facade'] = 1 ==
      constructor_settings['multiple_facades_mode'],
      constructor_settings['components']['can_color'] = 1 == parseInt(project_settings['available_selection'][
        'allow_facades_materials_select'
      ]),
      0 == constructor_settings['multiple_facades_mode'] && 0 == parseInt(project_settings['available_selection'][
        'allow_facades_materials_select'
      ]) ? constructor_settings['components']['facades_picker'] = 0 : constructor_settings['components'][
        'facades_picker'
      ] = 1),
    project_settings['bottom_as_top_facade_models'] = !!project_settings['bottom_as_top_facade_models'],
    project_settings['bottom_as_top_facade_materials'] = !!project_settings['bottom_as_top_facade_materials'],
    project_settings['bottom_as_top_corpus_materials'] = !!project_settings['bottom_as_top_corpus_materials'],
    project_settings['cokol_as_corpus'] = !!project_settings['cokol_as_corpus'],
    project_settings['wall_panel']['active'] = !!project_settings['wall_panel']['active'],
    project_settings['materials']['glass'] && null == project_settings['materials']['glass'][0] &&
    delete project_settings['materials']['glass'],
    void 0 === project_settings['cornice_available'] && (project_settings['cornice_available'] =
      constructor_settings['cornice_available']),
    void 0 === project_settings['cornice_active'] && (project_settings['cornice_active'] = false),
    void 0 === project_settings['is_cokol_active'] && (project_settings['is_cokol_active'] = true),
    project_settings['available_corpus_thickness'] || (project_settings['available_corpus_thickness'] = ['16']),
    project_settings['default_corpus_thickness'] && (project_settings['corpus_thickness'] = project_settings[
      'default_corpus_thickness']),
    project_settings['wall_panel']['active'] = false,
    'function' == typeof kitchen_style_set_callback && kitchen_style_set_callback(f),
    project_settings['default'] || (project_settings['defaults'] = {
      'facades': {
        'top': project_settings['models']['top'],
        'bottom': project_settings['models']['bottom']
      }
    }),
    1 == constructor_settings['tabletop_v2'] && tabletop_lib && tabletop_lib['first_item'] && ('function' ==
      typeof set_default_tabletop ? set_default_tabletop() : 0 != project_settings['defaults']['tabletop'] &&
      void 0 !== project_settings['defaults']['tabletop'] || (project_settings['defaults']['tabletop'] =
        tabletop_lib['first_item']['id'])),
    j['modules_set_id'] == k['modules_set_id'] ? (global_options['no_autosave'] = true,
      project_settings['selected_materials']['facades'] || (project_settings['selected_materials']['facades'] = {},
        project_settings['selected_materials']['facades'][k['models']['top']] || (project_settings[
          'selected_materials']['facades'][k['models']['top']] = {
          'gen': {
            'top': k['selected_materials']['top']['facades'],
            'bottom': k['selected_materials']['bottom']['facades']
          }
        }),
        project_settings['selected_materials']['facades'][k['models']['bottom']]) || (project_settings[
        'selected_materials']['facades'][k['models']['top']] = {
        'gen': {
          'top': k['selected_materials']['top']['facades'],
          'bottom': k['selected_materials']['bottom']['facades']
        }
      }),
      sc['change_facade'](k['models']['top'], ['top']),
      sc['change_facade'](k['models']['bottom'], ['bottom']),
      global_options['no_autosave'] = false) : (m = get_all_facades(room['active_objects']),
      p = facades_lib['get_item'](project_settings['defaults']['facades']['top']),
      project_settings['selected_materials']['facades'] || (project_settings['selected_materials']['facades'] = {},
        project_settings['selected_materials']['facades'][k['models']['top']] || (project_settings[
          'selected_materials']['facades'][k['models']['top']] = {
          'gen': {
            'top': k['selected_materials']['top']['facades'],
            'bottom': k['selected_materials']['bottom']['facades']
          }
        }),
        project_settings['selected_materials']['facades'][k['models']['bottom']]) || (project_settings[
        'selected_materials']['facades'][k['models']['top']] = {
        'gen': {
          'top': k['selected_materials']['top']['facades'],
          'bottom': k['selected_materials']['bottom']['facades']
        }
      }),
      Object['keys'](project_settings['selected_materials']['facades'])['forEach'](function(v) {}),
      set_selected_facade(k['models']['top']),
      set_selected_facade(k['models']['bottom']),
      1 < interface_version && (check_interface_components(),
        pp['interface']['root']['$refs']['main_menu']['$forceUpdate']())),
    setTimeout(function() {
      get_total_price_test();
    }, 500);
}

function reset_group(f) {
  var g = f,
    h, i = [];
  if (g['traverse'](function(j) {
      g !== j && 'Group' !== j['type'] && i.push(j);
    }),
    i.length) {
    for (h = i.length - 1; - 1 < h; h--)
      i[h]['parent']['remove'](i[h]),
      i[h]['geometry'] && i[h]['geometry']['dispose'](),
      i[h]['material'] && !isArray(i[h]['material']) && i[h]['material']['map'] && i[h]['material']['map']['dispose'](),
      i['splice'](i['indexOf'](i[h]), 1);
  }
}

function con_d(f) {
  var g = {};
  for (let i = 0; i < f.length; i++) {
    var h = f[i];
    g[h['id'] + '_' + h['width'] + '_' + h['height'] + '_' + h['thickness']] ? g[h['id'] + '_' + h['width'] + '_' + h[
      'height'] + '_' + h['thickness']]['count']++ : (g[h['id'] + '_' + h['width'] + '_' + h['height'] + '_' + h[
        'thickness']] = copy_object(h),
      g[h['id'] + '_' + h['width'] + '_' + h['height'] + '_' + h['thickness']]['count'] = 1);
  }
  return g;
}

function con_f(e) {
  let f = {
    'common': {},
    'radius': {},
    'radius_inner': {},
    'double': {},
    'triple': {}
  };
  return Object['keys'](e)['forEach'](function(g) {
      let h = e[g];
      Object['keys'](h)['forEach'](function(j) {
        var k = h[j];
        for (let m = 0; m < k.length; m++) {
          var l = k[m];
          f[g][j] || (f[g][j] = {}),
            f[g][j][l['facade_set_id'] + '_' + l['id'] + '_' + l['width'] + '_' + l['height']] ? f[g][j][l[
              'facade_set_id'] + '_' + l['id'] + '_' + l['width'] + '_' + l['height']]['count']++ : (f[g][j][l[
                'facade_set_id'] + '_' + l['id'] + '_' + l['width'] + '_' + l['height']] = copy_object(l),
              f[g][j][l['facade_set_id'] + '_' + l['id'] + '_' + l['width'] + '_' + l['height']]['count'] = 1);
        }
      });
    }),
    f;
}

function get_total_specs() {
  return;
  if (1 === constructor_settings['show_specs']) {
    for (var f = {
        'corpus': 0,
        'shelves': 0,
        'cokol': 0,
        'cokol_pm': 0,
        'tabletop': 0,
        'tabletop_pm': 0,
        'facades_full': 0,
        'facades_window': 0,
        'facades_frame': 0,
        'wallpanel': 0,
        'wallpanel_pm': 0
      }, g = room['active_objects']['length'] - 1, h; 0 <= g; g--) {
      'function' == typeof room['active_objects'][g]['get_specs'] && (h = room['active_objects'][g]['get_specs'](),
        f['corpus'] += h['corpus'],
        f['shelves'] += h['shelves'],
        f['cokol'] += h['cokol'],
        f['cokol_pm'] += h['cokol_pm'],
        f['tabletop'] += h['tabletop'],
        f['tabletop_pm'] += h['tabletop_pm'],
        f['facades_full'] += h['facades_full'],
        f['facades_window'] += h['facades_window'],
        f['facades_frame'] += h['facades_frame'],
        f['wallpanel'] += h['wallpanel'],
        f['wallpanel_pm'] += h['wallpanel_pm']);
    }
    return f;
  }
}

function convert_specs(e) {
  let f = {};
  return Object['keys'](e)['forEach'](function(g) {
      if ('details_corpus' != g && 'details_shelves' != g) {
        if (f[g] = {},
          'facades' == g)
          f[g] = {
            'common': {},
            'radius': {},
            'radius_inner': {},
            'double': {},
            'triple': {}
          },
          Object['keys'](e[g])['forEach'](function(h) {
            let j = e[g][h];
            Object['keys'](j)['forEach'](function(k) {
              var l = j[k];
              for (let p = 0; p < l.length; p++) {
                var m = l[p];
                f[g][h][k] || (f[g][h][k] = {}),
                  f[g][h][k][m['facade_set_id'] + '_' + m['id']] ? (f[g][h][k][m['facade_set_id'] + '_' + m[
                      'id']]['m2'] += parseFloat(m['m2']['toFixed'](2)),
                    f[g][h][k][m['facade_set_id'] + '_' + m['id']]['per'] += parseInt(m['per'])) : f[g][h][k][m[
                    'facade_set_id'] + '_' + m['id']] = {
                    'name': m['name'],
                    'm2': parseFloat(m['m2']['toFixed'](2)),
                    'pm': m['pm'],
                    'per': m['per']
                  };
              }
            });
          });
        else {
          if ('handles' == g) {
            for (let h = 0; h < e[g]['length']; h++)
              f[g][e[g][h]['width']] ? f[g][e[g][h]['width']]['count'] += 1 : f[g][e[g][h]['width']] = {
                'count': 1,
                'id': e[g][h]['id'],
                'width': e[g][h]['width'],
                'type': e[g][h]['type']
              };
          } else {
            if ('tabletop_v2' == g) {
              for (let j = 0; j < e[g]['length']; j++)
                f[g][e[g][j]['id']] ? f[g][e[g][j]['id']]['pm'] += e[g][j]['pm'] : f[g][e[g][j]['id']] = copy_object(
                  e[g][j]);
            } else {
              if ('items' == g) {
                for (let k = 0; k < e[g]['length']; k++)
                  f[g][e[g][k]['key']] ? f[g][e[g][k]['key']]['count'] += e[g][k]['count'] : f[g][e[g][k]['key']] = {
                    'count': e[g][k]['count'],
                    'name': e[g][k]['name'],
                    'code': e[g][k]['code'],
                    'price': e[g][k]['price'],
                    'type': e[g][k]['type'],
                    'units': e[g][k]['units'],
                    'key': e[g][k]['key']
                  };
              } else {
                if ('shelves' == g) {
                  for (let l = 0; l < e[g]['length']; l++)
                    f[g][e[g][l]['thickness']] || (f[g][e[g][l]['thickness']] = {}),
                    f[g][e[g][l]['thickness']][e[g][l]['id']] ? (f[g][e[g][l]['thickness']][e[g][l]['id']]['m2'] +=
                      parseFloat(e[g][l]['m2']['toFixed'](2)),
                      f[g][e[g][l]['thickness']][e[g][l]['id']]['pm'] += e[g][l]['pm'],
                      f[g][e[g][l]['thickness']][e[g][l]['id']]['m2'] = parseFloat(f[g][e[g][l]['thickness']][e[g][l][
                        'id'
                      ]]['m2']['toFixed'](2))) : f[g][e[g][l]['thickness']][e[g][l]['id']] = {
                      'm2': parseFloat(e[g][l]['m2']['toFixed'](2)),
                      'pm': e[g][l]['pm']
                    };
                } else {
                  if ('corpus' == g) {
                    for (let m = 0; m < e[g]['length']; m++)
                      f[g][e[g][m]['thickness']] || (f[g][e[g][m]['thickness']] = {}),
                      f[g][e[g][m]['thickness']][e[g][m]['id']] ? (f[g][e[g][m]['thickness']][e[g][m]['id']]['m2'] +=
                        parseFloat(e[g][m]['m2']['toFixed'](2)),
                        f[g][e[g][m]['thickness']][e[g][m]['id']]['pm'] += e[g][m]['pm'],
                        f[g][e[g][m]['thickness']][e[g][m]['id']]['m2'] = parseFloat(f[g][e[g][m]['thickness']][e[g][
                          m]['id']]['m2']['toFixed'](2))) : f[g][e[g][m]['thickness']][e[g][m]['id']] = {
                        'm2': parseFloat(e[g][m]['m2']['toFixed'](2)),
                        'pm': e[g][m]['pm']
                      };
                  } else {
                    if ('cornice' == g) {
                      let o = e[g];
                      void Object['keys'](o)['forEach'](p => {
                        var q = o[p];
                        f[g][p] || (f[g][p] = {});
                        for (let s = 0; s < q.length; s++) {
                          var r = q[s];
                          'radius' == p ? f[g][p][r['id'] + '_' + r['orientation']] ? f[g][p][r['id'] + '_' + r[
                            'orientation']]['count'] += r['count'] : f[g][p][r['id'] + '_' + r[
                          'orientation']] = {
                            'id': r['id'],
                            'type': p,
                            'orientation': r['orientation'],
                            'count': r['count']
                          } : q[s]['count'] ? f[g][p][r['id']] ? f[g][p][r['id']]['count'] += r['count'] : f[g][
                            p
                          ][r['id']] = {
                            'id': r['id'],
                            'type': p,
                            'count': r['count']
                          } : f[g][p][r['id']] ? f[g][p][r['id']]['pm'] += r['pm'] : f[g][p][r['id']] = {
                            'id': r['id'],
                            'pm': r['pm']
                          };
                        }
                      });
                    } else {
                      if ('back_wall' == g) {
                        for (let p = 0; p < e[g]['length']; p++)
                          f[g][e[g][p]['key']] || (f[g][e[g][p]['key']] = {}),
                          f[g][e[g][p]['key']][e[g][p]['id']] ? (f[g][e[g][p]['key']][e[g][p]['id']]['m2'] +=
                            parseFloat(e[g][p]['m2']['toFixed'](2)),
                            f[g][e[g][p]['key']][e[g][p]['id']]['m2'] = parseFloat(f[g][e[g][p]['key']][e[g][p]['id']]
                              ['m2']['toFixed'](2))) : f[g][e[g][p]['key']][e[g][p]['id']] = {
                            'm2': parseFloat(e[g][p]['m2']['toFixed'](2)),
                            'thickness': e[g][p]['thickness'],
                            'key': e[g][p]['key']
                          };
                      } else {
                        if ('washes' === g) {
                          for (let q = 0; q < e[g]['length']; q++)
                            f[g][e[g][q]['id'] + '_' + e[g][q]['material']] ? f[g][e[g][q]['id'] + '_' + e[g][q][
                              'material'
                            ]]['count'] += e[g][q]['count'] : f[g][e[g][q]['id'] + '_' + e[g][q]['material']] = e[g][
                              q];
                        } else {
                          if ('facades_fixed' === g) {
                            for (let r = 0; r < e[g]['length']; r++)
                              f[g][e[g][r]['code'] + '_' + e[g][r]['width'] + '_' + e[g][r]['height'] + '_' + e[g][r][
                                'mat_code'
                              ]] ? f[g][e[g][r]['code'] + '_' + e[g][r]['width'] + '_' + e[g][r]['height'] + '_' + e[
                                g][r]['mat_code']]['count'] += 1 : (f[g][e[g][r]['code'] + '_' + e[g][r]['width'] +
                                  '_' + e[g][r]['height'] + '_' + e[g][r]['mat_code']
                                ] = copy_object(e[g][r]),
                                f[g][e[g][r]['code'] + '_' + e[g][r]['width'] + '_' + e[g][r]['height'] + '_' + e[g][
                                  r]['mat_code']]['count'] = 1);
                          } else {
                            if ('cokol' == g) {
                              for (let s = 0; s < e[g]['length']; s++)
                                f[g][e[g][s]['id']] ? (f[g][e[g][s]['id']]['m2'] += parseFloat(e[g][s]['m2'][
                                    'toFixed'](2)),
                                  f[g][e[g][s]['id']]['pm'] += e[g][s]['pm'],
                                  f[g][e[g][s]['id']]['m2'] = parseFloat(f[g][e[g][s]['id']]['m2']['toFixed'](2))) :
                                (f[g][e[g][s]['id']] = {
                                    'm2': parseFloat(e[g][s]['m2']['toFixed'](2)),
                                    'pm': e[g][s]['pm']
                                  },
                                  e[g][s]['thickness'] && (f[g][e[g][s]['id']]['thickness'] = e[g][s]['thickness']));
                            } else {
                              for (let u = 0; u < e[g]['length']; u++)
                                f[g][e[g][u]['id']] ? (f[g][e[g][u]['id']]['m2'] += parseFloat(e[g][u]['m2'][
                                    'toFixed'](2)),
                                  f[g][e[g][u]['id']]['pm'] += e[g][u]['pm'],
                                  f[g][e[g][u]['id']]['m2'] = parseFloat(f[g][e[g][u]['id']]['m2']['toFixed'](2))) :
                                (f[g][e[g][u]['id']] = {
                                    'm2': parseFloat(e[g][u]['m2']['toFixed'](2)),
                                    'pm': e[g][u]['pm']
                                  },
                                  e[g][u]['thickness'] && (f[g][e[g][u]['id']]['thickness'] = e[g][u]['thickness']));
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }),
    Object['keys'](f)['forEach'](function(g) {
      'cornice' != g && 'items' != g && 'facades_fixed' != g && 'tabletop_v2' != g && ('facades' == g ? Object['keys']
        (f[g])['forEach'](function(h) {
          let i = f[g][h];
          Object['keys'](i)['forEach'](function(j) {
            let k = i[j];
            Object['keys'](k)['forEach'](function(l) {
              k[l]['mat_data'] = get_material_data(l.split('_')[1]);
              var m = l.split('_'),
                p = {
                  'parent_category_name': '',
                  'category_name': '',
                  'name': '',
                  'type_name': '',
                  'is_fs': 0
                },
                m = facades_lib['items'][m[0]],
                m, q, q;
              m && (p['name'] += m['name'] + '\x20',
                m['types'][j] ? p['type_name'] += m['types'][j]['name'] : p['type_name'] += '',
                p['is_fs'] = m['is_fs'],
                (m = facades_lib['categories'][m['category']]) && (p['category_name'] += m['name'] +
                  '\x20'),
                m || (p['category_name'] = ''),
                m && m['parent'] && (q = '',
                  q = facades_lib['categories'][m['parent']]) && (p['parent_category_name'] += q[
                  'name'] + '\x20'),
                k[l]['set_data'] = p);
            });
          });
        }) : 'handles' == g ? Object['keys'](f[g])['forEach'](function(h) {}) : 'glass' == g ? Object['keys'](f[g])[
          'forEach'](function(h) {
          f[g][h]['mat_data'] = get_material_data(h, glass_materials_catalog);
        }) : 'shelves' == g ? Object['keys'](f[g])['forEach'](function(h) {
          Object['keys'](f[g][h])['forEach'](function(i) {
            f[g][h][i]['mat_data'] = get_material_data(i);
          });
        }) : 'corpus' == g ? Object['keys'](f[g])['forEach'](function(h) {
          Object['keys'](f[g][h])['forEach'](function(i) {
            f[g][h][i]['mat_data'] = get_material_data(i);
          });
        }) : 'back_wall' == g ? Object['keys'](f[g])['forEach'](function(h) {
          Object['keys'](f[g][h])['forEach'](function(i) {
            f[g][h][i]['mat_data'] = get_material_data(i);
          });
        }) : 'washes' != g && Object['keys'](f[g])['forEach'](function(h) {
          f[g][h]['mat_data'] = get_material_data(h);
        }));
    }),
    f;
}

function isArray(f) {
  return !!f && f.constructor === Array;
}

function objectFindByKey(f, g, h, i) {
  i = i || false;
  for (var j = 0; j < f.length; j++)
    if (f[j][g] == h)
      return false !== i ? j : f[j];
  return null;
}

function check_intersection(f, g) {
  for (var h = [], i = 0; i < room['active_objects']['length']; i++)
    room['active_objects'][i] !== g && 'wall' != room['active_objects'][i]['object_type'] && f['intersectsBox'](room[
      'active_objects'][i]['box']) && h.push(room['active_objects'][i]);
  return h;
}

function check_intersection_all(f, g) {
  for (var h = [], i = d_objects, j = 0; j < i.length; j++)
    false !== i[j]['visible'] && i[j] !== g && ('wall' !== i[j]['object_type'] && i[j]['box']['update'](),
      f['intersectsBox'](i[j]['box'])) && h.push(i[j]);
  return h;
}

function rot_angle(f, g) {
  var h = f['x'] * g['x'] + f['y'] * g['y'],
    i, j;
  return -Math['atan2'](f['x'] * g['y'] - f['y'] * g['x'], h);
}

function get_distance(f, g) {
  var g = g - f;
  return Math['sqrt'](g * g);
}

function create_light(f) {
  var f = {
      'color': void 0 !== (f = f || {})['color'] ? f['color'] : '#ecde6c',
      'intensity': void 0 !== f['intensity'] ? f['intensity'] : 0.5,
      'distance': void 0 !== f['distance'] ? f['distance'] : 36,
      'decay': void 0 !== f['decay'] ? f['decay'] : 1
    },
    f = new THREE['PointLight'](f['color'], f['intensity'], f['distance'], f['decay']);
  return f['castShadow'] = true,
    f;
}

function get_hypo(f, g) {
  return Math['sqrt'](f * f + g * g);
}
build_shape = {
  'square': function(f, g) {
    var h = new THREE['Shape']();
    return h['moveTo'](-f / 2, -g / 2),
      h['lineTo'](-f / 2, g / 2),
      h['lineTo'](f / 2, g / 2),
      h['lineTo'](f / 2, -g / 2),
      h['lineTo'](-f / 2, -g / 2),
      h;
  },
  'corner_angle': function(f, g, h, i) {
    h = h || 'right';
    var i = (i = i || 60) * Math['PI'] / 180,
      i = g / Math['sin'](i),
      i = Math['sqrt'](i * i - g * g),
      j = new THREE['Shape']();
    return 'left' === h ? (j['moveTo'](-f / 2, -g / 2),
        j['lineTo'](-f / 2 + i, g / 2),
        j['lineTo'](f / 2, g / 2)) : (j['moveTo'](-f / 2, -g / 2),
        j['lineTo'](-f / 2, g / 2),
        j['lineTo'](f / 2 - i, g / 2)),
      j['lineTo'](f / 2, -g / 2),
      j['lineTo'](-f / 2, -g / 2),
      j;
  },
  'corner_angle_double': function(f, g, h) {
    var h = (h = h || 60) * Math['PI'] / 180,
      h = g / Math['sin'](h),
      h = Math['sqrt'](h * h - g * g),
      i = new THREE['Shape']();
    return i['moveTo'](-f / 2, -g / 2),
      i['lineTo'](-f / 2 + h, g / 2),
      i['lineTo'](f / 2 - h, g / 2),
      i['lineTo'](f / 2, -g / 2),
      i['lineTo'](-f / 2, -g / 2),
      i;
  },
  'corner_angle_double_diff': function(f, g, h, i) {
    h = h || 60,
      i = i || h;
    var h = h * Math['PI'] / 180,
      i = i * Math['PI'] / 180,
      h = g / Math['sin'](h),
      i = g / Math['sin'](i),
      h = Math['sqrt'](h * h - g * g),
      i = Math['sqrt'](i * i - g * g),
      j = new THREE['Shape']();
    return j['moveTo'](-f / 2 - h, g / 2),
      j['lineTo'](-f / 2, -g / 2),
      j['lineTo'](f / 2, -g / 2),
      j['lineTo'](f / 2 + i, g / 2),
      j['lineTo'](-f / 2 - h, g / 2),
      j;
  },
  'rounded': function(f, g, h, j) {
    var k = new THREE['Shape'](),
      l = (j = j || g / 2,
        -f / 2),
      m = -g / 2;
    return 'left' === (h = h || 'right') ? (k['moveTo'](l, m + j),
        k['lineTo'](l, m + g - j),
        k['quadraticCurveTo'](l, m + g, l + j, m + g),
        k['lineTo'](l + f - j, m + g),
        k['lineTo'](l + f, m + g),
        k['lineTo'](l + f, m + j),
        k['lineTo'](l + f, m),
        k['lineTo'](l + j, m)) : (k['moveTo'](l, m + j),
        k['lineTo'](l, m + g - j),
        k['lineTo'](l, m + g),
        k['lineTo'](l + f - j, m + g),
        k['quadraticCurveTo'](l + f, m + g, l + f, m + g - j),
        k['lineTo'](l + f, m + j),
        k['quadraticCurveTo'](l + f, m, l + f - j, m),
        k['lineTo'](l, m)),
      k['quadraticCurveTo'](l, m, l, m + j),
      k;
  },
  'rounded_inner': function(f, g, h) {
    h = h || g / 2;
    var f = f / 2,
      g = g / 2,
      i = new THREE['Shape']();
    return i['moveTo'](-f, -g),
      i['quadraticCurveTo'](-f + h, 0, -f, g),
      i['lineTo'](f, g),
      i['lineTo'](f, -g),
      i['lineTo'](-f, -g),
      i;
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
  'half_rounded_double': function(f, g, h) {
    var j = new THREE['Shape'](),
      k = (h = h || g,
        -f / 2),
      l = -g / 2;
    return j['moveTo'](k, l),
      j['lineTo'](k, l + g - h),
      j['quadraticCurveTo'](k, l + g, k + h, l + g),
      j['lineTo'](k + f - h, l + g),
      j['quadraticCurveTo'](k + f, l + g, k + f, l + g - h),
      j['lineTo'](k + f, l),
      j['lineTo'](k, l),
      j;
  },
  'rounded_tabletop': function(f, g, h) {
    var j = new THREE['Shape'](),
      k = (h = h || f / 2,
        -f / 2),
      l = -g / 2;
    return j['moveTo'](k, l),
      j['lineTo'](k, l + g - h),
      j['quadraticCurveTo'](k, l + g, k + f / 2, l + g),
      j['quadraticCurveTo'](k + f, l + g, k + f, l + g - h),
      j['lineTo'](k + f, l),
      j['lineTo'](k, l),
      j;
  },
  'rounded_cokol': function(f, g, h) {
    var i = new THREE['Shape']();
    return i['absarc'](0, 0, f, Math['PI'] / 2, Math['PI']),
      i['absarc'](0, 0, f - h, Math['PI'], Math['PI'] / 2, true),
      i;
  },
  'rounded_facade': function(f, g, h, j, k) {
    var l = new THREE['Shape'](),
      k = (k = k || f,
        -f / 2),
      m = -g / 2;
    return 'left' === (j = j || 'right') ? (l['moveTo'](k, m + g),
        l['lineTo'](k, m + g + h),
        l['lineTo'](k - h, m + g + h),
        l['lineTo'](k - h, m + g - h),
        l['quadraticCurveTo'](k, m - h, k + f, m - h),
        l['lineTo'](k + f + h, m - h),
        l['lineTo'](k + f + h, m),
        l['lineTo'](k + f, m),
        l['quadraticCurveTo'](k, m, k, m + g + h),
        l['lineTo'](k, m + g)) : (l['moveTo'](k + f, m + g),
        l['lineTo'](k + f, m + g + h),
        l['lineTo'](k + f + h, m + g + h),
        l['lineTo'](k + f + h, m + g - h),
        l['quadraticCurveTo'](k + f + h, m - h, k, m - h),
        l['lineTo'](k - h, m - h),
        l['lineTo'](k - h, m),
        l['lineTo'](k, m),
        l['quadraticCurveTo'](k + f, m, k + f, m + g - h),
        l['lineTo'](k + f, m + g)),
      l;
  },
  'corner_90': function(f, g, h, i) {
    var j = new THREE['Shape']();
    return j['moveTo'](-f / 2, -g / 2),
      j['lineTo'](-f / 2, -g / 2 + h),
      j['lineTo'](-f / 2 + (f - i), -g / 2 + h),
      j['lineTo'](-f / 2 + (f - i), g / 2),
      j['lineTo'](f / 2, g / 2),
      j['lineTo'](f / 2, -g / 2),
      j['lineTo'](-f / 2, -g / 2),
      j;
  },
  'tabletop': function(f, g, h) {
    var j = new THREE['Shape'](),
      k, l, m, p;
    return (h = h || {})['c1'] || (h['c1'] = {
        'type': 'straight',
        'val': 0
      }),
      h['c2'] || (h['c2'] = {
        'type': 'straight',
        'val': 0
      }),
      h['c3'] || (h['c3'] = {
        'type': 'straight',
        'val': 0
      }),
      h['c4'] || (h['c4'] = {
        'type': 'straight',
        'val': 0
      }),
      Object['keys'](h)['forEach'](function(q) {
        'corner' != h[q]['type'] || h[q]['val2'] || (h[q]['val2'] = h[q]['val']);
      }),
      k = h['c1'],
      l = h['c2'],
      m = h['c3'],
      p = h['c4'],
      j['moveTo'](-f / 2 + k['val'], -g / 2),
      'straight' == k['type'] && j['lineTo'](-f / 2, -g / 2),
      'radius' == k['type'] && j['quadraticCurveTo'](-f / 2, -g / 2, -f / 2, -g / 2 + k['val']),
      'corner' == k['type'] && j['lineTo'](-f / 2, -g / 2 + k['val2']),
      'straight' == l['type'] && j['lineTo'](-f / 2, g / 2),
      'radius' == l['type'] && (j['lineTo'](-f / 2, g / 2 - l['val']),
        j['quadraticCurveTo'](-f / 2, g / 2, -f / 2 + l['val'], g / 2)),
      'corner' == l['type'] && (j['lineTo'](-f / 2, g / 2 - l['val']),
        j['lineTo'](-f / 2 + l['val2'], g / 2)),
      'straight' == m['type'] && j['lineTo'](f / 2, g / 2),
      'radius' == m['type'] && (j['lineTo'](f / 2 - m['val'], g / 2),
        j['quadraticCurveTo'](f / 2, g / 2, f / 2, g / 2 - m['val'])),
      'corner' == m['type'] && (j['lineTo'](f / 2 - m['val'], g / 2),
        j['lineTo'](f / 2, g / 2 - m['val2'])),
      'straight' == p['type'] && j['lineTo'](f / 2, -g / 2),
      'radius' == p['type'] && (j['lineTo'](f / 2, -g / 2 + p['val']),
        j['quadraticCurveTo'](f / 2, -g / 2, f / 2 - p['val'], -g / 2)),
      'corner' == p['type'] && (j['lineTo'](f / 2, -g / 2 + p['val']),
        j['lineTo'](f / 2 - p['val2'], -g / 2)),
      j['lineTo'](-f / 2 + k['val'], -g / 2),
      j;
  }
};
var ed_material = new THREE['LineBasicMaterial']({
  'color': 0
});

function build_edges(f) {
  return new THREE['LineSegments'](new THREE['EdgesGeometry'](f, 10), ed_material);
}

function getEdgesModeMaterial(f) {
  var g = global_materials['edges_mode_materials'],
    h, h, h;
  return g['hasOwnProperty'](f) ? g[f] : (h = global_options['edges_mode'],
    f === ObjectType['Default'] || h['hasOwnProperty'](f) ? (h = h[f] || h[ObjectType['Default']] || {
        'color': 16777215,
        'opacity': global_options['edges_mode_default_opacity']
      },
      h = new THREE['MeshBasicMaterial']({
        'color': h['color'],
        'side': THREE['DoubleSide'],
        'transparent': true === global_options['edges_transparent'],
        'opacity': void 0 !== h['opacity'] ? h['opacity'] : global_options['edges_mode_default_opacity']
      }),
      g[f] = h) : getEdgesModeMaterial(ObjectType['Default']));
}

function updateEdgesModeMaterials() {
  var f = global_materials['edges_mode_materials'],
    g = global_options['edges_transparent'],
    h;
  for (h in f)
    f[h]['transparent'] = g;
}

function update_butts_transparent() {
  let f = global_options['show_butts'];
  for (let h = d_objects.length; h--;) {
    var g = d_objects[h];
    g instanceof Module && 0 < g['userData']['parts']['wall']['length'] && g['userData']['parts']['wall']['forEach'](
      i => {
        0 < i['userData']?.['butt_objects']?.['length'] && i['userData']['butt_objects']['forEach'](j => {
          f && j['_show_helpers'](),
            f || j['_hide_helpers']();
        });
      }
    );
  }
}

function getUrlParameter(f) {
  for (var g, h = decodeURIComponent(window['location']['search']['substring'](1))['split']('&'), i, j, j = 0; j <
    h.length; j++)
    if ((i = h[j]['split']('='))[0] === f)
      return void 0 === i[1] || i[1];
}

function reset_model(f) {
  var g = f,
    h, i = [];
  if (g['traverse'](function(j) {
      g !== j && 'Group' !== j['type'] && i.push(j);
    }),
    i.length) {
    for (h = i.length - 1; - 1 < h; h--)
      i[h]['parent']['remove'](i[h]),
      i[h]['geometry'] && i[h]['geometry']['dispose'](),
      i[h]['material'] && !isArray(i[h]['material']) && i[h]['material']['map'] && i[h]['material']['map']['dispose'](),
      i['splice'](i['indexOf'](i[h]), 1);
  }
}

function update_materials_panel(f) {
  return false;
  update_materials_panel_new(f);
}

function update_materials_panel_new(f) {
  if (!global_options['no_recalc']) {
    $('.mat_panel_specs')['remove']();
    let g = $('<div\x20class=\x22mat_panel_specs\x20theme_main_text_color\x20theme_main_border_color\x22></div>'),
      h = f || sc['get_specs'](true);
    return false;
    if (!project_settings['is_facades_system']) {
      g['append']('<h4\x20class=\x22mpfh\x22\x20>' + lang['facades'] + '</h4>');
      let i = 0;
      Object['keys'](h['facades'])['forEach'](function(j) {
          let k = h['facades'][j];
          Object['keys'](k)['forEach'](function(m) {
            let o = k[m];
            Object['keys'](o)['forEach'](function(p) {
              i = 1;
              var q = p.split('_'),
                u = {
                  'parent_category_name': '',
                  'category_name': '',
                  'name': '',
                  'type_name': ''
                };
              let v = find_obj_by_id(facades_sets, q[0]);
              (v = v || facades_sets[facades_sets.length - 1]) && (u['name'] += v['name'] + '\x20',
                v['types'][m] ? u['type_name'] += v['types'][m]['name'] : u['type_name'] += '');
              var q = find_obj_by_id(facades_categories, v['category']),
                w, w, q = (q && (u['category_name'] += q['name'] + '\x20'),
                  q && q['parent'] && (w = '',
                    w = find_obj_by_id(facades_categories, q['parent'])) && (u['parent_category_name'] += w[
                    'name'] + '\x20'),
                  u['parent_category_name'] + u['category_name'] + u['name'] + u['type_name']);
              let x = '';
              var w = {
                  'parent_category_name': '',
                  'category_name': '',
                  'name': '',
                  'code': '',
                  'm2': '',
                  'pm': ''
                },
                u = (o[p]['mat_data'] && (o[p]['mat_data']['parent_category_name'] && (w[
                      'parent_category_name'] = o[p]['mat_data']['parent_category_name'] += '\x20'),
                    o[p]['mat_data']['category_name'] && (w['category_name'] = o[p]['mat_data'][
                      'category_name'
                    ] += '\x20'),
                    o[p]['mat_data']['name'] && (w['name'] = o[p]['mat_data']['name'] += '\x20'),
                    o[p]['mat_data']['code'] && (w['code'] = o[p]['mat_data']['code'] += '\x20'),
                    o[p]['m2'] && (w['m2'] = o[p]['m2']),
                    o[p]['pm'] && (w['pm'] = o[p]['pm']),
                    o[p]['mat_data']['color'] && (x =
                      '<span\x20class=\x22mat_panel_icon\x22\x20style=\x22background-color:\x20' + o[p][
                        'mat_data'
                      ]['color'] + '\x22\x20></span>'),
                    o[p]['mat_data']['map']) && (x =
                    '<span\x20class=\x22mat_panel_icon\x22\x20style=\x22background-image:\x20url(' + o[p][
                      'mat_data'
                    ]['map'] + ')\x22\x20></span>'),
                  w['parent_category_name'] + w['category_name'] + w['name'] + w['code']),
                p, q;
              interface_version < 2 ? (g['append']('<p>' + q + '</p>'),
                g['append']('<p>' + x + '</p>'),
                g['append']('<p>' + u + '</p>'),
                1 === constructor_settings['show_specs'] && (w['m2'] && '' != w['m2'] && 0 != w['m2'] &&
                  g['append']('<p>' + lang['units_square'] + ':\x20' + w['m2'] + '</p>'),
                  w['pm']) && '' != w['pm'] && 0 != w['pm'] && g['append']('<p>' + lang['units_pogon'] +
                  ':\x20' + w['pm'] + '</p>'),
                g['append']('<div\x20class=\x22material_panel_divider\x22></div>')) : ((p = $(
                  '<div\x20class=\x22flex_row\x22></div>'))['append']('<div\x20class=\x22w25\x22>' + x +
                  '</div>'),
                (q = $('<div\x20class=\x22w75\x22></div>'))['append']('<p>' + u + '</p>'),
                1 === constructor_settings['show_specs'] && (w['m2'] && '' != w['m2'] && 0 != w['m2'] &&
                  q['append']('<p>' + lang['units_square'] + ':\x20' + w['m2'] + '</p>'),
                  w['pm']) && '' != w['pm'] && 0 != w['pm'] && q['append']('<p>' + lang['units_pogon'] +
                  ':\x20' + w['pm'] + '</p>'),
                p['append'](q),
                g['append'](p));
            });
          });
        }),
        0 == i && g['find']('mpfh')['remove']();
      var f = Object['keys'](h['facades_edge']);
      f.length && (g['append']('<h4>' + lang['facades_edge'] + '</h4>'),
        f.forEach(function(j) {
          g['append'](build_material_panel_div(h['facades_edge'][j]));
        }));
    }
    return Object['keys'](h['glass'])['length'] && (g['append']('<h4>' + lang['glass_materials'] + '</h4>'),
        Object['keys'](h['glass'])['forEach'](function(j) {
          g['append'](build_material_panel_div(h['glass'][j]));
        })),
      Object['keys'](h['corpus'])['length'] && (g['append']('<h4>' + lang['corpus_materials'] + '</h4>'),
        Object['keys'](h['corpus'])['forEach'](function(j) {
          Object['keys'](h['corpus'][j])['forEach'](function(k) {
            g['append'](build_material_panel_div(h['corpus'][j][k], j));
          });
        })),
      Object['keys'](h['shelves'])['length'] && (g['append']('<h4>' + lang['shelves_materials'] + '</h4>'),
        Object['keys'](h['shelves'])['forEach'](function(j) {
          Object['keys'](h['shelves'][j])['forEach'](function(k) {
            g['append'](build_material_panel_div(h['shelves'][j][k], j));
          });
        })),
      Object['keys'](h['cokol'])['length'] && (g['append']('<h4>' + lang['cokol_materials'] + '</h4>'),
        Object['keys'](h['cokol'])['forEach'](function(j) {
          g['append'](build_material_panel_div(h['cokol'][j]));
        })),
      Object['keys'](h['tabletop'])['length'] && (g['append']('<h4>' + lang['tabletop_materials'] + '</h4>'),
        Object['keys'](h['tabletop'])['forEach'](function(j) {
          g['append'](build_material_panel_div(h['tabletop'][j]));
        })),
      Object['keys'](h['tabletop_plints'])['length'] && (g['append']('<h4>' + lang['tabletop_plints'] + '</h4>'),
        Object['keys'](h['tabletop_plints'])['forEach'](function(j) {
          g['append'](build_material_panel_div(h['tabletop_plints'][j]));
        })),
      Object['keys'](h['wallpanel'])['length'] && (g['append']('<h4>' + lang['wallpanel_materials'] + '</h4>'),
        Object['keys'](h['wallpanel'])['forEach'](function(j) {
          g['append'](build_material_panel_div(h['wallpanel'][j]));
        })),
      $('.materials_panel_body')['prepend'](g),
      false;
  }
}

function build_material_panel_div(f, g) {
  let h = '';
  var i = {
      'thickness': '',
      'parent_category_name': '',
      'category_name': '',
      'name': '',
      'code': '',
      'pm': '',
      'm2': ''
    },
    g = (g && (i['thickness'] = ',\x20' + g + lang['mm'] + '\x20'),
      f['mat_data'] && (f['mat_data']['parent_category_name'] && (i['parent_category_name'] = f['mat_data'][
          'parent_category_name'
        ] += '\x20'),
        f['mat_data']['category_name'] && (i['category_name'] = f['mat_data']['category_name'] += '\x20'),
        f['mat_data']['name'] && (i['name'] = f['mat_data']['name'] += '\x20'),
        f['mat_data']['code'] && (i['code'] = f['mat_data']['code'] += '\x20'),
        f['pm'] && (i['pm'] = f['pm']),
        f['m2'] && (i['m2'] = f['m2']),
        f['mat_data']['color'] && (h = '<span\x20class=\x22mat_panel_icon\x22\x20style=\x22background-color:\x20' + f[
          'mat_data']['color'] + '\x22\x20></span>'),
        f['mat_data']['map']) && (h = '<span\x20class=\x22mat_panel_icon\x22\x20style=\x22background-image:\x20url(' +
        f['mat_data']['map'] + ')\x22\x20></span>'),
      i['parent_category_name'] + i['category_name'] + i['name'] + i['code'] + i['thickness']);
  let j = '';
  return interface_version < 2 ? (j = j + ('<p>' + h) + '</p><p>' + g + '</p>',
      1 === constructor_settings['show_specs'] && (i['m2'] && '' != i['m2'] && 0 != i['m2'] && (j += '<p>' + lang[
          'units_square'] + ':\x20' + i['m2'] + '</p>'),
        i['pm']) && '' != i['pm'] && 0 != i['pm'] && (j += '<p>' + lang['units_pogon'] + ':\x20' + i['pm'] + '</p>'),
      j += '<div\x20class=\x22material_panel_divider\x22></div>') : (j = (j = (j += '<div\x20class=\x22flex_row\x22>') +
        '<div\x20class=\x22w25\x22>' + h + '</div>') + '<div\x20class=\x22w75\x22><p>' + g + '</p>',
      1 === constructor_settings['show_specs'] && (i['m2'] && '' != i['m2'] && 0 != i['m2'] && (j += '<p>' + lang[
          'units_square'] + ':\x20' + i['m2'] + '</p>'),
        i['pm']) && '' != i['pm'] && 0 != i['pm'] && (j += '<p>' + lang['units_pogon'] + ':\x20' + i['pm'] + '</p>'),
      j += '</div></div>'),
    j;
}

function copy_object(f) {
  try {
    return JSON['parse'](JSON['stringify'](f));
  } catch (g) {
    return {};
  }
}

function save(f, g) {
  var h = document['createElement']('a');
  h['style']['display'] = 'none',
    document['body']['appendChild'](h),
    h['href'] = URL['createObjectURL'](f),
    h['download'] = g,
    h['click'](),
    h['remove']();
}

function saveString(f, g) {
  save(new Blob([f], {
    'type': 'text/plain'
  }), g);
}

function saveArrayBuffer(f, g) {
  save(new Blob([f], {
    'type': 'application/octet-stream'
  }), g);
}

function export_to_obj() {
  var f = new Date(),
    f = f['getDate']() + '.' + (f['getMonth']() + 1) + '.' + f['getFullYear']() + '_' + f['getHours']() + ':' + f[
      'getMinutes']();
  download(obj_exporter['parse'](room), 'PlanPlace_project_' + f + '.obj');
}

function exportGLTF(f) {
  var g = new Date(),
    h = g['getDate']() + '.' + (g['getMonth']() + 1) + '.' + g['getFullYear']() + '_' + g['getHours']() + ':' + g[
      'getMinutes'](),
    g = new THREE['GLTFExporter'](),
    i = {
      'onlyVisible': true,
      'embedImages': false,
      'binary': false
    };
  150 < THREE['REVISION'] ? g['parse'](scene, function(j) {
    var k;
    j instanceof ArrayBuffer ? saveArrayBuffer(j, 'PlanPlace_project_' + h + '.glb') : saveString(JSON['stringify'](
      j, null, 2), 'PlanPlace_project_' + h + '.gltf');
  }, null, i) : g['parse'](scene, function(j) {
    var k;
    j instanceof ArrayBuffer ? saveArrayBuffer(j, 'PlanPlace_project_' + h + '.glb') : saveString(JSON['stringify'](
      j, null, 2), 'PlanPlace_project_' + h + '.gltf');
  }, i);
}

function exportGLB(f) {
  var g = new THREE['GLTFExporter'](),
    h = {
      'onlyVisible': true,
      'embedImages': true,
      'binary': true
    },
    i = new Date(),
    j = i['getDate']() + '.' + (i['getMonth']() + 1) + '.' + i['getFullYear']() + '_' + i['getHours']() + ':' + i[
      'getMinutes']();
  150 < THREE['REVISION'] ? g['parse'](scene, k => {
    saveArrayBuffer(k, 'PlanPlace_project_' + j + '.glb');
  }, k => {}, h) : g['parse'](scene, k => {
    saveArrayBuffer(k, 'PlanPlace_project_' + j + '.glb');
  }, h);
}

function exportDAE(f) {
  var g, h = new THREE['ColladaExporter']()['parse'](scene, null, {}),
    j = new Date(),
    k = j['getDate']() + '.' + (j['getMonth']() + 1) + '.' + j['getFullYear']() + '_' + j['getHours']() + ':' + j[
      'getMinutes']();
  let l = new JSZip();
  l['file']('project.dae', h['data']),
    h['textures']['forEach'](m => {
      l['file'](m['name'] + '.' + m['ext'], m['data']);
    }),
    l['generateAsync']({
      'type': 'blob'
    })['then'](function(m) {
      save(m, 'PlanPlace_project_' + k + '.zip');
    });
}

function download(f, g, h) {
  var f = new Blob([f], {
      'type': h
    }),
    i = document['createElement']('a'),
    j = URL['createObjectURL'](f);
  i['href'] = j,
    i['download'] = g,
    document['body']['appendChild'](i),
    i['click'](),
    setTimeout(function() {
      document['body']['removeChild'](i),
        window['URL']['revokeObjectURL'](j);
    }, 0);
}
async function autosave() {
  if (!view_mode && !global_options['no_autosave'])
    try {
      pp['storage']['saveZipFile']('autosave', await save_scene_new(false, false, true));
    } catch (f) {}
}

function get_account_name() {
  var f, f, g = (f = (f = window['location']['pathname'])['replace']('index_new.php', ''))['split']('/');
  return '' === g[g.length - 1] ? g[g.length - 2] : g[g.length - 1];
}

function build_sizes_all(q) {
  if (global_options['common_sizes_visible']) {
    var A = 0.00001,
      G = ('top' === global_options['projection_mode'] && (q = true),
        room['common_sizes']);
    for (let ar = G['children']['length'] - 1; 0 <= ar; ar--)
      G['children'][ar]['full_dispose']();
    var J = Math['round'](room['left_wall']['position']['x']),
      K = Math['round'](room['right_wall']['position']['x']),
      L = Math['round'](room['floor']['position']['y']),
      N = Math['round'](room['ceiling']['position']['y']),
      Q = Math['round'](room['front_wall']['position']['z']),
      U = Math['round'](room['back_wall']['position']['z']);
    let aj = [J, K],
      ak = [J, K],
      al = [Q, U],
      am = [Q, U],
      an = [L, N],
      ao = [L, N],
      ap = [L, N],
      aq = [L, N];
    var W = common_box['setFromObject'](room['front_wall'])['clone']()['expandByScalar'](1),
      Z = common_box['setFromObject'](room['back_wall'])['clone']()['expandByScalar'](1),
      a0 = common_box['setFromObject'](room['left_wall'])['clone']()['expandByScalar'](1),
      a1 = common_box['setFromObject'](room['right_wall'])['clone']()['expandByScalar'](1),
      a2;
    for (let as = 0; as < room['active_objects']['length']; as++) {
      'wall' !== room['active_objects'][as]['object_type'] && false !== room['active_objects'][as]['visible'] && ((a2 =
          room['active_objects'][as])['box']['update'](),
        a2['box']['intersectsBox'](W) && Math['abs'](a2['rotation']['y']) < A && (aj.push(a2['box']['min']['x']),
          aj.push(a2['box']['max']['x']),
          an.push(a2['box']['min']['y']),
          an.push(a2['box']['max']['y'])),
        a2['box']['intersectsBox'](Z) && Math['abs'](a2['rotation']['y']) < A && (ak.push(a2['box']['min']['x']),
          ak.push(a2['box']['max']['x']),
          ao.push(a2['box']['min']['y']),
          ao.push(a2['box']['max']['y'])),
        a2['box']['intersectsBox'](a0) && Math['abs'](a2['rotation']['y'] - Math['PI'] / 2) < A && (al.push(a2[
            'box']['min']['z']),
          al.push(a2['box']['max']['z']),
          ap.push(a2['box']['min']['y']),
          ap.push(a2['box']['max']['y'])),
        a2['box']['intersectsBox'](a1)) && Math['abs'](a2['rotation']['y'] - -Math['PI'] / 2) < A && (am.push(a2[
          'box']['min']['z']),
        am.push(a2['box']['max']['z']),
        aq.push(a2['box']['min']['y']),
        aq.push(a2['box']['max']['y']));
    }
    if (aj = _['sortBy'](_['uniq'](aj)),
      an = _['sortBy'](_['uniq'](an)),
      ak = _['sortBy'](_['uniq'](ak)),
      ao = _['sortBy'](_['uniq'](ao)),
      al = _['sortBy'](_['uniq'](al)),
      ap = _['sortBy'](_['uniq'](ap)),
      am = _['sortBy'](_['uniq'](am)),
      aq = _['sortBy'](_['uniq'](aq)),
      2 < aj.length)
      for (let at = 0; at < aj.length && void 0 !== aj[at + 1]; at++) {
        var a3 = get_distance(aj[at], aj[at + 1]),
          a4, a4;
        0 != Math['round'](a3) && (true !== q ? ((a4 = new Sizes_obj({
            'width': a3,
            'text': Math['round'](a3 * units),
            'length': room['params']['height'] / units + 35,
            'middle_line_position': room['params']['height'] / units + 35 - 2,
            'line_thickness': 0.1
          }))['position']['x'] = aj[at] + a3 / 2,
          a4['position']['z'] = 0.1,
          a4['position']['y'] = 0,
          G['add'](a4)) : ((a4 = new Sizes_obj({
            'width': a3,
            'text': Math['round'](a3 * units),
            'line_thickness': 0.1
          }))['position']['x'] = aj[at] + a3 / 2,
          a4['position']['z'] = 0.1,
          a4['position']['y'] = 0,
          a4['rotation']['x'] = -Math['PI'] / 2,
          G['add'](a4)));
      }
    if (true !== q && 2 < an.length)
      for (let au = 0; au < an.length && void 0 !== an[au + 1]; au++) {
        var a5 = get_distance(an[au], an[au + 1]),
          a6;
        0 != Math['round'](a5) && ((a6 = new Sizes_obj({
            'width': a5,
            'text': Math['round'](a5 * units),
            'length': room['params']['width'] / units + 35,
            'middle_line_position': room['params']['width'] / units + 35 - 2,
            'line_thickness': 0.1
          }))['rotation']['z'] = Math['PI'] / 2,
          a6['position']['x'] = room['params']['width'] / units,
          a6['position']['z'] = 0.1,
          a6['position']['y'] = an[au] + a5 / 2,
          G['add'](a6));
      }
    if (2 < ak.length)
      for (let av = 0; av < ak.length && void 0 !== ak[av + 1]; av++) {
        var a7 = get_distance(ak[av], ak[av + 1]),
          a8, a8;
        0 != Math['round'](a7) && (true !== q ? ((a8 = new Sizes_obj({
            'width': a7,
            'text': Math['round'](a7 * units),
            'length': room['params']['height'] / units + 35,
            'middle_line_position': room['params']['height'] / units + 35 - 2,
            'line_thickness': 0.1
          }))['position']['x'] = ak[av] + a7 / 2,
          a8['position']['z'] = room['params']['depth'] / units - 0.1,
          a8['position']['y'] = 0,
          a8['rotation']['y'] = Math['PI'],
          G['add'](a8)) : ((a8 = new Sizes_obj({
            'width': a7,
            'text': Math['round'](a7 * units),
            'line_thickness': 0.1
          }))['position']['x'] = ak[av] + a7 / 2,
          a8['position']['z'] = room['params']['depth'] / units - 0.1,
          a8['position']['y'] = 0,
          a8['rotation']['y'] = Math['PI'],
          a8['rotation']['x'] = Math['PI'] / 2,
          G['add'](a8)));
      }
    if (true !== q && 2 < ao.length)
      for (let aw = 0; aw < ao.length && void 0 !== ao[aw + 1]; aw++) {
        var a9 = get_distance(ao[aw], ao[aw + 1]),
          aa;
        0 != Math['round'](a9) && ((aa = new Sizes_obj({
            'width': a9,
            'text': Math['round'](a9 * units),
            'length': room['params']['width'] / units + 35,
            'middle_line_position': room['params']['width'] / units + 35 - 2,
            'line_thickness': 0.1
          }))['rotation']['z'] = Math['PI'] / 2,
          aa['rotation']['y'] = -Math['PI'],
          aa['position']['x'] = 0,
          aa['position']['z'] = room['params']['depth'] / units - 0.1,
          aa['position']['y'] = ao[aw] + a9 / 2,
          G['add'](aa));
      }
    if (2 < al.length)
      for (let ax = 0; ax < al.length && void 0 !== al[ax + 1]; ax++) {
        var ab = get_distance(al[ax], al[ax + 1]),
          ac, ac;
        0 != Math['round'](ab) && (true !== q ? (ac = new Sizes_obj({
            'width': ab,
            'text': Math['round'](ab * units),
            'length': room['params']['height'] / units + 35,
            'middle_line_position': room['params']['height'] / units + 35 - 2,
            'line_thickness': 0.1
          }),
          G['add'](ac),
          ac['position']['x'] = 0.1,
          ac['position']['z'] = al[ax] + ab / 2,
          ac['position']['y'] = 0,
          ac['rotation']['y'] = Math['PI'] / 2) : (ac = new Sizes_obj({
            'width': ab,
            'text': Math['round'](ab * units),
            'line_thickness': 0.1
          }),
          G['add'](ac),
          ac['position']['x'] = 0.1,
          ac['position']['z'] = al[ax] + ab / 2,
          ac['position']['y'] = 0,
          ac['rotation']['x'] = -Math['PI'] / 2,
          ac['rotation']['z'] = Math['PI'] / 2));
      }
    if (true !== q && 2 < ap.length)
      for (let ay = 0; ay < ap.length && void 0 !== ap[ay + 1]; ay++) {
        var ad = get_distance(ap[ay], ap[ay + 1]),
          ae;
        0 != Math['round'](ad) && ((ae = new Sizes_obj({
            'width': ad,
            'text': Math['round'](ad * units),
            'length': room['params']['depth'] / units + 35,
            'middle_line_position': room['params']['depth'] / units + 35 - 2,
            'line_thickness': 0.1
          }))['rotation']['z'] = Math['PI'] / 2,
          ae['rotation']['y'] = Math['PI'] / 2,
          ae['position']['x'] = 0.1,
          ae['position']['z'] = 0,
          ae['position']['y'] = ap[ay] + ad / 2,
          G['add'](ae));
      }
    if (2 < am.length)
      for (let az = 0; az < am.length && void 0 !== am[az + 1]; az++) {
        var af = get_distance(am[az], am[az + 1]),
          ag, ag;
        0 != Math['round'](af) && (true !== q ? ((ag = new Sizes_obj({
            'width': af,
            'text': Math['round'](af * units),
            'length': room['params']['height'] / units + 35,
            'middle_line_position': room['params']['height'] / units + 35 - 2,
            'line_thickness': 0.1
          }))['position']['x'] = room['params']['width'] / units - 0.1,
          ag['position']['z'] = am[az] + af / 2,
          ag['position']['y'] = 0,
          ag['rotation']['y'] = -Math['PI'] / 2,
          G['add'](ag)) : ((ag = new Sizes_obj({
            'width': af,
            'text': Math['round'](af * units),
            'line_thickness': 0.1
          }))['position']['x'] = room['params']['width'] / units - 0.1,
          ag['position']['z'] = am[az] + af / 2,
          ag['position']['y'] = 0,
          ag['rotation']['x'] = -Math['PI'] / 2,
          ag['rotation']['z'] = -Math['PI'] / 2,
          G['add'](ag)));
      }
    if (true !== q && 2 < aq.length)
      for (let aA = 0; aA < aq.length && void 0 !== aq[aA + 1]; aA++) {
        var ah = get_distance(aq[aA], aq[aA + 1]),
          ai;
        0 != Math['round'](ah) && ((ai = new Sizes_obj({
            'width': ah,
            'text': Math['round'](ah * units),
            'length': room['params']['depth'] / units + 35,
            'middle_line_position': room['params']['depth'] / units + 35 - 2,
            'line_thickness': 0.1
          }))['rotation']['z'] = Math['PI'] / 2,
          ai['rotation']['y'] = -Math['PI'] / 2,
          ai['position']['x'] = room['params']['width'] / units - 0.1,
          ai['position']['z'] = room['params']['depth'] / units,
          ai['position']['y'] = aq[aA] + ah / 2,
          G['add'](ai));
      }false === global_options['common_sizes_visible'] && hide_common_sizes();
  }
}

function projection(j, k, q = false, w = false) {
  let x = renderer['domElement']['width'],
    z = renderer['domElement']['height'];
  var A = global_options['pdf']['img_size_multi'],
    q = (q && (x = 2 * (p_width - image_left - image_right)),
      w && (z = 2 * (p_height - image_top - image_bottom)),
      '3d' === global_options['camera_mode'] && (camera_persp_old_position = camera['position']['clone'](),
        controls_old_target = controls['target']['clone']()),
      x / z),
    B;
  for (let Q = 0; Q < room['active_objects']['length']; Q++) {
    'wall' !== room['active_objects'][Q]['object_type'] && ((B = room['active_objects'][Q])['size_height'] && (B[
        'size_height']['visible'] = true),
      true !== room['active_objects'][Q]['bpl_hidden']) && (B['visible'] = true);
  }
  room['walls']['visible'] = true,
    room['sizes']['visible'] = true,
    room['common_sizes']['visible'] = true,
    room['edges'] && (room['edges']['visible'] = true),
    global_options['projection_mode'] = j;
  var w = new THREE['Box3']()['setFromObject'](room),
    C = w['getSize'](new THREE['Vector3']()),
    D = w['getCenter'](new THREE['Vector3']()),
    E;
  if ('tabletop' === j) {
    var F = [];
    for (let R = global_data['tabletop']['items']['length']; R--;)
    ;
    D = (w = new THREE['Box3']()['setFromPoints'](global_data['tpts']))['getCenter'](),
      C = w['getSize']();
  }
  'wallpanel' === j && (D = (w = new THREE['Box3']()['setFromPoints'](global_data['pts']))['getCenter'](),
      C = w['getSize']()),
    'left' !== j && 'right' !== j || (E = C['z'] > C['y'] ? C['z'] : C['y']),
    'front' !== j && 'back' !== j && 'wallpanel' != j || (E = C['x'] > C['y'] ? C['x'] : C['y']),
    'top' !== j && 'tabletop' != j || (E = C['x'] > C['z'] ? C['x'] : C['z']),
    camera_ortho['left'] = x / -2,
    camera_ortho['right'] = x / 2,
    camera_ortho['top'] = z / 2,
    camera_ortho['bottom'] = z / -2,
    camera_ortho['zoom'] = 1 < q ? z / E : x / E,
    camera = camera_ortho,
    'top' === j || 'tabletop' == j ? camera_ortho['position']['set'](D['x'], w['max']['y'] + 100, D['z']) : (
      camera_ortho['position']['set'](D['x'], D['y'], D['z']),
      'front' === j && camera_ortho['position']['set'](D['x'], D['y'], w['max']['z']),
      'back' === j && camera_ortho['position']['set'](D['x'], D['y'], w['min']['z']),
      'left' === j && camera_ortho['position']['set'](w['max']['x'], D['y'], D['z']),
      'right' === j && camera_ortho['position']['set'](w['min']['x'], D['y'], D['z']),
      'wallpanel' === j && camera_ortho['position']['set'](D['x'], D['y'], w['max']['z'] + 100)),
    controls['object'] = camera_ortho,
    'front' !== j && 'wallpanel' != j || controls['target']['set'](D['x'], D['y'], w['min']['z']),
    'back' === j && controls['target']['set'](D['x'], D['y'], w['max']['z']),
    'left' === j && controls['target']['set'](w['min']['x'], D['y'], D['z']),
    'right' === j && controls['target']['set'](w['max']['x'], D['y'], D['z']),
    'top' !== j && 'tabletop' != j || (controls['target']['set'](D['x'], D['y'], D['z']),
      C['x'] < C['z'] && controls['rotateRight_90']()),
    'top' === j && (room['front_wall_size']['rotation']['x'] = -Math['PI'] / 2,
      room['back_wall_size']['rotation']['x'] = Math['PI'] / 2,
      room['left_wall_size']['rotation']['y'] = 0,
      room['left_wall_size']['rotation']['x'] = -Math['PI'] / 2,
      room['left_wall_size']['rotation']['z'] = Math['PI'] / 2,
      room['rigth_wall_size']['rotation']['y'] = 0,
      room['rigth_wall_size']['rotation']['x'] = -Math['PI'] / 2,
      room['rigth_wall_size']['rotation']['z'] = -Math['PI'] / 2);
  var G = common_box['setFromObject'](room['front_wall'])['clone']()['expandByScalar'](25),
    H = common_box['setFromObject'](room['back_wall'])['clone']()['expandByScalar'](25),
    I = common_box['setFromObject'](room['left_wall'])['clone']()['expandByScalar'](25),
    J = common_box['setFromObject'](room['right_wall'])['clone']()['expandByScalar'](25),
    K, L, N, O;
  let P = 0;
  if ('front' === j)
    for (let S = 0; S < room['active_objects']['length']; S++) {
      'wall' !== room['active_objects'][S]['object_type'] && ((K = room['active_objects'][S])['box']['update'](),
        K['box']['intersectsBox'](G) ? (K['size_height'] && (K['size_height']['visible'] = false),
          P++) : K['visible'] = false);
    }
  if ('back' === j)
    for (let T = 0; T < room['active_objects']['length']; T++) {
      'wall' !== room['active_objects'][T]['object_type'] && ((L = room['active_objects'][T])['box']['update'](),
        L['box']['intersectsBox'](H) ? (L['size_height'] && (L['size_height']['visible'] = false),
          P++) : L['visible'] = false);
    }
  if ('left' === j)
    for (let U = 0; U < room['active_objects']['length']; U++) {
      'wall' !== room['active_objects'][U]['object_type'] && ((N = room['active_objects'][U])['box']['update'](),
        N['box']['intersectsBox'](I) ? (N['size_height'] && (N['size_height']['visible'] = false),
          P++) : N['visible'] = false);
    }
  if ('right' === j)
    for (let W = 0; W < room['active_objects']['length']; W++) {
      'wall' !== room['active_objects'][W]['object_type'] && ((O = room['active_objects'][W])['box']['update'](),
        O['box']['intersectsBox'](J) ? (O['size_height'] && (O['size_height']['visible'] = false),
          P++) : O['visible'] = false);
    }
  return dControls['set_camera'](camera),
    camera['updateProjectionMatrix'](),
    controls['enableRotate'] = false,
    controls['update'](),
    build_sizes_all(),
    'tabletop' !== j && 'wallpanel' != j || (room['walls']['visible'] = false,
      room['sizes']['visible'] = false,
      room['common_sizes']['visible'] = false,
      room['edges'] && (room['edges']['visible'] = false)),
    renderer['render'](scene, camera),
    global_options['camera_mode'] = '2d',
    P;
}

function projectionObject(f, g, h = false, j = false) {
  let k = renderer['domElement']['width'],
    m = renderer['domElement']['height'];
  h && (k = 2 * (p_width - image_left - image_right)),
    j && (m = 2 * (p_height - image_top - image_bottom)),
    '3d' === global_options['camera_mode'] && (camera_persp_old_position = camera['position']['clone'](),
      controls_old_target = controls['target']['clone']());
  var h = new THREE['Box3']()['setFromObject'](f['userData']['own_object']),
    j = h['getSize'](new THREE['Vector3']()),
    f = new THREE['Vector3'](),
    p;
  'left' !== g && 'right' !== g || (p = j['z'] > j['y'] ? j['z'] : j['y']),
    'front' !== g && 'back' !== g || (p = j['x'] > j['y'] ? j['x'] : j['y']),
    'top' !== g && 'bottom' !== g || (p = j['x'] > j['z'] ? j['x'] : j['z']),
    camera_ortho['left'] = k / -2,
    camera_ortho['right'] = k / 2,
    camera_ortho['top'] = m / 2,
    camera_ortho['bottom'] = m / -2,
    camera_ortho['zoom'] = k / p,
    camera = camera_ortho;
  let q = new THREE['Vector3'](),
    u = ('top' === g && q['set'](f['x'], h['max']['y'] + 100, f['z']),
      'bottom' === g && q['set'](f['x'], h['max']['y'] - 100, f['z']),
      'front' === g && q['set'](f['x'], f['y'], h['max']['z'] + 100),
      'back' === g && q['set'](f['x'], f['y'], h['min']['z'] - 100),
      'left' === g && q['set'](h['max']['x'] + 100, f['y'], f['z']),
      'right' === g && q['set'](h['min']['x'] - 100, f['y'], f['z']),
      camera_ortho['position']['clone']()),
    v = 400,
    w = performance['now']();

  function x() {
    var y, z = performance['now']() - w,
      z = Math['min'](z / v, 1);
    camera_ortho['position']['lerpVectors'](u, q, z),
      controls['update'](),
      renderer['render'](scene, camera),
      z < 1 && requestAnimationFrame(x);
  }
  requestAnimationFrame(x),
    controls['object'] = camera_ortho,
    controls['target']['set'](f['x'], f['y'], f['z']),
    room['walls']['visible'] = false,
    room['sizes']['visible'] = false,
    room['common_sizes']['visible'] = false,
    dControls['set_camera'](camera),
    camera['updateProjectionMatrix'](),
    controls['enableRotate'] = false,
    controls['update'](),
    build_sizes_all(),
    renderer['render'](scene, camera),
    global_options['camera_mode'] = '2d';
}

function change_camera_mode() {
  ('3d' === global_options['camera_mode'] ? camera_mode_2d : camera_mode_3d)();
}

function camera_mode_2d() {
  '3d' === global_options['camera_mode'] && (camera_persp_old_position = camera['position'],
    controls_old_target = controls['target']);
  var f = window['innerWidth'] / window['innerHeight'],
    g = new THREE['Box3']()['setFromObject'](room['front_wall']),
    h = g['getSize'](new THREE['Vector3']()),
    g = g['getCenter'](new THREE['Vector3']()),
    h = h['x'] > h['y'] ? h['x'] : h['y'];
  camera_ortho['left'] = window['innerWidth'] / -2,
    camera_ortho['right'] = window['innerWidth'] / 2,
    camera_ortho['top'] = window['innerHeight'] / 2,
    camera_ortho['bottom'] = window['innerHeight'] / -2,
    camera_ortho['zoom'] = 1 < f ? window['innerHeight'] / (h + 100 / units) : window['innerWidth'] / (h + 100 /
      units),
    (camera = camera_ortho)['position']['z'] = 900,
    camera_ortho['position']['x'] = g['x'],
    camera_ortho['position']['y'] = g['y'],
    controls['object'] = camera,
    controls['target']['x'] = g['x'],
    controls['target']['y'] = g['y'],
    camera['updateProjectionMatrix'](),
    controls['enableRotate'] = false,
    controls['update'](),
    global_options['camera_mode'] = '2d';
}

function camera_mode_3d() {
  global_options['projection_mode'] = 'none',
    camera = camera_persp,
    camera_persp_old_position && camera['position']['copy'](camera_persp_old_position),
    controls_old_target && controls['target']['copy'](controls_old_target),
    dControls['set_camera'](camera),
    controls['object'] = camera,
    controls['enableRotate'] = true,
    controls['update']();
  for (let g = 0; g < room['active_objects']['length']; g++) {
    var f;
    'wall' !== room['active_objects'][g]['object_type'] && true !== room['active_objects'][g]['bpl_hidden'] && ((f =
        room['active_objects'][g])['size_height'] && (f['size_height']['visible'] = true),
      f['visible'] = true);
  }
  room['front_wall_size']['rotation']['x'] = 0,
    room['back_wall_size']['rotation']['x'] = 0,
    room['left_wall_size']['rotation']['y'] = Math['PI'] / 2,
    room['left_wall_size']['rotation']['x'] = 0,
    room['left_wall_size']['rotation']['z'] = 0,
    room['rigth_wall_size']['rotation']['y'] = -Math['PI'] / 2,
    room['rigth_wall_size']['rotation']['x'] = 0,
    room['rigth_wall_size']['rotation']['z'] = 0,
    build_sizes_all(),
    global_options['camera_mode'] = '3d';
}

function fold(f, g, h) {
  var i;
  return h = h || [],
    f.length <= g ? (h.push(f),
      h) : (h.push(f['substring'](0, g)),
      fold(f['substring'](g), g, h));
}

function place_modules_numbers() {
  return void sc['numbers'](true);
  let f = 1;
  for (let i = 0; i < room['active_objects']['length']; i++) {
    var g, h;
    'Cabinet' !== room['active_objects'][i]['type'] && 'Shelve' !== room['active_objects'][i]['type'] || ((g = room[
        'active_objects'][i])['box']['update'](),
      h = generate_sprite_number(g['pdf_number'] = f),
      g['add'](h),
      'Cabinet' === g['temp_type'] && h['position']['set'](0, g['params']['cabinet']['height'] / units / 2, g[
        'params']['cabinet']['depth'] / units / 2),
      'Shelve' === g['temp_type'] && h['position']['set'](0, g['params']['height'] / units / 2, 0),
      f++);
  }
}

function generate_sprite_number(f, g) {
  if (pp['events']['module']['generate_sprite_number']) {
    var g = pp['events']['module']['generate_sprite_number'](f, g);
    if (g)
      return g;
  }
  var g = document['createElement']('canvas'),
    h = (g['width'] = 64,
      g['height'] = 64,
      g['getContext']('2d')),
    i = new THREE['CanvasTexture'](g),
    j = new THREE['SpriteMaterial']({
      'map': i,
      'depthTest': false,
      'depthWrite': false
    }),
    j = new THREE['Sprite'](j);
  return j['position']['set'](0, 0, 0),
    j['scale']['set'](7, 7, 1),
    h['fillStyle'] = '#000000',
    h['fillRect'](0, 0, g['width'], g['height']),
    h['fillStyle'] = '#FFFFFF',
    h['font'] = '64px\x20Arial',
    h['textBaseline'] = 'middle',
    h['textAlign'] = 'center',
    h['fillText'](f, 32, 38),
    j['renderOrder'] = 1,
    i['needsUpdate'] = true,
    j;
}

function remove_modules_numbers() {
  sc['numbers'](false);
}

function get_screen_base64(f) {
  return f = f || 'jpeg',
    renderer['domElement']['toDataURL']('image/' + f);
}

function get_screen_blob(e) {
  'function' == typeof e && renderer['domElement']['toBlob'](function(f) {
    e(f);
  });
}

function get_screen(f = 1) {
  var g = document['createElement']('canvas'),
    h = (g['width'] = renderer['domElement']['width'],
      g['height'] = renderer['domElement']['height'],
      g['getContext']('2d')),
    i = (renderer['render'](scene, camera),
      h['drawImage'](renderer['domElement'], 0, 0, renderer['domElement']['width'], renderer['domElement'][
        'height'], 0, 0, renderer['domElement']['width'], renderer['domElement']['height']),
      document['getElementsByClassName']('client_logo')[0]),
    j, i, i, j = (i && ((j = new Image())['src'] = i['getElementsByTagName']('IMG')[0]['src'],
        i = j['width'] / 180,
        i = j['height'] / i,
        h['drawImage'](j, g['width'] - 180 - 10, 10, 180, i)),
      document['getElementsByClassName']('client_data')[0]['innerHTML']),
    i = (h['font'] = 'normal\x2020px\x20Arial',
      h['measureText'](j));
  return h['fillStyle'] = '#353537',
    h['globalAlpha'] = 0.6,
    h['fillRect'](g['width'] - i['width'], g['height'] - 70, i['width'], 50),
    h['globalAlpha'] = 1,
    h['fillStyle'] = '#ffffff',
    h['fillText'](j, g['width'] - i['width'], g['height'] - 40),
    renderer['render'](scene, camera),
    g['toDataURL']('image/jpeg', f);
}
var modules_send_data = {};

function get_modules_send_data(k) {
  null == (k = k || {})['modules'] && (k['modules'] = true),
    null == k['accessories'] && (k['accessories'] = true),
    null == k['tabletop'] && (k['tabletop'] = true),
    null == k['wallpanel'] && (k['wallpanel'] = true),
    null == k['handles'] && (k['handles'] = true),
    null == k['additional_materials'] && (k['additional_materials'] = true),
    null == k['interior'] && (k['interior'] = false),
    null == k['tech'] && (k['tech'] = false);
  var q = k,
    x = {
      'modules': [],
      'interior': [],
      'tech': [],
      'wallpanels': [],
      'accessories': cart['accessories'],
      'tabletop': {
        'thickness': project_settings['tabletop_thickness']
      },
      'wallpanel': {
        'active': project_settings['wall_panel']['active'],
        'height': project_settings['wall_panel']['height']
      },
      'furniture': project_settings['hinges']['name']
    };
  project_settings['name'] && (x['name'] = project_settings['name']),
    x['handles'] = {},
    0 != facades_lib['items'][project_settings['defaults']['facades']['top']]['handle'] && 0 != facades_lib['items']
    [project_settings['defaults']['facades']['top']]['handle'] && 0 != project_settings['handle']['model']['id'] && (
      x['handles'] = {
        'code': project_settings['handle']['model']['sizes'][project_settings['handle']['model']['size_index']]['code'],
        'axis_size': project_settings['handle']['model']['sizes'][project_settings['handle']['model']['size_index']][
          'axis_size'
        ],
        'name': project_settings['handle']['model']['name'],
        'count': 0
      }),
    0 != facades_lib['items'][project_settings['defaults']['facades']['top']]['handle'] && 0 != project_settings[
      'handle']['top']['model']['id'] && (x['handles']['top'] = {
      'code': project_settings['handle']['top']['model']['sizes'][project_settings['handle']['model']['size_index']][
        'code'
      ],
      'axis_size': project_settings['handle']['top']['model']['sizes'][project_settings['handle']['model'][
        'size_index'
      ]]['axis_size'],
      'name': project_settings['handle']['top']['model']['name'],
      'count': 0
    }),
    0 != facades_lib['items'][project_settings['defaults']['facades']['bottom']]['handle'] && 0 != project_settings[
      'handle']['bottom']['model']['id'] && (x['handles']['bottom'] = {
      'code': project_settings['handle']['bottom']['model']['sizes'][project_settings['handle']['model'][
        'size_index']]['code'],
      'axis_size': project_settings['handle']['bottom']['model']['sizes'][project_settings['handle']['model'][
        'size_index'
      ]]['axis_size'],
      'name': project_settings['handle']['bottom']['model']['name'],
      'count': 0
    }),
    project_settings['project_id'] && (x['project_id'] = project_settings['project_id']);
  let z = 0,
    A = [],
    B = [];
  var C = [],
    k, D, k, D;
  project_settings['facades_additional_materials'] && (x['additional_materials'] = {},
    Object['keys'](project_settings['facades_additional_materials'])['forEach'](function(T) {
      x['additional_materials'][T] = {
        'name': project_settings['facades_additional_materials'][T]['name']
      };
    }));
  for (let T = 0; T < room['active_objects']['length']; T++) {
    var E = room['active_objects'][T];
    1 == q['wallpanel'] && 'Wall_panel' === E['userData']['type'] && x['wallpanels']['push']({
        'width': E['params']['width'],
        'height': E['params']['height'],
        'thickness': E['params']['thickness'],
        'material_id': E['params']['material']['id'],
        'material_code': E['params']['material']['code'],
        'material_name': E['params']['material']['name']
      }),
      1 == q['modules'] && 'Cabinet' === E['type'] && A.push(E),
      1 == q['interior'] && 'Model' === E['type'] && 'Other' == E['params']['catalog'] && B.push(E);
  }
  if (1 == q['modules'] && A.length)
    for (let U = 0; U < A.length; U++) {
      let W = A[U];
      var F, G, H, I = ('bottom' === W['params']['cabinet_group'] && z++,
          G = W['params']['cabinet']['material'] || ('top' !== W['params']['cabinet_group'] ? project_settings[
            'selected_materials']['bottom'] : project_settings['selected_materials']['top'])['corpus'],
          W['params']['doors']['length'] ? F = W['params']['doors'][0]['material'] || ('top' !== W['params'][
            'cabinet_group'
          ] ? project_settings['selected_materials']['bottom'] : project_settings['selected_materials']['top'])[
            'facades'] : W['params']['lockers']['length'] && (F = W['params']['lockers'][0]['material'] || ('top' !==
            W['params']['cabinet_group'] ? project_settings['selected_materials']['bottom'] : project_settings[
              'selected_materials']['top'])['facades']),
          []),
        J = [],
        K;
      if (W['params']['doors']['length'])
        for (let a4 = 0; a4 < W['params']['doors']['length']; a4++) {
          let a5 = {
            'width': W['doors']['children'][a4]['params']['width'],
            'height': W['doors']['children'][a4]['params']['height'],
            'type': W['params']['doors'][a4]['type'],
            'style': W['doors']['children'][a4]['params']['style'][0]
          };
          !W['params']['doors'][a4]['no_handle_forced'] && W['params']['doors'][a4]['handle_model'] && 0 != W[
              'params']['doors'][a4]['handle_model']['id'] && 'none' != W['params']['doors'][a4]['handle_model'] && !
            project_settings['handle'][W['params']['cabinet_group']]['no_handle'] && 0 != facades_lib['items'][
              project_settings['defaults']['facades'][W['params']['cabinet_group']]
            ]['handle'] && x['handles'][W['params']['cabinet_group']] && (x['handles'][W['params']['cabinet_group']][
                'count'
              ] += 1,
              x['handles']['count'] += 1,
              W['params']['doors'][a4]['handle_model']['size_index'] || (W['params']['doors'][a4]['handle_model'][
                'size_index'
              ] = 0),
              a5['handle'] = {
                'name': W['params']['doors'][a4]['handle_model']['name'],
                'code': W['params']['doors'][a4]['handle_model']['sizes'][W['params']['doors'][a4]['handle_model'][
                  'size_index'
                ]]['code']
              }),
            !glass_materials_catalog['items']['length'] || 'window' !== a5['style'] && 'frame' !== a5['style'] || (K =
              glass_lib['get_item'](W['params']['doors'][a4]['glass_material']),
              a5['glass_material_id'] = K['id'],
              a5['glass_material_code'] = K['code']),
            W['doors']['children'][a4]['params']['additional_materials'] && (a5['additional_materials'] = {},
              Object['keys'](W['doors']['children'][a4]['params']['additional_materials'])['forEach'](function(a7) {
                let a8 = find_obj_by_id(materials_catalog['items'], W['doors']['children'][a4]['params'][
                  'additional_materials'
                ][a7]);
                a8 = a8 || {},
                  a5['additional_materials'][a7] = {
                    'id': a8['id'],
                    'code': a8['code']
                  };
              }));
          let a6 = find_obj_by_id(materials_catalog['items'], W['doors']['children'][a4]['params']['material']);
          a6 = a6 || {},
            a5['material_id'] = a6['id'],
            a5['material_code'] = a6['code'],
            I.push(a5);
        }
      if (W['params']['lockers']['length'])
        for (let a7 = 0; a7 < W['params']['lockers']['length']; a7++) {
          var L = {
              'width': W['lockers']['children'][a7]['params']['width'],
              'height': W['lockers']['children'][a7]['params']['height'],
              'style': W['lockers']['children'][a7]['params']['style']
            },
            N;
          !W['params']['lockers'][a7]['no_handle_forced'] && 0 != facades_lib['items'][project_settings['defaults'][
              'facades'
            ][W['params']['cabinet_group']]]['handle'] && x['handles'][W['params']['cabinet_group']] && (x['handles'][W[
                'params']['cabinet_group']]['count'] += 1,
              x['handles']['count'] += 1,
              W['params']['lockers'][a7]['handle_model']['size_index'] || (W['params']['lockers'][a7]['handle_model'][
                'size_index'
              ] = 0),
              L['handle'] = {
                'name': W['params']['lockers'][a7]['handle_model']['name'],
                'code': W['params']['lockers'][a7]['handle_model']['sizes'][W['params']['lockers'][a7]['handle_model'][
                  'size_index'
                ]]['code']
              }),
            !glass_materials_catalog['items']['length'] || 'window' !== L['style'] && 'frame' !== L['style'] || (N =
              find_obj_by_id(glass_materials_catalog['items'], W['params']['lockers'][a7]['glass_material'])) && (L[
                'glass_material_id'] = N['id'],
              L['glass_material_code'] = N['code']);
          let a8 = find_obj_by_id(materials_catalog['items'], W['lockers']['children'][a7]['params']['material']);
          a8 = a8 || {},
            L['material_id'] = a8['id'],
            L['material_code'] = a8['code'],
            J.push(L);
        }
      var O = [];
      if (W['params']['accessories_default'])
        for (let a9 = 0; a9 < W['params']['accessories_default']['length']; a9++) {
          var P = W['params']['accessories_default'][a9];
          accsessories_data['items'][P['id']] && O.push({
            'id': P['id'],
            'code': accsessories_data['items'][P['id']]['code'],
            'name': accsessories_data['items'][P['id']]['name'],
            'count': P['count']
          });
        }
      let Z = [],
        a0 = (W['params']['accessories_types'] && Object['keys'](W['params']['accessories_types'])['forEach'](function(
            aa) {
            var aa = W['params']['accessories_types'][aa];
            accsessories_data['items'][aa['id']] && Z.push({
              'id': aa['id'],
              'code': accsessories_data['items'][aa['id']]['code'],
              'name': accsessories_data['items'][aa['id']]['name'],
              'count': aa['count']
            });
          }),
          void 0 === F && (F = materials_catalog['items'][0]['id']),
          void 0 === G && (G = materials_catalog['items'][0]['id']),
          get_material_by_id(F)),
        a1 = get_material_category_by_id_no_items(a0['category']),
        a2 = get_material_by_id(G),
        a3 = false;
      'bottom' === W['params']['cabinet_group'] && true !== W['params']['tabletop']['active'] && (a3 = true);
      for (var Q = {
          'id': W['params']['id'],
          'facade_material_id': null != a0['id'] ? a0['id'] : lang['no'],
          'corpus_material_id': null != a2['id'] ? a2['id'] : lang['no'],
          'name': null != W['params']['name'] ? W['params']['name'] : lang['no'],
          'code': null != W['params']['code'] ? W['params']['code'] : lang['no'],
          'sizes': W['params']['cabinet']['width'] + 'x' + W['params']['cabinet']['height'] + 'x' + W['params'][
            'cabinet'
          ]['depth'],
          'width': W['params']['cabinet']['width'],
          'height': W['params']['cabinet']['height'],
          'depth': W['params']['cabinet']['depth'],
          'price': void 0 !== W['params']['price'] && null !== W['name'] ? W['params']['price'] : 0,
          'doors': I,
          'lockers': J,
          'facade_material_code': null != a0['code'] ? a0['code'] : lang['no'],
          'corpus_material_code': null != a2['code'] ? a2['code'] : lang['no'],
          'facade_material_category_code': void 0 !== a1['code'] ? a1['code'] : lang['no'],
          'facade_material_category_id': void 0 !== a1['id'] ? a1['id'] : lang['no'],
          'facade_type_id': void 0 !== facades_lib['items'][project_settings['defaults']['facades'][W['params'][
            'cabinet_group'
          ]]]['category'] ? facades_lib['items'][project_settings['defaults']['facades'][W['params'][
            'cabinet_group']]]['category'] : lang['no'],
          'count': 1,
          'group': W['params']['cabinet_group'],
          'accessories_default': O,
          'accessories_types': Z,
          'is_penal': a3
        }, R = (Q['doors']['length'] || Q['lockers']['length'] || delete Q['facade_material_id'],
          1), S = 0; S < x['modules']['length']; S++) {
        if (x['modules'][S]['id'] === Q['id'] && x['modules'][S]['sizes'] === Q['sizes'] && x['modules'][S][
            'facade_material_id'
          ] === Q['facade_material_id'] && x['modules'][S]['corpus_material_id'] === Q['corpus_material_id']) {
          R = 0;
          for (let aa = x['modules'][S]['doors']['length']; aa--;)
            for (let ab = Q['doors']['length']; ab--;)
              JSON['stringify'](x['modules'][S]['doors'][aa]['handle']) != JSON['stringify'](Q['doors'][ab][
              'handle']) && (R = 1);
          for (let ac = x['modules'][S]['lockers']['length']; ac--;)
            for (let ad = Q['lockers']['length']; ad--;)
              JSON['stringify'](x['modules'][S]['lockers'][ac]['handle']) != JSON['stringify'](Q['lockers'][ad][
                'handle']) && (R = 1);
        }
        if (0 === R) {
          x['modules'][S]['count'] += 1;
          break;
        }
      }
      1 === R && (W['params']['doors']['length'] || W['params']['lockers']['length'] || (delete Q[
            'facade_material_code'],
          delete Q['facade_material_id'],
          delete Q['facade_material_category_code'],
          delete Q['facade_material_category_id']),
        x['modules']['push'](Q));
    }
  if (1 == q['interior'] && B.length)
    for (let ae = 0; ae < B.length; ae++) {
      let af = B[ae],
        ag = {
          'name': null != af['params']['name'] ? af['params']['name'] : lang['no'],
          'code': null != af['params']['code'] ? af['params']['code'] : lang['no'],
          'sizes': af['params']['width'] + 'x' + af['params']['height'] + 'x' + af['params']['depth'],
          'width': af['params']['width'],
          'height': af['params']['height'],
          'depth': af['params']['depth']
        };
      af['params']['additional_materials'] && (ag['additional_materials'] = {},
          Object['keys'](af['params']['additional_materials'])['forEach'](function(ah) {
            var ai = get_material_by_id(af['params']['additional_materials'][ah]);
            ag['additional_materials'][ah] = {
              'name': ai['name'],
              'code': ai['code']
            };
          })),
        x['interior']['push'](ag);
    }
  return x['cokol'] = {
      'height': project_settings['cokol_height'],
      'material': get_material_by_id(project_settings['selected_materials']['cokol'])
    },
    0 < z ? (1 == q['tabletop'] && (k = get_material_by_id(project_settings['selected_materials']['tabletop']),
        D = get_material_category_by_id(k['category']),
        x['tabletop']['material'] = {
          'code': null != k['code'] ? k['code'] : lang['no'],
          'name': null != k['name'] ? k['name'] : lang['no'],
          'id': k['id'],
          'category': D['name']
        }),
      1 == q['wallpanel'] && (k = get_material_by_id(project_settings['selected_materials']['wall_panel']),
        D = get_material_category_by_id(k['category'])) && (x['wallpanel']['material'] = {
        'code': null != k['code'] ? k['code'] : lang['no'],
        'name': null != k['name'] ? k['name'] : lang['no'],
        'id': k['id'],
        'category': D['name']
      })) : (delete x['tabletop'],
      delete x['wallpanel']),
    A = null,
    B = null,
    modules_send_data = x;
}

function get_modules_csv() {
  var f = '';
  f += '\x22' + lang['title'] + '\x22,\x22' + lang['code'] + '\x22,\x22' + lang['sizes'] + '\x22,\x22' + lang['count'] +
    '\x22,\x22' + lang['price_per_piece'] + '\x22,\x22' + lang['price'] + '\x22,\x0a';
  for (var g = 0, h; g < modules_send_data['modules']['length']; g++) {
    let j = (h = modules_send_data['modules'][g])['price'];
    'string' == typeof h['price'] && (j = parseFloat(h['price']['replace'](',', '.'))['toFixed'](2));
    var i = h['count'] * j;
    f += '\x22' + h['name'] + '\x22,\x22' + h['code'] + '\x22,\x22' + h['sizes'] + '\x22,\x22' + h['count'] +
      '\x22,\x22' + j.toString()['replace']('.', ',') + '\x22,\x22' + i.toString()['replace']('.', ',') +
      '\x22\x0a';
  }
  for (var g = 0, h; g < modules_send_data['accessories']['length']; g++) {
    f += '\x22' + (h = modules_send_data['accessories'][g])['Name'] + '\x22,\x22' + h['SKU'] + '\x22,\x22\x22,\x22' + h[
      'count'] + '\x22,\x22' + h['Regular\x20price'] + '\x22,\x22' + h['count'] * h['Regular\x20price'] + '\x22\x0a';
  }
  return f;
}

function to_int(f) {
  let g = 'boolean' == typeof f ? false === f ? 0 : 1 : 0;
  return 'string' == typeof f && (g = 'false' === f['toLowerCase']() || '0' === f['toLowerCase']() || '' === f[
      'toLowerCase']() ? 0 : 1),
    g = 'number' == typeof f ? 0 === f ? 0 : 1 : g;
}

function find_obj_by_id(f, g) {
  return _['find'](f, function(h) {
    return parseInt(h['id']) === parseInt(g);
  });
}
let modules;

function colorpicker_mode() {
  set_colorpicker_mode();
}

function set_colorpicker_mode() {
  global_options['colorpicker_mode'] = true,
    $('#calc')[0]['style']['cursor'] = 'url(/common_assets/images/eyedropper-variant.png)\x204\x2021,\x20pointer';
}

function unset_colorpicker_mode() {
  global_options['colorpicker_mode'] = false,
    $('#calc')[0]['style']['cursor'] = 'auto';
}

function clamp(f, g, h) {
  return f <= g ? g : h <= f ? h : f;
}

function delay(e, f) {
  let g = 0;
  return function() {
    let h = this,
      i = arguments;
    clearTimeout(g),
      g = setTimeout(function() {
        e['apply'](h, i);
      }, f || 0);
  };
}

function csggeom(f, g) {
  var h = CSG['fromMesh'](f);
  for (let j = 0; j < g.length; j++)
    h = h['subtract'](CSG['fromMesh'](g[j]));
  var i = CSG['toGeometry'](h);
  return parseInt(THREE['REVISION']) < 121 ? i['applyMatrix'](new THREE['Matrix4']()['getInverse'](f['matrix'])) : i[
      'applyMatrix4'](new THREE['Matrix4']()['copy'](f['matrix'])['invert']()),
    i['computeBoundingSphere'](),
    i['computeBoundingBox'](),
    i;
}

function check_at_wall(f) {
  f['box']['update']();
  let g = false;
  for (let h = 0; h < room['walls']['children']['length']; h++)
    'floor' !== room['walls']['children'][h]['name'] && 'ceiling' !== room['walls']['children'][h]['name'] && f['box'][
      'intersectsBox'
    ](room['walls']['children'][h]['box']) && (g = true);
  return g;
}
var MD5 = function(f) {
  return f = unescape(encodeURIComponent(f)),
    (result = M(V(Y(X(f), 8 * f.length))))['toLowerCase']();
};

function M(f) {
  for (var g, h = '0123456789ABCDEF', i = '', j = 0; j < f.length; j++)
    g = f['charCodeAt'](j),
    i += h['charAt'](g >>> 4 & 15) + h['charAt'](15 & g);
  return i;
}

function X(f) {
  for (var g = Array(f.length >> 2), h = 0; h < g.length; h++)
    g[h] = 0;
  for (h = 0; h < 8 * f.length; h += 8)
    g[h >> 5] |= (255 & f['charCodeAt'](h / 8)) << h % 32;
  return g;
}

function V(f) {
  for (var g = '', h = 0; h < 32 * f.length; h += 8)
    g += String['fromCharCode'](f[h >> 5] >>> h % 32 & 255);
  return g;
}

function Y(f, g) {
  f[g >> 5] |= 128 << g % 32,
    f[14 + (g + 64 >>> 9 << 4)] = g;
  for (var h = 0x67452301, j = -0x10325477, k = -0x67452302, m = 0x10325476, p = 0; p < f.length; p += 16) {
    var q = h,
      u = j,
      v = k,
      w = m,
      j = md5_ii(j = md5_ii(j = md5_ii(j = md5_ii(j = md5_hh(j = md5_hh(j = md5_hh(j = md5_hh(j = md5_gg(j = md5_gg(j =
          md5_gg(j = md5_gg(j = md5_ff(j = md5_ff(j = md5_ff(j = md5_ff(j, k = md5_ff(k, m = md5_ff(m,
                  h = md5_ff(h, j, k, m, f[p + 0], 7, -0x28955b88), j, k, f[p + 1], 12, -
                  0x173848aa), h, j, f[p + 2], 17, 0x242070db), m, h, f[p + 3], 22, -
                0x3e423112), k = md5_ff(k, m = md5_ff(m, h = md5_ff(h, j, k, m, f[p + 4], 7, -
                  0xa83f051), j, k, f[p + 5], 12, 0x4787c62a), h, j, f[p + 6], 17, -
                0x57cfb9ed), m, h, f[p + 7], 22, -0x2b96aff), k = md5_ff(k, m = md5_ff(m, h =
                md5_ff(h, j, k, m, f[p + 8], 7, 0x698098d8), j, k, f[p + 9], 12, -
                0x74bb0851), h, j, f[p + 10], 17, -42063), m, h, f[p + 11], 22, -0x76a32842),
              k = md5_ff(k, m = md5_ff(m, h = md5_ff(h, j, k, m, f[p + 12], 7, 0x6b901122), j, k,
                f[p + 13], 12, -0x2678e6d), h, j, f[p + 14], 17, -0x5986bc72), m, h, f[p + 15],
              22, 0x49b40821), k = md5_gg(k, m = md5_gg(m, h = md5_gg(h, j, k, m, f[p + 1], 5, -
              0x9e1da9e), j, k, f[p + 6], 9, -0x3fbf4cc0), h, j, f[p + 11], 14, 0x265e5a51), m,
            h, f[p + 0], 20, -0x16493856), k = md5_gg(k, m = md5_gg(m, h = md5_gg(h, j, k, m, f[
              p + 5], 5, -0x29d0efa3), j, k, f[p + 10], 9, 0x2441453), h, j, f[p + 15], 14, -
            0x275e197f), m, h, f[p + 4], 20, -0x182c0438), k = md5_gg(k, m = md5_gg(m, h = md5_gg(h,
            j, k, m, f[p + 9], 5, 0x21e1cde6), j, k, f[p + 14], 9, -0x3cc8f82a), h, j, f[p +
            3], 14, -0xb2af279), m, h, f[p + 8], 20, 0x455a14ed), k = md5_gg(k, m = md5_gg(m, h =
            md5_gg(h, j, k, m, f[p + 13], 5, -0x561c16fb), j, k, f[p + 2], 9, -0x3105c08), h, j,
          f[p + 7], 14, 0x676f02d9), m, h, f[p + 12], 20, -0x72d5b376), k = md5_hh(k, m = md5_hh(m,
            h = md5_hh(h, j, k, m, f[p + 5], 4, -378558), j, k, f[p + 8], 11, -0x788e097f), h, j,
          f[p + 11], 16, 0x6d9d6122), m, h, f[p + 14], 23, -0x21ac7f4), k = md5_hh(k, m = md5_hh(m,
            h = md5_hh(h, j, k, m, f[p + 1], 4, -0x5b4115bc), j, k, f[p + 4], 11, 0x4bdecfa9), h, j,
          f[p + 7], 16, -0x944b4a0), m, h, f[p + 10], 23, -0x41404390), k = md5_hh(k, m = md5_hh(m, h =
          md5_hh(h, j, k, m, f[p + 13], 4, 0x289b7ec6), j, k, f[p + 0], 11, -0x155ed806), h, j, f[p +
          3], 16, -0x2b10cf7b), m, h, f[p + 6], 23, 0x4881d05), k = md5_hh(k, m = md5_hh(m, h = md5_hh(
            h, j, k, m, f[p + 9], 4, -0x262b2fc7), j, k, f[p + 12], 11, -0x1924661b), h, j, f[p + 15],
          16, 0x1fa27cf8), m, h, f[p + 2], 23, -0x3b53a99b), k = md5_ii(k, m = md5_ii(m, h = md5_ii(h, j, k,
            m, f[p + 0], 6, -0xbd6ddbc), j, k, f[p + 7], 10, 0x432aff97), h, j, f[p + 14], 15, -
          0x546bdc59), m, h, f[p + 5], 21, -0x36c5fc7), k = md5_ii(k, m = md5_ii(m, h = md5_ii(h, j, k, m, f[p +
          12], 6, 0x655b59c3), j, k, f[p + 3], 10, -0x70f3336e), h, j, f[p + 10], 15, -1051523), m, h, f[
          p + 1], 21, -0x7a7ba22f), k = md5_ii(k, m = md5_ii(m, h = md5_ii(h, j, k, m, f[p + 8], 6,
          0x6fa87e4f), j, k, f[p + 15], 10, -0x1d31920), h, j, f[p + 6], 15, -0x5cfebcec), m, h, f[p + 13],
        21, 0x4e0811a1), k = md5_ii(k, m = md5_ii(m, h = md5_ii(h, j, k, m, f[p + 4], 6, -0x8ac817e), j, k, f[
        p + 11], 10, -0x42c50dcb), h, j, f[p + 2], 15, 0x2ad7d2bb), m, h, f[p + 9], 21, -0x14792c6f),
      h = safe_add(h, q);
    j = safe_add(j, u),
      k = safe_add(k, v),
      m = safe_add(m, w);
  }
  return Array(h, j, k, m);
}

function md5_cmn(f, g, h, j, k, l) {
  return safe_add(bit_rol(safe_add(safe_add(g, f), safe_add(j, l)), k), h);
}

function md5_ff(f, g, h, j, k, l, m) {
  return md5_cmn(g & h | ~g & j, f, g, k, l, m);
}

function md5_gg(f, g, h, j, k, l, m) {
  return md5_cmn(g & j | h & ~j, f, g, k, l, m);
}

function md5_hh(f, g, h, j, k, l, m) {
  return md5_cmn(g ^ h ^ j, f, g, k, l, m);
}

function md5_ii(f, g, h, j, k, l, m) {
  return md5_cmn(h ^ (g | ~j), f, g, k, l, m);
}

function safe_add(f, g) {
  var h = (65535 & f) + (65535 & g);
  return (f >> 16) + (g >> 16) + (h >> 16) << 16 | 65535 & h;
}

function bit_rol(f, g) {
  return f << g | f >>> 32 - g;
}

function convert_facades() {
  var f = [];
  for (let q = 0; q < facades_sets.length; q++) {
    let u = facades_sets[q],
      v = {};
    v['id'] = parseInt(u['id']),
      v['icon'] = u['icon'],
      v['name'] = u['name'],
      v['category'] = parseInt(u['category']),
      v['top_category'] = u['top_category'],
      v['materials'] = u['materials'],
      void 0 === v['nmap'] && (v['nmap'] = ''),
      u['prices_fixed'] || (u['prices_fixed'] = []),
      u['prices_decor'] || (u['prices_decor'] = []);
    var g = {
      'mat_codes': {}
    };
    for (let w = u['prices_fixed']['length']; w--;) {
      var h = u['prices_fixed'][w]['type'],
        j = u['prices_fixed'][w]['mat_code'],
        k = u['prices_fixed'][w]['width'],
        m = u['prices_fixed'][w]['height'];
      j ? (g['mat_codes'][j] || (g['mat_codes'][j] = {}),
        g['mat_codes'][j][h] || (g['mat_codes'][j][h] = {}),
        g['mat_codes'][j][h][k + '_' + m] = u['prices_fixed'][w]) : (g['mat_codes']['__all'] || (g['mat_codes'][
          '__all'
        ] = {}),
        g['mat_codes']['__all'][h] || (g['mat_codes']['__all'][h] = {}),
        g['mat_codes']['__all'][h][k + '_' + m] = u['prices_fixed'][w]);
    }
    u['prices_fixed'] = g;
    var p = {};
    for (let x = u['prices_decor']['length']; x--;)
      u['prices_decor'][x]['mat_code'] && (p[u['prices_decor'][x]['mat_code']] = u['prices_decor'][x]);
    u['prices_decor'] = p,
      u['types'] ? u['id'] == parseInt(u['id']) && u['category'] == parseInt(u['category']) && (v = copy_object(u)) : (
        v['compatibility_types'] = {},
        v['types'] = {},
        u['full'] && (v['types'][0] = {
            'name': 'Глухой',
            'icon': '',
            'items': copy_object(u['full'])
          },
          v['compatibility_types']['full'] = 0),
        u['window'] && (v['types'][1] = {
            'name': 'Витрина',
            'icon': '',
            'items': copy_object(u['window'])
          },
          v['compatibility_types']['window'] = 1),
        u['frame'] && (v['types'][2] = {
            'name': 'Решетка',
            'icon': '',
            'items': copy_object(u['frame'])
          },
          v['compatibility_types']['frame'] = 2),
        u['radius'] && (v['types'][3] = {
            'name': 'Радиус\x20глухой',
            'icon': '',
            'items': copy_object(u['radius']),
            'radius': true
          },
          v['compatibility_types']['radius'] = 3),
        u['radius_window'] && (v['types'][4] = {
            'name': 'Радиус\x20витрина',
            'icon': '',
            'items': copy_object(u['radius_window']),
            'radius': true
          },
          v['compatibility_types']['radius_window'] = 4)),
      Object['keys'](v['types'])['forEach'](function(y) {
        null != v['types'][y]['thickness'] && 0 != v['types'][y]['thickness'] || (v['types'][y]['thickness'] = u[
            'thickness']),
          null == v['types'][y]['nmap'] && (v['types'][y]['nmap'] = ''),
          null != v['types'][y]['side'] || v['types'][y]['radius'] || (v['types'][y]['side'] = 0),
          u['types'] && u['types'][y] && Object['keys'](u['types'][y]['items'])['forEach'](function(C) {
            null == v['types'][y]['items'][C]['max_width'] && (v['types'][y]['items'][C]['max_width'] = 0),
              null == v['types'][y]['items'][C]['max_height'] && (v['types'][y]['items'][C]['max_height'] = 0),
              v['types'][y]['items'][C]['open'] || (v['types'][y]['items'][C]['open'] = 'all'),
              v['types'][y]['items'][C]['group'] || (v['types'][y]['items'][C]['group'] = 'all');
          });
        var z = v['types'][y]['items'];
        for (let C = 0; C < z.length; C++) {
          var A = z[C],
            B = z[C + 1];
          B ? (0 == A['max_width'] && (A['max_width'] = 1 / 0),
            0 == A['max_height'] && (A['max_height'] = parseInt(B['min_height']) - 1)) : (0 == A[
            'max_width'] && (A['max_width'] = 1 / 0),
            0 == A['max_height'] && (A['max_height'] = 1 / 0));
        }
      }),
      f.push(v);
  }
  facades_sets = f;
}

function change_depth_all(f) {
  if (f)
    for (let v = room['active_objects']['length'] - 1; 0 <= v; v--) {
      var g, h, j, k, m, p, q, u;
      'Cabinet' === room['active_objects'][v]['type'] && (g = room['active_objects'][v])['params']['cabinet_group'] ===
        f['group'] && (g['set_cabinet_size'](g['params']['cabinet']['width'], g['params']['cabinet']['height'], f[
            'depth'], 10),
          h = 0,
          j = room['params']['width'] / units,
          k = 0,
          m = room['params']['depth'] / units,
          p = 0,
          q = room['params']['height'] / units,
          g['box']['update'](),
          u = g['box']['getSize'](new THREE['Vector3']()),
          g['position']['set'](clamp(g['position']['x'], 0 + u['x'] / 2, j - u['x'] / 2), clamp(g['position'][
            'y'], 0, q - u['y']), clamp(g['position']['z'], 0 + u['z'] / 2, m - u['z'] / 2)),
          g['box']['update']());
    }
}

function set_modules_visible(f, g) {
  f = f || 'all';
  for (let i = room['active_objects']['length']; i--;) {
    var h = room['active_objects'][i];
    'Module' != h['temp_type'] || h['userData']['params']['spec']['cabinet_group'] !== f && 'all' !== f || (h[
        'visible'] = g,
        h['bpl_hidden'] = !g),
      'Cabinet' !== h['type'] || h['params']['cabinet_group'] !== f && 'all' !== f || (h['visible'] = g,
        h['bpl_hidden'] = !g);
  }
  build_sizes_all();
}

function set_models_visible(f, g) {
  for (let h = room['active_objects']['length']; h--;)
    'Tech' === f ? ('Model' !== room['active_objects'][h]['type'] || room['active_objects'][h]['params']['catalog'] !==
      f && 'all' !== f || (room['active_objects'][h]['visible'] = g,
        room['active_objects'][h]['bpl_hidden'] = !g),
      'Cabinet' === room['active_objects'][h]['type'] && (room['active_objects'][h]['fixed_models']['visible'] = g,
        room['active_objects'][h]['models']['visible'] = g)) : 'Model' !== room['active_objects'][h]['type'] || room[
      'active_objects'][h]['params']['catalog'] !== f && 'all' !== f || (room['active_objects'][h]['visible'] = g,
      room['active_objects'][h]['bpl_hidden'] = !g);
  build_sizes_all();
}

function set_tabletop_visible(f) {
  if (constructor_settings['core_v2']) {
    pp['state']['scene_layers']['tabletop'] = f;
    for (var g of pp['info']['tabletop']['desc'])
      if (g['info']['groupObject'])
        g['info']['groupObject']['visible'] = f,
        g['info']['groupObject']['userData']['params']['visible'] = f;
      else {
        for (var h of g['items'])
          h['tabletop']['visible'] = f,
          h['tabletop']['userData']['params']['visible'] = f,
          h['sourceObject']['change_param_by_path'](h['tabletop']['userData']['path'], 'visible', f, false),
          '__tabletop' === h['sourceObject']['userData']['params']['spec']['element_type'] && (h['sourceObject'][
              'visible'
            ] = f,
            h['sourceObject']['userData']['params']['visible'] = f);
      }
    for (var j of pp['info']['tabletop']['bort_items'])
      j['visible'] = f;
    var k, l;
    for (l of _.filter(d_objects, _['matchesProperty']('object_type', 'washer')))
      l['visible'] = f;
  } else {
    for (let m = room['active_objects']['length']; m--;)
      'Cabinet' === room['active_objects'][m]['type'] && room['active_objects'][m]['tabletop'] && (room[
          'active_objects'][m]['tabletop']['visible'] = f,
        room['active_objects'][m]['params']['tabletop']['active'] = f,
        room['active_objects'][m]['washer']) && (room['active_objects'][m]['washer']['visible'] = f);
    sc['build_tabletop']();
  }
}

function set_facades_visible(f) {
  for (let h = room['active_objects']['length']; h--;) {
    var g = room['active_objects'][h];
    'function' == typeof g['set_facades_visible'] && g['set_facades_visible'](f);
  }
}

function set_shafts_visible(f) {
  for (let g = room['active_objects']['length']; g--;)
    'Shaft' === room['active_objects'][g]['type'] && (room['active_objects'][g]['visible'] = f,
      room['active_objects'][g]['bpl_hidden'] = !f);
}

function check_overlap() {
  var f = d_objects;
  if (true !== global_options['check_intersections']) {
    for (let i = f.length; i--;)
      'function' == typeof f[i]['hide_wrong_box'] && f[i]['hide_wrong_box']();
  } else
    for (let j = f.length; j--;) {
      var g = f[j],
        h;
      if ('wall' != g['object_type'] && ('washer' != g['object_type'] && g['box'] && !custom_settings['new_drag'])) {
        g['box']['update']();
        let k = 0;
        for (let l = f.length; l--;) {
          1 != k && ('wall' != (h = f[l])['object_type'] && 'washer' != h['object_type'] && h['box'] && g['uuid'] !=
            h['uuid'] && (h['box']['update'](),
              1 == g['userData']['interaction']['check_intersection']) && 1 == h['userData']['interaction'][
              'check_intersection'
            ] && g['box']['clone']()['expandByScalar'](-0.1)['intersectsBox'](h['box']['clone']()['expandByScalar'](-
              0.1))) && (k = 1);
        }
        1 == k ? 'function' == typeof g['show_wrong_box'] && g['show_wrong_box']() : 'function' == typeof g[
          'hide_wrong_box'] && g['hide_wrong_box']();
      }
    }
}

function check_overlap_single(f) {
  if (1 == check_intersections) {
    var g = d_objects;
    if (f['box']?.['update'](),
      f?.['box']?.['clone']) {
      let i = 0;
      for (let j = g.length; j--;) {
        var h = g[j];
        f['uuid'] != h['uuid'] && 'wall' != h['object_type'] && h['box']?.['clone'] && h['size_box'] && (h['box']?.[
              'update'
            ](),
            f['box']['clone']()['expandByScalar'](-0.1)['intersectsBox'](h['box']['clone']()['expandByScalar'](-0.1))
            ) && (i = 1);
      }
      i;
    }
  }
}

function check_box_intersections(f, g = null) {
  clear_box_intersections(f);
  for (let m = 0; m < d_objects.length; m++) {
    var h = d_objects[m];
    if (h['visible'] && h !== g) {
      'wall' !== h['object_type'] && h['box']['update']();
      for (let p = m + 1; p < d_objects.length; p++) {
        var j = d_objects[p],
          j, k, l, j;
        j['visible'] && j !== g && ('wall' !== j['object_type'] && j['box']['update'](),
          h['box']['intersectsBox'](j['box']) && !(j = new THREE['Box3']()['copy'](h['box'])['intersect'](j['box']))[
            'isEmpty']() && (k = new THREE['Vector3'](),
            j['getSize'](k),
            1 < k['x'] && 1 < k['y'] && 1 < k['z']) && (l = new THREE['Vector3'](),
            j['getCenter'](l),
            (j = make_edges(k['x'], k['y'], k['z']))['position']['copy'](l),
            j['material']['depthTest'] = false,
            j['isIntersection'] = true,
            f['add'](j)));
      }
    }
  }
}

function clear_box_intersections(f) {
  let g = [];
  f['traverse'](i => {
    i['isIntersection'] && g.push(i);
  });
  for (var h of g)
    h['geometry']['dispose'](),
    h['material']['dispose'](),
    h['parent'] && h['parent']['remove'](h);
}

function convert_lib(f, g, h) {
  var j = copy_object(g);
  let k = Object['create'](null);
  f['categories_arr'] = copy_object(j['categories']),
    j['categories']['forEach'](function(p) {
      p['categories'] = [],
        p['items'] = [],
        k[p['id']] = p;
    }),
    f['categories'] = k,
    f['items_arr'] = j['items'],
    f['first_item'] = j['items'][0],
    f['items'] = get_hash(j['items']),
    f['items_0'] = [];
  for (let p = 0; p < j['items']['length']; p++)
    0 == j['items'][p]['category'] && f['items_0']['push'](j['items'][p]),
    h && (j['items'][p]['height'] = j['items'][p]['params']['variants'][0]['height']),
    j['items'][p]['category'] in k && (k[j['items'][p]['category']]['items'] || (k[j['items'][p]['category']][
        'items'] = []),
      k[j['items'][p]['category']]['items']['push'](j['items'][p]));
  var l = [];
  for (let q = 0; q < j['categories']['length']; q++)
    j['categories'][q]['id'] = j['categories'][q]['id'],
    j['categories'][q]['parent'] = Number(j['categories'][q]['parent']),
    j['categories'][q]['parent'] ? k[j['categories'][q]['parent']] && k[j['categories'][q]['parent']]['categories'][
      'push'
    ](k[j['categories'][q]['id']]) : l.push(k[j['categories'][q]['id']]);

  function m(r, u = null) {
    for (let v = 0; v < r.length; v++)
      r[v]['path'] = u ? copy_object(u) : [],
      r[v]['path']['push']({
        'name': r[v]['name'],
        'id': r[v]['id']
      }),
      r[v]['categories'] && m(r[v]['categories'], r[v]['path']);
  }
  m(l),
    f['tree'] = l;
}

function convert_lib_multi_cat(f, g, h) {
  var j = copy_object(g);
  let k = Object['create'](null);
  f['categories_arr'] = copy_object(j['categories']),
    j['categories']['forEach'](function(p) {
      p['categories'] = [],
        p['items'] = [],
        k[p['id']] = p;
    }),
    f['categories'] = k,
    f['items_arr'] = j['items'];
  var g = copy_object(f['items'][0]);
  f['first_item'] = j['items'][0],
    f['items'] = get_hash(j['items']),
    f['items_0'] = [],
    f['items'][0] = g;
  for (let p = 0; p < j['items']['length']; p++) {
    h && (j['items'][p]['height'] = j['items'][p]['params']['variants'][0]['height']);
    var l = j['items'][p];
    Array.isArray(l['category']) || (l['category'] = [l['category']]),
      l['category']['length'] || f['items_0']['push'](j['items'][p]);
    for (let q = 0; q < l['category']['length']; q++)
      l['category'][q] in k && (k[l['category'][q]]['items'] || (k[l['category'][q]]['items'] = []),
        k[l['category'][q]]['items']['push'](l));
  }
  var m = [];
  for (let r = 0; r < j['categories']['length']; r++)
    j['categories'][r]['parent'] && 0 != j['categories'][r]['parent'] ? k[j['categories'][r]['parent']] && k[j[
      'categories'][r]['parent']]['categories']['push'](k[j['categories'][r]['id']]) : m.push(k[j['categories'][r][
      'id'
    ]]);
  f['tree'] = m;
}

function getBase64FromImageUrl(f) {
  var g = new Image();
  return g['setAttribute']('crossOrigin', 'anonymous'),
    g['src'] = f,
    new Promise(function(h, i) {
      g['onload'] = function() {
          var j = document['createElement']('canvas');
          j['width'] = this['width'],
            j['height'] = this['height'];
          var k, j = (j['getContext']('2d')['drawImage'](this, 0, 0),
            j['toDataURL']('image/png'));
          h(j);
        },
        g['onerror'] = function() {
          h(null);
        };
    });
}
async function get_async(f) {
  var g, h;
  return await getBase64FromImageUrl(f);
}

function get_img_width(f) {
  var g = new Image();
  return g['setAttribute']('crossOrigin', 'anonymous'),
    g['src'] = f,
    new Promise(function(h, i) {
      g['onload'] = function() {
        h({
          'width': this['width'],
          'height': this['height']
        });
      };
    });
}
async function create_xl(a0, a1) {
  await check_xls_lib();
  var a2 = get_modules(),
    a3 = ((workbook = new ExcelJS['Workbook']())['creator'] = 'test',
      workbook['lastModifiedBy'] = 'test',
      workbook['created'] = new Date(),
      workbook['modified'] = new Date(),
      sc['get_specs'](true)),
    a4 = {
      'size': 13,
      'bold': true
    },
    a5 = {
      'size': 12,
      'bold': true
    },
    a6 = {
      'size': 11,
      'bold': true
    },
    a7 = {
      'size': 11,
      'bold': false,
      'italic': true
    },
    a8 = workbook['addWorksheet']('Информация\x20о\x20модулях'),
    a9 = (a8['addRow']([]),
      a8['addRow']([lang['general_information']])['font'] = a5,
      a8['addRow']([]),
      null == custom_settings['info_show_price'] || custom_settings['info_show_price']),
    aa = null == constructor_settings['specs_icons'] || constructor_settings['specs_icons'],
    ab, ac, a3, a1, ad, a3, a1, ad, a3, a1, ad, a3, a1, ad, a3, a1, ad, a3, a1, ad, a3, a1, ad, a3, a1, ad;
  for ([ab, ac] of Object['entries'](a3['sum'] || {})) {
    if ('wall' == ab) {
      a8['addRow']([lang['wall_header']])['font'] = a6;
      var af = [lang['material'], lang['title'], lang['code'], lang['sizes'], lang['count_short'], lang['units_of']],
        ag, ah;
      a9 && af.push(lang['price']),
        a8['addRow'](af);
      for ([ag, ah] of Object['entries'](ac)) {
        var ai = [];
        ai.push(ah['key_name'], ah['variant_name'] || ah['material_name'], ah['variant_code'] || ah[
              'material_code'], ah['width'] + 'x' + ah['height'] + '\x20мм', round_decimals_2(ah['total_count']),
            lang['units_' + ah['price_type']]),
          a9 && ai.push(round_decimals_2(ah['total_price'])),
          a8['addRow'](ai);
      }
      a8['addRow']([]);
    }
    if ('butts' == ab) {
      a8['addRow']([lang['edge']])['font'] = a6;
      var af = [lang['title'], lang['code'], lang['thickness'], lang['width'], lang['count_short'], lang['units_of']],
        aj, ak;
      a9 && af.push(lang['price']),
        a8['addRow'](af);
      for ([aj, ak] of Object['entries'](ac)) {
        var al = [];
        al.push(ak['name'], ak['code'], ak['thickness'] + '\x20мм', ak['height'] + '\x20мм', round_decimals_2(ak[
            'total_count']), lang['units_' + ak['price_type']]),
          a9 && al.push(round_decimals_2(ak['total_price'])),
          a8['addRow'](al);
      }
      a8['addRow']([]);
    }
    if ('butts_facade' == ab) {
      a8['addRow']([lang['facades_edge']])['font'] = a6;
      var am = [lang['material'], lang['facade'], lang['count_short'], lang['units_of']],
        an, ao;
      a9 && am.push(lang['price']),
        a8['addRow'](am);
      for ([an, ao] of Object['entries'](ac)) {
        var ap = [];
        ap.push(ao['mat_name'], ao['facade_name'], round_decimals_2(ao['total_count']), lang['units_' + ao[
            'price_type']]),
          a9 && ap.push(round_decimals_2(ao['total_price'])),
          a8['addRow'](ap);
      }
      a8['addRow']([]);
    }
    if ('facade' == ab) {
      a8['addRow']([lang['facades']])['font'] = a6;
      var am = [lang['material'], lang['title'], lang['code'], lang['sizes'], lang['count_short'], lang['units_of']],
        aq, ar;
      a9 && am.push(lang['price']),
        a8['addRow'](am);
      for ([aq, ar] of Object['entries'](ac)) {
        var as = [];
        as.push(ar['mat_name'], ar['name'], ar['code'], ar['show_size'] ? round_decimals_2(ar['size']['x']) + 'x' +
            round_decimals_2(ar['size']['y']) + '\x20мм' : '', round_decimals_2(ar['total_count']), lang['units_' +
              ar['price_type']]),
          a9 && as.push(round_decimals_2(ar['total_price'])),
          a8['addRow'](as);
      }
      a8['addRow']([]);
    }
    if ('tabletop' == ab) {
      a8['addRow']([lang['tabletop']])['font'] = a6;
      var at = [lang['title'], lang['code'], lang['sizes'], lang['common_sizes'], lang['count_short'], lang[
          'units_of']],
        au, av;
      a9 && at.push(lang['price']),
        a8['addRow'](at);
      for ([au, av] of Object['entries'](ac)) {
        var aw = [];
        aw.push(av['name'], av['code'], av['width'] + 'x' + av['height'] + '\x20мм', 'm' === av['price_type'] ||
            'm2' === av['price_type'] ? round_decimals_2(av['total_width']) + '\x20' + lang['units_' + av[
              'price_type']] : round_decimals_2(av['total_width_m']) + '\x20' + lang['units_m'], round_decimals_2(av[
              'total_count']), lang['units_' + av['price_type']]),
          a9 && aw.push(round_decimals_2(av['total_price'])),
          a8['addRow'](aw);
      }
      a8['addRow']([]);
    }
    if ('bort' == ab) {
      a8['addRow']([lang['tabletop_plints']])['font'] = a6;
      var at = [lang['title'], lang['code'], lang['sizes'], lang['common_sizes'], lang['count_short'], lang[
          'units_of']],
        ax, ay;
      a9 && at.push(lang['price']),
        a8['addRow'](at);
      for ([ax, ay] of Object['entries'](ac)) {
        var az = [];
        az.push(ay['name'], ay['code'], ay['width'] + 'x' + ay['height'] + '\x20мм', 'm' === ay['price_type'] ||
            'm2' === ay['price_type'] ? round_decimals_2(ay['total_width']) + '\x20' + lang['units_' + ay[
              'price_type']] : round_decimals_2(ay['total_width_m']) + '\x20' + lang['units_m'], round_decimals_2(ay[
              'total_count']), lang['units_' + ay['price_type']]),
          a9 && az.push(round_decimals_2(ay['total_price'])),
          a8['addRow'](az);
      }
      a8['addRow']([]);
    }
    if ('cokol' == ab) {
      a8['addRow']([lang['cokol']])['font'] = a6;
      var aA = [lang['title'], lang['code'], lang['sizes'], lang['common_sizes'], lang['count_short'], lang[
          'units_of']],
        aB, aC;
      a9 && aA.push(lang['price']),
        a8['addRow'](aA);
      for ([aB, aC] of Object['entries'](ac)) {
        var aD = [];
        aD.push(aC['name'], aC['code'], aC['width'] + 'x' + aC['height'] + '\x20мм', 'm' === aC['price_type'] ||
            'm2' === aC['price_type'] ? round_decimals_2(aC['total_width']) + '\x20' + lang['units_' + aC[
              'price_type']] : round_decimals_2(aC['total_width_m']) + '\x20' + lang['units_m'], round_decimals_2(aC[
              'total_count']), lang['units_' + aC['price_type']]),
          a9 && aD.push(round_decimals_2(aC['total_price'])),
          a8['addRow'](aD);
      }
      a8['addRow']([]);
    }
    if ('cokol_top' == ab) {
      a8['addRow']([lang['cokol_top']])['font'] = a6;
      var aA = [lang['title'], lang['code'], lang['sizes'], lang['common_sizes'], lang['count_short'], lang[
          'units_of']],
        aE, aF;
      a9 && aA.push(lang['price']),
        a8['addRow'](aA);
      for ([aE, aF] of Object['entries'](ac)) {
        var aG = [];
        aG.push(aF['name'], aF['code'], aF['width'] + 'x' + aF['height'] + '\x20мм', 'm' === aF['price_type'] ||
            'm2' === aF['price_type'] ? round_decimals_2(aF['total_width']) + '\x20' + lang['units_' + aF[
              'price_type']] : round_decimals_2(aF['total_width_m']) + '\x20' + lang['units_m'], round_decimals_2(aF[
              'total_count']), lang['units_' + aF['price_type']]),
          a9 && aG.push(round_decimals_2(aF['total_price'])),
          a8['addRow'](aG);
      }
      a8['addRow']([]);
    }
    if ('cornice' == ab) {
      a8['addRow']([lang['cornice']])['font'] = a6;
      var aH = [lang['title'], lang['code'], lang['common_sizes'], lang['cornice_width'], lang['count_short'], lang[
          'units_of']],
        aI, aJ;
      a9 && aH.push(lang['price']),
        a8['addRow'](aH);
      for ([aI, aJ] of Object['entries'](ac)) {
        var aK = [];
        aK.push(aJ['name'], aJ['code'], aJ['total_width'] + '\x20м', aJ['width'] + '\x20м', round_decimals_2(aJ[
            'total_count']), lang['units_' + aJ['price_type']]),
          a9 && aK.push(round_decimals_2(aJ['total_price'])),
          a8['addRow'](aK);
      }
      a8['addRow']([]);
    }
    if ('item' == ab) {
      a8['addRow']([lang['accessories_furniture']])['font'] = a6;
      var aH = [lang['title'], lang['code'], lang['count_short'], lang['units_of']],
        aL, aM;
      a9 && aH.push(lang['price']),
        a8['addRow'](aH);
      for ([aL, aM] of Object['entries'](ac)) {
        var aN = [];
        aN.push(aM['name'], aM['code'], round_decimals_2(aM['total_count']), lang['units_' + aM['price_type']]),
          a9 && aN.push(round_decimals_2(aM['total_price'])),
          a8['addRow'](aN);
      }
      a8['addRow']([]);
    }
    if ('module' == ab && Object['values'](ac)['find'](bA => bA['is_root'] && bA['price'])) {
      a8['addRow']([lang['module']])['font'] = a6;
      var aO = [lang['title'], lang['code'], lang['count_short']],
        aP, aQ, aR;
      a9 && aO.push(lang['price']),
        a8['addRow'](aO);
      for ([aP, aQ] of Object['entries'](ac)) {
        aQ['is_root'] && aQ['price'] && ((aR = [])['push'](aQ['name'], aQ['code'], round_decimals_2(aQ[
            'total_count'])),
          a9 && aR.push(round_decimals_2(aQ['total_price'])),
          a8['addRow'](aR));
      }
      a8['addRow']([]);
    }
  }
  if (a9 && 'object' !== a3['mode'] && (a8['addRow'](['', '', '', '', '', lang['total_cost_project'] + ':\x20',
      round_decimals_2(a3['total_price'])
    ])['font'] = a7),
    a8['addRow']([]),
    'object' !== a3['mode']) {
    for (var [aS, aT] of Object['entries'](a3['all']['module'] || {}))
      if (aT['is_root']) {
        var aU = a9 && aT['show_price'],
          aV, aW, aV, aX, aY;
        if (void 0 !== aT?.['ctx']?.['sum']) {
          a8['addRow']([lang['module'] + ':' + aT['name']])['font'] = a5,
            aa && aT['icon'] && '' !== aT['icon'] && (aV = await convert_image_to_base64(aT['icon']),
              aW = await get_img_width(aT['icon']),
              aV = workbook['addImage']({
                'base64': aV,
                'extension': 'jpg'
              }),
              a8['addImage'](aV, {
                'tl': {
                  'col': 8,
                  'row': a8['lastRow']['_number'] - 1
                },
                'ext': {
                  'width': 100,
                  'height': 100 / (aW['width'] / aW['height'])
                }
              }));
          for ([aX, aY] of Object['entries'](aT['ctx']?.['sum'] || {})) {
            if ('wall' == aX) {
              a8['addRow']([lang['wall_header']])['font'] = a6;
              var aZ = [lang['material'], lang['title'], lang['code'], lang['sizes'], lang['count_short'], lang[
                  'units_of']],
                b0, b1;
              aU && aZ.push(lang['price']),
                a8['addRow'](aZ);
              for ([b0, b1] of Object['entries'](aY)) {
                var b2 = [];
                b2.push(b1['key_name'], b1['variant_name'] || b1['material_name'], b1['variant_code'] || b1[
                    'material_code'], b1['width'] + 'x' + b1['height'] + '\x20мм', round_decimals_2(b1[
                    'total_count']), lang['units_' + b1['price_type']]),
                  aU && b2.push(round_decimals_2(b1['total_price'])),
                  a8['addRow'](b2);
              }
              a8['addRow']([]);
            }
            if ('butts' == aX) {
              a8['addRow']([lang['edge']])['font'] = a6;
              var aZ = [lang['title'], lang['code'], lang['thickness'], lang['width'], lang['count_short'], lang[
                  'units_of']],
                b3, b4;
              aU && aZ.push(lang['price']),
                a8['addRow'](aZ);
              for ([b3, b4] of Object['entries'](aY)) {
                var b5 = [];
                b5.push(b4['name'], b4['code'], b4['thickness'] + '\x20мм', b4['height'] + '\x20мм',
                    round_decimals_2(b4['total_count']), lang['units_' + b4['price_type']]),
                  aU && b5.push(round_decimals_2(b4['total_price'])),
                  a8['addRow'](b5);
              }
              a8['addRow']([]);
            }
            if ('butts_facade' == aX) {
              a8['addRow']([lang['facades_edge']])['font'] = a6;
              var b6 = [lang['material'], lang['facade'], lang['count_short'], lang['units_of']],
                b7, b8;
              aU && b6.push(lang['price']),
                a8['addRow'](b6);
              for ([b7, b8] of Object['entries'](aY)) {
                var b9 = [];
                b9.push(b8['mat_name'], b8['facade_name'], round_decimals_2(b8['total_count']), lang['units_' + b8[
                    'price_type']]),
                  aU && b9.push(round_decimals_2(b8['total_price'])),
                  a8['addRow'](b9);
              }
              a8['addRow']([]);
            }
            if ('facade' == aX) {
              a8['addRow']([lang['facades']])['font'] = a6;
              var b6 = [lang['material'], lang['title'], lang['code'], lang['sizes'], lang['count_short'], lang[
                  'units_of']],
                ba, bb;
              aU && b6.push(lang['price']),
                a8['addRow'](b6);
              for ([ba, bb] of Object['entries'](aY)) {
                var bc = [];
                bc.push(bb['mat_name'], bb['name'], bb['code'], bb['show_size'] ? round_decimals_2(bb['size'][
                    'x']) + 'x' + round_decimals_2(bb['size']['y']) + '\x20мм' : '', round_decimals_2(bb[
                      'total_count']), lang['units_' + bb['price_type']]),
                  aU && bc.push(round_decimals_2(bb['total_price'])),
                  a8['addRow'](bc);
              }
              a8['addRow']([]);
            }
            if ('tabletop' == aX) {
              a8['addRow']([lang['tabletop']])['font'] = a6;
              var bd = [lang['title'], lang['code'], lang['sizes'], lang['common_sizes'], lang['count_short'], lang[
                  'units_of']],
                bf, bg;
              aU && bd.push(lang['price']),
                a8['addRow'](bd);
              for ([bf, bg] of Object['entries'](aY)) {
                var bh = [];
                bh.push(bg['name'], bg['code'], bg['width'] + 'x' + bg['height'] + '\x20мм', 'm' === bg[
                      'price_type'] || 'm2' === bg['price_type'] ? round_decimals_2(bg['total_width']) + '\x20' +
                    lang['units_' + bg['price_type']] : round_decimals_2(bg['total_width_m']) + '\x20' + lang[
                      'units_m'], round_decimals_2(bg['total_count']), lang['units_' + bg['price_type']]),
                  aU && bh.push(round_decimals_2(bg['total_price'])),
                  a8['addRow'](bh);
              }
              a8['addRow']([]);
            }
            if ('bort' == aX) {
              a8['addRow']([lang['tabletop_plints']])['font'] = a6;
              var bd = [lang['title'], lang['code'], lang['sizes'], lang['common_sizes'], lang['count_short'], lang[
                  'units_of']],
                bi, bj;
              aU && bd.push(lang['price']),
                a8['addRow'](bd);
              for ([bi, bj] of Object['entries'](aY)) {
                var bk = [];
                bk.push(bj['name'], bj['code'], bj['width'] + 'x' + bj['height'] + '\x20мм', 'm' === bj[
                      'price_type'] || 'm2' === bj['price_type'] ? round_decimals_2(bj['total_width']) + '\x20' +
                    lang['units_' + bj['price_type']] : round_decimals_2(bj['total_width_m']) + '\x20' + lang[
                      'units_m'], round_decimals_2(bj['total_count']), lang['units_' + bj['price_type']]),
                  aU && bk.push(round_decimals_2(bj['total_price'])),
                  a8['addRow'](bk);
              }
              a8['addRow']([]);
            }
            if ('cokol' == aX) {
              a8['addRow']([lang['cokol']])['font'] = a6;
              var bl = [lang['title'], lang['code'], lang['sizes'], lang['common_sizes'], lang['count_short'], lang[
                  'units_of']],
                bm, bn;
              aU && bl.push(lang['price']),
                a8['addRow'](bl);
              for ([bm, bn] of Object['entries'](aY)) {
                var bo = [];
                bo.push(bn['name'], bn['code'], bn['width'] + 'x' + bn['height'] + '\x20мм', 'm' === bn[
                      'price_type'] || 'm2' === bn['price_type'] ? round_decimals_2(bn['total_width']) + '\x20' +
                    lang['units_' + bn['price_type']] : round_decimals_2(bn['total_width_m']) + '\x20' + lang[
                      'units_m'], round_decimals_2(bn['total_count']), lang['units_' + bn['price_type']]),
                  aU && bo.push(round_decimals_2(bn['total_price'])),
                  a8['addRow'](bo);
              }
              a8['addRow']([]);
            }
            if ('cokol_top' == aX) {
              a8['addRow']([lang['cokol_top']])['font'] = a6;
              var bl = [lang['title'], lang['code'], lang['sizes'], lang['common_sizes'], lang['count_short'], lang[
                  'units_of']],
                bp, bq;
              aU && bl.push(lang['price']),
                a8['addRow'](bl);
              for ([bp, bq] of Object['entries'](aY)) {
                var br = [];
                br.push(bq['name'], bq['code'], bq['width'] + 'x' + bq['height'] + '\x20мм', 'm' === bq[
                      'price_type'] || 'm2' === bq['price_type'] ? round_decimals_2(bq['total_width']) + '\x20' +
                    lang['units_' + bq['price_type']] : round_decimals_2(bq['total_width_m']) + '\x20' + lang[
                      'units_m'], round_decimals_2(bq['total_count']), lang['units_' + bq['price_type']]),
                  aU && br.push(round_decimals_2(bq['total_price'])),
                  a8['addRow'](br);
              }
              a8['addRow']([]);
            }
            if ('cornice' == aX) {
              a8['addRow']([lang['cornice']])['font'] = a6;
              var bs = [lang['title'], lang['code'], lang['common_sizes'], lang['cornice_width'], lang['count_short'],
                  lang['units_of']
                ],
                bt, bu;
              aU && bs.push(lang['price']),
                a8['addRow'](bs);
              for ([bt, bu] of Object['entries'](aY)) {
                var bv = [];
                bv.push(bu['name'], bu['code'], bu['total_width'] + '\x20м', bu['width'] + '\x20м',
                    round_decimals_2(bu['total_count']), lang['units_' + bu['price_type']]),
                  aU && bv.push(round_decimals_2(bu['total_price'])),
                  a8['addRow'](bv);
              }
              a8['addRow']([]);
            }
            if ('item' == aX) {
              a8['addRow']([lang['accessories_furniture']])['font'] = a6;
              var bs = [lang['title'], lang['code'], lang['count_short'], lang['units_of']],
                bw, bx;
              aU && bs.push(lang['price']),
                a8['addRow'](bs);
              for ([bw, bx] of Object['entries'](aY)) {
                var by = [];
                by.push(bx['name'], bx['code'], round_decimals_2(bx['total_count']), lang['units_' + bx[
                    'price_type']]),
                  aU && by.push(round_decimals_2(bx['total_price'])),
                  a8['addRow'](by);
              }
              a8['addRow']([]);
            }
          }
          aU && (a8['addRow'](['', '', '', '', '', lang['price_module'] + ':\x20', round_decimals_2(aT['price'])])[
              'font'] = a7),
            a8['addRow']([]),
            a8['addRow']([]);
        }
      }
  }
  let bz;
  if ((bz = a1 || get_images())['common_view'] && (a3 = workbook['addWorksheet']('Общий\x20вид'),
      a1 = workbook['addImage']({
        'base64': bz['common_view'],
        'extension': 'jpg'
      }),
      ad = await get_img_width(bz['common_view']),
      a3['addImage'](a1, {
        'tl': {
          'col': 0,
          'row': 0
        },
        'ext': {
          'width': ad['width'],
          'height': ad['height']
        }
      })),
    bz['edges_view'] && (a3 = workbook['addWorksheet']('Вид\x20по\x20контору'),
      a1 = workbook['addImage']({
        'base64': bz['edges_view'],
        'extension': 'jpg'
      }),
      ad = await get_img_width(bz['edges_view']),
      a3['addImage'](a1, {
        'tl': {
          'col': 0,
          'row': 0
        },
        'ext': {
          'width': ad['width'],
          'height': ad['height']
        }
      })),
    bz['comms_only_view'] && (a3 = workbook['addWorksheet']('Вид\x20коммуникаций'),
      a1 = workbook['addImage']({
        'base64': bz['comms_only_view'],
        'extension': 'jpg'
      }),
      ad = await get_img_width(bz['comms_only_view']),
      a3['addImage'](a1, {
        'tl': {
          'col': 0,
          'row': 0
        },
        'ext': {
          'width': ad['width'],
          'height': ad['height']
        }
      })),
    bz['top_view'] && (a3 = workbook['addWorksheet']('Вид\x20сверху'),
      a1 = workbook['addImage']({
        'base64': bz['top_view'],
        'extension': 'jpg'
      }),
      ad = await get_img_width(bz['top_view']),
      a3['addImage'](a1, {
        'tl': {
          'col': 0,
          'row': 0
        },
        'ext': {
          'width': ad['width'],
          'height': ad['height']
        }
      })),
    bz['front_view'] && (a3 = workbook['addWorksheet']('Стена\x201'),
      a1 = workbook['addImage']({
        'base64': bz['front_view'],
        'extension': 'jpg'
      }),
      ad = await get_img_width(bz['front_view']),
      a3['addImage'](a1, {
        'tl': {
          'col': 0,
          'row': 0
        },
        'ext': {
          'width': ad['width'],
          'height': ad['height']
        }
      })),
    bz['right_view'] && (a3 = workbook['addWorksheet']('Стена\x202'),
      a1 = workbook['addImage']({
        'base64': bz['right_view'],
        'extension': 'jpg'
      }),
      ad = await get_img_width(bz['right_view']),
      a3['addImage'](a1, {
        'tl': {
          'col': 0,
          'row': 0
        },
        'ext': {
          'width': ad['width'],
          'height': ad['height']
        }
      })),
    bz['back_view'] && (a3 = workbook['addWorksheet']('Стена\x203'),
      a1 = workbook['addImage']({
        'base64': bz['back_view'],
        'extension': 'jpg'
      }),
      ad = await get_img_width(bz['back_view']),
      a3['addImage'](a1, {
        'tl': {
          'col': 0,
          'row': 0
        },
        'ext': {
          'width': ad['width'],
          'height': ad['height']
        }
      })),
    bz['left_view'] && (a3 = workbook['addWorksheet']('Стена\x204'),
      a1 = workbook['addImage']({
        'base64': bz['left_view'],
        'extension': 'jpg'
      }),
      ad = await get_img_width(bz['left_view']),
      a3['addImage'](a1, {
        'tl': {
          'col': 0,
          'row': 0
        },
        'ext': {
          'width': ad['width'],
          'height': ad['height']
        }
      })),
    a0)
    return workbook['xlsx']['writeBuffer']();
  workbook['xlsx']['writeBuffer']()['then'](function(bA) {
    var bA = new Blob([bA], {
        'type': 'application/xlsx'
      }),
      bA = window['URL']['createObjectURL'](bA),
      bB = document['createElement']('a');
    bB['href'] = bA,
      bB['download'] = 'planplace.xlsx',
      document['body']['appendChild'](bB),
      bB['click']();
  });
}
async function export_csv_Asai_Cut(q, A) {
  await check_xls_lib();
  var B = [],
    C = 'Наименование\x20материала,\x20Толщина\x20детали,Позиция\x20детали,\x20Наименование\x20детали,',
    F;
  B.push((C = (C = C +
      'Количество,\x20Готовая\x20деталь\x20[L],\x20Готовая\x20деталь\x20[W],\x20Наименование\x20изделия,\x20Заказ,' +
      'Толщина\x20облицовки\x20кромки\x20[L1],\x20Толщина\x20облицовки\x20кромки\x20[L2],\x20Толщина\x20облицовки\x20кромки\x20[W1],\x20Толщина\x20облицовки\x20кромки\x20[W2],'
      ) +
    'Обозначение\x20облицовки\x20кромки\x20[L1],\x20Обозначение\x20облицовки\x20кромки\x20[L2],\x20Обозначение\x20облицовки\x20кромки\x20[W1],\x20Обозначение\x20облицовки\x20кромки\x20[W2],' +
    'Ориентация,\x20Код\x20детали,\x20Количество\x20отверстий')['replace'](/,\s+/g, ',')['split'](','));
  let G = 1;
  for (F of d_objects)
    if (F instanceof Module) {
      var H = F['name'],
        I = F['userData']['params']?.['spec']?.['catalog_type'] || '',
        J;
      for (J of F['userData']['parts']['wall']) {
        var K = J['userData']['computed']?.['material']?.['variant_id'],
          L = J['userData']['params']['spec']?.['material']?.['rotated'];
        let ag = J['userData']['computed']['material']?.['mat_params']?.['params']?.['map'];
        var N = J['userData']['computed']['material']['thickness'];
        let ah = J['userData']['computed']['material']['mat_item']['category'][0];
        var P = J['userData']['computed']['material']['id'];
        let ai = J['userData']['computed']['material']['key'];
        var Q = pp['libs']['materials_info']['keys']['filter'](ao => ao['key'] == ai)[0]['name'];
        let aj = 'Неизвестная\x20категория';
        ah && (aj = pp['libs']['materials_by_key'][ai]['categories']['find'](ao => ao['id'] == ah)?.['name'] ||
          'Неизвестное\x20имя');
        var P = pp['libs']['materials'][ai]['get_item'](P),
          U = P['params']['variants'][K],
          K = J['userData']['params']['spec']['butts'],
          W = J['userData']['butt_objects'],
          Z = (ag = '' == ag || null === ag ? '0' : L ? '1' : '2', {
            'butts_l1': '',
            'butts_l2': '',
            'butts_w1': '',
            'butts_w2': ''
          }),
          a0 = {
            'butts_l1': '',
            'butts_l2': '',
            'butts_w1': '',
            'butts_w2': ''
          };
        let ak = 'x',
          al = 'y',
          am = 'l',
          an = 'w';
        var a1 = '1',
          a2 = '1',
          a3 = '2',
          a4 = '2',
          L = (L && ([ak, al] = [al, ak],
              [am, an] = [an, am]),
            J['userData']['computed']['size_without_butts'][al]),
          a5 = J['userData']['computed']['size_without_butts'][ak],
          a6 = J['userData']['computed']['real_size'][al],
          a7 = J['userData']['computed']['real_size'][ak],
          a8, a9 = ([L, a5, a6, a7] = ((...ao) => ao.map(ap => isNaN(Number(ap)) ? 0 : Number(ap) % 1 == 0 ?
              Number(ap)['toFixed'](0) : Number(ap)['toFixed'](1)))(L, a5, a6, a7),
            (ao, ap) => {
              let aq = '';
              return ao.forEach(ar => {
                  ar['userData']['params']['spec']['face_index'] == ap && (aq = pp['libs']['butts']['butts'][
                    'get_item'
                  ](ar['userData']['params']['spec']['id'])['params']['variants'][ar['userData']['params'][
                    'spec'
                  ]['variant_id']]['code']);
                }),
                aq;
            }
          );
        if (0 < K.length) {
          for (var aa of K)
            switch (aa['face_index']) {
              case 0:
                Z['butts_' + an + a1] = aa['thickness'],
                  a0['butts_' + an + a1] = a9(W, aa['face_index']);
                break;
              case 1:
                Z['butts_' + am + a2] = aa['thickness'],
                  a0['butts_' + am + a2] = a9(W, aa['face_index']);
                break;
              case 2:
                Z['butts_' + an + a3] = aa['thickness'],
                  a0['butts_' + an + a3] = a9(W, aa['face_index']);
                break;
              case 3:
                Z['butts_' + am + a4] = aa['thickness'],
                  a0['butts_' + am + a4] = a9(W, aa['face_index']);
                break;
            }
        }
        B.push([Q + (',\x20' + N + '\x20мм,\x20' + P['name'] + ',\x20' + P['code'] + ',\x20') + aj, '' + N, '' + G,
            '' + J['name'], '', '' + a6, '' + a7, '' + H, '' + I, '' + Z['butts_l1'], '' + Z['butts_l2'], '' + Z[
              'butts_w1'], '' + Z['butts_w2'], '' + a0['butts_l1'], '' + a0['butts_l2'], '' + a0['butts_w1'], '' +
            a0['butts_w2'], '' + ag, '' + J['id'], ''
          ]),
          G++;
      }
    }
  var ab = B['reduce']((ao, ap) => {
      var ap = JSON['stringify'](ap);
      return ao[ap] = (ao[ap] || 0) + 1,
        ao;
    }, {}),
    ac = B[0]['indexOf']('Количество'),
    ad;
  for (ad of B) {
    var ae = B['indexOf'](ad);
    0 !== ae && (B[ae][ac] = String(ab[JSON['stringify'](B[ae])]));
  }
  var C = new Blob(['\ufeff' + B.map(ao => ao['join'](';'))['join']('\x0a')], {
      'type': 'text/csv;charset=utf-8'
    }),
    C = window['URL']['createObjectURL'](C),
    af = document['createElement']('a');
  af['href'] = C,
    af['download'] = 'planplace.csv',
    document['body']['appendChild'](af),
    af['click'](),
    document['body']['removeChild'](af),
    window['URL']['revokeObjectURL'](C);
}
async function check_xls_lib() {
  var f;
  return 'object' == typeof ExcelJS || document['getElementById']('xljs') || ((f = document['createElement'](
        'script'))['id'] = 'xljs',
      f['src'] = '/common_assets/libs/exceljs.min.js',
      document['head']['append'](f)),
    new Promise(function(g, h) {
      let i = setInterval(function() {
        'object' == typeof ExcelJS && (clearInterval(i),
          g(true));
      }, 100);
    });
}

function downlad_url(f, g) {
  var h = document['createElement']('a');
  h['download'] = g,
    h['href'] = f,
    document['body']['appendChild'](h),
    h['click'](),
    document['body']['removeChild'](h);
}

function load_exact_model(e) {
  return new Promise(function(f, g) {
    fbx_loader['load'](e, function(h) {
      f(h);
    });
  });
}

function promise_request(f) {
  var g = new XMLHttpRequest();
  return g['open']('GET', f, true),
    g['send'](),
    new Promise(function(h, i) {
      g['onreadystatechange'] = function(j) {
        var k;
        4 == g['readyState'] && 200 == g['status'] ? (k = JSON['parse'](g['responseText']),
          h(k)) : 4 == g['readyState'] && i(g);
      };
    });
}

function promise_request_blob(f) {
  var g = new XMLHttpRequest();
  return g['responseType'] = 'blob',
    g['open']('GET', f, true),
    g['send'](),
    new Promise(function(h, i) {
      g['onreadystatechange'] = function(j) {
        4 == g['readyState'] && 200 == g['status'] ? h(g) : 4 == g['readyState'] && i(g);
      };
    });
}

function promise_post_raw(f, g) {
  let h = new XMLHttpRequest();
  return h['open']('POST', f),
    h['send'](g),
    new Promise(function(i, j) {
      h['onreadystatechange'] = function(k) {
        4 == h['readyState'] && i(h);
      };
    });
}

function promise_post(f, g) {
  let h = new XMLHttpRequest();
  return h['open']('POST', f),
    h['send'](g),
    new Promise(function(i, j) {
      h['onreadystatechange'] = function(k) {
        var l;
        4 == h['readyState'] && 200 == h['status'] ? (l = JSON['parse'](h['responseText']),
          i(l)) : 4 == h['readyState'] && j(h);
      };
    });
}

function get_suit_model(f, g, h, j = false) {
  var k = [],
    m = [],
    p = f['items'];
  for (let w = 0; w < p.length; w++)
    k.push(p[w]['height']),
    m.push(p[w]['width']);
  var q = closest_facade(parseInt(h), k),
    u = closest_facade(g, m);
  let v = 'no_model';
  if (f['radius']) {
    for (let x = 0; x < p.length; x++)
      Math['abs'](h - q) < 5 && (v = j ? p[x] : p[x]['model']);
  } else {
    for (let y = 0; y < p.length; y++)
      1 == f['vheight'] ? p[y]['width'] == u && (v = j ? p[y] : p[y]['model']) : Math['abs'](g - u) < 5 && Math[
        'abs'](h - q) < 5 && p[y]['height'] == q && p[y]['width'] == u && (v = j ? p[y] : p[y]['model']);
  }
  return v;
}

function closest_facade(f, g) {
  return g['reduce']((h, i) => {
    var j = Math['abs'](h - f),
      k = Math['abs'](i - f);
    return j == k ? i < h ? h : i : k < j ? i : h;
  });
}

function deg2rad(f) {
  return f * Math['PI'] / 180;
}

function rad2deg(f) {
  return f / Math['PI'] * 180;
}

function cl(f, g) {
  f = f || '!!!!!!!';
}

function ce(f, g) {
  f = f || '!!!!!!!';
}

function format_price(f) {
  return parseFloat(f)['toLocaleString'](void 0, {
    'minimumFractionDigits': 2,
    'maximumFractionDigits': 2
  }) + '\x20' + lang['currency'];
}

function correct_price(f) {
  return f += '',
    parseFloat(f.replace(',', '.'));
}

function get_module_with_obj_id(f) {
  for (let g = d_objects.length; g--;) {
    let h;
    if (d_objects[g]['userData']['params'])
      h = d_objects[g]['userData']['params'];
    else {
      if (!d_objects[g]['params'])
        continue;
      h = d_objects[g]['params'];
    }
    if (h['obj_id'] && f == h['obj_id'])
      return d_objects[g];
  }
}

function get_desc_arr(f, g, h, j) {
  var k = {},
    l = {
      'thickness': '',
      'parent_category_name': '',
      'category_name': '',
      'name': '',
      'code': '',
      'pm': '',
      'm2': '',
      'per': ''
    };
  return j && (l['thickness'] = ',\x20' + j + lang['mm']),
    f['mat_data'] && (f['mat_data']['parent_category_name'] && (l['parent_category_name'] = f['mat_data'][
        'parent_category_name'
      ] += '\x20'),
      f['mat_data']['category_name'] && (l['category_name'] = f['mat_data']['category_name'] += '\x20'),
      f['mat_data']['name'] && (l['name'] = f['mat_data']['name'] += '\x20'),
      f['mat_data']['code'] && (l['code'] = f['mat_data']['code'] += '\x20'),
      f['pm'] && (l['pm'] = f['pm']),
      f['m2'] && (l['m2'] = f['m2']),
      f['per']) && (f['per'] = f['per'] / 1000),
    k['name'] = (l['parent_category_name'] + l['category_name'] + l['name'] + l['code'])['trim']() + l['thickness'],
    k['code'] = l['code'],
    k['m2'] = f['m2'],
    k['pm'] = f['pm'],
    k['per'] = f['per'],
    k['price'] = g,
    k['price_per_piece'] = h,
    k;
}

function get_desc_arr_name_only(f, g, h) {
  var i = {},
    j = {
      'thickness': '',
      'parent_category_name': '',
      'category_name': '',
      'name': '',
      'code': '',
      'pm': '',
      'm2': ''
    };
  return f['mat_data'] && (f['mat_data']['parent_category_name'] && (j['parent_category_name'] = f['mat_data'][
        'parent_category_name'
      ] += '\x20'),
      f['mat_data']['category_name'] && (j['category_name'] = f['mat_data']['category_name'] += '\x20'),
      f['mat_data']['name'] && (j['name'] = f['mat_data']['name'] += '\x20'),
      f['mat_data']['code'] && (j['code'] = f['mat_data']['code'] += '\x20'),
      f['pm'] && (j['pm'] = f['pm']),
      f['m2']) && (j['m2'] = f['m2']),
    i['name'] = (j['name'] + j['code'])['trim'](),
    i['m2'] = f['m2'],
    i['pm'] = f['pm'],
    i['price'] = g,
    i['price_per_piece'] = h,
    i;
}

function get_desc_facade(f, g, h) {
  var j = {},
    k = {
      'thickness': '',
      'parent_category_name': '',
      'category_name': '',
      'name': '',
      'code': '',
      'pm': '',
      'm2': ''
    },
    l = {
      'parent_category_name': '',
      'category_name': '',
      'name': '',
      'type_name': ''
    };
  return f['mat_data'] && (f['mat_data']['parent_category_name'] && (k['parent_category_name'] = f['mat_data'][
        'parent_category_name'
      ] += '\x20'),
      f['mat_data']['category_name'] && (k['category_name'] = f['mat_data']['category_name'] += '\x20'),
      f['mat_data']['name'] && (k['name'] = f['mat_data']['name'] += '\x20'),
      f['mat_data']['code'] && (k['code'] = f['mat_data']['code'] += '\x20'),
      f['pm'] && (k['pm'] = f['pm']),
      f['m2']) && (k['m2'] = f['m2']),
    f['set_data'] && (f['set_data']['parent_category_name'] && (l['parent_category_name'] = f['set_data'][
        'parent_category_name'
      ] += '\x20'),
      f['set_data']['category_name'] && (l['category_name'] = f['set_data']['category_name'] += '\x20'),
      f['set_data']['name'] && (l['name'] = f['set_data']['name'] += '\x20'),
      f['set_data']['type_name']) && (l['type_name'] = f['set_data']['type_name'] += '\x20'),
    f['set_data'] && f['set_data']['is_fs'] ? j['name'] = (l['parent_category_name'] + l['category_name'] + l['name'] +
      l['type_name'])['trim']() : j['name'] = (l['parent_category_name'] + l['category_name'] + l['name'] + l[
      'type_name'])['trim']() + '\x20' + (k['parent_category_name'] + k['category_name'] + k['name'] + k['code'])[
      'trim'](),
    j['m2'] = f['m2'],
    j['pm'] = f['pm'],
    j['price'] = g,
    j['price_per_piece'] = h,
    j;
}

function get_desc_handle(f, g, h) {
  var i = {};
  let j = '';
  return f['obj']['name'] && (j += f['obj']['name']),
    f['size']['code'] && (j += '\x20' + f['size']['code']),
    i['name'] = f['obj']['name'],
    i['name_only'] = j,
    i['code'] = f['size']['code'],
    i['width'] = f['specs']['width'],
    i['count'] = f['specs']['count'],
    i['price'] = g,
    f['size']['axis_size'] ? i['axis_size'] = f['size']['axis_size'] : i['axis_size'] = f['specs']['width'],
    i['type'] = f['obj']['type'],
    i['price_per_piece'] = h,
    i;
}

function get_desc_item(f, g, h) {
  var i = {};
  return i['name'] = f['name'] + '\x20' + f['code'],
    i['name_only'] = f['name'],
    i['code'] = f['code'],
    i['count'] = f['count'],
    i['units'] = f['units'],
    i['price'] = g,
    i['type'] = f['type'],
    i['price_per_piece'] = h,
    i;
}

function get_desc_back_wall(f, g, h, j) {
  var k = {},
    l = {
      'thickness': '',
      'parent_category_name': '',
      'category_name': '',
      'name': '',
      'type_name': '',
      'code': '',
      'pm': '',
      'm2': ''
    };
  return j && (l['thickness'] = ',\x20' + j + lang['mm']),
    f['mat_data'] && (f['mat_data']['parent_category_name'] && (l['parent_category_name'] = f['mat_data'][
        'parent_category_name'
      ] += '\x20'),
      f['mat_data']['category_name'] && (l['category_name'] = f['mat_data']['category_name'] += '\x20'),
      f['mat_data']['name'] && (l['name'] = f['mat_data']['name'] += '\x20'),
      f['key'] && (l['type_name'] = project_settings['materials']['top']['back_wall_material'][f['key']]['name'] +=
        '\x20'),
      f['mat_data']['code'] && (l['code'] = f['mat_data']['code'] += '\x20'),
      f['pm'] && (l['pm'] = f['pm']),
      f['m2']) && (l['m2'] = f['m2']),
    k['name'] = (l['parent_category_name'] + l['category_name'] + l['name'] + l['code'] + l['type_name'])['trim']() + l[
      'thickness'],
    k['code'] = l['code'],
    k['m2'] = f['m2'],
    k['pm'] = f['pm'],
    k['price'] = g,
    k['price_per_piece'] = h,
    k;
}

function to_fix2(f) {
  return parseFloat('' + f)['toFixed'](2);
}

function convert_offset(f, g) {
  for (let h = g.length; h--;)
    'string' == typeof g[h] && (-1 < g[h]['indexOf']('%') ? g[h] = f * parseFloat(g[h]) / 100 : g[h] = parseFloat(g[
      h]));
  return g;
}

function convert_size(f, g, h = [0, 0]) {
  return 'string' == typeof f && (f = -1 < f['indexOf']('%') ? g * parseFloat(f) / 100 : parseFloat(f)),
    f -= h[0] + h[1];
}

function convert_position(f, g, h = 1, i = 0, j = [0, 0]) {
  if ('string' == typeof h)
    switch (h) {
      case 'left':
        h = -1;
        break;
      case 'top':
        h = 1;
        break;
      case 'right':
        h = 1;
        break;
      case 'bottom':
        h = -1;
        break;
      case 'center':
        h = 0;
        break;
    }
  return 'string' == typeof g && -1 < g['indexOf']('%') && (g = f * parseFloat(g) / 100),
    g = parseFloat(g),
    g += h * i / 2,
    1 == h && (g += j[0]),
    -1 == h && (g -= j[1]),
    0 == h && (g += j[0] - j[1]),
    g;
}

function conv_val(f, g) {
  return f = 'string' == typeof f ? -1 < f['indexOf']('%') ? g * parseFloat(f) / 100 : parseFloat(f) : f;
}

function correct_buffer_uv_simple(f, g, h) {
  var j = f['attributes']['uv'];
  for (let m = 0; m < j['count']; m++) {
    var k, l, k = (k = j['getX'](m)) / g + 0.5,
      l = (l = j['getY'](m)) / h + 0.5;
    j['setXY'](m, k, l);
  }
  f['attributes']['position']['needsUpdate'] = true,
    f['attributes']['uv']['needsUpdate'] = true;
}

function generateUVs(f) {
  f['computeBoundingBox']();
  var g = f['boundingBox']['max'],
    h = f['boundingBox']['min'],
    j = new THREE['Vector2'](0 - h['x'], 0 - h['y']),
    k = new THREE['Vector2'](g['x'] - h['x'], g['y'] - h['y']),
    m = f['getAttribute']('uv');
  for (let v = 0; v < m['count']; v++) {
    var p = f['attributes']['position'],
      q = p['getX'](v),
      u = p['getY'](v),
      p = p['getZ'](v);
    let w, x;
    x = (w = Math['abs'](p - g['z']) < 0.001 || Math['abs'](p - h['z']) < 0.001 ? (q - h['x']) / k['x'] : (p - h['z']) /
        (g['z'] - h['z']),
        (u - h['y']) / k['y']),
      m['setXY'](v, w, x);
  }
  m['needsUpdate'] = true;
}

function generateAdvancedUVs(f) {
  f['computeBoundingBox']();
  var g = f['boundingBox'],
    h = new THREE['Vector3'](),
    j = (g['getSize'](h),
      f['getAttribute']('uv')),
    k = f['attributes']['position'],
    q = f['attributes']['normal'];
  for (let A = 0; A < j['count']; A++) {
    var u = k['getX'](A),
      v = k['getY'](A),
      w = k['getZ'](A),
      x = q['getX'](A),
      y = q['getY'](A),
      z = q['getZ'](A);
    let B, C;
    C = Math['abs'](z) > Math['abs'](x) && Math['abs'](z) > Math['abs'](y) ? (B = (u - g['min']['x']) / h['x'],
        (v - g['min']['y']) / h['y']) : Math['abs'](y) > Math['abs'](x) ? (B = (u - g['min']['x']) / h['x'],
        (w - g['min']['z']) / h['z']) : (B = (w - g['min']['z']) / h['z'],
        (v - g['min']['y']) / h['y']),
      j['setXY'](A, B, 1 - C);
  }
  j['needsUpdate'] = true;
}
async function check_file_exists(e) {
  return new Promise(function(f, g) {
    var h = new XMLHttpRequest();
    h['open']('HEAD', e, false),
      h['send'](),
      f(404 !== h['status']);
  });
}
async function load_script(e, f, g = true, h = true) {
  return new Promise((j, k) => {
    var m;
    if (0 < document['querySelectorAll']('script[src=\x27' + e + '\x27]')['length'])
      return j();
    let p = document['createElement']('script');
    var q = f || document['getElementsByTagName']('script')[0];

    function u(v, w) {
      !w && p['readyState'] && !/loaded|complete/ ['test'](p['readyState']) || (p['onload'] = null,
        p['onreadystatechange'] = null,
        p = void 0,
        (w ? k : j)());
    }
    p['async'] = g,
      p['defer'] = h,
      p['onload'] = u,
      p['onreadystatechange'] = u,
      p['src'] = e,
      q['parentNode']['insertBefore'](p, q);
  });
}

function single_preview(f, g) {
  var f;
  (global_options['single_preview'] = f) ? (room['hide'](),
    global_temp['single_data']['pos'] = g['position']['clone'](),
    global_temp['single_data']['rot'] = g['rotation']['clone'](),
    global_temp['single_data']['c_pos'] = camera['position']['clone'](),
    global_temp['single_data']['target'] = controls['target']['clone'](),
    f = box3['setFromObject'](g)['getSize'](new THREE['Vector3']()),
    g['position']['set'](0, 0, 0),
    fitCameraToCenteredObject(camera, g, 1.15, controls),
    g['position']['set'](0, -f['y'] / 2, 0)) : (g['position']['copy'](global_temp['single_data']['pos']),
    g['rotation']['copy'](global_temp['single_data']['rot']),
    camera['position']['copy'](global_temp['single_data']['c_pos']),
    controls['target']['copy'](global_temp['single_data']['target']),
    controls['update'](),
    room['show']());
}
let fitCameraToCenteredObject = function(f, g, h, j) {
  var k = new THREE['Box3'](),
    m = (k['setFromObject'](g),
      new THREE['Vector3']()),
    p = new THREE['Vector3'](),
    q = (k['getSize'](p),
      f['fov'] * (Math['PI'] / 180)),
    u = 2 * Math['atan'](Math['tan'](q / 2) * f['aspect']),
    u = p['z'] / 2 + Math['abs'](p['x'] / 2 / Math['tan'](u / 2)),
    p = p['z'] / 2 + Math['abs'](p['y'] / 2 / Math['tan'](q / 2));
  let v = Math['max'](u, p);
  void 0 !== h && 0 !== h && (v *= h),
    f['position']['set'](g['position']['x'], g['position']['y'], v);
  var q = k['min']['z'],
    u = q < 0 ? -q + v : v - q;
  f['far'] = 3 * u,
    f['updateProjectionMatrix'](),
    void 0 !== j && (j['target'] = new THREE['Vector3'](g['position']['x'], g['position']['y'], 0),
      j['maxDistance'] = 2 * u,
      j['update']());
};

function make_ortho_object_screen(f, h, j, k, q = 1024, v = 0.05) {
  var w = f['domElement']['width'],
    x = f['domElement']['height'],
    y = k['position']['clone'](),
    z = k['rotation']['clone']();
  room['hide'](),
    h['add'](k);
  let A = {};
  h['children']['forEach'](G => {
      G !== k && (A[G['uuid']] = G['visible'],
        G['visible'] = false);
    }),
    k['position']['set'](0, 0, 0),
    k['rotation']['set'](0, 0, 0);
  var B = new THREE['Box3']()['setFromObject'](k),
    C = B['getSize'](new THREE['Vector3']()),
    D = B['getCenter'](new THREE['Vector3']()),
    q = q;
  let E, F;
  C['x'] > C['y'] ? (E = q,
    F = Math['round'](C['y'] / C['x'] * q)) : (F = q,
    E = Math['round'](C['x'] / C['y'] * q));
  var q = C['x'] * v,
    v = C['y'] * v,
    q = (j['left'] = C['x'] / -2 - q,
      j['right'] = C['x'] / 2 + q,
      j['top'] = C['y'] / 2 + v,
      j['bottom'] = C['y'] / -2 - v,
      j['position']['set'](0, D['y'], B['max']['z'] + 0.1),
      j['lookAt'](0, D['y'], 0),
      j['zoom'] = 1,
      j['updateProjectionMatrix'](),
      f['setSize'](E, F),
      f['render'](h, j),
      f['domElement']['toDataURL']('image/jpeg', 0.5));
  return h['children']['forEach'](G => {
      void 0 !== A[G['uuid']] ? G['visible'] = A[G['uuid']] : G['visible'] = true;
    }),
    room['add'](k),
    room['show'](),
    k['position']['copy'](y),
    k['rotation']['copy'](z),
    j['aspect'] = w / x,
    j['updateProjectionMatrix'](),
    f['setSize'](w, x),
    f['render'](h, j, null, false),
    q;
}

function clean_tree(f) {
  return f.filter(g => (g['categories'] && 0 < g['categories']['length'] && (g['categories'] = clean_tree(g[
      'categories'])),
    0 < g['items']['length'] || g['categories'] && 0 < g['categories']['length']));
}

function get_object_hierarchy(f) {
  if (!f || !f['userData'])
    return null;
  var g = [],
    h, j;
  for (j of f['userData']['children'] || []) {
    var k = get_object_hierarchy(j);
    k && g.push(k);
  }
  var l = f['userData']['params'] || {};
  return {
    'id': f['userData']['path'],
    'title': f['name'] || l['name'] || '(' + l['type'] + ')',
    'path': f['userData']['path'],
    'type': l['type'],
    'children': g
  };
}

function find_selected_variant(f) {
  var f = _['get'](f, 'params.variants'),
    f = _.findIndex(f, 'default');
  return f < 0 ? 0 : f;
}

function get_tabletop_thickness(f, g) {
  var h = pp['libs']['tabletop'],
    i = project_settings['defaults']['tabletop_variant'] || 0,
    i = parseInt(_['get'](h['get_item'](project_settings['defaults']['tabletop']), 'params.variants[' + i +
      '].thickness', parseInt(project_settings['tabletop_thickness'], 10)), 10);
  return get_variant_thickness(f, g, h, i);
}

function get_wall_thickness(f, g, h) {
  var i, j;
  return get_variant_thickness(f, g, pp['libs']['materials'][h], parseInt(project_settings['default_corpus_thickness'],
    10));
}

function get_variant_thickness(f, g, h, i) {
  var h = h['get_item'](f);
  let j = _['get'](h, 'params.variants[' + (g || 0) + '].thickness', i);
  return j = (j = parseInt(j, 10)) && Number['isFinite'](j) ? j : i;
}

function call_method_on_cabinets(f, ...g) {
  var h = g && g.length,
    i;
  for (i of d_objects)
    'Cabinet' === i['type'] && 'function' == typeof i[f] && (h ? i[f](...g) : i[f]());
}

function find_condition(f, g) {
  if (f && g)
    for (var h of f) {
      var h = _['find'](h, i => g(i));
      if (h)
        return h;
    }
  return null;
}

function merge_existing_keys(e, f) {
  Object['keys'](e)['forEach'](g => {
    _['isObject'](e[g]) && _['isObject'](f[g]) ? merge_existing_keys(e[g], f[g]) : f['hasOwnProperty'](g) && (e[g] =
      f[g]);
  });
}

function merge(...f) {
  return f && f.length ? _['mergeWith'](...f, (g, h) => null === h || h === pp['const']['not_set_value'] ? g : _[
    'isArray'](g) ? h : void 0) : null;
}

function merge_copies(...f) {
  var g;
  return f && f.length ? merge(..._.map(f, h => h && copy_object(h))) : null;
}

function fill_defaults(...f) {
  if (!f || !f.length)
    return null;
  var g = f[0] || {};
  for (let i = 1; i < f.length; i++)
    h(g, f[i]);
  return g;

  function h(j, k) {
    if (j && k)
      for (var l in k) {
        var m, n;
        null != k[l] && (null == j[l] ? j[l] = k[l] : (m = 'object' == typeof j[l] && !Array.isArray(j[l]),
          n = 'object' == typeof k[l] && !Array.isArray(k[l]),
          m && n && fill_defaults(j[l], k[l])));
      }
  }
}

function fill_defaults_copies(...f) {
  var g;
  return f && f.length ? fill_defaults(..._.map(f, h => h && copy_object(h))) : null;
}

function natural_sort(f, g) {
  if (f) {
    let h = new Intl['Collator'](void 0, {
      'numeric': true
    });
    g ? f['sort']((i, j) => h['compare'](i[g], j[g])) : f['sort']((i, j) => h['compare'](i, j));
  }
  return f;
}

function fix_json_empty_object(f) {
  if (!Array.isArray(f))
    return f;
  var g = {},
    h;
  for (h of Object['keys'](f))
    g[h] = f[h];
  return g;
}

function check_global_vars_flag(f) {
  var g = pp['variables']['current'],
    g = _['find'](g, h => h['key'] === f);
  if (g)
    return !is_empty_id(g['value']);
}

function is_empty_value(f) {
  return !f && 0 !== f || f === pp['const']['not_set_value'];
}

function is_empty_id(f) {
  return !f || '0' === f || f === pp['const']['not_set_value'];
}

function is_object(f) {
  return !!f && 'object' == typeof f && !Array.isArray(f);
}

function is_internal_var(f, g) {
  return g ? !!Object['values'](pp['const']['vars'])['includes'](f) : f === pp['const']['vars']['cokol_height'] || f ===
    pp['const']['vars']['tabletop_height'] || f === pp['const']['vars']['facade_thickness'];
}

function normalize_angle(f) {
  return f %= 2 * Math['PI'],
    Math['PI'] < f && (f -= 2 * Math['PI']),
    f < -Math['PI'] && (f += 2 * Math['PI']),
    Math['round'](f);
}

function parse_num(f, g = 0) {
  var f = parseFloat(f);
  return Number['isFinite'](f) ? f : g;
}

function parse_int(f, g = 0) {
  var f = parseInt(f);
  return Number['isFinite'](f) ? f : g;
}

function get_mat_lib_hash_ids() {
  var f = new Map(),
    g;
  for (g of pp['libs']['model_materials']['items_arr'])
    g['mode'] && g['active'] && g['key'] && ('' + g['mode'] != '2' && '' + g['mode'] != '3' || f['set']('' + g['id'],
      g));
  return f;
}

function getRotatedBox3(f, g, h) {
  var f = [new THREE['Vector3'](f['min']['x'], f['min']['y'], f['min']['z']), new THREE['Vector3'](f['min']['x'], f[
    'min']['y'], f['max']['z']), new THREE['Vector3'](f['min']['x'], f['max']['y'], f['min']['z']), new THREE[
    'Vector3'](f['min']['x'], f['max']['y'], f['max']['z']), new THREE['Vector3'](f['max']['x'], f['min']['y'], f[
    'min']['z']), new THREE['Vector3'](f['max']['x'], f['min']['y'], f['max']['z']), new THREE['Vector3'](f['max'][
    'x'
  ], f['max']['y'], f['min']['z']), new THREE['Vector3'](f['max']['x'], f['max']['y'], f['max']['z'])];
  let i = h;
  return f.forEach(j => {
      j['sub'](g),
        j['applyQuaternion'](i),
        j['add'](g);
    }),
    new THREE['Box3']()['setFromPoints'](f);
}

function boxes_intersect_with_eps(f, g, h = 0.01) {
  return f['min']['x'] <= g['max']['x'] - h && f['max']['x'] >= g['min']['x'] + h && f['min']['y'] <= g['max']['y'] -
    h && f['max']['y'] >= g['min']['y'] + h && f['min']['z'] <= g['max']['z'] - h && f['max']['z'] >= g['min']['z'] + h;
}

function get_param_holes_on_wall(e) {
  (e instanceof Module || e['userData']['is_root']) && traverse_parts(e, (j, k, q) => {
    if ('hole' === k) {
      var k = j,
        j = k['userData']['params']['spec']['direction'];
      let L = [];
      e['traverse'](O => {
        O instanceof CabinetWall && O['userData']?.['own_object'] && L.push(O);
      });
      var v = new THREE['Quaternion'](),
        w = new THREE['Vector3'](),
        x = new THREE['Vector3'](),
        z = (k['getWorldPosition'](x),
          k['getWorldQuaternion'](v),
          k['getWorldDirection'](w),
          new THREE['Vector3']());
      switch (j) {
        case 'x':
          z['set'](1, 0, 0);
          break;
        case '-x':
          z['set'](-1, 0, 0);
          break;
        case 'y':
          z['set'](0, 1, 0);
          break;
        case '-y':
          z['set'](0, -1, 0);
          break;
        case 'z':
          z['set'](0, 0, 1);
          break;
        case '-z':
          z['set'](0, 0, -1);
          break;
        default:
          z['set'](0, 0, 1);
      }
      var w = z['clone']()['applyQuaternion'](v)['normalize'](),
        A, v = new THREE['Raycaster'](x, w)['intersectObjects'](L.map(O => O['userData']['own_object']), true)[
          'filter'](O => 'CabinetWall' === O['object']?.['parent']?.['parent']['userData']?.['class']),
        B, v, C, D, E, F, G, E, x, D, G, H, I, J, E, x, K, F, D, G, C;

      function N(O) {
        var P = {
            'x': new THREE['Vector3'](1, 0, 0),
            'y': new THREE['Vector3'](0, 1, 0),
            'z': new THREE['Vector3'](0, 0, 1),
            '-x': new THREE['Vector3'](-1, 0, 0),
            '-y': new THREE['Vector3'](0, -1, 0),
            '-z': new THREE['Vector3'](0, 0, -1)
          },
          Q, R;
        let S = 'z',
          T = -1 / 0;
        for ([Q, R] of Object['entries'](P)) {
          var U = O['dot'](R);
          U > T && (T = U,
            S = Q);
        }
        return S;
      }
      0 !== v.length && (C = (v = v[0]['object']['parent']['parent'])['userData']['computed'],
        D = new THREE['Vector3'](),
        v['getWorldPosition'](D),
        E = new THREE['Quaternion'](),
        v['getWorldQuaternion'](E),
        F = new THREE['Vector3'](0, 0, 1)['applyQuaternion'](E)['normalize'](),
        G = new THREE['Vector3'](1, 0, 0)['applyQuaternion'](E)['normalize'](),
        E = new THREE['Vector3'](0, 1, 0)['applyQuaternion'](E)['normalize'](),
        D = (x = x['clone']()['sub'](D))['dot'](G),
        G = x['dot'](E),
        H = x['dot'](F),
        I = D + C['u_size']['x'] / 2,
        J = G + C['u_size']['y'] / 2,
        E = N(w),
        k['_show_helpers'](),
        F = {
          'z': {
            'pos': [0, 0, -(x = v['userData']['computed']['u_size']['clone']())['z'] / 2],
            'size': [x['x'], x['y']],
            'normal': [0, 0, 1]
          },
          '-z': {
            'pos': [0, 0, x['z'] / 2],
            'size': [x['x'], x['y']],
            'normal': [0, 0, -1]
          },
          'x': {
            'pos': [-x['x'] / 2, 0, 0],
            'size': [x['z'], x['y']],
            'normal': [1, 0, 0]
          },
          '-x': {
            'pos': [x['x'] / 2, 0, 0],
            'size': [x['z'], x['y']],
            'normal': [-1, 0, 0]
          },
          'y': {
            'pos': [0, -x['y'] / 2, 0],
            'size': [x['x'], x['z']],
            'normal': [0, 1, 0]
          },
          '-y': {
            'pos': [0, x['y'] / 2, 0],
            'size': [x['x'], x['z']],
            'normal': [0, -1, 0]
          }
        } [E],
        D = new THREE['PlaneGeometry'](F['size'][0], F['size'][1]),
        G = new THREE['MeshBasicMaterial']({
          'color': 16776960,
          'transparent': true,
          'opacity': 0.4,
          'side': THREE['DoubleSide'],
          'depthTest': false,
          'depthWrite': false
        }),
        (C = new THREE['Mesh'](D, G))['position']['set'](...F['pos']),
        C['lookAt'](F['pos'][0] + F['normal'][0], F['pos'][1] + F['normal'][1], F['pos'][2] + F[
          'normal'][2]),
        C['userData']['directionKey'] = j,
        v['userData']['own_object']['add'](C));
    }
  });
}

function addVectors(f, g) {
  return {
    'x': f['x'] + g['x'],
    'y': f['y'] + g['y'],
    'z': f['z'] + g['z']
  };
}

function subtract_vectors(f, g) {
  return {
    'x': f['x'] - g['x'],
    'y': f['y'] - g['y'],
    'z': f['z'] - g['z']
  };
}

function dot_product(f, g) {
  return f['x'] * g['x'] + f['y'] * g['y'] + f['z'] * g['z'];
}

function cross_product(f, g) {
  return {
    'x': f['y'] * g['z'] - f['z'] * g['y'],
    'y': f['z'] * g['x'] - f['x'] * g['z'],
    'z': f['x'] * g['y'] - f['y'] * g['x']
  };
}

function multiplyVector(f, g) {
  return {
    'x': f['x'] * g,
    'y': f['y'] * g,
    'z': f['z'] * g
  };
}

function length(f) {
  return Math['sqrt'](dot_product(f, f));
}

function normalize(f) {
  var g = length(f) || 1;
  return {
    'x': f['x'] / g,
    'y': f['y'] / g,
    'z': f['z'] / g
  };
}

function rotateVectorXYZ(f, g) {
  var h = -deg2rad(g['x'] || 0),
    j = -deg2rad(g['y'] || 0),
    g = -deg2rad(g['z'] || 0),
    k = f['x'],
    m = f['y'],
    f = f['z'],
    p = Math['cos'](h),
    h = Math['sin'](h),
    q, u = m * h + f * p,
    m = m * p - f * h,
    f = u,
    p = Math['cos'](j),
    h, v, u = -k * (h = Math['sin'](j)) + f * p,
    k = k * p + f * h;
  f = u,
    p = Math['cos'](g);
  var w, j = k * (h = Math['sin'](g)) + m * p;
  return {
    'x': k = k * p - m * h,
    'y': m = j,
    'z': f
  };
}

function transform_pivot(f, g, h) {
  let j = f['x'],
    k = f['y'],
    l = f['z'];
  var f = g['x'],
    m = g['y'],
    g = g['z'],
    p = h['x'],
    q = h['y'],
    h = h['z'];
  return 0 === f ? j -= p / 2 : 1 === f && (j -= p),
    0 === m ? k -= q / 2 : 1 === m && (k -= q),
    0 === g ? l -= h / 2 : 1 === g && (l -= h), {
      'x': j,
      'y': k,
      'z': l
    };
}

function get_root_params(f) {
  let g = {
      ...f['userData']['computed']['pos']
    },
    h = {
      ...f['userData']['computed']['rot']
    };
  var j = {
      ...f['userData']['computed']['size']
    },
    k = {
      ...f['userData']['params']['pivot']
    };
  g = transform_pivot(g, k, j),
    f instanceof CabinetHole && (g = rotateVectorXYZ(g = transform_pivot(g = {
      ...f['userData']['computed']['real_pos']
    }, k, j), h));
  let l = f['userData']['parent'];
  for (; l;) {
    var m = l['userData']['computed'],
      p = l['userData']['params'];
    g = transform_pivot(g, p['pivot'], m['size']),
      g = addVectors(g = f instanceof CabinetHole ? rotateVectorXYZ(g, m['rot']) : g, m['pos']),
      h = addVectors(h, m['rot']),
      l = l['userData']['parent'];
  }
  return f['userData']['computed']['world'] = {
    'pos': g,
    'rot': h,
    'size': j
  }, {
    'pos': g,
    'rot': h,
    'size': j
  };
}

function buildOBB(f) {
  var {
    pos: f,
    rot: g,
    size: h
  } = f['userData']['world'] || get_root_params(f), j = normalize(rotateVectorXYZ({
    'x': 1,
    'y': 0,
    'z': 0
  }, g)), k = normalize(rotateVectorXYZ({
    'x': 0,
    'y': 1,
    'z': 0
  }, g)), g = normalize(rotateVectorXYZ({
    'x': 0,
    'y': 0,
    'z': 1
  }, g)), f = f, l = addVectors(addVectors(multiplyVector(j, h['x'] / 2), multiplyVector(k, h['y'] / 2)),
    multiplyVector(g, h['z'] / 2)), m;
  return {
    'center': addVectors(f, l),
    'axis': [j, k, g],
    'half': [h['x'] / 2, h['y'] / 2, h['z'] / 2]
  };
}

function obb_intersect(j, k, q = 0.0001) {
  var w = buildOBB(j),
    x = buildOBB(k),
    z = Array(3)['fill'](0)['map'](() => Array(3)['fill'](0)),
    A = Array(3)['fill'](0)['map'](() => Array(3)['fill'](0));
  for (let Q = 0; Q < 3; Q++)
    for (let R = 0; R < 3; R++)
      z[Q][R] = dot_product(w['axis'][Q], x['axis'][R]);
  var B = subtract_vectors(x['center'], w['center']),
    C = [dot_product(B, w['axis'][0]), dot_product(B, w['axis'][1]), dot_product(B, w['axis'][2])];
  for (let S = 0; S < 3; S++)
    for (let T = 0; T < 3; T++)
      A[S][T] = Math['abs'](z[S][T]) + 0.000001;
  let D = 1 / 0,
    E = null;
  for (let U = 0; U < 3; U++) {
    var F, G, H = w['half'][U] + (x['half'][0] * A[U][0] + x['half'][1] * A[U][1] + x['half'][2] * A[U][
      2]) - Math['abs'](C[U]);
    if (H <= 0)
      return false;
    H < D && (D = H,
      E = w['axis'][U]);
  }
  for (let W = 0; W < 3; W++) {
    var I = w['half'][0] * A[0][W] + w['half'][1] * A[1][W] + w['half'][2] * A[2][W],
      J = x['half'][W],
      K = C[0] * z[0][W] + C[1] * z[1][W] + C[2] * z[2][W],
      I = I + J - Math['abs'](K);
    if (I <= 0)
      return false;
    I < D && (D = I,
      E = x['axis'][W]);
  }
  for (let Z = 0; Z < 3; Z++)
    for (let a0 = 0; a0 < 3; a0++) {
      var L, N, O, P = w['half'][(Z + 1) % 3] * A[(Z + 2) % 3][a0] + w['half'][(Z + 2) % 3] * A[(Z + 1) %
        3][a0] + (x['half'][(a0 + 1) % 3] * A[Z][(a0 + 2) % 3] + x['half'][(a0 + 2) % 3] * A[Z][(a0 +
        1) % 3]) - Math['abs'](C[(Z + 2) % 3] * z[(Z + 1) % 3][a0] - C[(Z + 1) % 3] * z[(Z + 2) %
        3][a0]);
      if (P <= 0)
        return false;
      P < D && (D = P,
        E = normalize(cross_product(w['axis'][Z], x['axis'][a0])));
    }
  return !(D < q) && (visualizeOBB(j, 16711680, D),
    visualizeOBB(k, 4251856, D), {
      'intersect': true,
      'min_overlap': D,
      'axis': E
    });
}

function visualizeOBB(f, g = 65280) {
  var h = buildOBB(f),
    i = new THREE['BoxGeometry'](2 * h['half'][0], 2 * h['half'][1], 2 * h['half'][2]),
    i = new THREE['EdgesGeometry'](i),
    g = new THREE['LineBasicMaterial']({
      'color': g,
      'linewidth': 2
    }),
    i = new THREE['LineSegments'](i, g),
    g = new THREE['Matrix4'](),
    j = (g['makeBasis'](new THREE['Vector3'](h['axis'][0]['x'], h['axis'][0]['y'], h['axis'][0]['z']), new THREE[
        'Vector3'](h['axis'][1]['x'], h['axis'][1]['y'], h['axis'][1]['z']), new THREE['Vector3'](h['axis'][2]
        ['x'], h['axis'][2]['y'], h['axis'][2]['z'])),
      new THREE['Matrix4']());
  return j['compose'](new THREE['Vector3'](h['center']['x'], h['center']['y'], h['center']['z']), new THREE[
      'Quaternion']()['setFromRotationMatrix'](g), new THREE['Vector3'](1, 1, 1)),
    i['applyMatrix4'](j),
    scene && scene['add'](i),
    f['userData']['obbHelper'] = i;
}

function compute_root_recursive(f) {
  for (var g = [f]; 0 < g.length;) {
    var h = g['pop'](),
      i = get_root_params(h);
    if (h['userData']['world'] = i,
      h['userData']['children'] && h['userData']['children']['length']) {
      for (var j of h['userData']['children'])
        g.push(j);
    }
  }
}
viewport_needs_resize = false;
let _pi = Math['PI'],
  PI = Math['PI'],
  cart2 = {
    'accessories': [],
    'items': [],
    'total': 0,
    'count': 0
  },
  libs = {},
  cokol_settings = {
    'offset': 0
  },
  cabinet_events = {},
  interface_version = 1,
  d_objects = [],
  input_delay = 1000,
  corpus_draggable_snap_distance = 3,
  sections = [],
  dsp_thickness = [16, 18, 22, 25, 28, 32],
  cokol_top_height = 50,
  camera, no_autosave = !(temp = {
    'var1': {
      'name': 'Переменная',
      'type': '',
      'editable': '',
      'value': ''
    }
  }),
  global_data = {
    'tabletop': {
      'items': [],
      'items_bardesk': [],
      'needs_cut': [],
      'desc': []
    },
    'rulers': {
      'items': {},
      'parents': {}
    }
  },
  cabinet_def_common = {
    'type': 'section',
    'name': '',
    'id': '',
    'lib': '',
    'tags': '',
    'interactive': 0,
    'spec': {},
    'custom': {},
    'children': [],
    'condition': null,
    'visible': 1,
    'helpers_visible': 0,
    'active': 1,
    'variables': {
      'visible': 1,
      'main': {}
    },
    'interaction': {
      'auto_rotation': 1,
      'check_intersection': 0,
      'raycast': 1
    },
    'resizable': {
      'enabled': 0,
      'locks': {},
      'minmax': {
        'min': {
          'x': 0,
          'y': 0,
          'z': 0
        },
        'max': {
          'x': 0,
          'y': 0,
          'z': 0
        }
      }
    },
    'size': {
      'x': 100,
      'y': 1000,
      'z': 1000
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
    'scale': {
      'x': 1,
      'y': 1,
      'z': 1
    },
    'rot': {
      'x': 0,
      'y': 0,
      'z': 0
    },
    'c_rot': {
      'x': 0,
      'y': 0,
      'z': 0
    },
    'events': {
      'on_before_params': '',
      'on_before_build': '',
      'on_after_build': '',
      'on_drag_end': ''
    },
    'accessories': [],
    'comments': '',
    'section_key': '',
    'params_key': ''
  },
  lib = function(f, g) {
    let h = copy_object(f),
      j = copy_object(g);
    return j['items'] || (j['items'] = []),
      j['items']['length'] || j['items']['push'](h),
      j['categories'] || (j['categories'] = []), {
        'name': '',
        'tree': '',
        'first_item': h,
        'items': {
          0: h
        },
        'categories': {
          0: j
        },
        'get_item': function(k) {
          var k;
          return this['items'][k] ? ((k = copy_object(this['items'][k]))['add_params'] || (k['add_params'] = {}),
            k) : h;
        },
        'find_item': function(k) {
          return this['items'][k] || h;
        },
        'get_category': function(k) {
          return this['categories'][k] ? copy_object(this['categories'][k]) : j;
        },
        'find_category': function(k) {
          return this['categories'][k] || null;
        },
        'get_categories': function(k) {
          if (!isArray(k))
            return this['get_category'](k);
          var l = [];
          for (let n = 0; n < k.length; n++) {
            var m = this['get_category'](k[n]);
            0 != m['id'] && l.push(copy_object(m));
          }
          return l;
        },
        'add_category': function(k, l) {
          l['items'] || (l['items'] = []),
            l['categories'] || (l['categories'] = []),
            this['categories'][k] = l;
        },
        'add_item': function(k, l) {
          if (this['items'][k] = l,
            Array.isArray(l['category'])) {
            for (let m = 0; m < l['category']['length']; m++)
              this['categories'][l['category'][m]] && this['categories'][l['category'][m]]['items']['push'](l);
          } else
            this['categories'][l['category']] && this['categories'][l['category']]['items']['push'](l);
        },
        'set_name': function(k) {
          this['name'] = k;
        },
        'get_name': function() {
          return this['name'];
        },
        'find_available_categories'(k = []) {
          if (!k.length)
            return Object['values'](this['categories']);
          var l = [];
          for (let n = 0; n < k.length; n++) {
            var m = this['find_category'](k[n]);
            m && l.push(m);
          }
          return l;
        },
        'find_all_available_categories'(k = []) {
          let m = this;
          var n = [];
          return p(k, n),
            n;

          function p(q, r) {
            if (q?.['length'])
              for (let w = 0; w < q.length; w++) {
                var u = m['find_category'](q[w]),
                  v;
                u && (r.push(u),
                  u['categories']?.['length']) && p(_.map(u['categories'], x => x['id']), r);
              }
          }
        },
        'get_item_name'(k) {
          return this['find_item'](k)?.['name'] || '';
        }
      };
  },
  category_0 = (libs['background'] = new lib({
    'id': 0,
    'name': '',
    'icon': '',
    'src': '',
    'params': '',
    'active': 1,
    'order': 0
  }, {
    'id': 0,
    'parent': 0,
    'code': '',
    'name': 'Категория\x20в\x20базе\x20не\x20найдена',
    'items': [],
    'categories': []
  }), {
    'id': 0,
    'parent': 0,
    'code': '',
    'name': 'Категория\x20в\x20базе\x20не\x20найдена',
    'items': [],
    'categories': []
  }),
  mod_lib = new lib({
    'id': 0,
    'name': '',
    'icon': ''
  }, category_0),
  material_0 = {
    'id': 0,
    'category': 0,
    'code': '',
    'name': 'Материал\x20не\x20найден',
    'params': {
      'color': '#ff0000',
      'transparent': true,
      'opacity': 0.3
    },
    'add_params': {}
  },
  materials_lib = new lib(material_0, category_0),
  glass_lib = (materials_lib['get_data'] = function(f) {
      var g = {
          'mat': '',
          'cat': '',
