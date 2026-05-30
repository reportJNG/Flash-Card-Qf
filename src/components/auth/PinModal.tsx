'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Delete, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { ModalPanel } from '@/components/shared/AppShell';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  profileName: string;
  profileColor: string;
  error?: string;
  isSubmitting?: boolean;
}

export function PinModal({ isOpen, onClose, onSubmit, profileName, profileColor, error, isSubmitting = false }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [, setAttemptCount] = useState(0);

  useEffect(() => {
    if (error && isOpen) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      setPin('');
      setAttemptCount(prev => {
        const next = prev + 1;
        if (next >= 3) {
          setIsLocked(true);
          setLockoutTimer(10);
        }
        return next;
      });
    }
  }, [error, isOpen]);

  useEffect(() => {
    if (lockoutTimer > 0) {
      const interval = setInterval(() => {
        setLockoutTimer(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setAttemptCount(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTimer]);

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setIsShaking(false);
      setIsLocked(false);
      setLockoutTimer(0);
      setAttemptCount(0);
    }
  }, [isOpen]);

  const handleKeyPress = useCallback((key: string) => {
    if (isLocked || isSubmitting) return;
    if (key === 'backspace') {
      setPin(prev => prev.slice(0, -1));
    } else if (key === 'enter') {
      if (pin.length === 4) {
        onSubmit(pin);
      }
    } else if (pin.length < 4 && /^\d$/.test(key)) {
      setPin(prev => prev + key);
    }
  }, [pin, isLocked, isSubmitting, onSubmit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'Backspace') handleKeyPress('backspace');
      if (e.key === 'Enter') handleKeyPress('enter');
      if (/^\d$/.test(e.key)) handleKeyPress(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleKeyPress]);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

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
            initial={{ scale: 0.9, y: 20 }}
            animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : { scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <ModalPanel>
            <div className="flex justify-end mb-2">
              <button onClick={onClose} className="rounded-lg p-1 text-text-muted transition-colors hover:text-text-primary focus-ring" aria-label="Close PIN dialog">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-6">
              <Avatar name={profileName} color={profileColor} size="lg" />
              <span className="mt-3 text-lg font-medium text-text-primary">{profileName}</span>
              <p className="text-sm text-text-muted">Enter your PIN</p>
            </div>

            {/* PIN dots */}
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    i < pin.length
                      ? 'bg-accent-indigo scale-100'
                      : 'bg-bg-quaternary border-2 border-text-muted/30 scale-90'
                  }`}
                  style={error && i < pin.length ? { backgroundColor: '#ef4444' } : {}}
                />
              ))}
            </div>

            {isLocked && (
              <p className="text-center text-accent-red text-sm mb-4">
                Locked. Try again in {lockoutTimer}s
              </p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {keys.map(key => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  disabled={isLocked || isSubmitting}
                  className="h-14 rounded-lg border border-border-subtle bg-bg-quaternary text-lg font-medium text-text-primary transition-colors hover:bg-bg-tertiary disabled:opacity-50 focus-ring"
                >
                  {key}
                </button>
              ))}
              <button
                onClick={() => handleKeyPress('backspace')}
                disabled={isLocked || isSubmitting}
                className="flex h-14 items-center justify-center rounded-lg border border-border-subtle bg-bg-quaternary text-text-primary transition-colors hover:bg-bg-tertiary disabled:opacity-50 focus-ring"
              >
                <Delete className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleKeyPress('0')}
                disabled={isLocked || isSubmitting}
                className="h-14 rounded-lg border border-border-subtle bg-bg-quaternary text-lg font-medium text-text-primary transition-colors hover:bg-bg-tertiary disabled:opacity-50 focus-ring"
              >
                0
              </button>
              <button
                onClick={() => handleKeyPress('enter')}
                disabled={isLocked || isSubmitting || pin.length !== 4}
                className="flex h-14 items-center justify-center rounded-lg bg-accent-indigo text-lg font-medium text-white transition-colors hover:bg-accent-indigo/90 disabled:bg-bg-quaternary disabled:text-text-muted focus-ring"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Go'}
              </button>
            </div>
            </ModalPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
