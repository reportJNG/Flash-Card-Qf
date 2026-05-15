'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DIFFICULTY_COLORS } from '@/types/app';
import { cn } from '@/lib/utils';

interface MiniDifficultyBarProps {
  noneCount: number;
  easyCount: number;
  goodCount: number;
  hardCount: number;
  superHardCount: number;
  className?: string;
}

export function MiniDifficultyBar({
  noneCount,
  easyCount,
  goodCount,
  hardCount,
  superHardCount,
  className,
}: MiniDifficultyBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const total = noneCount + easyCount + goodCount + hardCount + superHardCount;

  if (total === 0) {
    return <div className={cn('h-1.5 bg-slate-700/50 rounded-full', className)} />;
  }

  const segments = [
    { count: noneCount, color: DIFFICULTY_COLORS.none, label: 'None' },
    { count: easyCount, color: DIFFICULTY_COLORS.easy, label: 'Easy' },
    { count: goodCount, color: DIFFICULTY_COLORS.good, label: 'Good' },
    { count: hardCount, color: DIFFICULTY_COLORS.hard, label: 'Hard' },
    { count: superHardCount, color: DIFFICULTY_COLORS.super_hard, label: 'Super Hard' },
  ];

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="h-1.5 bg-slate-700/50 rounded-full flex overflow-hidden">
        {segments.map((seg, i) =>
          seg.count > 0 ? (
            <motion.div
              key={i}
              className="h-full"
              style={{ backgroundColor: seg.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(seg.count / total) * 100}%` }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            />
          ) : null
        )}
      </div>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 bg-bg-quaternary rounded-lg p-3 shadow-elevated z-50 min-w-[180px]"
          >
            {segments.map((seg, i) => (
              <div key={i} className="flex items-center justify-between gap-4 text-sm py-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-text-secondary">{seg.label}</span>
                </div>
                <span className="text-text-primary font-medium">{seg.count}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
