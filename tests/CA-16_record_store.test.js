// CA-16: el récord se guarda en localStorage al ganar o perder. RecordStore
// recibe el almacenamiento por inyección, así que se prueba con `node --test`
// usando un almacenamiento en memoria y casos de almacenamiento roto.

const test = require('node:test');
const assert = require('node:assert/strict');

const RecordStore = require('../src/presentation/RecordStore.js');

class MemoryStorage {
  constructor() {
    this.data = new Map();
  }

  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }

  setItem(key, value) {
    this.data.set(key, String(value));
  }

  removeItem(key) {
    this.data.delete(key);
  }
}

test('CA-16 sin récord guardado devuelve null', () => {
  const store = new RecordStore(new MemoryStorage());

  assert.equal(store.load(), null);
});

test('CA-16 guardar una partida la deja como récord y se puede leer', () => {
  const storage = new MemoryStorage();
  const store = new RecordStore(storage);

  const result = store.save({ score: 640, wave: 10, result: 'VICTORY', date: '2026-10-26T10:00:00.000Z' });

  assert.equal(result.isNewRecord, true);
  assert.deepEqual(result.best, {
    score: 640,
    wave: 10,
    result: 'VICTORY',
    date: '2026-10-26T10:00:00.000Z',
  });
  assert.deepEqual(store.load(), result.best);
  assert.ok(storage.getItem(RecordStore.STORAGE_KEY), 'debe escribirse en localStorage');
});

test('CA-16 una puntuación menor no reemplaza el récord', () => {
  const store = new RecordStore(new MemoryStorage());

  store.save({ score: 640, wave: 10, result: 'VICTORY' });
  const result = store.save({ score: 120, wave: 3, result: 'DEFEAT' });

  assert.equal(result.isNewRecord, false);
  assert.equal(result.best.score, 640);
  assert.equal(store.load().score, 640);
});

test('CA-16 una puntuación igual tampoco reemplaza el récord', () => {
  const store = new RecordStore(new MemoryStorage());

  store.save({ score: 300, wave: 8, result: 'DEFEAT', date: '2026-01-01T00:00:00.000Z' });
  const result = store.save({ score: 300, wave: 9, result: 'DEFEAT', date: '2026-02-02T00:00:00.000Z' });

  assert.equal(result.isNewRecord, false);
  assert.equal(store.load().date, '2026-01-01T00:00:00.000Z');
});

test('CA-16 un récord corrupto se ignora y no rompe la partida', () => {
  const storage = new MemoryStorage();
  storage.setItem(RecordStore.STORAGE_KEY, '{esto no es json');
  const store = new RecordStore(storage);

  assert.equal(store.load(), null);

  const result = store.save({ score: 50, wave: 1, result: 'DEFEAT' });
  assert.equal(result.isNewRecord, true);
  assert.equal(store.load().score, 50);
});

test('CA-16 un récord con forma inválida se descarta', () => {
  const storage = new MemoryStorage();
  storage.setItem(RecordStore.STORAGE_KEY, JSON.stringify({ puntuacion: 10 }));
  const store = new RecordStore(storage);

  assert.equal(store.load(), null);
});

test('CA-16 sin localStorage disponible la partida sigue funcionando', () => {
  const store = new RecordStore(null);

  assert.equal(store.load(), null);
  const result = store.save({ score: 999, wave: 10, result: 'VICTORY' });

  assert.equal(result.isNewRecord, false);
  assert.equal(result.best, null);
  assert.doesNotThrow(() => store.clear());
});

test('CA-16 un almacenamiento que lanza no rompe el guardado', () => {
  const broken = {
    getItem() {
      throw new Error('bloqueado');
    },
    setItem() {
      throw new Error('sin espacio');
    },
    removeItem() {
      throw new Error('bloqueado');
    },
  };

  const store = new RecordStore(broken);

  assert.equal(store.load(), null);
  assert.doesNotThrow(() => store.save({ score: 10, wave: 1, result: 'DEFEAT' }));
  assert.doesNotThrow(() => store.clear());
});

test('CA-16 clear elimina el récord y usa la clave bastion.record', () => {
  const storage = new MemoryStorage();
  const store = new RecordStore(storage);

  assert.equal(RecordStore.STORAGE_KEY, 'bastion.record');

  store.save({ score: 100, wave: 5, result: 'DEFEAT' });
  assert.ok(storage.getItem('bastion.record'));

  store.clear();
  assert.equal(storage.getItem('bastion.record'), null);
  assert.equal(store.load(), null);
});
