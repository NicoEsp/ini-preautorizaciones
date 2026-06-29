import { useEffect } from 'react';
import { useHashRoute } from './utils/hooks';
import { POS } from './views/POS';
import { Dashboard } from './views/Dashboard';

// Ruteo por hash: #/pos (sucursal) y #/dashboard (back office).
// Se abren en tabs separados del navegador para la demo en vivo.
export default function App() {
  const route = useHashRoute();

  useEffect(() => {
    if (!window.location.hash) window.location.hash = '/dashboard';
  }, []);

  if (route.startsWith('/pos')) return <POS />;
  return <Dashboard />;
}
