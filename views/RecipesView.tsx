import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EspressoView } from './EspressoCalibrationView';
import { Coffee, Filter, ChevronRight, ArrowLeft } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { db } from '../db';
import { FilterSession, FilterPour, FilterRecipe, FilterRecipePhase, BrewMethod } from '../types';
import { gsap } from 'gsap';

const brewMethodOptions: { value: BrewMethod; label: string }[] = [
  { value: 'Filtro', label: 'Filtro' },
  { value: 'Inmersión', label: 'Inmersión' },
  { value: 'Hario Switch', label: 'Hario Switch' },
  { value: 'Aeropress', label: 'Aeropress' }
];

const pourTypeOptions = [
  { value: 'continuous', label: 'Continuo' },
  { value: 'pulsed', label: 'Pulsado' },
  { value: 'circular', label: 'Circular' },
  { value: 'direct', label: 'Directo' }
];

const parseRatio = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const coffee = parseFloat(match[1]);
  const water = parseFloat(match[2]);
  if (!Number.isFinite(coffee) || !Number.isFinite(water) || coffee <= 0 || water <= 0) {
    return null;
  }
  return water / coffee;
};

const formatRatio = (waterPerGram: number): string => {
  if (!Number.isFinite(waterPerGram) || waterPerGram <= 0) {
    return '';
  }
  const rounded = Math.round(waterPerGram * 10) / 10;
  const asInt = Math.round(rounded);
  if (Math.abs(rounded - asInt) < 1e-6) {
    return `1:${asInt}`;
  }
  return `1:${rounded}`;
};

interface TopBackButtonProps {
  onClick?: () => void;
}

const TopBackButton: React.FC<TopBackButtonProps> = ({ onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed top-4 md:top-6 left-4 md:left-8 z-[200] inline-flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm rounded-lg border border-stone-200 dark:border-stone-800 shadow-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-[11px] font-bold uppercase tracking-widest text-stone-600 dark:text-stone-300"
      aria-label="Volver"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Volver</span>
    </button>
  );
};

const FilterCalibrationGuide: React.FC<{ method: BrewMethod }> = ({ method }) => {
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [selectedVariableId, setSelectedVariableId] = useState<string | null>(null);

  const methods = [
    {
      id: 'v60',
      name: 'V60 (Hario)',
      type: 'Cono 60° con una sola abertura grande',
      technicalImpact: [
        'Flujo rápido y muy dependiente de la molienda.',
        'Alta claridad y separación de sabores.',
        'Mayor riesgo de canalización si la técnica es inconsistente.',
        'Muy sensible al vertido; el control manual es crítico.'
      ],
      cupProfile: 'Limpio, brillante, con acidez bien definida.'
    },
    {
      id: 'chemex',
      name: 'Chemex',
      type: 'Cono con filtro grueso patentado',
      technicalImpact: [
        'Filtro un 20–30% más grueso que otros.',
        'Retiene más aceites y sólidos, dando un cuerpo más ligero.',
        'Flujo relativamente lento.',
        'Tiende a reducir amargor y astringencia.'
      ],
      cupProfile: 'Extremadamente limpia, elegante y delicada.'
    },
    {
      id: 'kalita',
      name: 'Kalita Wave',
      type: 'Fondo plano con tres orificios',
      technicalImpact: [
        'Flujo más controlado que en V60.',
        'Extracción más uniforme.',
        'Reduce el riesgo de canalización.',
        'Mayor consistencia entre usuarios.'
      ],
      cupProfile: 'Balanceada, redonda y dulce.'
    },
    {
      id: 'origami',
      name: 'Origami Dripper',
      type: 'Compatible con filtros V60 o Kalita',
      technicalImpact: [
        'Ofrece versatilidad total según el filtro que se use.',
        'Permite ajustar el flujo sin cambiar de dripper.',
        'Gran control sobre el equilibrio entre claridad y cuerpo.'
      ],
      cupProfile: 'Altamente variable según la configuración elegida.'
    },
    {
      id: 'april',
      name: 'April Brewer',
      type: 'Fondo plano con flujo optimizado',
      technicalImpact: [
        'Diseñado para recetas de baja agitación.',
        'Promueve extracción uniforme.',
        'Reduce la dependencia de técnicas complejas.'
      ],
      cupProfile: 'Limpio pero con buen cuerpo.'
    },
    {
      id: 'orea',
      name: 'Orea Brewer',
      type: 'Fondo plano moderno',
      technicalImpact: [
        'Flujo rápido y controlable.',
        'Alta claridad con buena dulzura.',
        'Ideal para recetas de baja turbulencia.'
      ],
      cupProfile: 'Tazas claras, dulces y definidas.'
    },
    {
      id: 'stagg-x',
      name: 'Fellow Stagg X',
      type: 'Fondo plano con restrictor',
      technicalImpact: [
        'Flujo restringido que aumenta el tiempo de contacto.',
        'Mayor cuerpo comparado con Kalita.',
        'Menor riesgo de subextracción.'
      ],
      cupProfile: 'Más cuerpo y estructura, manteniendo buena definición.'
    },
    {
      id: 'torch-mountain',
      name: 'Torch Mountain Dripper',
      type: 'Fondo plano con base cónica',
      technicalImpact: [
        'Flujo híbrido entre cono y fondo plano.',
        'Alta estabilidad térmica.'
      ],
      cupProfile: 'Dulce y balanceado.'
    },
    {
      id: 'cafec-flower',
      name: 'Cafec Flower Dripper',
      type: 'Cono con diseño de flujo optimizado',
      technicalImpact: [
        'Minimiza estancamientos de agua.',
        'Puede ofrecer mayor claridad que V60 en algunas recetas.'
      ],
      cupProfile: 'Clara y definida, con buen énfasis aromático.'
    },
    {
      id: 'bee-house',
      name: 'Bee House Dripper',
      type: 'Cono con dos pequeños orificios',
      technicalImpact: [
        'Flujo lento.',
        'Más tolerante a moliendas algo más gruesas.',
        'Genera mayor cuerpo que V60.'
      ],
      cupProfile: 'Más cuerpo, perfil clásico y indulgente.'
    },
    {
      id: 'clever',
      name: 'Clever Dripper',
      type: 'Inmersión más filtrado',
      technicalImpact: [
        'Control total del tiempo de contacto.',
        'Muy baja canalización.',
        'Perfil intermedio entre prensa francesa y V60.'
      ],
      cupProfile: 'Redonda, con buena dulzura y claridad media.'
    },
    {
      id: 'switch',
      name: 'Hario Switch',
      type: 'V60 con válvula',
      technicalImpact: [
        'Permite híbridos de inmersión y percolación.',
        'Facilita ajustes finos de extracción.',
        'Ofrece mayor control sobre la acidez percibida.'
      ],
      cupProfile: 'Equilibrio entre dulzor de inmersión y claridad de filtro.'
    },
    {
      id: 'aeropress',
      name: 'Aeropress (filtro de papel)',
      type: 'Inmersión con presión y filtrado',
      technicalImpact: [
        'Muy alta versatilidad.',
        'Ajustable en cuerpo y claridad.',
        'Menor extracción de sedimentos frente a otros métodos de inmersión.'
      ],
      cupProfile: 'Desde tazas densas tipo concentrado hasta filtrados limpios según la receta.'
    },
    {
      id: 'tricolate',
      name: 'Tricolate',
      type: 'Percolación con lecho profundo',
      technicalImpact: [
        'Promueve una extracción muy uniforme.',
        'Minimiza el bypass.',
        'Permite altas extracciones sin astringencia.'
      ],
      cupProfile: 'Muy expresiva y completa, con alta extracción controlada.'
    },
    {
      id: 'nextlevel-pulsar',
      name: 'NextLevel Pulsar',
      type: 'Control de flujo con válvula',
      technicalImpact: [
        'Permite ajustar dinámicamente el tiempo de contacto.',
        'Abre la puerta a recetas avanzadas.',
        'Especialmente útil para cafés de alta densidad.'
      ],
      cupProfile: 'Potente, precisa y muy adaptable a cafés complejos.'
    },
    {
      id: 'melitta',
      name: 'Melitta Clásico',
      type: 'Cono tradicional',
      technicalImpact: [
        'Flujo medio a lento.',
        'Perfil de taza más tradicional.',
        'Más indulgente con pequeños errores de técnica.'
      ],
      cupProfile: 'Clásica, amable y fácil de repetir.'
    },
    {
      id: 'gina',
      name: 'GINA (modo pour-over)',
      type: 'Cono con válvula ajustable',
      technicalImpact: [
        'Control total del flujo de salida.',
        'Permite experimentar con diferentes resistencias hidráulicas.'
      ],
      cupProfile: 'Altamente modulable; puede parecerse tanto a un cono clásico como a un híbrido.'
    }
  ];

  const tools = [
    {
      id: 'paragon',
      name: 'Paragon (Nucleus Coffee Tools)',
      type: 'Sistema de enfriamiento rápido post-extracción',
      technicalImpact: [
        'Enfriamiento inmediato por contacto.',
        'Reduce volatilización de compuestos aromáticos.',
        'No altera TDS ni % de extracción.',
        'Preserva compuestos de bajo punto de ebullición (ésteres, aldehídos).'
      ],
      cupProfile:
        'Más intensidad aromática, mayor percepción floral y frutal, sensación de mayor complejidad.'
    },
    {
      id: 'drip-assist',
      name: 'Hario Drip Assist',
      type: 'Difusor de vertido',
      technicalImpact: [
        'Reduce turbulencia localizada.',
        'Distribuye el agua de manera uniforme.',
        'Disminuye riesgo de canalización.',
        'Reduce variabilidad humana.'
      ],
      cupProfile:
        'Más balance, menor acidez agresiva y un perfil más redondo.'
    },
    {
      id: 'melodrip',
      name: 'Melodrip',
      type: 'Dispersor de agua anti-agitación',
      technicalImpact: [
        'Minimiza impacto directo del chorro.',
        'Reduce migración de finos.',
        'Disminuye erosión del lecho.',
        'Favorece un flujo más laminar.'
      ],
      cupProfile:
        'Alta claridad, menor astringencia y un perfil limpio y elegante.'
    },
    {
      id: 'wdt',
      name: 'WDT (Weiss Distribution Tool)',
      type: 'Herramienta de distribución de molienda',
      technicalImpact: [
        'Rompe grumos.',
        'Homogeneiza densidad del lecho.',
        'Reduce microcanalización.',
        'Mejora uniformidad extractiva.'
      ],
      cupProfile:
        'Mayor dulzura y menos notas ásperas o amargas irregulares.'
    },
    {
      id: 'paper-filters',
      name: 'Filtros de papel de diferentes densidades',
      type: 'Variación de resistencia del medio filtrante',
      technicalImpact: [
        'Cambia la resistencia hidráulica.',
        'Modifica el tiempo de drenaje.',
        'Altera la retención de aceites y sólidos.'
      ],
      cupProfile:
        'Filtros rápidos → más claridad y brillo. Filtros gruesos → cuerpo más ligero. Filtros densos → mayor limpieza.'
    },
    {
      id: 'metal-filters',
      name: 'Filtros metálicos (V60, Aeropress)',
      type: 'Medio filtrante reutilizable',
      technicalImpact: [
        'Permite paso de aceites y partículas finas.',
        'Reduce retención de lípidos en el filtro.',
        'Genera un flujo ligeramente más rápido.'
      ],
      cupProfile:
        'Mayor cuerpo y textura más densa, con menor claridad en la taza.'
    },
    {
      id: 'scales',
      name: 'Básculas de precisión',
      type: 'Control de peso y tiempo',
      technicalImpact: [
        'Permiten control exacto de ratio.',
        'Facilitan el monitoreo de flujo (g/s).',
        'Aportan consistencia replicable.'
      ],
      cupProfile:
        'Mayor repetibilidad y menos variación entre tazas.'
    },
    {
      id: 'gooseneck-kettle',
      name: 'Hervidores de cuello de cisne',
      type: 'Control de flujo de vertido',
      technicalImpact: [
        'Permiten controlar caudal y altura.',
        'Ajustan la turbulencia generada.',
        'Mejoran la precisión en vertidos por pulsos.'
      ],
      cupProfile:
        'Mejor balance y control de la estructura de la taza.'
    },
    {
      id: 'water-systems',
      name: 'Sistemas de agua personalizados',
      type: 'Ajuste mineral del agua',
      technicalImpact: [
        'Permiten control exacto de GH y KH.',
        'Modulan la capacidad extractiva.',
        'Afectan la selectividad química de la extracción.'
      ],
      cupProfile:
        'Más dulzura, mejor balance ácido y mayor claridad estructural.'
    },
    {
      id: 'temp-controllers',
      name: 'Controladores de temperatura',
      type: 'Estabilidad térmica',
      technicalImpact: [
        'Mantienen la temperatura constante.',
        'Evitan fluctuaciones en vertidos largos.',
        'Controlan la cinética extractiva.'
      ],
      cupProfile:
        'Mayor consistencia y mejor control de acidez y amargor.'
    },
    {
      id: 'rdt',
      name: 'RDT (Ross Droplet Technique)',
      type: 'Técnica antiestática en molienda',
      technicalImpact: [
        'Reduce la electricidad estática.',
        'Mejora la distribución de partículas.',
        'Disminuye la retención en el molino.'
      ],
      cupProfile:
        'Más consistencia y menos variabilidad en la extracción entre moliendas.'
    },
    {
      id: 'bed-leveler',
      name: 'Tamper de lecho plano / leveler',
      type: 'Nivelación del café antes del vertido',
      technicalImpact: [
        'Mejora la uniformidad superficial.',
        'Reduce zonas de baja densidad.',
        'Minimiza la formación de canales iniciales.'
      ],
      cupProfile:
        'Mayor dulzura y limpieza estructural en la taza.'
    },
    {
      id: 'heated-bases',
      name: 'Bases calefactadas o servidores térmicos',
      type: 'Estabilidad térmica post-extracción',
      technicalImpact: [
        'Reducen la caída brusca de temperatura.',
        'Mantienen la estabilidad aromática inicial.'
      ],
      cupProfile:
        'Mayor persistencia aromática y percepción dulce más prolongada.'
    },
    {
      id: 'spray-heads',
      name: 'Spray head / shower screens',
      type: 'Distribución uniforme de agua',
      technicalImpact: [
        'Dispersan el agua de forma homogénea.',
        'Reducen puntos de sobreextracción localizada.',
        'Mejoran la hidratación inicial de la cama.'
      ],
      cupProfile:
        'Más uniformidad general y menos amargor localizado.'
    },
    {
      id: 'agitators',
      name: 'Agitadores controlados',
      type: 'Control manual de turbulencia',
      technicalImpact: [
        'Aceleran la extracción.',
        'Reducen la capa límite alrededor de las partículas.',
        'Redistribuyen finos dentro del lecho.'
      ],
      cupProfile:
        'Mayor intensidad y posible aumento de cuerpo si se exagera el movimiento.'
    }
  ];

  const variablesAndTechniques = [
    {
      id: 'ratio',
      name: 'Ratio café:agua',
      type: 'Relación de preparación (ej. 1:15, 1:16, 1:17).',
      technicalImpact: [
        'Determina la concentración final (TDS).',
        'Afecta el rendimiento de extracción modificando el gradiente de concentración entre sólido y solvente.'
      ],
      cupProfile:
        'Ratios cortos → más intensidad y cuerpo; ratios largos → mayor claridad y ligereza.'
    },
    {
      id: 'grind',
      name: 'Tamaño de molienda',
      type: 'Promedio de diámetro de partícula.',
      technicalImpact: [
        'Modifica la superficie expuesta y la resistencia hidráulica del lecho.',
        'Más fino aumenta la velocidad de extracción pero también el riesgo de sobreextracción.'
      ],
      cupProfile:
        'Fino → más cuerpo y amargor; grueso → más acidez y ligereza.'
    },
    {
      id: 'temperature',
      name: 'Temperatura del agua',
      type: 'Energía térmica aplicada durante la extracción.',
      technicalImpact: [
        'Aumenta la solubilidad y la velocidad de difusión molecular.',
        'Temperaturas altas favorecen la extracción de compuestos pesados y fenólicos.'
      ],
      cupProfile:
        'Alta temperatura → más intensidad y amargor; baja → más acidez y delicadeza.'
    },
    {
      id: 'total-time',
      name: 'Tiempo total de extracción',
      type: 'Duración completa del contacto agua–café.',
      technicalImpact: [
        'Determina el porcentaje final de extracción.',
        'Más tiempo aumenta la extracción de compuestos menos solubles.'
      ],
      cupProfile:
        'Corto → subextraído (ácido, delgado); largo → más cuerpo y posible astringencia.'
    },
    {
      id: 'drain-time',
      name: 'Tiempo de drenaje',
      type: 'Duración del flujo gravitacional final.',
      technicalImpact: [
        'Influye en la extracción tardía de melanoidinas y compuestos fenólicos.',
        'Prolongación excesiva aumenta la extracción de finos.'
      ],
      cupProfile:
        'Drenaje largo → mayor cuerpo y riesgo de sequedad.'
    },
    {
      id: 'pours',
      name: 'Número de vertidos',
      type: 'Cantidad de pulsos de agua.',
      technicalImpact: [
        'Cada pulso reinicia gradientes de concentración.',
        'Modifica la turbulencia a lo largo de la extracción.'
      ],
      cupProfile:
        'Más pulsos → más uniformidad y dulzura; vertido único → perfil más estructurado.'
    },
    {
      id: 'flow-rate',
      name: 'Caudal de vertido',
      type: 'Velocidad de flujo (g/s).',
      technicalImpact: [
        'Modifica la turbulencia y la penetración del agua en el lecho.'
      ],
      cupProfile:
        'Caudal alto → más agitación y cuerpo; bajo → mayor claridad.'
    },
    {
      id: 'pour-height',
      name: 'Altura del vertido',
      type: 'Distancia entre kettle y lecho.',
      technicalImpact: [
        'Aumenta la energía cinética del agua, generando erosión y redistribución de finos.'
      ],
      cupProfile:
        'Más altura → mayor intensidad; menor altura → perfil más limpio.'
    },
    {
      id: 'preinfusion',
      name: 'Preinfusión (bloom)',
      type: 'Primera hidratación controlada.',
      technicalImpact: [
        'Permite liberación de CO₂ y mejora la humectación homogénea.',
        'Reduce la formación de canales.'
      ],
      cupProfile:
        'Mayor claridad y dulzura estructural.'
    },
    {
      id: 'bloom-water',
      name: 'Cantidad de agua en bloom',
      type: 'Volumen inicial aplicado.',
      technicalImpact: [
        'Influye en el grado de hidratación y la presión interna por gases.'
      ],
      cupProfile:
        'Bloom generoso → extracción más uniforme.'
    },
    {
      id: 'agitation',
      name: 'Agitación (stir o swirl)',
      type: 'Movimiento mecánico del lecho.',
      technicalImpact: [
        'Reduce la capa límite alrededor de las partículas.',
        'Aumenta la transferencia de masa.'
      ],
      cupProfile:
        'Más intensidad y cuerpo; exceso → astringencia.'
    },
    {
      id: 'jet-turbulence',
      name: 'Turbulencia generada por el chorro',
      type: 'Energía hidrodinámica inducida.',
      technicalImpact: [
        'Afecta la migración de finos y la homogeneidad del lecho.'
      ],
      cupProfile:
        'Mayor turbulencia → extracción más alta pero menos claridad.'
    },
    {
      id: 'dry-distribution',
      name: 'Distribución de la molienda en seco',
      type: 'Nivelación y homogeneidad antes del vertido.',
      technicalImpact: [
        'Reduce microcanales y diferencias de densidad en la cama.'
      ],
      cupProfile:
        'Más balance y menos notas amargas aisladas.'
    },
    {
      id: 'filter-type',
      name: 'Tipo de filtro',
      type: 'Medio filtrante (papel fino, grueso, metal).',
      technicalImpact: [
        'Cambia la resistencia hidráulica y la retención de aceites/lípidos.'
      ],
      cupProfile:
        'Papel denso → alta claridad; metal → más cuerpo.'
    },
    {
      id: 'dripper-geometry',
      name: 'Geometría del dripper',
      type: 'Cono, plano, híbrido.',
      technicalImpact: [
        'Determina la dirección del flujo y la distribución de presión.'
      ],
      cupProfile:
        'Cono → mayor separación aromática; plano → mayor balance y dulzura.'
    },
    {
      id: 'bypass-structural',
      name: 'Bypass estructural',
      type: 'Agua que evita el lecho.',
      technicalImpact: [
        'Reduce la extracción efectiva al diluir sin extraer.'
      ],
      cupProfile:
        'Más ligera y menos intensa.'
    },
    {
      id: 'bypass-intentional',
      name: 'Bypass intencional',
      type: 'Agua añadida post-extracción.',
      technicalImpact: [
        'Dilución sin alterar el rendimiento previo.'
      ],
      cupProfile:
        'Mantiene balance pero reduce intensidad.'
    },
    {
      id: 'water-composition',
      name: 'Composición mineral del agua',
      type: 'GH, KH, Mg, Ca.',
      technicalImpact: [
        'Modula la selectividad química de extracción y la capacidad buffer.'
      ],
      cupProfile:
        'Más magnesio → sabores más brillantes; más calcio → mayor cuerpo.'
    },
    {
      id: 'mg-ca-ratio',
      name: 'Relación Mg/Ca',
      type: 'Balance de cationes principales.',
      technicalImpact: [
        'Afecta la afinidad con ácidos orgánicos y compuestos aromáticos.'
      ],
      cupProfile:
        'Balance adecuado → mayor dulzura percibida.'
    },
    {
      id: 'water-ph',
      name: 'pH del agua',
      type: 'Nivel ácido-base.',
      technicalImpact: [
        'Influye en la percepción de acidez y en la estabilidad química.'
      ],
      cupProfile:
        'pH bajo → acidez más marcada.'
    },
    {
      id: 'hydrostatic-pressure',
      name: 'Presión hidrostática del lecho',
      type: 'Peso de la columna de agua sobre el café.',
      technicalImpact: [
        'Afecta la velocidad de flujo y la compactación del lecho.'
      ],
      cupProfile:
        'Mayor presión → extracción más alta.'
    },
    {
      id: 'fines-migration',
      name: 'Migración de finos',
      type: 'Movimiento descendente de partículas pequeñas.',
      technicalImpact: [
        'Obstruye poros inferiores y aumenta el tiempo de drenaje.'
      ],
      cupProfile:
        'Más cuerpo y posible sequedad.'
    },
    {
      id: 'concentration-gradient',
      name: 'Gradiente de concentración',
      type: 'Diferencia de concentración entre interior de partícula y líquido externo.',
      technicalImpact: [
        'Motor principal de la difusión; disminuye conforme avanza la extracción.'
      ],
      cupProfile:
        'Control adecuado produce un balance óptimo.'
    },
    {
      id: 'boundary-layer',
      name: 'Capa límite de difusión',
      type: 'Microzona alrededor de la partícula donde el líquido se satura.',
      technicalImpact: [
        'Si no se rompe (poca agitación) ralentiza la extracción.'
      ],
      cupProfile:
        'Baja agitación → mayor claridad; alta → mayor intensidad.'
    },
    {
      id: 'thermal-stability',
      name: 'Estabilidad térmica del sistema',
      type: 'Capacidad de mantener temperatura constante.',
      technicalImpact: [
        'Fluctuaciones cambian la cinética extractiva.'
      ],
      cupProfile:
        'Mayor estabilidad → dulzura más consistente.'
    },
    {
      id: 'volatile-retention',
      name: 'Retención de compuestos volátiles',
      type: 'Conservación de aromas ligeros.',
      technicalImpact: [
        'La pérdida ocurre por evaporación durante la extracción caliente.'
      ],
      cupProfile:
        'Mejor retención → mayor complejidad aromática.'
    },
    {
      id: 'post-extraction-oxidation',
      name: 'Oxidación post-extracción',
      type: 'Reacción con oxígeno ambiental.',
      technicalImpact: [
        'Degradación progresiva de compuestos aromáticos.'
      ],
      cupProfile:
        'Pérdida de brillo y frescura.'
    },
    {
      id: 'differential-extraction',
      name: 'Extracción diferencial',
      type: 'Secuencia de solubilidad (ácidos → azúcares → compuestos amargos).',
      technicalImpact: [
        'Controlando variables se puede favorecer ciertas fracciones.'
      ],
      cupProfile:
        'Ajusta el balance entre acidez, dulzura y amargor.'
    },
    {
      id: 'bed-compaction',
      name: 'Compactación del lecho',
      type: 'Densificación durante la extracción.',
      technicalImpact: [
        'Reduce la permeabilidad y altera el flujo.'
      ],
      cupProfile:
        'Puede aumentar cuerpo y riesgo de sobreextracción localizada.'
    },
    {
      id: 'solvent-saturation',
      name: 'Saturación del solvente',
      type: 'Capacidad máxima del agua para disolver sólidos.',
      technicalImpact: [
        'A ratios muy cortos se alcanza antes una saturación parcial.'
      ],
      cupProfile:
        'Más concentración pero menor eficiencia extractiva.'
    },
    {
      id: 'boiling-point-altitude',
      name: 'Punto de ebullición según altitud',
      type: 'Influencia atmosférica.',
      technicalImpact: [
        'A mayor altitud, menor temperatura máxima alcanzable.'
      ],
      cupProfile:
        'Puede limitar la extracción en lugares elevados.'
    },
    {
      id: 'total-extraction',
      name: 'Extracción total (%)',
      type: 'Porcentaje de masa soluble removida del café.',
      technicalImpact: [
        'Indicador global del equilibrio químico alcanzado.'
      ],
      cupProfile:
        '18–22% generalmente balanceado; menos → ácido/delgado; más → seco/astringente.'
    }
  ];

  const selectedMethod = methods.find(item => item.id === selectedMethodId) || null;
  const selectedTool = tools.find(item => item.id === selectedToolId) || null;
  const selectedVariable = variablesAndTechniques.find(item => item.id === selectedVariableId) || null;

  return (
    <div className="bg-stone-100 dark:bg-stone-900/40 p-6 md:p-10 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-8">
      <div className="flex flex-col gap-3">
        <h2 className="text-base md:text-lg font-black uppercase tracking-[0.25em] text-stone-900 dark:text-stone-100">
          Variables y herramientas ({method})
        </h2>
        <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
          Relaciona los ajustes de receta con las herramientas que usas alrededor del filtro. Todo suma o resta a nivel de extracción y sensación en la taza.
        </p>
      </div>

      <div className="space-y-8">
          <div className="space-y-4">
          <div>
            <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">
              Métodos
            </p>
            <p className="text-[11px] md:text-xs text-stone-500 mt-1">
              Drippers y sistemas de filtrado que definen la base de flujo, claridad y cuerpo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {methods.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedMethodId(selectedMethodId === item.id ? null : item.id);
                  setSelectedToolId(null);
                }}
                className={`px-3 py-1.5 rounded-full border text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${
                  selectedMethodId === item.id
                    ? 'bg-black text-white dark:bg-stone-100 dark:text-stone-900 border-black'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-black dark:hover:border-white'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="min-h-[140px] rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/60 p-5 md:p-6">
            {selectedMethod ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">
                      Tipo
                    </p>
                    <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                      {selectedMethod.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">
                      Perfil típico en taza
                    </p>
                    <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                      {selectedMethod.cupProfile}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">
                    Impacto técnico
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                    {selectedMethod.technicalImpact.map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-[11px] md:text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Selecciona un método para ver tipo, impacto técnico y perfil de taza.
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">
              Herramientas
            </p>
            <p className="text-[11px] md:text-xs text-stone-500 mt-1">
              Elementos que modifican el flujo, la estabilidad o la forma en que se extrae y se sirve el café.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tools.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedToolId(selectedToolId === item.id ? null : item.id);
                  setSelectedMethodId(null);
                }}
                className={`px-3 py-1.5 rounded-full border text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${
                  selectedToolId === item.id
                    ? 'bg-black text-white dark:bg-stone-100 dark:text-stone-900 border-black'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-black dark:hover:border-white'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="min-h-[140px] rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/60 p-5 md:p-6">
            {selectedTool ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">
                      Tipo
                    </p>
                    <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                      {selectedTool.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">
                      Perfil típico en taza
                    </p>
                    <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                      {selectedTool.cupProfile}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">
                    Impacto técnico
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                    {selectedTool.technicalImpact.map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-[11px] md:text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Elige una herramienta para ver qué cambia a nivel técnico (flujo, temperatura, minerales, estabilidad) y cómo se traduce en el perfil de la taza.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">
              Variables y técnicas
            </p>
            <p className="text-[11px] md:text-xs text-stone-500 mt-1">
              Cada ajuste que haces en la receta mueve la balanza entre acidez, dulzor, cuerpo y claridad.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {variablesAndTechniques.map(variable => (
              <button
                key={variable.id}
                type="button"
                onClick={() => setSelectedVariableId(selectedVariableId === variable.id ? null : variable.id)}
                className={`px-3 py-1.5 rounded-full border text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${
                  selectedVariableId === variable.id
                    ? 'bg-black text-white dark:bg-stone-100 dark:text-stone-900 border-black'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-black dark:hover:border-white'
                }`}
              >
                {variable.name}
              </button>
            ))}
          </div>
          <div className="min-h-[140px] rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/60 p-5 md:p-6">
            {selectedVariable ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">
                      Tipo
                    </p>
                    <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                      {selectedVariable.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">
                      Perfil típico en taza
                    </p>
                    <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                      {selectedVariable.cupProfile}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">
                    Impacto técnico
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                    {selectedVariable.technicalImpact.map((line: string, idx: number) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-[11px] md:text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Selecciona una variable o técnica para ver su tipo, su impacto técnico y cómo modifica la taza.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FilterTroubleshootingGuide: React.FC<{ method: BrewMethod }> = ({ method }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const visualPhysical = [
    {
      id: 'bed-collapse',
      title: 'Cama colapsada o muy irregular',
      symptom: 'Al final del filtrado la cama queda hundida o con huecos claros.',
      cause:
        method === 'Inmersión'
          ? 'Agitación muy agresiva o vaciado brusco al abrir la válvula.'
          : 'Vertidos concentrados en un solo punto o turbulencia excesiva al inicio.',
      solution:
        method === 'Inmersión'
          ? 'Agita solo al inicio con movimientos suaves y homogéneos. Evita mover la jarra al drenar.'
          : 'Reparte los vertidos en círculos amplios y constantes. Reduce la altura de vertido para suavizar la turbulencia.'
    },
    {
      id: 'channeling',
      title: 'Canales visibles en el filtro',
      symptom: 'Se ven surcos marcados en la cama y el flujo se concentra en ciertas zonas.',
      cause: 'Distribución irregular de la molienda o vertidos muy agresivos en un punto concreto.',
      solution:
        'Nivela la cama antes de verter, usa un bloom más largo y reparte el agua en círculos amplios. Evita verter siempre en el mismo punto.'
    },
    {
      id: 'drip-stall',
      title: 'Filtro casi detenido o goteo extremo',
      symptom: 'El cono se llena y el agua apenas avanza, extendiendo el tiempo mucho más de lo previsto.',
      cause:
        method === 'Aeropress'
          ? 'Molienda demasiado fina o demasiada presión al final del prensado.'
          : 'Molienda muy fina, filtro saturado de finos o paredes del filtro tapadas.',
      solution:
        method === 'Aeropress'
          ? 'Engruesa la molienda, reduce la dosis o el tiempo total y presiona de forma constante sin forzar al final.'
          : 'Engruesa la molienda un par de pasos, revisa el enjuague del filtro y reduce la cantidad de finos usando un molino más estable.'
    }
  ];

  const extraction = [
    {
      id: 'sour',
      title: 'Taza muy ácida / verde',
      symptom: 'Notas cítricas agresivas, sensación vegetal o de té verde sin cuerpo.',
      cause: 'Subextracción global: poco tiempo de contacto, ratio bajo o turbulencia insuficiente.',
      solution:
        'Aumenta ligeramente el tiempo total, sube el ratio (más agua por gramo) y añade un vertido extra suave al centro para extender la extracción.'
    },
    {
      id: 'bitter',
      title: 'Taza amarga / seca',
      symptom: 'Sensación de sequedad en boca, amargor persistente y poco dulzor.',
      cause: 'Sobreextracción: tiempos muy largos, ratio muy alto o molienda demasiado fina.',
      solution:
        'Reduce el tiempo total bajando la altura de la cama al final, engruesa la molienda y baja un poco el ratio. Evita remolinos agresivos al final del filtrado.'
    },
    {
      id: 'flat',
      title: 'Taza plana / sin estructura',
      symptom: 'Sabores correctos pero sin contraste, sin picos de acidez ni dulzor claro.',
      cause: 'Distribución de extracción muy uniforme pero con poco contraste entre fases.',
      solution:
        'Introduce cambios en el patrón de vertidos (por ejemplo, bloom más largo, un vertido con turbulencia marcada y otro más suave) para generar capas de extracción distintas.'
    }
  ];

  const profiling = [
    {
      id: 'prof-sweetness',
      title: 'Quiero más dulzura',
      symptom:
        'Objetivo: mayor percepción de azúcares degradados, con extracción uniforme y sin fenólicos excesivos.',
      cause:
        'La dulzura aparece en el rango medio–alto de extracción (19–21%) y requiere uniformidad.',
      solution:
        'Sube ligeramente temperatura y finura, mejora bloom y uniformidad; evita exceso de finos y drenajes largos.',
      solutionList: [
        'Aumentar ligeramente: temperatura (+1–2°C), agitación controlada, uniformidad de molienda.',
        'Ajustar: molienda un poco más fina (microajuste), bloom más homogéneo.',
        'Evitar: exceso de finos, drenajes extremadamente largos.'
      ]
    },
    {
      id: 'prof-bright-acidity',
      title: 'Quiero más acidez brillante',
      symptom:
        'Objetivo: acidez limpia y definida con menor predominancia de compuestos tardíos.',
      cause:
        'Los ácidos orgánicos son altamente solubles y se extraen primero; reduciendo tiempo y energía favoreces su predominancia relativa.',
      solution:
        'Baja tiempo, temperatura y agitación; sube ratio y muele un poco más grueso.',
      solutionList: [
        'Reducir: tiempo total, temperatura, agitación.',
        'Aumentar: ratio (más agua), molienda ligeramente más gruesa.'
      ]
    },
    {
      id: 'prof-body',
      title: 'Quiero más cuerpo',
      symptom:
        'Objetivo: mayor TDS, más sólidos en suspensión y extracción de melanoidinas.',
      cause:
        'El cuerpo se relaciona con mayor concentración y compuestos tardíos de extracción.',
      solution:
        'Muele más fino, sube temperatura y agitación moderada; baja ratio y usa filtro menos denso si es posible.',
      solutionList: [
        'Aumentar: molienda más fina, temperatura, agitación moderada.',
        'Opcional: usar filtro menos denso si es posible.',
        'Reducir: ratio (concentración más alta).'
      ]
    },
    {
      id: 'prof-clarity',
      title: 'Quiero más claridad',
      symptom:
        'Objetivo: mayor limpieza sensorial y separación aromática con menos turbidez.',
      cause:
        'Menos turbulencia reduce migración de finos y disminuye la turbidez.',
      solution:
        'Reduce agitación, altura del vertido y finos; aumenta ratio y usa filtros más densos.',
      solutionList: [
        'Reducir: agitación, altura del vertido, finos (mejor molino o tamizado).',
        'Aumentar: ratio, uso de filtros más densos.'
      ]
    },
    {
      id: 'prof-astringent',
      title: 'Taza astringente / seca',
      symptom: 'Sensación de sequedad y aspereza en boca.',
      cause: 'Sobreextracción localizada, migración de finos y drenaje muy largo.',
      causeList: [
        'Sobreextracción localizada',
        'Migración de finos',
        'Drenaje muy largo'
      ],
      solution:
        'Engruesa un punto, reduce agitación, mejora distribución del lecho y acorta el contacto.',
      solutionList: [
        'Molienda ligeramente más gruesa.',
        'Reducir agitación.',
        'Mejorar distribución del lecho.',
        'Reducir tiempo de contacto.'
      ]
    },
    {
      id: 'prof-thin',
      title: 'Taza delgada / vacía',
      symptom: 'Poca textura, poco dulzor y sensación aguada.',
      cause: 'Subextracción y baja concentración.',
      causeList: ['Subextracción', 'Baja concentración'],
      solution:
        'Muele más fino, sube temperatura, acorta ratio y añade más agitación inicial.',
      solutionList: [
        'Molienda más fina.',
        'Temperatura más alta.',
        'Ratio más corto.',
        'Más agitación inicial.'
      ]
    },
    {
      id: 'prof-unbalanced',
      title: 'Sabores desbalanceados (ácido + amargo)',
      symptom: 'Choque entre acidez marcada y amargor tardío.',
      cause: 'Extracción no uniforme.',
      solution:
        'Mejora nivelación en seco, optimiza bloom, controla caudal y reduce altura del chorro; revisa la calidad de molienda.',
      solutionList: [
        'Mejor distribución en seco.',
        'Bloom más efectivo.',
        'Controlar caudal.',
        'Reducir altura del chorro.',
        'Revisar calidad de molienda.'
      ]
    },
    {
      id: 'prof-realtime-map',
      title: 'Mapa de decisiones en tiempo real',
      symptom:
        'Flujo práctico de decisiones durante la preparación.',
      cause: 'Protocolo de diagnóstico en tres pasos.',
      causeList: [
        'Paso 1: Observa el tiempo de drenaje.',
        '¿Drena mucho más lento?: exceso de finos, molienda muy fina, migración por demasiada agitación.',
        'Solución próxima preparación: 1 click más grueso, reducir swirl.',
        'Si no: continuar al paso 2.'
      ],
      solution:
        'Paso 2: ajusta según la taza; Paso 3: cambia una variable principal a la vez (molienda → temperatura → ratio → agitación).',
      solutionList: [
        'Paso 2: Prueba la taza.',
        '¿Demasiado ácida y ligera? → subextracción: más fino, +1–2°C, un poco más de agitación.',
        '¿Amarga y seca? → sobreextracción: más grueso, menos temperatura, menos contacto.',
        '¿Intensa pero desbalanceada? → no uniforme: mejor bloom, vertidos más controlados, menor altura del chorro.',
        'Paso 3: Regla de oro. Cambia una variable principal a la vez: molienda → temperatura → ratio → agitación.'
      ]
    }
  ];

  const problemSections = [
    {
      id: 'visual',
      label: 'Problemas visuales y físicos',
      description: 'Lo que ves en el filtro y en el flujo antes de probar la taza.',
      items: visualPhysical
    },
    {
      id: 'extraction',
      label: 'Problemas de extracción en taza',
      description: 'Lo que percibes sensorialmente una vez servido el café.',
      items: extraction
    }
  ];

  const currentItem = [
      ...problemSections.flatMap(section => section.items),
      ...profiling
    ]
    .find(item => item.id === openId) || null;

  return (
    <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900/90 p-6 lg:p-10 space-y-10">
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="space-y-3">
            <h2 className="text-base md:text-lg font-black uppercase tracking-[0.25em] text-stone-900 dark:text-stone-100">
              Perfilación
            </h2>
            <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-3xl">
              Modelo causa–efecto y ajustes por objetivo.
            </p>
            <div className="mt-4 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-stone-50/60 dark:bg-stone-900">
              <div className="divide-y divide-stone-200 dark:divide-stone-800">
                {profiling.map(item => (
                  <div key={item.id} className="overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenId(openId === item.id ? null : item.id)}
                      className={`w-full text-left px-5 py-4 min-h-[44px] text-[10px] md:text-[11px] font-bold uppercase tracking-widest flex items-center justify-between transition-colors ${
                        openId === item.id
                          ? 'bg-black text-white dark:bg-stone-100 dark:text-stone-900'
                          : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <span className="pr-4">{item.title}</span>
                      <span className="text-[11px] font-bold">
                        {openId === item.id ? 'Cerrar' : 'Ver'}
                      </span>
                    </button>
                    <div
                      className={`px-5 py-4 bg-stone-50/70 dark:bg-stone-950/40 transition-all duration-500 ease-in-out ${
                        openId === item.id ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-red-500 mb-1">Síntoma</p>
                          {'symptomList' in item && Array.isArray((item as any).symptomList) ? (
                            <ul className="list-disc list-inside space-y-2 text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                              {(item as any).symptomList.map((line: string, idx: number) => (
                                <li key={idx}>{line}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{item.symptom}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-amber-500 mb-1">Qué te está diciendo el café</p>
                          {'causeList' in item && Array.isArray((item as any).causeList) ? (
                            <ul className="list-disc list-inside space-y-2 text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                              {(item as any).causeList.map((line: string, idx: number) => (
                                <li key={idx}>{line}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{item.cause}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-green-600 mb-1">Ajustes sugeridos</p>
                          {'solutionList' in item && Array.isArray((item as any).solutionList) ? (
                            <ul className="list-disc list-inside space-y-2 text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                              {(item as any).solutionList.map((line: string, idx: number) => (
                                <li key={idx}>{line}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{item.solution}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-2 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-4">
              <div className="space-y-3">
                <h2 className="text-base md:text-lg font-black uppercase tracking-[0.25em] text-stone-900 dark:text-stone-100">
                  Problemas comunes ({method})
                </h2>
                <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
                  Usa este mapa visual y sensorial para interpretar lo que ves en el filtro y lo que pruebas en la taza, y convierte esas señales en ajustes concretos.
                </p>
              </div>
              <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-400">
                De la cama al sorbo final
              </div>
            </div>
            {problemSections.map(section => (
              <div key={section.id} className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-stone-50/60 dark:bg-stone-900 mt-4">
                <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800">
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">
                    {section.label}
                  </p>
                  <p className="text-[11px] md:text-xs text-stone-500 mt-2 leading-relaxed">
                    {section.description}
                  </p>
                </div>
                <div className="divide-y divide-stone-200 dark:divide-stone-800">
                  {section.items.map(item => (
                    <div key={item.id} className="overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenId(openId === item.id ? null : item.id)}
                        className={`w-full text-left px-5 py-4 min-h-[44px] text-[10px] md:text-[11px] font-bold uppercase tracking-widest flex items-center justify-between transition-colors ${
                          openId === item.id
                            ? 'bg-black text-white dark:bg-stone-100 dark:text-stone-900'
                            : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        <span className="pr-4">{item.title}</span>
                        <span className="text-[11px] font-bold">
                          {openId === item.id ? 'Cerrar' : 'Ver'}
                        </span>
                      </button>
                      <div
                        className={`px-5 py-4 bg-stone-50/70 dark:bg-stone-950/40 transition-all duration-500 ease-in-out ${
                          openId === item.id ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-red-500 mb-1">Síntoma</p>
                            {'symptomList' in item && Array.isArray((item as any).symptomList) ? (
                              <ul className="list-disc list-inside space-y-2 text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                                {(item as any).symptomList.map((line: string, idx: number) => (
                                  <li key={idx}>{line}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{item.symptom}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-amber-500 mb-1">Qué te está diciendo el café</p>
                            {'causeList' in item && Array.isArray((item as any).causeList) ? (
                              <ul className="list-disc list-inside space-y-2 text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                                {(item as any).causeList.map((line: string, idx: number) => (
                                  <li key={idx}>{line}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{item.cause}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-green-600 mb-1">Ajustes sugeridos</p>
                            {'solutionList' in item && Array.isArray((item as any).solutionList) ? (
                              <ul className="list-disc list-inside space-y-2 text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                                {(item as any).solutionList.map((line: string, idx: number) => (
                                  <li key={idx}>{line}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{item.solution}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const createEmptyRecipe = (): FilterRecipe => {
  const now = new Date().toISOString();
  return {
    id: typeof crypto !== 'undefined' && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : Math.random().toString(36).substring(2),
    createdAt: now,
    updatedAt: now,
    name: 'Nueva receta',
    method: 'Filtro',
    coffeeName: '',
    coffeeOrigin: '',
    coffeeDate: new Date().toISOString().split('T')[0],
    doseGrams: 15,
    waterTempCelsius: 92,
    grinderModel: '',
    grinderClicks: null,
    totalWaterMl: 250,
    ratio: '1:16',
    totalTimeSeconds: 150,
    pressureBars: null,
    filterType: '',
    waterBrand: '',
    phases: [],
    tasting: {
      flavor: '',
      aroma: '',
      body: '',
      acidity: ''
    },
    notes: '',
    deleted: false
  };
};

const FilterRecipeManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { showToast } = useToast();
  const [recipes, setRecipes] = useState<FilterRecipe[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [view, setView] = useState<'recipes' | 'guide' | 'troubleshoot'>('recipes');
  const [sessionStage, setSessionStage] = useState<'coffee' | 'recipes'>('recipes');
  const recipeItemRefs = useRef<HTMLButtonElement[]>([]);

  useEffect(() => {
    let isMounted = true;
    db.filterRecipes.toArray().then(all => {
      if (!isMounted) return;
      setRecipes(all.filter(r => !r.deleted));
      if (all.length > 0) {
        setSelectedId(all[0].id);
      }
    }).catch(err => {
      console.error('Error loading filter recipes:', err);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const current = useMemo(
    () => recipes.find(r => r.id === selectedId) || null,
    [recipes, selectedId]
  );

  useEffect(() => {
    if (!dirty || !current) return;
    const timeout = setTimeout(async () => {
      try {
        const updated = { ...current, updatedAt: new Date().toISOString() };
        await db.filterRecipes.put(updated);
        setRecipes(prev => prev.map(r => (r.id === updated.id ? updated : r)));
        setDirty(false);
        showToast('Cambios guardados automáticamente', 'success');
      } catch (err) {
        console.error('Error autosaving filter recipe:', err);
        showToast('Error al guardar cambios', 'error');
      }
    }, 1500);
    return () => clearTimeout(timeout);
  }, [dirty, current, showToast]);

  const updateCurrent = (patch: Partial<FilterRecipe>) => {
    if (!current) return;
    setRecipes(prev =>
      prev.map(r => (r.id === current.id ? { ...r, ...patch } : r))
    );
    setDirty(true);
  };

  const handleAddRecipe = () => {
    const base = createEmptyRecipe();
    setRecipes(prev => [...prev, base]);
    setSelectedId(base.id);
    setDirty(true);
  };

  const handleStartSession = () => {
    const base = createEmptyRecipe();
    setRecipes(prev => [...prev, base]);
    setSelectedId(base.id);
    setSessionStage('coffee');
    setDirty(true);
  };

  const handleRecipeHoverEnter = (index: number) => {
    const el = recipeItemRefs.current[index];
    if (!el) return;
    gsap.to(el, { y: -4, scale: 1.02, duration: 0.2, ease: 'power2.out' });
  };

  const handleRecipeHoverLeave = (index: number) => {
    const el = recipeItemRefs.current[index];
    if (!el) return;
    gsap.to(el, { y: 0, scale: 1, duration: 0.2, ease: 'power2.inOut' });
  };

  const handleDuplicateRecipe = () => {
    if (!current) return;
    const now = new Date().toISOString();
    const copy: FilterRecipe = {
      ...current,
      id: typeof crypto !== 'undefined' && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : Math.random().toString(36).substring(2),
      name: `${current.name} (copia)`,
      createdAt: now,
      updatedAt: now
    };
    setRecipes(prev => [...prev, copy]);
    setSelectedId(copy.id);
    setDirty(true);
    showToast('Receta duplicada', 'success');
  };

  const handleDeleteRecipe = async () => {
    if (!current) return;
    if (!window.confirm('¿Seguro que quieres eliminar esta receta?')) {
      return;
    }

    try {
      const updated: FilterRecipe = {
        ...current,
        deleted: true,
        updatedAt: new Date().toISOString()
      };
      await db.filterRecipes.put(updated);
      const nextRecipes = recipes.filter(r => r.id !== current.id);
      setRecipes(nextRecipes);
      setSelectedId(nextRecipes.length > 0 ? nextRecipes[0].id : null);
      setDirty(false);
      showToast('Receta eliminada', 'success');
    } catch (err) {
      console.error('Error deleting filter recipe:', err);
      showToast('Error al eliminar la receta', 'error');
    }
  };

  const handleAddPhase = () => {
    if (!current) return;
    const nextOrder = (current.phases?.length || 0) + 1;
    const lastEnd = current.phases?.length
      ? current.phases[current.phases.length - 1].endTimeSeconds
      : 0;
    const phase: FilterRecipePhase = {
      id: typeof crypto !== 'undefined' && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : Math.random().toString(36).substring(2),
      order: nextOrder,
      startTimeSeconds: lastEnd,
      endTimeSeconds: lastEnd + 30,
      volumeMl: Math.round((current.totalWaterMl || 0) / Math.max(nextOrder, 1)),
      pourType: 'continuous'
    };
    updateCurrent({ phases: [...current.phases, phase] });
  };

  const handleUpdatePhase = (id: string, patch: Partial<FilterRecipePhase>) => {
    if (!current) return;
    updateCurrent({
      phases: current.phases.map(p => (p.id === id ? { ...p, ...patch } : p))
    });
  };

  const handleExportPdf = () => {
    if (!current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const title = current.name;
    const rows = current.phases
      .map(
        p =>
          `<tr><td>${p.order}</td><td>${p.startTimeSeconds}</td><td>${p.endTimeSeconds}</td><td>${p.volumeMl}</td><td>${p.pourType}</td></tr>`
      )
      .join('');
    w.document.write(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; }
            h1 { font-size: 20px; margin-bottom: 8px; }
            h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p><strong>Método:</strong> ${current.method}</p>
          <p><strong>Café:</strong> ${current.coffeeName} (${current.coffeeOrigin})</p>
          <p><strong>Fecha café:</strong> ${current.coffeeDate}</p>
          <p><strong>Dosis:</strong> ${current.doseGrams} g | <strong>Agua:</strong> ${current.totalWaterMl} ml | <strong>Ratio:</strong> ${current.ratio}</p>
          <p><strong>Tiempo total:</strong> ${current.totalTimeSeconds} s | <strong>Temperatura:</strong> ${current.waterTempCelsius.toFixed(1)} °C</p>
          <p><strong>Modelo de molino:</strong> ${current.grinderModel} | <strong>Clicks:</strong> ${current.grinderClicks ?? ''}</p>
          <p><strong>Marca de agua:</strong> ${current.waterBrand}</p>
          <h2>Notas de degustación</h2>
          <p><strong>Sabor:</strong> ${current.tasting.flavor}</p>
          <p><strong>Aroma:</strong> ${current.tasting.aroma}</p>
          <p><strong>Cuerpo:</strong> ${current.tasting.body}</p>
          <p><strong>Acidez:</strong> ${current.tasting.acidity}</p>
          <h2>Fases de vertido</h2>
          <table>
            <thead>
              <tr><th>Fase</th><th>Inicio (s)</th><th>Fin (s)</th><th>Volumen (ml)</th><th>Tipo</th></tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  const validateNumeric = (value: number, min: number, max: number) => {
    return !Number.isNaN(value) && value >= min && value <= max;
  };

  return (
    <div className="max-w-6xl mx-auto pb-32 animate-fade-in px-4 pt-8">
      <TopBackButton onClick={onBack} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setView('recipes')}
          className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-widest ${
            view === 'recipes'
              ? 'bg-black text-white dark:bg-stone-100 dark:text-stone-900 border-black'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-200'
          }`}
        >
          <span>Filtrados</span>
        </button>
        <button
          type="button"
          onClick={() => setView('guide')}
          className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-widest ${
            view === 'guide'
              ? 'bg-black text-white dark:bg-stone-100 dark:text-stone-900 border-black'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-200'
          }`}
        >
          <span>Variables y herramientas</span>
        </button>
        <button
          type="button"
          onClick={() => setView('troubleshoot')}
          className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-widest ${
            view === 'troubleshoot'
              ? 'bg-black text-white dark:bg-stone-100 dark:text-stone-900 border-black'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-200'
          }`}
        >
          <span>Perfilación</span>
        </button>
      </div>

      {view === 'recipes' && (
        <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-72 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-stone-500">
              Recetas
            </h2>
            <button
              type="button"
              onClick={handleStartSession}
              className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg bg-black text-white dark:bg-stone-100 dark:text-stone-900"
            >
              Nueva sesión
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {recipes.length === 0 && (
              <div className="text-xs text-stone-400 py-8 text-center">
                Aún no hay recetas creadas.
              </div>
            )}
            {recipes.map((r, index) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setSelectedId(r.id);
                  setSessionStage('recipes');
                }}
                ref={el => {
                  if (el) {
                    recipeItemRefs.current[index] = el;
                  }
                }}
                onMouseEnter={() => handleRecipeHoverEnter(index)}
                onMouseLeave={() => handleRecipeHoverLeave(index)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs border ${
                  r.id === selectedId
                    ? 'bg-black text-white border-black dark:bg-stone-100 dark:text-stone-900'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200'
                }`}
              >
                <div className="font-bold truncate">{r.name}</div>
                <div className="text-[10px] text-stone-400">
                  {r.method} • {r.ratio}
                </div>
              </button>
            ))}
          </div>
        </div>

        {current && (
          <div className="flex-1 space-y-6">
            {sessionStage === 'coffee' ? (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4">
                <div className="space-y-2">
                  <h2 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
                    Datos del café
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Primero registra la información básica del café. Luego podrás definir las recetas de filtrado para esta sesión.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Marca / café
                    </span>
                    <input
                      type="text"
                      value={current.coffeeName}
                      onChange={e => updateCurrent({ coffeeName: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                      placeholder="Marca, finca o lote"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Variedad / origen
                    </span>
                    <input
                      type="text"
                      value={current.coffeeOrigin}
                      onChange={e => updateCurrent({ coffeeOrigin: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                      placeholder="Ej. Caturra, Colombia, finca, región"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Fecha (tueste o lote)
                    </span>
                    <input
                      type="date"
                      value={current.coffeeDate}
                      onChange={e => updateCurrent({ coffeeDate: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Notas estimadas y detalles
                    </span>
                    <textarea
                      value={current.notes ?? ''}
                      onChange={e => updateCurrent({ notes: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs min-h-[80px]"
                      placeholder="Altura, proceso, notas sensoriales esperadas, información adicional..."
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSessionStage('recipes')}
                    className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg bg-black text-white dark:bg-stone-100 dark:text-stone-900"
                  >
                    Continuar a recetas
                  </button>
                </div>
              </div>
            ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <input
                    type="text"
                    value={current.name}
                    onChange={e => updateCurrent({ name: e.target.value })}
                    className="w-full text-xl font-black bg-transparent border-b border-stone-200 dark:border-stone-700 focus:outline-none focus:border-brand py-1"
                    placeholder="Nombre de la receta"
                  />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                        Método
                      </span>
                      <select
                        value={current.method}
                        onChange={e => updateCurrent({ method: e.target.value as BrewMethod })}
                        className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                      >
                        {brewMethodOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                        Café
                      </span>
                      <input
                        type="text"
                        value={current.coffeeName}
                        onChange={e => updateCurrent({ coffeeName: e.target.value })}
                        className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                        placeholder="Origen, finca o lote"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                        Dosis (g)
                      </span>
                      <input
                        type="number"
                        min={5}
                        max={60}
                        value={current.doseGrams}
                        onChange={e => {
                          const val = Number(e.target.value);
                          if (!validateNumeric(val, 1, 100)) return;
                          const patch: Partial<FilterRecipe> = { doseGrams: val };
                          if (current.totalWaterMl && current.totalWaterMl > 0) {
                            const waterPerGram = current.totalWaterMl / val;
                            patch.ratio = formatRatio(waterPerGram);
                          }
                          updateCurrent(patch);
                        }}
                        className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                        Ratio
                      </span>
                      <input
                        type="text"
                        value={current.ratio}
                        onChange={e => {
                          const nextRatio = e.target.value;
                          const patch: Partial<FilterRecipe> = { ratio: nextRatio };
                          const waterPerGram = parseRatio(nextRatio);
                          if (waterPerGram && current.doseGrams > 0) {
                            patch.totalWaterMl = Math.round(current.doseGrams * waterPerGram);
                          }
                          updateCurrent(patch);
                        }}
                        className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                        placeholder="1:15, 1:16..."
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={handleDuplicateRecipe}
                    className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
                  >
                    Duplicar
                  </button>
              <button
                type="button"
                onClick={handleDeleteRecipe}
                className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                Eliminar
              </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
                    >
                      PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Agua total (ml)
                  </span>
                  <input
                    type="number"
                    min={50}
                    max={1000}
                    value={current.totalWaterMl}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (!validateNumeric(val, 10, 2000)) return;
                      const patch: Partial<FilterRecipe> = { totalWaterMl: val };
                      if (current.doseGrams > 0) {
                        const waterPerGram = val / current.doseGrams;
                        patch.ratio = formatRatio(waterPerGram);
                      }
                      updateCurrent(patch);
                    }}
                    className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Tiempo total (s)
                  </span>
                  <input
                    type="number"
                    min={10}
                    max={600}
                    value={current.totalTimeSeconds}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (!validateNumeric(val, 10, 1200)) return;
                      updateCurrent({ totalTimeSeconds: val });
                    }}
                    className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Temp. agua (°C)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min={80}
                    max={100}
                    value={current.waterTempCelsius}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (!validateNumeric(val, 60, 100)) return;
                      updateCurrent({ waterTempCelsius: val });
                    }}
                    className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Presión (bar opcional)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={current.pressureBars ?? ''}
                    onChange={e => {
                      const val = e.target.value === '' ? null : Number(e.target.value);
                      if (val !== null && !validateNumeric(val, 0, 20)) return;
                      updateCurrent({ pressureBars: val });
                    }}
                    className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Modelo de molino
                  </span>
                  <input
                    type="text"
                    value={current.grinderModel}
                    onChange={e => updateCurrent({ grinderModel: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                    placeholder="Marca y modelo del molino"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Clicks molino
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={current.grinderClicks ?? ''}
                    onChange={e => {
                      const val = e.target.value === '' ? null : Number(e.target.value);
                      if (val !== null && !validateNumeric(val, 0, 500)) return;
                      updateCurrent({ grinderClicks: val });
                    }}
                    className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Modelo de filtro
                  </span>
                  <input
                    type="text"
                    value={current.filterType}
                    onChange={e => updateCurrent({ filterType: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                    placeholder="V60 02, Kalita 185..."
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    Marca de agua
                  </span>
                  <input
                    type="text"
                    value={current.waterBrand}
                    onChange={e => updateCurrent({ waterBrand: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                    placeholder="Ej. filtrada, embotellada"
                  />
                </div>
              </div>
            </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
                    Fases de vertido
                  </h2>
                  <button
                    type="button"
                    onClick={handleAddPhase}
                    className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg bg-black text-white dark:bg-stone-100 dark:text-stone-900"
                  >
                    Añadir fase
                  </button>
                </div>
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {current.phases.length === 0 && (
                    <div className="text-xs text-stone-400 py-6">
                      Aún no hay fases definidas.
                    </div>
                  )}
                  {current.phases.map(phase => (
                    <div
                      key={phase.id}
                      className="border border-stone-200 dark:border-stone-700 rounded-lg p-3 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-700 dark:text-stone-200">
                          Fase {phase.order}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                            Inicio (s)
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={current.totalTimeSeconds}
                            value={phase.startTimeSeconds}
                            onChange={e =>
                              handleUpdatePhase(phase.id, {
                                startTimeSeconds: Number(e.target.value)
                              })
                            }
                            className="w-full p-1.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                            Fin (s)
                          </span>
                          <input
                            type="number"
                            min={phase.startTimeSeconds}
                            max={current.totalTimeSeconds}
                            value={phase.endTimeSeconds}
                            onChange={e =>
                              handleUpdatePhase(phase.id, {
                                endTimeSeconds: Number(e.target.value)
                              })
                            }
                            className="w-full p-1.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                            Volumen (ml)
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={current.totalWaterMl}
                            value={phase.volumeMl}
                            onChange={e =>
                              handleUpdatePhase(phase.id, {
                                volumeMl: Number(e.target.value)
                              })
                            }
                            className="w-full p-1.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                          Tipo de vertido
                        </span>
                        <select
                          value={phase.pourType}
                          onChange={e =>
                            handleUpdatePhase(phase.id, {
                              pourType: e.target.value as any
                            })
                          }
                          className="w-full p-1.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                        >
                          {pourTypeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
                  Notas de degustación
                </h2>
                <div className="grid grid-cols-1 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Sabor
                    </span>
                    <textarea
                      value={current.tasting.flavor}
                      onChange={e =>
                        updateCurrent({
                          tasting: { ...current.tasting, flavor: e.target.value }
                        })
                      }
                      className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs min-h-[60px]"
                      placeholder="Descriptores de sabor predominantes"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Aroma
                    </span>
                    <textarea
                      value={current.tasting.aroma}
                      onChange={e =>
                        updateCurrent({
                          tasting: { ...current.tasting, aroma: e.target.value }
                        })
                      }
                      className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs min-h-[60px]"
                      placeholder="Aromas percibidos en seco y en caliente"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Cuerpo
                    </span>
                    <textarea
                      value={current.tasting.body}
                      onChange={e =>
                        updateCurrent({
                          tasting: { ...current.tasting, body: e.target.value }
                        })
                      }
                      className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs min-h-[60px]"
                      placeholder="Sensación en boca, textura"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Acidez
                    </span>
                    <textarea
                      value={current.tasting.acidity}
                      onChange={e =>
                        updateCurrent({
                          tasting: { ...current.tasting, acidity: e.target.value }
                        })
                      }
                      className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs min-h-[60px]"
                      placeholder="Tipo de acidez, intensidad, carácter"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Notas adicionales
                    </span>
                    <textarea
                      value={current.notes ?? ''}
                      onChange={e => updateCurrent({ notes: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs min-h-[60px]"
                      placeholder="Observaciones generales, ajustes futuros sugeridos"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
        </div>
      )}

      {view === 'guide' && (
        <div className="w-full">
          <FilterCalibrationGuide method={current?.method ?? 'Filtro'} />
        </div>
      )}

      {view === 'troubleshoot' && (
        <div className="w-full">
          <FilterTroubleshootingGuide method={current?.method ?? 'Filtro'} />
        </div>
      )}
    </div>
  );
};

const FilterBrewView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { showToast } = useToast();
  const [sessionData, setSessionData] = useState({
    brewerName: '',
    coffeeName: '',
    method: '',
    notes: ''
  });
  const [pours, setPours] = useState<FilterPour[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    minutes: '',
    seconds: '',
    volumeMl: ''
  });

  const sortedPours = useMemo(
    () => [...pours].sort((a, b) => a.timeSeconds - b.timeSeconds),
    [pours]
  );

  const totalVolume = useMemo(
    () => pours.reduce((sum, p) => sum + p.volumeMl, 0),
    [pours]
  );

  const handleSubmitPour = () => {
    const minutes = Number(formState.minutes || 0);
    const seconds = Number(formState.seconds || 0);
    const volume = Number(formState.volumeMl);

    if (isNaN(volume) || volume <= 0) {
      showToast('Ingresa un volumen válido en ml', 'error');
      return;
    }

    if (isNaN(minutes) || minutes < 0 || isNaN(seconds) || seconds < 0 || seconds > 59) {
      showToast('El tiempo debe tener minutos y segundos válidos', 'error');
      return;
    }

    const timeSeconds = minutes * 60 + seconds;

    if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
      showToast('El tiempo debe ser un número válido', 'error');
      return;
    }

    if (editingId) {
      setPours(current =>
        current.map(p =>
          p.id === editingId
            ? { ...p, timeSeconds, volumeMl: volume }
            : p
        )
      );
      showToast('Vertido actualizado', 'success');
    } else {
      const id =
        typeof crypto !== 'undefined' && (crypto as any).randomUUID
          ? (crypto as any).randomUUID()
          : Math.random().toString(36).substring(2);

      const nextOrder = pours.length + 1;
      const newPour: FilterPour = {
        id,
        order: nextOrder,
        timeSeconds,
        volumeMl: volume
      };

      setPours(current => [...current, newPour]);
      showToast('Vertido añadido a la línea de tiempo', 'success');
    }

    setEditingId(null);
    setFormState({
      minutes: '',
      seconds: '',
      volumeMl: ''
    });
  };

  const handleEditPour = (pour: FilterPour) => {
    const minutes = Math.floor(pour.timeSeconds / 60);
    const seconds = pour.timeSeconds % 60;
    setEditingId(pour.id);
    setFormState({
      minutes: String(minutes),
      seconds: String(seconds),
      volumeMl: String(pour.volumeMl)
    });
  };

  const handleClearTimeline = () => {
    if (pours.length === 0) return;
    setPours([]);
    setEditingId(null);
    setFormState({
      minutes: '',
      seconds: '',
      volumeMl: ''
    });
    showToast('Línea de tiempo reiniciada', 'success');
  };

  const handleSaveSession = async () => {
    if (!sessionData.coffeeName.trim() || !sessionData.method.trim()) {
      showToast('Ingresa al menos el café y el método', 'error');
      return;
    }
    if (pours.length === 0) {
      showToast('Agrega al menos un vertido', 'error');
      return;
    }

    const id =
      typeof crypto !== 'undefined' && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : Math.random().toString(36).substring(2);

    const session: FilterSession = {
      id,
      date: new Date().toISOString(),
      brewerName: sessionData.brewerName.trim() || 'Barista',
      coffeeName: sessionData.coffeeName.trim(),
      method: sessionData.method.trim(),
      pours,
      notes: sessionData.notes.trim() || undefined
    };

    try {
      await db.filterSessions.add(session);
      showToast('Sesión de filtrado guardada', 'success');
    } catch (error) {
      console.error('Error saving filter session:', error);
      showToast('Error al guardar la sesión', 'error');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  return (
    <>
      <TopBackButton onClick={onBack} />
      <div className="max-w-4xl mx-auto pb-32 animate-fade-in px-4 pt-8">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-stone-900 dark:bg-stone-100">
              <Filter className="w-5 h-5 text-white dark:text-stone-900" />
            </span>
            Recetas de Filtrado
          </h1>
          <p className="text-stone-500 text-sm">
            Registra cada vertido con tiempo exacto y volumen para replicar tus filtrados.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
            Volumen total
          </span>
          <div className="px-4 py-2 rounded-full bg-black text-white dark:bg-stone-100 dark:text-stone-900 text-sm font-black tracking-widest">
            {totalVolume} ml
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
              Información de la sesión
            </h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Café
                </label>
                <input
                  type="text"
                  value={sessionData.coffeeName}
                  onChange={e => setSessionData({ ...sessionData, coffeeName: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm"
                  placeholder="Origen, finca o lote"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Método
                </label>
                <input
                  type="text"
                  value={sessionData.method}
                  onChange={e => setSessionData({ ...sessionData, method: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm"
                  placeholder="V60, Kalita, Chemex..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Barista
                </label>
                <input
                  type="text"
                  value={sessionData.brewerName}
                  onChange={e => setSessionData({ ...sessionData, brewerName: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm"
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Notas
                </label>
                <textarea
                  value={sessionData.notes}
                  onChange={e => setSessionData({ ...sessionData, notes: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm min-h-[72px] resize-none"
                  placeholder="Comentarios sobre temperatura, receta base o sensaciones en taza"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
              Nuevo vertido
            </h2>
            <div className="grid grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Minutos
                </label>
                <input
                  type="number"
                  min={0}
                  value={formState.minutes}
                  onChange={e => setFormState({ ...formState, minutes: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Segundos
                </label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={formState.seconds}
                  onChange={e => setFormState({ ...formState, seconds: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Volumen (ml)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formState.volumeMl}
                  onChange={e => setFormState({ ...formState, volumeMl: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-2 focus:ring-brand outline-none text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <button
                type="button"
                onClick={handleSubmitPour}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-black text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-black uppercase tracking-[0.25em] hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
              >
                {editingId ? 'Actualizar vertido' : 'Añadir vertido'}
              </button>
              <button
                type="button"
                onClick={handleClearTimeline}
                className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Reiniciar
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveSession}
            className="w-full mt-2 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-black uppercase tracking-[0.3em] hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-lg"
          >
            Guardar sesión de filtrado
          </button>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
                Línea de tiempo de vertidos
              </h2>
              <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                {sortedPours.length} vertidos
              </span>
            </div>

            {sortedPours.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center text-sm text-stone-400">
                Añade tu primer vertido para comenzar la línea de tiempo.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[520px] pr-2">
                <div className="relative">
                  <div className="absolute left-1.5 top-2 bottom-2 w-[2px] bg-stone-200 dark:bg-stone-700" />
                  <div className="space-y-4">
                    {sortedPours.map(pour => {
                      const cumulative = sortedPours
                        .filter(p => p.timeSeconds <= pour.timeSeconds)
                        .reduce((sum, p) => sum + p.volumeMl, 0);
                      return (
                        <div key={pour.id} className="relative pl-8">
                          <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-black dark:bg-stone-100 border-2 border-white dark:border-stone-900" />
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="text-[11px] font-mono bg-white dark:bg-stone-800 px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
                                {formatTime(pour.timeSeconds)}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                                  Vertido de {pour.volumeMl} ml
                                </div>
                                <div className="text-[11px] text-stone-500">
                                  Volumen acumulado: {cumulative} ml
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditPour(pour)}
                                className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-lg border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                              >
                                Editar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};


export const RecipesView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'none' | 'espresso' | 'filter'>('none');
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const espressoCardRef = useRef<HTMLButtonElement | null>(null);
  const filterCardRef = useRef<HTMLButtonElement | null>(null);
  const espressoBackHandlerRef = useRef<(() => boolean) | null>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!cursorRef.current) return;
      gsap.to(cursorRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.2,
        ease: 'power3.out'
      });
    };
    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
    };
  }, []);

  const handleCategoryCardEnter = (el: HTMLButtonElement | null) => {
    if (!el) return;
    gsap.to(el, { y: -8, scale: 1.03, duration: 0.25, ease: 'power2.out' });
  };

  const handleCategoryCardLeave = (el: HTMLButtonElement | null) => {
    if (!el) return;
    gsap.to(el, { y: 0, scale: 1, duration: 0.25, ease: 'power2.inOut' });
  };

  let content: React.ReactNode = null;

  if (selectedCategory === 'espresso') {
    content = (
      <div className="relative">
        <TopBackButton
          onClick={() => {
            if (espressoBackHandlerRef.current) {
              const handled = espressoBackHandlerRef.current();
              if (handled) return;
            }
            setSelectedCategory('none');
          }}
        />
        <EspressoView
          onRegisterBackHandler={(handler) => {
            espressoBackHandlerRef.current = handler;
          }}
        />
      </div>
    );
  } else if (selectedCategory === 'filter') {
    content = <FilterRecipeManager onBack={() => setSelectedCategory('none')} />;
  } else {
    content = (
      <div className="max-w-6xl mx-auto pb-32 animate-fade-in px-4 pt-8">
        <div className="space-y-2 mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">
            Recetas y Calibración
          </h1>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
            Gestiona tus perfiles de extracción y guías de preparación
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            ref={espressoCardRef}
            onClick={() => setSelectedCategory('espresso')}
            onMouseEnter={() => handleCategoryCardEnter(espressoCardRef.current)}
            onMouseLeave={() => handleCategoryCardLeave(espressoCardRef.current)}
            className="relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300 h-full text-left overflow-hidden"
          >
            <div className="w-full space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-stone-100 dark:bg-stone-800 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                  <Coffee className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300">
                  Calibración espresso
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-1">
                  Espresso
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Sesiones, recetas y diagnóstico
                </p>
              </div>

              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Control total de tus variables. Registra dosis, ratios, tiempos y notas de cata para cada origen.
              </p>
            </div>

            <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between group-hover:pl-2 transition-all">
              <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">
                Entrar
              </span>
              <ChevronRight className="w-4 h-4 text-black dark:text-white" />
            </div>
          </button>

          <button
            ref={filterCardRef}
            onClick={() => setSelectedCategory('filter')}
            onMouseEnter={() => handleCategoryCardEnter(filterCardRef.current)}
            onMouseLeave={() => handleCategoryCardLeave(filterCardRef.current)}
            className="relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300 h-full text-left overflow-hidden"
          >
            <div className="w-full space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-stone-100 dark:bg-stone-800 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                  <Filter className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300">
                  Métodos de filtrado
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-1">
                  Filtrados
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Recetas, guías y problemas comunes
                </p>
              </div>

              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Diseña y documenta cada vertido para tus métodos de filtrado manual, con sesiones guiadas y soporte.
              </p>
            </div>

            <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between group-hover:pl-2 transition-all">
              <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">
                Entrar
              </span>
              <ChevronRight className="w-4 h-4 text-black dark:text-white" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {content}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed z-[60] w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-stone-500/70 dark:border-stone-300/70 mix-blend-difference"
      />
    </div>
  );
};
