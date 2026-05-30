'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModalPanel } from '@/components/shared/AppShell';
import { createCategory } from '@/lib/actions/categories';
import { AVATAR_COLORS, CategoryOverview } from '@/types/app';
import { CATEGORY_ICON_OPTIONS, CategoryIcon, normalizeCategoryIcon } from '@/lib/category-icons';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

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
  const [selectedIcon, setSelectedIcon] = useState('book-open');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!editCategory;

  useEffect(() => {
    if (editCategory) {
      setName(editCategory.name);
      setType(editCategory.type || '');
      setSelectedColor(editCategory.color);
      setSelectedIcon(normalizeCategoryIcon(editCategory.icon));
    } else {
      setName('');
      setType('');
      setSelectedColor(AVATAR_COLORS[0]);
      setSelectedIcon('book-open');
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
        icon: selectedIcon,
        color: selectedColor,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await createCategory(profileId, {
        name: name.trim(),
        type: type.trim() || undefined,
        icon: selectedIcon,
        color: selectedColor,
      });

      if (result.success) {
        toast.success('Category created');
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <ModalPanel>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary">
                  {isEdit ? 'Edit Category' : 'New Category'}
                </h2>
                <p className="mt-1 text-sm text-text-muted">Choose a lucide icon and color for this deck.</p>
              </div>
              <button onClick={onClose} className="rounded-lg p-2 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label className="mb-1.5 block text-text-secondary">Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Mathematics" className="border-border-subtle bg-bg-quaternary text-text-primary" maxLength={100} />
              </div>

              <div>
                <Label className="mb-1.5 block text-text-secondary">Type</Label>
                <Input value={type} onChange={e => setType(e.target.value)} placeholder="e.g., Science" className="border-border-subtle bg-bg-quaternary text-text-primary" maxLength={50} />
              </div>

              <div>
                <Label className="mb-2 block text-text-secondary">Icon</Label>
                <div className="grid grid-cols-6 gap-2">
                  {CATEGORY_ICON_OPTIONS.map(option => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSelectedIcon(option.key)}
                      aria-label={option.label}
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200',
                        selectedIcon === option.key
                          ? 'border-accent-indigo bg-accent-indigo/15 text-accent-indigo'
                          : 'border-border-subtle bg-bg-quaternary text-text-secondary hover:text-text-primary'
                      )}
                    >
                      <CategoryIcon icon={option.key} className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-text-secondary">Color</Label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={cn('h-8 w-8 rounded-full transition-all duration-200', selectedColor === color && 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-bg-secondary')}
                      style={{ backgroundColor: color }}
                      aria-label={`Select ${color}`}
                    >
                      {selectedColor === color && <Check className="mx-auto h-4 w-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting || !name.trim()} className="h-10 w-full bg-accent-indigo text-white hover:bg-accent-indigo/90">
                {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Category'}
              </Button>
            </form>
            </ModalPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
