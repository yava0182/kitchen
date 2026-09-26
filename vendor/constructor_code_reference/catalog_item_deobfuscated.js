let app;
let data = {};
let materials = {};
let butts = {};
let butts_keys = [];
let butts_keys_hash = {};
let butts_by_key = {};
let item = null;
let decor_data = null;

let cokol_data;
let cokol_top_data;
let legs_data;
let model_key_material_data;
let tabletop_data;
let bort_data;
let furniture_data;
let global_vars;
let defaults_data;

let ajax_base_url = null;
let controller_name = null;
let lang_data = null;
let categories = null;
let accessories = null;
let accessories_types = null;
let accessories_hash = {};
let cat_ordered = null;
let item_id = null;
let cabinet = null;
let module_data = null;
let modules_groups = null;

let input_timeout_time = 750;
let input_timeout = null;

let accs_by_type = {};

let params_hash = {};

document.addEventListener('Glob_ready', function() {
  set_viewport_height();
  window.addEventListener('resize', set_viewport_height, false);
  const inter = setInterval(() => {
    if (pp.libs && pp.libs.materials !== undefined) {
      clearInterval(inter);
      load_items_and_init_vue();
    }
  }, 100);
});

async function load_data() {
  const inits = [];
  const callbacks = [];

  let mat_keys_array;
  let butt_keys_array;
  let cat_keys_array;

  let is_materials_from_json = true;

  // inits.push(() => promise_request(glob.base_url + '/catalog/' + glob.c_method_name + '/' + glob.controller_name));
  // callbacks.push((data) => {
  //     data.unshift({
  //         id: "0",
  //         name: lang_data['lang_no'],
  //         parent: "0"
  //     });

  //     cat_data = data;
  //     cat_hash = get_hash(cat_data);
  //     cat_ordered = flatten(create_tree(cat_data));
  // });

  // if (is_materials_from_json) {
  //     inits.push(() => promise_request(glob.acc_url + 'data/materials.json' + '?' + date_time));
  //     callbacks.push((data) => {
  //         //декоры
  //         decor_data = data;

  //         if (!decor_data?.items) {
  //             return;
  //         }

  //         for (let i = decor_data.items.length; i--;) {
  //             if (decor_data.items[i].params) continue;
  //             decor_data.items[i].params = {};
  //             decor_data.items[i].params.color = decor_data.items[i].color;
  //             decor_data.items[i].params.map = decor_data.items[i].map;
  //             decor_data.items[i].params.metalness = decor_data.items[i].metalness;
  //             decor_data.items[i].params.roughness = decor_data.items[i].roughness;
  //             decor_data.items[i].params.transparent = decor_data.items[i].transparent;

  //             decor_data.items[i].add_params = {};
  //             decor_data.items[i].add_params.real_height = decor_data.items[i].real_height;
  //             decor_data.items[i].add_params.real_width = decor_data.items[i].real_width;
  //             decor_data.items[i].add_params.stretch_height = decor_data.items[i].stretch_height;
  //             decor_data.items[i].add_params.stretch_width = decor_data.items[i].stretch_width;
  //             decor_data.items[i].add_params.wrapping = decor_data.items[i].wrapping;
  //         }

  //         decor_categories_hash = get_hash(decor_data.categories);
  //         decor_categories_ordered = flatten(create_tree(decor_data.categories));
  //     });
  // }

  // inits.push(() => promise_request(glob.base_url + '/catalog/items_get/default_settings'));
  // callbacks.push((data) => {
  //     const json = data?.[0]?.data;
  //     if (json) {
  //         defaults_data = JSON.parse(json);
  //     }
  // });

  // inits.push(() => promise_request(glob.base_url + '/catalog/items_get/modules_groups'));
  // callbacks.push((data) => {
  //     modules_groups = data;
  // });

  inits.push(() => promise_request(glob.base_url + '/catalog/get_all_data_for_catalog_item' + (
    is_materials_from_json ? "/1" : "")));
  callbacks.push((data) => {

    const json = data['default_settings']?.[0]?.data;
    if (json) {
      defaults_data = JSON.parse(json);
    }

    modules_groups = data['modules_groups'];

    materials_groups = data['materials_groups'];

    if (materials_groups) {
      for (let i = 0; i < materials_groups.length; i++) {
        materials_groups[i] = JSON.parse(materials_groups[i].data);
        materials_groups_hash[materials_groups[i].key] = materials_groups[i];
      }
    }

    material_types = data['material_types'];

    let mats = data['material_types'];

    for (let i = 0; i < mats.length; i++) {
      let it = mats[i]
      it.data = JSON.parse(it.data);

      if (!it.data.variants[it.data.default]) {
        it.data.default = Object.keys(it.data.variants)[0]

      }

      materials[it.key] = it.data;
    }

    global_vars = data['global_vars']?.value ? JSON.parse(data['global_vars'].value) : [];

    if (!Array.isArray(global_vars)) {
      global_vars = [];
    }

    for (const global_var of global_vars) {
      if (!Array.isArray(global_var.vars)) {
        global_var.vars = [];
      }
    }

    pp.variables.global_vars = global_vars;
    pp.variables.selected_index = global_vars.findIndex((x) => x.default);

    for (const global_var of pp.variables.global_vars) {
      global_var.vars_hash = _.keyBy(global_var.vars, "key");
    }

    //модули
    catalogs_keys = data['catalogs_keys'];
    pp.libs.catalogs_info = {
      keys: data['catalogs_keys'] ? data['catalogs_keys'] : {},
    };
    if (data['catalogs_keys']) {
      for (const group of data['catalogs_keys']) {
        catalogs_keys_hash[group.key] = group;
        catalogs_by_key[group.key] = [];
      }
    }
    for (let i = 0; i < catalogs_keys.length; i++) {
      const dta = data['catalogs_by_key'][catalogs_keys[i].key]

      if (dta && dta.items) {
        for (let i = 0; i < dta.items.length; i++) {
          const id = dta.items[i].id;
          dta.items[i] = JSON.parse(dta.items[i].data);
          dta.items[i].id = id;
        }

      }

      catalogs_by_key[catalogs_keys[i].key] = dta;

      const category_0 = {
        id: 0,
        parent: 0,
        code: '',
        name: 'Категория в базе не найдена',
        items: [],
        categories: []
      };

      const item_params = {
        id: 0,
        name: '',
        code: '',
        icon: '',
        category: [],
        cabinet_tag: '',
        element_type: catalogs_keys[i].key,
        catalog_type: '',
        active: 1,
        order: 10000,
      };

      const newlib = new lib(item_params, category_0);
      convert_lib_multi_cat(newlib, dta);
      pp.libs.catalogs[catalogs_keys[i].key] = newlib;

    }

    //материалы
    materials_keys = data['materials_keys'];
    if (data['materials_keys']) {
      for (const group of data['materials_keys']) {
        if (group.data && typeof group.data === 'string') {
          group.data = JSON.parse(group.data);
        }
        materials_keys_hash[group.key] = group;
        materials_by_key[group.key] = [];
      }
    }
    for (let i = 0; i < materials_keys.length; i++) {
      const key = materials_keys[i].key;
      const dta = data['materials_by_key'][key]

      if (dta && dta.items) {
        for (let i = 0; i < dta.items.length; i++) {
          const id = dta.items[i].id;
          dta.items[i] = JSON.parse(dta.items[i].data);
          dta.items[i].id = id;

          if (dta.items[i].params) {
            continue;
          }

          dta.items[i].params = {};
          dta.items[i].params.color = dta.items[i].color;
          dta.items[i].params.map = dta.items[i].map;
          dta.items[i].params.metalness = dta.items[i].metalness;
          dta.items[i].params.roughness = dta.items[i].roughness;
          dta.items[i].params.transparent = dta.items[i].transparent;

          dta.items[i].add_params = {};
          dta.items[i].add_params.real_height = dta.items[i].real_height;
          dta.items[i].add_params.real_width = dta.items[i].real_width;
          dta.items[i].add_params.stretch_height = dta.items[i].stretch_height;
          dta.items[i].add_params.stretch_width = dta.items[i].stretch_width;
          dta.items[i].add_params.wrapping = dta.items[i].wrapping;
        }
      }

      materials_by_key[key] = dta;

      const category_0 = {
        id: 0,
        parent: 0,
        code: '',
        name: 'Категория в базе не найдена',
        items: [],
        categories: []
      };

      const item_params = {
        id: 0, //id
        name: '', //Название
        code: '', //артикул
        key: '', //ключ материала
        icon: '', //Иконка
        category: [], //Категории
        active: 1, //активность
        order: 10000, //порядок отображения
        params: {
          mat_mode: 1,
          material: 0,
          mat_params: {},
          variants: [{
            name: '',
            code: '',
            width: 0, //Ширина листа number
            height: 0, //Высота листа number
            thickness: 16, //Толщина материала number
            price: 0, //цена number
            price_mode: 'c', //select
            price_type: 'm2', // select
            price_acc_id: 0,
            params: {}
          }]
        },
      };

      const newlib = new lib(item_params, category_0);
      convert_lib_multi_cat(newlib, dta);
      pp.libs.materials[key] = newlib;

    }

    // // if (!is_materials_from_json) {
    //     //декоры
    //     decor_data = data['decors'];

    //     for (let i = decor_data.items.length; i--;) {
    //         if (decor_data.items[i].params) continue;
    //         decor_data.items[i].params = {};
    //         decor_data.items[i].params.color = decor_data.items[i].color;
    //         decor_data.items[i].params.map = decor_data.items[i].map;
    //         decor_data.items[i].params.metalness = decor_data.items[i].metalness;
    //         decor_data.items[i].params.roughness = decor_data.items[i].roughness;
    //         decor_data.items[i].params.transparent = decor_data.items[i].transparent;

    //         decor_data.items[i].add_params = {};
    //         decor_data.items[i].add_params.real_height = decor_data.items[i].real_height;
    //         decor_data.items[i].add_params.real_width = decor_data.items[i].real_width;
    //         decor_data.items[i].add_params.stretch_height = decor_data.items[i].stretch_height;
    //         decor_data.items[i].add_params.stretch_width = decor_data.items[i].stretch_width;
    //         decor_data.items[i].add_params.wrapping = decor_data.items[i].wrapping;
    //     }

    //     decor_categories_hash = get_hash(decor_data.categories);
    //     decor_categories_ordered = flatten(create_tree(decor_data.categories));
    // // }
  });

  // inits.push(() => promise_request(glob.base_url + '/catalog/items_get/materials_keys'));
  // callbacks.push((data) => {
  //     materials_keys = data;
  //
  //     if (data) {
  //         for (const group of data) {
  //             materials_keys_hash[group.key] = group;
  //             materials_by_key[group.key] = [];
  //         }
  //     }
  //
  //     const reqs = [];
  //     mat_keys_array = Object.keys(materials_by_key);
  //
  //     for (let i = 0; i < mat_keys_array.length; i++) {
  //         reqs.push(promise_request(glob.base_url + '/catalog/categories_get/material_' + mat_keys_array[i]));
  //         reqs.push(promise_request(glob.base_url + '/catalog/items_get/material_' + mat_keys_array[i]));
  //     }
  //
  //     inits.push(() => Promise.all(reqs));
  //     callbacks.push((data) => {
  //         const reqs_result = data;
  //
  //         for (let i = 0; i < mat_keys_array.length; i++) {
  //             const data = {
  //                 categories: reqs_result[i * 2],
  //                 items: reqs_result[i * 2 + 1],
  //             }
  //
  //             if (data && data.items) {
  //                 for (let i = 0; i < data.items.length; i++) {
  //                     const id = data.items[i].id;
  //                     data.items[i] = JSON.parse(data.items[i].data);
  //                     data.items[i].id = id;
  //
  //                     if (data.items[i].params) {
  //                         continue;
  //                     }
  //
  //                     data.items[i].params = {};
  //                     data.items[i].params.color = data.items[i].color;
  //                     data.items[i].params.map = data.items[i].map;
  //                     data.items[i].params.metalness = data.items[i].metalness;
  //                     data.items[i].params.roughness = data.items[i].roughness;
  //                     data.items[i].params.transparent = data.items[i].transparent;
  //
  //                     data.items[i].add_params = {};
  //                     data.items[i].add_params.real_height = data.items[i].real_height;
  //                     data.items[i].add_params.real_width = data.items[i].real_width;
  //                     data.items[i].add_params.stretch_height = data.items[i].stretch_height;
  //                     data.items[i].add_params.stretch_width = data.items[i].stretch_width;
  //                     data.items[i].add_params.wrapping = data.items[i].wrapping;
  //                 }
  //             }
  //
  //             materials_by_key[mat_keys_array[i]] = data;
  //
  //             const category_0 = {
  //                 id: 0,
  //                 parent: 0,
  //                 code: '',
  //                 name: 'Категория в базе не найдена',
  //                 items: [],
  //                 categories: []
  //             };
  //
  //             const item_params = {
  //                 id: 0, //id
  //                 name: '', //Название
  //                 code: '', //артикул
  //                 key: '', //ключ материала
  //                 icon: '', //Иконка
  //                 category: [], //Категории
  //                 active: 1, //активность
  //                 order: 10000, //порядок отображения
  //                 params: {
  //                     mat_mode: 1,
  //                     material: 0,
  //                     mat_params: {},
  //                     variants: [
  //                         {
  //                             name: '',
  //                             code: '',
  //                             width: 0, //Ширина листа number
  //                             height: 0, //Высота листа number
  //                             thickness: 16, //Толщина материала number
  //                             price: 0, //цена number
  //                             price_mode: 'c', //select
  //                             price_type: 'm2', // select
  //                             price_acc_id: 0,
  //                             params: {}
  //                         }
  //                     ]
  //                 },
  //             };
  //
  //             const newlib = new lib(item_params, category_0);
  //             convert_lib_multi_cat(newlib, data);
  //             pp.libs.materials[mat_keys_array[i]] = newlib;
  //         }
  //     });
  // });

  // inits.push(() => promise_request(glob.base_url + '/catalog/items_get/catalogs_keys'));
  // callbacks.push((data) => {
  //     catalogs_keys = data;
  //
  //     pp.libs.catalogs_info = {
  //         keys: data ? data : {},
  //     };
  //
  //     if (data) {
  //         for (const group of data) {
  //             catalogs_keys_hash[group.key] = group;
  //             catalogs_by_key[group.key] = [];
  //         }
  //     }
  //
  //     const reqs = [];
  //     cat_keys_array = Object.keys(catalogs_by_key);
  //
  //     for (let i = 0; i < cat_keys_array.length; i++) {
  //         reqs.push(promise_request(glob.base_url + '/catalog/categories_get/catalog_' + cat_keys_array[i]));
  //         reqs.push(promise_request(glob.base_url + '/catalog/items_get/catalog_' + cat_keys_array[i]));
  //     }
  //
  //     inits.push(() => Promise.all(reqs));
  //     callbacks.push((data) => {
  //         const reqs_result = data;
  //
  //         for (let i = 0; i < cat_keys_array.length; i++) {
  //             const data = {
  //                 categories: reqs_result[i * 2],
  //                 items: reqs_result[i * 2 + 1],
  //             }
  //
  //             if (data && data.items) {
  //                 for (let i = 0; i < data.items.length; i++) {
  //                     const id = data.items[i].id;
  //                     data.items[i] = JSON.parse(data.items[i].data);
  //                     data.items[i].id = id;
  //                 }
  //             }
  //
  //             catalogs_by_key[cat_keys_array[i]] = data;
  //
  //             const category_0 = {
  //                 id: 0,
  //                 parent: 0,
  //                 code: '',
  //                 name: 'Категория в базе не найдена',
  //                 items: [],
  //                 categories: []
  //             };
  //
  //             const item_params = {
  //                 id: 0,
  //                 name: '',
  //                 code: '',
  //                 icon: '',
  //                 category: [],
  //                 cabinet_tag: '',
  //                 element_type: cat_keys_array[i],
  //                 catalog_type: '',
  //                 active: 1,
  //                 order: 10000,
  //             };
  //
  //             const newlib = new lib(item_params, category_0);
  //             convert_lib_multi_cat(newlib, data);
  //             pp.libs.catalogs[cat_keys_array[i]] = newlib;
  //         }
  //     });
  // });

  inits.push(() => promise_request(glob.base_url + '/materials/get_all_data_ajax'));
  callbacks.push((data) => {
    decor_data = data;

    for (let i = decor_data.items.length; i--;) {
      if (decor_data.items[i].params) continue;
      decor_data.items[i].params = {};
      decor_data.items[i].params.color = decor_data.items[i].color;
      decor_data.items[i].params.map = decor_data.items[i].map;
      decor_data.items[i].params.metalness = decor_data.items[i].metalness;
      decor_data.items[i].params.roughness = decor_data.items[i].roughness;
      decor_data.items[i].params.transparent = decor_data.items[i].transparent;

      decor_data.items[i].add_params = {};
      decor_data.items[i].add_params.real_height = decor_data.items[i].real_height;
      decor_data.items[i].add_params.real_width = decor_data.items[i].real_width;
      decor_data.items[i].add_params.stretch_height = decor_data.items[i].stretch_height;
      decor_data.items[i].add_params.stretch_width = decor_data.items[i].stretch_width;
      decor_data.items[i].add_params.wrapping = decor_data.items[i].wrapping;
    }

    decor_categories_hash = get_hash(decor_data.categories);
    decor_categories_ordered = flatten(create_tree(decor_data.categories));
  });

  if (is_materials_from_json) {
    inits.push(() => promise_request(glob.base_url + '/catalog/get_all_data_for_catalog_item_2'));
    callbacks.push((data) => {
      butts_keys = data['butts_keys'];

      if (butts_keys) {
        for (const group of butts_keys) {
          butts_keys_hash[group.key] = group;
          butts_by_key[group.key] = [];
        }
      }

      if (!pp.libs.butts_info) {
        pp.libs.butts_info = {};
      }

      pp.libs.butts_info.keys = butts_keys || [];

      butt_keys_array = Object.keys(butts_by_key);

      const data_scope = data['butts_by_key'];

      for (let i = 0; i < butt_keys_array.length; i++) {
        const data = {
          categories: data_scope[butt_keys_array[i]]?.categories,
          items: data_scope[butt_keys_array[i]]?.items,
        }

        if (data && data.items) {
          for (let i = 0; i < data.items.length; i++) {
            const id = data.items[i].id;
            data.items[i] = JSON.parse(data.items[i].data);
            data.items[i].id = id;

            if (data.items[i].params) {
              continue;
            }

            data.items[i].params = {};
            data.items[i].params.color = data.items[i].color;
            data.items[i].params.map = data.items[i].map;
            data.items[i].params.metalness = data.items[i].metalness;
            data.items[i].params.roughness = data.items[i].roughness;
            data.items[i].params.transparent = data.items[i].transparent;

            data.items[i].add_params = {};
            data.items[i].add_params.real_height = data.items[i].real_height;
            data.items[i].add_params.real_width = data.items[i].real_width;
            data.items[i].add_params.stretch_height = data.items[i].stretch_height;
            data.items[i].add_params.stretch_width = data.items[i].stretch_width;
            data.items[i].add_params.wrapping = data.items[i].wrapping;
          }
        }

        butts_by_key[butt_keys_array[i]] = data;

        const category_0 = {
          id: 0,
          parent: 0,
          code: '',
          name: 'Категория в базе не найдена',
          items: [],
          categories: []
        };

        const item_params = {
          id: 0, //id
          name: '', //Название
          code: '', //артикул
          key: '', //ключ материала
          icon: '', //Иконка
          category: [], //Категории
          active: 1, //активность
          order: 10000, //порядок отображения
          params: {
            butt: {
              id: 0,
              key: 'butts'
            },
            mat_mode: 1,
            material: 0,
            mat_params: {},
            variants: [{
              name: '',
              code: '',
              width: 0, //Ширина листа number
              height: 0, //Высота листа number
              thickness: 0, //Толщина материала number
              price: 0, //цена number
              price_mode: 'c', //select
              price_type: 'm2', // select
              price_acc_id: 0,
              params: {}
            }]
          },
        };

        const newlib = new lib(item_params, category_0);
        convert_lib_multi_cat(newlib, data);
        pp.libs.butts[butt_keys_array[i]] = newlib;
      }

      facades_data = data['facades'];

      facades_hash = get_hash(facades_data.items);
      facades_cat_hash = get_hash(facades_data.categories);

      for (let i = 0; i < facades_data.items.length; i++) {
        if (!facades_data.items[i].data) continue

        const id = facades_data.items[i].id;
        const data = JSON.parse(facades_data.items[i].data);

        facades_data.items[i] = data;
        facades_data.items[i].id = id;
      }

      model_data = data['cabinet_model'];

      for (let i = 0; i < model_data.items.length; i++) {
        model_data.items[i].params = JSON.parse(model_data.items[i].data).params
      }

      handles_data = data['handles'];

      for (let i = 0; i < handles_data.items.length; i++) {
        try {
          handles_data.items[i].type_params = JSON.parse(handles_data.items[i].type_params)
        } catch (error) {
          handles_data.items[i].type_params = {};
        }
        handles_data.items[i].material = JSON.parse(handles_data.items[i].material)
        handles_data.items[i].sizes = JSON.parse(handles_data.items[i].variants)
      }

      handles_hash = get_hash(handles_data.items);
      handles_cat_hash = get_hash(handles_data.categories);

      cokol_data = data['cokol'];

      for (let i = 0; i < cokol_data.items.length; i++) {
        cokol_data.items[i].category = JSON.parse(cokol_data.items[i].category)

        const id = cokol_data.items[i].id;
        const data = JSON.parse(cokol_data.items[i].data);
        cokol_data.items[i] = data ? data : {};
        cokol_data.items[i].id = id;
      }

      cokol_top_data = data['cokol_top'];

      for (let i = 0; i < cokol_top_data.items.length; i++) {
        cokol_top_data.items[i].category = JSON.parse(cokol_top_data.items[i].category)

        const id = cokol_top_data.items[i].id;
        const data = JSON.parse(cokol_top_data.items[i].data);
        cokol_top_data.items[i] = data ? data : {};
        cokol_top_data.items[i].id = id;
      }

      model_key_material_data = data['model_key_material'];

      for (let i = 0; i < model_key_material_data.items.length; i++) {
        model_key_material_data.items[i].category = JSON.parse(model_key_material_data.items[i].category)

        const id = model_key_material_data.items[i].id;
        const data = JSON.parse(model_key_material_data.items[i].data);
        model_key_material_data.items[i] = data ? data : {};
        model_key_material_data.items[i].id = id;
      }

      cornice_data = data['cornice'];

      for (let i = 0; i < cornice_data.items.length; i++) {
        cornice_data.items[i].category = JSON.parse(cornice_data.items[i].category)

        const id = cornice_data.items[i].id;
        const data = JSON.parse(cornice_data.items[i].data);
        cornice_data.items[i] = data ? data : {};
        cornice_data.items[i].id = id;
      }

      tabletop_data = data['tabletop'];

      for (let i = 0; i < tabletop_data.items.length; i++) {
        tabletop_data.items[i].category = JSON.parse(tabletop_data.items[i].category)

        const data = JSON.parse(tabletop_data.items[i].data);
        tabletop_data.items[i].params = data.params ? data.params : {};
        delete tabletop_data.items[i].data;
      }

      bort_data = data['tabletop_plinth'];

      for (let i = 0; i < bort_data.items.length; i++) {
        bort_data.items[i].category = JSON.parse(bort_data.items[i].category)

        const id = bort_data.items[i].id;
        const data = JSON.parse(bort_data.items[i].data);
        bort_data.items[i] = data ? data : {};
        bort_data.items[i].id = id;
      }

      furniture_data = data['furniture'];

      for (let i = 0; i < furniture_data.items.length; i++) {
        furniture_data.items[i].category = JSON.parse(furniture_data.items[i].category)

        const data = JSON.parse(furniture_data.items[i].data);
        merge(furniture_data.items[i], data ? data : {});
        delete furniture_data.items[i].data;
      }
    });
  } else {
    inits.push(() => promise_request(glob.base_url + '/catalog/items_get/butts_keys'));
    callbacks.push((data) => {
      butts_keys = data;

      if (data) {
        for (const group of data) {
          butts_keys_hash[group.key] = group;
          butts_by_key[group.key] = [];
        }
      }

      const reqs = [];
      butt_keys_array = Object.keys(butts_by_key);

      for (let i = 0; i < butt_keys_array.length; i++) {
        reqs.push(promise_request(glob.base_url + '/catalog/categories_get/butt_' + butt_keys_array[i]));
        reqs.push(promise_request(glob.base_url + '/catalog/items_get/butt_' + butt_keys_array[i]));
      }

      inits.push(() => Promise.all(reqs));
      callbacks.push((data) => {
        const reqs_result = data;

        for (let i = 0; i < butt_keys_array.length; i++) {
          const data = {
            categories: reqs_result[i * 2],
            items: reqs_result[i * 2 + 1],
          }

          if (data && data.items) {
            for (let i = 0; i < data.items.length; i++) {
              const id = data.items[i].id;
              data.items[i] = JSON.parse(data.items[i].data);
              data.items[i].id = id;

              if (data.items[i].params) {
                continue;
              }

              data.items[i].params = {};
              data.items[i].params.color = data.items[i].color;
              data.items[i].params.map = data.items[i].map;
              data.items[i].params.metalness = data.items[i].metalness;
              data.items[i].params.roughness = data.items[i].roughness;
              data.items[i].params.transparent = data.items[i].transparent;

              data.items[i].add_params = {};
              data.items[i].add_params.real_height = data.items[i].real_height;
              data.items[i].add_params.real_width = data.items[i].real_width;
              data.items[i].add_params.stretch_height = data.items[i].stretch_height;
              data.items[i].add_params.stretch_width = data.items[i].stretch_width;
              data.items[i].add_params.wrapping = data.items[i].wrapping;
            }
          }

          butts_by_key[butt_keys_array[i]] = data;

          const category_0 = {
            id: 0,
            parent: 0,
            code: '',
            name: 'Категория в базе не найдена',
            items: [],
            categories: []
          };

          const item_params = {
            id: 0, //id
            name: '', //Название
            code: '', //артикул
            key: '', //ключ материала
            icon: '', //Иконка
            category: [], //Категории
            active: 1, //активность
            order: 10000, //порядок отображения
            params: {
              butt: {
                id: 0,
                key: 'butts'
              },
              mat_mode: 1,
              material: 0,
              mat_params: {},
              variants: [{
                name: '',
                code: '',
                width: 0, //Ширина листа number
                height: 0, //Высота листа number
                thickness: 0, //Толщина материала number
                price: 0, //цена number
                price_mode: 'c', //select
                price_type: 'm2', // select
                price_acc_id: 0,
                params: {}
              }]
            },
          };

          const newlib = new lib(item_params, category_0);
          convert_lib_multi_cat(newlib, data);
          pp.libs.butts[butt_keys_array[i]] = newlib;
        }
      });
    });
  }

  //_params_items
  inits.push(() => promise_request(glob.base_url + '/catalog/items_get/' + glob.controller_name + '_params'));
  callbacks.push((data) => {
    let p_data = data;
    for (let i = 0; i < p_data.length; i++) {
      let data = JSON.parse(p_data[i].data);
      data.active = p_data[i].active
      params_hash['p' + data.id] = data
    }
  });

  // inits.push(() => promise_request(glob.base_url + '/catalog/items_get/materials_groups'));
  // callbacks.push((data) => {
  //     materials_groups = data;

  //     if (data) {
  //         for (let i = 0; i < data.length; i++) {
  //             data[i] = JSON.parse(data[i].data);
  //             materials_groups_hash[data[i].key] = data[i];
  //         }
  //     }
  // });

  // inits.push(() => promise_request(glob.base_url + '/catalog/items_get/material_types'));
  // callbacks.push((data) => {
  //     let mats = data;

  //     for (let i = 0; i < mats.length; i++) {
  //         let it = mats[i]
  //         it.data = JSON.parse(it.data);

  //         if (!it.data.variants[it.data.default]) {
  //             it.data.default = Object.keys(it.data.variants)[0]

  //         }

  //         materials[it.key] = it.data;
  //     }
  // });

  // inits.push(() => promise_request(glob.base_url + '/catalog/get_global_vars'));
  // callbacks.push((data) => {
  //     global_vars = data?.value ? JSON.parse(data.value) : [];

  //     if (!Array.isArray(global_vars)) {
  //         global_vars = [];
  //     }

  //     for (const global_var of global_vars) {
  //         if (!Array.isArray(global_var.vars)) {
  //             global_var.vars = [];
  //         }
  //     }

  //     pp.variables.global_vars = global_vars;
  //     pp.variables.selected_index = global_vars.findIndex((x) => x.default);

  //     for (const global_var of pp.variables.global_vars) {
  //         global_var.vars_hash = _.keyBy(global_var.vars, "key");
  //     }
  // });

  if (!is_materials_from_json) {
    inits.push(() => Promise.all([
      promise_request(glob.base_url + '/catalog/categories_get/facades'),
      promise_request(glob.base_url + '/catalog/items_get/facades'),
    ]));
    callbacks.push((data) => {
      facades_data = {
        categories: data[0],
        items: data[1]
      }

      facades_hash = get_hash(facades_data.items);
      facades_cat_hash = get_hash(facades_data.categories);

      for (let i = 0; i < facades_data.items.length; i++) {
        if (!facades_data.items[i].data) continue

        const id = facades_data.items[i].id;
        const data = JSON.parse(facades_data.items[i].data);

        facades_data.items[i] = data;
        facades_data.items[i].id = id;
      }
    });
  }

  if (!is_materials_from_json) {
    inits.push(() => Promise.all([
      promise_request(glob.base_url + '/catalog/categories_get/cabinet_model'),
      promise_request(glob.base_url + '/catalog/items_get/cabinet_model'),
    ]));
    callbacks.push((data) => {
      model_data = {
        categories: data[0],
        items: data[1]
      }

      for (let i = 0; i < model_data.items.length; i++) {
        model_data.items[i].params = JSON.parse(model_data.items[i].data).params
      }
    });
  }

  if (!is_materials_from_json) {
    inits.push(() => Promise.all([
      promise_request(glob.base_url + '/catalog/categories_get/handles'),
      promise_request(glob.base_url + '/catalog/items_get/handles'),
    ]));
    callbacks.push((data) => {
      handles_data = {
        categories: data[0],
        items: data[1]
      }

      for (let i = 0; i < handles_data.items.length; i++) {
        try {
          handles_data.items[i].type_params = JSON.parse(handles_data.items[i].type_params)
        } catch (error) {
          handles_data.items[i].type_params = {};
        }
        handles_data.items[i].material = JSON.parse(handles_data.items[i].material)
        handles_data.items[i].sizes = JSON.parse(handles_data.items[i].variants)
      }

      handles_hash = get_hash(handles_data.items);
      handles_cat_hash = get_hash(handles_data.categories);
    });
  }

  if (is_materials_from_json) {
    // inits.push(() => promise_request(glob.acc_url + 'data/cokol.json' + '?' + date_time));
    // callbacks.push((data) => {
    //     cokol_data = {
    //         categories: data.categories,
    //         items: data.items
    //     }

    //     // for (let i = 0; i < cokol_data.items.length; i++) {
    //     //     cokol_data.items[i].category = JSON.parse(cokol_data.items[i].category)

    //     //     const id = cokol_data.items[i].id;
    //     //     const data = JSON.parse(cokol_data.items[i].data);
    //     //     cokol_data.items[i] = data ? data : {};
    //     //     cokol_data.items[i].id = id;
    //     // }
    // });
  } else {
    inits.push(() => Promise.all([
      promise_request(glob.base_url + '/catalog/categories_get/cokol'),
      promise_request(glob.base_url + '/catalog/items_get/cokol'),
    ]));
    callbacks.push((data) => {
      cokol_data = {
        categories: data[0],
        items: data[1]
      }

      for (let i = 0; i < cokol_data.items.length; i++) {
        cokol_data.items[i].category = JSON.parse(cokol_data.items[i].category)

        const id = cokol_data.items[i].id;
        const data = JSON.parse(cokol_data.items[i].data);
        cokol_data.items[i] = data ? data : {};
        cokol_data.items[i].id = id;
      }
    });
  }

  if (is_materials_from_json) {
    // inits.push(() => promise_request(glob.acc_url + 'data/cokol_top.json' + '?' + date_time));
    // callbacks.push((data) => {
    //     cokol_top_data = {
    //         categories: data.categories,
    //         items: data.items
    //     }

    //     // for (let i = 0; i < cokol_top_data.items.length; i++) {
    //     //     cokol_top_data.items[i].category = JSON.parse(cokol_top_data.items[i].category)

    //     //     const id = cokol_top_data.items[i].id;
    //     //     const data = JSON.parse(cokol_top_data.items[i].data);
    //     //     cokol_top_data.items[i] = data ? data : {};
    //     //     cokol_top_data.items[i].id = id;
    //     // }
    // });
  } else {
    inits.push(() => Promise.all([
      promise_request(glob.base_url + '/catalog/categories_get/cokol_top'),
      promise_request(glob.base_url + '/catalog/items_get/cokol_top'),
    ]));
    callbacks.push((data) => {
      cokol_top_data = {
        categories: data[0],
        items: data[1]
      }

      for (let i = 0; i < cokol_top_data.items.length; i++) {
        cokol_top_data.items[i].category = JSON.parse(cokol_top_data.items[i].category)

        const id = cokol_top_data.items[i].id;
        const data = JSON.parse(cokol_top_data.items[i].data);
        cokol_top_data.items[i] = data ? data : {};
        cokol_top_data.items[i].id = id;
      }
    });
  }

  if (is_materials_from_json) {
    // inits.push(() => promise_request(glob.acc_url + 'data/model_materials.json' + '?' + date_time));
    // callbacks.push((data) => {
    //     model_key_material_data = {
    //         categories: data.categories,
    //         items: data.items
    //     }

    //     // for (let i = 0; i < model_key_material_data.items.length; i++) {
    //     //     model_key_material_data.items[i].category = JSON.parse(model_key_material_data.items[i].category)

    //     //     const id = model_key_material_data.items[i].id;
    //     //     const data = JSON.parse(model_key_material_data.items[i].data);
    //     //     model_key_material_data.items[i] = data ? data : {};
    //     //     model_key_material_data.items[i].id = id;
    //     // }
    // });
  } else {
    inits.push(() => Promise.all([
      promise_request(glob.base_url + '/catalog/categories_get/model_key_material'),
      promise_request(glob.base_url + '/catalog/items_get/model_key_material'),
    ]));
    callbacks.push((data) => {
      model_key_material_data = {
        categories: data[0],
        items: data[1]
      }

      for (let i = 0; i < model_key_material_data.items.length; i++) {
        model_key_material_data.items[i].category = JSON.parse(model_key_material_data.items[i].category)

        const id = model_key_material_data.items[i].id;
        const data = JSON.parse(model_key_material_data.items[i].data);
        model_key_material_data.items[i] = data ? data : {};
        model_key_material_data.items[i].id = id;
      }
    });
  }

  // inits.push(() => Promise.all([
  //     promise_request(glob.base_url + '/catalog/categories_get/legs'),
  //     promise_request(glob.base_url + '/catalog/items_get/legs'),
  // ]));
  // callbacks.push((data) => {
  //     legs_data = {
  //         categories: data[0],
  //         items: data[1]
  //     }

  //     for (let i = 0; i < legs_data.items.length; i++) {
  //         legs_data.items[i].category = JSON.parse(legs_data.items[i].category)

  //         const id = legs_data.items[i].id;
  //         const data = JSON.parse(legs_data.items[i].data);
  //         legs_data.items[i] = data ? data : {};
  //         legs_data.items[i].id = id;
  //     }
  // });

  if (is_materials_from_json) {
    // inits.push(() => promise_request(glob.acc_url + 'data/cornice.json' + '?' + date_time));
    // callbacks.push((data) => {
    //     cornice_data = {
    //         categories: data.categories,
    //         items: data.items
    //     }

    //     // for (let i = 0; i < cornice_data.items.length; i++) {
    //     //     cornice_data.items[i].category = JSON.parse(cornice_data.items[i].category)

    //     //     const id = cornice_data.items[i].id;
    //     //     const data = JSON.parse(cornice_data.items[i].data);
    //     //     cornice_data.items[i] = data ? data : {};
    //     //     cornice_data.items[i].id = id;
    //     // }
    // });
  } else {
    inits.push(() => Promise.all([
      promise_request(glob.base_url + '/catalog/categories_get/cornice'),
      promise_request(glob.base_url + '/catalog/items_get/cornice'),
    ]));
    callbacks.push((data) => {
      cornice_data = {
        categories: data[0],
        items: data[1]
      }

      for (let i = 0; i < cornice_data.items.length; i++) {
        cornice_data.items[i].category = JSON.parse(cornice_data.items[i].category)

        const id = cornice_data.items[i].id;
        const data = JSON.parse(cornice_data.items[i].data);
        cornice_data.items[i] = data ? data : {};
        cornice_data.items[i].id = id;
      }
    });
  }

  if (is_materials_from_json) {
    // inits.push(() => promise_request(glob.acc_url + 'data/tabletop.json' + '?' + date_time));
    // callbacks.push((data) => {
    //     tabletop_data = {
    //         categories: data.categories,
    //         items: data.items
    //     }

    //     // for (let i = 0; i < tabletop_data.items.length; i++) {
    //     //     tabletop_data.items[i].category = JSON.parse(tabletop_data.items[i].category)

    //     //     const data = JSON.parse(tabletop_data.items[i].data);
    //     //     tabletop_data.items[i].params = data.params ? data.params : {};
    //     //     delete tabletop_data.items[i].data;
    //     // }
    // });
  } else {
    inits.push(() => Promise.all([
      promise_request(glob.base_url + '/catalog/categories_get/tabletop'),
      promise_request(glob.base_url + '/catalog/items_get/tabletop'),
    ]));
    callbacks.push((data) => {
      tabletop_data = {
        categories: data[0],
        items: data[1]
      }

      for (let i = 0; i < tabletop_data.items.length; i++) {
        tabletop_data.items[i].category = JSON.parse(tabletop_data.items[i].category)

        const data = JSON.parse(tabletop_data.items[i].data);
        tabletop_data.items[i].params = data.params ? data.params : {};
        delete tabletop_data.items[i].data;
      }
    });
  }

  if (is_materials_from_json) {
    // inits.push(() => promise_request(glob.acc_url + 'data/tabletop_plints.json' + '?' + date_time));
    // callbacks.push((data) => {
    //     bort_data = {
    //         categories: data.categories,
    //         items: data.items
    //     }

    //     // for (let i = 0; i < bort_data.items.length; i++) {
    //     //     bort_data.items[i].category = JSON.parse(bort_data.items[i].category)

    //     //     const id = bort_data.items[i].id;
    //     //     const data = JSON.parse(bort_data.items[i].data);
    //     //     bort_data.items[i] = data ? data : {};
    //     //     bort_data.items[i].id = id;
    //     // }
    // });
  } else {
    inits.push(() => Promise.all([
      promise_request(glob.base_url + '/catalog/categories_get/tabletop_plinth'),
      promise_request(glob.base_url + '/catalog/items_get/tabletop_plinth'),
    ]));
    callbacks.push((data) => {
      bort_data = {
        categories: data[0],
        items: data[1]
      }

      for (let i = 0; i < bort_data.items.length; i++) {
        bort_data.items[i].category = JSON.parse(bort_data.items[i].category)

        const id = bort_data.items[i].id;
        const data = JSON.parse(bort_data.items[i].data);
        bort_data.items[i] = data ? data : {};
        bort_data.items[i].id = id;
      }
    });
  }

  if (is_materials_from_json) {
    // inits.push(() => promise_request(glob.acc_url + 'data/furniture.json' + '?' + date_time));
    // callbacks.push((data) => {
    //     furniture_data = {
    //         categories: data.categories,
    //         items: data.items
    //     }

    //     // for (let i = 0; i < furniture_data.items.length; i++) {
    //     //     furniture_data.items[i].category = JSON.parse(furniture_data.items[i].category)

    //     //     const data = JSON.parse(furniture_data.items[i].data);
    //     //     merge(furniture_data.items[i], data ? data : {});
    //     //     delete furniture_data.items[i].data;
    //     // }
    // });
  } else {
    inits.push(() => Promise.all([
      promise_request(glob.base_url + '/catalog/categories_get/furniture'),
      promise_request(glob.base_url + '/catalog/items_get/furniture'),
    ]));
    callbacks.push((data) => {
      furniture_data = {
        categories: data[0],
        items: data[1]
      }

      for (let i = 0; i < furniture_data.items.length; i++) {
        furniture_data.items[i].category = JSON.parse(furniture_data.items[i].category)

        const data = JSON.parse(furniture_data.items[i].data);
        merge(furniture_data.items[i], data ? data : {});
        delete furniture_data.items[i].data;
      }
    });
  }

  if (glob.item_id != 0) {
    inits.push(() => promise_request(glob.base_url + '/catalog/' + glob.i_method_name + '/' + glob.controller_name +
      '/' + glob.item_id));
    callbacks.push((data) => {
      item = data;
    });
  }

  while (inits.length) {
    const promises_data = await Promise.all(_.map(inits, (init) => init()));
    inits.splice(0);

    const callbacks_copy = [...callbacks];
    callbacks.splice(0);

    _.forEach(callbacks_copy, (callback, i) => callback(promises_data[i]));
  }

  sc.init_catalog_size_hash();

  setTimeout(async () => {
    if (is_materials_from_json) {
      inits.push(() => promise_request(glob.acc_url + 'data/accessories.json' + '?' + date_time));
      callbacks.push((data) => {
        accessories = Object.values(data.items);
        accessories_types = [];

        for (let i = 0; i < accessories_types.length; i++) {
          accs_by_type[accessories_types[i].key] = [];
        }

        for (let i = 0; i < accessories.length; i++) {
          if (accs_by_type[accessories[i].type]) {
            accs_by_type[accessories[i].type].push(accessories[i]);
          }

          accessories_hash[accessories[i].id] = accessories[i];
        }
      });
    } else {
      inits.push(() => {
        let data_url = glob.base_url + '/modules/get_accessories_data_ajax/';
        return promise_request(data_url);
      });
      callbacks.push((data) => {
        accessories = data.accessories;
        accessories_types = data.accessories_types;

        for (let i = 0; i < accessories_types.length; i++) {
          accs_by_type[accessories_types[i].key] = [];
        }

        for (let i = 0; i < accessories.length; i++) {
          if (accs_by_type[accessories[i].type]) {
            accs_by_type[accessories[i].type].push(accessories[i]);
          }

          accessories_hash[accessories[i].id] = accessories[i];
        }
      });
    }

    while (inits.length) {
      const promises_data = await Promise.all(_.map(inits, (init) => init()));
      inits.splice(0);

      const callbacks_copy = [...callbacks];
      callbacks.splice(0);

      _.forEach(callbacks_copy, (callback, i) => callback(promises_data[i]));
    }
  }, 700);
}

async function load_items_and_init_vue() {

  if (document.getElementById('item_id')) {
    item_id = document.getElementById('item_id').value;
  }

  lang_data = {};
  lang_div = document.getElementById('lang_phrases');

  for (let i = 0; i < lang_div.children.length; i++) {
    lang_data[lang_div.children[i].id] = lang_div.children[i].innerHTML;
  }

  await load_data();

  init_vue();
}

function init_vue() {
  app = new Vue({
    el: '#sub_form',
    data: {
      item: null,
      errors: [],
      options_ready: false
    },
    created: function() {
      this.$options.element_type = this.get_element_type_from_url();

      this.$options.facades_data = facades_data;
      this.$options.facades_hash = facades_hash;
      this.$options.facades_cat_hash = facades_cat_hash;
      this.$options.handles_data = handles_data;
      this.$options.handles_hash = handles_hash;
      this.$options.handles_cat_hash = handles_cat_hash;

      this.$options.cat_ordered = cat_ordered
      this.$options.categories = categories

      this.$options.lang = glob.lang;

      this.$options.accessories = accessories
      this.$options.accessories_types = accessories_types
      this.$options.accessories_hash = accessories_hash
      this.$options.accs_by_type = accs_by_type

      this.$options.params_hash = params_hash

      configurator_v2_init();

    },
    mounted: function() {
      let scope = this;

      let inter = setInterval(function() {

        if (scene !== undefined && project_settings !== undefined) {
          clearInterval(inter);

          if (!project_settings.kitchen) {
            project_settings.kitchen = {};
          }
          project_settings.kitchen.defaults = defaults_data || {};

          // custom_settings.forced_mat_opacity = true;

          set_obj.materials = materials;

          // materials_lib = new lib(material_0, category_0);
          convert_lib(materials_lib, decor_data)

          materials_catalog = decor_data;
          materials_catalog.categories.push({
            id: 0,
            name: 'Без категории'
          })
          materials_catalog.items.push({
            id: 0,
            category: 0,
            name: 'Материал не найден',
            code: '',
            params: {
              color: '#ffffff'
            },
            add_params: {}
          })

          models_lib = new lib(material_0, category_0)
          convert_lib(models_lib, model_data)

          handles_lib = new lib(handles_0, category_0)
          convert_lib(handles_lib, handles_data)
          pp.libs.handles = handles_lib

          let cokol_0 = {
            name: '',
            code: '',
            icon: '',
            category: [],
            active: 1,
            order: 10000,
            params: {
              mat_mode: 0,
              material: 0,
              mat_params: {},
              models: {
                common: {
                  enabled: 1,
                  model: '',
                  code: '',
                  price_mode: 'm',
                  price: 0,
                  acc_id: 0
                },
                radius: {
                  enabled: 1,
                  model: '',
                  code: '',
                  price_mode: 'm',
                  price: 0,
                  acc_id: 0
                },
                radius_i: {
                  enabled: 1,
                  model: '',
                  code: '',
                  price_mode: 'm',
                  price: 0,
                  acc_id: 0
                }
              },
              accs: [],
              conns: {
                a0: {
                  enabled: 1,
                  model: '',
                  code: '',
                  price_mode: 'm',
                  price: 0,
                  acc_id: 0
                },
                a180: {
                  enabled: 1,
                  model: '',
                  code: '',
                  price_mode: 'm',
                  price: 0,
                  acc_id: 0
                },
                a90: {
                  enabled: 1,
                  model: '',
                  code: '',
                  price_mode: 'm',
                  price: 0,
                  acc_id: 0
                },
                a135: {
                  enabled: 1,
                  model: '',
                  code: '',
                  price_mode: 'm',
                  price: 0,
                  acc_id: 0
                }
              },
              height: 0,
              thickness: 0,
              width: 0
            }
          }

          cokol_lib = new lib(cokol_0, category_0)
          convert_lib_multi_cat(cokol_lib, cokol_data)
          libs.cokol = cokol_lib
          pp.libs.cokol = cokol_lib

          cokol_top_lib = new lib(cokol_0, category_0)
          convert_lib_multi_cat(cokol_top_lib, cokol_top_data)
          libs.cokol_top = cokol_top_lib
          pp.libs.cokol_top = cokol_top_lib

          let legs_0 = {
            name: '',
            code: '',
            icon: '',
            category: [],
            active: 1,
            order: 10000,
            params: {
              mat_mode: 0,
              material: 0,
              mat_params: {},
              model_params: {
                enabled: true,
                model: '',
                code: '',
                price_type: 'p',
                price_mode: 'm',
                price: 0,
                acc_id: 0
              },
              accs: [],
              width: 0,
              height: 0,
              thickness: 0
            }
          };

          convert_lib_multi_cat(pp.libs.model_materials, model_key_material_data)

          legs_lib = new lib(legs_0, category_0)
          legs_data && convert_lib_multi_cat(legs_lib, legs_data)
          libs.legs = legs_lib
          pp.libs.legs = legs_lib

          let tabletop_0 = {
            id: 0,
            name: 'Столешница',
            code: '',
            has_trap: 0,
            icon: '',
            category: ['0'],
            active: 1,
            order: 10000,
            params: {
              mat_mode: 0,
              material: 0,
              mat_params: {},
              variants: [{
                name: '',
                code: '',
                width: 3000,
                height: 600,
                thickness: 40,
                price: 0,
                price_mode: 'm',
                price_type: 'p',
                price_acc_id: 0,
                params: {}
              }],
              trap_variants: [],
            },
            prices: {
              common: 0,
              trap: 0
            },
            accessories: {
              conn: 0,
              end: 0
            }
          };

          let item_params = {
            id: 0, //id
            name: '',
            code: '',
            has_trap: 0,
            icon: '',
            category: [],
            active: 1,
            order: 10000,
            params: {
              mat_mode: 0,
              material: 0,
              mat_params: {},
              variants: [{
                name: '',
                code: '',
                width: 0, //Ширина листа number
                height: 0, //Высота листа number
                thickness: 0, //Толщина материала number
                price: 0, //цена number
                price_mode: 'c', //select
                price_type: 'm2', // select
                price_acc_id: 0,
                params: {}
              }],
              trap_variants: [],
            },
            prices: {
              common: 0,
              trap: 0
            },
            accessories: {
              conn: 0,
              end: 0
            }
          };

          for (let i = 0; i < tabletop_data.items.length; i++) {
            let item = tabletop_data.items[i];
            let params = _.merge(copy_object(item_params), copy_object(item));

            if (params.params.materials_mode) {
              params.params.variants.splice(0, 1)
              params.params.mat_mode = 1;
              params.params.variants.push({
                name: params.name,
                code: params.code,
                width: params.params.width, //Ширина листа number
                height: params.params.depth, //Высота листа number
                thickness: params.params.height, //Толщина материала number
                price: params.prices.common, //цена number
                price_mode: 'm', //select
                price_type: 'p', // select
                price_acc_id: 0,
                params: {}
              })
            }

            delete params.code_trap;
            delete params.mat_categories;
            delete params.name_trap;
            delete params.params.depth;
            delete params.params.height;
            delete params.params.materials_mode;
            delete params.params.width;
            delete params.prices;

            tabletop_data.items[i] = params;
          }

          tabletop_lib = new lib(tabletop_0, category_0)
          convert_lib_multi_cat(tabletop_lib, tabletop_data)
          libs.tabletop = tabletop_lib
          pp.libs.tabletop = tabletop_lib

          let bort_0 = {
            id: 0,
            name: '',
            code: '',
            icon: '',
            category: '0',
            active: 1,
            order: 10000,
            models: {
              common: ''
            },
            accs: [],
            params: {
              height: 0,
              depth: 0,
              item_width: 0,
              material: 0
            },
            price: 0,
            price_acc: 0,
          };

          bort_lib = new lib(bort_0, category_0)
          convert_lib_multi_cat(bort_lib, bort_data)
          libs.bort = bort_lib
          pp.libs.bort = bort_lib

          let furniture_0 = {
            name: '',
            code: '',
            icon: '',
            category: [],
            active: 1,
            order: 10000,
            params: {
              spec: {
                name: '',
                code: '',
              },
            }
          };

          const furniture_lib = new lib(furniture_0, category_0);

          convert_lib_multi_cat(furniture_lib, furniture_data);
          libs.furniture = furniture_lib;
          pp.libs.furniture = furniture_lib;

          let cornice_0 = {
            name: '',
            code: '',
            icon: '',
            category: [],
            active: 1,
            order: 10000,
            params: {
              mat_mode: 0,
              material: 0,
              p_mat_key: "",
              p_mat: 0,
              p_variant: 0,
              mat_params: {},
              models: {
                common: {
                  enabled: true,
                  model: '',
                  code: '',
                  price_type: 'p',
                  price_mode: 'c',
                  price: 0,
                },
                radius: {
                  enabled: false,
                  model: '',
                  code: '',
                  price_type: 'p',
                  price_mode: 'c',
                  price: 0,
                }
              },
              accs: [],
              height: 0,
              thickness: 0,
              width: 0,
              front_offset: 0,
            },
          };

          for (let i = 0; i < cornice_data.items.length; i++) {
            let it = _.merge(copy_object(cornice_0), copy_object(cornice_data.items[i]));
            if (it.materials) {
              it.params.models.common.code = cornice_data.items[i].code

              if (it.params.materials_mode == 'i') {
                it.params.mat_mode = 1
                it.params.material = cornice_data.items[i].materials[0]
              }

              delete it.materials
            }
            delete it.models
            delete it.items

            cornice_data.items[i] = it;
          }

          cornice_0.params.models.common.model = '/common_assets/models/cornice_new.fbx';
          cornice_0.params.models.radius.model = '/common_assets/models/cornice_radius_new.fbx';

          cornice_lib = new lib(cornice_0, category_0);
          convert_lib_multi_cat(cornice_lib, cornice_data);
          libs.cornice = cornice_lib;
          pp.libs.cornice = cornice_lib;

          pp.libs.catalog = catalog_lib;
          pp.libs.models = models_lib;

          // facades_lib = new lib(material_0, category_0);
          // convert_lib(facades_lib, facades_data);

          facades_sets = facades_data.items;
          convert_facades();

          facades_lib = new lib(material_0, category_0)
          facades_lib.get_item = function(id) {
            if (this.items[id]) {
              let copy = copy_object(this.items[id]);
              if (!copy.additional_materials) copy.additional_materials = {};
              return copy;
            } else {
              return copy_object({
                "id": 0,
                "active": "0",
                "order": 100000,
                "name": "Default",
                "compatibility_types": {
                  "full": 0
                },
                "category": 0,
                "materials": [
                  0
                ],
                "prices": [],
                "icon": "",
                "handle": 1,
                "handle_offset": 30,
                "thickness": 18,
                "types": [{
                    "name": "Глухой",
                    "icon": "",
                    "items": [{
                      "min_width": 0,
                      "min_height": 0,
                      "model": "/common_assets/models/facades/7/plastic_full.fbx",
                      "group": "all"
                    }],
                    "thickness": 18,
                    "icon_file": ""
                  }

                ],
                "types_radius": [],
                "types_double": [],
                "types_triple": [],
                "double_offset": 0,
                "triple_decor_model": {
                  "model": "",
                  "model_file": "",
                  "current_model": "",
                  "thickness": 0,
                  "height": 0,
                  "offset": 0
                },
                "additional_materials": []
              })
            }
          }
          facades_lib.get_data = function(item_id) {
            let obj = {
              mat: '',
              cat: '',
              par_cat: '',
              str: ''
            }
            obj.mat = this.get_item(item_id);
            obj.cat = this.get_category(obj.mat.category);
            if (obj.cat.parent != 0) obj.par_cat = this.get_category(obj.cat.parent);

            obj.str = '';
            if (obj.cat.parent != 0) obj.str += obj.par_cat.name
            obj.str += ' ' + obj.cat.name;
            obj.str += ' ' + obj.mat.name;
            return obj;
          }
          facades_lib.get_defaults = function(group) {
            if (!group) group = 'top';
            return this.get_item(project_settings.defaults.facades[group])
          }

          convert_lib(facades_lib, {
            items: facades_sets,
            categories: facades_data.categories
          })

          facades_lib.side_items = [];
          for (let i = 0; i < facades_sets.length; i++) {
            if (facades_sets[i].active != 0 && facades_sets[i].has_side == 1) {
              facades_lib.side_items.push(facades_sets[i]);
            }
          }

          libs.facades = facades_lib;
          pp.libs.facades = facades_lib;

          if (project_settings.kitchen.defaults.facades && project_settings.kitchen.defaults.facades.id !==
            undefined) {
            const facades = {};

            const obj = {
              id: project_settings.kitchen.defaults.facades.id,
              materials: {
                "gen": project_settings.kitchen.defaults.facades.material
              }
            }

            const def_facade = pp.libs.facades.find_item(project_settings.kitchen.defaults.facades.id)

            Object.keys(def_facade.additional_materials || {}).forEach(key => {
              obj.materials[key] = def_facade.additional_materials[key]['selected'];
            })

            let cabinet_tags_keys = [];
            Object.keys(modules_groups).forEach(key => {
              cabinet_tags_keys.push(modules_groups[key].key)
            })

            for (let i = 0; i < cabinet_tags_keys.length; i++) {
              facades[cabinet_tags_keys[i]] = copy_object(obj)
            }

            project_settings.kitchen.defaults.facades = facades
          }

          pp.libs.modules_groups = modules_groups || [];

          if (!pp.libs.materials_info) {
            pp.libs.materials_info = {};
          }

          pp.libs.materials_info.groups = materials_groups || [];
          pp.libs.materials_info.keys = Object.values(materials_keys_hash).map(group => group.data ||
            group) || [];

          const cabinet_tags = {};
          const mat_groups = {};

          for (const modules_group of pp.libs.modules_groups) {
            cabinet_tags[modules_group.key] = copy_object(modules_group);
          }

          for (const mat_group of pp.libs.materials_info.groups) {
            mat_groups[mat_group.key] = copy_object(mat_group);
          }

          const cabinet_tags_keys = Object.keys(cabinet_tags);

          //фасады

          if (project_settings.kitchen?.defaults?.facades && project_settings.kitchen.defaults.facades.id !==
            undefined) {
            const facades = {};

            const obj = {
              id: project_settings.kitchen.defaults.facades.id,
              materials: {
                "gen": project_settings.kitchen.defaults.facades.material,
                "glass": project_settings.selected_materials.glass
              }
            }

            const def_facade = pp.libs.facades.find_item(project_settings.kitchen.defaults.facades.id)
            Object.keys(def_facade.additional_materials || {}).forEach(key => {
              obj.materials[key] = def_facade.additional_materials[key]['selected'];
            })

            for (let i = 0; i < cabinet_tags_keys.length; i++) {
              facades[cabinet_tags_keys[i]] = copy_object(obj)
            }

            project_settings.kitchen.defaults.facades = facades
          }

          for (const mat_group of Object.values(mat_groups)) {
            if (!mat_group.available) {
              mat_group.available = [];
            }

            for (const current_mat of mat_group.available) {
              if (current_mat.key === undefined) {
                current_mat.key = "ldsp";
              }

              if (current_mat.thickness === undefined) {
                current_mat.thickness = [];
              }

              if (current_mat.categories === undefined) {
                current_mat.categories = [];
              }
            }

            mat_group.selected = {};

            for (const cab_group_key of cabinet_tags_keys) {
              if (mat_group.material) {
                mat_group.selected[cab_group_key] = copy_object(mat_group.material);
              } else {

              }

            }
          }

          project_settings.kitchen.cabinet_tags = cabinet_tags;
          project_settings.kitchen.mat_groups = mat_groups;

          let params = {
            spec: {}
          };

          if (item) {
            item.category = item.category ? JSON.parse(item.category) : [];

            console.log(copy_object(JSON.parse(item.data)))

            params = JSON.parse(item.data).params;

            delete item.data;

            if (!params.variables) {
              params.variables = {};
            }

            params.variables = fix_json_empty_object(params.variables);

            if (!params.variables.main) {
              params.variables.main = {};
            }

            params.variables.main = fix_json_empty_object(params.variables.main);
          } else {
            item = {};
          }

          params.spec.element_type = scope.$options.element_type;

          //Для размеров
          if (params.spec.variants !== undefined) {
            for (let i = 0; i < params.spec.variants.length; i++) {
              if (params.spec.variants[i].params_item == undefined) {
                //Нет ключа
                params.spec.variants[i]['params_item'] = {};
                Object.values(params_hash).forEach(obj => {
                  if (obj.site == 1) {
                    const params_i = params.spec.variants[i].params_item;
                    //params_i['p' + obj.id] = obj.params.default;
                    if (obj.params.type == 'list') {
                      params_i['p' + obj.id] = {
                        name: obj.name,
                        data: obj.params.options,
                      }
                    } else {
                      params_i['p' + obj.id] = {
                        name: obj.name,
                        data: obj.params.default,
                      }
                    }
                  }
                })
              } else if (Array.isArray(params.spec.variants[i].params_item)) {
                //Массив
                params.spec.variants[i]['params_item'] = {};
                Object.values(params_hash).forEach(obj => {
                  if (obj.site == 1) {
                    const params_i = params.spec.variants[i].params_item;
                    //params_i['p' + obj.id] = obj.params.default;
                    if (obj.params.type == 'list') {
                      params_i['p' + obj.id] = {
                        name: obj.name,
                        data: obj.params.options,
                      }
                    } else {
                      params_i['p' + obj.id] = {
                        name: obj.name,
                        data: obj.params.default,
                      }
                    }
                  }
                })
              } else if (Object.keys(params.spec.variants[i].params_item).length > 0) {
                //Не пустой объект
                //Есть, лишние удаляем, недостающие добавляем, остальные не трогаем.
                let p_item = params.spec.variants[i].params_item;
                Object.keys(p_item).forEach(key => {
                  if (!params_hash.hasOwnProperty(key)) {
                    delete p_item[key];
                  } else if (params_hash[key].site !== 1) {
                    delete p_item[key];
                  } else if (params_hash[key].params.type == 'list' && params_hash.hasOwnProperty(key)) {
                    //Имя параметра обновляем
                    p_item[key].name = params_hash[key].name;
                    Object.values(params_hash[key].params.options).forEach(i => {
                      if (Array.isArray(p_item[key].data)) {
                        if (!p_item[key].data.some(obj => obj.name === i.name)) {
                          //Нет в модуле, добоавляем параметр листа
                          p_item[key].data.push(i)
                        }
                      } else {
                        p_item[key].data = [];
                        p_item[key].data.push(i);
                      }
                    })
                    Object.values(p_item[key].data).forEach(i => {
                      if (!params_hash[key].params.options.some(obj => obj.name === i.name)) {
                        //Нет в шаблоне, удаялем
                        p_item[key].data = p_item[key].data.filter(item => item.name !== i.name)
                      }
                    })
                  } else {
                    //Имя параметра обновляем
                    p_item[key].name = params_hash[key].name;
                  }
                })
                Object.keys(params_hash).forEach(key => {
                  if (!p_item.hasOwnProperty(key)) {
                    if (key.site == 1) {
                      const params_i = params.spec.variants[i].params_item;
                      //params_i[key] = params_hash[key].params.default;
                      if (obj.params.type == 'list') {
                        params_i['p' + obj.id] = {
                          name: obj.name,
                          data: obj.params.options,
                        }
                      } else {
                        params_i['p' + obj.id] = {
                          name: obj.name,
                          data: obj.params.default,
                        }
                      }
                    }
                  }
                })
              } else {
                //Пустой объект
                params.spec.variants[i]['params_item'] = {};
                Object.values(params_hash).forEach(obj => {
                  if (obj.site == 1) {
                    const params_i = params.spec.variants[i].params_item;
                    //params_i['p' + obj.id] = obj.params.default;
                    if (obj.params.type == 'list') {
                      params_i['p' + obj.id] = {
                        name: obj.name,
                        data: obj.params.options,
                      }
                    } else {
                      params_i['p' + obj.id] = {
                        name: obj.name,
                        data: obj.params.default,
                      }
                    }
                  }
                })
              }

              // if(params.spec.variants[i].params_item == undefined || params.spec.variants[i]?.params_item?.length == 0 || params.spec.variants[i]?.params_item?.length == undefined){
              //     //Нет параметров, добавляем те что в таблице
              //     params.spec.variants[i]['params_item'] = {};
              //         Object.values(params_hash).forEach( obj =>{
              //             if(obj.site == 1) {
              //                 const params_i = params.spec.variants[i].params_item;
              //                 params_i['p' + obj.id] = obj.params.default;
              //             }
              //         })
              // } else {
              //     //Есть, лишние удаляем, недостающие добавляем, остальные не трогаем.
              //     let p_item = params.spec.variants[i].params_item;
              //     Object.keys(p_item).forEach( key =>{
              //         if(!params_hash.hasOwnProperty(key)){
              //             delete p_item[key];
              //         } else if(params_hash[key].site !== 1) {
              //             delete p_item[key];
              //         }
              //     })
              //     Object.keys(params_hash).forEach( key =>{
              //         if(!p_item.hasOwnProperty(key)) {
              //             if(key.site == 1) {
              //                 const params_i = params.spec.variants[i].params_item;
              //                 params_i[key] = params_hash[key].params.default;
              //             }
              //         }
              //     })
              // }
            }
          }

          //Для модуля
          //if(params.spec.params_item == undefined || params.spec?.params_item?.length == 0 || params.spec?.params_item?.length == undefined) {
          if (params.spec.params_item == undefined) {
            //Нет параметров, добавляем те что в таблице
            //Пустые или нет дата

            params.spec['params_item'] = {};
            Object.values(params_hash).forEach(obj => {
              if (obj.site == 0) {
                const params_i = params.spec.params_item;
                //params_i['p' + obj.id] = obj.params.default;
                if (obj.params.type == 'list') {
                  params_i['p' + obj.id] = {
                    name: obj.name,
                    data: obj.params.options,
                  }
                } else {
                  params_i['p' + obj.id] = {
                    name: obj.name,
                    data: obj.params.default,
                  }
                }
              }
            })
          } else if (Array.isArray(params.spec.params_item)) {
            params.spec['params_item'] = {};
            Object.values(params_hash).forEach(obj => {
              if (obj.site == 0) {
                const params_i = params.spec.params_item;
                //params_i['p' + obj.id] = obj.params.default;
                if (obj.params.type == 'list') {
                  params_i['p' + obj.id] = {
                    name: obj.name,
                    data: obj.params.options,
                  }
                } else {
                  params_i['p' + obj.id] = {
                    name: obj.name,
                    data: obj.params.default,
                  }
                }
              }
            })
          } else if (Object.keys(params.spec.params_item).length > 0) {
            //Есть, лишние удаляем, недостающие добавляем, остальные не трогаем.
            let p_item = params.spec.params_item;
            Object.keys(p_item).forEach(key => {
              if (!params_hash.hasOwnProperty(key)) {
                delete p_item[key];
              } else if (params_hash[key].site !== 0) {
                delete p_item[key];
              } else if (params_hash[key].params.type == 'list' && params_hash.hasOwnProperty(key)) {
                //Имя параметра обновляем
                p_item[key].name = params_hash[key].name;
                Object.values(params_hash[key].params.options).forEach(i => {
                  if (Array.isArray(p_item[key].data)) {
                    if (!p_item[key].data.some(obj => obj.name === i.name)) {
                      //Нет в модуле, добоавляем параметр листа
                      p_item[key].data.push(i)
                    }
                  } else {
                    p_item[key].data = [];
                    p_item[key].data.push(i);
                  }
                })
                Object.values(p_item[key].data).forEach(i => {
                  if (!params_hash[key].params.options.some(obj => obj.name === i.name)) {
                    //Нет в шаблоне, удаялем
                    p_item[key].data = p_item[key].data.filter(item => item.name !== i.name)
                  }
                })
              } else {
                //Имя параметра обновляем
                p_item[key].name = params_hash[key].name;
              }
            })
            Object.keys(params_hash).forEach(key => {
              if (!p_item.hasOwnProperty(key)) {
                if (params_hash[key].site == 0) {
                  const params_i = params.spec.params_item;
                  if (params_hash[key].params.type == 'list') {
                    params_i[key] = {
                      name: params_hash[key].name,
                      data: params_hash[key].params.options,
                    }
                  } else {
                    params_i[key] = {
                      name: params_hash[key].name,
                      data: params_hash[key].params.default,
                    }
                  }
                }
              }
            })
          }

          item.params = fix_json_empty_object(params);

          console.log('~~~~~~~~~~');
          console.log(item.params);
          if (item_id) {
            params.spec.id = item_id;
          }

          item.params = params;

          Vue.set(scope, 'item', item);

          scope.options_ready = true;
        }

      }, 100)

    },
    methods: {
      get_element_type_from_url() {
        const url = window.location.pathname;

        const pattern = /catalog\/item\/catalog_([^/]+)/;

        const match = url.match(pattern);

        return (match && match[1]) || "";
      },
      submit: async function(e, to_index = false) {
        e.preventDefault();

        const data = this.$refs.config.get_item_data();
        const metadata = this.$refs.config.get_meta_data();

        ce('data')
        console.log(data);
        console.log(data.spec.params_item);
        ce('meta')
        console.log(metadata)

        this.errors = [];

        if (!data || !Object.keys(data).length) {
          this.errors.push(lang_data['error_no_template_selected']);
        }

        if (!data.spec.variants.length) {
          this.errors.push(lang_data['error_no_variants']);
        }

        if (!Array.isArray(metadata.category)) {
          metadata.category = [metadata.category];
        }

        if (this.errors.length) {
          return false;
        }

        let url = this.$refs.submit_url.value + glob.item_id

        if (!url) {
          return false;
        }

        const form_data = new FormData();

        metadata.cabinet_tag = data.spec.cabinet_tag;
        metadata.element_type = this.$options.element_type;
        metadata.catalog_type = data.spec.catalog_type;

        metadata.icon = data.icon;
        delete metadata.icon_file;

        for (const key of Object.keys(metadata)) {
          if (key === 'data') {
            continue;
          }

          if (key === 'category') {
            form_data.append(key, JSON.stringify(metadata[key]));
            continue;
          }

          form_data.append(key, metadata[key]);
        }

        form_data.append('data', JSON.stringify({
          ...metadata,
          params: data
        }));

        const res = await promise_request_post(url, form_data);

        if (res.result == 'success') {
          if (to_index == true) {
            location.href = this.$refs.success_url.value
          } else {
            if (glob.item_id == 0) {
              glob.item_id = res.id;
              document.getElementById('item_id').value = res.id;
              window.history.pushState(null, null, location.href + res.id)
            }
          }
          toastr.success(glob.lang['success'])
        } else {
          toastr.success(glob.lang['error'])
        }

        return false;
      },
    }
  });
}
