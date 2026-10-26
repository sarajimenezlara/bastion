// CA-08: las torres seleccionan al enemigo dentro de su rango
// con el valor `distanceTraveled` más alto.

const test = require('node:test');
const assert = require('node:assert/strict');

const Tower = require('../src/core/Tower.js');
const Enemy = require('../src/core/Enemy.js');
const Vector2D = require('../src/core/Vector2D.js');

function enemyAt(x, y, distanceTraveled, extra = {}) {
  const enemy = new Enemy(null, 'Enjambre', 100, 60, 0, 2);
  enemy.position = new Vector2D(x, y);
  enemy.distanceTraveled = distanceTraveled;
  Object.assign(enemy, extra);
  return enemy;
}

test('CA-08 elige al enemigo más avanzado dentro del rango', () => {
  const tower = new Tower(null, 'Ballesta', 5, 5); // centro (220, 220), rango 120

  const cercaPeroAtrasado = enemyAt(230, 220, 50);
  const dentroYAvanzado = enemyAt(300, 220, 120);
  const fueraDeRango = enemyAt(400, 220, 999);

  const target = tower.findTarget([cercaPeroAtrasado, dentroYAvanzado, fueraDeRango]);

  assert.equal(target, dentroYAvanzado);
  assert.equal(target.distanceTraveled, 120);
});

test('CA-08 ignora enemigos muertos y los que ya llegaron a la meta', () => {
  const tower = new Tower(null, 'Ballesta', 5, 5);

  const muerto = enemyAt(230, 220, 500, { isDead: true });
  const enMeta = enemyAt(235, 220, 400, { hasReachedEnd: true });
  const valido = enemyAt(240, 220, 100);

  assert.equal(tower.findTarget([muerto, enMeta, valido]), valido);
});

test('CA-08 sin objetivos válidos devuelve null', () => {
  const tower = new Tower(null, 'Ballesta', 5, 5);

  assert.equal(tower.findTarget([]), null);
  assert.equal(tower.findTarget(), null);
  assert.equal(tower.findTarget([enemyAt(400, 220, 500)]), null); // fuera de rango
});

test('CA-08 la torre dispara al objetivo elegido mediante el callback', () => {
  const tower = new Tower(null, 'Ballesta', 5, 5);
  const atrasado = enemyAt(230, 220, 10);
  const avanzado = enemyAt(300, 220, 200);

  const fired = [];
  tower.update(0.016, [atrasado, avanzado], (source, target) => {
    fired.push({ source, target });
    return { id: fired.length };
  });

  assert.equal(fired.length, 1);
  assert.equal(fired[0].source, tower);
  assert.equal(fired[0].target, avanzado);
  assert.ok(tower.cooldownTimer > 0);
});

test('CA-08 la torre respeta la cadencia entre disparos', () => {
  const tower = new Tower(null, 'Ballesta', 5, 5); // 1.5 disparos/s -> 0.666… s
  const enemy = enemyAt(300, 220, 100);

  let shots = 0;
  const callback = () => {
    shots += 1;
    return { id: shots };
  };

  tower.update(0.016, [enemy], callback);
  assert.equal(shots, 1);

  // Aún en cooldown: no dispara.
  tower.update(0.1, [enemy], callback);
  assert.equal(shots, 1);

  // Pasado el periodo completo vuelve a disparar.
  tower.update(0.6, [enemy], callback);
  assert.equal(shots, 2);
});
