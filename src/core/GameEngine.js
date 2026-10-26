// GameEngine: estado y punto de entrada de la partida.
// Fase 1: inicialización (CA-01). Fase 2: construcción y reventa (CA-04 a CA-06).
// Fase 3: mejora de torres, selección de objetivo, disparo y proyectiles (CA-07 a CA-10).
// Fase 4: oleadas, vidas, victoria/derrota y puntuación (CA-11 a CA-13).

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

const EnemyRef =
  typeof window !== 'undefined' && window.Enemy
    ? window.Enemy
    : typeof require !== 'undefined'
      ? require('./Enemy.js')
      : null;

class GameEngine {
  constructor() {
    this.lives = 20;
    this.gold = 150;
    this.totalGoldEarned = 150;
    this.score = 0;
    this.isPaused = false;
    this.gameSpeed = 1; // 1x o 2x
    // 'MENU' | 'PLAYING' | 'VICTORY' | 'DEFEAT'
    // Nota: el GDD llama 'GAMEOVER' al fin de partida perdido; la decisión 3 de
    // docs/decisiones/fase-4.md fija el nombre 'DEFEAT'.
    this.state = 'MENU';

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
   * CA-12: daño a la meta según la Tabla 2 (jefe 5 vidas, resto 1).
   * @param {object} enemy
   * @returns {number}
   */
  getGoalDamage(enemy) {
    if (!enemy) return 0;
    if (Number.isFinite(enemy.goalDamage) && enemy.goalDamage > 0) {
      return enemy.goalDamage;
    }
    return enemy.isBoss ? 5 : 1;
  }

  /**
   * CA-11 / CA-12: crea un enemigo a partir del descriptor del WaveManager
   * (vida ya escalada) y lo coloca en la entrada del camino.
   * @param {object} spawn descriptor generado por WaveManager.update
   * @returns {object|null} enemigo añadido a `this.enemies`
   */
  spawnEnemy(spawn) {
    if (!spawn || !spawn.type) return null;

    const enemy = new EnemyRef(
      null,
      spawn.type,
      spawn.health,
      spawn.speed,
      spawn.armor,
      spawn.reward,
      spawn.isBoss === true
    );

    // Daño a la meta de la Tabla 2 (el jefe resta 5 vidas).
    enemy.goalDamage = Number.isFinite(spawn.goalDamage)
      ? spawn.goalDamage
      : enemy.isBoss
        ? 5
        : 1;

    // Los enemigos entran por la primera casilla del camino serpentina.
    const start = this.map.getWaypointsInPixels()[0];
    if (start) {
      enemy.position.x = start.x;
      enemy.position.y = start.y;
    }

    this.enemies.push(enemy);
    return enemy;
  }

  /**
   * Lanza la siguiente oleada y pone la partida en marcha.
   * @returns {object|false} definición de la oleada o false si no procede
   */
  startNextWave() {
    const definition = this.waveManager.startNextWave();
    if (!definition) return false;

    this.state = 'PLAYING';
    return definition;
  }

  /**
   * GDD §3.5: bonus por llamar a la oleada antes de que salgan todos los enemigos.
   * @returns {number} oro entregado (0 si no hay oleada activa o cola pendiente)
   */
  earlyWaveCall() {
    if (!this.waveManager.isWaveActive) return 0;

    const pending = this.waveManager.pendingCount();
    if (pending <= 0) return 0;

    const bonus = Math.floor(pending * 2) + 15;
    this.gold += bonus;
    this.totalGoldEarned += bonus;
    return bonus;
  }

  /** GDD §2: puntuación final = OroGanado + (Vidas × 50). @returns {number} */
  calculateFinalScore() {
    return this.totalGoldEarned + this.lives * 50;
  }

  /**
   * Elimina enemigos muertos (entregando su recompensa) y los que alcanzaron la meta.
   * Se hace por filtrado al final del tick, nunca con splice durante el recorrido.
   * @returns {void}
   */
  cleanupEnemies() {
    const survivors = [];

    for (const enemy of this.enemies) {
      if (!enemy) continue;

      if (enemy.isDead) {
        const reward = Number(enemy.reward) || 0;
        this.gold += reward;
        this.totalGoldEarned += reward;
        continue;
      }

      // Ya restó vidas al alcanzar la meta (CA-12); no vuelve a la colección.
      if (enemy.hasReachedEnd) continue;

      survivors.push(enemy);
    }

    this.enemies = survivors;
  }

  /**
   * CA-13: cierra la oleada cuando no quedan spawns pendientes ni enemigos vivos,
   * paga la recompensa de fin de oleada y declara la victoria tras la oleada 10.
   * @returns {void}
   */
  updateWaveState() {
    if (!this.waveManager.isWaveActive) return;
    if (!this.waveManager.isSpawnQueueEmpty()) return;
    if (this.enemies.length > 0) return;

    const completed = this.waveManager.completeWave();
    if (!completed) return;

    const reward = Number(completed.reward) || 0;
    this.gold += reward;
    this.totalGoldEarned += reward;

    if (this.waveManager.isCampaignComplete()) {
      this.state = 'VICTORY';
      this.score = this.calculateFinalScore();
    }
  }

  /**
   * CA-11 a CA-13: bucle lógico con gestión centralizada delegada
   * (docs/decisiones/fase-4.md, decisión 1). Orden estricto:
   * oleadas → enemigos → torres → proyectiles → limpieza → estado de oleada.
   * @param {number} deltaTime segundos
   * @returns {void}
   */
  tick(deltaTime) {
    if (this.isPaused) return;
    if (this.state === 'VICTORY' || this.state === 'DEFEAT') return;

    const delta = Math.max(0, Number(deltaTime) || 0) * this.gameSpeed;
    if (delta <= 0) return;

    // 1) Oleadas: cada grupo activo avanza su propio flujo de spawn.
    this.waveManager.update(delta, (spawn) => this.spawnEnemy(spawn));

    // 2) Enemigos: movimiento y daño a la meta (CA-12).
    const pathWaypoints = this.map.getWaypointsInPixels();
    for (const enemy of this.enemies) {
      if (!enemy || enemy.isDead) continue;

      enemy.update(delta, pathWaypoints);
      if (enemy.hasReachedEnd) {
        this.lives = Math.max(0, this.lives - this.getGoalDamage(enemy));
      }
    }

    // La derrota tiene prioridad sobre la victoria (docs/decisiones/fase-4.md, decisión 3).
    if (this.lives <= 0) {
      this.cleanupEnemies();
      this.state = 'DEFEAT';
      this.score = this.calculateFinalScore();
      return;
    }

    // 3) Torres: cadencia y disparo al objetivo más avanzado.
    for (const tower of this.towers) {
      tower.update(delta, this.enemies, (source, target) =>
        this.createProjectile(source, target)
      );
    }

    // 4) Proyectiles: avance e impacto.
    this.projectiles = this.projectiles.filter(
      (projectile) => !projectile.update(delta, this.enemies)
    );

    // 5) Limpieza y recompensas por enemigo derrotado.
    this.cleanupEnemies();

    // 6) Recompensa de oleada y transición a VICTORY tras la oleada 10 (CA-13).
    this.updateWaveState();
  }
}

if (typeof window !== 'undefined') {
  window.GameEngine = GameEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
