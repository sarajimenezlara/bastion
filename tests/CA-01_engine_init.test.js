// CA-01: GameEngine se instancia con 20 vidas, 150 de oro, oleada 0 y colecciones vacías.

const test = require('node:test');
const assert = require('node:assert/strict');

const GameEngine = require('../src/core/GameEngine.js');
const Map = require('../src/core/Map.js');

test('CA-01 GameEngine arranca con 20 vidas y 150 de oro', () => {
  const engine = new GameEngine();

  assert.equal(engine.lives, 20);
  assert.equal(engine.gold, 150);
  assert.equal(engine.totalGoldEarned, 150);
  assert.equal(engine.score, 0);
});

test('CA-01 GameEngine arranca en oleada 0 sin oleada activa', () => {
  const engine = new GameEngine();

  assert.equal(engine.waveManager.currentWaveIndex, 0);
  assert.equal(engine.currentWave, 0);
  assert.equal(engine.waveManager.isWaveActive, false);
  assert.equal(engine.waveManager.totalWaves, 10);
  assert.equal(engine.waveManager.healthMultiplierBase, 1.12);
});

test('CA-01 GameEngine arranca con colecciones vacías y estado MENU', () => {
  const engine = new GameEngine();

  assert.ok(Array.isArray(engine.towers));
  assert.ok(Array.isArray(engine.enemies));
  assert.ok(Array.isArray(engine.projectiles));
  assert.ok(engine.towers.length === 0);
  assert.ok(engine.enemies.length === 0);
  assert.ok(engine.projectiles.length === 0);
  assert.equal(engine.state, 'MENU');
  assert.equal(engine.isPaused, false);
  assert.equal(engine.gameSpeed, 1);
});

test('CA-01 GameEngine crea un mapa 20x12 con casillas de 40 px', () => {
  const engine = new GameEngine();

  assert.ok(engine.map instanceof Map);
  assert.equal(engine.map.cols, 20);
  assert.equal(engine.map.rows, 12);
  assert.equal(engine.map.tileSize, 40);
  assert.equal(engine.map.waypoints.length, 8);
});
