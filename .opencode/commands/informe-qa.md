---
description: Prepara el informe de una fase para pegarlo en la gema «Bastión · Revisora QA» de Gemini
agent: plan
model: openrouter/openrouter/free
---
Redacta un mensaje para la revisora de calidad de Gemini sobre la **Fase $1** de Bastión. Usa SOLO los datos de abajo, sin inventar nada.

Empieza con: «Revisa la Fase $1 de Bastión con tus criterios. Estos son los criterios de aceptación y las evidencias:» y después incluye, sin resumirlos: los criterios, la salida de las pruebas, la lista de ficheros y el veredicto del revisor local si aparece.

### Criterios de aceptación de la fase
!`sed -n '/### Fase $1/,/^### Fase/p' docs/GDD.md`

### Salida de npm test
!`npm test 2>&1 | tail -40`

### Ficheros del proyecto
!`find src tests -type f | sort`

### Informe del revisor local (si existe)
!`cat docs/validacion/fase-$1-revisor.md 2>/dev/null || echo "Sin informe del revisor local"`

## Verificación
Antes de entregar el mensaje, comprueba que contiene los cuatro bloques y que no has cambiado ningún número de la salida de las pruebas.
