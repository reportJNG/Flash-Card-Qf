'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModalPanel } from '@/components/shared/AppShell';
import { AVATAR_COLORS } from '@/types/app';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProfileModal({ isOpen, onClose, onSuccess }: CreateProfileModalProps) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(AVATAR_COLORS[0]);
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.toLowerCase().trim(),
          display_name: displayName.trim(),
          avatar_color: selectedColor,
          pin: pin || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create profile');
        return;
      }

      toast.success('Profile created');
      setUsername('');
      setDisplayName('');
      setPin('');
      onSuccess();
      onClose();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
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
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-subtle bg-bg-tertiary text-accent-indigo">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-text-primary">New Profile</h2>
                  <p className="mt-1 text-sm text-text-muted">Create a local study profile.</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-lg p-2 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label className="mb-1.5 block text-text-secondary">Username *</Label>
                <Input value={username} onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_-]/gi, '').toLowerCase())} placeholder="e.g., alice" className="border-border-subtle bg-bg-quaternary text-text-primary" maxLength={30} />
                <p className="mt-1 text-xs text-text-muted">Lowercase letters, numbers, hyphens, underscores</p>
              </div>

              <div>
                <Label className="mb-1.5 block text-text-secondary">Display Name *</Label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g., Alice" className="border-border-subtle bg-bg-quaternary text-text-primary" maxLength={50} />
              </div>

              <div>
                <Label className="mb-2 block text-text-secondary">Avatar Color</Label>
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

              <div>
                <Label className="mb-1.5 block text-text-secondary">PIN</Label>
                <Input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Optional 4-digit PIN" type="password" maxLength={4} className="border-border-subtle bg-bg-quaternary text-text-primary" />
                <p className="mt-1 text-xs text-text-muted">Use 4 numeric digits for extra privacy.</p>
              </div>

              <Button type="submit" disabled={isSubmitting || !username.trim() || !displayName.trim()} className="h-10 w-full bg-accent-indigo text-white hover:bg-accent-indigo/90">
                {isSubmitting ? 'Creating...' : 'Create Profile'}
              </Button>
            </form>
            </ModalPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
