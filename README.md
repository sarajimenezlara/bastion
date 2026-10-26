# Bastión — Tower Defense en JavaScript Vanilla

Juego de defensa de torres que se ejecuta abriendo `index.html` con doble clic (protocolo `file://`),
sin servidores, sin bundlers y sin librerías externas.

## Requisitos

- Node.js 18 o superior (solo para ejecutar las pruebas automáticas).
- Un navegador moderno con soporte de Canvas 2D (solo para jugar, a partir de la Fase 5).

## Cómo jugar

Pendiente: la interfaz gráfica y el bucle de renderizado llegan en la Fase 5.

## Pruebas

```bash
npm test
```

Ejecuta toda la lógica del core con `node --test tests/`. Cada criterio automático del GDD
tiene al menos una prueba cuyo nombre empieza por su código (`CA-01`, `CA-02`, …).

## Progreso

| Fase | Alcance | Estado |
| --- | --- | --- |
| 1 | Módulos del core (`Vector2D`, `Enemy`, `Map`, `WaveManager`, `GameEngine`) con UMD | ✅ Completada |
| 2 | Sistema de construcción: `Tower`, `TowerManager`, rejilla construible, costes y reventa | ✅ Completada |
| 3 | Combate, proyectiles, tolerancia de 8 px y tipos de daño | ✅ Completada |
| 4 | `WaveManager` completo, escalado de salud e integración del motor (`GameEngine`, vidas, victoria/derrota) | ✅ Completada |
| 5 | `CanvasRenderer` y `UIController` (HTML/DOM) | ⏳ Pendiente |
| 6 | Pantallas superpuestas, atajos de teclado y `localStorage` | ⏳ Pendiente |

### Fase 1 — Módulos lógicos del core

Criterios cubiertos y verificados con `npm test`:

- **CA-01** — `GameEngine` arranca con 20 vidas, 150 de oro, oleada 0 y colecciones vacías.
- **CA-02** — `Enemy.takeDamage` aplica `max(1, daño - armadura)` en físico e ignora la armadura en mágico.
- **CA-03** — `Enemy.update` detecta los waypoints a una distancia euclídea ≤ 2 px.

Decisiones de diseño de la fase: [`docs/decisiones/fase-1.md`](docs/decisiones/fase-1.md).

### Fase 2 — Construcción, terreno y reventa

Criterios cubiertos y verificados con `npm test`:

- **CA-04** — `Map.isCellBuildable` devuelve `false` en las casillas del camino serpentina (59 casillas), en las ocupadas por una torre y fuera de la rejilla; `true` en el resto.
- **CA-05** — `GameEngine.placeTower` construye una Ballesta y baja el oro de 150 a 100 reservando la casilla; sin oro, casilla inválida u ocupada devuelve `false` sin alterar el estado.
- **CA-06** — `GameEngine.sellTower` devuelve `Math.floor(totalInvertido × 0.70)` (coste base + mejoras) y libera la casilla.

Piezas añadidas:

- `src/core/Tower.js` — entidad con nivel, inversión acumulada y catálogo de la Tabla 1 (costes y estadísticas por nivel).
- `src/core/TowerManager.js` — colección de torres, reserva/liberación de casillas y reventa inmediata.
- `Map` — relleno de `pathCells`, control de casillas ocupadas e `isCellBuildable`.
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
- `TowerManager` — la torre recibe el centro real de su casilla desde `Map.cellCenter`.

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

Fuera de alcance en esta fase (se implementan después según el roadmap):

- Renderizado, HUD, bucle de dibujo y `index.html` → Fases 5 y 6.
- Pantallas superpuestas, atajos de teclado y `localStorage` → Fase 6.
