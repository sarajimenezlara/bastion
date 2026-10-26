// CA-09: la Escarcha aplica un multiplicador de velocidad de 0.6 durante 2.0 s.
// Un segundo impacto dentro de la ventana reinicia el contador sin acumular.
// El daño mágico de la Escarcha ignora la armadura.

const test = require('node:test');
const assert = require('node:assert/strict');

const GameEngine = require('../src/core/GameEngine.js');
const Enemy = require('../src/core/Enemy.js');
const Projectile = require('../src/core/Projectile.js');
const Vector2D = require('../src/core/Vector2D.js');

// Tramo recto de 1000 px para medir el movimiento con y sin ralentización.
const STRAIGHT_PATH = [
  { x: 0, y: 0 },
  { x: 1000, y: 0 },
];

function makeEnemy(x, y, health = 100, armor = 10) {
  const enemy = new Enemy(null, 'Guerrero', health, 60, armor, 8);
  enemy.position = new Vector2D(x, y);
  return enemy;
}

function frostProjectile(startPos, target, damage = 5) {
  return new Projectile(
    null,
    startPos,
    target,
    damage,
    'MAGIC',
    300, // velocidad de la Escarcha nivel 1 (Tabla 1)
    0, // mono-objetivo
    0.6, // factor de ralentización
    2 // duración en segundos
  );
}

test('CA-09 el impacto de Escarcha ralentiza al enemigo un 40% durante 2 s', () => {
  const enemy = makeEnemy(20, 0);
  const projectile = frostProjectile({ x: 0, y: 0 }, enemy);

  const finished = projectile.update(0.1, [enemy]);

  assert.equal(finished, true);
  assert.equal(enemy.isSlowed, true);
  assert.equal(enemy.slowFactor, 0.6);
  assert.equal(enemy.slowTimer, 2);
  // Daño mágico: la armadura de 10 no reduce los 5 puntos.
  assert.equal(enemy.currentHealth, 95);
});

test('CA-09 un segundo impacto reinicia el temporizador a 2 s sin acumular', () => {
  const enemy = makeEnemy(20, 0);
  frostProjectile({ x: 0, y: 0 }, enemy).update(0.1, [enemy]);

  // Transcurren 1.2 s: queda 0.8 s de ralentización y el factor sigue siendo 0.6.
  enemy.update(1.2, STRAIGHT_PATH);
  assert.ok(Math.abs(enemy.slowTimer - 0.8) < 1e-9);
  assert.equal(enemy.slowFactor, 0.6);

  // Nuevo impacto: el contador vuelve a 2 s y la intensidad no se acumula.
  frostProjectile({ x: enemy.position.x, y: enemy.position.y }, enemy).update(0.01, [enemy]);
  assert.equal(enemy.slowTimer, 2);
  assert.equal(enemy.slowFactor, 0.6);
  assert.equal(enemy.isSlowed, true);
});

test('CA-09 la velocidad se reduce al 60% mientras dura el efecto', () => {
  const enemy = makeEnemy(0, 0);
  enemy.applySlow(0.6, 2);

  enemy.update(1, STRAIGHT_PATH); // 60 px/s × 0.6 × 1 s = 36 px
  assert.ok(Math.abs(enemy.distanceTraveled - 36) < 1e-9);

  enemy.update(1, STRAIGHT_PATH); // el efecto expira al inicio del tick: 60 px
  assert.ok(Math.abs(enemy.distanceTraveled - 96) < 1e-9);
  assert.equal(enemy.isSlowed, false);
  assert.equal(enemy.slowFactor, 1);
});

test('CA-09 la torre Escarcha ralentiza al enemigo a través del motor', () => {
  const engine = new GameEngine();
  const tower = engine.placeTower('Escarcha', 5, 3); // centro (220, 140)
  assert.ok(tower);

  const enemy = makeEnemy(260, 140, 100, 0);
  engine.enemies.push(enemy);

  // Un tick: la torre dispara, el proyectil impacta y aplica la ralentización.
  engine.tick(0.2);

  assert.equal(enemy.isSlowed, true);
  assert.equal(enemy.slowFactor, 0.6);
  assert.equal(enemy.slowTimer, 2);
  assert.equal(enemy.currentHealth, 95); // 5 de daño mágico
  assert.equal(engine.projectiles.length, 0); // el proyectil impactado desaparece
});
