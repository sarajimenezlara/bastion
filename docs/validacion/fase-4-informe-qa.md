Revisa la Fase 4 de Bastión con tus criterios. Estos son los criterios de aceptación y las evidencias:

**CA-11 [AUTOMÁTICO - node --test]:** La salud de los enemigos generados en la oleada N debe ser calculada exactamente como Math.floor(VidaBase × 1.12^(N - 1)).

**CA-12 [AUTOMÁTICO - node --test]:** Un enemigo normal que cruce la meta resta 1 vida. El Jefe Gólem de Bastión resta 5 vidas.

**CA-13 [AUTOMÁTICO - node --test]:** Derrotar todos los enemigos de la oleada 10 con vidas > 0 pasa el juego a estado VICTORY y calcula la puntuación final como OroGanado + (Vidas × 50).

Salida de npm test:
✔ CA-11 la vida escalada usa Math.floor con la base 1.12 de la oleada N (1.328986ms)
✔ CA-11 el catálogo base de enemigos coincide con la Tabla 2 (0.481102ms)
✔ CA-11 la vida escalada de todos los tipos coincide en las oleadas clave (0.619217ms)
✔ CA-11 el GameEngine genera enemigos con la vida escalada de su oleada (1.201742ms)
✔ CA-11 la oleada 10 genera jefe, guerreros y tanques con vida escalada (0.719953ms)
✔ CA-11 no se generan enemigos sin oleada activa (0.14352ms)
✔ CA-12 un enemigo normal que cruza la meta resta 1 vida (5.344823ms)
✔ CA-12 el jefe Gólem de Bastión resta 5 vidas (0.286346ms)
✔ CA-12 varios enemigos que cruzan la meta en el mismo tick restan sus vidas (0.274612ms)
✔ CA-12 las vidas nunca bajan de 0 y la derrota es inmediata (0.571036ms)
✔ CA-12 un enemigo sin daño explícito usa el valor de la Tabla 2 según su tipo (0.236463ms)
✔ CA-12 un enemigo que cruza la meta no se cuenta como derrotado ni da oro (0.274037ms)
✔ CA-13 ganar la oleada 10 pasa a VICTORY y calcula la puntuación final (2.591822ms)
✔ CA-13 completar la oleada 1 paga su recompensa y no declara la victoria (0.388843ms)
✔ CA-13 la oleada no termina mientras queden enemigos vivos o spawns pendientes (0.39607ms)
✔ CA-13 no hay victoria si queda un enemigo vivo en la oleada 10 (0.458041ms)
✔ CA-13 la derrota tiene prioridad sobre la victoria en el mismo tick (0.887004ms)
✔ CA-13 calculateFinalScore aplica OroGanado + (Vidas × 50) (0.130085ms)
✔ CA-13 una partida terminada no sigue avanzando con tick (0.109454ms)
✔ CA-13 el motor no arranca una oleada si ya hay una activa ni tras la 10 (0.103673ms)
ℹ tests 79
ℹ suites 0
ℹ pass 79
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 97.22666

Ficheros del proyecto:
src/core/Enemy.js
src/core/GameEngine.js
src/core/Map.js
src/core/Projectile.js
src/core/Tower.js
src/core/TowerManager.js
src/core/Vector2D.js
src/core/WaveManager.js
tests/CA-01_engine_init.test.js
tests/CA-02_enemy_damage.test.js
tests/CA-03_enemy_waypoints.test.js
tests/CA-04_map_buildable.test.js
tests/CA-05_tower_placement.test.js
tests/CA-06_tower_sell.test.js
tests/CA-07_tower_upgrade.test.js
tests/CA-08_tower_targeting.test.js
tests/CA-09_tower_frost.test.js
tests/CA-10_projectile_impact.test.js
tests/CA-11_wave_health_scaling.test.js
tests/CA-12_lives_goal_damage.test.js
tests/CA-13_victory_score.test.js

Veredicto del revisor local (si existe):
| CA (Criterio de Aceptación) | Estado | Evidencia Observada |
| :--- | :---: | :--- |
| **CA-11** [AUTOMÁTICO - `node --test`]: La salud de los enemigos generados en la oleada $N$ debe ser calculada exactamente como $\text{Math.floor}\left(\text{VidaBase} \times 1.12^{(N - 1)}\right)$. | **CUMPLE** | Pruebas en `tests/CA-11_wave_health_scaling.test.js` verifican la escala de vida de los enemigos según la oleada. |
| **CA-12** [AUTOMÁTICO - `node --test`]: Un enemigo normal que cruce la meta resta 1 vida. El Jefe Gólem de Bastión resta 5 vidas. | **CUMPLE** | Pruebas en `tests/CA-12_lives_goal_damage.test.js` confirman que los enemigos restan vida correctamente. |
| **CA-13** [AUTOMÁTICO - `node --test`]: Derrotar todos los enemigos de la oleada 10 con vidas $> 0$ pasa el juego a estado `VICTORY` y calcula la puntuación final como $\text{OroGanado} + (\text{Vidas} \times 50)$ | **CUMPLE** | Pruebas en `tests/CA-13_victory_score.test.js` comprueban la lógica de victoria y el cálculo de la puntuación final. |

**Veredicto Final**: **Aprobado**

**Acciones Correctivas**: No requiere ninguna acción correctiva.