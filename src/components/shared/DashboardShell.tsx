'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/nav/Sidebar';
import { BottomTabBar } from '@/components/nav/BottomTabBar';
import { PageContainer } from '@/components/shared/AppShell';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: React.ReactNode;
  profile: { display_name: string; avatar_color: string };
}

export function DashboardShell({ children, profile }: DashboardShellProps) {
  const pathname = usePathname();
  const isActivePlaySession = /^\/play\/session\/[^/]+$/.test(pathname);

  return (
    <div className="min-h-screen bg-bg-secondary">
      {!isActivePlaySession && <Sidebar profile={profile} />}
      <main
        className={cn(
          'min-h-screen transition-[margin] duration-200',
          isActivePlaySession
            ? 'pb-0'
            : 'pb-[calc(5rem+env(safe-area-inset-bottom))] md:ml-[var(--flashqf-sidebar-width,240px)] md:pb-0'
        )}
      >
        <PageContainer size={isActivePlaySession ? 'full' : 'wide'} flush={isActivePlaySession}>
          {children}
        </PageContainer>
      </main>
      {!isActivePlaySession && <BottomTabBar />}
    </div>
  );
}
