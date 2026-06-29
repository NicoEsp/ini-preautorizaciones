import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Country, DataState } from './types';
import * as actions from './actions';
import { brand } from '../config/brand';
import { buildSeed, nextPreauthId } from '../config/seed';

// ---------------------------------------------------------------------------
// STORE — Zustand + persist (localStorage) + BroadcastChannel (sync entre tabs).
// El estado de DATOS (DataState) se persiste y se sincroniza. El estado de UI
// (country, pulsingIds, unseenCount) es por-tab: no se persiste ni se difunde.
// Ver secciones 4.4 y 2.
// ---------------------------------------------------------------------------

const CHANNEL_NAME = 'ini-hertz';
const STORAGE_KEY = 'ini-hertz-store';

const channel: BroadcastChannel | null =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

type BroadcastMessage =
  | { type: 'STATE_UPDATE'; payload: DataState }
  | { type: 'PREAUTH_CREATED'; id: string };

// --- Helpers impuros (viven acá, fuera de las acciones puras) ---

function nowIso(): string {
  return new Date().toISOString();
}

function uuid8(): string {
  const raw =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '')
      : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return raw.slice(0, 8);
}

// --- Tipos del store ---

type Store = DataState & {
  // UI state (no persistido / no difundido)
  country: Country;
  pulsingIds: string[];
  unseenCount: number;

  // selectores de UI
  setCountry: (c: Country) => void;
  markSeen: () => void;

  // acciones de negocio
  generatePreauth: (p: {
    customerId: string;
    vehicleId: string;
    amount: number;
    country: Country;
    rentalDays: number;
    reservationCode: string;
  }) => string;
  confirmPreauth: (p: { preauthId: string; finalAmount: number }) => void;
  modifyPreauth: (p: { preauthId: string; newAmount: number }) => void;
  voidPreauth: (p: { preauthId: string }) => void;
  createPaymentLink: (p: { preauthId: string; amount: number; concept: string }) => string;
  chargeWithToken: (p: { preauthId: string; amount: number; concept: string }) => Promise<void>;

  // demo helpers
  resetDemo: () => void;
};

const dataOf = (s: DataState): DataState => ({
  customers: s.customers,
  vehicles: s.vehicles,
  preauths: s.preauths,
  charges: s.charges,
});

function broadcast(msg: BroadcastMessage) {
  channel?.postMessage(msg);
}

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      // Aplica un nuevo DataState localmente y lo difunde a otros tabs.
      const commit = (next: DataState) => {
        set(next);
        broadcast({ type: 'STATE_UPDATE', payload: next });
      };

      return {
        ...buildSeed(Date.now()),

        country: 'AR',
        pulsingIds: [],
        unseenCount: 0,

        setCountry: (c) => set({ country: c }),
        markSeen: () => set({ unseenCount: 0 }),

        generatePreauth: (p) => {
          const id = nextPreauthId(get().preauths, p.country);
          const next = actions.generatePreauth(dataOf(get()), {
            id,
            customerId: p.customerId,
            vehicleId: p.vehicleId,
            amount: p.amount,
            country: p.country,
            createdAt: nowIso(),
            rentalDays: p.rentalDays,
            reservationCode: p.reservationCode,
          });
          commit(next);
          // Avisar específicamente para que el dashboard la anime (pulse 3s).
          broadcast({ type: 'PREAUTH_CREATED', id });
          markPulse(id); // por si el dashboard está en este mismo tab
          return id;
        },

        confirmPreauth: (p) => {
          const next = actions.confirmPreauth(dataOf(get()), {
            preauthId: p.preauthId,
            finalAmount: p.finalAmount,
            resolvedAt: nowIso(),
          });
          commit(next);
        },

        modifyPreauth: (p) => {
          const next = actions.modifyPreauth(dataOf(get()), {
            preauthId: p.preauthId,
            newAmount: p.newAmount,
            resolvedAt: nowIso(),
          });
          commit(next);
        },

        voidPreauth: (p) => {
          const next = actions.voidPreauth(dataOf(get()), {
            preauthId: p.preauthId,
            resolvedAt: nowIso(),
          });
          commit(next);
        },

        createPaymentLink: (p) => {
          const url = `${brand.paymentLinkBase}${uuid8()}`;
          const next = actions.createPaymentLink(dataOf(get()), {
            id: `CH-${uuid8()}`,
            preauthId: p.preauthId,
            amount: p.amount,
            concept: p.concept,
            createdAt: nowIso(),
            paymentLinkUrl: url,
          });
          commit(next);
          return url;
        },

        chargeWithToken: async (p) => {
          const chargeId = `CH-${uuid8()}`;
          const pending = actions.chargeWithToken(dataOf(get()), {
            id: chargeId,
            preauthId: p.preauthId,
            amount: p.amount,
            concept: p.concept,
            createdAt: nowIso(),
          });
          commit(pending);
          // Latencia simulada del cobro con token.
          await new Promise((r) => setTimeout(r, 800));
          const paid = actions.markChargePaid(dataOf(get()), {
            chargeId,
            paidAt: nowIso(),
          });
          commit(paid);
        },

        resetDemo: () => {
          const fresh = buildSeed(Date.now());
          set({ ...fresh, pulsingIds: [], unseenCount: 0 });
          broadcast({ type: 'STATE_UPDATE', payload: fresh });
        },
      };
    },
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Persistir SOLO la porción de datos (no el estado de UI por-tab).
      partialize: (s) => ({
        customers: s.customers,
        vehicles: s.vehicles,
        preauths: s.preauths,
        charges: s.charges,
      }),
    },
  ),
);

// ---------------------------------------------------------------------------
// Pulse: marca un id como "recién llegado" durante 3 segundos.
// ---------------------------------------------------------------------------
const pulseTimers = new Map<string, ReturnType<typeof setTimeout>>();

function markPulse(id: string) {
  useStore.setState((s) =>
    s.pulsingIds.includes(id) ? s : { pulsingIds: [...s.pulsingIds, id] },
  );
  const prev = pulseTimers.get(id);
  if (prev) clearTimeout(prev);
  const t = setTimeout(() => {
    pulseTimers.delete(id);
    useStore.setState((s) => ({ pulsingIds: s.pulsingIds.filter((x) => x !== id) }));
  }, 3000);
  pulseTimers.set(id, t);
}

// ---------------------------------------------------------------------------
// Sincronización entre tabs.
// ---------------------------------------------------------------------------
function applyRemoteData(data: DataState) {
  // setState directo: NO re-difunde (el broadcast solo ocurre en los métodos).
  useStore.setState({
    customers: data.customers,
    vehicles: data.vehicles,
    preauths: data.preauths,
    charges: data.charges,
  });
}

if (channel) {
  channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
    const msg = event.data;
    if (msg.type === 'STATE_UPDATE') {
      applyRemoteData(msg.payload);
    } else if (msg.type === 'PREAUTH_CREATED') {
      markPulse(msg.id);
      useStore.setState((s) => ({ unseenCount: s.unseenCount + 1 }));
    }
  };
} else if (typeof window !== 'undefined') {
  // Fallback para navegadores sin BroadcastChannel (Safari viejo, etc.):
  // el evento `storage` se dispara en los OTROS tabs cuando persist escribe.
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      const parsed = JSON.parse(e.newValue);
      const data = parsed?.state as DataState | undefined;
      if (data?.preauths) applyRemoteData(data);
    } catch {
      /* ignorar JSON inválido */
    }
  });
}
