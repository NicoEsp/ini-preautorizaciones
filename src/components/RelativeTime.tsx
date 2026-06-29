import type { Country } from '../state/types';
import { formatAge, formatDateTime } from '../utils/format';
import { useNow } from '../utils/hooks';

/** Antigüedad relativa que se refresca sola cada 30s. Tooltip con fecha completa. */
export function RelativeTime({ iso, country }: { iso: string; country: Country }) {
  const now = useNow(30_000);
  return (
    <span title={formatDateTime(iso, country)} className="tabular-nums">
      {formatAge(iso, now)}
    </span>
  );
}
