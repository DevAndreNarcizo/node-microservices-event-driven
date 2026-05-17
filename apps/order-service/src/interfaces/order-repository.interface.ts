export interface SaveOrderData {
  orderId: string;
  customerEmail: string;
  totalCents: number;
  correlationId: string;
  createdAt: Date;
}

export const ORDER_REPOSITORY = 'ORDER_REPOSITORY';

export interface OrderRepository {
  save(order: SaveOrderData): Promise<void>;
}
