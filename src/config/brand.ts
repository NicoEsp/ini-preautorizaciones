import type { Country } from '../state/types';

// ---------------------------------------------------------------------------
// PARAMETRIZACIÓN PARA TEMPLATE REUTILIZABLE
// Cambiar este archivo + seed.ts y el mismo mockup sirve para Avis, Movida,
// Localiza, o un hotel (cambiando vehicleLabel -> "Habitación", etc.).
// ---------------------------------------------------------------------------

export const brand = {
  // Cliente final (la rentadora). Marca primaria en el POS, co-brand en el Dashboard.
  client: {
    name: 'Hertz',
    logoUrl: '/hertz-logo.svg',
    primaryColor: '#FFD700',
    secondaryColor: '#000000',
  },

  // INI: el producto. Marca primaria en el Dashboard.
  ini: {
    name: 'INI',
    primaryColor: '#7637D0',
    logoUrl: '/ini-logo.svg',
  },

  countries: ['AR', 'CL'] as Country[],

  // Etiquetas de dominio (vertical rent-a-car). En un hotel: "Habitación" / "Reserva".
  vehicleLabel: 'Vehículo',
  vehicleLabelPlural: 'Vehículos',
  reservationLabel: 'Reserva',

  // Base del link de cobro simulado. NO resuelve, es texto mostrado.
  paymentLinkBase: 'https://pagos.ini.live/p/',
};

// Metadata por país: divisa, locale, bandera.
export const countryMeta = {
  AR: { code: 'AR', label: 'Argentina', currency: 'ARS', locale: 'es-AR', flag: '🇦🇷' },
  CL: { code: 'CL', label: 'Chile', currency: 'CLP', locale: 'es-CL', flag: '🇨🇱' },
} satisfies Record<Country, { code: Country; label: string; currency: string; locale: string; flag: string }>;

// Sucursales por país (para el selector del POS).
export const BRANCHES = {
  AR: ['Aeroparque', 'Ezeiza', 'Córdoba Capital', 'Mendoza'],
  CL: ['Aeropuerto SCL', 'Santiago Centro', 'Viña del Mar'],
} satisfies Record<Country, string[]>;
