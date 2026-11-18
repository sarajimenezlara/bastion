# Guía de estudio · Bastión

Para preparar la defensa. Sigue el orden de las diapositivas.

## La idea en una frase
El juego es un tower defense, pero lo que se evalúa es **cómo se ha hecho**: diseñado con gemas de
Gemini (creadas con una metagema) y construido y validado fase a fase por agentes y comandos de
OpenCode, usando tres proveedores de modelos (Gemini, OpenRouter y Ollama local elegido con llmfit).

## Antes de empezar (lo que tienes abierto)

- **Opera:** pestaña de la presentación (en «Vista de presentador»), pestaña del juego
  (`~/Descargas/bastion-jugar/index.html`) y pestaña de Gemini → Mis Gems.
- **VS Code:** la carpeta `~/clase/ia/bastion`. Para abrir cualquier fichero rápido: `Ctrl+P` y escribes el nombre.
  Para ver un `.md` bonito: `Ctrl+Shift+V`.
- **Terminal 1:** OpenCode abierto. **Terminal 2:** el resultado de `npm test`.

En cada diapositiva tienes: **Entra en** (qué enseñar, solo si te da tiempo o te lo piden) y **Di** (lo que
cuentas). Si vas justa de tiempo, quédate en las diapositivas y enseña solo lo marcado con ⭐.

## Diapositiva a diapositiva

### 1 · Portada
- **Entra en:** nada.
- **Di:** «Mi trabajo es Bastión, un tower defense. Pero lo importante no es el juego, sino cómo se ha hecho:
  lo diseñaron gemas de Gemini y lo construyeron y validaron, fase a fase, agentes de OpenCode.»

### 2 · llmfit
- **Entra en:** VS Code → `docs/01-llmfit/README.md` (y si quieres `recomendacion-coding.txt`).
- **Di:** «Lo primero fue saber qué modelo local podía usar. llmfit analiza mi hardware, una RTX 4050 de 6 GB
  y 15 GB de RAM, y te dice qué modelos caben antes de descargarlos. Me recomendó Qwen2.5-Coder 7B y descartó
  gemma4 de 26B, que pide unos 25 GB de RAM.»

### 3 · Ollama
- **Entra en:** VS Code → `ollama/Modelfile`.
- **Di:** «Ese modelo lo ejecuto con Ollama, en local: es privado y gratis. Al principio respondía sin sentido,
  porque Ollama recorta el contexto por defecto. Lo arreglé con este Modelfile, que amplía el contexto a 16.000
  tokens. Este modelo es el del agente revisor.»

### 4 · Metagema ⭐
- **Entra en:** Opera → pestaña de Gemini → Mis Gems. Enseña la Metagema y las 3 gemas de Bastión.
- **Di:** «Una metagema es una gema que escribe las instrucciones de otras gemas. Con la Metagema de clase creé
  tres: la Diseñadora, la de Prompts para OpenCode y la Revisora QA.»

### 5 · Diseñadora
- **Entra en:** Opera → abre la gema «Diseñadora», o VS Code → `docs/GDD.md`.
- **Di:** «La Diseñadora me entrevistó en cinco rondas: vidas y oro, torres, enemigos, mapa e interfaz. Me
  enseñó un resumen y escribió el GDD, el documento de diseño, con 16 criterios de aceptación. Ese GDD es
  la fuente de verdad que leen todos los agentes.»

### 6 · Revisora QA
- **Entra en:** VS Code → `docs/02-gemini/capturas/11-qa-corrige-esm.png`.
- **Di:** «La Revisora QA suspendió la primera versión del GDD porque faltaban datos. Pero dio por bueno un
  error: los módulos import/export no funcionan abriendo el juego con doble clic. Se lo rebatí, lo reconoció,
  y la versión 2 salió APTA. Conclusión: a la IA también hay que auditarla.»

### 7 · opencode.json ⭐
- **Entra en:** VS Code → `opencode.json`.
- **Di:** «Aquí conecto OpenCode con los tres proveedores: Google para Gemini, OpenRouter y Ollama en local.
  Las claves no están escritas: se leen de variables de entorno con `{env:...}`. Y cada modelo tiene su
  papel, porque las cuotas gratuitas no daban para usar uno solo.» (Señala `model` y `small_model`.)

### 8 · /init
- **Entra en:** VS Code → `AGENTS.md` (baja hasta «Reglas Estrictas»).
- **Di:** «Con /init OpenCode analiza el proyecto y crea AGENTS.md, que es su memoria: lo lee siempre antes de
  trabajar. Yo le añadí reglas estrictas, como que todo funcione abriendo index.html y que cada criterio tenga
  su prueba.»

### 9 · Ciclo por fase ⭐
- **Entra en:** Terminal 1 (OpenCode) → escribe `/` y se ve la lista de comandos.
- **Di:** «Cada fase del juego sigue el mismo ciclo de comandos: /entrevista, donde me pregunta; /planificar-fase
  con el agente plan, que no puede tocar ficheros; /construir-fase con build, que escribe el código y pasa las
  pruebas; /validar-fase con el revisor local; y /informe-qa, cuyo informe pego en la gema QA.»

### 10 · Entrevistador ⭐
- **Entra en:** VS Code → `.opencode/agents/entrevistador.md` y luego `docs/decisiones/fase-1.md`.
- **Di:** «Como pedía el trabajo, OpenCode me va preguntando. Este agente usa la herramienta question: me hace
  las preguntas de una en una y con opciones. Por permisos, solo puede escribir en docs/decisiones, donde
  guarda lo que respondí. El agente lo generó la gema de Prompts.»
- (Si te preguntan la diferencia agente/comando: el agente es **quién**, con su modelo y permisos; el comando
  es **qué hacer**.)

### 11 · 5 filtros
- **Entra en:** VS Code → `.opencode/commands/validar-fase.md` (señala las líneas con `` !` ``).
- **Di:** «Cada fase pasa cinco filtros: pruebas automáticas, el revisor local, la revisora de Gemini, una
  simulación de partidas y una partida real en el navegador. El comando de validación mete en el prompt la
  salida real de npm test, así el revisor no puede inventarse que las pruebas pasan.»

### 12 · Simulación ⭐
- **Entra en:** VS Code → `docs/validacion/simulacion-balance-v2.txt` y luego `simulacion-balance-v2.1.txt`.
- **Di:** «Todas las IA aprobaron las fases, pero al simular partidas completas ninguna estrategia ganaba: el
  juego era imposible. Las pruebas unitarias no lo veían porque prueban piezas sueltas. Llevé esos datos a la
  Diseñadora, que propuso el balance 2.1, y lo comprobé simulando antes de aplicarlo.»

### 13 · 14 fallos
- **Entra en:** VS Code → `docs/PROCESO.md`, apartado «Fallos encontrados» (con `Ctrl+Shift+V`).
- **Di:** «En total encontré 14 fallos, y están todos documentados con quién los detectó y cómo se arreglaron.
  Algunos los encontró la IA, otros yo jugando o revisando lo que la IA había dado por bueno.»

### 14 · 129 pruebas ⭐
- **Entra en:** Terminal 2 (las pruebas en verde) y después Opera → pestaña del juego: pulsa Jugar, coloca un
  par de torres (teclas 1-4 y clic), lanza la oleada y activa **Auto** (tecla A).
- **Di:** «El resultado: 129 pruebas en verde y un juego que se abre con doble clic. Después pedí un botón Auto
  para que las oleadas sigan solas, y lo hice con el mismo flujo: petición, agente build, criterio CA-19 con
  sus pruebas, prueba en el navegador y validación de la gema QA.»

### 15 · Conclusión
- **Entra en:** nada.
- **Di:** «Lo que me llevo es que ninguna herramienta es infalible: ni el modelo local, ni Gemini, ni las
  pruebas. La clave es verificar cada paso y que la que decide sea yo.»

### Si te piden enseñar algo concreto

| Te piden | Dónde |
|---|---|
| Una sesión de OpenCode | Terminal 1 → `/session`, o VS Code → `docs/04-opencode/sesiones/03-fase-1.md` |
| Cambiar de agente | Terminal 1 → tecla `Tab` |
| Las instrucciones de una gema | `docs/02-gemini/gema-*-instrucciones.md` |
| La entrevista con la Diseñadora | `docs/02-gemini/entrevista-gdd/` |
| Un informe de la gema QA | `docs/validacion/fase-1-gema-qa.txt` o `docs/02-gemini/capturas/16-qa-fase-1.png` |
| El código del juego | `src/core/` (lógica) y `src/presentation/` (dibujo e interfaz) |
| Una prueba | `tests/` (cada fichero empieza por su CA) |

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
