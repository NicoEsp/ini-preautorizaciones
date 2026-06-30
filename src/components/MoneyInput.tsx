import type { Country } from '../state/types';
import { formatNumber } from '../utils/format';

/**
 * Input de monto con prefijo $ y separadores de miles automáticos.
 * Mantiene el valor como número; muestra el formato del locale del país.
 */
const TONES: Record<'neutral' | 'success' | 'warn', string> = {
  neutral: 'border-slate-300 focus:border-ini focus:ring-ini/30',
  success: 'border-success bg-green-50/40 focus:border-success focus:ring-success/30',
  warn: 'border-warn bg-orange-50/40 focus:border-warn focus:ring-warn/30',
};

export function MoneyInput({
  value,
  onChange,
  country,
  placeholder = '0',
  autoFocus = false,
  id,
  tone = 'neutral',
}: {
  value: number | null;
  onChange: (n: number | null) => void;
  country: Country;
  placeholder?: string;
  autoFocus?: boolean;
  id?: string;
  tone?: 'neutral' | 'success' | 'warn';
}) {
  const display = value === null || Number.isNaN(value) ? '' : formatNumber(value, country);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoFocus={autoFocus}
        value={display}
        placeholder={placeholder}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, '');
          onChange(digits === '' ? null : parseInt(digits, 10));
        }}
        className={`w-full rounded-lg border bg-white py-2.5 pl-7 pr-3 text-right text-lg font-semibold tabular-nums text-slate-900 outline-none transition focus:ring-2 ${TONES[tone]}`}
      />
    </div>
  );
}
