export interface OrderCreatedEvent {
  eventId: string;
  correlationId: string;
  orderId: string;
  customerEmail: string;
  totalCents: number;
  occurredAt: string;
}

export const ORDER_CREATED_EVENT = 'order.created';
