'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, FolderOpen, Play, Map, BarChart2, Trophy,
  ChevronLeft, ChevronRight, Layers,
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

  useEffect(() => {
    document.documentElement.style.setProperty('--flashqf-sidebar-width', collapsed ? '72px' : '256px');
  }, [collapsed]);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      document.documentElement.style.setProperty('--flashqf-sidebar-width', next ? '72px' : '256px');
      return next;
    });
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-border-subtle bg-bg-primary/96 shadow-card backdrop-blur transition-all duration-300 ease-in-out md:flex',
        collapsed ? 'w-[72px]' : 'w-[256px]'
      )}
    >
      <div className={cn(
        'flex h-16 items-center border-b border-border-subtle px-4',
        collapsed && 'justify-center px-2'
      )}>
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="expanded-logo"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Link href="/dashboard" className="group flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-bg-tertiary text-accent-indigo transition-colors group-hover:border-border-active">
                  <Layers className="h-5 w-5" />
                </span>
                <span className="text-xl font-semibold tracking-tight text-text-primary">FlashQF</span>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Layers className="h-7 w-7 text-accent-indigo" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              title={collapsed ? item.label : undefined}
              className="block relative"
            >
              {isActive && !collapsed && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className={cn('absolute bottom-2 top-2 z-10 w-1 rounded-full', item.highlight ? 'bg-accent-green' : 'bg-accent-indigo')}
                  initial={{ opacity: 0, scaleY: 0.5 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0.5 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30 
                  }}
                  style={{ left: '-12px' }}
                />
              )}
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'relative flex min-h-[44px] items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors duration-200',
                  isActive
                    ? item.highlight
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-accent-green'
                      : 'border-border-active bg-accent-indigo/10 text-accent-indigo'
                    : 'border-transparent text-text-muted hover:border-border-subtle hover:bg-bg-tertiary hover:text-text-primary',
                  collapsed && 'justify-center px-2'
                )}
              >
                <div className="relative shrink-0">
                  <item.icon className={cn(
                    'h-5 w-5 transition-colors',
                    item.highlight && isActive && 'text-emerald-300',
                    !item.highlight && isActive && 'text-indigo-300'
                  )} />
                </div>
                
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      className="text-sm font-medium truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-border-subtle bg-bg-secondary/70 p-3 backdrop-blur-sm">
        {profile && (
          <ProfileMenu profile={profile} collapsed={collapsed} />
        )}
        
        <button
          onClick={toggleCollapsed}
          className={cn(
            'flex w-full items-center justify-center rounded-lg border border-transparent p-2.5 text-text-muted transition-colors duration-200',
            'hover:border-border-subtle hover:bg-bg-tertiary hover:text-text-primary',
            'focus-ring',
            'group'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 transition-colors group-hover:text-accent-indigo" />
          ) : (
            <>
              <ChevronLeft className="mr-2 h-5 w-5 transition-colors group-hover:text-accent-indigo" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
