# Auditoría de Volumen y Consistencia de Costos - TerrenoLab (Fase 7.1)

Este documento detalla la metodología de cálculo y el motor de auditoría técnica del módulo de análisis de volumen (corte/relleno) incorporado en la versión **Fase 7.1** de TerrenoLab.

---

## 1. Metodología de Cálculo por Celdas (Grid-Based Integration)

En lugar de aproximaciones analíticas continuas o triangulaciones de mallas (TIN), TerrenoLab utiliza un método de **integración de volumen por celdas regulares** (método del prisma o bloque):

1. **Grilla Regular**: La superficie interpolada mediante Inverse Distance Weighting (IDW) está discretizada en una malla regular con dimensiones constantes por celda:
   $$dx = \frac{X_{\text{max}} - X_{\text{min}}}{\text{columnas} - 1}$$
   $$dy = \frac{Y_{\text{max}} - Y_{\text{min}}}{\text{filas} - 1}$$
   $$dA = dx \cdot dy \quad \text{(Área planar de cada celda)}$$

2. **Clasificación Espacial (PIP)**: Para cada nodo $(c_x, c_y)$ en el centro de la celda de la grilla, se realiza un test de inclusión espacial mediante el algoritmo de **Ray Casting (Point in Polygon)**.
3. **Corte y Relleno Discreto**:
   - Si el centro de la celda está dentro del polígono, se calcula la diferencia altimétrica con la cota objetivo horizontal ($z_{\text{objetivo}}$):
     $$\Delta z = z_{\text{objetivo}} - z_{\text{celda}}$$
   - Si $\Delta z > 0$ (Relleno):
     $$V_{\text{relleno, celda}} = \Delta z \cdot dA$$
   - Si $\Delta z < 0$ (Corte):
     $$V_{\text{corte, celda}} = |\Delta z| \cdot dA$$
4. **Resumen de Volumen**: Se acumulan independientemente los valores de todas las celdas clasificadas para obtener los volúmenes geométricos brutos.

---

## 2. Dependencia de la Resolución de la Grilla IDW

Debido a que el volumen se calcula de forma discreta celda por celda, la precisión espacial y altimétrica de la estimación está estrechamente ligada a la resolución seleccionada para la interpolación IDW:

- **Resolución Baja (`40x40`)**: Las celdas son de mayor tamaño planar. La frontera poligonal se aproxima de forma más basta, y celdas cuyo centro cae ligeramente dentro de los límites aportarán su volumen completo, mientras que celdas con centro fuera serán ignoradas por completo.
- **Resolución Media (`80x80`) y Alta (`120x120`)**: Celdas más pequeñas reducen el error de pixelación perimetral, logrando que el área geométrica muestreada converja rápidamente con el área planar real del polígono.

> [!TIP]
> Aumentar la resolución de la superficie IDW en el paso "Generar superficie" antes de realizar el análisis volumétrico mejorará directamente la exactitud geométrica en el módulo de volumen.

---

## 3. Área Poligonal frente a Área Muestreada (Diferencia Geométrica)

TerrenoLab distingue dos métricas críticas de área:

1. **Área del Polígono ($A_{\text{polígono}}$)**: Es el área planar teórica exacta encerrada por los vértices del polígono (calculada con la fórmula de Shoelace).
2. **Área Muestreada ($A_{\text{muestreada}}$)**: Es la suma del área de todas las celdas cuyos centros caen dentro del polígono:
   $$A_{\text{muestreada}} = \text{Celdas dentro} \times (dx \cdot dy)$$

### Discrepancia Perimetral
La diferencia porcentual entre estas dos áreas (mostrada en la UI como **Diferencia**) mide la aproximación geométrica del muestreo:
$$\text{Diferencia \%} = \left| 1 - \frac{A_{\text{muestreada}}}{A_{\text{polígono}}} \right| \times 100$$

- Si el polígono es muy alargado o sus aristas cruzan diagonalmente muchas celdas, la diferencia porcentual será mayor.
- Si el polígono es grande en relación al tamaño de celda, la diferencia tiende a ser mínima ($< 2\%$).

---

## 4. Bloqueo por Precios y Parámetros Negativos

Para evitar la generación de presupuestos incoherentes y asegurar la integridad de los informes técnicos, TerrenoLab clasifica los valores negativos como **Bloqueadores de Volumen** (antes clasificados como advertencias):

* **Precio por $m^3$ negativo**: Impide estimar costos de adquisición.
* **Costo fijo de transporte negativo**: Impide estimar el costo total del proyecto.
* **Factores de compactación y pérdida $\le 0$**: Provocan cálculos de volumen recomendado nulos o negativos que violan leyes físicas.

Cualquier valor negativo o no numérico/infinito en estos inputs detiene inmediatamente la transición hacia la fase de exportación.

---

## 5. Límites de Precisión y Reglas de Control de Calidad (QA)

El motor de auditoría de volumen (`volumeAudit.ts`) impone límites basados en el número de celdas contenidas en el polígono de análisis:

* **Bloqueo Crítico ($< 10$ celdas)**: Si la zona delimitada contiene menos de 10 centros de celda, el cálculo geométrico carece de muestra suficiente y se bloquea el análisis. Se requiere ampliar el polígono o elevar la resolución IDW.
* **Advertencia de Baja Precisión ($< 25$ celdas)**: Si contiene entre 10 y 24 celdas, la estimación procede pero se alerta al usuario que el resultado tiene un margen de error alto por efectos de borde de grilla.
* **Consistencia de Costos**: Valida numéricamente que los totales de los costos coincidan exactamente con la operación matemática esperada, previniendo incoherencias de truncado decimal en estados React.
