import React, { useState, useEffect } from 'react';
import { ArrowLeft, Brain, Check, Leaf, Trophy, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Data ────────────────────────────────────────────────────────────────────

interface Variety {
  id: string;
  name: string;
  origin: string;
  species: string;
  altitude: string;
  description: string;
  sensoryProfile: string;
  characteristics: string[];
}

const VARIETIES: Variety[] = [
  {
    id: 'geisha',
    name: 'Geisha (Gesha)',
    origin: 'Etiopía (Bosque Gesha) — popularizada en Panamá',
    species: 'Arábica',
    altitude: '1,400 – 2,000 msnm',
    description: 'Variedad de porte alto y hojas alargadas, originaria del bosque de Gesha en Etiopía occidental. Fue redescubierta en Panamá (Hacienda La Esmeralda, 2004) y desde entonces ha redefinido los estándares de calidad en café de especialidad. Es delicada en cultivo, de bajo rendimiento y alta susceptibilidad a enfermedades, pero produce tazas de complejidad extraordinaria.',
    sensoryProfile: 'Floral intenso (jazmín, bergamota), cítrico delicado (mandarina, limón meyer), frutas tropicales (maracuyá, lychee), acidez brillante tipo cítrica/fosfórica, cuerpo sedoso tipo té, dulzor a miel de azahar, postgusto largo y perfumado.',
    characteristics: ['Porte alto', 'Bajo rendimiento', 'Hojas alargadas', 'Muy sensible a roya', 'Requiere altitud elevada']
  },
  {
    id: 'bourbon',
    name: 'Bourbon',
    origin: 'Isla Reunión (antigua Isla Bourbon) — Yemen',
    species: 'Arábica',
    altitude: '1,100 – 2,000 msnm',
    description: 'Una de las dos variedades fundacionales junto con Typica. Llevada de Yemen a la Isla Reunión (Bourbon) en el siglo XVIII. Produce cerezas más densas y dulces que Typica (aprox. 20-30% más rendimiento). Es la base genética de muchas variedades modernas como Caturra, Catuaí y SL28.',
    sensoryProfile: 'Dulzor pronunciado (caramelo, chocolate con leche, azúcar morena), acidez media-alta de tipo málica/cítrica suave, cuerpo medio cremoso, notas a frutos rojos maduros (cereza, frambuesa), postgusto limpio con final a nuez.',
    characteristics: ['Rendimiento medio-alto', 'Variantes: Rojo, Amarillo, Rosado', 'Base de muchos híbridos', 'Susceptible a roya y CBD', 'Maduración uniforme']
  },
  {
    id: 'caturra',
    name: 'Caturra',
    origin: 'Brasil (mutación natural de Bourbon, ~1937)',
    species: 'Arábica',
    altitude: '1,000 – 1,800 msnm',
    description: 'Mutación natural de porte bajo del Bourbon, descubierta en Minas Gerais, Brasil. Su tamaño compacto permite mayor densidad de siembra (hasta 5,000 plantas/hectárea vs 2,500 de Bourbon). Fue ampliamente adoptada en América Central y Colombia durante las décadas de 1950-70. Produce tazas limpias con buena acidez cuando se cultiva a altitud adecuada.',
    sensoryProfile: 'Acidez cítrica brillante (limón, naranja), cuerpo medio a ligero, dulzor moderado (panela, miel suave), notas limpias y definidas, ligeramente menos complejo que Bourbon pero con mayor claridad, postgusto medio y limpio.',
    characteristics: ['Porte bajo (mutación de Bourbon)', 'Alta densidad de siembra', 'Producción moderada-alta', 'Susceptible a roya', 'Muy popular en Colombia y Centroamérica']
  },
  {
    id: 'typica',
    name: 'Typica',
    origin: 'Yemen → Java (siglo XVII) — distribución global',
    species: 'Arábica',
    altitude: '1,200 – 2,100 msnm',
    description: 'La variedad más antigua y genéticamente pura del café arábica. Originaria de Etiopía, pasó por Yemen y fue llevada a Java por los holandeses. De ella descienden la mayoría de las variedades cultivadas en el mundo. Porte alto, bajo rendimiento pero calidad excepcional.',
    sensoryProfile: 'Limpio y elegante, acidez suave tipo cítrica, cuerpo medio-ligero sedoso, notas dulces a azúcar morena, nuez, chocolate suave, postgusto refinado y prolongado.',
    characteristics: ['Variedad madre de la mayoría del café mundial', 'Porte alto y bajo rendimiento', 'Muy susceptible a roya', 'Hojas alargadas con puntas cobrizas', 'Calidad excepcional en taza']
  },
  {
    id: 'sl28',
    name: 'SL28',
    origin: 'Kenia (seleccionada por Scott Agricultural Laboratories, ~1930s)',
    species: 'Arábica',
    altitude: '1,500 – 2,100 msnm',
    description: 'Seleccionada en Kenia por los Scott Laboratories a partir de material de Tanganyika (Tanzania). Es reconocida mundialmente por producir una de las tazas más complejas y vibrantes del café de especialidad. Destaca por su acidez extraordinaria tipo grosella negra (blackcurrant).',
    sensoryProfile: 'Acidez vibrante y jugosa (grosella negra, tomate, cítrico intenso), cuerpo medio-alto, dulzor a frutas rojas maduras, notas a vino tinto, complejidad aromática excepcional, postgusto largo y afrutado.',
    characteristics: ['Selección de Scott Labs, Kenia', 'Acidez tipo blackcurrant única', 'Tolerancia a sequía', 'Susceptible a CBD', 'Ícono del café keniano']
  },
  {
    id: 'sl34',
    name: 'SL34',
    origin: 'Kenia (seleccionada por Scott Agricultural Laboratories, ~1930s)',
    species: 'Arábica',
    altitude: '1,500 – 2,100 msnm',
    description: 'Hermana de la SL28, también seleccionada en Kenia pero con genética diferente (probablemente derivada de Bourbon francés). Más productiva que SL28 y mejor adaptada a zonas de alta lluvia. Produce tazas con perfil similar pero con más cuerpo.',
    sensoryProfile: 'Acidez cítrica brillante (menos intensa que SL28), cuerpo más pesado y cremoso, notas a frutas tropicales y cítricas, dulzor a caramelo, chocolate con leche, postgusto largo y dulce.',
    characteristics: ['Selección de Scott Labs, Kenia', 'Más productiva que SL28', 'Mejor en zonas húmedas', 'Susceptible a roya y CBD', 'Complemento perfecto de SL28']
  },
  {
    id: 'pacamara',
    name: 'Pacamara',
    origin: 'El Salvador (cruce Pacas × Maragogipe, 1958)',
    species: 'Arábica',
    altitude: '1,200 – 1,800 msnm',
    description: 'Cruce desarrollado en El Salvador entre Pacas (mutación de Bourbon) y Maragogipe (mutación de Typica de grano gigante). Combina el tamaño grande del Maragogipe con la adaptabilidad del Pacas. Grano excepcionalmente grande (Screen 18-20).',
    sensoryProfile: 'Complejidad floral y frutal (jazmín, melocotón, maracuyá), acidez málica brillante, cuerpo medio-alto, dulzor intenso a miel, notas herbales y especiadas según el terroir, postgusto largo y exótico.',
    characteristics: ['Grano muy grande (Screen 18-20)', 'Cruce exclusivo de El Salvador', 'Porte intermedio', 'Producción baja-media', 'Muy premiada en competencias']
  },
  {
    id: 'maragogipe',
    name: 'Maragogipe',
    origin: 'Brasil (mutación de Typica, Bahía, ~1870)',
    species: 'Arábica',
    altitude: '1,000 – 1,600 msnm',
    description: 'Mutación natural de Typica descubierta en Maragogipe, Bahía, Brasil. Conocida como "café elefante" por su grano excepcionalmente grande. Planta de porte muy alto con hojas y frutos grandes. Bajo rendimiento pero grano llamativo y perfil suave.',
    sensoryProfile: 'Cuerpo ligero, acidez suave y delicada, dulzor floral sutil, notas a nuez, avellana y chocolate suave, postgusto limpio y agradable. Menos complejo que otras variedades pero muy equilibrado.',
    characteristics: ['Grano excepcionalmente grande ("elefante")', 'Mutación de Typica', 'Porte muy alto', 'Producción baja', 'Padre del Pacamara']
  },
  {
    id: 'catuai',
    name: 'Catuaí',
    origin: 'Brasil (cruce Mundo Novo × Caturra, ~1949-1972)',
    species: 'Arábica',
    altitude: '800 – 1,600 msnm',
    description: 'Cruce entre Mundo Novo (alta producción) y Caturra (porte bajo). Desarrollado por el IAC (Instituto Agronômico de Campinas) en Brasil. Combina la productividad del Mundo Novo con el porte compacto de Caturra. Viene en variantes Rojo y Amarillo.',
    sensoryProfile: 'Dulzor medio a chocolate y nuez, acidez media-baja tipo cítrica suave, cuerpo medio, notas a caramelo y frutos secos, perfil limpio y consistente, postgusto corto a medio.',
    characteristics: ['Cruce Mundo Novo × Caturra', 'Porte bajo, alta producción', 'Variantes: Rojo y Amarillo', 'Resistente al viento y lluvia', 'Muy popular en Brasil y Centroamérica']
  },
  {
    id: 'mundo-novo',
    name: 'Mundo Novo',
    origin: 'Brasil (cruce natural Typica × Bourbon, ~1943)',
    species: 'Arábica',
    altitude: '1,000 – 1,600 msnm',
    description: 'Híbrido natural entre Typica y Bourbon descubierto en São Paulo, Brasil. Es una de las variedades más productivas y vigorosas del café arábica. Porte alto con excelente adaptabilidad. Base genética del Catuaí.',
    sensoryProfile: 'Dulzor sólido a chocolate con leche y caramelo, acidez baja a media, cuerpo medio-alto, notas a nuez y panela, perfil consistente y predecible, postgusto medio.',
    characteristics: ['Híbrido natural Typica × Bourbon', 'Porte alto y muy vigoroso', 'Alta productividad', 'Adaptable a diversas alturas', 'Base del Catuaí']
  },
  {
    id: 'villa-sarchi',
    name: 'Villa Sarchi',
    origin: 'Costa Rica (mutación natural de Bourbon, ~1950s)',
    species: 'Arábica',
    altitude: '1,200 – 1,800 msnm',
    description: 'Mutación natural de porte bajo del Bourbon, descubierta en el pueblo de Sarchi, Costa Rica. Similar a Caturra pero con mejor adaptación a altitudes altas y climas ventosos. Produce tazas con acidez brillante y perfil fino.',
    sensoryProfile: 'Acidez brillante tipo cítrica (naranja, mandarina), dulzor a miel de flores, cuerpo medio, notas florales sutiles y a frutas de hueso, postgusto limpio y delicado.',
    characteristics: ['Mutación de Bourbon (porte bajo)', 'Excelente en altitudes altas', 'Tolerante a viento', 'Producción media', 'Endémica de Costa Rica']
  },
  {
    id: 'pacas',
    name: 'Pacas',
    origin: 'El Salvador (mutación natural de Bourbon, ~1949)',
    species: 'Arábica',
    altitude: '1,000 – 1,600 msnm',
    description: 'Mutación natural de porte bajo del Bourbon, descubierta en la finca de la familia Pacas en Santa Ana, El Salvador. Similar genéticamente a Caturra y Villa Sarchi. Es la variedad más cultivada en El Salvador.',
    sensoryProfile: 'Dulzor a chocolate y caramelo, acidez media tipo málica, cuerpo medio, notas limpias y equilibradas, ligeramente menos complejo que Bourbon puro, postgusto dulce y corto.',
    characteristics: ['Mutación de Bourbon (porte bajo)', 'Ampliamente cultivado en El Salvador', 'Adaptable a climas secos', 'Producción media-alta', 'Padre del Pacamara']
  },
  {
    id: 'castillo',
    name: 'Castillo',
    origin: 'Colombia (cruce Caturra × Híbrido de Timor, CENICAFÉ, 2005)',
    species: 'Arábica (híbrido con genes de resistencia)',
    altitude: '1,200 – 2,000 msnm',
    description: 'Variedad desarrollada por CENICAFÉ como evolución de la Colombia. Combina resistencia a roya (vía Híbrido de Timor) con calidad en taza mejorada.',
    sensoryProfile: 'Cuerpo medio, dulzor a panela y caramelo, acidez media (cítrica suave), notas a nuez y chocolate, perfil limpio aunque históricamente criticado por falta de complejidad vs variedades tradicionales.',
    characteristics: ['Resistente a roya de café', 'Cruce con Híbrido de Timor', 'Promovida por la FNC', 'Alta productividad', 'Variantes regionales']
  },
  {
    id: 'colombia',
    name: 'Variedad Colombia',
    origin: 'Colombia (cruce Caturra × Híbrido de Timor, CENICAFÉ, ~1980s)',
    species: 'Arábica (híbrido con genes de resistencia)',
    altitude: '1,200 – 2,000 msnm',
    description: 'Predecesora del Castillo, desarrollada por CENICAFÉ como respuesta a la epidemia de roya de los 1980s. Primera variedad colombiana con resistencia a roya. Fue reemplazada gradualmente por Castillo que tiene mejor calidad en taza.',
    sensoryProfile: 'Cuerpo medio, notas a chocolate y nuez, acidez moderada, dulzor medio, perfil funcional pero con menor complejidad aromática que variedades tradicionales.',
    characteristics: ['Primera variedad colombiana resistente a roya', 'Predecesora del Castillo', 'Porte bajo', 'Alta producción', 'Reemplazada por Castillo']
  },
  {
    id: 'ruiru11',
    name: 'Ruiru 11',
    origin: 'Kenia (desarrollada en Ruiru Research Station, 1985)',
    species: 'Arábica (compuesto con genes de resistencia)',
    altitude: '1,500 – 1,900 msnm',
    description: 'Variedad compuesta desarrollada en Kenia como respuesta a la CBD (Coffee Berry Disease). Combina múltiples líneas para lograr resistencia a enfermedades. Porte muy compacto. Históricamente criticada por calidad inferior a SL28/SL34, pero generaciones recientes han mejorado.',
    sensoryProfile: 'Cuerpo medio, acidez moderada (menos vibrante que SL28/SL34), notas a frutas suaves, nuez y chocolate, dulzor medio, perfil limpio pero sin la complejidad de las SL.',
    characteristics: ['Resistente a CBD y roya', 'Porte muy compacto', 'Alta densidad de siembra', 'Generaciones recientes mejoran calidad', 'Desarrollada en Ruiru, Kenia']
  },
  {
    id: 'batian',
    name: 'Batian',
    origin: 'Kenia (desarrollada en CRF, 2010)',
    species: 'Arábica (compuesto con resistencia a enfermedades)',
    altitude: '1,500 – 2,100 msnm',
    description: 'La variedad keniana más nueva, nombrada en honor al pico más alto del Monte Kenia. Desarrollada como mejora sobre Ruiru 11, buscando combinar resistencia a enfermedades con la calidad en taza de SL28. Porte más alto que Ruiru 11.',
    sensoryProfile: 'Acidez vibrante (acercándose a SL28), cuerpo medio, notas a cítricos y frutas rojas, dulzor a caramelo, mejor complejidad que Ruiru 11, postgusto medio-largo.',
    characteristics: ['Evolución de Ruiru 11', 'Mejor calidad que su predecesora', 'Resistente a CBD y roya', 'Porte alto', 'Nombrada por el pico Batian del Mt. Kenya']
  },
  {
    id: 'catimor',
    name: 'Catimor',
    origin: 'Portugal (cruce Caturra × Híbrido de Timor, CIFC, 1959)',
    species: 'Arábica (híbrido con genes de resistencia)',
    altitude: '700 – 1,500 msnm',
    description: 'Cruce entre Caturra y el Híbrido de Timor. Altamente resistente a roya y muy productivo; base genética de muchas variedades modernas resistentes.',
    sensoryProfile: 'Cuerpo medio-alto, acidez baja, notas a nuez oscura y cereal, puede tener notas astringentes o medicinales en altitudes bajas, mejor perfil en altitudes altas, postgusto corto con final ligeramente áspero.',
    characteristics: ['Cruce Caturra × Híbrido de Timor', 'Alta resistencia a roya', 'Muy productivo', 'Calidad de taza variable', 'Base genética de muchas variedades modernas']
  },
  {
    id: 'sarchimor',
    name: 'Sarchimor',
    origin: 'Costa Rica (cruce Villa Sarchi × Híbrido de Timor, CIFC/CATIE)',
    species: 'Arábica (híbrido con genes de resistencia)',
    altitude: '1,000 – 1,800 msnm',
    description: 'Cruce entre Villa Sarchi y el Híbrido de Timor. Similar al Catimor pero con Villa Sarchi como madre en lugar de Caturra. Generalmente produce mejor calidad en taza que Catimor gracias a la genética del Villa Sarchi.',
    sensoryProfile: 'Acidez media, cuerpo medio, dulzor a panela y chocolate, notas más limpias que Catimor, perfil equilibrado en altitudes medias-altas, postgusto medio y limpio.',
    characteristics: ['Cruce Villa Sarchi × Híbrido de Timor', 'Mejor calidad que Catimor', 'Resistente a roya', 'Porte compacto', 'Base de variedades como Marsellesa y Parainema']
  },
  {
    id: 'ethiopian-heirloom',
    name: 'Ethiopian Heirloom',
    origin: 'Etiopía (variedades silvestres nativas, miles de años)',
    species: 'Arábica (cuna genética)',
    altitude: '1,400 – 2,200 msnm',
    description: 'No es una sola variedad sino un término colectivo para las miles de variedades genéticamente diversas que crecen de forma silvestre y semi-silvestre en los bosques de Etiopía. Cada microrregión tiene su propia diversidad. Se estima que existen entre 6,000 y 10,000 variedades no catalogadas.',
    sensoryProfile: 'Extremadamente diverso según región: Yirgacheffe (floral, jazmín, limón), Sidama (frutos rojos, berries), Guji (tropical, melocotón), Harrar (frutas secas, chocolate, blueberry). Generalmente: acidez brillante, complejidad aromática excepcional.',
    characteristics: ['Miles de variedades no catalogadas', 'Diversidad genética única', 'Crecimiento silvestre/semi-silvestre', 'Cuna del café arábica', 'Cada zona tiene perfil distinto']
  },
  {
    id: 'sidra',
    name: 'Sidra',
    origin: 'Ecuador (posible descendiente de Typica × Bourbon, redescubierta ~2010s)',
    species: 'Arábica',
    altitude: '1,600 – 2,200 msnm',
    description: 'Variedad misteriosa que ganó popularidad rápidamente en competencias de café de especialidad a partir de 2015-2018. Su origen genético exacto es debatido; algunos la vinculan con Bourbon Sidra de Ecuador, otros con materiales etíopes. Produce tazas de complejidad floral extraordinaria, rivalizando con Geisha.',
    sensoryProfile: 'Floral elegante (rosa, lavanda), acidez vibrante tipo vino blanco, frutas de hueso (durazno, ciruela), cuerpo ligero-medio tipo té, dulzor a miel floral, complejidad aromática que evoluciona en el enfriamiento, postgusto largo y perfumado.',
    characteristics: ['Origen genético debatido', 'Ha ganado múltiples competencias', 'Rival de Geisha en complejidad', 'Muy popular en Ecuador', 'Requiere altitud muy alta']
  },
  {
    id: 'pink-bourbon',
    name: 'Pink Bourbon (Bourbon Rosado)',
    origin: 'Colombia (selecciones regionales; Huila/Tolima)',
    species: 'Arábica',
    altitude: '1,500 – 2,200 msnm',
    description: 'Selección asociada a materiales tipo Bourbon con cereza rosada. Se valora por su alta fragancia y claridad cuando se cultiva en altura y se procesa con control.',
    sensoryProfile: 'Floral (rosa, azahar), frutos rojos (fresa, frambuesa), cítrico dulce (mandarina), acidez jugosa, cuerpo medio sedoso, dulzor alto.',
    characteristics: ['Cereza rosada', 'Alta fragancia', 'Mejor en altitudes altas', 'Calidad sensible al proceso', 'Muy usada en microlotes']
  },
  {
    id: 'tabi',
    name: 'Tabi',
    origin: 'Colombia (CENICAFÉ)',
    species: 'Arábica (con resistencia a roya)',
    altitude: '1,300 – 2,000 msnm',
    description: 'Variedad colombiana diseñada para combinar resistencia a roya con calidad de taza superior a materiales resistentes anteriores.',
    sensoryProfile: 'Dulzor medio-alto (panela, caramelo), acidez media cítrica/málica, cuerpo medio, notas a frutas amarillas y chocolate, final limpio.',
    characteristics: ['Resistente a roya', 'Buena calidad en taza', 'Productividad alta', 'Adaptable a Colombia y Centroamérica', 'Más consistente en altura']
  },
  {
    id: 'java',
    name: 'Java',
    origin: 'Etiopía → introducciones históricas en Java; difundida en Centroamérica',
    species: 'Arábica',
    altitude: '1,300 – 2,100 msnm',
    description: 'Material de linaje etíope difundido globalmente. En altura puede dar perfiles florales y frutales, con mayor tolerancia agronómica que Geisha en algunas fincas.',
    sensoryProfile: 'Floral suave, frutas de hueso (durazno), cítrico delicado, acidez brillante, cuerpo ligero tipo té, dulzor a miel.',
    characteristics: ['Linaje etíope', 'Buen desempeño en altura', 'Perfil elegante', 'Complejidad aromática', 'Interés en competencias']
  },
  {
    id: 'wush-wush',
    name: 'Wush Wush',
    origin: 'Etiopía (Wushwush; material de bosque)',
    species: 'Arábica',
    altitude: '1,600 – 2,300 msnm',
    description: 'Material etíope de alto interés por su expresión aromática. Se usa mucho en lotes experimentales por su capacidad de producir tazas muy perfumadas.',
    sensoryProfile: 'Floral intenso, tropical (piña, maracuyá), frutas rojas, acidez vibrante, cuerpo ligero-medio, dulzor alto.',
    characteristics: ['Material etíope', 'Muy aromático', 'Frecuente en procesos experimentales', 'Mejor en altura', 'Perfil cambiante al enfriar']
  },
  {
    id: 'sudan-rume',
    name: 'Sudan Rume',
    origin: 'Sudán del Sur (Boma Plateau); difundida a África y América',
    species: 'Arábica',
    altitude: '1,500 – 2,200 msnm',
    description: 'Variedad de genética particular, apreciada por su estructura en taza y complejidad. Ha ganado popularidad en microlotes y competencias.',
    sensoryProfile: 'Fruta madura (ciruela, uva), especias suaves, acidez málica/vinosa, cuerpo medio, dulzor a panela, final largo.',
    characteristics: ['Genética singular', 'Alta complejidad', 'Buena estructura', 'Preferida en microlotes', 'Requiere manejo agronómico fino']
  },
  {
    id: 'laurina',
    name: 'Laurina (Bourbon Pointu)',
    origin: 'Isla Reunión (Bourbon Pointu)',
    species: 'Arábica',
    altitude: '1,200 – 2,000 msnm',
    description: 'Mutación asociada a granos alargados y menor cafeína. Produce tazas muy delicadas, pero suele ser de bajo rendimiento.',
    sensoryProfile: 'Floral sutil, cítrico fino, dulzor a miel ligera, acidez suave, cuerpo ligero tipo té, final limpio y dulce.',
    characteristics: ['Menor cafeína', 'Perfil muy delicado', 'Bajo rendimiento', 'Grano alargado', 'Requiere alta selección']
  },
  {
    id: 'parainema',
    name: 'Parainema',
    origin: 'Honduras (IHCAFE; línea resistente)',
    species: 'Arábica (resistente a roya)',
    altitude: '1,200 – 1,900 msnm',
    description: 'Variedad resistente enfocada en productividad y sanidad. En altura y buena postcosecha puede dar perfiles limpios y balanceados.',
    sensoryProfile: 'Dulzor a chocolate y caramelo, acidez media cítrica, cuerpo medio, notas a nuez y frutas suaves, final limpio.',
    characteristics: ['Resistente a roya', 'Alta productividad', 'Buen desempeño en finca', 'Mejora en taza con altura', 'Muy usada en Honduras']
  },
  {
    id: 'marsellesa',
    name: 'Marsellesa',
    origin: 'Centroamérica (selecciones tipo Sarchimor/CATIE)',
    species: 'Arábica (resistente a roya)',
    altitude: '1,100 – 1,900 msnm',
    description: 'Selección resistente que busca equilibrar rendimiento con calidad. Común en fincas que priorizan estabilidad y sanidad.',
    sensoryProfile: 'Cuerpo medio, dulzor a panela, acidez media, notas a cacao y frutas amarillas, perfil limpio y consistente.',
    characteristics: ['Resistente a roya', 'Estable y productiva', 'Perfil consistente', 'Mejora en altura', 'Común en Centroamérica']
  },
  {
    id: 'ihcafe90',
    name: 'IHCAFE 90',
    origin: 'Honduras (IHCAFE)',
    species: 'Arábica (resistente a roya)',
    altitude: '1,000 – 1,800 msnm',
    description: 'Variedad desarrollada para resistencia y productividad. Su calidad en taza depende fuertemente de altitud y manejo de fermentación/secado.',
    sensoryProfile: 'Chocolate, nuez, acidez media-baja, cuerpo medio-alto, dulzor medio, final corto a medio.',
    characteristics: ['Resistente a roya', 'Alta productividad', 'Mayor consistencia agronómica', 'Mejor en altura', 'Común en Honduras']
  },
  {
    id: 'obata',
    name: 'Obatá',
    origin: 'Brasil (programas IAC)',
    species: 'Arábica (con resistencia)',
    altitude: '900 – 1,600 msnm',
    description: 'Selección brasileña orientada a productividad y resistencia. Es común en sistemas de cultivo tecnificado por su desempeño estable.',
    sensoryProfile: 'Chocolate, caramelo, acidez baja-media, cuerpo medio, notas a frutos secos, perfil redondo.',
    characteristics: ['Productiva', 'Resistente/estable', 'Perfil clásico', 'Buen rendimiento', 'Común en Brasil']
  },
  {
    id: 'icatu',
    name: 'Icatu',
    origin: 'Brasil (híbridos arábica con genes de resistencia)',
    species: 'Arábica (híbrido con genes de resistencia)',
    altitude: '900 – 1,700 msnm',
    description: 'Familia de híbridos creada para resistencia y vigor. En buenas condiciones puede dar tazas limpias con cuerpo marcado.',
    sensoryProfile: 'Cuerpo medio-alto, dulzor a cacao y caramelo, acidez baja-media, notas a nuez, final persistente.',
    characteristics: ['Vigor alto', 'Más resistente', 'Buen cuerpo', 'Rendimiento alto', 'Calidad mejora con altitud']
  },
  {
    id: 'arara',
    name: 'Arara',
    origin: 'Brasil (selecciones modernas)',
    species: 'Arábica',
    altitude: '900 – 1,600 msnm',
    description: 'Variedad moderna valorada por productividad y uniformidad. En taza suele ser dulce y fácil de perfilar.',
    sensoryProfile: 'Dulzor alto (caramelo, miel), acidez media cítrica suave, cuerpo medio, notas a chocolate y frutas amarillas.',
    characteristics: ['Uniformidad', 'Productividad alta', 'Dulzor alto', 'Perfil fácil de tostar', 'Común en Brasil']
  },
  {
    id: 'mokka',
    name: 'Mokka (Moka/Mocha)',
    origin: 'Yemen (linajes históricos)',
    species: 'Arábica',
    altitude: '1,500 – 2,400 msnm',
    description: 'Variedad de grano muy pequeño asociada a cafés yemeníes tradicionales. Baja productividad pero con perfiles muy distintivos.',
    sensoryProfile: 'Especias dulces, cacao, fruta seca, acidez media, cuerpo medio, notas a vino y final largo.',
    characteristics: ['Grano muy pequeño', 'Bajo rendimiento', 'Perfil distintivo', 'Asociada a Yemen', 'Alta complejidad']
  },
  {
    id: 's795',
    name: 'S795',
    origin: 'India (selección histórica; difundida en Asia)',
    species: 'Arábica',
    altitude: '1,000 – 1,800 msnm',
    description: 'Selección utilizada en Asia por su desempeño agronómico. En taza tiende a ser dulce, con perfil especiado y buen cuerpo.',
    sensoryProfile: 'Chocolate, especias suaves, acidez media-baja, cuerpo medio-alto, dulzor a caramelo, final limpio.',
    characteristics: ['Desempeño estable', 'Buen cuerpo', 'Perfil clásico', 'Común en Asia', 'Mejora con procesos limpios']
  },
  {
    id: 'garnica',
    name: 'Garnica',
    origin: 'México (selecciones regionales)',
    species: 'Arábica',
    altitude: '1,100 – 1,900 msnm',
    description: 'Variedad cultivada en México con buena adaptación en altura. Puede producir tazas dulces y balanceadas con postcosecha cuidada.',
    sensoryProfile: 'Dulzor a panela, cacao, acidez media cítrica suave, cuerpo medio, notas a nuez y fruta madura.',
    characteristics: ['Buena adaptación en México', 'Perfil balanceado', 'Mejor en altura', 'Respuesta fuerte a proceso', 'Productividad media']
  },
  {
    id: 'yellow-bourbon',
    name: 'Bourbon Amarillo (Yellow Bourbon)',
    origin: 'Brasil (selecciones históricas; ampliamente cultivado)',
    species: 'Arábica',
    altitude: '900 – 1,600 msnm',
    description: 'Selección de Bourbon de cereza amarilla. Muy usado en Brasil por su dulzor y consistencia.',
    sensoryProfile: 'Dulzor alto (miel, caramelo), acidez media cítrica suave, cuerpo medio, cacao y fruta amarilla.',
    characteristics: ['Cereza amarilla', 'Dulzor alto', 'Perfil fácil de perfilar', 'Muy común en Brasil', 'Responde bien a natural/honey']
  },
  {
    id: 'acaia',
    name: 'Acaiá',
    origin: 'Brasil (derivado de Mundo Novo; muy común en Minas Gerais)',
    species: 'Arábica',
    altitude: '900 – 1,500 msnm',
    description: 'Selección brasileña conocida por buen rendimiento y grano grande.',
    sensoryProfile: 'Chocolate, nuez, dulzor medio-alto, acidez baja-media, cuerpo medio-alto.',
    characteristics: ['Buen rendimiento', 'Grano grande', 'Vigor alto', 'Perfil clásico brasileño', 'Común en Minas Gerais']
  },
  {
    id: 'topazio',
    name: 'Topázio',
    origin: 'Brasil (IAC; línea productiva)',
    species: 'Arábica',
    altitude: '900 – 1,600 msnm',
    description: 'Variedad moderna usada por uniformidad y productividad. Muy presente en Brasil.',
    sensoryProfile: 'Caramelo, chocolate, acidez media-baja, cuerpo medio, notas a fruta amarilla.',
    characteristics: ['Uniformidad', 'Productiva', 'Buen rendimiento', 'Perfil estable', 'Común en Brasil']
  },
  {
    id: 'catucai',
    name: 'Catucaí',
    origin: 'Brasil (cruces tipo Catuaí × Icatu)',
    species: 'Arábica (híbrido con genes de resistencia)',
    altitude: '900 – 1,700 msnm',
    description: 'Híbrido muy usado en Brasil por rendimiento y sanidad. Su taza mejora en altura.',
    sensoryProfile: 'Chocolate, frutos secos, acidez media-baja, cuerpo medio-alto, dulzor a caramelo.',
    characteristics: ['Productivo', 'Mejor sanidad', 'Consistente', 'Mejora en altura', 'Muy común en Brasil']
  },
  {
    id: 'iapar59',
    name: 'IAPAR 59',
    origin: 'Brasil (IAPAR; usado en Paraná y otras zonas)',
    species: 'Arábica (híbrido con genes de resistencia)',
    altitude: '900 – 1,600 msnm',
    description: 'Material seleccionado para resistencia y estabilidad agronómica.',
    sensoryProfile: 'Cacao, caramelo, acidez baja-media, cuerpo medio, perfil limpio.',
    characteristics: ['Resistente', 'Estable', 'Buen rendimiento', 'Perfil clásico', 'Mejor en altura media']
  },
  {
    id: 'ipr100',
    name: 'IPR 100',
    origin: 'Brasil (IAPAR; selección productiva)',
    species: 'Arábica (híbrido con genes de resistencia)',
    altitude: '900 – 1,700 msnm',
    description: 'Selección brasileña enfocada en productividad y sanidad. Muy usada en sistemas tecnificados.',
    sensoryProfile: 'Chocolate, nuez, dulzor medio, acidez baja-media, cuerpo medio.',
    characteristics: ['Productivo', 'Estable', 'Buen desempeño en finca', 'Perfil consistente', 'Común en Brasil']
  },
  {
    id: 'cenicafe1',
    name: 'Cenicafé 1',
    origin: 'Colombia (CENICAFÉ; línea moderna)',
    species: 'Arábica (híbrido con genes de resistencia)',
    altitude: '1,200 – 2,000 msnm',
    description: 'Variedad colombiana moderna que busca resistencia y buena calidad en taza con manejo correcto.',
    sensoryProfile: 'Dulzor a panela, acidez media cítrica, cuerpo medio, cacao y frutas suaves.',
    characteristics: ['Resistente a roya', 'Buena productividad', 'Consistencia', 'Mejora con altura', 'Diseñada para Colombia']
  },
  {
    id: 'cenicafe2',
    name: 'Cenicafé 2',
    origin: 'Colombia (CENICAFÉ; nuevas selecciones)',
    species: 'Arábica (híbrido con genes de resistencia)',
    altitude: '1,200 – 2,100 msnm',
    description: 'Líneas recientes enfocadas en estabilidad agronómica y calidad más limpia.',
    sensoryProfile: 'Perfil balanceado, dulzor medio-alto, acidez media, cuerpo medio, final limpio.',
    characteristics: ['Resistente a roya', 'Estable', 'Productiva', 'Mejor en altura', 'Calidad más limpia']
  },
  {
    id: 'chiroso',
    name: 'Chiroso',
    origin: 'Colombia (Antioquia; selecciones locales)',
    species: 'Arábica',
    altitude: '1,500 – 2,200 msnm',
    description: 'Selección local colombiana valorada por su fragancia y claridad cuando se cultiva en altura.',
    sensoryProfile: 'Floral, fruta de hueso, acidez brillante, cuerpo medio-ligero, dulzor alto.',
    characteristics: ['Muy aromática', 'Mejor en altura', 'Microlotes', 'Alta claridad', 'Sensibles a proceso']
  },
  {
    id: 'papayo',
    name: 'Papayo',
    origin: 'Colombia (selecciones regionales)',
    species: 'Arábica',
    altitude: '1,500 – 2,200 msnm',
    description: 'Nombre local asociado a materiales de alta fragancia. En microlotes destaca por su perfil frutal.',
    sensoryProfile: 'Tropical (papaya, mango), floral suave, acidez jugosa, cuerpo medio, dulzor alto.',
    characteristics: ['Microlotes', 'Perfil tropical', 'Alta fragancia', 'Mejor en altura', 'Calidad depende del proceso']
  },
  {
    id: 'bourbon-aji',
    name: 'Bourbon Ají',
    origin: 'Colombia (selecciones; difundido en Andes)',
    species: 'Arábica',
    altitude: '1,600 – 2,200 msnm',
    description: 'Selección tipo Bourbon apreciada por su carácter aromático y dulzor cuando se maneja con precisión.',
    sensoryProfile: 'Fruta roja, especia suave, acidez media-alta, cuerpo medio, dulzor a miel.',
    characteristics: ['Alta fragancia', 'Microlotes', 'Mejor en altura', 'Sensibilidad a proceso', 'Perfil distintivo']
  },
  {
    id: 'san-ramon',
    name: 'San Ramón',
    origin: 'América Latina (mutación en linajes Typica; difundida en Andes y Centroamérica)',
    species: 'Arábica',
    altitude: '1,100 – 1,800 msnm',
    description: 'Mutación compacta asociada a porte bajo. Permite mayor densidad de siembra.',
    sensoryProfile: 'Dulzor medio, acidez media, cuerpo medio, cacao y nuez, perfil limpio.',
    characteristics: ['Porte bajo', 'Alta densidad de siembra', 'Producción media', 'Perfil clásico', 'Común en fincas tradicionales']
  },
  {
    id: 'pache',
    name: 'Pache',
    origin: 'Guatemala (mutación de Typica)',
    species: 'Arábica',
    altitude: '1,200 – 1,900 msnm',
    description: 'Mutación de Typica de porte más compacto. Se cultiva por adaptación y rendimiento estable.',
    sensoryProfile: 'Cítrico suave, caramelo, cuerpo medio, acidez media, perfil limpio.',
    characteristics: ['Mutación de Typica', 'Adaptable', 'Perfil balanceado', 'Común en Guatemala', 'Mejor en altura']
  },
  {
    id: 'oro-azteca',
    name: 'Oro Azteca',
    origin: 'México (programas de selección; muy usado en zonas cafetaleras)',
    species: 'Arábica',
    altitude: '1,100 – 1,900 msnm',
    description: 'Selección mexicana orientada a desempeño en campo y perfiles limpios cuando se procesa bien.',
    sensoryProfile: 'Panela, cacao, acidez media cítrica, cuerpo medio, notas a nuez.',
    characteristics: ['Buena adaptación', 'Perfil limpio', 'Mejor en altura', 'Común en México', 'Consistencia']
  }
];

interface GreenDefect {
  id: string;
  name: string;
  grade: 1 | 2;
  description: string;
  visualId: string;
  cupImpact: string;
  equivalence: string;
}

const GREEN_DEFECTS: GreenDefect[] = [
  // Primer Grado
  {
    id: 'full-black',
    name: 'Grano negro completo',
    grade: 1,
    description: 'Grano completamente negro, opaco y arrugado. Causado por fermentación excesiva, cerezas caídas al suelo o contacto prolongado con el suelo durante el secado. Es el defecto más severo.',
    visualId: 'Color negro uniforme, textura rugosa y quebradiza.',
    cupImpact: 'Sabor fermentado intenso, a moho, pútrido y medicinal. Un solo grano puede arruinar una taza entera.',
    equivalence: '1 grano = 1 defecto completo'
  },
  {
    id: 'full-sour',
    name: 'Grano agrio completo',
    grade: 1,
    description: 'Grano de color amarillo-marrón claro con interior vinagrado. Resultado de fermentación descontrolada durante el procesamiento húmedo, sobremaduración o contaminación microbiana.',
    visualId: 'Color amarillento/cremoso anormal, a veces con aspecto ceroso.',
    cupImpact: 'Sabor avinagrado intenso, ácido acético penetrante, notas a fermentación agresiva. Contamina la taza completa.',
    equivalence: '1 grano = 1 defecto completo'
  },
  {
    id: 'dried-cherry',
    name: 'Cereza seca / Bola',
    grade: 1,
    description: 'Cereza entera que no fue despulpada, seca con toda su cáscara. Indica fallas en el proceso de despulpado o cerezas que se secaron en la planta antes de la cosecha.',
    visualId: 'Grano encerrado en su cáscara seca, forma irregular y abultada.',
    cupImpact: 'Sabor fermentado, terroso, a fruta podrida y notas sucias. Aroma desagradable y pesado.',
    equivalence: '1 cereza = 1 defecto completo'
  },
  {
    id: 'fungus-damage',
    name: 'Hongo / Moho',
    grade: 1,
    description: 'Grano con colonias visibles de hongos (aspergillus, penicillium). Causado por almacenamiento en alta humedad (>12%) o secado insuficiente. Puede producir ocratoxina A (micotoxina).',
    visualId: 'Manchas blancas, verdes o azuladas. Textura polvorienta o algodonosa.',
    cupImpact: 'Sabor a moho, sótano húmedo, tierra mojada. Riesgo de salud por micotoxinas. Absolutamente inaceptable.',
    equivalence: '1 grano = 1 defecto completo'
  },
  {
    id: 'foreign-matter',
    name: 'Materia extraña',
    grade: 1,
    description: 'Cualquier material no café: piedras, palos, clavos, plástico, insectos, etc. Indica problemas serios de control de calidad en el beneficio.',
    visualId: 'Objetos visiblemente ajenos al café.',
    cupImpact: 'No aporta sabor directo pero indica falta total de control de calidad. Riesgo de daño a molinillos y maquinaria.',
    equivalence: '1 objeto = 1 defecto completo'
  },
  {
    id: 'severe-insect',
    name: 'Broca severa',
    grade: 1,
    description: 'Grano con múltiples perforaciones (3+) causadas por la broca del café (Hypothenemus hampei). El insecto perfora la cereza y deposita huevos dentro del grano, causando daño estructural extenso.',
    visualId: 'Múltiples agujeros circulares pequeños (~1mm), polvo residual del insecto en el interior.',
    cupImpact: 'Sabor sucio, terroso, a madera vieja, notas a grano dañado. Reduce significativamente la dulzura y limpieza.',
    equivalence: '5 granos perforados = 1 defecto completo'
  },
  // Segundo Grado
  {
    id: 'parchment',
    name: 'Pergamino',
    grade: 2,
    description: 'Grano que conserva total o parcialmente su capa de pergamino (endocarpio). Indica fallas en el trillado o descascarillado.',
    visualId: 'Capa papelosa amarillenta adherida al grano.',
    cupImpact: 'Sabor a papel, a paja, astringente. Tueste desigual por capa protectora.',
    equivalence: '2-3 granos = 1 defecto'
  },
  {
    id: 'floater',
    name: 'Flotador',
    grade: 2,
    description: 'Grano de muy baja densidad que flota en agua. Causado por secado excesivo, granos viejos, almacenamiento prolongado o desarrollo incompleto.',
    visualId: 'Grano blanquecino, opaco, esponjoso, más liviano de lo normal.',
    cupImpact: 'Sabor a paja, cartón, papeloso. Falta de dulzor y cuerpo. Vacío sensorial.',
    equivalence: '5 granos = 1 defecto'
  },
  {
    id: 'immature-quaker',
    name: 'Inmaduro / Quaker',
    grade: 2,
    description: 'Grano cosechado antes de alcanzar madurez fisiológica. No desarrolló azúcares ni compuestos aromáticos completos. Es MUY común y difícil de detectar en verde — se revela como "quaker" después del tueste (no toma color).',
    visualId: 'En verde: superficie lisa, color más claro/verdoso. En tostado: grano pálido que no carameliza.',
    cupImpact: 'Sabor a maní crudo, hierba, cereal sin tostar. Astringente, amargo vegetal. Destruye la dulzura de la taza.',
    equivalence: '5 granos = 1 defecto'
  },
  {
    id: 'withered',
    name: 'Arrugado / Marchito',
    grade: 2,
    description: 'Grano con superficie arrugada y marchita, causado por estrés hídrico durante el desarrollo, sequía o nutrición deficiente de la planta.',
    visualId: 'Superficie arrugada como una pasa, forma irregular, tamaño reducido.',
    cupImpact: 'Sabor a hierba, ligeramente astringente, falta de dulzor. Tueste irregular.',
    equivalence: '5 granos = 1 defecto'
  },
  {
    id: 'shell',
    name: 'Concha / Oreja',
    grade: 2,
    description: 'Grano deformado que se separó en dos partes: una cóncava (concha) y una convexa. Es una malformación genética o ambiental.',
    visualId: 'Forma de concha marina, hueco en el interior, paredes muy delgadas.',
    cupImpact: 'Se quema rápidamente durante el tueste (paredes delgadas). Aporta sabor a quemado/ceniza localizado.',
    equivalence: '5 granos = 1 defecto'
  },
  {
    id: 'broken-chipped',
    name: 'Partido / Roto / Mordido',
    grade: 2,
    description: 'Grano fracturado o cortado durante el despulpado mecánico o trillado. La superficie expuesta se oxida y se tuesta de manera diferente.',
    visualId: 'Fragmento de grano, borde oscurecido/oxidado donde se rompió.',
    cupImpact: 'Notas a fermento suave, ligeramente sucio, tueste desigual. La zona oxidada aporta sabor rancio.',
    equivalence: '5 granos = 1 defecto'
  }
];

interface TechStandard {
  id: string;
  name: string;
  range: string;
  definition: string;
  roasterImpact: string;
  baristaImpact: string;
}

const TECH_STANDARDS: TechStandard[] = [
  {
    id: 'moisture',
    name: 'Contenido de Humedad',
    range: '10 – 12%',
    definition: 'Porcentaje de agua presente en el grano verde. Se mide con un medidor de humedad de grano. Es el indicador más crítico para la estabilidad durante el almacenamiento y la calidad del tueste.',
    roasterImpact: 'Humedad alta (>12%) → tueste más lento, mayor riesgo de baking, grano más difícil de desarrollar. Humedad baja (<10%) → tueste demasiado rápido, desarrollo irregular, grano quebradizo. Afecta directamente la pérdida de peso (merma).',
    baristaImpact: 'Humedad fuera de rango produce granos con menor consistencia en extracción. Café con humedad excesiva suele tener notas terrosas y falta de brillo. Café muy seco puede tener sabores a papel o madera vieja.'
  },
  {
    id: 'water-activity',
    name: 'Actividad de Agua (Aw)',
    range: '< 0.70 Aw (ideal: 0.45–0.65)',
    definition: 'Mide el agua "libre" disponible para reacciones químicas y crecimiento microbiano (no la misma que humedad total). Una Aw > 0.70 permite el crecimiento de hongos y levaduras.',
    roasterImpact: 'Aw alta indica riesgo de degradación durante almacenamiento. Cafés con Aw correcta desarrollan mejor durante el tueste porque la transferencia de calor es más uniforme.',
    baristaImpact: 'Un café verde con Aw controlada resulta en un grano tostado con mejor estabilidad de sabor a lo largo del tiempo (shelf life). Aw descontrolada = café que envejece rápido en taza.'
  },
  {
    id: 'density',
    name: 'Densidad',
    range: '650 – 800 g/L (densidad aparente)',
    definition: 'Peso por unidad de volumen del grano. Cafés de mayor altitud suelen ser más densos porque la maduración más lenta permite mayor acumulación de azúcares y compuestos.',
    roasterImpact: 'Granos densos requieren más energía (temperatura inicial más alta o RoR más sostenido) para penetrar al centro. Granos blandos se tuestan más rápido y con menor carga térmica. Mezclar densidades en un mismo batch = tueste desigual.',
    baristaImpact: 'Mayor densidad generalmente = mayor complejidad y acidez en taza. Café denso bien tostado produce más dulzura y brillo. Café de baja densidad tiende a perfiles más simples, con más cuerpo y menos definición aromática.'
  },
  {
    id: 'screen-size',
    name: 'Tamaño (Screen Size)',
    range: 'Screen 14 – 20 (mayoría: 15–18)',
    definition: 'Se mide en "screens" (zarandas) de 1/64 de pulgada. Un Screen 16 = 16/64" = 6.35mm de diámetro. El tamaño se clasifica en: AA (>18), A (16-17), B (14-15), C (<14). Un café de especialidad generalmente es Screen 15+.',
    roasterImpact: 'Uniformidad de tamaño = uniformidad de tueste. Si mezclas Screen 14 con Screen 18 en un mismo batch, los pequeños se quemarán cuando los grandes estén apenas desarrollados. Siempre tostar granos del mismo screen.',
    baristaImpact: 'Granos grandes no necesariamente son mejores. El tamaño indica uniformidad de extracción — granos de tamaño inconsistente generan una molienda con distribución bimodal irregular.'
  },
  {
    id: 'color',
    name: 'Color del grano verde',
    range: 'Verde-azulado a verde-amarillento',
    definition: 'El color indica frescura y proceso. Verde azulado = fresco, lavado. Verde amarillento = más tiempo de almacenamiento o proceso natural/honey. Blanquecino = viejo o sobre-secado. El color se evalúa visualmente o con colorímetro.',
    roasterImpact: 'Café verde-azulado (fresh crop) tolera perfiles de tueste más agresivos y desarrolla mejores notas de origen. Café past-crop (amarillento) requiere perfiles más suaves y pierde acidez y dulzor con el tiempo.',
    baristaImpact: 'Un café que fue verde-azulado y ahora es amarillo probablemente ha perdido potencial aromático. En taza se traduce en notas apagadas, falta de acidez vibrante y sabor a "madera" o "papel".'
  },
  {
    id: 'defect-count',
    name: 'Conteo de Defectos',
    range: 'Grado 1 (Especialidad): 0 cat. 1, máx 5 cat. 2 por 350g',
    definition: 'La SCA define los grados de calidad basándose en defectos encontrados en una muestra de 350g de café verde. Un defecto de Categoría 1 (grano negro, hongo, etc.) descalifica automáticamente el lote como "especialidad".',
    roasterImpact: 'Defectos en verde = defectos en taza. Un quaker (inmaduro) no carameliza y aporta sabor a maní/paja. Un grano con broca se quema localmente. Un café limpio permite tostar con confianza y repetibilidad.',
    baristaImpact: 'Aunque no seleccionas en verde, entender defectos te ayuda a diagnosticar problemas en taza. Si detectas notas a moho, fermentado o vegetal crudo, probablemente el verde tenía defectos que el tueste no puede corregir.'
  }
];

interface GeoRegion {
  id: string;
  group: 'Perú' | 'Colombia' | 'Brasil' | 'México' | 'Indonesia' | 'África' | 'Centroamérica';
  name: string;
  conditions: string;
  growthImpact: string;
  typicalTraits: string;
}

const GEO_REGIONS: GeoRegion[] = [
  {
    id: 'peru-cajamarca',
    group: 'Perú',
    name: 'Cajamarca',
    conditions: 'Altitudes altas con noches frías; suelos de montaña; lluvias estacionales.',
    growthImpact: 'Maduración más lenta y mayor densidad del grano; la sombra y la humedad controlan estrés hídrico.',
    typicalTraits: 'Mayor dulzor y estructura, acidez cítrica/málica media-alta, notas a cacao y fruta amarilla.'
  },
  {
    id: 'peru-junin',
    group: 'Perú',
    name: 'Junín (Selva Central)',
    conditions: 'Clima húmedo de selva alta; nubosidad frecuente; buena disponibilidad de agua.',
    growthImpact: 'Crecimiento vegetativo vigoroso; requiere control de sombra y manejo sanitario por humedad.',
    typicalTraits: 'Cuerpo medio, dulzor a panela, acidez media, notas a chocolate y fruta madura.'
  },
  {
    id: 'peru-cusco',
    group: 'Perú',
    name: 'Cusco (Convención)',
    conditions: 'Altitud variable; microclimas con días templados y noches frías.',
    growthImpact: 'Amplitud térmica favorece acumulación de azúcares y densidad; floración puede ser escalonada.',
    typicalTraits: 'Acidez más brillante, perfiles florales/frutales en lotes altos, final largo y limpio.'
  },
  {
    id: 'colombia-huila',
    group: 'Colombia',
    name: 'Huila',
    conditions: 'Altitud media-alta; radiación solar alta; suelos volcánicos en muchas zonas.',
    growthImpact: 'Buena fotosíntesis y maduración estable; el manejo de sombra define velocidad de maduración.',
    typicalTraits: 'Dulzor alto, acidez cítrica jugosa, cuerpo medio, notas a frutas rojas y caramelo.'
  },
  {
    id: 'colombia-narino',
    group: 'Colombia',
    name: 'Nariño',
    conditions: 'Altitudes muy altas; noches frías; laderas andinas con gran amplitud térmica.',
    growthImpact: 'Maduración lenta y granos muy densos; mayor concentración de compuestos aromáticos.',
    typicalTraits: 'Acidez brillante y limpia, alta claridad, perfiles florales y cítricos, cuerpo medio.'
  },
  {
    id: 'colombia-sierra-nevada',
    group: 'Colombia',
    name: 'Sierra Nevada de Santa Marta',
    conditions: 'Montaña costera; humedad del Caribe; variación de altitud con brisas.',
    growthImpact: 'Humedad y brisa influyen en estrés y sanidad; sombra ayuda a estabilizar maduración.',
    typicalTraits: 'Cuerpo medio, dulzor a panela, acidez media, notas a cacao, nuez y fruta madura.'
  },
  {
    id: 'brasil-cerrado',
    group: 'Brasil',
    name: 'Cerrado Mineiro',
    conditions: 'Estación seca marcada; altitudes moderadas; alta mecanización.',
    growthImpact: 'Floración más uniforme con inicio de lluvias; maduración pareja si se controla riego/estrés.',
    typicalTraits: 'Chocolate, nuez, caramelo; acidez media-baja; cuerpo medio-alto y perfil muy consistente.'
  },
  {
    id: 'brasil-sul-de-minas',
    group: 'Brasil',
    name: 'Sul de Minas / Mantiqueira',
    conditions: 'Montañas con altitud; noches más frías; microclimas y laderas.',
    growthImpact: 'Mayor densidad del grano; maduración más lenta que en zonas planas; selección por lote es clave.',
    typicalTraits: 'Más acidez y dulzor que otros brasiles, notas a caramelo, cacao y fruta amarilla, cuerpo medio.'
  },
  {
    id: 'brasil-mogiana',
    group: 'Brasil',
    name: 'Mogiana (São Paulo)',
    conditions: 'Altitud moderada; clima más templado; suelos fértiles.',
    growthImpact: 'Crecimiento estable y buena uniformidad; el secado postcosecha define claridad final.',
    typicalTraits: 'Cacao, almendra, caramelo; acidez suave; textura redonda y final dulce.'
  },
  {
    id: 'mexico-chiapas',
    group: 'México',
    name: 'Chiapas',
    conditions: 'Montañas húmedas; alta biodiversidad; sombra frecuente.',
    growthImpact: 'Sombra regula temperatura y protege de estrés; alta humedad requiere control de fermentación/secado.',
    typicalTraits: 'Dulzor a panela, cacao, acidez media, cuerpo medio, notas a fruta madura y especias suaves.'
  },
  {
    id: 'mexico-oaxaca',
    group: 'México',
    name: 'Oaxaca (Sierra Sur / Pluma)',
    conditions: 'Altitud; vientos y microclimas; suelos de montaña.',
    growthImpact: 'Maduración más lenta en altura; el viento reduce humedad pero puede estresar la planta.',
    typicalTraits: 'Acidez más brillante, notas florales y cítricas en lotes altos, cuerpo medio y final limpio.'
  },
  {
    id: 'mexico-veracruz',
    group: 'México',
    name: 'Veracruz (Coatepec y alrededores)',
    conditions: 'Alta humedad y nubosidad; suelos volcánicos en zonas cafetaleras.',
    growthImpact: 'Baja radiación directa favorece maduración más lenta; humedad exige buen manejo sanitario.',
    typicalTraits: 'Cuerpo medio, dulzor medio-alto, acidez media, cacao y frutos secos; perfil balanceado.'
  },
  {
    id: 'indonesia-gayo',
    group: 'Indonesia',
    name: 'Sumatra (Gayo/Aceh)',
    conditions: 'Clima húmedo; montañas; procesos tradicionales y diversidad de microclimas.',
    growthImpact: 'Humedad alta aumenta presión de enfermedades; cosecha y secado deben ser muy controlados.',
    typicalTraits: 'Cuerpo alto, menor acidez, notas terrosas/especiadas y cacao; textura densa.'
  },
  {
    id: 'indonesia-java',
    group: 'Indonesia',
    name: 'Java',
    conditions: 'Zonas volcánicas; clima templado; producción histórica.',
    growthImpact: 'Suelos volcánicos aportan buen vigor; manejo de sombra y drenaje define sanidad.',
    typicalTraits: 'Cuerpo medio-alto, cacao, especias suaves, acidez media-baja, final largo.'
  },
  {
    id: 'indonesia-bali',
    group: 'Indonesia',
    name: 'Bali (Kintamani)',
    conditions: 'Altitud moderada; suelos volcánicos; brisas y buena radiación.',
    growthImpact: 'Maduración relativamente uniforme; buen drenaje reduce estrés por exceso de agua.',
    typicalTraits: 'Más cítrico y limpio que otros indonesios, dulzor medio-alto, cuerpo medio.'
  },
  {
    id: 'africa-ethiopia-yirgacheffe',
    group: 'África',
    name: 'Etiopía (Yirgacheffe/Sidama/Guji)',
    conditions: 'Altitudes altas; bosques y sombra natural; micro-lotes muy diversos.',
    growthImpact: 'Maduración lenta y alta densidad; diversidad genética y suelos favorecen complejidad aromática.',
    typicalTraits: 'Floral y cítrico, frutas de hueso/berries, acidez brillante y alta claridad.'
  },
  {
    id: 'africa-kenya-central',
    group: 'África',
    name: 'Kenia (Nyeri/Kirinyaga)',
    conditions: 'Altitud; noches frías; manejo cooperativo y lavados muy consistentes.',
    growthImpact: 'Maduración lenta y alta concentración de ácidos orgánicos; selección y beneficio elevan limpieza.',
    typicalTraits: 'Acidez jugosa tipo grosella/cítrico, fruta roja, cuerpo medio y final largo.'
  },
  {
    id: 'africa-rwanda',
    group: 'África',
    name: 'Ruanda (Lago Kivu / Nyamasheke)',
    conditions: 'Altitud; influencia lacustre; clima templado con lluvias estacionales.',
    growthImpact: 'Crecimiento estable y maduración uniforme; el secado controlado es clave por humedad.',
    typicalTraits: 'Dulzor alto, acidez media-alta, frutas rojas y notas florales suaves; cuerpo medio.'
  },
  {
    id: 'ca-guatemala-huehue',
    group: 'Centroamérica',
    name: 'Guatemala (Huehuetenango)',
    conditions: 'Altitudes altas; clima seco para la altura; suelos de montaña.',
    growthImpact: 'Noches frías favorecen densidad; clima más seco facilita secado y limpieza.',
    typicalTraits: 'Acidez brillante, dulzor alto, fruta y cacao, cuerpo medio; taza muy limpia.'
  },
  {
    id: 'ca-guatemala-antigua',
    group: 'Centroamérica',
    name: 'Guatemala (Antigua)',
    conditions: 'Suelos volcánicos; clima templado; buena radiación.',
    growthImpact: 'Vigor y nutrición consistentes; maduración estable; buen potencial de desarrollo en tueste.',
    typicalTraits: 'Chocolate y especias suaves, acidez media, cuerpo medio-alto y final largo.'
  },
  {
    id: 'ca-costa-rica-tarrazu',
    group: 'Centroamérica',
    name: 'Costa Rica (Tarrazú)',
    conditions: 'Altitudes altas; noches frías; clima más seco en cosecha.',
    growthImpact: 'Granos densos y maduros; secado más controlable aporta limpieza.',
    typicalTraits: 'Acidez brillante, dulzor alto, fruta y caramelo; cuerpo medio y alta claridad.'
  },
  {
    id: 'ca-honduras-santa-barbara',
    group: 'Centroamérica',
    name: 'Honduras (Santa Bárbara)',
    conditions: 'Altitud; microclimas con neblina; suelos de montaña.',
    growthImpact: 'Neblina regula temperatura; maduración lenta; manejo de sombra reduce estrés y mejora uniformidad.',
    typicalTraits: 'Dulzor medio-alto, acidez media, cacao y fruta; cuerpo medio con final limpio.'
  }
];

// ─── Simulator ───────────────────────────────────────────────────────────────

const VarietySimulator: React.FC = () => {
  const [target, setTarget] = useState<Variety | null>(null);
  const [options, setOptions] = useState<Variety[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);

  const generateQuestion = () => {
    const randomTarget = VARIETIES[Math.floor(Math.random() * VARIETIES.length)];
    const others = VARIETIES.filter(v => v.id !== randomTarget.id);
    const shuffled = [...others].sort(() => 0.5 - Math.random()).slice(0, 3);
    const newOptions = [randomTarget, ...shuffled].sort(() => 0.5 - Math.random());

    setTarget(randomTarget);
    setOptions(newOptions);
    setSelected(null);
    setFeedback(null);
  };

  useEffect(() => {
    generateQuestion();
  }, []);

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

  const summarizeText = (text: string, sentenceCount: number, maxLen: number) => {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';

    let remaining = normalized;
    let summary = '';

    for (let i = 0; i < sentenceCount; i += 1) {
      const match = remaining.match(/[.!?]/);
      if (!match) break;
      const endIndex = remaining.indexOf(match[0]);
      const sentence = remaining.slice(0, endIndex + 1).trim();
      summary = summary ? `${summary} ${sentence}` : sentence;
      remaining = remaining.slice(endIndex + 1).trim();
      if (!remaining) break;
    }

    const base = (summary || normalized).trim();
    if (base.length <= maxLen) return base;
    return `${base.slice(0, Math.max(0, maxLen - 1)).trim()}…`;
  };

  const promptDescription = summarizeText(target.description, 1, 180);
  const displayDescription = summarizeText(target.description, 2, 260);
  const displaySensoryProfile = summarizeText(target.sensoryProfile, 2, 260);

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Header & Streak */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-400">
          <Brain className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Identificador de Variedades</span>
        </div>
        <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full">
          <Trophy className={`w-4 h-4 ${streak > 0 ? 'text-yellow-500' : 'text-stone-400'}`} />
          <span className="text-sm font-black text-stone-900 dark:text-stone-100">{streak}</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 md:p-12 rounded-2xl shadow-sm text-center space-y-8">
        <div className="space-y-4">
          <p className="text-sm text-stone-500 uppercase tracking-widest font-bold">
            ¿Qué variedad es?
          </p>
          <div className="space-y-4 max-w-2xl mx-auto">
            <h3 className="text-lg md:text-xl font-serif italic text-stone-900 dark:text-stone-100 leading-relaxed">
              "{promptDescription}"
            </h3>
            {feedback && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700 rounded-xl text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Descripción</p>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    {displayDescription}
                  </p>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700 rounded-xl text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Perfil sensorial</p>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed italic">
                    {displaySensoryProfile}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feedback */}
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

        {/* Options */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            const isCorrect = opt.id === target.id;
            const showCorrect = feedback && isCorrect;
            const showWrong = feedback && isSelected && !isCorrect;

            let buttonStyle = 'border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-stone-700';

            if (showCorrect) {
              buttonStyle = 'border-green-500 bg-green-500 text-white shadow-lg scale-105';
            } else if (showWrong) {
              buttonStyle = 'border-red-500 bg-red-500 text-white opacity-50';
            } else if (feedback) {
              buttonStyle = 'border-stone-100 bg-stone-50 text-stone-300 dark:border-stone-800 dark:bg-stone-900/50 dark:text-stone-600 opacity-50';
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={!!feedback}
                className={`p-6 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border-2 w-full flex items-center justify-center text-center ${buttonStyle}`}
              >
                {opt.name}
              </button>
            );
          })}
        </div>

        {/* Next */}
        {feedback && (
          <div className="pt-4 flex justify-center animate-fade-in-up">
            <button
              onClick={generateQuestion}
              className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-all flex items-center gap-2 shadow-xl"
            >
              Siguiente Pregunta <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Varieties Tab ───────────────────────────────────────────────────────────

const VarietiesTab: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = VARIETIES.find(v => v.id === selectedId) || null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3">
        <h2 className="text-base md:text-lg font-black uppercase tracking-[0.25em] text-stone-900 dark:text-stone-100">
          Variedades de Café
        </h2>
        <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
          Cada variedad tiene una genética, un rango de altitud y un perfil sensorial único. Selecciona una para explorar sus características.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {VARIETIES.map(v => (
          <button
            key={v.id}
            type="button"
            onClick={() => setSelectedId(selectedId === v.id ? null : v.id)}
            className={`px-3 py-1.5 rounded-full border text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${
              selectedId === v.id
                ? 'bg-black text-white dark:bg-stone-100 dark:text-stone-900 border-black'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-black dark:hover:border-white'
            }`}
          >
            {v.name}
          </button>
        ))}
      </div>

      <div className="min-h-[200px] rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/60 p-5 md:p-6">
        {selected ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Origen</p>
                <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selected.origin}</p>
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Especie</p>
                <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selected.species}</p>
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Altitud ideal</p>
                <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selected.altitude}</p>
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Perfil sensorial</p>
                <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed italic">{selected.sensoryProfile}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Descripción</p>
                <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selected.description}</p>
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Características</p>
                <ul className="list-disc list-inside space-y-1 text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                  {selected.characteristics.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[11px] md:text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Selecciona una variedad para ver su origen, altitud ideal, perfil sensorial y características botánicas.
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Tech Standards Tab ──────────────────────────────────────────────────────

const TechStandardsTab: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = TECH_STANDARDS.find(s => s.id === selectedId) || null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3">
        <h2 className="text-base md:text-lg font-black uppercase tracking-[0.25em] text-stone-900 dark:text-stone-100">
          Datos Técnicos del Café Verde
        </h2>
        <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
          Estándares internacionales y parámetros que definen la calidad de un café verde. Conocer estos valores te permite evaluar lotes, predecir comportamiento en tueste y diagnosticar problemas en taza.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TECH_STANDARDS.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
            className={`px-3 py-1.5 rounded-full border text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${
              selectedId === s.id
                ? 'bg-black text-white dark:bg-stone-100 dark:text-stone-900 border-black'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-black dark:hover:border-white'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="min-h-[200px] rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/60 p-5 md:p-6">
        {selected ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Rango estándar</p>
                <p className="text-sm font-black text-stone-900 dark:text-stone-100">{selected.range}</p>
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Definición</p>
                <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selected.definition}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Impacto para el tostador
                </p>
                <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selected.roasterImpact}</p>
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  Impacto para el barista
                </p>
                <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selected.baristaImpact}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[11px] md:text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Selecciona un parámetro para ver su rango estándar, definición y cómo impacta al tostador y al barista.
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Defects Tab ─────────────────────────────────────────────────────────────

const DefectsTab: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = GREEN_DEFECTS.find(d => d.id === selectedId) || null;

  const grade1 = GREEN_DEFECTS.filter(d => d.grade === 1);
  const grade2 = GREEN_DEFECTS.filter(d => d.grade === 2);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-3">
        <h2 className="text-base md:text-lg font-black uppercase tracking-[0.25em] text-stone-900 dark:text-stone-100">
          Defectos del Café Verde
        </h2>
        <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
          Clasificación SCA de defectos físicos. Los de Primer Grado descalifican un lote de especialidad automáticamente. Los de Segundo Grado se permiten hasta un máximo de 5 en 350g.
        </p>
      </div>

      {/* Grade 1 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-red-500">
            Defectos de Primer Grado (Descalificantes)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {grade1.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedId(selectedId === d.id ? null : d.id)}
              className={`px-3 py-1.5 rounded-full border text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${
                selectedId === d.id
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-red-400 dark:hover:border-red-400 hover:text-red-600 dark:hover:text-red-400'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grade 2 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Defectos de Segundo Grado (Máx 5 en 350g)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {grade2.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedId(selectedId === d.id ? null : d.id)}
              className={`px-3 py-1.5 rounded-full border text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${
                selectedId === d.id
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="min-h-[200px] rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/60 p-5 md:p-6">
        {selected ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${selected.grade === 1 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                  Grado {selected.grade}
                </span>
                <span className="text-[10px] text-stone-400 font-bold">{selected.equivalence}</span>
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Descripción</p>
                <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selected.description}</p>
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Identificación visual</p>
                <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selected.visualId}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Impacto en taza</p>
                <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selected.cupImpact}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[11px] md:text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Selecciona un defecto para ver su descripción, identificación visual e impacto en la taza final.
          </p>
        )}
      </div>
    </div>
  );
};

const GeographicInfluenceTab: React.FC = () => {
  const groups: GeoRegion['group'][] = ['Perú', 'Colombia', 'Brasil', 'México', 'Indonesia', 'África', 'Centroamérica'];
  const [activeGroup, setActiveGroup] = useState<GeoRegion['group']>('Perú');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const regions = GEO_REGIONS.filter(r => r.group === activeGroup);
  const selected = GEO_REGIONS.find(r => r.id === selectedId) || null;

  useEffect(() => {
    const first = regions[0]?.id ?? null;
    setSelectedId(first);
  }, [activeGroup]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3">
        <h2 className="text-base md:text-lg font-black uppercase tracking-[0.25em] text-stone-900 dark:text-stone-100">
          Influencia Geográfica
        </h2>
        <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
          La región cambia temperatura, radiación, suelos y ritmo de maduración. Eso impacta densidad del grano, sanidad de la planta y el perfil típico en taza.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {groups.map(g => (
          <button
            key={g}
            type="button"
            onClick={() => setActiveGroup(g)}
            className={`px-3 py-1.5 rounded-full border text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${
              activeGroup === g
                ? 'bg-black text-white dark:bg-stone-100 dark:text-stone-900 border-black'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-black dark:hover:border-white'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {regions.map(r => (
          <button
            key={r.id}
            type="button"
            onClick={() => setSelectedId(selectedId === r.id ? null : r.id)}
            className={`px-3 py-1.5 rounded-full border text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${
              selectedId === r.id
                ? 'bg-brand text-white border-brand'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-brand hover:text-brand dark:hover:border-brand dark:hover:text-brand'
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      <div className="min-h-[200px] rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/60 p-5 md:p-6">
        {selected ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Condiciones comunes</p>
                <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selected.conditions}</p>
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Impacto en el crecimiento</p>
                <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{selected.growthImpact}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-stone-500">Rasgos típicos que aporta</p>
                <p className="text-[11px] md:text-xs text-stone-700 dark:text-stone-300 leading-relaxed italic">{selected.typicalTraits}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[11px] md:text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Selecciona una región para ver sus condiciones, cómo impacta el crecimiento y qué rasgos suele aportar.
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Main View ───────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

export const GreenCoffeeToolView: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'varieties' | 'tech' | 'defects' | 'geo'>('simulator');

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter text-stone-900 dark:text-stone-100">
                Café Verde
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hidden sm:block">
                Variedades, estándares y origen
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto scrollbar-hide">
          {[
            { id: 'simulator', label: 'Simulador' },
            { id: 'varieties', label: 'Variedades' },
            { id: 'tech', label: 'Datos Técnicos' },
            { id: 'defects', label: 'Defectos' },
            { id: 'geo', label: 'Influencia geográfica' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'simulator' && <VarietySimulator />}
        {activeTab === 'varieties' && <VarietiesTab />}
        {activeTab === 'tech' && <TechStandardsTab />}
        {activeTab === 'defects' && <DefectsTab />}
        {activeTab === 'geo' && <GeographicInfluenceTab />}
      </div>
    </div>
  );
};

export default GreenCoffeeToolView;
