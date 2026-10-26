// InputMap: traducción pura de eventos de teclado y de coordenadas a acciones
// de la interfaz. No toca el DOM ni guarda estado, así que se verifica con
// `node --test` (Fase 5, CA-15).
// Patrón UMD simplificado: navegador (window) y node --test (CommonJS).

// Atajos 1-4 del GDD §6: cada tecla selecciona una torre del catálogo.
const TOWER_BY_KEY = Object.freeze({
  '1': 'Ballesta',
  '2': 'Canon',
  '3': 'Escarcha',
  '4': 'Arcana',
});

// Etiquetas HTML en las que las teclas deben seguir escribiendo texto.
const TYPING_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];

/**
 * Indica si el evento nace en un campo de texto y no debe atajarse.
 * @param {object|null} target
 * @returns {boolean}
 */
function isTypingTarget(target) {
  if (!target || typeof target !== 'object') return false;
  if (target.isContentEditable === true) return true;
  const tag = typeof target.tagName === 'string' ? target.tagName.toUpperCase() : '';
  return TYPING_TAGS.includes(tag);
}

/**
 * Traduce un `keydown` del GDD a una acción de interfaz.
 * Devuelve `null` si la tecla no está atajada o si el evento no debe atajarse
 * (repetición por tecla mantenida, combinaciones con Ctrl/Alt/Meta o campos de texto).
 * @param {object} event evento tipo KeyboardEvent
 * @returns {{type:string, towerType?:string}|null}
 */
function actionForEvent(event) {
  if (!event || event.repeat) return null;
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (isTypingTarget(event.target)) return null;

  const key = event.key;
  if (typeof key !== 'string' || key.length === 0) return null;

  const towerType = TOWER_BY_KEY[key];
  if (towerType) return { type: 'selectTowerType', towerType };

  if (key === ' ' || key === 'Spacebar' || key === 'Space') {
    return { type: 'togglePause' };
  }

  if (key === 'Escape' || key === 'Esc') return { type: 'cancelSelection' };

  switch (key.toLowerCase()) {
    case 'f':
      return { type: 'toggleSpeed' };
    case 'a':
      return { type: 'toggleAutoWaves' };
    case 'u':
      return { type: 'upgradeSelected' };
    case 'v':
      return { type: 'sellSelected' };
    default:
      return null;
  }
}

/**
 * Convierte coordenadas del canvas en una casilla de la rejilla.
 * @param {object} map instancia de GameMap
 * @param {number} x píxel horizontal dentro del canvas
 * @param {number} y píxel vertical dentro del canvas
 * @returns {{col:number,row:number}|null} null si cae fuera de la rejilla
 */
function cellFromCanvasPoint(map, x, y) {
  if (!map || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (!Number.isFinite(map.tileSize) || map.tileSize <= 0) return null;

  const col = Math.floor(x / map.tileSize);
  const row = Math.floor(y / map.tileSize);
  if (typeof map.isInBounds === 'function' && !map.isInBounds(col, row)) return null;

  return { col, row };
}

if (typeof window !== 'undefined') {
  window.InputMap = { TOWER_BY_KEY, actionForEvent, cellFromCanvasPoint, isTypingTarget };
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TOWER_BY_KEY, actionForEvent, cellFromCanvasPoint, isTypingTarget };
}
