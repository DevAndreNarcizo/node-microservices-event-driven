import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { ORDER_REPOSITORY, type OrderRepository, type SaveOrderData } from '../interfaces/order-repository.interface';

@Injectable()
export class MongoOrderRepository implements OrderRepository, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongoOrderRepository.name);
  private client!: MongoClient;

  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
  }

  private async connectWithRetry(): Promise<void> {
    const url = process.env.MONGO_URL ?? 'mongodb://localhost:27017/orders';
    const maxRetries = 5;
    for (let i = 0; i < maxRetries; i++) {
      try {
        this.client = new MongoClient(url);
        await this.client.connect();
        this.logger.log(`Connected to MongoDB after ${i + 1} attempt(s)`);
        return;
      } catch (err) {
        if (i === maxRetries - 1) throw err;
        const delay = Math.pow(2, i) * 1000;
        this.logger.warn(`MongoDB connection attempt ${i + 1} failed, retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw new Error('Failed to connect to MongoDB');
  }

  async save(order: SaveOrderData): Promise<void> {
    if (!this.client) {
      throw new Error('MongoDB not initialized');
    }
    await this.client.db().collection('orders').insertOne(order);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.close();
    }
  }
}
