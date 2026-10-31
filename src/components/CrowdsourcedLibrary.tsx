import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Play,
  Share2,
  Download,
  AlertCircle,
  FileUp,
  Tag,
  BookOpen
} from 'lucide-react';
import { UploadedPDFDocument, Question } from '../types';
import { soundEffects } from '../utils/audioEffects';

interface CrowdsourcedLibraryProps {
  documents: UploadedPDFDocument[];
  onUploadDocument: (doc: UploadedPDFDocument) => void;
  onStartQuizFromDoc: (doc: UploadedPDFDocument) => void;
}

export const CrowdsourcedLibrary: React.FC<CrowdsourcedLibraryProps> = ({
  documents,
  onUploadDocument,
  onStartQuizFromDoc,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [studentName, setStudentName] = useState('سيف الأسيوطي');
  const [grade, setGrade] = useState('الصف الثاني');
  const [specialty, setSpecialty] = useState('تشغيل محطات مياه وشبكات');
  const [textContent, setTextContent] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');

  const specialtiesList = [
    'all',
    'تشغيل محطات مياه وشبكات',
    'معالجة صرف صحي',
    'معامل كيمياء وبكتريولوجيا',
    'ميكانيكا وكهرباء المحطات',
  ];

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty =
      selectedSpecialty === 'all' || doc.specialty.includes(selectedSpecialty);
    return matchesSearch && matchesSpecialty;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }

      // Try reading text from file
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        // Store snippet / content
        setTextContent(result.slice(0, 15000));
      };
      // Read as text or data url
      if (file.type === 'application/pdf') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  const handleProcessAndShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsUploading(true);
    setUploadStatusMsg('جاري معالجة الـ PDF بالذكاء الاصطناعي واستخراج الأسئلة الأصلية...');

    try {
      const res = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: textContent || title,
          fileName: selectedFileName || `${title}.pdf`,
          grade,
          specialty,
        }),
      });

      const data = await res.json();
      const extracted: Question[] = data.questions || [];

      const newDoc: UploadedPDFDocument = {
        id: `doc-${Date.now()}`,
        fileName: selectedFileName || `${title}.pdf`,
        title,
        uploadedBy: studentName || 'طالب مدرسة مياه الشرب',
        uploadDate: 'الآن',
        fileSize: '2.5 MB',
        questionsCount: extracted.length > 0 ? extracted.length : 12,
        grade,
        specialty,
        contentSnippet: textContent
          ? textContent.slice(0, 200) + '...'
          : 'مذكرة وبنك أسئلة مشتركة لجميع طلاب المدرسة الفنية بأسيوط.',
        extractedQuestions: extracted,
      };

      onUploadDocument(newDoc);
      soundEffects.playVictory();
      setShowUploadModal(false);
      // Reset form
      setTitle('');
      setTextContent('');
      setSelectedFileName('');
      setUploadStatusMsg('');
    } catch (err) {
      console.error(err);
      setUploadStatusMsg('حدث خطأ في الرفع، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner for Crowdsourced Library */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-cyan-500/30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                <Users className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wide">
                المكتبة التشاركية المفتوحة لطلاب المدرسة
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              شارك مذكراتك وكتب الـ PDF مع زملائك، وحوّلها تلقائياً لبنك أسئلة ذكي!
            </h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              يقوم أي طالب برفع بنوك الأسئلة وامتحانات المحطة بصيغة PDF لتصبح متاحة فوراً لكل الطلاب في كل المراحل والشعب، مع توليد أسئلة تفاعلية ومصحح ذكي.
            </p>
          </div>

          <button
            onClick={() => {
              setShowUploadModal(true);
              soundEffects.playClick();
            }}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-900/40 transition-all active:scale-95 flex-shrink-0"
          >
            <Upload className="w-5 h-5" />
            <span>رفع مذكرة أو PDF جديد 📄</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن كتاب، مذكرة، أو زميل..."
            className="w-full bg-slate-900 text-slate-100 placeholder-slate-400 text-xs sm:text-sm pr-10 pl-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Specialty Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {specialtiesList.map((sp) => (
            <button
              key={sp}
              onClick={() => {
                setSelectedSpecialty(sp);
                soundEffects.playClick();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-colors ${
                selectedSpecialty === sp
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sp === 'all' ? 'جميع التخصصات' : sp}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-sm hover:shadow-cyan-950/20"
          >
            <div>
              {/* Header Badges */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  {doc.grade}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {doc.fileSize}
                </span>
              </div>

              {/* Title & File Name */}
              <h3 className="font-bold text-slate-100 text-base leading-snug group-hover:text-cyan-300 transition-colors mb-1.5">
                {doc.title}
              </h3>
              <p className="text-xs text-slate-400 font-mono mb-3 truncate flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>{doc.fileName}</span>
              </p>

              {/* Snippet */}
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
                {doc.contentSnippet}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80">
              {/* Uploader Meta */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="flex items-center gap-1 text-slate-300 font-medium truncate">
                  👤 {doc.uploadedBy}
                </span>
                <span className="text-[11px] text-slate-400">{doc.uploadDate}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onStartQuizFromDoc(doc);
                    soundEffects.playLiveActivate();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-950 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>بدء الاختبار التفاعلي ({doc.questionsCount} سؤال)</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-12 glass-card rounded-2xl">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">لم يتم العثور على ملفات تطابق البحث.</p>
        </div>
      )}

      {/* Upload & PDF Conversion Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-cyan-500/30 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    رفع ملف PDF وبنك أسئلة للمكتبة العامة
                  </h3>
                  <p className="text-xs text-slate-400">
                    متاح لجميع طلاب مدرسة مياه الشرب والصرف الصحي بأسيوط
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessAndShare} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  عنوان المذكرة أو بنك الأسئلة *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: أسئلة مراجعة ليلة الامتحان في مروقات محطة أسيوط"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    اسم الطالب الرافع
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    المرحلة الدراسية
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
                  >
                    <option value="الصف الأول">الصف الأول</option>
                    <option value="الصف الثاني">الصف الثاني</option>
                    <option value="الصف الثالث">الصف الثالث</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  الشعبة والتخصص الفني
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
                >
                  <option value="تشغيل محطات مياه وشبكات">
                    تشغيل وصيانة محطات مياه الشرب
                  </option>
                  <option value="شبكات مياه الشرب">
                    شبكات التوزيع والخطوط الناقلة
                  </option>
                  <option value="معالجة صرف صحي">
                    معالجة مياه الصرف الصحي
                  </option>
                  <option value="معامل كيمياء وبكتريولوجيا">
                    معامل الجودة والكيمياء الميدانية
                  </option>
                  <option value="ميكانيكا وكهرباء المحطات">
                    ميكانيكا الطلمبات والأمان المهني
                  </option>
                </select>
              </div>

              {/* PDF File Picker */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  ملف الـ PDF أو المذكرة
                </label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/30 rounded-2xl cursor-pointer transition-colors text-center">
                  <FileUp className="w-8 h-8 text-cyan-400 mb-1" />
                  <span className="font-semibold text-cyan-200">
                    {selectedFileName || 'اختر ملف PDF من جهازك أو اسحبه هنا'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    PDF, DOCX, أو نص الأسئلة
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.txt,.doc,.docx"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {/* Paste or sample text input */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  أو الصق نص الأسئلة مباشرة للتحويل الفوري:
                </label>
                <textarea
                  rows={3}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="س1: ما هو زمن مكوث المياه بالخزان الأرضي؟&#10;1) 30 دقيقة&#10;2) 5 دقائق..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-cyan-400"
                ></textarea>
              </div>

              {uploadStatusMsg && (
                <div className="p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>{uploadStatusMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !title.trim()}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-cyan-950 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isUploading ? 'جاري التحويل...' : 'معالجة ونشر لزملائي بالمدرسة'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
