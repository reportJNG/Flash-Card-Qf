'use client';

import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils/formatters';

interface AvatarProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

export function Avatar({ name, color, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-1 ring-white/10',
        sizeMap[size],
        className
      )}
      style={{ backgroundColor: color }}
    >
      {getInitials(name)}
    </div>
  );
}
