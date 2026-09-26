/**
 * КОД РАБОТЫ С ACCESSORIES (КОМПЛЕКТУЮЩИЕ) ИЗ РЕФЕРЕНСА PLANPLACE
 * 
 * Источник: main_core_v2_part18.js (CabinetSection класс)
 * 
 * ВАЖНО: Этот код показывает, как PlanPlace работает с комплектующими (accessories)
 * при создании и обновлении секций
 */

// ============================================
// 1. Инициализация accessories в конструкторе секции
// ============================================
// Строка 2464, 1980, 3351, 3596, 3677
// При создании секции accessories инициализируется как пустой массив:
// 'accessories': []

// ============================================
// 2. add_accessories() - добавление комплектующих
// ============================================
// Строка 4162-4177
function add_accessories(accessoryItem, count) {
    let index = -1;
    var params = this.userData.params;
    
    // Ищем, есть ли уже такой аксессуар
    for (let i = params.accessories.length; i--; ) {
        if (params.accessories[i].id == accessoryItem.id) {
            index = i;
            break;
        }
    }
    
    // Если нашли - увеличиваем count, если нет - добавляем новый
    if (index >= 0) {
        params.accessories[index].count += count;
    } else {
        params.accessories.push({
            id: accessoryItem.id,
            count: count,
            c: 1  // флаг активности
        });
    }
    
    // Эмитим события для обновления UI
    pp.interface.root.$emit('accessories_list_update');
    pp.interface.root.$emit('obj_price_update');
}

// ============================================
// 3. get_accessories() - получение списка комплектующих
// ============================================
// Строка 4178-4180
function get_accessories() {
    return this.userData.params.accessories;
}

// ============================================
// 4. remove_accessory() - удаление комплектующего
// ============================================
// Строка 4181-4189
function remove_accessory(accessoryId) {
    var params = this.userData.params;
    for (let i = params.accessories.length; i--; ) {
        if (params.accessories[i].id === accessoryId) {
            params.accessories.splice(i, 1);
            break;
        }
    }
    pp.interface.root.$emit('obj_price_update');
}

// ============================================
// 5. _get_specs_accessories() - получение комплектующих для спецификации
// ============================================
// Строка 4196-4245
function _get_specs_accessories(specData) {
    let section = this;
    var beforeCreate = pp.events?.cabinet?.before_create_spec_item;
    var afterCreate = pp.events?.cabinet?.after_create_spec_item;
    
    if (!specData) {
        specData = {
            all: {},
            sum: {},
            sum_arr: [],
            aggr_funcs: {}
        };
    }
    
    // 1. Обрабатываем accessories из params
    if (this.userData.params.accessories) {
        var accessories = this.userData.params.accessories;
        if (accessories) {
            for (let i = 0; i < accessories.length; i++) {
                processAccessory(specData, accessories[i]);
            }
        }
    }
    
    // 2. Обрабатываем accessories_default
    if (this.userData.params.accessories_default) {
        var accessoriesDefault = this.userData.params.accessories_default;
        if (accessoriesDefault) {
            for (let i = 0; i < accessoriesDefault.length; i++) {
                processAccessory(specData, accessoriesDefault[i]);
            }
        }
    }
    
    // 3. Обрабатываем accessories из выбранного варианта spec
    if (this.userData.params.spec?.variants?.[this.userData.params.spec.selected_variant]?.accessories) {
        var variantAccessories = this.userData.params.spec.variants[this.userData.params.spec.selected_variant].accessories;
        if (variantAccessories) {
            for (let i = 0; i < variantAccessories.length; i++) {
                processAccessory(specData, variantAccessories[i]);
            }
        }
    }
    
    // 4. Обрабатываем accessories из template
    if (this.userData.params.spec?.template?.accessories) {
        var templateAccessories = this.userData.params.spec.template.accessories;
        for (let i = 0; i < templateAccessories.length; i++) {
            processAccessory(specData, templateAccessories[i]);
        }
    }
    
    return specData;
    
    function processAccessory(specData, accessory) {
        var accessoryId = accessory.id;
        var accessoryCount = accessory.count;
        var accessoryData;
        
        // Вызываем событие before_create_spec_item, если есть
        if (beforeCreate && beforeCreate('item', section, accessoryId) === false) {
            return; // Пропускаем, если событие вернуло false
        }
        
        // Получаем данные аксессуара из accsessories_data
        accessoryData = accsessories_data.get_item(accessoryId);
        
        if (accessoryData) {
            // Вычисляем модификатор цены
            var priceMod = module_utils.get_price_mod('acc', null, accessoryData.category);
            
            // Устанавливаем свойства аксессуара
            accessoryData.count = parse_int(accessoryCount);
            accessoryData.price_type = 'p';
            accessoryData.type = 'item';
            accessoryData.price = parse_num(accessoryData.price_per_piece) * priceMod;
            accessoryData.sum_key = accessoryData.id + '_' + accessoryData.code + '_' + accessoryData.price_type;
            
            // Вызываем событие after_create_spec_item, если есть
            if (afterCreate) {
                afterCreate('item', section, accessoryData);
            }
            
            // Добавляем в спецификацию
            // ... (дальше идет логика добавления в specData)
        }
    }
}

// ============================================
// КЛЮЧЕВЫЕ МОМЕНТЫ:
// ============================================
// 1. accessories хранится в this.userData.params.accessories как массив объектов
// 2. Каждый объект имеет: { id, count, c }
// 3. При изменении accessories эмитятся события Vue: 'accessories_list_update' и 'obj_price_update'
// 4. accessories может быть из нескольких источников:
//    - params.accessories (пользовательские)
//    - params.accessories_default (по умолчанию)
//    - spec.variants[selected_variant].accessories (из варианта)
//    - spec.template.accessories (из шаблона)
// 5. Логи в консоли (accessories с items и count) могут быть из Vue.js реактивности
//    или из catalog_module (которого нет в референсах)
