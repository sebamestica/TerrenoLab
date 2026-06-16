# Diagnóstico Topográfico y Calidad (QA) - Fase 2 & 2.1

Este documento explica las especificaciones técnicas, fórmulas y criterios de bloqueo utilizados por el motor de Control de Calidad (QA) avanzado en TerrenoLab.

---

## 1. Métricas e Indicadores de Validación

El motor de QA analiza el dataset de puntos topográficos bajo tres dimensiones fundamentales:

### A. Análisis Altimétrico ($Z$)
* **Min, Max, Delta ($Z$)**: Rango absoluto y desnivel del terreno.
* **Media ($\mu$)**: Promedio aritmético de las cotas.
* **Mediana**: El valor que divide el conjunto de datos ordenados en dos mitades iguales.
* **Desviación Estándar ($\sigma$)**: Mide la dispersión de las elevaciones respecto a la media:
  $$\sigma = \sqrt{\frac{1}{n} \sum_{i=1}^{n} (z_i - \mu)^2}$$
* **Rango Intercuartílico (IQR)**: Diferencia entre el tercer cuartil ($Q_3$, percentil 75) y el primer cuartil ($Q_1$, percentil 25):
  $$\text{IQR} = Q_3 - Q_1$$

### B. Outliers Altimétricos (Cribado de Cotas)
Se utiliza el método estadístico de Tukey para detectar lecturas anormales (posibles rebotes de señal lidar o errores de tipeo):
* **Cota Límite Inferior**: $Q_1 - 1.5 \times \text{IQR}$
* **Cota Límite Superior**: $Q_3 + 1.5 \times \text{IQR}$
Cualquier punto cuya cota $Z$ caiga fuera de estos límites se clasifica como outlier altimétrico y se reporta en una tabla dedicada en la pantalla de validación.

### C. Cobertura Espacial ($X,Y$)
* **Caja de Contención (Bounding Box)**: Área rectangular mínima paralela a los ejes cartesianos que encierra a todos los puntos.
* **Envolvente Convexa (Convex Hull)**: Polígono convexo mínimo que encierra a todos los puntos, calculado mediante el algoritmo *Monotone Chain*. Su área se obtiene con la *Fórmula de la lazada (Shoelace)*:
  $$\text{Área} = \frac{1}{2} \left| \sum_{i=1}^{n} (x_i y_{i+1} - x_{i+1} y_i) \right|$$
* **Cobertura espacial**: Razón entre el área del Convex Hull y el BBox. Un valor muy bajo ($< 35\%$) bloquea la interpolación debido a que indica una distribución inestable (ej. lineal o diagonal) que podría producir distorsiones matemáticas en las esquinas.
* **Espaciamiento Nearest Neighbor (NN)**: Distancia al vecino más cercano para cada punto. Permite calcular la distancia media, mínima y máxima de separación física entre estaciones de medición.

---

## 2. Clasificación Probable del Dataset

TerrenoLab clasifica el tipo de entrada en base a patrones geométricos de distribución y separación de puntos:

| Clasificación | Significado | Criterios de Detección |
| :--- | :--- | :--- |
| **DEM_GRID** | Grilla regular de Modelo Digital de Elevaciones | Coeficiente de variación de distancias al vecino más cercano extremadamente bajo ($< 9\%$) y número de filas/columnas coincidente con el total de puntos. |
| **FIELD_SURVEY** | Levantamiento topográfico irregular de campo | Espaciamiento de vecino más cercano variable y distribución dispersa/irregular de coordenadas. |
| **POSSIBLE_HILLSHADE** | Imagen raster sospechosa | Cotas exclusivamente en el rango $[0, 255]$, más del $85\%$ de valores $Z$ son enteros y alta repetición de alturas. |
| **UNKNOWN** | Conjunto no identificable | Insuficiencia de puntos ($< 3$) o distribución indefinida. |

---

## 3. Lógica de Bloqueo y Flujo de Trabajo (Fase 2.1)

Para evitar que conjuntos de datos sospechosos pero analizables bloqueen de forma total la navegación de la app, el motor de control distingue entre dos banderas lógicas:

### A. canReview (Aptitud de Visualización 2D)
Determina si el archivo es suficientemente íntegro para renderizarse en pantalla.
* **Requisitos**:
  * $\ge 3$ puntos válidos aprobados por el normalizador CSV.
  * Coordenadas $X, Y, Z$ numéricas y completas.
* **Efecto**: Si es `true`, el usuario puede pulsar **"Continuar a Revisión"** en la pantalla de validación para inspeccionar la nube de puntos 2D y sus propiedades.

### B. canInterpolate (Aptitud para Interpolación IDW)
Determina si los datos son confiables y adecuados para generar un modelo de terreno continuo en fases futuras.
* **Criterios de Bloqueo (fijan `canInterpolate = false`)**:
  * Score a nivel **Crítica** ($< 30$).
  * Clasificado como **POSSIBLE_HILLSHADE** con alta confianza ($\ge 85\%$).
  * Cobertura espacial extremadamente baja ($\text{Convex Hull Area} / \text{BBox Area} < 35\%$).
  * Presencia de outliers Z extremos ($\text{ratio} > 15\%$ de outliers).
  * Menos de 3 puntos.
* **Efecto**:
  * Si es `false`, se despliega una advertencia en la pantalla de validación: `"El dataset puede revisarse visualmente, pero no es apto para interpolación."`
  * En la pantalla de revisión visual, se muestra un badge que califica la aptitud: **"Apto para interpolación"**, **"No apto para interpolación"**, o **"Requiere revisión"** (cuando es apto pero cuenta con advertencias u outliers moderados).
  * En la Fase 3, impedirá la ejecución del algoritmo de interpolación IDW.

---

## 4. Limitaciones Actuales
* **Nearest Neighbor O(n²)**: Para datasets con más de 10,000 puntos, se realiza un muestreo aleatorio de 2,000 puntos para calcular la separación media, evitando congelar la interfaz del navegador.
* **No remoción automática**: El motor reporta los outliers detectados pero no los elimina, permitiendo al usuario decidir si el levantamiento es apto o si requiere modificaciones en origen.
