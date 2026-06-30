import { useEffect } from 'react';
import { useHashRoute } from './utils/hooks';
import { POS } from './views/POS';
import { Terminal } from './views/Terminal';
import { Dashboard } from './views/Dashboard';

// Ruteo por hash:
//   #/pos        -> Checkout web (canal online, hertz.com.ar)
//   #/terminal   -> Terminal de sucursal (canal físico, estilo Clover)
//   #/dashboard  -> Back office (gestión)
export default function App() {
  const route = useHashRoute();

  useEffect(() => {
    if (!window.location.hash) window.location.hash = '/dashboard';
  }, []);

  if (route.startsWith('/pos')) return <POS />;
  if (route.startsWith('/terminal')) return <Terminal />;
  return <Dashboard />;
}
