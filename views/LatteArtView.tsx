import React, { useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

interface LatteArtVariable {
  id: string;
  name: string;
  description: string;
  impact: string[];
  tip: string;
}

interface LatteArtPattern {
  id: string;
  name: string;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  description: string;
  steps: string[];
  keyVariables: string[];
}

const LATTE_ART_VARIABLES: LatteArtVariable[] = [
  {
    id: 'flow-speed',
    name: 'Velocidad del flujo',
    description: 'La rapidez con la que la leche sale de la jarra. Se controla inclinando más o menos la jarra.',
    impact: [
      'Flujo lento → más control, líneas finas, detalles precisos',
      'Flujo rápido → base blanca más amplia, menos definición',
      'Flujo irregular → figuras asimétricas o rotas'
    ],
    tip: 'Practica vertiendo agua para dominar la velocidad antes de usar leche.'
  },
  {
    id: 'integration',
    name: 'Integración (hundimiento)',
    description: 'Cuando viertes desde altura, la leche se hunde bajo la crema sin dejar marca. Es la primera fase del vertido.',
    impact: [
      'Buena integración → base limpia para dibujar encima',
      'Poca integración → taza manchada, sin definición',
      'Exceso de integración → poca crema visible, color pálido'
    ],
    tip: 'Integra hasta llenar el 50-60% de la taza antes de empezar el diseño.'
  },
  {
    id: 'height',
    name: 'Altura del vertido',
    description: 'La distancia entre el pico de la jarra y la superficie del café. Controla si la leche se hunde o flota.',
    impact: [
      'Alto (>10cm) → leche se hunde, integración perfecta',
      'Bajo (<3cm) → leche flota, crea contraste blanco',
      'La transición de alto a bajo es el momento de empezar el diseño'
    ],
    tip: 'El momento de bajar la jarra es cuando quieras que la leche empiece a "pintar".'
  },
  {
    id: 'wrist-movement',
    name: 'Movimiento de muñeca',
    description: 'Los movimientos laterales de la muñeca crean los patrones y detalles del diseño.',
    impact: [
      'Movimiento rápido y corto → hojas finas (rosetta)',
      'Movimiento amplio y lento → base más gruesa',
      'Sin movimiento → forma circular (corazón, punto)'
    ],
    tip: 'El movimiento debe ser de muñeca, no de brazo. Mantén el codo estable.'
  },
  {
    id: 'milk-texture',
    name: 'Textura de la leche',
    description: 'La calidad de la microespuma determina la capacidad de la leche para crear contraste y detalles.',
    impact: [
      'Microespuma perfecta → pintura suave, contraste nítido',
      'Espuma muy gruesa → burbujas visibles, figuras burdas',
      'Leche sin espuma → se hunde sin dejar marca'
    ],
    tip: 'La leche debe parecer pintura brillante. Si ves burbujas, golpea la jarra contra la mesa y gira.'
  },
  {
    id: 'crema-quality',
    name: 'Calidad de la crema/espresso',
    description: 'La densidad y frescura de la crema del espresso actúa como "lienzo" para el arte.',
    impact: [
      'Crema densa y fresca → excelente contraste, figuras definidas',
      'Crema delgada → leche se hunde fácilmente, poco contraste',
      'Sin crema → imposible hacer latte art visible'
    ],
    tip: 'Usa café fresco (7-21 días post-tueste) y extrae bien para crema abundante.'
  },
  {
    id: 'pitcher-position',
    name: 'Posición de la jarra',
    description: 'Desde dónde viertes en la taza determina la ubicación y flujo del diseño.',
    impact: [
      'Centro → figuras centradas y simétricas',
      'Lateral → figuras asimétricas o desplazadas',
      'Es clave para el "arrastre" final del diseño'
    ],
    tip: 'Empieza desde un lado y mueve hacia el centro para la rosetta. Para corazón, empieza en el centro.'
  },
  {
    id: 'cup-angle',
    name: 'Ángulo de la taza',
    description: 'Inclinar la taza acerca la superficie del café a la jarra sin necesidad de bajar tanto.',
    impact: [
      'Taza inclinada → más fácil empezar el diseño desde el inicio',
      'Taza recta → más difícil al inicio, pero mejor para figuras grandes',
      'Enderezar la taza progresivamente estabiliza el diseño'
    ],
    tip: 'Inclina ~30° al inicio y endereza gradualmente mientras viertes.'
  },
  {
    id: 'timing',
    name: 'Momento de empezar el diseño',
    description: 'Cuándo transicionas de integración (alto) a diseño (bajo). Demasiado pronto o tarde arruina el resultado.',
    impact: [
      'Demasiado pronto → poca base, diseño se hunde en café oscuro',
      'Demasiado tarde → poco espacio, figura comprimida o desborda',
      'Ideal → cuando la taza está 50-60% llena'
    ],
    tip: 'Observa el nivel de la taza. Cuando veas que falta un tercio, baja la jarra y empieza.'
  }
];

const LATTE_ART_PATTERNS: LatteArtPattern[] = [
  {
    id: 'heart',
    name: 'Corazón',
    difficulty: 'Básico',
    description: 'El patrón fundamental del latte art. Dominar el corazón es la base para todos los demás diseños.',
    steps: [
      'Inclina la taza ~30° e integra leche desde altura hasta llenar 50-60%',
      'Baja la jarra cerca de la superficie en el centro de la taza',
      'Vierte con flujo constante sin mover la muñeca — se formará un círculo blanco',
      'Cuando el círculo sea del tamaño deseado, levanta ligeramente la jarra',
      'Arrastra a través del centro del círculo hacia el borde opuesto para formar la punta'
    ],
    keyVariables: ['Flujo constante sin movimiento lateral', 'Transición de alto a bajo precisa', 'Arrastre final firme y rápido']
  },
  {
    id: 'tulip',
    name: 'Tulipán',
    difficulty: 'Intermedio',
    description: 'Capas superpuestas que crean un efecto de pétalos. Se construye con múltiples "corazones" empujados.',
    steps: [
      'Integra hasta 50-60% de la taza',
      'Baja la jarra y vierte un punto blanco pequeño (primer pétalo)',
      'Levanta la jarra ligeramente y muévela hacia adelante (~1cm)',
      'Baja de nuevo y vierte otro punto que "empuje" al anterior',
      'Repite 3-5 veces, cada punto empujando al anterior hacia atrás',
      'En el último punto, arrastra a través de todos los pétalos hacia el borde'
    ],
    keyVariables: ['Consistencia en el tamaño de cada pétalo', 'Avanzar la jarra entre cada vertido', 'Arrastre final atravesando todos los pétalos']
  },
  {
    id: 'rosetta',
    name: 'Rosetta',
    difficulty: 'Intermedio',
    description: 'Patrón de hojas creado con movimiento lateral de muñeca. Es el diseño más reconocido del latte art profesional.',
    steps: [
      'Integra hasta 50% de la taza',
      'Baja la jarra cerca de la superficie en un extremo de la taza',
      'Empieza a mover la muñeca de lado a lado rápidamente mientras viertes',
      'Avanza lentamente la jarra hacia el otro extremo de la taza mientras mueves la muñeca',
      'Cada oscilación de la muñeca crea una "hoja" del patrón',
      'Al llegar al final, detén el movimiento lateral y arrastra a través del centro'
    ],
    keyVariables: ['Velocidad constante del movimiento de muñeca', 'Avance progresivo hacia adelante', 'Flujo constante durante todo el movimiento']
  },
  {
    id: 'inverted-heart',
    name: 'Corazón Invertido',
    difficulty: 'Básico',
    description: 'Variación del corazón donde el arrastre va en dirección opuesta, creando la punta apuntando hacia ti.',
    steps: [
      'Inclina la taza e integra hasta 50-60%',
      'Baja la jarra cerca de la superficie en el lado más lejano de la taza',
      'Vierte un círculo blanco estable',
      'Arrastra hacia ti (hacia tu cuerpo) a través del centro del círculo',
      'La punta del corazón quedará apuntando hacia quien bebe'
    ],
    keyVariables: ['Igual técnica que el corazón pero con dirección de arrastre invertida', 'Posición inicial del vertido en la parte lejana']
  },
  {
    id: 'swan',
    name: 'Cisne',
    difficulty: 'Avanzado',
    description: 'Combinación de rosetta (cuerpo) + corazón o S-curve (cuello/cabeza). Patrón de nivel competitivo.',
    steps: [
      'Integra hasta 40-50% de la taza',
      'Comienza una rosetta que ocupe 2/3 de la taza (cuerpo del cisne)',
      'Detén el movimiento de muñeca y levanta la jarra',
      'Mueve la jarra al espacio vacío y baja de nuevo',
      'Dibuja una S-curva o un corazón pequeño para el cuello y cabeza',
      'Arrastra suavemente a través para definir el cuello'
    ],
    keyVariables: ['Rosetta compacta para el cuerpo', 'Transición limpia al cuello', 'Proporción entre cuerpo y cabeza']
  },
  {
    id: 'triple-rosetta',
    name: 'Triple Rosetta',
    difficulty: 'Avanzado',
    description: 'Tres rosettas independientes dentro de la misma taza. Requiere control preciso del espacio y el flujo.',
    steps: [
      'Integra hasta 40% de la taza',
      'Divide mentalmente la taza en tres secciones',
      'Vierte la primera rosetta pequeña en una sección',
      'Levanta, reposiciona, y vierte la segunda rosetta en la siguiente sección',
      'Repite para la tercera rosetta',
      'Opcionalmente, arrastra a través de las tres para unirlas'
    ],
    keyVariables: ['Control del espacio en la taza', 'Rosettas de tamaño uniforme', 'Velocidad para completar antes de que la crema se deteriore']
  },
  {
    id: 'chained-hearts',
    name: 'Corazones Encadenados',
    difficulty: 'Intermedio',
    description: 'Secuencia de corazones conectados que crean una cadena visual elegante.',
    steps: [
      'Integra hasta 50% de la taza',
      'Vierte un corazón pequeño en un extremo',
      'Sin levantar mucho, avanza y vierte otro corazón que toque al anterior',
      'Repite para crear 3-4 corazones encadenados',
      'Arrastra a través de todos al final para conectarlos visualmente'
    ],
    keyVariables: ['Tamaño consistente entre corazones', 'Separación uniforme', 'Cada corazón debe tocar al anterior']
  },
  {
    id: 'phoenix-wing',
    name: 'Ala de Fénix',
    difficulty: 'Avanzado',
    description: 'Rosetta extendida con movimientos amplios que simula un ala desplegándose. Diseño artístico avanzado.',
    steps: [
      'Integra hasta 45% de la taza',
      'Comienza una rosetta con movimientos de muñeca amplios',
      'Progresivamente reduce la amplitud del movimiento para crear efecto de plumas',
      'El patrón debe cubrir más de la mitad de la taza',
      'Finaliza con un arrastre largo y curvo para definir el "tallo" del ala'
    ],
    keyVariables: ['Amplitud decreciente del movimiento', 'Flujo generoso para cubrir gran área', 'Arrastre curvo final']
  },
  {
    id: 'etching-detail',
    name: 'Latte Art con Etching',
    difficulty: 'Intermedio',
    description: 'Técnica donde se dibuja sobre la superficie usando herramientas (palillo, thermopen) después del vertido.',
    steps: [
      'Vierte cualquier base (corazón, círculo blanco, etc.)',
      'Usa un palillo fino, thermopen o aguja de latte art',
      'Arrastra la crema oscura hacia la zona blanca o viceversa para crear detalles',
      'Técnicas: puntos arrastrados (drag dots), líneas finas, espirales',
      'Trabaja rápido antes de que la superficie se solidifique'
    ],
    keyVariables: ['Herramienta fina y limpia', 'Velocidad del trabajo', 'Contraste entre zonas claras y oscuras']
  },
  {
    id: 'heart-detail',
    name: 'Corazón con Detalle Central',
    difficulty: 'Intermedio',
    description: 'Un corazón base con un detalle adicional (punto, mini-rosetta o línea) dentro del diseño principal.',
    steps: [
      'Vierte un corazón base más grande de lo normal',
      'Antes del arrastre final, vierte un detalle pequeño dentro del corazón',
      'Puede ser un punto blanco, una mini-rosetta, o un mini-tulipán',
      'Arrastra a través tanto del detalle como del corazón para finalizar'
    ],
    keyVariables: ['Corazón base suficientemente grande', 'Detalle proporcional al corazón', 'Arrastre que integre ambos elementos']
  }
];

// ─── Components ──────────────────────────────────────────────────────────────

const TechniqueTab: React.FC = () => (
  <div className="space-y-8 animate-fade-in">
    {/* Free Pour */}
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-base md:text-lg font-black uppercase tracking-[0.25em] text-stone-900 dark:text-stone-100">
          Técnica de Latte Art
        </h2>
        <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
          Dos técnicas principales para crear diseños en café con leche. La mayoría del latte art profesional usa Free Pour.
        </p>
      </div>
    </div>

    {/* Free Pour Section */}
    <div className="space-y-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-stone-100 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-black">1</span>
        Free Pour (Vertido Libre)
      </h3>
      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
        Técnica donde el diseño se crea exclusivamente con el movimiento de la jarra mientras se vierte la leche. No se usan herramientas adicionales.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { step: 1, title: 'Preparar el espresso', desc: 'Extrae un espresso con buena crema. Debes tener la leche texturizada lista al mismo tiempo.' },
          { step: 2, title: 'Golpear y girar la jarra', desc: 'Golpea la base de la jarra contra la mesa para romper burbujas grandes. Gira suavemente para integrar la espuma.' },
          { step: 3, title: 'Inclinar la taza', desc: 'Inclina la taza ~30° hacia ti. Esto acerca la superficie del café a la jarra.' },
          { step: 4, title: 'Integrar (fase alta)', desc: 'Vierte desde ~10cm de altura al centro. La leche se hundirá bajo la crema. Continúa hasta llenar 50-60%.' },
          { step: 5, title: 'Diseñar (fase baja)', desc: 'Baja la jarra a <2cm de la superficie y empieza el patrón. La leche ahora flotará y creará contraste.' },
          { step: 6, title: 'Arrastrar para finalizar', desc: 'Levanta la jarra ligeramente y arrastra a través del diseño con un flujo fino para definir la forma final.' }
        ].map(item => (
          <div key={item.step} className="flex gap-3 p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
            <span className="flex-none w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-[10px] font-black text-stone-500">
              {item.step}
            </span>
            <div>
              <p className="font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-1">{item.title}</p>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Etching Section */}
    <div className="space-y-4 pt-6 border-t border-stone-200 dark:border-stone-800">
      <h3 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-stone-100 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-black">2</span>
        Etching (Grabado)
      </h3>
      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
        Técnica donde se usa un palillo, thermopen o aguja para dibujar directamente sobre la superficie del café después de verter la leche. Permite diseños más detallados pero menos "naturales".
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { step: 1, title: 'Base de leche', desc: 'Vierte leche sin diseño específico, creando una superficie uniforme blanca-marrón.' },
          { step: 2, title: 'Herramienta fina', desc: 'Usa palillo de madera, thermopen, o aguja dedicada para latte art.' },
          { step: 3, title: 'Técnica de arrastre', desc: 'Arrastra desde la crema oscura hacia la leche blanca (o viceversa) para crear líneas y formas.' },
          { step: 4, title: 'Trabajo rápido', desc: 'La superficie se estabiliza en 15-30 segundos. Trabaja con decisión y velocidad.' }
        ].map(item => (
          <div key={item.step} className="flex gap-3 p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
            <span className="flex-none w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-[10px] font-black text-stone-500">
              {item.step}
            </span>
            <div>
              <p className="font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-1">{item.title}</p>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Key Rules */}
    <div className="p-5 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-stone-200 dark:border-stone-800">
      <h4 className="font-black text-xs uppercase tracking-widest text-stone-900 dark:text-stone-100 mb-3">Reglas Fundamentales</h4>
      <ul className="space-y-2">
        {[
          'La leche debe tener textura de pintura brillante — sin burbujas visibles',
          'La crema del espresso debe ser densa y fresca (máximo 10 segundos de edad)',
          'La transición de alto a bajo es el momento más importante del vertido',
          'Practica con agua y jabón antes de usar leche real',
          'Consistencia > Velocidad. Un diseño limpio y simple supera a uno complejo y sucio'
        ].map((rule, i) => (
          <li key={i} className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed flex items-start gap-2">
            <span className="text-brand mt-0.5">✦</span> {rule}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const VariablesTab: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3">
        <h2 className="text-base md:text-lg font-black uppercase tracking-[0.25em] text-stone-900 dark:text-stone-100">
          Variables del Latte Art
        </h2>
        <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
          Cada factor que influye en el resultado final del diseño. Dominar estas variables te permite replicar y mejorar tu latte art consistentemente.
        </p>
      </div>

      <div className="grid gap-3">
        {LATTE_ART_VARIABLES.map((variable, index) => {
          const isOpen = openId === variable.id;
          return (
            <div key={variable.id} className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-900 transition-all">
              <button
                onClick={() => setOpenId(isOpen ? null : variable.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex-none w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-[10px] font-black text-stone-500">
                    {index + 1}
                  </span>
                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                    {variable.name}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 flex-none text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 pt-0 border-t border-stone-100 dark:border-stone-800 space-y-3">
                  <div className="mt-3">
                    <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{variable.description}</p>
                  </div>
                  <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Impacto</p>
                    <ul className="space-y-1">
                      {variable.impact.map((imp, i) => (
                        <li key={i} className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed flex items-start gap-2">
                          <span className="text-stone-400 mt-1">•</span> {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 bg-brand/5 dark:bg-brand/10 rounded-lg border border-brand/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-1">Tip</p>
                    <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{variable.tip}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PatternsTab: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Básico': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Intermedio': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Avanzado': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3">
        <h2 className="text-base md:text-lg font-black uppercase tracking-[0.25em] text-stone-900 dark:text-stone-100">
          Patrones de Latte Art
        </h2>
        <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
          Desde los diseños fundamentales hasta patrones avanzados de competición. Cada patrón incluye paso a paso y variables clave.
        </p>
      </div>

      <div className="grid gap-3">
        {LATTE_ART_PATTERNS.map((pattern, index) => {
          const isOpen = openId === pattern.id;
          return (
            <div key={pattern.id} className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-900 transition-all">
              <button
                onClick={() => setOpenId(isOpen ? null : pattern.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="flex-none w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-[10px] font-black text-stone-500">
                    {index + 1}
                  </span>
                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                    {pattern.name}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex-none ${getDifficultyColor(pattern.difficulty)}`}>
                    {pattern.difficulty}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 flex-none text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 pt-0 border-t border-stone-100 dark:border-stone-800 space-y-4">
                  <div className="mt-3">
                    <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{pattern.description}</p>
                  </div>

                  {/* Steps */}
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3">Paso a Paso</p>
                    <ol className="space-y-2">
                      {pattern.steps.map((step, i) => (
                        <li key={i} className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed flex items-start gap-3">
                          <span className="flex-none w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-[9px] font-black text-stone-600 dark:text-stone-400 mt-0.5">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Key Variables */}
                  <div className="p-4 bg-brand/5 dark:bg-brand/10 rounded-lg border border-brand/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-2">Variables Clave</p>
                    <ul className="space-y-1">
                      {pattern.keyVariables.map((v, i) => (
                        <li key={i} className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed flex items-start gap-2">
                          <span className="text-brand mt-0.5">✦</span> {v}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main View ───────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

export const LatteArtView: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'tecnica' | 'variables' | 'patrones'>('tecnica');

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 pb-20">
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter text-stone-900 dark:text-stone-100">Latte Art</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hidden sm:block">Técnica, variables y patrones</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto scrollbar-hide">
            {[
              { id: 'tecnica', label: 'Técnica' },
              { id: 'variables', label: 'Variables' },
              { id: 'patrones', label: 'Patrones' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand text-brand'
                    : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                }`}
              >{tab.label}</button>
            ))}
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-stone-950 pointer-events-none md:hidden" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'tecnica' && <TechniqueTab />}
        {activeTab === 'variables' && <VariablesTab />}
        {activeTab === 'patrones' && <PatternsTab />}
      </div>
    </div>
  );
};

export default LatteArtView;
