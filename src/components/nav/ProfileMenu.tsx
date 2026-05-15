'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, Users } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ProfileMenuProps {
  profile: { display_name: string; avatar_color: string };
  collapsed?: boolean;
}

export function ProfileMenu({ profile, collapsed = false }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out');
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Logout failed');
    }
  };

  const handleSwitch = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Switch failed');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors',
          collapsed && 'justify-center'
        )}
      >
        <Avatar name={profile.display_name} color={profile.avatar_color} size="sm" />
        {!collapsed && (
          <>
            <span className="text-sm text-text-primary truncate flex-1 text-left">{profile.display_name}</span>
            <Settings className="w-4 h-4 text-text-muted" />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-bg-quaternary rounded-lg shadow-elevated border border-border-subtle py-1 z-50">
            <button
              onClick={() => { router.push('/settings'); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={() => { handleSwitch(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              <Users className="w-4 h-4" />
              Switch Profile
            </button>
            <div className="border-t border-border-subtle my-1" />
            <button
              onClick={() => { handleLogout(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-accent-red hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
