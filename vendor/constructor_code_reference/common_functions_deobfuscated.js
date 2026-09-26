function get_base_data() {
  let data = {};

  let item_id = document.getElementById('item_id');
  if (item_id != null) {
    data.item_id = item_id.value;
  } else {
    data.item_id = 0;
  }

  let controller_name = document.getElementById('footer_controller_name');
  if (controller_name != null) {
    data.controller_name = controller_name.value;
  } else {
    data.controller_name = '';
  }

  data.base_url = document.getElementById('ajax_base_url').value;
  data.acc_url = document.getElementById('acc_base_url').value;
  data.lang = JSON.parse(document.getElementById('lang_json').value);

  if (document.getElementById('lang_front_json')?.value) {
    data.lang_front = JSON.parse(document.getElementById('lang_front_json').value);
  }

  data.ini = JSON.parse(document.getElementById('ini_json').value);

  data.is_common = 0;

  if (document.getElementById('footer_is_common')) {
    data.is_common = document.getElementById('footer_is_common').value;
  }

  data.c_method_name = 'categories_get';
  if (data.is_common) data.c_method_name += '_common';

  data.i_method_name = 'get_item';
  if (data.is_common) data.i_method_name += '_common';
  return data;
}

async function get_defaults_data() {
  return promise_request('/src/json/defaults.json')
}

function create_tree(dataset) {
  let hashTable = Object.create(null)
  dataset.forEach(function(aData) {
    hashTable[aData.id] = aData;
    aData.children = [];
    aData.path = [];
  })
  let dataTree = []
  dataset.forEach(function(aData) {
    if (aData.parent && aData.parent > 0) {
      if (hashTable[aData.parent]) {
        hashTable[aData.parent].children.push(hashTable[aData.id])
      }
    } else {
      dataTree.push(hashTable[aData.id])
    }
  })

  add_path(dataTree)

  function add_path(item, path = null) {

    for (let i = 0; i < item.length; i++) {
      if (!path) {
        item[i].path = [];
      } else {
        item[i].path = copy_object(path);
      }
      item[i].path.push(item[i].name)

      if (item[i].children) {
        add_path(item[i].children, item[i].path)
      }
    }
  }

  return dataTree
}

async function promise_all_object(obj) {
  return await Promise.all(
    Object.entries(obj).map(async ([k, v]) => [k, await v])
  ).then(Object.fromEntries);
}

function create_event_promise(event_name) {
  return new Promise(resolve => {
    document.addEventListener(event_name, resolve, {
      once: true
    });
  });
}

function flatten_tree(tree) {
  let result = [];

  for (let i = 0; i < tree.length; i++) {
    result.push(tree[i])
    for (let c = 0; c < tree[i].children.length; c++) {
      result.push(tree[i].children[c])
    }
  }
  return result;
}

const flatten = data => {
  return data.reduce((r, {
    children,
    ...rest
  }) => {
    r.push(rest);
    if (children) r.push(...flatten(children));
    return r;
  }, [])
}

function get_hash(data) {
  return data.reduce(function(map, obj) {
    map[obj.id] = obj;
    return map;
  }, {});
}

function get_hash_key(data) {
  return data.reduce(function(map, obj) {
    map[obj.key] = obj;
    return map;
  }, {});
}

function get_category_path(categories_hash, id) {
  return buildPath(id);

  function buildPath(currentId) {
    const current = categories_hash[currentId];

    if (!current) {
      return '';
    }

    const currentName = current.name || `${current.id}`;

    if (!current || !current.parent || current.parent == "0") {
      return currentName;
    }

    const parentPath = buildPath(current.parent);

    return parentPath ? `${parentPath} / ${currentName}` : currentName;
  }
}

function check_filename(file) {
  let split_arr = file.name.split('.');
  if (split_arr.length > 2) return false;
  return !(split_arr[0].match(/[^\u0000-\u007f]/));
}

function check_foldername(text) {
  if (!text) {
    console.log('empty')
    return false
  }
  if (text.match(/[^\u0000-\u007f]/)) {
    console.log('wrong')
    return false
  }
  if (text.indexOf(' ') > -1) {
    console.log('space')
    return false
  }
  if (text.indexOf('.') > -1) {
    console.log('point')
    return false
  }

  return true;
}

function promise_request(url) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.send();
  return new Promise(function(resolve, reject) {
    xhr.onreadystatechange = function(e) {
      if (xhr.readyState == 4 && xhr.status == 200) {
        let data = JSON.parse(xhr.responseText);
        resolve(data);
      } else if (xhr.readyState == 4) {
        reject();
      }
    };
  });
}

function promise_request_post(url, data) {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", url);
  xhr.send(data);

  return new Promise(function(resolve, reject) {
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        try {
          let result = JSON.parse(xhr.responseText);
          resolve(result);
        } catch (e) {
          console.log(xhr.responseText);
          console.log(e);
        }

      } else if (xhr.readyState == 4) {
        reject();
      }
    };
  });
}

function promise_request_post_raw(url, data) {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", url);
  xhr.send(data);

  return new Promise(function(resolve, reject) {
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        try {
          resolve(xhr);
        } catch (e) {
          console.log(xhr.responseText);
          console.log(e);
        }
      } else if (xhr.readyState == 4) {
        reject();
      }
    };
  });
}

function send_xhr_get(url, ready) {
  let xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.send();
  xhr.addEventListener("readystatechange", function() {
    if (xhr.readyState === 4) {
      if (typeof ready == "function") ready(xhr);
    }
  });
}

function send_xhr_post(url, data, ready) {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", url);
  xhr.send(data);
  xhr.addEventListener("readystatechange", function() {
    if (xhr.readyState === 4) {
      ready(xhr);
    }
  });
}

function copy_object(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function save_file(blob, filename) {
  var link = document.createElement('a');
  link.style.display = 'none';
  document.body.appendChild(link);
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  link.remove();
}

async function get_tree_async(url, no_item) {
  let result = {};
  let data = await promise_request(url)

  if (no_item) {
    // ni = {
    //     id:"0",
    //     name: lang_data['lang_no'],
    //     parent: "0"
    // }
    data.unshift(no_item)

  }

  result.tree = create_tree(copy_object(data));
  result.ordered = flatten_tree(copy_object(result.tree))
  result.hash = get_hash(copy_object(data))

  return result;
}

function show_warning_yes_no(callback, close, cancel) {

  if (!callback) {
    console.log('no_callback');
    return;
  }

  if (!close) close = true;
  if (!cancel) cancel = true;

  swal({
    title: glob.lang['are_u_sure'],
    text: glob.lang['delete_confirm_message'],
    type: "warning",
    showCancelButton: cancel,
    confirmButtonColor: "#DD6B55",
    cancelButtonText: glob.lang['no'],
    confirmButtonText: glob.lang['yes'],
    closeOnConfirm: close
  }, function() {
    if (typeof callback === 'function') callback();
  });
}

function show_warning(callback, params) {
  if (!callback) {
    console.log('no_callback');
    return;
  }

  if (!params) params = {};

  if (!params.close) params.close = true
  if (!params.cancel) params.cancel = true
  if (!params.title) params.title = glob.lang['are_u_sure']
  if (!params.text) params.text = glob.lang['delete_confirm_message']
  if (!params.type) params.type = 'warning'

  swal({
    title: params.title,
    text: params.text,
    type: params.type,
    showCancelButton: params.cancel,
    confirmButtonColor: "#DD6B55",
    cancelButtonText: glob.lang['no'],
    confirmButtonText: glob.lang['yes'],
    closeOnConfirm: params.close
  }, function() {
    if (typeof callback === 'function') callback();
  });
}

function clean_string(string) {
  return string.toString().replace(/\s{2,}/g, ' ').replace(/\t/g, ' ').trim();
}

function closest(arr, goal) {
  if (!arr.length) return 0;

  return arr.reduce(function(prev, curr) {
    return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
  });
}

function deepAssign() {
  let len = arguments.length;
  if (len < 1) return;
  if (len < 2) return arguments[0];

  for (let i = 1; i < len; i++) {
    for (let key in arguments[i]) {
      if (Object.prototype.toString.call(arguments[i][key]) === '[object Object]') {
        arguments[0][key] = deepAssign(arguments[0][key] || {}, arguments[i][key]);
      } else {
        arguments[0][key] = arguments[i][key];
      }
    }
  }

  return arguments[0];
}

function translit(word) {
  var answer = '';
  var converter = {
    'а': 'a',
    'б': 'b',
    'в': 'v',
    'г': 'g',
    'д': 'd',
    'е': 'e',
    'ё': 'e',
    'ж': 'zh',
    'з': 'z',
    'и': 'i',
    'й': 'y',
    'к': 'k',
    'л': 'l',
    'м': 'm',
    'н': 'n',
    'о': 'o',
    'п': 'p',
    'р': 'r',
    'с': 's',
    'т': 't',
    'у': 'u',
    'ф': 'f',
    'х': 'h',
    'ц': 'c',
    'ч': 'ch',
    'ш': 'sh',
    'щ': 'sch',
    'ь': '',
    'ы': 'y',
    'ъ': '',
    'э': 'e',
    'ю': 'yu',
    'я': 'ya',

    'А': 'A',
    'Б': 'B',
    'В': 'V',
    'Г': 'G',
    'Д': 'D',
    'Е': 'E',
    'Ё': 'E',
    'Ж': 'Zh',
    'З': 'Z',
    'И': 'I',
    'Й': 'Y',
    'К': 'K',
    'Л': 'L',
    'М': 'M',
    'Н': 'N',
    'О': 'O',
    'П': 'P',
    'Р': 'R',
    'С': 'S',
    'Т': 'T',
    'У': 'U',
    'Ф': 'F',
    'Х': 'H',
    'Ц': 'C',
    'Ч': 'Ch',
    'Ш': 'Sh',
    'Щ': 'Sch',
    'Ь': '',
    'Ы': 'Y',
    'Ъ': '',
    'Э': 'E',
    'Ю': 'Yu',
    'Я': 'Ya'
  };

  for (var i = 0; i < word.length; ++i) {
    if (converter[word[i]] == undefined) {
      answer += word[i];
    } else {
      answer += converter[word[i]];
    }
  }

  return answer;
}

function roughSizeOfObject(object) {

  var objectList = [];
  var stack = [object];
  var bytes = 0;

  while (stack.length) {
    var value = stack.pop();

    if (typeof value === 'boolean') {
      bytes += 4;
    } else if (typeof value === 'string') {
      bytes += value.length * 2;
    } else if (typeof value === 'number') {
      bytes += 8;
    } else if (
      typeof value === 'object' &&
      objectList.indexOf(value) === -1
    ) {
      objectList.push(value);

      for (var i in value) {
        stack.push(value[i]);
      }
    }
  }
  return bytes;
}

async function get_image_size_by_src(src) {
  if (!src) {
    throw new Error('Invalid input, please provide clear instructions.');
  }

  const image = new Image();

  // Set the image source
  image.src = src;

  // Return a promise that resolves with the image size
  return new Promise((resolve, reject) => {
    image.onload = () => {
      const {
        width,
        height
      } = image;
      resolve({
        width,
        height
      });
    };

    image.onerror = reject;
  });
}

function swap_arr_elements(arr, i1, i2) {
  arr[i1] = arr.splice(i2, 1, arr[i1])[0];
}

function to_int(val) {
  let result = 0;
  if (typeof val === "boolean") {
    if (val === false) {
      result = 0;
    } else {
      result = 1;
    }
  }

  if (typeof val === "string") {
    if (val.toLowerCase() === "false" || val.toLowerCase() === "0" || val.toLowerCase() === "") {
      result = 0;
    } else {
      result = 1;
    }
  }

  if (typeof val === "number") {
    if (val === 0) {
      result = 0;
    } else {
      result = 1;
    }
  }

  return result;
}

function wait_ms(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

const def_decor = {
  id: 0,
  name: '',
  code: '',
  order: 100000,
  category: "0",
  active: 1,
  params: {
    icon: null,
    alphaMap: null,
    // aoMap: null,
    // aoMapIntensity: 1,
    // bumpMap: null,
    // bumpScale: 1,
    color: '#ffffff',
    // displacementMap: null,
    // displacementScale: 1,
    // displacementBias: 0,
    // emissive: '#000000',
    // emissiveIntensity: 1,
    // emissiveMap: null,
    // envMap: null,
    // envMapIntensity: 1,
    // flatShading: false,
    // fog: true,
    // lightMap: null, //second set of UVs,
    // lightMapIntensity: 1,
    map: null,
    metalness: 0,
    // metalnessMap: null,
    normalMap: null,
    // normalScale: {x:1, y:1}, //Vec2
    roughness: 1,
    roughnessMap: null,
    transparent: 0,
    opacity: 1,
  },
  add_params: {
    real_width: 256,
    real_height: 256,
    rotation: 'normal',
    stretch_width: 0,
    stretch_height: 0,
    normal_scale: false,
    wrapping: 'mirror',
    normal_wrapping: 'mirror',
    roughness_wrapping: 'mirror',
  },
  type: 'Standard'
}

function display_paywall() {

  //return;
  //console.log(glob.ini.tariff.id);

  if (location.href.indexOf('59852595') > -1) return;
  if (location.href.indexOf('15824722') > -1) return;
  if (location.href.indexOf('5688992') > -1) return;
  if (location.href.indexOf('dev') > -1) return;
  if (location.href.indexOf('new_dev') > -1) return;

  if (parseInt(glob.ini.tariff.id) < 20) {

    const paywall = document.createElement('div')
    paywall.className = 'paywall'

    const h1 = document.createElement('h1')
    h1.textContent = 'Доступно в тарифах PRO и BUSINESS'

    const div = document.createElement('div')
    div.innerHTML = 'Подробнее можно ознакомиться <a target="_blank" href="https://planplace.ru">на нашем сайте</a>'
    div.className = 'paywall_small'

    paywall.appendChild(h1)
    paywall.appendChild(div)
    document.getElementById('page-wrapper').appendChild(paywall)
  }
}

function build_category_tree(response, parentId = 0) {
  return response
    .filter(cat => Number(cat.parent) == parentId)
    .map(cat => ({
      ...cat,
      children: build_category_tree(response, cat.id)
    }));
}

function set_viewport_height() {
  document.getElementById('viewport').style.height = (window.innerHeight - 200) + 'px';
}

function convert_decor(i_data) {
  if (!i_data.data) {

    if (!i_data.real_width) i_data.real_width = 0;
    if (!i_data.real_height) i_data.real_height = 0;
    if (!i_data.wrapping) i_data.wrapping = 'mirror';

    i_data.data = {
      id: i_data.id,
      name: i_data.name,
      code: i_data.code,
      order: i_data.order,
      category: i_data.category,
      active: i_data.active,
      params: {
        icon: null,
        alphaMap: null,
        color: i_data.color,
        map: i_data.map,
        metalness: i_data.metalness,
        normalMap: null,
        roughness: i_data.roughness,
        roughnessMap: null,
        transparent: i_data.transparent,
        opacity: 1,
      },
      add_params: {
        real_width: i_data.real_width,
        real_height: i_data.real_height,
        rotation: 'normal',
        stretch_width: i_data.stretch_width,
        stretch_height: i_data.stretch_height,
        normal_scale: false,
        wrapping: i_data.wrapping,
        normal_wrapping: 'mirror',
      },
      type: 'Standard'
    }
  }

  i_data.data.active = to_int(i_data.active)

  return i_data
}
