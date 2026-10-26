### 🤖 PROMPT DE CORRECCIÓN PARA OPENCODE

Se ha revisado la entrega del Game Design Document (GDD) y se han detectado fallos bloqueantes de arquitectura y especificación que impiden el cumplimiento de los criterios:

1. [Incompatibilidad Crítica en Criterio (a) - Ejecución `file://` sin servidor]:
   - El uso de `<script type="module">` con sentencias `import` provoca un bloqueo CORS nativo en navegadores Chromium/Opera al abrir `index.html` con doble clic (protocolo `file://`).
   - **Solución requerida:** Modificar la arquitectura del Core para usar el patrón de exportación condicional CommonJS/Global. Los archivos en `src/core/` deben cargarse en `index.html` como `<script src="...">` estándar (sin `type="module"`) registrando sus clases en el objeto global `window`, y exportar sus módulos mediante `if (typeof module !== 'undefined') module.exports = { ... };` para que `node --test` pueda importarlos y probarlos en entorno headless sin necesidad de transpiladores ni paso de build.

2. [Falta de datos en Balance de Torres (Tabla 1)]:
   - Añadir explícitamente en la Tabla 1 los costes base de compra (Nivel 1) para cada una de las 4 torres (Ballesta, Cañón, Escarcha, Arcana).

3. [Contradicción en CA-07 vs Tabla 1]:
   - Corregir el enunciado del criterio CA-07 eliminando la fórmula contradictoria ($\text{CosteBase} \times \text{NivelDestino}$) y haciendo referencia directa a los valores numéricos fijos de mejora establecidos en la Tabla 1.

4. [Vacío de especificación en Proyectiles, Tolerancias y Escalado]:
   - Especificar la velocidad en px/s de los proyectiles para cada tipo de torre y la tolerancia en píxeles para el impacto/waypoint.
   - Especificar el redondeo exacto (`Math.floor`) para la fórmula de salud de los enemigos en CA-09.

Requisitos de corrección:
- Actualizar el GDD reflejando la solución de compatibilidad dual (`file://` y `node --test`) sin dependencias externas ni servidores local/build.
- Garantizar que todos los parámetros de balance estén 100% definidos.
