'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Delete } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  profileName: string;
  profileColor: string;
  error?: string;
}

export function PinModal({ isOpen, onClose, onSubmit, profileName, profileColor, error }: PinModalProps) {
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
    if (isLocked) return;
    if (key === 'backspace') {
      setPin(prev => prev.slice(0, -1));
    } else if (key === 'enter') {
      if (pin.length === 4) {
        onSubmit(pin);
      }
    } else if (pin.length < 4 && /^\d$/.test(key)) {
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => onSubmit(newPin), 100);
      }
    }
  }, [pin, isLocked, onSubmit]);

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : { scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-bg-secondary rounded-xl p-6 max-w-sm w-full mx-4 shadow-elevated border border-border-subtle"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
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
                  disabled={isLocked}
                  className="h-14 bg-bg-quaternary hover:bg-bg-quaternary/80 rounded-lg text-lg font-medium text-text-primary transition-colors disabled:opacity-50"
                >
                  {key}
                </button>
              ))}
              <button
                onClick={() => handleKeyPress('backspace')}
                disabled={isLocked}
                className="h-14 bg-bg-quaternary hover:bg-bg-quaternary/80 rounded-lg flex items-center justify-center text-text-primary transition-colors disabled:opacity-50"
              >
                <Delete className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleKeyPress('0')}
                disabled={isLocked}
                className="h-14 bg-bg-quaternary hover:bg-bg-quaternary/80 rounded-lg text-lg font-medium text-text-primary transition-colors disabled:opacity-50"
              >
                0
              </button>
              <button
                onClick={() => handleKeyPress('enter')}
                disabled={isLocked || pin.length !== 4}
                className="h-14 bg-accent-indigo hover:bg-indigo-600 disabled:bg-bg-quaternary rounded-lg text-lg font-medium text-white transition-colors disabled:text-text-muted"
              >
                Go
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
