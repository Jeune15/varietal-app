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
    description: 'Es la temperatura que tiene el tambor en el momento exacto en que se introduce el café verde. Esta variable determina la agresividad con la que el grano comienza a absorber calor desde el primer segundo, afectando la velocidad del secado inicial y el riesgo de defectos superficiales. Una carga bien calibrada es la base de toda la curva: si falla el inicio, es muy difícil recuperar el perfil deseado.',
    impact: ['Carga alta → secado rápido, riesgo de scorching en la superficie.', 'Carga baja → secado lento, riesgo de baking en la fase de Maillard.', 'Debe ajustarse según la densidad, humedad y tamaño del batch de café verde.']
  },
  {
    id: 'ror', name: 'Rate of Rise (RoR)', type: 'Velocidad de incremento de temperatura (°C/min o °F/min).',
    description: 'El RoR mide cuántos grados sube la temperatura del grano por minuto. Es el indicador más importante para controlar el tueste en tiempo real porque no dice dónde está la temperatura, sino hacia dónde va y con qué fuerza. Un RoR decreciente y controlado es el estándar en café de especialidad, ya que permite un desarrollo uniforme y evita los defectos más comunes.',
    impact: ['RoR alto → desarrollo rápido y agresivo, riesgo de tipping.', 'RoR bajo o plano → desarrollo lento que puede causar baking y sabores apagados.', 'Un RoR que cae a cero o se vuelve negativo en desarrollo es un error crítico.']
  },
  {
    id: 'dev-time', name: 'Tiempo de desarrollo', type: 'Duración desde el primer crack hasta la descarga.',
    description: 'Es el período que transcurre entre el inicio del primer crack y la descarga al enfriador. Durante este tiempo se completan las reacciones de Maillard avanzadas, la caramelización y la degradación de ácidos, definiendo el balance final entre acidez, dulzor, cuerpo y amargor. La relación entre este tiempo y el tiempo total (DTR) es la métrica clave para replicar y comparar perfiles.',
    impact: ['Demasiado corto (< 15% del total) → subdesarrollado, notas verdes y acidez agresiva.', 'Demasiado largo (> 25% del total) → plano, sin brillo, notas a cereal y pérdida de acidez.', 'El rango objetivo generalmente se sitúa entre el 15% y el 22% del tiempo total.']
  },
  {
    id: 'airflow', name: 'Flujo de aire (Airflow)', type: 'Cantidad de aire caliente circulando dentro del tambor.',
    description: 'El airflow controla la intensidad de la convección dentro de la tostadora: cuánto calor llega al grano a través del aire en movimiento versus el calor por conducción directa desde el tambor metálico. Además de transferir calor, cumple una función crítica: evacuar el humo y el chaff liberados durante el tueste, lo que impacta directamente en la limpieza del perfil en taza.',
    impact: ['Alto airflow → mayor convección, tueste más limpio y con mayor claridad en taza.', 'Bajo airflow → mayor conducción, más cuerpo y notas más densas, pero riesgo de humo reabsorbido.', 'Ayuda a evacuar humo y chaff durante el tueste, mejorando la limpieza en taza.']
  },
  {
    id: 'drum-speed', name: 'Velocidad del tambor (RPM)', type: 'Rotaciones por minuto del tambor.',
    description: 'Las RPM determinan con qué frecuencia cada grano entra en contacto con la pared metálica caliente y cuánto tiempo permanece en el flujo de aire central. A mayor velocidad de rotación, mayor agitación mecánica y distribución más uniforme del calor entre todos los granos del batch. Esta variable rara vez se ajusta durante el tueste, pero su configuración inicial es determinante para la uniformidad del resultado.',
    impact: ['RPM alto → tueste más uniforme, menor riesgo de quemaduras localizadas.', 'RPM bajo → mayor tiempo de contacto con el metal caliente, riesgo de scorching puntual.', 'Debe balancearse con el gas y el airflow para lograr la transferencia de calor deseada.']
  },
  {
    id: 'turning-point', name: 'Punto de inflexión (Turning Point)', type: 'Punto de temperatura mínima después de la carga.',
    description: 'Cuando el café verde se introduce en el tambor caliente, la sonda registra una caída inmediata de temperatura porque el grano absorbe el calor del entorno. El turning point es el momento exacto en que esa caída se detiene y la temperatura comienza a recuperarse. Es un indicador directo de la relación entre la energía disponible en el sistema y la masa de café cargada.',
    impact: ['Turning point alto → la carga fue demasiado caliente o el batch es demasiado pequeño.', 'Turning point bajo → carga fría o batch grande que absorbió mucha energía inicial.', 'Lo ideal es alcanzarlo entre 1 y 2 minutos después de la carga para un inicio controlado.']
  },
  {
    id: 'gas-power', name: 'Potencia de gas / calor', type: 'Energía térmica aplicada al sistema.',
    description: 'Es la cantidad de energía calorífica que alimenta a los quemadores del tambor, generalmente expresada en porcentaje o BTU/h. Junto con el airflow, el gas es la herramienta principal para controlar el RoR en cada momento del tueste. Un punto crítico: los ajustes de gas no tienen efecto inmediato, existe un delay de respuesta de 30 a 60 segundos antes de que el cambio se manifieste en la temperatura del grano.',
    impact: ['Gas alto → el RoR sube rápido, generando un tueste más agresivo.', 'Gas bajo → el RoR cae gradualmente, desacelerando el tueste para un desarrollo más suave.', 'Los cambios bruscos de gas son el error más común: siempre deben hacerse de forma gradual.']
  },
  {
    id: 'end-temp', name: 'Temperatura de descarga', type: 'Temperatura final del grano al sacar del tambor.',
    description: 'Es la temperatura registrada por la sonda cuando el café cae al enfriador. Funciona como referencia práctica para replicar el grado de tueste de un batch a otro, aunque su valor absoluto varía entre tostadoras y tipos de sonda. Por eso nunca debe analizarse de forma aislada: siempre debe combinarse con el color del grano, el tiempo de desarrollo y los datos sensoriales.',
    impact: ['No es un valor absoluto universal: varía entre tostadoras, sondas y su posición.', 'Sirve como referencia interna confiable para replicar perfiles en la misma máquina.', 'Debe complementarse siempre con color Agtron, tiempo de desarrollo y evaluación sensorial.']
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
                className={`p-6 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border-2 w-full flex items-center justify-center text-center break-words ${buttonStyle}`}
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

// ─── Data: Posibles Sucesos ──────────────────────────────────────────────────

interface RoastEvent {
  id: string;
  name: string;
  symptoms: string[];
  cupResult: string;
  causes: string[];
  solutions: string[];
}

const ROAST_EVENTS: RoastEvent[] = [
  {
    id: 'stalling',
    name: 'Stalling (tueste plano)',
    symptoms: ['La temperatura deja de subir o sube muy lento después del primer crack', 'El RoR cae drásticamente o se aplana cerca de cero', 'El café parece "estancado" sin progreso'],
    cupResult: 'Taza apagada, sin dulzor, notas planas u "horneadas" (baked). Falta de complejidad aromática.',
    causes: ['Se bajó demasiado el gas antes o justo después del primer crack', 'Exceso de carga para la capacidad del tostador', 'Flujo de aire muy alto que enfría el sistema', 'Perfil mal balanceado: demasiada energía al inicio y nada al final'],
    solutions: ['Mantener suficiente energía (gas) entrando al primer crack', 'Reducir gas gradualmente, no de golpe', 'Verificar que la carga no exceda la capacidad recomendada', 'Bajar airflow si el sistema se enfría demasiado']
  },
  {
    id: 'crash-flick',
    name: 'Crash & Flick',
    symptoms: ['El RoR cae abruptamente (crash) y luego sube de golpe (flick)', 'La curva de temperatura tiene un "valle" seguido de un pico repentino', 'Comportamiento errático de la temperatura después del crack'],
    cupResult: 'Sabores mixtos: notas crudas/ácidas combinadas con quemado. Falta de limpieza y uniformidad.',
    causes: ['Se cortó el gas de golpe en el crack y luego se compensó subiendo demasiado', 'Mal control de la transición de energía en la fase de desarrollo', 'Airflow cambiado bruscamente durante el crack'],
    solutions: ['Hacer ajustes de gas graduales, nunca cambios bruscos mayores al 15-20%', 'Planificar la reducción de energía antes del crack', 'Mantener control del airflow constante en momentos críticos', 'Practicar perfiles de curva suave y decreciente']
  },
  {
    id: 'first-crack-early',
    name: 'Primer crack prematuro',
    symptoms: ['El crack suena antes de lo esperado (antes de ~190°C)', 'El café no cambió completamente de color', 'El grano se siente más blando al tacto que lo normal'],
    cupResult: 'Acidez agresiva, notas herbales o verdes, subdesarrollo evidente. Falta dulzor.',
    causes: ['Carga demasiado alta (exceso de energía al inicio)', 'RoR demasiado alto en la fase de Maillard', 'Grano de baja densidad que responde rápido al calor', 'Sonda de temperatura mal calibrada'],
    solutions: ['Reducir la temperatura de carga', 'Bajar gas al inicio de Maillard para desacelerar', 'Adaptar el perfil a la densidad del grano', 'Calibrar sonda de temperatura regularmente']
  },
  {
    id: 'first-crack-late',
    name: 'Primer crack retrasado',
    symptoms: ['El crack no ha aparecido pasados los 12-13 minutos', 'El color del grano ya es marrón pero no se escucha crack', 'Olor a pan horneado prolongado sin transición'],
    cupResult: 'Notas planas, baked, sin brillo ni acidez. Dulzor apagado, cuerpo pesado sin limpieza.',
    causes: ['Carga demasiado baja o gas insuficiente', 'RoR demasiado bajo durante Maillard', 'Grano de alta densidad que necesita más energía', 'Tambor sobrecargado que absorbe demasiada energía'],
    solutions: ['Aumentar temperatura de carga o gas inicial', 'Mantener RoR adecuado durante Maillard (mínimo 5-8°C/min)', 'Ajustar energía según la densidad del café', 'Verificar que el batch size sea el adecuado']
  },
  {
    id: 'excessive-smoke',
    name: 'Humo excesivo',
    symptoms: ['Humo denso y oscuro sale del tambor o la cargadora', 'Olor a quemado penetrante', 'Los granos presentan manchas oscuras de aceite prematuro'],
    cupResult: 'Notas ahumadas, carbónicas, amargas. Puede ocultar completamente el perfil del café.',
    causes: ['Temperatura de descarga demasiado alta', 'Acumulación de chaff en el sistema', 'Se pasó del segundo crack sin control', 'Falta de limpieza del sistema de escape y chaff catcher'],
    solutions: ['Descargar antes si se observa humo excesivo', 'Limpiar chaff catcher y ductos regularmente', 'Aumentar airflow para evacuar humo', 'Mantener el tostador limpio después de cada sesión']
  },
  {
    id: 'negative-ror',
    name: 'RoR negativo',
    symptoms: ['La lectura de RoR baja por debajo de cero', 'La temperatura del grano empieza a descender', 'Se pierde completamente el momentum del tueste'],
    cupResult: 'Taza extremadamente plana y sin vida. Sabor a cartón, notas de cereal crudo, sin dulzor.',
    causes: ['Se cortó el gas completamente', 'El enfriador se activó prematuramente', 'Puerta del tambor abierta accidentalmente', 'Batch demasiado pequeño para el tostador'],
    solutions: ['Nunca llevar el gas a cero durante el tueste activo', 'Verificar que el enfriador no se active antes de la descarga', 'Mantener un mínimo de energía constante', 'Si ocurre, descargar inmediatamente — el batch se perdió']
  },
  {
    id: 'high-charge',
    name: 'Temperatura de carga muy alta',
    symptoms: ['Turning point muy alto (>160°C)', 'El grano cambia de color extremadamente rápido', 'Olor a chamuscado en los primeros 2 minutos', 'Manchas oscuras en la superficie del grano'],
    cupResult: 'Scorching, notas a quemado superficial. Interior crudo con exterior oscuro. Astringencia.',
    causes: ['Precalentamiento excesivo del tambor', 'Batch anterior dejó el tambor demasiado caliente', 'No se ajustó la carga según el descanso entre batches'],
    solutions: ['Reducir precalentamiento', 'Esperar enfriamiento adecuado entre batches', 'Abrir la puerta brevemente para bajar temperatura antes de cargar', 'Usar batches de prueba para calibrar la carga']
  },
  {
    id: 'low-charge',
    name: 'Temperatura de carga muy baja',
    symptoms: ['Turning point extremadamente bajo (<110°C)', 'El grano tarda demasiado en empezar a cambiar de color', 'El secado se extiende más de 5-6 minutos'],
    cupResult: 'Baking, notas planas y de cereal. Poca dulzura, acidez muerta, cuerpo vacío.',
    causes: ['Precalentamiento insuficiente', 'Primera carga del día sin calentamiento previo', 'Se dejó enfriar el tambor demasiado entre batches'],
    solutions: ['Asegurar precalentamiento suficiente (20-30 min antes)', 'Realizar un "batch fantasma" para estabilizar el tambor', 'Mantener tiempos consistentes entre batches', 'Subir gas al inicio si el turning point es demasiado bajo']
  },
  {
    id: 'scorching',
    name: 'Scorching puntual',
    symptoms: ['Marcas oscuras/quemadas en las caras planas del grano', 'Olor acre durante la fase de secado', 'Granos con puntos negros visibles tras el tueste'],
    cupResult: 'Notas a quemado, ceniza, carbón. Amargor persistente que no corresponde al perfil del café.',
    causes: ['Temperatura de tambor excesiva al cargar', 'Velocidad de tambor demasiado baja', 'Grano haciendo demasiado contacto con la pared caliente', 'Falta de airflow que ayude a distribuir el calor'],
    solutions: ['Bajar temperatura de carga', 'Aumentar RPM del tambor', 'Subir airflow en los primeros minutos', 'Verificar que el tambor gire correctamente y sin obstrucciones']
  },
  {
    id: 'tipping-maillard',
    name: 'Tipping durante Maillard',
    symptoms: ['Puntas de los granos quemadas (bordes oscuros)', 'Se nota al inspeccionar el grano tostado con lupa', 'Textura irregular en la superficie del grano'],
    cupResult: 'Notas a ceniza o carbón sutil. Amargo residual que afecta la limpieza de la taza.',
    causes: ['RoR demasiado alto en la fase de Maillard', 'Demasiada conducción (contacto directo con el tambor caliente)', 'Gas demasiado alto sin suficiente airflow', 'Velocidad de tambor baja durante Maillard'],
    solutions: ['Reducir gas antes de entrar a Maillard', 'Aumentar airflow para favorecer convección sobre conducción', 'Subir RPM del tambor', 'Aplicar perfil de energía decreciente']
  },
  {
    id: 'baking-post-crack',
    name: 'Baking post-crack',
    symptoms: ['El desarrollo se extiende más de 25-30% del tiempo total', 'El RoR es muy bajo o plano después del crack', 'El color final no corresponde con el tiempo de tueste'],
    cupResult: 'Taza plana sin vida, notas de papel, cartón, cereal. Sin acidez, sin dulzor, sin complejidad.',
    causes: ['Se bajó demasiado la energía después del primer crack', 'Miedo a quemar el café, compensando con gas muy bajo', 'No se tenía un punto de descarga claro planificado'],
    solutions: ['Definir tiempo de desarrollo objetivo antes de empezar', 'Mantener suficiente momentum de RoR post-crack', 'Descargar con decisión cuando se alcance el perfil deseado', 'Usar desarrollo del 15-20% como guía general']
  },
  {
    id: 'quakers',
    name: 'Quakers visibles',
    symptoms: ['Granos pálidos mezclados con granos correctamente tostados', 'No desarrollan color marrón aunque el tueste esté completo', 'Al catastar, se nota sabor papeloso o a maní crudo'],
    cupResult: 'Notas a maní crudo, papel, cereal inmaduro. Deprime el dulzor y la limpieza general.',
    causes: ['Granos inmaduros (verdes) que entraron en el lote', 'Café de baja calidad con alto porcentaje de cerezo no maduro', 'El tostador no puede solucionar esto — es un defecto de origen'],
    solutions: ['Seleccionar mejor el café verde (pedir muestra antes de comprar)', 'Remover quakers manualmente después del tueste', 'Comunicar al proveedor si el porcentaje es alto', 'No se puede corregir con perfil de tueste']
  },
  {
    id: 'uneven-color',
    name: 'Color desparejo',
    symptoms: ['Granos con diferentes tonos de marrón en el mismo batch', 'Variación visible al colocar granos en fila', 'Inconsistencia en tamaño y densidad del grano tostado'],
    cupResult: 'Taza inconsistente, mezcla de sabores de sub y sobre-extracción. Falta de balance.',
    causes: ['Café verde mezclado (diferentes lotes, orígenes o procesos)', 'Tambor sobrecargado que no agita uniformemente', 'Secado desigual por diferencias de humedad en el lote', 'Velocidad de tambor insuficiente'],
    solutions: ['No mezclar lotes de café verde con diferentes características', 'Respetar la capacidad máxima del tostador (70-80%)', 'Aumentar RPM para mejorar agitación', 'Asegurar que el café verde tenga humedad homogénea']
  },
  {
    id: 'excessive-weight-loss',
    name: 'Merma excesiva (>18%)',
    symptoms: ['El peso final del café tostado es mucho menor al esperado', 'El grano sale muy oscuro y aceitoso', 'Aroma fuerte a carbón o ceniza al enfriar'],
    cupResult: 'Sobre-desarrollo. Notas carbonizadas, amargor intenso, cuerpo hueco.',
    causes: ['Tueste demasiado oscuro o largo', 'Se pasó del segundo crack', 'Perfil con demasiada energía acumulada'],
    solutions: ['Descargar antes si la merma objetivo es 13-16%', 'Monitorear el peso en tiempo real si el tostador lo permite', 'Ajustar el perfil para un desarrollo más corto', 'Establecer límites claros de temperatura de descarga']
  },
  {
    id: 'low-weight-loss',
    name: 'Merma insuficiente (<11%)',
    symptoms: ['El grano pesa más de lo esperado', 'El grano se siente denso y duro', 'El color es más claro de lo esperado para el tiempo de tueste'],
    cupResult: 'Sub-desarrollo. Acidez agresiva, notas verdes, herbales, astringencia. Falta de dulzor.',
    causes: ['Tueste demasiado corto o con poca energía', 'Se descargó antes de que el desarrollo fuera suficiente', 'Grano de alta densidad que necesita más tiempo'],
    solutions: ['Extender el desarrollo post-crack', 'Aumentar energía durante Maillard', 'Adaptar el perfil a la densidad del grano', 'Apuntar a 13-16% de merma como rango objetivo']
  },
  {
    id: 'chaff-trapped',
    name: 'Chaff no separado',
    symptoms: ['Piel plateada adherida al grano después del tueste', 'Acumulación de chaff en la bandeja de enfriamiento', 'Olor a paja quemada durante el tueste tardío'],
    cupResult: 'Notas a paja, papel, "sucio". Resta limpieza y claridad a la taza.',
    causes: ['Airflow insuficiente para evacuar el chaff', 'Chaff catcher obstruido o lleno', 'Naturales y honey tienden a tener más chaff adherido', 'Sistema de extracción mal diseñado o sucio'],
    solutions: ['Aumentar airflow especialmente durante y después del crack', 'Limpiar chaff catcher entre cada batch', 'Verificar que el sistema de extracción funcione correctamente', 'Con naturales, ser más agresivo con el airflow']
  },
  {
    id: 'overloaded-drum',
    name: 'Tambor sobrecargado',
    symptoms: ['El turning point es muy bajo y tarda mucho en recuperarse', 'El tueste total dura mucho más de lo planeado', 'El color es desparejo y el RoR es errático'],
    cupResult: 'Baking generalizado. Sabores planos, sin claridad ni dulzor. Heterogeneidad en taza.',
    causes: ['Se cargó más café del recomendado', 'No se ajustó la energía para el batch size mayor', 'Falta de experiencia con la capacidad del equipo'],
    solutions: ['Respetar la capacidad recomendada (generalmente 70-80% del máximo)', 'Si se carga más, aumentar gas y carga proporcionalmente', 'Pesar el café verde antes de cada tueste', 'Registrar el batch size óptimo para cada tostador']
  },
  {
    id: 'small-batch',
    name: 'Batch muy pequeño',
    symptoms: ['El turning point es muy alto (el café se calienta inmediatamente)', 'El tueste progresa demasiado rápido', 'El primer crack llega antes de los 7 minutos totales'],
    cupResult: 'Desarrollo desigual. Scorching y tipping. Notas a quemado con interior crudo.',
    causes: ['Se cargó muy poco café comparado con la capacidad del tostador', 'El tambor caliente domina completamente la masa pequeña de café'],
    solutions: ['Usar al menos el 50% de la capacidad del tostador', 'Bajar la carga y el gas significativamente si el batch es pequeño', 'Considerar un tostador más pequeño para muestras', 'Reducir pre-calentamiento para batches chicos']
  },
  {
    id: 'silent-crack',
    name: 'Primer crack silencioso',
    symptoms: ['No se escucha el crack aunque la temperatura esté en rango (195-205°C)', 'El color del grano cambia pero sin sonido característico', 'Dificultad para determinar el punto de desarrollo'],
    cupResult: 'Riesgo alto de sobre o sub-desarrollo por no tener la referencia auditiva.',
    causes: ['Café de muy baja densidad (altitud baja)', 'Grano muy seco (humedad <10%)', 'Tostador muy ruidoso que oculta el sonido', 'Airflow muy alto que enmascara el crack'],
    solutions: ['Confiar en otros indicadores: color, olor, RoR', 'Usar un grano de referencia conocido para calibrar', 'Reducir airflow momentáneamente para escuchar mejor', 'Instalar un micrófono amplificador si el equipo es ruidoso']
  },
  {
    id: 'unexpected-second-crack',
    name: 'Segundo crack inesperado',
    symptoms: ['Se escucha un cracking continuo más agudo y rápido que el primero', 'Aparecen gotas de aceite en la superficie del grano', 'Humo denso y oscuro aumenta rápidamente'],
    cupResult: 'Sobre-desarrollo severo. Notas carbonizadas, amargor dominante, pérdida total de acidez y origen.',
    causes: ['No se descargó a tiempo después del primer crack', 'Se perdió el control del RoR y el tueste se aceleró', 'Distracción durante la fase crítica de desarrollo', 'Perfil demasiado agresivo con exceso de energía acumulada'],
    solutions: ['Descargar inmediatamente al escuchar segundo crack (si no es el objetivo)', 'Establecer alarmas de temperatura para recordar puntos de descarga', 'Planificar el perfil con un margen de seguridad de 5-10°C antes del 2C', 'Nunca alejarse del tostador durante la fase de desarrollo']
  }
];

// ─── Posibles Sucesos Tab ────────────────────────────────────────────────────

const PosiblesSucesosTab: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3">
        <h2 className="text-base md:text-lg font-black uppercase tracking-[0.25em] text-stone-900 dark:text-stone-100">
          Posibles Sucesos en Tueste
        </h2>
        <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
          Situaciones que pueden ocurrir durante una sesión de tostado. Cada escenario incluye síntomas observables, resultado en taza, causas probables y cómo solucionarlo.
        </p>
      </div>

      <div className="grid gap-3">
        {ROAST_EVENTS.map((event, index) => {
          const isOpen = openId === event.id;
          return (
            <div key={event.id} className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-900 transition-all">
              <button
                onClick={() => setOpenId(isOpen ? null : event.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex-none w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-[10px] font-black text-stone-500">
                    {index + 1}
                  </span>
                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                    {event.name}
                  </span>
                </div>
                <svg className={`w-4 h-4 flex-none text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 pt-0 border-t border-stone-100 dark:border-stone-800 space-y-4">
                  {/* Symptoms */}
                  <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">¿Qué pasa? (Síntomas)</p>
                    <ul className="space-y-1">
                      {event.symptoms.map((s, i) => (
                        <li key={i} className="text-[11px] md:text-xs text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-2">
                          <span className="text-amber-500 mt-1">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cup result */}
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-700 dark:text-red-400 mb-2">Resultado en taza</p>
                    <p className="text-[11px] md:text-xs text-red-800 dark:text-red-300 leading-relaxed">{event.cupResult}</p>
                  </div>

                  {/* Causes */}
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">¿Por qué ocurre?</p>
                    <ul className="space-y-1">
                      {event.causes.map((c, i) => (
                        <li key={i} className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed flex items-start gap-2">
                          <span className="text-stone-400 mt-1">•</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Solutions */}
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">Cómo solucionarlo</p>
                    <ul className="space-y-1">
                      {event.solutions.map((s, i) => (
                        <li key={i} className="text-[11px] md:text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed flex items-start gap-2">
                          <span className="text-emerald-500 mt-1">✓</span> {s}
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

export const RoastingToolView: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'variables' | 'profiles' | 'sucesos'>('simulator');

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
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto scrollbar-hide">
            {[
              { id: 'simulator', label: 'Simulador' },
              { id: 'variables', label: 'Variables y Etapas' },
              { id: 'profiles', label: 'Perfiles y Errores' },
              { id: 'sucesos', label: 'Posibles Sucesos' }
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
        {activeTab === 'simulator' && <RoastSimulator />}
        {activeTab === 'variables' && <VariablesStagesTab />}
        {activeTab === 'profiles' && <ProfilesErrorsTab />}
        {activeTab === 'sucesos' && <PosiblesSucesosTab />}
      </div>
    </div>
  );
};

export default RoastingToolView;