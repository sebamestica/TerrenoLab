# TerrenoLab - Fase 7.2: Inspector Contextual Unificado y Navegación Visual por Modo de Análisis

Este documento detalla los cambios de diseño y refactorización arquitectónica introducidos en la Fase 7.2. El objetivo es unificar la experiencia del usuario centralizando los controles paramétricos, las métricas calculadas y los diagnósticos de control de calidad (QA) en un único **Inspector Contextual** a la derecha, mientras que la parte central se reserva exclusivamente como lienzo de visualización (Canvas).

---

## 1. El Patrón del Inspector Contextual

Anteriormente, cada paso del flujo de trabajo tenía su propia barra de herramientas inferior, formularios dispersos en el lienzo y paneles de métricas flotantes. En la Fase 7.2, todo esto se unifica en la barra lateral derecha (`InspectorPanel.tsx`).

### Anatomía Estructural del Inspector

Cada paso del flujo de trabajo ahora sigue una estructura anatómica consistente de 6 partes de arriba hacia abajo:

1. **Encabezado del Paso (`InspectorViewHeader.tsx`)**:
   - Título descriptivo de la vista actual.
   - Resumen del objetivo de la etapa.
   - Indicador de estado unificado (`Pendiente`, `Activo`, `Estable`, `Advertencia`, `Crítico`).
   - Icono SVG vectorial interactivo (`MiniViewPreview.tsx`) que ofrece una representación visual del tipo de datos representados en la vista (puntos, grilla raster, curvas, polígono de volumen o archivos de exportación).

2. **Selector Visual de Navegación (`ViewModeSelector.tsx`)**:
   - Barra de pestañas rápida horizontal: `[Puntos] [Superficie] [Curvas] [Volumen]`.
   - Permite al usuario saltar de forma no lineal entre vistas compatibles una vez que se han calculado los datos base.
   - Refleja el estado de QA en tiempo real mediante bordes codificados por color (verde: estable, amarillo: advertencia, rojo: bloqueante/error, gris: bloqueado por datos).

3. **Sección de Parámetros (`InspectorSection` para controles)**:
   - Acordeón colapsable con los controles y selectores paramétricos del paso (por ejemplo: CRS del proyecto, resolución de grilla IDW, exponente de distancia, equidistancia de curvas, factores de compactación/pérdida, precios).

4. **Sección de Métricas y Resultados (`InspectorSection` para resultados)**:
   - Acordeón colapsable que muestra las salidas de cálculo y mediciones topográficas generadas en tiempo real.

5. **Sección de Control de Calidad (`InspectorSection` para QA)**:
   - Lista detallada de la auditoría de consistencia de la etapa con advertencias y bloqueadores críticos.

6. **Botón de Acción Principal (`InspectorPrimaryAction.tsx`)**:
   - Un botón único de ancho completo en la parte inferior que guía al usuario hacia la siguiente etapa del flujo (p. ej., "Calcular Superficie", "Generar Curvas Nivel", "Proceder a Exportar", "Nuevo Análisis").

---

## 2. División de Responsabilidades: Lienzo vs. Inspector

### El Visor Central (Lienzo)

El visor central actúa como un espacio de trabajo puramente interactivo y de solo visualización gráfica:
- En **Puntos**: Renderiza el visor planimétrico 2D de la nube de puntos.
- En **Superficie**: Renderiza el modelo de elevación raster IDW interpolado.
- En **Curvas**: Renderiza las isolíneas físicas generadas vectorialmente.
- En **Volumen**: Permite el dibujo y edición interactiva del polígono de balance volumétrico.
- En **Exportación**: Proporciona las opciones finales de descarga técnica e instrucciones para CAD/GIS.

### El Panel de Control (Inspector)

El inspector gestiona toda la lógica de control de estado del flujo de trabajo. Al centralizar los parámetros en la derecha, se limpia la pantalla central y se elimina el desorden de botones y widgets flotantes.

---

## 3. Estados de Disponibilidad y QA en el Selector

El selector horizontal `ViewModeSelector.tsx` se muestra solo después de pasar la validación inicial y calcula reactivamente los estados para cada pestaña de la siguiente manera:

- **Puntos**:
  - **Disponible**: Siempre habilitado tras validación exitosa del dataset.
  - **Estado**: `estable` (verde) si outliers = 0; `advertencia` (amarillo) si existen advertencias menores; `bloqueado` (rojo/gris) si hay errores insalvables.
- **Superficie**:
  - **Disponible**: Si el dataset cargado permite interpolación (`canInterpolate`).
  - **Estado**: `pendiente` (gris) si aún no se ha interpolado; `bloqueado` (rojo) si contiene errores de QA; `advertencia` (amarillo) si hay advertencias de rango altimétrico; `estable` (verde) si es una grilla consistente.
- **Curvas**:
  - **Disponible**: Si la superficie IDW ha sido generada exitosamente.
  - **Estado**: `pendiente` (gris) si aún no se ha trazado; `bloqueado` (rojo) si cruza celdas nulas o no pasa la auditoría; `advertencia` (amarillo) si contiene intersecciones o ruidos corregibles; `estable` (verde) de lo contrario.
- **Volumen**:
  - **Disponible**: Si la superficie IDW está activa.
  - **Estado**: `pendiente` (gris) si el polígono de control tiene menos de 3 vértices; `bloqueado` (rojo) si hay auto-intersección de aristas o consistencias fallidas; `advertencia` (amarillo) si hay costos negativos o factores inusuales; `estable` (verde) si el cálculo volumétrico es consistente.

---

## 4. Sincronización y Visibilidad de Capas

Para garantizar que los diferentes elementos (Nube de puntos, Grilla IDW, Curvas vectoriales, Polígono de volumen) puedan sobreponerse adecuadamente en los análisis cruzados:
- La barra de **Capas Activas** se sitúa en la parte superior de cada lienzo.
- La visibilidad de las capas (`showPoints`, `showGrid`, `showContours`) está enlazada al estado unificado de la página principal (`page.tsx`).
- Al cambiar de paso en el inspector, la visibilidad de las capas correspondientes se sincroniza de forma reactiva para mostrar solo la información contextual relevante o la que el usuario seleccione.
