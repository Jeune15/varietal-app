import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Brain, Check, ChevronRight, RefreshCw, Trophy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

// --- Data ---

type AttributeCategory = 'cuerpo' | 'postgusto' | 'acidez' | 'dulzor' | 'amargor';

interface SensoryAttribute {
  id: string;
  name: string;
  category: AttributeCategory;
  description: string;
  clue: string;
  type: 'positive' | 'negative';
}

const ATTRIBUTES: SensoryAttribute[] = [
  // --- Cuerpo (Body) ---
  // Positivos
  { id: 'body-silky', name: 'Sedoso', category: 'cuerpo', type: 'positive', description: 'Una sensación táctil excepcionalmente uniforme y suave que recorre toda la lengua y el paladar, deslizándose fluidamente sin generar ningún tipo de fricción o resistencia.', clue: 'Sensación uniforme, sin fricción en lengua ni paladar.' },
  { id: 'body-creamy', name: 'Cremoso', category: 'cuerpo', type: 'positive', description: 'Textura rica, densa y lujosa que recubre la boca con una consistencia pesada pero suave, similar a la sensación de beber crema ligera o leche entera tibia.', clue: 'Textura espesa pero suave, similar a leche entera tibia.' },
  { id: 'body-juicy', name: 'Jugoso', category: 'cuerpo', type: 'positive', description: 'Provoca una salivación inmediata, vibrante y placentera, creando una sensación de humedad fresca que inunda la cavidad bucal.', clue: 'Activa salivación inmediata, sensación húmeda.' },
  { id: 'body-dense', name: 'Denso', category: 'cuerpo', type: 'positive', description: 'Se percibe un peso físico sustancial y concentrado, especialmente en el centro de la lengua, aportando una sensación de solidez al líquido.', clue: 'Peso claro en centro de lengua, sensación compacta.' },
  { id: 'body-enveloping', name: 'Envolvente', category: 'cuerpo', type: 'positive', description: 'Tiene la capacidad de cubrir la totalidad de la cavidad bucal de manera homogénea y tridimensional, llenando cada rincón con su textura.', clue: 'Cubre toda la boca de forma homogénea.' },
  { id: 'body-round', name: 'Redondo', category: 'cuerpo', type: 'positive', description: 'Una sensación completa y esférica, sin picos, bordes afilados ni aristas táctiles, ofreciendo una transición continua y suave en el paladar.', clue: 'Sin picos táctiles, transición suave.' },
  { id: 'body-velvety', name: 'Aterciopelado', category: 'cuerpo', type: 'positive', description: 'Microtextura fina, elegante y sofisticada, que recuerda al tacto suave de una tela de terciopelo, sin burbujas ni asperezas perceptibles.', clue: 'Microtextura fina, sin burbujas perceptibles.' },
  { id: 'body-unctuous', name: 'Untuoso', category: 'cuerpo', type: 'positive', description: 'Sensación rica, resbaladiza y ligeramente oleosa que recubre las mucosas de la boca de forma agradable, duradera y nutritiva.', clue: 'Sensación ligeramente oleosa pero agradable.' },
  { id: 'body-heavy-struct', name: 'Pesado estructurado', category: 'cuerpo', type: 'positive', description: 'El líquido permanece en la boca con una arquitectura firme y un peso notable que no se disipa, sosteniendo los sabores con fuerza.', clue: 'Permanece en boca con soporte, no cae rápido.' },
  { id: 'body-syrupy', name: 'Almibarado', category: 'cuerpo', type: 'positive', description: 'Viscosidad notable, densa y dulce, similar a la textura de un jarabe ligero, miel diluida o el almíbar de frutas en conserva.', clue: 'Viscosidad similar a jarabe ligero.' },
  { id: 'body-oily-fine', name: 'Aceitoso fino', category: 'cuerpo', type: 'positive', description: 'Una lubricación delicada, brillante y fina sobre la lengua, que facilita el paso del líquido similar a un aceite de oliva de alta calidad.', clue: 'Lubricación delicada en lengua.' },
  { id: 'body-compact', name: 'Compacto', category: 'cuerpo', type: 'positive', description: 'Sensación de alta concentración de sabores y materia en un espacio reducido, sin sensación de dilución o partes acuosas.', clue: 'Concentración perceptible sin dilución.' },
  { id: 'body-structured', name: 'Estructurado', category: 'cuerpo', type: 'positive', description: 'El cuerpo presenta una arquitectura definida, con un soporte claro y una forma perceptible que sostiene y organiza los sabores.', clue: 'Sensación con soporte y forma clara.' },
  { id: 'body-ample', name: 'Amplio', category: 'cuerpo', type: 'positive', description: 'Se expande generosamente ocupando todas las zonas de la boca: frente, centro, laterales y fondo, con gran presencia espacial.', clue: 'Ocupa frente, centro y laterales.' },
  { id: 'body-persistent-tactile', name: 'Persistente táctil', category: 'cuerpo', type: 'positive', description: 'La sensación física del peso y la textura del líquido perdura en la boca durante varios segundos después de haber tragado.', clue: 'Sensación física dura varios segundos.' },
  // Negativos
  { id: 'body-watery', name: 'Aguado', category: 'cuerpo', type: 'negative', description: 'Falta total de sustancia, peso y carácter; la sensación desaparece casi inmediatamente al tragar, similar a beber agua teñida.', clue: 'Desaparece casi al tragar.' },
  { id: 'body-thin', name: 'Delgado', category: 'cuerpo', type: 'negative', description: 'Sensación lineal, pobre y débil, sin volumen, dimensión ni complejidad táctil al pasar por la boca.', clue: 'Sensación lineal, sin volumen.' },
  { id: 'body-hollow', name: 'Hueco', category: 'cuerpo', type: 'negative', description: 'Se percibe una extraña sensación de vacío en el centro de la boca, como si al café le faltara su núcleo o corazón.', clue: 'Centro de boca vacío.' },
  { id: 'body-dry', name: 'Seco', category: 'cuerpo', type: 'negative', description: 'Absorbe agresivamente la humedad natural de la boca, dejando una sensación de sequedad y aridez inmediata en la lengua.', clue: 'Absorbe saliva.' },
  { id: 'body-sandy', name: 'Arenoso', category: 'cuerpo', type: 'negative', description: 'Presencia molesta de micropartículas o sedimentos que generan una textura granular áspera, similar a tener arena fina en la boca.', clue: 'Microgranular.' },
  { id: 'body-rough', name: 'Rugoso', category: 'cuerpo', type: 'negative', description: 'Fricción irregular, basta y áspera al pasar el líquido por la lengua y el paladar, careciendo de cualquier suavidad.', clue: 'Fricción irregular.' },
  { id: 'body-astringent-tactile', name: 'Astringente táctil', category: 'cuerpo', type: 'negative', description: 'Provoca una contracción física de las mucosas y la lengua, similar a la sensación de morder un plátano verde o caqui.', clue: 'Lengua se contrae.' },
  { id: 'body-powdery', name: 'Polvoso', category: 'cuerpo', type: 'negative', description: 'Sensación seca, fina y ligera, como si hubiera polvo de cacao o harina suspendido en el líquido, restando claridad.', clue: 'Sensación seca y ligera.' },
  { id: 'body-chalky', name: 'Tizoso', category: 'cuerpo', type: 'negative', description: 'Textura seca, opaca y terrosa que recuerda al tacto del polvo de tiza sobre la lengua, dejando un residuo pastoso.', clue: 'Parecido a polvo de tiza.' },
  { id: 'body-heavy-greasy', name: 'Graso pesado', category: 'cuerpo', type: 'negative', description: 'Sensación grasa, densa y excesiva que satura el paladar, recubriéndolo de una película difícil de limpiar.', clue: 'Sensación grasa que satura.' },
  { id: 'body-pasty', name: 'Pastoso', category: 'cuerpo', type: 'negative', description: 'Textura demasiado espesa pero sin fluidez, que se queda pegada en la boca impidiendo un trago limpio.', clue: 'Espeso pero sin fluidez.' },
  { id: 'body-unbalanced', name: 'Desequilibrado', category: 'cuerpo', type: 'negative', description: 'El peso está mal distribuido en la boca, sintiéndose pesado en unas zonas y extrañamente ligero en otras.', clue: 'Peso mal distribuido.' },
  { id: 'body-fibrous', name: 'Fibroso', category: 'cuerpo', type: 'negative', description: 'Sensación de hebras, hilos o filamentos en la textura, restando uniformidad y homogeneidad al líquido.', clue: 'Sensación filamentosa.' },
  { id: 'body-metallic-tactile', name: 'Metálico táctil', category: 'cuerpo', type: 'negative', description: 'Una vibración seca, eléctrica y desagradable en la lengua, asociada al contacto físico con metal o electricidad estática.', clue: 'Vibración seca en lengua.' },
  { id: 'body-short', name: 'Corto', category: 'cuerpo', type: 'negative', description: 'La estructura y el cuerpo colapsan y desaparecen rápidamente tras el trago, dejando un recuerdo fugaz e insatisfactorio.', clue: 'Estructura desaparece rápido.' },

  // --- Postgusto (Aftertaste) ---
  // Positivos
  { id: 'after-long', name: 'Largo', category: 'postgusto', type: 'positive', description: 'El sabor permanece claro, definido y presente en el paladar durante un tiempo prolongado, superando los 10 a 15 segundos.', clue: 'Sabor claro más de 10–15 s.' },
  { id: 'after-clean', name: 'Limpio', category: 'postgusto', type: 'positive', description: 'Un final puro y cristalino que no deja sensaciones turbias, ásperas o desagradables, invitando inmediatamente al siguiente sorbo.', clue: 'No deja sensación turbia.' },
  { id: 'after-persistent', name: 'Persistente', category: 'postgusto', type: 'positive', description: 'Mantiene su identidad y carácter de forma clara y reconocible mucho tiempo después de haber tragado el café.', clue: 'Mantiene identidad clara.' },
  { id: 'after-sweet-residual', name: 'Dulce residual', category: 'postgusto', type: 'positive', description: 'Una agradable y reconfortante sensación de dulzor que reaparece o se intensifica en la boca tras tragar.', clue: 'Dulzor reaparece tras tragar.' },
  { id: 'after-floral-long', name: 'Floral prolongado', category: 'postgusto', type: 'positive', description: 'Un aroma perfumado, delicado y floral que asciende por vía retronasal y perdura elegantemente en la memoria sensorial.', clue: 'Aroma perfumado que sube retronasal.' },
  { id: 'after-cacao-fine', name: 'Cacao fino', category: 'postgusto', type: 'positive', description: 'Una nota elegante y sofisticada de cacao o chocolate amargo de alta calidad que persiste suavemente en el retrogusto.', clue: 'Amargor elegante persistente.' },
  { id: 'after-caramel-final', name: 'Caramelo final', category: 'postgusto', type: 'positive', description: 'Una suave y cálida nota a caramelo derretido o azúcar tostada que cierra la experiencia con un broche dulce.', clue: 'Dulzor suave al final.' },
  { id: 'after-spicy-elegant', name: 'Especiado elegante', category: 'postgusto', type: 'positive', description: 'Ligera sensación cálida y especiada, recordando a canela o clavo, que queda vibrando suavemente en la boca.', clue: 'Sensación cálida ligera.' },
  { id: 'after-refreshing', name: 'Refrescante', category: 'postgusto', type: 'positive', description: 'Deja la boca con una sensación de limpieza, frescura y renovación, limpiando el paladar y preparando para más.', clue: 'Boca se siente limpia.' },
  { id: 'after-round', name: 'Redondo', category: 'postgusto', type: 'positive', description: 'Termina suavemente, desvaneciéndose con gracia sin dejar aristas, picos de sabor agresivos ni sensaciones cortantes.', clue: 'Termina sin aristas.' },
  { id: 'after-complex', name: 'Complejo', category: 'postgusto', type: 'positive', description: 'El sabor residual es dinámico, evoluciona y cambia con el paso de los segundos, revelando diferentes capas y matices.', clue: 'Cambia con el tiempo.' },
  { id: 'after-harmonic', name: 'Armónico', category: 'postgusto', type: 'positive', description: 'Todos los atributos residuales conviven en perfecto equilibrio y proporción, sin que ninguno domine excesivamente al otro.', clue: 'Ningún atributo domina.' },
  { id: 'after-evolutionary', name: 'Evolutivo', category: 'postgusto', type: 'positive', description: 'Sorprendentemente aparecen nuevas notas de sabor en el postgusto que no estaban presentes durante el sorbo inicial.', clue: 'Aparecen nuevas notas.' },
  { id: 'after-bright', name: 'Brillante', category: 'postgusto', type: 'positive', description: 'Una sensación viva, eléctrica y chispeante que se mantiene vibrando en el paladar incluso en la etapa final.', clue: 'Sensación viva incluso al final.' },
  { id: 'after-juicy-residual', name: 'Jugoso residual', category: 'postgusto', type: 'positive', description: 'La salivación se mantiene activa, fluida y agradable mucho tiempo después de haber tragado el líquido.', clue: 'Saliva activa después de tragar.' },
  // Negativos
  { id: 'after-short-neg', name: 'Corto', category: 'postgusto', type: 'negative', description: 'El sabor se corta y desaparece abruptamente en menos de 5 segundos tras tragar, dejando un vacío sensorial.', clue: 'Desaparece en menos de 5 s.' },
  { id: 'after-drying', name: 'Secante', category: 'postgusto', type: 'negative', description: 'Deja la lengua y el paladar con una sensación áspera, árida y falta de humedad, similar a haber comido una fruta verde.', clue: 'Deja lengua áspera.' },
  { id: 'after-bitter-aggressive', name: 'Amargo persistente agresivo', category: 'postgusto', type: 'negative', description: 'Un amargor fuerte, tosco y dominante que se queda pegado en la garganta y resulta difícil de eliminar.', clue: 'Amargor dominante y largo.' },
  { id: 'after-metallic', name: 'Metálico', category: 'postgusto', type: 'negative', description: 'Una sensación residual persistente e inorgánica que recuerda a haber chupado una moneda o una cuchara de hierro.', clue: 'Sensación tipo hierro.' },
  { id: 'after-rancid', name: 'Rancio', category: 'postgusto', type: 'negative', description: 'Nota desagradable a grasa vieja, nueces pasadas o aceite oxidado que permanece en la boca.', clue: 'Grasa oxidada.' },
  { id: 'after-phenolic', name: 'Fenólico', category: 'postgusto', type: 'negative', description: 'Sabor residual químico, medicinal o a plástico quemado que contamina el aliento y el gusto.', clue: 'Medicinal/plástico.' },
  { id: 'after-vegetal-raw', name: 'Vegetal crudo', category: 'postgusto', type: 'negative', description: 'Nota verde, herbácea y cruda que persiste, recordando a tallos, césped cortado o verduras sin cocinar.', clue: 'Hierba verde.' },
  { id: 'after-astringent', name: 'Astringente', category: 'postgusto', type: 'negative', description: 'Fuerte sensación física de sequedad y contracción en las mejillas y costados de la lengua que perdura.', clue: 'Sequedad fuerte.' },
  { id: 'after-burnt', name: 'Quemado', category: 'postgusto', type: 'negative', description: 'Amargor seco, carbonoso y acre, similar al sabor de pan tostado quemado, ceniza o carbón.', clue: 'Amargor seco y carbonoso.' },
  { id: 'after-earthy-heavy', name: 'Terroso pesado', category: 'postgusto', type: 'negative', description: 'Sensación húmeda, sucia y oscura, como a tierra mojada o suelo de bosque, que no se limpia del paladar.', clue: 'Sensación húmeda tipo tierra.' },
  { id: 'after-moldy', name: 'Moho', category: 'postgusto', type: 'negative', description: 'Sabor a humedad cerrada, sótano o hongo que persiste desagradablemente en el retrogusto.', clue: 'Humedad cerrada.' },
  { id: 'after-medicinal', name: 'Medicinal', category: 'postgusto', type: 'negative', description: 'Recuerdo persistente a jarabe para la tos, yodo o alcohol farmacéutico que opaca cualquier otro sabor.', clue: 'Jarabe químico.' },
  { id: 'after-flat', name: 'Plano', category: 'postgusto', type: 'negative', description: 'Final aburrido, monótono y unidimensional, sin ninguna evolución, matiz ni interés sensorial.', clue: 'Sin evolución.' },
  { id: 'after-sour', name: 'Agrio', category: 'postgusto', type: 'negative', description: 'Acidez punzante, avinagrada y desagradable que queda vibrando en la garganta de forma molesta.', clue: 'Ácido desagradable.' },
  { id: 'after-dirty', name: 'Sucio', category: 'postgusto', type: 'negative', description: 'Una mezcla confusa, turbia y poco clara de sabores residuales sin definición, dejando una impresión general negativa.', clue: 'Mezcla confusa sin definición.' },

  // --- Acidez (Acidity) ---
  // Positivas
  { id: 'acid-bright', name: 'Brillante', category: 'acidez', type: 'positive', description: 'Una acidez vivaz, enérgica y chispeante que despierta inmediatamente las papilas gustativas y activa la salivación sin resultar agresiva ni molesta.', clue: 'Despierta saliva sin incomodar.' },
  { id: 'acid-citric', name: 'Cítrica', category: 'acidez', type: 'positive', description: 'Notas frescas, agudas y definidas que recuerdan directamente a frutas cítricas como el limón, la lima, la mandarina o la naranja.', clue: 'Sensación tipo limón/naranja.' },
  { id: 'acid-malic', name: 'Málica', category: 'acidez', type: 'positive', description: 'Acidez redonda, jugosa y suave, que evoca la sensación mordiente pero dulce de una manzana verde crujiente o una pera fresca.', clue: 'Recuerda manzana verde.' },
  { id: 'acid-tartaric', name: 'Tartárica', category: 'acidez', type: 'positive', description: 'Sensación vinosa, ligeramente astringente pero agradable, similar a la que produce la piel de las uvas, las bayas o un vino joven.', clue: 'Similar a uva/vino fresco.' },
  { id: 'acid-phosphoric', name: 'Fosfórica', category: 'acidez', type: 'positive', description: 'Una acidez chispeante, efervescente y eléctrica en la lengua, sensación típica que se encuentra en las bebidas de cola carbonatadas.', clue: 'Chispeante tipo gaseosa cola.' },
  { id: 'acid-juicy', name: 'Jugosa', category: 'acidez', type: 'positive', description: 'Acidez que viene acompañada de una abundante sensación de humedad y frescura, haciendo que la boca se sienta hidratada.', clue: 'Sensación húmeda agradable.' },
  { id: 'acid-vibrant', name: 'Vibrante', category: 'acidez', type: 'positive', description: 'Dinámica y llena de energía, esta acidez no es estática, sino que se mueve y danza por el paladar cambiando de intensidad.', clue: 'Dinámica, no estática.' },
  { id: 'acid-delicate', name: 'Delicada', category: 'acidez', type: 'positive', description: 'Acidez sutil, fina y suave, que está presente para dar vida al café pero sin buscar un protagonismo agresivo.', clue: 'Presente pero suave.' },
  { id: 'acid-clean', name: 'Limpia', category: 'acidez', type: 'positive', description: 'Perfil ácido cristalino y muy definido, sin notas extrañas, fermentos ni sabores sucios que interfieran.', clue: 'Definida y clara.' },
  { id: 'acid-elegant', name: 'Elegante', category: 'acidez', type: 'positive', description: 'Acidez refinada y sofisticada que se integra y entrelaza perfectamente con el dulzor, elevando la calidad de la taza.', clue: 'Integrada al dulzor.' },
  { id: 'acid-sweet', name: 'Dulce', category: 'acidez', type: 'positive', description: 'Acidez madura y frutal que no raspa ni muerde, fusionándose tanto con el azúcar natural que casi se confunde con el dulzor.', clue: 'No raspa.' },
  { id: 'acid-integrated', name: 'Integrada', category: 'acidez', type: 'positive', description: 'Forma parte indisoluble del cuerpo del café, sin sobresalir como un pico aislado o una nota discordante.', clue: 'No sobresale.' },
  { id: 'acid-structural', name: 'Estructural', category: 'acidez', type: 'positive', description: 'Acidez que actúa como la columna vertebral de la bebida, dando soporte, forma y dirección al perfil de sabor general.', clue: 'Sostiene el perfil.' },
  { id: 'acid-refreshing', name: 'Refrescante', category: 'acidez', type: 'positive', description: 'Limpia el paladar de forma agradable e invita irresistiblemente a seguir bebiendo gracias a su frescura.', clue: 'Invita a otro sorbo.' },
  { id: 'acid-balanced', name: 'Balanceada', category: 'acidez', type: 'positive', description: 'Se encuentra en perfecta proporción matemática con el cuerpo y el dulzor, creando una armonía total sin dominar.', clue: 'Proporcional al cuerpo.' },
  // Negativas
  { id: 'acid-sour', name: 'Agria', category: 'acidez', type: 'negative', description: 'Acidez desagradable, punzante e intensa que recuerda al sabor de alimentos fermentados en mal estado o vinagre barato.', clue: 'Recuerda alimento dañado.' },
  { id: 'acid-green', name: 'Verde', category: 'acidez', type: 'negative', description: 'Sabor vegetal, herbáceo e inmaduro, indicativo de granos que no alcanzaron su madurez o falta de desarrollo en el tueste.', clue: 'Inmadura.' },
  { id: 'acid-immature', name: 'Inmadura', category: 'acidez', type: 'negative', description: 'Acidez aguda y punzante a la que le falta el soporte del dulzor necesario para equilibrarla y hacerla agradable.', clue: 'Falta dulzor acompañante.' },
  { id: 'acid-spicy', name: 'Picante', category: 'acidez', type: 'negative', description: 'Sensación de picor, ardor o irritación química en la lengua, no confundir con el picor agradable de especias.', clue: 'Pica en lengua.' },
  { id: 'acid-acetic-dom', name: 'Acética dominante', category: 'acidez', type: 'negative', description: 'Fuerte, penetrante y agresivo olor y sabor a vinagre que domina y anula cualquier otro matiz del café.', clue: 'Tipo vinagre.' },
  { id: 'acid-unbalanced', name: 'Desequilibrada', category: 'acidez', type: 'negative', description: 'Acidez que sobresale excesivamente, rompiendo la armonía y tapando los demás atributos positivos de la taza.', clue: 'Tapa todo.' },
  { id: 'acid-sharp', name: 'Filosa', category: 'acidez', type: 'negative', description: 'Sensación cortante, muy aguda y agresiva, como si pasaras una hoja de afeitar por el paladar.', clue: 'Punzante.' },
  { id: 'acid-pungent', name: 'Punzante', category: 'acidez', type: 'negative', description: 'Golpe ácido directo, agresivo y molesto que impacta fuertemente en la nariz y el paladar posterior.', clue: 'Golpe directo.' },
  { id: 'acid-fermented', name: 'Fermentada excesiva', category: 'acidez', type: 'negative', description: 'Notas agrias, alcohólicas y podridas desagradables, resultado de una fermentación descontrolada en el proceso.', clue: 'Agrio alcohólico.' },
  { id: 'acid-lactic-exc', name: 'Láctica excesiva', category: 'acidez', type: 'negative', description: 'Sabor agrio y denso similar al yogur pasado, leche cortada o suero fermentado en exceso.', clue: 'Tipo yogur pasado.' },
  { id: 'acid-cutting', name: 'Cortante', category: 'acidez', type: 'negative', description: 'Interrumpe bruscamente la experiencia sensorial con un pico ácido repentino y desagradable.', clue: 'Rompe armonía.' },
  { id: 'acid-unstable', name: 'Inestable', category: 'acidez', type: 'negative', description: 'La acidez cambia de forma errática, impredecible y poco placentera a medida que el café se enfría o se mueve en boca.', clue: 'Cambia de forma errática.' },
  { id: 'acid-rough', name: 'Áspera', category: 'acidez', type: 'negative', description: 'Acidez acompañada de una sensación física de raspado o lija en la garganta y laterales de la lengua.', clue: 'Raspa.' },
  { id: 'acid-overextracted', name: 'Sobreextraída ácida', category: 'acidez', type: 'negative', description: 'Desagradable combinación de acidez agria con una sequedad amarga, típica de una extracción errónea.', clue: 'Ácida y seca.' },
  { id: 'acid-disjointed', name: 'Desarticulada', category: 'acidez', type: 'negative', description: 'Se siente separada, como una capa flotante ajena al resto de la bebida, como si no perteneciera al mismo café.', clue: 'No conecta con dulzor.' },

  // --- Dulzor (Sweetness) ---
  // Positivos
  { id: 'sweet-caramel', name: 'Caramelo', category: 'dulzor', type: 'positive', description: 'Un dulzor clásico, reconfortante y cálido, con notas profundas que recuerdan al azúcar caramelizada, toffee o dulce de leche.', clue: 'Dulzor cálido.' },
  { id: 'sweet-honey', name: 'Miel', category: 'dulzor', type: 'positive', description: 'Dulzor complejo, floral y suave, con una textura ligeramente viscosa que recuerda a la miel de abejas natural.', clue: 'Floral y suave.' },
  { id: 'sweet-panela', name: 'Panela', category: 'dulzor', type: 'positive', description: 'Dulzor rústico, terroso y con notas minerales, característico del jugo de caña de azúcar integral o piloncillo.', clue: 'Dulce con leve mineralidad.' },
  { id: 'sweet-muscovado', name: 'Azúcar mascabado', category: 'dulzor', type: 'positive', description: 'Dulzor oscuro, rico y con cuerpo, con notas de melaza ligera y un perfil menos refinado.', clue: 'Dulce oscuro ligero.' },
  { id: 'sweet-syrupy', name: 'Almibarado', category: 'dulzor', type: 'positive', description: 'Dulzor intenso y concentrado, acompañado de una textura viscosa y densa similar a un almíbar.', clue: 'Viscoso.' },
  { id: 'sweet-choc', name: 'Chocolate dulce', category: 'dulzor', type: 'positive', description: 'Dulzor reconfortante que recuerda al chocolate con leche, cacao endulzado o malteada de chocolate.', clue: 'Dulce con cacao.' },
  { id: 'sweet-fruit-ripe', name: 'Fruta madura', category: 'dulzor', type: 'positive', description: 'Dulzor natural, fresco y jugoso, propio de frutas que están en su punto óptimo de maduración.', clue: 'Dulce natural.' },
  { id: 'sweet-molasses', name: 'Melaza', category: 'dulzor', type: 'positive', description: 'Dulzor muy profundo, oscuro, espeso y ligeramente amargo, de gran intensidad y carácter.', clue: 'Dulce profundo.' },
  { id: 'sweet-floral', name: 'Floral dulce', category: 'dulzor', type: 'positive', description: 'Notas dulces, ligeras, etéreas y perfumadas, que recuerdan al néctar de las flores o miel de azahar.', clue: 'Perfumado.' },
  { id: 'sweet-syrup-light', name: 'Jarabe ligero', category: 'dulzor', type: 'positive', description: 'Sensación fluida, limpia y dulce que recubre suavemente la boca sin ser pesada.', clue: 'Sensación fluida.' },
  { id: 'sweet-round', name: 'Redondo', category: 'dulzor', type: 'positive', description: 'Dulzor que envuelve, abraza y suaviza la acidez, eliminando aristas y creando equilibrio.', clue: 'Envuelve acidez.' },
  { id: 'sweet-natural', name: 'Natural', category: 'dulzor', type: 'positive', description: 'Se percibe como intrínseco al grano, auténtico y puro, no como un añadido artificial o forzado.', clue: 'No artificial.' },
  { id: 'sweet-persistent', name: 'Persistente', category: 'dulzor', type: 'positive', description: 'El dulzor no desaparece, sino que permanece en el paladar durante un largo tiempo tras el sorbo.', clue: 'Permanece.' },
  { id: 'sweet-balanced', name: 'Balanceado', category: 'dulzor', type: 'positive', description: 'Nivel justo y perfecto de dulzor que agrada y complementa sin llegar a empalagar o cansar.', clue: 'No empalaga.' },
  { id: 'sweet-clean', name: 'Limpio', category: 'dulzor', type: 'positive', description: 'Dulzor claro, transparente y definido, sin notas sucias, terrosas o extrañas que lo opaquen.', clue: 'Claro y definido.' },
  // Negativos
  { id: 'sweet-cloying', name: 'Empalagoso', category: 'dulzor', type: 'negative', description: 'Exceso de dulzor que satura las papilas gustativas, resulta molesto y cansa rápidamente el paladar.', clue: 'Satura.' },
  { id: 'sweet-artificial', name: 'Artificial', category: 'dulzor', type: 'negative', description: 'Notas químicas y extrañas que recuerdan a edulcorantes sintéticos, aspartamo o jarabes baratos.', clue: 'Tipo edulcorante.' },
  { id: 'sweet-flat', name: 'Plano', category: 'dulzor', type: 'negative', description: 'Dulzor simple y unidimensional que no evoluciona, no tiene matices ni aporta complejidad a la taza.', clue: 'No evoluciona.' },
  { id: 'sweet-short', name: 'Corto', category: 'dulzor', type: 'negative', description: 'Sensación dulce fugaz que desaparece casi inmediatamente al tragar, dejando ganas de más.', clue: 'Desaparece rápido.' },
  { id: 'sweet-burnt-caramel', name: 'Caramelo quemado', category: 'dulzor', type: 'negative', description: 'Dulzor defectuoso mezclado con notas amargas y acres de azúcar carbonizada o quemada.', clue: 'Dulce amargo.' },
  { id: 'sweet-syrup-heavy', name: 'Jarabe pesado', category: 'dulzor', type: 'negative', description: 'Viscosidad excesiva, densa y pegajosa que resulta desagradable y difícil de pasar.', clue: 'Viscosidad molesta.' },
  { id: 'sweet-synthetic', name: 'Sintético', category: 'dulzor', type: 'negative', description: 'Sabor dulce que se siente falso, fabricado y elaborado en laboratorio, ajeno al café.', clue: 'Químico.' },
  { id: 'sweet-unbalanced', name: 'Desequilibrado', category: 'dulzor', type: 'negative', description: 'Dulzor excesivo o mal integrado que tapa completamente la acidez necesaria para la vida del café.', clue: 'Tapa acidez.' },
  { id: 'sweet-sticky', name: 'Pegajoso', category: 'dulzor', type: 'negative', description: 'Deja una sensación densa, adherente e incómoda en la boca y los labios tras beber.', clue: 'Sensación densa incómoda.' },
  { id: 'sweet-fake', name: 'Falso', category: 'dulzor', type: 'negative', description: 'Dulzor que no encaja con el perfil del café, pareciendo un aditivo externo en lugar de algo natural.', clue: 'Poco natural.' },
  { id: 'sweet-dull', name: 'Apagado', category: 'dulzor', type: 'negative', description: 'Dulzor de muy baja intensidad, apenas perceptible, triste y sin vida.', clue: 'Bajo intensidad.' },
  { id: 'sweet-fermented', name: 'Fermentado dulce', category: 'dulzor', type: 'negative', description: 'Sabor a fruta demasiado madura, pasada o podrida, iniciando procesos de fermentación no deseados.', clue: 'Tipo fruta pasada.' },
  { id: 'sweet-overripe', name: 'Sobremaduro', category: 'dulzor', type: 'negative', description: 'Dulzor pesado, vinoso y oxidado, típico de frutas que están a punto de pudrirse.', clue: 'Dulce oxidado.' },
  { id: 'sweet-confused', name: 'Confuso', category: 'dulzor', type: 'negative', description: 'Dulzor mezclado con defectos y notas sucias, difícil de identificar o disfrutar claramente.', clue: 'Mezclado con defectos.' },
  { id: 'sweet-oxidized', name: 'Oxidado dulce', category: 'dulzor', type: 'negative', description: 'Sabor a dulce viejo, rancio o guardado por mucho tiempo en malas condiciones.', clue: 'Dulce viejo.' },

  // --- Amargor (Bitterness) ---
  // Positivos
  { id: 'bitter-cacao', name: 'Cacao', category: 'amargor', type: 'positive', description: 'Un amargor limpio, sofisticado y altamente placentero, que evoca la intensidad y pureza de una barra de chocolate oscuro al 70% de cacao.', clue: 'Amargor limpio tipo chocolate 70%.' },
  { id: 'bitter-dark-choc', name: 'Chocolate oscuro', category: 'amargor', type: 'positive', description: 'Sabor intenso, profundo y envolvente a chocolate negro, muy agradable y deseable al paladar.', clue: 'Intenso pero agradable.' },
  { id: 'bitter-almond', name: 'Almendra', category: 'amargor', type: 'positive', description: 'Amargor seco pero fino, elegante y distintivo, típico de la piel de las almendras o frutos secos tostados.', clue: 'Seco pero fino.' },
  { id: 'bitter-walnut', name: 'Nuez', category: 'amargor', type: 'positive', description: 'Amargor suave y redondo, acompañado de una sensación cálida y ligeramente oleosa propia de las nueces.', clue: 'Amargor suave y cálido.' },
  { id: 'bitter-elegant', name: 'Elegante', category: 'amargor', type: 'positive', description: 'Amargor refinado y bien educado que acompaña al dulzor y la acidez sin competir ni agredirlos.', clue: 'Acompaña dulzor.' },
  { id: 'bitter-structural', name: 'Estructural', category: 'amargor', type: 'positive', description: 'Aporta la base sólida y la dimensión necesaria al café, dándole soporte y cuerpo a la bebida.', clue: 'Da soporte.' },
  { id: 'bitter-integrated', name: 'Integrado', category: 'amargor', type: 'positive', description: 'Perfectamente mezclado y fundido con los otros sabores, imposible de separar del conjunto armónico.', clue: 'No domina.' },
  { id: 'bitter-long-fine', name: 'Largo fino', category: 'amargor', type: 'positive', description: 'Permanece en el postgusto de manera sutil, delicada y sin agresión, alargando la experiencia.', clue: 'Permanece sin agresión.' },
  { id: 'bitter-dark-caramel', name: 'Caramelo oscuro', category: 'amargor', type: 'positive', description: 'Delicioso balance entre dulce y amargo, recordando al caramelo muy tostado o azúcar quemada intencionalmente.', clue: 'Dulce-amargo balanceado.' },
  { id: 'bitter-spicy-dry', name: 'Especiado seco', category: 'amargor', type: 'positive', description: 'Leve sensación cálida, seca y picante, similar a especias como el clavo de olor, pimienta o nuez moscada.', clue: 'Leve sensación cálida.' },
  { id: 'bitter-balanced', name: 'Balanceado', category: 'amargor', type: 'positive', description: 'Se encuentra en proporción exacta con la acidez y el dulzor, completando el perfil sin desentonar.', clue: 'Proporcional.' },
  { id: 'bitter-herbal-fine', name: 'Herbal fino', category: 'amargor', type: 'positive', description: 'Leve nota verde, fresca y aromática que resulta agradable y añade complejidad, como hierbas finas.', clue: 'Leve nota verde agradable.' },
  { id: 'bitter-subtle', name: 'Sutil', category: 'amargor', type: 'positive', description: 'Apenas perceptible, un fondo lejano que solo añade una capa extra de profundidad y misterio.', clue: 'Apenas perceptible.' },
  { id: 'bitter-mature', name: 'Maduro', category: 'amargor', type: 'positive', description: 'Amargor profundo, serio y adulto, pero limpio y bien definido, denotando un buen desarrollo.', clue: 'Profundo pero limpio.' },
  { id: 'bitter-dry-nice', name: 'Seco agradable', category: 'amargor', type: 'positive', description: 'Limpia la boca y el paladar al final del sorbo, preparándolo y refrescándolo para el siguiente.', clue: 'Limpia boca.' },
  // Negativos
  { id: 'bitter-burnt', name: 'Quemado', category: 'amargor', type: 'negative', description: 'Sabor seco, carbonoso y desagradable, resultado directo de un tueste excesivo o granos quemados.', clue: 'Seco y carbonoso.' },
  { id: 'bitter-ash', name: 'Ceniza', category: 'amargor', type: 'negative', description: 'Sabor residual polvoriento y sucio que recuerda a un cenicero sucio o humo frío de cigarro.', clue: 'Tipo cigarro.' },
  { id: 'bitter-charred', name: 'Carbonizado', category: 'amargor', type: 'negative', description: 'Amargor extremo, negro y agresivo, que indica la destrucción total de la materia orgánica del grano.', clue: 'Extremo y agresivo.' },
  { id: 'bitter-astringent', name: 'Astringente', category: 'amargor', type: 'negative', description: 'Amargor que seca inmediata y agresivamente la lengua, encías y paladar, robando la humedad.', clue: 'Seca lengua.' },
  { id: 'bitter-metallic', name: 'Metálico', category: 'amargor', type: 'negative', description: 'Sabor inorgánico, frío y cortante a hierro, cobre o metal oxidado en la boca.', clue: 'Hierro.' },
  { id: 'bitter-drying', name: 'Secante', category: 'amargor', type: 'negative', description: 'Absorbe toda la saliva dejando la boca áspera como lija, haciendo difícil tragar.', clue: 'Absorbe saliva.' },
  { id: 'bitter-dominant', name: 'Dominante', category: 'amargor', type: 'negative', description: 'Tan fuerte y omnipresente que impide percibir cualquier otro sabor, monopolizando el paladar.', clue: 'Tapa todo.' },
  { id: 'bitter-medicinal', name: 'Medicinal', category: 'amargor', type: 'negative', description: 'Sabor químico desagradable que recuerda a pastillas molidas, jarabe amargo o yodo.', clue: 'Químico.' },
  { id: 'bitter-green', name: 'Amargo verde', category: 'amargor', type: 'negative', description: 'Sabor vegetal crudo, áspero y astringente, causado por granos inmaduros o falta de desarrollo.', clue: 'Vegetal crudo.' },
  { id: 'bitter-phenolic', name: 'Fenólico', category: 'amargor', type: 'negative', description: 'Notas a plástico, caucho quemado, brea o desinfectante de hospital.', clue: 'Plástico.' },
  { id: 'bitter-hard', name: 'Duro', category: 'amargor', type: 'negative', description: 'Golpe amargo sólido, contundente y agresivo, sin matices, sutilezas ni amabilidad.', clue: 'Agresivo.' },
  { id: 'bitter-raspy', name: 'Raspante', category: 'amargor', type: 'negative', description: 'Genera una fricción física incómoda y dolorosa en la garganta al momento de tragar.', clue: 'Fricción incómoda.' },
  { id: 'bitter-persistent-agg', name: 'Persistente agresivo', category: 'amargor', type: 'negative', description: 'Amargor malo y tenaz que se queda pegado en el paladar y no se va ni bebiendo agua.', clue: 'No se va.' },
  { id: 'bitter-heavy', name: 'Pesado', category: 'amargor', type: 'negative', description: 'Sensación densa, oscura y saturante de amargor que cansa y abruma los sentidos.', clue: 'Sensación saturante.' },
  { id: 'bitter-overextracted', name: 'Sobreextraído', category: 'amargor', type: 'negative', description: 'La peor combinación posible: un amargor intenso acompañado de una sequedad excesiva.', clue: 'Amargo + seco.' }
];

const CATEGORIES: { id: AttributeCategory; label: string; color: string }[] = [
  { id: 'cuerpo', label: 'Cuerpo', color: 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100' },
  { id: 'acidez', label: 'Acidez', color: 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100' },
  { id: 'dulzor', label: 'Dulzor', color: 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100' },
  { id: 'postgusto', label: 'Postgusto', color: 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100' },
  { id: 'amargor', label: 'Amargor', color: 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100' },
];

// --- Sub-components ---

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
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
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
               {step === 'category' ? 'Paso 1: Identifica la Categoría' : 'Paso 2: Identifica el Descriptor'}
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
                {feedback === 'correct' ? '¡Correcto!' : 'Incorrecto'}
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
                          className={`p-6 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border-2 ${buttonStyle}`}
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
                    Categoría: {CATEGORIES.find(c => c.id === target.category)?.label} <Check className="inline w-3 h-3 ml-1 text-green-500" />
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
                                className={`p-6 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border-2 ${buttonStyle}`}
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
  <div className="space-y-16 animate-fade-in max-w-4xl mx-auto">
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
  <div className="space-y-12 animate-fade-in max-w-3xl mx-auto">
    
    {/* Description Guide */}
    <section className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-black uppercase tracking-tight text-stone-900 dark:text-stone-100">
          La Estructura Perfecta
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Cómo describir un café profesionalmente en 4 pasos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { step: 1, title: 'Cuerpo', desc: 'Peso y textura táctil.' },
          { step: 2, title: 'Acidez', desc: 'Brillo y tipo de ácido.' },
          { step: 3, title: 'Dulzor', desc: 'Carácter y madurez.' },
          { step: 4, title: 'Postgusto', desc: 'Duración y limpieza.' }
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
          "Es un café con <span className="text-brand font-bold">cuerpo cremoso</span>, una <span className="text-brand font-bold">acidez málica</span> brillante, <span className="text-brand font-bold">dulzor a caramelo</span> y un <span className="text-brand font-bold">postgusto limpio</span> y prolongado."
        </p>
      </div>
    </section>

    {/* Exercises */}
    <section className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-black uppercase tracking-tight text-stone-900 dark:text-stone-100">
          Ejercicios de Calibración
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Entrena tu paladar en casa con ingredientes simples.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          {
            title: 'Triangulación de Ácidos',
            material: 'Limón (Cítrico), Manzana Verde (Málico), Vinagre (Acético).',
            steps: ['Diluye unas gotas de cada uno en vasos con agua.', 'Prueba a ciegas e intenta identificar cuál es cuál.', 'Concéntrate en DÓNDE lo sientes en la lengua.'],
            outcome: 'Aprenderás a diferenciar la "forma" de la acidez: Cítrica (lados, punzante), Málica (redonda, persistente).'
          },
          {
            title: 'Memoria de Texturas',
            material: 'Leche entera, Leche descremada, Crema de leche.',
            steps: ['Bebe un sorbo de cada una enfocándote solo en el peso.', 'No tragues inmediatamente, deja que recorra el paladar.', 'Compara la viscosidad.'],
            outcome: 'Calibrarás tu escala de Cuerpo: Ligero (Descremada) vs Medio (Entera) vs Pesado (Crema).'
          },
          {
            title: 'Escala de Dulzor',
            material: 'Azúcar Blanca, Azúcar Morena/Panela, Miel.',
            steps: ['Prepara 3 soluciones con la misma cantidad de agua y endulzante.', 'Nota cómo el azúcar blanca es solo dulce.', 'La panela añade notas minerales y la miel notas florales.'],
            outcome: 'Entenderás la diferencia entre intensidad de dulzor y calidad/complejidad del dulzor.'
          },
          {
            title: 'Mapeo de Sabores',
            material: 'Sal, Azúcar, Limón, Agua Tónica (Amargo).',
            steps: ['Aplica una gota de cada solución en diferentes partes de tu lengua con un hisopo.', 'Dibuja un mapa de dónde sientes más intensidad.', 'Enjuaga bien entre cada prueba.'],
            outcome: 'Descubrirás tu propia sensibilidad biológica y dónde percibes mejor cada sabor básico.'
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
}

export const SensoryTrainingView: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'dictionary' | 'education'>('simulator');

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
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

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto scrollbar-hide">
          {[
            { id: 'simulator', label: 'Simulador' },
            { id: 'dictionary', label: 'Diccionario' },
            { id: 'education', label: 'Educación' }
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
        {activeTab === 'simulator' && <Simulator />}
        {activeTab === 'dictionary' && <Dictionary />}
        {activeTab === 'education' && <Education />}
      </div>
    </div>
  );
};
