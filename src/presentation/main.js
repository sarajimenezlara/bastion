// main.js: arranque del juego (Fases 5 y 6). Une motor, renderizador, interfaz
// y bucle de frames. Se carga el último desde index.html, tras el core y la
// capa de presentación, y se registra en `window.Bastion`.

(function () {
  'use strict';

  /** Crea la aplicación y la arranca sobre el canvas del documento. @returns {object} */
  function boot() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return null;

    const recordStore = new window.RecordStore(window.RecordStore.defaultStorage());

    let engine = new window.GameEngine();
    const renderer = new window.CanvasRenderer(canvas, engine);

    // El canvas sigue el tamaño real del tablero del GDD (20 x 12 casillas de 40 px).
    canvas.width = engine.map.cols * engine.map.tileSize;
    canvas.height = engine.map.rows * engine.map.tileSize;

    const loop = new window.GameLoop({
      update: (deltaTime) => {
        // Instantánea previa al tick: el core elimina los proyectiles al impactar
        // y el renderizador necesita su última posición para el destello del Cañón.
        renderer.observeProjectiles(engine.projectiles);
        engine.tick(deltaTime);
        renderer.collectImpacts(engine.projectiles);
      },
      render: (deltaTime) => {
        renderer.render(deltaTime);
        ui.update(deltaTime);
      },
    });

    const app = { engine, renderer, ui: null, loop, recordStore };

    const ui = new window.UIController({
      engine,
      renderer,
      recordStore,
      onRestart: () => {
        engine = new window.GameEngine();
        app.engine = engine;
        renderer.setEngine(engine);
        ui.setEngine(engine);
      },
    });
    app.ui = ui;

    ui.mount();
    loop.start();

    // Expuesto para depuración desde la consola del navegador.
    window.Bastion = app;

    return app;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
