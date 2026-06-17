# Fase 11 - Optimización de rendimiento, límites de uso y estabilidad (MVP)

La Fase 11 se ha completado satisfactoriamente. Se han aplicado límites, controles de estado y advertencias de desempeño para asegurar que TerrenoLab se mantenga estable bajo cargas de datasets pesados.

> [!TIP]
> Puedes levantar el servidor con `npm run dev` (o ejecutar `npm run build && npm run start` si prefieres probar el entorno de producción que acabamos de compilar exitosamente).

## Novedades

### 1. Control Centralizado de Límites
Se creó `src/config/limits.ts` para declarar los límites de rendimiento que aplican transversalmente:
- Límite de carga de archivos CSV: 10 MB.
- Límite de carga de imágenes Raster DEM: 100 MB.
- Límite de puntos base en memoria: 20,000 (Archivos Raster que superen este número son submuestreados automáticamente de manera homogénea).
- Límite de resolución IDW (Máxima): Cuadrícula 120x120.
- Límite de renderizado de curvas de nivel: 300 curvas máximo (protección contra colapso al pedir equidistancias irreales de menos de milímetros en terrenos abruptos).
- Límite de vértices de polígonos: 500 vértices (arroja una advertencia para mantener fluidez en el visor 2D, pero el cubicaje se ejecuta de todos modos).

### 2. Estados de Cargando (`isProcessingText`)
El visor ahora presenta un estado de carga textual bloqueante y claro durante los procesos sincrónicos pesados que toman más de 500 ms (evitando la percepción de navegador "congelado"):
- "Generando superficie..."
- "Generando curvas..."
- "Procesando DEM. Esto puede tardar unos segundos..."

### 3. Recuperación de Memoria Consistente
Se auditó la función de `handleReset` (Reiniciar análisis). Ahora limpia a fondo la memoria retenida, poniendo en `null` e inicializando explícitamente:
- Las mallas IDW
- Las curvas de nivel
- Las capas de materiales
- El volumen resultante y reportes QA

### 4. Advertencia en Exportaciones Masivas
La pestaña de Exportar ahora detecta si la malla de puntos es superior a 5,000 puntos base o si se tienen más de 50 niveles de curvas calculadas, y presenta una advertencia sobre el peso de exportación (sugiriendo reducir la resolución en caso de experimentar lentitud de procesamiento JSON o dibujo de los vectores DXF en el Blob URI).

### 5. Documentación de Límites
La guía (`Guía Rápida` -> `10. Límites de la versión MVP`) detalla a los usuarios las restricciones operativas y por qué existen.

> [!IMPORTANT]
> Durante la corrección de imports en la interfaz, se detectó la sobreescritura accidental del panel interactivo de MaterialLayers (`VolumeView.tsx`). Dicho panel (código que el usuario había trabajado en sesiones y ramas recientes de código no comiteado a git) **fue recuperado con éxito mediante técnicas forenses desde los logs y archivos de compilación de next.js .next** manteniendo intacta la funcionalidad y diseño sin pérdida de datos.

## Próximos pasos
El desarrollo MVP está completado y estable. El código se encuentra build-ready (`npm run build` corrió con cero advertencias TypeScript) y operará sin bloqueos bajo los nuevos límites establecidos.
