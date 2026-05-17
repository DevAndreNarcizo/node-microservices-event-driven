import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './order.dto';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('/health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Get('/metrics')
  async metrics(): Promise<string> {
    return this.orderService.getMetrics();
  }

  @Post('/orders')
  async create(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    body: CreateOrderDto,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<{ id: string; correlationId: string }> {
    return this.orderService.createOrder(
      body.customerEmail,
      body.totalCents,
      correlationId,
    );
  }
}
