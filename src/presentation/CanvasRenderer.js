// CanvasRenderer: capa de presentación (Fase 5). Dibuja el estado del GameEngine
// con primitivas de Canvas 2D y sin imágenes externas ni librerías
// (docs/decisiones/fase-5.md, decisión 2).
// Nunca modifica el estado del motor: solo lo lee.

const TowerRefRenderer =
  typeof window !== 'undefined' && window.Tower
    ? window.Tower
    : typeof require !== 'undefined'
      ? require('../core/Tower.js')
      : null;

const COLORS = {
  grassA: '#4f8f4a',
  grassB: '#478544',
  path: '#c8a06a',
  pathEdge: '#8f6b3f',
  entry: '#2f6f36',
  castleWall: '#d8d2c4',
  castleShadow: '#a89f8d',
  castleDoor: '#6b4a2b',
  castleFlag: '#a03c38',
  rangeOk: 'rgba(96, 220, 130, 0.95)',
  rangeBad: 'rgba(232, 92, 84, 0.95)',
  rangeOkFill: 'rgba(96, 220, 130, 0.16)',
  rangeBadFill: 'rgba(232, 92, 84, 0.16)',
  selectedRange: 'rgba(255, 255, 255, 0.55)',
  selectedRangeFill: 'rgba(255, 255, 255, 0.07)',
};

// Colores y tamaño de cada torre (decisión 2: color por tipo).
const TOWER_STYLES = {
  Ballesta: { fill: '#8b5a2b', stroke: '#4a2f16' },
  Canon: { fill: '#4a4f57', stroke: '#23262b' },
  Escarcha: { fill: '#7fd3f7', stroke: '#2b7fa8' },
  Arcana: { fill: '#9b6cf0', stroke: '#4b2c8a' },
};
const TOWER_STYLE_DEFAULT = { fill: '#8c8c8c', stroke: '#3c3c3c' };

// Círculos de color con tamaño según tipo (decisión 2).
const ENEMY_STYLES = {
  Enjambre: { fill: '#e8d44d', stroke: '#8a7a10', radius: 7 },
  Duende: { fill: '#5fbf5f', stroke: '#2f6f2f', radius: 8 },
  Guerrero: { fill: '#e08a3c', stroke: '#8a4f16', radius: 10 },
  Tanque: { fill: '#b4483c', stroke: '#64211a', radius: 13 },
  Golem: { fill: '#7b4fa8', stroke: '#3d2263', radius: 18 },
};
const ENEMY_STYLE_DEFAULT = { fill: '#bbbbbb', stroke: '#555555', radius: 9 };

class CanvasRenderer {
  /**
   * @param {HTMLCanvasElement|null} canvas
   * @param {object|null} engine instancia de GameEngine
   */
  constructor(canvas, engine) {
    this.canvas = canvas || null;
    this.ctx = canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
    this.engine = engine || null;

    // Estado visual que fija la interfaz: casilla bajo el ratón y torre elegida.
    this.preview = null;
    this.selectedTowerId = null;

    // Destellos de impacto del Cañón (el core borra el proyectil al impactar).
    this.effects = [];
    this.pendingProjectiles = new Map();
  }

  /**
   * Cambia el motor dibujado (reinicio de partida).
   * @param {object} engine
   * @returns {void}
   */
  setEngine(engine) {
    this.engine = engine || null;
    this.preview = null;
    this.selectedTowerId = null;
    this.effects = [];
    this.pendingProjectiles = new Map();
  }

  /**
   * Fija la previsualización de construcción.
   * @param {{col:number,row:number,type:string,buildable:boolean}|null} preview
   * @returns {void}
   */
  setPreview(preview) {
    this.preview = preview || null;
  }

  /**
   * Fija la torre seleccionada (para dibujar su alcance).
   * @param {number|string|null} towerId
   * @returns {void}
   */
  setSelectedTower(towerId) {
    this.selectedTowerId = towerId;
  }

  /**
   * Instantánea de proyectiles antes del tick: permite saber dónde impactaron
   * los que el core elimina en ese mismo tick.
   * @param {Array} projectiles
   * @returns {void}
   */
  observeProjectiles(projectiles) {
    const snapshot = new Map();
    for (const projectile of projectiles || []) {
      if (!projectile || !projectile.position) continue;
      snapshot.set(projectile.id, {
        x: projectile.position.x,
        y: projectile.position.y,
        areaOfEffect: projectile.areaOfEffect || 0,
      });
    }
    this.pendingProjectiles = snapshot;
  }

  /**
   * Compara con la lista posterior al tick y crea un destello circular para
   * cada proyectil de área que ha impactado (Cañón).
   * @param {Array} projectiles
   * @returns {void}
   */
  collectImpacts(projectiles) {
    const alive = new Set();
    for (const projectile of projectiles || []) {
      if (projectile) alive.add(projectile.id);
    }

    for (const [id, info] of this.pendingProjectiles) {
      if (alive.has(id)) continue;
      if (info.areaOfEffect <= 0) continue;

      this.effects.push({
        x: info.x,
        y: info.y,
        radius: info.areaOfEffect,
        life: CanvasRenderer.EFFECT_DURATION,
        maxLife: CanvasRenderer.EFFECT_DURATION,
      });
    }

    this.pendingProjectiles = new Map();
  }

  /**
   * Pinta un frame completo.
   * @param {number} [deltaTime] segundos para animar los destellos
   * @returns {void}
   */
  render(deltaTime = 0) {
    if (!this.ctx || !this.engine || !this.engine.map) return;

    this.updateEffects(Math.max(0, Number(deltaTime) || 0));

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawMap();
    this.drawSelectedRange();
    this.drawPreview();
    this.drawTowers();
    this.drawProjectiles();
    this.drawEnemies();
    this.drawEffects();
  }

  /**
   * Avanza la vida de los destellos y descarta los agotados.
   * @param {number} deltaTime segundos
   * @returns {void}
   */
  updateEffects(deltaTime) {
    if (this.effects.length === 0) return;

    for (const effect of this.effects) {
      effect.life -= deltaTime;
    }
    this.effects = this.effects.filter((effect) => effect.life > 0);
  }

  // --- Mapa ---------------------------------------------------------------

  /** Dibuja hierba en damero y el camino de tierra con su borde. @returns {void} */
  drawMap() {
    const map = this.engine.map;
    const size = map.tileSize;
    const ctx = this.ctx;

    for (let row = 0; row < map.rows; row += 1) {
      for (let col = 0; col < map.cols; col += 1) {
        if (map.isPathCell(col, row)) continue;
        ctx.fillStyle = (col + row) % 2 === 0 ? COLORS.grassA : COLORS.grassB;
        ctx.fillRect(col * size, row * size, size, size);
      }
    }

    // Relleno del camino.
    ctx.fillStyle = COLORS.path;
    for (const key of map.pathCells) {
      const [col, row] = key.split(',').map(Number);
      ctx.fillRect(col * size, row * size, size, size);
    }

    // Borde más oscuro solo en los lados que dan a la hierba.
    ctx.strokeStyle = COLORS.pathEdge;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (const key of map.pathCells) {
      const [col, row] = key.split(',').map(Number);
      const x = col * size;
      const y = row * size;

      if (!map.isPathCell(col, row - 1)) {
        ctx.moveTo(x, y + 1.5);
        ctx.lineTo(x + size, y + 1.5);
      }
      if (!map.isPathCell(col, row + 1)) {
        ctx.moveTo(x, y + size - 1.5);
        ctx.lineTo(x + size, y + size - 1.5);
      }
      if (!map.isPathCell(col - 1, row)) {
        ctx.moveTo(x + 1.5, y);
        ctx.lineTo(x + 1.5, y + size);
      }
      if (!map.isPathCell(col + 1, row)) {
        ctx.moveTo(x + size - 1.5, y);
        ctx.lineTo(x + size - 1.5, y + size);
      }
    }
    ctx.stroke();

    const waypoints = map.waypoints;
    if (waypoints.length > 0) {
      const start = map.cellCenter(waypoints[0].x, waypoints[0].y);
      this.drawEntry(start.x, start.y, size);

      const goalWaypoint = waypoints[waypoints.length - 1];
      const goal = map.cellCenter(goalWaypoint.x, goalWaypoint.y);
      this.drawCastle(goal.x, goal.y, size);
    }
  }

  /**
   * Entrada del camino: puerta verde con flecha blanca.
   * @param {number} cx
   * @param {number} cy
   * @param {number} size
   * @returns {void}
   */
  drawEntry(cx, cy, size) {
    const ctx = this.ctx;

    ctx.fillStyle = COLORS.entry;
    ctx.fillRect(cx - size * 0.3, cy - size * 0.3, size * 0.6, size * 0.6);

    ctx.fillStyle = '#eaf6e8';
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.12, cy - size * 0.16);
    ctx.lineTo(cx + size * 0.14, cy);
    ctx.lineTo(cx - size * 0.12, cy + size * 0.16);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Meta: pequeño castillo con almenas, puerta y bandera.
   * @param {number} cx
   * @param {number} cy
   * @param {number} size
   * @returns {void}
   */
  drawCastle(cx, cy, size) {
    const ctx = this.ctx;
    const width = size * 0.74;
    const height = size * 0.56;
    const left = cx - width / 2;
    const top = cy - height / 2 + size * 0.08;

    ctx.fillStyle = COLORS.castleWall;
    ctx.fillRect(left, top, width, height);
    ctx.strokeStyle = COLORS.castleShadow;
    ctx.lineWidth = 2;
    ctx.strokeRect(left, top, width, height);

    // Almenas.
    const merlon = width / 6;
    ctx.fillStyle = COLORS.castleWall;
    for (let index = 0; index < 6; index += 2) {
      ctx.fillRect(left + index * merlon, top - size * 0.1, merlon, size * 0.12);
      ctx.strokeRect(left + index * merlon, top - size * 0.1, merlon, size * 0.12);
    }

    // Puerta.
    ctx.fillStyle = COLORS.castleDoor;
    ctx.fillRect(cx - width * 0.14, top + height * 0.42, width * 0.28, height * 0.58);
    ctx.beginPath();
    ctx.arc(cx, top + height * 0.42, width * 0.14, Math.PI, 0);
    ctx.fill();

    // Bandera.
    ctx.strokeStyle = COLORS.castleShadow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, top - size * 0.1);
    ctx.lineTo(cx, top - size * 0.4);
    ctx.stroke();

    ctx.fillStyle = COLORS.castleFlag;
    ctx.beginPath();
    ctx.moveTo(cx, top - size * 0.4);
    ctx.lineTo(cx + size * 0.24, top - size * 0.32);
    ctx.lineTo(cx, top - size * 0.24);
    ctx.closePath();
    ctx.fill();
  }

  // --- Torres -------------------------------------------------------------

  /** Dibuja el alcance de la torre seleccionada. @returns {void} */
  drawSelectedRange() {
    if (this.selectedTowerId === null || this.selectedTowerId === undefined) return;
    const tower = this.engine.towers.find((item) => item.id === this.selectedTowerId);
    if (!tower) return;

    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(tower.position.x, tower.position.y, tower.range, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.selectedRangeFill;
    ctx.fill();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = COLORS.selectedRange;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /** Torre fantasma y círculo de alcance verde/rojo bajo el ratón. @returns {void} */
  drawPreview() {
    const preview = this.preview;
    if (!preview) return;

    const map = this.engine.map;
    const size = map.tileSize;
    const center = map.cellCenter(preview.col, preview.row);
    const color = preview.buildable ? COLORS.rangeOk : COLORS.rangeBad;
    const fill = preview.buildable ? COLORS.rangeOkFill : COLORS.rangeBadFill;
    const ctx = this.ctx;

    const config = CanvasRenderer.towerConfig(preview.type);
    if (config) {
      ctx.beginPath();
      ctx.arc(center.x, center.y, config.range, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.fillStyle = fill;
    ctx.fillRect(preview.col * size, preview.row * size, size, size);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(preview.col * size + 1, preview.row * size + 1, size - 2, size - 2);

    this.drawTowerOn(ctx, center.x, center.y, preview.type, 1, {
      alpha: 0.55,
      tileSize: size,
    });
  }

  /** Dibuja todas las torres construidas. @returns {void} */
  drawTowers() {
    const size = this.engine.map.tileSize;

    for (const tower of this.engine.towers) {
      this.drawTowerOn(this.ctx, tower.position.x, tower.position.y, tower.type, tower.level, {
        tileSize: size,
      });

      if (tower.id === this.selectedTowerId) {
        this.ctx.beginPath();
        this.ctx.arc(tower.position.x, tower.position.y, size * 0.36, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
    }
  }

  /**
   * Dibuja una torre en un contexto cualquiera (también en los iconos del panel).
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {string} type
   * @param {number} level 1..3
   * @param {{alpha?:number,tileSize?:number}} [options]
   * @returns {void}
   */
  drawTowerOn(ctx, x, y, type, level, options = {}) {
    if (!ctx) return;

    const style = TOWER_STYLES[type] || TOWER_STYLE_DEFAULT;
    const size = Number.isFinite(options.tileSize) ? options.tileSize : 40;
    const alpha = Number.isFinite(options.alpha) ? options.alpha : 1;
    const levels = Math.max(1, Math.min(3, Math.floor(level) || 1));

    ctx.save();
    ctx.globalAlpha = alpha;

    // Sombra en el suelo.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.22, size * 0.27, size * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo de la torre.
    ctx.beginPath();
    ctx.arc(x, y, size * 0.29, 0, Math.PI * 2);
    ctx.fillStyle = style.fill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = style.stroke;
    ctx.stroke();

    // Corazón de la torre.
    ctx.beginPath();
    ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = style.stroke;
    ctx.fill();

    // Puntos de nivel debajo de la torre.
    const dotSize = Math.max(3, size * 0.09);
    const gap = dotSize * 0.6;
    const totalWidth = levels * dotSize + (levels - 1) * gap;
    const startX = x - totalWidth / 2;
    const dotY = y + size * 0.3;

    ctx.fillStyle = '#f4f7f2';
    for (let index = 0; index < levels; index += 1) {
      ctx.fillRect(startX + index * (dotSize + gap), dotY, dotSize, dotSize);
    }

    ctx.restore();
  }

  /**
   * Dibuja el icono de una torre en el canvas pequeño de una tarjeta.
   * @param {HTMLCanvasElement} targetCanvas
   * @param {string} type
   * @returns {void}
   */
  drawTowerIcon(targetCanvas, type) {
    if (!targetCanvas || typeof targetCanvas.getContext !== 'function') return;

    const ctx = targetCanvas.getContext('2d');
    const size = targetCanvas.width || 56;
    ctx.clearRect(0, 0, size, size);
    this.drawTowerOn(ctx, size / 2, size / 2 + size * 0.04, type, 1, {
      tileSize: size * 0.92,
    });
  }

  // --- Enemigos y proyectiles --------------------------------------------

  /** Dibuja enemigos con barra de vida y tinte azul al estar ralentizados. @returns {void} */
  drawEnemies() {
    const ctx = this.ctx;

    for (const enemy of this.engine.enemies) {
      if (!enemy || enemy.isDead || enemy.hasReachedEnd || !enemy.position) continue;

      const style = ENEMY_STYLES[enemy.type] || ENEMY_STYLE_DEFAULT;
      const radius = style.radius;
      const x = enemy.position.x;
      const y = enemy.position.y;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.beginPath();
      ctx.ellipse(x, y + radius * 0.55, radius * 0.9, radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = style.fill;
      ctx.fill();
      ctx.lineWidth = enemy.isBoss ? 3 : 1.5;
      ctx.strokeStyle = style.stroke;
      ctx.stroke();

      if (enemy.isSlowed) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(90, 170, 255, 0.5)';
        ctx.fill();
      }

      this.drawHealthBar(x, y, radius, enemy);
    }
  }

  /**
   * Barra de vida por encima del enemigo.
   * @param {number} x
   * @param {number} y
   * @param {number} radius
   * @param {object} enemy
   * @returns {void}
   */
  drawHealthBar(x, y, radius, enemy) {
    const ctx = this.ctx;
    const maxHealth = Number(enemy.maxHealth) || 0;
    if (maxHealth <= 0) return;

    const ratio = Math.max(0, Math.min(1, enemy.currentHealth / maxHealth));
    const width = Math.max(18, radius * 2.2);
    const height = 4;
    const left = x - width / 2;
    const top = y - radius - 9;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(left - 1, top - 1, width + 2, height + 2);

    ctx.fillStyle = ratio > 0.6 ? '#6fe07a' : ratio > 0.3 ? '#f2c94c' : '#e85c54';
    ctx.fillRect(left, top, width * ratio, height);
  }

  /** Dibuja los proyectiles en vuelo. @returns {void} */
  drawProjectiles() {
    const ctx = this.ctx;

    for (const projectile of this.engine.projectiles) {
      if (!projectile || !projectile.position) continue;

      const radius = projectile.areaOfEffect > 0 ? 6 : 4;
      ctx.beginPath();
      ctx.arc(projectile.position.x, projectile.position.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = projectile.damageType === 'MAGIC' ? '#8fe3ff' : '#ffcf6b';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = projectile.damageType === 'MAGIC' ? '#2b7fa8' : '#8a5a10';
      ctx.stroke();
    }
  }

  /** Destellos circulares del Cañón al impactar. @returns {void} */
  drawEffects() {
    const ctx = this.ctx;

    for (const effect of this.effects) {
      const progress = 1 - Math.max(0, effect.life) / effect.maxLife;
      const radius = effect.radius * (0.35 + progress * 0.65);

      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 168, 74, ${0.35 * (1 - progress)})`;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(255, 214, 140, ${0.85 * (1 - progress)})`;
      ctx.stroke();
    }
  }

  /**
   * Configuración de nivel 1 de un tipo de torre (alcance para la previsualización).
   * @param {string} type
   * @returns {object|null}
   */
  static towerConfig(type) {
    if (!TowerRefRenderer || typeof TowerRefRenderer.getConfig !== 'function') return null;
    return TowerRefRenderer.getConfig(type, 1);
  }
}

CanvasRenderer.EFFECT_DURATION = 0.35;
CanvasRenderer.COLORS = COLORS;
CanvasRenderer.TOWER_STYLES = TOWER_STYLES;
CanvasRenderer.ENEMY_STYLES = ENEMY_STYLES;

if (typeof window !== 'undefined') {
  window.CanvasRenderer = CanvasRenderer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CanvasRenderer;
}
