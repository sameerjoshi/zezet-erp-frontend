import { setRequestLocale } from 'next-intl/server';
import { Topbar } from '@/components/Topbar';
import { DashboardView } from '@/features/dashboard/DashboardView';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Topbar title="Dashboard" />
      <DashboardView />
    </>
  );
}
