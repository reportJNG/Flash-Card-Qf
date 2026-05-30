'use client';

import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { Profile } from '@/types/app';

interface ProfileCardProps {
  profile: Profile;
  onClick: () => void;
  index: number;
}

export function ProfileCard({ profile, onClick, index }: ProfileCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex min-w-0 flex-col items-center gap-3 rounded-lg border border-border-subtle bg-bg-tertiary/70 p-4 transition-colors duration-200 hover:border-border-active hover:bg-bg-quaternary/70 focus-ring"
    >
      <div className="relative">
        <Avatar name={profile.display_name} color={profile.avatar_color} size="xl" />
        <div className="absolute inset-0 rounded-full opacity-0 ring-4 ring-white/10 transition-opacity duration-200 group-hover:opacity-100" />
        {profile.pin && (
          <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-bg-primary bg-bg-quaternary p-1">
            <Lock className="w-3 h-3 text-text-muted" />
          </div>
        )}
      </div>
      <span className="max-w-full truncate text-sm font-medium text-text-primary">{profile.display_name}</span>
    </motion.button>
  );
}
