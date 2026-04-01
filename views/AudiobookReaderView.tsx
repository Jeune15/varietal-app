import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Play, Pause, RotateCcw, Volume2, CheckCircle2, AlertCircle, Brain, Globe } from 'lucide-react';
import { audiobooksData } from '../data/audiobooks';

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
  const [lang, setLang] = useState<'es' | 'en'>('es');

  const category = audiobooksData.find(c => c.id === categoryId);
  const chapter = category?.chapters.find(c => c.id === chapterId);

  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Pick the best voice: prefer a male Spanish/English voice
  const pickVoice = (language: 'es' | 'en'): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    const langCode = language === 'es' ? 'es' : 'en';
    // Prefer: male-sounding names, then any matching language
    const preferred = voices.filter(v => v.lang.startsWith(langCode));
    const maleKeywords = ['male', 'jorge', 'alvaro', 'pablo', 'diego', 'miguel', 'david', 'james', 'daniel', 'mark', 'tom', 'alex', 'google español masculino'];
    const maleVoice = preferred.find(v => maleKeywords.some(k => v.name.toLowerCase().includes(k)));
    return maleVoice || preferred[0] || null;
  };

  // Rebuild utterance whenever chapter or language changes
  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);

    if (!chapter) return;

    const text = lang === 'en' && chapter.contentEn ? chapter.contentEn : chapter.content;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === 'es' ? 'es-ES' : 'en-US';
    utter.rate = 0.78;
    utter.pitch = 0.85;
    utter.volume = 1.0;

    // Wait for voices to load (Chrome async voices)
    const applyVoice = () => {
      const voice = pickVoice(lang);
      if (voice) utter.voice = voice;
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      applyVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = applyVoice;
    }

    utter.onend = () => setIsPlaying(false);
    synthRef.current = utter;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [chapter, lang]);

  // Reset quiz when language changes
  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  }, [lang]);

  const togglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        if (synthRef.current) window.speechSynthesis.speak(synthRef.current);
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

  // Language-aware content
  const displayTitle = lang === 'en' && chapter.titleEn ? chapter.titleEn : chapter.title;
  const displayContent = lang === 'en' && chapter.contentEn ? chapter.contentEn : chapter.content;
  const displayQuiz = lang === 'en' && chapter.quizEn ? chapter.quizEn : chapter.quiz;
  const displayTask = lang === 'en' && chapter.taskEn ? chapter.taskEn : chapter.task;

  const handleQuizSubmit = () => {
    let score = 0;
    displayQuiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) score++;
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const tabs = lang === 'es'
    ? [{ id: 'reader', label: 'Leer y Escuchar' }, { id: 'quiz', label: 'Quiz' }, { id: 'task', label: 'Tarea' }]
    : [{ id: 'reader', label: 'Read & Listen' }, { id: 'quiz', label: 'Quiz' }, { id: 'task', label: 'Task' }];

  return (
    <div className="h-full flex flex-col animate-fade-in pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-all duration-200 pt-4">
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              <ChevronLeft size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">
                {lang === 'es' ? 'Volver al Índice' : 'Back to Index'}
              </span>
            </button>

            {/* Language Toggle */}
            <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-900 rounded-full p-1">
              <Globe className="w-3.5 h-3.5 text-stone-400 ml-1" />
              <button
                onClick={() => setLang('es')}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  lang === 'es'
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                ES
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  lang === 'en'
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-black dark:text-white tracking-tighter uppercase mb-5 leading-tight">
            {displayTitle}
          </h2>

          <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-lg w-full max-w-md">
            {tabs.map(tab => (
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
                  title={lang === 'es' ? 'Reiniciar audio' : 'Restart audio'}
                >
                  <RotateCcw className="w-5 h-5 text-stone-300" />
                </button>
              </div>
              <div className="flex-1 w-full text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <Volume2 className="w-4 h-4 text-brand" />
                  <span className="text-xs font-bold uppercase tracking-widest text-brand">
                    {lang === 'es' ? 'Narración' : 'Narration'} · {lang.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-stone-400">
                  {lang === 'es'
                    ? `Escucha la narración de este capítulo. Duración aprox: ${chapter.duration}`
                    : `Listen to the narration of this chapter. Approx. duration: ${chapter.duration}`}
                </p>
              </div>
            </div>

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
                {lang === 'es' ? 'Comprueba tu aprendizaje' : 'Check your learning'}
              </h3>
              <p className="text-stone-500 text-sm">
                {lang === 'es'
                  ? 'Responde estas preguntas basadas en el capítulo.'
                  : 'Answer these questions based on the chapter.'}
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
                {lang === 'es' ? 'Revisar Respuestas' : 'Review Answers'}
              </button>
            ) : (
              <div className={`p-6 rounded-2xl text-center border ${quizScore === displayQuiz.length ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800'}`}>
                <h4 className="text-xl font-black mb-2">
                  {lang === 'es' ? 'Puntuación' : 'Score'}: {quizScore} / {displayQuiz.length}
                </h4>
                <p>
                  {quizScore === displayQuiz.length
                    ? (lang === 'es' ? '¡Excelente! Has dominado este tema.' : 'Excellent! You have mastered this topic.')
                    : (lang === 'es' ? 'Buen intento. Te recomendamos repasar el capítulo.' : 'Good try. We recommend reviewing the chapter.')}
                </p>
                <button
                  onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
                  className="mt-6 px-6 py-2 bg-white dark:bg-stone-800 border border-current rounded-lg font-bold text-sm hover:opacity-80 transition-opacity"
                >
                  {lang === 'es' ? 'Intentar de nuevo' : 'Try again'}
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
                {lang === 'es' ? 'Misión Práctica' : 'Practical Mission'}
              </h3>
              <p className="text-lg text-stone-700 dark:text-stone-300 leading-relaxed bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm">
                {displayTask}
              </p>
              <div className="mt-8 text-sm text-stone-500 font-medium">
                {lang === 'es'
                  ? 'Completa esta tarea en tu entorno de trabajo para consolidar lo aprendido en este capítulo.'
                  : 'Complete this task in your work environment to consolidate what you learned in this chapter.'}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
