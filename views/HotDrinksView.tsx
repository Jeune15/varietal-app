import React, { useState } from 'react';
import { Coffee, ChevronLeft, Droplet } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const hotDrinks = [
  {
    name: 'Espresso',
    history: 'Originario de Italia a principios del siglo XX, el espresso nació de la necesidad de preparar café rápidamente para los trabajadores usando presión.',
    characteristics: 'Taza de 30-40 ml (demitasse). Crema espesa y color avellana en la parte superior.',
    preparation: '18g de café molido fino, extraído con agua a 90-96°C a 9 bares de presión durante 25-30 segundos para obtener ~36g de bebida.',
    sensory: 'Intenso, cuerpo pesado, acidez brillante y final prolongado.'
  },
  {
    name: 'Americano',
    history: 'Creado durante la Segunda Guerra Mundial cuando los soldados estadounidenses en Italia diluían el espresso con agua caliente para imitar el café de filtro de su país.',
    characteristics: 'Taza de 150-200 ml. Aspecto de café negro tradicional pero con aceites del espresso.',
    preparation: 'Extraer un espresso doble (36g) y verter sobre 120-150 ml de agua caliente (o viceversa para mantener la crema, llamado Long Black).',
    sensory: 'Cuerpo medio a ligero, menor intensidad que el espresso, conserva notas aromáticas complejas pero más suaves.'
  },
  {
    name: 'Macchiato',
    history: 'De la palabra italiana "macchiato" que significa "manchado" o "marcado". Nació para distinguir el espresso normal del que llevaba un poco de leche.',
    characteristics: 'Taza de 60-80 ml. Espresso oscuro con una pequeña mancha blanca de espuma de leche en el centro.',
    preparation: 'Extraer un espresso simple o doble y añadir 1-2 cucharaditas de espuma de leche caliente encima.',
    sensory: 'Sabor dominante a espresso, intensidad alta, con un ligero toque dulce y cremoso de la espuma de leche.'
  },
  {
    name: 'Cortado',
    history: 'Originario de España. Su nombre viene de "cortar" el café con un poco de leche para reducir la acidez.',
    characteristics: 'Vaso o taza pequeña de 100-120 ml. Proporción 1:1 de espresso y leche.',
    preparation: 'Un espresso doble (~36g) mezclado con igual cantidad de leche texturizada tibia, con muy poca espuma.',
    sensory: 'Equilibrio perfecto entre café y leche. La leche no opaca al café, reduce la acidez y añade dulzor.'
  },
  {
    name: 'Flat White',
    history: 'Originario de Australia/Nueva Zelanda en los años 80. Creado para quienes querían el sabor a café de un cappuccino pero sin la abundante espuma.',
    characteristics: 'Taza de 150-160 ml. Capa muy fina de microespuma ("flat").',
    preparation: 'Un espresso doble Ristretto (~20-30g) mezclado con leche texturizada con microespuma muy fina y sedosa.',
    sensory: 'Textura aterciopelada, sabor a café muy presente y dulce gracias a la microespuma perfectamente integrada.'
  },
  {
    name: 'Cappuccino',
    history: 'El nombre proviene de los monjes Capuchinos, cuyas túnicas tenían un color similar al de esta bebida mezclada. Popularizado en Italia después de la invención de la máquina de espresso.',
    characteristics: 'Taza de 150-180 ml. Tradicionalmente dividido en tercios: 1/3 espresso, 1/3 leche vaporizada, 1/3 espuma.',
    preparation: 'Un espresso simple o doble, seguido de leche texturizada con una gruesa capa de espuma brillante en la parte superior.',
    sensory: 'Textura aireada y espumosa, sabor a café balanceado con el dulzor lácteo.'
  },
  {
    name: 'Latte',
    history: 'Término americano/internacional para el "Caffè Latte" italiano (café con leche). En Italia, pedir un "latte" te dará solo un vaso de leche.',
    characteristics: 'Taza o vaso de 200-240 ml o más. Mucha leche con una fina capa de espuma.',
    preparation: 'Un espresso simple o doble, rellenado con leche texturizada y 1 cm de microespuma en la parte superior.',
    sensory: 'Bebida suave, muy lechosa y dulce, donde el café es una nota de fondo más que el protagonista principal.'
  },
  {
    name: 'Mocha',
    history: 'Inspirado en la ciudad de Moca (Yemen), famosa por sus granos de café con notas a chocolate. Luego se empezó a añadir chocolate real a la bebida.',
    characteristics: 'Taza grande de 240-300 ml. Tono marrón oscuro, a menudo decorado con cacao en polvo o crema batida.',
    preparation: 'Espresso mezclado con 15-20g de salsa o polvo de chocolate, luego se añade leche texturizada (como un Latte).',
    sensory: 'Dulce, chocolatoso, reconfortante, como un chocolate caliente con un kick de café.'
  }
];

const syrups = [
  {
    name: 'Jarabe de Vainilla Simple',
    ingredients: [
      '1 taza de agua',
      '1 taza de azúcar blanca',
      '1 cucharada de extracto de vainilla (o 1 vaina de vainilla abierta)'
    ],
    steps: [
      'En una olla pequeña, combina el agua y el azúcar.',
      'Calienta a fuego medio, revolviendo hasta que el azúcar se disuelva por completo (no dejes que hierva a borbotones).',
      'Retira del fuego y deja enfriar por 10 minutos.',
      'Añade el extracto de vainilla y mezcla bien. Si usas la vaina, agrégala al principio y retírala al final.',
      'Guarda en una botella de vidrio en el refrigerador (dura hasta 3-4 semanas).'
    ],
    usage: 'Ideal para Lattes, Macchiatos y Flat Whites. Aporta un dulzor floral clásico.'
  },
  {
    name: 'Salsa de Caramelo Salado',
    ingredients: [
      '1 taza de azúcar blanca',
      '1/4 taza de agua',
      '1/2 taza de crema de leche (nata)',
      '2 cucharadas de mantequilla sin sal',
      '1 cucharadita de sal marina'
    ],
    steps: [
      'En una olla, mezcla el azúcar y el agua. Calienta a fuego medio-alto sin revolver, solo gira la olla suavemente.',
      'Cocina hasta que tome un color ámbar profundo (cuidado que no se queme).',
      'Retira del fuego y añade la mantequilla, batiendo rápidamente.',
      'Vierte la crema de leche poco a poco (burbujeará mucho) y sigue batiendo hasta que quede suave.',
      'Añade la sal marina, mezcla y deja enfriar.'
    ],
    usage: 'Perfecto para Caramel Macchiatos o como topping sobre espuma de leche.'
  },
  {
    name: 'Jarabe de Especias de Otoño (Pumpkin Spice)',
    ingredients: [
      '1 taza de agua',
      '1 taza de azúcar (mitad blanca, mitad rubia)',
      '2 ramas de canela',
      '1 cucharadita de clavo entero',
      '1 trozo de jengibre fresco',
      '1/2 cucharadita de nuez moscada'
    ],
    steps: [
      'Combina todos los ingredientes en una olla.',
      'Lleva a ebullición suave, luego reduce el fuego y hierve a fuego lento por 15 minutos.',
      'Retira del fuego y deja reposar la mezcla con las especias durante 1 hora para que infusione.',
      'Cuela el jarabe para retirar las especias sólidas.',
      'Guarda en una botella esterilizada.'
    ],
    usage: 'Un clásico para Lattes en temporada fría. Combina excelente con cafés de tueste medio-oscuro.'
  },
  {
    name: 'Salsa de Chocolate Oscuro (Mocha)',
    ingredients: [
      '1 taza de agua',
      '1 taza de azúcar blanca',
      '3/4 taza de cacao en polvo sin azúcar (de buena calidad)',
      '1 cucharadita de extracto de vainilla',
      'Pizca de sal'
    ],
    steps: [
      'Mezcla el azúcar y el cacao en polvo en una olla para eliminar los grumos.',
      'Añade el agua y la sal, y mezcla bien.',
      'Calienta a fuego medio, batiendo constantemente hasta que hierva suavemente.',
      'Reduce el fuego y cocina por 3-5 minutos hasta que espese un poco.',
      'Retira del fuego, añade la vainilla y deja enfriar.'
    ],
    usage: 'La base fundamental para Mochas. También se puede usar para decorar tazas.'
  }
];

export const HotDrinksView: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'drinks' | 'syrups'>('drinks');

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-black font-sans selection:bg-brand/30 pb-32">
      {/* Header & Tabs Container - Sticky */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-stone-100 dark:bg-stone-800 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter text-stone-900 dark:text-stone-100 flex items-center gap-2">
                 Bebidas Calientes
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hidden sm:block">
                Clásicos de cafetería y recetas de jarabes
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('drinks')}
            className={`pb-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'drinks'
                ? 'border-brand text-brand'
                : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
          >
            Bebidas
          </button>
          <button
            onClick={() => setActiveTab('syrups')}
            className={`pb-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'syrups'
                ? 'border-brand text-brand'
                : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
          >
            Jarabes
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">

      {activeTab === 'drinks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotDrinks.map((drink, idx) => (
            <div key={idx} className="relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-950 hover:border-brand dark:hover:border-brand transition-all duration-300 h-full text-left overflow-hidden">
              <div className="w-full space-y-4 relative z-10 transition-all duration-300">
                <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-2">
                  {drink.name}
                </h3>
              
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-brand mb-1 font-bold">Historia y Origen</p>
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">{drink.history}</p>
                  </div>
                  
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-amber-500 mb-1 font-bold">Características</p>
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">{drink.characteristics}</p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-green-600 mb-1 font-bold">Preparación</p>
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">{drink.preparation}</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800">
                  <p className="text-[10px] uppercase tracking-widest text-purple-500 mb-1 font-bold">Perfil Sensorial</p>
                  <p className="text-[11px] italic text-stone-500 dark:text-stone-400 leading-relaxed">{drink.sensory}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'syrups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {syrups.map((syrup, idx) => (
            <div key={idx} className="relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-950 hover:border-brand dark:hover:border-brand transition-all duration-300 h-full text-left overflow-hidden">
              <div className="w-full space-y-4 relative z-10 transition-all duration-300">
                <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-2">
                  {syrup.name}
                </h3>
              </div>
              
              <div className="space-y-6 flex-1 w-full relative z-10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">Ingredientes</p>
                  <ul className="space-y-1">
                    {syrup.ingredients.map((ing, i) => (
                      <li key={i} className="text-[11px] text-stone-600 dark:text-stone-300 flex items-start gap-2 leading-relaxed">
                        <span className="w-1 h-1 rounded-full bg-stone-400 mt-1.5 shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-2">Instrucciones</p>
                  <ol className="space-y-2">
                    {syrup.steps.map((step, i) => (
                      <li key={i} className="text-[11px] text-stone-600 dark:text-stone-300 flex items-start gap-3 leading-relaxed">
                        <span className="font-mono text-[10px] text-stone-400 font-bold mt-0.5">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-1">Uso Sugerido</p>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">{syrup.usage}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};
