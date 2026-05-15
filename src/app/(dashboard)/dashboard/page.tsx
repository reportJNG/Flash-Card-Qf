'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FolderOpen, Play, Map, BarChart2, Trophy,
  Layers, Brain, BookOpen, ArrowRight,
} from 'lucide-react';
import { getCategories } from '@/lib/actions/categories';
import { getRecentSessions } from '@/lib/actions/sessions';
import { Avatar } from '@/components/shared/Avatar';
import { ProfileStats, SessionHistory } from '@/types/app';
import { cn } from '@/lib/utils';
import { LoadingState, Panel, StatCard } from '@/components/shared/AppShell';
import { Button } from '@/components/ui/button';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const navCards = [
  { label: 'My Categories', icon: FolderOpen, href: '/categories', color: 'text-accent-indigo', bg: 'hover:bg-accent-indigo/10' },
  { label: 'Play Now', icon: Play, href: '/play', color: 'text-accent-green', bg: 'hover:bg-emerald-500/10', highlight: true },
  { label: 'Stats', icon: BarChart2, href: '/stats', color: 'text-accent-teal', bg: 'hover:bg-teal-500/10' },
  { label: 'Leaderboard', icon: Trophy, href: '/leaderboard', color: 'text-accent-gold', bg: 'hover:bg-amber-500/10' },
  { label: 'Planning', icon: Map, href: '/planning', color: 'text-accent-purple', bg: 'hover:bg-purple-500/10' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionHistory[]>([]);
  const [profile, setProfile] = useState<{ display_name: string; avatar_color: string; profile_id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch('/api/auth/session');
        if (!sessionRes.ok) { router.push('/'); return; }
        const session = await sessionRes.json();
        setProfile(session);

        const [catsRes, sessionsRes] = await Promise.all([
          getCategories(session.profile_id),
          getRecentSessions(session.profile_id, 5),
        ]);

        const loadedSessions = sessionsRes.success ? sessionsRes.data || [] : [];
        setRecentSessions(loadedSessions);

        // Calculate stats from categories
        const totalQuestions = catsRes.data?.reduce((sum, c) => sum + c.question_count, 0) || 0;
        const totalPlayed = (catsRes.data?.reduce((sum, c) => sum + c.easy_count + c.good_count + c.hard_count + c.super_hard_count, 0) || 0);
        const easyGoodCount = (catsRes.data?.reduce((sum, c) => sum + c.easy_count + c.good_count, 0) || 0);
        const smartRate = totalPlayed > 0 ? Math.round((easyGoodCount / totalPlayed) * 100) : 0;

        setStats({
          profile_id: session.profile_id,
          username: session.username,
          display_name: session.display_name,
          avatar_color: session.avatar_color,
          total_points: 0,
          total_questions: totalQuestions,
          none_count: catsRes.data?.reduce((sum, c) => sum + c.none_count, 0) || 0,
          easy_count: catsRes.data?.reduce((sum, c) => sum + c.easy_count, 0) || 0,
          good_count: catsRes.data?.reduce((sum, c) => sum + c.good_count, 0) || 0,
          hard_count: catsRes.data?.reduce((sum, c) => sum + c.hard_count, 0) || 0,
          super_hard_count: catsRes.data?.reduce((sum, c) => sum + c.super_hard_count, 0) || 0,
          total_categories: catsRes.data?.length || 0,
          total_sessions: loadedSessions.length,
          total_answers: 0,
          smart_rate: smartRate,
        });
      } catch {
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return <LoadingState label="Loading dashboard" />;
  }

  if (!profile) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <Panel className="relative overflow-hidden p-5 sm:p-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-indigo/60 to-transparent" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
          <Avatar name={profile.display_name} color={profile.avatar_color} size="lg" />
              <div className="min-w-0">
                <h1 className="break-words text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
              Welcome back, {profile.display_name}!
            </h1>
                <p className="mt-1 text-sm text-text-secondary">Ready to master some flashcards?</p>
              </div>
            </div>
            <Button onClick={() => router.push('/play')} className="h-10 bg-accent-green text-white hover:bg-accent-green/90">
              <Play className="h-4 w-4 fill-current" />
              Start studying
            </Button>
          </div>
        </Panel>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
        {[
          { icon: Layers, label: 'Questions', value: stats?.total_questions || 0, color: 'text-accent-indigo' },
          { icon: Brain, label: 'Smart Rate', value: `${stats?.smart_rate || 0}%`, color: 'text-accent-teal' },
          { icon: Trophy, label: 'Points', value: stats?.total_points || 0, color: 'text-accent-gold' },
          { icon: FolderOpen, label: 'Categories', value: stats?.total_categories || 0, color: 'text-accent-purple' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }}>
            <StatCard icon={stat.icon} label={stat.label} value={stat.value} tone={stat.color} />
          </motion.div>
        ))}
      </motion.div>

      {/* Navigation Grid */}
      <motion.div variants={itemVariants}>
        <h2 className="mb-3 text-lg font-semibold text-text-primary">Quick Access</h2>
        <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {navCards.map((card) => (
            <motion.button
              key={card.label}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(card.href)}
              className={cn(
                'panel surface-hover flex min-h-28 flex-col items-center justify-center gap-3 p-4 text-center focus-ring sm:min-h-32 sm:p-5',
                card.highlight && 'ring-2 ring-emerald-400/30 bg-emerald-500/5'
              )}
            >
              <card.icon className={cn('h-8 w-8', card.color, card.highlight && 'fill-current')} />
              <span className="text-sm font-medium text-text-primary">{card.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Recent Sessions */}
      <motion.div variants={itemVariants}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text-primary">Recent Sessions</h2>
          <Button variant="ghost" size="sm" onClick={() => router.push('/stats')} className="text-text-muted hover:text-text-primary">
            View all
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        {recentSessions.length === 0 ? (
          <Panel className="p-8 text-center">
            <BookOpen className="mx-auto mb-2 h-10 w-10 text-text-muted" />
            <p className="text-text-secondary text-sm">No sessions yet. Start playing!</p>
          </Panel>
        ) : (
          <div className="divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle bg-bg-tertiary">
            {recentSessions.map((session) => (
              <div key={session.session_id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div>
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      session.mode === 'hard' ? 'bg-orange-500/15 text-accent-orange' : 'bg-indigo-500/15 text-accent-indigo'
                    )}>
                      {session.mode === 'hard' ? 'Hard' : 'Normal'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary truncate">
                      {session.category_names_snapshot.slice(0, 3).join(', ')}
                      {session.category_names_snapshot.length > 3 && '...'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(session.started_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
                  <span className={cn(
                    'font-mono text-sm font-medium tabular-nums',
                    session.points_earned > 0 ? 'text-accent-green' : 'text-text-secondary'
                  )}>
                    +{session.points_earned}
                  </span>
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                    session.status === 'completed' ? 'bg-green-500/15 text-accent-green' : 'bg-amber-500/15 text-accent-gold'
                  )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', session.status === 'completed' ? 'bg-accent-green' : 'bg-accent-gold')} />
                    {session.status === 'completed' ? 'Completed' : 'Quit'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
