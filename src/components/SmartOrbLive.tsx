import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Upload,
  Send,
  X,
  Bot,
  User,
  Radio,
  Eye,
  CheckCircle2,
  RefreshCw,
  PhoneCall,
  PhoneOff,
  Headphones
} from 'lucide-react';
import { PRESET_MASCOTS } from '../data/curriculumData';
import { soundEffects, speakArabicText, stopArabicSpeech } from '../utils/audioEffects';
import { GeminiLiveClient } from '../utils/geminiLiveClient';

interface SmartOrbLiveProps {
  currentScreen: string;
  openDocumentTitle?: string;
  currentQuestion?: string;
  studentGrade?: string;
  onOpenQuestion?: (qText: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const SmartOrbLive: React.FC<SmartOrbLiveProps> = ({
  currentScreen,
  openDocumentTitle,
  currentQuestion,
  studentGrade = 'الصف الثاني فني',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Gemini Live Voice Session states
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening'
  >('disconnected');
  const [liveLevel, setLiveLevel] = useState<number>(0);
  const [liveLiveTranscript, setLiveTranscript] = useState<string>('');
  const [lastUserVoiceInput, setLastUserVoiceInput] = useState<string>('');

  // Avatar / Mascot customization
  const [selectedMascotId, setSelectedMascotId] = useState('mascot-orb');
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Standard chat fallback messages
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'أهلاً بك يا سيف! أنا كورة قطرة الذكية ومدرّسك الصوتي المباشر بتقنية Gemini Live. اضغط زر "المحادثة الصوتية المباشرة" للتحدث معي بصوتك لحظة بلحظة وبدون كتابة، وسأشرح لك أي جزء في مناهج محطات وشبكات مياه الشرب بأسيوط!',
      timestamp: 'الآن',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveClientRef = useRef<GeminiLiveClient | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveLiveTranscript, isLoading]);

  // Clean up Live session on unmount
  useEffect(() => {
    return () => {
      if (liveClientRef.current) {
        liveClientRef.current.stop();
      }
    };
  }, []);

  const handleStartLiveVoice = async () => {
    soundEffects.playLiveActivate();
    setIsLiveActive(true);
    setLiveStatus('connecting');

    const client = new GeminiLiveClient({
      onStatusChange: (status) => {
        setLiveStatus(status);
      },
      onInputTranscript: (userText) => {
        setLastUserVoiceInput(userText);
        setMessages((prev) => {
          // If last message was user, update it, else add new
          const last = prev[prev.length - 1];
          if (last && last.sender === 'user') {
            return [...prev.slice(0, -1), { ...last, text: userText }];
          }
          return [
            ...prev,
            {
              id: `user-voice-${Date.now()}`,
              sender: 'user',
              text: userText,
              timestamp: 'صوتي حَي',
            },
          ];
        });
      },
      onOutputTranscript: (modelText) => {
        setLiveTranscript(modelText);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.sender === 'ai' && last.timestamp === 'Gemini Live') {
            return [...prev.slice(0, -1), { ...last, text: modelText }];
          }
          return [
            ...prev,
            {
              id: `ai-voice-${Date.now()}`,
              sender: 'ai',
              text: modelText,
              timestamp: 'Gemini Live',
            },
          ];
        });
      },
      onInterrupted: () => {
        soundEffects.playClick();
      },
      onAudioLevel: (lvl) => {
        setLiveLevel(lvl);
      },
      onError: (err) => {
        console.warn('Gemini Live fallback notice:', err);
      },
    });

    liveClientRef.current = client;
    await client.start();
  };

  const handleStopLiveVoice = () => {
    soundEffects.playClick();
    if (liveClientRef.current) {
      liveClientRef.current.stop();
      liveClientRef.current = null;
    }
    setIsLiveActive(false);
    setLiveStatus('disconnected');
    setLiveLevel(0);
    stopArabicSpeech();
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    soundEffects.playClick();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: 'الآن',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');

    if (isLiveActive && liveClientRef.current) {
      // Send directly over Live WebSocket
      liveClientRef.current.sendTextMessage(userText);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          context: {
            currentScreen,
            openDocumentTitle: openDocumentTitle || 'مقررات شركة مياه الشرب بأسيوط',
            currentQuestion: currentQuestion || 'لا يوجد سؤال محدد',
            studentGrade,
          },
        }),
      });

      const data = await res.json();
      const replyText = data.reply || 'شكراً لسؤالك! أنا معك دائماً في أي استفسار فني.';

      setMessages((prev) => [
        ...prev,
        {
          id: `reply-${Date.now()}`,
          sender: 'ai',
          text: replyText,
          timestamp: 'الآن',
        },
      ]);

      if (soundEnabled) {
        speakArabicText(replyText);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: 'أنا معك دائماً في مدرسة مياه الشرب بأسيوط لمراجعة المحطات والمناهج!',
          timestamp: 'الآن',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomAvatarUrl(reader.result as string);
        setSelectedMascotId('custom-avatar');
        setShowAvatarPicker(false);
        soundEffects.playCorrect();
      };
      reader.readAsDataURL(file);
    }
  };

  const currentMascot = PRESET_MASCOTS.find((m) => m.id === selectedMascotId);
  const activeAvatarImage =
    selectedMascotId === 'custom-avatar'
      ? customAvatarUrl
      : currentMascot?.avatarUrl || null;

  const isSpeaking = liveStatus === 'speaking';
  const isListening = liveStatus === 'listening';

  return (
    <>
      {/* Floating Smart Orb Widget */}
      {!isOpen && (
        <div className="fixed bottom-20 sm:bottom-24 left-4 sm:left-6 z-40 flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel text-xs text-cyan-200 border border-cyan-500/30 shadow-lg shadow-cyan-950/50 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-semibold">المدرس الصوتي Gemini Live</span>
            {openDocumentTitle && (
              <span className="text-slate-400 text-[11px] truncate max-w-[120px]">
                | {openDocumentTitle}
              </span>
            )}
          </div>

          <button
            onClick={() => {
              setIsOpen(true);
              soundEffects.playLiveActivate();
            }}
            className="group relative flex items-center justify-center w-16 h-16 rounded-full transition-transform active:scale-95 focus:outline-none"
            title="افتح المدرس الصوتي وكورة قطرة التفاعلية"
          >
            <span className="absolute inset-0 rounded-full bg-cyan-500/20 animate-water-ripple pointer-events-none"></span>
            <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 opacity-75 blur-sm group-hover:opacity-100 transition-opacity animate-orb-glow"></span>

            <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-900 border-2 border-cyan-400/80 flex items-center justify-center shadow-xl shadow-cyan-500/30">
              {activeAvatarImage ? (
                <img
                  src={activeAvatarImage}
                  alt="مدرس قطرة الكرتوني"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="relative w-full h-full bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-700 flex flex-col items-center justify-center p-2">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.4),transparent_60%)]"></div>
                  <Radio className="w-6 h-6 text-white animate-pulse" />
                </div>
              )}
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
            </div>
          </button>
        </div>
      )}

      {/* Expanded Modal / Live Conversation Screen */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ${
            isFullScreen
              ? 'inset-0 bg-slate-950/95 backdrop-blur-xl flex flex-col p-4 sm:p-6'
              : 'bottom-4 left-4 sm:bottom-6 sm:left-6 w-[calc(100vw-2rem)] sm:w-[460px] max-h-[88vh] h-[670px] rounded-3xl glass-panel shadow-2xl shadow-cyan-950/80 border border-cyan-500/30 flex flex-col overflow-hidden'
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 bg-slate-900/70">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-full overflow-hidden border border-cyan-400/60 shadow-inner">
                {activeAvatarImage ? (
                  <img
                    src={activeAvatarImage}
                    alt="الأفاتار"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                {isSpeaking && (
                  <span className="absolute inset-0 bg-cyan-400/40 animate-pulse"></span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-cyan-200">
                    {selectedMascotId === 'custom-avatar'
                      ? 'مدرسي الكرتوني الخاص'
                      : currentMascot?.name || 'الكورة الذكية'}
                  </h3>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isLiveActive
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                        : 'bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    {isLiveActive ? 'GEMINI LIVE' : 'LIVE READY'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  مدرسة مياه الشرب والصرف الصحي بأسيوط
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (soundEnabled) stopArabicSpeech();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                title={soundEnabled ? 'كتم الصوت' : 'تفعيل الصوت'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
              </button>

              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                title="تخصيص شكل المدرس أو رفع شخصية كرتونية"
              >
                <Bot className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                title={isFullScreen ? 'تصغير' : 'تكبير ملء الشاشة'}
              >
                {isFullScreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={() => {
                  handleStopLiveVoice();
                  setIsOpen(false);
                  setIsFullScreen(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Screen / Context Awareness Ribbon */}
          <div className="bg-slate-900/90 px-3.5 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1.5 truncate">
              <Eye className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="text-slate-400 text-[11px]">ذاكرة الشاشة:</span>
              <span className="text-cyan-200 font-medium truncate">
                {openDocumentTitle || currentScreen || 'مقرر مياه أسيوط'}
              </span>
            </div>
            {isLiveActive && (
              <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>صوت حي متصل</span>
              </span>
            )}
          </div>

          {/* Avatar Customization Drawer */}
          {showAvatarPicker && (
            <div className="p-3 bg-slate-900/95 border-b border-cyan-500/20 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-cyan-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> اختر شخصية المدرس الذكي أو ارفع صورتك
                </span>
                <button
                  onClick={() => setShowAvatarPicker(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                {PRESET_MASCOTS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMascotId(m.id);
                      soundEffects.playClick();
                    }}
                    className={`flex items-center gap-2 p-1.5 rounded-xl border text-right transition-all ${
                      selectedMascotId === m.id
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-100 shadow-sm'
                        : 'border-slate-800 bg-slate-800/50 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-800 border border-slate-700 flex items-center justify-center">
                      {m.avatarUrl ? (
                        <img
                          src={m.avatarUrl}
                          alt={m.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Radio className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold truncate text-[11px]">{m.name}</div>
                      <div className="text-[9px] text-slate-400">{m.tag}</div>
                    </div>
                  </button>
                ))}
              </div>

              <label className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 cursor-pointer text-xs transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>رفع صورة شخصية كرتونية مخصصة (أو صورتك)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCustomAvatarUpload}
                />
              </label>
            </div>
          )}

          {/* Central Live Stage: Interactive Orb / Mascot with Gemini Live Voice Controls */}
          <div
            className={`flex flex-col items-center justify-center transition-all ${
              isFullScreen ? 'py-8' : 'py-3'
            } bg-gradient-to-b from-cyan-950/25 to-transparent relative`}
          >
            {/* Ambient Water and Voice Waves */}
            <div className="relative flex items-center justify-center">
              <div
                className={`absolute rounded-full transition-all duration-300 pointer-events-none ${
                  isSpeaking
                    ? 'w-44 h-44 bg-cyan-500/25 animate-water-ripple'
                    : isListening
                    ? 'w-36 h-36 bg-emerald-500/20 animate-water-ripple'
                    : 'w-28 h-28 bg-cyan-500/10'
                }`}
                style={{
                  transform: `scale(${1 + liveLevel * 0.5})`,
                }}
              ></div>

              {/* Glowing Interactive Orb Frame */}
              <div
                onClick={isLiveActive ? handleStopLiveVoice : handleStartLiveVoice}
                className={`relative cursor-pointer rounded-full p-1.5 transition-all duration-300 ${
                  isSpeaking
                    ? 'animate-orb-speaking ring-4 ring-cyan-400 shadow-2xl shadow-cyan-500/50 scale-105'
                    : isListening
                    ? 'ring-4 ring-emerald-500 scale-105 shadow-2xl shadow-emerald-500/50'
                    : 'animate-orb-glow ring-2 ring-cyan-500/40 hover:scale-105'
                }`}
                title={isLiveActive ? 'اضغط لإنهاء المحادثة الصوتية' : 'اضغط لبدء Gemini Live'}
              >
                <div
                  className={`${
                    isFullScreen ? 'w-28 h-28' : 'w-20 h-20'
                  } rounded-full overflow-hidden bg-slate-900 border-2 border-cyan-300/80 flex items-center justify-center relative shadow-inner`}
                >
                  {activeAvatarImage ? (
                    <img
                      src={activeAvatarImage}
                      alt="مدرس قطرة"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-700 flex flex-col items-center justify-center">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.6),transparent_60%)]"></div>
                      <Radio
                        className={`${
                          isFullScreen ? 'w-10 h-10' : 'w-8 h-8'
                        } text-white animate-pulse`}
                      />
                    </div>
                  )}

                  {/* Dynamic Status Pill */}
                  <div
                    className={`absolute bottom-0 inset-x-0 py-0.5 text-[9px] font-bold text-center text-white ${
                      isSpeaking
                        ? 'bg-cyan-600'
                        : isListening
                        ? 'bg-emerald-600'
                        : isLiveActive
                        ? 'bg-amber-600'
                        : 'bg-slate-900/80 backdrop-blur-sm text-cyan-300'
                    }`}
                  >
                    {isSpeaking
                      ? 'يشرح صوتياً...'
                      : isListening
                      ? 'يستمع إليك...'
                      : isLiveActive
                      ? 'متصل...'
                      : 'Gemini Live'}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Audio Control Call Button */}
            <div className="mt-3 flex items-center gap-3">
              {!isLiveActive ? (
                <button
                  onClick={handleStartLiveVoice}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-950/60 active:scale-95 transition-all"
                >
                  <Headphones className="w-4 h-4" />
                  <span>بدء محادثة Gemini Live الصوتية 🎙️</span>
                </button>
              ) : (
                <button
                  onClick={handleStopLiveVoice}
                  className="flex items-center gap-2 px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-950/60 active:scale-95 transition-all"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>إنهاء المحادثة الصوتية الحية</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-1.5">
              {isLiveActive
                ? isSpeaking
                  ? '🔊 المدرس الذكي يشرح بصوت Gemini Live الطبيعي...'
                  : '🟢 استمع إليك الآن مباشرة، تحدث بصوتك دون توقف!'
                : 'تحدث صوتياً بكل سلاسة وسرعة كأنك في جلسة حقيقية مع مدرسك'}
            </p>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-slate-950/40">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${
                  m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    m.sender === 'user'
                      ? 'bg-sky-600 text-white'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  }`}
                >
                  {m.sender === 'user' ? (
                    <User className="w-3.5 h-3.5" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/30'
                      : 'bg-slate-800/80 text-slate-200 border border-slate-700/60 shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                    <span className="font-mono">{m.timestamp}</span>
                    {m.sender === 'ai' && (
                      <button
                        onClick={() => speakArabicText(m.text)}
                        className="hover:text-cyan-300 flex items-center gap-1"
                        title="إعادة الاستماع"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>استمع</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-cyan-400 py-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>المدرس الذكي يفكر ويستحضر سياق المنهج ومحطة أسيوط...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Technical Suggestions */}
          <div className="px-3 py-1.5 bg-slate-900/70 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap scrollbar-none">
            <span className="text-slate-400 font-medium">موضوعات سريعة:</span>
            <button
              onClick={() => handleSendMessage('كيف يتم إجراء اختبار الجار بالمحطة؟')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-cyan-950/50 hover:text-cyan-300 hover:border-cyan-500/50 border border-slate-700/50 text-slate-300 transition-colors"
            >
              🧪 اختبار الجار والشبة
            </button>
            <button
              onClick={() => handleSendMessage('متى نقوم بالغسيل العكسي للمرشح الرملي؟')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-cyan-950/50 hover:text-cyan-300 hover:border-cyan-500/50 border border-slate-700/50 text-slate-300 transition-colors"
            >
              💧 غسيل المرشحات
            </button>
            <button
              onClick={() => handleSendMessage('كيف نكشف عن تسريب غاز الكلور بأمان؟')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-cyan-950/50 hover:text-cyan-300 hover:border-cyan-500/50 border border-slate-700/50 text-slate-300 transition-colors"
            >
              ⚠️ طوارئ الكلور
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-cyan-500/20 bg-slate-900/90 flex items-center gap-2">
            <button
              onClick={isLiveActive ? handleStopLiveVoice : handleStartLiveVoice}
              className={`p-2.5 rounded-xl transition-all ${
                isLiveActive
                  ? 'bg-rose-600 text-white ring-4 ring-rose-500/40 animate-pulse'
                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
              }`}
              title={isLiveActive ? 'إنهاء المحادثة الصوتية' : 'تحدث صوتياً (Gemini Live)'}
            >
              {isLiveActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputMessage);
              }}
              className="flex-1 flex items-center gap-1.5"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="اسأل مدرّسك، أو اضغط زر المحادثة الصوتية..."
                className="w-full bg-slate-800/90 text-slate-100 placeholder-slate-400 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition-all shadow-md shadow-cyan-950"
                title="إرسال"
              >
                <Send className="w-4 h-4 -scale-x-100" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
