import { brand } from '../config/brand';
import type { AdditionalCharge, Country, Preauth } from '../state/types';
import { addDays } from './format';

// Deriva las acreditaciones (settlement) a partir de los cobros confirmados:
// preauths confirmadas (finalAmount) + cobros adicionales pagados. Cada cobro
// acredita a los `settlementDays` días, menos la comisión `feeRate`.

export type SettlementItem = {
  id: string;
  customerId: string;
  label: string; // origen, ej. "PA-AR-001230" o "Cobro: Multa…"
  gross: number;
  fee: number;
  net: number;
  creditDate: string; // ISO
};

export type SettlementBatch = {
  dateKey: string; // YYYY-MM-DD
  creditDate: string;
  items: SettlementItem[];
  gross: number;
  fee: number;
  net: number;
};

const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);

export function buildSettlement(
  preauths: Preauth[],
  charges: AdditionalCharge[],
  country: Country,
): SettlementBatch[] {
  const items: SettlementItem[] = [];

  for (const p of preauths) {
    if (p.country !== country || p.status !== 'confirmed' || !p.resolvedAt) continue;
    const gross = p.finalAmount ?? p.amount;
    const fee = Math.round(gross * brand.feeRate);
    items.push({
      id: p.id,
      customerId: p.customerId,
      label: p.id,
      gross,
      fee,
      net: gross - fee,
      creditDate: addDays(p.resolvedAt, brand.settlementDays),
    });
  }

  for (const c of charges) {
    if (c.country !== country || c.status !== 'paid' || !c.paidAt) continue;
    const gross = c.amount;
    const fee = Math.round(gross * brand.feeRate);
    items.push({
      id: c.id,
      customerId: c.customerId,
      label: `Cobro: ${c.concept}`,
      gross,
      fee,
      net: gross - fee,
      creditDate: addDays(c.paidAt, brand.settlementDays),
    });
  }

  const map = new Map<string, SettlementBatch>();
  for (const it of items) {
    const k = dayKey(it.creditDate);
    let b = map.get(k);
    if (!b) {
      b = { dateKey: k, creditDate: it.creditDate, items: [], gross: 0, fee: 0, net: 0 };
      map.set(k, b);
    }
    b.items.push(it);
    b.gross += it.gross;
    b.fee += it.fee;
    b.net += it.net;
  }

  return [...map.values()];
}
