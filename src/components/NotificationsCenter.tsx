import React, { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  Clock,
  Plus,
  CheckCircle,
  MapPin,
  AlertCircle,
  Trash2,
  Sparkles,
  Volume2,
  X,
  ShieldCheck,
  Check,
  Flame,
  BookOpen,
  Play,
  RotateCcw,
} from 'lucide-react';
import { ExamReminder, StudyScheduleConfig } from '../types';
import { soundEffects } from '../utils/audioEffects';
import {
  getExamReminders,
  addExamReminder,
  toggleExamCompleted,
  deleteExamReminder,
  getStudyScheduleConfig,
  saveStudyScheduleConfig,
  calculateTimeRemaining,
  requestNotificationPermission,
  sendSmartNotification,
} from '../utils/reminderManager';

interface NotificationsCenterProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
  onStartExamPrep?: (subject: string, title: string) => void;
}

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({
  isOpen = true,
  onClose,
  isEmbedded = false,
  onStartExamPrep,
}) => {
  const [exams, setExams] = useState<ExamReminder[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<StudyScheduleConfig>(
    getStudyScheduleConfig()
  );
  const [activeTab, setActiveTab] = useState<'study' | 'exams'>('study');
  const [showAddModal, setShowAddModal] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [notificationSentMessage, setNotificationSentMessage] = useState<string | null>(null);

  // New Exam Form states
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('تشغيل وصيانة محطات تنقية مياه الشرب');
  const [newDate, setNewDate] = useState('2026-11-15');
  const [newTime, setNewTime] = useState('09:00 ص');
  const [newLocation, setNewLocation] = useState('معمل محطة المعالجة الكيميائي بأسيوط');
  const [newType, setNewType] = useState<'نظري' | 'عملي بالمحطة' | 'كويز سريع'>('عملي بالمحطة');
  const [newAdvanceAlert, setNewAdvanceAlert] = useState<
    '2hours' | '24hours' | '48hours' | '3days' | '1week'
  >('24hours');

  useEffect(() => {
    setExams(getExamReminders());
    setScheduleConfig(getStudyScheduleConfig());
  }, []);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionState(res);
  };

  const handleUpdateSchedule = (updates: Partial<StudyScheduleConfig>) => {
    const updated = { ...scheduleConfig, ...updates };
    setScheduleConfig(updated);
    saveStudyScheduleConfig(updated);
    soundEffects.playClick();
  };

  const handleToggleDay = (day: string) => {
    const currentDays = scheduleConfig.studyDays;
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    handleUpdateSchedule({ studyDays: newDays });
  };

  const handleTestStudyNotification = () => {
    soundEffects.playNotificationChime();
    sendSmartNotification(
      `🔔 حان موعد مذاكرة اليوم: ${scheduleConfig.focusSubject}`,
      `تذكير مدرسة مياه الشرب بأسيوط: حافظ على سلسلة الالتزام (8 أيام). استعد لمراجعة الباب الثاني!`
    );
    setNotificationSentMessage('تم إرسال إشعار تجريبي بنجاح إلى هاتفك ومتصفحك!');
    setTimeout(() => setNotificationSentMessage(null), 4000);
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newExam: ExamReminder = {
      id: `exam-${Date.now()}`,
      title: newTitle,
      subject: newSubject,
      date: newDate,
      time: newTime,
      location: newLocation,
      type: newType,
      advanceAlert: newAdvanceAlert,
      completed: false,
    };

    const updated = addExamReminder(newExam);
    setExams(updated);
    soundEffects.playVictory();
    setShowAddModal(false);
    setNewTitle('');

    // Send immediate confirmation notification
    sendSmartNotification(
      `تم جدولة الامتحان وتفعيل التنبيه المسبق ⏰`,
      `امتحان: ${newTitle} في ${newDate}. سيتم تنبيهك قبل الموعد بـ ${
        newAdvanceAlert === '24hours'
          ? '24 ساعة'
          : newAdvanceAlert === '48hours'
          ? '48 ساعة'
          : newAdvanceAlert === '3days'
          ? '3 أيام'
          : newAdvanceAlert === '1week'
          ? 'أسبوع'
          : 'ساعتين'
      }.`
    );
  };

  const handleToggleCompleted = (id: string) => {
    const updated = toggleExamCompleted(id);
    setExams(updated);
    soundEffects.playClick();
  };

  const handleDelete = (id: string) => {
    const updated = deleteExamReminder(id);
    setExams(updated);
    soundEffects.playClick();
  };

  const content = (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 border border-cyan-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-xl text-white">
                منظومة الإشعارات الذكية والتنبيهات المسبقة
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                تنبيهات تلقائية لمواعيد المذاكرة اليومية وتنبيهات مسبقة لاختبارات المحطة العملية والنظرية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {permissionState !== 'granted' ? (
              <button
                onClick={handleRequestPermission}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs shadow-lg shadow-orange-950 transition-all"
              >
                <Bell className="w-4 h-4 animate-bounce" />
                <span>تفعيل إشعارات الهاتف والمتصفح 🔔</span>
              </button>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-bold">
                <Check className="w-4 h-4" />
                <span>إشعارات الهاتف مفعلة ومصرح بها</span>
              </span>
            )}

            {!isEmbedded && onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Sub-Tabs: Study Reminders vs Exam Countdown Alerts */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
          <button
            onClick={() => {
              setActiveTab('study');
              soundEffects.playClick();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'study'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>منبه المذاكرة اليومي الذكي</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('exams');
              soundEffects.playClick();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'exams'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md shadow-rose-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>جدول الامتحانات والتنبيهات المسبقة ({exams.filter((e) => !e.completed).length})</span>
          </button>
        </div>
      </div>

      {/* Confirmation notification message */}
      {notificationSentMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{notificationSentMessage}</span>
          </div>
        </div>
      )}

      {/* TAB 1: DAILY STUDY SCHEDULE REMINDERS */}
      {activeTab === 'study' && (
        <div className="space-y-5">
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>ضبط مواعيد المذاكرة اليومية وتنبيهات الالتزام</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  يقوم التطبيق بتنبيهك صوتياً وعبر إشعارات الهاتف لحماية سلسلة دراستك المتواصلة
                </p>
              </div>

              {/* Toggle Daily Reminders */}
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-xs font-bold text-slate-300">
                  {scheduleConfig.dailyReminderEnabled ? 'التذكير مفعل ✓' : 'التذكير متوقف'}
                </span>
                <input
                  type="checkbox"
                  checked={scheduleConfig.dailyReminderEnabled}
                  onChange={(e) =>
                    handleUpdateSchedule({ dailyReminderEnabled: e.target.checked })
                  }
                  className="w-5 h-5 rounded-lg text-cyan-500 focus:ring-cyan-500 bg-slate-800 border-slate-700"
                />
              </label>
            </div>

            {/* Time & Focus Subject Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>وقت المذاكرة المفضل (يومياً):</span>
                </label>
                <input
                  type="time"
                  value={scheduleConfig.dailyReminderTime}
                  onChange={(e) => handleUpdateSchedule({ dailyReminderTime: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>المادة الفنية المستهدفة للمذاكرة:</span>
                </label>
                <select
                  value={scheduleConfig.focusSubject}
                  onChange={(e) => handleUpdateSchedule({ focusSubject: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                >
                  <option value="تشغيل وصيانة محطات تنقية مياه الشرب">
                    تشغيل وصيانة محطات تنقية مياه الشرب
                  </option>
                  <option value="شبكات مياه الشرب والمحابس الهيدروليكية">
                    شبكات مياه الشرب والمحابس الهيدروليكية
                  </option>
                  <option value="معالجة مياه الصرف الصحي والحمأة">
                    معالجة مياه الصرف الصحي والحمأة
                  </option>
                  <option value="كيمياء ومعامل تحاليل مياه الشرب">
                    كيمياء ومعامل تحاليل مياه الشرب
                  </option>
                  <option value="طلمبات الطرد المركزي والسلامة والصحة المهنية">
                    طلمبات الطرد المركزي والسلامة والصحة المهنية
                  </option>
                </select>
              </div>
            </div>

            {/* Days of Week Selection */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-400 block">
                أيام التنبيه خلال الأسبوع:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'السبت',
                  'الأحد',
                  'الاثنين',
                  'الثلاثاء',
                  'الأربعاء',
                  'الخميس',
                  'الجمعة',
                ].map((day) => {
                  const isSelected = scheduleConfig.studyDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {day} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Streak & Chime Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleConfig.streakAlertEnabled}
                  onChange={(e) =>
                    handleUpdateSchedule({ streakAlertEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-orange-500 bg-slate-800 border-slate-700"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span>تنبيه حماية سلسلة الالتزام (8 أيام)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    تنبيهك قبل منتصف الليل إذا لم تحل أي كويز
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleConfig.soundAlertEnabled}
                  onChange={(e) =>
                    handleUpdateSchedule({ soundAlertEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-700"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>تشغيل نغمة تنبيه صوتية موسيقية</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    نغمة قطرة AI الهادئة عند حلول موعد المذاكرة
                  </div>
                </div>
              </label>
            </div>

            {/* Test Notification Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleTestStudyNotification}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-2 transition-colors border border-slate-700"
              >
                <Volume2 className="w-4 h-4" />
                <span>تجربة التنبيه الصوتي وإرسال إشعار تجريبي 🔔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXAM TIMETABLE & ADVANCE ALERTS */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-300">
              جدول الاختبارات القادمة مع التنبيهات المسبقة:
            </h3>

            <button
              onClick={() => {
                setShowAddModal(true);
                soundEffects.playClick();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-950 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موعد امتحان جديد ⏰</span>
            </button>
          </div>

          <div className="space-y-3">
            {exams.map((item) => {
              const countdown = calculateTimeRemaining(item.date, item.time);

              return (
                <div
                  key={item.id}
                  className={`glass-card rounded-2xl p-4 sm:p-5 border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    item.completed
                      ? 'opacity-60 border-slate-800 bg-slate-900/30'
                      : countdown.isUrgent
                      ? 'border-amber-500/40 bg-amber-950/10'
                      : 'border-slate-800 hover:border-cyan-500/30 bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => handleToggleCompleted(item.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        item.completed
                          ? 'bg-emerald-500 text-slate-950'
                          : 'border border-slate-600 hover:border-cyan-400'
                      }`}
                      title={item.completed ? 'تم الإنجاز' : 'تحديد كمكتمل'}
                    >
                      {item.completed && <CheckCircle className="w-4 h-4" />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Countdown Tag */}
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black font-mono ${
                            countdown.isUrgent
                              ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          }`}
                        >
                          ⏰ {countdown.label}
                        </span>

                        {/* Exam Type */}
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                            item.type === 'عملي بالمحطة'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                              : item.type === 'نظري'
                              ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                              : 'bg-purple-950/80 text-purple-300 border border-purple-800'
                          }`}
                        >
                          {item.type}
                        </span>

                        {/* Advance Alert Setting Tag */}
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          🔔 تنبيه مسبق قبلها بـ{' '}
                          {item.advanceAlert === '48hours'
                            ? '48 ساعة'
                            : item.advanceAlert === '3days'
                            ? '3 أيام'
                            : item.advanceAlert === '1week'
                            ? 'أسبوع'
                            : item.advanceAlert === '2hours'
                            ? 'ساعتين'
                            : '24 ساعة'}
                        </span>
                      </div>

                      <h4
                        className={`text-sm sm:text-base font-bold ${
                          item.completed ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}
                      >
                        {item.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-mono text-cyan-300">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          {item.date}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {item.time}
                        </span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          {item.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for exam */}
                  <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                    {onStartExamPrep && (
                      <button
                        onClick={() => {
                          onStartExamPrep(item.subject, item.title);
                          soundEffects.playLiveActivate();
                          if (onClose) onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>اختبار تحضيري 🚀</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        soundEffects.playNotificationChime();
                        sendSmartNotification(
                          `تنبيه مسبق للامتحان: ${item.title}`,
                          `الموعد: ${item.date} الساعة ${item.time} في ${item.location}`
                        );
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
                      title="تجربة التنبيه الفوري"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-xl hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors"
                      title="حذف الموعد"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Exam Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-cyan-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>إضافة موعد امتحان أو اختبار تدريب بالمحطة</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExam} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">
                  اسم الامتحان أو الاختبار *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: اختبار تشغيل طلمبات الرفع العالي"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">المادة الدراسية</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">التاريخ</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">الوقت</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="09:00 ص"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">
                  مكان الاختبار (المحطة / المعمل)
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">نوع الاختبار</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="عملي بالمحطة">عملي بالمحطة (تدريب ميداني)</option>
                    <option value="نظري">نظري (قاعة الامتحانات)</option>
                    <option value="كويز سريع">كويز سريع وتقييم دوري</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">
                    التنبيه المسبق الذكي
                  </label>
                  <select
                    value={newAdvanceAlert}
                    onChange={(e) => setNewAdvanceAlert(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    <option value="2hours">قبلها بساعتين</option>
                    <option value="24hours">قبلها بـ 24 ساعة (يوم)</option>
                    <option value="48hours">قبلها بـ 48 ساعة (يومان)</option>
                    <option value="3days">قبلها بـ 3 أيام</option>
                    <option value="1week">قبلها بأسبوع كامل</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-950"
                >
                  حفظ وتفعيل التنبيه المسبق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 border border-cyan-500/30 shadow-2xl my-8">
        {content}
      </div>
    </div>
  );
};
