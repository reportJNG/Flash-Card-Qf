'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Layers } from 'lucide-react';
import { getProfiles } from '@/lib/actions/profile';
import { ProfileCard } from '@/components/auth/ProfileCard';
import { CreateProfileModal } from '@/components/auth/CreateProfileModal';
import { PinModal } from '@/components/auth/PinModal';
import { EmptyState } from '@/components/shared/EmptyState';
import { Profile } from '@/types/app';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState<string>();
  const router = useRouter();

  const loadProfiles = useCallback(async () => {
    const result = await getProfiles();
    if (result.success && result.data) {
      setProfiles(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleProfileClick = (profile: Profile) => {
    setPinError(undefined);
    if (profile.pin) {
      setSelectedProfile(profile);
      setShowPinModal(true);
    } else {
      handleLogin(profile.username);
    }
  };

  const handleLogin = async (username: string, pin?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPinError(data.error || 'Login failed');
        return;
      }

      toast.success('Welcome back!');
      router.push('/dashboard');
      router.refresh();
    } catch {
      setPinError('Something went wrong');
      toast.error('Login failed');
    }
  };

  const handlePinSubmit = (pin: string) => {
    if (selectedProfile) {
      handleLogin(selectedProfile.username, pin);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-indigo border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h1 className="text-5xl font-extrabold text-gradient mb-2">FlashQF</h1>
        <p className="text-xs text-text-muted tracking-[0.2em] uppercase">Flip. Rate. Master.</p>
      </motion.div>

      {profiles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <EmptyState
            icon={Layers}
            title="No profiles yet"
            description="Create your first profile to get started with FlashQF"
            action={
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-4 bg-accent-indigo hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create First Profile
              </button>
            }
          />
        </motion.div>
      ) : (
        <>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-text-secondary mb-6"
          >
            Select a profile to continue
          </motion.p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-lg w-full">
            {profiles.map((profile, i) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onClick={() => handleProfileClick(profile)}
                index={i}
              />
            ))}
          </div>
        </>
      )}

      {/* Floating + New Profile button */}
      {profiles.length > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-accent-indigo hover:bg-indigo-600 text-white rounded-full shadow-glow-sm flex items-center justify-center transition-colors z-30"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      {/* Modals */}
      <CreateProfileModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadProfiles}
      />

      <PinModal
        isOpen={showPinModal}
        onClose={() => { setShowPinModal(false); setSelectedProfile(null); setPinError(undefined); }}
        onSubmit={handlePinSubmit}
        profileName={selectedProfile?.display_name || ''}
        profileColor={selectedProfile?.avatar_color || '#6366f1'}
        error={pinError}
      />
    </div>
  );
}
