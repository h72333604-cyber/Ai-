import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Swords,
  Flame,
  Award,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Crown,
  Medal,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LeaderboardUser, Question } from '../types';
import { INITIAL_LEADERBOARD, INITIAL_QUESTIONS } from '../data/curriculumData';
import { soundEffects } from '../utils/audioEffects';

interface LeaderboardAndDuelsProps {
  studentPoints: number;
  onAddScore: (points: number) => void;
}

export const LeaderboardAndDuels: React.FC<LeaderboardAndDuelsProps> = ({
  studentPoints,
  onAddScore,
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'duel'>('leaderboard');
  const [users, setUsers] = useState<LeaderboardUser[]>(INITIAL_LEADERBOARD);

  // Duel State
  const [inDuel, setInDuel] = useState(false);
  const [duelTimer, setDuelTimer] = useState(45);
  const [duelQuestionIndex, setDuelQuestionIndex] = useState(0);
  const [duelScoreStudent, setDuelScoreStudent] = useState(0);
  const [duelScoreOpponent, setDuelScoreOpponent] = useState(0);
  const [duelFinished, setDuelFinished] = useState(false);
  const [opponentName, setOpponentName] = useState('أحمد محمود العطار (الصف الثالث)');

  // Keep student points synced in leaderboard
  useEffect(() => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === 'user-seif'
          ? { ...u, points: 1420 + studentPoints }
          : u
      ).sort((a, b) => b.points - a.points).map((u, idx) => ({ ...u, rank: idx + 1 }))
    );
  }, [studentPoints]);

  // Duel Timer Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (inDuel && duelTimer > 0 && !duelFinished) {
      interval = setInterval(() => {
        setDuelTimer((prev) => {
          if (prev <= 1) {
            handleEndDuel();
            return 0;
          }
          // Simulate opponent scoring randomly
          if (Math.random() > 0.65) {
            setDuelScoreOpponent((s) => s + 20);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [inDuel, duelTimer, duelFinished]);

  const handleStartDuel = () => {
    setInDuel(true);
    setDuelTimer(45);
    setDuelQuestionIndex(0);
    setDuelScoreStudent(0);
    setDuelScoreOpponent(0);
    setDuelFinished(false);
    soundEffects.playLiveActivate();
  };

  const handleDuelAnswer = (optionIdx: number) => {
    const q = INITIAL_QUESTIONS[duelQuestionIndex % INITIAL_QUESTIONS.length];
    const isCorrect = Number(q.correctAnswer) === optionIdx;

    if (isCorrect) {
      setDuelScoreStudent((s) => s + 25);
      soundEffects.playCorrect();
    } else {
      soundEffects.playIncorrect();
    }

    if (duelQuestionIndex >= INITIAL_QUESTIONS.length - 1) {
      handleEndDuel();
    } else {
      setDuelQuestionIndex((prev) => prev + 1);
    }
  };

  const handleEndDuel = () => {
    setDuelFinished(true);
    if (duelScoreStudent >= duelScoreOpponent) {
      soundEffects.playVictory();
      onAddScore(50);
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });
    } else {
      soundEffects.playIncorrect();
    }
  };

  const duelQ = INITIAL_QUESTIONS[duelQuestionIndex % INITIAL_QUESTIONS.length];

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-100">
              لوحة الصدارة ومبارزات التحدي لطلاب مياه الشرب
            </h2>
            <p className="text-xs text-slate-400">
              تنافس مع زملائك في السكن والمدرسة على أسرع حل لبنوك الأسئلة
            </p>
          </div>
        </div>

        <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => {
              setActiveTab('leaderboard');
              soundEffects.playClick();
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏆 لوحة الشرف الأسبوعية
          </button>
          <button
            onClick={() => {
              setActiveTab('duel');
              soundEffects.playClick();
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'duel'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚔️ حلبة المبارزات السريعة
          </button>
        </div>
      </div>

      {activeTab === 'leaderboard' ? (
        /* School Leaderboard */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Top 3 Podium Highlights */}
            {users.slice(0, 3).map((u, i) => (
              <div
                key={u.id}
                className={`glass-card rounded-3xl p-5 border text-center relative overflow-hidden ${
                  i === 0
                    ? 'border-amber-400/50 bg-gradient-to-b from-amber-950/30 to-slate-900/60 shadow-lg shadow-amber-950/30 ring-1 ring-amber-400/30'
                    : i === 1
                    ? 'border-slate-400/40 bg-slate-900/60'
                    : 'border-orange-500/40 bg-slate-900/60'
                }`}
              >
                {/* Crown Icon */}
                <div className="flex justify-center mb-2">
                  {i === 0 ? (
                    <Crown className="w-7 h-7 text-amber-400 fill-amber-400 animate-bounce" />
                  ) : i === 1 ? (
                    <Medal className="w-6 h-6 text-slate-300" />
                  ) : (
                    <Medal className="w-6 h-6 text-amber-600" />
                  )}
                </div>

                <div className="relative w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2 border-white/20">
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute bottom-0 inset-x-0 text-[10px] font-black text-slate-950 py-0.5 ${
                      i === 0
                        ? 'bg-amber-400'
                        : i === 1
                        ? 'bg-slate-300'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    المركز {u.rank}
                  </span>
                </div>

                <h3 className="font-bold text-slate-100 text-sm mb-1">{u.name}</h3>
                <p className="text-[11px] text-slate-400 mb-2 truncate">{u.school}</p>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-cyan-300 border border-slate-700 font-semibold mb-3">
                  {u.badge}
                </div>

                <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-800 text-xs">
                  <span className="text-amber-400 font-bold font-mono text-base">
                    {u.points}
                  </span>
                  <span className="text-slate-400">نقطة</span>
                </div>
              </div>
            ))}
          </div>

          {/* Full Table */}
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>الترتيب والاسم</span>
              <span>الأسئلة المحلولة</span>
              <span>إجمالي النقاط</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`px-5 py-3.5 flex items-center justify-between transition-colors ${
                    u.id === 'user-seif'
                      ? 'bg-cyan-950/30 border-r-4 border-cyan-400'
                      : 'hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 text-center font-bold font-mono text-sm ${
                        u.rank === 1
                          ? 'text-amber-400'
                          : u.rank === 2
                          ? 'text-slate-300'
                          : u.rank === 3
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}
                    >
                      #{u.rank}
                    </span>
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-200">
                        {u.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{u.school}</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 font-mono">
                    {u.solved} سؤال
                  </div>

                  <div className="text-xs sm:text-sm font-bold text-amber-400 font-mono">
                    {u.points} نقطة
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Duels Arena */
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-rose-500/30 text-center relative overflow-hidden">
          {!inDuel ? (
            <div className="max-w-md mx-auto py-6">
              <div className="w-20 h-20 rounded-full bg-rose-600/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/40 shadow-xl shadow-rose-950/50">
                <Swords className="w-10 h-10 animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">
                مبارزة الأسئلة السريعة (45 ثانية)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                تحدَّ زملاءك في مدرسة مياه الشرب بأسيوط في جولة أسئلة خاطفة من بنك الأسئلة الموحد! من يحل أسرع وبدقة يربح نقاط إضافية ويرتفع في لوحة الشرف!
              </p>

              <button
                onClick={handleStartDuel}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-extrabold text-base shadow-xl shadow-rose-950/60 active:scale-95 transition-all"
              >
                ⚔️ ابدأ مبارزة مع زميل بالمدرسة الآن!
              </button>
            </div>
          ) : duelFinished ? (
            /* Duel Result Screen */
            <div className="max-w-md mx-auto py-6">
              {duelScoreStudent >= duelScoreOpponent ? (
                <>
                  <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-3 animate-bounce" />
                  <h3 className="text-2xl font-black text-amber-300 mb-1">
                    مبروك الفوز يا بطل المحطات! 🏆
                  </h3>
                  <p className="text-xs text-slate-300 mb-4">
                    أحرزت {duelScoreStudent} نقطة مقابل {duelScoreOpponent} لخصمك! تم إضافة 50 نقطة لرصيدك المدرسي.
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 text-rose-400 mx-auto mb-3" />
                  <h3 className="text-2xl font-black text-rose-300 mb-1">
                    محاولة ممتازة، كدت تفوز!
                  </h3>
                  <p className="text-xs text-slate-300 mb-4">
                    أحرزت {duelScoreStudent} نقطة مقابل {duelScoreOpponent} لخصمك. راجع بنك الأسئلة وتحدّه مرة أخرى!
                  </p>
                </>
              )}

              <button
                onClick={handleStartDuel}
                className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
              >
                إعادة التحدي 🔄
              </button>
            </div>
          ) : (
            /* Active Duel Live Arena */
            <div>
              {/* Header with Countdown and Scores */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
                <div className="text-right">
                  <div className="text-xs text-cyan-300 font-bold">سيف الأسيوطي (أنت)</div>
                  <div className="text-xl font-black text-cyan-400 font-mono">
                    {duelScoreStudent} نقطة
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-rose-400 font-mono text-xl font-bold bg-rose-950/60 px-4 py-1.5 rounded-full border border-rose-500/40">
                    <Clock className="w-5 h-5 animate-spin" />
                    <span>00:{duelTimer < 10 ? `0${duelTimer}` : duelTimer}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">المتبقي</span>
                </div>

                <div className="text-left">
                  <div className="text-xs text-rose-300 font-bold">{opponentName}</div>
                  <div className="text-xl font-black text-rose-400 font-mono">
                    {duelScoreOpponent} نقطة
                  </div>
                </div>
              </div>

              {/* Active Duel Question */}
              <div className="max-w-xl mx-auto text-right">
                <span className="text-xs font-semibold text-slate-400 mb-1 block">
                  سؤال رقم {duelQuestionIndex + 1}
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white mb-6 leading-relaxed">
                  {duelQ?.questionText}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {duelQ?.options?.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleDuelAnswer(i)}
                      className="p-3.5 rounded-xl border border-slate-700 bg-slate-900 hover:border-cyan-400 hover:bg-slate-800 text-right text-xs sm:text-sm text-slate-200 transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
