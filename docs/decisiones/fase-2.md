# Registro de Decisiones - Fase 2

**Fecha:** 26 de octubre de 2026

---

### Decisión 1
- **Pregunta / Ambigüedad:** ¿Cómo debemos manejar la construcción de torres sobre casillas que el GDD marca como no construibles o si hubiera conflicto de espacio?
- **Respuesta / Decisión:** No aplica: el camino es fijo y las casillas del camino no son edificables, así que los enemigos (que solo recorren el camino) nunca se solapan con una torre. Construir sobre el camino, sobre una casilla ocupada, fuera de la rejilla o sin oro suficiente devuelve false y no cambia el estado.
- **Criterio de Aceptación (CA) afectado:** CA-04, CA-05

---

### Decisión 2
- **Pregunta / Ambigüedad:** ¿La reventa de una torre debe ser inmediata en el mismo frame en que se invoca la función o debe procesarse en el siguiente tick del motor para mantener la integridad de la lista de torres?
- **Respuesta / Decisión:** Inmediata. La venta solo la dispara la interfaz (clic o tecla V), fuera de update(), así que no se modifica la lista de torres mientras se recorre. Dentro de update() las eliminaciones (enemigos muertos, proyectiles) se hacen filtrando la lista al final del tick, nunca con splice durante el recorrido.
- **Criterio de Aceptación (CA) afectado:** CA-06
