// Shapes del dominio. Ver sección 4.1 del Mockup Guidelines.

export type Country = 'AR' | 'CL';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'naranja' | 'other';

export type Customer = {
  id: string;
  fullName: string;
  documentId: string; // DNI o RUT
  email: string;
  phone: string;
  tokenizedCard?: {
    brand: CardBrand;
    last4: string;
    expirationMonth: number;
    expirationYear: number;
  };
};

export type Vehicle = {
  id: string;
  plate: string;
  model: string; // ej. "Toyota Corolla 2024"
  branch: string; // ej. "Aeroparque"
  country: Country;
};

// 'modified' se eliminó: "Confirmar el pago" cubre cualquier monto (>, =, <).
export type PreauthStatus = 'active' | 'confirmed' | 'voided';

// Reversa generada al anular: la red de tarjetas libera/devuelve el límite.
export type Reversal = {
  id: string; // ej. "REV-AR-00001234"
  processedAt: string; // ISO
  estimatedCreditDate: string; // ISO, processedAt + 2 días hábiles
};

export type Preauth = {
  id: string; // ej. "PA-AR-001234"
  customerId: string;
  vehicleId: string;
  amount: number; // monto original de la preauth (hold de garantía)
  country: Country;
  status: PreauthStatus;
  createdAt: string; // ISO
  resolvedAt?: string; // ISO, cuando se resolvió
  finalAmount?: number; // monto efectivamente cobrado (al confirmar)
  reversal?: Reversal; // seteado al anular
  metadata?: {
    rentalDays: number;
    reservationCode: string;
  };
};

export type ChargeMethod = 'payment_link' | 'tokenized_card';

export type ChargeStatus = 'pending' | 'paid' | 'failed';

export type AdditionalCharge = {
  id: string;
  customerId: string;
  parentPreauthId: string;
  amount: number;
  country: Country;
  concept: string; // ej. "Multa de tránsito 18/06"
  method: ChargeMethod;
  status: ChargeStatus;
  createdAt: string;
  paidAt?: string;
  paymentLinkUrl?: string; // simulada, ej. "https://pagos.ini.live/p/abc123"
};

/** Porción de datos que se persiste y se sincroniza entre tabs. */
export type DataState = {
  customers: Customer[];
  vehicles: Vehicle[];
  preauths: Preauth[];
  charges: AdditionalCharge[];
};
