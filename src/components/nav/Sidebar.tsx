'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
        'hidden md:flex flex-col h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 border-r border-slate-700/50 fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out shadow-2xl shadow-black/20',
        collapsed ? 'w-[72px]' : 'w-[256px]'
      )}
    >
      {/* Logo Section */}
      <div className={cn(
        'flex h-16 items-center border-b border-slate-700/50 px-4',
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
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-400/20 blur-xl group-hover:bg-emerald-400/30 transition-all" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  FlashQF
                </span>
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
              <Play className="w-7 h-7 text-emerald-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Items */}
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
              {/* Active indicator bar - positioned absolutely relative to the link */}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className={cn(
                    'absolute left-0 top-2 bottom-2 w-1 rounded-full z-10',
                    item.highlight 
                      ? 'bg-gradient-to-b from-emerald-400 to-emerald-600' 
                      : 'bg-gradient-to-b from-indigo-400 to-indigo-600'
                  )}
                  initial={{ opacity: 0, scaleY: 0.5 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0.5 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30 
                  }}
                  style={{ 
                    left: '-12px', // Adjust this value based on your padding
                  }}
                />
              )}
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'relative flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
                  isActive
                    ? item.highlight
                      ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                      : 'bg-gradient-to-r from-indigo-500/20 to-indigo-500/10 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:border-slate-700/50 border border-transparent',
                  collapsed && 'justify-center px-2'
                )}
              >
                {/* Icon with active glow effect */}
                <div className="relative shrink-0">
                  <item.icon className={cn(
                    'h-5 w-5 transition-all',
                    isActive ? 'drop-shadow-lg' : '',
                    item.highlight && isActive && 'text-emerald-300',
                    !item.highlight && isActive && 'text-indigo-300'
                  )} />
                  {isActive && (
                    <div className={cn(
                      'absolute inset-0 blur-md opacity-50',
                      item.highlight ? 'bg-emerald-400' : 'bg-indigo-400'
                    )} />
                  )}
                </div>
                
                {/* Label with animation */}
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

      {/* Bottom Section: Profile + Collapse Button */}
      <div className="space-y-2 border-t border-slate-700/50 p-3 bg-slate-900/50 backdrop-blur-sm">
        {/* Profile Menu */}
        {profile && (
          <ProfileMenu profile={profile} collapsed={collapsed} />
        )}
        
        {/* Collapse/Expand Button */}
        <button
          onClick={toggleCollapsed}
          className={cn(
            'w-full flex items-center justify-center rounded-xl p-2.5 text-slate-400 transition-all duration-200',
            'hover:bg-slate-800/80 hover:text-slate-200 hover:border-slate-600/50 border border-transparent',
            'active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-slate-900',
            'group'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 group-hover:text-emerald-400 transition-colors" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 mr-2 group-hover:text-emerald-400 transition-colors" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}