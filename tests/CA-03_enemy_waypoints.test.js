// CA-03: la navegación detecta el waypoint cuando la distancia euclídea es <= 2 px.

const test = require('node:test');
const assert = require('node:assert/strict');

const Enemy = require('../src/core/Enemy.js');
const GameMap = require('../src/core/GameMap.js');

const PATH = [
  { x: 100, y: 100 },
  { x: 300, y: 100 },
  { x: 300, y: 300 },
];

function createEnemy(x, y, speed = 60) {
  const enemy = new Enemy(1, 'Duende', 50, speed, 0, 4);
  enemy.position.x = x;
  enemy.position.y = y;
  return enemy;
}

test('CA-03 avanza de waypoint exactamente a 2 px de distancia', () => {
  const enemy = createEnemy(98, 100); // 2 px del primer waypoint

  enemy.update(1 / 60, PATH);

  assert.equal(enemy.currentWaypointIndex, 1);
});

test('CA-03 avanza de waypoint a menos de 2 px', () => {
  const enemy = createEnemy(100, 98); // distancia 2 px en vertical
  enemy.position.x = 99;
  enemy.position.y = 99.5; // ~1.118 px del waypoint

  enemy.update(1 / 60, PATH);

  assert.equal(enemy.currentWaypointIndex, 1);
});

test('CA-03 no avanza de waypoint a más de 2 px', () => {
  const enemy = createEnemy(100, 97.5); // 2.5 px, fuera de tolerancia

  enemy.update(0.001, PATH);

  assert.equal(enemy.currentWaypointIndex, 0);
  assert.ok(Math.hypot(100 - enemy.position.x, 100 - enemy.position.y) > 2);
});

test('CA-03 consume la distancia sobrante y no se queda clavado en el waypoint', () => {
  const enemy = createEnemy(97, 100, 100); // 3 px antes del waypoint, 100 px/s

  enemy.update(0.05, PATH); // 5 px de recorrido: 3 px hasta el waypoint + 2 px al siguiente

  assert.equal(enemy.currentWaypointIndex, 1);
  assert.ok(Math.abs(enemy.position.x - 102) < 1e-9);
  assert.ok(Math.abs(enemy.position.y - 100) < 1e-9);
  assert.ok(Math.abs(enemy.distanceTraveled - 5) < 1e-9);
});

test('CA-03 al superar el último waypoint marca hasReachedEnd', () => {
  const enemy = createEnemy(300, 298, 100); // 2 px del último waypoint
  enemy.currentWaypointIndex = 2;

  enemy.update(0.01, PATH);

  assert.equal(enemy.currentWaypointIndex, PATH.length);
  assert.equal(enemy.hasReachedEnd, true);
});

test('CA-03 navega los waypoints en píxeles generados por GameMap', () => {
  const map = new GameMap();
  const waypoints = map.getWaypointsInPixels();
  const first = waypoints[0];

  const enemy = createEnemy(first.x - 1.5, first.y);
  enemy.update(0.01, waypoints);

  assert.equal(waypoints.length, 8);
  assert.equal(enemy.currentWaypointIndex, 1);
});
