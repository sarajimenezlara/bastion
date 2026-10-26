// TowerManager: colección de torres, reserva de casillas y reventa.
// Patrón UMD simplificado: compatible con navegador (window) y node --test (CommonJS).

const TowerRef =
  typeof window !== 'undefined' && window.Tower
    ? window.Tower
    : typeof require !== 'undefined'
      ? require('./Tower.js')
      : null;

class TowerManager {
  /**
   * @param {object} map instancia de Map (rejilla y casillas del camino)
   * @param {Array} [towers] colección compartida con GameEngine (`engine.towers`)
   */
  constructor(map, towers = []) {
    this.map = map;
    this.towers = towers;
  }

  /**
   * Torreta cuyo identificador coincide.
   * @param {number|string} towerId
   * @returns {object|null}
   */
  getTowerById(towerId) {
    return this.towers.find((tower) => tower.id === towerId) || null;
  }

  /**
   * Torre que ocupa una casilla concreta.
   * @param {number} col
   * @param {number} row
   * @returns {object|null}
   */
  getTowerAt(col, row) {
    return this.towers.find((tower) => tower.col === col && tower.row === row) || null;
  }

  /**
   * Indica si la casilla admite una torre nueva.
   * @param {number} col
   * @param {number} row
   * @returns {boolean}
   */
  canPlace(col, row) {
    if (!this.map) return false;
    if (!this.map.isCellBuildable(col, row)) return false;
    return this.getTowerAt(col, row) === null;
  }

  /**
   * Crea una torre de nivel 1 y reserva su casilla. No gestiona oro (eso es del motor).
   * @param {string} type 'Ballesta' | 'Canon' | 'Escarcha' | 'Arcana'
   * @param {number} col
   * @param {number} row
   * @returns {object|null} la torre creada o null si no se puede construir
   */
  addTower(type, col, row) {
    if (!TowerRef.getConfig(type, 1)) return null;
    if (!this.canPlace(col, row)) return null;

    const tower = new TowerRef(null, type, col, row);
    this.towers.push(tower);
    this.map.occupyCell(col, row);
    return tower;
  }

  /**
   * Retira una torre y libera su casilla. La reventa es inmediata
   * (docs/decisiones/fase-2.md, decisión 2).
   * @param {number|string} towerId
   * @returns {object|null} la torre retirada o null si no existe
   */
  removeTower(towerId) {
    const index = this.towers.findIndex((tower) => tower.id === towerId);
    if (index === -1) return null;

    const [tower] = this.towers.splice(index, 1);
    if (this.map) {
      this.map.freeCell(tower.col, tower.row);
    }
    return tower;
  }
}

if (typeof window !== 'undefined') {
  window.TowerManager = TowerManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TowerManager;
}
