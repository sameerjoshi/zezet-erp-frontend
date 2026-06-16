import { apiFetch } from './client';

export type AccountKind = 'bank' | 'cash';
export type TxDirection = 'inflow' | 'outflow';
export type TxCategory =
  | 'client_payment'
  | 'investment'
  | 'loan'
  | 'fuel'
  | 'salary'
  | 'maintenance'
  | 'toll'
  | 'insurance'
  | 'tax'
  | 'general'
  | 'transfer'
  | 'other';

export type TxSource = 'manual' | 'invoice' | 'payroll' | 'cost';

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  openingBalance: string;
  balance: string;
  isDefault: boolean;
  status: 'active' | 'disabled' | 'inactive';
  createdAt: string;
}
export interface Transaction {
  id: string;
  accountId: string;
  accountName: string;
  date: string;
  direction: TxDirection;
  amount: string;
  category: TxCategory;
  description: string;
  truckId: string | null;
  truckCode: string | null;
  note: string | null;
  sourceType: TxSource;
  createdAt: string;
}
export interface CashPosition {
  accounts: { accountId: string; name: string; balance: string }[];
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

export const listAccounts = () => apiFetch<Account[]>('/treasury/accounts');
export const createAccount = (body: { name: string; kind?: AccountKind; openingBalance?: number }) =>
  apiFetch<Account>('/treasury/accounts', { method: 'POST', body: JSON.stringify(body) });
export const updateAccount = (id: string, body: { isDefault?: boolean; name?: string; status?: string }) =>
  apiFetch<Account>(`/treasury/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const deleteAccount = (id: string) =>
  apiFetch<void>(`/treasury/accounts/${id}`, { method: 'DELETE' });
export const getCashPosition = () => apiFetch<CashPosition>('/treasury/cash-position');

export const listTransactions = (f?: { accountId?: string; category?: TxCategory; from?: string; to?: string }) =>
  apiFetch<Transaction[]>(`/treasury/transactions${qs({ accountId: f?.accountId, category: f?.category, from: f?.from, to: f?.to })}`);
export const createTransaction = (body: {
  accountId: string;
  date: string;
  direction: TxDirection;
  amount: number;
  category: TxCategory;
  description: string;
  truckId?: string;
  note?: string;
}) => apiFetch<Transaction>('/treasury/transactions', { method: 'POST', body: JSON.stringify(body) });
export const deleteTransaction = (id: string) =>
  apiFetch<void>(`/treasury/transactions/${id}`, { method: 'DELETE' });
