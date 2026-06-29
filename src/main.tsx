import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Nota: deliberadamente sin <React.StrictMode> para evitar el doble montaje
// de efectos en dev, que duplicaría timers/animaciones durante la demo en vivo.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
