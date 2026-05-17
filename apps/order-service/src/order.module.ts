import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { MongoOrderRepository } from './repositories/mongo-order.repository';
import { AmqpEventPublisher } from './publishers/amqp-event.publisher';
import { ORDER_REPOSITORY } from './interfaces/order-repository.interface';
import { EVENT_PUBLISHER } from './interfaces/event-publisher.interface';

@Module({
  controllers: [OrderController],
  providers: [
    OrderService,
    {
      provide: ORDER_REPOSITORY,
      useClass: MongoOrderRepository,
    },
    {
      provide: EVENT_PUBLISHER,
      useClass: AmqpEventPublisher,
    },
  ],
})
export class AppModule {}
