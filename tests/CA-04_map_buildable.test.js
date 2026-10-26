// CA-04: isCellBuildable devuelve false en las casillas del camino y true en el resto.

const test = require('node:test');
const assert = require('node:assert/strict');

const GameMap = require('../src/core/GameMap.js');

test('CA-04 las casillas de los waypoints no son construibles', () => {
  const map = new GameMap();

  for (const waypoint of map.waypoints) {
    assert.equal(
      map.isCellBuildable(waypoint.x, waypoint.y),
      false,
      `la casilla (${waypoint.x},${waypoint.y}) pertenece al camino`,
    );
  }
});

test('CA-04 las casillas intermedias de cada tramo no son construibles', () => {
  const map = new GameMap();

  const pathSamples = [
    [0, 2], [5, 2], [16, 2], [17, 2],
    [17, 3], [17, 4], [17, 5],
    [16, 5], [10, 5], [3, 5], [2, 5],
    [2, 6], [2, 7], [2, 8],
    [3, 8], [10, 8], [16, 8], [17, 8],
    [17, 9], [17, 10], [17, 11],
    [18, 11], [19, 11],
  ];

  for (const [col, row] of pathSamples) {
    assert.equal(map.isCellBuildable(col, row), false, `(${col},${row}) es camino`);
  }
});

test('CA-04 el camino serpentina ocupa exactamente 59 casillas', () => {
  const map = new GameMap();

  assert.equal(map.pathCells.size, 59);
  for (const waypoint of map.waypoints) {
    assert.ok(map.pathCells.has(map.cellKey(waypoint.x, waypoint.y)));
  }
});

test('CA-04 las casillas fuera del camino son construibles', () => {
  const map = new GameMap();

  const freeCells = [
    [0, 0], [1, 0], [19, 0], [0, 1], [5, 1], [19, 1],
    [10, 3], [0, 4], [1, 6], [10, 6], [16, 7], [0, 9],
    [10, 9], [0, 10], [16, 10], [0, 11], [10, 11],
  ];

  for (const [col, row] of freeCells) {
    assert.equal(map.isCellBuildable(col, row), true, `(${col},${row}) debería ser construible`);
  }
});

test('CA-04 las casillas fuera de la rejilla no son construibles', () => {
  const map = new GameMap();

  assert.equal(map.isCellBuildable(-1, 0), false);
  assert.equal(map.isCellBuildable(0, -1), false);
  assert.equal(map.isCellBuildable(20, 0), false);
  assert.equal(map.isCellBuildable(0, 12), false);
  assert.equal(map.isCellBuildable(20, 12), false);
  assert.equal(map.isCellBuildable(1.5, 2), false);
});

test('CA-04 una casilla reservada por una torre deja de ser construible', () => {
  const map = new GameMap();

  assert.equal(map.isCellBuildable(3, 3), true);
  assert.equal(map.occupyCell(3, 3), true);
  assert.equal(map.isCellOccupied(3, 3), true);
  assert.equal(map.isCellBuildable(3, 3), false);

  assert.equal(map.freeCell(3, 3), true);
  assert.equal(map.isCellOccupied(3, 3), false);
  assert.equal(map.isCellBuildable(3, 3), true);
});
