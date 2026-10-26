# Bastión — Tower Defense en JavaScript Vanilla

Juego de defensa de torres que se ejecuta abriendo `index.html` con doble clic (protocolo `file://`),
sin servidores, sin bundlers y sin librerías externas.

## Requisitos

- Node.js 18 o superior (solo para ejecutar las pruebas automáticas).
- Un navegador moderno con soporte de Canvas 2D (solo para jugar, a partir de la Fase 5).

## Cómo jugar

Pendiente: la interfaz gráfica y el bucle de renderizado llegan en la Fase 5.

## Pruebas

```bash
npm test
```

Ejecuta toda la lógica del core con `node --test tests/`. Cada criterio automático del GDD
tiene al menos una prueba cuyo nombre empieza por su código (`CA-01`, `CA-02`, …).

## Progreso

| Fase | Alcance | Estado |
| --- | --- | --- |
| 1 | Módulos del core (`Vector2D`, `Enemy`, `Map`, `WaveManager`, `GameEngine`) con UMD | ✅ Completada |
| 2 | Sistema de construcción: `Tower`, rejilla construible y costes | ⏳ Pendiente |
| 3 | Combate, proyectiles, tolerancia de 8 px y tipos de daño | ⏳ Pendiente |
| 4 | `WaveManager` completo, escalado de salud e integración del motor | ⏳ Pendiente |
| 5 | `CanvasRenderer` y `UIController` (HTML/DOM) | ⏳ Pendiente |
| 6 | Pantallas superpuestas, atajos de teclado y `localStorage` | ⏳ Pendiente |

### Fase 1 — Módulos lógicos del core

Criterios cubiertos y verificados con `npm test`:

- **CA-01** — `GameEngine` arranca con 20 vidas, 150 de oro, oleada 0 y colecciones vacías.
- **CA-02** — `Enemy.takeDamage` aplica `max(1, daño - armadura)` en físico e ignora la armadura en mágico.
- **CA-03** — `Enemy.update` detecta los waypoints a una distancia euclídea ≤ 2 px.

Decisiones de diseño de la fase: [`docs/decisiones/fase-1.md`](docs/decisiones/fase-1.md).

Fuera de alcance en esta fase (se implementan después según el roadmap):

- `Map.isCellBuildable` y el relleno de `pathCells` → Fase 2 (CA-04).
- `Tower`, `Projectile`, combate y tipos de daño → Fases 2 y 3.
- Generación de oleadas y escalado de salud → Fase 4 (CA-11).
- Renderizado, HUD e `index.html` → Fases 5 y 6.
