# Principios de Producto - TerrenoLab

TerrenoLab es una herramienta técnica para agrimensores y topógrafos. Para asegurar que la experiencia se alinee con las necesidades críticas del usuario final, el diseño y desarrollo deben regirse por los siguientes principios.

---

## 1. Datos Primero (Data-First)
- Los datos espaciales son los protagonistas del lienzo.
- El visor de coordenadas y el estado del dataset deben ser visibles y accesibles.
- Evitar animaciones lentas o transiciones fluidas de carga que retrasen el despliegue del relieve.

## 2. Acción Clara (Clear Action)
- El usuario debe saber exactamente en qué fase del workflow se encuentra.
- La navegación es restrictiva por diseño: si la fase previa no está completada y validada con éxito, los pasos subsiguientes permanecen estrictamente bloqueados.
- Las vistas guían secuencialmente: **Carga ➔ Mapeo ➔ Validación ➔ Visualización 2D ➔ Interpolación ➔ Curvas ➔ Exportación**.

## 3. Análisis Contextual (Contextual Analysis)
- Cada paso del flujo muestra métricas y parámetros relevantes para esa etapa en particular.
- El panel de inspección de la derecha se transforma dinámicamente según la fase activa, mostrando el control de calidad (QA) durante la validación o sliders de precisión durante el cálculo del grid.

## 4. Cero Decoración (Zero Decoration)
- Ningún elemento de la interfaz de usuario está ahí para "verse bonito". Todo control debe cumplir una función operativa específica.
- Los colores neón aplicados se reservan para denotar estados técnicos:
  - **Azul Eléctrico**: Foco interactivo, herramientas activas y selección.
  - **Verde Esmeralda**: Verificaciones exitosas y procesos finalizados.
  - **Amarillo Ámbar**: Advertencias geométricas tolerables pero riesgosas.
  - **Rosa/Rojo**: Errores críticos que bloquean el cálculo de la superficie.

## 5. Sin Funciones Falsas (No Fake Features)
- No implementamos elementos de adorno (como botones deshabilitados sin utilidad futura, o formularios inactivos).
- Si un módulo o algoritmo no está listo en la fase actual de desarrollo, se representa explícitamente en el roadmap o se estructura mediante stubs de firmas claros en el código del dominio, sin simular una funcionalidad falsa en la UI.
