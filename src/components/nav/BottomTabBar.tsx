'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Home, FolderOpen, Play, Map, BarChart2, Trophy,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: Home, href: '/dashboard' },
  { label: 'Categories', icon: FolderOpen, href: '/categories' },
  { label: 'Play', icon: Play, href: '/play', highlight: true },
  { label: 'Planning', icon: Map, href: '/planning' },
  { label: 'Stats', icon: BarChart2, href: '/stats' },
  { label: 'Leaderboard', icon: Trophy, href: '/leaderboard' },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border-subtle bg-bg-secondary/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden">
      <div className="mx-auto flex min-h-16 max-w-lg items-center justify-around gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 transition-colors focus-ring',
              isActive && (item.highlight ? 'bg-emerald-500/10' : 'bg-accent-indigo/10')
            )}
          >
            <item.icon
              className={cn(
                'h-5 w-5 transition-colors',
                isActive
                  ? item.highlight
                    ? 'text-emerald-400'
                    : 'text-accent-indigo'
                  : 'text-text-muted'
              )}
            />
            <span
              className={cn(
                'max-w-full truncate text-[10px] transition-colors',
                isActive
                  ? item.highlight
                    ? 'text-emerald-400'
                    : 'text-accent-indigo'
                  : 'text-text-muted'
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
