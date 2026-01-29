import React, { useState } from 'react';
import { 
  Eye, 
  Trash2, 
  Award, 
  AlertCircle, 
  X, 
  CheckCircle 
} from 'lucide-react';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface HistoryRecord {
  id: string;
  date: string;
  studentName: string;
  examTitle: string;
  score: number;
  passed: boolean;
  answers: number[];
  questions: Question[];
}

export const HistoryDetailModal: React.FC<{ record: HistoryRecord; onClose: () => void }> = ({ record, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 dark:border-stone-800">
        <div className="sticky top-0 bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 p-6 flex items-center justify-between z-10">
          <div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">{record.examTitle}</h3>
            <p className="text-sm text-stone-500">Alumno: {record.studentName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-stone-500 dark:text-stone-400" />
          </button>
        </div>
        
        <div className="p-6 space-y-8">
           <div className={`p-4 rounded-lg flex items-center justify-between ${record.passed ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
              <div className="flex items-center gap-3">
                 {record.passed ? <Award className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                 <div>
                    <p className="font-bold text-lg">{record.passed ? 'Aprobado' : 'No Aprobado'}</p>
                    <p className="text-xs opacity-80">{new Date(record.date).toLocaleDateString()} - {new Date(record.date).toLocaleTimeString()}</p>
                 </div>
              </div>
              <p className="text-3xl font-black">{record.score.toFixed(0)}%</p>
           </div>

           <div className="space-y-6">
              <h4 className="font-bold text-stone-900 dark:text-stone-100 uppercase tracking-widest text-xs border-b border-stone-100 dark:border-stone-800 pb-2">Revisión de Respuestas</h4>
              {record.questions.map((q, idx) => {
                const userAnswer = record.answers[idx];
                const isCorrect = userAnswer === q.correctAnswer;
                return (
                  <div key={idx} className={`p-4 rounded-lg border ${isCorrect ? 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50' : 'border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10'}`}>
                     <p className="font-bold text-sm text-stone-800 dark:text-stone-200 mb-3">{idx + 1}. {q.text}</p>
                     <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                           <div key={optIdx} className={`text-xs px-3 py-2 rounded flex items-center justify-between ${
                              optIdx === q.correctAnswer 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-bold'
                                : optIdx === userAnswer 
                                   ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                                   : 'text-stone-500 dark:text-stone-500'
                           }`}>
                              <span>{opt}</span>
                              {optIdx === q.correctAnswer && <CheckCircle className="w-4 h-4" />}
                              {optIdx === userAnswer && optIdx !== q.correctAnswer && <X className="w-4 h-4" />}
                           </div>
                        ))}
                     </div>
                  </div>
                )
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

export const ActivityHistory: React.FC<{ 
  history: HistoryRecord[]; 
  onDelete?: (id: string) => void 
}> = ({ history, onDelete }) => {
  const [selectedHistory, setSelectedHistory] = useState<HistoryRecord | null>(null);

  if (history.length === 0) {
    return (
        <div className="border border-dashed border-stone-300 dark:border-stone-700 p-8 text-center rounded-lg bg-stone-50 dark:bg-stone-900/50">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Sin actividad reciente</p>
        </div>
    );
  }

  return (
    <>
      {/* Desktop View: Table */}
      <div className="hidden lg:block overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800">
        <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
                <tr>
                    <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-widest text-xs">Fecha</th>
                    <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-widest text-xs">Alumno</th>
                    <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-widest text-xs">Examen</th>
                    <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-widest text-xs text-center">Nota</th>
                    <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-widest text-xs text-right">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-stone-900">
                {history.map((record) => (
                    <tr key={record.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                        <td className="px-6 py-4 text-stone-600 dark:text-stone-400 whitespace-nowrap">
                            {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-stone-900 dark:text-stone-100">
                            {record.studentName}
                        </td>
                        <td className="px-6 py-4 text-stone-600 dark:text-stone-400">
                            {record.examTitle}
                        </td>
                        <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${record.passed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {record.score.toFixed(0)}%
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <button 
                                    onClick={() => setSelectedHistory(record)}
                                    className="p-2 text-stone-400 hover:text-black dark:hover:text-white transition-colors"
                                    title="Ver detalles"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                {onDelete && (
                                  <button 
                                      onClick={() => onDelete(record.id)}
                                      className="p-2 text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                      title="Eliminar"
                                  >
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Mobile View: Cards */}
      <div className="lg:hidden space-y-4">
        {history.map((record) => (
            <div key={record.id} className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-4 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">
                            {new Date(record.date).toLocaleDateString()}
                        </p>
                        <h4 className="font-bold text-stone-900 dark:text-stone-100">
                            {record.examTitle}
                        </h4>
                        <p className="text-sm text-stone-600 dark:text-stone-400">
                            {record.studentName}
                        </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${record.passed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {record.score.toFixed(0)}%
                    </span>
                </div>
                
                <div className="flex justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                    <button 
                        onClick={() => setSelectedHistory(record)}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-black dark:hover:text-white"
                    >
                        <Eye className="w-3 h-3" /> Ver Detalles
                    </button>
                    {onDelete && (
                      <button 
                          onClick={() => onDelete(record.id)}
                          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-700"
                      >
                          <Trash2 className="w-3 h-3" /> Eliminar
                      </button>
                    )}
                </div>
            </div>
        ))}
      </div>

      {selectedHistory && (
        <HistoryDetailModal record={selectedHistory} onClose={() => setSelectedHistory(null)} />
      )}
    </>
  );
};
