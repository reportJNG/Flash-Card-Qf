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
import { LoadingState } from '@/components/shared/AppShell';
import { Button } from '@/components/ui/button';

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
    return <LoadingState label="Loading profiles" />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-secondary px-4 py-8 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg border border-border-subtle bg-bg-tertiary shadow-card">
          <Layers className="h-7 w-7 text-accent-indigo" />
        </div>
        <h1 className="mb-2 text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">FlashQF</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Flip. Rate. Master.</p>
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
              <Button
                onClick={() => setShowCreateModal(true)}
                size="lg"
                className="h-12 bg-accent-indigo px-6 text-white hover:bg-indigo-600"
              >
                <Plus className="w-5 h-5" />
                Create First Profile
              </Button>
            }
          />
        </motion.div>
      ) : (
        <>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 text-sm text-text-secondary"
          >
            Select a profile to continue
          </motion.p>

          <div className="grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
          className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-lg border border-border-active bg-accent-indigo text-white shadow-card transition-colors hover:bg-accent-indigo/90 focus-ring"
          aria-label="Create profile"
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
