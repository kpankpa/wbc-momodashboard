import "server-only";

export type PaymentLiveEvent = {
  type: "transaction";
  id: string;
  externalId: string;
  amount: string;
  currency: string;
  status: string;
  direction: "INCOMING" | "OUTGOING";
  counterpartyName: string | null;
  created: boolean;
  at: string;
};

type Listener = (event: PaymentLiveEvent) => void;

const globalForBus = globalThis as unknown as {
  __momoLiveBus?: Set<Listener>;
};

function getListeners() {
  if (!globalForBus.__momoLiveBus) {
    globalForBus.__momoLiveBus = new Set();
  }
  return globalForBus.__momoLiveBus;
}

export function publishPaymentEvent(event: PaymentLiveEvent) {
  for (const listener of getListeners()) {
    try {
      listener(event);
    } catch (error) {
      console.error("[live] listener failed", error);
    }
  }
}

export function subscribePaymentEvents(listener: Listener) {
  const listeners = getListeners();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
