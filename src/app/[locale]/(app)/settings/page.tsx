import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Topbar } from '@/components/Topbar';
import { UsersView } from '@/features/users/UsersView';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('users');

  return (
    <>
      <Topbar title={t('title')} />
      <UsersView />
    </>
  );
}
