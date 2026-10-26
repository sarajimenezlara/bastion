// Projectile: proyectil del core con movimiento, impacto y daño.
// Reglas de la Fase 3 (docs/decisiones/fase-3.md):
// - Tras impactar desaparece inmediatamente del core (el efecto visual es de la Fase 5).
// - Si el objetivo muere antes del impacto, los proyectiles normales se descartan sin daño;
//   el proyectil del Cañón (AoE > 0) sigue hasta la última posición conocida y aplica el área allí.
// - El paso de cada tick se limita a la distancia restante para no atravesar al enemigo.
// Patrón UMD simplificado: compatible con navegador (window) y node --test (CommonJS).

const Vector2DRef =
  typeof window !== 'undefined' && window.Vector2D
    ? window.Vector2D
    : typeof require !== 'undefined'
      ? require('./Vector2D.js')
      : null;

// Tolerancia estricta del GDD: impacto cuando la distancia euclídea es <= 8 px.
const IMPACT_TOLERANCE = 8;

// Contador global incremental (decisión de docs/decisiones/fase-1.md).
let projectileIdCounter = 0;

class Projectile {
  /**
   * @param {number|string|null} id identificador; si se omite se genera con el contador global
   * @param {{x:number,y:number}} startPos posición inicial en píxeles (centro de la torre)
   * @param {object} targetEnemy enemigo objetivo
   * @param {number} damage daño base
   * @param {'PHYSICAL'|'MAGIC'} damageType tipo de daño
   * @param {number} speed velocidad en px/s (Tabla 1)
   * @param {number} [areaOfEffect] radio de área en px (0 = mono-objetivo)
   * @param {number} [slowFactor] multiplicador de velocidad al impactar (0 = sin ralentización)
   * @param {number} [slowDuration] duración de la ralentización en segundos
   */
  constructor(
    id,
    startPos,
    targetEnemy,
    damage,
    damageType,
    speed,
    areaOfEffect = 0,
    slowFactor = 0,
    slowDuration = 0
  ) {
    this.id = id === undefined || id === null ? Projectile.nextId() : id;
    this.position = new Vector2DRef(startPos.x, startPos.y);
    this.targetEnemy = targetEnemy || null;
    this.damage = damage;
    this.damageType = damageType;
    this.speed = speed; // px/s
    this.areaOfEffect = areaOfEffect || 0; // radio en px
    this.slowFactor = slowFactor || 0;
    this.slowDuration = slowDuration || 0;
    this.isHit = false;
    this.isExpired = false;
    // Última posición conocida del objetivo; el Cañón la usa si el enemigo muere en vuelo.
    this.lastTargetPosition =
      this.targetEnemy && this.targetEnemy.position
        ? new Vector2DRef(this.targetEnemy.position.x, this.targetEnemy.position.y)
        : null;
  }

  /** Genera el siguiente identificador del contador global. */
  static nextId() {
    projectileIdCounter += 1;
    return projectileIdCounter;
  }

  /** Solo para pruebas: reinicia el contador global de identificadores. */
  static resetIdCounter() {
    projectileIdCounter = 0;
  }

  /**
   * Indica si el objetivo sigue siendo válido (vivo y sin llegar a la meta).
   * @returns {boolean}
   */
  isTargetAlive() {
    const target = this.targetEnemy;
    return Boolean(target) && !target.isDead && !target.hasReachedEnd;
  }

  /**
   * Avanza el proyectil un delta de tiempo.
   * Devuelve true cuando el proyectil ha terminado (impactado o descartado)
   * y debe eliminarse de la colección del motor.
   * @param {number} deltaTime segundos
   * @param {Array} allEnemies enemigos vivos de la partida
   * @returns {boolean} true si el proyectil debe eliminarse
   */
  update(deltaTime, allEnemies = []) {
    if (this.isHit || this.isExpired) return true;

    const enemies = Array.isArray(allEnemies) ? allEnemies : [];
    const delta = Math.max(0, Number(deltaTime) || 0);

    if (this.isTargetAlive()) {
      this.lastTargetPosition = new Vector2DRef(
        this.targetEnemy.position.x,
        this.targetEnemy.position.y
      );
      return this.moveToward(this.lastTargetPosition, delta, enemies);
    }

    // Objetivo perdido: solo el Cañón conserva el vuelo hacia la última posición conocida.
    if (this.areaOfEffect <= 0 || !this.lastTargetPosition) {
      this.isExpired = true;
      return true;
    }

    return this.moveToward(this.lastTargetPosition, delta, enemies);
  }

  /**
   * Mueve el proyectil hacia un punto, limitando el paso a la distancia restante.
   * Si el paso alcanza el punto (o ya está a <= 8 px) se produce el impacto.
   * @param {{x:number,y:number}} point destino
   * @param {number} delta segundos
   * @param {Array} enemies enemigos de la partida
   * @returns {boolean} true si el proyectil debe eliminarse
   */
  moveToward(point, delta, enemies) {
    const dx = point.x - this.position.x;
    const dy = point.y - this.position.y;
    const distance = Math.hypot(dx, dy);

    // Impacto por tolerancia (CA-10) o porque el paso cubre toda la distancia restante.
    if (distance <= IMPACT_TOLERANCE) {
      this.position.x = point.x;
      this.position.y = point.y;
      return this.impact(enemies);
    }

    const step = Math.max(0, this.speed) * delta;
    if (step >= distance) {
      // Se limita el movimiento a la distancia restante: nunca se atraviesa al objetivo.
      this.position.x = point.x;
      this.position.y = point.y;
      return this.impact(enemies);
    }

    if (step > 0) {
      this.position.x += (dx / distance) * step;
      this.position.y += (dy / distance) * step;
    }

    return false;
  }

  /**
   * Resuelve el impacto: daño mono-objetivo (con ralentización) o daño en área.
   * @param {Array} enemies enemigos de la partida
   * @returns {boolean} siempre true (el proyectil desaparece)
   */
  impact(enemies) {
    this.isHit = true;

    if (this.areaOfEffect > 0) {
      // CA-10 / GDD §3.2: todos los enemigos dentro del radio reciben el daño una sola vez.
      for (const enemy of enemies) {
        if (!enemy || enemy.isDead) continue;
        if (!enemy.position) continue;
        if (this.position.distanceTo(enemy.position) <= this.areaOfEffect) {
          enemy.takeDamage(this.damage, this.damageType);
        }
      }
      return true;
    }

    // Mono-objetivo: solo daña si el objetivo sigue vivo en el momento del impacto.
    if (this.isTargetAlive()) {
      this.targetEnemy.takeDamage(this.damage, this.damageType);
      // CA-09: la Escarcha ralentiza al objetivo; applySlow reinicia el timer sin acumular.
      if (this.slowFactor > 0 && this.slowDuration > 0) {
        this.targetEnemy.applySlow(this.slowFactor, this.slowDuration);
      }
    }

    return true;
  }
}

Projectile.IMPACT_TOLERANCE = IMPACT_TOLERANCE;

if (typeof window !== 'undefined') {
  window.Projectile = Projectile;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Projectile;
}
