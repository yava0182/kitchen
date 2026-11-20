/**
 * Единый THREE для IKEA_PORT = тот же URL, что importmap / bootstrap-three.js.
 * Не bare `import 'three'` под Vite — иначе второй экземпляр и серый экран.
 */
import * as THREE_NS from '/node_modules/three/build/three.module.js';

const THREE =
  typeof window !== 'undefined' && window.THREE && window.THREE.REVISION
    ? window.THREE
    : THREE_NS;

if (typeof window !== 'undefined' && !window.THREE) {
  window.THREE = THREE;
}

export { THREE };
export default THREE;
