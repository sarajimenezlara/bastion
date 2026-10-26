# Cómo se ha hecho Bastión

Este documento explica cómo se diseñó, construyó y validó el juego usando llmfit, Ollama,
OpenRouter, Gemini (API, gemas y metagema) y OpenCode (configuración, plan/build, contexto,
agentes y comandos), y dónde está la evidencia de cada paso.

## 1. El flujo completo

```text
 GEMINI (web)                                   OPENCODE (terminal)
 ────────────                                   ───────────────────
 Prompt «para no técnicos»                      opencode.json: 3 proveedores + Ollama
        │                                       (claves con {env:...}, modelo por papel)
        ▼                                               │
 METAGEMA ──crea──► Gema Diseñadora ─┐                  │  /verificar-entorno (modelo local)
            ──crea──► Gema Prompts ──┼──► agentes y     │  /init → AGENTS.md (contexto)
            ──crea──► Gema QA        │    comandos ───► │
                                     │                  ▼
 Gema Diseñadora me entrevista ──► GDD ──────────► por cada fase:
        ▲                            │               /entrevista N   (agente entrevistador: me pregunta)
        │                            ▼               /planificar-fase N (agente plan, no toca ficheros)
        │                     Gema QA valida el GDD   /construir-fase N  (agente build + npm test)
        │                     (NO APTO → v2 → APTO)   /validar-fase N    (subagente revisor, Ollama local)
        │                                             /informe-qa N      (OpenRouter) ─────┐
        │                                                                                  ▼
        └──── simulación: el balance no se puede ganar ◄──── Gema QA: APTO / NO APTO ◄─────┘
              → la Diseñadora propone v2.1                    NO APTO → /corregir <prompt>
```

## 2. Dónde se usa cada elemento exigido

| Elemento | Uso en el proyecto | Evidencia |
|---|---|---|
| **llmfit** | Analizar el hardware (RTX 4050 de 6 GB, 15 GB de RAM) y elegir el modelo local. Recomienda Qwen2.5-Coder 7B (cabe en la GPU) y descarta `gemma4:26b` (pide ~25 GB de RAM). | `docs/01-llmfit/` |
| **Ollama** | Ejecuta el modelo local `qwen2.5-coder-16k`, creado con un Modelfile para ampliar el contexto a 16k. Lo usan el subagente `revisor` y `/verificar-entorno`: la revisión es privada y gratuita. | `ollama/Modelfile`, `.opencode/agents/revisor.md` |
| **OpenRouter** | Modelo gratuito `poolside/laguna-s-2.1:free` para `/prompt` e `/informe-qa`. La clave tiene un límite de gasto de 1 $. | `opencode.json`, `.opencode/commands/informe-qa.md` |
| **Gemini (API)** | `google/gemini-3.1-flash-lite` como modelo por defecto de OpenCode (`plan`, `/init`, entrevistador). | `opencode.json` |
| **Metagema** | La Metagema de clase genera las instrucciones de las tres gemas del proyecto. | `docs/02-gemini/00…04-*` |
| **Gemas** | **Diseñadora** (entrevista y GDD), **Prompts para OpenCode** (genera agentes y comandos), **Revisora QA** (valida cada entregable). | `docs/02-gemini/gema-*-instrucciones.md`, `capturas/` |
| **opencode.json** | Proveedores Google, OpenRouter y Ollama; claves leídas de variables de entorno; `external_directory: deny`. | `opencode.json` |
| **Plan / Build / contexto** | `/init` genera `AGENTS.md`, completado con las reglas del proyecto. Cada fase se planifica con `plan` (no puede editar) y se construye con `build`. | `AGENTS.md`, `docs/04-opencode/sesiones/` |
| **Agentes** | `entrevistador` (pregunta con la herramienta `question` y solo escribe en `docs/decisiones/`) y `revisor` (subagente local sin herramientas). Los dos los generó la gema «Prompts para OpenCode». | `.opencode/agents/`, `docs/03-gema-a-opencode/` |
| **Comandos** | `/entrevista`, `/planificar-fase`, `/construir-fase`, `/validar-fase`, `/informe-qa`, `/corregir`, `/verificar-entorno`, más `/prompt` y `/refactor` de clase. Inyectan datos reales con `` !`orden` `` y fijan `agent` y `model`. | `.opencode/commands/` |

### Modelo por papel

Las cuotas gratuitas obligaron a repartir el trabajo: los Gemini Flash solo admiten 20 peticiones al
día y un agente gasta una por cada paso.

| Papel | Modelo | Motivo |
|---|---|---|
| Por defecto, `plan`, entrevistador | `google/gemini-3.1-flash-lite` | Gemini con 500 peticiones al día |
| `build` (escribe el código) | `opencode/deepseek-v4.1-flash-free` | Gratuito y apto para muchas llamadas a herramientas |
| Revisor, `/verificar-entorno` | `ollama/qwen2.5-coder-16k` | Local y privado, elegido con llmfit |
| `/prompt`, `/informe-qa` | `openrouter/poolside/laguna-s-2.1:free` | Tareas de texto, gratis |

## 3. Relaciones entre Gemini y OpenCode

- **Gemini → OpenCode (diseño):** la Diseñadora entrevista y escribe el GDD (`docs/GDD.md`). Es la
  fuente de verdad que leen todos los comandos y agentes.
- **Gemini → OpenCode (herramientas):** la gema «Prompts para OpenCode» generó los ficheros del agente
  `entrevistador`, del agente `revisor` y del comando `/validar-fase`.
- **OpenCode → Gemini (validación):** `/informe-qa` redacta el informe de cada fase, que se pega en la
  Revisora QA. Si da NO APTO, su prompt de corrección vuelve a OpenCode con `/corregir`.
- **OpenCode → Gemini (diseño):** cuando la simulación demostró que el juego no se podía ganar, los datos
  volvieron a la Diseñadora, que propuso el balance v2.1.

## 4. Verificación y validación

Cada fase pasa por cinco filtros:

1. **Entrevista:** el agente `entrevistador` me pregunta lo que el GDD deja abierto (`docs/decisiones/`).
2. **Pruebas automáticas:** `npm test`, con 119 pruebas. Cada criterio CA tiene pruebas cuyo nombre
   empieza por su código.
3. **Revisor local:** `/validar-fase N`, con Ollama, contrasta los criterios con la salida real de las pruebas.
4. **Revisora QA de Gemini:** recibe el informe y el código, y da APTO o NO APTO (`docs/validacion/`).
5. **Comprobaciones propias:** simulación de partidas completas (`npm run simular`) y partida real en el
   navegador abriendo `index.html` con `file://` (`docs/validacion/fase-5-prueba-navegador.md`).

| Fase | Criterios | Revisor local | Gema QA |
|---|---|---|---|
| Diseño (GDD) | (a) file://, (b) comprobable, (c) datos completos | — | v1 NO APTO → v2 APTO |
| 1 · Núcleo | CA-01 a CA-03 | Aprobado | APTO |
| 2 · Construcción y reventa | CA-04 a CA-06 | Aprobado | APTO |
| 3 · Torres y proyectiles | CA-07 a CA-10 | Aprobado | APTO |
| 4 · Oleadas | CA-11 a CA-13 | Aprobado | APTO |
| Corrección 01 | balance v2.1, CA-17, CA-18 | — | APTO |
| 5 y 6 · Interfaz | CA-14 a CA-16 (manuales) | Aprobado | APTO |

### Fallos encontrados (y quién los encontró)

| # | Fallo | Quién lo detectó | Solución |
|---|---|---|---|
| 1 | El GDD v1 no tenía costes base ni velocidad de proyectiles | Gema QA | GDD v2 |
| 2 | El GDD usaba módulos ES, que no cargan con doble clic (`file://`); la QA lo dio por bueno | Revisión humana de la respuesta de la QA | La QA rectificó; patrón UMD + `require` en las pruebas |
| 3 | El agente `revisor` generado por la gema tenía `mode: plan` (no válido) | Revisión del artefacto | `mode: subagent` |
| 4 | El modelo local respondía basura: Ollama recortaba el contexto | `/verificar-entorno` | Modelfile con `num_ctx 16384` |
| 5 | El revisor local dijo que Node v26 «no cumple ≥ 22» | El agente principal (Gemini) lo comprobó ejecutando `node --version` | Verificación cruzada local + nube |
| 6 | `/init` tomaba `~/clase` como raíz del proyecto | Fallo de permisos (`external_directory: deny`) | Repositorio git propio en `bastion/` |
| 7 | Cuota de Gemini Flash agotada (20 peticiones/día) | Error 429 de la API | Modelo por papel (tabla de arriba) |
| 8 | Modelos gratuitos de OpenRouter caídos o inadecuados | Errores 429/404 | Prueba previa de varios modelos; Laguna |
| 9 | **Con el balance del GDD el juego era imposible de ganar** | Simulación de partidas (`npm run simular`) | La Diseñadora propuso v2.1, probada antes de aplicarla; CA-18 |
| 10 | La clase `Map` pisaba el `Map` nativo en el navegador | Revisión de código | Renombrada a `GameMap` |
| 11 | No se podía adelantar una oleada (el bonus era inalcanzable) | Simulación | `callNextWave()`, CA-17 |
| 12 | «Jugar» lanzaba la oleada 1 sin dejar construir | Partida en el navegador | Corrección 02 |
| 13 | Repetir la tecla de una torre la deseleccionaba | Partida en el navegador | Corrección 02 |
| 14 | El revisor no podía validar los criterios manuales | El agente lo detectó y **me preguntó** si arreglaba `/validar-fase` | El comando inyecta la evidencia manual |

**Mejora pendiente:** pulsando «Siguiente oleada» sin parar y sin construir se consiguen 839 puntos
con los bonus. Limitarlo es una decisión de diseño que correspondería a la Diseñadora.

## 5. Estructura de la documentación

| Carpeta | Contenido |
|---|---|
| `docs/01-llmfit/` | Hardware, recomendaciones y fichas de los modelos |
| `docs/02-gemini/` | Metagema, instrucciones de las gemas, entrevista, GDD v1/v2/v2.1, balance y capturas |
| `docs/03-gema-a-opencode/` | Artefactos de OpenCode generados por la gema «Prompts para OpenCode» |
| `docs/04-opencode/sesiones/` | Todas las sesiones de OpenCode exportadas a Markdown (con los subagentes) |
| `docs/decisiones/` | Lo que respondí al agente entrevistador en cada fase |
| `docs/validacion/` | Informes del revisor local, de la QA, correcciones, simulaciones y capturas del navegador |
| `docs/GDD.md` | GDD vigente (v2.1) |

## 6. Cómo reproducirlo

```bash
export GEMINI_API_KEY=...        # Google AI Studio
export OPENROUTER_API_KEY=...    # OpenRouter
ollama pull qwen2.5-coder:7b && ollama create qwen2.5-coder-16k -f ollama/Modelfile
opencode                          # dentro de esta carpeta
```

Dentro de OpenCode: `/verificar-entorno`, y para cada fase `/entrevista N` → `/planificar-fase N`
→ `/construir-fase N` → `/validar-fase N` → `/informe-qa N` (el informe se pega en la gema QA).
Fuera: `npm test` y `npm run simular`.
