  break;
            case 'ctr':
                B['points'] = [{
                    'x': 0x0,
                    'y': 0x0,
                    'radius': 0x0
                }, {
                    'x': B['real_size']['x'],
                    'y': 0x0,
                    'radius': 0x0
                }, {
                    'x': B['real_size']['x'],
                    'y': B['real_size']['y'] - U,
                    'radius': a4,
                    'dir': !0x0
                }, {
                    'x': B['real_size']['x'] - W,
                    'y': B['real_size']['y'] - U,
                    'radius': a5,
                    'dir': !0x1
                }, {
                    'x': B['real_size']['x'] - W,
                    'y': B['real_size']['y'],
                    'radius': a4,
                    'dir': !0x0
                }, {
                    'x': 0x0,
                    'y': B['real_size']['y'],
                    'radius': 0x0
                }];
                break;
            case 'cbl':
                B['points'] = [{
                    'x': 0x0,
                    'y': U,
                    'radius': a4,
                    'dir': !0x0
                }, {
                    'x': W,
                    'y': U,
                    'radius': a5,
                    'dir': !0x1
                }, {
                    'x': W,
                    'y': 0x0,
                    'radius': a4,
                    'dir': !0x0
                }, {
                    'x': B['real_size']['x'],
                    'y': 0x0,
                    'radius': 0x0
                }, {
                    'x': B['real_size']['x'],
                    'y': B['real_size']['y'],
                    'radius': 0x0
                }, {
                    'x': 0x0,
                    'y': B['real_size']['y'],
                    'radius': 0x0
                }];
                break;
            case 'cbr':
                B['points'] = [{
                    'x': 0x0,
                    'y': 0x0,
                    'radius': 0x0
                }, {
                    'x': B['real_size']['x'] - W,
                    'y': 0x0,
                    'radius': a4,
                    'dir': !0x0
                }, {
                    'x': B['real_size']['x'] - W,
                    'y': U,
                    'radius': a5,
                    'dir': !0x1
                }, {
                    'x': B['real_size']['x'],
                    'y': U,
                    'radius': a4,
                    'dir': !0x0
                }, {
                    'x': B['real_size']['x'],
                    'y': B['real_size']['y'],
                    'radius': 0x0
                }, {
                    'x': 0x0,
                    'y': B['real_size']['y'],
                    'radius': 0x0
                }];
                break;
            default:
                break;
            }
            B['original_points'] = B['points']['map'](ag => ({
                ...ag
            })),
            0x0 < q['spec']['butts']['length'] && (this['_build_butts'](),
            this['_get_butts_offsets']()),
            H = p_shapes['common'](B['points']);
            break;
        case 'c_l_shape':
            (a6 = q['spec']['type_params']['l_shapes'] || [])['forEach'](ag => {
                var ah = ag['o']['value']
                  , ai = comp2(ag['d1']['value'], C)
                  , aj = comp2(ag['d2']['value'], C);
                let ak = 0x0
                  , al = 0x0
                  , am = (ag?.['r']?.['value'] && (ak = comp2(ag['r']['value'], C)),
                ag?.['r_concave']?.['value'] && (al = comp2(ag['r_concave']['value'], C)),
                []);
                switch (ah) {
                case 'ctl':
                    am = [{
                        'x': 0x0,
                        'y': 0x0,
                        'radius': 0x0
                    }, {
                        'x': B['real_size']['x'],
                        'y': 0x0,
                        'radius': 0x0
                    }, {
                        'x': B['real_size']['x'],
                        'y': B['real_size']['y'],
                        'radius': 0x0
                    }, {
                        'x': aj,
                        'y': B['real_size']['y'],
                        'radius': ak,
                        'dir': !0x0
                    }, {
                        'x': aj,
                        'y': B['real_size']['y'] - ai,
                        'radius': al
                    }, {
                        'x': 0x0,
                        'y': B['real_size']['y'] - ai,
                        'radius': ak,
                        'dir': !0x0
                    }];
                    break;
                case 'ctr':
                    am = [{
                        'x': 0x0,
                        'y': 0x0,
                        'radius': 0x0
                    }, {
                        'x': B['real_size']['x'],
                        'y': 0x0,
                        'radius': 0x0
                    }, {
                        'x': B['real_size']['x'],
                        'y': B['real_size']['y'] - ai,
                        'radius': ak,
                        'dir': !0x0
                    }, {
                        'x': B['real_size']['x'] - aj,
                        'y': B['real_size']['y'] - ai,
                        'radius': al
                    }, {
                        'x': B['real_size']['x'] - aj,
                        'y': B['real_size']['y'],
                        'radius': ak,
                        'dir': !0x0
                    }, {
                        'x': 0x0,
                        'y': B['real_size']['y'],
                        'radius': 0x0
                    }];
                    break;
                case 'cbl':
                    am = [{
                        'x': 0x0,
                        'y': ai,
                        'radius': ak,
                        'dir': !0x0
                    }, {
                        'x': aj,
                        'y': ai,
                        'radius': al
                    }, {
                        'x': aj,
                        'y': 0x0,
                        'radius': ak,
                        'dir': !0x0
                    }, {
                        'x': B['real_size']['x'],
                        'y': 0x0,
                        'radius': 0x0
                    }, {
                        'x': B['real_size']['x'],
                        'y': B['real_size']['y'],
                        'radius': 0x0
                    }, {
                        'x': 0x0,
                        'y': B['real_size']['y'],
                        'radius': 0x0
                    }];
                    break;
                case 'cbr':
                    am = [{
                        'x': 0x0,
                        'y': 0x0,
                        'radius': 0x0
                    }, {
                        'x': B['real_size']['x'] - aj,
                        'y': 0x0,
                        'radius': ak,
                        'dir': !0x0
                    }, {
                        'x': B['real_size']['x'] - aj,
                        'y': ai,
                        'radius': al
                    }, {
                        'x': B['real_size']['x'],
                        'y': ai,
                        'radius': ak,
                        'dir': !0x0
                    }, {
                        'x': B['real_size']['x'],
                        'y': B['real_size']['y'],
                        'radius': 0x0
                    }, {
                        'x': 0x0,
                        'y': B['real_size']['y'],
                        'radius': 0x0
                    }];
                    break;
                default:
                    break;
                }
                B['points']['push'](...am);
            }
            ),
            (K = q['spec']['type_params']['c_shapes'] || [])['forEach'](ag => {
                var ah = ag['o']['value']
                  , ai = comp2(ag['d1']['value'], C)
                  , aj = comp2(ag['w1']['value'], C)
                  , ak = comp2(ag['offset']['value'], C);
                let al = 0x0
                  , am = 0x0
                  , an = (ag?.['r']?.['value'] && (al = comp2(ag['r']['value'], C)),
                ag?.['r_concave']?.['value'] && (am = comp2(ag['r_concave']['value'], C)),
                []);
                switch (ah) {
                case 'ctl':
                    an = [{
                        'x': 0x0,
                        'y': 0x0,
                        'radius': 0x0
                    }, {
                        'x': B['real_size']['x'],
                        'y': 0x0,
                        'radius': 0x0
                    }, {
                        'x': B['real_size']['x'],
                        'y': B['real_size']['y'],
                        'radius': 0x0
                    }, {
                        'x': 0x0,
                        'y': B['real_size']['y'],
                        'radius': 0x0
                    }, {
                        'x': 0x0,
                        'y': B['real_size']['y'] - ak,
                        'radius': al,
                        'dir': !0x0
                    }, {
                        'x': ai,
                        'y': B['real_size']['y'] - ak,
                        'radius': am
                    }, {
                        'x': ai,
                        'y': B['real_size']['y'] - ak - aj,
                        'radius': am
                    }, {
                        'x': 0x0,
                        'y': B['real_size']['y'] - ak - aj,
                        'radius': al,
                        'dir': !0x0
                    }];
                    break;
                case 'ctr':
                    an = [{
                        'x': 0x0,
                        'y': 0x0,
                        'radius': 0x0
                    }, {
                        'x': B['real_size']['x'],
                        'y': 0x0,
                        'radius': 0x0
                    }, {
                        'x': B['real_size']['x'],
                        'y': B['real_size']['y'],
                        'radius': 0x0
                    }, {
                        'x': B['real_size']['x'] - ak,
                        'y': B['real_size']['y'],
                        'radius': al,
                        'dir': !0x0
                    }, {
                        'x': B['real_size']['x'] - ak,
                        'y': B['real_size']['y'] - ai,
                        'radius': am
                    }, {
                        'x': B['real_size']['x'] - ak - aj,
                        'y': B['real_size']['y'] - ai,
                        'radius': am
                    }, {
                        'x': B['real_size']['x'] - ak - aj,
                        'y': B['real_size']['y'],
                        'radius': al,
                        'dir': !0x0
                    }, {
                        'x': 0x0,
                        'y': B['real_size']['y'],
                        'radius': 0x0
                    }];
                    break;
                case 'cbr':
                    an = [{
                        'x': 0x0,
                        'y': 0x0,
                        'radius': 0x0
                    }, {
                        'x': B['real_size']['x'],
                        'y': 0x0,
                        'radius': 0x0
                    }, {
                        'x': B['real_size']['x'],
                        'y': ak,
                        'radius': al,
                        'dir': !0x0
                    }, {
                        'x': B['real_size']['x'] - ai,
                        'y': ak,
                        'radius': am
                    }, {
                        'x': B['real_size']['x'] - ai,
                        'y': ak + aj,
                        'radius': am
                    }, {
                        'x': B['real_size']['x'],
                        'y': ak + aj,
                        'radius': al,
                        'dir': !0x0
                    }, {
                        'x': B['real_size']['x'],
                        'y': B['real_size']['y'],
                        'radius': 0x0
                    }, {
                        'x': 0x0,
                        'y': B['real_size']['y'],
                        'radius': 0x0
                    }];
                    break;
                case 'cbl':
                    an = [{
                        'x': 0x0,
                        'y': 0x0,
                        'radius': 0x0
                    }, {
                        'x': ak,
                        'y': 0x0,
                        'radius': al,
                        'dir': !0x0
                    }, {
                        'x': ak,
                        'y': ai,
                        'radius': am
                    }, {
                        'x': ak + aj,
                        'y': ai,
                        'radius': am
                    }, {
                        'x': ak + aj,
                        'y': 0x0,
                        'radius': al,
                        'dir': !0x0
                    }, {
                        'x': B['real_size']['x'],
                        'y': 0x0,
                        'radius': 0x0
                    }, {
                        'x': B['real_size']['x'],
                        'y': B['real_size']['y'],
                        'radius': 0x0
                    }, {
                        'x': 0x0,
                        'y': B['real_size']['y'],
                        'radius': 0x0
                    }];
                    break;
                default:
                    break;
                }
                B['points']['push'](...an);
            }
            ),
            (L = new Set(a6['map'](ag => ag['o']['value'])))['has']('ctl') && (B['points'] = B['points']['filter'](ag => !(0x0 === ag['x'] && ag['y'] === B['real_size']['y']))),
            L['has']('ctr') && (B['points'] = B['points']['filter'](ag => !(ag['x'] === B['real_size']['x'] && ag['y'] === B['real_size']['y']))),
            L['has']('cbl') && (B['points'] = B['points']['filter'](ag => !(0x0 === ag['x'] && 0x0 === ag['y']))),
            L['has']('cbr') && (B['points'] = B['points']['filter'](ag => !(ag['x'] === B['real_size']['x'] && 0x0 === ag['y']))),
            B['points']['length'] || (B['points'] = [{
                'x': 0x0,
                'y': 0x0,
                'radius': 0x0
            }, {
                'x': B['real_size']['x'],
                'y': 0x0,
                'radius': 0x0
            }, {
                'x': B['real_size']['x'],
                'y': B['real_size']['y'],
                'radius': 0x0
            }, {
                'x': 0x0,
                'y': B['real_size']['y'],
                'radius': 0x0
            }]),
            B['original_points'] = B['points']['map'](ag => ({
                ...ag
            })),
            B['original_points'] = sort_contour_points(B['original_points']),
            B['points'] = sort_contour_points(B['points']),
            0x0 < q['spec']['butts']['length'] && (this['_build_butts'](),
            this['_get_butts_offsets']()),
            H = p_shapes['common'](B['points']);
            break;
        case 'cut_l_shape':
            a6 = q['spec']['type_params']['l_shapes'] || [];
            var L = q['spec']['type_params']['cut_corners'] || []
              , a7 = B['real_size']['x']
              , a8 = B['real_size']['y']
              , a9 = ag => {
                var ah = new Map(), ai;
                for (ai of ag) {
                    var aj = ai['o']['value'];
                    ah['set'](aj, {
                        'd1': comp2(ai['d1']?.['value'] ?? 0x0, C),
                        'd2': comp2(ai['d2']?.['value'] ?? 0x0, C),
                        'r': comp2(ai['r']?.['value'] ?? 0x0, C),
                        'r_concave': comp2(ai['r_concave']?.['value'] ?? 0x0, C)
                    });
                }
                return ah;
            }
              , aa = a9(a6)
              , a9 = a9(L);
            let ae = [];
            var L = ag => {
                ae['length'] && ae[ae['length'] - 0x1]['x'] === ag['x'] && ae[ae['length'] - 0x1]['y'] === ag['y'] || ae['push'](ag);
            }
              , ab = ag => {
                if (ag['length'] < 0x3)
                    return ag['slice']();
                var ah = []
                  , ai = (am, an, ao) => am['x'] === an['x'] && an['x'] === ao['x'] || am['y'] === an['y'] && an['y'] === ao['y'];
                for (let am = 0x0; am < ag['length']; am++) {
                    var aj = ag[(am - 0x1 + ag['length']) % ag['length']], ak = ag[am], al;
                    ai(aj, ak, ag[(am + 0x1) % ag['length']]) || ah['push'](ak);
                }
                return ah;
            }
            ;
            if (L({
                'x': 0x0,
                'y': 0x0,
                'radius': 0x0
            }),
            aa['has']('cbl')) {
                let {d1: ag, d2: ah, r: ai, r_concave: aj} = aa['get']('cbl');
                L({
                    'x': 0x0,
                    'y': ag,
                    'radius': ai,
                    'dir': !0x0
                }),
                L({
                    'x': ah,
                    'y': ag,
                    'radius': aj,
                    'dir': !0x1
                }),
                L({
                    'x': ah,
                    'y': 0x0,
                    'radius': ai,
                    'dir': !0x0
                });
            } else {
                if (a9['has']('cbl')) {
                    let {d1: ak, d2: al} = a9['get']('cbl');
                    L({
                        'x': 0x0,
                        'y': ak,
                        'radius': 0x0
                    }),
                    L({
                        'x': al,
                        'y': 0x0,
                        'radius': 0x0
                    });
                } else
                    L({
                        'x': 0x0,
                        'y': 0x0,
                        'radius': 0x0
                    });
            }
            if (aa['has']('cbr')) {
                let {d1: am, d2: an, r: ao, r_concave: ap} = aa['get']('cbr');
                L({
                    'x': a7 - an,
                    'y': 0x0,
                    'radius': ao,
                    'dir': !0x0
                }),
                L({
                    'x': a7 - an,
                    'y': am,
                    'radius': ap,
                    'dir': !0x1
                }),
                L({
                    'x': a7,
                    'y': am,
                    'radius': ao,
                    'dir': !0x0
                });
            } else {
                if (a9['has']('cbr')) {
                    let {d1: aq, d2: ar} = a9['get']('cbr');
                    L({
                        'x': a7 - ar,
                        'y': 0x0,
                        'radius': 0x0
                    }),
                    L({
                        'x': a7,
                        'y': aq,
                        'radius': 0x0
                    });
                } else
                    L({
                        'x': a7,
                        'y': 0x0,
                        'radius': 0x0
                    });
            }
            if (aa['has']('ctr')) {
                let {d1: as, d2: at, r: au, r_concave: av} = aa['get']('ctr');
                L({
                    'x': a7,
                    'y': a8 - as,
                    'radius': au,
                    'dir': !0x0
                }),
                L({
                    'x': a7 - at,
                    'y': a8 - as,
                    'radius': av,
                    'dir': !0x1
                }),
                L({
                    'x': a7 - at,
                    'y': a8,
                    'radius': au,
                    'dir': !0x0
                });
            } else {
                if (a9['has']('ctr')) {
                    let {d1: aw, d2: ax} = a9['get']('ctr');
                    L({
                        'x': a7,
                        'y': a8 - aw,
                        'radius': 0x0
                    }),
                    L({
                        'x': a7 - ax,
                        'y': a8,
                        'radius': 0x0
                    });
                } else
                    L({
                        'x': a7,
                        'y': a8,
                        'radius': 0x0
                    });
            }
            if (aa['has']('ctl')) {
                let {d1: ay, d2: az, r: aA, r_concave: aB} = aa['get']('ctl');
                L({
                    'x': az,
                    'y': a8,
                    'radius': aA,
                    'dir': !0x0
                }),
                L({
                    'x': az,
                    'y': a8 - ay,
                    'radius': aB,
                    'dir': !0x1
                }),
                L({
                    'x': 0x0,
                    'y': a8 - ay,
                    'radius': aA,
                    'dir': !0x0
                });
            } else {
                if (a9['has']('ctl')) {
                    let {d1: aC, d2: aD} = a9['get']('ctl');
                    L({
                        'x': aD,
                        'y': a8,
                        'radius': 0x0
                    }),
                    L({
                        'x': 0x0,
                        'y': a8 - aC,
                        'radius': 0x0
                    });
                } else
                    L({
                        'x': 0x0,
                        'y': a8,
                        'radius': 0x0
                    });
            }
            var ac = [], ad, a7, aa;
            for (ad of ae)
                ac['length'] && ac[ac['length'] - 0x1]['x'] === ad['x'] && ac[ac['length'] - 0x1]['y'] === ad['y'] || ac['push'](ad);
            0x1 < ac['length'] && (a7 = ac[0x0])['x'] === (aa = ac[ac['length'] - 0x1])['x'] && a7['y'] === aa['y'] && ac['pop'](),
            B['points'] = ac['map'](aE => ({
                ...aE
            })),
            B['original_points'] = B['points']['map'](aE => ({
                ...aE
            })),
            B['original_points'] = B['points']['map'](aE => ({
                ...aE
            })),
            B['original_points'] = ab(ac),
            B['points'] = ab(B['points']),
            0x0 < q['spec']['butts']['length'] && (this['_build_butts'](),
            this['_get_butts_offsets']()),
            H = p_shapes['common'](B['points']);
            break;
        case 'free':
            (q['spec']['type_params']['points'] || [])['forEach'](aE => {
                var aF = [], aG, aH, aI, aF = [{
                    'x': comp2(aE['x']['value'], C),
                    'y': comp2(aE['y']['value'], C),
                    'radius': comp2(aE['radius']['value'], C),
                    'dir': !0x0
                }];
                B['points']['push'](...aF),
                B['original_points'] = B['points']['map'](aJ => ({
                    ...aJ
                }));
            }
            ),
            B['points']['length'] || (B['points'] = [{
                'x': 0x0,
                'y': 0x0,
                'radius': 0x0
            }, {
                'x': B['real_size']['x'],
                'y': 0x0,
                'radius': 0x0
            }, {
                'x': B['real_size']['x'],
                'y': B['real_size']['y'],
                'radius': 0x0
            }, {
                'x': 0x0,
                'y': B['real_size']['y'],
                'radius': 0x0
            }]),
            B['original_points'] = B['points']['map'](aE => ({
                ...aE
            })),
            0x0 < q['spec']['butts']['length'] && (this['_build_butts'](),
            this['_get_butts_offsets']()),
            H = p_shapes['common'](B['points']);
            break;
        case 'radius':
            B['points']['length'] || (B['points'] = [{
                'center': {
                    'x': B['real_size']['x'] / 0x2,
                    'y': B['real_size']['y'] / 0x2
                },
                'radius': a4,
                'dir': !0x0
            }]),
            B['original_points'] = B['points']['map'](aE => ({
                ...aE
            })),
            0x0 < q['spec']['butts']['length'] && (this['_build_butts'](),
            this['_get_butts_offsets']()),
            H = p_shapes['common'](B['points']);
            break;
        case 'common':
            B['points']['length'] || (B['points'] = [{
                'x': 0x0,
                'y': 0x0,
                'radius': 0x0
            }, {
                'x': B['real_size']['x'],
                'y': 0x0,
                'radius': 0x0
            }, {
                'x': B['real_size']['x'],
                'y': B['real_size']['y'],
                'radius': 0x0
            }, {
                'x': 0x0,
                'y': B['real_size']['y'],
                'radius': 0x0
            }]),
            B['original_points'] = B['points']['map'](aE => ({
                ...aE
            })),
            0x0 < q['spec']['butts']['length'] && (this['_build_butts'](),
            this['_get_butts_offsets']()),
            H = p_shapes[q['spec']['type']](B['points']);
            break;
        default:
            let af = {
                'width': B['size']['x'] / units,
                'height': B['size']['y'] / units
            };
            Object['keys'](q['spec']['type_params'])['forEach'](aE => {
                if (isArray(q['spec']['type_params'][aE])) {
                    var aF = [];
                    for (let aG = 0x0; aG < q['spec']['type_params'][aE]['length']; aG++)
                        if ('object' == typeof q['spec']['type_params'][aE][aG]) {
                            let aH = {};
                            Object['keys'](q['spec']['type_params'][aE][aG])['forEach'](aI => {
                                var aJ = q['spec']['type_params'][aE][aG][aI];
                                aH[aI] = comp2(aJ, C) / units;
                            }
                            ),
                            aF['push'](aH);
                        } else
                            aF['push'](comp2(q['spec']['type_params'][aE][aG], C) / units);
                    af[aE] = aF;
                } else
                    af[aE] = comp2(q['spec']['type_params'][aE], C) / units;
            }
            ),
            this['userData']['computed']['type_params'] = af,
            H = p_shapes[q['spec']['type']](af),
            (G = new THREE['ExtrudeBufferGeometry'](H,{
                'steps': 0x1,
                'depth': B['size']['z'] / units,
                'bevelEnabled': !0x1
            }))['translate'](0x0, 0x0, -B['size']['z'] / units / 0x2),
            correct_buffer_uv_simple(G, B['size']['x'] / units, B['size']['y'] / units);
            break;
        }
        switch (G = new THREE['ExtrudeBufferGeometry'](H,{
            'steps': 0x1,
            'depth': I,
            'bevelEnabled': !0x1
        }),
        q['spec']['orientation'][0x0]) {
        case 'h':
            G['rotateX'](Math['PI'] / 0x2)['translate'](-B['size']['x'] / units / 0x2, B['size']['y'] / units / 0x2, -B['size']['z'] / units / 0x2),
            correct_buffer_uv_simple(G, B['size']['x'] / units, B['size']['y'] / units);
            break;
        case 'v':
            G['rotateY'](-Math['PI'] / 0x2)['translate'](B['size']['x'] / units / 0x2, -B['size']['y'] / units / 0x2, -B['size']['z'] / units / 0x2),
            correct_buffer_uv_simple(G, B['size']['z'] / units, B['size']['y'] / units);
            break;
        case 'f':
            G['translate'](-B['size']['x'] / units / 0x2, -B['size']['y'] / units / 0x2, -B['size']['z'] / units / 0x2),
            correct_buffer_uv_simple(G, B['size']['x'] / units, B['size']['y'] / units);
            break;
        }
        var I = new THREE['Mesh'](G);
        I['castShadow'] = !0x0,
        I['receiveShadow'] = !0x0,
        I['userData']['edgesModeType'] = ObjectType['Wall'],
        this['userData']['original_meshes'] = [I['clone'](!0x0)],
        this['userData']['own_object']['add'](I);
    }
    ['_get_butts_offsets']() {
        let {params: h, computed: j} = this['userData'];
        var n = h['spec']['butts'] || [];
        let p = j['points'] || []
          , q = {
            'left': 0x0,
            'right': 0x0,
            'top': 0x0,
            'bottom': 0x0
        }
          , r = j['material'] || {
            'group': 'g0',
            'key': 'ldsp',
            'id': 0x0,
            'variant_id': 0x0,
            'rotated': 0x0
        }
          , u = pp['libs']['materials'][r['key']]?.['get_item'](r['id'])['params']['butt'];
        if (p['length'] && j['size']) {
            let w = j['size']['x']
              , x = j['size']['y']
              , y = []
              , A = 0x0
              , B = {}
              , C = (p['forEach']( (E, F) => {
                A++,
                0x0 < p[F]['radius'] && A++;
                var G = p[0x0 === F ? p['length'] - 0x1 : F - 0x1]
                  , H = p[F]
                  , I = p[(F + 0x1) % p['length']]
                  , J = G['x'] - H['x']
                  , G = G['y'] - H['y']
                  , K = I['x'] - H['x']
                  , I = I['y'] - H['y'];
                B[F] = 0x0 < J * I - G * K;
            }
            ),
            Array(A)['fill']()['map']( () => ({
                'key': u?.['key'],
                'id': u?.['id'],
                'variant_id': r['variant_id'],
                'thickness': 0x0
            })))
              , D = (n['forEach'](E => {
                0x0 <= E['face_index'] && E['face_index'] < A && (C[E['face_index']] = {
                    'key': E['key'] || u?.['key'],
                    'id': E['id'] || u?.['id'],
                    'variant_id': E['variant_id'] || r['variant_id'],
                    'thickness': parseFloat(_['get'](pp['libs']['butts'][E['key'] || u?.['key']]?.['get_item'](E['id'] || u?.['id']), 'params.variants[' + (E['variant_id'] || r['variant_id']) + '].thickness', 0x0))
                });
            }
            ),
            0x0);
            switch (p['forEach']( (E, F) => {
                let G = p[0x0 === F ? p['length'] - 0x1 : F - 0x1]
                  , H = p[(F + 0x1) % p['length']];
                G['x'] = parseFloat(G['x']),
                G['y'] = parseFloat(G['y']),
                E['x'] = parseFloat(E['x']),
                E['y'] = parseFloat(E['y']),
                H['x'] = parseFloat(H['x']),
                H['y'] = parseFloat(H['y']);
                var I = (J, K=!0x1) => {
                    var L = C[J]['thickness'], J = (J - 0x1 + A) % A, J = C[J]['thickness'], N = [E['x'] - G['x'], E['y'] - G['y']], O = Math['sqrt'](N[0x0] * N[0x0] + N[0x1] * N[0x1]), N, O = [-(N = [(N = [N[0x0] / O, N[0x1] / O])[0x0] * J, N[0x1] * J])[0x1], N[0x0]], J = [H['x'] - E['x'], H['y'] - E['y']], N = Math['sqrt'](J[0x0] * J[0x0] + J[0x1] * J[0x1]), J, N = [-(J = [(J = [J[0x0] / N, J[0x1] / N])[0x0] * L, J[0x1] * L])[0x1], J[0x0]], P = G['x'] + O[0x0], Q = G['y'] + O[0x1], R = E['x'] + O[0x0], O = E['y'] + O[0x1], S = E['x'] + N[0x0], T = E['y'] + N[0x1], U = H['x'] + N[0x0], N = H['y'] + N[0x1], W = (N - T) * (R - P) - (U - S) * (O - Q), U = W ? ((U - S) * (Q - T) - (N - T) * (P - S)) / W : 0x0, N = P + U * (R - P), T = Q + U * (O - Q), S = (E['x'] + H['x']) / 0x2, W = (E['y'] + H['y']) / 0x2;
                    Math['abs'](J[0x0]) > Math['abs'](J[0x1]) && (S <= 0.1 * w ? q['left'] += L : S >= 0.9 * w && (q['right'] += L)),
                    Math['abs'](J[0x1]) > Math['abs'](J[0x0]) && (W <= 0.1 * x ? q['bottom'] += L : W >= 0.9 * x && (q['top'] += L));
                    let Z = E['radius'];
                    (0x0 < E['radius'] && K || 0x0 < E['radius'] && !K) && (Z = !0x1 === E['dir'] ? B[F] ? E['radius'] + L : E['radius'] : E['radius'] - L),
                    y['push']({
                        'x': N,
                        'y': T,
                        'radius': Z,
                        'effective_index': F
                    });
                }
                ;
                I(D),
                D++,
                0x0 < E['radius'] && (I(D, !0x0),
                D++);
            }
            ),
            y['forEach'](E => {
                var F = E['effective_index'];
                p[F] && (p[F]['x'] = E['x'],
                p[F]['y'] = E['y'],
                p[F]['radius'] = E['radius'] || 0x0);
            }
            ),
            h['spec']['orientation'][0x0]) {
            case 'h':
                j['size_with_butts']['x'] -= q['left'] + q['right'],
                j['size_with_butts']['z'] -= q['top'] + q['bottom'];
                break;
            case 'v':
                j['size_with_butts']['y'] -= q['top'] + q['bottom'],
                j['size_with_butts']['z'] -= q['left'] + q['right'];
                break;
            case 'f':
                j['size_with_butts']['x'] -= q['left'] + q['right'],
                j['size_with_butts']['y'] -= q['top'] + q['bottom'];
                break;
            }
            C['forEach']( (E, F) => {
                if (E['thickness'] && F < A) {
                    let J = 0x0
                      , K = 0x0;
                    for (let L = 0x0; L < p['length']; L++) {
                        if (K === F) {
                            J = L;
                            break;
                        }
                        K++,
                        0x0 < p[L]['radius'] && K++;
                    }
                    var G = p[J]
                      , H = p[(J + 0x1) % p['length']]
                      , I = H['x'] - G['x']
                      , H = H['y'] - G['y'];
                    Math['abs'](I) > Math['abs'](H) ? j['size_without_butts']['x'] -= E['thickness'] : j['size_without_butts']['y'] -= E['thickness'];
                }
            }
            );
        }
        return q;
    }
    ['_build_butts']() {
        var q = this['userData']['params']
          , A = this['userData']['computed']
          , B = A['points'] || []
          , C = q['spec']['butts'] || [];
        let G = A['material'] || {
            'group': 'g0',
            'key': 'ldsp',
            'id': 0x0,
            'variant_id': 0x0,
            'rotated': 0x0
        }, H;
        var I, J = (this['userData']['local_parent'] || this['userData']['root'])['userData']['computed']['materials'][G['group']]?.['butt'], K;
        J && !is_empty_id(J['id']) && (H = copy_object(J)),
        is_empty_id(H?.['id']) && (H = pp['libs']['materials'][G['key']]['get_item'](G['id'])['params']['butt']);
        let L = 0x0
          , O = A['size']['z'];
        if (('h' === q['spec']['orientation'] && (O = A['size']['y']),
        'v' === q['spec']['orientation'] && (O = A['size']['x']),
        Array['isArray'](B) && !(B['length'] < 0x2)) && (this['userData']['butt_objects'] = this['userData']['butt_objects'] || [],
        this['userData']['butt_objects']['forEach'](a7 => {
            a7['_reset'](a7['userData']['own_object']),
            this['userData']['own_object']['remove'](a7);
        }
        ),
        this['userData']['butt_objects'] = [],
        _['find'](pp['libs']['materials_info']['keys'], a7 => a7['key'] === G['key'])?.['butts']))
            for (let a7 = 0x0; a7 < C['length']; a7++) {
                var P = C[a7] || {}, Q = copy_object(def_cabinet_butts), R = (Q['spec'] = {
                    ...P
                },
                Number(Q['spec']['face_index'])), S, T, U, W, Z, a0;
                let a8 = 0x0
                  , a9 = 0x0
                  , aa = !0x1;
                for (let af = 0x0; af < B['length']; af++) {
                    if (0x0 < B[af]['radius']) {
                        if (a9 === R) {
                            a8 = af,
                            aa = !0x0;
                            break;
                        }
                        if ((a9 += 0x1) === R) {
                            a8 = af,
                            aa = !0x1;
                            break;
                        }
                    } else {
                        if (a9 === R) {
                            a8 = af,
                            aa = !0x1;
                            break;
                        }
                    }
                    a9 += 0x1;
                }
                -0x1 === a8 && (T = 0x0 < B[S = B['length'] - 0x1]['radius'],
                W = a9,
                a8 = S,
                aa = T && 0x0 == R - (W - (T ? 0x2 : 0x1)));
                var S = B[a8 = Math['max'](0x0, a8)], W = a8 + 0x1 >= B['length'] ? B[0x0] : B[a8 + 0x1], a1, a1, P, P;
                S['x'] = parseFloat(S['x']),
                S['y'] = parseFloat(S['y']),
                W['x'] = parseFloat(W['x']),
                W['y'] = parseFloat(W['y']);
                let ab, ac, ad;
                if (aa) {
                    var a2, T = B[0x0 === a8 ? B['length'] - 0x1 : a8 - 0x1], a3 = S['x'] - T['x'], a4 = S['y'] - T['y'], a5 = W['x'] - S['x'], a6 = W['y'] - S['y'], a4 = Math['atan2'](a4, a3), a3 = Math['atan2'](a6, a5), a6 = Math['abs'](a3 - a4);
                    ab = S['radius'] * (a6 > Math['PI'] ? 0x2 * Math['PI'] - a6 : a6),
                    Q['spec']['type'] = 'rad',
                    Q['spec']['_p0'] = T,
                    ac = S['x'],
                    ad = S['y'];
                } else {
                    let ag = S['x']
                      , ah = S['y']
                      , ai = W['x']
                      , aj = W['y'];
                    var a5, a3, a4 = (0x0 < S['radius'] && (a5 = Math['atan2'](W['y'] - S['y'], W['x'] - S['x']),
                    ag += S['radius'] * Math['cos'](a5),
                    ah += S['radius'] * Math['sin'](a5)),
                    0x0 < W['radius'] && (a3 = Math['atan2'](W['y'] - S['y'], W['x'] - S['x']),
                    ai -= W['radius'] * Math['cos'](a3),
                    aj -= W['radius'] * Math['sin'](a3)),
                    ai - ag), a6 = aj - ah;
                    ab = Math['sqrt'](a4 * a4 + a6 * a6),
                    ac = (ag + ai) / 0x2,
                    ad = (ah + aj) / 0x2;
                }
                let ae = P['thickness'] || 0x2;
                if (Q['spec']['_p1'] = S,
                Q['spec']['_p2'] = W,
                Q['active'] = 0x1,
                Q['size'] = {
                    'x': ab,
                    'y': O,
                    'z': ae
                },
                Q['pivot'] = {
                    'x': 0x0,
                    'y': 0x0,
                    'z': 0x0
                },
                Q['pos'] = {
                    'x': ac,
                    'y': ad,
                    'z': O / 0x2
                },
                'h' === q['spec']['orientation'] && (Q['pos'] = {
                    'x': ac,
                    'z': ad,
                    'y': O / 0x2
                }),
                'v' === q['spec']['orientation'] && (Q['pos'] = {
                    'z': ac,
                    'y': ad,
                    'x': O / 0x2
                }),
                is_empty_id(Q['spec']['id']) && H && (Q['spec']['id'] = H['id'],
                Q['spec']['key'] = H['key']),
                Q['spec']['key']) {
                    let ak = pp['libs']['butts'][Q['spec']['key']]?.['find_item'](Q['spec']['id']);
                    if (G['thickness'] && Array['isArray'](ak?.['params']['variants'])) {
                        let al = ak['params']['variants']['filter'](am => parseFloat(am['thickness']) >= parseFloat(ae) && parseFloat(G['thickness']) + 0x3 <= parseFloat(am['height']))['sort']( (am, an) => parseFloat(am['height']) - parseFloat(an['height']));
                        0x0 < al['length'] ? (a1 = ak['params']['variants']['findIndex'](am => am['thickness'] === al[0x0]['thickness'] && am['height'] === al[0x0]['height']),
                        Q['spec']['variant_id'] = a1,
                        P['variant_id'] = a1) : (ak = pp['libs']['butts'][P['key']]['find_item'](0x0),
                        Q['spec']['id'] = 0x0,
                        P['id'] = 0x0,
                        Q['spec']['variant_id'] = 0x0,
                        P['variant_id'] = 0x0);
                    } else
                        Q['spec']['variant_id'] = 0x0,
                        P['variant_id'] = 0x0;
                    (!ak || P['variant_id'] >= ak['params']['variants']['length']) && (ak = pp['libs']['butts'][P['key']]['find_item'](0x0),
                    Q['spec']['id'] = 0x0,
                    P['id'] = 0x0,
                    Q['spec']['variant_id'] = 0x0,
                    P['variant_id'] = 0x0),
                    (a1 = ak['params']['variants'][P['variant_id']]) && (P = Q['spec']['id'] + '_' + Q['spec']['variant_id'] + '_' + a1['thickness'] + '_' + a1['height'],
                    this['userData']['butts_info'][P] ? this['userData']['butts_info'][P]['length'] += Q['size']['x'] : this['userData']['butts_info'][P] = {
                        'id': Q['spec']['id'],
                        'variant_id': Q['spec']['variant_id'],
                        'key': Q['spec']['key'] || '',
                        'name': a1['name'],
                        'code': a1['code'],
                        'length': Q['size']['x'],
                        'height': a1['height'],
                        'thickness': a1['thickness']
                    },
                    G['rotated'] && (Q['spec']['rotated'] = G['rotated']),
                    Q['spec']['key'] || (Q['spec']['key'] = 'butts'),
                    L += Q['size']['x'],
                    Q['pos'] && (Number['isNaN'](Q['pos']['x']) && (Q['pos']['x'] = 0x0),
                    Number['isNaN'](Q['pos']['y']) && (Q['pos']['y'] = 0x0),
                    Number['isNaN'](Q['pos']['z'])) && (Q['pos']['z'] = 0x0),
                    P = new CabinetButts(Q,{
                        'parent': this,
                        'local_parent': this,
                        'root': this['userData']['root'],
                        'path': this['userData']['path'] + ',' + a7,
                        'variables': {}
                    },{
                        'use_lib': !0x1
                    }),
                    this['userData']['butt_objects']['push'](P),
                    this['userData']['own_object']['add'](P));
                }
            }
    }
    ['_build_helpers']() {
        var q = this['userData']['computed'], B = this['userData']['params'], G = q['points'], H = B['spec']['butts'] || [], I, J, K, L = (this['userData']['helpers'] ? this['_reset'](this['userData']['helpers']) : (this['userData']['helpers'] = new THREE['Group'](),
        this['userData']['helpers']['name'] = '__helpers',
        this['add'](this['userData']['helpers'])),
        I = conv_pivot(B['pivot']['x'], q['size']['x']),
        J = conv_pivot(B['pivot']['y'], q['size']['y']),
        K = conv_pivot(B['pivot']['z'], q['size']['z']),
        make_cube(q['size']['x'] / units, q['size']['y'] / units, q['size']['z'] / units, pp['three']['materials']['helper_cube'])), L = (L['position']['set'](I / units, J / units, K / units),
        L['userData']['no_edges'] = 0x1,
        L['userData']['is_helper'] = 0x1,
        L['renderOrder'] = 0xa,
        this['userData']['helpers']['userData']['size_volume'] = L,
        this['userData']['helpers']['add'](L),
        make_edges(q['size']['x'] / units, q['size']['y'] / units, q['size']['z'] / units, new THREE['LineBasicMaterial']({
            'color': '#000000',
            'depthTest': !0x1
        })));
        if (L['position']['set'](I / units, J / units, K / units),
        L['userData']['no_edges'] = 0x1,
        L['userData']['is_helper'] = 0x1,
        L['renderOrder'] = 0xb,
        this['userData']['helpers']['add'](L),
        this['userData']['helpers']['rotation']['copy'](this['userData']['own_object']['rotation']),
        0x1 == this['userData']['params']['helpers_visible'] && (this['userData']['helpers']['visible'] = !0x0),
        0x0 < G?.['length'] && B['spec']['show_index']) {
            let ak = 0x0;
            var I = B['pivot'];
            let al;
            var P = [], J, K, L;
            if (I && (J = 'string' == typeof I['x'] ? parseFloat(I['x']['split']('::')[0x0]) : I['x'],
            K = 'string' == typeof I['y'] ? parseFloat(I['y']['split']('::')[0x0]) : I['y'],
            L = 'string' == typeof I['z'] ? parseFloat(I['z']['split']('::')[0x0]) : I['z'],
            al = new THREE['Vector3']((J + 0x1) * q['size']['x'] / 0x2 / units,(K + 0x1) * q['size']['y'] / 0x2 / units,(L + 0x1) * q['size']['z'] / 0x2 / units)),
            0x0 < H['length']) {
                for (var Q of H)
                    P['push'](Q['face_index']);
            }
            for (let am = 0x0; am < G['length']; am++) {
                var R = G[0x0 === am ? G['length'] - 0x1 : am - 0x1]
                  , U = G[am]
                  , W = G[(am + 0x1) % G['length']]
                  , Z = (U['x'] + W['x']) / 0x2 / units
                  , a0 = (U['y'] + W['y']) / 0x2 / units;
                if (0x0 < U['radius']) {
                    var a1 = U['radius'] / units, a2 = R['x'] - U['x'], R = R['y'] - U['y'], a3 = W['x'] - U['x'], W = W['y'] - U['y'], a4 = Math['sqrt'](a2 * a2 + R * R) || 0x1, a5 = Math['sqrt'](a3 * a3 + W * W) || 0x1, a6 = U['x'] + a2 / a4 * U['radius'], a4 = U['y'] + R / a4 * U['radius'], a7 = U['x'] + a3 / a5 * U['radius'], a5 = U['y'] + W / a5 * U['radius'], a8 = (a6 + a7) / 0x2, a9 = (a4 + a5) / 0x2, aa = Math['sqrt']((a7 - a6) ** 0x2 + (a5 - a4) ** 0x2), ab = aa ? Math['sqrt'](Math['max'](U['radius'] * U['radius'] - Math['pow'](aa / 0x2, 0x2), 0x0)) : 0x0, ac = (a5 - a4) / Math['max'](aa, 0.0001), aa = -(a7 - a6) / Math['max'](aa, 0.0001), ad, a2 = 0x0 < a2 * W - R * a3, W = void 0x0 !== U['dir'] ? U['dir'] : a2;
                    let an, ao;
                    ao = !a2 && W ? (an = a8 - ac * ab,
                    a9 - aa * ab) : (an = a8 + ac * ab,
                    a9 + aa * ab);
                    var ae, af, R = (Math['atan2'](a4 - ao, a6 - an) + Math['atan2'](a5 - ao, a7 - an)) / 0x2, ag = (an + Math['cos'](R) * a1) / units, ah = (ao + Math['sin'](R) * a1) / units, ai = addFaceLabel(ak, P);
                    switch (B['spec']['orientation'][0x0]) {
                    case 'f':
                        ai['position']['set'](ag - al['x'], ah - al['y'], al['z']);
                        break;
                    case 'h':
                        ai['position']['set'](ag - al['x'], al['y'], ah - al['z']);
                        break;
                    case 'v':
                        ai['position']['set'](al['x'], ah - al['y'], ag - al['z']);
                        break;
                    }
                    this['userData']['helpers']['add'](ai),
                    ak++;
                }
                var aj = addFaceLabel(ak, P);
                switch (B['spec']['orientation'][0x0]) {
                case 'f':
                    aj['position']['set'](Z - al['x'], a0 - al['y'], al['z']);
                    break;
                case 'h':
                    aj['position']['set'](Z - al['x'], al['y'], a0 - al['z']);
                    break;
                case 'v':
                    aj['position']['set'](al['x'], a0 - al['y'], Z - al['z']);
                    break;
                }
                this['userData']['helpers']['add'](aj),
                ak++;
            }
        }
    }
    ['_apply_material']() {
        var f = this['userData']['computed'], g = f['material']['mat_params'], h, j;
        'f' === this['userData']['params']['spec']['orientation'] && (g['add_params']['model_width'] = f['size']['x'],
        g['add_params']['model_height'] = f['size']['y']),
        'h' === this['userData']['params']['spec']['orientation'] && (g['add_params']['model_width'] = f['size']['x'],
        g['add_params']['model_height'] = f['size']['y']),
        'v' === this['userData']['params']['spec']['orientation'] && (g['add_params']['model_width'] = f['size']['z'],
        g['add_params']['model_height'] = f['size']['y']),
        'rotated' == g['add_params']?.['rotation'] ? (0x0 == this['userData']['params']['spec']['material']['rotated'] && (g['add_params']['rotation'] = 'rotated'),
        0x1 == this['userData']['params']['spec']['material']['rotated'] && (g['add_params']['rotation'] = 'normal')) : (0x1 == this['userData']['params']['spec']['material']['rotated'] && (g['add_params']['rotation'] = 'rotated'),
        0x0 == this['userData']['params']['spec']['material']['rotated'] && (g['add_params']['rotation'] = 'normal'));
        let k = '';
        0x0 != this['userData']['params']['spec']['n_map'] && ((h = pp['libs']['decors']['find_item'](this['userData']['params']['spec']['n_map']))['params']['normalMap'] && (g['params']['normalMap'] = h['params']['normalMap'],
        g['add_params']['normal_map_width'] = h['add_params']['real_width'],
        g['add_params']['normal_map_height'] = h['add_params']['real_height'],
        g['add_params']['normal_stretch_width'] = h['add_params']['stretch_width'],
        g['add_params']['normal_stretch_height'] = h['add_params']['stretch_height'],
        g['add_params']['normal_scale'] = this['userData']['params']['spec']['n_scale']),
        k = this['userData']['params']['spec']['n_map']);
        for (let l = 0x0; l < this['userData']['own_object']['children']['length']; l++) {
            'Mesh' === this['userData']['own_object']['children'][l]['type'] && (dispose_material(this['userData']['own_object']['children'][l]['material']),
            j = create_material(g, f['material']['key'] + '_' + f['material']['id'] + '_' + k),
            this['userData']['own_object']['children'][l]['material'] = j);
        }
    }
    ['_get_specs'](g) {
        var j = pp['events']?.['cabinet']?.['before_create_spec_item'], k = pp['events']?.['cabinet']?.['after_create_spec_item'], q = this['userData']['computed'], w = this['userData']['params'], A;
        if ((g = g || {
            'all': {},
            'sum': {},
            'sum_arr': [],
            'aggr_funcs': {}
        },
        j) && !0x1 === j(w['type'], this, g))
            return g;
        this['_get_specs_accessories'](g);
        var B = {}
          , C = pp['libs']['materials'][q['material']['key']]['find_item'](q['material']['id'])
          , D = C['params']['variants'][q['material']['variant_id']];
        if (D) {
            var E = parse_int(D['width']), F = parse_int(D['height']), G = D['price_mode'], H = D['price_type'], I = D['price_acc_id'], J, J, K, L;
            let R = parse_num(D['price'])
              , S = ('c' === G && (J = accsessories_data['get_item_by_code'](D['code']),
            R = parse_num(J?.['price_per_piece'])),
            'a' === G && (J = accsessories_data['get_item'](I),
            R = parse_num(J?.['price_per_piece'])),
            module_utils['get_price_mod']('material', q['material']['key']));
            if (B['type'] = 'wall',
            B['id'] = q['material']['id'],
            B['key'] = q['material']['key'],
            B['key_name'] = pp['libs']['materials'][q['material']['key']]['name'],
            B['name'] = q['name'],
            B['code'] = q['code'],
            B['material_name'] = C['name'],
            B['material_code'] = C['code'],
            B['variant_id'] = q['material']['variant_id'],
            B['variant_name'] = D['name'],
            B['variant_code'] = D['code'],
            B['m2'] = q['real_size']['x'] * q['real_size']['y'] / 0x3e8 / 0x3e8,
            B['count'] = q['real_size']['x'] * q['real_size']['y'] / 0x3e8 / 0x3e8,
            B['price_type'] = H,
            B['price'] = R * S,
            B['width'] = E,
            B['height'] = F,
            B['size_x'] = q['real_size']['x'],
            B['size_z'] = q['real_size']['y'],
            B['butts'] = copy_object(this['userData']['butts_info']),
            B['size'] = q['real_size'],
            B['size_butts'] = q['size_without_butts'],
            B['sum_key'] = q['material']['key'] + '_' + q['material']['id'] + '_' + q['material']['variant_id'],
            k) {
                if (!0x1 === k(w['type'], this, g, B))
                    return g;
            }
            if (module_utils['add_spec_to_context'](g, B),
            B['butts'])
                for (var N of Object['keys'](B['butts'])) {
                    if (j) {
                        if (!0x1 === j('butts', this, g))
                            continue;
                    }
                    var O = copy_object(B['butts'][N]), N = (O['type'] = 'butts',
                    O['sum_key'] = N,
                    O['price'] = 0x0,
                    O['price_type'] = 'm',
                    O['width'] = parse_num(O['length']),
                    O['height'] = parse_num(O['height']),
                    O['size_x'] = parse_num(O['length']),
                    O['size_z'] = parse_num(O['height']),
                    pp['libs']['butts'][O['key']]?.['find_item'](O['id'])), N = N?.['params']?.['variants']?.[O['variant_id']], P, P, Q;
                    N && (O['price'] = parse_num(N['price']),
                    O['price_type'] = N['price_type'],
                    O['width'] = parse_int(N['width']),
                    'c' === N['price_mode'] && (P = accsessories_data['get_item_by_code'](N['code']),
                    O['price'] = parse_num(P?.['price_per_piece'])),
                    'a' === N['price_mode']) && (P = accsessories_data['get_item'](N['price_acc_id']),
                    O['price'] = parse_num(P?.['price_per_piece']));
                    let T = module_utils['get_price_mod']('butt', O['key']);
                    if (O['price'] *= T,
                    k) {
                        if (!0x1 === k('butts', this, g, O))
                            continue;
                    }
                    module_utils['add_spec_to_context'](g, O);
                }
        }
        return g;
    }
    ['_get_specs_accessories'](f) {
        let g = this
          , h = pp['events']?.['cabinet']?.['before_create_spec_item']
          , j = pp['events']?.['cabinet']?.['after_create_spec_item'];
        if (f = f || {
            'all': {},
            'sum': {},
            'sum_arr': [],
            'aggr_funcs': {}
        },
        this['userData']['params']['accessories']) {
            var k = this['userData']['params']['accessories'];
            if (k) {
                for (let v = 0x0; v < k['length']; v++)
                    u(f, k[v]);
            }
        }
        if (this['userData']['params']['accessories_default']) {
            var m = this['userData']['params']['accessories_default'];
            if (m) {
                for (let w = 0x0; w < m['length']; w++)
                    u(f, m[w]);
            }
        }
        if (this['userData']['params']['spec']['variants'] && this['userData']['params']['spec']['variants'][this['userData']['params']['spec']['selected_variant']]) {
            var n = this['userData']['params']['spec']['variants'][this['userData']['params']['spec']['selected_variant']]['accessories'];
            if (n) {
                for (let x = 0x0; x < n['length']; x++)
                    u(f, n[x]);
            }
        }
        if (this['userData']['params']['spec']['template'] && this['userData']['params']['spec']['template']['accessories']) {
            var q = this['userData']['params']['spec']['template']['accessories'];
            for (let y = 0x0; y < q['length']; y++)
                u(f, q[y]);
        }
        return f;
        function u(z, A) {
            var B = A['id'], A = A['count'], C;
            if (h && !0x1 === h('item', g, z))
                return;
            var B = accsessories_data['get_item'](B);
            if (B) {
                var D = module_utils['get_price_mod']('acc', null, B['category']), E;
                if (B['count'] = parse_int(A),
                B['price_type'] = 'p',
                B['type'] = 'item',
                B['price'] = parse_num(B['price_per_piece']) * D,
                B['sum_key'] = B['id'] + '_' + B['code'] + '_' + B['price_type'],
                j) {
                    if (!0x1 === j('item', g, z, B))
                        return;
                }
                module_utils['add_spec_to_context'](z, B);
            }
        }
    }
}
function resetUVs(f) {
    for (var g = f['getAttribute']('position'), h = f['getAttribute']('normal'), j = f['getAttribute']('uv'), k = 0x0; k < g['count']; k++) {
        var m = 0x0
          , n = 0x0
          , q = Math['abs'](h['getX'](k))
          , u = Math['abs'](h['getY'](k))
          , v = Math['abs'](h['getZ'](k));
        u <= q && v <= q && (m = g['getZ'](k),
        n = g['getY'](k)),
        q <= u && v <= u && (m = g['getX'](k),
        n = g['getZ'](k)),
        q <= v && u <= v && (m = g['getX'](k),
        n = g['getY'](k)),
        j['setXY'](k, m, n);
    }
}
function divide_extrude_groups(f) {
    f['clearGroups']();
    for (var g = [0x0, 0x0, 0x0], h = [null, null, null], j = 0x1; j <= f['attributes']['normal']['count']; j++) {
        var k, l = j - 0x1, m;
        switch (f['attributes']['normal']['array'][0x3 * j - 0x3 + 0x2]) {
        case 0x1:
            g[0x0]++,
            h[0x0] = null == h[0x0] ? l : h[0x0];
            break;
        case 0x0:
            g[0x1]++,
            h[0x1] = null == h[0x1] ? l : h[0x1];
            break;
        case -0x1:
            g[0x2]++,
            h[0x2] = null == h[0x2] ? l : h[0x2];
            break;
        }
    }
    f['addGroup'](h[0x0], g[0x0], 0x2),
    f['addGroup'](h[0x1], g[0x1], 0x1),
    f['addGroup'](h[0x2], g[0x2], 0x0);
}
function sort_contour_points(g) {
    var j = [], k = new Set(), q, w;
    for (q of g) {
        var A = q['x'] + ',' + q['y'];
        k['has'](A) || (k['add'](A),
        j['push'](q));
    }
    let B = j[0x0];
    for (w of j)
        (w['y'] > B['y'] || w['y'] === B['y'] && w['x'] < B['x']) && (B = w);
    var C = [B]
      , D = j['filter'](S => S !== B);
    let E = B
      , F = 'right';
    for (; 0x0 < D['length']; ) {
        let S = null
          , T = 0x1 / 0x0;
        var G = {
            'right': {
                'dx': 0x1,
                'dy': 0x0,
                'nextDir': 'up'
            },
            'up': {
                'dx': 0x0,
                'dy': -0x1,
                'nextDir': 'left'
            },
            'left': {
                'dx': -0x1,
                'dy': 0x0,
                'nextDir': 'down'
            },
            'down': {
                'dx': 0x0,
                'dy': 0x1,
                'nextDir': 'right'
            }
        }, {dx: H, dy: I} = G[F], J, K, L;
        for (J of D) {
            (Math['abs'](J['y'] - E['y']) < 0.001 || Math['abs'](J['x'] - E['x']) < 0.001) && 0x0 < (L = Math['abs'](H * (J['x'] - E['x']) + I * (J['y'] - E['y']))) && L < T && (0x0 <= H * (J['x'] - E['x']) || 0x0 <= I * (J['y'] - E['y'])) && (T = L,
            S = J);
        }
        if (F = (S && (C['push'](S),
        D['splice'](D['indexOf'](S), 0x1),
        E = S),
        G[F]['nextDir']),
        0x0 < D['length'] && !S && 'right' === F)
            break;
    }
    var N = [], O;
    for (let U = 0x0; U < C['length']; U++) {
        var P = C[(U - 0x1 + C['length']) % C['length']], Q, R;
        let W = C[U];
        isPointOnLine(P, W, C[(U + 0x1) % C['length']]) || N['push'](W);
    }
    return CabinetAnalyzer['is_clockwise'](N) && N['reverse'](),
    N;
}
function sort_contour_points_2(j) {
    var q = [], A = new Set(), B, C;
    for (B of j) {
        var E = B['x'] + ',' + B['y'];
        A['has'](E) || (A['add'](E),
        q['push'](B));
    }
    let F = q[0x0];
    for (C of q)
        (C['y'] > F['y'] || C['y'] === F['y'] && C['x'] < F['x']) && (F = C);
    var G = [F]
      , H = q['filter'](a3 => a3 !== F);
    let I = F
      , J = 'right';
    for (; 0x0 < H['length']; ) {
        let a3 = null
          , a4 = 0x1 / 0x0;
        var K = {
            'right': {
                'dx': 0x1,
                'dy': 0x0,
                'nextDir': 'up'
            },
            'up': {
                'dx': 0x0,
                'dy': -0x1,
                'nextDir': 'left'
            },
            'left': {
                'dx': -0x1,
                'dy': 0x0,
                'nextDir': 'down'
            },
            'down': {
                'dx': 0x0,
                'dy': 0x1,
                'nextDir': 'right'
            }
        }, {dx: L, dy: N} = K[J], O = 0.001, P;
        for (P of H) {
            var Q = P['x'] - I['x'], R = P['y'] - I['y'], S = Math['hypot'](Q, R), T, U;
            S < O || L * (Q / S) + N * (R / S) <= 0.001 || 0x0 < S && S < a4 && (a4 = S,
            a3 = P);
        }
        if (J = (a3 && (G['push'](a3),
        H['splice'](H['indexOf'](a3), 0x1),
        I = a3),
        K[J]['nextDir']),
        0x0 < H['length'] && !a3 && 'right' === J)
            break;
    }
    var W = [], Z;
    for (let a5 = 0x0; a5 < G['length']; a5++) {
        var a0 = G[(a5 - 0x1 + G['length']) % G['length']], a1, a2;
        let a6 = G[a5];
        isPointOnLine(a0, a6, G[(a5 + 0x1) % G['length']]) || W['push'](a6);
    }
    return CabinetAnalyzer['is_clockwise'](W) && W['reverse'](),
    W;
}
function isPointOnLine(f, g, h) {
    var i;
    return 0.5 * Math['abs'](f['x'] * (g['y'] - h['y']) + g['x'] * (h['y'] - f['y']) + h['x'] * (f['y'] - g['y'])) < 0.1;
}
function addFaceLabel(f, g) {
    var h = document['createElement']('div')
      , g = (h['style']['display'] = 'flex',
    h['style']['alignItems'] = 'center',
    h['style']['justifyContent'] = 'center',
    h['style']['width'] = '20px',
    h['style']['height'] = '20px',
    0x0 < g['length'] && g['includes'](f) ? h['style']['background'] = 'green' : h['style']['background'] = 'black',
    h['style']['color'] = 'white',
    h['style']['borderRadius'] = '4px',
    h['style']['fontSize'] = '12px',
    h['style']['fontFamily'] = 'Arial,\x20sans-serif',
    h['style']['fontWeight'] = 'bold',
    h['style']['textAlign'] = 'center',
    h['style']['lineHeight'] = '20px',
    h['style']['boxSizing'] = 'border-box',
    h['style']['transform'] = 'translate(-50%,\x20-50%)',
    h['textContent'] = f + 0x1,
    new THREE['CSS2DObject'](h));
    return g['userData']['is_helper'] = !0x0,
    g['layers']['set'](0x1),
    g['renderOrder'] = 0x14,
    g;
}
function buildContourCCW(f, g, j=[], k=[]) {
    var m = G => {
        var H = new Map(), I;
        for (I of G) {
            var J = I['o']['value'];
            H['set'](J, {
                'd1': Number(I['d1'] ? I['d1']['value'] : I['d1'] ?? 0x0),
                'd2': Number(I['d2'] ? I['d2']['value'] : I['d2'] ?? 0x0),
                'r': Number(I['r'] ? I['r']['value'] : I['r'] ?? 0x0),
                'r_concave': Number(I['r_concave'] ? I['r_concave']['value'] : I['r_concave'] ?? 0x0)
            });
        }
        return H;
    }
      , j = m(j)
      , m = m(k);
    let q = [];
    var k = G => {
        q['length'] && q[q['length'] - 0x1]['x'] === G['x'] && q[q['length'] - 0x1]['y'] === G['y'] || q['push'](G);
    }
    , v = G => {
        if (G['length'] < 0x3)
            return G['slice']();
        var H = []
          , I = (N, O, P) => N['x'] === O['x'] && O['x'] === P['x'] || N['y'] === O['y'] && O['y'] === P['y'];
        for (let N = 0x0; N < G['length']; N++) {
            var J = G[(N - 0x1 + G['length']) % G['length']], K = G[N], L;
            I(J, K, G[(N + 0x1) % G['length']]) || H['push'](K);
        }
        return H;
    }
    , w, x, z, A, w, A, x, z, w, A, x, w, B, x, z, A, w, x, C, z, x, A, w, z, f, x, D, E = (k({
        'x': 0x0,
        'y': 0x0,
        'radius': 0x0
    }),
    j['has']('cbl') ? ({d1: w, d2: x, r: z, r_concave: A} = j['get']('cbl'),
    k({
        'x': 0x0,
        'y': w,
        'radius': z,
        'dir': !0x0
    }),
    k({
        'x': x,
        'y': w,
        'radius': A,
        'dir': !0x1
    }),
    k({
        'x': x,
        'y': 0x0,
        'radius': z,
        'dir': !0x0
    })) : m['has']('cbl') && ({d1: w, d2: A} = m['get']('cbl'),
    k({
        'x': 0x0,
        'y': w,
        'radius': 0x0
    }),
    k({
        'x': A,
        'y': 0x0,
        'radius': 0x0
    })),
    j['has']('cbr') || m['has']('cbr') ? (x = (j['has']('cbr') ? j : m)['get']('cbr')['d2'],
    k({
        'x': Math['max'](0x0, f - x),
        'y': 0x0,
        'radius': 0x0
    })) : k({
        'x': f,
        'y': 0x0,
        'radius': 0x0
    }),
    j['has']('cbr') ? ({d1: z, d2: w, r: A, r_concave: x} = j['get']('cbr'),
    k({
        'x': f - w,
        'y': z,
        'radius': x,
        'dir': !0x1
    }),
    k({
        'x': f,
        'y': z,
        'radius': A,
        'dir': !0x0
    })) : m['has']('cbr') && ({d1: w, d2: B} = m['get']('cbr'),
    k({
        'x': f,
        'y': w,
        'radius': 0x0
    })),
    j['has']('ctr') || m['has']('ctr') ? (x = (j['has']('ctr') ? j : m)['get']('ctr')['d1'],
    k({
        'x': f,
        'y': Math['max'](0x0, g - x),
        'radius': 0x0
    })) : k({
        'x': f,
        'y': g,
        'radius': 0x0
    }),
    j['has']('ctr') ? ({d1: z, d2: A, r: w, r_concave: x} = j['get']('ctr'),
    k({
        'x': f - A,
        'y': g - z,
        'radius': x,
        'dir': !0x1
    }),
    k({
        'x': f - A,
        'y': g,
        'radius': w,
        'dir': !0x0
    })) : m['has']('ctr') && ({d1: C, d2: z} = m['get']('ctr'),
    k({
        'x': f - z,
        'y': g,
        'radius': 0x0
    })),
    j['has']('ctl') || m['has']('ctl') ? (x = (j['has']('ctl') ? j : m)['get']('ctl')['d2'],
    k({
        'x': Math['min'](f, x),
        'y': g,
        'radius': 0x0
    })) : k({
        'x': 0x0,
        'y': g,
        'radius': 0x0
    }),
    j['has']('ctl') ? ({d1: A, d2: w, r: z, r_concave: f} = j['get']('ctl'),
    k({
        'x': w,
        'y': g - A,
        'radius': f,
        'dir': !0x1
    }),
    k({
        'x': 0x0,
        'y': g - A,
        'radius': z,
        'dir': !0x0
    })) : m['has']('ctl') && ({d1: x, d2: D} = m['get']('ctl'),
    k({
        'x': 0x0,
        'y': g - x,
        'radius': 0x0
    })),
    k({
        'x': 0x0,
        'y': 0x0,
        'radius': 0x0
    }),
    []), F, j, w;
    for (F of q)
        E['length'] && E[E['length'] - 0x1]['x'] === F['x'] && E[E['length'] - 0x1]['y'] === F['y'] || E['push'](F);
    return 0x1 < E['length'] && (j = E[0x0])['x'] === (w = E[E['length'] - 0x1])['x'] && j['y'] === w['y'] && E['pop'](),
    v(E);
}
class ConditionChecker {
    static['check'](e, f) {
        let g = {
            '==': (h, i) => h == i,
            '!=': (h, i) => h != i,
            '>': (h, i) => i < h,
            '>=': (h, i) => i <= h,
            '<': (h, i) => h < i,
            '<=': (h, i) => h <= i
        };
        if (Array['isArray'](e) && 'object' == typeof f && null !== f)
            return e['some'](h => h['every'](i => {
                var j = comp2(i['f'], f)
                  , k = i['o']
                  , i = i['v'];
                if (k in g)
                    return g[k](j, i);
                throw new Error('Неизвестный\x20оператор:\x20' + k);
            }
            ));
        throw new Error('Некорректные\x20входные\x20данные');
    }
}
class Converter {
    ['modules_options'] = null;
    constructor() {
        this['set_default_modules_options']();
    }
    ['set_default_modules_options'](f) {
        var g = this['get_bottom_modules_defaults']();
        return f = fill_defaults(copy_object(f || {}), g),
        this['modules_options'] = f;
    }
    ['get_top_modules_defaults']() {
        return {
            'module_template': {
                'id': 0x3,
                'key': 'shablony_korpusov',
                'paths': {
                    'tabletop': '0,0',
                    'lockers_parent': 'box_one',
                    'shelves_parent': 'fill_one',
                    'walls_parent': '0,0,1',
                    'doors_parent': 'facad_one'
                }
            },
            'locker_template': {
                'id': 0x8,
                'key': 'locker'
            },
            'shelf_template': {
                'id': 0x1,
                'key': 'shelves'
            },
            'shelf_glass_template': {
                'id': 0x4,
                'key': 'shelves'
            },
            'wall_template': {
                'id': 0x6,
                'key': 'shelves'
            },
            'left_door_template': {
                'id': 0x1,
                'key': 'door'
            },
            'right_door_template': {
                'id': 0x2,
                'key': 'door'
            },
            'bottom_door_template': {
                'id': 0x9,
                'key': 'door'
            },
            'top_door_template': {
                'id': 0x8,
                'key': 'door'
            }
        };
    }
    ['get_bottom_modules_defaults']() {
        return {
            'module_template': {
                'id': 0x1,
                'key': 'shablony_korpusov',
                'paths': {
                    'tabletop': '0,0,1,0',
                    'lockers_parent': 'box_one',
                    'shelves_parent': 'fill_one',
                    'walls_parent': 'fill_one',
                    'doors_parent': 'facad_one'
                }
            },
            'locker_template': {
                'id': 0x1,
                'key': 'drawer_templates'
            },
            'shelf_template': {
                'id': 0x1,
                'key': 'shelves'
            },
            'shelf_glass_template': {
                'id': 0x4,
                'key': 'shelves'
            },
            'wall_template': {
                'id': 0x6,
                'key': 'shelves'
            },
            'left_door_template': {
                'id': 0x1,
                'key': 'door'
            },
            'right_door_template': {
                'id': 0x2,
                'key': 'door'
            },
            'bottom_door_template': {
                'id': 0x9,
                'key': 'door'
            },
            'top_door_template': {
                'id': 0x8,
                'key': 'door'
            }
        };
    }
    ['convert_top_modules'](f) {
        var g = this['get_top_modules_defaults'](), h;
        return this['convert_modules'](g, i => {
            var j = i['params']
              , i = i['params']?.['cabinet']
              , k = j?.['variants']?.[j?.['selected_variant'] || 0x0];
            return !!(j && i && k) && !('top' !== j['cabinet_group'] || i['type'] && 'common' !== i['type']);
        }
        , f);
    }
    ['convert_bottom_modules'](f) {
        var g = this['get_bottom_modules_defaults'](), h;
        return this['convert_modules'](g, i => {
            var j = i['params'], i = i['params']?.['cabinet'], k = j?.['variants']?.[j?.['selected_variant'] || 0x0], j;
            return !!(j && i && k) && !(j['cabinet_group'] && 'bottom' !== j['cabinet_group'] || i['type'] && 'common' !== i['type'] || (j = parseFloat(k['height']),
            !Number['isFinite'](j)) || 0x708 < j);
        }
        , f);
    }
    ['get_penal_modules_defaults']() {
        return {
            'module_template': {
                'id': 0x2,
                'key': 'shablony_korpusov',
                'paths': {
                    'tabletop': '0,0,1,0',
                    'lockers_parent': 'box_one',
                    'shelves_parent': 'fill_one',
                    'walls_parent': 'fill_one',
                    'doors_parent': 'facad_one'
                }
            },
            'locker_template': {
                'id': 0x1,
                'key': 'drawer_templates'
            },
            'shelf_template': {
                'id': 0x1,
                'key': 'shelves'
            },
            'wall_template': {
                'id': 0x6,
                'key': 'shelves'
            },
            'left_door_template': {
                'id': 0x1,
                'key': 'door'
            },
            'right_door_template': {
                'id': 0x2,
                'key': 'door'
            },
            'bottom_door_template': {
                'id': 0x9,
                'key': 'door'
            },
            'top_door_template': {
                'id': 0x8,
                'key': 'door'
            }
        };
    }
    ['convert_penal_modules'](f) {
        var g = this['get_penal_modules_defaults'](), h;
        return this['convert_modules'](g, i => {
            var j = i['params'], i = i['params']?.['cabinet'], k = j?.['variants']?.[j?.['selected_variant'] || 0x0], j;
            return !!(j && i && k) && !(j['cabinet_group'] && 'bottom' !== j['cabinet_group'] || i['type'] && 'common' !== i['type'] || (j = parseFloat(k['height']),
            !Number['isFinite'](j)) || j <= 0x708);
        }
        , f);
    }
    ['get_corner_straight_top_left_modules_defaults']() {
        return {
            'module_template': {
                'id': 0x18,
                'key': 'shablony_korpusov',
                'paths': {
                    'tabletop': '0,0,1,0',
                    'lockers_parent': 'box_one',
                    'shelves_parent': 'fill_one',
                    'walls_parent': 'fill_one',
                    'doors_parent': 'facad_one'
                }
            },
            'locker_template': {
                'id': 0x1,
                'key': 'drawer_templates'
            },
            'shelf_template': {
                'id': 0x1,
                'key': 'shelves'
            },
            'wall_template': {
                'id': 0x6,
                'key': 'shelves'
            },
            'left_door_template': {
                'id': 0x4,
                'key': 'doors_ugol'
            },
            'right_door_template': {
                'id': 0x5,
                'key': 'doors_ugol'
            },
            'bottom_door_template': {
                'id': 0x9,
                'key': 'door'
            },
            'top_door_template': {
                'id': 0x8,
                'key': 'door'
            }
        };
    }
    ['get_corner_straight_top_right_modules_defaults']() {
        return {
            'module_template': {
                'id': 0x14,
                'key': 'shablony_korpusov',
                'paths': {
                    'tabletop': '0,0,1,0',
                    'lockers_parent': 'box_one',
                    'shelves_parent': 'fill_one',
                    'walls_parent': 'fill_one',
                    'doors_parent': 'facad_one'
                }
            },
            'locker_template': {
                'id': 0x1,
                'key': 'drawer_templates'
            },
            'shelf_template': {
                'id': 0x1,
                'key': 'shelves'
            },
            'wall_template': {
                'id': 0x6,
                'key': 'shelves'
            },
            'left_door_template': {
                'id': 0x5,
                'key': 'doors_ugol'
            },
            'right_door_template': {
                'id': 0x4,
                'key': 'doors_ugol'
            },
            'bottom_door_template': {
                'id': 0x9,
                'key': 'door'
            },
            'top_door_template': {
                'id': 0x8,
                'key': 'door'
            }
        };
    }
    ['convert_corner_straight_top_left_modules'](f) {
        var g = this['get_corner_straight_top_left_modules_defaults'](), h;
        return this['convert_modules'](g, i => {
            var j = i['params'], i = i['params']?.['cabinet'], k = j?.['variants']?.[j?.['selected_variant'] || 0x0], j;
            return !!(j && i && k) && !(j['cabinet_group'] && 'top' !== j['cabinet_group'] || i['type'] && 'corner_straight' !== i['type'] || 'left' != i['orientation'] || (j = parseFloat(k['height']),
            !Number['isFinite'](j)));
        }
        , f);
    }
    ['convert_corner_straight_top_right_modules'](f) {
        var g = this['get_corner_straight_top_right_modules_defaults'](), h;
        return this['convert_modules'](g, i => {
            var j = i['params'], i = i['params']?.['cabinet'], k = j?.['variants']?.[j?.['selected_variant'] || 0x0], j;
            return !!(j && i && k) && !(j['cabinet_group'] && 'top' !== j['cabinet_group'] || i['type'] && 'corner_straight' !== i['type'] || 'right' != i['orientation'] || (j = parseFloat(k['height']),
            !Number['isFinite'](j)));
        }
        , f);
    }
    ['get_corner_straight_bottom_left_modules_defaults']() {
        return {
            'module_template': {
                'id': 0x27,
                'key': 'shablony_korpusov',
                'paths': {
                    'tabletop': '0,0,1,0',
                    'lockers_parent': 'box_one',
                    'shelves_parent': 'fill_one',
                    'walls_parent': 'fill_one',
                    'doors_parent': 'facad_one'
                }
            },
            'locker_template': {
                'id': 0x1,
                'key': 'drawer_templates'
            },
            'shelf_template': {
                'id': 0x1,
                'key': 'shelves'
            },
            'wall_template': {
                'id': 0x6,
                'key': 'shelves'
            },
            'left_door_template': {
                'id': 0x4,
                'key': 'doors_ugol'
            },
            'right_door_template': {
                'id': 0x5,
                'key': 'doors_ugol'
            },
            'bottom_door_template': {
                'id': 0x9,
                'key': 'door'
            },
            'top_door_template': {
                'id': 0x8,
                'key': 'door'
            }
        };
    }
    ['get_corner_straight_bottom_right_modules_defaults']() {
        return {
            'module_template': {
                'id': 0x26,
                'key': 'shablony_korpusov',
                'paths': {
                    'tabletop': '0,0,1,0',
                    'lockers_parent': 'box_one',
                    'shelves_parent': 'fill_one',
                    'walls_parent': 'fill_one',
                    'doors_parent': 'facad_one'
                }
            },
            'locker_template': {
                'id': 0x1,
                'key': 'drawer_templates'
            },
            'shelf_template': {
                'id': 0x1,
                'key': 'shelves'
            },
            'wall_template': {
                'id': 0x6,
                'key': 'shelves'
            },
            'left_door_template': {
                'id': 0x5,
                'key': 'doors_ugol'
            },
            'right_door_template': {
                'id': 0x4,
                'key': 'doors_ugol'
            },
            'bottom_door_template': {
                'id': 0x9,
                'key': 'door'
            },
            'top_door_template': {
                'id': 0x8,
                'key': 'door'
            }
        };
    }
    ['convert_corner_straight_bottom_left_modules'](f) {
        var g = this['get_corner_straight_bottom_left_modules_defaults'](), h;
        return this['convert_modules'](g, i => {
            var j = i['params'], i = i['params']?.['cabinet'], k = j?.['variants']?.[j?.['selected_variant'] || 0x0], j;
            return !!(j && i && k) && !(j['cabinet_group'] && 'bottom' !== j['cabinet_group'] || i['type'] && 'corner_straight' !== i['type'] || 'left' != i['orientation'] || (j = parseFloat(k['height']),
            !Number['isFinite'](j)));
        }
        , f);
    }
    ['convert_corner_straight_bottom_right_modules'](f) {
        var g = this['get_corner_straight_bottom_right_modules_defaults'](), h;
        return this['convert_modules'](g, i => {
            var j = i['params'], i = i['params']?.['cabinet'], k = j?.['variants']?.[j?.['selected_variant'] || 0x0], j;
            return !!(j && i && k) && !(j['cabinet_group'] && 'bottom' !== j['cabinet_group'] || i['type'] && 'corner_straight' !== i['type'] || 'right' != i['orientation'] || (j = parseFloat(k['height']),
            !Number['isFinite'](j)));
        }
        , f);
    }
    ['get_corner_top_modules_defaults']() {
        return {
            'module_template': {
                'id': 0x32,
                'key': 'shablony_korpusov',
                'paths': {
                    'tabletop': '0,0,1,0',
                    'lockers_parent': 'box_one',
                    'shelves_parent': 'fill_trap',
                    'walls_parent': 'fill_one',
                    'doors_parent': 'facad_one'
                }
            },
            'locker_template': {
                'id': 0x1,
                'key': 'drawer_templates'
            },
            'shelf_template': {
                'id': 0x1,
                'key': 'c33'
            },
            'wall_template': {
                'id': 0x1,
                'key': 'c33'
            },
            'left_door_template': {
                'id': 0x1,
                'key': 'c32'
            },
            'right_door_template': {
                'id': 0x2,
                'key': 'c32'
            },
            'bottom_door_template': {
                'id': 0x9,
                'key': 'door'
            },
            'top_door_template': {
                'id': 0x8,
                'key': 'door'
            }
        };
    }
    ['get_corner_bottom_modules_defaults']() {
        return {
            'module_template': {
                'id': 0x33,
                'key': 'shablony_korpusov',
                'paths': {
                    'tabletop': '0,0,1,0',
                    'lockers_parent': 'box_one',
                    'shelves_parent': 'fill_one',
                    'walls_parent': 'fill_one',
                    'doors_parent': 'facad_one'
                }
            },
            'locker_template': {
                'id': 0x1,
                'key': 'drawer_templates'
            },
            'shelf_template': {
                'id': 0x1,
                'key': 'c33'
            },
            'wall_template': {
                'id': 0x1,
                'key': 'c33'
            },
            'left_door_template': {
                'id': 0x1,
                'key': 'c32'
            },
            'right_door_template': {
                'id': 0x2,
                'key': 'c32'
            },
            'bottom_door_template': {
                'id': 0x9,
                'key': 'door'
            },
            'top_door_template': {
                'id': 0x8,
                'key': 'door'
            }
        };
    }
    ['convert_corner_bottom_modules'](f) {
        var g = this['get_corner_bottom_modules_defaults']()
          , h = i => {
            var j = i['params'], i = i['params']?.['cabinet'], k = j?.['variants']?.[j?.['selected_variant'] || 0x0], j;
            return !!(j && i && k) && !(j['cabinet_group'] && 'bottom' !== j['cabinet_group'] || i['type'] && 'corner' !== i['type'] || !i['type'] || i['type'] && 0x1 == i['inner_radius'] || (j = parseFloat(k['height']),
            !Number['isFinite'](j)));
        }
        ;
        if (!(0x64 < h['length']))
            return this['convert_modules'](g, h, f);
    }
    ['convert_corner_top_modules'](f) {
        var g = this['get_corner_top_modules_defaults'](), h;
        return this['convert_modules'](g, i => {
            var j = i['params'], i = i['params']?.['cabinet'], k = j?.['variants']?.[j?.['selected_variant'] || 0x0], j;
            return !!(j && i && k) && !(j['cabinet_group'] && 'top' !== j['cabinet_group'] || i['type'] && 'corner' !== i['type'] || !i['type'] || i['type'] && 0x1 == i['inner_radius'] || (j = parseFloat(k['height']),
            !Number['isFinite'](j)));
        }
        , f);
    }
    ['get_end_radius_open_top_left_modules_defaults']() {
        return {
            'module_template': {
                'id': 0x2f,
                'key': 'shablony_korpusov',
                'paths': {
                    'shelves_parent': 'fill_radius_left',
                    'walls_parent': 'fill_radius_left'
                }
            },
            'shelf_template': {
                'id': 0x2,
                'key': 'c29'
            },
            'wall_template': {
                'id': 0x2,
                'key': 'c29'
            }
        };
    }
    ['get_end_radius_open_top_right_modules_defaults']() {
        return {
            'module_template': {
                'id': 0x2e,
                'key': 'shablony_korpusov',
                'paths': {
                    'shelves_parent': 'fill_radius',
                    'walls_parent': 'fill_radius'
                }
            },
            'shelf_template': {
                'id': 0x1,
                'key': 'c29'
            },
            'wall_template': {
                'id': 0x1,
                'key': 'c29'
            }
        };
    }
    ['convert_end_radius_open_top_left_modules'](f) {
        var g = this['get_end_radius_open_top_left_modules_defaults'](), h;
        return this['convert_modules'](g, i => {
            var j = i['params'], i = i['params']?.['cabinet'], k = j?.['variants']?.[j?.['selected_variant'] || 0x0], k;
            return !!(j && i && k) && (k = parseFloat(k['height']),
            !!Number['isFinite'](k)) && 'top' == j['cabinet_group'] && 'end_radius_open' == i['type'] && 'left' == i['orientation'];
        }
        , f);
    }
    ['convert_end_radius_open_top_right_modules'](f) {
        var g = this['get_end_radius_open_top_right_modules_defaults'](), h;
        return this['convert_modules'](g, i => {
            var j = i['params'], i = i['params']?.['cabinet'], k = j?.['variants']?.[j?.['selected_variant'] || 0x0], k;
            return !!(j && i && k) && (k = parseFloat(k['height']),
            !!Number['isFinite'](k)) && 'top' == j['cabinet_group'] && 'end_radius_open' == i['type'] && 'left' != i['orientation'];
        }
        , f);
    }
    ['get_end_radius_open_bottom_left_modules_defaults']() {
        return {
            'module_template': {
                'id': 0x12,
                'key': 'shablony_korpusov',
                'paths': {
                    'shelves_parent': 'torc_left',
                    'walls_parent': 'torc_left'
                }
            },
            'shelf_template': {
                'id': 0x2,
                'key': 'c29'
            },
            'wall_template': {
                'id': 0x2,
                'key': 'c29'
            }
        };
    }
    ['get_end_radius_open_bottom_right_modules_defaults']() {
        return {
            'module_template': {
                'id': 0x1b,
                'key': 'shablony_korpusov',
                'paths': {
                    'shelves_parent': 'torc_right',
                    'walls_parent': 'torc_right'
                }
            },
            'shelf_template': {
                'id': 0x1,
                'key': 'c29'
            },
            'wall_template': {
                'id': 0x1,
                'key': 'c29'
            }
        };
    }
    ['convert_end_radius_open_bottom_left_modules'](f) {
        var g = this['get_end_radius_open_bottom_left_modules_defaults'](), h;
        return this['convert_modules'](g, i => {
            var j = i['params'], i = i['params']?.['cabinet'], k = j?.['variants']?.[j?.['selected_variant'] || 0x0], k;
            return !!(j && i && k) && (k = parseFloat(k['height']),
            !!Number['isFinite'](k)) && 'top' != j['cabinet_group'] && 'end_radius_open' == i['type'] && 'left' == i['orientation'];
        }
        , f);
    }
    ['convert_end_radius_open_bottom_right_modules'](f) {
        var g = this['get_end_radius_open_bottom_right_modules_defaults'](), h;
        return this['convert_modules'](g, i => {
            var j = i['params'], i = i['params']?.['cabinet'], k = j?.['variants']?.[j?.['selected_variant'] || 0x0], k;
            return !!(j && i && k) && (k = parseFloat(k['height']),
            !!Number['isFinite'](k)) && 'top' != j['cabinet_group'] && 'end_radius_open' == i['type'] && 'left' != i['orientation'];
        }
        , f);
    }
    ['get_end_corner_open_bottom_left_modules_defaults']() {
        return {
            'module_template': {
                'id': 0x35,
                'key': 'shablony_korpusov',
                'paths': {
                    'shelves_parent': 'torc_left',
                    'walls_parent': 'torc_left'
                }
            },
            'shelf_template': {
                'id': 0x1,
                'key': 'c37'
            },
            'wall_template': {
                'id': 0x1,
                'key': 'c37'
            }
        };
    }
    ['get_end_corner_open_bottom_right_modules_defaults']() {
        return {
            'module_template': {
                'id': 0x36,
                'key': 'shablony_korpusov',
                'paths': {
                    'shelves_parent': 'torc_right',
                    'walls_parent': 'torc_right'
                }
            },
            'shelf_template': {
                'id': 0x2,
                'key': 'c37'
            },
            'wall_template': {
                'id': 0x2,
                'key': 'c37'
            }
        };
    }
    ['convert_corner_open_bottom_left_modules'](f) {
        var g = this['get_end_corner_open_bottom_left_modules_defaults'](), h;
        return this['convert_modules'](g, i => {
            var j = i['params'], i = i['params']?.['cabinet'], k = j?.['variants']?.[j?.['selected_variant'] || 0x0], k;
            return !!(j && i && k) && (k = parseFloat(k['height']),
            !!Number['isFinite'](k)) && 'top' != j['cabinet_group'] && 'corner_open' == i['type'] && 'left' == i['orientation'];
        }
        , f);
    }
    ['convert_corner_open_bottom_right_modules'](f) {
        var g = this['get_end_corner_open_bottom_right_modules_defaults'](), h;
        return this['convert_modules'](g, i => {
            var j = i['params'], i = i['params']?.['cabinet'], k = j?.['variants']?.[j?.['selected_variant'] || 0x0], k;
            return !!(j && i && k) && (k = parseFloat(k['height']),
            !!Number['isFinite'](k)) && 'top' != j['cabinet_group'] && 'corner_open' == i['type'] && 'left' != i['orientation'];
        }
        , f);
    }
    ['get_end_corner_facade_bottom_left_modules_defaults']() {
        return {
            'module_template': {
                'id': 0x3c,
                'key': 'shablony_korpusov',
                'paths': {
                    'shelves_parent': 'torc_left',
                    'walls_parent': 'torc_left',
                    'doors_parent': 'facad_one'
                }
            },
            'shelf_template': {
                'id': 0x1,
                'key': 'c36'
            },
            'wall_template': {
                'id': 0x1,
                'key': 'c36'
            },
            'left_door_template': {
                'id': 0x1,
                'key': 'door'
            },
            'right_door_template': {
                'id': 0x2,
                'key': 'door'
            }
        };
    }
    ['get_end_corner_facade_bottom_right_modules_defaults']() {
        return {
            'module_template': {
                'id': 0x39,
                'key': 'shablony_korpusov',
                'paths': {
                    'shelves_parent': 'torc_right',
                    'walls_parent': 'torc_right'
                }
            },
            'shelf_template': {
                'id': 0x2,
                'key': 'c36'
            },
            'wall_template': {
                'id': 0x2,
                'key': 'c36'
            }
        };
    }
    ['convert_end_corner_facade_bottom_left_modules'](f) {
        var g = this['get_end_corner_facade_bottom_left_modules_defaults'](), h;
        return this['convert_modules'](g, i => {
            var j = i['params'], i = i['params']?.['cabinet'], k = j?.['variants']?.[j?.['selected_variant'] || 0x0], k;
            return !!(j && i && k) && (k = parseFloat(k['height']),
            !!Number['isFinite'](k)) && 'top' != j['cabinet_group'] && 'end_corner_facade' == i['type'] && 'left' == i['orientation'];
        }
        , f);
    }
    ['convert_end_corner_facade_bottom_right_modules'](f) {
        var g = this['get_end_corner_facade_bottom_right_modules_defaults'](), h;
        return this['convert_modules'](g, i => {
            var j = i['params'], i = i['params']?.['cabinet'], k = j?.['variants']?.[j?.['selected_variant'] || 0x0], k;
            return !!(j && i && k) && (k = parseFloat(k['height']),
            !!Number['isFinite'](k)) && 'top' != j['cabinet_group'] && 'end_corner_facade' == i['type'] && 'left' != i['orientation'];
        }
        , f);
    }
    ['convert_all_modules'](f) {
        this['convert_bottom_modules']();
    }
    ['convert_modules'](f, g, h) {
        f = this['set_default_modules_options'](f),
        g = g || (n => {
            var p = n['params'], n = n['params']?.['cabinet'], q = p?.['variants']?.[p?.['selected_variant'] || 0x0], p;
            return !!(p && n && q) && !(p['cabinet_group'] && 'bottom' !== p['cabinet_group'] || n['type'] && 'common' !== n['type'] || (p = parseFloat(q['height']),
            !Number['isFinite'](p)) || 0x708 < p);
        }
        ),
        h = void 0x0 !== h ? h : pp['libs']['modules']['items_arr'];
        var j = {
            'count': 0x0,
            'ids': []
        }
          , k = [];
        for (let n = 0x0; n < h['length']; n++) {
            var l = h[n], m;
            g(l) && (m = this['convert_module_item'](l)) && (m['id'] = h[n]['id'],
            h[n]['params'] = m,
            k['push'](h[n]),
            j['ids']['push'](l['id']));
        }
        return j['count'] = j['ids']['length'],
        k;
    }
    ['convert_module_item'](D) {
        let E = this
          , G = this['modules_options'];
        if (G) {
            let Z = D['params'];
            var H = Z['variants'] || [], J = Z['sizes_limit'], K;
            let a0 = pp['libs']['catalogs'][G['module_template']['key']]?.['items']?.[G['module_template']['id']]
              , a1 = G['module_template']['id']
              , a2 = G['module_template']['key']
              , a3 = 0x0;
            if (Z['fixed_models'])
                for (let ak = 0x0; ak < Z['fixed_models']['length']; ak++) {
                    if ('/common_assets/models/dishwasher.fbx' == Z['fixed_models'][ak]['model']) {
                        a3 = 0x1;
                        break;
                    }
                }
            a3 && (a0 = pp['libs']['catalogs']['shablony_korpusov']['items'][0x2c],
            a1 = 0x2c,
            a2 = 'shablony_korpusov');
            let a4, a5;
            a0?.['params'] && (a4 = a0['params']['spec']?.['cabinet_tag'],
            a5 = a0['params']['variables']);
            var L = merge(copy_object(pp['engine']['item_def_params']['module']), {
                'name': '',
                'icon': D['icon'],
                'spec': {
                    'cabinet_tag': a4 || 'bottom',
                    'cabinet_group': Z['cabinet_group']
                },
                'variables': a5 && copy_object(a5)
            });
            L['variables'] && (L['variables']['visible'] = 0x1),
            L['spec']['variants'] = [],
            L['variables']['main'] = fix_json_empty_object(L['variables']['main']);
            let a6 = L['variables']['main'];
            L['spec']['templates'] = [{
                'name': '',
                'code': '',
                'min': {
                    'x': 0x0,
                    'y': 0x0,
                    'z': 0x0
                },
                'max': {
                    'x': 0x0,
                    'y': 0x0,
                    'z': 0x0
                },
                'template': {
                    'tree': [],
                    'accessories': []
                }
            }];
            var P = L['spec']['templates'][0x0], Q;
            let a7 = {
                'children': P['template']['tree']
            };
            var R = {
                'type': 'module',
                'name': 'Шаблон\x20модуля',
                'spec': {
                    'id': a1,
                    'element_type': a2,
                    'fill_content': {}
                },
                'size': {
                    'x': 's:x',
                    'y': 's:y',
                    'z': 's:z'
                },
                'pos': {
                    'x': 0x0,
                    'y': 0x0,
                    'z': 0x0
                },
                'pivot': {
                    'x': -0x1,
                    'y': -0x1,
                    'z': -0x1
                }
            };
            a7['children']['push'](R),
            J && (P['min']['x'] = J['min_width'] || 0x0,
            P['min']['y'] = J['min_height'] || 0x0,
            P['min']['z'] = J['min_depth'] || 0x0,
            P['max']['x'] = J['max_width'] || 0x0,
            P['max']['y'] = J['max_height'] || 0x0,
            P['max']['z'] = J['max_depth'] || 0x0),
            L['resizable']['enabled'] = to_int(Z['free_size']);
            let a8 = 0x0;
            ac();
            var S = L['spec']['variants'], R;
            for (let al of H) {
                var T = {
                    'back': 0x23,
                    'front': 0x23
                };
                D['params']['tabletop'] && D['params']['tabletop']['offset'] && (D['params']['tabletop']['offset']['front'] && (T['front'] = parseInt(D['params']['tabletop']['offset']['front'])),
                D['params']['tabletop']['offset']['back']) && (T['back'] = parseInt(D['params']['tabletop']['offset']['back']));
                let am = 'v:depth_of_floor_cabinets'
                  , an = 'v:lower_modules';
                if ('top' == L['spec']['cabinet_tag'] && (am = 'v:upper_modules_depth',
                an = ab(al['height'])),
                'string' == typeof (an = 'bottom' == L['spec']['cabinet_tag'] && 0x384 < ab(al['height']) ? ab(al['height']) : an)) {
                    var T = an['split'](':')[0x1]
                      , U = [];
                    for (let ao = 0x0; ao < L['variables']['global']['length']; ao++)
                        U['push'](L['variables']['global'][ao]['key']);
                    U['includes'](T) || (L['variables']['global']['push']({
                        'editable': 0x0,
                        'fixed': 0x0,
                        'local': 0x0,
                        'key': T,
                        'value': null
                    }),
                    L['variables']['tree']['push']({
                        'key': T,
                        'is_global': 0x1
                    }));
                }
                if ('string' == typeof am) {
                    var T = am['split'](':')[0x1]
                      , W = [];
                    for (let ap = 0x0; ap < L['variables']['global']['length']; ap++)
                        W['push'](L['variables']['global'][ap]['key']);
                    W['includes'](T) || (L['variables']['global']['push']({
                        'editable': 0x0,
                        'fixed': 0x0,
                        'local': 0x0,
                        'key': T,
                        'value': null
                    }),
                    L['variables']['tree']['push']({
                        'key': T,
                        'is_global': 0x1
                    }));
                }
                Z['cabinet'] && 'corner' == Z['cabinet']['type'] && (am = ab(al['width']));
                var T = {
                    'code': al['code'] || '',
                    'name': al['name'] || '',
                    'size': {
                        'x': ab(al['width']),
                        'y': an,
                        'z': am
                    },
                    'price': al['price'] || 0x0,
                    'active': 0x1,
                    'variables': [],
                    'accessories': []
                };
                to_int(al['default']) && (T['default'] = 0x1),
                S['push'](T);
            }
            is_empty_value(Z['selected_variant']) ? 0x0 <= (R = _['findIndex'](H, aq => to_int(aq['default']))) && (L['spec']['selected_variant'] = R) : L['spec']['selected_variant'] = Z['selected_variant'];
            let a9 = parseInt(L['spec']['selected_variant'])
              , aa = ((is_empty_value(a9) || a9 < 0x0) && (a9 = 0x0,
            L['spec']['selected_variant'] = 0x0),
            S[a9]);
            return aa && (L['size']['x'] = aa['size']['x'],
            L['size']['y'] = aa['size']['y'],
            L['size']['z'] = aa['size']['z']),
            ad(),
            ae(),
            af(),
            ag(),
            a3 && ah(),
            ai(),
            aj(),
            L;
            function ab(aq) {
                return aq = parseFloat(aq),
                Number['isFinite'](aq) ? aq : 0x0;
            }
            function ac() {
                var aq = E['get_child_by_path'](a7, G['module_template']['paths']?.['tabletop']);
                aq && Z['tabletop'] && (void 0x0 !== Z['tabletop']['active'] && (aq['active'] = Z['tabletop']['active'] || 0x0),
                Z['tabletop']['offset'] && void 0x0 !== Z['tabletop']['offset']['front'] && (E['set_variable'](a6, 'otstup_szadi', Z['tabletop']['offset']['front']),
                a8 -= ab(Z['tabletop']['offset']['front'])),
                Z['tabletop']['offset']) && void 0x0 !== Z['tabletop']['offset']['back'] && (a8 -= ab(Z['tabletop']['offset']['back']));
            }
            function ad() {
                var aq = a7['children'][0x0]['spec']['fill_content']
                  , ar = G['module_template']['paths']?.['shelves_parent'];
                if (ar) {
                    aq[ar] || (aq[ar] = {
                        'key': ar,
                        'name': '',
                        'children': []
                    });
                    var as = aq[ar], at, au;
                    if (Z['shelves'] || (Z['shelves'] = []),
                    as && Z['shelves']['length']) {
                        let aw = G['shelf_template']['id'];
                        if (-0x1 < location['href']['indexOf']('34600023') && Z['doors'] && Z['doors']['length']) {
                            let ax = 0x1;
                            for (let ay = 0x0; ay < Z['doors']['length']; ay++)
                                'frame' != Z['doors'][ay]['style'] && (ax = 0x0);
                            0x1 == ax && (aw = G['shelf_glass_template']['id']);
                        }
                        for (var av of Z['shelves']) {
                            'vertical' == av['orientation'] ? (Z['walls'] || (Z['walls'] = []),
                            av['from_shelf'] = 0x1,
                            Z['walls']['push'](av)) : (at = {
                                'type': 'module',
                                'name': 'Полка',
                                'spec': {
                                    'id': aw,
                                    'element_type': G['shelf_template']['key']
                                },
                                'size': {
                                    'x': 's:x',
                                    'y': '16',
                                    'z': 's:z'
                                },
                                'pos': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 0x0
                                },
                                'pivot': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': -0x1
                                }
                            },
                            av['v2'] && (at['pivot']['x'] = -0x1,
                            at['pivot']['y'] = -0x1),
                            void 0x0 !== av['width'] && ('string' == typeof av['width'] && '%' === av['width']['slice'](-0x1) ? at['size']['x'] = 's:x\x20*\x20' + av['width']['slice'](0x0, -0x1) + '\x20/\x20100' : at['size']['x'] = '' + av['width']),
                            void 0x0 !== (au = void 0x0 !== av['starting_point_x'] ? av['starting_point_x'] : '50%') && ('string' == typeof au && '%' === au['slice'](-0x1) ? at['pos']['x'] = 's:x\x20*\x20' + au['slice'](0x0, -0x1) + '\x20/\x20100' : at['pos']['x'] = '' + au),
                            void 0x0 !== av['starting_point_y'] && ('string' == typeof av['starting_point_y'] && '%' === av['starting_point_y']['slice'](-0x1) ? (void 0x0 !== av['position_offset_bottom'] && (at['pos']['y'] = at['pos']['y'] ? at['pos']['y'] + '\x20+\x20' + av['position_offset_bottom'] : '+\x20' + av['position_offset_bottom']),
                            void 0x0 !== av['position_offset_top'] && (at['pos']['y'] = at['pos']['y'] ? at['pos']['y'] + '\x20-\x20' + av['position_offset_top'] : '-\x20' + av['position_offset_top']),
                            at['pos']['y'] = at['pos']['y'] ? '(\x20s:y\x20' + at['pos']['y'] + '\x20)' : 's:y',
                            at['pos']['y'] = at['pos']['y'] + '\x20*\x20' + av['starting_point_y']['slice'](0x0, -0x1) + '\x20/\x20100\x20-\x20g:g0.thickness\x20*\x202') : at['pos']['y'] = av['starting_point_y'] + '\x20-\x20g:g0.thickness\x20*\x202'),
                            as['children']['push'](at));
                        }
                    }
                }
            }
            function ae() {
                var aq = a7['children'][0x0]['spec']['fill_content']
                  , ar = G['module_template']['paths']?.['walls_parent'];
                if (ar) {
                    aq[ar] || (aq[ar] = {
                        'key': ar,
                        'name': '',
                        'children': []
                    });
                    var as = aq[ar];
                    if (Z['walls'] || (Z['walls'] = []),
                    as && Z['walls']['length'])
                        for (var at of Z['walls']) {
                            var au = {
                                'type': 'module',
                                'name': 'Стена',
                                'spec': {
                                    'id': G['wall_template']['id'],
                                    'element_type': G['wall_template']['key']
                                },
                                'size': {
                                    'x': 's:x',
                                    'y': '16',
                                    'z': 's:z'
                                },
                                'pos': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 0x0
                                },
                                'pivot': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': -0x1
                                },
                                'rot': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 0x0
                                }
                            }
                              , av = (at['v2'] && (au['pivot']['x'] = -0x1,
                            au['pivot']['y'] = -0x1),
                            'vertical' == at['orientation'] ? (au['rot']['z'] = 0x5a,
                            at['from_shelf'] && (au['pivot']['y'] = 0x0),
                            au['pivot']['x'] = 0x1,
                            void 0x0 !== at['width'] && ('string' == typeof at['width'] && '%' === at['width']['slice'](-0x1) ? au['size']['x'] = 's:y\x20*\x20' + at['width']['slice'](0x0, -0x1) + '\x20/\x20100' : au['size']['x'] = '' + at['width'])) : void 0x0 !== at['width'] && ('string' == typeof at['width'] && '%' === at['width']['slice'](-0x1) ? au['size']['x'] = 's:x\x20*\x20' + at['width']['slice'](0x0, -0x1) + '\x20/\x20100' : au['size']['x'] = '' + at['width']),
                            void 0x0 !== at['starting_point_x'] ? at['starting_point_x'] : '50%');
                            void 0x0 !== av && ('string' == typeof av && '%' === av['slice'](-0x1) ? au['pos']['x'] = 's:x\x20*\x20' + av['slice'](0x0, -0x1) + '\x20/\x20100' : au['pos']['x'] = '' + av),
                            void 0x0 !== at['starting_point_y'] && ('string' == typeof at['starting_point_y'] && '%' === at['starting_point_y']['slice'](-0x1) ? (void 0x0 !== at['position_offset_bottom'] && (au['pos']['y'] = au['pos']['y'] ? au['pos']['y'] + '\x20+\x20' + at['position_offset_bottom'] : '+\x20' + at['position_offset_bottom']),
                            void 0x0 !== at['position_offset_top'] && (au['pos']['y'] = au['pos']['y'] ? au['pos']['y'] + '\x20-\x20' + at['position_offset_top'] : '-\x20' + at['position_offset_top']),
                            au['pos']['y'] = au['pos']['y'] ? '(\x20s:y\x20' + au['pos']['y'] + '\x20)' : 's:y',
                            au['pos']['y'] = au['pos']['y'] + '\x20*\x20' + at['starting_point_y']['slice'](0x0, -0x1) + '\x20/\x20100\x20-\x20g:g0.thickness\x20*\x202') : au['pos']['y'] = at['starting_point_y'] + '\x20-\x20g:g0.thickness\x20*\x202'),
                            as['children']['push'](au);
                        }
                }
            }
            function af() {
                var aq = a7['children'][0x0]['spec']['fill_content']
                  , ar = G['module_template']['paths']?.['doors_parent'];
                if (ar) {
                    aq[ar] || (aq[ar] = {
                        'key': ar,
                        'name': '',
                        'children': []
                    });
                    var as = aq[ar];
                    if (Z['doors'] || (Z['doors'] = []),
                    as && Z['doors']['length'])
                        for (var at of Z['doors']) {
                            let aw = null;
                            if ('ltr' === at['type'])
                                aw = G['right_door_template'];
                            else {
                                if ('rtl' === at['type'])
                                    aw = G['left_door_template'];
                                else {
                                    if (at['type']) {
                                        if ('simple_bottom' === at['type'])
                                            aw = G['bottom_door_template'];
                                        else {
                                            if ('simple_top' !== at['type'])
                                                continue;
                                            aw = G['top_door_template'];
                                        }
                                    } else
                                        aw = G['left_door_template'];
                                }
                            }
                            var au = {
                                'type': 'module',
                                'name': 'Дверь',
                                'spec': {
                                    'id': aw['id'],
                                    'element_type': aw['key'],
                                    'params_apply': {}
                                },
                                'size': {
                                    'x': 's:x',
                                    'y': 's:y',
                                    'z': 's:z'
                                },
                                'pos': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 0x0
                                },
                                'pivot': {
                                    'x': -0x1,
                                    'y': -0x1,
                                    'z': -0x1
                                }
                            }
                              , av = ('top' != at['handle_position'] && at['handle_position'] ? 'bottom' == at['handle_position'] ? au['spec']['params_apply']['facade_door:facade'] = {
                                'spec.handle.pos.y': 'b'
                            } : 'middle' == at['handle_position'] && (au['spec']['params_apply']['facade_door:facade'] = {
                                'spec.handle.pos.y': 'c'
                            }) : au['spec']['params_apply']['facade_door:facade'] = {
                                'spec.handle.pos.y': 't'
                            },
                            'window' !== at['style'] && 'frame' !== at['style'] || (au['spec']['params_apply']['facade_door:facade'] || (au['spec']['params_apply']['facade_door:facade'] = {}),
                            au['spec']['params_apply']['facade_door:facade']['spec.type'] = at['style']),
                            -0x1 < location['href']['indexOf']('34600023') && 'frame' == at['style'] && (au['spec']['params_apply']['facade_door:facade'] || (au['spec']['params_apply']['facade_door:facade'] = {}),
                            au['spec']['params_apply']['facade_door:facade']['spec.id'] = 0x1d9,
                            au['spec']['params_apply']['facade_door:facade']['spec.can_change.id'] = 0x0,
                            au['spec']['params_apply']['facade_door:facade']['spec.can_change.material'] = 0x0,
                            au['spec']['params_apply']['facade_door:facade']['spec.can_change.type'] = 0x0,
                            au['spec']['params_apply']['facade_door:facade']['spec.type'] = 'full'),
                            0x1 == at['no_handle_forced'] && (au['spec']['params_apply']['facade_door:facade'] || (au['spec']['params_apply']['facade_door:facade'] = {}),
                            au['spec']['params_apply']['facade_door:facade']['spec.handle.active'] = 0x0,
                            au['spec']['params_apply']['facade_door:facade']['spec.handle.enabled'] = 0x0),
                            void 0x0 !== at['offset_top'] ? at['offset_top'] : 0x0)
                              , av = (av && (au['size']['y'] || (au['size']['y'] = ''),
                            au['size']['y'] = au['size']['y'] + '\x20-\x20' + av),
                            void 0x0 !== at['offset_bottom'] ? at['offset_bottom'] : 0x0)
                              , av = (av && (au['size']['y'] || (au['size']['y'] = ''),
                            au['size']['y'] = au['size']['y'] + '\x20-\x20' + av),
                            void 0x0 !== at['width'] ? at['width'] : '100%')
                              , av = (void 0x0 !== av && ('string' == typeof av && '%' === av['slice'](-0x1) ? au['size']['x'] = 's:x\x20*\x20' + av['slice'](0x0, -0x1) + '\x20/\x20100' : au['size']['x'] = '' + av),
                            void 0x0 !== at['height'] ? at['height'] : '100%');
                            void 0x0 !== av && ('string' == typeof av && '%' === av['slice'](-0x1) ? (au['size']['y'] = au['size']['y'] ? '(\x20' + au['size']['y'] + '\x20)' : 's:y',
                            au['size']['y'] = au['size']['y'] + '\x20*\x20' + av['slice'](0x0, -0x1) + '\x20/\x20100') : au['size']['y'] = '' + av),
                            void 0x0 !== at['thickness'] && ('string' == typeof at['thickness'] && '%' === at['thickness']['slice'](-0x1) ? au['size']['z'] = 's:z\x20*\x20' + at['thickness']['slice'](0x0, -0x1) + '\x20/\x20100' : au['size']['z'] = '' + at['thickness']),
                            'left' === at['direction_x'] && (au['pivot']['x'] = 0x1),
                            'bottom' === at['direction_y'] && (au['pivot']['y'] = 0x1),
                            void 0x0 !== at['starting_point_x'] && ('string' == typeof at['starting_point_x'] && '%' === at['starting_point_x']['slice'](-0x1) ? au['pos']['x'] = 's:x\x20*\x20' + at['starting_point_x']['slice'](0x0, -0x1) + '\x20/\x20100' : au['pos']['x'] = '' + at['starting_point_x']),
                            void 0x0 !== at['starting_point_y'] && ('string' == typeof at['starting_point_y'] && '%' === at['starting_point_y']['slice'](-0x1) ? au['pos']['y'] = 's:y\x20*\x20' + at['starting_point_y']['slice'](0x0, -0x1) + '\x20/\x20100' : au['pos']['y'] = '' + at['starting_point_y']),
                            Z['cabinet'] && 'corner' == Z['cabinet']['type'] && (au['pivot']['z'] = 0x1),
                            'simple_bottom' === at['type'] && (au['pos']['y'] = 0x0),
                            as['children']['push'](au);
                        }
                }
            }
            function ag() {
                var aq = a7['children'][0x0]['spec']['fill_content']
                  , ar = G['module_template']['paths']?.['lockers_parent'];
                if (ar) {
                    aq[ar] || (aq[ar] = {
                        'key': ar,
                        'name': '',
                        'children': []
                    });
                    var as = aq[ar];
                    if (Z['lockers'] || (Z['lockers'] = []),
                    as && Z['lockers']['length'])
                        for (var at of Z['lockers']) {
                            var au = {
                                'type': 'module',
                                'name': 'Ящик',
                                'spec': {
                                    'id': G['locker_template']['id'],
                                    'element_type': G['locker_template']['key']
                                },
                                'size': {
                                    'x': 's:x',
                                    'y': 's:y',
                                    'z': 's:z'
                                },
                                'pos': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 0x0
                                },
                                'pivot': {
                                    'x': -0x1,
                                    'y': -0x1,
                                    'z': -0x1
                                }
                            }
                              , av = void 0x0 !== at['offset_top'] ? at['offset_top'] : 0x0
                              , av = (av && (au['size']['y'] || (au['size']['y'] = ''),
                            au['size']['y'] = au['size']['y'] + '\x20-\x20' + av),
                            void 0x0 !== at['offset_bottom'] ? at['offset_bottom'] : 0x0)
                              , av = (av && (au['size']['y'] || (au['size']['y'] = ''),
                            au['size']['y'] = au['size']['y'] + '\x20-\x20' + av),
                            void 0x0 !== at['width'] ? at['width'] : '100%')
                              , av = (void 0x0 !== av && ('string' == typeof av && '%' === av['slice'](-0x1) ? au['size']['x'] = 's:x\x20*\x20' + av['slice'](0x0, -0x1) + '\x20/\x20100' : au['size']['x'] = '' + av),
                            void 0x0 !== at['height'] ? at['height'] : '100%');
                            void 0x0 !== av && ('string' == typeof av && '%' === av['slice'](-0x1) ? (au['size']['y'] = au['size']['y'] ? '(\x20' + au['size']['y'] + '\x20)' : 's:y',
                            au['size']['y'] = au['size']['y'] + '\x20*\x20' + av['slice'](0x0, -0x1) + '\x20/\x20100') : au['size']['y'] = '' + av),
                            void 0x0 !== at['depth'] && ('string' == typeof at['depth'] && '%' === at['depth']['slice'](-0x1) ? au['size']['z'] = 's:z\x20*\x20' + at['depth']['slice'](0x0, -0x1) + '\x20/\x20100' : au['size']['z'] = '' + at['depth']),
                            'left' === at['direction_x'] && (au['pivot']['x'] = 0x1),
                            'bottom' === at['direction_y'] && (au['pivot']['y'] = 0x1),
                            void 0x0 !== at['starting_point_x'] && ('string' == typeof at['starting_point_x'] && '%' === at['starting_point_x']['slice'](-0x1) ? au['pos']['x'] = 's:x\x20*\x20' + at['starting_point_x']['slice'](0x0, -0x1) + '\x20/\x20100' : au['pos']['x'] = '' + at['starting_point_x']),
                            void 0x0 !== at['starting_point_y'] && ('string' == typeof at['starting_point_y'] && '%' === at['starting_point_y']['slice'](-0x1) ? au['pos']['y'] = 's:y\x20*\x20' + at['starting_point_y']['slice'](0x0, -0x1) + '\x20/\x20100' : au['pos']['y'] = '' + at['starting_point_y']),
                            void 0x0 !== at['position_offset_bottom'] && (au['pos']['y'] || (au['pos']['y'] = ''),
                            au['pos']['y'] = au['pos']['y'] + '\x20+\x20' + at['position_offset_bottom']),
                            void 0x0 !== at['position_offset_top'] && (au['pos']['y'] || (au['pos']['y'] = ''),
                            au['pos']['y'] = au['pos']['y'] + '\x20-\x20' + at['position_offset_top']),
                            as['children']['push'](au);
                        }
                }
            }
            function ah() {
                var aq = a7['children'][0x0]['spec']['fill_content'], ar = 'pmm_one', aq;
                aq[ar] || (aq[ar] = {
                    'key': ar,
                    'name': '',
                    'children': []
                }),
                (aq = aq[ar]) && aq['children']['push']({
                    'type': 'model',
                    'name': 'Модель',
                    'id': '',
                    'lib': '',
                    'tags': '',
                    'interactive': 0x0,
                    'spec': {
                        'id': '53',
                        'key': ''
                    },
                    'custom': [],
                    'children': [],
                    'condition': null,
                    'visible': 0x1,
                    'helpers_visible': 0x0,
                    'active': 0x1,
                    'variables': {
                        'visible': 0x1,
                        'main': []
                    },
                    'interaction': {
                        'auto_rotation': 0x1,
                        'check_intersection': 0x0,
                        'raycast': 0x1
                    },
                    'resizable': {
                        'enabled': 0x0,
                        'locks': [],
                        'minmax': {
                            'min': {
                                'x': 0x0,
                                'y': 0x0,
                                'z': 0x0
                            },
                            'max': {
                                'x': 0x0,
                                'y': 0x0,
                                'z': 0x0
                            }
                        },
                        'extend_size': 0x1
                    },
                    'size': {
                        'x': 's:x',
                        'y': 's:y',
                        'z': '550'
                    },
                    'pos': {
                        'x': 0x0,
                        'y': 0x0,
                        'z': 's:z'
                    },
                    'pivot': {
                        'x': -0x1,
                        'y': -0x1,
                        'z': 0x1
                    },
                    'rot': {
                        'x': 0x0,
                        'y': 0x0,
                        'z': 0x0
                    },
                    'c_rot': {
                        'x': 0x0,
                        'y': 0x0,
                        'z': 0x0
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
                    'params_key': '',
                    'current': []
                });
            }
            function ai() {
                var aq = a7['children'][0x0]['spec']['fill_content']
                  , ar = G['module_template']['paths']?.['doors_parent'];
                if (ar) {
                    aq[ar] || (aq[ar] = {
                        'key': ar,
                        'name': '',
                        'children': []
                    });
                    var as = aq[ar], at;
                    if (Z['built_in_models'] || (Z['built_in_models'] = []),
                    as && Z['built_in_models'])
                        for (var au of Z['built_in_models']) {
                            'bim4' == au['id'] && ((at = {
                                'type': 'module',
                                'name': 'Духовка',
                                'spec': {
                                    'id': 0x1,
                                    'element_type': 'duh_shkaf',
                                    'params_apply': {}
                                },
                                'size': {
                                    'x': 's:x',
                                    'y': '600',
                                    'z': '595'
                                },
                                'pos': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 's:z\x20+\x2014'
                                },
                                'pivot': {
                                    'x': -0x1,
                                    'y': -0x1,
                                    'z': 0x1
                                }
                            })['pos']['y'] = au['pY'],
                            as['children']['push'](at));
                        }
                }
            }
            function aj() {
                var aq = a7['children'][0x0]['spec']['fill_content']
                  , ar = G['module_template']['paths']?.['doors_parent'];
                if (ar) {
                    aq[ar] || (aq[ar] = {
                        'key': ar,
                        'name': '',
                        'children': []
                    });
                    var as = aq[ar];
                    if (ce('dixe'),
                    Z['fixed_models'] || (Z['fixed_models'] = []),
                    as && Z['fixed_models'])
                        for (var at of Z['fixed_models']) {
                            let au;
                            '/common_assets/models/tech/built_in_cookers/2/mic.fbx' == at['model'] && ((au = {
                                'type': 'module',
                                'name': 'СВЧ',
                                'spec': {
                                    'id': 0x1,
                                    'element_type': 'mic_vstr',
                                    'params_apply': {}
                                },
                                'size': {
                                    'x': 's:x',
                                    'y': '360',
                                    'z': '440'
                                },
                                'pos': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 's:z'
                                },
                                'pivot': {
                                    'x': -0x1,
                                    'y': -0x1,
                                    'z': 0x1
                                }
                            })['pos']['y'] = at['pos']['y'],
                            as['children']['push'](au)),
                            '/common_assets/models/tech/built_in_cookers/2/model.fbx' == at['model'] && ((au = {
                                'type': 'module',
                                'name': 'Духовка',
                                'spec': {
                                    'id': 0x1,
                                    'element_type': 'duh_shkaf',
                                    'params_apply': {}
                                },
                                'size': {
                                    'x': 's:x',
                                    'y': '600',
                                    'z': '595'
                                },
                                'pos': {
                                    'x': 0x0,
                                    'y': 0x0,
                                    'z': 's:z\x20+\x2014'
                                },
                                'pivot': {
                                    'x': -0x1,
                                    'y': -0x1,
                                    'z': 0x1
                                }
                            })['pos']['y'] = at['pos']['y'],
                            as['children']['push'](au));
                        }
                }
            }
        }
    }
    async['convert_kitchen_models']() {
        var f = global_options['acc_url'] + '/data/', g, h;
        for (h of [{
            'modules_set_id': 0x2
        }]) {
            var i = h['modules_set_id'];
            if (i) {
                var i = await promise_request(f + ('module_sets/' + i + '.json'));
                if (i?.['items']?.['length']) {
                    this['convert_all_modules'](i['items']);
                    break;
                }
            }
        }
    }
    async['get_modules_sets_info']() {
        var f = {
            'sets': [],
            'biggest_set': null
        }, g = global_options['acc_url'] + '/data/', h, j;
        let k = 0x0
          , l = null;
        for (j of [{
            'modules_set_id': 0x2
        }, {
            'modules_set_id': 0x1b
        }, {
            'modules_set_id': 0x1f
        }, {
            'modules_set_id': 0x24
        }, {
            'modules_set_id': 0x27
        }, {
            'modules_set_id': 0x2b
        }, {
            'modules_set_id': 0x2c
        }, {
            'modules_set_id': 0x2d
        }]) {
            var m = j['modules_set_id'], m, n;
            m && (n = {
                'id': m,
                'count': (m = await promise_request(g + ('module_sets/' + m + '.json')))?.['items']?.['length'] || 0x0
            },
            m?.['items'] || (n['error'] = 'not\x20loaded'),
            k < n['count'] && (k = n['count'],
            l = n['id']),
            f['sets']['push'](n));
        }
        return f['biggest_set'] = l,
        f;
    }
    ['set_variable'](f, g, h) {
        var f = Array['isArray'](f) ? _['find'](f, i => i['key'] === g) : f[g];
        f && (f['value'] = h);
    }
    ['get_child_by_path'](f, g) {
        if (g = g['slice'](0x2),
        !f || !g)
            return null;
        var h;
        for (g = g['split'](','); h = g['shift'](); ) {
            if (!f?.['children'])
                return null;
            f = f['children'][h];
        }
        return f || null;
    }
}
class Drag_helper extends THREE['Group'] {
    constructor(f) {
        super(),
        this['userData']['params'] = {
            'width': void 0x0 !== (f = f || {})['width'] ? f['width'] : 0x212,
            'height': void 0x0 !== f['height'] ? f['height'] : 0x2d0,
            'thickness': void 0x0 !== f['thickness'] ? f['thickness'] : 0x10,
            'angle': void 0x0 !== f['angle'] ? f['angle'] : 0x2d,
            'material': void 0x0 !== f['material'] ? f['material'] : global_materials['helper_material'],
            'wrong_material': void 0x0 !== f['wrong_material'] ? f['wrong_material'] : global_materials['helper_wrong_material'],
            'shape': void 0x0 !== f['shape'] ? f['shape'] : 'square',
            'draggable': void 0x0 === f['draggable'] || f['draggable']
        },
        this['userData']['mesh'] = new THREE['Mesh'](new THREE['BoxBufferGeometry'](0x64 / units,0x64 / units,0x64 / units),this['userData']['params']['material']),
        this['add'](this['userData']['mesh']);
    }
    ['show']() {
        this['visible'] = !0x0;
    }
    ['hide']() {
        this['visible'] = !0x1;
    }
    ['set_size'](f, g) {
        var j = Math['abs'](g['max']['x'] - f['x'])
          , k = Math['abs'](f['x'] - g['min']['x'])
          , q = Math['abs'](g['max']['y'] - f['y'])
          , v = Math['abs'](f['y'] - g['min']['y'])
          , w = Math['abs'](g['max']['z'] - f['z'])
          , x = Math['abs'](f['z'] - g['min']['z'])
          , y = this['userData']['mesh']['geometry']['attributes']['position'];
        for (let C = 0x0; C < y['count']; C++) {
            var z = y['getX'](C)
              , A = y['getY'](C)
              , B = y['getZ'](C);
            let D = z
              , F = A
              , G = B;
            D = z < 0x0 ? -k : j,
            F = A < 0x0 ? -v : q,
            G = B < 0x0 ? -x : w,
            y['setXYZ'](C, D, F, G);
        }
        this['userData']['mesh']['geometry']['attributes']['position']['needsUpdate'] = !0x0,
        this['userData']['size'] = {
            'x': g['max']['x'] - g['min']['x'],
            'y': g['max']['y'] - g['min']['y'],
            'z': g['max']['z'] - g['min']['z']
        },
        this['userData']['center'] = {
            'x': (g['max']['x'] + g['min']['x']) / 0x2,
            'y': (g['max']['y'] + g['min']['y']) / 0x2,
            'z': (g['max']['z'] + g['min']['z']) / 0x2
        },
        this['userData']['max'] = {
            'x': g['max']['x'],
            'y': g['max']['y'],
            'z': g['max']['z']
        },
        this['userData']['min'] = {
            'x': g['min']['x'],
            'y': g['min']['y'],
            'z': g['min']['z']
        };
    }
    ['get_size']() {
        return new THREE['Vector3'](this['userData']['size']['x'],this['userData']['size']['y'],this['userData']['size']['z']);
    }
    ['get_center'](f=!0x1) {
        var f;
        return f ? (f = new THREE['Vector3'](this['userData']['center']['x'],this['userData']['center']['y'],this['userData']['center']['z']),
        this['updateMatrixWorld'](!0x0),
        f['applyMatrix4'](this['matrixWorld']),
        f) : new THREE['Vector3'](this['userData']['center']['x'],this['userData']['center']['y'],this['userData']['center']['z']);
    }
    ['get_box']() {
        return new THREE['Box3']()['setFromCenterAndSize'](this['get_center'](!0x0), this['get_size']());
    }
    ['get_max']() {
        return new THREE['Vector3'](this['userData']['max']['x'],this['userData']['max']['y'],this['userData']['max']['z']);
    }
    ['get_min']() {
        return new THREE['Vector3'](this['userData']['min']['x'],this['userData']['min']['y'],this['userData']['min']['z']);
    }
    ['set_obj'](f) {
        var g, f = new THREE['Box3']()['setFromObject'](f)['getSize']();
        this['userData']['mesh']['geometry'] = new THREE['BoxBufferGeometry'](f['x'],f['y'],f['z']);
    }
    ['set_wrong']() {
        this['userData']['mesh']['material'] = this['userData']['params']['wrong_material'];
    }
    ['set_ok']() {
        this['userData']['mesh']['material'] = this['userData']['params']['material'];
    }
}
let drag_area_materials = {
    'area': new THREE['MeshBasicMaterial']({
        'color': '#96c296',
        'transparent': !0x0,
        'opacity': 0.2,
        'depthWrite': !0x1,
        'depthTest': !0x1
    }),
    'area_hover': new THREE['MeshBasicMaterial']({
        'color': '#96c2bd',
        'transparent': !0x0,
        'opacity': 0.2,
        'depthWrite': !0x1,
        'depthTest': !0x1
    }),
    'edges': new THREE['LineBasicMaterial']({
        'color': '#000000',
        'depthTest': !0x1,
        'depthWrite': !0x1
    }),
    'edges_hover': new THREE['LineBasicMaterial']({
        'color': '#000000',
        'depthTest': !0x1,
        'depthWrite': !0x1
    })
};
class Drag_area extends THREE['Group'] {
    constructor(f={}) {
        super();
        var g, f = (this['userData']['params'] = _['merge'](copy_object({
            'x': 0x3e8,
            'y': 0x7d0,
            'z': 0x258
        }), copy_object(f)),
        this['userData']['area'] = new THREE['Group'](),
        this['userData']['edges'] = new THREE['Group'](),
        this['add'](this['userData']['area']),
        this['add'](this['userData']['edges']),
        new THREE['Mesh'](new THREE['PlaneBufferGeometry'](this['userData']['params']['x'] / units,this['userData']['params']['y'] / units),drag_area_materials['area'])), h = new THREE['Mesh'](new THREE['PlaneBufferGeometry'](this['userData']['params']['z'] / units,this['userData']['params']['y'] / units),drag_area_materials['area']), j = h['clone'](), k = new THREE['Mesh'](new THREE['PlaneBufferGeometry'](this['userData']['params']['x'] / units,this['userData']['params']['z'] / units),drag_area_materials['area']), l = k['clone']();
        f['position']['set'](0x0, 0x0, -this['userData']['params']['z'] / 0x2 / units),
        h['rotation']['set'](0x0, Math['PI'] / 0x2, 0x0),
        h['position']['set'](-this['userData']['params']['x'] / 0x2 / units, 0x0, 0x0),
        j['rotation']['set'](0x0, -Math['PI'] / 0x2, 0x0),
        j['position']['set'](this['userData']['params']['x'] / 0x2 / units, 0x0, 0x0),
        k['position']['set'](0x0, this['userData']['params']['y'] / 0x2 / units, 0x0),
        k['rotation']['set'](Math['PI'] / 0x2, 0x0, 0x0),
        l['position']['set'](0x0, -this['userData']['params']['y'] / 0x2 / units, 0x0),
        l['rotation']['set'](-Math['PI'] / 0x2, 0x0, 0x0),
        f['get_parent'] = () => this['get_parent'](),
        h['get_parent'] = () => this['get_parent'](),
        j['get_parent'] = () => this['get_parent'](),
        k['get_parent'] = () => this['get_parent'](),
        l['get_parent'] = () => this['get_parent'](),
        f['get_area'] = () => this,
        h['get_area'] = () => this,
        j['get_area'] = () => this,
        k['get_area'] = () => this,
        l['get_area'] = () => this,
        f['userData']['no_edges'] = 0x1,
        h['userData']['no_edges'] = 0x1,
        j['userData']['no_edges'] = 0x1,
        k['userData']['no_edges'] = 0x1,
        l['userData']['no_edges'] = 0x1,
        this['userData']['area']['add'](f, h, j, k, l),
        this['userData']['edges']['add'](make_edges(this['userData']['params']['x'] / units, this['userData']['params']['y'] / units, this['userData']['params']['z'] / units, drag_area_materials['edges']));
    }
    ['get_area']() {
        return this['userData']['area'];
    }
    ['get_parent']() {
        return this['parent'];
    }
    ['set_material'](e) {
        this['userData']['area']['children']['forEach'](f => {
            f['material'] = e;
        }
        );
    }
    ['_dispose']() {}
}
class Selector extends THREE['Group'] {
    constructor() {
        super(),
        this['name'] = 'Selector';
    }
    ['set_from_object'](f) {
        for (let i = this['children']['length']; i--; )
            this['remove'](this['children'][i]);
        let g = f['box'];
        var f = (g = g || new THREE['Box3']()['setFromObject'](f))['getSize'](new THREE['Vector3']())
          , h = g['getCenter'](new THREE['Vector3']())
          , f = make_cube(f['x'], f['y'], f['z'], red_mat);
        this['add'](f),
        this['position']['copy'](h);
    }
    ['show']() {
        this['visible'] = !0x0;
    }
    ['hide']() {
        this['visible'] = !0x1;
    }
}
class Box_helper extends THREE['Group'] {
    constructor(f, g=!0x1) {
        super();
        var h = f['max']['x'] - f['min']['x']
          , j = f['max']['y'] - f['min']['y']
          , k = f['max']['z'] - f['min']['z']
          , h = (g = g || new THREE['LineBasicMaterial']({
            'color': '#ff0000'
        }),
        new THREE['LineSegments'](new THREE['EdgesGeometry'](new THREE['BoxGeometry'](h,j,k)),g));
        h['computeLineDistances'](),
        this['add'](h),
        h['position']['copy'](f['getCenter'](new THREE['Vector3']()));
    }
}
class FillDragArea extends THREE['Group'] {
    constructor(f={}) {
        super(),
        this['userData'] = {
            'parent': f['parent'] || null,
            'size': f['size'] || new THREE['Vector3']()
        };
        var f = new THREE['Vector3']();
        f['x'] = this['userData']['size']['x'],
        f['y'] = this['userData']['size']['y'],
        f['z'] = this['userData']['size']['z'],
        this['material'] = new THREE['MeshBasicMaterial']({
            'color': 0x96c296,
            'transparent': !0x0,
            'opacity': 0.2,
            'depthWrite': !0x1,
            'depthTest': !0x0,
            'side': THREE['DoubleSide']
        }),
        this['geometry'] = new THREE['BoxGeometry'](f['x'],f['y'],f['z']),
        this['mesh'] = new THREE['Mesh'](this['geometry'],this['material']),
        this['mesh']['layers']['set'](0x1),
        this['add'](this['mesh']),
        this['mesh']['position']['set'](0x0, 0x0, 0x0),
        this['mesh']['userData']['is_drag_area'] = !0x0,
        this['mesh']['userData']['parent'] = this;
    }
    ['update_size'](f) {
        this['userData']['size'] = f,
        this['geometry']['dispose'](),
        this['geometry'] = new THREE['BoxGeometry'](f['x'],f['y'],f['z']),
        this['mesh']['geometry'] = this['geometry'],
        this['mesh']['position']['set'](0x0, 0x0, 0x0),
        this['updateMatrixWorld'](!0x0);
    }
    ['get_size']() {
        this['updateMatrixWorld'](!0x0);
        var f = new THREE['Box3']()['setFromObject'](this['mesh']);
        return {
            'min': f['min']['clone'](),
            'max': f['max']['clone']()
        };
    }
    ['show']() {
        this['visible'] = !0x0;
    }
    ['hide']() {
        this['visible'] = !0x1;
    }
    ['dispose']() {
        this['geometry']['dispose'](),
        this['material']['dispose']();
    }
    ['highlight']() {
        this['mesh']['material'] = fillHighlightMaterial;
    }
    ['unhighlight']() {
        this['mesh']['material'] = this['material'];
    }
}
let fillHighlightMaterial = new THREE['MeshBasicMaterial']({
    'color': 0x9b4dca,
    'transparent': !0x0,
    'opacity': 0.1,
    'depthWrite': !0x1,
    'depthTest': !0x0,
    'side': THREE['DoubleSide']
});
class Fill_Helper extends THREE['Group'] {
    constructor(f={}) {
        super(),
        this['userData'] = {
            'parent': f['parent'] || null,
            'size': f['size'] || new THREE['Vector3'](),
            'scale': f['scale'] || new THREE['Vector3']()
        };
        var g = new THREE['Vector3']()
          , h = (g['x'] = this['userData']['size']['x'],
        g['y'] = this['userData']['size']['y'],
        g['z'] = this['userData']['size']['z'],
        new THREE['Vector3']());
        h['x'] = this['userData']['scale']['x'],
        h['y'] = this['userData']['scale']['y'],
        h['z'] = this['userData']['scale']['z'],
        this['material'] = new THREE['MeshBasicMaterial']({
            'color': 0x96c296,
            'transparent': !0x0,
            'opacity': 0.7,
            'depthWrite': !0x1,
            'depthTest': !0x0,
            'side': THREE['DoubleSide']
        }),
        this['highlightMaterial'] = new THREE['MeshBasicMaterial']({
            'color': 0xff0000,
            'transparent': !0x0,
            'opacity': 0.7,
            'depthWrite': !0x1,
            'depthTest': !0x0,
            'side': THREE['DoubleSide']
        }),
        this['geometry'] = new THREE['BoxGeometry'](g['x'] + h['x'],g['y'] + h['y'],g['z'] + h['z']),
        this['mesh'] = new THREE['Mesh'](this['geometry'],this['material']),
        this['mesh']['position']['set'](g['x'] / 0x2, g['y'] / 0x2, g['z'] / 0x2),
        this['mesh']['userData']['size'] = g,
        this['mesh']['userData']['parent'] = f['parent'],
        this['add'](this['mesh']);
    }
    ['update_size'](f) {
        this['userData']['size'] = f;
        var g = new THREE['Vector3']()
          , g = (g['x'] = this['userData']['scale']['x'],
        g['y'] = this['userData']['scale']['y'],
        g['z'] = this['userData']['scale']['z'],
        new THREE['BoxGeometry'](f['x'] + g['x'],f['y'] + g['y'],f['z'] + g['z']));
        this['mesh']['geometry']['dispose'](),
        this['mesh']['geometry'] = g,
        this['mesh']['position']['set'](f['x'] / 0x2, f['y'] / 0x2, f['z'] / 0x2),
        this['mesh']['updateMatrix'](),
        this['mesh']['updateMatrixWorld'](!0x0),
        this['updateMatrixWorld'](!0x0);
    }
    ['get_size']() {
        this['updateMatrixWorld'](!0x0);
        var f = new THREE['Box3']()['setFromObject'](this['mesh']);
        return {
            'min': f['min']['clone'](),
            'max': f['max']['clone']()
        };
    }
    ['show']() {
        this['visible'] = !0x0;
    }
    ['hide']() {
        this['visible'] = !0x1;
    }
    ['highlight']() {
        this['mesh']['material'] = this['highlightMaterial'];
    }
    ['unhighlight']() {
        this['mesh']['material'] = this['material'];
    }
}
let def_module = _['merge'](copy_object(cabinet_def_common), {
    'type': 'module',
    'spec': {
        'cabinet_tag': '',
        'cabinet_group': 'bottom',
        'drag_mode': 'common',
        'element_type': 'module',
        'catalog_type': '',
        'mat_groups': null,
        'defaults': {},
        'selected_variant': -0x1,
        'variants': null,
        'selected_template': -0x1,
        'templates': null,
        'module_types': {},
        'fill_content': {},
        'can_change': {
            'id': 0x1
        },
        'movement_locked': 0x0,
        'not_load_default': 0x0,
        'version': 0x1,
        'is_fill': 0x0,
        'fill_fix_mats': 0x0,
        'fill_size_x': 0x0,
        'fill_size_y': 0x0,
        'fill_size_z': 0x0,
        'fill_pivot': {
            'x': 0x0,
            'y': 0x0,
            'z': 0x0
        },
        'nested_elements': 0x0
    },
    'resizable': {
        'enabled': 0x1
    },
    'children': [],
    'holes': []
});
class Module extends CabinetSection {
    constructor(f={}, g={
        'root': null,
        'parent': null,
        'local_parent': null,
        'path': '0'
    }, h={
        'use_lib': !0x0,
        'params': {},
        'material': {}
    }) {
        super(f, g, h),
        this['temp_type'] = 'Module',
        this['userData']['connected'] = [],
        this['userData']['object_type'] = 'cabinet',
        this['userData']['evaluated'] = !0x1;
    }
    ['_build_params'](f, g, h) {
        var j = f['spec'];
        if (j['variants'] && (void 0x0 === j['selected_variant'] || j['selected_variant'] < 0x0 || j['selected_variant'] >= j['variants']['length'])) {
            let v = null;
            for (let w = 0x0; w < j['variants']['length']; w++)
                if (0x1 == j['variants'][w]['default']) {
                    v = w;
                    break;
                }
            j['selected_variant'] = v || 0x0;
        }
        if (this['temp_cat_type'] = j['element_type'],
        !view_mode && j['mat_groups']) {
            var k = g['root'], m = g['local_parent'], n = (k ? k['userData']['params'] : f)['spec']['cabinet_tag'], q, u;
            for (q of j['mat_groups']) {
                module_utils['init_mat_group_material'](f, q, null, m || k, n, !0x1);
            }
        }
        this['userData']['cabinet_group'] = j['cabinet_group'],
        super['_build_params'](f, g, h);
    }
    ['_build_computed']() {
        super['_build_computed'](),
        this['_build_mat_groups']();
    }
    ['_build_mat_groups']() {
        var f = this['userData']['is_root'] ? this['userData']['params'] : module_utils['get_child_params_by_path'](this, this['userData']['path']);
        let g = this['userData']['root'];
        var j = g['userData']['params']['spec']['cabinet_tag'];
        let k = {};
        if (f['spec']['mat_groups']) {
            for (var m of f['spec']['mat_groups'])
                k[m['key']] = copy_object(m);
        }
        var q = project_settings['kitchen']?.['mat_groups'], v = f['spec']['mat_groups_state'], w, x, y;
        if (this['userData']['is_root']) {
            for (var z of Object['keys'](q || {}))
                if (!k[z] || is_empty_id(k[z]['material']?.['id']) && !is_empty_id(q[z]['selected'][j]?.['id'])) {
                    var A = q[z];
                    let C = k[z];
                    C || ((C = {})['available'] = copy_object(A['available']),
                    C['key'] = A['key'],
                    C['name'] = A['name']);
                    var B = _['find'](v, D => D['key'] === C['key']);
                    B && B['material'] ? C['material'] = copy_object(B['material']) : C['material'] = A['selected'][j] ? copy_object(A['selected'][j]) : {},
                    k[z] = C;
                }
        }
        if (!this['userData']['is_root']) {
            let D = this['userData']['local_parent'];
            D && D !== this && D['userData']['computed']['materials'] ? Object['keys'](D['userData']['computed']['materials'])['forEach'](E => {
                k[E] && (!is_empty_id(k[E]['material']?.['id']) || is_empty_id(D['userData']['computed']['materials'][E]['material']?.['id'])) || (k[E] = copy_object(D['userData']['computed']['materials'][E]),
                delete k[E]['local'],
                delete k[E]['fixed']);
            }
            ) : Object['keys'](g['userData']['computed']['materials'])['forEach'](E => {
                k[E] && (!is_empty_id(k[E]['material']?.['id']) || is_empty_id(g['userData']['computed']['materials'][E]['material']?.['id'])) || (k[E] = copy_object(g['userData']['computed']['materials'][E]),
                delete k[E]['local'],
                delete k[E]['fixed']);
            }
            );
        }
        if (q)
            for (let E of Object['keys'](k)) {
                k[E]['butt'] || (w = q[E]?.['selected_butt']?.[j]) && (y = _['find'](pp['libs']['materials_info']['keys'], F => F['key'] === k[E]['material']['key'])?.['butts'] || '',
                w['key'] === y) && (k[E]['butt'] = copy_object(w));
            }
        this['userData']['computed']['materials'] = k;
    }
    ['_before_build']() {
        super['_before_build']();
        for (let f = this['children']['length']; f--; )
            'Mesh' == this['children'][f]['type'] && this['remove'](this['children'][f]);
        pp['events']['module']['before_build'] && pp['events']['module']['before_build'](this);
    }
    ['build']() {
        this['_build']();
    }
    async['_after_build']() {
        this['userData']['is_root'] && (await this['_wait_children_ready'](),
        await this['_wait_children_evaluated'](),
        this['_on_after_build'] = async f => {
            f['updateWorldMatrix'](!0x0, !0x0),
            await f['CSG_Operation']();
        }
        ,
        await this['_on_after_build']?.(this),
        pp['events']['module']['after_build'] && pp['events']['module']['after_build'](this),
        this['_build_sizes'](),
        this['build_comments']());
    }
    ['_wait_children_ready']() {
        return new Promise(e => {
            let f = () => {
                var g = this['userData']['parts'], h, g, j;
                return !g || 0x0 === (g = Object['values'](g)['flat']()['filter'](k => 'model_loaded'in (k?.['userData']?.['computed'] || {})))['length'] ? e() : g['some'](k => 0x1 !== k['userData']['computed']['model_loaded']) ? requestAnimationFrame(f) : void e();
            }
            ;
            f();
        }
        );
    }
    ['_wait_children_evaluated']() {
        return new Promise(e => {
            let f = () => {
                var g = this['userData']['parts'], h, g, j;
                return !g || 0x0 === (g = Object['values'](g)['flat']()['filter'](k => 'evaluated'in (k?.['userData']?.['computed'] || {})))['length'] ? e() : g['some'](k => 0x1 !== k['userData']['computed']['evaluated']) ? requestAnimationFrame(f) : void e();
            }
            ;
            f();
        }
        );
    }
    ['show_radial_menu'](f, g) {
        pp['interface']['root'] && pp['interface']['root']['radial']({
            'obj_type': this['type'],
            'obj': {
                'open_type': !0x1,
                'open_doors': !0x0,
                'erase': this['userData']['has_draggable'],
                'resize': !0x0
            },
            'left': f,
            'top': g,
            'fill_mode': !!this['userData']['params']['spec']['is_fill']
        });
    }
    ['find_material_group'](f, g=!0x0) {
        var h = this['userData']['params']['spec'];
        let j = null;
        if (h['mat_groups'] && h['mat_groups']['length']) {
            for (var k of h['mat_groups'])
                if (k['key'] === f) {
                    j = k;
                    break;
                }
        }
        return j = g && !j ? {
            'key': '',
            'material': {
                'av_index': 0x0,
                'key': '',
                'variant_id': 0x0
            },
            'name': 'Не\x20найдена',
            'available': []
        } : j;
    }
    ['change_variables'](f, g) {
        module_utils['change_variables'](this, f, g);
    }
    ['remove_variable'](f, g=!0x0, h=!0x1) {
        module_utils['remove_variable'](this, f, g, h);
    }
    ['get_variables'](q=!0x0) {
        let G = this['userData']['params']
          , I = this['userData']['is_root']
          , J = G['variables'] ? copy_object(G['variables']) : {}
          , K = J['main'] || {}
          , L = J['global'] || []
          , N = J['tree'] || []
          , P = !q || 0x0 !== J['visible'];
        if (!P)
            return [];
        let Q = {};
        var U = {
            'name': 'Параметры',
            'vars': []
        }
          , Z = [U]
          , a0 = {
            'name': 'Параметры\x20(вложенные)',
            'vars': []
        };
        let a1 = new Set();
        var a2 = [a0], a3 = pp['variables']['current'], a4, a5, a6;
        if (a3) {
            var a7 = this['userData']['computed']['variables'], a8, a8;
            for (let as of L) {
                Q[as['key']] || (as['editable'] ? (I || as['local']) && (a8 = _['find'](a3, at => at['key'] === as['key'])) && ((a8 = merge(copy_object(a8), as))['is_global'] = 0x1,
                null === as['value'] && (a8['value'] = null),
                is_empty_value(a8['value']) && !is_empty_value(a7[a8['key']]?.['value']) && (a8['value'] = a7[a8['key']]['value']),
                Q[as['key']] = a8) : a1['add'](as['key']));
            }
        }
        if (Object['keys'](K)['forEach'](at => {
            var au = K[at];
            Q[au['key']] || (au['editable'] ? (I || au['local']) && (Q[at] = au) : a1['add'](au['key']));
        }
        ),
        I) {
            var a9 = this['userData']['parts']['module'], aa, ab = {}, ac;
            for (ac of J['mass_state'] || [])
                ab[ac['key']] = ac;
            var ad = [], ae, af, ag;
            for (ae of a9) {
                let at = ae['userData']['params']
                  , au = at['variables'] || {}
                  , av = au['main'] || {}
                  , aw = au['global'] || []
                  , ax = au['tree'] || []
                  , ay = !q || 0x0 !== au['visible'];
                ay && ad['push']({
                    'module': ae,
                    'vars': av,
                    'variables_global': aw,
                    'var_tree': ax
                });
            }
            for (af of ad) {
                var ah = af['module']['userData']['computed']['variables'], ai, ai;
                for (let az of af['variables_global']) {
                    Q[az['key']] ? Q[az['key']]['is_global'] && Q[az['key']]['is_nested'] && is_empty_value(Q[az['key']]['value']) && !is_empty_value(az['value']) && (Q[az['key']]['value'] = az['value']) : !az['editable'] || az['fixed'] || a1['has'](az['key']) || (ai = _['find'](a3, aA => aA['key'] === az['key'])) && ((ai = merge_copies(ai, az))['value'] = void 0x0 !== ab[ai['key']] ? ab[ai['key']]['value'] : null,
                    is_empty_value(ai['value']) && !is_empty_value(az['value']) && (ai['value'] = az['value']),
                    is_empty_value(ai['value']) && !is_empty_value(ah[ai['key']]?.['value']) && (ai['value'] = ah[ai['key']]['value']),
                    is_empty_value(ab[ai['key']]?.['fixed']) || (ai['fixed'] = ab[ai['key']]['fixed']),
                    ai['is_global'] = 0x1,
                    ai['is_nested'] = 0x1,
                    Q[ai['key']] = ai);
                }
            }
            for (ag of ad)
                for (var aj of Object['keys'](ag['vars'])) {
                    var aj = ag['vars'][aj], ak;
                    Q[aj['key']] ? !Q[aj['key']]['is_global'] && Q[aj['key']]['is_nested'] && is_empty_value(Q[aj['key']]['value']) && !is_empty_value(aj['value']) && (Q[aj['key']]['value'] = aj['value']) : !aj['editable'] || aj['fixed'] || a1['has'](aj['key']) || ((ak = copy_object(aj))['is_nested'] = 0x1,
                    ak['value'] = void 0x0 !== ab[ak['key']] ? ab[ak['key']]['value'] : null,
                    is_empty_value(ak['value']) && !is_empty_value(aj['value']) && (ak['value'] = aj['value']),
                    is_empty_value(ab[ak['key']]?.['fixed']) || (ak['fixed'] = ab[ak['key']]['fixed']),
                    Q[aj['key']] = ak);
                }
            var al = new Map(), am;
            for (am of ad)
                for (var an of am['var_tree'])
                    if (an['is_group']) {
                        if (!an['children'])
                            continue;
                        let aA = al['get'](an['name']);
                        aA || (aA = {
                            'name': an['name'] + '\x20(вложенные)',
                            'vars': []
                        },
                        al['set'](an['name'], aA),
                        a2['push'](aA));
                        for (var ao of an['children'])
                            ar(ao, aA['vars'], !0x0);
                    } else
                        ar(an, a0['vars'], !0x0);
        }
        for (a4 of N)
            if (a4['is_group']) {
                if (a4['children']) {
                    var ap = {
                        'name': a4['name'],
                        'vars': []
                    }, aq;
                    for (aq of a4['children'])
                        ar(aq, ap['vars'], !0x1);
                    Z['push'](ap);
                }
            } else
                ar(a4, U['vars'], !0x1);
        for (a5 of a2)
            for (let aB of a5['vars']) {
                aB['is_global'] && is_empty_value(aB['value']) && (a6 = _['find'](a3, aC => aC['key'] === aB['key'])) && (aB['value'] = a6['value']);
            }
        return [...Z, ...a2]['filter'](aC => aC['vars']['length']);
        function ar(aC, aD, aE) {
            if (!aC['is_group']) {
                let aG = Q[aC['key']];
                var aF;
                !aG || aE && !aG['is_nested'] || !aE && aG['is_nested'] || aC['is_global'] && !aG['is_global'] || !aC['is_global'] && aG['is_global'] || _['find'](aD, aH => aH['key'] === aG['key']) || aD['push'](aG);
            }
        }
    }
    ['set_variant_active'](f, g=!0x0) {
        var h = this['userData']['is_root'] ? this['userData']['params'] : module_utils['get_child_params_by_path'](this, this['userData']['path'])
          , j = h?.['spec']
          , k = h['spec']['variants'];
        if (k) {
            f = clamp(f, 0x0, k['length'] - 0x1),
            j['selected_variant'] = f;
            var f = k[j['selected_variant']]?.['size'] ? copy_object(k[j['selected_variant']]['size']) : {
                'x': cabinet_def_common['size']['x'],
                'y': cabinet_def_common['size']['y'],
                'z': cabinet_def_common['size']['z']
            }
              , k = {
                'parent_size': new THREE['Vector3'](),
                'computed': {},
                'variables': pp['variables']['current_hash'] || {},
                'props': {},
                'materials': {},
                'local_parent': {}
            }
              , f = {
                'x': comp2(f['x'], k),
                'y': comp2(f['y'], k),
                'z': comp2(f['z'], k)
            };
            if (h['size'] = {
                'x': f['x'],
                'y': f['y'],
                'z': f['z']
            },
            g) {
                var m = module_utils['get_variables'](this)
                  , n = j['variants'][j['selected_variant']]?.['variables'] || {};
                if (m && n) {
                    for (var p of Object['keys'](n))
                        m[p] && !is_empty_value(n[p]['value']) && (m[p]['value'] = n[p]['value']);
                }
            }
            this['_rebuild'](),
            (constructor_settings['tabletop_v2'] || constructor_settings['core_v2']) && sc['build_tabletop']();
        }
    }
    ['set_offset_y'](f) {
        this['userData']['params']['interaction']['offset_y'] = f,
        this['build']();
    }
    ['open_all']() {
        if (pp['events']['module']['before_open_all']) {
            var f = pp['events']['module']['before_open_all'](this);
            if (f)
                return f;
        }
        if (this['userData']['parts']['animator']) {
            for (let g = 0x0; g < this['userData']['parts']['animator']['length']; g++)
                this['userData']['parts']['animator'][g]['animate']();
        }
    }
    ['open_group'](f) {
        var g;
        this['userData']['parts']['trigger_animation_by_group']('TEST1');
    }
    ['_build_defaults']() {
        var f = this['userData']['params'], g = this['userData']['local_parent'], h;
        if ('module' === f['type'] || this['userData']['is_root']) {
            var j = f['spec']['defaults'] ? copy_object(f['spec']['defaults']) : {}, f = module_utils['get_global_defaults'](f), k;
            let l = null;
            this['userData']['is_root'] || (k = this['userData']['root'],
            l = k['userData']['params']['spec']?.['defaults'] ? copy_object(k['userData']['params']['spec']['defaults']) : null),
            this['userData']['computed']['defaults'] = module_utils['create_defaults'](j, l, f);
        }
    }
    ['change_material_group'](g={
        'mat_group_key': '',
        'mat_key': '',
        'mat_id': '',
        'mat_variant_id': null,
        'mat_thickness': null,
        'obj_groups': []
    }) {
        if (g['obj_groups']['includes'](this['userData']['params']['spec']['cabinet_tag'])) {
            var j = this['userData']['root'], k = this['userData']['is_root'], q = g['group']?.['is_nested'], v = g['group']?.['is_global'], w = void 0x0 !== g['mat_id'] ? pp['libs']['materials'][g['mat_key']]['find_item'](g['mat_id']) : void 0x0, x, x;
            let A = !0x0
              , B = !0x0
              , C = (v && (x = this['userData']['params']['spec']['mat_groups'],
            A = !G(x, g['mat_group_key']),
            x = this['userData']['params']['spec']['mat_groups_state'],
            B = !G(x, g['mat_group_key'])),
            !0x1);
            !q && A && (C = E(this, g, w, k, !v));
            var x = k ? this['userData']['parts']?.['module'] : _['filter'](j['userData']['parts']?.['module'], H => H['userData']['path']['startsWith'](this['userData']['path'] + ',')), k, x;
            if (A && B && x) {
                for (var y of x)
                    C = E(y, g, w, !0x1, !0x1) || C;
            }
            if (A && B && this['userData']['parent']instanceof CabinetSection && this['userData']['params']['spec']?.['is_fill']) {
                for (var z of j['userData']['parts']['module'])
                    this['userData']['path'] === z['userData']['path'] && (C = E(z, g, w, !0x1, !0x1) || C);
            }
            let D = !0x1;
            function E(H, I, J, K, L) {
                let N;
                var O;
                if (K ? N = H['userData']['params']['spec']['mat_groups'] : (O = H['get_child_params_by_path'](H['userData']['path'])) && O['spec'] && (N = O['spec']['mat_groups']),
                !N)
                    return !0x1;
                let P = void 0x0 !== J
                  , Q = _['find'](N, a0 => {
                    if (a0['key'] !== I['mat_group_key'])
                        return !0x1;
                    if (!L && a0['fixed'])
                        return !0x1;
                    if (!P)
                        return !0x0;
                    let a1 = null;
                    for (var a2 of a0['available'] || [])
                        if (a2['key'] === I['mat_key']) {
                            let a7 = !a2['categories']?.['length'] || !(J['category'] || [])['length'];
                            if (!a7 && a2['categories']?.['length']) {
                                if (pp['libs']['materials'][J['key']]) {
                                    var a3 = pp['libs']['materials'][J['key']]['find_all_available_categories'](a2['categories']), a4;
                                    for (let a8 of J['category'] || []) {
                                        if (_['find'](a3, a9 => '' + a9['id'] == '' + a8)) {
                                            a7 = !0x0;
                                            break;
                                        }
                                    }
                                } else {
                                    var a5 = a2['categories'], a6;
                                    for (let a9 of J['category'] || []) {
                                        if (_['find'](a5, aa => '' + aa == '' + a9)) {
                                            a7 = !0x0;
                                            break;
                                        }
                                    }
                                }
                            }
                            if (a7) {
                                let aa = !a2['thickness']?.['length'];
                                if (aa = !aa && a2['thickness']?.['length'] && a2['thickness']['includes'](I['mat_thickness']) ? !0x0 : aa) {
                                    a1 = a2;
                                    break;
                                }
                            }
                        }
                    return Boolean(a1);
                }
                );
                if (!Q)
                    return !0x1;
                var O = !P || '' + Q['material']['id'] != '' + I['mat_id'] || void 0x0 !== I['mat_key'] && Q['material']['key'] !== I['mat_key'], R = void 0x0 !== I['butt_id'] && !('' + Q['butt']?.['id'] == '' + I['butt_id'] && Q['butt']?.['key'] === I['butt_key']), S, T, U, O, R;
                let W = !0x1
                  , Z = !0x1;
                return P && (void 0x0 !== I['mat_key'] && (Q['material']['key'] = I['mat_key']),
                Q['material']['id'] = I['mat_id'],
                Q['material']['variant_id'] = null !== I['mat_variant_id'] ? I['mat_variant_id'] : J['variant_id'],
                W = !0x0),
                O && R && ((_['find'](pp['libs']['materials_info']['keys'], a0 => a0['key'] === Q['material']['key'])?.['butts'] || '') === I['butt_key'] ? (Q['butt'] || (Q['butt'] = {}),
                Q['butt']['key'] = I['butt_key'],
                Q['butt']['id'] = I['butt_id'],
                Z = !0x0) : W && (Q['butt'] && delete Q['butt'],
                Z = !0x0)),
                W && void 0x0 === I['butt_id'] && (O = _['find'](pp['libs']['materials_info']['keys'], a0 => a0['key'] === Q['material']['key'])?.['butts'] || '',
                void 0x0 !== Q['butt']?.['key']) && O !== Q['butt']['key'] && (Q['butt'] && delete Q['butt'],
                Z = !0x0),
                Z && (R = K ? H['userData']['params'] : module_utils['get_child_params_by_path'](H, H['userData']['path']),
                module_utils['walk_params_tree'](R, a0 => {
                    if (('wall' === a0['type'] || a0['spec']?.['butts']?.['length']) && a0['spec']?.['material']?.['group'] === I['mat_group_key']) {
                        for (var a1 of a0['spec']['butts'])
                            a1['id'] = 0x0,
                            a1['variant_id'] = 0x0;
                    }
                }
                , 0x1)),
                !(!W && !Z);
            }
            function F(H, I, J, K=!0x0) {
                let L = H['userData']['params']['spec']['mat_groups_state'];
                if (!L) {
                    if (!K)
                        return;
                    L = [],
                    H['userData']['params']['spec']['mat_groups_state'] = L;
                }
                let N = _['find'](L, Q => Q['key'] === I['mat_group_key']);
                var O, H, P;
                !N && K && (N = {
                    'key': I['mat_group_key'],
                    'material': {}
                },
                L['push'](N)),
                N && (void 0x0 !== J && (void 0x0 !== I['mat_key'] && (N['material']['key'] = I['mat_key']),
                N['material']['id'] = I['mat_id'],
                N['material']['variant_id'] = null !== I['mat_variant_id'] ? I['mat_variant_id'] : J['variant_id']),
                void 0x0 !== I['butt_id']) && ((H = _['find'](pp['libs']['materials_info']['keys'], Q => Q['key'] === N['material']['key']))?.['butts'] || '') === I['butt_key'] && (H['butt'] || (H['butt'] = {}),
                H['butt']['key'] = I['butt_key'],
                H['butt']['id'] = I['butt_id']);
            }
            function G(H, I) {
                var H = _['find'](H, J => J['key'] === I);
                return Boolean(H && H['fixed']);
            }
            q && (D = !0x0),
            v && C && (k = this['userData']['params']['spec']['mat_groups'],
            x = _['find'](k, H => H['key'] === g['mat_group_key']),
            D = !x),
            D && F(this, g, w),
            C && (this['_change_material_in_walls'](g),
            (this['userData']['parent']instanceof CabinetSection && this['userData']['params']['spec']?.['is_fill'] ? this['userData']['root'] : this)['_rebuild'](),
            pp['config']['on_demand_render'] && pp['three']['render'](),
            'function' == typeof cabinet_material_change_callback) && cabinet_material_change_callback(g, this);
        }
    }
    ['_change_material_in_walls'](f) {
        var g = this['userData']['is_root'] ? this['userData']['params'] : module_utils['get_child_params_by_path'](this, this['userData']['path']);
        let h = {
            'key': f['mat_key'],
            'id': f['mat_id'],
            'variant_id': f['mat_variant_id']
        };
        module_utils['walk_params_tree'](g, i => {
            var i, j;
            'wall' !== i['type'] || (i = i['spec']['material'],
            is_empty_id(i?.['id'])) || i['group'] === f['mat_group_key'] && null !== (j = module_utils['find_material_variant_to_change'](i, h)) && (i['key'] = h['key'],
            i['id'] = h['id'],
            i['variant_id'] = j);
        }
        );
    }
    ['change_tabletop_material_v2'](f, g) {
        var h, j = this['userData']['root']['userData']['params']['spec']['defaults'], j = (j['tabletop'] || (j['tabletop'] = {}),
        j['tabletop']['id'] = f,
        j['tabletop']['variant_id'] = g,
        this['userData']['parts']['tabletop']), k;
        for (k of j)
            k['change_material'](f, g);
    }
    ['set_size'](f) {
        var g, g;
        !this['is_root'] && this['userData']?.['params']?.['spec']?.['is_fill'] && (this['userData']['connected'] = this['get_connected'](),
        g = this['userData']['path'],
        this['new_size'] = {
            'x': parseInt(f['x']),
            'y': parseInt(f['y']),
            'z': parseInt(f['z'])
        },
        g = this['get_child_params_by_path'](g),
        this['update_connected_sizes'](this['userData']['parent'], g)),
        super['set_size'](f),
        sc['need_update_tabletops'](),
        check_overlap();
    }
    ['rotate_left']() {
        custom_settings['free_rotation'] ? this['rotation']['y'] -= THREE['MathUtils']['degToRad'](custom_settings['free_rotation_angle']) : this['rotation']['y'] -= Math['PI'] / 0x2,
        this['updateMatrixWorld'](),
        this['box']['update'](),
        this['userData']['parts']['tabletop']['length'] && this['check_tabletop_rebuild']() && sc['build_tabletop'](),
        this['check_inside_room']();
    }
    ['rotate_right']() {
        custom_settings['free_rotation'] ? this['rotation']['y'] += THREE['MathUtils']['degToRad'](custom_settings['free_rotation_angle']) : this['rotation']['y'] += Math['PI'] / 0x2,
        this['updateMatrixWorld'](),
        this['box']['update'](),
        this['userData']['parts']['tabletop']['length'] && this['check_tabletop_rebuild']() && sc['build_tabletop'](),
        this['check_inside_room']();
    }
    ['check_inside_room']() {
        var f = this['box'], g;
        for (g of room['walls']['children'])
            'floor' !== g['name'] && 'ceiling' !== g['name'] && ('front_wall' === g['name'] ? f['min']['z'] < g['box']['max']['z'] && (this['position']['z'] = this['position']['z'] + (g['box']['max']['z'] - f['min']['z'])) : 'back_wall' === g['name'] ? f['max']['z'] > g['box']['min']['z'] && (this['position']['z'] = this['position']['z'] + (g['box']['min']['z'] - f['max']['z'])) : 'right_wall' === g['name'] ? f['max']['x'] > g['box']['min']['x'] && (this['position']['x'] = this['position']['x'] + (g['box']['min']['x'] - f['max']['x'])) : 'left_wall' === g['name'] && f['min']['x'] < g['box']['max']['x'] && (this['position']['x'] = this['position']['x'] + (g['box']['max']['x'] - f['min']['x'])));
    }
    ['set_defaults_param'](f, g, h) {
        g !== pp['const']['not_set_value'] && ('number' === h ? g = parseInt(g, 0xa) : 'bool' === h && (g = to_int(g)));
        var h = this['userData']['params']['spec'];
        Array['isArray'](h['defaults']) && (h['defaults'] = {}),
        utils['nested_object']['set'](h['defaults'], f, g);
    }
    ['get_defaults_param'](f) {
        return _['get'](this['userData']['params']['spec']['defaults'], f);
    }
    ['build_tabletop']() {
        var f = this['userData']['parts']['tabletop'];
        if (f && f['length']) {
            for (var g of f)
                g['_rebuild']();
            sc['build_tabletop']();
        }
    }
    ['check_tabletop_rebuild']() {
        return !this['userData']['tabletopGroup'];
    }
    ['is_detached_tabletop']() {
        return 0x1 === this['userData']['parts']['tabletop']['length'] && '__tabletop' === this['userData']['params']['spec']['element_type'];
    }
    ['reload_module'](f, g=!0x0) {
        if (this['userData']['is_root'])
            return !0x1;
        var h = merge_copies(this['userData']['params'], module_utils['get_child_params_by_path'](this, this['userData']['path'])), j = h['spec'], k = this['userData']['root'], m = (f?.['spec']?.['id'] ? f['spec'] : j)['id'], n;
        if (!pp['libs']['catalogs'][j['element_type']]['items'][m])
            return !0x1;
        var m = copy_object({
            'id': h['id'],
            'spec': {
                'id': m,
                'selected_variant': -0x1,
                'element_type': j['element_type'],
                'can_change': j['can_change'],
                'movement_locked': j['movement_locked'],
                'not_load_default': j['not_load_default'],
                'fill_content': j['fill_content']
            },
            'type': h['type'],
            'condition': h['condition'],
            'visible': h['visible'],
            'active': h['active'],
            'size': h['size'],
            'pos': h['pos'],
            'pivot': h['pivot'],
            'rot': h['rot'],
            'c_rot': h['c_rot'],
            'comments': h['comments']
        })
          , {parent: j, parentPath: f, child: h, childIndex: q} = (f && void 0x0 !== f['name'] && (m['name'] = f['name']),
        h['variables']?.['override'] && (m['variables'] = {
            'override': copy_object(h['variables']['override'])
        }),
        h['spec']['params_apply'] && (m['spec']['params_apply'] = copy_object(h['spec']['params_apply'])),
        f?.['spec']?.['fill_content'] && (m['spec']['fill_content'] = f['spec']['fill_content']),
        f?.['spec']?.['params_apply'] && (m['spec']['params_apply'] = f['spec']['params_apply']),
        h['toggle'] && (m['toggle'] = copy_object(h['toggle'])),
        module_utils['get_parent_and_child_by_path'](k, this['userData']['path']));
        if (!h || q < 0x0)
            return !0x1;
        var h = k['userData']['parts']['tabletop']['length']
          , m = (this['load_templates'](m),
        copy_object(m));
        j['children'][q] = m;
        let v = null
          , w = (v = f && '0' !== f ? module_utils['get_child_by_path'](this, f) : this['userData']['root'],
        null);
        for (; v; ) {
            if (v['userData']['computed']['defaults']) {
                w = v['userData']['computed']['defaults'];
                break;
            }
            v = v['userData']['parent'];
        }
        w = w && copy_object(w);
        var j = m['spec']['defaults'] ? copy_object(m['spec']['defaults']) : {}
          , q = module_utils['get_global_defaults'](m)
          , f = module_utils['create_defaults'](j, w, q);
        return module_utils['init_empty_values_recursive'](m, f, !0x1),
        this['clean_parts'](),
        g && (k['update_params_types'](!0x0),
        this['_rebuild'](),
        k['_update_pos'](),
        k['_extend_size']()),
        h && sc['need_update_tabletops'](),
        !0x0;
    }
    ['change_id'](f, g=!0x0) {
        var h = this['userData']['params'], j = this['userData']['params']['spec'], k = this['userData']['root'], m;
        if (this['userData']['is_root'])
            return !0x1;
        if (!j['can_change']['id'])
            return !0x1;
        if (!f || '0' === f)
            return !0x1;
        if ('' + j['id'] == '' + f)
            return !0x1;
        if (!pp['libs']['catalogs'][j['element_type']]['items'][f])
            return !0x1;
        h['spec']['defaults'] || (h['spec']['defaults'] = {}),
        h['spec']['defaults'] = fix_json_empty_object(h['spec']['defaults']);
        var {parent: q, parentPath: v, child: w, childIndex: x} = module_utils['get_parent_and_child_by_path'](k, this['userData']['path']);
        if (!w || x < 0x0)
            return !0x1;
        var w = this['change_id_in_params'](h, f, this)
          , h = (void 0x0 !== j['not_load_default'] && (w['spec']['not_load_default'] = j['not_load_default']),
        k['userData']['parts']['tabletop']['length'])
          , f = copy_object(w);
        q['children'][x] = f;
        let y = null
          , z = (y = v && '0' !== v ? module_utils['get_child_by_path'](this, v) : this['userData']['root'],
        j['defaults']);
        z = z && copy_object(z);
        var w = f['spec']['defaults'] ? copy_object(f['spec']['defaults']) : {}
          , q = module_utils['get_global_defaults'](f)
          , x = module_utils['create_defaults'](w, z, q);
        return module_utils['init_empty_values_recursive'](f, x, !0x1),
        this['clean_parts'](),
        g && (k['update_params_types'](!0x0),
        this['_rebuild'](),
        k['_build_fast']()),
        h && sc['need_update_tabletops'](),
        !0x0;
    }
    ['change_id_in_params'](f, g, h) {
        var j = f['spec']
          , g = copy_object({
            'id': f['id'],
            'spec': {
                'id': g,
                'selected_variant': -0x1,
                'element_type': j['element_type'],
                'can_change': j['can_change'],
                'movement_locked': j['movement_locked'],
                'not_load_default': 0x1,
                'fill_content': j['fill_content'],
                'defaults': j['defaults']
            },
            'type': f['type'],
            'condition': f['condition'],
            'visible': f['visible'],
            'active': f['active'],
            'size': f['size'],
            'pos': f['pos'],
            'pivot': f['pivot'],
            'rot': f['rot'],
            'c_rot': f['c_rot'],
            'comments': f['comments']
        })
          , j = (f['variables']?.['override'] && (g['variables'] || (g['variables'] = {}),
        g['variables']['override'] = copy_object(f['variables']['override'])),
        f['variables']?.['apply'] && (g['variables'] || (g['variables'] = {}),
        g['variables']['apply'] = copy_object(f['variables']['apply'])),
        f['toggle'] && (g['toggle'] = copy_object(f['toggle'])),
        f['spec']['params_apply'] && (g['spec']['params_apply'] = copy_object(f['spec']['params_apply'])),
        h?.['userData'] ? module_utils['get_child_params_by_path'](h, h['userData']['path']) : f)
          , h = module_utils['find_fill_sections'](j, 0x1)
          , k = g['spec']['fill_content'];
        if (k)
            for (var l of h) {
                var m = l['section_key'];
                k[m] && (k[m]['children'] = l['children']?.['length'] ? copy_object(l['children']) : []);
            }
        return this['load_templates'](g),
        g;
    }
    ['mass_change_id_by_type'](f, g, h) {
        var j = this['userData']['params'], k = this['userData']['root'], m = k['userData']['parts'], q, q, q;
        if (g) {
            h = h || ( () => {}
            );
            for (var v of m['module']) {
                v && (q = v['userData']['params']['spec'])['element_type'] === g && q['can_change']['id'] && (q = j['spec']['id'],
                !0x1 !== h(j)) && q !== (q = void 0x0 !== f ? f : j['spec']['id']) && v['change_id'](q, !0x1);
            }
            var w = this['userData']['selected_template']
              , x = j['spec']['templates'] || []
              , y = (A, B, C) => {
                if ('module' === A['type'] && A['spec']?.['element_type'] === g && A['spec']['can_change']?.['id']) {
                    var D = A['spec']['id'];
                    if (!0x1 !== h(A)) {
                        var E = void 0x0 !== f ? f : A['spec']['id'];
                        if (D !== E) {
                            var D = A['spec']['not_load_default'], F = this['change_id_in_params'](A, E), G = (void 0x0 !== D && (F['spec']['not_load_default'] = D),
                            A), H, I;
                            for (H of Object['keys'](G))
                                delete G[H];
                            for (I of Object['keys'](F))
                                G[I] = F[I];
                            let J = A['spec']['defaults'];
                            J = J && copy_object(J);
                            var E = G['spec']['defaults'] ? copy_object(G['spec']['defaults']) : {}
                              , D = module_utils['get_global_defaults'](G)
                              , A = module_utils['create_defaults'](E, J, D);
                            module_utils['init_empty_values_recursive'](G, A, !0x1);
                        }
                    }
                }
            }
            ;
            for (let A = 0x0; A < x['length']; A++) {
                var z = {
                    'type': 'section',
                    'spec': {
                        'templates': [x[A]]
                    }
                };
                module_utils['walk_params_tree'](z, y);
            }
            k['update_params_types'](!0x0),
            k['_rebuild']();
        }
    }
    ['has_type'](f) {
        return Boolean(this['userData']['parts'][f] && this['userData']['parts'][f]['length']);
    }
    ['delete']() {
        var f = this['userData']['parts']?.['tabletop']?.['length'];
        this['dispatchEvent']({
            'type': 'delete',
            'message': this['uuid']
        }),
        this['reset_model'](),
        this['del_spl'](),
        f && this['check_tabletop_rebuild']() && sc['build_tabletop'](),
        sc['get_price'](),
        pp['config']['on_demand_render'] && pp['render']();
    }
    ['del_spl']() {
        if (this['userData']?.['params']?.['spec']?.['is_fill']) {
            var f = this['userData']['root'];
            let g = this['userData']['parent']
              , h = Number(this['userData']['path']['split'](',')['pop']())
              , i = [];
            f['walk_params_tree'](j => {
                'fill_section' == j['type'] && g instanceof CabinetFillSection && j['section_key'] && j['section_key'] === g?.['userData']?.['params']?.['section_key'] && i['push'](j);
            }
            , f['userData']['params'], 0x2),
            0x0 < i['length'] && i['forEach'](j => {
                j['children']['splice'](h, 0x1);
            }
            );
        }
        for (let j = this['children']['length']; j--; )
            this['remove'](this['children'][j]);
        for (let k = room['active_objects']['length']; k--; )
            this['uuid'] === room['active_objects'][k]['uuid'] && (room['remove'](this),
            room['active_objects']['splice'](k, 0x1));
        for (let l = d_objects['length']; l--; )
            this['uuid'] == d_objects[l]['uuid'] && d_objects['splice'](l, 0x1);
        this['userData']['is_root'] || this['userData']['root']['remove_child_by_path'](this['userData']['path']);
    }
    ['reset_model'](f) {
        let g = f
          , h = []
          , i = [];
        if ((g = f ? g : this)['traverse'](function(j) {
            g !== j && 'Number' != j['name'] && 'Number' != j['parent']['name'] && 'ResizeControls' != j['name'] && 'ResizeControls' != j['parent']['name'] && ('Molded_elements' !== j['type'] && 'CabinetCokol' !== j['temp_type'] && 'CabinetLeg' !== j['temp_type'] && 'Section' !== j['temp_type'] || i['push'](j),
            'Group' !== j['type']) && h['push'](j);
        }),
        h['length']) {
            for (let j = h['length'] - 0x1; -0x1 < j; j--)
                h[j]['parent']['remove'](h[j]),
                h[j]['geometry'] && h[j]['geometry']['dispose'](),
                h[j]['material'] && !isArray(h[j]['material']) && h[j]['material']['map'] && h[j]['material']['map']['dispose'](),
                h['splice'](h['indexOf'](h[j]), 0x1);
        }
        if (i['length']) {
            for (let k = i['length'] - 0x1; -0x1 < k; k--)
                'function' == typeof i[k]['delete'] ? i[k]['delete']() : i[k]['parent']['remove'](i[k]);
        }
    }
    ['copypaste']() {
        let f = room['box']['clone']();
        f['expandByScalar'](0.1);
        var g = copy_object(this['userData']['params']);
        g['obj_id'] = void 0x0;
        let h = sc['add_object']('module', g, !0x1)
          , i = (h['position']['copy'](this['position']),
        h['rotation']['copy'](this['rotation']),
        0x0 === h['rotation']['y'] && (h['position']['x'] += h['userData']['params']['size']['x'] / units),
        h['rotation']['y'] === Math['PI'] && (h['position']['x'] -= h['userData']['params']['size']['x'] / units),
        h['rotation']['y'] === Math['PI'] / 0x2 && (h['position']['z'] -= h['userData']['params']['size']['x'] / units),
        h['rotation']['y'] === -Math['PI'] / 0x2 && (h['position']['z'] += h['userData']['params']['size']['x'] / units),
        h['userData']['parts']['tabletop']['length'] && sc['need_update_tabletops'](),
        0x0);
        setTimeout(function() {
            h['box']['update'](),
            f['containsBox'](h['box']) || (h['delete'](),
            i = 0x1);
        }, 0x64),
        setTimeout(function() {
            0x0 == i && get_total_price_test();
        }, 0xc8);
    }
    ['show_drag_areas'](e, f) {
        this['userData']['params']['id'] === e && this['userData']['params']['lib'] === f || Object['keys'](this['userData']['parts']['fill_section'])['length'] && Object['keys'](this['userData']['parts']['fill_section'])['forEach'](g => {
            var h = this['userData']['parts']['fill_section'][g], j;
            if (pp['events']?.['module']?.['before_show_drag_area'] && !0x1 === pp['events']['module']['before_show_drag_area'](this, h, e, f))
                return;
            if (h['userData']['params']['fill']) {
                if (h['userData']['params']['fill']['is_drag_categories']) {
                    var g = h['userData']['params']['fill']['drag_categories'] || [];
                    if (0x0 < g['length'])
                        for (var k of g) {
                            var m = k['key'];
                            if (f == m) {
                                var m = pp['libs']['catalogs'][m]?.['get_item'](e);
                                if (m && m['active'] && m['category']['includes'](k['id'])) {
                                    h['show_drag_area']();
                                    break;
                                }
                            }
                        }
                    else
                        h['show_drag_area']();
                } else {
                    var g = h['userData']['params']['fill']['drag_items'] || [];
                    if (0x0 < g['length'])
                        for (var n of g) {
                            var q = n['key'], v;
                            if (n['id'] == e && f == q) {
                                var n = pp['libs']['catalogs'][q]?.['get_item'](e);
                                if (n && n['active']) {
                                    h['show_drag_area']();
                                    break;
                                }
                            }
                        }
                    else
                        h['show_drag_area']();
                }
            } else
                h['show_drag_area']();
        }
        );
    }
    ['hide_drag_areas']() {
        Object['keys'](this['userData']['parts']['fill_section'])['length'] ? Object['keys'](this['userData']['parts']['fill_section'])['forEach'](f => {
            var g;
            this['userData']['parts']['fill_section'][f]['hide_drag_area']();
        }
        ) : this['hide_drag_area']();
    }
    ['clear_draggables']() {
        Object['keys'](this['userData']['parts']['module'])['forEach'](f => {
            this['remove_by_path'](f);
        }
        ),
        sc['get_price']();
    }
    ['get_draggables'](f=!0x1) {
        let g = [];
        return Object['keys'](this['userData']['parts']['module'])['forEach'](h => {
            g['push'](this['userData']['parts']['module'][h]);
        }
        ),
        g;
    }
    ['show_draggables']() {
        Object['keys'](this['userData']['parts']['module'])['forEach'](f => {
            this['userData']['parts']['draggable'][f]['show_helpers']();
        }
        );
    }
    ['hide_draggables']() {
        Object['keys'](this['userData']['parts']['module'])['forEach'](f => {
            this['userData']['parts']['module'][f]['hide_helpers']();
        }
        );
    }
    ['set_snap_points']() {
        this['userData']['points_list'] = [],
        Object['keys'](this['userData']['parts']['point'])['length'] ? Object['keys'](this['userData']['parts']['point'])['forEach'](f => {
            this['userData']['points_list']['push'](this['userData']['parts']['point'][f]);
        }
        ) : super['set_snap_points']();
    }
    ['show_snap_points']() {
        Object['keys'](this['userData']['parts']['point'])['length'] && Object['keys'](this['userData']['parts']['point'])['forEach'](f => {
            this['userData']['parts']['point'][f]['hide_helpers']();
        }
        ),
        this['snap_points']['visible'] = !0x1;
    }
    ['hide_snap_points']() {
        Object['keys'](this['userData']['parts']['point'])['length'] && Object['keys'](this['userData']['parts']['point'])['forEach'](f => {
            this['userData']['parts']['point'][f]['hide_helpers']();
        }
        ),
        this['snap_points']['visible'] = !0x1;
    }
    ['set_facades_visible'](e) {
        this['userData']['facades_visible'] = e,
        Object['keys'](this['userData']['parts']['facade'])['forEach'](f => {
            this['userData']['parts']['facade'][f]['visible'] = e;
        }
        );
    }
    ['set_identificator'](e, f) {
        this['userData']['is_root'] && 'function' == typeof f && traverse_parts(this, (g, h, j) => {
            e['includes'](g['userData']?.['params']?.['id']) && f(g, h, j);
        }
        );
    }
    ['check_embed_in_section'](q, A=!0x1) {
        if (!this['userData']['params']['spec']['is_fill'])
            return !0x1;
        var B = this['userData']['params']['spec']['templates'], C = this['userData']['computed']['size']['x'], F = this['userData']['computed']['size']['y'], G = this['userData']['computed']['size']['z'], H = !!this['userData']['params']['spec']['nested_elements'], I;
        let J = 0x0;
        for (let a7 = 0x0; a7 < B['length']; a7++) {
            var K = 0x0 != B[a7]['min']['x'] ? B[a7]['min']['x'] : -0x1 / 0x0
              , L = 0x0 != B[a7]['max']['x'] ? B[a7]['max']['x'] : 0x1 / 0x0
              , N = 0x0 != B[a7]['min']['y'] ? B[a7]['min']['y'] : -0x1 / 0x0
              , O = 0x0 != B[a7]['max']['y'] ? B[a7]['max']['y'] : 0x1 / 0x0
              , P = 0x0 != B[a7]['min']['z'] ? B[a7]['min']['z'] : -0x1 / 0x0
              , Q = 0x0 != B[a7]['max']['z'] ? B[a7]['max']['z'] : 0x1 / 0x0;
            if (K <= C && C <= L && N <= F && F <= O && P <= G && G <= Q) {
                J = 0x1;
                break;
            }
        }
        if (!J)
            return this['fill_helper'] && this['fill_helper']['highlight'](),
            this['fill_helper'] || (this['fill_helper'] = new Fill_Helper({
                'parent': this,
                'size': {
                    'x': this['userData']['params']['size']['x'] / units,
                    'y': this['userData']['params']['size']['y'] / units,
                    'z': this['userData']['params']['size']['z'] / units
                },
                'scale': {
                    'x': 0x1,
                    'y': 0x1,
                    'z': 0x0
                }
            }),
            this['fill_helper']['highlight'](),
            scene['add'](this['fill_helper'])),
            !0x1;
        let R = q['userData']['children'] || [];
        q['userData']['params']['spec']['replace'] && 0x0 < R['length'] && 0x0 < R['map']( (a8, a9) => 'Module' === a8['temp_type'] ? a9 : -0x1)['filter'](a8 => -0x1 !== a8)['length'] && (R = R['filter'](a8 => 'Module' !== a8['temp_type']));
        var S = q['userData']?.['dragCache']?.['fill_intersec_objects'] || [];
        let T = [...R, ...S]['filter'](a8 => a8['uuid'] !== this['uuid']);
        if (this['parent_uuid'] && this['section_uuid'] == q['uuid']) {
            let a8 = get_excluded_objects(q, this) || []
              , a9 = this['userData']['connected'] || [];
            a9 = a9['filter'](aa => !a8['includes'](aa)),
            T = [...R, ...S]['filter'](aa => this['object_path'] != aa['userData']?.['path'] && !a9['includes'](aa['userData']?.['path']));
        }
        var S = new THREE['Vector3'](this['userData']['params']['size']['x'] / units,this['userData']['params']['size']['y'] / units,this['userData']['params']['size']['z'] / units), U;
        let W = new THREE['Vector3'](0x0,S['y'] / 0x2,0x0)
          , Z = [];
        if (H) {
            if (traverse_parts(this, (aa, ab, ac) => {
                var aa, ad, ae, af, ag, ah, ae, ag;
                aa['userData']?.['params']?.['fill_intersec'] && (aa = this['userData']['root']['get_child_by_path'](aa['userData']['path'])) && (ad = new THREE['Vector3'](aa['userData']['computed']['size']['x'] / units,aa['userData']['computed']['size']['y'] / units,aa['userData']['computed']['size']['z'] / units),
                ae = aa['userData']['params']['pivot'] || {
                    'x': -0x1,
                    'y': -0x1,
                    'z': -0x1
                },
                af = new THREE['Vector3'](ad['x'] / 0x2,ad['y'] / 0x2,ad['z'] / 0x2),
                ae && (ag = 'string' == typeof ae['x'] ? parseFloat(ae['x']['split']('::')[0x0]) : ae['x'],
                ah = 'string' == typeof ae['y'] ? parseFloat(ae['y']['split']('::')[0x0]) : ae['y'],
                ae = 'string' == typeof ae['z'] ? parseFloat(ae['z']['split']('::')[0x0]) : ae['z'],
                af['set'](ag * -ad['x'] / 0x2, ah * -ad['y'] / 0x2, ae * -ad['z'] / 0x2)),
                (ag = new THREE['Box3']()['setFromCenterAndSize'](af, ad))['applyMatrix4'](aa['matrixWorld']),
                Z['push'](ag));
            }
            ),
            0x0 === Z['length']) {
                let aa = new THREE['Vector3'](0x0,S['y'] / 0x2,0x0);
                var H = new THREE['Box3']()['setFromCenterAndSize'](aa, S);
                H['applyMatrix4'](this['matrixWorld']),
                Z['push'](H);
            }
        } else {
            let ab = new THREE['Vector3'](0x0,S['y'] / 0x2,0x0);
            var H = new THREE['Box3']()['setFromCenterAndSize'](ab, S);
            H['applyMatrix4'](this['matrixWorld']),
            Z['push'](H);
        }
        for (U of T)
            if (!(U['userData'] && (U['userData']['is_drag_area'] || U['userData']['parent']instanceof FillDragArea) || U instanceof FillDragArea)) {
                var a0 = new THREE['Vector3'](U['userData']['computed']['size']['x'] / units,U['userData']['computed']['size']['y'] / units,U['userData']['computed']['size']['z'] / units), a1 = U['userData']['params']['pivot'] || {
                    'x': -0x1,
                    'y': -0x1,
                    'z': -0x1
                }, a2 = new THREE['Vector3'](a0['x'] / 0x2,a0['y'] / 0x2,a0['z'] / 0x2), a3, a4, a1;
                a1 && (a3 = 'string' == typeof a1['x'] ? parseFloat(a1['x']['split']('::')[0x0]) : a1['x'],
                a4 = 'string' == typeof a1['y'] ? parseFloat(a1['y']['split']('::')[0x0]) : a1['y'],
                a1 = 'string' == typeof a1['z'] ? parseFloat(a1['z']['split']('::')[0x0]) : a1['z'],
                a2['set'](a3 * -a0['x'] / 0x2, a4 * -a0['y'] / 0x2, a1 * -a0['z'] / 0x2));
                let ac = new THREE['Box3']()['setFromCenterAndSize'](a2, a0);
                ac['applyMatrix4'](U['matrixWorld']);
                var a3 = Z['some'](ad => boxes_intersect_with_eps(ad['clone'](), ac['clone']())), a5 = new THREE['Box3Helper'](ac,0xff22222), a6 = new THREE['Box3Helper'](Z[0x0],0xff22222), a4;
                if (a3)
                    return this['fill_helper'] ? this['fill_helper']['highlight']() : (this['fill_helper'] = new Fill_Helper({
                        'parent': this,
                        'size': {
                            'x': this['userData']['params']['size']['x'] / units,
                            'y': this['userData']['params']['size']['y'] / units,
                            'z': this['userData']['params']['size']['z'] / units
                        },
                        'scale': {
                            'x': 0x1,
                            'y': 0x1,
                            'z': 0x0
                        }
                    }),
                    this['fill_helper']['highlight'](),
                    scene['add'](this['fill_helper'])),
                    this['object_path'] && A && this['section_uuid'] == q['uuid'] && (a4 = scene['getObjectByProperty']('uuid', this['section_uuid']))?.['userData']?.['root']?.['userData']?.['parts_by_path']?.['module']?.[this['object_path']] && (a4['userData']['root']['userData']['parts_by_path']['module'][this['object_path']]['visible'] = !0x0),
                    !0x1;
            }
        return this['fill_helper'] && this['fill_helper']['unhighlight'](),
        !0x0;
    }
    ['drag_move'](q, A, B) {
        if (this['userData']['params']['spec']['is_fill']) {
            if (0x0 == this['userData']['own_object']['visible'] && (this['userData']['own_object']['visible'] = !0x0),
            !A['userData']['dragCache']) {
                let ab = B['get_size']()
                  , ac = []
                  , ad = [];
                if (traverse_parts(A['userData']['root'], (an, ao, ap) => {
                    !an['userData']?.['params']?.['fill_intersec'] || this['object_path'] && (an['userData']['path']['startsWith'](this['object_path']) || A['uuid'] != this['section_uuid']) || ac['push'](A['userData']['root']['get_child_by_path'](an['userData']['path']));
                }
                ),
                this['userData']['params']['spec']['nested_elements'] && this['section_uuid'] == A['uuid'] && this['object_path'] && (traverse_parts(this, (an, ao, ap) => {
                    var an, an;
                    an['userData']?.['params']?.['fill_intersec'] && ((an = an['userData']['path']['split'](','))['shift'](),
                    an = an['join'](','),
                    ad['push'](A['userData']['root']['get_child_by_path'](this['object_path'] + ',' + an)));
                }
                ),
                0x0 < ad['length']) && (ac = ac['filter'](an => !ad['some'](ao => ao['userData']?.['path'] === an['userData']?.['path']))),
                A['userData']?.['params']?.['spec']?.['replace']) {
                    let an = A['userData']['path'];
                    ac = ac['filter'](ao => {
                        var ao = ao?.['userData']?.['path'];
                        return !ao || ao !== an && !ao['startsWith'](an + ',');
                    }
                    );
                }
                let ae = ['x', 'y', 'z']
                  , af = {
                    'x': [],
                    'y': [],
                    'z': []
                };
                ae['forEach'](ao => {
                    var ap = A['userData']['params']['spec']?.['step_axes'] ? A['userData']['params']['spec']['step_axes'][ao] / units : 0x1
                      , aq = ab['min'][ao]
                      , ar = ab['max'][ao];
                    let as = aq;
                    for (let at = 0x0; as < ar; at++)
                        af[ao]['push'](as),
                        as += ap;
                    af[ao][af[ao]['length'] - 0x1] !== ar && af[ao]['push'](ar);
                }
                );
                var C = new THREE['Vector3'](0x0,0x0,0x1);
                let ag = new THREE['Quaternion']();
                A['getWorldQuaternion'](ag);
                var C = C['clone']()['applyQuaternion'](ag), F;
                let ah = 0.99 < Math['abs'](C['x'])
                  , ai = A['userData']['children'] || []
                  , aj = [...ai = A['userData']['params']['spec']['replace'] && 0x0 < ai['length'] && 0x0 < ai['map']( (ao, ap) => 'Module' === ao['temp_type'] ? ap : -0x1)['filter'](ao => -0x1 !== ao)['length'] ? ai['filter'](ao => 'Module' !== ao['temp_type']) : ai]
                  , ak = A['userData']['root']
                  , al = {
                    'x': this['userData']['params']['spec']['fill_size_x'] || 0x0,
                    'y': this['userData']['params']['spec']['fill_size_y'] || 0x0,
                    'z': this['userData']['params']['spec']['fill_size_z'] || 0x0
                }
                  , am = {
                    'x': Math['abs'](ab['max']['x'] - ab['min']['x']),
                    'y': Math['abs'](ab['max']['y'] - ab['min']['y']),
                    'z': Math['abs'](ab['max']['z'] - ab['min']['z'])
                };
                A['userData']['dragCache'] = {
                    'dragAreaSize': ab,
                    'allow_pos': af,
                    'merge_array': aj,
                    'root': ak,
                    'isRotated': ah,
                    'innerSize': am,
                    'q': ag,
                    'excluded': get_excluded_objects(A, this, al),
                    'fill_intersec_objects': ac
                };
            }
            let {dragAreaSize: I, allow_pos: J, merge_array: K, root: L, isRotated: N, innerSize: O, q: P, excluded: Q} = A['userData']['dragCache']
              , S = q['clone']()
              , U = !0x1
              , W = {
                'x': this['userData']['params']['spec']['fill_size_x'] || 0x0,
                'y': this['userData']['params']['spec']['fill_size_y'] || 0x0,
                'z': this['userData']['params']['spec']['fill_size_z'] || 0x0
            }
              , Z = {
                'x': this['userData']['computed']['size']['x'],
                'y': this['userData']['computed']['size']['y'],
                'z': this['userData']['computed']['size']['z']
            }
              , a0 = {
                ...Z
            }
              , a1 = (N && (Z = {
                'x': this['userData']['computed']['size']['z'],
                'y': this['userData']['computed']['size']['y'],
                'z': this['userData']['computed']['size']['x']
            },
            a0 = {
                ...Z
            },
            W['x'] = this['userData']['params']['spec']['fill_size_z'] || 0x0,
            W['z'] = this['userData']['params']['spec']['fill_size_x'] || 0x0),
            new THREE['Vector3']())
              , a2 = ['x', 'y', 'z']
              , a3 = (L['updateMatrixWorld'](!0x0),
            B['updateMatrixWorld'](!0x0),
            this['_excluded_objects'] || (this['_excluded_objects'] = Q),
            this['_excluded_objects'])
              , a4 = {
                'minX': Math['abs'](S['x'] - I['min']['x']),
                'maxX': Math['abs'](I['max']['x'] - S['x']),
                'minY': Math['abs'](S['y'] - I['min']['y']),
                'maxY': Math['abs'](I['max']['y'] - S['y']),
                'minZ': Math['abs'](S['z'] - I['min']['z']),
                'maxZ': Math['abs'](I['max']['z'] - S['z'])
            };
            var C = Object['keys'](a4)['reduce']( (ao, ap) => a4[ao] < a4[ap] ? ao : ap);
            let a5 = I['max']['z'] / 0x2 / units;
            N && (a5 = I['max']['x'] / 0x2 / units);
            let a6;
            switch (C) {
            case 'minX':
                a6 = new THREE['Vector3'](0x1,0x0,0x0)['multiplyScalar'](a5);
                break;
            case 'maxX':
                a6 = new THREE['Vector3'](-0x1,0x0,0x0)['multiplyScalar'](a5);
                break;
            case 'minY':
                a6 = new THREE['Vector3'](0x0,0x1,0x0)['multiplyScalar'](a5);
                break;
            case 'maxY':
                a6 = new THREE['Vector3'](0x0,-0x1,0x0)['multiplyScalar'](a5);
                break;
            case 'minZ':
                a6 = new THREE['Vector3'](0x0,0x0,0x1)['multiplyScalar'](a5);
                break;
            case 'maxZ':
                a6 = new THREE['Vector3'](0x0,0x0,-0x1)['multiplyScalar'](a5);
                break;
            }
            S['add'](a6),
            a2['forEach'](ao => {
                var ap = new THREE['Vector3']()
                  , aq = (ap[ao] = 0x1,
                0.01)
                  , ap = ap['clone']()
                  , ar = ap['clone']()['negate']()
                  , as = S['clone']()['addScaledVector'](ap, aq)
                  , aq = S['clone']()['addScaledVector'](ar, aq)
                  , as = new THREE['Raycaster'](as,ap,0x0,I['max'][ao] - I['min'][ao])
                  , ap = new THREE['Raycaster'](aq,ar,0x0,I['max'][ao] - I['min'][ao]);
                if (as['layers']['set'](0x0),
                ap['layers']['set'](0x0),
                0x1 === W[ao]) {
                    let aw = 0x1 / 0x0
                      , ax = 0x1 / 0x0;
                    var aq = as['intersectObjects'](K, !0x0)['filter'](az => {
                        var aA = get_parent_module(az['object']), az;
                        return !!az['object']['visible'] && aA['userData']['path'] != this['object_path'] && (az = aA['userData']?.['path'],
                        !!a3['includes'](az) || !module_utils['compare_path_children'](this['object_path'], az) && az && !this['userData']['connected']['includes'](az));
                    }
                    ), ar = ap['intersectObjects'](K, !0x0)['filter'](az => {
                        var aA = get_parent_module(az['object']), az;
                        return !!az['object']['visible'] && aA['userData']['path'] != this['object_path'] && (az = aA['userData']?.['path'],
                        !!a3['includes'](az) || !module_utils['compare_path_children'](this['object_path'], az) && az && !this['userData']['connected']['includes'](az));
                    }
                    ), at, au;
                    0x0 < aq['length'] && get_parent_module(aq[0x0]['object']) && (aw = aq[0x0]['distance']),
                    0x0 < ar['length'] && get_parent_module(ar[0x0]['object']) && (ax = ar[0x0]['distance']),
                    isFinite(aw) && 0x0 !== aw || (aw = Math['abs'](I['max'][ao] - S[ao])),
                    isFinite(ax) && 0x0 !== ax || (ax = Math['abs'](S[ao] - I['min'][ao]));
                    let ay = aw + ax;
                    0x0 === ay ? a0[ao] = Z[ao] : (ay = Math['min'](ay, O[ao]),
                    a0[ao] = ay * units),
                    'y' === ao ? a1[ao] = S[ao] - ax : (a1[ao] = S[ao] - ax + ay / 0x2,
                    a1[ao] = clamp(a1[ao], I['min'][ao] + ay / 0x2, I['max'][ao] - ay / 0x2));
                } else {
                    let az = J[ao][0x0]
                      , aA = Math['abs'](S[ao] - az);
                    for (let aB = 0x1; aB < J[ao]['length']; aB++) {
                        var av = Math['abs'](S[ao] - J[ao][aB]);
                        av < aA && (aA = av,
                        az = J[ao][aB]);
                    }
                    S[ao] = az,
                    a1[ao] = 'y' === ao ? clamp(S[ao], I['min'][ao], I['max'][ao] - a0[ao] / units) : clamp(S[ao], I['min'][ao] + a0[ao] / (0x2 * units), I['max'][ao] - a0[ao] / (0x2 * units));
                }
            }
            );
            var q = new THREE['Vector3'](Z['x'],Z['y'],Z['z'])
              , B = new THREE['Vector3'](a0['x'],a0['y'],a0['z'])
              , C = ((0.1 < Math['abs'](q['x'] - B['x']) || 0.1 < Math['abs'](q['y'] - B['y']) || 0.1 < Math['abs'](q['z'] - B['z'])) && (N ? this['userData']['params']['size'] = {
                'x': a0['z'],
                'y': a0['y'],
                'z': a0['x']
            } : this['userData']['params']['size'] = {
                ...a0
            },
            this['_rebuild'](),
            this['_size_objects'] = null),
            this['_snap_points'] && this['add_snap_points_group'](this['_snap_points'], A, a1),
            new THREE['Euler']()['setFromQuaternion'](P, 'XYZ'));
            this['userData']['own_object']['scale']['set'](0x1, 0x1, 0x1);
            const a7 = 0x0
              , a8 = 0x1 === A['userData']['params']?.['spec']?.['invert']?.['x']
              , a9 = 0x1 === A['userData']['params']?.['spec']?.['invert']?.['y']
              , aa = 0x1 === A['userData']['params']?.['spec']?.['invert']?.['z'];
            a8 && W['x'] && (this['userData']['own_object']['scale']['x'] = -0x1),
            a9 && W['y'] && (this['userData']['own_object']['scale']['y'] = -0x1),
            aa && W['z'] && (this['userData']['own_object']['scale']['z'] = -0x1),
            this['rotation']['copy'](C),
            this['position']['copy'](a1);
            var q = this['try_snap_to_nearby_point'](A, W, J);
            if (this['local_pos'] = q || A['userData']['own_object']['worldToLocal'](a1['clone']()),
            !this['_fill_helpers']) {
                this['_fill_helpers'] = {
                    'uuid': '',
                    'helpers': []
                };
                for (let ao = 0x0; ao < this['userData']['connected']['length']; ao++) {
                    var G = this['userData']['connected'][ao], G, H, H;
                    a3['includes'](G) || (G = L['userData']['parts_by_path']['module'][G]) && (G['userData']['own_object']['visible'] = !0x1,
                    H = G['userData']['computed']['size']['clone']()['divideScalar'](units),
                    (H = new Fill_Helper({
                        'parent': G,
                        'size': H['clone']()
                    }))['highlight'](),
                    H['position']['copy'](G['getWorldPosition'](new THREE['Vector3']())),
                    H['quaternion']['copy'](G['getWorldQuaternion'](new THREE['Quaternion']())),
                    scene['add'](H),
                    this['_fill_helpers']['uuid'] = A['uuid'],
                    this['_fill_helpers']['helpers']['push'](H));
                }
            }
            return this['update_connected_helpers_size'](A),
            this['update_sizes_obj'](this['_size_objects'], A, W),
            this['check_embed_in_section'](A),
            this['updateMatrixWorld'](!0x0),
            this['box'] && this['box']['update'](),
            this;
        }
    }