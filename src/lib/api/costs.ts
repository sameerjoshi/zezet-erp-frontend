import { apiFetch } from './client';

export type CostCategory = 'maintenance' | 'toll' | 'insurance' | 'tax' | 'repair' | 'other';

export interface TruckCost {
  id: string;
  truckId: string;
  truckCode: string;
  date: string;
  category: CostCategory;
  amount: string;
  note: string | null;
  createdAt: string;
}

const qs = (o: Record<string, string | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => {
    if (v) p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const listCosts = (f?: { truckId?: string; from?: string; to?: string }) =>
  apiFetch<TruckCost[]>(`/truck-costs${qs({ truckId: f?.truckId, from: f?.from, to: f?.to })}`);
export const createCost = (body: {
  truckId: string;
  date: string;
  category: CostCategory;
  amount: number;
  note?: string;
}) => apiFetch<TruckCost>('/truck-costs', { method: 'POST', body: JSON.stringify(body) });
export const deleteCost = (id: string) =>
  apiFetch<void>(`/truck-costs/${id}`, { method: 'DELETE' });
