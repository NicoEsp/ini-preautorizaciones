import { useEffect, useState } from 'react';
import type { Customer, Preauth, Reversal, Vehicle } from '../state/types';
import { formatCurrency, formatDayMonth, isReturnOverdue } from '../utils/format';
import { useNow } from '../utils/hooks';
import { PreauthCard } from './PreauthCard';
import { MoneyInput } from './MoneyInput';
import { Badge } from './Badge';
import { AlertIcon, CheckCircleIcon, SpinnerIcon, XIcon } from './icons';

type Mode = 'idle' | 'void_confirm' | 'void_processing';

type Props = {
  open: boolean;
  preauth?: Preauth;
  customer?: Customer;
  vehicle?: Vehicle;
  onClose: () => void;
  onConfirm: (finalAmount: number) => void;
  onVoid: () => Reversal;
};

function cardLabel(customer?: Customer): string {
  const c = customer?.tokenizedCard;
  return c ? `${c.brand.toUpperCase()} **** ${c.last4}` : 'la tarjeta del titular';
}

export function ActionDrawer({ open, preauth, customer, vehicle, onClose, onConfirm, onVoid }: Props) {
  const now = useNow(30_000);
  const [mode, setMode] = useState<Mode>('idle');
  const [amount, setAmount] = useState<number | null>(null);
  const [voidStep, setVoidStep] = useState<0 | 1 | 2>(0);
  const [reversal, setReversal] = useState<Reversal | null>(null);

  // Reset al cambiar de preauth o cerrar.
  useEffect(() => {
    setMode('idle');
    setAmount(preauth ? preauth.amount : null);
    setVoidStep(0);
    setReversal(null);
  }, [preauth?.id, open]);

  // Cerrar con Escape (salvo durante el procesamiento de la reversa).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mode !== 'void_processing') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, mode]);

  // Secuencia de anulación -> reversa.
  useEffect(() => {
    if (mode !== 'void_processing') return;
    setVoidStep(0);
    const t1 = setTimeout(() => setVoidStep(1), 300);
    const t2 = setTimeout(() => {
      setReversal(onVoid());
      setVoidStep(2);
    }, 1000);
    const t3 = setTimeout(() => onClose(), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const overdue = preauth ? isReturnOverdue(preauth, now) : false;
  const diff = preauth && amount !== null ? amount - preauth.amount : 0;
  const tone: 'neutral' | 'success' | 'warn' =
    amount === null || !preauth || diff === 0 ? 'neutral' : diff < 0 ? 'success' : 'warn';
  const confirmInvalid = amount === null || amount <= 0;

  return (
    <>
      <div
        onClick={() => mode !== 'void_processing' && onClose()}
        className={`fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px] transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[440px] flex-col bg-canvas shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {preauth && (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">Gestionar preautorización</h2>
                <p className="text-xs text-muted">Decisión al momento de la devolución</p>
              </div>
              {mode !== 'void_processing' && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Cerrar"
                >
                  <XIcon />
                </button>
              )}
            </div>

            {mode === 'void_processing' ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                {voidStep < 2 ? (
                  <>
                    <SpinnerIcon className="h-10 w-10 text-ini" />
                    <p className="font-display text-lg font-bold text-slate-800">
                      {voidStep === 0 ? 'Anulando preautorización…' : 'Procesando devolución…'}
                    </p>
                    {voidStep === 1 && (
                      <p className="text-sm text-muted">{cardLabel(customer)}</p>
                    )}
                  </>
                ) : (
                  <div className="w-full animate-fade-in space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-success">
                      <CheckCircleIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold text-slate-900">Preautorización anulada</p>
                      <p className="text-sm font-semibold text-success">Reversa enviada</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-left text-sm">
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted">ID de reversa</span>
                        <span className="font-mono font-semibold text-slate-800">{reversal?.id}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted">Crédito estimado</span>
                        <span className="font-semibold text-slate-800">
                          {reversal ? formatDayMonth(reversal.estimatedCreditDate, preauth.country) : '—'}
                        </span>
                      </div>
                      <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-success">
                        Crédito visible en la cuenta del cliente en 24-48hs hábiles.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {overdue && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                    <AlertIcon className="h-4 w-4" />
                    Devolución pendiente: el plazo de alquiler ya venció.
                  </div>
                )}

                <PreauthCard preauth={preauth} customer={customer} vehicle={vehicle} variant="full" />

                {mode === 'void_confirm' ? (
                  <div className="rounded-xl border border-danger/40 bg-red-50 p-3">
                    <p className="text-sm font-medium text-slate-700">
                      ¿Confirmás anular esta preautorización? Se envía una <strong>reversa</strong> a{' '}
                      {cardLabel(customer)} y el límite se libera.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMode('void_processing')}
                        className="flex-1 rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                      >
                        Sí, anular
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('idle')}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">Monto a cobrar</label>
                      <MoneyInput value={amount} onChange={setAmount} country={preauth.country} tone={tone} />
                      <p
                        className={`mt-1.5 text-xs font-medium ${
                          tone === 'success' ? 'text-success' : tone === 'warn' ? 'text-warn' : 'text-muted'
                        }`}
                      >
                        {tone === 'neutral'
                          ? 'Monto exacto al bloqueado. Editá si el cobro difiere.'
                          : tone === 'success'
                            ? `Cobrás ${formatCurrency(Math.abs(diff), preauth.country)} menos. Se libera la diferencia al cliente.`
                            : `Cobrás ${formatCurrency(Math.abs(diff), preauth.country)} adicional sobre el bloqueado (ej. daños o cargos extra).`}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={confirmInvalid}
                        onClick={() => amount !== null && onConfirm(amount)}
                        className="flex-1 rounded-xl bg-success px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Confirmar el pago
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('void_confirm')}
                        className="rounded-xl border border-danger/50 bg-white px-4 py-3 text-sm font-semibold text-danger transition hover:bg-red-50"
                      >
                        Anular
                      </button>
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-ini-light/60 px-3 py-2 text-xs text-ini-dark">
                  <Badge tone="ini">INI</Badge>{' '}
                  <span className="ml-1">
                    La resolución impacta al instante. Sin esperar 30-40 días para liberar el límite.
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}
