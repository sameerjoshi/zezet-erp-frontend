import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Topbar } from '@/components/Topbar';
import { PeopleView } from '@/features/people/PeopleView';

export default async function PeoplePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('people');

  return (
    <>
      <Topbar title={t('title')} />
      <PeopleView />
    </>
  );
}
