'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Home, FolderOpen, Play, Map, BarChart2, Trophy,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfileMenu } from './ProfileMenu';

const navItems = [
  { label: 'Dashboard', icon: Home, href: '/dashboard' },
  { label: 'Categories', icon: FolderOpen, href: '/categories' },
  { label: 'Play', icon: Play, href: '/play', highlight: true },
  { label: 'Planning', icon: Map, href: '/planning' },
  { label: 'Stats', icon: BarChart2, href: '/stats' },
  { label: 'Leaderboard', icon: Trophy, href: '/leaderboard' },
];

interface SidebarProps {
  profile: { display_name: string; avatar_color: string } | null;
}

export function Sidebar({ profile }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen bg-bg-secondary border-r border-border-subtle fixed left-0 top-0 z-40 transition-all duration-200',
        collapsed ? 'w-[72px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-border-subtle', collapsed && 'justify-center px-2')}>
        {!collapsed && (
          <Link href="/dashboard" className="text-xl font-bold text-gradient">
          FlashQF
          </Link>
        )}
        {collapsed && <Play className="w-6 h-6 text-accent-indigo" />}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative',
                  isActive
                    ? item.highlight
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-accent-indigo/10 text-accent-indigo'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5',
                  collapsed && 'justify-center px-2'
                )}
              >
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="sidebar-active"
                    className={cn(
                      'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full',
                      item.highlight ? 'bg-emerald-400' : 'bg-accent-indigo'
                    )}
                  />
                )}
                <item.icon className={cn('w-5 h-5 shrink-0', item.highlight && 'fill-current')} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Profile + Collapse */}
      <div className="p-3 border-t border-border-subtle space-y-2">
        {profile && (
          <ProfileMenu profile={profile} collapsed={collapsed} />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
