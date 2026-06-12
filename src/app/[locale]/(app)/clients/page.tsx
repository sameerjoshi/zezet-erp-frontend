import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Topbar } from '@/components/Topbar';
import { ClientsView } from '@/features/clients/ClientsView';

export default async function ClientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('clients');

  return (
    <>
      <Topbar title={t('title')} />
      <ClientsView />
    </>
  );
}
