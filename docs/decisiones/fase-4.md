# Registro de Decisiones - Fase 4

## Decisión 1
* **Fecha:** 2026-10-26
* **Pregunta / Ambigüedad:** Patrón de actualización (tick) del GameEngine.
* **Respuesta / Decisión:** Gestión centralizada delegada: `GameEngine.update(deltaTime)` es el único punto de entrada del tiempo y llama en orden a WaveManager (spawn), enemigos (movimiento/meta), torres (disparo), proyectiles (impacto) y al final limpia las listas filtrando. Es determinista y fácil de probar con `node --test`.
* **Criterio de Aceptación (CA) afectado:** CA-11, CA-12, CA-13.

## Decisión 2
* **Fecha:** 2026-10-26
* **Pregunta / Ambigüedad:** Introducción de jefes en el WaveManager.
* **Respuesta / Decisión:** Cada grupo de la tabla de la oleada es un flujo de spawn independiente que empieza a la vez al lanzar la oleada, cada uno con su intervalo. El jefe es un grupo más y no pausa nada. La oleada termina cuando todos los grupos han salido y no queda ningún enemigo vivo en el mapa.
* **Criterio de Aceptación (CA) afectado:** CA-11.

## Decisión 3
* **Fecha:** 2026-10-26
* **Pregunta / Ambigüedad:** Transición a estado de victoria (VICTORY).
* **Respuesta / Decisión:** Transición automática tras limpieza: cuando termina la oleada 10 (todos los grupos salidos y mapa vacío) con vidas > 0, el estado pasa a VICTORY en ese mismo tick. Si las vidas llegan a 0 en cualquier momento, el estado pasa a DEFEAT inmediatamente. Puntuación = oro ganado en total + vidas × 50.
* **Criterio de Aceptación (CA) afectado:** CA-13.
