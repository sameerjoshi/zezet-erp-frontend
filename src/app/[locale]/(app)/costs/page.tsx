import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Topbar } from '@/components/Topbar';
import { CostsView } from '@/features/costs/CostsView';

export default async function CostsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nav');
  return (
    <>
      <Topbar title={t('costs')} />
      <CostsView />
    </>
  );
}
