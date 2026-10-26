// Tower: entidad construible del core (nivel, inversión y valor de reventa).
// Los atributos de combate se limitan a los datos del catálogo del GDD (Tabla 1):
// disparar, apuntar y mejorar son responsabilidad de la Fase 3.
// Patrón UMD simplificado: compatible con navegador (window) y node --test (CommonJS).

// Catálogo de la Tabla 1 del GDD. `levels[i]` corresponde al nivel i + 1.
const TOWER_CONFIGS = {
  Ballesta: {
    baseCost: 50,
    levels: [
      { upgradeCost: 0, range: 120, damage: 12, fireRate: 1.5, projectileSpeed: 400, damageType: 'PHYSICAL', areaOfEffect: 0, slowFactor: 0, slowDuration: 0 },
      { upgradeCost: 100, range: 135, damage: 22, fireRate: 1.8, projectileSpeed: 450, damageType: 'PHYSICAL', areaOfEffect: 0, slowFactor: 0, slowDuration: 0 },
      { upgradeCost: 150, range: 150, damage: 38, fireRate: 2.2, projectileSpeed: 500, damageType: 'PHYSICAL', areaOfEffect: 0, slowFactor: 0, slowDuration: 0 },
    ],
  },
  Canon: {
    baseCost: 100,
    levels: [
      { upgradeCost: 0, range: 100, damage: 30, fireRate: 0.5, projectileSpeed: 250, damageType: 'PHYSICAL', areaOfEffect: 50, slowFactor: 0, slowDuration: 0 },
      { upgradeCost: 200, range: 115, damage: 60, fireRate: 0.6, projectileSpeed: 280, damageType: 'PHYSICAL', areaOfEffect: 60, slowFactor: 0, slowDuration: 0 },
      { upgradeCost: 300, range: 130, damage: 105, fireRate: 0.7, projectileSpeed: 320, damageType: 'PHYSICAL', areaOfEffect: 70, slowFactor: 0, slowDuration: 0 },
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
    // Inversión acumulada: coste base + mejoras pagadas (las mejoras llegan en la Fase 3).
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
   * CA-06: valor de reventa, 70% de la inversión total redondeado hacia abajo.
   * @returns {number} oro devuelto
   */
  getRefundValue() {
    return Math.floor(this.totalInvested * 0.7);
  }
}

Tower.CONFIGS = TOWER_CONFIGS;
Tower.TYPES = Object.keys(TOWER_CONFIGS);

if (typeof window !== 'undefined') {
  window.Tower = Tower;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Tower;
}
