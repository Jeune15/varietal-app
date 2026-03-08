import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, syncToCloud, getSupabase } from '../db';
import { TeamMember, ScheduleEntry } from '../types';
import { Calendar, Clock, User, Plus, CheckCircle, XCircle, Edit, Trash2, ChevronLeft, ChevronRight, X, History, Filter } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface HoursData {
  weekly: number;
  monthly: number;
  annual: number;
}

export interface CalendarViewProps {
  onBack?: () => void;
}

const CalendarView = ({ onBack }: CalendarViewProps) => {
  const { showToast } = useToast();
  const [selectedUser, setSelectedUser] = useState<string>('alejandro');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'history'>('week');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'task' | 'event'>('task');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    user_id: 'alejandro'
  });
  const [hoursData, setHoursData] = useState<HoursData>({ weekly: 0, monthly: 0, annual: 0 });
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);

  const teamMembers = useLiveQuery(async () => {
    const list = await db.teamMembers.toArray();
    const order = ['alejandro', 'anthony', 'isai'];
    return list.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  });

  useEffect(() => {
    const initTeamMembers = async () => {
      const defaults = [
        { id: 'alejandro', name: 'Alejhandro' },
        { id: 'anthony', name: 'Anthony' },
        { id: 'isai', name: 'Isai' }
      ];
      
      for (const member of defaults) {
        try {
          const exists = await db.teamMembers.get(member.id);
          if (!exists) {
            await db.teamMembers.add(member);
            await syncToCloud('teamMembers', member);
          } else if (exists.name !== member.name) {
            await db.teamMembers.update(member.id, { name: member.name });
            await syncToCloud('teamMembers', member);
          }
        } catch (error) {
          console.error('Error initializing team member:', member.id, error);
        }
      }
    };

    initTeamMembers();
  }, []);
  const scheduleEntries = useLiveQuery(() => db.scheduleEntries.toArray());

  useEffect(() => {
    if (scheduleEntries) {
      calculateHours();
    }
  }, [scheduleEntries, selectedUser, currentDate]);

  const handlePasswordSubmit = () => {
    if (password === '10666234') {
      setIsAuthenticated(true);
      setShowPasswordPrompt(false);
      showToast('Acceso concedido', 'success');
    } else {
      showToast('Contraseña incorrecta', 'error');
    }
  };

  const calculateHours = () => {
    if (!scheduleEntries) return;

    const userEntries = scheduleEntries.filter(e => e.user_id === selectedUser);
    const now = new Date();

    // Weekly hours
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekEntries = userEntries.filter(e => {
      const eDate = new Date(e.date);
      return eDate >= weekStart && eDate <= weekEnd;
    });

    const weeklyHours = calculateTotalHours(weekEntries);

    // Monthly hours
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const monthEntries = userEntries.filter(e => {
      const eDate = new Date(e.date);
      return eDate >= monthStart && eDate <= monthEnd;
    });

    const monthlyHours = calculateTotalHours(monthEntries);

    // Annual hours
    const yearStart = new Date(currentDate.getFullYear(), 0, 1);
    const yearEnd = new Date(currentDate.getFullYear(), 11, 31);

    const yearEntries = userEntries.filter(e => {
      const eDate = new Date(e.date);
      return eDate >= yearStart && eDate <= yearEnd;
    });

    const annualHours = calculateTotalHours(yearEntries);

    setHoursData({ weekly: weeklyHours, monthly: monthlyHours, annual: annualHours });
  };

  const calculateTotalHours = (entries: ScheduleEntry[]): number => {
    const checkIns = entries.filter(e => e.type === 'check_in').sort((a, b) => a.time.localeCompare(b.time));
    const checkOuts = entries.filter(e => e.type === 'check_out').sort((a, b) => a.time.localeCompare(b.time));
    
    let totalHours = 0;
    checkIns.forEach((checkIn, index) => {
      const checkOut = checkOuts[index];
      if (checkOut) {
        const start = new Date(`2000-01-01T${checkIn.time}:00`);
        const end = new Date(`2000-01-01T${checkOut.time}:00`);
        const diff = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
        totalHours += diff;
      } else {
        // Auto check out 4 hours later if not marked
        const lastCheckOutTime = localStorage.getItem(`last_checkout_${checkIn.user_id}_${checkIn.date}`);
        if (!lastCheckOutTime) {
          totalHours += 4;
        }
      }
    });
    return parseFloat(totalHours.toFixed(2));
  };

  const handleCheckIn = async (userId: string) => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);

    const todayEntries = scheduleEntries?.filter(e => 
      e.user_id === userId && 
      e.date === date && 
      (e.type === 'check_in' || e.type === 'check_out')
    ) || [];

    const lastEntry = todayEntries.sort((a, b) => a.time.localeCompare(b.time)).pop();

    if (!lastEntry || lastEntry.type === 'check_out') {
      const entry: ScheduleEntry = {
        id: `${userId}_${date}_${time}_check_in`,
        user_id: userId,
        type: 'check_in',
        date,
        time,
        details: {}
      };
      await db.scheduleEntries.add(entry);
      await syncToCloud('scheduleEntries', entry);
      showToast('✓ Check in registrado', 'success');
    } else {
      const entry: ScheduleEntry = {
        id: `${userId}_${date}_${time}_check_out`,
        user_id: userId,
        type: 'check_out',
        date,
        time,
        details: {}
      };
      await db.scheduleEntries.add(entry);
      await syncToCloud('scheduleEntries', entry);
      localStorage.setItem(`last_checkout_${userId}_${date}`, time);
      showToast('✓ Check out registrado', 'success');
    }
  };

  const handleAddEntry = async () => {
    if (!formData.title || !formData.date || !formData.time) {
      showToast('Completa todos los campos', 'error');
      return;
    }

    if (editingEntry) {
      await saveEdit();
      return;
    }

    const entry: ScheduleEntry = {
      id: `${formData.user_id}_${formData.date}_${formData.time}_${modalType}_${Date.now()}`,
      user_id: formData.user_id,
      type: modalType,
      date: formData.date,
      time: formData.time,
      details: {
        title: formData.title,
        description: formData.description
      }
    };

    await db.scheduleEntries.add(entry);
    await syncToCloud('scheduleEntries', entry);
    setShowAddModal(false);
    setFormData({ title: '', description: '', date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5), user_id: 'isai' });
    showToast(`${modalType === 'task' ? 'Tarea' : 'Evento'} agregado ✓`, 'success');
  };

  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const getEntriesForDate = (date: string, userId?: string) => {
    return scheduleEntries?.filter(e => 
      e.date === date && 
      (!userId || e.user_id === userId)
    ).sort((a, b) => a.time.localeCompare(b.time)) || [];
  };

  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const dates = [];
    const startDate = new Date(firstDay);
    startDate.setDate(1 - firstDay.getDay());
    
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push(d);
    }
    
    return dates;
  };

  const deleteEntry = async (id: string) => {
    await db.scheduleEntries.delete(id);
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('scheduleEntries').delete().eq('id', id);
    }
    setExpandedEntries(prev => {
      const copy = new Set(prev);
      copy.delete(id);
      return copy;
    });
    showToast('Entrada eliminada', 'success');
  };

  const toggleExpand = (id: string) => {
    setExpandedEntries(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const startEdit = (entry: ScheduleEntry) => {
    setEditingEntry(entry);
    setModalType(entry.type === 'task' || entry.type === 'event' ? entry.type : 'task');
    setFormData({
      title: entry.details?.title || '',
      description: entry.details?.description || '',
      date: entry.date,
      time: entry.time,
      user_id: entry.user_id
    });
    setShowAddModal(true);
  };

  const saveEdit = async () => {
    if (!editingEntry) return;
    const updates = {
      type: modalType,
      date: formData.date,
      time: formData.time,
      user_id: formData.user_id,
      details: {
        title: formData.title,
        description: formData.description
      }
    };
    await db.scheduleEntries.update(editingEntry.id, updates);
    await syncToCloud('scheduleEntries', { ...editingEntry, ...updates });
    setShowAddModal(false);
    setEditingEntry(null);
    showToast('Entrada actualizada', 'success');
  };

  if (showPasswordPrompt) {
    return (
      <div className="min-h-screen bg-white dark:bg-stone-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-stone-900 dark:text-stone-100" />
            <h1 className="text-2xl font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
              Calendario
            </h1>
            <p className="text-stone-600 dark:text-stone-400 mt-2 text-sm">
              Ingresa la contraseña para acceder
            </p>
          </div>
          
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 py-3 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            <button
              onClick={handlePasswordSubmit}
              className="w-full py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity"
            >
              Acceder
            </button>
            {onBack && (
               <button
                 onClick={onBack}
                 className="w-full py-3 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 rounded font-bold uppercase tracking-widest text-sm hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors"
               >
                 Volver
               </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const weekDates = getWeekDates(currentDate);
  const monthDates = getMonthDates(currentDate);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-stone-900 dark:text-stone-100 mb-2">
            Calendario
          </h2>
          <p className="text-stone-600 dark:text-stone-400 text-sm">Gestiona el horario del equipo</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingEntry(null);
              setFormData({ title: '', description: '', date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5), user_id: 'isai' });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Agregar
          </button>
          
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 rounded font-bold uppercase tracking-widest text-sm hover:border-stone-900 dark:hover:border-stone-100 transition-colors"
            >
              <ChevronLeft size={16} />
              Salir
            </button>
          )}
        </div>
      </div>

      {/* User Selector & View Mode */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <span className="font-bold text-stone-900 dark:text-stone-100 text-sm uppercase tracking-widest">Usuario:</span>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-3 py-2 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all uppercase"
          >
            {teamMembers?.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg">
          {['week', 'month', 'history'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                viewMode === mode
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              {mode === 'week' ? 'Semana' : mode === 'month' ? 'Mes' : 'Historial'}
            </button>
          ))}
        </div>
      </div>

      {/* Hours Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-900/30 rounded-lg p-5 transition-transform hover:-translate-y-1 duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-pink-500" />
            <h4 className="font-black text-pink-900 dark:text-pink-100 text-xs uppercase tracking-widest">Semanal</h4>
          </div>
          <p className="text-4xl font-black text-pink-600 dark:text-pink-400">{hoursData.weekly.toFixed(1)}h</p>
        </div>
        
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-5 transition-transform hover:-translate-y-1 duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-stone-400" />
            <h4 className="font-black text-stone-900 dark:text-stone-100 text-xs uppercase tracking-widest">Mensual</h4>
          </div>
          <p className="text-4xl font-black text-stone-900 dark:text-stone-100">{hoursData.monthly.toFixed(1)}h</p>
        </div>
        
        <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg p-5 transition-transform hover:-translate-y-1 duration-300">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-4 h-4 text-stone-400" />
            <h4 className="font-black text-stone-500 dark:text-stone-400 text-xs uppercase tracking-widest">Anual</h4>
          </div>
          <p className="text-4xl font-black text-stone-500 dark:text-stone-400">{hoursData.annual.toFixed(1)}h</p>
        </div>
      </div>

      {/* Check In/Out Button */}
      <button
        onClick={() => handleCheckIn(selectedUser)}
        className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-pink-500 text-white rounded-lg font-black uppercase tracking-widest text-sm hover:bg-pink-600 transition-all active:scale-95 shadow-lg shadow-pink-500/20"
      >
        <Clock size={20} />
        Check In/Out
      </button>

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center bg-stone-50 dark:bg-stone-900/50 p-3 rounded-lg border border-stone-200 dark:border-stone-800">
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(currentDate.getDate() - 7);
                setCurrentDate(newDate);
              }}
              className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
              {weekDates[0].toLocaleDateString('es')} - {weekDates[6].toLocaleDateString('es')}
            </h3>
            
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(currentDate.getDate() + 7);
                setCurrentDate(newDate);
              }}
              className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDates.map(date => {
              const dateStr = date.toISOString().split('T')[0];
              const dayEntries = getEntriesForDate(dateStr, selectedUser);
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              
              return (
                <div key={dateStr} className={`border rounded-xl p-4 min-h-[200px] transition-colors flex flex-col ${
                  isToday 
                    ? 'bg-white dark:bg-stone-900 border-pink-500 dark:border-pink-500 border-2 shadow-md shadow-pink-500/10' 
                    : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800'
                }`}>
                  <h4 className={`font-black text-sm mb-3 uppercase tracking-wide border-b pb-2 ${isToday ? 'text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900/30' : 'text-stone-900 dark:text-stone-100 border-stone-100 dark:border-stone-800'}`}>
                    {date.toLocaleDateString('es', { weekday: 'short', day: 'numeric' })}
                  </h4>
                  
                  <div className="space-y-2 flex-1">
                    {dayEntries.length === 0 ? (
                      <div className="h-full flex items-center justify-center opacity-30">
                        <span className="text-[10px] uppercase tracking-widest font-bold">Sin actividad</span>
                      </div>
                    ) : (
                      dayEntries.map(entry => {
                        const nameLabel = entry.type === 'check_in' || entry.type === 'check_out'
                          ? teamMembers?.find(m => m.id === entry.user_id)?.name || entry.user_id
                          : entry.details?.title || 'Evento';
                        const isExpanded = expandedEntries.has(entry.id);
                        
                        let borderClass = 'border-l-stone-300';
                        let bgClass = 'bg-stone-50 dark:bg-stone-900';
                        if (entry.type === 'check_in') { borderClass = 'border-l-stone-900 dark:border-l-stone-100'; }
                        if (entry.type === 'check_out') { borderClass = 'border-l-stone-400 dark:border-l-stone-600'; }
                        if (entry.type === 'task') { borderClass = 'border-l-pink-500'; bgClass = 'bg-pink-50/50 dark:bg-pink-900/10'; }
                        if (entry.type === 'event') { borderClass = 'border-l-pink-300'; bgClass = 'bg-pink-50/30 dark:bg-pink-900/5'; }

                        return (
                          <div
                            key={entry.id}
                            className={`p-2 rounded-lg text-xs ${bgClass} border border-stone-100 dark:border-stone-800 border-l-4 ${borderClass} transition-all hover:shadow-sm`}
                          >
                            <div className="flex justify-between items-center cursor-pointer gap-2" onClick={() => toggleExpand(entry.id)}>
                              <span className="font-bold truncate flex-1">{nameLabel}</span>
                              <span className="font-mono opacity-60 text-[10px]">{entry.time}</span>
                            </div>
                            {isExpanded && (
                              <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 space-y-2">
                                {entry.details?.description && <div className="italic">{entry.details.description}</div>}
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => startEdit(entry)} className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-600">
                                    <Edit size={12} />
                                  </button>
                                  <button onClick={() => deleteEntry(entry.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center bg-stone-50 dark:bg-stone-900/50 p-3 rounded-lg border border-stone-200 dark:border-stone-800">
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(currentDate.getMonth() - 1);
                setCurrentDate(newDate);
              }}
              className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
              {currentDate.toLocaleDateString('es', { month: 'long', year: 'numeric' })}
            </h3>
            
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(currentDate.getMonth() + 1);
                setCurrentDate(newDate);
              }}
              className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 bg-stone-100 dark:bg-stone-900 p-1 rounded-xl">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="text-center font-black text-stone-400 text-[10px] py-2 uppercase tracking-widest">
                {day}
              </div>
            ))}
            
            {monthDates.map(date => {
              const dateStr = date.toISOString().split('T')[0];
              const dayEntries = getEntriesForDate(dateStr, selectedUser);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              
              return (
                <div
                  key={dateStr}
                  className={`border rounded-lg p-2 min-h-[80px] text-xs transition-colors flex flex-col justify-between ${
                    !isCurrentMonth ? 'bg-stone-50 dark:bg-stone-900/30 text-stone-300 border-transparent' :
                    isToday ? 'bg-white dark:bg-stone-950 border-pink-500 dark:border-pink-500 border-2 shadow-md relative z-10' :
                    'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:border-stone-400'
                  }`}
                >
                  <div className={`font-black mb-1 ${isToday ? 'text-pink-600 dark:text-pink-400' : 'text-stone-900 dark:text-stone-100'}`}>
                    {date.getDate()}
                  </div>
                  <div className="flex flex-wrap gap-1 content-end">
                    {dayEntries.map(entry => (
                      <div
                        key={entry.id}
                        className={`w-2 h-2 rounded-full ${
                          entry.type === 'check_in' ? 'bg-stone-900 dark:bg-stone-100' :
                          entry.type === 'check_out' ? 'bg-stone-400 dark:bg-stone-600' :
                          entry.type === 'task' ? 'bg-pink-500' :
                          'bg-pink-300'
                        }`}
                        title={`${entry.type} - ${entry.time}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History View */}
      {viewMode === 'history' && (
        <div className="space-y-4 animate-fade-in">
           <div className="flex items-center justify-between mb-4">
             <h3 className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest">Historial Reciente</h3>
             <div className="flex items-center gap-2 text-xs text-stone-500">
               <Filter size={14} />
               <span>Últimos 30 días</span>
             </div>
           </div>

           <div className="space-y-2">
             {scheduleEntries && scheduleEntries
               .filter(e => (!selectedUser || e.user_id === selectedUser))
               .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
               .slice(0, 50)
               .map(entry => (
                 <div key={entry.id} className="flex items-center gap-4 p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg hover:shadow-sm transition-shadow">
                    <div className={`w-2 h-12 rounded-full ${
                       entry.type === 'check_in' ? 'bg-stone-900 dark:bg-stone-100' :
                       entry.type === 'check_out' ? 'bg-stone-400 dark:bg-stone-600' :
                       entry.type === 'task' ? 'bg-pink-500' :
                       'bg-pink-300'
                    }`} />
                    <div className="flex-1">
                       <div className="flex justify-between items-start">
                         <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm uppercase">
                           {entry.type === 'check_in' ? 'Entrada' : 
                            entry.type === 'check_out' ? 'Salida' : 
                            entry.details?.title || entry.type}
                         </h4>
                         <span className="text-xs font-mono text-stone-500">{entry.date} {entry.time}</span>
                       </div>
                       {entry.details?.description && (
                         <p className="text-xs text-stone-500 mt-1">{entry.details.description}</p>
                       )}
                    </div>
                    <button onClick={() => deleteEntry(entry.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-stone-300 hover:text-red-500 rounded transition-colors">
                      <Trash2 size={14} />
                    </button>
                 </div>
               ))
             }
             {(!scheduleEntries || scheduleEntries.length === 0) && (
               <div className="text-center py-12 text-stone-400 italic">No hay registros recientes</div>
             )}
           </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 dark:border-stone-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
                {editingEntry ? 'Editar' : 'Agregar'} {modalType === 'task' ? 'Tarea' : 'Evento'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-2 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
                <button
                  onClick={() => setModalType('task')}
                  className={`flex-1 py-3 px-4 rounded-lg font-black uppercase tracking-widest text-xs transition-all ${
                    modalType === 'task' 
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm' 
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Tarea
                </button>
                <button
                  onClick={() => setModalType('event')}
                  className={`flex-1 py-3 px-4 rounded-lg font-black uppercase tracking-widest text-xs transition-all ${
                    modalType === 'event' 
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm' 
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Evento
                </button>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-stone-500 ml-1">Título</label>
                <input
                  type="text"
                  placeholder="Ej: Limpieza general"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all placeholder:text-stone-300"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-stone-500 ml-1">Descripción</label>
                <textarea
                  placeholder="Detalles adicionales..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all placeholder:text-stone-300"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-stone-500 ml-1">Fecha</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-3 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-stone-500 ml-1">Hora</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full px-4 py-3 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-stone-500 ml-1">Asignar a</label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                  className="w-full px-4 py-3 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                >
                  {teamMembers?.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddEntry}
                  className="flex-1 py-4 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-xl font-black uppercase tracking-widest text-sm hover:opacity-90 transition-opacity shadow-lg"
                >
                  {editingEntry ? 'Guardar Cambios' : 'Agregar Entrada'}
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-4 bg-transparent border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
