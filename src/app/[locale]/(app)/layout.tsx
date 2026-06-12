import { setRequestLocale } from 'next-intl/server';
import { Sidebar } from '@/components/Sidebar';
import { AuthGate } from '@/components/AuthGate';

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGate>
      <div className="frame">
        <Sidebar />
        <div className="main">{children}</div>
      </div>
    </AuthGate>
  );
}
