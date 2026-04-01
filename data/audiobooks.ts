export interface AudiobookChapter {
  id: string;
  title: string;
  titleEn?: string;
  duration: string;
  content: string;
  contentEn?: string;
  quiz: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
  quizEn?: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
  task: string;
  taskEn?: string;
}

export interface AudiobookCategory {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  icon: string;
  color: string;
  chapters: AudiobookChapter[];
}


export const audiobooksData: AudiobookCategory[] = [
  {
    id: 'green-coffee',
    title: 'Café Verde',
    titleEn: 'Green Coffee',
    description: 'Materia prima, botánica, procesamiento, química y evaluación del grano antes del tueste.',
    descriptionEn: 'Raw material, botany, processing, chemistry and evaluation of the bean before roasting.',
    icon: 'Leaf',
    color: 'text-emerald-500',
    chapters: [
      {
        id: 'gc-1',
        title: 'Capítulo 1: Introducción al Café Verde — El Origen del Potencial',
        titleEn: 'Chapter 1: Introduction to Green Coffee — The Origin of Potential',
        duration: '18:00',
        content: `Antes del aroma. Antes del sabor. Antes incluso del calor que transforma.

Existe el café verde.

Silencioso. Denso. Inmutable a simple vista. Pero en su interior, contiene una complejidad extraordinaria: una matriz biológica y química que define todo lo que el café puede llegar a ser.

El café verde no es un producto terminado. Es una materia prima viva, el resultado de una cadena de procesos que comienza en la planta y se detiene justo antes del tueste. En este punto, el grano ha sido cultivado, recolectado, procesado y secado, pero aún no ha sido transformado por el calor. Todo su potencial permanece contenido.

Para el observador casual, un lote de café verde puede parecer uniforme, incluso simple. Sin embargo, para el profesional, cada grano es una unidad de información. Su color, su densidad, su estructura y su composición interna son indicadores de decisiones tomadas mucho antes: en la finca, durante la cosecha, en el procesamiento y en el secado.

El café verde es, por tanto, un registro físico de su historia.

Una historia escrita en variables: altitud, variedad, clima, manejo agronómico, método de procesamiento. Cada una de estas condiciones deja una huella medible, observable y, sobre todo, interpretable.

Leer un lote de café verde requiere entender su uniformidad como señal de consistencia, sus defectos como evidencia de fallas, y su humedad como indicador de estabilidad.

Desde una perspectiva estructural, el café verde es una semilla compuesta por capas celulares complejas y una matriz de compuestos químicos: carbohidratos, ácidos orgánicos, proteínas, lípidos y alcaloides, todos interactuando en equilibrio.

Este equilibrio es frágil. El café verde es higroscópico: interactúa constantemente con su entorno, absorbiendo o liberando humedad según las condiciones ambientales. También es químicamente activo: sus compuestos pueden degradarse si no se almacena correctamente.

Para el tostador, el café verde representa el punto de partida y también una limitación: ningún perfil de tueste puede crear calidad donde no existe. Solo puede desarrollar lo que ya está presente.

Este audiolibro está construido sobre esa premisa: entender el café verde no como una etapa previa al tueste, sino como un sistema completo en sí mismo.`,
        contentEn: `Before the aroma. Before the flavor. Before even the heat that transforms.

There is green coffee.

Silent. Dense. Seemingly unchanged to the naked eye. But inside, it holds an extraordinary complexity: a biological and chemical matrix that defines everything coffee can become.

Green coffee is not a finished product. It is a living raw material, the result of a chain of processes that begins at the plant and stops just before roasting. At this point, the bean has been cultivated, harvested, processed and dried, but has not yet been transformed by heat. All its potential remains contained.

For the casual observer, a lot of green coffee may look uniform, even simple. But to the professional, each bean is a unit of information. Its color, density, structure and internal composition are indicators of decisions made much earlier: on the farm, during harvest, in processing and drying.

Green coffee is, therefore, a physical record of its history.

A history written in variables: altitude, variety, climate, agronomic management, processing method. Each of these conditions leaves a measurable, observable and, above all, interpretable mark.

Reading a lot of green coffee requires understanding its uniformity as a signal of consistency, its defects as evidence of failures, and its moisture as an indicator of stability.

From a structural perspective, green coffee is a seed composed of complex cellular layers and a matrix of chemical compounds: carbohydrates, organic acids, proteins, lipids and alkaloids, all interacting in balance.

This balance is fragile. Green coffee is hygroscopic: it constantly interacts with its environment, absorbing or releasing moisture according to ambient conditions. It is also chemically active: its compounds can degrade if not stored correctly.

For the roaster, green coffee represents both the starting point and a limitation: no roasting profile can create quality where none exists. It can only develop what is already present.

This audiobook is built on that premise: understanding green coffee not as a preliminary stage before roasting, but as a complete system in itself.`,
        quiz: [
          { question: '¿Qué es el café verde fundamentalmente?', options: ['Un producto terminado listo para consumir', 'Una materia prima viva antes del tueste', 'Un tipo de variedad de café', 'Café que no ha madurado correctamente'], correctAnswer: 1 },
          { question: '¿Qué significa que el café verde es "higroscópico"?', options: ['Que tiene alta cafeína', 'Que es resistente al calor', 'Que absorbe o libera humedad con el entorno', 'Que tiene mayor densidad que el tostado'], correctAnswer: 2 },
          { question: '¿Qué puede hacer el tueste con un café verde de baja calidad?', options: ['Mejorar su calidad completamente', 'Solo desarrollar lo que ya está presente en el grano', 'Eliminar todos los defectos del origen', 'Crear nuevos sabores independientemente del origen'], correctAnswer: 1 }
        ],
        quizEn: [
          { question: 'What is green coffee fundamentally?', options: ['A finished product ready to consume', 'A living raw material before roasting', 'A type of coffee variety', 'Coffee that has not matured correctly'], correctAnswer: 1 },
          { question: 'What does it mean that green coffee is "hygroscopic"?', options: ['That it has high caffeine', 'That it is heat resistant', 'That it absorbs or releases moisture with the environment', 'That it has higher density than roasted coffee'], correctAnswer: 2 },
          { question: 'What can roasting do with low quality green coffee?', options: ['Completely improve its quality', 'Only develop what is already present in the bean', 'Eliminate all origin defects', 'Create new flavors regardless of origin'], correctAnswer: 1 }
        ],
        task: 'Observa con detalle un puñado de café verde. Anota: ¿Es uniforme en color y tamaño? ¿Ves granos más claros que otros? ¿Huele a algo en particular? Documenta tus observaciones.',
        taskEn: 'Closely observe a handful of green coffee. Note: Is it uniform in color and size? Do you see lighter beans? Does it smell like anything in particular? Document your observations.'
      },
      {
        id: 'gc-2',
        title: 'Capítulo 2: Botánica y Variedades del Café — El Árbol y su Genética',
        titleEn: 'Chapter 2: Coffee Botany and Varieties — The Tree and Its Genetics',
        duration: '14:30',
        content: `El café pertenece a la familia Rubiaceae, género Coffea. Existen más de 120 especies identificadas, pero solo dos dominan el comercio mundial: Coffea arabica y Coffea canephora (Robusta).

El Arábica representa el 60-70% de la producción global. Crece entre 600 y 2000 msnm, requiere climas frescos con temperaturas de 15 a 24°C, y es autocompatible (puede fecundarse a sí misma). Tiene menor contenido de cafeína que el Robusta (1.2-1.5%) y produce perfiles de sabor más complejos, florales y frutales. Es también más sensible a plagas y enfermedades.

El Robusta crece entre 0 y 800 msnm, tolera temperaturas más altas (24-30°C) y requiere polinización cruzada. Su nombre refleja su resistencia genética. Contiene casi el doble de cafeína (2-2.7%) y produce sabores más pesados, terrosos y amargos.

Dentro del Arábica, las variedades son el resultado de siglos de mutaciones naturales, hibridaciones y selecciones:

- Typica: La variedad madre. Grano grande, perfil limpio y delicado. Bajo rendimiento.
- Bourbon: Mutación de Typica. Mayor dulzor y cuerpo. Origen: Isla Borbón (hoy Reunión).
- Caturra: Mutación de Bourbon. Más compacta, mayor rendimiento, perfil brillante.
- Gesha/Geisha: Origen etíope. Perfil extraordinariamente floral, jazmín, bergamota. Alta demanda y precio.
- Pacamara: Híbrido de Pacas y Maragogipe. Grano gigante, acidez compleja.
- SL28 y SL34: Selecciones kenianas. Acidez de grosella negra, cuerpo intenso.

Comprender la variedad de un café es indispensable para predecir su comportamiento en el tueste y su potencial en taza. La genética no lo determina todo, pero establece el límite máximo de lo que es posible alcanzar.`,
        contentEn: `Coffee belongs to the Rubiaceae family, genus Coffea. Over 120 species have been identified, but only two dominate world trade: Coffea arabica and Coffea canephora (Robusta).

Arabica accounts for 60-70% of global production. It grows between 600 and 2000 meters above sea level, requires cool climates with temperatures of 15-24°C, and is self-compatible (can fertilize itself). It has lower caffeine content than Robusta (1.2-1.5%) and produces more complex, floral and fruity flavor profiles. It is also more susceptible to pests and diseases.

Robusta grows between 0 and 800 meters above sea level, tolerates higher temperatures (24-30°C) and requires cross-pollination. Its name reflects its genetic resilience. It contains almost twice the caffeine (2-2.7%) and produces heavier, earthier, more bitter flavors.

Within Arabica, varieties are the result of centuries of natural mutations, hybridizations and selections:

- Typica: The mother variety. Large bean, clean and delicate profile. Low yield.
- Bourbon: Typica mutation. Greater sweetness and body. Origin: Bourbon Island (now Réunion).
- Caturra: Bourbon mutation. More compact, higher yield, bright profile.
- Gesha/Geisha: Ethiopian origin. Extraordinarily floral profile: jasmine, bergamot. High demand and price.
- Pacamara: Pacas and Maragogipe hybrid. Giant bean, complex acidity.
- SL28 and SL34: Kenyan selections. Blackcurrant acidity, intense body.

Understanding the variety of a coffee is essential to predict its behavior in roasting and its potential in the cup. Genetics doesn't determine everything, but it establishes the maximum limit of what is possible to achieve.`,
        quiz: [
          { question: '¿Cuál es la diferencia de cafeína entre Arábica y Robusta?', options: ['Son iguales', 'Arábica tiene más cafeína', 'Robusta tiene casi el doble de cafeína', 'Depende del origen'], correctAnswer: 2 },
          { question: '¿Qué variedad es conocida por su perfil floral de jazmín y bergamota?', options: ['Typica', 'Caturra', 'Bourbon', 'Gesha'], correctAnswer: 3 },
          { question: '¿A qué altitud crece típicamente el café Arábica?', options: ['0-400 msnm', '600-2000 msnm', '2000-4000 msnm', 'Cualquier altitud'], correctAnswer: 1 }
        ],
        quizEn: [
          { question: 'What is the caffeine difference between Arabica and Robusta?', options: ['They are equal', 'Arabica has more caffeine', 'Robusta has almost double the caffeine', 'Depends on origin'], correctAnswer: 2 },
          { question: 'Which variety is known for its floral jasmine and bergamot profile?', options: ['Typica', 'Caturra', 'Bourbon', 'Gesha'], correctAnswer: 3 },
          { question: 'At what altitude does Arabica coffee typically grow?', options: ['0-400 masl', '600-2000 masl', '2000-4000 masl', 'Any altitude'], correctAnswer: 1 }
        ],
        task: 'Identifica qué variedad o variedades estás usando actualmente en tu cafetería. Documenta su origen, altitud de cultivo y qué características sensoriales son esperables según su genética.',
        taskEn: 'Identify which variety or varieties you are currently using in your coffee shop. Document their origin, growing altitude and what sensory characteristics are expected from their genetics.'
      },
      {
        id: 'gc-3',
        title: 'Capítulo 3: Origen, Terroir y Factores de Producción — La Tierra que Habla',
        titleEn: 'Chapter 3: Origin, Terroir and Production Factors — The Land that Speaks',
        duration: '13:45',
        content: `El concepto de "terroir", tomado del mundo del vino, es igualmente válido para el café. Hace referencia al conjunto de condiciones ambientales y geográficas que influyen en el sabor de un producto agrícola: altitud, suelo, clima, temperatura, luminosidad y precipitaciones.

La altitud es uno de los factores más determinantes. A mayor altitud, las temperaturas nocturnas son más bajas, lo que ralentiza el desarrollo del fruto de café. Este proceso más lento permite una mayor acumulación de azúcares y ácidos orgánicos complejos en el grano, resultando en perfiles más dulces y complejos.

Los suelos volcánicos, ricos en minerales y bien drenados, son ideales para el café. Países como Etiopía, Colombia, Costa Rica y Guatemala, con suelos de origen volcánico y altitudes elevadas, producen cafés de perfiles excepcionalmente complejos.

Los principales orígenes productores y sus perfiles típicos:

África: Etiopía produce los Arábicas más antiguos. Perfiles florales, frutales (bayas, jazmín, durazno). El origen del Arábica silvestre. Yirgacheffe, Sidama y Guji son sus regiones más reconocidas. Kenia produce con variedades SL28 y SL34: acidez de grosella negra y cuerpo intenso.

América Latina: Colombia (acidez cítrica, caramelo), Guatemala (chocolate, frutos secos), Perú (acidez media, dulzor limpio), Panamá (hogar del Gesha más valorado del mundo).

Asia-Pacífico: Sumatra (cuerpo terroso, especias), Papúa Nueva Guinea (frutal y silvestre), Yemen (perfil afrutado y oscuro, origen histórico del café como bebida).

El origen no es solo una etiqueta geográfica: es un conjunto de variables que se manifiestan directamente en la taza.`,
        contentEn: `The concept of "terroir," borrowed from the wine world, is equally valid for coffee. It refers to the set of environmental and geographical conditions that influence the flavor of an agricultural product: altitude, soil, climate, temperature, light and rainfall.

Altitude is one of the most determining factors. At higher altitudes, nighttime temperatures are lower, which slows the development of the coffee fruit. This slower process allows greater accumulation of sugars and complex organic acids in the bean, resulting in sweeter and more complex profiles.

Volcanic soils, rich in minerals and well-drained, are ideal for coffee. Countries like Ethiopia, Colombia, Costa Rica and Guatemala, with volcanic soils and high altitudes, produce coffees with exceptionally complex profiles.

Main producing origins and their typical profiles:

Africa: Ethiopia produces the oldest Arabicas. Floral, fruity profiles (berries, jasmine, peach). The origin of wild Arabica. Yirgacheffe, Sidama and Guji are its most recognized regions. Kenya produces with SL28 and SL34 varieties: blackcurrant acidity and intense body.

Latin America: Colombia (citric acidity, caramel), Guatemala (chocolate, nuts), Peru (medium acidity, clean sweetness), Panama (home of the world's most valued Gesha).

Asia-Pacific: Sumatra (earthy body, spices), Papua New Guinea (fruity and wild), Yemen (fruity and dark profile, historical origin of coffee as a beverage).

Origin is not just a geographic label: it is a set of variables that manifest directly in the cup.`,
        quiz: [
          { question: '¿Por qué los cafés de alta altitud suelen ser más complejos?', options: ['Porque tienen más cafeína', 'Porque el proceso de maduración es más lento, acumulando más azúcares', 'Porque se procesan diferente', 'Porque el suelo tiene más minerales'], correctAnswer: 1 },
          { question: '¿Qué región africana es conocida por perfiles de grosella negra?', options: ['Etiopía - Yirgacheffe', 'Kenia (SL28/SL34)', 'Ruanda', 'Burundi'], correctAnswer: 1 },
          { question: '¿Qué tipo de suelo es considerado ideal para el cultivo del café?', options: ['Arcilloso y húmedo', 'Volcánico, mineral y bien drenado', 'Arenoso y seco', 'Rico en cal'], correctAnswer: 1 }
        ],
        quizEn: [
          { question: 'Why are high altitude coffees usually more complex?', options: ['Because they have more caffeine', 'Because the ripening process is slower, accumulating more sugars', 'Because they are processed differently', 'Because the soil has more minerals'], correctAnswer: 1 },
          { question: 'Which African region is known for blackcurrant profiles?', options: ['Ethiopia - Yirgacheffe', 'Kenya (SL28/SL34)', 'Rwanda', 'Burundi'], correctAnswer: 1 },
          { question: 'What type of soil is considered ideal for coffee cultivation?', options: ['Clay and humid', 'Volcanic, mineral and well-drained', 'Sandy and dry', 'Rich in lime'], correctAnswer: 1 }
        ],
        task: 'Elige dos cafés de diferentes orígenes que tengas disponibles. Prepáralos con el mismo método y ratio. Compara y documenta las diferencias en acidez, cuerpo y notas aromáticas.',
        taskEn: 'Choose two coffees from different origins that you have available. Brew them with the same method and ratio. Compare and document the differences in acidity, body and aromatic notes.'
      },
      {
        id: 'gc-4',
        title: 'Capítulo 4: Procesamiento del Café (Postcosecha) — De la Cereza al Grano',
        titleEn: 'Chapter 4: Coffee Processing (Post-harvest) — From Cherry to Bean',
        duration: '16:00',
        content: `Una vez que la cereza de café alcanza su punto óptimo de maduración, debe ser procesada para extraer la semilla (el grano verde). El método de procesamiento es quizás la variable más influyente en el perfil de sabor después del origen y la variedad.

Proceso Lavado (Washed): Se remueve la piel y pulpa mecánicamente. Los granos cubiertos de mucílago se fermentan en tanques con agua para que los microorganismos degraden el mucílago restante. Se lavan y secan. Este proceso resalta la acidez, claridad y las notas intrínsecas de la variedad. El terroir y la genética hablan con mayor claridad en un lavado bien ejecutado.

Proceso Natural (Seco): Las cerezas enteras se secan al sol en patios o camas africanas durante 3-6 semanas. El grano absorbe los azúcares y compuestos de la fruta fermentada. El resultado es un café con cuerpo pesado, dulzor intenso y notas a frutas maduras, bayas, vino o chocolate frutal. Requiere condiciones climáticas controladas para evitar sobre-fermentación.

Proceso Honey (Miel): Punto intermedio. Se remueve la piel pero se deja parte del mucílago durante el secado. Según la cantidad de mucílago restante: White Honey (muy poco), Yellow Honey, Red Honey y Black Honey (mucílago completo). Mayor mucílago = mayor dulzor, cuerpo y complejidad fermentativa.

Procesos Experimentales: Fermentación anaeróbica (sin oxígeno, intensifica ésteres frutales), maceración carbónica (técnica del vino), fermentación controlada con levaduras específicas. Crean perfiles únicos, a veces controversiales en círculos de especialidad.

La trazabilidad del procesamiento es fundamental: saber exactamente cómo fue procesado un café permite predecir su comportamiento en el molino y en la taza.`,
        contentEn: `Once the coffee cherry reaches its optimal ripeness, it must be processed to extract the seed (the green bean). The processing method is perhaps the most influential variable in flavor profile after origin and variety.

Washed Process: The skin and pulp are mechanically removed. The mucilage-covered beans are fermented in water tanks so microorganisms break down the remaining mucilage. They are then washed and dried. This process highlights acidity, clarity and the intrinsic notes of the variety. Terroir and genetics speak more clearly in a well-executed washed coffee.

Natural Process (Dry): Whole cherries are sun-dried on patios or raised beds for 3-6 weeks. The bean absorbs sugars and compounds from the fermenting fruit. The result is a coffee with heavy body, intense sweetness and notes of ripe fruit, berries, wine or fruity chocolate. Requires controlled climatic conditions to avoid over-fermentation.

Honey Process: An intermediate step. The skin is removed but part of the mucilage is left during drying. Depending on the amount of remaining mucilage: White Honey (very little), Yellow Honey, Red Honey and Black Honey (full mucilage). More mucilage = more sweetness, body and fermentative complexity.

Experimental Processes: Anaerobic fermentation (no oxygen, intensifies fruity esters), carbonic maceration (wine technique), controlled fermentation with specific yeasts. They create unique profiles, sometimes controversial in specialty circles.

Process traceability is fundamental: knowing exactly how a coffee was processed allows predicting its behavior in the grinder and in the cup.`,
        quiz: [
          { question: '¿Qué proceso suele resaltar más la acidez y la claridad en taza?', options: ['Natural', 'Lavado', 'Honey', 'Anaeróbico'], correctAnswer: 1 },
          { question: '¿En el proceso Honey, qué determina si es White, Yellow, Red o Black?', options: ['El tipo de cereza usada', 'La cantidad de mucílago restante durante el secado', 'El tiempo de fermentación en agua', 'El origen geográfico'], correctAnswer: 1 },
          { question: '¿En qué proceso se seca la cereza completa con toda la fruta?', options: ['Lavado', 'Honey', 'Natural', 'Carbónico'], correctAnswer: 2 }
        ],
        quizEn: [
          { question: 'Which process usually highlights more acidity and clarity in the cup?', options: ['Natural', 'Washed', 'Honey', 'Anaerobic'], correctAnswer: 1 },
          { question: 'In the Honey process, what determines if it is White, Yellow, Red or Black?', options: ['The type of cherry used', 'The amount of mucilage remaining during drying', 'The fermentation time in water', 'The geographic origin'], correctAnswer: 1 },
          { question: 'In which process is the complete cherry dried with all the fruit?', options: ['Washed', 'Honey', 'Natural', 'Carbonic'], correctAnswer: 2 }
        ],
        task: 'Si tienes acceso a café verde procesado de diferentes métodos (lavado, natural, honey), examínalos visualmente y compara el color y la textura de la superficie. Documenta las diferencias.',
        taskEn: 'If you have access to green coffee processed by different methods (washed, natural, honey), examine them visually and compare the color and surface texture. Document the differences.'
      },
      {
        id: 'gc-5',
        title: 'Capítulo 5: Secado, Almacenamiento y Estabilidad — Preservar el Potencial',
        titleEn: 'Chapter 5: Drying, Storage and Stability — Preserving the Potential',
        duration: '12:30',
        content: `El secado es la etapa que fija la calidad del café verde. El objetivo es reducir la humedad del grano desde aproximadamente el 50-60% (recién procesado) hasta el rango óptimo de 10-12%. Este proceso debe realizarse de forma lenta, uniforme y controlada.

Métodos de secado:

Secado al sol: El más tradicional. Las cerezas o granos se extienden en camas africanas elevadas o patios de cemento y se voltean regularmente para asegurar un secado uniforme. Puede durar 2-6 semanas dependiendo del clima.

Secado mecánico: Usa máquinas con aire caliente para acelerar el proceso. Requiere control preciso de temperatura (máximo 40-45°C) para no dañar los compuestos aromáticos. Se usa frecuentemente como complemento al secado solar.

Secado en silos: Grandes volúmenes de café se almacenan en silos con circulación de aire controlada. Permite mayor consistencia para comercio a escala.

El rango óptimo de humedad es 10-12% (Agtron Standard). Por encima de 12.5% el grano es susceptible a hongos (Ochratoxina A). Por debajo del 9%, el grano se vuelve frágil, pierde aceites esenciales y se sobre-oxida.

Almacenamiento correcto:
- Temperatura estable: 15-20°C idealmente
- Humedad relativa: 50-70%
- Contenedores herméticos o sacos GrainPro
- Alejado de luz directa, olores fuertes y suelos húmedos
- Rotación FIFO (primero en entrar, primero en salir)

El café verde bien almacenado puede mantener su calidad por 12-24 meses. Un mal almacenamiento puede arruinar en semanas un café de origen excepcional.`,
        contentEn: `Drying is the stage that fixes green coffee quality. The goal is to reduce bean moisture from approximately 50-60% (freshly processed) to the optimal range of 10-12%. This process must be done slowly, uniformly and in a controlled manner.

Drying methods:

Sun drying: The most traditional. Cherries or beans are spread on raised African beds or concrete patios and turned regularly to ensure uniform drying. Can last 2-6 weeks depending on the climate.

Mechanical drying: Uses machines with hot air to speed up the process. Requires precise temperature control (maximum 40-45°C) to avoid damaging aromatic compounds. Often used as a complement to solar drying.

Silo drying: Large volumes of coffee are stored in silos with controlled air circulation. Allows greater consistency for large-scale commerce.

The optimal moisture range is 10-12% (Agtron Standard). Above 12.5% the bean is susceptible to mold (Ochratoxin A). Below 9%, the bean becomes fragile, loses essential oils and over-oxidizes.

Correct storage:
- Stable temperature: ideally 15-20°C
- Relative humidity: 50-70%
- Airtight containers or GrainPro bags
- Away from direct light, strong odors and damp floors
- FIFO rotation (first in, first out)

Well-stored green coffee can maintain its quality for 12-24 months. Poor storage can ruin an exceptional origin coffee in weeks.`,
        quiz: [
          { question: '¿Cuál es el rango óptimo de humedad para el café verde almacenado?', options: ['5-8%', '10-12%', '15-18%', '20-25%'], correctAnswer: 1 },
          { question: '¿Qué riesgo existe si el café verde tiene más del 12.5% de humedad?', options: ['Se sobre-extrae en el espresso', 'Crece moho y hongos como Ochratoxina A', 'Pierde cafeína', 'Se vuelve demasiado denso'], correctAnswer: 1 },
          { question: '¿Qué temperatura máxima se recomienda en el secado mecánico para no dañar los aromáticos?', options: ['20-25°C', '40-45°C', '60-70°C', '80°C'], correctAnswer: 1 }
        ],
        quizEn: [
          { question: 'What is the optimal moisture range for stored green coffee?', options: ['5-8%', '10-12%', '15-18%', '20-25%'], correctAnswer: 1 },
          { question: 'What risk exists if green coffee has more than 12.5% moisture?', options: ['It over-extracts in espresso', 'Mold and fungi grow like Ochratoxin A', 'It loses caffeine', 'It becomes too dense'], correctAnswer: 1 },
          { question: 'What maximum temperature is recommended in mechanical drying to not damage aromatics?', options: ['20-25°C', '40-45°C', '60-70°C', '80°C'], correctAnswer: 1 }
        ],
        task: 'Revisa el café verde que tienes en tu local o bodega. ¿Cómo está almacenado? ¿Tiene medición de humedad? ¿Está en contenedor hermético? Evalúa y mejora las condiciones si es necesario.',
        taskEn: 'Check the green coffee you have in your shop or warehouse. How is it stored? Does it have moisture measurement? Is it in an airtight container? Evaluate and improve conditions if necessary.'
      },
      {
        id: 'gc-6',
        title: 'Capítulo 6: Composición Química del Café Verde — Lo Invisible que Define el Sabor',
        titleEn: 'Chapter 6: Chemical Composition of Green Coffee — The Invisible that Defines Flavor',
        duration: '15:00',
        content: `El café verde es uno de los sistemas químicos más complejos del mundo natural. Su composición determina directamente lo que sucederá en el tueste y, en última instancia, en taza.

Principales grupos de compuestos:

Carbohidratos (50-55% del peso seco): Azúcares simples (sacarosa principalmente), polisacáridos y fibra. Los azúcares son los principais sustratos para la reacción de Maillard y la caramelización durante el tueste, generando la dulzura y el color marrón. A mayor concentración de sacarosa, mayor potencial de dulzor en taza.

Ácidos Clorogénicos (6-10%): Son los antioxidantes más abundantes del café verde. Precursores del sabor ácido y de algunos compuestos amargos. Durante el tueste se degradan y transforman en otros ácidos (quínico, caféico). El café Arábica tiene menos ácidos clorogénicos que el Robusta.

Proteínas y aminoácidos (8-12%): Participan en la reacción de Maillard junto con los azúcares. Sus interacciones crean cientos de compuestos aromáticos volátiles que definen el aroma del café.

Cafeína (1-2.5%): Alcaloide responsable del efecto estimulante. Resiste el tueste y se mantiene estable en amplio rango de temperaturas. El Arábica tiene 1.2-1.5%, el Robusta 2-2.7%.

Lípidos (10-15%): Aceites esenciales concentrados principalmente en el centro del grano. Protegen los compuestos aromáticos volátiles y contribuyen a la textura del espresso. Se degradan con el tiempo (rancidez) si el café no se almacena correctamente.

Agua (10-12% en verde): Su presencia es crítica para la dinámica del tueste. El vapor de agua generado internamente es el responsable del Primer Crack.

Entender esta matriz química es entender por qué el café se comporta como se comporta en cada etapa del proceso.`,
        contentEn: `Green coffee is one of the most chemically complex systems in the natural world. Its composition directly determines what will happen during roasting and ultimately in the cup.

Main compound groups:

Carbohydrates (50-55% dry weight): Simple sugars (mainly sucrose), polysaccharides and fiber. Sugars are the main substrates for the Maillard reaction and caramelization during roasting, generating sweetness and brown color. Higher sucrose concentration = higher sweetness potential in the cup.

Chlorogenic Acids (6-10%): The most abundant antioxidants in green coffee. Precursors of sour flavor and some bitter compounds. During roasting they degrade and transform into other acids (quinic, caffeic). Arabica coffee has fewer chlorogenic acids than Robusta.

Proteins and amino acids (8-12%): They participate in the Maillard reaction together with sugars. Their interactions create hundreds of volatile aromatic compounds that define coffee aroma.

Caffeine (1-2.5%): Alkaloid responsible for the stimulating effect. Resists roasting and remains stable over a wide temperature range. Arabica has 1.2-1.5%, Robusta 2-2.7%.

Lipids (10-15%): Essential oils concentrated mainly in the center of the bean. They protect volatile aromatic compounds and contribute to espresso texture. They degrade over time (rancidity) if coffee is not stored correctly.

Water (10-12% in green): Its presence is critical for roasting dynamics. The internally generated steam is responsible for the First Crack.

Understanding this chemical matrix is understanding why coffee behaves the way it does at each stage of the process.`,
        quiz: [
          { question: '¿Qué compuesto del café verde es el principal sustrato para la reacción de Maillard?', options: ['Cafeína', 'Sacarosa (azúcares)', 'Ácidos clorogénicos', 'Lípidos'], correctAnswer: 1 },
          { question: '¿Qué grupo de compuestos genera el vapor que causa el Primer Crack?', options: ['Los lípidos', 'Los ácidos clorogénicos', 'El agua interna del grano', 'La cafeína'], correctAnswer: 2 },
          { question: '¿Por qué los lípidos del café verde son importantes?', options: ['Generan cafeína durante el tueste', 'Protegen los aromáticos volátiles y aportan textura al espresso', 'Causan la coloración marrón del tueste', 'Son los responsables de la acidez en taza'], correctAnswer: 1 }
        ],
        quizEn: [
          { question: 'Which green coffee compound is the main substrate for the Maillard reaction?', options: ['Caffeine', 'Sucrose (sugars)', 'Chlorogenic acids', 'Lipids'], correctAnswer: 1 },
          { question: 'Which compound group generates the steam that causes the First Crack?', options: ['Lipids', 'Chlorogenic acids', 'Internal water of the bean', 'Caffeine'], correctAnswer: 2 },
          { question: 'Why are green coffee lipids important?', options: ['They generate caffeine during roasting', 'They protect volatile aromatics and contribute to espresso texture', 'They cause the brown color of roasting', 'They are responsible for acidity in the cup'], correctAnswer: 1 }
        ],
        task: 'Investiga el porcentaje de sacarosa de dos orígenes diferentes que tengas acceso. ¿Existe correlación entre la concentración de azúcar y el dulzor percibido en taza?',
        taskEn: 'Research the sucrose percentage of two different origins you have access to. Is there a correlation between sugar concentration and perceived sweetness in the cup?'
      },
      {
        id: 'gc-7',
        title: 'Capítulo 7: Evaluación Física del Café Verde — Leer el Grano',
        titleEn: 'Chapter 7: Physical Evaluation of Green Coffee — Reading the Bean',
        duration: '13:00',
        content: `La evaluación física del café verde es la primera línea de control de calidad antes del tueste. Permite identificar problemas de procesamiento, almacenamiento y selección que impactarán directamente en la taza.

Parámetros principales de evaluación:

Color: Un café verde de calidad debe tener un color verde azulado o verde grisáceo uniforme. Granos amarillentos indican envejecimiento. Granos más oscuros pueden indicar sobre-fermentación. La falta de uniformidad de color en el lote señala secado o almacenamiento irregular.

Olor: El café verde reciente tiene un olor característico fresco, herbáceo o vegetal. Olores a tierra, moho, vinagre o rancio son señales de alarma que indican problemas de fermentación, secado o almacenamiento.

Densidad: Los cafés de alta altitud y largo proceso de maduración tienden a ser más densos. Un grano denso absorbe calor de forma diferente durante el tueste, generalmente produciendo perfiles más complejos. La densidad se puede estimar manualmente o medirse con un densímetro.

Humedad: El rango óptimo es 10-12%. Se mide con un medidor de humedad. Un café con humedad fuera de rango compromete la extracción y el perfil en taza.

Screen size (tamaño): Los granos se clasifican por tamaño en screens (mallas) del 8 al 20, donde el número indica el diámetro en 64 avos de pulgada. Uniformidad de tamaño = uniformidad de tueste.

Examen visual general: Buscar granos partidos, granos negros, granos con manchas, materia extraña (piedras, palos), y quakers (granos inmaduros que se ven pálidos incluso después del tueste).

Una evaluación física rigurosa puede predecir en gran medida el comportamiento del café en el tostador, antes de prueba alguna.`,
        contentEn: `Physical evaluation of green coffee is the first line of quality control before roasting. It allows identifying processing, storage and selection problems that will directly impact the cup.

Main evaluation parameters:

Color: A quality green coffee should have a uniform blue-green or gray-green color. Yellowish beans indicate aging. Darker beans may indicate over-fermentation. Lack of color uniformity in the lot signals irregular drying or storage.

Smell: Fresh green coffee has a characteristic fresh, herbaceous or vegetable smell. Earthy, moldy, vinegary or rancid odors are warning signs indicating problems with fermentation, drying or storage.

Density: High altitude coffees with long ripening processes tend to be denser. A dense bean absorbs heat differently during roasting, generally producing more complex profiles. Density can be estimated manually or measured with a densimeter.

Moisture: The optimal range is 10-12%. Measured with a moisture meter. Coffee with moisture outside this range compromises extraction and the cup profile.

Screen size: Beans are classified by size on screens (meshes) from 8 to 20, where the number indicates diameter in 64ths of an inch. Size uniformity = roast uniformity.

General visual examination: Look for broken beans, black beans, spotted beans, foreign matter (stones, sticks), and quakers (immature beans that appear pale even after roasting).

A rigorous physical evaluation can largely predict coffee behavior in the roaster before any cupping.`,
        quiz: [
          { question: '¿Qué color indica óptima calidad en el café verde?', options: ['Amarillo brillante', 'Verde azulado o verde grisáceo uniforme', 'Marrón claro', 'Blanco opaco'], correctAnswer: 1 },
          { question: '¿Qué son los "quakers"?', options: ['Granos de tostado oscuro', 'Granos inmaduros que quedan pálidos', 'Granos de variedad especial', 'Granos de alta densidad'], correctAnswer: 1 },
          { question: '¿Por qué es importante la uniformidad de tamaño (screen) en el café verde?', options: ['Afecta el precio de compra', 'Asegura uniformidad de tueste al absorber calor igual', 'Determina el origen geográfico', 'Influye en el nivel de cafeína'], correctAnswer: 1 }
        ],
        quizEn: [
          { question: 'What color indicates optimal quality in green coffee?', options: ['Bright yellow', 'Uniform blue-green or gray-green', 'Light brown', 'Opaque white'], correctAnswer: 1 },
          { question: 'What are "quakers"?', options: ['Dark roasted beans', 'Immature beans that remain pale', 'Special variety beans', 'High density beans'], correctAnswer: 1 },
          { question: 'Why is size uniformity (screen) in green coffee important?', options: ['It affects the purchase price', 'It ensures roast uniformity by absorbing heat equally', 'It determines geographic origin', 'It influences caffeine level'], correctAnswer: 1 }
        ],
        task: 'Toma 100 granos de un lote de café verde. Clasifícalos en: uniformes, partidos, manchados, inmaduros (pálidos) y extraños. Calcula el porcentaje de cada categoría.',
        taskEn: 'Take 100 beans from a green coffee lot. Classify them as: uniform, broken, spotted, immature (pale) and foreign. Calculate the percentage of each category.'
      },
      {
        id: 'gc-8',
        title: 'Capítulo 8: Clasificación y Estándares del Café Verde — El Sistema de Calidad',
        titleEn: 'Chapter 8: Classification and Standards of Green Coffee — The Quality System',
        duration: '11:30',
        content: `La clasificación del café verde es el lenguaje común del comercio internacional. Permite comunicar calidad de forma objetiva entre productores, exportadores, importadores y tostadores, independientemente del idioma o la geografía.

Los principales sistemas de clasificación:

SCA (Specialty Coffee Association): Utiliza un sistema de puntuación de 0 a 100 basado en evaluación sensorial (cupping). Cafés con 80 puntos o más se consideran "de especialidad". La evaluación física pre-tueste exige un máximo de 5 defectos primarios y 0 defectos cuaternarios en 350 gramos de muestra para clasificar como especialidad.

ICO (International Coffee Organization): Clasifica por tipo de café (Arábica Suave Colombiano, Otros Arábicas Suaves, Arábicas Brasileños, Robustas) con base en origen e indicadores de calidad generales.

NY Grade / European Preparation: Sistemas de grading basados en número de defectos, tamaño de grano y destino de exportación.

Defectos en café verde (según SCA):
- Defectos Primarios (x1): Grano negro completo, grano fermentado, cereza seca, material extraño, grano dañado por hongos.
- Defectos Secundarios (x5 = 1 primario): Granos parcialmente negros, fragmentados, inmaduros (quakers), con daño por insectos, cáscara.

El número de defectos por lote determina directamente la clasificación: Grade 1 (0-3 defectos), Grade 2 (4-12), Grade 3 (13-25), hasta Grade 5 (48+ defectos).

Esta clasificación no solo afecta el precio: determina si un café puede llamarse "de especialidad" y bajo qué condiciones puede ser presentado a compradores internacionales.`,
        contentEn: `Green coffee classification is the common language of international trade. It allows objective quality communication between producers, exporters, importers and roasters, regardless of language or geography.

The main classification systems:

SCA (Specialty Coffee Association): Uses a 0-100 scoring system based on sensory evaluation (cupping). Coffees scoring 80 or above are considered "specialty." Pre-roast physical evaluation requires a maximum of 5 primary defects and 0 quaternary defects in a 350-gram sample to classify as specialty.

ICO (International Coffee Organization): Classifies by coffee type (Colombian Mild Arabica, Other Mild Arabicas, Brazilian Arabicas, Robustas) based on origin and general quality indicators.

NY Grade / European Preparation: Grading systems based on number of defects, bean size and export destination.

Green coffee defects (per SCA):
- Primary Defects (x1): Full black bean, fermented bean, dried cherry, foreign matter, mold-damaged bean.
- Secondary Defects (x5 = 1 primary): Partially black beans, broken beans, immature beans (quakers), insect-damaged beans, hull.

The number of defects per lot directly determines the classification: Grade 1 (0-3 defects), Grade 2 (4-12), Grade 3 (13-25), up to Grade 5 (48+ defects).

This classification not only affects price: it determines whether a coffee can call itself "specialty" and under what conditions it can be presented to international buyers.`,
        quiz: [
          { question: '¿Cuántos puntos mínimos necesita un café para clasificar como "de especialidad" según la SCA?', options: ['70 puntos', '75 puntos', '80 puntos', '90 puntos'], correctAnswer: 2 },
          { question: '¿Qué es un defecto "primario" en café verde según la SCA?', options: ['Un grano de tamaño pequeño', 'Un defecto grave como grano negro completo o fermentado', 'Un grano de otra variedad', 'Diferencia de color entre granos'], correctAnswer: 1 },
          { question: '¿Cuántos defectos secundarios equivalen a 1 defecto primario?', options: ['2', '3', '4', '5'], correctAnswer: 3 }
        ],
        quizEn: [
          { question: 'How many minimum points does a coffee need to classify as "specialty" per SCA?', options: ['70 points', '75 points', '80 points', '90 points'], correctAnswer: 2 },
          { question: 'What is a "primary" defect in green coffee per SCA?', options: ['A small sized bean', 'A serious defect like full black or fermented bean', 'A bean of another variety', 'Color difference between beans'], correctAnswer: 1 },
          { question: 'How many secondary defects equal 1 primary defect?', options: ['2', '3', '4', '5'], correctAnswer: 3 }
        ],
        task: 'Solicita muestras de café verde con su ficha de calidad SCA. Compara la puntuación del cupping con la evaluación física de defectos. ¿Hay correlación entre ambas?',
        taskEn: 'Request green coffee samples with their SCA quality sheet. Compare the cupping score with the physical defect evaluation. Is there a correlation between both?'
      },
      {
        id: 'gc-9',
        title: 'Capítulo 9: Defectos del Café Verde — Identificación y Causas',
        titleEn: 'Chapter 9: Green Coffee Defects — Identification and Causes',
        duration: '14:00',
        content: `Los defectos del café verde son el resultado visible de fallas ocurridas en cualquier punto de la cadena: cultivo, cosecha, procesamiento, secado o almacenamiento. Identificarlos es una habilidad fundamental para cualquier profesional del café.

Defectos por origen (en campo):
- Grano inmaduro (quaker): Cereza cosechada antes de madurar. Se distingue por su color más claro y consistencia esponjosa. En taza: astringente, resinoso, maní crudo.
- Grano negro: Sobremaduración o contacto prolongado con el suelo. En taza: fermentado, ácido agresivo, medicinal.
- Daño por insecto (broca): El Hypothenemus hampei perfora el grano dejando orificios pequeños. En taza: amargo, leñoso, sucio.

Defectos por procesamiento:
- Grano fermentado: Tiempo excesivo en fermentación o temperatura inadecuada. Olor penetrante y color oscuro irregular. En taza: vinagre, frutas putrefactas.
- Cereza seca (dried cherry): La cereza completa no fue removida correctamente. En taza: intensamente afrutado-fermentado, puede ser positivo (natural) o negativo (sobre-fermentado).
- Grano pelado (hull): Fragmentos de pergamino o cáscara adheridos. Indica despulpado deficiente.

Defectos por almacenamiento:
- Grano viejo/blanqueado: Pérdida gradual de aceites esenciales por oxidación. Color amarillento, olor a prado seco. En taza: plano, sin vida, leñoso.
- Daño por humedad/moho: Aspecto manchado o grisáceo. Olor a tierra húmeda. En taza: mohoso, terroso, medicinal.
- Daño por altas temperaturas: Grano deformado o quemado superficialmente en secado mecánico excesivo.

La identificación temprana de defectos permite tomar decisiones: rechazar un lote, negociar precios, ajustar el perfil de tueste para compensar o simplemente documentar para futura referencia.`,
        contentEn: `Green coffee defects are the visible result of failures that occurred at any point in the chain: cultivation, harvesting, processing, drying or storage. Identifying them is a fundamental skill for any coffee professional.

Field origin defects:
- Immature bean (quaker): Cherry harvested before ripening. Distinguished by its lighter color and spongy consistency. In cup: astringent, resinous, raw peanut.
- Black bean: Over-ripening or prolonged contact with the ground. In cup: fermented, aggressive acid, medicinal.
- Insect damage (coffee borer): Hypothenemus hampei bores into the bean leaving small holes. In cup: bitter, woody, dirty.

Processing defects:
- Fermented bean: Excessive fermentation time or inadequate temperature. Penetrating smell and irregular dark color. In cup: vinegar, putrid fruit.
- Dried cherry: The whole cherry was not correctly removed. In cup: intensely fruity-fermented, can be positive (natural) or negative (over-fermented).
- Hull: Parchment or husk fragments adhered. Indicates poor pulping.

Storage defects:
- Old/bleached bean: Gradual loss of essential oils through oxidation. Yellowish color, dry grass smell. In cup: flat, lifeless, woody.
- Moisture/mold damage: Spotted or grayish appearance. Damp earth smell. In cup: moldy, earthy, medicinal.
- High temperature damage: Deformed or superficially burned bean from excessive mechanical drying.

Early identification of defects allows making decisions: reject a lot, negotiate prices, adjust the roast profile to compensate or simply document for future reference.`,
        quiz: [
          { question: '¿Qué insecto causa el daño conocido como "broca" en el café?', options: ['Áfido del café', 'Hypothenemus hampei', 'Acarophagy coffea', 'Dermestes café'], correctAnswer: 1 },
          { question: '¿Qué defecto produce notas a vinagre y frutas putrefactas en taza?', options: ['Grano negro', 'Grano fermentado', 'Grano inmaduro', 'Daño por humedad'], correctAnswer: 1 },
          { question: '¿Cómo se distingue visualmente un grano inmaduro (quaker)?', options: ['Es más oscuro que los demás', 'Es más claro y de consistencia esponjosa', 'Tiene orificios de insecto', 'Tiene manchas negras'], correctAnswer: 1 }
        ],
        quizEn: [
          { question: 'Which insect causes the damage known as "coffee borer"?', options: ['Coffee aphid', 'Hypothenemus hampei', 'Acarophagy coffea', 'Dermestes coffee'], correctAnswer: 1 },
          { question: 'Which defect produces vinegar and putrid fruit notes in the cup?', options: ['Black bean', 'Fermented bean', 'Immature bean', 'Moisture damage'], correctAnswer: 1 },
          { question: 'How is an immature bean (quaker) visually distinguished?', options: ['It is darker than the others', 'It is lighter and has a spongy consistency', 'It has insect holes', 'It has black spots'], correctAnswer: 1 }
        ],
        task: 'Encuentra y fotografía al menos 3 tipos de defectos en un lote de café verde. Identifica su nombre, probable causa y cuál es el impacto esperado en taza.',
        taskEn: 'Find and photograph at least 3 types of defects in a green coffee lot. Identify their name, probable cause and what the expected impact in the cup would be.'
      },
      {
        id: 'gc-10',
        title: 'Capítulo 10: Logística, Transporte y Vida Útil — El Viaje del Café Verde',
        titleEn: 'Chapter 10: Logistics, Transport and Shelf Life — The Journey of Green Coffee',
        duration: '12:00',
        content: `El café verde recorre miles de kilómetros entre la finca y la tostadora. Cada etapa de este viaje representa una oportunidad para mantener o deteriorar la calidad que tanto esfuerzo costó construir en origen.

El embalaje adecuado:
- Sacos de yute: Tradicionales, permiten cierta transpirabilidad. Riesgo de absorción de olores externos y daño por humedad.
- GrainPro o Vacuum Pack: Bolsas herméticas que aislan el café de la humedad, los olores y el oxígeno. Estándar en café de especialidad. Pueden extender la vida útil del verde hasta 24-36 meses.
- Cajas de cartón doble con GrainPro interior: Solución común para lotes pequeños de microlotes de especialidad.

Transporte marítimo (el más común):
- Los contenedores deben estar a temperatura estable (15-20°C idealmente).
- Tiempo en tránsito: 2-6 semanas según el origen.
- Riesgo crítico: "Container rain" — condensación interna cuando el contenedor pasa de climas fríos a cálidos. El agua condensada cae sobre los sacos y puede arruinar el lote.
- Los contenedores refrigerados (reefer) son la opción premium para cafés de alta calidad.

Vida útil del café verde:
- Café recién procesado y bien embalado: 12-24 meses de vida óptima.
- Café con 18+ meses: Puede mostrar señales de envejecimiento (olor a madera, pérdida de acidez, color amarillento).
- "Aged coffee" o café envejecido intencional: Práctica controlada donde el café se envejece 3-8 años en condiciones específicas para desarrollar un perfil diferente, denso y terroso. Popular en India y para ciertos espressos italianos.

La logística del café verde no es solo un problema de transporte: es gestión de calidad. Cada decisión en esta cadena tiene consecuencias directas en lo que llegará a la tostadora y, finalmente, a la taza.`,
        contentEn: `Green coffee travels thousands of kilometers between the farm and the roaster. Each stage of this journey represents an opportunity to maintain or deteriorate the quality that took so much effort to build at origin.

Proper packaging:
- Jute bags: Traditional, allow some breathability. Risk of absorbing external odors and moisture damage.
- GrainPro or Vacuum Pack: Airtight bags that isolate coffee from moisture, odors and oxygen. Standard in specialty coffee. Can extend green shelf life up to 24-36 months.
- Double cardboard boxes with inner GrainPro: Common solution for small specialty microlot batches.

Maritime transport (the most common):
- Containers should be at stable temperature (ideally 15-20°C).
- Transit time: 2-6 weeks depending on origin.
- Critical risk: "Container rain" — internal condensation when the container passes from cold to warm climates. Condensed water falls on the bags and can ruin the lot.
- Refrigerated containers (reefer) are the premium option for high quality coffees.

Green coffee shelf life:
- Freshly processed and well-packaged coffee: 12-24 months optimal life.
- Coffee with 18+ months: May show aging signs (woody smell, loss of acidity, yellowish color).
- "Aged coffee" or intentionally aged coffee: Controlled practice where coffee is aged 3-8 years under specific conditions to develop a different, dense and earthy profile. Popular in India and for certain Italian espressos.

Green coffee logistics is not just a transportation problem: it is quality management. Each decision in this chain has direct consequences on what will arrive at the roaster and ultimately in the cup.`,
        quiz: [
          { question: '¿Qué es el "Container rain" en el transporte de café verde?', options: ['Lluvia que daña los contenedores', 'Condensación interna que moja los sacos de café', 'Sistema de humidificación activo', 'Técnica de enfriamiento del café'], correctAnswer: 1 },
          { question: '¿Cuánto puede extenderse la vida útil del café verde con embalaje GrainPro?', options: ['3-6 meses', '6-12 meses', '24-36 meses', '5+ años'], correctAnswer: 2 },
          { question: '¿Qué es el "Aged coffee"?', options: ['Café de origen antiguo', 'Café envejecido intencionalmente para desarrollar un perfil diferente', 'Café que pasó la fecha de caducidad', 'Café robusta de cosecha vieja'], correctAnswer: 1 }
        ],
        quizEn: [
          { question: 'What is "Container rain" in green coffee transport?', options: ['Rain that damages containers', 'Internal condensation that wets coffee bags', 'Active humidification system', 'Coffee cooling technique'], correctAnswer: 1 },
          { question: 'How long can green coffee shelf life be extended with GrainPro packaging?', options: ['3-6 months', '6-12 months', '24-36 months', '5+ years'], correctAnswer: 2 },
          { question: 'What is "Aged coffee"?', options: ['Coffee from an ancient origin', 'Intentionally aged coffee to develop a different profile', 'Coffee past its expiration date', 'Old harvest robusta coffee'], correctAnswer: 1 }
        ],
        task: 'Revisa la trazabilidad de un café verde que tengas. ¿Sabes cómo llegó? ¿En qué tipo de embalaje? ¿Cuánto tiempo tardó en llegar? ¿Cuánto tiempo lleva en bodega? Construye su "historia logística".',
        taskEn: 'Review the traceability of a green coffee you have. Do you know how it arrived? In what type of packaging? How long did it take to arrive? How long has it been in storage? Build its "logistics history".'
      }
    ]
  },
  {
    id: 'roasting',
    title: 'Tueste de Café',
    description: 'Curva de tueste, reacciones químicas, desarrollo y defectos.',
    icon: 'Flame',
    color: 'text-orange-500',
    chapters: [
      {
        id: 'rst-1',
        title: 'Capítulo 1: Las Fases del Tueste',
        duration: '18:10',
        content: `El tueste de café es el proceso de aplicar calor al grano verde para transformar sus precursores químicos en compuestos aromáticos y de sabor. Se divide en tres fases principales:

1. Fase de Secado (Drying Phase): Desde que el café entra a la máquina (Charge) hasta que el grano se vuelve amarillo (aprox. 150°C - 160°C). El grano verde contiene entre 10% y 12% de humedad. En esta fase, el calor evapora el agua y la presión interna comienza a aumentar. Olor a heno o pasto húmedo.

2. Fase de Reacción de Maillard (Maillard Phase): Inicia cuando el grano cambia de verde a amarillo/marrón claro. Aquí los azúcares reductores y los aminoácidos reaccionan, creando cientos de compuestos de sabor y melanoidinas (que dan el color marrón). El olor pasa de pasto a pan tostado o galletas. Esta fase es crítica para desarrollar el cuerpo y la complejidad.

3. Fase de Desarrollo (Development Phase): Comienza con el Primer Crack (First Crack), un chasquido audible causado por la liberación violenta de vapor de agua y dióxido de carbono. Aquí los azúcares se caramelizan, los ácidos se degradan y se define el perfil final (claro, medio, oscuro). El tiempo que el café pasa en esta fase (DTR - Development Time Ratio) determina el equilibrio entre acidez, dulzor y amargor.`,
        quiz: [
          {
            question: '¿Qué fase es responsable del cambio de color a marrón y la creación de la mayoría de compuestos de sabor?',
            options: ['Fase de Secado', 'Primer Crack', 'Fase de Maillard', 'Fase de Enfriamiento'],
            correctAnswer: 2
          },
          {
            question: '¿Qué evento marca el inicio de la Fase de Desarrollo?',
            options: ['Charge', 'Yellowing', 'Primer Crack', 'Segundo Crack'],
            correctAnswer: 2
          }
        ],
        task: 'Observa una curva de tueste en tu software (Artisan/Cropster). Identifica visualmente en el gráfico dónde empieza y termina cada una de las 3 fases.'
      },
      {
        id: 'rst-2',
        title: 'Capítulo 2: Defectos de Tueste',
        duration: '14:30',
        content: `Incluso con granos de excelente calidad, un mal tueste puede arruinar el café. Los defectos más comunes son:

1. Baked (Horneado): Ocurre cuando el RoR (Rate of Rise / Tasa de Ascenso) se estanca o cae (crash) durante el desarrollo. El café sabe plano, sin acidez, aburrido, similar a pan viejo o cartón.

2. Underdeveloped (Subdesarrollado): El interior del grano no alcanzó suficiente temperatura. Sabe vegetal, herbáceo (como arvejas o pasto) y tiene una acidez agria y astringente. Puede ser difícil de moler.

3. Overdeveloped / Roasty (Sobredesarrollado): Tostado demasiado oscuro o demasiado tiempo en desarrollo. Los azúcares se queman. Sabe a ceniza, carbón, humo y es extremadamente amargo, perdiendo todas las notas de origen.

4. Scorching / Tipping (Quemado superficial): Calor inicial demasiado alto o velocidad de tambor incorrecta. El exterior del grano se quema en puntos específicos antes de que el interior se cocine. Sabe a humo y deja sequedad en boca.

Para evitar esto, los tostadores monitorean constantemente la temperatura del grano, el aire y la tasa a la que aumenta la temperatura (RoR) intentando mantener una curva suave y decreciente.`,
        quiz: [
          {
            question: '¿Qué defecto ocurre cuando el café no alcanza suficiente temperatura interna y sabe a pasto?',
            options: ['Baked', 'Underdeveloped', 'Scorching', 'Overdeveloped'],
            correctAnswer: 1
          },
          {
            question: '¿A qué sabe un café con defecto "Baked" (Horneado)?',
            options: ['Ahumado y carbón', 'Frutal y brillante', 'Plano, cartón y sin acidez', 'Ácido y herbáceo'],
            correctAnswer: 2
          }
        ],
        task: 'Toma muestras de tu último batch de tueste. Corta 5 granos por la mitad con un bisturí o cuchillo y observa si el color interno es igual al externo.'
      }
    ]
  },
  {
    id: 'espresso',
    title: 'Espresso',
    description: 'Extracción, ratios, variables, calibración y problemas comunes.',
    icon: 'Coffee',
    color: 'text-stone-800 dark:text-stone-100',
    chapters: [
      {
        id: 'esp-1',
        title: 'Capítulo 1: La Receta del Espresso',
        duration: '11:20',
        content: `El espresso no es un tipo de grano ni un nivel de tueste, es un método de preparación. Se define por forzar agua caliente a presión (generalmente 9 bares) a través de una pastilla de café finamente molido y compactado.

Para calibrar un espresso, utilizamos una receta basada en 3 variables fundamentales, en este orden:

1. Dosis (Dose): La cantidad de café molido seco que entra en el portafiltro. Usualmente entre 18g y 20g en cafeterías de especialidad. Fija la dosis y no la cambies mientras calibras.

2. Rendimiento (Yield): La cantidad de líquido final en la taza. Se mide en gramos, no en mililitros, debido a la crema. El "Ratio" es la relación entre dosis y rendimiento. Un ratio clásico es 1:2 (ej. 18g in, 36g out).
- Ratio 1:1 a 1:1.5 (Ristretto): Más cuerpo, textura jarabosa, acidez alta.
- Ratio 1:2 a 1:2.5 (Normale): Balance entre cuerpo, dulzor y claridad.
- Ratio 1:3 (Lungo): Menos cuerpo, más claridad, mayor extracción (puede llegar a ser amargo).

3. Tiempo (Time): El tiempo que toma alcanzar el rendimiento deseado. Generalmente entre 25 y 30 segundos. El tiempo es un resultado de la molienda. Si extrae muy rápido (ej. 15s), la molienda está muy gruesa (sub-extracción = ácido). Si extrae muy lento (ej. 40s), la molienda está muy fina (sobre-extracción = amargo).`,
        quiz: [
          {
            question: '¿Qué es el "Ratio" en la preparación de espresso?',
            options: ['El tiempo dividido por la dosis', 'La relación entre el café seco y el líquido extraído', 'La cantidad de agua en la caldera', 'Los bares de presión aplicados'],
            correctAnswer: 1
          },
          {
            question: 'Si tu espresso de 18g a 36g sale en 15 segundos y sabe muy ácido, ¿qué debes hacer?',
            options: ['Aumentar la dosis a 22g', 'Hacer la molienda más gruesa', 'Hacer la molienda más fina', 'Bajar la temperatura del agua'],
            correctAnswer: 2
          }
        ],
        task: 'Calibra un espresso a un ratio de 1:2. Luego, sin cambiar la molienda ni la dosis, extrae un ratio de 1:3. Prueba ambos y anota las diferencias en textura y sabor.'
      },
      {
        id: 'esp-2',
        title: 'Capítulo 2: Distribución y Tampeo',
        duration: '09:45',
        content: `La mejor receta del mundo fallará si la pastilla de café en el portafiltro no es uniforme. El agua a presión es perezosa; siempre buscará el camino de menor resistencia. A esto se le llama "Canalización" (Channeling).

Cuando ocurre la canalización, el agua pasa rápidamente por fisuras o zonas menos densas del café, sobre-extrayendo esa pequeña parte (aportando amargor) y dejando el resto de la pastilla casi seca, sub-extrayendo el café (aportando acidez agria). El resultado es un espresso astringente y desbalanceado.

Técnica de preparación:
1. WDT (Weiss Distribution Technique): Usar agujas finas para romper grumos en el café molido y distribuir el polvo uniformemente en la canasta antes de tampear.
2. Nivelación: Golpear suavemente el portafiltro para asentar el café.
3. Tampeo (Tamping): Presionar el café con el tamper. La fuerza exacta (ej. 15 kg) no importa tanto como que el tampeo sea completamente NIVELADO (recto) y CONSISTENTE. Una vez que el café deja de ceder, apretar más no cambia nada.
4. Limpieza: Limpiar las orejas del portafiltro antes de insertarlo en el grupo.

Si ves "chorros" que salen disparados del portafiltro naked (sin fondo), o si el flujo empieza por un lado y no en el centro, estás sufriendo de canalización.`,
        quiz: [
          {
            question: '¿Qué es la canalización (channeling)?',
            options: ['Cuando el agua busca el camino de menor resistencia rompiendo la pastilla', 'El conducto por donde sale el agua del grupo', 'Cuando la molienda es demasiado fina', 'El proceso de limpiar el portafiltro'],
            correctAnswer: 0
          },
          {
            question: 'En el tampeo, ¿qué es lo más importante?',
            options: ['Aplicar exactamente 20 kg de presión', 'Que sea perfectamente nivelado y consistente', 'Tampear dos veces seguidas', 'Girar el tamper rápidamente al final'],
            correctAnswer: 1
          }
        ],
        task: 'Prepara un espresso usando un portafiltro naked. Graba un video en cámara lenta de la extracción y analiza si el flujo se une en el centro de manera simétrica.'
      }
    ]
  },
  {
    id: 'milk',
    title: 'Texturización de Leche',
    description: 'Química de la leche, microespuma, temperaturas y latte art base.',
    icon: 'Droplet',
    color: 'text-blue-400',
    chapters: [
      {
        id: 'mlk-1',
        title: 'Capítulo 1: Química y Microespuma',
        duration: '10:30',
        content: `Texturizar leche no es simplemente "calentarla". Es un proceso mecánico y químico donde introducimos aire para crear espuma y calor para cambiar el sabor.

La leche contiene tres componentes clave para nosotros:
1. Proteínas: Son responsables de estabilizar la espuma. Cuando introducimos aire (con la punta de la lanceta), las proteínas envuelven las burbujas de aire evitando que estallen.
2. Grasas: Dan la sensación de cremosidad y cuerpo. Una leche entera (entorno al 3-4% de grasa) texturiza mejor y es más elástica.
3. Lactosa (Azúcar): Al calentar la leche, la lactosa aumenta su solubilidad y percibimos la leche mucho más dulce que estando fría.

Técnica de texturización:
Fase 1 - Estiramiento (Stretching): Punta de la lanceta justo en la superficie. Escuchas pequeños "ts ts ts". Aquí estás introduciendo aire (creando espuma). Solo debe hacerse cuando la leche está FRÍA.
Fase 2 - Giro (Rolling): Sumerges la punta un milímetro. Creas un vórtice o remolino. Esto rompe las burbujas grandes integrándolas en el líquido, creando la "microespuma" (textura de pintura fresca).
Fase 3 - Temperatura: Detén el proceso entre 60°C y 65°C. A partir de los 70°C, las proteínas se desnaturalizan, la leche pierde su dulzor, huele a quemado y te quemarás la lengua.`,
        quiz: [
          {
            question: '¿A qué temperatura máxima aproximada debes detener la texturización para no arruinar el dulzor?',
            options: ['50°C', '65°C', '80°C', '95°C'],
            correctAnswer: 1
          },
          {
            question: '¿Qué componente de la leche es el principal responsable de estabilizar las burbujas de espuma?',
            options: ['La Lactosa', 'Las Grasas', 'Las Proteínas', 'El Calcio'],
            correctAnswer: 2
          }
        ],
        task: 'Texturiza leche intentando crear el remolino perfecto. Al terminar, golpea la jarra contra la mesa para quitar burbujas grandes y gira la leche. Debe verse brillante como pintura blanca.'
      }
    ]
  },
  {
    id: 'filter',
    title: 'Café de Especialidad (Filtro)',
    description: 'Métodos V60, Chemex, Aeropress, variables de extracción y turbulencia.',
    icon: 'Filter',
    color: 'text-purple-500',
    chapters: [
      {
        id: 'flt-1',
        title: 'Capítulo 1: Variables de Extracción en Filtro',
        duration: '14:15',
        content: `El café filtrado (o Pour Over) funciona por percolación: el agua fresca pasa constantemente a través de la cama de café, extrayendo solubles por gravedad.

A diferencia del espresso, aquí no hay presión. Jugamos con otras variables:

1. Ratio: Usualmente se manejan ratios más abiertos, entre 1:15 y 1:17 (ej. 15g de café por 250g de agua). Un ratio menor (1:14) dará una bebida más intensa y pesada. Un ratio mayor (1:17) dará una bebida más diluida pero a menudo con mayor claridad de sabores.

2. Molienda: Media a media-fina (como arena de mar o sal de mesa). Es la principal herramienta para controlar el tiempo. Si el agua baja muy rápido, muele más fino. Si se estanca, muele más grueso.

3. Temperatura del agua: Entre 90°C y 96°C. Tuestes claros requieren agua más caliente (94-96°C) para extraer compuestos difíciles. Tuestes más oscuros requieren agua más fría (88-91°C) para no extraer compuestos amargos y quemados.

4. Vertidos (Pours) y Turbulencia:
- El Bloom (Pre-infusión): Primer vertido (doble del peso del café, ej. 30g de agua para 15g de café) por 30-45 seg. Permite que el café libere CO2 atrapado. Si no liberas el gas, el agua no podrá tocar el café en los siguientes vertidos.
- Turbulencia: La agitación causada por el impacto del agua al caer desde la tetera de cuello de ganso. Más agitación = más extracción. Muchos vertidos pequeños extraen más que un solo vertido grande.`,
        quiz: [
          {
            question: '¿Por qué se realiza el "Bloom" o pre-infusión?',
            options: ['Para enfriar el agua', 'Para liberar el CO2 atrapado en el grano tostado', 'Para extraer los sabores amargos primero', 'Para limpiar el filtro de papel'],
            correctAnswer: 1
          },
          {
            question: 'Si estás filtrando un café de tueste muy claro, ¿qué temperatura de agua deberías preferir?',
            options: ['80°C - 85°C', '88°C - 90°C', '94°C - 96°C', 'Agua hirviendo a 100°C'],
            correctAnswer: 2
          }
        ],
        task: 'Prepara un V60 haciendo 1 solo vertido largo después del bloom. Luego, haz otro con la misma receta pero dividiendo el agua en 4 vertidos pequeños. Cata ambos y compara el cuerpo.'
      }
    ]
  },
  {
    id: 'cupping',
    title: 'Catación (Cupping)',
    description: 'Protocolos SCA, evaluación sensorial, fragancia, aroma y defectos.',
    icon: 'Brain',
    color: 'text-rose-500',
    chapters: [
      {
        id: 'cup-1',
        title: 'Capítulo 1: El Protocolo SCA',
        duration: '16:40',
        content: `La catación (cupping) es el método estándar mundial para evaluar y puntuar la calidad del café de forma objetiva, eliminando la variable del "barista" o el "método de extracción".

Protocolo estándar de la Specialty Coffee Association (SCA):
1. Ratio: 8.25 gramos de café por 150 ml de agua.
2. Molienda: Ligeramente más gruesa que para filtro (70-75% de las partículas deben pasar por un tamiz estándar #20).
3. Tueste: Tueste de muestra (muy claro, para revelar defectos del grano verde sin enmascararlos con sabores de tueste).
4. Agua: A 93°C (200°F), vertida directamente en la taza.

Pasos de la Evaluación:
1. Fragancia (Seco): Oler el café recién molido antes de poner agua.
2. Aroma (Húmedo): Verter el agua, dejar reposar 4 minutos. Se forma una "costra" de café flotando.
3. Romper la costra (Break): A los 4 minutos, con una cuchara, empujar la costra 3 veces hacia el fondo aspirando los gases liberados. Es el momento de mayor intensidad aromática.
4. Limpiar: Retirar la espuma y restos flotantes con dos cucharas.
5. Catación (Tasting): A partir del minuto 10-12, cuando enfría un poco, se toma una cucharada y se "sorbe" ruidosamente (slurp). Esto atomiza el café en el paladar, estimulando todos los receptores de gusto y el bulbo olfativo (retronasal).

Se evalúa la bebida mientras se enfría (caliente, tibia, fría) puntuando Acidez, Cuerpo, Sabor, Dulzor, Limpieza, Uniformidad y Balance.`,
        quiz: [
          {
            question: '¿Qué es el "Break" o rompimiento de la costra?',
            options: ['Romper los granos defectuosos antes de moler', 'Empujar el café flotante a los 4 min para liberar y evaluar el aroma', 'El momento en que la taza se rompe por calor', 'El descanso de 10 minutos antes de catar'],
            correctAnswer: 1
          },
          {
            question: '¿Por qué se debe "sorber" (slurp) el café ruidosamente de la cuchara?',
            options: ['Para enfriarlo', 'Para limpiar la cuchara', 'Para atomizar el líquido en el paladar y activar el olfato retronasal', 'Es solo una tradición sin motivo técnico'],
            correctAnswer: 2
          }
        ],
        task: 'Organiza una mini mesa de catación con 2 cafés diferentes que tengas en casa. Sigue el protocolo: muele 8.25g, huele seco, pon 150ml de agua, espera 4 min, rompe costra y huele. Anota las diferencias aromáticas.'
      }
    ]
  }
];
