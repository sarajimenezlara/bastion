// CA-11: la salud de los enemigos generados en la oleada N es exactamente
// Math.floor(VidaBase × 1.12^(N-1)), con los valores base de la Tabla 2.
// Se cubre la fórmula, el catálogo completo y el spawn real a través del GameEngine.

const test = require('node:test');
const assert = require('node:assert/strict');

const GameEngine = require('../src/core/GameEngine.js');
const WaveManager = require('../src/core/WaveManager.js');

// Valores esperados calculados a mano con la fórmula del GDD (§3.4).
const EXPECTED = {
  Enjambre: { 1: 25, 2: 28, 3: 31, 5: 39, 7: 49, 9: 61, 10: 69 },
  Duende: { 1: 50, 2: 56, 3: 62, 5: 78, 7: 98, 9: 123, 10: 138 },
  Guerrero: { 1: 120, 2: 134, 3: 150, 5: 188, 7: 236, 9: 297, 10: 332 },
  Tanque: { 1: 350, 2: 392, 3: 439, 5: 550, 7: 690, 9: 866, 10: 970 },
  Golem: { 1: 1200, 2: 1344, 3: 1505, 5: 1888, 7: 2368, 9: 2971, 10: 3327 },
};

test('CA-11 la vida escalada usa Math.floor con la base 1.12 de la oleada N', () => {
  assert.equal(WaveManager.getScaledHealth(25, 1), 25);
  assert.equal(WaveManager.getScaledHealth(25, 2), 28); // 25 × 1.12 = 28.000…4
  assert.equal(WaveManager.getScaledHealth(120, 3), 150); // 150.528 → 150
  assert.equal(WaveManager.getScaledHealth(350, 7), 690); // 690.83… → 690
  assert.equal(WaveManager.getScaledHealth(1200, 10), 3327); // 3327.69… → 3327
});

test('CA-11 el catálogo base de enemigos coincide con la Tabla 2', () => {
  const expectedBase = {
    Enjambre: { baseHealth: 25, speed: 60, armor: 0, reward: 2, goalDamage: 1, isBoss: false },
    Duende: { baseHealth: 50, speed: 85, armor: 0, reward: 4, goalDamage: 1, isBoss: false },
    Guerrero: { baseHealth: 120, speed: 50, armor: 3, reward: 10, goalDamage: 1, isBoss: false },
    Tanque: { baseHealth: 350, speed: 30, armor: 8, reward: 25, goalDamage: 1, isBoss: false },
    Golem: { baseHealth: 1200, speed: 20, armor: 12, reward: 100, goalDamage: 5, isBoss: true },
  };

  for (const [type, config] of Object.entries(expectedBase)) {
    const resolved = WaveManager.getEnemyConfig(type);
    assert.ok(resolved, type);
    for (const [key, value] of Object.entries(config)) {
      assert.equal(resolved[key], value, `${type}.${key}`);
    }
  }
  assert.equal(WaveManager.getEnemyConfig('Inexistente'), null);
});

test('CA-11 la vida escalada de todos los tipos coincide en las oleadas clave', () => {
  const manager = new WaveManager();

  for (const [type, waves] of Object.entries(EXPECTED)) {
    for (const [wave, health] of Object.entries(waves)) {
      assert.equal(manager.getEnemyHealth(type, Number(wave)), health, `${type} oleada ${wave}`);
    }
  }
});

test('CA-11 el GameEngine genera enemigos con la vida escalada de su oleada', () => {
  const engine = new GameEngine();
  engine.startNextWave(); // oleada 1

  engine.tick(0.1);

  assert.equal(engine.enemies.length, 1);
  assert.equal(engine.enemies[0].type, 'Enjambre');
  assert.equal(engine.enemies[0].maxHealth, 25);
  assert.equal(engine.enemies[0].currentHealth, 25);
});

test('CA-11 la oleada 10 genera jefe, guerreros y tanques con vida escalada', () => {
  const engine = new GameEngine();
  engine.waveManager.currentWaveIndex = 9;
  assert.ok(engine.startNextWave());

  engine.tick(0.1);

  // Un enemigo por grupo: el jefe y el primer Guerrero/Tanque salen a la vez.
  assert.deepEqual(
    engine.enemies.map((enemy) => [enemy.type, enemy.maxHealth]),
    [
      ['Golem', 3327],
      ['Guerrero', 332],
      ['Tanque', 970],
    ]
  );
  assert.equal(engine.enemies[0].isBoss, true);
});

test('CA-11 no se generan enemigos sin oleada activa', () => {
  const engine = new GameEngine();

  engine.tick(10);

  assert.equal(engine.enemies.length, 0);
  assert.equal(engine.waveManager.isWaveActive, false);
});
