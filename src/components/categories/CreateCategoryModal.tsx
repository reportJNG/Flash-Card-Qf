'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCategory } from '@/lib/actions/categories';
import { AVATAR_COLORS, CategoryOverview } from '@/types/app';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const EMOJI_OPTIONS = ['📚', '🎯', '🧠', '💡', '🔥', '⭐', '🎓', '📝', '🧮', '🎮', '🌟', '💪', '🔬', '🌍', '🎨', '⚡'];

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  onSuccess: () => void;
  editCategory?: CategoryOverview | null;
  onEditSubmit?: (data: { name: string; type?: string; icon?: string; color?: string }) => void;
}

export function CreateCategoryModal({ isOpen, onClose, profileId, onSuccess, editCategory, onEditSubmit }: CreateCategoryModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(AVATAR_COLORS[0]);
  const [selectedEmoji, setSelectedEmoji] = useState('📚');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!editCategory;

  useEffect(() => {
    if (editCategory) {
      setName(editCategory.name);
      setType(editCategory.type || '');
      setSelectedColor(editCategory.color);
      setSelectedEmoji(editCategory.icon);
    } else {
      setName('');
      setType('');
      setSelectedColor(AVATAR_COLORS[0]);
      setSelectedEmoji('📚');
    }
  }, [editCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSubmitting(true);

    if (isEdit && onEditSubmit) {
      onEditSubmit({
        name: name.trim(),
        type: type.trim() || undefined,
        icon: selectedEmoji,
        color: selectedColor,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await createCategory(profileId, {
        name: name.trim(),
        type: type.trim() || undefined,
        icon: selectedEmoji,
        color: selectedColor,
      });

      if (result.success) {
        toast.success('Category created!');
        setName('');
        setType('');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to create');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-bg-secondary rounded-xl p-6 max-w-md w-full mx-4 shadow-elevated border border-border-subtle"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">
                {isEdit ? 'Edit Category' : 'New Category'}
              </h2>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label className="text-text-secondary mb-1.5 block">Name *</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Mathematics"
                  className="bg-bg-quaternary border-border-subtle text-text-primary"
                  maxLength={100}
                />
              </div>

              <div>
                <Label className="text-text-secondary mb-1.5 block">Type (optional)</Label>
                <Input
                  value={type}
                  onChange={e => setType(e.target.value)}
                  placeholder="e.g., Science"
                  className="bg-bg-quaternary border-border-subtle text-text-primary"
                  maxLength={50}
                />
              </div>

              <div>
                <Label className="text-text-secondary mb-2 block">Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all duration-200',
                        selectedEmoji === emoji
                          ? 'bg-accent-indigo/20 ring-1 ring-accent-indigo'
                          : 'bg-bg-quaternary hover:bg-bg-quaternary/80'
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-text-secondary mb-2 block">Color</Label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all duration-200',
                        selectedColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-bg-secondary scale-110'
                      )}
                      style={{ backgroundColor: color }}
                    >
                      {selectedColor === color && <Check className="w-4 h-4 text-white mx-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="w-full bg-accent-indigo hover:bg-indigo-600 text-white"
              >
                {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Category'}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
