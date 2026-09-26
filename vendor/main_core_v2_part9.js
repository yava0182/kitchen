 Vue['component']('kitchen_models_component', {
        'props': {
            'type_key': String,
            'mousedown': Number,
            'colorpicker': Boolean,
            'single': Boolean,
            'active': Boolean
        },
        'template': '\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20v-show=\x22mode\x20==\x200\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20v-for=\x22(model,\x20index)\x20in\x20$options.models\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20@click=\x22select_model(model,index)\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div><img\x20:src=\x22model.icon\x22\x20alt=\x22\x22></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div>{{model.name}}</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20v-if=\x22mode\x20==\x201\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20@click=\x22mode\x20=\x200\x22>Назад</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20v-for=\x22item\x20in\x20$options.modules.items\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20@mousedown=\x22add_module($event,\x20item)\x22><img\x20:src=\x22item.icon\x22\x20alt=\x22\x22></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div>{{item.name}}</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20',
        'created': function() {
            var h = this;
            this['$options']['models'] = kitchen_styles;
        },
        'mounted': function() {},
        'computed': {},
        'data': function() {
            return {
                'selected_model': -0x1,
                'mode': 0x0
            };
        },
        'methods': {
            'select_model': async function(h, i) {
                modules = await promise_request('data/module_sets/' + h['modules_set_id'] + '.json' + date_timestamp),
                this['$options']['modules'] = modules,
                this['mode'] = 0x1,
                this['selected_model'] = i,
                this['$forceUpdate']();
            },
            'add_module': function(h, i) {
                h['preventDefault']();
                var h = copy_object(i['params']);
                h['id'] = i['id'],
                sc['add_object']('cabinet', h);
            },
            'lang': function(h) {
                return lang[h];
            }
        }
    });
}
var isOutOfViewport = function(f) {
    var f = f['getBoundingClientRect']()
      , g = {};
    return g['top'] = f['top'] < 0x0,
    g['left'] = f['left'] < 0x0,
    g['bottom'] = f['bottom'] > (window['innerHeight'] || document['documentElement']['clientHeight']),
    g['right'] = f['right'] > (window['innerWidth'] || document['documentElement']['clientWidth']),
    g['any'] = g['top'] || g['left'] || g['bottom'] || g['right'],
    g['all'] = g['top'] && g['left'] && g['bottom'] && g['right'],
    g;
};
function convert_height(f) {
    let g = {};
    if (f['items'])
        for (let k = 0x0; k < f['items']['length']; k++) {
            var h = f['items'][k];
            for (let l = 0x0; l < h['params']['variants']['length']; l++) {
                var j = h['params']['variants'][l];
                g[j['height']] || (g[j['height']] = {}),
                g[j['height']][h['id']] || (g[j['height']][h['id']] = h['id']);
            }
        }
    if (f['categories']) {
        for (let m = 0x0; m < f['categories']['length']; m++)
            convert_height(f['categories'][m]);
    }
    f['categories'] && Object['keys'](g)['forEach'](function(n) {
        let o = {
            'id': f['id'] + '_' + n,
            'name': lang['height'] + '\x20' + n + '\x20' + lang['mm'],
            'active': 0x1,
            'is_height': 0x1,
            'items': [],
            'categories': []
        };
        Object['keys'](g[n])['forEach'](function(p) {
            o['items']['push'](mod_lib['items'][p]);
        }),
        mod_lib['categories'][o['id']] = o,
        f['categories']['push'](o);
    });
}
function check_keyboard_free() {
    var f = window['getSelection']()
      , f = f && 'Range' === f['type'];
    return 'INPUT' !== document['activeElement']['tagName'] && 'TEXTAREA' !== document['activeElement']['tagName'] && !f;
}
let pp_keyboard = {
    'ctrl': !0x1,
    'shift': !0x1,
    'r': !0x1,
    'c': !0x1,
    'x': !0x1,
    'y': !0x1,
    'z': !0x1
};
document['addEventListener']('keydown', function(f) {
    f['shiftKey'] && (pp_keyboard['shift'] = !0x0,
    controls) && (controls['enabled'] = !0x1),
    f['ctrlKey'] && (pp_keyboard['ctrl'] = !0x0,
    controls) && (controls['enabled'] = !0x1),
    'KeyX' == f['code'] && (pp_keyboard['x'] = !0x0),
    'KeyY' == f['code'] && (pp_keyboard['y'] = !0x0),
    'KeyZ' == f['code'] && (pp_keyboard['z'] = !0x0),
    'KeyR' == f['code'] && (pp_keyboard['r'] = !0x0),
    'KeyC' == f['code'] && (pp_keyboard['c'] = !0x0);
}),
document['addEventListener']('keyup', function(f) {
    var g;
    if (f['preventDefault'](),
    Object['keys'](pp_keyboard)['forEach'](h => {
        pp_keyboard[h] = !0x1,
        'shift' != h && 'ctrl' != h || controls && (controls['enabled'] = !0x0);
    }
    ),
    check_keyboard_free()) {
        if (f['ctrlKey'])
            switch (f['code']) {
            case 'KeyX':
                break;
            case 'KeyC':
                break;
            case 'KeyV':
                break;
            case 'KeyZ':
                if ('function' == typeof undo_action)
                    try {
                        undo_action();
                    } catch (h) {
                        undo_list['shift']();
                    }
                break;
            case 'KeyY':
                if ('function' == typeof redo_action)
                    try {
                        redo_action();
                    } catch (i) {}
                break;
            }
        else
            switch (f['code']) {
            case 'KeyR':
                'rulers' != global_options['mouse_mode']['mode'] ? (sc['unset_mouse_mode'](),
                pp['interface']['root']['$refs']['top_menu']['set_ruler_mode'](0x1, 0x1)) : sc['unset_mouse_mode']();
                break;
            case 'KeyG':
                'guides' != global_options['mouse_mode']['mode'] ? (sc['unset_mouse_mode'](),
                pp['interface']['root']['$refs']['top_menu']['set_guides_mode'](0x1)) : 0x1 == global_options['mouse_mode']['target'] ? pp['interface']['root']['$refs']['top_menu']['set_guides_mode'](0x2) : pp['interface']['root']['$refs']['top_menu']['set_guides_mode'](0x1);
                break;
            case 'Escape':
                sc['unset_mouse_mode']();
                break;
            case 'Delete':
                (g = sc['get_active']()) && sc['remove_object'](g);
                break;
            }
    }
}),
pp['top_menu'] = {
    'functions': {
        'set_tabletop_cut_mode': function(f) {
            pp['interface']['root']['$refs']['top_menu']['tabletop_cut_mode'] = f,
            sc['set_tabletop_cut_mode'](f);
        },
        'toggle_tabletop_cut_mode': function() {
            0x1 == pp['interface']['root']['$refs']['top_menu']['tabletop_cut_mode'] ? (pp['interface']['root']['$refs']['top_menu']['tabletop_cut_mode'] = 0x0,
            sc['set_tabletop_cut_mode'](0x0)) : (pp['interface']['root']['$refs']['top_menu']['tabletop_cut_mode'] = 0x1,
            sc['set_tabletop_cut_mode'](0x1));
        },
        'reset_camera'() {
            controls['target']['set'](0xee, 0x40, 0x11),
            camera['position']['set'](0x22, 0xcb, 0x191),
            controls['update']();
        },
        'close_colorpicker'() {
            switch (pp['interface']['root']['$refs']['top_menu']['colorpicker_notice'] = '',
            pp['interface']['root']['$refs']['top_menu']['colorpicker_target']) {
            case 'fill':
                pp['interface']['root']['unset_fill_mode']();
                break;
            case 'erase':
                pp['interface']['root']['unset_erase_mode']();
                break;
            default:
                pp['interface']['root']['unset_colorpicker_mode']();
            }
        },
        'show_project_materials'() {
            let f = document['getElementsByClassName']('materials_panel_body')[0x0]
              , g = setInterval( () => {
                '' != f['innerHTML'] && (clearInterval(g),
                pp['interface']['root']['$emit']('show_custom_modal', {
                    'heading': pp['interface']['root']['lang']('materials_panel'),
                    'body': document['getElementsByClassName']('materials_panel_body')[0x0]['innerHTML']
                }));
            }
            , 0x64);
        },
        'new_project': function() {
            pp['interface']['root']['$emit']('yn_modal_show', {
                'heading': pp['interface']['root']['lang']('new_project'),
                'body': pp['interface']['root']['lang']('new_project_confirm'),
                'cb': 'new_project'
            });
        },
        'guess': function() {
            0x1 == pp['interface']['root']['$refs']['top_menu']['was_loaded'] ? pp['interface']['root']['$refs']['top_menu']['save_project']() : pp['interface']['root']['$refs']['top_menu']['$refs']['project_file']['click']();
        },
        'load_project': function(f) {
            var g, h, h;
            pp['interface']['root']['$refs']['top_menu']['$refs']['project_file'][0x0]['files']['length'] && ((g = pp['interface']['root']['$refs']['top_menu']['$refs']['project_file'][0x0]['files'][0x0])['name']['endsWith'](global_options['save_file_zip']) ? ((h = new FileReader())['onload'] = async function(j) {
                try {
                    var k = await JSZip['loadAsync'](j['target']['result']);
                    if (k['files']['project.json']) {
                        var l = await k['files']['project.json']['async']('string'), m;
                        if (load_scene_new(l),
                        k['folder']('textures'))
                            for (let s of Object['keys'](k['files'])['filter'](u => u['startsWith']('textures/'))) {
                                var p = await k['files'][s]['async']('base64'), q, r = 'data:' + (s['endsWith']('.png') ? 'image/png' : 'image/jpeg') + ';base64,' + p;
                                let u = new Image();
                                u['onload'] = () => {
                                    s['includes']('lr_wall') ? (sc['set_walls_custom_material'](u),
                                    global_options['custom_textures']['lr_wall']['texture'] = u['src'],
                                    global_options['custom_textures']['fb_wall']['texture'] = u['src']) : s['includes']('floor') && (sc['set_floor_custom_material'](u),
                                    global_options['custom_textures']['floor']['texture'] = u['src']);
                                }
                                ,
                                u['src'] = r;
                            }
                    }
                } catch (v) {}
            }
            ,
            h['readAsArrayBuffer'](g)) : g['name']['endsWith'](global_options['save_file_ext']) && ((h = new FileReader())['onload'] = function(i) {
                load_scene_new(i['target']['result']);
            }
            ,
            h['readAsText'](g))),
            pp['interface']['root']['$refs']['top_menu']['was_loaded'] = 0x1,
            pp['interface']['root']['$refs']['top_menu']['$refs']['project_file'][0x0]['value'] = null;
        },
        'save_project': function() {
            save_scene_new();
        },
        'export_model': function(f) {
            switch (f) {
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
        'change_proj': function(f) {
            'persp' == f ? camera_mode_3d() : projection(f);
        },
        'edges_mode'(f) {
            global_options['mode'] = f ? 'edges' : 'design',
            room['change_mode']();
        },
        'numbers_mode'(f) {
            sc['numbers'](f);
        },
        'edges_transparent'(f) {
            global_options['edges_transparent'] = f,
            transparent_edges(global_options['edges_transparent']);
        },
        'sizes_mode': function(f) {
            switch (Vue['set'](pp['interface']['root']['$refs']['top_menu'], 'sizes', {
                'no': !0x1,
                'basic': !0x1,
                'all': !0x1
            }),
            pp['interface']['root']['$refs']['top_menu']['sizes'][f] = !0x0,
            f) {
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
        'kitchen_sizes_mode': function(f) {
            global_options['kitchen_sizes_visible'] = f,
            sc['update_kitchen_sizes']();
        },
        'fullscreen': function() {
            var f;
            0x0 == pp['interface']['root']['$refs']['top_menu']['is_fullscreen'] ? (pp['interface']['root']['$refs']['top_menu']['is_fullscreen'] = 0x1,
            (f = document['querySelector']('#calc'))['requestFullscreen'] ? f['requestFullscreen']() : f['mozRequestFullScreen'] ? f['mozRequestFullScreen']() : f['webkitRequestFullScreen'] && f['webkitRequestFullScreen']()) : (pp['interface']['root']['$refs']['top_menu']['is_fullscreen'] = 0x0,
            document['cancelFullScreen'] ? document['cancelFullScreen']() : document['mozCancelFullScreen'] ? document['mozCancelFullScreen']() : document['webkitCancelFullScreen'] && document['webkitCancelFullScreen']());
        },
        'screenshot': function() {
            save_screen();
        },
        'custom_screenshot': function() {
            pp['interface']['root']['$emit']('custom_screenshot_modal_show', {
                'cb': 'pdf_new_tab'
            });
        },
        'intersections_toggle': function(f) {
            sc['intersections_toggle'](f);
        },
        'view_only_toggle': function(f) {
            (global_options['view_only_mode'] = f) && dControls['clear_selected']();
        },
        'facades_active_change': function(f) {
            project_settings['facades_active'] = !f,
            sc['set_facades_active'](!f);
        },
        'pdf_new_tab': async function() {
            0x1 == constructor_settings['pdf_use_password'] ? pp['interface']['root']['$emit']('password_modal_show', {
                'cb': 'pdf_new_tab'
            }) : ic['pdf_new_tab']();
        },
        'pdf_download': function() {
            0x1 == constructor_settings['pdf_use_password'] ? pp['interface']['root']['$emit']('password_modal_show', {
                'cb': 'pdf_download'
            }) : ic['pdf_download']();
        },
        'xls_download': function() {
            0x1 == constructor_settings['pdf_use_password'] ? pp['interface']['root']['$emit']('password_modal_show', {
                'cb': 'xls_download'
            }) : ic['xls_download']();
        },
        'show_order_modal': function() {
            'function' == typeof c_show_order_modal ? c_show_order_modal() : pp['interface']['root']['$emit']('order_modal_show', {});
        },
        'show_info_modal': function() {
            'function' == typeof c_project_info ? c_project_info() : pp['interface']['root']['$emit']('info_modal_show', {
                'heading': pp['interface']['root']['lang']('modules_info'),
                'data': sc['get_objects_info']()
            });
        },
        'show_comments_modal': function() {
            pp['interface']['root']['$emit']('show_comments_modal', 0x1);
        },
        'set_ruler_mode': function(f, g) {
            pp['interface']['root']['$refs']['top_menu']['ruler_mode'] == f ? (pp['interface']['root']['$refs']['top_menu']['ruler_mode'] = 0x0,
            sc['set_ruler_mode'](0x0, g)) : (pp['interface']['root']['$refs']['top_menu']['ruler_mode'] = f,
            sc['set_ruler_mode'](f, g)),
            pp['interface']['root']['$refs']['top_menu']['current'] = null;
        },
        'clear_rulers': function() {
            pp['interface']['root']['$emit']('yn_modal_show', {
                'heading': pp['interface']['root']['lang']('confirm_action'),
                'body': pp['interface']['root']['lang']('clear_rulers'),
                'callback': () => {
                    sc['clear_rulers']();
                }
            });
        },
        'change_rulers_visible': function(f) {
            sc['set_rulers_visible'](f);
        },
        'set_grid_mode': function(f) {
            pp['interface']['root']['$refs']['top_menu']['grid_mode'] == f ? (pp['interface']['root']['$refs']['top_menu']['grid_mode'] = 0x0,
            sc['grid_mode'](0x0)) : (pp['interface']['root']['$refs']['top_menu']['grid_mode'] = f,
            sc['grid_mode'](f));
        },
        'set_grid': function(e, f) {
            clearTimeout(pp['interface']['root']['$refs']['top_menu']['debounce']),
            pp['interface']['root']['$refs']['top_menu']['debounce'] = setTimeout( () => {
                var g = parseInt(f['target']['value']);
                pp['interface']['root']['$refs']['top_menu']['grid_' + e] = g,
                sc['set_grid'](e, g);
            }
            , 0x258);
        },
        'set_guides_mode': function(f) {
            pp['interface']['root']['$refs']['top_menu']['guides_mode'] == f ? (pp['interface']['root']['$refs']['top_menu']['guides_mode'] = 0x0,
            sc['set_guides_mode'](0x0)) : (pp['interface']['root']['$refs']['top_menu']['guides_mode'] = f,
            sc['set_guides_mode'](f));
        },
        'clear_guides': function() {
            pp['interface']['root']['$emit']('yn_modal_show', {
                'heading': pp['interface']['root']['lang']('confirm_action'),
                'body': pp['interface']['root']['lang']('clear_guides'),
                'callback': () => {
                    sc['clear_guides']();
                }
            });
        },
        'change_guides_visible': function(f) {
            sc['set_guides_visible'](null == project_settings['guides_visible'] ? 0x1 : project_settings['guides_visible']);
        },
        'undo': function() {
            undo_action(),
            pp['interface']['root']['$refs']['top_menu']['undo_active'] = 0x0 < undo_list['length'];
        },
        'redo': function() {
            redo_action(),
            pp['interface']['root']['$refs']['top_menu']['redo_active'] = 0x0 < redo_list['length'];
        },
        'show_cart': function() {
            'function' == typeof c_show_cart ? c_show_cart() : pp['interface']['root']['show_accessories'](0x1, 0x0);
        },
        'show_discount': function() {
            0x1 == pp['interface']['root']['$refs']['top_menu']['discount_visible'] ? pp['interface']['root']['$refs']['top_menu']['discount_visible'] = 0x0 : pp['interface']['root']['$refs']['top_menu']['discount_visible'] = 0x1;
        },
        'change_disc': function(e) {
            clearTimeout(pp['interface']['root']['$refs']['top_menu']['debounce']),
            pp['interface']['root']['$refs']['top_menu']['debounce'] = setTimeout( () => {
                var f = parseFloat(e['target']['value']);
                project_settings['discount'] = f,
                sc['get_price']();
            }
            , 0x258);
        },
        'show_services': function() {
            pp['interface']['root']['$emit']('services_modal_show');
        },
        'change_common'(f) {
            pp['interface']['root']['$refs']['top_menu']['common_mode'] != f && (pp['interface']['root']['$refs']['top_menu']['common_mode']['active'] = f,
            pp['interface']['root']['$refs']['top_menu']['common_mode']['active'] ? location['href'] = location['href'] + '?forced_common=1' : location['href'] = location['href']['replace']('?forced_common=1', ''));
        },
        'set_ceiling_visible'(f) {
            room['ceiling']['visible'] = f;
        },
        'set_floor_visible'(f) {
            room['floor']['visible'] = f;
        },
        'set_walls_visible'(f) {
            room['left_wall']['visible'] = f,
            room['right_wall']['visible'] = f,
            room['front_wall']['visible'] = f,
            room['back_wall']['visible'] = f,
            set_shafts_visible(f);
        },
        'change_shadow'(f) {
            room['light1']['castShadow'] = f,
            room['directionalLight']['castShadow'] = f;
        },
        'comments_toggle'(f) {
            sc['comments_toggle'](f);
        }
    },
    'left': [{
        'id': 'top_menu_undo',
        'title': 'undo',
        'disabled': '!(top_menu.undo_active)',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_back',
        'action': function() {
            pp['top_menu']['functions']['undo']();
        }
    }, {
        'id': 'top_menu_redo',
        'title': 'redo',
        'disabled': '!(top_menu.redo_active)',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_forward',
        'action': function() {
            pp['top_menu']['functions']['redo']();
        }
    }, {
        'id': '',
        'type': 'separate_line_v'
    }, {
        'id': 'top_menu_catalog',
        'title': '',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_catalog',
        'v_if': 'top_menu.common_mode.available\x20==\x201',
        'children': [{
            'text': 'shop_mode_label',
            'type': null,
            'i_class': 'icon\x20icon_catalog',
            'action': function(f) {
                pp['top_menu']['functions']['change_common'](!0x1);
            }
        }, {
            'text': 'common_mode_label',
            'type': null,
            'i_class': 'icon\x20icon_catalog',
            'action': function(f) {
                pp['top_menu']['functions']['change_common'](!0x0);
            }
        }]
    }, {
        'id': 'top_menu_projects',
        'title': '',
        'i_class': 'p_icon\x20t_bck_hover\x20t_color_hover\x20rounded\x20icon_projects',
        'action': function() {
            pp['top_menu']['functions']['guess']();
        },
        'children': [{
            'text': 'new_project',
            'type': null,
            'i_class': 'icon\x20icon_new_project',
            'action': function() {
                pp['top_menu']['functions']['new_project']();
            }
        }, {
            'id': 'load_proj_input',
            'text': 'load_project',
            'type': 'file',
            'ref': 'project_file',
            'accept': global_options['save_file_ext'] + ',' + global_options['save_file_zip'],
            'i_class': 'icon\x20icon_your_project',
            'input_change': function(f) {
                pp['top_menu']['functions']['load_project'](f);
            }
        }, {
            'text': 'save_project',
            'type': null,
            'i_class': 'icon\x20icon_save_project',
            'action': function() {
                pp['top_menu']['functions']['save_project']();
            }
        }]
    }, {
        'id': 'top_menu_tabletop',
        'title': '',
        'i_class': 'p_icon\x20t_bck_hover\x20t_color_hover\x20rounded\x20icon_edit',
        'action': 0x1,
        'children': [{
            'text': 'tabletop_cut_mode',
            'type': null,
            'i_class': 'icon\x20icon_bardesk',
            'action': function() {
                pp['top_menu']['functions']['toggle_tabletop_cut_mode']();
            }
        }],
        'mode_elements': [{
            'id': '',
            'type': null,
            'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_indentation_depth',
            'action': function(f) {
                pp['top_menu']['functions']['set_tabletop_cut_mode'](0x1);
            },
            'v_if': 'top_menu.tabletop_cut_mode',
            'v_model': null
        }, {
            'id': '',
            'type': null,
            'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_add',
            'action': function(f) {
                pp['top_menu']['functions']['set_tabletop_cut_mode'](0x2);
            },
            'v_if': 'top_menu.tabletop_cut_mode',
            'v_model': null
        }, {
            'id': '',
            'type': null,
            'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_eraser',
            'action': function(f) {
                pp['top_menu']['functions']['set_tabletop_cut_mode'](0x3);
            },
            'v_if': 'top_menu.tabletop_cut_mode',
            'v_model': null
        }, {
            'id': '',
            'v_if': 'top_menu.tabletop_cut_mode',
            'type': 'separate_line_v'
        }, {
            'id': '',
            'type': null,
            'i_class': 'close_icon\x20\x20icon_close',
            'class': 'p5\x20flex_row\x20flex_vcenter',
            'action': function(f) {
                pp['top_menu']['functions']['set_tabletop_cut_mode'](0x0);
            },
            'v_if': 'top_menu.tabletop_cut_mode',
            'v_model': null
        }]
    }, {
        'id': 'top_menu_edges',
        'title': '',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_filter',
        'action': 0x1,
        'children': [{
            'text': 'edges_mode',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['edges_mode'](f);
            }
        }, {
            'text': 'transparent_edges',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['edges_transparent'](f);
            }
        }, {
            'text': 'objects_numbers',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['numbers_mode'](f);
            }
        }, {
            'id': '',
            'type': 'separate_line_h'
        }, {
            'text': 'no_sizes',
            'type': 'checkbox',
            'group': 'sizes_group',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['sizes_mode']('no');
            }
        }, {
            'text': 'basic_sizes',
            'type': 'checkbox',
            'group': 'sizes_group',
            'class': 'p_checkbox',
            'v_model': !0x0,
            'action': function(f) {
                pp['top_menu']['functions']['sizes_mode']('basic');
            }
        }, {
            'text': 'all_sizes',
            'type': 'checkbox',
            'group': 'sizes_group',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['sizes_mode']('all');
            }
        }, {
            'id': '',
            'type': 'separate_line_h'
        }, {
            'text': 'kitchen_sizes',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['kitchen_sizes_mode'](f);
            }
        }, {
            'id': '',
            'type': 'separate_line_h'
        }, {
            'text': 'shadows',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['change_shadow'](f);
            }
        }, {
            'id': '',
            'type': 'separate_line_h'
        }, {
            'text': 'comments',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['comments_toggle'](f);
            },
            'v_model': !0x0
        }, {
            'id': '',
            'type': 'separate_line_h'
        }, {
            'text': 'check_intersections',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['intersections_toggle'](f);
            }
        }, {
            'text': 'view_only_mode',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['view_only_toggle'](f);
            }
        }, {
            'text': 'facades_active',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['facades_active_change'](f);
            }
        }]
    }, {
        'id': 'top_menu_camera',
        'title': '',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_view',
        'action': 0x1,
        'children': [{
            'text': 'reset_camera',
            'type': null,
            'action': function() {
                pp['top_menu']['functions']['reset_camera']();
            }
        }, {
            'id': '',
            'type': 'separate_line_h'
        }, {
            'text': 'mode_3d',
            'type': 'checkbox',
            'group': 'projection_group',
            'v_model': !0x0,
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['change_proj']('persp');
            }
        }, {
            'id': '',
            'type': 'separate_line_h'
        }, {
            'text': 'top_projection',
            'type': 'checkbox',
            'group': 'projection_group',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['change_proj']('top');
            }
        }, {
            'text': 'front_wall_projection',
            'type': 'checkbox',
            'group': 'projection_group',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['change_proj']('front');
            }
        }, {
            'text': 'back_wall_projection',
            'type': 'checkbox',
            'group': 'projection_group',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['change_proj']('back');
            }
        }, {
            'text': 'left_wall_projection',
            'type': 'checkbox',
            'group': 'projection_group',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['change_proj']('left');
            }
        }, {
            'text': 'right_wall_projection',
            'type': 'checkbox',
            'group': 'projection_group',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['change_proj']('right');
            }
        }]
    }, {
        'id': 'top_menu_filter',
        'title': '',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_filter_alt',
        'action': 0x1,
        'children': [{
            'text': 'tabletop',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                set_tabletop_visible(f);
            },
            'v_model': !0x0
        }, {
            'text': 'facades',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                set_facades_visible(f);
            },
            'v_model': !0x0
        }, {
            'text': 'top_modules',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                set_modules_visible('top', f);
            },
            'v_model': !0x0
        }, {
            'text': 'bottom_modules',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                set_modules_visible('bottom', f);
            },
            'v_model': !0x0
        }, {
            'text': 'communications',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                set_models_visible('Comms', f);
            },
            'v_model': !0x0
        }, {
            'text': 'interior',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                set_models_visible('Other', f);
            },
            'v_model': !0x0
        }, {
            'text': 'tech',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                set_models_visible('Tech', f);
            },
            'v_model': !0x0
        }, {
            'text': 'ceiling',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['set_ceiling_visible'](f);
            },
            'v_model': !0x0
        }, {
            'text': 'walls',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['set_walls_visible'](f);
            },
            'v_model': !0x0
        }, {
            'text': 'floor',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['set_floor_visible'](f);
            },
            'v_model': !0x0
        }]
    }, {
        'id': 'top_menu_rulers',
        'title': '',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_sizes',
        'action': 0x1,
        'children': [{
            'text': 'add_multi_ruler',
            'type': null,
            'class': 'p_checkbox',
            'action': function(f, g) {
                pp['top_menu']['functions']['set_ruler_mode'](0x1);
            }
        }, {
            'text': 'clear_ruler',
            'type': null,
            'class': 'p_checkbox',
            'action': function(f, g) {
                pp['top_menu']['functions']['set_ruler_mode'](0x2, 0x0);
            }
        }, {
            'text': 'rulers_visible',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['change_rulers_visible'](f);
            }
        }, {
            'id': '',
            'type': 'separate_line_h'
        }, {
            'text': 'clear_rulers',
            'type': null,
            'i_class': 'icon\x20icon_trash',
            'class': 't_bck_hover\x20t_color_hover\x20cp',
            'action': function() {
                pp['top_menu']['functions']['clear_rulers']();
            }
        }],
        'mode_elements': [{
            'id': '',
            'type': null,
            'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_add',
            'action': function() {
                pp['top_menu']['functions']['set_ruler_mode'](0x1);
            },
            'v_if': 'top_menu.ruler_mode',
            'v_model': null
        }, {
            'id': '',
            'type': null,
            'class': 'p5\x20flex_row\x20flex_vcenter',
            'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_eraser',
            'action': function() {
                pp['top_menu']['functions']['set_ruler_mode'](0x2);
            },
            'v_if': 'top_menu.ruler_mode',
            'v_model': null
        }, {
            'id': '',
            'v_if': 'top_menu.ruler_mode',
            'type': 'separate_line_v'
        }, {
            'id': '',
            'type': null,
            'i_class': 'close_icon\x20\x20icon_close',
            'class': 'p5\x20flex_row\x20flex_vcenter',
            'action': function() {
                pp['top_menu']['functions']['set_ruler_mode'](0x0);
            },
            'v_if': 'top_menu.ruler_mode',
            'v_model': null
        }]
    }, {
        'id': 'top_menu_grid',
        'title': '',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_setka',
        'action': 0x1,
        'children': [{
            'text': 'grid_mode',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['set_grid_mode'](0x1);
            },
            'v_model': 'top_menu.grid_mode'
        }, {
            'text': 'guide_add_multi',
            'type': null,
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['set_guides_mode'](0x1);
            }
        }, {
            'text': 'guide_clear',
            'type': null,
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['set_guides_mode'](0x3);
            }
        }, {
            'text': 'guides_visible',
            'type': 'checkbox',
            'class': 'p_checkbox',
            'action': function(f) {
                pp['top_menu']['functions']['change_guides_visible'](f);
            },
            'v_model': 'top_menu.guides_visible'
        }, {
            'text': 'clear_guides',
            'type': null,
            'i_class': 'icon\x20icon_trash',
            'class': 't_bck_hover\x20t_color_hover\x20cp',
            'action': function() {
                pp['top_menu']['functions']['clear_guides']();
            }
        }],
        'mode_elements': [{
            'id': '',
            'type': null,
            'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_flipx',
            'action': function(f) {
                pp['top_menu']['functions']['set_guides_mode'](0x1);
            },
            'v_if': 'top_menu.guides_mode',
            'v_model': null
        }, {
            'id': '',
            'type': null,
            'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_flipy',
            'action': function(f) {
                pp['top_menu']['functions']['set_guides_mode'](0x2);
            },
            'v_if': 'top_menu.guides_mode',
            'v_model': null
        }, {
            'id': '',
            'type': null,
            'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_eraser',
            'action': function(f) {
                pp['top_menu']['functions']['set_guides_mode'](0x3);
            },
            'v_if': 'top_menu.guides_mode',
            'v_model': null
        }, {
            'id': '',
            'v_if': 'top_menu.guides_mode',
            'type': 'separate_line_v'
        }, {
            'id': '',
            'type': null,
            'i_class': 'close_icon\x20\x20icon_close',
            'class': 'p5\x20flex_row\x20flex_vcenter',
            'action': function(f) {
                pp['top_menu']['functions']['set_guides_mode'](0x0);
            },
            'v_if': 'top_menu.guides_mode',
            'v_model': null
        }, {
            'id': '',
            'type': 'symbol',
            'symbol': 'X:',
            'v_if': 'top_menu.grid_mode'
        }, {
            'id': '',
            'type': 'number',
            'input_class': 'top_menu_input',
            'min': '10',
            'i_class': null,
            'input_change': function(f, g) {
                pp['top_menu']['functions']['set_grid']('x', g);
            },
            'v_if': 'top_menu.grid_mode',
            'v_model': global_options['grid']['grid_x']
        }, {
            'id': '',
            'type': 'symbol',
            'symbol': 'Z:',
            'v_if': 'top_menu.grid_mode'
        }, {
            'id': '',
            'type': 'number',
            'input_class': 'top_menu_input',
            'min': '10',
            'i_class': null,
            'input_change': function(f, g) {
                pp['top_menu']['functions']['set_grid']('z', g);
            },
            'v_if': 'top_menu.grid_mode',
            'v_model': global_options['grid']['grid_z']
        }, {
            'id': '',
            'type': null,
            'i_class': 'close_icon\x20\x20icon_close',
            'class': 'p5\x20flex_row\x20flex_vcenter',
            'action': function(f) {
                pp['top_menu']['functions']['set_grid_mode'](0x0);
            },
            'v_if': 'top_menu.grid_mode',
            'v_model': null
        }]
    }, {
        'id': 'top_menu_export_3d',
        'title': '',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_box',
        'action': 0x1,
        'children': [{
            'text': 'export_to_obj',
            'type': null,
            'i_class': 'icon\x20icon_file_obj',
            'class': 't_bck_hover\x20t_color_hover\x20cp',
            'action': function(f) {
                pp['top_menu']['functions']['export_model']('obj');
            }
        }, {
            'text': 'export_to_gltf',
            'type': null,
            'i_class': 'icon\x20icon_file_gltf',
            'class': 't_bck_hover\x20t_color_hover\x20cp',
            'action': function(f) {
                pp['top_menu']['functions']['export_model']('gltf');
            }
        }, {
            'text': 'export_to_glb',
            'type': null,
            'i_class': 'icon\x20icon_file_gib',
            'class': 't_bck_hover\x20t_color_hover\x20cp',
            'action': function(f) {
                pp['top_menu']['functions']['export_model']('glb');
            }
        }, {
            'text': 'export_to_dae',
            'type': null,
            'i_class': 'icon\x20icon_file_dae',
            'class': 't_bck_hover\x20t_color_hover\x20cp',
            'action': function(f) {
                pp['top_menu']['functions']['export_model']('dae');
            }
        }]
    }, {
        'id': '',
        'type': 'separate_line_v'
    }, {
        'id': '',
        'title': '',
        'type': null,
        'class': '{t_color_selected:\x20is_fullscreen\x20!=\x200,\x20t_bck_color2:\x20is_fullscreen\x20!=\x200}',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_expand',
        'action': function() {
            pp['top_menu']['functions']['fullscreen']();
        }
    }, {
        'id': '',
        'title': 'mode',
        'type': null,
        'text': 'colorpicker_notice',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20\x20icon_fill',
        'i_class_2': 'close_icon\x20\x20icon_close',
        'class': 'p5\x20flex_row\x20flex_vcenter',
        'action': function() {
            pp['top_menu']['functions']['close_colorpicker']();
        },
        'v_if': 'top_menu.colorpicker_notice',
        'v_model': null
    }],
    'right': [{
        'id': 'top_menu_info',
        'title': '',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_info',
        'action': function() {
            pp['top_menu']['functions']['show_info_modal']();
        }
    }, {
        'id': 'top_menu_project_comments',
        'title': '',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_comments',
        'action': function() {
            pp['top_menu']['functions']['show_comments_modal']();
        }
    }, {
        'id': 'top_menu_print',
        'title': '',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_print',
        'children': [{
            'text': 'open_pdf_new_tab',
            'type': 'type',
            'i_class': 'icon\x20icon_open_pdf',
            'action': function() {
                pp['top_menu']['functions']['pdf_new_tab']();
            }
        }, {
            'text': 'download_pdf',
            'type': 'type',
            'i_class': 'icon\x20icon_download_pdf',
            'action': function() {
                pp['top_menu']['functions']['pdf_download']();
            }
        }, {
            'text': 'download_excel',
            'type': 'type',
            'i_class': 'icon\x20icon_download_pdf',
            'action': function() {
                pp['top_menu']['functions']['xls_download']();
            }
        }, {
            'text': 'save_screenshot',
            'type': 'type',
            'i_class': 'icon\x20icon_img',
            'action': function() {
                pp['top_menu']['functions']['screenshot']();
            }
        }, {
            'text': 'custom_screenshot',
            'type': 'type',
            'i_class': 'icon\x20icon_img',
            'action': function() {
                pp['top_menu']['functions']['custom_screenshot']();
            }
        }]
    }, {
        'id': '',
        'title': '',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_materials',
        'action': function() {
            pp['top_menu']['functions']['show_project_materials']();
        },
        'v_if': 'top_menu.show_specs\x20==\x201'
    }, {
        'id': 'top_menu_accessories_cart',
        'title': '',
        'class': 'cart_count',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_basket',
        'count': 'cart_count',
        'update_count': 'cart_update',
        'action': function() {
            pp['top_menu']['functions']['show_cart']();
        },
        'v_if': function(f) {
            return 0x1 == f['$root']['$cs']['components']['accessories_component'];
        }
    }, {
        'id': 'top_menu_services',
        'title': '',
        'class': 'cart_count',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_list',
        'count': 'services_count',
        'update_count': 'update_services_count',
        'action': function() {
            pp['top_menu']['functions']['show_services']();
        },
        'v_if': '$root.$cs.components.services'
    }, {
        'id': 'top_menu_discount',
        'title': '',
        'type': 'number',
        'input_class': 'disc_input_div',
        'input_change': function(f) {
            pp['top_menu']['functions']['change_disc'](f);
        },
        'input_symbol': '%',
        'show_input': 'discount_visible',
        'min': '0',
        'max': '100',
        'class': 'discount_count',
        'i_class': 'p_icon\x20t_bck_hover\x20rounded\x20icon_percent',
        'count': 'discount_count',
        'update_count': 'update_discount',
        'action': function() {
            pp['top_menu']['functions']['show_discount']();
        },
        'v_if': '$root.$cs.components.discount'
    }]
},
interface_components_init['push'](function() {
    Vue['component']('background_360', {
        'template': '#background_360_template',
        'props': {
            'heading': {
                'type': String,
                'default': ''
            },
            'selected': {
                'type': [String, Number],
                'default': 0x0
            },
            'mode': {
                'type': String,
                'default': 'c'
            },
            'delay': {
                'type': Number,
                'default': 'undefined' == typeof input_delay ? 0x1f4 : input_delay
            },
            'method': {
                'type': String,
                'default': 'project'
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                'expanded': !0x1,
                'active': !0x1,
                'scale': 0x1388,
                'radius': 0x1388,
                'height': 0x2ee,
                'offset_x': 0x0,
                'offset_z': 0x0,
                'l_selected': 0x0,
                'l_mode': '',
                'debounce': null
            };
        },
        'watch': {},
        'created': function() {
            this['l_selected'] = project_settings['background']['id'],
            this['active'] = project_settings['background']['active'],
            this['l_mode'] = this['mode'];
        },
        'methods': {
            async 'change_param'(f) {
                'active' == f && (this['active'] ? sc['show_360']() : sc['hide_360']()),
                'scale' == f && global_options['env'] && global_options['env']['scale']['setScalar'](this['scale']),
                'radius' == f && global_options['env'] && (global_options['env']['radius'] = this['radius']),
                'height' == f && global_options['env'] && (global_options['env']['height'] = this['height']),
                'offset_x' == f && global_options['env'] && (global_options['env']['offset_x'] = -this['offset_x']),
                'offset_z' == f && global_options['env'] && (global_options['env']['offset_z'] = -this['offset_z']);
            },
            'expand_panel': function() {
                this['expanded'] = !this['expanded'],
                this['$root']['$emit']('expand_panel', this['expanded']);
            },
            'select_item': async function(f) {
                this['active'] = !0x0,
                sc['show_360'](f);
            },
            'find_item': function(f) {
                this['$refs']['catalog']['check_scroll'](),
                this['l_mode'] = 'c';
            }
        }
    });
}),
interface_components_init['push'](function() {
    Vue['component']('accessories_component', {
        'template': '#accessories_component_template',
        'created': async function() {
            let e = this;
            this['$options']['catalog'] = {},
            e['$root']['$on']('init_accessories', function(f) {
                e['$options']['catalog'] = f['catalog'],
                e['$forceUpdate'](),
                e['selected_cat'] = -0x1,
                Vue['set'](e, 'cart', f['cart']);
            }),
            e['$root']['$on']('show_accessories', function(f) {
                e['to_module'] = f['to_module'],
                e['mode'] = f['mode'],
                e['visible'] = 0x1;
            }),
            e['$root']['$on']('remove_accessories', function(f) {
                e['remove_cart_item'](f['item'], f['obj_id']);
            }),
            e['$root']['$on']('clear_cart', function(f) {
                e['clear_cart']();
            }),
            e['$root']['$on']('set_cart', function(f) {
                Vue['set'](e, 'cart', f),
                e['cart_update']();
            }),
            e['$root']['$on']('add_cart_item', function(f, g, h=!0x1) {
                h && (e['to_module'] = h),
                e['add_cart_item'](f, null, g);
            });
        },
        'computed': {
            'computed_items': function() {
                var f = [];
                if (0x0 < this['tags']['length']) {
                    for (let g = 0x0; g < this['$options']['catalog']['tree'][this['selected_cat']]['items']['length']; g++)
                        for (let h = this['tags']['length']; h--; )
                            -0x1 < this['$options']['catalog']['items'][this['$options']['catalog']['tree'][this['selected_cat']]['items'][g]]['tags']['indexOf'](this['tags'][h]) && f['push'](this['$options']['catalog']['tree'][this['selected_cat']]['items'][g]);
                } else {
                    for (let i = 0x0; i < this['$options']['catalog']['tree'][this['selected_cat']]['items']['length']; i++)
                        f['push'](this['$options']['catalog']['tree'][this['selected_cat']]['items'][i]);
                }
                return f;
            }
        },
        'data': function() {
            return {
                'visible': 0x0,
                'selected_cat': -0x1,
                'selected_item': 0x0,
                'mode': 0x1,
                'to_module': 0x0,
                'accessories': {},
                'items': [],
                'tags': [],
                'cart': {
                    'items': [],
                    'custom_items': [],
                    'accessories': [],
                    'total_price': 0x0
                },
                'catalog': {
                    'tree': {}
                },
                'custom_add_visible': 0x0,
                'custom_item': {
                    'name': '',
                    'code': '',
                    'count': 0x1,
                    'price': 0x0
                }
            };
        },
        'methods': {
            'add_cart_item': function(f, g, h=!0x1) {
                let j = 0x0;
                if (j = !0x1 !== h ? h : parseInt(g['target']['parentElement']['getElementsByTagName']('input')[0x0]['value']),
                0x0 != this['to_module']) {
                    let l = -0x1;
                    for (let m = this['cart']['accessories']['length']; m--; )
                        this['cart']['accessories'][m]['obj_id'] == this['to_module'] && this['cart']['accessories'][m]['id'] == f['id'] && (l = m);
                    var h = get_module_with_obj_id(this['to_module']), k;
                    -0x1 < l ? this['cart']['accessories'][l]['count'] += j : ((k = copy_object(f))['count'] = j,
                    k['obj_id'] = this['to_module'],
                    k['num'] = h['pdf_number'],
                    this['cart']['accessories']['push'](k)),
                    h['add_accessories'](f, j);
                } else {
                    let n = -0x1;
                    for (let p = this['cart']['accessories']['length']; p--; )
                        this['cart']['accessories'][p]['id'] != f['id'] || this['cart']['accessories'][p]['obj_id'] || (n = p);
                    var k;
                    -0x1 < n ? this['cart']['accessories'][n]['count'] += j : ((k = copy_object(f))['count'] = j,
                    this['cart']['accessories']['push'](k));
                }
                this['cart_update'](),
                interface_version && 0x2 == interface_version || flyToElement($(g['target']['parentElement']['parentElement']), document['getElementsByClassName']('top_cart_count')[0x0]);
            },
            'add_cart_custom_item': function() {
                this['custom_add_visible'] = 0x0;
                var e = copy_object(this['custom_item']);
                e['price'] = parseFloat(e['price']),
                e['count'] = parseFloat(e['count']),
                this['cart']['custom_items']['push'](e),
                this['custom_item']['name'] = '',
                this['custom_item']['code'] = '',
                this['custom_item']['count'] = 0x1,
                this['custom_item']['price'] = 0x0,
                this['cart_update']();
            },
            'cancel_custom_item': function() {
                this['custom_add_visible'] = 0x0,
                this['custom_item']['name'] = '',
                this['custom_item']['code'] = '',
                this['custom_item']['count'] = 0x1,
                this['custom_item']['price'] = 0x0;
            },
            'remove_custom_item': function(e) {
                this['cart']['custom_items']['splice'](e, 0x1),
                this['cart_update']();
            },
            'remove_cart_item': function(f, g) {
                g ||= f['obj_id'];
                for (let i = this['cart']['accessories']['length']; i--; ) {
                    var h;
                    this['cart']['accessories'][i]['id'] === f['id'] && (g ? this['cart']['accessories'][i]['obj_id'] === g && ((h = get_module_with_obj_id(this['cart']['accessories'][i]['obj_id'])) && h['remove_accessory'](this['cart']['accessories'][i]['id']),
                    this['cart']['accessories']['splice'](i, 0x1)) : this['cart']['accessories'][i]['obj_id'] || this['cart']['accessories']['splice'](i, 0x1));
                }
                this['cart_update']();
            },
            'cart_update': function() {
                var f = module_utils['get_price_mod']('acc');
                let g = 0x0
                  , h = 0x0
                  , j = 0x0;
                for (let m = 0x0; m < this['cart']['items']['length']; m++)
                    g += this['cart']['items'][m]['total'],
                    h += this['cart']['items'][m]['count'],
                    this['cart']['items'][m]['price_pm'] = this['cart']['items'][m]['price'] * f,
                    this['cart']['items'][m]['total_pm'] = this['cart']['items'][m]['total'] * f,
                    j += this['cart']['items'][m]['total_pm'];
                for (let n = 0x0; n < this['cart']['accessories']['length']; n++) {
                    var k = module_utils['get_price_mod']('acc', null, this['cart']['accessories'][n]['category']);
                    void 0x0 !== this['cart']['accessories'][n]['Regular\x20price'] && (this['cart']['accessories'][n]['price'] = cart['accessories'][n]['Regular\x20price']),
                    this['cart']['accessories'][n]['total'] = correct_price(this['cart']['accessories'][n]['price']) * this['cart']['accessories'][n]['count'],
                    g += correct_price(this['cart']['accessories'][n]['price']) * this['cart']['accessories'][n]['count'],
                    h += this['cart']['accessories'][n]['count'],
                    this['cart']['accessories'][n]['price_pm'] = this['cart']['accessories'][n]['price'] * k,
                    this['cart']['accessories'][n]['total_pm'] = this['cart']['accessories'][n]['total'] * k,
                    j += this['cart']['accessories'][n]['total_pm'];
                }
                for (let p = 0x0; p < this['cart']['custom_items']['length']; p++)
                    this['cart']['custom_items'][p]['total'] = this['cart']['custom_items'][p]['price'] * this['cart']['custom_items'][p]['count'],
                    g += this['cart']['custom_items'][p]['price'] * this['cart']['custom_items'][p]['count'],
                    h += this['cart']['custom_items'][p]['count'],
                    this['cart']['custom_items'][p]['price_pm'] = this['cart']['custom_items'][p]['price'] * f,
                    this['cart']['custom_items'][p]['total_pm'] = this['cart']['custom_items'][p]['total'] * f,
                    j += this['cart']['custom_items'][p]['total_pm'];
                this['cart']['total'] = g,
                this['cart']['total_price'] = g,
                this['cart']['total_price_pm'] = j,
                this['cart']['count'] = h;
                var l = document['getElementsByClassName']('top_cart_count');
                l['length'] && (l[0x0]['innerHTML'] = h),
                this['$root']['$emit']('cart_update', h),
                get_total_price_test();
            },
            'clear_cart': function() {
                for (let e = this['cart']['accessories']['length']; e--; )
                    this['cart']['accessories']['splice'](e, 0x1);
                this['cart']['custom_items']['length'] = 0x0,
                this['cart_update']();
            },
            'get_first_image': function(f) {
                var g;
                return null == f ? '' : f['split'](',')[0x0];
            },
            'get_images': function(e) {
                return null == e ? '' : e['split'](',');
            },
            'tag_click': function(f) {
                var g = this['tags']['indexOf'](f);
                -0x1 < g ? this['tags']['splice'](g, 0x1) : this['tags']['push'](f);
            },
            'get_data': function() {},
            'lang': function(e) {
                return lang[e];
            },
            'format_price': function(e) {
                return format_price(e);
            }
        }
    });
}),
interface_components_init['push'](function() {
    Vue['component']('cart', {
        'template': '#cart_new_template',
        'props': {
            'mode': {
                'type': String,
                'default': 'p'
            },
            'mod_id': {
                'type': String,
                'default': null
            }
        },
        'mixins': [],
        'data': function() {
            return {
                'cart': {
                    'items': [],
                    'custom_items': [],
                    'accessories': [],
                    'total_price': 0x0
                },
                'l_mode': '',
                'selected_cat': -0x1,
                'selected_item': 0x0,
                'search': '',
                'tags': [],
                'tags_hash': {},
                'add_mode': 'cart',
                'module_id': null,
                'custom_add_visible': 0x0,
                'custom_item': {
                    'name': '',
                    'code': '',
                    'count': 0x1,
                    'price': 0x0
                },
                'is_enough': !0x0,
                'is_excluded': !0x1
            };
        },
        'watch': {},
        'computed': {
            'computed_items': function() {
                let f = [];
                if ('' == this['search']) {
                    if (0x0 < this['tags']['length']) {
                        for (let k = 0x0; k < this['$options']['catalog']['tree'][this['selected_cat']]['items']['length']; k++)
                            for (let l = this['tags']['length']; l--; )
                                -0x1 < this['$options']['catalog']['items'][this['$options']['catalog']['tree'][this['selected_cat']]['items'][k]]['tags']['indexOf'](this['tags'][l]) && f['push'](this['$options']['catalog']['tree'][this['selected_cat']]['items'][k]);
                    } else {
                        for (let m = 0x0; m < this['$options']['catalog']['tree'][this['selected_cat']]['items']['length']; m++)
                            f['push'](this['$options']['catalog']['tree'][this['selected_cat']]['items'][m]);
                    }
                } else {
                    let n = this['search']['toLowerCase']();
                    if (-0x1 < this['selected_cat']) {
                        var g = this['$options']['catalog']['tree'][this['selected_cat']]['items']
                          , h = this['$options']['catalog']['items'];
                        for (let o = 0x0; o < g['length']; o++) {
                            var j = h[g[o]];
                            if (-0x1 < j['name']['toLowerCase']()['indexOf'](n) || -0x1 < j['code']['toLowerCase']()['indexOf'](n)) {
                                if (0x0 < this['tags']['length']) {
                                    for (let p = this['tags']['length']; p--; )
                                        -0x1 < j['tags']['indexOf'](this['tags'][p]) && f['push'](g[o]);
                                } else
                                    f['push'](g[o]);
                            }
                        }
                    } else
                        Object['keys'](this['$options']['catalog']['items'])['forEach'](q => {
                            var r = this['$options']['catalog']['items'][q];
                            (-0x1 < r['name']['toLowerCase']()['indexOf'](n) || -0x1 < r['code']['toLowerCase']()['indexOf'](n)) && f['push'](q);
                        }
                        );
                }
                return f;
            },
            'cat_name': function() {
                if (-0x1 < this['selected_cat'])
                    return this['$options']['catalog']['tree'][this['selected_cat']]['category'];
            },
            'item_name': function() {
                if (0x0 < this['selected_item'])
                    return this['$options']['catalog']['items'][this['selected_item']]['name'];
            }
        },
        'created': function() {
            this['module_id'] = this['mod_id'],
            this['$options']['catalog'] = accsessories_data,
            Vue['set'](this, 'cart', cart),
            this['selected_cat'] = -0x1,
            this['selected_item'] = 0x0,
            this['$root']['$on']('cart_update', this['update_ref_count']),
            this['$root']['$on']('clear_cart', () => {
                this['clear_cart']();
            }
            ),
            this['$nextTick']( () => {
                this['set_panel_height']();
            }
            ),
            this['l_mode'] = this['mode'];
        },
        'mounted': function() {
            this['update_items']();
        },
        'methods': {
            'tag_click'(f) {
                if (this['tags_hash'][f]) {
                    Vue['delete'](this['tags_hash'], f);
                    for (let g = this['tags']['length']; g--; )
                        this['tags'][g] == f && this['tags']['splice'](g, 0x1);
                } else
                    Vue['set'](this['tags_hash'], f, 0x1),
                    this['tags']['push'](f);
                this['set_panel_height']();
            },
            'do_search': function(f) {
                clearTimeout(this['debounce']);
                let g = this;
                this['debounce'] = setTimeout(function() {
                    g['search'] = f['target']['value'],
                    g['set_panel_height']();
                }, 0x258);
            },
            'clear_search': function() {
                this['$refs']['search_input']['value'] = '',
                this['search'] = '',
                this['set_panel_height']();
            },
            'change_mode'(e) {
                'c' == (this['l_mode'] = e) && this['update_items'](),
                this['set_panel_height']();
            },
            'f_price'(e) {
                return format_price(e);
            },
            'select_cat'(e) {
                this['selected_cat'] = e,
                this['selected_item'] = 0x0,
                Vue['set'](this, 'tags', []),
                Vue['set'](this, 'tags_hash', {}),
                this['set_panel_height']();
            },
            'select_item'(e) {
                this['selected_item'] = e,
                this['set_panel_height']();
            },
            'set_panel_height': function() {
                let f = this['$refs'];
                f['body']['style']['height'] = 'auto',
                this['$nextTick']( () => {
                    setTimeout(function() {
                        if (f['comp_el'] && !f['heading']) {
                            let g = f['comp_el']['parentElement']['offsetHeight'] - f['heading']['offsetHeight'];
                            f['bread'] && (g -= f['bread']['offsetHeight']),
                            f['body']['style']['height'] = g + 'px';
                        }
                    }, 0x64);
                }
                );
            },
            'update_items'() {
                this['cart']['items'] = [],
                this['cart_update']();
            },
            'clear_cart': function() {
                for (let e = this['cart']['accessories']['length']; e--; )
                    this['cart']['accessories']['splice'](e, 0x1);
                this['cart_update']();
            },
            'add_cart_item': function(f, g) {
                var h = parseInt(g['target']['parentElement']['getElementsByTagName']('input')[0x0]['value']), j;
                if (null != this['module_id']) {
                    let l = -0x1;
                    for (let m = this['cart']['accessories']['length']; m--; )
                        this['cart']['accessories'][m]['obj_id'] == this['module_id'] && this['cart']['accessories'][m]['id'] == f['id'] && (l = m);
                    var k = get_module_with_obj_id(this['module_id']), j;
                    -0x1 < l ? this['cart']['accessories'][l]['count'] += h : ((j = copy_object(f))['count'] = h,
                    j['obj_id'] = this['module_id'],
                    this['cart']['accessories']['push'](j)),
                    k['add_accessories'](f, h);
                } else {
                    let n = -0x1;
                    for (let o = this['cart']['accessories']['length']; o--; )
                        this['cart']['accessories'][o]['id'] != f['id'] || this['cart']['accessories'][o]['obj_id'] || (n = o);
                    -0x1 < n ? this['cart']['accessories'][n]['count'] += h : ((j = copy_object(f))['count'] = h,
                    this['cart']['accessories']['push'](j));
                }
                flyToElement(g['target']['parentElement']['parentElement']['parentElement'], this['$refs']['cart_icon']),
                this['cart_update']();
            },
            'remove_cart_item': function(f, g) {
                g ||= f['obj_id'];
                for (let j = this['cart']['accessories']['length']; j--; ) {
                    var h;
                    this['cart']['accessories'][j]['id'] === f['id'] && (g ? this['cart']['accessories'][j]['obj_id'] === g && ((h = get_module_with_obj_id(this['cart']['accessories'][j]['obj_id'])) && h['remove_accessory'](this['cart']['accessories'][j]['id']),
                    this['cart']['accessories']['splice'](j, 0x1)) : this['cart']['accessories'][j]['obj_id'] || this['cart']['accessories']['splice'](j, 0x1));
                }
                this['cart_update']();
            },
            'add_count': function(f, g) {
                var f = this['$refs']['count_input'][f];
                f['value'] = parseInt(f['value']) + parseInt(g),
                0x0 == f['value'] && (f['value'] = 0x1);
            },
            'cart_update': function() {
                var f = module_utils['get_price_mod']('acc');
                let g = 0x0
                  , h = 0x0
                  , j = 0x0;
                for (let m = 0x0; m < this['cart']['items']['length']; m++)
                    g += this['cart']['items'][m]['total'],
                    h += this['cart']['items'][m]['count'],
                    this['cart']['items'][m]['price_pm'] = this['cart']['items'][m]['price'] * f,
                    this['cart']['items'][m]['total_pm'] = this['cart']['items'][m]['total'] * f,
                    j += this['cart']['items'][m]['total_pm'];
                for (let n = 0x0; n < this['cart']['accessories']['length']; n++) {
                    var k = module_utils['get_price_mod']('acc', null, this['cart']['accessories'][n]['category']);
                    void 0x0 !== this['cart']['accessories'][n]['Regular\x20price'] && (this['cart']['accessories'][n]['price'] = cart['accessories'][n]['Regular\x20price']),
                    this['cart']['accessories'][n]['total'] = correct_price(this['cart']['accessories'][n]['price']) * this['cart']['accessories'][n]['count'],
                    g += correct_price(this['cart']['accessories'][n]['price']) * this['cart']['accessories'][n]['count'],
                    h += this['cart']['accessories'][n]['count'],
                    this['cart']['accessories'][n]['price_pm'] = this['cart']['accessories'][n]['price'] * k,
                    this['cart']['accessories'][n]['total_pm'] = this['cart']['accessories'][n]['total'] * k,
                    j += this['cart']['accessories'][n]['total_pm'];
                }
                for (let o = 0x0; o < this['cart']['custom_items']['length']; o++)
                    this['cart']['custom_items'][o]['total'] = this['cart']['custom_items'][o]['price'] * this['cart']['custom_items'][o]['count'],
                    g += this['cart']['custom_items'][o]['price'] * this['cart']['custom_items'][o]['count'],
                    h += this['cart']['custom_items'][o]['count'],
                    this['cart']['custom_items'][o]['price_pm'] = this['cart']['custom_items'][o]['price'] * f,
                    this['cart']['custom_items'][o]['total_pm'] = this['cart']['custom_items'][o]['total'] * f,
                    j += this['cart']['custom_items'][o]['total_pm'];
                this['cart']['total'] = g,
                this['cart']['total_price'] = g,
                this['cart']['total_price_pm'] = j,
                this['cart']['count'] = h;
                var l = document['getElementsByClassName']('top_cart_count');
                l['length'] && (l[0x0]['innerHTML'] = this['cart']['count']),
                this['$root']['$emit']('cart_update', this['cart']['count']),
                this['$nextTick']( () => {
                    this['$refs']['count']['innerHTML'] = this['cart']['count'];
                }
                ),
                sc['get_price']();
            },
            'update_ref_count'() {
                this['$nextTick']( () => this['$refs']['count']['innerHTML'] = this['cart']['count']);
            },
            'get_images': function(e) {
                return e ? e['split'](',') : [];
            },
            'lang': function(e) {
                return this['$root']['lang'](e);
            },
            'get_first_image': function(e) {
                var e;
                return !e || '' == (e = e['split'](','))[0x0] ? '/common_assets/images/no_image.png' : e[0x0];
            },
            'get_tags': function(f) {
                var f = this['$options']['catalog']['items'][f];
                if ('' == f['tags'])
                    return [];
                var g = f['tags']['split'](',');
                for (let h = 0x0; h < g['length']; h++)
                    '' != g && (g[h] = '#' + g[h]);
                return g;
            },
            'add_cart_custom_item': function() {
                this['custom_add_visible'] = 0x0;
                var e = copy_object(this['custom_item']);
                e['price'] = parseFloat(e['price']),
                e['count'] = parseFloat(e['count']),
                this['cart']['custom_items']['push'](e),
                this['custom_item']['name'] = '',
                this['custom_item']['code'] = '',
                this['custom_item']['count'] = 0x1,
                this['custom_item']['price'] = 0x0,
                this['cart_update'](),
                this['set_panel_height']();
            },
            'cancel_custom_item': function() {
                this['custom_add_visible'] = 0x0,
                this['custom_item']['name'] = '',
                this['custom_item']['code'] = '',
                this['custom_item']['count'] = 0x1,
                this['custom_item']['price'] = 0x0;
            },
            'remove_custom_item': function(e) {
                this['cart']['custom_items']['splice'](e, 0x1),
                this['cart_update'](),
                this['set_panel_height']();
            }
        },
        'beforeDestroy'() {
            this['$root']['$off']('cart_update', this['update_ref_count']);
        }
    });
}),
interface_components_init['push'](function() {
    Vue['component']('catalog', {
        'template': '#catalog_template',
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
                'type': [String, Number],
                'default': null
            },
            'selected2': {
                'type': [String, Number],
                'default': null
            },
            'selected_variant': {
                'type': [String, Number],
                'default': null
            },
            'method': {
                'type': String,
                'default': 'project'
            },
            'multiple': {
                'type': [Number, Boolean],
                'default': !0x1
            },
            'is_group': {
                'type': [Number, Boolean],
                'default': 0x0
            },
            'icon_dd_menu': {
                'type': [Number, Boolean],
                'default': 0x0
            },
            'mode': {
                'type': String,
                'default': 'click'
            },
            'picker_enabled': {
                'type': [Boolean, Number],
                'default': !0x1
            },
            'picker_target': {
                'type': String,
                'default': ''
            },
            'cid': {
                'type': String,
                'default': ''
            },
            'hide_variants': {
                'type': [Boolean, Number],
                'default': !0x1
            },
            'params': {
                'type': [Array],
                'default': () => []
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                'cats': [],
                'cats_hash': [],
                'sel': 0x0,
                'sel2': 0x0,
                'variant': 0x0,
                'multi': !0x1,
                'category': 0x0,
                'path': [0x0],
                'l_mode': 'click',
                'l_lib': 'materials',
                'picker_mode': !0x1,
                'picker_item': null,
                'items_mode': !0x1,
                'modules_show_names': 0x0,
                'debounce': null,
                'show_search': !0x1,
                'search': '',
                'no_results': !0x1,
                'dd_menu': {
                    'id': 0x0,
                    'variant': 0x0,
                    'show': !0x1,
                    'pos': {
                        'left': 0x0,
                        'right': 'auto',
                        'top': 'auto',
                        'bottom': 'auto'
                    }
                },
                'dd_menu_picker': {
                    'id': 0x0,
                    'variant': 0x0,
                    'show': !0x1,
                    'target': null,
                    'it': null,
                    'items': [],
                    'pos': {
                        'left': 0x0,
                        'right': 'auto',
                        'top': 'auto',
                        'bottom': 'auto'
                    }
                },
                'core_v2': constructor_settings['core_v2'],
                'params_data': []
            };
        },
        'beforeCreate': function() {},
        'created': function() {
            if (this['cr'](),
            this['$options']['elem'] = document['getElementById']('interface'),
            constructor_settings['core_v2']) {
                this['$options']['all_keys'] = [],
                this['$options']['dd_options'] = [{
                    'group': 'all',
                    'text': this['lang']('apply_to_all')
                }];
                var f = pp['libs']['modules_groups'] || [];
                for (let h = 0x0; h < f['length']; h++) {
                    var g = f[h];
                    this['$options']['all_keys']['push'](g['key']),
                    this['$options']['dd_options']['push']({
                        'group': g['key'],
                        'text': this['lang']('apply') + ':\x20' + g['name']
                    });
                }
            }
            this['$root']['$on']('colorpicker_mode_off', () => {
                this['picker_mode'] = !0x1,
                this['picker_item'] = null;
            }
            );
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
                let f = []
                  , g = this;
                return '' == this['search'] ? this['no_results'] = !0x0 : (0x0 == this['category'] ? i(this['$options']['tree']) : i(this['$options']['lib']['categories'][this['category']]),
                this['no_results'] = 0x0 === f['length']),
                f;
                function i(j) {
                    if (j['categories']) {
                        for (let y = 0x0; y < j['categories']['length']; y++)
                            i(j['categories'][y]);
                    }
                    if (j['items']) {
                        var k = g['search']['toLowerCase'](), m = {
                            'group': j['name'],
                            'category': j['id'],
                            'items': []
                        }, p;
                        for (p of j['items']) {
                            let z = 0x0;
                            if (!j['is_height'] || 'catalog' != g['l_lib']) {
                                if (p['name'] && ~p['name']['toLowerCase']()['indexOf'](k) && (z = 0x1),
                                p['code'] && ~p['code']['toLowerCase']()['indexOf'](k) && (z = 0x1),
                                p['params']) {
                                    if (p['params']['variants']) {
                                        for (var q of p['params']['variants'])
                                            q['name'] && -0x1 < q['name']['toLowerCase']()['indexOf'](k) && (z = 0x1),
                                            q['code'] && -0x1 < q['code']['toLowerCase']()['indexOf'](k) && (z = 0x1);
                                    }
                                    if (p['params']['spec']?.['variants']) {
                                        for (var u of p['params']['spec']['variants'])
                                            u['name'] && ~u['name']['toLowerCase']()['indexOf'](k) && (z = 0x1),
                                            u['code'] && ~u['code']['toLowerCase']()['indexOf'](k) && (z = 0x1);
                                    }
                                }
                                if ('tech' == g['l_lib'] || 'comms' == g['l_lib'] || 'interior' == g['l_lib']) {
                                    p['name'] && -0x1 < p['name']['toLowerCase']()['indexOf'](k) && (z = 0x1);
                                    for (let A = 0x0; A < p['variants']['length']; A++) {
                                        var v = p['variants'][A];
                                        v['name'] && -0x1 < v['name']['toLowerCase']()['indexOf'](k) && (z = 0x1),
                                        v['code'] && -0x1 < v['code']['toLowerCase']()['indexOf'](k) && (z = 0x1);
                                    }
                                }
                                if ('catalog' == g['l_lib']) {
                                    p['name'] && -0x1 < p['name']['toLowerCase']()['indexOf'](k) && (z = 0x1);
                                    for (let B = 0x0; B < p['params']['spec']['variants']['length']; B++) {
                                        var w = p['params']['spec']['variants'][B];
                                        w['name'] && -0x1 < w['name']['toLowerCase']()['indexOf'](k) && (z = 0x1),
                                        w['code'] && -0x1 < w['code']['toLowerCase']()['indexOf'](k) && (z = 0x1);
                                    }
                                }
                                if ('handles' == g['l_lib']) {
                                    p['name'] && -0x1 < p['name']['toLowerCase']()['indexOf'](k) && (z = 0x1);
                                    for (let C = 0x0; C < p['sizes']['length']; C++) {
                                        var x = p['sizes'][C];
                                        x['code'] && -0x1 < x['code']['toLowerCase']()['indexOf'](k) && (z = 0x1);
                                    }
                                }
                                0x1 == z && m['items']['push'](p);
                            }
                        }
                        0x0 < m['items']['length'] && f['push'](m);
                    }
                }
            }
        },
        'methods': {
            'get_path'(f) {
                let g = this['cats_hash']
                  , h = [];
                function j(k) {
                    g[k] && (h['unshift']({
                        'id': k,
                        'name': g[k] && g[k]['name']
                    }),
                    void 0x0 !== g[k]['parent_id']) && j(g[k]['parent_id']);
                }
                return j(f['category']),
                h;
            },
            'cr': function() {
                var f = this
                  , g = (this['category'] = 0x0,
                this['show_search'] = !0x1,
                this['search'] = '',
                this['path'] = [0x0],
                {
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
                (('' + this['lib'])['startsWith']('catalogs.') || ('' + this['lib'])['startsWith']('butts.')) && (lib = _['get'](pp['libs'], this['lib'])),
                !this['categories'] || isArray(this['categories']) && 0x0 === this['categories']['length']) {
                    this['cats'] = [];
                    for (let k = 0x0; k < lib['tree']['length']; k++)
                        this['cats']['push'](lib['tree'][k]['id']);
                } else {
                    if ('string' == typeof this['categories'])
                        this['cats'] = copy_object(utils['nested_object']['get'](project_settings, this['categories']));
                    else {
                        if (('' + this['lib'])['startsWith']('catalogs.')) {
                            let l = this['lib']['split']('catalogs.')[0x1];
                            if (this['filtered_key'] = Array['from'](new Set(this['categories']['filter'](m => m['startsWith'](l + '_'))['map'](m => m['split']('_')[0x1]))),
                            0x0 < this['filtered_key']['length'])
                                this['cats'] = this['filtered_key'];
                            else {
                                this['cats'] = [];
                                for (let m = 0x0; m < lib['tree']['length']; m++)
                                    this['cats']['push'](lib['tree'][m]['id']);
                            }
                        } else
                            this['cats'] = this['categories'];
                    }
                }
                if (this['cid'] && /\d/['test'](this['cid'])) {
                    let n = this['cid'];
                    var g, g = (n['includes']('_') ? (g = n['match'](/_(\d+)$/),
                    n = g ? g[0x1] : 0x0) : /[a-zA-Z]/['test'](n) && (this['cats'] = pp['libs']['catalogs_by_key']['' + n]['categories']['map'](o => o['id'])),
                    this['cats'] = [],
                    this['findNodeById'](lib['tree'], n));
                    g && (this['cats'] = [n],
                    this['path'] = this['build_path'](n, lib['tree']));
                } else
                    this['cid'] && ('' + this['lib'])['startsWith']('catalogs.') && 0x0 < this['cid']['length'] && (this['cats'] = pp['libs']['catalogs_by_key']['' + this['cid']]['categories']['map'](o => o['id']));
                'string' == typeof this['selected'] ? this['sel'] = utils['nested_object']['get'](project_settings, this['selected']) : this['sel'] = this['selected'],
                'string' == typeof this['selected2'] ? this['sel2'] = utils['nested_object']['get'](project_settings, this['selected2']) : this['sel2'] = this['selected2'],
                this['multi'] = this['multiple'],
                0x0 == this['multi'] && (this['sel2'] = this['sel']),
                this['variant'] = this['selected_variant'],
                null === this['variant'] && (this['variant'] = 0x0),
                'click' != this['mode'] && (this['multi'] = !0x1,
                this['sel'] = 0x0,
                this['sel2'] = 0x0),
                this['l_mode'] = this['mode'];
                var h = {
                    'id': 0x0,
                    'name': 'Каталог',
                    'active': 0x1,
                    'categories': [],
                    'items': []
                }, g;
                if (this['items'] && this['items']['length']) {
                    this['items_mode'] = !0x0;
                    for (let o = 0x0; o < this['items']['length']; o++)
                        lib['items'][this['items'][o]] && h['items']['push'](lib['items'][this['items'][o]]);
                } else {
                    function p(q, r) {
                        for (var u of q)
                            this['cats']['includes'](u['id']) && r['categories']['push'](u),
                            u['categories'] && p['call'](this, u['categories'], r);
                    }
                    this['items_mode'] = !0x1,
                    p['call'](this, lib['tree'], h);
                }
                this['$options']['tree'] = h,
                this['$options']['lib'] = lib;
                let j = String(this['cid'] || 0x0);
                '0' != j && /\d/['test'](j) ? (j['includes']('_') && (g = j['match'](/_(\d+)$/),
                j = g ? g[0x1] : 0x0),
                Vue['nextTick']( () => {
                    this['select_category'](j);
                }
                )) : 0x1 === this['cats']['length'] && Vue['nextTick']( () => {
                    this['select_category'](this['cats'][0x0]);
                }
                ),
                0x1 == constructor_settings['show_modules_names_in_sizes_select'] && (f['modules_show_names'] = 0x1),
                0x1 == constructor_settings['show_modules_code_in_sizes_select'] && (f['modules_show_code'] = 0x1),
                this['params_data'] = this['params'] ? copy_object(this['params']) : [],
                setTimeout( () => {
                    this['check_scroll']();
                }
                , 0xa);
            },
            'build_path': function(f, g) {
                let h = [];
                function i(k, m) {
                    if (String(k['id']) === String(f))
                        return h = [...m, String(k['id'])];
                    var n, p;
                    for (p of k['categories'] || k['children'] || [])
                        if (i(p, [...m, String(k['id'])]))
                            return 0x1;
                }
                for (var j of g)
                    if (i(j, ['0']))
                        break;
                return h;
            },
            'set_picker_mode': function(f, g) {
                if ('facades' == this['picker_target']) {
                    let h = libs['facades']['items'][f['id']]
                      , j = [];
                    if (Array['isArray'](h['types'])) {
                        for (let k = 0x0; k < h['types']['length']; k++)
                            j['push']({
                                'name': h['types'][k]['name'],
                                'value': k,
                                'radius': h['types'][k]['radius']
                            });
                    } else
                        Object['keys'](h['types'])['forEach'](l => {
                            j['push']({
                                'name': h['types'][l]['name'],
                                'value': l,
                                'radius': h['types'][l]['radius']
                            });
                        }
                        );
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
                    this['picker_mode'] = !0x1) : (global_options['mouse_mode']['mode'] = 'picker',
                    global_options['mouse_mode']['target'] = this['picker_target'],
                    global_options['mouse_mode']['item_id'] = parseInt(f['id']),
                    global_options['mouse_mode']['el'] = g['target']['closest']('.item')['cloneNode'](),
                    this['$root']['set_colorpicker_mode'](this['picker_target']),
                    this['picker_mode'] = !0x0,
                    this['picker_item'] = f);
            },
            'select_dd_picker': function(f, g) {
                global_options['mouse_mode']['mode'] = 'picker',
                global_options['mouse_mode']['target'] = this['picker_target'],
                global_options['mouse_mode']['item_id'] = parseInt(this['dd_menu_picker']['id']),
                global_options['mouse_mode']['style'] = parseInt(f),
                global_options['mouse_mode']['radius'] = 0x1 == g,
                global_options['mouse_mode']['el'] = this['dd_menu_picker']['target']['cloneNode'](),
                this['$root']['set_colorpicker_mode'](this['picker_target']),
                this['picker_mode'] = !0x0,
                this['picker_item'] = this['dd_menu_picker']['it'],
                this['dd_menu_picker']['show'] = !0x1;
            },
            'set_picker_mode_catalog': function(f, g) {
                this['picker_item'] && f['id'] == this['picker_item']['id'] ? (global_options['mouse_mode']['mode'] = 'drag',
                global_options['mouse_mode']['target'] = null,
                global_options['mouse_mode']['item_id'] = null,
                global_options['mouse_mode']['el'] = null,
                this['picker_item'] = null,
                this['$root']['unset_fill_mode'](),
                this['picker_mode'] = !0x1) : (global_options['mouse_mode']['mode'] = 'picker',
                global_options['mouse_mode']['target'] = this['picker_target'],
                global_options['mouse_mode']['item_id'] = parseInt(f['id']),
                global_options['mouse_mode']['el'] = g['target']['closest']('.item')['cloneNode'](),
                this['picker_mode'] = !0x0,
                Vue['set'](this, 'picker_item', f),
                this['$root']['set_fill_mode']());
            },
            'show_picker': function(e) {
                return !!this['picker_enabled'] && e['params']['spec']['is_fill'];
            },
            'get_tbl_variant': function(e) {
                return 'project' == this['method'] ? e['id'] == project_settings['defaults']['tabletop'] ? project_settings['defaults']['tabletop_variant'] : 0x0 : e['id'] == this['sel'] ? this['variant'] : 0x0;
            },
            'get_variants': function(f) {
                let g = [];
                switch (this['l_lib']) {
                case 'catalog':
                    g = f['params']['spec']['variants'];
                    break;
                default:
                    g = (f['params']['spec'] && (void 0x0 !== f['params']['spec']['variant'] || this['l_lib']['startsWith']('catalogs.') || this['l_lib']['startsWith']('butts.')) ? f['params']['spec'] : f['params'])['variants'];
                }
                return g || [];
            },
            'get_size_value': function(f) {
                var g;
                return void 0x0 === f ? '' : void 0x0 !== (g = pp['temp']['catalog_size_hash'][f]) ? g : f;
            },
            'get_variant_select': function(f, g=null) {
                if (pp['interface']['overrides']['variant_select_format']) {
                    var g = pp['interface']['overrides']['variant_select_format'](f, g);
                    if (!0x1 !== g)
                        return g;
                }
                let h;
                switch (this['l_lib']) {
                case 'catalog':
                    switch (constructor_settings['display_sizes']) {
                    case 'xyz':
                        h = this['get_size_value'](f['size']['x']) + 'x' + this['get_size_value'](f['size']['y']) + 'x' + this['get_size_value'](f['size']['z']) + '\x20' + this['lang']('mm');
                        break;
                    case 'xzy':
                        h = this['get_size_value'](f['size']['x']) + 'x' + this['get_size_value'](f['size']['z']) + 'x' + this['get_size_value'](f['size']['y']) + '\x20' + this['lang']('mm');
                        break;
                    case 'yxz':
                        h = this['get_size_value'](f['size']['y']) + 'x' + this['get_size_value'](f['size']['x']) + 'x' + this['get_size_value'](f['size']['z']) + '\x20' + this['lang']('mm');
                        break;
                    default:
                        h = this['get_size_value'](f['size']['x']) + 'x' + this['get_size_value'](f['size']['y']) + 'x' + this['get_size_value'](f['size']['z']) + '\x20' + this['lang']('mm');
                    }
                    break;
                case 'tabletop':
                    h = (f['thickness'] || 0x0) + '\x20' + this['lang']('mm'),
                    0x1 == this['modules_show_names'] && (h += '\x20' + f['name']),
                    0x1 == this['modules_show_code'] && (h += '\x20' + f['code']);
                    break;
                case 'butts.butts':
                    h = (f['thickness'] || 0x0) + '\x20' + this['lang']('mm'),
                    0x1 == this['modules_show_names'] && (h += '\x20' + f['name']),
                    0x1 == this['modules_show_code'] && (h += '\x20' + f['code']);
                    break;
                default:
                    h = f['size'] ? this['get_size_value'](f['size']['x']) + 'x' + this['get_size_value'](f['size']['y']) + 'x' + this['get_size_value'](f['size']['z']) + '\x20' + this['lang']('mm') : this['get_size_value'](f['width']) + '\x20' + this['lang']('mm'),
                    0x1 == this['modules_show_names'] && (h += '\x20' + f['name']),
                    0x1 == this['modules_show_code'] && (h += '\x20' + f['code']);
                }
                return h;
            },
            'lang': function(e) {
                return this['$root']['lang'](e);
            },
            'select_category': function(f, g=!0x1) {
                0x0 == (this['category'] = f) ? this['path'] = [0x0] : !0x1 !== g ? this['path']['length'] = g + 0x1 : this['path']['includes'](f) || this['path']['push'](f),
                this['check_scroll']();
            },
            'set_path': function(e) {
                e['unshift'](0x0),
                this['path'] = e,
                this['category'] = e[e['length'] - 0x1],
                this['check_scroll']();
            },
            'do_search': function(f) {
                clearTimeout(this['debounce']);
                let g = this;
                this['debounce'] = setTimeout(function() {
                    g['search'] = f['target']['value'],
                    g['check_scroll']();
                }, 0x258);
            },
            'clear_search': function() {
                this['$refs']['search_input']['value'] = '',
                this['search'] = '',
                this['check_scroll']();
            },
            'change_show_search'() {
                this['show_search'] = !this['show_search'],
                this['check_scroll']();
            },
            'check_scroll': function() {
                return !0x1;
            },
            'set_scroll': function() {
                return !0x1;
            },
            'find_item_path': function() {
                let f = this
                  , g = [];
                var h = this['$options']['lib']['items'][this['sel']]['category'];
                function j(k) {
                    f['$options']['lib']['categories'][k]['parent'] && 0x0 != f['$options']['lib']['categories'][k]['parent'] ? (g['unshift'](k),
                    j(f['$options']['lib']['categories'][k]['parent'])) : g['unshift'](k);
                }
                return j(h),
                g['unshift'](0x0),
                this['path'] = g,
                this['category'] = h,
                this['check_scroll'](),
                this['set_scroll'](),
                g;
            },
            'find_item_path_by_id': function(f) {
                let g = this
                  , h = [];
                var f = this['$options']['lib']['items'][f]['category'];
                function j(k) {
                    g['$options']['lib']['categories'][k]['parent'] && 0x0 != g['$options']['lib']['categories'][k]['parent'] ? (h['unshift'](k),
                    j(g['$options']['lib']['categories'][k]['parent'])) : h['unshift'](k);
                }
                return j(f),
                h['unshift'](0x0),
                this['path'] = h,
                this['category'] = f,
                this['check_scroll'](),
                this['set_scroll'](),
                h;
            },
            'module_size_change': function(f, g) {
                switch (this['l_lib']) {
                case 'catalog':
                    f['params']['spec']['variant'] = parseInt(g['target']['value']);
                    break;
                default:
                    if (f['params']['spec'] && (void 0x0 !== f['params']['spec']['variant'] || this['l_lib']['startsWith']('catalogs.')))
                        f['params']['spec'][this['l_lib']['startsWith']('catalogs.') ? 'selected_variant' : 'variant'] = parseInt(g['target']['value']);
                    else {
                        void 0x0 !== f['params']['selected_variant'] && delete f['params']['selected_variant'];
                        for (let h = 0x0; h < f['params']['variants']['length']; h++)
                            f['params']['variants'][h]['default'] = parseInt(g['target']['value']) === h;
                    }
                }
            },
            'tabletop_size_change': function(f, g) {
                switch (this['l_lib']) {
                case 'catalog':
                    f['params']['spec']['variant'] = parseInt(g['target']['value']);
                    break;
                default:
                    if (f['params']['spec'] && (void 0x0 !== f['params']['spec']['variant'] || this['l_lib']['startsWith']('catalogs.')))
                        f['params']['spec']['variant'] = parseInt(g['target']['value']);
                    else {
                        void 0x0 !== f['params']['selected_variant'] && delete f['params']['selected_variant'];
                        for (let h = 0x0; h < f['params']['variants']['length']; h++)
                            f['params']['variants'][h]['default'] = parseInt(g['target']['value']) === h;
                    }
                }
                this['$emit']('select_item', f);
            },
            'module_size_value': function(f) {
                let g = 0x0;
                switch (this['l_lib']) {
                case 'catalog':
                    g = f['params']['spec']['variant'];
                    break;
                default:
                    if (f['params']['spec'] && (void 0x0 !== f['params']['spec']['variant'] || this['l_lib']['startsWith']('catalogs.')))
                        g = this['l_lib']['startsWith']('catalogs.') ? f['params']['spec']['selected_variant'] : f['params']['spec']['variant'];
                    else {
                        if (f['params']['variants']) {
                            for (let h = 0x0; h < f['params']['variants']['length']; h++)
                                0x1 == f['params']['variants'][h]['default'] && (g = h);
                        }
                    }
                }
                return g;
            },
            'model_size_change': function(f, g) {
                void 0x0 !== f['selected_variant'] && delete f['selected_variant'];
                for (let h = 0x0; h < f['variants']['length']; h++)
                    f['variants'][h]['default'] = parseInt(g['target']['value']) === h;
            },
            'model_size_value': function(f) {
                let g = 0x0;
                for (let h = 0x0; h < f['variants']['length']; h++)
                    0x1 == f['variants'][h]['default'] && (g = h);
                return g;
            },
            'handle_size_change': function(f, g) {
                void 0x0 !== f['selected_variant'] && delete f['selected_variant'];
                for (let h = 0x0; h < f['sizes']['length']; h++)
                    f['sizes'][h]['default'] = parseInt(g['target']['value']) === h;
            },
            'handle_size_value': function(f) {
                let g = 0x0;
                for (let h = 0x0; h < f['sizes']['length']; h++)
                    0x1 == f['sizes'][h]['default'] && (g = h);
                return g;
            },
            'mouse_down': function(e) {
                'mousedown' == this['l_mode'] && this['$emit']('mouse_down', e);
            },
            'double_click': function(e) {
                this['$emit']('double_click', e);
            },
            'change_param': function(e) {
                var e = this['params_data']?.[e];
                e && this['$emit']('change_param', e);
            },
            'select_item': function(e) {
                'click' == this['l_mode'] && (this['sel'] = e['id'],
                this['sel2'] = e['id'],
                this['$emit']('select_item', e));
            },
            'select_item1': function(e) {
                'click' == this['l_mode'] && (this['sel'] = e['id'],
                this['$emit']('select_item1', e));
            },
            'select_item2': function(e) {
                'click' == this['l_mode'] && (this['sel2'] = e['id'],
                this['$emit']('select_item2', e));
            },
            'select_item_v2': function(f) {
                var f, g;
                'click' == this['l_mode'] && (f = f['group'],
                g = this['$options']['lib']['items'][this['dd_menu']['id']],
                this['sel'] = g['id'],
                this['sel2'] = g['id'],
                this['$emit']('select_item', g, f),
                this['dd_menu']['show'] = !0x1);
            },
            'select_item_dd': function() {
                var e = this['$options']['lib']['items'][this['dd_menu']['id']];
                this['select_item'](e),
                this['dd_menu']['show'] = !0x1;
            },
            'select_item1_dd': function() {
                var e = this['$options']['lib']['items'][this['dd_menu']['id']];
                this['select_item1'](e),
                this['dd_menu']['show'] = !0x1;
            },
            'select_item2_dd': function() {
                var e = this['$options']['lib']['items'][this['dd_menu']['id']];
                this['select_item2'](e),
                this['dd_menu']['show'] = !0x1;
            },
            'select_group_single': function() {
                var e = this['$options']['lib']['items'][this['dd_menu']['id']];
                this['select_item'](e),
                this['$emit']('select_item', e),
                this['dd_menu']['show'] = !0x1;
            },
            'select_group_multi': function() {
                var e = this['$options']['lib']['items'][this['dd_menu']['id']];
                'click' == this['l_mode'] && (this['sel'] = e['id'],
                this['sel2'] = e['id'],
                this['$emit']('select_item_group', e),
                this['dd_menu']['show'] = !0x1);
            },
            'get_size': function(e) {
                return e['axis_size'] || e['width'];
            },
            'get_dd_coords': function(f, g) {
                let h = 0x0;
                var j = g['target']['parentElement']['parentElement']['getElementsByTagName']('SELECT')
                  , j = (j['length'] && (h = j[0x0]['value']),
                this['dd_menu']['id'] = f,
                this['dd_menu']['variant'] = h,
                this['dd_menu']['show'] = !0x0,
                this['$refs']['dd_menu']['getBoundingClientRect']());
                this['dd_menu']['pos']['top'] = g['clientY'] - j['height'] / 0x2,
                this['dd_menu']['pos']['left'] = g['clientX'] - j['width'] / 0x2;
            },
            'get_dd_style': function(e) {
                return {
                    'top': 'auto' == this['dd_menu']['pos']['top'] ? 'auto' : this['dd_menu']['pos']['top'] + 'px',
                    'left': this['dd_menu']['pos']['left'] + 'px',
                    'visibility': this['dd_menu']['show'] ? 'visible' : 'hidden'
                };
            },
            'dd_mouseout': function(e) {
                this['dd_menu']['show'] = !0x1;
            },
            'get_dd_coords_picker': function(f, g) {
                let h = 0x0;
                var j = g['target']['parentElement']['parentElement']['getElementsByTagName']('SELECT')
                  , k = (j['length'] && (h = j[0x0]['value']),
                this['dd_menu_picker']['id'] = f,
                this['dd_menu_picker']['variant'] = h,
                this['dd_menu_picker']['show'] = !0x0,
                this['$refs']['dd_menu_picker']['getBoundingClientRect']());
                this['dd_menu_picker']['pos']['top'] = g['clientY'] - 0x14,
                this['dd_menu_picker']['pos']['left'] = g['clientX'] - 0x14;
            },
            'get_dd_style_picker': function(e) {
                return {
                    'top': 'auto' == this['dd_menu_picker']['pos']['top'] ? 'auto' : this['dd_menu_picker']['pos']['top'] + 'px',
                    'left': this['dd_menu_picker']['pos']['left'] + 'px',
                    'visibility': this['dd_menu_picker']['show'] ? 'visible' : 'hidden'
                };
            },
            'dd_mouseout_picker': function(e) {
                this['dd_menu_picker']['show'] = !0x1;
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
interface_components_init['push'](function() {
    Vue['component']('catalog_butt', {
        'template': '#catalog_butt_template',
        'props': {
            'modules_groups': {
                'type': Array,
                'default': function() {
                    return Object['values'](copy_object(project_settings['kitchen']['cabinet_tags']));
                }
            },
            'selected': {
                'type': Object,
                'default': function() {
                    return null;
                }
            },
            'method': {
                'type': String,
                'default': 'global'
            },
            'mode': {
                'type': String,
                'default': 'click'
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                'l_selected': {},
                'l_mode': 'click',
                'selected_path': [],
                'category': 0x0,
                'mat_key': 0x0,
                'show_search': !0x1,
                'search': '',
                'multi': !0x1,
                'debounce': null,
                'dd_menu': {
                    'id': 0x0,
                    'key': '',
                    'variant': 0x0,
                    'show': !0x1,
                    'pos': {
                        'left': 0x0,
                        'right': 'auto',
                        'top': 'auto',
                        'bottom': 'auto'
                    }
                },
                'bread_path': [],
                'selected_hash': {}
            };
        },
        'created': function() {
            this['$root']['$once']('main_menu_component_unmount', () => {
                this['l_selected'] = null,
                this['$options']['tree'] = null;
            }
            ),
            this['init'](),
            this['$options']['elem'] = document['getElementById']('interface');
        },
        'watch': {
            'selected': {
                'handler': function() {
                    this['init']();
                },
                'deep': !0x0
            }
        },
        'mounted': function() {},
        'computed': {
            'current_category'() {
                let f = this['$options']['tree'][0x0];
                this['bread_path'] = [{
                    'name': lang['catalog'],
                    'path': []
                }];
                for (let g = 0x0; g < this['selected_path']['length']; g++)
                    this['bread_path']['push']({
                        'name': f['categories'][this['selected_path'][g]]['name'],
                        'path': f['categories'][this['selected_path'][g]]['path']
                    }),
                    f = f['categories'][this['selected_path'][g]];
                return f;
            },
            'search_items'() {
                if ('' == this['search'])
                    return [];
                let f = []
                  , g = h => {
                    var j = this['search']['toLowerCase']();
                    if (h['categories']) {
                        for (let m = 0x0; m < h['categories']['length']; m++)
                            g(h['categories'][m], h['categories'][m]['id']);
                    }
                    if (h['items']) {
                        var k = {
                            'group': h['name'],
                            'category': h['id'],
                            'path': h['path'],
                            'name_path': h['name_path'],
                            'items': []
                        };
                        for (let o = 0x0; o < h['items']['length']; o++) {
                            var l = h['items'][o];
                            if (0x0 != l['active']) {
                                let p = 0x0;
                                l['name'] && -0x1 < l['name']['toLowerCase']()['indexOf'](j) && (p = 0x1),
                                0x1 == (p = l['code'] && -0x1 < l['code']['toLowerCase']()['indexOf'](j) ? 0x1 : p) && k['items']['push'](h['items'][o]);
                            }
                        }
                        0x0 < k['items']['length'] && f['push'](k);
                    }
                }
                ;
                return g(this['current_category']),
                f;
            }
        },
        'methods': {
            'init'() {
                this['l_selected'] = this['selected'],
                this['multi'] = 'global' == this['method'];
                let f = this['selected']['key'];
                this['$options']['all_keys'] = [],
                this['$options']['dd_options'] = [{
                    'group': 'all',
                    'text': this['lang']('apply_to_all')
                }];
                for (let v = 0x0; v < this['modules_groups']['length']; v++) {
                    var g = this['modules_groups'][v];
                    this['$options']['all_keys']['push'](g['key']),
                    this['$options']['dd_options']['push']({
                        'group': g['key'],
                        'text': this['lang']('apply') + ':\x20' + g['name']
                    });
                }
                this['$options']['tree'] = [{
                    'id': 0x0,
                    'name': this['lang']('catalog'),
                    'active': 0x1,
                    'categories': [],
                    'items': [],
                    'path': []
                }];
                let h, j = 'testest';
                var k = copy_object(pp['libs']['butts'][f]['items_arr']);
                let m = copy_object(pp['libs']['butts'][f]['categories_arr'])
                  , p = {};
                for (let w = 0x0; w < m['length']; w++)
                    m[w]['categories'] = [],
                    m[w]['items'] = [],
                    p[m[w]['id']] = m[w];
                Object['values'](k)['forEach'](x => {
                    x['key'] = f,
                    p[x['category']] && p[x['category']]['items']['push'](x);
                }
                );
                let q = [];
                function u(x, y=null, z=null) {
                    for (let A = 0x0; A < x['length']; A++)
                        y ? (x[A]['path'] = copy_object(y),
                        x[A]['name_path'] = copy_object(z)) : (x[A]['path'] = [],
                        x[A]['name_path'] = []),
                        x[A]['path']['push'](A),
                        x[A]['name_path']['push'](x[A]['name']),
                        x[A]['categories'] && u(x[A]['categories'], x[A]['path'], x[A]['name_path']);
                }
                m['forEach'](function(x) {
                    x['parent'] && 0x0 != x['parent'] ? p[x['parent']] && p[x['parent']]['categories']['push'](p[x['id']]) : q['push'](p[x['id']]);
                }),
                this['$options']['tree'][0x0]['categories']['push']({
                    'id': f,
                    'parent': 0x0,
                    'name': pp['libs']['butts'][f]['get_name'](),
                    'categories': clean_tree(q),
                    'items': [],
                    'path': [0x0],
                    'name_path': [j],
                    'active': 0x1
                }),
                u(this['$options']['tree'][0x0]['categories']),
                k = q = null,
                m = null,
                p = null;
            },
            'get_item_style': function(e) {
                var e = e['params'], e;
                return 0x0 == e['mat_mode'] ? this['item_style'](e['mat_params']) : 0x1 == e['mat_mode'] ? (e = pp['libs']['decors']['find_item'](e['material'])) ? this['item_style'](e) : {} : void 0x0;
            },
            'do_search': function(f) {
                clearTimeout(this['debounce']);
                let g = this;
                this['debounce'] = setTimeout(function() {
                    g['search'] = f['target']['value'];
                }, 0x258);
            },
            'clear_search': function() {
                this['$refs']['search_input']['value'] = '',
                this['search'] = '';
            },
            'change_show_search'() {
                this['show_search'] = !this['show_search'];
            },
            'find_item'(f, g) {
                var g = pp['libs']['butts'][g]['items'][f]['category'];
                this['select_category'](g);
            },
            'select_category'(e) {
                Array['isArray'](e) ? this['selected_path'] = e : this['selected_path']['push'](e);
            },
            'item_click': function(f, g, h) {
                this['multi'] ? this['show_dd_menu'](f, g, h) : this['select_item'](f, g, 'self');
            },
            'select_item_dd': function(e) {
                this['select_item'](this['dd_menu']['id'], this['dd_menu']['key'], e['group']),
                this['dd_menu']['show'] = !0x1;
            },
            'select_item'(f, g, h) {
                let i;
                switch (h) {
                case 'self':
                    break;
                case 'all':
                    i = this['$options']['all_keys'];
                    break;
                default:
                    i = [h];
                }
                this['l_selected']['id'] = f,
                this['$emit']('select_item', {
                    'id': f,
                    'key': g,
                    'group': i
                });
            },
            'show_dd_menu': function(f, g, h) {
                this['dd_menu']['id'] = f,
                this['dd_menu']['key'] = g,
                this['dd_menu']['show'] = !0x0;
                var f = this['$refs']['dd_menu']['getBoundingClientRect']();
                this['dd_menu']['pos']['top'] = h['clientY'] - f['height'] / 0x2,
                this['dd_menu']['pos']['left'] = h['clientX'] - f['width'] / 0x2;
            },
            'get_dd_style': function(e) {
                return {
                    'top': 'auto' == this['dd_menu']['pos']['top'] ? 'auto' : this['dd_menu']['pos']['top'] + 'px',
                    'left': this['dd_menu']['pos']['left'] + 'px',
                    'visibility': this['dd_menu']['show'] ? 'visible' : 'hidden'
                };
            },
            'dd_mouseout': function(e) {
                this['dd_menu']['show'] = !0x1;
            },
            'variant_change': function(f, g) {
                var h = _['get'](pp['libs']['butts'], f['key'] + ('.items.[' + f['id'] + ']'));
                if (h) {
                    if (h['params']['spec'] && void 0x0 !== h['params']['spec']['variant'])
                        h['params']['spec']['variant'] = parseInt(g['target']['value']);
                    else {
                        void 0x0 !== h['params']['selected_variant'] && delete h['params']['selected_variant'];
                        for (let j = 0x0; j < h['params']['variants']['length']; j++)
                            h['params']['variants'][j]['default'] = parseInt(g['target']['value']) === j;
                    }
                }
                if (f['params']['spec'] && void 0x0 !== f['params']['spec']['variant'])
                    f['params']['spec']['variant'] = parseInt(g['target']['value']);
                else {
                    void 0x0 !== f['params']['selected_variant'] && delete f['params']['selected_variant'];
                    for (let k = 0x0; k < f['params']['variants']['length']; k++)
                        f['params']['variants'][k]['default'] = parseInt(g['target']['value']) === k;
                }
                var i = g['target']['getBoundingClientRect']()
                  , i = {
                    'clientX': i['left'] + i['width'] / 0x2,
                    'clientY': i['top'] + i['height'] / 0x2
                };
                this['item_click'](f['id'], f['key'], i, g['target']['value']);
            },
            'get_variant_value': function(f) {
                let g = 0x0;
                if (f['params']['spec'] && void 0x0 !== f['params']['spec']['variant'])
                    g = f['params']['spec']['variant'];
                else {
                    if (f['params']['variants']) {
                        for (let h = 0x0; h < f['params']['variants']['length']; h++)
                            0x1 == f['params']['variants'][h]['default'] && (g = h);
                    }
                }
                return g;
            },
            'get_variants': function(f) {
                let g = [];
                return (g = (f['params']['spec'] && void 0x0 !== f['params']['spec']['variant'] ? f['params']['spec'] : f['params'])['variants']) || [];
            },
            'get_variant_label': function(f) {
                var g;
                return (f['thickness'] || 0x0) + '\x20' + this['lang']('mm');
            }
        }
    });
}),
interface_components_init['push'](function() {
    Vue['component']('catalog_ext', {
        'template': '#catalog_template_ext',
        'props': {
            'lib': {
                'type': String,
                'default': 'materials'
            },
            'categories': {
                'type': [Object, String, Array],
                'default': null
            },
            'selected': {
                'type': [Object, String, Number],
                'default': null
            },
            'selected2': {
                'type': [Object, String, Number],
                'default': null
            },
            'multiple': {
                'type': [Number, Boolean],
                'default': !0x1
            },
            'mode': {
                'type': String,
                'default': 'click'
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                'cats': [],
                'sel': {
                    'id': 0x0,
                    'key': 'type_0'
                },
                'sel2': {
                    'id': 0x0,
                    'key': 'type_0'
                },
                'multi': !0x1,
                'category': 0x0,
                'type': 0x0,
                'path': [0x0],
                '_mode': 'click',
                '_lib': 'materials',
                'debounce': null,
                'show_search': !0x1,
                'search': '',
                'dd_menu': {
                    'id': 0x0,
                    'variant': 0x0,
                    'show': !0x1,
                    'pos': {
                        'left': 0x0,
                        'right': 'auto',
                        'top': 'auto',
                        'bottom': 'auto'
                    }
                }
            };
        },
        'beforeCreate': function() {},
        'created': function() {
            this['cr'](),
            this['$options']['elem'] = document['getElementById']('interface');
        },
        'watch': {
            'lib': function(f, g) {
                this['cr']();
            },
            'categories': function(f, g) {
                this['cr']();
            }
        },
        'mounted': function() {},
        'computed': {
            'search_items': function() {
                let f = []
                  , g = this;
                if ('' != this['search']) {
                    if (0x0 == this['type'])
                        Object['keys'](g['cats'])['forEach'](function(m) {
                            var o = g['cats'][m]['materials']
                              , p = g['cats'][m]['name'];
                            for (let q = 0x0; q < o['length']; q++)
                                l(o[q], p);
                        });
                    else {
                        if (0x0 != this['type'] && 0x0 == this['category']) {
                            var h = g['cats'][this['type']]['materials']
                              , j = g['cats'][this['type']]['name'];
                            for (let m = 0x0; m < h['length']; m++)
                                l(h[m], j);
                        } else {
                            var k = g['cats'][this['type']]['name'];
                            l(this['category'], k);
                        }
                    }
                }
                return f;
                function l(p, q) {
                    if (g['$options']['lib']['categories'][p]['categories']) {
                        for (let u = 0x0; u < g['$options']['lib']['categories'][p]['categories']['length']; u++)
                            l(g['$options']['lib']['categories'][p]['categories'][u]['id'], q);
                    }
                    if (g['$options']['lib']['categories'][p]['items'])
                        for (let v = 0x0; v < g['$options']['lib']['categories'][p]['items']['length']; v++) {
                            let w = 0x0;
                            var r = g['$options']['lib']['categories'][p]['items'][v]
                              , r = ('materials' != g['_lib'] && 'glass' != g['_lib'] || (r['name'] && -0x1 < r['name']['toLowerCase']()['indexOf'](g['search']) && (w = 0x1),
                            r['code'] && -0x1 < r['code']['toLowerCase']()['indexOf'](g['search']) && (w = 0x1)),
                            copy_object(r));
                            r['mat_name'] = q,
                            0x1 == w && f['push'](r);
                        }
                }
            }
        },
        'methods': {
            'cr': function() {
                let f = this
                  , g = (this['category'] = 0x0,
                this['type'] = 0x0,
                this['show_search'] = !0x1,
                this['search'] = '',
                this['path'] = [0x0],
                {});
                switch (this['lib']) {
                case 'materials':
                    g = materials_lib;
                    break;
                case 'glass':
                    g = glass_lib;
                    break;
                case 'handles':
                    g = handles_lib;
                    break;
                case 'modules':
                    g = mod_lib;
                    break;
                case 'tech':
                    g = tech_lib;
                    break;
                case 'comms':
                    g = comms_lib;
                    break;
                case 'interior':
                    g = interior_lib;
                    break;
                case 'constructions':
                    g = constructions_lib;
                    break;
                default:
                    g = materials_lib;
                }
                this['_lib'] = this['lib'];
                let h = {
                    'default': 0x0,
                    'key': 'type_0',
                    'materials': []
                };
                if (this['categories'])
                    h = 'string' == typeof this['categories'] ? copy_object(utils['nested_object']['get'](project_settings, this['categories'])) : this['categories'];
                else {
                    for (let k = 0x0; k < g['tree']['length']; k++)
                        h['materials']['push'](g['tree'][k]['id']);
                }
                var j, j;
                Object['keys'](h)['forEach'](function(l) {
                    h[l]['key'] || (h[l]['key'] = l);
                }),
                Vue['set'](this, 'cats', h),
                this['$options']['lib'] = g,
                'string' == typeof this['selected'] ? (!(j = copy_object(utils['nested_object']['get'](project_settings, this['selected'])))['id'] && j['default'] && (j['id'] = j['default']),
                delete j['default'],
                this['sel'] = j) : this['sel'] = this['selected'],
                'string' == typeof this['selected2'] ? (!(j = copy_object(utils['nested_object']['get'](project_settings, this['selected2'])))['id'] && j['default'] && (j['id'] = j['default']),
                delete j['default'],
                this['sel2'] = j) : this['sel2'] = this['selected2'],
                this['multi'] = this['multiple'],
                0x0 == this['multi'] && (this['sel2'] = this['sel']),
                'click' != this['mode'] && (this['multi'] = !0x1,
                this['sel'] = 0x0,
                this['sel2'] = 0x0),
                this['_mode'] = this['mode'],
                setTimeout(function() {
                    f['check_scroll']();
                }, 0xa);
            },
            'go_home': function() {
                this['category'] = 0x0,
                this['type'] = 0x0,
                this['path'] = [0x0],
                this['check_scroll']();
            },
            'select_category': function(f, g=!0x1) {
                0x0 == (this['category'] = f) ? this['path'] = [0x0] : g ? this['path']['length'] = g + 0x1 : this['path']['push'](f),
                this['check_scroll']();
            },
            'select_type': function(e) {
                this['category'] = 0x0,
                this['path'] = [0x0],
                this['type'] = e['key'],
                this['check_scroll']();
            },
            'do_search': function(f) {
                clearTimeout(this['debounce']);
                let g = this;
                this['debounce'] = setTimeout(function() {
                    g['search'] = f['target']['value'],
                    g['check_scroll']();
                }, 0x258);
            },
            'clear_search': function() {
                this['$refs']['search_input']['value'] = '',
                this['search'] = '',
                this['check_scroll']();
            },
            'change_show_search'() {
                this['show_search'] = !this['show_search'],
                this['check_scroll']();
            },
            'check_scroll': function() {},
            'set_scroll': function() {},
            'find_item_path': function() {
                let f = this
                  , g = [];
                var h = this['$options']['lib']['items'][this['sel']]['category'];
                function j(k) {
                    f['$options']['lib']['categories'][k]['parent'] && 0x0 != f['$options']['lib']['categories'][k]['parent'] ? (g['unshift'](k),
                    j(f['$options']['lib']['categories'][k]['parent'])) : g['unshift'](k);
                }
                return j(h),
                g['unshift'](0x0),
                this['path'] = g,
                this['category'] = h,
                this['check_scroll'](),
                this['set_scroll'](),
                g;
            },
            'find_item_path_by_id': function(f) {
                let g = this
                  , h = [];
                var j = this['$options']['lib']['items'][f['id']]['category'];
                function k(l) {
                    g['$options']['lib']['categories'][l]['parent'] && 0x0 != g['$options']['lib']['categories'][l]['parent'] ? (h['unshift'](l),
                    k(g['$options']['lib']['categories'][l]['parent'])) : h['unshift'](l);
                }
                return k(j),
                h['unshift'](0x0),
                this['type'] = f['key'],
                this['path'] = h,
                this['category'] = j,
                this['check_scroll'](),
                this['set_scroll'](),
                h;
            },
            'module_size_change': function(f, g) {
                void 0x0 !== f['params']['selected_variant'] && delete f['params']['selected_variant'];
                for (let h = 0x0; h < f['params']['variants']['length']; h++)
                    f['params']['variants'][h]['default'] = parseInt(g['target']['value']) === h;
            },
            'module_size_value': function(f) {
                let g = 0x0;
                for (let h = 0x0; h < f['params']['variants']['length']; h++)
                    0x1 == f['params']['variants'][h]['default'] && (g = h);
                return g;
            },
            'model_size_change': function(f, g) {
                void 0x0 !== f['selected_variant'] && delete f['selected_variant'];
                for (let h = 0x0; h < f['variants']['length']; h++)
                    f['variants'][h]['default'] = parseInt(g['target']['value']) === h;
            },
            'model_size_value': function(f) {
                let g = 0x0;
                for (let h = 0x0; h < f['variants']['length']; h++)
                    0x1 == f['variants'][h]['default'] && (g = h);
                return g;
            },
            'mouse_down': function(e) {
                'mousedown' == this['_mode'] && this['$emit']('mouse_down', e);
            },
            'select_item': function(e) {
                'click' == this['_mode'] && (Vue['set'](this, 'sel', {
                    'id': parseInt(e['id']),
                    'key': this['type']
                }),
                Vue['set'](this, 'sel2', {
                    'id': parseInt(e['id']),
                    'key': this['type']
                }),
                this['$emit']('select_item', {
                    'item': e,
                    'key': this['type']
                }));
            },
            'select_item1': function(e) {
                'click' == this['_mode'] && (Vue['set'](this, 'sel', {
                    'id': parseInt(e['id']),
                    'key': this['type']
                }),
                this['$emit']('select_item1', {
                    'item': e,
                    'key': this['type']
                }));
            },
            'select_item2': function(e) {
                'click' == this['_mode'] && (Vue['set'](this, 'sel2', {
                    'id': parseInt(e['id']),
                    'key': this['type']
                }),
                this['$emit']('select_item2', {
                    'item': e,
                    'key': this['type']
                }));
            },
            'select_item_dd': function() {
                var e = this['$options']['lib']['items'][this['dd_menu']['id']];
                this['select_item'](e),
                this['dd_menu']['show'] = !0x1;
            },
            'select_item1_dd': function() {
                var e = this['$options']['lib']['items'][this['dd_menu']['id']];
                this['select_item1'](e),
                this['dd_menu']['show'] = !0x1;
            },
            'select_item2_dd': function() {
                var e = this['$options']['lib']['items'][this['dd_menu']['id']];
                this['select_item2'](e),
                this['dd_menu']['show'] = !0x1;
            },
            'get_dd_coords': function(f, g) {
                let h = 0x0;
                var j = g['target']['parentElement']['parentElement']['getElementsByTagName']('SELECT')
                  , j = (j['length'] && (h = j[0x0]['value']),
                this['dd_menu']['id'] = f,
                this['dd_menu']['variant'] = h,
                this['dd_menu']['show'] = !0x0,
                this['$refs']['dd_menu']['getBoundingClientRect']());
                this['dd_menu']['pos']['top'] = g['clientY'] - j['height'] / 0x2,
                this['dd_menu']['pos']['left'] = g['clientX'] - j['width'] / 0x2;
            },
            'get_dd_style': function(e) {
                return {
                    'top': 'auto' == this['dd_menu']['pos']['top'] ? 'auto' : this['dd_menu']['pos']['top'] + 'px',
                    'left': this['dd_menu']['pos']['left'] + 'px',
                    'visibility': this['dd_menu']['show'] ? 'visible' : 'hidden'
                };
            },
            'dd_mouseout': function(e) {
                this['dd_menu']['show'] = !0x1;
            }
        }
    });
}),
interface_components_init['push'](function() {
    Vue['component']('catalog_group', {
        'template': '#catalog_group_template',
        'props': {
            'modules_groups': {
                'type': Array,
                'default': function() {
                    return Object['values'](copy_object(project_settings['kitchen']['cabinet_tags']));
                }
            },
            'available': {
                'type': Array,
                'default': function() {
                    return [];
                }
            },
            'selected': {
                'type': Object,
                'default': function() {
                    return null;
                }
            },
            'method': {
                'type': String,
                'default': 'global'
            },
            'mode': {
                'type': String,
                'default': 'click'
            },
            'av_index': {
                'type': [String, Number],
                'default': 0x0
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                'l_available': [],
                'l_selected': {},
                'l_mode': 'click',
                'selected_path': [],
                'category': 0x0,
                'mat_key': 0x0,
                'show_search': !0x1,
                'search': '',
                'multi': !0x1,
                'debounce': null,
                'dd_menu': {
                    'id': 0x0,
                    'key': '',
                    'variant': 0x0,
                    'show': !0x1,
                    'pos': {
                        'left': 0x0,
                        'right': 'auto',
                        'top': 'auto',
                        'bottom': 'auto'
                    }
                },
                'bread_path': [],
                'selected_hash': {}
            };
        },
        'created': function() {
            this['$root']['$once']('main_menu_component_unmount', () => {
                this['l_selected'] = null,
                this['l_available'] = null,
                this['$options']['tree'] = null;
            }
            ),
            this['init'](),
            this['$options']['elem'] = document['getElementById']('interface');
        },
        'watch': {
            'selected': {
                'handler': function() {
                    this['init']();
                },
                'deep': !0x0
            }
        },
        'mounted': function() {},
        'computed': {
            'current_category'() {
                let f = this['$options']['tree'][0x0];
                this['bread_path'] = [{
                    'name': lang['catalog'],
                    'path': []
                }];
                for (let g = 0x0; g < this['selected_path']['length']; g++)
                    this['bread_path']['push']({
                        'name': f['categories'][this['selected_path'][g]]['name'],
                        'path': f['categories'][this['selected_path'][g]]['path']
                    }),
                    f = f['categories'][this['selected_path'][g]];
                return f;
            },
            'search_items'() {
                if ('' == this['search'])
                    return [];
                let f = []
                  , g = h => {
                    var j = this['search']['toLowerCase']();
                    if (h['categories']) {
                        for (let m = 0x0; m < h['categories']['length']; m++)
                            g(h['categories'][m], h['categories'][m]['id']);
                    }
                    if (h['items']) {
                        var k = {
                            'group': h['name'],
                            'category': h['id'],
                            'path': h['path'],
                            'name_path': h['name_path'],
                            'items': []
                        };
                        for (let o = 0x0; o < h['items']['length']; o++) {
                            var l = h['items'][o];
                            if (0x0 != l['active']) {
                                let p = 0x0;
                                l['name'] && -0x1 < l['name']['toLowerCase']()['indexOf'](j) && (p = 0x1),
                                0x1 == (p = l['code'] && -0x1 < l['code']['toLowerCase']()['indexOf'](j) ? 0x1 : p) && k['items']['push'](h['items'][o]);
                            }
                        }
                        0x0 < k['items']['length'] && f['push'](k);
                    }
                }
                ;
                return g(this['current_category']),
                f;
            }
        },
        'methods': {
            'init'() {
                this['l_selected'] = this['selected'],
                this['l_available'] = this['available'],
                this['multi'] = 'global' == this['method'],
                this['$options']['all_keys'] = [],
                this['$options']['dd_options'] = [{
                    'group': 'all',
                    'text': this['lang']('apply_to_all')
                }];
                for (let g = 0x0; g < this['modules_groups']['length']; g++) {
                    var f = this['modules_groups'][g];
                    this['$options']['all_keys']['push'](f['key']),
                    this['$options']['dd_options']['push']({
                        'group': f['key'],
                        'text': this['lang']('apply') + ':\x20' + f['name']
                    });
                }
                this['$options']['tree'] = [{
                    'id': 0x0,
                    'name': this['lang']('catalog'),
                    'active': 0x1,
                    'categories': [],
                    'items': [],
                    'path': []
                }];
                for (let h = 0x0; h < this['l_available']['length']; h++) {
                    let j = this['l_available'][h]
                      , k = copy_object(pp['libs']['materials'][j['key']]['items_arr'])
                      , l = copy_object(pp['libs']['materials'][j['key']]['categories_arr'])
                      , m = {};
                    for (let q = 0x0; q < l['length']; q++)
                        l[q]['categories'] = [],
                        l[q]['items'] = [],
                        m[l[q]['id']] = l[q];
                    if (j['thickness']['length']) {
                        let u = {};
                        for (let w = 0x0; w < j['thickness']['length']; w++)
                            u[j['thickness'][w]] = 0x1;
                        let v = {};
                        Object['values'](k)['forEach'](x => {
                            for (let y = x['params']['variants']['length']; y--; )
                                u[x['params']['variants'][y]['thickness']] || x['params']['variants']['splice'](y, 0x1);
                            x['params']['variants']['length'] && (v[x['id']] = x);
                        }
                        ),
                        k = v,
                        u = null;
                    }
                    Object['values'](k)['forEach'](x => {
                        x['key'] = j['key'],
                        m[x['category']] && m[x['category']]['items']['push'](x);
                    }
                    );
                    let o = [];
                    if (l['forEach'](function(x) {
                        x['parent'] && 0x0 != x['parent'] ? m[x['parent']] && m[x['parent']]['categories']['push'](m[x['id']]) : o['push'](m[x['id']]);
                    }),
                    j['categories']['length']) {
                        for (let x = o['length']; x--; )
                            j['categories']['includes'](o[x]['id']) || o['splice'](x, 0x1);
                    }
                    function p(y, z=null, A=null) {
                        for (let B = 0x0; B < y['length']; B++)
                            z ? (y[B]['path'] = copy_object(z),
                            y[B]['name_path'] = copy_object(A)) : (y[B]['path'] = [],
                            y[B]['name_path'] = []),
                            y[B]['path']['push'](B),
                            y[B]['name_path']['push'](y[B]['name']),
                            y[B]['categories'] && p(y[B]['categories'], y[B]['path'], y[B]['name_path']);
                    }
                    this['$options']['tree'][0x0]['categories']['push']({
                        'id': j['key'],
                        'parent': 0x0,
                        'name': pp['libs']['materials'][j['key']]['get_name'](),
                        'categories': clean_tree(o),
                        'items': [],
                        'path': [h],
                        'name_path': [j['name']],
                        'active': 0x1
                    }),
                    p(this['$options']['tree'][0x0]['categories']),
                    o = null,
                    k = null,
                    l = null,
                    m = null;
                }
                this['selected_path']['length'] || 0x1 != this['$options']['tree'][0x0]['categories']['length'] || (0x1 == this['$options']['tree'][0x0]['categories'][0x0]['categories']['length'] ? this['select_category']([0x0, 0x0]) : this['select_category'](0x0));
            },
            'get_item_style': function(f) {
                var f = f['params'], f;
                return 0x0 == f['mat_mode'] ? this['item_style'](f['mat_params']) : 0x1 == f['mat_mode'] ? (f = pp['libs']['decors']['find_item'](f['material'])) ? this['item_style'](f) : {} : void 0x0;
            },
            'do_search': function(f) {
                clearTimeout(this['debounce']);
                let g = this;
                this['debounce'] = setTimeout(function() {
                    g['search'] = f['target']['value'];
                }, 0x258);
            },
            'clear_search': function() {
                this['$refs']['search_input']['value'] = '',
                this['search'] = '';
            },
            'change_show_search'() {
                this['show_search'] = !this['show_search'];
            },
            'find_item'(f, g) {
                var g = pp['libs']['materials'][g]['items'][f]['category'];
                this['select_category'](g);
            },
            'select_category'(f) {
                Array['isArray'](f) ? this['selected_path'] = f : this['selected_path']['push'](f);
            },
            'item_click': function(f, g, h) {
                this['multi'] ? this['show_dd_menu'](f, g, h) : this['select_item'](f, g, 'self');
            },
            'select_item_dd': function(f) {
                this['select_item'](this['dd_menu']['id'], this['dd_menu']['key'], f['group']),
                this['dd_menu']['show'] = !0x1;
            },
            'select_item'(f, g, h) {
                let j;
                switch (h) {
                case 'self':
                    break;
                case 'all':
                    j = this['$options']['all_keys'];
                    break;
                default:
                    j = [h];
                }
                var k = pp['libs']['materials'][g]['get_item'](f)
                  , k = find_selected_variant(k)
                  , l = get_wall_thickness(f, k, g);
                this['l_selected']['id'] = f,
                this['$emit']('select_item', {
                    'id': f,
                    'variant_id': k,
                    'thickness': l,
                    'key': g,
                    'group': j
                });
            },
            'show_dd_menu': function(f, g, h) {
                this['dd_menu']['id'] = f,
                this['dd_menu']['key'] = g,
                this['dd_menu']['show'] = !0x0;
                var f = this['$refs']['dd_menu']['getBoundingClientRect']();
                this['dd_menu']['pos']['top'] = h['clientY'] - f['height'] / 0x2,
                this['dd_menu']['pos']['left'] = h['clientX'] - f['width'] / 0x2;
            },
            'get_dd_style': function(f) {
                return {
                    'top': 'auto' == this['dd_menu']['pos']['top'] ? 'auto' : this['dd_menu']['pos']['top'] + 'px',
                    'left': this['dd_menu']['pos']['left'] + 'px',
                    'visibility': this['dd_menu']['show'] ? 'visible' : 'hidden'
                };
            },
            'dd_mouseout': function(f) {
                this['dd_menu']['show'] = !0x1;
            },
            'variant_change': function(f, g) {
                var h = _['get'](pp['libs']['materials'], f['key'] + ('.items.[' + f['id'] + ']'));
                if (h) {
                    if (h['params']['spec'] && void 0x0 !== h['params']['spec']['variant'])
                        h['params']['spec']['variant'] = parseInt(g['target']['value']);
                    else {
                        void 0x0 !== h['params']['selected_variant'] && delete h['params']['selected_variant'];
                        for (let j = 0x0; j < h['params']['variants']['length']; j++)
                            h['params']['variants'][j]['default'] = parseInt(g['target']['value']) === j;
                    }
                }
                if (f['params']['spec'] && void 0x0 !== f['params']['spec']['variant'])
                    f['params']['spec']['variant'] = parseInt(g['target']['value']);
                else {
                    void 0x0 !== f['params']['selected_variant'] && delete f['params']['selected_variant'];
                    for (let k = 0x0; k < f['params']['variants']['length']; k++)
                        f['params']['variants'][k]['default'] = parseInt(g['target']['value']) === k;
                }
                var i = g['target']['getBoundingClientRect']()
                  , i = {
                    'clientX': i['left'] + i['width'] / 0x2,
                    'clientY': i['top'] + i['height'] / 0x2
                };
                this['item_click'](f['id'], f['key'], i, g['target']['value']);
            },
            'get_variant_value': function(f) {
                let g = 0x0;
                if (f['params']['spec'] && void 0x0 !== f['params']['spec']['variant'])
                    g = f['params']['spec']['variant'];
                else {
                    if (f['params']['variants']) {
                        for (let h = 0x0; h < f['params']['variants']['length']; h++)
                            0x1 == f['params']['variants'][h]['default'] && (g = h);
                    }
                }
                return g;
            },
            'get_variants': function(f) {
                let g = [];
                return (g = (f['params']['spec'] && void 0x0 !== f['params']['spec']['variant'] ? f['params']['spec'] : f['params'])['variants']) || [];
            },
            'get_variant_label': function(f) {
                var g;
                return (f['thickness'] || 0x0) + '\x20' + this['lang']('mm');
            }
        }
    });
}),
interface_components_init['push'](function() {
    Vue['component']('cornice_picker', {
        'template': '#cornice_picker_template',
        'props': {
            'selected': {
                'type': [String, Number],
                'default': 0x0
            },
            'heading': {
                'type': String,
                'default': ''
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                'selected_mat': parseInt(project_settings['selected_materials']['cornice']),
                'it_mode': 'c',
                'l_mode': 'p',
                'l_selected': 0x0,
                'cornice_active': project_settings['cornice_active'],
                'can_change_with_facade': 0x1 == project_settings['cornice_change_with_facade'],
                'change_with_facade': 0x1 == project_settings['cornice_change_with_facade'],
                'core_v2': constructor_settings['core_v2']
            };
        },
        'watch': {
            'selected_mat': function(f, g) {}
        },
        'created': function() {
            this['$options']['lib'] = libs['cornice'],
            this['l_selected'] = this['selected'],
            this['cr']();
        },
        'computed': {
            'item': function() {
                return this['$options']['lib']['get_item'](this['l_selected']);
            },
            'show_material': function() {
                var f = this['$options']['lib']['get_item'](this['l_selected']);
                return 'f' == f['params']['materials_mode'] && !this['change_with_facade'] || 'c' == f['params']['materials_mode'] || 'i' == f['params']['materials_mode'];
            }
        },
        'methods': {
            'cr'() {
                if (constructor_settings['core_v2']) {
                    this['l_mode'] = 'c',
                    this['cornice_active'] = !0x0;
                    let g = pp['const']['vars']['cornice_enabled'];
                    var f = _['find'](pp['variables']['current'], h => h['key'] === g);
                    void (f && is_empty_id(f['value']) && (this['cornice_active'] = !0x1));
                } else {
                    var f = this['$options']['lib']['get_item'](this['l_selected']);
                    this['it_mode'] = f['params']['materials_mode'],
                    'c' == f['params']['materials_mode'] && (this['$options']['materials_categories'] = f['mat_categories'],
                    this['can_change_with_facade'] = 0x0),
                    'i' == f['params']['materials_mode'] && (this['$options']['materials_categories'] = f['materials'],
                    this['can_change_with_facade'] = 0x0),
                    'f' == f['params']['materials_mode'] && (this['$options']['materials_categories'] = project_settings['materials']['top']['facades'],
                    this['can_change_with_facade'] = 0x1),
                    this['selected_mat'] = parseInt(project_settings['selected_materials']['cornice']);
                }
            },
            'change_mode': function(f) {
                this['l_mode'] = f;
            },
            'select_item'(f) {
                this['l_selected'] = f['id'],
                sc['change_cornice_model'](f['id']),
                this['cornice_active'] || (this['cornice_active'] = !0x0,
                this['change_cornice_active']()),
                this['cr']();
            },
            'select_material'(f) {
                sc['change_cornice_material'](f['id']),
                this['selected_mat'] = parseInt(project_settings['selected_materials']['cornice']);
            },
            'change_cornice_active'() {
                sc['change_cornice_active'](this['cornice_active']);
            },
            'cornice_change_with_facade'() {
                sc['set_cornice_as_facade'](this['change_with_facade']),
                this['selected_mat'] = parseInt(project_settings['selected_materials']['cornice']);
            },
            'find_item'(f) {
                this['change_mode']('c');
            },
            'find_material'(f) {
                this['change_mode']('sc');
            }
        }
    });
}),
interface_components_init['push'](function() {
    Vue['component']('corpus_material_picker_v2', {
        'template': '#corpus_material_picker_template_v2',
        'props': {
            'method': {
                'type': String,
                'default': 'global'
            },
            'mode': {
                'type': String,
                'default': 'p'
            },
            'mat_group_key': {
                'type': String,
                'default': 'g0'
            },
            'material_group': {
                'type': Object,
                'default': () => ({})
            },
            'module_groups': {
                'type': Array,
                'default': function() {
                    return Object['values'](copy_object(project_settings['kitchen']['cabinet_tags']));
                }
            },
            'show_butt': {
                'type': [Boolean, Number],
                'default': 0x1
            },
            'show_fixed': {
                'type': [Boolean, Number],
                'default': 0x1
            },
            'is_nested_picker': {
                'type': [Boolean, Number],
                'default': !0x1
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                'expanded': !0x1,
                'l_mode': 'p',
                'l_module_groups': [],
                'l_group': '',
                'l_butt_lib': 'butts',
                'selected': {},
                'selected_butt': {},
                'available': [],
                'av_index': 0x0
            };
        },
        'watch': {},
        'created': function() {
            this['init']();
        },
        'computed': {},
        'methods': {
            'init'() {
                if (this['l_mode'] = this['mode'],
                'global' == this['method']) {
                    var f = project_settings['kitchen']['mat_groups'][this['mat_group_key']]
                      , g = pp['libs']['materials_info']['keys']
                      , h = {};
                    for (let n = 0x0; n < this['module_groups']['length']; n++) {
                        var j = this['module_groups'][n];
                        h[j['key']] = j,
                        h[j['key']]['group_name'] = f['name'],
                        h[j['key']]['selected'] = f['selected'][j['key']] || {
                            'key': _['get'](f['available'], '[0].key') || 'ldsp',
                            'id': 0x0,
                            'variant_id': 0x0
                        },
                        h[j['key']]['selected_butt'] = f['selected_butt']?.[j['key']];
                        let p = h[j['key']]['selected'];
                        var k, m = _['find'](g, q => q['key'] === p)?.['butts'];
                        m && h[j['key']]['selected_butt']['key'] !== m && (h[j['key']]['selected_butt']['key'] = m,
                        h[j['key']]['selected_butt']['id'] = 0x0),
                        h[j['key']]['available'] = copy_object(f['available']);
                    }
                    Vue['set'](this, 'l_module_groups', h);
                }
                'single' == this['method'] && (Vue['set'](this, 'available', copy_object(this['material_group']['available'])),
                Vue['set'](this, 'selected', copy_object(this['material_group']['material'])),
                Vue['set'](this, 'selected_butt', copy_object(this['material_group']['butt'])),
                this['l_mode'] = this['mode'] || 'c');
            },
            'click_selected_item'(f, g) {
                ce(g),
                Vue['set'](this, 'available', copy_object(g['available'])),
                Vue['set'](this, 'selected', copy_object(g['selected'])),
                this['av_index'] = g['selected']['av_index'],
                this['l_mode'] = 'c';
            },
            'click_selected_butt_item'(f, g) {
                Vue['set'](this, 'selected_butt', copy_object(g['selected_butt'])),
                this['l_butt_lib'] = g['selected_butt']['key'] || '',
                this['l_mode'] = 'bc';
            },
            'click_selected_category'(f, g) {},
            'click_selected_butt_category'(f, g) {},
            'select_butt_item'(f) {
                var g = copy_object(f)
                  , f = (g['mat_group_key'] = this['mat_group_key'],
                {
                    'mat_group_key': g['mat_group_key'],
                    'obj_groups': g['group'],
                    'butt_key': g['key'],
                    'butt_id': g['id']
                });
                if ('global' === this['method']) {
                    for (let k = 0x0; k < g['group']['length']; k++) {
                        var h = g['group'][k]
                          , h = this['l_module_groups'][h]['selected_butt'];
                        g['key'] === h['key'] && (h['id'] = g['id']);
                    }
                    for (let l = 0x0; l < g['group']['length']; l++) {
                        var j = g['group'][l]
                          , j = (project_settings['kitchen']['mat_groups'][g['mat_group_key']]['selected_butt'] || (project_settings['kitchen']['mat_groups'][g['mat_group_key']]['selected_butt'] = {}),
                        project_settings['kitchen']['mat_groups'][g['mat_group_key']]['selected_butt'][j]);
                        j['key'] === g['key'] && (j['id'] = g['id']);
                    }
                    f['group'] = {
                        'is_global': !0x0
                    },
                    sc['change_material_groups'](f);
                }
                'single' === this['method'] && this['$emit']('select_item', f);
            },
            'select_item'(f={
                'id': 0x0,
                'variant_id': 0x0,
                'thickness': 0x0,
                'key': 0x0,
                'group': []
            }) {
                let g = {
                    'mat_group_key': this['mat_group_key'],
                    'mat_key': f['key'],
                    'mat_id': f['id'],
                    'mat_variant_id': f['variant_id'],
                    'mat_thickness': f['thickness'],
                    'obj_groups': f['group']
                };
                if ('global' == this['method']) {
                    var f = pp['libs']['materials_info']['keys'], h, j = _['find'](f, q => q['key'] === g['mat_key'])?.['butts'] || '';
                    let p = !0x1;
                    for (let q = 0x0; q < g['obj_groups']['length']; q++) {
                        var k = g['obj_groups'][q]
                          , m = this['l_module_groups'][k]
                          , n = (m['selected']['id'] = g['mat_id'],
                        m['selected']['key'] = g['mat_key'],
                        m['selected']['variant_id'] = g['mat_variant_id'],
                        project_settings['kitchen']['mat_groups'][g['mat_group_key']]['selected_butt'][k]);
                        n['key'] !== j && (n['key'] = j,
                        n['id'] = 0x0,
                        m['selected_butt']['key'] = j,
                        m['selected_butt']['id'] = 0x0,
                        this['l_module_groups'][k]['selected_butt'] = {
                            ...this['l_module_groups'][k]['selected_butt']
                        },
                        this['l_module_groups'][k] = {
                            ...this['l_module_groups'][k]
                        },
                        this['l_module_groups'] = {
                            ...this['l_module_groups']
                        },
                        p = !0x0),
                        project_settings['kitchen']['mat_groups'][g['mat_group_key']]['selected'][k] = {
                            'key': g['mat_key'],
                            'id': g['mat_id'],
                            'variant_id': g['mat_variant_id']
                        };
                    }
                    p && (g['butt_key'] = j,
                    g['butt_id'] = 0x0),
                    g['group'] = {
                        'is_global': !0x0
                    },
                    sc['change_material_groups'](g);
                }
                'single' == this['method'] && (g['mat_group_key'] = this['material_group']['key'],
                g['group'] = this['material_group'] ? copy_object(this['material_group']) : null,
                this['$emit']('select_item', g));
            }
        }
    });
}),
interface_components_init['push'](function() {
    Vue['component']('facade_details', {
        'template': '#facade_details_template',
        'props': {
            'facades_data': {
                'type': Array,
                'default': function() {
                    return [];
                }
            },
            'can_group': {
                'type': [Number, Boolean],
                'default': 0x1
            },
            'can_handles': {
                'type': [Number, Boolean],
                'default': 0x1
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                'f_data': []
            };
        },
        'watch': {},
        'created': function() {
            this['cr']();
        },
        'updated': function() {},
        'methods': {
            'cr'() {
                this['$options']['f_lib'] = facades_lib,
                this['$options']['m_lib'] = materials_lib,
                this['$options']['h_lib'] = handles_lib,
                this['$options']['g_lib'] = glass_lib,
                Vue['set'](this, 'f_data', this['facades_data']);
            },
            'item_click': function(f) {},
            'mouse_over': function(f) {
                var g = this['find_object'](f)['obj'];
                f['path'] && g['userData']['own_object']['children'][0x0] ? sel_box['build_by_object'](g['userData']['own_object']['children'][0x0]['facade']) : sel_box['build_by_object'](g);
            },
            'mouse_leave': function(f) {
                sel_box['hide']();
            },
            'get_fac_icon'(f) {
                var g = {}
                  , h = this['$options']['f_lib']['items'][f['params']['facade']]['icon'];
                return g['background-image'] = '' == h ? 'url(/common_assets/images/no_image.png)' : 'url(' + h + ')',
                g;
                return this['$options']['f_lib']['items'][f['params']['facade']]['icon'];
            },
            'get_type_icon': function(f) {
                var g = {
                    'full': '/common_assets/images/icons/common_full_78.jpg',
                    'window': '/common_assets/images/icons/common_window_78.jpg',
                    'frame': '/common_assets/images/icons/common_frame_78.jpg'
                }
                  , h = {
                    'full': 'radius',
                    'window': 'radius_window',
                    'radius_window2': 'radius_window2',
                    'frame': 'radius_frame'
                }
                  , j = this['$options']['f_lib']['items'][f['params']['facade']];
                let k = copy_object(f['params']['style'])
                  , l = ''
                  , m = (Array['isArray'](k) && (k = k[0x0]),
                isNaN(parseInt(k)) && (l = k,
                k = f['params']['radius'] ? j['compatibility_types'][h[k]] : j['compatibility_types'][k]),
                null == k && (k = 0x0),
                j['types'][k]['icon']);
                var f = {};
                return '' == (m = '' == m ? g[l] : m) ? f['background-image'] = 'url(/common_assets/images/no_image.png)' : f['background-image'] = 'url(' + m + ')',
                f;
                return m;
            },
            'select_facade': function(f) {
                this['$root']['$emit']('select_single_facade', f);
            },
            'select_handle': function(f) {
                this['$root']['$emit']('select_single_handle', f);
            },
            'set_next_facade_type': function(f) {
                var g = this['find_object'](f)
                  , h = parseInt(this['find_type'](f));
                let j = this['$options']['f_lib']['items'][f['params']['facade']];
                var k = j['types'];
                let l = parseInt(h) + 0x1;
                if (f['params']['radius']) {
                    for (let m = h; m < k['length']; m++) {
                        if (!k[m + 0x1]) {
                            l = 0x0;
                            break;
                        }
                        if (k[m + 0x1] && k[m + 0x1]['radius']) {
                            l = m + 0x1;
                            break;
                        }
                    }
                    if (!k[l]['radius'])
                        for (let o = 0x0; o < k['length']; o++) {
                            if (!k[o + 0x1]) {
                                l = 0x0;
                                break;
                            }
                            if (k[o + 0x1] && k[o + 0x1]['radius']) {
                                l = o + 0x1;
                                break;
                            }
                        }
                } else {
                    for (let p = h; p < k['length']; p++) {
                        if (!k[p + 0x1]) {
                            l = 0x0;
                            break;
                        }
                        if (k[p + 0x1] && !k[p + 0x1]['radius']) {
                            l = p + 0x1;
                            break;
                        }
                    }
                    if (k[l]['radius'])
                        for (let q = 0x0; q < k['length']; q++) {
                            if (!k[q + 0x1]) {
                                l = 0x0;
                                break;
                            }
                            if (k[q + 0x1] && !k[q + 0x1]['radius']) {
                                l = q + 0x1;
                                break;
                            }
                        }
                }
                Object['keys'](j['compatibility_types'])['forEach'](function(r) {
                    j['compatibility_types'][r] == l && (l = r);
                }),
                g['params']['style'] = l,
                g['params']['style'] = [l, l],
                g['obj']['params']['style'] = [l, l],
                f['params']['style'] = [l, l],
                g['obj']['change_facade_style'](l);
            },
            'find_type': function(f) {
                var g = this['$options']['f_lib']['items'][f['params']['facade']];
                let h = copy_object(f['params']['style']);
                return Array['isArray'](h) && (h = h[0x0]),
                h = null == (h = isNaN(parseInt(h)) ? g['compatibility_types'][h] : h) ? 0x0 : h;
            },
            'find_object': function(f) {
                return f['path'] ? this['$root']['$selected_object']['get_child_by_path'](f['path']) : this['$root']['$selected_object']['find_child_by_index'](f['type'], f['index'], f['sec_index']);
            },
            'select_facade_type': function(f) {
                this['$root']['$emit']('select_facade_type', f);
            },
            'get_facade_name': function(f) {
                return this['$options']['f_lib']['items'][f['params']['facade']]['name'];
            },
            'get_facade_type_name': function(f) {
                return this['$options']['f_lib']['items'][f['params']['facade']]['types'][this['find_type'](f)]['name'];
            },
            'change_group': function(f) {
                this['$root']['$selected_object']['change_facade_group_single'](f['params']['group'], f['type'], f['index'], f['sec_index']);
            },
            'change_handle_active': function(f) {
                f['params']['no_handle_forced'] = !f['params']['no_handle_forced'],
                this['$root']['$selected_object']['set_handle_active_single'](f['params']['no_handle_forced'], f['type'], f['index'], f['sec_index']);
            },
            'change_handle_position': function(f) {
                this['$root']['$selected_object']['change_handle_position_single'](f['params']['handle_position'], f['type'], f['index'], f['sec_index']);
            },
            'change_handle_orientation': function(f) {
                this['$root']['$selected_object']['change_handle_orientation_single'](f['params']['handle_orientation'], f['type'], f['index'], f['sec_index']);
            },
            'change_single_handle_size': function(f, g) {
                this['$root']['$selected_object']['change_handle_model_single'](f, g['type'], g['index'], g['sec_index']);
            },
            'get_type'(f) {
                return 'd' == f['type'] ? this['lang']('door') : this['lang']('locker');
            },
            'lock': function(f) {
                f['params']['params_locked'] = !f['params']['params_locked'],
                f['path'] ? this['$root']['$selected_object']['change_param'](f['path'], 'spec.params_locked', f['params']['params_locked']) : this['$root']['$selected_object']['lock_object'](f['params']['params_locked'], f['type'], f['index'], f['sec_index']);
            },
            'change_active': function(f) {
                f['params']['active'] = !f['params']['active'],
                f['path'] ? this['$root']['$selected_object']['change_param'](f['path'], 'spec.active', f['params']['active']) : this['$root']['$selected_object']['change_object_active'](f['params']['active'], f['type'], f['index'], f['sec_index']);
            }
        }
    });
}),
interface_components_init['push'](function() {
    Vue['component']('furniture_picker', {
        'template': '#furniture_picker_template',
        'props': {
            'furniture_data': {
                'type': Object,
                'default': null
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                'category': 0x0,
                'search': '',
                'debounce': null,
                'selected': {},
                'types': {},
                'tags': [],
                'tags_hash': {},
                'offset': {
                    'left': 0x0,
                    'top': 'auto',
                    'bottom': 'auto'
                },
                'hovered': null,
                'show': !0x1,
                'hovering': !0x1,
                'delay': 0xc8,
                'l_mode': 'p'
            };
        },
        'created': function() {
            Vue['set'](this, 'selected', copy_object(project_settings['selected_furniture'])),
            Vue['set'](this, 'types', copy_object(accsessories_data['types'])),
            this['$options']['ad'] = accsessories_data,
            this['$options']['elem'] = document['getElementById']('interface');
        },
        'computed': {
            'items': function() {
                let e = {};
                if ('' == this['search'])
                    e = copy_object(this['types'][this['category']]);
                else {
                    let f = this['search']['toLowerCase']();
                    Object['keys'](this['types'][this['category']])['forEach'](g => {
                        var h = accsessories_data['items'][g];
                        (h['name'] && -0x1 < h['name']['toLowerCase']()['indexOf'](f) || h['code'] && -0x1 < h['code']['toLowerCase']()['indexOf'](f)) && (e[g] = 0x1);
                    }
                    );
                }
                if (this['tags']['length']) {
                    let g = {};
                    for (let h = 0x0; h < this['tags']['length']; h++)
                        Object['keys'](e)['forEach'](j => {
                            var k;
                            -0x1 < accsessories_data['items'][j]['tags']['indexOf'](this['tags'][h]) && (g[j] = 0x1);
                        }
                        );
                    return g;
                }
                return e;
            }
        },
        'mounted': function() {
            this['set_panel_height']();
        },
        'beforeUpdate': function() {},
        'updated': function() {},
        'methods': {
            'tag_click'(f) {
                if (this['tags_hash'][f]) {
                    Vue['delete'](this['tags_hash'], f);
                    for (let g = this['tags']['length']; g--; )
                        this['tags'][g] == f && this['tags']['splice'](g, 0x1);
                } else
                    Vue['set'](this['tags_hash'], f, 0x1),
                    this['tags']['push'](f);
                this['set_panel_height']();
            },
            'do_search': function(e) {
                clearTimeout(this['debounce']),
                this['debounce'] = setTimeout( () => {
                    this['search'] = e['target']['value'],
                    this['set_panel_height']();
                }
                , 0x258);
            },
            'clear_search': function() {
                this['$refs']['search_input']['value'] = '',
                this['search'] = '',
                this['set_panel_height']();
            },
            'select_category': function(e) {
                this['category'] = e,
                this['set_panel_height']();
            },
            'get_name': function(e) {
                switch (e) {
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
                    return this['$options']['ad']['type_names'][e];
                }
            },
            'get_type_active': function(e) {
                return null != this['$options']['ad']['default'][e];
            },
            'get_image': function(f) {
                var g, h;
                return this['$options']['ad']['items'][f]['images']['split'](',')[0x0]['trim']();
            },
            'item_style': function(f) {
                var g, h, f = this['$options']['ad']['items'][f]['images']['split'](',')[0x0]['trim'](), j = {};
                return f && (j['background-image'] = 'url(' + f + ')'),
                j;
            },
            'item_name': function(e) {
                return this['$options']['ad']['items'][e]['name'];
            },
            'item_price': function(e) {
                return this['lang']('price_per_piece') + ':\x20' + parseFloat(e)['toFixed'](0x2) + '\x20' + this['lang']('currency');
            },
            'select_item'(f, g) {
                if (this['selected'][f] != g) {
                    this['selected'][f] = g,
                    project_settings['selected_furniture'][f] = g;
                    for (let h = 0x0; h < room['active_objects']['length']; h++)
                        if ('Cabinet' === room['active_objects'][h]['type']) {
                            let j = 0x0;
                            0x0 == (j = room['active_objects'][h]['params']['accessories_types'][f] && room['active_objects'][h]['params']['accessories_types'][f]['excluded']['includes'](g) ? 0x1 : j) && (room['active_objects'][h]['params']['selected_furniture'][f] = g,
                            room['active_objects'][h]['selected_furniture'][f] = g);
                        }
                    get_total_price_test();
                }
            },
            'get_active': function(e) {
                return 0x1 == this['$options']['ad']['items'][e]['active'];
            },
            'hover'(f, g) {
                let h = this;
                this['hovering'] = !0x0,
                this['hovered'] = f,
                this['get_coords'](g),
                setTimeout(function() {
                    h['show'] = h['hovering'];
                }, this['delay']);
            },
            'unhover'() {
                this['hovered'] = null,
                this['hovering'] = !0x1,
                this['show'] = !0x1;
            },
            'get_coords': function(f) {
                var f = f['target']['getBoundingClientRect']()
                  , g = this['$options']['elem']['clientHeight'] / 0x2;
                f['y'] > g ? (this['offset']['top'] = 'auto',
                this['offset']['bottom'] = 0x2 * g - f['y'] - f['height']) : (this['offset']['top'] = f['y'],
                this['offset']['bottom'] = 'auto'),
                this['offset']['left'] = f['x'] + f['width'] + 0x5;
            },
            'get_position': function(e) {
                return {
                    'top': 'auto' == this['offset']['top'] ? 'auto' : this['offset']['top'] + 'px',
                    'bottom': 'auto' == this['offset']['bottom'] ? 'auto' : this['offset']['bottom'] + 'px',
                    'left': this['offset']['left'] + 'px'
                };
            },
            'set_panel_height': function() {},
            'lang': function(e) {
                return this['$root']['lang'](e);
            },
            'set_category'(f, g) {
                this['l_mode'] = 'c',
                this['category'] = g,
                this['set_panel_height']();
            }
        }
    }),
    Vue['component']('selected_furniture', {
        'template': '#selected_furniture_template',
        'props': {
            'item': {
                'type': [Number, String],
                'default': null
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                'selected': {},
                'types': {},
                'offset': {
                    'left': 0x0,
                    'top': 'auto',
                    'bottom': 'auto'
                },
                'hovered': null,
                'show': !0x1,
                'hovering': !0x1,
                'delay': 0xc8,
                'l_mode': 'p'
            };
        },
        'created': function() {
            this['$options']['ad'] = accsessories_data;
        },
        'computed': {
            'name': function() {
                return this['$options']['ad']['items'][this['item']]['name'];
            },
            'code': function() {
                return this['$options']['ad']['items'][this['item']]['code'];
            }
        },
        'mounted': function() {},
        'beforeUpdate': function() {},
        'updated': function() {},
        'methods': {
            'click': function() {
                this['$emit']('e_click', this['item']);
            },
            'item_style': function() {
                var f, g, h = this['$options']['ad']['items'][this['item']]['images']['split'](',')[0x0]['trim'](), j = {};
                return h && (j['background-image'] = 'url(' + h + ')'),
                j;
            },
            'lang': function(e) {
                return this['$root']['lang'](e);
            }
        }
    }),
    Vue['component']('furniture_picker_single', {
        'template': '#furniture_picker_single_template',
        'props': {
            'c_key': {
                'type': [Number, String],
                'default': null
            },
            'selected': {
                'type': [Number, String],
                'default': null
            },
            'obj_data': {
                'type': [Object],
                'default': function() {
                    return {
                        'excluded': []
                    };
                }
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {
                'l_selected': 0x0,
                'category': 0x0,
                'search': '',
                'debounce': null,
                'types': {},
                'tags': [],
                'tags_hash': {},
                'offset': {
                    'left': 0x0,
                    'top': 'auto',
                    'bottom': 'auto'
                },
                'hovered': null,
                'show': !0x1,
                'hovering': !0x1,
                'delay': 0xc8,
                'l_mode': 'c'
            };
        },
        'created': function() {
            this['l_selected'] = this['selected'],
            Vue['set'](this, 'types', copy_object(accsessories_data['types'])),
            this['$options']['ad'] = accsessories_data,
            this['$options']['elem'] = document['getElementById']('interface');
        },
        'computed': {
            'items': function() {
                let e = {};
                if ('' == this['search'])
                    Object['keys'](this['types'][this['c_key']])['forEach'](f => {
                        this['obj_data']['excluded'] && this['obj_data']['excluded']['includes'](f) || (e[f] = 0x1);
                    }
                    );
                else {
                    let f = this['search']['toLowerCase']();
                    Object['keys'](this['types'][this['c_key']])['forEach'](g => {
                        var h;
                        this['obj_data']['excluded'] && this['obj_data']['excluded']['includes'](g) || ((h = accsessories_data['items'][g])['name'] && -0x1 < h['name']['toLowerCase']()['indexOf'](f) || h['code'] && -0x1 < h['code']['toLowerCase']()['indexOf'](f)) && (e[g] = 0x1);
                    }
                    );
                }
                if (this['tags']['length']) {
                    let g = {};
                    for (let h = 0x0; h < this['tags']['length']; h++)
                        Object['keys'](e)['forEach'](j => {
                            var k;
                            -0x1 < accsessories_data['items'][j]['tags']['indexOf'](this['tags'][h]) && (g[j] = 0x1);
                        }
                        );
                    return g;
                }
                return e;
            }
        },
        'mounted': function() {
            this['set_panel_height']();
        },
        'beforeUpdate': function() {},
        'updated': function() {},
        'methods': {
            'tag_click'(f) {
                if (this['tags_hash'][f]) {
                    Vue['delete'](this['tags_hash'], f);
                    for (let g = this['tags']['length']; g--; )
                        this['tags'][g] == f && this['tags']['splice'](g, 0x1);
                } else
                    Vue['set'](this['tags_hash'], f, 0x1),
                    this['tags']['push'](f);
                this['set_panel_height']();
            },
            'do_search': function(e) {
                clearTimeout(this['debounce']),
                this['debounce'] = setTimeout( () => {
                    this['search'] = e['target']['value'],
                    this['set_panel_height']();
                }
                , 0x258);
            },
            'clear_search': function() {
                this['$refs']['search_input']['value'] = '',
                this['search'] = '',
                this['set_panel_height']();
            },
            'select_category': function(e) {
                this['category'] = e;
            },
            'get_name': function(e) {
                switch (e) {
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
                    return this['$options']['ad']['type_names'][e];
                }
            },
            'get_type_active': function(e) {
                return null != this['$options']['ad']['default'][e];
            },
            'get_image': function(f) {
                var g, h;
                return this['$options']['ad']['items'][f]['images']['split'](',')[0x0]['trim']();
            },
            'item_style': function(f) {
                var g, h, f = this['$options']['ad']['items'][f]['images']['split'](',')[0x0]['trim'](), j = {};
                return f && (j['background-image'] = 'url(' + f + ')'),
                j;
            },
            'item_name': function(e) {
                return this['$options']['ad']['items'][e]['name'];
            },
            'item_price': function(e) {
                return this['lang']('price_per_piece') + ':\x20' + parseFloat(e)['toFixed'](0x2) + '\x20' + this['lang']('currency');
            },
            'select_item'(e) {
                this['l_selected'] = e,
                this['$emit']('select_furni_single', {
                    'key': this['c_key'],
                    'id': e
                });
            },
            'get_active': function(e) {
                return 0x1 == this['$options']['ad']['items'][e]['active'];
            },
            'hover'(f, g) {
                let h = this;
                this['hovering'] = !0x0,
                this['hovered'] = f,
                this['get_coords'](g),
                setTimeout(function() {
                    h['show'] = h['hovering'];
                }, this['delay']);
            },
            'unhover'() {
                this['hovered'] = null,
                this['hovering'] = !0x1,
                this['show'] = !0x1;
            },
            'get_coords': function(f) {
                var f = f['target']['getBoundingClientRect']()
                  , g = this['$options']['elem']['clientHeight'] / 0x2;
                f['y'] > g ? (this['offset']['top'] = 'auto',
                this['offset']['bottom'] = 0x2 * g - f['y'] - f['height']) : (this['offset']['top'] = f['y'],
                this['offset']['bottom'] = 'auto'),
                this['offset']['left'] = f['x'] + f['width'] + 0x5;
            },
            'get_position': function(e) {
                return {
                    'top': 'auto' == this['offset']['top'] ? 'auto' : this['offset']['top'] + 'px',
                    'bottom': 'auto' == this['offset']['bottom'] ? 'auto' : this['offset']['bottom'] + 'px',
                    'left': this['offset']['left'] + 'px'
                };
            },
            'set_panel_height': function() {},
            'lang': function(e) {
                return this['$root']['lang'](e);
            },
            'set_category'(f, g) {
                this['l_mode'] = 'c',
                this['category'] = g;
            }
        }
    });
}),
interface_components_init['push'](function() {
    Vue['component']('global_vars', {
        'template': '#global_vars_template',
        'props': [],
        'data': function() {
            return {
                'group': null,
                'selected_index': 0x0,
                'delay': 'undefined' == typeof input_delay ? 0x1f4 : input_delay,
                'debounce': null
            };
        },
        'created': function() {
            this['cr']();
        },
        'methods': {
            'cr'() {
                var f = pp['variables']
                  , g = (this['$options']['variables'] = f,
                []);
                for (let i = 0x0; i < f['global_vars']['length']; i++) {
                    var h = f['global_vars'][i];
                    h['active'] && g['push']({
                        'name': h['name'],
                        'key': h['key'],
                        'index': i
                    });
                }
                this['$options']['sets'] = g,
                this['selected_index'] = f['selected_index'],
                this['group'] = this['group_vars'](f['current']);
            },
            'select_vars'() {
                sc['select_global_vars'](this['selected_index'], !0x1),
                this['group'] = this['group_vars'](this['$options']['variables']['current']),
                sc['rebuild_all']();
            },
            'change_select'(f) {
                this['do_change'](f);
            },
            'change_number'(e, f) {
                clearTimeout(this['debounce']),
                this['debounce'] = setTimeout( () => {
                    var g = parseFloat(e['params']['max'])
                      , h = parseFloat(e['params']['min'])
                      , i = parseFloat(f['target']['value']);
                    g < i ? (f['target']['value'] = g,
                    e['value'] = g) : i < h ? (f['target']['value'] = h,
                    e['value'] = h) : e['value'] = i,
                    this['do_change'](e);
                }
                , this['delay']);
            },
            'do_change'(f) {
                sc['change_global_var'](f['key'], f['value']);
            },
            'group_vars'(f) {
                if (!f)
                    return [];
                var g = [], h = {}, i, j;
                for (i of f = copy_object(f))
                    if (i['editable'] && i['key']) {
                        var k = i['group'] || '';
                        let l = h[k];
                        l || (l = {
                            'name': k,
                            'order': void 0x0,
                            'vars': []
                        },
                        h[k] = l,
                        g['push'](l)),
                        h[k]['vars']['push'](i),
                        '' === i['order'] && (i['order'] = void 0x0),
                        void 0x0 !== i['order'] && (void 0x0 !== l['order'] ? l['order'] = Math['min'](l['order'], i['order']) : l['order'] = i['order']);
                    }
                for (j of g)
                    j['vars']['sort']( (m, n) => void 0x0 === m['order'] && void 0x0 === n['order'] ? 0x0 : void 0x0 === m['order'] ? 0x1 : void 0x0 === n['order'] ? -0x1 : m['order'] - n['order']);
                return g['sort']( (m, n) => void 0x0 === m['order'] && void 0x0 === n['order'] ? 0x0 : void 0x0 === m['order'] ? 0x1 : void 0x0 === n['order'] ? -0x1 : m['order'] - n['order']),
                g;
            },
            'lang'(f) {
                return this['$root']['lang'](f);
            }
        }
    });
}),
interface_components_init['push'](function() {
    Vue['component']('graphic_settings', {
        'template': '#graphic_settings_template',
        'props': {},
        'mixins': [mixin],
        'data': function() {
            return {
                'l_mode': 'p',
                'currentSettings': null
            };
        },
        'created': function() {
            this['$options']['the_renderer'] = renderer,
            this['currentSettings'] = {
                'toneMapping': this['$options']['the_renderer']['toneMapping'],
                'toneMappingExposure': this['$options']['the_renderer']['toneMappingExposure'],
                'shadowMap': {
                    'enabled': this['$options']['the_renderer']['shadowMap']['enabled'],
                    'type': this['$options']['the_renderer']['shadowMap']['type']
                },
                'outputColorSpace': this['$options']['the_renderer']['outputColorSpace'],
                'physicallyCorrectLights': this['$options']['the_renderer']['physicallyCorrectLights'],
                'pixelRatio': window['devicePixelRatio']
            },
            this['$options']['renderer'] = {
                'shadowMapTypes': [{
                    'name': 'Basic\x20Shadow\x20Map',
                    'value': THREE['BasicShadowMap']
                }, {
                    'name': 'PCF\x20Shadow\x20Map',
                    'value': THREE['PCFShadowMap']
                }, {
                    'name': 'PCF\x20Soft\x20Shadow\x20Map',
                    'value': THREE['PCFSoftShadowMap']
                }, {
                    'name': 'VSM\x20Shadow\x20Map',
                    'value': THREE['VSMShadowMap']
                }],
                'toneMapping': [{
                    'name': 'THREE.NoToneMapping',
                    'val': THREE['NoToneMapping']
                }, {
                    'name': 'THREE.LinearToneMapping',
                    'val': THREE['LinearToneMapping']
                }, {
                    'name': 'THREE.ReinhardToneMapping',
                    'val': THREE['ReinhardToneMapping']
                }, {
                    'name': 'THREE.CineonToneMapping',
                    'val': THREE['CineonToneMapping']
                }, {
                    'name': 'THREE.ACESFilmicToneMapping',
                    'val': THREE['ACESFilmicToneMapping']
                }, {
                    'name': 'THREE.AgXToneMapping',
                    'val': THREE['AgXToneMapping']
                }, {
                    'name': 'THREE.NeutralToneMapping',
                    'val': THREE['NeutralToneMapping']
                }],
                'colorSpaces': [{
                    'name': 'sRGB',
                    'value': THREE['SRGBColorSpace']
                }, {
                    'name': 'Linear',
                    'value': THREE['LinearSRGBColorSpace']
                }]
            };
        },
        'methods': {
            'updateSetting'(f, g) {
                if (this['$options']['the_renderer'])
                    switch (f) {
                    case 'toneMapping':
                        this['$options']['the_renderer']['toneMapping'] = parseInt(g),
                        this['currentSettings']['toneMapping'] = parseInt(g);
                        break;
                    case 'toneMappingExposure':
                        this['$options']['the_renderer']['toneMappingExposure'] = g,
                        this['currentSettings']['toneMappingExposure'] = g;
                        break;
                    case 'shadowMapEnabled':
                        this['$options']['the_renderer']['shadowMap']['enabled'] = g,
                        this['$options']['the_renderer']['shadowMap']['needsUpdate'] = !0x0,
                        this['currentSettings']['shadowMap']['enabled'] = g;
                        break;
                    case 'shadowMapType':
                        this['$options']['the_renderer']['shadowMap']['type'] = g,
                        this['$options']['the_renderer']['shadowMap']['needsUpdate'] = !0x0,
                        this['currentSettings']['shadowMap']['type'] = g;
                        break;
                    case 'outputColorSpace':
                        this['$options']['the_renderer']['outputColorSpace'] = g,
                        this['currentSettings']['outputColorSpace'] = g;
                        break;
                    case 'physicallyCorrectLights':
                        this['$options']['the_renderer']['physicallyCorrectLights'] = g,
                        this['currentSettings']['physicallyCorrectLights'] = g;
                        break;
                    case 'pixelRatio':
                        this['$options']['the_renderer']['setPixelRatio'](g),
                        this['currentSettings']['pixelRatio'] = g;
                        break;
                    }
            },
            'applySettings'(f) {
                var f;
                this['$options']['the_renderer'] && ((f = {
                    ...this['currentSettings'],
                    ...f
                })['toneMapping'] !== this['currentSettings']['toneMapping'] && (this['$options']['the_renderer']['toneMapping'] = f['toneMapping']),
                f['toneMappingExposure'] !== this['currentSettings']['toneMappingExposure'] && (this['$options']['the_renderer']['toneMappingExposure'] = f['toneMappingExposure']),
                f['shadowMap']['enabled'] !== this['currentSettings']['shadowMap']['enabled'] && (this['$options']['the_renderer']['shadowMap']['enabled'] = f['shadowMap']['enabled'],
                this['$options']['the_renderer']['shadowMap']['needsUpdate'] = !0x0),
                f['shadowMap']['type'] !== this['currentSettings']['shadowMap']['type'] && (this['$options']['the_renderer']['shadowMap']['type'] = f['shadowMap']['type'],
                this['$options']['the_renderer']['shadowMap']['needsUpdate'] = !0x0),
                f['outputColorSpace'] !== this['currentSettings']['outputColorSpace'] && (this['$options']['the_renderer']['outputColorSpace'] = f['outputColorSpace']),
                f['physicallyCorrectLights'] !== this['currentSettings']['physicallyCorrectLights'] && (this['$options']['the_renderer']['physicallyCorrectLights'] = f['physicallyCorrectLights']),
                f['pixelRatio'] !== this['currentSettings']['pixelRatio'] && this['$options']['the_renderer']['setPixelRatio'](f['pixelRatio']),
                this['currentSettings'] = f);
            },
            'resetToDefaults'() {
                var f = {
                    'toneMapping': THREE['NoToneMapping'],
                    'toneMappingExposure': 0x1,
                    'shadowMap': {
                        'enabled': !0x0,
                        'type': THREE['PCFShadowMap']
                    },
                    'outputColorSpace': THREE['SRGBColorSpace'],
                    'localClippingEnabled': !0x1,
                    'physicallyCorrectLights': !0x0,
                    'outputEncoding': THREE['sRGBEncoding'],
                    'gammaFactor': 0x2,
                    'autoClear': !0x0,
                    'autoClearColor': !0x0,
                    'autoClearDepth': !0x0,
                    'autoClearStencil': !0x0,
                    'sortObjects': !0x0,
                    'clippingPlanes': [],
                    'logarithmicDepthBuffer': !0x1,
                    'pixelRatio': window['devicePixelRatio']
                };
                this['applySettings'](f);
            }
        }
    });
});
function icon_init() {
    Vue['component']('icon', {
        'template': '#icon_template',
        'props': {
            'name': {
                'type': String,
                'required': !0x0
            },
            'width': {
                'type': [String, Number],
                'default': 0x20
            },
            'height': {
                'type': [String, Number],
                'default': 0x20
            },
            'cls': {
                'type': String,
                'default': ''
            },
            'title': {
                'type': String,
                'default': ''
            }
        },
        'mixins': [mixin],
        'data': function() {
            return {};
        },
        'methods': {
            'handleClick'() {
                this['$emit']('click');
            }
        }
    });
}
interface_components_init['push'](icon_init),
interface_components_init['push'](function() {
    Vue['component']('interactive_menu', {
        'template': '#interactive_menu_template',
        'props': {},
        'mixins': [mixin],
        'data': function() {
            return {
                'show': !0x1,
                'panel_showed': 0x0,
                'selected': null,
                'current_item': null,
                'current_props': {},
                'interactive_params': [],
                'variables': {},
                'name': '',
                'delay': 'undefined' == typeof input_delay ? 0x1f4 : input_delay,
                'debounce': null
            };
        },
        'watch': {},
        'created': function() {
            this['$root']['$on']('show_interactive_menu', f => {
                this['show'] = !0x0;
            }
            ),
            this['$root']['$on']('hide_interactive_menu', f => {
                this['show'] = !0x1;
            }
            ),
            this['$root']['$on']('set_interactive', f => {
                this['set_item'](f),
                this['show'] = !0x0;
            }
            );
        },
        'methods': {
            'set_item'(f) {
                this['name'] = f['name'],
                this['variables'] = f['get_local_variables_array']();
                var g = f['userData']['class'] + '_' + f['userData']['params']['spec']['id'], g;
                void 0x0 !== interactive_menu_params && interactive_menu_params[g] && (g = interactive_menu_params[g]['get'](f),
                Vue['set'](this, 'interactive_params', g));
            },
            'change_interactive_param'(f, g) {
                f['change']({
                    'obj': pp['interface']['root']['$interactive_object'],
                    'val': g['target']['value']
                });
            },
            'change_interactive_param_debounce'(f, g) {
                clearTimeout(this['debounce']),
                this['debounce'] = setTimeout( () => {
                    var h = parseInt(f['min'])
                      , i = parseInt(f['max']);
                    f['value'] < h && (f['value'] = h),
                    i < f['value'] && (f['value'] = i),
                    f['change']({
                        'obj': pp['interface']['root']['$interactive_object'],
                        'val': f['value']
                    });
                }
                , this['delay']);
            },
            'button_click'(f, g) {
                f['click'](pp['interface']['root']['$interactive_object']);
            },
            'change_current_item'(f) {
                f['click'](f, this);
            },
            'close_panel': function() {
                this['panel_showed'] = 0x0,
                this['selected'] = null,
                this['current_item'] = null;
            },
            'close_all': function() {
                this['show'] = !0x1,
                this['close_panel']();
            }
        }
    });
}),
interface_components_init['push'](function() {
    var f;
    Vue['component']('lockers_component', {
        'props': {
            'active_el': Object
        },
        'template': '\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20v-if=\x22params\x20&&\x20params.length\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22form-group\x20info_panel_locker_block\x22\x20v-for=\x22(item,\x20index)\x20in\x20params\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22row\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<label>Тип</label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<select\x20class=\x22form-control\x22\x20@change=\x22change_param(\x27type\x27,\x20index,\x20item.tmp_ind,\x20true)\x22\x20v-model=\x22item.type\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<option\x20:value=\x22key\x22\x20v-for=\x22(type,\x20key)\x20in\x20lockers_types\x22>{{type.name}}</option>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</select>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22row\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<label>Выдвижение</label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<select\x20class=\x22form-control\x22\x20@change=\x22change_type_param(\x27move\x27,\x20index,\x20item.tmp_ind,\x20true)\x22\x20v-model=\x22item.type_params.move\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<option\x20:value=\x22key\x22\x20v-for=\x22(type,\x20key)\x20in\x20lockers_types[item.type].move\x22>{{type.name}}</option>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</select>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22row\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<label>Тип\x20выдвижения</label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<select\x20class=\x22form-control\x22\x20@change=\x22change_type_param(\x27move_type\x27,\x20index,\x20item.tmp_ind,\x20true)\x22\x20v-model=\x22item.type_params.move_type\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<option\x20:value=\x22key\x22\x20v-for=\x22(type,\x20key)\x20in\x20lockers_types[item.type].move_types\x22>{{type.name}}</option>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</select>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22row\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<label>Дно</label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<select\x20class=\x22form-control\x22\x20@change=\x22change_type_param(\x27bottom_type\x27,\x20index,\x20item.tmp_ind,\x20true)\x22\x20v-model=\x22item.type_params.bottom_type\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<option\x20:value=\x22key\x22\x20v-for=\x22(type,\x20key)\x20in\x20lockers_types[item.type].bottom_types\x22>{{type.name}}</option>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</select>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20style=\x22display:\x20flex;\x20flex-direction:\x20column-reverse;\x22\x20v-if=\x22sec_params\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20v-if=\x22sec.lockers\x22\x20v-for=\x22(sec,\x20sec_ind)\x20in\x20sec_params\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22form-group\x20info_panel_locker_block\x22\x20v-for=\x22(item,\x20index)\x20in\x20sec.lockers\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22row\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<label>Тип</label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<select\x20class=\x22form-control\x22\x20@change=\x22change_sec_param(\x27type\x27,\x20index,\x20sec_ind,\x20true)\x22\x20v-model=\x22item.type\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<option\x20:value=\x22key\x22\x20v-for=\x22(type,\x20key)\x20in\x20lockers_types\x22>{{type.name}}</option>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</select>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22row\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<label>Выдвижение</label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<select\x20class=\x22form-control\x22\x20@change=\x22change_sec_type_param(\x27move\x27,\x20index,\x20sec_ind,\x20true)\x22\x20v-model=\x22item.type_params.move\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<option\x20:value=\x22key\x22\x20v-for=\x22(type,\x20key)\x20in\x20lockers_types[item.type].move\x22>{{type.name}}</option>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</select>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22row\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<label>Тип\x20выдвижения</label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<select\x20class=\x22form-control\x22\x20@change=\x22change_sec_type_param(\x27move_type\x27,\x20index,\x20sec_ind,\x20true)\x22\x20v-model=\x22item.type_params.move_type\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<option\x20:value=\x22key\x22\x20v-for=\x22(type,\x20key)\x20in\x20lockers_types[item.type].move_types\x22>{{type.name}}</option>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</select>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22row\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<label>Дно</label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<select\x20class=\x22form-control\x22\x20@change=\x22change_sec_type_param(\x27bottom_type\x27,\x20index,\x20sec_ind,\x20true)\x22\x20v-model=\x22item.type_params.bottom_type\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<option\x20:value=\x22key\x22\x20v-for=\x22(type,\x20key)\x20in\x20lockers_types[item.type].bottom_types\x22>{{type.name}}</option>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</select>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20v-if=\x22lockers_types[item.type].params.inner_enabled\x20==\x201\x20&&\x20check_inner_available_sec(item.type,\x20index,\x20sec_ind)\x22\x20class=\x22row\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<label>Внутренний</label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22col-sm-6\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<select\x20class=\x22form-control\x22\x20@change=\x22change_sec_type_param(\x27is_inner\x27,\x20index,\x20sec_ind,\x20true)\x22\x20v-model=\x22item.type_params.is_inner\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<option\x20:value=\x22$options.test[0]\x22>Нет</option>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<option\x20:value=\x22$options.test[1]\x22>Да</option>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</select>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20',
        'created': function() {
            let g = this;
            this['$root']['$on']('show_info_panel', function() {
                var h = copy_object(active_el['params']['lockers'])
                  , i = [];
                for (let l = 0x0; l < active_el['lockers']['children']['length']; l++)
                    i['push']({
                        'index': l,
                        'pos': active_el['lockers']['children'][l]['position']['y']
                    });
                i['sort'](function(m, n) {
                    return n['pos'] - m['pos'];
                });
                var j = [];
                for (let m = 0x0; m < i['length']; m++)
                    h[i[m]['index']]['tmp_ind'] = i[m]['index'],
                    j['push'](h[i[m]['index']]);
                g['params'] = j;
                var k = copy_object(active_el['params']['sections']);
                g['sec_params'] = k;
            }),
            this['$root']['$on']('hide_info_panel', function() {
                g['params'] = null;
            }),
            this['$options']['test'] = {
                0x1: 0x1,
                0x0: 0x0
            };
        },
        'mounted': function() {},
        'computed': {},
        'data': function() {
            return {
                'params': null,
                'sec_params': null,
                'selected_cat': -0x1,
                'selected': 0x0
            };
        },
        'methods': {
            'check_inner_available_sec': function(g, h, i) {
                if (!active_el)
                    return 0x0;
                let j = 0x0
                  , k = active_el['sections']['children'][i]['lockers']['children'][h]['params']['height'];
                return Object['keys'](lockers_types[g]['types'])['forEach'](function(l) {
                    0x1 == lockers_types[g]['types'][l]['is_inner'] && k >= lockers_types[g]['types'][l]['min_facade_height'] && k <= lockers_types[g]['types'][l]['max_facade_height'] && (j = 0x1);
                }),
                j;
            },
            'change_param': function(g, h, i, j=!0x1) {
                active_el['params']['lockers'][i][g] = this['params'][h][g],
                active_el['lockers']['children'][i]['params'][g] = this['params'][h][g],
                j && (active_el['lockers']['children'][i]['build'](),
                sc['get_price']());
            },
            'change_type_param': function(g, h, i, j=!0x1) {
                active_el['params']['lockers'][i]['type_params'][g] = this['params'][h]['type_params'][g],
                active_el['lockers']['children'][i]['params']['type_params'][g] = this['params'][h]['type_params'][g],
                j && (active_el['lockers']['children'][i]['build'](),
                sc['get_price']());
            },
            'change_sec_param': function(g, h, i, j=!0x1) {
                var j;
                'type' == g && (active_el['params']['sections'][i]['lockers'][h]['type_params']['params']['specs_count'] = copy_object(lockers_types[this['sec_params'][i]['lockers'][h][g]]['params']['specs_count']),
                active_el['sections']['children'][i]['lockers']['children'][h]['params']['type_params']['params']['specs_count'] = copy_object(lockers_types[this['sec_params'][i]['lockers'][h][g]]['params']['specs_count'])),
                active_el['params']['sections'][i]['lockers'][h][g] = this['sec_params'][i]['lockers'][h][g],
                active_el['sections']['children'][i]['lockers']['children'][h]['params'][g] = this['sec_params'][i]['lockers'][h][g],
                j && (active_el['sections']['children'][i]['lockers']['children'][h]['build'](),
                sc['get_price']()),
                'type' == g && ((j = copy_object(lockers_types[this['sec_params'][i]['lockers'][h][g]]))['move_types'][this['sec_params'][i]['lockers'][h]['type_params']['move_type']] || (this['sec_params'][i]['lockers'][h]['type_params']['move_type'] = Object['keys'](j['move_types'])[0x0]),
                j['move'][this['sec_params'][i]['lockers'][h]['type_params']['move']] || (this['sec_params'][i]['lockers'][h]['type_params']['move'] = Object['keys'](j['move'])[0x0]),
                j['bottom_types'][this['sec_params'][i]['lockers'][h]['type_params']['bottom_type']] || (this['sec_params'][i]['lockers'][h]['type_params']['bottom_type'] = Object['keys'](j['bottom_types'])[0x0]));
            },
            'change_sec_type_param': function(g, h, i, j=!0x1) {
                active_el['params']['sections'][i]['lockers'][h]['type_params'][g] = this['sec_params'][i]['lockers'][h]['type_params'][g],
                active_el['sections']['children'][i]['lockers']['children'][h]['params']['type_params'][g] = this['sec_params'][i]['lockers'][h]['type_params'][g],
                j && (active_el['sections']['children'][i]['lockers']['children'][h]['build'](),
                sc['get_price']());
            }
        }
    });
}),
interface_components_init['push'](function() {
    async function f() {
        if (pp['libs']['key_value'] && pp['libs']['key_value']['__custom_menu'] && pp['libs']['key_value']['__custom_menu']['value'])
            try {
                var h = JSON['parse'](pp['libs']['key_value']['__custom_menu']['value']);
                if (h['main_menu'])
                    return h['main_menu'];
            } catch (j) {}
        var i;
        return await check_file_exists('data/main_menu.json') ? promise_request('data/main_menu.json' + date_timestamp) : promise_request('/common_assets/data/main_menu.json' + date_timestamp);
    }
    function g() {
        let h = [];
        var i = document['querySelector']('svg[style*=\x22display:none\x22]'), j;
        return i ? (i['querySelectorAll']('symbol')['forEach'](k => {
            var k = k['id'], k;
            k && k['startsWith']('icon-') && (k = k['replace']('icon-', ''),
            h['push'](k));
        }
        ),
        h) : [];
    }
    Vue['component']('main_menu', {
        'template': '#main_menu_template',
        'data': function() {
            return {
                'heading': '',
                'is_minimized': !0x1,
                'current_item': null,
                'current_props': {},
                'opened': null,
                'selected': 0x0,
                'panel_showed': 0x0,
                'panel_expanded': !0x1,
                'items': [],
                'icons': {},
                'shop_mode': !0x1
            };
        },
        'computed': {},
        'beforeCreate': async function() {
            var h = await f();
            this['init_menu'](h);
        },
        'created': async function() {
            let h = this;
            this['shop_mode'] = this['$root']['$shop_mode'],
            this['$root']['$on']('expand_panel', function(i) {
                h['panel_expanded'] = !h['panel_expanded'];
            }),
            this['$root']['$on']('set_menu_option', function(i) {
                Object['keys'](i['props'])['forEach'](function(j) {
                    h['$options']['items_map'][i['id']]['component']['props'][j] = i['props'][j];
                });
            });
        },
        'mounted': function() {
            Vue['nextTick']( () => {
                setTimeout( () => {
                    'function' == typeof pp['events']['interface']['after_main_menu_init'] && pp['events']['interface']['after_main_menu_init'](this),
                    'function' == typeof main_menu_init_callback && main_menu_init_callback();
                }
                , 0x1);
            }
            );
        },
        'methods': {
            'init_menu': function(h) {
                var j = parseInt(document['getElementById']('t_rnd_pp')['value']);
                let k = 0x28 <= j || 0x14 == j || 0x11 == j || 0x32 == j
                  , l = ('function' == typeof pp['events']['interface']['before_main_menu_init'] && pp['events']['interface']['before_main_menu_init'](h, this),
                u(h, y => {
                    if (constructor_settings['core_v2'] && (y['component'] && 'facades_picker' == y['component']['id'] && (y['component']['id'] = 'facades_picker_v2'),
                    y['component']) && 'cokol_material_picker' == y['component']['id']) {
                        var z = _['get'](y['component'], 'props.lib');
                        let A = 'change_cokol';
                        'cokol_top' === z ? A = 'change_cokol_top' : 'legs' === z && (A = 'change_leg'),
                        y['component'] = {
                            'id': 'cokol_material_picker_v2',
                            'props': {
                                'fn': A,
                                'categories': null
                            }
                        },
                        z && (y['component']['props']['lib'] = z);
                    }
                }
                ),
                'function' == typeof menu_init_callback && menu_init_callback(h),
                this['$options']['items_map'] = {},
                0x1)
                  , m = (this['$options']['items_map'] = {},
                this);
                function q(y) {
                    for (let z = y['length']; z--; )
                        y[z]['component'] && 'catalog_picker' == y[z]['component']['id'] && !k && y['splice'](z, 0x1),
                        y[z]['fn'] && 'show_accessories_new' == y[z]['fn']['name'] && (y[z]['fn'] = null,
                        y[z]['component'] = {
                            'id': 'cart',
                            'props': {}
                        }),
                        y[z]['component'] && 'cornice_picker' == y[z]['component']['id'] && 0x0 == pp['interface']['root']['$cs']['cornice_available'] && y['splice'](z, 0x1),
                        y[z]['id'] = l,
                        m['$options']['items_map'][l] = y[z],
                        l++,
                        y[z]['children'] && y[z]['children']['length'] && q(y[z]['children']);
                }