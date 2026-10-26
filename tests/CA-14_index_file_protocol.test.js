// CA-14: el juego debe cargar con doble clic en index.html (protocolo file://)
// sin errores de JavaScript ni bloqueos CORS. Lo verificable de forma automática
// es la estructura: sin <script type="module">, sin import/export, todos los
// ficheros referenciados existen y el core se carga antes que la presentación.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'index.html');
const html = fs.readFileSync(INDEX_PATH, 'utf8');

/** Rutas locales de los <script src="..."> de index.html. @returns {string[]} */
function scriptSources() {
  const sources = [];
  const pattern = /<script\b[^>]*\bsrc="([^"]+)"[^>]*>/gi;
  let match = pattern.exec(html);
  while (match !== null) {
    sources.push(match[1]);
    match = pattern.exec(html);
  }
  return sources;
}

test('CA-14 index.html existe y no declara scripts de tipo módulo', () => {
  assert.ok(fs.existsSync(INDEX_PATH), 'index.html debe estar en la raíz del proyecto');
  assert.equal(/type\s*=\s*"module"/i.test(html), false, 'file:// no admite type="module"');
  assert.match(html, /<canvas[^>]*id="game-canvas"/, 'debe existir el canvas del juego');
});

test('CA-14 todos los scripts locales existen y no usan import/export', () => {
  const sources = scriptSources();
  assert.ok(sources.length >= 10, `se esperaban los scripts del core y la presentación, hay ${sources.length}`);

  for (const source of sources) {
    assert.equal(source.startsWith('http'), false, `no se permiten scripts externos: ${source}`);

    const filePath = path.join(ROOT, source);
    assert.ok(fs.existsSync(filePath), `falta el fichero referenciado: ${source}`);

    const code = fs.readFileSync(filePath, 'utf8');
    assert.equal(
      /^\s*(import|export)\b/m.test(code),
      false,
      `${source} no debe usar ESM (bloquea file://)`
    );
  }
});

test('CA-14 el core se carga antes que la capa de presentación', () => {
  const sources = scriptSources();
  const lastCore = sources.map((src) => src.startsWith('src/core/')).lastIndexOf(true);
  const firstPresentation = sources.findIndex((src) => src.startsWith('src/presentation/'));

  assert.ok(lastCore !== -1, 'debe cargarse el core');
  assert.ok(firstPresentation !== -1, 'debe cargarse la presentación');
  assert.ok(
    lastCore < firstPresentation,
    'GameEngine y compañía deben estar definidos antes de CanvasRenderer/UIController'
  );
});

test('CA-14 la hoja de estilos referenciada existe', () => {
  const links = [...html.matchAll(/<link\b[^>]*\bhref="([^"]+)"/gi)].map((match) => match[1]);
  assert.ok(links.length > 0, 'index.html debe enlazar styles.css');

  for (const href of links) {
    assert.ok(fs.existsSync(path.join(ROOT, href)), `falta la hoja de estilos: ${href}`);
  }
});
