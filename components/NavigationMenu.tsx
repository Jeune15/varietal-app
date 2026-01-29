import React, { useEffect, useState } from 'react';
import { X, ArrowRight, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (role: 'admin' | 'student', password: string) => Promise<boolean>;
}

const NavigationMenu: React.FC<Props> = ({ isOpen, onClose, onAuthenticate }) => {
  const [activeOption, setActiveOption] = useState<'admin' | 'student' | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleOptionClick = (option: 'admin' | 'student') => {
    setActiveOption(option);
    setPassword('');
    setError('');
  };

  const handleBack = () => {
    setActiveOption(null);
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOption) return;

    setLoading(true);
    setError('');
    
    const success = await onAuthenticate(activeOption, password);
    
    if (!success) {
      setError('Contraseña incorrecta');
      setLoading(false);
    }
    // If success, parent handles navigation and closing
  };

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const t = setTimeout(() => setIsVisible(false), 1500);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[200] transition-opacity duration-[1500ms] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => {
          setActiveOption(null);
          onClose();
        }}
      />

      {/* Bottom Sheet */}
      <div className={`fixed bottom-0 left-0 right-0 h-[75vh] bg-stone-900 z-[210] rounded-t-[2rem] overflow-hidden shadow-2xl transform transition-transform duration-[1500ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        
        {/* Close Button */}
        <button 
          onClick={() => {
            setActiveOption(null);
            onClose();
          }}
          className="absolute top-6 right-6 z-20 p-2 text-white hover:text-white/70 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="h-full flex flex-col md:flex-row">
          
          {/* Option 1: Equipo Varietal (Admin) */}
          <div 
            className="relative flex-1 group cursor-pointer overflow-hidden transition-all duration-1000"
            onClick={() => !activeOption && handleOptionClick('admin')}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
              style={{ backgroundImage: 'url(/equipo.webp)' }}
            />
            <div className={`absolute inset-0 transition-colors duration-1000 ${activeOption === 'admin' ? 'bg-black/70' : activeOption === 'student' ? 'bg-black/60' : 'bg-black/40 group-hover:bg-black/50'}`} />

            {/* Content */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
              <div className={`w-full max-w-sm mx-auto transition-all duration-1000 ${activeOption === 'admin' ? '' : ''}`}>
                <div className={`flex flex-col items-center text-center transition-transform duration-1000 ${activeOption === 'admin' ? '-translate-y-2' : 'translate-y-0'}`}>
                  <span className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Equipo</span>
                  <span className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Varietal</span>
                </div>

                {activeOption === 'admin' && (
                  <div className="mt-6 animate-fade-in-up">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-white/80">Contraseña de Acceso</label>
                        <input 
                          type="password"
                          autoFocus
                          className="w-full bg-transparent border-b border-white/40 py-2 text-center text-white text-xl font-serif focus:border-white focus:outline-none transition-colors placeholder:text-white/30"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                      <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-stone-200 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Verificando...' : 'Entrar'}
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleBack(); }}
                        className="w-full py-2 text-white/70 text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Option 2: Alumnos */}
          <div 
            className="relative flex-1 group cursor-pointer overflow-hidden transition-all duration-1000 border-t md:border-t-0 md:border-l border-white/10"
            onClick={() => !activeOption && handleOptionClick('student')}
          >
             {/* Background Image */}
             <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
              style={{ backgroundImage: 'url(/alumnos.jpg)' }}
            />
            <div className={`absolute inset-0 transition-colors duration-1000 ${activeOption === 'student' ? 'bg-black/70' : activeOption === 'admin' ? 'bg-black/60' : 'bg-black/40 group-hover:bg-black/50'}`} />

            {/* Content */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
              <div className={`w-full max-w-sm mx-auto transition-all duration-1000 ${activeOption === 'student' ? '' : ''}`}>
                <div className={`flex flex-col items-center text-center transition-transform duration-1000 ${activeOption === 'student' ? '-translate-y-2' : 'translate-y-0'}`}>
                  <span className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Alumnos</span>
                  <span className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Varietal</span>
                </div>

                {activeOption === 'student' && (
                  <div className="mt-6 animate-fade-in-up">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-white/80">Contraseña de Acceso</label>
                        <input 
                          type="password"
                          autoFocus
                          className="w-full bg-transparent border-b border-white/40 py-2 text-center text-white text-xl font-serif focus:border-white focus:outline-none transition-colors placeholder:text-white/30"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                      <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-stone-200 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Verificando...' : 'Entrar'}
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleBack(); }}
                        className="w-full py-2 text-white/70 text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default NavigationMenu;
