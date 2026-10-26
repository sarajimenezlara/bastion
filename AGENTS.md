# AGENTS.md

Compact guidance for working on the "Bastión" Tower Defense project.

## Architectural Constraints
- **Universal Module Pattern (UMD)**: To support both `node --test` and browser `file://` protocols, avoid ESM `import`/`export`. 
- **Pattern**: Every class in `src/core/` must register itself on `window` and check for `module.exports` at the end of the file:
  ```javascript
  if (typeof window !== 'undefined') window.ClassName = ClassName;
  if (typeof module !== 'undefined' && module.exports) module.exports = ClassName;
  ```
- **Entrypoints**: The browser loads core files sequentially in `index.html` via standard `<script>` tags. CommonJS is used by `node --test` for logic verification.

## Development & Testing
- **Test Command**: `npm test` runs `node --test tests/`.
- **Logic Validation**: All core logic (`GameEngine`, `Tower`, `Enemy`, etc.) must be verified via automated tests in `tests/` before proceeding to UI implementation.
- **Tolerances (Strict)**:
  - Waypoint reaching: $\le 2\text{ px}$.
  - Projectile impact: $\le 8\text{ px}$.
- **Core Math**: Always use `Math.floor()` for health scaling (`baseHealth * 1.12^(N-1)`) and gold calculations (refunds, early wave bonus).

## Implementation Flow
Follow the Roadmap in `docs/GDD.md`:
1. Core classes (UMD)
2. Tower placement & GameMap grid
3. Combat mechanics & Projectiles
4. WaveManager & Engine logic
5. Visuals & UI

Refer to `docs/GDD.md` for full attribute tables, balancing numbers, and criteria (`CA-01` to `CA-16`).

## Reglas Estrictas del Proyecto
- Documentación, comentarios y textos visibles para el jugador: **en español**. Identificadores de código: en inglés.
- Prohibido usar librerías externas, bundlers o un servidor: el juego se juega abriendo `index.html` con doble clic.
- Cada criterio automático del GDD tiene al menos una prueba en `tests/` cuyo nombre empieza por su código (`CA-07 …`).
- Ninguna fase está terminada sin `npm test` en verde y `/validar-fase N` aprobado.
- Las decisiones de `docs/decisiones/fase-N.md` (entrevista con el agente `entrevistador`) mandan sobre el GDD.
- Nunca se escriben claves de API en ficheros del proyecto: se leen de variables de entorno (`{env:...}` en `opencode.json`).

## Flujo de trabajo por fase
`/entrevista N` → `/planificar-fase N` → `/construir-fase N` → `/validar-fase N` → `/informe-qa N` → gema «Bastión · Revisora QA» en Gemini.
