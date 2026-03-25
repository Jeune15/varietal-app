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
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'task' | 'event'>('task');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
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
    if (!formData.title || !formData.date || !formData.endDate) {
      showToast('Completa todos los campos', 'error');
      return;
    }

    if (editingEntry) {
      await saveEdit();
      return;
    }

    const entry: ScheduleEntry = {
      id: crypto.randomUUID(),
      user_id: formData.user_id,
      type: 'event',
      date: formData.date,
      endDate: formData.endDate,
      time: '00:00', // Time is no longer used for events, but required by interface
      details: {
        title: formData.title,
        description: formData.description
      }
    };

    await db.scheduleEntries.add(entry);
    await syncToCloud('scheduleEntries', entry);
    setShowAddModal(false);
    setFormData({ title: '', description: '', date: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], user_id: 'isai' });
    showToast('Evento agregado ✓', 'success');
  };

  const [selectedDayEntries, setSelectedDayEntries] = useState<{ date: string; entries: ScheduleEntry[] } | null>(null);

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
    if (!scheduleEntries) return [];
    
    // Convert to Date object once for comparisons
    const currentDate = new Date(date);
    currentDate.setHours(0,0,0,0);
    
    return scheduleEntries
      .filter(entry => {
        // Filter by user if specified
        if (userId && entry.user_id !== userId) return false;

        // For check_in/check_out, match exact date
        if (entry.type !== 'event') {
          return entry.date === date;
        }
        
        // For events, check if current date is between start and end dates (inclusive)
        const eventStart = new Date(entry.date);
        eventStart.setHours(0,0,0,0);
        
        const eventEnd = entry.endDate ? new Date(entry.endDate) : eventStart;
        eventEnd.setHours(0,0,0,0);
        
        return currentDate >= eventStart && currentDate <= eventEnd;
      })
      .sort((a, b) => {
        // For events that span multiple days, put them at the top
        if (a.type === 'event' && b.type !== 'event') return -1;
        if (a.type !== 'event' && b.type === 'event') return 1;
        
        // Then sort by time
        return a.time.localeCompare(b.time);
      });
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
    setModalType('event');
    setFormData({
      title: entry.details?.title || '',
      description: entry.details?.description || '',
      date: entry.date,
      endDate: entry.endDate || entry.date,
      user_id: entry.user_id
    });
    setShowAddModal(true);
  };

  const saveEdit = async () => {
    if (!editingEntry) return;
    const updates = {
      type: 'event' as const,
      date: formData.date,
      endDate: formData.endDate,
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

  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-white dark:bg-stone-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white">Bienvenido</h1>
            <p className="text-sm text-stone-500 uppercase tracking-widest">¿Quién está ingresando?</p>
          </div>

          <div className="grid gap-4">
            <button
              onClick={() => setSelectedUser('alejandro')}
              className="group relative overflow-hidden bg-stone-100 dark:bg-stone-900 rounded-2xl p-6 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">Alejhandro</h3>
                  <p className="text-xs text-stone-500 uppercase tracking-widest mt-1">Seleccionar</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white dark:bg-stone-800 flex items-center justify-center shadow-sm">
                  <User className="w-6 h-6 text-brand" />
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedUser('anthony')}
              className="group relative overflow-hidden bg-stone-100 dark:bg-stone-900 rounded-2xl p-6 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">Anthony</h3>
                  <p className="text-xs text-stone-500 uppercase tracking-widest mt-1">Seleccionar</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white dark:bg-stone-800 flex items-center justify-center shadow-sm">
                  <User className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </button>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="w-full py-4 text-xs font-bold text-stone-400 uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver al inicio
            </button>
          )}
        </div>
      </div>
    );
  }

  const getTodayEntries = () => {
    if (!scheduleEntries || !selectedUser) return [];
    const today = new Date().toISOString().split('T')[0];
    return scheduleEntries.filter(e => e.date === today && e.user_id === selectedUser);
  };

  const handleQuickCheck = async (type: 'check_in' | 'check_out') => {
    if (!selectedUser) return;
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);
    
    const newEntry: ScheduleEntry = {
      id: `${selectedUser}_${date}_${time}_${type}`,
      user_id: selectedUser,
      type,
      date,
      time,
      details: {}
    };

    await db.scheduleEntries.add(newEntry);
    await syncToCloud('scheduleEntries', newEntry);
    if (type === 'check_out') {
      localStorage.setItem(`last_checkout_${selectedUser}_${date}`, time);
    }
    showToast(type === 'check_in' ? 'Ingreso registrado' : 'Salida registrada', 'success');
  };

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
          <p className="text-stone-600 dark:text-stone-400 text-sm font-bold uppercase tracking-widest">
            Hola, {selectedUser === 'alejandro' ? 'Alejhandro' : selectedUser === 'anthony' ? 'Anthony' : 'Isai'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Check In/Out Buttons */}
          <div className="flex gap-2 bg-stone-100 dark:bg-stone-900 p-1 rounded-lg">
            <button
              onClick={() => handleQuickCheck('check_in')}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white dark:bg-stone-800 text-emerald-600 dark:text-emerald-400 shadow-sm rounded transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Marcar Ingreso
            </button>
            <button
              onClick={() => handleQuickCheck('check_out')}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white dark:bg-stone-800 text-rose-600 dark:text-rose-400 shadow-sm rounded transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Marcar Salida
            </button>
          </div>

          <div className="h-8 w-px bg-stone-200 dark:bg-stone-800 hidden sm:block"></div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingEntry(null);
                setFormData({ title: '', description: '', date: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], user_id: selectedUser || 'isai' });
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
      </div>

      {/* View Mode & Hours Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg">
          {['month', 'week'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                viewMode === mode
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              {mode === 'month' ? 'Mes' : 'Semana'}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-900/30 rounded-lg p-5 transition-transform hover:-translate-y-1 duration-300 min-w-[140px]">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-pink-500" />
              <h4 className="font-black text-pink-900 dark:text-pink-100 text-xs uppercase tracking-widest">Semanal</h4>
            </div>
            <p className="text-4xl font-black text-pink-600 dark:text-pink-400">{hoursData.weekly.toFixed(1)}h</p>
          </div>
          
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-5 transition-transform hover:-translate-y-1 duration-300 min-w-[140px]">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-stone-400" />
              <h4 className="font-black text-stone-900 dark:text-stone-100 text-xs uppercase tracking-widest">Mensual</h4>
            </div>
            <p className="text-4xl font-black text-stone-900 dark:text-stone-100">{hoursData.monthly.toFixed(1)}h</p>
          </div>
        </div>
      </div>

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
                        if (entry.type === 'event') { borderClass = 'border-l-pink-500'; bgClass = 'bg-pink-50/50 dark:bg-pink-900/10'; }

                        return (
                          <div
                            key={entry.id}
                            className={`p-2 rounded-lg text-xs ${bgClass} border border-stone-100 dark:border-stone-800 border-l-4 ${borderClass} transition-all hover:shadow-sm`}
                          >
                            <div className="flex justify-between items-center cursor-pointer gap-2" onClick={() => toggleExpand(entry.id)}>
                              <span className="font-bold truncate flex-1">{nameLabel}</span>
                              <span className="font-mono opacity-60 text-[10px]">{entry.type !== 'event' && entry.time}</span>
                            </div>
                            {isExpanded && (
                              <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 space-y-2">
                                {entry.details?.description && <div className="italic">{entry.details.description}</div>}
                                {entry.type === 'event' && (
                                  <div className="text-[10px] font-bold mt-1 text-pink-600 dark:text-pink-400">
                                    {entry.date} al {entry.endDate || entry.date}
                                  </div>
                                )}
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
                  onClick={() => {
                    if (dayEntries.length > 0) {
                      setSelectedDayEntries({ date: dateStr, entries: dayEntries });
                    }
                  }}
                  className={`border rounded-lg p-2 min-h-[80px] text-xs transition-colors flex flex-col justify-between cursor-pointer ${
                    !isCurrentMonth ? 'bg-stone-50 dark:bg-stone-900/30 text-stone-300 border-transparent' :
                    isToday ? 'bg-white dark:bg-stone-950 border-pink-500 dark:border-pink-500 border-2 shadow-md relative z-10' :
                    'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:border-stone-400'
                  }`}
                >
                  <div className={`font-black mb-1 ${isToday ? 'text-pink-600 dark:text-pink-400' : 'text-stone-900 dark:text-stone-100'}`}>
                    {date.getDate()}
                  </div>
                  <div className="flex flex-col gap-1 content-end h-full justify-end mt-2">
                    {dayEntries.map(entry => {
                      const userColor = entry.user_id === 'alejandro' ? 'bg-brand' : entry.user_id === 'anthony' ? 'bg-blue-500' : 'bg-stone-500';
                      
                      if (entry.type === 'event') {
                        return (
                          <div 
                            key={entry.id} 
                            className="w-full px-1 py-0.5 rounded text-[8px] font-bold text-white bg-pink-500 truncate"
                            title={entry.details?.title}
                          >
                            {entry.details?.title || 'Evento'}
                          </div>
                        );
                      }
                      
                      // Check in/out dots
                      return (
                        <div key={entry.id} className="flex items-center gap-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              entry.type === 'check_in' ? userColor : 'bg-transparent border border-current ' + userColor.replace('bg-', 'text-')
                            }`}
                            title={`${entry.type === 'check_in' ? 'Entrada' : 'Salida'} - ${entry.time}`}
                          />
                          <span className="text-[8px] font-mono text-stone-500 scale-75 origin-left">{entry.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}



      {/* Day Summary Modal */}
      {selectedDayEntries && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setSelectedDayEntries(null)}>
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto shadow-2xl border border-stone-200 dark:border-stone-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-stone-900 dark:text-stone-100">
                  Resumen del Día
                </h3>
                <p className="text-sm font-bold text-pink-500 uppercase tracking-widest mt-1">
                  {new Date(selectedDayEntries.date + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <button onClick={() => setSelectedDayEntries(null)} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {selectedDayEntries.entries.map(entry => {
                const isEvent = entry.type === 'event';
                const userColor = entry.user_id === 'alejandro' ? 'bg-brand text-white' : entry.user_id === 'anthony' ? 'bg-blue-500 text-white' : 'bg-stone-500 text-white';
                const userName = entry.user_id.charAt(0).toUpperCase() + entry.user_id.slice(1);
                
                return (
                  <div key={entry.id} className={`p-4 rounded-xl border ${isEvent ? 'border-pink-200 bg-pink-50 dark:border-pink-900/30 dark:bg-pink-900/10' : 'border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950'} relative overflow-hidden group`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {isEvent ? (
                          <span className="px-2 py-1 bg-pink-500 text-white text-[10px] font-black uppercase tracking-widest rounded">Evento</span>
                        ) : (
                          <span className={`px-2 py-1 ${userColor} text-[10px] font-black uppercase tracking-widest rounded`}>
                            {userName}
                          </span>
                        )}
                        {!isEvent && (
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${entry.type === 'check_in' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {entry.type === 'check_in' ? 'Entrada' : 'Salida'}
                          </span>
                        )}
                      </div>
                      {!isEvent && <span className="font-mono text-xs font-bold opacity-70">{entry.time}</span>}
                    </div>
                    
                    {isEvent ? (
                      <div>
                        <h4 className="font-black text-lg text-stone-900 dark:text-stone-100">{entry.details?.title}</h4>
                        {entry.details?.description && (
                          <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">{entry.details.description}</p>
                        )}
                        <div className="mt-3 pt-3 border-t border-pink-200/50 dark:border-pink-900/30 flex gap-4 text-xs font-bold text-stone-500">
                          <span>Del: {entry.date}</span>
                          <span>Al: {entry.endDate || entry.date}</span>
                        </div>
                      </div>
                    ) : null}

                    {/* Acciones Rápidas (Editar/Eliminar) */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                       <button onClick={() => { setSelectedDayEntries(null); startEdit(entry); }} className="p-1.5 bg-white dark:bg-stone-800 rounded shadow hover:text-pink-500 transition-colors">
                         <Edit size={14} />
                       </button>
                       <button onClick={() => { setSelectedDayEntries(null); deleteEntry(entry.id); }} className="p-1.5 bg-white dark:bg-stone-800 rounded shadow text-rose-500 hover:bg-rose-50 transition-colors">
                         <Trash2 size={14} />
                       </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 dark:border-stone-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase tracking-widest text-stone-900 dark:text-stone-100">
                {editingEntry ? 'Editar Evento' : 'Agregar Evento'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
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
                  <label className="text-xs font-black uppercase tracking-widest text-stone-500 ml-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-3 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-stone-500 ml-1">Fecha Fin</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    min={formData.date}
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
