import { apiFetch } from './client';

export interface Range {
  from?: string;
  to?: string;
}
const qs = (r: Range) => {
  const p = new URLSearchParams();
  if (r.from) p.set('from', r.from);
  if (r.to) p.set('to', r.to);
  const s = p.toString();
  return s ? `?${s}` : '';
};

export interface TripsReport {
  from: string;
  to: string;
  totalTrips: number;
  perDay: { date: string; tripCount: number }[];
  perTruck: { truckId: string; truckCode: string; tripCount: number }[];
}
export interface UtilizationReport {
  from: string;
  to: string;
  perDay: { date: string; activeTrucks: number; trucksWithTrips: number; utilization: number }[];
}
export interface WorkerPayReport {
  from: string;
  to: string;
  workers: { workerId: string; workerName: string; driverPay: string; helperPay: string; totalPay: string }[];
}
export interface ClientBillablesReport {
  from: string;
  to: string;
  clients: { clientId: string; clientName: string; tripCount: number; billAmount: string }[];
}
export interface OperationalBucket {
  operating: number;
  noClients: number;
  broken: number;
  recorded: number;
  operatingPct: number; // 0..1
}
export interface OperationalReport {
  from: string;
  to: string;
  totals: OperationalBucket;
  perDay: (OperationalBucket & { date: string })[];
}

export const getTripsReport = (r: Range) => apiFetch<TripsReport>(`/reports/trips${qs(r)}`);
export const getUtilization = (r: Range) => apiFetch<UtilizationReport>(`/reports/utilization${qs(r)}`);
export const getWorkerPay = (r: Range) => apiFetch<WorkerPayReport>(`/reports/worker-pay${qs(r)}`);
export const getClientBillables = (r: Range) =>
  apiFetch<ClientBillablesReport>(`/reports/client-billables${qs(r)}`);
export const getOperational = (r: Range) =>
  apiFetch<OperationalReport>(`/reports/operational${qs(r)}`);
