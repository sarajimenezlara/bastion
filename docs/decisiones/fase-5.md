# Registro de Decisiones - Fase 5

## Decisión 1
* **Fecha:** 2026-10-26
* **Pregunta / Ambigüedad:** Estructura de la interfaz de usuario (UI) en HTML/DOM.
* **Respuesta / Decisión:** Se implementará una estructura clásica: Barra superior (vidas, oro, oleada, estado, botones de control de tiempo/flujo), Panel inferior de torres (4 tarjetas con coste y teclas 1-4, dinámicamente activas según oro), Panel lateral derecho (detalles de torre seleccionada, mejora y venta). Pantallas de estado (Inicio, Victoria, Derrota) como capas HTML sobre el canvas.
* **Criterio de Aceptación (CA) afectado:** CA-14, CA-15.

## Decisión 2
* **Fecha:** 2026-10-26
* **Pregunta / Ambigüedad:** Estilo visual y renderizado en Canvas.
* **Respuesta / Decisión:** Estilo geométrico limpio mediante primitivas de Canvas (sin assets externos). Mapa: damero de dos tonos de verde, camino de tierra con borde, entrada y meta marcada. Torres: colores distintivos (Ballesta marrón, Cañón gris, Escarcha azul, Arcana violeta) con marcas de nivel. Enemigos: círculos escalados por tipo con barra de vida, teñido azul al estar ralentizados. UX: Previsualización de torre y rango al pasar ratón (verde/rojo según disponibilidad), efecto de impacto para el Cañón. Bucle de render: `requestAnimationFrame` con `deltaTime` limitado a 0.1s para estabilidad.
* **Criterio de Aceptación (CA) afectado:** CA-14, CA-15, CA-16.
