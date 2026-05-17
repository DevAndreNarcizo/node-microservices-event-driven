import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect, type Channel, type ChannelModel } from 'amqplib';
import { EVENT_PUBLISHER, type EventPublisher, type PublishOptions } from '../interfaces/event-publisher.interface';

@Injectable()
export class AmqpEventPublisher implements EventPublisher, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AmqpEventPublisher.name);
  private rabbit!: ChannelModel;
  private channel!: Channel;

  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
  }

  private async connectWithRetry(): Promise<void> {
    const url = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
    const maxRetries = 5;
    for (let i = 0; i < maxRetries; i++) {
      try {
        this.rabbit = await connect(url);
        this.channel = await this.rabbit.createChannel();
        await this.channel.assertExchange('orders', 'topic', { durable: true });
        this.logger.log(`Connected to RabbitMQ after ${i + 1} attempt(s)`);
        return;
      } catch (err) {
        if (i === maxRetries - 1) throw err;
        const delay = Math.pow(2, i) * 1000;
        this.logger.warn(`RabbitMQ connection attempt ${i + 1} failed, retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw new Error('Failed to connect to RabbitMQ');
  }

  async publish(exchange: string, routingKey: string, event: Record<string, unknown>, options?: PublishOptions): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    this.channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      {
        contentType: 'application/json',
        correlationId: options?.correlationId,
        persistent: true,
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.rabbit) {
      await this.rabbit.close();
    }
  }
}
