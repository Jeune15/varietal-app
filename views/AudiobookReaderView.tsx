import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, CheckCircle2, AlertCircle, Brain } from 'lucide-react';
import { audiobooksData } from '../data/audiobooks';

interface Props {
  categoryId: string;
  chapterId: string;
  onSelectChapter: (chapterId: string) => void;
  onBack: () => void;
}

export const AudiobookReaderView: React.FC<Props> = ({ categoryId, chapterId, onSelectChapter, onBack }) => {
  const [activeTab, setActiveTab] = useState<'reader' | 'quiz' | 'task'>('reader');
  const [isPlaying, setIsPlaying] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [seekValue, setSeekValue] = useState(0);

  const category = audiobooksData.find(c => c.id === categoryId);
  const chapter = category?.chapters.find(c => c.id === chapterId);

  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textRef = useRef<string>('');
  const offsetRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);

  // Pick the best voice: prefer a male Spanish/English voice
  const pickVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.filter(v => v.lang.toLowerCase().startsWith('es'));
    const maleKeywords = ['male', 'jorge', 'alvaro', 'pablo', 'diego', 'miguel', 'david', 'james', 'daniel', 'mark', 'tom', 'alex', 'google español masculino'];
    const maleVoice = preferred.find(v => maleKeywords.some(k => v.name.toLowerCase().includes(k)));
    return maleVoice || preferred[0] || null;
  };

  const buildUtterance = (startIndex: number) => {
    const fullText = textRef.current || '';
    const total = fullText.length || 1;
    const safeStart = Math.max(0, Math.min(startIndex, total));
    const remaining = fullText.slice(safeStart);
    const utter = new SpeechSynthesisUtterance(remaining);
    utter.lang = 'es-ES';
    utter.rate = 0.78;
    utter.pitch = 0.85;
    utter.volume = 1.0;

    const applyVoice = () => {
      const voice = pickVoice();
      if (voice) utter.voice = voice;
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      applyVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = applyVoice;
    }

    utter.onboundary = (e: any) => {
      if (typeof e?.charIndex !== 'number') return;
      const absoluteIndex = safeStart + e.charIndex;
      const progress = Math.max(0, Math.min(1, absoluteIndex / total));
      offsetRef.current = absoluteIndex;
      if (!isSeekingRef.current) setSeekValue(progress);
    };

    utter.onend = () => {
      setIsPlaying(false);
      setSeekValue(1);
      offsetRef.current = total;
    };

    synthRef.current = utter;
  };

  const commitSeek = (progress: number) => {
    const fullText = textRef.current || '';
    const total = fullText.length || 1;
    const nextIndex = Math.max(0, Math.min(total, Math.floor(progress * total)));
    offsetRef.current = nextIndex;

    const wasPlaying = isPlaying;
    window.speechSynthesis.cancel();
    buildUtterance(nextIndex);
    setSeekValue(nextIndex / total);
    isSeekingRef.current = false;

    if (wasPlaying && synthRef.current) {
      window.speechSynthesis.speak(synthRef.current);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const playFromCurrentOffset = () => {
    const fullText = textRef.current || '';
    if (offsetRef.current >= fullText.length) {
      offsetRef.current = 0;
      setSeekValue(0);
    }

    window.speechSynthesis.cancel();
    buildUtterance(offsetRef.current);

    if (synthRef.current) {
      window.speechSynthesis.speak(synthRef.current);
      setIsPlaying(true);
    }
  };

  // Rebuild utterance whenever chapter changes
  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);

    if (!chapter) return;

    textRef.current = chapter.content;
    offsetRef.current = 0;
    setSeekValue(0);
    isSeekingRef.current = false;
    buildUtterance(0);

    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [chapterId]);

  const togglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (isSeekingRef.current) {
        commitSeek(seekValue);
        playFromCurrentOffset();
        return;
      }

      if (window.speechSynthesis.paused && window.speechSynthesis.speaking) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        playFromCurrentOffset();
      }
    }
  };

  const resetAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    offsetRef.current = 0;
    setSeekValue(0);
    buildUtterance(0);
  };

  if (!chapter || !category) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-stone-500">
        <p>Capítulo no encontrado.</p>
        <button onClick={onBack} className="mt-4 underline">Volver</button>
      </div>
    );
  }

  const displayTitle = chapter.title;
  const displayContent = chapter.content;
  const displayQuiz = chapter.quiz;
  const displayTask = chapter.task;
  const chapterNumber = Math.max(1, category.chapters.findIndex(c => c.id === chapter.id) + 1);
  const chapterDurationSeconds = (() => {
    const [mins, secs] = chapter.duration.split(':').map(Number);
    if (!Number.isFinite(mins) || !Number.isFinite(secs)) return 0;
    return mins * 60 + secs;
  })();
  const elapsedSeconds = Math.max(0, Math.round(chapterDurationSeconds * seekValue));
  const remainingSeconds = Math.max(0, Math.round(chapterDurationSeconds * (1 - seekValue)));
  const remainingMinutes = Math.max(0, Math.ceil(remainingSeconds / 60));
  const formatTime = (totalSeconds: number) => {
    const safe = Math.max(0, totalSeconds);
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleQuizSubmit = () => {
    let score = 0;
    displayQuiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) score++;
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const tabs = [{ id: 'reader', label: 'Leer y Escuchar' }, { id: 'quiz', label: 'Quiz' }, { id: 'task', label: 'Tarea' }];

  return (
    <div className="min-h-screen flex flex-col animate-fade-in pb-40">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              title="Volver al índice"
            >
              <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            </button>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-black dark:text-white tracking-tighter uppercase mb-5 leading-tight">
            {displayTitle}
          </h2>

          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand text-brand'
                    : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-4 border-t border-stone-200 dark:border-stone-800 py-4">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">
              <span>{formatTime(elapsedSeconds)}</span>
              <span>{formatTime(chapterDurationSeconds)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1000}
              step={1}
              value={Math.round(seekValue * 1000)}
              onChange={(e) => {
                const v = Number(e.target.value) / 1000;
                isSeekingRef.current = true;
                setSeekValue(v);
              }}
              onMouseUp={() => commitSeek(seekValue)}
              onPointerUp={() => commitSeek(seekValue)}
              onTouchEnd={() => commitSeek(seekValue)}
              onBlur={() => {
                if (isSeekingRef.current) commitSeek(seekValue);
              }}
              onKeyUp={(e) => {
                if (e.key === 'Enter') commitSeek(seekValue);
              }}
              className="w-full accent-black dark:accent-white"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">

        {/* READER TAB */}
        {activeTab === 'reader' && (
          <div className="space-y-8 animate-fade-in">
            {/* Text Content */}
            <div className="prose prose-stone dark:prose-invert max-w-none">
              {displayContent.split('\n\n').map((paragraph, idx) => (
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
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2">
                Comprueba tu aprendizaje
              </h3>
              <p className="text-stone-500 text-sm">
                Responde estas preguntas basadas en el capítulo.
              </p>
            </div>

            {displayQuiz.map((q, qIdx) => (
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
                        onClick={() => setQuizAnswers({ ...quizAnswers, [qIdx]: oIdx })}
                        className={btnClass}
                      >
                        <div className="flex justify-between items-center">
                          <span>{opt}</span>
                          {quizSubmitted && isCorrect && <CheckCircle2 className="text-emerald-500 w-5 h-5 flex-none" />}
                          {quizSubmitted && isSelected && !isCorrect && <AlertCircle className="text-rose-500 w-5 h-5 flex-none" />}
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
                disabled={Object.keys(quizAnswers).length < displayQuiz.length}
                className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Revisar respuestas
              </button>
            ) : (
              <div className={`p-6 rounded-2xl text-center border ${quizScore === displayQuiz.length ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800'}`}>
                <h4 className="text-xl font-black mb-2">
                  Puntuación: {quizScore} / {displayQuiz.length}
                </h4>
                <p>
                  {quizScore === displayQuiz.length
                    ? '¡Excelente! Has dominado este tema.'
                    : 'Buen intento. Te recomendamos repasar el capítulo.'}
                </p>
                <button
                  onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
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
              <h3 className="text-2xl font-black uppercase tracking-tight mb-6">
                Misión práctica
              </h3>
              <p className="text-lg text-stone-700 dark:text-stone-300 leading-relaxed bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm">
                {displayTask}
              </p>
              <div className="mt-8 text-sm text-stone-500 font-medium">
                Completa esta tarea en tu entorno de trabajo para consolidar lo aprendido en este capítulo.
              </div>
            </div>
          </div>
        )}

      </div>

      <div className="fixed left-0 right-0 bottom-0 z-[220]">
        <div className="border-t border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md shadow-xl px-5 py-4">
          <div className="text-center max-w-7xl mx-auto">
            <p className="text-lg md:text-xl font-black text-stone-900 dark:text-stone-100">
              Capítulo {chapterNumber}
            </p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
              {remainingMinutes} min restantes | {Math.round(seekValue * 100)}%
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={togglePlay}
                className="w-11 h-11 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <button
                onClick={resetAudio}
                className="w-11 h-11 rounded-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
                title="Volver a escuchar"
              >
                <RotateCcw className="w-4.5 h-4.5 text-stone-500 dark:text-stone-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
