// CA-13: derrotar todos los enemigos de la oleada 10 con vidas > 0 pasa el juego
// a VICTORY y calcula la puntuación final como OroGanado + (Vidas × 50).
// Decisiones de docs/decisiones/fase-4.md: la oleada termina cuando han salido
// todos los grupos y el mapa queda limpio; la derrota tiene prioridad.

const test = require('node:test');
const assert = require('node:assert/strict');

const GameEngine = require('../src/core/GameEngine.js');

// Fuerza la salida de todos los enemigos de la oleada activa.
function drainSpawns(engine) {
  return engine.waveManager.update(1000, (spawn) => engine.spawnEnemy(spawn));
}

function killAll(enemies) {
  for (const enemy of enemies) {
    enemy.takeDamage(1e9, 'MAGIC');
  }
}

test('CA-13 ganar la oleada 10 pasa a VICTORY y calcula la puntuación final', () => {
  const engine = new GameEngine();
  engine.lives = 7;
  engine.totalGoldEarned = 500;
  engine.waveManager.currentWaveIndex = 9; // oleada 10

  assert.ok(engine.startNextWave());
  assert.equal(engine.state, 'PLAYING');

  const spawned = drainSpawns(engine);
  assert.equal(spawned.length, 32); // 2 jefes + 20 guerreros + 10 tanques
  assert.equal(engine.enemies.length, 32);

  killAll(engine.enemies);
  engine.tick(0.01);

  assert.equal(engine.enemies.length, 0, 'los enemigos derrotados salen de la colección');
  assert.equal(engine.waveManager.isWaveActive, false);
  assert.equal(engine.waveManager.completedWaves, 10);
  assert.equal(engine.state, 'VICTORY');

  // Recompensas: 2×100 + 20×10 + 10×25 = 650 de enemigos, + 200 de fin de oleada.
  assert.equal(engine.totalGoldEarned, 500 + 650 + 200);
  assert.equal(engine.gold, 220 + 650 + 200);
  // Puntuación = OroGanado + (Vidas × 50) = 1350 + 350.
  assert.equal(engine.score, 1700);
  assert.equal(engine.score, engine.calculateFinalScore());
});

test('CA-13 completar la oleada 1 paga su recompensa y no declara la victoria', () => {
  const engine = new GameEngine();
  assert.ok(engine.startNextWave());

  drainSpawns(engine);
  assert.equal(engine.enemies.length, 10);
  assert.equal(engine.enemies[0].maxHealth, 25);

  killAll(engine.enemies);
  engine.tick(0.01);

  assert.equal(engine.state, 'PLAYING');
  assert.equal(engine.waveManager.completedWaves, 1);
  assert.equal(engine.waveManager.currentWaveIndex, 1);
  // 10 Enjambre × 2 de oro + 40 de recompensa de oleada.
  assert.equal(engine.gold, 220 + 20 + 40);
  assert.equal(engine.totalGoldEarned, 220 + 20 + 40);
  assert.equal(engine.score, 0, 'la puntuación solo se fija al terminar la partida');
});

test('CA-13 la oleada no termina mientras queden enemigos vivos o spawns pendientes', () => {
  const engine = new GameEngine();
  engine.startNextWave();

  engine.tick(0.1); // sale el primer Enjambre
  assert.equal(engine.enemies.length, 1);
  assert.equal(engine.waveManager.isWaveActive, true);

  engine.enemies[0].takeDamage(1e9, 'MAGIC');
  engine.tick(0.01);

  // Hay 9 Enjambres pendientes en la cola: la oleada sigue activa.
  assert.equal(engine.waveManager.isWaveActive, true);
  assert.ok(engine.waveManager.pendingCount() > 0);
  assert.equal(engine.waveManager.completedWaves, 0);
  assert.equal(engine.state, 'PLAYING');
});

test('CA-13 no hay victoria si queda un enemigo vivo en la oleada 10', () => {
  const engine = new GameEngine();
  engine.lives = 10;
  engine.waveManager.currentWaveIndex = 9;
  engine.startNextWave();
  drainSpawns(engine);

  killAll(engine.enemies.slice(1));
  engine.tick(0.01);

  assert.equal(engine.enemies.length, 1);
  assert.equal(engine.state, 'PLAYING');
  assert.equal(engine.waveManager.isWaveActive, true);
  assert.equal(engine.waveManager.completedWaves, 0);
});

test('CA-13 la derrota tiene prioridad sobre la victoria en el mismo tick', () => {
  const engine = new GameEngine();
  engine.lives = 1;
  engine.totalGoldEarned = 500;
  engine.waveManager.currentWaveIndex = 9;
  engine.startNextWave();
  drainSpawns(engine);

  // Solo queda un enemigo, colocado justo antes de la meta.
  const survivor = engine.enemies[0];
  const waypoints = engine.map.getWaypointsInPixels();
  const last = waypoints[waypoints.length - 1];
  survivor.currentWaypointIndex = waypoints.length - 1;
  survivor.position.x = last.x - 5;
  survivor.position.y = last.y;
  engine.enemies = [survivor];

  engine.tick(0.5);

  assert.equal(engine.lives, 0);
  assert.equal(engine.state, 'DEFEAT');
  assert.equal(engine.score, 500);
});

test('CA-13 calculateFinalScore aplica OroGanado + (Vidas × 50)', () => {
  const engine = new GameEngine();
  engine.totalGoldEarned = 300;
  engine.lives = 10;

  assert.equal(engine.calculateFinalScore(), 800);
});

test('CA-13 una partida terminada no sigue avanzando con tick', () => {
  const engine = new GameEngine();
  engine.lives = 5;
  engine.state = 'VICTORY';
  engine.score = 1234;

  engine.tick(10);

  assert.equal(engine.score, 1234);
  assert.equal(engine.state, 'VICTORY');
});

test('CA-13 el motor no arranca una oleada si ya hay una activa ni tras la 10', () => {
  const engine = new GameEngine();
  assert.ok(engine.startNextWave());
  assert.equal(engine.startNextWave(), false);

  engine.waveManager.currentWaveIndex = 10;
  engine.waveManager.isWaveActive = false;
  assert.equal(engine.startNextWave(), false);
});
