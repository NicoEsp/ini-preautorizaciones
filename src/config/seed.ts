import type {
  AdditionalCharge,
  Country,
  Customer,
  DataState,
  Preauth,
  Vehicle,
} from '../state/types';

// ---------------------------------------------------------------------------
// DATOS SEED — ~12 preauths para que el dashboard se vea "vivo".
// Los timestamps se calculan relativos a `now` en el primer load para que las
// antigüedades ("hace 2h") siempre arranquen frescas. Ver sección 4.2.
// ---------------------------------------------------------------------------

const H = 3_600_000; // 1 hora en ms
const D = 24 * H; // 1 día en ms

const customers: Customer[] = [
  {
    id: 'c1',
    fullName: 'María José González',
    documentId: '32.456.789',
    email: 'mj.gonzalez@gmail.com',
    phone: '+54 9 11 5234-8890',
    tokenizedCard: { brand: 'visa', last4: '4521', expirationMonth: 8, expirationYear: 2027 },
  },
  {
    id: 'c2',
    fullName: 'Martín Etcheverry',
    documentId: '28.991.245',
    email: 'metcheverry@outlook.com',
    phone: '+54 9 11 6781-2245',
  },
  {
    id: 'c3',
    fullName: 'Sofía Ramírez',
    documentId: '35.112.908',
    email: 'sofia.ramirez88@gmail.com',
    phone: '+54 9 351 412-6677',
  },
  {
    id: 'c4',
    fullName: 'Joaquín Fernández',
    documentId: '30.778.156',
    email: 'joaco.fernandez@gmail.com',
    phone: '+54 9 261 558-3321',
  },
  {
    id: 'c5',
    fullName: 'Camila Soto',
    documentId: '17.654.321-0',
    email: 'camila.soto@gmail.com',
    phone: '+56 9 8842 1190',
  },
  {
    id: 'c6',
    fullName: 'Felipe Muñoz',
    documentId: '15.998.114-2',
    email: 'fmunoz@gmail.com',
    phone: '+56 9 7731 4408',
    tokenizedCard: { brand: 'mastercard', last4: '7788', expirationMonth: 3, expirationYear: 2028 },
  },
  {
    id: 'c7',
    fullName: 'Valentina Rojas',
    documentId: '19.443.027-5',
    email: 'vale.rojas@gmail.com',
    phone: '+56 9 9120 5567',
  },
];

const vehicles: Vehicle[] = [
  // Argentina
  { id: 'v1', plate: 'AE 412 KL', model: 'Toyota Corolla 2024', branch: 'Aeroparque', country: 'AR' },
  { id: 'v2', plate: 'AC 087 RT', model: 'Toyota Etios 2023', branch: 'Ezeiza', country: 'AR' },
  { id: 'v3', plate: 'AD 556 MN', model: 'Ford EcoSport 2023', branch: 'Córdoba Capital', country: 'AR' },
  { id: 'v4', plate: 'AB 921 PQ', model: 'Chevrolet Onix 2024', branch: 'Mendoza', country: 'AR' },
  { id: 'v5', plate: 'AF 203 JS', model: 'Volkswagen Gol 2023', branch: 'Aeroparque', country: 'AR' },
  { id: 'v6', plate: 'AG 740 LV', model: 'Peugeot 208 2024', branch: 'Aeroparque', country: 'AR' },
  // Chile
  { id: 'v7', plate: 'JKLZ-72', model: 'Chevrolet Sail 2024', branch: 'Aeropuerto SCL', country: 'CL' },
  { id: 'v8', plate: 'RTFG-38', model: 'Hyundai Accent 2023', branch: 'Santiago Centro', country: 'CL' },
  { id: 'v9', plate: 'PSDV-15', model: 'Kia Rio 2024', branch: 'Viña del Mar', country: 'CL' },
  { id: 'v10', plate: 'BHKT-90', model: 'Nissan Versa 2023', branch: 'Aeropuerto SCL', country: 'CL' },
  { id: 'v11', plate: 'LMNQ-26', model: 'Suzuki Swift 2024', branch: 'Santiago Centro', country: 'CL' },
];

/** Construye el estado seed relativo a un instante `now` (ms epoch). */
export function buildSeed(now: number): DataState {
  const ago = (ms: number) => new Date(now - ms).toISOString();

  const preauths: Preauth[] = [
    // --- ACTIVAS (9) — AR/CL ~60/40, antigüedades de 2h a 5d ---
    {
      id: 'PA-AR-001247',
      customerId: 'c1',
      vehicleId: 'v1',
      amount: 520000,
      country: 'AR',
      status: 'active',
      createdAt: ago(2 * H),
      metadata: { rentalDays: 3, reservationCode: 'HZ-AR-7741' },
    },
    {
      id: 'PA-CL-000834',
      customerId: 'c5',
      vehicleId: 'v7',
      amount: 380000,
      country: 'CL',
      status: 'active',
      createdAt: ago(4 * H),
      metadata: { rentalDays: 3, reservationCode: 'HZ-CL-2208' },
    },
    {
      id: 'PA-AR-001246',
      customerId: 'c2',
      vehicleId: 'v2',
      amount: 340000,
      country: 'AR',
      status: 'active',
      createdAt: ago(7 * H),
      metadata: { rentalDays: 2, reservationCode: 'HZ-AR-7732' },
    },
    {
      id: 'PA-AR-001244',
      customerId: 'c3',
      vehicleId: 'v3',
      amount: 610000,
      country: 'AR',
      status: 'active',
      createdAt: ago(26 * H),
      metadata: { rentalDays: 4, reservationCode: 'HZ-AR-7715' },
    },
    {
      id: 'PA-CL-000832',
      customerId: 'c6',
      vehicleId: 'v8',
      amount: 290000,
      country: 'CL',
      status: 'active',
      createdAt: ago(28 * H),
      metadata: { rentalDays: 2, reservationCode: 'HZ-CL-2191' },
    },
    {
      // Devolución pendiente: creada hace 3d con 2 días de alquiler -> vencida.
      id: 'PA-AR-001241',
      customerId: 'c4',
      vehicleId: 'v4',
      amount: 450000,
      country: 'AR',
      status: 'active',
      createdAt: ago(3 * D),
      metadata: { rentalDays: 2, reservationCode: 'HZ-AR-7690' },
    },
    {
      id: 'PA-CL-000828',
      customerId: 'c7',
      vehicleId: 'v9',
      amount: 540000,
      country: 'CL',
      status: 'active',
      createdAt: ago(2 * D),
      metadata: { rentalDays: 5, reservationCode: 'HZ-CL-2177' },
    },
    {
      id: 'PA-AR-001238',
      customerId: 'c3',
      vehicleId: 'v5',
      amount: 280000,
      country: 'AR',
      status: 'active',
      createdAt: ago(4 * D),
      metadata: { rentalDays: 5, reservationCode: 'HZ-AR-7664' },
    },
    {
      id: 'PA-AR-001235',
      customerId: 'c2',
      vehicleId: 'v6',
      amount: 720000,
      country: 'AR',
      status: 'active',
      createdAt: ago(5 * D),
      metadata: { rentalDays: 7, reservationCode: 'HZ-AR-7651' },
    },

    // --- HISTORIAL (3) — confirmed / modified / voided ---
    {
      id: 'PA-AR-001230',
      customerId: 'c1', // María José tiene tarjeta tokenizada -> sirve para cobro adicional
      vehicleId: 'v1',
      amount: 400000,
      country: 'AR',
      status: 'confirmed',
      createdAt: ago(2 * D),
      resolvedAt: ago(20 * H),
      finalAmount: 400000,
      metadata: { rentalDays: 3, reservationCode: 'HZ-AR-7588' },
    },
    {
      id: 'PA-CL-000820',
      customerId: 'c7',
      vehicleId: 'v9',
      amount: 500000,
      country: 'CL',
      status: 'modified',
      createdAt: ago(3 * D),
      resolvedAt: ago(2 * D),
      finalAmount: 450000,
      metadata: { rentalDays: 4, reservationCode: 'HZ-CL-2120' },
    },
    {
      id: 'PA-AR-001225',
      customerId: 'c4',
      vehicleId: 'v4',
      amount: 350000,
      country: 'AR',
      status: 'voided',
      createdAt: ago(4 * D),
      resolvedAt: ago(3 * D),
      metadata: { rentalDays: 2, reservationCode: 'HZ-AR-7501' },
    },
  ];

  // Un cobro adicional histórico (pagado) para que la pestaña Cobros no arranque vacía.
  const charges: AdditionalCharge[] = [
    {
      id: 'CH-seed-01',
      customerId: 'c1',
      parentPreauthId: 'PA-AR-001230',
      amount: 8500,
      country: 'AR',
      concept: 'Peaje pendiente AU Ricchieri',
      method: 'payment_link',
      status: 'paid',
      createdAt: ago(18 * H),
      paidAt: ago(17 * H),
      paymentLinkUrl: 'https://pagos.ini.live/p/a3f9k2qd',
    },
  ];

  return { customers, vehicles, preauths, charges };
}

/** Calcula el próximo ID de preauth para un país, ej. PA-AR-001248. */
export function nextPreauthId(preauths: Preauth[], country: Country): string {
  const prefix = `PA-${country}-`;
  const max = preauths
    .filter((p) => p.id.startsWith(prefix))
    .map((p) => parseInt(p.id.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(max + 1).padStart(6, '0')}`;
}
