import type { ReactNode } from 'react';

type Option<T extends string> = { value: T; label: ReactNode };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  tone?: 'light' | 'yellow';
  ariaLabel?: string;
};

/** Control segmentado (pill) reutilizable. Usado por país y por rol. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  tone = 'light',
  ariaLabel,
}: Props<T>) {
  const container = tone === 'yellow' ? 'bg-black/10' : 'bg-slate-100';
  const inactive =
    tone === 'yellow' ? 'text-black/60 hover:text-black' : 'text-slate-500 hover:text-slate-800';

  return (
    <div role="group" aria-label={ariaLabel} className={`inline-flex items-center gap-0.5 rounded-full p-0.5 ${container}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ini/50 ${
              active ? 'bg-white text-ini-dark shadow-sm' : inactive
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
