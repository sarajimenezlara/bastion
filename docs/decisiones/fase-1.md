# Registro de Decisiones - Fase 1

**Fecha:** 2026-10-26
**Pregunta / Ambigüedad:** Estrategia para la generación de IDs únicos de enemigos, torres y proyectiles en el Core.
**Respuesta / Decisión:** Contador incremental global simple (`this.id = idCounter++`).
**Criterio de Aceptación (CA) afectado:** CA-01 (Inicialización de colecciones y estado del GameEngine, que dependen de IDs para identificación en las colecciones).
