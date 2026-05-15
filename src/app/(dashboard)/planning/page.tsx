'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getCategories } from '@/lib/actions/categories';
import { CategoryOverview } from '@/types/app';
import { MiniDifficultyBar } from '@/components/shared/MiniDifficultyBar';
import { Play, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { CategoryIcon } from '@/lib/category-icons';
import { LoadingState, PageHeader, SegmentedControl } from '@/components/shared/AppShell';

type SortOption = 'most' | 'unseen' | 'mastery';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function PlanningPage() {
  const [categories, setCategories] = useState<CategoryOverview[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('most');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadData = useCallback(async () => {
    const sessionRes = await fetch('/api/auth/session');
    if (!sessionRes.ok) return;
    const session = await sessionRes.json();

    const result = await getCategories(session.profile_id);
    if (result.success && result.data) {
      setCategories(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalQuestions = categories.reduce((sum, c) => sum + c.question_count, 0);
  const totalPlayed = categories.reduce((sum, c) => sum + c.easy_count + c.good_count + c.hard_count + c.super_hard_count, 0);
  const easyGood = categories.reduce((sum, c) => sum + c.easy_count + c.good_count, 0);
  const overallMastery = totalPlayed > 0 ? Math.round((easyGood / totalPlayed) * 100) : 0;

  const sorted = [...categories].sort((a, b) => {
    switch (sortBy) {
      case 'most': return b.question_count - a.question_count;
      case 'unseen': return b.none_count - a.none_count;
      case 'mastery': return a.mastery_pct - b.mastery_pct;
      default: return 0;
    }
  });

  if (loading) {
    return <LoadingState label="Loading planning" />;
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No categories yet"
        description="Create categories and add questions to start planning"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Planning" description="Spot what needs the next study pass." icon={Layers} />

      {/* Global Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel flex flex-col items-center justify-between gap-4 p-6 sm:flex-row"
      >
        <div className="text-center sm:text-left">
          <p className="text-3xl font-bold text-text-primary">{totalQuestions}</p>
          <p className="text-sm text-text-muted">Total Questions</p>
        </div>
        <div className="text-center sm:text-right">
          <p className={cn(
            'text-3xl font-bold',
            overallMastery >= 81 ? 'text-accent-green' : overallMastery >= 61 ? 'text-accent-teal' : overallMastery >= 41 ? 'text-accent-orange' : 'text-accent-red'
          )}>
            {overallMastery}%
          </p>
          <p className="text-sm text-text-muted">Overall Mastery</p>
        </div>
      </motion.div>

      {/* Sort Controls */}
      <SegmentedControl
        value={sortBy}
        onChange={setSortBy}
        className="grid-cols-1 sm:grid-cols-3"
        options={[
          { value: 'most', label: 'Most Questions' },
          { value: 'unseen', label: 'Most Unseen' },
          { value: 'mastery', label: 'Lowest Mastery' },
        ]}
      />

      {/* Planning Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {sorted.map((cat) => (
          <motion.div
            key={cat.id}
            variants={itemVariants}
            layout
            className="panel surface-hover p-5"
          >
            <div className="mb-3 flex min-w-0 items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-bg-quaternary" style={{ color: cat.color }}>
                <CategoryIcon icon={cat.icon} className="h-4 w-4" />
              </div>
              <h3 className="truncate font-semibold text-text-primary">{cat.name}</h3>
            </div>
            <p className="text-sm text-text-muted mb-3">{cat.question_count} questions</p>
            <MiniDifficultyBar
              noneCount={cat.none_count}
              easyCount={cat.easy_count}
              goodCount={cat.good_count}
              hardCount={cat.hard_count}
              superHardCount={cat.super_hard_count}
              className="mb-3"
            />
            <div className="flex items-center justify-between">
              <span className={cn(
                'text-sm font-medium',
                cat.mastery_pct >= 81 ? 'text-accent-green' : cat.mastery_pct >= 61 ? 'text-accent-teal' : cat.mastery_pct >= 41 ? 'text-accent-orange' : 'text-accent-red'
              )}>
                {cat.mastery_pct}% mastery
              </span>
              <button
                onClick={() => router.push('/play')}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-accent-indigo text-accent-indigo rounded-lg text-xs hover:bg-accent-indigo/10 transition-colors"
              >
                <Play className="w-3 h-3 fill-current" />
                Play
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
