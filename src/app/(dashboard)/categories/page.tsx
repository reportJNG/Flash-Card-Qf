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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent-indigo border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">My Categories</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-indigo hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No categories yet"
          description="Create your first category to start organizing your flashcards"
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 bg-accent-indigo hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Category
            </button>
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
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
