import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Download,
  Flame,
  Target,
  AlertTriangle,
  RotateCcw,
  Play,
  Bot,
  Filter,
  Search,
  Check,
  Sparkles,
  HelpCircle,
  BookOpen,
  CheckSquare,
  Trash2,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  Bell,
  Calendar,
  Volume2,
  ArrowRight,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { INITIAL_STUDENT_STATS } from '../data/curriculumData';
import { Question, MistakenQuestionRecord, ExamReminder, StudyScheduleConfig } from '../types';
import { soundEffects } from '../utils/audioEffects';
import {
  getMistakenRecords,
  markAsMastered,
  removeMistakenRecord,
  resetToDefaultMistakes,
  clearAllMistakes,
} from '../utils/mistakeTracker';
import {
  getExamReminders,
  getStudyScheduleConfig,
  calculateTimeRemaining,
  sendSmartNotification,
} from '../utils/reminderManager';
import { NotificationsCenter } from './NotificationsCenter';

interface StudyStatisticsProps {
  studentPoints?: number;
  onStartReTest?: (questions: Question[], title?: string) => void;
  onAskTutor?: (questionText: string) => void;
  onStartExamPrep?: (subject: string, title: string) => void;
  initialSubTab?: 'overview' | 'mistakes' | 'reminders';
}

export const StudyStatistics: React.FC<StudyStatisticsProps> = ({
  studentPoints = 140,
  onStartReTest,
  onAskTutor,
  onStartExamPrep,
  initialSubTab = 'overview',
}) => {
  // 3 Sub-pages:
  // 1. 'overview': لوحة المؤشرات والتحصيل العام
  // 2. 'mistakes': بنك الأسئلة المتعثرة والأخطاء المتكررة
  // 3. 'reminders': التنبيهات ومواعيد المذاكرة والامتحانات
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'mistakes' | 'reminders'>(
    initialSubTab
  );

  // Mistake bank state
  const [records, setRecords] = useState<MistakenQuestionRecord[]>([]);
  const [filterRecurrence, setFilterRecurrence] = useState<
    'all' | 'repeated2' | 'critical3' | 'unmastered' | 'mastered'
  >('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // Reminders quick state for overview banner
  const [upcomingExams, setUpcomingExams] = useState<ExamReminder[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<StudyScheduleConfig>(
    getStudyScheduleConfig()
  );

  // Load records and exams from storage
  const loadData = () => {
    setRecords(getMistakenRecords());
    setUpcomingExams(getExamReminders());
    setScheduleConfig(getStudyScheduleConfig());
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = INITIAL_STUDENT_STATS;
  const currentTotalPoints = stats.pointsEarned + studentPoints;

  // Filtered records based on active criteria
  const filteredRecords = records.filter((rec) => {
    if (filterRecurrence === 'repeated2' && rec.mistakeCount < 2) return false;
    if (filterRecurrence === 'critical3' && rec.mistakeCount < 3) return false;
    if (filterRecurrence === 'unmastered' && rec.mastered) return false;
    if (filterRecurrence === 'mastered' && !rec.mastered) return false;

    if (filterSubject !== 'all' && rec.question.subjectId !== filterSubject) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = rec.question.questionText.toLowerCase().includes(q);
      const matchChapter = rec.question.chapterTitle.toLowerCase().includes(q);
      const matchNote = rec.practicalTip?.toLowerCase().includes(q) || false;
      const matchAnswer = rec.modelAnswerText?.toLowerCase().includes(q) || false;
      if (!matchText && !matchChapter && !matchNote && !matchAnswer) {
        return false;
      }
    }

    return true;
  });

  // Calculate high-level mistake bank statistics
  const totalMistakesCount = records.length;
  const criticalCount = records.filter((r) => r.mistakeCount >= 2 && !r.mastered).length;
  const masteredCount = records.filter((r) => r.mastered).length;

  // Nearest uncompleted exam for overview reminder
  const nextExam = upcomingExams.find((e) => !e.completed) || upcomingExams[0];
  const nextExamCountdown = nextExam
    ? calculateTimeRemaining(nextExam.date, nextExam.time)
    : null;

  // Toggle mastered status
  const handleToggleMastered = (id: string, currentStatus: boolean) => {
    const updated = markAsMastered(id, !currentStatus);
    setRecords(updated);
    if (!currentStatus) {
      soundEffects.playVictory();
    } else {
      soundEffects.playClick();
    }
  };

  // Remove individual record
  const handleRemoveRecord = (id: string) => {
    soundEffects.playClick();
    const updated = removeMistakenRecord(id);
    setRecords(updated);
  };

  // Reset to default sample mistakes
  const handleResetDefaults = () => {
    soundEffects.playClick();
    const updated = resetToDefaultMistakes();
    setRecords(updated);
  };

  // Clear all mistakes
  const handleClearAll = () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      return;
    }
    clearAllMistakes();
    setRecords([]);
    setIsConfirmingClear(false);
    soundEffects.playClick();
    setExportSuccessMessage('تم تفريغ سجل الأخطاء المتعثرة بنجاح.');
    setTimeout(() => setExportSuccessMessage(null), 3500);
  };

  // Launch Re-test for all currently filtered mistaken questions
  const handleStartAllReTest = () => {
    const questionsToTest =
      filteredRecords.length > 0
        ? filteredRecords.map((r) => r.question)
        : records.map((r) => r.question);

    if (questionsToTest.length === 0) {
      setExportSuccessMessage('⚠️ لا توجد أسئلة متعثرة في التصفية الحالية لإعادة اختبارها.');
      setTimeout(() => setExportSuccessMessage(null), 4000);
      return;
    }

    soundEffects.playLiveActivate();
    if (onStartReTest) {
      onStartReTest(
        questionsToTest,
        `إعادة اختبار: بنك الأخطاء المتكررة (${questionsToTest.length} أسئلة) 🎯`
      );
    }
  };

  // Re-test single specific question
  const handleTestSingleQuestion = (question: Question) => {
    soundEffects.playLiveActivate();
    if (onStartReTest) {
      onStartReTest([question], `إعادة اختبار مكثف: ${question.chapterTitle} 🎯`);
    }
  };

  // Export Mistake Bank as a formatted PDF Revision Sheet
  const handleExportMistakesPDF = () => {
    setIsExportingPdf(true);
    soundEffects.playClick();

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setTextColor(56, 189, 248); // sky-400
      doc.setFontSize(16);
      doc.text('Qatrah AI - School of Water & Wastewater (Asyut)', pageWidth / 2, 16, {
        align: 'center',
      });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.text('Personalized Mistake & Revision Sheet - Bank of Errors', pageWidth / 2, 26, {
        align: 'center',
      });

      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFontSize(9);
      doc.text(
        `Student: Seif El-Asyouti | Questions: ${filteredRecords.length} | Date: ${new Date().toLocaleDateString('ar-EG')}`,
        pageWidth / 2,
        34,
        { align: 'center' }
      );

      yPos = 50;

      // Iterate over questions
      filteredRecords.forEach((rec, idx) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, yPos, pageWidth - 30, 42, 3, 3, 'F');
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(15, yPos, pageWidth - 30, 42, 3, 3, 'S');

        doc.setFontSize(10);
        doc.setTextColor(225, 29, 72); // rose-600
        doc.text(
          `[ Question ${idx + 1} - Repeated Mistakes: ${rec.mistakeCount} times ]`,
          20,
          yPos + 8
        );

        doc.setTextColor(71, 85, 105);
        doc.text(`Subject: ${rec.question.subjectId} | ${rec.question.chapterTitle}`, 20, yPos + 14);

        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        const splitText = doc.splitTextToSize(`Q: ${rec.question.questionText}`, pageWidth - 40);
        doc.text(splitText, 20, yPos + 21);

        doc.setTextColor(13, 148, 136); // teal-600
        const answerText = `Correct Answer: ${rec.modelAnswerText || rec.question.explanation}`;
        const splitAns = doc.splitTextToSize(answerText, pageWidth - 40);
        doc.text(splitAns, 20, yPos + 32);

        yPos += 48;
      });

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Generated via Qatrah AI Autonomous Learning System - Asyut Vocational High School',
        pageWidth / 2,
        287,
        { align: 'center' }
      );

      doc.save(`بنك_أخطاء_الطالب_سيف_الأسيوطي_${Date.now()}.pdf`);
      setExportSuccessMessage('تم تصدير ورقة مراجعة الأخطاء بصيغة PDF بنجاح!');
      setTimeout(() => setExportSuccessMessage(null), 4000);
      soundEffects.playVictory();
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportGeneralReport = () => {
    soundEffects.playVictory();
    setExportSuccessMessage(
      '✅ تم إعداد تقرير الأداء الدراسي الأسبوعي بنجاح! الطالب: سيف الأسيوطي | ساعات المذاكرة: 24.5 ساعة | نسبة الدقة: 86%'
    );
    setTimeout(() => setExportSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Sub-Navigation Tabs */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-cyan-500/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                <BarChart3 className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                الواجهة الرئيسية: لوحة التحصيل ومتابعة الأداء الدراسي والتنبيهات
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              لوحة الإحصائيات والإنجاز الأكاديمي • سيف الأسيوطي
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              متابعة دقيقة لمؤشرات الفهم، إشعارات المذاكرة الذكية، تنبيهات الامتحانات المسبقة، وبنك الأسئلة المتعثرة
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {activeSubTab === 'overview' ? (
              <button
                onClick={handleExportGeneralReport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>تصدير تقرير الأداء (PDF) 📄</span>
              </button>
            ) : activeSubTab === 'mistakes' ? (
              <button
                onClick={handleExportMistakesPDF}
                disabled={isExportingPdf || filteredRecords.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-amber-950 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingPdf ? 'جاري التصدير...' : 'تصدير ورقة الأخطاء (PDF) 📄'}</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Sub-Navigation Switcher (3 Sub-Pages: Overview, Mistake Bank, Notifications & Reminders) */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setActiveSubTab('overview');
              soundEffects.playClick();
            }}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
              activeSubTab === 'overview'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>لوحة المؤشرات والتحصيل العام</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('mistakes');
              soundEffects.playClick();
            }}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all relative ${
              activeSubTab === 'mistakes'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg shadow-rose-950/40'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            <span>بنك الأخطاء المتكررة والمراجعة المركزة</span>
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                {criticalCount} متعثرة
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveSubTab('reminders');
              soundEffects.playClick();
            }}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all relative ${
              activeSubTab === 'reminders'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-950/40'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Bell className="w-4 h-4 text-cyan-300" />
            <span>إشعارات المذاكرة وتنبيهات الامتحانات</span>
            {nextExamCountdown && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {nextExamCountdown.label}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Export Success Notification Banner */}
      {exportSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-400" />
            <span>{exportSuccessMessage}</span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-PAGE 1: OVERVIEW METRICS & PROMINENT ALERTS WIDGETS        */}
      {/* ============================================================== */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Smart Alerts & Quick Reminders Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Widget 1: Nearest Exam Alert */}
            {nextExam && nextExamCountdown && (
              <div className="glass-card rounded-2xl p-5 border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 to-blue-950/30 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-cyan-300">
                          الامتحان القادم والتنبيه المسبق
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-900/60 text-cyan-200 border border-cyan-700">
                          {nextExam.type}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-white mt-0.5 line-clamp-1">
                        {nextExam.title}
                      </h4>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-xl text-xs font-black font-mono bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 flex-shrink-0 animate-pulse">
                    {nextExamCountdown.label}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 text-[11px]">
                    📍 {nextExam.location} ({nextExam.time})
                  </span>

                  <div className="flex items-center gap-2">
                    {onStartExamPrep && (
                      <button
                        onClick={() => {
                          onStartExamPrep(nextExam.subject, nextExam.title);
                          soundEffects.playLiveActivate();
                        }}
                        className="px-3 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>تحضير فوري</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setActiveSubTab('reminders');
                        soundEffects.playClick();
                      }}
                      className="text-cyan-400 hover:text-cyan-300 text-[11px] font-bold flex items-center gap-0.5"
                    >
                      <span>كل المواعيد</span>
                      <ArrowRight className="w-3 h-3 rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Widget 2: Daily Study Schedule Alert */}
            <div className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-r from-amber-950/20 to-orange-950/20 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-300">
                        منبه المذاكرة اليومي الذكي
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        مفعل ✓
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      الساعة {scheduleConfig.dailyReminderTime} مساءً (يومياً)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-950/80 text-orange-300 border border-orange-800 text-xs font-bold font-mono">
                  <Flame className="w-3.5 h-3.5 fill-orange-400" />
                  <span>8 أيام</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 text-[11px] truncate max-w-[200px]">
                  مستهدف اليوم: {scheduleConfig.focusSubject}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      soundEffects.playNotificationChime();
                      sendSmartNotification(
                        `🔔 حان موعد مذاكرة اليوم: ${scheduleConfig.focusSubject}`,
                        `تذكير مدرسة مياه الشرب بأسيوط: حان وقت المذاكرة لمواصلة التميز!`
                      );
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>تجربة</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveSubTab('reminders');
                      soundEffects.playClick();
                    }}
                    className="text-amber-400 hover:text-amber-300 text-[11px] font-bold flex items-center gap-0.5"
                  >
                    <span>ضبط الجدول</span>
                    <ArrowRight className="w-3 h-3 rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex-shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400">ساعات المذاكرة التراكمية</div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                  {stats.totalStudyHours} ساعة
                </div>
                <div className="text-[10px] text-emerald-400 mt-1">↑ +4.5 س هذا الأسبوع</div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400">نسبة الدقة العامة</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">
                  {stats.accuracyPercentage}%
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  من {stats.totalQuestionsSolved} سؤالاً محلولاً
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400">الرصيد المدرسي التراكمي</div>
                <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5">
                  {currentTotalPoints}
                </div>
                <div className="text-[10px] text-amber-300 font-semibold mt-1">
                  المركز الأول بالمدرسة 👑
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-orange-500/20 flex-shrink-0 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex-shrink-0">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400">سلسلة الالتزام اليومي</div>
                <div className="text-xl sm:text-2xl font-black text-orange-400 font-mono mt-0.5">
                  {stats.streakDays} أيام
                </div>
                <div className="text-[10px] text-orange-300 mt-1">التزام متواصل بالداخلي</div>
              </div>
            </div>
          </div>

          {/* Performance by Subject & By Question Type */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Subject Mastery Progress Bars */}
            <div className="lg:col-span-7 glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-cyan-400" />
                  <span>معدل الإنجاز والدقة في كل مادة فنية</span>
                </h3>
                <span className="text-xs text-slate-400">مدرسة مياه الشرب بأسيوط</span>
              </div>

              <div className="space-y-4">
                {stats.masteryBySubject.map((subj, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">{subj.subjectName}</span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-cyan-300">{subj.solvedCount} سؤال</span>
                        <span className="text-emerald-400 font-bold">{subj.accuracy}% دقة</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${subj.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accuracy by Question Type */}
            <div className="lg:col-span-5 glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>دقة الإجابة حسب نوع السؤال</span>
                </h3>
              </div>

              <div className="space-y-3">
                {stats.accuracyByType.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-200">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.type === 'essay'
                          ? 'تصحيح مقالي دلالي بالذكاء الاصطناعي'
                          : item.type === 'fill_blank'
                          ? 'مصطلحات فنية دقيقة'
                          : 'تصحيح فوري'}
                      </div>
                    </div>
                    <div className="text-base font-black text-cyan-300 font-mono">
                      {item.accuracy}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Strengths & Diagnostic Weak Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strong Points */}
            <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 bg-emerald-950/10">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>نقاط القوة والإتقان الميداني لديك:</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {stats.strongPoints.map((point, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800"
                  >
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Needs Improvement */}
            <div className="glass-card rounded-2xl p-5 border border-amber-500/20 bg-amber-950/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <span>موضوعات يوصي الذكاء الاصطناعي بمراجعتها:</span>
                </div>
                <button
                  onClick={() => {
                    setActiveSubTab('mistakes');
                    soundEffects.playClick();
                  }}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline"
                >
                  فتح بنك الأخطاء ➔
                </button>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {stats.weakPoints.map((point, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800"
                  >
                    <span className="text-amber-400 font-bold">!</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-PAGE 2: REPEATED MISTAKES & SMART RE-TEST BANK            */}
      {/* ============================================================== */}
      {activeSubTab === 'mistakes' && (
        <div className="space-y-6">
          {/* Quick Sub-page Header Hero */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-amber-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/20 space-y-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    بنك الأسئلة المتعثرة والأخطاء المتكررة
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  هنا تُحفظ تلقائياً جميع الأسئلة التي تعثرت فيها أثناء حل الاختبارات وبنوك الأسئلة. يوفر النظام خوارزمية ذكية لإعادة اختبارك فيها لتثبيت الفهم الهندسي وإتقانها تماماً.
                </p>
              </div>

              {/* Big Action: Start Re-Test Now */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto">
                <button
                  onClick={handleStartAllReTest}
                  disabled={filteredRecords.length === 0}
                  className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black text-sm shadow-xl shadow-orange-950/60 transition-transform active:scale-95 disabled:opacity-40"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>بدء إعادة اختبار هذه الأسئلة الآن ({filteredRecords.length}) 🚀</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar within Mistake Sub-page */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">إجمالي الأسئلة بالسجل</div>
                <div className="text-lg font-black text-white font-mono mt-0.5">
                  {totalMistakesCount} أسئلة
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-900/40">
                <div className="text-[11px] text-rose-300">أخطاء متكررة (2 فأكثر)</div>
                <div className="text-lg font-black text-rose-400 font-mono mt-0.5">
                  {criticalCount} حرجة ⚠️
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-900/40">
                <div className="text-[11px] text-emerald-300">أسئلة تم إتقانها</div>
                <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                  {masteredCount} مفهوم ✓
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">المادة الأكثر تكراراً</div>
                <div className="text-sm font-bold text-amber-300 truncate mt-1">
                  محطات مياه الشرب
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Search Control Bar */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في نص السؤال، الفصل، أو الملاحظة الفنية..."
                className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>

            {/* Recurrence Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
              {[
                { id: 'all', label: 'جميع الأسئلة' },
                { id: 'repeated2', label: 'تكررت مرتين فأكثر' },
                { id: 'critical3', label: 'حرجة (3 مرات)' },
                { id: 'unmastered', label: 'بحاجة لتدريب' },
                { id: 'mastered', label: 'تم إتقانها ✓' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setFilterRecurrence(tab.id as any);
                    soundEffects.playClick();
                  }}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
                    filterRecurrence === tab.id
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tool Actions: Reset or Clear */}
            <div className="flex items-center gap-1.5 justify-end">
              <button
                onClick={handleResetDefaults}
                title="استعادة نماذج الأخطاء التعليمية"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">أخطاء نموذجية</span>
              </button>

              {isConfirmingClear ? (
                <div className="flex items-center gap-1 animate-fadeIn">
                  <button
                    onClick={handleClearAll}
                    className="p-1.5 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors animate-pulse"
                    title="تأكيد تفريغ السجل"
                  >
                    تأكيد المسح؟
                  </button>
                  <button
                    onClick={() => setIsConfirmingClear(false)}
                    className="p-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleClearAll}
                  title="مسح السجل بالكامل"
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">تفريغ</span>
                </button>
              )}
            </div>
          </div>

          {/* List of Mistaken Question Cards */}
          {filteredRecords.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">لا توجد أسئلة متعثرة تطابق هذه التصفية!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                تهانينا! لقد أتقنت جميع هذه المفاهيم، أو لا توجد أخطاء مسجلة بالبحث الحالي. يمكنك استعادة الأسئلة النموذجية للمراجعة في أي وقت.
              </p>
              <button
                onClick={handleResetDefaults}
                className="px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-colors inline-flex items-center gap-2 mt-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>تحميل أسئلة المراجعة النموذجية لطلاب أسيوط</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record, index) => {
                const isExpanded = expandedId === record.id;
                const isCritical = record.mistakeCount >= 3;
                const isModerate = record.mistakeCount === 2;

                return (
                  <div
                    key={record.id}
                    className={`glass-card rounded-3xl p-5 sm:p-6 border transition-all ${
                      record.mastered
                        ? 'border-emerald-500/30 bg-emerald-950/10'
                        : isCritical
                        ? 'border-rose-500/40 bg-rose-950/10'
                        : isModerate
                        ? 'border-amber-500/40 bg-amber-950/10'
                        : 'border-slate-800 bg-slate-900/40'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-slate-800/80">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Recurrence Count Tag */}
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                            isCritical
                              ? 'bg-rose-950 text-rose-300 border border-rose-800 ring-1 ring-rose-500/40'
                              : isModerate
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>
                            {record.mistakeCount >= 3
                              ? `أخطأ الطالب ${record.mistakeCount} مرات (حرج ⚠️)`
                              : record.mistakeCount === 2
                              ? 'أخطأ الطالب مرتين (متوسط)'
                              : 'أخطأ الطالب مرة واحدة'}
                          </span>
                        </span>

                        {/* Mastered Badge */}
                        {record.mastered && (
                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>تم إتقانه بعد التدريب</span>
                          </span>
                        )}

                        {/* Subject Tag */}
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 border border-slate-800">
                          {record.question.chapterTitle}
                        </span>

                        {/* Question Type */}
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800">
                          {record.question.type === 'essay'
                            ? 'سؤال مقالي'
                            : record.question.type === 'fill_blank'
                            ? 'أكمل الفراغ'
                            : record.question.type === 'true_false'
                            ? 'صح أو خطأ'
                            : 'اختيار من متعدد'}
                        </span>
                      </div>

                      {/* Timestamp of Last Failure */}
                      <span className="text-[11px] text-slate-400">
                        آخر تعثر: {record.lastMistakeDate}
                      </span>
                    </div>

                    {/* Question Content */}
                    <div className="py-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                          س{index + 1}
                        </span>
                        <h4 className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed">
                          {record.question.questionText}
                        </h4>
                      </div>

                      {/* Compare Student Answer vs Correct Answer */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        {/* Student's Wrong Answer */}
                        <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-1">
                          <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs">
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                            <span>إجابتك السابقة التي وقعت فيها:</span>
                          </div>
                          <p className="text-xs text-rose-200/90 leading-relaxed font-mono">
                            {record.lastStudentAnswer || 'تم اختيار خيار خاطئ أثناء الاختبار السريع'}
                          </p>
                        </div>

                        {/* Model Correct Answer */}
                        <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 space-y-1">
                          <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>الإجابة النموذجية المعتمدة:</span>
                          </div>
                          <p className="text-xs text-emerald-200/90 leading-relaxed font-semibold">
                            {record.modelAnswerText ||
                              (typeof record.question.correctAnswer === 'number' &&
                              record.question.options
                                ? record.question.options[record.question.correctAnswer]
                                : String(record.question.correctAnswer))}
                          </p>
                        </div>
                      </div>

                      {/* Technical Explanation & Plant Note (Collapsible/Full) */}
                      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4" />
                            <span>التوجيه الفني والتحليلي للمحطة:</span>
                          </span>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : record.id)}
                            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                          >
                            <span>{isExpanded ? 'طي الشرح' : 'عرض كامل'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <p
                          className={`text-xs text-slate-300 leading-relaxed ${
                            isExpanded ? '' : 'line-clamp-2'
                          }`}
                        >
                          {record.question.explanation}
                        </p>

                        {/* Practical Plant Tip */}
                        {record.question.practicalNote && (
                          <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-amber-300/90">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <span>
                              <strong>ملاحظة مهندس التشغيل بمحطة أسيوط:</strong>{' '}
                              {record.question.practicalNote}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Re-test single question */}
                        <button
                          onClick={() => handleTestSingleQuestion(record.question)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-950 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>اختبر هذا السؤال الآن 🎯</span>
                        </button>

                        {/* Discuss with AI Live Tutor */}
                        {onAskTutor && (
                          <button
                            onClick={() => {
                              onAskTutor(record.question.questionText);
                              soundEffects.playLiveActivate();
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                          >
                            <Bot className="w-3.5 h-3.5 text-cyan-400" />
                            <span>اسأل المساعد الصوتي 🤖</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle Mastered */}
                        <button
                          onClick={() => handleToggleMastered(record.id, !!record.mastered)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                            record.mastered
                              ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                              : 'bg-emerald-950/60 text-emerald-300 border-emerald-700 hover:bg-emerald-900/60'
                          }`}
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>{record.mastered ? 'إلغاء الإتقان' : 'تم الإتقان ✓'}</span>
                        </button>

                        {/* Delete Record */}
                        <button
                          onClick={() => handleRemoveRecord(record.id)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 border border-slate-800 transition-colors"
                          title="حذف من سجل الأخطاء"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-PAGE 3: SMART STUDY REMINDERS & EXAM ADVANCE ALERTS        */}
      {/* ============================================================== */}
      {activeSubTab === 'reminders' && (
        <NotificationsCenter isEmbedded={true} onStartExamPrep={onStartExamPrep} />
      )}
    </div>
  );
};
