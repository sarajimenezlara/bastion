// CA-05: construir una Ballesta (50 oro) baja el oro de 150 a 100 y reserva la casilla;
// sin oro suficiente devuelve false.

const test = require('node:test');
const assert = require('node:assert/strict');

const GameEngine = require('../src/core/GameEngine.js');
const Tower = require('../src/core/Tower.js');

test('CA-05 construir una Ballesta deja el oro en 100 y reserva la casilla', () => {
  const engine = new GameEngine();

  const tower = engine.placeTower('Ballesta', 3, 3);

  assert.ok(tower instanceof Tower);
  assert.equal(engine.gold, 100);
  assert.equal(engine.towers.length, 1);
  assert.equal(engine.towers[0], tower);
  assert.equal(tower.type, 'Ballesta');
  assert.equal(tower.col, 3);
  assert.equal(tower.row, 3);
  assert.equal(tower.level, 1);
  assert.equal(tower.baseCost, 50);
  assert.equal(tower.totalInvested, 50);
  assert.equal(engine.map.isCellBuildable(3, 3), false);
  assert.equal(engine.map.isCellOccupied(3, 3), true);
});

test('CA-05 sin oro suficiente devuelve false y no cambia el estado', () => {
  const engine = new GameEngine();
  engine.gold = 49;

  const result = engine.placeTower('Ballesta', 3, 3);

  assert.equal(result, false);
  assert.equal(engine.gold, 49);
  assert.equal(engine.towers.length, 0);
  assert.equal(engine.map.isCellBuildable(3, 3), true);
});

test('CA-05 no se puede construir sobre el camino ni fuera de la rejilla', () => {
  const engine = new GameEngine();

  assert.equal(engine.placeTower('Ballesta', 0, 2), false); // inicio del camino
  assert.equal(engine.placeTower('Ballesta', 10, 5), false); // tramo interior
  assert.equal(engine.placeTower('Ballesta', 19, 11), false); // meta
  assert.equal(engine.placeTower('Ballesta', -1, 0), false);
  assert.equal(engine.placeTower('Ballesta', 20, 0), false);
  assert.equal(engine.placeTower('Ballesta', 0, 12), false);

  assert.equal(engine.gold, 150);
  assert.equal(engine.towers.length, 0);
});

test('CA-05 no se puede construir dos veces en la misma casilla', () => {
  const engine = new GameEngine();

  const first = engine.placeTower('Ballesta', 4, 4);
  const second = engine.placeTower('Ballesta', 4, 4);

  assert.ok(first);
  assert.equal(second, false);
  assert.equal(engine.gold, 100);
  assert.equal(engine.towers.length, 1);
});

test('CA-05 un tipo de torre desconocido devuelve false', () => {
  const engine = new GameEngine();

  assert.equal(engine.placeTower('Catapulta', 3, 3), false);
  assert.equal(engine.gold, 150);
  assert.equal(engine.towers.length, 0);
});

test('CA-05 cada tipo de torre descuenta el coste base de la Tabla 1', () => {
  const cases = [
    { type: 'Ballesta', cost: 50 },
    { type: 'Canon', cost: 100 },
    { type: 'Escarcha', cost: 80 },
    { type: 'Arcana', cost: 150 },
  ];

  for (const { type, cost } of cases) {
    const engine = new GameEngine();
    const tower = engine.placeTower(type, 10, 10);

    assert.ok(tower, `${type} debería construirse`);
    assert.equal(tower.baseCost, cost);
    assert.equal(engine.gold, 150 - cost, `${type} debe costar ${cost}`);
  }
});

test('CA-05 el oro nunca queda negativo al construir', () => {
  const engine = new GameEngine();
  engine.gold = 50;

  engine.placeTower('Arcana', 10, 10);
  assert.equal(engine.gold, 50);
  assert.equal(engine.towers.length, 0);

  engine.placeTower('Ballesta', 10, 10);
  assert.equal(engine.gold, 0);
  assert.equal(engine.towers.length, 1);
});

test('CA-05 el catálogo expone los costes base y las estadísticas de nivel 1', () => {
  assert.equal(Tower.getBaseCost('Ballesta'), 50);
  assert.equal(Tower.getBaseCost('Canon'), 100);
  assert.equal(Tower.getBaseCost('Escarcha'), 80);
  assert.equal(Tower.getBaseCost('Arcana'), 150);
  assert.equal(Tower.getBaseCost('Catapulta'), null);

  const ballesta = Tower.getConfig('Ballesta', 1);
  assert.equal(ballesta.range, 120);
  assert.equal(ballesta.damage, 12);
  assert.equal(ballesta.fireRate, 1.5);
  assert.equal(ballesta.projectileSpeed, 400);
  assert.equal(ballesta.damageType, 'PHYSICAL');
});
