// CA-10: los proyectiles avanzan a la velocidad de la Tabla 1 e impactan
// cuando la distancia euclídea al objetivo es <= 8 px, aplicando el daño.
// Se cubren también el daño físico/mágico y el área del Cañón.

const test = require('node:test');
const assert = require('node:assert/strict');

const GameEngine = require('../src/core/GameEngine.js');
const Enemy = require('../src/core/Enemy.js');
const Projectile = require('../src/core/Projectile.js');
const Tower = require('../src/core/Tower.js');
const Vector2D = require('../src/core/Vector2D.js');

function makeEnemy(x, y, health = 100, armor = 0, type = 'Guerrero') {
  const enemy = new Enemy(null, type, health, 60, armor, 8);
  enemy.position = new Vector2D(x, y);
  return enemy;
}

function ballestaProjectile(startPos, target, damage = 12) {
  return new Projectile(null, startPos, target, damage, 'PHYSICAL', 400, 0, 0, 0);
}

test('CA-10 el proyectil avanza a la velocidad indicada en píxeles por segundo', () => {
  const enemy = makeEnemy(200, 0);
  const projectile = new Projectile(null, { x: 0, y: 0 }, enemy, 12, 'PHYSICAL', 400, 0, 0, 0);

  assert.equal(projectile.update(0.1, [enemy]), false);
  assert.ok(Math.abs(projectile.position.x - 40) < 1e-9);

  assert.equal(projectile.update(0.2, [enemy]), false);
  assert.ok(Math.abs(projectile.position.x - 120) < 1e-9);
});

test('CA-10 cada tipo de torre genera proyectiles con la velocidad de la Tabla 1', () => {
  const expected = {
    Ballesta: 400,
    Canon: 250,
    Escarcha: 300,
    Arcana: 350,
  };

  for (const [type, speed] of Object.entries(expected)) {
    const engine = new GameEngine();
    const tower = engine.placeTower(type, 10, 10);
    const enemy = makeEnemy(500, 420);

    const projectile = engine.createProjectile(tower, enemy);

    assert.equal(projectile.speed, speed, type);
    assert.equal(projectile.position.x, tower.position.x);
    assert.equal(projectile.position.y, tower.position.y);
    assert.equal(engine.projectiles.length, 1);
  }
});

test('CA-10 impacta a 8 px y aplica el daño físico con mitigación de armadura', () => {
  const enemy = makeEnemy(8, 0, 100, 5);
  const projectile = ballestaProjectile({ x: 0, y: 0 }, enemy);

  const finished = projectile.update(0.001, [enemy]);

  assert.equal(finished, true);
  assert.equal(projectile.isHit, true);
  assert.equal(projectile.position.x, 8);
  assert.equal(enemy.currentHealth, 93); // 12 - 5 de armadura
});

test('CA-10 no impacta si la distancia es mayor que 8 px', () => {
  const enemy = makeEnemy(8.5, 0, 100, 0);
  const projectile = new Projectile(null, { x: 0, y: 0 }, enemy, 12, 'PHYSICAL', 10, 0, 0, 0);

  assert.equal(projectile.update(0.01, [enemy]), false);
  assert.equal(projectile.isHit, false);
  assert.equal(enemy.currentHealth, 100);
});

test('CA-10 un delta grande no atraviesa al objetivo: el paso se limita a la distancia', () => {
  const enemy = makeEnemy(100, 0);
  const projectile = new Projectile(null, { x: 0, y: 0 }, enemy, 12, 'PHYSICAL', 4000, 0, 0, 0);

  const finished = projectile.update(1, [enemy]);

  assert.equal(finished, true);
  assert.equal(projectile.position.x, 100);
  assert.equal(enemy.currentHealth, 88);
});

test('CA-10 el daño mágico ignora la armadura', () => {
  const enemy = makeEnemy(8, 0, 100, 25);
  const projectile = new Projectile(null, { x: 0, y: 0 }, enemy, 45, 'MAGIC', 350, 0, 0, 0);

  projectile.update(0.001, [enemy]);

  assert.equal(enemy.currentHealth, 55); // 45 íntegros
});

test('CA-10 el Cañón aplica daño en área a todos los enemigos dentro del radio', () => {
  const target = makeEnemy(20, 0, 100, 0);
  const dentro = makeEnemy(60, 0, 100, 0); // 40 px del centro del impacto
  const fuera = makeEnemy(110, 0, 100, 0); // 90 px, fuera del radio de 50
  const enemies = [target, dentro, fuera];

  const cannon = new Projectile(null, { x: 0, y: 0 }, target, 30, 'PHYSICAL', 250, 50, 0, 0);
  const finished = cannon.update(0.1, enemies);

  assert.equal(finished, true);
  assert.equal(target.currentHealth, 70);
  assert.equal(dentro.currentHealth, 70);
  assert.equal(fuera.currentHealth, 100);
});

test('CA-10 si el objetivo muere antes del impacto, el proyectil normal se descarta sin daño', () => {
  const target = makeEnemy(200, 0);
  const otro = makeEnemy(60, 0);
  const projectile = ballestaProjectile({ x: 0, y: 0 }, target);

  assert.equal(projectile.update(0.1, [target, otro]), false); // vuela hasta x=40
  target.takeDamage(9999, 'MAGIC');

  const finished = projectile.update(0.1, [target, otro]);

  assert.equal(finished, true);
  assert.equal(projectile.isExpired, true);
  assert.equal(projectile.isHit, false);
  assert.equal(otro.currentHealth, 100);
});

test('CA-10 el Cañón sigue hasta la última posición conocida y aplica el área', () => {
  const target = makeEnemy(200, 0);
  const cercano = makeEnemy(200, 40); // a 40 px de la última posición conocida
  const enemies = [target, cercano];

  const cannon = new Projectile(null, { x: 0, y: 0 }, target, 30, 'PHYSICAL', 250, 50, 0, 0);
  assert.equal(cannon.update(0.1, enemies), false); // registra (200, 0) y avanza a x=25

  target.takeDamage(9999, 'MAGIC');

  const finished = cannon.update(1, enemies);

  assert.equal(finished, true);
  assert.equal(cannon.isHit, true);
  assert.equal(cannon.position.x, 200);
  assert.equal(cannon.position.y, 0);
  assert.equal(cercano.currentHealth, 70);
});

test('CA-10 el motor elimina el proyectil tras impactar y aplica el daño a la torre', () => {
  const engine = new GameEngine();
  const tower = engine.placeTower('Ballesta', 5, 3); // centro (220, 140)
  const enemy = makeEnemy(260, 140, 25, 0, 'Enjambre');
  engine.enemies.push(enemy);

  engine.tick(0.1);

  assert.equal(engine.projectiles.length, 0);
  assert.equal(enemy.currentHealth, 7); // 25 - 18 de la Ballesta
  assert.ok(tower.cooldownTimer > 0);
});
