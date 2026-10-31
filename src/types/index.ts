/**
 * Core type definitions for Qatrah AI (قطرة)
 * 5-Page Streamlined Architecture
 */

export type QuestionType = 'mcq' | 'true_false' | 'essay' | 'fill_blank';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  subjectId: string;
  chapterTitle: string;
  pageNumber?: number; // رقم الصفحة من النسخة الأصلية
  questionText: string;
  type: QuestionType;
  options?: string[]; // for mcq or true_false
  correctAnswer: string | number; // index or exact text or true/false
  explanation: string;
  difficulty: DifficultyLevel;
  practicalNote?: string; // ملاحظة عملية من محطات أسيوط
  modelAnswerGuide?: string; // دليل الإجابة للأسئلة المقالية
}

export interface AIEvaluation {
  scorePercentage: number;
  isCorrect: boolean;
  isSemanticMatch?: boolean;
  semanticMatchLevel?: string;
  conceptsCaptured?: string[];
  missingConcepts?: string[];
  feedback: string;
  idealCorrection?: string;
}

export interface Chapter {
  id: string;
  title: string;
  pageStart?: number;
  pageEnd?: number;
  summary: string;
  originalExcerpt?: string; // النص الأصلي المقتبس بدون تغيير
  keyPoints: string[];
}

export interface TextbookModule {
  id: string;
  title: string;
  code: string;
  specialty: 'تشغيل محطات مياه' | 'شبكات مياه' | 'معالجة صرف صحي' | 'معامل كيمياء' | 'ميكانيكا وكهرباء' | 'عام وثقافة فنية';
  grade: 'الصف الأول' | 'الصف الثاني' | 'الصف الثالث';
  icon: string;
  description: string;
  totalPages: number;
  pdfFileName?: string;
  chapters: Chapter[];
  questionsCount: number;
  isCustom?: boolean;
  createdAt?: string;
}

export interface QuizCustomConfig {
  selectedModuleId: string;
  startPage: number;
  endPage: number;
  selectedTypes: QuestionType[];
  selectedDifficulties: DifficultyLevel[];
  questionCount: number;
  timeLimitMinutes?: number;
}

export interface StudentStatistics {
  totalStudyHours: number;
  totalQuestionsSolved: number;
  accuracyPercentage: number;
  quizzesCompleted: number;
  pointsEarned: number;
  streakDays: number;
  masteryBySubject: {
    subjectName: string;
    progress: number;
    accuracy: number;
    solvedCount: number;
  }[];
  accuracyByType: {
    type: string;
    label: string;
    accuracy: number;
  }[];
  weakPoints: string[];
  strongPoints: string[];
}

export interface UploadedPDFDocument {
  id: string;
  fileName: string;
  title: string;
  uploadedBy: string;
  uploadDate: string;
  fileSize: string;
  questionsCount: number;
  grade: string;
  specialty: string;
  contentSnippet: string;
  extractedQuestions: Question[];
}

export interface ExamReminder {
  id: string;
  title: string;
  subject: string;
  date: string;
  time: string;
  location: string;
  type: 'نظري' | 'عملي بالمحطة' | 'كويز سريع';
  completed: boolean;
  advanceAlert?: '2hours' | '24hours' | '48hours' | '3days' | '1week';
  notes?: string;
}

export interface StudyScheduleConfig {
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // e.g., "19:00"
  studyDays: string[];
  focusSubject: string;
  streakAlertEnabled: boolean;
  soundAlertEnabled: boolean;
  browserNotificationsEnabled: boolean;
}

export interface MindMapNode {
  id: string;
  title: string;
  description: string;
  details: string[];
  color: string;
  substeps?: {
    title: string;
    detail: string;
  }[];
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  school: string;
  points: number;
  solved: number;
  badge: string;
  rank: number;
}

export interface MistakenQuestionRecord {
  id: string; // question id
  question: Question;
  mistakeCount: number;
  lastMistakeDate: string;
  lastStudentAnswer?: string;
  modelAnswerText?: string;
  practicalTip?: string;
  mastered?: boolean;
}

export interface ThemeSettings {
  isDarkMode: boolean;
  preset: 'dark' | 'light' | 'hydro' | 'lab' | 'royal' | 'custom';
  bgMain: string;
  bgCard: string;
  textMain: string;
  textMuted: string;
  accentPrimary: string;
  borderColor: string;
  voiceGender: 'male' | 'female';
}

export interface CameraAnalysisResult {
  extractedText: string;
  topicTitle: string;
  explanation: string;
  stepByStepSolution?: string[];
  practicalAsyutNote: string;
  suggestedQuestion?: Question;
}
