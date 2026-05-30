'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCategories, deleteCategory, updateCategory } from '@/lib/actions/categories';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { CreateCategoryModal } from '@/components/categories/CreateCategoryModal';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { EmptyState } from '@/components/shared/EmptyState';
import { CategoryOverview } from '@/types/app';
import { FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingState, PageHeader } from '@/components/shared/AppShell';
import { Button } from '@/components/ui/button';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryOverview[]>([]);
  const [profileId, setProfileId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadCategories = useCallback(async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      if (!sessionRes.ok) return;
      const session = await sessionRes.json();
      setProfileId(session.profile_id);

      const result = await getCategories(session.profile_id);
      if (result.success && result.data) {
        setCategories(result.data);
      }
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleDelete = async () => {
    if (!selectedCategory) return;
    const result = await deleteCategory(selectedCategory.id);
    if (result.success) {
      toast.success('Category deleted');
      setCategories(prev => prev.filter(c => c.id !== selectedCategory.id));
    } else {
      toast.error(result.error || 'Failed to delete');
    }
    setShowDelete(false);
    setSelectedCategory(null);
  };

  const handleEdit = async (data: { name: string; type?: string; icon?: string; color?: string }) => {
    if (!selectedCategory) return;
    const result = await updateCategory(selectedCategory.id, data);
    if (result.success) {
      toast.success('Category updated');
      loadCategories();
    } else {
      toast.error(result.error || 'Failed to update');
    }
    setShowEdit(false);
    setSelectedCategory(null);
  };

  if (loading) {
    return <LoadingState label="Loading categories" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Categories"
        description="Organize question decks and track mastery at a glance."
        icon={FolderOpen}
        action={
          <Button onClick={() => setShowCreate(true)} className="h-10 bg-accent-indigo text-white hover:bg-accent-indigo/90">
            <Plus className="h-4 w-4" />
            New Category
          </Button>
        }
      />

      {categories.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No categories yet"
          description="Create your first category to start organizing your flashcards"
          action={
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-accent-indigo text-white hover:bg-accent-indigo/90"
            >
              <Plus className="w-4 h-4" />
              Create Category
            </Button>
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {categories.map((category, i) => (
            <CategoryCard
              key={category.id}
              category={category}
              index={i}
              onClick={() => router.push(`/categories/${category.id}`)}
              onEdit={() => { setSelectedCategory(category); setShowEdit(true); }}
              onDelete={() => { setSelectedCategory(category); setShowDelete(true); }}
            />
          ))}
        </motion.div>
      )}

      <CreateCategoryModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        profileId={profileId}
        onSuccess={loadCategories}
      />

      {selectedCategory && (
        <>
          <ConfirmModal
            isOpen={showDelete}
            onClose={() => { setShowDelete(false); setSelectedCategory(null); }}
            onConfirm={handleDelete}
            title="Delete Category"
            description={`This will delete "${selectedCategory.name}" and all ${selectedCategory.question_count} questions inside it. This action cannot be undone.`}
            danger
          />
          <CreateCategoryModal
            isOpen={showEdit}
            onClose={() => { setShowEdit(false); setSelectedCategory(null); }}
            profileId={profileId}
            onSuccess={loadCategories}
            editCategory={selectedCategory}
            onEditSubmit={handleEdit}
          />
        </>
      )}
    </div>
  );
}
