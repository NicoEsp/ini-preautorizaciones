import { useEffect, useState } from 'react';
import type { Customer, Preauth, Vehicle } from '../state/types';
import { formatCurrency } from '../utils/format';
import { PreauthCard } from '../components/PreauthCard';
import { MoneyInput } from '../components/MoneyInput';
import { Badge } from '../components/Badge';
import { CardIcon, CheckCircleIcon, CopyIcon, LinkIcon, SpinnerIcon, XIcon } from '../components/icons';

type Method = 'payment_link' | 'tokenized_card';
type Phase = 'form' | 'submitting' | 'link_done' | 'token_done';

type Props = {
  open: boolean;
  preauth?: Preauth;
  customer?: Customer;
  vehicle?: Vehicle;
  onClose: () => void;
  onCreateLink: (amount: number, concept: string) => string;
  onChargeToken: (amount: number, concept: string) => Promise<void>;
};

export function AdditionalCharge({
  open,
  preauth,
  customer,
  vehicle,
  onClose,
  onCreateLink,
  onChargeToken,
}: Props) {
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [method, setMethod] = useState<Method>('payment_link');
  const [phase, setPhase] = useState<Phase>('form');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const hasToken = !!customer?.tokenizedCard;

  useEffect(() => {
    setConcept('');
    setAmount(null);
    setMethod('payment_link');
    setPhase('form');
    setGeneratedUrl('');
    setCopied(false);
  }, [preauth?.id, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'submitting') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, phase]);

  if (!open || !preauth) return null;

  const invalid = !concept.trim() || amount === null || amount <= 0;

  const handleConfirm = async () => {
    if (invalid || amount === null) return;
    if (method === 'payment_link') {
      const url = onCreateLink(amount, concept.trim());
      setGeneratedUrl(url);
      setPhase('link_done');
    } else {
      setPhase('submitting');
      await onChargeToken(amount, concept.trim());
      setPhase('token_done');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const card = customer?.tokenizedCard;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        onClick={() => phase !== 'submitting' && onClose()}
        className="absolute inset-0 animate-fade-in bg-slate-900/40 backdrop-blur-[1px]"
      />
      <div className="relative z-10 w-full max-w-md animate-modal-in rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Cobro adicional</h2>
            <p className="text-xs text-muted">El vínculo con el cliente sigue después del alquiler</p>
          </div>
          {phase !== 'submitting' && (
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

        <div className="space-y-4 p-5">
          <PreauthCard preauth={preauth} customer={customer} vehicle={vehicle} variant="summary" />

          {phase === 'form' || phase === 'submitting' ? (
            <>
              <div>
                <label htmlFor="concept" className="mb-1 block text-sm font-medium text-slate-700">
                  Concepto
                </label>
                <input
                  id="concept"
                  type="text"
                  value={concept}
                  disabled={phase === 'submitting'}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Multa de tránsito 18/06"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ini focus:ring-2 focus:ring-ini/30"
                />
              </div>

              <div>
                <label htmlFor="charge-amount" className="mb-1 block text-sm font-medium text-slate-700">
                  Monto
                </label>
                <MoneyInput id="charge-amount" value={amount} onChange={setAmount} country={preauth.country} />
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Método de cobro</p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    disabled={phase === 'submitting'}
                    onClick={() => setMethod('payment_link')}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                      method === 'payment_link'
                        ? 'border-ini bg-ini-light/60 ring-1 ring-ini'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <LinkIcon className="h-5 w-5 text-ini" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Link de cobro</p>
                      <p className="text-xs text-muted">Se envía al cliente por mail o WhatsApp</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!hasToken || phase === 'submitting'}
                    onClick={() => hasToken && setMethod('tokenized_card')}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                      !hasToken
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                        : method === 'tokenized_card'
                          ? 'border-ini bg-ini-light/60 ring-1 ring-ini'
                          : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <CardIcon className="h-5 w-5 text-ini" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">Tarjeta tokenizada</p>
                      {hasToken && card ? (
                        <p className="text-xs text-muted">
                          Cobro directo, sin fricción para el cliente
                        </p>
                      ) : (
                        <p className="text-xs text-muted">El cliente no tiene tarjeta en archivo</p>
                      )}
                    </div>
                    {hasToken && card && (
                      <Badge tone="ini" className="uppercase">
                        {card.brand} ···· {card.last4}
                      </Badge>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={invalid || phase === 'submitting'}
                onClick={handleConfirm}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-ini px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-ini-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {phase === 'submitting' ? (
                  <>
                    <SpinnerIcon /> Procesando cobro…
                  </>
                ) : method === 'payment_link' ? (
                  <>Generar link de cobro</>
                ) : (
                  <>Cobrar {amount ? formatCurrency(amount, preauth.country) : ''} a la tarjeta</>
                )}
              </button>
            </>
          ) : phase === 'link_done' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-success">
                <CheckCircleIcon className="h-5 w-5" /> Link de cobro generado
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Link para enviar</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-white px-2 py-1.5 text-sm text-ini-dark ring-1 ring-slate-200">
                    {generatedUrl}
                  </code>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex items-center gap-1.5 rounded-lg bg-ini px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-ini-dark"
                  >
                    <CopyIcon /> {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Listo
              </button>
            </div>
          ) : (
            // token_done
            <div className="space-y-4 py-2 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-success">
                <CheckCircleIcon className="h-8 w-8" />
              </div>
              <div>
                <p className="font-display text-lg font-bold text-slate-900">Cobro realizado</p>
                <p className="text-sm text-muted">
                  {amount ? formatCurrency(amount, preauth.country) : ''} cobrados a {card?.brand} ····{' '}
                  {card?.last4}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-ini px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ini-dark"
              >
                Listo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
