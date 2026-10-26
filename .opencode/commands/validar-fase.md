---
description: Inyecta GDD, tests, evidencia manual y estructura del proyecto para que el agente revisor valide la fase especificada.
agent: revisor
model: ollama/qwen2.5-coder-16k
---

Por favor, audita la **Fase $1** del desarrollo de Bastión basándote en las siguientes evidencias inyectadas del sistema:

---
### 1. CRITERIOS DE ACEPTACIÓN DEL GDD (Fase $1)
!`sed -n '/### Fase $1/,/### Fase/p' docs/GDD.md | sed '$d'`

---
### 2. EVIDENCIA DE PRUEBAS UNITARIAS (`npm test`)
!`npm test 2>&1`

---
### 3. ESTRUCTURA Y ARCHIVOS DEL PROYECTO
!`find src tests -type f 2>/dev/null`

---
### 4. EVIDENCIA MANUAL (criterios marcados como [MANUAL])
!`cat docs/validacion/fase-$1-prueba-navegador.md 2>/dev/null || echo "Sin evidencia manual registrada para esta fase."`

---

## Instrucciones para el Revisor
1. Extrae los Criterios de Aceptación (CA) indicados en la sección 1.
2. Cruza cada CA con los resultados del suite de pruebas (sección 2) y los archivos presentes en el proyecto (sección 3).
3. Los criterios marcados como [MANUAL] no tienen prueba automática: valídalos SOLO con la sección 4. Si la sección 4 los cubre con resultado CUMPLE, márcalos CUMPLE citándola; si no hay evidencia manual, márcalos NO VERIFICABLE.
4. Emite la tabla de evaluación y el veredicto correspondiente siguiendo tus reglas de formato.

## Verificación
- **Qué comprobar:** Que las inyecciones de shell `!` devuelvan el bloque correcto del GDD para la Fase $1, el resultado de la ejecución de pruebas y el árbol de ficheros sin errores de ruta.
- **Cómo comprobarlo:** Ejecutar `/validar-fase 1` (o el número de fase correspondiente) en la interfaz de OpenCode y comprobar que el contexto inyectado sea legible y pertinente.
