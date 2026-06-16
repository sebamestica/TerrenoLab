# Auditoría de Calidad Geométrica y Altimétrica de Curvas (Contour QA)

Este documento detalla el propósito, diseño, y lógica de validación del módulo de control de calidad para las curvas de nivel (isolíneas) generadas en TerrenoLab (Fase 4.1).

---

## 1. Propósito de la Auditoría

Antes de proceder a la exportación en formatos CAD (DXF) o GIS (GeoJSON) en fases futuras, es fundamental asegurar que las curvas de nivel trazadas por el algoritmo **Marching Squares** sean geométricamente coherentes con el terreno original. Una superficie mal interpolada o parámetros de contorno inadecuados pueden generar isolíneas corruptas, bucles infinitos, o coordenadas inválidas que colapsarían herramientas CAD profesionales.

---

## 2. Validaciones Geométricas Clave

El motor de control de calidad evalúa el resultado del trazado de curvas mediante las siguientes reglas:

### A. Segmentos Fuera de Límites (Out of Bounds)
* **Qué valida**: Compara los extremos $(x_1, y_1)$ y $(x_2, y_2)$ de todos los segmentos vectoriales contra el rectángulo delimitador (bounding box) de la nube de puntos original.
* **Por qué se revisa**: El algoritmo Marching Squares debe operar estrictamente dentro del dominio de las celdas interpoladas. Si existen segmentos fuera del área física del levantamiento (incluso con tolerancias mayores a 1cm), indica un error de proyección o interpolación que generaría coordenadas erróneas.

### B. Niveles Vacíos (Empty Levels)
* **Qué significa**: El usuario define un intervalo de equidistancia (ej: cada 2 metros). Se genera una lista teórica de cotas que cruzan la superficie (ej: 100m, 102m, 104m). Si una cota de la lista no corta ninguna celda de la grilla regular, el nivel resultante tendrá cero segmentos.
* **Diagnóstico**: Si ocurre en zonas interiores, puede ser señal de una grilla discontinua. Si ocurre en los extremos, usualmente es porque la cota coincide exactamente con la cota máxima/mínima y no intersecta celdas completas. Se reporta como advertencia.

### C. Segmentos Duplicados (Duplicate Segments)
* **Qué significa**: Segmentos de línea idénticos definidos dos veces en el mismo nivel altimétrico. Se comprueba comparando coordenadas de inicio y fin redondeadas a 5 decimales.
* **Por qué se revisa**: Duplicar vectores satura innecesariamente los archivos vectoriales exportados y provoca un comportamiento extraño (parpadeo visual, doble renderizado) en visores CAD.

### D. Coordenadas NaN / Infinity
* **Qué significa**: Coordenadas numéricamente corruptas (`NaN`, `Infinity`).
* **Severidad**: Es un **Bloqueador Crítico**. Cualquier valor indefinido detiene inmediatamente la posibilidad de exportación futura.

### E. Niveles Fuera del Rango Altimétrico de la Superficie
* **Qué valida**: Asegura que no se dibujen curvas por encima de la cota máxima del grid interpolado o por debajo de la cota mínima.
* **Por qué se revisa**: Previene la generación de "curvas fantasmas" o decorativas que no representan la realidad física del terreno.

---

## 3. Estados del QA y Criterio de Exportación

El resultado final se clasifica en tres estados:

1. **Estable (Verde)**: Las curvas se generaron sin errores matemáticos ni anomalías críticas. Listas para futura exportación.
2. **Advertencia (Amarillo)**: Curvas generadas con leves desviaciones (ej: segmentos duplicados menores, niveles vacíos o rango altimétrico muy plano). Se permite ver y continuar a exportación, pero con un aviso.
3. **Crítico (Rojo - Bloqueado)**: Errores geométricos severos o problemas de memoria (ej. > 300 niveles). **No se permite exportar** ni avanzar en el flujo de trabajo.

---

## 4. Limitaciones Actuales

* **Ausencia de Suavizado (Smoothing)**: Las curvas se trazan con segmentos rectos puros interpolados linealmente entre los bordes de celda. Esto garantiza precisión matemática exacta con el grid regular, pero visualmente pueden verse facetadas en resoluciones bajas.
* **Datos Planos**: Terrenos con un rango $\Delta Z < 10\text{cm}$ generarán advertencias debido a la inestabilidad de isolíneas con pendientes casi nulas.
