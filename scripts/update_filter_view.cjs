const fs = require('fs');
const path = require('path');

const p = path.resolve('c:/Users/tony_/OneDrive/Desktop/VarietalApp/views/RecipesView.tsx');
let txt = fs.readFileSync(p, 'utf8');

// 1. sessionStage state
txt = txt.replace(
  /useState<'coffee' \| 'recipes'>\('recipes'\);/g,
  "useState<'coffee' | 'suggestions' | 'recipes'>('recipes');"
);

// 2. Remove GSAP hover
txt = txt.replace(/gsap\.to\(el, \{ y: -4, scale: 1\.02, duration: 0\.2, ease: 'power2\.out' \}\);/g, "/* pure css */");
txt = txt.replace(/gsap\.to\(el, \{ y: 0, scale: 1, duration: 0\.2, ease: 'power2\.inOut' \}\);/g, "/* pure css */");

// 3. Update empty state (regex approach to survive CRLF)
const emptyRegex = /\{\s*recipes\.length === 0 && \(\s*<div className="text-xs text-stone-400 py-8 text-center">\s*Aún no hay recetas creadas\.\s*<\/div>\s*\)\s*\}/;

const newEmpty = `{recipes.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-dashed border-stone-200 dark:border-stone-700 h-64">
                <Coffee className="w-10 h-10 text-stone-300 dark:text-stone-600 mb-4" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">No hay sesiones</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 max-w-[200px]">Crea tu primera sesión de filtrado para recibir sugerencias y perfilar tu extracción.</p>
                <button
                  type="button"
                  onClick={handleStartSession}
                  className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-black text-white dark:bg-stone-100 dark:text-stone-900 hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  Crear sesión
                </button>
              </div>
            )}`;

txt = txt.replace(emptyRegex, newEmpty);

// 4. List item hover classes
txt = txt.replace(
  /className=\{`group relative w-full text-left px-4 py-3 rounded-xl border transition-all \$\{/g,
  "className={`group relative w-full text-left px-4 py-3 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-sm ${"
);

// Add ChevronRight back in since we use it
if (!txt.includes('ChevronRight')) {
  txt = txt.replace(/import {([^}]+)} from 'lucide-react';/, "import {$1, ChevronRight} from 'lucide-react';");
}
if (!txt.includes('Coffee')) {
  txt = txt.replace(/import {([^}]+)} from 'lucide-react';/, "import {$1, Coffee} from 'lucide-react';");
}

// 5. Add method/dose fields and replace the Continuar a recetas button
const formTarget = /<div className="space-y-2 md:col-span-2">\s*<span className="block text-\[10px\] font-bold uppercase tracking-widest text-stone-500">\s*Notas estimadas y detalles/;

const formReplace = `<div className="space-y-2">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Método
                    </span>
                    <StyledSelect
                      value={current.method}
                      onChange={e => updateCurrent({ method: e.target.value as BrewMethod })}
                      options={brewMethodOptions}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Dosis (g)
                    </span>
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={current.doseGrams}
                      onChange={e => {
                        const val = Number(e.target.value);
                        if (!Number.isNaN(val) && val >= 1 && val <= 100) {
                          updateCurrent({ doseGrams: val });
                        }
                      }}
                      className="w-full p-2.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Notas estimadas y detalles`;

txt = txt.replace(formTarget, formReplace);

const buttonTarget = /<div className="flex justify-end">\s*<button\s*type="button"\s*onClick=\{\(\) => setSessionStage\('recipes'\)\}\s*className="inline-flex items-center gap-2 text-\[11px\] font-bold uppercase tracking-widest px-6 py-3 rounded-xl bg-black text-white dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"\s*>\s*Continuar a recetas\s*<\/button>\s*<\/div>/;

const buttonReplace = `<div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setSessionStage('suggestions')}
                    className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-6 py-3 rounded-xl bg-black text-white dark:bg-stone-100 dark:text-stone-900 hover:scale-105 active:scale-95 transition-all shadow-md group"
                  >
                    Sugerir Recetas
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>`;

txt = txt.replace(buttonTarget, buttonReplace);

// 6. Insert 'suggestions' render block right after sessionStage === 'coffee'
// Wait, the ternary is: sessionStage === 'coffee' ? ( ... ) : ( ... )
// I will change it to:
// sessionStage === 'coffee' ? ( ... ) : sessionStage === 'suggestions' ? ( <SuggestionsView /> ) : ( ... recipes )
const ternaryStart = /\) : \(\s*<div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4">/;

const suggestionsView = `) : sessionStage === 'suggestions' ? (
  <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-6">
    <div className="space-y-2 text-center max-w-md mx-auto">
      <h2 className="text-lg font-black uppercase tracking-tighter text-stone-900 dark:text-stone-100">
        Perfiles Sugeridos
      </h2>
      <p className="text-xs text-stone-500 dark:text-stone-400">
        Basado en tu café, te proponemos 3 perfiles de extracción. También puedes crear tu receta desde cero.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Dulzor */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex flex-col gap-3 hover:border-brand/50 transition-colors">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#d97706]">Dulzor (1:15)</h3>
          <p className="text-[10px] text-stone-500">Molienda media, 4 vertidos iguales, 92°C. Resalta balance y notas dulces.</p>
        </div>
        <div className="flex-1 text-[10px] space-y-1 text-stone-600 dark:text-stone-300">
          <div className="flex justify-between"><span>Vertidos:</span> <strong>4</strong></div>
          <div className="flex justify-between"><span>Agua Total:</span> <strong>{current.doseGrams * 15} ml</strong></div>
          <div className="flex justify-between"><span>Tiempo:</span> <strong>~3:00</strong></div>
        </div>
        <button
          onClick={() => {
             updateCurrent({
               name: \`\${current.coffeeName || 'Café'} - Dulzor\`,
               ratio: '1:15',
               totalWaterMl: current.doseGrams * 15,
               waterTempCelsius: 92,
               filterType: current.method,
               pressureBars: null,
               phases: [
                 { id: 's1', order: 1, startTimeSeconds: 0, endTimeSeconds: 45, volumeMl: current.doseGrams * 3, pourType: 'espiral', agitation: true, spinCount: 2 },
                 { id: 's2', order: 2, startTimeSeconds: 45, endTimeSeconds: 90, volumeMl: current.doseGrams * 4, pourType: 'espiral', agitation: false, spinCount: 0 },
                 { id: 's3', order: 3, startTimeSeconds: 90, endTimeSeconds: 135, volumeMl: current.doseGrams * 4, pourType: 'centro', agitation: false, spinCount: 0 },
                 { id: 's4', order: 4, startTimeSeconds: 135, endTimeSeconds: 180, volumeMl: current.doseGrams * 4, pourType: 'centro', agitation: true, spinCount: 1 }
               ]
             });
             setSessionStage('recipes');
          }}
          className="w-full py-2 rounded-lg bg-[#d97706]/10 text-[#d97706] text-[10px] font-bold uppercase tracking-widest hover:bg-[#d97706]/20 transition-colors"
        >
          Seleccionar
        </button>
      </div>

      {/* Claridad */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex flex-col gap-3 hover:border-brand/50 transition-colors">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#2563eb]">Claridad (1:16)</h3>
          <p className="text-[10px] text-stone-500">Molienda fina, 2-3 vertidos agresivos, 94°C. Resalta acidez y notas florales/frutales.</p>
        </div>
        <div className="flex-1 text-[10px] space-y-1 text-stone-600 dark:text-stone-300">
          <div className="flex justify-between"><span>Vertidos:</span> <strong>2</strong></div>
          <div className="flex justify-between"><span>Agua Total:</span> <strong>{current.doseGrams * 16} ml</strong></div>
          <div className="flex justify-between"><span>Tiempo:</span> <strong>~2:30</strong></div>
        </div>
        <button
          onClick={() => {
             updateCurrent({
               name: \`\${current.coffeeName || 'Café'} - Claridad\`,
               ratio: '1:16',
               totalWaterMl: current.doseGrams * 16,
               waterTempCelsius: 94,
               filterType: current.method,
               pressureBars: null,
               phases: [
                 { id: 'c1', order: 1, startTimeSeconds: 0, endTimeSeconds: 40, volumeMl: current.doseGrams * 3, pourType: 'espiral', agitation: true, spinCount: 1 },
                 { id: 'c2', order: 2, startTimeSeconds: 40, endTimeSeconds: 90, volumeMl: (current.doseGrams * 16) - (current.doseGrams * 3), pourType: 'centro', agitation: false, spinCount: 0 }
               ]
             });
             setSessionStage('recipes');
          }}
          className="w-full py-2 rounded-lg bg-[#2563eb]/10 text-[#2563eb] text-[10px] font-bold uppercase tracking-widest hover:bg-[#2563eb]/20 transition-colors"
        >
          Seleccionar
        </button>
      </div>

      {/* Cuerpo */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex flex-col gap-3 hover:border-brand/50 transition-colors">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#dc2626]">Cuerpo (1:13)</h3>
          <p className="text-[10px] text-stone-500">Molienda gruesa, bloom extendido, 89°C. Más textura, ideal para tuestes medios/oscuros.</p>
        </div>
        <div className="flex-1 text-[10px] space-y-1 text-stone-600 dark:text-stone-300">
          <div className="flex justify-between"><span>Vertidos:</span> <strong>3</strong></div>
          <div className="flex justify-between"><span>Agua Total:</span> <strong>{current.doseGrams * 13} ml</strong></div>
          <div className="flex justify-between"><span>Tiempo:</span> <strong>~2:45</strong></div>
        </div>
        <button
          onClick={() => {
             updateCurrent({
               name: \`\${current.coffeeName || 'Café'} - Cuerpo\`,
               ratio: '1:13',
               totalWaterMl: current.doseGrams * 13,
               waterTempCelsius: 89,
               filterType: current.method,
               pressureBars: null,
               phases: [
                 { id: 'b1', order: 1, startTimeSeconds: 0, endTimeSeconds: 50, volumeMl: current.doseGrams * 2.5, pourType: 'espiral', agitation: true, spinCount: 3 },
                 { id: 'b2', order: 2, startTimeSeconds: 50, endTimeSeconds: 100, volumeMl: current.doseGrams * 5.5, pourType: 'espiral', agitation: true, spinCount: 2 },
                 { id: 'b3', order: 3, startTimeSeconds: 100, endTimeSeconds: 150, volumeMl: current.doseGrams * 5, pourType: 'centro', agitation: false, spinCount: 1 }
               ]
             });
             setSessionStage('recipes');
          }}
          className="w-full py-2 rounded-lg bg-[#dc2626]/10 text-[#dc2626] text-[10px] font-bold uppercase tracking-widest hover:bg-[#dc2626]/20 transition-colors"
        >
          Seleccionar
        </button>
      </div>
    </div>

    <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex justify-center">
      <button
        onClick={() => setSessionStage('recipes')}
        className="text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
      >
        Omitir y crear receta manual
      </button>
    </div>
  </div>
) : (
  <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4">`;

txt = txt.replace(ternaryStart, suggestionsView);

fs.writeFileSync(p, txt, 'utf8');
console.log('Successfully updated RecipesView.tsx');
