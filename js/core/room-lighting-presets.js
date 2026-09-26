/** Пресеты комнаты — IKEA v0 (комната) / neutral (диагностика). */
import { state } from '../utils/state.js';

const THREE = window.THREE;

export const ROOM_LIGHTING_PRESETS = {
  ikea: {
    id: 'ikea',
    label: 'IKEA v0 phase 6c (exposure×2 + screenCal)',
    sceneBackground: 0xf2f2f0,
    envEnabled: false,
    envIntensity: 0.6,
    renderer: {
      colorManagementEnabled: true,
      outputColorSpace: 'srgb',
      useLegacyLights: false,
      toneMapping: 'none',
      toneMappingExposure: 1,
      shadowMapType: 'pcfsoft',
    },
    lights: {},
  },
  neutral: {
    id: 'neutral',
    label: 'Neutral (geometry only)',
    sceneBackground: 0xf0f0f0,
    envEnabled: false,
    envIntensity: 0,
    renderer: {
      colorManagementEnabled: true,
      outputColorSpace: 'srgb',
      useLegacyLights: false,
      toneMapping: 'none',
      toneMappingExposure: 1,
      shadowMapType: 'pcfsoft',
    },
    lights: {},
  },
};

export function getRoomLightingPresetName() {
  return 'ikea';
}

export function getRoomLightingPreset(name) {
  const id = name || getRoomLightingPresetName();
  return ROOM_LIGHTING_PRESETS[id] || ROOM_LIGHTING_PRESETS.ikea;
}

export function applyRoomLightingRendererSettings(renderer, preset) {
  if (!renderer || !preset?.renderer) return;
  const r = preset.renderer;
  if (THREE.ColorManagement) THREE.ColorManagement.enabled = r.colorManagementEnabled !== false;
  if ('outputColorSpace' in renderer && THREE.SRGBColorSpace !== undefined) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  renderer._useLegacyLights = !!r.useLegacyLights;
  if ('toneMapping' in renderer) {
    renderer.toneMapping = THREE.NoToneMapping ?? 0;
    renderer.toneMappingExposure = 1;
  }
  renderer.shadowMap.enabled = false;
  renderer.setClearColor(preset.sceneBackground ?? 0xf2f2f0, 1);
  renderer.setClearAlpha(1);
}

export function applyRoomLightingSceneBackground(scene, preset) {
  if (!scene || !preset) return;
  /** IKEA dump: background null — surround from renderer clear, not scene.background. */
  if (preset.id === 'ikea') {
    scene.background = null;
    return;
  }
  scene.background = new THREE.Color(preset.sceneBackground ?? 0xf2f2f0);
}

function __removeOldRoomLights() {
  if (state.lights) {
    for (const l of Object.values(state.lights)) {
      if (l?.parent) l.parent.remove(l);
      l?.dispose?.();
    }
  }
  state.lights = {};
  state.cameraFillLight = null;
}

export function buildRoomLightsFromPreset(_preset) {
  __removeOldRoomLights();
  return state.lights;
}

export function applyRoomLightingPreset(preset, opts = {}) {
  if (!state.scene) return;
  const p = preset || getRoomLightingPreset();
  if (opts.sceneBackground !== false) applyRoomLightingSceneBackground(state.scene, p);
  if (opts.renderer !== false && state.renderer) applyRoomLightingRendererSettings(state.renderer, p);
  buildRoomLightsFromPreset(p);
  state.roomEnvIntensity = Number(p.envIntensity) || 0;
  if (state.scene.environment) {
    state.scene.environment.dispose?.();
    state.scene.environment = null;
  }
  if ('environmentIntensity' in state.scene) state.scene.environmentIntensity = 0;
}

export function initRoomLightingPresetGlobals() {
  if (typeof window !== 'undefined') {
    window.__cldSetRoomLightingPreset = (name) => {
      const id = name === 'neutral' ? 'neutral' : 'ikea';
      return id;
    };
    window.__cldGetRoomLightingPreset = getRoomLightingPreset;
  }
}
