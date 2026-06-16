import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Topbar } from '@/components/Topbar';
import { PayrollView } from '@/features/payroll/PayrollView';

export default async function PayrollPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nav');
  return (
    <>
      <Topbar title={t('payroll')} />
      <PayrollView />
    </>
  );
}
