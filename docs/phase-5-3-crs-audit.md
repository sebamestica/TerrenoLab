# Auditoría CRS y Cierre Técnico del MVP

Este documento registra los resultados de la auditoría de Sistemas de Referencia de Coordenadas (CRS) realizada en la **Fase 5.3**, detallando el funcionamiento de las coordenadas en TerrenoLab, la corrección de códigos de la European Petroleum Survey Group (EPSG) y el alcance actual de las transformaciones geoespaciales.

---

## 1. ¿Qué es un CRS (Coordinate Reference System)?

Un **Sistema de Referencia de Coordenadas (CRS)** es un marco de trabajo geodésico y matemático que permite asociar valores numéricos de coordenadas ($X, Y, Z$) con posiciones físicas reales en la superficie de la Tierra.

El CRS define:
- El **Elipsoide** o modelo matemático de la Tierra (por ejemplo, WGS 84).
- El **Datum** u origen de cálculo geodésico ajustado a una región o época tectónica (por ejemplo, SIRGAS-Chile 2002).
- La **Proyección Cartográfica** que aplana la curvatura tridimensional terrestre a una grilla plana bidimensional (por ejemplo, UTM - Universal Transverse Mercator).

---

## 2. ¿Qué significa "Sistema local XY" (Local Grid)?

Cuando los datos topográficos provienen de un levantamiento menor o una grilla sin georreferenciación global directa, TerrenoLab utiliza el **Sistema local XY** por defecto:

*   **Definición:** Describe una grilla cartesiana plana local cuyo origen $(0,0)$ o coordenada de enganche no está enlazada oficialmente a un elipsoide terrestre.
*   **CRS:** Se define como **no especificado**.
*   **EPSG:** Se indica como **no aplica** (código `null`).
*   **Uso:** Es óptimo para analizar parcelas pequeñas, validaciones topográficas relativas o cálculos de curvas en base a cotas arbitrarias de obra (por ejemplo, cota 100.00 m).

---

## 3. Sistemas de Referencia Compatibles para Chile

TerrenoLab cataloga los sistemas de coordenadas proyectadas más utilizados por los profesionales de la mensura, la minería y la cartografía pública en Chile:

### A. WGS 84 / UTM (Zonas del Hemisferio Sur)
El elipsoide mundial estándar y de referencia global para GPS y SIG:
*   **WGS 84 / UTM Zona 18S (EPSG:32718):** Cubre el territorio continental comprendido entre las longitudes $78^\circ\text{W}$ y $72^\circ\text{W}$.
*   **WGS 84 / UTM Zona 19S (EPSG:32719):** Cubre el territorio continental central comprendido entre las longitudes $72^\circ\text{W}$ y $66^\circ\text{W}$. Es la zona UTM más empleada en proyectos nacionales chilenos.
*   **WGS 84 / UTM Zona 20S (EPSG:32720):** Cubre sectores del extremo este y sur de la frontera cordillerana (longitudes $66^\circ\text{W}$ a $60^\circ\text{W}$).

### B. SIRGAS-Chile 2002 / UTM
La densificación nacional del marco geocéntrico para las Américas (época de referencia 2002.00) oficializada por el Instituto Geográfico Militar (IGM):
*   **SIRGAS-Chile 2002 / UTM Zona 18S (EPSG:5362):** Proyección oficial de alta precisión para la zona Oeste chilena.
*   **SIRGAS-Chile 2002 / UTM Zona 19S (EPSG:5361):** Proyección oficial de alta precisión para el valle central y cordillera chilena.

> [!NOTE]
> De acuerdo con el registro oficial de EPSG, las realizaciones SIRGAS-Chile continentales se proyectan exclusivamente en las zonas **18S** y **19S**. No existe un código registrado en EPSG para SIRGAS-Chile UTM Zona 20S; por lo tanto, no se incluye dicha combinación para prevenir fallos normativos o invenciones de CRS.

---

## 4. Limitación de Reproyección en el MVP

> [!IMPORTANT]
> **TerrenoLab NO realiza reproyección de coordenadas.**
> 
> La selección de un CRS en la interfaz tiene fines puramente de documentación, etiquetado y catalogación técnica:
> 1. Al cargar un archivo CSV con coordenadas en WGS 84 / UTM Zona 19S, el usuario debe seleccionar dicho sistema en el panel lateral.
> 2. Este metadato se escribe en el archivo JSON técnico exportado (`"crs"`) para que otros programas de CAD o SIG (como AutoCAD Civil 3D o QGIS) sepan cómo interpretar las cotas y coordenadas en bruto.
> 3. TerrenoLab **no altera ni transforma** matemáticamente las coordenadas $X$ o $Y$ ingresadas (no hace conversiones de huso ni de datum). Si se ingresan coordenadas locales y se selecciona SIRGAS-Chile, los datos resultantes NO se moverán geográficamente; simplemente se etiquetarán con el CRS seleccionado.
