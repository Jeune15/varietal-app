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
  { id: 'body-silky', name: 'Sedoso', category: 'cuerpo', type: 'positive', description: 'Sensación uniforme, sin fricción en lengua ni paladar.', clue: 'Sensación uniforme, sin fricción en lengua ni paladar.' },
  { id: 'body-creamy', name: 'Cremoso', category: 'cuerpo', type: 'positive', description: 'Textura espesa pero suave, similar a leche entera tibia.', clue: 'Textura espesa pero suave, similar a leche entera tibia.' },
  { id: 'body-juicy', name: 'Jugoso', category: 'cuerpo', type: 'positive', description: 'Activa salivación inmediata, sensación húmeda.', clue: 'Activa salivación inmediata, sensación húmeda.' },
  { id: 'body-dense', name: 'Denso', category: 'cuerpo', type: 'positive', description: 'Peso claro en centro de lengua, sensación compacta.', clue: 'Peso claro en centro de lengua, sensación compacta.' },
  { id: 'body-enveloping', name: 'Envolvente', category: 'cuerpo', type: 'positive', description: 'Cubre toda la boca de forma homogénea.', clue: 'Cubre toda la boca de forma homogénea.' },
  { id: 'body-round', name: 'Redondo', category: 'cuerpo', type: 'positive', description: 'Sin picos táctiles, transición suave.', clue: 'Sin picos táctiles, transición suave.' },
  { id: 'body-velvety', name: 'Aterciopelado', category: 'cuerpo', type: 'positive', description: 'Microtextura fina, sin burbujas perceptibles.', clue: 'Microtextura fina, sin burbujas perceptibles.' },
  { id: 'body-unctuous', name: 'Untuoso', category: 'cuerpo', type: 'positive', description: 'Sensación ligeramente oleosa pero agradable.', clue: 'Sensación ligeramente oleosa pero agradable.' },
  { id: 'body-heavy-struct', name: 'Pesado estructurado', category: 'cuerpo', type: 'positive', description: 'Permanece en boca con soporte, no cae rápido.', clue: 'Permanece en boca con soporte, no cae rápido.' },
  { id: 'body-syrupy', name: 'Almibarado', category: 'cuerpo', type: 'positive', description: 'Viscosidad similar a jarabe ligero.', clue: 'Viscosidad similar a jarabe ligero.' },
  { id: 'body-oily-fine', name: 'Aceitoso fino', category: 'cuerpo', type: 'positive', description: 'Lubricación delicada en lengua.', clue: 'Lubricación delicada en lengua.' },
  { id: 'body-compact', name: 'Compacto', category: 'cuerpo', type: 'positive', description: 'Concentración perceptible sin dilución.', clue: 'Concentración perceptible sin dilución.' },
  { id: 'body-structured', name: 'Estructurado', category: 'cuerpo', type: 'positive', description: 'Sensación con soporte y forma clara.', clue: 'Sensación con soporte y forma clara.' },
  { id: 'body-ample', name: 'Amplio', category: 'cuerpo', type: 'positive', description: 'Ocupa frente, centro y laterales.', clue: 'Ocupa frente, centro y laterales.' },
  { id: 'body-persistent-tactile', name: 'Persistente táctil', category: 'cuerpo', type: 'positive', description: 'Sensación física dura varios segundos.', clue: 'Sensación física dura varios segundos.' },
  // Negativos
  { id: 'body-watery', name: 'Aguado', category: 'cuerpo', type: 'negative', description: 'Desaparece casi al tragar.', clue: 'Desaparece casi al tragar.' },
  { id: 'body-thin', name: 'Delgado', category: 'cuerpo', type: 'negative', description: 'Sensación lineal, sin volumen.', clue: 'Sensación lineal, sin volumen.' },
  { id: 'body-hollow', name: 'Hueco', category: 'cuerpo', type: 'negative', description: 'Centro de boca vacío.', clue: 'Centro de boca vacío.' },
  { id: 'body-dry', name: 'Seco', category: 'cuerpo', type: 'negative', description: 'Absorbe saliva.', clue: 'Absorbe saliva.' },
  { id: 'body-sandy', name: 'Arenoso', category: 'cuerpo', type: 'negative', description: 'Microgranular.', clue: 'Microgranular.' },
  { id: 'body-rough', name: 'Rugoso', category: 'cuerpo', type: 'negative', description: 'Fricción irregular.', clue: 'Fricción irregular.' },
  { id: 'body-astringent-tactile', name: 'Astringente táctil', category: 'cuerpo', type: 'negative', description: 'Lengua se contrae.', clue: 'Lengua se contrae.' },
  { id: 'body-powdery', name: 'Polvoso', category: 'cuerpo', type: 'negative', description: 'Sensación seca y ligera.', clue: 'Sensación seca y ligera.' },
  { id: 'body-chalky', name: 'Tizoso', category: 'cuerpo', type: 'negative', description: 'Parecido a polvo de tiza.', clue: 'Parecido a polvo de tiza.' },
  { id: 'body-heavy-greasy', name: 'Graso pesado', category: 'cuerpo', type: 'negative', description: 'Sensación grasa que satura.', clue: 'Sensación grasa que satura.' },
  { id: 'body-pasty', name: 'Pastoso', category: 'cuerpo', type: 'negative', description: 'Espeso pero sin fluidez.', clue: 'Espeso pero sin fluidez.' },
  { id: 'body-unbalanced', name: 'Desequilibrado', category: 'cuerpo', type: 'negative', description: 'Peso mal distribuido.', clue: 'Peso mal distribuido.' },
  { id: 'body-fibrous', name: 'Fibroso', category: 'cuerpo', type: 'negative', description: 'Sensación filamentosa.', clue: 'Sensación filamentosa.' },
  { id: 'body-metallic-tactile', name: 'Metálico táctil', category: 'cuerpo', type: 'negative', description: 'Vibración seca en lengua.', clue: 'Vibración seca en lengua.' },
  { id: 'body-short', name: 'Corto', category: 'cuerpo', type: 'negative', description: 'Estructura desaparece rápido.', clue: 'Estructura desaparece rápido.' },

  // --- Postgusto (Aftertaste) ---
  // Positivos
  { id: 'after-long', name: 'Largo', category: 'postgusto', type: 'positive', description: 'Sabor claro más de 10–15 s.', clue: 'Sabor claro más de 10–15 s.' },
  { id: 'after-clean', name: 'Limpio', category: 'postgusto', type: 'positive', description: 'No deja sensación turbia.', clue: 'No deja sensación turbia.' },
  { id: 'after-persistent', name: 'Persistente', category: 'postgusto', type: 'positive', description: 'Mantiene identidad clara.', clue: 'Mantiene identidad clara.' },
  { id: 'after-sweet-residual', name: 'Dulce residual', category: 'postgusto', type: 'positive', description: 'Dulzor reaparece tras tragar.', clue: 'Dulzor reaparece tras tragar.' },
  { id: 'after-floral-long', name: 'Floral prolongado', category: 'postgusto', type: 'positive', description: 'Aroma perfumado que sube retronasal.', clue: 'Aroma perfumado que sube retronasal.' },
  { id: 'after-cacao-fine', name: 'Cacao fino', category: 'postgusto', type: 'positive', description: 'Amargor elegante persistente.', clue: 'Amargor elegante persistente.' },
  { id: 'after-caramel-final', name: 'Caramelo final', category: 'postgusto', type: 'positive', description: 'Dulzor suave al final.', clue: 'Dulzor suave al final.' },
  { id: 'after-spicy-elegant', name: 'Especiado elegante', category: 'postgusto', type: 'positive', description: 'Sensación cálida ligera.', clue: 'Sensación cálida ligera.' },
  { id: 'after-refreshing', name: 'Refrescante', category: 'postgusto', type: 'positive', description: 'Boca se siente limpia.', clue: 'Boca se siente limpia.' },
  { id: 'after-round', name: 'Redondo', category: 'postgusto', type: 'positive', description: 'Termina sin aristas.', clue: 'Termina sin aristas.' },
  { id: 'after-complex', name: 'Complejo', category: 'postgusto', type: 'positive', description: 'Cambia con el tiempo.', clue: 'Cambia con el tiempo.' },
  { id: 'after-harmonic', name: 'Armónico', category: 'postgusto', type: 'positive', description: 'Ningún atributo domina.', clue: 'Ningún atributo domina.' },
  { id: 'after-evolutionary', name: 'Evolutivo', category: 'postgusto', type: 'positive', description: 'Aparecen nuevas notas.', clue: 'Aparecen nuevas notas.' },
  { id: 'after-bright', name: 'Brillante', category: 'postgusto', type: 'positive', description: 'Sensación viva incluso al final.', clue: 'Sensación viva incluso al final.' },
  { id: 'after-juicy-residual', name: 'Jugoso residual', category: 'postgusto', type: 'positive', description: 'Saliva activa después de tragar.', clue: 'Saliva activa después de tragar.' },
  // Negativos
  { id: 'after-short-neg', name: 'Corto', category: 'postgusto', type: 'negative', description: 'Desaparece en menos de 5 s.', clue: 'Desaparece en menos de 5 s.' },
  { id: 'after-drying', name: 'Secante', category: 'postgusto', type: 'negative', description: 'Deja lengua áspera.', clue: 'Deja lengua áspera.' },
  { id: 'after-bitter-aggressive', name: 'Amargo persistente agresivo', category: 'postgusto', type: 'negative', description: 'Amargor dominante y largo.', clue: 'Amargor dominante y largo.' },
  { id: 'after-metallic', name: 'Metálico', category: 'postgusto', type: 'negative', description: 'Sensación tipo hierro.', clue: 'Sensación tipo hierro.' },
  { id: 'after-rancid', name: 'Rancio', category: 'postgusto', type: 'negative', description: 'Grasa oxidada.', clue: 'Grasa oxidada.' },
  { id: 'after-phenolic', name: 'Fenólico', category: 'postgusto', type: 'negative', description: 'Medicinal/plástico.', clue: 'Medicinal/plástico.' },
  { id: 'after-vegetal-raw', name: 'Vegetal crudo', category: 'postgusto', type: 'negative', description: 'Hierba verde.', clue: 'Hierba verde.' },
  { id: 'after-astringent', name: 'Astringente', category: 'postgusto', type: 'negative', description: 'Sequedad fuerte.', clue: 'Sequedad fuerte.' },
  { id: 'after-burnt', name: 'Quemado', category: 'postgusto', type: 'negative', description: 'Amargor seco y carbonoso.', clue: 'Amargor seco y carbonoso.' },
  { id: 'after-earthy-heavy', name: 'Terroso pesado', category: 'postgusto', type: 'negative', description: 'Sensación húmeda tipo tierra.', clue: 'Sensación húmeda tipo tierra.' },
  { id: 'after-moldy', name: 'Moho', category: 'postgusto', type: 'negative', description: 'Humedad cerrada.', clue: 'Humedad cerrada.' },
  { id: 'after-medicinal', name: 'Medicinal', category: 'postgusto', type: 'negative', description: 'Jarabe químico.', clue: 'Jarabe químico.' },
  { id: 'after-flat', name: 'Plano', category: 'postgusto', type: 'negative', description: 'Sin evolución.', clue: 'Sin evolución.' },
  { id: 'after-sour', name: 'Agrio', category: 'postgusto', type: 'negative', description: 'Ácido desagradable.', clue: 'Ácido desagradable.' },
  { id: 'after-dirty', name: 'Sucio', category: 'postgusto', type: 'negative', description: 'Mezcla confusa sin definición.', clue: 'Mezcla confusa sin definición.' },

  // --- Acidez (Acidity) ---
  // Positivas
  { id: 'acid-bright', name: 'Brillante', category: 'acidez', type: 'positive', description: 'Despierta saliva sin incomodar.', clue: 'Despierta saliva sin incomodar.' },
  { id: 'acid-citric', name: 'Cítrica', category: 'acidez', type: 'positive', description: 'Sensación tipo limón/naranja.', clue: 'Sensación tipo limón/naranja.' },
  { id: 'acid-malic', name: 'Málica', category: 'acidez', type: 'positive', description: 'Recuerda manzana verde.', clue: 'Recuerda manzana verde.' },
  { id: 'acid-tartaric', name: 'Tartárica', category: 'acidez', type: 'positive', description: 'Similar a uva/vino fresco.', clue: 'Similar a uva/vino fresco.' },
  { id: 'acid-phosphoric', name: 'Fosfórica', category: 'acidez', type: 'positive', description: 'Chispeante tipo gaseosa cola.', clue: 'Chispeante tipo gaseosa cola.' },
  { id: 'acid-juicy', name: 'Jugosa', category: 'acidez', type: 'positive', description: 'Sensación húmeda agradable.', clue: 'Sensación húmeda agradable.' },
  { id: 'acid-vibrant', name: 'Vibrante', category: 'acidez', type: 'positive', description: 'Dinámica, no estática.', clue: 'Dinámica, no estática.' },
  { id: 'acid-delicate', name: 'Delicada', category: 'acidez', type: 'positive', description: 'Presente pero suave.', clue: 'Presente pero suave.' },
  { id: 'acid-clean', name: 'Limpia', category: 'acidez', type: 'positive', description: 'Definida y clara.', clue: 'Definida y clara.' },
  { id: 'acid-elegant', name: 'Elegante', category: 'acidez', type: 'positive', description: 'Integrada al dulzor.', clue: 'Integrada al dulzor.' },
  { id: 'acid-sweet', name: 'Dulce', category: 'acidez', type: 'positive', description: 'No raspa.', clue: 'No raspa.' },
  { id: 'acid-integrated', name: 'Integrada', category: 'acidez', type: 'positive', description: 'No sobresale.', clue: 'No sobresale.' },
  { id: 'acid-structural', name: 'Estructural', category: 'acidez', type: 'positive', description: 'Sostiene el perfil.', clue: 'Sostiene el perfil.' },
  { id: 'acid-refreshing', name: 'Refrescante', category: 'acidez', type: 'positive', description: 'Invita a otro sorbo.', clue: 'Invita a otro sorbo.' },
  { id: 'acid-balanced', name: 'Balanceada', category: 'acidez', type: 'positive', description: 'Proporcional al cuerpo.', clue: 'Proporcional al cuerpo.' },
  // Negativas
  { id: 'acid-sour', name: 'Agria', category: 'acidez', type: 'negative', description: 'Recuerda alimento dañado.', clue: 'Recuerda alimento dañado.' },
  { id: 'acid-green', name: 'Verde', category: 'acidez', type: 'negative', description: 'Inmadura.', clue: 'Inmadura.' },
  { id: 'acid-immature', name: 'Inmadura', category: 'acidez', type: 'negative', description: 'Falta dulzor acompañante.', clue: 'Falta dulzor acompañante.' },
  { id: 'acid-spicy', name: 'Picante', category: 'acidez', type: 'negative', description: 'Pica en lengua.', clue: 'Pica en lengua.' },
  { id: 'acid-acetic-dom', name: 'Acética dominante', category: 'acidez', type: 'negative', description: 'Tipo vinagre.', clue: 'Tipo vinagre.' },
  { id: 'acid-unbalanced', name: 'Desequilibrada', category: 'acidez', type: 'negative', description: 'Tapa todo.', clue: 'Tapa todo.' },
  { id: 'acid-sharp', name: 'Filosa', category: 'acidez', type: 'negative', description: 'Punzante.', clue: 'Punzante.' },
  { id: 'acid-pungent', name: 'Punzante', category: 'acidez', type: 'negative', description: 'Golpe directo.', clue: 'Golpe directo.' },
  { id: 'acid-fermented', name: 'Fermentada excesiva', category: 'acidez', type: 'negative', description: 'Agrio alcohólico.', clue: 'Agrio alcohólico.' },
  { id: 'acid-lactic-exc', name: 'Láctica excesiva', category: 'acidez', type: 'negative', description: 'Tipo yogur pasado.', clue: 'Tipo yogur pasado.' },
  { id: 'acid-cutting', name: 'Cortante', category: 'acidez', type: 'negative', description: 'Rompe armonía.', clue: 'Rompe armonía.' },
  { id: 'acid-unstable', name: 'Inestable', category: 'acidez', type: 'negative', description: 'Cambia de forma errática.', clue: 'Cambia de forma errática.' },
  { id: 'acid-rough', name: 'Áspera', category: 'acidez', type: 'negative', description: 'Raspa.', clue: 'Raspa.' },
  { id: 'acid-overextracted', name: 'Sobreextraída ácida', category: 'acidez', type: 'negative', description: 'Ácida y seca.', clue: 'Ácida y seca.' },
  { id: 'acid-disjointed', name: 'Desarticulada', category: 'acidez', type: 'negative', description: 'No conecta con dulzor.', clue: 'No conecta con dulzor.' },

  // --- Dulzor (Sweetness) ---
  // Positivos
  { id: 'sweet-caramel', name: 'Caramelo', category: 'dulzor', type: 'positive', description: 'Dulzor cálido.', clue: 'Dulzor cálido.' },
  { id: 'sweet-honey', name: 'Miel', category: 'dulzor', type: 'positive', description: 'Floral y suave.', clue: 'Floral y suave.' },
  { id: 'sweet-panela', name: 'Panela', category: 'dulzor', type: 'positive', description: 'Dulce con leve mineralidad.', clue: 'Dulce con leve mineralidad.' },
  { id: 'sweet-muscovado', name: 'Azúcar mascabado', category: 'dulzor', type: 'positive', description: 'Dulce oscuro ligero.', clue: 'Dulce oscuro ligero.' },
  { id: 'sweet-syrupy', name: 'Almibarado', category: 'dulzor', type: 'positive', description: 'Viscoso.', clue: 'Viscoso.' },
  { id: 'sweet-choc', name: 'Chocolate dulce', category: 'dulzor', type: 'positive', description: 'Dulce con cacao.', clue: 'Dulce con cacao.' },
  { id: 'sweet-fruit-ripe', name: 'Fruta madura', category: 'dulzor', type: 'positive', description: 'Dulce natural.', clue: 'Dulce natural.' },
  { id: 'sweet-molasses', name: 'Melaza', category: 'dulzor', type: 'positive', description: 'Dulce profundo.', clue: 'Dulce profundo.' },
  { id: 'sweet-floral', name: 'Floral dulce', category: 'dulzor', type: 'positive', description: 'Perfumado.', clue: 'Perfumado.' },
  { id: 'sweet-syrup-light', name: 'Jarabe ligero', category: 'dulzor', type: 'positive', description: 'Sensación fluida.', clue: 'Sensación fluida.' },
  { id: 'sweet-round', name: 'Redondo', category: 'dulzor', type: 'positive', description: 'Envuelve acidez.', clue: 'Envuelve acidez.' },
  { id: 'sweet-natural', name: 'Natural', category: 'dulzor', type: 'positive', description: 'No artificial.', clue: 'No artificial.' },
  { id: 'sweet-persistent', name: 'Persistente', category: 'dulzor', type: 'positive', description: 'Permanece.', clue: 'Permanece.' },
  { id: 'sweet-balanced', name: 'Balanceado', category: 'dulzor', type: 'positive', description: 'No empalaga.', clue: 'No empalaga.' },
  { id: 'sweet-clean', name: 'Limpio', category: 'dulzor', type: 'positive', description: 'Claro y definido.', clue: 'Claro y definido.' },
  // Negativos
  { id: 'sweet-cloying', name: 'Empalagoso', category: 'dulzor', type: 'negative', description: 'Satura.', clue: 'Satura.' },
  { id: 'sweet-artificial', name: 'Artificial', category: 'dulzor', type: 'negative', description: 'Tipo edulcorante.', clue: 'Tipo edulcorante.' },
  { id: 'sweet-flat', name: 'Plano', category: 'dulzor', type: 'negative', description: 'No evoluciona.', clue: 'No evoluciona.' },
  { id: 'sweet-short', name: 'Corto', category: 'dulzor', type: 'negative', description: 'Desaparece rápido.', clue: 'Desaparece rápido.' },
  { id: 'sweet-burnt-caramel', name: 'Caramelo quemado', category: 'dulzor', type: 'negative', description: 'Dulce amargo.', clue: 'Dulce amargo.' },
  { id: 'sweet-syrup-heavy', name: 'Jarabe pesado', category: 'dulzor', type: 'negative', description: 'Viscosidad molesta.', clue: 'Viscosidad molesta.' },
  { id: 'sweet-synthetic', name: 'Sintético', category: 'dulzor', type: 'negative', description: 'Químico.', clue: 'Químico.' },
  { id: 'sweet-unbalanced', name: 'Desequilibrado', category: 'dulzor', type: 'negative', description: 'Tapa acidez.', clue: 'Tapa acidez.' },
  { id: 'sweet-sticky', name: 'Pegajoso', category: 'dulzor', type: 'negative', description: 'Sensación densa incómoda.', clue: 'Sensación densa incómoda.' },
  { id: 'sweet-fake', name: 'Falso', category: 'dulzor', type: 'negative', description: 'Poco natural.', clue: 'Poco natural.' },
  { id: 'sweet-dull', name: 'Apagado', category: 'dulzor', type: 'negative', description: 'Bajo intensidad.', clue: 'Bajo intensidad.' },
  { id: 'sweet-fermented', name: 'Fermentado dulce', category: 'dulzor', type: 'negative', description: 'Tipo fruta pasada.', clue: 'Tipo fruta pasada.' },
  { id: 'sweet-overripe', name: 'Sobremaduro', category: 'dulzor', type: 'negative', description: 'Dulce oxidado.', clue: 'Dulce oxidado.' },
  { id: 'sweet-confused', name: 'Confuso', category: 'dulzor', type: 'negative', description: 'Mezclado con defectos.', clue: 'Mezclado con defectos.' },
  { id: 'sweet-oxidized', name: 'Oxidado dulce', category: 'dulzor', type: 'negative', description: 'Dulce viejo.', clue: 'Dulce viejo.' },

  // --- Amargor (Bitterness) ---
  // Positivos
  { id: 'bitter-cacao', name: 'Cacao', category: 'amargor', type: 'positive', description: 'Amargor limpio tipo chocolate 70%.', clue: 'Amargor limpio tipo chocolate 70%.' },
  { id: 'bitter-dark-choc', name: 'Chocolate oscuro', category: 'amargor', type: 'positive', description: 'Intenso pero agradable.', clue: 'Intenso pero agradable.' },
  { id: 'bitter-almond', name: 'Almendra', category: 'amargor', type: 'positive', description: 'Seco pero fino.', clue: 'Seco pero fino.' },
  { id: 'bitter-walnut', name: 'Nuez', category: 'amargor', type: 'positive', description: 'Amargor suave y cálido.', clue: 'Amargor suave y cálido.' },
  { id: 'bitter-elegant', name: 'Elegante', category: 'amargor', type: 'positive', description: 'Acompaña dulzor.', clue: 'Acompaña dulzor.' },
  { id: 'bitter-structural', name: 'Estructural', category: 'amargor', type: 'positive', description: 'Da soporte.', clue: 'Da soporte.' },
  { id: 'bitter-integrated', name: 'Integrado', category: 'amargor', type: 'positive', description: 'No domina.', clue: 'No domina.' },
  { id: 'bitter-long-fine', name: 'Largo fino', category: 'amargor', type: 'positive', description: 'Permanece sin agresión.', clue: 'Permanece sin agresión.' },
  { id: 'bitter-dark-caramel', name: 'Caramelo oscuro', category: 'amargor', type: 'positive', description: 'Dulce-amargo balanceado.', clue: 'Dulce-amargo balanceado.' },
  { id: 'bitter-spicy-dry', name: 'Especiado seco', category: 'amargor', type: 'positive', description: 'Leve sensación cálida.', clue: 'Leve sensación cálida.' },
  { id: 'bitter-balanced', name: 'Balanceado', category: 'amargor', type: 'positive', description: 'Proporcional.', clue: 'Proporcional.' },
  { id: 'bitter-herbal-fine', name: 'Herbal fino', category: 'amargor', type: 'positive', description: 'Leve nota verde agradable.', clue: 'Leve nota verde agradable.' },
  { id: 'bitter-subtle', name: 'Sutil', category: 'amargor', type: 'positive', description: 'Apenas perceptible.', clue: 'Apenas perceptible.' },
  { id: 'bitter-mature', name: 'Maduro', category: 'amargor', type: 'positive', description: 'Profundo pero limpio.', clue: 'Profundo pero limpio.' },
  { id: 'bitter-dry-nice', name: 'Seco agradable', category: 'amargor', type: 'positive', description: 'Limpia boca.', clue: 'Limpia boca.' },
  // Negativos
  { id: 'bitter-burnt', name: 'Quemado', category: 'amargor', type: 'negative', description: 'Seco y carbonoso.', clue: 'Seco y carbonoso.' },
  { id: 'bitter-ash', name: 'Ceniza', category: 'amargor', type: 'negative', description: 'Tipo cigarro.', clue: 'Tipo cigarro.' },
  { id: 'bitter-charred', name: 'Carbonizado', category: 'amargor', type: 'negative', description: 'Extremo y agresivo.', clue: 'Extremo y agresivo.' },
  { id: 'bitter-astringent', name: 'Astringente', category: 'amargor', type: 'negative', description: 'Seca lengua.', clue: 'Seca lengua.' },
  { id: 'bitter-metallic', name: 'Metálico', category: 'amargor', type: 'negative', description: 'Hierro.', clue: 'Hierro.' },
  { id: 'bitter-drying', name: 'Secante', category: 'amargor', type: 'negative', description: 'Absorbe saliva.', clue: 'Absorbe saliva.' },
  { id: 'bitter-dominant', name: 'Dominante', category: 'amargor', type: 'negative', description: 'Tapa todo.', clue: 'Tapa todo.' },
  { id: 'bitter-medicinal', name: 'Medicinal', category: 'amargor', type: 'negative', description: 'Químico.', clue: 'Químico.' },
  { id: 'bitter-green', name: 'Amargo verde', category: 'amargor', type: 'negative', description: 'Vegetal crudo.', clue: 'Vegetal crudo.' },
  { id: 'bitter-phenolic', name: 'Fenólico', category: 'amargor', type: 'negative', description: 'Plástico.', clue: 'Plástico.' },
  { id: 'bitter-hard', name: 'Duro', category: 'amargor', type: 'negative', description: 'Agresivo.', clue: 'Agresivo.' },
  { id: 'bitter-raspy', name: 'Raspante', category: 'amargor', type: 'negative', description: 'Fricción incómoda.', clue: 'Fricción incómoda.' },
  { id: 'bitter-persistent-agg', name: 'Persistente agresivo', category: 'amargor', type: 'negative', description: 'No se va.', clue: 'No se va.' },
  { id: 'bitter-heavy', name: 'Pesado', category: 'amargor', type: 'negative', description: 'Sensación saturante.', clue: 'Sensación saturante.' },
  { id: 'bitter-overextracted', name: 'Sobreextraído', category: 'amargor', type: 'negative', description: 'Amargo + seco.', clue: 'Amargo + seco.' }
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
  const [selectedCategory, setSelectedCategory] = useState<AttributeCategory | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong-category' | 'wrong-name' | null>(null);
  const [streak, setStreak] = useState(0);

  const generateQuestion = () => {
    const random = ATTRIBUTES[Math.floor(Math.random() * ATTRIBUTES.length)];
    setTarget(random);
    setSelectedCategory(null);
    setSelectedName(null);
    setFeedback(null);
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  const handleCheck = () => {
    if (!target || !selectedCategory || !selectedName) return;

    if (selectedCategory !== target.category) {
      setFeedback('wrong-category');
      setStreak(0);
    } else if (selectedName !== target.name) {
      setFeedback('wrong-name');
      setStreak(0);
    } else {
      setFeedback('correct');
      setStreak(s => s + 1);
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
          <span className="text-xs font-bold uppercase tracking-widest">Entrenador</span>
        </div>
        <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full">
          <Trophy className={`w-4 h-4 ${streak > 0 ? 'text-yellow-500' : 'text-stone-400'}`} />
          <span className="text-sm font-black text-stone-900 dark:text-stone-100">{streak}</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 rounded-2xl shadow-sm text-center space-y-6">
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Descripción Sensorial</span>
          <h3 className="text-2xl md:text-3xl font-serif italic text-stone-900 dark:text-stone-100 leading-tight">
            "{target.clue}"
          </h3>
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
                {feedback === 'correct' && '¡Correcto!'}
                {feedback === 'wrong-category' && 'Categoría incorrecta'}
                {feedback === 'wrong-name' && 'Nombre incorrecto'}
              </div>
              {feedback !== 'correct' && (
                <p className="mt-2 text-xs opacity-80">
                  Era: <span className="font-bold">{CATEGORIES.find(c => c.id === target.category)?.label} - {target.name}</span>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="space-y-6">
        {/* Step 1: Category */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-stone-500">1. Selecciona la Categoría</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  if (!feedback) {
                    setSelectedCategory(cat.id);
                    setSelectedName(null); // Reset name if category changes
                  }
                }}
                disabled={!!feedback}
                className={`p-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                  selectedCategory === cat.id
                    ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black scale-105'
                    : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-stone-700'
                } ${feedback ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Name (Filtered by Category) */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 overflow-hidden pt-4"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-500">2. Selecciona el Descriptor</label>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand animate-pulse">
                  {selectedName || 'Esperando selección...'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Positivos */}
                 <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand mb-2 block flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
                      Positivos
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                        {ATTRIBUTES.filter(a => a.category === selectedCategory && a.type === 'positive').map(attr => (
                            <button
                                key={attr.id}
                                onClick={() => !feedback && setSelectedName(attr.name)}
                                disabled={!!feedback}
                                className={`p-2 min-h-[40px] rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border flex items-center justify-center text-center ${
                                selectedName === attr.name
                                    ? 'border-brand bg-brand text-white shadow-lg shadow-brand/20 scale-105 z-10'
                                    : 'border-stone-200 bg-white text-stone-600 hover:border-brand/50 hover:text-brand dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:text-brand'
                                } ${feedback ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {attr.name}
                            </button>
                        ))}
                    </div>
                 </div>

                 {/* Negativos */}
                 <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 block flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-400"></div>
                      Negativos
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                        {ATTRIBUTES.filter(a => a.category === selectedCategory && a.type === 'negative').map(attr => (
                            <button
                                key={attr.id}
                                onClick={() => !feedback && setSelectedName(attr.name)}
                                disabled={!!feedback}
                                className={`p-2 min-h-[40px] rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border flex items-center justify-center text-center ${
                                selectedName === attr.name
                                    ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-lg scale-105 z-10'
                                    : 'border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-400 hover:text-stone-700 dark:border-stone-800 dark:bg-stone-900/50 dark:text-stone-500 dark:hover:text-stone-300'
                                } ${feedback ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {attr.name}
                            </button>
                        ))}
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        <div className="pt-4 flex justify-end">
          {!feedback ? (
            <button
              onClick={handleCheck}
              disabled={!selectedCategory || !selectedName}
              className="px-8 py-4 bg-brand text-white font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand/20"
            >
              Verificar
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-all flex items-center gap-2"
            >
              Siguiente <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          )}
        </div>
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

      <div className="grid grid-cols-1 gap-6">
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
