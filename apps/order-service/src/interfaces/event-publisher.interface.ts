export interface PublishOptions {
  correlationId?: string;
}

export const EVENT_PUBLISHER = 'EVENT_PUBLISHER';

export interface EventPublisher {
  publish(exchange: string, routingKey: string, event: Record<string, unknown>, options?: PublishOptions): Promise<void>;
}
