Verificado. No he modificado ningún número de la salida de pruebas ni alterado los datos proporcionados.

---

**Revisa la Fase 3 de Bastión con tus criterios. Estos son los criterios de aceptación y las evidencias:**

### Criterios de aceptación de la fase
### Fase 3: Torres, Combat & Proyectiles

* **`CA-07` [AUTOMÁTICO - `node --test`]:** La mejora de nivel de una torre deduce de forma exacta el valor fijado en la Tabla 1 ($\text{CosteBase} \times \text{NivelDestino}$) e incrementa sus estadísticas de daño, rango y cadencia.
* **`CA-08` [AUTOMÁTICO - `node --test`]:** Las torres escanean y seleccionan como objetivo al enemigo dentro de su rango que tenga el valor `distanceTraveled` más alto.
* **`CA-09` [AUTOMÁTICO - `node --test`]:** La torre Escarcha aplica un multiplicador de velocidad de $0.6$ al enemigo durante $2.0\text{ s}$. Un segundo impacto dentro de ese tiempo reinicia el contador de tiempo a $2.0\text{ s}$ sin acumular ralentización adicional.
* **`CA-10` [AUTOMÁTICO - `node --test`]:** Los proyectiles avanzan a la velocidad indicada en la Tabla 1 y provocan el impacto/daño al situarse a una distancia $\le 8\text{ px}$ del enemigo objetivo.

### Fase 4: Gestor de Oleadas y Lógica de Partida


### Salida de npm test
✔ CA-05 el catálogo expone los costes base y las estadísticas de nivel 1 (0.15965ms)
✔ CA-06 vender una Ballesta devuelve 35 de oro y libera la casilla (1.639932ms)
✔ CA-06 la reventa aplica Math.floor sobre la inversión total (0.301386ms)
✔ CA-06 la reventa incluye las mejoras cuando existen (0.114558ms)
✔ CA-06 el motor devuelve el 70% de la inversión acumulada de la torre (0.139682ms)
✔ CA-06 vender una torre inexistente devuelve false y no altera el oro (0.123675ms)
✔ CA-06 no se puede vender dos veces la misma torre (0.12085ms)
✔ CA-06 tras vender se puede volver a construir en la misma casilla (0.292094ms)
✔ CA-07 mejorar una Ballesta descuenta 100 de oro e incrementa sus estadísticas (5.037814ms)
✔ CA-07 cada tipo de torre paga CosteBase × NivelDestino y aplica la Tabla 1 (0.547493ms)
✔ CA-07 sin oro suficiente la mejora devuelve false y no altera la torre (0.215387ms)
✔ CA-07 no se puede superar el nivel máximo (0.227794ms)
✔ CA-07 mejorar una torre inexistente devuelve false (0.167452ms)
✔ CA-08 elige al enemigo más avanzado dentro del rango (1.638928ms)
✔ CA-08 ignora enemigos muertos y los que ya llegaron a la meta (0.250826ms)
✔ CA-08 sin objetivos válidos devuelve null (0.151481ms)
✔ CA-08 la torre dispara al objetivo elegido mediante el callback (0.86811ms)
✔ CA-08 la torre respeta la cadencia entre disparos (0.22177ms)
✔ CA-09 el impacto de Escarcha ralentiza al enemigo un 40% durante 2 s (5.141581ms)
✔ CA-09 un segundo impacto reinicia el temporizador a 2 s sin acumular (0.351413ms)
✔ CA-09 la velocidad se reduce al 60% mientras dura el efecto (0.150562ms)
✔ CA-09 la torre Escarcha ralentiza al enemigo a través del motor (0.750633ms)
✔ CA-10 el proyectil avanza a la velocidad indicada en píxeles por segundo (1.832938ms)
✔ CA-10 cada tipo de torre genera proyectiles con la velocidad de la Tabla 1 (1.056147ms)
✔ CA-10 impacta a 8 px y aplica el daño físico con mitigación de armadura (0.354569ms)
✔ CA-10 no impacta si la distancia es mayor que 8 px (0.252612ms)
✔ CA-10 un delta grande no atraviesa al objetivo: el paso se limita a la distancia (0.224823ms)
✔ CA-10 el daño mágico ignora la armadura (0.226031ms)
✔ CA-10 el Cañón aplica daño en área a todos los enemigos dentro del radio (0.298913ms)
✔ CA-10 si el objetivo muere antes del impacto, el proyectil normal se descarta sin daño (0.220959ms)
✔ CA-10 el Cañón sigue hasta la última posición conocida y aplica el área (0.303653ms)
✔ CA-10 el motor elimina el proyectil tras impactar y aplica el daño a la torre (0.859188ms)
ℹ tests 59
ℹ suites 0
ℹ pass 59
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 89.550649


### Ficheros del proyecto
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


### Informe del revisor local (si existe)
# Fase 3 · Informe del revisor local (ollama/qwen2.5-coder-16k)

| CA (Criterio de Aceptación) | Estado | Evidencia Observada |
| :--- | :---: | :--- |
| CA-07: La mejora de nivel de una torre deduce de forma exacta el valor fijado en la Tabla 1 ($\text{CosteBase} \times \text{NivelDestino}$) e incrementa sus estadísticas de daño, rango y cadencia. | CUMPLE | [Prueba técnica en `CA-07_tower_upgrade.test.js`] |
| CA-08: Las torres escanean y seleccionan como objetivo al enemigo dentro de su rango que tenga el valor `distanceTraveled` más alto. | CUMPLE | [Prueba técnica en `CA-08_tower_targeting.test.js`] |
| CA-09: La torre Escarcha aplica un multiplicador de velocidad de $0.6$ al enemigo durante $2.0\text{ s}$. Un segundo impacto dentro de ese tiempo reinicia el contador de tiempo a $2.0\text{ s}$ sin acumular ralentización adicional. | CUMPLE | [Prueba técnica en `CA-09_tower_frost.test.js`] |
| CA-10: Los proyectiles avanzan a la velocidad indicada en la Tabla 1 y provocan el impacto/daño al situarse a una distancia $\le 8\text{ px}$ del enemigo objetivo. | CUMPLE | [Prueba técnica en `CA-10_projectile_impact.test.js`] |

**Veredicto Final:** Aprobado

**Acciones Correctivas:** N/A

Evaluación realizada de acuerdo a las evidencias proporcionadas y aplicando los criterios de aceptación establecidos en el GDD. Todas las pruebas automatizadas verifican que los comportamientos de mejora de torres, selección de objetivos, efectos de torres especializada y comportamientos de proyectiles cumplen con los requisitos del proyecto.