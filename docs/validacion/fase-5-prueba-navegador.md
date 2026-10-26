# Fases 5 y 6 · Prueba manual en el navegador

Navegador: Opera GX (Chromium 152), abriendo `index.html` con `file://`, sin servidor.
Interacción real con ratón y teclado mediante el protocolo de depuración (CDP). Capturas en `capturas/`.

| CA | Comprobación | Resultado |
|---|---|---|
| CA-14 | Abrir `index.html` con doble clic: carga sin errores ni bloqueos CORS y muestra «Jugar» | CUMPLE: consola sin errores (`01-inicio.png`) |
| CA-15 | Teclas 1-4 eligen torre; Espacio pausa («Reanudar»); F cambia 1x ↔ 2x; Escape cancela; panel con Mejorar/Vender | CUMPLE (`02`, `04`, `05`, `08`) |
| CA-16 | Al perder aparece la capa «Derrota» con puntuación y «¡Nuevo récord!»; `localStorage` guarda `bastion.record` | CUMPLE (`07-derrota.png`) |

## Fallos encontrados y corregidos (corrección 02)
1. «Jugar» lanzaba la oleada 1 sin dejar construir → ahora empieza en la oleada 0 en fase de construcción.
2. Repetir la tecla de una torre la deseleccionaba → ahora la selección se mantiene y Escape la cancela.

Comprobado de nuevo tras la corrección: oleada 0/10 y 0 enemigos tras «Jugar»; tres Ballestas seguidas
con la tecla 1; Escape cancela; consola sin errores.

## Mejora pendiente (decisión de diseño, no fallo)
Pulsando «Siguiente oleada» sin parar y sin construir nada se llega a 839 puntos con los bonus de
oleada anticipada. Se podría limitar el bonus, pero es un cambio de diseño que tendría que decidir la
gema diseñadora.
