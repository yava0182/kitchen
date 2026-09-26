        'par_cat': '',
        'str': ''
    };
    return g['mat'] = this['get_item'](f),
    g['cat'] = this['get_category'](g['mat']['category']),
    0x0 != g['cat']['parent'] && (g['par_cat'] = this['get_category'](g['cat']['parent'])),
    g['str'] = '',
    0x0 != g['cat']['parent'] && (g['str'] += g['par_cat']['name']),
    g['str'] += '\x20' + g['cat']['name'],
    g['str'] += '\x20' + g['mat']['name'],
    g['str'] += '\x20' + g['mat']['code'],
    g;
}
,
materials_lib['get_item_data'] = function(f) {
    var g = {
        'item': '',
        'category': '',
        'categories': []
    };
    if (g['item'] = this['get_item'](f),
    g['category'] = this['get_category'](g['item']['category']),
    g['categories']['push'](g['category']),
    g['category']['parent']) {
        let i = g['category']['parent'];
        for (; i; ) {
            var h = this['get_category'](i);
            g['categories']['unshift'](h),
            i = h['parent'];
        }
    }
    return g;
}
,
materials_lib['get_first_item'] = function(f) {
    if (this['get_category']([f])['items'] && this['get_category']([f])['items'][0x0])
        return this['get_category']([f])['items'][0x0];
    for (let g = 0x0; g < this['categories'][f]['categories']['length']; g++)
        if (this['categories'][f]['categories'][g]['items'] && this['categories'][f]['categories'][g]['items'][0x0])
            return this['categories'][f]['categories'][g]['items'][0x0];
}
,
materials_lib['get_top_category_by_material'] = function(f) {
    let g = this;
    var f = this['get_item'](f)
      , f = this['categories'][f['category']];
    return this['get_category'](h(f['id']));
    function h(i) {
        var i = g['categories'][i];
        return 0x0 == i['parent'] ? i['id'] : h(i['parent']);
    }
}
,
materials_lib['check_material_in_category'] = function(f, g) {
    let h = this['items'][f];
    if (h['category'] == g)
        return !0x0;
    var f = this['get_top_category'](g);
    let j = !0x1;
    return k(f),
    j;
    function k(l) {
        if (l['id'] == h['category'])
            j = !0x0;
        else {
            if (l['categories'] && l['categories']['length']) {
                for (let m = 0x0; m < l['categories']['length']; m++)
                    0x0 == j && k(l['categories'][m]);
            }
        }
    }
}
,
materials_lib['check_material_in_categories'] = function(f, g) {
    let h = this['items'][f]
      , j = !0x1;
    for (let p = 0x0; p < g['length']; p++) {
        var k = g[p], m;
        if (h['category'] == k)
            return !0x0;
        if (n(this['get_top_category'](k)),
        0x1 == j)
            return j;
    }
    return j;
    function n(q) {
        if (q['id'] == h['category'])
            j = !0x0;
        else {
            if (q['categories'] && q['categories']['length']) {
                for (let r = 0x0; r < q['categories']['length']; r++)
                    0x0 == j && n(q['categories'][r]);
            }
        }
    }
}
,
materials_lib['get_top_category'] = function(f) {
    var f = this['categories'][f];
    return f['parent'] ? this['get_top_category'](f['parent']) : f;
}
,
new lib(material_0,category_0));
glass_lib['get_data'] = function(f) {
    var g = {
        'mat': '',
        'cat': '',
        'par_cat': '',
        'str': ''
    };
    return g['mat'] = this['get_item'](f),
    g['cat'] = this['get_category'](g['mat']['category']),
    0x0 != g['cat']['parent'] && (g['par_cat'] = this['get_category'](g['cat']['parent'])),
    g['str'] = '',
    0x0 != g['cat']['parent'] && (g['str'] += g['par_cat']['name']),
    g['str'] += '\x20' + g['cat']['name'],
    g['str'] += '\x20' + g['mat']['name'],
    g['str'] += '\x20' + g['mat']['code'],
    g;
}
;
let facades_lib, kitchen_lib = new lib(material_0,category_0), models_lib = {}, model_0 = {
    'id': 0x0,
    'name': 'Модель\x20не\x20найдена',
    'category': 0x0,
    'model': '/common_assets/models/no_model.fbx',
    'icon': '/common_assets/images/no_image.png',
    'cabinet_group': 'top',
    'draggable': !0x1,
    'material': {
        'params': {
            'color': '#ff0000',
            'transparent': !0x0,
            'opacity': 0.3
        },
        'add_params': {}
    },
    'variants': [{
        'width': '200',
        'height': '50',
        'depth': '200'
    }],
    'sizes_available': !0x1
}, tech_lib = new lib(model_0,category_0), comms_lib = new lib(model_0,category_0), interior_lib = new lib(model_0,category_0), catalog_lib = new lib(model_0,category_0), bardesks_lib = new lib(model_0,category_0), models3d_lib = new lib(model_0,category_0), lockers_0 = {
    'id': '0',
    'icon': '',
    'name': 'Ящик\x20выдвижной\x201х1',
    'order': 0x0,
    'active': 0x1,
    'models': [{
        'name': '',
        'code': '',
        'price': 0x0,
        'min_x': 0x0,
        'max_x': 0x0,
        'min_y': 0x0,
        'max_y': 0x0,
        'min_z': 0x0,
        'max_z': 0x0,
        'params': {
            'children': [{
                'type': 'slider',
                'name': 'Ящик',
                'condition': null,
                'spec': {
                    'ext_percent': 0.7
                },
                'children': [{
                    'type': 'section',
                    'name': 'Секция',
                    'condition': null,
                    'spec': {
                        'drag_enabled': !0x1,
                        'drag_single': !0x1,
                        'drag_items': []
                    },
                    'size': {
                        'x': 's:x\x20-\x2058',
                        'y': 's:y\x20/\x202',
                        'z': 's.z'
                    },
                    'pos': {
                        'x': 's:x\x20/\x202',
                        'y': '15',
                        'z': 0x0
                    },
                    'pivot': {
                        'x': 0x0,
                        'y': -0x1,
                        'z': -0x1
                    },
                    'rot': {
                        'x': 0x0,
                        'y': 0x0,
                        'z': 0x0
                    },
                    'material': {
                        'id': 0x0,
                        'rotated': 0x0,
                        'fixed': 0x0
                    },
                    'children': [{
                        'type': 'wall',
                        'name': 'Дно',
                        'condition': null,
                        'spec': {
                            'orientation': 'h',
                            'type': 'common',
                            'type_params': [],
                            'shape': null,
                            'v': 0x1
                        },
                        'size': {
                            'x': 's:x',
                            'y': 's:z',
                            'z': 's.z'
                        },
                        'pos': {
                            'x': 's:x\x20/\x202',
                            'y': '0',
                            'z': '0'
                        },
                        'pivot': {
                            'x': 0x0,
                            'y': -0x1,
                            'z': -0x1
                        },
                        'rot': {
                            'x': 0x0,
                            'y': 0x0,
                            'z': 0x0
                        },
                        'material': {
                            'key': 'default',
                            'variant': 'v_16',
                            'id': 0x0,
                            'rotated': 0x0,
                            'fixed': 0x0
                        },
                        'visible': 0x1,
                        '_comp': {
                            'size': {
                                'x': 0x1fe,
                                'y': 0x1f2,
                                'z': 0x212
                            }
                        },
                        'path': '0,0,0,0'
                    }, {
                        'type': 'wall',
                        'name': 'Задняя',
                        'condition': null,
                        'spec': {
                            'orientation': 'f',
                            'type': 'common',
                            'type_params': [],
                            'shape': null,
                            'v': 0x1
                        },
                        'size': {
                            'x': 's:x\x20-\x20m:default.size.z\x20*\x202',
                            'y': 's.y',
                            'z': 's.z'
                        },
                        'pos': {
                            'x': 's:x\x20/\x202',
                            'y': 0x0,
                            'z': 0x0
                        },
                        'pivot': {
                            'x': 0x0,
                            'y': -0x1,
                            'z': -0x1
                        },
                        'rot': {
                            'x': 0x0,
                            'y': 0x0,
                            'z': 0x0
                        },
                        'material': {
                            'key': 'default',
                            'variant': 'v_16',
                            'id': 0x0,
                            'rotated': 0x0,
                            'fixed': 0x0
                        },
                        'visible': 0x1,
                        '_comp': {
                            'size': {
                                'x': 0x1fa,
                                'y': 0xf0,
                                'z': 0x212
                            }
                        },
                        'path': '0,0,0,1'
                    }, {
                        'type': 'wall',
                        'name': 'Левая',
                        'condition': null,
                        'spec': {
                            'orientation': 'v',
                            'type': 'common',
                            'type_params': [],
                            'shape': null,
                            'v': 0x1
                        },
                        'size': {
                            'x': 's:z',
                            'y': 's:y',
                            'z': 's.z'
                        },
                        'pos': {
                            'x': 0x0,
                            'y': 0x0,
                            'z': '0'
                        },
                        'pivot': {
                            'x': -0x1,
                            'y': -0x1,
                            'z': -0x1
                        },
                        'rot': {
                            'x': 0x0,
                            'y': 0x0,
                            'z': 0x0
                        },
                        'material': {
                            'key': 'default',
                            'variant': 'v_16',
                            'id': 0x0,
                            'rotated': 0x0,
                            'fixed': 0x0
                        },
                        'visible': 0x1,
                        '_comp': {
                            'size': {
                                'x': 0x200,
                                'y': 0xf0,
                                'z': 0x212
                            }
                        },
                        'path': '0,0,0,2'
                    }, {
                        'type': 'wall',
                        'name': 'Правая',
                        'condition': null,
                        'spec': {
                            'orientation': 'v',
                            'type': 'common',
                            'type_params': [],
                            'shape': null,
                            'v': 0x1
                        },
                        'size': {
                            'x': 's:z',
                            'y': 's:y',
                            'z': 's.z'
                        },
                        'pos': {
                            'x': 's:x',
                            'y': 0x0,
                            'z': '0'
                        },
                        'pivot': {
                            'x': 0x1,
                            'y': -0x1,
                            'z': -0x1
                        },
                        'rot': {
                            'x': 0x0,
                            'y': 0x0,
                            'z': 0x0
                        },
                        'material': {
                            'key': 'default',
                            'variant': 'v_16',
                            'id': 0x0,
                            'rotated': 0x0,
                            'fixed': 0x0
                        },
                        'visible': 0x1,
                        '_comp': {
                            'size': {
                                'x': 0x200,
                                'y': 0xf0,
                                'z': 0x212
                            }
                        },
                        'path': '0,0,0,3'
                    }],
                    'visible': 0x1,
                    '_comp': {
                        'size': {
                            'x': 0x21a,
                            'y': 0xf0,
                            'z': 0x212
                        }
                    },
                    'path': '0,0,0'
                }, {
                    'type': 'facade',
                    'name': 'Фасад',
                    'condition': null,
                    'spec': {
                        'materials': {
                            'gen': 0x0
                        },
                        'handle': {
                            'active': 0x1,
                            'h_group': 0x1,
                            'orient': 'a',
                            'pos': {
                                'x': 'a',
                                'y': 'a'
                            }
                        },
                        'group': 'bottom',
                        'style': 'full',
                        'id': '0'
                    },
                    'children': [],
                    'size': {
                        'x': 's:x',
                        'y': 's:y\x20-\x204',
                        'z': 's.z'
                    },
                    'pos': {
                        'x': 's:x\x20/\x202',
                        'y': '2',
                        'z': 's:z'
                    },
                    'pivot': {
                        'x': 0x0,
                        'y': -0x1,
                        'z': -0x1
                    },
                    'rot': {
                        'x': 0x0,
                        'y': 0x0,
                        'z': 0x0
                    },
                    'material': {
                        'id': 0x0,
                        'rotated': 0x0,
                        'fixed': 0x0
                    },
                    'path': '0,0,1',
                    'visible': 0x1
                }],
                'size': {
                    'x': 's:x\x20-\x204',
                    'y': 's:y',
                    'z': 's.z'
                },
                'pos': {
                    'x': 's:x\x20/\x202',
                    'y': 0x0,
                    'z': 0x0
                },
                'pivot': {
                    'x': 0x0,
                    'y': -0x1,
                    'z': -0x1
                },
                'rot': {
                    'x': 0x0,
                    'y': 0x0,
                    'z': 0x0
                },
                'material': {
                    'id': 0x0,
                    'rotated': 0x0,
                    'fixed': 0x0
                },
                'visible': 0x1,
                '_comp': {
                    'size': {
                        'x': 0x254,
                        'y': 0x168,
                        'z': 0x212
                    }
                },
                'path': '0,0'
            }],
            'materials': {}
        }
    }],
    'params': [{
        'key': '',
        'name': '',
        'type': 'c',
        'values': [],
        'value': 0x0
    }]
}, lockers_lib = new lib(lockers_0,category_0), tabletop_plints_lib = new lib({
    'id': '0',
    'icon': '',
    'name': 'Ящик\x20выдвижной\x201х1',
    'order': 0x0,
    'active': 0x1,
    'models': [{
        'name': '',
        'code': '',
        'price': 0x0,
        'min_x': 0x0,
        'max_x': 0x0,
        'min_y': 0x0,
        'max_y': 0x0,
        'min_z': 0x0,
        'max_z': 0x0,
        'params': {
            'children': [{
                'type': 'slider',
                'name': 'Ящик',
                'condition': null,
                'spec': {
                    'ext_percent': 0.7
                },
                'children': [{
                    'type': 'section',
                    'name': 'Секция',
                    'condition': null,
                    'spec': {
                        'drag_enabled': !0x1,
                        'drag_single': !0x1,
                        'drag_items': []
                    },
                    'size': {
                        'x': 's:x\x20-\x2058',
                        'y': 's:y\x20/\x202',
                        'z': 's.z'
                    },
                    'pos': {
                        'x': 's:x\x20/\x202',
                        'y': '15',
                        'z': 0x0
                    },
                    'pivot': {
                        'x': 0x0,
                        'y': -0x1,
                        'z': -0x1
                    },
                    'rot': {
                        'x': 0x0,
                        'y': 0x0,
                        'z': 0x0
                    },
                    'material': {
                        'id': 0x0,
                        'rotated': 0x0,
                        'fixed': 0x0
                    },
                    'children': [{
                        'type': 'wall',
                        'name': 'Дно',
                        'condition': null,
                        'spec': {
                            'orientation': 'h',
                            'type': 'common',
                            'type_params': [],
                            'shape': null,
                            'v': 0x1
                        },
                        'size': {
                            'x': 's:x',
                            'y': 's:z',
                            'z': 's.z'
                        },
                        'pos': {
                            'x': 's:x\x20/\x202',
                            'y': '0',
                            'z': '0'
                        },
                        'pivot': {
                            'x': 0x0,
                            'y': -0x1,
                            'z': -0x1
                        },
                        'rot': {
                            'x': 0x0,
                            'y': 0x0,
                            'z': 0x0
                        },
                        'material': {
                            'key': 'default',
                            'variant': 'v_16',
                            'id': 0x0,
                            'rotated': 0x0,
                            'fixed': 0x0
                        },
                        'visible': 0x1,
                        '_comp': {
                            'size': {
                                'x': 0x1fe,
                                'y': 0x1f2,
                                'z': 0x212
                            }
                        },
                        'path': '0,0,0,0'
                    }, {
                        'type': 'wall',
                        'name': 'Задняя',
                        'condition': null,
                        'spec': {
                            'orientation': 'f',
                            'type': 'common',
                            'type_params': [],
                            'shape': null,
                            'v': 0x1
                        },
                        'size': {
                            'x': 's:x\x20-\x20m:default.size.z\x20*\x202',
                            'y': 's.y',
                            'z': 's.z'
                        },
                        'pos': {
                            'x': 's:x\x20/\x202',
                            'y': 0x0,
                            'z': 0x0
                        },
                        'pivot': {
                            'x': 0x0,
                            'y': -0x1,
                            'z': -0x1
                        },
                        'rot': {
                            'x': 0x0,
                            'y': 0x0,
                            'z': 0x0
                        },
                        'material': {
                            'key': 'default',
                            'variant': 'v_16',
                            'id': 0x0,
                            'rotated': 0x0,
                            'fixed': 0x0
                        },
                        'visible': 0x1,
                        '_comp': {
                            'size': {
                                'x': 0x1fa,
                                'y': 0xf0,
                                'z': 0x212
                            }
                        },
                        'path': '0,0,0,1'
                    }, {
                        'type': 'wall',
                        'name': 'Левая',
                        'condition': null,
                        'spec': {
                            'orientation': 'v',
                            'type': 'common',
                            'type_params': [],
                            'shape': null,
                            'v': 0x1
                        },
                        'size': {
                            'x': 's:z',
                            'y': 's:y',
                            'z': 's.z'
                        },
                        'pos': {
                            'x': 0x0,
                            'y': 0x0,
                            'z': '0'
                        },
                        'pivot': {
                            'x': -0x1,
                            'y': -0x1,
                            'z': -0x1
                        },
                        'rot': {
                            'x': 0x0,
                            'y': 0x0,
                            'z': 0x0
                        },
                        'material': {
                            'key': 'default',
                            'variant': 'v_16',
                            'id': 0x0,
                            'rotated': 0x0,
                            'fixed': 0x0
                        },
                        'visible': 0x1,
                        '_comp': {
                            'size': {
                                'x': 0x200,
                                'y': 0xf0,
                                'z': 0x212
                            }
                        },
                        'path': '0,0,0,2'
                    }, {
                        'type': 'wall',
                        'name': 'Правая',
                        'condition': null,
                        'spec': {
                            'orientation': 'v',
                            'type': 'common',
                            'type_params': [],
                            'shape': null,
                            'v': 0x1
                        },
                        'size': {
                            'x': 's:z',
                            'y': 's:y',
                            'z': 's.z'
                        },
                        'pos': {
                            'x': 's:x',
                            'y': 0x0,
                            'z': '0'
                        },
                        'pivot': {
                            'x': 0x1,
                            'y': -0x1,
                            'z': -0x1
                        },
                        'rot': {
                            'x': 0x0,
                            'y': 0x0,
                            'z': 0x0
                        },
                        'material': {
                            'key': 'default',
                            'variant': 'v_16',
                            'id': 0x0,
                            'rotated': 0x0,
                            'fixed': 0x0
                        },
                        'visible': 0x1,
                        '_comp': {
                            'size': {
                                'x': 0x200,
                                'y': 0xf0,
                                'z': 0x212
                            }
                        },
                        'path': '0,0,0,3'
                    }],
                    'visible': 0x1,
                    '_comp': {
                        'size': {
                            'x': 0x21a,
                            'y': 0xf0,
                            'z': 0x212
                        }
                    },
                    'path': '0,0,0'
                }, {
                    'type': 'facade',
                    'name': 'Фасад',
                    'condition': null,
                    'spec': {
                        'materials': {
                            'gen': 0x0
                        },
                        'handle': {
                            'active': 0x1,
                            'h_group': 0x1,
                            'orient': 'a',
                            'pos': {
                                'x': 'a',
                                'y': 'a'
                            }
                        },
                        'group': 'bottom',
                        'style': 'full',
                        'id': '0'
                    },
                    'children': [],
                    'size': {
                        'x': 's:x',
                        'y': 's:y\x20-\x204',
                        'z': 's.z'
                    },
                    'pos': {
                        'x': 's:x\x20/\x202',
                        'y': '2',
                        'z': 's:z'
                    },
                    'pivot': {
                        'x': 0x0,
                        'y': -0x1,
                        'z': -0x1
                    },
                    'rot': {
                        'x': 0x0,
                        'y': 0x0,
                        'z': 0x0
                    },
                    'material': {
                        'id': 0x0,
                        'rotated': 0x0,
                        'fixed': 0x0
                    },
                    'path': '0,0,1',
                    'visible': 0x1
                }],
                'size': {
                    'x': 's:x\x20-\x204',
                    'y': 's:y',
                    'z': 's.z'
                },
                'pos': {
                    'x': 's:x\x20/\x202',
                    'y': 0x0,
                    'z': 0x0
                },
                'pivot': {
                    'x': 0x0,
                    'y': -0x1,
                    'z': -0x1
                },
                'rot': {
                    'x': 0x0,
                    'y': 0x0,
                    'z': 0x0
                },
                'material': {
                    'id': 0x0,
                    'rotated': 0x0,
                    'fixed': 0x0
                },
                'visible': 0x1,
                '_comp': {
                    'size': {
                        'x': 0x254,
                        'y': 0x168,
                        'z': 0x212
                    }
                },
                'path': '0,0'
            }],
            'materials': {}
        }
    }],
    'params': [{
        'key': '',
        'name': '',
        'type': 'c',
        'values': [],
        'value': 0x0
    }]
},category_0), handles_0 = (models_lib['comms'] = comms_lib,
models_lib['tech'] = tech_lib,
models_lib['interior'] = interior_lib,
models_lib['models3d'] = models3d_lib,
{
    'id': 0x1,
    'category': 0x2,
    'name': 'Рейлинг\x201',
    'icon': '/common_assets/models/handles/1/icon_1.jpg',
    'model': '/common_assets/models/handles/1/model_1.fbx',
    'type': 'common',
    'material': {
        'type': 'Standart',
        'params': {
            'color': '#dadada',
            'roughness': '0.3',
            'metalness': '0',
            'map': '',
            'normalMap': '',
            'transparent': 0x0
        },
        'add_params': {
            'stretch_width': 0x0,
            'stretch_height': 0x0,
            'real_width': 0x0,
            'real_height': 0x0,
            'wrapping': 'mirror'
        }
    },
    'sizes': [{
        'width': 0x98,
        'height': 0xa,
        'depth': 0x23,
        'axis_size': '96',
        'code': '',
        'price': 0x0,
        'offset_y': 0x0
    }, {
        'width': 0xaf,
        'height': 0xa,
        'depth': 0x23,
        'code': '',
        'axis_size': '128',
        'price': '',
        'offset_y': 0x0
    }, {
        'width': '207',
        'height': '10',
        'depth': '35',
        'code': '',
        'axis_size': '160',
        'price': '',
        'offset_y': 0x0
    }, {
        'width': '239',
        'height': '10',
        'depth': '35',
        'code': '',
        'axis_size': '192',
        'price': '',
        'offset_y': 0x0
    }, {
        'width': '367',
        'height': '10',
        'depth': '35',
        'code': '',
        'axis_size': '320',
        'price': '',
        'offset_y': 0x0
    }, {
        'width': '495',
        'height': '10',
        'depth': '35',
        'code': '',
        'axis_size': '448',
        'price': '',
        'offset_y': 0x0
    }, {
        'width': '527',
        'height': '10',
        'depth': '35',
        'code': '',
        'axis_size': '480',
        'price': '',
        'offset_y': 0x0
    }, {
        'width': '623',
        'height': '10',
        'depth': '35',
        'code': '',
        'axis_size': '576',
        'price': '',
        'offset_y': 0x0
    }, {
        'width': '815',
        'height': '10',
        'depth': '35',
        'code': '',
        'axis_size': '768',
        'price': '',
        'offset_y': 0x0
    }, {
        'width': '911',
        'height': '10',
        'depth': '35',
        'code': '',
        'axis_size': '864',
        'price': '',
        'offset_y': 0x0
    }]
}), handles_lib = new lib(handles_0,category_0), cokol_0 = {
    'id': 0x0,
    'category': 0x0,
    'name': '',
    'model': 'none',
    'model_radius': 'none'
}, cokol_lib = new lib(cokol_0,category_0), cornice_0 = {
    'id': 0x0,
    'name': '',
    'code': '',
    'icon': '',
    'category': 0x0,
    'active': 0x1,
    'order': 0x2710,
    'models': {
        'common': '/common_assets/models/cornice_new.fbx',
        'radius': '/common_assets/models/cornice_radius_new.fbx',
        'radius_i': ''
    },
    'params': {
        'height': 0x64,
        'depth': 102.79,
        'front_offset': 0x14,
        'item_width': 0xbb8,
        'materials_mode': 'f'
    },
    'materials': {},
    'items': [{
        'name': '',
        'code': '',
        'code_radius': '',
        'code_radius_i': '',
        'mat_code': 'c_default_price',
        'price': {
            'common': 0x0,
            'radius': 0x0,
            'radius_i': 0x0
        }
    }]
}, cornice_lib = new lib(cornice_0,category_0), tabletop_lib = (libs['cornice'] = cornice_lib,
new lib({
    'id': 0x0,
    'name': '',
    'code': '',
    'has_trap': 0x0,
    'icon': '',
    'category': [],
    'active': 0x1,
    'order': 0x2710,
    'params': {
        'mat_mode': 0x0,
        'material': 0x0,
        'mat_params': {},
        'variants': [{
            'name': '',
            'code': '',
            'width': 0x0,
            'height': 0x0,
            'thickness': 0x26,
            'price': 0x0,
            'price_mode': 'c',
            'price_type': 'm2',
            'price_acc_id': 0x0,
            'params': {}
        }],
        'trap_variants': []
    },
    'prices': {
        'common': 0x0,
        'trap': 0x0
    },
    'accessories': {
        'conn': 0x0,
        'end': 0x0
    }
},category_0)), cokol_lib2 = (libs['tabletop'] = tabletop_lib,
new lib({
    'name': 'Цоколь',
    'code': '',
    'icon': '',
    'category': '0',
    'active': 0x1,
    'order': 0x2710,
    'params': {
        'width': 0xbb8,
        'depth': 0x258,
        'height': 0x64,
        'materials_mode': 'i',
        'material': '0'
    },
    'prices': {
        'common': 0x0,
        'trap': 0x0
    },
    'accessories': {
        'conn': 0x0,
        'leg': 0x0
    }
},category_0)), washes_lib = (libs['cokol'] = cokol_lib2,
new lib({
    'id': 0x0,
    'name': 'Мойка',
    'price': 0x0,
    'model': '/common_assets/models/washes/m1.fbx',
    'icon': '/common_assets/models/washes/m1icon.jpg',
    'width': 0x1cc,
    'height': 0xc4,
    'depth': 0x1cc,
    'smes_rotation': 0x0,
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
},category_0)), molded_0 = (libs['washes'] = washes_lib,
{
    'id': 0x0,
    'category': 0x0,
    'name': '',
    'model': 'none',
    'model_radius': 'none'
}), molded_lib = new lib(molded_0,category_0), cokol_top_0 = {
    'id': 0x0,
    'category': 0x0,
    'name': '',
    'model': 'none',
    'model_radius': 'none'
}, cokol_top_lib = new lib(cokol_top_0,category_0), constructions_lib = new lib(cokol_top_0,category_0), legs_0 = {
    'name': '',
    'code': '',
    'icon': '',
    'category': [],
    'active': 0x1,
    'order': 0x2710,
    'params': {
        'mat_mode': 0x0,
        'material': 0x0,
        'mat_params': {},
        'model_params': {
            'enabled': !0x0,
            'model': '',
            'code': '',
            'price_type': 'p',
            'price_mode': 'm',
            'price': 0x0,
            'acc_id': 0x0
        },
        'accs': [],
        'width': 0x0,
        'height': 0x0,
        'thickness': 0x0
    }
}, legs_lib = new lib(legs_0,category_0), materials_keys, materials_keys_hash = {}, materials_groups, materials_groups_hash = {}, materials_by_key = {}, catalogs_keys, catalogs_keys_hash = {}, catalogs_by_key = {}, accsessories_data = {
    'default': {},
    'items': {},
    'tree': [],
    'tags': []
}, specs_result = {
    'corpus': [],
    'materials': [],
    'edge': [],
    'lockers': [],
    'cokol': [],
    'shelves': [],
    'tabletop': [],
    'tabletop_plints': [],
    'tabletop_v2': [],
    'glass': [],
    'wallpanel': [],
    'handles': [],
    'facades': {
        'common': {},
        'radius': {},
        'radius_inner': {},
        'double': {},
        'triple': {}
    },
    'facades_fixed': [],
    'facades_edge': [],
    'details_corpus': [],
    'details_shelves': [],
    'back_wall': [],
    'cornice': {
        'common': [],
        'radius': [],
        'corner': [],
        'corner45': []
    },
    'washes': [],
    'items': []
}, check_intersections = !0x0, obj_id = 0x1;
var version = '4', objects = (disable_demo = 0x0,
[]), scene, room_width = 0xc80, room_height = 0x9c4, room_depth = 0xfa0, cokol_height = 0xc, units = 0xa, shadow_quality = {
    'no': 0x2,
    'low': 0x100,
    'medium': 0x400,
    'high': 0x1000
}, active_el = (rotation_mode = !0x1,
null), red_mat = new THREE['MeshPhongMaterial']({
    'color': '#c70000',
    'transparent': !0x1,
    'opacity': 0.5
});
let conn_mat = new THREE['LineDashedMaterial']({
    'color': '#c70000',
    'linewidth': 0x1,
    'scale': 0x1,
    'dashSize': 0x3,
    'gapSize': 0x1,
    'depthTest': !0x1
})
  , conn_mat_end = new THREE['LineDashedMaterial']({
    'color': '#ed33ff',
    'linewidth': 0x1,
    'scale': 0x1,
    'dashSize': 0x3,
    'gapSize': 0x1,
    'depthTest': !0x1
});
var red_mat_opac = new THREE['MeshPhongMaterial']({
    'color': 0x8800000,
    'transparent': !0x0,
    'opacity': 0.8,
    'depthTest': !0x1
})
  , s_helper_mat = new THREE['LineBasicMaterial']({
    'color': '#1ab394',
    'depthTest': !0x1
})
  , s_helper_red_mat = new THREE['LineBasicMaterial']({
    'color': 0x8800000,
    'depthTest': !0x1
})
  , box3 = new THREE['Box3']()
  , vec3 = new THREE['Vector3']()
  , texture_loader = new THREE['TextureLoader']();
let hdr_loader;
var loading_manager = new THREE['LoadingManager']()
  , fbx_loader = new THREE['FBXLoader'](loading_manager)
  , gltf_loader = new THREE['GLTFLoader'](loading_manager)
  , obj_loader = new THREE['OBJLoader'](loading_manager)
  , tds_loader = new THREE['TDSLoader'](loading_manager)
  , collada_loader = new THREE['ColladaLoader'](loading_manager);
obj_exporter = new THREE['OBJExporter']();
let ObjectType = Object['freeze']({
    'Default': 0x0,
    'Facade': 0x1,
    'Tabletop': 0x2,
    'Handle': 0x3,
    'CabinetLeg': 0x4,
    'CabinetCokol': 0x5,
    'CabinetCokolTop': 0x6,
    'Cornice': 0x7,
    'Wall': 0x8,
    'Bort': 0x9,
    'Hole': 0xa
});
var global_options = {
    'is_sub': !0x1,
    'mouse_mode': {
        'mode': 'drag',
        'target': null,
        'style': null,
        'radius': 0x0,
        'active': !0x1,
        'item_id': null,
        'notice': '',
        'el': null,
        'obj': null
    },
    'grid': {
        'active': 0x0,
        'grid_x': 0x3e8,
        'grid_z': 0x3e8
    },
    'parent_name': '',
    'mode': 'design',
    'save_file_ext': '.dbs',
    'save_file_zip': '.dbx',
    'single_preview': !0x1,
    'sizes_visible': !0x0,
    'common_sizes_visible': !0x1,
    'kitchen_sizes_visible': !0x1,
    'edges_transparent': !0x1,
    'export_to_obj': 0x0,
    'camera_mode': '3d',
    'projection_mode': 'none',
    'account_name': get_account_name(),
    'hinges_door_offset_y': 0xc,
    'colorpicker_mode': !0x1,
    'facade_mode': !0x1,
    'no_recalc': !0x1,
    'url_params': {},
    'add_url_params_to_form': !0x1,
    'show_numbers': !0x1,
    'check_intersections': !0x1,
    'view_only_mode': !0x1,
    'custom_functions': {},
    'font_size': 0x32,
    'custom_textures': {
        'lr_wall': null,
        'fb_wall': null,
        'floor': null
    },
    'custom_textures_params': {
        'lr_wall': {
            'width': null,
            'height': null,
            'str_x': 0x0,
            'str_y': 0x0,
            'repeat': 'mirror'
        },
        'fb_wall': {
            'width': null,
            'height': null,
            'str_x': 0x0,
            'str_y': 0x0,
            'repeat': 'mirror'
        },
        'floor': {
            'width': null,
            'height': null,
            'str_x': 0x0,
            'str_y': 0x0,
            'repeat': 'mirror'
        }
    },
    'edges_mode': {
        [ObjectType['Default']]: {
            'color': 0xffffff,
            'opacity': 0.7
        }
    },
    'edges_mode_default_opacity': 0.7,
    'pdf': {
        'width': 841.995,
        'height': 595.35,
        'img_size_offset_x': 0x1e,
        'img_size_offset_y': 0x19,
        'img_pos_x': 0x12,
        'img_pos_y': 0xf,
        'img_size_multi': 0x2
    },
    'size_edit_mode': {
        'active': !0x1,
        'size_obj': null
    }
}, camera_persp_old_position, controls_old_target;
let global_temp = {
    'single_data': {
        'pos': null,
        'rot': null,
        'c_pos': null,
        'target': null
    }
}, calc_options = (global_options['acc_url'] = location['origin'] + '/clients/' + location['pathname']['split']('/')[0x2] + '/',
{
    'lockers_inner': !0x0
}), global_materials = {
    'black': new THREE['MeshBasicMaterial']({
        'color': '#000000'
    }),
    'white': new THREE['MeshBasicMaterial']({
        'color': '#ffffff'
    }),
    'red': new THREE['MeshBasicMaterial']({
        'color': '#880000'
    }),
    'black_front': new THREE['MeshBasicMaterial']({
        'color': '#000000',
        'side': THREE['BackSide']
    }),
    'light_green': new THREE['MeshBasicMaterial']({
        'color': '#bdffc3'
    }),
    'helper_material': new THREE['MeshBasicMaterial']({
        'color': '#bdffc3',
        'transparent': !0x0,
        'opacity': 0.5,
        'depthTest': !0x1
    }),
    'helper_wrong_material': new THREE['MeshBasicMaterial']({
        'color': '#ff6666',
        'transparent': !0x0,
        'opacity': 0.5,
        'depthTest': !0x1
    }),
    'hover_material': new THREE['MeshBasicMaterial']({
        'color': '#fff9e0',
        'transparent': !0x0,
        'opacity': 0.5
    }),
    'rail_material': new THREE['MeshBasicMaterial']({
        'color': '#bdffc3'
    }),
    'door_empty_material': new THREE['MeshBasicMaterial']({
        'color': '#ffffff',
        'transparent': !0x0,
        'opacity': 0.7
    }),
    'edges': new THREE['LineBasicMaterial']({
        'color': 0x0
    }),
    'edges_white_mat': new THREE['MeshPhongMaterial']({
        'color': 0xfffffff,
        'side': THREE['DoubleSide'],
        'transparent': !0x1,
        'opacity': 0.7
    }),
    'edges_mode_materials': {}
}, stop_animation = 0x0, frame_id = 0x0, render;
constructor_settings = {},
kitchen_templates = [];
var numbers = new THREE['Group'](), selected_lang, lang, room_models_catalog, pdf_font;
let materials_global = {}, errors = [], temp_project_data = (common_box = new THREE['Box3'](),
{
    'facades': {},
    'selected_materials': {
        'top': {},
        'bottom': {}
    }
}), pdf_settings = {}, wrong_place_box, custom_settings = {}, furniture_models = {}, inner_models = {}, custom_lockers = !0x1, do_not_overwrite_code_in_multiple_facades_mode = !0x1, custom_constructor_settings = {
    'default_edges_mode': !0x1
};
var models_catalog = {
    'categories': [],
    'items': [{
        'id': 0xf4240,
        'model': '/common_assets/models/bottle/bottle.fbx',
        'material': {
            'type': 'Phong',
            'params': {
                'color': '#dadada'
            }
        },
        'variants': [{
            'width': 0x69,
            'height': 0x203,
            'depth': 0x1c2
        }],
        'draggable': !(bazis_settings = {
            'use_clip': 0x1
        })
    }, {
        'id': 0x1e847f,
        'model': '/common_assets/models/tech/18/model_18.fbx',
        'material': {
            'type': 'Phong',
            'params': {
                'color': '#ffffff',
                'map': '/common_assets/models/tech/18/map_18.jpg'
            }
        },
        'variants': [{
            'width': 0x12c,
            'height': 3.5,
            'depth': 0x20f
        }],
        'draggable': !0x1
    }, {
        'id': 0x1e8480,
        'model': '/common_assets/models/tech/built_in_cookers/1/model.fbx',
        'material': {
            'type': 'Phong',
            'params': {
                'color': '#ffffff',
                'map': '/common_assets/models/tech/built_in_cookers/1/map.png'
            }
        },
        'variants': [{
            'width': 0x254,
            'height': 0x254,
            'depth': 0x20f
        }],
        'draggable': !0x1
    }, {
        'id': 0x1e8481,
        'model': '/common_assets/models/tech/built_in_cookers/1/model.fbx',
        'material': {
            'type': 'Phong',
            'params': {
                'color': '#ffffff',
                'map': '/common_assets/models/tech/built_in_cookers/1/map_2.png'
            }
        },
        'variants': [{
            'width': 0x254,
            'height': 0x254,
            'depth': 0x20f
        }],
        'draggable': !0x1
    }, {
        'id': 0x1e8482,
        'model': '/common_assets/models/tech/built_in_cookers/2/model_2.fbx',
        'material': {
            'type': 'Phong',
            'params': {
                'color': '#ffffff',
                'map': '/common_assets/models/tech/built_in_cookers/2/map.jpg'
            }
        },
        'variants': [{
            'width': 0x254,
            'height': 0x254,
            'depth': 0x20f
        }],
        'draggable': !0x1
    }, {
        'id': 0x1e8483,
        'model': '/common_assets/models/tech/built_in_cookers/2/OvenMic.fbx',
        'material': {
            'type': 'Phong',
            'params': {
                'color': '#ffffff',
                'map': '/common_assets/models/tech/built_in_cookers/2/combo_map.jpg'
            }
        },
        'variants': [{
            'width': 0x254,
            'height': 0x3e8,
            'depth': 0x20f
        }],
        'draggable': !0x1
    }, {
        'id': 0x1e8484,
        'model': '/common_assets/models/tech/built_in_cookers/2/OvenMic900.fbx',
        'material': {
            'type': 'Phong',
            'params': {
                'color': '#ffffff',
                'map': '/common_assets/models/tech/built_in_cookers/2/combo_map.jpg'
            }
        },
        'variants': [{
            'width': 0x254,
            'height': 0x384,
            'depth': 0x20f
        }],
        'draggable': !0x1
    }, {
        'id': 0x1e8485,
        'model': '/common_assets/models/tech/built_in_cookers/2/OvenDouble.fbx',
        'material': {
            'type': 'Phong',
            'params': {
                'color': '#ffffff',
                'map': '/common_assets/models/tech/built_in_cookers/2/map.jpg'
            }
        },
        'variants': [{
            'width': 0x254,
            'height': 0x4b0,
            'depth': 0x20f
        }],
        'draggable': !0x1
    }, {
        'id': 0x2dc6c0,
        'model': '/common_assets/models/tech/cooking_panels/1/model.fbx',
        'material': {
            'type': 'Standart',
            'params': {
                'color': '#ffffff',
                'map': '/common_assets/models/tech/cooking_panels/1/map.jpg',
                'metalness': 0.1,
                'roughness': 0.1
            }
        },
        'variants': [{
            'width': 0x247,
            'height': 0x8,
            'depth': 0x200
        }],
        'draggable': !0x1
    }, {
        'id': 0x3d0900,
        'model': '/common_assets/models/tech/sinks/1/sink.fbx',
        'material': {
            'type': 'Standart',
            'params': {
                'color': '#dadada',
                'metalness': 0.1,
                'roughness': 0.1
            }
        },
        'variants': [{
            'width': 0x1f0,
            'height': 0x157,
            'depth': 0x1e0
        }],
        'draggable': !0x1
    }, {
        'id': 0x4c4b40,
        'model': '/common_assets/models/custom/ya2_inn.fbx',
        'material': {
            'type': 'Phong',
            'params': {
                'color': '#87919c'
            }
        },
        'variants': [{
            'width': 0x69,
            'height': 0x203,
            'depth': 0x1c2
        }],
        'draggable': !0x1
    }, {
        'id': 0x5b8d80,
        'model': '/common_assets/models/custom/ya1.fbx',
        'material': {
            'type': 'Phong',
            'params': {
                'color': '#87919c'
            }
        },
        'variants': [{
            'width': 0x69,
            'height': 0x203,
            'depth': 0x1c2
        }],
        'draggable': !0x1
    }]
}
  , bardesk_catalog = {
    'categories': [{
        'id': 0x0
    }],
    'items': [{
        'id': 0x0,
        'category': 0x0,
        'icon': '/common_assets/images/icons/bardesks/0.png',
        'params': {
            'bardesk_type': 'common'
        },
        'variants': {}
    }, {
        'id': 0x1,
        'category': 0x0,
        'icon': '/common_assets/images/icons/bardesks/1.png',
        'params': {
            'bardesk_type': 'common',
            'leg_visible': !0x1,
            'width': 0x258,
            'depth': 0x258
        },
        'variants': {}
    }, {
        'id': 0x2,
        'category': 0x0,
        'icon': '/common_assets/images/icons/bardesks/2.png',
        'params': {
            'bardesk_type': 'common',
            'corners': {
                'c1': {
                    'type': 'radius',
                    'val': '50%'
                },
                'c2': {
                    'type': 'radius',
                    'val': '50%'
                },
                'c3': {
                    'type': 'straight',
                    'val': 0x0
                },
                'c4': {
                    'type': 'straight',
                    'val': 0x0
                }
            }
        },
        'variants': {}
    }, {
        'id': 0x3,
        'category': 0x0,
        'icon': '/common_assets/images/icons/bardesks/3.png',
        'params': {
            'bardesk_type': 'full'
        },
        'variants': {}
    }, {
        'id': 0x4,
        'category': 0x0,
        'icon': '/common_assets/images/icons/bardesks/podium.jpg',
        'params': {
            'bardesk_type': 'podium',
            'cabinet_type': 'top',
            'width': 0x258,
            'height': 0x64,
            'depth': 0x258
        },
        'variants': {}
    }]
}
  , shelves_catalog = (-0x1 < location['href']['indexOf']('mfleko') && (bardesk_catalog = {
    'categories': [{
        'id': 0x0
    }],
    'items': [{
        'id': 0x1,
        'category': 0x0,
        'icon': '/common_assets/images/icons/bardesks/1.png',
        'params': {
            'bardesk_type': 'common',
            'leg_visible': !0x1,
            'width': 0x258,
            'depth': 0x258
        },
        'variants': {}
    }, {
        'id': 0x2,
        'category': 0x0,
        'icon': '/common_assets/models/custom/mfleko/bard_square.jpg',
        'params': {
            'bardesk_type': 'common',
            'material_rotated': 0x1,
            'leg_model': {
                'model': '/common_assets/models/custom/mfleko/bard_square.fbx',
                'material': {
                    'params': {
                        'color': '#000'
                    }
                },
                'variants': [{
                    'width': 0x1ef,
                    'height': 0x330,
                    'depth': 0x64
                }]
            }
        },
        'variants': {}
    }, {
        'id': 0x3,
        'category': 0x0,
        'icon': '/common_assets/models/custom/mfleko/bard_corner.jpg',
        'params': {
            'bardesk_type': 'common',
            'leg_model': {
                'model': '/common_assets/models/custom/mfleko/bard_corner.fbx',
                'material': {
                    'params': {
                        'color': '#000'
                    }
                },
                'variants': [{
                    'width': 0x226,
                    'height': 0x330,
                    'depth': 0x64
                }]
            }
        },
        'variants': {}
    }]
}),
{
    'categories': [{
        'id': 0x0
    }],
    'items': [{
        'id': 0x0,
        'category': 0x0,
        'icon': '/common_assets/images/icons/shelves/0.png',
        'params': {
            'class': 'common'
        }
    }, {
        'id': 0x1,
        'category': 0x0,
        'icon': '/common_assets/images/icons/shelves/1.png',
        'params': {
            'class': 'common',
            'vertical_orientation': 'vertical'
        }
    }, {
        'id': 0x2,
        'category': 0x0,
        'icon': '/common_assets/images/icons/shelves/2.png',
        'params': {
            'class': 'corner',
            'orientation': 'left'
        }
    }, {
        'id': 0x3,
        'category': 0x0,
        'icon': '/common_assets/images/icons/shelves/3.png',
        'params': {
            'class': 'corner',
            'orientation': 'right'
        }
    }, {
        'id': 0x4,
        'category': 0x0,
        'icon': '/common_assets/images/icons/shelves/4.png',
        'params': {
            'class': 'half_rounded',
            'orientation': 'left'
        }
    }, {
        'id': 0x5,
        'category': 0x0,
        'icon': '/common_assets/images/icons/shelves/5.png',
        'params': {
            'class': 'half_rounded',
            'orientation': 'right'
        }
    }, {
        'id': 0x6,
        'category': 0x0,
        'icon': '/common_assets/images/icons/shelves/6.png',
        'params': {
            'class': 'half_rounded_double'
        }
    }, {
        'id': 0x7,
        'category': 0x0,
        'icon': '/common_assets/images/icons/shelves/7.png',
        'params': {
            'class': 'corner_double'
        }
    }]
});
let decorations = {
    'categories': [{
        'id': 0x1
    }],
    'items': [{
        'category': 0x1,
        'id': 0x1,
        'icon': '/common_assets/images/icons/red/bal_straight.jpg',
        'params': {
            'width': 0x258,
            'wall_distance': 0x12c,
            'type': 'molded',
            'variants': [{
                'code': '',
                'name': '',
                'width': 0x98,
                'height': 0x2d0,
                'depth': 0x12c,
                'price': 0x0
            }]
        }
    }, {
        'category': 0x1,
        'id': 0x2,
        'icon': '/common_assets/images/icons/red/bal_left.jpg',
        'params': {
            'radius': !0x0,
            'orientation': 'left',
            'wall_distance': 0x0,
            'type': 'molded',
            'variants': [{
                'code': '',
                'name': '',
                'width': 0x98,
                'height': 0x2d0,
                'depth': 0x12c,
                'price': 0x0
            }]
        }
    }, {
        'category': 0x1,
        'id': 0x3,
        'icon': '/common_assets/images/icons/red/bal_right.jpg',
        'params': {
            'radius': !0x0,
            'wall_distance': 0x0,
            'type': 'molded',
            'variants': [{
                'code': '',
                'name': '',
                'width': 0x98,
                'height': 0x2d0,
                'depth': 0x12c,
                'price': 0x0
            }]
        }
    }, {
        'category': 0x1,
        'id': 0x4,
        'icon': '/common_assets/images/icons/red/coromislo.jpg',
        'params': {
            'variants': [{
                'code': '',
                'name': '',
                'width': 0x258,
                'height': 0x7d,
                'depth': 0x1b,
                'price': 0x0
            }],
            'type': 'decoration',
            'width': 0x258,
            'height': 0x7d,
            'thickness': 0x1b,
            'model': '/common_assets/models/decorative/nika/coromislo.fbx',
            'draggable': !0x0
        }
    }, {
        'category': 0x1,
        'id': 0x5,
        'icon': '/common_assets/images/icons/red/ramka1.jpg',
        'params': {
            'type': 'decoration',
            'variants': [{
                'code': '',
                'name': '',
                'width': 0x258,
                'height': 0x7d,
                'depth': 0x1b,
                'price': 0x0
            }],
            'width': 0x380,
            'height': 0x2cc,
            'thickness': 0x18,
            'model': '/common_assets/models/decorative/nika/ramka1.fbx',
            'draggable': !0x0
        }
    }, {
        'category': 0x1,
        'id': 0x6,
        'icon': '/common_assets/images/icons/red/nika_col_1.jpg',
        'params': {
            'type': 'decoration',
            'variants': [{
                'code': '',
                'name': '',
                'width': 0x258,
                'height': 0x7d,
                'depth': 0x1b,
                'price': 0x0
            }],
            'width': 0x5d,
            'height': 0x366,
            'thickness': 0x5d,
            'wall_distance': 0x0,
            'model': '/common_assets/models/decorative/nika/nika_col1.fbx',
            'draggable': !0x0
        }
    }]
}, window_material = null, mirror_material = null, aluminium_material = new THREE['MeshPhongMaterial']({
    'color': 0xbdbebf,
    'side': THREE['DoubleSide']
}), tmp_tabletop_fix, glass_mat = new THREE['MeshStandardMaterial']({
    'color': 0xd1e2ff,
    'transparent': !0x0,
    'opacity': 0.8,
    'roughness': 0x0,
    'metalness': 0x0
}), white_mat = new THREE['MeshPhongMaterial']({
    'color': 0xfffffff,
    'side': THREE['DoubleSide']
}), edges_white_mat = new THREE['MeshPhongMaterial']({
    'color': 0xfffffff,
    'side': THREE['DoubleSide'],
    'transparent': !0x1,
    'opacity': 0.7
}), edges_opacue_mat = new THREE['MeshBasicMaterial']({
    'color': '#90a6c1',
    'side': THREE['DoubleSide'],
    'transparent': !0x0,
    'opacity': 0.1
}), metall_mat = new THREE['MeshStandardMaterial']({
    'color': 0xffffff,
    'roughness': 0.2,
    'metalness': 0.2,
    'side': THREE['DoubleSide']
}), w_mat = new THREE['MeshPhongMaterial']({
    'color': 0xfffffff,
    'side': THREE['DoubleSide']
}), gray_mat = new THREE['MeshPhongMaterial']({
    'color': 0xdadada,
    'side': THREE['DoubleSide']
}), blummat = new THREE['MeshPhongMaterial']({
    'color': 0x87919c,
    'side': THREE['DoubleSide']
}), conf_sel_mat = new THREE['MeshBasicMaterial']({
    'color': '#4c8613'
}), transparent_material = new THREE['MeshBasicMaterial']({
    'transparent': !0x0,
    'opacity': 0x0,
    'depthWrite': !0x1
}), pat_material = null, bim_keys = {
    'glass': glass_mat,
    'back': white_mat,
    'black': global_materials['black'],
    'al': aluminium_material,
    'window': function() {
        var f, f;
        return null == window_material ? (f = [(f = '/common_assets/tests/envmap/') + 'posx.jpg', f + 'negx.jpg', f + 'posy.jpg', f + 'negy.jpg', f + 'posz.jpg', f + 'negz.jpg'],
        (textureCube = new THREE['CubeTextureLoader']()['load'](f))['mapping'] = THREE['CubeReflectionMapping'],
        window_material = new THREE['MeshStandardMaterial']({
            'metalness': 0x1,
            'roughness': 0x0,
            'envMap': textureCube
        })) : window_material;
    },
    'mirror': function() {
        return null == mirror_material ? (env_urls = ['/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg', '/common_assets/tests/prod/test12.jpg'],
        0x1 == constructor_settings['use_custom_reflection'] && constructor_settings['custom_reflection_image'] && (env_urls = [constructor_settings['custom_reflection_image'], constructor_settings['custom_reflection_image'], constructor_settings['custom_reflection_image'], constructor_settings['custom_reflection_image'], constructor_settings['custom_reflection_image'], constructor_settings['custom_reflection_image']]),
        (textureCube2 = new THREE['CubeTextureLoader']()['load'](env_urls))['mapping'] = THREE['CubeReflectionMapping'],
        mirror_material = new THREE['MeshStandardMaterial']({
            'metalness': 0x1,
            'roughness': 0x0,
            'envMap': textureCube2
        })) : mirror_material;
    },
    'metall': metall_mat,
    'blummat': blummat,
    'pat': pat_material,
    'facmat': function(f, g, h) {
        if (facades_lib['items'][project_settings['defaults']['facades']['top']]['additional_materials'][g])
            return create_material(materials_lib['get_item'](facades_lib['items'][project_settings['defaults']['facades']['top']]['additional_materials'][g]['selected']));
        void 0x0 === project_settings['fixed_materials'] && (project_settings['fixed_materials'] = []);
        var j = project_settings['fixed_materials'];
        for (let l = 0x0; l < j['length']; l++) {
            var k = l + 0x1, k;
            if (-0x1 < g['indexOf']('mat' + k))
                return (k = materials_lib['get_item'](j[l]))['add_params']['model_width'] = f['params']['width'],
                k['add_params']['model_height'] = f['params']['height'],
                create_material(k);
        }
        return create_material(materials_lib['get_item'](project_settings['selected_materials']['top']['facades']));
    },
    'topfacmat': function(f, g, h) {
        void 0x0 === project_settings['fixed_materials'] && (project_settings['fixed_materials'] = []);
        var j = project_settings['fixed_materials'];
        for (let l = 0x0; l < j['length']; l++) {
            var k = l + 0x1, k;
            if (-0x1 < g['indexOf']('mat' + k))
                return (k = materials_lib['get_item'](j[l]))['add_params']['model_width'] = f['params']['width'],
                k['add_params']['model_height'] = f['params']['height'],
                create_material(k);
        }
        return create_material(materials_lib['get_item'](project_settings['selected_materials']['top']['facades']));
    },
    'botfacmat': function(f, g, h) {
        void 0x0 === project_settings['fixed_materials'] && (project_settings['fixed_materials'] = []);
        var j = project_settings['fixed_materials'];
        for (let l = 0x0; l < j['length']; l++) {
            var k = l + 0x1, k;
            if (-0x1 < g['indexOf']('mat' + k))
                return (k = materials_lib['get_item'](j[l]))['add_params']['model_width'] = f['params']['width'],
                k['add_params']['model_height'] = f['params']['height'],
                create_material(k);
        }
        return create_material(materials_lib['get_item'](project_settings['selected_materials']['bottom']['facades']));
    },
    'corpmat': function(f, g, h) {
        return 0x1 == h ? materials_lib['get_item'](project_settings['selected_materials']['top']['corpus']) : create_material(materials_lib['get_item'](project_settings['selected_materials']['top']['corpus']));
    },
    'topcorpmat': function(f, g, h) {
        return 0x1 == h ? materials_lib['get_item'](project_settings['selected_materials']['top']['corpus']) : create_material(materials_lib['get_item'](project_settings['selected_materials']['top']['corpus']));
    },
    'botcorpmat': function(f, g, h) {
        return 0x1 == h ? materials_lib['get_item'](project_settings['selected_materials']['bottom']['corpus']) : create_material(materials_lib['get_item'](project_settings['selected_materials']['bottom']['corpus']));
    }
}, bim_arr = Object['keys'](bim_keys), bim_models, furniture_rules = {};
function get_by_wh(f, g=0x0, h=0x0) {
    let j = f
      , k = (j = j['sort'](function(q, u) {
        return q['height'] - u['height'];
    }),
    []);
    for (let q = 0x0; q < j['length']; q++)
        h >= j[q]['height'] && k['push'](j[q]);
    k = k['sort'](function(u, v) {
        return u['width'] - v['width'];
    });
    let m = 0x0;
    for (let u = 0x0; u < k['length']; u++) {
        var n = k[u]
          , p = k[u + 0x1];
        if (!p) {
            m = k[u]['count'];
            break;
        }
        if (g >= n['width'] && g < p['width']) {
            m = k[u]['count'];
            break;
        }
    }
    return m;
}
let default_shelves_auto = !0x1
  , default_locker_type = null
  , lockers_version = null
  , lockers_types = null
  , shelves_rules = {
    'common': {
        0x0: 0x0,
        0x190: 0x1,
        0x2bc: 0x2,
        0x399: 0x3,
        0x4b1: 0x4
    },
    'end_corner_facade': {
        0x0: 0x0,
        0x190: 0x1,
        0x2bc: 0x2,
        0x399: 0x3,
        0x4b1: 0x4
    }
}
  , PRICE_MODE = {
    'MATERIAL': 0x0,
    'FIXED': 0x1,
    'MIXED': 0x2
}
  , spot_params = {
    'intensity': 0.5,
    'distance': 0x5dc,
    'angle': 0x1e,
    'penumbra': 0x32,
    'decay': 0x0
}
  , global_geometries = {
    'left_arrow': null,
    'right_arrow': null,
    'left_arrow_w': null,
    'right_arrow_w': null,
    'top_arrow': null,
    'bottom_arrow': null
}
  , global_font = []
  , misc_mats = {
    'ruler_point': new THREE['MeshBasicMaterial']({
        'color': '#eceb80'
    }),
    'ruler_point_hovered': new THREE['MeshBasicMaterial']({
        'color': '#55d972'
    }),
    'ruler_line': new THREE['LineBasicMaterial']({
        'color': '#000000'
    }),
    'ruler_line_hovered': new THREE['LineBasicMaterial']({
        'color': '#ff0000'
    }),
    'grid_line': new THREE['LineBasicMaterial']({
        'color': '#000000'
    }),
    'depth_line': new THREE['LineBasicMaterial']({
        'color': '#000000',
        'depthTest': !0x1
    }),
    'mouse_target': function() {
        return transparent_material;
    },
    'mouse_target_hovered': new THREE['MeshBasicMaterial']({
        'transparent': !0x0,
        'opacity': 0.2,
        'depthWrite': !0x1,
        'depthTest': !0x1,
        'color': '#456eb0'
    })
}
  , pp = {
    'custom': {
        'components': [],
        'cab_types': {},
        'item_types': []
    }
}
  , loadingModels = (pp['custom']['settings'] = custom_settings,
pp['custom']['wall_types'] = {
    'common': {
        'name': 'Обычная',
        'params': {}
    },
    'model': {
        'name': '3D\x20модель',
        'params': {
            'model': {
                'key': 'model',
                'name': 'Модель',
                'type': 'file',
                'default': ''
            }
        }
    },
    'cut_corners': {
        'name': 'Обрезанные\x20углы',
        'params': {
            'cbl': {
                'key': 'cbl',
                'name': 'Нижний\x20левый',
                'type': 'input_ext',
                'default': 0x0
            },
            'ctl': {
                'key': 'ctl',
                'name': 'Верхний\x20левый',
                'type': 'input_ext',
                'default': 0x0
            },
            'ctr': {
                'key': 'ctr',
                'name': 'Верхний\x20правый',
                'type': 'input_ext',
                'default': 0x0
            },
            'cbr': {
                'key': 'cbr',
                'name': 'Нижний\x20правый',
                'type': 'input_ext',
                'default': 0x0
            }
        }
    },
    'triangle': {
        'name': 'Треугольник',
        'params': {
            'corner': {
                'key': 'corner',
                'name': 'Угол',
                'type': 'select',
                'default': 'tr',
                'values': [{
                    'label': 'Верхний\x20правый',
                    'val': 'tr'
                }, {
                    'label': 'Нижний\x20правый',
                    'val': 'br'
                }, {
                    'label': 'Верхний\x20левый',
                    'val': 'tl'
                }, {
                    'label': 'Нижний\x20левый',
                    'val': 'bl'
                }]
            }
        }
    },
    'rounded_corners': {
        'name': 'Радиусные\x20углы',
        'params': {
            'cbl': {
                'key': 'cbl',
                'name': 'Нижний\x20левый',
                'type': 'input_ext',
                'default': 0x0
            },
            'ctl': {
                'key': 'ctl',
                'name': 'Верхний\x20левый',
                'type': 'input_ext',
                'default': 0x0
            },
            'ctr': {
                'key': 'ctr',
                'name': 'Верхний\x20правый',
                'type': 'input_ext',
                'default': 0x0
            },
            'cbr': {
                'key': 'cbr',
                'name': 'Нижний\x20правый',
                'type': 'input_ext',
                'default': 0x0
            }
        }
    },
    'trapeze_cut_by_offset': {
        'name': 'Трапеция',
        'params': {
            'w1': {
                'key': 'w1',
                'name': 'Ширина\x20спереди',
                'type': 'input_ext',
                'default': 0x96
            },
            'h1': {
                'key': 'h1',
                'name': 'Высота\x20спереди',
                'type': 'input_ext',
                'default': 0x96
            },
            'w2': {
                'key': 'w2',
                'name': 'Ширина\x20сзади',
                'type': 'input_ext',
                'default': 0x4b
            },
            'h2': {
                'key': 'h2',
                'name': 'Высота\x20сзади',
                'type': 'input_ext',
                'default': 0x4b
            },
            'o': {
                'key': 'o',
                'name': 'Ориентация',
                'type': 'select',
                'default': 'left',
                'values': [{
                    'label': 'Левая',
                    'val': 'left'
                }, {
                    'label': 'Правая',
                    'val': 'right'
                }]
            }
        }
    },
    'l_shape': {
        'name': 'L-образная',
        'params': {
            'o': {
                'key': 'o',
                'name': 'Ориентация',
                'type': 'select',
                'default': 'ctl',
                'values': [{
                    'label': 'Верхний\x20левый',
                    'val': 'ctl'
                }, {
                    'label': 'Верхний\x20правый',
                    'val': 'ctr'
                }, {
                    'label': 'Нижний\x20левый',
                    'val': 'cbl'
                }, {
                    'label': 'Нижний\x20правый',
                    'val': 'cbr'
                }]
            },
            'd1': {
                'key': 'd1',
                'name': 'Глубина\x201',
                'type': 'input_ext',
                'default': 0x32
            },
            'd2': {
                'key': 'd2',
                'name': 'Глубина\x202',
                'type': 'input_ext',
                'default': 0x50
            },
            'r': {
                'key': 'r',
                'name': 'Внешний\x20радиус',
                'type': 'input_ext',
                'default': 0x0
            },
            'r_concave': {
                'key': 'r_concave',
                'name': 'Внутренний\x20радиус',
                'type': 'input_ext',
                'default': 0x0
            }
        }
    },
    'c_l_shape': {
        'name': 'C-образные\x20и\x20L-образные',
        'params': {
            'l_shapes': {
                'key': 'l_shapes',
                'name': 'L-образные',
                'type': 'array',
                'value_name': 'L-образная',
                'default': [{
                    'o': {
                        'key': 'o',
                        'name': 'Ориентация',
                        'type': 'select',
                        'default': 'ctr',
                        'values': [{
                            'label': 'Верхний\x20левый',
                            'val': 'ctl'
                        }, {
                            'label': 'Верхний\x20правый',
                            'val': 'ctr'
                        }, {
                            'label': 'Нижний\x20левый',
                            'val': 'cbl'
                        }, {
                            'label': 'Нижний\x20правый',
                            'val': 'cbr'
                        }],
                        'value': 'ctr'
                    },
                    'd1': {
                        'key': 'd1',
                        'name': 'Глубина\x201',
                        'type': 'input_ext',
                        'default': 0x1e,
                        'value': 0x1e
                    },
                    'd2': {
                        'key': 'd2',
                        'name': 'Глубина\x202',
                        'type': 'input_ext',
                        'default': 0x32,
                        'value': 0x32
                    },
                    'r': {
                        'key': 'r',
                        'name': 'Внешний\x20радиус',
                        'type': 'input_ext',
                        'default': 0x0,
                        'value': 0x0
                    },
                    'r_concave': {
                        'key': 'r_concave',
                        'name': 'Внутренний\x20радиус',
                        'type': 'input_ext',
                        'default': 0x0,
                        'value': 0x0
                    }
                }],
                'value': {
                    'o': {
                        'key': 'o',
                        'name': 'Ориентация',
                        'type': 'select',
                        'default': 'ctr',
                        'values': [{
                            'label': 'Верхний\x20левый',
                            'val': 'ctl'
                        }, {
                            'label': 'Верхний\x20правый',
                            'val': 'ctr'
                        }, {
                            'label': 'Нижний\x20левый',
                            'val': 'cbl'
                        }, {
                            'label': 'Нижний\x20правый',
                            'val': 'cbr'
                        }]
                    },
                    'd1': {
                        'key': 'd1',
                        'name': 'Глубина\x201',
                        'type': 'input_ext',
                        'default': 0x1e
                    },
                    'd2': {
                        'key': 'd2',
                        'name': 'Глубина\x202',
                        'type': 'input_ext',
                        'default': 0x32
                    },
                    'r': {
                        'key': 'r',
                        'name': 'Внешний\x20радиус',
                        'type': 'input_ext',
                        'default': 0x0
                    },
                    'r_concave': {
                        'key': 'r_concave',
                        'name': 'Внутренний\x20радиус',
                        'type': 'input_ext',
                        'default': 0x0
                    }
                }
            },
            'c_shapes': {
                'key': 'c_shapes',
                'name': 'C-образные',
                'type': 'array',
                'value_name': 'C-образная',
                'default': [{
                    'o': {
                        'key': 'o',
                        'name': 'Ориентация',
                        'type': 'select',
                        'default': 'cbr',
                        'values': [{
                            'label': 'Лево',
                            'val': 'ctl'
                        }, {
                            'label': 'Право',
                            'val': 'cbr'
                        }, {
                            'label': 'Верх',
                            'val': 'ctr'
                        }, {
                            'label': 'Низ',
                            'val': 'cbl'
                        }],
                        'value': 'cbr'
                    },
                    'd1': {
                        'key': 'd1',
                        'name': 'Глубина',
                        'type': 'input_ext',
                        'default': 0x1e,
                        'value': 0x1e
                    },
                    'w1': {
                        'key': 'w1',
                        'name': 'Ширина\x20углубления',
                        'type': 'input_ext',
                        'default': 0x32,
                        'value': 0x32
                    },
                    'offset': {
                        'key': 'offset',
                        'name': 'Отступ\x20от\x20края',
                        'type': 'input_ext',
                        'default': 's:y\x20/\x202\x20-\x2025',
                        'value': 's:y\x20/\x202\x20-\x2025'
                    },
                    'r': {
                        'key': 'r',
                        'name': 'Внешний\x20радиус',
                        'type': 'input_ext',
                        'default': 0x0,
                        'value': 0x0
                    },
                    'r_concave': {
                        'key': 'r_concave',
                        'name': 'Внутренний\x20радиус',
                        'type': 'input_ext',
                        'default': 0x0,
                        'value': 0x0
                    }
                }],
                'value': {
                    'o': {
                        'key': 'o',
                        'name': 'Ориентация',
                        'type': 'select',
                        'default': 'cbr',
                        'values': [{
                            'label': 'Лево',
                            'val': 'ctl'
                        }, {
                            'label': 'Право',
                            'val': 'cbr'
                        }, {
                            'label': 'Верх',
                            'val': 'ctr'
                        }, {
                            'label': 'Низ',
                            'val': 'cbl'
                        }]
                    },
                    'd1': {
                        'key': 'd1',
                        'name': 'Глубина',
                        'type': 'input_ext',
                        'default': 0x1e
                    },
                    'w1': {
                        'key': 'w1',
                        'name': 'Ширина\x20углубления',
                        'type': 'input_ext',
                        'default': 0x32
                    },
                    'offset': {
                        'key': 'offset',
                        'name': 'Отступ\x20от\x20края',
                        'type': 'input_ext',
                        'default': 's:y\x20/\x202\x20-\x2025'
                    },
                    'r': {
                        'key': 'r',
                        'name': 'Внешний\x20радиус',
                        'type': 'input_ext',
                        'default': 0x0
                    },
                    'r_concave': {
                        'key': 'r_concave',
                        'name': 'Внутренний\x20радиус',
                        'type': 'input_ext',
                        'default': 0x0
                    }
                }
            }
        }
    },
    'cut_l_shape': {
        'name': 'L-образные\x20и\x20скошенные\x20углы',
        'params': {
            'l_shapes': {
                'key': 'l_shapes',
                'name': 'L-образные',
                'type': 'array',
                'value_name': 'L-образная',
                'default': [{
                    'o': {
                        'key': 'o',
                        'name': 'Ориентация',
                        'type': 'select',
                        'default': 'ctr',
                        'values': [{
                            'label': 'Верхний\x20левый',
                            'val': 'ctl'
                        }, {
                            'label': 'Верхний\x20правый',
                            'val': 'ctr'
                        }, {
                            'label': 'Нижний\x20левый',
                            'val': 'cbl'
                        }, {
                            'label': 'Нижний\x20правый',
                            'val': 'cbr'
                        }],
                        'value': 'ctr'
                    },
                    'd1': {
                        'key': 'd1',
                        'name': 'Глубина\x201',
                        'type': 'input_ext',
                        'default': 0x1e,
                        'value': 0x1e
                    },
                    'd2': {
                        'key': 'd2',
                        'name': 'Глубина\x202',
                        'type': 'input_ext',
                        'default': 0x32,
                        'value': 0x32
                    },
                    'r': {
                        'key': 'r',
                        'name': 'Внешний\x20радиус',
                        'type': 'input_ext',
                        'default': 0x0,
                        'value': 0x0
                    },
                    'r_concave': {
                        'key': 'r_concave',
                        'name': 'Внутренний\x20радиус',
                        'type': 'input_ext',
                        'default': 0x0,
                        'value': 0x0
                    }
                }],
                'value': {
                    'o': {
                        'key': 'o',
                        'name': 'Ориентация',
                        'type': 'select',
                        'default': 'ctr',
                        'values': [{
                            'label': 'Верхний\x20левый',
                            'val': 'ctl'
                        }, {
                            'label': 'Верхний\x20правый',
                            'val': 'ctr'
                        }, {
                            'label': 'Нижний\x20левый',
                            'val': 'cbl'
                        }, {
                            'label': 'Нижний\x20правый',
                            'val': 'cbr'
                        }]
                    },
                    'd1': {
                        'key': 'd1',
                        'name': 'Глубина\x201',
                        'type': 'input_ext',
                        'default': 0x1e
                    },
                    'd2': {
                        'key': 'd2',
                        'name': 'Глубина\x202',
                        'type': 'input_ext',
                        'default': 0x32
                    },
                    'r': {
                        'key': 'r',
                        'name': 'Внешний\x20радиус',
                        'type': 'input_ext',
                        'default': 0x0
                    },
                    'r_concave': {
                        'key': 'r_concave',
                        'name': 'Внутренний\x20радиус',
                        'type': 'input_ext',
                        'default': 0x0
                    }
                }
            },
            'cut_corners': {
                'name': 'Обрезанные\x20углы',
                'name': 'Обрезанные\x20углы',
                'key': 'cut_corners',
                'type': 'array',
                'value_name': 'Обрезанный\x20угол',
                'default': [{
                    'o': {
                        'key': 'o',
                        'name': 'Ориентация',
                        'type': 'select',
                        'default': 'ctr',
                        'values': [{
                            'label': 'Верхний\x20левый',
                            'val': 'ctl'
                        }, {
                            'label': 'Верхний\x20правый',
                            'val': 'ctr'
                        }, {
                            'label': 'Нижний\x20левый',
                            'val': 'cbl'
                        }, {
                            'label': 'Нижний\x20правый',
                            'val': 'cbr'
                        }],
                        'value': 'cbl'
                    },
                    'd1': {
                        'key': 'd1',
                        'name': 'Отступ\x201',
                        'type': 'input_ext',
                        'default': 0x1e,
                        'value': 0x1e
                    },
                    'd2': {
                        'key': 'd2',
                        'name': 'Отступ\x202',
                        'type': 'input_ext',
                        'default': 0x32,
                        'value': 0x32
                    },
                    'r': {
                        'key': 'r',
                        'name': 'Внешний\x20радиус',
                        'type': 'input_ext',
                        'default': 0x0,
                        'value': 0x0
                    }
                }],
                'value': {
                    'o': {
                        'key': 'o',
                        'name': 'Ориентация',
                        'type': 'select',
                        'default': 'ctr',
                        'values': [{
                            'label': 'Верхний\x20левый',
                            'val': 'ctl'
                        }, {
                            'label': 'Верхний\x20правый',
                            'val': 'ctr'
                        }, {
                            'label': 'Нижний\x20левый',
                            'val': 'cbl'
                        }, {
                            'label': 'Нижний\x20правый',
                            'val': 'cbr'
                        }]
                    },
                    'd1': {
                        'key': 'd1',
                        'name': 'Отступ\x201',
                        'type': 'input_ext',
                        'default': 0x32
                    },
                    'd2': {
                        'key': 'd2',
                        'name': 'Отступ\x202',
                        'type': 'input_ext',
                        'default': 0x32
                    }
                }
            }
        }
    },
    'radius': {
        'name': 'Радиус',
        'params': {
            'r': {
                'key': 'r',
                'name': 'Радиус',
                'type': 'input_ext',
                'default': 0x5
            }
        }
    },
    'free': {
        'name': 'Свободная',
        'params': {
            'points': {
                'key': 'points',
                'name': 'Точки',
                'type': 'array',
                'value_name': 'Координаты',
                'default': [],
                'value': {
                    'x': {
                        'key': 'x',
                        'name': 'x',
                        'type': 'input_ext',
                        'default': 0x0
                    },
                    'y': {
                        'key': 'y',
                        'name': 'y',
                        'type': 'input_ext',
                        'default': 0x0
                    },
                    'radius': {
                        'key': 'radius',
                        'name': 'Радиус',
                        'type': 'input_ext',
                        'default': 0x0
                    }
                }
            }
        }
    }
},
pp['custom']['path_types'] = {
    'common': {
        'name': 'Обычная',
        'params': {}
    },
    'cut_corners': {
        'name': 'Обрезанные\x20углы',
        'params': {
            'cbl': {
                'key': 'cbl',
                'name': 'Нижний\x20левый',
                'type': 'input_ext',
                'default': 0x0
            },
            'ctl': {
                'key': 'ctl',
                'name': 'Верхний\x20левый',
                'type': 'input_ext',
                'default': 0x0
            },
            'ctr': {
                'key': 'ctr',
                'name': 'Верхний\x20правый',
                'type': 'input_ext',
                'default': 0x0
            },
            'cbr': {
                'key': 'cbr',
                'name': 'Нижний\x20правый',
                'type': 'input_ext',
                'default': 0x0
            }
        }
    },
    'angle': {
        'name': 'Треугольник\x20на\x20всю\x20глубину',
        'params': {
            'angle': {
                'key': 'angle',
                'name': 'Угол',
                'type': 'input_ext',
                'default': 0x2d
            }
        }
    },
    'dx_angle': {
        'name': 'Треугольник\x20с\x20отступом',
        'params': {
            'angle': {
                'key': 'angle',
                'name': 'Угол',
                'type': 'input_ext',
                'default': 0x2d
            }
        }
    },
    'radius': {
        'name': 'Радиус',
        'params': {
            'r': {
                'key': 'r',
                'name': 'Радиус',
                'type': 'input_ext',
                'default': 0x5
            }
        }
    },
    'rounded_corners': {
        'name': 'Радиусные\x20углы',
        'params': {
            'cbl': {
                'key': 'cbl',
                'name': 'Нижний\x20левый',
                'type': 'input_ext',
                'default': 0x0
            },
            'ctl': {
                'key': 'ctl',
                'name': 'Верхний\x20левый',
                'type': 'input_ext',
                'default': 0x0
            },
            'ctr': {
                'key': 'ctr',
                'name': 'Верхний\x20правый',
                'type': 'input_ext',
                'default': 0x0
            },
            'cbr': {
                'key': 'cbr',
                'name': 'Нижний\x20правый',
                'type': 'input_ext',
                'default': 0x0
            }
        }
    },
    'trapeze_cut_by_offset': {
        'name': 'Трапеция',
        'params': {
            'w1': {
                'key': 'w1',
                'name': 'Ширина\x20спереди',
                'type': 'input_ext',
                'default': 0x96
            },
            'h1': {
                'key': 'h1',
                'name': 'Высота\x20спереди',
                'type': 'input_ext',
                'default': 0x96
            },
            'w2': {
                'key': 'w2',
                'name': 'Ширина\x20сзади',
                'type': 'input_ext',
                'default': 0x4b
            },
            'h2': {
                'key': 'h2',
                'name': 'Высота\x20сзади',
                'type': 'input_ext',
                'default': 0x4b
            },
            'o': {
                'key': 'o',
                'name': 'Ориентация',
                'type': 'select',
                'default': 'left',
                'values': [{
                    'label': 'Левая',
                    'val': 'left'
                }, {
                    'label': 'Правая',
                    'val': 'right'
                }]
            }
        }
    }
},
pp['is_config_page'] = 0x0,
pp['catalog'] = null,
pp['core'] = 0x2,
pp['assets'] = {
    'sizes': {}
},
pp['run_event'] = async function(f, g, ...h) {
    var j = pp['events'][f][g];
    if (j) {
        if ('function' == typeof j)
            'AsyncFunction' === j['constructor']['name'] ? await j(...h) : j(...h);
        else
            for (let l = 0x0; l < j['length']; l++) {
                var k = j[l];
                'AsyncFunction' === k['constructor']['name'] ? await k(...h) : k(...h);
            }
    }
}
,
pp['add_event'] = function(f, g, h) {
    pp['events'][f][g]['push'](h);
}
,
pp['events'] = {
    'global': {
        'before_init': [],
        'before_load_params': [],
        'after_init': null,
        'after_scene_load': [],
        'after_autosave_modal_show': [],
        'before_interface': null,
        'before_interface_components_init': null,
        'after_interface_init': [],
        'before_room_set_size': null,
        'after_room_set_size': null,
        'after_build_tabletop': null,
        'get_specs_start': null,
        'get_specs_end': null,
        'before_apply_specs_aggr': null,
        'before_create_spec_item': null,
        'after_create_spec_item': null
    },
    'interaction': {
        'autosave_load_cancel': [],
        'before_delete': null
    },
    'interface': {
        'before_main_menu_init': null,
        'after_main_menu_init': null,
        'main_menu_select_item': null,
        'main_menu_unselect_item': null
    },
    'mouse': {
        'on_mouse_cancel_draggable': null,
        'on_mouse_cancel': null,
        'on_mouse_down_3_get_selected': null,
        'dblclick': null,
        'find_move_hit': null,
        'down_fill_hit': null
    },
    'cabinet': {
        'before_build': null,
        'before_add_drag_child': null,
        'before_build_params': null,
        'after_build_params': null,
        'after_add_material_key': null,
        'after_add_material_key_w_label': null,
        'after_add_custom_material_key': null,
        'after_build': null
    },
    'module': {
        'before_build': null,
        'before_embed_in_section': null,
        'before_add_drag_child': null,
        'before_show_drag_area': null,
        'before_open_all': null,
        'after_add_material_key': null,
        'after_add_material_key_w_label': null,
        'after_add_custom_material_key': null,
        'after_build': null,
        'fill_edit_mode': null,
        'generate_sprite_number': null
    },
    'parts': {
        'sec_after_build': null,
        'wall_before_apply_material': null,
        'model_before_get_model': null,
        'facade_after_load_model': null,
        'sec_condition_check': null
    },
    'size': {
        'add_offset_text_size': null,
        'after_build': null
    },
    'fill_section': {
        'before_params': null,
        'before_build_children': null
    },
    'drag': {
        'intersection_embed': null
    },
    'custom': {}
},
pp['interface'] = {
    'root': null,
    'overrides': {
        'get_variant_select_format': null
    }
},
pp['defaults'] = {},
pp['config'] = {
    'on_demand_render': !0x1
},
pp['spec_settings'] = {
    'settings': {
        'price_enabled': 0x1,
        'price_modificator': 0x1
    },
    'price_mod': {
        'by_mod_type': {}
    }
},
pp['three'] = {
    'functions': {},
    'materials': {
        'hole': new THREE['MeshBasicMaterial']({
            'color': 0xaaaaaa,
            'depthTest': !0x0
        }),
        'helper_cube': new THREE['MeshBasicMaterial']({
            'color': '#96c296',
            'transparent': !0x0,
            'opacity': 0.2,
            'depthWrite': !0x1,
            'depthTest': !0x1
        }),
        'basic_line': new THREE['LineBasicMaterial']({
            'color': '#000000',
            'depthTest': !0x1
        }),
        'arrow': new THREE['MeshBasicMaterial']({
            'color': 0x0,
            'depthTest': !0x1,
            'transparent': !0x0,
            'opacity': 0x1
        }),
        'snap_points': new THREE['MeshBasicMaterial']({
            'color': 0x96c296,
            'transparent': !0x0,
            'opacity': 0.2,
            'depthWrite': !0x1,
            'depthTest': !0x0,
            'side': THREE['DoubleSide']
        }),
        'cabinet_path': new THREE['MeshBasicMaterial']({
            'color': 0x3ff46,
            'transparent': !0x0,
            'depthTest': !0x1
        }),
        'transparent_material': new THREE['MeshBasicMaterial']({
            'transparent': !0x0,
            'opacity': 0x0,
            'depthWrite': !0x1
        })
    }
},
pp['helpers'] = {},
pp['libs'] = {},
pp['lights'] = {},
pp['libs']['legs'] = legs_lib,
pp['libs']['lockers'] = lockers_lib,
pp['libs']['washes'] = washes_lib,
pp['libs']['materials'] = {},
pp['libs']['butts'] = {},
pp['libs']['catalogs'] = {},
pp['libs']['glass'] = glass_lib,
pp['libs']['modules'] = mod_lib,
pp['libs']['tech'] = tech_lib,
pp['libs']['interior'] = interior_lib,
pp['libs']['comms'] = comms_lib,
pp['libs']['constructions'] = constructions_lib,
pp['libs']['bardesks'] = bardesks_lib,
pp['libs']['background'] = libs['background'],
pp['libs']['templates'] = new lib(material_0,category_0),
pp['libs']['bort'] = {},
pp['libs']['butts'] = {},
pp['libs']['butts_info'] = {
    'keys': []
},
pp['libs']['catalogs_by_key'] = {},
pp['libs']['catalogs_info'] = {
    'keys': []
},
pp['libs']['cokol'] = {},
pp['libs']['furniture'] = {},
pp['libs']['hole'] = {},
pp['libs']['materials_by_key'] = {},
pp['libs']['materials_info'] = {
    'keys': []
},
pp['libs']['modules_groups'] = [],
pp['libs']['tabletop'] = tabletop_lib,
pp['libs']['key_value'] = {},
pp['libs']['icons'] = {},
pp['libs']['model_materials'] = new lib({
    'id': 0x0
},category_0),
pp['variables'] = {
    'global_vars': [{
        'name': '',
        'key': '__default_vars',
        'active': 0x1,
        'default': 0x1,
        'vars': [],
        'vars_hash': {}
    }],
    'selected_index': 0x0
},
pp['const'] = {
    'not_set_value': '__empty'
},
pp['const']['vars'] = {
    'plint_enabled': '__plint_enabled',
    'cokol_enabled': '__cokol_enabled',
    'cokol_top_enabled': '__cokol_top_enabled',
    'cornice_enabled': '__cornice_enabled',
    'tabletop_enabled': '_tbl',
    'cokol_height': '__cokol_height',
    'tabletop_height': '__tabletop_height',
    'tabletop_depth': 'depth_tabletop',
    'facade_thickness': '__facade_thickness'
},
pp['temp'] = {
    'catalog_size_hash': {}
},
pp['math'] = {
    'normalize_angle': function(f) {
        return (f % (0x2 * Math['PI']) + 0x2 * Math['PI']) % (0x2 * Math['PI']);
    }
},
Object['defineProperty'](pp['variables'], 'current', {
    'get': function() {
        var f = this['global_vars'][this['selected_index']];
        return f && f['vars'] ? f['vars'] : void 0x0;
    },
    'set': function(f) {
        var g;
        this['selected_index'] < 0x0 || ((g = this['global_vars'][this['selected_index']]) ? (g['vars'] = f,
        g['vars_hash'] = _['keyBy'](f, 'key')) : this['global_vars'][this['selected_index']] = {
            'name': '',
            'key': '',
            'active': 0x1,
            'vars': f,
            'vars_hash': _['keyBy'](f, 'key')
        });
    }
}),
Object['defineProperty'](pp['variables'], 'current_hash', {
    'get': function() {
        var f = this['global_vars'][this['selected_index']];
        return f && f['vars_hash'] ? f['vars_hash'] : void 0x0;
    },
    'set': function(f) {}
}),
pp['info'] = {},
pp['info']['project'] = {
    'account_created': window['location']['href'],
    'date_created': new Date()['toLocaleString']('ru', {
        'timeZone': 'Europe/Moscow'
    }),
    'account_updated': '',
    'date_updated': ''
},
pp['info']['tabletop'] = {
    'items': [],
    'items_parts': [],
    'bort_items': [],
    'desc': [],
    'bort_desc': [],
    'cuts_update': [],
    'needUpdateAfterModelsLoad': !0x1
},
pp['state'] = {},
pp['state']['scene_layers'] = {
    'tabletop': !0x0,
    'comments': !0x0,
    'numbers': !0x1
},
pp['variables_events'] = {
    '_tbl': {
        'handlers': [f => {
            sc['set_tabletop_autogen'](f?.['target'], f?.['variable']?.['value']);
        }
        ]
    }
},
{
    'state': new Set(),
    'add'(f) {
        this['state']['add'](f);
    },
    'remove'(f) {
        !this['state']['delete'](f) || this['state']['size'] || this['raiseOnEmptyEvent']();
    },
    'isEmpty'() {
        return 0x0 === this['state']['size'];
    },
    'raiseOnEmptyEvent'() {
        pp['info']['tabletop']['needUpdateAfterModelsLoad'] && (pp['info']['tabletop']['needUpdateAfterModelsLoad'] = !0x1,
        sc['need_update_tabletops']());
    }
});
function load_icons() {
    var f;
    return fetch('/common_assets/fonts/icons/new/fonts/icons.json')['then'](g => {
        if (g['ok'])
            return g['json']();
        throw new Error('Ошибка\x20загрузки\x20icons.json:\x20' + g['statusText']);
    }
    )['then'](g => {
        pp['libs']['icons'] = g;
    }
    )['catch'](g => {}
    );
}
load_icons();
let workbook;
async function interface_init() {
    'function' == typeof interface_v2 && user_provider(),
    'function' == typeof interface_v2 && interface_v2(),
    global_options['color_picker_cursor'] = 'url(/common_assets/images/color_picker_fill_cursor.png)\x204\x2021,\x20auto',
    'function' == typeof interface_init_callback && interface_init_callback(),
    await pp['run_event']('global', 'after_interface_init');
}
function interface_v2() {
    if (interface_version && 0x2 == interface_version && (interface_new(),
    cart_new(),
    interface_components_init) && interface_components_init['length']) {
        if ('function' == typeof pp['events']['global']['before_interface_components_init'] && pp['events']['global']['before_interface_components_init'](interface_components_init),
        pp?.['custom']?.['components']) {
            for (let f = 0x0; f < pp['custom']['components']['length']; f++)
                interface_components_init['push'](pp['custom']['components'][f]);
        }
        for (let g = 0x0; g < interface_components_init['length']; g++)
            'function' == typeof interface_components_init[g] ? interface_components_init[g]() : interface_components_init[g]['fn']();
    }
    Vue['prototype']['$axios'] = axios,
    Vue['prototype']['$selected_object'] = null,
    Vue['prototype']['$interactive_object'] = null,
    Vue['prototype']['$shop_mode'] = null,
    Vue['prototype']['$up']['load_from_storage'](),
    pp['interface']['root'] = new Vue({
        'el': '#main_app',
        'data': {
            'delay': 'undefined' == typeof input_delay ? 0x1f4 : input_delay,
            'debounce': null,
            'logo_part': 0x0,
            'accessories': {
                'visible': 0x1,
                'selected_cat': -0x1,
                'selected_item': 0x0,
                'to_module': null
            },
            'colorpicker_notice': !0x1
        },
        'created': function() {
            var h;
            this['$shop_mode'] = constructor_settings['shop_mode'],
            this['$cs'] = constructor_settings,
            this['$is'] = JSON['parse'](document['getElementById']('ini_settings')['innerText']),
            this['$is']['tariff'] && (0x1 == this['$is']['tariff']['add_logo_part'] || 0x46 <= this['$root']['$is']['tariff']['id']) && document['getElementById']('logo_top_src')['value'] && (this['logo_part'] = 0x1),
            this['$custom_options'] = {},
            this['$custom_functions'] = {},
            this['$temp_data'] = {},
            this['$components'] = constructor_settings['components'],
            this['$custom_top_depth'] = !0x1,
            this['$custom_bottm_depth'] = !0x1,
            this['$custom_top_depth_value'] = 0x12c,
            this['$custom_bottom_depth_value'] = 0x258,
            this['$options']['is_forced_common'] = -0x1 < location['href']['indexOf']('forced_common'),
            this['create_axes_widget']();
        },
        'computed': {},
        'beforeMount': function() {},
        'mounted': async function() {
            this['$emit']('init_accessories', {
                'catalog': accsessories_data,
                'cart': cart
            }),
            this['$refs']['loader']['style']['display'] = 'none',
            this['$on']('yn_modal_autosave', async function() {
                load_scene_new(await pp['storage']['getJsonFromZip']('autosave'));
            });
        },
        'methods': {
            'round_decimals'(h) {
                return round_decimals(h);
            },
            'round_decimals_2'(h) {
                return round_decimals_2(h);
            },
            'to_fix2'(h) {
                return to_fix2(h);
            },
            'format_price'(h) {
                return format_price(h);
            },
            'unset_mouse_mode'() {
                this['unset_colorpicker_mode'](),
                this['unset_fill_mode'](),
                this['$refs']['top_menu']['unset_mouse_mode']();
            },
            'delay_input'(h) {
                clearTimeout(this['debounce']),
                this['debounce'] = setTimeout( () => {
                    h();
                }
                , this['delay']);
            },
            'order_modal_set_fields'(h=[]) {
                pp['interface']['root']['$emit']('order_modal_set_fields', h);
            },
            'set_colorpicker_mode'(h) {
                this['$emit']('colorpicker_mode_change', h);
            },
            'unset_colorpicker_mode'(h) {
                global_options['mouse_mode']['mode'] = 'drag',
                global_options['mouse_mode']['target'] = null,
                global_options['mouse_mode']['item_id'] = null,
                global_options['mouse_mode']['obj'] && (global_options['mouse_mode']['obj']['material']['emissiveIntensity'] = 0x0),
                this['$emit']('colorpicker_mode_off', !0x1),
                dControls['set_cursor']();
            },
            'set_fill_mode'() {
                this['$emit']('colorpicker_mode_change', 'fill');
                for (let i = room['active_objects']['length']; i--; ) {
                    var h = room['active_objects'][i];
                    'CabinetN' == h['temp_type'] && h['show_drag_areas'](global_options['mouse_mode']['item_id'] + '');
                }
            },
            'unset_fill_mode'() {
                this['$emit']('colorpicker_mode_off', !0x1),
                global_options['mouse_mode']['mode'] = 'drag',
                global_options['mouse_mode']['target'] = null,
                global_options['mouse_mode']['item_id'] = null,
                global_options['mouse_mode']['obj'] && (global_options['mouse_mode']['obj']['material']['emissiveIntensity'] = 0x0),
                this['$emit']('colorpicker_mode_off', !0x1),
                dControls['set_cursor']();
                for (let i = room['active_objects']['length']; i--; ) {
                    var h = room['active_objects'][i];
                    'CabinetN' == h['temp_type'] && h['hide_drag_areas']();
                }
            },
            'set_erase_mode'() {
                this['unset_fill_mode'](),
                this['$emit']('colorpicker_mode_change', 'erase'),
                global_options['mouse_mode']['mode'] = 'picker',
                global_options['mouse_mode']['target'] = 'erase';
                for (let i = room['active_objects']['length']; i--; ) {
                    var h = room['active_objects'][i];
                    'CabinetN' == h['temp_type'] && h['show_draggables']();
                }
            },
            'unset_erase_mode'() {
                global_options['mouse_mode']['mode'] = 'drag',
                global_options['mouse_mode']['target'] = null,
                global_options['mouse_mode']['item_id'] = null,
                global_options['mouse_mode']['obj'] && (global_options['mouse_mode']['obj']['material']['emissiveIntensity'] = 0x0),
                this['$emit']('colorpicker_mode_off', !0x1),
                dControls['set_cursor']();
                for (let i = room['active_objects']['length']; i--; ) {
                    var h = room['active_objects'][i];
                    'CabinetN' == h['temp_type'] && h['hide_draggables']();
                }
            },
            'get_custom_options': function() {
                return this['$custom_options'];
            },
            'set_custom_options': function(h) {
                this['$custom_options'] = h;
            },
            'add_custom_option': function(h, i) {
                this['$custom_options'][h] = i;
            },
            'remove_custom_option': function(h) {
                delete this['$custom_options'][h];
            },
            'add_custom_fn': function(h, i) {
                this['$custom_functions'][h] = i;
            },
            'remove_custom_fb': function(h) {
                delete this['$custom_functions'][h];
            },
            'set_selected': function(h, i=0x1) {
                this['$selected_object'] = h,
                0x1 == i && this['$emit']('set_selected', h);
            },
            'set_item': function(h) {
                this['$emit']('set_item', h);
            },
            'set_module_menu_tab': function(h, i=0x0) {
                this['$emit']('set_module_menu_tab', h, i);
            },
            'show_accessories': function(h=0x0, i=0x0) {
                if (0x1 < interface_version) {
                    if (!i) {
                        var j = pp['interface']['root']['$refs']['main_menu'];
                        let k, l;
                        for (let m = 0x0; m < j['items']['length']; m++)
                            if (j['items'][m]['component'] && 'cart' == j['items'][m]['component']['id']) {
                                k = copy_object(j['items'][m]),
                                l = m;
                                break;
                            }
                        k['component']['props'] || (k['component']['props'] = {}),
                        k['component']['props']['mode'] = 'c',
                        k && (j['handle_click'](k, l, !0x0),
                        j['$nextTick']( () => {}
                        ));
                    }
                } else
                    this['$emit']('show_accessories', {
                        'mode': h,
                        'to_module': i
                    });
            },
            'show_accessories_new': function(h) {
                null == h['mode'] && (h['mode'] = 0x1),
                null == h['to_module'] && (h['to_module'] = 0x0),
                this['$emit']('show_accessories', h);
            },
            'remove_accessories': function(h, i=0x0) {
                this['$emit']('remove_accessories', {
                    'item': h,
                    'obj_id': i
                });
            },
            'clear_cart': function() {
                this['$emit']('clear_cart', 0x1);
            },
            'set_cart': function() {
                this['$emit']('set_cart', cart);
            },
            'tmp_dis': function() {
                this['$refs']['interface'] && this['$refs']['interface']['classList']['contains']('tmp_dis') && this['$refs']['interface']['classList']['remove']('tmp_dis');
            },
            'update_sizes_from_wall': function(h, i) {
                this['$emit']('update_sizes_from_wall', h, i);
            },
            'additional_sizes_mode_changed': function(h) {
                this['$emit']('additional_sizes_mode_changed', h);
            },
            'show_modal': function() {},
            'show_custom_modal': function(h={}) {
                this['$emit']('show_custom_modal', h);
            },
            'radial': function(h) {
                this['$emit']('show_rad_menu', h);
            },
            'radial_hide': function() {
                this['$emit']('hide_rad_menu', 0x1);
            },
            'lang': function(h) {
                return lang[h];
            },
            'set_interactive': function(h) {
                this['$interactive_object'] = h,
                this['$emit']('set_interactive', h);
            },
            'create_axes_widget'() {
                constructor_settings['use_axes_front'] && new THREE['OrbitControlsGizmo'](controls,{
                    'size': 0x96,
                    'padding': 0x8,
                    'room': !0x0
                });
            },
            'yn_modal': function(h={
                'heading': '',
                'body': '',
                'fn': null,
                'no_callback': null
            }) {
                this['$emit']('yn_modal_show', {
                    'heading': h['heading'],
                    'body': h['body'],
                    'callback': h['fn'],
                    'no_callback': h['no_callback']
                });
            }
        }
    }),
    bpi = pp['interface']['root'],
    Object['keys'](pp['interface']['root']['$refs'])['forEach'](h => {
        pp['interface'][h] = pp['interface']['root']['$refs'][h];
    }
    ),
    Vue['directive']('click-outside', {
        'bind': function(h, i, j) {
            h['clickOutsideEvent'] = function(k) {
                h === k['target'] || h['contains'](k['target']) || j['context'][i['expression']](k);
            }
            ,
            document['body']['addEventListener']('click', h['clickOutsideEvent']);
        },
        'unbind': function(h) {
            document['body']['removeEventListener']('click', h['clickOutsideEvent']);
        }
    });
}
function save_screen(e, f) {
    setTimeout(function() {
        var g = document['createElement']('a')
          , h = (g['download'] = 'image.png',
        document['body']['appendChild'](g),
        renderer['domElement']['width'])
          , j = renderer['domElement']['height'];
        let k = renderer['domElement']['width']
          , l = renderer['domElement']['height'];
        e && (k = e),
        f && (l = f),
        e && (camera['aspect'] = k / l,
        camera['updateProjectionMatrix'](),
        renderer['setSize'](k, l),
        renderer['render'](scene, camera, null, !0x1));
        var m = document['createElement']('canvas')
          , p = (m['width'] = renderer['domElement']['width'],
        m['height'] = renderer['domElement']['height'],
        m['getContext']('2d'))
          , h = (renderer['render'](scene, camera, null, !0x1),
        p['drawImage'](renderer['domElement'], 0x0, 0x0, renderer['domElement']['width'], renderer['domElement']['height'], 0x0, 0x0, renderer['domElement']['width'], renderer['domElement']['height']),
        e && (camera['aspect'] = h / j,
        camera['updateProjectionMatrix'](),
        renderer['setSize'](h, j),
        renderer['render'](scene, camera, null, !0x1)),
        document['getElementsByClassName']('client_logo'));
        if (h['length']) {
            let q = h[0x0]['getElementsByTagName']('IMG');
            q['length'] && (q = q[0x0]);
            var j = new Image()
              , h = (j['src'] = q['src'],
            j['width'] / 0xb4)
              , h = j['height'] / h;
            try {
                p['drawImage'](j, m['width'] - 0xb4 - 0xa, 0xa, 0xb4, h);
            } catch (u) {}
        }
        var j = document['getElementsByClassName']('client_data'), h;
        j['length'] && '' != j[0x0]['innerHTML']['trim']() && (p['font'] = 'normal\x2020px\x20Arial',
        h = p['measureText']($('.client_data')['html']()),
        p['fillStyle'] = '#353537',
        p['globalAlpha'] = 0.6,
        p['fillRect'](m['width'] - h['width'], m['height'] - 0x46, h['width'], 0x32),
        p['globalAlpha'] = 0x1,
        p['fillStyle'] = '#ffffff',
        p['fillText'](j[0x0]['innerHTML'], m['width'] - h['width'], m['height'] - 0x28)),
        m['toBlob'](function(v) {
            g['href'] = URL['createObjectURL'](v),
            g['click'](),
            g['remove']();
        }, 'image/png', 0x1);
    }, 0x64);
}
function check_interface_components() {
    constructor_settings['options'] || (constructor_settings['options'] = {},
    constructor_settings['options']['color_picker']) || (constructor_settings['options']['color_picker'] = 0x1),
    constructor_settings['components'] || (constructor_settings['components'] = {
        'walls_material_picker': 0x1,
        'floor_material_picker': 0x1,
        'glass_material_picker': 0x1,
        'corpus_material_picker': 0x1,
        'cokol_material_picker': 0x1,
        'handles_picker': 0x1,
        'backwall_material_picker': 0x1,
        'kitchen_params': 0x1 == constructor_settings['show_kitchen_parameters'] && 0x1 != constructor_settings['shop_mode'],
        'wallpanel_materials_picker': 0x1,
        'facades_picker': 0x1,
        'facade_model': 0x1,
        'facade_material': 0x1,
        'facade_type': 0x1,
        'washer_picker': 0x1,
        'washes_picker': 0x0,
        'can_facade': 0x1,
        'can_color': 0x1,
        'can_style': 0x1,
        'sides_picker': 0x1,
        'bardesk_picker': 0x1,
        'bardesks_picker': 0x0,
        'tabletop_picker': 0x1 == constructor_settings['tabletop_v2'],
        'tabletop_materials_picker': 0x0 == constructor_settings['tabletop_v2'],
        'shelve_picker': parseInt(constructor_settings['show_shelves_panel']),
        'color_picker': constructor_settings['options']['color_picker'],
        'common_mode': constructor_settings['allow_common_mode'],
        'kitchen_configurator': constructor_settings['frontend_configurator_available'],
        'kitchen_style_picker': constructor_settings['shop_mode'],
        'furniture_picker': 0x1,
        'accessories_component': 0x1,
        'services': 0x1 == constructor_settings['services_enabled']
    }),
    0x1 < Object['keys'](washes_lib['items'])['length'] && (constructor_settings['components']['washer_picker'] = 0x0,
    constructor_settings['components']['washes_picker'] = 0x1),
    0x0 < Object['keys'](bardesks_lib['items'])['length'] && 0x0 != Object['keys'](bardesks_lib['items'])[0x0] && (constructor_settings['components']['bardesk_picker'] = 0x0,
    constructor_settings['components']['bardesks_picker'] = 0x1),
    'object' != typeof project_settings['materials']['top']['back_wall_material'] && (constructor_settings['components']['backwall_material_picker'] = 0x0),
    constructor_settings['components']['can_style'] = parseInt(constructor_settings['facade_style_change_availabale']),
    project_settings['is_kitchen_model'] && (constructor_settings['components']['glass_material_picker'] = parseInt(project_settings['available_selection']['allow_glass_material_select']),
    constructor_settings['components']['corpus_material_picker'] = parseInt(project_settings['available_selection']['allow_corpus_materials_select']),
    constructor_settings['components']['cokol_material_picker'] = parseInt(project_settings['available_selection']['allow_cokol_materials_select']),
    constructor_settings['components']['handles_picker'] = parseInt(project_settings['available_selection']['allow_handles_select']),
    constructor_settings['components']['tabletop_materials_picker'] = parseInt(project_settings['available_selection']['allow_tabletop_materials_select']),
    constructor_settings['components']['wallpanel_materials_picker'] = parseInt(project_settings['available_selection']['allow_wallpanel_materials_select']),
    constructor_settings['components']['color_picker'] = 0x0,
    0x1 == project_settings['handle']['no_handle']) && (constructor_settings['components']['handles_picker'] = 0x0),
    accsessories_data['is_auto'] || (constructor_settings['components']['furniture_picker'] = 0x0),
    constructor_settings['components']['catalog_picker'] = 0x0,
    0x1 == constructor_settings['catalog_available'] && catalog_data['categories'] && catalog_data['categories']['length'] && (constructor_settings['components']['catalog_picker'] = 0x1),
    -0x1 < location['href']['indexOf']('mfleko') && (constructor_settings['components']['sides_picker'] = 0x0);
}
let interface_controller = {
    'order_modal_set_fields': function(f) {
        pp['interface']['root']['order_modal_set_fields'](f);
    },
    'pdf_new_tab': async function() {
        'function' == typeof before_pdf_callback && !before_pdf_callback('new_tab') || open_data_uri_window(await generate_pdf());
    },
    'pdf_download': function() {
        'function' == typeof before_pdf_callback && !before_pdf_callback('download') || download_pdf();
    },
    'xls_download': function() {
        var f;
        document['getElementById']('xljs') || ((f = document['createElement']('script'))['id'] = 'xljs',
        f['src'] = '/common_assets/libs/exceljs.min.js',
        document['head']['append'](f));
        let g = setInterval(function() {
            'object' == typeof ExcelJS && (clearInterval(g),
            create_xl(!0x1));
        }, 0x64);
    },
    'csv_export_Asai': function() {
        var f;
        document['getElementById']('xljs') || ((f = document['createElement']('script'))['id'] = 'xljs',
        f['src'] = '/common_assets/libs/exceljs.min.js',
        document['head']['append'](f));
        let g = setInterval(function() {
            'object' == typeof ExcelJS && (clearInterval(g),
            export_csv_Asai_Cut(!0x1));
        }, 0x64);
    }
}
  , ic = interface_controller
  , cart = {
    'items': [],
    'custom_items': [],
    'accessories': [],
    'total_price': 0x0
};
function show_accessories_to_module() {
    pp['interface']['root']['show_accessories'](0x0, active_el['params']['obj_id']);
}
function flyToElement(g, h) {
    var j = $(this)
      , k = 0x3
      , l = $(g)['clone']()
      , m = ($(l)['css']({
        'position': 'absolute',
        'overflow': 'hidden',
        'width': g['clientWidth'],
        'height': g['clientHeight'],
        'top': $(g)['offset']()['top'] + 'px',
        'left': $(g)['offset']()['left'] + 'px',
        'opacity': 0x1,
        'z-index': 0x3e8
    }),
    $('body')['append']($(l)),
    $(h)['offset']()['left'] + $(h)['width']() / 0x2 - $(g)['width']() / 0x3 / 0x2)
      , n = $(h)['offset']()['top'] + $(h)['height']() / 0x2 - $(g)['height']() / 0x3 / 0x2;
    $(l)['animate']({
        'opacity': 0.4,
        'left': m,
        'top': n,
        'width': $(g)['width']() / 0x3,
        'height': $(g)['height']() / 0x3
    }, 0x12c, function() {
        $(h)['fadeOut']('fast', function() {
            $(h)['fadeIn']('fast', function() {
                $(l)['fadeOut']('fast', function() {
                    $(l)['remove']();
                });
            });
        });
    });
}
class PPObject extends THREE['Group'] {
    constructor(e) {
        super(e),
        this['cust_dists'] = {},
        this['from_wall_sizes'] = new THREE['Group'](),
        this['from_wall_sizes']['name'] = 'Sizes\x20from\x20wall',
        this['add'](this['from_wall_sizes']),
        this['wrong_box'] = new THREE['Group'](),
        this['wrong_box']['name'] = 'Wrong_box',
        this['add'](this['wrong_box']),
        this['wrong_box']['visible'] = !0x1,
        this['number_obj'] = new THREE['Group'](),
        this['number_obj']['name'] = 'Number',
        this['add'](this['number_obj']),
        this['number_obj']['visible'] = global_options['show_numbers'],
        this['userData'] = {
            'interaction': {
                'check_intersection': 0x1,
                'selectable': 0x1,
                'rotation_locked': 0x0,
                'movement_locked': 0x0
            },
            'around': {
                'at_wall': 0x0,
                'left': null,
                'right': null,
                'front': null,
                'back': null
            }
        },
        this['userData']['selection_edges'] = [],
        this['forward'] = new THREE['Group'](),
        this['add'](this['forward']),
        this['forward']['position']['z'] = 0x1,
        this['get_forward'] = function() {
            return new THREE['Vector3']()['subVectors'](this['forward']['getWorldPosition'](new THREE['Vector3']()), this['getWorldPosition'](new THREE['Vector3']()));
        }
        ,
        this['snap_points'] = new THREE['Group'](),
        this['add'](this['snap_points']),
        this['userData']['points_list'] = [],
        'function' == typeof THREE['OBB'] && (this['userData']['obb'] = new THREE['OBB']());
    }
    ['build']() {}
    ['after_delete']() {}
    ['calculate_distances']() {
        var e, f;
        custom_settings['from_wall_sizes_disabled'] || (f = (e = this)['box']['getSize'](new THREE['Vector3']()),
        this['cust_dists']['floor'] = (room['floor']['position']['y'] + e['position']['y'])['toFixed'](0x1) * units,
        this['cust_dists']['ceiling'] = (room['ceiling']['position']['y'] - (e['position']['y'] + f['y']))['toFixed'](0x1) * units,
        0x0 == normalize_angle(e['rotation']['y']) && (this['cust_dists']['left_wall'] = (room['left_wall']['position']['x'] + (e['position']['x'] - f['x'] / 0x2))['toFixed'](0x1) * units,
        this['cust_dists']['right_wall'] = (room['right_wall']['position']['x'] - (e['position']['x'] + f['x'] / 0x2))['toFixed'](0x1) * units,
        this['cust_dists']['back_wall'] = (room['front_wall']['position']['z'] + (e['position']['z'] - f['z'] / 0x2))['toFixed'](0x1) * units,
        this['cust_dists']['front_wall'] = (room['back_wall']['position']['z'] - (e['position']['z'] + f['z'] / 0x2))['toFixed'](0x1) * units),
        -0x2 === normalize_angle(e['rotation']['y']) && (this['cust_dists']['left_wall'] = (room['front_wall']['position']['z'] + e['position']['z'] - f['z'] / 0x2)['toFixed'](0x1) * units,
        this['cust_dists']['right_wall'] = (room['back_wall']['position']['z'] - e['position']['z'] - f['z'] / 0x2)['toFixed'](0x1) * units,
        this['cust_dists']['back_wall'] = (room['right_wall']['position']['x'] - (e['position']['x'] + f['x'] / 0x2))['toFixed'](0x1) * units,
        this['cust_dists']['front_wall'] = (room['left_wall']['position']['x'] + (e['position']['x'] - f['x'] / 0x2))['toFixed'](0x1) * units),
        0x3 !== normalize_angle(e['rotation']['y']) && -0x3 !== normalize_angle(e['rotation']['y']) || (this['cust_dists']['left_wall'] = (room['right_wall']['position']['x'] - (e['position']['x'] + f['x'] / 0x2))['toFixed'](0x1) * units,
        this['cust_dists']['right_wall'] = (room['left_wall']['position']['x'] + (e['position']['x'] - f['x'] / 0x2))['toFixed'](0x1) * units,
        this['cust_dists']['back_wall'] = (room['back_wall']['position']['z'] - (e['position']['z'] + f['z'] / 0x2))['toFixed'](0x1) * units,
        this['cust_dists']['front_wall'] = (room['front_wall']['position']['z'] + (e['position']['z'] - f['z'] / 0x2))['toFixed'](0x1) * units),
        0x2 === normalize_angle(e['rotation']['y']) && (this['cust_dists']['left_wall'] = (room['back_wall']['position']['z'] - (e['position']['z'] + f['z'] / 0x2))['toFixed'](0x1) * units,
        this['cust_dists']['right_wall'] = (room['front_wall']['position']['z'] + (e['position']['z'] - f['z'] / 0x2))['toFixed'](0x1) * units,
        this['cust_dists']['back_wall'] = (room['left_wall']['position']['x'] + (e['position']['x'] - f['x'] / 0x2))['toFixed'](0x1) * units,
        this['cust_dists']['front_wall'] = (room['right_wall']['position']['x'] - (e['position']['x'] + f['x'] / 0x2))['toFixed'](0x1) * units),
        pp['interface']['root'] && pp['interface']['root']['update_sizes_from_wall'](copy_object(this['cust_dists'])),
        $('#info_panel\x20.left_wall_distance')['val'](this['cust_dists']['left_wall']),
        $('#info_panel\x20.right_wall_distance')['val'](this['cust_dists']['right_wall']),
        $('#info_panel\x20.floor_distance')['val'](this['cust_dists']['floor']),
        $('#info_panel\x20.ceiling_distance')['val'](this['cust_dists']['ceiling']),
        $('#info_panel\x20.back_wall_distance')['val'](this['cust_dists']['back_wall']),
        $('#info_panel\x20.front_wall_distance')['val'](this['cust_dists']['front_wall']));
    }
    ['build_from_wall_sizes'](e) {
        if (this['from_wall_sizes']['children']['length'] && this['reset_model'](this['from_wall_sizes']),
        !(this['params'] && !0x1 === this['params']['draggable'] || e || check_at_wall(this))) {
            let f, g;
            0x0 === normalize_angle(this['rotation']['y']) || 0x3 === normalize_angle(this['rotation']['y']) || -0x3 === normalize_angle(this['rotation']['y']) ? (f = new Sizes_obj({
                'width': this['cust_dists']['left_wall'] / units,
                'text': this['cust_dists']['left_wall'],
                'font_size': 0x32
            }),
            g = new Sizes_obj({
                'width': this['cust_dists']['back_wall'] / units,
                'text': this['cust_dists']['back_wall'],
                'font_size': 0x32
            }),
            f['position']['x'] = -this['cust_dists']['left_wall'] / units / 0x2 - this['box']['getSize'](vec3)['x'] / 0x2,
            f['position']['y'] = 0.1,
            f['rotation']['x'] = -Math['PI'] / 0x2,
            g['position']['z'] = -this['cust_dists']['back_wall'] / units / 0x2 - this['box']['getSize'](vec3)['z'] / 0x2) : (f = new Sizes_obj({
                'width': this['cust_dists']['left_wall'] / units,
                'text': this['cust_dists']['left_wall'],
                'font_size': 0x32
            }),
            g = new Sizes_obj({
                'width': this['cust_dists']['back_wall'] / units,
                'text': this['cust_dists']['back_wall'],
                'font_size': 0x32
            }),
            f['position']['x'] = -this['cust_dists']['left_wall'] / units / 0x2 - this['box']['getSize'](vec3)['z'] / 0x2,
            f['position']['y'] = 0.1,
            f['rotation']['x'] = -Math['PI'] / 0x2,
            g['position']['z'] = -this['cust_dists']['back_wall'] / units / 0x2 - this['box']['getSize'](vec3)['x'] / 0x2),
            g['position']['y'] = 0.1,
            g['rotation']['x'] = -Math['PI'] / 0x2,
            g['rotation']['z'] = Math['PI'] / 0x2,
            this['from_wall_sizes']['add'](f),
            this['from_wall_sizes']['add'](g);
        }
    }
    ['reset_model'](e) {
        var f = e, g, h = [];
        if ((f = e ? e : this)['traverse'](function(j) {
            f['uuid'] === j['uuid'] || 'Group' === j['type'] || j['no_reset'] || h['push'](j);
        }),
        h['length']) {
            for (g = h['length'] - 0x1; -0x1 < g; g--)
                h[g]['parent']['remove'](h[g]),
                h[g]['geometry'] && h[g]['geometry']['dispose'](),
                h[g]['material'] && !isArray(h[g]['material']) && h[g]['material']['map'] && h[g]['material']['map']['dispose'](),
                h['splice'](h['indexOf'](h[g]), 0x1);
        }
    }
    ['edges_mode']() {
        var e = this['type'], f;
        this['edges_mode_traverse'](this, 'Cabinet' !== e && 'Locker' !== e && 'Door' !== e),
        this['build_sizes'] && 'Cabinet' === e && this['build_sizes']();
    }
    ['edges_mode_traverse'](e, f) {
        e && e['traverse'](function(g) {
            if ('Mesh' === g['type'] && !0x0 !== g['size_box'] && 0x1 != g['no_edges'] && 'edges' != g['name'] && 'Sizes_obj' !== g['parent']['type']) {
                var h = new THREE['LineSegments'](new THREE['EdgesGeometry'](g['geometry'],0xa),ed_material);
                for (let k = h['geometry']['attributes']['position']['array']['length']; k--; )
                    isNaN(h['geometry']['attributes']['position']['array'][k]) && (h['geometry']['attributes']['position']['array'][k] = 0x0);
                h['name'] = 'edges',
                (f ? g['parent'] : g)['add'](h),
                g['material']['map'] && 'function' == typeof g['material']['map']['dispose'] && g['material']['map']['dispose'](),
                h['visible'] = g['visible'],
                f && (h['position']['copy'](g['position']),
                h['rotation']['copy'](g['rotation']),
                h['scale']['copy'](g['scale']));
                var j = g['userData'] && g['userData']['edgesModeType'] || ObjectType['Default'];
                g['material'] = getEdgesModeMaterial(j);
            }
        });
    }
    ['design_mode']() {
        'function' == typeof this['build'] && this['build']();
    }
    ['delete']() {
        this['reset_model']();
        for (let e = this['children']['length']; e--; )
            this['remove'](this['children'][e]);
        for (let f = room['active_objects']['length']; f--; )
            this['uuid'] === room['active_objects'][f]['uuid'] && (room['remove'](this),
            room['active_objects']['splice'](f, 0x1));
        for (let g = d_objects['length']; g--; )
            this['uuid'] == d_objects[g]['uuid'] && d_objects['splice'](g, 0x1);
        build_sizes_all(),
        sc['get_price'](),
        sc['remove_rulers'](this['params']['obj_id']),
        this['after_delete'](),
        pp['config']['on_demand_render'] && pp['render']();
    }
    ['del_spl']() {
        for (let e = this['children']['length']; e--; )
            this['remove'](this['children'][e]);
        for (let f = room['active_objects']['length']; f--; )
            this['uuid'] === room['active_objects'][f]['uuid'] && (room['remove'](this),
            room['active_objects']['splice'](f, 0x1));
        for (let g = d_objects['length']; g--; )
            this['uuid'] == d_objects[g]['uuid'] && d_objects['splice'](g, 0x1);
        dControls && 'function' == typeof dControls['hide_helper'] && dControls['hide_helper']();
    }
    ['rotate_left']() {
        var e = this;
        custom_settings['free_rotation'] ? (add_undo_action({
            'type': 'rotation',
            'object': e,
            'from': e['rotation']['clone'](),
            'to': new THREE['Vector3'](e['rotation']['x'],e['rotation']['y'] - THREE['Math']['degToRad'](0x1),e['rotation']['z'])['clone']()
        }),
        e['rotation']['y'] -= THREE['Math']['degToRad'](custom_settings['free_rotation_angle'])) : (add_undo_action({
            'type': 'rotation',
            'object': e,
            'from': e['rotation']['clone'](),
            'to': new THREE['Vector3'](e['rotation']['x'],e['rotation']['y'] - Math['PI'] / 0x2,e['rotation']['z'])['clone']()
        }),
        e['rotation']['y'] -= Math['PI'] / 0x2),
        e['updateMatrixWorld'](),
        e['box']['update'](),
        'function' == typeof this['check_tabletop_rebuild'] && this['check_tabletop_rebuild']() && sc['build_tabletop'](),
        this['check_inside_room'](),
        this['calculate_distances'](),
        this['build_from_wall_sizes']();
    }
    ['rotate_right']() {
        var e = this;
        custom_settings['free_rotation'] ? (add_undo_action({
            'type': 'rotation',
            'object': e,
            'from': e['rotation']['clone'](),
            'to': new THREE['Vector3'](e['rotation']['x'],e['rotation']['y'] + THREE['Math']['degToRad'](0x1),e['rotation']['z'])['clone']()
        }),
        e['rotation']['y'] += THREE['Math']['degToRad'](custom_settings['free_rotation_angle'])) : (add_undo_action({
            'type': 'rotation',
            'object': e,
            'from': e['rotation']['clone'](),
            'to': new THREE['Vector3'](e['rotation']['x'],e['rotation']['y'] + Math['PI'] / 0x2,e['rotation']['z'])['clone']()
        }),
        e['rotation']['y'] += Math['PI'] / 0x2),
        e['updateMatrixWorld'](),
        e['box']['update'](),
        'function' == typeof this['check_tabletop_rebuild'] && this['check_tabletop_rebuild']() && sc['build_tabletop'](),
        this['check_inside_room'](),
        this['calculate_distances'](),
        this['build_from_wall_sizes']();
    }
    ['check_inside_room']() {
        var e = this['box'], f;
        for (f of room['walls']['children'])
            'floor' !== f['name'] && 'ceiling' !== f['name'] && ('front_wall' === f['name'] ? e['min']['z'] < f['box']['max']['z'] && (this['position']['z'] = this['position']['z'] + (f['box']['max']['z'] - e['min']['z'])) : 'back_wall' === f['name'] ? e['max']['z'] > f['box']['min']['z'] && (this['position']['z'] = this['position']['z'] + (f['box']['min']['z'] - e['max']['z'])) : 'right_wall' === f['name'] ? e['max']['x'] > f['box']['min']['x'] && (this['position']['x'] = this['position']['x'] + (f['box']['min']['x'] - e['max']['x'])) : 'left_wall' === f['name'] && e['min']['x'] < f['box']['max']['x'] && (this['position']['x'] = this['position']['x'] + (f['box']['max']['x'] - e['min']['x'])));
    }
    ['find_around'](f, g, h, j, k) {
        var l = 0.05, m = void 0x0 === f && void 0x0 === g && void 0x0 === h && void 0x0 === j, g = (!g && this['box']['update'] && this['box']['update'](),
        (g || this['box'])['clone']()), k = (g['expandByScalar'](k || l),
        {
            'at_wall': !0x1,
            'at_floor': !0x1,
            'at_ceiling': !0x1,
            'front': [],
            'back': [],
            'left': [],
            'right': [],
            'top': [],
            'bottom': []
        }), m = (m && (this['userData']['around'] = k),
        h || this['get_forward']()), h = Math['abs'](Math['abs'](m['z']) - 0x1) < l ? 'z' : 'x', l, h, m;
        let p;
        return 'z' == h && 0x0 < m['z'] ? p = [k['front'], k['left'], k['back'], k['right']] : 'x' == h && 0x0 < m['x'] ? p = [k['right'], k['front'], k['left'], k['back']] : 'z' == h && m['z'] < 0x0 ? p = [k['back'], k['right'], k['front'], k['left']] : 'x' == h && m['x'] < 0x0 && (p = [k['left'], k['back'], k['right'], k['front']]),
        p && (h = {
            'at_wall': !(l = [[p[0x0], 'z', 0x1], [p[0x1], 'x', 0x1], [p[0x2], 'z', -0x1], [p[0x3], 'x', -0x1], [k['top'], 'y', 0x1], [k['bottom'], 'y', -0x1]]),
            'at_floor': !0x1,
            'at_ceiling': !0x1
        },
        (m = (q, u, v, w, x) => {
            for (var y of v)
                if (y !== q) {
                    y['box']['update'] && y['box']['update']();
                    var z = y['box'];
                    if (u['intersectsBox'](z)) {
                        let B = w[0x0][0x1]
                          , C = w[0x0][0x0]
                          , D = 0x0 < w[0x0][0x2] ? u['max'][B] - z['min'][B] : z['max'][B] - u['min'][B];
                        for (let E = 0x1; E < w['length']; E++) {
                            B = w[E][0x1];
                            var A = 0x0 < w[E][0x2] ? u['max'][B] - z['min'][B] : z['max'][B] - u['min'][B];
                            A < D && (C = w[E][0x0],
                            D = A);
                        }
                        C['push'](y),
                        x && y['is_wall'] && ('floor' === y['name'] ? x['at_floor'] = !0x0 : 'ceiling' === y['name'] ? x['at_ceiling'] = !0x0 : x['at_wall'] = !0x0);
                    }
                }
        }
        )(this, g, room['walls_objects'], l, h),
        f || m(this, g, j || d_objects, l),
        Object['assign'](k, h)),
        k;
    }
    ['set_snap_points']() {
        custom_settings['new_drag'] && (this['snap_points']['bl'] = make_cube(0x5, 0x5, 0x5),
        this['snap_points']['add'](this['snap_points']['bl']),
        this['snap_points']['bl']['position']['set'](-this['size_box']['userData']['obb']['halfSize']['x'], 0x0, -this['size_box']['userData']['obb']['halfSize']['z']),
        this['snap_points']['fl'] = make_cube(0x5, 0x5, 0x5),
        this['snap_points']['add'](this['snap_points']['fl']),
        this['snap_points']['fl']['position']['set'](-this['size_box']['userData']['obb']['halfSize']['x'], 0x0, this['size_box']['userData']['obb']['halfSize']['z']),
        this['snap_points']['br'] = make_cube(0x5, 0x5, 0x5),
        this['snap_points']['br']['position']['set'](this['size_box']['userData']['obb']['halfSize']['x'], 0x0, -this['size_box']['userData']['obb']['halfSize']['z']),
        this['snap_points']['add'](this['snap_points']['br']),
        this['snap_points']['fr'] = make_cube(0x5, 0x5, 0x5),
        this['snap_points']['fr']['position']['set'](this['size_box']['userData']['obb']['halfSize']['x'], 0x0, this['size_box']['userData']['obb']['halfSize']['z']),
        this['snap_points']['add'](this['snap_points']['fr']),
        this['snap_points']['tl'] = make_cube(0x5, 0x5, 0x5),
        this['snap_points']['add'](this['snap_points']['tl']),
        this['snap_points']['tl']['position']['set'](-this['size_box']['userData']['obb']['halfSize']['x'], 0x2 * this['size_box']['userData']['obb']['halfSize']['y'], -this['size_box']['userData']['obb']['halfSize']['z']),
        this['snap_points']['ftb'] = make_cube(0x5, 0x5, 0x5),
        this['snap_points']['add'](this['snap_points']['ftb']),
        this['snap_points']['ftb']['position']['set'](-this['size_box']['userData']['obb']['halfSize']['x'], 0x2 * this['size_box']['userData']['obb']['halfSize']['y'], this['size_box']['userData']['obb']['halfSize']['z']),
        this['snap_points']['tr'] = make_cube(0x5, 0x5, 0x5),
        this['snap_points']['tr']['position']['set'](this['size_box']['userData']['obb']['halfSize']['x'], 0x2 * this['size_box']['userData']['obb']['halfSize']['y'], -this['size_box']['userData']['obb']['halfSize']['z']),
        this['snap_points']['add'](this['snap_points']['tr']),
        this['snap_points']['ft'] = make_cube(0x5, 0x5, 0x5),
        this['snap_points']['ft']['position']['set'](this['size_box']['userData']['obb']['halfSize']['x'], 0x2 * this['size_box']['userData']['obb']['halfSize']['y'], this['size_box']['userData']['obb']['halfSize']['z']),
        this['snap_points']['add'](this['snap_points']['ft']),
        this['userData']['points_list']['push'](this['snap_points']['bl']),
        this['userData']['points_list']['push'](this['snap_points']['br']),
        this['userData']['points_list']['push'](this['snap_points']['fr']),
        this['userData']['points_list']['push'](this['snap_points']['fl']),
        this['userData']['points_list']['push'](this['snap_points']['tl']),
        this['userData']['points_list']['push'](this['snap_points']['ftb']),
        this['userData']['points_list']['push'](this['snap_points']['tr']),
        this['userData']['points_list']['push'](this['snap_points']['ft']),
        this['hide_snap_points']());
    }
    ['move'](f) {
        var g = room['active_objects'];
        let j = f['y'] = 0x0;
        var k = box3['setFromObject'](this)['clone'](), m = this['position']['clone'](), q = new THREE['Vector3']()['subVectors'](f, m)['normalize'](), v = (this['box']['update'](),
        k['getSize'](new THREE['Vector3']())), w = new THREE['Box3']()['setFromCenterAndSize'](f, this['box']['getSize'](v)), x = w['clone']()['expandByScalar'](0xf), y = ['x', 'y', 'z'], z = {
            'x': [],
            'y': [],
            'z': []
        }, m = f['clone'](), A;
        for (let E = g['length']; E--; ) {
            var B = g[E];
            if ('Mesh' != B['type'] && (B['uuid'] != this['uuid'] && 0x0 !== B['userData']['intersection_test'] && (B['box']['update'](),
            x['intersectsBox'](B['box'])))) {
                for (let F = y['length']; F--; ) {
                    var C = y[F];
                    z[C]['push']({
                        'pos': B['box']['min'][C] - v[C] / 0x2,
                        'dist': Math['abs'](w['max'][C] - B['box']['min'][C])
                    }),
                    z[C]['push']({
                        'pos': B['box']['max'][C] - v[C] / 0x2,
                        'dist': Math['abs'](w['max'][C] - B['box']['max'][C])
                    }),
                    z[C]['push']({
                        'pos': B['box']['max'][C] + v[C] / 0x2,
                        'dist': Math['abs'](w['min'][C] - B['box']['max'][C])
                    }),
                    z[C]['push']({
                        'pos': B['box']['min'][C] + v[C] / 0x2,
                        'dist': Math['abs'](w['min'][C] - B['box']['min'][C])
                    });
                }
                w['clone']()['expandByScalar'](-0xa)['intersectsBox'](B['box']) && (j = 0x1);
            }
        }
        for (let G = y['length']; G--; ) {
            z[y[G]]['sort'](function(H, I) {
                return H['dist'] - I['dist'];
            });
        }
        for (let H = y['length']; H--; ) {
            var D = y[H];
            z[D][0x0] && z[D][0x0]['dist'] < 0xa && (f[D] = z[D][0x0]['pos']);
        }
        0x0 === j ? (this['position']['copy'](f),
        wrong_place_box['visible'] = !0x1) : (wrong_place_box['visible'] = !0x0,
        wrong_place_box['userData']['obj_uuid'] != this['uuid'] && (wrong_place_box['set_new_size'](v['x'], v['y'], v['z']),
        wrong_place_box['userData']['obj_uuid'] = this['uuid']),
        wrong_place_box['position']['copy'](m));
    }
    ['move2'](q, A) {
        if (!this['userData']['interaction']['movement_locked'] && custom_settings['new_drag']) {
            var I = d_objects, J = this['box']['getSize'](new THREE['Vector3']()), K = this['position']['clone'](), L = (q['x'] = clamp(q['x'], J['x'] / 0x2, room['params']['width'] / units - J['x'] / 0x2),
            q['z'] = clamp(q['z'], J['z'] / 0x2, room['params']['depth'] / units - J['z'] / 0x2),
            new THREE['Vector3']()['subVectors'](q['clone'](), K)), N = L['clone']()['normalize'](), O = 0x0, K = (q['z'] < 0.01 && (L['z'] = 0x0),
            q['y'] < 0.01 && (L['y'] = 0x0),
            q['x'] < 0.01 && (L['x'] = 0x0),
            this['box']['update'](),
            K['clone']()['add'](L)), Q = (K['y'] += J['y'] / 0x2,
            {
                'x': K['x'],
                'y': K['y'] - J['y'] / 0x2,
                'z': K['z']
            }), U = {
                'x': K['x'],
                'y': K['y'],
                'z': K['z']
            }, W, Z = new THREE['Box3']()['setFromCenterAndSize'](K, J)['clone']()['expandByScalar'](0x1e), a0 = [], a1 = {
                'x': 0x0,
                'y': 0x0,
                'z': 0x0
            };
            for (let ar = I['length']; ar--; ) {
                var a2 = I[ar];
                'Mesh' != a2['type'] && a2['uuid'] != this['uuid'] && 0x0 !== a2['userData']['intersection_test'] && (a2['box']['update'](),
                Z['intersectsBox'](a2['box'])) && a0['push'](a2);
            }
            var a3 = []
              , a4 = []
              , a5 = [];
            let am = scene['userData']['grid']['userData']['by_axis']['x']['concat'](scene['userData']['guides']['userData']['by_axis']['x']);
            for (let as = am['length']; as--; )
                Z['intersectsBox'](am[as]['box']) && a3['push'](am[as]);
            for (let at = (am = scene['userData']['grid']['userData']['by_axis']['z']['concat'](scene['userData']['guides']['userData']['by_axis']['z']))['length']; at--; )
                Z['intersectsBox'](am[at]['box']) && a4['push'](am[at]);
            for (let au = (am = scene['userData']['grid']['userData']['by_axis']['y']['concat'](scene['userData']['guides']['userData']['by_axis']['y']))['length']; au--; )
                Z['intersectsBox'](am[au]['box']) && a5['push'](am[au]);
            var K = this['matrixWorld']['clone']()
              , a6 = (K['setPosition'](q['clone']()),
            this['userData']['obb']['copy'](this['size_box']['userData']['obb']),
            this['userData']['obb']['applyMatrix4'](K),
            0x0)
              , J = new THREE['Vector3']()
              , a7 = (this['write_points'](L),
            [])
              , a8 = this['userData']['points']
              , a9 = (0x0 < a0['length'] && this['show_snap_points'](),
            [])
              , aa = []
              , ab = [];
            for (let av = a8['length']; av--; ) {
                a8[av]['pos']['x'] > U['x'] && (U['x'] = a8[av]['pos']['x']),
                a8[av]['pos']['x'] < Q['x'] && (Q['x'] = a8[av]['pos']['x']),
                a8[av]['pos']['y'] > U['y'] && (U['y'] = a8[av]['pos']['y']),
                a8[av]['pos']['y'] < Q['x'] && (Q['y'] = a8[av]['pos']['y']),
                a8[av]['pos']['z'] > U['z'] && (U['z'] = a8[av]['pos']['z']),
                a8[av]['pos']['z'] < Q['z'] && (Q['z'] = a8[av]['pos']['z']);
                for (let aw = a3['length']; aw--; ) {
                    var ac = a8[av]['pos']['x'] - a3[aw]['position']['x'];
                    ac <= 0xa && -0xa <= ac && a9['push']({
                        'dist': ac
                    });
                }
                for (let ax = a4['length']; ax--; ) {
                    var ad = a8[av]['pos']['z'] - a4[ax]['position']['z'];
                    ad <= 0xa && -0xa <= ad && aa['push']({
                        'dist': ad
                    });
                }
                for (let ay = a5['length']; ay--; ) {
                    var ae = a8[av]['pos']['y'] - a5[ay]['position']['y'];
                    ae <= 0xa && -0xa <= ae && ab['push']({
                        'dist': ae
                    });
                }
            }
            this['userData']['min'] = Q,
            this['userData']['max'] = U;
            var K = q['clone']();
            a9['length'] && (a9['sort'](function(az, aA) {
                return aA['dist'] - az['dist'];
            }),
            K['x'] = K['x'] - a9[0x0]['dist']),
            aa['length'] && (aa['sort'](function(az, aA) {
                return aA['dist'] - az['dist'];
            }),
            K['z'] = K['z'] - aa[0x0]['dist']),
            ab['length'] && (ab['sort'](function(az, aA) {
                return aA['dist'] - az['dist'];
            }),
            K['y'] = K['y'] - ab[0x0]['dist']);
            for (let az = 0x0; az < a0['length']; az++) {
                var af = a0[az];
                af['write_points'](),
                af['show_snap_points']();
                for (let aA = a8['length']; aA--; )
                    for (let aB = af['userData']['points']['length']; aB--; ) {
                        var ag = new THREE['Vector3'](), ah = a8[aA]['pos']['distanceTo'](af['userData']['points'][aB]['pos']), ai, aj, ak, al;
                        ah <= 0xa && (ai = new THREE['Vector3']()['subVectors'](af['userData']['points'][aB]['pos'], a8[aA]['pos']),
                        aj = af['rotation']['y'] + af['userData']['points'][aB]['point']['rotation']['y'],
                        ak = this['rotation']['y'] + a8[aA]['point']['rotation']['y'],
                        a7['push']({
                            'dist': ah,
                            'diff': ai,
                            'rot_diff': ak - aj,
                            'point': af['userData']['points'][aB]['pos'],
                            'cab_point': a8[aA]['pos'],
                            'cab': a0[az]
                        }));
                    }
            }
            a7['length'] ? (a7['sort'](function(aC, aD) {
                return aD['dist'] - aC['dist'];
            }),
            J['addVectors'](q['clone'](), a7[0x0]['diff'])) : (J['x'] = K['x'],
            J['z'] = K['z'],
            J['y'] = K['y']),
            A && (A['shiftKey'] && (J['x'] = 0x5 * Math['round'](J['x'] / 0x5),
            J['y'] = 0x5 * Math['round'](J['y'] / 0x5),
            J['z'] = 0x5 * Math['round'](J['z'] / 0x5)),
            0x1 == pp_keyboard['x'] && (J['y'] = this['position']['y'],
            J['z'] = this['position']['z']),
            0x1 == pp_keyboard['y'] && (J['x'] = this['position']['x'],
            J['z'] = this['position']['z']),
            0x1 == pp_keyboard['z']) && (J['x'] = this['position']['x'],
            J['y'] = this['position']['y']),
            'bottom' == this['params']['cabinet_group'] && (J['y'] = 0x0),
            this['params']['spec'] && 'bottom' == this['params']['spec']['group'] && (J['y'] = 0x0);
            var L = {
                'x': Math['abs'](J['x'] - Q['x']),
                'y': Math['abs'](J['y'] - Q['y']),
                'z': Math['abs'](J['z'] - Q['z'])
            };
            let an, ao = U['x'] - J['x'], ap = U['y'] - J['y'], aq = U['z'] - J['z'];
            J['x'] = clamp(J['x'], L['x'], room['params']['width'] / units - ao),
            J['z'] = clamp(J['z'], L['z'], room['params']['depth'] / units - aq),
            this['position']['copy'](J),
            this['update_rulers']();
        }
    }
    ['write_points'](e=!0x1) {
        this['updateMatrixWorld'](!0x0),
        this['userData']['points'] = [];
        for (let g = this['userData']['points_list']['length']; g--; ) {
            var f = new THREE['Vector3']()
              , f = this['userData']['points_list'][g]['getWorldPosition'](f);
            e ? this['userData']['points']['push']({
                'point': this['userData']['points_list'][g],
                'pos': f['add'](e)
            }) : this['userData']['points']['push']({
                'point': this['userData']['points_list'][g],
                'pos': f
            });
        }
    }
    ['show_snap_points']() {
        this['snap_points']['visible'] = !0x1;
    }
    ['hide_snap_points']() {
        this['snap_points']['visible'] = !0x1;
    }
    ['set_intersection_check'](e) {
        this['userData']['interaction']['check_intersection'] = e ? 0x1 : 0x0,
        check_overlap();
    }
    ['get_intersection_check']() {
        return 0x1 == this['userData']['interaction']['check_intersection'];
    }
    ['show_wrong_box']() {
        var e, f;
        this['box'] && (0x0 < this['wrong_box']['children']['length'] && this['wrong_box']['remove'](this['wrong_box']['children'][0x0]),
        e = this['box']['getSize'](new THREE['Vector3']()),
        (f = make_edges(e['x'] + 0x1, e['y'] + 0x1, e['z'] + 0x1))['position']['y'] = e['y'] / 0x2,
        f['rotation']['y'] = this['rotation']['y'],
        this['wrong_box']['add'](f),
        this['wrong_box']['visible'] = !0x0);
    }
    ['hide_wrong_box']() {
        this['wrong_box']['visible'] = !0x1;
    }
    ['select']() {
        this['size_box']['visible'] = !0x0;
    }
    ['unselect']() {
        this['size_box']['visible'] = !0x1;
    }
    ['update_rulers']() {
        sc['update_rulers'](this['params']['obj_id']);
    }
    ['check_fill_enabled']() {
        return !0x1;
    }
    ['toggleResizeMode'](e, f, g) {
        var e;
        if (e = null == e ? !this['resizable'] : e)
            return this['resizable'] ? void 0x0 : (e = _['get'](this['userData']['params'] || this['params'], 'resizable', {}),
            f && (e['locks'] = f),
            g && (e['minmax'] = g),
            this['resizable'] = new Resizable(this),
            e['locks'] && this['resizable']['lock'](e['locks']),
            e['minmax'] && this['resizable']['minmax'](e['minmax']),
            this['resizable']['attachControls'](),
            void this['resizable']['setActive'](!0x0));
        this['resizable'] && (this['resizable']['destroy'](),
        this['resizable'] = null);
    }
    ['hover_on']() {}
    ['hover_off']() {}
}
function set_light(e) {
    var f;
    e['userData']['has_light'] || (e['userData']['has_light'] = !0x0,
    (f = new THREE['SpotLight'](e['params']['lighting']['color'],e['params']['lighting']['intensity'],spot_params['distance'],spot_params['angle'],spot_params['penumbra'],spot_params['decay']))['position']['set'](0x0, 0x32, 0x0),
    f['target']['position']['set'](0x0, 0x0, 0x0),
    e['add'](f['target']),
    e['add'](f),
    e['userData']['light'] = f);
}
let scene_controller = {
    'generate_obj_id': function() {
        return Math['random']()['toString'](0x24)['substr'](0x2, 0x9);
    },
    'get_object_by_obj_id'(f) {
        for (let g = room['active_objects']['length']; g--; )
            if (room['active_objects'][g]['params']['obj_id'] == f)
                return room['active_objects'][g];
        return null;
    },
    'add_object': function(f, g, h) {
        g['obj_id'] || (g['obj_id'] = sc['generate_obj_id']()),
        void 0x0 === h && (h = !0x0);
        let i;
        return 'module' === f && (i = new Module(g)),
        'cabinet' === f && (i = new Cabinet_new(g)),
        'drag_group' === f && (i = new DragGroup(g)),
        'cabinet_cn' === f && (i = new CabinetN(g)),
        'draggable' === f && (i = new Draggable(g)),
        'model' === f && (i = new Model_new(g),
        h || 'not_loaded' != i['model_loaded'] || i['load_model']()),
        'Wall_panel' === f && (i = new Wall_panel(g)),
        'decoration' !== f && 'facade' !== f || (i = new Decoration(g)),
        'shelve' === f && (i = new Shelve_new(g)),
        'bardesk' === f && (i = new Bardesk(g)),
        'shaft' === f && (i = new Shaft(g),
        room['walls_objects']['push'](i)),
        'washer' === f && (i = new Washer(g)),
        (i = 'furniture' === f ? new CabinetFurniture(g) : i)['params'] && (i['params']['object_type'] = f),
        room['active_objects']['push'](i),
        d_objects['push'](i),
        room['add'](i),
        sc['assign_numbers'](),
        h ? (sc['select_object'](i),
        $('.interface')['css']('pointer-events', 'none'),
        $('.left_subpanel.active')['css']({
            'opacity': 0.1
        }),
        dControls['clear_selected'](),
        dControls['set_selected'](i)) : setTimeout( () => {
            0x1 != constructor_settings['tabletop_v2'] && !constructor_settings['core_v2'] || 'cabinet' != f && 'module' !== f || !i['check_tabletop_rebuild']() || sc['build_tabletop']();
        }
        , 0x64),
        sc['get_price'](),
        i;
    },
    'remove_object': async function(f, g) {
        let h = !0x0;
        if (g = g || f['temp_type']['toLowerCase'](),
        pp['events']['interaction']['before_delete']) {
            var i = pp['events']['interaction']['before_delete'](f, g);
            if (i && 'function' == typeof i['then'])
                try {
                    h = await i;
                } catch (j) {
                    h = !0x1;
                }
            else
                h = i;
        }
        h && (f instanceof CabinetN && (g = 'cabinet_cn'),
        add_undo_action({
            'type': 'delete',
            'obj_type': g,
            'object': f,
            'params': f['params'],
            'position': f['position'],
            'rotation': f['rotation']
        }),
        f['delete'](),
        dControls && 'function' == typeof dControls['hide_helper'] && dControls['hide_helper'](),
        sc['select_object'](null),
        sc['assign_numbers'](),
        check_overlap());
    },
    'select_object': function(f) {
        active_el && active_el['resizable'] && active_el !== f && active_el['toggleResizeMode'](!0x1),
        active_el = f,
        pp['interface']['root'] && pp['interface']['root']['set_selected'](active_el),
        null === f && (selection_box['visible'] = !0x1);
    },
    'get_active': function() {
        return active_el;
    },
    'get_specs_cart'(f) {
        let g = pp['events']?.['cabinet']?.['before_create_spec_item']
          , h = pp['events']?.['cabinet']?.['after_create_spec_item'];
        var j = 'item', k, l, m;
        (f = f || {
            'all': {},
            'sum': {},
            'sum_arr': [],
            'aggr_funcs': {}
        })['all'][j] || (f['all'][j] = []),
        f['sum'][j] || (f['sum'][j] = {}),
        f['aggr_funcs'][j] || (f['aggr_funcs'][j] = module_utils['spec_counters']['simple_price_counter']);
        for (k of cart?.['accessories'] || [])
            u(f, k);
        for (l of cart?.['custom_items'] || []) {
            if (g) {
                if (!0x1 === g('cart', l, f))
                    continue;
            }
            var p = module_utils['get_price_mod']('acc', null), p = {
                'type': 'item',
                'price_type': 'p',
                'name': l['name'],
                'code': l['code'],
                'count': parse_int(l['count']),
                'price': l['price'] * p,
                'sum_key': 'custom_' + l['name'] + '_' + l['code'] + '_p'
            }, q;
            if (h) {
                if (!0x1 === h('cart', l, f, p))
                    continue;
            }
            module_utils['add_spec_to_context'](f, p);
        }
        return f;
        function u(v, w) {
            var x = w['id'], y = w['count'], z;
            if (g && !0x1 === g('cart', w, v))
                return;
            var x = accsessories_data['get_item'](x);
            if (x) {
                var A = module_utils['get_price_mod']('acc', null, x['category']), B;
                if (x['count'] = parse_int(y),
                x['price_type'] = 'p',
                x['type'] = 'item',
                x['obj_id'] = w['obj_id'] || null,
                x['price'] = parse_num(x['price_per_piece']) * A,
                x['sum_key'] = x['id'] + '_' + x['code'] + '_' + x['price_type'],
                x['obj_id'] && (x['sum_key'] += '_' + x['obj_id'],
                x['skip_merge'] = !0x0),
                h) {
                    if (!0x1 === h('cart', w, v, x))
                        return;
                }
                module_utils['add_spec_to_context'](v, x);
            }
        }
    },
    'get_specs_tabletop'(j) {
        var k = pp['events']?.['cabinet']?.['before_create_spec_item'], q = pp['events']?.['cabinet']?.['after_create_spec_item'], v = 'tabletop', w = ((j = j || {
            'all': {},
            'sum': {},
            'sum_arr': [],
            'aggr_funcs': {}
        })['all'][v] || (j['all'][v] = []),
        j['sum'][v] || (j['sum'][v] = {}),
        j['aggr_funcs'][v] || (j['aggr_funcs'][v] = module_utils['spec_counters']['price_counter']),
        module_utils['get_price_mod']('tabletop')), x;
        for (x of pp['info']['tabletop']['desc'] || []) {
            var y = pp['libs']['tabletop']['find_item'](x['info']['materialId']), z;
            if (k) {
                if (!0x1 === k(v, x, j))
                    continue;
            }
            if (y) {
                var A = y['params']['variants'][x['info']['variantId']];
                if (A) {
                    var B = parse_int(x['info']['size']['x']), C = parse_int(x['info']['size']['z']), D = parse_int(A['width']), E = parse_int(A['height']), F = A['price_mode'], G = A['price_type'], H = A['price_acc_id'], I, I;
                    let L = parse_num(A['price']);
                    'c' === F && (I = accsessories_data['get_item_by_code'](A['code']),
                    L = parse_num(I?.['price_per_piece'])),
                    'a' === F && (I = accsessories_data['get_item'](H),
                    L = parse_num(I?.['price_per_piece']));
                    var J, F = {
                        'type': v,
                        'sum_key': x['info']['materialId'] + '_' + x['info']['variantId'] + '_' + G,
                        'name': A['name'] || y['name'] || '',
                        'code': A['code'] || y['code'] || '',
                        'price_type': G,
                        'price': L * w,
                        'width': D,
                        'height': E,
                        'size_x': B,
                        'size_z': C
                    }, K;
                    if (q) {
                        if (!0x1 === q(v, x, j, F))
                            continue;
                    }
                    module_utils['add_spec_to_context'](j, F);
                }
            }
        }
        return j;
    },
    'get_specs_tabletop_cuts'(k) {
        var q = pp['events']?.['cabinet']?.['before_create_spec_item'], w = pp['events']?.['cabinet']?.['after_create_spec_item'], x = 'tabletop_cuts', y;
        (k = k || {
            'all': {},
            'sum': {},
            'sum_arr': [],
            'aggr_funcs': {}
        })['all'][x] || (k['all'][x] = []),
        k['sum'][x] || (k['sum'][x] = {}),
        k['aggr_funcs'][x] || (k['aggr_funcs'][x] = module_utils['spec_counters']['simple_counter']);
        for (y of pp['info']['tabletop']['desc'] || []) {
            var z = pp['libs']['tabletop']['find_item'](y['info']['materialId']);
            if (z) {
                var A = z['params']['variants'][y['info']['variantId']];
                if (A) {
                    var B = parse_int(y['info']['size']['x'])
                      , C = parse_int(y['info']['size']['z'])
                      , D = parse_int(A['width'])
                      , E = parse_int(A['height'])
                      , F = 'p'
                      , G = y['info']['groupObject']?.['userData']['parts']['tabletop'][0x0]['userData']['params']['spec']['cuts']
                      , H = G?.['connects'] ? [...G['connects']] : []
                      , I = parse_num(G?.['len']);
                    if (!H['length'] && I && B / I < 0x3e8) {
                        if (I < B)
                            return;
                        var J = Math['floor'](B / I);
                        for (let Q = 0x1; Q < J + 0x1; Q++)
                            H['push'](Q * I / units);
                    }
                    for (let R = 0x0; R < H['length'] + 0x1; R++) {
                        var K = H[R - 0x1] || 0x0, L = R !== H['length'] ? H[R] : B / units, L = Math['floor']((L - K) * units), N;
                        if (!(L <= 0x0)) {
                            if (q) {
                                if (!0x1 === q(x, y, k))
                                    continue;
                            }
                            var O, K = {
                                'type': x,
                                'sum_key': y['info']['materialId'] + '_' + y['info']['variantId'] + '_' + L + '_' + C,
                                'name': A['name'] || z['name'] || '',
                                'code': A['code'] || z['code'] || '',
                                'price_type': F,
                                'price': 0x0,
                                'width': I,
                                'height': E,
                                'size_x': L,
                                'size_z': C
                            }, P;
                            if (w) {
                                if (!0x1 === w(x, y, k, K))
                                    continue;
                            }
                            module_utils['add_spec_to_context'](k, K);
                        }
                    }
                }
            }
        }
        return k;
    },
    'get_specs_cokol'(f, g=!0x1) {
        var h = pp['events']?.['cabinet']?.['before_create_spec_item'], j = pp['events']?.['cabinet']?.['after_create_spec_item'], k = g ? 'cokol_top' : 'cokol', q = ((f = f || {
            'all': {},
            'sum': {},
            'sum_arr': [],
            'aggr_funcs': {}
        })['all'][k] || (f['all'][k] = []),
        f['sum'][k] || (f['sum'][k] = {}),
        f['aggr_funcs'][k] || (f['aggr_funcs'][k] = module_utils['spec_counters']['price_counter']),
        module_utils['get_price_mod'](k)), v, w;
        for (w of sc['find_cokol_groups'](g)) {
            var x = pp['libs'][k]['find_item'](w['info']['itemId']), y;
            if (h) {
                if (!0x1 === h(k, w, f))
                    continue;
            }
            if (x) {
                var z = parse_int(w['info']['width'])
                  , A = parse_int(x['params']['height'])
                  , B = parse_int(x['params']['width'])
                  , C = parse_int(x['params']['height']);
                let F = 0x0
                  , G = 'm'
                  , H = 'm'
                  , I = 0x0;
                var D = x['params']['models']?.[w['info']['cokolType']], D, D, D = (D && (F = parse_num(D['price']),
                G = D['price_type'],
                H = D['price_mode'],
                I = D['acc_id']),
                'c' === H && (D = accsessories_data['get_item_by_code'](x['code']),
                F = parse_num(D?.['price_per_piece'])),
                'a' === H && (D = accsessories_data['get_item'](I),
                F = parse_num(D?.['price_per_piece'])),
                w['info']['itemId'] + '_' + w['info']['cokolType'] + '_' + G), D = {
                    'type': k,
                    'sum_key': D,
                    'name': x['name'] || '',
                    'code': x['code'] || '',
                    'price': F * q,
                    'price_type': G,
                    'width': B,
                    'height': C,
                    'size_x': z,
                    'size_z': A
                }, E;
                if (j) {
                    if (!0x1 === j(k, w, f, D))
                        continue;
                }
                module_utils['add_spec_to_context'](f, D);
            }
        }
        return f;
    },
    'get_specs_bort'(h) {
        var j = pp['events']?.['cabinet']?.['before_create_spec_item'], k = pp['events']?.['cabinet']?.['after_create_spec_item'], q = 'bort', v = ((h = h || {
            'all': {},
            'sum': {},
            'sum_arr': [],
            'aggr_funcs': {}
        })['all'][q] || (h['all'][q] = []),
        h['sum'][q] || (h['sum'][q] = {}),
        h['aggr_funcs'][q] || (h['aggr_funcs'][q] = module_utils['spec_counters']['price_counter']),
        module_utils['get_price_mod'](q)), w;
        for (w of pp['info']['tabletop']['bort_desc'] || []) {
            var x = pp['libs']['bort']['find_item'](w['info']['materialId']), y;
            if (j) {
                if (!0x1 === j(q, w, h))
                    continue;
            }
            if (x) {
                var z = parse_int(w['info']['size']['x']), A = parse_int(w['info']['size']['y']), B = parse_int(x['params']?.['item_width']), C = parse_int(x['params']?.['height']), D = x['price_mode'] || (x['price_acc'] ? 'c' : 'm'), E = x['price_type'] || 'p', F = x['price_acc'] || 0x0, G, G;
                let J = parse_num(x['price']);
                'c' === D && (G = accsessories_data['get_item_by_code'](x['code']),
                J = parse_num(G?.['price_per_piece'])),
                'a' === D && (G = accsessories_data['get_item'](F),
                J = parse_num(G?.['price_per_piece']));
                var H, D = {
                    'type': q,
                    'sum_key': w['info']['materialId'] + '_' + E,
                    'name': x['name'] || '',
                    'code': x['code'] || '',
                    'price_type': E,
                    'price': J * v,
                    'width': B,
                    'height': C,
                    'size_x': z,
                    'size_z': A
                }, I;
                if (k) {
                    if (!0x1 === k(q, w, h, D))
                        continue;
                }
                module_utils['add_spec_to_context'](h, D);
            }
        }
        return h;
    },
    'get_specs_cornice'(f) {
        var g = 'cornice';
        return (f = f || {
            'all': {},
            'sum': {},
            'sum_arr': [],
            'aggr_funcs': {}
        })['all'][g] || (f['all'][g] = []),
        f['sum'][g] || (f['sum'][g] = {}),
        f['aggr_funcs'][g] || (f['aggr_funcs'][g] = module_utils['spec_counters']['simple_price_width_counter']),
        f;
    },
    'get_specs_module'(f) {
        f = f || {
            'all': {},
            'sum': {},
            'sum_arr': [],
            'aggr_funcs': {}
        };
        for (let h = 0x0; h < room['active_objects']['length']; h++) {
            var g = room['active_objects'][h];
            'function' == typeof g['_get_specs'] && g['_get_specs'](f);
        }
    },
    'get_specs_v2'(f) {
        var g = pp['events']?.['cabinet']?.['get_specs_start'], h = pp['events']?.['cabinet']?.['get_specs_end'], j = pp['events']?.['cabinet']?.['before_apply_specs_aggr'], k;
        if (g && !0x1 === g(f))
            return f;
        if (f = f || {
            'all': {},
            'sum': {},
            'sum_arr': [],
            'aggr_funcs': {}
        },
        !view_mode) {
            sc['get_specs_module'](f),
            sc['get_specs_tabletop'](f),
            sc['get_specs_tabletop_cuts'](f),
            sc['get_specs_bort'](f),
            sc['get_specs_cokol'](f),
            sc['get_specs_cokol'](f, !0x0),
            sc['get_specs_cornice'](f);
            var g = sc['get_specs_cart'](), l, m;
            if (module_utils['merge_specs'](f, g, !0x1, !0x0),
            f['cart_ctx'] = g,
            module_utils['clean_specs_empty_keys'](f),
            f['sum_arr']['sort']( (n, p) => n['type'] < p['type'] ? -0x1 : p['type'] < n['type'] ? 0x1 : 0x0),
            module_utils['init_spec_ctx_aggr'](f),
            j) {
                if (!0x1 === j(f))
                    return f;
            }
            if (module_utils['apply_specs_aggr'](f),
            h) {
                if (!0x1 === h(f))
                    ;
            }
        }
        return f;
    },
    'get_objects_info': function() {
        if (constructor_settings['core_v2'])
            return sc['get_specs_v2']();
        var f = [], g;
        for (let h = 0x0; h < room['active_objects']['length']; h++) {
            'function' == typeof room['active_objects'][h]['get_specs'] && (g = {
                'name': '',
                'icon': void 0x0 !== room['active_objects'][h]['params']['icon'] ? room['active_objects'][h]['params']['icon'] : '',
                'code': '',
                'data': room['active_objects'][h]['price_description'],
                'total': room['active_objects'][h]['get_price']()
            },
            'Cabinet' === room['active_objects'][h]['type'] && mod_lib['items'][room['active_objects'][h]['params']['id']] && (g['icon'] = mod_lib['items'][room['active_objects'][h]['params']['id']]['icon']),
            room['active_objects'][h]['params']['code'] && (g['code'] = room['active_objects'][h]['params']['code']),
            g['name'] = room['active_objects'][h]['params']['name'],
            'CabinetN' === room['active_objects'][h]['temp_type'] && catalog_lib['items'][room['active_objects'][h]['params']['id']] && (g['icon'] = catalog_lib['items'][room['active_objects'][h]['params']['id']]['icon'],
            g['name'] = room['active_objects'][h]['userData']['params']['name']),
            g['icon'] || (g['icon'] = '/common_assets/images/no_image.png'),
            room['active_objects'][h]['pdf_number'] && (g['pdf_number'] = room['active_objects'][h]['pdf_number']),
            f['push'](g));
        }
        return f;
    },
    'get_specs': function(f) {
        if (!global_options['no_recalc']) {
            if (constructor_settings['core_v2'])
                return sc['get_specs_v2']();
            let h = copy_object(specs_result)
              , j = 0x0
              , k = 0x0;
            for (let l = room['active_objects']['length'] - 0x1; 0x0 <= l; l--) {
                if (room['active_objects'][l]['params'] && 'Cabinet' == room['active_objects'][l]['params']['type'])
                    switch (room['active_objects'][l]['params']['cabinet']['type']) {
                    case 'corner':
                        j += 0x1;
                        break;
                    case 'corner_straight':
                        k += 0x1;
                        break;
                    }
                if ('function' == typeof room['active_objects'][l]['get_specs']) {
                    let m = room['active_objects'][l]['get_specs']();
                    Object['keys'](m)['forEach'](function(n) {
                        switch (n) {
                        case 'facades':
                            Object['keys'](m[n])['forEach'](function(p) {
                                let q = m[n][p];
                                Object['keys'](q)['forEach'](function(r) {
                                    var u = q[r];
                                    for (let v = 0x0; v < u['length']; v++)
                                        h[n][p][r] || (h[n][p][r] = []),
                                        h[n][p][r]['push'](u[v]),
                                        h['facades_edge']['push']({
                                            'id': u[v]['id'],
                                            'm2': 0x0,
                                            'pm': 0x2 * (u[v]['width'] + u[v]['height']) / 0x3e8
                                        });
                                });
                            });
                            break;
                        case 'cornice':
                            Object['keys'](m[n])['forEach'](p => {
                                for (let q = 0x0; q < m[n][p]['length']; q++)
                                    h[n][p]['push'](m[n][p][q]);
                            }
                            );
                            break;
                        default:
                            for (let p = 0x0; p < m[n]['length']; p++)
                                h[n]['push'](m[n][p]);
                        }
                    });
                }
            }
            if (constructor_settings['tabletop_v2']) {
                var g = global_data['tabletop']['items'];
                for (let n = g['length']; n--; )
                    h['tabletop_v2']['push']({
                        'id': g[n]['params']['id'],
                        'pm': Math['max'](g[n]['params']['width'], g[n]['params']['depth'])
                    });
            }
            return f ? convert_specs(h) : (update_materials_panel(),
            h);
        }
    },
    'get_price': function() {
        if (!global_options['no_recalc'] && 0x1 == constructor_settings['price_enabled']) {
            let k = 0x0
              , l = 0x0;
            var f = 0x0, g = 0x0, h = 0x0, j;
            for (let n = room['active_objects']['length'] - 0x1; 0x0 <= n; n--) {
                'function' == typeof room['active_objects'][n]['get_price_specs'] && (j = parseFloat(room['active_objects'][n]['get_price']()),
                k += j,
                l += j);
            }
            let m = sc['get_specs'](!0x0);
            if (m['cornice']) {
                global_data['cornice'] = [];
                let p = cornice_lib['items'][project_settings['selected_cornice_model']];
                Object['keys'](m['cornice']['common'])['forEach'](function(q) {
                    var u = materials_lib['get_item'](q)
                      , v = materials_lib['get_category'](u['category']);
                    p['price_hash'];
                    let w = p['price_hash']['c_default_price']
                      , x = (0x0 != v['parent'] && p['cat_price_hash'][v['parent']] && (w = p['cat_price_hash'][v['parent']]),
                    0x0 != u['category'] && p['cat_price_hash'][u['category']] && (w = p['cat_price_hash'][u['category']]),
                    '' != u['code'] && p['price_hash'][u['code']] && (w = p['price_hash'][u['code']]),
                    parseInt(p['params']['item_width']) / 0x3e8);
                    0x0 == x && (x = 0x3);
                    var v = Math['ceil'](m['cornice']['common'][q]['pm'] / x)
                      , u = v * w['price']['common'];
                    u *= constructor_settings['price_modificator'],
                    k += u,
                    global_data['cornice']['push']({
                        'meters': m['cornice']['common'][q]['pm'],
                        'type': 'common',
                        'code': w['code'],
                        'name': w['name'],
                        'count': v,
                        'divider': p['params']['item_width'],
                        'price': w['price']['common'] * constructor_settings['price_modificator'],
                        'total_price': u
                    });
                }),
                Object['keys'](m['cornice']['radius'])['forEach'](function(q) {
                    var u = q['split']('_')
                      , v = materials_lib['items'][u[0x0]]
                      , w = materials_lib['categories'][v['category']];
                    let x = p['price_hash']['c_default_price'];
                    0x0 != w['parent'] && p['cat_price_hash'][w['parent']] && (x = p['cat_price_hash'][w['parent']]),
                    0x0 != v['category'] && p['cat_price_hash'][v['category']] && (x = p['cat_price_hash'][v['category']]),
                    '' != v['code'] && p['price_hash'][v['code']] && (x = p['price_hash'][v['code']]);
                    var w = m['cornice']['radius'][q]['count'] * x['price']['radius'];
                    w *= constructor_settings['price_modificator'],
                    k += w,
                    global_data['cornice']['push']({
                        'meters': '',
                        'type': 'radius',
                        'orientation': u[0x1],
                        'code': x['code_radius'],
                        'name': x['name_radius'],
                        'count': m['cornice']['radius'][q]['count'],
                        'divider': '',
                        'price': x['price']['radius'] * constructor_settings['price_modificator'],
                        'total_price': w
                    });
                });
            }
            if (m['washes'] && (global_data['washes'] = [],
            Object['keys'](m['washes'])['forEach'](function(q) {
                var u = washes_lib['items'][m['washes'][q]['id']];
                switch (u['params']['materials_mode']) {
                case 'c':
                    break;
                default:
                    var v = m['washes'][q]['material'], w, x, w;
                    let y;
                    for (let z = u['items']['length']; z--; )
                        if (u['items'][z]['value'] == v) {
                            y = u['items'][z];
                            break;
                        }
                    (y = y || u['items'][0x0])['acc_id'] ? (w = accsessories_data['items'][y['acc_id']],
                    x = parseFloat(w['price']) * constructor_settings['price_modificator'],
                    global_data['washes']['push']({
                        'meters': '',
                        'type': 'washer',
                        'orientation': '',
                        'code': w['code'],
                        'name': w['name'],
                        'count': m['washes'][q]['count'],
                        'divider': '',
                        'price': x,
                        'total_price': x * m['washes'][q]['count']
                    }),
                    k += x * m['washes'][q]['count']) : (w = parseFloat(y['price']) * constructor_settings['price_modificator'],
                    global_data['washes']['push']({
                        'meters': '',
                        'type': 'washer',
                        'orientation': '',
                        'code': y['code'],
                        'name': u['name'] + '\x20' + y['name'],
                        'count': m['washes'][q]['count'],
                        'divider': '',
                        'price': w,
                        'total_price': w * m['washes'][q]['count']
                    }),
                    k += w * m['washes'][q]['count']);
                }
            })),
            m['tabletop_v2'] && (global_data['tabletop']['price_desc'] = [],
            Object['keys'](m['tabletop_v2'])['forEach'](function(q) {
                var q = m['tabletop_v2'][q]
                  , u = pp['libs']['tabletop']['find_item'](q['id']);
                let v = 0x0
                  , w = (v = u['params']?.['width'] ? Math['ceil'](q['pm'] / parseInt(u['params']['width'])) : Math['ceil'](q['pm'] / parseInt(u['params']['variants'][0x0]['width'])),
                0x0);
                w = u['prices']?.['common'] ? parseFloat(u['prices']['common']) * v * constructor_settings['price_modificator'] : parseFloat(u['params']['variants'][0x0]['price']) * v * constructor_settings['price_modificator'],
                k += w;
            })),
            0x1 == constructor_settings['shop_mode'] && $('.custom_sizes_active')['hide'](),
            k = k + cart['total_price'] + 0x0,
            project_settings['services']) {
                for (let q = 0x0; q < project_settings['services']['length']; q++)
                    k += parseFloat(project_settings['services'][q]['price']);
            }
            if ('function' == typeof total_price_callback && (k = total_price_callback(k, l, cart['total_price'])),
            constructor_settings['core_v2']) {
                let u = format_price(m['total_price']);
                try {
                    $('.k_sum\x20span')['html'](u);
                } catch (v) {}
            } else
                try {
                    $('.k_sum\x20span')['html'](k['toFixed'](0x2) + '\x20' + lang['currency']);
                } catch (w) {
                    $('.k_sum\x20span')['html'](k + '\x20' + lang['currency']);
                }
            return l -= 0x0,
            'function' == typeof update_price_info_panel && update_price_info_panel(),
            update_materials_panel(m),
            constructor_settings['core_v2'] ? {
                'modules': format_price(m['total_price']),
                'wall_panel': 0x0
            } : {
                'modules': l['toFixed'](0x2) + '\x20' + lang['currency'],
                'wall_panel': 0x0 ['toFixed' ](0x2) + '\x20' + lang['currency']
            };
        }
    },
    'change_facade_material': function(f) {
        (f = f || {})['id'] || (f['id'] = 0x0),
        f['group'] || (f['group'] = 'all'),
        f['rotated'] || (f['rotated'] = !0x1),
        f['material_key'] || (f['material_key'] = !0x1);
        var g = f['id'];
        if (f['material_key']) {
            'top' !== f['group'] && 'all' !== f['group'] || project_settings['selected_materials']['facades'][project_settings['defaults']['facades']['top']][f['material_key']]['top'] && (project_settings['selected_materials']['facades'][project_settings['defaults']['facades']['top']][f['material_key']]['top'] = g),
            'bottom' !== f['group'] && 'all' !== f['group'] || project_settings['selected_materials']['facades'][project_settings['defaults']['facades']['bottom']][f['material_key']]['bottom'] && (project_settings['selected_materials']['facades'][project_settings['defaults']['facades']['bottom']][f['material_key']]['bottom'] = g);
            for (let h = room['active_objects']['length'] - 0x1; 0x0 <= h; h--)
                'function' == typeof room['active_objects'][h]['change_facade_material'] && room['active_objects'][h]['change_facade_material'](f),
                'function' == typeof room['active_objects'][h]['change_cornice_material'] && 0x1 == project_settings['cornice_change_with_facade'] && room['active_objects'][h]['change_cornice_material'](f);
        } else {
            'top' === f['group'] && (project_settings['selected_materials']['top']['facades'] = g,
            project_settings['selected_materials']['top']['facades_rotated'] = f['rotated'],
            project_settings['selected_materials']['facades'][project_settings['defaults']['facades']['top']]['gen']['top'] = g),
            'bottom' === f['group'] && (project_settings['selected_materials']['bottom']['facades'] = g,
            project_settings['selected_materials']['bottom']['facades_rotated'] = f['rotated'],
            project_settings['selected_materials']['facades'][project_settings['defaults']['facades']['bottom']]['gen']['bottom'] = g),
            'all' === f['group'] && (project_settings['selected_materials']['top']['facades'] = g,
            project_settings['selected_materials']['bottom']['facades'] = g,
            project_settings['selected_materials']['top']['facades_rotated'] = f['rotated'],
            project_settings['selected_materials']['bottom']['facades_rotated'] = f['rotated'],
            project_settings['selected_materials']['facades'][project_settings['defaults']['facades']['top']]['gen']['top'] = g,
            project_settings['selected_materials']['facades'][project_settings['defaults']['facades']['top']]['gen']['bottom'] = g);
            for (let i = room['active_objects']['length'] - 0x1; 0x0 <= i; i--)
                'function' == typeof room['active_objects'][i]['change_facade_material'] && room['active_objects'][i]['change_facade_material'](f),
                'function' == typeof room['active_objects'][i]['change_cornice_material'] && 0x1 == project_settings['cornice_change_with_facade'] && room['active_objects'][i]['change_cornice_material'](f);
            0x1 == project_settings['cornice_change_with_facade'] && (project_settings['selected_materials']['cornice'] = g);
        }
        'function' == typeof change_facade_material_callback && change_facade_material_callback(f),
        get_total_price_test(),
        update_materials_panel(),
        autosave();
    },
    'add_facade': function(f) {
        if (constructor_settings['core_v2']) {
            var g = f['userData']['path'];
            let m = global_options['mouse_mode']['style']
              , n = global_options['mouse_mode']['item_id'];
            var g = module_utils['get_child_params_by_path'](f, g);
            return g?.['spec'] && g['spec']['can_change']?.['id'] && g['spec']['can_change']?.['type'] ? (g['spec']['id'] = n,
            null != m && (g['spec']['type'] = m),
            void f['_rebuild']()) : void 0x0;
        }
        let h = 'd'
          , j = ('Locker' == f['type'] && (h = 'l'),
        null);
        return -0x1 < f['parent']['name']['indexOf']('section') && (j = f['parent']['parent']['userData']['index']),
        f['userData']['cabinet']['change_facade_type_single'](global_options['mouse_mode']['style'], h, f['par_index'], j),
        void f['userData']['cabinet']['change_facade_style_single'](global_options['mouse_mode']['item_id'], h, f['par_index'], j);
        let k = global_options['facade_mode']['facade']
          , l = 0x0;
        if (!project_settings['selected_materials']['facades'][k]) {
            project_settings['selected_materials']['facades'][k] = {};
            let p = facades_lib['items'][k];
            var g = materials_lib['get_first_item'](p['materials'][0x0])['id'];
            project_settings['selected_materials']['facades'][k]['gen'] = {},
            project_settings['selected_materials']['facades'][k]['gen']['top'] = g,
            project_settings['selected_materials']['facades'][k]['gen']['bottom'] = g,
            0x0 == l && (l = g),
            Object['keys'](p['additional_materials'])['forEach'](function(q) {
                0x0 == p['additional_materials'][q]['fixed'] && (project_settings['selected_materials']['facades'][k][q] = {},
                project_settings['selected_materials']['facades'][k][q]['top'] = copy_object(p['additional_materials'][q]['selected']),
                project_settings['selected_materials']['facades'][k][q]['bottom'] = copy_object(p['additional_materials'][q]['selected']));
            });
        }