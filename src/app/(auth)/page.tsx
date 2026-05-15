import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';

const LoginPage = dynamicImport(() => import('@/components/auth/LoginPage'), { ssr: false });

export default function AuthPage() {
  return <LoginPage />;
}
