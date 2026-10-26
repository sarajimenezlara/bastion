// CA-18: la simulación de partidas completas es un criterio automático.
// Reutiliza la lógica de scripts/simular-balance.js (exportada, sin duplicarla):
// «Sin torres» debe perder antes de la oleada 4 y «Medio con mejoras» debe ganar.

const test = require('node:test');
const assert = require('node:assert/strict');

const { play, ESTRATEGIAS } = require('../scripts/simular-balance.js');

test('CA-18 «Sin torres» pierde antes de la oleada 4', () => {
  const result = play(ESTRATEGIAS['Sin torres']);

  assert.equal(result.estado, 'DEFEAT');
  assert.ok(
    result.oleada < 4,
    `debería perder antes de la oleada 4, pero terminó en la ${result.oleada}`
  );
});

test('CA-18 «Medio con mejoras» gana la partida', () => {
  const result = play(ESTRATEGIAS['Medio con mejoras']);

  assert.equal(
    result.estado,
    'VICTORY',
    `debería ganar, pero terminó en ${result.estado} (oleada ${result.oleada})`
  );
  assert.equal(result.oleada, 10);
  assert.ok(result.vidas > 0, 'debe conservar vidas al ganar');
});
