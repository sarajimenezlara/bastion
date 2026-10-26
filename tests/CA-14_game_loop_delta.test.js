// CA-14: el delta que recibe el motor se limita a 0,1 s para que cambiar de
// pestaña no provoque saltos (docs/decisiones/fase-5.md, decisión 2).

const test = require('node:test');
const assert = require('node:assert/strict');

const GameLoop = require('../src/presentation/GameLoop.js');

test('CA-14 el primer frame no aplica tiempo', () => {
  const deltas = [];
  const loop = new GameLoop({ update: (delta) => deltas.push(delta) });

  const delta = loop.frame(5000);

  assert.equal(delta, 0);
  assert.deepEqual(deltas, [0]);
});

test('CA-14 un salto de 5 s se recorta al máximo de 0,1 s', () => {
  const deltas = [];
  const loop = new GameLoop({ update: (delta) => deltas.push(delta) });

  loop.frame(0);
  const afterJump = loop.frame(5000);

  assert.equal(afterJump, 0.1);
  assert.deepEqual(deltas, [0, 0.1]);
});

test('CA-14 un frame normal conserva su delta real', () => {
  const deltas = [];
  const loop = new GameLoop({ update: (delta) => deltas.push(delta), maxDelta: 0.1 });

  loop.frame(1000);
  const delta = loop.frame(1016);

  assert.ok(Math.abs(delta - 0.016) < 1e-9);
  assert.deepEqual(deltas, [0, 0.016]);
});

test('CA-14 un delta negativo o no numérico se trata como 0', () => {
  const deltas = [];
  const loop = new GameLoop({ update: (delta) => deltas.push(delta) });

  loop.frame(1000);
  loop.frame(900);
  loop.frame(Number.NaN);

  assert.deepEqual(deltas, [0, 0, 0]);
});

test('CA-14 el tope por defecto es 0,1 s', () => {
  assert.equal(GameLoop.MAX_DELTA, 0.1);

  let applied = null;
  const loop = new GameLoop({ update: (delta) => (applied = delta) });
  loop.frame(0);
  loop.frame(10000);

  assert.equal(applied, 0.1);
});

test('CA-14 start y stop controlan el ciclo de frames sin duplicarlo', () => {
  const callbacks = [];
  const cancelled = [];
  let updates = 0;

  const loop = new GameLoop({
    update: () => {
      updates += 1;
    },
    render: () => {},
    requestFrame: (callback) => {
      callbacks.push(callback);
      return callbacks.length;
    },
    cancelFrame: (handle) => cancelled.push(handle),
  });

  loop.start();
  loop.start();
  assert.equal(loop.isRunning, true);
  assert.equal(callbacks.length, 1, 'start dos veces no debe duplicar frames');

  callbacks[0](1000);
  assert.equal(updates, 1);
  assert.equal(callbacks.length, 2);

  loop.stop();
  assert.equal(loop.isRunning, false);
  assert.ok(cancelled.length >= 1, 'stop debe cancelar el frame pendiente');

  callbacks[0](2000); // un frame tardío no debe reprogramar nada
  assert.equal(callbacks.length, 2);
});
