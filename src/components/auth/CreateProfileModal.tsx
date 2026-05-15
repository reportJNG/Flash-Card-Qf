'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AVATAR_COLORS } from '@/types/app';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EMOJI_OPTIONS = ['📚', '🎯', '🧠', '💡', '🔥', '⭐', '🎓', '📝', '🧮', '🎮', '🌟', '💪'];

export function CreateProfileModal({ isOpen, onClose, onSuccess }: CreateProfileModalProps) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(AVATAR_COLORS[0]);
  const [selectedEmoji, setSelectedEmoji] = useState('📚');
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

      toast.success('Profile created!');
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
              <h2 className="text-xl font-semibold text-text-primary">New Profile</h2>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label className="text-text-secondary mb-1.5 block">Username *</Label>
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_-]/gi, '').toLowerCase())}
                  placeholder="e.g., alice"
                  className="bg-bg-quaternary border-border-subtle text-text-primary"
                  maxLength={30}
                />
                <p className="text-xs text-text-muted mt-1">Lowercase letters, numbers, hyphens, underscores</p>
              </div>

              <div>
                <Label className="text-text-secondary mb-1.5 block">Display Name *</Label>
                <Input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="e.g., Alice"
                  className="bg-bg-quaternary border-border-subtle text-text-primary"
                  maxLength={50}
                />
              </div>

              <div>
                <Label className="text-text-secondary mb-2 block">Avatar Color</Label>
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
                <Label className="text-text-secondary mb-1.5 block">PIN (optional)</Label>
                <Input
                  value={pin}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPin(val);
                  }}
                  placeholder="4-digit PIN"
                  type="password"
                  maxLength={4}
                  className="bg-bg-quaternary border-border-subtle text-text-primary"
                />
                <p className="text-xs text-text-muted mt-1">4 numeric digits for extra security</p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !username.trim() || !displayName.trim()}
                className="w-full bg-accent-indigo hover:bg-indigo-600 text-white"
              >
                {isSubmitting ? 'Creating...' : 'Create Profile'}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
