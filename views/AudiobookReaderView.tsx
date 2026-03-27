import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Play, Pause, RotateCcw, Volume2, CheckCircle2, AlertCircle, Brain } from 'lucide-react';
import { audiobooksData, AudiobookChapter } from '../data/audiobooks';

interface Props {
  categoryId: string;
  chapterId: string;
  onBack: () => void;
}

export const AudiobookReaderView: React.FC<Props> = ({ categoryId, chapterId, onBack }) => {
  const [activeTab, setActiveTab] = useState<'reader' | 'quiz' | 'task'>('reader');
  const [isPlaying, setIsPlaying] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const category = audiobooksData.find(c => c.id === categoryId);
  const chapter = category?.chapters.find(c => c.id === chapterId);

  // Mock audio player logic (since we don't have real audio files)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (chapter) {
      synthRef.current = new SpeechSynthesisUtterance(chapter.content);
      synthRef.current.lang = 'es-ES';
      synthRef.current.rate = 0.9;
      
      synthRef.current.onend = () => {
        setIsPlaying(false);
      };
    }
    
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [chapter]);

  const togglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        window.speechSynthesis.speak(synthRef.current!);
      }
      setIsPlaying(true);
    }
  };

  const resetAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  if (!chapter || !category) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-stone-500">
        <p>Capítulo no encontrado.</p>
        <button onClick={onBack} className="mt-4 underline">Volver</button>
      </div>
    );
  }

  const handleQuizSubmit = () => {
    let score = 0;
    chapter.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in pb-20">
      {/* Header & Tabs Container - Sticky */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-all duration-200 pt-4">
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors mb-4"
          >
            <ChevronLeft size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Volver al Índice</span>
          </button>
          
          <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tighter uppercase mb-6">
            {chapter.title}
          </h2>

          <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-lg w-full max-w-md">
            {[
              { id: 'reader', label: 'Leer y Escuchar' },
              { id: 'quiz', label: 'Quiz' },
              { id: 'task', label: 'Tarea' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-md transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-stone-800 text-black dark:text-white shadow-sm' 
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        
        {/* READER TAB */}
        {activeTab === 'reader' && (
          <div className="space-y-8 animate-fade-in">
            {/* Audio Player Card */}
            <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center gap-6">
              <div className="flex items-center gap-4">
                <button 
                  onClick={togglePlay}
                  className="w-14 h-14 bg-brand rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand/30"
                >
                  {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
                </button>
                <button 
                  onClick={resetAudio}
                  className="p-3 bg-stone-800 rounded-full hover:bg-stone-700 transition-colors"
                  title="Reiniciar audio"
                >
                  <RotateCcw className="w-5 h-5 text-stone-300" />
                </button>
              </div>
              <div className="flex-1 w-full text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <Volume2 className="w-4 h-4 text-brand" />
                  <span className="text-xs font-bold uppercase tracking-widest text-brand">Audiobook</span>
                </div>
                <p className="text-sm text-stone-400">Escucha la narración de este capítulo. Duración aprox: {chapter.duration}</p>
              </div>
            </div>

            {/* Text Content */}
            <div className="prose prose-stone dark:prose-invert max-w-none">
              {chapter.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="text-base md:text-lg leading-relaxed text-stone-700 dark:text-stone-300 mb-6">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* QUIZ TAB */}
        {activeTab === 'quiz' && (
          <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Comprueba tu aprendizaje</h3>
              <p className="text-stone-500 text-sm">Responde estas preguntas basadas en el capítulo.</p>
            </div>

            {chapter.quiz.map((q, qIdx) => (
              <div key={qIdx} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 md:p-8">
                <p className="font-bold text-lg mb-6">{qIdx + 1}. {q.question}</p>
                <div className="space-y-3">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = quizAnswers[qIdx] === oIdx;
                    const isCorrect = q.correctAnswer === oIdx;
                    
                    let btnClass = "w-full text-left p-4 rounded-xl border transition-all duration-200 ";
                    
                    if (!quizSubmitted) {
                      btnClass += isSelected 
                        ? "border-brand bg-brand/5 text-brand dark:text-brand-light" 
                        : "border-stone-200 dark:border-stone-700 hover:border-stone-400";
                    } else {
                      if (isCorrect) {
                        btnClass += "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400";
                      } else if (isSelected && !isCorrect) {
                        btnClass += "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400";
                      } else {
                        btnClass += "border-stone-200 dark:border-stone-800 opacity-50";
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={quizSubmitted}
                        onClick={() => setQuizAnswers({...quizAnswers, [qIdx]: oIdx})}
                        className={btnClass}
                      >
                        <div className="flex justify-between items-center">
                          <span>{opt}</span>
                          {quizSubmitted && isCorrect && <CheckCircle2 className="text-emerald-500 w-5 h-5" />}
                          {quizSubmitted && isSelected && !isCorrect && <AlertCircle className="text-rose-500 w-5 h-5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {!quizSubmitted ? (
              <button
                onClick={handleQuizSubmit}
                disabled={Object.keys(quizAnswers).length < chapter.quiz.length}
                className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Revisar Respuestas
              </button>
            ) : (
              <div className={`p-6 rounded-2xl text-center border ${quizScore === chapter.quiz.length ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800'}`}>
                <h4 className="text-xl font-black mb-2">
                  Puntuación: {quizScore} de {chapter.quiz.length}
                </h4>
                <p>
                  {quizScore === chapter.quiz.length 
                    ? '¡Excelente! Has dominado este tema.' 
                    : 'Buen intento. Te recomendamos repasar el capítulo y volver a intentarlo.'}
                </p>
                <button
                  onClick={() => {
                    setQuizSubmitted(false);
                    setQuizAnswers({});
                  }}
                  className="mt-6 px-6 py-2 bg-white dark:bg-stone-800 border border-current rounded-lg font-bold text-sm hover:opacity-80 transition-opacity"
                >
                  Intentar de nuevo
                </button>
              </div>
            )}
          </div>
        )}

        {/* TASK TAB */}
        {activeTab === 'task' && (
          <div className="space-y-8 animate-fade-in max-w-2xl mx-auto mt-8">
            <div className="bg-brand/10 border-2 border-brand/30 rounded-3xl p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-brand text-white rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-6">Misión Práctica</h3>
              <p className="text-lg text-stone-700 dark:text-stone-300 leading-relaxed bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm">
                {chapter.task}
              </p>
              <div className="mt-8 text-sm text-stone-500 font-medium">
                Completa esta tarea en tu entorno de trabajo para consolidar lo aprendido en este capítulo.
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};


