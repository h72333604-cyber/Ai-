import { Question, MistakenQuestionRecord } from '../types';
import { INITIAL_QUESTIONS } from '../data/curriculumData';

const STORAGE_KEY = 'qatrah_mistaken_questions_v1';

// Initial realistic mistake bank seeded from the Asyut water high school curriculum
const DEFAULT_SEED_RECORDS: MistakenQuestionRecord[] = [
  {
    id: 'q4',
    question: INITIAL_QUESTIONS.find((q) => q.id === 'q4') || {
      id: 'q4',
      subjectId: 'water-treatment-plants',
      chapterTitle: 'الباب الرابع: التطهير بالكلور',
      questionText: 'ما هو زمن التلامس (Contact Time) الأدنى المطلوب لمياه الشرب مع الكلور داخل الخزان الأرضي قبل الضخ إلى الشبكة؟',
      type: 'mcq',
      options: [
        '30 دقيقة على الأقل',
        '5 دقائق فقط',
        'ساعتان متواصلتان',
        'لا يلزم زمن تلامس إطلاقاً',
      ],
      correctAnswer: 0,
      explanation: 'يجب أن تمكث المياه داخل الخزان الأرضي لمدة لا تقل عن 30 دقيقة عند أقصى معدل تدفق لضمان إتمام تفاعل الكلور مع الكائنات الدقيقة والقضاء التام عليها.',
      difficulty: 'medium',
      practicalNote: 'تؤخذ عينات المياه المعقمة من مخرج الخزان الأرضي للتأكد من قيمة الـ CT.',
    },
    mistakeCount: 3,
    lastMistakeDate: 'منذ ساعتين (اليوم)',
    lastStudentAnswer: '5 دقائق فقط (إجابة متسرعة)',
    modelAnswerText: '30 دقيقة على الأقل عند أعلى تصرف تصميمي',
    practicalTip: 'تذكر دائماً قانون CT (التركيز × زمن التلامس) لضمان القضاء على الجراثيم المقاومة.',
    mastered: false,
  },
  {
    id: 'q2',
    question: INITIAL_QUESTIONS.find((q) => q.id === 'q2') || {
      id: 'q2',
      subjectId: 'water-treatment-plants',
      chapterTitle: 'الباب الثالث: الترشيح الرملي السريع',
      questionText: 'أي من الحالات التالية تدل بشكل مؤكد على وجوب إجراء غسيل عكسي فوري لمرشح الرمل السريع؟',
      type: 'mcq',
      options: [
        'ارتفاع الفقد في الضاغط (Head Loss) أو تخطي العكارة الخارجة للحد المسموح به (0.5 NTU)',
        'انخفاض درجة حرارة المياه في المأخذ',
        'زيادة منسوب المياه في الخزان الأرضي',
        'انخفاض سرعة طلمبات الرفع العالي',
      ],
      correctAnswer: 0,
      explanation: 'يتم غسيل المرشح عند وصول الفقد في الشحنة الهيدروليكية إلى الحد التصميمي الأقصى (عادة 2 إلى 2.5 متر) أو عندما تبدأ العكارة في الهروب من المرشح لتتخطى 0.5 NTU.',
      difficulty: 'medium',
      practicalNote: 'تأخير غسيل المرشح يؤدي إلى تكوين كرات الطين (Mud Balls) وتكسر طبقة الرشح.',
    },
    mistakeCount: 2,
    lastMistakeDate: 'أمس، 04:15 م',
    lastStudentAnswer: 'زيادة منسوب المياه في الخزان الأرضي',
    modelAnswerText: 'ارتفاع الفقد في الضاغط أو تخطي العكارة الخارجة 0.5 NTU',
    practicalTip: 'الفقد في الضاغط ومقياس العكارة (Turbidimeter) هما المؤشران الحاكمان لغسيل الفلتر.',
    mastered: false,
  },
  {
    id: 'q5',
    question: INITIAL_QUESTIONS.find((q) => q.id === 'q5') || {
      id: 'q5',
      subjectId: 'water-networks',
      chapterTitle: 'الباب الثاني: محابس القفل والهواء',
      questionText: 'أين يتم تركيب محابس الهواء المزدوجة (Air Release Valves) في خطوط طرد شبكات مياه الشرب؟',
      type: 'mcq',
      options: [
        'في أعلى النقاط الطبوغرافية للمسار لطرد الجيوب الهوائية',
        'في أخفض النقاط الطبوغرافية لتفريغ الرواسب',
        'عند مدخل كل منزل فقط',
        'بجانب طلمبات السحب مباشرة',
      ],
      correctAnswer: 0,
      explanation: 'توضع محابس الهواء في القمم والنقاط المرتفعة على طول خط الطرد لطرد فقاعات الهواء المتصاعدة ومنع تكوين وسادات هوائية تعيق السريان.',
      difficulty: 'hard',
      practicalNote: 'انسداد محبس الهواء يؤدي إلى انفجار الخط بسبب ظاهرة المطرقة المائية عند انقطاع الكهرباء.',
    },
    mistakeCount: 2,
    lastMistakeDate: 'منذ يومين',
    lastStudentAnswer: 'في أخفض النقاط الطبوغرافية لتفريغ الرواسب (خلط بين محبس الهواء ومحبس الغسيل)',
    modelAnswerText: 'في أعلى النقاط الطبوغرافية (القمم) لطرد الجيوب الهوائية',
    practicalTip: 'قاعدة فنية: محبس الهواء في القمة، ومحبس الغسيل في القاع.',
    mastered: false,
  },
  {
    id: 'q6',
    question: INITIAL_QUESTIONS.find((q) => q.id === 'q6') || {
      id: 'q6',
      subjectId: 'water-treatment-plants',
      chapterTitle: 'الباب الثاني: الترويب والتنديف',
      questionText: 'علل: لماذا يتم إجراء الخلط السريع لمدة 30-60 ثانية يعقبه خلط بطيء لمدة 20-30 دقيقة في أحواض الترويب والتنديف؟',
      type: 'essay',
      correctAnswer: 'الخلط السريع لانتشار المروّب والتصاق أيونات الألومنيوم بالشحنات السالبة، والخلط البطيء لتكبير حجم الندف دون تكسيرها.',
      explanation: 'الخلط السريع السريع يضمن انتشار كبريتات الألومنيوم ومعادلة شحنات الحبيبات العالقة، بينما الخلط البطيء المتدرج يتيح تصادم الجزيئات لتكوين ندف ثقيلة (Flocs) قابلة للترسيب دون تمزيقها بدوامات السرعة العالية.',
      difficulty: 'hard',
      practicalNote: 'زيادة سرعة القلابات في مرحلة التنديف البطيء تؤدي لتكسير الندف وهروبها إلى المرشحات.',
    },
    mistakeCount: 3,
    lastMistakeDate: 'منذ 3 أيام',
    lastStudentAnswer: 'لترسيب المياه مباشرة ومنع تكوين الرغوة (إجابة ناقصة للمفاهيم الأساسية)',
    modelAnswerText: 'الخلط السريع لانتشار الشبة ومعادلة الشحنات، والخلط البطيء لتصادم وتكبير الندف دون تكسيرها لتسهيل الترسيب.',
    practicalTip: 'تذكر: الخلط السريع = كيميائي ومعادلة شحنات، الخلط البطيء = فيزيائي وتكبير ندف.',
    mastered: false,
  },
];

export const getMistakenRecords = (): MistakenQuestionRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEED_RECORDS));
      return DEFAULT_SEED_RECORDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_SEED_RECORDS;
  } catch (e) {
    console.error('Failed to load mistaken questions from storage:', e);
    return DEFAULT_SEED_RECORDS;
  }
};

export const saveMistakenRecords = (records: MistakenQuestionRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save mistaken questions to storage:', e);
  }
};

export const recordMistake = (
  question: Question,
  studentAnswer?: string
): MistakenQuestionRecord[] => {
  const current = getMistakenRecords();
  const existingIdx = current.findIndex((r) => r.id === question.id);

  const now = new Date();
  const timeFormatted = `اليوم، ${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  let updated: MistakenQuestionRecord[];

  if (existingIdx >= 0) {
    const existing = current[existingIdx];
    const newRecord: MistakenQuestionRecord = {
      ...existing,
      question,
      mistakeCount: existing.mistakeCount + 1,
      lastMistakeDate: timeFormatted,
      lastStudentAnswer: studentAnswer || existing.lastStudentAnswer,
      mastered: false, // Reset mastered status upon new failure
    };
    updated = [...current];
    updated[existingIdx] = newRecord;
  } else {
    const newRecord: MistakenQuestionRecord = {
      id: question.id,
      question,
      mistakeCount: 1,
      lastMistakeDate: timeFormatted,
      lastStudentAnswer: studentAnswer,
      modelAnswerText:
        typeof question.correctAnswer === 'number' && question.options
          ? question.options[question.correctAnswer]
          : String(question.correctAnswer),
      practicalTip: question.practicalNote,
      mastered: false,
    };
    updated = [newRecord, ...current];
  }

  saveMistakenRecords(updated);
  return updated;
};

export const markAsMastered = (
  questionId: string,
  mastered: boolean
): MistakenQuestionRecord[] => {
  const current = getMistakenRecords();
  const updated = current.map((r) => (r.id === questionId ? { ...r, mastered } : r));
  saveMistakenRecords(updated);
  return updated;
};

export const removeMistakenRecord = (questionId: string): MistakenQuestionRecord[] => {
  const current = getMistakenRecords();
  const updated = current.filter((r) => r.id !== questionId);
  saveMistakenRecords(updated);
  return updated;
};

export const resetToDefaultMistakes = (): MistakenQuestionRecord[] => {
  saveMistakenRecords(DEFAULT_SEED_RECORDS);
  return DEFAULT_SEED_RECORDS;
};

export const clearAllMistakes = (): void => {
  saveMistakenRecords([]);
};
