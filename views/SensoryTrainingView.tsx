import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Brain, Check, ChevronRight, RefreshCw, Trophy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import CuppingView from './CuppingView';

// --- Data ---

type AttributeCategory = 'fragancia' | 'cuerpo' | 'postgusto' | 'acidez' | 'dulzor' | 'amargor';

interface SensoryAttribute {
  id: string;
  name: string;
  category: AttributeCategory;
  description: string;
  clue: string;
  type: 'positive' | 'negative';
}

const ATTRIBUTES: SensoryAttribute[] = [
  // --- Fragancia / Aroma ---
  // Positivos
  { id: 'frag-floral', name: 'Floral', category: 'fragancia', type: 'positive', description: 'Aroma limpio, delicado y perfumado que recuerda a flor de jazmÃ­n, azahar, rosa o lavanda. Es uno de los indicadores mÃ¡s claros de alta altitud, variedad etÃ­ope o Geisha y proceso lavado de calidad.', clue: 'Jasmin, azahar, rosa.' },
  { id: 'frag-citric', name: 'CÃ­trico', category: 'fragancia', type: 'positive', description: 'Aroma vivo y fresco que evoca la cÃ¡scara de limÃ³n, naranja o bergamota. Indica buena concentraciÃ³n de Ã¡cidos cÃ­trico y mÃ¡lico, ligada a variedades como SL28 o Caturra en altitud alta.', clue: 'LimÃ³n, naranja, bergamota.' },
  { id: 'frag-fruity', name: 'Frutal', category: 'fragancia', type: 'positive', description: 'Aroma a frutas maduras â€” bayas, fruta de hueso (melocotÃ³n, cereza) o fruta tropical (maracuyÃ¡, mango). ComÃºn en naturales de alta calidad y variedades de mucho dulzor genÃ©tico.', clue: 'Bayas, melocotÃ³n, tropical.' },
  { id: 'frag-caramel', name: 'Caramelo / Dulce', category: 'fragancia', type: 'positive', description: 'Aroma cÃ¡lido y reconfortante a azÃºcar tostada, caramelo o dulce de leche. SeÃ±al de buen desarrollo de Maillard y alta concentraciÃ³n de sacarosa en el grano. Predomina en Bourbon, CatuaÃ­ y naturales.', clue: 'AzÃºcar tostada, caramelo.' },
  { id: 'frag-chocolate', name: 'Chocolate / Cacao', category: 'fragancia', type: 'positive', description: 'Aroma profundo y envolvente a chocolate oscuro o cacao en polvo de calidad. TÃ­pico de tuestes medios de orÃ­genes latinoamericanos y variedades de alta densidad.', clue: 'Chocolate oscuro, cacao.' },
  { id: 'frag-nutty', name: 'Nuez / Almendra', category: 'fragancia', type: 'positive', description: 'Aroma seco y elegante a frutos secos â€” nuez, almendra o avellana â€” ligeramente tostados. SeÃ±ala buen desarrollo sin sobre-tueste y presencia de compuestos pirazinosados.', clue: 'Nuez, almendra tostada.' },
  { id: 'frag-spicy', name: 'Especiado', category: 'fragancia', type: 'positive', description: 'Aroma cÃ¡lido y complejo que recuerda a canela, clavo, cardamomo o pimienta. Puede originar del terroir (suelos volcÃ¡nicos), del proceso o de variedades con alcaloides especÃ­ficos.', clue: 'Canela, cardamomo, clavo.' },
  { id: 'frag-brown-sugar', name: 'AzÃºcar Morena / Panela', category: 'fragancia', type: 'positive', description: 'Aroma terroso-dulce a panela, melaza o azÃºcar mascabado. Indica alto contenido de azÃºcares sin refinar, asociado a procesos honey o natural y a variedades de alta altitud.', clue: 'Panela, melaza, raspadura.' },
  { id: 'frag-herbal-fine', name: 'Herbal Fino', category: 'fragancia', type: 'positive', description: 'Aroma fresco y aromÃ¡tico a hierbas finas â€” menta, tomillo o hierba luisa â€” que aÃ±ade complejidad sin agresividad. Presente en algunos etÃ­opes lavados y en variedades procesadas naturalmente a baja temperatura.', clue: 'Menta, tomillo, hierba.' },
  { id: 'frag-honey', name: 'Miel', category: 'fragancia', type: 'positive', description: 'Aroma dulce, floral y ligeramente viscoso que recuerda a la miel de abejas o nÃ©ctar. ComÃºn en cafÃ©s procesados con mÃ©todo honey y en variedades con alta sacarosa disponible.', clue: 'Miel, nÃ©ctar de flores.' },
  { id: 'frag-cereal-fine', name: 'Cereal tostado fino', category: 'fragancia', type: 'positive', description: 'Aroma limpio a cereal bien tostado â€” pan reciÃ©n horneado, galleta de avena â€” sin caer en notas planas o "baked". SeÃ±al positiva de buen desarrollo de Maillard en tuestes medios.', clue: 'Pan horneado, galleta.' },
  { id: 'frag-winey', name: 'Vinoso / Afrutado fermentado', category: 'fragancia', type: 'positive', description: 'Aroma complejo a vino tinto joven, uva madura o fruta fermentada de manera controlada. Propio de procesos naturales o experimentales bien gestionados. Debe ser elegante, no defectuoso.', clue: 'Vino tinto, uva fermentada.' },
  { id: 'frag-smoky-fine', name: 'Ahumado fino', category: 'fragancia', type: 'positive', description: 'Leve aroma a madera tostada o roble que aÃ±ade profundidad al perfil sin resultar agresivo. SeÃ±al de tuestes medios-oscuros bien controlados donde el grano no se carbonizÃ³.', clue: 'Madera tostada, roble.' },
  { id: 'frag-clean', name: 'Limpio y brillante', category: 'fragancia', type: 'positive', description: 'Fragancia cristalina, sin off-notes, que permite identificar con claridad los atributos positivos. Es una cualidad en sÃ­ misma: indica ausencia de defectos de proceso o almacenamiento.', clue: 'Cristalino, sin off-notes.' },
  { id: 'frag-intense', name: 'Intenso / Pronunciado', category: 'fragancia', type: 'positive', description: 'Fragancia de alta concentraciÃ³n que llena el olfato inmediatamente al abrir el recipiente o en el wet break. No implica un aroma especÃ­fico sino la potencia con que se percibe cualquier atributo positivo.', clue: 'Fragancia potente y clara.' },
  // Negativos
  { id: 'frag-grassy', name: 'HerbÃ¡ceo verde / Vegetal', category: 'fragancia', type: 'negative', description: 'Aroma crudo, verde y vegetal que recuerda al cÃ©sped reciÃ©n cortado, pimiento o espinaca. Indica subdesarrollo en el tueste, secado deficiente del verde, o cafÃ© muy nuevo sin reposo (too fresh).', clue: 'Hierba cruda, pimiento verde.' },
  { id: 'frag-fermented-bad', name: 'Fermentado defectuoso', category: 'fragancia', type: 'negative', description: 'Olor agrio, avinagrado o a basura fermentada. Radicalmente diferente a un vinoso positivo. SeÃ±al inequÃ­voca de sobre-fermentaciÃ³n, fermentaciÃ³n anaerÃ³bica no controlada o contaminaciÃ³n bacteriana en el beneficio.', clue: 'Ãcido agrio, vinagre, basura.' },
  { id: 'frag-earthy-neg', name: 'Terroso defectuoso', category: 'fragancia', type: 'negative', description: 'Olor hÃºmedo a tierra mojada, moho o sÃ³tano. Diferente del terroso mineral positivo de algunos suelos. Indica granos almacenados con humedad excesiva, mal secado o presencia de Ochratoxina A.', clue: 'Moho, tierra hÃºmeda, sÃ³tano.' },
  { id: 'frag-phenolic-neg', name: 'FenÃ³lico / Medicinal', category: 'fragancia', type: 'negative', description: 'Olor quÃ­mico a plÃ¡stico quemado, caucho, desinfectante o yodo. Generado por la actividad de Pseudomonas o contaminaciÃ³n quÃ­mica durante el proceso. Defecto grave e intolerable en especialidad.', clue: 'PlÃ¡stico, caucho, hospital.' },
  { id: 'frag-rancid', name: 'Rancio / Aceite oxidado', category: 'fragancia', type: 'negative', description: 'Olor desagradable a grasa vieja, nuez rancia o aceite de freÃ­r pasado. Producido por la oxidaciÃ³n de los lÃ­pidos del grano, generalmente por almacenamiento prolongado o exposiciÃ³n a luz y calor.', clue: 'Grasa vieja, nuez rancia.' },
  { id: 'frag-musty', name: 'Mohoso / HÃºmedo', category: 'fragancia', type: 'negative', description: 'Aroma a cerrado, humedad estancada u hongos. Asociado a granos almacenados con actividad de agua (Aw) mayor a 0.65, condiciones ideales para Aspergillus y otros mohos que generan micotoxinas.', clue: 'Hongos, humedad cerrada.' },
  { id: 'frag-smoky-neg', name: 'Ahumado agresivo / Carbonoso', category: 'fragancia', type: 'negative', description: 'Olor dominante a humo denso, ceniza o carbÃ³n. SeÃ±al de sobre-tueste, segundo crack alcanzado o chaff quemado reabsorbido por falta de airflow. Cubre cualquier atributo positivo.', clue: 'Humo denso, ceniza, carbÃ³n.' },
  { id: 'frag-cereal-baked', name: 'Cereal horneado / Plano', category: 'fragancia', type: 'negative', description: 'Aroma insÃ­pido y aburrido a pan de molde, cartÃ³n o cereal sin tostar. SeÃ±al de baking: RoR plano durante la fase de Maillard o desarrollo insuficiente post-crack.', clue: 'Pan de molde, cartÃ³n, plano.' },
  { id: 'frag-rubbery', name: 'Caucho / Goma', category: 'fragancia', type: 'negative', description: 'Olor a goma quemada o caucho viejo. Producido por la degradaciÃ³n de polifenoles o por cafÃ©s robustas o hÃ­bridos con alta concentraciÃ³n de diterpenos. Defecto frecuente en tuestes de Catimor.', clue: 'Goma, caucho quemado.' },
  { id: 'frag-stale', name: 'Plano / Oxidado', category: 'fragancia', type: 'negative', description: 'Ausencia de fragancia o aroma muy dÃ©bil y apagado. El cafÃ© ha perdido sus compuestos volÃ¡tiles por exposiciÃ³n al aire, calor o tiempo excesivo desde el tueste. No hay notas identificables.', clue: 'Sin fragancia, oxidado, viejo.' },
  { id: 'frag-animal', name: 'Animal / Cuero', category: 'fragancia', type: 'negative', description: 'Aroma a cuero, establo o animal que recuerda a procesos mal controlados con fermentaciones prolongadas en hÃºmedo o cafÃ©s procesados con mucÃ­lago en fermentaciÃ³n extendida sin higiene.', clue: 'Cuero, establo, animal.' },
  { id: 'frag-harsh', name: 'Ãspero / Picante quÃ­mico', category: 'fragancia', type: 'negative', description: 'Aroma que provoca una sensaciÃ³n de irritaciÃ³n nasal o picor, sin ser especiado de manera positiva. Asociado a sobre-extracciÃ³n aromÃ¡tica por tueste muy oscuro o a presencia de compuestos aldehÃ­dicos de degradaciÃ³n.', clue: 'Irritante nasal, picor quÃ­mico.' },

  // --- Cuerpo (Body) ---
  // Positivos
  { id: 'body-silky', name: 'Sedoso', category: 'cuerpo', type: 'positive', description: 'SensaciÃ³n tÃ¡ctil uniformemente suave que recorre toda la lengua y el paladar sin generar fricciÃ³n ni resistencia. Es el mÃ¡ximo exponente de la calidad de extracciÃ³n y de la integridad de los lÃ­pidos del grano.', clue: 'Uniforme, sin fricciÃ³n, resbaladizo.' },
  { id: 'body-creamy', name: 'Cremoso', category: 'cuerpo', type: 'positive', description: 'Textura rica, densa y lujosa que recubre la boca con una consistencia pesada pero suave, similar a leche entera tibia o nata ligera. Asociado a cafÃ©s naturales, variedades de Bourbon y tuestes medios.', clue: 'Leche entera tibia, nata ligera.' },
  { id: 'body-juicy', name: 'Jugoso', category: 'cuerpo', type: 'positive', description: 'Activa de inmediato una salivaciÃ³n abundante y placentera, creando sensaciÃ³n de humedad fresca. CaracterÃ­stica de cafÃ©s con alta acidez activa y dulzor bien integrado â€” signature de los mejores Keniatas.', clue: 'Activa salivaciÃ³n generosa e inmediata.' },
  { id: 'body-round', name: 'Redondo', category: 'cuerpo', type: 'positive', description: 'SensaciÃ³n completa sin picos ni aristas tÃ¡ctiles, con transiciÃ³n continua y suave por el paladar. El cafÃ© "llena" la boca de manera proporcional y predecible.', clue: 'Sin picos, transiciÃ³n suave.' },
  { id: 'body-syrupy', name: 'Almibarado', category: 'cuerpo', type: 'positive', description: 'Viscosidad notable y dulce similar a un jarabe ligero o miel diluida. Generado por alta concentraciÃ³n de polisacÃ¡ridos y azÃºcares complejos. TÃ­pico de naturales bien fermentados.', clue: 'Viscosidad tipo jarabe ligero.' },
  { id: 'body-velvety', name: 'Aterciopelado', category: 'cuerpo', type: 'positive', description: 'Microtextura fina y sofisticada que recuerda el tacto del terciopelo: suave pero con presencia. Compatible con los espressos de especialidad y los mejores filtrados de Geisha.', clue: 'Suave pero con presencia tÃ¡ctil.' },
  { id: 'body-structured', name: 'Estructurado', category: 'cuerpo', type: 'positive', description: 'El cuerpo presenta una arquitectura definida y un soporte claro que organiza los sabores y les da direcciÃ³n. No es pesado sino coherente â€” el cafÃ© sabe a quÃ© va.', clue: 'Organiza los sabores, direcciÃ³n clara.' },
  { id: 'body-unctuous', name: 'Untuoso', category: 'cuerpo', type: 'positive', description: 'SensaciÃ³n resbaladiza y ligeramente oleosa que recubre las mucosas de forma agradable y prolongada. Asociada a una buena extracciÃ³n de los lÃ­pidos del cafÃ© y a tuestes medios-claros.', clue: 'Oleoso pero agradable, cubre mucosas.' },
  { id: 'body-dense', name: 'Denso', category: 'cuerpo', type: 'positive', description: 'Se percibe un peso fÃ­sico sustancial y concentrado, especialmente en el centro de la lengua. No equivale a astringente â€” es masa limpia. TÃ­pico de espressos de calidad y granos de alta densidad.', clue: 'Peso claro en el centro de la lengua.' },
  { id: 'body-ample', name: 'Amplio', category: 'cuerpo', type: 'positive', description: 'Se expande en todas las zonas de la boca â€” frente, centro, laterales y fondo â€” con presencia espacial generosa. Diferente del denso: el amplio ocupa, el denso pesa.', clue: 'Ocupa toda la cavidad bucal.' },
  // Negativos
  { id: 'body-watery', name: 'Aguado', category: 'cuerpo', type: 'negative', description: 'Ausencia total de sustancia, peso o carÃ¡cter tÃ¡ctil. La sensaciÃ³n desaparece casi inmediatamente al tragar. Indica sub-extracciÃ³n, ratio demasiado alto o cafÃ© de baja densidad molido demasiado grueso.', clue: 'Desaparece al tragar, sin presencia.' },
  { id: 'body-thin', name: 'Delgado', category: 'cuerpo', type: 'negative', description: 'SensaciÃ³n lineal y pobre sin volumen ni complejidad tÃ¡ctil. Diferente de aguado: hay algo, pero es insuficiente e insatisfactorio. Asociado a sub-extracciÃ³n moderada o a variedades de baja altitud sin desarrollo.', clue: 'Lineal, sin volumen, insatisfactorio.' },
  { id: 'body-dry', name: 'Seco', category: 'cuerpo', type: 'negative', description: 'Absorbe agresivamente la humedad natural de la boca, dejando lengua y paladar Ã¡ridos. SeÃ±al de alta astringencia por taninos, extracciÃ³n agresiva de compuestos fenÃ³licos o defecto de proceso.', clue: 'Absorbe la saliva.' },
  { id: 'body-sandy', name: 'Arenoso', category: 'cuerpo', type: 'negative', description: 'Presencia de micropartÃ­culas que generan textura granular Ã¡spera en la lengua. Puede deberse a molienda muy fina con migraciÃ³n de finos, o a defectos fÃ­sicos del grano como fragmentos o chips.', clue: 'Microgranular, arena en boca.' },
  { id: 'body-chalky', name: 'Tizoso', category: 'cuerpo', type: 'negative', description: 'Textura seca, opaca y terrosa similar al polvo de tiza o yeso. Indicador de alta alcalinidad, extracciÃ³n excesiva de compuestos insolubles o deterioro severo del cafÃ©.', clue: 'Polvo de tiza en boca.' },
  { id: 'body-astringent-tactile', name: 'Astringente tÃ¡ctil', category: 'cuerpo', type: 'negative', description: 'ContracciÃ³n fÃ­sica de las mucosas y la lengua tras el sorbo, similar al efecto del tanino en el vino joven o al plÃ¡tano verde. Generado por sobre-extracciÃ³n de polifenoles o granos inmaduros.', clue: 'Contrae la lengua.' },
  { id: 'body-hollow', name: 'Hueco', category: 'cuerpo', type: 'negative', description: 'ExtraÃ±a sensaciÃ³n de vacÃ­o en el centro palatal: el cafÃ© tiene presencia en el frente o el fondo, pero el "corazÃ³n" de la taza no estÃ¡. SeÃ±al de baking o extracciÃ³n desequilibrada.', clue: 'VacÃ­o en el centro del paladar.' },
  { id: 'body-heavy-greasy', name: 'Graso pesado', category: 'cuerpo', type: 'negative', description: 'SensaciÃ³n grasa y densa que satura el paladar y no se limpia con facilidad. Diferente de untuoso: aquÃ­ hay incomodidad. Asociado a sobre-tueste o a extracciÃ³n de grasa vegetal degradada.', clue: 'Grasa que satura y no se limpia.' },

  // --- Postgusto (Aftertaste) ---
  // Positivos
  { id: 'after-long', name: 'Largo', category: 'postgusto', type: 'positive', description: 'El sabor permanece claro, definido y reconocible en el paladar mÃ¡s de 15 segundos tras tragar. En el protocolo SCA Form, determina directamente la puntuaciÃ³n de Aftertaste. Indicador de alta calidad intrÃ­nseca.', clue: 'Sabor claro mÃ¡s de 15 s.' },
  { id: 'after-clean', name: 'Limpio', category: 'postgusto', type: 'positive', description: 'Final puro y cristalino que no deja sensaciones turbias, Ã¡speras ni desagradables, invitando al siguiente sorbo. La limpieza del postgusto refleja la limpieza del proceso.', clue: 'No deja residuo turbio ni Ã¡spero.' },
  { id: 'after-sweet-residual', name: 'Dulce residual', category: 'postgusto', type: 'positive', description: 'Una sensaciÃ³n agradable de dulzor que reaparece o se intensifica en el paladar segundos despuÃ©s de tragar. Es uno de los indicadores mÃ¡s valorados en la cata: habla de madurez del grano y buen proceso.', clue: 'Dulzor reaparece tras tragar.' },
  { id: 'after-persistent', name: 'Persistente', category: 'postgusto', type: 'positive', description: 'Mantiene su identidad de forma clara y reconocible mucho tiempo despuÃ©s de haber tragado. A diferencia de "largo", enfatiza la estabilidad y coherencia del sabor a lo largo del tiempo.', clue: 'Mantiene identidad estable.' },
  { id: 'after-floral-long', name: 'Floral prolongado', category: 'postgusto', type: 'positive', description: 'Aroma perfumado y floral que asciende por vÃ­a retronasal y perdura elegantemente. SeÃ±al de variedades etÃ­opes o Geisha con desarrollo corto que preserva los terpenos volÃ¡tiles del grano.', clue: 'Floral vÃ­a retronasal, persistente.' },
  { id: 'after-cacao-fine', name: 'Cacao fino', category: 'postgusto', type: 'positive', description: 'Nota elegante de cacao oscuro o chocolate amargo de calidad que persiste suavemente. Diferente del amargor agresivo: aquÃ­ el cacao estÃ¡ integrado y se siente premium.', clue: 'Cacao integrado y suave.' },
  { id: 'after-refreshing', name: 'Refrescante', category: 'postgusto', type: 'positive', description: 'Deja la boca limpia y fresca tras el sorbo, invitando irresistiblemente al siguiente. Generado por la actividad de los Ã¡cidos mÃ¡lico y fosfÃ³rico en combinaciÃ³n con el dulzor.', clue: 'Boca fresca, invita al siguiente sorbo.' },
  { id: 'after-complex', name: 'Complejo', category: 'postgusto', type: 'positive', description: 'El residuo sabor evoluciona y cambia con el paso de los segundos, revelando capas y matices distintos. Es el mÃ¡ximo indicador de complejidad aromÃ¡tica â€” signature de las mejores tazas de especialidad.', clue: 'Cambia y evoluciona con el tiempo.' },
  { id: 'after-juicy-residual', name: 'Jugoso residual', category: 'postgusto', type: 'positive', description: 'La salivaciÃ³n se mantiene activa y placentera mucho despuÃ©s de haber tragado. SeÃ±al de acidez bien integrada con dulzor â€” el efecto mÃ¡s buscado en cataciÃ³n de competencia.', clue: 'Saliva activa prolongada.' },
  { id: 'after-round', name: 'Redondo', category: 'postgusto', type: 'positive', description: 'El cafÃ© termina suavemente sin dejar aristas, picos Ã¡cidos ni sensaciones cortantes. La transiciÃ³n del sorbo al postgusto es fluida y proporcional.', clue: 'Termina sin aristas ni picos.' },
  // Negativos
  { id: 'after-short-neg', name: 'Corto', category: 'postgusto', type: 'negative', description: 'El sabor desaparece abruptamente en menos de 5 segundos tras tragar, dejando un vacÃ­o sensorial. Penaliza directamente la puntuaciÃ³n SCA de Aftertaste. Asociado a sobre-extracciÃ³n o baja calidad de grano.', clue: 'Desaparece en menos de 5 s.' },
  { id: 'after-drying', name: 'Secante', category: 'postgusto', type: 'negative', description: 'Deja lengua y paladar Ã¡ridos y Ã¡speros, como fruta inmadura. Generado por exceso de taninos o fenoles extraÃ­dos en la preparaciÃ³n, o granos inmaduros en el lote.', clue: 'Deja la lengua Ã¡spera y seca.' },
  { id: 'after-bitter-aggressive', name: 'Amargo agresivo persistente', category: 'postgusto', type: 'negative', description: 'Amargor tosco, fuerte y dominante que se queda en la garganta y es difÃ­cil de eliminar. Resultado de sobre-extracciÃ³n, sobre-tueste o granos con defectos como quakers o fenolizados.', clue: 'Amargor dominante y difÃ­cil de eliminar.' },
  { id: 'after-metallic', name: 'MetÃ¡lico', category: 'postgusto', type: 'negative', description: 'SensaciÃ³n residual inorgÃ¡nica que recuerda a hierro o moneda, indicativa de aguas con alta dureza, equipos sin mantenimiento o cafÃ©s almacenados en contacto con metales.', clue: 'Sabor a hierro o moneda.' },
  { id: 'after-vegetal-raw', name: 'Vegetal crudo', category: 'postgusto', type: 'negative', description: 'Nota verde, herbÃ¡cea y cruda que persiste en el retrogusto. SeÃ±al de subdesarrollo en tueste o granos inmaduros. En el protocolo SCA se registra como falta de desarrollo.', clue: 'Hierba cruda, verde persistente.' },
  { id: 'after-astringent', name: 'Astringente final', category: 'postgusto', type: 'negative', description: 'Fuerte sequedad y contracciÃ³n en las mejillas y los costados de la lengua que perdura incluso bebiendo agua. Penaliza la puntuaciÃ³n de Aftertaste y de Cup Cleanliness en la forma SCA.', clue: 'Sequedad persistente, mejillas contraÃ­das.' },
  { id: 'after-burnt', name: 'Quemado', category: 'postgusto', type: 'negative', description: 'Amargor seco y carbonoso, similar al pan quemado o ceniza, que queda en la garganta. SeÃ±al de sobre-tueste mÃ¡s allÃ¡ del segundo crack o de scorching durante el tostado.', clue: 'Ceniza, carbÃ³n en la garganta.' },
  { id: 'after-flat', name: 'Plano', category: 'postgusto', type: 'negative', description: 'Postgusto aburrido y sin evoluciÃ³n, unidimensional, sin matices. SeÃ±al de baking â€” el cafÃ© no tuvo suficiente RoR durante el desarrollo â€” o de cafÃ© muy viejo oxidado.', clue: 'Sin evoluciÃ³n, monÃ³tono, aburrido.' },
  { id: 'after-dirty', name: 'Sucio', category: 'postgusto', type: 'negative', description: 'Mezcla confusa y turbia de residuos sin definiciÃ³n. ImpresiÃ³n general negativa que puede venir de mÃºltiples defectos acumulados: granos enfermos, fermentaciÃ³n defectuosa, o contaminaciÃ³n cruzada en almacenamiento.', clue: 'Residuo confuso e indefinible.' },

  // --- Acidez (Acidity) ---
  // Positivas
  { id: 'acid-bright', name: 'Brillante', category: 'acidez', type: 'positive', description: 'Acidez vivaz, enÃ©rgica y chispeante que activa de inmediato las papilas gustativas y estimula la salivaciÃ³n sin resultar agresiva. La acidez "brillante" es al cafÃ© lo que la chispa es al vino: le da vida.', clue: 'Despierta saliva sin incomodar.' },
  { id: 'acid-citric', name: 'CÃ­trica', category: 'acidez', type: 'positive', description: 'Notas frescas y definidas que evocan limÃ³n, lima, mandarina o naranja. Generada por el Ã¡cido cÃ­trico del grano. Predomina en variedades como SL28, Caturra y procesados lavados de alta altitud.', clue: 'LimÃ³n, naranja, mandarina.' },
  { id: 'acid-malic', name: 'MÃ¡lica', category: 'acidez', type: 'positive', description: 'Acidez redonda y jugosa que evoca la manzana verde crujiente o la uva blanca. MÃ¡s suave que la cÃ­trica. Dominante en Bourbon y variedades centroamericanas. En el protocolo SCA se valora por su integraciÃ³n.', clue: 'Manzana verde, uva blanca.' },
  { id: 'acid-tartaric', name: 'TartÃ¡rica', category: 'acidez', type: 'positive', description: 'Acidez ligeramente astringente pero elegante, similar a la piel de la uva o a un vino joven de calidad. Presente en cafÃ©s con perfiles vinosos â€” naturales de EtiopÃ­a o Kenia procesados con honey.', clue: 'Uva, piel de cereza, vino joven.' },
  { id: 'acid-phosphoric', name: 'FosfÃ³rica', category: 'acidez', type: 'positive', description: 'Acidez efervescente y elÃ©ctrica en la lengua, similar a las bebidas carbonatadas de cola â€” pero elegante. CaracterÃ­stica distintiva de las Geisha de altura extrema y algunos etÃ­opes lavados de Yirgacheffe.', clue: 'Chispeante tipo gaseosa, elÃ©ctrica.' },
  { id: 'acid-juicy', name: 'Jugosa', category: 'acidez', type: 'positive', description: 'Acidez acompaÃ±ada de abundante humedad que hace que la boca se sienta hidratada y fresca. Es la uniÃ³n perfecta de acidez activa y dulzor â€” el perfil mÃ¡s apreciado en los mejores keniatas y colombianos de altura.', clue: 'SensaciÃ³n hÃºmeda y placentera.' },
  { id: 'acid-vibrant', name: 'Vibrante', category: 'acidez', type: 'positive', description: 'Acidez dinÃ¡mica que no es estÃ¡tica sino que "se mueve" por el paladar, cambiando de intensidad y posiciÃ³n. Requiere alta concentraciÃ³n de Ã¡cidos orgÃ¡nicos en equilibrio, seÃ±al de terroir privilegiado.', clue: 'DinÃ¡mica, cambia de posiciÃ³n.' },
  { id: 'acid-delicate', name: 'Delicada', category: 'acidez', type: 'positive', description: 'Acidez sutil y fina que estÃ¡ presente para dar vida al cafÃ© pero sin buscar protagonismo. Ideal en tuestes medios de variedades como CatuaÃ­ o Mundo Novo donde otros atributos dominan.', clue: 'Presente pero sin protagonismo.' },
  { id: 'acid-clean', name: 'Limpia', category: 'acidez', type: 'positive', description: 'Perfil Ã¡cido cristalino y definido, sin notas extraÃ±as, fermentos ni sabores sucios que interfieran. En la forma SCA, la acidez limpia acompaÃ±a directamente la puntuaciÃ³n de Clean Cup.', clue: 'Definida, sin off-notes.' },
  { id: 'acid-balanced', name: 'Balanceada', category: 'acidez', type: 'positive', description: 'En perfecta proporciÃ³n con el cuerpo y el dulzor, sin dominar el perfil. Es el objetivo tÃ©cnico mÃ¡s difÃ­cil de alcanzar y el mÃ¡s revelador de la calidad del tostador.', clue: 'Proporcional, no domina el perfil.' },
  // Negativas
  { id: 'acid-sour', name: 'Agria', category: 'acidez', type: 'negative', description: 'Acidez desagradable y punzante que recuerda a alimentos en mal estado o vinagre de baja calidad. En la forma SCA penaliza directamente la puntuaciÃ³n de Acidity. Asociada a subdesarrollo o fermentaciÃ³n defectuosa.', clue: 'Recuerda alimento daÃ±ado, vinagre.' },
  { id: 'acid-green', name: 'Verde / Inmadura', category: 'acidez', type: 'negative', description: 'Sabor vegetal e inmaduro que indica granos que no alcanzaron madurez Ã³ptima (verde o pintÃ³n) cosechado prematuramente. La acidez "verde" nunca se equilibra con el dulzor porque los azÃºcares no se desarrollaron.', clue: 'Inmadura, sin dulzor que la equilibre.' },
  { id: 'acid-acetic-dom', name: 'AcÃ©tica dominante', category: 'acidez', type: 'negative', description: 'Fuerte presencia de Ã¡cido acÃ©tico â€” el Ã¡cido del vinagre â€” que domina y anula cualquier otro matiz positivo. Resultado de sobre-fermentaciÃ³n en beneficio hÃºmedo o mala gestiÃ³n de temperatura durante el proceso.', clue: 'Vinagre dominante y penetrante.' },
  { id: 'acid-sharp', name: 'Filosa / Cortante', category: 'acidez', type: 'negative', description: 'SensaciÃ³n de corte agudo y agresivo al pasar por el paladar. No hay dulzor ni redondez que la acompaÃ±e. TÃ­pica de cafÃ©s subdesarrollados o de altas concentraciones de Ã¡cido clorogÃ©nico no degradado.', clue: 'Corta el paladar, sin redondez.' },
  { id: 'acid-fermented', name: 'Fermentada defectuosa', category: 'acidez', type: 'negative', description: 'CombinaciÃ³n de acidez agria con notas alcohÃ³licas o podridas. Resultado de fermentaciÃ³n descontrolada en el beneficio â€” a diferencia del vinoso positivo que es elegante y limpio.', clue: 'Agrio alcohÃ³lico, fermentaciÃ³n mala.' },
  { id: 'acid-lactic-exc', name: 'LÃ¡ctica excesiva', category: 'acidez', type: 'negative', description: 'Acidez densa y agria similar al yogur pasado o leche cortada. Resulta del exceso de Ã¡cido lÃ¡ctico por bacterias lÃ¡cticas dominando la fermentaciÃ³n. Frecuente en procesos anaerÃ³bicos mal controlados.', clue: 'Yogur pasado, leche cortada.' },
  { id: 'acid-unbalanced', name: 'Desequilibrada', category: 'acidez', type: 'negative', description: 'La acidez domina excesivamente sobre el cuerpo y el dulzor, destruyendo la armonÃ­a de la taza. Puede ocurrir con variedades de alta acidez tostadas demasiado claro o sobre-fermentadas.', clue: 'Domina y tapa todo lo demÃ¡s.' },
  { id: 'acid-rough', name: 'Ãspera', category: 'acidez', type: 'negative', description: 'Acidez acompaÃ±ada de fricciÃ³n fÃ­sica en la garganta y los laterales de la lengua. Indica alta presencia de Ã¡cido clorogÃ©nico sin descomposiciÃ³n suficiente â€” seÃ±al de subdesarrollo en tueste.', clue: 'Raspa la garganta.' },

  // --- Dulzor (Sweetness) ---
  // Positivos
  { id: 'sweet-caramel', name: 'Caramelo', category: 'dulzor', type: 'positive', description: 'Dulzor clÃ¡sico, cÃ¡lido y reconfortante con notas profundas a azÃºcar caramelizada, toffee o dulce de leche. Resultado principal de la reacciÃ³n de Maillard bien ejecutada. Es el dulzor de referencia del cafÃ© de especialidad.', clue: 'AzÃºcar caramelizada, toffee.' },
  { id: 'sweet-honey', name: 'Miel', category: 'dulzor', type: 'positive', description: 'Dulzor floral, suave y ligeramente viscoso que recuerda a la miel de abejas natural. ComÃºn en cafÃ©s procesados con mÃ©todo honey y en variedades de alta sacarosa disponible como Villa Sarchi o Bourbon amarillo.', clue: 'Miel, floral y suave.' },
  { id: 'sweet-panela', name: 'Panela / Piloncillo', category: 'dulzor', type: 'positive', description: 'Dulzor rÃºstico con notas minerales, caracterÃ­stico de la caÃ±a de azÃºcar integral. AÃ±ade profundidad sin refinamiento excesivo. Presente en orÃ­genes colombianos, peruanos y algunos centroamericanos de baja-media altitud.', clue: 'CaÃ±a entera, dulce con mineral.' },
  { id: 'sweet-fruit-ripe', name: 'Fruta madura', category: 'dulzor', type: 'positive', description: 'Dulzor natural, fresco y jugoso de frutas en su punto Ã³ptimo. No es el dulzor del azÃºcar sino el de la fructosa â€” mÃ¡s vivo y multidimensional. SeÃ±al de cosecha selectiva de granos en punto de madurez exacto.', clue: 'Dulce de fruta en su punto.' },
  { id: 'sweet-molasses', name: 'Melaza', category: 'dulzor', type: 'positive', description: 'Dulzor muy profundo, oscuro y ligeramente amargo â€” de gran intensidad y carÃ¡cter. Presente en cafÃ©s naturales oscuros bien fermentados y en tuestes medios de Bourbon o Typica de alta altitud.', clue: 'Dulce profundo y oscuro.' },
  { id: 'sweet-floral', name: 'Floral dulce', category: 'dulzor', type: 'positive', description: 'Notas dulces, ligeras y perfumadas que recuerdan al nÃ©ctar de flores o a agua de azahar. Se superpone con la categorÃ­a Fragancia â€” en este caso se detecta vÃ­a el sabor en paladar, no solo por vÃ­a nasal.', clue: 'NÃ©ctar, agua de azahar.' },
  { id: 'sweet-round', name: 'Redondo', category: 'dulzor', type: 'positive', description: 'El dulzor envuelve y suaviza la acidez, eliminando aristas y creando equilibrio. No es un descriptor de tipo de dulzor sino de su funciÃ³n en el perfil: integra los demÃ¡s atributos.', clue: 'Envuelve y suaviza la acidez.' },
  { id: 'sweet-balanced', name: 'Balanceado', category: 'dulzor', type: 'positive', description: 'Nivel justo y preciso de dulzor que complementa sin empalagar ni dominar. En la forma SCA, el dulzor balanceado permite que la acidez y el amargor coexistan sin perder su identidad propia.', clue: 'Preciso, no empalaga ni domina.' },
  { id: 'sweet-clean', name: 'Limpio', category: 'dulzor', type: 'positive', description: 'Dulzor claro y transparente sin notas sucias, terrosas o extraÃ±as. Un dulzor limpio habla de granos maduros, proceso cuidadoso y tueste sin defectos. Es condiciÃ³n necesaria (no suficiente) para una alta puntuaciÃ³n SCA.', clue: 'Claro, sin off-notes.' },
  { id: 'sweet-persistent', name: 'Persistente', category: 'dulzor', type: 'positive', description: 'El dulzor permanece en el paladar durante un tiempo prolongado despuÃ©s del sorbo. Junto con el postgusto largo, es uno de los indicadores mÃ¡s valorados en cata de competencia internacional.', clue: 'Permanece en el tiempo.' },
  // Negativos
  { id: 'sweet-cloying', name: 'Empalagoso', category: 'dulzor', type: 'negative', description: 'Exceso de dulzor que satura las papilas y resulta molesto e incÃ³modo. Penaliza cuando el dulzor es el Ãºnico atributo dominante y no hay acidez ni amargor que lo equilibren. Frecuente en naturales mal calibrados.', clue: 'Satura, sin acidez que equilibre.' },
  { id: 'sweet-artificial', name: 'Artificial', category: 'dulzor', type: 'negative', description: 'Notas que recuerdan a edulcorantes sintÃ©ticos (aspartamo, sacarina) â€” un dulzor que no suena a cafÃ©. Puede provenir de granos con daÃ±o enzimÃ¡tico, defectos de fermentaciÃ³n o almacenamiento con absorciÃ³n de olores.', clue: 'Tipo edulcorante, no cafÃ©.' },
  { id: 'sweet-short', name: 'Corto', category: 'dulzor', type: 'negative', description: 'El dulzor desaparece casi de inmediato tras el primer contacto con el paladar, sin dejar rastro. SeÃ±al de baja concentraciÃ³n de sacarosa â€” por cosecha prematura, baja altitud o tueste que desviÃ³ los azÃºcares hacia el amargor.', clue: 'Fugaz, desaparece al instante.' },
  { id: 'sweet-burnt-caramel', name: 'Caramelo quemado', category: 'dulzor', type: 'negative', description: 'Dulzor defectuoso mezclado con notas amargas y acres de azÃºcar carbonizada. SeÃ±al de exceso de temperatura en Maillard o de tueste que sobrepasÃ³ el primer crack por demasiado margen.', clue: 'Dulce con amargo de carbÃ³n.' },
  { id: 'sweet-fermented', name: 'Fermentado dulce', category: 'dulzor', type: 'negative', description: 'Sabor a fruta sobremadura iniciando fermentaciÃ³n no controlada. Diferente del vinoso positivo: aquÃ­ hay deterioro, no complejidad. Frecuente en cafÃ©s naturales con cerezas sobremaduradas en el Ã¡rbol.', clue: 'Fruta pasada, fermentaciÃ³n negativa.' },
  { id: 'sweet-confused', name: 'Confuso', category: 'dulzor', type: 'negative', description: 'El dulzor estÃ¡ mezclado con defectos y notas sucias, haciendo imposible identificarlo o disfrutarlo. Puede ser sÃ­ntoma de mÃºltiples problemas simultÃ¡neos: granos inmaduros, defectos de proceso y subdesarrollo.', clue: 'Mezclado con off-notes, indefinible.' },

  // --- Amargor (Bitterness) ---
  // Positivos
  { id: 'bitter-cacao', name: 'Cacao / Chocolate oscuro', category: 'amargor', type: 'positive', description: 'Amargor limpio, sofisticado y placentero que evoca la intensidad de un chocolate al 70% de cacao. El descriptor de amargor mÃ¡s valorado en SCA â€” seÃ±ala buen desarrollo sin sobre-tueste y alta calidad de grano.', clue: 'Chocolate oscuro, integral, limpio.' },
  { id: 'bitter-almond', name: 'Almendra', category: 'amargor', type: 'positive', description: 'Amargor seco pero fino y elegante, tÃ­pico de la piel de las almendras o los frutos secos tostados. SeÃ±al de presencia de compuestos como la amygdalina y pirazinas bien desarrolladas â€” tueste medio bien controlado.', clue: 'Almendra tostada, seco pero fino.' },
  { id: 'bitter-elegant', name: 'Elegante', category: 'amargor', type: 'positive', description: 'Amargor refinado que acompaÃ±a al dulzor y la acidez sin competir con ellos. No domina el perfil sino que lo completa. En el protocolo SCA, es la forma ideal del atributo Bitterness.', clue: 'AcompaÃ±a sin dominar.' },
  { id: 'bitter-structural', name: 'Estructural', category: 'amargor', type: 'positive', description: 'Aporta la base y la dimensiÃ³n necesaria al cafÃ©, dÃ¡ndole soporte al perfil de sabor. La taza sin amargor estructural se siente incompleta â€” como una mesa sin patas.', clue: 'Da soporte y dimensiÃ³n al perfil.' },
  { id: 'bitter-integrated', name: 'Integrado', category: 'amargor', type: 'positive', description: 'Perfectamente fundido con los otros sabores, sin posibilidad de separarlo del conjunto armÃ³nico. Este nivel de integraciÃ³n es la marca de las mejores tazas del mundo.', clue: 'Fusionado con el conjunto.' },
  { id: 'bitter-balanced', name: 'Balanceado', category: 'amargor', type: 'positive', description: 'En proporciÃ³n exacta con la acidez y el dulzor, completando el perfil sin desentonar. La taza balanceada en amargor puede puntuarse 9+ en la forma SCA.', clue: 'Proporcional, completa el perfil.' },
  { id: 'bitter-dark-caramel', name: 'Caramelo oscuro', category: 'amargor', type: 'positive', description: 'Balance entre dulce y amargo que recuerda al caramelo muy tostado â€” azÃºcar en su lÃ­mite antes de carbonizarse. Presente en tuestes medios-claros donde el Maillard se completÃ³ sin pasarse.', clue: 'Dulce-amargo en tensiÃ³n positiva.' },
  { id: 'bitter-subtle', name: 'Sutil', category: 'amargor', type: 'positive', description: 'Apenas perceptible â€” un fondo lejano que aÃ±ade profundidad sin imponerse. CaracterÃ­stica de los mejores filtrados claros de alta altitud donde el protagonismo lo llevan la acidez y el dulzor.', clue: 'Fondo lejano, apenas perceptible.' },
  { id: 'bitter-dry-nice', name: 'Seco agradable', category: 'amargor', type: 'positive', description: 'Limpia el paladar al final del sorbo, preparÃ¡ndolo para el siguiente. Esta sensaciÃ³n de limpieza seca diferencia el amargor positivo del negativo: uno cierra, el otro bloquea.', clue: 'Limpia el paladar para el siguiente.' },
  // Negativos
  { id: 'bitter-burnt', name: 'Quemado', category: 'amargor', type: 'negative', description: 'Sabor seco, carbonoso y desagradable resultado de sobre-tueste, segundo crack excedido o scorching. En la forma SCA penaliza tanto Bitterness como Uniformity y Clean Cup.', clue: 'Carbonoso, resultado de quemado real.' },
  { id: 'bitter-ash', name: 'Ceniza', category: 'amargor', type: 'negative', description: 'Sabor residual polvoriento que recuerda a un cenicero o humo frÃ­o. Diferente del quemado: la ceniza es mÃ¡s sutil pero igualmente destructiva del perfil. SeÃ±al de segundo crack o chaff quemado.', clue: 'Cenicero, humo frÃ­o.' },
  { id: 'bitter-astringent', name: 'Astringente amargo', category: 'amargor', type: 'negative', description: 'Amargor que seca inmediatamente lengua, encÃ­as y paladar. La combinaciÃ³n de amargor + sequedad es la peor combinaciÃ³n posible en evaluaciÃ³n sensorial â€” penaliza mÃºltiples categorÃ­as SCA.', clue: 'Amargo + seca la boca simultÃ¡neamente.' },
  { id: 'bitter-metallic', name: 'MetÃ¡lico', category: 'amargor', type: 'negative', description: 'Sabor a hierro, cobre o metal oxidado. Puede originarse en el grano (defecto de proceso) o en el equipo de preparaciÃ³n (extracciÃ³n en metales sin mantenimiento). Rastreable mediante anÃ¡lisis de agua y de equipo.', clue: 'Hierro, cobre, metal.' },
  { id: 'bitter-dominant', name: 'Dominante', category: 'amargor', type: 'negative', description: 'Tan intenso y omnipresente que impide percibir cualquier otro atributo positivo. Monopoliza el paladar. En la forma SCA, un amargor dominante hace imposible puntuar bien Balance y Overall.', clue: 'Tapa todos los demÃ¡s atributos.' },
  { id: 'bitter-medicinal', name: 'Medicinal', category: 'amargor', type: 'negative', description: 'Sabor quÃ­mico a pastilla molida, jarabe farmacÃ©utico o yodo. Asociado a granos con defecto fenÃ³lico o al proceso de algunas variedades con alta clorogÃ©nica (Catimor bajo tueste insuficiente).', clue: 'Pastilla, jarabe, yodo.' },
  { id: 'bitter-green', name: 'Verde amargo', category: 'amargor', type: 'negative', description: 'CombinaciÃ³n vegetal y amarga de granos inmaduros o subdesarrollados. El Ã¡cido clorogÃ©nico sin degradar en tueste produce este sabor caracterÃ­stico, a veces descrito como "pasto amargo".', clue: 'Vegetal crudo con amargo, pasto amargo.' },
  { id: 'bitter-persistent-agg', name: 'Persistente agresivo', category: 'amargor', type: 'negative', description: 'Amargor que se queda pegado en el paladar y la garganta, resistente incluso al agua. Generado por taninos altamente polimÃ©ricos o por extracciÃ³n excesiva de Ã¡cido clorogÃ©nico degradado.', clue: 'No se va ni con agua.' },
  { id: 'bitter-overextracted', name: 'SobreextraÃ­do', category: 'amargor', type: 'negative', description: 'La combinaciÃ³n mÃ¡s destructiva: amargor intenso paired con sequedad total. Resultado de una extracciÃ³n por encima del 22-24% de TDS o tiempo/temperatura excesivos. Irreparable en taza.', clue: 'Amargo + seco total, irreparable.' }
];


const CATEGORIES: { id: AttributeCategory; label: string; color: string }[] = [
  { id: 'fragancia', label: 'Fragancia / Aroma', color: 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100' },
  { id: 'cuerpo', label: 'Cuerpo', color: 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100' },
  { id: 'acidez', label: 'Acidez', color: 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100' },
  { id: 'dulzor', label: 'Dulzor', color: 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100' },
  { id: 'postgusto', label: 'Postgusto', color: 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100' },
  { id: 'amargor', label: 'Amargor', color: 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100' },
];




const Simulator: React.FC = () => {
  const [target, setTarget] = useState<SensoryAttribute | null>(null);
  const [step, setStep] = useState<'category' | 'descriptor'>('category');
  
  // Options state
  const [categoryOptions, setCategoryOptions] = useState<{ id: AttributeCategory; label: string }[]>([]);
  const [descriptorOptions, setDescriptorOptions] = useState<SensoryAttribute[]>([]);
  
  // Selection state
  const [selectedCategory, setSelectedCategory] = useState<AttributeCategory | null>(null);
  const [selectedDescriptor, setSelectedDescriptor] = useState<string | null>(null);
  
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);

  const generateQuestion = () => {
    const randomTarget = ATTRIBUTES[Math.floor(Math.random() * ATTRIBUTES.length)];
    
    // --- Step 1: Category Options ---
    // Target category
    const targetCat = CATEGORIES.find(c => c.id === randomTarget.category)!;
    // Distractor categories (3 others)
    const otherCats = CATEGORIES.filter(c => c.id !== randomTarget.category);
    const shuffledOtherCats = [...otherCats].sort(() => 0.5 - Math.random());
    const distractorCats = shuffledOtherCats.slice(0, 3);
    // Combine and shuffle
    const newCategoryOptions = [targetCat, ...distractorCats].sort(() => 0.5 - Math.random());

    // --- Step 2: Descriptor Options ---
    // Select 3 distractors from the same category
    const sameCategory = ATTRIBUTES.filter(a => a.category === randomTarget.category && a.id !== randomTarget.id);
    const shuffledCategory = [...sameCategory].sort(() => 0.5 - Math.random());
    const distractors = shuffledCategory.slice(0, 3);
    // Combine and shuffle
    const newDescriptorOptions = [randomTarget, ...distractors].sort(() => 0.5 - Math.random());

    setTarget(randomTarget);
    setCategoryOptions(newCategoryOptions);
    setDescriptorOptions(newDescriptorOptions);
    
    // Reset state
    setStep('category');
    setSelectedCategory(null);
    setSelectedDescriptor(null);
    setFeedback(null);
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  const handleCategoryCheck = (catId: AttributeCategory) => {
    if (!target || feedback) return;

    setSelectedCategory(catId);

    if (catId === target.category) {
      // Correct Category -> Move to Step 2
      // We show a small visual success but don't set global feedback yet to avoid blocking interaction
      // Or we can set a temporary success state.
      // Let's just transition smoothly.
      setTimeout(() => {
        setStep('descriptor');
      }, 500); // Small delay for user to see their selection
    } else {
      // Wrong Category -> Fail Question
      setFeedback('wrong');
      setStreak(0);
    }
  };

  const handleDescriptorCheck = (name: string) => {
    if (!target || feedback) return;

    setSelectedDescriptor(name);

    if (name === target.name) {
      setFeedback('correct');
      setStreak(s => s + 1);
    } else {
      setFeedback('wrong');
      setStreak(0);
    }
  };

  const handleNext = () => {
    generateQuestion();
  };

  if (!target) return null;

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Header & Streak */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-400">
          <Brain className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Entrenador Sensorial</span>
        </div>
        <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full">
          <Trophy className={`w-4 h-4 ${streak > 0 ? 'text-yellow-500' : 'text-stone-400'}`} />
          <span className="text-sm font-black text-stone-900 dark:text-stone-100">{streak}</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 md:p-12 rounded-2xl shadow-sm text-center space-y-8">
        <div className="space-y-4">
          <div className="space-y-2">
             <p className="text-sm text-stone-500 uppercase tracking-widest font-bold">
               {step === 'category' ? 'Paso 1: Identifica la CategorÃ­a' : 'Paso 2: Identifica el Descriptor'}
             </p>
             <h3 className="text-2xl md:text-3xl font-serif italic text-stone-900 dark:text-stone-100 leading-tight">
              "{target.description || target.clue}"
            </h3>
          </div>
        </div>

        {/* Feedback Display */}
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
                {feedback === 'correct' ? 'Â¡Correcto!' : 'Incorrecto'}
              </div>
              {feedback !== 'correct' && (
                <p className="mt-2 text-xs opacity-80">
                  La respuesta correcta era: <span className="font-bold">{CATEGORIES.find(c => c.id === target.category)?.label} - {target.name}</span>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 1: Category Options */}
        {step === 'category' && !feedback && (
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {categoryOptions.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const isCorrect = cat.id === target.category;
                  // In step 1, we only show error feedback if they failed. Success immediately moves to step 2.
                  const showWrong = feedback === 'wrong' && isSelected && !isCorrect;

                  let buttonStyle = 'border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-stone-700';
                  
                  if (isSelected && isCorrect) {
                      buttonStyle = 'border-green-500 bg-green-500 text-white shadow-lg scale-105';
                  } else if (showWrong) {
                      buttonStyle = 'border-red-500 bg-red-500 text-white opacity-50';
                  }

                  return (
                      <button
                          key={cat.id}
                          onClick={() => handleCategoryCheck(cat.id)}
                          disabled={!!feedback || !!selectedCategory}
                          className={`p-6 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border-2 w-full flex items-center justify-center text-center ${buttonStyle}`}
                      >
                          {cat.label}
                      </button>
                  );
              })}
           </div>
        )}

        {/* STEP 2: Descriptor Options */}
        {step === 'descriptor' && (
            <div className="space-y-6 animate-fade-in-up">
                <div className="inline-block px-4 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-xs font-bold uppercase tracking-widest text-stone-500">
                    CategorÃ­a: {CATEGORIES.find(c => c.id === target.category)?.label} <Check className="inline w-3 h-3 ml-1 text-green-500" />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {descriptorOptions.map((opt) => {
                        const isSelected = selectedDescriptor === opt.name;
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
                                onClick={() => handleDescriptorCheck(opt.name)}
                                disabled={!!feedback}
                                className={`p-6 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border-2 w-full flex items-center justify-center text-center break-words ${buttonStyle}`}
                            >
                                {opt.name}
                            </button>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Next Button */}
        {feedback && (
            <div className="pt-4 flex justify-center animate-fade-in-up">
                <button
                  onClick={handleNext}
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

const Dictionary: React.FC = () => (
  <div className="space-y-16 animate-fade-in w-full">
    {CATEGORIES.map(cat => {
      const catAttributes = ATTRIBUTES.filter(a => a.category === cat.id);
      const positives = catAttributes.filter(a => a.type === 'positive');
      const negatives = catAttributes.filter(a => a.type === 'negative');

      return (
        <div key={cat.id} className="space-y-6">
          <div className="flex items-center gap-4 border-b-2 border-black dark:border-white pb-4">
            <h3 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white">
              {cat.label}
            </h3>
            <span className="text-xs font-bold px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-full uppercase tracking-widest text-stone-500">
              {catAttributes.length} descriptores
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Positivos */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand">
                <div className="w-2 h-2 rounded-full bg-brand"></div>
                Positivos
              </h4>
              <div className="space-y-3">
                {positives.map(attr => (
                  <div key={attr.id} className="group relative p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl hover:border-brand dark:hover:border-brand transition-colors">
                    <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-1 group-hover:text-brand transition-colors">{attr.name}</h5>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {attr.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Negativos */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-stone-400">
                <div className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-700"></div>
                Negativos
              </h4>
              <div className="space-y-3">
                {negatives.map(attr => (
                  <div key={attr.id} className="group relative p-4 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-xl hover:border-stone-400 dark:hover:border-stone-600 transition-colors">
                    <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-1">{attr.name}</h5>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {attr.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

const Education: React.FC = () => (
  <div className="space-y-12 animate-fade-in w-full">
    
    {/* Description Guide */}
    <section className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-black uppercase tracking-tight text-stone-900 dark:text-stone-100">
          La Estructura Perfecta
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          CÃ³mo describir un cafÃ© profesionalmente en 4 pasos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { step: 1, title: 'Cuerpo', desc: 'Peso y textura tÃ¡ctil.' },
          { step: 2, title: 'Acidez', desc: 'Brillo y tipo de Ã¡cido.' },
          { step: 3, title: 'Dulzor', desc: 'CarÃ¡cter y madurez.' },
          { step: 4, title: 'Postgusto', desc: 'DuraciÃ³n y limpieza.' }
        ].map((s, i) => (
          <div key={i} className="relative p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
            <div className="absolute -top-3 left-4 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold px-2 py-1 rounded">
              PASO {s.step}
            </div>
            <h4 className="mt-2 font-black uppercase tracking-wider text-sm mb-1">{s.title}</h4>
            <p className="text-xs text-stone-500">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="p-6 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
        <h4 className="font-bold text-xs uppercase tracking-widest mb-2 text-stone-500">Ejemplo de Speech</h4>
        <p className="font-serif italic text-lg text-stone-800 dark:text-stone-200 leading-relaxed">
          "Es un cafÃ© con <span className="text-brand font-bold">cuerpo cremoso</span>, una <span className="text-brand font-bold">acidez mÃ¡lica</span> brillante, <span className="text-brand font-bold">dulzor a caramelo</span> y un <span className="text-brand font-bold">postgusto limpio</span> y prolongado."
        </p>
      </div>
    </section>

    {/* Exercises */}
    <section className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-black uppercase tracking-tight text-stone-900 dark:text-stone-100">
          Ejercicios de CalibraciÃ³n
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Entrena tu paladar en casa con ingredientes simples.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {[
          {
            title: 'TriangulaciÃ³n de Ãcidos',
            material: 'LimÃ³n (CÃ­trico), Manzana Verde (MÃ¡lico), Vinagre (AcÃ©tico).',
            steps: ['Diluye unas gotas de cada uno en vasos con agua.', 'Prueba a ciegas e intenta identificar cuÃ¡l es cuÃ¡l.', 'ConcÃ©ntrate en DÃ“NDE lo sientes en la lengua.'],
            outcome: 'AprenderÃ¡s a diferenciar la "forma" de la acidez: CÃ­trica (lados, punzante), MÃ¡lica (redonda, persistente).'
          },
          {
            title: 'Memoria de Texturas',
            material: 'Leche entera, Leche descremada, Crema de leche.',
            steps: ['Bebe un sorbo de cada una enfocÃ¡ndote solo en el peso.', 'No tragues inmediatamente, deja que recorra el paladar.', 'Compara la viscosidad.'],
            outcome: 'CalibrarÃ¡s tu escala de Cuerpo: Ligero (Descremada) vs Medio (Entera) vs Pesado (Crema).'
          },
          {
            title: 'Escala de Dulzor',
            material: 'AzÃºcar Blanca, AzÃºcar Morena/Panela, Miel.',
            steps: ['Prepara 3 soluciones con la misma cantidad de agua y endulzante.', 'Nota cÃ³mo el azÃºcar blanca es solo dulce.', 'La panela aÃ±ade notas minerales y la miel notas florales.'],
            outcome: 'EntenderÃ¡s la diferencia entre intensidad de dulzor y calidad/complejidad del dulzor.'
          },
          {
            title: 'Mapeo de Sabores',
            material: 'Sal, AzÃºcar, LimÃ³n, Agua TÃ³nica (Amargo).',
            steps: ['Aplica una gota de cada soluciÃ³n en diferentes partes de tu lengua con un hisopo.', 'Dibuja un mapa de dÃ³nde sientes mÃ¡s intensidad.', 'Enjuaga bien entre cada prueba.'],
            outcome: 'DescubrirÃ¡s tu propia sensibilidad biolÃ³gica y dÃ³nde percibes mejor cada sabor bÃ¡sico.'
          }
        ].map((ex, i) => (
          <div key={i} className="border border-stone-200 dark:border-stone-800 rounded-2xl p-6 md:p-8 hover:border-brand dark:hover:border-brand transition-colors group">
            <h4 className="text-lg font-black uppercase tracking-tight mb-4 group-hover:text-brand transition-colors">{ex.title}</h4>
            
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">Necesitas</span>
                <p className="text-sm text-stone-700 dark:text-stone-300 font-medium">{ex.material}</p>
              </div>
              
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">Instrucciones</span>
                <ul className="list-decimal pl-4 space-y-1 text-sm text-stone-600 dark:text-stone-400">
                  {ex.steps.map((step, k) => <li key={k} className="pl-1">{step}</li>)}
                </ul>
              </div>

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand block mb-1">Objetivo</span>
                <p className="text-xs text-stone-500 italic">{ex.outcome}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  </div>
);

// --- Main View ---

interface Props {
  onBack: () => void;
  isEmbedded?: boolean;
  headerOffset?: string;
}

export const SensoryTrainingView: React.FC<Props> = ({ onBack, isEmbedded = false, headerOffset = '0px' }) => {
  const [activeTab, setActiveTab] = useState<'catacion' | 'dictionary' | 'education' | 'simulator'>('catacion');

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 pb-20">
      {/* Header */}
      <div 
        className="sticky z-50 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-all duration-200"
        style={{ top: isEmbedded ? headerOffset : 0 }}
      >
        {!isEmbedded && (
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
                Cata
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hidden sm:block">
                Entrenamiento Sensorial
              </p>
            </div>
          </div>
        </div>
        )}

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto scrollbar-hide">
          {[
            { id: 'catacion', label: 'CataciÃ³n' },
            { id: 'dictionary', label: 'Diccionario' },
            { id: 'education', label: 'EducaciÃ³n' },
            { id: 'simulator', label: 'Simulador' }
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
        {activeTab === 'catacion' && (
          <div className="animate-fade-in -mx-4 -my-8">
            <CuppingView mode="free" isEmbedded={true} />
          </div>
        )}
        {activeTab === 'simulator' && <Simulator />}
        {activeTab === 'dictionary' && <Dictionary />}
        {activeTab === 'education' && <Education />}
      </div>
    </div>
  );
};
