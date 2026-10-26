---
description: Aplica un prompt de corrección (de la gema QA, del revisor o de una simulación) guardado en un fichero
agent: build
model: opencode/deepseek-v4.1-flash-free
---
Aplica la siguiente corrección al proyecto Bastión. Respeta `AGENTS.md` y las decisiones de `docs/decisiones/`.

!`cat $1`

Reglas:
- Cambia solo lo que pide la corrección.
- Si un cambio de balance hace fallar una prueba antigua, actualiza la prueba al valor nuevo del GDD (no la borres).
- Ejecuta `npm test` hasta que todo esté en verde.

## Verificación
Termina con la salida final de `npm test`, la lista de ficheros cambiados y, si la corrección lo pide, la salida de `npm run simular`.
