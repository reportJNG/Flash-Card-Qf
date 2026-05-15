'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FolderOpen, Play, Map, BarChart2, Trophy,
  Layers, Brain, BookOpen,
} from 'lucide-react';
import { getCategories } from '@/lib/actions/categories';
import { getRecentSessions } from '@/lib/actions/sessions';
import { Avatar } from '@/components/shared/Avatar';
import { ProfileStats, SessionHistory } from '@/types/app';
import { cn } from '@/lib/utils';

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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent-indigo border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-to-r from-indigo-900/50 to-purple-900/30 rounded-xl p-6 border border-border-subtle"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="relative flex items-center gap-4">
          <Avatar name={profile.display_name} color={profile.avatar_color} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Welcome back, {profile.display_name}!
            </h1>
            <p className="text-text-secondary text-sm mt-0.5">Ready to master some flashcards?</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Layers, label: 'Questions', value: stats?.total_questions || 0, color: 'text-accent-indigo' },
          { icon: Brain, label: 'Smart Rate', value: `${stats?.smart_rate || 0}%`, color: 'text-accent-teal' },
          { icon: Trophy, label: 'Points', value: stats?.total_points || 0, color: 'text-accent-gold' },
          { icon: FolderOpen, label: 'Categories', value: stats?.total_categories || 0, color: 'text-accent-purple' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -2 }}
            className="bg-bg-tertiary rounded-xl p-4 shadow-card hover:shadow-elevated transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-text-muted">{stat.label}</span>
            </div>
            <motion.p
              className="text-2xl font-bold text-text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              {stat.value}
            </motion.p>
          </motion.div>
        ))}
      </motion.div>

      {/* Navigation Grid */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold text-text-primary mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {navCards.map((card) => (
            <motion.button
              key={card.label}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(card.href)}
              className={cn(
                'bg-bg-tertiary rounded-xl p-6 flex flex-col items-center gap-3 shadow-card hover:shadow-elevated transition-all',
                card.highlight && 'ring-2 ring-emerald-400/30 bg-emerald-500/5'
              )}
            >
              <card.icon className={cn('w-8 h-8', card.color, card.highlight && 'fill-current')} />
              <span className="text-sm font-medium text-text-primary">{card.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Recent Sessions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold text-text-primary mb-3">Recent Sessions</h2>
        {recentSessions.length === 0 ? (
          <div className="bg-bg-tertiary rounded-xl p-8 text-center">
            <BookOpen className="w-10 h-10 text-text-muted mx-auto mb-2" />
            <p className="text-text-secondary text-sm">No sessions yet. Start playing!</p>
          </div>
        ) : (
          <div className="bg-bg-tertiary rounded-xl overflow-hidden divide-y divide-border-subtle">
            {recentSessions.map((session) => (
              <div key={session.session_id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
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
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn(
                    'text-sm font-medium',
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
