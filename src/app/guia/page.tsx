'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FileDown, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  AreaChart, 
  Sliders, 
  Layers, 
  Download, 
  Database, 
  HelpCircle, 
  Info, 
  ExternalLink,
  BookOpen
} from 'lucide-react';

export default function GuiaPage() {
  const sections = [
    { id: 'que-es', label: 'Qué es TerrenoLab' },
    { id: 'flujo-uso', label: 'Flujo de Trabajo' },
    { id: 'formato-csv', label: 'Formato CSV' },
    { id: 'qa-explicado', label: 'Control de Calidad (QA)' },
    { id: 'curvas', label: 'Curvas de Nivel' },
    { id: 'volumen', label: 'Corte y Relleno' },
    { id: 'materiales', label: 'Materiales por Capas' },
    { id: 'exportaciones', label: 'Formatos de Exportación' },
    { id: 'fuentes', label: 'Fuentes de Datos' },
    { id: 'limites', label: 'Límites de la versión MVP' },
    { id: 'faq', label: 'Preguntas Frecuentes' },
  ];

  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans antialiased">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-[#E2E8F0] bg-white px-6 flex items-center justify-between sticky top-0 z-50 select-none shadow-sm">
        <div className="flex items-center gap-3">
          <Link 
            href="/"
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft size={16} />
            <span>Volver al Workspace</span>
          </Link>
          <span className="text-slate-300">|</span>
          <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
            <img src="/terrenolab-icon.svg" alt="TerrenoLab Logo" className="w-5 h-5 drop-shadow-sm" />
            Guía rápida de TerrenoLab
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-400 font-medium">MVP - Versión Estructurada</span>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex gap-8 p-6 lg:p-8 min-h-0">
        
        {/* Sidebar Navigation */}
        <aside className="w-64 shrink-0 hidden md:block sticky top-20 self-start">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
              Contenido de la Guía
            </h3>
            <nav className="flex flex-col gap-1">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => handleScroll(sec.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-600 hover:bg-[#F0FDFA] hover:text-[#0891B2] text-[13px] font-medium transition-all duration-150"
                >
                  {sec.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content Section */}
        <main className="flex-1 space-y-12 bg-white border border-[#E2E8F0] rounded-xl p-6 lg:p-8 shadow-sm">
          
          {/* Section: Qué es TerrenoLab */}
          <section id="que-es" className="scroll-mt-20 space-y-4">
            <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <span className="w-1.5 h-6 bg-[#0891B2] rounded-full inline-block" />
              1. ¿Qué es TerrenoLab?
            </h2>
            <div className="text-[14.5px] leading-relaxed text-slate-600 space-y-3">
              <p>
                TerrenoLab es un workspace técnico para analizar datos topográficos. Permite cargar puntos con coordenadas X, Y, Z, revisar su calidad, interpolar una superficie, generar curvas de nivel, estimar corte/relleno y calcular costos preliminares de materiales.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-900">
                  <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[13px] leading-relaxed">
                    <strong>Advertencia Importante:</strong> TerrenoLab entrega estimaciones preliminares. No reemplaza un levantamiento topográfico profesional, estudio geotécnico ni diseño de ingeniería.
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-900">
                  <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-[13px] leading-relaxed">
                    <strong>Privacidad de Datos:</strong> En esta versión, TerrenoLab procesa los archivos localmente en el navegador. No se implementa almacenamiento en servidor.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Flujo de uso */}
          <section id="flujo-uso" className="scroll-mt-20 space-y-4">
            <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <span className="w-1.5 h-6 bg-[#0891B2] rounded-full inline-block" />
              2. Flujo de Trabajo en 7 Pasos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 space-y-1.5">
                <span className="text-xs font-bold text-[#0891B2] uppercase tracking-wider block">Paso 1</span>
                <h4 className="font-bold text-[14px]">Importar archivo</h4>
                <p className="text-[12.5px] text-slate-500 leading-relaxed">
                  Suba un CSV con columnas de coordenadas X, Y y Z. El sistema revisará si los datos son numéricos y si hay errores.
                </p>
              </div>

              <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 space-y-1.5">
                <span className="text-xs font-bold text-[#0891B2] uppercase tracking-wider block">Paso 2</span>
                <h4 className="font-bold text-[14px]">Validar columnas</h4>
                <p className="text-[12.5px] text-slate-500 leading-relaxed">
                  Asocie las columnas de su archivo a los ejes X, Y y Z correspondientes en la interfaz de mapeo interactivo.
                </p>
              </div>

              <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 space-y-1.5">
                <span className="text-xs font-bold text-[#0891B2] uppercase tracking-wider block">Paso 3</span>
                <h4 className="font-bold text-[14px]">Revisar terreno</h4>
                <p className="text-[12.5px] text-slate-500 leading-relaxed">
                  Vea los puntos en el visor 2D para comprobar la distribución, dispersión y límites de la medición topográfica.
                </p>
              </div>

              <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 space-y-1.5">
                <span className="text-xs font-bold text-[#0891B2] uppercase tracking-wider block">Paso 4</span>
                <h4 className="font-bold text-[14px]">Generar superficie</h4>
                <p className="text-[12.5px] text-slate-500 leading-relaxed">
                  Interpole los puntos mediante el método IDW para estimar alturas continuas en todo el terreno y crear el raster.
                </p>
              </div>

              <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 space-y-1.5">
                <span className="text-xs font-bold text-[#0891B2] uppercase tracking-wider block">Paso 5</span>
                <h4 className="font-bold text-[14px]">Generar curvas</h4>
                <p className="text-[12.5px] text-slate-500 leading-relaxed">
                  Dibuje curvas de nivel a intervalos regulares (maestras e intermedias) para comprender de inmediato las pendientes.
                </p>
              </div>

              <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 space-y-1.5">
                <span className="text-xs font-bold text-[#0891B2] uppercase tracking-wider block">Paso 6</span>
                <h4 className="font-bold text-[14px]">Calcular volumen</h4>
                <p className="text-[12.5px] text-slate-500 leading-relaxed">
                  Dibuje un polígono de análisis, defina una cota objetivo y calcule el volumen neto y el costo por capas de material.
                </p>
              </div>

              <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 space-y-1.5 sm:col-span-2">
                <span className="text-xs font-bold text-[#0891B2] uppercase tracking-wider block">Paso 7</span>
                <h4 className="font-bold text-[14px]">Exportar resultados</h4>
                <p className="text-[12.5px] text-slate-500 leading-relaxed">
                  Descargue los entregables técnicos que requiera: DXF para software CAD, GeoJSON para GIS, CSV de capas y JSON técnico.
                </p>
              </div>

            </div>
          </section>

          {/* Section: Formato CSV */}
          <section id="formato-csv" className="scroll-mt-20 space-y-4">
            <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <span className="w-1.5 h-6 bg-[#0891B2] rounded-full inline-block" />
              3. Estructura y Formato del Archivo CSV
            </h2>
            <div className="space-y-3 text-[14px] text-slate-600">
              <p>
                El archivo a cargar debe ser de texto plano delimitado por comas, punto y coma, o tabulaciones. Se recomienda incluir una fila de cabecera. Ejemplo estructurado:
              </p>
              
              <div className="bg-slate-50 rounded-lg p-3 font-mono text-[12.5px] border border-slate-200">
                <div>id,x,y,z</div>
                <div>P1,500000.00,6123000.00,125.40</div>
                <div>P2,500020.00,6123020.00,126.10</div>
                <div>P3,500040.00,6123040.00,127.00</div>
              </div>

              <div className="space-y-1 mt-3">
                <h4 className="font-semibold text-slate-700">Mapeo de coordenadas:</h4>
                <ul className="list-disc list-inside space-y-1 text-[13.5px] pl-2">
                  <li><strong>Eje X:</strong> representa la coordenada horizontal Este (o eje local de avance). Debe expresarse en metros.</li>
                  <li><strong>Eje Y:</strong> representa la coordenada horizontal Norte (o eje local transversal). Debe expresarse en metros.</li>
                  <li><strong>Eje Z:</strong> representa la elevación, cota altimétrica o altura del punto medido en metros.</li>
                </ul>
              </div>

              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3.5 flex gap-2 text-cyan-900 text-[12.5px]">
                <Info size={16} className="text-cyan-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Nota sobre Latitud/Longitud:</strong> Si carga coordenadas geográficas (como -33.45, -70.66), podrá visualizarlas en 2D, pero TerrenoLab no podrá realizar cubicaciones de volumen ni estimaciones de metros cúbicos hasta que los datos estén en metros (e.g. coordenadas UTM).
                </p>
              </div>
            </div>
          </section>

          {/* Section: Raster DEM */}
          <section id="raster-dem" className="scroll-mt-20 space-y-4">
            <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <span className="w-1.5 h-6 bg-[#0891B2] rounded-full inline-block" />
              4. Archivos Raster (DEM / GeoTIFF)
            </h2>
            <div className="space-y-3 text-[14px] text-slate-600">
              <p>
                También puede cargar DEM en formato TIF o GeoTIFF. TerrenoLab lo convierte internamente a puntos X/Y/Z para análisis preliminar. El archivo se procesa localmente en el navegador y no se sube a ningún servidor.
              </p>
              <ul className="list-disc list-inside space-y-1 text-[13.5px] pl-2">
                <li>Debe ser un <strong>raster de elevación (Digital Elevation Model)</strong>. No utilice imágenes derivadas o coloreadas como Hillshade (sombreado), mapas de pendientes (Slope), u orientación (Aspect). El analizador bloqueará estos archivos porque producirían terrenos totalmente planos o con elevaciones falsas (ej. de 0 a 255).</li>
                <li>Límite de tamaño: 100 MB por archivo.</li>
                <li>Si el archivo es muy masivo, TerrenoLab aplicará un muestreo dinámico (downsampling) para extraer un máximo de 20.000 puntos representativos y no colapsar la memoria del equipo.</li>
                <li>Si el raster carece de metadatos de coordenadas (CRS), se procesará utilizando un sistema local arbitrario (XY) derivado del espaciado de píxeles.</li>
                <li>Los datos sin valor (NoData, valores menores a -500 o sobre 9000 metros) son automáticamente purgados.</li>
              </ul>
            </div>
          </section>

          {/* Section: QA explicado */}
          <section id="qa-explicado" className="scroll-mt-20 space-y-4">
            <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <span className="w-1.5 h-6 bg-[#0891B2] rounded-full inline-block" />
              5. Control de Calidad (QA) y Estados
            </h2>
            <div className="space-y-4 text-[14px] text-slate-600">
              <p>
                TerrenoLab audita constantemente cada paso del análisis para asegurar la consistencia topográfica. Los badges de estado indican el nivel de calidad del paso actual:
              </p>

              <div className="space-y-3">
                <div className="flex gap-3.5 items-start p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={18} />
                  <div className="space-y-0.5">
                    <span className="font-bold text-green-950 block text-[13.5px]">Estable / Apto</span>
                    <span className="text-[12.5px] text-green-900 block leading-normal">
                      Los datos cumplen con las tolerancias requeridas. No se detectan anomalías y el cálculo es matemáticamente seguro.
                    </span>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-950 block text-[13.5px]">Advertencia</span>
                    <span className="text-[12.5px] text-amber-900 block leading-normal">
                      El flujo puede continuar, pero hay aspectos fuera del rango óptimo que deben revisarse (ej. capas de material configuradas sin precio o espaciamientos amplios).
                    </span>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start p-3 bg-red-50 border border-red-200 rounded-lg">
                  <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={18} />
                  <div className="space-y-0.5">
                    <span className="font-bold text-red-950 block text-[13.5px]">Crítico / Bloqueado</span>
                    <span className="text-[12.5px] text-red-900 block leading-normal">
                      El sistema bloquea la exportación o el avance de pantalla para prevenir errores de cubicación graves (ej. polígono autointersectado, factores de pérdida menores o iguales a cero, o precios negativos).
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Curvas */}
          <section id="curvas" className="scroll-mt-20 space-y-4">
            <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <span className="w-1.5 h-6 bg-[#0891B2] rounded-full inline-block" />
              5. Generación de Curvas de Nivel
            </h2>
            <div className="text-[14px] leading-relaxed text-slate-600 space-y-3">
              <p>
                Una vez interpolada la superficie tridimensional mediante la grilla IDW, TerrenoLab calcula curvas de nivel utilizando el algoritmo vectorial de <em>Marching Squares</em>.
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-[13.5px]">
                <li><strong>Curvas Maestras:</strong> se dibujan a intervalos mayores con líneas más gruesas y etiquetas de elevación legibles.</li>
                <li><strong>Curvas Intermedias:</strong> delinean con menor grosor los cambios de altura intermedios para mayor definición visual del terreno.</li>
                <li><strong>Intervalos de cota:</strong> puede ajustar la equidistancia en el inspector para aumentar o disminuir la densidad de trazado.</li>
              </ul>
            </div>
          </section>

          {/* Section: Volumen */}
          <section id="volumen" className="scroll-mt-20 space-y-4">
            <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <span className="w-1.5 h-6 bg-[#0891B2] rounded-full inline-block" />
              6. Cálculo de Corte y Relleno
            </h2>
            <div className="space-y-3 text-[14.5px] text-slate-600">
              <p>
                Al delimitar un área mediante el polígono interactivo y establecer una cota o nivel objetivo (cota target), el software realiza la cubicación celda por celda de la grilla:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-slate-700">
                <div className="border p-3.5 rounded-lg bg-slate-50 space-y-1">
                  <strong className="text-cyan-700 text-[13.5px] block font-sans">Volumen de Relleno</strong>
                  <span className="text-[12.5px] leading-normal block">
                    Metros cúbicos geométricos necesarios para elevar el terreno desde su estado natural hasta la cota objetivo de diseño.
                  </span>
                </div>
                <div className="border p-3.5 rounded-lg bg-slate-50 space-y-1">
                  <strong className="text-red-700 text-[13.5px] block font-sans">Volumen de Corte</strong>
                  <span className="text-[12.5px] leading-normal block">
                    Metros cúbicos que se deben excavar o remover debido a que el terreno natural excede la cota objetivo.
                  </span>
                </div>
                <div className="border p-3.5 rounded-lg bg-slate-50 space-y-1">
                  <strong className="text-slate-800 text-[13.5px] block font-sans">Volumen Recomendado</strong>
                  <span className="text-[12.5px] leading-normal block">
                    Ajuste volumétrico que considera el factor de compactación (esponjamiento) y el factor de pérdida del material.
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex gap-2.5 text-amber-900 text-[12.5px] mt-2">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Diferencia geométrica vs compra:</strong> El volumen geométrico derivado de la medición no equivale al volumen de compra. Al cubicar para obra, debe considerar el esponjamiento, humedad, pérdidas por transporte y la compactación mecánica que experimenta cada tipo de material en el sitio.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Materiales */}
          <section id="materiales" className="scroll-mt-20 space-y-4">
            <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <span className="w-1.5 h-6 bg-[#0891B2] rounded-full inline-block" />
              7. Relleno por Materiales y Capas Múltiples
            </h2>
            <div className="text-[14.5px] leading-relaxed text-slate-600 space-y-3">
              <p>
                Los materiales por capas permiten dividir el volumen de relleno según espesores definidos por el usuario. Por ejemplo, una primera capa granular (ej. base), una capa de relleno seleccionado (ej. sub-base) y una capa de terminación (ej. tierra vegetal).
              </p>
              <p>
                El sistema distribuye la altura de relleno celda por celda sobre el catálogo de capas activas, calculando de forma automática el volumen recomendado de compra y el costo estimado de cada estrato en base al precio unitario asignado.
              </p>
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3.5 flex gap-2.5 text-cyan-900 text-[12.5px]">
                <Info size={16} className="text-cyan-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Definición del catálogo:</strong> TerrenoLab no recomienda materiales automáticamente. El usuario posee completa flexibilidad para configurar la secuencia de capas, espesores iniciales/finales, factores físicos de corrección y precios unitarios.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Exportaciones */}
          <section id="exportaciones" className="scroll-mt-20 space-y-4">
            <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <span className="w-1.5 h-6 bg-[#0891B2] rounded-full inline-block" />
              8. Formatos de Exportación y Entregables
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-3.5 border border-slate-100 rounded-lg bg-slate-50/40">
                <strong className="text-[13.5px] text-slate-800 block mb-1">CSV Limpio</strong>
                <span className="text-[12.5px] text-slate-500 leading-normal block">
                  Listado tabulado con los puntos del levantamiento que pasaron el filtro de control de calidad, ideal para planillas Excel o importadores externos.
                </span>
              </div>

              <div className="p-3.5 border border-slate-100 rounded-lg bg-slate-50/40">
                <strong className="text-[13.5px] text-slate-800 block mb-1">PNG del Visor</strong>
                <span className="text-[12.5px] text-slate-500 leading-normal block">
                  Captura de alta resolución de la vista actual del lienzo (grillas, contornos o nube de puntos con barra de escala) para reportes preliminares.
                </span>
              </div>

              <div className="p-3.5 border border-slate-100 rounded-lg bg-slate-50/40">
                <strong className="text-[13.5px] text-slate-800 block mb-1">JSON Técnico</strong>
                <span className="text-[12.5px] text-slate-500 leading-normal block">
                  Archivo de metadatos estructurados que incluye parámetros del proyecto, volumen neto, auditoría de área, y desglose de capas en formato JSON.
                </span>
              </div>

              <div className="p-3.5 border border-slate-100 rounded-lg bg-slate-50/40">
                <strong className="text-[13.5px] text-slate-800 block mb-1">DXF (CAD)</strong>
                <span className="text-[12.5px] text-slate-500 leading-normal block">
                  Trazado vectorial de curvas maestras e intermedias con colores normalizados y capas específicas para su apertura en AutoCAD u otros softwares CAD.
                </span>
              </div>

              <div className="p-3.5 border border-slate-100 rounded-lg bg-slate-50/40">
                <strong className="text-[13.5px] text-slate-800 block mb-1">GeoJSON</strong>
                <span className="text-[12.5px] text-slate-500 leading-normal block">
                  Formato de datos espaciales estandarizado que contiene las líneas vectoriales y elevaciones para su integración directa en QGIS o ArcGIS.
                </span>
              </div>

              <div className="p-3.5 border border-slate-100 rounded-lg bg-slate-50/40">
                <strong className="text-[13.5px] text-slate-800 block mb-1">CSV de Materiales</strong>
                <span className="text-[12.5px] text-slate-500 leading-normal block">
                  Planilla detallada con el volumen bruto, recomendado, precio por m³ y costo estimado final de cada capa del presupuesto de obra.
                </span>
              </div>

            </div>
          </section>

          {/* Section: Fuentes de datos */}
          <section id="fuentes" className="scroll-mt-20 space-y-4">
            <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <span className="w-1.5 h-6 bg-[#0891B2] rounded-full inline-block" />
              9. Fuentes de Datos Topográficos Recomendadas
            </h2>
            <div className="space-y-4">
              <p className="text-[14px] text-slate-600">
                Si no cuenta con un levantamiento topográfico propio, puede descargar modelos de elevación del terreno en formatos de texto, raster o mallas de puntos desde los siguientes portales recomendados:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between bg-white shadow-sm hover:border-[#0891B2] transition-colors">
                  <div className="space-y-1.5 mb-4">
                    <h4 className="font-bold text-[14.5px] text-slate-800">IDE Chile / Geoportal</h4>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                      Datos geoespaciales oficiales de Chile, capas territoriales, límites administrativos y recursos cartográficos del sector público.
                    </p>
                  </div>
                  <a
                    href="https://www.ide.cl/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-slate-50 hover:bg-[#F0FDFA] hover:text-[#0891B2] text-[#64748B] text-center rounded-lg text-[12px] font-semibold border border-slate-200 hover:border-[#0891B2] transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Abrir fuente</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between bg-white shadow-sm hover:border-[#0891B2] transition-colors">
                  <div className="space-y-1.5 mb-4">
                    <h4 className="font-bold text-[14.5px] text-slate-800">OpenTopography</h4>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                      Plataforma internacional para la descarga directa de modelos digitales de elevación (DEM) globales y nubes de puntos LIDAR de alta resolución.
                    </p>
                  </div>
                  <a
                    href="https://opentopography.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-slate-50 hover:bg-[#F0FDFA] hover:text-[#0891B2] text-[#64748B] text-center rounded-lg text-[12px] font-semibold border border-slate-200 hover:border-[#0891B2] transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Abrir fuente</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between bg-white shadow-sm hover:border-[#0891B2] transition-colors">
                  <div className="space-y-1.5 mb-4">
                    <h4 className="font-bold text-[14.5px] text-slate-800">NASA Earthdata / SRTM</h4>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                      Repositorio de la NASA que ofrece datos altimétricos globales históricos derivados de la misión Shuttle Radar Topography Mission (SRTM).
                    </p>
                  </div>
                  <a
                    href="https://earthdata.nasa.gov/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-slate-50 hover:bg-[#F0FDFA] hover:text-[#0891B2] text-[#64748B] text-center rounded-lg text-[12px] font-semibold border border-slate-200 hover:border-[#0891B2] transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Abrir fuente</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between bg-white shadow-sm hover:border-[#0891B2] transition-colors">
                  <div className="space-y-1.5 mb-4">
                    <h4 className="font-bold text-[14.5px] text-slate-800">Copernicus DEM</h4>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                      Modelo digital de elevación de superficie global provisto por la Agencia Espacial Europea, excelente para realizar análisis y cubicaciones de forma preliminar.
                    </p>
                  </div>
                  <a
                    href="https://space.copernicus.eu/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-slate-50 hover:bg-[#F0FDFA] hover:text-[#0891B2] text-[#64748B] text-center rounded-lg text-[12px] font-semibold border border-slate-200 hover:border-[#0891B2] transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Abrir fuente</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

              </div>
            </div>
          </section>

          {/* Section: Limites MVP */}
          <section id="limites" className="scroll-mt-20 space-y-4">
            <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <span className="w-1.5 h-6 bg-[#0891B2] rounded-full inline-block" />
              10. Límites de la versión MVP
            </h2>
            <div className="space-y-3">
              <p className="text-[12.5px] text-slate-600 leading-relaxed">
                Todo el análisis de TerrenoLab ocurre localmente en su navegador para garantizar la privacidad de los datos. Sin embargo, para mantener un rendimiento óptimo, la versión MVP aplica los siguientes límites:
              </p>
              <ul className="list-disc pl-5 text-[12.5px] text-slate-600 space-y-1.5 marker:text-slate-400">
                <li><strong>CSV máximo:</strong> 10 MB.</li>
                <li><strong>DEM máximo:</strong> 100 MB.</li>
                <li><strong>Puntos máximos en memoria:</strong> 20.000 puntos (los raster muy pesados se muestrearán automáticamente de forma homogénea).</li>
                <li><strong>Límite de Curvas de Nivel:</strong> 300 niveles máximos, si se solicita una equidistancia extremadamente baja, el sistema sugerirá ajustarla.</li>
                <li><strong>Cubicación por Polígono:</strong> Polígonos de más de 500 vértices mostrarán una advertencia por desempeño en tiempo real, pero el cálculo se ejecutará de todos modos.</li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-3">
                <p className="text-[11.5px] text-amber-900 leading-relaxed font-semibold">
                  Equipos con menos recursos de hardware (memoria RAM baja, sin tarjeta de video dedicada) pueden tardar más en la generación de superficies IDW de alta resolución o en el cálculo de curvas de nivel densas. Si nota que su navegador se congela, opte por menor resolución y equidistancias más espaciadas.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Preguntas frecuentes */}
          <section id="faq" className="scroll-mt-20 space-y-4">
            <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <span className="w-1.5 h-6 bg-[#0891B2] rounded-full inline-block" />
              11. Preguntas Frecuentes (FAQ)
            </h2>
            <div className="space-y-3">
              
              <details className="group border border-slate-200 rounded-lg p-3 bg-slate-50/20 cursor-pointer">
                <summary className="text-[13.5px] font-semibold text-slate-700 flex justify-between items-center focus:outline-none list-none select-none">
                  <span>¿TerrenoLab reemplaza a Civil 3D?</span>
                  <span className="transition-transform group-open:rotate-180 text-[#0891B2]">&darr;</span>
                </summary>
                <div className="mt-2 text-[12.5px] text-slate-500 leading-relaxed pl-2 border-l border-slate-300">
                  No. TerrenoLab es una herramienta preliminar para interpretar datos, generar superficies, curvas y estimaciones. No reemplaza software profesional de diseño CAD o BIM.
                </div>
              </details>

              <details className="group border border-slate-200 rounded-lg p-3 bg-slate-50/20 cursor-pointer">
                <summary className="text-[13.5px] font-semibold text-slate-700 flex justify-between items-center focus:outline-none list-none select-none">
                  <span>¿Puedo usar coordenadas latitud/longitud?</span>
                  <span className="transition-transform group-open:rotate-180 text-[#0891B2]">&darr;</span>
                </summary>
                <div className="mt-2 text-[12.5px] text-slate-500 leading-relaxed pl-2 border-l border-slate-300">
                  Puede cargarlas para revisión visual en 2D, pero no para calcular volumen en m³. Para cubicaciones consistentes, las coordenadas X e Y deben estar expresadas en metros.
                </div>
              </details>

              <details className="group border border-slate-200 rounded-lg p-3 bg-slate-50/20 cursor-pointer">
                <summary className="text-[13.5px] font-semibold text-slate-700 flex justify-between items-center focus:outline-none list-none select-none">
                  <span>¿Qué significa Sistema local XY?</span>
                  <span className="transition-transform group-open:rotate-180 text-[#0891B2]">&darr;</span>
                </summary>
                <div className="mt-2 text-[12.5px] text-slate-500 leading-relaxed pl-2 border-l border-slate-300">
                  Significa que TerrenoLab interpreta las coordenadas de entrada como un plano coordenado local. El usuario debe verificar que los valores de entrada estén expresados en metros para que el cálculo volumétrico sea consistente.
                </div>
              </details>

              <details className="group border border-slate-200 rounded-lg p-3 bg-slate-50/20 cursor-pointer">
                <summary className="text-[13.5px] font-semibold text-slate-700 flex justify-between items-center focus:outline-none list-none select-none">
                  <span>¿Por qué el programa bloquea algunos archivos?</span>
                  <span className="transition-transform group-open:rotate-180 text-[#0891B2]">&darr;</span>
                </summary>
                <div className="mt-2 text-[12.5px] text-slate-500 leading-relaxed pl-2 border-l border-slate-300">
                  Porque detecta problemas técnicos graves que generarían cubicaciones o modelos incorrectos (ej. datos no numéricos, coordenadas fuera de límites métricos, polígonos que se cruzan entre sí o factores físicos de corrección menores o iguales a cero).
                </div>
              </details>

              <details className="group border border-slate-200 rounded-lg p-3 bg-slate-50/20 cursor-pointer">
                <summary className="text-[13.5px] font-semibold text-slate-700 flex justify-between items-center focus:outline-none list-none select-none">
                  <span>¿Qué son las curvas de nivel?</span>
                  <span className="transition-transform group-open:rotate-180 text-[#0891B2]">&darr;</span>
                </summary>
                <div className="mt-2 text-[12.5px] text-slate-500 leading-relaxed pl-2 border-l border-slate-300">
                  Son líneas vectoriales que unen puntos que poseen la misma elevación altimétrica. Permiten comprender de forma visual las lomas, pendientes, bajadas y depresiones de un terreno plano.
                </div>
              </details>

              <details className="group border border-slate-200 rounded-lg p-3 bg-slate-50/20 cursor-pointer">
                <summary className="text-[13.5px] font-semibold text-slate-700 flex justify-between items-center focus:outline-none list-none select-none">
                  <span>¿Qué es IDW?</span>
                  <span className="transition-transform group-open:rotate-180 text-[#0891B2]">&darr;</span>
                </summary>
                <div className="mt-2 text-[12.5px] text-slate-500 leading-relaxed pl-2 border-l border-slate-300">
                  IDW (Inverse Distance Weighting) es un algoritmo de interpolación espacial que estima la altura de cualquier punto intermedio en base a la cercanía de los puntos medidos. Es ideal para análisis rápidos pero aproximados.
                </div>
              </details>

              <details className="group border border-slate-200 rounded-lg p-3 bg-slate-50/20 cursor-pointer">
                <summary className="text-[13.5px] font-semibold text-slate-700 flex justify-between items-center focus:outline-none list-none select-none">
                  <span>¿Qué es corte y relleno?</span>
                  <span className="transition-transform group-open:rotate-180 text-[#0891B2]">&darr;</span>
                </summary>
                <div className="mt-2 text-[12.5px] text-slate-500 leading-relaxed pl-2 border-l border-slate-300">
                  El corte es la cantidad de volumen de tierra natural que se debe excavar. El relleno es el volumen de material que se debe ingresar para rellenar vacíos y nivelar el terreno hasta una cota de diseño predefinida.
                </div>
              </details>

              <details className="group border border-slate-200 rounded-lg p-3 bg-slate-50/20 cursor-pointer">
                <summary className="text-[13.5px] font-semibold text-slate-700 flex justify-between items-center focus:outline-none list-none select-none">
                  <span>¿Puedo guardar mis datos?</span>
                  <span className="transition-transform group-open:rotate-180 text-[#0891B2]">&darr;</span>
                </summary>
                <div className="mt-2 text-[12.5px] text-slate-500 leading-relaxed pl-2 border-l border-slate-300">
                  El análisis trabaja exclusivamente de forma local y temporal en la memoria de la sesión activa del navegador. Si cierra la pestaña de TerrenoLab perderá los datos, por lo que debe exportarlos antes.
                </div>
              </details>

              <details className="group border border-slate-200 rounded-lg p-3 bg-slate-50/20 cursor-pointer">
                <summary className="text-[13.5px] font-semibold text-slate-700 flex justify-between items-center focus:outline-none list-none select-none">
                  <span>¿Mis datos se suben a un servidor?</span>
                  <span className="transition-transform group-open:rotate-180 text-[#0891B2]">&darr;</span>
                </summary>
                <div className="mt-2 text-[12.5px] text-slate-500 leading-relaxed pl-2 border-l border-slate-300">
                  No. En este MVP, toda la lógica de validación, interpolación, trazado altimétrico y exportación de archivos se procesa 100% de manera local en el navegador del usuario. Ninguno de sus datos se almacena en servidores externos.
                </div>
              </details>

            </div>
          </section>

        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-6 text-center select-none shrink-0 mt-12">
        <p className="text-[12px] text-slate-400">
          TerrenoLab Workspace &copy; 2026. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
