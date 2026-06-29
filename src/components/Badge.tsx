import type { ReactNode } from 'react';
import type { ChargeStatus, PreauthStatus } from '../state/types';

export type Tone = 'ini' | 'success' | 'warn' | 'danger' | 'amber' | 'muted';

const TONES: Record<Tone, string> = {
  ini: 'bg-ini-light text-ini-dark ring-ini/20',
  success: 'bg-green-50 text-success ring-success/20',
  warn: 'bg-orange-50 text-warn ring-warn/30',
  danger: 'bg-red-50 text-danger ring-danger/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-500/30',
  muted: 'bg-slate-100 text-slate-500 ring-slate-400/20',
};

export function Badge({
  tone = 'muted',
  children,
  className = '',
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const PREAUTH_MAP: Record<PreauthStatus, { label: string; tone: Tone }> = {
  active: { label: 'Activa', tone: 'ini' },
  confirmed: { label: 'Confirmada', tone: 'success' },
  modified: { label: 'Modificada', tone: 'warn' },
  voided: { label: 'Anulada', tone: 'muted' },
};

export function StatusBadge({ status }: { status: PreauthStatus }) {
  const m = PREAUTH_MAP[status];
  return (
    <Badge tone={m.tone}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {m.label}
    </Badge>
  );
}

const CHARGE_MAP: Record<ChargeStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pendiente', tone: 'warn' },
  paid: { label: 'Pagado', tone: 'success' },
  failed: { label: 'Falló', tone: 'danger' },
};

export function ChargeStatusBadge({ status }: { status: ChargeStatus }) {
  const m = CHARGE_MAP[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
