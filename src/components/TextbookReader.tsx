import React, { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  FileText,
  Volume2,
  Plus,
  Trash2,
  Edit3,
  FileUp,
  AlertTriangle,
  Layers,
  GraduationCap,
  Save,
  X
} from 'lucide-react';
import { TextbookModule } from '../types';
import { soundEffects, speakArabicText, stopArabicSpeech } from '../utils/audioEffects';

interface TextbookReaderProps {
  modules: TextbookModule[];
  onOpenQuizForModule: (moduleId: string) => void;
  onAskTutorAboutChapter: (title: string, summary: string) => void;
  onAddModule: (newModule: TextbookModule) => void;
  onUpdateModule: (updatedModule: TextbookModule) => void;
  onDeleteModule: (moduleId: string) => void;
}

export const TextbookReader: React.FC<TextbookReaderProps> = ({
  modules,
  onOpenQuizForModule,
  onAskTutorAboutChapter,
  onAddModule,
  onUpdateModule,
  onDeleteModule,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id || '');
  const [selectedChapterId, setSelectedChapterId] = useState(
    modules[0]?.chapters[0]?.id || ''
  );
  const [isReadingSummary, setIsReadingSummary] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states for Add / Edit
  const [editTitle, setEditTitle] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editSpecialty, setEditSpecialty] = useState<any>('تشغيل محطات مياه');
  const [editGrade, setEditGrade] = useState<any>('الصف الثاني');
  const [editDescription, setEditDescription] = useState('');
  const [editPdfFileName, setEditPdfFileName] = useState('');
  const [editChaptersText, setEditChaptersText] = useState('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  const currentModule = modules.find((m) => m.id === selectedModuleId) || modules[0];
  const currentChapter =
    currentModule?.chapters.find((c) => c.id === selectedChapterId) ||
    currentModule?.chapters[0];

  const handleReadSummary = () => {
    if (!currentChapter) return;
    if (isReadingSummary) {
      stopArabicSpeech();
      setIsReadingSummary(false);
      return;
    }

    setIsReadingSummary(true);
    const textToRead = `${currentChapter.title}. ${currentChapter.summary}. أهم النقاط: ${currentChapter.keyPoints.join('. ')}`;
    speakArabicText(
      textToRead,
      () => setIsReadingSummary(false),
      () => setIsReadingSummary(false)
    );
  };

  const openAddModal = () => {
    setEditTitle('');
    setEditCode(`MOD-${modules.length + 101}`);
    setEditSpecialty('تشغيل محطات مياه');
    setEditGrade('الصف الثاني');
    setEditDescription('');
    setEditPdfFileName('');
    setEditChaptersText(
      'الباب الأول: مقدمة المعالجة ومحددات الجودة\nالباب الثاني: الفحوصات المعملية واختبارات التشغيل'
    );
    setShowAddModal(true);
    soundEffects.playClick();
  };

  const openEditModal = (mod: TextbookModule) => {
    setEditTitle(mod.title);
    setEditCode(mod.code);
    setEditSpecialty(mod.specialty);
    setEditGrade(mod.grade);
    setEditDescription(mod.description);
    setEditPdfFileName(mod.pdfFileName || '');
    setEditChaptersText(
      mod.chapters
        .map((ch) => `${ch.title}: ${ch.summary}`)
        .join('\n')
    );
    setShowEditModal(true);
    soundEffects.playClick();
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditPdfFileName(file.name);
      if (!editTitle) {
        setEditTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
      setIsUploadingPdf(true);
      setTimeout(() => {
        setIsUploadingPdf(false);
        soundEffects.playCorrect();
      }, 700);
    }
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    // Parse chapters from text
    const lines = editChaptersText.split('\n').filter((l) => l.trim().length > 0);
    const parsedChapters = lines.map((line, idx) => {
      const parts = line.split(/[:\-]/);
      const title = parts[0]?.trim() || `الباب ${idx + 1}`;
      const summary = parts.slice(1).join(':').trim() || 'مفاهيم تشغيلية وتطبيقات عملية بمحطة المياه والصرف بأسيوط.';
      return {
        id: `ch-custom-${Date.now()}-${idx}`,
        title,
        summary,
        keyPoints: [
          'الالتزام بإجراءات السلامة ومحددات الجودة.',
          'تطبيق خطوات التشغيل القياسية للمحطة والشبكة.'
        ],
      };
    });

    const newMod: TextbookModule = {
      id: `module-${Date.now()}`,
      title: editTitle,
      code: editCode || 'CUSTOM-01',
      specialty: editSpecialty,
      grade: editGrade,
      icon: 'BookOpen',
      totalPages: 80,
      description: editDescription || 'مقرر دراسي مخصص تم رفعه ومعالجته بالذكاء الاصطناعي.',
      pdfFileName: editPdfFileName || `${editTitle}.pdf`,
      chapters: parsedChapters.length > 0 ? parsedChapters : [
        {
          id: `ch-${Date.now()}`,
          title: 'الباب الأول: مراجعة المنهج الفني',
          summary: 'محتوى تم استخلاصه ومعالجته بالذكاء الاصطناعي لطلاب مدرسة مياه الشرب.',
          keyPoints: ['التحكم في معدلات الضخ والترسيب.', 'الفحص الدوري لجودة المياه.']
        }
      ],
      questionsCount: 15,
      isCustom: true,
      createdAt: 'الآن',
    };

    onAddModule(newMod);
    setSelectedModuleId(newMod.id);
    setSelectedChapterId(newMod.chapters[0].id);
    setShowAddModal(false);
    soundEffects.playVictory();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentModule || !editTitle.trim()) return;

    const updated: TextbookModule = {
      ...currentModule,
      title: editTitle,
      code: editCode,
      specialty: editSpecialty,
      grade: editGrade,
      description: editDescription,
      pdfFileName: editPdfFileName || currentModule.pdfFileName,
    };

    onUpdateModule(updated);
    setShowEditModal(false);
    soundEffects.playCorrect();
  };

  const handleDelete = (id: string) => {
    onDeleteModule(id);
    setDeleteConfirmId(null);
    const remaining = modules.filter((m) => m.id !== id);
    if (remaining.length > 0) {
      setSelectedModuleId(remaining[0].id);
      setSelectedChapterId(remaining[0].chapters[0]?.id || '');
    }
    soundEffects.playClick();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-100">
              إدارة وتصفح الكتب والمناهج الدراسية
            </h2>
            <p className="text-xs text-slate-400">
              حرية كاملة لرفع كتبك بصيغة PDF، مع إمكانية تعديل وحذف المواد في أي وقت
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/40 active:scale-95 transition-all flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>رفع كتاب / مادة دراسية جديدة (PDF) 📱</span>
        </button>
      </div>

      {/* Modules Selector Carousel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {modules.map((mod) => {
          const isSelected = mod.id === selectedModuleId;
          return (
            <div
              key={mod.id}
              className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 relative group ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/40 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-400/50'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              <button
                onClick={() => {
                  setSelectedModuleId(mod.id);
                  setSelectedChapterId(mod.chapters[0]?.id || '');
                  soundEffects.playClick();
                }}
                className="w-full text-right"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    {mod.code}
                  </span>
                  <span className="text-[10px] text-slate-400">{mod.grade}</span>
                </div>
                <h4
                  className={`font-bold text-xs sm:text-sm line-clamp-2 ${
                    isSelected ? 'text-cyan-200' : 'text-slate-200'
                  }`}
                >
                  {mod.title}
                </h4>
                <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                  <span>{mod.chapters.length} أبواب فنية</span>
                  {mod.isCustom && (
                    <span className="text-amber-400 font-semibold">مخصص ★</span>
                  )}
                </div>
              </button>

              {/* Module Manage Icons on hover */}
              <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-800/80">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(mod);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
                  title="تعديل بيانات المادة"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(mod.id);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                  title="حذف المادة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Chapter Viewer & Details */}
      {currentModule ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chapters Navigation List */}
          <div className="lg:col-span-4 space-y-2">
            <div className="px-2 py-1 text-xs font-bold text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>أبواب وفصول المقرر:</span>
              </span>
              <button
                onClick={() => openEditModal(currentModule)}
                className="text-cyan-400 hover:text-cyan-300 text-[11px] flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>تعديل المادة</span>
              </button>
            </div>

            {currentModule.chapters.map((ch, idx) => {
              const isSelected = ch.id === currentChapter?.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setSelectedChapterId(ch.id);
                    soundEffects.playClick();
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-100 font-semibold'
                      : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm truncate">{ch.title}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 -scale-x-100 flex-shrink-0" />
                </button>
              );
            })}

            {/* Quick Quiz on this module button */}
            <button
              onClick={() => onOpenQuizForModule(currentModule.id)}
              className="w-full mt-4 py-3 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-950 flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>بدء اختبار مخصص على هذا المقرر ({currentModule.questionsCount} سؤال)</span>
            </button>
          </div>

          {/* Chapter Details Content Panel */}
          <div className="lg:col-span-8">
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-cyan-500/20 relative shadow-xl shadow-cyan-950/10">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-6">
                <div>
                  <span className="text-xs font-semibold text-cyan-400 block mb-1">
                    {currentModule.title} ({currentModule.specialty})
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    {currentChapter?.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReadSummary}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                      isReadingSummary
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                        : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-500/30'
                    }`}
                    title="قراءة ملخص الفصل صوتياً"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{isReadingSummary ? 'إيقاف النطق' : 'قراءة صوتية 🔊'}</span>
                  </button>

                  <button
                    onClick={() =>
                      currentChapter &&
                      onAskTutorAboutChapter(currentChapter.title, currentChapter.summary)
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-200 border border-cyan-600/40 text-xs font-medium transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ناقش مع المدرس الذكي</span>
                  </button>
                </div>
              </div>

              {/* Page Number & Scope Indicator */}
              {currentChapter && (
                <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                  <span className="font-bold text-cyan-300 font-mono">
                    ص {currentChapter.pageStart} - {currentChapter.pageEnd}
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">
                    من إجمالي {currentModule.totalPages || 100} صفحة من النسخة الأصلية
                  </span>
                </div>
              )}

              {/* View Mode Toggle: Summary vs Original Text */}
              <div className="flex items-center gap-2 mb-4 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs w-fit">
                <button
                  type="button"
                  onClick={() => soundEffects.playClick()}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-bold shadow-sm"
                >
                  ⚡ التلخيص الذكي للمفاهيم
                </button>
                <button
                  type="button"
                  onClick={() => soundEffects.playClick()}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200"
                >
                  📖 النص الأصلي من الكتاب (ص {currentChapter?.pageStart}-{currentChapter?.pageEnd})
                </button>
              </div>

              {/* Summary and Original Text Display */}
              <div className="mb-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    ملخص الباب العلمي (مع الحفاظ على المفاهيم الفنية):
                  </h4>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    {currentChapter?.summary}
                  </p>
                </div>

                {currentChapter?.originalExcerpt && (
                  <div>
                    <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>مقتبس من النسخة الأصلية للكتاب (ص {currentChapter.pageStart}-{currentChapter.pageEnd}):</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-cyan-950/20 p-4 rounded-2xl border border-cyan-500/30 font-serif italic">
                      "{currentChapter.originalExcerpt}"
                    </p>
                  </div>
                )}
              </div>

              {/* Key Practical Points */}
              <div>
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" /> أهم المفاهيم الفنية الميدانية:
                </h4>
                <div className="space-y-2.5">
                  {currentChapter?.keyPoints.map((point, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs sm:text-sm text-slate-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer PDF Info */}
              <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{currentModule.pdfFileName}</span>
                </span>
                <span className="text-emerald-400 font-semibold">
                  ✓ محفوظ في ذاكرة الهاتف (Offline Ready)
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 glass-card rounded-2xl">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm mb-4">لا توجد مواد دراسية حالياً.</p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-cyan-600 rounded-xl text-white text-xs font-bold"
          >
            إضافة كتاب دراسي جديد
          </button>
        </div>
      )}

      {/* Add New Textbook / PDF Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-cyan-500/30 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">
                  رفع كتاب أو مذكرة دراسية جديدة من الهاتف
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs sm:text-sm">
              {/* PDF Picker */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  اختر ملف الـ PDF من هاتفك أو جهازك:
                </label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/30 rounded-2xl cursor-pointer transition-colors text-center">
                  <FileUp className="w-7 h-7 text-cyan-400 mb-1" />
                  <span className="font-semibold text-cyan-200">
                    {editPdfFileName || 'اضغط هنا لرفع ملف PDF من الهاتف'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    كتب ومذكرات مناهج مياه الشرب والصرف الصحي
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.txt,.doc"
                    className="hidden"
                    onChange={handlePdfUpload}
                  />
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المادة / الكتاب *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="مثال: هندسة صيانة الطلمبات والمحابس"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">المرحلة الدراسية</label>
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="الصف الأول">الصف الأول</option>
                    <option value="الصف الثاني">الصف الثاني</option>
                    <option value="الصف الثالث">الصف الثالث</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الشعبة الفنية</label>
                  <select
                    value={editSpecialty}
                    onChange={(e) => setEditSpecialty(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="تشغيل محطات مياه">تشغيل محطات مياه</option>
                    <option value="شبكات مياه">شبكات مياه</option>
                    <option value="معالجة صرف صحي">معالجة صرف صحي</option>
                    <option value="معامل كيمياء">معامل كيمياء</option>
                    <option value="ميكانيكا وكهرباء">ميكانيكا وكهرباء</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  أبواب المنهج (اكتب كل باب في سطر):
                </label>
                <textarea
                  rows={3}
                  value={editChaptersText}
                  onChange={(e) => setEditChaptersText(e.target.value)}
                  placeholder="الباب الأول: عنوان الباب&#10;الباب الثاني: عنوان الباب..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs font-mono"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isUploadingPdf || !editTitle.trim()}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>معالجة وحفظ المادة بالذكاء الاصطناعي</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-cyan-500/30 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-base text-white">تعديل بيانات المادة الدراسية</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المادة</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">المرحلة</label>
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="الصف الأول">الصف الأول</option>
                    <option value="الصف الثاني">الصف الثاني</option>
                    <option value="الصف الثالث">الصف الثالث</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الشعبة</label>
                  <select
                    value={editSpecialty}
                    onChange={(e) => setEditSpecialty(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="تشغيل محطات مياه">تشغيل محطات مياه</option>
                    <option value="شبكات مياه">شبكات مياه</option>
                    <option value="معالجة صرف صحي">معالجة صرف صحي</option>
                    <option value="معامل كيمياء">معامل كيمياء</option>
                    <option value="ميكانيكا وكهرباء">ميكانيكا وكهرباء</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الوصف</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 border border-rose-500/40 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white mb-2">
              تأكيد حذف المادة الدراسية؟
            </h3>
            <p className="text-xs text-slate-300 mb-5">
              هل أنت متأكد من حذف هذه المادة؟ يمكنك إعادة رفعها أو إضافة غيرها في أي وقت بحرية كاملة.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                تراجع
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950"
              >
                نعم، احذف المادة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
