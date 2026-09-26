/**
 * section_code_partial.js - Частичный код построения секций из PlanPlace
 * 
 * Это обфусцированный код, содержащий:
 * - Классы Section, Rotator, Slider
 * - Методы build(), animate(), mouse_move()
 * - Код для проекций (круги и плоскости)
 * 
 * ВАЖНО: Это не полный код построения секции с цветом 6737151 и рамкой 2784191
 * Нужно найти больше кода, особенно где создается сама секция (frame, hull)
 */

// Код для проекций (круги и плоскости)
new THREE['Mesh'](new THREE['CircleGeometry'](this['userData']['params']['spec']['radius'] / units, 40), new THREE[
  'MeshStandardMaterial']({
  'color': this['userData']['params']['spec']['radius_color'],
  'side': THREE['FrontSide'],
  'blending': THREE['NormalBlending'],
  'forceSinglePass': true,
  'transparent': true,
  'opacity': projection_opacity_radius,
  'depthWrite': projecttion_depth_test,
  'depthTest': projecttion_depth_test
})), h = (h['userData']['mouse_events'] = false,
  h['position']['z'] += projection_offset_radius,
  this['userData']['circle'] = h,
  0 != this['userData']['params']['spec']['radius'] && g['add'](h),
  new THREE['Mesh'](new THREE['PlaneGeometry'](this['userData']['params']['spec']['tolerance_x'] / units, this[
    'userData']['params']['spec']['tolerance_y'] / units, 1, 1), new THREE['MeshStandardMaterial']({
    'color': this['userData']['params']['spec']['tolerance_color'],
    'side': THREE['DoubleSide'],
    'transparent': true,
    'opacity': projection_opacity_tolerance,
    'depthWrite': projecttion_depth_write,
    'depthTest': projecttion_depth_test
  })));
h['position']['z'] += projection_offset_tolerance,
  (this['userData']['plane'] = h)['userData']['mouse_events'] = false,
  0 == this['userData']['params']['spec']['tolerance_y'] && 0 == this['userData']['params']['spec'][
  'tolerance_x'] || g['add'](h),
  'c' == this['userData']['params']['spec']['type'] && g['rotateX'](Math['PI'] / 2),
  'f' == this['userData']['params']['spec']['type'] && g['rotateX'](-Math['PI'] / 2),
  this['add_own_object'](g),
  setTimeout(() => {
    this['mouse_move']();
  }, 100);
}
['gp']() {
  var e = copy_object(this['userData']['params']);
  return e['children'] = [],
    e;
}
['mouse_move']() {
  var f = this['userData']['root']['get_forward'](),
    g = this['userData']['pr_group'];
  scene['attach'](g),
    'w' == this['userData']['params']['spec']['type'] && (1 == f['z'] && g['position']['set'](g['position']['x'], g[
        'position']['y'], 0),
      -1 == f['z'] && g['position']['set'](g['position']['x'], g['position']['y'], room['back_wall']['position'][
      'z']),
      1 == f['x'] && g['position']['set'](0, g['position']['y'], g['position']['z']),
      -1 == f['x']) && g['position']['set'](room['right_wall']['position']['x'], g['position']['y'], g['position'][
      'z']),
    'f' == this['userData']['params']['spec']['type'] && g['position']['set'](g['position']['x'], room['floor'][
      'position'
    ]['y'], g['position']['z']),
    'c' == this['userData']['params']['spec']['type'] && g['position']['set'](g['position']['x'], room['ceiling'][
      'position'
    ]['y'], g['position']['z']),
    this['userData']['own_object']['attach'](g);
}
['mouse_up']() {}
}
class Rotator extends Section {
  constructor(e = {}, f = {
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
          'is_open': false,
          'is_moving': false,
          'starting_pos': 0
        },
        this['userData']['state']['starting_pos'] = this['userData']['object']['rotation'][{
          'rx': 'x',
          'lx': 'x',
          'rz': 'z',
          'lz': 'z',
          'ry': 'y',
          'ly': 'y'
        } [this['userData']['params']['spec']['direction']]],
        lc.push(this);
    }
    ['animate']() {
      var f, g, h, j, k, l, k;
      super['animate'](),
        this['userData']['state']['is_moving'] || (this['userData']['state']['is_moving'] = true,
          h = {
            'rx': 'x',
            'lx': 'x',
            'rz': 'z',
            'lz': 'z',
            'ry': 'y',
            'ly': 'y'
          } [this['userData']['params']['spec']['direction']],
          j = {
            'rx': 1,
            'rz': 1,
            'ry': 1,
            'lx': -1,
            'lz': -1,
            'ly': -1
          } [this['userData']['params']['spec']['direction']],
          k = THREE['Math']['degToRad'](this['userData']['params']['spec']['deg']),
          (l = {})[h] = (this['userData']['state']['starting_pos'] + k) * j,
          (k = {})[h] = this['userData']['state']['starting_pos'],
          (this['userData']['state']['is_open'] ? new TWEEN['Tween'](this['rotation'])['to'](k, 400)['onComplete'](
          () => {
              this['userData']['state']['is_moving'] = false,
                this['userData']['state']['is_open'] = false;
            }
          ) : new TWEEN['Tween'](this['rotation'])['to'](l, 400)['onComplete'](() => {
            this['userData']['state']['is_moving'] = false,
              this['userData']['state']['is_open'] = true;
          }))['start']());
    }
}
class Slider extends Section {
  constructor(e = {}, f = {
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
          'is_open': false,
          'is_moving': false,
          'starting_pos': 0
        },
        this['userData']['state']['starting_pos'] = this['userData']['object']['position'][{
          'l': 'x',
          'r': 'x',
          'f': 'z',
          't': 'y',
          'b': 'y'
        } [this['userData']['params']['spec']['direction']]],
        lc.push(this);
    }
