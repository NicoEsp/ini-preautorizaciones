import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BRANCHES, brand } from '../config/brand';
import { useStore } from '../state/store';
import type { CardBrand } from '../state/types';
import { formatCurrency } from '../utils/format';
import { navigate, useHashRoute } from '../utils/hooks';
import { CountrySwitcher } from '../components/CountrySwitcher';
import { Segmented } from '../components/Segmented';
import { Badge } from '../components/Badge';
import { CheckCircleIcon, SpinnerIcon } from '../components/icons';

type Step =
  | 'start'
  | 'monto'
  | 'vehiculo'
  | 'cliente'
  | 'tarjeta'
  | 'resumen'
  | 'procesando'
  | 'aprobado'
  | 'historial';

const BRAND_LABEL: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  naranja: 'Naranja',
  other: 'Tarjeta',
};

function detectBrand(digits: string): CardBrand | null {
  if (!digits) return null;
  const f = digits[0];
  if (f === '4') return 'visa';
  if (f === '5') return 'mastercard';
  if (f === '3') return 'amex';
  if (f === '6') return 'naranja';
  return 'other';
}

function groupCard(digits: string): string {
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

const PROC_MSGS = ['Comunicando con el banco…', 'Validando fondos…', 'Bloqueando garantía…'];

// Switcher de canal (arriba del dispositivo).
function ChannelSwitcher() {
  const route = useHashRoute();
  const active = route.startsWith('/pos')
    ? 'checkout'
    : route.startsWith('/terminal')
      ? 'terminal'
      : 'dashboard';
  return (
    <Segmented
      ariaLabel="Cambiar de vista"
      tone="light"
      value={active}
      onChange={(v) => navigate(v === 'checkout' ? '/pos' : v === 'terminal' ? '/terminal' : '/dashboard')}
      options={[
        { value: 'checkout', label: 'Checkout' },
        { value: 'terminal', label: 'Terminal' },
        { value: 'dashboard', label: 'Dashboard' },
      ]}
    />
  );
}

export function Terminal() {
  const country = useStore((s) => s.country);
  const setCountry = useStore((s) => s.setCountry);
  const vehicles = useStore((s) => s.vehicles);
  const customers = useStore((s) => s.customers);
  const preauths = useStore((s) => s.preauths);
  const generatePreauth = useStore((s) => s.generatePreauth);
  const addCustomer = useStore((s) => s.addCustomer);
  const setCustomerCard = useStore((s) => s.setCustomerCard);

  const [step, setStep] = useState<Step>('start');
  const [branch, setBranch] = useState(BRANCHES[country][0]);

  const [amountStr, setAmountStr] = useState('');
  const [vehicleId, setVehicleId] = useState('');

  const [customerMode, setCustomerMode] = useState<'nuevo' | 'existente'>('nuevo');
  const [existingId, setExistingId] = useState('');
  const [newName, setNewName] = useState('');
  const [newDni, setNewDni] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [cardError, setCardError] = useState('');

  const [procMsg, setProcMsg] = useState(0);
  const [result, setResult] = useState<{
    preauthId: string;
    customerName: string;
    last4: string;
    brand: CardBrand;
    amount: number;
    saved: boolean;
  } | null>(null);

  useEffect(() => {
    setBranch(BRANCHES[country][0]);
    setVehicleId('');
  }, [country]);

  const amount = amountStr === '' ? null : parseInt(amountStr, 10);
  const branchVehicles = useMemo(
    () => vehicles.filter((v) => v.country === country && v.branch === branch),
    [vehicles, country, branch],
  );
  const cardDigits = cardNumber.replace(/\D/g, '');
  const cardBrand = detectBrand(cardDigits);

  const existingCustomer = customers.find((c) => c.id === existingId);
  const customerName =
    customerMode === 'existente' ? (existingCustomer?.fullName ?? '') : newName.trim();
  const customerDoc =
    customerMode === 'existente' ? (existingCustomer?.documentId ?? '') : newDni.trim();

  const clienteValid =
    customerMode === 'existente' ? !!existingId : !!newName.trim() && !!newDni.trim() && !!newEmail.trim();

  function validateCard(): string {
    if (cardDigits.length < 15 || cardDigits.length > 16) return 'Número de tarjeta inválido (15-16 dígitos).';
    const m = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return 'Vencimiento inválido (MM/YY).';
    const mm = parseInt(m[1], 10);
    const yy = 2000 + parseInt(m[2], 10);
    if (mm < 1 || mm > 12) return 'Mes de vencimiento inválido.';
    const exp = new Date(yy, mm, 0, 23, 59, 59); // fin del mes
    if (exp.getTime() < Date.now()) return 'La tarjeta está vencida.';
    if (cvv.length < 3 || cvv.length > 4) return 'CVV inválido.';
    return '';
  }

  function reset() {
    setStep('start');
    setAmountStr('');
    setVehicleId('');
    setCustomerMode('nuevo');
    setExistingId('');
    setNewName('');
    setNewDni('');
    setNewEmail('');
    setCardNumber('');
    setCardName('');
    setExpiry('');
    setCvv('');
    setSaveCard(true);
    setCardError('');
    setResult(null);
  }

  // Secuencia de procesamiento -> aprobado.
  useEffect(() => {
    if (step !== 'procesando') return;
    setProcMsg(0);
    const t1 = setTimeout(() => setProcMsg(1), 900);
    const t2 = setTimeout(() => setProcMsg(2), 1800);
    const t3 = setTimeout(() => {
      const last4 = cardDigits.slice(-4);
      const det = detectBrand(cardDigits) ?? 'other';
      const m = expiry.match(/^(\d{2})\/(\d{2})$/);
      const token = saveCard
        ? {
            brand: det,
            last4,
            expirationMonth: m ? parseInt(m[1], 10) : 1,
            expirationYear: m ? 2000 + parseInt(m[2], 10) : 2030,
          }
        : undefined;

      let customerId: string;
      let name: string;
      if (customerMode === 'existente' && existingId) {
        customerId = existingId;
        name = customers.find((c) => c.id === existingId)?.fullName ?? '';
        if (token) setCustomerCard({ customerId, card: token });
      } else {
        name = newName.trim();
        customerId = addCustomer({
          fullName: newName.trim(),
          documentId: newDni.trim(),
          email: newEmail.trim(),
          phone: '',
          tokenizedCard: token,
        });
      }

      const reservationCode = `HZ-${country}-${Math.floor(1000 + Math.random() * 9000)}`;
      const preauthId = generatePreauth({
        customerId,
        vehicleId,
        amount: amount ?? 0,
        country,
        rentalDays: 3,
        reservationCode,
      });
      setResult({ preauthId, customerName: name, last4, brand: det, amount: amount ?? 0, saved: saveCard });
      setStep('aprobado');
    }, 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  const Pill = ({ children, active, onClick }: { children: ReactNode; active: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
        active ? 'border-ini bg-ini-light/60 text-ini-dark ring-1 ring-ini' : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      {children}
    </button>
  );

  const primaryBtn =
    'w-full rounded-xl bg-ini px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-ini-dark disabled:cursor-not-allowed disabled:opacity-40';
  const ghostBtn =
    'rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50';
  const fieldCls =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ini focus:ring-2 focus:ring-ini/30';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#1a1a1a] px-4 py-6">
      <ChannelSwitcher />

      {/* Dispositivo */}
      <div className="w-full max-w-[480px] rounded-[2rem] bg-black p-4 shadow-2xl">
        <div className="flex h-[700px] max-h-[78vh] flex-col overflow-hidden rounded-[1.4rem] bg-white">
          {/* Header del terminal */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-hertz-yellow px-5 py-3">
            <div>
              <img src={brand.client.logoUrl} alt={brand.client.name} className="h-5 w-auto" />
              <p className="mt-0.5 text-[11px] font-medium text-black/70">
                Terminal · Sucursal {branch} {country}
              </p>
            </div>
            <span className="rounded bg-black/10 px-2 py-0.5 text-[11px] font-bold text-black/70">Hertz Pay</span>
          </div>

          {/* Cuerpo (state machine) */}
          <div className="flex-1 overflow-y-auto p-5">
            {step === 'start' && (
              <div className="flex h-full flex-col">
                <div className="mb-4 space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted">Configuración</label>
                  <CountrySwitcher value={country} onChange={setCountry} />
                  <select value={branch} onChange={(e) => setBranch(e.target.value)} className={fieldCls}>
                    {BRANCHES[country].map((b) => (
                      <option key={b} value={b}>
                        Sucursal {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-1 flex-col justify-center gap-3">
                  <button type="button" onClick={() => setStep('monto')} className={`${primaryBtn} py-5 text-base`}>
                    Nueva operación
                  </button>
                  <button type="button" onClick={() => setStep('historial')} className={`${ghostBtn} py-4`}>
                    Ver historial
                  </button>
                </div>
              </div>
            )}

            {step === 'monto' && (
              <div className="flex h-full flex-col">
                <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted">
                  Monto de la garantía
                </p>
                <p className="mb-4 text-center font-display text-3xl font-bold text-slate-900">
                  {formatCurrency(amount ?? 0, country)}
                </p>
                <div className="grid flex-1 grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        if (k === 'C') setAmountStr('');
                        else if (k === '←') setAmountStr((s) => s.slice(0, -1));
                        else setAmountStr((s) => (s.length < 9 ? (s === '' && k === '0' ? '' : s + k) : s));
                      }}
                      className="rounded-xl bg-slate-100 text-xl font-bold text-slate-800 transition hover:bg-slate-200 active:bg-slate-300"
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setStep('start')} className={ghostBtn}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!amount || amount <= 0}
                    onClick={() => setStep('vehiculo')}
                    className={primaryBtn}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {step === 'vehiculo' && (
              <div className="flex h-full flex-col">
                <p className="mb-1 font-display text-lg font-bold text-slate-900">{brand.vehicleLabel}</p>
                <p className="mb-4 text-sm text-muted">Sucursal {branch}</p>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {branchVehicles.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVehicleId(v.id)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition ${
                        vehicleId === v.id
                          ? 'border-ini bg-ini-light/60 ring-1 ring-ini'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <span className="font-medium text-slate-800">{v.model}</span>
                      <span className="text-xs text-muted">{v.plate}</span>
                    </button>
                  ))}
                  {branchVehicles.length === 0 && (
                    <p className="text-sm text-muted">No hay unidades en esta sucursal.</p>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setStep('monto')} className={ghostBtn}>
                    ← Volver
                  </button>
                  <button type="button" disabled={!vehicleId} onClick={() => setStep('cliente')} className={primaryBtn}>
                    Continuar →
                  </button>
                </div>
              </div>
            )}

            {step === 'cliente' && (
              <div className="flex h-full flex-col">
                <p className="mb-3 font-display text-lg font-bold text-slate-900">Datos del cliente</p>
                <div className="mb-3 flex gap-2">
                  <Pill active={customerMode === 'nuevo'} onClick={() => setCustomerMode('nuevo')}>
                    Cliente nuevo
                  </Pill>
                  <Pill active={customerMode === 'existente'} onClick={() => setCustomerMode('existente')}>
                    Cliente existente
                  </Pill>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto">
                  {customerMode === 'existente' ? (
                    <select value={existingId} onChange={(e) => setExistingId(e.target.value)} className={fieldCls}>
                      <option value="">Seleccionar cliente…</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} · {c.documentId}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <input
                        className={fieldCls}
                        placeholder="Nombre completo"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                      <input
                        className={fieldCls}
                        placeholder="DNI / RUT"
                        value={newDni}
                        onChange={(e) => setNewDni(e.target.value)}
                      />
                      <input
                        className={fieldCls}
                        placeholder="Email (para comprobante)"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                    </>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setStep('vehiculo')} className={ghostBtn}>
                    ← Volver
                  </button>
                  <button type="button" disabled={!clienteValid} onClick={() => setStep('tarjeta')} className={primaryBtn}>
                    Continuar →
                  </button>
                </div>
              </div>
            )}

            {step === 'tarjeta' && (
              <div className="flex h-full flex-col">
                <p className="mb-3 font-display text-lg font-bold text-slate-900">Datos de la tarjeta</p>
                <div className="flex-1 space-y-3 overflow-y-auto">
                  <div className="relative">
                    <input
                      className={fieldCls}
                      placeholder="Número de tarjeta"
                      inputMode="numeric"
                      value={groupCard(cardDigits)}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    />
                    {cardBrand && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Badge tone="ini">{BRAND_LABEL[cardBrand]}</Badge>
                      </span>
                    )}
                  </div>
                  <input
                    className={fieldCls}
                    placeholder="Nombre en la tarjeta"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className={fieldCls}
                      placeholder="MM/YY"
                      inputMode="numeric"
                      value={expiry}
                      onChange={(e) => {
                        let d = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (d.length >= 3) d = `${d.slice(0, 2)}/${d.slice(2)}`;
                        setExpiry(d);
                      }}
                    />
                    <input
                      className={fieldCls}
                      placeholder="CVV"
                      inputMode="numeric"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    />
                  </div>
                  <label className="flex cursor-pointer items-start gap-2 rounded-lg bg-ini-light/50 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-ini"
                    />
                    <span className="text-slate-700">
                      Guardar tarjeta para cobros futuros
                      <span className="block text-xs text-muted">multas, peajes, daños posteriores</span>
                    </span>
                  </label>
                  {cardError && <p className="text-sm font-medium text-danger">{cardError}</p>}
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setStep('cliente')} className={ghostBtn}>
                    ← Volver
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const err = validateCard();
                      setCardError(err);
                      if (!err) setStep('resumen');
                    }}
                    className={primaryBtn}
                  >
                    Continuar →
                  </button>
                </div>
              </div>
            )}

            {step === 'resumen' && (
              <div className="flex h-full flex-col">
                <p className="mb-3 font-display text-lg font-bold text-slate-900">Confirmar preautorización</p>
                <div className="flex-1 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <Row k="Cliente" v={customerName} />
                  <Row k="Documento" v={customerDoc} />
                  <Row k="Tarjeta" v={`${cardBrand ? BRAND_LABEL[cardBrand] : ''} **** ${cardDigits.slice(-4)}`} />
                  <Row k={brand.vehicleLabel} v={selectedVehicle ? selectedVehicle.model : '—'} />
                  <Row k="Patente" v={selectedVehicle?.plate ?? '—'} />
                  <div className="my-2 border-t border-slate-200" />
                  <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted">Monto a bloquear</p>
                  <p className="text-center font-display text-2xl font-bold text-slate-900">
                    {formatCurrency(amount ?? 0, country)}
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setStep('tarjeta')} className={ghostBtn}>
                    ← Volver
                  </button>
                  <button type="button" onClick={() => setStep('procesando')} className={primaryBtn}>
                    Aprobar preautorización
                  </button>
                </div>
              </div>
            )}

            {step === 'procesando' && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <SpinnerIcon className="h-12 w-12 text-ini" />
                <p className="font-display text-lg font-bold text-slate-800">{PROC_MSGS[procMsg]}</p>
                <p className="text-sm text-muted">
                  {cardBrand ? BRAND_LABEL[cardBrand] : 'Tarjeta'} **** {cardDigits.slice(-4)}
                </p>
              </div>
            )}

            {step === 'aprobado' && result && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-success">
                  <CheckCircleIcon className="h-10 w-10" />
                </div>
                <p className="font-display text-xl font-bold text-slate-900">Preautorización aprobada</p>
                <p className="font-display text-2xl font-bold text-slate-900">
                  {formatCurrency(result.amount, country)}
                </p>
                <p className="text-sm text-muted">bloqueados</p>
                <div className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left text-sm">
                  <Row k="ID" v={<span className="font-mono">{result.preauthId}</span>} />
                  <Row k="Cliente" v={result.customerName} />
                  <Row
                    k="Tarjeta"
                    v={`${BRAND_LABEL[result.brand]} **** ${result.last4}${result.saved ? ' (guardada)' : ''}`}
                  />
                </div>
                <div className="mt-1 w-full space-y-2">
                  <button type="button" onClick={() => alert('Comprobante impreso (mockup)')} className={ghostBtn + ' w-full'}>
                    Imprimir comprobante
                  </button>
                  <button type="button" onClick={reset} className={primaryBtn}>
                    Nueva operación
                  </button>
                </div>
              </div>
            )}

            {step === 'historial' && (
              <div className="flex h-full flex-col">
                <p className="mb-3 font-display text-lg font-bold text-slate-900">Historial · {country}</p>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {preauths
                    .filter((p) => p.country === country)
                    .slice(0, 12)
                    .map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                        <div>
                          <p className="font-mono text-xs text-slate-500">{p.id}</p>
                          <p className="font-medium text-slate-800">
                            {customers.find((c) => c.id === p.customerId)?.fullName ?? '—'}
                          </p>
                        </div>
                        <span className="font-semibold text-slate-900">{formatCurrency(p.amount, p.country)}</span>
                      </div>
                    ))}
                </div>
                <button type="button" onClick={() => setStep('start')} className={`${ghostBtn} mt-4`}>
                  ← Volver
                </button>
              </div>
            )}
          </div>

          {/* Footer del terminal */}
          <div className="border-t border-slate-100 py-2 text-center text-[11px] text-muted">
            Powered by <span className="font-semibold text-ini">INI</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="text-muted">{k}</span>
      <span className="text-right font-semibold text-slate-800">{v}</span>
    </div>
  );
}
