# Guía de estudio · Bastión

Para preparar la defensa. Sigue el orden de las diapositivas.

## La idea en una frase
El juego es un tower defense, pero lo que se evalúa es **cómo se ha hecho**: diseñado con gemas de
Gemini (creadas con una metagema) y construido y validado fase a fase por agentes y comandos de
OpenCode, usando tres proveedores de modelos (Gemini, OpenRouter y Ollama local elegido con llmfit).

## Diapositiva a diapositiva

| # | Frase | Qué explicar |
|---|---|---|
| 2 | llmfit | Analiza el hardware (RTX 4050 de 6 GB, 15 GB de RAM) y dice qué modelo cabe **antes de descargarlo**. Eligió Qwen2.5-Coder 7B y descartó el gemma4:26b, que pide unos 25 GB de RAM. |
| 3 | Ollama | Ejecuta el modelo en local: privado y gratis. Al principio respondía sin sentido porque Ollama recorta el contexto; se arregló con un **Modelfile** (`num_ctx 16384`). Lo usa el agente revisor. |
| 4 | Metagema | Una gema que escribe las instrucciones de otras gemas. Con ella salieron 3: **Diseñadora**, **Prompts para OpenCode** y **Revisora QA**. |
| 5 | Diseñadora | Me entrevistó en 5 rondas (vidas y oro, torres, enemigos, mapa e interfaz), me enseñó un resumen y escribió el **GDD** (documento de diseño) con 16 criterios de aceptación (CA). |
| 6 | Revisora QA | Suspendió el GDD v1 (faltaban datos), pero dio por bueno un error: los módulos `import/export` no cargan con doble clic. Se lo rebatí, lo reconoció y el v2 fue APTO. **Hay que auditar a la IA.** |
| 7 | opencode.json | Conecta los 3 proveedores. Las claves se leen con `{env:...}`, nunca van en el código. Cada modelo tiene su papel (ver tabla abajo). |
| 8 | /init | Crea `AGENTS.md`, la memoria del proyecto que OpenCode lee siempre. Le añadí reglas estrictas. |
| 9 | Ciclo por fase | `/entrevista` → `/planificar-fase` (plan) → `/construir-fase` (build) → `/validar-fase` (revisor local) → `/informe-qa` → gema QA. |
| 10 | Entrevistador | Agente que **me hace preguntas** con la herramienta `question`, de una en una y con opciones. Solo puede escribir en `docs/decisiones/`. |
| 11 | 5 filtros | Pruebas automáticas, revisor local, revisora de Gemini, simulación de partidas y partida real en el navegador. |
| 12 | Simulación | Todas las IA aprobaron, pero simulando partidas **ninguna estrategia ganaba**. Los datos volvieron a la diseñadora, que hizo el balance v2.1. |
| 13 | 14 fallos | Todos documentados en `docs/PROCESO.md`. |
| 14 | 129 pruebas | Más el botón Auto, que pedí después con el mismo flujo (CA-19). |
| 15 | Conclusión | Ninguna herramienta es infalible; la clave es verificar cada paso y decidir tú. |

## Modelos y su papel

| Papel | Modelo | Por qué |
|---|---|---|
| Por defecto, `plan`, entrevistador | Gemini 3.1 Flash Lite | 500 peticiones/día (los Flash normales solo 20) |
| `build` (escribe el código) | DeepSeek V4.1 Flash (gratis en OpenCode) | Aguanta muchas llamadas |
| Revisor | Qwen2.5-Coder 7B en Ollama | Local, privado, elegido con llmfit |
| `/prompt`, `/informe-qa` | Laguna S 2.1 (gratis en OpenRouter) | Tareas de texto cortas |

## Conceptos que te pueden preguntar

- **plan vs build:** plan solo lee y propone (no puede editar ficheros); build implementa y ejecuta.
- **Agente vs comando:** el agente es **quién** (rol, modelo y permisos); el comando es **qué hacer** (una
  plantilla de prompt reutilizable). Por ejemplo, `/validar-fase` (comando) lo ejecuta `revisor` (agente).
- **Subagente:** un agente al que el principal le pasa una tarea. El revisor es subagente.
- **`` !`orden` `` en un comando:** mete en el prompt la salida real de una orden (por ejemplo, `npm test`).
- **Gema vs metagema:** la gema es un asistente con instrucciones fijas; la metagema crea las instrucciones de otras gemas.
- **CA (criterio de aceptación):** condición comprobable. Cada CA automático tiene su prueba (`tests/CA-xx…`).
- **Por qué un patrón UMD:** para que el mismo código funcione abriendo `index.html` con doble clic y también en los tests de Node.
- **Por qué no se usó Gemini Flash para todo:** el nivel gratuito solo da 20 peticiones al día y un agente gasta una por paso.

## Preguntas probables (y respuesta corta)

- **¿El código lo escribiste tú?** No. Lo escribieron los agentes de OpenCode (build). Yo definí el diseño, las
  reglas y los comandos, y revisé y validé cada fase.
- **¿Cómo sabes que funciona?** 129 pruebas automáticas, revisión local y de Gemini en cada fase,
  simulación de partidas completas y partida real en el navegador.
- **¿Qué relación hay entre Gemini y OpenCode?** Gemini diseña (GDD) y genera agentes y comandos; OpenCode construye; los
  informes vuelven a la gema QA de Gemini; y los datos de la simulación volvieron a la diseñadora.
- **¿Qué fallo te pareció más interesante?** El juego imposible de ganar: las pruebas unitarias no lo
  ven porque prueban piezas sueltas; hizo falta simular partidas enteras.
- **¿Para qué sirve llmfit si ya tienes Ollama?** Ollama ejecuta modelos; llmfit dice cuáles caben y a qué
  velocidad irán en tu hardware, antes de descargar gigas.

## Las respuestas de diseño (repásalas: las di en tu nombre)
- 20 vidas, 220 de oro inicial (eran 150, se subió en el balance v2.1), 10 oleadas, jefes en la 5 y la 10.
- Torres: Ballesta 50, Cañón 100 (daño en área), Escarcha 80 (ralentiza un 40 % durante 2 s), Arcana 150 (ignora armadura).
  Mejoras hasta nivel 3 (coste base × nivel); vender devuelve el 70 %.
- Mapa de 20 × 12 casillas en forma de serpiente; no se construye en el camino.
- Detalle completo: `docs/02-gemini/entrevista-gdd/` y `docs/decisiones/`.
