import { apiFetch } from './client';

// Rate cards group a client's rates; rates carry money (2-dp strings, stripped for ops).

export interface RateCard {
  id: string;
  clientId: string;
  name: string;
  status: 'active' | 'disabled';
  createdAt: string;
}
export interface Rate {
  id: string;
  rateCardId: string;
  label: string | null;
  clientPrice: string | null; // financial
  driverPay: string | null; // financial
  helperPay: string | null; // financial
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface RateCardInput {
  name: string;
  status?: 'active' | 'disabled';
}
export interface RateInput {
  label?: string;
  clientPrice: number;
  driverPay: number;
  helperPay: number;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export const getRateCards = (clientId: string) =>
  apiFetch<RateCard[]>(`/clients/${clientId}/rate-cards`);
export const createRateCard = (clientId: string, body: RateCardInput) =>
  apiFetch<RateCard>(`/clients/${clientId}/rate-cards`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const getRates = (cardId: string) => apiFetch<Rate[]>(`/rate-cards/${cardId}/rates`);
export const createRate = (cardId: string, body: RateInput) =>
  apiFetch<Rate>(`/rate-cards/${cardId}/rates`, { method: 'POST', body: JSON.stringify(body) });
export const closeRate = (rateId: string) =>
  apiFetch<Rate>(`/rates/${rateId}/close`, { method: 'PATCH' });
