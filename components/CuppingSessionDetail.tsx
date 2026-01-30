import React, { useState } from 'react';
import { X, Calendar, User, Coffee, ChevronDown, ChevronUp } from 'lucide-react';
import { CuppingSession, CuppingForm, FreeCuppingSample } from '../types';

interface Props {
  session: CuppingSession;
  onClose: () => void;
}

const ScoreDisplay: React.FC<{ 
  label: string; 
  value: number; 
  notes?: string; 
  descriptors?: string[];
}> = ({ label, value, notes, descriptors }) => (
  <div className="bg-stone-50 dark:bg-stone-800 p-3 rounded-lg space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-xs font-black uppercase tracking-widest text-stone-500 dark:text-stone-400">{label}</span>
      <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{value.toFixed(2)}</span>
    </div>
    
    {/* Bar indicator */}
    <div className="h-1.5 w-full bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
      <div 
        className="h-full bg-stone-900 dark:bg-stone-100" 
        style={{ width: `${(value / 10) * 100}%` }}
      />
    </div>

    {descriptors && descriptors.length > 0 && (
      <div className="flex flex-wrap gap-1 mt-1">
        {descriptors.map(d => (
          <span key={d} className="text-[10px] px-1.5 py-0.5 bg-stone-200 dark:bg-stone-700 rounded text-stone-700 dark:text-stone-300">
            {d}
          </span>
        ))}
      </div>
    )}

    {notes && (
      <p className="text-xs text-stone-600 dark:text-stone-400 italic border-l-2 border-stone-300 dark:border-stone-600 pl-2 mt-1">
        "{notes}"
      </p>
    )}
  </div>
);

const FormDetail: React.FC<{ form: CuppingForm }> = ({ form }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScoreDisplay label="Fragancia" value={form.fragranceIntensity} notes={form.fragranceNotes} descriptors={form.fragranceDescriptors} />
        <ScoreDisplay label="Aroma" value={form.aromaIntensity} notes={form.aromaNotes} descriptors={form.aromaDescriptors} />
        <ScoreDisplay label="Sabor" value={form.flavorIntensity} notes={form.flavorNotes} descriptors={form.flavorDescriptors} />
        <ScoreDisplay label="Sabor Residual" value={form.aftertasteIntensity} notes={form.aftertasteNotes} descriptors={form.aftertasteDescriptors} />
        <ScoreDisplay label="Acidez" value={form.acidityIntensity} notes={form.acidityNotes} />
        <ScoreDisplay label="Dulzor" value={form.sweetnessIntensity} notes={form.sweetnessNotes} />
        <ScoreDisplay label="Cuerpo" value={form.mouthfeelIntensity} notes={form.mouthfeelNotes} descriptors={form.mouthfeelDescriptors} />
      </div>
    </div>
  );
};

const SampleCard: React.FC<{ sample: FreeCuppingSample; index: number }> = ({ sample, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-stone-500">
            {index + 1}
          </div>
          <div className="text-left">
            <h4 className="font-bold text-stone-900 dark:text-stone-100">{sample.brand}</h4>
            <p className="text-xs text-stone-500">{sample.variety} • {sample.process}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
      </button>
      
      {expanded && (
        <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="mb-4 grid grid-cols-2 gap-4 text-xs text-stone-500">
            <div>
              <span className="font-bold block">Origen:</span> {sample.origin || '-'}
            </div>
            <div>
              <span className="font-bold block">Tueste:</span> {sample.roastType || '-'}
            </div>
            <div>
              <span className="font-bold block">Fecha Tueste:</span> {sample.roastDate || '-'}
            </div>
            <div>
              <span className="font-bold block">Días Reposo:</span> {sample.restDays || '-'}
            </div>
          </div>
          
          {sample.notes && (
             <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-200 text-xs rounded border border-amber-100 dark:border-amber-900/30">
               <span className="font-bold mr-1">Notas generales:</span> {sample.notes}
             </div>
          )}

          <FormDetail form={sample.form} />
        </div>
      )}
    </div>
  );
};

export const SessionDetailModal: React.FC<Props> = ({ session, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-950 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex justify-between items-start bg-white dark:bg-stone-900">
          <div>
            <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight mb-2">
              Resumen de Sesión
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-stone-500">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>{session.tasterName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{new Date(session.date).toLocaleDateString()} {new Date(session.date).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {session.sessionType === 'free' ? (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-4">Muestras Evaluadas</h3>
              {session.samples?.map((sample, idx) => (
                <SampleCard key={sample.id || idx} sample={sample} index={idx} />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
               <div className="bg-stone-50 dark:bg-stone-900 p-4 rounded-lg border border-stone-200 dark:border-stone-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Coffee className="w-5 h-5 text-stone-400" />
                    <h3 className="font-bold text-lg">{session.coffeeName}</h3>
                  </div>
                  <p className="text-stone-500">{session.clientName}</p>
                  {session.objective && (
                    <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-800">
                      <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Objetivo</span>
                      <p className="mt-1">{session.objective}</p>
                    </div>
                  )}
               </div>
               
               {session.form && <FormDetail form={session.form} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
