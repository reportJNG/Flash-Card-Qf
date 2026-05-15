'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { Trophy, RefreshCw, Sliders, Home, ArrowLeft } from 'lucide-react';
import { getSessionById, getSessionAnswers } from '@/lib/actions/sessions';
import { PlaySession } from '@/types/app';
import { DIFFICULTY_COLORS } from '@/types/app';
import { cn } from '@/lib/utils';
import { LoadingState } from '@/components/shared/AppShell';

function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration, bounce: 0 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => setDisplayValue(v));
    return unsubscribe;
  }, [display]);

  return <span>{displayValue}</span>;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.session_id as string;

  const [session, setSession] = useState<PlaySession | null>(null);
  const [answers, setAnswers] = useState<Array<{ question: string; result: string; points_awarded: number }>>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [sessionRes, answersRes] = await Promise.all([
        getSessionById(sessionId),
        getSessionAnswers(sessionId),
      ]);

      if (sessionRes.success) setSession(sessionRes.data || null);
      if (answersRes.success) setAnswers(answersRes.data || []);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <LoadingState label="Loading results" />;
  }

  if (!session) return null;

  const counts: Record<string, number> = { easy: 0, good: 0, hard: 0, super_hard: 0 };
  answers.forEach(a => { counts[a.result] = (counts[a.result] || 0) + 1; });

  const totalAnswered = answers.length;
  const easyGood = counts.easy + counts.good;
  const smartRate = totalAnswered > 0 ? Math.round((easyGood / totalAnswered) * 100) : 0;

  const segments = [
    { key: 'easy', count: counts.easy, color: DIFFICULTY_COLORS.easy },
    { key: 'good', count: counts.good, color: DIFFICULTY_COLORS.good },
    { key: 'hard', count: counts.hard, color: DIFFICULTY_COLORS.hard },
    { key: 'super_hard', count: counts.super_hard, color: DIFFICULTY_COLORS.super_hard },
  ].filter(s => s.count > 0);

  return (
    <div className="min-h-screen bg-bg-primary px-4 py-8">
      <div className="mx-auto max-w-lg space-y-8">
        {/* Back */}
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>

        {/* Score Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            {session.status === 'completed' ? 'Session Complete!' : 'You Quit'}
          </h1>
          <div className="flex items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-accent-gold" />
            <motion.span
              className="text-6xl font-extrabold text-accent-gold"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <AnimatedNumber value={session.points_earned} />
            </motion.span>
          </div>
          <p className="text-text-secondary mt-2">points earned</p>
        </motion.div>

        {/* Breakdown Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="h-8 bg-bg-tertiary rounded-full overflow-hidden flex">
            {segments.map((seg, i) => (
              <motion.div
                key={seg.key}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5 + i * 0.2, duration: 0.5, ease: 'easeOut' }}
                style={{
                  backgroundColor: seg.color,
                  width: `${(seg.count / totalAnswered) * 100}%`,
                  transformOrigin: 'left',
                }}
                className="h-full flex items-center justify-center"
              >
                {seg.count > 0 && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + i * 0.2 }}
                    className="text-xs text-white font-medium"
                  >
                    {seg.count}
                  </motion.span>
                )}
              </motion.div>
            ))}
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {segments.map(seg => (
              <div key={seg.key} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="text-text-muted capitalize">{seg.key.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Smart Rate */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center"
        >
          <div className="flex items-center gap-3 rounded-full border border-border-subtle bg-bg-tertiary px-6 py-3 shadow-card">
            <span className="text-sm text-text-muted">Smart Rate</span>
            <span className={cn(
              'text-xl font-bold',
              smartRate >= 81 ? 'text-accent-green' : smartRate >= 61 ? 'text-accent-teal' : smartRate >= 41 ? 'text-accent-orange' : 'text-accent-red'
            )}>
              {smartRate}%
            </span>
          </div>
        </motion.div>

        {/* Question Review */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="space-y-2"
        >
          <h2 className="text-lg font-semibold text-text-primary">Question Review</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {answers.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.03 }}
                className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-tertiary p-3"
              >
                <p className="text-sm text-text-primary truncate flex-1 mr-3">{a.question}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                    style={{
                      backgroundColor: `${DIFFICULTY_COLORS[a.result as keyof typeof DIFFICULTY_COLORS]}20`,
                      color: DIFFICULTY_COLORS[a.result as keyof typeof DIFFICULTY_COLORS],
                    }}
                  >
                    {a.result.replace('_', ' ')}
                  </span>
                  <span className={cn('text-xs font-medium', a.points_awarded > 0 ? 'text-accent-green' : 'text-text-muted')}>
                    +{a.points_awarded}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => router.push('/play')}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-accent-indigo text-accent-indigo rounded-xl hover:bg-accent-indigo/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Play Again
          </button>
          <button
            onClick={() => router.push('/play')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-accent-indigo hover:bg-indigo-600 text-white rounded-xl transition-colors"
          >
            <Sliders className="w-4 h-4" />
            New Setup
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-bg-tertiary text-text-primary rounded-xl hover:bg-bg-quaternary transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </button>
        </motion.div>
      </div>
    </div>
  );
}
