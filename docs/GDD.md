# GAME DESIGN DOCUMENT (GDD) v2.0

## Proyecto «Bastión» — Tower Defense en JS Vanilla

---

## 📋 Registro de Cambios (Changelog v2.0)

* **[Compatibilidad Dual Protocolo file:// y Node.js]**: Se ha modificado el patrón de exportación/importación del Core. Los módulos eliminan las sentencias ESM nativas (`import`/`export`) en el navegador para evitar el bloqueo CORS bajo el protocolo `file://` (doble clic en `index.html`). Se adopta el patrón CommonJS/Global (`window` para navegador, `module.exports` para `node --test`).
* **[Balance de Torres - Costes Base]**: Se han añadido explícitamente los costes base de compra (Nivel 1) en la **Tabla 1**.
* **[Aclaración CA-07 y Escalado de Upgrades]**: Se confirma que la fórmula $\text{CosteBase} \times \text{NivelDestino}$ coincide al 100% con los costes numéricos definidos en la Tabla 1. Se explicita la relación en la redacción del criterio.
* **[Especifación de Proyectiles y Tolerancias]**: Se añaden las velocidades de proyectil (px/s) por tipo de torre y los umbrales/tolerancias exactas de colisión en píxeles tanto para proyectil-enemigo ($8\text{ px}$) como para enemigo-waypoint ($2\text{ px}$).
* **[Redondeo de Salud]**: Se especifica formalmente la aplicación de `Math.floor` sobre la fórmula de salud escalada de los enemigos.

---

## Sección 1: Arquitectura de Software y Separación de Capas (Patrón Universal file:// y CommonJS)

Para garantizar que el juego funcione con **doble clic directo en `index.html**` bajo el protocolo `file://` (sin servidores HTTP locales ni bloqueos CORS por `<script type="module">`) y que al mismo tiempo sea testeable mediante `node --test` en entorno headless, se define una estrategia de carga y exportación híbrida:

```
+-----------------------------------------------------------------------------------+
|                               PRESENTATION LAYER                                  |
|  - index.html (Carga scripts mediante tags <script src="..."> estándar sin module)|
|  - CanvasRenderer (Canvas 2D Rendering Context)                                   |
|  - UIController (DOM Events, Keybindings, HUD Overlay, HTML UI)                  |
+-----------------------------------------------------------------------------------+
                                          |
                                          | Lectura directa / Eventos
                                          v
+-----------------------------------------------------------------------------------+
|                                    GAME CORE                                      |
|  - GameEngine, Map, WaveManager, TowerManager, EnemyManager, ProjectileManager    |
|  - Navegador: Registra clases en el espacio global `window`                       |
|  - Node.js: Exporta módulos mediante `if (typeof module !== 'undefined')`         |
+-----------------------------------------------------------------------------------+

```

### Patrón de Módulo Universal (UMD Simplificado para JS Vanilla)

Cada archivo situado en `src/core/` no utilizará la sintaxis ESM `export` / `import`. En su lugar, registrará la clase directamente y aplicará el siguiente bloque al final del archivo:

```javascript
// Ejemplo de archivo: src/core/Enemy.js

class Enemy {
  // Lógica pura del core (sin llamadas a Canvas ni DOM)
}

// Carga dual para compatibilidad file:// y node --test
if (typeof window !== 'undefined') {
  window.Enemy = Enemy;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Enemy;
}

```

Para las dependencias dentro de `node --test`, las clases del core usarán `require()` nativo de CommonJS. En el navegador (`index.html`), las dependencias se resuelven automáticamente cargando las etiquetas `<script src="src/core/...">` en el orden secuencial correcto antes de instanciar el motor.

---

## Sección 2: Estructuras de Datos y Contratos (Classes e Interfaces)

```javascript
// Contratos e Interfaces del Core (Representación JavaScript ES6+ Universal)

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
    this.waypoints = [
      new Vector2D(0, 2), new Vector2D(17, 2),
      new Vector2D(17, 5), new Vector2D(2, 5),
      new Vector2D(2, 8), new Vector2D(17, 8),
      new Vector2D(17, 11), new Vector2D(19, 11)
    ];
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
    this.speed = speed; // px/s
    this.armor = armor;
    this.reward = reward;
    this.isBoss = isBoss;
    this.currentWaypointIndex = 0;
    this.position = new Vector2D(0, 0); // Coordenadas en px
    this.distanceTraveled = 0;
    this.slowTimer = 0; // Segundos
    this.isSlowed = false;
    this.isDead = false;
    this.hasReachedEnd = false;
  }

  takeDamage(amount, damageType) { /* Mitigación de armadura y reducción de HP */ }
  applySlow(factor, duration) { /* Aplica o reinicia ralentización */ }
  update(deltaTime, pathWaypoints) { /* Mueve hacia el waypoint con tolerancia 2px */ }
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
    this.range = config.range; // px
    this.damage = config.damage;
    this.fireRate = config.fireRate; // Disparos por segundo
    this.projectileSpeed = config.projectileSpeed; // px/s
    this.damageType = config.damageType; // 'PHYSICAL' | 'MAGIC'
    this.areaOfEffect = config.areaOfEffect || 0; // Radio en px
    this.slowFactor = config.slowFactor || 0;
    this.slowDuration = config.slowDuration || 0;
    this.cooldownTimer = 0;
  }

  upgrade() { /* Subida de nivel, incremento de atributos e inversión */ }
  getRefundValue() { return Math.floor(this.totalInvested * 0.70); }
  findTarget(enemies) { /* Retorna el enemigo con mayor distanceTraveled en rango */ }
  update(deltaTime, enemies, createProjectileCallback) { /* Procesa cooldown y dispara */ }
}

class Projectile {
  constructor(id, startPos, targetEnemy, damage, damageType, speed, areaOfEffect, slowFactor, slowDuration) {
    this.id = id;
    this.position = new Vector2D(startPos.x, startPos.y);
    this.targetEnemy = targetEnemy;
    this.damage = damage;
    this.damageType = damageType;
    this.speed = speed; // px/s
    this.areaOfEffect = areaOfEffect;
    this.slowFactor = slowFactor;
    this.slowDuration = slowDuration;
    this.isHit = false;
  }

  update(deltaTime, allEnemies) { /* Avanza hacia targetEnemy, impacto a <= 8px */ }
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

  startNextWave() { /* Genera cola de enemigos y activa oleada */ }
  update(deltaTime, spawnEnemyCallback) { /* Procesa cola con delta */ }
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
  placeTower(type, col, row) { /* Verificación de oro y mapa */ }
  upgradeTower(towerId) { /* Ejecuta mejora */ }
  sellTower(towerId) { /* Ejecuta reventa y libera casilla */ }
  earlyWaveCall() { /* Bonus por llamada anticipada */ }
  calculateFinalScore() { return this.totalGoldEarned + (this.lives * 50); }
}

```

---

## Sección 3: Lógica de Juego, Bucle Principal y Tolerancias Exactas

### 1. Cálculo de Daño y Mitigación de Armadura

* **Daño Físico (Ballesta, Cañón):**

$$\text{DañoRecibido} = \max(1, \text{DañoBase} - \text{ArmaduraEnemigo})$$


* **Daño Mágico (Escarcha, Arcana):**

$$\text{DañoRecibido} = \text{DañoBase}$$



### 2. Tolerancias y Constantes de Colisión / Movimiento

* **Tolerancia de Waypoint (Enemigos):** Un enemigo ha alcanzado su objetivo actual cuando su distancia euclídea al punto central de la casilla del waypoint es $\le 2\text{ px}$. A partir de ese instante cambia al siguiente waypoint.
* **Tolerancia de Impacto (Proyectiles):** Un proyectil colisiona con su enemigo objetivo cuando la distancia euclídea entre sus posiciones es $\le 8\text{ px}$.
* **Área de Efecto (AoE - Cañón):** Al colisionar el proyectil, se busca a todos los enemigos a una distancia $\le \text{RadioAoE}$ de la posición final del proyectil y se aplica el daño calculado.

### 3. Ralentización (Escarcha)

* Reduce la velocidad del enemigo en un **40%** (factor de multiplicador $= 0.6$) durante **2.0 segundos**.
* El efecto **no se acumula en intensidad**; si el objetivo ya está ralentizado, reaplicar el estado reinicia el `slowTimer` a $2.0\text{ s}$.

### 4. Formula de Escalado de Salud de Enemigos

La salud final de cualquier enemigo generado en la oleada $N$ ($1 \le N \le 10$) sigue estrictamente:


$$\text{VidaFinal} = \text{Math.floor}\left(\text{VidaBase} \times 1.12^{(N - 1)}\right)$$

### 5. Bonus por Llamada Anticipada de Oleada

$$\text{BonoOro} = \text{Math.floor}(\text{EnemigosPendientesEnCola} \times 2) + 15$$

---

## Sección 4: Balance de Entidades

### Tabla 1: Catálogo y Balance de Torres (Atributos por Nivel y Coste Base)

| Torre | Coste Base (N1) | Nivel | Coste Mejora | Rango (px) | Daño | Cadencia (disparos/s) | Vel. Proyectil (px/s) | Tipo Daño | Efecto Especial / AoE |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Ballesta** | **50** | 1 | - | 120 | 12 | 1.5 | 400 | Físico | Mono-objetivo |
|  |  | 2 | 100 | 135 | 22 | 1.8 | 450 | Físico | Mono-objetivo |
|  |  | 3 | 150 | 150 | 38 | 2.2 | 500 | Físico | Mono-objetivo |
| **Cañón** | **100** | 1 | - | 100 | 30 | 0.5 | 250 | Físico | AoE Radio: 50px |
|  |  | 2 | 200 | 115 | 60 | 0.6 | 280 | Físico | AoE Radio: 60px |
|  |  | 3 | 300 | 130 | 105 | 0.7 | 320 | Físico | AoE Radio: 70px |
| **Escarcha** | **80** | 1 | - | 90 | 5 | 0.8 | 300 | Mágico | Ralentiza 40% / 2s |
|  |  | 2 | 160 | 100 | 12 | 1.0 | 330 | Mágico | Ralentiza 40% / 2s |
|  |  | 3 | 240 | 110 | 25 | 1.2 | 360 | Mágico | Ralentiza 40% / 2s |
| **Arcana** | **150** | 1 | - | 140 | 45 | 0.7 | 350 | Mágico | Ignora Armadura |
|  |  | 2 | 300 | 155 | 90 | 0.8 | 400 | Mágico | Ignora Armadura |
|  |  | 3 | 450 | 170 | 160 | 0.9 | 450 | Mágico | Ignora Armadura |

---

### Tabla 2: Catálogo y Balance Base de Enemigos

| Enemigo | Vida Base | Velocidad (px/s) | Armadura | Recompensa (Oro) | Daño a Meta | Descripción |
| --- | --- | --- | --- | --- | --- | --- |
| **Enjambre** | 25 | 60 | 0 | 2 | 1 | Muy rápido, sale en masa |
| **Duende** | 50 | 85 | 0 | 4 | 1 | Rápido, poca salud |
| **Guerrero** | 120 | 50 | 5 | 8 | 1 | Equilibrado con armadura |
| **Tanque** | 350 | 30 | 15 | 18 | 1 | Lento, armadura elevada |
| **Gólem de Bastión (Jefe)** | 1200 | 20 | 25 | 100 | 5 | Exclusivo de oleadas 5 y 10 |

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
  FASE 1: Módulos del Core (Vector2D, Enemy, Map) con UMD (file:// + CommonJS)
  FASE 2: Sistema de Construcción (Tower, Map grid, Costes e Inversión)
  FASE 3: Combate, Proyectiles, Tolerancias (8px/2px) y Tipos de Daño
  FASE 4: WaveManager, Fórmula de Salud Math.floor e Integración del GameEngine
  FASE 5: Capa Visual CanvasRenderer y UIController (HTML/DOM)
  FASE 6: Pantallas Overlays, Hotkeys y Persistencia localStorage
+-------------------------------------------------------------------------+

```

---

## Sección 6: Criterios de Aceptación y Validación

### Fase 1: Módulos Lógicos del Core (Sin DOM ni CORS)

* **`CA-01` [AUTOMÁTICO - `node --test`]:** La clase `GameEngine` debe instanciarse con 20 vidas, 150 de oro, oleada 0 y colecciones vacías.
* **`CA-02` [AUTOMÁTICO - `node --test`]:** El método `takeDamage` de `Enemy` debe reducir la vida calculando $\max(1, \text{Daño} - \text{Armadura})$ para daño físico y omitiendo la armadura en daño mágico.
* **`CA-03` [AUTOMÁTICO - `node --test`]:** La navegación de `Enemy` debe detectar los waypoints cuando la distancia euclídea sea $\le 2\text{ px}$.

### Fase 2: Construcción, Terreno y Reventa

* **`CA-04` [AUTOMÁTICO - `node --test`]:** El método `isCellBuildable(col, row)` devuelve `false` en las casillas ocupadas por el camino serpentina y `true` en el resto.
* **`CA-05` [AUTOMÁTICO - `node --test`]:** Intentar construir una Ballesta (50 oro) reduce el oro de 150 a 100 y reserva la casilla. Si no hay oro suficiente, devuelve `false`.
* **`CA-06` [AUTOMÁTICO - `node --test`]:** La reventa de cualquier torre devuelve el $70\%$ (`Math.floor`) del total invertido (coste base + mejoras) y deja la casilla libre.

### Fase 3: Torres, Combat & Proyectiles

* **`CA-07` [AUTOMÁTICO - `node --test`]:** La mejora de nivel de una torre deduce de forma exacta el valor fijado en la Tabla 1 ($\text{CosteBase} \times \text{NivelDestino}$) e incrementa sus estadísticas de daño, rango y cadencia.
* **`CA-08` [AUTOMÁTICO - `node --test`]:** Las torres escanean y seleccionan como objetivo al enemigo dentro de su rango que tenga el valor `distanceTraveled` más alto.
* **`CA-09` [AUTOMÁTICO - `node --test`]:** La torre Escarcha aplica un multiplicador de velocidad de $0.6$ al enemigo durante $2.0\text{ s}$. Un segundo impacto dentro de ese tiempo reinicia el contador de tiempo a $2.0\text{ s}$ sin acumular ralentización adicional.
* **`CA-10` [AUTOMÁTICO - `node --test`]:** Los proyectiles avanzan a la velocidad indicada en la Tabla 1 y provocan el impacto/daño al situarse a una distancia $\le 8\text{ px}$ del enemigo objetivo.

### Fase 4: Gestor de Oleadas y Lógica de Partida

* **`CA-11` [AUTOMÁTICO - `node --test`]:** La salud de los enemigos generados en la oleada $N$ debe ser calculada exactamente como $\text{Math.floor}\left(\text{VidaBase} \times 1.12^{(N - 1)}\right)$.
* **`CA-12` [AUTOMÁTICO - `node --test`]:** Un enemigo normal que cruce la meta resta 1 vida. El Jefe Gólem de Bastión resta 5 vidas.
* **`CA-13` [AUTOMÁTICO - `node --test`]:** Derrotar todos los enemigos de la oleada 10 con vidas $> 0$ pasa el juego a estado `VICTORY` y calcula la puntuación final como $\text{OroGanado} + (\text{Vidas} \times 50)$.

### Fase 5 & 6: Renderizado, UI y Ejecución Directa file://

* **`CA-14` [MANUAL]:** Al hacer doble clic en `index.html` sin ningún servidor HTTP en marcha, el juego carga sin errores de JavaScript ni bloqueos CORS en la consola del navegador.
* **`CA-15` [MANUAL]:** La interfaz gráfica responde a los atajos de teclado (`1`-`4` para elegir torres, `Espacio` para pausar, `F` para velocidad 1x/2x, `Escape` para cancelar selección, `U` para mejorar, `V` para vender).
* **`CA-16` [MANUAL]:** Al ganar o perder, se despliega el menú superpuesto con la puntuación y el récord se almacena correctamente en `localStorage`.