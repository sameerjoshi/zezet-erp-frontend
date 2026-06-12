import { apiFetch } from './client';

// Money fields serialize as 2-dp strings and are absent (null) for ops roles.

// ---------- Trucks ----------
export interface Truck {
  id: string;
  code: string;
  plate: string | null;
  year: number | null;
  sizeFt: number | null;
  purchaseDate: string | null;
  purchasePrice: string | null; // financial
  odometerStart: number | null;
  status: 'active' | 'inactive';
}
export interface TruckInput {
  code: string;
  plate?: string;
  year?: number;
  sizeFt?: number;
  purchaseDate?: string;
  purchasePrice?: number;
  odometerStart?: number;
  status?: 'active' | 'inactive';
}

export const getTrucks = () => apiFetch<Truck[]>('/trucks?status=active');
export const listTrucks = (status?: 'active' | 'inactive') =>
  apiFetch<Truck[]>(`/trucks${status ? `?status=${status}` : ''}`);
export const createTruck = (body: TruckInput) =>
  apiFetch<Truck>('/trucks', { method: 'POST', body: JSON.stringify(body) });
export const updateTruck = (id: string, body: Partial<TruckInput>) =>
  apiFetch<Truck>(`/trucks/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const deactivateTruck = (id: string) =>
  apiFetch<Truck>(`/trucks/${id}/deactivate`, { method: 'PATCH' });

// ---------- Workers ----------
export interface Worker {
  id: string;
  fullName: string;
  type: 'employee' | 'contractor';
  canDrive: boolean;
  canHelp: boolean;
  status: 'active' | 'disabled';
  userId: string | null;
}
export interface WorkerInput {
  fullName: string;
  type: 'employee' | 'contractor';
  canDrive: boolean;
  canHelp: boolean;
  status?: 'active' | 'disabled';
}

export const getWorkers = () => apiFetch<Worker[]>('/workers?status=active');
export const listWorkers = (status?: 'active' | 'disabled') =>
  apiFetch<Worker[]>(`/workers${status ? `?status=${status}` : ''}`);
export const createWorker = (body: WorkerInput) =>
  apiFetch<Worker>('/workers', { method: 'POST', body: JSON.stringify(body) });
export const updateWorker = (id: string, body: Partial<WorkerInput>) =>
  apiFetch<Worker>(`/workers/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const deactivateWorker = (id: string) =>
  apiFetch<Worker>(`/workers/${id}/deactivate`, { method: 'PATCH' });

// ---------- Clients ----------
export interface Client {
  id: string;
  name: string;
  code: string | null;
  billingFrequency: string | null;
  status: 'active' | 'disabled';
}
export interface ClientInput {
  name: string;
  code?: string;
  billingFrequency?: string;
  status?: 'active' | 'disabled';
}

export const getClients = () => apiFetch<Client[]>('/clients?status=active');
export const listClients = (status?: 'active' | 'disabled') =>
  apiFetch<Client[]>(`/clients${status ? `?status=${status}` : ''}`);
export const createClient = (body: ClientInput) =>
  apiFetch<Client>('/clients', { method: 'POST', body: JSON.stringify(body) });
export const updateClient = (id: string, body: Partial<ClientInput>) =>
  apiFetch<Client>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const deactivateClient = (id: string) =>
  apiFetch<Client>(`/clients/${id}/deactivate`, { method: 'PATCH' });
