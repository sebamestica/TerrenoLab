# TerrenoLab MVP

Workspace técnico para transformar datos topográficos en interpretación visual y decisiones preliminares.

---

## 1. ¿Qué es TerrenoLab?

TerrenoLab es una alpha técnica para análisis topográfico preliminar desde archivos CSV y DEM/GeoTIFF. Permite validar puntos, generar superficies IDW, curvas de nivel, estimar corte/relleno, configurar materiales por capas y exportar resultados técnicos.

Este workspace prioriza los datos limpios y la toma de decisiones basada en geometría, evitando stubs pesados de CAD o sobrecarga de frameworks administrativos.

> [!WARNING]
> **Advertencia Importante:** TerrenoLab entrega estimaciones preliminares. No reemplaza un levantamiento topográfico profesional, estudio geotécnico ni diseño de ingeniería.

---

## 2. Estado del Proyecto y Privacidad

*   **Estado actual:** MVP / Alpha técnica.
*   **Privacidad de Datos:** En esta versión, los archivos se procesan localmente en el navegador. No se suben a servidor ni se almacenan permanentemente. Si se cierra la página, el análisis puede perderse salvo que el usuario exporte resultados.
*   **Seguridad:** TerrenoLab procesa archivos localmente en el navegador y aplica límites de tamaño y validaciones para evitar archivos corruptos o excesivamente pesados.

---

## 3. Funciones Actuales

*   **Ingesta de Datos:** Lector real de archivos CSV de texto plano y mapeador interactivo.
*   **Importación Raster:** Procesamiento local de archivos de elevación DEM (TIF, TIFF, GeoTIFF) con extracción y muestreo automatizado de puntos 3D.
*   **Control de Calidad (QA):** Filtros automáticos, detección de CRS, bloqueo de modelos hillshade/derivados y advertencias de metadatos faltantes.
*   **Visor 2D:** Visualizador rápido de la nube de puntos y la geometría.
*   **Superficie IDW:** Generador interactivo de mallas interpoladas por Distancia Inversa Ponderada (IDW) con resoluciones adaptables.
*   **Curvas de Nivel Reales:** Trazado de isolíneas maestras e intermedias mediante el algoritmo de *Marching Squares*. Posibilidad de omitir el proceso.
*   **Volumen de Corte/Relleno:** Cubicaciones geométricas sobre un polígono delimitado, con ajuste de compactación y pérdidas. Posibilidad de omitir el proceso.
*   **Materiales por Capas:** Reparto volumétrico del relleno sobre capas iterables de materiales y cálculo de presupuestos base.
*   **Exportación Multiformato:** Descarga de puntos (CSV), diagnóstico visual (PNG), metadata (JSON técnico), vectores de curvas (DXF, GeoJSON) y planillas de costos (CSV de materiales).
*   **Límites Inteligentes:** Submuestreo de raster limitados a 20,000 puntos en navegador (límite archivo DEM a 100MB; CSV a 10MB) protegiendo el performance del dispositivo cliente.

---

## 4. Limitaciones del MVP

*   No incluye visualización ni renderizado 3D real de la malla, ni reposición topográfica.
*   No incluye geolocalización por GPS ni visualización sobre cartografía activa de Google Maps o reproyección en el vuelo.
*   No cuenta con autenticación, base de datos persistente (PostGIS) ni backend en servidor (toda la sesión depende del caché local de la ventana activa).

---

## 5. Instalación y Uso Local

### Requisitos Previos

*   Node.js (versión 18 o superior recomendada)
*   npm (o yarn)

### Ejecutar Localmente

1. Instalar las dependencias del proyecto:
   ```bash
   npm install
   ```

2. Iniciar el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en el navegador para comenzar.

3. Construir la versión de producción optimizada:
   ```bash
   npm run build
   ```

4. Ejecutar el servidor con el bundle de producción compilado:
   ```bash
   npm run start
   ```

---

## 6. Despliegue en Vercel

Este proyecto está configurado para desplegarse de manera directa en Vercel sin dependencias de variables de entorno (no require backend):
*   **Framework Preset:** Next.js
*   **Build Command:** `npm run build`
*   **Output Directory:** Automático (`.next` / Next.js predeterminado)
*   **Directorio Raíz:** `./` (o `terrenolab/` si se sitúa en un subdirectorio).
