import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageContainer({
  children,
  size = 'wide',
  flush = false,
  className,
}: {
  children: React.ReactNode;
  size?: 'narrow' | 'default' | 'wide' | 'full';
  flush?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full animate-fade-up',
        size === 'narrow' && 'max-w-2xl',
        size === 'default' && 'max-w-5xl',
        size === 'wide' && 'max-w-6xl',
        size === 'full' && 'max-w-none',
        flush ? 'px-0 py-0' : 'px-3 py-4 sm:px-4 md:px-6 md:py-6 lg:px-8 lg:py-8',
        className
      )}
    >
      {children}
    </div>
  );
}

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
          <h1 className="break-words text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">{title}</h1>
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

export const Panel = SectionPanel;

export function Toolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      {children}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: Array<{ value: T; label: string; icon?: LucideIcon }>;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-1 rounded-lg border border-border-subtle bg-bg-tertiary p-1 sm:inline-grid', className)}>
      {options.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-all focus-ring',
              active ? 'bg-bg-quaternary text-text-primary shadow-card' : 'text-text-muted hover:bg-white/5 hover:text-text-primary'
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
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
    <div className="panel min-w-0 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</span>
        <Icon className={cn('h-4 w-4', tone)} />
      </div>
      <div className="font-mono text-2xl font-semibold tabular-nums text-text-primary break-words">{value}</div>
    </div>
  );
}

export const MetricCard = StatCard;

export function IconButton({
  icon: Icon,
  label,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary focus-ring disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function MobileCardList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('space-y-3 md:hidden', className)}>{children}</div>;
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-text-muted">
      <div className="h-8 w-8 rounded-full border-2 border-accent-indigo border-t-transparent animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
