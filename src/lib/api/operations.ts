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

// --- Daily logs & trips ---

export interface Trip {
  id: string;
  dailyLogId: string;
  seq: number;
  clientId: string;
  routeLabel: string | null;
  billAmount: string; // 2-dp string; absent for ops roles
  driverWorkerId: string;
  helperWorkerId: string | null;
  driverPay: string;
  helperPay: string;
}

export interface DailyLogDetail {
  id: string;
  date: string;
  truckId: string;
  fuelCost: string | null;
  odometerStart: number | null;
  odometerEnd: number | null;
  notes: string | null;
  status: 'draft' | 'confirmed';
  trips: Trip[];
  tripCount: number;
  totals?: { billAmount: string; driverPay: string; helperPay: string };
  warnings?: string[];
}

interface DailyLog {
  id: string;
}

// get-or-create the log for (date, truck), then load its detail with trips
export async function ensureDailyLog(date: string, truckId: string): Promise<DailyLogDetail> {
  const log = await apiFetch<DailyLog>('/daily-logs', {
    method: 'POST',
    body: JSON.stringify({ date, truckId }),
  });
  return getDailyLog(log.id);
}

export const getDailyLog = (id: string) => apiFetch<DailyLogDetail>(`/daily-logs/${id}`);

export const updateDailyLog = (
  id: string,
  body: { fuelCost?: number; odometerStart?: number; odometerEnd?: number; notes?: string },
) => apiFetch<DailyLogDetail>(`/daily-logs/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

export const confirmDailyLog = (id: string) =>
  apiFetch<DailyLogDetail>(`/daily-logs/${id}/confirm`, { method: 'PATCH' });

export interface CreateTripInput {
  clientId: string;
  routeLabel?: string;
  driverWorkerId: string;
  helperWorkerId?: string;
  billAmount?: number;
  driverPay?: number;
  helperPay?: number;
  rateId?: string;
}

export const createTrip = (logId: string, body: CreateTripInput) =>
  apiFetch<Trip>(`/daily-logs/${logId}/trips`, { method: 'POST', body: JSON.stringify(body) });

export const deleteTrip = (tripId: string) =>
  apiFetch<void>(`/trips/${tripId}`, { method: 'DELETE' });

// --- Rate lookup (prepopulation) ---

export interface RateLookup {
  found: boolean;
  rate: {
    id: string;
    label: string | null;
    clientPrice?: string;
    driverPay?: string;
    helperPay?: string;
  } | null;
}

export function lookupRate(clientId: string, label?: string): Promise<RateLookup> {
  const q = new URLSearchParams({ clientId });
  if (label) q.set('label', label);
  return apiFetch<RateLookup>(`/rates/lookup?${q.toString()}`);
}
