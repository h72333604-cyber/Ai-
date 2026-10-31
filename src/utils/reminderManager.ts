import { ExamReminder, StudyScheduleConfig } from '../types';
import { INITIAL_EXAMS } from '../data/curriculumData';
import { soundEffects } from './audioEffects';

const EXAMS_STORAGE_KEY = 'qatrah_exam_reminders_v1';
const STUDY_SCHEDULE_KEY = 'qatrah_study_schedule_v1';

const DEFAULT_SCHEDULE_CONFIG: StudyScheduleConfig = {
  dailyReminderEnabled: true,
  dailyReminderTime: '19:00', // 07:00 PM
  studyDays: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
  focusSubject: 'تشغيل وصيانة محطات تنقية مياه الشرب',
  streakAlertEnabled: true,
  soundAlertEnabled: true,
  browserNotificationsEnabled: true,
};

export const getExamReminders = (): ExamReminder[] => {
  try {
    const raw = localStorage.getItem(EXAMS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(INITIAL_EXAMS));
      return INITIAL_EXAMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_EXAMS;
  } catch (e) {
    console.error('Failed to load exam reminders:', e);
    return INITIAL_EXAMS;
  }
};

export const saveExamReminders = (exams: ExamReminder[]): void => {
  try {
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(exams));
  } catch (e) {
    console.error('Failed to save exam reminders:', e);
  }
};

export const addExamReminder = (exam: ExamReminder): ExamReminder[] => {
  const current = getExamReminders();
  const updated = [exam, ...current];
  saveExamReminders(updated);
  return updated;
};

export const toggleExamCompleted = (id: string): ExamReminder[] => {
  const current = getExamReminders();
  const updated = current.map((ex) =>
    ex.id === id ? { ...ex, completed: !ex.completed } : ex
  );
  saveExamReminders(updated);
  return updated;
};

export const deleteExamReminder = (id: string): ExamReminder[] => {
  const current = getExamReminders();
  const updated = current.filter((ex) => ex.id !== id);
  saveExamReminders(updated);
  return updated;
};

export const getStudyScheduleConfig = (): StudyScheduleConfig => {
  try {
    const raw = localStorage.getItem(STUDY_SCHEDULE_KEY);
    if (!raw) {
      localStorage.setItem(STUDY_SCHEDULE_KEY, JSON.stringify(DEFAULT_SCHEDULE_CONFIG));
      return DEFAULT_SCHEDULE_CONFIG;
    }
    return { ...DEFAULT_SCHEDULE_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load study schedule config:', e);
    return DEFAULT_SCHEDULE_CONFIG;
  }
};

export const saveStudyScheduleConfig = (config: StudyScheduleConfig): void => {
  try {
    localStorage.setItem(STUDY_SCHEDULE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save study schedule config:', e);
  }
};

export const calculateTimeRemaining = (
  dateStr: string,
  timeStr: string = '09:00 ص'
): {
  days: number;
  hours: number;
  isUrgent: boolean;
  isPast: boolean;
  label: string;
} => {
  try {
    const targetDate = new Date(dateStr);
    const now = new Date();

    const diffMs = targetDate.getTime() - now.getTime();
    if (diffMs < 0) {
      return {
        days: 0,
        hours: 0,
        isUrgent: false,
        isPast: true,
        label: 'انتهى الموعد',
      };
    }

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    const isUrgent = diffDays <= 2;
    const label =
      diffDays === 0
        ? `اليوم (متبقي ${diffHours} س)`
        : diffDays === 1
        ? `غداً (متبقي ${diffHours} س)`
        : `متبقي ${diffDays} أيام`;

    return {
      days: diffDays,
      hours: diffHours,
      isUrgent,
      isPast: false,
      label,
    };
  } catch {
    return {
      days: 3,
      hours: 0,
      isUrgent: false,
      isPast: false,
      label: 'متبقي 3 أيام',
    };
  }
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof Notification === 'undefined') return 'denied';
  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      soundEffects.playVictory();
      sendSmartNotification(
        'قطرة AI - تفعيل التنبيهات الذكية',
        'تم تفعيل إشعارات مواعيد المذاكرة وتنبيهات الامتحانات المسبقة بنجاح! 🔔'
      );
    }
    return result;
  } catch (err) {
    console.error('Notification permission error:', err);
    return 'denied';
  }
};

export const sendSmartNotification = (title: string, body: string): void => {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
      soundEffects.playNotificationChime();
    } catch (err) {
      console.warn('Could not fire browser notification:', err);
    }
  }
};
