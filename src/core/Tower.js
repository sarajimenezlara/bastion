// Tower: entidad construible del core (nivel, inversión, reventa y combate).
// Fase 3: selección de objetivo (CA-08), disparo con cadencia y mejora de nivel (CA-07).
// Los atributos salen del catálogo del GDD (Tabla 1).
// Patrón UMD simplificado: compatible con navegador (window) y node --test (CommonJS).

const Vector2DRefTower =
  typeof window !== 'undefined' && window.Vector2D
    ? window.Vector2D
    : typeof require !== 'undefined'
      ? require('./Vector2D.js')
      : null;

// Catálogo de la Tabla 1 del GDD. `levels[i]` corresponde al nivel i + 1.
const TOWER_CONFIGS = {
  Ballesta: {
    baseCost: 50,
    levels: [
      { upgradeCost: 0, range: 120, damage: 18, fireRate: 1.5, projectileSpeed: 400, damageType: 'PHYSICAL', areaOfEffect: 0, slowFactor: 0, slowDuration: 0 },
      { upgradeCost: 100, range: 135, damage: 32, fireRate: 1.8, projectileSpeed: 450, damageType: 'PHYSICAL', areaOfEffect: 0, slowFactor: 0, slowDuration: 0 },
      { upgradeCost: 150, range: 150, damage: 52, fireRate: 2.2, projectileSpeed: 500, damageType: 'PHYSICAL', areaOfEffect: 0, slowFactor: 0, slowDuration: 0 },
    ],
  },
  Canon: {
    baseCost: 100,
    levels: [
      { upgradeCost: 0, range: 100, damage: 45, fireRate: 0.5, projectileSpeed: 250, damageType: 'PHYSICAL', areaOfEffect: 50, slowFactor: 0, slowDuration: 0 },
      { upgradeCost: 200, range: 115, damage: 85, fireRate: 0.6, projectileSpeed: 280, damageType: 'PHYSICAL', areaOfEffect: 60, slowFactor: 0, slowDuration: 0 },
      { upgradeCost: 300, range: 130, damage: 140, fireRate: 0.7, projectileSpeed: 320, damageType: 'PHYSICAL', areaOfEffect: 70, slowFactor: 0, slowDuration: 0 },
    ],
  },
  Escarcha: {
    baseCost: 80,
    levels: [
      { upgradeCost: 0, range: 90, damage: 5, fireRate: 0.8, projectileSpeed: 300, damageType: 'MAGIC', areaOfEffect: 0, slowFactor: 0.6, slowDuration: 2 },
      { upgradeCost: 160, range: 100, damage: 12, fireRate: 1.0, projectileSpeed: 330, damageType: 'MAGIC', areaOfEffect: 0, slowFactor: 0.6, slowDuration: 2 },
      { upgradeCost: 240, range: 110, damage: 25, fireRate: 1.2, projectileSpeed: 360, damageType: 'MAGIC', areaOfEffect: 0, slowFactor: 0.6, slowDuration: 2 },
    ],
  },
  Arcana: {
    baseCost: 150,
    levels: [
      { upgradeCost: 0, range: 140, damage: 45, fireRate: 0.7, projectileSpeed: 350, damageType: 'MAGIC', areaOfEffect: 0, slowFactor: 0, slowDuration: 0 },
      { upgradeCost: 300, range: 155, damage: 90, fireRate: 0.8, projectileSpeed: 400, damageType: 'MAGIC', areaOfEffect: 0, slowFactor: 0, slowDuration: 0 },
      { upgradeCost: 450, range: 170, damage: 160, fireRate: 0.9, projectileSpeed: 450, damageType: 'MAGIC', areaOfEffect: 0, slowFactor: 0, slowDuration: 0 },
    ],
  },
};

// Contador global incremental (decisión de docs/decisiones/fase-1.md).
let towerIdCounter = 0;

class Tower {
  /**
   * @param {number|string|null} id identificador; si se omite se genera con el contador global
   * @param {string} type clave del catálogo: 'Ballesta' | 'Canon' | 'Escarcha' | 'Arcana'
   * @param {number} col columna de la rejilla
   * @param {number} row fila de la rejilla
   * @param {object} [config] configuración ya resuelta; por defecto, nivel 1 del catálogo
   */
  constructor(id, type, col, row, config) {
    const resolved = config || Tower.getConfig(type, 1);
    if (!resolved) {
      throw new Error(`Tipo de torre desconocido: ${type}`);
    }

    this.id = id === undefined || id === null ? Tower.nextId() : id;
    this.type = type;
    this.col = col;
    this.row = row;
    this.level = resolved.level;
    this.maxLevel = Tower.CONFIGS[type].levels.length;
    this.baseCost = resolved.baseCost;
    // Inversión acumulada: coste base + mejoras pagadas (CA-07).
    this.totalInvested = resolved.baseCost;
    this.range = resolved.range; // px
    this.damage = resolved.damage;
    this.fireRate = resolved.fireRate; // disparos por segundo
    this.projectileSpeed = resolved.projectileSpeed; // px/s
    this.damageType = resolved.damageType; // 'PHYSICAL' | 'MAGIC'
    this.areaOfEffect = resolved.areaOfEffect || 0; // radio en px
    this.slowFactor = resolved.slowFactor || 0;
    this.slowDuration = resolved.slowDuration || 0;
    this.cooldownTimer = 0;
    // Centro de la casilla en píxeles; TowerManager lo ajusta con la rejilla real.
    const center = Tower.cellCenter(col, row);
    this.position = new Vector2DRefTower(center.x, center.y);
  }

  /**
   * Centro en píxeles de una casilla con el tamaño de baldosa por defecto (40 px).
   * @param {number} col
   * @param {number} row
   * @returns {{x:number,y:number}}
   */
  static cellCenter(col, row) {
    return {
      x: col * Tower.TILE_SIZE + Tower.TILE_SIZE / 2,
      y: row * Tower.TILE_SIZE + Tower.TILE_SIZE / 2,
    };
  }

  /** Genera el siguiente identificador del contador global. */
  static nextId() {
    towerIdCounter += 1;
    return towerIdCounter;
  }

  /** Solo para pruebas: reinicia el contador global de identificadores. */
  static resetIdCounter() {
    towerIdCounter = 0;
  }

  /**
   * Configuración completa de un tipo de torre en un nivel concreto.
   * @param {string} type
   * @param {number} [level] 1..3
   * @returns {object|null} null si el tipo o el nivel no existen
   */
  static getConfig(type, level = 1) {
    const entry = Tower.CONFIGS[type];
    if (!entry) return null;
    const index = level - 1;
    if (!Number.isInteger(index) || index < 0 || index >= entry.levels.length) return null;

    return {
      type,
      level,
      baseCost: entry.baseCost,
      ...entry.levels[index],
    };
  }

  /**
   * Coste base (nivel 1) de un tipo de torre.
   * @param {string} type
   * @returns {number|null} null si el tipo no existe
   */
  static getBaseCost(type) {
    const entry = Tower.CONFIGS[type];
    return entry ? entry.baseCost : null;
  }

  /**
   * CA-07: coste exacto de la siguiente mejora, CosteBase × NivelDestino (Tabla 1).
   * @returns {number|null} null si la torre ya está al máximo
   */
  getUpgradeCost() {
    if (this.level >= this.maxLevel) return null;
    return Tower.getUpgradeCost(this.type, this.level + 1);
  }

  /**
   * CA-07: coste de mejora de un tipo hasta un nivel destino (CosteBase × NivelDestino).
   * @param {string} type
   * @param {number} targetLevel 2..maxLevel
   * @returns {number|null} null si el tipo o el nivel no son válidos
   */
  static getUpgradeCost(type, targetLevel) {
    const entry = Tower.CONFIGS[type];
    if (!entry) return null;
    if (!Number.isInteger(targetLevel)) return null;
    if (targetLevel < 2 || targetLevel > entry.levels.length) return null;
    return entry.baseCost * targetLevel;
  }

  /**
   * CA-07: sube un nivel, aplica las estadísticas de la Tabla 1 y acumula la inversión.
   * No gestiona oro (lo hace GameEngine.upgradeTower).
   * @returns {number|false} coste pagado o false si ya está al máximo
   */
  upgrade() {
    const cost = this.getUpgradeCost();
    if (cost === null) return false;

    const config = Tower.getConfig(this.type, this.level + 1);
    if (!config) return false;

    this.level = config.level;
    this.range = config.range;
    this.damage = config.damage;
    this.fireRate = config.fireRate;
    this.projectileSpeed = config.projectileSpeed;
    this.damageType = config.damageType;
    this.areaOfEffect = config.areaOfEffect || 0;
    this.slowFactor = config.slowFactor || 0;
    this.slowDuration = config.slowDuration || 0;
    this.totalInvested += cost;

    return cost;
  }

  /**
   * CA-08: enemigo dentro del rango con mayor `distanceTraveled` (el más avanzado).
   * Los enemigos muertos o que ya alcanzaron la meta se ignoran.
   * @param {Array} enemies
   * @returns {object|null}
   */
  findTarget(enemies = []) {
    if (!Array.isArray(enemies)) return null;

    let best = null;
    for (const enemy of enemies) {
      if (!enemy || enemy.isDead || enemy.hasReachedEnd) continue;
      if (!enemy.position) continue;

      const distance = Math.hypot(
        enemy.position.x - this.position.x,
        enemy.position.y - this.position.y
      );
      if (distance > this.range) continue;
      if (best === null || enemy.distanceTraveled > best.distanceTraveled) {
        best = enemy;
      }
    }

    return best;
  }

  /**
   * CA-08 / CA-10: procesa la cadencia y dispara al objetivo elegido.
   * @param {number} deltaTime segundos
   * @param {Array} enemies
   * @param {Function} [createProjectileCallback] (tower, target) => Projectile
   * @returns {object|null} último proyectil creado en este tick
   */
  update(deltaTime, enemies = [], createProjectileCallback = null) {
    const delta = Math.max(0, Number(deltaTime) || 0);
    this.cooldownTimer -= delta;

    const period = this.fireRate > 0 ? 1 / this.fireRate : 0;
    let lastProjectile = null;
    let shots = 0;

    // Bucle acotado: permite recuperar cadencia con deltas grandes sin desbordarse.
    while (this.cooldownTimer <= 0 && shots < 10) {
      const target = this.findTarget(enemies);
      if (!target) {
        // Sin objetivo se queda lista para disparar en cuanto aparezca uno.
        this.cooldownTimer = 0;
        break;
      }

      if (typeof createProjectileCallback === 'function') {
        lastProjectile = createProjectileCallback(this, target) || null;
      }

      shots += 1;
      this.cooldownTimer += period > 0 ? period : 1;
      if (period <= 0) break;
    }

    return lastProjectile;
  }

  /**
   * CA-06: valor de reventa, 70% de la inversión total redondeado hacia abajo.
   * @returns {number} oro devuelto
   */
  getRefundValue() {
    return Math.floor(this.totalInvested * 0.7);
  }
}

Tower.CONFIGS = TOWER_CONFIGS;
Tower.TYPES = Object.keys(TOWER_CONFIGS);
Tower.TILE_SIZE = 40;

if (typeof window !== 'undefined') {
  window.Tower = Tower;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Tower;
}
