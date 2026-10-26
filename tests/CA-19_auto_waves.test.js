// CA-19: oleadas automáticas. Con «Auto» activado, al terminar una oleada
// empieza una cuenta atrás de 5 s y después se lanza sola la siguiente. La
// primera oleada sigue siendo manual, el lanzamiento automático no paga bonus,
// la pausa congela la cuenta atrás, 2x la acelera y desactivar «Auto» la cancela.

const test = require('node:test');
const assert = require('node:assert/strict');

const GameEngine = require('../src/core/GameEngine.js');
const UIController = require('../src/presentation/UIController.js');

// Fuerza la salida de todos los enemigos de la oleada activa.
function drainSpawns(engine) {
  return engine.waveManager.update(1000, (spawn) => engine.spawnEnemy(spawn));
}

function killAll(enemies) {
  for (const enemy of enemies) {
    enemy.takeDamage(1e9, 'MAGIC');
  }
}

// Termina la oleada activa: salen todos sus enemigos, mueren y el motor cierra
// la oleada en el tick. Deja la partida lista para la cuenta atrás automática.
function finishCurrentWave(engine) {
  drainSpawns(engine);
  killAll(engine.enemies);
  engine.tick(0.01);
}

// Elemento DOM mínimo para comprobar los textos y aria-pressed de la interfaz.
function fakeElement() {
  return {
    textContent: '',
    disabled: false,
    attributes: {},
    getAttribute(name) {
      return this.attributes[name] || null;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
  };
}

test('CA-19 con Auto la siguiente oleada empieza 5 s después de terminar la anterior', () => {
  const engine = new GameEngine();

  engine.startGame();
  engine.setAutoWaves(true);

  // La primera oleada sigue siendo manual: Auto no adelanta nada en la oleada 0.
  engine.tick(10);
  assert.equal(engine.currentWave, 0);
  assert.equal(engine.waveManager.isWaveActive, false);

  engine.startNextWave();
  finishCurrentWave(engine);

  assert.equal(engine.currentWave, 1);
  assert.equal(engine.waveManager.isWaveActive, false);
  assert.equal(engine.autoWaveTimer, GameEngine.AUTO_WAVE_DELAY);

  engine.tick(4.99);
  assert.equal(engine.currentWave, 1, 'aún no han pasado los 5 s');

  engine.tick(0.01);
  assert.equal(engine.currentWave, 2, 'la oleada 2 debe empezar sola a los 5 s');
  assert.equal(engine.waveManager.isWaveActive, true);
});

test('CA-19 sin Auto la siguiente oleada no empieza sola', () => {
  const engine = new GameEngine();

  engine.startNextWave();
  finishCurrentWave(engine);

  assert.equal(engine.autoWaves, false);
  assert.equal(engine.autoWaveTimer, 0);

  engine.tick(10);

  assert.equal(engine.currentWave, 1);
  assert.equal(engine.waveManager.isWaveActive, false);
  assert.equal(engine.enemies.length, 0);
});

test('CA-19 la pausa congela la cuenta atrás', () => {
  const engine = new GameEngine();
  engine.setAutoWaves(true);
  engine.startNextWave();
  finishCurrentWave(engine);

  engine.tick(2);
  const remaining = engine.autoWaveTimer;
  assert.ok(remaining > 2.9 && remaining < 3.1, 'quedan unos 3 s');

  engine.isPaused = true;
  engine.tick(100);
  assert.equal(engine.autoWaveTimer, remaining, 'la pausa no consume la cuenta atrás');
  assert.equal(engine.currentWave, 1);

  engine.isPaused = false;
  engine.tick(remaining);
  assert.equal(engine.currentWave, 2);
});

test('CA-19 la velocidad 2x acelera la cuenta atrás', () => {
  const engine = new GameEngine();
  engine.setAutoWaves(true);
  engine.startNextWave();
  finishCurrentWave(engine);

  engine.gameSpeed = 2;
  engine.tick(2.5); // 2,5 s reales × 2 = 5 s de juego

  assert.equal(engine.currentWave, 2);
});

test('CA-19 desactivar Auto cancela la cuenta atrás', () => {
  const engine = new GameEngine();
  engine.setAutoWaves(true);
  engine.startNextWave();
  finishCurrentWave(engine);

  engine.tick(2);
  assert.ok(engine.autoWaveTimer > 0);

  engine.setAutoWaves(false);
  assert.equal(engine.autoWaveTimer, 0);

  engine.tick(10);
  assert.equal(engine.currentWave, 1, 'sin Auto no debe lanzarse la oleada 2');
  assert.equal(engine.waveManager.isWaveActive, false);

  // Volver a activarlo retoma la espera desde el principio.
  engine.setAutoWaves(true);
  assert.equal(engine.autoWaveTimer, GameEngine.AUTO_WAVE_DELAY);
});

test('CA-19 la oleada automática no da bonus de llamada anticipada', () => {
  const engine = new GameEngine();
  engine.setAutoWaves(true);
  engine.startNextWave();
  finishCurrentWave(engine);

  const goldBefore = engine.gold;
  const earnedBefore = engine.totalGoldEarned;

  engine.tick(5);

  assert.equal(engine.currentWave, 2);
  assert.equal(engine.gold, goldBefore, 'no hay bonus por lanzar la oleada automática');
  assert.equal(engine.totalGoldEarned, earnedBefore);
});

test('CA-19 pulsar Siguiente oleada adelanta la cuenta atrás', () => {
  const engine = new GameEngine();
  engine.setAutoWaves(true);
  engine.startNextWave();
  finishCurrentWave(engine);

  engine.tick(1);
  assert.equal(engine.currentWave, 1);

  assert.ok(engine.callNextWave());
  assert.equal(engine.currentWave, 2);
  assert.equal(engine.autoWaveTimer, 0);
});

test('CA-19 tras la oleada 10 no se lanza ninguna oleada más', () => {
  const engine = new GameEngine();
  engine.waveManager.currentWaveIndex = 9; // oleada 10
  engine.startNextWave();
  engine.setAutoWaves(true);

  finishCurrentWave(engine);

  assert.equal(engine.waveManager.completedWaves, 10);
  assert.equal(engine.state, 'VICTORY');
  assert.equal(engine.autoWaveTimer, 0);

  engine.tick(10);

  assert.equal(engine.currentWave, 10);
  assert.equal(engine.waveManager.isWaveActive, false);
  assert.equal(engine.state, 'VICTORY');
});

test('CA-19 la interfaz muestra el estado de Auto y la cuenta atrás', () => {
  const engine = new GameEngine();
  const ui = new UIController({ engine });

  ui.refs = {
    lives: fakeElement(),
    gold: fakeElement(),
    wave: fakeElement(),
    enemies: fakeElement(),
    pause: fakeElement(),
    speed: fakeElement(),
    autoWave: fakeElement(),
    nextWave: fakeElement(),
    cards: [],
  };

  engine.startGame();
  engine.startNextWave();
  engine.autoWaves = true;
  engine.autoWaveTimer = 3;
  ui.updateControls();

  assert.equal(ui.refs.autoWave.getAttribute('aria-pressed'), 'true');
  assert.equal(ui.refs.nextWave.textContent, 'Siguiente oleada en 3 s');

  ui.toggleAutoWaves();
  ui.updateControls();

  assert.equal(engine.autoWaves, false);
  assert.equal(engine.autoWaveTimer, 0);
  assert.equal(ui.refs.autoWave.getAttribute('aria-pressed'), 'false');
});
