import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Check,
  Layers,
  ArrowRight,
  ShieldCheck,
  User,
  Zap,
} from 'lucide-react';
import { CameraAnalysisResult, Question } from '../types';
import { soundEffects, speakArabicText, stopArabicSpeech } from '../utils/audioEffects';
import { getThemeSettings, setVoiceGender } from '../utils/themeManager';

interface CameraBookExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestionToQuiz?: (question: Question) => void;
}

export const CameraBookExplainerModal: React.FC<CameraBookExplainerModalProps> = ({
  isOpen,
  onClose,
  onAddQuestionToQuiz,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CameraAnalysisResult | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'explain' | 'solution' | 'quiz'>('explain');
  const [voiceGender, setVoiceGenderState] = useState<'male' | 'female'>('male');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [addedQuestionSuccess, setAddedQuestionSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setVoiceGenderState(getThemeSettings().voiceGender || 'male');
    } else {
      stopCamera();
      stopArabicSpeech();
    }
  }, [isOpen]);

  // Start live webcam or mobile back camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // prefer rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      soundEffects.playClick();
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError(
        'تعذر الوصول للكاميرا تلقائياً. يمكنك رفع صورة للمسألة من الاستوديو أو الملفات مباشرة.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  // Capture image from video stream
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    soundEffects.playClick();
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCapturedImage(event.target.result as string);
        stopCamera();
        soundEffects.playClick();
      }
    };
    reader.readAsDataURL(file);
  };

  // Analyze book photo with Gemini Multimodal Vision API
  const handleAnalyzePhoto = async () => {
    if (!capturedImage || isAnalyzing) return;

    setIsAnalyzing(true);
    soundEffects.playClick();

    try {
      const res = await fetch('/api/analyze-book-camera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: capturedImage,
          mode: analysisMode,
          voiceGender,
        }),
      });

      const data = await res.json();
      setAnalysisResult(data);
      soundEffects.playVictory();
    } catch (err) {
      console.error('Error analyzing photo:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Play audio explanation using selected voice gender (male or female)
  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopArabicSpeech();
      setIsPlayingAudio(false);
      return;
    }

    if (!analysisResult) return;

    setIsPlayingAudio(true);
    const textToRead = `${analysisResult.topicTitle}. ${analysisResult.explanation}. ${
      analysisResult.stepByStepSolution
        ? 'خطوات الحل: ' + analysisResult.stepByStepSolution.join('. ')
        : ''
    }. ملاحظة محطة أسيوط: ${analysisResult.practicalAsyutNote}`;

    speakArabicText(
      textToRead,
      voiceGender,
      () => setIsPlayingAudio(false),
      () => setIsPlayingAudio(false)
    );
  };

  const handleSwitchVoice = (gender: 'male' | 'female') => {
    setVoiceGenderState(gender);
    setVoiceGender(gender);
    soundEffects.playClick();
    if (isPlayingAudio) {
      stopArabicSpeech();
      setIsPlayingAudio(false);
    }
  };

  const handleAddQuestion = () => {
    if (analysisResult?.suggestedQuestion && onAddQuestionToQuiz) {
      onAddQuestionToQuiz(analysisResult.suggestedQuestion);
      setAddedQuestionSuccess(true);
      soundEffects.playVictory();
      setTimeout(() => setAddedQuestionSuccess(false), 3000);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    stopArabicSpeech();
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="glass-panel w-full max-w-3xl rounded-3xl p-5 sm:p-7 border border-cyan-500/30 shadow-2xl space-y-5 my-6 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg sm:text-xl text-white">
                  المساعد الذكي البصري • مسح وشرح الكتب بالكاميرا
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Gemini Vision
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                التقط صوراً للمسائل والشروحات من كتب مدرسة مياه الشرب بأسيوط ليقوم المساعد بحلها وشرحها صوتياً
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              stopArabicSpeech();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VOICE SELECTION BAR (MALE / FEMALE) */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>صوت المساعد الذكي لقراءة وشرح المسألة:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSwitchVoice('male')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                voiceGender === 'male'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>👨‍🏫 صوت رجل (م/ رأفت)</span>
              {voiceGender === 'male' && <Check className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={() => handleSwitchVoice('female')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                voiceGender === 'female'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>👩‍🏫 صوت امرأة (د/ مريم)</span>
              {voiceGender === 'female' && <Check className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* STEP 1: CAPTURE PHOTO OR UPLOAD */}
        {!capturedImage && !analysisResult && (
          <div className="space-y-4">
            {/* Live Camera View */}
            {isCameraActive ? (
              <div className="relative rounded-3xl overflow-hidden border-2 border-cyan-500/50 bg-black aspect-video max-h-80 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Target Focus Box Overlay */}
                <div className="absolute inset-8 sm:inset-12 border-2 border-cyan-400/80 rounded-2xl pointer-events-none flex items-center justify-center">
                  <span className="text-[11px] font-bold text-cyan-200 bg-slate-950/70 px-3 py-1 rounded-full border border-cyan-400/50">
                    ضع المسألة أو فقرة الكتاب داخل هذا الإطار
                  </span>
                </div>

                {/* Shutter Button */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
                  <button
                    onClick={captureSnapshot}
                    className="p-4 rounded-full bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-xl shadow-cyan-950/80 font-black transition-transform active:scale-90"
                    title="التقاط الصورة"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 rounded-xl bg-slate-900/80 text-slate-300 text-xs font-bold border border-slate-700"
                  >
                    إلغاء الكاميرا
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-3xl p-8 text-center bg-slate-900/30 flex flex-col items-center justify-center gap-4 transition-all">
                <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    التقط صورة لصفحة الكتاب أو المسألة
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    افتح الكاميرا وصوبها نحو المسألة الحسابية أو الرسم التوضيحي، أو اختر صورة واضحة من معرض الصور بهاتفك
                  </p>
                </div>

                {cameraError && (
                  <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-600/40 text-amber-300 text-xs font-semibold">
                    {cameraError}
                  </div>
                )}

                <div className="flex items-center gap-3 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950 transition-all active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>تشغيل كاميرا الهاتف مباشرة 📷</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-slate-700 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>اختيار صورة من المعرض 🖼️</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: CAPTURED IMAGE PREVIEW & PROCESS TRIGGER */}
        {capturedImage && !analysisResult && (
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden border border-slate-700 bg-slate-900 max-h-72 flex items-center justify-center">
              <img
                src={capturedImage}
                alt="Captured book problem"
                className="max-h-72 w-auto object-contain mx-auto"
              />
              <button
                onClick={handleRetake}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-slate-950/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة الالتقاط</span>
              </button>
            </div>

            {/* Analysis Mode Selector */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'explain', label: 'شرح فني شامل 💡' },
                { id: 'solution', label: 'خطوات الحل والقوانين 🧮' },
                { id: 'quiz', label: 'توليد كويز تدريبي 📝' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setAnalysisMode(m.id as any)}
                  className={`p-2.5 rounded-xl font-bold transition-all ${
                    analysisMode === m.id
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Launch Analysis Button */}
            <button
              onClick={handleAnalyzePhoto}
              disabled={isAnalyzing}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-cyan-950 flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 text-cyan-200 animate-spin" />
              <span>
                {isAnalyzing
                  ? 'جاري تحليل الصورة واستخراج القوانين والشروحات...'
                  : 'تحليل وشرح المسألة بالذكاء الاصطناعي 🚀'}
              </span>
            </button>
          </div>
        )}

        {/* STEP 3: ANALYSIS RESULTS DISPLAY */}
        {analysisResult && (
          <div className="space-y-4">
            {/* Top Result Card Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/50 to-blue-950/50 border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-cyan-300 uppercase">
                  الموضوع الفني المستنتج
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {analysisResult.topicTitle}
                </h3>
              </div>

              {/* Speech Controls */}
              <button
                onClick={handleToggleAudio}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all ${
                  isPlayingAudio
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>
                  {isPlayingAudio
                    ? 'إيقاف الشرح الصوتي ⏹'
                    : `استمع للشرح بصوت (${voiceGender === 'female' ? 'د/ مريم' : 'م/ رأفت'}) 🔊`}
                </span>
              </button>
            </div>

            {/* Extracted Text */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-400 block flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>النص المستخرج من الصورة بالكاميرا:</span>
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                {analysisResult.extractedText}
              </p>
            </div>

            {/* Deep Explanation */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-800/40 space-y-2">
              <span className="text-xs font-bold text-cyan-300 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>الشرح الهندسي والفهم العملي للمسألة:</span>
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {analysisResult.explanation}
              </p>
            </div>

            {/* Step-by-Step Mathematical Solution */}
            {analysisResult.stepByStepSolution && analysisResult.stepByStepSolution.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-300 block flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>خطوات الحل الحسابي والقوانين المستخدمة:</span>
                </span>
                <div className="space-y-1.5">
                  {analysisResult.stepByStepSolution.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practical Asyut Plant Tip */}
            {analysisResult.practicalAsyutNote && (
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-600/30 text-amber-200 text-xs flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>معلومة من واقع محطات مياه أسيوط:</strong>{' '}
                  {analysisResult.practicalAsyutNote}
                </span>
              </div>
            )}

            {/* Suggested Practice Question */}
            {analysisResult.suggestedQuestion && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>سؤال تدريبي مقترح لتثبيت الفهم:</span>
                  </span>
                  {onAddQuestionToQuiz && (
                    <button
                      onClick={handleAddQuestion}
                      className="px-3 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3 h-3" />
                      <span>{addedQuestionSuccess ? 'تمت الإضافة ✓' : 'إضافة للاختبار'}</span>
                    </button>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  {analysisResult.suggestedQuestion.questionText}
                </div>
                <div className="text-xs text-slate-400">
                  الإجابة:{' '}
                  {typeof analysisResult.suggestedQuestion.correctAnswer === 'number' &&
                  analysisResult.suggestedQuestion.options
                    ? analysisResult.suggestedQuestion.options[
                        analysisResult.suggestedQuestion.correctAnswer
                      ]
                    : String(analysisResult.suggestedQuestion.correctAnswer)}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleRetake}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>التقاط مسألة أخرى بالكاميرا</span>
              </button>

              <button
                onClick={() => {
                  stopArabicSpeech();
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
              >
                تم الفهم ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
