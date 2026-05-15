'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Crown, Medal, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/shared/Avatar';
import { LeaderboardEntry } from '@/types/app';
import { cn } from '@/lib/utils';
import { LoadingState, MobileCardList, PageHeader } from '@/components/shared/AppShell';

const podium = [
  { height: 'h-32', bg: 'bg-amber-500/20', border: 'border-amber-500/50', icon: Crown, color: 'text-accent-gold' },
  { height: 'h-24', bg: 'bg-slate-400/20', border: 'border-slate-400/50', icon: Medal, color: 'text-slate-300' },
  { height: 'h-20', bg: 'bg-orange-700/20', border: 'border-orange-700/50', icon: Award, color: 'text-orange-300' },
];

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-5 w-5 text-accent-gold" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-300" />;
  if (rank === 3) return <Award className="h-5 w-5 text-orange-300" />;
  return <span className="font-mono text-sm text-text-secondary">#{rank}</span>;
}

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
      const { data } = await supabase.from('leaderboard').select('*').limit(50);

      if (data) {
        setEntries(data.map((entry: LeaderboardEntry, i: number) => ({ ...entry, rank: i + 1 })));
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingState label="Loading leaderboard" />;

  const top3 = entries.slice(0, 3);

  if (entries.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Leaderboard" description="No players have scored yet." icon={Trophy} />
        <div className="panel p-12 text-center text-text-muted">No players yet. Be the first.</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Leaderboard" description="Compare points, accuracy, and smart rate across profiles." icon={Trophy} />

      <div className="flex h-48 items-end justify-center gap-4">
        {[top3[1], top3[0], top3[2]].map((entry, displayIndex) => {
          if (!entry) return null;
          const podiumIndex = entry.rank - 1;
          const style = podium[podiumIndex];
          const Icon = style.icon;
          return (
            <motion.div
              key={entry.profile_id}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: displayIndex * 0.1, type: 'spring', stiffness: 200 }}
              style={{ transformOrigin: 'bottom' }}
              className="flex flex-col items-center gap-2"
            >
              <Avatar name={entry.display_name} color={entry.avatar_color} size={entry.rank === 1 ? 'lg' : 'md'} />
              <span className={cn('max-w-[88px] truncate text-center font-medium', entry.rank === 1 ? 'text-sm text-text-primary' : 'text-xs text-text-secondary')}>
                {entry.display_name}
              </span>
              <span className="font-mono text-sm font-semibold text-accent-gold">{entry.total_points}</span>
              <div className={cn('flex w-20 items-center justify-center rounded-t-lg border-t-2', entry.rank === 1 && 'w-24', style.height, style.bg, style.border)}>
                <Icon className={cn(entry.rank === 1 ? 'h-8 w-8' : 'h-7 w-7', style.color)} />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="panel overflow-hidden">
        <MobileCardList className="p-3">
          {entries.map((entry) => (
            <div key={entry.profile_id} className={cn('rounded-lg border border-border-subtle bg-bg-secondary p-3', entry.profile_id === myProfileId && 'border-border-active bg-accent-indigo/10')}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <RankIcon rank={entry.rank} />
                  <Avatar name={entry.display_name} color={entry.avatar_color} size="sm" />
                  <span className="truncate text-sm font-medium text-text-primary">{entry.display_name}</span>
                </div>
                <span className="font-mono text-sm font-semibold text-accent-gold">{entry.total_points}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-right text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-muted">Questions</p>
                  <p className="font-mono text-text-secondary">{entry.total_questions}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-muted">Accuracy</p>
                  <p className="font-mono text-text-secondary">{Math.round((entry.accuracy_rate || 0) * 100)}%</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-muted">Smart</p>
                  <p className="font-mono text-text-secondary">{Math.round(entry.smart_rate || 0)}%</p>
                </div>
              </div>
            </div>
          ))}
        </MobileCardList>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-quaternary/70 text-left">
                <th className="px-4 py-3 text-xs font-medium uppercase text-text-muted">Rank</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-text-muted">Profile</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-text-muted">Points</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-text-muted">Questions</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-text-muted">Accuracy</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-text-muted">Smart Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {entries.map((entry, i) => (
                <motion.tr
                  key={entry.profile_id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.025 }}
                  className={cn('hover:bg-white/5', entry.profile_id === myProfileId && 'bg-accent-indigo/10')}
                >
                  <td className="px-4 py-3">
                    <RankIcon rank={entry.rank} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={entry.display_name} color={entry.avatar_color} size="sm" />
                      <span className="text-sm text-text-primary">{entry.display_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-medium text-accent-gold">{entry.total_points}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-text-secondary">{entry.total_questions}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-text-secondary">{Math.round((entry.accuracy_rate || 0) * 100)}%</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-text-secondary">{Math.round(entry.smart_rate || 0)}%</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
