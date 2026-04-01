import React, { useState } from 'react';
import { Droplet, ChevronLeft, ArrowLeft, BookOpen, FlaskConical, AlertTriangle } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const TheoryTab: React.FC = () => (
  <div className="space-y-12 animate-fade-in">
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">Extracción en Frío vs Calor</h3>
        <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-3xl mt-2">
          El Cold Brew no es simplemente "café con hielo". Es un método de preparación donde se utiliza agua a temperatura ambiente o fría para extraer los compuestos del café molido durante un periodo prolongado de tiempo (generalmente de 12 a 24 horas). Al no usar calor, la extracción química es fundamentalmente diferente.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-6 md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-4">Lo que Sí se extrae</p>
          <ul className="space-y-3">
            <li className="text-sm text-stone-600 dark:text-stone-300">
              <span className="font-bold text-black dark:text-white">Azúcares Simples:</span> Alta dulzura percibida.
            </li>
            <li className="text-sm text-stone-600 dark:text-stone-300">
              <span className="font-bold text-black dark:text-white">Cafeína:</span> Debido al largo tiempo de contacto, el cold brew suele tener más cafeína que el café filtrado en caliente.
            </li>
            <li className="text-sm text-stone-600 dark:text-stone-300">
              <span className="font-bold text-black dark:text-white">Compuestos Aromáticos Pesados:</span> Notas a chocolate, nueces o caramelo se mantienen intactas.
            </li>
          </ul>
        </div>

        <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-6 md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Lo que NO se extrae</p>
          <ul className="space-y-3">
            <li className="text-sm text-stone-600 dark:text-stone-300">
              <span className="font-bold text-black dark:text-white">Ácidos Volátiles:</span> Por eso el cold brew es hasta 60% menos ácido que el café caliente, ideal para estómagos sensibles.
            </li>
            <li className="text-sm text-stone-600 dark:text-stone-300">
              <span className="font-bold text-black dark:text-white">Compuestos Amargos:</span> Aceites amargos y taninos que solo se disuelven a altas temperaturas quedan en el grano.
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div className="space-y-6">
      <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white border-b border-stone-200 dark:border-stone-800 pb-2">Variables Clave</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 rounded-2xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-sky-500 mb-2">Molienda</p>
          <h4 className="text-lg font-black uppercase tracking-tight mb-2">Gruesa</h4>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">Similar a la prensa francesa o ligeramente más gruesa. Una molienda muy fina causará sobre-extracción, resultando en un cold brew amargo y polvoriento.</p>
        </div>
        
        <div className="border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 rounded-2xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">Tiempo & Temperatura</p>
          <h4 className="text-lg font-black uppercase tracking-tight mb-2">12 - 24 Horas</h4>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">A temperatura ambiente extrae más rápido (12-16h). Extraer en el refrigerador toma más tiempo (18-24h) pero produce un perfil de sabor mucho más limpio y estable.</p>
        </div>

        <div className="border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 rounded-2xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">Ratio (Proporción)</p>
          <h4 className="text-lg font-black uppercase tracking-tight mb-2">1:4 a 1:15</h4>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">Concentrado vs Taza Lista. Un ratio 1:5 genera un líquido que debe diluirse. Un ratio 1:14 genera una bebida que se puede tomar directamente con hielo.</p>
        </div>
      </div>
    </div>
  </div>
);

const RecipesTab: React.FC = () => (
  <div className="space-y-12 animate-fade-in">
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">Recetas Prácticas</h3>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
          Guías paso a paso para producir desde un concentrado versátil hasta una extracción rápida usando agua caliente inicial (Flash Brew / Hot Bloom).
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Receta 1 */}
        <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-6 md:p-8 flex-1 space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-1">El Estándar de Cafetería</p>
              <h4 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">Concentrado Inmersión 1:8</h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">Esta receta produce un concentrado fuerte y estable que dura hasta 2 semanas en refrigeración. Para beber, mezcla 1 parte de concentrado con 1 parte de agua o leche.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-xl border border-stone-100 dark:border-stone-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Café</p>
                <p className="font-black text-black dark:text-white">100g <span className="text-xs font-normal text-stone-500">(Mol. Gruesa)</span></p>
              </div>
              <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-xl border border-stone-100 dark:border-stone-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Agua Fría</p>
                <p className="font-black text-black dark:text-white">800ml <span className="text-xs font-normal text-stone-500">(Filtrada)</span></p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Paso a paso</p>
              <ol className="space-y-3 list-decimal list-inside text-sm text-stone-700 dark:text-stone-300 leading-relaxed marker:font-black marker:text-brand">
                <li>Coloca el café molido en un jarra amplia de vidrio o un recipiente Toddy.</li>
                <li>Vierte el agua filtrada en círculos, mojando toda la cama de café.</li>
                <li>Revuelve muy suavemente para asegurar que no queden grumos secos, sin agitar en exceso.</li>
                <li>Tapa el recipiente (para evitar que absorba olores) y deja reposar a temperatura ambiente por 14-16 horas.</li>
                <li>Filtra el líquido usando un filtro de papel grueso o en doble filtrado (malla fina, luego papel).</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Receta 2 */}
        <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-6 md:p-8 flex-1 space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1">Mayor Acidez y Complejidad</p>
              <h4 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">Hot Bloom Cold Brew 1:12</h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">Usa una pequeña porción de agua caliente al inicio (bloom) para extraer los compuestos volátiles ácidos y aromáticos, luego agua fría para completar la inmersión en frío. Bebida directa, no concentrado.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-xl border border-stone-100 dark:border-stone-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Café</p>
                <p className="font-black text-black dark:text-white">50g <span className="text-xs font-normal text-stone-500">(Mol. Media-Gruesa)</span></p>
              </div>
              <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-xl border border-stone-100 dark:border-stone-800 flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Agua</p>
                <p className="font-black text-black dark:text-white leading-none">100ml <span className="text-[10px] font-normal text-rose-500 uppercase tracking-widest">(94°C)</span></p>
                <p className="font-black text-black dark:text-white leading-none">500ml <span className="text-[10px] font-normal text-sky-500 uppercase tracking-widest">(Fría)</span></p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Paso a paso</p>
              <ol className="space-y-3 list-decimal list-inside text-sm text-stone-700 dark:text-stone-300 leading-relaxed marker:font-black marker:text-amber-500">
                <li>Coloca el café en la jarra. Vierte los 100ml de agua caliente asegurando que todo el café se moje.</li>
                <li>Revuelve suavemente y deja reposar ("bloom") durante 45 segundos. Notarás liberación de gases.</li>
                <li>Vierte rápidamente los 500ml de agua fría (o con hielo) para detener la extracción en caliente.</li>
                <li>Tapa y lleva inmediatamente al refrigerador. Deja infundir por 12 a 14 horas.</li>
                <li>Filtra y sirve directo sobre hielo. Disfruta un Cold Brew con una acidez brillante similar al filtrado tradicional.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TroubleshootingTab: React.FC = () => {
  const problems = [
    {
      issue: 'El café sabe demasiado amargo o áspero',
      causes: [
        'Molienda demasiado fina (extracción de compuestos indeseados).',
        'Tiempo de infusión demasiado largo (más de 24 horas a temp ambiente).',
        'Café de tueste excesivamente oscuro perdiendo sus aceites en el agua.'
      ],
      solutions: [
        'Engruesa la molienda (tipo sal gruesa).',
        'Reduce el tiempo de extracción a 12-14 hrs o hazlo en refrigeración.',
        'Prueba con un tueste medio o medio-claro.'
      ]
    },
    {
      issue: 'El café está débil, acuoso o "sin cuerpo"',
      causes: [
        'Molienda exageradamente gruesa perdiendo superficie de contacto.',
        'Ratio de agua muy alto frente al café (muy diluido).',
        'Tiempo de infusión demasiado corto o agitamiento nulo inicial.'
      ],
      solutions: [
        'Ajusta la molienda un poco más fina.',
        'Aumenta la proporción de café (baja a un ratio 1:8 o 1:10).',
        'Asegúrate de revolver bien la cama de café al inicio para evitar grumos secos.'
      ]
    },
    {
      issue: 'Sabor a levadura, fermentado o sabor "extraño" después de días',
      causes: [
        'Oxidación o contaminación cruzada por falta de higiene.',
        'Recipiente no hermético que absorbió olores del refrigerador.',
        'Pasaron más de 10-14 días desde la filtración.'
      ],
      solutions: [
        'Mantén una estricta higiene en los equipos de filtrado.',
        'Usa botellas de vidrio con tapón hermético.',
        'Consume dentro de 7 a 10 días para máximo frescor y calidad.'
      ]
    },
    {
      issue: 'El café deja un residuo polvoriento en la boca',
      causes: [
        'Filtrado deficiente o uso de filtros de malla de mala calidad.',
        'Molienda errática en molino viejo que genera mucho polvo (fines).'
      ],
      solutions: [
        'Emplea la técnica del doble filtrado: primero por malla de metal fina (colador chino) y luego por filtro de papel grueso (tipo Chemex).',
        'No exprimas la bolsa de filtrado (si usas Toddys de tela) al final del proceso; deja escurrir por gravedad.'
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">Problemas Comunes (Troubleshooting)</h3>
        <p className="text-sm text-stone-500 mt-1 max-w-2xl leading-relaxed">
          Identifica las fallas de sabor en tu lote de Cold Brew y ajusta tus variables para la siguiente preparación.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {problems.map((prob, idx) => (
          <div key={idx} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 md:p-8 flex flex-col hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
            <h4 className="text-base font-black uppercase tracking-tight text-black dark:text-white mb-6 pr-4">{prob.issue}</h4>
            
            <div className="space-y-6 flex-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-2">Posibles Causas</p>
                <ul className="space-y-2">
                  {prob.causes.map((cause, i) => (
                    <li key={i} className="text-xs text-stone-600 dark:text-stone-400 flex items-start leading-relaxed"><span className="mr-2 text-rose-400">×</span> {cause}</li>
                  ))}
                </ul>
              </div>
              
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">Soluciones (Próximo Lote)</p>
                <ul className="space-y-2">
                  {prob.solutions.map((sol, i) => (
                    <li key={i} className="text-xs text-stone-600 dark:text-stone-400 flex items-start leading-relaxed"><span className="mr-2 text-emerald-500">✓</span> {sol}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ColdBrewToolView: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'theory' | 'recipes' | 'troubleshooting'>('theory');

  const tabs = [
    { id: 'theory', label: 'Conceptos', icon: BookOpen },
    { id: 'recipes', label: 'Recetas', icon: Droplet },
    { id: 'troubleshooting', label: 'Problemas Comunes', icon: AlertTriangle },
  ] as const;

  return (
    <div className="h-full flex flex-col animate-fade-in pb-20">
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 pt-4">
        <div className="max-w-7xl mx-auto px-4 pb-0">
          <div className="flex items-center gap-4 mb-6 mt-2">
            <button
              onClick={onBack}
              className="group p-2 -ml-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-400 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter text-stone-900 dark:text-stone-100">
                Cold Brew
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hidden sm:block">
                Teoría, preparación y problemas comunes
              </p>
            </div>
          </div>

          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-brand text-brand'
                      : 'border-transparent text-stone-400 hover:text-stone-600 hover:text-brand dark:hover:text-stone-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {activeTab === 'theory' && <TheoryTab />}
        {activeTab === 'recipes' && <RecipesTab />}
        {activeTab === 'troubleshooting' && <TroubleshootingTab />}
      </div>
    </div>
  );
};
