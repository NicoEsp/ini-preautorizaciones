import { useEffect, useMemo, useRef, useState } from 'react';
import { BRANCHES, brand } from '../config/brand';
import { useStore } from '../state/store';
import { formatCurrency } from '../utils/format';
import { BrandHeader } from '../components/BrandHeader';
import { MoneyInput } from '../components/MoneyInput';
import { CheckCircleIcon } from '../components/icons';

// Canal WEB = pre-reserva. NO toma el hold: el cliente reserva online y la
// preautorización (con verificación de identidad) se toma en el POS/Terminal.
type PreReserva = {
  code: string;
  customerName: string;
  vehicleModel: string;
  plate: string;
  estimatedAmount: number;
  country: 'AR' | 'CL';
  branch: string;
};

export function POS() {
  const country = useStore((s) => s.country);
  const customers = useStore((s) => s.customers);
  const vehicles = useStore((s) => s.vehicles);

  const [branch, setBranch] = useState(BRANCHES[country][0]);
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [rentalDays, setRentalDays] = useState(3);
  const [lastReserva, setLastReserva] = useState<PreReserva | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setBranch(BRANCHES[country][0]);
    setVehicleId('');
  }, [country]);

  const branchVehicles = useMemo(
    () => vehicles.filter((v) => v.country === country && v.branch === branch),
    [vehicles, country, branch],
  );

  const invalid = !customerId || !vehicleId || amount === null || amount <= 0 || rentalDays < 1;

  const handleReserve = () => {
    if (invalid || amount === null) return;
    const customer = customers.find((c) => c.id === customerId);
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!customer || !vehicle) return;
    // Pre-reserva: NO se genera preautorización (el hold se toma en sucursal).
    setLastReserva({
      code: `HZ-${country}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customer.fullName,
      vehicleModel: vehicle.model,
      plate: vehicle.plate,
      estimatedAmount: amount,
      country,
      branch,
    });

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      setCustomerId('');
      setVehicleId('');
      setAmount(null);
      setRentalDays(3);
    }, 1500);
  };

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  return (
    <div className="flex min-h-full flex-col">
      <BrandHeader variant="pos" branch={branch} branches={BRANCHES[country]} onBranchChange={setBranch} />

      <main className="mx-auto w-full max-w-[720px] flex-1 px-6 py-8">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-slate-900">Pre-reserva online</h2>
          <p className="text-sm text-muted">
            Canal web (hertz.com.ar): el cliente reserva el {brand.vehicleLabel.toLowerCase()}. La
            garantía <strong>no se bloquea online</strong> — se toma en la sucursal al retirar, con
            verificación de identidad.
          </p>
        </div>

        {/* Card: Nueva pre-reserva */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-display text-lg font-bold text-slate-900">Nueva pre-reserva</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="customer" className="mb-1 block text-sm font-medium text-slate-700">
                Cliente
              </label>
              <select
                id="customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ini focus:ring-2 focus:ring-ini/30"
              >
                <option value="">Seleccionar cliente…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} · {c.documentId}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="vehicle" className="mb-1 block text-sm font-medium text-slate-700">
                {brand.vehicleLabel} · {branch}
              </label>
              <select
                id="vehicle"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ini focus:ring-2 focus:ring-ini/30"
              >
                <option value="">Seleccionar {brand.vehicleLabel.toLowerCase()}…</option>
                {branchVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.model} · {v.plate}
                  </option>
                ))}
              </select>
              {branchVehicles.length === 0 && (
                <p className="mt-1 text-xs text-muted">No hay unidades cargadas en esta sucursal.</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="amount" className="mb-1 block text-sm font-medium text-slate-700">
                  Garantía estimada
                </label>
                <MoneyInput id="amount" value={amount} onChange={setAmount} country={country} />
              </div>
              <div>
                <label htmlFor="days" className="mb-1 block text-sm font-medium text-slate-700">
                  Días de alquiler
                </label>
                <input
                  id="days"
                  type="number"
                  min={1}
                  value={rentalDays}
                  onChange={(e) => setRentalDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-lg font-semibold tabular-nums text-slate-900 outline-none transition focus:border-ini focus:ring-2 focus:ring-ini/30"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={invalid}
              onClick={handleReserve}
              className="w-full rounded-xl bg-hertz-yellow px-4 py-3.5 font-display text-base font-bold text-black shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Crear pre-reserva
            </button>
          </div>
        </section>

        {/* Card: Pre-reserva confirmada */}
        {lastReserva && (
          <section className="mt-5 animate-fade-in rounded-2xl border-2 border-success/40 bg-green-50/60 p-6">
            <div className="mb-3 flex items-center gap-2 text-success">
              <CheckCircleIcon className="h-6 w-6" />
              <h3 className="font-display text-lg font-bold">Pre-reserva confirmada</h3>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted">{brand.reservationLabel}</dt>
              <dd className="text-right font-mono font-semibold text-slate-800">{lastReserva.code}</dd>
              <dt className="text-muted">Cliente</dt>
              <dd className="text-right font-semibold text-slate-800">{lastReserva.customerName}</dd>
              <dt className="text-muted">{brand.vehicleLabel}</dt>
              <dd className="text-right font-semibold text-slate-800">
                {lastReserva.vehicleModel} · {lastReserva.plate}
              </dd>
              <dt className="text-muted">Sucursal de retiro</dt>
              <dd className="text-right font-semibold text-slate-800">{lastReserva.branch}</dd>
              <dt className="text-muted">Garantía estimada</dt>
              <dd className="text-right font-display text-base font-bold text-slate-900">
                {formatCurrency(lastReserva.estimatedAmount, lastReserva.country)}
              </dd>
            </dl>
            <p className="mt-4 rounded-lg bg-white/70 px-3 py-2 text-center text-xs font-medium text-success">
              La preautorización se toma en la sucursal al retirar, con verificación de identidad.
            </p>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-muted">
        Tecnología <span className="font-semibold text-ini">INI</span> · Preautorizaciones
      </footer>
    </div>
  );
}
