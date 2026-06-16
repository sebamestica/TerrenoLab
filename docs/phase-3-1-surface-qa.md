# Auditoría de Calidad de Superficies (Surface QA) - Fase 3.1

Este documento detalla los objetivos, validaciones matemáticas y repercusiones de los parámetros de interpolación en el módulo de control de calidad de superficies de TerrenoLab.

---

## 1. ¿Por qué validar antes de generar curvas de nivel?

La interpolación genera una grilla densa regular (`gridZ`) sobre la cual se aplicarán algoritmos de delineación de curvas de nivel (como *Marching Squares* en la Fase 4). Si la superficie interpolada contiene inconsistencias matemáticas o datos indeterminados, el modelador geométrico de contornos fallará catastróficamente.

### Riesgos que previene esta fase:
* **Valores Indefinidos (`NaN`) o Infinitos (`Infinity`)**: En cálculos algebraicos, un solo píxel `NaN` se propaga rápidamente durante el suavizado o interpolación local, corrompiendo la grilla e interrumpiendo el trazado de contornos.
* **Extrapolaciones absurdas**: Debido a errores de coma flotante o fallos lógicos en la ponderación de distancias lejanas, el valor interpolado podría exceder los límites físicos medidos. Esto crearía "agujeros" artificiales o montañas inexistentes en las curvas.
* **Atenuación severa o aplanamiento excesivo**: Si la grilla suaviza en exceso el terreno, el rango de cotas se reduce drásticamente, haciendo que la generación posterior de curvas de nivel no represente de forma fiel el relieve real.

---

## 2. Validaciones Altimétricas de la Superficie

El módulo `analyzeSurfaceQuality` evalúa de forma estricta los siguientes criterios lógicos:

### A. Estabilidad Numérica (Bloqueante)
* Se escanea la totalidad de la matriz bidimensional `gridZ`.
* Cualquier ocurrencia de `NaN` o valores no finitos (por ejemplo, divisiones por cero no capturadas) activa un estado **Crítico** (`isStable = false`), inhabilitando el avance a la generación de curvas.

### B. Coherencia Altimétrica de Límites (Bloqueante)
La interpolación IDW es matemáticamente una media ponderada convexa. Esto significa que **ninguna celda interpolada puede tener una cota inferior al punto original más bajo, ni superior al punto original más alto**:

$$\min(Z_{\text{origen}}) \le Z_{\text{interpolado}} \le \max(Z_{\text{origen}})$$

* Se valida que:
  * $Z_{\text{interpolado\_min}} \ge Z_{\text{origen\_min}} - 0.01\text{m}$
  * $Z_{\text{interpolado\_max}} \le Z_{\text{origen\_max}} + 0.01\text{m}$
* Si la superficie viola estos límites físicos (incluso considerando un margen de tolerancia de $1\text{cm}$ por redondeos numéricos), se considera que el cálculo está corrupto y se bloquea el flujo.

### C. Atenuación del Relieve (Advertencia)
El promedio ponderado IDW tiende inherentemente a suavizar las alturas extremas debido al efecto de los puntos vecinos circundantes.
* Si el rango interpolado es inferior al $50\%$ del rango original:
  $$\Delta Z_{\text{superficie}} < 0.5 \cdot \Delta Z_{\text{original}}$$
* Se emite una advertencia indicando que el relieve se ha aplanado significativamente y se sugiere aumentar la resolución o ajustar el exponente de distancia.

---

## 3. Impacto de los Parámetros Técnicos

### A. Impacto de la Resolución
La densidad de celdas afecta directamente al nivel de detalle local del relieve, manteniendo constante la estructura macro:
* **Baja (40x40 - 1,600 celdas)**: Útil para previsualizar relieve a alta velocidad. Puede omitir quiebres locales.
* **Media (80x80 - 6,400 celdas)**: Resolución recomendada por defecto. Equilibrio óptimo entre velocidad y precisión topográfica.
* **Alta (120x120 - 14,400 celdas)**: Suaviza las transiciones cromáticas del heatmap y proporciona la grilla óptima para trazar curvas continuas y nítidas.
* **Diagnóstico de Estabilidad**: El algoritmo IDW es consistente; la variación de la grilla entre diferentes resoluciones no altera la forma fundamental del relieve, solo la densidad y precisión del muestreo.

### B. Impacto de la Potencia de Distancia ($p$)
El exponente controla la zona de influencia local de cada estación topográfica:
* **$p = 1.0$ (Advertencia)**: El peso cae muy despacio. La superficie se promedia en exceso y los picos/crestas sufren una atenuación severa (aplanamiento).
* **$p = 2.0$**: Representa la física natural de caída de influencia espacial.
* **$p = 3.0$ o $4.0$ (Advertencia)**: Mayor peso a puntos muy cercanos. Genera transiciones muy abruptas en las cercanías de los puntos de control (efecto de ojos de buey / "bull's eye").

---

## 4. Clasificación del Estado de Superficie

El panel inspector clasifica la calidad en tres niveles de conformidad:

1. **Estable (Verde)**: Sin alertas críticas ni advertencias moderadas. La superficie es apta y óptima para el cálculo de curvas.
2. **Advertencia (Amarillo)**: La grilla es apta para curvas pero presenta advertencias (por ejemplo, atenuación del relieve superior al $50\%$ o el uso de potencias extremas $p=1$ o $p=4$). Muestra un banner amarillo en el visor.
3. **Crítico (Rojo)**: Errores insalvables (indefinidos, violación matemática de cotas o grilla vacía). Muestra un banner rojo flotante y bloquea la navegación.
