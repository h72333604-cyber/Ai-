import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  CheckCircle,
  XCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  BookOpen,
  Filter,
  Check,
  Sliders,
  Send,
  HelpCircle,
  FileText,
  CheckSquare,
  Flame,
  Info,
  Mic,
  MicOff,
  Brain,
  Download,
  Upload,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, QuestionType, DifficultyLevel, AIEvaluation } from '../types';
import { soundEffects, speakArabicText, stopArabicSpeech } from '../utils/audioEffects';
import { PDFQuestionBankModal } from './PDFQuestionBankModal';
import { recordMistake, markAsMastered } from '../utils/mistakeTracker';

interface InteractiveQuizBankProps {
  questions: Question[];
  currentSubjectFilter: string;
  onSelectQuestionContext?: (qText: string) => void;
  onAddScore?: (points: number) => void;
  onUpdateQuizQuestions?: (newQuestions: Question[], bankTitle: string) => void;
}

export const InteractiveQuizBank: React.FC<InteractiveQuizBankProps> = ({
  questions,
  currentSubjectFilter,
  onSelectQuestionContext,
  onAddScore,
  onUpdateQuizQuestions,
}) => {
  // Customization filters
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    'mcq',
    'true_false',
    'essay',
    'fill_blank',
  ]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<DifficultyLevel[]>([
    'easy',
    'medium',
    'hard',
  ]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showPDFBankModal, setShowPDFBankModal] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Active quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [aiEvaluations, setAiEvaluations] = useState<Record<string, AIEvaluation>>({});
  const [isGrading, setIsGrading] = useState(false);
  const [isReadingAudio, setIsReadingAudio] = useState(false);

  // Text inputs for essay and fill-in-the-blank
  const [textInput, setTextInput] = useState('');

  // Filtered Questions according to user customization
  const filteredQuestions = questions.filter((q) => {
    const typeMatch = selectedTypes.includes(q.type);
    const diffMatch = selectedDifficulties.includes(q.difficulty);
    return typeMatch && diffMatch;
  });

  const currentQ = filteredQuestions[currentIndex] || filteredQuestions[0] || questions[0];

  const handleSelectOption = (optionIndex: number) => {
    if (!currentQ || selectedAnswers[currentQ.id] !== undefined) return;

    const isCorrect = Number(currentQ.correctAnswer) === optionIndex;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));

    if (isCorrect) {
      soundEffects.playCorrect();
      if (onAddScore) onAddScore(20);
      markAsMastered(currentQ.id, true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#06b6d4', '#0ea5e9', '#3b82f6', '#10b981'],
      });
    } else {
      soundEffects.playIncorrect();
      if (onAddScore) onAddScore(5);
      const studentChosenText =
        currentQ.options && currentQ.options[optionIndex]
          ? currentQ.options[optionIndex]
          : optionIndex === 0
          ? 'صح'
          : 'خطأ';
      recordMistake(currentQ, studentChosenText);
    }

    if (onSelectQuestionContext) {
      onSelectQuestionContext(currentQ.questionText);
    }
  };

  const handleGradeWrittenAnswer = async () => {
    if (!currentQ || !textInput.trim() || isGrading) return;

    setIsGrading(true);
    soundEffects.playClick();

    try {
      const res = await fetch('/api/grade-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: currentQ.questionText,
          questionType: currentQ.type,
          studentAnswer: textInput,
          correctAnswer: String(currentQ.correctAnswer),
          explanation: currentQ.explanation,
          modelAnswerGuide: currentQ.modelAnswerGuide,
        }),
      });

      const data = await res.json();
      setAiEvaluations((prev) => ({
        ...prev,
        [currentQ.id]: data,
      }));
      setSelectedAnswers((prev) => ({
        ...prev,
        [currentQ.id]: textInput,
      }));

      if (data.isCorrect) {
        soundEffects.playCorrect();
        if (onAddScore) onAddScore(30);
        markAsMastered(currentQ.id, true);
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
        });
      } else {
        soundEffects.playIncorrect();
        if (onAddScore) onAddScore(10);
        recordMistake(currentQ, textInput);
      }
    } catch (err) {
      console.error('Error grading answer:', err);
    } finally {
      setIsGrading(false);
    }
  };

  const handleReadQuestionAudio = () => {
    if (!currentQ) return;
    if (isReadingAudio) {
      stopArabicSpeech();
      setIsReadingAudio(false);
      return;
    }

    setIsReadingAudio(true);

    let scriptToRead = `السؤال: ${currentQ.questionText}. `;
    if (currentQ.type === 'mcq' && currentQ.options) {
      scriptToRead += 'الخيارات: ';
      currentQ.options.forEach((opt, idx) => {
        scriptToRead += `الخيار رقم ${idx + 1}: ${opt}. `;
      });
    } else if (currentQ.type === 'true_false') {
      scriptToRead += 'اختر: صح أم خطأ.';
    } else if (currentQ.type === 'fill_blank') {
      scriptToRead += 'أكمل الفراغ بالكلمة أو المصطلح الفني المناسب.';
    } else if (currentQ.type === 'essay') {
      scriptToRead += 'سؤال مقالي: اكتب إجابتك وشرحك الفني ليقوم الذكاء الاصطناعي بتقييمها.';
    }

    speakArabicText(
      scriptToRead,
      () => setIsReadingAudio(false),
      () => setIsReadingAudio(false)
    );
  };

  const handleToggleVoiceDictation = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotice('المتصفح الحالي لا يدعم ميزة الإملاء الصوتي المباشر. يرجى استخدام متصفح Chrome أو كتابة الإجابة يدوياً.');
      setTimeout(() => setVoiceNotice(null), 4500);
      return;
    }

    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-EG'; // Egyptian Arabic dialect
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListeningVoice(true);
        soundEffects.playLiveActivate();
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTextInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        soundEffects.playCorrect();
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListeningVoice(false);
    }
  };

  const handleNext = () => {
    stopArabicSpeech();
    setIsReadingAudio(false);
    setTextInput('');
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      soundEffects.playClick();
      const nextQ = filteredQuestions[currentIndex + 1];
      if (nextQ && onSelectQuestionContext) {
        onSelectQuestionContext(nextQ.questionText);
      }
    }
  };

  const handlePrev = () => {
    stopArabicSpeech();
    setIsReadingAudio(false);
    setTextInput('');
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      soundEffects.playClick();
      const prevQ = filteredQuestions[currentIndex - 1];
      if (prevQ && onSelectQuestionContext) {
        onSelectQuestionContext(prevQ.questionText);
      }
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setAiEvaluations({});
    setCurrentIndex(0);
    setTextInput('');
    soundEffects.playClick();
  };

  const toggleType = (t: QuestionType) => {
    if (selectedTypes.includes(t)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter((item) => item !== t));
      }
    } else {
      setSelectedTypes([...selectedTypes, t]);
    }
    setCurrentIndex(0);
    soundEffects.playClick();
  };

  const toggleDifficulty = (d: DifficultyLevel) => {
    if (selectedDifficulties.includes(d)) {
      if (selectedDifficulties.length > 1) {
        setSelectedDifficulties(selectedDifficulties.filter((item) => item !== d));
      }
    } else {
      setSelectedDifficulties([...selectedDifficulties, d]);
    }
    setCurrentIndex(0);
    soundEffects.playClick();
  };

  const hasAnswered = currentQ ? selectedAnswers[currentQ.id] !== undefined : false;
  const currentEvaluation = currentQ ? aiEvaluations[currentQ.id] : null;

  return (
    <div className="space-y-6">
      {/* Top Controls & Customization Bar */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base sm:text-lg text-slate-100">
                بنك الأسئلة والاختبارات التفاعلية المخصصة
              </h2>
              {filteredQuestions.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  سؤال {currentIndex + 1} من {filteredQuestions.length}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              حرية كاملة في تخصيص أنواع الأسئلة (مقالي، صح وخطأ، اختر، أكمل) وتحديد مستوى الصعوبة
            </p>
          </div>
        </div>

        {/* Actions: PDF Bank + Customization */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setShowPDFBankModal(true);
              soundEffects.playClick();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-950/40"
          >
            <FileText className="w-4 h-4 text-cyan-200" />
            <span>بنوك أسئلة PDF والاختبار الذكي 📄</span>
          </button>

          <button
            onClick={() => {
              setShowConfigModal(true);
              soundEffects.playClick();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all shadow-md hover:border-cyan-400"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>تخصيص الأنواع ⚙️</span>
          </button>
        </div>
      </div>

      {/* Active Quick Filters Pill Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
        {/* Question Type Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-medium ml-1">الأنواع النشطة:</span>
          {(
            [
              { id: 'mcq', label: 'اختر من متعدد' },
              { id: 'true_false', label: 'صح أو خطأ' },
              { id: 'essay', label: 'أسئلة مقالية' },
              { id: 'fill_blank', label: 'أكمل الفراغات' },
            ] as const
          ).map((t) => {
            const active = selectedTypes.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggleType(t.id)}
                className={`px-3 py-1 rounded-xl transition-all ${
                  active
                    ? 'bg-cyan-600/80 text-white font-semibold border border-cyan-400 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Difficulty Filter Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium ml-1">الصعوبة:</span>
          {(
            [
              { id: 'easy', label: 'سهل' },
              { id: 'medium', label: 'متوسط' },
              { id: 'hard', label: 'تحدي المتفوقين' },
            ] as const
          ).map((d) => {
            const active = selectedDifficulties.includes(d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggleDifficulty(d.id)}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  active
                    ? d.id === 'easy'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 font-semibold'
                      : d.id === 'medium'
                      ? 'bg-amber-950 text-amber-300 border border-amber-600 font-semibold'
                      : 'bg-rose-950 text-rose-300 border border-rose-600 font-semibold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress Track */}
      {filteredQuestions.length > 0 && (
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 h-full transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / filteredQuestions.length) * 100}%`,
            }}
          ></div>
        </div>
      )}

      {/* Main Question Card or Empty State */}
      {!currentQ ? (
        <div className="p-12 text-center glass-card rounded-3xl border border-slate-800">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200 mb-1">
            لا توجد أسئلة تطابق تصنيفاتك الحالية
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            يرجى تفعيل أنواع أخرى من الأسئلة أو مستويات صعوبة من أزرار التخصيص أعلاه.
          </p>
          <button
            onClick={() => {
              setSelectedTypes(['mcq', 'true_false', 'essay', 'fill_blank']);
              setSelectedDifficulties(['easy', 'medium', 'hard']);
            }}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white text-xs font-bold"
          >
            إعادة تفعيل جميع الأنواع والمستويات
          </button>
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-5 sm:p-8 border border-cyan-500/20 relative shadow-xl shadow-cyan-950/20">
          {/* Question Header & Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                {currentQ.chapterTitle}
              </span>

              {/* Type Badge */}
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-sky-300 border border-slate-700">
                {currentQ.type === 'mcq'
                  ? 'اختر من متعدد'
                  : currentQ.type === 'true_false'
                  ? 'صح أو خطأ'
                  : currentQ.type === 'essay'
                  ? 'سؤال مقالي وشرح'
                  : 'أكمل الفراغات'}
              </span>

              {/* Difficulty Badge */}
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  currentQ.difficulty === 'easy'
                    ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40'
                    : currentQ.difficulty === 'medium'
                    ? 'bg-amber-950/50 text-amber-300 border border-amber-800/40'
                    : 'bg-rose-950/50 text-rose-300 border border-rose-800/40'
                }`}
              >
                {currentQ.difficulty === 'easy'
                  ? 'مستوى قياسي (سهل)'
                  : currentQ.difficulty === 'medium'
                  ? 'متوسط'
                  : 'تحدي المتفوقين'}
              </span>
            </div>

            {/* Audio Reading Button */}
            <button
              onClick={handleReadQuestionAudio}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                isReadingAudio
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-lg shadow-cyan-500/30 animate-pulse'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border-cyan-500/30'
              }`}
              title="قراءة السؤال والخيارات صوتياً بالدبلجة"
            >
              {isReadingAudio ? (
                <>
                  <VolumeX className="w-4 h-4 text-slate-950" />
                  <span>إيقاف القراءة</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>قراءة السؤال صوتياً 🔊</span>
                </>
              )}
            </button>
          </div>

          {/* Question Text */}
          <div className="mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-slate-100 leading-relaxed">
              {currentQ.questionText}
            </h3>
          </div>

          {/* INTERACTION AREA BASED ON QUESTION TYPE */}

          {/* 1. Multiple Choice (MCQ) */}
          {currentQ.type === 'mcq' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
              {currentQ.options?.map((option, idx) => {
                const userAnswer = selectedAnswers[currentQ.id];
                const isSelected = userAnswer === idx;
                const isCorrectOption = Number(currentQ.correctAnswer) === idx;

                let buttonStyle =
                  'border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-cyan-500/40 text-slate-200';

                if (hasAnswered) {
                  if (isCorrectOption) {
                    buttonStyle =
                      'border-emerald-500 bg-emerald-950/40 text-emerald-100 font-semibold ring-2 ring-emerald-500/30';
                  } else if (isSelected) {
                    buttonStyle =
                      'border-rose-500 bg-rose-950/40 text-rose-200 font-semibold ring-2 ring-rose-500/30';
                  } else {
                    buttonStyle = 'border-slate-800/40 bg-slate-900/30 text-slate-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={hasAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-right transition-all group ${buttonStyle}`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold font-mono transition-colors ${
                        hasAnswered && isCorrectOption
                          ? 'bg-emerald-500 text-slate-950'
                          : hasAnswered && isSelected
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-800 text-slate-300 group-hover:bg-cyan-900/60 group-hover:text-cyan-200'
                      }`}
                    >
                      {hasAnswered && isCorrectOption ? (
                        <Check className="w-4 h-4" />
                      ) : hasAnswered && isSelected ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        idx + 1
                      )}
                    </span>
                    <span className="flex-1 text-sm sm:text-base leading-snug pt-0.5">
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. True / False */}
          {currentQ.type === 'true_false' && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'صح ✓', value: 0 },
                { label: 'خطأ ✗', value: 1 },
              ].map((opt) => {
                const userAnswer = selectedAnswers[currentQ.id];
                const isSelected = userAnswer === opt.value;
                const isCorrect = Number(currentQ.correctAnswer) === opt.value;

                let style =
                  'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200';
                if (hasAnswered) {
                  if (isCorrect) {
                    style =
                      'border-emerald-500 bg-emerald-950/40 text-emerald-100 ring-2 ring-emerald-500/30 font-bold';
                  } else if (isSelected) {
                    style =
                      'border-rose-500 bg-rose-950/40 text-rose-200 ring-2 ring-rose-500/30 font-bold';
                  } else {
                    style = 'opacity-50 border-slate-800 bg-slate-900/30 text-slate-500';
                  }
                }

                return (
                  <button
                    key={opt.value}
                    disabled={hasAnswered}
                    onClick={() => handleSelectOption(opt.value)}
                    className={`py-6 px-4 rounded-2xl border text-center text-lg sm:text-xl font-bold transition-all ${style}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. Fill in the Blank (أكمل الفراغات) */}
          {currentQ.type === 'fill_blank' && (
            <div className="mb-6 space-y-3">
              <label className="block text-xs font-semibold text-cyan-300">
                اكتب الكلمة أو المصطلح الفني الناقص في الفراغ:
              </label>
              <div className="flex items-center gap-2 max-w-lg">
                <input
                  type="text"
                  disabled={hasAnswered || isGrading}
                  value={hasAnswered ? selectedAnswers[currentQ.id] : textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="اكتب إجابتك هنا..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
                />
                {!hasAnswered && (
                  <button
                    onClick={handleGradeWrittenAnswer}
                    disabled={!textInput.trim() || isGrading}
                    className="px-5 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isGrading ? 'جاري الفحص...' : 'تحقق من الإجابة'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 4. Essay Question (سؤال مقالي وشرح فني مع تصحيح دلالي بالمعنى) */}
          {currentQ.type === 'essay' && (
            <div className="mb-6 space-y-3">
              {/* Semantic Meaning Banner */}
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-700/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  <span>تصحيح دلالي ذكي بالمعنى (Semantic Evaluation)</span>
                </div>
                <span className="text-[11px] text-slate-300">
                  اكتب بفهمك الخاص وبأسلوبك العملي؛ لا يشترط نهائياً التطابق اللفظي الحرفي.
                </span>
              </div>

              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-cyan-300">
                  اكتب شرحك وإجابتك الفنية بحرية:
                </label>

                {/* Voice Dictation Button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceDictation}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    isListeningVoice
                      ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/40 animate-pulse'
                      : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-500/30'
                  }`}
                  title="تحدث بصوتك وسيقوم النظام بكتابة إجابتك تلقائياً"
                >
                  {isListeningVoice ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{isListeningVoice ? 'جاري الاستماع... (اضغط للإيقاف)' : 'إملاء صوتي بالإجابة 🎙️'}</span>
                </button>
              </div>

              {voiceNotice && (
                <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2 animate-fadeIn">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{voiceNotice}</span>
                </div>
              )}

              <textarea
                rows={4}
                disabled={hasAnswered || isGrading}
                value={hasAnswered ? selectedAnswers[currentQ.id] : textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="اكتب شرحك الفني هنا (مثال: إضافة الشبة لمعادلة شحنات الطمي السالبة وتجميع الرواسب وتكوين ندف تترسب بالمروقات...)"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 leading-relaxed"
              ></textarea>

              {!hasAnswered && (
                <div className="flex justify-end">
                  <button
                    onClick={handleGradeWrittenAnswer}
                    disabled={!textInput.trim() || isGrading}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 transition-all active:scale-95"
                  >
                    <Brain className="w-4 h-4" />
                    <span>
                      {isGrading
                        ? 'جاري التحليل الدلالي والتصحيح بالمعنى...'
                        : 'تصحيح الإجابة دلالياً بالمعنى 🧠'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Feedback & Semantic Evaluation Panel */}
          {hasAnswered && (
            <div
              className={`p-4 sm:p-5 rounded-2xl border mb-6 transition-all animate-fadeIn ${
                currentEvaluation
                  ? currentEvaluation.isCorrect
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  : Number(currentQ.correctAnswer) === selectedAnswers[currentQ.id]
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
              }`}
            >
              {/* Header result */}
              <div className="flex items-center justify-between gap-3 mb-2 font-bold text-sm sm:text-base">
                <div className="flex items-center gap-2 flex-wrap">
                  {currentEvaluation ? (
                    currentEvaluation.isCorrect ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-300">
                          {currentEvaluation.semanticMatchLevel || 'إجابة مقبولة بالمعنى والمضمون العلمي!'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-200 border border-emerald-700">
                          تصحيح دلالي بالمعنى
                        </span>
                      </>
                    ) : (
                      <>
                        <Info className="w-5 h-5 text-amber-400" />
                        <span className="text-amber-300">
                          {currentEvaluation.semanticMatchLevel || 'محاولة مقبولة مع ملاحظات دلالية'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-200 border border-amber-700">
                          تصحيح دلالي بالمعنى
                        </span>
                      </>
                    )
                  ) : Number(currentQ.correctAnswer) === selectedAnswers[currentQ.id] ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-300">
                        إجابة صحيحة وممتازة! (+20 نقطة تميز)
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-400" />
                      <span className="text-rose-300">
                        إجابة غير دقيقة. الإجابة الصحيحة هي:{' '}
                        {currentQ.type === 'mcq'
                          ? currentQ.options?.[Number(currentQ.correctAnswer)]
                          : currentQ.type === 'true_false'
                          ? currentQ.correctAnswer === 0
                            ? 'صح'
                            : 'خطأ'
                          : String(currentQ.correctAnswer)}
                      </span>
                    </>
                  )}
                </div>

                {/* Score percentage if graded by AI */}
                {currentEvaluation && (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-slate-900 border border-slate-700 text-cyan-300">
                    درجة المعنى: {currentEvaluation.scorePercentage}%
                  </span>
                )}
              </div>

              {/* Feedback Text */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
                {currentEvaluation?.feedback || currentQ.explanation}
              </p>

              {/* Semantic Concepts Breakdown for Essay Questions */}
              {currentEvaluation?.conceptsCaptured && currentEvaluation.conceptsCaptured.length > 0 && (
                <div className="mb-3 p-3 rounded-xl bg-slate-900/70 border border-emerald-800/40 space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-300 block">
                    ✓ المفاهيم الفنية التي ذكرتها بنجاح وقُبلت بالمعنى:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentEvaluation.conceptsCaptured.map((concept, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-2.5 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700 text-[11px] font-medium"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Concepts if any */}
              {currentEvaluation?.missingConcepts && currentEvaluation.missingConcepts.length > 0 && (
                <div className="mb-3 p-3 rounded-xl bg-slate-900/70 border border-amber-800/40 space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-300 block">
                    + عناصر إضافية لرفع درجتك للنهائية:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentEvaluation.missingConcepts.map((mConcept, mIdx) => (
                      <span
                        key={mIdx}
                        className="px-2.5 py-0.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-700 text-[11px] font-medium"
                      >
                        {mConcept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ideal Answer for Essay */}
              {currentQ.type === 'essay' && (
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 mb-3">
                  <span className="font-bold text-cyan-300 block mb-1">
                    📖 الصياغة النموذجية المعتمدة للمقارنة:
                  </span>
                  <span>{currentEvaluation?.idealCorrection || String(currentQ.correctAnswer)}</span>
                </div>
              )}

              {/* Practical Plant Tip */}
              {currentQ.practicalNote && (
                <div className="flex items-start gap-2 pt-2.5 border-t border-slate-700/50 text-xs text-cyan-300">
                  <Info className="w-4 h-4 flex-shrink-0 text-cyan-400 mt-0.5" />
                  <span>
                    <strong>معلومة من واقع محطة المعالجة بأسيوط:</strong>{' '}
                    {currentQ.practicalNote}
                  </span>
                </div>
              )}

              {/* Mistake bank notice if answered incorrectly */}
              {hasAnswered &&
                !(currentEvaluation
                  ? currentEvaluation.isCorrect
                  : Number(currentQ.correctAnswer) === selectedAnswers[currentQ.id]) && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/40 flex items-center justify-between text-[11px] text-amber-200">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping flex-shrink-0"></span>
                      <span>
                        تم تسجيل هذا السؤال تلقائياً في <strong>بنك الأخطاء المتكررة</strong> بصفحة الإحصائيات لإعادة اختباره لاحقاً 🎯
                      </span>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Bottom Pagination & Navigation */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 text-xs sm:text-sm text-slate-200 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السؤال السابق</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
              title="إعادة ضبط التدريب"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إعادة المحاولة</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex === filteredQuestions.length - 1}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-xs sm:text-sm text-white font-medium shadow-md shadow-cyan-950 transition-colors"
            >
              <span>السؤال التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Custom Quiz Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-cyan-500/30 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">
                  تخصيص الاختبار وأنواع الأسئلة
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-xs sm:text-sm">
              {/* Question Types checkboxes */}
              <div>
                <label className="block text-slate-300 font-bold mb-2">
                  اختر أنواع الأسئلة المراد إدراجها في الاختبار:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(
                    [
                      { id: 'mcq', title: 'اختيار من متعدد (MCQ)', desc: '4 خيارات وتصحيح لحظي' },
                      { id: 'true_false', title: 'صح أو خطأ', desc: 'تقييم المفاهيم الأساسية' },
                      { id: 'essay', title: 'أسئلة مقالية وشرح', desc: 'تصحيح تفصيلي بالذكاء الاصطناعي' },
                      { id: 'fill_blank', title: 'أكمل الفراغات', desc: 'كتابة المصطلحات الفنية' },
                    ] as const
                  ).map((t) => {
                    const checked = selectedTypes.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleType(t.id)}
                        className={`p-3 rounded-2xl border text-right transition-all flex items-start gap-2.5 ${
                          checked
                            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-100'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border text-[10px] ${
                            checked
                              ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold'
                              : 'border-slate-600'
                          }`}
                        >
                          {checked && '✓'}
                        </span>
                        <div>
                          <div className="font-bold text-xs">{t.title}</div>
                          <div className="text-[10px] text-slate-400">{t.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Levels */}
              <div>
                <label className="block text-slate-300 font-bold mb-2">
                  مستوى الصعوبة المناسب:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'easy', label: 'سهل (أساسي)' },
                      { id: 'medium', label: 'متوسط (تشغيلي)' },
                      { id: 'hard', label: 'متقدم (طوارئ)' },
                    ] as const
                  ).map((d) => {
                    const checked = selectedDifficulties.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDifficulty(d.id)}
                        className={`py-2.5 px-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                          checked
                            ? 'border-cyan-400 bg-cyan-950/50 text-cyan-200'
                            : 'border-slate-800 bg-slate-900/50 text-slate-400'
                        }`}
                      >
                        {d.label} {checked ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Result Summary in Modal */}
              <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span>إجمالي الأسئلة المتاحة بهذا التخصيص:</span>
                <span className="font-bold text-cyan-300 font-mono text-sm">
                  {filteredQuestions.length} سؤال
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md"
                >
                  تطبيق وبدء الاختبار المخصص ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive PDF Question Bank Modal */}
      <PDFQuestionBankModal
        isOpen={showPDFBankModal}
        onClose={() => setShowPDFBankModal(false)}
        currentQuestions={questions}
        onLoadQuestionsToQuiz={(newQuestions, bankTitle) => {
          if (onUpdateQuizQuestions) {
            onUpdateQuizQuestions(newQuestions, bankTitle);
          }
          setSelectedAnswers({});
          setAiEvaluations({});
          setCurrentIndex(0);
          setTextInput('');
          setShowPDFBankModal(false);
        }}
      />
    </div>
  );
};
