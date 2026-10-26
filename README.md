# Bastión — Tower Defense en JavaScript Vanilla

Juego de defensa de torres que se ejecuta abriendo `index.html` con doble clic (protocolo `file://`),
sin servidores, sin bundlers y sin librerías externas.

## Requisitos

- Node.js 18 o superior (solo para ejecutar las pruebas automáticas).
- Un navegador moderno con soporte de Canvas 2D (solo para jugar).

## Cómo jugar

Abre `index.html` con doble clic y pulsa **Jugar**. La partida empieza en la **oleada 0**, en fase de
construcción y sin enemigos: coloca tus torres y lanza la primera oleada con «Siguiente oleada».
El tablero tiene una entrada, un camino serpentina y un castillo al que no deben llegar los enemigos.

- Elige una torre en el panel inferior (o con las teclas `1`-`4`) y haz clic en una casilla.
  Al pasar el ratón se ve la torre fantasma y su alcance: **verde** si se puede construir,
  **rojo** si la casilla está ocupada, es camino o no hay oro. Pulsar otra vez la misma tecla
  mantiene la torre elegida, para colocar varias seguidas.
- Haz clic sobre una torre construida para ver su nivel, daño, rango y cadencia, mejorarla o venderla.
- «Siguiente oleada» lanza la siguiente oleada y, si ya hay una activa, paga un bonus por los
  enemigos que aún no han salido.

| Tecla | Acción |
| --- | --- |
| `1`-`4` | Elegir Ballesta, Cañón, Escarcha o Arcana |
| `Espacio` | Pausar / reanudar |
| `F` | Alternar velocidad 1x / 2x |
| `Escape` | Cancelar la selección |
| `U` | Mejorar la torre seleccionada |
| `V` | Vender la torre seleccionada |

Al ganar o perder se muestra la puntuación final y el récord se guarda en `localStorage`.

## Pruebas

```bash
npm test
```

Ejecuta toda la lógica del core con `node --test tests/`. Cada criterio automático del GDD
tiene al menos una prueba cuyo nombre empieza por su código (`CA-01`, `CA-02`, …).

## Progreso

| Fase | Alcance | Estado |
| --- | --- | --- |
| 1 | Módulos del core (`Vector2D`, `Enemy`, `GameMap`, `WaveManager`, `GameEngine`) con UMD | ✅ Completada |
| 2 | Sistema de construcción: `Tower`, `TowerManager`, rejilla construible, costes y reventa | ✅ Completada |
| 3 | Combate, proyectiles, tolerancia de 8 px y tipos de daño | ✅ Completada |
| 4 | `WaveManager` completo, escalado de salud e integración del motor (`GameEngine`, vidas, victoria/derrota) | ✅ Completada |
| 5 | `CanvasRenderer` y `UIController` (HTML/DOM) | ✅ Completada |
| 6 | Pantallas superpuestas, atajos de teclado y `localStorage` | ✅ Completada |

### Fase 1 — Módulos lógicos del core

Criterios cubiertos y verificados con `npm test`:

- **CA-01** — `GameEngine` arranca con 20 vidas, 220 de oro, oleada 0 y colecciones vacías.
- **CA-02** — `Enemy.takeDamage` aplica `max(1, daño - armadura)` en físico e ignora la armadura en mágico.
- **CA-03** — `Enemy.update` detecta los waypoints a una distancia euclídea ≤ 2 px.

Decisiones de diseño de la fase: [`docs/decisiones/fase-1.md`](docs/decisiones/fase-1.md).

### Fase 2 — Construcción, terreno y reventa

Criterios cubiertos y verificados con `npm test`:

- **CA-04** — `GameMap.isCellBuildable` devuelve `false` en las casillas del camino serpentina (59 casillas), en las ocupadas por una torre y fuera de la rejilla; `true` en el resto.
- **CA-05** — `GameEngine.placeTower` construye una Ballesta y baja el oro de 220 a 170 reservando la casilla; sin oro, casilla inválida u ocupada devuelve `false` sin alterar el estado.
- **CA-06** — `GameEngine.sellTower` devuelve `Math.floor(totalInvertido × 0.70)` (coste base + mejoras) y libera la casilla.

Piezas añadidas:

- `src/core/Tower.js` — entidad con nivel, inversión acumulada y catálogo de la Tabla 1 (costes y estadísticas por nivel).
- `src/core/TowerManager.js` — colección de torres, reserva/liberación de casillas y reventa inmediata.
- `GameMap` — relleno de `pathCells`, control de casillas ocupadas e `isCellBuildable`.
- `GameEngine` — `placeTower` y `sellTower` junto al `TowerManager`, compartiendo la colección `engine.towers`.

Decisiones de diseño de la fase: [`docs/decisiones/fase-2.md`](docs/decisiones/fase-2.md).

### Fase 3 — Torres, combate y proyectiles

Criterios cubiertos y verificados con `npm test`:

- **CA-07** — `GameEngine.upgradeTower` descuenta exactamente `CosteBase × NivelDestino` de la Tabla 1, sube el nivel y aplica las estadísticas de daño, rango, cadencia y velocidad de proyectil. Sin oro, al máximo o con una torre inexistente devuelve `false` sin alterar el estado.
- **CA-08** — `Tower.findTarget` elige al enemigo dentro del rango con mayor `distanceTraveled`, ignorando muertos y enemigos que ya alcanzaron la meta; `Tower.update` respeta la cadencia y dispara al objetivo elegido.
- **CA-09** — El impacto de Escarcha aplica el multiplicador `0.6` durante `2.0 s`; un segundo impacto reinicia el contador sin acumular intensidad y la velocidad vuelve a la normalidad al expirar.
- **CA-10** — `Projectile` avanza a la velocidad de la Tabla 1, impacta a `≤ 8 px` sin atravesar al objetivo con deltas grandes y aplica daño físico (con armadura), mágico (sin armadura) y en área para el Cañón.

Piezas añadidas:

- `src/core/Projectile.js` — movimiento con paso limitado a la distancia restante, tolerancia de impacto de 8 px, daño mono-objetivo y AoE, y ralentización.
- `Tower` — `position` en píxeles, `findTarget`, `update` (cadencia y disparo), `upgrade`, `getUpgradeCost` y `getUpgradeCost(type, targetLevel)`.
- `GameEngine` — `upgradeTower`, `createProjectile` y `tick` (combate de enemigos, torres y proyectiles).
- `TowerManager` — la torre recibe el centro real de su casilla desde `GameMap.cellCenter`.

Decisiones de diseño de la fase: [`docs/decisiones/fase-3.md`](docs/decisiones/fase-3.md).

### Fase 4 — Gestor de oleadas y lógica de partida

Criterios cubiertos y verificados con `npm test`:

- **CA-11** — `WaveManager.getScaledHealth` y `WaveManager.getEnemyHealth` aplican `Math.floor(VidaBase × 1.12^(N-1))` para los cinco tipos de enemigo de la Tabla 2; el `GameEngine` genera cada enemigo con la vida de su oleada (incluidos los jefes de las oleadas 5 y 10).
- **CA-12** — Un enemigo que cruza la meta resta 1 vida; el Gólem de Bastión resta 5 (Tabla 2). Las vidas nunca bajan de 0, el enemigo se retira de la partida y la derrota (`DEFEAT`) es inmediata.
- **CA-13** — Al terminar la oleada 10 (todos los grupos han salido y el mapa está vacío) con vidas > 0, el estado pasa a `VICTORY` y `score = totalGoldEarned + vidas × 50`. La derrota tiene prioridad sobre la victoria en el mismo tick.

Piezas añadidas:

- `src/core/WaveManager.js` — catálogo de enemigos de la Tabla 2, las 10 oleadas de la Tabla 3, un flujo de spawn independiente por grupo (todos arrancan a la vez, el jefe no pausa al resto), cola ordenada por tiempo, vida escalada con `Math.floor` y cierre de oleada.
- `GameEngine` — `tick` centralizado (oleadas → enemigos → torres → proyectiles → limpieza → estado), `spawnEnemy`, `startNextWave`, `earlyWaveCall`, `getGoalDamage`, `cleanupEnemies`, `updateWaveState` y `calculateFinalScore`.
- `GameEngine.state` — `MENU` → `PLAYING` → `VICTORY` / `DEFEAT` (la decisión 3 de la fase fija `DEFEAT` donde el GDD escribía `GAMEOVER`).

Decisiones de diseño de la fase: [`docs/decisiones/fase-4.md`](docs/decisiones/fase-4.md).

### Fases 5 y 6 — Renderizado, interfaz y ejecución directa `file://`

Criterios cubiertos:

- **CA-14** — `index.html` se abre con doble clic sin servidor: todos los scripts son etiquetas `<script>` normales (sin `type="module"` ni `import`/`export`), el core se carga antes que la presentación y no hay recursos externos. La partida se dibuja con `requestAnimationFrame` y el motor recibe un `deltaTime` limitado a **0,1 s** para que cambiar de pestaña no provoque saltos.
- **CA-15** — La interfaz responde a `1`-`4` (elegir torre), `Espacio` (pausa), `F` (1x/2x), `Escape` (cancelar), `U` (mejorar) y `V` (vender). La comprobación manual se hace jugando; la traducción tecla → acción y clic → casilla se verifica con `npm test`.
- **CA-16** — Al ganar o perder se muestra el menú superpuesto con la puntuación y el récord se guarda en `localStorage` (clave `bastion.record`), tolerando almacenamiento bloqueado o corrupto.

Piezas añadidas:

- `index.html` — estructura del HUD superior (vidas, oro, oleada, enemigos, pausa, velocidad y siguiente oleada), canvas del tablero, panel de la torre seleccionada, panel inferior con las 4 torres y capas de inicio/victoria/derrota.
- `styles.css` — disposición en rejilla, tarjetas de torre y pantallas superpuestas.
- `src/presentation/CanvasRenderer.js` — dibujo con primitivas de Canvas: damero de hierba, camino de tierra con borde, entrada y castillo, torres con color y marcas de nivel, enemigos con tamaño por tipo, barra de vida y tinte azul al ralentizarse, torre fantasma con alcance verde/rojo, alcance de la torre seleccionada y destello del Cañón al impactar.
- `src/presentation/UIController.js` — HUD, tarjetas, panel de la torre, atajos, clics sobre el tablero y pantallas superpuestas.
- `src/presentation/InputMap.js` — traducción pura de teclas y clics a acciones (sin DOM).
- `src/presentation/RecordStore.js` — récord en `localStorage` con validación y tolerancia a errores.
- `src/presentation/GameLoop.js` — bucle de `requestAnimationFrame` con el tope de 0,1 s por frame.
- `src/presentation/main.js` — arranque que une motor, renderizador, interfaz y bucle.
- `Projectile` y `GameEngine` — renombradas sus referencias internas (`Vector2DRefProjectile`, `TowerRefEngine`) para que dos scripts clásicos no redeclaren la misma constante global y rompan la carga bajo `file://`.

Decisiones de diseño de la fase: [`docs/decisiones/fase-5.md`](docs/decisiones/fase-5.md).
