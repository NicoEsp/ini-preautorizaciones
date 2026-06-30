import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { formatCurrency, formatDayMonth, daysUntil } from '../utils/format';
import { buildSettlement, type SettlementBatch } from '../utils/settlement';
import { useNow } from '../utils/hooks';
import { CheckCircleIcon, XIcon } from './icons';

const SECTION = 'text-xs font-semibold uppercase tracking-wide text-muted';

export function Acreditaciones() {
  const now = useNow(30_000);
  const country = useStore((s) => s.country);
  const preauths = useStore((s) => s.preauths);
  const charges = useStore((s) => s.charges);
  const customers = useStore((s) => s.customers);
  const [detail, setDetail] = useState<SettlementBatch | null>(null);

  // Cerrar el modal de detalle con Escape.
  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetail(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail]);

  const customersById = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c] as const)),
    [customers],
  );

  const batches = useMemo(
    () => buildSettlement(preauths, charges, country),
    [preauths, charges, country],
  );

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  const thirtyAgo = todayMs - 30 * 86_400_000;

  const pending = batches
    .filter((b) => new Date(b.creditDate).getTime() >= todayMs)
    .sort((a, b) => a.creditDate.localeCompare(b.creditDate));
  const credited = batches
    .filter((b) => {
      const t = new Date(b.creditDate).getTime();
      return t < todayMs && t >= thirtyAgo;
    })
    .sort((a, b) => b.creditDate.localeCompare(a.creditDate));

  const next = pending[0];

  const reversals = preauths
    .filter((p) => p.country === country && p.status === 'voided' && p.reversal)
    .sort((a, b) => (b.reversal!.processedAt ?? '').localeCompare(a.reversal!.processedAt ?? ''));

  return (
    <div className="space-y-6">
      {/* Banner próxima acreditación */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ini/30 bg-ini-light/60 px-4 py-3">
        <span className="text-sm font-medium text-ini-dark">Próxima acreditación</span>
        {next ? (
          <span className="font-display text-lg font-bold text-ini-dark">
            {formatCurrency(next.net, country)}
            <span className="ml-2 text-sm font-medium text-ini">
              · {formatDayMonth(next.creditDate, country)} ({daysUntil(next.creditDate, now)} días)
            </span>
          </span>
        ) : (
          <span className="text-sm text-muted">Sin acreditaciones pendientes</span>
        )}
      </div>

      {/* Pendientes */}
      <div>
        <p className={`mb-2 ${SECTION}`}>Pendientes</p>
        {pending.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-muted">
            No hay acreditaciones pendientes.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {pending.map((b) => (
              <div key={b.dateKey} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-semibold text-slate-800">{formatDayMonth(b.creditDate, country)}</span>
                  <span className="font-display font-bold text-slate-900">{formatCurrency(b.net, country)}</span>
                  <span className="text-xs text-muted">
                    {b.items.length} cobro{b.items.length !== 1 ? 's' : ''} · en {daysUntil(b.creditDate, now)} días
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDetail(b)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-ini transition hover:bg-ini-light"
                >
                  Ver
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acreditadas */}
      <div>
        <p className={`mb-2 ${SECTION}`}>Acreditadas (últimos 30 días)</p>
        {credited.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-muted">
            Sin acreditaciones en los últimos 30 días.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {credited.map((b) => (
              <div key={b.dateKey} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-semibold text-slate-800">{formatDayMonth(b.creditDate, country)}</span>
                  <span className="font-display font-bold text-slate-900">{formatCurrency(b.net, country)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-success">
                    <CheckCircleIcon className="h-4 w-4" /> Acreditada
                  </span>
                  <button
                    type="button"
                    onClick={() => setDetail(b)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-ini transition hover:bg-ini-light"
                  >
                    Ver
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reversas procesadas (informativo — no generan settlement) */}
      {reversals.length > 0 && (
        <div>
          <p className={`mb-2 ${SECTION}`}>Reversas procesadas</p>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {reversals.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-mono font-semibold text-slate-700">{p.reversal!.id}</span>
                  <span className="text-slate-600">{customersById[p.customerId]?.fullName}</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-3 text-right">
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(p.amount, p.country)} liberados
                  </span>
                  <span className="text-xs text-muted">
                    crédito: {formatDayMonth(p.reversal!.estimatedCreditDate, p.country)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {detail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div onClick={() => setDetail(null)} className="absolute inset-0 animate-fade-in bg-slate-900/40" />
          <div className="relative z-10 w-full max-w-lg animate-modal-in rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Acreditación · {formatDayMonth(detail.creditDate, country)}
                </h2>
                <p className="text-xs text-muted">
                  {detail.items.length} cobro{detail.items.length !== 1 ? 's' : ''} · Neto {formatCurrency(detail.net, country)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <XIcon />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-5">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 pr-2">Cliente</th>
                    <th className="py-2 pr-2">Origen</th>
                    <th className="py-2 pr-2 text-right">Bruto</th>
                    <th className="py-2 pr-2 text-right">Comisión</th>
                    <th className="py-2 text-right">Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((it) => (
                    <tr key={it.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-2 font-medium text-slate-800">
                        {customersById[it.customerId]?.fullName ?? '—'}
                      </td>
                      <td className="py-2 pr-2 font-mono text-xs text-slate-500">{it.label}</td>
                      <td className="whitespace-nowrap py-2 pr-2 text-right tabular-nums">
                        {formatCurrency(it.gross, country)}
                      </td>
                      <td className="whitespace-nowrap py-2 pr-2 text-right tabular-nums text-danger">
                        −{formatCurrency(it.fee, country)}
                      </td>
                      <td className="whitespace-nowrap py-2 text-right font-semibold tabular-nums">
                        {formatCurrency(it.net, country)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
