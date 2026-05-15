'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, Check } from 'lucide-react';
import { updateProfile, deleteProfile, deleteAllQuestions } from '@/lib/actions/profile';
import { AVATAR_COLORS } from '@/types/app';
import { Avatar } from '@/components/shared/Avatar';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ id: string; display_name: string; avatar_color: string; hasPin: boolean } | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(AVATAR_COLORS[0]);
  const [pin, setPin] = useState('');
  const [showDeleteQuestions, setShowDeleteQuestions] = useState(false);
  const [showDeleteProfile, setShowDeleteProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/auth/session');
      if (!res.ok) { router.push('/'); return; }
      const session = await res.json();

      // Get full profile to check PIN
      const { getProfileByUsername } = await import('@/lib/actions/profile');
      const profileRes = await getProfileByUsername(session.username);
      if (profileRes.success && profileRes.data) {
        const p = profileRes.data;
        setProfile({ id: p.id, display_name: p.display_name, avatar_color: p.avatar_color, hasPin: !!p.pin });
        setDisplayName(p.display_name);
        setSelectedColor(p.avatar_color);
      }
    }
    load();
  }, [router]);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    const updateData: Record<string, unknown> = {};
    if (displayName.trim() && displayName !== profile.display_name) updateData.display_name = displayName.trim();
    if (selectedColor !== profile.avatar_color) updateData.avatar_color = selectedColor;
    if (pin) {
      if (pin.length === 4) updateData.pin = pin;
      else { toast.error('PIN must be 4 digits'); setIsSaving(false); return; }
    }

    if (Object.keys(updateData).length === 0) {
      toast('No changes to save');
      setIsSaving(false);
      return;
    }

    const result = await updateProfile(profile.id, updateData);
    if (result.success) {
      toast.success('Profile updated!');
      setPin('');
    } else {
      toast.error(result.error || 'Update failed');
    }
    setIsSaving(false);
  };

  const handleRemovePin = async () => {
    if (!profile) return;
    const result = await updateProfile(profile.id, { pin: null });
    if (result.success) {
      setProfile(prev => prev ? { ...prev, hasPin: false } : null);
      toast.success('PIN removed');
    } else {
      toast.error(result.error || 'Failed to remove PIN');
    }
  };

  const handleDeleteQuestions = async () => {
    if (!profile) return;
    const result = await deleteAllQuestions(profile.id);
    if (result.success) {
      toast.success('All questions deleted');
    } else {
      toast.error(result.error || 'Failed to delete');
    }
    setShowDeleteQuestions(false);
  };

  const handleDeleteProfile = async () => {
    if (!profile) return;
    const result = await deleteProfile(profile.id);
    if (result.success) {
      toast.success('Profile deleted');
      router.push('/');
    } else {
      toast.error(result.error || 'Failed to delete');
    }
    setShowDeleteProfile(false);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent-indigo border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto space-y-6"
    >
      <h1 className="text-2xl font-bold text-text-primary">Profile Settings</h1>

      {/* Profile Section */}
      <div className="bg-bg-tertiary rounded-xl p-6 shadow-card space-y-5">
        <div className="flex items-center gap-4 mb-2">
          <Avatar name={displayName || profile.display_name} color={selectedColor} size="lg" />
          <div>
            <p className="text-lg font-semibold text-text-primary">{displayName || profile.display_name}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1.5">Display Name</label>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 bg-bg-quaternary border border-border-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo/50"
            maxLength={50}
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-2">Avatar Color</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={cn(
                  'w-8 h-8 rounded-full transition-all duration-200',
                  selectedColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-bg-tertiary scale-110'
                )}
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && <Check className="w-4 h-4 text-white mx-auto" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1.5">
            PIN {profile.hasPin && <span className="text-accent-green text-xs">(set)</span>}
          </label>
          <input
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder={profile.hasPin ? 'Enter new PIN (4 digits)' : 'Set a 4-digit PIN'}
            type="password"
            maxLength={4}
            className="w-full px-3 py-2 bg-bg-quaternary border border-border-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo/50"
          />
          {profile.hasPin && (
            <button
              onClick={handleRemovePin}
              className="text-sm text-accent-red hover:underline mt-1"
            >
              Remove PIN
            </button>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-2.5 bg-accent-indigo hover:bg-indigo-600 disabled:bg-bg-quaternary text-white rounded-lg transition-colors text-sm font-medium"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-bg-tertiary rounded-xl p-6 shadow-card border border-accent-red/20 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-accent-red" />
          <h2 className="text-lg font-semibold text-accent-red">Danger Zone</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Delete All Questions</p>
              <p className="text-xs text-text-muted">Remove all questions across all categories</p>
            </div>
            <button
              onClick={() => setShowDeleteQuestions(true)}
              className="px-4 py-2 border border-accent-red text-accent-red rounded-lg hover:bg-red-500/10 transition-colors text-sm"
            >
              Delete
            </button>
          </div>

          <div className="border-t border-border-subtle pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Delete Profile</p>
              <p className="text-xs text-text-muted">Permanently delete your profile and all data</p>
            </div>
            <button
              onClick={() => setShowDeleteProfile(true)}
              className="px-4 py-2 bg-accent-red hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteQuestions}
        onClose={() => setShowDeleteQuestions(false)}
        onConfirm={handleDeleteQuestions}
        title="Delete All Questions"
        description="This will permanently delete ALL questions across all your categories. This cannot be undone."
        danger
      />

      <ConfirmModal
        isOpen={showDeleteProfile}
        onClose={() => setShowDeleteProfile(false)}
        onConfirm={handleDeleteProfile}
        title="Delete Profile"
        description="This will permanently delete your profile, all categories, questions, sessions, and answers. This cannot be undone."
        danger
      />
    </motion.div>
  );
}
