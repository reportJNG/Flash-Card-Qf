import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/utils/session';
import { Sidebar } from '@/components/nav/Sidebar';
import { BottomTabBar } from '@/components/nav/BottomTabBar';
import { PageContainer } from '@/components/shared/AppShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get('flashqf_session')?.value;

  if (!token) {
    redirect('/');
  }

  const session = await verifySession(token);
  if (!session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <Sidebar profile={{ display_name: session.display_name, avatar_color: session.avatar_color }} />
      <main className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] transition-[margin] duration-200 md:ml-[var(--flashqf-sidebar-width,240px)] md:pb-0">
        <PageContainer>
          {children}
        </PageContainer>
      </main>
      <BottomTabBar />
    </div>
  );
}
