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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-secondary/95 backdrop-blur-lg border-t border-border-subtle z-50 flex items-center justify-around px-2 safe-area-pb">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 py-1 px-2 min-w-[56px]">
            <item.icon
              className={cn(
                'w-5 h-5 transition-colors',
                isActive
                  ? item.highlight
                    ? 'text-emerald-400'
                    : 'text-accent-indigo'
                  : 'text-text-muted'
              )}
            />
            <span
              className={cn(
                'text-[10px] transition-colors',
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
    </nav>
  );
}
