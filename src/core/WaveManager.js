// WaveManager: definición de las 10 oleadas, flujos de spawn independientes y
// escalado de salud de los enemigos (CA-11).
//
// Decisiones de docs/decisiones/fase-4.md:
// - Cada grupo de la Tabla 3 (p. ej. «1x Jefe» y «10x Guerrero») es un flujo de spawn
//   independiente que arranca a la vez al lanzar la oleada, con su propio intervalo.
//   El jefe es un grupo más y no pausa al resto.
// - La oleada termina cuando todos los grupos han salido y no queda ningún enemigo vivo
//   en el mapa; el GameEngine es quien paga la recompensa de fin de oleada.
//
// Patrón UMD simplificado: compatible con navegador (window) y node --test (CommonJS).

// Catálogo de enemigos de la Tabla 2 del GDD (atributos base, sin escalado de oleada).
const ENEMY_TYPES = {
  Enjambre: { baseHealth: 25, speed: 60, armor: 0, reward: 2, goalDamage: 1, isBoss: false },
  Duende: { baseHealth: 50, speed: 85, armor: 0, reward: 4, goalDamage: 1, isBoss: false },
  Guerrero: { baseHealth: 120, speed: 50, armor: 5, reward: 8, goalDamage: 1, isBoss: false },
  Tanque: { baseHealth: 350, speed: 30, armor: 15, reward: 18, goalDamage: 1, isBoss: false },
  Golem: { baseHealth: 1200, speed: 20, armor: 25, reward: 100, goalDamage: 5, isBoss: true },
};

// Configuración fija de las 10 oleadas (Tabla 3 del GDD).
// `interval` es el tiempo en segundos entre dos enemigos del mismo grupo.
const WAVE_DEFINITIONS = [
  { wave: 1, reward: 25, groups: [{ type: 'Enjambre', count: 10, interval: 0.6 }] },
  {
    wave: 2,
    reward: 30,
    groups: [
      { type: 'Duende', count: 8, interval: 0.8 },
      { type: 'Guerrero', count: 4, interval: 1.2 },
    ],
  },
  {
    wave: 3,
    reward: 35,
    groups: [
      { type: 'Enjambre', count: 15, interval: 0.5 },
      { type: 'Duende', count: 6, interval: 0.7 },
    ],
  },
  {
    wave: 4,
    reward: 40,
    groups: [
      { type: 'Guerrero', count: 10, interval: 1.0 },
      { type: 'Tanque', count: 2, interval: 2.5 },
    ],
  },
  {
    wave: 5,
    reward: 75,
    groups: [
      { type: 'Golem', count: 1, interval: 1.0 },
      { type: 'Guerrero', count: 10, interval: 1.0 },
    ],
  },
  {
    wave: 6,
    reward: 50,
    groups: [
      { type: 'Enjambre', count: 25, interval: 0.4 },
      { type: 'Tanque', count: 5, interval: 2.0 },
    ],
  },
  {
    wave: 7,
    reward: 55,
    groups: [
      { type: 'Duende', count: 15, interval: 0.6 },
      { type: 'Guerrero', count: 10, interval: 0.8 },
      { type: 'Tanque', count: 4, interval: 1.8 },
    ],
  },
  {
    wave: 8,
    reward: 60,
    groups: [
      { type: 'Enjambre', count: 30, interval: 0.3 },
      { type: 'Tanque', count: 8, interval: 1.5 },
    ],
  },
  {
    wave: 9,
    reward: 70,
    groups: [
      { type: 'Duende', count: 20, interval: 0.5 },
      { type: 'Guerrero', count: 15, interval: 0.7 },
      { type: 'Tanque', count: 6, interval: 1.5 },
    ],
  },
  {
    wave: 10,
    reward: 150,
    groups: [
      { type: 'Golem', count: 2, interval: 5.0 },
      { type: 'Guerrero', count: 20, interval: 0.6 },
      { type: 'Tanque', count: 10, interval: 1.2 },
    ],
  },
];

// Margen para comparar tiempos acumulados con delta de coma flotante.
const TIME_EPSILON = 1e-9;

class WaveManager {
  /**
   * @param {Array} [waveDefinitions] configuración de oleadas; por defecto, la Tabla 3
   * @param {number} [healthMultiplierBase] base del escalado de salud (1.12)
   */
  constructor(waveDefinitions, healthMultiplierBase = 1.12) {
    const definitions =
      Array.isArray(waveDefinitions) && waveDefinitions.length > 0
        ? waveDefinitions
        : WAVE_DEFINITIONS;

    // Copia normalizada: cada oleada conserva su número y sus grupos.
    this.waveDefinitions = definitions.map((definition, index) => ({
      wave: definition.wave || index + 1,
      reward: Number(definition.reward) || 0,
      groups: (definition.groups || []).map((group) => ({
        type: group.type,
        count: Math.max(0, Math.floor(group.count) || 0),
        interval: Math.max(0, Number(group.interval) || 0),
      })),
    }));

    this.currentWaveIndex = 0; // número de la última oleada lanzada (0 = sin empezar)
    this.totalWaves = this.waveDefinitions.length;
    this.healthMultiplierBase = healthMultiplierBase;
    this.spawnTimer = 0; // segundos transcurridos de la oleada activa
    this.spawnQueue = []; // eventos de spawn pendientes, ordenados por tiempo
    this.isWaveActive = false;
    this.completedWaves = 0;
  }

  /**
   * Configuración base de un tipo de enemigo (Tabla 2).
   * @param {string} type 'Enjambre' | 'Duende' | 'Guerrero' | 'Tanque' | 'Golem'
   * @returns {object|null} copia de la configuración o null si el tipo no existe
   */
  static getEnemyConfig(type) {
    if (!Object.prototype.hasOwnProperty.call(ENEMY_TYPES, type)) return null;
    return { type, ...ENEMY_TYPES[type] };
  }

  /**
   * CA-11: vida final de un enemigo en la oleada N.
   * Fórmula estricta del GDD: Math.floor(VidaBase × 1.12^(N-1)).
   * @param {number} baseHealth vida base del tipo
   * @param {number} waveNumber número de oleada (1..10)
   * @param {number} [healthMultiplierBase] base del escalado (1.12)
   * @returns {number|null} vida escalada o null si los parámetros no son válidos
   */
  static getScaledHealth(baseHealth, waveNumber, healthMultiplierBase = 1.12) {
    if (!Number.isFinite(baseHealth) || baseHealth <= 0) return null;
    if (!Number.isInteger(waveNumber) || waveNumber < 1) return null;

    return Math.floor(
      baseHealth * Math.pow(healthMultiplierBase, waveNumber - 1)
    );
  }

  /**
   * CA-11: vida final de un tipo de enemigo en una oleada concreta.
   * @param {string} type
   * @param {number} waveNumber
   * @returns {number|null}
   */
  getEnemyHealth(type, waveNumber) {
    const config = WaveManager.getEnemyConfig(type);
    if (!config) return null;
    return WaveManager.getScaledHealth(
      config.baseHealth,
      waveNumber,
      this.healthMultiplierBase
    );
  }

  /**
   * Configuración de una oleada por su número.
   * @param {number} waveNumber 1..totalWaves
   * @returns {object|null}
   */
  getWaveDefinition(waveNumber) {
    return this.waveDefinitions.find((definition) => definition.wave === waveNumber) || null;
  }

  /**
   * Lanza la siguiente oleada: genera un flujo de spawn por grupo, todos con
   * tiempo de inicio 0 (arrancan a la vez) y su propio intervalo.
   * @returns {object|null} definición de la oleada lanzada o null si no procede
   */
  startNextWave() {
    if (this.isWaveActive) return null;
    if (this.currentWaveIndex >= this.totalWaves) return null;

    const waveNumber = this.currentWaveIndex + 1;
    const definition = this.getWaveDefinition(waveNumber);
    if (!definition) return null;

    this.currentWaveIndex = waveNumber;
    this.spawnTimer = 0;
    this.spawnQueue = [];

    definition.groups.forEach((group, groupIndex) => {
      for (let index = 0; index < group.count; index += 1) {
        this.spawnQueue.push({
          type: group.type,
          waveNumber,
          time: index * group.interval,
          group: groupIndex,
          index,
        });
      }
    });

    // Orden estable: primero el más antiguo y, a igualdad de tiempo, el orden de la tabla.
    this.spawnQueue.sort(
      (a, b) => a.time - b.time || a.group - b.group || a.index - b.index
    );

    this.isWaveActive = this.spawnQueue.length > 0;
    return definition;
  }

  /**
   * Procesa la cola de spawn con el delta de tiempo.
   * @param {number} deltaTime segundos
   * @param {Function} [spawnEnemyCallback] recibe un descriptor con la vida ya escalada
   * @returns {Array<object>} descriptores de los enemigos generados en este tick
   */
  update(deltaTime, spawnEnemyCallback) {
    if (!this.isWaveActive) return [];

    const delta = Math.max(0, Number(deltaTime) || 0);
    this.spawnTimer += delta;

    const spawned = [];
    while (
      this.spawnQueue.length > 0 &&
      this.spawnQueue[0].time <= this.spawnTimer + TIME_EPSILON
    ) {
      const event = this.spawnQueue.shift();
      const config = WaveManager.getEnemyConfig(event.type);
      if (!config) continue;

      const payload = {
        type: event.type,
        waveNumber: event.waveNumber,
        health: this.getEnemyHealth(event.type, event.waveNumber),
        speed: config.speed,
        armor: config.armor,
        reward: config.reward,
        goalDamage: config.goalDamage,
        isBoss: config.isBoss,
      };

      if (typeof spawnEnemyCallback === 'function') {
        spawnEnemyCallback(payload);
      }
      spawned.push(payload);
    }

    return spawned;
  }

  /** @returns {boolean} true si todos los enemigos de la oleada ya han salido */
  isSpawnQueueEmpty() {
    return this.spawnQueue.length === 0;
  }

  /** @returns {number} enemigos pendientes de salir (usado por el bonus de llamada anticipada) */
  pendingCount() {
    return this.spawnQueue.length;
  }

  /** @returns {boolean} true si quedan oleadas por lanzar */
  hasMoreWaves() {
    return this.currentWaveIndex < this.totalWaves;
  }

  /**
   * Marca la oleada activa como terminada. El GameEngine solo debe llamarlo cuando
   * la cola está vacía y no quedan enemigos vivos (decisión 2 de la fase 4).
   * @returns {object|null} definición de la oleada completada o null si no procede
   */
  completeWave() {
    if (!this.isWaveActive) return null;
    if (!this.isSpawnQueueEmpty()) return null;

    const definition = this.getWaveDefinition(this.currentWaveIndex);
    this.isWaveActive = false;
    this.spawnTimer = 0;
    this.completedWaves = Math.max(this.completedWaves, this.currentWaveIndex);
    return definition;
  }

  /** @returns {boolean} true si las 10 oleadas se han completado */
  isCampaignComplete() {
    return this.completedWaves >= this.totalWaves;
  }
}

WaveManager.ENEMY_TYPES = ENEMY_TYPES;
WaveManager.WAVE_DEFINITIONS = WAVE_DEFINITIONS;

if (typeof window !== 'undefined') {
  window.WaveManager = WaveManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WaveManager;
}
