'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/shared/Avatar';
import { LeaderboardEntry } from '@/types/app';
import { cn } from '@/lib/utils';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myProfileId, setMyProfileId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sessionRes = await fetch('/api/auth/session');
      if (sessionRes.ok) {
        const session = await sessionRes.json();
        setMyProfileId(session.profile_id);
      }

      const supabase = createClient();
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .limit(50);

      if (data) {
        // Assign ranks
        const ranked = data.map((entry: LeaderboardEntry, i: number) => ({
          ...entry,
          rank: i + 1,
        }));
        setEntries(ranked);
      }
      setLoading(false);
    }
    load();
  }, []);

  const top3 = entries.slice(0, 3);

  const podiumColors = [
    { bg: 'bg-amber-500/20', border: 'border-amber-500/50', height: 'h-32', medal: '🥇' },
    { bg: 'bg-slate-400/20', border: 'border-slate-400/50', height: 'h-24', medal: '🥈' },
    { bg: 'bg-orange-700/20', border: 'border-orange-700/50', height: 'h-20', medal: '🥉' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent-indigo border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Leaderboard</h1>
        <div className="bg-bg-tertiary rounded-xl p-12 text-center">
          <p className="text-text-muted">No players yet. Be the first!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text-primary">Leaderboard</h1>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4 h-48">
        {/* 2nd */}
        {top3[1] && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            style={{ transformOrigin: 'bottom' }}
            className="flex flex-col items-center gap-2"
          >
            <Avatar name={top3[1].display_name} color={top3[1].avatar_color} size="md" />
            <span className="text-xs text-text-secondary truncate max-w-[80px]">{top3[1].display_name}</span>
            <span className="text-accent-gold text-sm font-medium">{top3[1].total_points}</span>
            <div className={`w-20 ${podiumColors[1].height} ${podiumColors[1].bg} rounded-t-lg flex items-center justify-center text-2xl border-t-2 ${podiumColors[1].border}`}>
              {podiumColors[1].medal}
            </div>
          </motion.div>
        )}

        {/* 1st */}
        {top3[0] && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0, type: 'spring', stiffness: 200 }}
            style={{ transformOrigin: 'bottom' }}
            className="flex flex-col items-center gap-2"
          >
            <Avatar name={top3[0].display_name} color={top3[0].avatar_color} size="lg" />
            <span className="text-sm text-text-primary font-medium truncate max-w-[80px]">{top3[0].display_name}</span>
            <span className="text-accent-gold font-semibold">{top3[0].total_points}</span>
            <div className={`w-24 ${podiumColors[0].height} ${podiumColors[0].bg} rounded-t-lg flex items-center justify-center text-3xl border-t-2 ${podiumColors[0].border}`}>
              {podiumColors[0].medal}
            </div>
          </motion.div>
        )}

        {/* 3rd */}
        {top3[2] && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{ transformOrigin: 'bottom' }}
            className="flex flex-col items-center gap-2"
          >
            <Avatar name={top3[2].display_name} color={top3[2].avatar_color} size="md" />
            <span className="text-xs text-text-secondary truncate max-w-[80px]">{top3[2].display_name}</span>
            <span className="text-accent-gold text-sm font-medium">{top3[2].total_points}</span>
            <div className={`w-20 ${podiumColors[2].height} ${podiumColors[2].bg} rounded-t-lg flex items-center justify-center text-2xl border-t-2 ${podiumColors[2].border}`}>
              {podiumColors[2].medal}
            </div>
          </motion.div>
        )}
      </div>

      {/* Full Table */}
      <div className="bg-bg-tertiary rounded-xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-bg-quaternary text-left">
              <th className="px-4 py-3 text-xs text-text-muted font-medium uppercase">Rank</th>
              <th className="px-4 py-3 text-xs text-text-muted font-medium uppercase">Profile</th>
              <th className="px-4 py-3 text-xs text-text-muted font-medium uppercase text-right">Points</th>
              <th className="px-4 py-3 text-xs text-text-muted font-medium uppercase text-right">Questions</th>
              <th className="px-4 py-3 text-xs text-text-muted font-medium uppercase text-right">Accuracy</th>
              <th className="px-4 py-3 text-xs text-text-muted font-medium uppercase text-right">Smart Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {entries.map((entry, i) => (
              <motion.tr
                key={entry.profile_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.03 }}
                className={cn(
                  'hover:bg-white/5',
                  entry.profile_id === myProfileId && 'bg-accent-indigo/10 border-l-4 border-accent-indigo'
                )}
              >
                <td className="px-4 py-3 text-sm font-medium text-text-primary">
                  {entry.rank <= 3 ? ['', '🥇', '🥈', '🥉'][entry.rank] : `#${entry.rank}`}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={entry.display_name} color={entry.avatar_color} size="sm" />
                    <span className="text-sm text-text-primary">{entry.display_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-accent-gold text-right font-medium">{entry.total_points}</td>
                <td className="px-4 py-3 text-sm text-text-secondary text-right">{entry.total_questions}</td>
                <td className="px-4 py-3 text-sm text-text-secondary text-right">{Math.round((entry.accuracy_rate || 0) * 100)}%</td>
                <td className="px-4 py-3 text-sm text-text-secondary text-right">{Math.round(entry.smart_rate || 0)}%</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
