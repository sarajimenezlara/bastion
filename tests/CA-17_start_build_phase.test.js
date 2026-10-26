// CA-17: la partida empieza en fase de construcción (oleada 0, sin enemigos) y
// la oleada 1 solo sale al pulsar «Siguiente oleada», sin bonus porque no hay
// ninguna oleada activa (entrevista del GDD: activación manual de oleadas).

const test = require('node:test');
const assert = require('node:assert/strict');

const GameEngine = require('../src/core/GameEngine.js');
const UIController = require('../src/presentation/UIController.js');

test('CA-17 empezar la partida deja el motor en oleada 0 y sin enemigos', () => {
  const engine = new GameEngine();

  assert.equal(engine.state, 'MENU');
  assert.equal(engine.startGame(), true);

  assert.equal(engine.state, 'PLAYING');
  assert.equal(engine.currentWave, 0);
  assert.equal(engine.enemies.length, 0);
  assert.equal(engine.waveManager.isWaveActive, false);
  assert.equal(engine.waveManager.pendingCount(), 0);
});

test('CA-17 avanzar el tiempo en la fase de construcción no genera enemigos', () => {
  const engine = new GameEngine();
  engine.startGame();

  engine.tick(1);
  engine.tick(1);

  assert.equal(engine.currentWave, 0);
  assert.equal(engine.enemies.length, 0);
  assert.equal(engine.gold, 220);
  assert.equal(engine.lives, 20);
});

test('CA-17 el botón Siguiente oleada lanza la oleada 1 sin bonus', () => {
  const engine = new GameEngine();
  engine.startGame();

  const goldBefore = engine.gold;
  const definition = engine.callNextWave();

  assert.ok(definition, 'debe devolver la definición de la oleada 1');
  assert.equal(engine.currentWave, 1);
  assert.equal(engine.gold, goldBefore, 'sin oleada previa no hay bonus');
  assert.equal(engine.waveManager.isWaveActive, true);
  assert.ok(engine.waveManager.pendingCount() > 0, 'la oleada 1 debe tener spawns en cola');
});

test('CA-17 el controlador empieza en construcción y no lanza oleadas', () => {
  const engine = new GameEngine();
  const ui = new UIController({ engine });

  ui.startGame();

  assert.equal(engine.state, 'PLAYING');
  assert.equal(engine.currentWave, 0);
  assert.equal(engine.enemies.length, 0);
  assert.equal(engine.waveManager.isWaveActive, false);

  ui.callNextWave();

  assert.equal(engine.currentWave, 1);
  assert.equal(engine.waveManager.isWaveActive, true);
});
