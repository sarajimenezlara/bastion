---
description: Plan de implementación de una fase del GDD (agente plan, no modifica ficheros)
agent: plan
---
Planifica la **Fase $1** de Bastión. No modifiques ningún fichero: esto es solo el plan.

Fuentes, por este orden de prioridad:
1. `docs/decisiones/fase-$1.md` (decisiones tomadas en la entrevista), si existe.
2. `docs/GDD.md`: arquitectura (sección 1), contratos (sección 2), lógica (sección 3), balance (sección 4) y criterios de la fase.
3. `AGENTS.md`: reglas del proyecto.

Estado actual del proyecto:
!`find src tests -type f 2>/dev/null | sort`

Entrega:
- **Ficheros** a crear o modificar, con su responsabilidad.
- **Funciones y clases** con su firma y qué devuelven.
- **Pruebas**: una por cada criterio automático de la fase, con el nombre que tendrá (empieza por el código CA).
- **Riesgos** y cómo los evitas.

## Verificación
Cierra con una tabla «CA → prueba o comprobación manual que lo demuestra». Si algún CA no se puede verificar con el plan, dilo.
