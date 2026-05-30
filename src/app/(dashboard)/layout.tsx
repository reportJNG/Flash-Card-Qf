import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/utils/session';
import { DashboardShell } from '@/components/shared/DashboardShell';

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
    <DashboardShell profile={{ display_name: session.display_name, avatar_color: session.avatar_color }}>
      {children}
    </DashboardShell>
  );
}
