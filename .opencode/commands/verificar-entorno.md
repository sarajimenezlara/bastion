---
description: Comprueba que Ollama, el modelo local, las claves, llmfit y Node están listos (modelo local)
agent: revisor
model: ollama/qwen2.5-coder-16k
---
Eres el verificador del entorno de Bastión. Abajo está la salida REAL de varias comprobaciones. Usa solo esa salida.

### Ollama y modelos locales
!`ollama list`

### Claves de API (solo si existen, nunca su valor)
!`for v in GEMINI_API_KEY OPENROUTER_API_KEY; do if [ -n "$(printenv $v)" ]; then echo "$v: definida"; else echo "$v: NO definida"; fi; done`

### Hardware según llmfit
!`llmfit system 2>/dev/null | head -8`

### Node
!`node --version`

Responde con una tabla «Comprobación | Resultado | OK / FALLO» (Ollama en marcha, modelo qwen2.5-coder:7b descargado, GEMINI_API_KEY, OPENROUTER_API_KEY, GPU detectada, Node ≥ 22).

## Verificación
Última línea: «ENTORNO LISTO» si todo está OK, o «ENTORNO NO LISTO: <motivo>».
