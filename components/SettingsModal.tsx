
import React, { useState, useEffect } from 'react';
import { X, Save, Database, Users, Shield, CheckCircle, AlertTriangle, RefreshCw, UploadCloud } from 'lucide-react';
import { initSupabase, db, syncToCloud, getSupabase, pushToCloud, pullFromCloud } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { UserProfile, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isAdmin, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState<'connection' | 'users'>('connection');
  
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-white/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-black text-white p-6 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">Configuración</h3>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em]">Sistema & Usuarios</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200">
          <button 
            onClick={() => setActiveTab('connection')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'connection' ? 'bg-stone-100 text-black' : 'text-stone-400 hover:text-black'}`}
          >
            <Database className="w-4 h-4" /> Conexión
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'users' ? 'bg-stone-100 text-black' : 'text-stone-400 hover:text-black'}`}
            >
              <Users className="w-4 h-4" /> Usuarios
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto">
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
                    placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleSaveConnection}
                  className={`w-full py-4 font-black uppercase tracking-[0.2em] transition-all text-xs border flex items-center justify-center gap-2 ${
                    connStatus === 'success' 
                      ? 'bg-green-600 text-white border-green-600' 
                      : 'bg-black text-white border-black hover:bg-stone-800'
                  }`}
                >
                  {connStatus === 'success' ? (
                    <>
                      <CheckCircle className="w-4 h-4" /> Conectado
                    </>
                  ) : (
                    'Guardar y Conectar'
                  )}
                </button>
              </div>

              <div className="pt-8 mt-8 border-t border-stone-100">
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <RefreshCw className="w-3 h-3" /> Acciones de Sincronización
                </h4>
                <button
                    onClick={handleForceSync}
                    disabled={isSyncing || !url || !key}
                    className="w-full py-3 bg-white border border-stone-200 hover:border-black text-stone-600 hover:text-black transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                    {syncMessage || 'Forzar Sincronización Completa (Subir y Bajar)'}
                </button>
                <p className="text-[10px] text-stone-400 mt-2 text-center leading-relaxed">
                    Use esto si nota discrepancias entre dispositivos. <br/>
                    <span className="text-amber-600 font-bold">Nota:</span> Si falla, es probable que deba actualizar el esquema de la base de datos en Supabase.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'users' && isAdmin && (
            <div className="space-y-6">
               <div className="bg-stone-50 border border-stone-200 p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
                <p className="text-xs text-stone-500 font-medium leading-relaxed">
                  Gestione el acceso de los usuarios. Los usuarios "Inactivos" no podrán acceder a la aplicación aunque tengan contraseña.
                </p>
              </div>

              <div className="border border-stone-200">
                {profiles.length === 0 ? (
                    <div className="p-8 text-center text-stone-400 text-xs uppercase tracking-widest">No hay usuarios registrados</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-stone-100 border-b border-stone-200">
                            <tr>
                                <th className="px-4 py-3 text-[9px] font-black text-black uppercase tracking-widest">Usuario</th>
                                <th className="px-4 py-3 text-[9px] font-black text-black uppercase tracking-widest">Rol</th>
                                <th className="px-4 py-3 text-[9px] font-black text-black uppercase tracking-widest text-right">Acceso</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {profiles.map(p => (
                                <tr key={p.id} className="hover:bg-stone-50">
                                    <td className="px-4 py-4">
                                        <p className="text-xs font-bold text-black">{p.email}</p>
                                        <p className="text-[9px] font-mono text-stone-400">{p.id.slice(0,8)}...</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <select 
                                            value={p.role}
                                            onChange={(e) => handleUpdateUser(p, { role: e.target.value as UserRole })}
                                            className="bg-white border border-stone-200 text-[10px] font-bold uppercase tracking-wide px-2 py-1 outline-none focus:border-black"
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="editor">Editor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <button 
                                            onClick={() => handleUpdateUser(p, { isActive: !p.isActive })}
                                            className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border ${
                                                p.isActive 
                                                    ? 'bg-black text-white border-black' 
                                                    : 'bg-white text-stone-300 border-stone-200 hover:border-red-300 hover:text-red-400'
                                            }`}
                                        >
                                            {p.isActive ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
