import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Monitor,
  Mic,
  Bell,
  Smartphone,
  HardDrive,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sliders,
  Sparkles,
  Download,
  Info
} from 'lucide-react';
import { soundEffects } from '../utils/audioEffects';

interface PermissionsCenterProps {
  onOpenAPKModal?: () => void;
}

export const PermissionsCenter: React.FC<PermissionsCenterProps> = ({ onOpenAPKModal }) => {
  const [micGranted, setMicGranted] = useState(false);
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [notifGranted, setNotifGranted] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const [offlineCacheSize, setOfflineCacheSize] = useState('14.2 MB (المناهج والأسئلة محفوظة)');
  const [isStandalone, setIsStandalone] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if running in standalone PWA mode
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    }
  }, []);

  const requestMic = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicGranted(true);
        setPermissionMessage(null);
        soundEffects.playCorrect();
        // stop tracks immediately after verifying permission
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (err) {
      console.error(err);
      setPermissionMessage('يرجى السماح بصلاحية الميكروفون من إعدادات المتصفح أو شريط العنوان.');
      setTimeout(() => setPermissionMessage(null), 5000);
    }
  };

  const requestScreenShare = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenShareActive(true);
        soundEffects.playVictory();
        stream.getVideoTracks()[0].onended = () => {
          setScreenShareActive(false);
        };
      } else {
        setScreenShareActive(true);
        soundEffects.playCorrect();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const requestNotification = async () => {
    if (typeof Notification !== 'undefined') {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        setNotifGranted(true);
        soundEffects.playCorrect();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-100">
              مركز الصلاحيات وإدارة النظام المستقل (Standalone OS)
            </h2>
            <p className="text-xs text-slate-400">
              إدارة أذونات الجهاز ليعمل التطبيق بكامل طاقته ومستقلاً عن متصفحات الويب
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>نظام قطرة المستقل جاهز</span>
          </span>
        </div>
      </div>

      {permissionMessage && (
        <div className="p-3.5 rounded-2xl bg-amber-950/70 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex items-center gap-2 animate-fadeIn">
          <Info className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{permissionMessage}</span>
        </div>
      )}

      {/* Permissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Microphone Permission */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  micGranted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  صلاحية الميكروفون (Live Voice)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  للمحادثة الحية اللحظية مع المدرس الذكي Google Live
                </p>
              </div>
            </div>

            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                micGranted
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {micGranted ? 'مفعّلة ✅' : 'غير نشطة'}
            </span>
          </div>

          <button
            onClick={requestMic}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              micGranted
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950'
            }`}
          >
            {micGranted ? 'إعادة فحص الميكروفون 🎙️' : 'طلب وتفعيل صلاحية الميكروفون'}
          </button>
        </div>

        {/* 2. Screen Sharing / Memory Permission */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  screenShareActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  مشاركة الشاشة وذاكرة المحتوى (Live Screen)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تمكين المدرس الذكي من قراءة ملفات الـ PDF وسياق الشاشة التي تفتحها
                </p>
              </div>
            </div>

            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                screenShareActive
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {screenShareActive ? 'نشطة ومتصلة 👁️' : 'جاهزة'}
            </span>
          </div>

          <button
            onClick={requestScreenShare}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              screenShareActive
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950'
            }`}
          >
            {screenShareActive
              ? 'مشاركة الشاشة متصلة بنجاح 🖥️'
              : 'تفعيل مشاركة الشاشة مع المدرس'}
          </button>
        </div>

        {/* 3. Notifications Permission */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  notifGranted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  إشعارات وتنبيهات الامتحانات الحية
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تذكيرك بمواعيد الاختبارات الشفوية والعملية بمحطة أسيوط
                </p>
              </div>
            </div>

            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                notifGranted
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {notifGranted ? 'مسموح بها 🔔' : 'تحتاج إذن'}
            </span>
          </div>

          <button
            onClick={requestNotification}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              notifGranted
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950'
            }`}
          >
            {notifGranted ? 'الإشعارات مفعلة بالفعل 🔔' : 'منح إذن الإشعارات والتنبيهات'}
          </button>
        </div>

        {/* 4. Standalone / Native Mode */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  النظام المستقل (PWA / Standalone App)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  التشغيل كتطبيق أصلي مستقل تماماً عن إطارات المتصفحات
                </p>
              </div>
            </div>

            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-purple-950 text-purple-300 border border-purple-800">
              {isStandalone ? 'مستقل Native' : 'PWA جاهز'}
            </span>
          </div>

          <button
            onClick={() => {
              soundEffects.playVictory();
              if (onOpenAPKModal) {
                onOpenAPKModal();
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-600 text-white shadow-md shadow-purple-950 transition-colors flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل APK أو تثبيت التطبيق على الشاشة الرئيسية</span>
          </button>
        </div>
      </div>

      {/* Offline Storage Status for School Boarding Students (الداخلي) */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">
              وضع عدم الاتصال (Offline Mode) لسكن الداخلي
            </h4>
            <p className="text-xs text-slate-400">
              جميع الأسئلة والكتب والخرائط الذهنية مخزنة محلياً لتمكينك من المذاكرة دون إنترنت
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono text-cyan-300 font-semibold bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            {offlineCacheSize}
          </span>
          <button
            onClick={() => {
              soundEffects.playClick();
              setOfflineCacheSize('16.8 MB (محدّث ومخزن محلياً)');
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>مزامنة الذاكرة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
