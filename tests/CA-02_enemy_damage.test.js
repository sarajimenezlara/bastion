// CA-02: takeDamage aplica max(1, Daño - Armadura) en físico y omite la armadura en mágico.

const test = require('node:test');
const assert = require('node:assert/strict');

const Enemy = require('../src/core/Enemy.js');

function createEnemy(armor = 5, health = 120) {
  return new Enemy(1, 'Guerrero', health, 50, armor, 8);
}

test('CA-02 el daño físico resta la armadura al daño base', () => {
  const enemy = createEnemy(5, 120);

  const applied = enemy.takeDamage(30, 'PHYSICAL');

  assert.equal(applied, 25);
  assert.equal(enemy.currentHealth, 95);
  assert.equal(enemy.isDead, false);
});

test('CA-02 el daño físico nunca baja de 1 aunque la armadura supere el daño', () => {
  const enemy = createEnemy(25, 120);

  const applied = enemy.takeDamage(10, 'PHYSICAL');

  assert.equal(applied, 1);
  assert.equal(enemy.currentHealth, 119);
});

test('CA-02 el daño mágico ignora la armadura', () => {
  const enemy = createEnemy(25, 120);

  const applied = enemy.takeDamage(30, 'MAGIC');

  assert.equal(applied, 30);
  assert.equal(enemy.currentHealth, 90);
});

test('CA-02 la vida no baja de 0 y el enemigo queda marcado como muerto', () => {
  const enemy = createEnemy(5, 50);

  enemy.takeDamage(1000, 'MAGIC');

  assert.equal(enemy.currentHealth, 0);
  assert.equal(enemy.isDead, true);
  assert.equal(enemy.takeDamage(10, 'PHYSICAL'), 0);
  assert.equal(enemy.currentHealth, 0);
});
