'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Infinity, Star } from 'lucide-react';
import { answerSessionCard, getSessionCurrentQuestion, closeSession } from '@/lib/actions/sessions';
import { toggleSaveToSpecial } from '@/lib/actions/questions';
import { PlaySession, Question } from '@/types/app';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { LoadingState } from '@/components/shared/AppShell';

const POINTS: Record<string, number> = { easy: 10, good: 7, hard: 3, super_hard: 0 };

const RATING_BUTTONS = [
  { label: 'Easy', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', glow: 'shadow-glow-green', key: 'easy' as const, shortcut: '1' },
  { label: 'Good', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.15)', glow: 'shadow-[0_0_24px_rgba(20,184,166,0.3)]', key: 'good' as const, shortcut: '2' },
  { label: 'Hard', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', glow: 'shadow-[0_0_24px_rgba(249,115,22,0.3)]', key: 'hard' as const, shortcut: '3' },
  { label: 'Super Hard', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', glow: 'shadow-glow-red', key: 'super_hard' as const, shortcut: '4' },
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
      if (!sessionRes.ok) { router.push('/'); return; }
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
    window.setTimeout(() => setShowRatings(true), 360);
  }, [currentQuestion, isFlipped, isTransitioning, loading]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (isTransitioning || loading || !currentQuestion) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        revealAnswer();
        return;
      }

      if (isFlipped && showRatings) {
        const ratingMap: Record<string, string> = { '1': 'easy', '2': 'good', '3': 'hard', '4': 'super_hard' };
        const rating = ratingMap[e.key];
        if (rating) {
          await handleRate(rating as 'easy' | 'good' | 'hard' | 'super_hard');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFlipped, showRatings, isTransitioning, currentQuestion, loading, revealAnswer]);

  const handleRate = async (result: 'easy' | 'good' | 'hard' | 'super_hard') => {
    if (!session || !currentQuestion || isTransitioning || ratingLockRef.current) return;
    ratingLockRef.current = true;
    setIsTransitioning(true);

    setTimeout(async () => {
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
          setTimeout(() => setLoopPulse(false), 600);
        }

        setCurrentQuestion(next.question);
        setIsSaved(next.question.is_saved_special);
        setCardKey(k => k + 1);
        ratingLockRef.current = false;
        setIsTransitioning(false);
      } catch {
        toast.error('Failed to record answer');
        ratingLockRef.current = false;
        setIsTransitioning(false);
      }
    }, 250);
  };

  const handleFlip = () => {
    revealAnswer();
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
  const currentCardNum = currentIndex + 1;
  const isInfinity = session.is_infinity;

  return (
    <div className="relative flex min-h-[calc(100svh-8rem)] flex-col overflow-hidden rounded-lg border border-border-subtle bg-bg-primary shadow-card md:min-h-[calc(100svh-3rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-3 sm:px-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowQuitConfirm(true)} className="rounded-lg p-2 text-text-muted transition-colors hover:bg-white/5 hover:text-accent-red focus-ring" aria-label="Quit session">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm">
            {isInfinity ? (
              <div className="flex items-center gap-1 text-accent-teal">
                <Infinity className={cn('w-4 h-4', loopPulse && 'animate-pulse-fast')} />
                <span>Endless</span>
              </div>
            ) : (
              <span className="text-text-secondary">
                Card {currentCardNum} / {totalCards}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-accent-gold" />
          <span className="text-accent-gold font-semibold">{sessionPoints}</span>
          <span className="text-text-muted text-sm">pts</span>
        </div>
      </div>

      {/* Progress bar */}
      {!isInfinity && (
        <div className="h-0.5 bg-bg-quaternary">
          <motion.div
            className="h-full bg-accent-indigo"
            initial={false}
            animate={{ width: `${(currentCardNum / totalCards) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Flashcard Area */}
      <div className="flex flex-1 items-center justify-center px-3 py-4 sm:px-4 sm:py-6">
        <div
          className="w-full max-w-2xl perspective-1000"
          onClick={handleFlip}
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
              key={cardKey}
              initial={{ x: 72, opacity: 0, scale: 0.96 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -72, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative h-[min(460px,calc(100svh-260px))] min-h-[320px] w-full"
            >
              <motion.div
                className="preserve-3d relative h-full w-full"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Front */}
                <div className="backface-hidden absolute inset-0">
                  <div className="relative flex h-full cursor-pointer select-none flex-col overflow-hidden rounded-xl bg-card-surface p-5 text-slate-900 shadow-flashcard sm:p-6 md:p-8">
                  {/* Star */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleSave(); }}
                    className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-black/5 hover:text-accent-gold"
                    aria-label={isSaved ? 'Remove from special questions' : 'Save to special questions'}
                  >
                    <Star className={cn('w-5 h-5', isSaved ? 'text-accent-gold fill-current' : 'text-slate-400')} />
                  </button>
                    <div className="pr-12">
                      <p className="mb-2 text-xs font-semibold uppercase text-indigo-500">
                        Question
                      </p>
                      <h1 className="max-h-[260px] overflow-y-auto break-words text-xl font-bold leading-snug text-slate-950 sm:text-2xl md:text-3xl">
                        {currentQuestion.question}
                      </h1>
                    </div>
                    <div className="flex flex-1 items-center justify-center">
                      <div className="rounded-full border border-slate-200 px-4 py-2 text-center text-sm font-medium text-slate-500">
                        Tap or press Space to reveal answer
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back */}
                <div className="backface-hidden rotate-y-180 absolute inset-0">
                  <div className="relative flex h-full cursor-default select-none flex-col overflow-hidden rounded-xl bg-card-surface p-5 text-slate-900 shadow-flashcard sm:p-6 md:p-8">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleSave(); }}
                    className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-black/5 hover:text-accent-gold"
                    aria-label={isSaved ? 'Remove from special questions' : 'Save to special questions'}
                  >
                    <Star className={cn('w-5 h-5', isSaved ? 'text-accent-gold fill-current' : 'text-slate-400')} />
                  </button>
                    <div className="pr-12">
                      <p className="mb-2 text-xs font-semibold uppercase text-indigo-500">
                        Question
                      </p>
                      <h1 className="line-clamp-3 break-words text-lg font-bold leading-snug text-slate-950 sm:text-xl md:text-2xl">
                        {currentQuestion.question}
                      </h1>
                    </div>
                    <div className="mt-4 flex min-h-0 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white/65 p-4 sm:mt-6 sm:p-5">
                      <p className="max-h-full overflow-y-auto break-words text-center text-lg font-medium leading-relaxed text-slate-800 sm:text-xl md:text-2xl">
                        {currentQuestion.answer}
                      </p>
                    </div>
                    <p className="mt-5 text-center text-xs font-medium uppercase text-slate-400">
                      Choose how well you knew it
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Rating Buttons */}
      <AnimatePresence>
        {showRatings && !isTransitioning && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.3 }}
            className="px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-2 md:px-4 md:pb-6"
          >
            <div className="mx-auto grid max-w-xl grid-cols-2 gap-2 md:grid-cols-4">
              {RATING_BUTTONS.map((btn, i) => (
                <motion.button
                  key={btn.key}
                  initial={{ opacity: 0, y: 30, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRate(btn.key)}
                  className="relative flex min-h-20 flex-col items-center justify-center gap-1 rounded-lg px-3 py-3 transition-all hover:shadow-lg focus-ring"
                  style={{
                    backgroundColor: btn.bg,
                    boxShadow: `0 0 20px ${btn.color}20`,
                  }}
                >
                  <span className="absolute top-2 right-2 text-[10px] font-mono opacity-40" style={{ color: btn.color }}>
                    {btn.shortcut}
                  </span>
                  <span className="text-sm font-semibold uppercase" style={{ color: btn.color }}>
                    {btn.label}
                  </span>
                  <span className="text-xs opacity-60" style={{ color: btn.color }}>
                    +{POINTS[btn.key]} pts
                  </span>
                </motion.button>
              ))}
            </div>
            <p className="text-center text-xs text-text-muted mt-3">Press 1-4 to rate</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quit Confirmation */}
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
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-text-primary mb-2">Quit Session?</h2>
              <p className="text-text-secondary text-sm mb-6">
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
