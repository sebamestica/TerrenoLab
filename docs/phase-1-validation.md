# Documentación de Validación y Carga - Fase 1.1

Este documento detalla el comportamiento del motor de validación, limpieza de datos y visualización de la Fase 1.1 en TerrenoLab.

---

## 1. Formato CSV / TXT Aceptado

El importador es compatible con archivos de texto plano delimitados por coma (`,`) o punto y coma (`;`), detectados de forma automática por conteo de caracteres en la fila de cabeceras.

### Mapeo Dinámico de Columnas
Se analiza la fila de cabeceras (Fila 1) buscando coincidencias semánticas automáticas (ignorando mayúsculas/minúsculas y espacios). Si no se encuentra correspondencia automática, el usuario debe realizar la asignación manual para proceder:

* **Columna de Identificación (Opcional)**:
  * *Sinónimos*: `id`, `point`, `punto`, `nombre`, `name`.
  * *Comportamiento*: Si no se mapea o está vacía, se autogenera una etiqueta con el formato `P[Índice]` (ej. `P1`, `P2`, `P3`).
* **Coordenada Este / X (Obligatoria)**:
  * *Sinónimos*: `x`, `east`, `easting`, `este`.
* **Coordenada Norte / Y (Obligatoria)**:
  * *Sinónimos*: `y`, `north`, `northing`, `norte`.
* **Cota / Elevación / Z (Obligatoria)**:
  * *Sinónimos*: `z`, `elevation`, `height`, `elevacion`, `cota`.

---

## 2. Reglas de Validación y Limpieza

Cada fila de datos es evaluada bajo estrictos criterios de control de calidad (QA). Si una fila falla en cualquiera de estos criterios, se descarta para evitar la corrupción del modelo espacial y se registra el error correspondiente:

1. **Campos Requeridos**: Se verifica que existan datos en las columnas mapeadas como obligatorias.
2. **Normalización Numérica**: 
   * Se eliminan los espacios en blanco dentro de las cadenas.
   * Se corrige el separador decimal: si contiene una coma (`,`) y no contiene un punto (`.`), se transforma automáticamente la coma en punto decimal para poder ser interpretada por JavaScript.
3. **Cribado de Valores Inválidos**: Se rechazan valores vacíos, no numéricos (`NaN`) o representaciones de infinito (`Infinity`).
4. **Límites de Elevación**: La cota $Z$ debe estar dentro de límites topográficos realistas:
   $$\text{Rango permitido: } -500\text{ m} \le Z \le 9000\text{ m}$$
   Valores fuera de este rango se marcan como corruptos o errores de lectura de campo.
5. **Filtrado de Duplicados Espaciales**: Si dos o más registros comparten las mismas coordenadas $X$ e $Y$ exactas (con una tolerancia de $1\text{ mm}$ o 3 decimales), las filas subsecuentes se consideran duplicadas y se descartan para evitar singularidades en algoritmos de interpolación.
6. **Mínimo de Control Geométrico**: El conjunto resultante de puntos limpios y aprobados debe contener al menos **3 puntos válidos**. De lo contrario, el dataset completo se marca como inválido por insuficiencia de control geométrico.

---

## 3. Errores y Advertencias Detectables

* **Errores Críticos de Carga (Rechazan el archivo)**:
  * Formato de archivo incompatible (solo se admiten `.csv` y `.txt`).
  * Tamaño de archivo excedido ($> 10\text{ MB}$).
  * Detección de inyección o formatos web no topográficos (ej. etiquetas HTML como `<html>` o `<!DOCTYPE`).
  * Mapeo de columnas obligatorio incompleto.
  * Conjunto final con menos de 3 puntos aprobados.
* **Errores de Fila (Ignoran filas corruptas individuales)**:
  * Fila con coordenadas $X,Y$ vacías o ausentes.
  * Fila con cota $Z$ vacía o ausente.
  * Coordenadas $X$ o $Y$ no numéricas.
  * Cota $Z$ no numérica.
  * Presencia de valores infinitos.
  * Cota $Z$ fuera del rango permitido ($-500\text{ m}$ a $9000\text{ m}$).
  * Coordenada $X,Y$ duplicada en la base de datos de control.
* **Advertencias (Permiten continuar, pero alertan al usuario)**:
  * Terreno completamente plano (Delta $Z = 0$): Se aprueba para visualización pero advierte que no podrán generarse curvas de nivel en fases futuras.

---

## 4. Estado Actual de Capacidades y Límites (Fase 1.1)

### Lo que hace la aplicación actualmente:
* Importa archivos de texto plano estructurados de forma segura.
* Extrae y previsualiza las primeras 20 filas en forma de tabla.
* Muestra un reporte estructurado de control de calidad especificando el número de fila spreadsheet original donde ocurrió cada error.
* Calcula y actualiza las propiedades del terreno (densidad, cotas límite y área en hectáreas).
* Renderiza una nube de puntos 2D a escala real manteniendo la relación de aspecto exacta en la pantalla de revisión.
* Ofrece interactividad en el visor 2D (lectura de coordenadas reales al pasar el cursor sobre los puntos).

### Lo que la aplicación NO hace todavía (Fases Futuras):
* **No realiza interpolación matemática real**: La visualización de la malla en el paso 4 está bloqueada y no ejecuta ningún algoritmo IDW.
* **No calcula curvas de nivel reales**: El paso 5 está bloqueado y no cuenta con implementación de Marching Squares.
* **No dibuja curvas simuladas o falsas**: El visor 2D no dibuja contornos aproximados en esta versión para mantener la integridad técnica.
* **No exporta archivos entregables**: La descarga de archivos DXF, GeoJSON o listados finales en el paso 6 está inhabilitada.
* **No realiza visualización en 3D**: Toda la herramienta opera bajo un enfoque estrictamente bidimensional (2D-first).
