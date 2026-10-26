// CA-12: un enemigo normal que cruza la meta resta 1 vida; el jefe Gólem de
// Bastión resta 5 vidas (Tabla 2). Se cubre el cruce real del camino, el
// clamping a 0, la derrota inmediata y la prioridad sobre la victoria.

const test = require('node:test');
const assert = require('node:assert/strict');

const GameEngine = require('../src/core/GameEngine.js');

// Coloca un enemigo justo antes del último waypoint para que cruce la meta
// con un tick pequeño, sin teletransportarlo al final.
function placeBeforeGoal(engine, enemy, offsetPx = 1) {
  const waypoints = engine.map.getWaypointsInPixels();
  const last = waypoints[waypoints.length - 1];
  enemy.currentWaypointIndex = waypoints.length - 1;
  enemy.position.x = last.x - offsetPx;
  enemy.position.y = last.y;
  return last;
}

function spawnNormal(engine, overrides = {}) {
  return engine.spawnEnemy({
    type: 'Guerrero',
    health: 120,
    speed: 50,
    armor: 5,
    reward: 8,
    goalDamage: 1,
    isBoss: false,
    ...overrides,
  });
}

test('CA-12 un enemigo normal que cruza la meta resta 1 vida', () => {
  const engine = new GameEngine();
  const enemy = spawnNormal(engine);

  placeBeforeGoal(engine, enemy);
  engine.tick(0.1);

  assert.equal(enemy.hasReachedEnd, true);
  assert.equal(engine.lives, 19);
  assert.equal(engine.enemies.length, 0, 'el enemigo que llega a la meta se retira');
  // Llegar a la meta no entrega recompensa de oro.
  assert.equal(engine.gold, 150);
  assert.equal(engine.totalGoldEarned, 150);
});

test('CA-12 el jefe Gólem de Bastión resta 5 vidas', () => {
  const engine = new GameEngine();
  const boss = engine.spawnEnemy({
    type: 'Golem',
    health: 1888,
    speed: 20,
    armor: 25,
    reward: 100,
    goalDamage: 5,
    isBoss: true,
  });

  assert.equal(engine.getGoalDamage(boss), 5);

  placeBeforeGoal(engine, boss);
  engine.tick(0.1);

  assert.equal(boss.hasReachedEnd, true);
  assert.equal(engine.lives, 15);
  assert.equal(engine.enemies.length, 0);
});

test('CA-12 varios enemigos que cruzan la meta en el mismo tick restan sus vidas', () => {
  const engine = new GameEngine();
  const uno = spawnNormal(engine);
  const dos = spawnNormal(engine);
  const jefe = engine.spawnEnemy({
    type: 'Golem',
    health: 1200,
    speed: 20,
    armor: 25,
    reward: 100,
    goalDamage: 5,
    isBoss: true,
  });

  placeBeforeGoal(engine, uno);
  placeBeforeGoal(engine, dos);
  placeBeforeGoal(engine, jefe);

  engine.tick(0.1);

  assert.equal(engine.lives, 20 - 1 - 1 - 5);
  assert.equal(engine.enemies.length, 0);
});

test('CA-12 las vidas nunca bajan de 0 y la derrota es inmediata', () => {
  const engine = new GameEngine();
  engine.startNextWave(); // estado PLAYING
  engine.totalGoldEarned = 300;
  engine.lives = 3;

  const boss = engine.spawnEnemy({
    type: 'Golem',
    health: 1200,
    speed: 20,
    armor: 25,
    reward: 100,
    goalDamage: 5,
    isBoss: true,
  });
  placeBeforeGoal(engine, boss);

  engine.tick(0.1);

  assert.equal(engine.lives, 0);
  assert.equal(engine.state, 'DEFEAT');
  assert.equal(engine.score, 300); // OroGanado + (0 vidas × 50)
});

test('CA-12 un enemigo sin daño explícito usa el valor de la Tabla 2 según su tipo', () => {
  const engine = new GameEngine();

  assert.equal(engine.getGoalDamage({ isBoss: false }), 1);
  assert.equal(engine.getGoalDamage({ isBoss: true }), 5);
  assert.equal(engine.getGoalDamage(null), 0);
});

test('CA-12 un enemigo que cruza la meta no se cuenta como derrotado ni da oro', () => {
  const engine = new GameEngine();
  const enemy = spawnNormal(engine, { reward: 8 });

  placeBeforeGoal(engine, enemy);
  engine.tick(0.1);

  assert.equal(engine.gold, 150);
  assert.equal(engine.totalGoldEarned, 150);
  assert.equal(engine.enemies.includes(enemy), false);
});
