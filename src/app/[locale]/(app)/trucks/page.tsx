import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Topbar } from '@/components/Topbar';
import { TrucksView } from '@/features/trucks/TrucksView';

export default async function TrucksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('trucks');

  return (
    <>
      <Topbar title={t('title')} />
      <TrucksView />
    </>
  );
}
