// Vector2D: estructura básica de coordenadas en píxeles.
// Patrón UMD simplificado: compatible con navegador (window) y node --test (CommonJS).

class Vector2D {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Distancia euclídea entre este punto y otro.
   * @param {Vector2D} other
   * @returns {number} distancia en píxeles
   */
  distanceTo(other) {
    return Math.hypot(other.x - this.x, other.y - this.y);
  }

  /**
   * Devuelve una copia del vector.
   * @returns {Vector2D}
   */
  clone() {
    return new Vector2D(this.x, this.y);
  }
}

if (typeof window !== 'undefined') {
  window.Vector2D = Vector2D;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Vector2D;
}
