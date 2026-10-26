// GameMap: rejilla del tablero y camino serpentina definido por el GDD.
// El nombre evita pisar el Map nativo de JavaScript en el ámbito global del navegador.
// Patrón UMD simplificado: compatible con navegador (window) y node --test (CommonJS).

const Vector2DRefMap =
  typeof window !== 'undefined' && window.Vector2D
    ? window.Vector2D
    : typeof require !== 'undefined'
      ? require('./Vector2D.js')
      : null;

class GameMap {
  constructor(cols = 20, rows = 12, tileSize = 40) {
    this.cols = cols;
    this.rows = rows;
    this.tileSize = tileSize;

    // Waypoints en coordenadas de casilla (col, row), tal y como los define el GDD.
    this.waypoints = [
      new Vector2DRefMap(0, 2),
      new Vector2DRefMap(17, 2),
      new Vector2DRefMap(17, 5),
      new Vector2DRefMap(2, 5),
      new Vector2DRefMap(2, 8),
      new Vector2DRefMap(17, 8),
      new Vector2DRefMap(17, 11),
      new Vector2DRefMap(19, 11),
    ];

    // Casillas ocupadas por el camino, como claves "col,row".
    // Se rellenan a partir de la serpentina definida en los waypoints (CA-04).
    this.pathCells = new Set();
    // Casillas con una torre construida, como claves "col,row".
    this.occupiedCells = new Set();

    this.rebuildPathCells();
  }

  /**
   * Clave interna de una casilla.
   * @param {number} col
   * @param {number} row
   * @returns {string} "col,row"
   */
  cellKey(col, row) {
    return `${col},${row}`;
  }

  /**
   * Recalcula las casillas del camino a partir de los waypoints.
   * Los tramos del GDD son ortogonales: se rellena cada casilla intermedia.
   */
  rebuildPathCells() {
    this.pathCells.clear();

    for (let i = 0; i < this.waypoints.length - 1; i += 1) {
      this.markSegment(this.waypoints[i], this.waypoints[i + 1]);
    }
  }

  /**
   * Marca como camino todas las casillas de un tramo recto (horizontal o vertical).
   * @param {{x:number,y:number}} from casilla inicial
   * @param {{x:number,y:number}} to casilla final
   */
  markSegment(from, to) {
    const stepCol = Math.sign(to.x - from.x);
    const stepRow = Math.sign(to.y - from.y);

    // Los tramos del GDD nunca son diagonales; si lo fueran, se ignoran.
    if (stepCol !== 0 && stepRow !== 0) return;

    let col = from.x;
    let row = from.y;
    this.pathCells.add(this.cellKey(col, row));

    while (col !== to.x || row !== to.y) {
      col += stepCol;
      row += stepRow;
      this.pathCells.add(this.cellKey(col, row));
    }
  }

  /**
   * Indica si una casilla pertenece a la rejilla.
   * @param {number} col
   * @param {number} row
   * @returns {boolean}
   */
  isInBounds(col, row) {
    return (
      Number.isInteger(col) &&
      Number.isInteger(row) &&
      col >= 0 &&
      row >= 0 &&
      col < this.cols &&
      row < this.rows
    );
  }

  /**
   * Indica si la casilla forma parte del camino serpentina.
   * @param {number} col
   * @param {number} row
   * @returns {boolean}
   */
  isPathCell(col, row) {
    return this.pathCells.has(this.cellKey(col, row));
  }

  /**
   * Indica si la casilla ya está reservada por una torre.
   * @param {number} col
   * @param {number} row
   * @returns {boolean}
   */
  isCellOccupied(col, row) {
    return this.occupiedCells.has(this.cellKey(col, row));
  }

  /**
   * Reserva una casilla para una torre.
   * @param {number} col
   * @param {number} row
   * @returns {boolean} false si la casilla no pertenece a la rejilla
   */
  occupyCell(col, row) {
    if (!this.isInBounds(col, row)) return false;
    this.occupiedCells.add(this.cellKey(col, row));
    return true;
  }

  /**
   * Libera una casilla reservada (reventa de una torre).
   * @param {number} col
   * @param {number} row
   * @returns {boolean} true si la casilla estaba ocupada
   */
  freeCell(col, row) {
    return this.occupiedCells.delete(this.cellKey(col, row));
  }

  /**
   * CA-04: una casilla es construible si está dentro de la rejilla,
   * no pertenece al camino y no está ocupada por otra torre.
   * @param {number} col
   * @param {number} row
   * @returns {boolean}
   */
  isCellBuildable(col, row) {
    if (!this.isInBounds(col, row)) return false;
    if (this.isPathCell(col, row)) return false;
    if (this.isCellOccupied(col, row)) return false;
    return true;
  }

  /**
   * Centro en píxeles de una casilla de la rejilla.
   * @param {number} col
   * @param {number} row
   * @returns {{x:number,y:number}}
   */
  cellCenter(col, row) {
    return {
      x: col * this.tileSize + this.tileSize / 2,
      y: row * this.tileSize + this.tileSize / 2,
    };
  }

  /**
   * Waypoints convertidos a píxeles (centro de cada casilla) para la navegación de Enemy.
   * @returns {Array<{x:number,y:number}>}
   */
  getWaypointsInPixels() {
    return this.waypoints.map((wp) => this.cellCenter(wp.x, wp.y));
  }
}

if (typeof window !== 'undefined') {
  window.GameMap = GameMap;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameMap;
}
