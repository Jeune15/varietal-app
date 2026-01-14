
import React, { useState } from 'react';
import { getSupabase } from '../db';
import { Coffee, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = getSupabase();
    if (!supabase) {
      setError("Error de configuración: Supabase no está inicializado. Contacte al administrador.");
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Cuenta creada. Por favor espere a que un administrador active su cuenta.");
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Auth state change will be caught by AuthContext
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-stone-200 shadow-2xl p-8 md:p-12 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
        {/* Decorative Top Border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>

        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-black text-white flex items-center justify-center mb-6">
            <Coffee className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-black">Varietal</h1>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] mt-2">Desarrolladores de Café</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-xs text-red-600 font-bold leading-relaxed">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
            <p className="text-xs text-green-700 font-bold leading-relaxed">{message}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                <Mail className="w-4 h-4" />
              </div>
              <input 
                type="email" 
                required 
                className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-200 focus:border-black outline-none text-sm font-bold transition-all placeholder:text-stone-300" 
                placeholder="usuario@varietal.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Contraseña</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input 
                type="password" 
                required 
                className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-200 focus:border-black outline-none text-sm font-bold transition-all placeholder:text-stone-300" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-black hover:bg-stone-800 text-white font-black uppercase tracking-[0.2em] transition-all text-xs border border-transparent hover:border-black flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-stone-100 text-center">
          <button 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-xs font-bold text-stone-400 hover:text-black uppercase tracking-wider transition-colors"
          >
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
          </button>
        </div>
      </div>
      
      <p className="mt-8 text-[10px] font-bold text-stone-300 uppercase tracking-widest">
        v2.0 &middot; Varietal App
      </p>
    </div>
  );
};

export default LoginView;
