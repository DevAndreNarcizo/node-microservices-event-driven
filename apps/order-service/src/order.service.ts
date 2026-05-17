import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Registry, collectDefaultMetrics, Counter } from 'prom-client';
import { ORDER_CREATED_EVENT, type OrderCreatedEvent } from '@portfolio/contracts';
import { ORDER_REPOSITORY, type OrderRepository } from './interfaces/order-repository.interface';
import { EVENT_PUBLISHER, type EventPublisher } from './interfaces/event-publisher.interface';

const registry = new Registry();
collectDefaultMetrics({ register: registry });
const ordersCreated = new Counter({
  name: 'orders_created_total',
  help: 'Created orders',
  registers: [registry],
});

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: OrderRepository,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: EventPublisher,
  ) {}

  async getMetrics(): Promise<string> {
    return registry.metrics();
  }

  async createOrder(
    customerEmail: string,
    totalCents: number,
    headerCorrelationId?: string,
  ): Promise<{ id: string; correlationId: string }> {
    const orderId = randomUUID();
    const correlationId = headerCorrelationId ?? randomUUID();

    await this.orderRepository.save({
      orderId,
      customerEmail,
      totalCents,
      correlationId,
      createdAt: new Date(),
    });

    const event: OrderCreatedEvent = {
      eventId: randomUUID(),
      correlationId,
      orderId,
      customerEmail,
      totalCents,
      occurredAt: new Date().toISOString(),
    };

    await this.eventPublisher.publish(
      'orders',
      ORDER_CREATED_EVENT,
      event as unknown as Record<string, unknown>,
      { correlationId },
    );

    ordersCreated.inc();
    this.logger.log(
      JSON.stringify({
        level: 'info',
        message: 'order.created published',
        correlationId,
        orderId,
      }),
    );

    return { id: orderId, correlationId };
  }
}
