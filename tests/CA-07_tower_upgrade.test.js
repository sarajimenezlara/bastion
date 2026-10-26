// CA-07: la mejora de nivel deduce el coste exacto de la Tabla 1
// (CosteBase × NivelDestino) e incrementa daño, rango y cadencia.

const test = require('node:test');
const assert = require('node:assert/strict');

const GameEngine = require('../src/core/GameEngine.js');
const Tower = require('../src/core/Tower.js');

// Tabla 1 del GDD: coste de mejora = coste base × nivel destino.
const TABLE_1 = {
  Ballesta: {
    baseCost: 50,
    levels: [
      { level: 1, range: 120, damage: 12, fireRate: 1.5, projectileSpeed: 400 },
      { level: 2, range: 135, damage: 22, fireRate: 1.8, projectileSpeed: 450 },
      { level: 3, range: 150, damage: 38, fireRate: 2.2, projectileSpeed: 500 },
    ],
  },
  Canon: {
    baseCost: 100,
    levels: [
      { level: 1, range: 100, damage: 30, fireRate: 0.5, projectileSpeed: 250 },
      { level: 2, range: 115, damage: 60, fireRate: 0.6, projectileSpeed: 280 },
      { level: 3, range: 130, damage: 105, fireRate: 0.7, projectileSpeed: 320 },
    ],
  },
  Escarcha: {
    baseCost: 80,
    levels: [
      { level: 1, range: 90, damage: 5, fireRate: 0.8, projectileSpeed: 300 },
      { level: 2, range: 100, damage: 12, fireRate: 1.0, projectileSpeed: 330 },
      { level: 3, range: 110, damage: 25, fireRate: 1.2, projectileSpeed: 360 },
    ],
  },
  Arcana: {
    baseCost: 150,
    levels: [
      { level: 1, range: 140, damage: 45, fireRate: 0.7, projectileSpeed: 350 },
      { level: 2, range: 155, damage: 90, fireRate: 0.8, projectileSpeed: 400 },
      { level: 3, range: 170, damage: 160, fireRate: 0.9, projectileSpeed: 450 },
    ],
  },
};

test('CA-07 mejorar una Ballesta descuenta 100 de oro e incrementa sus estadísticas', () => {
  const engine = new GameEngine();
  const tower = engine.placeTower('Ballesta', 3, 3);

  assert.equal(engine.gold, 100);

  const paid = engine.upgradeTower(tower.id);

  assert.equal(paid, 100); // CosteBase 50 × nivel destino 2
  assert.equal(engine.gold, 0); // 150 - 50 (compra) - 100 (mejora)
  assert.equal(tower.level, 2);
  assert.equal(tower.damage, 22);
  assert.equal(tower.range, 135);
  assert.equal(tower.fireRate, 1.8);
  assert.equal(tower.projectileSpeed, 450);
  assert.equal(tower.totalInvested, 150);
  assert.equal(tower.getRefundValue(), 105);
});

test('CA-07 cada tipo de torre paga CosteBase × NivelDestino y aplica la Tabla 1', () => {
  for (const [type, entry] of Object.entries(TABLE_1)) {
    const engine = new GameEngine();
    engine.gold = 100000;
    const tower = engine.placeTower(type, 10, 10);
    assert.ok(tower, `${type} debería construirse`);

    let invested = entry.baseCost;

    for (const expected of entry.levels.slice(1)) {
      const cost = entry.baseCost * expected.level;
      const goldBefore = engine.gold;

      assert.equal(Tower.getUpgradeCost(type, expected.level), cost);
      assert.equal(engine.upgradeTower(tower.id), cost, `${type} nivel ${expected.level}`);
      assert.equal(engine.gold, goldBefore - cost);

      invested += cost;
      assert.equal(tower.level, expected.level);
      assert.equal(tower.range, expected.range);
      assert.equal(tower.damage, expected.damage);
      assert.equal(tower.fireRate, expected.fireRate);
      assert.equal(tower.projectileSpeed, expected.projectileSpeed);
      assert.equal(tower.totalInvested, invested);
    }

    // El catálogo del GDD coincide con la fórmula del criterio.
    for (const expected of entry.levels.slice(1)) {
      assert.equal(
        Tower.getConfig(type, expected.level).upgradeCost,
        entry.baseCost * expected.level
      );
    }
  }
});

test('CA-07 sin oro suficiente la mejora devuelve false y no altera la torre', () => {
  const engine = new GameEngine();
  const tower = engine.placeTower('Ballesta', 4, 4);
  engine.gold = 50;

  assert.equal(engine.upgradeTower(tower.id), false);
  assert.equal(engine.gold, 50);
  assert.equal(tower.level, 1);
  assert.equal(tower.damage, 12);
  assert.equal(tower.range, 120);
  assert.equal(tower.totalInvested, 50);
});

test('CA-07 no se puede superar el nivel máximo', () => {
  const engine = new GameEngine();
  engine.gold = 100000;
  const tower = engine.placeTower('Ballesta', 6, 6);

  assert.equal(engine.upgradeTower(tower.id), 100);
  assert.equal(engine.upgradeTower(tower.id), 150);

  const goldAtMax = engine.gold;
  assert.equal(tower.level, 3);
  assert.equal(tower.getUpgradeCost(), null);
  assert.equal(engine.upgradeTower(tower.id), false);
  assert.equal(engine.gold, goldAtMax);
  assert.equal(tower.totalInvested, 300);
});

test('CA-07 mejorar una torre inexistente devuelve false', () => {
  const engine = new GameEngine();

  assert.equal(engine.upgradeTower(9999), false);
  assert.equal(engine.gold, 150);
  assert.equal(engine.towers.length, 0);
});
