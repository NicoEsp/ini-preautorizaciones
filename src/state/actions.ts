import type { AdditionalCharge, Customer, DataState, Preauth, Reversal } from './types';

// ---------------------------------------------------------------------------
// FUNCIONES PURAS — reciben el estado de datos + parámetros y devuelven el
// nuevo estado. Sin side effects: el broadcast, el localStorage, la generación
// de IDs/timestamps y la latencia simulada viven en el store. Ver sección 4.3.
//
// Por eso los IDs, timestamps y URLs entran como parámetros: así estas
// funciones son verdaderamente puras (mismas entradas -> misma salida).
// ---------------------------------------------------------------------------

function findPreauth(state: DataState, id: string): Preauth {
  const p = state.preauths.find((x) => x.id === id);
  if (!p) throw new Error(`Preautorización ${id} no encontrada`);
  return p;
}

export function generatePreauth(
  state: DataState,
  params: {
    id: string;
    customerId: string;
    vehicleId: string;
    amount: number;
    country: Preauth['country'];
    createdAt: string;
    rentalDays: number;
    reservationCode: string;
  },
): DataState {
  const preauth: Preauth = {
    id: params.id,
    customerId: params.customerId,
    vehicleId: params.vehicleId,
    amount: params.amount,
    country: params.country,
    status: 'active',
    createdAt: params.createdAt,
    metadata: { rentalDays: params.rentalDays, reservationCode: params.reservationCode },
  };
  return { ...state, preauths: [preauth, ...state.preauths] };
}

/**
 * "Confirmar el pago" (feedback de Marcos): cobra cualquier monto positivo.
 * Puede ser mayor, igual o menor al bloqueado — no hay validación de rango.
 * `finalAmount` es la única fuente de verdad de cuánto se cobró.
 */
export function confirmPreauth(
  state: DataState,
  params: { preauthId: string; finalAmount: number; resolvedAt: string },
): DataState {
  const p = findPreauth(state, params.preauthId);
  if (p.status !== 'active') {
    throw new Error('La preautorización ya fue resuelta');
  }
  if (params.finalAmount <= 0) {
    throw new Error('El monto a cobrar debe ser mayor a 0');
  }
  return {
    ...state,
    preauths: state.preauths.map((x) =>
      x.id === params.preauthId
        ? { ...x, status: 'confirmed', finalAmount: params.finalAmount, resolvedAt: params.resolvedAt }
        : x,
    ),
  };
}

/** Anular dispara una reversa hacia la tarjeta (libera el límite del cliente). */
export function voidPreauth(
  state: DataState,
  params: { preauthId: string; resolvedAt: string; reversal: Reversal },
): DataState {
  const p = findPreauth(state, params.preauthId);
  if (p.status !== 'active') {
    throw new Error('Solo se pueden anular preautorizaciones activas');
  }
  return {
    ...state,
    preauths: state.preauths.map((x) =>
      x.id === params.preauthId
        ? { ...x, status: 'voided', resolvedAt: params.resolvedAt, reversal: params.reversal }
        : x,
    ),
  };
}

export function createPaymentLink(
  state: DataState,
  params: {
    id: string;
    preauthId: string;
    amount: number;
    concept: string;
    createdAt: string;
    paymentLinkUrl: string;
  },
): DataState {
  const p = findPreauth(state, params.preauthId);
  if (p.status === 'voided') {
    throw new Error('No se puede cobrar sobre una preautorización anulada');
  }
  const charge: AdditionalCharge = {
    id: params.id,
    customerId: p.customerId,
    parentPreauthId: params.preauthId,
    amount: params.amount,
    country: p.country,
    concept: params.concept,
    method: 'payment_link',
    status: 'pending',
    createdAt: params.createdAt,
    paymentLinkUrl: params.paymentLinkUrl,
  };
  return { ...state, charges: [charge, ...state.charges] };
}

export function chargeWithToken(
  state: DataState,
  params: { id: string; preauthId: string; amount: number; concept: string; createdAt: string },
): DataState {
  const p = findPreauth(state, params.preauthId);
  if (p.status === 'voided') {
    throw new Error('No se puede cobrar sobre una preautorización anulada');
  }
  const customer = state.customers.find((c) => c.id === p.customerId);
  if (!customer?.tokenizedCard) {
    throw new Error('El cliente no tiene tarjeta tokenizada');
  }
  const charge: AdditionalCharge = {
    id: params.id,
    customerId: p.customerId,
    parentPreauthId: params.preauthId,
    amount: params.amount,
    country: p.country,
    concept: params.concept,
    method: 'tokenized_card',
    status: 'pending',
    createdAt: params.createdAt,
  };
  return { ...state, charges: [charge, ...state.charges] };
}

/** Marca un cobro como pagado (lo usa el store tras la latencia simulada). */
export function markChargePaid(
  state: DataState,
  params: { chargeId: string; paidAt: string },
): DataState {
  return {
    ...state,
    charges: state.charges.map((c) =>
      c.id === params.chargeId ? { ...c, status: 'paid', paidAt: params.paidAt } : c,
    ),
  };
}

/** Alta de cliente (lo usa el Terminal cuando es un cliente nuevo). */
export function addCustomer(state: DataState, customer: Customer): DataState {
  return { ...state, customers: [...state.customers, customer] };
}

/** Guarda/actualiza la tarjeta tokenizada de un cliente existente. */
export function setCustomerCard(
  state: DataState,
  params: { customerId: string; card: Customer['tokenizedCard'] },
): DataState {
  return {
    ...state,
    customers: state.customers.map((c) =>
      c.id === params.customerId ? { ...c, tokenizedCard: params.card } : c,
    ),
  };
}
