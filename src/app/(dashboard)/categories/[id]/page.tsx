'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Search, X, Plus, FileText, Edit2, Save, Star, Trash2, Move } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoryById } from '@/lib/actions/categories';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion, toggleSaveToSpecial, moveQuestion } from '@/lib/actions/questions';
import { DifficultyBadge } from '@/components/shared/DifficultyBadge';
import { MiniDifficultyBar } from '@/components/shared/MiniDifficultyBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { Question, Category, ParsedQAPair } from '@/types/app';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FileDropzone } from '@/components/questions/FileDropzone';
import { ParsePreviewTable } from '@/components/questions/ParsePreviewTable';
import { CategoryIcon } from '@/lib/category-icons';
import { IconButton, LoadingState, SectionPanel, SegmentedControl, Toolbar } from '@/components/shared/AppShell';
import { Button } from '@/components/ui/button';

type Tab = 'questions' | 'add';
type SubTab = 'manual' | 'upload';

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('questions');
  const [subTab, setSubTab] = useState<SubTab>('manual');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [parsedPairs, setParsedPairs] = useState<ParsedQAPair[]>([]);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [moveTarget, setMoveTarget] = useState<Question | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [profileId, setProfileId] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      if (!sessionRes.ok) { router.push('/'); return; }
      const session = await sessionRes.json();
      setProfileId(session.profile_id);

      const [catRes, qRes] = await Promise.all([
        getCategoryById(categoryId),
        getQuestions(categoryId),
      ]);

      if (catRes.success) setCategory(catRes.data || null);
      if (qRes.success) setQuestions(qRes.data || []);

      // Load all categories for move dropdown
      const { getCategories } = await import('@/lib/actions/categories');
      const catsRes = await getCategories(session.profile_id);
      if (catsRes.success) {
        setAllCategories((catsRes.data || []).filter((c: Category) => c.id !== categoryId));
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [categoryId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredQuestions = questions
    .filter(q => !search || q.question.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'difficulty': return a.difficulty_stat.localeCompare(b.difficulty_stat);
        case 'times_seen': return b.times_seen - a.times_seen;
        case 'last_played': return (b.last_played_at || '').localeCompare(a.last_played_at || '');
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const handleSaveQuestion = async (andAnother = false) => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error('Both question and answer are required');
      return;
    }
    const result = await createQuestion(profileId, categoryId, {
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
    });
    if (result.success) {
      toast.success('Question added!');
      setNewQuestion('');
      setNewAnswer('');
      await loadData();
      if (!andAnother) setActiveTab('questions');
    } else {
      toast.error(result.error || 'Failed to add');
    }
  };

  const handleEditSave = async (id: string) => {
    const result = await updateQuestion(id, {
      question: editQuestion,
      answer: editAnswer,
    });
    if (result.success) {
      toast.success('Updated!');
      setEditingId(null);
      await loadData();
    } else {
      toast.error(result.error || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteQuestion(deleteTarget.id);
    if (result.success) {
      toast.success('Deleted');
      await loadData();
    } else {
      toast.error(result.error || 'Failed to delete');
    }
    setShowDelete(false);
    setDeleteTarget(null);
  };

  const handleToggleSpecial = async (question: Question) => {
    const result = await toggleSaveToSpecial(question.id, profileId);
    if (result.success) {
      setQuestions(prev => prev.map(q =>
        q.id === question.id ? { ...q, is_saved_special: result.data?.saved || false } : q
      ));
      toast.success(result.data?.saved ? 'Saved to Special' : 'Removed from Special');
    } else {
      toast.error(result.error || 'Failed');
    }
  };

  const handleMove = async (questionId: string, newCategoryId: string) => {
    const result = await moveQuestion(questionId, newCategoryId);
    if (result.success) {
      toast.success('Moved!');
      await loadData();
    } else {
      toast.error(result.error || 'Failed to move');
    }
    setMoveTarget(null);
  };

  const handleImport = async (pairs: ParsedQAPair[]) => {
    const validPairs = pairs.filter(p => p.valid && p.question.trim() && p.answer.trim());
    if (validPairs.length === 0) {
      toast.error('No valid questions to import');
      return;
    }
    const result = await (await import('@/lib/actions/questions')).createQuestionsBulk(profileId, categoryId, validPairs);
    if (result.success) {
      toast.success(`Imported ${result.data?.count || validPairs.length} questions!`);
      setParsedPairs([]);
      setActiveTab('questions');
      await loadData();
    } else {
      toast.error(result.error || 'Import failed');
    }
  };

  if (loading) {
    return <LoadingState label="Loading category" />;
  }

  if (!category) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex min-w-0 items-start gap-3">
        <IconButton icon={ChevronLeft} label="Back to categories" onClick={() => router.push('/categories')} />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border-subtle bg-bg-tertiary" style={{ color: category.color }}>
              <CategoryIcon icon={category.icon} className="h-5 w-5" />
            </div>
            <h1 className="min-w-0 break-words text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">{category.name}</h1>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {category.type && <span className="text-xs text-text-muted bg-bg-quaternary px-2 py-0.5 rounded-full">{category.type}</span>}
            <span className="text-sm text-text-muted">{category.question_count} questions</span>
          </div>
        </div>
      </div>

      {/* Difficulty bar */}
      <SectionPanel className="p-3">
        <MiniDifficultyBar
          noneCount={questions.filter(q => q.difficulty_stat === 'none').length}
          easyCount={questions.filter(q => q.difficulty_stat === 'easy').length}
          goodCount={questions.filter(q => q.difficulty_stat === 'good').length}
          hardCount={questions.filter(q => q.difficulty_stat === 'hard').length}
          superHardCount={questions.filter(q => q.difficulty_stat === 'super_hard').length}
        />
      </SectionPanel>

      {/* Tabs */}
      <SegmentedControl
        value={activeTab}
        onChange={setActiveTab}
        className="grid-cols-2 sm:w-auto"
        options={[
          { value: 'questions', label: 'Questions', icon: FileText },
          { value: 'add', label: 'Add Questions', icon: Plus },
        ]}
      />

      <AnimatePresence mode="wait">
        {activeTab === 'questions' ? (
          <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Search and sort */}
            <Toolbar className="mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search questions..."
                  className="field bg-bg-secondary pl-10 pr-10"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-text-muted" />
                  </button>
                )}
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="field sm:w-auto"
              >
                <option value="date">Date Added</option>
                <option value="difficulty">Difficulty</option>
                <option value="times_seen">Times Seen</option>
                <option value="last_played">Last Played</option>
              </select>
            </Toolbar>

            {filteredQuestions.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No questions yet"
                description="Add your first question to get started"
                action={
                  <Button onClick={() => setActiveTab('add')} className="bg-accent-indigo text-white hover:bg-accent-indigo/90">
                    Add Question
                  </Button>
                }
              />
            ) : (
              <div className="divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle bg-bg-tertiary">
                {filteredQuestions.map((q) => (
                  <div key={q.id} className="p-4 hover:bg-white/5 transition-colors">
                    {editingId === q.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editQuestion}
                          onChange={e => setEditQuestion(e.target.value)}
                          className="field resize-none"
                          rows={2}
                        />
                        <textarea
                          value={editAnswer}
                          onChange={e => setEditAnswer(e.target.value)}
                          className="field resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleEditSave(q.id)} className="flex items-center gap-1 rounded-lg bg-accent-green px-3 py-1 text-xs text-white focus-ring">
                            <Save className="w-3 h-3" /> Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1 text-text-muted hover:text-text-primary text-xs">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-medium text-text-primary">{q.question}</p>
                            <p className="mt-1 line-clamp-2 break-words text-xs text-text-secondary">{q.answer}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 sm:shrink-0 sm:justify-end">
                            <DifficultyBadge difficulty={q.difficulty_stat} />
                            <button
                              onClick={() => handleToggleSpecial(q)}
                              className={cn('rounded-lg p-1.5 transition-colors focus-ring', q.is_saved_special ? 'text-accent-gold' : 'text-text-muted hover:text-accent-gold')}
                              aria-label={q.is_saved_special ? 'Remove from special questions' : 'Save to special questions'}
                            >
                              <Star className={cn('w-4 h-4', q.is_saved_special && 'fill-current')} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(q.id);
                                setEditQuestion(q.question);
                                setEditAnswer(q.answer);
                              }}
                              className="rounded-lg p-1.5 text-text-muted transition-colors hover:text-text-primary focus-ring"
                              aria-label="Edit question"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setMoveTarget(moveTarget?.id === q.id ? null : q)}
                                className="rounded-lg p-1.5 text-text-muted transition-colors hover:text-accent-indigo focus-ring"
                                aria-label="Move question"
                              >
                                <Move className="w-4 h-4" />
                              </button>
                              {moveTarget?.id === q.id && (
                <div className="absolute right-0 top-full z-20 mt-1 max-h-56 min-w-[180px] overflow-y-auto rounded-lg border border-border-subtle bg-bg-quaternary py-1 shadow-elevated">
                                  <p className="px-3 py-1 text-xs text-text-muted">Move to:</p>
                                  {allCategories.map(cat => (
                                    <button
                                      key={cat.id}
                                      onClick={() => handleMove(q.id, cat.id)}
                                      className="w-full text-left px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5"
                                    >
                                      <span className="inline-flex items-center gap-2">
                                        <CategoryIcon icon={cat.icon} className="h-4 w-4" />
                                        {cat.name}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => { setDeleteTarget(q); setShowDelete(true); }}
                              className="rounded-lg p-1.5 text-text-muted transition-colors hover:text-accent-red focus-ring"
                              aria-label="Delete question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                          <span>Seen {q.times_seen} times</span>
                          {q.last_played_at && (
                            <span>Last: {new Date(q.last_played_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Sub tabs */}
            <SegmentedControl
              value={subTab}
              onChange={(tab) => { setSubTab(tab); setParsedPairs([]); }}
              className="mb-4 grid-cols-2 sm:w-auto"
              options={[
                { value: 'manual', label: 'Manual Entry', icon: Edit2 },
                { value: 'upload', label: 'File Upload', icon: FileText },
              ]}
            />

            {subTab === 'manual' ? (
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">Question</label>
                  <textarea
                    value={newQuestion}
                    onChange={e => setNewQuestion(e.target.value)}
                    placeholder="Enter your question..."
                    rows={3}
                    className="field resize-none bg-bg-tertiary p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">Answer</label>
                  <textarea
                    value={newAnswer}
                    onChange={e => setNewAnswer(e.target.value)}
                    placeholder="Enter the answer..."
                    rows={4}
                    className="field resize-none bg-bg-tertiary p-3"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => handleSaveQuestion(true)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-accent-indigo px-4 py-2 text-sm font-medium text-accent-indigo transition-colors hover:bg-accent-indigo/10 focus-ring"
                  >
                    <Plus className="w-4 h-4" />
                    Save & Add Another
                  </button>
                  <button
                    onClick={() => handleSaveQuestion(false)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-accent-indigo px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-indigo/90 focus-ring"
                  >
                    <Save className="w-4 h-4" />
                    Save & Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {parsedPairs.length === 0 ? (
                  <FileDropzone onParse={setParsedPairs} />
                ) : (
                  <ParsePreviewTable
                    pairs={parsedPairs}
                    onPairsChange={setParsedPairs}
                    onImport={handleImport}
                    onCancel={() => setParsedPairs([])}
                  />
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Delete Question"
        description={`This question will be permanently deleted. This action cannot be undone.`}
        danger
      />

      {moveTarget && <div className="fixed inset-0 z-10" onClick={() => setMoveTarget(null)} />}
    </div>
  );
}
