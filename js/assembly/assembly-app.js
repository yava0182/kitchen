/**
 * UI и навигация assembly-player (MVP).
 */
import { AssemblyScene } from './assembly-scene.js';
import { ASSEMBLY_EXPORT_LS_KEY } from '../export/assembly-export.js?v=20260624-asm-geom1';

const DEMO_BASE = '/data/assembly/demo';
const PROGRESS_KEY = 'cld_assembly_demo_progress_v1';

const SCREENS = {
  ROOM: 'room',
  PARTS: 'parts',
  ASSEMBLY: 'assembly',
  INSTALL: 'install',
};

export class AssemblyApp {
  constructor() {
    this.scene = null;
    this.roomSnapshot = null;
    this.playbook = null;
    this.installSteps = null;
    this.currentModule = null;
    this.currentPart = null;
    this.currentScenario = null;
    this.currentStepIndex = 0;
    this.currentInstall = null;
    this.screen = SCREENS.ROOM;
    this.progress = this._loadProgress();

    this.el = {
      stages: document.getElementById('asm-stages'),
      screenTitle: document.getElementById('asm-screen-title'),
      screenSub: document.getElementById('asm-screen-sub'),
      panelUi: document.getElementById('asm-panel-ui'),
      partsList: document.getElementById('asm-parts-list'),
      stepCard: document.getElementById('asm-step-card'),
      stepIndex: document.getElementById('asm-step-index'),
      stepTitle: document.getElementById('asm-step-title'),
      stepPick: document.getElementById('asm-step-pick'),
      stepMate: document.getElementById('asm-step-mate'),
      stepHint: document.getElementById('asm-step-hint'),
      btnBack: document.getElementById('asm-btn-back'),
      btnDone: document.getElementById('asm-btn-done'),
      btnRepeat: document.getElementById('asm-btn-repeat'),
      roomHint: document.getElementById('asm-room-hint'),
      loading: document.getElementById('asm-loading'),
      error: document.getElementById('asm-error'),
      bootFail: document.getElementById('asm-boot-fail'),
      statusBar: document.getElementById('asm-status-bar'),
    };

    this.canvas = document.getElementById('asm-canvas');
    if (!this.canvas) throw new Error('Не найден canvas #asm-canvas');

    if (this.el.btnBack) this.el.btnBack.addEventListener('click', () => this._onBack());
    if (this.el.btnDone) this.el.btnDone.addEventListener('click', () => this._onDone());
    if (this.el.btnRepeat) this.el.btnRepeat.addEventListener('click', () => this._onRepeat());
    if (this.canvas) {
      this.canvas.addEventListener('click', (e) => this._onCanvasClick(e));
      this.canvas.addEventListener(
        'touchend',
        (e) => {
          if (e.changedTouches.length !== 1) return;
          const t = e.changedTouches[0];
          this._onCanvasClick({ clientX: t.clientX, clientY: t.clientY });
        },
        { passive: true }
      );
    }

    this._bindStages();
  }

  async init() {
    try {
      this.scene = new AssemblyScene(this.canvas);
    } catch (e) {
      throw new Error(`WebGL / Three.js: ${e?.message || e}`);
    }

    try {
      const roomSnapshot = await this._loadRoomSnapshot();
      const [playbook, installs] = await Promise.all([
        fetch(`${DEMO_BASE}/order-playbook.json`).then((r) => r.json()),
        fetch(`${DEMO_BASE}/install-steps.json`).then((r) => r.json()),
      ]);
      this.roomSnapshot = roomSnapshot;
      this.playbook = playbook;
      this.installSteps = installs;
      this.scene.setRoomSnapshot(roomSnapshot);
      this._renderStages();
      this._showScreen(SCREENS.ROOM);
      if (this.el.statusBar) {
        const src = roomSnapshot?.source === 'room' ? 'из комнаты' : 'демо';
        this.el.statusBar.textContent = `Clodis — заказ ${src}`;
        this.el.statusBar.style.background = '#16a34a';
      }
      this._updateRoomPanelText();
    } catch (e) {
      console.error('[assembly] load failed', e);
      if (this.el.bootFail) {
        this.el.bootFail.classList.add('is-visible');
        this.el.bootFail.textContent = `Не удалось загрузить демо-заказ: ${e.message}`;
      }
      if (this.el.statusBar) this.el.statusBar.style.background = '#ef4444';
      throw e;
    }
    this.scene.resize();
  }

  async _loadRoomSnapshot() {
    const params = new URLSearchParams(location.search);
    const wantRoom = params.get('source') === 'room' || params.get('from') === 'room';
    if (wantRoom) {
      const raw = localStorage.getItem(ASSEMBLY_EXPORT_LS_KEY);
      if (!raw) {
        throw new Error(
          'Нет экспорта из комнаты. В комнате нажмите иконку молотка «В сборку» (рядом с экспортом Bazis).'
        );
      }
      return JSON.parse(raw);
    }
    const fromLs = localStorage.getItem(ASSEMBLY_EXPORT_LS_KEY);
    if (fromLs) {
      try {
        return JSON.parse(fromLs);
      } catch (_) {}
    }
    const res = await fetch(`${DEMO_BASE}/room-snapshot.json`);
    if (!res.ok) throw new Error(`Демо-заказ не найден (${res.status})`);
    return res.json();
  }

  _updateRoomPanelText() {
    const el = document.getElementById('asm-room-panel-text');
    if (!el) return;
    const fromRoom = this.roomSnapshot?.source === 'room';
    const n = this.roomSnapshot?.modules?.length || 0;
    const name = this.roomSnapshot?.modules?.[0]?.label || 'шкаф';
    const m0 = this.roomSnapshot?.modules?.[0];
    const full = m0?.fullDimensionsMm || m0?.exportMeta?.worldSizeMm;
    const sizeTxt = full ? `${full.w}×${full.h}×${full.d} мм` : '';
    const ant = m0?.antresolDimensionsMm;
    const splitTxt =
      ant && full
        ? ` (корпус ~${m0.dimensionsMm?.h} мм + антресоль ~${ant.h} мм)`
        : '';
    const panelCount = m0?.exportMeta?.visualPanelCount ?? m0?.visualMeshes?.panelCount ?? 0;
    const antPart = m0?.parts?.find((p) => p.id === 'antresol');
    const antSteps = antPart?.scenario?.steps?.length;
    const antSrc = antPart?.scenario?.source;
    if (fromRoom) {
      el.innerHTML =
        `Экспорт из комнаты: <strong>${n}</strong> модуль(ей). ` +
        `<strong>${name}</strong>${sizeTxt ? ` — ${sizeTxt}` : ''}${splitTxt}. ` +
        (panelCount > 0
          ? `<br><small>3D: ${panelCount} панелей` +
            (antSteps
              ? ` · антресоль: ${antSteps} шагов (${antSrc === 'clodis' ? 'из Clodis' : 'из геометрии'})`
              : '') +
            `. Нажмите на шкаф.</small>`
          : `<br><small>Переэкспортируйте из комнаты (молоток).</small>`);
    } else {
      el.innerHTML =
        'Демо: синий блок = шкаф, оранжевый = антресоль. Нажмите на синий шкаф.';
    }
  }

  _loadProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      return raw ? JSON.parse(raw) : { parts: {}, installs: {} };
    } catch {
      return { parts: {}, installs: {} };
    }
  }

  _saveProgress() {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(this.progress));
    } catch (_) {}
  }

  _partProgressKey(moduleId, partId) {
    return `${moduleId}:${partId}`;
  }

  _isPartDone(moduleId, partId) {
    return !!this.progress.parts[this._partProgressKey(moduleId, partId)];
  }

  _markPartDone(moduleId, partId) {
    this.progress.parts[this._partProgressKey(moduleId, partId)] = true;
    this._saveProgress();
  }

  _bindStages() {
    if (!this.el.stages) return;
    this.el.stages.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-stage-id]');
      if (!btn || btn.disabled) return;
      const id = btn.dataset.stageId;
      if (id === 'assemble') {
        this._showScreen(SCREENS.ROOM);
        return;
      }
      if (id === 'place') {
        this._openInstall('place_niche');
        return;
      }
      if (id === 'stack') {
        this._openInstall('stack_antresol');
        return;
      }
      if (id === 'later') {
        this.el.screenSub.textContent =
          'Обклад, ящики, полки и фасады — в следующих версиях. Сейчас завершите стыковку антресоли.';
        this._showScreen(SCREENS.ROOM);
      }
    });
  }

  _renderStages() {
    const stages = this.playbook?.stages || [];
    if (!this.el.stages) return;
    const mid = this.roomSnapshot?.modules?.[0]?.id || 'wardrobe_1';
    const corpusDone = this._isPartDone(mid, 'corpus');
    const antDone = this._isPartDone(mid, 'antresol');
    const assembleDone = corpusDone && antDone;
    const placeDone = !!this.progress.installs.place_niche;
    const stackDone = !!this.progress.installs.stack_antresol;

    this.el.stages.innerHTML = stages
      .map((s) => {
        let state = '';
        if (s.id === 'assemble' && assembleDone) state = 'done';
        if (s.id === 'place' && placeDone) state = 'done';
        if (s.id === 'stack' && stackDone) state = 'done';
        const disabled =
          (s.id === 'place' && !assembleDone) ||
          (s.id === 'stack' && !placeDone) ||
          (s.id === 'later' && !stackDone);
        return `<button type="button" class="asm-stage ${state}" data-stage-id="${s.id}" ${
          disabled ? 'disabled' : ''
        }" title="${s.label}"><span class="asm-stage-num">${s.short}</span><span class="asm-stage-label">${s.label}</span></button>`;
      })
      .join('');
  }

  _showScreen(screen) {
    this.screen = screen;
    this._renderStages();

    if (screen !== SCREENS.ROOM && this.el.panelUi) {
      this.el.panelUi.dataset.screen = screen;
    }

    if (screen === SCREENS.ROOM) {
      this.scene.setMode('room');
      this.scene.focusRoom();
      if (this.el.screenTitle) this.el.screenTitle.textContent = this.roomSnapshot?.label || 'Моя комната';
      if (this.el.screenSub) this.el.screenSub.textContent = 'Нажмите на шкаф, чтобы начать сборку';
      if (this.el.roomHint) this.el.roomHint.hidden = false;
      if (this.el.partsList) this.el.partsList.hidden = true;
      if (this.el.stepCard) this.el.stepCard.hidden = true;
      if (this.el.btnBack) this.el.btnBack.hidden = true;
      if (this.el.btnDone) this.el.btnDone.hidden = true;
      if (this.el.btnRepeat) this.el.btnRepeat.hidden = true;
      if (this.el.panelUi) this.el.panelUi.dataset.screen = 'room';
      return;
    }

    if (screen === SCREENS.PARTS) {
      this.scene.showPartsPreview(this.currentModule);
      this.el.roomHint.hidden = true;
      this.el.partsList.hidden = false;
      this.el.stepCard.hidden = true;
      this.el.btnBack.hidden = false;
      this.el.btnDone.hidden = true;
      this.el.btnRepeat.hidden = true;
      this.el.screenTitle.textContent = this.currentModule?.label || 'Модуль';
      this.el.screenSub.textContent = 'Выберите, что собрать';
      this._renderPartsList();
      return;
    }

    if (screen === SCREENS.ASSEMBLY) {
      this.el.roomHint.hidden = true;
      this.el.partsList.hidden = true;
      this.el.stepCard.hidden = false;
      this.el.btnBack.hidden = false;
      this.el.btnDone.hidden = false;
      this.el.btnRepeat.hidden = false;
      this._renderStep();
      return;
    }

    if (screen === SCREENS.INSTALL) {
      this.el.roomHint.hidden = true;
      this.el.partsList.hidden = true;
      this.el.stepCard.hidden = false;
      this.el.btnBack.hidden = false;
      this.el.btnDone.hidden = false;
      this.el.btnRepeat.hidden = true;
      this._renderInstallStep();
    }
  }

  _renderPartsList() {
    const mod = this.currentModule;
    if (!mod) return;
    const parts = mod.parts || [];
    const corpusFirst = !this._isPartDone(mod.id, 'corpus');

    this.el.partsList.innerHTML = parts
      .map((p) => {
        const done = this._isPartDone(mod.id, p.id);
        const locked = p.id === 'antresol' && corpusFirst && !done;
        const rec = p.recommendedFirst && !done && corpusFirst;
        return `<button type="button" class="asm-part-card ${done ? 'is-done' : ''} ${
          locked ? 'is-locked' : ''
        } ${rec ? 'is-recommended' : ''}" data-part-id="${p.id}" ${locked ? 'disabled' : ''}>
          <span class="asm-part-name">${p.label}</span>
          <span class="asm-part-status">${done ? 'Собрано' : locked ? 'Сначала корпус' : rec ? 'Начните здесь' : 'Собрать'}</span>
        </button>`;
      })
      .join('');

    this.el.partsList.querySelectorAll('[data-part-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const partId = btn.dataset.partId;
        const part = parts.find((x) => x.id === partId);
        if (part) this._openAssembly(part);
      });
    });
  }

  async _openAssembly(part) {
    this.currentPart = part;
    if (part.scenario) {
      this.currentScenario = part.scenario;
    } else if (part.scenarioUrl) {
      const res = await fetch(part.scenarioUrl);
      if (!res.ok) throw new Error(`Сценарий не найден (${res.status})`);
      this.currentScenario = await res.json();
    } else {
      throw new Error('У детали нет сценария сборки');
    }
    const key = this._partProgressKey(this.currentModule.id, part.id);
    const savedStep = this.progress[key + ':step'];
    this.currentStepIndex =
      typeof savedStep === 'number'
        ? savedStep
        : this._isPartDone(this.currentModule.id, part.id)
          ? (this.currentScenario.steps?.length || 1) - 1
          : 0;

    this.scene.loadAssemblyScenario(this.currentScenario, this.currentStepIndex);
    this.el.screenTitle.textContent = this.currentScenario.moduleLabel || part.label;
    this._showScreen(SCREENS.ASSEMBLY);
    if (!this.currentScenario.steps?.[this.currentStepIndex]?.stub) {
      await this.scene.playStepAnimation(this.currentScenario, this.currentStepIndex);
    }
  }

  _renderStep() {
    const scenario = this.currentScenario;
    const steps = scenario?.steps || [];
    const step = steps[this.currentStepIndex];
    if (!step) {
      this.el.stepIndex.textContent = 'Готово';
      this.el.stepTitle.textContent = `${scenario.moduleLabel} собран`;
      this.el.stepPick.textContent = '';
      this.el.stepMate.textContent = '';
      this.el.stepHint.textContent = 'Нажмите «Готово», чтобы вернуться к составу шкафа.';
      this.el.btnDone.textContent = 'К составу шкафа';
      return;
    }

    const total = steps.length;
    this.el.stepIndex.textContent = `Шаг ${step.index} из ${total}`;
    this.el.stepTitle.textContent = step.title;
    this.el.stepPick.textContent = step.pickPart
      ? `Возьмите: №${step.pickPart.no} — ${step.pickPart.label}`
      : '';
    this.el.stepMate.textContent = step.mateWith
      ? `Соедините с: №${step.mateWith.no} — ${step.mateWith.label}`
      : 'Уложите на плоскость сборки';
    this.el.stepHint.textContent = step.hint || '';
    this.el.btnDone.textContent = step.stub ? 'Понятно' : 'Готово';
    this.el.screenSub.textContent = scenario.moduleLabel;
  }

  _renderInstallStep() {
    const inst = this.currentInstall;
    if (!inst) return;
    this.el.stepIndex.textContent = 'Установка';
    this.el.stepTitle.textContent = inst.title;
    this.el.stepPick.textContent = '';
    this.el.stepMate.textContent = '';
    this.el.stepHint.textContent = inst.hint || '';
    this.el.btnDone.textContent = 'Готово';
    this.el.screenTitle.textContent = this.playbook?.stages?.find((s) => s.id === inst.stageId)?.label || 'Установка';
    this.el.screenSub.textContent = this.currentModule?.label || '';
  }

  async _onDone() {
    if (this.screen === SCREENS.INSTALL) {
      this.progress.installs[this.currentInstall.id] = true;
      this._saveProgress();
      this.currentInstall = null;
      this._showScreen(SCREENS.ROOM);
      return;
    }

    if (this.screen !== SCREENS.ASSEMBLY) return;

    const scenario = this.currentScenario;
    const steps = scenario?.steps || [];
    const step = steps[this.currentStepIndex];

    if (step) {
      this.scene.clearHighlights(scenario);
      const key = this._partProgressKey(this.currentModule.id, this.currentPart.id);
      this.progress[key + ':step'] = this.currentStepIndex + 1;
      this._saveProgress();
      this.currentStepIndex += 1;
    }

    if (this.currentStepIndex >= steps.length) {
      this._markPartDone(this.currentModule.id, this.currentPart.id);
      this._showScreen(SCREENS.PARTS);
      return;
    }

    this._renderStep();
    const next = steps[this.currentStepIndex];
    if (!next?.stub) {
      await this.scene.playStepAnimation(scenario, this.currentStepIndex);
    }
  }

  async _onRepeat() {
    if (this.screen !== SCREENS.ASSEMBLY || !this.currentScenario) return;
    await this.scene.playStepAnimation(this.currentScenario, this.currentStepIndex);
  }

  _onBack() {
    if (this.screen === SCREENS.ASSEMBLY || this.screen === SCREENS.PARTS) {
      if (this.screen === SCREENS.ASSEMBLY) {
        this.scene.clearAssembly();
        this._showScreen(SCREENS.PARTS);
      } else {
        this.currentModule = null;
        this._showScreen(SCREENS.ROOM);
      }
      return;
    }
    if (this.screen === SCREENS.INSTALL) {
      this.currentInstall = null;
      this._showScreen(SCREENS.ROOM);
    }
  }

  _onCanvasClick(e) {
    if (this.screen !== SCREENS.ROOM) return;
    const moduleId = this.scene.pickModuleAt(e.clientX, e.clientY);
    if (!moduleId) return;
    const mod = (this.roomSnapshot?.modules || []).find((m) => m.id === moduleId);
    if (!mod) return;
    this.currentModule = mod;
    this._showScreen(SCREENS.PARTS);
  }

  _openInstall(installId) {
    const mod = (this.roomSnapshot?.modules || [])[0];
    this.currentModule = mod;
    this.currentInstall = (this.installSteps?.installs || []).find((i) => i.id === installId);
    if (!this.currentInstall) return;
    this.scene.showInstallPreview(installId, mod);
    this._showScreen(SCREENS.INSTALL);
  }
}
