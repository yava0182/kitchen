/**
 * КОД СОЗДАНИЯ СЕКЦИИ ИЗ РЕФЕРЕНСА PLANPLACE
 * 
 * Источник: main_core_v2_part18.js (CabinetSection класс)
 * 
 * ВАЖНО: Этот код показывает, как PlanPlace создает секции
 */

// ============================================
// 1. _build_struct() - создание структуры секции
// ============================================
// Строка 2576-2583
function _build_struct() {
    this.userData.struct = {};
    this.userData.own_object = new THREE.Group();
    this.userData.own_object.name = '__own_object';
    this.userData.struct[this.userData.own_object.name] = this.userData.own_object;
    this.userData.children = this.userData.own_object.children;
    this.add(this.userData.own_object);
}

// ============================================
// 2. _build_pos() - позиционирование секции
// ============================================
// Строка 2648-2656
function _build_pos() {
    var computed = this.userData.computed;
    var params = this.userData.params;
    var c_object = computed.c_object;
    
    computed.pos.x = comp2(params.pos.x, c_object);
    computed.pos.y = comp2(params.pos.y, c_object);
    computed.pos.z = comp2(params.pos.z, c_object);
    
    // ⭐ КЛЮЧЕВОЕ: Для root секции позиция применяется к own_object с центрированием
    if (this.userData.is_root) {
        this.userData.own_object.position.set(
            (-computed.size.x / 2 + computed.pos.x) / units, 
            computed.pos.y / units, 
            (-computed.size.z / 2 + computed.pos.z) / units
        );
    } else {
        // Для дочерней секции позиция применяется к самой секции (this.position)
        this.position.set(
            (-c_object.parent_size.x / 2 + computed.pos.x) / units, 
            (-c_object.parent_size.y / 2 + computed.pos.y) / units, 
            (-c_object.parent_size.z / 2 + computed.pos.z) / units
        );
    }
}

// ============================================
// 3. _build_children() - добавление детей в own_object
// ============================================
// Строка 2696-2755 (ключевая часть)
function _build_children() {
    var params = this.userData.params;
    var children = params.children || [];
    
    for (let i = 0; i < children.length; i++) {
        var childParams = children[i];
        var childPath = this.userData.path + ',' + i;
        
        // Создаем дочерний элемент (секция или деталь)
        var child = new pp.engine.item_types[childParams.type](childParams, {
            parent: this,
            root: this.userData.root,
            path: childPath
        });
        
        // ⭐ КЛЮЧЕВОЕ: Дети добавляются в own_object родителя!
        this.userData.own_object.add(child);
    }
}

// ============================================
// 4. _build_helpers() - создание визуальных помощников
// ============================================
// Строка 2860-2884
function _build_helpers() {
    var helpers = this.userData.helpers;
    var own_object = this.userData.own_object;
    var computed = this.userData.computed;
    
    helpers.name = '__helpers';
    
    // Создаем полупрозрачный куб
    var hull = make_cube(
        computed.u_size.x, 
        computed.u_size.y, 
        computed.u_size.z, 
        helper_cube_material
    );
    hull.userData.is_helper = true;
    helpers.add(hull);
    
    // Создаем черные ребра
    var edges = make_edges(
        computed.u_size.x, 
        computed.u_size.y, 
        computed.u_size.z, 
        helper_edges_material
    );
    edges.userData.is_helper = true;
    helpers.add(edges);
    
    // ⭐ КЛЮЧЕВОЕ: Helpers копируют позицию от own_object!
    helpers.position.copy(own_object.position);
    helpers.rotation.copy(own_object.rotation);
    
    this.add(helpers);
}

// ============================================
// ПОРЯДОК ВЫЗОВА (_build):
// ============================================
// 1. _build_struct() - создание own_object
// 2. _build_size() - вычисление размеров
// 3. _build_pos() - позиционирование (own_object для root, position для дочерней)
// 4. _build_rot() - поворот
// 5. _build_scale() - масштаб
// 6. _build_pivot() - pivot к own_object
// 7. _build_children() - добавление детей в own_object
// 8. _build_helpers() - создание визуальных помощников

// ============================================
// КЛЮЧЕВЫЕ МОМЕНТЫ:
// ============================================
// 1. Для root секции: own_object.position = (-size.x/2, 0, -size.z/2) - центрирование
// 2. Для дочерней секции: position = (-parent_size.x/2 + pos.x, ...) - относительно родителя
// 3. Дети добавляются в own_object родителя, НЕ напрямую в секцию
// 4. Helpers копируют позицию от own_object.position
