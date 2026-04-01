import React, { useState } from 'react';
import { Coffee, ChevronLeft, ArrowLeft, Droplets, Snowflake } from 'lucide-react';

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
    name: 'Ristretto',
    history: 'Del italiano "restringido". Una variante del espresso diseñada para capturar solo la primera fase de la extracción, donde se concentran los sabores más dulces y los aceites.',
    characteristics: 'Taza de 30 ml (demitasse). Volumen muy pequeño (15-20 ml).',
    preparation: 'Misma dosis de café que un espresso (ej. 18g) pero se detiene la extracción antes (15-20 segundos) para obtener ~18-20g de bebida (ratio 1:1 o 1:1.5).',
    sensory: 'Muy intenso, jaraboso, menos amargo que el espresso, acidez muy pronunciada y dulzor concentrado.'
  },
  {
    name: 'Lungo',
    history: 'Del italiano "largo". Se popularizó para aquellos que encontraban el espresso demasiado fuerte pero querían una bebida extraída a presión.',
    characteristics: 'Taza de 60-90 ml. Crema más pálida y fina.',
    preparation: 'Misma dosis de café que un espresso, pero se deja correr el agua por más tiempo (35-45 segundos) hasta obtener ~50-60g de bebida (ratio 1:3).',
    sensory: 'Menos cuerpo que el espresso, más amargo (debido a la mayor extracción de componentes solubles) y notas más asadas.'
  },
  {
    name: 'Stumpy',
    history: 'Originado en la famosa cafetería Stumptown Coffee Roasters. Es una versión muy específica y regional de una bebida corta con leche.',
    characteristics: 'Taza pequeña o vaso de 150 ml (5 oz).',
    preparation: 'Se prepara con un shot de espresso extraído sobre una pequeña cantidad de leche texturizada, similar a un cortado pero con una proporción específica de la casa.',
    sensory: 'Sabor a café muy presente y robusto, con la leche aportando textura y dulzor sin opacar el perfil del espresso.'
  },
  {
    name: 'Gibraltar',
    history: 'Creado en Blue Bottle Coffee (San Francisco) en 2005. Su nombre proviene del vaso de cristal de la marca Libbey llamado "Gibraltar" en el que se sirve.',
    characteristics: 'Vaso de cristal facetado de 4.5 oz (135 ml).',
    preparation: 'Un espresso doble ristretto mezclado con leche texturizada (un poco más fría que un latte) para consumirse inmediatamente.',
    sensory: 'Cálido (no muy caliente), equilibrio perfecto entre el dulzor de la leche y la acidez/cuerpo del ristretto. Textura muy sedosa.'
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
    history: 'El nombre proviene de los monjes Capuchinos, cuyas túnicas tenían un color similar al de esta bebida. Popularizado en Italia después de la invención de la máquina de espresso.',
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

const coldDrinks = [
  {
    name: 'Iced Latte',
    characteristics: 'Vaso de 12-16 oz. Leche fría, hielo y espresso. Mezcla rápida y refrescante.',
    preparation: 'Llenar el vaso con hielo, añadir leche fría (aprox. 150-200ml) y verter un espresso doble por encima para crear un efecto visual de capas.',
    sensory: 'Suave, dulce, con sabor a café diluido pero presente. Muy refrescante y fácil de beber.'
  },
  {
    name: 'Iced Americano',
    characteristics: 'Vaso de 12 oz. Agua fría, hielo y espresso. La versión fría del clásico.',
    preparation: 'Llenar el vaso con hielo, añadir agua fría (aprox. 150ml) y verter un espresso doble encima. Opcional: agitar para enfriar el espresso rápidamente.',
    sensory: 'Refrescante, ligero, conserva las notas del espresso pero menos intenso y sin la textura de la leche.'
  },
  {
    name: 'Espresso Tonic',
    characteristics: 'Vaso de 10-12 oz. Bebida burbujeante y brillante, muy popular en verano.',
    preparation: 'Llenar un vaso con hielo, añadir 150ml de agua tónica de buena calidad, exprimir un poco de limón o naranja (opcional) y verter un espresso doble suavemente por encima.',
    sensory: 'Agridulce, efervescente, cítrico y con el toque amargo del espresso y la quinina. Complejo y vibrante.'
  },
  {
    name: 'Shakerato',
    characteristics: 'Clásico italiano. Espresso agitado intensamente con hielo.',
    preparation: 'En una coctelera, poner hielo, un espresso doble y un toque de jarabe simple. Agitar vigorosamente y colar en una copa de martini o vaso corto.',
    sensory: 'Frío, espumoso (crema espesa por la agitación), equilibrado y elegante.'
  },
  {
    name: 'Affogato',
    characteristics: 'Mitad postre, mitad bebida. Del italiano "ahogado".',
    preparation: 'Colocar una bola (scoop) generosa de helado de vainilla en una taza o vaso pequeño y verter un espresso doble caliente directamente encima.',
    sensory: 'Contraste extremo de temperaturas. El helado se derrite creando una crema dulce que contrarresta la intensidad del espresso.'
  },
  {
    name: 'Iced Mocha',
    characteristics: 'La versión helada del clásico Mocha.',
    preparation: 'Mezclar espresso caliente con salsa de chocolate, verter sobre hielo y leche fría. Revolver bien. Opcional: crema batida.',
    sensory: 'Dulce, chocolatoso, muy indulgente y refrescante.'
  },
  {
    name: 'Iced Vanilla',
    characteristics: 'Iced Latte clásico endulzado con vainilla.',
    preparation: 'Hielo, leche fría, jarabe de vainilla (1-2 pumps) y coronar con espresso doble. Mezclar antes de beber.',
    sensory: 'Perfil lácteo y dulce con las notas florales de la vainilla complementando al café.'
  },
  {
    name: 'Iced Caramel',
    characteristics: 'Iced Latte endulzado y decorado con caramelo.',
    preparation: 'Decorar el vaso con salsa de caramelo, añadir hielo, leche, jarabe de vainilla o caramelo, y espresso doble. Opcional: crema batida y más caramelo arriba.',
    sensory: 'Muy dulce, notas ricas a caramelo tostado y mantequilla que se mezclan con el espresso.'
  },
  {
    name: 'Frappé',
    characteristics: 'Bebida licuada con hielo, textura tipo granizado. Dulce y refrescante.',
    preparation: 'Licuar hielo, un shot de espresso, un poco de base de helado, un scoop de leche en polvo y jarabe simple al gusto hasta obtener una textura homogénea.',
    sensory: 'Textura de postre espesa, muy dulce, frío intenso, sabor a café suave balanceado con la cremosidad de la base.'
  },
  {
    name: 'Mazagran',
    characteristics: 'Considerada la primera bebida de café helado, originaria de Argelia.',
    preparation: 'Café frío o espresso vertido sobre hielo, mezclado con jugo de limón fresco y a veces endulzado con jarabe o azúcar.',
    sensory: 'Altamente refrescante, acidez cítrica pronunciada que resalta las notas afrutadas de cafés de origen africano.'
  }
];

const hotSyrups = [
  {
    name: 'Vainilla Simple',
    ingredients: ['1 taza de agua', '1 taza de azúcar blanca', '1 cucharada de extracto de vainilla'],
    steps: [
      'En una olla, combina el agua y el azúcar.',
      'Calienta a fuego medio revolviendo hasta disolver por completo.',
      'Retira del fuego y deja enfriar 10 min.',
      'Añade el extracto de vainilla, mezcla y embotella.'
    ],
    usage: 'Lattes, Macchiatos.'
  },
  {
    name: 'Salsa de Caramelo Salado',
    ingredients: ['1 taza de azúcar', '1/4 taza de agua', '1/2 taza de crema de leche', '2 cdas mantequilla sin sal', '1 cdta sal marina'],
    steps: [
      'Cocina el azúcar y el agua hasta que tome color ámbar profundo.',
      'Retira del fuego, añade mantequilla y bate rápido.',
      'Vierte la crema poco a poco batiendo hasta que quede suave.',
      'Añade la sal marina y deja enfriar.'
    ],
    usage: 'Caramel Macchiatos, toppings.'
  },
  {
    name: 'Pumpkin Spice',
    ingredients: ['1 taza de agua', '1 taza de azúcar', '2 ramas canela', '1 cdta clavo', '1 trozo jengibre', '1/2 cdta nuez moscada'],
    steps: [
      'Combina los ingredientes y hierve suavemente 15 min.',
      'Deja reposar 1 hora.',
      'Cuela y embotella.'
    ],
    usage: 'Lattes de temporada.'
  },
  {
    name: 'Salsa Mocha Oscura',
    ingredients: ['1 taza de agua', '1 taza de azúcar', '3/4 taza cacao en polvo', '1 cdta vainilla', 'Pizca de sal'],
    steps: [
      'Mezcla el azúcar y el cacao. Añade agua y sal.',
      'Calienta a fuego medio batiendo constantemente hasta que espese.',
      'Retira, añade vainilla y enfría.'
    ],
    usage: 'Mochas y decoración.'
  },
  {
    name: 'Avellana (Hazelnut)',
    ingredients: ['1 taza de agua', '1 taza de azúcar', '1/2 taza avellanas tostadas troceadas', '1 cdta vainilla (opc.)'],
    steps: [
      'Hierve agua y azúcar. Añade avellanas.',
      'Mantén a fuego bajo por 20 min.',
      'Retira y reposa tapado por 30 min.',
      'Cuela presionando bien y embotella.'
    ],
    usage: 'Flat Whites y Lattes.'
  },
  {
    name: 'Canela y Miel',
    ingredients: ['1 taza de agua', '1/2 taza de azúcar', '1/2 taza de miel', '3 ramas canela', '1 cdta vainilla'],
    steps: [
      'Disuelve el azúcar en agua. Agrega la canela y cocina 10 min a fuego lento.',
      'Deja enfriar un poco, luego añade miel y vainilla.',
      'Cuela y embotella.'
    ],
    usage: 'Cappuccinos y Lattes.'
  },
  {
    name: 'Cardamomo y Rosa',
    ingredients: ['1 taza de agua', '1 taza de azúcar', '8 vainas cardamomo machacadas', '2 cdas pétalos de rosa seca', 'Pizca de sal'],
    steps: [
      'Hierve agua, azúcar y cardamomo 10 min.',
      'Retira e infunde los pétalos de rosa y sal por 45 min.',
      'Cuela y embotella.'
    ],
    usage: 'Cortados, Flat Whites con leche vegetal.'
  }
];

const coldSyrups = [
  {
    name: 'Frutos Rojos',
    ingredients: ['1 taza de agua', '1 taza de azúcar', '1 taza fresas/frambuesas'],
    steps: ['Hervir todo 15 min.', 'Colar presionando.'],
    usage: 'Iced Lattes frutales, sodas.'
  },
  {
    name: 'Menta Fresca',
    ingredients: ['1 taza de agua', '1 taza de azúcar', 'Manojo de menta'],
    steps: ['Hervir agua y azúcar.', 'Infusionar la menta fuera del fuego por 2 hrs. Colar.'],
    usage: 'Iced Mochas de Menta.'
  },
  {
    name: 'Naranja y Cardamomo',
    ingredients: ['1 taza de agua', '1 taza de azúcar', 'Cáscara de 1 naranja', '4 vainas cardamomo'],
    steps: ['Calentar a fuego lento 15 min.', 'Reposar 1 hora. Colar.'],
    usage: 'Espresso Tonic.'
  },
  {
    name: 'Coco',
    ingredients: ['1/2 taza de agua', '1/2 taza crema de coco', '3/4 taza de azúcar'],
    steps: ['Calentar a fuego medio sin que hierva hasta disolver.'],
    usage: 'Iced Lattes tropicales.'
  },
  {
    name: 'Sirope Simple',
    ingredients: ['1 taza de agua', '1 taza de azúcar'],
    steps: ['Calentar hasta disolver completamente.'],
    usage: 'Endulzante neutro frío.'
  },
  {
    name: 'Jengibre',
    ingredients: ['1 taza de agua', '1 taza de azúcar', '1/2 taza jengibre en rodajas'],
    steps: ['Hervir suavemente 20 min.', 'Enfriar y colar.'],
    usage: 'Sodas de café.'
  },
  {
    name: 'Lavanda',
    ingredients: ['1 taza de agua', '1 taza de azúcar', '2 cdas lavanda seca culinaria'],
    steps: ['Hervir agua y azúcar. Añadir lavanda y cocinar 5 min.', 'Infusionar 30 min y colar.'],
    usage: 'Iced Lattes florales.'
  },
  {
    name: 'Panela y Canela',
    ingredients: ['1 taza de agua', '1 taza panela', '2 ramas canela'],
    steps: ['Calentar hasta disolver y espesar un poco (10 min).'],
    usage: 'Café de Olla frío.'
  },
  {
    name: 'Maracuyá',
    ingredients: ['1 taza pulpa maracuyá', '1 taza azúcar', '1/2 taza agua'],
    steps: ['Hervir suavemente 10 min.', 'Colar para retirar semillas.'],
    usage: 'Espresso Tonic tropical.'
  },
  {
    name: 'Romero',
    ingredients: ['1 taza de agua', '1 taza de azúcar', '3 ramas romero fresco'],
    steps: ['Hervir agua/azúcar.', 'Infusionar romero 1 hora y colar.'],
    usage: 'Iced Americano botánico.'
  }
];

const DrinkList: React.FC<{ items: any[] }> = ({ items }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {items.map((item, idx) => (
      <div key={idx} className="flex flex-col bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
        <div className="p-6 md:p-8 flex-1 space-y-6">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">{item.name}</h3>
          </div>
          
          <div className="space-y-4 text-sm">
            {item.history && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Historia</p>
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed">{item.history}</p>
              </div>
            )}
            
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand font-bold mb-1">Características</p>
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed">{item.characteristics}</p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Preparación</p>
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed">{item.preparation}</p>
            </div>
            
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Perfil Sensorial</p>
              <p className="italic text-stone-500 dark:text-stone-400 leading-relaxed">{item.sensory}</p>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const SyrupList: React.FC<{ title: string, items: any[] }> = ({ title, items }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-black uppercase tracking-tight text-black dark:text-white px-2">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, idx) => (
        <div key={idx} className="flex flex-col bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 md:p-8 hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
          <h4 className="text-lg font-black uppercase tracking-tight text-black dark:text-white mb-4">{item.name}</h4>
          
          <div className="space-y-4 flex-1 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Ingredientes</p>
              <ul className="space-y-1">
                {item.ingredients.map((ing: string, i: number) => (
                  <li key={i} className="text-stone-600 dark:text-stone-300 leading-relaxed before:content-['·'] before:mr-2 before:font-black">{ing}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Pasos</p>
              <ol className="space-y-1.5 list-decimal list-inside text-stone-600 dark:text-stone-300 leading-relaxed">
                {item.steps.map((step: string, i: number) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 mt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-1">Uso Sugerido</p>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{item.usage}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const DrinksView: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'hot' | 'cold' | 'syrups'>('hot');

  const tabs = [
    { id: 'hot', label: 'Calientes', icon: Coffee },
    { id: 'cold', label: 'Frías', icon: Snowflake },
    { id: 'syrups', label: 'Jarabes', icon: Droplets },
  ] as const;

  return (
    <div className="h-full flex flex-col animate-fade-in pb-20">
      {/* Sticky Header */}
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
                Bebidas
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hidden sm:block">
                Calientes, frías y jarabes
              </p>
            </div>
          </div>


          {/* Tabs */}
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
        {activeTab === 'hot' && <DrinkList items={hotDrinks} />}
        {activeTab === 'cold' && <DrinkList items={coldDrinks} />}
        {activeTab === 'syrups' && (
          <div className="space-y-12 animate-fade-in">
            <SyrupList title="Salsas y Jarabes Calientes" items={hotSyrups} />
            <div className="border-t border-stone-200 dark:border-stone-800"></div>
            <SyrupList title="Siropes Fríos e Infusiones" items={coldSyrups} />
          </div>
        )}
      </div>
    </div>
  );
};
