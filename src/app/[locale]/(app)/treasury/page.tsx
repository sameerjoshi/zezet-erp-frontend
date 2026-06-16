import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Topbar } from '@/components/Topbar';
import { TreasuryView } from '@/features/treasury/TreasuryView';

export default async function TreasuryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nav');
  return (
    <>
      <Topbar title={t('treasury')} />
      <TreasuryView />
    </>
  );
}
