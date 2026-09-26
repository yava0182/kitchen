var z = room['active_objects']['filter'](P => P instanceof Module), A = pp['info']['tabletop']['items']['filter'](P => P instanceof Module), C, D, E;
0 < z.length && (g['model']['objs'] = g['model']['objs'] || [],
z.forEach(P => {
  g['model']['objs']['push'](x(P));
}
)),
0 < A.length && (g['model']['objs'] = g['model']['objs'] || [],
A.forEach(P => {
  g['model']['objs']['push'](x(P));
}
)),
g['table']['materials'] = [],
k.forEach(P => {
  g['table']['materials']['push'](P);
}
);
for (let P of g['table']['objects']) {
  if (P['materialArt'] && (C = g['table']['materials']['findIndex'](Q => Q['art'] === P['materialArt']),
  P['materialIndex'] = C,
  delete P['materialArt']),
  P['butts'] && Array.isArray(P['butts']))
  for (let Q of P['butts']) {
    Q['materialArt'] && (D = g['table']['materials']['findIndex'](R => R['art'] === Q['materialArt']),
    Q['materialIndex'] = D,
    delete Q['materialArt']);
  }
}
let F = new JSZip()
, H = (F['folder']('models'),
Array.from(h['entries']())['map']( ([R,S]) => {
  let T = {
    'id': THREE['MathUtils']['generateUUID'](),
    'meshes': []
  };
  return S['obj']['traverse'](U => {
    var W, a0, W;
    U['isMesh'] && (a0 = (W = U['geometry'])['attributes']['position']?.['array'] ? Array.from(W['attributes']['position']['array']) : [],
    W = W['index']?.['array'] ? Array.from(W['index']['array']) : [],
    T['meshes']['push']({
      'name': U['name'],
      'geometry': {
        'positions': a0,
        'indices': W
      },
      'material': U['material']?.['name'] || 'default'
    }));
  }
  ),
  {
    'key': R,
    'index': S['index'],
    'model': S['model'],
    'name': S['name'],
    'size': S['size'],
    'obj': T
  };
}
))
, I = new Worker('/common_assets/workers/export_workers.js',{
  'type': 'module'
});
try {
  (await new Promise( (R, S) => {
    let T = setTimeout( () => {
      I['terminate'](),
      S(new Error('Worker\x20timeout'));
    }
    , 2000000);
    I['onmessage'] = U => {
      clearTimeout(T),
      R(U['data']);
    }
    ,
    I['onerror'] = U => {
      clearTimeout(T),
      S(U);
    }
    ,
    I['postMessage']({
      'trianglesMap': H,
      'units': units
    });
  }
  ))['forEach'](R => {
    R['error'] || (F['file']('models/' + R['filename'], R['data']),
    g['table']['triangles'][R['index']] = R['filename']);
  }
  );
} catch (R) {} finally {
  I['terminate']();
}
F['file']('file.json', JSON['stringify'](g, null, 2));
var z = await F['generateAsync']({
  'type': 'uint8array'
}), N;
return new Blob([z['buffer']],{
  'type': 'application/zip'
});
function O(S, T, U, W=null) {
  var a0 = T['radius'], a1 = T['dir'], a2 = S['x'] - T['x'], S = S['y'] - T['y'], a3 = U['x'] - T['x'], U = U['y'] - T['y'], a4 = Math['sqrt'](a2 * a2 + S * S) || 1, a5 = Math['sqrt'](a3 * a3 + U * U) || 1, a6 = T['x'] + a2 / a4 * a0, a4 = T['y'] + S / a4 * a0, a7 = T['x'] + a3 / a5 * a0, T = T['y'] + U / a5 * a0, a5 = (a6 + a7) / 2, a8 = (a4 + T) / 2, a9 = Math['sqrt']((a7 - a6) ** 2 + (T - a4) ** 2), a0 = a9 ? Math['sqrt'](Math['max'](a0 * a0 - Math['pow'](a9 / 2, 2), 0)) : 0, aa = (T - a4) / Math['max'](a9, 0.0001), a9 = -(a7 - a6) / Math['max'](a9, 0.0001), ab, a2 = 0 < a2 * U - S * a3;
  let ac;
  ac = void 0 !== a1 ? a1 : a2;
  let ad, ae;
  ae = !a2 && ac ? (ad = a5 - aa * a0,
  a8 - a9 * a0) : (ad = a5 + aa * a0,
  a8 + a9 * a0);
  var U = Math['atan2'](a4 - ae, a6 - ad);
  let af = Math['atan2'](T - ae, a7 - ad);
  return ac ? af > U && (af -= 2 * Math['PI']) : af < U && (af += 2 * Math['PI']),
  {
    'p1': {
      'x': a6,
      'y': a4
    },
    'p2': {
      'x': a7,
      'y': T
    },
    'center': {
      'x': ad,
      'y': ae
    },
    'dir': ac
  };
}
}
async['exportAndSendToConvertAPI']() {
  if (this['disable_remote_flag'])
  throw new Error();
  var f = await this['exportToCFRN'](), g = new FormData(), f = (g['append']('convertType', '1'),
  g['append']('models', f, 'model.cfrn'),
  await fetch('config/index.php/api/bazis_convert', {
    'method': 'POST',
    'body': g,
    'headers': {
      'Apikey': 'e453ab6926db4fc3a7118f6306ecf586'
    }
  })), g, h;
  if (f['ok'])
  return await f['json']();
  throw g = await f['text'](),
  pp['interface']['root']['$emit']('change_loader_info', {
    'mode': 'error',
    'text': g
  }),
  new Error('Ошибка\x20при\x20экспорте\x20CFRN:\x20' + f['statusText']);
}
async['exportAndDownloadCFRNResult']() {
  if (this['disable_remote_flag'])
  throw new Error();
  if (pp['interface']['root'] && !pp['interface']['root']['$up']['is_auth'])
  pp['interface']['root']['$emit']('show_loader_modal', {
    'mode': 'error',
    'text': pp['interface']['root']['lang']('auth_not_token')
  });
  else {
    var f = await fetch('config/index.php/bazis/bazis_get_count/', {
      'method': 'GET'
    });
    let h = -1 < window['location']['href']['indexOf']('3dkitchen.project') || -1 < window['location']['href']['indexOf']('new_dev');
    if (f['ok'] && !h) {
      var f = await f['json']();
      if (0 == f['bazis_active'])
      return void pp['interface']['root']['$emit']('show_loader_modal', {
        'mode': 'error',
        'text': pp['interface']['root']['lang']('error_bazis_active')
      });
      if (f['current_value'] < 1)
      return void pp['interface']['root']['$emit']('show_loader_modal', {
        'mode': 'error',
        'text': pp['interface']['root']['lang']('error_bazis_count')
      });
    } else {
      if (!h)
      return void pp['interface']['root']['$emit']('show_loader_modal', {
        'mode': 'error',
        'text': pp['interface']['root']['lang']('error_bazis_count')
      });
    }
    pp['interface']['root']['$emit']('show_loader_modal', {
      'heading': pp['interface']['root']['lang']('export_to_bazis'),
      'text': pp['interface']['root']['lang']('sending_data')
    });
    let j = await this['exportAndSendToConvertAPI']();
    var g, f = await (async (l=30, m=5000) => {
      for (let q = 0; q < l; q++) {
        var n = await fetch('config/index.php/api/bazis_check_task/' + j, {
          'method': 'GET'
        });
        if (200 === n['status']) {
          var n = await n['text'](), p = await fetch('config/index.php/bazis/bazis_decrement/', {
            'method': 'GET'
          }), p;
          let u = 'Ссылка\x20для\x20скачивания:';
          return p['ok'] && !h && (p = await p['json'](),
          u = 'Осталось\x20конвертаций:\x20' + p['current_value'] + '.\x20Ссылка\x20для\x20скачивания:\x20'),
          pp['interface']['root']['$emit']('change_loader_info', {
            'mode': 'success',
            'text': pp['interface']['root']['lang']('received'),
            'additional_info': {
              'text': u,
              'link': n,
              'div_class': 'border-green\x20rounded\x20p5'
            }
          }),
          n;
        }
        pp['interface']['root']['$emit']('change_loader_info', {
          'text': pp['interface']['root']['lang']('waiting_server')
        }),
        await new Promise(v => setTimeout(v, m));
      }
      throw pp['interface']['root']['$emit']('change_loader_info', {
        'mode': 'error',
        'text': pp['interface']['root']['lang']('error_waiting_server')
      }),
      new Error('Результат\x20конвертации\x20не\x20получен\x20в\x20отведённое\x20время.');
    }
    )();
    return k(f, 'model.b3d'),
    f;
    function k(l, m='model.b3d') {
      var n = document['createElement']('a');
      n['href'] = l,
      n['download'] = m,
      n['target'] = '_blank',
      document['body']['appendChild'](n),
      n['click'](),
      document['body']['removeChild'](n);
    }
  }
}
async['ImportAndSendToConvertAPI'](f, g='https://cloud.bazissoft.ru/api-cloud-tasks-public') {
  if (this['disable_remote_flag'])
  throw new Error();
  var h = new FormData();
  h['append']('convertType', '0'),
  h['append']('models', f);
  try {
    var i = await fetch(g + '/tasks/model-convert?convertType=0', {
      'method': 'POST',
      'body': h,
      'headers': {
        'Apikey': 'e453ab6926db4fc3a7118f6306ecf586'
      }
    }), j, k;
    if (i['ok'])
    return k = await i['json']();
    throw j = await i['text'](),
    new Error('Ошибка\x20при\x20экспорте\x20CFRN:\x20' + i['statusText'] + '.\x20Сервер\x20вернул:\x20' + j);
  } catch (l) {
    throw l;
  }
}
async['ImportAndDownloadCFRNResult'](f, g='https://cloud.bazissoft.ru/api-cloud-tasks-public') {
  if (!this['disable_remote_flag']) {
    let q = 'e453ab6926db4fc3a7118f6306ecf586'
    , u = await this['ImportAndSendToConvertAPI'](f, g);
    var h, [j=30,k=5000] = [];
    for (let v = 0; v < j; v++) {
      var m = await fetch(g + '/tasks/' + u + '/download-result', {
        'method': 'GET',
        'headers': {
          'Apikey': q
        }
      }), m, p, m;
      if (200 === m['status'])
      return void await (m = m['url'],
      m = await (await fetch(m))['blob'](),
      void await this['importFile'](m));
      await new Promise(w => setTimeout(w, k));
    }
    throw new Error('Результат\x20конвертации\x20не\x20получен\x20в\x20отведённое\x20время.');
  }
  this['importFromCFRNLocal'](f);
}
['test']() {
  let f;
  (f = document['createElement']('div'))['id'] = 'cfrn-file-loader-container';
  var g = document['createElement']('button')
  , h = (g['textContent'] = 'X',
  g['id'] = 'cfrn-close-button',
  document['createElement']('button'));
  h['textContent'] = 'Импортировать\x20файл\x20CFRN',
  h['id'] = 'cfrn-import-file-button';
  let i = document['createElement']('input');
  i['type'] = 'file',
  i['id'] = 'cfrn-import-file-input',
  i['style']['display'] = 'none',
  i['accept'] = '.b3d';
  var j = document['createElement']('button')
  , k = (j['textContent'] = 'Экспортировать\x20файл\x20CFRN',
  j['id'] = 'cfrn-export-file-button',
  f['appendChild'](g),
  f['appendChild'](h),
  f['appendChild'](i),
  f['appendChild'](j),
  g['style']['cssText'] = '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20float:\x20right;\x0a\x20\x20\x20\x20\x20\x20\x20\x20',
  f['style']['cssText'] = '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20--primary-color:\x20#007bff;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20--background-color:\x20wheat;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x2020px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20position:\x20absolute;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20top:\x20100px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20var(--background-color);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20z-index:\x20100;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20display:\x20block;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20left:\x20calc(50%\x20-\x20200px);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20width:\x20400px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20',
  '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x2010px\x2020px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background-color:\x20var(--primary-color);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20white;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border:\x20none;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20cursor:\x20pointer;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-bottom:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20');
  h['style']['cssText'] = k,
  j['style']['cssText'] = k,
  g['addEventListener']('click', () => {
    f['style']['display'] = 'none';
  }
  ),
  h['addEventListener']('click', () => {
    i['click']();
  }
  ),
  i['addEventListener']('change', async l => {
    var l = l['target']['files'][0];
    l && this['ImportAndDownloadCFRNResult'](l);
  }
  ),
  j['addEventListener']('click', () => {
    this['exportToCFRNLocal']();
  }
  ),
  document['body']['appendChild'](f);
}
}
async function test_b_down(f=3029) {
  var f = await fetch('config/index.php/api/bazis_check_task_one/' + f, {
    'method': 'GET'
  });
  window['open'](await f['text'](), '_blank');
}
let utils = {
  'nested_object': {
    'get': function(f, g) {
      var h = g.split('.')
      , i = h.length;
      let j = f;
      for (var k = 0; k < i; k++) {
        if (null == j[h[k]])
        return null;
        j = j[h[k]];
      }
      return j;
    },
    'set': function(f, g, h) {
      var j = g.split('.')
      , k = j.length - 1;
      let l = f;
      for (var m = 0; m <= k; m++)
      m === k ? l[j[m]] = h : l = l[j[m]] || (l[j[m]] = {});
    }
  },
  'triangle': {
    'hypo': function(f, g) {
      return Math['sqrt'](f * f + g * g);
    },
    'cat_by_hypo_eq': function(f) {
      return Math['sqrt'](f * f / 2);
    }
  }
}
, ep = new Exp_parser();
function Exp_parser() {
  let f = this;
  function g(l) {
    for (var m = l['offset'], o, p, o = 0; 0 <= '0123456789'['indexOf'](l['string']['substr'](l['offset'], 1)) && l['offset'] < l['string']['length']; )
    l['offset']++;
    if ('.' == l['string']['substr'](l['offset'], 1)) {
      for (l['offset']++; 0 <= '0123456789'['indexOf'](l['string']['substr'](l['offset'], 1)) && l['offset'] < l['string']['length']; )
      l['offset']++;
    }
    if (l['offset'] > m)
    return parseFloat(l['string']['substr'](m, l['offset'] - m));
    if ('+' == l['string']['substr'](l['offset'], 1))
    return l['offset']++,
    g(l);
    if ('-' == l['string']['substr'](l['offset'], 1))
    return l['offset']++,
    -g(l);
    if ('(' != l['string']['substr'](l['offset'], 1))
    throw l['string']['length'] == l['offset'] ? (l['error'] = 'Parsing\x20error\x20at\x20end\x20of\x20string:\x20value\x20expected',
    'valueMissing') : (l['error'] = 'Parsing\x20error:\x20unrecognized\x20value',
    'valueNotParsed');
    if (l['offset']++,
    o = k(l),
    ')' == l['string']['substr'](l['offset'], 1))
    return l['offset']++,
    o;
    throw l['error'] = 'Parsing\x20error:\x20\x27)\x27\x20expected',
    'parseError';
  }
  function h(l) {
    return -l;
  }
  function j(l) {
    return '**' == l['string']['substr'](l['offset'], 2) ? (l['offset'] += 2,
    f['ops']['**']) : 0 <= '+-*/'['indexOf'](l['string']['substr'](l['offset'], 1)) ? f['ops'][l['string']['substr'](l['offset']++, 1)] : null;
  }
  function k(l) {
    for (var m = [{
      'precedence': 0,
      'assoc': 'L'
    }], o, p = g(l); ; ) {
      for (o = j(l) || {
        'precedence': 0,
        'assoc': 'L'
      }; o['precedence'] < m[m.length - 1]['precedence'] || o['precedence'] == m[m.length - 1]['precedence'] && 'L' == o['assoc']; ) {
        var q = m['pop']();
        if (!q['exec'])
        return p;
        p = q['exec'](q['value'], p);
      }
      m.push({
        'op': o['op'],
        'precedence': o['precedence'],
        'assoc': o['assoc'],
        'exec': o['exec'],
        'value': p
      }),
      p = g(l);
    }
  }
  this['ops'] = {
    '+': {
      'op': '+',
      'precedence': 10,
      'assoc': 'L',
      'exec': function(l, m) {
        return l + m;
      }
    },
    '-': {
      'op': '-',
      'precedence': 10,
      'assoc': 'L',
      'exec': function(l, m) {
        return l - m;
      }
    },
    '*': {
      'op': '*',
      'precedence': 20,
      'assoc': 'L',
      'exec': function(l, m) {
        return l * m;
      }
    },
    '/': {
      'op': '/',
      'precedence': 20,
      'assoc': 'L',
      'exec': function(l, m) {
        return l / m;
      }
    },
    '**': {
      'op': '**',
      'precedence': 30,
      'assoc': 'R',
      'exec': function(l, m) {
        return Math['pow'](l, m);
      }
    }
  },
  this['parse'] = function(l) {
    var l = {
      'string': l,
      'offset': 0
    };
    try {
      var m = k(l);
      if (l['offset'] < l['string']['length'])
      throw l['error'] = 'Syntax\x20error:\x20junk\x20found\x20at\x20offset\x20' + l['offset'],
      'trailingJunk';
      return m;
    } catch (o) {}
  }
  ;
}
function comp2(f={}, g={}) {
  switch (typeof f) {
    case 'number':
    return f;
    case 'object':
    if ('number' == typeof f['value'])
    return f['value'];
    f = f['value'];
  }
  let h = 0;
  try {
    h = calculateExpression(f, g);
  } catch (i) {}
  return h;
}
function conv2num(f='', g={}) {
  let h = f
  , j = false;
  if ('string' == typeof f)
  switch ((f = f['trim']())[0]) {
    case 'i':
    let q = g['local_parent'];
    q = q || g['parent'];
    var k = f['trim']()['split'](':')
    , l = q['_get_child_by_id'](k[1], q);
    h = utils['nested_object']['get'](l['userData'], k[2]);
    break;
    case 's':
    var l = f['substring'](2)
    , k = 'r' === l?.[0]
    , m = 'r' === l?.[0] ? g['root_size'] : g['parent_size'];
    h = utils['nested_object']['get'](m, k ? l?.[1] : l);
    break;
    case 'p':
    if ('r' == f[1])
    return (h = utils['nested_object']['get'](g['props'], f['substring'](3)))['value'];
    h = utils['nested_object']['get'](g['params'], f['substring'](2));
    break;
    case 'c':
    h = utils['nested_object']['get'](g['computed'], f['substring'](2));
    break;
    case 'v':
    try {
      var p = utils['nested_object']['get'](g['variables'], f['substring'](2));
      h = p['value'],
      'select' === p['type'] && isNaN(parseFloat(h)) && (j = true);
    } catch (u) {}
    break;
    case 'm':
    if (-1 < f['indexOf']('current')) {
      var m = f.split('.current.'), k, l, p;
      m[0] += '::0';
      let v = m['join']('.')['substring'](2);
      (h = utils['nested_object']['get'](g['materials'], v)) || (l = (k = v.split('::0'))[0],
      v = k[1]['substring'](1),
      p = set_obj['materials'][l]['variants'][set_obj['materials'][l]['default']],
      h = utils['nested_object']['get'](p, v));
    } else {
      if (-1 < f['indexOf']('v_')) {
        var m = f.split('.');
        let w = m[0]['substring'](2);
        var k = m[1]
        , l = (m['splice'](0, 2),
        m['join']('.'))
        , p = (w = w.split('::')[0],
        set_obj['materials'][w]['variants'][k]);
        if (!p)
        return conv2num('m:' + w + '.current.' + l, g);
        h = utils['nested_object']['get'](p, l);
      } else
      h = utils['nested_object']['get'](g['materials'], f['substring'](2));
    }
    break;
    case 'g':
    var m = f['substring'](2)['split']('.'), k = m[0], p = (m['splice'](0, 1),
    m['join']('.')), l = g['materials'][k], m, k, k;
    h = 'thickness' === p ? (m = _['get'](l, 'material') || {},
    k = (k = pp['libs']['materials'][m['key']]) ? k['get_item'](m['id'] || 0) : null,
    _['get'](k, 'params.variants.' + (m['variant_id'] || 0) + '.thickness') || 0) : utils['nested_object']['get'](l, p);
    break;
    default:
    h = parseFloat(f);
  }
  return j ? h : (isNaN(parseFloat(h)),
  copy_object(parseFloat(h)));
}
function conv_pivot(f, g) {
  if ('string' == typeof f)
  switch (f) {
    case 'left':
    f = -1;
    break;
    case 'top':
    f = 1;
    break;
    case 'right':
    f = 1;
    break;
    case 'bottom':
    f = -1;
    break;
    case 'center':
    f = 0;
    break;
  }
  return -f * g / 2;
}
class ExpressionTranslator {
  constructor() {
    this['variableMap'] = {
      's:x': 'Ширина',
      's:y': 'Высота',
      's:z': 'Глубина',
      'v:upper_modules_depth': 'Глубина\x20верхних\x20модулей',
      'v:lower_modules_depth': 'Глубина\x20нижних\x20модулей',
      'g:g0.thickness': 'Толщина\x20корпуса',
      'g:g0.material': 'Материал\x20корпуса',
      'v:base_height': 'Высота\x20основания',
      'v:tabletop_thickness': 'Толщина\x20столешницы'
    },
    this['functionMap'] = {
      'hypo': {
        'name': 'ГИПОТЕНУЗА',
        'args': 2,
        'description': 'Расчет\x20гипотенузы\x20по\x20двум\x20катетам',
        'template': 'ГИПОТЕНУЗА(Катет1,\x20Катет2)',
        'placeholders': ['Катет1', 'Катет2']
      },
      'sqrt': {
        'name': 'КОРЕНЬ',
        'args': 1,
        'description': 'Квадратный\x20корень\x20числа',
        'template': 'КОРЕНЬ(Число)',
        'placeholders': ['Число']
      },
      'sin': {
        'name': 'СИНУС',
        'args': 1,
        'description': 'Синус\x20угла\x20в\x20радианах',
        'template': 'СИНУС(Угол)',
        'placeholders': ['Угол']
      },
      'cos': {
        'name': 'КОСИНУС',
        'args': 1,
        'description': 'Косинус\x20угла\x20в\x20радианах',
        'template': 'КОСИНУС(Угол)',
        'placeholders': ['Угол']
      },
      'tan': {
        'name': 'ТАНГЕНС',
        'args': 1,
        'description': 'Тангенс\x20угла\x20в\x20радианах',
        'template': 'ТАНГЕНС(Угол)',
        'placeholders': ['Угол']
      },
      'min': {
        'name': 'МИНИМУМ',
        'args': -1,
        'description': 'Минимальное\x20значение\x20из\x20списка',
        'template': 'МИНИМУМ(Значение1,\x20Значение2,\x20...)',
        'placeholders': ['Значение1', 'Значение2', '...']
      },
      'max': {
        'name': 'МАКСИМУМ',
        'args': -1,
        'description': 'Максимальное\x20значение\x20из\x20списка',
        'template': 'МАКСИМУМ(Значение1,\x20Значение2,\x20...)',
        'placeholders': ['Значение1', 'Значение2', '...']
      },
      'avg': {
        'name': 'СРЕДНЕЕ',
        'args': -1,
        'description': 'Среднее\x20арифметическое\x20значений',
        'template': 'СРЕДНЕЕ(Значение1,\x20Значение2,\x20...)',
        'placeholders': ['Значение1', 'Значение2', '...']
      },
      'sum': {
        'name': 'СУММА',
        'args': -1,
        'description': 'Сумма\x20значений',
        'template': 'СУММА(Значение1,\x20Значение2,\x20...)',
        'placeholders': ['Значение1', 'Значение2', '...']
      },
      'pow': {
        'name': 'СТЕПЕНЬ',
        'args': 2,
        'description': 'Возведение\x20в\x20степень',
        'template': 'СТЕПЕНЬ(Основание,\x20Показатель)',
        'placeholders': ['Основание', 'Показатель']
      }
    },
    this['reverseVariableMap'] = this['createReverseMap'](this['variableMap']),
    this['reverseFunctionMap'] = this['createReverseFunctionMap']();
  }
  ['createReverseMap'](f) {
    return Object['fromEntries'](Object['entries'](f)['map']( ([g,h]) => [h, g]));
  }
  ['createReverseFunctionMap']() {
    let e = {};
    return Object['entries'](this['functionMap'])['forEach']( ([f,g]) => {
      e[g['name']] = f;
    }
    ),
    e;
  }
  ['toUserFriendly'](f) {
    let g = f;
    return Object['entries'](this['functionMap'])['forEach']( ([h,i]) => {
      var h = new RegExp('f:' + h,'gi');
      g = g.replace(h, i['name']);
    }
    ),
    Object['entries'](this['variableMap'])['forEach']( ([h,i]) => {
      var h = new RegExp(h,'g');
      g = g.replace(h, '{' + i + '}');
    }
    ),
    g;
  }
  ['toTechnical'](f) {
    let g = f;
    return Object['entries'](this['reverseFunctionMap'])['forEach']( ([h,i]) => {
      var h = new RegExp(h,'gi');
      g = g.replace(h, 'f:' + i);
    }
    ),
    Object['entries'](this['reverseVariableMap'])['forEach']( ([h,i]) => {
      var h = new RegExp('\x5c{' + h + '\x5c}','g');
      g = g.replace(h, i);
    }
    ),
    g;
  }
  ['getAvailableVariables']() {
    return Object['entries'](this['variableMap'])['map']( ([f,g]) => ({
      'id': f,
      'name': g,
      'display': '{' + g + '}'
    }));
  }
  ['getAvailableFunctions']() {
    return Object['entries'](this['functionMap'])['map']( ([f,g]) => ({
      'id': 'f:' + f,
      'name': g['name'],
      'args': g['args'],
      'description': g['description'],
      'template': g['template'],
      'placeholders': g['placeholders']
    }));
  }
  ['getFunctionInfo'](f) {
    var f = f['startsWith']('f:') ? f['substring'](2) : f;
    return this['functionMap'][f];
  }
}
function calculateExpression(g, h) {
  var g = g.replace(/\s/g, ''), j;
  function k(C) {
    return m(C);
  }
  function m(C) {
    let D = q(C);
    for (; 0 < C.length && ('+' === C[0] || '-' === C[0]); ) {
      var E = C['shift']()
      , F = q(C);
      '+' === E ? D += F : D -= F;
    }
    return D;
  }
  function q(C) {
    let D = v(C);
    for (; 0 < C.length && ('*' === C[0] || '/' === C[0]); ) {
      var E = C['shift']()
      , F = v(C);
      if ('*' === E)
      D *= F;
      else {
        if (0 === F)
        throw new Error('Деление\x20на\x20ноль');
        D /= F;
      }
    }
    return D;
  }
  function v(C) {
    if ('(' !== C[0])
    return (w(C) ? x : z)(C);
    C['shift']();
    var D = k(C);
    if (')' !== C[0])
    throw new Error('Отсутствует\x20закрывающая\x20скобка');
    return C['shift'](),
    D;
  }
  function w(C) {
    return 3 <= C.length && /^[a-z]+:?[a-z_]+$/['test'](C[0]) && '(' === C[1];
  }
  function x(C) {
    for (var D = C['shift'](), E = (C['shift'](),
    []); 0 < C.length && ')' !== C[0]; )
    E.push(k(C)),
    ',' === C[0] && C['shift']();
    if (0 === C.length)
    throw new Error('Отсутствует\x20закрывающая\x20скобка\x20для\x20функции');
    return C['shift'](),
    y(D, E);
  }
  function y(C, D) {
    var E = pp['compute']['math_functions'];
    if (C['startsWith']('f:')) {
      var F = C['substring'](2);
      if (E[F])
      return E[F]['run'](...D);
      throw new Error('Неизвестная\x20функция:\x20' + F);
    }
    return conv2num(C, h);
  }
  function z(C) {
    if (0 === C.length)
    return 0;
    var D = C['shift']();
    if (/^-?\d+(\.\d+)?$/['test'](D))
    return parseFloat(D);
    if (/^[a-z]+[:.][a-z0-9_.-]+$/i['test'](D))
    return conv2num(D, h);
    if ('-' === D)
    return -z(C);
    if ('+' === D)
    return z(C);
    throw new Error('Неверный\x20токен:\x20' + D);
  }
  function A(C) {
    var D = [];
    let E = '';
    for (let G = 0; G < C.length; G++) {
      var F = C[G];
      '\x20' !== F && '\x09' !== F && (B(F) || '(' === F || ')' === F || ',' === F ? ('' !== E && (D.push(E),
      E = ''),
      D.push(F)) : E += F);
    }
    return '' !== E && D.push(E),
    D;
  }
  function B(C) {
    return ['+', '-', '*', '/']['includes'](C);
  }
  try {
    return k(A(g));
  } catch (C) {
    throw new Error('Ошибка\x20вычисления\x20выражения:\x20' + C['message']);
  }
}
let translator = new ExpressionTranslator();
pp['compute'] = {
  'math_functions': {
    'hypo': {
      'name': 'ГИПОТЕНУЗА',
      'args': 2,
      'description': 'Расчет\x20гипотенузы\x20по\x20двум\x20катетам',
      'template': 'ГИПОТЕНУЗА(Катет1,\x20Катет2)',
      'placeholders': ['Катет1', 'Катет2'],
      'run': (f, g) => Math['sqrt'](f * f + g * g)
    },
    'sqrt': {
      'name': 'КОРЕНЬ',
      'args': 1,
      'description': 'Квадратный\x20корень\x20числа',
      'template': 'КОРЕНЬ(Число)',
      'placeholders': ['Число'],
      'run': f => Math['sqrt'](f)
    },
    'sin': {
      'name': 'СИНУС',
      'args': 1,
      'description': 'Синус\x20угла\x20в\x20радианах',
      'template': 'СИНУС(Угол)',
      'placeholders': ['Угол'],
      'run': f => Math['sin'](f)
    },
    'cos': {
      'name': 'КОСИНУС',
      'args': 1,
      'description': 'Косинус\x20угла\x20в\x20радианах',
      'template': 'КОСИНУС(Угол)',
      'placeholders': ['Угол'],
      'run': f => Math['cos'](f)
    },
    'tan': {
      'name': 'ТАНГЕНС',
      'args': 1,
      'description': 'Тангенс\x20угла\x20в\x20радианах',
      'template': 'ТАНГЕНС(Угол)',
      'placeholders': ['Угол'],
      'run': f => Math['tan'](f)
    },
    'abs': {
      'name': 'МОДУЛЬ',
      'args': 1,
      'description': 'Модуль\x20числа',
      'template': 'МОДУЛЬ(число)',
      'placeholders': ['Число'],
      'run': f => Math['abs'](f)
    },
    'pow': {
      'name': 'СТЕПЕНЬ',
      'args': 2,
      'description': 'Возведение\x20в\x20степень',
      'template': 'СТЕПЕНЬ(Основание,\x20Показатель)',
      'placeholders': ['Основание', 'Показатель'],
      'run': (f, g) => Math['pow'](f, g)
    },
    'min': {
      'name': 'МИНИМУМ',
      'args': -1,
      'description': 'Минимальное\x20значение\x20из\x20списка',
      'template': 'МИНИМУМ(Значение1,\x20Значение2,\x20...)',
      'placeholders': ['Значение1', 'Значение2', '...'],
      'run': (...f) => Math['min'](...f)
    },
    'max': {
      'name': 'МАКСИМУМ',
      'args': -1,
      'description': 'Максимальное\x20значение\x20из\x20списка',
      'template': 'МАКСИМУМ(Значение1,\x20Значение2,\x20...)',
      'placeholders': ['Значение1', 'Значение2', '...'],
      'run': (...f) => Math['max'](...f)
    },
    'avg': {
      'name': 'СРЕДНЕЕ',
      'args': -1,
      'description': 'Среднее\x20арифметическое\x20значений',
      'template': 'СРЕДНЕЕ(Значение1,\x20Значение2,\x20...)',
      'placeholders': ['Значение1', 'Значение2', '...'],
      'run': (...f) => f['reduce']( (g, h) => g + h, 0) / f.length
    },
    'sum': {
      'name': 'СУММА',
      'args': -1,
      'description': 'Сумма\x20значений',
      'template': 'СУММА(Значение1,\x20Значение2,\x20...)',
      'placeholders': ['Значение1', 'Значение2', '...'],
      'run': (...f) => f['reduce']( (g, h) => g + h, 0)
    }
  }
};
function configurator_v2_init() {
  var q = []
  , w = [{
    'key': 'id',
    'name': 'Идентификатор',
    'type': 'text'
  }, {
    'key': 'hide_on_drag',
    'name': 'Скрыть\x20при\x20наполнении',
    'type': 'bool'
  }, {
    'key': 'active',
    'name': 'Активный',
    'type': 'bool'
  }, {
    'key': 'resizable.extend_size',
    'name': 'Учитывать\x20размер\x20при\x20позиционировании',
    'type': 'bool'
  }, {
    'key': 'is_target',
    'name': 'Учитывать\x20при\x20вырезах',
    'type': 'bool'
  }, {
    'key': 'fill_intersec',
    'name': 'Учитывать\x20пересечения\x20при\x20наполнении',
    'type': 'bool'
  }, {
    'key': 'size',
    'name': 'Размеры',
    'children': [{
      'key': 'x',
      'name': 'По\x20оси\x20X',
      'type': 'input_ext'
    }, {
      'key': 'y',
      'name': 'По\x20оси\x20Y',
      'type': 'input_ext'
    }, {
      'key': 'z',
      'name': 'По\x20оси\x20Z',
      'type': 'input_ext'
    }],
    'conditions': [{
      'key': 'spec.group',
      'cond': '!=',
      'val': 'furniture'
    }]
  }, {
    'key': 'pos',
    'name': 'Позиция',
    'children': [{
      'key': 'x',
      'name': 'По\x20оси\x20X',
      'type': 'input_ext'
    }, {
      'key': 'y',
      'name': 'По\x20оси\x20Y',
      'type': 'input_ext'
    }, {
      'key': 'z',
      'name': 'По\x20оси\x20Z',
      'type': 'input_ext'
    }]
  }, {
    'key': 'pivot',
    'name': 'Точка\x20отсчета',
    'children': [{
      'key': 'x',
      'name': 'По\x20оси\x20X',
      'type': 'switch',
      'values': [{
        'label': 'Слева',
        'val': -1
      }, {
        'label': 'По\x20центру',
        'val': 0
      }, {
        'label': 'Справа',
        'val': 1
      }]
    }, {
      'key': 'y',
      'name': 'По\x20оси\x20Y',
      'type': 'switch',
      'values': [{
        'label': 'Снизу',
        'val': -1
      }, {
        'label': 'По\x20центру',
        'val': 0
      }, {
        'label': 'Сверху',
        'val': 1
      }]
    }, {
      'key': 'z',
      'name': 'По\x20оси\x20Z',
      'type': 'switch',
      'values': [{
        'label': 'Сзади',
        'val': -1
      }, {
        'label': 'По\x20центру',
        'val': 0
      }, {
        'label': 'Спереди',
        'val': 1
      }]
    }],
    'conditions': [{
      'key': 'spec.group',
      'cond': '!=',
      'val': 'path'
    }, {
      'key': 'spec.group',
      'cond': '!=',
      'val': 'furniture'
    }]
  }, {
    'key': 'rot',
    'name': 'Поворот',
    'children': [{
      'key': 'x',
      'name': 'По\x20оси\x20X',
      'type': 'input_ext'
    }, {
      'key': 'y',
      'name': 'По\x20оси\x20Y',
      'type': 'input_ext'
    }, {
      'key': 'z',
      'name': 'По\x20оси\x20Z',
      'type': 'input_ext'
    }]
  }, {
    'key': 'condition',
    'name': 'Условие',
    'type': 'input_cond',
    'view_mode': 1
  }, {
    'key': 'comments',
    'name': 'Комментарии',
    'type': 'textarea'
  }];
  let z = {
    'section': [{
      'key': 'accessories',
      'name': 'Комплектующие',
      'type': 'acc_picker',
      'catalog': 'accessories',
      'multiple': true,
      'unselect': 1
    }, {
      'key': 'section_key',
      'name': 'Ключ\x20для\x20наполнения',
      'type': 'text'
    }],
    'wall': [{
      'key': 'accessories',
      'name': 'Комплектующие',
      'type': 'acc_picker',
      'catalog': 'accessories',
      'multiple': true,
      'unselect': 1
    }, {
      'key': 'spec',
      'name': 'Основные\x20параметры',
      'children': [{
        'key': 'code',
        'name': 'Артикул',
        'type': 'text'
      }, {
        'key': 'orientation',
        'name': 'Ориентация',
        'type': 'select',
        'values': [{
          'label': 'Горизонтальная',
          'val': 'h'
        }, {
          'label': 'Вертикальная',
          'val': 'v'
        }, {
          'label': 'Фронтальная',
          'val': 'f'
        }]
      }, {
        'key': 'type',
        'name': 'Форма',
        'type': 'select',
        'values': []
      }, {
        'key': 'material',
        'name': 'Материал',
        'type': 'input_mat'
      }, {
        'key': 'show_index',
        'name': 'Нумерация\x20сторон\x20кромкования',
        'type': 'bool'
      }, {
        'key': 'butts',
        'name': 'Кромки',
        'type': 'butts'
      }]
    }],
    'model': [{
      'key': 'accessories',
      'name': 'Комплектующие',
      'type': 'acc_picker',
      'catalog': 'accessories',
      'multiple': true,
      'unselect': 1
    }, {
      'key': 'spec',
      'name': 'Основные\x20параметры',
      'children': [{
        'key': 'id',
        'name': 'Выбранная\x20модель',
        'type': 'item_picker',
        'catalog': 'cabinet_model'
      }]
    }, {
      'key': 'size',
      'name': 'Размеры',
      'children': [{
        'key': 'x',
        'name': 'По\x20оси\x20X',
        'type': 'input_ext'
      }, {
        'key': 'y',
        'name': 'По\x20оси\x20Y',
        'type': 'input_ext'
      }, {
        'key': 'z',
        'name': 'По\x20оси\x20Z',
        'type': 'input_ext'
      }]
    }, {
      'key': 'pos',
      'name': 'Позиция',
      'children': [{
        'key': 'x',
        'name': 'По\x20оси\x20X',
        'type': 'input_ext'
      }, {
        'key': 'y',
        'name': 'По\x20оси\x20Y',
        'type': 'input_ext'
      }, {
        'key': 'z',
        'name': 'По\x20оси\x20Z',
        'type': 'input_ext'
      }]
    }, {
      'key': 'rot',
      'name': 'Поворот',
      'children': [{
        'key': 'x',
        'name': 'По\x20оси\x20X',
        'type': 'input_ext'
      }, {
        'key': 'y',
        'name': 'По\x20оси\x20Y',
        'type': 'input_ext'
      }, {
        'key': 'z',
        'name': 'По\x20оси\x20Z',
        'type': 'input_ext'
      }]
    }, {
      'key': 'condition',
      'name': 'Условие',
      'type': 'input_cond'
    }],
    'facade': [{
      'key': 'accessories',
      'name': 'Комплектующие',
      'type': 'acc_picker',
      'catalog': 'accessories',
      'multiple': true,
      'unselect': 1
    }, {
      'key': 'params_key',
      'name': 'Ключ\x20для\x20переопределения\x20параметров',
      'type': 'text'
    }, {
      'key': 'spec',
      'name': 'Основные\x20параметры',
      'children': [{
        'key': 'id',
        'name': 'Выбранная\x20модель',
        'type': 'item_picker',
        'catalog': 'facades',
        'default_value': pp['const']['not_set_value'],
        'unselect': 1
      }, {
        'key': 'code',
        'name': 'Артикул',
        'type': 'text'
      }, {
        'key': 'type',
        'name': 'Тип\x20фасада',
        'type': 'select_type_facade',
        'values': 'types'
      }, {
        'key': 'materials.gen',
        'name': 'Материал\x20фасада',
        'type': 'item_picker',
        'catalog': 'materials',
        'is_facade_mat': 1,
        'multiple': false,
        'default_value': pp['const']['not_set_value'],
        'unselect': 1
      }, {
        'key': 'role',
        'name': 'Роль\x20фасада',
        'type': 'select',
        'values': [{
          'label': 'Корпусная\x20мебель',
          'val': 'cab'
        }, {
          'label': 'Кухни',
          'val': 'kit'
        }]
      }, {
        'key': 'radius',
        'name': 'Радиусный\x20фасад',
        'type': 'bool'
      }, {
        'key': 'side',
        'name': 'Боковина',
        'type': 'bool'
      }, {
        'key': 'can_change.id',
        'name': 'Сменяемый\x20тип\x20элемента',
        'type': 'bool'
      }, {
        'key': 'can_change.material',
        'name': 'Сменяемый\x20материал\x20фасада',
        'type': 'bool'
      }, {
        'key': 'can_change.type',
        'name': 'Сменяемый\x20тип\x20фасада',
        'type': 'bool'
      }]
    }, {
      'key': 'spec.handle',
      'name': 'Параметры\x20ручек',
      'children': [{
        'key': 'enabled',
        'name': 'Устанавливать\x20ручку',
        'type': 'bool'
      }, {
        'key': 'active',
        'name': 'Активировать\x20ручку',
        'type': 'bool',
        'conditions': [{
          'key': 'spec.handle.enabled',
          'cond': '=',
          'val': 1
        }]
      }, {
        'key': 'h_group',
        'name': 'Группа\x20ручек',
        'type': 'select',
        'values': [{
          'label': 'Дверь',
          'val': 0
        }, {
          'label': 'Ящик',
          'val': 1
        }],
        'conditions': [{
          'key': 'spec.handle.enabled',
          'cond': '=',
          'val': 1
        }]
      }, {
        'key': 'fixed',
        'name': 'Фиксированная\x20модель\x20ручки',
        'type': 'bool',
        'conditions': [{
          'key': 'spec.handle.enabled',
          'cond': '=',
          'val': 1
        }]
      }, {
        'key': 'id',
        'name': 'Модель\x20ручки',
        'type': 'item_picker',
        'catalog': 'handles',
        'unselect': true,
        'conditions': [{
          'key': 'spec.handle.enabled',
          'cond': '=',
          'val': 1
        }]
      }, {
        'key': 'p_size',
        'name': 'Размер\x20ручки',
        'type': 'select_dynamic',
        'values': 'sizes',
        'conditions': [{
          'key': 'spec.handle.fixed',
          'cond': '=',
          'val': 1
        }, {
          'key': 'spec.handle.id',
          'cond': '!=',
          'val': 0
        }, {
          'key': 'spec.handle.enabled',
          'cond': '=',
          'val': 1
        }]
      }, {
        'key': 'dir',
        'name': 'Направление\x20профиль\x20ручек',
        'type': 'select',
        'values': [{
          'label': 'Слева',
          'val': 'l'
        }, {
          'label': 'Справа',
          'val': 'r'
        }, {
          'label': 'Снизу',
          'val': 'b'
        }, {
          'label': 'Сверху',
          'val': 't'
        }],
        'conditions': [{
          'key': 'spec.handle.enabled',
          'cond': '=',
          'val': 1
        }]
      }, {
        'key': 'orient',
        'name': 'Ориентация',
        'type': 'select',
        'values': [{
          'label': 'От\x20параметров\x20модуля',
          'val': 'a'
        }, {
          'label': 'Вертикальная',
          'val': 'v'
        }, {
          'label': 'Горизонтальная',
          'val': 'h'
        }],
        'conditions': [{
          'key': 'spec.handle.active',
          'cond': '=',
          'val': 1
        }, {
          'key': 'spec.handle.enabled',
          'cond': '=',
          'val': 1
        }]
      }, {
        'key': 'pos.x',
        'name': 'Позиция\x20по\x20горизонтали',
        'type': 'select',
        'values': [{
          'label': 'От\x20параметров\x20модуля',
          'val': 'a'
        }, {
          'label': 'Слева',
          'val': 'l'
        }, {
          'label': 'По\x20центру',
          'val': 'c'
        }, {
          'label': 'Справа',
          'val': 'r'
        }],
        'conditions': [{
          'key': 'spec.handle.enabled',
          'cond': '=',
          'val': 1
        }]
      }, {
        'key': 'pos.y',
        'name': 'Позиция\x20по\x20вертикали',
        'type': 'select',
        'values': [{
          'label': 'От\x20параметров\x20модуля',
          'val': 'a'
        }, {
          'label': 'Сверху',
          'val': 't'
        }, {
          'label': 'По\x20центру',
          'val': 'c'
        }, {
          'label': 'Снизу',
          'val': 'b'
        }],
        'conditions': [{
          'key': 'spec.handle.enabled',
          'cond': '=',
          'val': 1
        }]
      }, {
        'key': 'double',
        'name': 'Две\x20ручки',
        'type': 'bool',
        'conditions': [{
          'key': 'spec.handle.enabled',
          'cond': '=',
          'val': 1
        }]
      }]
    }, {
      'key': 'size',
      'name': 'Размеры',
      'children': [{
        'key': 'x',
        'name': 'По\x20оси\x20X',
        'type': 'input_ext'
      }, {
        'key': 'y',
        'name': 'По\x20оси\x20Y',
        'type': 'input_ext'
      }, {
        'key': 'z',
        'name': 'По\x20оси\x20Z',
        'type': 'input_ext'
      }]
    }, {
      'key': 'pos',
      'name': 'Позиция',
      'children': [{
        'key': 'x',
        'name': 'По\x20оси\x20X',
        'type': 'input_ext'
      }, {
        'key': 'y',
        'name': 'По\x20оси\x20Y',
        'type': 'input_ext'
      }, {
        'key': 'z',
        'name': 'По\x20оси\x20Z',
        'type': 'input_ext'
      }]
    }, {
      'key': 'rot',
      'name': 'Поворот',
      'children': [{
        'key': 'x',
        'name': 'По\x20оси\x20X',
        'type': 'input_ext'
      }, {
        'key': 'y',
        'name': 'По\x20оси\x20Y',
        'type': 'input_ext'
      }, {
        'key': 'z',
        'name': 'По\x20оси\x20Z',
        'type': 'input_ext'
      }]
    }, {
      'key': 'condition',
      'name': 'Условие',
      'type': 'input_cond'
    }],
    'tabletop': [{
      'key': 'spec',
      'name': 'Основные\x20параметры',
      'children': [{
        'key': 'material.id',
        'name': 'Материал',
        'type': 'item_picker',
        'catalog': 'tabletop',
        'default_value': pp['const']['not_set_value'],
        'unselect': 1
      }, {
        'key': 'can_change.id',
        'name': 'Сменяемый\x20тип\x20элемента',
        'type': 'bool'
      }, {
        'key': 'can_group',
        'name': 'Возможно\x20объединение',
        'type': 'bool'
      }, {
        'key': 'can_euro',
        'name': 'Возможен\x20еврозапил',
        'type': 'bool'
      }]
    }, {
      'key': 'spec.plints',
      'name': 'Плинтус',
      'children': [{
        'key': 'enabled',
        'name': 'Активен',
        'type': 'select',
        'values': [{
          'label': '(Не\x20задано)',
          'val': pp['const']['not_set_value']
        }, {
          'label': 'Нет',
          'val': 0
        }, {
          'label': 'Да',
          'val': 1
        }]
      }, {
        'key': 'back',
        'name': 'Сзади',
        'type': 'select',
        'values': [{
          'label': '(Не\x20задано)',
          'val': pp['const']['not_set_value']
        }, {
          'label': 'Нет',
          'val': 0
        }, {
          'label': 'Да',
          'val': 1
        }]
      }, {
        'key': 'right',
        'name': 'Справа',
        'type': 'select',
        'values': [{
          'label': '(Не\x20задано)',
          'val': pp['const']['not_set_value']
        }, {
          'label': 'Нет',
          'val': 0
        }, {
          'label': 'Да',
          'val': 1
        }]
      }, {
        'key': 'left',
        'name': 'Слева',
        'type': 'select',
        'values': [{
          'label': '(Не\x20задано)',
          'val': pp['const']['not_set_value']
        }, {
          'label': 'Нет',
          'val': 0
        }, {
          'label': 'Да',
          'val': 1
        }]
      }, {
        'key': 'material',
        'name': 'Материал\x20плинтуса',
        'type': 'item_picker',
        'catalog': 'tabletop_plinth',
        'default_value': pp['const']['not_set_value'],
        'unselect': 1
      }]
    }, {
      'key': 'spec.type_params',
      'name': 'Углы',
      'children': [{
        'key': 'corners_equal',
        'name': 'Одинаковые\x20углы',
        'type': 'bool'
      }, {
        'key': 'c1.type',
        'name': 'Угол\x201:\x20Тип',
        'type': 'select',
        'values': [{
          'label': 'Нет',
          'val': 'straight'
        }, {
          'label': 'Круглый',
          'val': 'radius'
        }, {
          'label': 'Прямой',
          'val': 'corner'
        }]
      }, {
        'key': 'c1.val',
        'name': 'Угол\x201:\x20Значение',
        'type': 'text'
      }, {
        'key': 'c2.type',
        'name': 'Угол\x202:\x20Тип',
        'type': 'select',
        'values': [{
          'label': 'Нет',
          'val': 'straight'
        }, {
          'label': 'Круглый',
          'val': 'radius'
        }, {
          'label': 'Прямой',
          'val': 'corner'
        }],
        'conditions': [{
          'key': 'spec.type_params.corners_equal',
          'cond': '!=',
          'val': 1
        }]
      }, {
        'key': 'c2.val',
        'name': 'Угол\x202:\x20Значение',
        'type': 'text',
        'conditions': [{
          'key': 'spec.type_params.corners_equal',
          'cond': '!=',
          'val': 1
        }]
      }, {
        'key': 'c3.type',
        'name': 'Угол\x203:\x20Тип',
        'type': 'select',
        'values': [{
          'label': 'Нет',
          'val': 'straight'
        }, {
          'label': 'Круглый',
          'val': 'radius'
        }, {
          'label': 'Прямой',
          'val': 'corner'
        }],
        'conditions': [{
          'key': 'spec.type_params.corners_equal',
          'cond': '!=',
          'val': 1
        }]
      }, {
        'key': 'c3.val',
        'name': 'Угол\x203:\x20Значение',
        'type': 'text',
        'conditions': [{
          'key': 'spec.type_params.corners_equal',
          'cond': '!=',
          'val': 1
        }]
      }, {
        'key': 'c4.type',
        'name': 'Угол\x204:\x20Тип',
        'type': 'select',
        'values': [{
          'label': 'Нет',
          'val': 'straight'
        }, {
          'label': 'Круглый',
          'val': 'radius'
        }, {
          'label': 'Прямой',
          'val': 'corner'
        }],
        'conditions': [{
          'key': 'spec.type_params.corners_equal',
          'cond': '!=',
          'val': 1
        }]
      }, {
        'key': 'c4.val',
        'name': 'Угол\x204:\x20Значение',
        'type': 'text',
        'conditions': [{
          'key': 'spec.type_params.corners_equal',
          'cond': '!=',
          'val': 1
        }]
      }]
    }, {
      'key': 'size',
      'name': 'Размеры',
      'children': [{
        'key': 'x',
        'name': 'По\x20оси\x20X',
        'type': 'input_ext'
      }, {
        'key': 'z',
        'name': 'По\x20оси\x20Z',
        'type': 'input_ext'
      }]
    }],
    'cokol': [{
      'key': 'spec',
      'name': 'Основные\x20параметры',
      'children': [{
        'key': 'id',
        'name': 'Материал',
        'type': 'item_picker',
        'catalog': 'cokol',
        'default_value': pp['const']['not_set_value'],
        'unselect': 1
      }, {
        'key': 'can_change.id',
        'name': 'Сменяемый\x20тип\x20элемента',
        'type': 'bool'
      }]
    }, {
      'key': 'size',
      'name': 'Размеры',
      'children': [{
        'key': 'x',
        'name': 'По\x20оси\x20X',
        'type': 'input_ext'
      }]
    }],
    'cokol_top': [{
      'key': 'spec',
      'name': 'Основные\x20параметры',
      'children': [{
        'key': 'id',
        'name': 'Материал',
        'type': 'item_picker',
        'catalog': 'cokol_top',
        'default_value': pp['const']['not_set_value'],
        'unselect': 1
      }, {
        'key': 'can_change.id',
        'name': 'Сменяемый\x20тип\x20элемента',
        'type': 'bool'
      }]
    }, {
      'key': 'size',
      'name': 'Размеры',
      'children': [{
        'key': 'x',
        'name': 'По\x20оси\x20X',
        'type': 'input_ext'
      }]
    }],
    'bort': [{
      'key': 'spec',
      'name': 'Основные\x20параметры',
      'children': [{
        'key': 'material.id',
        'name': 'Материал',
        'type': 'item_picker',
        'catalog': 'tabletop_plinth'
      }]
    }],
    'cornice_placer': [{
      'key': 'spec',
      'name': 'Основные\x20параметры',
      'children': [{
        'key': 'id',
        'name': 'Материал',
        'type': 'item_picker',
        'catalog': 'cornice',
        'default_value': pp['const']['not_set_value'],
        'unselect': 1
      }, {
        'key': 'can_change.id',
        'name': 'Сменяемый\x20тип\x20элемента',
        'type': 'bool'
      }, {
        'key': 'type',
        'name': 'Тип',
        'type': 'select',
        'values': [{
          'label': 'Прямой',
          'val': 'common'
        }, {
          'label': 'Радиус',
          'val': 'radius'
        }]
      }, {
        'key': 'cuts.start',
        'name': 'Вырез\x20слева\x20(угол)',
        'type': 'number',
        'conditions': [{
          'key': 'spec.type',
          'cond': '!=',
          'val': 'radius'
        }]
      }, {
        'key': 'cuts.end',
        'name': 'Вырез\x20справа\x20(угол)',
        'type': 'number',
        'conditions': [{
          'key': 'spec.type',
          'cond': '!=',
          'val': 'radius'
        }]
      }]
    }],
    'hole': [{
      'key': 'spec.direction',
      'name': 'Направление',
      'type': 'select',
      'values': [{
        'label': 'Плоскость\x20YZ',
        'val': 'x'
      }, {
        'label': 'Плоскость\x20-YZ',
        'val': '-x'
      }, {
        'label': 'Плоскость\x20XZ',
        'val': 'y'
      }, {
        'label': 'Плоскость\x20-XZ',
        'val': '-y'
      }, {
        'label': 'Плоскость\x20XY',
        'val': 'z'
      }, {
        'label': 'Плоскость\x20-XY',
        'val': '-z'
      }]
    }, {
      'key': 'spec.through',
      'name': 'Сквозное\x20отверстие',
      'type': 'bool'
    }, {
      'key': 'size',
      'name': 'Размеры',
      'children': [{
        'key': 'x',
        'name': 'По\x20оси\x20X',
        'type': 'input_ext'
      }, {
        'key': 'z',
        'name': 'По\x20оси\x20Z',
        'type': 'input_ext'
      }]
    }],
    'animator': [{
      'key': 'spec',
      'name': 'Основные\x20параметры',
      'children': [{
        'key': 'fn',
        'name': 'Функция',
        'type': 'select',
        'values': [{
          'label': 'Перемещение',
          'val': 'slide'
        }, {
          'label': 'Поворот',
          'val': 'rotate'
        }]
      }, {
        'key': 'group',
        'name': 'Группа',
        'type': 'text'
      }]
    }, {
      'key': 'spec.props',
      'name': 'Параметры\x20функции',
      'children': [{
        'key': 'ext_percent',
        'name': '%\x20выдвижения',
        'type': 'number'
      }, {
        'key': 'direction',
        'name': 'Направление\x20движения',
        'type': 'select',
        'values': [{
          'label': 'Вперед',
          'val': 'f'
        }, {
          'label': 'Налево',
          'val': 'l'
        }, {
          'label': 'Направо',
          'val': 'r'
        }, {
          'label': 'Вверх',
          'val': 't'
        }, {
          'label': 'Вниз',
          'val': 'b'
        }]
      }],
      'conditions': [{
        'key': 'spec.fn',
        'cond': '=',
        'val': 'slide'
      }]
    }, {
      'key': 'spec.props',
      'name': 'Параметры\x20функции',
      'children': [{
        'key': 'deg',
        'name': 'Угол\x20поворота',
        'type': 'number'
      }, {
        'key': 'direction',
        'name': 'Направление',
        'type': 'select',
        'values': [{
          'label': 'Ось\x20X\x20(По\x20часовой)',
          'val': 'rx'
        }, {
          'label': 'Ось\x20X\x20(Против\x20часовой)',
          'val': 'lx'
        }, {
          'label': 'Ось\x20Y\x20(По\x20часовой)',
          'val': 'ly'
        }, {
          'label': 'Ось\x20Y\x20(Против\x20часовой)',
          'val': 'ry'
        }, {
          'label': 'Ось\x20Z\x20(По\x20часовой)',
          'val': 'lz'
        }, {
          'label': 'Ось\x20Z\x20(Против\x20часовой)',
          'val': 'rz'
        }]
      }],
      'conditions': [{
        'key': 'spec.fn',
        'cond': '=',
        'val': 'rotate'
      }]
    }, {
      'key': 'spec.source',
      'name': 'Ссылка\x20на\x20объект-источник',
      'children': [{
        'key': 'id',
        'name': 'ID\x20источника',
        'type': 'text'
      }, {
        'key': 'fn',
        'name': 'Использовать\x20функцию\x20из\x20источника',
        'type': 'bool'
      }, {
        'key': 'fixed',
        'name': 'Использовать\x20параметры\x20из\x20источника,\x20кроме',
        'type': 'fixed_array'
      }]
    }],
    'module': [{
      'key': 'spec',
      'name': 'Основные\x20параметры',
      'children': [{
        'key': 'can_change.id',
        'name': 'Сменяемый\x20тип\x20элемента',
        'type': 'bool'
      }, {
        'key': 'not_load_default',
        'name': 'Не\x20менять\x20на\x20модуль\x20по\x20умолчанию',
        'type': 'bool'
      }, {
        'key': 'movement_locked',
        'name': 'Блокировка\x20перемещения',
        'type': 'bool',
        'conditions': [{
          'key': 'spec.is_fill',
          'cond': '=',
          'val': 1
        }]
      }]
    }, {
      'key': 'spec.params_apply',
      'name': 'Переопределение\x20параметров',
      'type': 'params_apply'
    }, {
      'key': 'variables_apply',
      'name': 'Переменные',
      'type': 'variables_apply'
    }],
    'fill_section': [{
      'key': 'accessories',
      'name': 'Комплектующие',
      'type': 'acc_picker',
      'catalog': 'accessories',
      'multiple': true,
      'unselect': 1
    }, {
      'key': 'spec',
      'name': 'Основные\x20параметры',
      'children': [{
        'key': 'show_sizes',
        'name': 'Отображать\x20размеры\x20внутри\x20секции',
        'type': 'bool'
      }, {
        'key': 'replace',
        'name': 'Заменить\x20элементы\x20наполнения\x20на\x20новые',
        'type': 'bool'
      }, {
        'key': 'step_axes.x',
        'name': 'Шаг\x20по\x20ширине',
        'type': 'input_ext'
      }, {
        'key': 'step_axes.y',
        'name': 'Шаг\x20по\x20высоте',
        'type': 'input_ext'
      }, {
        'key': 'step_axes.z',
        'name': 'Шаг\x20по\x20глубине',
        'type': 'input_ext'
      }, {
        'key': 'invert.x',
        'name': 'Инвертировать\x20наполнение\x20по\x20x',
        'type': 'bool'
      }, {
        'key': 'invert.y',
        'name': 'Инвертировать\x20наполнение\x20по\x20y',
        'type': 'bool'
      }, {
        'key': 'invert.z',
        'name': 'Инвертировать\x20наполнение\x20по\x20z',
        'type': 'bool'
      }]
    }, {
      'key': 'section_key',
      'name': 'Ключ\x20для\x20наполнения',
      'type': 'text'
    }, {
      'key': 'fill',
      'name': 'Параметры\x20наполнения',
      'children': [{
        'key': 'is_drag_categories',
        'name': 'Выбор\x20по\x20категории',
        'type': 'bool'
      }, {
        'key': 'drag_categories',
        'name': 'Доступные\x20категории',
        'type': 'category_type_picker',
        'catalog': 'catalogs_keys',
        'conditions': [{
          'key': 'fill.is_drag_categories',
          'cond': '=',
          'val': 1
        }]
      }, {
        'key': 'drag_items',
        'name': 'Доступные\x20элементы',
        'type': 'item_picker',
        'catalog': 'catalogs_keys',
        'table_mode': false,
        'item_conditions': [{
          'key': 'params.spec.is_fill',
          'cond': '=',
          'val': 1
        }],
        'conditions': [{
          'key': 'fill.is_drag_categories',
          'cond': '!=',
          'val': 1
        }],
        'multiple': true,
        'unselect': 1
      }]
    }],
    'furniture': [],
    'path': [{
      'key': 'accessories',
      'name': 'Комплектующие',
      'type': 'acc_picker',
      'catalog': 'accessories',
      'multiple': true,
      'unselect': 1
    }, {
      'key': 'spec',
      'name': 'Основные\x20параметры',
      'children': [{
        'key': 'orientation',
        'name': 'Тип',
        'type': 'select',
        'values': [{
          'label': 'Вертикальная',
          'val': 'v'
        }, {
          'label': 'Горизонтальная',
          'val': 'h'
        }]
      }, {
        'key': 'direction',
        'name': 'Направление',
        'type': 'select',
        'values': [{
          'label': 'Слева',
          'val': 'z'
        }, {
          'label': 'Справа',
          'val': '-z'
        }]
      }, {
        'key': 'type',
        'name': 'Форма',
        'type': 'select',
        'values': []
      }, {
        'key': 'reverse',
        'name': 'Отзеркалить',
        'type': 'bool',
        'conditions': [{
          'key': 'spec.type',
          'cond': '!=',
          'val': 'common'
        }, {
          'key': 'spec.type',
          'cond': '!=',
          'val': 'radius'
        }, {
          'key': 'spec.type',
          'cond': '!=',
          'val': 'rounded_corners'
        }, {
          'key': 'spec.type',
          'cond': '!=',
          'val': 'trapeze_cut_by_offset'
        }, {
          'key': 'spec.type',
          'cond': '!=',
          'val': 'cut_corners'
        }]
      }, {
        'key': 'dz',
        'name': 'Отступ\x20от\x20начала',
        'type': 'input_ext'
      }, {
        'key': 'dz_2',
        'name': 'Отступ\x20от\x20конца',
        'type': 'input_ext'
      }]
    }, {
      'key': 'size',
      'name': 'Размеры',
      'children': [{
        'key': 'x',
        'name': 'Глубина',
        'type': 'input_ext',
        'val': '10'
      }, {
        'key': 'y',
        'name': 'Ширина',
        'type': 'input_ext',
        'val': '10',
        'conditions': [{
          'key': 'spec.type',
          'cond': '!=',
          'val': 'dx_angle'
        }, {
          'key': 'spec.type',
          'cond': '!=',
          'val': 'dx_angle'
        }]
      }],
      'conditions': [{
        'key': 'spec.type',
        'cond': '!=',
        'val': 'angle'
      }, {
        'key': 'spec.type',
        'cond': '!=',
        'val': 'radius'
      }]
    }, {
      'key': 'pos',
      'name': 'Позиция',
      'children': [{
        'key': 'x',
        'name': 'Смещение\x20по\x20плоскости',
        'type': 'input_ext',
        'conditions': [{
          'key': 'spec.orientation',
          'cond': '!=',
          'val': 'h'
        }]
      }, {
        'key': 'y',
        'name': 'Смещение\x20по\x20плоскости',
        'type': 'input_ext',
        'conditions': [{
          'key': 'spec.orientation',
          'cond': '!=',
          'val': 'v'
        }]
      }, {
        'key': 'z',
        'name': 'Смещение\x20по\x20глубине',
        'type': 'input_ext'
      }]
    }],
    'size': [{
      'key': 'spec',
      'name': 'Основные\x20параметры',
      'children': [{
        'key': 'axis',
        'name': 'Ориентация',
        'type': 'select',
        'values': [{
          'label': 'Горизонтальная\x20сверху',
          'val': 'x1'
        }, {
          'label': 'Горизонтальная\x20снизу',
          'val': 'x2'
        }, {
          'label': 'Вертикальная\x20слева',
          'val': 'y1'
        }, {
          'label': 'Вертикальная\x20справа',
          'val': 'y2'
        }, {
          'label': 'Фронтальная\x20слева',
          'val': 'z1'
        }, {
          'label': 'Фронтальная\x20справа',
          'val': 'z2'
        }]
      }, {
        'key': 'line_pos',
        'name': 'Длина\x20выноски\x20(края)',
        'type': 'number'
      }, {
        'key': 'length',
        'name': 'Длина\x20выноски\x20(текст)',
        'type': 'number'
      }, {
        'key': 'text_scale',
        'name': 'Размер\x20текста\x20%',
        'type': 'number'
      }, {
        'key': 'arrow_scale',
        'name': 'Размер\x20стрелок\x20%',
        'type': 'number'
      }]
    }, {
      'key': 'size',
      'name': 'Размеры',
      'children': [{
        'key': 'x',
        'name': 'Размер',
        'type': 'input_ext'
      }]
    }, {
      'key': 'pivot',
      'name': 'Точка\x20отсчета',
      'children': []
    }, {
      'key': 'rot',
      'name': 'Поворот',
      'children': [{
        'key': 'x',
        'name': 'По\x20оси\x20X',
        'type': 'input_ext'
      }, {
        'key': 'y',
        'name': 'По\x20оси\x20Y',
        'type': 'input_ext'
      }, {
        'key': 'z',
        'name': 'По\x20оси\x20Z',
        'type': 'input_ext'
      }]
    }],
    'mouse_target': [],
    'cut': [{
      'key': 'accessories',
      'name': 'Комплектующие',
      'type': 'acc_picker',
      'catalog': 'accessories',
      'multiple': true,
      'unselect': 1
    }, {
      'key': 'spec',
      'name': 'Основные\x20параметры',
      'children': [{
        'key': 'type',
        'name': 'Форма',
        'type': 'select',
        'values': []
      }]
    }],
    'info_section': [{
      'key': 'spec.key',
      'name': 'Ключ',
      'type': 'text'
    }, {
      'key': 'spec.value',
      'name': 'Значение',
      'type': 'textarea'
    }, {
      'key': 'comments',
      'name': 'Комментарии',
      'type': 'textarea'
    }]
  }
  , A = [{
    'name': 'Секция',
    'key': 'section'
  }, {
    'name': 'Деталь',
    'key': 'wall'
  }, {
    'name': 'Модель',
    'key': 'model'
  }, {
    'name': 'Фасад',
    'key': 'facade'
  }, {
    'name': 'Столешница',
    'key': 'tabletop'
  }, {
    'name': 'Цоколь',
    'key': 'cokol'
  }, {
    'name': 'Световая\x20рейка',
    'key': 'cokol_top'
  }, {
    'name': 'Плинтус',
    'key': 'bort'
  }, {
    'name': 'Карниз',
    'key': 'cornice_placer'
  }, {
    'name': 'Аниматор',
    'key': 'animator'
  }, {
    'name': 'Модуль',
    'key': 'module'
  }, {
    'name': 'Наполняемая\x20секция',
    'key': 'fill_section'
  }, {
    'name': 'Присадка',
    'key': 'furniture'
  }, {
    'name': 'Паз',
    'key': 'path'
  }, {
    'name': 'Размер',
    'key': 'size'
  }, {
    'name': 'Цель\x20для\x20мыши',
    'key': 'mouse_target'
  }, {
    'name': 'Вырез',
    'key': 'cut'
  }, {
    'name': 'Информация',
    'key': 'info_section'
  }]
  , B = [{
    'key': 'z',
    'name': 'Плоскость\x20XY'
  }, {
    'key': '-z',
    'name': 'Плоскость\x20-XY'
  }, {
    'key': 'x',
    'name': 'Плоскость\x20YZ'
  }, {
    'key': '-x',
    'name': 'Плоскость\x20-YZ'
  }, {
    'key': 'y',
    'name': 'Плоскость\x20XZ'
  }, {
    'key': '-y',
    'name': 'Плоскость\x20-XZ'
  }]
  , C = {
    'module': 1,
    'animator': 1,
    'section': 1,
    'fill_section': 1,
    'fake_section': 1,
    'wall': 1,
    'facade': 1
  };
  for (let Z = 0; Z < pp['custom']['item_types']['length']; Z++)
  1 == pp['custom']['item_types'][Z]['add_to_configurator'] && (z[pp['custom']['item_types'][Z]['key']] = pp['custom']['item_types'][Z]['configurator_options'],
  A.push({
    'name': pp['custom']['item_types'][Z]['name'],
    'key': pp['custom']['item_types'][Z]['key']
  }),
  1 == pp['custom']['item_types'][Z]['can_add']) && (C[pp['custom']['item_types'][Z]['key']] = 1);
  let D = {};
  for (let a0 = 0; a0 < A.length; a0++)
  D[A[a0]['key']] = A[a0]['name'];
  let E = {
    'root': 1,
    'group_variable': 1
  };
  var F = ['on_before_params', 'on_before_build', 'on_after_build', 'on_drag_end'];
  let G = z['wall']['find'](a1 => 'spec' === a1['key'])['children']['find'](a1 => 'type' === a1['key'])
  , H = z['path']['find'](a1 => 'spec' === a1['key'])['children']['find'](a1 => 'type' === a1['key'])
  , I = z['cut']['find'](a1 => 'spec' === a1['key'])['children']['find'](a1 => 'type' === a1['key'])
  , J = (G['values'] = [],
  H['values'] = [],
  Object['keys'](pp['custom']['wall_types'])['forEach'](a1 => {
    'free' !== a1 && 'model' !== a1 && 'skewed_by_angle' !== a1 && G['values']['push']({
      'val': a1,
      'label': pp['custom']['wall_types'][a1]['name']
    });
  }
  ),
  Object['keys'](pp['custom']['path_types'])['forEach'](a1 => {
    H['values']['push']({
      'val': a1,
      'label': pp['custom']['path_types'][a1]['name']
    });
  }
  ),
  Object['keys'](pp['custom']['wall_types'])['forEach'](a1 => {
    'free' !== a1 && 'model' !== a1 && 'skewed_by_angle' !== a1 && 'l_shape' !== a1 && 'c_l_shape' !== a1 && 'triangle' !== a1 && I['values']['push']({
      'val': a1,
      'label': pp['custom']['wall_types'][a1]['name']
    });
  }
  ),
  pp['compute']['math_functions']);
  var K = new Map();
  for (let a1 = 0; a1 < w.length; a1++)
  K['set'](w[a1]['key'], a1);
  var L = {
    'key': 'events',
    'name': 'События',
    'children': [],
    'view_mode': 1
  }, N;
  for (let a2 = 0; a2 < F.length; a2++)
  L['children']['push']({
    'key': F[a2],
    'name': F[a2],
    'type': 'text'
  });
  let O = w.findIndex(a3 => 'active' === a3['key']);
  O < 0 ? O = w.length : O += 1;
  for (N of Object['keys'](z))
  if ('info_section' !== N) {
    var P = z[N], Q = copy_object(w), R = [], S;
    for (S of P) {
      var T = K['get'](S['key']);
      void 0 !== T ? Q[T] = S : R.push(S);
    }
    R.length && Q['splice'](O, 0, ...R),
    Q.push(copy_object(L)),
    z[N] = Q;
  }
  let U;
  function W(a3) {
    var a3 = a3['getBoundingClientRect']()
    , a4 = {};
    return a4['top'] = a3['top'] < 0,
    a4['left'] = a3['left'] < 0,
    a4['bottom'] = a3['bottom'] > (window['innerHeight'] || document['documentElement']['clientHeight']),
    a4['right'] = a3['right'] > (window['innerWidth'] || document['documentElement']['clientWidth']),
    a4['any'] = a4['top'] || a4['left'] || a4['bottom'] || a4['right'],
    a4['all'] = a4['top'] && a4['left'] && a4['bottom'] && a4['right'],
    a4;
  }
  Vue['component']('value_input', {
    'template': '#value_input_template',
    'props': {
      'label': String,
      'axis': {
        'type': String,
        'default': ''
      },
      'value': [Number, String],
      'delay': {
        'type': Number,
        'default': 'undefined' == typeof input_delay ? 500 : input_delay
      }
    },
    'data': function() {
      return {
        'show_variables': 0,
        'errors': 0,
        'pretty_val': '',
        'real_val': '',
        'mode': 'pretty',
        'timeout': null
      };
    },
    'computed': {
      'mode_button_content': function() {
        return 'pretty' == this['mode'] ? '{aa}' : 'a:a';
      }
    },
    'watch': {
      'value': function() {
        this['real_val'] = this['value'],
        this['pretty_val'] = this['value'],
        this['from_real']();
      }
    },
    'created': function() {
      this['$options']['var_list'] = this['$parent']['var_list'],
      this['real_val'] = this['value'],
      this['pretty_val'] = this['value'],
      this['from_real'](),
      this['$options']['variable_map'] = {};
      let a3 = this;
      document['addEventListener']('mousedown', function(a4) {
        var a5 = a3['$refs']['var_list'];
        a5 && a4['target'] !== a5 && !a5['contains'](a4['target']) && (a3['show_variables'] = false);
      });
    },
    'mounted': function() {},
    'methods': {
      'get_style': function() {
        return 'x' == this['axis'] ? {
          'color': '#e10000'
        } : 'y' == this['axis'] ? {
          'color': '#67952c'
        } : 'z' == this['axis'] ? {
          'color': '#4c95f7'
        } : {};
      },
      'change_mode': function() {
        'pretty' == this['mode'] ? this['mode'] = 'real' : this['mode'] = 'pretty';
      },
      'add_val': function(a3, a4='') {
        '' == a4 ? this['pretty_val'] = '{' + a3['name'] + '}' : this['pretty_val'] += a4 + '{' + a3['name'] + '}',
        this['show_variables'] = 0,
        this['from_pretty'](),
        this['on_change']();
      },
      'add_val_mat': function(a3, a4='') {
        var a3, a3 = '{' + (a3['name'] || a3['key']) + '}';
        a4 ? this['pretty_val'] += a4 + a3 : this['pretty_val'] = a3,
        this['show_variables'] = 0,
        this['from_pretty'](),
        this['on_change']();
      },
      'append': function(a3) {
        a3 && (this['pretty_val'] += a3,
        this['from_pretty'](),
        this['on_change']());
      },
      'change_pretty': function() {
        this['from_pretty'](),
        this['on_change']();
      },
      'change_real': function() {
        this['from_real'](),
        this['on_change']();
      },
      'from_pretty': function() {
        let a3 = this['pretty_val'];
        a3 = (a3 = (a3 = a3['replaceAll']('s.x', 's:x'))['replaceAll']('s.z', 's:z'))['replaceAll']('s.y', 's:y'),
        Object['entries'](this['$options']['var_list']['reverse_functions'])['forEach']( ([a4,a5]) => {
          var a4 = new RegExp(a4,'gi');
          a3 = a3.replace(a4, 'f:' + a5);
        }
        ),
        Object['entries'](this['$options']['var_list']['hash'])['forEach']( ([a4,a5]) => {
          var a4 = a4.replace(/[.*+?^${}()|[\]\\]/g, '\x5c$&')
          , a4 = new RegExp('\x5c{' + a4 + '\x5c}','g');
          a3 = a3.replace(a4, a5);
        }
        ),
        this['real_val'] = a3;
      },
      'from_real': function() {
        let a3 = this['real_val'];
        if ('' == a3)
        this['real_val'] = 0,
        this['pretty_val'] = 0;
        else {
          if ('number' == typeof a3)
          return a3;
          a3 = (a3 = (a3 = a3['replaceAll']('s.x', 's:x'))['replaceAll']('s.z', 's:z'))['replaceAll']('s.y', 's:y'),
          Object['entries'](this['$options']['var_list']['functions'])['forEach']( ([a4,a5]) => {
            var a4 = new RegExp('f:' + a4,'gi');
            a3 = a3.replace(a4, a5['name']);
          }
          ),
          Object['entries'](this['$options']['var_list']['reverse_hash'])['forEach']( ([a4,a5]) => {
            var a4 = new RegExp(a4,'g');
            a3 = a3.replace(a4, '{' + a5 + '}');
          }
          ),
          this['pretty_val'] = a3;
        }
      },
      'show_var_list': function(a3) {
        var a3 = a3['target']['getBoundingClientRect']()
        , a3 = (this['$refs']['var_list']['style']['top'] = 'auto',
        this['$refs']['var_list']['style']['bottom'] = 'auto',
        this['$refs']['var_list']['style']['left'] = 'auto',
        this['$refs']['var_list']['style']['right'] = 'auto',
        this['$refs']['var_list']['style']['left'] = a3['left'] + 'px',
        this['$refs']['var_list']['style']['top'] = a3['top'] + 'px',
        W(this['$refs']['var_list']));
        a3['bottom'] && (this['$refs']['body']['style']['top'] = 'auto',
        this['$refs']['body']['style']['bottom'] = '20px'),
        a3['right'] && (this['$refs']['body']['style']['left'] = 'auto',
        this['$refs']['body']['style']['right'] = '20px'),
        this['show_variables'] = !this['show_variables'];
      },
      'on_change': function(a3) {
        clearTimeout(this['debounce']);
        var a4 = this;
        a4['$emit']('change_inp', a4['real_val']),
        this['debounce'] = setTimeout(function() {}, this['delay']);
      },
      'apply_val': function() {
        this['on_change']();
      },
      'lang': function(a3) {
        return lang[a3];
      }
    }
  }),
  view_mode && (Vue['component']('material_input', {
    'template': '#material_input_template',
    'props': {
      'params': {
        'type': Object,
        'default': function() {
          return {};
        }
      },
      'materials': {
        'type': Object,
        'default': function() {
          return {};
        }
      },
      'group': {
        'type': Number,
        'default': 0
      },
      'label': String,
      'value': [Number, String],
      'delay': {
        'type': Number,
        'default': 'undefined' == typeof input_delay ? 500 : input_delay
      }
    },
    'data': function() {
      return {
        'l_params': {},
        'av_thickness': [],
        'av_thickness_index': pp['const']['not_set_value']
      };
    },
    'computed': {},
    'watch': {
      'params': function() {
        this['cr']();
      }
    },
    'created': function() {
      this['cr']();
    },
    'mounted': function() {},
    'methods': {
      'cr': function() {
        void 0 === this['params']['group'] && (this['params']['group'] = ''),
        this['params']['key'],
        this['params']['id'],
        void 0 === this['params']['variant_id'] && (this['params']['variant_id'] = 0),
        void 0 === this['params']['av_index'] && (this['params']['av_index'] = 0);
        var a3 = configurator['mat_groups_hash'][this['params']['group']], a3 = (this['params']['group'] && a3?.['available']?.['length'] || (this['params']['key'] = ''),
        this['get_thickness'](this['params']['av_index'], this['params']['group'])), a4;
        is_empty_id(this['params']['thickness_lock']) || (0 <= (a4 = this['find_thickness_index'](this['params']['thickness_lock'], a3)) ? Vue['set'](this, 'av_thickness_index', a4) : (Vue['set'](this, 'av_thickness_index', pp['const']['not_set_value']),
        this['params']['thickness_lock'] = pp['const']['not_set_value'])),
        Vue['set'](this, 'av_thickness', a3),
        Vue['set'](this, 'l_params', copy_object(this['params'])),
        this['$options']['materials_by_key'] = materials_by_key,
        this['$options']['materials_keys'] = materials_keys,
        this['$options']['materials_keys_hash'] = materials_keys_hash;
      },
      'change_material': function(a3) {
        var a4;
        a3 && (a4 = a3['key'],
        is_empty_id(a4) || (this['l_params']['key'] = a4,
        this['l_params']['key'] != a4 && (this['l_params']['variant_id'] = 0)),
        this['l_params']['id'] = a3['id'],
        this['l_params']['id'] != a3['id'] && (this['l_params']['variant_id'] = 0),
        this['$emit']('change_material', copy_object(this['l_params'])));
      },
      'change_group': function() {
        this['l_params']['av_index'] = 0;
        var a3 = configurator['mat_groups_hash'][this['l_params']['group']], a4, a5;
        function a6(a7) {
          var a8 = a7['get_thickness'](a7['l_params']['av_index'], a7['l_params']['group'])
          , a9 = a7['find_thickness_index'](a7['l_params']['thickness_lock'], a8);
          Vue['set'](a7, 'av_thickness_index', 0 <= a9 ? a9 : pp['const']['not_set_value']),
          a7['l_params']['thickness_lock'] = 0 <= a9 ? a8[a9] : pp['const']['not_set_value'],
          Vue['set'](a7, 'av_thickness', a8);
        }
        a3?.['available']?.['length'] ? (a4 = a3['available'][this['l_params']['av_index']]) ? (a5 = a4?.['key'] || '',
        this['l_params']['key'] && this['l_params']['key'] !== a5 ? (this['l_params']['key'] = a5,
        this['l_params']['id'] = 0,
        this['l_params']['variant_id'] = 0) : !this['l_params']['key'] && a4 && (this['l_params']['key'] = a4['key'],
        this['l_params']['id'] = 0,
        this['l_params']['variant_id'] = 0),
        Vue['set'](this, 'l_params', this['l_params']),
        a6(this)) : (this['l_params']['av_index'] = 0,
        this['l_params']['key'] = a3['available'][0]['key'],
        this['l_params']['id'] = 0,
        this['l_params']['variant_id'] = 0,
        a6(this),
        Vue['set'](this, 'l_params', this['l_params'])) : (this['l_params']['av_index'] = 0,
        this['l_params']['key'] = '',
        this['l_params']['id'] = 0,
        this['l_params']['variant_id'] = 0,
        a6(this),
        Vue['set'](this, 'l_params', this['l_params'])),
        this['$emit']('change_group', copy_object(this['l_params']));
      },
      'change_key': function() {
        var a3 = configurator['mat_groups_hash'][this['l_params']['group']], a4 = this['l_params']['av_index'] || 0, a5, a3 = (a3['available']?.[a4])?.['key'] || '', a4 = this['get_thickness'](a4, this['l_params']['group']), a6 = this['find_thickness_index'](this['l_params']['thickness_lock'], a4);
        Vue['set'](this, 'av_thickness_index', 0 <= a6 ? a6 : pp['const']['not_set_value']),
        this['l_params']['thickness_lock'] = 0 <= a6 ? a4[a6] : pp['const']['not_set_value'],
        Vue['set'](this, 'av_thickness', a4),
        this['l_params']['key_lock'] = a3,
        Vue['set'](this, 'l_params', this['l_params']),
        this['$emit']('change_group', copy_object(this['l_params']));
      },
      'change_thickness': function() {
        let a3 = this['av_thickness'][this['av_thickness_index']];
        is_empty_value(a3) && (a3 = pp['const']['not_set_value']),
        this['l_params']['thickness_lock'] = a3,
        this['$emit']('change_group', copy_object(this['l_params']));
      },
      'change_drag_mode': function() {
        this['$emit']('change_drag_mode', copy_object(this['l_params']));
      },
      'change_variant': function() {
        this['$emit']('change_variant', copy_object(this['l_params']));
      },
      'change_rotated': function() {
        this['$emit']('change_rotated', copy_object(this['l_params']));
      },
      'change_fixed': function() {
        this['$emit']('change_fixed', copy_object(this['l_params']));
      },
      'get_materials_keys'() {
        var a3 = configurator['mat_groups_hash'][this['l_params']['group']];
        return _['uniq'](_.map(a3?.['available'], 'key'));
      },
      'get_thickness'(a3, a4) {
        var a4 = configurator['mat_groups_hash'][a4];
        if (!a4?.['available'])
        return [];
        if (is_empty_value(a3) || a3 < 0) {
          var a5 = new Set();
          for (let a8 of a4['available'])
          if (a8?.['thickness']?.['length'])
          for (var a6 of a8?.['thickness']) {
            var a6 = parseInt(a6);
            !Number['isFinite'](a6) || a6 <= 0 || a5['add'](a6);
          }
          return [...a5]['sort']( (a9, aa) => a9 - aa);
        }
        let a7 = a4['available']?.[a3];
        return a7?.['thickness']?.['length'] ? a7['thickness'] : [];
      },
      'find_thickness_index'(a3, a4) {
        return is_empty_id(a3) ? -1 : _.findIndex(a4, a5 => a5 && '' + a5 == '' + a3);
      },
      'get_mat_groups_categories': function(a3) {
        var a4 = this['l_params']['av_index'] || 0, a5;
        return _['get'](a3, 'available[' + a4 + '].categories', [])['map'](a6 => parseInt(a6));
      },
      'get_material_variants': function(a3, a4, a5=false) {
        return configurator['get_material_variants'](a3, a4, a5);
      },
      'lang': function(a3) {
        return lang[a3];
      }
    }
  }),
  Vue['component']('condition_input', {
    'template': '#condition_input_template',
    'props': {
      'var_list': {
        'type': Object,
        'default': function() {
          return {};
        }
      },
      'label': String,
      'value': [Number, String],
      'delay': {
        'type': Number,
        'default': 'undefined' == typeof input_delay ? 500 : input_delay
      }
    },
    'data': function() {
      return {
        'show_variables': 0,
        'errors': 0,
        'conditions': [],
        'cond_f': '',
        'cond_o': '==',
        'cond_v': 0,
        'variable': null,
        'variable_type': '',
        'operators': [],
        'timeout': null,
        'delay': 'undefined' == typeof input_delay ? 500 : input_delay,
        'debounce': null
      };
    },
    'computed': {},
    'watch': {
      'value': function() {
        this['cr']();
      }
    },
    'created': function() {
      this['$options']['operators'] = ['==', '!=', '>', '>=', '<', '<='],
      this['cr']();
    },
    'methods': {
      'cr': function() {
        let a3 = this['value'] ? copy_object(this['value']) : [];
        for (var a4 of a3) {
          for (var a5 of a4)
          this['init_cond'](a5);
          var a6 = _['last'](a4);
          if (!a6 || a6['variable']) {
            let a7 = this['init_cond']();
            a4.push(a7);
          }
        }
        this['conditions'] = a3;
      },
      'add_or'() {
        var a3 = _['last'](this['conditions']), a3;
        a3 && !_['find'](a3, a4 => a4['variable']) || (a3 = this['init_cond'](),
        this['conditions']['push']([a3]));
      },
      'init_cond'(a3) {
        (a3 = a3 || {
          'f': '',
          'o': '==',
          'v': void 0
        })['f'] = a3['f'] || '',
        a3['is_size'] = this['is_size'](a3['f']) ? 1 : 0,
        a3['variable'] = (a3['is_size'] ? a3['f'] : a3['f']['substring'](2)) || null,
        a3['o'] = a3['o'] || '==';
        var a4 = this['var_list']['variables'][a3['variable']];
        return a3['v'] = void 0 !== a3['v'] ? a3['v'] : this['get_variable_value'](a4),
        a3['operators'] = 'number' === a4?.['type'] || a3['is_size'] ? this['$options']['operators'] : ['==', '!='],
        a3['variable_type'] = a4?.['type'],
        a3;
      },
      'is_size': function(a3) {
        return 's' === a3?.[0] && ':' === a3?.[1];
      },
      'on_change': function(a3, a4, a5) {
        var a6;
        null === a3['variable'] ? (a3['f'] = '',
        a3['o'] = '==',
        a3['v'] = void 0,
        a3['operators'] = ['==', '!='],
        a3['variable_type'] = null) : (a6 = this['var_list']['variables'][a3['variable']],
        a3['is_size'] = this['is_size'](a3['variable']) ? 1 : 0,
        a3['f'] = (a3['is_size'] ? '' : 'v:') + a3['variable'],
        a3['o'] = '==',
        a3['v'] = this['get_variable_value'](a6),
        a3['operators'] = 'number' === a6?.['type'] || a3['is_size'] ? this['$options']['operators'] : ['==', '!='],
        a3['variable_type'] = a6?.['type']),
        this['apply_val']();
      },
      'on_input': function(a3, a4, a5) {
        this['debounce'] = setTimeout( () => {
          this['apply_val']();
        }
        , this['delay']);
      },
      'apply_val': function() {
        let a3 = copy_object(this['conditions']);
        for (var a4 of a3)
        _['remove'](a4, a6 => !a6['variable']);
        _['remove'](a3, a6 => !a6.length);
        for (var a5 of a3)
        for (let a6 = 0; a6 < a5.length; a6++)
        a5[a6] = {
          'f': a5[a6]['f'],
          'o': a5[a6]['o'],
          'v': a5[a6]['v']
        };
        a3 && a3.length || (a3 = null),
        this['$emit']('change_inp', a3);
      },
      'get_variable_value': function(a3) {
        if (!a3)
        return 0;
        if (void 0 !== a3['value'])
        return a3['value'];
        let a4 = 0;
        return 'number' === a3['type'] ? a4 = void 0 !== a3['params']['min'] ? a3['params']['min'] : 0 : 'select' === a3['type'] && (a4 = a3['params']['options'][0] || ''),
        a4;
      }
    }
  }),
  Vue['component']('filemanager_input', {
    'template': '#filemanager_input_template',
    'props': {
      'value': String
    },
    'data': function() {
      return {};
    },
    'computed': {},
    'watch': {},
    'created': function() {},
    'mounted': function() {},
    'methods': {
      'sel_file2'(a3) {
        this['value'] = a3['true_path'],
        this['on_change']();
      },
      'on_change'() {
        this['$emit']('change_inp', this['value']);
      }
    }
  })),
  view_mode || Vue['component']('configurator_v2_params', {
    'template': '#configurator_v2_params_template',
    'props': {
      'variables': {
        'type': Object,
        'default': function() {
          return {};
        }
      },
      'computed': {
        'type': Object,
        'default': function() {
          return {};
        }
      },
      'current_params': {
        'type': Object,
        'default': function() {
          return {};
        }
      },
      'variable_params': {
        'type': Object,
        'default': function() {
          return {};
        }
      }
    },
    'data': function() {
      return {};
    },
    'computed': {
      'var_list': function() {
        let a3 = this
        , a4 = copy_object({
          'sizes': {
            'x': {
              'key': 'x',
              'name': 'Ширина'
            },
            'y': {
              'key': 'x',
              'name': 'Высота'
            },
            'z': {
              'key': 'x',
              'name': 'Глубина'
            }
          },
          'variables': this['variables']['main'],
          'computed': this['computed'],
          'materials': {}
        })
        , a5 = {};
        return Object['keys'](this['variables']['main'])['forEach'](function(a6) {
          a5[a3['variables']['main'][a6]['name']] = 'v:' + a6;
        }),
        Object['keys'](this['computed'])['forEach'](function(a6) {
          a5[a3['computed'][a6]['name']] = 'c:' + a6;
        }),
        Object['keys'](a4['materials'])['forEach'](function(a6) {
          let a7 = a4['materials'][a6];
          a5[a7['name'] + '\x20текущий::' + a7['id']] = 'm:' + a6 + '.current.size.z',
          Object['keys'](a7['variants'])['forEach'](function(a8) {
            a5[a7['name'] + '\x20' + a7['variants'][a8]['name'] + '::' + a7['id']] = 'm:' + a6 + '.' + a8 + '.size.z';
          });
        }),
        a4['hash'] = a5,
        a4['hash']['Высота'] = 's:y',
        a4['hash']['Ширина'] = 's:x',
        a4['hash']['Глубина'] = 's:z',
        copy_object(a4);
      }
    },
    'watch': {},
    'created': function() {
      this['$options']['opts'] = z,
      this['$options']['wall_types'] = pp['custom']['wall_types'],
      this['$options']['path_types'] = pp['custom']['path_types'];
    },
    'mounted': function() {},
    'methods': {
      'change_name': function(...a3) {
        return this['$root']['$refs']['module_menu_v2']['$refs']['config']['change_name'](...a3);
      },
      'check_view_mode': function(...a3) {
        return this['$root']['$refs']['module_menu_v2']['$refs']['config']['check_view_mode'](...a3);
      },
      'check_param_condition': function(...a3) {
        return this['$root']['$refs']['module_menu_v2']['$refs']['config']['check_param_condition'](...a3);
      },
      'change_param': function(...a3) {
        return this['$root']['$refs']['module_menu_v2']['$refs']['config']['change_param'](...a3);
      },
      'change_var_param': function(...a3) {
        return this['$root']['$refs']['module_menu_v2']['$refs']['config']['change_var_param'](...a3);
      },
      'get_current_param': function(...a3) {
        return this['$root']['$refs']['module_menu_v2']['$refs']['config']['get_current_param'](...a3);
      },
      'get_style': function(...a3) {
        return this['$root']['$refs']['module_menu_v2']['$refs']['config']['get_style'](...a3);
      },
      'lang': function(a3) {
        return lang[a3];
      }
    }
  }),
  Vue['component']('configurator_v2', {
    'template': '#configurator_v2_template',
    'components': view_mode ? {
      'v-select': VueSelect['VueSelect']
    } : {},
    'props': {
      'item_params': {
        'type': Object,
        'default': () => null
      },
      'selected_object': {
        'type': Object,
        'default': () => null
      },
      'vartree_object': {
        'type': Object,
        'default': () => null
      },
      'root_name': {
        'type': String,
        'default': 'Модуль'
      },
      'tabs': {
        'type': Object,
        'default': function() {
          return {
            'common': 1,
            'tree': 1,
            'variables': 1,
            'treevar': 1,
            'variants': 1,
            'templates': 1,
            'accessories': 1,
            'materials': 1,
            'json': 1,
            'events': 1,
            'param_tab': 1
          };
        }
      },
      'excluded_items': {
        'type': Array,
        'default': () => []
      }
    },
    'data': function() {
      return {
        'item_meta': {
          'active': 1,
          'order': 0,
          'category': [],
          'icon': ''
        },
        'item': {},
        'controller_name': view_mode ? glob['controller_name'] : '',
        'has_icon_file': 0,
        'show': 1,
        'mode': 'back',
        'current_node': null,
        'modal_add': {
          'show': 0,
          'node': null,
          'type': 'section',
          'name': 'Секция',
          'model_id': 0,
          'model_type': '',
          'model_parent_size': 1,
          'params': {}
        },
        'var_modal_add_group': {
          'show': 0,
          'node': null,
          'type': 'group_variable',
          'name': 'Группа',
          'model_id': 0,
          'model_type': '',
          'model_parent_size': 1,
          'params': {}
        },
        'var_global_variable_modal': {
          'show': 0,
          'node': null,
          'type': 'group_variable',
          'name': 'Группа',
          'model_id': 0,
          'model_type': '',
          'model_parent_size': 1,
          'params': {}
        },
        'var_modal_add': {
          'show': 0,
          'node': null,
          'type': 'root_variable',
          'name': 'Переменные',
          'model_id': 0,
          'model_type': '',
          'model_parent_size': 1,
          'params': {}
        },
        'mat_group_modal': {
          'ind': 0,
          'group': {
            'material': {}
          }
        },
        'mat_group_modal_instance': null,
        'mat_group_global_modal_instance': null,
        'global_vars_modal_instance': null,
        'picker_controller_name': null,
        'common_params': {},
        'default_furniture': {},
        'accessories_types': null,
        'var_add_vis': 0,
        'variable': {
          'name': '',
          'key': '',
          'type': 'number',
          'value': 0,
          'local': 0,
          'editable': 0,
          'variants': 0,
          'params': {
            'min': 1,
            'max': '',
            'step': 1
          }
        },
        'nodes_variable': [],
        'tree_old_state': [],
        'node_var_context_visible': false,
        'node_var_can_add': true,
        'node_var_is_root': true,
        'variable_params': '',
        'edges': {
          'is_on': false,
          'transparent': false
        },
        'embed': {
          'is_on': false,
          'fixed': false
        },
        'module_types': [],
        'module_types_all': 1,
        'tab': 'common',
        'nodes': [],
        'node_context_visible': false,
        'node_can_add': true,
        'node_is_root': false,
        'current_params': '',
        'params_apply': [],
        'defaults_params': {},
        'computed': {},
        'butts': [],
        'delay': 'undefined' == typeof input_delay ? 500 : input_delay,
        'debounce': null,
        'selected_path': '',
        'selected_path_root_fill': '',
        'var_override_add_key': '',
        'templates_vars_hash': {},
        'mat_groups_hash': {},
        'is_show_butts': false
      };
    },
    'computed': {
      'variant_var_list': function() {
        var a3 = {
          'variables': {}
        }, a4 = {}, a5 = pp['variables']['current'], a6 = this['item']['variables']['global'], a7;
        if (a6 && a5)
        for (let a8 of a6) {
          a3['variables'][a8['key']] || (a7 = _['find'](a5, a9 => a9['key'] === a8['key'])) && (a3['variables'][a8['key']] = copy_object(a7),
          a4[a7['name']] = 'v:' + a8['key']);
        }
        return a3['hash'] = a4,
        a3;
      },
      'var_list': function() {
        let a3 = {
          'sizes': {
            'x': {
              'key': 'x',
              'name': 'Ширина\x20(родит.\x20элемент)'
            },
            'y': {
              'key': 'y',
              'name': 'Высота\x20(родит.\x20элемент)'
            },
            'z': {
              'key': 'z',
              'name': 'Глубина\x20(родит.\x20элемент)'
            }
          },
          'sizes_root': {
            'rx': {
              'key': 'rx',
              'name': 'Ширина\x20(родит.\x20элемент\x20верхнего\x20уровня)'
            },
            'ry': {
              'key': 'ry',
              'name': 'Высота\x20(родит.\x20элемент\x20верхнего\x20уровня)'
            },
            'rz': {
              'key': 'rz',
              'name': 'Глубина\x20(родит.\x20элемент\x20верхнего\x20уровня)'
            }
          },
          'variables': {
            ...this['item']['variables']['main']
          },
          'computed': this['computed'],
          'materials': this['mat_groups_hash']
        }
        , a4 = {};
        Object['keys'](this['templates_vars_hash'] || {})['forEach'](a8 => {
          a3['variables'][a8] || (a3['variables'][a8] = this['templates_vars_hash'][a8],
          a4[this['templates_vars_hash'][a8]['name']] = 'v:' + a8);
        }
        );
        var a5 = pp['variables']['current'], a6 = this['item']['variables']['global'], a7;
        if (a6 && a5)
        for (let a8 of a6) {
          a3['variables'][a8['key']] || (a7 = _['find'](a5, a9 => a9['key'] === a8['key'])) && (a3['variables'][a8['key']] = copy_object(a7),
          a4[a7['name']] = 'v:' + a8['key']);
        }
        return Object['keys'](this['item']['variables']['main'])['forEach'](a9 => {
          a4[this['item']['variables']['main'][a9]['name']] = 'v:' + a9;
        }
        ),
        Object['keys'](a3['materials'])['forEach'](a9 => {
          var a9 = a3['materials'][a9];
          a4[a9['name'] || a9['key']] = 'g:' + a9['key'] + '.thickness';
        }
        ),
        a3['hash'] = a4,
        a3['hash']['Ширина\x20(родит.\x20элемент)'] = 's:x',
        a3['hash']['Высота\x20(родит.\x20элемент)'] = 's:y',
        a3['hash']['Глубина\x20(родит.\x20элемент)'] = 's:z',
        a3['hash']['Ширина\x20(родит.\x20элемент\x20верхнего\x20уровня)'] = 's:rx',
        a3['hash']['Высота\x20(родит.\x20элемент\x20верхнего\x20уровня)'] = 's:ry',
        a3['hash']['Глубина\x20(родит.\x20элемент\x20верхнего\x20уровня)'] = 's:rz',
        a3['reverse_hash'] = {},
        Object['keys'](a3['hash'])['forEach'](a9 => {
          a3['reverse_hash'][a3['hash'][a9]] = a9;
        }
        ),
        a3['functions'] = J,
        a3['reverse_functions'] = {},
        Object['entries'](J)['forEach']( ([a9,aa]) => {
          a3['reverse_functions'][aa['name']] = a9;
        }
        ),
        a3;
      },
      'check_furni_auto': function() {
        return !!this['accessories_types'] && 0 == Object['keys'](this['accessories_types'])['length'];
      },
      'facade_picker_categories': function() {
        return this['get_item_picker_categories']('spec', 'materials.gen');
      },
      'templates': function() {
        var a3 = this['item']['spec']['templates'];
        if (!a3)
        return [];
        var a4 = [];
        for (let a6 = 0; a6 < a3.length; a6++) {
          var a5 = a3[a6];
          void 0 !== a5['active'] && !a5['active'] || a4.push({
            'index': a6,
            'name': a5['name'],
            'min': a5['min'],
            'max': a5['max']
          });
        }
        return a4;
      },
      'filtered_item_types'() {
        var a3 = this['$options']['item_types'] || []
        , a4 = this['$root']?.['$selected_object']
        , a5 = this['convert_item_path_to_module'](this['selected_path'])
        , a4 = module_utils['get_child_by_path'](a4, a5);
        return a4 instanceof CabinetWall || a4 instanceof CabinetFacade ? a3 : a3.filter(a6 => 'path' !== a6['key']);
      }
    },
    'created': function() {
      'function' == typeof configurator_init_callback && configurator_init_callback();
      let a3 = this;
      this['$options']['opts'] = z,
      this['$options']['wall_types'] = pp['custom']['wall_types'],
      this['$options']['path_types'] = pp['custom']['path_types'],
      this['$options']['clipboard'] = null,
      this['$options']['clipboardVar'] = null,
      this['$options']['clipboardApi'] = false,
      this['$options']['view_mode'] = view_mode ? 1 : 0,
      this['$options']['materials_groups'] = materials_groups,
      this['$options']['materials_groups_hash'] = materials_groups_hash,
      this['$options']['facade_params_apply'] = [{
        'key': 'spec.id',
        'name': 'Выбранная\x20модель',
        'type': 'item_picker',
        'catalog': 'facades',
        'default_value': pp['const']['not_set_value'],
        'unselect': 1
      }, {
        'key': 'spec.materials.gen',
        'name': 'Материал\x20фасада',
        'type': 'item_picker',
        'catalog': 'materials',
        'multiple': false,
        'default_value': pp['const']['not_set_value'],
        'unselect': 1
      }, {
        'key': 'spec.can_change.id',
        'name': 'Сменяемый\x20тип\x20элемента',
        'type': 'boolean'
      }, {
        'key': 'spec.can_change.material',
        'name': 'Сменяемый\x20материал\x20фасада',
        'type': 'boolean'
      }, {
        'key': 'spec.can_change.type',
        'name': 'Сменяемый\x20тип\x20фасада',
        'type': 'boolean'
      }, {
        'key': 'spec.group',
        'name': 'Группа',
        'type': 'select',
        'values': [{
          'label': 'Авто',
          'val': 'auto'
        }, {
          'label': 'Верхние',
          'val': 'top'
        }, {
          'label': 'Нижие',
          'val': 'bottom'
        }]
      }, {
        'key': 'spec.type',
        'name': 'Тип\x20фасада',
        'type': 'select',
        'values': [{
          'label': 'Глухой',
          'val': 'full'
        }, {
          'label': 'Витрина',
          'val': 'window'
        }, {
          'label': 'Решетка',
          'val': 'frame'
        }]
      }, {
        'key': 'spec.handle.enabled',
        'name': 'Устанавливать\x20ручку',
        'type': 'boolean'
      }, {
        'key': 'spec.handle.dir',
        'name': 'Направление\x20профиль\x20ручек',
        'type': 'select',
        'values': [{
          'label': 'Слева',
          'val': 'l'
        }, {
          'label': 'Справа',
          'val': 'r'
        }, {
          'label': 'Снизу',
          'val': 'b'
        }, {
          'label': 'Сверху',
          'val': 't'
        }]
      }, {
        'key': 'spec.handle.orient',
        'name': 'Ориентация',
        'type': 'select',
        'values': [{
          'label': 'От\x20параметров\x20модуля',
          'val': 'a'
        }, {
          'label': 'Вертикальная',
          'val': 'v'
        }, {
          'label': 'Горизонтальная',
          'val': 'h'
        }]
      }, {
        'key': 'spec.handle.pos.x',
        'name': 'Позиция\x20по\x20горизонтали',
        'type': 'select',
        'values': [{
          'label': 'От\x20параметров\x20модуля',
          'val': 'a'
        }, {
          'label': 'Слева',
          'val': 'l'
        }, {
          'label': 'По\x20центру',
          'val': 'c'
        }, {
          'label': 'Справа',
          'val': 'r'
        }]
      }, {
        'key': 'spec.handle.pos.y',
        'name': 'Позиция\x20по\x20вертикали',
        'type': 'select',
        'values': [{
          'label': 'От\x20параметров\x20модуля',
          'val': 'a'
        }, {
          'label': 'Сверху',
          'val': 't'
        }, {
          'label': 'По\x20центру',
          'val': 'c'
        }, {
          'label': 'Снизу',
          'val': 'b'
        }]
      }],
      view_mode && (this['$options']['materials_keys'] = materials_keys,
      this['$options']['materials_keys_hash'] = materials_keys_hash,
      this['$options']['materials_by_key'] = materials_by_key,
      this['$options']['butts_keys'] = butts_keys,
      this['$options']['cat_ordered'] = cat_ordered,
      this['$options']['catalogs_keys'] = catalogs_keys || [],
      this['$options']['modules_groups'] = modules_groups,
      this['$options']['accessories'] = accessories,
      this['$options']['accessories_types'] = accessories_types,
      this['$options']['accessories_hash'] = accessories_hash,
      this['$options']['accs_by_type'] = accs_by_type,
      this['$options']['params_hash'] = params_hash,
      this['modal_add']['model_type'] = _['get'](this['$options']['catalogs_keys'], '[0].key')),
      this['$options']['var_params'] = {
        'number': {
          'min': 1,
          'max': '',
          'step': 1
        },
        'select': {
          'options': []
        },
        'boolean': {}
      };
      var a4 = {};
      if (pp['variables']['global_vars'] && pp['variables']['global_vars'][0]) {
        for (var a5 of pp['variables']['global_vars'][0]['vars'])
        a4[a5['key']] || (a4[a5['key']] = copy_object(a5));
      }
      if (this['$options']['global_vars_hash'] = a4,
      window['navigator']['clipboard'] && 'function' == typeof window['navigator']['clipboard']['readText'] && 'function' == typeof window['navigator']['clipboard']['writeText'] && (this['$options']['clipboardApi'] = true),
      this['excluded_items']['length']) {
        var a6 = {};
        for (let af = this['excluded_items']['length']; af--; )
        a6[this['excluded_items'][af]] = 1;
        for (let ag = A.length; ag--; )
        a6[A[ag]['key']] && A['splice'](ag, 1);
      }
      this['$options']['item_types'] = A,
      this['$options']['item_types_direction'] = B,
      this['$options']['item_types_names'] = D;
      var a7 = this['item_params'] ? copy_object(this['item_params']) : {}, a8 = a7['params'], a9;
      if (delete a7['params'],
      this['item_meta'] = merge(this['item_meta'], copy_object(a7)),
      this['item'] = this['get_default_module_params'](a8),
      null == this['item']['spec']['variants'] && 0 < this['item']['spec']['variants']['length']) {
        for (let ah = 0; ah < this['item']['spec']['variants']['length']; ah++)
        this['item']['spec']['variants'][ah]['params_item'] = {},
        Object['values'](this['$options']['params_hash'])['forEach'](ai => {
          var aj;
          1 == ai['site'] && (aj = this['item']['spec']['variants'][ah]['params_item'],
          'list' == ai['params']['type'] ? aj['p' + ai['id']] = {
            'name': ai['name'],
            'data': ai['params']['options']
          } : aj['p' + ai['id']] = {
            'name': ai['name'],
            'data': ai['params']['default']
          });
        }
        );
      }
      if (void 0 === this['item']['show_in_spec'] && (this['item']['show_in_spec'] = 1),
      void 0 === this['item']['nested_in_spec'] && (this['item']['nested_in_spec'] = 1),
      this['item']['spec']['templates']) {
        let ai = this;
        Object['defineProperty'](this['item']['spec'], 'template', {
          'get': function() {
            var aj = ai['$root']['$selected_object']
            , aj = this['templates'][aj['userData']['selected_template']];
            return aj ? aj['template'] : void 0;
          },
          'set': function(aj) {
            var ak = ai['$root']['$selected_object']
            , al = this['templates'][ak['userData']['selected_template']];
            al ? al['template'] = aj : this['templates'][ak['userData']['selected_template']] = {
              'name': '',
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
              'template': aj
            };
          }
        });
      }
      if (!this['item']['spec']['cabinet_tag']) {
        let aj = 'bottom'
        , ak = this['$options']['modules_groups'];
        ak && ak.length && !_['find'](ak, ['key', 'bottom']) && (aj = ak[0]['key']),
        this['item']['spec']['cabinet_tag'] = aj;
      }
      void 0 === this['item']['spec']['element_type'] && (this['item']['spec']['element_type'] = 'module'),
      void 0 === this['item']['spec']['catalog_type'] && (this['item']['spec']['catalog_type'] = ''),
      this['item']['spec']['defaults']?.['facade'] && delete this['item']['spec']['defaults']?.['facade'],
      this['item']['accessories_types'] || (this['item']['accessories_types'] = {}),
      this['item']['fill'] || (this['item']['fill'] = {}),
      this['item']['resizable']['locks'] = fix_json_empty_object(this['item']['resizable']['locks']),
      this['item']['accessories_types'] = fix_json_empty_object(this['item']['accessories_types']),
      this['accessories_types'] = this['item']['accessories_types'],
      this['item']['events'] || (this['item']['events'] = {}),
      this['item']['spec']['variants'] || (this['item']['spec']['variants'] = [{
        'code': '',
        'name': '',
        'width': 600,
        'height': 500,
        'depth': 400,
        'size': {
          'x': 600,
          'y': 500,
          'z': 400
        },
        'price': '',
        'default': 1,
        'active': 1,
        'accessories': []
      }]);
      for (a9 of this['item']['spec']['variants'])
      a9['size'] ? (a9['width'] = a9['size']['x'],
      a9['height'] = a9['size']['y'],
      a9['depth'] = a9['size']['z'],
      a9['variables'] || (a9['variables'] = {}),
      a9['variables'] = fix_json_empty_object(a9['variables'])) : a9['size'] = {
        'x': a9['width'],
        'y': a9['height'],
        'z': a9['depth']
      };
      var aa = project_settings['kitchen']?.['mat_groups'] || {}, a7, ab, a8, a7;
      if (this['item']['spec']['mat_groups'] && this['item']['spec']['mat_groups']['length']) {
        this['update_mat_groups_hash']();
        for (var ac of this['item']['spec']['mat_groups'])
        if (ac['vue_id'] = this['get_random_id'](),
        'default'in ac || (ac['default'] = 0),
        aa[ac['key']] || (ac['available'] || (ac['available'] = [{
          'key': 'ldsp',
          'thickness': [],
          'categories': []
        }]),
        ac['material']) || (ac['material'] = {
          'av_index': 0,
          'key': 'ldsp',
          'variant_id': 0
        }),
        ac['available']) {
          for (var ad of ac['available'])
          ad['vue_id'] = this['get_random_id']();
        }
      }
      is_empty_id(this['item_meta']['id']) && !_['find'](this['item']['spec']['mat_groups'], al => 'g0' === al['key']) && (this['item']['spec']['mat_groups'] || (this['item']['spec']['mat_groups'] = []),
      0 <= (a7 = _.findIndex(this['$options']['materials_groups'], al => 'g0' === al['key'])) && this['add_global_material'](a7),
      (ab = _.findIndex(this['item']['spec']['mat_groups'], 'default')) < 0) && this['mat_groups_hash']['g0'] && (this['mat_groups_hash']['g0']['default'] = 1),
      this['item']['spec']['module_types'] || (this['item']['spec']['module_types'] = {}),
      this['item']['spec']['module_types'] = fix_json_empty_object(this['item']['spec']['module_types']),
      this['item']['variables'] || (this['item']['variables'] = {
        'visible': 1,
        'main': {}
      }),
      this['item']['variables'] = fix_json_empty_object(this['item']['variables']),
      void 0 === this['item']['variables']['visible'] && (this['item']['variables']['visible'] = 1),
      'main'in this['item']['variables'] || (this['item']['variables']['main'] = {}),
      this['item']['variables']['main'] = fix_json_empty_object(this['item']['variables']['main']),
      'override'in this['item']['variables'] || (this['item']['variables']['override'] = {}),
      this['item']['variables']['override'] = fix_json_empty_object(this['item']['variables']['override']),
      'apply'in this['item']['variables'] || (this['item']['variables']['apply'] = {}),
      this['item']['variables']['apply'] = fix_json_empty_object(this['item']['variables']['apply']),
      'global'in this['item']['variables'] || (this['item']['variables']['global'] = []),
      this['item']['size'] && (a8 = {
        'parent_size': new THREE['Vector3'](),
        'computed': {},
        'variables': pp['variables']['current_hash'] || {},
        'props': {},
        'materials': {},
        'local_parent': {}
      },
      this['item']['size']['x'] = comp2(this['item']['size']['x'], a8),
      this['item']['size']['y'] = comp2(this['item']['size']['y'], a8),
      this['item']['size']['z'] = comp2(this['item']['size']['z'], a8));
      let ae = al => {
        module_utils['walk_params_tree'](al, am => {
          if ('module' === am['type']) {
            this['init_fill_sections'](al);
            var am = al['spec']?.['fill_content'] || {}, an;
            for (an of Object['values'](am))
            if (an['children']?.['length']) {
              for (var ao of an['children'])
              ae(ao);
            }
          }
        }
        );
      }
      ;
      ae(this['item']),
      view_mode && 'undefined' != typeof cabinet && !cabinet && ((cabinet = sc['add_object']('module', copy_object(this['item']), false))['position']['set'](100, 0, 100),
      cabinet['box']['update'](),
      this['$root']['$selected_object'] = cabinet,
      this['$root']['$vartree_object'] = q),
      this['reset_tree'](),
      this['tabs'][this['tab']] || (a7 = Object['keys'](this['tabs'])['find'](al => this['tabs'][al]) || 'common') !== this['tab'] && this['change_tab'](a7),
      a3['show'] = 1,
      view_mode && Vue['nextTick']( () => {
        var al, am, an, ao, ap;
        document['querySelectorAll']('#acc_modal')['forEach'](aq => {
          aq !== this['$refs']['acc_modal'] && aq['remove']();
        }
        ),
        document['querySelectorAll']('#acc_type_modal')['forEach'](aq => {
          aq !== this['$refs']['acc_type_modal'] && aq['remove']();
        }
        ),
        document['querySelectorAll']('#mat_group_modal')['forEach'](aq => {
          aq !== this['$refs']['mat_group_modal'] && aq['remove']();
        }
        ),
        document['querySelectorAll']('#mat_group_global_modal')['forEach'](aq => {
          aq !== this['$refs']['mat_group_global_modal'] && aq['remove']();
        }
        ),
        document['querySelectorAll']('#global_vars_modal')['forEach'](aq => {
          aq !== this['$refs']['global_vars_modal'] && aq['remove']();
        }
        );
      }
      ),
      this['$root']['$on']('embed_fixed_changed', al => {
        this['embed']['fixed'] = al;
      }
      ),
      icon_init();
    },
    'mounted': function() {
      window['configurator'] = this,
      view_mode && (pp['three']['mount'](),
      single_preview(true, cabinet),
      document['addEventListener']('mousedown', this['on_mousedown_handler']),
      q && q.length || this['init_variables'](),
      this['create_axes_widget']()),
      this['$refs']['mat_group_modal'] && (this['mat_group_modal_instance'] = new bootstrap['Modal'](this['$refs']['mat_group_modal'])),
      this['$refs']['mat_group_global_modal'] && (this['mat_group_global_modal_instance'] = new bootstrap['Modal'](this['$refs']['mat_group_global_modal'])),
      this['$refs']['global_vars_modal'] && (this['global_vars_modal_instance'] = new bootstrap['Modal'](this['$refs']['global_vars_modal'])),
      view_mode && this['check_json_editor']();
    },
    'beforeDestroy': function() {
      document['removeEventListener']('mousedown', this['on_mousedown_handler']);
    },
    'methods': {
      'hierarchy_selected': function(a3) {
        var a4, a3;
        this['$refs']['hierarchy_tree_ref'] && (a3 = this['$refs']['hierarchy_tree_ref']['api']['findIndexById'](a3),
        this['node_selected'](null, null, a3));
      },
      'var_selected': function(a3) {
        var a4, a5;
        this['tree_old_state'] = copy_object(q),
        this['$refs']['var_tree_ref'] && (a5 = this['$refs']['var_tree_ref']['api']['findIndexById'](a3),
        this['node_var_selected'](null, null, a5, a3));
      },
      'hierarchy_updated': function(a3) {
        var a4, a5, a3, a6, a7, a8, a8, a6, a7, a9, aa;
        'move' === a3['type'] && (a4 = this['$refs']['hierarchy_tree_ref']['api'],
        a5 = this['$root']['$selected_object'],
        {newIndex: a3, newRIndex: a6, newParent: a7} = a3,
        a8 = a4['findIndexById'](a7['id']),
        (a8 = this['calc_path_array'](a8))['push'](a6),
        a6 = this['selected_path_root_fill'],
        a7 = this['find_root_fill_content_module_path'](a7['id']),
        a9 = a6 || a7,
        aa = a6 === a7,
        module_utils['move_child_by_path'](this['item'], this['selected_path'], a8['join'](',')),
        a9 || module_utils['move_child_by_path'](a5, this['selected_path'], a8['join'](',')),
        a9 && (aa ? this['reload_module'](a7) : (a6 && this['reload_module'](a6),
        a7 && this['reload_module'](a7),
        a6 && a7 || a5['_rebuild']()),
        this['update_cabinet_size_box']()),
        a4['updateTree'](),
        this['node_selected'](null, null, a3));
      },
      'swap': function(a3, a4, a5, a6, a7) {
        var a4, a8, a9, a9, a4;
        return --a4,
        --a5,
        0 == a7['oldParent']['level'] ? (a4 = a3['splice'](a3.findIndex(aa => aa['id'] == a7['node']['id']), 1),
        0 == a7['newParent']['level'] ? a3['splice'](a5, 0, a4[0]) : (-1 == (a9 = (a8 = copy_object(a3))['find'](aa => aa['id'] == a7['newParent']['id'])['children']['indexOf'](this['nodes_variable'][a5]['id'])) ? a8['find'](aa => aa['id'] == a7['newParent']['id'])['children']['splice'](a7['newRIndex'], 0, a4[0]) : a8['find'](aa => aa['id'] == a7['newParent']['id'])['children']['splice'](a9, 0, a4[0]),
        q[0]['children'] = a8,
        a3)) : 1 == a7['oldParent']['level'] ? (a9 = a3['find'](aa => aa['id'] == a7['oldParent']['id'])['children']['splice'](a3['find'](aa => aa['id'] == a7['oldParent']['id'])['children']['findIndex'](aa => aa['id'] == a7['node']['id']), 1),
        0 == a7['newParent']['level'] ? a3['splice'](a7['newRIndex'], 0, a9[0]) : -1 == (a4 = a3['find'](aa => aa['id'] == a7['newParent']['id'])['children']['indexOf'](this['nodes_variable'][a5]['id'])) ? a3['find'](aa => aa['id'] == a7['newParent']['id'])['children']['splice'](a7['newRIndex'], 0, a9[0]) : a3['find'](aa => aa['id'] == a7['newParent']['id'])['children']['splice'](a4, 0, a9[0])) : void 0;
      },
      'var_updated': function(a3) {
        if ('move' === (a3 = copy_object(a3))['type']) {
          if (a3['newParent'] && a3['node']['type'] != a3['newParent']['type']) {
            let a8 = this['$refs']['var_tree_ref']['api'];
            var a4, a5 = a3['newIndex'], a6 = a3['node']['level'], a7 = this['swap'](q[0]['children'], a3['oldIndex'], a5, a6, a3);
            this['tree_old_state'] = copy_object(q),
            a8['updateTree'](),
            this['var_tree_save'](),
            this['node_var_selected'](null, null, a5);
          } else {
            this['nodes_variable'] = copy_object(this['tree_old_state']);
            let a9 = this['$refs']['var_tree_ref']['api'];
            a9['updateTree'](),
            this['emit_update'](),
            void (this['tree_old_state'] = copy_object(q));
          }
        }
      },
      'hierarchy_button_click': function(a3) {
        var a4, a5, a5, a4;
        a3 && a3['target'] && this['$refs']['hierarchy_tree_ref'] && (a5 = (a4 = this['$refs']['hierarchy_tree_ref']['api'])['getDataIdAttribute'](a3['target'])) && (a5 = a4['findIndexById'](a5),
        a4 = a4['getNode'](a5),
        view_mode) && this['context_menu'](a4, a3, a5);
      },
      'var_button_click': function(a3) {
        var a4, a5, a5, a4;
        a3 && a3['target'] && this['$refs']['var_tree_ref'] && (a5 = (a4 = this['$refs']['var_tree_ref']['api'])['getDataIdAttribute'](a3['target'])) && (a5 = a4['findIndexById'](a5),
        a4 = a4['getNode'](a5),
        view_mode) && this['context_menu_var'](a4, a3, a5);
      },
      'hierarchy_visible_click': function(a3) {
        var a4, a3, a3, a5, a6, a4, a3;
        a3 && a3['target'] && this['$refs']['hierarchy_tree_ref'] && (a3 = (a4 = this['$refs']['hierarchy_tree_ref']['api'])['getDataIdAttribute'](a3['target'])) && (a3 = a4['findIndexById'](a3),
        a5 = (this['calc_path_array'](a3) || [])['join'](',') || null) && '0' !== a5 && (a6 = this['$root']['$selected_object'],
        (a4 = a4['getNode'](a3))['visible'] = to_int(!a4['visible']),
        a3 = this['find_root_fill_content_module_path'](),
        module_utils['change_param_by_path'](this['item'], a5, 'visible', a4['visible']),
        a3 || module_utils['change_param_by_path'](a6, a5, 'visible', a4['visible'], true),
        a3) && (this['reload_module'](a3),
        this['update_cabinet_size_box']());
      },
      'var_visible_click': function(a3) {
        var a4, a3, a3, a5, a6, a4;
        a3 && a3['target'] && this['$refs']['var_tree_ref'] && (a3 = (a4 = this['$refs']['var_tree_ref']['api'])['getDataIdAttribute'](a3['target'])) && (a3 = a4['findIndexById'](a3),
        a5 = (this['calc_var_path_array'](a3) || [])['join'](',') || null) && '0' !== a5 && (a6 = this['$root']['$selected_object'],
        (a4 = a4['getNode'](a3))['visible'] = to_int(!a4['visible']),
        module_utils['change_param_by_path'](this['item'], a5, 'visible', a4['visible']),
        module_utils['change_param_by_path'](a6, a5, 'visible', a4['visible'], true));
      },
      'update_cabinet_size_box'() {
        var a3 = this['$root']['$selected_object']
        , a4 = a3['userData']['extend_size_info'];
        a4 && (a4['need_update'] = true),
        a3['_build_fast']();
      },
      'set_params_apply'() {
        let a3 = [];
        var a4 = this['$root']['$selected_object'], a4 = module_utils['get_child_by_path'](a4, this['convert_item_path_to_module'](this['selected_path'])), a4 = module_utils['find_params_sections'](a4), a5 = module_utils['get_child_params_by_path'](this['item'], this['selected_path']), a6 = new Set(), a7;
        if (a5) {
          var a8 = a5['spec']?.['params_apply'] ? copy_object(a5['spec']['params_apply']) : {}, a9, aa;
          for (a9 of Object['keys'](a8)) {
            a6['has'](a9) || (aa = a9.split(':', 2))[0] && aa[1] && (a6['add'](a9),
            a3.push({
              'key': a9,
              'params_key': aa[0],
              'type': aa[1],
              'paths': a8[a9]
            }));
          }
        }
        for (a7 of a4) {
          var ab = a7['params_key'] + ':' + a7['type'];
          a6['has'](ab) || (a6['add'](ab),
          a3.push({
            'key': ab,
            'params_key': a7['params_key'],
            'type': a7['type'],
            'paths': {}
          }));
        }
        a3 = _.filter(a3, ac => 'facade' === ac['type']),
        this['params_apply'] = a3;
      },
      'get_params_apply_value'(a3, a4) {
        return a3?.['paths']?.[a4];
      },
      'check_params_apply'(a3, a4) {
        var a3 = a3?.['paths']?.[a4];
        return null != a3;
      },
      'change_params_apply'(a3, a4, a5) {
        a3['paths'][a4] = a5,
        a3['paths'] = {
          ...a3['paths']
        };
        let a6 = this['selected_path']
        , a7 = this['current_params']?.['spec']?.['params_apply']
        , a8 = (a7 || (a7 = {},
        this['current_params']['spec']['params_apply'] = a7),
        a7[a3['key']] || (a7[a3['key']] = {}),
        -1 < a4['indexOf']('can_change') && (a5 = parseInt(a5)),
        -1 < a4['indexOf']('materials.gen') && (a5 = parseInt(a5)),
        a7[a3['key']][a4] = a5,
        this['current_params']['spec']['params_apply'] = {
          ...a7
        },
        this['find_root_fill_content_module_path']());
        clearTimeout(this['debounce']),
        this['debounce'] = setTimeout( () => {
          module_utils['change_param_by_path'](this['item'], a6, 'spec.params_apply', copy_object(a7)),
          this['reload_module'](a8 || a6),
          this['update_cabinet_size_box']();
        }
        , this['delay']);
      },
      'reset_params_apply'(a3, a4) {
        delete a3['paths'][a4],
        a3['paths'] = {
          ...a3['paths']
        };
        let a5 = this['selected_path']
        , a6 = this['current_params']?.['spec']?.['params_apply']
        , a7 = (a6 || (a6 = {},
        this['current_params']['spec']['params_apply'] = a6),
        a6[a3['key']] || (a6[a3['key']] = {}),
        delete a6[a3['key']][a4],
        this['current_params']['spec']['params_apply'] = {
          ...a6
        },
        this['find_root_fill_content_module_path']());
        clearTimeout(this['debounce']),
        this['debounce'] = setTimeout( () => {
          module_utils['change_param_by_path'](this['item'], a5, 'spec.params_apply', copy_object(a6)),
          this['reload_module'](a7 || a5),
          this['update_cabinet_size_box']();
        }
        , this['delay']);
      },
      'node_selected'(a3, a4, a5) {
        if (!Number['isInteger'](a5) || a5 < 0)
        this['clear_selected']();
        else {
          var a6 = this['selected_path']
          , a7 = this['calc_path_array'](a5)
          , a7 = (this['selected_path'] = a7['join'](','),
          a6 && a6 !== this['selected_path'] && this['hide_helpers'](a6),
          this['$refs']['hierarchy_tree_ref']['api']['setSelected'](a5),
          this['selected_path_root_fill'] = this['find_root_fill_content_module_path'](),
          this['$root']['$selected_object'])
          , a5 = (this['calc_path_array'](a5) || [])['join'](',') || null;
          if ('0' === a5)
          this['clear_selected'](a6);
          else {
            var a7 = module_utils['get_child_by_path'](a7, this['convert_item_path_to_module'](a5))
            , a7 = (a7 && a7['_show_helpers'] && this['show_helpers'](a5),
            module_utils['get_child_params_by_path'](this['item'], a5));
            if (a7) {
              let a8 = a7 ? copy_object(a7) : {};
              void 0 !== a8['children'] && delete a8['children'],
              'temp_index'in a8 || (a8 = merge(copy_object(pp['engine']['item_def_params'][a8['type']]), a8),
              this['butts'] = this['get_butts_info'](a8),
              a8['variables'] || (a8['variables'] = {
                'main': {}
              }),
              a8['variables']['main'] || (a8['variables']['main'] = {}),
              'module' === a8['type'] && ('override'in a8['variables'] || (a8['variables']['override'] = {}),
              'apply'in a8['variables'] || (a8['variables']['apply'] = {}),
              a8['spec']['fill_content'] || (a8['spec']['fill_content'] = {}),
              a8['spec']['fill_content'] = fix_json_empty_object(a8['spec']['fill_content']),
              a8['spec']['params_apply'] || (a8['spec']['params_apply'] = {}),
              a8['spec']['params_apply'] = fix_json_empty_object(a8['spec']['params_apply']),
              this['set_params_apply']()),
              'fill_section' !== a8['type'] && 'section' !== a8['type'] || (a8['spec'] || (a8['spec'] = {}),
              a8['spec'] = fix_json_empty_object(a8['spec'])),
              view_mode ? Vue['set'](this, 'current_params', a8) : (Vue['set'](this['$root']['$refs']['module_menu_v2'], 'configurator_params', {
                'current_params': a8,
                'variables': this['item']['variables'],
                'computed': this['computed']
              }),
              Vue['set'](this, 'current_params', a8),
              Vue['nextTick']( () => {
                this['$root']['$refs']['module_menu_v2']['set_configurator_v2_params_component']();
              }
              )));
            } else
            this['clear_selected'](a6);
          }
        }
      },
      'node_var_selected'(a3, a4, a5, a6) {
        if (!Number['isInteger'](a5) || a5 < 0)
        this['clear_var_selected']();
        else {
          var a7;
          let a9 = this['$refs']['var_tree_ref']['api']['findNodeById'](a6);
          var a6 = this['selected_path']
          , a8 = this['calc_var_path_array'](a5);
          this['selected_path'] = a8['join'](','),
          a6 && a6 !== this['selected_path'] && this['hide_helpers'](a6),
          this['$refs']['var_tree_ref']['api']['setSelected'](a5);
          let aa = {};
          if (null === a9)
          this['clear_var_selected']();
          else {
            if ('global_variable' == a9['type']) {
              var a8 = this['$options']['global_vars_hash'][a9['key']];
              if (!a8)
              return void this['clear_var_selected']();
              var a6 = _['find'](this['item']['variables']['global'], ac => ac['key'] === a9['key']);
              if (!a6)
              return void this['clear_var_selected']();
              var a5 = {
                'name': a8['name'],
                'key': a9['key'],
                'is_global': 1,
                'v_type': a8['v_type'] || a8['type'],
                'params': a8['params'] ? copy_object(a8['params']) : {}
              };
              void 0 !== a6['local'] && (a5['local'] = a6['local']),
              void 0 !== a6['fixed'] && (a5['fixed'] = a6['fixed']),
              a5['disabled_values'] = a6['disabled_values'] ? copy_object(a6['disabled_values']) : [],
              aa = Object['assign'](copy_object(a9), a5);
            }
            let ab;
            ab = 0 !== Object['keys'](aa)['length'] ? aa : a9 && copy_object(a9),
            is_internal_var(ab['key']) && (ab['is_internal'] = 1),
            Vue['set'](this, 'variable_params', ab);
          }
        }
      },
      'get_var_disabled_value'(a3, a4) {
        var a5;
        return 0 <= _.findIndex(a3['disabled_values'], a6 => '' + a6 == '' + a4) ? 0 : 1;
      },
      'clear_var_selected'(a3) {
        this['selected_path'] = '',
        this['selected_path_root_fill'] = '',
        view_mode ? Vue['set'](this, 'variable_params', '') : (Vue['set'](this['$root']['$refs']['module_menu_v2'], 'configurator_params', {
          'variable_params': '',
          'variables': {},
          'computed': {}
        }),
        Vue['set'](this, 'variable_params', ''),
        Vue['nextTick']( () => {
          this['$root']['$refs']['module_menu_v2']['close_panel']();
        }
        ));
      },
      'clear_selected'(a3) {
        var a3 = a3 || this['selected_path'];
        a3 && this['hide_helpers'](a3),
        this['selected_path'] = '',
        this['selected_path_root_fill'] = '',
        view_mode ? Vue['set'](this, 'current_params', '') : (Vue['set'](this['$root']['$refs']['module_menu_v2'], 'configurator_params', {
          'current_params': '',
          'variables': {},
          'computed': {}
        }),
        Vue['set'](this, 'current_params', ''),
        Vue['nextTick']( () => {
          this['$root']['$refs']['module_menu_v2']['close_panel']();
        }
        ));
      },
      'hide_helpers'(a3) {
        var a4 = this['$root']['$selected_object'], a5 = module_utils['get_child_by_path'](a4, this['convert_item_path_to_module'](a3)), a6;
        if (a5 && a5['_hide_helpers']) {
          if (a5['_hide_helpers'](),
          'edges' == global_options['mode'] && a5['_hide_helpers_edges'](),
          a5 instanceof CabinetFurniture && 0 < a5['userData']['children']['length'])
          for (let a8 = 0; a8 < a5['userData']['children']['length']; a8++) {
            var a7 = a5['userData']['children'][a8];
            a7 instanceof CabinetHole && (a7['userData']['arrow']['visible'] = false,
            a7['_hide_helpers']());
          }
          a5 instanceof CabinetPath && a5['userData']['parent'] && a5['userData']['parent']['_hide_helpers']();
        }
        pp['helpers']['axes_helper']['visible'] = false;
      },
      'show_helpers'(a3) {
        var a4 = this['$root']['$selected_object'], a5 = module_utils['get_child_by_path'](a4, this['convert_item_path_to_module'](a3)), a6;
        if (a5 && a5['_show_helpers']) {
          if (a5['_show_helpers'](),
          'edges' == global_options['mode'] && a5['_show_helpers_edges'](),
          pp['helpers']['axes_helper']['position']['copy'](a5['getWorldPosition'](new THREE['Vector3']())),
          pp['helpers']['axes_helper']['visible'] = true,
          a5 instanceof CabinetFurniture && 0 < a5['userData']['children']['length'])
          for (let a8 = 0; a8 < a5['userData']['children']['length']; a8++) {
            var a7 = a5['userData']['children'][a8];
            a7 instanceof CabinetHole && (a7['userData']['arrow']['visible'] = true,
            a7['_show_helpers']());
          }
          a5 instanceof CabinetPath && a5['userData']['parent'] && a5['userData']['parent']['_show_helpers']();
        }
      },
      'on_mousedown_handler'(a3) {
        if (this['node_context_visible']) {
          a3['preventDefault'](),
          a3['stopPropagation']();
          var a4 = this['$refs']['context_menu'];
          if (a4 && a3['target'] !== a4 && !a4['contains'](a3['target']))
          return this['node_context_visible'] = false;
        }
        if (this['node_var_context_visible']) {
          a3['preventDefault'](),
          a3['stopPropagation']();
          var a4 = this['$refs']['context_menu_var'];
          if (a4 && a3['target'] !== a4 && !a4['contains'](a3['target']))
          return this['node_var_context_visible'] = false;
        }
      },
      'context_menu_handler'(a3) {
        var a4, a5, a5, a4;
        a3['preventDefault'](),
        view_mode && (a5 = (a4 = this['$refs']['hierarchy_tree_ref']['api'])['getDataIdAttribute'](a3['target'])) && (a5 = a4['findIndexById'](a5),
        a4 = a4['getNode'](a5),
        this['context_menu'](a4, a3, a5));
      },
      'context_menu': async function(a3, a4, a5) {
        a4['preventDefault'](),
        this['node_context_visible'] = true;
        var a6 = await this['check_clipboard']();
        this['node_is_root'] = 0 == a3['level'],
        this['node_can_add'] = this['node_is_root'] || 'module' !== a3['type'] && C[a3['type']],
        this['node_selected'](a3, a4, a5),
        this['$refs']['context_menu']['style']['left'] = a4['clientX'] + 'px',
        this['$refs']['context_menu']['style']['top'] = a4['clientY'] - 10 + 'px';
      },
      'context_menu_var_handler'(a3) {
        var a4, a5, a5, a4;
        a3['preventDefault'](),
        view_mode && (a5 = (a4 = this['$refs']['var_tree_ref']['api'])['getDataIdAttribute'](a3['target'])) && (a5 = a4['findIndexById'](a5),
        a4 = a4['getNode'](a5),
        this['context_menu_var'](a4, a3, a5));
      },
      'context_menu_var': async function(a3, a4, a5) {
        a4['preventDefault'](),
        this['node_var_context_visible'] = true;
        var a6 = await this['check_clipboard']('clipboardVar');
        this['node_var_is_root'] = 0 == a3['level'],
        this['node_var_can_add'] = this['node_var_is_root'] || E[a3['type']],
        this['node_var_selected'](a3, a4, a5),
        this['$refs']['context_menu_var']['style']['left'] = a4['clientX'] + 'px',
        this['$refs']['context_menu_var']['style']['top'] = a4['clientY'] - 10 + 'px';
      },
      'get_type_href': function(a3) {
        var a4 = '', a5, a6, a6;
        return a3 ? 'module' === a3['type'] ? (a5 = a3['spec']?.['id'],
        !(a6 = a3['spec']?.['element_type']) || is_empty_id(a5) ? '' : glob['base_url'] + ('/catalog/item/catalog_' + a6 + '/') + a5) : 'furniture' !== a3['type'] || (a6 = a3['spec']?.['id'],
        is_empty_id(a6)) ? '' : glob['base_url'] + '/catalog/item/furniture/' + a6 : '';
      },
      'get_type_label': function(a3) {
        if (!a3 || !a3['type'])
        return '';
        let a4 = D[a3['type']] || '';
        if ('module' === a3['type']) {
          var a5 = a3['spec']['id'];
          let a8 = a3['spec']['element_type'];
          var a6 = _['find'](pp['libs']['catalogs_info']['keys'], aa => aa['key'] === a8);
          let a9 = '';
          var a7 = pp['libs']['catalogs'][a8]?.['items'][a5], a7;
          if (a7) {
            let aa = a7['params'] || {};
            (a9 = a7['name'] || aa['name']) || (a7 = aa['spec']?.['variants']?.[aa['spec']?.['selected_variant'] || 0],
            a9 = a7?.['name'] || '');
          }
          var a7 = [a6 ? a6['name'] : '', a5 ? 'id:\x20' + a5 : '', a9 ? '\x22' + a9 + '\x22' : '']['filter'](Boolean)['join'](',\x20');
          a7 && (a4 += '\x20(' + a7 + ')');
        }
        if ('furniture' === a3['type']) {
          var a6 = a3['spec']['id'];
          let ab = '';
          var a5 = pp['libs']['furniture']?.['items'][a6];
          if (a5) {
            let ac = a5['params'] || {};
            ab = a5['name'] || ac['name'];
          }
          var a7 = [a6 ? 'id:\x20' + a6 : '', ab ? '\x22' + ab + '\x22' : '']['filter'](Boolean)['join'](',\x20');
          a7 && (a4 += '\x20(' + a7 + ')');
        }
        return a4;
      },
      'change_name': function(a3) {
        if (this['$refs']['hierarchy_tree_ref']) {
          var a4 = this['$refs']['hierarchy_tree_ref']['api'];
          let a7 = this['$root']['$selected_object'];
          var a5 = a4['getSelectedId']()
          , a5 = a4['findIndexById'](a5)
          , a6 = a4['getNode'](a5)
          , a3 = a3['target']['value'];
          let a8 = this['selected_path']
          , a9 = (this['current_params'] && (this['current_params']['name'] = a3),
          this['find_root_fill_content_module_path']());
          a4['updateNode'](a5, {
            'title': a3 || '(' + a6['type'] + ')'
          }),
          module_utils['change_param_by_path'](this['item'], a8, 'name', a3),
          a9 || module_utils['change_param_by_path'](a7, a8, 'name', a3, false),
          clearTimeout(this['debounce']),
          this['debounce'] = setTimeout( () => {
            a9 ? (this['reload_module'](a9),
            this['update_cabinet_size_box']()) : module_utils['rebuild_child_by_path'](a7, a8);
          }
          , this['delay']),
          this['emit_update']();
        }
      },
      'change_var_param': function(a3, a4, a5, a6) {
        if (this['$refs']['var_tree_ref']) {
          var a7 = this['$root']['$selected_object']
          , a8 = copy_object(q)
          , a9 = this['$refs']['var_tree_ref']['api'];
          let ad = a9['getSelectedId']()
          , ae = a9['findIndexById'](ad);
          var aa = a9['getNode'](ae);
          let af = ''
          , ag = '';
          switch (a6) {
            case 'checkbox':
            af = to_int(a5['target']['checked']);
            break;
            case 'disabled_values':
            af = to_int(a5['target']['checked']);
            break;
            case 'input':
            af = a5['target']['value'];
            break;
            case 'number':
            af = parseFloat(a5['target']['value']);
            break;
            case 'name':
            af = this['variable_params']['name'],
            ag = this['variable_params']['key'];
            break;
            default:
            af = a5['target']['value'],
            ag = a5['target']['value'];
          }
          var ab = a9['findParentByNodeId'](ad);
          let ah = {};
          if (0 == ab['parent']['level'])
          ah = a8[0]['children']['find'](ai => ai['id'] == ad);
          else {
            let ai = ab['parent']['id'];
            var ab = a8[0]['children']['find'](aj => aj['id'] == ai);
            ah = ab['children']['find'](aj => aj['id'] == ad);
          }
          if ('global_variable' == ah['type']) {
            if ('disabled_values' === a6) {
              ah['disabled_values'] || (ah['disabled_values'] = []);
              let aj = _.findIndex(ah['disabled_values'], ak => '' + ak == '' + a3);
              af ? 0 <= aj && ah['disabled_values']['splice'](aj, 1) : aj < 0 && ah['disabled_values']['push']('' + a3),
              ah['disabled_values']?.['length'] || delete ah['disabled_values'],
              a9['updateTree'](),
              a9['updateNode'](aj, {
                'disabled_values': ah['disabled_values'] && copy_object(ah['disabled_values'])
              });
            } else
            ah[a3] = af,
            a9['updateTree'](),
            a9['updateNode'](ae, {
              [a3]: af
            });
            this['emit_update']();
          }
          if ('name' == a6 && '' != ag && (ah['name'] = af,
          ah['key'] = ag,
          a9['updateTree'](),
          a9['updateNode'](ae, {
            'title': af || '(' + aa['type'] + ')'
          }),
          this['emit_update']()),
          'disabled_values' !== a6) {
            if (0 <= a3['indexOf']('.')) {
              utils['nested_object']['set'](ah, a3, af);
              let ak = a3.split('.', 2)[0];
              var ab = ah[ak] && copy_object(ah[ak]);
              a9['updateNode'](ae, {
                [ak]: ab
              });
            } else
            ah[a3] = af,
            a9['updateNode'](ae, {
              [a3]: af
            });
          }
          if ('variable' == ah['type']) {
            var ac = ah;
            if (1 == ac['variants']) {
              for (let al = 0; al < this['item']['spec']['variants']['length']; al++)
              this['item']['spec']['variants'][al]['variables'] || (this['item']['spec']['variants'][al]['variables'] = {}),
              this['item']['spec']['variants'][al]['variables'][ac['key']] || (this['item']['spec']['variants'][al]['variables'][ac['key']] = {
                'value': ac['value']
              },
              a7['userData']['params']['spec']['variants'][al]['variables'] || (a7['userData']['params']['spec']['variants'][al]['variables'] = {}),
              a7['userData']['params']['spec']['variants'][al]['variables'][ac['key']] = {
                'value': ac['value']
              });
            } else {
              for (let am = 0; am < this['item']['spec']['variants']['length']; am++)
              this['item']['spec']['variants'][am]['variables'] && this['item']['spec']['variants'][am]['variables'][ac['key']] && (delete this['item']['spec']['variants'][am]['variables'][ac['key']],
              a7['userData']['params']['spec']['variants'][am]['variables']) && delete a7['userData']['params']['spec']['variants'][am]['variables'][ac['key']];
            }
          }
          Vue['set'](this, 'variable_params.key', ah['key']),
          q = a8,
          this['$root']['$vartree_object'] = q,
          this['var_tree_save'](),
          this['sync_vars_to_cabinet']();
        }
      },
      'find_root_fill_content_module_path'(a3) {
        var a4 = this['$refs']['hierarchy_tree_ref']['api'];
        if (!a4)
        return null;
        var a3 = a3 || a4['getSelectedId'](), a3 = a4['findIndexById'](a3), a5, a3;
        if (null === a3)
        return null;
        let a6 = null
        , a7 = a3
        , a8 = a4['calcRelativeIndex'](a7);
        for ('fake_section' === a4['getNode'](a7)['type'] && (a6 = a7); a8['parent']; )
        'fake_section' === a8['parent']['type'] && (a6 = a8['parentIndex']),
        a7 = a8['parentIndex'],
        a8 = a4['calcRelativeIndex'](a7);
        return !a6 || (a3 = this['calc_path_array'](a6))['length'] < 2 ? null : (a3['pop'](),
        a3['join'](','));
      },
      'change_param': function(a3, a4, a5, a6, a7=false) {
        if (this['$refs']['hierarchy_tree_ref']) {
          let af = this['$root']['$selected_object']
          , ag = this['selected_path']
          , ah = this['find_root_fill_content_module_path']()
          , ai = '';
          switch (a6) {
            case 'checkbox':
            ai = to_int(a5['target']['checked']);
            break;
            case 'picker':
            ai = a5;
            break;
            case 'ext':
            ai = a5;
            break;
            case 'switch':
            ai = a5;
            break;
            case 'input_mat':
            ai = a5;
            break;
            case 'input_cond':
            ai = a5;
            break;
            case 'number':
            ai = parseFloat(a5['target']['value']);
            break;
            default:
            ai = a5['target']['value'];
          }
          var a8 = a3 ? a3.split('.') : [], a9, a9;
          let aj = this['current_params'];
          'facade' == this['current_params']['type'] && 'spec' === a3 && 'id' === a4 && (a9 = this['current_params']['spec']['radius'] ? 'radius' : 'full',
          module_utils['change_param_by_path'](this['item'], ag, (a3 ? a3 + '.' : '') + 'type', a9, false),
          ah || module_utils['change_param_by_path'](af, ag, (a3 ? a3 + '.' : '') + 'type', a9, false),
          this['current_params']['spec']['type'] = a9,
          module_utils['change_param_by_path'](this['item'], ag, (a3 ? a3 + '.' : '') + 'materials.gen', 0, false),
          ah || module_utils['change_param_by_path'](af, ag, (a3 ? a3 + '.' : '') + 'materials.gen', 0, false),
          this['current_params']['spec']['materials']['gen'] = 0,
          this['current_params'] = {
            ...this['current_params']
          }),
          'toggle' !== a3 || aj['toggle'] || (aj['toggle'] = {
            'enabled': 1,
            'value': 0,
            'key': '',
            'group': '',
            'name': '',
            'order': 0
          });
          for (let al = 0; al < a8.length; al++)
          aj = aj[a8[al]];
          'tabletop' == this['current_params']['type'] && 'material.id' === a4 && (a9 = ai === pp['const']['not_set_value'] ? pp['const']['not_set_value'] : 0,
          module_utils['change_param_by_path'](this['item'], ag, (a3 ? a3 + '.' : '') + 'material.variant_id', a9, false),
          ah || module_utils['change_param_by_path'](af, ag, (a3 ? a3 + '.' : '') + 'material.variant_id', 0, false),
          Vue['set'](aj['material'], 'variant_id', a9));
          var aa = a4.split('.');
          if (1 < aa.length) {
            for (let am = 0; am < aa.length - 1; am++)
            aj = aj[aa[am]];
          }
          var a9 = aa[aa.length - 1], a9, ab, ab, ac, a9, ab, ab, ad, a9, ab, ab, ae, a9, ab;
          'input_mat' === a6 || 'input_cond' === a6 ? Vue['set'](aj, a9, ai && copy_object(ai)) : Vue['set'](aj, a9, ai);
          let ak = ai;
          if ('toggle' === a3 && (ak = copy_object(this['current_params']['toggle']),
          a3 = '',
          a4 = 'toggle'),
          a3 || 'active' !== a4 || (ab = (a9 = this['$refs']['hierarchy_tree_ref']['api'])['getSelectedId'](),
          ab = a9['findIndexById'](ab),
          a9['getNode'](ab)['active'] = ak),
          'input_cond' === a6 && (ab = (a9 = this['$refs']['hierarchy_tree_ref']['api'])['getSelectedId'](),
          ab = a9['findIndexById'](ab),
          a9['getNode'](ab)['has_condition'] = ai?.[0]?.[0] ? 1 : 0),
          a3 || 'comments' !== a4 || (ab = (a9 = this['$refs']['hierarchy_tree_ref']['api'])['getSelectedId'](),
          ab = a9['findIndexById'](ab),
          a9['getNode'](ab)['has_comments'] = is_empty_id(ak) ? 0 : 1),
          a3 || 'accessories' !== a4 || (module_utils['change_param_by_path'](this['item'], ag, 'accessories', ak),
          ah) || module_utils['change_param_by_path'](af, ag, 'accessories', ak, false),
          'facade' === this['current_params']['type'] && 'spec' === a3 && 'radius' === a4 && (a9 = this['get_type_facade']('types'))?.['length'] && void 0 !== this['current_params']['spec']['type'] && (ab = a9[0]['comp_id'],
          module_utils['change_param_by_path'](this['item'], ag, 'spec.type', ab, false),
          ah || module_utils['change_param_by_path'](af, ag, 'spec.type', ab, false)),
          module_utils['change_param_by_path'](this['item'], ag, (a3 ? a3 + '.' : '') + a4, ak, false),
          ah || module_utils['change_param_by_path'](af, ag, (a3 ? a3 + '.' : '') + a4, ak, false),
          ak === pp['const']['not_set_value'] && module_utils['init_empty_values_recursive_by_path'](af, ag),
          a4['endsWith']('_keys') && this['change_keys_controller'](a3, a4, ak),
          'wall' == this['current_params']['type'] || 'tabletop' == this['current_params']['type'] || 'cut' == this['current_params']['type']) {
            if ('orientation' == a4)
            switch (ak) {
              case 'f':
              this['current_params']['size']['x'] = 's:x',
              this['current_params']['size']['y'] = 's:y',
              module_utils['change_param_by_path'](this['item'], ag, 'size.x', 's:x', false),
              module_utils['change_param_by_path'](this['item'], ag, 'size.y', 's:y', false),
              ah || module_utils['change_param_by_path'](af, ag, 'size.x', 's:x', false),
              ah || module_utils['change_param_by_path'](af, ag, 'size.y', 's:y', false);
              break;
              case 'v':
              this['current_params']['size']['x'] = 's:x',
              this['current_params']['size']['y'] = 's:y',
              this['current_params']['size']['z'] = 's:z',
              module_utils['change_param_by_path'](this['item'], ag, 'size.x', 's:x', false),
              module_utils['change_param_by_path'](this['item'], ag, 'size.y', 's:y', false),
              module_utils['change_param_by_path'](this['item'], ag, 'size.z', 's:z', false),
              ah || module_utils['change_param_by_path'](af, ag, 'size.x', 's:x', false),
              ah || module_utils['change_param_by_path'](af, ag, 'size.y', 's:y', false),
              ah || module_utils['change_param_by_path'](af, ag, 'size.z', 's:z', false);
              break;
              case 'h':
              this['current_params']['size']['x'] = 's:x',
              this['current_params']['size']['y'] = 's:z',
              module_utils['change_param_by_path'](this['item'], ag, 'size.x', 's:x', false),
              module_utils['change_param_by_path'](this['item'], ag, 'size.y', 's:y', false),
              ah || module_utils['change_param_by_path'](af, ag, 'size.x', 's:x', false),
              ah || module_utils['change_param_by_path'](af, ag, 'size.y', 's:y', false);
              break;
            }
            if ('type' == a4) {
              let an = copy_object(this['$options']['wall_types'][ak])['params']
              , ao = {};
              Object['keys'](an)['forEach'](function(ap) {
                ao[ap] = an[ap]['default'];
              }),
              Vue['set'](this['current_params']['spec'], 'type_params', copy_object(ao)),
              module_utils['change_param_by_path'](this['item'], ag, (a3 ? a3 + '.' : '') + 'type_params', ao, false),
              ah || module_utils['change_param_by_path'](af, ag, (a3 ? a3 + '.' : '') + 'type_params', ao, false);
            }
          }
          if ('path' == this['current_params']['type'] && 'type' == a4) {
            type_params = copy_object(this['$options']['path_types'][ak])['params'];
            let ap = {};
            Object['keys'](type_params)['forEach'](function(aq) {
              ap[aq] = type_params[aq]['default'];
            }),
            Vue['set'](this['current_params']['spec'], 'type_params', copy_object(ap)),
            module_utils['change_param_by_path'](this['item'], ag, (a3 ? a3 + '.' : '') + 'type_params', ap, false),
            ah || module_utils['change_param_by_path'](af, ag, (a3 ? a3 + '.' : '') + 'type_params', ap, false);
          }
          clearTimeout(this['debounce']),
          this['debounce'] = setTimeout( () => {
            if (ah)
            this['reload_module'](ah),
            this['update_cabinet_size_box']();
            else {
              if ('not_load_default' === a4)
              this['reload_module'](ag),
              this['update_cabinet_size_box']();
              else {
                let aq = ag || '';
                'input_cond' !== a6 && 'active' !== a4 && 'toggle' !== a4 && 'is_target' !== a4 || (aq = aq.split(',')['slice'](0, -1)['join'](','),
                (aq = 'is_target' === a4 ? '0' : aq) && '0' !== aq) ? (module_utils['rebuild_child_by_path'](af, aq),
                this['hide_helpers'](this['selected_path']),
                this['show_helpers'](this['selected_path']),
                this['is_show_butts'] && show_butts(this['is_show_butts']),
                'type' != a4 || 'wall' != this['current_params']['type'] && 'tabletop' != this['current_params']['type'] || (this['butts'] = this['get_butts_info'](this['current_params']))) : af['_rebuild']();
              }
            }
          }
          , this['delay']),
          this['emit_update']();
        }
      },
      'reload_module'(a3) {
        var a4 = module_utils['get_child_params_by_path'](this['item'], a3), a5, a5, a3;
        a4 && (a5 = this['$root']['$selected_object'],
        a5 = module_utils['get_child_by_path'](a5, a3)) && (a3 = {
          'name': a4['name'],
          'spec': {
            'id': a4['spec']?.['id'] ? a4['spec']['id'] : void 0,
            'fill_content': a4['spec']?.['fill_content'] ? copy_object(a4['spec']?.['fill_content']) : {},
            'params_apply': a4['spec']?.['params_apply'] ? copy_object(a4['spec']?.['params_apply']) : {}
          }
        },
        a5['reload_module'](a3, true));
      },
      'scroll_to_block': async function(a3, a4) {
        var a5, a3, a5, a3, a6, a3, a6, a5, a7, a4;
        a3 && a3['target'] && this['$refs']['hierarchy_tree_ref'] && (a3 = (a5 = this['$refs']['hierarchy_tree_ref']['api'])['getDataIdAttribute'](a3['target'])) && (a5 = a5['findIndexById'](a3),
        a3 = this['selected_path'],
        a6 = this['calc_path_array'](a5)['join'](','),
        a3 && a3 === a6 || this['node_selected'](null, null, a5),
        await Vue['nextTick'](),
        a3 = document['querySelector']('.current_params.configurator-params'),
        a6 = document['querySelector']('.current_params.configurator-params\x20[data-key=\x27' + a4 + '\x27]'),
        a3) && a6 && (a5 = a3['getBoundingClientRect'](),
        a4 = a6['getBoundingClientRect']()['y'] - a5['y'] + a3['scrollTop'],
        a3['scrollTo']({
          'top': a4
        }));
      },
      'get_item_picker_categories': function(a3, a4) {
        var a4, a4, a5;
        return 'facade' === this['current_params']['type'] && 'materials.gen' == a4 ? (a4 = this['current_params']['spec']['id'],
        (a4 = pp['libs']['facades']['items'][a4]) && (a5 = a4['materials']) || false) : [];
      },
      'get_current_param': function(a3, a4) {
        if ('type' == a4) {
          var a5 = this['current_params'][a3][a4], a6 = this['current_params'][a3]['id'], a6 = pp['libs']['facades']['items'][a6], a7, a7;
          if (!a6)
          return a5;
          let ab = null;
          return (ab = isNaN(parseInt(a5)) ? void 0 !== a6['compatibility_types'][a5] ? {
            'comp_id': a7 = a6['compatibility_types'][a5],
            'type_name': a6['types'][a7]['name']
          } : (a7 = Object['keys'](a6['types'])[0],
          a6['types'][a7]) : {
            'comp_id': a5,
            'type_name': a6['types'][a5]['name']
          })['comp_id'];
        }
        {
          var a8 = a3 ? a3.split('.') : [];
          let ac = this['current_params'];
          for (let ad = 0; ac && ad < a8.length; ad++)
          ac = ac[a8[ad]];
          var a9 = a4.split('.'), aa;
          if (1 < a9.length) {
            for (let ae = 0; ac && ae < a9.length - 1; ae++)
            ac = ac[a9[ae]];
          }
          return ac ? ac[a9[a9.length - 1]] : void 0;
        }
      },
      'change_param_wall_type': function(a3, a4, a5=false) {
        a5 && (a4 = a4['target']['value']);
        let a6 = this['$root']['$selected_object']
        , a7 = this['selected_path'];
        module_utils['change_param_by_path'](this['item'], a7, 'spec.type_params.' + a3, a4),
        module_utils['change_param_by_path'](a6, a7, 'spec.type_params.' + a3, a4, false),
        this['current_params']['spec']['type_params'][a3] = a4,
        clearTimeout(this['debounce']),
        this['debounce'] = setTimeout( () => {
          module_utils['rebuild_child_by_path'](a6, a7),
          this['butts'] = this['get_butts_info'](this['current_params']),
          this['hide_helpers'](a7),
          this['show_helpers'](a7);
        }
        , this['delay']),
        this['emit_update']();
      },
      'change_param_wall_type_array': function(a3, a4, a5, a6) {
        let a7 = this['$root']['$selected_object']
        , a8 = this['selected_path'];
        var a9;
        let aa;
        switch (this['current_params']['spec']['type_params'][a3][a4][a5]['type']) {
          case 'checkbox':
          aa = to_int(a6['target']['checked']);
          break;
          case 'picker':
          aa = a6;
          break;
          case 'ext':
          aa = a6;
          break;
          case 'switch':
          aa = a6;
          break;
          case 'input_mat':
          aa = a6;
          break;
          case 'input_cond':
          aa = a6;
          break;
          case 'number':
          aa = parseFloat(a6['target']['value']);
          break;
          case 'input_ext':
          aa = a6;
          break;
          default:
          aa = a6['target']['value'];
        }
        this['current_params']['spec']['type_params'][a3][a4][a5]['value'] = aa;
        var a4 = copy_object(this['current_params']['spec']['type_params'][a3]);
        module_utils['change_param_by_path'](this['item'], a8, 'spec.type_params.' + a3, copy_object(a4)),
        module_utils['change_param_by_path'](a7, a8, 'spec.type_params.' + a3, a4, false),
        clearTimeout(this['debounce']),
        this['debounce'] = setTimeout( () => {
          module_utils['rebuild_child_by_path'](a7, a8),
          this['butts'] = this['get_butts_info'](this['current_params']);
        }
        , this['delay']),
        this['emit_update']();
      },
      'add_param_wall_type_array': function(a3) {
        var a4 = this['$root']['$selected_object']
        , a5 = this['selected_path'];
        Array.isArray(this['current_params']['spec']['type_params'][a3]) || this['$set'](this['current_params']['spec']['type_params'], a3, []);
        let a6 = copy_object(this['$options']['wall_types'][this['current_params']['spec']['type']]['params'][a3]['value']);
        Object['keys'](a6)['forEach'](a8 => {
          var a8 = a6[a8];
          a8['value'] = a8['default'];
        }
        ),
        this['current_params']['spec']['type_params'][a3]['push'](a6);
        var a7 = copy_object(this['current_params']['spec']['type_params'][a3]);
        module_utils['change_param_by_path'](this['item'], a5, 'spec.type_params.' + a3, copy_object(a7)),
        module_utils['change_param_by_path'](a4, a5, 'spec.type_params.' + a3, a7, false),
        module_utils['rebuild_child_by_path'](a4, a5),
        this['butts'] = this['get_butts_info'](this['current_params']),
        this['emit_update']();
      },
      'remove_param_wall_type_array': function(a3, a4) {
        var a5 = this['$root']['$selected_object']
        , a6 = this['selected_path']
        , a4 = (this['current_params']['spec']['type_params'][a3]['splice'](a4, 1),
        copy_object(this['current_params']['spec']['type_params'][a3]));
        module_utils['change_param_by_path'](this['item'], a6, 'spec.type_params.' + a3, copy_object(a4)),
        module_utils['change_param_by_path'](a5, a6, 'spec.type_params.' + a3, a4, false),
        module_utils['rebuild_child_by_path'](a5, a6),
        this['butts'] = this['get_butts_info'](this['current_params']),
        this['emit_update']();
      },
      'show_mat_group_modal': function(a3) {
        var a4 = this['item']['spec']['mat_groups'][a3]
        , a5 = project_settings['kitchen']?.['mat_groups']?.[a4['key']];
        this['mat_group_modal'] = {
          'ind': a3,
          'is_global': !!a5,
          'show_mat': a4['material'] ? 0 : 1,
          'show_av': a4['available'] ? 0 : 1,
          'group': copy_object(a4),
          'group_key': a4['key']
        },
        this['mat_group_modal_instance']['show']();
      },
      'hide_mat_group_modal': function() {
        this['mat_group_modal_instance']['hide']();
      },
      'show_mat_group_global_modal': function() {
        this['mat_group_global_modal_instance']['show']();
      },
      'hide_mat_group_global_modal': function() {
        this['mat_group_global_modal_instance']['hide']();
      },
      'show_global_vars_modal': function() {
        this['global_vars_modal_instance']['show']();
      },
      'hide_global_vars_modal': function() {
        this['global_vars_modal_instance']['hide']();
      },
      'mat_group_modal_save': function() {
        var a3 = copy_object(this['mat_group_modal']['group'])
        , a4 = (a3['vue_id'] = this['get_random_id'](),
        a3['available']?.['forEach'](a5 => {
          a5['thickness'] && (a5['thickness'] = [...new Set(a5['thickness'])]['sort']( (a6, a7) => a6 - a7));
        }
        ),
        this['mat_group_modal']['ind']);
        this['item']['spec']['mat_groups'][a4] = a3,
        this['item']['spec']['mat_groups']['splice'](0, 0),
        this['hide_mat_group_modal']();
      },
      'set_default_mat_group': function(a3) {
        var a4 = this['item']['spec']['mat_groups'] || [], a5;
        for (a5 of a4)
        a5['default'] = 0;
        a4[a3] && (a4[a3]['default'] = 1),
        this['item']['spec']['mat_groups']['splice'](0, 0);
      },
      'get_mat_group_available_info': function(a3) {
        var a3 = this['item']['spec']['mat_groups'][a3], a3 = a3['available'] || project_settings['kitchen']?.['mat_groups']?.[a3['key']]?.['available'], a4;
        return a3 ? a3.map(a5 => {
          var a6 = _['get'](this['$options']['materials_keys_hash'][a5['key']], 'name') || a5['key'] || '';
          let a7 = _['get'](pp['libs']['materials'], a5['key'] + '.categories', {});
          var a8 = _['get'](a5, 'categories', [])['map'](aa => get_category_path(a7, aa))
          , a9 = _['get'](a5, 'thickness', [])['join'](',\x20');
          return {
            'key': a5['key'],
            'key_name': a6,
            'categories': a8,
            'thickness_text': a9
          };
        }
        ) : [];
      },
      'has_mat_group_available': function(a3) {
        var a3 = this['item']['spec']['mat_groups'][a3], a4;
        return !!(a3['available'] || project_settings['kitchen']?.['mat_groups']?.[a3['key']]?.['available'])?.['length'];
      },
      'get_mat_group_material_text': function(a3) {
        let a4 = '';
        var a3 = this['item']['spec']['mat_groups'][a3];
        if (!a3)
        return '(не\x20задан)';
        var a3 = a3['material'] || project_settings['kitchen']?.['mat_groups']?.[a3['key']]?.['material'], a5, a5;
        if (!a3 || is_empty_id(a3['id']))
        return '(не\x20задан)';
        a3['key'] && (a5 = this['$options']['materials_keys_hash'][a3['key']]?.['name'] || '',
        a4 += '' + a5),
        a3['id'] && (a5 = _['get'](pp['libs']['materials'], a3['key'] + '.items[' + a3['id'] + '].name') || 'id:\x20' + a3['id'],
        a4 += '\x20/\x20' + a5);
        var a5 = this['get_material_variants'](a3['key'], a3['id']), a5, a3;
        return a5 && (a3 = (a5[a5 = a3['variant_id'] || 0] || {})['name'] || a5,
        a4 += '\x20/\x20вариант:\x20' + a3),
        a4;
      },
      'get_mat_groups_categories': function(a3) {
        var a4 = a3 || this['mat_group_modal']['group'], a4 = _['get'](a4, 'material.av_index', 0), a3 = this['get_modal_mat_group_available'](a3), a5;
        return _['get'](a3, '[' + a4 + '].categories', [])['map'](a6 => parseInt(a6));
      },
      'get_material_variants': function(a3, a4, a5=false) {
        var a3, a3;
        return !(!a3 || !a4 || !(a3 = pp['libs']['materials'][a3]) || !(a3 = _['get'](a3['items'][a4], 'params.variants')) || !a3.length || a5 && a3.length < 2) && a3;
      },
      'add_mat_groups_thickness': function(a3) {
        var a4 = this['mat_group_modal']['group'];
        let a5 = _['get'](a4, 'available[' + a3 + '].thickness', []);
        (a5 = a5 || [])['push'](0),
        a4['available'][a3]['thickness'] = a5;
      },
      'remove_mat_groups_thickness': function(a3, a4) {
        var a5 = this['mat_group_modal']['group'];
        let a6 = _['get'](a5, 'available[' + a3 + '].thickness', []);
        (a6 = a6 || [])['splice'](a4, 1),
        a5['available'][a3]['thickness'] = a6;
      },
      'add_material': function() {
        var a3 = {
          'key': '',
          'material': {
            'av_index': 0,
            'key': 'ldsp',
            'variant_id': 0
          },
          'name': '',
          'local': 0,
          'default': 0,
          'available': [{
            'key': 'ldsp',
            'thickness': [16],
            'categories': []
          }]
        };
        a3['vue_id'] = this['get_random_id'](),
        this['item']['spec']['mat_groups']['length'] || (a3['default'] = 1),
        this['item']['spec']['mat_groups']['push'](a3),
        this['mat_groups_hash'][a3['key']] = a3;
      },
      'add_global_material': function(a3, a4) {
        var a5, a3 = this['$options']['materials_groups'][a3], a6, a4, a6;
        a3 && (delete (a6 = copy_object(a3))['id'],
        a4 ? this['init_material_group'](a6) : (delete a6['material'],
        delete a6['available']),
        a6['vue_id'] = this['get_random_id'](),
        a6['local'] = 0,
        a6['default'] = 0,
        this['item']['spec']['mat_groups']['length'] || (a6['default'] = 1),
        this['item']['spec']['mat_groups']['push'](a6),
        (a4 = copy_object(a6))['material'] && a4['available'] || (a6 = copy_object(a3),
        this['init_material_group'](a6),
        a4['material'] || (a4['material'] = a6['material']),
        a4['available']) || (a4['available'] = a6['available']),
        this['mat_groups_hash'][a4['key']] = a4);
      },
      'init_material_group'(a3) {
        a3['material'] || (a3['material'] = {
          'av_index': 0,
          'key': 'ldsp',
          'variant_id': 0
        }),
        a3['available'] || (a3['available'] = [{
          'key': 'ldsp',
          'thickness': [],
          'categories': []
        }]);
        for (var a4 of a3['available'])
        void 0 === a4['key'] && (a4['key'] = 'ldsp'),
        void 0 === a4['categories'] && (a4['categories'] = []),
        void 0 === a4['thickness'] && (a4['thickness'] = []);
      },
      'switch_mg_available': function() {
        var a3 = this['mat_group_modal']['group'], a4;
        a3['available'] ? delete a3['available'] : a3['available'] = [{
          'key': 'ldsp',
          'thickness': [],
          'categories': []
        }],
        a3['material'] && (a4 = this['get_modal_mat_group_available'](),
        a3['material'] = {
          'av_index': 0,
          'key': a4?.[0]?.['key'] || 'ldsp',
          'variant_id': 0
        }),
        this['mat_group_modal']['show_av'] = a3['available'] ? 0 : 1,
        this['mat_group_modal']['group'] = {
          ...this['mat_group_modal']['group']
        },
        this['mat_group_modal'] = {
          ...this['mat_group_modal']
        };
      },
      'switch_mg_material': function() {
        var a3 = this['mat_group_modal']['group'], a4;
        a3['material'] ? delete a3['material'] : (a4 = this['get_modal_mat_group_available'](),
        a3['material'] = {
          'av_index': 0,
          'key': a4?.[0]?.['key'] || 'ldsp',
          'variant_id': 0
        }),
        this['mat_group_modal']['show_mat'] = a3['material'] ? 0 : 1,
        this['mat_group_modal']['group'] = {
          ...this['mat_group_modal']['group']
        },
        this['mat_group_modal'] = {
          ...this['mat_group_modal']
        };
      },
      'get_modal_mat_group_available': function(a3) {
        var a3 = a3 || this['mat_group_modal']['group'], a4;
        return a3['available'] || project_settings['kitchen']?.['mat_groups']?.[a3['key']]?.['available'];
      },
      'get_mat_group_modal_href': function() {
        var a3 = this['mat_group_modal']['group_key'], a4 = '', a3;
        return !a3 || (a3 = project_settings['kitchen']?.['mat_groups']?.[a3],
        is_empty_id(a3?.['id'])) ? '' : glob['base_url'] + '/catalog/item/materials_groups/' + a3['id'];
      },
      'get_mat_group_modal_label': function() {
        var a3 = this['mat_group_modal']['group_key'], a3;
        return a3 ? (a3 = project_settings['kitchen']?.['mat_groups']?.[a3]) ? a3['name'] || '(без\x20названия)' : '(не\x20найдена)' : '';
      },
      'change_mat_group': function(a3) {
        var a3 = void 0 !== a3 ? this['item']['spec']['mat_groups'][a3] : this['mat_group_modal']['group'], a4;
        a3 && (a3['vue_id'] = this['get_random_id'](),
        void 0 !== a3['material']['av_index']) && (a4 = a3['available'][a3['material']['av_index']]['key']) !== a3['material']['key'] && (a3['material']['key'] = a4,
        a3['material']['id'] = 0,
        a3['material']['variant_id'] = 0);
      },
      'change_mat_group_material': function(a3) {
        var a4 = this['mat_group_modal']['group'];
        a4 && (a4['material']['id'] = a3,
        a4['material']['variant_id'] = 0,
        a4['material'] = {
          ...a4['material']
        });
      },
      'change_keys_controller': function(a3, a4, a5) {
        let a6;
        switch (a4) {
          case 'catalogs_keys':
          a6 = 'catalog_' + a5;
          break;
          case 'materials_keys':
          a6 = 'material_' + a5;
          break;
        }
        a6 && (this['picker_controller_name'] = a6);
      },
      'remove_material': function(a3) {
        this['item']['spec']['mat_groups']['splice'](a3, 1),
        this['update_mat_groups_hash']();
      },
      'material_up': function(a3) {
        this['swap_arr_elements'](this['item']['spec']['mat_groups'], a3, a3 - 1);
      },
      'material_down': function(a3) {
        this['swap_arr_elements'](this['item']['spec']['mat_groups'], a3, a3 + 1);
      },
      'update_mat_groups_hash': function() {
        var a3 = this['$options']['materials_groups_hash'], a4 = {}, a5;
        if (this['item']['spec']['mat_groups'])
        for (var a6 of this['item']['spec']['mat_groups']) {
          let a7 = a6;
          a7['material'] && a7['available'] || (a3[(a7 = copy_object(a7))['key']] && (a5 = copy_object(a3[a7['key']]),
          a7['material'] || (a7['material'] = a5['material']),
          a7['available'] || (a7['available'] = a5['available'])),
          this['init_material_group'](a7)),
          a4[a6['key']] = a7;
        }
        this['mat_groups_hash'] = a4;
      },
      'add_available': function() {
        var a3 = this['mat_group_modal']['group']
        , a4 = {
          'key': 'ldsp',
          'thickness': [16],
          'categories': []
        };
        a4['vue_id'] = this['get_random_id'](),
        a3['available']['push'](a4);
      },
      'remove_available': function(a3) {
        var a4 = this['mat_group_modal']['group'], a3;
        a4['available']['splice'](a3, 1),
        a4['material']['av_index'] < a3 || (a3 = Math['max'](0, a4['material']['av_index'] - 1),
        a4['material']['av_index'] = a3,
        this['change_mat_group']());
      },
      'available_up': function(a3) {
        var a4 = this['mat_group_modal']['group'];
        a4['material']['av_index'] === a3 ? a4['material']['av_index'] = a3 - 1 : a4['material']['av_index'] === a3 - 1 && (a4['material']['av_index'] = a3),
        this['swap_arr_elements'](a4['available'], a3, a3 - 1),
        this['change_mat_group']();
      },
      'available_down': function(a3) {
        var a4 = this['mat_group_modal']['group'];
        a4['material']['av_index'] === a3 ? a4['material']['av_index'] = a3 + 1 : a4['material']['av_index'] === a3 + 1 && (a4['material']['av_index'] = a3),
        this['swap_arr_elements'](a4['available'], a3, a3 + 1),
        this['change_mat_group']();
      },
      'change_available_key': function(a3) {
        var a4, a5;
        this['mat_group_modal']['group']['available'][a3]['categories']['splice'](0),
        this['change_mat_group']();
      },
      'change_def_template': function() {
        var a3 = this['$root']['$selected_object']
        , a4 = (this['clear_selected'](),
        a3['set_template_active'](this['item']['spec']['selected_template'], true, false),
        this['item']['spec']['templates'][a3['userData']['selected_template']]);
        if (a4) {
          var a5 = this['item']['size'], a6 = a4['min'] || {}, a7 = a4['max'] || {}, a8 = {
            'x': parseFloat(a5['x']),
            'y': parseFloat(a5['y']),
            'z': parseFloat(a5['z'])
          }, a4 = {
            'x': a8['x'],
            'y': a8['y'],
            'z': a8['z']
          }, a9, aa, aa, a4;
          for (a9 of ['x', 'y', 'z']) {
            let ab = null
            , ac = null;
            is_empty_id(a6[a9]) || (aa = parseFloat(a6[a9]),
            Number['isFinite'](aa) && 0 < aa && (ab = aa)),
            is_empty_id(a7[a9]) || (aa = parseFloat(a7[a9]),
            Number['isFinite'](aa) && 0 < aa && (ac = aa)),
            null === ab || null === ac || a8[a9] >= ab && a8[a9] <= ac ? null !== ac && a8[a9] > ac ? a8[a9] = Math['floor'](ac) : null !== ab && a8[a9] < ab && (a8[a9] = Math['ceil'](ab)) : a8[a9] = Math['floor'](ab + (ac - ab) / 2);
          }
          (a8['x'] !== a4['x'] || a8['y'] !== a4['y'] || a8['z'] !== a4['z']) && (a5['x'] = a8['x'],
          a5['y'] = a8['y'],
          a5['z'] = a8['z'],
          a4 = a3['userData']['params']['size']) && (a4['x'] = a5['x'],
          a4['y'] = a5['y'],
          a4['z'] = a5['z']);
        }
        a3['_rebuild'](),
        this['reset_tree'](),
        this['change_tab']('tree');
      },
      'add_template': function() {
        var a3 = this['$root']['$selected_object'];
        let a4 = {
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
            'accessories': []
          }
        };
        if (0 < this['item']['spec']['templates']['length']) {
          let a5 = this['item']['spec']['templates'][this['item']['spec']['templates']['length'] - 1];
          a4['min'] = {
            'x': a5['min']['x'],
            'y': a5['min']['y'],
            'z': a5['min']['z']
          },
          a4['max'] = {
            'x': a5['max']['x'],
            'y': a5['max']['y'],
            'z': a5['max']['z']
          },
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
        a3['userData']['params']['spec']['templates']['push'](copy_object(a4)),
        this['item']['spec']['templates']['push'](a4);
      },
      'change_template': function(a3) {
        let a4 = this;
        clearTimeout(this['debounce']),
        this['debounce'] = setTimeout(function() {
          var a5 = a4['$root']['$selected_object']
          , a6 = copy_object(a4['item']['spec']['templates'][a3]);
          a5['userData']['params']['spec']['templates'][a3] = a6,
          a3 == a5['userData']['selected_template'] && (a5['set_template_active'](a4['item']['spec']['selected_template'], false),
          a4['reset_tree']()),
          a5['userData']['params']['templates_loaded'] = 0,
          module_utils['init_empty_values_recursive_by_path'](a5, '0'),
          a5['_rebuild']();
        }, this['delay']);
      },
      'remove_template': function(a3) {
        var a4 = this['$root']['$selected_object'], a5 = (this['item']['spec']['templates']['splice'](a3, 1),
        a4['userData']['params']['spec']['templates']['splice'](a3, 1),
        -1 === this['item']['spec']['selected_template']), a6 = a4['userData']['selected_template'], a3;
        a6 < a3 || (a3 = Math['max'](0, a6 - 1),
        a5 || (this['item']['spec']['selected_template'] = a3),
        a4['set_template_active'](a3, !a5),
        this['reset_tree']());
      },
      'template_up': function(a3) {
        var a4 = this['$root']['$selected_object']
        , a5 = -1 === this['item']['spec']['selected_template'];
        a4['userData']['selected_template'] === a3 ? (a4['userData']['selected_template'] = a3 - 1,
        a5 || (this['item']['spec']['selected_template'] = a3 - 1,
        a4['userData']['params']['spec']['selected_template'] = a3 - 1)) : a4['userData']['selected_template'] === a3 - 1 && (a4['userData']['selected_template'] = a3,
        a5 || (this['item']['spec']['selected_template'] = a3,
        a4['userData']['params']['spec']['selected_template'] = a3)),
        this['swap_arr_elements'](this['item']['spec']['templates'], a3, a3 - 1),
        this['swap_arr_elements'](a4['userData']['params']['spec']['templates'], a3, a3 - 1);

      }
      ,