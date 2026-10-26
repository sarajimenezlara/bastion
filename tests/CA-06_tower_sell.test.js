// CA-06: la reventa devuelve el 70% (Math.floor) del total invertido
// (coste base + mejoras) y deja la casilla libre.

const test = require('node:test');
const assert = require('node:assert/strict');

const GameEngine = require('../src/core/GameEngine.js');
const Tower = require('../src/core/Tower.js');

test('CA-06 vender una Ballesta devuelve 35 de oro y libera la casilla', () => {
  const engine = new GameEngine();
  const tower = engine.placeTower('Ballesta', 3, 3);

  const refund = engine.sellTower(tower.id);

  assert.equal(refund, 35); // floor(50 * 0.70)
  assert.equal(engine.gold, 135); // 100 tras comprar + 35
  assert.equal(engine.towers.length, 0);
  assert.equal(engine.map.isCellBuildable(3, 3), true);
  assert.equal(engine.map.isCellOccupied(3, 3), false);
});

test('CA-06 la reventa aplica Math.floor sobre la inversión total', () => {
  const cases = [
    { type: 'Ballesta', base: 50, refund: 35 },
    { type: 'Canon', base: 100, refund: 70 },
    { type: 'Escarcha', base: 80, refund: 56 },
    { type: 'Arcana', base: 150, refund: 105 },
  ];

  for (const { type, base, refund } of cases) {
    const engine = new GameEngine();
    const tower = engine.placeTower(type, 10, 10);

    assert.equal(tower.totalInvested, base);
    assert.equal(engine.sellTower(tower.id), refund);
    assert.equal(engine.gold, 150 - base + refund);
  }
});

test('CA-06 la reventa incluye las mejoras cuando existen', () => {
  // Las mejoras se pagan en la Fase 3 (CA-07); aquí se simula la inversión acumulada.
  const tower = new Tower(null, 'Ballesta', 6, 6);
  tower.totalInvested = 50 + 100; // nivel 2
  assert.equal(tower.getRefundValue(), 105);

  tower.totalInvested = 50 + 100 + 150; // nivel 3
  assert.equal(tower.getRefundValue(), 210);

  tower.totalInvested = 55; // 38.5 -> 38, prueba del redondeo hacia abajo
  assert.equal(tower.getRefundValue(), 38);
});

test('CA-06 el motor devuelve el 70% de la inversión acumulada de la torre', () => {
  const engine = new GameEngine();
  const tower = engine.placeTower('Ballesta', 6, 6);
  tower.totalInvested = 300; // base + mejoras de nivel 2 y 3

  const refund = engine.sellTower(tower.id);

  assert.equal(refund, 210);
  assert.equal(engine.gold, 100 + 210);
});

test('CA-06 vender una torre inexistente devuelve false y no altera el oro', () => {
  const engine = new GameEngine();

  assert.equal(engine.sellTower(12345), false);
  assert.equal(engine.gold, 150);
  assert.equal(engine.towers.length, 0);
});

test('CA-06 no se puede vender dos veces la misma torre', () => {
  const engine = new GameEngine();
  const tower = engine.placeTower('Escarcha', 7, 7);

  assert.equal(engine.sellTower(tower.id), 56);
  assert.equal(engine.sellTower(tower.id), false);
  assert.equal(engine.gold, 150 - 80 + 56);
  assert.equal(engine.towers.length, 0);
});

test('CA-06 tras vender se puede volver a construir en la misma casilla', () => {
  const engine = new GameEngine();
  const tower = engine.placeTower('Ballesta', 12, 7);

  engine.sellTower(tower.id);
  const rebuilt = engine.placeTower('Canon', 12, 7);

  assert.ok(rebuilt);
  assert.equal(engine.towers.length, 1);
  assert.equal(engine.gold, 135 - 100);
  assert.equal(engine.map.isCellOccupied(12, 7), true);
});
