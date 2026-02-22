import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { createPortal } from 'react-dom';
import { 
  Book, 
  FileText, 
  PlayCircle, 
  CheckCircle, 
  ChevronRight, 
  ArrowLeft, 
  Clock, 
  AlertCircle,
  Link as LinkIcon,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Award,
  Image as ImageIcon,
  ChevronDown,
  ChevronLeft,
  Trash2,
  User,
  Eye,
  X
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, syncToCloud } from '../db';
import { ActivityHistory, HistoryRecord, Question } from '../components/ActivityHistory';

// --- Types ---

interface Topic {
  id: string;
  title: string;
  content: string; // Can be HTML/Markdown or just plain text with definitions
}

interface Exam {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  passingScore: number; // percentage
  durationMinutes: number;
}

interface Module {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  slides: string[]; // Paths to images
  topics: Topic[];
  exam: Exam;
}

// --- Helper to generate slide paths ---
const generateSlides = (start: number, end: number, prefix: string) => {
  const slides = [];
  for (let i = start; i <= end; i++) {
    slides.push(`${prefix}/${i}.jpg`);
  }
  return slides;
};

// --- Mock Data ---

const MOCK_MODULES: Module[] = [
  {
    id: 'mod-1',
    title: 'Módulo I',
    subtitle: 'Introducción al Café',
    description: 'Cambio del perfil del café durante la trazabilidad: Origen, Café Verde, Procesos, Tostado, Cata y Métodos de Extracción.',
    slides: generateSlides(2, 32, '/Modulo1'),
    topics: [
      {
        id: 't1-1',
        title: 'Origen',
        content: `• Etiopía
País africano reconocido como el lugar de origen del café, donde se descubrió la planta de manera natural.

• Yemen
Primer país en cultivar café comercialmente y exportarlo al mundo.

• Leyenda de Kaldi
Relato tradicional sobre un pastor etíope que notó los efectos estimulantes del café en sus cabras.`
      },
      {
        id: 't1-2',
        title: 'Variedades',
        content: `• Arábica
Especie de café de alta calidad, sabores complejos y menor cafeína.

• Canephora (Robusta)
Especie con mayor cafeína, sabor intenso y amargo.

• Altitud
Altura sobre el nivel del mar donde se cultiva el café; influye en su calidad.

• Perfil de sabor
Conjunto de características sensoriales que definen un café.

• Variedades
Tipos específicos dentro de una especie (ej. Bourbon, Typica).

• Resistencia a enfermedades
Capacidad de una planta de café para soportar plagas y climas adversos.

• Calidad del grano
Nivel de excelencia determinado por su origen, variedad y tratamiento.`
      },
      {
        id: 't1-3',
        title: 'Proceso',
        content: `• Proceso lavado
Método donde se retira la pulpa con agua, generando cafés limpios y brillantes.

• Proceso natural
Secado del grano con la pulpa intacta, aportando sabores frutales intensos.

• Proceso honey
Proceso intermedio donde parte del mucílago permanece en el grano.

• Cosecha
Recolección del fruto maduro del café.

• Despulpado
Eliminación de la cáscara externa del fruto.

• Fermentación
Etapa donde se descomponen azúcares para desarrollar sabor.

• Secado
Reducción de la humedad del grano para su conservación.

• Trillado
Eliminación de la cáscara seca del grano.

• Grano verde
Estado del café antes del tueste.

• Influencia del proceso en el sabor
Relación directa entre el proceso y el perfil final del café.`
      },
      {
        id: 't1-4',
        title: 'Tueste',
        content: `• Perfil claro
Resalta acidez y sabores originales del café.

• Perfil medio
Equilibrio entre acidez, cuerpo y dulzor.

• Perfil oscuro
Sabores intensos, amargos y ahumados.

• Secado
Etapa del tueste donde se retira la humedad del grano.

• Reacción de Maillard
Proceso químico que genera aromas y sabores complejos.

• Primer crack
Sonido que indica el inicio del desarrollo del grano.

• Segundo crack
Indica un tueste más oscuro y aceitoso.

• Desarrollo del tueste
Tiempo posterior al primer crack donde se define el sabor.

• Control de temperatura
Factor clave para un tueste uniforme.

• Perfil de tueste
Plan de tiempo y temperatura aplicado al grano.

• Influencia del tueste en el sabor
Impacto directo del tueste en aroma y gusto final.`
      },
      {
        id: 't1-5',
        title: 'Cata',
        content: `• Cupping
Método estandarizado de cata de café.

• Fragancia
Aroma del café molido en seco.

• Aroma
Olor del café al entrar en contacto con el agua.

• Sabor
Percepción general del gusto del café.

• Postgusto
Sensación que permanece después de beber.

• Acidez
Sensación brillante y fresca en el café, no relacionada con el pH.

• Cuerpo
Sensación de peso o textura del café en la boca.

• Dulzor
Sabor agradable generado por azúcares presentes en el grano.

• Balance
Armonía entre los atributos del café.

• Defectos
Sabores indeseados en el café.

• Rueda de sabores
Herramienta para identificar notas sensoriales.

• Puntaje de cata
Evaluación numérica de la calidad del café.

• Evaluación sensorial
Análisis de las características del café mediante los sentidos.`
      },
      {
        id: 't1-6',
        title: 'Métodos de extracción',
        content: `• Extracción
Proceso de disolver compuestos del café con agua.

• Extracción por presión
Uso de presión para obtener café concentrado (espresso).

• Extracción por inmersión
Contacto prolongado entre café y agua (prensa francesa).

• Extracción por goteo
Paso del agua por gravedad a través del café.

• Tiempo de extracción
Duración del contacto agua-café.

• Molienda
Grado de tamaño del café molido.

• Relación café-agua
Proporción usada para preparar café.`
      }
    ],
    exam: {
      id: 'ex-1',
      title: 'Examen Teórico Módulo I',
      description: 'Evaluación integral sobre la trazabilidad del café, desde el origen y la botánica hasta el análisis sensorial.',
      passingScore: 80,
      durationMinutes: 20,
      questions: [
        {
          id: 'q1-1',
          text: '¿Por qué la altitud influye directamente en la calidad sensorial del café?',
          options: ['Porque aumenta el tamaño del grano', 'Porque acelera la maduración del fruto', 'Porque ralentiza la maduración y favorece mayor complejidad de sabores', 'Porque reduce la acidez natural'],
          correctAnswer: 2
        },
        {
          id: 'q1-2',
          text: '¿Qué rango de altitud es más común para cafés arábica de especialidad?',
          options: ['300–600 msnm', '600–900 msnm', '900–1,200 msnm', '1,200–2,000 msnm'],
          correctAnswer: 3
        },
        {
          id: 'q1-3',
          text: 'El concepto de “terroir” en el café hace referencia a:',
          options: ['El perfil de tueste', 'El método de extracción', 'Las condiciones ambientales y humanas del origen', 'El tipo de molienda'],
          correctAnswer: 2
        },
        {
          id: 'q1-4',
          text: '¿Cuál es una diferencia clave entre café Arábica y Robusta?',
          options: ['El color del grano', 'El contenido de cafeína', 'El proceso utilizado', 'El nivel de tueste'],
          correctAnswer: 1
        },
        {
          id: 'q1-5',
          text: 'Bourbon, Typica y Caturra son:',
          options: ['Especies de café', 'Métodos de proceso', 'Variedades botánicas de Arábica', 'Defectos del grano'],
          correctAnswer: 2
        },
        {
          id: 'q1-6',
          text: '¿Qué característica es común en la variedad Geisha?',
          options: ['Amargor intenso y cuerpo alto', 'Perfil terroso y especiado', 'Notas florales, tipo té y alta complejidad aromática', 'Bajo nivel aromático'],
          correctAnswer: 2
        },
        {
          id: 'q1-7',
          text: '¿Cuál es una consecuencia común de una fermentación mal controlada en el café?',
          options: ['Mayor dulzor y limpieza en taza', 'Desarrollo de sabores defectuosos como avinagrado o alcohólico', 'Reducción total de la acidez', 'Incremento de notas florales'],
          correctAnswer: 1
        },
        {
          id: 'q1-8',
          text: '¿Qué proceso de café suele generar mayor cuerpo y dulzor percibido?',
          options: ['Lavado', 'Natural', 'Despulpado sin fermentación', 'Industrial'],
          correctAnswer: 1
        },
        {
          id: 'q1-9',
          text: '¿Qué caracteriza de forma general al proceso lavado?',
          options: ['Mayor fermentación y cuerpo', 'Secado del café con toda la cereza', 'Eliminación del mucílago antes del secado, generando mayor limpieza en taza', 'Uso de miel durante el secado'],
          correctAnswer: 2
        },
        {
          id: 'q1-10',
          text: '¿Cuál es la función principal de la etapa de secado durante el tueste?',
          options: ['Desarrollar aromas', 'Caramelizar azúcares', 'Eliminar la humedad del grano', 'Provocar el primer crack'],
          correctAnswer: 2
        },
        {
          id: 'q1-11',
          text: 'Durante la etapa de caramelización (reacciones de Maillard) en el tueste ocurre principalmente:',
          options: ['Evaporación del agua residual', 'Formación de compuestos aromáticos y precursores de sabor', 'Liberación intensa de CO₂', 'Carbonización inmediata del grano'],
          correctAnswer: 1
        },
        {
          id: 'q1-12',
          text: '¿Qué efecto suele tener un tiempo de desarrollo excesivo después del primer crack?',
          options: ['Mayor acidez', 'Mayor claridad', 'Sabores planos y amargos', 'Incremento de notas florales'],
          correctAnswer: 2
        },
        {
          id: 'q1-13',
          text: '¿Cuál es el propósito de usar una molienda gruesa y uniforme en la cata?',
          options: ['Aumentar la extracción', 'Intensificar el aroma', 'Garantizar consistencia entre muestras', 'Reducir el tiempo de preparación'],
          correctAnswer: 2
        },
        {
          id: 'q1-14',
          text: '¿Cuál de los siguientes defectos del café verde es inaceptable encontrar en un café tostado según estándares de calidad?',
          options: ['Grano quebrado', 'Grano inmaduro', 'Moho', 'Diferencia de tamaño'],
          correctAnswer: 2
        },
        {
          id: 'q1-15',
          text: '¿Cuál de los siguientes NO se considera un atributo positivo en una cata SCA?',
          options: ['Dulzor', 'Balance', 'Astringencia intensa', 'Limpieza de taza'],
          correctAnswer: 2
        },
        {
          id: 'q1-16',
          text: '¿Qué método de preparación corresponde a una extracción por presión?',
          options: ['Prensa francesa', 'V60', 'Espresso', 'Cold brew'],
          correctAnswer: 2
        },
        {
          id: 'q1-17',
          text: '¿Qué método de preparación se basa en la inmersión total del café en agua?',
          options: ['V60', 'Chemex', 'Prensa francesa', 'Kalita Wave'],
          correctAnswer: 2
        },
        {
          id: 'q1-18',
          text: '¿Qué molienda es más adecuada para métodos de filtrado manual?',
          options: ['Muy fina', 'Fina', 'Media a media-gruesa', 'Muy gruesa'],
          correctAnswer: 2
        },
        {
          id: 'q1-19',
          text: '¿Cuál de las siguientes es una nota caramelizada según la rueda de sabores SCA?',
          options: ['Jazmín', 'Limón', 'Caramelo', 'Hierba fresca'],
          correctAnswer: 2
        },
        {
          id: 'q1-20',
          text: '¿Qué ratio café–agua se utiliza comúnmente en la cata (cupping) según SCA?',
          options: ['1:10', '1:14', '1:18', '1:20'],
          correctAnswer: 2
        }
      ]
    }
  },
  {
    id: 'mod-2',
    title: 'Módulo II',
    subtitle: 'Espresso y Barismo',
    description: 'Principios de extracción, espresso, correcto uso de equipos, flujo de trabajo, variables y calibración.',
    slides: generateSlides(33, 50, '/Modulo2'),
    topics: [
      {
        id: 't2-1',
        title: 'Principios del Espresso',
        content: 'El espresso es una bebida concentrada preparada forzando agua caliente a alta presión a través de café finamente molido.'
      },
      {
        id: 't2-2',
        title: 'Variables de Extracción',
        content: 'Las variables críticas son: Dosis (cantidad de café seco), Ratio (relación café/agua), Tiempo de extracción, Temperatura del agua y Molienda.'
      },
      {
        id: 't2-3',
        title: 'Maquinaria y Molino',
        content: 'Componentes principales de la máquina de espresso y la importancia de una molienda consistente.'
      },
      {
        id: 't2-4',
        title: 'Técnica de Barista',
        content: 'Pasos para una correcta preparación: Purga, Secado, Molienda, Nivelación, Compactación (Tamping) y Extracción.'
      },
      {
        id: 't2-5',
        title: 'Bebidas con Leche',
        content: 'Técnicas de texturización de leche para Cappuccino, Latte y Flat White.'
      }
    ],
    exam: {
      id: 'ex-2',
      title: 'Examen Teórico Módulo II',
      description: 'Evaluación técnica profunda sobre extracción de espresso, calibración, texturización y mantenimiento.',
      passingScore: 80,
      durationMinutes: 20,
      questions: [
        {
          id: 'q2-1',
          text: '¿Cuál es la definición técnica de "Ratio" en la preparación de espresso?',
          options: ['La relación entre café molido (dosis) y peso final de la bebida líquida', 'La relación entre agua y leche', 'La presión de la bomba vs la caldera', 'El tiempo de extracción vs la temperatura'],
          correctAnswer: 0
        },
        {
          id: 'q2-2',
          text: 'Si un espresso sabe agrio, salado y carece de cuerpo, ¿qué diagnóstico es el más probable?',
          options: ['Sobre-extracción', 'Sub-extracción', 'Extracción ideal', 'Café quemado'],
          correctAnswer: 1
        },
        {
          id: 'q2-3',
          text: 'Para corregir una Sub-extracción (flujo muy rápido), ¿qué ajuste debemos hacer en el molino?',
          options: ['Engrosar la molienda (hacerla más gruesa)', 'Afinar la molienda (hacerla más fina)', 'Mantener la molienda igual', 'Reducir la dosis drásticamente'],
          correctAnswer: 1
        },
        {
          id: 'q2-4',
          text: '¿Qué es el "Channeling" o canalización?',
          options: ['Un método de vertido', 'El paso uniforme del agua por la pastilla', 'El paso del agua por caminos de menor resistencia, causando extracción desigual', 'El drenaje de la bandeja'],
          correctAnswer: 2
        },
        {
          id: 'q2-5',
          text: '¿Cuál es la temperatura ideal aproximada para la leche texturizada (cremada)?',
          options: ['40°C - 50°C', '60°C - 65°C', '80°C - 90°C', '100°C (Ebullición)'],
          correctAnswer: 1
        },
        {
          id: 'q2-6',
          text: '¿Qué fase de la texturización de leche es responsable de crear la microespuma?',
          options: ['La fase de estiramiento (introducción de aire) al inicio', 'La fase de calentamiento final', 'El vertido en la taza', 'El reposo de la leche'],
          correctAnswer: 0
        },
        {
          id: 'q2-7',
          text: '¿Por qué es importante purgar la lanza de vapor antes y después de usarla?',
          options: ['Para gastar vapor', 'Para eliminar condensación (agua) y residuos de leche', 'Para calentar la cocina', 'No es importante'],
          correctAnswer: 1
        },
        {
          id: 'q2-8',
          text: 'En una receta de espresso de 1:2 con 18g de dosis, ¿cuánto debería pesar el líquido final?',
          options: ['18g', '30g', '36g', '60g'],
          correctAnswer: 2
        },
        {
          id: 'q2-9',
          text: '¿Qué componente de la máquina es responsable de limitar la presión máxima de extracción (usualmente a 9 bares)?',
          options: ['La caldera', 'La válvula OPV (Over Pressure Valve)', 'El portafiltro', 'La ducha'],
          correctAnswer: 1
        },
        {
          id: 'q2-10',
          text: '¿Cuál es el propósito del "Backflush" o retrolavado con detergente ciego?',
          options: ['Limpiar los conductos internos del grupo y la válvula de tres vías', 'Limpiar la caldera de vapor', 'Descalcificar toda la máquina', 'Limpiar la bandeja de goteo'],
          correctAnswer: 0
        }
      ]
    }
  }
];

// --- Components ---

// --- Components ---

const Slideshow: React.FC<{ slides: string[] }> = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  // Reset error state when slide changes
  useEffect(() => {
    setImgError(false);
  }, [currentIndex]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (!slides || slides.length === 0) return null;

  return (
    <div className="mb-8 group relative rounded-xl overflow-hidden shadow-lg bg-stone-100 dark:bg-stone-900 aspect-video">
      <div className="absolute inset-0 flex items-center justify-center bg-stone-200 dark:bg-stone-800">
          {imgError ? (
            <div className="flex flex-col items-center justify-center text-stone-400 p-8 text-center">
               <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
               <p className="text-sm font-bold uppercase tracking-widest">Imagen no disponible</p>
               <p className="text-xs mt-1">Slide {currentIndex + 1}</p>
            </div>
          ) : (
            <img 
              src={slides[currentIndex]} 
              alt={`Slide ${currentIndex + 1}`} 
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
            />
          )}
      </div>
      
      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm opacity-100 lg:opacity-0 lg:group-hover:opacity-100 duration-300"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm opacity-100 lg:opacity-0 lg:group-hover:opacity-100 duration-300"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Counter */}
      <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
        {currentIndex + 1} / {slides.length}
      </div>
    </div>
  );
};

const TopicAccordion: React.FC<{ topics: Topic[] }> = ({ topics }) => {
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);

  const toggleTopic = (id: string) => {
    setOpenTopicId(prev => prev === id ? null : id);
  };

  const renderContent = (content: string) => {
    const blocks = content.split('\n\n');
    const hasBullets = blocks.some(b => b.trim().startsWith('•'));
  
    if (hasBullets) {
      return (
        <ul className="space-y-3 list-none">
          {blocks.map((block, i) => {
            const lines = block.split('\n');
            const titleLine = lines.find(l => l.trim().startsWith('•'));
            
            if (titleLine) {
              const title = titleLine.replace('•', '').trim();
              const desc = lines.filter(l => l !== titleLine).join(' ').trim();
              return (
                <li key={i} className="text-stone-600 dark:text-stone-300 leading-relaxed">
                  <strong className="font-bold text-stone-900 dark:text-stone-100">{title}:</strong> {desc}
                </li>
              );
            }
            return (
               <li key={i} className="text-stone-600 dark:text-stone-300 leading-relaxed">
                 {block}
               </li>
            );
          })}
        </ul>
      );
    }
  
    // Fallback for simple paragraphs
    return (
      <div className="space-y-4">
        {blocks.map((block, i) => (
          <p key={i} className="text-stone-600 dark:text-stone-300 leading-relaxed">
            {block}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {topics.map((topic) => (
        <div 
          key={topic.id} 
          className="bg-white dark:bg-stone-800 rounded-lg shadow-sm overflow-hidden border border-stone-100 dark:border-stone-700 transition-all duration-300"
        >
          <button
            onClick={() => toggleTopic(topic.id)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors ${openTopicId === topic.id ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-700 dark:text-stone-400'}`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-stone-800 dark:text-stone-100">
                {topic.title}
              </span>
            </div>
            <ChevronDown 
              className={`w-5 h-5 text-stone-400 transition-transform duration-500 ${openTopicId === topic.id ? 'rotate-180' : ''}`} 
            />
          </button>
          
          <div 
            className={`transition-all duration-700 ease-in-out overflow-hidden ${openTopicId === topic.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="p-4 pt-0 border-t border-stone-100 dark:border-stone-700/50">
              <div className="mt-4 p-4 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-100 dark:border-stone-700/50">
                {renderContent(topic.content)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ModuleList: React.FC<{ onSelect: (m: Module) => void; history: HistoryRecord[]; onDeleteHistory: (id: string) => void }> = ({ onSelect, history, onDeleteHistory }) => {

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-32 animate-fade-in">
      <div className="space-y-2 mb-8">
        <h3 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Módulos</h3>
        <p className="text-[11px] md:text-xs font-bold text-stone-400 uppercase tracking-widest">
          Material educativo y recursos
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_MODULES.map((mod, i) => {
          return (
            <button 
              key={mod.id} 
              onClick={() => onSelect(mod)}
              className="relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md h-full text-left"
            >
              <div className="w-full space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-stone-100 dark:bg-stone-800 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300">
                    {mod.topics.length + (mod.slides?.length || 0)} Recursos
                  </span>
                </div>
                
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-1">{mod.title}</h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{mod.subtitle}</p>
                </div>
                
                <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-3 font-medium">
                  {mod.description}
                </p>
              </div>

              <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between group-hover:pl-2 transition-all">
                 <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">
                    Ver Módulo
                 </span>
                 <ArrowRight className="w-4 h-4 text-black dark:text-white" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-4 pt-8 border-t border-stone-100 dark:border-stone-800">
        <h3 className="text-xl font-black text-black dark:text-white tracking-tighter uppercase">Historial de Actividades</h3>
        
        <ActivityHistory history={history} onDelete={onDeleteHistory} />
      </div>
    </div>
  );
};

const ExamView: React.FC<{ exam: Exam; onComplete: (record: HistoryRecord) => void; onCancel: () => void }> = ({ exam, onComplete, onCancel }) => {
  const [studentName, setStudentName] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(exam.questions.length).fill(-1));
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Update timeLeft if exam duration changes and exam hasn't started
  useEffect(() => {
    if (!isStarted) {
      setTimeLeft(exam.durationMinutes * 60);
    }
  }, [exam.durationMinutes, isStarted]);

  useEffect(() => {
    if (!isStarted || isFinished) return;

    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isStarted, isFinished]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentName.trim()) {
      setIsStarted(true);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((ans, idx) => {
      if (ans === exam.questions[idx].correctAnswer) correct++;
    });
    return (correct / exam.questions.length) * 100;
  };

  const handleSubmit = () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setIsFinished(true);
  };

  const handleFinalize = () => {
    const record: HistoryRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      studentName,
      examTitle: exam.title,
      score,
      passed: score >= exam.passingScore,
      answers,
      questions: exam.questions
    };
    onComplete(record);
  };

  const handleExitRequest = () => {
    if (isStarted && !isFinished) {
      setShowExitConfirm(true);
    } else {
      onCancel();
    }
  };

  // Portal Content for Full Screen Focus Mode
  const renderContent = () => {
    if (!isStarted) {
      return (
        <div className="fixed inset-0 z-[500] bg-white dark:bg-stone-950 overflow-y-auto flex items-center justify-center p-4 animate-fade-in">
           <div className="absolute top-4 right-4">
              <button 
                 onClick={onCancel}
                 className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                 <X className="w-6 h-6 text-stone-500" />
              </button>
           </div>
           <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-xl p-8 border border-stone-200 dark:border-stone-800 shadow-lg">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-stone-500" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">Datos del Alumno</h3>
              <p className="text-sm text-stone-500 mt-2">Ingresa tu nombre para comenzar el examen</p>
            </div>
            
            <form onSubmit={handleStart} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!studentName.trim()}
                  className="flex-1 px-4 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Comenzar ({exam.durationMinutes} min)
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    if (isFinished) {
      const passed = score >= exam.passingScore;
      return (
        <div className="fixed inset-0 z-[500] bg-white dark:bg-stone-950 overflow-y-auto animate-fade-in flex flex-col items-center justify-center p-4">
          <div className="max-w-2xl w-full text-center space-y-8">
            <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${passed ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
               {passed ? <Award className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
            </div>
            
            <div className="space-y-2">
                <h2 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-white">
                    {passed ? '¡Aprobado!' : 'No Aprobado'}
                </h2>
                <p className="text-lg font-medium text-stone-600 dark:text-stone-400">
                    Calificación: <span className={`font-bold ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{score.toFixed(0)}%</span>
                </p>
                <p className="text-sm text-stone-500">
                    Alumno: {studentName}
                </p>
            </div>

            <div className="flex justify-center gap-4 pt-8">
                {!passed && (
                    <button 
                        onClick={() => {
                            setIsFinished(false);
                            setIsStarted(false);
                            setCurrentQuestionIndex(0);
                            setAnswers(new Array(exam.questions.length).fill(-1));
                            setTimeLeft(exam.durationMinutes * 60);
                        }}
                        className="px-6 py-3 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" /> Reintentar
                    </button>
                )}
                <button 
                    onClick={handleFinalize}
                    className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
                >
                    Guardar y Salir
                </button>
            </div>
          </div>
        </div>
      );
    }

    const question = exam.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === exam.questions.length - 1;
    const hasAnswered = answers[currentQuestionIndex] !== -1;

    return (
      <div className="fixed inset-0 z-[500] bg-white dark:bg-stone-950 overflow-y-auto animate-fade-in">
        <div className="max-w-3xl mx-auto py-8 px-4 min-h-screen flex flex-col">
          {/* Header with Exit Button */}
          <div className="flex justify-between items-center mb-8">
             <div className="flex items-center gap-2 text-stone-400">
                <Clock className="w-4 h-4" />
                <span className={`text-xs font-bold uppercase tracking-widest ${timeLeft < 60 ? 'text-red-500 animate-pulse' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
             </div>
             <button 
                onClick={handleExitRequest}
                className="text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1"
             >
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Salir</span>
                <X className="w-5 h-5" />
             </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 bg-stone-100 dark:bg-stone-800 mb-8 rounded-full overflow-hidden">
              <div 
                  className="h-full bg-black dark:bg-white transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / exam.questions.length) * 100}%` }}
              />
          </div>

          <div className="flex-1 flex flex-col pb-40 md:pb-32">
             <div className="mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-stone-400">
                    Pregunta {currentQuestionIndex + 1} de {exam.questions.length}
                </span>
             </div>

             <div className="space-y-8 mb-12">
                <h3 className="text-2xl md:text-4xl font-bold text-black dark:text-white leading-tight">
                    {question.text}
                </h3>

                <div className="space-y-3">
                    {question.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                                answers[currentQuestionIndex] === idx
                                    ? 'border-black dark:border-white bg-stone-50 dark:bg-stone-900'
                                    : 'border-stone-100 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                            }`}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                answers[currentQuestionIndex] === idx
                                    ? 'border-black dark:border-white'
                                    : 'border-stone-300 dark:border-stone-600'
                            }`}>
                                {answers[currentQuestionIndex] === idx && (
                                    <div className="w-3 h-3 rounded-full bg-black dark:bg-white" />
                                )}
                            </div>
                            <span className="font-medium text-lg text-stone-700 dark:text-stone-300">{option}</span>
                        </button>
                    ))}
                </div>
             </div>
          </div>

          <div className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-t border-stone-100 dark:border-stone-800 p-4 pb-8 md:pb-4 safe-area-pb z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <div className="max-w-3xl mx-auto flex flex-col gap-2">
                  {!hasAnswered && (
                      <p className="text-center text-xs font-bold text-amber-600 dark:text-amber-500 animate-pulse uppercase tracking-widest">
                          Selecciona una respuesta para continuar
                      </p>
                  )}
                  <div className="flex justify-between items-center gap-4">
                      <button
                          disabled={currentQuestionIndex === 0}
                          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                          className="px-6 py-3 text-stone-500 font-bold uppercase tracking-widest text-xs disabled:opacity-30 hover:text-black dark:hover:text-white transition-colors"
                      >
                          Anterior
                      </button>
                      
                      {isLastQuestion ? (
                          <button
                              disabled={!hasAnswered}
                              onClick={handleSubmit}
                              className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                          >
                              Terminar Examen
                          </button>
                      ) : (
                          <button
                              disabled={!hasAnswered}
                              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                              className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                          >
                              Siguiente
                          </button>
                      )}
                  </div>
              </div>
          </div>
        </div>
      </div>
    );
  };

  return createPortal(
    <>
      {renderContent()}
      
      {/* Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl p-6 max-w-sm w-full border border-stone-200 dark:border-stone-800 transform scale-100 transition-all">
            <h3 className="text-xl font-black uppercase tracking-tight mb-2 text-black dark:text-white">
              ¿Salir del examen?
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-6 font-medium">
              Si sales ahora, se perderá todo el progreso y tendrás que comenzar de nuevo.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-3 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                Continuar Examen
              </button>
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-red-700 transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

const ModuleDetail: React.FC<{ module: Module, onBack: () => void, onExamComplete: (record: HistoryRecord) => void }> = ({ module, onBack, onExamComplete }) => {
  const [activeTab, setActiveTab] = useState<'materials' | 'exam'>('materials');
  const [showExam, setShowExam] = useState(false);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!cursorRef.current) return;
      gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.2, ease: 'power3.out' });
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  if (showExam) {
    return <ExamView exam={module.exam} onComplete={onExamComplete} onCancel={() => setShowExam(false)} />;
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 relative">
      <button
        onClick={onBack}
        className="fixed top-4 md:top-6 left-4 md:left-8 z-[200] inline-flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm rounded-lg border border-stone-200 dark:border-stone-800 shadow-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-[11px] font-bold uppercase tracking-widest text-stone-600 dark:text-stone-300"
        aria-label="Volver"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver</span>
      </button>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-stone-100 font-serif mb-2">{module.title}</h2>
        <p className="text-lg md:text-xl text-stone-600 dark:text-stone-400 mb-4">{module.subtitle}</p>
        <p className="text-stone-500 dark:text-stone-500 leading-relaxed">{module.description}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 mb-8">
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex-1 text-center pb-4 px-2 md:px-4 font-bold text-xs md:text-sm tracking-wider uppercase transition-colors relative ${
            activeTab === 'materials' 
              ? 'text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100' 
              : 'text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400'
          }`}
        >
          Material de Estudio
        </button>
        <button
          onClick={() => setActiveTab('exam')}
          className={`flex-1 text-center pb-4 px-2 md:px-4 font-bold text-xs md:text-sm tracking-wider uppercase transition-colors relative ${
            activeTab === 'exam' 
              ? 'text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100' 
              : 'text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400'
          }`}
        >
          Examen y Certificación
        </button>
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'materials' ? (
          <div className="space-y-8">
            {/* Slideshow Section */}
            {module.slides && module.slides.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-purple-500" />
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Diapositivas del Módulo</h3>
                </div>
                <Slideshow slides={module.slides} />
              </section>
            )}

            {/* Topics Accordion Section */}
            {module.topics && module.topics.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Book className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Palabras clave</h3>
                </div>
                <TopicAccordion topics={module.topics} />
              </section>
            )}
            
            {/* Fallback for empty content */}
            {(!module.slides?.length && !module.topics?.length) && (
               <div className="text-center py-12 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-dashed border-stone-300 dark:border-stone-700">
                 <p className="text-stone-500 dark:text-stone-400">El material de este módulo estará disponible pronto.</p>
               </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-xl p-8 border border-stone-200 dark:border-stone-800 shadow-sm text-center">
             <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-10 h-10 text-stone-400 dark:text-stone-500" />
             </div>
             <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">{module.exam.title}</h3>
             <p className="text-stone-600 dark:text-stone-400 max-w-lg mx-auto mb-8">{module.exam.description}</p>
             
             <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8 text-left">
                <div className="bg-stone-50 dark:bg-stone-800 p-4 rounded-lg">
                   <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-1 text-sm font-medium uppercase tracking-wider">
                      <Clock className="w-4 h-4" /> Duración
                   </div>
                   <p className="text-lg font-bold text-stone-900 dark:text-stone-100">{module.exam.durationMinutes} min</p>
                </div>
                <div className="bg-stone-50 dark:bg-stone-800 p-4 rounded-lg">
                   <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-1 text-sm font-medium uppercase tracking-wider">
                      <CheckCircle className="w-4 h-4" /> Aprobar
                   </div>
                   <p className="text-lg font-bold text-stone-900 dark:text-stone-100">{module.exam.passingScore}%</p>
                </div>
             </div>

             <button 
                onClick={() => setShowExam(true)}
                className="inline-flex items-center px-8 py-4 bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-lg font-bold tracking-wide transition-all hover:scale-105 active:scale-95 shadow-lg"
             >
                <PlayCircle className="w-5 h-5 mr-2" />
                Comenzar Examen
             </button>
          </div>
        )}
      </div>
      <div
        ref={cursorRef}
        className="pointer-events-none fixed z-[60] w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-stone-500/70 dark:border-stone-300/70 mix-blend-difference"
      />
    </div>
  );
};

const ModulesView: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!cursorRef.current) return;
      gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.2, ease: 'power3.out' });
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);
  
  const historyQuery = useLiveQuery(() => 
    db.history.where('type').equals('Examen').reverse().sortBy('date')
  ) || [];

  const history = historyQuery
    .map(h => h.details as HistoryRecord)
    .filter(h => !h.deleted);

  // Migrate local storage history to database
  useEffect(() => {
    const migrateHistory = async () => {
      const localHistory = localStorage.getItem('examHistory');
      if (localHistory) {
        try {
          const parsed: HistoryRecord[] = JSON.parse(localHistory);
          if (parsed.length > 0) {
            const newRecords: any[] = [];
            
            await db.transaction('rw', db.history, async () => {
              for (const record of parsed) {
                // Check if exists to avoid duplicates (though ID should be unique)
                const exists = await db.history.get(record.id);
                if (!exists) {
                  const newEntry = {
                    id: record.id,
                    type: 'Examen' as const,
                    date: record.date,
                    details: record
                  };
                  await db.history.add(newEntry);
                  newRecords.push(newEntry);
                }
              }
            });
            
            if (newRecords.length > 0) {
              console.log('Migrated exam history to database', newRecords.length);
              // Force sync to cloud immediately after migration
              await syncToCloud('history', newRecords);
            }
          }
          localStorage.removeItem('examHistory');
        } catch (error) {
          console.error('Failed to migrate history:', error);
        }
      }
    };
    migrateHistory();
  }, []);

  const handleExamComplete = async (record: HistoryRecord) => {
    try {
      const newEntry = {
        id: record.id,
        type: 'Examen' as const,
        date: record.date,
        details: record
      };
      
      await db.history.add(newEntry);
      
      // Sync to cloud immediately
      syncToCloud('history', newEntry).catch(err => 
        console.error('Background sync failed:', err)
      );
      
      setSelectedModule(null);
    } catch (error) {
      console.error('Failed to save exam result:', error);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      const record = await db.history.get(id);
      if (record && record.details) {
        // Soft delete: update the record with deleted=true
        const updatedDetails = { ...record.details, deleted: true };
        const updatedRecord = { ...record, details: updatedDetails };
        
        // Update local DB
        await db.history.put(updatedRecord);
        
        // Sync to cloud
        await syncToCloud('history', updatedRecord);
        console.log('Exam history soft-deleted and synced:', id);
      }
    } catch (error) {
      console.error('Failed to delete history:', error);
    }
  };

  if (selectedModule) {
    return <ModuleDetail module={selectedModule} onBack={() => setSelectedModule(null)} onExamComplete={handleExamComplete} />;
  }

  return <ModuleList onSelect={setSelectedModule} history={history} onDeleteHistory={handleDeleteHistory} />;
};

export default ModulesView;
