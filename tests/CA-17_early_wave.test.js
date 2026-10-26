// CA-17: GameEngine.callNextWave permite lanzar la siguiente oleada antes de
// que termine la actual, paga el bono de llamada anticipada del GDD §3.5 y
// mantiene en juego enemigos de ambas oleadas.

const test = require('node:test');
const assert = require('node:assert/strict');

const GameEngine = require('../src/core/GameEngine.js');

test('CA-17 lanzar la oleada 2 con 6 enemigos pendientes da 27 de oro y solapa ambas oleadas', () => {
  const engine = new GameEngine();

  assert.ok(engine.startNextWave()); // oleada 1
  assert.equal(engine.currentWave, 1);

  // Han salido 4 Enjambres (tiempos 0, 0.6, 1.2 y 1.8 s): quedan 6 pendientes.
  engine.tick(1.9);
  assert.equal(engine.waveManager.pendingCount(), 6);
  assert.equal(engine.enemies.length, 4);
  assert.equal(engine.gold, 220);

  const definition = engine.callNextWave();

  assert.ok(definition);
  assert.equal(definition.wave, 2);
  assert.equal(engine.currentWave, 2);
  assert.equal(engine.gold, 220 + 27); // floor(6 × 2) + 15
  assert.equal(engine.totalGoldEarned, 220 + 27);

  // La oleada 2 empieza ya: en el siguiente tick salen Duende y Guerrero de la 2
  // mientras siguen vivos los Enjambres de la 1.
  engine.tick(0.01);

  const waves = new Set(engine.enemies.map((enemy) => enemy.waveNumber));
  assert.ok(waves.has(1), 'quedan enemigos de la oleada 1');
  assert.ok(waves.has(2), 'salen enemigos de la oleada 2');
});

test('CA-17 cada oleada solapada paga su recompensa de fin al quedar terminada', () => {
  const engine = new GameEngine();
  engine.startNextWave(); // oleada 1
  engine.tick(0.1); // sale 1 Enjambre: quedan 9 pendientes

  engine.callNextWave(); // oleada 2: bonus floor(9 × 2) + 15 = 33
  const goldAfterBonus = 220 + 33;
  assert.equal(engine.gold, goldAfterBonus);

  // Salen todos los enemigos de ambas oleadas.
  engine.waveManager.update(1000, (spawn) => engine.spawnEnemy(spawn));

  // Al morir solo los de la oleada 1, se paga su recompensa (40) sin cerrar la 2.
  const wave1 = engine.enemies.filter((enemy) => enemy.waveNumber === 1);
  for (const enemy of wave1) enemy.takeDamage(1e9, 'MAGIC');
  engine.tick(0.01);

  // 10 Enjambres × 2 de oro + 40 de fin de oleada 1.
  assert.equal(engine.gold, goldAfterBonus + 20 + 40);
  assert.equal(engine.waveManager.completedWaves, 1);
  assert.equal(engine.waveManager.isWaveActive, true);

  // Al morir los de la oleada 2, se paga su recompensa (45) y termina la partida activa.
  const wave2 = engine.enemies.filter((enemy) => enemy.waveNumber === 2);
  for (const enemy of wave2) enemy.takeDamage(1e9, 'MAGIC');
  engine.tick(0.01);

  // 8 Duendes × 4 + 4 Guerreros × 10 = 72 de enemigos + 45 de fin de oleada 2.
  assert.equal(engine.gold, goldAfterBonus + 20 + 40 + 72 + 45);
  assert.equal(engine.waveManager.completedWaves, 2);
  assert.equal(engine.waveManager.isWaveActive, false);
});

test('CA-17 sin oleada activa callNextWave arranca la siguiente sin bono', () => {
  const engine = new GameEngine();

  const definition = engine.callNextWave();

  assert.ok(definition);
  assert.equal(definition.wave, 1);
  assert.equal(engine.currentWave, 1);
  assert.equal(engine.gold, 220);
  assert.equal(engine.state, 'PLAYING');
});

test('CA-17 no se puede llamar a una oleada después de la 10', () => {
  const engine = new GameEngine();
  engine.waveManager.currentWaveIndex = 10;
  engine.waveManager.isWaveActive = false;

  assert.equal(engine.callNextWave(), false);
});
