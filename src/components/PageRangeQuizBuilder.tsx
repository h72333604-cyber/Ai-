import React, { useState } from 'react';
import {
  FileQuestion,
  BookOpen,
  Sliders,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  FileText,
  Play,
  Bookmark,
  ChevronLeft,
  Filter,
  Check
} from 'lucide-react';
import { TextbookModule, QuestionType, DifficultyLevel, QuizCustomConfig } from '../types';
import { soundEffects } from '../utils/audioEffects';

interface PageRangeQuizBuilderProps {
  modules: TextbookModule[];
  onStartCustomQuiz: (config: QuizCustomConfig) => void;
}

export const PageRangeQuizBuilder: React.FC<PageRangeQuizBuilderProps> = ({
  modules,
  onStartCustomQuiz,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    modules[0]?.id || ''
  );

  const currentModule =
    modules.find((m) => m.id === selectedModuleId) || modules[0];

  // Exact Page range state
  const totalPages = currentModule?.totalPages || 100;
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(Math.min(30, totalPages));

  // Question Types selection
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    'mcq',
    'true_false',
    'essay',
    'fill_blank',
  ]);

  // Difficulty selection
  const [selectedDifficulties, setSelectedDifficulties] = useState<DifficultyLevel[]>([
    'easy',
    'medium',
    'hard',
  ]);

  // Questions count & time limit
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);

  const handleSelectChapterPreset = (chStart: number, chEnd: number) => {
    setStartPage(chStart);
    setEndPage(chEnd);
    soundEffects.playClick();
  };

  const toggleType = (type: QuestionType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
    soundEffects.playClick();
  };

  const toggleDifficulty = (diff: DifficultyLevel) => {
    if (selectedDifficulties.includes(diff)) {
      if (selectedDifficulties.length > 1) {
        setSelectedDifficulties(selectedDifficulties.filter((d) => d !== diff));
      }
    } else {
      setSelectedDifficulties([...selectedDifficulties, diff]);
    }
    soundEffects.playClick();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playLiveActivate();
    onStartCustomQuiz({
      selectedModuleId,
      startPage,
      endPage,
      selectedTypes,
      selectedDifficulties,
      questionCount,
      timeLimitMinutes,
    });
  };

  // Preview chapters that overlap with selected page range
  const includedChapters = currentModule?.chapters.filter(
    (ch) =>
      (ch.pageEnd !== undefined && ch.pageStart !== undefined && startPage <= ch.pageEnd && endPage >= ch.pageStart) ||
      (!ch.pageStart && !ch.pageEnd)
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-cyan-500/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                <Sliders className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                صانع الاختبارات الذكي • تحديد الصفحات الأصلية
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              حدّد صفحات كتابك بدقة، واختر نوع ومستوى الأسئلة التي تريدها
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-2xl">
              اختر أي مقرر فني، وحدّد نطاق الصفحات بالضبط من النسخة الأصلية (مثلاً: من صفحة 12 إلى 45)، ليقوم الذكاء الاصطناعي بتوليد امتحان متوازن يشمل المقالي، الصح والخطأ، اختر، وأكمل.
            </p>
          </div>

          <div className="hidden lg:flex flex-col items-center p-4 rounded-2xl glass-panel border border-cyan-500/30 text-center flex-shrink-0">
            <span className="text-xs text-slate-400">إجمالي الأسئلة في النطاق</span>
            <span className="text-3xl font-black text-cyan-300 font-mono my-1">
              {questionCount}
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">
              مصححة فورياً بالذكاء الاصطناعي
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Select Book / Module */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center font-mono">
                1
              </span>
              <h3 className="font-bold text-base text-white">
                اختر الكتاب أو المقرر الدراسي
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {modules.length} مقررات متاحة
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {modules.map((mod) => {
              const isSelected = mod.id === selectedModuleId;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => {
                    setSelectedModuleId(mod.id);
                    setStartPage(1);
                    setEndPage(Math.min(30, mod.totalPages || 100));
                    soundEffects.playClick();
                  }}
                  className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-950/40 ring-2 ring-cyan-400/40'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                      {mod.code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {mod.grade}
                    </span>
                  </div>
                  <div>
                    <h4
                      className={`font-bold text-sm ${
                        isSelected ? 'text-cyan-200' : 'text-slate-100'
                      }`}
                    >
                      {mod.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                      {mod.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                    <span>{mod.totalPages || 100} صفحة أصلية</span>
                    <span className="text-cyan-400">{mod.chapters.length} أبواب فنية</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Exact Page-Range Selection */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center font-mono">
                2
              </span>
              <h3 className="font-bold text-base text-white">
                تحديد نطاق الصفحات بدقة من النسخة الأصلية
              </h3>
            </div>
            <span className="text-xs text-cyan-300 font-mono font-bold">
              {currentModule?.pdfFileName}
            </span>
          </div>

          {/* Quick Chapter Selector Pills */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              اختيار سريع بحسب الأبواب الفنية للكتاب:
            </label>
            <div className="flex flex-wrap gap-2">
              {currentModule?.chapters.map((ch) => {
                const isActive = startPage === ch.pageStart && endPage === ch.pageEnd;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleSelectChapterPreset(ch.pageStart || 1, ch.pageEnd || 30)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200 font-bold'
                        : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <Bookmark className="w-3 h-3 text-cyan-400" />
                    <span>{ch.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (ص {ch.pageStart}-{ch.pageEnd})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Page Range Slider / Inputs */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  من صفحة رقم:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={endPage}
                    value={startPage}
                    onChange={(e) =>
                      setStartPage(
                        Math.max(1, Math.min(Number(e.target.value), endPage))
                      )
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    (البداية)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  إلى صفحة رقم:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={startPage}
                    max={totalPages}
                    value={endPage}
                    onChange={(e) =>
                      setEndPage(
                        Math.min(totalPages, Math.max(Number(e.target.value), startPage))
                      )
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    من أصل {totalPages}
                  </span>
                </div>
              </div>
            </div>

            {/* Scope Summary Preview */}
            <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl text-xs text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>
                  نطاق الاختبار المحدد: <strong>{endPage - startPage + 1} صفحة</strong>{' '}
                  (تشمل {includedChapters.length} أبواب وفصول دراسية)
                </span>
              </span>
              <span className="text-cyan-300 font-mono font-semibold">
                ص {startPage} ◄ ص {endPage}
              </span>
            </div>
          </div>
        </div>

        {/* Step 3: Question Types & Difficulty */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Question Types */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
              <span className="w-7 h-7 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center font-mono">
                3
              </span>
              <h3 className="font-bold text-base text-white">
                أنواع الأسئلة في الاختبار
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  {
                    id: 'essay',
                    title: 'أسئلة مقالية وشرح فني',
                    desc: 'تصحيح دلالي ذكي بالمعنى والمفهوم العلمي وليس التطابق اللفظي',
                    badge: 'تصحيح بالمعنى 🧠',
                  },
                  {
                    id: 'true_false',
                    title: 'صح أو خطأ',
                    desc: 'اختبار دقة المفاهيم والمعايير القياسية',
                    badge: 'مباشر',
                  },
                  {
                    id: 'mcq',
                    title: 'اختيار من متعدد (MCQ)',
                    desc: '4 خيارات وتصحيح فوري مع الصوت',
                    badge: 'تفاعلي',
                  },
                  {
                    id: 'fill_blank',
                    title: 'أكمل الفراغات',
                    desc: 'كتابة المصطلحات الفنية الميدانية',
                    badge: 'مصطلحات',
                  },
                ] as const
              ).map((typeItem) => {
                const checked = selectedTypes.includes(typeItem.id);
                return (
                  <button
                    key={typeItem.id}
                    type="button"
                    onClick={() => toggleType(typeItem.id)}
                    className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 ${
                      checked
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-100 shadow-sm'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-lg mt-0.5 flex items-center justify-center border text-xs font-bold ${
                        checked
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                          : 'border-slate-700 bg-slate-800'
                      }`}
                    >
                      {checked && '✓'}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm">
                          {typeItem.title}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-mono">
                          {typeItem.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        {typeItem.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty & Settings */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
                <span className="w-7 h-7 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center font-mono">
                  4
                </span>
                <h3 className="font-bold text-base text-white">
                  مستوى الصعوبة وإعدادات الامتحان
                </h3>
              </div>

              {/* Difficulty buttons */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  مستوى الصعوبة المناسب:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'easy', label: 'سهل (أساسي)' },
                      { id: 'medium', label: 'متوسط (تشغيلي)' },
                      { id: 'hard', label: 'متقدم (طوارئ)' },
                    ] as const
                  ).map((diff) => {
                    const checked = selectedDifficulties.includes(diff.id);
                    return (
                      <button
                        key={diff.id}
                        type="button"
                        onClick={() => toggleDifficulty(diff.id)}
                        className={`py-2 px-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                          checked
                            ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400'
                        }`}
                      >
                        {diff.label} {checked ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Count & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    عدد الأسئلة:
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold"
                  >
                    <option value={5}>5 أسئلة (سريع)</option>
                    <option value={10}>10 أسئلة (قياسي)</option>
                    <option value={15}>15 سؤال (شامل)</option>
                    <option value={20}>20 سؤال (محاكاة امتحان)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    الوقت المحدد:
                  </label>
                  <select
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold"
                  >
                    <option value={10}>10 دقائق</option>
                    <option value={15}>15 دقيقة</option>
                    <option value={25}>25 دقيقة</option>
                    <option value={45}>45 دقيقة</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Launch Quiz Button */}
            <div className="pt-4 mt-4 border-t border-slate-800">
              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-cyan-950/50 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>بدء الاختبار المخصص الآن (ص {startPage} - {endPage}) 🚀</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
