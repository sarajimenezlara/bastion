// UIController: capa de presentación (Fase 5 y 6). Enlaza el motor con el HUD
// HTML, el panel de torres, el panel de la torre seleccionada, los atajos de
// teclado y las pantallas superpuestas de inicio / victoria / derrota.
// No dibuja en el canvas: eso es responsabilidad de CanvasRenderer.
// Patrón UMD simplificado: navegador (window) y node --test (CommonJS).

const InputMapRef =
  typeof window !== 'undefined' && window.InputMap
    ? window.InputMap
    : typeof require !== 'undefined'
      ? require('./InputMap.js')
      : null;

const TowerRefUI =
  typeof window !== 'undefined' && window.Tower
    ? window.Tower
    : typeof require !== 'undefined'
      ? require('../core/Tower.js')
      : null;

// Nombres visibles para el jugador: los identificadores del código van en inglés.
const TOWER_LABELS = {
  Ballesta: 'Ballesta',
  Canon: 'Cañón',
  Escarcha: 'Escarcha',
  Arcana: 'Arcana',
};

class UIController {
  /**
   * @param {object} [options]
   * @param {object} [options.engine]
   * @param {object} [options.renderer]
   * @param {object} [options.recordStore]
   * @param {Function} [options.onRestart]
   * @param {Document} [options.dom]
   */
  constructor(options = {}) {
    const opts = options || {};

    this.engine = opts.engine || null;
    this.renderer = opts.renderer || null;
    this.recordStore = opts.recordStore || null;
    this.onRestart = typeof opts.onRestart === 'function' ? opts.onRestart : null;
    this.dom = opts.dom || (typeof document !== 'undefined' ? document : null);

    this.selectedBuildType = null;
    this.selectedTowerId = null;
    this.lastPointerCell = null;
    this.lastState = null;
    this.lastHud = {};
    this.overlayAction = null;
    this.refs = {};
  }

  /** Resuelve las referencias del DOM, enlaza eventos y pinta el primer frame. @returns {void} */
  mount() {
    if (!this.dom) return;

    this.refs = {
      canvas: this.dom.getElementById('game-canvas'),
      lives: this.dom.getElementById('stat-lives'),
      gold: this.dom.getElementById('stat-gold'),
      wave: this.dom.getElementById('stat-wave'),
      enemies: this.dom.getElementById('stat-enemies'),
      pause: this.dom.getElementById('btn-pause'),
      speed: this.dom.getElementById('btn-speed'),
      autoWave: this.dom.getElementById('btn-auto-wave'),
      nextWave: this.dom.getElementById('btn-next-wave'),
      cards: Array.from(this.dom.querySelectorAll('.tower-card')),
      towerEmpty: this.dom.getElementById('tower-empty'),
      towerDetails: this.dom.getElementById('tower-details'),
      towerName: this.dom.getElementById('tower-name'),
      towerLevel: this.dom.getElementById('tower-level'),
      towerDamage: this.dom.getElementById('tower-damage'),
      towerRange: this.dom.getElementById('tower-range'),
      towerRate: this.dom.getElementById('tower-rate'),
      towerType: this.dom.getElementById('tower-type'),
      upgrade: this.dom.getElementById('btn-upgrade'),
      sell: this.dom.getElementById('btn-sell'),
      overlay: this.dom.getElementById('overlay'),
      overlayTitle: this.dom.getElementById('overlay-title'),
      overlayText: this.dom.getElementById('overlay-text'),
      overlayScore: this.dom.getElementById('overlay-score'),
      overlayRecord: this.dom.getElementById('overlay-record'),
      overlayButton: this.dom.getElementById('overlay-button'),
    };

    this.bindEvents();
    this.fillShopLabels();

    this.lastState = null;
    this.lastHud = {};
    this.update();
  }

  /** Cambia el motor tras reiniciar la partida. @param {object} engine @returns {void} */
  setEngine(engine) {
    this.engine = engine || null;
    this.selectedBuildType = null;
    this.selectedTowerId = null;
    this.lastPointerCell = null;
    this.overlayAction = null;
    this.lastState = null;
    this.lastHud = {};

    if (this.renderer) {
      this.renderer.setSelectedTower(null);
      this.renderer.setPreview(null);
    }
    this.update();
  }

  /** Enlaza clics y teclado. @returns {void} */
  bindEvents() {
    const refs = this.refs;

    if (refs.canvas) {
      refs.canvas.addEventListener('click', (event) => this.handleCanvasClick(event));
      refs.canvas.addEventListener('mousemove', (event) => this.handleCanvasMove(event));
      refs.canvas.addEventListener('mouseleave', () => this.clearPreview());
      // El clic derecho cancela la torre elegida sin abrir el menú contextual.
      refs.canvas.addEventListener('contextmenu', (event) => {
        if (event && event.preventDefault) event.preventDefault();
        this.cancelSelection();
      });
    }

    if (this.dom.addEventListener) {
      this.dom.addEventListener('keydown', (event) => this.handleKeydown(event));
    }

    if (refs.pause) {
      refs.pause.addEventListener('click', () => this.runAction({ type: 'togglePause' }));
    }
    if (refs.speed) {
      refs.speed.addEventListener('click', () => this.runAction({ type: 'toggleSpeed' }));
    }
    if (refs.autoWave) {
      refs.autoWave.addEventListener('click', () => this.runAction({ type: 'toggleAutoWaves' }));
    }
    if (refs.nextWave) {
      refs.nextWave.addEventListener('click', () => this.callNextWave());
    }
    if (refs.upgrade) {
      refs.upgrade.addEventListener('click', () => this.upgradeSelected());
    }
    if (refs.sell) {
      refs.sell.addEventListener('click', () => this.sellSelected());
    }
    if (refs.overlayButton) {
      refs.overlayButton.addEventListener('click', () => this.handleOverlayAction());
    }

    for (const card of refs.cards) {
      card.addEventListener('click', () => {
        this.selectBuildType(card.getAttribute('data-type'));
      });
    }
  }

  /** Escribe costes y dibuja los iconos de las 4 tarjetas del panel inferior. @returns {void} */
  fillShopLabels() {
    for (const card of this.refs.cards) {
      const type = card.getAttribute('data-type');
      const cost = TowerRefUI ? TowerRefUI.getBaseCost(type) : null;
      const costLabel = card.querySelector('.tower-cost');
      if (costLabel && cost !== null) {
        this.setText(costLabel, `${cost} oro`);
      }

      const icon = card.querySelector('.tower-icon');
      if (icon && this.renderer) {
        this.renderer.drawTowerIcon(icon, type);
      }
    }
  }

  /** Actualiza todo el HUD. Se llama una vez por frame. @returns {void} */
  update() {
    if (!this.engine || !this.refs.lives) return;

    this.updateStats();
    this.updateControls();
    this.updateShop();
    this.updateSelectedTower();
    this.updateState();
  }

  /** Vidas, oro, oleada y enemigos restantes. @returns {void} */
  updateStats() {
    const engine = this.engine;
    const pending = engine.waveManager.pendingCount();

    this.setText(this.refs.lives, engine.lives);
    this.setText(this.refs.gold, Math.floor(engine.gold));
    this.setText(this.refs.wave, `${engine.currentWave}/${engine.waveManager.totalWaves}`);
    this.setText(this.refs.enemies, engine.enemies.length + pending);
  }

  /** Botones de pausa, velocidad y «Siguiente oleada» (con su bonus). @returns {void} */
  updateControls() {
    const engine = this.engine;
    const finished = engine.state === 'VICTORY' || engine.state === 'DEFEAT';

    if (this.refs.pause) {
      this.setText(this.refs.pause, engine.isPaused ? 'Reanudar' : 'Pausa');
      const pressed = String(engine.isPaused);
      if (this.refs.pause.getAttribute('aria-pressed') !== pressed) {
        this.refs.pause.setAttribute('aria-pressed', pressed);
      }
      if (this.refs.pause.disabled !== finished) this.refs.pause.disabled = finished;
    }

    if (this.refs.speed) {
      this.setText(this.refs.speed, `${engine.gameSpeed}x`);
      const pressed = String(engine.gameSpeed === 2);
      if (this.refs.speed.getAttribute('aria-pressed') !== pressed) {
        this.refs.speed.setAttribute('aria-pressed', pressed);
      }
    }

    if (this.refs.autoWave) {
      const pressed = String(engine.autoWaves);
      if (this.refs.autoWave.getAttribute('aria-pressed') !== pressed) {
        this.refs.autoWave.setAttribute('aria-pressed', pressed);
      }
      if (this.refs.autoWave.disabled !== finished) this.refs.autoWave.disabled = finished;
    }

    if (this.refs.nextWave) {
      const countdown = Number(engine.autoWaveTimer) || 0;
      const pending = engine.waveManager.isWaveActive ? engine.waveManager.pendingCount() : 0;
      const bonus = Math.floor(pending * 2) + 15;
      let label = 'Siguiente oleada';

      if (countdown > 0) {
        label = `Siguiente oleada en ${Math.ceil(countdown)} s`;
      } else if (pending > 0) {
        label = `Siguiente oleada (+${bonus} oro)`;
      }

      this.setText(this.refs.nextWave, label);
      const disabled = finished || !engine.waveManager.hasMoreWaves();
      if (this.refs.nextWave.disabled !== disabled) this.refs.nextWave.disabled = disabled;
    }
  }

  /** Estado de las 4 tarjetas: desactivadas sin oro y marcada la elegida. @returns {void} */
  updateShop() {
    for (const card of this.refs.cards) {
      const type = card.getAttribute('data-type');
      const cost = TowerRefUI ? TowerRefUI.getBaseCost(type) : null;
      const affordable = cost !== null && this.engine.gold >= cost;
      const selected = this.selectedBuildType === type;

      if (card.disabled !== !affordable) card.disabled = !affordable;
      card.classList.toggle('is-selected', selected);
      card.setAttribute('aria-pressed', String(selected));
    }
  }

  /** Panel derecho: nivel, daño, rango, cadencia, mejora y reventa. @returns {void} */
  updateSelectedTower() {
    if (!this.refs.towerDetails) return;

    const tower =
      this.selectedTowerId === null
        ? null
        : this.engine.towers.find((item) => item.id === this.selectedTowerId) || null;

    if (!tower && this.selectedTowerId !== null) {
      this.selectedTowerId = null;
      if (this.renderer) this.renderer.setSelectedTower(null);
    }

    const hasTower = Boolean(tower);
    if (this.refs.towerEmpty.hidden !== hasTower) this.refs.towerEmpty.hidden = hasTower;
    if (this.refs.towerDetails.hidden === hasTower) this.refs.towerDetails.hidden = !hasTower;

    if (!tower) return;

    this.setText(this.refs.towerName, TOWER_LABELS[tower.type] || tower.type);
    this.setText(this.refs.towerLevel, `${tower.level}/${tower.maxLevel}`);
    this.setText(this.refs.towerDamage, tower.damage);
    this.setText(this.refs.towerRange, `${tower.range} px`);
    this.setText(this.refs.towerRate, `${tower.fireRate.toFixed(1)}/s`);
    this.setText(this.refs.towerType, tower.damageType === 'MAGIC' ? 'Mágico' : 'Físico');

    const upgradeCost = tower.getUpgradeCost();
    if (this.refs.upgrade) {
      if (upgradeCost === null) {
        this.setText(this.refs.upgrade, 'Nivel máximo');
        if (this.refs.upgrade.disabled !== true) this.refs.upgrade.disabled = true;
      } else {
        this.setText(this.refs.upgrade, `Mejorar (${upgradeCost} oro)`);
        const disabled = this.engine.gold < upgradeCost;
        if (this.refs.upgrade.disabled !== disabled) this.refs.upgrade.disabled = disabled;
      }
    }

    if (this.refs.sell) {
      this.setText(this.refs.sell, `Vender (+${tower.getRefundValue()} oro)`);
    }
  }

  /** Muestra u oculta las pantallas de inicio, victoria y derrota. @returns {void} */
  updateState() {
    const state = this.engine.state;
    if (state === this.lastState) return;
    this.lastState = state;

    if (state === 'VICTORY' || state === 'DEFEAT') {
      this.showResult(state);
      return;
    }
    if (state === 'MENU') {
      this.showStart();
      return;
    }
    this.hideOverlay();
  }

  /** Pantalla de inicio con el récord guardado. @returns {void} */
  showStart() {
    const record = this.recordStore ? this.recordStore.load() : null;

    this.showOverlay({
      title: 'Bastión',
      text: 'Defiende el castillo durante 10 oleadas. Construye torres junto al camino y no dejes que los enemigos lleguen a la meta.',
      score: '',
      record: record
        ? `Récord: ${record.score} puntos (oleada ${record.wave}).`
        : 'Todavía no hay récord guardado.',
      button: 'Jugar',
      action: 'start',
    });
  }

  /**
   * Pantalla de fin de partida; guarda el récord antes de mostrarlo.
   * @param {'VICTORY'|'DEFEAT'} state
   * @returns {void}
   */
  showResult(state) {
    const engine = this.engine;
    const saved = this.recordStore
      ? this.recordStore.save({
          score: engine.score,
          wave: engine.currentWave,
          result: state,
        })
      : null;

    const best = saved ? saved.best : null;
    const isVictory = state === 'VICTORY';

    let recordText = 'Récord no disponible en este navegador.';
    if (best) {
      recordText = `${saved.isNewRecord ? '¡Nuevo récord! ' : 'Récord: '}${best.score} puntos (oleada ${best.wave}).`;
    }

    this.showOverlay({
      title: isVictory ? '¡Victoria!' : 'Derrota',
      text: isVictory
        ? 'Has resistido las 10 oleadas y el castillo sigue en pie.'
        : 'Los enemigos han alcanzado la meta. Vuelve a intentarlo.',
      score: `Puntuación: ${engine.score}`,
      record: recordText,
      button: 'Jugar de nuevo',
      action: 'restart',
    });
  }

  /**
   * Rellena y muestra una capa superpuesta.
   * @param {{title:string,text:string,score:string,record:string,button:string,action:string}} content
   * @returns {void}
   */
  showOverlay(content) {
    const refs = this.refs;

    this.overlayAction = content.action;
    this.setText(refs.overlayTitle, content.title);
    this.setText(refs.overlayText, content.text);
    this.setText(refs.overlayScore, content.score);
    this.setText(refs.overlayRecord, content.record);
    this.setText(refs.overlayButton, content.button);

    if (refs.overlayScore) refs.overlayScore.hidden = content.score === '';
    if (refs.overlayRecord) refs.overlayRecord.hidden = content.record === '';
    if (refs.overlay) refs.overlay.hidden = false;

    if (refs.overlayButton && refs.overlayButton.focus) refs.overlayButton.focus();
  }

  /** Oculta la capa superpuesta. @returns {void} */
  hideOverlay() {
    if (this.refs.overlay) this.refs.overlay.hidden = true;
    this.overlayAction = null;
  }

  /** «Jugar» empieza la partida en fase de construcción; «Jugar de nuevo» reinicia el motor. @returns {void} */
  handleOverlayAction() {
    if (this.overlayAction === 'start') {
      this.startGame();
      return;
    }
    if (this.overlayAction === 'restart' && this.onRestart) {
      this.onRestart();
    }
  }

  // --- Acciones -----------------------------------------------------------

  /**
   * Ejecuta una acción de interfaz (teclado o clic).
   * @param {{type:string,towerType?:string}} action
   * @returns {void}
   */
  runAction(action) {
    if (!action) return;

    switch (action.type) {
      case 'selectTowerType':
        this.selectBuildType(action.towerType);
        break;
      case 'togglePause':
        this.togglePause();
        break;
      case 'toggleSpeed':
        this.toggleSpeed();
        break;
      case 'toggleAutoWaves':
        this.toggleAutoWaves();
        break;
      case 'cancelSelection':
        this.cancelSelection();
        break;
      case 'upgradeSelected':
        this.upgradeSelected();
        break;
      case 'sellSelected':
        this.sellSelected();
        break;
      default:
        break;
    }
  }

  /** @param {KeyboardEvent|object} event @returns {void} */
  handleKeydown(event) {
    if (!InputMapRef) return;

    const action = InputMapRef.actionForEvent(event);
    if (!action) return;

    if (event.preventDefault) event.preventDefault();
    this.runAction(action);
  }

  /**
   * Elige el tipo de torre a construir. Pulsar de nuevo la misma tecla (o la
   * misma tarjeta) la vuelve a seleccionar, nunca la deselecciona: así se
   * pueden colocar varias torres seguidas. Para cancelar: `Escape` o clic derecho.
   * @param {string} type
   * @returns {void}
   */
  selectBuildType(type) {
    if (!TOWER_LABELS[type]) return;

    this.selectedBuildType = type;
    this.selectTower(null);
    this.updatePreview();
    this.update();
  }

  /**
   * Selecciona una torre del mapa (o la deselecciona con null).
   * @param {number|string|null} towerId
   * @returns {void}
   */
  selectTower(towerId) {
    this.selectedTowerId = towerId === undefined ? null : towerId;
    if (this.selectedTowerId !== null) this.selectedBuildType = null;
    if (this.renderer) this.renderer.setSelectedTower(this.selectedTowerId);
    this.update();
  }

  /** Cancela selección de torre y de construcción (tecla Escape). @returns {void} */
  cancelSelection() {
    this.selectedBuildType = null;
    this.selectedTowerId = null;
    if (this.renderer) {
      this.renderer.setSelectedTower(null);
      this.renderer.setPreview(null);
    }
    this.update();
  }

  /** Pausa o reanuda la partida. @returns {void} */
  togglePause() {
    if (!this.engine) return;
    if (this.engine.state === 'VICTORY' || this.engine.state === 'DEFEAT') return;

    this.engine.isPaused = !this.engine.isPaused;
    this.update();
  }

  /** Alterna 1x / 2x. @returns {void} */
  toggleSpeed() {
    if (!this.engine) return;

    this.engine.gameSpeed = this.engine.gameSpeed === 2 ? 1 : 2;
    this.update();
  }

  /** CA-19: activa o desactiva las oleadas automáticas. @returns {void} */
  toggleAutoWaves() {
    if (!this.engine) return;
    if (this.engine.state === 'VICTORY' || this.engine.state === 'DEFEAT') return;

    this.engine.toggleAutoWaves();
    this.update();
  }

  /**
   * Empieza la partida en fase de construcción (oleada 0, sin enemigos).
   * La primera oleada no se lanza hasta pulsar «Siguiente oleada».
   * @returns {void}
   */
  startGame() {
    if (!this.engine) return;

    const started = this.engine.startGame();
    if (started) this.hideOverlay();
    this.update();
  }

  /** Lanza la siguiente oleada (o paga el bonus si se adelanta). @returns {void} */
  callNextWave() {
    if (!this.engine) return;

    const started = this.engine.callNextWave();
    if (started) this.hideOverlay();
    this.update();
  }

  /** Mejora la torre seleccionada. @returns {boolean} */
  upgradeSelected() {
    if (!this.engine || this.selectedTowerId === null) return false;

    const result = this.engine.upgradeTower(this.selectedTowerId);
    this.update();
    return result !== false;
  }

  /** Vende la torre seleccionada y limpia la selección. @returns {boolean} */
  sellSelected() {
    if (!this.engine || this.selectedTowerId === null) return false;

    const result = this.engine.sellTower(this.selectedTowerId);
    if (result !== false) this.selectTower(null);
    this.update();
    return result !== false;
  }

  // --- Ratón --------------------------------------------------------------

  /**
   * Convierte un evento de ratón en coordenadas internas del canvas,
   * compensando el escalado CSS.
   * @param {MouseEvent} event
   * @returns {{x:number,y:number}|null}
   */
  canvasPoint(event) {
    const canvas = this.refs.canvas;
    if (!canvas || typeof canvas.getBoundingClientRect !== 'function') return null;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  /** Clic en el canvas: selecciona una torre o construye la elegida. @param {MouseEvent} event @returns {void} */
  handleCanvasClick(event) {
    if (!this.engine || !InputMapRef) return;

    const point = this.canvasPoint(event);
    if (!point) return;

    const cell = InputMapRef.cellFromCanvasPoint(this.engine.map, point.x, point.y);
    if (!cell) return;

    const existing = this.engine.towerManager.getTowerAt(cell.col, cell.row);
    if (existing) {
      this.selectTower(existing.id);
      return;
    }

    if (this.selectedBuildType !== null) {
      this.engine.placeTower(this.selectedBuildType, cell.col, cell.row);
      this.lastPointerCell = cell;
      this.updatePreview();
      this.update();
      return;
    }

    this.selectTower(null);
  }

  /** Ratón sobre el canvas: torre fantasma y círculo de alcance. @param {MouseEvent} event @returns {void} */
  handleCanvasMove(event) {
    if (!this.engine || !InputMapRef) return;

    const point = this.canvasPoint(event);
    this.lastPointerCell = point
      ? InputMapRef.cellFromCanvasPoint(this.engine.map, point.x, point.y)
      : null;

    this.updatePreview();
  }

  /** Refresca la torre fantasma en la última casilla señalada. @returns {void} */
  updatePreview() {
    if (!this.renderer) return;

    const cell = this.lastPointerCell;
    const type = this.selectedBuildType;
    if (!cell || type === null) {
      this.renderer.setPreview(null);
      return;
    }

    this.renderer.setPreview({
      col: cell.col,
      row: cell.row,
      type,
      buildable: this.isPlacementPossible(cell.col, cell.row, type),
    });
  }

  /** @returns {void} */
  clearPreview() {
    this.lastPointerCell = null;
    if (this.renderer) this.renderer.setPreview(null);
  }

  /**
   * Casilla construible y con oro suficiente para el tipo elegido.
   * @param {number} col
   * @param {number} row
   * @param {string} type
   * @returns {boolean}
   */
  isPlacementPossible(col, row, type) {
    if (!this.engine || !this.engine.map) return false;
    if (!this.engine.map.isCellBuildable(col, row)) return false;

    const cost = TowerRefUI ? TowerRefUI.getBaseCost(type) : null;
    return cost !== null && this.engine.gold >= cost;
  }

  /**
   * Escribe texto solo si ha cambiado (evita repintados innecesarios por frame).
   * @param {HTMLElement|null} element
   * @param {string|number} value
   * @returns {void}
   */
  setText(element, value) {
    if (!element) return;
    const text = String(value);
    if (element.textContent !== text) element.textContent = text;
  }
}

UIController.TOWER_LABELS = TOWER_LABELS;

if (typeof window !== 'undefined') {
  window.UIController = UIController;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIController;
}
