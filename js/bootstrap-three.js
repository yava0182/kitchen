/**
 * Bootstrap THREE + loaders on window for classic scripts (Room.js, Furniture.js, …).
 * Kept as a separate module file — Vite html-proxy for inline <script type="module">
 * currently returns text/html and breaks the room.
 *
 * URL должен совпадать с importmap в index.html:
 *   "three": "/node_modules/three/build/three.module.js"
 * Иначе Vite/Express дают 2× THREE → sampler2DShadow ломает IKEA свет.
 */
import * as THREE from '/node_modules/three/build/three.module.js';

window.THREE = THREE;

import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js')
  .then((m) => {
    window.GLTFLoader = m.GLTFLoader;
  })
  .catch((e) => console.error('[CLD] GLTFLoader bootstrap failed', e));

import('/node_modules/three/examples/jsm/loaders/FBXLoader.js')
  .then((m) => {
    window.FBXLoader = m.FBXLoader;
  })
  .catch((e) => console.error('[CLD] FBXLoader bootstrap failed', e));
