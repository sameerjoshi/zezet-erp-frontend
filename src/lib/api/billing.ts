import { apiFetch } from './client';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void';

export interface InvoiceLine {
  id: string;
  tripId: string;
  date: string;
  truckCode: string;
  routeLabel: string | null;
  billAmount: string;
}
export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  periodFrom: string;
  periodTo: string;
  status: InvoiceStatus;
  issueDate: string;
  total: string;
  amountPaid: string;
  paidAt: string | null;
  notes: string | null;
  lineCount: number;
  createdAt: string;
  updatedAt: string;
}
export interface InvoiceDetail extends Invoice {
  lines: InvoiceLine[];
}
export interface BillableTrip {
  tripId: string;
  date: string;
  truckCode: string;
  routeLabel: string | null;
  billAmount: string;
}
export interface BillablePreview {
  clientId: string;
  from: string;
  to: string;
  trips: BillableTrip[];
  tripCount: number;
  total: string;
}
export interface AgingClient {
  clientId: string;
  clientName: string;
  current: string;
  d30: string;
  d60: string;
  d90: string;
  total: string;
}
export interface Aging {
  clients: AgingClient[];
  grandTotal: string;
}

const qs = (o: Record<string, string | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => {
    if (v) p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const getBillable = (clientId: string, from: string, to: string) =>
  apiFetch<BillablePreview>(`/invoices/billable${qs({ clientId, from, to })}`);
export const listInvoices = (f?: { status?: InvoiceStatus; clientId?: string }) =>
  apiFetch<Invoice[]>(`/invoices${qs({ status: f?.status, clientId: f?.clientId })}`);
export const getInvoice = (id: string) => apiFetch<InvoiceDetail>(`/invoices/${id}`);
export const createInvoice = (body: { clientId: string; from: string; to: string; notes?: string }) =>
  apiFetch<InvoiceDetail>('/invoices', { method: 'POST', body: JSON.stringify(body) });
export const updateInvoice = (id: string, body: { status?: InvoiceStatus; notes?: string }) =>
  apiFetch<InvoiceDetail>(`/invoices/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const deleteInvoice = (id: string) =>
  apiFetch<void>(`/invoices/${id}`, { method: 'DELETE' });
export const getAging = () => apiFetch<Aging>('/invoices/aging');
