import { brand } from '../config/brand';
import { useStore } from '../state/store';
import { useHashRoute, navigate } from '../utils/hooks';
import { CountrySwitcher } from './CountrySwitcher';
import { Segmented } from './Segmented';
import { BellIcon, ResetIcon } from './icons';

type Props = {
  variant: 'pos' | 'dashboard';
  branch?: string;
  branches?: string[];
  onBranchChange?: (b: string) => void;
};

function RoleSwitcher({ tone }: { tone: 'light' | 'yellow' }) {
  const route = useHashRoute();
  const active = route.startsWith('/pos') ? 'pos' : 'dashboard';
  return (
    <Segmented
      ariaLabel="Cambiar de vista"
      tone={tone}
      value={active}
      onChange={(v) => navigate(v === 'pos' ? '/pos' : '/dashboard')}
      options={[
        { value: 'pos', label: 'POS' },
        { value: 'dashboard', label: 'Dashboard' },
      ]}
    />
  );
}

export function BrandHeader({ variant, branch, branches, onBranchChange }: Props) {
  const country = useStore((s) => s.country);
  const setCountry = useStore((s) => s.setCountry);
  const unseenCount = useStore((s) => s.unseenCount);
  const resetDemo = useStore((s) => s.resetDemo);

  if (variant === 'pos') {
    return (
      <header className="sticky top-0 z-30 border-b border-black/10 bg-hertz-yellow text-black">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <img src={brand.client.logoUrl} alt={brand.client.name} className="h-7 w-auto" />
            <span className="hidden h-6 w-px bg-black/20 sm:block" />
            <div className="flex items-center gap-2">
              <label htmlFor="branch" className="text-xs font-semibold uppercase tracking-wide text-black/60">
                Sucursal
              </label>
              <select
                id="branch"
                value={branch}
                onChange={(e) => onBranchChange?.(e.target.value)}
                className="rounded-lg border border-black/20 bg-white/80 px-2.5 py-1.5 text-sm font-semibold text-black outline-none focus:ring-2 focus:ring-black/30"
              >
                {branches?.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CountrySwitcher value={country} onChange={setCountry} tone="yellow" />
            <RoleSwitcher tone="yellow" />
          </div>
        </div>
      </header>
    );
  }

  // variant === 'dashboard'
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-3">
          <img src={brand.ini.logoUrl} alt={brand.ini.name} className="h-8 w-auto" />
          <span className="h-7 w-px bg-slate-200" />
          <div className="leading-tight">
            <h1 className="font-display text-lg font-bold text-slate-900">Preautorizaciones</h1>
            <p className="text-xs text-muted">Dashboard de gestión</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CountrySwitcher value={country} onChange={setCountry} tone="light" />

          <div className="relative" title={`${unseenCount} preautorización(es) nueva(s)`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <BellIcon />
            </span>
            {unseenCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white ring-2 ring-white">
                {unseenCount}
              </span>
            )}
          </div>

          <span className="hidden h-7 w-px bg-slate-200 md:block" />

          <div className="hidden items-center gap-2 md:flex">
            <span className="text-xs font-medium text-muted">Cliente:</span>
            <img src={brand.client.logoUrl} alt={brand.client.name} className="h-4 w-auto" />
          </div>

          <RoleSwitcher tone="light" />

          <button
            type="button"
            title="Reiniciar demo con datos frescos"
            onClick={() => {
              if (window.confirm('¿Reiniciar la demo con datos frescos? Se descartará el estado actual.')) {
                resetDemo();
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <ResetIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
