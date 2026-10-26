// Map: rejilla del tablero y camino serpentina definido por el GDD.
// Patrón UMD simplificado: compatible con navegador (window) y node --test (CommonJS).

const Vector2DRefMap =
  typeof window !== 'undefined' && window.Vector2D
    ? window.Vector2D
    : typeof require !== 'undefined'
      ? require('./Vector2D.js')
      : null;

class Map {
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
    // Fase 2 (CA-04) es la encargada de poblarlo y de implementar isCellBuildable.
    this.pathCells = new Set();
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
  window.Map = Map;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Map;
}
