'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Layers, BookOpen, CheckCircle, Trophy, Brain } from 'lucide-react';
import { getCategories } from '@/lib/actions/categories';
import { getSessionHistory } from '@/lib/actions/sessions';
import { CategoryOverview, SessionHistory, DIFFICULTY_COLORS } from '@/types/app';
import { MiniDifficultyBar } from '@/components/shared/MiniDifficultyBar';
import { cn } from '@/lib/utils';
import { LoadingState, MobileCardList, PageHeader } from '@/components/shared/AppShell';
import { CategoryIcon } from '@/lib/category-icons';

function AnimatedStat({ value, suffix = '' }: { value: number; suffix?: string }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: 1500, bounce: 0 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => { motionValue.set(value); }, [value, motionValue]);
  useEffect(() => { const unsub = display.on('change', (v) => setDisplayValue(v)); return unsub; }, [display]);

  return <span>{displayValue}{suffix}</span>;
}

function SmartRateGauge({ percentage }: { percentage: number }) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.5;
  const fillLength = arcLength * (percentage / 100);

  const motionValue = useMotionValue(arcLength);
  const spring = useSpring(motionValue, { duration: 1500, bounce: 0 });
  const [offset, setOffset] = useState(arcLength);

  useEffect(() => { motionValue.set(arcLength - fillLength); }, [arcLength, fillLength, motionValue]);
  useEffect(() => { const unsub = spring.on('change', (v) => setOffset(v)); return unsub; }, [spring]);

  const label = percentage >= 81 ? 'Master' : percentage >= 61 ? 'Proficient' : percentage >= 41 ? 'Learning' : 'Beginner';
  const color = percentage >= 81 ? '#22c55e' : percentage >= 61 ? '#14b8a6' : percentage >= 41 ? '#f97316' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          transform="rotate(180 100 100)"
        />
      </svg>
      <div className="text-center -mt-8">
        <p className="text-3xl font-bold text-text-primary">{percentage}%</p>
        <p className="text-sm font-medium" style={{ color }}>{label}</p>
      </div>
    </div>
  );
}

function DifficultyDonut({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return <div className="text-center text-text-muted">No data</div>;

  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  const entries = [
    { key: 'none', count: counts.none || 0, color: DIFFICULTY_COLORS.none },
    { key: 'easy', count: counts.easy || 0, color: DIFFICULTY_COLORS.easy },
    { key: 'good', count: counts.good || 0, color: DIFFICULTY_COLORS.good },
    { key: 'hard', count: counts.hard || 0, color: DIFFICULTY_COLORS.hard },
    { key: 'super_hard', count: counts.super_hard || 0, color: DIFFICULTY_COLORS.super_hard },
  ].filter(e => e.count > 0);

  let cumulative = 0;
  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {entries.map((entry, i) => {
          const pct = entry.count / total;
          const dashLength = circumference * pct;
          const offset = circumference - cumulative;
          cumulative += dashLength;

          return (
            <motion.circle
              key={entry.key}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={entry.color}
              strokeWidth="20"
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-offset + circumference}
              transform={`rotate(-90 ${cx} ${cy})`}
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${dashLength} ${circumference - dashLength}` }}
              transition={{ delay: i * 0.15, duration: 0.8, ease: 'easeOut' }}
            />
          );
        })}
        <text x={cx} y={cy - 5} textAnchor="middle" fill="#f8fafc" className="text-xl font-bold">{total}</text>
        <text x={cx} y={cy + 15} textAnchor="middle" fill="#778397" className="text-xs">total</text>
      </svg>
      <div className="space-y-1.5 w-full">
        {entries.map(entry => (
          <div key={entry.key} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-text-secondary capitalize">{entry.key.replace('_', ' ')}</span>
            </div>
            <span className="text-text-primary font-medium">{entry.count} ({Math.round((entry.count / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [categories, setCategories] = useState<CategoryOverview[]>([]);
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sessionRes = await fetch('/api/auth/session');
      if (!sessionRes.ok) return;
      const session = await sessionRes.json();

      const [catsRes, sessRes] = await Promise.all([
        getCategories(session.profile_id),
        getSessionHistory(session.profile_id),
      ]);

      if (catsRes.success) setCategories(catsRes.data || []);
      if (sessRes.success) setSessions(sessRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <LoadingState label="Loading stats" />;
  }

  const totalQuestions = categories.reduce((s, c) => s + c.question_count, 0);
  const totalSessions = sessions.length;
  const totalAnswers = sessions.reduce((s, sess) => s + sess.total_answered, 0);
  const totalPoints = sessions.reduce((s, sess) => s + sess.points_earned, 0);
  const totalPlayed = categories.reduce((s, c) => s + c.easy_count + c.good_count + c.hard_count + c.super_hard_count, 0);
  const easyGood = categories.reduce((s, c) => s + c.easy_count + c.good_count, 0);
  const smartRate = totalPlayed > 0 ? Math.round((easyGood / totalPlayed) * 100) : 0;

  const difficultyCounts = {
    none: categories.reduce((s, c) => s + c.none_count, 0),
    easy: categories.reduce((s, c) => s + c.easy_count, 0),
    good: categories.reduce((s, c) => s + c.good_count, 0),
    hard: categories.reduce((s, c) => s + c.hard_count, 0),
    super_hard: categories.reduce((s, c) => s + c.super_hard_count, 0),
  };

  return (
    <div className="space-y-8">
      <PageHeader title="My Stats" description="Track volume, recall strength, and session history." icon={Brain} />

      {/* Overview Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 gap-3 xs:grid-cols-2 md:grid-cols-5"
      >
        {[
          { icon: Layers, label: 'Questions', value: totalQuestions, color: 'text-accent-indigo' },
          { icon: BookOpen, label: 'Sessions', value: totalSessions, color: 'text-accent-purple' },
          { icon: CheckCircle, label: 'Answers', value: totalAnswers, color: 'text-accent-teal' },
          { icon: Trophy, label: 'Points', value: totalPoints, color: 'text-accent-gold' },
          { icon: Brain, label: 'Smart Rate', value: smartRate, suffix: '%', color: 'text-accent-green' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          className="panel min-w-0 p-4"
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-2xl font-bold text-text-primary">
              <AnimatedStat value={stat.value} suffix={stat.suffix || ''} />
            </p>
            <p className="text-xs text-text-muted">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart Rate Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="panel flex flex-col items-center p-5 sm:p-6"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-4">Smart Rate</h2>
          <SmartRateGauge percentage={smartRate} />
        </motion.div>

        {/* Difficulty Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="panel p-5 sm:p-6"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-4">Difficulty Breakdown</h2>
          <DifficultyDonut counts={difficultyCounts} />
        </motion.div>
      </div>

      {/* Per-Category Mastery */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="panel p-5 sm:p-6"
      >
        <h2 className="text-lg font-semibold text-text-primary mb-4">Per-Category Mastery</h2>
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-bg-quaternary" style={{ color: cat.color }}>
                <CategoryIcon icon={cat.icon} className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-primary truncate">{cat.name}</span>
                  <span className={cn(
                    'text-sm font-medium shrink-0 ml-2',
                    cat.mastery_pct >= 81 ? 'text-accent-green' : cat.mastery_pct >= 61 ? 'text-accent-teal' : cat.mastery_pct >= 41 ? 'text-accent-orange' : 'text-accent-red'
                  )}>
                    {cat.mastery_pct}%
                  </span>
                </div>
                <MiniDifficultyBar
                  noneCount={cat.none_count}
                  easyCount={cat.easy_count}
                  goodCount={cat.good_count}
                  hardCount={cat.hard_count}
                  superHardCount={cat.super_hard_count}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Session History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="panel overflow-hidden"
      >
        <h2 className="text-lg font-semibold text-text-primary p-6 pb-4">Session History</h2>
        {sessions.length === 0 ? (
          <p className="text-center text-text-muted py-8">No sessions yet</p>
        ) : (
          <>
          <MobileCardList className="px-3 pb-3">
            {sessions.slice(0, 20).map((sess) => (
              <div key={sess.session_id} className="rounded-lg border border-border-subtle bg-bg-secondary p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-text-primary">
                    {new Date(sess.started_at).toLocaleDateString()}
                  </span>
                  <span className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                    sess.mode === 'hard' ? 'bg-orange-500/15 text-accent-orange' : 'bg-indigo-500/15 text-accent-indigo'
                  )}>
                    {sess.mode}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-text-muted">Answered</p>
                    <p className="font-mono text-text-primary">{sess.total_answered}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-text-muted">Points</p>
                    <p className="font-mono text-accent-gold">{sess.points_earned}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-text-muted">Status</p>
                    <p className={cn('truncate text-xs capitalize', sess.status === 'completed' ? 'text-accent-green' : 'text-accent-gold')}>
                      {sess.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </MobileCardList>
          <div className="hidden overflow-x-auto app-scrollbar md:block">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-bg-quaternary text-left">
                  <th className="px-4 py-3 text-xs text-text-muted font-medium uppercase">Date</th>
                  <th className="px-4 py-3 text-xs text-text-muted font-medium uppercase">Mode</th>
                  <th className="px-4 py-3 text-xs text-text-muted font-medium uppercase">Answered</th>
                  <th className="px-4 py-3 text-xs text-text-muted font-medium uppercase">Points</th>
                  <th className="px-4 py-3 text-xs text-text-muted font-medium uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {sessions.slice(0, 20).map((sess, i) => (
                  <motion.tr
                    key={sess.session_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + i * 0.03 }}
                    className="hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {new Date(sess.started_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                        sess.mode === 'hard' ? 'bg-orange-500/15 text-accent-orange' : 'bg-indigo-500/15 text-accent-indigo'
                      )}>
                        {sess.mode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">{sess.total_answered}</td>
                    <td className="px-4 py-3 text-sm text-accent-gold">{sess.points_earned}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-xs',
                        sess.status === 'completed' ? 'text-accent-green' : 'text-accent-gold'
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', sess.status === 'completed' ? 'bg-accent-green' : 'bg-accent-gold')} />
                        {sess.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
