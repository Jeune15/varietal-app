## Auditoría de la Página de Alumnos

### Guía Tipográfica Unificada (Global)
- Familia sans principal: `CoFo Sans`, fallback `Inter`, aplicada a body.
- Encabezados H1–H3:
  - H1: `text-3xl md:text-4xl font-black tracking-tighter uppercase`.
  - H2 secciones internas: `text-xl font-black uppercase tracking-tight`.
  - Subtítulos: `text-xs font-bold uppercase tracking-widest text-stone-400`.
- Texto corporal:
  - Mínimo 16px en móvil (`text-sm`) con `leading-relaxed` en bloques densos.
  - Longitud de línea recomendada en móvil: `max-w-[36ch]`.
- Etiquetas y meta-información:
  - Etiquetas de formulario y chips: `text-[10px] font-bold uppercase tracking-widest`.
  - Microcopias/contadores: `text-[9px]` reservado solo para detalles secundarios.
- Botones:
  - Primarios: `text-xs font-black uppercase tracking-[0.25em]`.
  - Secundarios: `text-xs font-bold uppercase tracking-widest`.

### 1) Revisión de Encabezados
- Consistencia H1/H2/H3: Unificados tamaños y pesos principales:
  - Títulos principales: `text-3xl md:text-4xl font-black tracking-tighter uppercase`
  - Subtítulos: `text-xs font-bold uppercase tracking-widest text-stone-400`
- Corrección aplicada en Catación para usar el mismo patrón responsivo.

### 2) Títulos de Secciones
- Estilo unificado para títulos de tarjetas y secciones: `text-xl font-black uppercase tracking-tight`.
- Verificado uso consistente de mayúsculas y tracking en Módulos, Catación y Recetas.

### 3) Estructura y Layout
- Márgenes/paddings consolidados: contenedores principales usan `max-w-6xl mx-auto pb-48` y espacios verticales uniformes `space-y-10`.
- Grillas: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` para listados de tarjetas.
- Bordes y fondos: `border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900`.

### 4) Discrepancias Detectadas
- Catación título principal usaba `text-4xl` fijo; ahora es `text-3xl md:text-4xl` (corregido).
- Animaciones desalineadas entre páginas; se añadieron entradas y hover consistentes (ver Implementación).

Capturas de pantalla: agregar capturas en móvil, tablet y desktop de:
- Encabezado principal de Catación, Módulos y Recetas.
- Grilla de tarjetas de Módulos.
- Botones de acción en Catación.

### 5) Recomendaciones
- Mantener tokens de tipografía y colores según las clases indicadas arriba.
- Evitar variaciones de tracking y pesos fuera de los patrones unificados.
- Reusar las clases de borde y fondo para tarjetas en todas las vistas de alumnos.

### 6) Implementación Realizada
- Catación:
  - Unificación de encabezado.
  - GSAP: animación de entrada de header y botones; hover con elevación en botones.
- Módulos:
  - GSAP: animación de entrada del header y tarjetas con `stagger`.
- Recetas:
  - Alineación previa de Espresso con Filtrados mantenida.

### 7) Validación
- Build sin errores.
- Revisar visualmente en Chrome, Firefox y Safari; verificar dark mode.
- Confirmar que los headers no se superponen con elementos fijos.

### 8) Animaciones GSAP
- Mínimo tres animaciones por página:
  - Catación: cursor, header reveal, botones reveal+hover.
  - Módulos: cursor, header reveal, grid reveal+hover.

---

## Auditoría Móvil y Rediseño Responsive

### Problemas detectados (móvil)
- Texto corporal por debajo de 16px en algunos párrafos y listas.
- Interlineado compacto en bloques densos.
- Descripciones con longitud de línea mayor a 40 caracteres en pantallas pequeñas.
- Botones y toggles sin tamaño táctil mínimo en todos los casos.
- Falta de atajo “volver arriba” en páginas largas.
- Uso de hover en elementos visibles también en móvil.
- Imágenes sin límite explícito al ancho del viewport.

Capturas antes (añadir):
- Secciones: Perfilación y Problemas comunes en 375x667.
- Listados de Módulos y Catación en 360x800.

### Cambios implementados
- Tipografía y espaciado base móvil:
  - `index.html`: reglas móviles para `p, li { font-size:16px; line-height:1.7 }`, `body { line-height:1.6 }`.
  - Clase utilitaria `.mobile-measure` equivalente: aplicado como `max-w-[36ch]` en textos largos.
  - Aumentos de paddings y `space-y` en acordeones y tarjetas.
- Legibilidad en Recetas (móvil):
  - Acordeones de Perfilación y Problemas con `px-5 py-4`, `min-h-[44px]`, `leading-relaxed`, listas con `space-y-2`.
  - Descripciones con `max-w-[36ch] md:max-w-2xl`.
- Imágenes y medios:
  - `img, video { max-width:100vw; height:auto; display:block }`.
- Navegación móvil:
  - Botón hamburguesa fijo arriba-izquierda (admin), animación corta y accesible.
  - Botón “scroll-to-top” visible tras desplazamiento en secciones largas (admin y alumnos).
- Accesibilidad/tacto:
  - Clase `.touch-target` (44x44) aplicada en botones flotantes clave y acordeones ajustados.

Referencias de código:
- Reglas CSS globales: index.html.
- Acordeones y tipografía móvil: views/RecipesView.tsx.
- Menú hamburguesa y scroll-to-top: App.tsx.

### Criterios de legibilidad
- Contraste mínimo: uso por defecto de `text-stone-900` sobre `bg-white` y equivalentes dark; revisar combinaciones locales.
- Longitud de línea: objetivo 30–40 caracteres en móvil para descripciones largas (`max-w-[36ch]`).
- Separación táctil: mínimo 8px entre controles; acordeones y navegación cumplen.
- Tamaño mínimo de objetivo táctil: 44x44 en botones flotantes y toggles visibles.

### Pruebas en dispositivos y viewports
- Viewports revisados en DevTools: 320, 360, 390, 414, 768.
- Dispositivos sugeridos para verificación manual: iPhone SE/12, Galaxy S20, Pixel 5.
- Pautas: comprobar primeras pantallas (“above the fold”) y que no existan solapamientos con la navegación inferior.

### Rendimiento y estabilidad
- CLS: contenedores con tamaños y paddings estables; imágenes limitadas a viewport.
- Tiempo de carga 3G: optimizar con caché y lazy-load donde aplique; actual build estable.

Capturas después (añadir):
- Perfilación y Problemas comunes mostrando acordeón abierto/cerrado.
- Menú hamburguesa y botón “subir” en scroll.
