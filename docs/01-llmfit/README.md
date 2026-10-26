# llmfit · elección del modelo local

| Fichero | Qué contiene |
|---|---|
| `sistema.txt` | `llmfit system`: i7-13620H, 15,3 GB de RAM, RTX 4050 Laptop de 6 GB (CUDA) |
| `recomendacion-coding.txt` / `.json` | `llmfit recommend --use-case coding`: los mejores modelos de código para este equipo |
| `info-qwen2.5-coder-7b.txt` | Ficha del modelo elegido: 7,6B, Q4_K_M, cabe en la GPU (5,4 de 6 GB) a unos 36 tokens/s |
| `info-gemma4-26b.txt` | Ficha del `gemma4:26b` que ya estaba en Ollama: pide 24,7 GB de RAM recomendados, demasiado para 15 GB |

**Decisión:** `qwen2.5-coder:7b` en Ollama (`ollama pull qwen2.5-coder:7b`). Después se creó
`qwen2.5-coder-16k` con `../../ollama/Modelfile`, porque con el contexto por defecto las instrucciones de
sistema de OpenCode no cabían y el modelo respondía sin sentido.
