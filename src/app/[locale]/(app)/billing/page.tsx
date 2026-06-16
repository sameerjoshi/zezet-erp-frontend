import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Topbar } from '@/components/Topbar';
import { BillingView } from '@/features/billing/BillingView';

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nav');
  return (
    <>
      <Topbar title={t('billing')} />
      <BillingView />
    </>
  );
}
