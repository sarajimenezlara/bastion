// GameEngine: estado y punto de entrada de la partida.
// Fase 1: inicialización (CA-01). Fase 2: construcción y reventa (CA-04 a CA-06).
// Fase 3: mejora de torres, selección de objetivo, disparo y proyectiles (CA-07 a CA-10).
// Fase 4: oleadas, vidas, victoria/derrota y puntuación (CA-11 a CA-13).

const GameMapRef =
  typeof window !== 'undefined' && window.GameMap
    ? window.GameMap
    : typeof require !== 'undefined'
      ? require('./GameMap.js')
      : null;

const WaveManagerRef =
  typeof window !== 'undefined' && window.WaveManager
    ? window.WaveManager
    : typeof require !== 'undefined'
      ? require('./WaveManager.js')
      : null;

const TowerRefEngine =
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

// Mejora 01: retardo entre el fin de una oleada y el lanzamiento automático
// de la siguiente (CA-19).
const AUTO_WAVE_DELAY = 5;
const AUTO_WAVE_EPSILON = 1e-9;

class GameEngine {
  constructor() {
    this.lives = 20;
    this.gold = 220;
    this.totalGoldEarned = 220;
    this.score = 0;
    this.isPaused = false;
    this.gameSpeed = 1; // 1x o 2x
    // 'MENU' | 'PLAYING' | 'VICTORY' | 'DEFEAT'
    // Nota: el GDD llama 'GAMEOVER' al fin de partida perdido; la decisión 3 de
    // docs/decisiones/fase-4.md fija el nombre 'DEFEAT'.
    this.state = 'MENU';

    // CA-19: oleadas automáticas. La primera oleada siempre se lanza a mano.
    this._autoWaves = false;
    this.autoWaveTimer = 0; // segundos restantes de la cuenta atrás (0 = inactiva)

    this.map = new GameMapRef();
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

  /** CA-19: indica si las oleadas automáticas están activadas. @returns {boolean} */
  get autoWaves() {
    return this._autoWaves;
  }

  /**
   * CA-19: al desactivar las oleadas automáticas se cancela la cuenta atrás.
   * @param {boolean} enabled
   * @returns {void}
   */
  set autoWaves(enabled) {
    this._autoWaves = Boolean(enabled);
    if (!this._autoWaves) this.autoWaveTimer = 0;
  }

  /**
   * CA-19: activa o desactiva las oleadas automáticas. Al activarlas, si la
   * partida ya está en marcha y no queda ninguna oleada activa, empieza la
   * cuenta atrás de inmediato.
   * @param {boolean} enabled
   * @returns {boolean} estado resultante
   */
  setAutoWaves(enabled) {
    this.autoWaves = enabled;
    if (this.autoWaves) this.scheduleAutoWaveIfReady();
    return this.autoWaves;
  }

  /**
   * CA-19: alterna las oleadas automáticas.
   * @returns {boolean} estado resultante
   */
  toggleAutoWaves() {
    return this.setAutoWaves(!this.autoWaves);
  }

  /**
   * CA-19: arranca la cuenta atrás de 5 s si procede. La primera oleada es
   * manual, así que solo se programa después de haber lanzado alguna.
   * @returns {boolean} true si ha empezado la cuenta atrás
   */
  scheduleAutoWaveIfReady() {
    if (!this.autoWaves) return false;
    if (this.state !== 'PLAYING') return false;
    if (this.waveManager.isWaveActive) return false;
    if (this.currentWave <= 0) return false;
    if (!this.waveManager.hasMoreWaves()) return false;
    if (this.autoWaveTimer > 0) return false;

    this.autoWaveTimer = AUTO_WAVE_DELAY;
    return true;
  }

  /**
   * CA-19: avanza la cuenta atrás con el delta ya escalado por la velocidad y
   * lanza la siguiente oleada al agotarse, sin bono de llamada anticipada.
   * @param {number} delta segundos ya multiplicados por `gameSpeed`
   * @returns {boolean} true si se ha lanzado la oleada automática
   */
  updateAutoWaves(delta) {
    if (!this.autoWaves) {
      this.autoWaveTimer = 0;
      return false;
    }
    if (this.autoWaveTimer <= 0) return false;

    // Una llamada manual pudo arrancar una oleada: la espera deja de tener sentido.
    if (this.waveManager.isWaveActive) {
      this.autoWaveTimer = 0;
      return false;
    }

    this.autoWaveTimer -= delta;
    if (this.autoWaveTimer > AUTO_WAVE_EPSILON) return false;

    this.autoWaveTimer = 0;
    return Boolean(this.startNextWave());
  }

  /**
   * Empieza la partida en fase de construcción: oleada 0 y sin enemigos.
   * La oleada 1 se lanza aparte con `callNextWave()` («Siguiente oleada»),
   * tal y como fija la entrevista del GDD (activación manual de oleadas).
   * @returns {boolean} true si la partida estaba en MENU y ha arrancado
   */
  startGame() {
    if (this.state !== 'MENU') return false;

    this.state = 'PLAYING';
    return true;
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
    const config = TowerRefEngine.getConfig(type, 1);
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

    // Oleada de procedencia: permite cerrar y pagar cada oleada por separado
    // cuando dos oleadas se solapan por una llamada anticipada (CA-17).
    if (Number.isFinite(spawn.waveNumber)) {
      enemy.waveNumber = spawn.waveNumber;
    }

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

    // Cualquier lanzamiento cancela la espera de las oleadas automáticas.
    this.autoWaveTimer = 0;
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

  /**
   * CA-17: lanza la siguiente oleada, aunque la actual siga activa.
   * Sin oleada activa arranca la siguiente; si ya hay una y quedan oleadas,
   * paga el bono de llamada anticipada y añade los grupos de la siguiente a la
   * cola de spawn (sus enemigos empiezan a salir de inmediato).
   * @returns {object|false} definición de la oleada lanzada o false si no procede
   */
  callNextWave() {
    // Pulsar «Siguiente oleada» adelanta la cuenta atrás automática.
    this.autoWaveTimer = 0;

    if (!this.waveManager.isWaveActive) {
      const definition = this.waveManager.startNextWave();
      if (!definition) return false;

      this.state = 'PLAYING';
      return definition;
    }

    if (!this.waveManager.hasMoreWaves()) return false;

    this.earlyWaveCall();
    const definition = this.waveManager.queueNextWave();
    if (!definition) return false;

    this.state = 'PLAYING';
    return definition;
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
   * CA-13 / CA-17: cierra cada oleada cuando no le quedan spawns pendientes ni
   * enemigos vivos, paga su recompensa de fin de oleada y declara la victoria
   * tras completar la oleada 10. Las oleadas solapadas se pagan por separado.
   * @returns {void}
   */
  updateWaveState() {
    if (!this.waveManager.isWaveActive) return;

    for (const waveNumber of this.waveManager.getActiveWaves()) {
      if (this.waveManager.getPendingForWave(waveNumber) > 0) continue;

      const alive = this.enemies.some(
        (enemy) => enemy && enemy.waveNumber === waveNumber
      );
      if (alive) continue;

      const completed = this.waveManager.completeWave(waveNumber);
      if (!completed) continue;

      const reward = Number(completed.reward) || 0;
      this.gold += reward;
      this.totalGoldEarned += reward;
    }

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

    // 0) Cuenta atrás de las oleadas automáticas (CA-19).
    this.updateAutoWaves(delta);

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

    // CA-19: al terminar una oleada con «Auto» activo, prepara la siguiente.
    this.scheduleAutoWaveIfReady();
  }
}

GameEngine.AUTO_WAVE_DELAY = AUTO_WAVE_DELAY;

if (typeof window !== 'undefined') {
  window.GameEngine = GameEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
