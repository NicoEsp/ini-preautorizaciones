import { useEffect, useState } from 'react';

/**
 * Devuelve un timestamp que se actualiza cada `intervalMs` (default 30s).
 * Mantiene vivas las antigüedades ("hace 2 min") sin congelar la demo.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** Router por hash mínimo. Devuelve el path actual, ej. "/pos" o "/dashboard". */
export function useHashRoute(): string {
  const read = () => window.location.hash.replace(/^#/, '') || '/dashboard';
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(path: string) {
  window.location.hash = path;
}
