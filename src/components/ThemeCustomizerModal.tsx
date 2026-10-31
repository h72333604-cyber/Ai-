import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Droplets,
  FlaskConical,
  Crown,
  Volume2,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Sliders,
  User,
  Users,
} from 'lucide-react';
import { ThemeSettings } from '../types';
import { soundEffects, speakArabicText, stopArabicSpeech } from '../utils/audioEffects';
import {
  getThemeSettings,
  saveThemeSettings,
  THEME_PRESETS,
  DEFAULT_THEME_SETTINGS,
} from '../utils/themeManager';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeChanged?: (settings: ThemeSettings) => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  onThemeChanged,
}) => {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTheme(getThemeSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetKey: keyof typeof THEME_PRESETS) => {
    const preset = THEME_PRESETS[presetKey];
    const newTheme: ThemeSettings = {
      ...preset,
      voiceGender: theme.voiceGender,
    };
    setTheme(newTheme);
    saveThemeSettings(newTheme);
    if (onThemeChanged) onThemeChanged(newTheme);
    soundEffects.playClick();
  };

  const handleColorChange = (key: keyof ThemeSettings, val: string) => {
    const newTheme: ThemeSettings = {
      ...theme,
      [key]: val,
      preset: 'custom',
    };
    setTheme(newTheme);
    saveThemeSettings(newTheme);
    if (onThemeChanged) onThemeChanged(newTheme);
  };

  const handleVoiceGenderChange = (gender: 'male' | 'female') => {
    const newTheme: ThemeSettings = {
      ...theme,
      voiceGender: gender,
    };
    setTheme(newTheme);
    saveThemeSettings(newTheme);
    if (onThemeChanged) onThemeChanged(newTheme);
    soundEffects.playClick();
  };

  const handlePlayVoiceSample = () => {
    if (isPlayingSample) {
      stopArabicSpeech();
      setIsPlayingSample(false);
      return;
    }

    setIsPlayingSample(true);
    const sampleText =
      theme.voiceGender === 'female'
        ? 'أهلاً بك يا سيف! أنا دكتورة مريم، مشرفة معامل مياه الشرب. سأشرح لك خطوات تجربة الجار ومعايرة الشبة بدقة.'
        : 'يا مرحباً يا بطل! معك المهندس رأفت الأسيوطي، كبير مهندسي تشغيل محطات مياه الشرب. جاهز لمساعدتك في أي مسألة أو سؤال فني.';

    speakArabicText(
      sampleText,
      theme.voiceGender,
      () => setIsPlayingSample(false),
      () => setIsPlayingSample(false)
    );
  };

  const handleResetDefaults = () => {
    setTheme(DEFAULT_THEME_SETTINGS);
    saveThemeSettings(DEFAULT_THEME_SETTINGS);
    if (onThemeChanged) onThemeChanged(DEFAULT_THEME_SETTINGS);
    soundEffects.playClick();
  };

  const handleSaveAndClose = () => {
    saveThemeSettings(theme);
    if (onThemeChanged) onThemeChanged(theme);
    soundEffects.playVictory();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-7 border border-cyan-500/30 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-xl text-white">
                تخصيص ألوان الواجهة وصوت المساعد الذكي
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تحكم يدوي كامل في ألوان الخلفيات والنصوص والأيقونات، واختيار صوت المساعد بين رجل أو امرأة
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopArabicSpeech();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION 1: QUICK PRESET THEMES */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-cyan-300 block flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>أنماط وثيمات الألوان الجاهزة بنقرة واحدة:</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* Dark Theme */}
            <button
              type="button"
              onClick={() => handleApplyPreset('dark')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                theme.preset === 'dark'
                  ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 ring-2 ring-cyan-500/30 font-bold'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Moon className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
              <div className="text-xs">الوضع الليلي</div>
              <div className="text-[10px] text-slate-400 mt-0.5">كحلي غامق</div>
            </button>

            {/* Light Theme */}
            <button
              type="button"
              onClick={() => handleApplyPreset('light')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                theme.preset === 'light'
                  ? 'border-sky-500 bg-white text-slate-900 ring-2 ring-sky-400/40 font-bold shadow-lg'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Sun className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <div className="text-xs">الوضع النهاري</div>
              <div className="text-[10px] text-slate-500 mt-0.5">أبيض وكتابة سوداء</div>
            </button>

            {/* Hydro Nile Blue */}
            <button
              type="button"
              onClick={() => handleApplyPreset('hydro')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                theme.preset === 'hydro'
                  ? 'border-sky-400 bg-sky-950/50 text-sky-200 ring-2 ring-sky-500/30 font-bold'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Droplets className="w-5 h-5 mx-auto mb-1 text-sky-400" />
              <div className="text-xs">أزرق محطاتي</div>
              <div className="text-[10px] text-slate-400 mt-0.5">مياه النيل</div>
            </button>

            {/* Chemistry Lab */}
            <button
              type="button"
              onClick={() => handleApplyPreset('lab')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                theme.preset === 'lab'
                  ? 'border-emerald-400 bg-emerald-950/50 text-emerald-200 ring-2 ring-emerald-500/30 font-bold'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <FlaskConical className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
              <div className="text-xs">معامل الكيمياء</div>
              <div className="text-[10px] text-slate-400 mt-0.5">زمردي وأخضر</div>
            </button>

            {/* Royal Gold */}
            <button
              type="button"
              onClick={() => handleApplyPreset('royal')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                theme.preset === 'royal'
                  ? 'border-amber-400 bg-amber-950/50 text-amber-200 ring-2 ring-amber-500/30 font-bold'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Crown className="w-5 h-5 mx-auto mb-1 text-amber-400" />
              <div className="text-xs">ذهبي ملكي</div>
              <div className="text-[10px] text-slate-400 mt-0.5">أوائل الطلبة</div>
            </button>
          </div>
        </div>

        {/* SECTION 2: GRANULAR COLOR PICKERS FOR EACH ELEMENT */}
        <div className="space-y-3.5 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-cyan-300 block flex items-center gap-1.5">
            <Sliders className="w-4 h-4" />
            <span>تحديد الألوان بالكامل لكل عنصر من عناصر الواجهة يدوياً:</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Main App Background */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-200">لون الخلفية الرئيسية</div>
                <div className="text-[10px] text-slate-400">خلفية الشاشة الكاملة للتطبيق</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.bgMain}
                  onChange={(e) => handleColorChange('bgMain', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                  {theme.bgMain}
                </span>
              </div>
            </div>

            {/* Card Background Color */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-200">لون بطاقات المحتوى</div>
                <div className="text-[10px] text-slate-400">خلفية البطاقات والأسئلة واللوحات</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.bgCard.startsWith('#') ? theme.bgCard : '#0f172a'}
                  onChange={(e) => handleColorChange('bgCard', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                  {theme.bgCard.slice(0, 7)}
                </span>
              </div>
            </div>

            {/* Main Typography Color */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-200">لون الكتابة والنصوص</div>
                <div className="text-[10px] text-slate-400">العناوين والأسئلة وفقرات الشرح</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.textMain}
                  onChange={(e) => handleColorChange('textMain', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                  {theme.textMain}
                </span>
              </div>
            </div>

            {/* Secondary Typography Color */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-200">لون النصوص الثانوية</div>
                <div className="text-[10px] text-slate-400">التوضيحات والملاحظات المساعدة</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.textMuted}
                  onChange={(e) => handleColorChange('textMuted', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                  {theme.textMuted}
                </span>
              </div>
            </div>

            {/* Icons and Accents Color */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-200">ألوان الأيقونات واللمسات</div>
                <div className="text-[10px] text-slate-400">الأزرار التفاعلية والرموز والأيقونات</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.accentPrimary}
                  onChange={(e) => handleColorChange('accentPrimary', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                  {theme.accentPrimary}
                </span>
              </div>
            </div>

            {/* Border and Dividers Color */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-200">لون الحدود والإطارات</div>
                <div className="text-[10px] text-slate-400">فواصل الأقسام وحواف البطاقات</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.borderColor.startsWith('#') ? theme.borderColor : '#334155'}
                  onChange={(e) => handleColorChange('borderColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                  {theme.borderColor.slice(0, 7)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: AI VOICE SELECTION (MALE OR FEMALE) */}
        <div className="space-y-3.5 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-cyan-300 block flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" />
              <span>اختيار صوت المساعد الذكي لقراءة الشروحات والأسئلة:</span>
            </label>

            <button
              type="button"
              onClick={handlePlayVoiceSample}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                isPlayingSample
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isPlayingSample ? 'إيقاف الصوت ⏹' : 'استمع لعينة الصوت 🔊'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Male Voice */}
            <div
              onClick={() => handleVoiceGenderChange('male')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                theme.voiceGender === 'male'
                  ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 ring-2 ring-cyan-500/30'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold ${
                  theme.voiceGender === 'male'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                👨‍🏫
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">صوت رجل</span>
                  {theme.voiceGender === 'male' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-900 text-cyan-300 border border-cyan-700">
                      محدد حالياً ✓
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-cyan-300 mt-0.5">
                  م/ رأفت الأسيوطي (مهندس محطات أول)
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  نبرة صوت وقورة، واضحة، متخصصة في المحطات والشبكات
                </div>
              </div>
            </div>

            {/* Female Voice */}
            <div
              onClick={() => handleVoiceGenderChange('female')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                theme.voiceGender === 'female'
                  ? 'border-rose-400 bg-rose-950/40 text-rose-200 ring-2 ring-rose-500/30'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold ${
                  theme.voiceGender === 'female'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                👩‍🏫
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">صوت امرأة</span>
                  {theme.voiceGender === 'female' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-900 text-rose-300 border border-rose-700">
                      محدد حالياً ✓
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-rose-300 mt-0.5">
                  د/ مريم الكيميائية (مشرفة معامل الجودة)
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  نبرة صوت مشجعة، دقيقة، تشرح مفاهيم الكيمياء والترويب
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: LIVE PREVIEW MINI CARD */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-400 block">
            معاينة حية لشكل العناصر بالألوان المختارة:
          </label>
          <div
            className="p-4 rounded-2xl border transition-all space-y-2"
            style={{
              backgroundColor: theme.bgCard,
              borderColor: theme.borderColor,
              color: theme.textMain,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-bold"
                style={{ color: theme.accentPrimary }}
              >
                ● بطاقة تجريبية للمعاينة
              </span>
              <span className="text-[10px]" style={{ color: theme.textMuted }}>
                مدرسة مياه الشرب بأسيوط
              </span>
            </div>
            <div className="text-sm font-bold" style={{ color: theme.textMain }}>
              السؤال: ما هي الجرعة النموذجية للشبة في مياه النيل العكرة؟
            </div>
            <div className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>
              هذا النص يوضح تناسق لون الكتابة مع لون الخلفية المختار بدقة، لضمان أعلى مستويات الراحة البصرية أثناء المذاكرة الطويلة.
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors border border-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الألوان الافتراضية</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopArabicSpeech();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-950 flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{savedSuccess ? 'تم الحفظ والتطبيق! ✓' : 'حفظ وتطبيق الألوان'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
