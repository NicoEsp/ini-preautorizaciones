import type { Country, Preauth } from '../state/types';
import { countryMeta } from '../config/brand';

/** $ 520.000 (ARS) / $ 380.000 (CLP) — sin decimales. */
export function formatCurrency(amount: number, country: Country): string {
  const m = countryMeta[country];
  return new Intl.NumberFormat(m.locale, {
    style: 'currency',
    currency: m.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Número con separadores de miles del locale del país (sin símbolo de moneda). */
export function formatNumber(n: number, country: Country): string {
  return new Intl.NumberFormat(countryMeta[country].locale).format(n);
}

/** Antigüedad relativa: "hace instantes", "hace 5 min", "hace 2h", "hace 3d". */
export function formatAge(iso: string, now: number): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'hace instantes';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

/** Fecha + hora completas en el locale del país. */
export function formatDateTime(iso: string, country: Country): string {
  return new Intl.DateTimeFormat(countryMeta[country].locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** Solo hora:minuto (para la card "Última operación" del POS). */
export function formatTime(iso: string, country: Country): string {
  return new Intl.DateTimeFormat(countryMeta[country].locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** ¿La devolución ya venció? (createdAt + rentalDays < ahora) y sigue activa. */
export function isReturnOverdue(preauth: Preauth, now: number): boolean {
  if (preauth.status !== 'active' || !preauth.metadata) return false;
  const dueAt = new Date(preauth.createdAt).getTime() + preauth.metadata.rentalDays * 86_400_000;
  return dueAt < now;
}
