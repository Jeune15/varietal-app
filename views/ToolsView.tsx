import React from 'react';
import { Coffee, Flame, Settings, Eye } from 'lucide-react';

interface Tool {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MOCK_TOOLS: Tool[] = [
  {
    id: 'green-coffee',
    title: 'Café Verde',
    subtitle: 'Gestión y Análisis',
    description: 'Explora variedades, datos técnicos y defectos del café verde. Aprende sobre los estándares internacionales y su impacto en el tostado.',
    icon: Coffee,
  },
  {
    id: 'roasting',
    title: 'Tueste',
    subtitle: 'Técnicas y Perfiles',
    description: 'Descubre las variables de tueste, perfiles de tostado y problemas comunes. Desarrolla tus habilidades en el arte del tostado.',
    icon: Flame,
  },
  {
    id: 'espresso',
    title: 'Espresso',
    subtitle: 'Calibración y Variables',
    description: 'Ajusta y calibra tu espresso. Explora las variables que afectan la extracción y el perfil final de la taza.',
    icon: Settings,
  },
  {
    id: 'cupping',
    title: 'Cata',
    subtitle: 'Análisis Sensorial',
    description: 'Realiza sesiones de cata profesional. Evalúa aromas, sabores y características del café tostado.',
    icon: Eye,
  },
];

interface Props {
  onSelectTool: (toolId: string) => void;
}

const ToolsView: React.FC<Props> = ({ onSelectTool }) => {
  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-32 animate-fade-in">
      <div className="space-y-2 mb-8">
        <h3 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Herramientas</h3>
        <p className="text-[11px] md:text-xs font-bold text-stone-400 uppercase tracking-widest">
          Recursos interactivos y simuladores
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_TOOLS.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="relative group flex flex-col items-start justify-between gap-6 p-6 md:p-8 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-black dark:hover:border-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md h-full text-left"
            >
              <div className="w-full space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-stone-100 dark:bg-stone-800 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300">
                    Herramienta
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-1">{tool.title}</h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{tool.subtitle}</p>
                </div>

                <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-3 font-medium">
                  {tool.description}
                </p>
              </div>

              <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between group-hover:pl-2 transition-all">
                 <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">
                    Abrir Herramienta
                 </span>
                 <svg className="w-4 h-4 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                 </svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ToolsView;