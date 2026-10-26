// GameEngine: estado y punto de entrada de la partida.
// En la Fase 1 solo se define la inicialización exigida por CA-01.

const MapRef =
  typeof window !== 'undefined' && window.Map
    ? window.Map
    : typeof require !== 'undefined'
      ? require('./Map.js')
      : null;

const WaveManagerRef =
  typeof window !== 'undefined' && window.WaveManager
    ? window.WaveManager
    : typeof require !== 'undefined'
      ? require('./WaveManager.js')
      : null;

class GameEngine {
  constructor() {
    this.lives = 20;
    this.gold = 150;
    this.totalGoldEarned = 150;
    this.score = 0;
    this.isPaused = false;
    this.gameSpeed = 1; // 1x o 2x
    this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'VICTORY' | 'GAMEOVER'

    this.map = new MapRef();
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.waveManager = new WaveManagerRef();
  }

  /** Índice de oleada actual (0 antes de empezar la primera oleada). */
  get currentWave() {
    return this.waveManager.currentWaveIndex;
  }
}

if (typeof window !== 'undefined') {
  window.GameEngine = GameEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
