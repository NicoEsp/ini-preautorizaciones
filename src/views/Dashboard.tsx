import { Fragment, useEffect, useMemo, useState } from 'react';
import { brand, countryMeta } from '../config/brand';
import { useStore } from '../state/store';
import type { Preauth } from '../state/types';
import { addDays, daysUntil, formatCurrency, formatDayMonth, isReturnOverdue } from '../utils/format';
import { buildSettlement } from '../utils/settlement';
import { useNow } from '../utils/hooks';
import { BrandHeader } from '../components/BrandHeader';
import { ActionDrawer } from '../components/ActionDrawer';
import { Acreditaciones } from '../components/Acreditaciones';
import { AdditionalCharge } from './AdditionalCharge';
import { Badge, ChargeStatusBadge, StatusBadge } from '../components/Badge';
import { RelativeTime } from '../components/RelativeTime';
import { ChevronRightIcon, CopyIcon, PlusIcon } from '../components/icons';

type Tab = 'activas' | 'historial' | 'cobros' | 'acreditaciones';

const TH = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted';
const TD = 'px-4 py-3 text-sm text-slate-700 align-middle';

function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative px-1 pb-3 text-sm font-semibold transition ${
        active ? 'text-ini' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      {label}
      <span
        className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
          active ? 'bg-ini-light text-ini-dark' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {count}
      </span>
      {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-ini" />}
    </button>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
      <p className="font-display font-bold text-slate-600">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function Dashboard() {
  const now = useNow(30_000);
  const country = useStore((s) => s.country);
  const preauths = useStore((s) => s.preauths);
  const charges = useStore((s) => s.charges);
  const customers = useStore((s) => s.customers);
  const vehicles = useStore((s) => s.vehicles);
  const pulsingIds = useStore((s) => s.pulsingIds);
  const unseenCount = useStore((s) => s.unseenCount);
  const markSeen = useStore((s) => s.markSeen);

  const confirmPreauth = useStore((s) => s.confirmPreauth);
  const voidPreauth = useStore((s) => s.voidPreauth);
  const createPaymentLink = useStore((s) => s.createPaymentLink);
  const chargeWithToken = useStore((s) => s.chargeWithToken);

  const [tab, setTab] = useState<Tab>('activas');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chargeId, setChargeId] = useState<string | null>(null);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const customersById = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c] as const)),
    [customers],
  );
  const vehiclesById = useMemo(
    () => Object.fromEntries(vehicles.map((v) => [v.id, v] as const)),
    [vehicles],
  );

  const inCountry = (p: { country: string }) => p.country === country;

  const activeList = useMemo(
    () =>
      preauths
        .filter((p) => p.status === 'active' && inCountry(p))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [preauths, country],
  );
  const historyList = useMemo(
    () =>
      preauths
        .filter((p) => p.status !== 'active' && inCountry(p))
        .sort((a, b) => (b.resolvedAt ?? '').localeCompare(a.resolvedAt ?? '')),
    [preauths, country],
  );
  const chargeList = useMemo(
    () =>
      charges
        .filter((c) => inCountry(c))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [charges, country],
  );

  // Limpiar el contador de "nuevas" al mirar la pestaña Activas.
  useEffect(() => {
    if (tab === 'activas' && unseenCount > 0) markSeen();
  }, [tab, unseenCount, markSeen]);

  const committedSum = activeList.reduce((s, p) => s + p.amount, 0);

  const settlementBatches = useMemo(
    () => buildSettlement(preauths, charges, country),
    [preauths, charges, country],
  );
  const settlementCount = settlementBatches.reduce((n, b) => n + b.items.length, 0);
  const startOfTodayMs = (() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  const nextBatch = settlementBatches
    .filter((b) => new Date(b.creditDate).getTime() >= startOfTodayMs)
    .sort((a, b) => a.creditDate.localeCompare(b.creditDate))[0];

  const selectedPreauth = selectedId ? preauths.find((p) => p.id === selectedId) : undefined;
  const chargePreauth = chargeId ? preauths.find((p) => p.id === chargeId) : undefined;

  const openDrawer = (p: Preauth) => {
    setSelectedId(p.id);
    setDrawerOpen(true);
  };

  // Cierra el drawer, anima la salida de la fila y luego aplica la acción.
  const resolveWithAnim = (id: string, run: () => void) => {
    setDrawerOpen(false);
    setRemovingIds((prev) => [...prev, id]);
    setTimeout(() => {
      run();
      setRemovingIds((prev) => prev.filter((x) => x !== id));
      setSelectedId(null);
    }, 350);
  };

  const openCharge = (p: Preauth) => {
    setChargeId(p.id);
    setChargeOpen(true);
  };

  const copyChargeLink = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    } catch {
      /* clipboard no disponible */
    }
  };

  return (
    <div className="min-h-full">
      <BrandHeader variant="dashboard" />

      <main className="mx-auto w-full max-w-[1400px] px-6 py-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              Preautorizaciones · {countryMeta[country].flag} {countryMeta[country].label}
            </h2>
            <p className="text-sm text-muted">
              Un proveedor, dos países, todas las capas — en tiempo real.
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Preautorizaciones activas" value={String(activeList.length)} sub="en gestión ahora" />
          <StatCard
            label="Monto comprometido"
            value={formatCurrency(committedSum, country)}
            sub="límite retenido en tarjetas"
          />
          <StatCard
            label="Próxima acreditación"
            value={nextBatch ? formatCurrency(nextBatch.net, country) : '—'}
            sub={
              nextBatch
                ? `${formatDayMonth(nextBatch.creditDate, country)} · en ${daysUntil(nextBatch.creditDate, now)} días`
                : 'sin pendientes'
            }
          />
        </div>

        {/* Tabs */}
        <div className="mb-4 flex flex-wrap items-center gap-6 border-b border-slate-200" role="tablist">
          <TabButton label="Activas" count={activeList.length} active={tab === 'activas'} onClick={() => setTab('activas')} />
          <TabButton label="Historial" count={historyList.length} active={tab === 'historial'} onClick={() => setTab('historial')} />
          <TabButton label="Cobros adicionales" count={chargeList.length} active={tab === 'cobros'} onClick={() => setTab('cobros')} />
          <TabButton label="Acreditaciones" count={settlementCount} active={tab === 'acreditaciones'} onClick={() => setTab('acreditaciones')} />
        </div>

        {/* --- TAB ACTIVAS --- */}
        {tab === 'activas' &&
          (activeList.length === 0 ? (
            <EmptyState
              title="No hay preautorizaciones activas"
              hint={`Generá una desde el POS para verla aparecer acá, en tiempo real.`}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className={TH}>Cliente</th>
                      <th className={TH}>{brand.vehicleLabel}</th>
                      <th className={TH}>Sucursal</th>
                      <th className={`${TH} text-right`}>Monto</th>
                      <th className={TH}>Preautorización</th>
                      <th className={TH}>Cierre</th>
                      <th className={TH}>Estado</th>
                      <th className={`${TH} text-right`}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeList.map((p) => {
                      const customer = customersById[p.customerId];
                      const vehicle = vehiclesById[p.vehicleId];
                      const pulsing = pulsingIds.includes(p.id);
                      const removing = removingIds.includes(p.id);
                      const overdue = isReturnOverdue(p, now);
                      return (
                        <tr
                          key={p.id}
                          onClick={() => openDrawer(p)}
                          className={`cursor-pointer border-b border-slate-100 transition last:border-0 hover:bg-ini-light/40 ${
                            pulsing ? 'animate-flash-new' : ''
                          } ${removing ? 'pointer-events-none animate-fade-out-row' : ''}`}
                        >
                          <td className={TD}>
                            <div className="font-semibold text-slate-900">{customer?.fullName}</div>
                            <div className="text-xs text-muted">{customer?.documentId}</div>
                          </td>
                          <td className={TD}>
                            <div className="font-medium text-slate-800">{vehicle?.model}</div>
                            <div className="text-xs text-muted">{vehicle?.plate}</div>
                          </td>
                          <td className={TD}>{vehicle?.branch}</td>
                          <td className={`${TD} text-right font-display font-bold text-slate-900`}>
                            {formatCurrency(p.amount, p.country)}
                          </td>
                          <td className={TD}>
                            <div className="text-slate-800">{formatDayMonth(p.createdAt, p.country)}</div>
                            <div className="text-xs text-muted">
                              <RelativeTime iso={p.createdAt} country={p.country} />
                            </div>
                          </td>
                          <td className={TD}>
                            {p.metadata ? (
                              <div className={overdue ? 'font-semibold text-danger' : 'text-slate-800'}>
                                {formatDayMonth(addDays(p.createdAt, p.metadata.rentalDays), p.country)}
                                {overdue && <div className="text-xs font-medium">vencido</div>}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className={TD}>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <StatusBadge status={p.status} />
                              {overdue && (
                                <Badge tone="amber">devolución pendiente</Badge>
                              )}
                            </div>
                          </td>
                          <td className={`${TD} text-right`}>
                            <span className="inline-flex items-center gap-1 font-semibold text-ini">
                              Gestionar <ChevronRightIcon />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

        {/* --- TAB HISTORIAL --- */}
        {tab === 'historial' &&
          (historyList.length === 0 ? (
            <EmptyState title="Todavía no hay preautorizaciones resueltas" />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className={TH}>Cliente</th>
                      <th className={TH}>{brand.vehicleLabel}</th>
                      <th className={`${TH} text-right`}>Bloqueado</th>
                      <th className={`${TH} text-right`}>Cobrado</th>
                      <th className={TH}>Estado</th>
                      <th className={TH}>Resuelta</th>
                      <th className={`${TH} text-right`}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map((p) => {
                      const customer = customersById[p.customerId];
                      const vehicle = vehiclesById[p.vehicleId];
                      const isVoided = p.status === 'voided';
                      const fa = p.finalAmount;
                      return (
                        <Fragment key={p.id}>
                          <tr className={`hover:bg-slate-50 ${p.reversal ? '' : 'border-b border-slate-100 last:border-0'}`}>
                            <td className={TD}>
                              <div className="font-semibold text-slate-900">{customer?.fullName}</div>
                              <div className="text-xs text-muted">{customer?.documentId}</div>
                            </td>
                            <td className={TD}>
                              <div className="font-medium text-slate-800">{vehicle?.model}</div>
                              <div className="text-xs text-muted">{vehicle?.plate}</div>
                            </td>
                            <td className={`${TD} text-right tabular-nums`}>
                              {formatCurrency(p.amount, p.country)}
                            </td>
                            <td className={`${TD} text-right tabular-nums`}>
                              {typeof fa === 'number' ? (
                                <div>
                                  <span
                                    className={`font-semibold ${
                                      fa > p.amount ? 'text-warn' : fa < p.amount ? 'text-success' : 'text-slate-900'
                                    }`}
                                  >
                                    {formatCurrency(fa, p.country)}
                                  </span>
                                  {fa !== p.amount && (
                                    <div className={`text-xs ${fa > p.amount ? 'text-warn' : 'text-success'}`}>
                                      {fa > p.amount ? '+' : '−'}
                                      {formatCurrency(Math.abs(fa - p.amount), p.country)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className={TD}>
                              <StatusBadge status={p.status} />
                            </td>
                            <td className={TD}>
                              {p.resolvedAt ? <RelativeTime iso={p.resolvedAt} country={p.country} /> : '—'}
                            </td>
                            <td className={`${TD} text-right`}>
                              <button
                                type="button"
                                disabled={isVoided}
                                title={isVoided ? 'No disponible para anuladas' : undefined}
                                onClick={() => openCharge(p)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-ini/40 bg-white px-3 py-1.5 text-sm font-semibold text-ini transition hover:bg-ini-light disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-white"
                              >
                                <PlusIcon /> Cobro adicional
                              </button>
                            </td>
                          </tr>
                          {p.reversal && (
                            <tr className="border-b border-slate-100 last:border-0">
                              <td className={`${TD} py-2 text-xs text-muted`} colSpan={7}>
                                ↳ Reversa{' '}
                                <span className="font-mono font-semibold text-slate-600">{p.reversal.id}</span> ·
                                Crédito al cliente: {formatDayMonth(p.reversal.estimatedCreditDate, p.country)}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

        {/* --- TAB COBROS --- */}
        {tab === 'cobros' &&
          (chargeList.length === 0 ? (
            <EmptyState
              title="Sin cobros adicionales todavía"
              hint="Generá uno desde el Historial: link de cobro o tarjeta tokenizada."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className={TH}>Cliente</th>
                      <th className={TH}>Concepto</th>
                      <th className={`${TH} text-right`}>Monto</th>
                      <th className={TH}>Método</th>
                      <th className={TH}>Estado</th>
                      <th className={TH}>Fecha</th>
                      <th className={TH}>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chargeList.map((c) => {
                      const customer = customersById[c.customerId];
                      return (
                        <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className={TD}>
                            <div className="font-semibold text-slate-900">{customer?.fullName}</div>
                            <div className="text-xs text-muted">{customer?.documentId}</div>
                          </td>
                          <td className={TD}>{c.concept}</td>
                          <td className={`${TD} text-right font-semibold tabular-nums`}>
                            {formatCurrency(c.amount, c.country)}
                          </td>
                          <td className={TD}>
                            <Badge tone={c.method === 'tokenized_card' ? 'ini' : 'muted'}>
                              {c.method === 'tokenized_card' ? 'Tarjeta tokenizada' : 'Link de cobro'}
                            </Badge>
                          </td>
                          <td className={TD}>
                            <ChargeStatusBadge status={c.status} />
                          </td>
                          <td className={TD}>
                            <RelativeTime iso={c.paidAt ?? c.createdAt} country={c.country} />
                          </td>
                          <td className={TD}>
                            {c.method === 'payment_link' && c.paymentLinkUrl ? (
                              <div className="flex items-center gap-2">
                                <code className="max-w-[180px] truncate rounded bg-slate-100 px-2 py-1 text-xs text-ini-dark">
                                  {c.paymentLinkUrl}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => copyChargeLink(c.id, c.paymentLinkUrl!)}
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                >
                                  <CopyIcon className="h-3.5 w-3.5" /> {copiedId === c.id ? 'Copiado' : 'Copiar'}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

        {/* --- TAB ACREDITACIONES --- */}
        {tab === 'acreditaciones' && <Acreditaciones />}
      </main>

      {/* Drawer de acciones */}
      <ActionDrawer
        open={drawerOpen}
        preauth={selectedPreauth}
        customer={selectedPreauth ? customersById[selectedPreauth.customerId] : undefined}
        vehicle={selectedPreauth ? vehiclesById[selectedPreauth.vehicleId] : undefined}
        onClose={() => setDrawerOpen(false)}
        onConfirm={(finalAmount) =>
          selectedPreauth &&
          resolveWithAnim(selectedPreauth.id, () =>
            confirmPreauth({ preauthId: selectedPreauth.id, finalAmount }),
          )
        }
        onVoid={() => voidPreauth({ preauthId: selectedPreauth!.id })}
      />

      {/* Modal de cobro adicional */}
      <AdditionalCharge
        open={chargeOpen}
        preauth={chargePreauth}
        customer={chargePreauth ? customersById[chargePreauth.customerId] : undefined}
        vehicle={chargePreauth ? vehiclesById[chargePreauth.vehicleId] : undefined}
        onClose={() => setChargeOpen(false)}
        onCreateLink={(amount, concept) =>
          createPaymentLink({ preauthId: chargePreauth!.id, amount, concept })
        }
        onChargeToken={(amount, concept) =>
          chargeWithToken({ preauthId: chargePreauth!.id, amount, concept })
        }
      />
    </div>
  );
}
