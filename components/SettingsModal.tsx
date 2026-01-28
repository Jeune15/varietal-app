import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Database, Users, Shield, CheckCircle, AlertTriangle, RefreshCw, UploadCloud, Trash2, HardDrive, Moon, Sun, LogOut, Settings2 } from 'lucide-react';
import { initSupabase, db, syncToCloud, getSupabase, pushToCloud, pullFromCloud, resetDatabase } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { UserProfile, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onLogout: () => void;
  userRole?: 'admin' | 'student' | null;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, darkMode, toggleDarkMode, onLogout, userRole }) => {
  const { isAdmin, refreshSession, user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'connection' | 'users' | 'system'>('general');
  
  // Connection State
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [connStatus, setConnStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Users State
  const profiles = useLiveQuery(() => db.profiles.toArray()) || [];

  useEffect(() => {
    const savedUrl = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
    const savedKey = localStorage.getItem('supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    if (savedUrl) setUrl(savedUrl);
    if (savedKey) setKey(savedKey);
  }, []);

  const handleSaveConnection = () => {
    if (!url || !key) {
        setConnStatus('error');
        return;
    }
    try {
        localStorage.setItem('supabase_url', url);
        localStorage.setItem('supabase_key', key);
        initSupabase(url, key);
        setConnStatus('success');
        refreshSession();
        setTimeout(() => setConnStatus('idle'), 2000);
    } catch (e) {
        setConnStatus('error');
    }
  };

  const handleForceSync = async () => {
    if (!url || !key) return;
    setIsSyncing(true);
    setSyncMessage('Subiendo datos...');
    
    // Ensure connection
    initSupabase(url, key);

    const result = await pushToCloud();
    if (!result.success) {
        setSyncMessage(`Error: ${result.message}`);
        setTimeout(() => setSyncMessage(''), 8000); // Longer timeout to read error
        setIsSyncing(false);
        return;
    }

    setSyncMessage('Descargando datos...');
    const pullSuccess = await pullFromCloud();
    if (pullSuccess) {
        setSyncMessage('Sincronización completa');
    } else {
        setSyncMessage('Error al descargar');
    }
    setTimeout(() => setSyncMessage(''), 3000);
    setIsSyncing(false);
  };

  const handleUpdateUser = async (profile: UserProfile, updates: Partial<UserProfile>) => {
    if (!isAdmin) return;
    const updated = { ...profile, ...updates };
    await db.profiles.update(profile.id, updated);
    await syncToCloud('profiles', updated);
  };

  const handleReset = async () => {
    if (confirm('ATENCIÓN: Esto eliminará TODOS los datos de la base de datos (local y nube si está conectada). ¿Estás seguro?')) {
      await resetDatabase(user?.id);
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-stone-900 w-full max-w-2xl border border-black dark:border-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-black dark:bg-stone-950 text-white p-4 border-b border-stone-800 shrink-0 sticky top-0 z-10 flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-tight text-white">Configuración</h3>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em]">Sistema & Usuarios</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-stone-300 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 overflow-x-auto scrollbar-hide shrink-0 bg-white dark:bg-stone-900">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors min-w-[120px] ${activeTab === 'general' ? 'bg-stone-100 dark:bg-stone-800 text-black dark:text-white' : 'text-stone-400 hover:text-black dark:hover:text-white'}`}
          >
            <Settings2 className="w-4 h-4" /> General
          </button>
          {(userRole === 'admin' || !userRole) && (
            <>
              <button 
                onClick={() => setActiveTab('connection')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors min-w-[120px] ${activeTab === 'connection' ? 'bg-stone-100 dark:bg-stone-800 text-black dark:text-white' : 'text-stone-400 hover:text-black dark:hover:text-white'}`}
              >
                <Database className="w-4 h-4" /> Conexión
              </button>
              <button 
                onClick={() => setActiveTab('system')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors min-w-[120px] ${activeTab === 'system' ? 'bg-stone-100 dark:bg-stone-800 text-black dark:text-white' : 'text-stone-400 hover:text-black dark:hover:text-white'}`}
              >
                <HardDrive className="w-4 h-4" /> Sistema / Datos
              </button>
            </>
          )}
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors min-w-[120px] ${activeTab === 'users' ? 'bg-stone-100 dark:bg-stone-800 text-black dark:text-white' : 'text-stone-400 hover:text-black dark:hover:text-white'}`}
            >
              <Users className="w-4 h-4" /> Usuarios
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 p-6 flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Usuario Actual</p>
                   <p className="text-sm font-bold text-black dark:text-white">{user?.email}</p>
                   <p className="text-xs text-stone-500 mt-1 capitalize">{profile?.role || 'Visualizador'}</p>
                </div>
                <button 
                  onClick={onLogout}
                  className="px-4 py-2 border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-black dark:text-stone-200 hover:border-black dark:hover:border-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <LogOut className="w-3 h-3" /> Salir
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <div className="border border-stone-200 dark:border-stone-700 p-6 bg-white dark:bg-stone-800/20">
                <div className="mb-4">
                   <h4 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white mb-1">Apariencia</h4>
                   <p className="text-[10px] text-stone-500 font-medium leading-relaxed">
                     Cambie entre el modo claro (arquitectónico) y el modo oscuro (nocturno).
                   </p>
                </div>
                <button 
                  onClick={toggleDarkMode}
                  className="w-full py-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 hover:border-black dark:hover:border-stone-500 text-black dark:text-white transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide"
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {darkMode ? 'Activar Modo Claro' : 'Activar Modo Oscuro'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'connection' && (
            <div className="space-y-6">
              <div className="bg-stone-50 border border-stone-200 p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
                <p className="text-xs text-stone-500 font-medium leading-relaxed">
                  Ingrese las credenciales de su proyecto Supabase. Estas claves se guardarán localmente en este dispositivo.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Supabase URL</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-mono text-stone-600 transition-all" 
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://xyz.supabase.co"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Supabase Anon Key</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-black outline-none text-sm font-mono text-stone-600 transition-all" 
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  />
                </div>
                <button 
                  onClick={handleSaveConnection}
                  className={`w-full py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all ${
                    connStatus === 'success' ? 'bg-green-600 text-white border border-green-600' :
                    connStatus === 'error' ? 'bg-red-600 text-white border border-red-600' :
                    'bg-black text-white border border-black hover:bg-white hover:text-black'
                  }`}
                >
                  {connStatus === 'success' ? 'Conectado' : 
                   connStatus === 'error' ? 'Error de Conexión' : 
                   'Guardar y Conectar'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
               <div className="bg-stone-50 border border-stone-200 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2">Gestión de Usuarios</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                    {profiles?.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-white border border-stone-100 shadow-sm">
                            <div>
                                <p className="text-xs font-bold">{p.email}</p>
                                <p className="text-[10px] text-stone-500 capitalize">{p.role}</p>
                            </div>
                            {p.id !== user?.id && (
                                <select 
                                    className="text-[10px] border border-stone-200 p-1 bg-stone-50 uppercase font-bold"
                                    value={p.role}
                                    onChange={(e) => handleUpdateUser(p, { role: e.target.value as UserRole })}
                                >
                                    <option value="viewer">Visualizador</option>
                                    <option value="editor">Editor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            )}
                        </div>
                    ))}
                </div>
               </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              {/* Sync Controls */}
              <div className="border border-stone-200 p-6">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4" /> Sincronización Manual
                </h4>
                <div className="space-y-4">
                    <p className="text-[10px] text-stone-500 font-medium leading-relaxed">
                        Fuerza una subida de todos los datos locales a la nube y luego descarga las actualizaciones. Útil si hay conflictos.
                    </p>
                    <button 
                        onClick={handleForceSync}
                        disabled={isSyncing}
                        className="w-full py-3 bg-stone-100 border border-stone-200 text-stone-600 hover:bg-stone-200 hover:text-black transition-colors text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Sincronizando...' : 'Forzar Sincronización Completa'}
                    </button>
                    {syncMessage && (
                        <p className={`text-[10px] font-bold text-center ${syncMessage.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                            {syncMessage}
                        </p>
                    )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border border-red-100 bg-red-50/50 p-6">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Zona de Peligro
                </h4>
                <button 
                  onClick={handleReset}
                  className="w-full py-3 bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Resetear Base de Datos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SettingsModal;
