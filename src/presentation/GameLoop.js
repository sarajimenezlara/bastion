// GameLoop: bucle de renderizado con requestAnimationFrame (Fase 5, decisión 2).
// El delta que recibe el motor se limita a 0,1 s para que un cambio de pestaña
// no provoque saltos: el juego se congela un instante y sigue, no teletransporta.
// Recibe `requestFrame`/`cancelFrame`/`now` por inyección para poder probarse
// con `node --test` sin navegador.
// Patrón UMD simplificado: navegador (window) y node --test (CommonJS).

class GameLoop {
  /**
   * @param {object} [options]
   * @param {Function} [options.update] recibe el delta ya limitado (segundos)
   * @param {Function} [options.render] recibe el mismo delta para animar efectos
   * @param {number} [options.maxDelta] tope de delta en segundos (0.1 por defecto)
   * @param {Function} [options.requestFrame] (callback) => handle
   * @param {Function} [options.cancelFrame] (handle) => void
   * @param {Function} [options.now] reloj en milisegundos
   */
  constructor(options = {}) {
    const opts = options || {};

    this.update = typeof opts.update === 'function' ? opts.update : () => {};
    this.render = typeof opts.render === 'function' ? opts.render : () => {};
    this.maxDelta =
      Number.isFinite(opts.maxDelta) && opts.maxDelta > 0
        ? opts.maxDelta
        : GameLoop.MAX_DELTA;

    this.now =
      typeof opts.now === 'function'
        ? opts.now
        : () =>
            typeof performance !== 'undefined' && typeof performance.now === 'function'
              ? performance.now()
              : Date.now();

    this.requestFrame =
      typeof opts.requestFrame === 'function'
        ? opts.requestFrame
        : (callback) =>
            typeof requestAnimationFrame === 'function'
              ? requestAnimationFrame(callback)
              : setTimeout(() => callback(this.now()), 16);

    this.cancelFrame =
      typeof opts.cancelFrame === 'function'
        ? opts.cancelFrame
        : (handle) => {
            if (typeof cancelAnimationFrame === 'function') {
              cancelAnimationFrame(handle);
            } else {
              clearTimeout(handle);
            }
          };

    this.isRunning = false;
    // `null` en el primer frame: el delta inicial siempre es 0, no el tiempo
    // transcurrido desde que se abrió la página.
    this.lastTimestamp = null;
    this.frameHandle = null;
  }

  /** Arranca el bucle. Llamarlo dos veces no duplica frames. @returns {void} */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = null;
    this.schedule();
  }

  /** Detiene el bucle y cancela el frame pendiente. @returns {void} */
  stop() {
    this.isRunning = false;
    if (this.frameHandle !== null) {
      this.cancelFrame(this.frameHandle);
      this.frameHandle = null;
    }
  }

  /** Pide el siguiente frame mientras el bucle esté activo. @returns {void} */
  schedule() {
    if (!this.isRunning) return;
    this.frameHandle = this.requestFrame((timestamp) => this.frame(timestamp));
  }

  /**
   * Ejecuta un frame concreto. Es público para poder simular frames en pruebas.
   * @param {number} [timestamp] milisegundos del frame
   * @returns {number} delta aplicado en segundos (0..maxDelta)
   */
  frame(timestamp) {
    const current = Number.isFinite(timestamp) ? timestamp : this.now();

    let delta = 0;
    if (this.lastTimestamp !== null) {
      delta = (current - this.lastTimestamp) / 1000;
    }
    this.lastTimestamp = current;

    if (!Number.isFinite(delta) || delta < 0) delta = 0;
    if (delta > this.maxDelta) delta = this.maxDelta;

    this.update(delta);
    this.render(delta);

    if (this.isRunning) this.schedule();
    return delta;
  }

  /** Reinicia la referencia temporal sin detener el bucle. @returns {void} */
  reset() {
    this.lastTimestamp = null;
  }
}

// Tope de delta del GDD (decisión 2 de la fase 5): 0,1 s.
GameLoop.MAX_DELTA = 0.1;

if (typeof window !== 'undefined') {
  window.GameLoop = GameLoop;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameLoop;
}
