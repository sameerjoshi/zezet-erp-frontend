import { setRequestLocale } from 'next-intl/server';
import { Topbar } from '@/components/Topbar';
import { TripEntryView } from '@/features/trip-entry/TripEntryView';

export default async function TripEntryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Topbar title="Enter trips" />
      <TripEntryView />
    </>
  );
}
