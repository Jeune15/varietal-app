import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Filter, ChevronRight, ArrowLeft, Eye, Trash2, X, FileDown, Plus, Coffee, Info, Search, Droplet, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { db } from '../db';
import { FilterSession, FilterRecipe, FilterPour, BrewMethod } from '../types';
import { StyledSelect } from '../components/StyledSelect';
import { gsap } from 'gsap';

const brewMethodOptions: { value: BrewMethod; label: string }[] = [
  { value: 'Filtro', label: 'Filtro' },
  { value: 'Inmersión', label: 'Inmersión' },
  { value: 'Hario Switch', label: 'Hario Switch' },
  { value: 'Aeropress', label: 'Aeropress' }
];

const pourTypeOptions = [
  { value: 'espiral', label: 'Espiral' },
  { value: 'central', label: 'Central' },
  { value: 'pulsar', label: 'Pulsar' },
  { value: 'lluvia', label: 'Lluvia' }
];

const aeropressPressureOptions = [
  { value: 'suave', label: 'Suave' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'fuerte', label: 'Fuerte' }
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
    <div className="bg-white dark:bg-stone-900 p-6 md:p-10 rounded-xl border border-stone-200 dark:border-stone-800 space-y-8">
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
                className={`px-3 py-1.5 rounded-xl border text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${
                  selectedMethodId === item.id
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-brand dark:hover:border-brand'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="min-h-[140px] rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 p-5 md:p-6">
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
                className={`px-3 py-1.5 rounded-xl border text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${
                  selectedToolId === item.id
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-brand dark:hover:border-brand'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="min-h-[140px] rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 p-5 md:p-6">
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
                className={`px-3 py-1.5 rounded-xl border text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${
                  selectedVariableId === variable.id
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-brand dark:hover:border-brand'
                }`}
              >
                {variable.name}
              </button>
            ))}
          </div>
          <div className="min-h-[140px] rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 p-5 md:p-6">
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
    <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-900 p-6 lg:p-10 space-y-10">
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="space-y-3">
            <h2 className="text-base md:text-lg font-black uppercase tracking-[0.25em] text-stone-900 dark:text-stone-100">
              Perfilación
            </h2>
            <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-3xl">
              Modelo causa–efecto y ajustes por objetivo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {profiling.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setOpenId(openId === item.id ? null : item.id)}
                className={`relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-950 hover:border-brand dark:hover:border-brand transition-all duration-300 h-full text-left overflow-hidden ${
                  openId === item.id ? 'ring-2 ring-brand dark:ring-brand scale-[1.01]' : ''
                }`}
              >
                <div className="w-full space-y-4 relative z-10 transition-all duration-300">
                  <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-2">
                    {item.title}
                  </h3>
                  
                  {openId === item.id ? (
                    <div className="space-y-4 animate-fade-in text-sm text-stone-600 dark:text-stone-400">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Síntoma</p>
                        {'symptomList' in item && Array.isArray((item as any).symptomList) ? (
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            {(item as any).symptomList.map((line: string, idx: number) => (
                              <li key={idx}>{line}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] leading-relaxed">{item.symptom}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1">Causa</p>
                        {'causeList' in item && Array.isArray((item as any).causeList) ? (
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            {(item as any).causeList.map((line: string, idx: number) => (
                              <li key={idx}>{line}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] leading-relaxed">{item.cause}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-1">Solución</p>
                        {'solutionList' in item && Array.isArray((item as any).solutionList) ? (
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            {(item as any).solutionList.map((line: string, idx: number) => (
                              <li key={idx}>{line}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] leading-relaxed">{item.solution}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-stone-500 line-clamp-3 leading-relaxed">
                      {'symptomList' in item && Array.isArray((item as any).symptomList)
                        ? (item as any).symptomList[0]
                        : item.symptom}
                    </p>
                  )}
                </div>
                <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between group-hover:pl-2 transition-all mt-auto z-10">
                  <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">
                    {openId === item.id ? 'Ocultar análisis' : 'Ver análisis'}
                  </span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${openId === item.id ? 'bg-brand text-white' : 'bg-stone-100 text-stone-400 dark:bg-stone-800'}`}>
                    <ChevronRight className={`w-3 h-3 transition-transform ${openId === item.id ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="pt-8 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-6">
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

            {problemSections.map((section, sIdx) => (
              <div key={section.id} className={`${sIdx > 0 ? 'mt-12' : ''}`}>
                <div className="mb-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand border-l-2 border-brand pl-3">
                    {section.label}
                  </p>
                  <p className="text-[11px] md:text-xs text-stone-500 mt-2 pl-3 leading-relaxed">
                    {section.description}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.items.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setOpenId(openId === item.id ? null : item.id)}
                      className={`relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 hover:border-brand dark:hover:border-brand transition-all duration-300 h-full text-left overflow-hidden ${
                        openId === item.id ? 'ring-2 ring-brand dark:ring-brand scale-[1.01]' : ''
                      }`}
                    >
                      <div className="w-full space-y-4 relative z-10 transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-black uppercase tracking-tight text-black dark:text-white leading-tight flex-1">
                            {item.title}
                          </h3>
                        </div>
                        
                        {openId === item.id ? (
                          <div className="space-y-4 animate-fade-in text-sm text-stone-600 dark:text-stone-400">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Síntoma</p>
                              {'symptomList' in item && Array.isArray((item as any).symptomList) ? (
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                  {(item as any).symptomList.map((line: string, idx: number) => (
                                    <li key={idx}>{line}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-[11px] leading-relaxed">{item.symptom}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1">Causa</p>
                              {'causeList' in item && Array.isArray((item as any).causeList) ? (
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                  {(item as any).causeList.map((line: string, idx: number) => (
                                    <li key={idx}>{line}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-[11px] leading-relaxed">{item.cause}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-1">Solución</p>
                              {'solutionList' in item && Array.isArray((item as any).solutionList) ? (
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                  {(item as any).solutionList.map((line: string, idx: number) => (
                                    <li key={idx}>{line}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-[11px] leading-relaxed">{item.solution}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-stone-500 line-clamp-3 leading-relaxed">
                            {'symptomList' in item && Array.isArray((item as any).symptomList)
                              ? (item as any).symptomList[0]
                              : item.symptom}
                          </p>
                        )}
                      </div>
                      <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between group-hover:pl-2 transition-all mt-auto z-10">
                        <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">
                          {openId === item.id ? 'Ocultar solución' : 'Ver solución'}
                        </span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${openId === item.id ? 'bg-brand text-white' : 'bg-stone-100 text-stone-400 dark:bg-stone-800'}`}>
                          <ChevronRight className={`w-3 h-3 transition-transform ${openId === item.id ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
                        </div>
                      </div>
                    </button>
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

export const FilterToolView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { showToast } = useToast();
  const [view, setView] = useState<'sessions' | 'guide' | 'troubleshoot'>('sessions');
  const [sessions, setSessions] = useState<FilterSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<FilterSession | null>(null);
  
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({ coffeeName: '', brewerName: '', coffeeOrigin: '', coffeeProcess: '', roastDate: '', method: 'Filtro' as BrewMethod, notes: '' });

  const [activeRecipe, setActiveRecipe] = useState<FilterRecipe | null>(null);
  const [pourForm, setPourForm] = useState({ minutes: '', seconds: '', volumeMl: '' });
  const [editingPourId, setEditingPourId] = useState<string | null>(null);
  
  const [summaryRecipe, setSummaryRecipe] = useState<FilterRecipe | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const all = await db.filterSessions.toArray();
      setSessions(all.filter(s => !s.deleted).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error("Error cargando sesiones", error);
    }
  };

  const handleCreateSession = async () => {
    if (!sessionForm.coffeeName.trim() || !sessionForm.brewerName.trim()) {
      showToast('Ingresa el nombre del café y del barista', 'error');
      return;
    }
    const newSession: FilterSession = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      date: new Date().toISOString(),
      brewerName: sessionForm.brewerName,
      coffeeName: sessionForm.coffeeName,
      coffeeOrigin: sessionForm.coffeeOrigin,
      coffeeProcess: sessionForm.coffeeProcess,
      roastDate: sessionForm.roastDate,
      recipes: [],
      notes: sessionForm.notes
    };
    
    try {
      await db.filterSessions.add(newSession);
      showToast('Sesión creada exitosamente', 'success');
      setIsCreatingSession(false);
      setSessionForm({ coffeeName: '', brewerName: '', coffeeOrigin: '', coffeeProcess: '', roastDate: '', method: 'Filtro', notes: '' });
      setSelectedSession(newSession);
      loadSessions();
    } catch (e) {
      showToast('Error al crear sesión', 'error');
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta sesión de filtrado?')) {
      const s = await db.filterSessions.get(id);
      if (s) {
        s.deleted = true;
        await db.filterSessions.put(s);
        if (selectedSession?.id === id) {
          setSelectedSession(null);
          setActiveRecipe(null);
        }
        loadSessions();
      }
    }
  };

  const handleCreateRecipe = () => {
    if (!selectedSession) return;
    const blankRecipe: FilterRecipe = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: `Receta ${selectedSession.recipes.length + 1}`,
      method: 'Filtro',
      doseGrams: 15,
      waterTempCelsius: 92,
      grinderModel: '',
      grinderClicks: null,
      totalWaterMl: 250,
      ratio: '1:16.7',
      totalTimeSeconds: 150,
      pressureBars: null,
      filterType: '',
      waterBrand: '',
      tasting: { flavor: '', aroma: '', body: '', acidity: '' },
      phases: [], 
      pours: [] 
    };
    setActiveRecipe(blankRecipe);
  };

  const handleDeleteRecipe = async (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedSession) return;
    if (confirm('¿Eliminar esta receta?')) {
      const updatedSession = { ...selectedSession };
      updatedSession.recipes = updatedSession.recipes.filter(r => r.id !== recipeId);
      await db.filterSessions.put(updatedSession);
      setSelectedSession(updatedSession);
      showToast('Receta eliminada', 'success');
      loadSessions();
    }
  };

  const handleSaveRecipe = async () => {
    if (!selectedSession || !activeRecipe) return;
    if (!activeRecipe.name.trim()) {
      showToast('La receta necesita un nombre', 'error');
      return;
    }
    const updatedSession = { ...selectedSession };
    const existingIdx = updatedSession.recipes.findIndex(r => r.id === activeRecipe.id);
    if (existingIdx >= 0) {
      updatedSession.recipes[existingIdx] = activeRecipe;
    } else {
      updatedSession.recipes.push(activeRecipe);
    }
    try {
      await db.filterSessions.put(updatedSession);
      setSelectedSession(updatedSession);
      setActiveRecipe(null);
      showToast('Receta guardada exitosamente', 'success');
      loadSessions();
    } catch (e) {
      showToast('Error al guardar la receta', 'error');
    }
  };

  const handleAddPour = () => {
    if (!activeRecipe) return;
    const mins = parseInt(pourForm.minutes || '0');
    const secs = parseInt(pourForm.seconds || '0');
    const vol = parseFloat(pourForm.volumeMl);
    
    if (isNaN(vol) || vol <= 0) {
      showToast('Ingresa un volumen válido', 'error');
      return;
    }

    const newPour: FilterPour = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      order: 1, // Will be recalculated
      timeSeconds: mins * 60 + secs,
      volumeMl: vol
    };
    
    const newPours = [...(activeRecipe.pours || [])];
    if (editingPourId) {
      const idx = newPours.findIndex(p => p.id === editingPourId);
      if (idx >= 0) {
        newPours[idx] = { ...newPours[idx], timeSeconds: newPour.timeSeconds, volumeMl: newPour.volumeMl };
      }
      setEditingPourId(null);
    } else {
      newPours.push(newPour);
    }
    
    newPours.sort((a,b) => a.timeSeconds - b.timeSeconds);
    newPours.forEach((p, i) => p.order = i + 1);
    
    setActiveRecipe({ ...activeRecipe, pours: newPours });
    setPourForm({ minutes: '', seconds: '', volumeMl: '' });
  };

  const handleEditPour = (pour: FilterPour) => {
    setEditingPourId(pour.id);
    setPourForm({
      minutes: Math.floor(pour.timeSeconds / 60).toString(),
      seconds: (pour.timeSeconds % 60).toString(),
      volumeMl: pour.volumeMl.toString()
    });
  };

  const handleDeletePour = (pourId: string) => {
    if (!activeRecipe) return;
    const newPours = (activeRecipe.pours || []).filter(p => p.id !== pourId);
    newPours.forEach((p, i) => p.order = i + 1);
    setActiveRecipe({ ...activeRecipe, pours: newPours });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Header Global ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-black font-sans selection:bg-brand/30 pb-32">
      {/* Header Container - Sticky */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="group p-2 -ml-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-400 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter text-stone-900 dark:text-stone-100">
                Filtrados
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hidden sm:block">
                Sesiones, recetas y parámetros
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto scrollbar-hide">
          {[
            { id: 'sessions', label: 'Sesiones' },
            { id: 'guide', label: 'Guía de calibración' },
            { id: 'troubleshoot', label: 'Problemas comunes' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setView(tab.id as 'sessions'|'guide'|'troubleshoot');
                if (tab.id !== 'sessions') {
                   setSelectedSession(null);
                   setActiveRecipe(null);
                }
              }}
              className={`pb-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${
                view === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-col lg:flex-row gap-6">
          {view === 'sessions' && !selectedSession && (
            <div className="w-full flex flex-col gap-6">
              {/* Toolbar top */}
              <div className="flex items-center justify-between bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                    <Filter className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
                      Mis Sesiones de Filtrado
                    </h2>
                    <p className="text-xs text-stone-500">
                      {sessions.length} sesiones registradas
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingSession(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nueva Sesión</span>
                </button>
              </div>

              {/* Crear Nueva Session Form inline (Card) */}
              {isCreatingSession && (
                <div className="bg-white dark:bg-stone-900 border border-brand/50 rounded-xl p-6 shadow-sm animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-brand">Crear Nueva Sesión</h3>
                    <button onClick={() => setIsCreatingSession(false)} className="text-stone-400 hover:text-stone-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Nombre del Barista</label>
                      <input 
                        type="text" 
                        value={sessionForm.brewerName} 
                        onChange={e => setSessionForm({...sessionForm, brewerName: e.target.value})} 
                        className="w-full border-b border-stone-200 dark:border-stone-800 bg-transparent py-2 text-xs font-bold focus:border-brand focus:outline-none transition-colors" 
                        placeholder="Ej. Tony"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Café (Marca / Nombre)</label>
                      <input 
                        type="text" 
                        value={sessionForm.coffeeName} 
                        onChange={e => setSessionForm({...sessionForm, coffeeName: e.target.value})} 
                        className="w-full border-b border-stone-200 dark:border-stone-800 bg-transparent py-2 text-xs font-bold focus:border-brand focus:outline-none transition-colors" 
                        placeholder="Ej. Finca El Paraíso"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Origen / Variedad</label>
                      <input 
                        type="text" 
                        value={sessionForm.coffeeOrigin} 
                        onChange={e => setSessionForm({...sessionForm, coffeeOrigin: e.target.value})} 
                        className="w-full border-b border-stone-200 dark:border-stone-800 bg-transparent py-2 text-xs font-bold focus:border-brand focus:outline-none transition-colors" 
                        placeholder="Ej. Geisha, Panamá"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Proceso</label>
                      <input 
                        type="text" 
                        value={sessionForm.coffeeProcess} 
                        onChange={e => setSessionForm({...sessionForm, coffeeProcess: e.target.value})} 
                        className="w-full border-b border-stone-200 dark:border-stone-800 bg-transparent py-2 text-xs font-bold focus:border-brand focus:outline-none transition-colors" 
                        placeholder="Ej. Lavado"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleCreateSession}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-brand text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-rose-600"
                    >
                      Comenzar Sesión <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Sesiones */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.length === 0 && !isCreatingSession && (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-stone-300 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-900/50">
                    <Filter className="w-10 h-10 text-stone-300 dark:text-stone-600 mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">Sin sesiones</p>
                    <p className="text-xs text-stone-400 mt-2 max-w-xs text-center">Crea tu primera sesión de filtrado para comenzar a registrar tus recetas y vertidos.</p>
                  </div>
                )}
                {sessions.map(s => (
                  <div
                    key={s.id}
                    className="group relative cursor-pointer flex flex-col justify-between p-5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-xl hover:shadow-md hover:border-brand/50 transition-all duration-300"
                    onClick={() => setSelectedSession(s)}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                          {new Date(s.date).toLocaleDateString()}
                        </div>
                        <button 
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 leading-tight mb-1">
                        {s.coffeeName}
                      </h3>
                      {s.coffeeOrigin && (
                        <p className="text-xs font-bold text-stone-500">{s.coffeeOrigin} {s.coffeeProcess ? `• ${s.coffeeProcess}` : ''}</p>
                      )}
                    </div>
                    <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-brand group-hover:translate-x-1 transition-transform">
                        {s.recipes?.length || 0} Recetas
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-stone-400">
                        <Coffee className="w-3 h-3" /> {s.brewerName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'sessions' && selectedSession && !activeRecipe && (
            <div className="w-full flex gap-6">
              {/* Sidebar: Coffee Details */}
              <div className="hidden lg:flex w-72 flex-col gap-4">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-brand transition-colors w-fit mb-2"
                >
                  <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Volver a Lista
                </button>
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 sticky top-24">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Detalles de la Sesión</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl font-black text-stone-900 dark:text-stone-100 mb-1">{selectedSession.coffeeName}</h4>
                      <p className="text-xs text-stone-500">{selectedSession.coffeeOrigin} {selectedSession.coffeeProcess ? `• ${selectedSession.coffeeProcess}` : ''}</p>
                    </div>
                    
                    <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                      <span className="text-stone-500 uppercase tracking-widest text-[10px] font-bold">Barista</span>
                      <span className="font-bold text-stone-900 dark:text-stone-100">{selectedSession.brewerName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 uppercase tracking-widest text-[10px] font-bold">Fecha</span>
                      <span className="font-bold text-stone-900 dark:text-stone-100">{new Date(selectedSession.date).toLocaleDateString()}</span>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleCreateRecipe}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95"
                      >
                         Nueva Receta
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content: Recipes list summary cards */}
              <div className="flex-1 space-y-4">
                <div className="lg:hidden flex justify-between items-center bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400"
                  >
                    <ArrowLeft className="w-3 h-3" /> Volver
                  </button>
                  <button
                    onClick={handleCreateRecipe}
                    className="text-[10px] font-bold uppercase tracking-[0.2em] bg-black text-white px-3 py-1.5 rounded-lg"
                  >
                    Nueva Receta
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                  {(!selectedSession.recipes || selectedSession.recipes.length === 0) ? (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white/50 dark:bg-stone-900/50 rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
                      <Droplet className="w-10 h-10 text-stone-300 dark:text-stone-600 mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">Empieza a perfilar</p>
                      <p className="text-xs text-stone-400 mt-2">No hay recetas guardadas en esta sesión aún.</p>
                      <button onClick={handleCreateRecipe} className="mt-4 text-xs font-bold uppercase tracking-widest text-brand hover:underline">Crear primera receta</button>
                    </div>
                  ) : (
                    selectedSession.recipes.map((r, i) => (
                      <div key={r.id} className="group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950/50">
                          <h4 className="font-black text-sm uppercase tracking-wider text-brand">{r.name}</h4>
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setActiveRecipe(r); }} className="p-1.5 rounded-lg text-stone-400 hover:text-brand hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors" title="Editar receta">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => handleDeleteRecipe(r.id, e)} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Eliminar receta">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-3 gap-2">
                             <div className="text-center bg-stone-50 dark:bg-stone-800/50 p-2 rounded-lg">
                               <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Ratio</p>
                               <p className="text-sm font-black text-stone-900 dark:text-stone-100">{r.ratio || `1:${Math.round(r.totalWaterMl / r.doseGrams)}`}</p>
                             </div>
                             <div className="text-center bg-stone-50 dark:bg-stone-800/50 p-2 rounded-lg">
                               <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Dosis</p>
                               <p className="text-sm font-black text-stone-900 dark:text-stone-100">{r.doseGrams}g</p>
                             </div>
                             <div className="text-center bg-stone-50 dark:bg-stone-800/50 p-2 rounded-lg">
                               <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Temp</p>
                               <p className="text-sm font-black text-stone-900 dark:text-stone-100">{r.waterTempCelsius}°</p>
                             </div>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 border-b border-stone-100 dark:border-stone-800 pb-1">Análisis sensorial</p>
                            <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 italic">
                              "{r.tasting.flavor || r.tasting.acidity || r.tasting.body || 'Ninguna nota ingresada'}"
                            </p>
                          </div>
                          
                          <button onClick={() => setSummaryRecipe(r)} className="w-full py-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                            Ver Reporte HD
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {view === 'sessions' && selectedSession && activeRecipe && (
            <div className="w-full flex flex-col gap-6 animate-fade-in pb-10">
              {/* Header Editor */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white dark:bg-stone-900 p-6 rounded-xl border border-brand/20">
                <div className="space-y-4 w-full sm:max-w-md">
                  <button 
                    onClick={() => setActiveRecipe(null)}
                    className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-brand transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                    Volver a sesión
                  </button>
                  <div className="space-y-1">
                    <input 
                      type="text"
                      className="text-2xl font-black uppercase tracking-tight text-brand bg-transparent border-b border-transparent hover:border-brand/30 focus:border-brand focus:outline-none w-full transition-colors"
                      value={activeRecipe.name}
                      onChange={e => setActiveRecipe({...activeRecipe, name: e.target.value})}
                      placeholder="Nombre de Receta"
                    />
                    <p className="text-xs text-stone-500 font-bold">{selectedSession.coffeeName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveRecipe}
                  className="w-full sm:w-auto mt-2 inline-flex items-center justify-center px-8 py-3 rounded-xl bg-black text-white dark:bg-stone-100 dark:text-stone-900 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-md"
                >
                  Guardar Cambios
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Column left: Recipe parameters */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Card: Metricas Base */}
                  <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-stone-900 dark:text-stone-100 mb-6 border-b border-stone-100 dark:border-stone-800 pb-2">
                       Parámetros de Extracción
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Agua Total (ml)</label>
                          <input 
                            type="number" value={activeRecipe.totalWaterMl} 
                            onChange={e => {
                               const v = parseFloat(e.target.value);
                               setActiveRecipe({...activeRecipe, totalWaterMl: v, ratio: `1:${Math.round(v / activeRecipe.doseGrams)}`});
                            }}
                            className="w-full border-b border-stone-200 dark:border-stone-800 bg-transparent py-2 text-sm font-bold focus:border-brand focus:outline-none transition-colors"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Dosis (g)</label>
                          <input 
                            type="number" value={activeRecipe.doseGrams} 
                            onChange={e => {
                               const v = parseFloat(e.target.value);
                               setActiveRecipe({...activeRecipe, doseGrams: v, ratio: `1:${Math.round(activeRecipe.totalWaterMl / v)}`});
                            }}
                            className="w-full border-b border-stone-200 dark:border-stone-800 bg-transparent py-2 text-sm font-bold focus:border-brand focus:outline-none transition-colors"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-brand">Ratio Sugerido</label>
                          <div className="w-full py-2 text-sm font-bold text-stone-900 dark:text-stone-100">
                             {activeRecipe.ratio || `1:${Math.round(activeRecipe.totalWaterMl / activeRecipe.doseGrams)}`}
                          </div>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Temperatura (°C)</label>
                          <input 
                            type="number" value={activeRecipe.waterTempCelsius} 
                            onChange={e => setActiveRecipe({...activeRecipe, waterTempCelsius: parseFloat(e.target.value)})}
                            className="w-full border-b border-stone-200 dark:border-stone-800 bg-transparent py-2 text-sm font-bold focus:border-brand focus:outline-none transition-colors"
                          />
                       </div>
                       <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Molino y Ajuste</label>
                          <input 
                            type="text" value={activeRecipe.grinderModel || ''} 
                            onChange={e => setActiveRecipe({...activeRecipe, grinderModel: e.target.value})}
                            placeholder="Ej. Comandante 24 clicks"
                            className="w-full border-b border-stone-200 dark:border-stone-800 bg-transparent py-2 text-sm font-bold focus:border-brand focus:outline-none transition-colors"
                          />
                       </div>
                       <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Método / Filtro</label>
                          <StyledSelect
                            value={activeRecipe.method}
                            onChange={e => setActiveRecipe({...activeRecipe, method: e.target.value as BrewMethod})}
                            options={[
                              { value: 'Filtro', label: 'Cono (V60, Chemex)' },
                              { value: 'Fondo Plano', label: 'Fondo Plano (Kalita, Oreo)' },
                              { value: 'Inmersión', label: 'Inmersión (Prensa, Clever)' },
                              { value: 'Aeropress', label: 'Aeropress / Presión' }
                            ]}
                            className="w-full mt-1"
                          />
                       </div>
                    </div>
                  </div>

                  {/* Card: Pours/Vertidos Timeline */}
                  <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6 border-b border-stone-100 dark:border-stone-800 pb-2">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <Droplet className="w-4 h-4 text-brand" /> Registro de Vertidos
                      </h3>
                      <span className="text-[11px] font-bold text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded">
                        Total {activeRecipe.pours?.reduce((acc, p) => acc + p.volumeMl, 0) || 0} / {activeRecipe.totalWaterMl} ml
                      </span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-end mb-6 bg-stone-50 dark:bg-stone-950 p-4 rounded-xl border border-stone-100 dark:border-stone-800">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Minutos</label>
                        <input type="number" min="0" value={pourForm.minutes} onChange={e => setPourForm({...pourForm, minutes: e.target.value})} className="w-full p-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:border-brand" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Segundos</label>
                        <input type="number" min="0" max="59" value={pourForm.seconds} onChange={e => setPourForm({...pourForm, seconds: e.target.value})} className="w-full p-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:border-brand" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Volumen (ml)</label>
                        <input type="number" min="1" value={pourForm.volumeMl} onChange={e => setPourForm({...pourForm, volumeMl: e.target.value})} className="w-full p-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:border-brand" />
                      </div>
                      <div className="w-full">
                        <button onClick={handleAddPour} className="w-full bg-brand hover:bg-rose-600 text-white p-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors">
                          {editingPourId ? "Guardar" : "+ Añadir"}
                        </button>
                      </div>
                    </div>

                    {(!activeRecipe.pours || activeRecipe.pours.length === 0) ? (
                      <div className="text-center py-8 text-xs text-stone-400">
                        Agrega al menos un vertido (ej. Bloom: 0:00 - 50ml) para armar tu línea de tiempo.
                      </div>
                    ) : (
                      <div className="space-y-3 relative">
                        <div className="absolute left-[34px] top-4 bottom-4 w-px bg-stone-200 dark:bg-stone-800"></div>
                        {activeRecipe.pours.map(pour => {
                          const accum = activeRecipe.pours!.filter(p => p.timeSeconds <= pour.timeSeconds).reduce((s, p) => s + p.volumeMl, 0);
                          return (
                            <div key={pour.id} className="relative pl-12">
                              <div className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-brand border-4 border-white dark:border-stone-900 z-10"></div>
                              <div className="flex items-center justify-between p-3 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-xl hover:border-brand/30 transition-colors group">
                                <div className="flex items-center gap-4">
                                  <span className="font-mono text-sm font-bold text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded">
                                    {formatTime(pour.timeSeconds)}
                                  </span>
                                  <div>
                                    <p className="font-bold text-sm text-stone-800 dark:text-stone-200">{pour.volumeMl} ml</p>
                                    <p className="text-[10px] text-stone-400 uppercase tracking-widest">Acumulado: {accum} ml</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleEditPour(pour)} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-brand px-2 py-1">Editar</button>
                                  <button onClick={() => handleDeletePour(pour.id)} className="text-stone-400 hover:text-red-500 font-bold p-1"><X className="w-4 h-4" /></button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Column right: Sensory notes */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-stone-950 text-white rounded-xl p-6 border border-stone-800">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-stone-100 mb-6 border-b border-stone-800 pb-2">
                       Evaluación Sensorial
                    </h3>
                    <div className="space-y-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Aroma</label>
                          <textarea 
                            value={activeRecipe.tasting.aroma} onChange={e => setActiveRecipe({...activeRecipe, tasting: {...activeRecipe.tasting, aroma: e.target.value}})}
                            placeholder="Frutas de hueso, jazmín..."
                            className="w-full bg-transparent border-b border-stone-800 py-2 text-sm focus:border-brand focus:outline-none transition-colors resize-none h-10"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Sabor (Flavor)</label>
                          <textarea 
                            value={activeRecipe.tasting.flavor} onChange={e => setActiveRecipe({...activeRecipe, tasting: {...activeRecipe.tasting, flavor: e.target.value}})}
                            placeholder="Miel, lima, té negro..."
                            className="w-full bg-transparent border-b border-stone-800 py-2 text-sm focus:border-brand focus:outline-none transition-colors resize-none h-10"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Acidez</label>
                          <textarea 
                            value={activeRecipe.tasting.acidity} onChange={e => setActiveRecipe({...activeRecipe, tasting: {...activeRecipe.tasting, acidity: e.target.value}})}
                            placeholder="Cítrica brillante, media alta..."
                            className="w-full bg-transparent border-b border-stone-800 py-2 text-sm focus:border-brand focus:outline-none transition-colors resize-none h-10"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Cuerpo</label>
                          <textarea 
                            value={activeRecipe.tasting.body} onChange={e => setActiveRecipe({...activeRecipe, tasting: {...activeRecipe.tasting, body: e.target.value}})}
                            placeholder="Sedoso, de té, ligero..."
                            className="w-full bg-transparent border-b border-stone-800 py-2 text-sm focus:border-brand focus:outline-none transition-colors resize-none h-10"
                          />
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-brand/20 bg-brand/5 rounded-xl text-xs text-stone-600 dark:text-stone-300">
                     <p className="font-bold mb-1 text-brand uppercase tracking-widest text-[10px]">Tip de perfilación</p>
                     Si sientes astringencia, reduce el tiempo de extracción (corta antes) o engruesa la molienda para reducir la capa superior de finos.
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Guides Rendering */}
        {view === 'guide' && (
          <div className="w-full">
            <FilterCalibrationGuide method="Filtro" />
          </div>
        )}

        {view === 'troubleshoot' && (
          <div className="w-full">
            <FilterTroubleshootingGuide method="Filtro" />
          </div>
        )}
      </div>

      {/* SUMMARY MODAL HD */}
      {summaryRecipe && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSummaryRecipe(null)}>
          <div className="bg-white dark:bg-stone-900 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-[0_30px_60px_#00000040] p-6 relative animate-in zoom-in-95 duration-200 border border-stone-200 dark:border-stone-800" onClick={e => e.stopPropagation()}>
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => setSummaryRecipe(null)} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                <X size={16} className="text-stone-600 dark:text-stone-400" />
              </button>
            </div>
            
            <div className="mb-6 mt-2 border-b border-stone-100 dark:border-stone-800 pb-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand">{selectedSession?.coffeeName}</p>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-stone-900 dark:text-stone-100 mt-2">
                {summaryRecipe.name}
              </h2>
              <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest">{selectedSession?.brewerName}</p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-3 text-center">Protocolo de Preparación</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-stone-50 dark:bg-stone-800/50 p-3 rounded-lg flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Dosis</span>
                    <span className="text-lg font-black text-stone-900 dark:text-stone-100">{summaryRecipe.doseGrams}g</span>
                  </div>
                  <div className="bg-stone-50 dark:bg-stone-800/50 p-3 rounded-lg flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Agua Total</span>
                    <span className="text-lg font-black text-stone-900 dark:text-stone-100">{summaryRecipe.totalWaterMl}ml</span>
                  </div>
                  <div className="bg-stone-50 dark:bg-stone-800/50 p-3 rounded-lg flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Temperatura</span>
                    <span className="text-lg font-black text-stone-900 dark:text-stone-100">{summaryRecipe.waterTempCelsius}°C</span>
                  </div>
                  <div className="bg-stone-50 dark:bg-stone-800/50 p-3 rounded-lg flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Ratio</span>
                    <span className="text-lg font-black text-stone-900 dark:text-stone-100">{summaryRecipe.ratio || `1:${Math.round(summaryRecipe.totalWaterMl / summaryRecipe.doseGrams)}`}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-3 text-center">Vertidos (Pours)</h3>
                {(!summaryRecipe.pours || summaryRecipe.pours.length === 0) ? (
                  <p className="text-center text-xs text-stone-500 bg-stone-50 dark:bg-stone-800/30 p-4 rounded-xl">Sin vertidos registrados.</p>
                ) : (
                  <div className="bg-stone-950 text-white rounded-xl divide-y divide-stone-800 border border-stone-800">
                    {summaryRecipe.pours.slice().sort((a,b)=>a.timeSeconds - b.timeSeconds).map((pour, i) => (
                      <div key={pour.id} className="flex justify-between items-center p-3 text-sm">
                        <span className="font-mono text-brand font-bold">{formatTime(pour.timeSeconds)}</span>
                        <div className="flex-1 text-center font-bold text-stone-200">
                          {pour.volumeMl} ml
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-stone-500">Vertido {i+1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(summaryRecipe.tasting.flavor || summaryRecipe.tasting.aroma || summaryRecipe.tasting.body || summaryRecipe.tasting.acidity) && (
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-3 text-center">Resultados de Cata</h3>
                  <div className="bg-amber-50 dark:bg-stone-800/30 border border-amber-100/50 dark:border-stone-800 rounded-xl p-4 text-xs space-y-2">
                    {summaryRecipe.tasting.aroma && <p><strong className="text-stone-500 dark:text-stone-400">Aroma:</strong> <span className="text-stone-900 dark:text-stone-200 font-medium">{summaryRecipe.tasting.aroma}</span></p>}
                    {summaryRecipe.tasting.flavor && <p><strong className="text-stone-500 dark:text-stone-400">Sabor:</strong> <span className="text-stone-900 dark:text-stone-200 font-medium">{summaryRecipe.tasting.flavor}</span></p>}
                    {summaryRecipe.tasting.acidity && <p><strong className="text-stone-500 dark:text-stone-400">Acidez:</strong> <span className="text-stone-900 dark:text-stone-200 font-medium">{summaryRecipe.tasting.acidity}</span></p>}
                    {summaryRecipe.tasting.body && <p><strong className="text-stone-500 dark:text-stone-400">Cuerpo:</strong> <span className="text-stone-900 dark:text-stone-200 font-medium">{summaryRecipe.tasting.body}</span></p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
