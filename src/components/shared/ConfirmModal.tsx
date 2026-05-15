'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  danger?: boolean;
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, description, confirmText = 'Confirm', danger = true }: ConfirmModalProps) {
  const [input, setInput] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleConfirm = () => {
    if (input !== 'DELETE') {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }
    onConfirm();
    setInput('');
  };

  const handleClose = () => {
    setInput('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : { scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-lg border border-border-subtle bg-bg-secondary p-5 shadow-elevated sm:p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-8 h-8 ${danger ? 'text-accent-red' : 'text-accent-orange'}`} />
                <h2 className={`text-xl font-semibold ${danger ? 'text-accent-red' : 'text-text-primary'}`}>{title}</h2>
              </div>
              <button onClick={handleClose} className="text-text-muted hover:text-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-text-secondary mb-4">{description}</p>

            <div className="mb-4">
              <label className="block text-sm text-text-muted mb-2">
                Type <span className="font-mono text-text-primary">DELETE</span> to confirm
              </label>
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="DELETE"
                className="bg-bg-quaternary border-border-subtle text-text-primary"
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleClose} className="border-border-subtle text-text-secondary hover:text-text-primary">
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={input !== 'DELETE'}
                className={danger ? 'bg-accent-red hover:bg-red-600 text-white' : 'bg-accent-indigo hover:bg-indigo-600 text-white'}
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
