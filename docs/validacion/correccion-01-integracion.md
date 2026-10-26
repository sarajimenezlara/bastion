# Corrección 01 · Hallazgos de la prueba de integración (tras la Fase 4)

Origen: simulación de partidas completas (`npm run simular`) y revisión manual del código.
Ni las pruebas unitarias ni los revisores (local y gema QA) detectaron estos tres problemas,
porque solo aparecen al jugar una partida entera o al cargar el juego en el navegador.

## 1. Balance v2.1 (el GDD v2 era imposible de ganar)
Con el GDD v2 ninguna estrategia ganaba (ver `docs/validacion/simulacion-balance-v2.txt`).
La gema «Bastión · Diseñadora de juego» propuso el balance v2.1 en `docs/02-gemini/balance-v2.1.md`.
- Aplica exactamente sus valores: oro inicial 220, daños de Ballesta y Cañón, armadura y recompensa
  de Guerrero, Tanque y Gólem, y recompensas de fin de oleada (Tablas 1, 2 y 3 de ese documento).
- Actualiza `docs/GDD.md` a la versión 2.1: Sección 4, oro inicial donde aparezca y una entrada
  «v2.1» en el registro de cambios explicando que viene de la simulación.

## 2. La clase `Map` pisa el `Map` nativo de JavaScript en el navegador
En el navegador los scripts son clásicos y comparten el ámbito global, así que `class Map` y
`window.Map = Map` sustituyen al `Map` nativo para toda la página.
- Renombra la clase a `GameMap` y el fichero a `src/core/GameMap.js`. Actualiza todas las
  referencias, el patrón UMD (`window.GameMap`) y las pruebas.

## 3. No se puede lanzar una oleada antes de tiempo
El GDD (Sección 3, «Bono de Oleada Anticipada») da un bonus de `Math.floor(pendientes × 2) + 15`
por lanzar la siguiente oleada mientras la actual aún tiene enemigos por salir, pero
`WaveManager.startNextWave()` devuelve `null` si hay una oleada activa y la simulación confirma
que nunca se consigue.
- Añade `GameEngine.callNextWave()`: si no hay oleada activa, lanza la siguiente; si la hay y aún
  quedan oleadas, paga el bonus de `earlyWaveCall()` y añade los grupos de la siguiente oleada a
  la cola de spawn (empezando ya). Cada oleada paga su recompensa de fin al quedar terminada.
- Nuevo criterio **CA-17** con su prueba `tests/CA-17_early_wave.test.js`: lanzar la oleada 2
  con 6 enemigos de la 1 pendientes da 27 de oro, la oleada actual pasa a ser la 2 y salen
  enemigos de ambas.

## 4. El balance pasa a ser un criterio automático
Nuevo criterio **CA-18** con su prueba `tests/CA-18_balance_simulation.test.js`, que reutiliza
la lógica de `scripts/simular-balance.js` (expórtala en vez de duplicarla):
- «Sin torres» pierde antes de la oleada 4.
- «Medio con mejoras» gana la partida.
Añade CA-17 y CA-18 a la Sección 6 del GDD.

Pide `npm run simular` en la verificación final.
