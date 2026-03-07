import React, { useState, useEffect } from 'react';
import { ArrowLeft, Brain, Check, Trophy, X, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Data: Variables & Stages ────────────────────────────────────────────────

interface RoastItem {
  id: string;
  name: string;
  type: string;
  description: string;
  impact: string[];
}

const ROAST_VARIABLES: RoastItem[] = [
  {
    id: 'charge-temp', name: 'Temperatura de carga', type: 'Temperatura inicial del tambor al introducir el café.',
    description: 'La temperatura del tambor en el momento de cargar el café verde. Determina la agresividad del inicio del tueste y la velocidad con que el grano comienza a absorber calor.',
    impact: ['Carga alta → secado rápido, riesgo de scorching.', 'Carga baja → secado lento, riesgo de baking.', 'Debe ajustarse según densidad y humedad del grano.']
  },
  {
    id: 'ror', name: 'Rate of Rise (RoR)', type: 'Velocidad de incremento de temperatura (°C/min o °F/min).',
    description: 'Mide cuántos grados sube la temperatura de la masa de café por minuto. Es el indicador principal para controlar el perfil de tueste en tiempo real.',
    impact: ['RoR alto → desarrollo rápido, riesgo de tipping.', 'RoR bajo → desarrollo lento, riesgo de baking.', 'Un RoR decreciente y controlado es generalmente ideal.']
  },
  {
    id: 'dev-time', name: 'Tiempo de desarrollo', type: 'Duración desde el primer crack hasta la descarga.',
    description: 'El periodo entre el primer crack y el punto de descarga. Es donde se generan la mayoría de las reacciones de Maillard y caramelización que definen el perfil final.',
    impact: ['Demasiado corto → subdesarrollado, notas verdes.', 'Demasiado largo → plano, sin brillo, notas a cereal.', 'Generalmente: 15–25% del tiempo total del tueste.']
  },
  {
    id: 'airflow', name: 'Flujo de aire (Airflow)', type: 'Cantidad de aire caliente circulando dentro del tambor.',
    description: 'Controla la convección dentro de la tostadora. Más aire = más transferencia de calor por convección. Menos aire = más conducción (contacto con el tambor).',
    impact: ['Alto airflow → tueste más limpio, mayor claridad.', 'Bajo airflow → más cuerpo, notas más densas.', 'Ayuda a evacuar humo y chaff durante el tueste.']
  },
  {
    id: 'drum-speed', name: 'Velocidad del tambor (RPM)', type: 'Rotaciones por minuto del tambor.',
    description: 'Determina la agitación mecánica del café dentro del tambor. Más RPM = más uniformidad de contacto pero menos tiempo de contacto individual con la pared.',
    impact: ['RPM alto → tueste más uniforme, menor riesgo de quemaduras.', 'RPM bajo → mayor contacto con el metal, riesgo de scorching.', 'Debe balancearse con gas y airflow.']
  },
  {
    id: 'turning-point', name: 'Punto de inflexión (Turning Point)', type: 'Punto de temperatura mínima después de la carga.',
    description: 'Cuando el café verde frío se carga en el tambor caliente, la temperatura cae bruscamente. El turning point es donde la temperatura deja de caer y empieza a subir. Marca el inicio real del tueste.',
    impact: ['Turning point alto → carga demasiado caliente o batch pequeño.', 'Turning point bajo → carga fría o batch grande.', 'Idealmente alcanzar en 1-2 minutos después de la carga.']
  },
  {
    id: 'gas-power', name: 'Potencia de gas / calor', type: 'Energía térmica aplicada al sistema.',
    description: 'La cantidad de energía calorífica que alimenta al tambor. Es la herramienta principal junto con el airflow para controlar el RoR y el perfil de la curva.',
    impact: ['Gas alto → RoR sube rápido, tueste agresivo.', 'Gas bajo → RoR cae, tueste más suave.', 'Los ajustes de gas tienen un delay de respuesta de 30-60 segundos.']
  },
  {
    id: 'end-temp', name: 'Temperatura de descarga', type: 'Temperatura final del grano al sacar del tambor.',
    description: 'La temperatura a la cual se detiene el tueste y se descarga el café al enfriador. Es un indicador (no definitivo) del grado de tueste.',
    impact: ['No es un valor absoluto (varía entre tostadoras y sondas).', 'Sirve como referencia para replicar un perfil.', 'Debe complementarse con color, tiempo y datos sensoriales.']
  }
];

const ROAST_STAGES: RoastItem[] = [
  {
    id: 'drying', name: 'Secado (Drying)', type: 'Fase 1: Desde la carga hasta aprox. 150°C (color amarillo).',
    description: 'El grano pierde la humedad libre y comienza a cambiar de verde a amarillo pálido. La reacción es endotérmica (el grano absorbe calor). Puede representar el 40-50% del tiempo total.',
    impact: ['Si es demasiado rápido → superficie seca pero interior húmedo (desarrollo desigual).', 'Si es demasiado lento → pérdida de aromas volátiles, riesgo de baking.', 'Olor: pasto recién cortado → pan tostado.']
  },
  {
    id: 'maillard', name: 'Maillard (Caramelización)', type: 'Fase 2: Desde ~150°C hasta el primer crack (~195-205°C).',
    description: 'Se producen las reacciones de Maillard (aminoácidos + azúcares reductores) y la caramelización. Es donde se desarrollan los compuestos aromáticos complejos, la dulzura y el color marrón.',
    impact: ['Es la fase donde más sabor se genera.', 'RoR debe ser decreciente pero sostenido.', 'Olor: caramelo, pan horneado, frutos secos tostados.']
  },
  {
    id: 'first-crack', name: 'Primer Crack (1C)', type: 'Evento: Sonido audible de cracking a ~195-205°C.',
    description: 'El vapor de agua y CO₂ internos generan suficiente presión para fracturar la estructura celular del grano. Se escucha un sonido similar a palomitas de maíz. El grano expande ~50-100% de su volumen.',
    impact: ['Marca el inicio del "desarrollo" — el período más crítico.', 'El café es técnicamente bebible a partir del primer crack.', 'Es la referencia principal para definir el grado de tueste.']
  },
  {
    id: 'development', name: 'Desarrollo (Development)', type: 'Fase 3: Desde el primer crack hasta la descarga.',
    description: 'Periodo post-crack donde se refinan y completan las reacciones. Aquí se define el balance final entre acidez, dulzor y amargor. Las decisiones de tiempo y energía en esta fase son las más críticas.',
    impact: ['Corto → acidez prominente, notas de origen definidas.', 'Medio → balance entre acidez, dulzura y cuerpo.', 'Largo → amargor, cuerpo pesado, notas de tueste dominan sobre el origen.']
  },
  {
    id: 'second-crack', name: 'Segundo Crack (2C)', type: 'Evento: Cracking más suave/rápido a ~225-235°C.',
    description: 'Los aceites internos del grano comienzan a migrar hacia la superficie. El sonido es más rápido y sutil que el primer crack. El grano se vuelve brillante y aceitoso. A partir de aquí se entra en territorio de tueste oscuro.',
    impact: ['La mayoría de cafés de especialidad NO llegan al segundo crack.', 'A partir de 2C se pierden las notas de origen.', 'Dominan: carbón, ceniza, humo, chocolate muy oscuro.']
  }
];

interface RoasterType {
  id: string;
  name: string;
  mechanism: string;
  pros: string[];
  cons: string[];
  bestFor: string;
}

const ROASTER_TYPES: RoasterType[] = [
  {
    id: 'conventional', name: 'Tostadora de tambor a gas (Convencional)',
    mechanism: 'Tuestan por conducción (contacto con el tambor caliente) y convección (aire caliente generado por quemadores de gas). El café gira dentro de un tambor cilíndrico metálico.',
    pros: ['Control preciso de gas, airflow y RPM.', 'Perfil de tueste altamente replicable.', 'Genera cuerpo y dulzura naturalmente.', 'Es el estándar de la industria de especialidad.'],
    cons: ['Requiere experiencia para evitar scorching.', 'Dependencia de gas (infraestructura).', 'Curva de aprendizaje pronunciada.'],
    bestFor: 'Cafés de especialidad donde se busca cuerpo, dulzura y desarrollo controlado. La gran mayoría de tostadurías de especialidad usan este tipo.'
  },
  {
    id: 'convection', name: 'Tostadora de convección (Air Roaster / Fluid Bed)',
    mechanism: 'Tuestan predominantemente por convección: un flujo de aire caliente suspende y agita los granos. No hay contacto directo con una superficie metálica caliente.',
    pros: ['Tueste muy uniforme (cada grano recibe aire por igual).', 'Mayor claridad y brillo en taza.', 'Menor riesgo de scorching.', 'Tuestes más rápidos (ciclos de 6-10 min).'],
    cons: ['Menor cuerpo comparado con tambor.', 'Menos capacidad de control granular.', 'Puede perder complejidad en tuestes muy claros.'],
    bestFor: 'Cafés donde se prioriza claridad, acidez limpia y consistencia. Popular en tostadurías de menor escala y algunos mercados asiáticos.'
  },
  {
    id: 'electric', name: 'Tostadora eléctrica',
    mechanism: 'Usan resistencias eléctricas como fuente de calor en lugar de gas. Pueden ser de tambor o de convección. La transferencia de calor es por conducción (resistencia → tambor → grano) o convección (aire calentado eléctricamente).',
    pros: ['No requiere instalación de gas.', 'Más seguras en espacios cerrados.', 'Menor emisión de partículas.', 'Algunas permiten perfiles automatizados.'],
    cons: ['Respuesta térmica más lenta que el gas.', 'Capacidad de potencia limitada en algunos modelos.', 'Pueden tener dificultad para tuestes muy agresivos.'],
    bestFor: 'Espacios sin acceso a gas, micro-tostadurías urbanas, o donde las regulaciones restringen el uso de llama abierta. Cada vez más comunes en modelos de gama alta.'
  }
];

// ─── Data: Profiles & Errors ─────────────────────────────────────────────────

interface RoastProfile {
  id: string;
  name: string;
  tempRange: string;
  description: string;
  howToAchieve: string;
  cupProfile: string;
  howToIdentify: string;
  brewRecommendation: string;
  brewWhy: string;
}

const ROAST_PROFILES: RoastProfile[] = [
  {
    id: 'light', name: 'Claro (Light)', tempRange: '~195–205°C (inicio a medio 1C)',
    description: 'Se detiene al inicio o durante el primer crack. El grano conserva la mayoría de sus ácidos orgánicos y compuestos volátiles de origen.',
    howToAchieve: 'Carga a temperatura media-alta, RoR decreciente pero sostenido. Descarga al inicio-medio del primer crack. Desarrollo 15-18% del tiempo total. Enfriamiento rápido.',
    cupProfile: 'Acidez brillante y compleja, notas florales y frutales intensas, cuerpo ligero a medio, dulzor delicado, postgusto limpio y vibrante. Las notas de origen dominan completamente.',
    howToIdentify: 'Color canela claro, superficie seca y mate (sin aceite), poco aroma a "tostado", mantiene marcas de la línea central (center cut) bien visibles. Agrotan un tono más claro que #58.',
    brewRecommendation: 'Métodos de filtrado (V60, Chemex, Kalita). Ratio 1:15–1:17. Agua a 92–96°C. Molienda media-fina.',
    brewWhy: 'El filtrado permite que la acidez y las notas delicadas se expresen con claridad. Agua muy caliente extrae los compuestos frutales. No se recomienda espresso a menos que se domine la extracción (puede ser muy ácido).'
  },
  {
    id: 'medium-light', name: 'Medio Claro (Medium-Light)', tempRange: '~205–212°C (final de 1C)',
    description: 'Se detiene al final del primer crack o justo después de que el cracking se calma. Es el sweet spot para muchos cafés de especialidad de alta calidad.',
    howToAchieve: 'Carga similar al claro pero con desarrollo más largo (18-22% del tiempo total). Dejar que el crack se complete. RoR bajo y controlado en la fase de desarrollo.',
    cupProfile: 'Balance ideal entre acidez y dulzor. Notas de origen presentes pero con caramelo y chocolate emergiendo. Cuerpo medio, postgusto balanceado y dulce.',
    howToIdentify: 'Color marrón claro uniforme, superficie mate pero ligeramente satinada. Aroma equilibrado entre frutal y caramelo. Línea central aún visible.',
    brewRecommendation: 'Filtrado y espresso (es el tueste más versátil). Filtrado: 1:15-1:16. Espresso: 1:2-1:2.5, 25-30s.',
    brewWhy: 'La versatilidad de este tueste permite que funcione bien en ambos métodos. En espresso produce shots dulces con acidez balanceada. En filtrado mantiene la claridad aromática.'
  },
  {
    id: 'medium', name: 'Medio (Medium)', tempRange: '~212–220°C (entre 1C y 2C)',
    description: 'Territorio intermedio entre los cracks. Las notas de tueste (caramelo, nuez, chocolate) empiezan a equilibrarse con las notas de origen.',
    howToAchieve: 'Desarrollo 20-25% del tiempo total. El grano ha pasado completamente el primer crack y la temperatura sigue subiendo de forma controlada. Gas reducido al mínimo necesario.',
    cupProfile: 'Cuerpo medio-alto, dulzor pronunciado (chocolate con leche, nuez, caramelo), acidez baja pero presente, postgusto medio a largo con notas a tostado suave.',
    howToIdentify: 'Color marrón medio uniforme, superficie satinada con inicio de brillo aceitoso. Aroma predominantemente a tostado/caramelo. Línea central empezando a difuminarse.',
    brewRecommendation: 'Espresso (es su territorio ideal), French Press, Moka. Espresso: 1:1.5-1:2, 25-28s. French Press: 1:14-1:15.',
    brewWhy: 'El cuerpo y la dulzura de un tueste medio brillan en métodos de inmersión y espresso. La presión del espresso extrae los azúcares caramelizados de forma óptima.'
  },
  {
    id: 'medium-dark', name: 'Medio Oscuro (Medium-Dark)', tempRange: '~220–230°C (cerca de 2C)',
    description: 'Se acerca al segundo crack. Los aceites comienzan a migrar a la superficie. Las notas de origen prácticamente desaparecen, reemplazadas por notas de tueste.',
    howToAchieve: 'Desarrollo largo (>25% del tiempo total). Requiere mantener un RoR muy bajo pero positivo para no caer en baking. Monitorear visualmente el brillo del grano.',
    cupProfile: 'Cuerpo pesado, amargor estructural tipo chocolate oscuro, notas a caramelo quemado, especias, tabaco suave. Acidez mínima. Postgusto largo y amargo.',
    howToIdentify: 'Color marrón oscuro, superficie brillante con aceite visible. Aroma intenso a tostado, humo suave. La línea central ya no es visible. Grano grande y ligero.',
    brewRecommendation: 'Espresso tradicional italiano, Moka, bebidas con leche. Espresso: 1:1.5-1:2, 22-27s.',
    brewWhy: 'La intensidad de este tueste necesita métodos que concentren el sabor. Funciona excelente con leche porque el cuerpo pesado y el amargor cortan a través de la dulzura láctea.'
  },
  {
    id: 'dark', name: 'Oscuro (Dark / French / Italian)', tempRange: '~230°C+ (durante o después de 2C)',
    description: 'Supera el segundo crack. El grano está carbonizado parcialmente. Los aceites cubren la superficie por completo. Todo el perfil de origen ha sido destruido — solo quedan notas de tueste.',
    howToAchieve: 'Llegar al segundo crack y continuar. Alto riesgo de incendio si no se controla. El grano pierde masa rápidamente (merma >18%). No recomendado para cafés de especialidad.',
    cupProfile: 'Amargor dominante, ceniza, carbón, humo, chocolate muy oscuro. Cuerpo paradójicamente puede sentirse delgado (la estructura celular se ha destruido). Sin acidez.',
    howToIdentify: 'Color negro-marrón, superficie completamente aceitosa y brillante. Aroma a humo y carbón. Grano muy ligero y poroso, se rompe fácilmente.',
    brewRecommendation: 'Espresso italiano clásico, Turkish coffee. Dosis altas. Siempre con azúcar o leche.',
    brewWhy: 'La carbonización hace que la extracción sea rápida pero áspera. Solo funciona en métodos que disimulan la agresividad: con leche, azúcar, o en preparaciones culturalmente asociadas al tueste oscuro.'
  }
];

interface RoastProblem {
  id: string;
  name: string;
  description: string;
  cause: string;
  cupImpact: string;
}

const ROAST_PROBLEMS: RoastProblem[] = [
  { id: 'baking', name: 'Baking', description: 'El RoR cae a cero o se vuelve plano por un periodo prolongado durante el tueste, especialmente en la fase de Maillard o desarrollo.', cause: 'Gas demasiado bajo, carga a temperatura muy baja, o airflow excesivo que enfría la masa de café.', cupImpact: 'Sabor plano, a pan viejo, a cereal, sin brillo ni acidez. Falta total de dulzura y vida. Es el error más común en tueste de especialidad.' },
  { id: 'tipping', name: 'Tipping', description: 'Los bordes y puntas del grano se queman mientras el centro permanece subdesarrollado.', cause: 'RoR demasiado alto durante el secado o la carga. Temperatura de carga excesiva. La superficie absorbe calor más rápido que el centro.', cupImpact: 'Notas a carbón/ceniza mezcladas con acidez vegetal. Sabor confuso y sucio.' },
  { id: 'scorching', name: 'Scorching', description: 'La superficie plana del grano se quema por contacto directo con el tambor sobrecalentado.', cause: 'Tambor demasiado caliente, RPM del tambor muy bajas, carga insuficiente para el tamaño del tambor.', cupImpact: 'Manchas oscuras en el grano. Sabor a quemado, humo y carbón. Amargo agresivo no integrado.' },
  { id: 'crash', name: 'Crash / Flick', description: 'El RoR cae abruptamente durante la fase de desarrollo, creando un "valle" en la curva, seguido a veces de un rebote no controlado (flick).', cause: 'Reducción excesiva de gas justo antes o durante el primer crack. Falta de anticipación en los ajustes de energía.', cupImpact: 'Desarrollo desigual: notas de baking mezcladas con acidez aguda. Sabor a grano crudo con final plano.' },
  { id: 'underdevelopment', name: 'Subdesarrollo', description: 'El café se descarga antes de completar el desarrollo mínimo necesario post-crack. El centro del grano no ha reaccionado completamente.', cause: 'Desarrollo inferior al 15% del tiempo total. Descarga demasiado temprana por miedo a pasar de tueste.', cupImpact: 'Acidez agresiva y verde, sabor a hierba, maní crudo, cereal sin tostar. Astringencia. Cuerpo delgado.' },
  { id: 'overdevelopment', name: 'Sobredesarrollo', description: 'El café permanece demasiado tiempo después del crack. Se pierden los ácidos orgánicos y los compuestos volátiles se degradan.', cause: 'Desarrollo superior al 30% del tiempo total, o temperatura de descarga demasiado alta para el perfil deseado.', cupImpact: 'Sabor a ceniza, carbón, humo. Amargor dominante. Pérdida total de acidez y notas de origen. Postgusto seco.' },
  { id: 'too-fast', name: 'Tueste demasiado rápido', description: 'El tueste completo dura menos de 7-8 minutos. Las reacciones químicas no tienen tiempo de completarse.', cause: 'Gas demasiado alto, carga demasiado grande para la capacidad, o batch pequeño en un tambor grande.', cupImpact: 'Superficie quemada con centro crudo. Tipping extremo. Mezcla de sabores a carbón y hierba verde.' },
  { id: 'stalling', name: 'Stalling (Estancamiento)', description: 'El RoR se detiene o cae drásticamente durante el tueste, prolongando una fase a un tiempo inadecuado.', cause: 'Corte de gas demasiado agresivo, sobrecarga del tambor, problemas mecánicos de airflow o gas.', cupImpact: 'Baking localizado en la fase donde ocurre el stall. Notas a pan, cartón y falta de carácter.' },
  { id: 'quakers', name: 'Quakers en batch', description: 'Granos inmaduros que no caramtelizan durante el tueste y quedan pálidos. No es un error de tueste sino de selección de verde, pero se manifiesta en el tueste.', cause: 'Café verde con alto porcentaje de granos inmaduros. Cosecha no selectiva. Defecto de materia prima.', cupImpact: 'Sabor a maní crudo, papel, astringencia. Un solo quaker puede introducir notas desagradables en una preparación.' },
  { id: 'uneven', name: 'Tueste desparejo', description: 'Los granos del mismo batch tienen diferentes grados de tueste: algunos más claros, otros más oscuros.', cause: 'Batch mixto de screen sizes o densidades. RPM del tambor insuficiente. Tambor sobrecargado. Grano con humedad variable.', cupImpact: 'Taza inconsistente: mezcla de sub y sobreextracción. Sabores confusos, sin identidad clara. Difícil de calibrar en molienda.' }
];

// Combined data for simulator
const ALL_ROAST_ITEMS = [
  ...ROAST_VARIABLES.map(v => ({ ...v, category: 'variable' as const })),
  ...ROAST_STAGES.map(s => ({ ...s, category: 'stage' as const }))
];

// ─── Simulator ───────────────────────────────────────────────────────────────

const RoastSimulator: React.FC = () => {
  const [target, setTarget] = useState<(typeof ALL_ROAST_ITEMS)[0] | null>(null);
  const [options, setOptions] = useState<(typeof ALL_ROAST_ITEMS)[0][]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);

  const generateQuestion = () => {
    const idx = Math.floor(Math.random() * ALL_ROAST_ITEMS.length);
    const randomTarget = ALL_ROAST_ITEMS[idx];
    const others = ALL_ROAST_ITEMS.filter(i => i.id !== randomTarget.id);
    const shuffled = [...others].sort(() => 0.5 - Math.random()).slice(0, 3);
    const opts = [randomTarget, ...shuffled].sort(() => 0.5 - Math.random());
    setTarget(randomTarget);
    setOptions(opts);
    setSelected(null);
    setFeedback(null);
  };

  useEffect(() => { generateQuestion(); }, []);

  const handleSelect = (id: string) => {
    if (feedback || !target) return;
    setSelected(id);
    if (id === target.id) {
      setFeedback('correct');
      setStreak(s => s + 1);
    } else {
      setFeedback('wrong');
      setStreak(0);
    }
  };

  if (!target) return null;

  return (
    <div className="w-full space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-400">
          <Brain className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Identificador de Tueste</span>
        </div>
        <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full">
          <Trophy className={`w-4 h-4 ${streak > 0 ? 'text-yellow-500' : 'text-stone-400'}`} />
          <span className="text-sm font-black text-stone-900 dark:text-stone-100">{streak}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 md:p-12 rounded-2xl shadow-sm text-center space-y-8">
        <div className="space-y-4">
          <div className="space-y-1">
            <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${target.category === 'variable' ? 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'}`}>
              {target.category === 'variable' ? 'Variable' : 'Etapa'}
            </span>
            <p className="text-sm text-stone-500 uppercase tracking-widest font-bold mt-2">
              ¿Qué {target.category === 'variable' ? 'variable' : 'etapa'} es?
            </p>
          </div>
          <h3 className="text-lg md:text-xl font-serif italic text-stone-900 dark:text-stone-100 leading-relaxed max-w-2xl mx-auto">
            "{target.description}"
          </h3>
        </div>

        <AnimatePresence mode="wait">
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`p-4 rounded-xl border ${
                feedback === 'correct'
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-300'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2 font-bold uppercase tracking-wide text-xs">
                {feedback === 'correct' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {feedback === 'correct' ? '¡Correcto!' : 'Incorrecto'}
              </div>
              {feedback !== 'correct' && (
                <p className="mt-2 text-xs opacity-80">
                  La respuesta correcta era: <span className="font-bold">{target.name}</span>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            const isCorrect = opt.id === target.id;
            const showCorrect = feedback && isCorrect;
            const showWrong = feedback && isSelected && !isCorrect;
            let buttonStyle = 'border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-stone-700';
            if (showCorrect) buttonStyle = 'border-green-500 bg-green-500 text-white shadow-lg scale-105';
            else if (showWrong) buttonStyle = 'border-red-500 bg-red-500 text-white opacity-50';
            else if (feedback) buttonStyle = 'border-stone-100 bg-stone-50 text-stone-300 dark:border-stone-800 dark:bg-stone-900/50 dark:text-stone-600 opacity-50';
            return (
              <button key={opt.id} onClick={() => handleSelect(opt.id)} disabled={!!feedback}
                className={`p-6 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border-2 w-full flex items-center justify-center text-center break-words hyphens-auto ${buttonStyle}`}
              >{opt.name}</button>
            );
          })}
        </div>

        {feedback && (
          <div className="pt-4 flex justify-center animate-fade-in-up">
            <button onClick={generateQuestion}
              className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-all flex items-center gap-2 shadow-xl"
            >Siguiente Pregunta <ArrowLeft className="w-4 h-4 rotate-180" /></button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Variables & Stages Tab ──────────────────────────────────────────────────

const VariablesStagesTab: React.FC = () => {
  const [selectedVarId, setSelectedVarId] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectedRoasterId, setSelectedRoasterId] = useState<string | null>(null);
  const selectedVar = ROAST_VARIABLES.find(v => v.id === selectedVarId) || null;
  const selectedStage = ROAST_STAGES.find(s => s.id === selectedStageId) || null;
  const selectedRoaster = ROASTER_TYPES.find(r => r.id === selectedRoasterId) || null;

  const renderDetail = (item: RoastItem | null, placeholder: string) => (
    <div className="min-h-[140px] rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/60 p-5 md:p-6">
      {item ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Tipo</p>
              <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{item.type}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Descripción</p>
              <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{item.description}</p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Impacto</p>
            <ul className="list-disc list-inside space-y-2 text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              {item.impact.map((line, idx) => <li key={idx}>{line}</li>)}
            </ul>
          </div>
        </div>
      ) : (
        <p className="text-[11px] md:text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{placeholder}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Variables */}
      <div className="space-y-4">
        <div>
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Variables del tueste</p>
          <p className="text-[11px] md:text-xs text-stone-500 mt-1">Parámetros que controlas durante el tostado y su efecto directo en el resultado.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROAST_VARIABLES.map(v => (
            <button key={v.id} type="button"
              onClick={() => { setSelectedVarId(selectedVarId === v.id ? null : v.id); setSelectedStageId(null); }}
              className={`px-3 py-1.5 rounded-full border text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${
                selectedVarId === v.id
                  ? 'bg-black text-white dark:bg-stone-100 dark:text-stone-900 border-black'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-black dark:hover:border-white'
              }`}
            >{v.name}</button>
          ))}
        </div>
        {renderDetail(selectedVar, 'Selecciona una variable para ver su tipo, descripción y cómo impacta el tueste.')}
      </div>

      {/* Stages */}
      <div className="space-y-4">
        <div>
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Etapas del tueste</p>
          <p className="text-[11px] md:text-xs text-stone-500 mt-1">Las fases cronológicas por las que pasa el grano desde la carga hasta la descarga.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROAST_STAGES.map(s => (
            <button key={s.id} type="button"
              onClick={() => { setSelectedStageId(selectedStageId === s.id ? null : s.id); setSelectedVarId(null); }}
              className={`px-3 py-1.5 rounded-full border text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${
                selectedStageId === s.id
                  ? 'bg-black text-white dark:bg-stone-100 dark:text-stone-900 border-black'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-black dark:hover:border-white'
              }`}
            >{s.name}</button>
          ))}
        </div>
        {renderDetail(selectedStage, 'Selecciona una etapa para ver su rango de temperatura, qué sucede y cómo afecta el resultado.')}
      </div>

      {/* Roaster Types */}
      <div className="space-y-4">
        <div>
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Tipos de tostadoras</p>
          <p className="text-[11px] md:text-xs text-stone-500 mt-1">Comparativa entre las tres categorías principales de tostadoras.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROASTER_TYPES.map(r => (
            <button key={r.id} type="button"
              onClick={() => setSelectedRoasterId(selectedRoasterId === r.id ? null : r.id)}
              className={`px-3 py-1.5 rounded-full border text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${
                selectedRoasterId === r.id
                  ? 'bg-black text-white dark:bg-stone-100 dark:text-stone-900 border-black'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-black dark:hover:border-white'
              }`}
            >{r.name}</button>
          ))}
        </div>
        <div className="min-h-[140px] rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/60 p-5 md:p-6">
          {selectedRoaster ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Mecanismo</p>
                  <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selectedRoaster.mechanism}</p>
                </div>
                <div>
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Ideal para</p>
                  <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selectedRoaster.bestFor}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400">Ventajas</p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] md:text-xs text-stone-700 dark:text-stone-300">{selectedRoaster.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>
                <div>
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-red-500">Desventajas</p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] md:text-xs text-stone-700 dark:text-stone-300">{selectedRoaster.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[11px] md:text-xs text-stone-500 dark:text-stone-400 leading-relaxed">Selecciona un tipo de tostadora para ver su mecanismo, ventajas, desventajas y para qué tipo de café es ideal.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Profiles & Errors Tab ───────────────────────────────────────────────────

const ProfilesErrorsTab: React.FC = () => {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const selectedProfile = ROAST_PROFILES.find(p => p.id === selectedProfileId) || null;
  const selectedProblem = ROAST_PROBLEMS.find(p => p.id === selectedProblemId) || null;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Roast Profiles */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <h2 className="text-base md:text-lg font-black uppercase tracking-[0.25em] text-stone-900 dark:text-stone-100">
            Perfiles de Tueste
          </h2>
          <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            Los 5 niveles de tueste, cómo alcanzarlos en la curva, qué producen en taza, cómo identificarlos y cómo prepararlos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROAST_PROFILES.map(p => (
            <button key={p.id} type="button"
              onClick={() => { setSelectedProfileId(selectedProfileId === p.id ? null : p.id); setSelectedProblemId(null); }}
              className={`px-3 py-1.5 rounded-full border text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${
                selectedProfileId === p.id
                  ? 'bg-black text-white dark:bg-stone-100 dark:text-stone-900 border-black'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-black dark:hover:border-white'
              }`}
            >{p.name}</button>
          ))}
        </div>
        <div className="min-h-[200px] rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/60 p-5 md:p-6">
          {selectedProfile ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                  {selectedProfile.tempRange}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Descripción</p>
                    <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selectedProfile.description}</p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Cómo llegar en la curva</p>
                    <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selectedProfile.howToAchieve}</p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Cómo identificarlo</p>
                    <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selectedProfile.howToIdentify}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Perfil en taza</p>
                    <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed italic">{selectedProfile.cupProfile}</p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Recomendación de preparación</p>
                    <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selectedProfile.brewRecommendation}</p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">¿Por qué esa preparación?</p>
                    <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selectedProfile.brewWhy}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[11px] md:text-xs text-stone-500 dark:text-stone-400 leading-relaxed">Selecciona un perfil de tueste para ver cómo llegar a él, qué perfil produce en taza, cómo identificarlo y cómo prepararlo.</p>
          )}
        </div>
      </div>

      {/* Problems */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <h2 className="text-base md:text-lg font-black uppercase tracking-[0.25em] text-stone-900 dark:text-stone-100">
            Problemas de Tostado
          </h2>
          <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            Los errores más comunes durante el tostado que se manifiestan directamente en la taza final.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROAST_PROBLEMS.map(p => (
            <button key={p.id} type="button"
              onClick={() => { setSelectedProblemId(selectedProblemId === p.id ? null : p.id); setSelectedProfileId(null); }}
              className={`px-3 py-1.5 rounded-full border text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${
                selectedProblemId === p.id
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-red-400 dark:hover:border-red-400 hover:text-red-600 dark:hover:text-red-400'
              }`}
            >{p.name}</button>
          ))}
        </div>
        <div className="min-h-[140px] rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/60 p-5 md:p-6">
          {selectedProblem ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Descripción</p>
                  <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selectedProblem.description}</p>
                </div>
                <div>
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Causa</p>
                  <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selectedProblem.cause}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Impacto en taza</p>
                  <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selectedProblem.cupImpact}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[11px] md:text-xs text-stone-500 dark:text-stone-400 leading-relaxed">Selecciona un problema de tostado para ver su descripción, causa y cómo se manifiesta en la taza.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main View ───────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

export const RoastingToolView: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'variables' | 'profiles'>('simulator');

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 pb-20">
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter text-stone-900 dark:text-stone-100">Tueste</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hidden sm:block">Variables, perfiles y diagnóstico</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto scrollbar-hide">
          {[
            { id: 'simulator', label: 'Simulador' },
            { id: 'variables', label: 'Variables y Etapas' },
            { id: 'profiles', label: 'Perfiles y Errores' }
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
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'simulator' && <RoastSimulator />}
        {activeTab === 'variables' && <VariablesStagesTab />}
        {activeTab === 'profiles' && <ProfilesErrorsTab />}
      </div>
    </div>
  );
};

export default RoastingToolView;