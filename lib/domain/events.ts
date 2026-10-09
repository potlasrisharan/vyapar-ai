export type DomainEventType =
  | "DocumentUploaded"
  | "DocumentProcessed"
  | "InvoiceCreated"
  | "InvoicePaid"
  | "PaymentReceived"
  | "InvoiceOverdue"
  | "InventoryLow"
  | "ExpenseCreated"
  | "InsightGenerated"
  | "ActionCreated"
  | "ActionCompleted"
  | "NotificationDispatched"
  | "PaymentPromiseRecorded";


export interface DomainEvent<T = unknown> {
  id: string;
  type: DomainEventType;
  businessId: string;
  timestamp: string;
  payload: T;
}

export type DomainEventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void> | void;

export class DomainEventBus {
  private handlers = new Map<DomainEventType, Set<DomainEventHandler>>();

  subscribe<T>(type: DomainEventType, handler: DomainEventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    const set = this.handlers.get(type)!;
    set.add(handler as DomainEventHandler);
    return () => set.delete(handler as DomainEventHandler);
  }

  async emit<T>(event: Omit<DomainEvent<T>, "id" | "timestamp">): Promise<DomainEvent<T>> {
    const fullEvent: DomainEvent<T> = {
      ...event,
      id: `evt-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
    };

    const listeners = this.handlers.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          await listener(fullEvent);
        } catch (err) {
          console.error(`[EventBus] Error in listener for ${event.type}:`, err);
        }
      }
    }
    return fullEvent;
  }
}

export const eventBus = new DomainEventBus();
