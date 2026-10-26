# Mejora 01 · Oleadas automáticas

Petición de Sara: un botón para que, una vez empezada la partida, las oleadas se sigan lanzando
solas, manteniendo el botón «Siguiente oleada» para poder ir de una en una o adelantarlas.

## Comportamiento
- Nuevo botón **«Auto»** en la barra superior, junto a «Siguiente oleada», que se activa y desactiva
  (muestra si está encendido). Atajo de teclado: **A**. Empieza desactivado.
- La primera oleada se sigue lanzando a mano con «Siguiente oleada».
- Con «Auto» activado, cuando una oleada termina (todos sus enemigos han salido y el mapa está vacío)
  y quedan oleadas, empieza una **cuenta atrás de 5 segundos** y después se lanza sola la siguiente.
  Durante la cuenta atrás se puede construir, mejorar y vender.
- El botón «Siguiente oleada» muestra la cuenta atrás («Siguiente oleada en 3 s») y, si se pulsa,
  lanza la oleada al momento. Sigue funcionando igual que ahora en cualquier caso (incluido el bonus por
  adelantar una oleada que aún tiene enemigos por salir).
- La oleada automática no da bonus de oleada anticipada (no se adelanta nada).
- La pausa congela la cuenta atrás y la velocidad 2x la acelera, como al resto del juego.
- Desactivar «Auto» cancela la cuenta atrás. Al ganar o perder no se lanza nada más.

## Implementación
- La lógica va en el núcleo (`GameEngine`): estado de auto-oleadas y cuenta atrás dentro de `tick()`,
  para poder probarla con `node --test`. La interfaz solo muestra el estado y llama al motor.
- Nuevo criterio **CA-19** en la Sección 6 del GDD con su prueba `tests/CA-19_auto_waves.test.js`:
  con Auto activado la siguiente oleada empieza 5 s después de terminar la anterior; sin Auto no empieza;
  la pausa congela la cuenta atrás; desactivar Auto la cancela; no da bonus; no hace nada tras la oleada 10.
- Añade la tecla A a la prueba de atajos (`CA-15`) y a la tabla de controles del `README.md`.

No cambies nada más del juego.
