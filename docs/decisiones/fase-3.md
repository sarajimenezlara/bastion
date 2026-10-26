# Registro de Decisiones - Fase 3

**Fecha:** 2026-10-26

**Pregunta / Ambigüedad:** ¿Cómo gestionar el ciclo de vida de un proyectil tras el impacto y qué ocurre si el objetivo muere antes del impacto?

**Respuesta / Decisión:**
- Desaparición inmediata en el core tras el impacto.
- Si el enemigo objetivo muere antes del impacto:
    - Los proyectiles de torres normales desaparecen sin causar daño.
    - El proyectil del Cañón continúa hasta la última posición conocida del enemigo (punto de impacto original) y causa daño en área allí.
- Para evitar problemas de precisión con `deltaTime`, el movimiento del proyectil en cada frame se limita a la distancia real hacia el objetivo (si `distancia_al_paso >= distancia_objetivo`, se considera impacto directo).

**Criterio de Aceptación (CA) afectado:** CA-10.
