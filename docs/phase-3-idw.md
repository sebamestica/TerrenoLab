# Interpolación IDW y Generación de Superficie 2D - Fase 3

Este documento explica las especificaciones técnicas, fórmulas matemáticas y el funcionamiento del visor de superficie continua de TerrenoLab.

---

## 1. Fundamentos Matemáticos de IDW (Inverse Distance Weighting)

El método de **Ponderación Inversa a la Distancia (IDW)** es un algoritmo de interpolación determinista espacial. Asume que los puntos cercanos tienen más influencia en el valor de una celda que los puntos lejanos.

### A. Ecuación General de Interpolación
Para estimar la cota $Z(x, y)$ en cualquier celda de coordenadas $(x, y)$ dentro de la grilla, se utiliza la media ponderada de los puntos de control del levantamiento:

$$Z(x, y) = \frac{\sum_{i=1}^{n} w_i \cdot Z_i}{\sum_{i=1}^{n} w_i}$$

Donde:
* $n$ es la cantidad de puntos topográficos válidos analizados.
* $Z_i$ es la elevación real del punto topográfico $i$.
* $w_i$ es el peso asignado al punto $i$, calculado como:

$$w_i = \frac{1}{d(x, y; x_i, y_i)^p}$$

Donde $d(x, y; x_i, y_i)$ es la distancia euclidiana cartesiana en el plano de planta:

$$d(x, y; x_i, y_i) = \sqrt{(x - x_i)^2 + (y - y_i)^2}$$

Y $p$ es el **Exponente de Distancia** (Parámetro Power).

### B. Influencia del Exponente $p$
El exponente $p$ controla la rapidez con la que disminuye la influencia de los puntos lejanos:
* **$p = 1.0$**: Gradientes lineales muy suaves, pero con tendencia a promediar en exceso y aplanar picos.
* **$p = 2.0$** (Predeterminado / Gravedad): Relación óptima de caída de influencia.
* **$p = 3.0$ o $4.0$**: Mayor énfasis en puntos extremadamente cercanos. Produce el efecto visual de "bull's eye" (ojos de buey / picos localizados alrededor de las estaciones topográficas).

### C. Salvaguarda de Coincidencia Exacta ($d \to 0$)
Para evitar indeterminaciones por división por cero en las coordenadas de origen de los puntos del levantamiento ($d = 0$), el motor de cálculo aplica una tolerancia de seguridad:

$$\text{Si } d^2 < 10^{-8} \implies Z(x, y) = Z_i$$

Si se encuentra esta condición, se detiene la sumatoria y se asigna el valor exacto de la cota original de la estación topográfica.

---

## 2. Configuraciones y Resoluciones

TerrenoLab permite parametrizar las dimensiones físicas del ráster interpolado. El dominio calcula una grilla bidimensional cuadrada regular circunscrita en la caja de contención del levantamiento ($BBox$):

| Resolución | Dimensiones | Total de Celdas | Propósito y Rendimiento |
| :--- | :---: | :---: | :--- |
| **Baja** | $40 \times 40$ | $1,600$ | Cálculo rápido e instantáneo. Útil para previsualizaciones iniciales o pruebas rápidas. |
| **Media** | $80 \times 80$ | $6,400$ | Balance óptimo recomendado. Detalle técnico continuo con muy bajo costo de CPU. |
| **Alta** | $120 \times 120$ | $14,400$ | Máxima fidelidad visual 2D. Mayor tiempo de cálculo, óptima para exportaciones o revisión final. |

---

## 3. Arquitectura del Visor de Superficie 2D (Ráster Heatmap)

El visor gráfico se basa en el elemento `<canvas>` de HTML5 para renderizar el ráster a máxima velocidad.

### A. Preservación del Aspect Ratio
Para evitar distorsiones cartográficas (estiramiento horizontal o vertical de las parcelas), el visor calcula el factor de escala adaptativo:

$$\text{Scale} = \min\left(\frac{W_{\text{canvas}} - 2 \cdot \text{Padding}}{X_{\text{max}} - X_{\text{min}}}, \frac{H_{\text{canvas}} - 2 \cdot \text{Padding}}{Y_{\text{max}} - Y_{\text{min}}}\right)$$

Esto centra el ráster y mantiene la proporción de planta del terreno, independientemente de la forma geométrica de la ventana del navegador.

### B. Rampa de Color Elevación (Gradiente Suave)
La cota de cada celda se mapea dinámicamente mediante una rampa de color continua en cinco etapas:
* **Mínima ($0.0$)**: Azul oscuro (`rgba(59, 130, 246)`)
* **Baja ($0.25$)**: Cian (`rgba(6, 182, 212)`)
* **Media ($0.50$)**: Verde Esmeralda (`rgba(16, 185, 129)`)
* **Alta ($0.75$)**: Ámbar (`rgba(245, 158, 11)`)
* **Máxima ($1.0$)**: Rosa fucsia (`rgba(244, 63, 94)`)

El color se interpola linealmente por canal de color (R, G, B) de acuerdo a la cota relativa normalized del píxel:
$$t = \frac{Z - Z_{\text{min}}}{Z_{\text{max}} - Z_{\text{min}}}$$

### C. Leyenda de Escala Dinámica
Se dibuja una regla gráfica de distancia en el canvas que indica la equivalencia física en metros. La distancia se calcula redondeando a números convenientes (potencias de 10, 2 o 5) que ocupen cerca de un quinto de la anchura visible del levantamiento en planta.

### D. Capas de Overlays
El usuario puede alternar visualmente:
1. **Nube Puntos**: Dibuja círculos sólidos blancos con centro de color original en la ubicación exacta $(X, Y)$ de las estaciones topográficas.
2. **Superficie Heatmap**: Renderizado ráster de la grilla.
3. **Mostrar Grilla**: Superpone líneas finas blancas con opacidad baja en los límites y centros de cada celda del modelo digital de elevación.

---

## 4. Flujo de Trabajo y Reglas de Control

1. **Garantía QA**: La pestaña **"Generar superficie"** solo se desbloquea en la sidebar si `qaResult.quality.canInterpolate` es `true`.
2. **Cálculo Asíncrono**: Debido a que la interpolación IDW de $14,400$ celdas con miles de puntos de control puede tomar decenas de milisegundos en Javascript de un solo hilo, TerrenoLab no corre el cálculo automáticamente al cambiar los deslizadores. El usuario parametriza en la barra derecha y hace clic en **"Generar Superficie"** para ejecutar el cálculo.
3. **Indicador de Carga**: Durante el cálculo, la interfaz muestra un spinner de carga que evita clics dobles y detiene la interacción hasta almacenar el resultado.
