'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, FolderOpen } from 'lucide-react';
import { MiniDifficultyBar } from '@/components/shared/MiniDifficultyBar';
import { CategoryOverview } from '@/types/app';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: CategoryOverview;
  index: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CategoryCard({ category, index, onClick, onEdit, onDelete }: CategoryCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className={cn(
        'bg-bg-tertiary rounded-xl p-5 shadow-card hover:shadow-elevated transition-all cursor-pointer relative',
        category.is_special && 'ring-2 ring-accent-gold/50'
      )}
    >
      <div onClick={onClick}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">{category.icon}</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-text-primary truncate">{category.name}</h3>
              {category.type && (
                <span className="text-xs text-text-muted bg-bg-quaternary px-2 py-0.5 rounded-full">
                  {category.type}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors shrink-0"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Question count */}
        <div className="flex items-center gap-1.5 text-sm text-text-muted mb-3">
          <FolderOpen className="w-4 h-4" />
          <span>{category.question_count} questions</span>
        </div>

        {/* Difficulty bar */}
        <MiniDifficultyBar
          noneCount={category.none_count}
          easyCount={category.easy_count}
          goodCount={category.good_count}
          hardCount={category.hard_count}
          superHardCount={category.super_hard_count}
        />
      </div>

      {/* Action menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute top-12 right-4 bg-bg-quaternary rounded-lg shadow-elevated border border-border-subtle py-1 z-20 min-w-[140px]">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }}
              className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              Edit
            </button>
            {!category.is_special && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                className="w-full text-left px-4 py-2 text-sm text-accent-red hover:bg-red-500/10 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
