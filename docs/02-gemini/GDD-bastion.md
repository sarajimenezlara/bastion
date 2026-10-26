# GAME DESIGN DOCUMENT (GDD)

## Proyecto «Bastión» — Tower Defense en JS Vanilla

---

## Sección 1: Arquitectura de Software y Separación de Capas

Para garantizar que el juego pueda ejecutarse sin dependencias en un entorno de navegador (`index.html`) y al mismo tiempo ser probado mediante `node --test` en un entorno headless (sin DOM ni `HTMLCanvasElement`), se aplica una arquitectura de desacoplamiento estricto.

```
+-------------------------------------------------------------------+
|                        PRESENTATION LAYER                         |
|  - CanvasRenderer (Canvas 2D Rendering Context)                   |
|  - UIController (DOM Events, Keybindings, HUD Overlay, HTML UI)   |
+-------------------------------------------------------------------+
                                  |
                                  | Eventos / Invocación directa
                                  v
+-------------------------------------------------------------------+
|                            GAME CORE                              |
|  - GameEngine (Main Loop, State Manager, Tick System)             |
|  - Map (Grid 20x12, Path Calculation, Cell Status)                |
|  - WaveManager (Spawner, Wave Tables, Difficulty Scaler)          |
|  - TowerManager (Placement, Targeting, Upgrades, Firing)          |
|  - EnemyManager (Movement along Path, Armor Reduction, Health)    |
|  - ProjectileManager (Bullet lifecycle, AoE Area Splash, Slows)   |
+-------------------------------------------------------------------+

```

### Principios de Diseño

1. **Zero Canvas Dependency in Core:** Ninguna clase dentro de `src/core/` hace referencia a `window`, `document`, `HTMLCanvasElement` o `CanvasRenderingContext2D`.
2. **Deterministic Tick:** El estado del juego avanza mediante un método `update(deltaTime)` puro dentro de `GameEngine`.
3. **Event Bus / Callback Subscriptions:** La capa de renderizado se suscribe a eventos emitidos por el motor o lee directamente el estado del motor en cada frame de render.
4. **Node.js Native ESM Compatibility:** Todos los módulos del core utilizan la sintaxis de módulos nativos de ECMAScript (`export` / `import`) para poder importarse en los scripts de prueba `node --test`.

---

## Sección 2: Estructuras de Datos y Contratos (Classes e Interfaces)

```typescript
// Contratos e Interfaces del Core (Representación en JavaScript ES6+)

class Vector2D {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Map {
  constructor(cols = 20, rows = 12, tileSize = 40) {
    this.cols = cols;
    this.rows = rows;
    this.tileSize = tileSize;
    this.waypoints = []; // Array de Vector2D (coordenadas de casilla)
    this.pathCells = new Set(); // Guardado como claves "col,row"
  }

  isCellBuildable(col, row) { /* Devuelve boolean */ }
}

class Enemy {
  constructor(id, type, baseHealth, speed, armor, reward, isBoss = false) {
    this.id = id;
    this.type = type;
    this.maxHealth = baseHealth;
    this.currentHealth = baseHealth;
    this.speed = speed;
    this.armor = armor;
    this.reward = reward;
    this.isBoss = isBoss;
    this.currentWaypointIndex = 0;
    this.position = new Vector2D(0, 0); // Coordenadas en px
    this.distanceTraveled = 0;
    this.slowTimer = 0;
    this.isSlowed = false;
    this.isDead = false;
    this.hasReachedEnd = false;
  }

  takeDamage(amount, damageType) { /* Lógica de mitigación de armadura y reducción de HP */ }
  applySlow(factor, duration) { /* Aplica ralentización si no está activa */ }
  update(deltaTime, pathWaypoints) { /* Actualiza posición y contadores */ }
}

class Tower {
  constructor(id, type, col, row, config) {
    this.id = id;
    this.type = type;
    this.col = col;
    this.row = row;
    this.level = 1;
    this.maxLevel = 3;
    this.baseCost = config.baseCost;
    this.totalInvested = config.baseCost;
    this.range = config.range;
    this.damage = config.damage;
    this.fireRate = config.fireRate; // Disparos por segundo
    this.damageType = config.damageType; // 'PHYSICAL' | 'MAGIC'
    this.areaOfEffect = config.areaOfEffect; // Radio en px o 0
    this.slowFactor = config.slowFactor || 0;
    this.slowDuration = config.slowDuration || 0;
    this.cooldownTimer = 0;
  }

  upgrade() { /* Incrementa nivel y recalcula totalInvested y atributos */ }
  getRefundValue() { return Math.floor(this.totalInvested * 0.70); }
  findTarget(enemies) { /* Retorna el enemigo más avanzado en rango */ }
  update(deltaTime, enemies, createProjectileCallback) { /* Dispara si cooldown <= 0 */ }
}

class Projectile {
  constructor(id, startPos, targetEnemy, damage, damageType, speed, areaOfEffect, slowFactor, slowDuration) {
    this.id = id;
    this.position = new Vector2D(startPos.x, startPos.y);
    this.targetEnemy = targetEnemy;
    this.damage = damage;
    this.damageType = damageType;
    this.speed = speed;
    this.areaOfEffect = areaOfEffect;
    this.slowFactor = slowFactor;
    this.slowDuration = slowDuration;
    this.isHit = false;
  }

  update(deltaTime, allEnemies) { /* Avanza hacia el enemigo y aplica impacto/AoE */ }
}

class WaveManager {
  constructor(waveDefinitions, healthMultiplierBase = 1.12) {
    this.currentWaveIndex = 0;
    this.totalWaves = 10;
    this.waveDefinitions = waveDefinitions;
    this.healthMultiplierBase = healthMultiplierBase;
    this.spawnTimer = 0;
    this.spawnQueue = [];
    this.isWaveActive = false;
  }

  startNextWave() { /* Inicia la siguiente oleada e incrementa contador */ }
  update(deltaTime, spawnEnemyCallback) { /* Procesa cola de generación */ }
}

class GameEngine {
  constructor() {
    this.lives = 20;
    this.gold = 150;
    this.totalGoldEarned = 150;
    this.score = 0;
    this.isPaused = false;
    this.gameSpeed = 1; // 1x o 2x
    this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'VICTORY' | 'GAMEOVER'
    this.map = new Map();
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.waveManager = new WaveManager();
  }

  tick(deltaTime) { /* Bucle lógico con escalado de velocidad */ }
  placeTower(type, col, row) { /* Verificación de oro y ubicación */ }
  upgradeTower(towerId) { /* Mejora de nivel */ }
  sellTower(towerId) { /* Venta de torre */ }
  earlyWaveCall() { /* Lanza oleada e imparte bono de oro */ }
  calculateFinalScore() { return this.totalGoldEarned + (this.lives * 50); }
}

```

---

## Sección 3: Lógica de Juego y Bucle Principal (Game Loop)

### 1. Cálculo de Daño y Armadura

* **Daño Físico (Ballesta, Cañón):**

$$\text{DañoRecibido} = \max(1, \text{DañoBase} - \text{ArmaduraEnemigo})$$


* **Daño Mágico (Escarcha, Arcana):**

$$\text{DañoRecibido} = \text{DañoBase}$$



### 2. Ralentización (Escarcha)

* Reduce la velocidad del objetivo en un **40%** durante **2.0 segundos**.
* El efecto **no es acumulable** (reaplicar el impacto solo reinicia el contador de duración a 2.0s).

### 3. Targeting

* Las torres escanean el array de enemigos dentro de su área de cobertura ($d \le \text{Rango}$).
* Seleccionan la entidad con mayor `distanceTraveled`.

### 4. Bono de Oleada Anticipada

* Si el jugador pulsa "Siguiente Oleada" antes de que la lista de enemigos activos vuelva a 0, recibe:

$$\text{BonoOro} = \text{Math.floor}(\text{EnemigosPendientesEnCola} \times 2) + 15$$



### 5. Definición del Camino (Waypoints del Mapa Serpentina)

Grid: 20 columnas x 12 filas (Casillas de 40px, Canvas 800x480).

* **Waypoints (Coordenadas Columna, Fila):**
`(0, 2) -> (17, 2) -> (17, 5) -> (2, 5) -> (2, 8) -> (17, 8) -> (17, 11) -> (19, 11)`

---

## Sección 4: Balance de Entidades

### Tabla 1: Catálogo y Balance de Torres (Valores concretos por nivel)

| Torre | Nivel | Coste Mejora | Rango (px) | Daño | Cadencia (disparos/s) | Tipo Daño | Especial / AoE |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Ballesta** | 1 | - | 120 | 12 | 1.5 | Físico | Mono-objetivo |
|  | 2 | 100 | 135 | 22 | 1.8 | Físico | Mono-objetivo |
|  | 3 | 150 | 150 | 38 | 2.2 | Físico | Mono-objetivo |
| **Cañón** | 1 | - | 100 | 30 | 0.5 | Físico | AoE Radio: 50px |
|  | 2 | 200 | 115 | 60 | 0.6 | Físico | AoE Radio: 60px |
|  | 3 | 300 | 130 | 105 | 0.7 | Físico | AoE Radio: 70px |
| **Escarcha** | 1 | - | 90 | 5 | 0.8 | Mágico | Ralentiza 40% / 2s |
|  | 2 | 160 | 100 | 12 | 1.0 | Mágico | Ralentiza 40% / 2s |
|  | 3 | 240 | 110 | 25 | 1.2 | Mágico | Ralentiza 40% / 2s |
| **Arcana** | 1 | - | 140 | 45 | 0.7 | Mágico | Ignora armadura |
|  | 2 | 300 | 155 | 90 | 0.8 | Mágico | Ignora armadura |
|  | 3 | 450 | 170 | 160 | 0.9 | Mágico | Ignora armadura |

---

### Tabla 2: Catálogo y Balance Base de Enemigos

*Nota: La Vida Final aplicable en partida es $\text{VidaBase} \times (1.12^{(\text{NivelOleada} - 1)})$.*

| Enemigo | Vida Base | Velocidad (px/s) | Armadura | Recompensa (Oro) | Daño a Meta | Descripción |
| --- | --- | --- | --- | --- | --- | --- |
| **Enjambre** | 25 | 60 | 0 | 2 | 1 | Rápido, sale en grupos masivos |
| **Duende** | 50 | 85 | 0 | 4 | 1 | Muy rápido, poca salud |
| **Guerrero** | 120 | 50 | 5 | 8 | 1 | Equilibrado |
| **Tanque** | 350 | 30 | 15 | 18 | 1 | Muy lento, armadura alta |
| **Gólem de Bastión (Jefe)** | 1200 | 20 | 25 | 100 | 5 | Exclusivo oleadas 5 y 10 |

---

### Tabla 3: Configuración Fija de las 10 Oleadas

| Oleada | Composición de Enemigos (Tipo, Cantidad, Intervalo Spawn) | Recompensa Fin Oleada |
| --- | --- | --- |
| **1** | 10x Enjambre (0.6s) | 25 oro |
| **2** | 8x Duende (0.8s), 4x Guerrero (1.2s) | 30 oro |
| **3** | 15x Enjambre (0.5s), 6x Duende (0.7s) | 35 oro |
| **4** | 10x Guerrero (1.0s), 2x Tanque (2.5s) | 40 oro |
| **5** | **1x Gólem de Bastión (Jefe)**, 10x Guerrero (1.0s) | 75 oro |
| **6** | 25x Enjambre (0.4s), 5x Tanque (2.0s) | 50 oro |
| **7** | 15x Duende (0.6s), 10x Guerrero (0.8s), 4x Tanque (1.8s) | 55 oro |
| **8** | 30x Enjambre (0.3s), 8x Tanque (1.5s) | 60 oro |
| **9** | 20x Duende (0.5s), 15x Guerrero (0.7s), 6x Tanque (1.5s) | 70 oro |
| **10** | **2x Gólem de Bastión (Jefe)** (Intervalo 5s), 20x Guerrero (0.6s), 10x Tanque (1.2s) | 150 oro |

---

## Sección 5: Roadmap de Implementación Modular para OpenCode

```
+-------------------------------------------------------------------------+
| ROADMAP DE IMPLEMENTACIÓN                                               |
+-------------------------------------------------------------------------+
  FASE 1: Arquitectura y Módulos Lógicos del Core (Sin UI/DOM)
  FASE 2: Generador de Rutas y Rejilla (Map & Waypoints)
  FASE 3: Sistema de Combate, Proyectiles y Daño (Physics/Logic)
  FASE 4: Gestor de Oleadas y Escalado de Dificultad
  FASE 5: Capa de Renderizado Canvas y Controladores UI
  FASE 6: Menús, Overlays, Teclas de Acceso Rápido y localStorage
+-------------------------------------------------------------------------+

```

---

## Sección 6: Criterios de Aceptación y Validación

### Fase 1: Core Engine & Data Structures

* **`CA-01` [AUTOMÁTICO - `node --test`]:** La clase `GameEngine` debe inicializarse con 20 vidas, 150 de oro, oleada 0 y lista de torres/enemigos vacía.
* **`CA-02` [AUTOMÁTICO - `node --test`]:** La función `takeDamage` de la clase `Enemy` debe restar vida descontando la armadura en daño físico ($\text{Daño} - \text{Armadura}$ con mínimo 1) y de forma directa en daño mágico.

### Fase 2: Grid & Path System

* **`CA-03` [AUTOMÁTICO - `node --test`]:** El método `isCellBuildable(col, row)` debe devolver `false` para las casillas que coincidan con la ruta de waypoints serpentina y `true` para las casillas libres.
* **`CA-04` [AUTOMÁTICO - `node --test`]:** La colocación de una torre en una casilla libre descuenta el oro correspondiente y marca esa casilla como ocupada. Intentar construir sin oro o sobre una casilla ocupada/camino devuelve `false`.

### Fase 3: Towers, Combat & Projectiles

* **`CA-05` [AUTOMÁTICO - `node --test`]:** Una torre selecciona correctamente como objetivo al enemigo con mayor `distanceTraveled` que se encuentre dentro de su rango.
* **`CA-06` [AUTOMÁTICO - `node --test`]:** La torre Escarcha aplica un estado ralentizado al objetivo, reduciendo su velocidad a un 60% (40% de reducción) durante un temporizador de 2.0s no acumulable en intensidad.
* **`CA-07` [AUTOMÁTICO - `node --test`]:** La mejora de una torre al nivel 2 o 3 aplica correctamente las deducciones de oro según la fórmula $\text{CosteBase} \times \text{NivelDestino}$, incrementando sus atributos según la Tabla 1.
* **`CA-08` [AUTOMÁTICO - `node --test`]:** La reventa de una torre devuelve el 70% del total invertido (coste base + mejoras) redondeado hacia abajo y libera la casilla.

### Fase 4: Wave Management & Balance

* **`CA-09` [AUTOMÁTICO - `node --test`]:** La salud de los enemigos generados en la oleada $N$ escala exactamente según la fórmula $\text{VidaBase} \times (1.12^{(N-1)})$.
* **`CA-10` [AUTOMÁTICO - `node --test`]:** Si un enemigo llega al final del camino, se elimina de la lista activa y reduce las vidas del jugador en 1 (o en 5 si es el Jefe Gólem).
* **`CA-11` [AUTOMÁTICO - `node --test`]:** Al derrotar al último enemigo de la oleada 10 con vidas $> 0$, el estado del juego pasa a `VICTORY` y la puntuación se calcula como $\text{OroGanado} + (\text{Vidas} \times 50)$.

### Fase 5 & 6: Rendering, UI & Controls

* **`CA-12` [MANUAL]:** Abrir `index.html` muestra la pantalla superpuesta de **Inicio** con el botón "Jugar".
* **`CA-13` [MANUAL]:** En la partida, al pulsar las teclas `1`, `2`, `3` o `4` se selecciona la torre correspondiente (Ballesta, Cañón, Escarcha, Arcana) para su colocación.
* **`CA-14` [MANUAL]:** Al pulsar la tecla `Espacio` el juego se pausa/reanuda. Al pulsar la tecla `F` la velocidad de simulación conmuta entre 1x y 2x.
* **`CA-15` [MANUAL]:** Al finalizar la partida (Victoria o Derrota), aparece el overlay correspondiente. En caso de superar el récord guardado, este se actualiza correctamente en el `localStorage` del navegador.