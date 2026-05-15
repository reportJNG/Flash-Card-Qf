import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  icon: Icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-bg-tertiary text-accent-indigo shadow-card">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SectionPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn('panel', className)}>{children}</section>;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'text-accent-indigo',
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="panel p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</span>
        <Icon className={cn('h-4 w-4', tone)} />
      </div>
      <div className="font-mono text-2xl font-semibold tabular-nums text-text-primary">{value}</div>
    </div>
  );
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-text-muted">
      <div className="h-8 w-8 rounded-full border-2 border-accent-indigo border-t-transparent animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
