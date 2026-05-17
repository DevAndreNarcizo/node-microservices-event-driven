import 'reflect-metadata';
import { Body, Controller, Get, Headers, Module, OnModuleDestroy, OnModuleInit, Post } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'crypto';
import { connect, type Channel, type ChannelModel } from 'amqplib';
import { MongoClient } from 'mongodb';
import { Registry, collectDefaultMetrics, Counter } from 'prom-client';
import { ORDER_CREATED_EVENT, type OrderCreatedEvent } from '@portfolio/contracts';

interface CreateOrderRequest {
  customerEmail: string;
  totalCents: number;
}

const registry = new Registry();
collectDefaultMetrics({ register: registry });
const ordersCreated = new Counter({ name: 'orders_created_total', help: 'Created orders', registers: [registry] });

@Controller()
class OrderController implements OnModuleInit, OnModuleDestroy {
  private mongo?: MongoClient;
  private rabbit?: ChannelModel;
  private channel?: Channel;

  async onModuleInit(): Promise<void> {
    this.mongo = new MongoClient(process.env.MONGO_URL ?? 'mongodb://localhost:27017/orders');
    await this.mongo.connect();
    this.rabbit = await connect(process.env.RABBITMQ_URL ?? 'amqp://localhost:5672');
    this.channel = await this.rabbit.createChannel();
    await this.channel.assertExchange('orders', 'topic', { durable: true });
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

  @Post('/orders')
  async create(@Body() body: CreateOrderRequest, @Headers('x-correlation-id') headerCorrelationId?: string): Promise<{ id: string; correlationId: string }> {
    if (!body.customerEmail || body.totalCents <= 0) {
      throw new Error('Invalid order payload.');
    }

    const orderId = randomUUID();
    const correlationId = headerCorrelationId ?? randomUUID();
    await this.mongo?.db().collection('orders').insertOne({ orderId, ...body, correlationId, createdAt: new Date() });

    const event: OrderCreatedEvent = {
      eventId: randomUUID(),
      correlationId,
      orderId,
      customerEmail: body.customerEmail,
      totalCents: body.totalCents,
      occurredAt: new Date().toISOString()
    };

    this.channel?.publish('orders', ORDER_CREATED_EVENT, Buffer.from(JSON.stringify(event)), {
      contentType: 'application/json',
      correlationId,
      persistent: true
    });
    ordersCreated.inc();
    console.log(JSON.stringify({ level: 'info', message: 'order.created published', correlationId, orderId }));

    return { id: orderId, correlationId };
  }
}

@Module({ controllers: [OrderController] })
class AppModule {}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
}

void bootstrap();
