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
          'flex w-full items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-border-subtle hover:bg-bg-tertiary',
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
          <div className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-lg border border-border-subtle bg-bg-quaternary py-1 shadow-elevated">
            <button
              onClick={() => { router.push('/settings'); setIsOpen(false); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={() => { handleSwitch(); setIsOpen(false); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
            >
              <Users className="w-4 h-4" />
              Switch Profile
            </button>
            <div className="border-t border-border-subtle my-1" />
            <button
              onClick={() => { handleLogout(); setIsOpen(false); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-accent-red transition-colors hover:bg-red-500/10"
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
