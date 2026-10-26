// GameEngine: estado y punto de entrada de la partida.
// Fase 1: inicialización (CA-01). Fase 2: construcción y reventa (CA-04 a CA-06).
// Fase 3: mejora de torres, selección de objetivo, disparo y proyectiles (CA-07 a CA-10).

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

const TowerRef =
  typeof window !== 'undefined' && window.Tower
    ? window.Tower
    : typeof require !== 'undefined'
      ? require('./Tower.js')
      : null;

const TowerManagerRef =
  typeof window !== 'undefined' && window.TowerManager
    ? window.TowerManager
    : typeof require !== 'undefined'
      ? require('./TowerManager.js')
      : null;

const ProjectileRef =
  typeof window !== 'undefined' && window.Projectile
    ? window.Projectile
    : typeof require !== 'undefined'
      ? require('./Projectile.js')
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
    // El gestor comparte la misma colección que `this.towers` (CA-01: colecciones vacías).
    this.towerManager = new TowerManagerRef(this.map, this.towers);
  }

  /** Índice de oleada actual (0 antes de empezar la primera oleada). */
  get currentWave() {
    return this.waveManager.currentWaveIndex;
  }

  /**
   * CA-05: construye una torre de nivel 1 si la casilla es válida y hay oro.
   * Un intento fallido no modifica ningún estado (docs/decisiones/fase-2.md, decisión 1).
   * @param {string} type 'Ballesta' | 'Canon' | 'Escarcha' | 'Arcana'
   * @param {number} col
   * @param {number} row
   * @returns {object|false} la torre creada o false
   */
  placeTower(type, col, row) {
    const config = TowerRef.getConfig(type, 1);
    if (!config) return false;
    if (!this.towerManager.canPlace(col, row)) return false;
    if (this.gold < config.baseCost) return false;

    const tower = this.towerManager.addTower(type, col, row);
    if (!tower) return false;

    this.gold -= tower.baseCost;
    return tower;
  }

  /**
   * CA-06: vende una torre y devuelve el 70% de la inversión total.
   * El reembolso no cuenta como oro ganado (no altera `totalGoldEarned`).
   * @param {number|string} towerId
   * @returns {number|false} oro devuelto o false si la torre no existe
   */
  sellTower(towerId) {
    const tower = this.towerManager.getTowerById(towerId);
    if (!tower) return false;

    const refund = tower.getRefundValue();
    this.towerManager.removeTower(towerId);
    this.gold += refund;
    return refund;
  }

  /**
   * CA-07: mejora una torre si existe, no está al máximo y hay oro suficiente.
   * Un intento fallido no modifica ningún estado.
   * @param {number|string} towerId
   * @returns {number|false} coste pagado o false
   */
  upgradeTower(towerId) {
    const tower = this.towerManager.getTowerById(towerId);
    if (!tower) return false;

    const cost = tower.getUpgradeCost();
    if (cost === null || this.gold < cost) return false;

    this.gold -= cost;
    tower.upgrade();
    return cost;
  }

  /**
   * CA-10: crea un proyectil desde el centro de la torre hacia el objetivo elegido.
   * @param {object} tower
   * @param {object} target enemigo objetivo
   * @returns {object} proyectil añadido a `this.projectiles`
   */
  createProjectile(tower, target) {
    const projectile = new ProjectileRef(
      null,
      tower.position,
      target,
      tower.damage,
      tower.damageType,
      tower.projectileSpeed,
      tower.areaOfEffect,
      tower.slowFactor,
      tower.slowDuration
    );

    this.projectiles.push(projectile);
    return projectile;
  }

  /**
   * Bucle lógico de combate de la Fase 3: enemigos, torres y proyectiles.
   * Las oleadas, las vidas y la victoria/derrota llegan en la Fase 4.
   * @param {number} deltaTime segundos
   */
  tick(deltaTime) {
    if (this.isPaused) return;

    const delta = Math.max(0, Number(deltaTime) || 0) * this.gameSpeed;
    if (delta <= 0) return;

    const pathWaypoints = this.map.getWaypointsInPixels();
    for (const enemy of this.enemies) {
      enemy.update(delta, pathWaypoints);
    }

    for (const tower of this.towers) {
      tower.update(delta, this.enemies, (source, target) =>
        this.createProjectile(source, target)
      );
    }

    // Eliminación por filtrado al final del tick, nunca con splice durante el recorrido
    // (docs/decisiones/fase-2.md, decisión 2).
    this.projectiles = this.projectiles.filter(
      (projectile) => !projectile.update(delta, this.enemies)
    );
  }
}

if (typeof window !== 'undefined') {
  window.GameEngine = GameEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
