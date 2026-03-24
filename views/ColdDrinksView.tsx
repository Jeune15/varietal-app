import React, { useState } from 'react';
import { Coffee, ChevronLeft, Droplet, Snowflake } from 'lucide-react';

interface Props {
  onBack: () => void;
}

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
    name: 'Cold Brew',
    characteristics: 'Extracción en frío. No lleva calor en ningún momento del proceso. Se sirve con hielo.',
    preparation: 'Café molido grueso en inmersión con agua fría durante 12-24 horas. Se filtra y se sirve sobre hielo, a veces diluido con un poco de agua o leche.',
    sensory: 'Muy bajo en acidez, cuerpo pesado y licoroso, notas a chocolate y dulzor natural elevado. Mayor contenido de cafeína.'
  },
  {
    name: 'Espresso Tonic',
    characteristics: 'Vaso de 10-12 oz. Bebida burbujeante y brillante, muy popular en verano.',
    preparation: 'Llenar un vaso con hielo, añadir 150ml de agua tónica de buena calidad, exprimir un poco de limón o naranja (opcional) y verter un espresso doble suavemente por encima.',
    sensory: 'Agridulce, efervescente, cítrico y con el toque amargo del espresso y la quinina. Complejo y vibrante.'
  },
  {
    name: 'Frappé',
    characteristics: 'Bebida licuada con hielo, textura tipo granizado.',
    preparation: 'Licuar hielo, espresso o café soluble, leche, azúcar o jarabe, y una base en polvo (frappe base) para dar textura. Servir con crema batida.',
    sensory: 'Textura de postre, muy dulce, frío intenso, sabor a café suave opacado por los saborizantes.'
  },
  {
    name: 'Mazagran',
    characteristics: 'Considerada la primera bebida de café helado, originaria de Argelia.',
    preparation: 'Café frío o espresso vertido sobre hielo, mezclado con jugo de limón fresco y a veces endulzado con jarabe o azúcar.',
    sensory: 'Altamente refrescante, acidez cítrica pronunciada que resalta las notas afrutadas de cafés de origen africano.'
  }
];

const coldSyrups = [
  {
    name: 'Sirope de Frutos Rojos',
    ingredients: ['1 taza de agua', '1 taza de azúcar', '1 taza de fresas/frambuesas frescas o congeladas'],
    steps: [
      'Combinar agua, azúcar y frutas en una olla.',
      'Llevar a ebullición, aplastando un poco las frutas.',
      'Bajar el fuego y cocinar 10-15 minutos.',
      'Colar bien presionando para extraer el líquido y dejar enfriar.'
    ],
    combinations: 'Cold Brew con tónica, Iced Lattes frutales, o sodas de café.'
  },
  {
    name: 'Sirope de Menta',
    ingredients: ['1 taza de agua', '1 taza de azúcar', '1 manojo grande de hojas de menta fresca'],
    steps: [
      'Hervir el agua y el azúcar hasta que se disuelva.',
      'Retirar del fuego, agregar las hojas de menta rotas con las manos.',
      'Tapar y dejar infusionar por 2-3 horas.',
      'Colar y embotellar.'
    ],
    combinations: 'Iced Mochas (Menta-Chocolate), Cold Brew refrescante.'
  },
  {
    name: 'Sirope de Naranja y Cardamomo',
    ingredients: ['1 taza de agua', '1 taza de azúcar', 'Cáscara de 1 naranja (sin parte blanca)', '4 vainas de cardamomo machacadas'],
    steps: [
      'Mezclar todos los ingredientes en una olla.',
      'Calentar a fuego lento por 15 minutos sin que hierva fuerte.',
      'Apagar y dejar reposar 1 hora.',
      'Colar y guardar en el refrigerador.'
    ],
    combinations: 'Espresso Tonic, Iced Americano.'
  },
  {
    name: 'Sirope de Coco',
    ingredients: ['1/2 taza de agua', '1/2 taza de crema de coco (de lata)', '3/4 taza de azúcar'],
    steps: [
      'Mezclar todos los ingredientes en una olla pequeña.',
      'Calentar a fuego medio revolviendo hasta que el azúcar y la crema de coco se integren completamente.',
      'No dejar hervir para que no se corte.',
      'Dejar enfriar.'
    ],
    combinations: 'Iced Lattes tropicales, Cold Brew con leche de coco.'
  },
  {
    name: 'Sirope Simple (Simple Syrup)',
    ingredients: ['1 taza de agua', '1 taza de azúcar blanca'],
    steps: [
      'Calentar el agua y el azúcar en una olla pequeña.',
      'Revolver hasta que el azúcar se disuelva por completo y el líquido sea transparente.',
      'Retirar del fuego y dejar enfriar.'
    ],
    combinations: 'Endulzante neutro perfecto para Iced Americanos o Cold Brew sin alterar el sabor.'
  },
  {
    name: 'Sirope de Jengibre',
    ingredients: ['1 taza de agua', '1 taza de azúcar', '1/2 taza de jengibre fresco pelado y en rodajas finas'],
    steps: [
      'Combinar agua, azúcar y jengibre en una olla.',
      'Llevar a ebullición y reducir el fuego.',
      'Cocinar a fuego lento por 20 minutos.',
      'Dejar enfriar en la olla, luego colar.'
    ],
    combinations: 'Sodas de café, Espresso Tonic especiado.'
  },
  {
    name: 'Sirope de Lavanda',
    ingredients: ['1 taza de agua', '1 taza de azúcar', '2 cucharadas de lavanda culinaria seca'],
    steps: [
      'Hervir el agua y el azúcar.',
      'Agregar la lavanda, reducir el fuego y cocinar 5 minutos.',
      'Retirar del fuego y dejar infusionar 30 minutos.',
      'Colar con malla fina.'
    ],
    combinations: 'Iced Lattes florales (Honey Lavender Latte es un clásico).'
  },
  {
    name: 'Sirope de Panela y Canela',
    ingredients: ['1 taza de agua', '1 taza de panela rallada o chancaca', '2 ramas de canela'],
    steps: [
      'Calentar el agua con la panela y la canela.',
      'Revolver hasta que la panela se disuelva.',
      'Cocinar a fuego bajo por 10 minutos para que espese un poco.',
      'Retirar la canela y dejar enfriar.'
    ],
    combinations: 'Iced Lattes estilo "Café de Olla", Cold Brew endulzado.'
  },
  {
    name: 'Sirope de Maracuyá',
    ingredients: ['1 taza de pulpa de maracuyá (con o sin semillas)', '1 taza de azúcar', '1/2 taza de agua'],
    steps: [
      'Poner todos los ingredientes en una olla.',
      'Calentar a fuego medio hasta que el azúcar se disuelva y hierva suavemente.',
      'Reducir a fuego lento por 10 minutos.',
      'Colar para quitar las semillas (opcional) y enfriar.'
    ],
    combinations: 'Cold Brew afrutado, Espresso Tonic tropical.'
  },
  {
    name: 'Sirope de Romero',
    ingredients: ['1 taza de agua', '1 taza de azúcar', '3 ramitas de romero fresco'],
    steps: [
      'Hervir el agua y el azúcar.',
      'Agregar el romero, tapar y retirar del fuego.',
      'Dejar infusionar por 1 hora.',
      'Colar y embotellar.'
    ],
    combinations: 'Espresso Tonic herbal, Iced Americano botánico.'
  }
];

export const ColdDrinksView: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'drinks' | 'syrups' | 'coldbrew'>('drinks');

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors mb-2"
          >
            <ChevronLeft size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Volver a Herramientas</span>
          </button>
          <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase flex items-center gap-3">
            <Snowflake className="w-8 h-8 text-blue-500" />
            Bebidas Frías
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 uppercase tracking-widest">
            Bebidas heladas, siropes y guía de Cold Brew
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex flex-wrap bg-stone-100 dark:bg-stone-900 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('drinks')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${
              activeTab === 'drinks' 
                ? 'bg-white dark:bg-stone-800 text-black dark:text-white shadow-sm' 
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Bebidas
          </button>
          <button
            onClick={() => setActiveTab('syrups')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${
              activeTab === 'syrups' 
                ? 'bg-white dark:bg-stone-800 text-black dark:text-white shadow-sm' 
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Siropes (10)
          </button>
          <button
            onClick={() => setActiveTab('coldbrew')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'coldbrew' 
                ? 'bg-blue-500 text-white shadow-sm' 
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Droplet size={14} />
            Cold Brew
          </button>
        </div>
      </div>

      {activeTab === 'drinks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coldDrinks.map((drink, idx) => (
            <div key={idx} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 flex flex-col h-full hover:border-black dark:hover:border-white transition-colors group">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-4 group-hover:text-blue-500 transition-colors">{drink.name}</h3>
              
              <div className="space-y-4 flex-1">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Características</p>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{drink.characteristics}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Preparación</p>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{drink.preparation}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Perfil Sensorial</p>
                <p className="text-xs italic text-stone-500 dark:text-stone-400">{drink.sensory}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'syrups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coldSyrups.map((syrup, idx) => (
            <div key={idx} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <Droplet className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">{syrup.name}</h3>
              </div>
              
              <div className="space-y-6 flex-1">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Ingredientes</p>
                  <ul className="space-y-2">
                    {syrup.ingredients.map((ing, i) => (
                      <li key={i} className="text-xs text-stone-600 dark:text-stone-300 flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-stone-400 mt-1.5 shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Instrucciones</p>
                  <ol className="space-y-3">
                    {syrup.steps.map((step, i) => (
                      <li key={i} className="text-xs text-stone-600 dark:text-stone-300 flex items-start gap-3">
                        <span className="font-mono text-[10px] text-stone-400 font-bold mt-0.5">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-4 rounded-lg">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">Combinaciones Ideales</p>
                <p className="text-xs text-stone-600 dark:text-stone-400">{syrup.combinations}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'coldbrew' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 md:p-10">
          <div className="max-w-3xl mx-auto space-y-12">
            
            <div className="text-center space-y-4">
              <h3 className="text-4xl font-black uppercase tracking-tighter">¿Qué es el Cold Brew?</h3>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-lg">
                Es un método de preparación de café donde se utiliza agua a temperatura ambiente o fría para extraer los compuestos del café molido durante un periodo prolongado de tiempo (generalmente de 12 a 24 horas). Al no usar calor, la extracción química es muy diferente: los compuestos que causan acidez y amargor no se disuelven tan fácilmente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xl font-black uppercase tracking-tight border-b border-stone-200 dark:border-stone-800 pb-2">Variables Clave</h4>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-500 w-24 shrink-0 uppercase text-xs tracking-widest mt-1">Molienda</span>
                    <span className="text-sm text-stone-600 dark:text-stone-400">Debe ser gruesa (similar a la prensa francesa o más). Una molienda muy fina causará sobre-extracción, resultando en un cold brew amargo y polvoriento.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-500 w-24 shrink-0 uppercase text-xs tracking-widest mt-1">Tiempo</span>
                    <span className="text-sm text-stone-600 dark:text-stone-400">12 a 24 horas. A temperatura ambiente extrae más rápido (12-16h), en refrigerador toma más tiempo (18-24h) pero produce un sabor más limpio.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-500 w-24 shrink-0 uppercase text-xs tracking-widest mt-1">Ratio</span>
                    <span className="text-sm text-stone-600 dark:text-stone-400">Se suele hacer un "Concentrado" (ratio 1:4 a 1:8) que luego se diluye, o "Ready to Drink" (ratio 1:12 a 1:15) que se bebe directamente.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-stone-50 dark:bg-stone-950 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
                <h4 className="text-xl font-black uppercase tracking-tight text-blue-500 mb-4">Receta Inicial: Concentrado 1:8</h4>
                <p className="text-xs text-stone-500 mb-6">Esta receta produce un concentrado fuerte. Para beber, mezcla 1 parte de concentrado con 1 parte de agua o leche.</p>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Ingredientes</p>
                    <ul className="text-sm text-stone-700 dark:text-stone-300 space-y-1">
                      <li>• 100g de café (molienda gruesa)</li>
                      <li>• 800ml de agua filtrada (fría o temp. ambiente)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Pasos</p>
                    <ol className="text-sm text-stone-700 dark:text-stone-300 space-y-2 list-decimal list-inside">
                      <li>Coloca el café molido en un recipiente grande de vidrio o jarra especial.</li>
                      <li>Vierte el agua en círculos asegurándote de mojar todo el café.</li>
                      <li>Revuelve suavemente con una cuchara para que no queden grumos secos.</li>
                      <li>Tapa el recipiente y deja reposar a temperatura ambiente por 14-16 horas.</li>
                      <li>Filtra la mezcla. (Puedes usar un filtro de papel grueso, filtro de metal, o bolsa de tela).</li>
                      <li>Guarda el líquido resultante en el refrigerador (dura hasta 2 semanas).</li>
                      <li>Para servir: Vaso con hielo, 100ml de concentrado + 100ml de agua/leche.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};
