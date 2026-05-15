import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/utils/session';
import { Sidebar } from '@/components/nav/Sidebar';
import { BottomTabBar } from '@/components/nav/BottomTabBar';

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
      <main className="md:ml-[240px] min-h-screen pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}
