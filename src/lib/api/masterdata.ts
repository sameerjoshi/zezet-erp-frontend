import { apiFetch } from './client';

export interface Truck {
  id: string;
  code: string;
  plate: string | null;
  status: string;
}
export interface Worker {
  id: string;
  fullName: string;
  type: 'employee' | 'contractor';
  canDrive: boolean;
  canHelp: boolean;
  status: string;
}
export interface Client {
  id: string;
  name: string;
  code: string | null;
  status: string;
}

export const getTrucks = () => apiFetch<Truck[]>('/trucks?status=active');
export const getWorkers = () => apiFetch<Worker[]>('/workers?status=active');
export const getClients = () => apiFetch<Client[]>('/clients?status=active');
