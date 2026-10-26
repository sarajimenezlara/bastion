// WaveManager: contenedor de estado de oleadas.
// En esta fase solo se define el estado inicial; la lógica de oleadas llega en la Fase 4.

class WaveManager {
  /**
   * @param {Array} waveDefinitions configuración fija de las 10 oleadas
   * @param {number} healthMultiplierBase base del escalado de salud (1.12)
   */
  constructor(waveDefinitions = [], healthMultiplierBase = 1.12) {
    this.currentWaveIndex = 0;
    this.totalWaves = 10;
    this.waveDefinitions = waveDefinitions;
    this.healthMultiplierBase = healthMultiplierBase;
    this.spawnTimer = 0;
    this.spawnQueue = [];
    this.isWaveActive = false;
  }
}

if (typeof window !== 'undefined') {
  window.WaveManager = WaveManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WaveManager;
}
