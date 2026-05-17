import 'reflect-metadata';
import { Controller, Get, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { connect, type Channel, type ChannelModel, type ConsumeMessage } from 'amqplib';
import { MongoClient } from 'mongodb';
import { Registry, collectDefaultMetrics, Counter } from 'prom-client';
import { ORDER_CREATED_EVENT, type OrderCreatedEvent } from '@portfolio/contracts';

const registry = new Registry();
collectDefaultMetrics({ register: registry });
const notificationsSent = new Counter({ name: 'notifications_sent_total', help: 'Simulated notifications', registers: [registry] });

@Controller()
class NotificationController implements OnModuleInit, OnModuleDestroy {
  private mongo?: MongoClient;
  private rabbit?: ChannelModel;
  private channel?: Channel;

  async onModuleInit(): Promise<void> {
    this.mongo = new MongoClient(process.env.MONGO_URL ?? 'mongodb://localhost:27017/notifications');
    await this.mongo.connect();
    this.rabbit = await connect(process.env.RABBITMQ_URL ?? 'amqp://localhost:5672');
    this.channel = await this.rabbit.createChannel();
    await this.channel.assertExchange('orders', 'topic', { durable: true });
    await this.channel.assertQueue('notifications.order-created', { durable: true });
    await this.channel.bindQueue('notifications.order-created', 'orders', ORDER_CREATED_EVENT);
    await this.channel.consume('notifications.order-created', (message) => void this.handle(message));
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.rabbit?.close();
    await this.mongo?.close();
  }

  @Get('/health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Get('/metrics')
  async metrics(): Promise<string> {
    return registry.metrics();
  }

  private async handle(message: ConsumeMessage | null): Promise<void> {
    if (message === null) {
      return;
    }

    const event = JSON.parse(message.content.toString()) as OrderCreatedEvent;
    await this.mongo?.db().collection('notifications').insertOne({
      orderId: event.orderId,
      customerEmail: event.customerEmail,
      correlationId: event.correlationId,
      sentAt: new Date()
    });
    notificationsSent.inc();
    console.log(JSON.stringify({ level: 'info', message: 'notification simulated', correlationId: event.correlationId, orderId: event.orderId }));
    this.channel?.ack(message);
  }
}

@Module({ controllers: [NotificationController] })
class AppModule {}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3002);
}

void bootstrap();
