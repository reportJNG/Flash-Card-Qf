'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, FolderOpen } from 'lucide-react';
import { MiniDifficultyBar } from '@/components/shared/MiniDifficultyBar';
import { CategoryOverview } from '@/types/app';
import { CategoryIcon } from '@/lib/category-icons';
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
        'panel surface-hover relative min-w-0 cursor-pointer p-5 focus-within:border-border-active',
        category.is_special && 'border-accent-gold/35 bg-amber-500/5'
      )}
    >
      <div onClick={onClick}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-bg-quaternary" style={{ color: category.color }}>
              <CategoryIcon icon={category.icon} className="h-5 w-5" />
            </div>
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
            className="focus-ring shrink-0 rounded-lg p-1 text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
            aria-label={`Open actions for ${category.name}`}
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
          <div className="absolute right-4 top-12 z-20 min-w-[140px] rounded-lg border border-border-subtle bg-bg-quaternary py-1 shadow-elevated">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }}
              className="w-full px-4 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary focus-ring"
            >
              Edit
            </button>
            {!category.is_special && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-accent-red transition-colors hover:bg-red-500/10 focus-ring"
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
