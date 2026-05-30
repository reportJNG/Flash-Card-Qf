'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Infinity,
  Layers3,
  Star,
  Trophy,
  X,
} from 'lucide-react';
import {
  answerSessionCard,
  closeSession,
  getSessionAnswers,
  getSessionCurrentQuestion,
} from '@/lib/actions/sessions';
import { toggleSaveToSpecial } from '@/lib/actions/questions';
import { PlaySession, Question } from '@/types/app';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { LoadingState } from '@/components/shared/AppShell';

type RatingKey = 'easy' | 'good' | 'hard' | 'super_hard';

const POINTS: Record<RatingKey, number> = {
  easy: 10,
  good: 7,
  hard: 3,
  super_hard: 0,
};

const CORRECT_RATINGS = new Set<string>(['easy', 'good']);

const RATING_BUTTONS = [
  { label: 'Easy', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', key: 'easy' as const, shortcut: '1' },
  { label: 'Good', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.15)', key: 'good' as const, shortcut: '2' },
  { label: 'Hard', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', key: 'hard' as const, shortcut: '3' },
  { label: 'Super Hard', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', key: 'super_hard' as const, shortcut: '4' },
];

export default function FlashcardSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.session_id as string;

  const [session, setSession] = useState<PlaySession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [profileId, setProfileId] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [queue, setQueue] = useState<string[]>([]);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showRatings, setShowRatings] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [loopPulse, setLoopPulse] = useState(false);
  const [loading, setLoading] = useState(true);
  const ratingLockRef = useRef(false);

  const loadSession = useCallback(async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      if (!sessionRes.ok) {
        router.push('/');
        return;
      }

      const profileSession = await sessionRes.json();
      setProfileId(profileSession.profile_id);

      const result = await getSessionCurrentQuestion(sessionId);
      if (!result.success || !result.data) {
        toast.error(result.error || 'Session not found');
        router.push('/play');
        return;
      }

      const { session: s, question } = result.data;
      setSession(s);

      if (s.status !== 'active') {
        router.push(`/play/session/${sessionId}/results`);
        return;
      }

      setQueue(s.question_queue);
      setCurrentIndex(s.current_index);
      setSessionPoints(s.points_earned);

      const answersResult = await getSessionAnswers(sessionId);
      if (answersResult.success && answersResult.data) {
        const correct = answersResult.data.filter((answer) => CORRECT_RATINGS.has(answer.result)).length;
        setCorrectCount(correct);
        setErrorCount(answersResult.data.length - correct);
      }

      if (question) {
        setCurrentQuestion(question);
        setIsSaved(question.is_saved_special);
      } else {
        toast.error('No current question found');
      }
    } catch (error) {
      console.error('Failed to load session', error);
      toast.error('Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [sessionId, router]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const revealAnswer = useCallback(() => {
    if (isFlipped || isTransitioning || loading || !currentQuestion) return;

    setIsFlipped(true);
    window.setTimeout(() => setShowRatings(true), 220);
  }, [currentQuestion, isFlipped, isTransitioning, loading]);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (isTransitioning || loading || !currentQuestion) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        revealAnswer();
        return;
      }

      if (isFlipped && showRatings) {
        const ratingMap: Record<string, RatingKey> = {
          '1': 'easy',
          '2': 'good',
          '3': 'hard',
          '4': 'super_hard',
        };
        const rating = ratingMap[e.key];
        if (rating) {
          await handleRate(rating);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFlipped, showRatings, isTransitioning, currentQuestion, loading, revealAnswer]);

  const handleRate = async (result: RatingKey) => {
    if (!session || !currentQuestion || isTransitioning || ratingLockRef.current) return;
    ratingLockRef.current = true;
    setIsTransitioning(true);

    window.setTimeout(async () => {
      try {
        const answerResult = await answerSessionCard(sessionId, result);

        if (!answerResult.success || !answerResult.data) {
          toast.error(answerResult.error || 'Failed to record answer');
          ratingLockRef.current = false;
          setIsTransitioning(false);
          return;
        }

        const next = answerResult.data;
        setSession(next.session);
        setQueue(next.session.question_queue);
        setCurrentIndex(next.session.current_index);
        setSessionPoints(next.session.points_earned);
        if (CORRECT_RATINGS.has(result)) {
          setCorrectCount((count) => count + 1);
        } else {
          setErrorCount((count) => count + 1);
        }
        setShowRatings(false);
        setIsFlipped(false);

        if (next.completed) {
          router.push(`/play/session/${sessionId}/results`);
          return;
        }

        if (!next.question) {
          toast.error('No next question found');
          ratingLockRef.current = false;
          setIsTransitioning(false);
          return;
        }

        if (next.refreshedQueue) {
          setLoopPulse(true);
          window.setTimeout(() => setLoopPulse(false), 600);
        }

        setCurrentQuestion(next.question);
        setIsSaved(next.question.is_saved_special);
        setCardKey((key) => key + 1);
        ratingLockRef.current = false;
        setIsTransitioning(false);
      } catch {
        toast.error('Failed to record answer');
        ratingLockRef.current = false;
        setIsTransitioning(false);
      }
    }, 180);
  };

  const handleToggleSave = async () => {
    if (!currentQuestion) return;
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    const result = await toggleSaveToSpecial(currentQuestion.id, profileId);
    if (!result.success) {
      setIsSaved(!newSaved);
      toast.error('Failed to save');
    }
  };

  const handleQuit = async () => {
    await closeSession(sessionId, 'quit');
    router.push(`/play/session/${sessionId}/results`);
  };

  if (loading) {
    return <LoadingState label="Loading session" />;
  }

  if (!session || !currentQuestion) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted">No questions available</p>
      </div>
    );
  }

  const totalCards = queue.length;
  const currentCardNum = Math.min(currentIndex + 1, totalCards);
  const isInfinity = session.is_infinity;
  const answeredCount = correctCount + errorCount;
  const remainingCount = Math.max(totalCards - currentIndex, 0);
  const smartRate = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const progressPercent = !isInfinity && totalCards > 0 ? (currentIndex / totalCards) * 100 : 0;
  const stats = [
    {
      label: 'Left',
      value: isInfinity ? 'Endless' : remainingCount,
      icon: isInfinity ? Infinity : Clock3,
      className: 'text-accent-indigo',
      bg: 'bg-accent-indigo/10',
    },
    {
      label: 'True',
      value: correctCount,
      icon: CheckCircle2,
      className: 'text-accent-green',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Error',
      value: errorCount,
      icon: AlertTriangle,
      className: 'text-accent-red',
      bg: 'bg-red-500/10',
    },
  ];

  return (
    <div className="relative flex min-h-[calc(100svh-8rem)] flex-col overflow-hidden rounded-lg border border-border-subtle bg-bg-primary shadow-card md:min-h-[calc(100svh-3rem)]">
      <div className="border-b border-border-subtle bg-bg-secondary/85 px-3 py-3 backdrop-blur sm:px-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowQuitConfirm(true)}
                className="rounded-lg p-2 text-text-muted transition-colors hover:bg-white/5 hover:text-accent-red focus-ring"
                aria-label="Quit session"
              >
                <X className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <Layers3 className="h-4 w-4 text-accent-indigo" />
                  {isInfinity ? (
                    <span className="flex items-center gap-1.5">
                      Endless play
                      <Infinity className={cn('h-4 w-4 text-accent-teal', loopPulse && 'animate-pulse-fast')} />
                    </span>
                  ) : (
                    <span>Card {currentCardNum} of {totalCards}</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-text-muted">
                  {answeredCount > 0 ? `${answeredCount} answered - ${smartRate}% true rate` : 'Rate each revealed answer to build your stats'}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-tertiary px-3 py-2">
              <Trophy className="h-4 w-4 text-accent-gold" />
              <span className="font-semibold text-accent-gold">{sessionPoints}</span>
              <span className="text-sm text-text-muted">pts</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="min-w-0 rounded-lg border border-border-subtle bg-bg-tertiary px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', stat.bg, stat.className)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase text-text-muted">{stat.label}</p>
                      <p className={cn('truncate text-base font-semibold leading-tight', stat.className)}>{stat.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {!isInfinity && (
        <div className="h-0.5 bg-bg-quaternary">
          <motion.div
            className="h-full bg-accent-indigo"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <div className="flex flex-1 items-center justify-center overflow-y-auto px-3 py-4 sm:px-4 sm:py-6">
        <div
          className="w-full max-w-3xl"
          onClick={revealAnswer}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              revealAnswer();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={isFlipped ? 'Answer shown' : 'Reveal answer'}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${cardKey}-${isFlipped ? 'answer' : 'question'}`}
              initial={{ x: 48, opacity: 0, scale: 0.98 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -48, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full"
            >
              {!isFlipped ? (
                <div className="relative flex min-h-[320px] cursor-pointer select-none flex-col overflow-hidden rounded-lg bg-card-surface p-5 text-slate-900 shadow-flashcard sm:min-h-[380px] sm:p-6 md:p-8">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSave();
                    }}
                    className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-black/5 hover:text-accent-gold focus-ring"
                    aria-label={isSaved ? 'Remove from special questions' : 'Save to special questions'}
                  >
                    <Star className={cn('h-5 w-5', isSaved ? 'text-accent-gold fill-current' : 'text-slate-400')} />
                  </button>
                  <div className="pr-12">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-500">Question</p>
                    <h1 className="max-h-[min(44svh,360px)] overflow-y-auto break-words text-balance text-xl font-bold leading-snug text-slate-950 scrollbar-thin sm:text-2xl md:text-3xl">
                      {currentQuestion.question}
                    </h1>
                  </div>
                  <div className="flex min-h-24 flex-1 items-end justify-center pt-8">
                    <div className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-center text-sm font-medium text-slate-500 shadow-sm">
                      Tap or press Space to reveal answer
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative flex min-h-[360px] cursor-default select-none flex-col overflow-hidden rounded-lg bg-card-surface p-5 text-slate-900 shadow-flashcard sm:p-6 md:p-8">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSave();
                    }}
                    className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-black/5 hover:text-accent-gold focus-ring"
                    aria-label={isSaved ? 'Remove from special questions' : 'Save to special questions'}
                  >
                    <Star className={cn('h-5 w-5', isSaved ? 'text-accent-gold fill-current' : 'text-slate-400')} />
                  </button>
                  <div className="pr-12">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-500">Question</p>
                    <h1 className="max-h-28 overflow-y-auto break-words text-base font-bold leading-snug text-slate-950 scrollbar-thin sm:text-lg md:text-xl">
                      {currentQuestion.question}
                    </h1>
                  </div>
                  <div className="mt-4 flex min-h-[180px] flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white/70 p-4 sm:mt-6 sm:p-5">
                    <p className="max-h-[min(42svh,360px)] overflow-y-auto break-words text-center text-lg font-medium leading-relaxed text-slate-800 scrollbar-thin sm:text-xl md:text-2xl">
                      {currentQuestion.answer}
                    </p>
                  </div>
                  <p className="mt-5 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
                    Choose how well you knew it
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showRatings && !isTransitioning && (
          <motion.div
            initial={{ opacity: 0, y: 44 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 44 }}
            transition={{ duration: 0.25 }}
            className="border-t border-border-subtle bg-bg-secondary/85 px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur md:px-4 md:pb-5"
          >
            <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 md:grid-cols-4">
              {RATING_BUTTONS.map((btn, i) => (
                <motion.button
                  key={btn.key}
                  initial={{ opacity: 0, y: 24, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 20 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleRate(btn.key)}
                  className="relative flex min-h-20 flex-col items-center justify-center gap-1 rounded-lg border border-white/5 px-3 py-3 transition-all hover:shadow-lg focus-ring"
                  style={{
                    backgroundColor: btn.bg,
                    boxShadow: `0 0 20px ${btn.color}20`,
                  }}
                >
                  <span className="absolute right-2 top-2 font-mono text-[10px] opacity-50" style={{ color: btn.color }}>
                    {btn.shortcut}
                  </span>
                  <span className="text-sm font-semibold uppercase" style={{ color: btn.color }}>
                    {btn.label}
                  </span>
                  <span className="text-xs opacity-70" style={{ color: btn.color }}>
                    +{POINTS[btn.key]} pts
                  </span>
                </motion.button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-text-muted">Press 1-4 to rate</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowQuitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-lg border border-border-subtle bg-bg-secondary p-5 shadow-elevated sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-2 text-xl font-semibold text-text-primary">Quit Session?</h2>
              <p className="mb-6 text-sm text-text-secondary">
                Your progress will be saved. You can view your results after quitting.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowQuitConfirm(false)}
                  className="flex-1 rounded-lg border border-border-subtle py-2.5 text-text-secondary transition-colors hover:text-text-primary focus-ring"
                >
                  Continue
                </button>
                <button
                  onClick={handleQuit}
                  className="flex-1 rounded-lg bg-accent-red py-2.5 text-white transition-colors hover:bg-red-600 focus-ring"
                >
                  Quit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
