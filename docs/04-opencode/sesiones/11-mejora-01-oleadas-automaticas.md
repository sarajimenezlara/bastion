# Sesión de OpenCode: Mejora 01 · oleadas automáticas

`ses_e869fd59bffeDh1nCLe4tn2fEN`

> Agente: **build**

## 🧑 Usuario

Aplica la siguiente corrección al proyecto Bastión. Respeta `AGENTS.md` y las decisiones de `docs/decisiones/`.

# Mejora 01 · Oleadas automáticas

Petición de Sara: un botón para que, una vez empezada la partida, las oleadas se sigan lanzando
solas, manteniendo el botón «Siguiente oleada» para poder ir de una en una o adelantarlas.

## Comportamiento
- Nuevo botón **«Auto»** en la barra superior, junto a «Siguiente oleada», que se activa y desactiva
  (muestra si está encendido). Atajo de teclado: **A**. Empieza desactivado.
- La primera oleada se sigue lanzando a mano con «Siguiente oleada».
- Con «Auto» activado, cuando una oleada termina (todos sus enemigos han salido y el mapa está vacío)
  y quedan oleadas, empieza una **cuenta atrás de 5 segundos** y después se lanza sola la siguiente.
  Durante la cuenta atrás se puede construir, mejorar y vender.
- El botón «Siguiente oleada» muestra la cuenta atrás («Siguiente oleada en 3 s») y, si se pulsa,
  lanza la oleada al momento. Sigue funcionando igual que ahora en cualquier caso (incluido el bonus por
  adelantar una oleada que aún tiene enemigos por salir).
- La oleada automática no da bonus de oleada anticipada (no se adelanta nada).
- La pausa congela la cuenta atrás y la velocidad 2x la acelera, como al resto del juego.
- Desactivar «Auto» cancela la cuenta atrás. Al ganar o perder no se lanza nada más.

## Implementación
- La lógica va en el núcleo (`GameEngine`): estado de auto-oleadas y cuenta atrás dentro de `tick()`,
  para poder probarla con `node --test`. La interfaz solo muestra el estado y llama al motor.
- Nuevo criterio **CA-19** en la Sección 6 del GDD con su prueba `tests/CA-19_auto_waves.test.js`:
  con Auto activado la siguiente oleada empieza 5 s después de terminar la anterior; sin Auto no empieza;
  la pausa congela la cuenta atrás; desactivar Auto la cancela; no da bonus; no hace nada tras la oleada 10.
- Añade la tecla A a la prueba de atajos (`CA-15`) y a la tabla de controles del `README.md`.

No cambies nada más del juego.


Reglas:
- Cambia solo lo que pide la corrección.
- Si un cambio de balance hace fallar una prueba antigua, actualiza la prueba al valor nuevo del GDD (no la borres).
- Ejecuta `npm test` hasta que todo esté en verde.

## Verificación
Termina con la salida final de `npm test`, la lista de ficheros cambiados y, si la corrección lo pide, la salida de `npm run simular`.

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `shell` {"command": "ls -la && cat package.json"}
- 🔧 `shell` {"command": "find . -path ./node_modules -prune -o -type f -print | sort"}

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `read` {"path": "/home/sara/clase/ia/bastion/src/core/GameEngine.js"}
- 🔧 `read` {"path": "/home/sara/clase/ia/bastion/src/core/WaveManager.js"}
- 🔧 `read` {"path": "/home/sara/clase/ia/bastion/src/presentation/UIController.js"}
- 🔧 `read` {"path": "/home/sara/clase/ia/bastion/index.html"}

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `read` {"path": "/home/sara/clase/ia/bastion/src/presentation/InputMap.js"}
- 🔧 `read` {"path": "/home/sara/clase/ia/bastion/tests/CA-15_hotkeys.test.js"}
- 🔧 `read` {"path": "/home/sara/clase/ia/bastion/tests/CA-17_early_wave.test.js"}
- 🔧 `read` {"path": "/home/sara/clase/ia/bastion/tests/CA-13_victory_score.test.js"}

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `grep` {"pattern": "CA-1[5-9]|Sección 6|## 6|Controles|Atajos", "path": "/home/sara/clase/ia/bastion/docs/GDD.md"}
- 🔧 `grep` {"pattern": "Controles|Atajos|Espacio|Siguiente oleada|tecla|Tecla", "path": "/home/sara/clase/ia/bastion/README.md"}
- 🔧 `shell` {"command": "cat docs/decisiones/fase-4.md; cat docs/decisiones/fase-5.md; cat docs/mejoras/mejora-01-oleadas-automaticas.md"}

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `read` {"path": "/home/sara/clase/ia/bastion/docs/GDD.md", "offset": 300, "limit": 80}
- 🔧 `read` {"path": "/home/sara/clase/ia/bastion/README.md", "offset": 15, "limit": 130}
- 🔧 `read` {"path": "/home/sara/clase/ia/bastion/src/presentation/GameLoop.js"}
- 🔧 `read` {"path": "/home/sara/clase/ia/bastion/src/presentation/main.js"}

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `shell` {"command": "grep -n \"aria-pressed\\|controls\\|button\" styles.css | head -50"}
- 🔧 `shell` {"command": "cat tests/CA-17_start_build_phase.test.js; cat src/core/Tower.js | head -30"}

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `shell` {"command": "grep -R \"btn-next-wave\\|nextWave\\|btn-auto\\|aria-pressed\\|autoWave\" -n tests src | head -80"}
- 🔧 `shell` {"command": "sed -n '90,150p' styles.css; git status --short"}

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"path": "/home/sara/clase/ia/bastion/src/core/GameEngine.js", "oldString": "const EnemyRef =\n  typeof window !== 'undefined' && window.Enemy\n    ? window.Enemy\n    : typeof require !== 'undefined'\n      ? require('./Enemy.js')\n      : null;\n\nclass GameEngine {", "newString": "const EnemyRef 

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"path": "/home/sara/clase/ia/bastion/src/core/GameEngine.js", "oldString": "    // Nota: el GDD llama 'GAMEOVER' al fin de partida perdido; la decisión 3 de\n    // docs/decisiones/fase-4.md fija el nombre 'DEFEAT'.\n    this.state = 'MENU';\n\n    this.map = new GameMapRef();", "newString": "    /

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"path": "/home/sara/clase/ia/bastion/src/core/GameEngine.js", "newString": "  /** Índice de oleada actual (0 antes de empezar la primera oleada). */\n  get currentWave() {\n    return this.waveManager.currentWaveIndex;\n  }\n\n  /** CA-19: indica si las oleadas automáticas están activadas. @returns

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "  startNextWave() {\n    const definition = this.waveManager.startNextWave();\n    if (!definition) return false;\n\n    // Cualquier lanzamiento cancela la espera de las oleadas automáticas.\n    this.autoWaveTimer = 0;\n    this.state = 'PLAYING';\n    return definition;\n  }", "old

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"path": "/home/sara/clase/ia/bastion/src/core/GameEngine.js", "newString": "  startNextWave() {\n    const definition = this.waveManager.startNextWave();\n    if (!definition) return false;\n\n    // Cualquier lanzamiento cancela la espera de las oleadas automáticas.\n    this.autoWaveTimer = 0;\n 

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "  callNextWave() {\n    // Pulsar «Siguiente oleada» adelanta la cuenta atrás automática.\n    this.autoWaveTimer = 0;\n\n    if (!this.waveManager.isWaveActive) {", "oldString": "  callNextWave() {\n    if (!this.waveManager.isWaveActive) {", "path": "/home/sara/clase/ia/bastion/src/

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "    const delta = Math.max(0, Number(deltaTime) || 0) * this.gameSpeed;\n    if (delta <= 0) return;\n\n    // 0) Cuenta atrás de las oleadas automáticas (CA-19).\n    this.updateAutoWaves(delta);\n\n    // 1) Oleadas: cada grupo activo avanza su propio flujo de spawn.\n    this.waveM

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "    // 6) Recompensa de oleada y transición a VICTORY tras la oleada 10 (CA-13).\n    this.updateWaveState();\n\n    // CA-19: al terminar una oleada con «Auto» activo, prepara la siguiente.\n    this.scheduleAutoWaveIfReady();\n  }", "oldString": "    // 6) Recompensa de oleada y tra

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "}\n\nGameEngine.AUTO_WAVE_DELAY = AUTO_WAVE_DELAY;\n\nif (typeof window !== 'undefined') {", "oldString": "}\n\nif (typeof window !== 'undefined') {", "path": "/home/sara/clase/ia/bastion/src/core/GameEngine.js"}

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "      speed: this.dom.getElementById('btn-speed'),\n      autoWave: this.dom.getElementById('btn-auto-wave'),\n      nextWave: this.dom.getElementById('btn-next-wave'),", "oldString": "      speed: this.dom.getElementById('btn-speed'),\n      nextWave: this.dom.getElementById('btn-nex

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "    if (refs.speed) {\n      refs.speed.addEventListener('click', () => this.runAction({ type: 'toggleSpeed' }));\n    }\n    if (refs.autoWave) {\n      refs.autoWave.addEventListener('click', () => this.runAction({ type: 'toggleAutoWaves' }));\n    }\n    if (refs.nextWave) {", "old

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "    if (this.refs.autoWave) {\n      const pressed = String(engine.autoWaves);\n      if (this.refs.autoWave.getAttribute('aria-pressed') !== pressed) {\n        this.refs.autoWave.setAttribute('aria-pressed', pressed);\n      }\n      if (this.refs.autoWave.disabled !== finished) thi

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "      case 'toggleSpeed':\n        this.toggleSpeed();\n        break;\n      case 'toggleAutoWaves':\n        this.toggleAutoWaves();\n        break;", "oldString": "      case 'toggleSpeed':\n        this.toggleSpeed();\n        break;", "path": "/home/sara/clase/ia/bastion/src/pres

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "  /** Alterna 1x / 2x. @returns {void} */\n  toggleSpeed() {\n    if (!this.engine) return;\n\n    this.engine.gameSpeed = this.engine.gameSpeed === 2 ? 1 : 2;\n    this.update();\n  }\n\n  /** CA-19: activa o desactiva las oleadas automáticas. @returns {void} */\n  toggleAutoWaves() 

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "        <button id=\"btn-speed\" type=\"button\" aria-pressed=\"false\" title=\"Velocidad 1x/2x (F)\">1x</button>\n        <button id=\"btn-auto-wave\" type=\"button\" aria-pressed=\"false\" title=\"Oleadas automáticas (A)\">Auto</button>\n        <button id=\"btn-next-wave\" type=\"b

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "  switch (key.toLowerCase()) {\n    case 'f':\n      return { type: 'toggleSpeed' };\n    case 'a':\n      return { type: 'toggleAutoWaves' };\n    case 'u':", "oldString": "  switch (key.toLowerCase()) {\n    case 'f':\n      return { type: 'toggleSpeed' };\n    case 'u':", "path": "

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "// CA-15: los atajos de teclado del GDD (1-4, Espacio, F, A, Escape, U, V) y la", "oldString": "// CA-15: los atajos de teclado del GDD (1-4, Espacio, F, Escape, U, V) y la", "path": "/home/sara/clase/ia/bastion/tests/CA-15_hotkeys.test.js"}

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "test('CA-15 U mejora y V vende la torre seleccionada', () => {\n  assert.deepEqual(actionForEvent({ key: 'u' }), { type: 'upgradeSelected' });\n  assert.deepEqual(actionForEvent({ key: 'U' }), { type: 'upgradeSelected' });\n  assert.deepEqual(actionForEvent({ key: 'v' }), { type: 'sel

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `write` {"path": "/home/sara/clase/ia/bastion/tests/CA-19_auto_waves.test.js", "content": "// CA-19: oleadas automáticas. Con «Auto» activado, al terminar una oleada\n// empieza una cuenta atrás de 5 s y después se lanza sola la siguiente. La\n// primera oleada sigue siendo manual, el lanzamiento automático

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "* **`CA-18` [AUTOMÁTICO - `node --test`]:** La simulación de partidas completas de `scripts/simular-balance.js` (lógica reutilizada por la prueba, sin duplicarla) es un criterio de balance: «Sin torres» pierde antes de la oleada 4 y «Medio con mejoras» gana la partida.\n\n### Mejora 0

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "* **`CA-15` [MANUAL]:** La interfaz gráfica responde a los atajos de teclado (`1`-`4` para elegir torres, `Espacio` para pausar, `F` para velocidad 1x/2x, `A` para oleadas automáticas, `Escape` para cancelar selección, `U` para mejorar, `V` para vender).", "oldString": "* **`CA-15` [M

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "- «Siguiente oleada» lanza la siguiente oleada y, si ya hay una activa, paga un bonus por los\n  enemigos que aún no han salido.\n- «Auto» activa las oleadas automáticas: al terminar una oleada espera 5 segundos y lanza la\n  siguiente. Durante la espera puedes construir, mejorar y ve

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `edit` {"newString": "- **CA-15** — La interfaz responde a `1`-`4` (elegir torre), `Espacio` (pausa), `F` (1x/2x), `A` (oleadas automáticas), `Escape` (cancelar), `U` (mejorar) y `V` (vender). La comprobación manual se hace jugando; la traducción tecla → acción y clic → casilla se verifica con `npm test`."

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `shell` {"command": "npm test", "timeout": 120000}

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `shell` {"command": "git diff -- src/core/GameEngine.js src/presentation/UIController.js src/presentation/InputMap.js index.html tests/CA-15_hotkeys.test.js docs/GDD.md README.md"}

## 🤖 build · deepseek-v4.1-flash-free

- 🔧 `shell` {"command": "git status --short && git diff --stat"}

## 🤖 build · deepseek-v4.1-flash-free

Implementada la mejora de oleadas automáticas respetando la arquitectura UMD y sin tocar el resto del juego.

## Cambios realizados

- **`src/core/GameEngine.js`**
  - Estado `autoWaves` (desactivado por defecto) y `autoWaveTimer`.
  - Cuenta atrás de 5 s gestionada dentro de `tick()`.
  - `setAutoWaves()` / `toggleAutoWaves()`.
  - Lanzamiento automático con `startNextWave()`: sin bonus de oleada anticipada.
  - La pausa congela la cuenta atrás y `gameSpeed` la acelera.
  - Desactivar Auto cancela la espera; pulsar «Siguiente oleada» la adelanta.
  - Sin lanzamientos tras la oleada 10 ni al ganar/perder.

- **`src/presentation/UIController.js`**
  - Botón «Auto» enlazado y reflejado con `aria-pressed`.
  - El botón «Siguiente oleada» muestra `Siguiente oleada en N s` durante la cuenta atrás.

- **`src/presentation/InputMap.js`** — tecla `A` → `toggleAutoWaves`.
- **`index.html`** — nuevo botón `btn-auto-wave`.
- **`tests/CA-19_auto_waves.test.js`** — nueva batería CA-19.
- **`tests/CA-15_hotkeys.test.js`** — añadida la tecla `A` y retirada de las no atajadas.
- **`docs/GDD.md`** — nuevo CA-19 y tecla `A` en CA-15.
- **`README.md`** — fila `A` en la tabla de controles y explicación de «Auto».

## Resultado de `npm test`

```text
✔ CA-15 A activa y desactiva las oleadas automáticas
✔ CA-19 con Auto la siguiente oleada empieza 5 s después de terminar la anterior
✔ CA-19 sin Auto la siguiente oleada no empieza sola
✔ CA-19 la pausa congela la cuenta atrás
✔ CA-19 la velocidad 2x acelera la cuenta atrás
✔ CA-19 desactivar Auto cancela la cuenta atrás
✔ CA-19 la oleada automática no da bonus de llamada anticipada
✔ CA-19 pulsar Siguiente oleada adelanta la cuenta atrás
✔ CA-19 tras la oleada 10 no se lanza ninguna oleada más
✔ CA-19 la interfaz muestra el estado de Auto y la cuenta atrás

ℹ tests 129
ℹ suites 0
ℹ pass 129
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 206.054959
```

No se ejecutó `npm run simular` porque la corrección no lo solicita y no se han modificado valores de balance.
