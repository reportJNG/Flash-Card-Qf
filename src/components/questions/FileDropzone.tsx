'use client';

import { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { parseTxtFile } from '@/lib/parsers/txtParser';
import { parseMdFile } from '@/lib/parsers/mdParser';
import { ParsedQAPair } from '@/types/app';
import toast from 'react-hot-toast';

interface FileDropzoneProps {
  onParse: (pairs: ParsedQAPair[]) => void;
}

export function FileDropzone({ onParse }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith('.md') && !fileName.endsWith('.txt')) {
      toast.error('Only .md and .txt files are supported');
      return;
    }

    const content = await file.text();
    let pairs: ParsedQAPair[];

    if (fileName.endsWith('.md')) {
      pairs = parseMdFile(content);
    } else {
      pairs = parseTxtFile(content);
    }

    if (pairs.length === 0) {
      toast.error('No valid Q&A pairs found in the file');
      return;
    }

    onParse(pairs);
    toast.success(`Found ${pairs.filter(p => p.valid).length} questions`);
  }, [onParse]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-all duration-200 ${
        isDragging
          ? 'border-accent-indigo bg-accent-indigo/5 scale-[1.01]'
          : 'border-border-subtle hover:border-text-muted'
      }`}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDragging ? 'text-accent-indigo' : 'text-text-muted'}`} />
      <p className="text-text-secondary mb-1">Drag & drop a .md or .txt file here</p>
      <p className="text-xs text-text-muted">or click to browse</p>
      <input
        id="file-input"
        type="file"
        accept=".md,.txt"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
