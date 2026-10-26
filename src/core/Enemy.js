// Enemy: entidad del core con vida, armadura, navegación por waypoints y ralentización.
// Patrón UMD simplificado: compatible con navegador (window) y node --test (CommonJS).

const Vector2DRef =
  typeof window !== 'undefined' && window.Vector2D
    ? window.Vector2D
    : typeof require !== 'undefined'
      ? require('./Vector2D.js')
      : null;

// Tolerancia estricta del GDD: un waypoint se considera alcanzado a <= 2 px.
const WAYPOINT_TOLERANCE = 2;

// Contador global incremental (decisión de docs/decisiones/fase-1.md).
let enemyIdCounter = 0;

class Enemy {
  /**
   * @param {number|string} [id] identificador; si se omite se genera con el contador global
   * @param {string} type 'Enjambre' | 'Duende' | 'Guerrero' | 'Tanque' | 'Golem'
   * @param {number} baseHealth vida base (sin escalado de oleada)
   * @param {number} speed velocidad en px/s
   * @param {number} armor armadura (mitiga solo daño físico)
   * @param {number} reward oro entregado al morir
   * @param {boolean} [isBoss]
   */
  constructor(id, type, baseHealth, speed, armor, reward, isBoss = false) {
    this.id = id === undefined || id === null ? Enemy.nextId() : id;
    this.type = type;
    this.maxHealth = baseHealth;
    this.currentHealth = baseHealth;
    this.speed = speed; // px/s
    this.armor = armor;
    this.reward = reward;
    this.isBoss = isBoss;
    this.currentWaypointIndex = 0;
    this.position = new Vector2DRef(0, 0); // Coordenadas en px
    this.distanceTraveled = 0;
    this.slowTimer = 0; // Segundos restantes de ralentización
    this.slowFactor = 1; // Multiplicador de velocidad mientras está ralentizado
    this.isSlowed = false;
    this.isDead = false;
    this.hasReachedEnd = false;
  }

  /** Genera el siguiente identificador del contador global. */
  static nextId() {
    enemyIdCounter += 1;
    return enemyIdCounter;
  }

  /** Solo para pruebas: reinicia el contador global de identificadores. */
  static resetIdCounter() {
    enemyIdCounter = 0;
  }

  /**
   * Aplica daño con mitigación según el tipo.
   * Físico: max(1, daño - armadura). Mágico: ignorada la armadura.
   * @param {number} amount daño base
   * @param {'PHYSICAL'|'MAGIC'} damageType
   * @returns {number} vida realmente descontada (0 si ya estaba muerto)
   */
  takeDamage(amount, damageType) {
    if (this.isDead) return 0;

    const baseDamage = Math.max(0, Number(amount) || 0);
    const received =
      damageType === 'PHYSICAL' ? Math.max(1, baseDamage - this.armor) : baseDamage;

    const applied = Math.min(received, this.currentHealth);
    this.currentHealth = Math.max(0, this.currentHealth - applied);

    if (this.currentHealth === 0) {
      this.isDead = true;
    }

    return applied;
  }

  /**
   * Aplica o reinicia la ralentización (no se acumula en intensidad).
   * @param {number} factor multiplicador de velocidad (0 < factor < 1)
   * @param {number} duration segundos
   */
  applySlow(factor, duration) {
    if (this.isDead) return;
    if (!(factor > 0 && factor < 1)) return;
    if (!(duration > 0)) return;

    this.slowFactor = factor;
    this.slowTimer = duration;
    this.isSlowed = true;
  }

  /**
   * Avanza hacia el waypoint actual con delta de tiempo en segundos.
   * Consume la distancia sobrante del tick para no perder movimiento.
   * @param {number} deltaTime segundos
   * @param {Array<{x:number,y:number}>} pathWaypoints waypoints en píxeles
   */
  update(deltaTime, pathWaypoints) {
    if (this.isDead || this.hasReachedEnd) return;
    if (!Array.isArray(pathWaypoints) || pathWaypoints.length === 0) return;

    const delta = Math.max(0, Number(deltaTime) || 0);

    if (this.isSlowed) {
      this.slowTimer -= delta;
      if (this.slowTimer <= 0) {
        this.slowTimer = 0;
        this.slowFactor = 1;
        this.isSlowed = false;
      }
    }

    const speedNow = this.speed * (this.isSlowed ? this.slowFactor : 1);
    let remaining = speedNow * delta;
    let iterations = 0;

    // El bucle permite atravesar varios waypoints en un mismo tick.
    while (this.currentWaypointIndex < pathWaypoints.length && iterations < 1000) {
      iterations += 1;

      if (this.currentWaypointIndex >= pathWaypoints.length) break;
      const waypoint = pathWaypoints[this.currentWaypointIndex];
      const dx = waypoint.x - this.position.x;
      const dy = waypoint.y - this.position.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= WAYPOINT_TOLERANCE) {
        // Tolerancia CA-03: se considera alcanzado y se avanza al siguiente.
        this.position.x = waypoint.x;
        this.position.y = waypoint.y;
        this.distanceTraveled += distance;
        this.currentWaypointIndex += 1;
        if (this.currentWaypointIndex >= pathWaypoints.length) {
          this.hasReachedEnd = true;
        }
        continue;
      }

      if (remaining >= distance) {
        // Llega al waypoint en este tick y continúa con el sobrante.
        this.position.x = waypoint.x;
        this.position.y = waypoint.y;
        this.distanceTraveled += distance;
        remaining -= distance;
        this.currentWaypointIndex += 1;
        if (this.currentWaypointIndex >= pathWaypoints.length) {
          this.hasReachedEnd = true;
        }
        continue;
      }

      // Movimiento parcial hacia el waypoint.
      this.position.x += (dx / distance) * remaining;
      this.position.y += (dy / distance) * remaining;
      this.distanceTraveled += remaining;
      remaining = 0;
      break;
    }
  }
}

if (typeof window !== 'undefined') {
  window.Enemy = Enemy;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Enemy;
}
