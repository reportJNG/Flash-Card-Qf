'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Play, Zap, Compass, Infinity } from 'lucide-react';
import { getCategories } from '@/lib/actions/categories';
import { createSession } from '@/lib/actions/sessions';
import { CategoryOverview } from '@/types/app';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const COUNT_OPTIONS = [
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '15', value: 15 },
  { label: '20', value: 20 },
  { label: '30', value: 30 },
  { label: '50', value: 50 },
];

export default function PlaySetupPage() {
  const [categories, setCategories] = useState<CategoryOverview[]>([]);
  const [profileId, setProfileId] = useState('');
  const [mode, setMode] = useState<'normal' | 'hard'>('normal');
  const [catSelection, setCatSelection] = useState<'all' | 'specific' | 'special'>('all');
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [count, setCount] = useState<'5' | '10' | '15' | '20' | '30' | '50' | 'custom' | 'infinity'>('10');
  const [customCount, setCustomCount] = useState('10');
  const [isStarting, setIsStarting] = useState(false);
  const router = useRouter();

  const loadCategories = useCallback(async () => {
    const sessionRes = await fetch('/api/auth/session');
    if (!sessionRes.ok) return;
    const session = await sessionRes.json();
    setProfileId(session.profile_id);

    const result = await getCategories(session.profile_id);
    if (result.success && result.data) {
      setCategories(result.data);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const selectedQuestionCount = count === 'infinity' ? null : count === 'custom' ? parseInt(customCount) || 10 : parseInt(count);
  const selectedCats = catSelection === 'all' ? [] : catSelection === 'special' ? categories.filter(c => c.is_special).map(c => c.id) : selectedCatIds;
  const totalQuestions = catSelection === 'all'
    ? categories.reduce((sum, c) => sum + c.question_count, 0)
    : catSelection === 'special'
    ? categories.find(c => c.is_special)?.question_count || 0
    : categories.filter(c => selectedCatIds.includes(c.id)).reduce((sum, c) => sum + c.question_count, 0);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const result = await createSession(profileId, {
        mode,
        categoryIds: selectedCats,
        isAllCategories: catSelection === 'all',
        isInfinity: count === 'infinity',
        questionLimit: selectedQuestionCount,
      });

      if (result.success && result.data) {
        router.push(`/play/session/${result.data.id}`);
      } else {
        toast.error(result.error || 'Failed to start session');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsStarting(false);
    }
  };

  const hasEnoughQuestions = totalQuestions > 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-2xl mx-auto space-y-8 pb-24">
      <motion.h1 variants={itemVariants} className="text-3xl font-bold text-text-primary text-center">
        Play Setup
      </motion.h1>

      {/* Mode Selection */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Choose Mode</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('normal')}
            className={cn(
              'p-4 rounded-xl border-2 transition-all text-left',
              mode === 'normal' ? 'border-accent-indigo bg-accent-indigo/5' : 'border-border-subtle hover:border-text-muted'
            )}
          >
            <Compass className={cn('w-6 h-6 mb-2', mode === 'normal' ? 'text-accent-indigo' : 'text-text-muted')} />
            <p className={cn('font-medium', mode === 'normal' ? 'text-text-primary' : 'text-text-secondary')}>Normal Mode</p>
            <p className="text-xs text-text-muted mt-1">Unseen questions first, then random. Relaxed and exploratory.</p>
          </button>
          <button
            onClick={() => setMode('hard')}
            className={cn(
              'p-4 rounded-xl border-2 transition-all text-left',
              mode === 'hard' ? 'border-accent-orange bg-orange-500/5' : 'border-border-subtle hover:border-text-muted'
            )}
          >
            <Zap className={cn('w-6 h-6 mb-2', mode === 'hard' ? 'text-accent-orange' : 'text-text-muted')} />
            <p className={cn('font-medium', mode === 'hard' ? 'text-text-primary' : 'text-text-secondary')}>Hard Mode</p>
            <p className="text-xs text-text-muted mt-1">Targets weak spots: Super Hard → Hard → New → Good → Easy.</p>
          </button>
        </div>
      </motion.div>

      {/* Category Selection */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Select Categories</h2>
        <div className="space-y-2">
          {[
            { key: 'all' as const, label: 'All Categories', desc: 'Random across everything' },
            { key: 'specific' as const, label: 'Choose Specific', desc: 'Select one or more categories' },
            { key: 'special' as const, label: '⭐ Special Only', desc: 'Only saved star questions' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setCatSelection(opt.key)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                catSelection === opt.key ? 'border-accent-indigo bg-accent-indigo/5' : 'border-border-subtle hover:border-text-muted'
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                catSelection === opt.key ? 'border-accent-indigo' : 'border-text-muted'
              )}>
                {catSelection === opt.key && <div className="w-2.5 h-2.5 rounded-full bg-accent-indigo" />}
              </div>
              <div>
                <p className={cn('text-sm font-medium', catSelection === opt.key ? 'text-text-primary' : 'text-text-secondary')}>{opt.label}</p>
                <p className="text-xs text-text-muted">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {catSelection === 'specific' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-bg-tertiary rounded-lg p-3 max-h-48 overflow-y-auto scrollbar-thin">
            {categories.filter(c => !c.is_special).map(cat => (
              <label key={cat.id} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-white/5 rounded px-2 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedCatIds.includes(cat.id)}
                  onChange={(e) => {
                    setSelectedCatIds(prev =>
                      e.target.checked ? [...prev, cat.id] : prev.filter(id => id !== cat.id)
                    );
                  }}
                  className="w-4 h-4 rounded border-border-subtle bg-bg-quaternary text-accent-indigo accent-accent-indigo"
                />
                <span className="text-sm text-text-primary">{cat.icon} {cat.name}</span>
                <span className="text-xs text-text-muted ml-auto">{cat.question_count}</span>
              </label>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Question Count */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">How Many Questions?</h2>
        <div className="flex flex-wrap gap-2">
          {COUNT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setCount(String(opt.value) as typeof count)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                count === String(opt.value) ? 'bg-accent-indigo text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              )}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setCount('custom')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              count === 'custom' ? 'bg-accent-indigo text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
            )}
          >
            Custom
          </button>
          <button
            onClick={() => setCount('infinity')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
              count === 'infinity' ? 'bg-accent-indigo text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
            )}
          >
            <Infinity className="w-4 h-4" />
            Infinity
          </button>
        </div>
        {count === 'custom' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <input
              type="number"
              value={customCount}
              onChange={e => setCustomCount(e.target.value)}
              min={1}
              max={999}
              className="w-24 px-3 py-2 bg-bg-tertiary border border-border-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo/50"
            />
          </motion.div>
        )}
      </motion.div>

      {/* Summary + Start */}
      <motion.div variants={itemVariants} className="fixed bottom-0 left-0 right-0 md:left-[240px] bg-bg-secondary/95 backdrop-blur-lg border-t border-border-subtle p-4 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-sm">
            <p className="text-text-secondary">
              <span className="capitalize font-medium text-text-primary">{mode}</span> mode • {totalQuestions} questions • {count === 'infinity' ? '∞' : selectedQuestionCount} cards
            </p>
            <p className="text-xs text-text-muted">
              Estimated: 0–{count === 'infinity' ? '∞' : (selectedQuestionCount || 0) * 10} pts
            </p>
          </div>
          <button
            onClick={handleStart}
            disabled={isStarting || !hasEnoughQuestions}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all',
              hasEnoughQuestions
                ? 'bg-accent-green hover:bg-green-600 text-white shadow-glow-green'
                : 'bg-bg-quaternary text-text-muted cursor-not-allowed'
            )}
          >
            <Play className="w-5 h-5 fill-current" />
            {isStarting ? 'Starting...' : hasEnoughQuestions ? 'Start' : 'No questions'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
