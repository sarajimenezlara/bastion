# Corrección 02 · Hallazgos de la prueba manual en el navegador (Fases 5 y 6)

Origen: partida jugada en Opera abriendo `index.html` con `file://` (sin servidor), con clics y
teclado reales. Capturas en `docs/validacion/capturas/`. CA-14, CA-15 y CA-16 se cumplen y la
consola no muestra errores, pero hay dos fallos de jugabilidad que contradicen el GDD y la entrevista.

## 1. «Jugar» lanza la oleada 1 sin dejar construir
En la captura `02-colocando-ballesta.png` ya hay enemigos en el camino antes de construir nada.
El GDD (entrevista, bloque 1) dice que entre oleadas hay tiempo para construir y que la siguiente
oleada se lanza con el botón «Siguiente oleada».
- Al pulsar «Jugar» la partida empieza en la oleada 0, en fase de construcción, sin enemigos.
- El botón «Siguiente oleada» lanza la oleada 1 (sin bonus, porque no hay ninguna activa).
- Añade una prueba que lo compruebe en la capa de lógica (por ejemplo, que el controlador o el motor
  quedan en oleada 0 y sin spawns tras empezar la partida).

## 2. Repetir la tecla de una torre la deselecciona
Pulsar `1`, construir una Ballesta, volver a pulsar `1` y hacer clic no construye la segunda:
la segunda pulsación deselecciona la torre.
- Pulsar `1`-`4` siempre selecciona esa torre (nunca la deselecciona).
- La selección se mantiene después de construir, para poder colocar varias seguidas.
- `Escape` o el clic derecho cancelan la selección.
- Añade la prueba correspondiente en `tests/CA-15_hotkeys.test.js`.

No cambies nada más de la interfaz.
