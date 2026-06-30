import { brand } from '../config/brand';
import type { Customer, Preauth, Vehicle } from '../state/types';
import { addDays, formatCurrency, formatDateTime } from '../utils/format';
import { StatusBadge } from './Badge';

type Props = {
  preauth: Preauth;
  customer?: Customer;
  vehicle?: Vehicle;
  variant?: 'full' | 'summary';
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}

/** Tarjeta de detalle de una preauth. Reutilizada en drawer, modal y confirmación POS. */
export function PreauthCard({ preauth, customer, vehicle, variant = 'full' }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <StatusBadge status={preauth.status} />
        <span className="font-mono text-xs font-semibold text-slate-400">{preauth.id}</span>
      </div>

      <div className="border-b border-slate-100 pb-3">
        <p className="font-display text-base font-bold text-slate-900">{customer?.fullName ?? '—'}</p>
        <p className="text-sm text-muted">
          {customer?.documentId}
          {customer?.tokenizedCard && (
            <span className="ml-2 rounded bg-ini-light px-1.5 py-0.5 text-[11px] font-semibold text-ini-dark">
              tarjeta en archivo
            </span>
          )}
        </p>
      </div>

      <div className="space-y-0.5 pt-2">
        <Row label={brand.vehicleLabel} value={vehicle ? `${vehicle.model}` : '—'} />
        {vehicle && <Row label="Patente" value={vehicle.plate} />}
        <Row label="Sucursal" value={vehicle?.branch ?? '—'} />
        {preauth.metadata && <Row label={brand.reservationLabel} value={preauth.metadata.reservationCode} />}
        {preauth.metadata && <Row label="Días de alquiler" value={preauth.metadata.rentalDays} />}

        {variant === 'full' && (
          <>
            <div className="my-2 border-t border-slate-100" />
            <Row
              label="Monto preautorizado"
              value={
                <span className="font-display text-lg font-bold text-slate-900">
                  {formatCurrency(preauth.amount, preauth.country)}
                </span>
              }
            />
            {typeof preauth.finalAmount === 'number' && preauth.finalAmount !== preauth.amount && (
              <Row
                label="Monto cobrado"
                value={
                  <span
                    className={`font-display text-lg font-bold ${
                      preauth.finalAmount > preauth.amount ? 'text-warn' : 'text-success'
                    }`}
                  >
                    {formatCurrency(preauth.finalAmount, preauth.country)}
                  </span>
                }
              />
            )}
            <Row label="Preautorización" value={formatDateTime(preauth.createdAt, preauth.country)} />
            {preauth.metadata && (
              <Row
                label="Cierre"
                value={formatDateTime(
                  addDays(preauth.createdAt, preauth.metadata.rentalDays),
                  preauth.country,
                )}
              />
            )}
            {preauth.resolvedAt && (
              <Row label="Resuelta" value={formatDateTime(preauth.resolvedAt, preauth.country)} />
            )}
          </>
        )}

        {variant === 'summary' && (
          <Row label="Preauth original" value={formatDateTime(preauth.createdAt, preauth.country)} />
        )}
      </div>
    </div>
  );
}
