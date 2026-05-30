'use client';

import { DifficultyRating, DIFFICULTY_COLORS } from '@/types/app';
import { cn } from '@/lib/utils';

interface DifficultyBadgeProps {
  difficulty: DifficultyRating;
  className?: string;
  showLabel?: boolean;
}

const bgMap: Record<DifficultyRating, string> = {
  none: 'bg-bg-quaternary',
  easy: 'bg-green-500/15',
  good: 'bg-teal-500/15',
  hard: 'bg-orange-500/15',
  super_hard: 'bg-red-500/15',
};

export function DifficultyBadge({ difficulty, className, showLabel = true }: DifficultyBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        bgMap[difficulty],
        className
      )}
      style={{ color: DIFFICULTY_COLORS[difficulty] }}
    >
      {showLabel ? difficulty.replace('_', ' ') : ''}
    </span>
  );
}
