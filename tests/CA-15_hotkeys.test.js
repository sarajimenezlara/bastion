// CA-15: los atajos de teclado del GDD (1-4, Espacio, F, A, Escape, U, V) y la
// traducción de clics a casillas. InputMap no toca el DOM, así que se puede
// verificar íntegramente con `node --test`. Las pruebas de selección usan
// UIController con referencias de canvas simuladas (sin DOM real).

const test = require('node:test');
const assert = require('node:assert/strict');

const { TOWER_BY_KEY, actionForEvent, cellFromCanvasPoint } = require('../src/presentation/InputMap.js');
const GameMap = require('../src/core/GameMap.js');
const GameEngine = require('../src/core/GameEngine.js');
const UIController = require('../src/presentation/UIController.js');

/**
 * Controlador con un canvas simulado de 800x480 para probar los clics.
 * @returns {{engine: GameEngine, ui: UIController}}
 */
function makeController() {
  const engine = new GameEngine();
  const ui = new UIController({ engine, renderer: null });

  ui.refs = {
    cards: [],
    canvas: {
      width: 800,
      height: 480,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 480 }),
    },
  };

  return { engine, ui };
}

/**
 * Simula un clic en el centro de una casilla.
 * @param {UIController} ui
 * @param {number} col
 * @param {number} row
 * @returns {void}
 */
function clickCell(ui, col, row) {
  ui.handleCanvasClick({ clientX: col * 40 + 20, clientY: row * 40 + 20 });
}

test('CA-15 las teclas 1-4 eligen las cuatro torres del catálogo', () => {
  assert.deepEqual(actionForEvent({ key: '1' }), { type: 'selectTowerType', towerType: 'Ballesta' });
  assert.deepEqual(actionForEvent({ key: '2' }), { type: 'selectTowerType', towerType: 'Canon' });
  assert.deepEqual(actionForEvent({ key: '3' }), { type: 'selectTowerType', towerType: 'Escarcha' });
  assert.deepEqual(actionForEvent({ key: '4' }), { type: 'selectTowerType', towerType: 'Arcana' });

  assert.deepEqual(Object.keys(TOWER_BY_KEY), ['1', '2', '3', '4']);
});

test('CA-15 Espacio pausa, F alterna velocidad y Escape cancela la selección', () => {
  assert.deepEqual(actionForEvent({ key: ' ' }), { type: 'togglePause' });
  assert.deepEqual(actionForEvent({ key: 'Spacebar' }), { type: 'togglePause' });
  assert.deepEqual(actionForEvent({ key: 'f' }), { type: 'toggleSpeed' });
  assert.deepEqual(actionForEvent({ key: 'F' }), { type: 'toggleSpeed' });
  assert.deepEqual(actionForEvent({ key: 'Escape' }), { type: 'cancelSelection' });
});

test('CA-15 U mejora y V vende la torre seleccionada', () => {
  assert.deepEqual(actionForEvent({ key: 'u' }), { type: 'upgradeSelected' });
  assert.deepEqual(actionForEvent({ key: 'U' }), { type: 'upgradeSelected' });
  assert.deepEqual(actionForEvent({ key: 'v' }), { type: 'sellSelected' });
  assert.deepEqual(actionForEvent({ key: 'V' }), { type: 'sellSelected' });
});

test('CA-15 A activa y desactiva las oleadas automáticas', () => {
  assert.deepEqual(actionForEvent({ key: 'a' }), { type: 'toggleAutoWaves' });
  assert.deepEqual(actionForEvent({ key: 'A' }), { type: 'toggleAutoWaves' });
});

test('CA-15 las teclas no atajadas devuelven null', () => {
  for (const key of ['z', '0', '5', 'Enter', 'ArrowUp', 'Tab', '']) {
    assert.equal(actionForEvent({ key }), null, `«${key}» no debe atajarse`);
  }
  assert.equal(actionForEvent(null), null);
  assert.equal(actionForEvent({}), null);
});

test('CA-15 se ignoran repeticiones y combinaciones con Ctrl, Alt o Meta', () => {
  assert.equal(actionForEvent({ key: ' ', repeat: true }), null);
  assert.equal(actionForEvent({ key: '1', ctrlKey: true }), null);
  assert.equal(actionForEvent({ key: 'f', altKey: true }), null);
  assert.equal(actionForEvent({ key: 'v', metaKey: true }), null);
});

test('CA-15 las teclas no se atajan al escribir en un campo de texto', () => {
  assert.equal(actionForEvent({ key: '1', target: { tagName: 'INPUT' } }), null);
  assert.equal(actionForEvent({ key: ' ', target: { tagName: 'TEXTAREA' } }), null);
  assert.equal(actionForEvent({ key: 'v', target: { tagName: 'SELECT' } }), null);
  assert.equal(actionForEvent({ key: 'u', target: { isContentEditable: true } }), null);

  // Un div normal no bloquea el atajo.
  assert.deepEqual(actionForEvent({ key: 'u', target: { tagName: 'DIV' } }), {
    type: 'upgradeSelected',
  });
});

test('CA-15 un clic se traduce a la casilla de la rejilla', () => {
  const map = new GameMap();

  assert.deepEqual(cellFromCanvasPoint(map, 0, 0), { col: 0, row: 0 });
  assert.deepEqual(cellFromCanvasPoint(map, 39, 39), { col: 0, row: 0 });
  assert.deepEqual(cellFromCanvasPoint(map, 40, 40), { col: 1, row: 1 });
  assert.deepEqual(cellFromCanvasPoint(map, 799, 479), { col: 19, row: 11 });
});

test('CA-15 un clic fuera de la rejilla no devuelve casilla', () => {
  const map = new GameMap();

  assert.equal(cellFromCanvasPoint(map, -1, 10), null);
  assert.equal(cellFromCanvasPoint(map, 10, -1), null);
  assert.equal(cellFromCanvasPoint(map, 800, 10), null);
  assert.equal(cellFromCanvasPoint(map, 10, 480), null);
  assert.equal(cellFromCanvasPoint(map, Number.NaN, 10), null);
  assert.equal(cellFromCanvasPoint(null, 10, 10), null);
});

test('CA-15 pulsar la misma tecla dos veces mantiene la torre seleccionada', () => {
  const { ui } = makeController();

  ui.handleKeydown({ key: '1' });
  ui.handleKeydown({ key: '1' });

  assert.equal(ui.selectedBuildType, 'Ballesta', 'repetir la tecla no debe deseleccionar');

  ui.handleKeydown({ key: '2' });
  assert.equal(ui.selectedBuildType, 'Canon', 'otra tecla cambia la torre elegida');
});

test('CA-15 la selección se mantiene tras construir y permite colocar varias seguidas', () => {
  const { engine, ui } = makeController();

  ui.handleKeydown({ key: '1' });
  clickCell(ui, 3, 3);

  assert.equal(engine.towers.length, 1);
  assert.equal(ui.selectedBuildType, 'Ballesta');

  clickCell(ui, 4, 3);

  assert.equal(engine.towers.length, 2, 'el segundo clic debe construir otra Ballesta');
  assert.equal(engine.gold, 120);
  assert.equal(ui.selectedBuildType, 'Ballesta');
});

test('CA-15 Escape y el clic derecho cancelan la selección', () => {
  const { ui } = makeController();

  ui.handleKeydown({ key: '1' });
  ui.handleKeydown({ key: 'Escape' });
  assert.equal(ui.selectedBuildType, null, 'Escape cancela la torre elegida');

  // El clic derecho se enlaza en bindEvents con un canvas simulado.
  const handlers = {};
  const engine = new GameEngine();
  const controller = new UIController({ engine, renderer: null, dom: { addEventListener: () => {} } });
  controller.refs = {
    cards: [],
    canvas: {
      width: 800,
      height: 480,
      addEventListener: (type, handler) => {
        handlers[type] = handler;
      },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 480 }),
    },
  };
  controller.bindEvents();

  controller.handleKeydown({ key: '1' });
  assert.equal(controller.selectedBuildType, 'Ballesta');
  assert.equal(typeof handlers.contextmenu, 'function', 'el canvas debe escuchar el clic derecho');

  let prevented = false;
  handlers.contextmenu({ preventDefault: () => (prevented = true) });

  assert.equal(prevented, true, 'el clic derecho no debe abrir el menú del navegador');
  assert.equal(controller.selectedBuildType, null, 'el clic derecho cancela la torre elegida');
});
