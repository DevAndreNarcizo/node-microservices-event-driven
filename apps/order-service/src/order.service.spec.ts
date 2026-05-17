import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { ORDER_REPOSITORY } from './interfaces/order-repository.interface';
import { EVENT_PUBLISHER } from './interfaces/event-publisher.interface';
import { ORDER_CREATED_EVENT } from '@portfolio/contracts';

describe('OrderService', () => {
  let service: OrderService;
  let mockRepository: { save: jest.Mock };
  let mockPublisher: { publish: jest.Mock };

  beforeEach(async () => {
    mockRepository = { save: jest.fn().mockResolvedValue(undefined) };
    mockPublisher = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: ORDER_REPOSITORY, useValue: mockRepository },
        { provide: EVENT_PUBLISHER, useValue: mockPublisher },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an order and publish the event', async () => {
    const result = await service.createOrder(
      'test@example.com',
      1000,
      'test-correlation-id',
    );

    expect(result).toBeDefined();
    expect(result.id).toBeTruthy();
    expect(result.correlationId).toBe('test-correlation-id');

    // Verify repository save
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: 'test@example.com',
        totalCents: 1000,
        correlationId: 'test-correlation-id',
      }),
    );

    // Verify event publisher
    expect(mockPublisher.publish).toHaveBeenCalledWith(
      'orders',
      ORDER_CREATED_EVENT,
      expect.objectContaining({
        correlationId: 'test-correlation-id',
        customerEmail: 'test@example.com',
        totalCents: 1000,
      }),
      expect.objectContaining({
        correlationId: 'test-correlation-id',
      }),
    );
  });

  it('should generate a correlationId if none provided', async () => {
    const result = await service.createOrder('test@example.com', 1000);
    expect(result.correlationId).toBeTruthy();
    expect(result.correlationId).not.toBe('test-correlation-id');
  });

  it('should create order successfully and log the event', async () => {
    const result = await service.createOrder('test@example.com', 500);

    expect(result.id).toBeTruthy();
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockPublisher.publish).toHaveBeenCalledTimes(1);
  });
});
