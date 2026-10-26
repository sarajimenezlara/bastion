---
description: Implementa una fase del GDD con sus pruebas y no para hasta que npm test esté en verde (agente build)
agent: build
model: opencode/deepseek-v4.1-flash-free
---
Implementa la **Fase $1** de Bastión siguiendo el plan de esta sesión, `docs/decisiones/fase-$1.md` (si existe), `docs/GDD.md` y `AGENTS.md`.

Reglas:
- Solo lo de la fase $1: no adelantes fases futuras.
- Cada criterio automático de la fase tiene al menos una prueba en `tests/` cuyo nombre empieza por su código (`CA-07 …`).
- Ejecuta `npm test` y corrige hasta que todas las pruebas pasen. No borres ni debilites pruebas para que pasen.
- Actualiza la sección «Progreso» del `README.md`.

## Verificación
Termina pegando la salida final de `npm test` y la lista de ficheros que has creado o cambiado.
