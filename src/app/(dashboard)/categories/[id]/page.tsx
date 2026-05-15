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
import { LoadingState, SectionPanel } from '@/components/shared/AppShell';

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/categories')} className="rounded-lg p-2 transition-colors hover:bg-white/5">
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border-subtle bg-bg-tertiary" style={{ color: category.color }}>
              <CategoryIcon icon={category.icon} className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">{category.name}</h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
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
      <div className="flex gap-1 bg-bg-tertiary rounded-lg p-1">
        {(['questions', 'add'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
              activeTab === tab ? 'bg-bg-quaternary text-text-primary' : 'text-text-muted hover:text-text-secondary'
            )}
          >
            {tab === 'questions' ? 'Questions' : 'Add Questions'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'questions' ? (
          <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Search and sort */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-border-subtle rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-indigo/50"
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
                className="px-3 py-2 bg-bg-tertiary border border-border-subtle rounded-lg text-text-primary text-sm focus:outline-none"
              >
                <option value="date">Date Added</option>
                <option value="difficulty">Difficulty</option>
                <option value="times_seen">Times Seen</option>
                <option value="last_played">Last Played</option>
              </select>
            </div>

            {filteredQuestions.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No questions yet"
                description="Add your first question to get started"
                action={
                  <button onClick={() => setActiveTab('add')} className="px-4 py-2 bg-accent-indigo text-white rounded-lg text-sm">
                    Add Question
                  </button>
                }
              />
            ) : (
              <div className="bg-bg-tertiary rounded-xl overflow-hidden divide-y divide-border-subtle">
                {filteredQuestions.map((q) => (
                  <div key={q.id} className="p-4 hover:bg-white/5 transition-colors">
                    {editingId === q.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editQuestion}
                          onChange={e => setEditQuestion(e.target.value)}
                          className="w-full p-2 bg-bg-quaternary border border-border-subtle rounded-lg text-text-primary text-sm resize-none"
                          rows={2}
                        />
                        <textarea
                          value={editAnswer}
                          onChange={e => setEditAnswer(e.target.value)}
                          className="w-full p-2 bg-bg-quaternary border border-border-subtle rounded-lg text-text-primary text-sm resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleEditSave(q.id)} className="flex items-center gap-1 px-3 py-1 bg-accent-green text-white rounded-lg text-xs">
                            <Save className="w-3 h-3" /> Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1 text-text-muted hover:text-text-primary text-xs">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-text-primary font-medium truncate">{q.question}</p>
                            <p className="text-xs text-text-secondary mt-0.5 truncate">{q.answer}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <DifficultyBadge difficulty={q.difficulty_stat} />
                            <button
                              onClick={() => handleToggleSpecial(q)}
                              className={cn('p-1.5 rounded-lg transition-colors', q.is_saved_special ? 'text-accent-gold' : 'text-text-muted hover:text-accent-gold')}
                            >
                              <Star className={cn('w-4 h-4', q.is_saved_special && 'fill-current')} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(q.id);
                                setEditQuestion(q.question);
                                setEditAnswer(q.answer);
                              }}
                              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setMoveTarget(moveTarget?.id === q.id ? null : q)}
                                className="p-1.5 rounded-lg text-text-muted hover:text-accent-indigo transition-colors"
                              >
                                <Move className="w-4 h-4" />
                              </button>
                              {moveTarget?.id === q.id && (
                                <div className="absolute right-0 top-full mt-1 bg-bg-quaternary rounded-lg shadow-elevated border border-border-subtle py-1 z-20 min-w-[160px]">
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
                              className="p-1.5 rounded-lg text-text-muted hover:text-accent-red transition-colors"
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
            <div className="flex gap-2 mb-4 border-b border-border-subtle">
              {(['manual', 'upload'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setSubTab(tab); setParsedPairs([]); }}
                  className={cn(
                    'pb-2 px-4 text-sm font-medium transition-colors border-b-2',
                    subTab === tab ? 'border-accent-indigo text-text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'
                  )}
                >
                  {tab === 'manual' ? 'Manual Entry' : 'File Upload'}
                </button>
              ))}
            </div>

            {subTab === 'manual' ? (
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">Question</label>
                  <textarea
                    value={newQuestion}
                    onChange={e => setNewQuestion(e.target.value)}
                    placeholder="Enter your question..."
                    rows={3}
                    className="w-full p-3 bg-bg-tertiary border border-border-subtle rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-indigo/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">Answer</label>
                  <textarea
                    value={newAnswer}
                    onChange={e => setNewAnswer(e.target.value)}
                    placeholder="Enter the answer..."
                    rows={4}
                    className="w-full p-3 bg-bg-tertiary border border-border-subtle rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-indigo/50 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSaveQuestion(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-accent-indigo text-accent-indigo rounded-lg hover:bg-accent-indigo/10 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Save & Add Another
                  </button>
                  <button
                    onClick={() => handleSaveQuestion(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-accent-indigo hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm font-medium"
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
