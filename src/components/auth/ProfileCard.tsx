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
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex flex-col items-center gap-3 rounded-lg border border-transparent bg-bg-tertiary/45 p-4 transition-all duration-200 hover:border-border-subtle hover:bg-bg-tertiary hover:shadow-card"
    >
      <div className="relative">
        <Avatar name={profile.display_name} color={profile.avatar_color} size="xl" />
        <div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            boxShadow: `0 0 0 4px ${profile.avatar_color}40, 0 0 20px ${profile.avatar_color}30`,
          }}
        />
        {profile.pin && (
          <div className="absolute -bottom-1 -right-1 bg-bg-quaternary rounded-full p-1 border-2 border-bg-primary">
            <Lock className="w-3 h-3 text-text-muted" />
          </div>
        )}
      </div>
      <span className="text-sm font-medium text-text-primary">{profile.display_name}</span>
    </motion.button>
  );
}
