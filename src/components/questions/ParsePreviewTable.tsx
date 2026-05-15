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
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{invalidCount} blocks were skipped due to parse errors</span>
        </div>
      )}

      <div className="text-sm text-text-secondary">
        {validPairs.length} valid question{validPairs.length !== 1 ? 's' : ''} ready to import
      </div>

      <div className="bg-bg-tertiary rounded-xl overflow-hidden max-h-[400px] overflow-y-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="bg-bg-quaternary text-left">
              <th className="px-3 py-2 text-xs text-text-muted font-medium w-10">#</th>
              <th className="px-3 py-2 text-xs text-text-muted font-medium">Question</th>
              <th className="px-3 py-2 text-xs text-text-muted font-medium">Answer</th>
              <th className="px-3 py-2 text-xs text-text-muted font-medium w-20"></th>
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
                      className="w-full bg-transparent text-sm text-text-primary focus:outline-none border-b border-transparent focus:border-accent-indigo/50 pb-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={pair.answer}
                      onChange={e => updatePair(i, 'answer', e.target.value)}
                      className="w-full bg-transparent text-sm text-text-secondary focus:outline-none border-b border-transparent focus:border-accent-indigo/50 pb-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => movePair(i, 'up')} className="p-1 hover:bg-white/10 rounded text-text-muted hover:text-text-primary">
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => movePair(i, 'down')} className="p-1 hover:bg-white/10 rounded text-text-muted hover:text-text-primary">
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button onClick={() => deletePair(i)} className="p-1 hover:bg-red-500/10 rounded text-text-muted hover:text-accent-red">
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

      <div className="flex gap-3">
        <button
          onClick={handleImport}
          disabled={isImporting || validPairs.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent-indigo hover:bg-indigo-600 disabled:bg-bg-quaternary disabled:text-text-muted text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Upload className="w-4 h-4" />
          {isImporting ? 'Importing...' : `Import ${validPairs.length} Questions`}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
