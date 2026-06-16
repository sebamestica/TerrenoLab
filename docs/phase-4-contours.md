# Curvas de Nivel Vectoriales con Marching Squares - Fase 4

Este documento detalla las especificaciones técnicas del trazado de curvas de nivel y el funcionamiento del algoritmo Marching Squares en TerrenoLab.

---

## 1. Concepto de Curvas de Nivel

Las curvas de nivel (o isolíneas) son líneas vectoriales que unen puntos de igual altitud en un plano cartográfico 2D. 
* **Equidistancia**: Intervalo vertical constante entre dos curvas adyacentes. TerrenoLab soporta equidistancias de $0.5\text{m}$ (alta definición), $1.0\text{m}$, $2.0\text{m}$ (estándar), y $5.0\text{m}$ (macro).
* **Curvas Normales (Curvas Finas)**: Isolíneas trazadas a la equidistancia seleccionada, dibujadas en `#0891B2` con un grosor fino ($1.0\text{px}$).
* **Curvas Maestras o de Índice (Curvas Gruesas)**: Isolíneas especiales trazadas cada $k$ intervalos (por ejemplo, cada 5 curvas, equivalente a $10\text{m}$ si la equidistancia es $2\text{m}$). Se dibujan en `#0369A1` con mayor grosor ($2.0\text{px}$) e incluyen etiquetas de cota en su punto medio.

---

## 2. El Algoritmo Marching Squares

El algoritmo **Marching Squares** (cuadrados marchantes) es un método numérico de gráficos por ordenador que genera isolíneas vectoriales a partir de una grilla regular bidimensional de valores continuos.

### A. Funcionamiento Paso a Paso
1. **Recorrido**: Se procesa cada celda rectangular formada por cuatro nodos adyacentes del grid (`BL`, `BR`, `TR`, `TL`).
2. **Clasificación**: Para un nivel de altura de cota objetivo $H$, se compara la cota de cada esquina de la celda. Las esquinas con $Z_i \ge H$ se clasifican como activas ($1$), y las menores como inactivas ($0$).
3. **Indexación**: Se forma un índice de caso binario de 4 bits:
   $$\text{index} = (\text{TL} \ll 3) \mid (\text{TR} \ll 2) \mid (\text{BR} \ll 1) \mid \text{BL}$$
   Esto resulta en 16 combinaciones posibles de intersecciones en los bordes de la celda.
4. **Interpolación Lineal**: Para ubicar con precisión subpíxel el paso de la curva en los bordes de la celda, se aplica interpolación lineal en base a los valores reales de elevación. Por ejemplo, en el borde inferior (entre `BL` y `BR`):
   $$t = \frac{H - Z_{\text{bl}}}{Z_{\text{br}} - Z_{\text{bl}}}$$
   $$X_{\text{cruse}} = X_{\text{bl}} + t \cdot (X_{\text{br}} - X_{\text{bl}})$$
5. **Generación de Segmentos**: Se agregan las coordenadas del segmento resultante a la curva de nivel para ese nivel $H$.

---

## 3. Limitaciones y Reglas de Control

Para asegurar la estabilidad matemática y la integridad visual de los entregables, TerrenoLab aplica controles estrictos:

### A. Límite de Densidad (Garantía de Rendimiento)
* Si el intervalo equidistante elegido genera más de $300$ niveles altimétricos ($(\max(Z) - \min(Z)) / \text{intervalo} > 300$), el cálculo se suspende y se muestra una advertencia en pantalla.
* Esto previene bloqueos del navegador debidos al cálculo de decenas de miles de segmentos vectoriales innecesarios en desniveles abruptos.

### B. Restricciones del Bounding Box
* Todos los extremos $(X_1, Y_1)$ y $(X_2, Y_2)$ de los segmentos vectoriales generados por la interpolación de bordes son acotados estrictamente dentro del área límite del levantamiento mediante una función clamp, garantizando que ninguna curva sobresalga de la envolvente de la caja de contención.

### C. Coherencia IDW
* Las isolíneas se calculan de forma pura a partir del grid IDW estable. Si no existe una grilla de superficie conforme o si presenta bloqueadores críticos de QA (como valores NaN o violación de límites), la generación de curvas se inhabilita.
