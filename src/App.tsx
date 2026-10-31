/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  FileQuestion,
  BookOpen,
  BarChart3,
  Bot,
  Droplets,
  Flame,
  Sparkles,
  Trophy,
  Users,
  Compass,
  ShieldCheck,
  CheckCircle2,
  Radio,
  Bell,
  Settings,
  Camera,
  Smartphone,
  Download,
} from 'lucide-react';

import {
  INITIAL_MODULES,
  INITIAL_QUESTIONS,
  INITIAL_COMMUNITY_DOCS,
} from './data/curriculumData';
import { Question, UploadedPDFDocument, TextbookModule, QuizCustomConfig } from './types';
import { SmartOrbLive } from './components/SmartOrbLive';
import { PageRangeQuizBuilder } from './components/PageRangeQuizBuilder';
import { InteractiveQuizBank } from './components/InteractiveQuizBank';
import { TextbookReader } from './components/TextbookReader';
import { StudyStatistics } from './components/StudyStatistics';
import { CrowdsourcedLibrary } from './components/CrowdsourcedLibrary';
import { MindMapsViewer } from './components/MindMapsViewer';
import { PermissionsCenter } from './components/PermissionsCenter';
import { APKExportModal } from './components/APKExportModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { NotificationsCenter } from './components/NotificationsCenter';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { CameraBookExplainerModal } from './components/CameraBookExplainerModal';
import { soundEffects } from './utils/audioEffects';
import { applyThemeToDOM, getThemeSettings } from './utils/themeManager';

export default function App() {
  const [isAPKModalOpen, setIsAPKModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // Initialize custom UI colors and theme on mount
  useEffect(() => {
    applyThemeToDOM(getThemeSettings());
  }, []);
  // 5 Streamlined Pages - Statistics is now the primary landing dashboard:
  // 1. statistics: الواجهة الرئيسية ومتابعة الإحصائيات والأداء الدراسي والتنبيهات
  // 2. quiz: أداء الاختبار والتصحيح الفوري بالذكاء الاصطناعي
  // 3. builder: صانع وتخصيص الاختبار وتحديد الصفحات بدقة
  // 4. library: إدارة المكتبة والكتب والتلخيص مع الحفاظ على الأصل
  // 5. tutor: المساعد الذكي الصوتي Gemini Live والكورة التفاعلية
  const [activeTab, setActiveTab] = useState<
    'builder' | 'quiz' | 'library' | 'statistics' | 'tutor' | 'community' | 'mindmap' | 'permissions'
  >('statistics');

  // Shared state
  const [modules, setModules] = useState<TextbookModule[]>(INITIAL_MODULES);
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [communityDocs, setCommunityDocs] = useState<UploadedPDFDocument[]>(
    INITIAL_COMMUNITY_DOCS
  );
  const [studentPoints, setStudentPoints] = useState<number>(140);

  // Active context for Smart Orb Live
  const [openDocumentTitle, setOpenDocumentTitle] = useState<string>(
    'تشغيل وصيانة محطات تنقية مياه الشرب'
  );
  const [currentQuestionText, setCurrentQuestionText] = useState<string>(
    'ما هو الاختبار المعملي الأساسي لتحديد جرعة الشبة؟'
  );

  const handleAddScore = (pts: number) => {
    setStudentPoints((prev) => prev + pts);
  };

  // Callback from Page 1 (Quiz Builder with Exact Pages):
  const handleStartCustomQuiz = (config: QuizCustomConfig) => {
    const selectedMod = modules.find((m) => m.id === config.selectedModuleId) || modules[0];
    setOpenDocumentTitle(`${selectedMod.title} (ص ${config.startPage}-${config.endPage})`);

    // Filter questions matching page range & type
    const matching = questions.filter((q) => {
      const typeMatch = config.selectedTypes.includes(q.type);
      const diffMatch = config.selectedDifficulties.includes(q.difficulty);
      const subjectMatch = q.subjectId === config.selectedModuleId || q.subjectId === 'water-treatment-plants';
      return typeMatch && diffMatch;
    });

    const finalSet = matching.length > 0 ? matching.slice(0, config.questionCount) : questions.slice(0, config.questionCount);
    setActiveQuizQuestions(finalSet);

    // Smoothly navigate to Page 2 (Quiz Player)
    setActiveTab('quiz');
    soundEffects.playLiveActivate();
  };

  const handleOpenQuizForModule = (moduleId: string) => {
    const mod = modules.find((m) => m.id === moduleId);
    if (mod) {
      setOpenDocumentTitle(mod.title);
    }
    setActiveTab('quiz');
    soundEffects.playClick();
  };

  const handleAskTutorAboutContext = (title: string, summary?: string) => {
    setOpenDocumentTitle(title);
    setActiveTab('tutor');
    soundEffects.playLiveActivate();
  };

  // Module Management (Add, Edit, Delete)
  const handleAddModule = (newMod: TextbookModule) => {
    setModules((prev) => [newMod, ...prev]);
  };

  const handleUpdateModule = (updated: TextbookModule) => {
    setModules((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleDeleteModule = (id: string) => {
    setModules((prev) => prev.filter((m) => m.id !== id));
  };

  const handleUploadDocument = (newDoc: UploadedPDFDocument) => {
    setCommunityDocs((prev) => [newDoc, ...prev]);
    if (newDoc.extractedQuestions && newDoc.extractedQuestions.length > 0) {
      setQuestions((prev) => [...newDoc.extractedQuestions, ...prev]);
    }
  };

  interface NavItem {
    id: 'builder' | 'quiz' | 'library' | 'statistics' | 'tutor';
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    number: string;
  }

  // The 5 Core Pages laid out horizontally side-by-side (Statistics is #1 Home View)
  const coreNavItems: NavItem[] = [
    {
      id: 'statistics',
      number: '1',
      label: 'الواجهة الرئيسية: الإحصائيات والأداء',
      shortLabel: 'الرئيسية (الإحصائيات)',
      icon: BarChart3,
      badge: 'الرئيسية',
    },
    {
      id: 'quiz',
      number: '2',
      label: 'بنك الأسئلة والتصحيح الفوري',
      shortLabel: 'بنك الأسئلة',
      icon: FileQuestion,
      badge: 'تصحيح AI',
    },
    {
      id: 'builder',
      number: '3',
      label: 'تخصيص الاختبار والصفحات',
      shortLabel: 'صانع الاختبار',
      icon: Sliders,
      badge: 'تحديد دقيق',
    },
    {
      id: 'library',
      number: '4',
      label: 'المكتبة والتلخيص الذكي',
      shortLabel: 'المكتبة والتلخيص',
      icon: BookOpen,
      badge: 'حفظ الأصل',
    },
    {
      id: 'tutor',
      number: '5',
      label: 'المساعد الصوتي Gemini Live',
      shortLabel: 'المساعد الصوتي',
      icon: Bot,
      badge: 'Google Live',
    },
  ];

  const getScreenTitleArabic = () => {
    switch (activeTab) {
      case 'statistics':
        return 'الواجهة الرئيسية: متابعة الإحصائيات والأداء الدراسي وتنبيهات الامتحانات';
      case 'quiz':
        return 'الصفحة 2: بنك الأسئلة والتصحيح الفوري بالذكاء الاصطناعي';
      case 'builder':
        return 'الصفحة 3: صانع الاختبار وتحديد الصفحات الأصلية بدقة';
      case 'library':
        return 'الصفحة 4: إدارة المكتبة والتلخيص مع الحفاظ على الأصل';
      case 'tutor':
        return 'الصفحة 5: المساعد الذكي الصوتي Gemini Live والكورة التفاعلية';
      case 'community':
        return 'المكتبة التشاركية لطلاب المدرسة';
      case 'mindmap':
        return 'الخرائط الذهنية لمراحل المعالجة';
      case 'permissions':
        return 'مركز الصلاحيات والنظام المستقل';
      default:
        return 'الرئيسية';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white pb-28 sm:pb-32">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-30 glass-nav border-b border-cyan-500/20 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & School Branding */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 overflow-hidden">
              <span className="absolute inset-0 bg-white/20 animate-pulse"></span>
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-white">
                  قطرة AI
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  منظومة الـ 5 صفحات
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                مدرسة مياه الشرب والصرف الصحي بأسيوط
              </p>
            </div>
          </div>

          {/* Gamification Stats & Quick Tools */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900 border border-slate-800">
              <Trophy className="w-4 h-4 text-amber-400" />
              <div className="text-right">
                <div className="text-[10px] text-slate-400">الرصيد الدراسي</div>
                <div className="text-xs font-black text-amber-400 font-mono">
                  {1420 + studentPoints} نقطة
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900 border border-slate-800">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span className="text-xs font-bold text-orange-300">8 أيام التزام</span>
            </div>

            {/* Quick tools: Community, Mindmap, Permissions */}
            <div className="flex items-center gap-1.5 pr-2 sm:border-r border-slate-800">
              <button
                onClick={() => {
                  setActiveTab('mindmap');
                  soundEffects.playClick();
                }}
                className={`p-2 rounded-xl text-xs transition-colors ${
                  activeTab === 'mindmap'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-900'
                }`}
                title="الخرائط الذهنية"
              >
                <Compass className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setActiveTab('community');
                  soundEffects.playClick();
                }}
                className={`p-2 rounded-xl text-xs transition-colors ${
                  activeTab === 'community'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-900'
                }`}
                title="المكتبة التشاركية"
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setActiveTab('permissions');
                  soundEffects.playClick();
                }}
                className={`p-2 rounded-xl text-xs transition-colors ${
                  activeTab === 'permissions'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-900'
                }`}
                title="صلاحيات وتنزيل APK"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>

              {/* Smart Notifications & Reminders Bell Button */}
              <button
                onClick={() => {
                  setIsNotificationsModalOpen(true);
                  soundEffects.playClick();
                }}
                className="relative p-2 rounded-xl text-xs transition-colors text-slate-400 hover:text-amber-300 hover:bg-slate-900"
                title="إشعارات المذاكرة وتنبيهات الامتحانات المسبقة"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500"></span>
              </button>

              {/* Camera Scanner for Book Problems & Notes */}
              <button
                onClick={() => {
                  setIsCameraModalOpen(true);
                  soundEffects.playClick();
                }}
                className="p-2 rounded-xl text-xs transition-colors text-slate-400 hover:text-cyan-300 hover:bg-slate-900"
                title="التقاط صورة مسألة من الكتاب وشرحها بالكاميرا 📷"
              >
                <Camera className="w-4 h-4 text-cyan-400" />
              </button>

              {/* Theme & Custom Colors & Voice Settings Icon */}
              <button
                onClick={() => {
                  setIsThemeModalOpen(true);
                  soundEffects.playClick();
                }}
                className="p-2 rounded-xl text-xs transition-colors text-slate-400 hover:text-cyan-300 hover:bg-slate-900"
                title="تخصيص الألوان يدويًا وصوت المساعد (الإعدادات) ⚙️"
              >
                <Settings className="w-4 h-4 text-slate-300 hover:rotate-45 transition-transform" />
              </button>
            </div>

            {/* In-App APK / PWA Install Button */}
            <PWAInstallButton onOpenAPKModal={() => setIsAPKModalOpen(true)} />
          </div>
        </div>
      </header>

      {/* Main Content Area: 5 Core Pages */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Standalone APK Build & Export Highlight Banner */}
        <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-cyan-950/80 via-blue-950/70 to-slate-900 border border-cyan-500/40 shadow-xl shadow-cyan-950/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 flex-shrink-0 animate-pulse">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">
                  حزمة تطبيق قطرة AI بصيغة APK المستقلة
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                  جاهز للتحميل الفوري
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                نظام تشغيل ذاتي ومستقل أوفلاين، متوافق مع جميع هواتف وتابلت أندرويد لطلاب مدرسة مياه أسيوط
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAPKModalOpen(true);
              soundEffects.playClick();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95 flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            بدء التثبيت وتحميل APK الآن
          </button>
        </div>

        {/* Page 1: Exact Page-Range & Custom Quiz Builder */}
        {activeTab === 'builder' && (
          <PageRangeQuizBuilder
            modules={modules}
            onStartCustomQuiz={handleStartCustomQuiz}
          />
        )}

        {activeTab === 'quiz' && (
          <InteractiveQuizBank
            questions={activeQuizQuestions}
            currentSubjectFilter={openDocumentTitle}
            onSelectQuestionContext={(qText) => setCurrentQuestionText(qText)}
            onAddScore={handleAddScore}
            onUpdateQuizQuestions={(newQs, title) => {
              setActiveQuizQuestions(newQs);
              if (title) setOpenDocumentTitle(title);
            }}
          />
        )}

        {/* Page 3: Library Management & Smart Summarization Preserving Original */}
        {activeTab === 'library' && (
          <TextbookReader
            modules={modules}
            onOpenQuizForModule={handleOpenQuizForModule}
            onAskTutorAboutChapter={handleAskTutorAboutContext}
            onAddModule={handleAddModule}
            onUpdateModule={handleUpdateModule}
            onDeleteModule={handleDeleteModule}
          />
        )}

        {/* Page 1 (Main Dashboard): Study Statistics & Performance Analytics */}
        {activeTab === 'statistics' && (
          <StudyStatistics
            studentPoints={studentPoints}
            onStartReTest={(retestQuestions, title) => {
              setActiveQuizQuestions(retestQuestions);
              setOpenDocumentTitle(title || 'إعادة اختبار بنك الأخطاء المتكررة 🎯');
              setActiveTab('quiz');
              soundEffects.playLiveActivate();
            }}
            onAskTutor={(questionText) => {
              setCurrentQuestionText(questionText);
              setOpenDocumentTitle('مراجعة سؤال متعثر: ' + questionText.slice(0, 30) + '...');
              setActiveTab('tutor');
              soundEffects.playLiveActivate();
            }}
            onStartExamPrep={(subject, examTitle) => {
              const matching = questions.filter(
                (q) => q.chapterTitle.includes(subject) || q.subjectId === 'water-treatment-plants'
              );
              setActiveQuizQuestions(matching.length > 0 ? matching.slice(0, 10) : questions.slice(0, 10));
              setOpenDocumentTitle(`اختبار تحضيري لامتحان: ${examTitle}`);
              setActiveTab('quiz');
              soundEffects.playLiveActivate();
            }}
          />
        )}

        {/* Page 5: AI Voice Tutor & Gemini Live Stage */}
        {activeTab === 'tutor' && (
          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-cyan-500/30 relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                      <Bot className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                      الصفحة 5 • المساعد الذكي Google Live
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">
                    المدرس الصوتي المباشر والكورة التفاعلية
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    تحدث بلسانك بالصوت اللحظي السريع مع المدرس الذكي، مع وعي كامل بالكتاب والصفحة المفتوحة حالياً!
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                    وعي الشاشة: {openDocumentTitle}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center py-10 glass-card rounded-3xl border border-slate-800">
              <div className="w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto mb-4 animate-orb-glow">
                <Radio className="w-10 h-10 text-cyan-300 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                المحادثة الصوتية المباشرة (Gemini Live)
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mb-6 max-w-md mx-auto">
                اضغط على الكورة الذكية في أسفل الشاشة لبدء محادثة Gemini Live الصوتية الفورية ومناقشة أي درس أو سؤال.
              </p>
              <button
                onClick={() => soundEffects.playLiveActivate()}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-xl shadow-cyan-950 transition-all active:scale-95"
              >
                تنشيط الكورة والمحادثة الصوتية الحية 🎙️
              </button>
            </div>
          </div>
        )}

        {/* Auxiliary Views (accessible from top bar icons) */}
        {activeTab === 'community' && (
          <CrowdsourcedLibrary
            documents={communityDocs}
            onUploadDocument={handleUploadDocument}
            onStartQuizFromDoc={(doc) => {
              if (doc.extractedQuestions?.length > 0) {
                setActiveQuizQuestions(doc.extractedQuestions);
              }
              setOpenDocumentTitle(doc.title);
              setActiveTab('quiz');
            }}
          />
        )}

        {activeTab === 'mindmap' && (
          <MindMapsViewer onAskTutorAboutNode={handleAskTutorAboutContext} />
        )}

        {activeTab === 'permissions' && (
          <PermissionsCenter onOpenAPKModal={() => setIsAPKModalOpen(true)} />
        )}
      </main>

      {/* APK Export & PWA Installation Modal */}
      <APKExportModal
        isOpen={isAPKModalOpen}
        onClose={() => setIsAPKModalOpen(false)}
      />

      {/* Smart Study Reminders & Advance Exam Alerts Modal */}
      <NotificationsCenter
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        onStartExamPrep={(subject, examTitle) => {
          const matching = questions.filter(
            (q) => q.chapterTitle.includes(subject) || q.subjectId === 'water-treatment-plants'
          );
          setActiveQuizQuestions(matching.length > 0 ? matching.slice(0, 10) : questions.slice(0, 10));
          setOpenDocumentTitle(`اختبار تحضيري لامتحان: ${examTitle}`);
          setActiveTab('quiz');
          setIsNotificationsModalOpen(false);
          soundEffects.playLiveActivate();
        }}
      />

      {/* Granular UI Colors Theme Customizer & AI Voice Persona Settings Modal */}
      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Camera Book Explainer Modal (Capture textbook problems directly) */}
      <CameraBookExplainerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onAddQuestionToQuiz={(newQ) => {
          setQuestions((prev) => [newQ, ...prev]);
          setActiveQuizQuestions((prev) => [newQ, ...prev]);
          setActiveTab('quiz');
          setOpenDocumentTitle(`مسألة مشروحة بالكاميرا: ${newQ.chapterTitle}`);
          soundEffects.playLiveActivate();
        }}
      />

      {/* Floating Persistent Google Live Smart Orb & AI Tutor */}
      <SmartOrbLive
        currentScreen={getScreenTitleArabic()}
        openDocumentTitle={openDocumentTitle}
        currentQuestion={currentQuestionText}
        studentGrade="الصف الثاني - تشغيل محطات وشبكات"
        onOpenQuestion={(qText) => setCurrentQuestionText(qText)}
      />

      {/* ========================================================
          HORIZONTAL BOTTOM NAVIGATION BAR (FIXED AT SCREEN BOTTOM)
          تصميم الشريط الأفقي المثبت في أسفل الشاشة للتنقل السلس والمستمر
          ======================================================== */}
      <nav
        aria-label="شريط التنقل السفلي الثابت"
        className="fixed bottom-0 inset-x-0 z-50 bg-slate-950/90 backdrop-blur-2xl border-t border-cyan-500/25 shadow-2xl shadow-cyan-950"
      >
        <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 flex items-center justify-between gap-1 sm:gap-2">
          {coreNavItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  soundEffects.playClick();
                }}
                className={`relative flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-2xl transition-all duration-200 group ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-200 border border-cyan-400/50 shadow-lg shadow-cyan-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
                title={item.label}
              >
                {/* Active Top Glowing Accent Indicator */}
                {isSelected && (
                  <span className="absolute -top-[9px] inset-x-4 h-1 bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 rounded-full shadow-lg shadow-cyan-400/80"></span>
                )}

                {/* Number Badge */}
                <span
                  className={`w-4 h-4 rounded-full text-[9px] font-black font-mono flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-cyan-400 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-400 group-hover:text-cyan-300'
                  }`}
                >
                  {item.number}
                </span>

                {/* Icon */}
                <Icon
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0 transition-transform ${
                    isSelected ? 'text-cyan-300 scale-110' : 'group-hover:scale-105'
                  }`}
                />

                {/* Label (Responsive) */}
                <span
                  className={`text-[10px] sm:text-xs font-bold truncate transition-colors ${
                    isSelected ? 'text-white font-extrabold' : 'text-slate-400'
                  }`}
                >
                  <span className="hidden sm:inline">{item.shortLabel}</span>
                  <span className="sm:hidden">{item.shortLabel}</span>
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
