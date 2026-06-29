import { Segmented } from './Segmented';
import { brand, countryMeta } from '../config/brand';
import type { Country } from '../state/types';

export function CountrySwitcher({
  value,
  onChange,
  tone = 'light',
}: {
  value: Country;
  onChange: (c: Country) => void;
  tone?: 'light' | 'yellow';
}) {
  return (
    <Segmented
      ariaLabel="Seleccionar país"
      tone={tone}
      value={value}
      onChange={onChange}
      options={brand.countries.map((c) => ({
        value: c,
        label: (
          <span className="flex items-center gap-1.5">
            <span aria-hidden>{countryMeta[c].flag}</span>
            {c}
          </span>
        ),
      }))}
    />
  );
}
