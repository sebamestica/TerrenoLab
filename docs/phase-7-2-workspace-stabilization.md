# TerrenoLab - Fase 7.2: Estabilización del Espacio de Trabajo e Inspector Contextual (SAFE)

Este documento detalla el proceso de estabilización, la arquitectura de control y la resolución de la interfaz de usuario implementados durante la Fase 7.2.

---

## 1. Problemas Originales y Diagnóstico

Durante las iteraciones previas de la Fase 7.2, se presentaron los siguientes problemas en el espacio de trabajo:
1. **Corrupción en `page.tsx`**: Modificaciones agresivas rompieron las dependencias y la máquina de estados del flujo de la aplicación, inhabilitando las exportaciones de la Fase 6 y la consistencia matemática de la Fase 7 y 7.1.
2. **Duplicidad y Hacks CSS en Capas**: Para implementar una barra de capas global unificada, se recurrió a hacks de selectores CSS inline (`[class*="local-bar"] { display: none }`) para ocultar los controles locales en las vistas de los pasos del flujo, lo cual resultó en una interfaz frágil y propensa a fallos de renderizado.
3. **Bloqueo Crítico e Invasivo en Volumen**: Cuando el usuario ingresaba a la vista de volumen sin haber dibujado un polígono, la aplicación renderizaba un modal rojo central con fondo desenfocado ("Análisis Volumétrico Bloqueado"). Esto bloqueaba el visor central e impedía que el usuario pudiera dibujar interactivamente los vértices del polígono para resolver la falta de datos, creando un bloqueo circular UX.

---

## 2. Solución Aplicada (Estrategia SAFE)

Para estabilizar la plataforma sin reintroducir errores de compilación ni modificar la lógica matemática y de exportaciones, se ejecutó una refactorización en tres fases incrementales seguras:

### SAFE-1: Restauración de Estados y Header Contextual
* Se restauró completamente la lógica del orquestador principal en `src/app/page.tsx`, devolviéndole su estabilidad de la Fase 7.1.
* Se rediseñó `src/components/InspectorPanel.tsx` para derivar reactivamente su encabezado y secciones basándose de forma exclusiva en el estado global actual (`currentState`, `surface`, `contours`, `volumeResult`, `exportQA`).
* No se crearon estados de navegación locales redundantes dentro del inspector. El panel lee de forma limpia el estado inyectado.

### SAFE-2: Centralización de Capas sin Hacks CSS
* Se eliminaron todos los selectores CSS frágiles del DOM.
* Se centralizó la barra de visibilidad de capas en `src/components/layout/AppShell.tsx`.
* Se implementó una inyección limpia de props mediante `React.cloneElement` sobre el componente hijo (`children`) en `AppShell.tsx`, pasándole la bandera `hideLocalLayerControls: true` de manera segura:
  ```tsx
  {React.cloneElement(children as React.ReactElement<any>, {
    hideLocalLayerControls: true
  })}
  ```
* Se modificaron las vistas hijas (`SurfaceView`, `ContoursView`, `VolumeView`, `TerrainReviewView`) para aceptar esta prop y ocultar condicionalmente sus paneles locales, evitando renderizados duplicados y sin usar hacks de hojas de estilo.

### SAFE-3: Pulido del Módulo Volumen y Rediseño de Alertas QA
* Se removió el modal bloqueante central en `src/features/volume/VolumeView.tsx`.
* La falta de polígono ahora es tratada como un **estado pendiente e informativo**, no como un error crítico del sistema. Se renderiza un banner superior no invasivo de color informativo (amarillo/azul) que invita al usuario a dibujar los vértices sobre el canvas de forma interactiva.
* Se ajustó la clasificación de bloqueadores de QA en `src/components/InspectorPanel.tsx`. Los estados inconclusos del polígono no inyectan bordes rojos de error crítico en el selector ni alertas de bloqueo insalvables en la barra lateral, preservando el color rojo solo para errores técnicos reales de consistencia matemática (como auto-intersección de aristas o factores de costos negativos).

---

## 3. Reglas de Mantenimiento y Arquitectura

Para evitar regresiones en futuras fases, se establecen las siguientes directrices obligatorias:

1. **Lectura Unidireccional en el Inspector**: El inspector lateral derecho no debe poseer control directo sobre el flujo del paso actual; debe actuar como un lector puro del estado provisto por el componente principal de la página.
2. **Inyección Limpia de Props**: Cualquier comportamiento visual dependiente del shell global (`AppShell.tsx`) sobre las vistas del flujo debe interactuar mediante props de TypeScript seguras e inyecciones de elementos clonados, nunca buscando selectores de clase del DOM ni usando estilos inline globales.
3. **No Bloquear el Lienzo (Canvas)**: Las advertencias o requerimientos de entrada de datos (como la falta de un dibujo de polígono o archivos no procesados) deben ser guías flotantes o alertas en el inspector, manteniendo el lienzo interactivo del canvas siempre disponible para la interacción del usuario.

---

## 4. Checklist de Verificación de Regresión

Antes de marcar cualquier entrega como completada, se debe verificar que:
* [ ] **Carga e Ingesta**: El archivo CSV se lee correctamente, detecta outliers en la nube de puntos y permite pasar a la interpolación.
* [ ] **Superficie IDW**: La interpolación se genera correctamente y se activa el selector de visualización.
* [ ] **Curvas de Nivel Vectoriales Maestras/Intermedias**: La visualización y la exportación en DXF y GeoJSON no arrojan errores de sintaxis y contienen los metadatos de CRS apropiados.
* [ ] **Dibujo Volumétrico**: La vista de volumen permite dibujar vértices de manera fluida sobre la grilla IDW sin modales bloqueantes de advertencia.
* [ ] **Centralización de Capas**: Al activar/desactivar capas en el AppShell superior, los elementos gráficos (nube, grilla, curvas, polígonos) se ocultan o muestran de forma consistente en todas las vistas sin duplicidad de paneles.
