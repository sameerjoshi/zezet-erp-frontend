import { apiFetch } from './client';

export type PayrollStatus = 'draft' | 'approved' | 'paid' | 'void';

export interface WorkerStatement {
  workerId: string;
  workerName: string;
  driverPay: string;
  helperPay: string;
  totalPay: string;
  tripCount: number;
}
export interface PayrollRun {
  id: string;
  number: string;
  periodFrom: string;
  periodTo: string;
  status: PayrollStatus;
  total: string;
  workerCount: number;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface PayrollRunDetail extends PayrollRun {
  workers: WorkerStatement[];
}
export interface PayrollPreview {
  from: string;
  to: string;
  workers: WorkerStatement[];
  workerCount: number;
  total: string;
}

const qs = (o: Record<string, string | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => {
    if (v) p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const getPayrollPreview = (from: string, to: string) =>
  apiFetch<PayrollPreview>(`/payroll/preview${qs({ from, to })}`);
export const listRuns = (status?: PayrollStatus) =>
  apiFetch<PayrollRun[]>(`/payroll${qs({ status })}`);
export const getRun = (id: string) => apiFetch<PayrollRunDetail>(`/payroll/${id}`);
export const createRun = (body: { from: string; to: string; notes?: string }) =>
  apiFetch<PayrollRunDetail>('/payroll', { method: 'POST', body: JSON.stringify(body) });
export const updateRun = (id: string, body: { status?: PayrollStatus; notes?: string }) =>
  apiFetch<PayrollRunDetail>(`/payroll/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const deleteRun = (id: string) =>
  apiFetch<void>(`/payroll/${id}`, { method: 'DELETE' });
