/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  BookOpen,
  ArrowRight,
  X,
  Play,
  Brain,
  ShieldCheck,
  Printer,
  ChevronDown,
  Layers,
  Check,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Question } from '../types';
import { soundEffects } from '../utils/audioEffects';

interface PDFQuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadQuestionsToQuiz: (newQuestions: Question[], bankTitle: string) => void;
  currentQuestions: Question[];
}

export const PDFQuestionBankModal: React.FC<PDFQuestionBankModalProps> = ({
  isOpen,
  onClose,
  onLoadQuestionsToQuiz,
  currentQuestions,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'curated' | 'export'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [exportIncludeAnswers, setExportIncludeAnswers] = useState<boolean>(true);
  const [exportedPdfSuccess, setExportedPdfSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Curated Official Question Banks from Asyut Drinking Water School
  const curatedBanks: {
    id: string;
    title: string;
    specialty: string;
    grade: string;
    pages: string;
    questionsCount: number;
    description: string;
    questions: Question[];
  }[] = [
    {
      id: 'curated-water-plants',
      title: 'بنك أسئلة تشغيل ومراقبة محطات تنقية مياه الشرب',
      specialty: 'محطات مياه الشرب',
      grade: 'الصف الثاني الثانوي الفني',
      pages: 'ص 15 إلى 65',
      questionsCount: 6,
      description: 'يغطي اختبار الجار وتحديد جرعة الشبة، المروقات وتسريب الطمي، غسيل المرشحات الرملية السريعة، وتطهير المياه بالكلور.',
      questions: [
        {
          id: 'curated-wp-1',
          subjectId: 'water-treatment-plants',
          chapterTitle: 'الترويب والخلط السريع',
          pageNumber: 22,
          questionText: 'علل: لماذا يتم إضافة الشبة (كبريتات الألومنيوم) في حوض الخلط السريع بمحطة تنقية مياه الشرب؟',
          type: 'essay',
          correctAnswer: 'تضاف الشبة لمعادلة الشحنات الكهربائية السالبة على حبيبات الطمي والمواد الغروية العالقة، مما يسمح لها بالتجاذب والتكتل لتكوين الندف (Flocs) لتسهيل ترسيبها لاحقاً داخل أحواض الترسيب (المروقات).',
          modelAnswerGuide: 'عناصر المعنى المطلوبة: معادلة الشحنات، تجميع الشوائب والعوالق، تكوين الندف، وتسهيل الترسيب في المروقات.',
          explanation: 'بدون إضافة المروب تظل المواد الغروية معلقة لمئات السنين بسبب تنافر شحناتها السالبة.',
          difficulty: 'medium',
          practicalNote: 'تحدد جرعة الشبة المثالية معملياً بواسطة جهاز اختبار الجار (Jar Test).',
        },
        {
          id: 'curated-wp-2',
          subjectId: 'water-treatment-plants',
          chapterTitle: 'الترويب والخلط السريع',
          pageNumber: 26,
          questionText: 'ما هو الاختبار المعملي الأساسي الذي يجريه فني المعمل لتحديد الجرعة الاقتصادية والمثالية لمروب الشبة؟',
          type: 'mcq',
          options: [
            'اختبار الجار (Jar Test) لمحاكاة الترويب والترسيب',
            'اختبار الفقد في الشحنة الهيدروليكية',
            'اختبار قياس نسبة الكلور المتبقي بالشبكة',
            'اختبار التوصيل الكهربي للمياه الخام'
          ],
          correctAnswer: 0,
          explanation: 'اختبار الجار يتكون من 6 كؤوس مزودة بقلابات تحاكي تماماً حوض الخلط السريع والبطيء والترسيب لتحديد أفضل جرعة.',
          difficulty: 'easy',
        },
        {
          id: 'curated-wp-3',
          subjectId: 'water-treatment-plants',
          chapterTitle: 'الترشيح الرملي السريع',
          pageNumber: 38,
          questionText: 'اشرح بأسلوبك الفني: ما هي خطوات غسيل المرشح الرملي السريع، وعلى أي أساس يقرر فني التشغيل البدء في الغسيل؟',
          type: 'essay',
          correctAnswer: 'يقرر الفني البدء في الغسيل عند زيادة الفقد في الشحنة (Head Loss) أو وصول عكارة المياه المرشحة إلى 0.5 NTU أو انتهاء دورة الترشيح المحددة (24-36 ساعة). خطوات الغسيل: 1- عزل المرشح وغلق محبس الدخول. 2- خفض منسوب المياه لسطح الرمال. 3- دفع الهواء المضغوط لتفكيك طبقة الرمل والشوائب العالقة. 4- ضخ مياه غسيل نظيفة بالدفق العكسي من أسفل لأعلى حتى تصفو المياه. 5- تصريف أول مياه ترشيح قبل إعادة الضخ.',
          modelAnswerGuide: 'عناصر المعنى: شروط الغسيل (فقد الشحنة، العكارة، المدة الزمنية) + الخطوات العملية (عزل، تفريغ جزئي، هواء لتفكيك الرمل، غسيل عكسي بمياه نظيفة، صرف مياه البداية).',
          explanation: 'الغسيل بالهواء أولاً يوفر كميات هائلة من مياه الغسيل ويمنع تكون كرات الطين (Mud Balls).',
          difficulty: 'hard',
          practicalNote: 'تأكد من ضبط سرعة صعود مياه الغسيل لتجنب جرف الرمال مع مزاريب الصرف.',
        },
        {
          id: 'curated-wp-4',
          subjectId: 'water-treatment-plants',
          chapterTitle: 'الخزانات والتطهير بالكلور',
          pageNumber: 52,
          questionText: 'الحد الأدنى لزمن تلامس الكلور (Contact Time) داخل الخزان الأرضي قبل الضخ لشبكة المستهلكين هو:',
          type: 'mcq',
          options: [
            '30 دقيقة على الأقل لضمان التطهير والقضاء على الميكروبات',
            '5 دقائق فقط',
            '10 دقائق مع التحريك المستمر',
            'ساعتان على الأقل'
          ],
          correctAnswer: 0,
          explanation: 'زمن التلامس 30 دقيقة هو المعيار الصحي القياسي لشركة مياه الشرب لضمان القضاء على الكائنات الممرضة.',
          difficulty: 'easy',
        },
        {
          id: 'curated-wp-5',
          subjectId: 'water-treatment-plants',
          chapterTitle: 'الخزانات والتطهير بالكلور',
          pageNumber: 56,
          questionText: 'يجب ألا يقل تركيز الكلور الحر المتبقي (Free Residual Chlorine) عند أطراف شبكة التوزيع عن 0.5 مجم/لتر.',
          type: 'true_false',
          options: ['عبارة صحيحة ✅', 'عبارة خاطئة ❌'],
          correctAnswer: 0,
          explanation: 'الكلور المتبقي هو خط الأمان ضد أي تلوث عرضي قد يحدث داخل أنابيب الشبكة أثناء نقل المياه.',
          difficulty: 'easy',
        },
        {
          id: 'curated-wp-6',
          subjectId: 'water-treatment-plants',
          chapterTitle: 'أحواض الترسيب والمروقات',
          pageNumber: 31,
          questionText: 'ما هي وظيفة مروق البلساتور (Pulsator) أو مروق الأكسيليراتور في محطات مياه أسيوط؟',
          type: 'essay',
          correctAnswer: 'وظيفته تجميع حبيبات الندف المتكونة في حوض الخلط، وتكوين طبقة من الحمأة أو سدادة حمأة مرنة تعمل كمرشح هيدروليكي لاصطياد العوالق الدقيقة وترسيبها في القاع، لتخرج المياه الرائقة من الهدارات العلوية إلى المرشحات.',
          modelAnswerGuide: 'عناصر المعنى: تجميع وترسيب الندف، احتجاز العوالق بسدادة الحمأة، تصريف المياه الرائقة للمرشحات، وتفريغ الرواسب دورياً.',
          explanation: 'مروقات الحمأة المعلقة توفر مساحة أرضية كبيرة مقارنة بالأحواض التقليدية المستطيلة.',
          difficulty: 'medium',
        },
      ],
    },
    {
      id: 'curated-networks-valves',
      title: 'بنك أسئلة شبكات مياه الشرب والمحابس والمطرقة المائية',
      specialty: 'شبكات التوزيع ومحطات الرفع',
      grade: 'الصف الثاني والثالث',
      pages: 'ص 40 إلى 90',
      questionsCount: 5,
      description: 'يغطي ظاهرة المطرقة المائية وسبل الحماية منها، محابس الهواء ومحابس الغسيل، وصيانة طلمبات الطرد المركزي.',
      questions: [
        {
          id: 'curated-net-1',
          subjectId: 'networks',
          chapterTitle: 'المطرقة المائية وغرف الحماية',
          pageNumber: 45,
          questionText: 'ما هي أسباب حدوث ظاهرة المطرقة المائية (Water Hammer) في خطوط الطرد، وكيف نحمي خطوط الشبكة منها؟',
          type: 'essay',
          correctAnswer: 'تحدث المطرقة المائية بسبب التغير المفاجئ في سرعة سريان المياه داخل المواسير نتيجة انقطاع التيار الكهربائي المفاجئ عن طلمبات الرفع أو القفل السريع لمحبس على الخط، مما يولد موجات ضغط ارتدادية هائلة قد تؤدي لانفجار المواسير. وسائل الحماية: 1- غرف الهواء المضغوط (Surge Vessels). 2- محابس تنفيس الضغط السريعة (Surge Anticipator Valves). 3- محابس عدم الرجوع بطيئة الغلق (Check Valves). 4- أواني التوازن والخزانات العلوية.',
          modelAnswerGuide: 'عناصر المعنى: سبب الظاهرة (توقف مفاجئ للطلمبات أو غلق سريع للمحابس يسبب موجة ضغط) + طرق الحماية (غرف هواء مضغوط، محابس تنفيس، محابس عدم رجوع، خزانات توازن).',
          explanation: 'تصل موجات المطرقة المائية لعدة أضعاف ضغط التشغيل الاسمي للماسورة إن لم يتم امتصاصها.',
          difficulty: 'hard',
        },
        {
          id: 'curated-net-2',
          subjectId: 'networks',
          chapterTitle: 'محابس الشبكة',
          pageNumber: 62,
          questionText: 'أين يتم تركيب محابس الهواء (Air Release Valves) في شبكات مياه الشرب، وما هي خطورة تراكم الهواء بالخطوط؟',
          type: 'essay',
          correctAnswer: 'يتم تركيب محابس الهواء في أعلى النقاط المرتفعة على طول خطوط المياه. خطورة تراكم الهواء: يؤدي تكون جيوب هوائية إلى تقليل مساحة المقطع الفعال لسريان المياه، وزيادة فقد الاحتكاك، وهبوط الضغط، وقد تسبب الجيوب الهوائية حدوث مطرقة مائية عند تحركها المفاجئ أو انفجار الأنابيب.',
          modelAnswerGuide: 'عناصر المعنى: موقع التركيب (أعلى النقاط المرتفعة بالخط) + الأضرار (تكوين جيوب هوائية، تضييق مسار المياه، هبوط الضغط، إجهادات على الخط).',
          explanation: 'محابس الهواء تعمل على طرد الهواء أثناء ملء الخط، وسحب الهواء أثناء تفريغ الخط لمنع تخلخل الضغط وانهيار الماسورة.',
          difficulty: 'medium',
        },
        {
          id: 'curated-net-3',
          subjectId: 'networks',
          chapterTitle: 'محابس الشبكة',
          pageNumber: 71,
          questionText: 'يتم تركيب محابس الغسيل (Washout Valves) في أوطى النقاط على خطوط الشبكة لتفريغ الرواسب وطرد المياه العكرة.',
          type: 'true_false',
          options: ['عبارة صحيحة ✅', 'عبارة خاطئة ❌'],
          correctAnswer: 0,
          explanation: 'محابس الغسيل توضع دائماً في النقاط المنخفضة لتصريف الطمي والشوائب المتراكمة في قاع الأنابيب.',
          difficulty: 'easy',
        },
        {
          id: 'curated-net-4',
          subjectId: 'networks',
          chapterTitle: 'طلمبات الطرد المركزي',
          pageNumber: 84,
          questionText: 'ما هي ظاهرة التكهف (Cavitation) في طلمبات مياه الشرب، وما هي أعراضها التشغيلية؟',
          type: 'essay',
          correctAnswer: 'التكهف يحدث عند انخفاض الضغط عند مدخل ريشة الطلمبة (Impeller Eye) عن ضغط بخار الماء عند درجة حرارة التشغيل، فتتكون فقاعات بخارية تنفجر بعنف عند انتقالها لمنطقة الضغط العالي. أعراضها: صوت صرير يشبه طحن الزلط داخل الطلمبة، اهتزازات شديدة (Vibration)، تآكل ونقر في ريش الطلمبة، وانخفاض تصرف وضغط المياه المنتجة.',
          modelAnswerGuide: 'عناصر المعنى: سبب التكهف (هبوط الضغط عند المدخل عن ضغط البخار وتكون فقاعات تنفجر) + الأعراض (صوت طحن الزلط، اهتزاز، تآكل الريشة، هبوط التصرف والضغط).',
          explanation: 'لتجنب التكهف يجب أن يكون الـ NPSH المتاح أكبر من الـ NPSH المطلوب للطلمبة.',
          difficulty: 'hard',
        },
      ],
    },
    {
      id: 'curated-wastewater-treatment',
      title: 'بنك أسئلة معالجة مياه الصرف الصحي والحمأة المنشطة',
      specialty: 'معالجة الصرف الصحي',
      grade: 'الصف الثالث',
      pages: 'ص 50 إلى 110',
      questionsCount: 4,
      description: 'مناهج محطة عرب المدابغ ومعالجة الصرف الصحي بأسيوط، أحواض التهوية، مؤشرات BOD و COD، والحمأة المنشطة.',
      questions: [
        {
          id: 'curated-ww-1',
          subjectId: 'wastewater',
          chapterTitle: 'المعالجة البيولوجية بالحمأة المنشطة',
          pageNumber: 58,
          questionText: 'اشرح الدور البيولوجي لأحواض التهوية (Aeration Tanks) في معالجة مياه الصرف الصحي، ولماذا يجب الحفاظ على نسبة DO لا تقل عن 2 مجم/لتر؟',
          type: 'essay',
          correctAnswer: 'تعمل أحواض التهوية على توفير الأكسجين الذائب اللازم للبكتيريا الهوائية والكائنات الدقيقة لتتغذى على المواد العضوية الذائبة في مياه الصرف وتحولها إلى كتل حيوية مستقرة (ندف الحمأة المنشطة). نسبة الأكسجين الذائب (DO لا تقل عن 2 مجم/لتر) ضرورية للحفاظ على نشاط البكتيريا ومنع تحول الحوض لظروف لاهوائية تسبب انبعاث روائح كريهة وهلاك الميكروبات النافعة وتدهور كفاءة المعالجة.',
          modelAnswerGuide: 'عناصر المعنى: توفير الأكسجين للبكتيريا الهوائية، التغذي على الملوثات والمواد العضوية، تكوين الحمأة، الحفاظ على DO لمنع الظروف اللاهوائية والروائح وتلف المعالجة.',
          explanation: 'المعالجة البيولوجية تخفض مؤشر الأكسجين الحيوي المستهلك (BOD) بنسبة تتجاوز 90%.',
          difficulty: 'medium',
        },
        {
          id: 'curated-ww-2',
          subjectId: 'wastewater',
          chapterTitle: 'الحمأة المنشطة المعادة والفائضة',
          pageNumber: 74,
          questionText: 'ما الفرق بين الحمأة المعادة (Return Activated Sludge - RAS) والحمأة الزائدة (Waste Activated Sludge - WAS)؟',
          type: 'essay',
          correctAnswer: 'الحمأة المعادة (RAS) هي الحمأة المترسبة في حوض الترسيب النهائي والتي يعاد ضخها إلى بداية حوض التهوية للحفاظ على تركيز البكتيريا والكائنات الدقيقة النشطة (MLSS) اللازمة لعملية الهضم. أما الحمأة الزائدة (WAS) فهي الكمية الفائضة عن حاجة الحوض والتي يتم سحبها خارج المنظومة للتثخين والهضم والتجفيف لمنع تراكم الحمأة وتدهور جودة السيب النهائي.',
          modelAnswerGuide: 'عناصر المعنى: RAS يعاد ضخها لحوض التهوية للحفاظ على البكتيريا وتركيز MLSS. WAS هي الزائدة المسحوبة للتجفيف والتخلص لمنع زيادة عمر الحمأة.',
          explanation: 'التحكم بنسبة الحمأة المعادة والزائدة يضبط زمن مكوث الخلايا الميكروبية (Sludge Age).',
          difficulty: 'hard',
        },
        {
          id: 'curated-ww-3',
          subjectId: 'wastewater',
          chapterTitle: 'المعالجة التمهيدية والابتدائية',
          pageNumber: 25,
          questionText: 'وظيفة المصافي (Screens) في بداية محطة معالجة الصرف الصحي هي:',
          type: 'mcq',
          options: [
            'حجز المواد الطافية الكبيرة كالأخشاب والأقمشة لحماية الطلمبات والمعدات',
            'ترسيب الرمال الدقيقة والحصى',
            'أكسدة المواد العضوية الذائبة بالهواء',
            'تطهير المياه وقتل البكتيريا'
          ],
          correctAnswer: 0,
          explanation: 'المصافي الميكانيكية واليدوية هي خط الدفاع الأول لحماية الطلمبات من الانسداد أو التلف.',
          difficulty: 'easy',
        },
      ],
    },
  ];

  // Handle User Uploading PDF File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      soundEffects.playClick();
    }
  };

  const handleProcessUploadedPDF = async () => {
    if (!selectedFile && !customText.trim()) return;

    setIsProcessing(true);
    setProcessStep('جاري قراءة ملف الـ PDF واستخراج النصوص...');
    soundEffects.playLiveActivate();

    try {
      let pdfBase64: string | undefined = undefined;

      if (selectedFile) {
        // Read file as Base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
        pdfBase64 = await base64Promise;
      }

      setProcessStep('يقوم الذكاء الاصطناعي (Gemini 3.8 Flash) بفحص محتوى بنك الأسئلة واستخراج الأسئلة المقالية والموضوعية...');

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64,
          textContent: customText,
          fileName: selectedFile?.name || 'بنك أسئلة مخصص.pdf',
        }),
      });

      const data = await response.json();
      setProcessStep('تم استخراج بنك الأسئلة وتجهيز التصحيح الدلالي بالمعنى!');
      soundEffects.playVictory();

      setTimeout(() => {
        setIsProcessing(false);
        if (data.questions && data.questions.length > 0) {
          onLoadQuestionsToQuiz(data.questions, selectedFile?.name || 'بنك أسئلة مستخرج من PDF');
          onClose();
        }
      }, 900);
    } catch (err) {
      console.error('Error processing PDF:', err);
      setIsProcessing(false);
      setProcessStep('حدث خطأ أثناء معالجة الملف، يرجى المحاولة مرة أخرى.');
    }
  };

  const handleSelectCuratedBank = (bank: (typeof curatedBanks)[0]) => {
    soundEffects.playVictory();
    onLoadQuestionsToQuiz(bank.questions, bank.title);
    onClose();
  };

  // Export current questions as an official printable PDF Question Bank
  const handleExportPDF = () => {
    soundEffects.playLiveActivate();

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Simple clean page layout
      doc.setFillColor(3, 105, 161); // #0369a1
      doc.rect(0, 0, 210, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text('Qatrah AI - Water & Wastewater Technical High School (Asyut)', 105, 10, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Official Interactive Question Bank & Exam Paper', 105, 17, { align: 'center' });

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.text(`Exam Date: ${new Date().toLocaleDateString()}`, 15, 32);
      doc.text(`Total Questions: ${currentQuestions.length}`, 15, 38);
      doc.text(`Semantic Meaning-Based AI Grading Enabled`, 15, 44);

      doc.setDrawColor(203, 213, 225);
      doc.line(15, 48, 195, 48);

      let yPos = 56;
      currentQuestions.forEach((q, idx) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 25;
        }

        const typeLabel =
          q.type === 'essay'
            ? '[ESSAY / EXPLANATION]'
            : q.type === 'mcq'
            ? '[MULTIPLE CHOICE]'
            : q.type === 'true_false'
            ? '[TRUE / FALSE]'
            : '[FILL IN BLANK]';

        doc.setFontSize(10);
        doc.setTextColor(3, 105, 161);
        doc.text(`Q${idx + 1} ${typeLabel} (${q.difficulty.toUpperCase()}) - ${q.chapterTitle}`, 15, yPos);
        yPos += 6;

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(q.questionText, 180);
        doc.text(splitText, 15, yPos);
        yPos += splitText.length * 5 + 3;

        if (q.type === 'mcq' && q.options) {
          q.options.forEach((opt, optIdx) => {
            doc.setTextColor(71, 85, 105);
            doc.text(`[  ] (${optIdx + 1}) ${opt}`, 20, yPos);
            yPos += 5;
          });
        } else if (q.type === 'essay') {
          doc.setTextColor(148, 163, 184);
          doc.text('Student Answer Space (Graded on technical meaning, not wording):', 20, yPos);
          yPos += 5;
          doc.setDrawColor(226, 232, 240);
          doc.line(20, yPos + 3, 190, yPos + 3);
          doc.line(20, yPos + 9, 190, yPos + 9);
          yPos += 14;
        }

        if (exportIncludeAnswers) {
          doc.setTextColor(16, 185, 129);
          doc.setFontSize(8.5);
          const answerText = `* Model Answer Guide: ${String(q.correctAnswer).substring(0, 100)}...`;
          doc.text(answerText, 15, yPos);
          yPos += 6;
        }

        yPos += 5;
      });

      doc.save(`بنك_اسئلة_مدرسة_مياه_الشرب_اسيوط_${Date.now()}.pdf`);
      setExportedPdfSuccess(true);
      soundEffects.playVictory();
      setTimeout(() => setExportedPdfSuccess(false), 3000);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/70 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-gradient-to-r from-cyan-950/70 via-slate-900 to-blue-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">
                  بنوك أسئلة PDF والاختبارات التفاعلية
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  تصحيح دلالي بالمعنى
                </span>
              </div>
              <p className="text-xs text-slate-400">
                حوّل ملفات الـ PDF ومذكرات الامتحانات إلى اختبارات تفاعلية فورية تصحح بالمعنى دون اشتراط التطابق الحرفي
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/70 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            1. رفع بنك أسئلة PDF من جهازك
          </button>
          <button
            onClick={() => setActiveTab('curated')}
            className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'curated'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            2. بنوك أسئلة مدرسة أسيوط الجاهزة (تجربة فورية)
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            3. تصدير / تحميل بنك الأسئلة PDF
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* TAB 1: UPLOAD PDF FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-700/40 space-y-1">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>معالجة فائقة بالذكاء الاصطناعي لكافة أنواع الأسئلة</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ارفع أي مذكرة أو نموذج امتحان مدرسة مياه الشرب والصرف الصحي بصيغة PDF؛ سيقوم الذكاء الاصطناعي باستخراج الأسئلة المقالية ومطابقتها دلالياً مع معايير شركة المياه.
                </p>
              </div>

              {/* Drag & Drop Box */}
              <div className="relative border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-3xl p-6 transition-all text-center bg-slate-950/40 flex flex-col items-center justify-center gap-3">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">
                    {selectedFile ? selectedFile.name : 'اسحب ملف بنك الأسئلة PDF هنا أو اضغط للاختيار من الهاتف'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedFile
                      ? `الحجم: ${(selectedFile.size / 1024 / 1024).toFixed(2)} ميجابايت - جاهز للتحليل`
                      : 'يدعم ملفات PDF، امتحانات المحطات والشبكات والمعامل'}
                  </p>
                </div>
              </div>

              {/* Optional Text Paste Alternative */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 block">
                  أو الصق أسئلة المذكرة مباشرة هنا (اختياري):
                </label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="مثال:
س1: علل إضافة الشبة في حوض الخلط السريع بمحطة المياه؟
س2: ما هي شروط غسيل المرشح الرملي السريع؟
س3: (اختيار) زمن تلامس الكلور في الخزان الأرضي: (10 دقائق - 30 دقيقة - ساعة)"
                  rows={4}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              {/* Progress State */}
              {isProcessing && (
                <div className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-600/50 space-y-2 animate-pulse">
                  <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>{processStep}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full w-3/4 rounded-full animate-pulse"></div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                disabled={(!selectedFile && !customText.trim()) || isProcessing}
                onClick={handleProcessUploadedPDF}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-cyan-900/40 flex items-center justify-center gap-2 transition-transform active:scale-98"
              >
                <Play className="w-4 h-4 fill-white" />
                تحويل الـ PDF الآن وبدء الاختبار التفاعلي الذكي
              </button>
            </div>
          )}

          {/* TAB 2: CURATED OFFICIAL ASYUT WATER SCHOOL BANKS */}
          {activeTab === 'curated' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-800/40 text-xs text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  بنوك أسئلة رسمية مستخرجة ومحققة من كتب مدرسة مياه الشرب والصرف الصحي بأسيوط، جاهزة للاختبار الفوري مع التصحيح الدلالي بالمعنى.
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {curatedBanks.map((bank) => (
                  <div
                    key={bank.id}
                    className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 hover:border-cyan-500/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                          {bank.specialty}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                          {bank.grade}
                        </span>
                        <span className="text-[11px] text-cyan-400 font-mono">
                          {bank.pages}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-100 text-sm group-hover:text-cyan-300 transition-colors">
                        {bank.title}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {bank.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleSelectCuratedBank(bank)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-cyan-950 transition-transform active:scale-95 flex-shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      بدء الاختبار ({bank.questionsCount} أسئلة)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EXPORT & DOWNLOAD PDF */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2">
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Printer className="w-4 h-4 text-cyan-400" />
                  تحميل بنك الأسئلة الحالي كملف PDF قابل للطباعة
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  يقوم النظام بتنسيق الاختبار والأسئلة المقالية في مستند PDF رسمي يحمل ترويسة مدرسة مياه الشرب والصرف الصحي بأسيوط، مع مساحات مخصصة لكتابة الطالب ودليل التصحيح بالمعنى.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-bold">
                    عدد الأسئلة الجاهزة للتصدير في هذا الملف:
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-800">
                    {currentQuestions.length} سؤال
                  </span>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={exportIncludeAnswers}
                    onChange={(e) => setExportIncludeAnswers(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-800 border-slate-700"
                  />
                  <span>تضمين دليل الإجابة النموذجية والمفاهيم الدلالية في نهاية الملف</span>
                </label>
              </div>

              {exportedPdfSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-600/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>تم تنزيل ملف الـ PDF بنجاح على جهازك!</span>
                </div>
              )}

              <button
                onClick={handleExportPDF}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-transform active:scale-98"
              >
                <Download className="w-4 h-4" />
                تحميل بنك الأسئلة الآن بصيغة PDF
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>التصحيح الدلالي يعتمد على فهم الطالب وليس التطابق اللفظي الحرفي</span>
          </div>

          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
