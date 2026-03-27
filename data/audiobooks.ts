export interface AudiobookChapter {
  id: string;
  title: string;
  duration: string;
  content: string;
  quiz: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
  task: string;
}

export interface AudiobookCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  chapters: AudiobookChapter[];
}

export const audiobooksData: AudiobookCategory[] = [
  {
    id: 'green-coffee',
    title: 'Café Verde',
    description: 'Aprende sobre botánica, procesamiento y clasificación del café en origen.',
    icon: 'Leaf',
    color: 'text-emerald-500',
    chapters: [
      {
        id: 'gc-1',
        title: 'Capítulo 1: Botánica y Variedades',
        duration: '12:45',
        content: `El café pertenece a la familia de las Rubiáceas, género Coffea. Las dos especies más importantes comercialmente son Coffea arabica (Arábica) y Coffea canephora (Robusta). 

El Arábica representa aproximadamente el 60-70% de la producción mundial. Crece a mayores altitudes (típicamente 600-2000 msnm), tiene menos cafeína, mayor acidez y perfiles de sabor más complejos, florales y frutales. Dentro del Arábica existen numerosas mutaciones y cruces naturales o de laboratorio: Typica, Bourbon, Caturra, Gesha, Pacamara, entre otros.

El Robusta, por su parte, crece a menores altitudes (0-800 msnm), es más resistente a enfermedades y plagas (de ahí su nombre), contiene casi el doble de cafeína y suele tener un perfil de sabor más pesado, terroso y astringente.

Entender la botánica es el primer paso para comprender por qué un café sabe a lo que sabe. El terruño (clima, suelo, altitud) interactúa directamente con la genética de la planta para desarrollar los precursores de sabor que luego serán descubiertos en el tueste.`,
        quiz: [
          {
            question: '¿Cuáles son las dos especies de café más importantes comercialmente?',
            options: ['Arábica y Liberica', 'Typica y Bourbon', 'Arábica y Robusta', 'Caturra y Gesha'],
            correctAnswer: 2
          },
          {
            question: '¿Qué especie tiene mayor contenido de cafeína?',
            options: ['Arábica', 'Robusta', 'Ambas tienen la misma cantidad', 'Depende del tueste'],
            correctAnswer: 1
          }
        ],
        task: 'Investiga y anota 3 variedades de Arábica cultivadas en tu país o región, e identifica a qué altitud suelen cultivarse.'
      },
      {
        id: 'gc-2',
        title: 'Capítulo 2: Beneficios y Procesamiento',
        duration: '15:20',
        content: `Una vez que la cereza de café es recolectada (idealmente en su punto óptimo de maduración), debe ser procesada para extraer la semilla (el grano verde) de la fruta. Este proceso es crucial y define en gran medida el perfil en taza.

1. Proceso Lavado (Washed): Se remueve la piel y la pulpa mecánicamente. Luego, los granos cubiertos de mucílago se fermentan en tanques con agua para que los microorganismos degraden el mucílago restante. Finalmente se lavan y se secan. Este proceso resalta la acidez, claridad y las notas intrínsecas de la variedad.

2. Proceso Natural (Seco): Las cerezas enteras se secan al sol en patios o camas africanas. El grano absorbe los azúcares de la fruta durante semanas. El resultado es un café con cuerpo pesado, dulzor intenso y notas a frutas maduras, bayas o incluso vino.

3. Proceso Honey (Miel): Es un punto intermedio. Se remueve la piel pero se deja parte o todo el mucílago (la capa pegajosa rica en azúcares) adherido al grano durante el secado. Dependiendo de la cantidad de mucílago y el tiempo de secado, se clasifican en White, Yellow, Red o Black Honey. Aportan gran dulzor y cuerpo.

4. Procesos Experimentales: Maceración carbónica, fermentación anaeróbica o térmica, donde se controla el oxígeno, la temperatura y levaduras añadidas para crear perfiles de sabor únicos y exóticos.`,
        quiz: [
          {
            question: '¿Qué proceso suele resaltar más la acidez y la claridad en taza?',
            options: ['Natural', 'Lavado', 'Honey', 'Maceración Carbónica'],
            correctAnswer: 1
          },
          {
            question: '¿En qué proceso se seca la cereza entera con la fruta intacta?',
            options: ['Lavado', 'Honey', 'Natural', 'Despulpado'],
            correctAnswer: 2
          }
        ],
        task: 'Cata a ciegas un café Lavado y un Natural del mismo origen (si es posible). Anota las diferencias en acidez, cuerpo y dulzor.'
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
