import { apiFetch } from './client';

export type TruckStatus = 'none' | 'draft' | 'confirmed';

export interface TruckSummary {
  truckId: string;
  truckCode: string;
  status: TruckStatus;
  logId: string | null;
  tripCount: number;
}

export interface OpsSummary {
  date: string;
  trucks: TruckSummary[];
  counts: { trucks: number; none: number; draft: number; confirmed: number };
}

export function getSummary(date: string): Promise<OpsSummary> {
  return apiFetch<OpsSummary>(`/operations/summary?date=${encodeURIComponent(date)}`);
}
