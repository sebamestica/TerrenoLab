# Herramienta de Polígono y Estimación de Volumen (Corte y Relleno) - TerrenoLab

Este documento detalla la fundamentación matemática, los algoritmos de clasificación espacial, las reglas de control de calidad (QA) y el sistema de estimación de costos incorporados en la **Fase 7** de TerrenoLab.

---

## 1. Fundamento Matemático y Fórmulas

La cubicación preliminar de tierras se realiza determinando la diferencia de cotas entre el terreno natural interpolado (grilla IDW) y un plano de cota objetivo horizontal definido por el usuario ($z_{\text{objetivo}}$).

### Área del Polígono (Fórmula de Shoelace / Gauss)
Para calcular el área planar bidimensional del polígono seleccionado a partir de sus $n$ vértices ordenados:

$$A = \frac{1}{2} \left| \sum_{i=0}^{n-1} (x_i y_{i+1} - x_{i+1} y_i) \right|$$

Donde $(x_n, y_n) = (x_0, y_0)$ para cerrar el ciclo geométrica del polígono.

### Perímetro del Polígono
Se calcula acumulando la distancia euclidiana entre vértices consecutivos:

$$P = \sum_{i=0}^{n-1} \sqrt{(x_{i+1} - x_i)^2 + (y_{i+1} - y_i)^2}$$

### Clasificación y Volumen de Celdas (Integración Discreta)
La grilla de superficie IDW se compone de celdas regulares de dimensiones $dx$ y $dy$. Para cada celda con coordenadas de centro $(c_x, c_y)$ y cota $currentZ$:

1. **Determinación de pertenencia**: Se verifica si el centro $(c_x, c_y)$ se encuentra dentro del polígono mediante el algoritmo de **Ray Casting (PIP - Point in Polygon)**.
2. **Cálculo de volumen unitario**: Si la celda pertenece al polígono, se calcula su área diferencial ($dA = dx \cdot dy$) y la diferencia altimétrica:

$$\Delta z = z_{\text{objetivo}} - currentZ$$

* Si $\Delta z > 0$: La celda requiere **Relleno (Fill)**.
  $$V_{\text{relleno, celda}} = \Delta z \cdot dA$$
* Si $\Delta z < 0$: La celda requiere **Corte (Cut)**.
  $$V_{\text{corte, celda}} = |\Delta z| \cdot dA$$

3. **Volumen total geométrico**: Se acumulan los valores de todas las celdas clasificadas:

$$V_{\text{relleno, bruto}} = \sum V_{\text{relleno, celda}}$$
$$V_{\text{corte, bruto}} = \sum V_{\text{corte, celda}}$$
$$V_{\text{neto}} = V_{\text{relleno, bruto}} - V_{\text{corte, bruto}}$$

---

## 2. Factores de Esponjamiento, Compactación y Pérdida

En obras de movimiento de tierra, el volumen geométrico en banco difiere del volumen suelto o del volumen compactado final. TerrenoLab incorpora multiplicadores de cubicación:

### Volumen de Relleno Recomendado
El volumen de material que debe comprarse y transportarse a la obra para alcanzar la cota objetivo después de la compactación y contemplando pérdidas por manipulación/viento se calcula como:

$$V_{\text{recomendado}} = V_{\text{relleno, bruto}} \cdot F_{\text{compactación}} \cdot F_{\text{pérdida}}$$

* **Factor de Compactación ($F_{\text{compactación}}$)**: Por defecto `1.20`. Representa la contracción del material suelto al ser compactado mecánicamente en el sitio de relleno (típicamente entre `1.10` y `1.30`).
* **Factor de Pérdida ($F_{\text{pérdida}}$)**: Por defecto `1.05`. Añade un margen de seguridad del 5% frente a desvíos de medición, pérdidas por transporte o irregularidades locales.

---

## 3. Estimación de Costos

Para estimar el presupuesto de material de relleno:

1. **Costo de Material**:
   $$C_{\text{material}} = V_{\text{recomendado}} \cdot \text{Precio por } m^3$$
2. **Costo Total**:
   $$C_{\text{total}} = C_{\text{material}} + \text{Costo Fijo de Transporte}$$

*Nota: Las cubicaciones y presupuestos son aproximaciones preliminares basadas en el modelo matemático IDW y no reemplazan planos constructivos profesionales.*

---

## 4. Matriz de Control de Calidad QA de Volumen

El motor de validación `volumeQA.ts` ejecuta análisis lógicos para prevenir cálculos erróneos y alertar al operador:

| Tipo | Condición Evaluada | Mensaje / Efecto | Severidad |
| :--- | :--- | :--- | :--- |
| **Bloqueador** | Superficie IDW inexistente | "No existe una superficie IDW interpolada sobre la cual calcular volumen." | Crítico |
| **Bloqueador** | Vértices del polígono < 3 | "El polígono de análisis está incompleto: requiere al menos 3 vértices." | Crítico |
| **Bloqueador** | Área del polígono es 0 o menor | "El área del polígono de análisis es cero o negativa." | Crítico |
| **Bloqueador** | Coordenadas en grados (lat/lon) | "Las coordenadas parecen geográficas (grados lat/lon). TerrenoLab aún no reproyecta coordenadas, por lo que no puede calcular volúmenes en m³." | Crítico |
| **Bloqueador** | Celdas evaluadas dentro = 0 | "Ninguna celda de la grilla de superficie IDW cae dentro del polígono seleccionado." | Crítico |
| **Bloqueador** | Cota objetivo no numérica o NaN | "La cota objetivo no está definida o no es un valor numérico." | Crítico |
| **Bloqueador** | Factores $\le 0$ | "El factor de compactación/pérdida debe ser un valor numérico positivo mayor a cero." | Crítico |
| **Advertencia** | CRS descriptivo configurado en `LOCAL` | "El sistema de coordenadas es local XY (descriptivo). Confirme que X e Y están expresados en metros antes de calcular volumen." | Moderado |
| **Advertencia** | Precios o transporte negativos | "El precio por m³ / costo fijo de transporte ingresado es negativo." | Moderado |
| **Advertencia** | Auto-intersección de aristas | "El polígono de análisis contiene auto-intersecciones (se cruza a sí mismo). Revise los vértices." | Moderado |

---

## 5. Visualización Contextual en el Visor

Cuando la herramienta de volumen está activa, el renderizado de la grilla cambia dinámicamente para maximizar el contraste y la utilidad del análisis:

* **Enfoque de Área de Interés (AOI)**: Las celdas de la grilla IDW que caen **fuera** del polígono se desaturan disminuyendo su opacidad ($\alpha = 0.15$ o $0.20$), manteniendo visible el relieve general sin distraer del cálculo.
* **Mapa de Corte/Relleno Interno**: Las celdas de la grilla que caen **dentro** del polígono cambian su color para clasificar visualmente el trabajo:
  * **Cyan / Azul**: Zonas que requieren Relleno ($\Delta z > 0$).
  * **Rose / Rojo**: Zonas que requieren Corte ($\Delta z < 0$).
  * **Gris Slate**: Puntos neutros exactos o de transición ($\Delta z = 0$).
