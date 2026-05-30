'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, AlertTriangle, ArrowUp, ArrowDown, Upload } from 'lucide-react';
import { ParsedQAPair } from '@/types/app';

interface ParsePreviewTableProps {
  pairs: ParsedQAPair[];
  onPairsChange: (pairs: ParsedQAPair[]) => void;
  onImport: (pairs: ParsedQAPair[]) => void;
  onCancel: () => void;
}

export function ParsePreviewTable({ pairs, onPairsChange, onImport, onCancel }: ParsePreviewTableProps) {
  const [isImporting, setIsImporting] = useState(false);
  const validPairs = pairs.filter(p => p.valid);
  const invalidCount = pairs.filter(p => !p.valid).length;

  const updatePair = (index: number, field: 'question' | 'answer', value: string) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [field]: value };
    onPairsChange(newPairs);
  };

  const deletePair = (index: number) => {
    onPairsChange(pairs.filter((_, i) => i !== index));
  };

  const movePair = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === pairs.length - 1) return;
    const newPairs = [...pairs];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    [newPairs[index], newPairs[swapIdx]] = [newPairs[swapIdx], newPairs[index]];
    onPairsChange(newPairs);
  };

  const handleImport = async () => {
    setIsImporting(true);
    await onImport(validPairs);
    setIsImporting(false);
  };

  return (
    <div className="space-y-4">
      {invalidCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{invalidCount} blocks were skipped due to parse errors</span>
        </div>
      )}

      <div className="text-sm text-text-secondary">
        {validPairs.length} valid question{validPairs.length !== 1 ? 's' : ''} ready to import
      </div>

      <div className="space-y-3 md:hidden">
        {pairs.map((pair, i) => (
          pair.valid && (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="rounded-lg border border-border-subtle bg-bg-tertiary p-3"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-text-muted">#{i + 1}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => movePair(i, 'up')} className="rounded p-1 text-text-muted hover:bg-white/10 hover:text-text-primary focus-ring" aria-label="Move up">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => movePair(i, 'down')} className="rounded p-1 text-text-muted hover:bg-white/10 hover:text-text-primary focus-ring" aria-label="Move down">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deletePair(i)} className="rounded p-1 text-text-muted hover:bg-red-500/10 hover:text-accent-red focus-ring" aria-label="Delete row">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <label className="mb-2 block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-muted">Question</span>
                <textarea
                  value={pair.question}
                  onChange={e => updatePair(i, 'question', e.target.value)}
                  className="field min-h-20 resize-y"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-muted">Answer</span>
                <textarea
                  value={pair.answer}
                  onChange={e => updatePair(i, 'answer', e.target.value)}
                  className="field min-h-20 resize-y text-text-secondary"
                />
              </label>
            </motion.div>
          )
        ))}
      </div>

      <div className="hidden max-h-[400px] overflow-auto rounded-lg border border-border-subtle bg-bg-tertiary app-scrollbar md:block">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="bg-bg-quaternary text-left">
              <th className="w-10 px-3 py-2 text-xs font-medium text-text-muted">#</th>
              <th className="px-3 py-2 text-xs font-medium text-text-muted">Question</th>
              <th className="px-3 py-2 text-xs font-medium text-text-muted">Answer</th>
              <th className="w-20 px-3 py-2 text-xs font-medium text-text-muted"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {pairs.map((pair, i) => (
              pair.valid && (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <td className="px-3 py-2 text-xs text-text-muted">{i + 1}</td>
                  <td className="px-3 py-2">
                    <input
                      value={pair.question}
                      onChange={e => updatePair(i, 'question', e.target.value)}
                      className="w-full border-b border-transparent bg-transparent pb-1 text-sm text-text-primary focus:border-accent-indigo/50 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={pair.answer}
                      onChange={e => updatePair(i, 'answer', e.target.value)}
                      className="w-full border-b border-transparent bg-transparent pb-1 text-sm text-text-secondary focus:border-accent-indigo/50 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => movePair(i, 'up')} className="rounded p-1 text-text-muted hover:bg-white/10 hover:text-text-primary focus-ring" aria-label="Move up">
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => movePair(i, 'down')} className="rounded p-1 text-text-muted hover:bg-white/10 hover:text-text-primary focus-ring" aria-label="Move down">
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button onClick={() => deletePair(i)} className="rounded p-1 text-text-muted hover:bg-red-500/10 hover:text-accent-red focus-ring" aria-label="Delete row">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleImport}
          disabled={isImporting || validPairs.length === 0}
          className="flex items-center justify-center gap-2 rounded-lg bg-accent-indigo px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-indigo/90 disabled:bg-bg-quaternary disabled:text-text-muted focus-ring"
        >
          <Upload className="w-4 h-4" />
          {isImporting ? 'Importing...' : `Import ${validPairs.length} Questions`}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg px-6 py-2.5 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary focus-ring"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
