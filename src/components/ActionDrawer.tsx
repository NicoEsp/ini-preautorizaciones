import { useEffect, useState } from 'react';
import type { Customer, Preauth, Vehicle } from '../state/types';
import { formatCurrency, isReturnOverdue } from '../utils/format';
import { useNow } from '../utils/hooks';
import { PreauthCard } from './PreauthCard';
import { MoneyInput } from './MoneyInput';
import { Badge } from './Badge';
import { AlertIcon, XIcon } from './icons';

type Mode = 'idle' | 'confirm' | 'modify' | 'void';

type Props = {
  open: boolean;
  preauth?: Preauth;
  customer?: Customer;
  vehicle?: Vehicle;
  onClose: () => void;
  onConfirm: () => void;
  onModify: (newAmount: number) => void;
  onVoid: () => void;
};

export function ActionDrawer({
  open,
  preauth,
  customer,
  vehicle,
  onClose,
  onConfirm,
  onModify,
  onVoid,
}: Props) {
  const now = useNow(30_000);
  const [mode, setMode] = useState<Mode>('idle');
  const [modifyValue, setModifyValue] = useState<number | null>(null);

  // Resetear el estado interno cuando cambia la preauth o se cierra el drawer.
  useEffect(() => {
    setMode('idle');
    setModifyValue(preauth ? preauth.amount : null);
  }, [preauth?.id, open]);

  // Cerrar con tecla Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const overdue = preauth ? isReturnOverdue(preauth, now) : false;
  const modifyInvalid =
    modifyValue === null || modifyValue <= 0 || (preauth ? modifyValue >= preauth.amount : true);

  return (
    <>
      <div
        onClick={onClose}
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
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <XIcon />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {overdue && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                  <AlertIcon className="h-4 w-4" />
                  Devolución pendiente: el plazo de alquiler ya venció.
                </div>
              )}

              <PreauthCard preauth={preauth} customer={customer} vehicle={vehicle} variant="full" />

              {/* --- Acciones --- */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Acciones</p>

                {/* Confirmar */}
                {mode === 'confirm' ? (
                  <div className="rounded-xl border border-success/40 bg-green-50 p-3">
                    <p className="text-sm font-medium text-slate-700">
                      Confirmar el monto original de{' '}
                      <strong>{formatCurrency(preauth.amount, preauth.country)}</strong>.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={onConfirm}
                        className="flex-1 rounded-lg bg-success px-3 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                      >
                        Confirmar
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
                ) : mode === 'modify' ? (
                  <div className="rounded-xl border border-warn/40 bg-orange-50 p-3">
                    <label className="text-sm font-medium text-slate-700">
                      Nuevo monto (menor al original)
                    </label>
                    <div className="mt-2">
                      <MoneyInput
                        value={modifyValue}
                        onChange={setModifyValue}
                        country={preauth.country}
                        autoFocus
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      Original: {formatCurrency(preauth.amount, preauth.country)}
                    </p>
                    {modifyInvalid && modifyValue !== null && (
                      <p className="mt-1 text-xs font-medium text-danger">
                        El nuevo monto debe ser mayor a 0 y menor al original.
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={modifyInvalid}
                        onClick={() => modifyValue !== null && onModify(modifyValue)}
                        className="flex-1 rounded-lg bg-warn px-3 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Aplicar nuevo monto
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
                ) : mode === 'void' ? (
                  <div className="rounded-xl border border-danger/40 bg-red-50 p-3">
                    <p className="text-sm font-medium text-slate-700">
                      ¿Anular la preautorización? El límite se libera al instante en la tarjeta del
                      cliente.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={onVoid}
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
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setMode('confirm')}
                      className="flex w-full items-center justify-between rounded-xl bg-success px-4 py-3 text-left text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
                    >
                      Confirmar monto original
                      <span className="font-display text-base">
                        {formatCurrency(preauth.amount, preauth.country)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('modify')}
                      className="flex w-full items-center justify-between rounded-xl bg-warn px-4 py-3 text-left text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
                    >
                      Modificar monto
                      <span className="text-xs font-medium opacity-90">a un valor menor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('void')}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/50 bg-white px-4 py-3 text-sm font-semibold text-danger transition hover:bg-red-50"
                    >
                      Anular preautorización
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-ini-light/60 px-3 py-2 text-xs text-ini-dark">
                <Badge tone="ini">INI</Badge>{' '}
                <span className="ml-1">
                  La resolución impacta al instante. Sin esperar 30-40 días para liberar el límite.
                </span>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
