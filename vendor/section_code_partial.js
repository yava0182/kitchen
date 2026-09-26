/**
 * section_code_partial.js - Частичный код построения секций из PlanPlace
 * 
 * Это обфусцированный код, содержащий:
 * - Классы Section, Rotator, Slider
 * - Методы build(), animate(), mouse_move()
 * - Код для проекций (круги и плоскости)
 * 
 * ВАЖНО: Это не полный код построения секции с цветом 0x66ccff и рамкой 0x2a7bbf
 * Нужно найти больше кода, особенно где создается сама секция (frame, hull)
 */

// Код для проекций (круги и плоскости)
new THREE['Mesh'](new THREE['CircleGeometry'](this['userData']['params']['spec']['radius'] / units,0x28),new THREE['MeshStandardMaterial']({
    'color': this['userData']['params']['spec']['radius_color'],
    'side': THREE['FrontSide'],
    'blending': THREE['NormalBlending'],
    'forceSinglePass': !0x0,
    'transparent': !0x0,
    'opacity': projection_opacity_radius,
    'depthWrite': projecttion_depth_test,
    'depthTest': projecttion_depth_test
}))
, h = (h['userData']['mouse_events'] = !0x1,
h['position']['z'] += projection_offset_radius,
this['userData']['circle'] = h,
0x0 != this['userData']['params']['spec']['radius'] && g['add'](h),
new THREE['Mesh'](new THREE['PlaneGeometry'](this['userData']['params']['spec']['tolerance_x'] / units,this['userData']['params']['spec']['tolerance_y'] / units,0x1,0x1),new THREE['MeshStandardMaterial']({
    'color': this['userData']['params']['spec']['tolerance_color'],
    'side': THREE['DoubleSide'],
    'transparent': !0x0,
    'opacity': projection_opacity_tolerance,
    'depthWrite': projecttion_depth_write,
    'depthTest': projecttion_depth_test
})));
h['position']['z'] += projection_offset_tolerance,
(this['userData']['plane'] = h)['userData']['mouse_events'] = !0x1,
0x0 == this['userData']['params']['spec']['tolerance_y'] && 0x0 == this['userData']['params']['spec']['tolerance_x'] || g['add'](h),
'c' == this['userData']['params']['spec']['type'] && g['rotateX'](Math['PI'] / 0x2),
'f' == this['userData']['params']['spec']['type'] && g['rotateX'](-Math['PI'] / 0x2),
this['add_own_object'](g),
setTimeout( () => {
    this['mouse_move']();
}
, 0x64);
}
['gp']() {
var e = copy_object(this['userData']['params']);
return e['children'] = [],
e;
}
['mouse_move']() {
var f = this['userData']['root']['get_forward']()
  , g = this['userData']['pr_group'];
scene['attach'](g),
'w' == this['userData']['params']['spec']['type'] && (0x1 == f['z'] && g['position']['set'](g['position']['x'], g['position']['y'], 0x0),
-0x1 == f['z'] && g['position']['set'](g['position']['x'], g['position']['y'], room['back_wall']['position']['z']),
0x1 == f['x'] && g['position']['set'](0x0, g['position']['y'], g['position']['z']),
-0x1 == f['x']) && g['position']['set'](room['right_wall']['position']['x'], g['position']['y'], g['position']['z']),
'f' == this['userData']['params']['spec']['type'] && g['position']['set'](g['position']['x'], room['floor']['position']['y'], g['position']['z']),
'c' == this['userData']['params']['spec']['type'] && g['position']['set'](g['position']['x'], room['ceiling']['position']['y'], g['position']['z']),
this['userData']['own_object']['attach'](g);
}
['mouse_up']() {}
}
class Rotator extends Section {
constructor(e={}, f={
    'parent': null,
    'root': null,
    'path': null
}) {
    super(e, f);
}
['build']() {
var e;
super['build'](),
this['userData']['state'] = {
    'is_open': !0x1,
    'is_moving': !0x1,
    'starting_pos': 0x0
},
this['userData']['state']['starting_pos'] = this['userData']['object']['rotation'][{
    'rx': 'x',
    'lx': 'x',
    'rz': 'z',
    'lz': 'z',
    'ry': 'y',
    'ly': 'y'
}[this['userData']['params']['spec']['direction']]],
lc['push'](this);
}
['animate']() {
var f, g, h, j, k, l, k;
super['animate'](),
this['userData']['state']['is_moving'] || (this['userData']['state']['is_moving'] = !0x0,
h = {
    'rx': 'x',
    'lx': 'x',
    'rz': 'z',
    'lz': 'z',
    'ry': 'y',
    'ly': 'y'
}[this['userData']['params']['spec']['direction']],
j = {
    'rx': 0x1,
    'rz': 0x1,
    'ry': 0x1,
    'lx': -0x1,
    'lz': -0x1,
    'ly': -0x1
}[this['userData']['params']['spec']['direction']],
k = THREE['Math']['degToRad'](this['userData']['params']['spec']['deg']),
(l = {})[h] = (this['userData']['state']['starting_pos'] + k) * j,
(k = {})[h] = this['userData']['state']['starting_pos'],
(this['userData']['state']['is_open'] ? new TWEEN['Tween'](this['rotation'])['to'](k, 0x190)['onComplete']( () => {
    this['userData']['state']['is_moving'] = !0x1,
    this['userData']['state']['is_open'] = !0x1;
}
) : new TWEEN['Tween'](this['rotation'])['to'](l, 0x190)['onComplete']( () => {
    this['userData']['state']['is_moving'] = !0x1,
    this['userData']['state']['is_open'] = !0x0;
}
))['start']());
}
}
class Slider extends Section {
constructor(e={}, f={
    'parent': null,
    'root': null,
    'path': null
}) {
    super(e, f);
}
['build']() {
var e;
super['build'](),
this['userData']['state'] = {
    'is_open': !0x1,
    'is_moving': !0x1,
    'starting_pos': 0x0
},
this['userData']['state']['starting_pos'] = this['userData']['object']['position'][{
    'l': 'x',
    'r': 'x',
    'f': 'z',
    't': 'y',
    'b': 'y'
}[this['userData']['params']['spec']['direction']]],
lc['push'](this);
}

