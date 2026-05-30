'use client';

import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle bg-bg-tertiary/50 px-4 py-14 text-center shadow-card">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-border-subtle bg-bg-quaternary">
        <Icon className="h-8 w-8 text-text-muted" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-text-primary">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-sm text-text-secondary">{description}</p>}
      {action}
    </div>
  );
}
